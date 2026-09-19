#!/usr/bin/env python3
"""《辽迹》Journey 自动验收（仅 Python 标准库 + 本机 Chrome CDP）。

用法：
    # 先在 demo/ 运行 npm run build && npm run preview -- --host 127.0.0.1
    python3 tools/verify_journey.py http://127.0.0.1:4173
    python3 tools/verify_journey.py http://127.0.0.1:4173 --screenshots

覆盖：
  1. 基础结构 —— 单 Canvas、无横向滚动、控制台零错误
  2. Journey —— 八个进度点的相机连续性、章节推导、渲染预算
  3. 三个 Hero —— 进入 / 退出 Explore 闭环、原位返回精度
  4. 取景 —— 三个视口下 Hero 包围盒必须完整入镜（把构图变成读数）
  5. 旧路由 —— #/ #/hall #/cast #/entrance #/history 冒烟，确认无回归

注意：本机沙箱内 Chrome 自带 sandbox 无法初始化（Operation not permitted），
GPU 进程会随之退出导致 CDP socket 立刻断开，因此必须带 --no-sandbox。
"""

import base64
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

# 三个验收视口。只有 1440x900 出全套九张人工验收截图；竖屏另出两张对比图。
VIEWPORTS = [
    {
        "name": "desktop-1440x900", "width": 1440, "height": 900, "mobile": False,
        "shotStops": {
            0.00: "00-intro", 0.15: "01-entrance", 0.32: "02-shenyang-lathe",
            0.62: "04-anshan-furnace", 0.85: "06-fushun-mine", 0.98: "08-finale",
        },
        "exhibitShots": {
            "lathe": "03-lathe-explore",
            "furnace": "05-furnace-explore",
            "mine": "07-mine-explore",
        },
    },
    {"name": "desktop-1280x720", "width": 1280, "height": 720, "mobile": False,
     "shotStops": {}, "exhibitShots": {}},
    {"name": "portrait-390x844", "width": 390, "height": 844, "mobile": True,
     "shotStops": {0.32: "portrait-390x844-shenyang"},
     "exhibitShots": {"lathe": "portrait-390x844-lathe-explore"}},
]

LEGACY_ROUTES = [
    ("", "首页"),
    ("hall", "铸造馆"),
    ("cast", "亲手浇铸"),
    ("entrance", "序厅"),
    ("history", "通史馆"),
]

CHAPTER_STOPS = [
    (0.00, None),
    (0.15, None),
    (0.32, "shenyang"),
    (0.50, "anshan"),
    (0.62, "anshan"),
    (0.75, None),
    (0.85, "fushun"),
    (0.98, "finale"),
]

# 展品激活区间中心 —— 取景断言在这里采样。
EXHIBIT_STOPS = [
    ("lathe", 0.32),
    ("furnace", 0.615),
    ("mine", 0.85),
]


class WS:
    def __init__(self, url):
        parsed = urllib.parse.urlparse(url)
        self.sock = socket.create_connection((parsed.hostname, parsed.port), timeout=30)
        key = base64.b64encode(os.urandom(16)).decode()
        path = parsed.path + (("?" + parsed.query) if parsed.query else "")
        request = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {parsed.hostname}:{parsed.port}\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(request.encode())
        response = b""
        while b"\r\n\r\n" not in response:
            response += self.sock.recv(4096)
        if b"101" not in response.split(b"\r\n", 1)[0]:
            raise RuntimeError("CDP WebSocket handshake failed")
        self.next_id = 1

    def send(self, payload):
        data = json.dumps(payload).encode()
        header = bytearray([0x81])
        size = len(data)
        if size < 126:
            header.append(0x80 | size)
        elif size < 65536:
            header.append(0x80 | 126)
            header += size.to_bytes(2, "big")
        else:
            header.append(0x80 | 127)
            header += size.to_bytes(8, "big")
        mask = os.urandom(4)
        header += mask
        self.sock.sendall(bytes(header) + bytes(byte ^ mask[index % 4] for index, byte in enumerate(data)))

    def read_exact(self, count):
        result = b""
        while len(result) < count:
            chunk = self.sock.recv(count - len(result))
            if not chunk:
                raise EOFError("CDP socket closed")
            result += chunk
        return result

    def receive(self):
        first = self.read_exact(2)
        size = first[1] & 0x7F
        if size == 126:
            size = int.from_bytes(self.read_exact(2), "big")
        elif size == 127:
            size = int.from_bytes(self.read_exact(8), "big")
        payload = self.read_exact(size)
        return json.loads(payload.decode(errors="replace")) if payload else {}

    def call(self, method, params=None, timeout=45):
        message_id = self.next_id
        self.next_id += 1
        self.send({"id": message_id, "method": method, "params": params or {}})
        started = time.time()
        while time.time() - started < timeout:
            message = self.receive()
            if message.get("id") == message_id:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message.get("result", {})
        raise TimeoutError(method)

    def close(self):
        self.sock.close()


def find_chrome():
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    raise RuntimeError("Chrome/Edge executable not found")


def free_port():
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def wait_json(url, timeout=35):
    started = time.time()
    while time.time() - started < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                return json.load(response)
        except Exception:
            time.sleep(.25)
    raise TimeoutError(url)


def evaluate(ws, expression, await_promise=False):
    result = ws.call("Runtime.evaluate", {
        "expression": expression,
        "returnByValue": True,
        "awaitPromise": await_promise,
        "userGesture": True,
    })
    if result.get("exceptionDetails"):
        raise RuntimeError(result["exceptionDetails"].get("text", "Runtime.evaluate failed"))
    return result.get("result", {}).get("value")


def wait_until(ws, expression, timeout=20):
    started = time.time()
    while time.time() - started < timeout:
        if evaluate(ws, expression):
            return True
        time.sleep(.1)
    raise TimeoutError(expression)


def run_journey_suite(ws, viewport, check, screenshot):
    """单视口下的完整 Journey 验收。"""
    name = viewport["name"]
    structure = evaluate(ws, (
        "({canvas:document.querySelectorAll('.liaoji-canvas-host canvas').length,"
        "route:location.hash,"
        "horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth})"
    ))
    check(structure["route"] == "#/journey", f"[{name}] #/journey loaded")
    check(structure["canvas"] == 1, f"[{name}] single canvas")
    check(structure["horizontal"] == 0, f"[{name}] no horizontal scroll")

    last_position = None
    for progress, chapter in CHAPTER_STOPS:
        evaluate(ws, f"__liaoji.setProgress({progress})")
        time.sleep(.12)
        sample = evaluate(ws, "({state:__liaoji.state(), camera:__liaoji.camera()})")
        check(abs(sample["state"]["visualProgress"] - progress) <= .0015, f"[{name}] progress {progress:.2f} synced")
        check(sample["state"]["chapter"] == chapter, f"[{name}] chapter at {progress:.2f}")
        position = sample["camera"]["position"]
        if last_position is not None:
            distance = sum((a - b) ** 2 for a, b in zip(position, last_position)) ** .5
            check(distance > .05, f"[{name}] camera moves at {progress:.2f}")
        last_position = position
        screenshot(viewport["shotStops"].get(progress))

    budget = {"calls": 0, "triangles": 0}
    for stop in (0.32, 0.62):
        evaluate(ws, f"__liaoji.setProgress({stop})")
        time.sleep(.12)
        info = evaluate(ws, "__liaoji.info()")
        budget["calls"] = max(budget["calls"], info["calls"])
        budget["triangles"] = max(budget["triangles"], info["triangles"])
    print(f"  budget[{name}] draw calls {budget['calls']} / triangles {budget['triangles']}")
    check(budget["calls"] < 80, f"[{name}] draw calls {budget['calls']} < 80")
    check(budget["triangles"] < 50000, f"[{name}] triangles {budget['triangles']} < 50000")

    tolerance = 8 if viewport["width"] >= 1000 else 4
    for exhibit_id, progress in EXHIBIT_STOPS:
        evaluate(ws, f"__liaoji.setProgress({progress})")
        time.sleep(.15)
        before = evaluate(ws, "({progress:__liaoji.state().rawProgress, scrollY:window.scrollY})")
        check(evaluate(ws, "__liaoji.state().discoverableExhibitId") == exhibit_id,
              f"[{name}] {exhibit_id} discoverable")

        frame = evaluate(ws, f"__liaoji.heroFrame('{exhibit_id}')")
        if not frame:
            check(False, f"[{name}] {exhibit_id} heroFrame available")
        else:
            print(f"  frame[{name}] {exhibit_id} "
                  f"L{frame['left']:.0f} T{frame['top']:.0f} R{frame['right']:.0f} B{frame['bottom']:.0f} "
                  f"of {frame['width']}x{frame['height']} coverage {frame['coverage']:.3f}")
            inside = (frame["left"] >= -tolerance and frame["top"] >= -tolerance
                      and frame["right"] <= frame["width"] + tolerance
                      and frame["bottom"] <= frame["height"] + tolerance)
            check(inside, f"[{name}] {exhibit_id} hero fully framed")
            check(frame["coverage"] > .03, f"[{name}] {exhibit_id} hero readable (coverage > 0.03)")

        entered = evaluate(ws, f"__liaoji.enterExhibit('{exhibit_id}')", True)
        check(entered is True and evaluate(ws, "__liaoji.state().mode") == "explore",
              f"[{name}] {exhibit_id} enters explore")
        screenshot(viewport["exhibitShots"].get(exhibit_id))
        exited = evaluate(ws, "__liaoji.exitExplore()", True)
        after = evaluate(ws, "({state:__liaoji.state(), scrollY:window.scrollY})")
        check(exited is True and after["state"]["mode"] == "journey", f"[{name}] {exhibit_id} exits explore")
        check(abs(after["state"]["rawProgress"] - before["progress"]) <= .001,
              f"[{name}] {exhibit_id} progress restored")
        check(abs(after["scrollY"] - before["scrollY"]) <= 2, f"[{name}] {exhibit_id} scroll restored")

    errors = evaluate(ws, "window.__journeyErrors || ['error capture missing']") or []
    if errors:
        print(f"  console[{name}]:", json.dumps(errors, ensure_ascii=False))
    check(not errors, f"[{name}] console clean")


def run_legacy_smoke(ws, base_url, check):
    """旧五条路由冒烟：确认 Journey 原型没有把它们带坏。"""
    for key, label in LEGACY_ROUTES:
        evaluate(ws, "window.__journeyErrors = []")
        ws.call("Page.navigate", {"url": f"{base_url}/?debug=1#/{key}"})
        time.sleep(1.4)
        expected_hash = f"#/{key}" if key else "#/"
        result = evaluate(ws, (
            "({hash:location.hash,"
            "root:document.getElementById('app')?.children.length||0,"
            "horizontal:document.documentElement.scrollWidth-document.documentElement.clientWidth,"
            "errors:window.__journeyErrors||[]})"
        ))
        check(result["hash"] == expected_hash, f"[legacy] {label} route {expected_hash}")
        check(result["root"] > 0, f"[legacy] {label} rendered")
        check(result["horizontal"] == 0, f"[legacy] {label} no horizontal scroll")
        if result["errors"]:
            print(f"  console[legacy {label}]:", json.dumps(result["errors"], ensure_ascii=False))
        check(not result["errors"], f"[legacy] {label} console clean")


def main():
    args = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    capture_shots = "--screenshots" in sys.argv
    base_url = (args[0] if args else "http://127.0.0.1:4173").rstrip("/")
    port = free_port()
    profile = tempfile.mkdtemp(prefix="liaoji-cdp-")
    process = subprocess.Popen([
        find_chrome(),
        "--headless=new",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        # 本机沙箱内 Chrome 自带 sandbox 无法初始化，必须显式关闭。
        "--no-sandbox",
        "--disable-gpu-sandbox",
        "--disable-dev-shm-usage",
        "--enable-webgl",
        "--enable-unsafe-swiftshader",
        "--use-angle=swiftshader",
        "--window-size=1440,900",
        f"--remote-debugging-port={port}",
        f"--user-data-dir={profile}",
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws = None
    failures = []
    shots_dir = os.path.join(ROOT, ".workbuddy", "shots", "journey")

    def check(condition, message):
        if condition:
            print(f"PASS {message}")
        else:
            print(f"FAIL {message}")
            failures.append(message)

    def screenshot(name):
        if not capture_shots or not name:
            return
        os.makedirs(shots_dir, exist_ok=True)
        result = ws.call("Page.captureScreenshot", {"format": "png", "fromSurface": True})
        path = os.path.join(shots_dir, name + ".png")
        with open(path, "wb") as output:
            output.write(base64.b64decode(result["data"]))
        print(f"SHOT {path}")

    try:
        wait_json(f"http://127.0.0.1:{port}/json/version")
        request = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?about:blank", method="PUT")
        with urllib.request.urlopen(request, timeout=10) as response:
            tab = json.load(response)
        ws = WS(tab["webSocketDebuggerUrl"])
        ws.call("Runtime.enable")
        ws.call("Page.enable")
        ws.call("Log.enable")
        ws.call("Page.addScriptToEvaluateOnNewDocument", {"source": """
          window.__journeyErrors = [];
          addEventListener('error', event => window.__journeyErrors.push(String(event.message || event.error)));
          addEventListener('unhandledrejection', event => window.__journeyErrors.push(String(event.reason)));
          const originalConsoleError = console.error.bind(console);
          console.error = (...args) => {
            window.__journeyErrors.push(args.map(String).join(' '));
            originalConsoleError(...args);
          };
        """})

        for viewport in VIEWPORTS:
            print(f"\n--- {viewport['name']} ---")
            ws.call("Emulation.setDeviceMetricsOverride", {
                "width": viewport["width"],
                "height": viewport["height"],
                "deviceScaleFactor": 1,
                "mobile": viewport["mobile"],
            })
            ws.call("Page.navigate", {"url": f"{base_url}/?debug=1#/journey"})
            wait_until(ws, "Boolean(window.__liaoji)", 30)
            time.sleep(.6)
            run_journey_suite(ws, viewport, check, screenshot)

        print("\n--- legacy routes ---")
        run_legacy_smoke(ws, base_url, check)
    except Exception as error:
        failures.append(str(error))
        print("ERROR", error)
    finally:
        if ws:
            ws.close()
        process.terminate()
        try:
            process.wait(timeout=8)
        except subprocess.TimeoutExpired:
            process.kill()

    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nJourney verification passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
