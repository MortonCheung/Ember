/* ============================================================
   entrance.js — 序厅（对应设计稿 S07「序厅·炉前」，路由 #/entrance，Step 4C）
   依据：spec/ENTRANCE-FURNACE-SPEC.md（2026-09-18 起 #/entrance 唯一依据）
   结构复用 #/hall 骨架（HUD / 药丸 / 热点药丸 / 信息卡），差异：
   · 不做小地图（单件场景无导航意义）→ 底部居中「进场序列」
   · 左下说明条（§7 表 7:28，真实锚点：《铁流凝变》为序厅真实馆藏）
   · 右下操作提示 · 热点药丸两枚（炉口 / 铁水沟，§7 表）
   · 信息卡主按钮指向铸造馆（#/hall），不是浇铸
   场景经 mountViewport 传参注入（buildScene / cameraPos / target /
   debugKey / views），默认参数零改动（R3 不回归）。
   ============================================================ */

import * as THREE from 'three';
import { mountViewport } from '../scene/viewport.js';
import { buildEntranceScene, entranceLayout, entranceSilhouette, e5ScreenPoints } from '../scene/entrance-scene.js';
import { venueNavHTML, handleVenueClick } from '../venues.js';

/* §5 机位预设（Step 4C）：default 逐字不动（不回归门禁）；sculpture / splash 已删除 */
const VIEWS = {
  default: { pos: [0, 3.2, 23],     target: [0, 5.6, 0] },
  furnace: { pos: [0, 2.6, 0],      target: [0, 5.2, -14] },
  runner:  { pos: [3.2, 1.5, 7.0],  target: [0, 0.9, -6.0] },
  pool:    { pos: [0, 4.5, 12.5],   target: [0, 0.15, 5.0] },
  steel:   { pos: [-11, 6.5, 9],    target: [0, 8, -11] },
  wide:    { pos: [-14, 8, 26],     target: [0, 5, -6] },
};

/* §1.5：序厅比车间小，别让观众走出墙体 */
const MOVE_SPEED = 6;
const BOUNDS = { x: 10, z: 14 };

export function renderEntrance(root, { go }) {
  const page = document.createElement('div');
  page.className = 'page';

  page.innerHTML = `
    <div class="hall entrance">
      <section class="viewport" aria-label="序厅三维场景">
        <div class="hud">
          <button class="hud__back" type="button" data-go="">‹ 返回首页</button>
          <span class="hud__title">
            <span class="logo__mark" aria-hidden="true"></span>
            虚拟展厅 · 序厅
          </span>
          <div class="hud__spacer"></div>
          <span class="hud__badge"><span class="hud__dot"></span>WebGL 自由漫游</span>
          <button class="btn btn--ghost hud__xr" type="button" aria-disabled="true"
                  title="沉浸模式需连接 VR 设备">进入 WebXR 沉浸模式</button>
        </div>

        <nav class="halls" aria-label="场馆导航">
          ${venueNavHTML('序厅')}
        </nav>

        <div class="halls-notice" data-notice hidden aria-live="polite"></div>

        <div class="hotspots" data-hotspots aria-label="展品热点"></div>

        <aside class="exhibit-card" data-exhibit-card aria-live="polite">
          <!-- §7 表 7:30 / 7:31 / 7:32（逐字，不得越 3 行上限） -->
          <p class="eyebrow">序厅 · 主题「炉火不灭」</p>
          <h2 class="exhibit-card__title">《炉前》</h2>
          <p class="exhibit-card__body">整面后墙就是炉壁：46 × 18 m，中央炉口 12.0 × 7.5 m，后面是 5 m 深炉膛；铁水从炉口斜下汇成熔池，炉火在缓慢呼吸，不灭。</p>
          <button class="btn btn--primary exhibit-card__cta" type="button" data-go="hall">进入铸造馆 →</button>
        </aside>

        <!-- §7 表 7:28：说明条（左下；真实锚点——《铁流凝变》是序厅真实馆藏，不许写否认它存在的话） -->
        <p class="entrance-strip">序厅镇馆铜雕《铁流凝变》· 长 22 m、高 11.5 m、重 50 吨 —— 这座炉子是它的一次再点火。</p>

        <!-- §1.6：进场序列（底部居中，序厅高亮） -->
        <nav class="sequence" aria-label="进场序列">
          <span class="sequence__item">厂区外景</span>
          <span class="sequence__sep" aria-hidden="true">›</span>
          <span class="sequence__item is-current" aria-current="step">序厅</span>
          <span class="sequence__sep" aria-hidden="true">›</span>
          <span class="sequence__item">铸造馆</span>
        </nav>

        <p class="hint">拖拽环视 · 滚轮缩放</p>
        <!-- 单件场景无导航意义：不做 .minimap（§1.6） -->
      </section>
    </div>
  `;

  root.appendChild(page);

  // ---------- 三维视口（全部传参，mountViewport 默认值不动） ----------
  const viewportEl = page.querySelector('.viewport');
  const vp = mountViewport(viewportEl, {
    buildScene: buildEntranceScene,
    cameraPos: VIEWS.default.pos,
    target: VIEWS.default.target,
    debugKey: '__entrance',
    views: VIEWS,
  });
  // §3：旧 Step 4A 的 envMapIntensity=4.5 覆写已删 —— 雕塑不存在了，那行是给青铜材质写的
  const camera = vp.camera;

  const $ = (sel) => page.querySelector(sel);
  const notice = $('[data-notice]');
  const spotWrap = $('[data-hotspots]');

  // ---------- 热点药丸两枚（§7 表 7:36 + 新增）：炉口 / 铁水沟，世界锚点投影 ----------
  const hotspots = [
    { id: 'furnace-mouth', title: '炉口', anchor: new THREE.Vector3(0, 9.2, -14), el: null },
    { id: 'runner', title: '铁水沟', anchor: new THREE.Vector3(0, 0.45, 3.5), el: null },
  ];
  for (const hs of hotspots) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot is-active';
    btn.dataset.hotspot = hs.id;
    btn.textContent = hs.title;
    btn.setAttribute('aria-pressed', 'true');
    spotWrap.appendChild(btn);
    hs.el = btn;
  }
  // 单件场景：信息卡常显（S07 即此状态），点药丸只切换该枚的选中态（§3 药丸行为）
  function toggleHotspot(e) {
    const btn = e.target.closest('[data-hotspot]');
    if (!btn) return;
    const on = !btn.classList.contains('is-active');
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', String(on));
  }
  spotWrap.addEventListener('click', toggleHotspot);

  // ---------- 场馆导航（共享接线：三枚走路由 / 两枚提示条） ----------
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

  // ---------- W/A/S/D 漫游（同 hall 惯例，边界为序厅的 ±10 / ±14） ----------
  const keys = new Set();
  const onKeyDown = (e) => { const k = e.key.toLowerCase(); if ('wasd'.includes(k) && k.length === 1) keys.add(k); };
  const onKeyUp = (e) => { const k = e.key.toLowerCase(); if ('wasd'.includes(k) && k.length === 1) keys.delete(k); };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  let lastT = 0;
  let rafId = 0;

  function tick(t) {
    for (const hs of hotspots) {
      const v = hs.anchor.clone().project(camera);
      const behind = v.z > 1;
      const w = viewportEl.clientWidth, h = viewportEl.clientHeight;
      hs.el.style.display = behind ? 'none' : '';
      if (!behind) {
        const px = (v.x * 0.5 + 0.5) * w;
        const py = (-v.y * 0.5 + 0.5) * h;
        hs.el.style.left = `${Math.min(Math.max(px, 48), w - 48)}px`;
        hs.el.style.top = `${Math.min(Math.max(py, 68), h - 12)}px`;
      }
    }
    const dt = Math.min((t - lastT) / 1000, 0.05) || 0;
    lastT = t;
    if (keys.size) {
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      right.crossVectors(forward, UP);
      let dx = 0, dz = 0;
      if (keys.has('w')) { dx += forward.x; dz += forward.z; }
      if (keys.has('s')) { dx -= forward.x; dz -= forward.z; }
      if (keys.has('d')) { dx += right.x; dz += right.z; }
      if (keys.has('a')) { dx -= right.x; dz -= right.z; }
      const len = Math.hypot(dx, dz);
      if (len > 0) {
        const step = (MOVE_SPEED * dt) / len;
        const cam = camera.position, tgt = vp.controls.target;
        const nx = THREE.MathUtils.clamp(cam.x + dx * step, -BOUNDS.x, BOUNDS.x);
        const nz = THREE.MathUtils.clamp(cam.z + dz * step, -BOUNDS.z, BOUNDS.z);
        const ax = nx - cam.x, az = nz - cam.z;
        cam.x = nx; cam.z = nz;
        tgt.x = THREE.MathUtils.clamp(tgt.x + ax, -BOUNDS.x, BOUNDS.x);
        tgt.z = THREE.MathUtils.clamp(tgt.z + az, -BOUNDS.z, BOUNDS.z);
      }
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  function onClick(e) {
    const btn = e.target.closest('[data-go]');
    if (btn) { go(btn.dataset.go); return; }
  }
  page.addEventListener('click', onClick);

  // ---------- 调试钩子（?debug=1）：验收判据 + 剪影测试 + E5 采样点挂到 window.__entrance ----------
  // viewport.js 已挂好通用 debug 对象（scene/camera/controls/renderer/setView/info），
  // 这里把 layout()/silhouette() 覆盖为本页版本（layout 为 async：E6 需跨 ~9 s 采样呼吸周期）。
  // viewport.js 本体零改动（R3/R4：默认参数与冻结几何不动）。
  if (new URLSearchParams(location.search).has('debug') && window.__entrance) {
    const dbg = window.__entrance;
    window.__entrance = {
      ...dbg,
      layout: () => entranceLayout({
        scene: dbg.scene, camera: dbg.camera,
        controls: dbg.controls, renderer: dbg.renderer, views: VIEWS,
      }),
      silhouette: (on) => entranceSilhouette(dbg.scene, on),
      e5Samples: (view) => e5ScreenPoints(dbg.camera, dbg.renderer, view),
    };
  }

  return {
    dispose() {
      cancelAnimationFrame(rafId);
      clearTimeout(noticeTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      halls.removeEventListener('click', onNavClick);
      spotWrap.removeEventListener('click', toggleHotspot);
      page.removeEventListener('click', onClick);
      vp.dispose();
      page.remove();
    },
  };
}
