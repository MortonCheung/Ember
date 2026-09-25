/* ============================================================
   router.js — 极简 hash 路由
   路由表由 main.js 注入；本模块只负责解析、规范化与通知。
   ============================================================ */

export function createRouter(routes, { onChange } = {}) {
  let current = null;

  function parse() {
    const raw = location.hash.replace(/^#\/?/, '').trim();
    return raw === '' ? '' : raw;
  }

  function resolve() {
    const requested = parse();
    const key = Object.prototype.hasOwnProperty.call(routes, requested) ? requested : '';
    // 未匹配路由不再只是“看起来像首页”：同步规范化 URL，
    // 避免 #/unknown 与首页内容同时出现造成身份混乱。
    if (requested !== key) {
      history.replaceState(null, '', `${location.pathname}${location.search}#/`);
    }
    const handler = routes[key];
    if (key !== current) {
      const prev = current;
      current = key;
      onChange?.(key, prev);
    }
    return handler;
  }

  function start() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return {
    start,
    get current() { return current; },
    go(key) {
      const next = '#/' + key;
      if (location.hash === next) resolve();
      else location.hash = next;
    },
  };
}
