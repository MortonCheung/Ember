/* ============================================================
   environment.js — 环境细节（低成本高回报）
   依据：spec/SCENE-ASSETS-STEP2.md §3 / §4
        spec/SCENE-LAYOUT-FIX-SPEC.md §4.2（警示线平移）、§5-1/5-5/5-6（悬空处置）、
        §9.3 段数表、§9.4 G 组细节
   地面油渍 · 墙面高窗 · 顶部吊灯 · 粉尘 · 警示线 · 管道
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from './merge.js';
import { makeFloorRoughnessMap, makeHazardTexture } from './textures.js';
import { HALL } from './workshop.js';

const LAMP_COLOR = 0xC8D8E8;   // §4 顶部吊灯冷白
const WINDOW_COLOR = 0xBFD4E6; // 高窗 / 灯泡同族冷白

// 高窗（贴后墙）：位置是与 workshop 共建窗框的共享常量
const WINDOW_XS = [-13.5, -4.5, 4.5, 13.5];
const WINDOW_Y = 22;
const D_WIN = 60;              // = HALL.D，用于推导贴墙 z
const WINDOW_Z = -D_WIN / 2 + 0.17;
const WALL_INNER = -D_WIN / 2 + 0.15;   // 后墙内表面

/** §5-1：吊灯吊杆顶端必须抵住屋架下弦梁底面 28.66 */
const ROD_LEN = 11.5;
const ROD_CENTER_Y = 22.91;
const LAMP_Z = [-17.33, 0, 17.33];      // 对齐 7 道横梁的 z 坐标

/**
 * G1 高窗窗框 + 竖梃（几何数组）。
 * ⚠️ high_windows 是 MeshBasicMaterial（自发光、不受光），深色窗框不能并进去——
 *    由 workshop.js 合并到 `trusses`（同深色系）。
 */
export function buildWindowFrameGeos() {
  const geos = [];
  for (const x of WINDOW_XS) {
    const zF = WINDOW_Z + 0.05;    // 略压在发光板前方，形成"框住"的读法
    for (const [w, h, dy] of [[3.6, 0.10, 1.25], [3.6, 0.10, -1.25]]) {
      const bar = new THREE.BoxGeometry(w, h, 0.08);
      bar.translate(x, WINDOW_Y + dy, zF);
      geos.push(bar);
    }
    for (const dx of [-1.75, 1.75]) {
      const bar = new THREE.BoxGeometry(0.10, 2.6, 0.08);
      bar.translate(x + dx, WINDOW_Y, zF);
      geos.push(bar);
    }
    const mullion = new THREE.BoxGeometry(0.10, 2.4, 0.10);
    mullion.translate(x, WINDOW_Y, zF);
    geos.push(mullion);
  }
  return geos;
}

export function buildEnvironment(floor) {
  const group = new THREE.Group();
  group.name = 'environment';
  const W = HALL.W, D = HALL.D, H = HALL.H;
  const disposables = [];

  // ---------- 地面贴图挂载（W1 §2.3/§2.5：repeat 由尺寸算出，不再在函数里写死）----------
  const roughMap = makeFloorRoughnessMap({ size: 512 });
  roughMap.repeat.set(Math.round(W / 5), Math.round(D / 5));   // 40×60 → (8, 12)
  floor.material.roughnessMap = roughMap;
  floor.material.needsUpdate = true;
  disposables.push(roughMap);

  // ---------- 地面板缝（W1 §2.4：用几何画，不用贴图 —— 缝需要颜色差异）----------
  // 沿 x 方向：W/5+1 条（分隔 z）；沿 z 方向：D/5+1 条（分隔 x）。合并 1 mesh = +1 draw call。
  {
    const seamGeos = [];
    const nx = Math.round(W / 5) + 1;
    const nz = Math.round(D / 5) + 1;
    for (let i = 0; i < nx; i++) {
      const x = -W / 2 + i * (W / (nx - 1));
      seamGeos.push(new THREE.PlaneGeometry(0.06, D).rotateX(-Math.PI / 2).translate(x, 0.006, 0));
    }
    for (let i = 0; i < nz; i++) {
      const z = -D / 2 + i * (D / (nz - 1));
      seamGeos.push(new THREE.PlaneGeometry(W, 0.06).rotateX(-Math.PI / 2).translate(0, 0.006, z));
    }
    const seams = new THREE.Mesh(
      mergeGeometries(seamGeos),
      new THREE.MeshBasicMaterial({
        color: 0x161A20, transparent: true, opacity: 0.85, depthWrite: false,
      })
    );
    seams.name = 'ground_seams';
    seams.renderOrder = 1;      // y=0.006，不得为 0（否则与地面 z-fighting）
    group.add(seams);
    disposables.push(seams.geometry, seams.material);
  }

  // ---------- 墙面高窗：4 个发光板 + G2 灯泡（同为冷白 MeshBasicMaterial）----------
  const winGeos = [];
  for (const x of WINDOW_XS) {
    const g = new THREE.PlaneGeometry(3.4, 2.4);
    g.translate(x, WINDOW_Y, WINDOW_Z);
    winGeos.push(g);
  }
  // 灯具集合（灯罩 + 吊杆 + 灯泡位置）
  const shadeGeos = [];
  const lampPositions = [];
  for (const x of [-10, 10]) {
    for (const z of LAMP_Z) {
      lampPositions.push([x, z]);
      // G2：灯罩由实心方盒改为"倒锥开口罩"，罩内可见灯泡
      const cone = new THREE.CylinderGeometry(0.30, 0.85, 0.30, 36, 1, true);   // Ø1.7 ≥0.5m
      cone.translate(x, 17.2, z);
      shadeGeos.push(cone);
      // §5-1：吊杆加长到 11.5，杆顶 28.66 = 屋架下弦梁底面
      const rod = new THREE.CylinderGeometry(0.03, 0.03, ROD_LEN, 10);
      rod.translate(x, ROD_CENTER_Y, z);
      shadeGeos.push(rod);
      // 灯泡并入 high_windows（自发光，冷白）
      const bulb = new THREE.SphereGeometry(0.12, 12, 10);
      bulb.translate(x, 17.13, z);
      winGeos.push(bulb);
    }
  }
  const windows = new THREE.Mesh(
    mergeGeometries(winGeos),
    new THREE.MeshBasicMaterial({ color: WINDOW_COLOR })
  );
  windows.name = 'high_windows';
  group.add(windows);
  disposables.push(windows.geometry, windows.material);

  const shades = new THREE.Mesh(mergeGeometries(shadeGeos),
    new THREE.MeshStandardMaterial({ color: 0x2A2F36, roughness: 0.6, metalness: 0.4 }));
  shades.name = 'lamp_shades';
  group.add(shades);
  disposables.push(shades.geometry, shades.material);

  for (const [x, z] of lampPositions) {
    const p = new THREE.PointLight(LAMP_COLOR, 0.4, 18, 1.6);
    p.position.set(x, 16.9, z);
    group.add(p);
  }

  // ---------- 粉尘：少量 Points 缓慢上浮 ----------
  const COUNT = 140;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * (W - 8);
    positions[i * 3 + 1] = 1 + Math.random() * 21;
    positions[i * 3 + 2] = (Math.random() - 0.5) * (D - 8);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: LAMP_COLOR, size: 0.09, transparent: true, opacity: 0.28,
    depthWrite: false, sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.name = 'dust';
  group.add(dust);
  disposables.push(dustGeo, dustMat);

  // ---------- 警示线：黄黑斜纹，沿作业区边界 ----------
  // W1 §2.7：**6 段共用 1 张贴图**（原来每段 hazardTex.clone() = 6 张独立贴图）。
  // 各段的重复次数改由缩放几何 UV 实现 —— 视觉完全不变，贴图数 −5。
  const hazardTex = makeHazardTexture(256);
  disposables.push(hazardTex);
  const hazardMat = new THREE.MeshBasicMaterial({
    map: hazardTex, transparent: true, opacity: 0.5, depthWrite: false,
  });
  disposables.push(hazardMat);

  const strips = [];
  const addStrip = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const geo = new THREE.PlaneGeometry(0.28, len);
    const uv = geo.attributes.uv;
    const k = Math.round(len / 0.5);                 // 原 mat.map.repeat.x 的值，改写在 UV 上
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * k);
    uv.needsUpdate = true;
    const m = new THREE.Mesh(geo, hazardMat);        // ← 共用同一张 hazardTex（repeat 保持 1,1）
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = Math.atan2(x1 - x0, z1 - z0);
    m.position.set((x0 + x1) / 2, 0.015, (z0 + z1) / 2);
    strips.push(m);
    disposables.push(geo);
  };

  // §3-④ 砂箱作业区四段（2C-R3：随砂箱缩到 0.7 后收回新阵列外沿；每边外扩 1.0m 的约定不变）
  // 新阵列世界范围 x 4.19–8.81、z −2.01–4.01 → 作业区取整 x 3.2–9.8、z −3.0–5.0
  addStrip(3.2, -3.0, 9.8, -3.0);   // 后缘
  addStrip(3.2, 5.0, 9.8, 5.0);     // 前缘
  addStrip(3.2, -3.0, 3.2, 5.0);    // 左缘
  addStrip(9.8, -3.0, 9.8, 5.0);    // 右缘
  // 冲天炉炉前作业区（保持不变：放大后的出铁口与新增铁水包仍落在区间内）
  addStrip(-9, -2.5, -3, -2.5);
  addStrip(-9, 6.5, -3, 6.5);
  for (const s of strips) group.add(s);

  // ---------- 管道：沿墙走的 3 横 1 竖（§5-5 / §5-6：全部贴墙）----------
  const pipeGeos = [];
  const PIPE_R = 0.12;
  const PIPE_LEN = W - 0.3;            // 端头恰落在两侧墙内表面 ±19.85
  // 管中心距墙内表面 0.15：横管外表面离墙 0.03（原 −29.4 离墙 0.45m），
  // 法兰盘（r 0.15）外缘正好贴到墙内表面 —— 二者都不得穿墙。
  const PIPE_Z = WALL_INNER + 0.15;
  const PIPE_YS = [3.5, 4.0, 4.5];

  for (const y of PIPE_YS) {
    const g = new THREE.CylinderGeometry(PIPE_R, PIPE_R, PIPE_LEN, 20);  // §9.3：8 → 20 段
    g.rotateZ(Math.PI / 2);
    g.translate(0, y, PIPE_Z);
    pipeGeos.push(g);

    // G3 ① 法兰盘：每根横管两端 + 中段
    for (const fx of [-PIPE_LEN / 2 + 0.25, 0, PIPE_LEN / 2 - 0.25]) {
      const fl = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20);
      fl.rotateZ(Math.PI / 2);
      fl.translate(fx, y, PIPE_Z);
      pipeGeos.push(fl);
    }
    // G3 ② 弯头：横管左端转入墙内的一段弯（贴墙处，读作穿墙）
    const elbow = new THREE.TorusGeometry(0.24, PIPE_R, 10, 36, Math.PI / 2);   // Ø0.72 ≥0.5m
    elbow.rotateX(Math.PI / 2);
    elbow.translate(-PIPE_LEN / 2, y, PIPE_Z);
    pipeGeos.push(elbow);
    // G3 ③ 吊架 ×5：贴墙立板 + 挑臂托住管道
    for (let i = 0; i < 5; i++) {
      const hx = -16 + i * 8;
      const plate = new THREE.BoxGeometry(0.10, 0.12, 0.30);
      plate.translate(hx, y, WALL_INNER + 0.15);
      pipeGeos.push(plate);
      const arm = new THREE.BoxGeometry(0.30, 0.06, 0.06);
      arm.translate(hx, y, PIPE_Z);
      pipeGeos.push(arm);
    }
  }

  // §5-6 左墙立管：贴墙、高度 6 → 28.5（升到屋架）+ 底部法兰
  const RISER_X = -W / 2 + 0.30;       // −19.70：法兰外缘贴到左墙内表面 −19.85，不穿墙
  const RISER_H = 28.5;
  const riser = new THREE.CylinderGeometry(PIPE_R, PIPE_R, RISER_H, 20);
  riser.translate(RISER_X, RISER_H / 2, -12);
  pipeGeos.push(riser);
  for (const fy of [8, 20]) {
    const fl = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20);
    fl.translate(RISER_X, fy, -12);
    pipeGeos.push(fl);
  }
  const foot = new THREE.BoxGeometry(0.28, 0.06, 0.34);
  foot.translate(RISER_X, 0.03, -12);
  pipeGeos.push(foot);

  const pipes = new THREE.Mesh(mergeGeometries(pipeGeos),
    new THREE.MeshStandardMaterial({ color: 0x353B43, roughness: 0.55, metalness: 0.6 }));
  pipes.name = 'wall_pipes';
  pipes.castShadow = true;
  group.add(pipes);
  disposables.push(pipes.geometry, pipes.material);

  // ---------- 粉尘动画 ----------
  let lastT = 0;
  function update(t) {
    const dt = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;
    const attr = dust.geometry.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      let y = attr.getY(i) + dt * 0.12;
      if (y > 23) y = 1;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  }

  return {
    group,
    update,
    dispose() {
      for (const d of disposables) d.dispose?.();
    },
  };
}
