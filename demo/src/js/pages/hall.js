/* ============================================================
   hall.js — 虚拟展厅（对应设计稿 S02）
   Step 1：全屏车间 + 可拖拽旋转
   本轮补齐：展品热点药丸（world→screen 投影）+ 信息卡（S02 右侧）
            + 场馆导航未开放反馈 + W/A/S/D 沿地面漫游 + 底栏画稿文案
   拾取复用 cast.js 同款思路：Raycaster + userData（热点挂 userData.hotspot）
   ============================================================ */

import * as THREE from 'three';
import { mountViewport } from '../scene/viewport.js';

/* 信息卡主按钮：默认入口是浇铸互动（#/cast）。
   机床类展项的入口是协作车削（#/turn，Step 3B 未上线）——未上线的入口按本页既有惯例
   给提示条，**不跳不存在的路由**（PAGES 里没有 turn，go('turn') 会静默回首页）。
   上线时只需把 CTA_TURN.go 改成 'turn'。 */
const CTA_CAST = { label: '进入浇铸互动', go: 'cast' };
const CTA_TURN = { label: '进入协作车削', go: null, notice: '「协作车削」模块尚未开放 · 敬请期待' };

/* 信息卡正文（spec/PROJECT-BRIEF.md §4 可用史实清单，照抄不改写）
   2C-R5.1 + R5-FIX：热点药丸集合由「冲天炉 / 天吊 / 砂箱」改为「冲天炉 / 砂箱 / 车床」
   —— **设计方在 `SCENE-LAYOUT-FIX-SPEC.md` §10.8-E 确认接受**：
   天吊是顶部叙事、药丸会被钳回屏内与展品脱节；C620-1 是全篇唯一有具体型号与史实的展品，
   之前反而没有标注。已核对评分规格未引用"天吊"热点，无回归。
   每件展品的 CTA 由 SPOT_INFO[id].cta 决定（缺省 = CTA_CAST，见 §10.8-E）。 */
const SPOT_INFO = {
  cupola: {
    title: '十吨冲天炉',
    body: '炉身高 12 米，总重 300 吨。1957 年投用至 2007 年熄火，服役半个世纪，累计熔化铁水近百万吨、生产铸件 60 余万吨。',
  },
  sandboxes: {
    title: '成型砂箱',
    body: '一件一箱，浇注即废。这 12 只砂箱是本作品的交互载体——点它们可以亲手浇一次。',
  },
  lathe: {
    title: 'C620-1 普通车床',
    body: '1955 年沈阳第一机床厂研制；图案登上第三套人民币 2 元纸币正面。年产量最高 2200 台，国内市场占有率超八成，远销 70 多个国家。',
    cta: CTA_TURN,
  },
};

/* W/A/S/D 漫游参数：速度与车间可活动范围（W=40 × D=60，留墙距） */
const MOVE_SPEED = 6;          // m/s
const BOUNDS = { x: 17, z: 28 };

export function renderHall(root, { go }) {
  const page = document.createElement('div');
  page.className = 'page';

  page.innerHTML = `
    <div class="hall">
      <section class="viewport" aria-label="铸造馆三维场景">
        <div class="hud">
          <button class="hud__back" type="button" data-go=""><span aria-hidden="true">←</span> 展馆总览</button>
          <span class="hud__divider" aria-hidden="true"></span>
          <span class="hud__title">
            <span class="hud__section num">03</span>
            铸造馆 · 翻砂车间
          </span>
          <div class="hud__spacer"></div>
          <span class="hud__badge">3D 实时展厅</span>
        </div>

        <div class="halls-notice" data-notice hidden aria-live="polite"></div>

        <p class="hint">拖拽鼠标环视 · W/A/S/D 移动 · 滚轮缩放</p>

        <aside class="exhibit-card" data-exhibit-card hidden aria-live="polite">
          <p class="eyebrow">重点展项 · 国家工业遗产</p>
          <h2 class="exhibit-card__title" data-exhibit-title></h2>
          <p class="exhibit-card__body" data-exhibit-body></p>
          <button class="btn btn--primary exhibit-card__cta" type="button" data-go="cast">进入浇铸互动</button>
        </aside>

        <div class="hotspots" data-hotspots aria-label="展品热点"></div>
      </section>
    </div>
  `;

  root.appendChild(page);

  // ---------- 三维视口 ----------
  const viewportEl = page.querySelector('.viewport');
  const vp = mountViewport(viewportEl);

  const camera = vp.camera;
  const $ = (sel) => page.querySelector(sel);
  const notice = $('[data-notice]');
  const card = $('[data-exhibit-card]');
  const cardTitle = $('[data-exhibit-title]');
  const cardBody = $('[data-exhibit-body]');
  const ctaBtn = $('.exhibit-card__cta');
  const spotWrap = $('[data-hotspots]');

  // ---------- 热点收集（scene 内 userData.hotspot → 药丸） ----------
  const hotspots = [];
  vp.scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  vp.scene.traverse((o) => {
    const hs = o.userData?.hotspot;
    if (!hs || !SPOT_INFO[hs.id]) return;
    box.setFromObject(o);
    box.getCenter(center);
    hotspots.push({
      ...hs,
      anchor: new THREE.Vector3(center.x, box.max.y + 0.5, center.z),
      el: null,
    });
  });
  for (const hs of hotspots) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot';
    btn.dataset.hotspot = hs.id;
    btn.textContent = hs.title;
    btn.setAttribute('aria-pressed', 'false');
    spotWrap.appendChild(btn);
    hs.el = btn;
  }

  function selectHotspot(id) {
    let any = false;
    for (const hs of hotspots) {
      const on = hs.id === id;
      if (on) any = true;
      hs.el.classList.toggle('is-active', on);
      hs.el.setAttribute('aria-pressed', String(on));
    }
    if (any) {
      const info = SPOT_INFO[id];
      const cta = info.cta ?? CTA_CAST;
      cardTitle.textContent = info.title;
      cardBody.textContent = info.body;
      // 主按钮随展项切换：有模块的走路由，未上线的只给提示条（不跳不存在的路由）
      ctaBtn.textContent = cta.label;
      if (cta.go) {
        ctaBtn.dataset.go = cta.go;
        delete ctaBtn.dataset.ctaNotice;
      } else {
        delete ctaBtn.dataset.go;
        ctaBtn.dataset.ctaNotice = cta.notice ?? '该模块尚未开放 · 敬请期待';
      }
      card.hidden = false;
    } else {
      card.hidden = true;
    }
  }
  selectHotspot('cupola');   // 进馆默认亮出冲天炉信息卡（S02 即此状态）

  spotWrap.addEventListener('click', selectHandler);

  // ---------- 未上线展项：给明确反馈，不静默 ----------
  let noticeTimer = 0;
  function showNotice(text) {
    notice.textContent = text;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 2600);
  }

  // ---------- W/A/S/D 沿地面漫游（相机与 target 同步平移，不破坏旋转缩放） ----------
  const keys = new Set();
  const onKeyDown = (e) => { const k = e.key.toLowerCase(); if ('wasd'.includes(k) && k.length === 1) keys.add(k); };
  const onKeyUp = (e) => { const k = e.key.toLowerCase(); if ('wasd'.includes(k) && k.length === 1) keys.delete(k); };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  let lastT = 0;

  function tick(t) {
    // 热点投影：世界锚点 → 屏幕坐标（每帧更新，不写死坐标）；
    // 高展品（天吊）在默认机位下锚点会投影到屏外，钳回屏内保证药丸可见
    for (const hs of hotspots) {
      const v = hs.anchor.clone().project(camera);
      const behind = v.z > 1;
      const w = viewportEl.clientWidth, h = viewportEl.clientHeight;
      hs.el.style.display = behind ? 'none' : '';
      if (!behind) {
        const px = (v.x * 0.5 + 0.5) * w;
        const py = (-v.y * 0.5 + 0.5) * h;
        hs.el.style.left = `${Math.min(Math.max(px, 48), w - 48)}px`;
        hs.el.style.top = `${Math.min(Math.max(py, 68), h - 12)}px`;   // 下限 68：让出 HUD 高度
      }
    }
    // W/A/S/D：沿相机朝向的地面分量平移
    const dt = Math.min((t - lastT) / 1000, 0.05) || 0;
    lastT = t;
    if (keys.size) {
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      right.crossVectors(forward, UP);   // forward × up = 屏幕右方（右手系）
      let dx = 0, dz = 0;
      if (keys.has('w')) { dx += forward.x; dz += forward.z; }
      if (keys.has('s')) { dx -= forward.x; dz -= forward.z; }
      if (keys.has('d')) { dx += right.x; dz += right.z; }
      if (keys.has('a')) { dx -= right.x; dz -= right.z; }
      const len = Math.hypot(dx, dz);
      if (len > 0) {
        const step = (MOVE_SPEED * dt) / len;
        const cam = camera.position, tgt = controlsTarget();
        const nx = THREE.MathUtils.clamp(cam.x + dx * step, -BOUNDS.x, BOUNDS.x);
        const nz = THREE.MathUtils.clamp(cam.z + dz * step, -BOUNDS.z, BOUNDS.z);
        const ax = nx - cam.x, az = nz - cam.z;   // 被墙截断后的实际位移
        cam.x = nx; cam.z = nz;
        tgt.x = THREE.MathUtils.clamp(tgt.x + ax, -BOUNDS.x, BOUNDS.x);
        tgt.z = THREE.MathUtils.clamp(tgt.z + az, -BOUNDS.z, BOUNDS.z);
      }
    }
    rafId = requestAnimationFrame(tick);
  }
  // target 经 controls 访问（mountViewport 未单独暴露 target 对象）
  const controlsTarget = () => vp.controls.target;
  let rafId = requestAnimationFrame(tick);

  function onClick(e) {
    const btn = e.target.closest('[data-go]');
    if (btn) { go(btn.dataset.go); return; }
    // 未上线的展项入口（信息卡主按钮 data-cta-notice）：给提示条，不跳不存在的路由
    const pending = e.target.closest('[data-cta-notice]');
    if (pending) showNotice(pending.dataset.ctaNotice);
  }
  page.addEventListener('click', onClick);

  return {
    dispose() {
      cancelAnimationFrame(rafId);
      clearTimeout(noticeTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      spotWrap.removeEventListener('click', selectHandler);
      page.removeEventListener('click', onClick);
      vp.dispose();
      page.remove();
    },
  };

  function selectHandler(e) {
    const btn = e.target.closest('.hotspot');
    if (!btn) return;
    // 再点已选中的切回默认（冲天炉），便于收起/比较
    selectHotspot(btn.classList.contains('is-active') ? 'cupola' : btn.dataset.hotspot);
  }
}
