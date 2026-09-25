/* ============================================================
   main.js — 入口：路由注册 + 页面生命周期
   ============================================================ */

import { createRouter } from './router.js';
import { renderHome } from './pages/home.js';
import { renderHall } from './pages/hall.js';
import { renderCast } from './pages/cast.js';
import { renderEntrance } from './pages/entrance.js';     // Step 4：序厅
import { renderHistory } from './pages/history.js';       // Step 4：通史馆长卷

const root = document.getElementById('app');

/** 页面定义表：key -> render 函数 */
const PAGES = {
  '': renderHome,
  hall: renderHall,
  cast: renderCast,
  entrance: renderEntrance,   // Step 4 §0：序厅（轻量三维单件场景）
  history: renderHistory,     // Step 4 §0：通史馆（2D 长卷，不做三维）
};

const TITLES = {
  '': '中国工业博物馆数字展馆 · 炉火不灭',
  hall: '虚拟展厅 · 中国工业博物馆数字展馆',
  cast: '亲手浇铸 · 中国工业博物馆数字展馆',
  entrance: '序厅 · 中国工业博物馆数字展馆',
  history: '通史馆 · 中国工业博物馆数字展馆',
};

let activePage = null;
let activeKey = null;

/** 页面上下文：供页面组件调用路由跳转 */
const ctx = {
  go(key) {
    const next = '#/' + key;
    if (location.hash === next) return;
    location.hash = next; // 触发 hashchange -> mount
  },
};

/** 切换页面：先卸载上一页（释放 three.js 资源），再挂载新页 */
function mount(key) {
  if (key === activeKey) return;

  if (activePage) {
    activePage.dispose?.();
    activePage = null;
  }
  root.replaceChildren();

  const render = PAGES[key] ?? PAGES[''];
  activePage = render(root, ctx);
  activeKey = key;

  document.title = TITLES[key] ?? TITLES[''];
  window.scrollTo(0, 0);
}

// router 只负责在 hash 变化时通知；渲染统一由 mount 处理
const router = createRouter(PAGES, {
  onChange: (key) => mount(key),
});

router.start(); // 首次 resolve 触发 onChange -> mount 首页
