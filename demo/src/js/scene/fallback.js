/* ============================================================
   fallback.js — WebGL 能力检测 + 降级 UI
   B 档硬要求：不支持的浏览器必须看到友好页面，不能白屏
   ============================================================ */

/** 在当前环境探测 WebGL 支持情况 */
export function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');

    // 优先 WebGL2
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      gl2.getExtension('WEBGL_lose_context')?.loseContext();
      return { level: 'webgl2', ok: true };
    }

    // 回落 WebGL1
    const gl1 =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (gl1) {
      gl1.getExtension('WEBGL_lose_context')?.loseContext();
      return { level: 'webgl1', ok: true };
    }

    return { level: 'none', ok: false };
  } catch {
    return { level: 'none', ok: false };
  }
}

/**
 * 渲染降级页
 * @param {HTMLElement} host 容器
 * @param {string} [reason] 可选：附加说明
 */
export function renderFallback(host, reason) {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `
    <div class="overlay__card">
      <h2>当前浏览器不支持三维预览</h2>
      <p>建议使用最新版 Chrome / Edge / Safari 访问。</p>
      <p>本页面的展陈内容与交互逻辑在三维模式下完整呈现。</p>
      ${reason ? `<p class="muted">${reason}</p>` : ''}
      <div class="overlay__actions">
        <button class="btn btn--ghost" type="button">浏览图文版展厅</button>
        <a class="btn btn--ghost" href="#/">返回首页</a>
      </div>
    </div>
  `;
  host.appendChild(el);
  return el;
}

/** 渲染加载中覆盖层，返回 { el, done() } */
export function renderLoading(host, timeoutMs = 8000) {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="spinner" role="status" aria-label="正在加载三维场景"></div>`;
  host.appendChild(el);

  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    el.remove();
    renderFallback(host, '三维场景加载超时。');
  }, timeoutMs);

  return {
    el,
    done() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 400);
    },
  };
}
