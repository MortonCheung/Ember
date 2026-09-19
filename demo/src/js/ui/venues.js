/* ============================================================
   venues.js — 场馆导航共享模块（Step 4 新增）
   依据：spec/ENTRANCE-HISTORY-SPEC.md §3「五个药丸的最终行为」
   · 序厅 / 通史馆 / 铸造馆：正常可点，go() 切页
   · 机床馆 / 汽车馆：保留药丸（真实馆体结构要完整），文字 steel 灰、
     缀 11px「· 筹备中」；点击不改选中态，复用各页既有 showNotice()
   · 当前态：铁水橙填充 + #14181D 字（样式在 layout.css .halls__item）
   三个 hall 形态页面（hall / entrance / history）共用，不各写一套。
   ============================================================ */

export const VENUES = ['序厅', '通史馆', '铸造馆', '机床馆', '汽车馆'];
export const VENUE_ROUTES = { '序厅': 'entrance', '通史馆': 'history', '铸造馆': 'hall' };
export const PENDING_VENUES = ['机床馆', '汽车馆'];

/** 场馆导航 HTML（current = 当前馆名，其药丸带 aria-current） */
export function venueNavHTML(current) {
  return VENUES.map((v) => {
    const pending = PENDING_VENUES.includes(v);
    const label = pending ? `${v}&nbsp;<span class="halls__pending">· 筹备中</span>` : v;
    return `
      <button class="halls__item${pending ? ' halls__item--pending' : ''}" type="button"
              data-venue="${v}" aria-current="${v === current}">${label}</button>
    `;
  }).join('');
}

/**
 * 场馆导航点击处理（各页在容器上代理点击）：
 * 可点馆走路由；筹备中馆不改选中态，回调各页自己的 showNotice()
 * （提示条 DOM 是页内的，本模块不持有）。
 */
export function handleVenueClick(e, { go, showNotice }) {
  const item = e.target.closest('.halls__item');
  if (!item) return false;
  const venue = item.dataset.venue;
  const route = VENUE_ROUTES[venue];
  if (!route) {
    showNotice(`「${venue}」该馆尚未开放 · 敬请期待`);
    return true;
  }
  go(route);
  return true;
}
