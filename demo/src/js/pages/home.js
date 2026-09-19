/* ============================================================
   home.js — 首页（对应设计稿 S01）
   Step 1：静态视觉还原 + 跳转按钮
   本轮补齐：滚动飞越（P2 降级实现）——
   · 三章节（与 caption 一致）：厂区外景 → 序厅《铁流凝变》 → 铸造馆中的冲天炉
   · 滚动注入 --flyover-progress（0–1），进度条与章节高亮由它驱动
   · 视频只留槽位（data-asset-status="placeholder|ready"），本轮不引入视频文件；
     ready 时切 scrub 模式（video.currentTime = progress × duration）
   · prefers-reduced-motion：不监听滚动，直接展示最终章节
   ============================================================ */

/**
 * 主导航（文案与顺序对齐设计稿 S01）
 * route 为空字符串表示尚未实现该页，暂指向首页
 */
const NAV = [
  { label: '首页', route: '' },
  { label: '虚拟展厅', route: 'hall' },
  { label: '互动体验', route: 'cast' },
  { label: '数字藏品', route: '' },
  { label: '关于项目', route: '' },
];

/* 飞越三章节（标题与首屏 caption 的串排一致） */
const CHAPTERS = [
  { tag: '第一章', title: '厂区外景', note: '滚动进入：掠过沈阳铸造厂的锈色屋顶与烟囱。' },
  { tag: '第二章', title: '序厅《铁流凝变》', note: '继续滚动：雕塑《铁流凝变》迎面而来。' },
  { tag: '第三章', title: '铸造馆中的冲天炉', note: '滚到底：十吨冲天炉在馆中熄火伫立，等你重新点火。' },
];

export function renderHome(root, { go }) {
  const page = document.createElement('div');
  page.className = 'page';

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
        <button class="btn btn--primary" type="button" data-go="hall">进入虚拟展厅</button>
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
            <button class="btn btn--primary" type="button" data-go="hall">进入虚拟展厅</button>
            <button class="btn btn--ghost" type="button">了解项目</button>
          </div>
        </div>

        <div class="hero__col">
          <figure class="flyover" role="img" aria-label="滚动飞越影像：厂区外景 → 序厅《铁流凝变》 → 铸造馆中的冲天炉" data-flyover>
            <div class="flyover__top">
              <div class="flyover__chips">
                <span class="chip"><span class="chip__dot"></span>滚动驱动 · 视频时间轴</span>
                <span class="chip">24 段预渲染链</span>
              </div>
              <div class="flyover__track"><div class="flyover__fill"></div></div>
            </div>
            <div class="flyover__stage" data-flyover-stage data-asset-status="placeholder">
              <!-- 视频槽位：素材就绪后把 data-asset-status 置为 ready，scrub 逻辑已在下方接线 -->
              <video class="flyover__video" data-flyover-video muted playsinline preload="none"></video>
              ${CHAPTERS.map((c, i) => `
                <div class="flyover__chapter${i === 0 ? ' is-active' : ''}" data-chapter="${i}">
                  <span class="flyover__chapter-tag">${c.tag}</span>
                  <h2 class="flyover__chapter-title">${c.title}</h2>
                  <p class="flyover__chapter-note">${c.note}</p>
                </div>
              `).join('')}
            </div>
          </figure>
          <p class="flyover__caption">首页由滚动驱动飞越串排：厂区外景 → 序厅《铁流凝变》 → 铸造馆中的冲天炉。</p>
        </div>
      </section>

      <section class="flyover-recipes" aria-label="飞越章节预告">
        <p class="eyebrow">滚动飞越 · 章节预告</p>
        <div class="flyover-recipes__list">
          ${CHAPTERS.map((c, i) => `
            <article class="flyover-recipes__item" data-recipe="${i}">
              <span class="flyover-recipes__num num">0${i + 1}</span>
              <h3 class="flyover-recipes__title">${c.title}</h3>
              <p class="flyover-recipes__note">${c.note}</p>
            </article>
          `).join('')}
        </div>
      </section>
    </main>
  `;

  root.appendChild(page);

  // ---------- 滚动飞越驱动 ----------
  const panel = page.querySelector('[data-flyover]');
  const stage = page.querySelector('[data-flyover-stage]');
  const video = page.querySelector('[data-flyover-video]');
  const chapters = [...page.querySelectorAll('[data-chapter]')];
  const recipes = [...page.querySelectorAll('[data-recipe]')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function apply(p) {
    panel.style.setProperty('--flyover-progress', p.toFixed(3));
    const active = Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length));
    chapters.forEach((el, i) => el.classList.toggle('is-active', i === active));
    recipes.forEach((el, i) => el.classList.toggle('is-active', i === active));
  }

  function onScroll() {
    // 整页滚动进度（首页的滚动叙事就是飞越本身）：0 = 页顶，1 = 页底
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
    apply(p);
    // 视频槽位：素材就绪（data-asset-status="ready"）时切 scrub 模式
    if (video.dataset.assetStatus === 'ready' && video.duration > 0) {
      video.currentTime = p * video.duration;
    }
  }

  if (reduceMotion) {
    apply(1);            // 直接展示最终章节，不监听滚动
  } else {
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
      if (!reduceMotion) removeEventListener('scroll', onScroll);
      page.removeEventListener('click', onClick);
      page.remove();
    },
  };
}
