/* ============================================================
   home.js — 首页（对应设计稿 S01；下半段自 2026-09-23 起以 S11 为准）
   Step 1：静态视觉还原 + 跳转按钮
   体验修订 R1（PROMPT-UX-REVISION 第 1/2/3/4/5 条）：
   · 删顶栏右侧「进入虚拟展厅」按钮（保留 .topbar__spacer）
   · 删滚动飞越视频槽位与章节预告两段（旧「飞越」家族）
   · 两个入口（hero 主按钮 / 顶栏「虚拟展厅」药丸）一律先进序厅
   · 「了解项目」接上真页面 #/about
   R1-P3（PROMPT-HOME-LEDGER）：旧数据时间轴整段换成 .ledger 三屏
   · 「炉子的账本」：屏1 铁水（1,000 格）/ 屏2 铸件（浮雕立面）/ 屏3 时间（69 格年条）
   · 单个 scroll 监听 + 单个 CSS 变量 --ledger-p，一切推导走 CSS
   ⚠️ 体积判据 K11 = 产物 gzip(9) 净增量 ≤ 0：模板字符串会被原样打进产物，
      三屏骨架用 screen()/copy() 复用、字符串拼接换行写在引号外（压缩器可折叠）。
   ============================================================ */

/**
 * 主导航（文案与顺序对齐设计稿 S01）
 * 导出供 #/about 复用同一条顶栏，避免两处各维护一份
 */
export const NAV = [
  { label: '首页', route: '' },
  { label: '虚拟展厅', route: 'entrance' },   // R1 第 5 条：入口先到序厅，再到铸造馆
  { label: '互动体验', route: 'cast' },
  { label: '我的工牌', route: 'vault' },   // VAULT-SPEC §10：工牌是"你带走的东西"，需要常驻入口
  { label: '关于项目', route: 'about' },   // R1 第 2 条：从死项改为独立页
];

/* ---------- 账本数据（出处见 PROMPT-HOME-LEDGER §1，数字不新编） ---------- */
const IRON_CELLS = 1000;   // 近百万吨 ÷ 1,000 吨/格
const IRON_COLS = 40;      // 40 列 × 25 行
const IRON_ROWS = 25;
const YEARS = 69;          // 50（服役）+ 19（熄火至今，2007→2026）

/**
 * 屏 1 的 1,000 格：is-on 标"最终会亮"的 999 格（最后一格永远留空），
 * --t 是这格的点亮门槛（0..1，底行先亮）。两样都在这一条字符串里定死，
 * 滚动时只改一个变量，不碰任何格子。
 */
function buildIronCells() {
  let html = '';
  for (let i = 0; i < IRON_CELLS; i++) {
    if (i < IRON_CELLS - 1) {
      const row = Math.floor(i / IRON_COLS);               // 0 = 顶行
      const t = 0.02 + ((IRON_ROWS - 1 - row) / (IRON_ROWS - 1)) * 0.90;
      html += `<i class="is-on" style="--t:${t.toFixed(3)}"></i>`;
    } else {
      html += '<i></i>';
    }
  }
  return html;
}

/** 屏 3 的 69 格年条：前 50 格随 pl 0→0.4 依次点亮，第 69 格在 pl≥0.85 亮起，中间 18 格永远不亮 */
function buildYears() {
  let html = '';
  for (let y = 0; y < YEARS; y++) {
    if (y < 50) {
      html += `<i class="is-on" style="--t:${(0.02 + (y / 49) * 0.30).toFixed(3)}"></i>`;
    } else if (y === YEARS - 1) {
      html += '<i class="is-on" style="--t:0.850"></i>';
    } else {
      html += '<i></i>';
    }
  }
  return html;
}

/**
 * 屏 2 的人形比例尺：7 个 1.7 m 人形自下而上叠高，第 7 个被顶边裁切（11.5 ÷ 1.7 = 6.8）。
 * 同一段 SVG 复用 7 次（设计稿制图语言，不要一图一画）。
 */
function buildFigures() {
  const FIG = '<circle cx="0" cy="5" r="4.6" fill="#A8B0BA"/>'
    + '<path d="M-7 13.4 Q0 10.4 7 13.4 L6 27 L2 30 L2 56 L-2 56 L-2 30 L-6 27 Z" fill="#A8B0BA"/>';
  const H = 381;                     // viewBox 高 = 6.8 × 56
  const STEP = H / 6.8;
  let out = '';
  for (let k = 0; k < 7; k++) {
    out += `<g transform="translate(22 ${(H - STEP * (k + 1)).toFixed(1)})">${FIG}</g>`;
  }
  return out;
}

export function renderHome(root, { go }) {
  const page = document.createElement('div');
  page.className = 'page';

  // 三屏共用骨架：左栏文案 + 右栏视觉（换屏时左栏宽度一致，不会跳）
  const screen = (n, copy, visual) =>
    `<div class="ledger__screen" data-ledger-screen="${n}"><div class="wrap ledger__inner"><div>${copy}</div>${visual}</div></div>`;
  const copy = (eb, h, lede, tail) =>
    `<p class="eyebrow">${eb}</p><h2 class="ledger__h">${h}</h2><p class="ledger__lede">${lede}</p>${tail}`;

  page.innerHTML = `
    <header class="topbar">
      <div class="wrap topbar__inner">
        <a class="logo" href="#/" aria-label="炉火不灭 · 返回首页">
          <span class="logo__mark" aria-hidden="true"></span>
          炉火不灭
        </a>
        <nav class="nav" aria-label="主导航">
          ${NAV.map((n, i) => `
            <a class="nav__item" href="#/${n.route}" ${i === 0 ? 'aria-current="page"' : ''}>${n.label}</a>
          `).join('')}
        </nav>
        <div class="topbar__spacer"></div>
      </div>
    </header>

    <main class="wrap">
      <section class="hero">
        <div class="hero__col">
          <p class="eyebrow">序厅 · 铁流凝变</p>
          <h1>1957 年点火的那炉铁水<br />今天由你重新浇下</h1>
          <p class="hero__body">
            中国工业博物馆的铸造馆，是原沈阳铸造厂的翻砂车间原址。那台十吨冲天炉
            从 1957 年投用，到 2007 年熄火，熔化过近百万吨铁水。现在它是静止的。
            我们把炉门重新打开——这一次，浇铸的人是你。
          </p>
          <div class="hero__actions">
            <button class="btn btn--primary" type="button" data-go="entrance">进入虚拟展厅</button>
            <button class="btn btn--ghost" type="button" data-go="about">了解项目</button>
          </div>
        </div>

        <div class="hero__col">
          <figure class="hero__furnace" role="img"
            aria-label="十吨冲天炉剖面示意：炉喉、炉身、炉腹、炉缸与出铁口">
            <span class="hero__furnace-body" aria-hidden="true"></span>
            <span class="hero__furnace-charge" aria-hidden="true"></span>
            <span class="hero__furnace-taphole" aria-hidden="true"></span>
            <figcaption class="hero__furnace-cap">
              十吨冲天炉 · 炉身 12 m · 总重 300 t
            </figcaption>
          </figure>
        </div>
      </section>
    </main>

    <!-- ============ 炉子的账本（S11：自带 300vh 滚动行程） ============ -->
    <section class="ledger" data-ledger aria-label="炉子的账本：铁水 · 铸件 · 时间">
      <div class="ledger__pin">
        ${screen(0,
          copy('01 · 铁水', '近百万吨',
            '十吨冲天炉 1957 年投用、2007 年熄火，服役整整 50 年，熔化铁水近百万吨。按 1,000 吨一格码起来，是右边这 1,000 格。',
            '<p class="ledger__cap"><b>每格 1,000 吨</b> · 最后一格还没浇满 —— 所以是「近」百万</p>'),
          '<div class="ledger__grid" data-ledger-grid aria-hidden="true"></div>')}
        ${screen(1,
          copy('02 · 铸件', '六十余万吨',
            '它们后来成了铸件。六十余万吨里最大的一件，现在挂在序厅 —— 青铜浮雕《铁流凝变》，长 22 m、高 11.5 m，净重 50 吨。',
            '<p class="ledger__cap"><b>《铁流凝变》</b> · 序厅馆藏实物 · 我国目前最大的工业题材青铜雕塑</p>'),
          '<div class="ledger__slab">'
          + '<div class="ledger__dim ledger__dim--h" aria-hidden="true"><span class="ledger__dim-lbl">22 m</span></div>'
          + '<div class="ledger__slab-box">'
          + '<div class="ledger__ruler" aria-hidden="true"><svg class="ledger__people" viewBox="0 0 44 381" preserveAspectRatio="none"></svg></div>'
          + '<div class="ledger__unit" aria-hidden="true"><span class="ledger__unit-lbl">1.7 m · 人</span></div>'
          + '<div class="ledger__dim ledger__dim--v" aria-hidden="true"><span class="ledger__dim-lbl">11.5 m</span></div>'
          + '</div>'
          + '<div class="ledger__slab-hline" aria-hidden="true"></div>'
          + '<div class="ledger__slab-foot"><span>等高立面 · 11.5 m ≈ 6.8 个人高</span><span class="num">净重 50 t</span></div>'
          + '</div>')}
        ${screen(2,
          copy('03 · 时间', '烧了 50 年<br />冷了 19 年',
            '1957 年点火，2007 年熄火 —— 整整 50 年。此后到今天，19 年没有再亮过。',
            '<div class="ledger__cta"><button class="btn btn--primary" type="button" data-go="entrance">重新点火 · 进入虚拟展厅</button></div>'
            + '<p class="ledger__cap"><b>每格 1 年</b> · 第 69 格是今天</p>'),
          '<div class="ledger__years" data-ledger-years aria-hidden="true"></div>')}
      </div>
    </section>
  `;
  root.appendChild(page);

  page.querySelector('[data-ledger-grid]').innerHTML = buildIronCells();
  page.querySelector('[data-ledger-years]').innerHTML = buildYears();
  page.querySelector('.ledger__people').innerHTML = buildFigures();

  // ---------- 炉子的账本驱动（S11 §2.3：一个监听、一个变量） ----------
  const ledger = page.querySelector('[data-ledger]');
  const screens = [...page.querySelectorAll('[data-ledger-screen]')];
  const SEG = [0, 0.30, 0.63];          // 三屏的 p 区间起点
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 当前主屏（交叉淡入淡出只管透明度，谁吃点击由 is-live 定） */
  function dominantIndex(p) {
    return p < 0.30 ? 0 : p < 0.63 ? 1 : 2;
  }

  function applyLedger(p) {
    ledger.style.setProperty('--ledger-p', p.toFixed(4));
    const live = dominantIndex(p);
    // is-current 是"到过"标记（累计）：0 处 1 屏、0.30 处 2 屏、0.63 处 3 屏
    screens.forEach((el, i) => {
      el.classList.toggle('is-current', p >= SEG[i]);
      el.classList.toggle('is-live', i === live);
    });
  }

  function onLedgerScroll() {
    // top 必须用文档绝对坐标（rect.top + scrollY），offsetTop 只在 offsetParent 是 body 时相等
    const top = ledger.getBoundingClientRect().top + scrollY;
    const span = ledger.offsetHeight - innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, (scrollY - top) / span)) : 1;
    applyLedger(p);
  }

  if (reduceMotion) {
    applyLedger(1);           // 直接落终态（屏 3 全亮），不监听滚动
  } else {
    addEventListener('scroll', onLedgerScroll, { passive: true });
    onLedgerScroll();
  }

  // 事件委托：所有带 data-go 的元素都参与路由
  function onClick(e) {
    const btn = e.target.closest('[data-go]');
    if (!btn) return;
    go(btn.dataset.go);
  }
  page.addEventListener('click', onClick);

  return {
    dispose() {
      if (!reduceMotion) removeEventListener('scroll', onLedgerScroll);
      page.removeEventListener('click', onClick);
      page.remove();
    },
  };
}
