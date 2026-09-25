/* ============================================================
   about.js — 关于项目（#/about，体验修订 R1 第 2 条）
   ── 目的（用户原话）：介绍**这个项目的目的**，不是作品说明书，
      也不是博物馆官网。
   ── 四段：为什么做 / 这个作品是什么 / 用了哪些真实史实 / 技术说明
   ── 版式：**滚动页**（同首页 flex:1 1 auto 的 .page），
      不是 #/hall 那种 100vh 定高页；复用 .topbar / .wrap /
      .eyebrow / .btn / .num，新增样式只允许 .about__*。
   ── 史实数字照 spec/PROJECT-BRIEF.md §4 一字不改（《铁流凝变》的重量
      另见 spec/RENAME-SCOPE.md §0，两处一致）。
   ============================================================ */

import { NAV } from './home.js';

/* 四层体验：每层一句话 + 一个直达按钮（R1 §2 表格，文案固定） */
const LAYERS = [
  { no: '01 · 看见', title: '看见', line: '滚动飞越铁西厂区', to: '' },
  { no: '02 · 看懂', title: '看懂', line: '序厅 → 通史馆长卷 → 铸造馆', to: 'entrance' },
  { no: '03 · 参与', title: '参与', line: '亲手浇一炉 / 与队友车一只塔轮', to: 'cast' },
  { no: '04 · 带走', title: '带走', line: '生成你自己的数字工牌', to: 'vault' },
];

/* 真实史实数据块：全部来自 spec/PROJECT-BRIEF.md §4，一字不许改、不许编 */
const FACTS = [
  { k: '博物馆规模', v: '占地 5.3 万 m²，藏品 1.5–3 万余件' },
  { k: '铸造馆', v: '2018 年入选第二批国家工业遗产；举架 30 m、纵深 200 m' },
  { k: '十吨冲天炉', v: '炉身 12 m、总重 300 t，1957 投用–2007 熄火' },
  { k: '《铁流凝变》', v: '22 × 11.5 m、净重 50 t，我国最大工业题材青铜雕塑' },
  { k: '新中国第一枚金属国徽', v: '直径 2.4 m、重 487 kg' },
  { k: 'C620-1 普通车床', v: '1955 年沈阳第一机床厂研制，登上第三套人民币 2 元纸币正面' },
];

export function renderAbout(root, { go }) {
  const page = document.createElement('div');
  page.className = 'page about-page';

  page.innerHTML = `
    <header class="topbar">
      <div class="wrap topbar__inner">
        <a class="logo" href="#/" aria-label="炉火不灭 · 返回首页">
          <span class="logo__mark" aria-hidden="true"></span>
          炉火不灭
        </a>
        <nav class="nav" aria-label="主导航">
          ${NAV.map((n) => `
            <a class="nav__item" href="#/${n.route}"${n.route === 'about' ? ' aria-current="page"' : ''}>${n.label}</a>
          `).join('')}
        </nav>
        <div class="topbar__spacer"></div>
      </div>
    </header>

    <main class="wrap">
      <section class="hero">
        <div class="hero__col">
          <p class="eyebrow">关于项目</p>
          <h1>把炉子重新点一次火</h1>
          <p class="about__lede">
            这座博物馆里最能说明工业的一件事，不是某件展品，而是「它曾经在动」。
            本作品只做一件事：把静态的陈列，变回一次可以上手的过程。
          </p>
        </div>
      </section>

      <section class="about__section">
        <h2>我们为什么做这个</h2>
        <p class="about__tech">
          中国工业博物馆的铸造馆，是原沈阳铸造厂翻砂车间的原址。那台十吨冲天炉
          1957 年投用、2007 年熄火，服役半个世纪，熔化铁水近百万吨。<strong>今天它是静止的。</strong>
        </p>
        <p class="about__tech">
          本作品要做的事只有一件：把它重新点一次火，让「看展」变成「上手做」——
          你不是站在栏杆外读说明牌，而是自己配一炉铁水、浇一只铸件、带走一张工牌。
        </p>
      </section>

      <section class="about__section">
        <h2>这个作品是什么</h2>
        <p class="about__tech">四层体验，一层一件事，每层都可以直接走进去。</p>
        <div class="about__layers">
          ${LAYERS.map((l) => `
            <article class="about__layer">
              <span class="about__layer-no num">${l.no}</span>
              <h3>${l.title}</h3>
              <p>${l.line}</p>
              <button class="btn btn--ghost" type="button" data-go="${l.to}">进入这一层</button>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="about__section">
        <h2>用了哪些真实史实</h2>
        <p class="about__tech">作品里的场景、设备与数字都来自可查的公开资料，没有虚构。</p>
        <dl class="about__facts">
          ${FACTS.map((f) => `
            <div class="about__fact">
              <dt class="about__fact-k">${f.k}</dt>
              <dd class="about__fact-v">${f.v}</dd>
            </div>
          `).join('')}
        </dl>
        <p class="about__src">以上数字据馆方公开资料。它们在作品里只作史实呈现，与交互中的评分数值没有任何关系。</p>
      </section>

      <section class="about__section">
        <h2>技术说明</h2>
        <p class="about__tech">
          全站为 three.js + 原生 ES Module，无后端、无随机、零贴图；所有评分都是可复算的纯函数 ——
          同一组参数必得同一分。全站 JS gzip 控制在 215 KB 以内，可直接在浏览器里离线打开。
        </p>
      </section>
    </main>
  `;
  root.appendChild(page);

  // 事件委托：所有带 data-go 的元素都参与路由（与首页同一写法）
  function onClick(e) {
    const btn = e.target.closest('[data-go]');
    if (!btn) return;
    go(btn.dataset.go);
  }
  page.addEventListener('click', onClick);

  return {
    dispose() {
      page.removeEventListener('click', onClick);
      page.remove();
    },
  };
}
