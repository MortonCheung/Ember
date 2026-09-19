/* ============================================================
   cast.js — 亲手浇铸（对应设计稿 S03，路由 #/cast，Step 3）
   五步状态机：①取样 ②调温 ③浇注 ④开箱 ⑤评分（spec §2）
   纪律：评分一律走 scoring/casting.js 纯函数引擎，本文件不含评分规则；
        拖动滑杆只更新实时提示（注解/徽标），不产生分数（§9）；
        本局状态在内存（切路由即丢，E9）；砂箱消耗 sessionStorage；
        馆藏解锁与工牌 localStorage（try/catch 内存降级，E18）。
   ============================================================ */

import * as THREE from 'three';
import { mountViewport } from '../museum/viewport.js';
import { buildCastScene } from '../museum/scenes/cast-scene.js';
import {
  T_RANGE, V_RANGE, H_RANGE, H_MIN, UNLOCK_SCORE,
} from '../features/casting/data.js';
import { score, display, gradeOf, sandboxOf, selfTest } from '../features/casting/scoring.js';

/* ---------- 存储（E18：隐私模式降级为纯内存） ---------- */
const mem = {};
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return key in mem ? mem[key] : fallback; }
  },
  set(key, val, permanent = true) {
    mem[key] = val;
    try {
      (permanent ? localStorage : sessionStorage).setItem(key, JSON.stringify(val));
    } catch { /* E18：保持内存值 */ }
  },
};
const K_CONSUMED = 'im.cast.consumed';   // sessionStorage（防刷新农场）
const K_UNLOCKED = 'im.cast.unlocked';   // localStorage（3/12 的来源）
const K_BADGE    = 'im.badge';           // 工牌（spec §6.2）
const K_BADGE_NO = 'im.badge.no';

/* ---------- 数字格式（spec §12 纪律 4：统一格式化，不散写 toFixed） ---------- */
const fmtT = (v) => `${Math.round(v)} ℃`;
const fmtV = (v) => `${v.toFixed(1)} kg/s`;
const fmtH = (v) => `${v.toFixed(1)} %`;
const fmtStars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

const STEP_LABELS = ['① 取样', '② 调温', '③ 浇注', '④ 开箱', '⑤ 评分'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function renderCast(root, { go }) {
  /* ============ 骨架（对齐画稿 S03） ============ */
  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = `
    <header class="topbar">
      <div class="wrap topbar__inner">
        <a class="logo" href="#/" aria-label="炉火不灭 · 返回首页">
          <span class="logo__mark" aria-hidden="true"></span>炉火不灭
        </a>
        <span class="cast__page-title">互动体验 · 亲手浇下第一炉铁水</span>
        <div class="topbar__spacer"></div>
        <ol class="cast__steps" aria-label="浇铸流程">
          ${STEP_LABELS.map((s, i) => `
            <li class="cast__step" data-step="${i}" ${i === 0 ? 'aria-current="step"' : ''}>${s}</li>
          `).join('')}
        </ol>
      </div>
    </header>

    <main class="cast">
      <section class="cast__stage-col">
        <div class="cast__stage">
          <section class="viewport cast__viewport" aria-label="亲手浇铸三维场景">
            <p class="hint">点选砂箱取样 · 拖拽旋转</p>
          </section>

          <div class="cast__annos" aria-live="polite">
            <p class="cast__anno cast__anno--warn" data-anno="t" hidden>
              温差过大，铸件将产生缩孔</p>
            <p class="cast__anno cast__anno--warn" data-anno="h" hidden>
              砂型过干，强度不足</p>
            <p class="cast__anno" data-anno="v" hidden></p>
          </div>

          <div class="cast__temp" data-temp hidden>
            <span class="cast__temp-label">铁水温度</span>
            <span class="cast__temp-value num" data-temp-value>1380 ℃</span>
            <span class="cast__temp-badge" data-temp-badge>适宜</span>
          </div>
        </div>

        <div class="cast__controls" data-controls></div>
      </section>

      <aside class="cast__panel" aria-label="实时质量反馈">
        <p class="eyebrow">实时质量反馈</p>
        <h2 class="cast__panel-title">本次浇铸评分</h2>
        <div class="cast__score">
          <span class="cast__score-num num" data-score>–</span>
          <span class="cast__score-unit">/100 <b data-verdict></b></span>
        </div>
        <div class="cast__subs">
          ${[['form', '造型完整度'], ['gas', '气孔控制'], ['yield', '铁水利用率']].map(([k, label]) => `
            <div class="cast__sub" data-sub="${k}">
              <span class="cast__sub-label">${label}</span>
              <span class="cast__sub-value num" data-sub-value>–</span>
              <span class="cast__sub-track"><span class="cast__sub-fill" data-sub-fill></span></span>
            </div>
          `).join('')}
        </div>
        <p class="cast__diagnosis" data-diagnosis>完成一炉后，这里会给出逐条可解释的评分与病因诊断。</p>
        <p class="cast__grade num" data-grade></p>
        <div class="cast__actions">
          <button class="btn btn--primary" data-retry disabled>调整参数重试</button>
          <button class="btn btn--ghost" data-badge disabled>存为我的工牌</button>
        </div>
        <p class="cast__unlock" data-unlock></p>
      </aside>
    </main>
  `;
  root.appendChild(page);

  /* ============ 三维视口（参数化挂载，spec §12.9） ============ */
  const vp = mountViewport(page.querySelector('.viewport'), {
    buildScene: buildCastScene,
    cameraPos: [3, 5, 13.2],
    target: [8.5, 0.9, 2.5],
    debugKey: '__cast',
    views: {
      default: { pos: [3, 5, 13.2],    target: [8.5, 0.9, 2.5] },
      top:     { pos: [8.5, 16, 3.01], target: [8.5, 0, 3] },
      close:   { pos: [11.5, 2.6, 7.5], target: [8.5, 0.8, 3] },
      ladle:   { pos: [16, 3, 10.5],   target: [13.6, 1.4, 7.6] },
    },
  });
  // buildCastScene 的交互 API 挂在场景根组 userData 上（WebGL 不可用时为 undefined）
  const sceneRef = vp.scene?.getObjectByName('cast_scene')?.userData.api ?? null;

  /* ============ 状态 ============ */
  const consumed = new Set(store.get(K_CONSUMED, []));
  const unlocked = new Set(store.get(K_UNLOCKED, []));
  const state = {
    step: 0,
    selected: null,        // sandbox 序号 0–11
    T: 1380, V: 15.0, H: 6.2,
    result: null,
    pouring: false,        // E16：浇注点击后的互斥锁
  };
  sceneRef?.setConsumed(consumed);

  /* ============ DOM 快捷引用 ============ */
  const $ = (sel) => page.querySelector(sel);
  const els = {
    steps: [...page.querySelectorAll('.cast__step')],
    controls: $('[data-controls]'),
    annoT: $('[data-anno="t"]'),
    annoH: $('[data-anno="h"]'),
    annoV: $('[data-anno="v"]'),
    temp: $('[data-temp]'),
    tempValue: $('[data-temp-value]'),
    tempBadge: $('[data-temp-badge]'),
    score: $('[data-score]'),
    verdict: $('[data-verdict]'),
    subs: Object.fromEntries(['form', 'gas', 'yield'].map((k) => [
      k, {
        value: page.querySelector(`[data-sub="${k}"] [data-sub-value]`),
        fill: page.querySelector(`[data-sub="${k}"] [data-sub-fill]`),
      },
    ])),
    diagnosis: $('[data-diagnosis]'),
    grade: $('[data-grade]'),
    retry: $('[data-retry]'),
    badgeBtn: $('[data-badge]'),
    unlock: $('[data-unlock]'),
    canvas: vp.canvas,
  };

  const box = () => sandboxOf(`sandbox_${state.selected}`);
  const casting = () => box()?.castingInfo ?? null;

  /* ============ 注解 / 徽标（实时预览，不产生分数） ============ */
  function refreshHints() {
    const c = casting();
    // 温度注解（§2 ②：双向，保持画稿原文）
    const tOff = c ? Math.abs(state.T - (c.tMin + c.tMax) / 2) >= 20 : false;
    els.annoT.hidden = !(state.step >= 1 && c && tOff);
    // 湿度过干提示（§2 ③）
    els.annoH.hidden = !(state.step >= 2 && state.H < H_MIN);
    // 建议速度注解（画稿原文，数值随铸件变化）
    if (state.step >= 2 && c) {
      els.annoV.textContent = `建议浇注速度 ${c.vMin}–${c.vMax} kg/s`;
      els.annoV.hidden = false;
    } else {
      els.annoV.hidden = true;
    }
    // 温度卡（§2 ②）
    els.temp.hidden = state.step < 1;
    els.tempValue.textContent = fmtT(state.T);
    if (c) {
      const badge = state.T < c.tMin ? '偏低 · 需升温'
        : state.T > c.tMax ? '偏高 · 需降温' : '适宜';
      els.tempBadge.textContent = badge;
      els.tempBadge.dataset.level = badge === '适宜' ? 'ok' : 'warn';
    }
  }

  /* ============ 步骤指示 ============ */
  function renderSteps() {
    els.steps.forEach((li, i) => {
      if (i === state.step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      li.classList.toggle('is-done', i < state.step);
    });
  }

  /* ============ 评分面板 ============ */
  function resetPanel() {
    els.score.textContent = '–';
    els.verdict.textContent = '';
    for (const k of ['form', 'gas', 'yield']) {
      els.subs[k].value.textContent = '–';
      els.subs[k].fill.style.width = '0%';
    }
    els.diagnosis.textContent = '完成一炉后，这里会给出逐条可解释的评分与病因诊断。';
    els.grade.textContent = '';
    els.retry.disabled = true;
    els.badgeBtn.disabled = true;
    els.badgeBtn.textContent = '存为我的工牌';
    els.unlock.textContent = '';
  }

  function countUp(el, target, ms = 600) {
    if (reduceMotion) { el.textContent = String(target); return; }
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / ms);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function revealScore() {
    const r = state.result;
    els.verdict.textContent = r.isScrap ? '废品' : '合格';
    els.verdict.dataset.level = r.isScrap ? 'bad' : 'ok';
    countUp(els.score, display.score(r.total));
    const subs = { form: r.subs.form, gas: r.subs.gas, yield: r.subs.yield };
    for (const k of ['form', 'gas', 'yield']) {
      const v = display.sub(subs[k]);
      countUp(els.subs[k].value, v);
      els.subs[k].fill.style.width = `${v}%`;   // CSS transition 补间；reduced-motion 下由全局规则直切
    }
    const scrap = r.scrapPrefix
      ? `<span class="cast__scrap">${r.scrapPrefix}</span>` : '';
    els.diagnosis.innerHTML = scrap + r.diagnosis;
    els.grade.textContent = `评级：${r.grade}`;
    els.retry.disabled = false;
    els.badgeBtn.disabled = false;

    // ---- 馆藏解锁（§7：≥75 且不重复计数） ----
    if (r.total >= UNLOCK_SCORE && !unlocked.has(state.selected)) {
      unlocked.add(state.selected);
      store.set(K_UNLOCKED, [...unlocked]);
      els.unlock.textContent =
        `馆藏已解锁：${box().collection}（${unlocked.size}/12）`;
    } else if (unlocked.has(state.selected)) {
      els.unlock.textContent = `馆藏「${box().collection}」已在图鉴中（${unlocked.size}/12）`;
    } else {
      els.unlock.textContent = `总分 ≥ ${UNLOCK_SCORE} 可解锁馆藏「${box().collection}」`;
    }
  }

  /* ============ 底部控制条（按步骤渲染） ============ */
  function renderControls() {
    const c = casting();
    if (state.step === 0) {
      const allUsed = consumed.size === 12;   // E12
      els.controls.innerHTML = `
        <p class="cast__select-info" data-select-info>
          ${state.selected !== null
            ? `已选 sandbox_${state.selected} · ${box().castingInfo.name} · ${fmtStars(box().castingInfo.stars)} · 初始湿度 ${fmtH(box().h0)}`
            : '在视口中点选一只砂箱 —— 选箱即选件'}</p>
        ${allUsed
          ? '<button class="btn btn--ghost" data-remold>砂型已用尽 · 重新制型</button>'
          : `<button class="btn btn--primary" data-next ${state.selected !== null ? '' : 'disabled'}>进入调温</button>`}
      `;
    } else if (state.step === 1) {
      els.controls.innerHTML = `
        <label class="cast__slider">
          <span class="cast__slider-label">铁水温度 <b class="num" data-t-val>${fmtT(state.T)}</b></span>
          <input type="range" data-t
            min="${T_RANGE.min}" max="${T_RANGE.max}" step="${T_RANGE.step}" value="${state.T}"
            aria-label="铁水温度，${T_RANGE.min} 到 ${T_RANGE.max} 摄氏度" />
          <span class="cast__slider-range num">${T_RANGE.min} – ${T_RANGE.max} ℃</span>
        </label>
        <button class="btn btn--primary" data-next>进入浇注</button>
      `;
    } else if (state.step === 2) {
      els.controls.innerHTML = `
        <label class="cast__slider">
          <span class="cast__slider-label">浇注速度 <b class="num" data-v-val>${fmtV(state.V)}</b></span>
          <input type="range" data-v
            min="${V_RANGE.min}" max="${V_RANGE.max}" step="${V_RANGE.step}" value="${state.V}"
            aria-label="浇注速度，每秒 ${V_RANGE.min} 到 ${V_RANGE.max} 公斤" />
          <span class="cast__slider-range num">建议 ${c ? `${c.vMin}–${c.vMax}` : ''} kg/s</span>
        </label>
        <label class="cast__slider cast__slider--h">
          <span class="cast__slider-label">砂型湿度 / 烘干程度 <b class="num" data-h-val>${fmtH(state.H)}</b></span>
          <input type="range" data-h
            min="${H_RANGE.min}" max="${H_RANGE.max}" step="${H_RANGE.step}" value="${state.H}"
            aria-label="砂型湿度，左湿右干" />
          <span class="cast__slider-range">◀ 湿 · 烘干 · 干 ▶</span>
        </label>
        <button class="btn btn--primary" data-pour>开始浇注</button>
      `;
    } else if (state.step === 3) {
      els.controls.innerHTML = `
        <p class="cast__wait">铁水充型中 —— 砂箱内的世界正在冷却……</p>
        <button class="btn btn--ghost" data-skip>跳过</button>
      `;
    } else {
      els.controls.innerHTML = `
        <p class="cast__wait">本炉已结算。砂型一次性 —— 另取一箱，或调整参数重试。</p>
        <button class="btn btn--primary" data-again>另取一箱</button>
      `;
    }
    renderSteps();
    refreshHints();
  }

  /* ============ 步骤流转 ============ */
  function goStep(n) {
    state.step = n;
    renderControls();
    if (n !== 4) resetPanel();
  }

  function selectSandbox(idx) {
    state.selected = idx;
    sceneRef?.setSelected(idx);
    // 选箱即选件：H 回到该箱 H₀，V 取铸件窗口中值（§5 口径）
    const info = sandboxOf(`sandbox_${idx}`);
    state.H = info.h0;
    state.V = Math.round(((info.castingInfo.vMin + info.castingInfo.vMax) / 2) * 2) / 2;
    renderControls();
  }

  function pour() {
    if (state.pouring || state.selected === null) return;   // E16
    state.pouring = true;

    // 参数锁定（§9：点击「开始浇注」后不可撤回）——按钮立即置灰防重复触发
    const btn = els.controls.querySelector('[data-pour]');
    if (btn) btn.disabled = true;
    els.controls.querySelectorAll('input[type=range]').forEach((i) => { i.disabled = true; });

    const info = sandboxOf(`sandbox_${state.selected}`);
    state.result = score({ T: state.T, V: state.V, H: state.H }, info.castingInfo.key);

    // 砂箱一次性：首浇即消耗（E11：重试不重复消耗）
    if (!consumed.has(state.selected)) {
      consumed.add(state.selected);
      store.set(K_CONSUMED, [...consumed], false);
      sceneRef?.setConsumed(consumed);
    }

    // 缺陷视觉档（§2 ④：气孔凹点 / 冷隔缺口 / 胀砂外凸）
    const fired = state.result.fired;
    const gasDed = fired.filter((f) => f.sub === 'gas').reduce((m, f) => Math.max(m, f.ded), 0);
    const defects = {
      pits: Math.min(12, Math.round(gasDed / 6)),
      notch: fired.some((f) => f.defect.includes('冷隔')),
      bulge: fired.some((f) => f.defect.includes('胀砂')),
    };

    goStep(3);
    sceneRef?.openBox(state.selected, defects, () => {
      state.pouring = false;
      goStep(4);
      revealScore();
    });
  }

  /* ============ 射线拾取（§2 ①：复用 sandbox_0…11 约定） ============ */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickAt(clientX, clientY) {
    const r = els.canvas.getBoundingClientRect();
    ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, vp.camera);
    const hits = raycaster.intersectObjects(sceneRef.pickMeshes, false);
    return hits.length ? hits[0].instanceId : null;          // E8：未命中无副作用
  }

  function onHover(e) {
    if (state.step !== 0) { els.canvas.style.cursor = ''; return; }
    const idx = pickAt(e.clientX, e.clientY);
    els.canvas.style.cursor =
      idx === null ? '' : consumed.has(idx) ? 'not-allowed' : 'pointer';   // E7
  }

  function onPick(e) {
    if (state.step !== 0) return;
    const idx = pickAt(e.clientX, e.clientY);
    if (idx === null || consumed.has(idx)) return;          // E7 / E8：无响应
    selectSandbox(idx);
  }

  // P0 可断言：句柄齐全 且 指针监听已挂载（断了就是 false，不再静默）
  const wired = Boolean(els.canvas && sceneRef && vp.camera);
  if (els.canvas && sceneRef) {
    els.canvas.addEventListener('pointermove', onHover);
    els.canvas.addEventListener('pointerdown', onPick);     // 触屏同源（§9）
  }

  /* ============ 控制条事件委托 ============ */
  els.controls.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-t]')) {
      state.T = Number(t.value);
      const label = els.controls.querySelector('[data-t-val]');
      if (label) label.textContent = fmtT(state.T);
    } else if (t.matches('[data-v]')) {
      state.V = Number(t.value);
      const label = els.controls.querySelector('[data-v-val]');
      if (label) label.textContent = fmtV(state.V);
    } else if (t.matches('[data-h]')) {
      state.H = Number(t.value);
      const label = els.controls.querySelector('[data-h-val]');
      if (label) label.textContent = fmtH(state.H);
    }
    refreshHints();
  });

  els.controls.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.matches('[data-next]')) goStep(state.step + 1);
    else if (btn.matches('[data-pour]')) pour();
    else if (btn.matches('[data-skip]')) sceneRef?.finishOpen();   // ④：跳过直达评分
    else if (btn.matches('[data-remold]')) {                        // E12
      consumed.clear();
      store.set(K_CONSUMED, [], false);
      sceneRef?.setConsumed(consumed);
      renderControls();
    } else if (btn.matches('[data-again]')) {                       // 另取一箱 → ①
      sceneRef?.resetBoxes();
      state.selected = null;
      state.result = null;
      goStep(0);
    }
  });

  /* ============ 面板按钮 ============ */
  els.retry.addEventListener('click', () => {                // E11：重试=重造砂型
    sceneRef?.resetBoxes();
    state.H = box().h0;          // H₀ 不变
    state.result = null;
    goStep(1);
  });

  els.badgeBtn.addEventListener('click', () => {             // 工牌数据（spec §6.2）
    const total = display.score(state.result.total);
    let badge = store.get(K_BADGE, null);
    if (!badge || badge.no == null) {
      const no = (store.get(K_BADGE_NO, 0) || 0) + 1;
      store.set(K_BADGE_NO, no);
      badge = { ...(badge ?? {}), no: String(no).padStart(6, '0') };
    }
    badge = {
      ...badge,
      name: badge.name ?? '',
      rank: total >= (badge.castScore ?? 0) ? gradeOf(total) : badge.rank,
      castScore: Math.max(badge.castScore ?? 0, total),
      turnTime: badge.turnTime ?? null,
      unlocked: `${unlocked.size}/12`,
    };
    store.set(K_BADGE, badge);
    els.badgeBtn.textContent = '已存 ✓';
    els.unlock.textContent = '工牌已写入本地；数字工牌页将在 Step 4 上线。';
  });

  /* ============ 启动 ============ */
  goStep(0);

  /* ============ 调试钩子（?debug=1）：selfTest + 截图驱动 ============ */
  if (new URLSearchParams(location.search).has('debug') && window.__cast) {
    // 引擎 44 项（纯函数）+ 接线 1 项（P0）= 浏览器侧 45 项；接线断了自测就红
    window.__cast.selfTest = () => selfTest().concat([{
      name: 'P0 接线 wired（句柄齐全且指针监听已挂载）',
      pass: wired, expect: true, got: wired,
    }]);
    window.__cast.state = () => ({
      step: state.step, selected: state.selected,
      T: state.T, V: state.V, H: state.H,
      consumed: [...consumed], unlocked: [...unlocked],
      total: state.result && display.score(state.result.total),
      wired,
    });
    // 截图驱动：走真实代码路径（真选箱 → 真开箱动画 → 真结算），不做状态旁路
    window.__cast.setStep = (n) => {
      const use8 = () => {
        if (state.selected !== 8) {
          state.selected = 8;
          sceneRef?.setSelected(8);
          const info = sandboxOf('sandbox_8');
          state.H = info.h0;           // sandbox_8: 6.2
          state.V = 15.0;              // 阀体窗口中值
        }
      };
      if (n === 0) {
        sceneRef?.resetBoxes();
        state.selected = null; state.result = null;
        goStep(0);
        return true;
      }
      if (n === 1) { use8(); goStep(1); return true; }        // ②调温 UI
      if (n === 2) { use8(); goStep(2); return true; }        // ③浇注 UI
      if (n === 3) { use8(); state.T = 1380; goStep(2); pour(); return true; }   // ④真实浇注（含动画）
      if (n === 4) {                                          // ⑤直落评分（同步；无头截图用）
        use8();
        state.T = 1380;
        state.result = score(
          { T: state.T, V: state.V, H: state.H },
          sandboxOf('sandbox_8').castingInfo.key,
        );
        goStep(4);
        revealScore();
        return true;
      }
      return false;
    };
  }

  return {
    dispose() {
      if (els.canvas && sceneRef) {
        els.canvas.removeEventListener('pointermove', onHover);
        els.canvas.removeEventListener('pointerdown', onPick);
      }
      vp.dispose();
      page.remove();
    },
  };
}
