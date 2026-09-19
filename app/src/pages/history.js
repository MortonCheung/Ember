/* ============================================================
   history.js — 通史馆长卷（对应设计稿 S08，路由 #/history，Step 4）
   依据：spec/ENTRANCE-HISTORY-SPEC.md §2（唯一依据）
   · **2D 长卷，不做三维**（§2.1）：补四层体验里唯一没有载体的
     第 02 层「看懂 · 铁流凝变」；纯 DOM 是它在无障碍与低配机上的优势
   · 8 个节点：年份 / 标题 / 正文与 §2.2 **逐字一致**（史实不得改写、
     不得补编年份；第 7 节点故意不标年份 →「同期 · 人与物」）
   · 版式横向栅格按 §2.3（1440 稿）：内容左界 120 / 脊线 140 /
     节点内容 190（宽 1060）/ 右栏馆体信息 w 320 右对齐 / 长卷轨 1336
   · 颜色全部走 tokens.css 变量；铁水橙只用于眉标 / 关键年份（1957）/
     关键节点点 / 长卷指示 / 主按钮
   ============================================================ */

import { venueNavHTML, handleVenueClick } from '../shared/ui/venues.js';

/* §2.2 内容（逐字照抄，含全角标点与换行；不得改写） */
const NODES = [
  {
    year: '1953 – 1957', title: '「东方鲁尔」成型',
    body: ['「一五」时期，铁西聚集了全国十分之一以上的工业产能；156 项国家重点工程中，24 项落户辽宁。这座城市的工业底色，是这时候浇上去的。'],
  },
  {
    year: '1955', title: '一台车床，进了人民币',
    body: ['沈阳第一机床厂研制 C620-1 普通车床。它的图案登上第三套人民币 2 元纸币正面；年产量最高 2200 台，国内市场占有率超八成，远销 70 多个国家。'],
  },
  {
    year: '1957', title: '十吨冲天炉点火', key: true,   // 关键节点：铁水橙点 / 铁水橙年份
    body: ['炉身高 12 米、总重 300 吨，服务于原沈阳铸造厂的翻砂车间——也就是你今天走进的这座铸造馆。此后半个世纪，它熔化铁水近百万吨、生产铸件 60 余万吨。'],
  },
  {
    year: '2007', title: '炉火熄灭',
    body: ['服役整整 50 年。2007 年熄火后，这台冲天炉连同整座车间被封存下来，成了全国重点文物保护单位里一块静止的“工业琥珀”。'],
  },
  {
    year: '2018', title: '国家工业遗产',
    body: ['铸造馆入选第二批国家工业遗产。翻砂车间的举架 30 米、纵深 200 米，连同全馆 1.5 至 3 万余件藏品，从生产线变成了展线。'],
  },
  {
    year: '2024', title: '春晚分会场',
    body: ['央视龙年春晚沈阳分会场设在中国工业博物馆铸造馆。8 台新松 SR210D 机械臂登台，齿轮道具内置可敲击军鼓，舞美以工字钢为灵感。'],
  },
  {
    // 第 7 节点故意不标年份：素材里没有确切年份，标一个年份就是编史实（§2.2 警示）
    year: '同期 · 人与物', title: '还没走远的手艺和人',
    body: [
      '新中国第一枚金属国徽：直径 2.4 米、重 487 公斤，焦百顺团队在沈阳第一机器厂（今沈阳第一机床厂）铸造。',
      '劳模：张成哲（沈阳重型机器厂钳工，17 岁进厂，800 余项技术革新，18 项填补国内空白）、吴家柱（沈阳气体压缩机厂，腾出自家住房做技术学习场所）、赵国友（沈阳第三机器厂车工，塔轮加工 4 小时压到 50 分钟）、孟泰（鞍钢，“孟泰仓库”）。',
    ],
  },
  {
    year: '今天', title: '由你点火', finale: true,       // 结尾主按钮 → #/hall
    body: ['铸造馆里的冲天炉不会再点火了。但你可以。'],
  },
];

export function renderHistory(root, { go }) {
  const page = document.createElement('div');
  page.className = 'page';

  page.innerHTML = `
    <div class="hall history">
      <!-- 长卷内容（可滚动；HUD / 药丸悬浮其上） -->
      <div class="history__scroll" data-scroll>
        <div class="history__inner">
          <header class="history__head">
            <div class="history__head-main">
              <p class="eyebrow history__eyebrow">通史馆 · 铁西纪年</p>
              <h1 class="history__title">一座城市的工业纪年</h1>
              <p class="history__lead">从「东方鲁尔」到国家工业遗产 —— 沈阳铁西的炉火，烧了七十年。</p>
            </div>
            <div class="history__meta">
              <p class="history__meta-name">中国工业博物馆</p>
              <p class="history__meta-sub">占地 5.3 万 m² · 藏品 1.5–3 万余件</p>
            </div>
          </header>

          <ol class="timeline">
            ${NODES.map((n) => `
              <li class="timeline__node${n.key ? ' timeline__node--key' : ''}">
                <span class="timeline__dot" aria-hidden="true"></span>
                <p class="timeline__year num">${n.year}</p>
                <h2 class="timeline__title">${n.title}</h2>
                ${n.body.map((p) => `<p class="timeline__body">${p}</p>`).join('')}
                ${n.finale ? `
                  <button class="btn btn--primary timeline__cta" type="button" data-go="hall">观看铸造馆 →</button>
                ` : ''}
              </li>
            `).join('')}
          </ol>
        </div>
      </div>

      <!-- 长卷轨（右侧）：轨 = line 色，指示段 = 铁水橙，表示"长卷还有下文" -->
      <div class="scrollrail" aria-hidden="true">
        <span class="scrollrail__indicator" data-rail-indicator></span>
      </div>

      <div class="hud">
        <button class="hud__back" type="button" data-go="">‹ 返回首页</button>
        <span class="hud__title">
          <span class="logo__mark" aria-hidden="true"></span>
          虚拟展厅 · 通史馆
        </span>
        <div class="hud__spacer"></div>
        <span class="hud__badge"><span class="hud__dot"></span>长卷 · 图文</span>
        <button class="btn btn--ghost hud__xr" type="button" data-go="hall">进入铸造馆</button>
      </div>

      <nav class="halls" aria-label="场馆导航">
        ${venueNavHTML('通史馆')}
      </nav>

      <div class="halls-notice" data-notice hidden aria-live="polite"></div>
    </div>
  `;

  root.appendChild(page);

  const $ = (sel) => page.querySelector(sel);
  const scroller = $('[data-scroll]');
  const indicator = $('[data-rail-indicator]');

  /* ---------- 长卷轨指示段：随滚动进度下滑（reduced-motion 直接落位，无过渡本来就没动画） ---------- */
  function updateRail() {
    const max = scroller.scrollHeight - scroller.clientHeight;
    const p = max > 0 ? scroller.scrollTop / max : 1;
    const track = scroller.clientHeight * 0.4;                 // 轨长 ≈ 40vh
    const travel = track - indicator.offsetHeight;
    indicator.style.transform = `translateY(${Math.round(p * travel)}px)`;
  }
  scroller.addEventListener('scroll', updateRail, { passive: true });
  updateRail();

  /* ---------- 导航（共享接线）+ 页内 data-go ---------- */
  const notice = $('[data-notice]');
  let noticeTimer = 0;
  function showNotice(text) {
    notice.textContent = text;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 2600);
  }
  const halls = page.querySelector('.halls');
  function onNavClick(e) {
    // 返回值不用于藏提示条：筹备中馆要靠 showNotice() 留示 2.6s（见 hall.js 同注）
    handleVenueClick(e, { go, showNotice });
  }
  halls.addEventListener('click', onNavClick);

  function onClick(e) {
    const btn = e.target.closest('[data-go]');
    if (btn) go(btn.dataset.go);
  }
  page.addEventListener('click', onClick);

  return {
    dispose() {
      clearTimeout(noticeTimer);
      scroller.removeEventListener('scroll', updateRail);
      halls.removeEventListener('click', onNavClick);
      page.removeEventListener('click', onClick);
      page.remove();
    },
  };
}
