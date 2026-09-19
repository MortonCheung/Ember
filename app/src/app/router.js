/* ============================================================
   router.js — 极简 hash 路由
   路由表："" (首页) | "hall" (展厅)
   ============================================================ */

export function createRouter(routes, { onChange } = {}) {
  let current = null;

  function parse() {
    const raw = location.hash.replace(/^#\/?/, '').trim();
    return raw === '' ? '' : raw;
  }

  function resolve() {
    const key = parse();
    // 未匹配则回落首页
    const handler = routes[key] ?? routes[''];
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
