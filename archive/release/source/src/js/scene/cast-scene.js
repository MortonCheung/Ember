/* ============================================================
   cast-scene.js — 「亲手浇铸」小场景（Step 3，spec §12.9）
   构成：12 只砂箱（复用 props/sandboxes.js 的 InstancedMesh）
        + 浇包 + 冲天炉剪影 + 地面油渍 + 开箱动画
   纪律：不修改 workshop/props/environment/textures，只 import 复用；
        无 Math.random（伪随机用确定性 hash，spec §12 纪律 2）；
        开箱动画计时用帧差且单帧上限 50ms —— 标签页隐藏时 rAF 停止，
        回来从断点继续（E10：不跳步、不结算）。
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from './merge.js';
import { buildSandboxes } from './props/sandboxes.js';
import { makeFloorRoughnessMap } from './textures.js';

const C = {
  floor:   0x23282F,   // W1 §2.3：与铸造馆同一块地坪配方
  ember:   0xE8663C,
  iron:    0x3A4149,
  dark:    0x1A1E24,
};

const OPEN_MS = 2000;          // §2 ④：开箱时长 2.0s
const LIFT_H = 1.15;           // 上箱抬起高度（m）
const PARTICLES = 110;         // 型砂粒子数

/** 确定性伪随机（替代 Math.random，同输入永远同输出） */
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/* ---------- 缺陷铸件贴图（§2 ④：按缺陷画在贴图上，3 档以内可控） ---------- */
function makeIngotTexture({ pits = 0, notch = false, bulge = false }) {
  const w = 256, h = 192;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // 铸铁基底
  ctx.fillStyle = '#7A8087';
  ctx.fillRect(0, 0, w, h);
  // 浇注后表面氧化色斑
  for (let i = 0; i < 24; i++) {
    const x = hash(i * 3.7) * w, y = hash(i * 9.1 + 5) * h;
    const r = 8 + hash(i * 5.3) * 26;
    ctx.fillStyle = `rgba(58,63,70,${0.12 + hash(i) * 0.18})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 气孔 → 表面暗色凹点（数量 ∩ 扣分档位，确定性）
  for (let i = 0; i < pits; i++) {
    const x = 18 + hash(i * 2.9 + 1) * (w - 36);
    const y = 16 + hash(i * 7.7 + 2) * (h - 32);
    const r = 2 + hash(i * 4.1 + 3) * 4;
    ctx.fillStyle = 'rgba(18,20,24,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,126,134,0.5)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // 冷隔 → 顶部缺口
  if (notch) {
    ctx.fillStyle = '#23282F';
    ctx.beginPath();
    ctx.moveTo(w * 0.36, 0);
    ctx.lineTo(w * 0.58, 0);
    ctx.lineTo(w * 0.5, h * 0.16);
    ctx.closePath();
    ctx.fill();
  }
  // 胀砂 → 轮廓外凸（侧缘亮色鼓包）
  if (bulge) {
    for (let i = 0; i < 4; i++) {
      const y = h * 0.3 + i * h * 0.14;
      ctx.fillStyle = 'rgba(158,164,172,0.85)';
      ctx.beginPath();
      ctx.ellipse(w - 4, y, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- 浇包（铁水包：包体 + 吊轴 + 浇嘴 + 包口火色） ---------- */
function buildLadle() {
  const group = new THREE.Group();
  group.name = 'ladle';

  const bodyMat = new THREE.MeshStandardMaterial({ color: C.iron, roughness: 0.62, metalness: 0.55 });
  const geos = [];
  // 锥台包体（上大下小）
  const body = new THREE.CylinderGeometry(1.05, 0.78, 1.5, 14);
  body.translate(0, 0.95, 0);
  geos.push(body);
  // 包底托圈
  const rim = new THREE.TorusGeometry(0.8, 0.07, 8, 20);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, 0.28, 0);
  geos.push(rim);
  // 两只吊轴
  for (const s of [-1, 1]) {
    const pin = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8);
    pin.rotateZ(Math.PI / 2);
    pin.translate(s * 1.08, 1.62, 0);
    geos.push(pin);
  }
  // 浇嘴（斜口槽）
  const spout = new THREE.BoxGeometry(0.34, 0.5, 0.66);
  spout.rotateX(-0.6);
  spout.translate(0, 1.72, 0.98);
  geos.push(spout);

  const bodyMesh = new THREE.Mesh(mergeGeometries(geos), bodyMat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // 包口铁水面（自发光，火色）
  const meltMat = new THREE.MeshStandardMaterial({
    color: 0xE8663C, emissive: 0xE8663C, emissiveIntensity: 1.6, roughness: 0.4,
  });
  const melt = new THREE.Mesh(new THREE.CircleGeometry(0.98, 18), meltMat);
  melt.rotation.x = -Math.PI / 2;
  melt.position.y = 1.71;
  group.add(melt);

  // 包口点光：本场景的暖色主源
  const light = new THREE.PointLight(C.ember, 2.2, 15, 1.5);
  light.position.set(0, 2.2, 0);
  group.add(light);

  group.position.set(12.4, 0, 5.8);
  group.rotation.y = -2.19;   // 浇嘴朝向砂箱阵列

  return {
    group,
    meltMat,
    light,
    dispose() {
      bodyMesh.geometry.dispose();
      bodyMat.dispose();
      melt.geometry.dispose();
      meltMat.dispose();
    },
  };
}

/* ---------- 冲天炉剪影（背景层，低细节暗色） ---------- */
function buildCupolaSilhouette() {
  const mat = new THREE.MeshStandardMaterial({ color: C.dark, roughness: 0.95, metalness: 0.1 });
  const geos = [];
  const body = new THREE.CylinderGeometry(1.9, 2.3, 10.5, 12);
  body.translate(0, 5.25, 0);
  geos.push(body);
  const top = new THREE.ConeGeometry(2.1, 1.6, 12);
  top.translate(0, 11.3, 0);
  geos.push(top);
  const base = new THREE.BoxGeometry(5.4, 1.1, 5.4);
  base.translate(0, 0.55, 0);
  geos.push(base);
  const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
  mesh.name = 'cupola_silhouette';

  // 风口带火色环（呼吸微光，叙事上与主车间冲天炉同源）
  const ringMat = new THREE.MeshStandardMaterial({
    color: C.ember, emissive: C.ember, emissiveIntensity: 1.2, roughness: 0.6,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.06, 6, 24), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.2;

  const group = new THREE.Group();
  group.name = 'cupola_sil';
  group.add(mesh, ring);
  group.position.set(-1.5, 0, -16);
  return {
    group, ring,
    dispose() {
      mesh.geometry.dispose();
      mat.dispose();
      ring.geometry.dispose();
      ringMat.dispose();
    },
  };
}

/**
 * 构建浇铸小场景
 * @returns {{
 *   group: THREE.Group,
 *   update(t:number):void,
 *   dispose():void,
 *   pickMeshes: THREE.InstancedMesh[],
 *   setSelected(idx:number|null):void,
 *   setConsumed(ids:Set<number>):void,
 *   openBox(idx:number, defects:{pits:number,notch:boolean,bulge:boolean}, onDone:Function):void,
 *   finishOpen():void,
 *   resetBoxes():void,
 * }}
 */
export function buildCastScene() {
  const group = new THREE.Group();
  group.name = 'cast_scene';

  // ---------- 地面（W1 §2.3：44×40 @(4,0,0)，盖住冲天炉与整个作业区）----------
  // 原 40×34 @(6,0,2) → z ∈ [−15,19]，而冲天炉在 z=−16，整体漂在地面外 1 m（Q3.3 的根因之一）。
  const FLOOR_W = 44, FLOOR_D = 40, FLOOR_CX = 4, FLOOR_CZ = 0;
  const castRough = makeFloorRoughnessMap({ size: 512 });
  castRough.repeat.set(Math.round(FLOOR_W / 5), Math.round(FLOOR_D / 5));   // 44×40 → (9, 8)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(FLOOR_W, FLOOR_D),
    new THREE.MeshStandardMaterial({
      color: C.floor, roughness: 1.0, metalness: 0.22,   // §2.5：真实粗糙度由贴图给
      roughnessMap: castRough,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(FLOOR_CX, 0, FLOOR_CZ);
  floor.receiveShadow = true;
  floor.name = 'cast_floor';
  group.add(floor);

  // ---------- 地面板缝（W1 §2.4：几何画缝，合并 1 mesh）----------
  let castSeams;
  {
    const seamGeos = [];
    const nx = Math.round(FLOOR_W / 5) + 1;
    const nz = Math.round(FLOOR_D / 5) + 1;
    for (let i = 0; i < nx; i++) {
      const x = -FLOOR_W / 2 + i * (FLOOR_W / (nx - 1));
      seamGeos.push(new THREE.PlaneGeometry(0.06, FLOOR_D).rotateX(-Math.PI / 2)
        .translate(FLOOR_CX + x, 0.006, FLOOR_CZ));
    }
    for (let i = 0; i < nz; i++) {
      const z = -FLOOR_D / 2 + i * (FLOOR_D / (nz - 1));
      seamGeos.push(new THREE.PlaneGeometry(FLOOR_W, 0.06).rotateX(-Math.PI / 2)
        .translate(FLOOR_CX, 0.006, FLOOR_CZ + z));
    }
    const seams = new THREE.Mesh(
      mergeGeometries(seamGeos),
      new THREE.MeshBasicMaterial({
        color: 0x161A20, transparent: true, opacity: 0.85, depthWrite: false,
      })
    );
    seams.name = 'cast_ground_seams';
    seams.renderOrder = 1;
    group.add(seams);
    castSeams = seams;
  }

  // 作业引导线（与主车间同语言：铁水橙低透明）
  const lineMat = new THREE.MeshBasicMaterial({ color: C.ember, transparent: true, opacity: 0.16 });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 20), lineMat);
  line.rotation.x = -Math.PI / 2;
  line.position.set(12.2, 0.01, 3);
  group.add(line);

  // ---------- 12 只砂箱（Step 2 拾取约定兑现点） ----------
  const sandboxes = buildSandboxes();
  group.add(sandboxes.group);
  const pickMeshes = ['sandboxes_lower', 'sandboxes_upper', 'sandboxes_cups']
    .map((n) => sandboxes.group.getObjectByName(n));

  // 基准矩阵（开箱动画要在此基础上抬升/还原）
  // 注意：getMatrixAt(index, target) 返回 undefined、结果写入 target，不能链式 .clone()
  const COUNT = 12;
  const baseUpper = [];
  const baseCup = [];
  const tmpBase = new THREE.Matrix4();
  for (let i = 0; i < COUNT; i++) {
    pickMeshes[1].getMatrixAt(i, tmpBase);
    baseUpper.push(tmpBase.clone());
    pickMeshes[2].getMatrixAt(i, tmpBase);
    baseCup.push(tmpBase.clone());
  }

  // 逐实例着色：选中=铁水橙提亮，已消耗=压暗（§2 ①）
  const white = new THREE.Color(1, 1, 1);
  const hot = new THREE.Color(1.9, 1.05, 0.62);
  const dim = new THREE.Color(0.32, 0.32, 0.34);
  function paint(idx, consumed) {
    for (const m of pickMeshes) {
      for (let i = 0; i < COUNT; i++) {
        m.setColorAt(i, consumed.has(i) ? dim : i === idx ? hot : white);
      }
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
  paint(null, new Set());   // 初始化 instanceColor，统一走逐实例着色管线

  // ---------- 铸件（开箱后显现） ----------
  const ingotMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.72 });
  const ingot = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.36, 0.95), ingotMat);
  ingot.name = 'cast_ingot';
  ingot.visible = false;
  ingot.castShadow = true;
  group.add(ingot);

  // ---------- 型砂散落粒子 ----------
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x6B5F52, size: 0.09, transparent: true, opacity: 0,
    sizeAttenuation: true, depthWrite: false,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.name = 'sand_particles';
  points.visible = false;
  points.frustumCulled = false;
  group.add(points);

  // ---------- 浇包 + 冲天炉剪影 ----------
  const ladle = buildLadle();
  group.add(ladle.group);
  const cupolaSil = buildCupolaSilhouette();
  group.add(cupolaSil.group);

  // ---------- 灯光（沿用车间定稿配方，范围按小场景收紧） ----------
  const hemi = new THREE.HemisphereLight(0x8FA3B8, 0x1A1E24, 0.75);
  group.add(hemi);

  const key = new THREE.DirectionalLight(0xFFE8D6, 1.15);
  key.position.set(15, 20, 13);
  key.target.position.set(8.5, 0, 3);   // 对准砂箱阵列（默认朝原点会让阵列落在阴影相机边缘）
  key.castShadow = true;
  // W1 §2.6：与铸造馆同法修 shadow acne（normalBias 是平面 acne 的正解）
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 60;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.035;
  group.add(key, key.target);

  const fill = new THREE.PointLight(0xFFB08A, 0.8, 18, 1.6);
  fill.position.set(9, 3.2, 6);
  group.add(fill);

  // ---------- 开箱动画状态 ----------
  const anim = {
    active: false, idx: -1, progress: 0, onDone: null, lastT: null,
    center: new THREE.Vector3(),
  };
  const tmpM = new THREE.Matrix4();

  function layoutCenter(idx) {
    // 与 props/sandboxes.js 同一布局（3 列 × 4 排，间距 2.4，中心 8.5/3）
    const COLS = 3, GAP = 2.4, CX = 8.5, CZ = 3;
    const r = Math.floor(idx / COLS), c = idx % COLS;
    return { x: CX + (c - (COLS - 1) / 2) * GAP, z: CZ + (r - 1.5) * GAP };
  }

  // 基准矩阵均为纯平移（sandboxes.js 不做旋转），直接在 y 分量上叠加抬升
  function applyOpenPose(idx, lift) {
    tmpM.copy(baseUpper[idx]);
    tmpM.elements[13] += lift;
    pickMeshes[1].setMatrixAt(idx, tmpM);

    tmpM.copy(baseCup[idx]);
    tmpM.elements[13] += lift;
    pickMeshes[2].setMatrixAt(idx, tmpM);

    pickMeshes[1].instanceMatrix.needsUpdate = true;
    pickMeshes[2].instanceMatrix.needsUpdate = true;
  }

  function updateParticles(p) {
    if (p <= 0.08) { points.visible = false; return; }
    points.visible = true;
    const { x, z } = anim.center;
    const topY = 1.0;
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < PARTICLES; i++) {
      const a = hash(i) * Math.PI * 2;
      const rr = hash(i + 50) * 0.8;
      const drift = (p - 0.08) * (0.4 + hash(i + 90) * 0.9);
      const fall = (p - 0.08) * (2.0 + hash(i + 30) * 2.4);
      pos[i * 3] = x + Math.cos(a) * rr + Math.cos(a) * drift;
      pos[i * 3 + 1] = Math.max(0.04, topY - fall);
      pos[i * 3 + 2] = z + Math.sin(a) * rr + Math.sin(a) * drift;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = Math.max(0, 1 - p * 0.85);
  }

  /** 供 cast.js 驱动：射线拾取直接用这三个 InstancedMesh */
  const consumedSet = new Set();

  const api = {
    group,
    pickMeshes,

    setSelected(idx) {
      paint(idx, consumedSet);
    },

    setConsumed(ids) {
      consumedSet.clear();
      for (const i of ids) consumedSet.add(i);
      paint(null, consumedSet);
    },

    /** 开始开箱动画（defects 决定铸件贴图缺陷档） */
    openBox(idx, defects, onDone) {
      anim.active = true;
      anim.idx = idx;
      anim.progress = 0;
      anim.onDone = onDone || null;
      const { x, z } = layoutCenter(idx);
      anim.center.set(x, 0, z);

      ingot.material.map?.dispose();
      ingotMat.map = makeIngotTexture(defects);
      ingotMat.needsUpdate = true;
      ingot.position.set(x, 0.6, z);
      ingot.scale.setScalar(0.01);
      ingot.visible = false;
    },

    /** 「跳过」：直接落到动画终态 */
    finishOpen() {
      if (!anim.active) return;
      anim.progress = OPEN_MS;
    },

    /** 「另取一箱 / 调整参数重试」前复位箱体 */
    resetBoxes() {
      anim.active = false;
      anim.idx = -1;
      ingot.visible = false;
      points.visible = false;
      for (let i = 0; i < COUNT; i++) {
        pickMeshes[1].setMatrixAt(i, baseUpper[i]);
        pickMeshes[2].setMatrixAt(i, baseCup[i]);
      }
      pickMeshes[1].instanceMatrix.needsUpdate = true;
      pickMeshes[2].instanceMatrix.needsUpdate = true;
    },

    update(t) {
      // 炉火呼吸（与车间同配方）
      const phase = t * 0.0016;
      ladle.light.intensity = 2.2 * (0.88 + Math.sin(phase) * 0.1 + Math.sin(phase * 4.3) * 0.04);
      ladle.meltMat.emissiveIntensity = 1.6 * (0.9 + Math.sin(phase * 1.3) * 0.12);
      cupolaSil.ring.material.color.setHSL(0.045, 0.86, 0.5 + Math.sin(phase) * 0.05);

      // 开箱动画推进（帧差上限 50ms → 隐藏标签页时动画暂停，回来续播）
      if (!anim.active) return;
      const dt = Math.min(t - (anim.lastT ?? t), 50);
      anim.lastT = t;
      anim.progress = Math.min(OPEN_MS, anim.progress + dt);
      const p = anim.progress / OPEN_MS;

      const lift = easeOutCubic(clamp01(p / 0.55)) * LIFT_H;
      applyOpenPose(anim.idx, lift);
      updateParticles(p);

      if (p > 0.35) {
        ingot.visible = true;
        const s = easeOutCubic(clamp01((p - 0.35) / 0.3));
        ingot.scale.setScalar(0.2 + s * 0.8);
      }

      if (anim.progress >= OPEN_MS) {
        anim.active = false;
        anim.lastT = null;
        updateParticles(1);
        ingot.scale.setScalar(1);
        anim.onDone?.();
      }
    },

    dispose() {
      sandboxes.dispose();
      ladle.dispose();
      cupolaSil.dispose();
      ingot.geometry.dispose();
      ingotMat.map?.dispose();
      ingotMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      floor.geometry.dispose();
      floor.material.roughnessMap?.dispose();
      floor.material.dispose();
      castSeams.geometry.dispose();
      castSeams.material.dispose();
      line.geometry.dispose();
      lineMat.dispose();
    },
  };
  group.userData.api = api;   // cast.js 经 vp.scene.getObjectByName('cast_scene').userData.api 取用
  return api;
}
