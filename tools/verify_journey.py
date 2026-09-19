#!/usr/bin/env python3
"""《辽迹》Final Cinematic Whitebox 自动验收（仅 Python 标准库 + 本机 Chrome CDP）。

用法：
    # 先在 app/ 起服务：npm run dev（5173）或 npm run build && npm run preview（4173）
    python3 tools/verify_journey.py http://127.0.0.1:5173
    python3 tools/verify_journey.py http://127.0.0.1:5173 --screenshots

覆盖面（相对旧白盒新增 2~8）：
  1. 结构      —— 单 Canvas、无横向滚动、控制台零错误
  2. 分镜      —— 全片 49 个镜头可被定位；每个镜头三个时刻的 Camera 无 NaN
  3. 镜头衔接  —— 非硬切镜头之间必须首尾相接（shotContinuity）
  4. 反向滚动  —— 从 1.0 递减回 0，Camera 读数始终有限
  5. Explore   —— C620-1 进入 / 退出闭环，原位返回精度
  6. 取景      —— C620-1 在 Notice 镜头必须完整入镜
  7. 抚顺构图  —— 极低机位 + 仰角 + 工人占屏比（本轮必须人工验收的镜头）
  8. 性能      —— 各章节 draw call / 三角面读数
  9. 旧路由    —— #/ #/hall #/cast #/entrance #/history 冒烟，确认无回归

注意：本机沙箱内 Chrome 自带 sandbox 无法初始化（Operation not permitted），
GPU 进程会随之退出导致 CDP socket 立刻断开，因此必须带 --no-sandbox。
"""

import base64
import json
import os
import socket
import struct
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
    r"C:\Program Files\Google Chrome\Application\chrome.exe",
]

VIEWPORTS = [
    {"name": "desktop-1440x900", "width": 1440, "height": 900, "mobile": False},
    {"name": "desktop-1280x720", "width": 1280, "height": 720, "mobile": False},
    {"name": "portrait-390x844", "width": 390, "height": 844, "mobile": True},
]

OLD_ROUTES = ["#/", "#/hall", "#/cast", "#/entrance", "#/history"]

# 每个镜头取三个时刻：进入、中段、离开。
LOCAL_STOPS = [0.05, 0.5, 0.95]


def find_chrome():
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    raise SystemExit("找不到本机 Chrome / Edge")


def find_port(start=9500):
    for port in range(start, start + 60):
        with socket.socket() as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise SystemExit("找不到空闲端口")


class WS:
    """极简 CDP WebSocket 客户端（纯标准库）。"""

    def __init__(self, url):
        u = urllib.parse.urlparse(url)
        self.sock = socket.create_connection((u.hostname, u.port), timeout=40)
        key = base64.b64encode(os.urandom(16)).decode()
        path = u.path + (("?" + u.query) if u.query else "")
        req = (f"GET {path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n"
               "Upgrade: websocket\r\nConnection: Upgrade\r\n"
               f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
        self.sock.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        if b"101" not in buf.split(b"\r\n")[0]:
            raise RuntimeError("握手失败: " + buf[:200].decode(errors="replace"))

    def send(self, obj):
        payload = json.dumps(obj).encode()
        header = bytearray([0x81])
        n = len(payload)
        mask = os.urandom(4)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", n)
        self.sock.sendall(bytes(header) + mask
                          + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))

    def _rd(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                raise RuntimeError("socket closed")
            buf += chunk
        return buf

    def recv(self):
        head = self._rd(2)
        length = head[1] & 0x7F
        if length == 126:
            length = struct.unpack(">H", self._rd(2))[0]
        elif length == 127:
            length = struct.unpack(">Q", self._rd(8))[0]
        return json.loads(self._rd(length).decode())

    def call(self, mid, method, params=None, timeout=60):
        self.send({"id": mid, "method": method, "params": params or {}})
        deadline = time.time() + timeout
        while time.time() < deadline:
            msg = self.recv()
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})
        raise RuntimeError(f"{method}: timeout")

    def close(self):
        try:
            self.sock.close()
        except OSError:
            pass


def wait_devtools(port, timeout=45):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=5) as r:
                return json.load(r)
        except Exception:
            time.sleep(0.35)
    return None


def drain(ws, state, budget=1.0):
    """把积压的 Runtime / Log 事件收干，避免污染下一个断言。"""
    end = time.time() + budget
    ws.sock.settimeout(0.25)
    while time.time() < end:
        try:
            msg = ws.recv()
        except Exception:
            break
        method = msg.get("method", "")
        params = msg.get("params", {})
        if method == "Runtime.consoleAPICalled":
            entry = params.get("type", "")
            text = " ".join(
                str(a.get("value", a.get("description", ""))) for a in params.get("args", [])
            )
            state["console"].append({"type": entry, "text": text[:400]})
        elif method == "Runtime.exceptionThrown":
            details = params.get("exceptionDetails", {})
            state["exceptions"].append(
                str(details.get("exception", {}).get("description", details.get("text", "")))[:400]
            )
        elif method == "Log.entryAdded":
            state["log"].append(params.get("entry", {}).get("level", ""))
    ws.sock.settimeout(40)


def evaluate(ws, mid, expression):
    result = ws.call(mid, "Runtime.evaluate", {
        "expression": expression,
        "returnByValue": True,
        "awaitPromise": True,
    })
    return result.get("result", {}).get("value")


class Report:
    def __init__(self):
        self.rows = []

    def check(self, group, name, ok, detail=""):
        self.rows.append({"group": group, "name": name, "ok": bool(ok), "detail": detail})
        return ok

    @property
    def failed(self):
        return [r for r in self.rows if not r["ok"]]

    def summary(self):
        total = len(self.rows)
        bad = len(self.failed)
        return f"{total - bad}/{total} 项通过"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    screenshots = "--screenshots" in sys.argv
    if not args:
        print(__doc__)
        return 2
    base = args[0].rstrip("/")

    chrome = find_chrome()
    port = find_port()
    profile = os.path.join(tempfile.gettempdir(), f"_liaoji-verify-{port}")
    os.makedirs(profile, exist_ok=True)

    flags = [
        "--headless=new", "--no-first-run", "--no-default-browser-check",
        "--disable-extensions", f"--remote-debugging-port={port}",
        f"--user-data-dir={profile}",
        "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader",
        "--window-size=1440,900", "--hide-scrollbars",
        "--disable-features=Translate,BackForwardCache",
        # 沙箱内必须关掉 Chrome 自带 sandbox，否则 GPU 进程退出 → CDP socket 断。
        "--no-sandbox", "--disable-gpu-sandbox", "--disable-dev-shm-usage",
        # 本机有系统代理，localhost 必须直连，否则拿到的是代理的 502。
        "--no-proxy-server",
    ]
    print(f"启动 Chrome (port {port}) ...")
    proc = subprocess.Popen([chrome] + flags + ["about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    report = Report()
    readings = {}
    try:
        ver = wait_devtools(port)
        if not ver:
            print("FAIL: DevTools 端口不可达")
            return 1
        print("browser:", ver.get("Browser"))

        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?about:blank", method="PUT")
        with urllib.request.urlopen(req, timeout=15) as r:
            tab = json.load(r)
        ws = WS(tab["webSocketDebuggerUrl"])
        mid = 1
        for method in ("Runtime.enable", "Page.enable", "Log.enable"):
            ws.call(mid, method)
            mid += 1

        # ---------------- 结构 ----------------
        ws.call(mid, "Emulation.setDeviceMetricsOverride",
                {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
        mid += 1
        state = {"console": [], "exceptions": [], "log": []}
        ws.call(mid, "Page.navigate", {"url": f"{base}/?debug=1#/journey"})
        mid += 1
        time.sleep(6)
        drain(ws, state, 2.0)

        struct_probe = r"""
        (() => {
          const out = {};
          out.canvases = document.querySelectorAll('canvas').length;
          out.horizontalOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          out.scrollHeight = document.documentElement.scrollHeight;
          out.hasApi = typeof window.__liaoji === 'object';
          out.shotCount = window.__liaoji ? window.__liaoji.listShots().length : -1;
          return out;
        })()
        """
        s = evaluate(ws, mid, struct_probe)
        mid += 1
        readings["structure"] = s
        report.check("结构", "单 Canvas", s.get("canvases") == 1, f"canvas={s.get('canvases')}")
        report.check("结构", "无横向滚动", s.get("horizontalOverflow", 999) <= 0,
                     f"overflow={s.get('horizontalOverflow')}px")
        report.check("结构", "滚动轨道已按分镜权重拉长", s.get("scrollHeight", 0) > 12000,
                     f"scrollHeight={s.get('scrollHeight')}px")
        report.check("结构", "Debug 导演台可用", s.get("hasApi") is True)
        # 9 开场 + 8 沈阳 + 4 铁路 + 12 鞍山 + 3 公路 + 6 抚顺 + 6 结尾 = 48
        report.check("结构", "分镜表完整（48 个镜头）", s.get("shotCount") == 48,
                     f"shots={s.get('shotCount')}")

        console_errors = [c for c in state["console"] if c["type"] == "error"]
        report.check("结构", "控制台零 error", not console_errors and not state["exceptions"],
                     json.dumps(console_errors[:2] + state["exceptions"][:2], ensure_ascii=False)[:300])

        # ---------------- 分镜可定位 + Camera 无 NaN ----------------
        shots = evaluate(ws, mid, "window.__liaoji.listShots()")
        mid += 1
        if not shots:
            # 走到这里说明 Experience 没起来（多半是运行时错误），
            # 后面的断言全部无意义，直接给出可读原因。
            print("\nFAIL: 页面未就绪 —— __liaoji 不可用，Experience 初始化失败。")
            print("      先看页面控制台的 '[liaoji] Experience initialization failed' 堆栈。")
            return 1
        bad_shots = []
        for shot in shots:
            for t in LOCAL_STOPS:
                st = evaluate(ws, mid, f"window.__liaoji.setShot({json.dumps(shot['id'])}, {t})")
                mid += 1
                if not st:
                    bad_shots.append({"id": shot["id"], "t": t, "reason": "setShot 返回 null"})
                    continue
                if st["shotId"] != shot["id"]:
                    bad_shots.append({"id": shot["id"], "t": t, "reason": f"落到 {st['shotId']}"})
                    continue
                flat = list(st["camera"]["position"]) + list(st["camera"]["target"]) + [st["camera"]["fov"]]
                if any((not isinstance(v, (int, float))) or v != v for v in flat):
                    bad_shots.append({"id": shot["id"], "t": t, "reason": "Camera 出现 NaN"})
        report.check("分镜", "全部镜头可定位且 Camera 无 NaN", not bad_shots,
                     json.dumps(bad_shots[:3], ensure_ascii=False)[:300])

        # ---------------- 镜头衔接 ----------------
        continuity = evaluate(ws, mid, "window.__liaoji.shotContinuity(0.6)")
        mid += 1
        broken = [r for r in continuity if not r["ok"]]
        readings["continuityBroken"] = broken[:6]
        report.check("分镜", "非硬切镜头首尾相接", not broken,
                     json.dumps(broken[:3], ensure_ascii=False)[:300])

        # ---------------- 反向滚动 ----------------
        reverse_bad = []
        for step in range(20, -1, -1):
            p = step / 20
            # 用分号而不是 &&：setProgress(0) 返回 0，&& 会短路掉后面的读数。
            evaluate(ws, mid, f"window.__liaoji.setProgress({p})")
            mid += 1
            st = evaluate(ws, mid, "window.__liaoji.shotState()")
            mid += 1
            if not st:
                reverse_bad.append({"p": p, "reason": "shotState null"})
                continue
            flat = list(st["camera"]["position"]) + list(st["camera"]["target"])
            if any(v != v for v in flat):
                reverse_bad.append({"p": p, "reason": "NaN"})
        report.check("滚动", "反向滚动 Camera 始终有限", not reverse_bad,
                     json.dumps(reverse_bad[:3], ensure_ascii=False)[:300])

        # ---------------- Explore 闭环 ----------------
        expr = r"""
        (async () => {
          const before = window.__liaoji.setShot('SY_05_NOTICE', 0.6);
          const saved = { p: before.camera.position, t: before.camera.target };
          const entered = await window.__liaoji.enterExhibit('lathe');
          const mode = window.__liaoji.state().mode;
          const exited = await window.__liaoji.exitExplore();
          const after = window.__liaoji.state();
          const restored = window.__liaoji.camera();
          const dx = Math.abs(restored.position[0] - saved.p[0]);
          const dy = Math.abs(restored.position[1] - saved.p[1]);
          const dz = Math.abs(restored.position[2] - saved.p[2]);
          return { entered, mode, exited, afterMode: after.mode,
                   drift: Math.max(dx, dy, dz) };
        })()
        """
        explore = evaluate(ws, mid, expr)
        mid += 1
        readings["explore"] = explore
        report.check("Explore", "C620-1 可进入", bool(explore) and explore.get("entered") is True)
        report.check("Explore", "进入后进入 explore 模式",
                     bool(explore) and explore.get("mode") == "explore",
                     str(explore and explore.get("mode")))
        report.check("Explore", "退出后回到 journey",
                     bool(explore) and explore.get("afterMode") == "journey",
                     str(explore and explore.get("afterMode")))
        report.check("Explore", "原位返回精度 < 0.6m",
                     bool(explore) and explore.get("drift", 9) < 0.6,
                     f"drift={explore and explore.get('drift')}")

        # ---------------- 取景 / 抚顺构图 ----------------
        framed = evaluate(ws, mid,
                          "window.__liaoji.setShot('SY_05_NOTICE', 0.75) && window.__liaoji.heroFrame('lathe')")
        mid += 1
        readings["latheFrame"] = framed
        # CDP 的 returnByValue 会把 NaN / Infinity 序列化成 null，读数要能容忍。
        lathe_cov = (framed or {}).get("coverage")
        report.check("取景", "C620-1 在 Notice 镜头完整入镜",
                     bool(framed) and framed.get("inside") is True,
                     f"inside={framed and framed.get('inside')} "
                     f"coverage={'n/a' if lathe_cov is None else round(lathe_cov, 3)} "
                     f"sampled={framed and framed.get('sampled')}")

        # 拆成两次求值：定位与读数之间要让浏览器跑完一帧，
        # 否则 camera.matrixWorld 还没跟上，getWorldDirection 会拿到旧矩阵。
        evaluate(ws, mid, "window.__liaoji.setShot('FS_06_GAZE', 1.0)")
        mid += 1
        time.sleep(0.3)
        comp = evaluate(ws, mid, "window.__liaoji.fushunComposition()")
        mid += 1
        readings["fushun"] = comp
        keys = ("cameraY", "pitchDeg", "heightCoverage")
        if comp and all(comp.get(k) is not None for k in keys):
            report.check("抚顺", "最终机位是极低机位（相机低于工人腰部）",
                         -115.0 <= comp["cameraY"] <= -113.6, f"cameraY={round(comp['cameraY'], 3)}")
            report.check("抚顺", "视线明显朝上（仰角 > 15°）",
                         comp["pitchDeg"] > 15, f"pitch={round(comp['pitchDeg'], 2)}°")
            report.check("抚顺", "工人被广角拉高（占屏高度 > 35%）",
                         comp["heightCoverage"] > 0.35,
                         f"coverage={round(comp['heightCoverage'], 3)}")
            report.check("抚顺", "工人没有被人为拉长（占屏高度 < 100%）",
                         comp["heightCoverage"] < 1.0, f"coverage={round(comp['heightCoverage'], 3)}")
        else:
            report.check("抚顺", "抚顺构图读数可取", False,
                         json.dumps(comp, ensure_ascii=False)[:200])

        # ---------------- 手册 §12：C620-1 必须提前进入视野 ----------------
        # 「路线本身逐渐向 C620-1 偏移……用户提前十几米就应该知道前面有一台重要机器。」
        early = []
        for shot_id, t in [('SY_03_WALLTEXT', 0.55), ('SY_03_WALLTEXT', 0.95), ('SY_04_REVEAL', 0.5)]:
            evaluate(ws, mid, f"window.__liaoji.setShot({json.dumps(shot_id)}, {t})")
            mid += 1
            frame = evaluate(ws, mid, "window.__liaoji.nodeFrame('hero_lathe')")
            mid += 1
            early.append({"shot": shot_id, "t": t,
                          "inside": bool(frame and frame.get("inside")),
                          "coverage": (frame or {}).get("coverage")})
        readings["revealEarly"] = early
        report.check("取景", "C620-1 在走近途中已进入视野（§12）",
                     all(r["inside"] and (r["coverage"] or 0) > 0.004 for r in early),
                     json.dumps(early, ensure_ascii=False)[:240])

        # ---------------- 遮挡转场：必须真的填满画面 ----------------
        # §17「矿石完全填满整个画面」；§21「钢板最终填满屏幕」。
        # 这是两个 Match Cut 赖以成立的唯一条件：填不满就不是遮挡，是硬切。
        occl = {}
        for name, shot_id, t, key in [
            ("TR_04 矿石", 'TR_04_ORE', 0.98, "rail_hero_ore"),
            ("AS_07E 钢板", 'AS_07E_PLATE', 0.98, "as_steel_plate"),
        ]:
            evaluate(ws, mid, f"window.__liaoji.setShot({json.dumps(shot_id)}, {t})")
            mid += 1
            frame = evaluate(ws, mid, f"window.__liaoji.nodeFrame({json.dumps(key)})")
            mid += 1
            occl[name] = {"coverage": (frame or {}).get("coverage"),
                          "widthCoverage": (frame or {}).get("widthCoverage"),
                          "heightCoverage": (frame or {}).get("heightCoverage")}
        readings["occlusion"] = occl
        for name, row in occl.items():
            report.check("转场", f"{name}在切点前填满画面（宽或高 ≥ 0.95）",
                         (row["widthCoverage"] or 0) >= 0.95 or (row["heightCoverage"] or 0) >= 0.95,
                         json.dumps(row, ensure_ascii=False))

        # ---------------- 性能读数 ----------------
        perf = {}
        for shot_id, label in [("OP_01_SWITCH", "开场"), ("SY_02_ALIVE", "沈阳"),
                               ("TR_03_MOTION", "铁路"), ("AS_03_INNER", "鞍山"),
                               ("RD_02_TRANSIT", "公路"), ("FS_02_DIVE_A", "抚顺俯冲")]:
            perf[label] = evaluate(
                ws, mid,
                f"window.__liaoji.setShot({json.dumps(shot_id)}, 0.5) && window.__liaoji.info()")
            mid += 1
        readings["perf"] = perf
        worst = max((v or {}).get("calls", 0) for v in perf.values())
        report.check("性能", "单镜头 draw call < 420", worst < 420, f"worst={worst}")

        # ---------------- 旧路由冒烟 ----------------
        route_bad = []
        for route in OLD_ROUTES:
            st = {"console": [], "exceptions": [], "log": []}
            ws.call(mid, "Page.navigate", {"url": f"{base}/{route}"})
            mid += 1
            time.sleep(3)
            drain(ws, st, 1.2)
            errs = [c for c in st["console"] if c["type"] == "error"]
            if errs or st["exceptions"]:
                route_bad.append({"route": route, "errors": errs[:1] + st["exceptions"][:1]})
        report.check("旧路由", "五条旧路由无 console error", not route_bad,
                     json.dumps(route_bad[:2], ensure_ascii=False)[:300])

        # ---------------- 三视口 ----------------
        for vp in VIEWPORTS:
            ws.call(mid, "Emulation.setDeviceMetricsOverride", {
                "width": vp["width"], "height": vp["height"],
                "deviceScaleFactor": 1, "mobile": vp["mobile"],
            })
            mid += 1
            ws.call(mid, "Page.navigate", {"url": f"{base}/?debug=1#/journey"})
            mid += 1
            time.sleep(5)
            probe = evaluate(ws, mid, r"""
            (() => ({
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              fov: window.__liaoji ? window.__liaoji.shotState().camera.fov : null,
            }))()
            """)
            mid += 1
            report.check(f"视口 {vp['name']}", "无横向滚动",
                         bool(probe) and probe.get("overflow", 999) <= 0, str(probe))
            report.check(f"视口 {vp['name']}", "FOV 有竖屏补偿",
                         bool(probe) and isinstance(probe.get("fov"), (int, float))
                         and 18 <= probe["fov"] <= 96,
                         f"fov={probe and probe.get('fov')}")
            info = evaluate(ws, mid, "window.__liaoji.info()")
            mid += 1
            vp["calls"] = (info or {}).get("calls")
            report.check(f"视口 {vp['name']}", "draw call < 420",
                         bool(info) and (info.get("calls") or 0) < 420,
                         f"calls={vp['calls']}")

        # ---------------- 截图（人工验收用） ----------------
        if screenshots:
            ws.call(mid, "Emulation.setDeviceMetricsOverride",
                    {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
            mid += 1
            ws.call(mid, "Page.navigate", {"url": f"{base}/?debug=1#/journey"})
            mid += 1
            time.sleep(6)
            out_dir = os.path.join(ROOT, "tools", "screenshots-cinematic")
            os.makedirs(out_dir, exist_ok=True)
            gallery = [
                ("01-opening", "OP_01_SWITCH", 0.7),
                ("02-title", "OP_08_TITLE", 0.8),
                ("03-door", "OP_09_DOOR", 0.9),
                ("04-shenyang-enter", "SY_01_ENTER", 0.6),
                ("05-shenyang-alive", "SY_02_ALIVE", 0.6),
                ("06-lathe-notice", "SY_05_NOTICE", 0.7),
                ("07-bench", "SY_07_BENCH", 0.7),
                ("08-rail", "TR_03_MOTION", 0.6),
                ("09-anshan-scale", "AS_01_SCALE", 0.8),
                ("10-furnace-inner", "AS_03_INNER", 0.6),
                ("11-tap", "AS_06_TAP", 0.85),
                ("12-truck", "AS_08_TRUCK", 0.95),
                ("13-road", "RD_02_TRANSIT", 0.6),
                ("14-pit-rim", "FS_01_RIM", 0.9),
                ("15-dive", "FS_02_DIVE_A", 0.7),
                ("16-land", "FS_05_LAND", 1.0),
                ("17-gaze", "FS_06_GAZE", 1.0),
                ("18-ending", "EN_03_TITLE", 0.7),
            ]
            for name, shot_id, t in gallery:
                evaluate(ws, mid, f"window.__liaoji.setShot({json.dumps(shot_id)}, {t})")
                mid += 1
                time.sleep(0.45)
                shot = ws.call(mid, "Page.captureScreenshot", {"format": "png"})
                mid += 1
                with open(os.path.join(out_dir, f"{name}.png"), "wb") as fh:
                    fh.write(base64.b64decode(shot["data"]))
            print(f"截图已写入 {out_dir}")

        # ---------------- 控制台复查 ----------------
        drain(ws, state, 1.5)
        late = [c for c in state["console"] if c["type"] == "error"]
        report.check("结构", "全程无新增 console error", not late and not state["exceptions"],
                     json.dumps(late[:2], ensure_ascii=False)[:260])

        out_path = os.path.join(ROOT, "tools", "cinematic-verify.json")
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump({"rows": report.rows, "readings": readings}, fh, ensure_ascii=False, indent=2)
        print(f"\n读数已写入 {out_path}")
    finally:
        proc.kill()

    print("\n—— 验收结果 ——")
    current_group = None
    for row in report.rows:
        if row["group"] != current_group:
            current_group = row["group"]
            print(f"\n[{current_group}]")
        flag = "PASS" if row["ok"] else "FAIL"
        detail = f"  <- {row['detail']}" if row["detail"] and not row["ok"] else ""
        print(f"  {flag}  {row['name']}{detail}")
    print(f"\n合计 {report.summary()}")
    return 1 if report.failed else 0


if __name__ == "__main__":
    sys.exit(main())
