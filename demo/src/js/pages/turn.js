/* ============================================================
   turn.js — 协作车削（对应设计稿 S04，路由 #/turn）
   依据：spec/TURN-SPEC.md + archive/spec/PROMPT-TURN.md
         spec/PROMPT-UX-REVISION-P2.md（R1 第 8、9 条：删协作榜 / 删「本局用时」/ 工牌记本局）
   纪律：评分一律走 scoring/turning.js 纯函数引擎，本文件不含评分规则；
        页面**不显示任何形式的「用时」**（R1-P2）—— 纪元只供录制与协作分使用，观众读不到；
        本局状态在内存（切路由即丢）；
        工牌写入：**只写 `im.badge` 一个键**，且把**本局**车削特征写进 `badge.turn`
          （n / f / score / rank / collab），不再有"只升不降"的组内最佳；
        零随机；回放与实机共用同一套 poseAt ⇒ 同记录两次回放逐帧一致（§3.8）。
   ============================================================ */

import { mountViewport } from '../scene/viewport.js';
import { buildTurnScene } from '../scene/turn-scene.js';
import {
  N_RANGE, F_RANGE, INIT, WINDOW, TIMING, WEIGHTS, COLLAB,
  MODE_BADGE, K_BADGE, DURATION_MS, VIS,
} from '../scoring/turning-data.js';
import { score, selfTest } from '../scoring/turning.js';

/* ---------- 存储（E18：隐私模式降级为纯内存） ---------- */
const mem = {};
let storageOk = true;
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { storageOk = false; return key in mem ? mem[key] : fallback; }
  },
  set(key, val) {
    mem[key] = val;
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { storageOk = false; }
  },
};

/* ---------- 版式常量（与 TURN-SPEC §2 对应，读的是同一组 token） ---------- */
const reduceMotion = (typeof matchMedia === 'function')
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

const fmtN = (v) => `${Math.round(v)} r/min`;
const fmtF = (v) => `${Number(v).toFixed(2)} mm/r`;

const RULES_TEXT = [
  `表面质量（权重 ${Math.round(WEIGHTS.surface * 100)}%）：转速低于 ${WINDOW.nMin} 起积屑瘤、`
  + `高于 ${WINDOW.nMax} 起刀具磨损与颤振；进刀量超过 ${WINDOW.fMax} mm/r 刀痕变粗。`,
  `尺寸精度（权重 ${Math.round(WEIGHTS.size * 100)}%）：由 n × f 决定，`
  + `落在 ${WINDOW.mMin}–${WINDOW.mMax} 内不扣分，超出则让刀、尺寸超差。`,
  `团队协作积分（不计入质量分）：累计时间差每 1 s 扣 ${COLLAB.gapCoef} 分（上限 ${COLLAB.gapCap}）；`
  + `转速偏离 ${WINDOW.nMid} 理想中值、进刀量偏离 ${WINDOW.fMid} 理想中值各扣分（上限 ${COLLAB.matchCap}）。`,
];

export function renderTurn(root, { go, routes }) {
  const page = document.createElement('div');
  page.className = 'page turn-page';
  page.innerHTML = `
    <header class="topbar turn__topbar">
      <div class="wrap topbar__inner">
        <a class="turn__mark" href="#/cast" aria-label="返回互动体验 · 亲手浇铸" title="返回互动体验 · 亲手浇铸"></a>
        <span class="turn__page-title">互动体验 · C620-1 协作车削</span>
        <div class="topbar__spacer"></div>
        <span class="turn__mode">${MODE_BADGE}</span>
      </div>
    </header>

    <main class="turn">
      <section class="turn__stage-col">
        <div class="turn__stage">
          <section class="viewport turn__viewport" aria-label="协作车削三维场景"></section>
          <p class="turn__rec"><span class="turn__rec-dot" aria-hidden="true"></span>正在录制 · 可回放出品过程</p>
          <!-- 角色药丸已删（用户 2026-09-21 晚裁定）：分工直接由滑杆标签承担 -->
        </div>

        <div class="turn__controls">
          <label class="turn__slider">
            <span class="turn__slider-label">主轴转速 <b class="num" data-n-label>${fmtN(INIT.n)}</b></span>
            <input type="range" data-n min="${N_RANGE.min}" max="${N_RANGE.max}" step="${N_RANGE.step}"
              value="${INIT.n}" aria-label="主轴转速，${N_RANGE.min} 到 ${N_RANGE.max} 转每分钟" />
            <span class="turn__slider-range num">${N_RANGE.min} – ${N_RANGE.max} r/min</span>
          </label>
          <label class="turn__slider">
            <span class="turn__slider-label">进刀量 <b class="num" data-f-label>${fmtF(INIT.f)}</b></span>
            <input type="range" data-f min="${F_RANGE.min}" max="${F_RANGE.max}" step="${F_RANGE.step}"
              value="${INIT.f}" aria-label="进刀量，每转 ${F_RANGE.min} 到 ${F_RANGE.max} 毫米" />
            <span class="turn__slider-range num">${F_RANGE.min} – ${F_RANGE.max} mm/r</span>
          </label>
          <button class="btn btn--primary turn__go" data-go>开始车削</button>
        </div>
      </section>

      <aside class="turn__panel" aria-label="协作面板">
        <p class="eyebrow">蚂蚁啃骨头 · 协作攻关</p>
        <h2 class="turn__title">1955 年，这台机床花了 4 小时</h2>
        <p class="turn__desc">C620-1 普通车床由沈阳第一机床厂研制，曾印在第三套人民币 2 元纸币正面。当时加工一个塔轮需要 4 小时，沈阳第三机器厂车工赵国友把铺盖卷搬进车间昼夜攻关，最终缩短到 50 分钟。</p>
        <span class="turn__divider" aria-hidden="true"></span>

        <div class="turn__collab">
          <span class="turn__collab-label">团队协作积分</span>
          <span class="turn__collab-value num" data-collab aria-live="polite"></span>
        </div>

        <div class="turn__actions">
          <button class="btn btn--ghost turn__action" data-rules aria-expanded="false">查看工艺评分规则</button>
          <button class="btn btn--ghost turn__action" data-replay disabled>回放本局</button>
          <button class="btn btn--ghost turn__action" data-badge disabled hidden>存为我的工牌</button>
        </div>
        <div class="turn__rules" data-rules-body hidden>
          ${RULES_TEXT.map((t) => `<p>${t}</p>`).join('')}
        </div>

        <!-- R1-P2：双折线宿主原来挂在已删除的时钟块里；搬到这里（样式不动、语义不变） -->
        <div class="turn__trace" data-trace hidden></div>

        <p class="turn__note" data-note></p>
      </aside>
    </main>
  `;
  root.appendChild(page);

  /* ============ 三维视口（参数化挂载，不复制 viewport.js） ============ */
  /* 机位：切削区 3/4 近景（对准六级台阶中点 x≈0，不是卡盘），相机固定。
     rig 统一 ×3，主轴中心线世界 y = 0.99 × 3 = 2.97；
     距视点 2.40 —— 曾因 mount 时被 minDistance=6 外推到 6.03 而「看起来还行」，
     修回设计位后按实测重调（2026-09-21 用户可读性裁定）。 */
  const CAM = { pos: [0.55, 4.00, 2.10], target: [0.05, 2.96, 0] };
  const vp = mountViewport(page.querySelector('.viewport'), {
    buildScene: buildTurnScene,
    cameraPos: CAM.pos,
    target: CAM.target,
    debugKey: '__turn',
    views: { default: { pos: CAM.pos, target: CAM.target } },
  });
  // 近景必须把 OrbitControls 的下限让开（viewport.js 挂载时 minDistance=6，
  // 已把相机沿视线**外推到 6.03**；先下调、再把相机放回设计机位 2.05 ——
  // 否则整个场景比设计小一半，工件台阶每级只有 2–3 px，动画读不出来）
  if (vp.controls) {
    vp.controls.minDistance = 1.2;
    vp.controls.maxDistance = 12;
    vp.camera.position.set(...CAM.pos);
    vp.controls.target.set(...CAM.target);
    vp.controls.update();
  }
  const sceneRef = vp.scene?.getObjectByName('turn_scene')?.userData.api ?? null;

  /* ============ 元素引用 ============ */
  const $ = (s) => page.querySelector(s);
  const els = {
    nInput: $('[data-n]'), fInput: $('[data-f]'),
    nLabel: $('[data-n-label]'), fLabel: $('[data-f-label]'),
    go: $('[data-go]'),
    trace: $('[data-trace]'),
    collab: $('[data-collab]'),
    rules: $('[data-rules]'), rulesBody: $('[data-rules-body]'),
    replay: $('[data-replay]'), badge: $('[data-badge]'),
    note: $('[data-note]'),
  };

  /* ============ 状态 ============ */
  const st = {
    phase: 'idle',          // idle | cutting | done | replay
    n: INIT.n, f: INIT.f,
    lock: null,             // 开车时锁定的 {n,f}
    epoch: null,            // 录制 / 协作分共用的毫秒纪元（首次 input 或点击时刻）—— 不是"用时"，页面不读它
    goAt: null,             // 「开始车削」点击时刻
    rec: [],                // [{ t, n, f }]，t = 距纪元 ms
    cutStartMs: null,       // 录制内「开始车削」的位置
    result: null,
  };
  let ticker = null;

  /* ============ 时钟（§3.2 / §3.8） ============
     R1-P2：秒级计时函数与时钟刷新函数（以及一切把秒数写进 DOM 的路径）已删。
     保留下来的只有 `now()` —— 它服务三件事，都与"成绩"无关：
       ② `st.rec[].t` 录制时间轴（回放 + 双折线）
       ③ `st.adj[]` 调参时间差（协作分，`gapTotal()` 只累加相邻差，天然与纪元无关）
       ④ `TIMING.forceSettle` 600 s 守卫（展厅设备保护） */
  const now = () => performance.now();

  /* ============ 录制（§3.8：固定 100 ms 采样） ============ */
  function pushSample() {
    if (st.epoch === null) return;
    const t = now() - st.epoch;
    st.rec.push({ t, n: st.n, f: st.f });
  }

  function startTicker() {
    if (ticker !== null) return;
    const id = setInterval(() => {
      if (st.phase === 'cutting' || st.phase === 'idle') pushSample();
      // §3.2 上限：t > 600 s 强制结算（§10 E14 防止长时间占用展厅设备）
      if (st.phase === 'idle' && st.epoch !== null
        && (now() - st.epoch) / 1000 > TIMING.forceSettle) forceSettle();
    }, TIMING.sampleMs);
    // 兼容极简环境：句柄仅用于 clear
    ticker = { id };
  }
  function stopTicker() {
    if (ticker === null) return;
    clearInterval(ticker.id);
    ticker = null;
  }

  /* ============ 驱动（实机与回放共用一套 scene.update，只换参数源） ============ */
  let replayCursor = 0;      // 回放时钟（距计时起点 ms）
  sceneRef?.setDriver(() => {
    if (st.phase === 'cutting') {
      return { ms: Math.min(DURATION_MS, now() - st.goAt), n: st.lock.n, f: st.lock.f };
    }
    if (st.phase === 'done') return { ms: DURATION_MS, n: st.lock.n, f: st.lock.f };
    if (st.phase === 'replay') return replaySampleAt(replayCursor);
    return { ms: -1, n: st.n, f: st.f };
  });

  /** 回放的参数源（纯函数：同一 t 必得同一 {ms,n,f}） —— §3.8「同记录两次回放逐帧一致」 */
  function replaySampleAt(t) {
    const rec = st.rec;
    if (!rec.length) return { ms: -1, n: st.n, f: st.f };
    let lo = 0, hi = rec.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (rec[mid].t < t) lo = mid + 1; else hi = mid;
    }
    const b = rec[lo];
    const a = rec[Math.max(0, lo - 1)];
    const span = b.t - a.t;
    const k = span > 0 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 0;
    const n = a.n + (b.n - a.n) * k;
    const f = a.f + (b.f - a.f) * k;
    const cut = st.cutStartMs ?? Infinity;
    return { ms: t - cut, n, f };
  }

  /* ============ 滑杆 ============ */
  function onSlider(which, raw) {
    const v = which === 'n' ? Math.round(Number(raw)) : Number(raw);
    if (which === 'n') { st.n = v; els.nLabel.textContent = fmtN(v); }
    else { st.f = v; els.fLabel.textContent = fmtF(v); }
    if (st.epoch === null) {                      // §3.2 纪元 = 第一次调整参数
      st.epoch = now();
      startTicker();
      pushSample();
    } else {
      st.adj.push(now() - st.epoch);              // §4.2 累计时间差的数据来源
    }
  }
  st.adj = [];
  els.nInput.addEventListener('input', (e) => onSlider('n', e.target.value));
  els.fInput.addEventListener('input', (e) => onSlider('f', e.target.value));

  /* R1-P2：原「协作榜（§3.7）」的 `renderBoard()` 与 `renderBoardInitial()` 整段删除
     —— 排名榜已从界面与引擎两侧移除，不再有"入不入榜"的概念。 */

  /* ============ 双折线（回放轨迹，SVG；两色 = --c-iron / --c-text-muted） ============ */
  function renderTrace() {
    const rec = st.rec;
    if (rec.length < 2) { els.trace.hidden = true; return; }
    const W = 380, H = 56, PAD = 4;
    const t0 = rec[0].t, t1 = Math.max(rec[rec.length - 1].t, t0 + 1);
    const ns = rec.map((r) => r.n); const fs = rec.map((r) => r.f);
    const nMin = Math.min(...ns), nMax = Math.max(...ns);
    const fMin = Math.min(...fs), fMax = Math.max(...fs);
    const px = (t) => PAD + (t - t0) / (t1 - t0) * (W - PAD * 2);
    const py = (v, mn, mx) => H - PAD - (mx === mn ? 0.5 : (v - mn) / (mx - mn)) * (H - PAD * 2);
    const line = (key, mn, mx) => rec.map((r) => `${px(r.t).toFixed(1)},${py(r[key], mn, mx).toFixed(1)}`).join(' ');
    const cutX = st.cutStartMs === null ? null : px(t0 + st.cutStartMs);
    els.trace.hidden = false;
    els.trace.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"
        aria-label="本局参数轨迹：转速与进刀量随时间的两条折线">
        <polyline class="turn__trace-n" points="${line('n', nMin, nMax)}" />
        <polyline class="turn__trace-f" points="${line('f', fMin, fMax)}" />
        ${cutX === null ? '' : `<line class="turn__trace-cut" x1="${cutX.toFixed(1)}" y1="0" x2="${cutX.toFixed(1)}" y2="${H}" />`}
        <line class="turn__trace-cursor" data-cursor x1="${PAD}" y1="0" x2="${PAD}" y2="${H}" />
      </svg>
      <p class="turn__trace-legend">
        <span class="turn__trace-key turn__trace-key--n">主轴转速 n</span>
        <span class="turn__trace-key turn__trace-key--f">进刀量 f</span>
        <span class="turn__trace-key turn__trace-key--cut">开始车削</span>
      </p>`;
  }
  function moveTraceCursor(t) {
    const cur = els.trace.querySelector('[data-cursor]');
    if (!cur) return;
    const rec = st.rec;
    if (rec.length < 2) return;
    const t0 = rec[0].t, t1 = Math.max(rec[rec.length - 1].t, t0 + 1);
    const W = 380, PAD = 4;
    const x = PAD + Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) * (W - PAD * 2);
    cur.setAttribute('x1', x.toFixed(1));
    cur.setAttribute('x2', x.toFixed(1));
  }

  /* ============ 结算 ============ */
  function setControlsEnabled(on) {
    els.nInput.disabled = !on;
    els.fInput.disabled = !on;
    els.go.disabled = !on;
  }

  function settle(force) {
    if (st.phase !== 'cutting') return;
    stopTicker();
    // R1-P2：秒级计时函数已删，但 t 仍是引擎输入之一 —— 它只用于判定 `forcedSettle`
    //   标记与非法值回落，**不参与评分**。口径与改前逐位相同：机械时长 = 纪元 → 车削动画结束。
    const t = force ? TIMING.forceSettle
      : Math.max((st.goAt + DURATION_MS - st.epoch) / 1000, 0.001);
    st.result = score({
      n: st.lock.n, f: st.lock.f, t, adjustments: st.adj.slice(),
    });
    st.phase = 'done';
    if (sceneRef) sceneRef.poseAt(DURATION_MS, st.lock.n, st.lock.f);

    const r = st.result;
    els.collab.textContent = String(r.collab);
    els.collab.dataset.grade = r.total >= 60 ? 'ok' : 'bad';
    renderTrace();
    els.replay.disabled = false;
    els.badge.hidden = false;
    els.badge.disabled = false;
    els.go.textContent = '再车一只';
    setControlsEnabled(true);

    const notes = [];
    notes.push(`评级：${r.rank}；协作分 ${r.collab} 分（不计入质量分）。`);
    if (force) notes.push(`长时间未开始车削，已为你结算。`);
    if (!storageOk) notes.push('本次记录不会保存（浏览器存储不可用）。');
    els.note.textContent = notes.join(' ');
  }

  /** 强制结算：直接把姿态推到终态（不播动画），再按 600 s 出分 */
  function forceSettle() {
    if (st.phase !== 'idle') return;
    st.lock = { n: st.n, f: st.f };
    st.goAt = now() - DURATION_MS;
    st.cutStartMs = st.goAt - st.epoch;
    st.phase = 'cutting';
    sceneRef?.prepare(st.lock.n, st.lock.f);
    setControlsEnabled(false);
    settle(true);
  }

  /* ⚠️ 本函数**不许**叫 `go` —— `renderTurn(root, { go, routes })` 的参数 `go` 是路由跳转，
     同名的局部函数会把它**遮蔽**：点「存为我的工牌」时 `go('vault')` 会落到这里，
     结果是"把这一局重置掉、且不跳转"（2026-09-23 实测复现；`cast.js` 用 `goStep` 无此问题）。*/
  function startCut() {
    if (st.phase === 'done') { resetRun(); return; }
    if (st.phase !== 'idle') return;
    if (st.epoch === null) st.epoch = now();    // §3.2 未调整 → 纪元回退为点击时刻
    startTicker();
    st.lock = { n: st.n, f: st.f };
    st.goAt = now();
    st.cutStartMs = st.goAt - st.epoch;
    st.phase = 'cutting';
    pushSample();
    setControlsEnabled(false);
    els.go.disabled = true;
    sceneRef?.prepare(st.lock.n, st.lock.f);
    // 终点 = 车削动画结束；reduced-motion 下不播动画，但 t 仍按动画时长计（口径一致）
    window.setTimeout(() => settle(false), reduceMotion ? 0 : DURATION_MS + 30);
  }

  function resetRun() {
    st.phase = 'idle';
    st.lock = null; st.epoch = null; st.goAt = null; st.cutStartMs = null;
    st.rec.length = 0; st.adj.length = 0; st.result = null;
    els.collab.textContent = '';
    els.replay.disabled = true;
    els.badge.hidden = true; els.badge.disabled = true;
    els.go.textContent = '开始车削';
    els.note.textContent = '';
    els.trace.hidden = true; els.trace.innerHTML = '';
    setControlsEnabled(true);
    sceneRef?.prepare(st.n, st.f);
  }
  els.go.addEventListener('click', startCut);

  /* ============ 回放（§3.8：重演动画 + 双折线；不做装饰按钮） ============ */
  let rafId = null;
  function startReplay() {
    if (st.phase !== 'done' || st.rec.length < 2) return;
    st.phase = 'replay';
    replayCursor = 0;
    els.replay.disabled = true;
    const total = st.rec[st.rec.length - 1].t;
    let lastTs = now();
    const step = () => {
      const ts = now();
      replayCursor += Math.min(50, ts - lastTs);     // 帧差上限 50 ms（隐藏标签页不跳帧）
      lastTs = ts;
      if (replayCursor >= total) {
        replayCursor = total;
        moveTraceCursor(replayCursor);
        st.phase = 'done';
        els.replay.disabled = false;
        rafId = null;
        sceneRef?.poseAt(DURATION_MS, st.lock.n, st.lock.f);
        return;
      }
      moveTraceCursor(replayCursor);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }
  els.replay.addEventListener('click', startReplay);

  /* ============ 工艺评分规则 ============ */
  els.rules.addEventListener('click', () => {
    const open = els.rulesBody.hidden;
    els.rulesBody.hidden = !open;
    els.rules.setAttribute('aria-expanded', String(open));
    els.rules.textContent = open ? '收起工艺评分规则' : '查看工艺评分规则';
  });

  /* ============ 工牌（§6 / R1-P2 9a②：把**本局**车削特征写进 `badge.turn`） ============
     变更点（两条，都是 9a「看不出这一局跟上一局不一样」的根因）：
       ① 不再比"哪一局更好" —— 每次结算都覆盖 `turn`，工牌反映**最近这一局**；
       ② 写的是**特征**（n / f / score / rank / collab），不再是一个"用时"字符串。
     ⚠️ 只覆盖 `turn` 一个字段：`no` / `name` / `rank` / `castScore` / `unlocked` 一个都不动
        （`rank`/`castScore` 是浇铸侧字段，由 cast.js 负责 —— 这里碰它就是越界）。 */
  els.badge.addEventListener('click', () => {
    const r = st.result;
    const badge = store.get(K_BADGE, null);
    if (badge && r) {
      const lock = st.lock ?? { n: st.n, f: st.f };
      store.set(K_BADGE, {
        ...badge,
        turn: {
          n: lock.n, f: lock.f,
          score: r.totalShown, rank: r.rank, collab: r.collab,
        },
      });
    } else {
      els.note.textContent = '尚未浇铸过 —— 不创建工牌，仅保留本次车削记录。';
    }
    // §7.3：#/turn 结算页 → #/vault。目标页属 VAULT 包，未注册时诚实降级为就地反馈。
    if (routes?.includes('vault')) go('vault');
    else els.note.textContent = '车削记录已保留；数字工牌页（#/vault）尚未上线。';
  });

  /* ============ 启动 ============ */
  sceneRef?.prepare(st.n, st.f);
  const wired = Boolean(els.nInput && els.fInput && els.go && sceneRef && vp.camera);

  /* ============ 调试钩子（?debug=1）：自测 + 数值取证 + 截图驱动 ============ */
  if (new URLSearchParams(location.search).has('debug') && window.__turn) {
    window.__turn.api = sceneRef;
    window.__turn.selfTest = () => selfTest().concat([{
      name: 'P0 接线 wired（双滑杆 + 主按钮 + 场景句柄齐全）',
      pass: wired, expect: true, got: wired,
    }]);
    window.__turn.state = () => ({
      phase: st.phase, n: st.n, f: st.f,
      lock: st.lock, epoch: st.epoch, goAt: st.goAt,
      samples: st.rec.length, adjustments: st.adj.length,
      result: st.result && {
        total: st.result.totalShown, subs: st.result.subs,
        collab: st.result.collab, rank: st.result.rank,
        t: st.result.params.t, forced: st.result.forcedSettle,
      },
      storageOk, wired,
    });
    /** 数值取证：直接驱动场景时间线（纯函数），返回真实几何读数 */
    window.__turn.poseAt = (ms, n, f) => {
      const r = sceneRef ? sceneRef.poseAt(ms, n, f) : null;
      return r && sceneRef.debugState();
    };
    /** 调好参数并开车（走真实代码路径，不旁路状态机） */
    window.__turn.drive = (n, f, fast = true) => {
      if (typeof n === 'number') { els.nInput.value = String(n); st.n = n; els.nLabel.textContent = fmtN(n); }
      if (typeof f === 'number') { els.fInput.value = String(f); st.f = f; els.fLabel.textContent = fmtF(f); }
      if (st.epoch === null) { st.epoch = now(); startTicker(); pushSample(); }
      startCut();
      return st.phase;
    };
    /** 结算快照（截图用：立即出结算态） */
    window.__turn.settleNow = () => {
      if (st.phase === 'idle') { st.lock = { n: st.n, f: st.f }; st.goAt = now(); st.cutStartMs = 0; st.phase = 'cutting'; }
      if (st.phase === 'cutting') settle(false);
      return window.__turn.state();
    };
    /** R1-P2 K10：走真实的 600 s 设备保护路径（须先动一次滑杆把纪元建起来） */
    window.__turn.force = () => {
      if (st.epoch === null) { st.epoch = now(); startTicker(); pushSample(); }
      forceSettle();
      return window.__turn.state();
    };
    /** 回放定量取证：同一 t 连续取两次，逐位比较（§3.8 同记录两次回放逐帧一致） */
    window.__turn.replayFrame = (t) => replaySampleAt(t);
    window.__turn.trace = () => {
      const cur = els.trace.querySelector('[data-cursor]');
      return { hidden: els.trace.hidden, cursor: cur ? +cur.getAttribute('x1') : null,
        polylines: els.trace.querySelectorAll('polyline').length };
    };
  }

  return {
    dispose() {
      stopTicker();
      if (rafId !== null) cancelAnimationFrame(rafId);
      vp.dispose();
      page.remove();
    },
  };
}
