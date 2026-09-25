"""无头浏览器截图工具（本机专用）

用途：Step 1 验收需要"与设计稿比对"，本工具让你能在不打开浏览器的情况下
对页面截图并保存为 PNG，然后用 Read 工具查看。

  用法：
      python tools/screenshot.py <url> <输出名> [等待毫秒] [滚动位置px] [视口宽] [视口高]

  示例：
      python tools/screenshot.py http://localhost:4173/ home 6000
      python tools/screenshot.py "http://localhost:4173/#/hall" hall 9000
      python tools/screenshot.py http://localhost:4173/ home_axis 6000 1600   # 滚到 1600px 再拍
      python tools/screenshot.py http://localhost:4173/ home_375 6000 0 375 812   # 375 移动端视口

  说明：第 4 个参数用于**滚动页**（首页 .axis 是 300vh 行程，不滚动只能看到第一屏）。
        第 5/6 个参数（宽/高）可选，默认 1440×900；宽 ≤500 自动按移动端视口渲染。

产物：保存到 .workbuddy/shots/<输出名>.png，并打印控制台错误。

注意：
- 必须先启动 preview 服务（demo 目录下 npm run preview，或双击 启动预览.bat）
- 本机 Edge 的 --headless --screenshot 参数无效（静默失败），必须走 CDP
- 纯标准库实现，无需 pip install
"""
import base64
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request
from urllib.parse import urlparse

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 项目根
OUT_DIR = os.path.join(ROOT, ".workbuddy", "shots")
PROFILE = os.path.join(ROOT, ".workbuddy", "edge-profile")


class WS:
    """极简 WebSocket 客户端（CDP 够用）"""

    def __init__(self, url):
        u = urlparse(url)
        self.sock = socket.create_connection((u.hostname, u.port), timeout=30)
        key = base64.b64encode(os.urandom(16)).decode()
        path = u.path + (("?" + u.query) if u.query else "")
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {u.hostname}:{u.port}\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        if b"101" not in buf.split(b"\r\n")[0]:
            raise RuntimeError("握手失败: " + buf[:200].decode(errors="replace"))

    def send(self, obj):
        data = json.dumps(obj).encode()
        hdr = bytearray([0x81])
        n = len(data)
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126)
            hdr += n.to_bytes(2, "big")
        else:
            hdr.append(0x80 | 127)
            hdr += n.to_bytes(8, "big")
        mask = os.urandom(4)
        hdr += mask
        self.sock.sendall(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _rd(self, n):
        b = b""
        while len(b) < n:
            c = self.sock.recv(n - len(b))
            if not c:
                raise EOFError
            b += c
        return b

    def recv(self):
        h = self._rd(2)
        ln = h[1] & 0x7F
        if ln == 126:
            ln = int.from_bytes(self._rd(2), "big")
        elif ln == 127:
            ln = int.from_bytes(self._rd(8), "big")
        payload = self._rd(ln)
        return json.loads(payload.decode("utf-8", errors="replace")) if payload else {}

    def call(self, mid, method, params=None, timeout=40):
        self.send({"id": mid, "method": method, "params": params or {}})
        t0 = time.time()
        while time.time() - t0 < timeout:
            msg = self.recv()
            if msg.get("id") == mid:
                return msg
        raise TimeoutError(method)

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass


def find_port(start=9333):
    for p in range(start, start + 40):
        s = socket.socket()
        try:
            s.bind(("127.0.0.1", p))
            s.close()
            return p
        except OSError:
            s.close()
    raise RuntimeError("无可用端口")


def wait_devtools(port, timeout=45):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=2) as r:
                return json.load(r)
        except Exception:
            time.sleep(0.4)
    return None


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    url = sys.argv[1]
    name = sys.argv[2]
    wait_ms = int(sys.argv[3]) if len(sys.argv) > 3 else 6000
    scroll_y = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    vw = int(sys.argv[5]) if len(sys.argv) > 5 else 1440      # 视口宽（可选，默认 1440）
    vh = int(sys.argv[6]) if len(sys.argv) > 6 else 900       # 视口高（可选，默认 900）
    is_mobile = vw <= 500                                     # ≤500 视为移动端视口

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PROFILE, exist_ok=True)
    port = find_port()

    proc = subprocess.Popen([
        EDGE, "--headless=new", "--no-first-run", "--no-default-browser-check",
        f"--remote-debugging-port={port}", f"--user-data-dir={PROFILE}",
        "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader",
        f"--window-size={vw},{vh}", "--hide-scrollbars", "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        ver = wait_devtools(port)
        if not ver:
            print("FAIL: DevTools 端口不可达（上一个 Edge 可能还没退出，稍等 2 秒重试）")
            return 1
        print("browser:", ver.get("Browser"))

        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/json/new?{url}", method="PUT")
        with urllib.request.urlopen(req, timeout=15) as r:
            tab = json.load(r)

        ws = WS(tab["webSocketDebuggerUrl"])
        mid = 1
        ws.call(mid, "Runtime.enable"); mid += 1
        ws.call(mid, "Page.enable"); mid += 1
        ws.call(mid, "Emulation.setDeviceMetricsOverride",
                {"width": vw, "height": vh, "deviceScaleFactor": 1,
                 "mobile": is_mobile}); mid += 1
        ws.call(mid, "Page.navigate", {"url": url}); mid += 1
        time.sleep(wait_ms / 1000)

        if scroll_y:
            ws.call(mid, "Runtime.evaluate",
                    {"expression": f"window.scrollTo(0, {scroll_y}); 'ok'"})
            time.sleep(1.2)          # 等滚动驱动的 CSS 过渡落定

        shot = ws.call(mid, "Page.captureScreenshot", {"format": "png"}); mid += 1
        data = shot.get("result", {}).get("data")
        if not data:
            print("FAIL 截图:", json.dumps(shot)[:400])
            return 1
        out = os.path.join(OUT_DIR, name + ".png")
        with open(out, "wb") as f:
            f.write(base64.b64decode(data))
        print("saved:", out, os.path.getsize(out), "bytes")

        ws.close()
        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except Exception:
            proc.kill()


if __name__ == "__main__":
    sys.exit(main())
