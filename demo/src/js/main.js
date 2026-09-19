/* ============================================================
   main.js — 入口：路由注册 + 页面生命周期

   目录分层（见 demo/src/README.md）：
     core/     与具体世界无关的共用层
     data/     设计决策落点的纯声明（无 three、无 DOM）
     ui/       跨页共用 DOM 构件
     journey/  《辽迹》连续博物馆引擎
     legacy/   页面驱动旧范式（已冻结，逐件向 journey 迁移）

   六个路由全部按需动态加载：《辽迹》依赖 GSAP 与整套 Journey 引擎，
   静态 import 会把它一并塞进旧路由的主包，首屏无谓地变大。
   ============================================================ */

import { createRouter } from './router.js';

const root = document.getElementById('app');

/** 路由表：load 取模块，render 是模块内的渲染函数名 */
const ROUTES = {
  '': {
    load: () => import('./legacy/pages/home.js'),
    render: 'renderHome',
    title: '中国工业博物馆数字展馆 · 炉火不灭',
  },
  hall: {
    load: () => import('./legacy/pages/hall.js'),
    render: 'renderHall',
    title: '虚拟展厅 · 中国工业博物馆数字展馆',
  },
  cast: {
    load: () => import('./legacy/pages/cast.js'),
    render: 'renderCast',
    title: '亲手浇铸 · 中国工业博物馆数字展馆',
  },
  entrance: {
    load: () => import('./legacy/pages/entrance.js'),
    render: 'renderEntrance',
    title: '序厅 · 中国工业博物馆数字展馆',
  },
  history: {
    load: () => import('./legacy/pages/history.js'),
    render: 'renderHistory',
    title: '通史馆 · 中国工业博物馆数字展馆',
  },
  journey: {
    load: () => import('./journey/page.js'),
    render: 'renderJourney',
    title: '辽迹 · 可触碰的辽宁工业记忆',
  },
};

let activePage = null;
let activeKey = null;
let mountToken = 0;

/** 页面上下文：供页面组件调用路由跳转 */
const ctx = {
  go(key) {
    const next = '#/' + key;
    if (location.hash === next) return;
    location.hash = next; // 触发 hashchange -> mount
  },
};

/**
 * 切换页面：先卸载上一页（释放 three.js 资源），再挂载新页。
 * 模块按需加载；加载期间如果路由又变了，用 token 丢弃这次迟到的结果，
 * 避免旧页面盖在新页面上。
 */
async function mount(key) {
  if (key === activeKey) return;
  const token = ++mountToken;

  if (activePage) {
    activePage.dispose?.();
    activePage = null;
  }
  root.replaceChildren();
  activeKey = key;

  const route = ROUTES[key] ?? ROUTES[''];
  let module;
  try {
    module = await route.load();
  } catch (error) {
    console.error('[mount] 页面模块加载失败', key, error);
    return;
  }
  if (token !== mountToken) return;

  activePage = module[route.render](root, ctx);
  document.title = route.title;
  window.scrollTo(0, 0);
}

// router 只负责在 hash 变化时通知；渲染统一由 mount 处理
const router = createRouter(ROUTES, {
  onChange: (key) => mount(key),
});

router.start(); // 首次 resolve 触发 onChange -> mount 首页
