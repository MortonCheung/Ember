#!/usr/bin/env python3
"""《辽迹》人工三遍验收的可复现版（手册 §70）。

    Pass A  真实滚动走查：不跳转、不定位，模拟用户一路滚到底，
            检查镜头链条是否成立、相机是否连续、有没有中途崩坏。
    Pass B  全交互端到端：C620-1 四步（拆解→结构→组装启动→手轮进给→历史）
            与工作台生活互动（图纸 / 卡尺）各走一遍。
    Pass C  反向滚动：正向与反向在同一进度上的状态必须一致，
            证明 scroll-linked 动画没有崩坏（时间驱动的小循环除外）。

用法：
    python3 tools/walkthrough_cinematic.py http://127.0.0.1:5173
    python3 tools/walkthrough_cinematic.py http://127.0.0.1:5173 --shots

产物：tools/walkthrough.json + （可选）tools/screenshots-walk/*.png
"""

import base64
import json
import os
import subprocess
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_journey as V  # noqa: E402  （复用它的 WS / evaluate / drain，不重复造轮子）

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pass A 采样步长：每 2.5% 一次，全片 41 个点。
PASS_A_STEPS = 41
# Pass C 比对点：覆盖每个章节的代表性进度。
PASS_C_POINTS = [0.05, 0.13, 0.22, 0.31, 0.40, 0.52, 0.62, 0.72, 0.80, 0.88, 0.96]
# 时间驱动的小循环不参与一致性比对：车轮转角、电铲循环、主轴转角、吊钩余振
# 这些本来就该继续走，反向滚动时让它们倒转反而是错的。
TIME_DRIVEN = {
    "wheelSpin", "spindleSpin", "spin", "shovel", "hookEnergy", "roll", "lampFlicker",
}


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
        return f"{len(self.rows) - len(self.failed)}/{len(self.rows)} 项通过"


# 每次推帧捕获到的 update 异常（跨调用累积，最后统一断言）
TICK_ERRORS = []


def scroll_to(ws, mid, ratio, settle=0.28, timeout=5.0):
    """真实滚动：写 window.scrollY，然后等阻尼真正收敛。

    rawProgress 是瞬时到位的，visualProgress 是阻尼跟随（λ=8.5，约 0.5s）。
    不等收敛就读数，会把「还没追上」误判成「反向滚动状态不一致」。
    """
    ws.call(mid, "Runtime.evaluate", {
        "expression": f"window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * {ratio})",
        "returnByValue": True,
    })
    mid += 1
    time.sleep(settle)

    # 滚动必须先被证实真的发生了。
    # 否则 window.scrollY 本身就不动，收敛判据会拿「没动」当「已收敛」——
    # 这个假阴性让 Pass C 一度整段失真。
    probe = V.evaluate(ws, mid, r"""
    (() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return {
        scrollY: window.scrollY,
        expected: max * """ + str(ratio) + r""",
        max,
        htmlOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow,
      };
    })()
    """)
    mid += 1
    if probe and abs(probe["scrollY"] - probe["expected"]) > 2:
        return mid, probe  # 滚动被挡住，交给上层报错

    target = (probe or {}).get("scrollY", 0) / max((probe or {}).get("max", 1), 1)

    # 补帧：headless 的 rAF 会被节流，真实浏览器不会有这个问题。
    # 滚动本身仍然是真实的 window.scrollTo，进度仍然从真实 scrollY 推导。
    deadline = time.time() + timeout
    while time.time() < deadline:
        # 从真实 scrollY 重新同步（产品在 Explore 退出时用的同一条路径），
        # 再补帧；滚动本身仍然是真实的 window.scrollTo。
        V.evaluate(ws, mid, "window.__liaoji.syncProgress()")
        mid += 1
        tick_result = V.evaluate(ws, mid, "window.__liaoji.tick(8)")
        mid += 1
        if tick_result and tick_result.get("error"):
            TICK_ERRORS.append(tick_result["error"])
        pair = V.evaluate(ws, mid,
                          "(() => { const s = window.__liaoji.state(); return [s.rawProgress, s.visualProgress]; })()")
        mid += 1
        if not pair:
            break
        # raw 必须跟着真实 scrollY 走（防 ticker 冻结造成的假收敛），visual 要追上 raw
        if abs(pair[0] - target) < 0.0005 and abs(pair[0] - pair[1]) < 0.002:
            break
        time.sleep(0.05)
    return mid, None


def read_state(ws, mid):
    st = V.evaluate(ws, mid, "window.__liaoji.shotState()")
    mid += 1
    world = V.evaluate(ws, mid, "window.__liaoji.worldState()")
    mid += 1
    info = V.evaluate(ws, mid, "window.__liaoji.info()")
    mid += 1
    return {"shot": st, "world": world, "info": info}, mid


def diff_state(a, b):
    """比较两个 worldState；返回差异最大的若干项。

    只比对「两侧都在场」的章节：不在场的 Set 不执行 update，读到的是陈旧值，
    拿它做一致性判据会把「不该更新」误判成「不一致」。
    """
    shared = set((a or {}).get("_active") or []) & set((b or {}).get("_active") or [])
    out = []
    for chapter, values in (a or {}).items():
        if chapter == "_active" or not isinstance(values, dict):
            continue
        if chapter not in shared:
            continue
        other = (b or {}).get(chapter, {})
        if not isinstance(other, dict):
            continue
        for key, value in values.items():
            if key in TIME_DRIVEN:
                continue
            if isinstance(value, dict):
                for sub, subv in value.items():
                    if sub in TIME_DRIVEN:
                        continue
                    ov = (other.get(key) or {}).get(sub)
                    if isinstance(subv, (int, float)) and isinstance(ov, (int, float)):
                        out.append((f"{chapter}.{key}.{sub}", abs(subv - ov)))
                continue
            ov = other.get(key)
            if isinstance(value, (int, float)) and isinstance(ov, (int, float)):
                out.append((f"{chapter}.{key}", abs(value - ov)))
    out.sort(key=lambda item: -item[1])
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    want_shots = "--shots" in sys.argv
    if not args:
        print(__doc__)
        return 2
    base = args[0].rstrip("/")

    port = V.find_port(9700)
    profile = f"/tmp/_liaoji-walk-{port}"
    os.makedirs(profile, exist_ok=True)
    flags = [
        "--headless=new", "--no-first-run", "--no-default-browser-check",
        "--disable-extensions", f"--remote-debugging-port={port}",
        f"--user-data-dir={profile}",
        "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader",
        "--window-size=1440,900", "--hide-scrollbars",
        "--disable-features=Translate,BackForwardCache",
        "--no-sandbox", "--disable-gpu-sandbox", "--disable-dev-shm-usage",
        "--no-proxy-server",
    ]
    print(f"启动 Chrome (port {port}) ...")
    proc = subprocess.Popen([V.find_chrome()] + flags + ["about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    report = Report()
    readings = {}
    try:
        ver = V.wait_devtools(port)
        if not ver:
            print("FAIL: DevTools 端口不可达")
            return 1
        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?about:blank", method="PUT")
        with urllib.request.urlopen(req, timeout=15) as r:
            tab = json.load(r)
        ws = V.WS(tab["webSocketDebuggerUrl"])
        mid = 1
        for method in ("Runtime.enable", "Page.enable", "Log.enable"):
            ws.call(mid, method)
            mid += 1
        ws.call(mid, "Emulation.setDeviceMetricsOverride",
                {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
        mid += 1

        # headless 下页面上跑一会儿会被当作后台标签节流，rAF / gsap ticker 停止，
        # ScrollTrigger 的 progress 就冻结在最后一个 tick —— 这不是产品问题，
        # 但会让「真实滚动走查」从某个点之后整段失真。必须显式保持页面活跃。
        ws.call(mid, "Emulation.setFocusEmulationEnabled", {"enabled": True})
        mid += 1
        ws.call(mid, "Page.setWebLifecycleState", {"state": "active"})
        mid += 1

        console = {"console": [], "exceptions": [], "log": []}
        ws.call(mid, "Page.navigate", {"url": f"{base}/?debug=1#/journey"})
        mid += 1
        time.sleep(7)
        V.drain(ws, console, 1.5)

        # ==================== Pass A：真实滚动走查 ====================
        print("\n[Pass A] 真实滚动走查 ...")
        track = []
        scroll_blocked = []
        for i in range(PASS_A_STEPS):
            ratio = i / (PASS_A_STEPS - 1)
            mid, blocked = scroll_to(ws, mid, ratio)
            if blocked:
                scroll_blocked.append({"ratio": ratio, **blocked})
            state, mid = read_state(ws, mid)
            track.append({"ratio": ratio, **state})
        report.check("Pass A", "每一次滚动都真的发生了（scrollY 到位）", not scroll_blocked,
                     json.dumps(scroll_blocked[:2], ensure_ascii=False)[:240])

        # 1) 全程无 NaN / 无中断
        nan_rows = [
            t["ratio"] for t in track
            if any(v is None or v != v for v in list(t["shot"]["camera"]["position"])
                    + list(t["shot"]["camera"]["target"]) + [t["shot"]["camera"]["fov"]])
        ]
        report.check("Pass A", "全程 Camera 读数有限", not nan_rows, str(nan_rows[:5]))

        # 2) 镜头链条单调推进（允许跳切，但不允许倒退到更早的镜头）
        order = V.evaluate(ws, mid, "window.__liaoji.listShots().map(s => s.id)")
        mid += 1
        idx = {}
        for i, sid in enumerate(order):
            idx.setdefault(sid, i)
        seq = [idx.get(t["shot"]["shotId"], -1) for t in track]
        backward = [(track[k]["ratio"], track[k]["shot"]["shotId"], track[k + 1]["shot"]["shotId"])
                    for k in range(len(seq) - 1) if seq[k + 1] < seq[k]]
        report.check("Pass A", "镜头链条单调推进", not backward, str(backward[:3]))

        # 3) 相邻采样点的相机位移：非硬切处不应出现凭空瞬移
        # 跨镜头边界的连续性由 verify_journey 的 shotContinuity 负责（逐镜首尾相接）；
        # 这里只检查同一镜头内部有没有凭空跳变（哨兵阈值给得宽：俯冲本身就很快）。
        jumps = []
        for k in range(len(track) - 1):
            a = track[k]["shot"]["camera"]["position"]
            b = track[k + 1]["shot"]["camera"]["position"]
            if track[k + 1]["shot"]["shotId"] != track[k]["shot"]["shotId"]:
                continue
            dist = sum((a[j] - b[j]) ** 2 for j in range(3)) ** 0.5
            if dist > 90:
                jumps.append((round(track[k + 1]["ratio"], 3), track[k]["shot"]["shotId"], round(dist, 2)))
        report.check("Pass A", "同一镜头内无凭空瞬移", not jumps, str(jumps[:3]))

        # 4) 每个镜头都被真实滚动走到过（覆盖度）
        # 41 个采样点踩不满 48 个镜头（开场 9 镜只占 9%，蒙太奇 5 镜只占 4%）——
        # 逐镜可达性由 verify_journey 的「48 镜全部可定位」负责，
        # 这里只证明真实滚动能连续走完全片并覆盖每个章节。
        covered = {t["shot"]["shotId"] for t in track}
        chapters_seen = {t["shot"]["chapter"] for t in track}
        readings["coveredShots"] = len(covered)
        readings["chaptersSeen"] = sorted(chapters_seen)
        report.check("Pass A", f"滚动走查覆盖 ≥ 20 个镜头（实到 {len(covered)}）",
                     len(covered) >= 20, f"covered={len(covered)}/{len(order)}")
        report.check("Pass A", "七个章节全部被真实滚动走到",
                     len(chapters_seen) == 7, f"chapters={sorted(chapters_seen)}")

        readings["passA_track"] = [
            {"ratio": round(t["ratio"], 4), "shot": t["shot"]["shotId"],
             "chapter": t["shot"]["chapter"], "localT": round(t["shot"]["localT"], 3),
             "progress": round(t["shot"]["globalProgress"], 4)}
            for t in track
        ]
        worst = max((t["info"] or {}).get("calls", 0) for t in track)
        readings["worstCalls"] = worst
        report.check("Pass A", "全程 draw call < 420", worst < 420, f"worst={worst}")

        if want_shots:
            out_dir = os.path.join(ROOT, "tools", "screenshots-walk")
            os.makedirs(out_dir, exist_ok=True)
            for i in (3, 7, 11, 15, 19, 23, 27, 31, 35, 39):
                ratio = i / (PASS_A_STEPS - 1)
                mid, _ = scroll_to(ws, mid, ratio, settle=0.4)
                shot = ws.call(mid, "Page.captureScreenshot", {"format": "png"})
                mid += 1
                with open(os.path.join(out_dir, f"walk-{i:02d}-p{int(ratio*100)}.png"), "wb") as fh:
                    fh.write(base64.b64decode(shot["data"]))
            print(f"  走查截图 → {out_dir}")

        # ==================== Pass B：全交互端到端 ====================
        print("[Pass B] C620-1 四步 + 工作台互动 ...")
        lathe_run = V.evaluate(ws, mid, r"""
        (async () => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
          const L = window.__liaoji;
          window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * 0.245);
          await sleep(600);
          const out = {};
          out.entered = await L.enterExhibit('lathe');
          out.mode = L.state().mode;
          await sleep(1300); // 自动拆解动画 1.1s
          const console_ = document.querySelector('.liaoji-console');
          out.consoleVisible = !console_.hidden;
          out.step1Text = (console_.textContent || '').replace(/\s+/g,' ').slice(0, 60);
          // 步骤一：点一个部件看结构说明
          console_.querySelector('[data-action="part"][data-value="head"]').click();
          await sleep(120);
          out.partNote = (console_.querySelector('.liaoji-console__note')||{}).textContent;
          out.explodeAfterEnter = L.worldState().shenyang.lathe.explode;
          // 步骤二：组装并启动
          console_.querySelector('[data-action="assemble"]').click();
          // 组装 1.2s → 1.5s 后自动启动 → 启动动画 0.6s
          await sleep(2800);
          out.explodeAfterAssemble = L.worldState().shenyang.lathe.explode;
          out.runningAfterStart = L.worldState().shenyang.lathe.running;
          // 步骤三：手轮进给
          const feed = console_.querySelector('[data-action="feed"]');
          out.hasFeedSlider = !!feed;
          if (feed) {
            feed.value = '1';
            feed.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(400);
          }
          out.feedValue = L.worldState().shenyang.lathe.feed;
          out.step4Text = (console_.textContent || '').replace(/\s+/g,' ').slice(0, 90);
          out.archiveShown = !!console_.querySelector('.liaoji-console__archive');
          // 退出
          console_.querySelector('[data-action="exit"]').click();
          await sleep(1100);
          out.afterMode = L.state().mode;
          out.latheReset = L.worldState().shenyang.lathe;
          return out;
        })()
        """)
        mid += 1
        readings["latheRun"] = lathe_run
        if lathe_run:
            report.check("Pass B", "C620-1 进入并展开控制台",
                         lathe_run.get("entered") is True and lathe_run.get("consoleVisible") is True)
            report.check("Pass B", "步骤一：进入即自动拆解",
                         (lathe_run.get("explodeAfterEnter") if lathe_run.get("explodeAfterEnter") is not None else 0) > 0.9,
                         f"explode={lathe_run.get('explodeAfterEnter')}")
            def num(key, default):
                value = lathe_run.get(key)
                return default if value is None else value

            report.check("Pass B", "步骤一：点部件出结构说明",
                         "转速" in (lathe_run.get("partNote") or ""),
                         str(lathe_run.get("partNote"))[:40])
            report.check("Pass B", "步骤二：组装回位", num("explodeAfterAssemble", 9) < 0.1,
                         f"explode={lathe_run.get('explodeAfterAssemble')}")
            report.check("Pass B", "步骤三：启动成功", num("runningAfterStart", 0) > 0.9,
                         f"running={lathe_run.get('runningAfterStart')}")
            report.check("Pass B", "步骤三：手轮进料到满",
                         (lathe_run.get("feedValue") if lathe_run.get("feedValue") is not None else 0) > 0.85,
                         f"feed={lathe_run.get('feedValue')}")
            report.check("Pass B", "步骤四：历史信息出现",
                         lathe_run.get("archiveShown") is True, str(lathe_run.get("step4Text"))[:60])
            report.check("Pass B", "退出后回到 journey 且机床复位",
                         lathe_run.get("afterMode") == "journey"
                         and (lathe_run.get("latheReset") or {}).get("explode", 9) < 0.1,
                         f"mode={lathe_run.get('afterMode')}")
        else:
            report.check("Pass B", "C620-1 端到端可执行", False, "返回 null")

        bench_run = V.evaluate(ws, mid, r"""
        (async () => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
          const L = window.__liaoji;
          window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * 0.325);
          await sleep(600);
          const out = {};
          out.entered = await L.enterExhibit('bench');
          const console_ = document.querySelector('.liaoji-console');
          console_.querySelector('[data-action="drawing"]').click();
          await sleep(700);
          out.drawing = L.worldState().shenyang.bench.drawing;
          console_.querySelector('[data-action="caliper"]').click();
          await sleep(700);
          out.caliper = L.worldState().shenyang.bench.caliper;
          console_.querySelector('[data-action="exit"]').click();
          await sleep(1100);
          out.afterMode = L.state().mode;
          out.benchReset = L.worldState().shenyang.bench;
          return out;
        })()
        """)
        mid += 1
        readings["benchRun"] = bench_run
        if bench_run:
            report.check("Pass B", "工作台：图纸可展开",
                         (bench_run.get("drawing") if bench_run.get("drawing") is not None else 0) > 0.9,
                         f"drawing={bench_run.get('drawing')}")
            report.check("Pass B", "工作台：卡尺可抬起",
                         (bench_run.get("caliper") if bench_run.get("caliper") is not None else 0) > 0.9,
                         f"caliper={bench_run.get('caliper')}")
            report.check("Pass B", "工作台退出并复位",
                         bench_run.get("afterMode") == "journey"
                         and (bench_run.get("benchReset") or {}).get("drawing", 9) < 0.1,
                         f"mode={bench_run.get('afterMode')}")
        else:
            report.check("Pass B", "工作台端到端可执行", False, "返回 null")

        # ==================== Pass C：反向滚动 ====================
        # 拆成两件事，否则会把「阻尼没停准」误判成「动画崩坏」：
        #   C1 真实滚动能不能回到同一个进度（像素级取整 + 阻尼，容差给 0.001）
        #   C2 同一个 progress 上，正向与反向的状态是否一致（用 setProgress 精确对齐后比对）
        print("[Pass C] 正向 vs 反向一致性 ...")

        forward = {}
        c_blocked = []
        for ratio in PASS_C_POINTS:
            mid, blocked = scroll_to(ws, mid, ratio, settle=0.35)
            if blocked:
                c_blocked.append({"ratio": ratio, **blocked})
            # 真实滚动给出的 progress（syncProgress 读的就是真实 scrollY）
            raw = V.evaluate(ws, mid, "window.__liaoji.syncProgress()")
            mid += 1
            V.evaluate(ws, mid, "window.__liaoji.settle()")
            mid += 1
            state, mid = read_state(ws, mid)
            forward[ratio] = {"progress": raw, **state}

        mid, _ = scroll_to(ws, mid, 1.0, settle=0.6)

        backward_rows = []
        for ratio in reversed(PASS_C_POINTS):
            mid, blocked = scroll_to(ws, mid, ratio, settle=0.35)
            if blocked:
                c_blocked.append({"ratio": ratio, **blocked})
            raw_back = V.evaluate(ws, mid, "window.__liaoji.syncProgress()")
            mid += 1
            V.evaluate(ws, mid, "window.__liaoji.settle()")
            mid += 1
            state, mid = read_state(ws, mid)

            f = forward[ratio]
            cam_a = f["shot"]["camera"]["position"]
            cam_b = state["shot"]["camera"]["position"]
            cam_gap = sum((cam_a[j] - cam_b[j]) ** 2 for j in range(3)) ** 0.5
            diffs = diff_state(f["world"], state["world"])
            worst_name, worst_value = (diffs[0] if diffs else ("-", 0.0))
            backward_rows.append({
                "ratio": ratio,
                "progressForward": f["progress"],
                "progressBackward": raw_back,
                "progressGap": abs(f["progress"] - raw_back),
                "shotForward": f["shot"]["shotId"],
                "shotBackward": state["shot"]["shotId"],
                "cameraGap": cam_gap,
                "worstWorld": worst_name,
                "worstWorldGap": worst_value,
            })

        progress_bad = [r for r in backward_rows if r["progressGap"] > 0.001]
        cam_bad = [r for r in backward_rows if r["cameraGap"] > 0.05]
        shot_bad = [r for r in backward_rows if r["shotForward"] != r["shotBackward"]]
        world_bad = [r for r in backward_rows if r["worstWorldGap"] > 0.05]
        readings["passC"] = backward_rows
        report.check("Pass C", "正反向滚动都真的发生了（scrollY 到位）", not c_blocked,
                     json.dumps(c_blocked[:2], ensure_ascii=False)[:240])
        report.check("Pass C", "真实滚动反向能回到同一进度（±0.001）", not progress_bad,
                     str([(r["ratio"], round(r["progressGap"], 5)) for r in progress_bad[:3]]))
        report.check("Pass C", "同一进度上镜头一致", not shot_bad, str(shot_bad[:3]))
        report.check("Pass C", "同一进度上相机位置一致（<0.05m）", not cam_bad,
                     str([(r["ratio"], round(r["cameraGap"], 3)) for r in cam_bad[:3]]))
        report.check("Pass C", "同一进度上 scroll-linked 动画状态一致（<0.05）", not world_bad,
                     str([(r["worstWorld"], round(r["worstWorldGap"], 3)) for r in world_bad[:3]]))

        # 控制台收尾检查
        V.drain(ws, console, 1.5)
        errs = [c for c in console["console"] if c["type"] == "error"]
        report.check("收尾", "三遍全程零 console error",
                     not errs and not console["exceptions"],
                     json.dumps(errs[:2] + console["exceptions"][:2], ensure_ascii=False)[:240])

        report.check("收尾", "全程 world.update 无异常",
                     not TICK_ERRORS, (TICK_ERRORS[0] if TICK_ERRORS else "")[:300])

        out_path = os.path.join(ROOT, "tools", "walkthrough.json")
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump({"rows": report.rows, "readings": readings}, fh, ensure_ascii=False, indent=2)
        print(f"\n读数已写入 {out_path}")
    finally:
        proc.kill()

    print("\n—— 三遍走查结果 ——")
    group = None
    for row in report.rows:
        if row["group"] != group:
            group = row["group"]
            print(f"\n[{group}]")
        flag = "PASS" if row["ok"] else "FAIL"
        detail = f"  <- {row['detail']}" if row["detail"] and not row["ok"] else ""
        print(f"  {flag}  {row['name']}{detail}")
    print(f"\n合计 {report.summary()}")
    return 1 if report.failed else 0


if __name__ == "__main__":
    sys.exit(main())
