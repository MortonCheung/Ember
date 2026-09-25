/* ============================================================
   home.js — 展馆总览（星形信息架构的唯一中心）
   本页只做路径选择，不新增业务功能。四个入口分别指向已有页面，
   子页统一回到此处，避免展馆之间任意互跳。
   ============================================================ */

const DESTINATIONS = [
  {
    index: '01', route: 'entrance', verb: '看见', title: '序厅 · 炉前',
    meta: '三维场景 · 自由环视',
    note: '站在炉口前，看铁水沿着流槽再次亮起。',
  },
  {
    index: '02', route: 'history', verb: '看懂', title: '通史馆 · 铁西纪年',
    meta: '图文长卷 · 1953—今天',
    note: '沿一条时间轴，读懂“东方鲁尔”为何成为国家工业遗产。',
  },
  {
    index: '03', route: 'hall', verb: '走进', title: '铸造馆 · 翻砂车间',
    meta: '三维场景 · 展品探索',
    note: '进入原沈阳铸造厂车间，靠近冲天炉、砂箱与 C620-1 车床。',
  },
  {
    index: '04', route: 'cast', verb: '参与', title: '亲手浇铸 · 第一炉铁水',
    meta: '五步交互 · 可解释评分',
    note: '取样、调温、浇注、开箱，让每个参数真正改变铸件结果。',
  },
];

export function renderHome(root, { go }) {
  const page = document.createElement('div');
  page.className = 'page home';

  page.innerHTML = `
    <a class="skip-link" href="#museum-index">跳到参观入口</a>

    <header class="topbar home__topbar">
      <div class="wrap topbar__inner">
        <a class="logo" href="#/" aria-current="page" aria-label="炉火不灭 · 展馆总览">
          <span class="logo__mark" aria-hidden="true"><i></i></span>
          <span class="logo__wordmark">炉火不灭<small>中国工业博物馆数字展馆</small></span>
        </a>
        <nav class="nav" aria-label="展馆入口">
          ${DESTINATIONS.map((item) => `
            <a class="nav__item" href="#/${item.route}" data-go="${item.route}">${item.title.split(' · ')[0]}</a>
          `).join('')}
        </nav>
        <div class="topbar__spacer"></div>
        <button class="btn btn--primary home__header-cta" type="button" data-go="entrance">从序厅开始</button>
      </div>
    </header>

    <main class="home__main">
      <section class="home-hero wrap" aria-labelledby="home-title">
        <div class="home-hero__copy">
          <p class="eyebrow">中国工业博物馆 · 沈阳</p>
          <h1 id="home-title">炉火<br /><em>不灭</em></h1>
          <p class="home-hero__lead">把一座已被封存的车间，<br />重启为一台可以对谈的机器。</p>
          <div class="home-hero__actions">
            <button class="btn btn--primary" type="button" data-go="entrance">进入序厅 <span aria-hidden="true">↗</span></button>
            <a class="text-link" href="#museum-index">查看四条路径 <span aria-hidden="true">↓</span></a>
          </div>
        </div>

        <figure class="furnace-hero" aria-label="1957 年点火、2007 年熄火的十吨冲天炉抽象炉口">
          <div class="furnace-hero__grid" aria-hidden="true"></div>
          <span class="furnace-hero__year furnace-hero__year--start num">1957</span>
          <span class="furnace-hero__year furnace-hero__year--end num">2007</span>
          <div class="furnace-hero__aperture" aria-hidden="true"><span></span></div>
          <figcaption>
            <span>十吨冲天炉</span>
            <span class="num">12 m · 300 t · 50 年</span>
          </figcaption>
        </figure>
      </section>

      <section class="museum-index wrap" id="museum-index" aria-labelledby="index-title">
        <header class="museum-index__head">
          <div>
            <p class="eyebrow">展馆总览</p>
            <h2 id="index-title">从同一处进入，<br />也回到同一处。</h2>
          </div>
          <p>四个已开放模块是平行路径。每次只选一个目标，完成后回到总览，再决定下一站。</p>
        </header>

        <div class="museum-index__list">
          ${DESTINATIONS.map((item) => `
            <button class="museum-route" type="button" data-go="${item.route}" aria-label="进入${item.title}">
              <span class="museum-route__index num">${item.index}</span>
              <span class="museum-route__verb">${item.verb}</span>
              <span class="museum-route__main">
                <strong>${item.title}</strong>
                <small>${item.note}</small>
              </span>
              <span class="museum-route__meta num">${item.meta}</span>
              <span class="museum-route__arrow" aria-hidden="true">↗</span>
            </button>
          `).join('')}
        </div>
      </section>
    </main>

    <footer class="home-footer wrap">
      <p>「炉火不灭」· 中国工业博物馆 Web 数字展馆</p>
      <p class="num">SHENYANG · 41.8°N / 123.4°E</p>
    </footer>
  `;

  root.appendChild(page);

  function onClick(e) {
    const target = e.target.closest('[data-go]');
    if (!target) return;
    e.preventDefault();
    go(target.dataset.go);
  }
  page.addEventListener('click', onClick);

  return {
    dispose() {
      page.removeEventListener('click', onClick);
      page.remove();
    },
  };
}
