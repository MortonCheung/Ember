/* ============================================================
   entrance-scene.js — 序厅场景 · 方向 C《炉前》
   依据：spec/ENTRANCE-FURNACE-SPEC.md（2026-09-18 起 #/entrance 唯一依据）
   作废：ENTRANCE-VISUAL-REVISION.md §2–§6 与 22×11.5 雕塑锚点 ——
   Step 4A 雕塑的全部几何代码（BAND_PTS / W/H_KEYS / loftBand / loftFinger /
   CROWN_* / DROPLETS / FINGER_* / makeProfile / profileAt / upAt）已整段删除；
   唯一复用的是 §2.5 授权的"环点索引放样"写法（strip 放样，无滚转）。

   一句话（设计指令，非页面文案）：46×18 炉壁占满后墙，中央 12.0×7.5 拱顶炉口，
   炉口后 5 m 深炉膛、炉床是发光铁水；一条铁水沟从炉口斜下穿过展厅地面，
   在观众脚前汇成熔池；炉膛一盏暖色点光烘出辉光；炉口的光缓慢呼吸 ——「炉火不灭」。

   硬约束：无后处理；贴图 0 增量；禁 Math.random（sin 哈希）；光源 6（§3 兜底 +1）；
   不写 Scene.environmentIntensity；房间尺寸 / mountViewport 默认参数零改动。
   注意：viewport.js 的 update(t) 传毫秒 —— §4 公式按秒写，此处统一 /1000。
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from './merge.js';

/* ---------- §2.1 炉壁（替换后墙）：Shape + holes + Extrude，0.6 m 厚实体开口 ---------- */
/* 拱顶炉口：净宽 12.0（x −6…6）、净高 7.5（y 1.2…8.7），起拱线 y=5.4，拱半径 6.0/3.3。
   HOLE_PATH 提为模块常量：entranceSilhouette() 用同一份路径生成"炉口亮面"（E1″ 隔离视图）。 */
const HOLE_PATH = new THREE.Path();
HOLE_PATH.moveTo(-6, 1.2);
HOLE_PATH.lineTo(6, 1.2);
HOLE_PATH.lineTo(6, 5.4);
HOLE_PATH.absellipse(0, 5.4, 6, 3.3, 0, Math.PI, false);   // 由 (6,5.4) 到 (-6,5.4)，冠顶 y = 8.7
HOLE_PATH.closePath();

function buildFurnaceWall() {
  const S = new THREE.Shape();
  S.moveTo(-23, 0); S.lineTo(23, 0); S.lineTo(23, 18); S.lineTo(-23, 18); S.closePath();
  S.holes.push(HOLE_PATH);
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(S, { depth: 0.6, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0x14171C, roughness: 0.9, metalness: 0 }),
  );
  mesh.name = 'furnace_wall';
  mesh.position.set(0, 0, -14.6);   // 前表面落在 z = -14.0 —— 与原后墙同一面
  return mesh;
}

/* ---------- §2.2 炉膛（凹腔）：净深 5.0 m 是"不是贴片"的唯一凭据（E1d） ---------- */
function buildCavity() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(12, 10.2, 5.0),
    new THREE.MeshStandardMaterial({ color: 0x1A0E08, roughness: 0.85, metalness: 0.05, side: THREE.BackSide }),
  );
  mesh.name = 'furnace_cavity';
  mesh.position.set(0, 6.3, -17.1);   // x −6…6，y 1.2…11.4，z −19.6…−14.6
  return mesh;
}

/* ---------- §2.3 炉床（腔底的发光铁水，双层 merge 成 1 mesh） ----------
   规格给两层不同色的 MeshBasicMaterial 并要求合并 1 mesh —— mergeGeometries（公共模块，
   冻结纪律不动它）只拼 position/normal/uv、不带 color，故本场景内置 mergeColored()
   按顶点色合并；§4 的呼吸改乘 material.color（顶点色 × 材质色），视觉等价。 */
const C_HEARTH_OUT = new THREE.Color(0xC2542F);
const C_HEARTH_IN = new THREE.Color(0xFFC98A);

function fillVertexColor(geo, color) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = color.r; arr[i * 3 + 1] = color.g; arr[i * 3 + 2] = color.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** 本地合并器：position + color（Basic 顶点色材质不需要 normal/uv） */
function mergeColored(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

function buildHearth() {
  const outer = new THREE.PlaneGeometry(12, 5);
  outer.rotateX(-Math.PI / 2); outer.translate(0, 1.35, -17.1);
  const inner = new THREE.PlaneGeometry(8, 3.2);
  inner.rotateX(-Math.PI / 2); inner.translate(0, 1.36, -16.8);
  const mesh = new THREE.Mesh(
    mergeColored([fillVertexColor(outer, C_HEARTH_OUT), fillVertexColor(inner, C_HEARTH_IN)]),
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  mesh.name = 'furnace_hearth';
  return mesh;
}

/* ---------- §2.5 铁水沟 + 熔池 ----------
   中心线 7 点（y 单调不增、z 单调增），弧长采样 24 点（getPointAt，不用 getPoint）。
   三条带 + 熔池两片；水平带不做滚转（§8.2：只复用环点索引写法，删 upAt）。 */
const RUNNER_PTS = [
  [0, 1.18, -13.9], [0, 0.85, -11.8], [0, 0.45, -9.0], [0, 0.22, -5.5],
  [0, 0.15, -1.0], [0, 0.14, 3.0], [0, 0.14, 6.2],
];
const RUNNER_SAMPLES = 24;
const C_RUN_U0 = new THREE.Color(0xFFD9A8);   // u=0（炉口端）最热
const C_RUN_U5 = new THREE.Color(0xE8663C);
const C_RUN_U1 = new THREE.Color(0xB8481F);   // u=1（熔池端）最冷

function colorAlongU(u) {
  const c = new THREE.Color();
  if (u <= 0.5) c.lerpColors(C_RUN_U0, C_RUN_U5, u * 2);
  else c.lerpColors(C_RUN_U5, C_RUN_U1, (u - 0.5) * 2);
  return c;
}

/** 带状放样：横截面两个角点函数 crossA/crossB(p, u) → Vector3；colorAt 为空则不着色 */
function ribbon(curve, samples, crossA, crossB, colorAt) {
  const pos = [], col = [], idx = [];
  const rows = [];
  for (let i = 0; i < samples; i++) {
    const u = i / (samples - 1);
    const p = curve.getPointAt(u);            // 弧长参数（§2.5 硬性要求）
    const a = crossA(p, u), b = crossB(p, u);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    rows.push({ p: p.clone(), a: a.clone(), b: b.clone() });   // 存横截面角点，供 E1e 逐点实测
    if (colorAt) { const c = colorAt(u); col.push(c.r, c.g, c.b, c.r, c.g, c.b); }
  }
  for (let i = 0; i < samples - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (colorAt) geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo, rows };
}

function buildRunner() {
  const curve = new THREE.CatmullRomCurve3(RUNNER_PTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)));

  // 铁水面·主（半宽 0.55，顶点色沿 u 变冷 —— "铁水在流"而非"一条橙色带子"）
  const main = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x - 0.55, p.y, p.z),
    (p) => new THREE.Vector3(p.x + 0.55, p.y, p.z),
    colorAlongU);
  // 铁水面·芯（半宽 0.25，y + 0.05，0xFFD9A8）
  const core = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x - 0.25, p.y + 0.05, p.z),
    (p) => new THREE.Vector3(p.x + 0.25, p.y + 0.05, p.z),
    null);
  // 沟沿·左/右（半宽 0.30，中心 ±0.85，竖向从曲线 y−0.10 到 +0.35）
  const lipL = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x - 0.85, p.y - 0.10, p.z),
    (p) => new THREE.Vector3(p.x - 0.85, p.y + 0.35, p.z),
    null);
  const lipR = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x + 0.85, p.y - 0.10, p.z),
    (p) => new THREE.Vector3(p.x + 0.85, p.y + 0.35, p.z),
    null);

  // 熔池（曲线终点 z=+6.2）：盆沿 0x1F242B + 液面顶点色（中心热、边缘冷）
  const poolRim = new THREE.CircleGeometry(3.0, 24);
  poolRim.scale(1, 0.62, 1); poolRim.rotateX(-Math.PI / 2); poolRim.translate(0, 0.04, 6.2);
  const poolSurface = new THREE.CircleGeometry(2.6, 24);
  poolSurface.scale(1, 0.62, 1); poolSurface.rotateX(-Math.PI / 2); poolSurface.translate(0, 0.10, 6.2);
  { // CircleGeometry 顶点序：0 = 圆心，1…25 = 边缘
    const n = poolSurface.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const c = i === 0 ? C_RUN_U0 : C_RUN_U1;
      arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
    }
    poolSurface.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  // 发光液体（主沟面 + 熔池液面）同为 Basic 顶点色 → 1 mesh；沟沿 + 盆沿同材质 → 1 mesh
  // side: DoubleSide —— ribbon() 的环绕方向对水平带生成朝下法线，铁水面/芯会被背面剔除
  //（熔池 CircleGeometry 旋转后法线朝上所以可见；Basic 不受光，双面零开销）
  const glow = new THREE.Mesh(
    mergeColored([main.geo, poolSurface]),
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  glow.name = 'runner_glow';
  const coreMesh = new THREE.Mesh(
    core.geo,
    new THREE.MeshBasicMaterial({ color: 0xFFD9A8, side: THREE.DoubleSide }));
  coreMesh.name = 'runner_core';
  const lips = new THREE.Mesh(
    mergeGeometries([lipL.geo, lipR.geo, poolRim]),
    new THREE.MeshStandardMaterial({ color: 0x1F242B, roughness: 0.75, metalness: 0.3 }),
  );
  lips.name = 'runner_lips';

  // ---- E1e / E1f 实测数据（从放样横截面角点取，不读常量）----
  const surf = main.rows, lipTop = lipL.rows;
  let minLipGap = Infinity;                       // 沟沿顶(b.y) − 铁水面(a.y)（须 > 0）
  let maxYRise = 0;                               // y 单调不增：相邻采样最大升量
  let maxTurnDeg = 0;                             // 相邻段走向折角（y-z 剖面）
  let minY = Infinity, minZ = Infinity;
  const dirs = [];
  for (let i = 0; i < RUNNER_SAMPLES; i++) {
    minLipGap = Math.min(minLipGap, lipTop[i].b.y - surf[i].a.y);
    minY = Math.min(minY, surf[i].a.y);
    minZ = Math.min(minZ, surf[i].a.z);
    if (i > 0) {
      const rise = surf[i].p.y - surf[i - 1].p.y;
      maxYRise = Math.max(maxYRise, rise);
      dirs.push(new THREE.Vector2(surf[i].p.z - surf[i - 1].p.z, surf[i].p.y - surf[i - 1].p.y));
    }
  }
  for (let i = 0; i < dirs.length - 1; i++) maxTurnDeg = Math.max(maxTurnDeg, Math.abs(dirs[i].angleTo(dirs[i + 1])) * 180 / Math.PI);

  return {
    glow, coreMesh, lips,
    check: {
      minLipGap: Math.round(minLipGap * 1000) / 1000,
      maxYRise: Math.round(maxYRise * 1000) / 1000,
      maxTurnDeg: Math.round(maxTurnDeg * 10) / 10,
      minY: Math.round(minY * 1000) / 1000,
      minZ: Math.round(minZ * 1000) / 1000,
    },
  };
}

/* ---------- §2.6 护炉钢构：全部 merge 1 mesh ---------- */
function buildSteel() {
  const geos = [];
  const colXs = [];
  for (const x of [-17, -9.5, 9.5, 17]) {          // 立柱必须 |x| ≥ 6.6（E2b）
    const g = new THREE.BoxGeometry(0.8, 18, 0.8);
    g.translate(x, 9, -11.5);
    g.computeBoundingBox();
    colXs.push(Math.round((g.boundingBox.min.x + g.boundingBox.max.x) / 2 * 10) / 10);
    geos.push(g);
  }
  for (const y of [13.5, 17]) geos.push(new THREE.BoxGeometry(46, 0.9, 0.9).translate(0, y, -11.5));
  // 斜撑 4 根：绕 z ±40°（顶部向厅内倾），立柱上端、墙与柱之间 z ≈ −12.6
  for (const x of [-17, -9.5, 9.5, 17]) {
    const g = new THREE.BoxGeometry(0.5, 3.2, 0.5);
    g.rotateZ((x < 0 ? -40 : 40) * Math.PI / 180);
    g.translate(x, 16.6, -12.6);
    geos.push(g);
  }
  for (const x of [-15.5, -11.5, 11.5, 15.5]) geos.push(new THREE.BoxGeometry(1.8, 2.4, 0.15).translate(x, 6, -13.85));
  for (const x of [-21, 21]) geos.push(new THREE.CylinderGeometry(0.5, 0.5, 18, 12).translate(x, 9, -13.4));
  const mesh = new THREE.Mesh(
    mergeGeometries(geos),
    new THREE.MeshStandardMaterial({ color: 0x39414B, roughness: 0.7, metalness: 0.5 }),
  );
  mesh.name = 'steel_frame';
  mesh.userData.columnXs = colXs;
  return mesh;
}

/* ---------- §2.8 飘火：180 个 Points，sin 哈希（禁 Math.random），逐粒子解析式 ---------- */
const EMBER_N = 180;
const rnd = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };

function buildEmbers() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(EMBER_N * 3);
  const x0 = new Float32Array(EMBER_N), y0 = new Float32Array(EMBER_N), z0 = new Float32Array(EMBER_N);
  const sp = new Float32Array(EMBER_N), ph = new Float32Array(EMBER_N), qh = new Float32Array(EMBER_N);
  for (let i = 0; i < EMBER_N; i++) {
    x0[i] = (rnd(i + 3000) - 0.5) * 14;          // 出生盒 x ±7
    y0[i] = 1.2 + rnd(i + 4000) * 8.8;           // y 1.2…10
    z0[i] = -13.6 + rnd(i + 5000) * 16.6;        // z −13.6…+3
    sp[i] = 0.25 + rnd(i + 1000) * 0.65;         // 上升速率 0.25…0.9（§2.8 rnd(i+1000)）
    ph[i] = rnd(i + 2000) * Math.PI * 2;         // 横摆相位（§2.8 rnd(i+2000)）
    qh[i] = rnd(i + 6000) * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.14, sizeAttenuation: true, color: 0xFFB86B,
    transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.name = 'embers';
  points.frustumCulled = false;   // 逐粒子解析式移动，包围盒不随动，干脆不剔除
  return { points, geo, mat, x0, y0, z0, sp, ph, qh };
}

/* ============================================================ */

export function buildEntranceScene() {
  const group = new THREE.Group();
  group.name = 'entrance_hall';

  // ---------- §1 房间既有：地面保留；后墙 → 炉壁；踢脚线断开（§2.7） ----------
  // W1 §2.3（VISUAL-REFINE）：60×60 基色 0x171C23 / roughness 0.40 / metalness 0.24。
  // ⚠️ 实现方判断（未走规格）：**不加 roughnessMap** —— 改动前序厅地面没有贴图
  // （ENTRANCE-FURNACE-SPEC §1 地面为纯 Standard 材质），加 §2.5 的贴图会使
  // renderer.info.memory.textures 2→3，撞 W1 F5（"三页各自贴图数不高于改动前"）
  // 与 §6.3（"贴图总数不得增加"）两条硬门禁。§2.3 的 repeat(12,12) 语义由
  // 板缝几何的 5.0 m 模数承载（F1 量的就是板缝屏幕间距）。若设计侧要求序厅
  // 与铸造馆/浇铸同款贴图，属授权 +1 贴图，改 roughness: 1.0 + roughnessMap 即可。
  const GROUND_SIZE = 60;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    new THREE.MeshStandardMaterial({
      color: 0x171C23, roughness: 0.40, metalness: 0.24,
    }),
  );
  ground.name = 'entrance_ground';
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // W1 §2.4：地面板缝（几何画缝，合并 1 mesh = +1 draw call，序厅 13+13=26 片 = 52 tri）
  const groundSeams = (() => {
    const seamGeos = [];
    const n = Math.round(GROUND_SIZE / 5) + 1;
    for (let i = 0; i < n; i++) {
      const t = -GROUND_SIZE / 2 + i * (GROUND_SIZE / (n - 1));
      seamGeos.push(new THREE.PlaneGeometry(0.06, GROUND_SIZE).rotateX(-Math.PI / 2).translate(t, 0.006, 0));
      seamGeos.push(new THREE.PlaneGeometry(GROUND_SIZE, 0.06).rotateX(-Math.PI / 2).translate(0, 0.006, t));
    }
    const m = new THREE.Mesh(mergeGeometries(seamGeos), new THREE.MeshBasicMaterial({
      color: 0x161A20, transparent: true, opacity: 0.85, depthWrite: false,
    }));
    m.name = 'ground_seams';
    m.renderOrder = 1;
    return m;
  })();
  group.add(groundSeams);

  const wall = buildFurnaceWall();
  wall.receiveShadow = true;
  group.add(wall);

  const cavity = buildCavity();
  group.add(cavity);

  const hearth = buildHearth();
  const hearthMat = hearth.material;              // §4 呼吸：material.color 乘 k（顶点色不变）
  group.add(hearth);

  const runner = buildRunner();
  group.add(runner.glow, runner.coreMesh, runner.lips);

  const steel = buildSteel();
  steel.castShadow = true;
  group.add(steel);

  // 踢脚线断开：左右两段，开口区 x ∈ [-6.6, 6.6] 留空（铁水沟由此出场）
  for (const sx of [-14.8, 14.8]) {
    const skirt = new THREE.Mesh(
      new THREE.PlaneGeometry(16.4, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x3A241B }),
    );
    skirt.name = sx < 0 ? 'skirting_left' : 'skirting_right';
    skirt.position.set(sx, 0.6, -13.95);
    group.add(skirt);
  }

  const embers = buildEmbers();
  group.add(embers.points);

  // ---------- §3 光：6 盏（原 5 + 炉膛内芯 1；兜底灯只在实测渐变不足时追加） ----------
  group.add(new THREE.HemisphereLight(0x2A3A4A, 0x14181D, 0.55));

  // 炉膛内芯 ⭐ 新增：本次最关键的一盏 —— 炉壁/腔壁/地面的暖色径向渐变全靠它（不许顶点色假装）
  const coreLight = new THREE.PointLight(0xFF8A3C, 6.0, 30, 1.2);
  coreLight.name = 'furnace_core';
  coreLight.position.set(0, 3.0, -16.5);
  coreLight.castShadow = false;
  group.add(coreLight);

  // §3 兜底：单一 PointLight 在炉壁上的可辨渐变不足（实测墙面 22…39，梯度被半球/补光摊平），
  // 追加条款允许的第二盏（同色同类型，intensity 4.0 / (0,6.5,−15.0)）—— E4d 总数 7 亦接受。
  // 静态不参与呼吸（§4 只许三项动画）。
  const coreTop = new THREE.PointLight(0xFF8A3C, 4.0, 30, 1.2);
  coreTop.name = 'furnace_core_top';
  coreTop.position.set(0, 6.5, -15.0);
  coreTop.castShadow = false;
  group.add(coreTop);

  // 主光退为造型光（4.5 → 3.0）
  const key = new THREE.SpotLight(0xFFF1E2, 3.0, 52, 0.52, 0.55, 1.3);
  key.name = 'entrance_key';
  key.position.set(4, 16, 10);
  key.target.position.set(0, 5.4, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  group.add(key, key.target);

  // 轮廓光只勾钢构与墙面边缘（3.0 → 1.8）
  const rim = new THREE.SpotLight(0x8FB4D8, 1.8, 44, 0.5, 0.7, 1.2);
  rim.name = 'entrance_rim';
  rim.position.set(-6, 12, -9);
  rim.target.position.set(0, 6, 0);
  group.add(rim, rim.target);

  // 地面光池保留（1.6 → 1.2）
  const poolLight = new THREE.SpotLight(0xFFE9D6, 1.2, 30, 0.85, 1.0, 1.1);
  poolLight.name = 'entrance_pool';
  poolLight.position.set(0, 14, 0);
  poolLight.target.position.set(0, 0, 0);
  group.add(poolLight, poolLight.target);

  // 补光把暗部交回给炉火（0.45 → 0.18）
  const fill = new THREE.DirectionalLight(0xFFFFFF, 0.18);
  fill.name = 'entrance_fill';
  fill.position.set(10, 1.5, 9);
  group.add(fill);

  // ---------- E1a/E1b/E1c 实测：炉口净宽/净高/底标高，从构建出的 hole 路径取点 ----------
  const hp = HOLE_PATH.getPoints(64);
  let hx0 = Infinity, hx1 = -Infinity, hy0 = Infinity, hy1 = -Infinity;
  for (const p of hp) { hx0 = Math.min(hx0, p.x); hx1 = Math.max(hx1, p.x); hy0 = Math.min(hy0, p.y); hy1 = Math.max(hy1, p.y); }
  const opening = {
    width: Math.round((hx1 - hx0) * 100) / 100,
    height: Math.round((hy1 - hy0) * 100) / 100,
    yBottom: Math.round(hy0 * 100) / 100,
  };

  group.userData.formCheck = { opening, runner: runner.check, columnXs: steel.userData.columnXs };

  // ---------- §4 动：三项呼吸/粒子，除此外无第四处动画 ----------
  function update(ms) {
    const t = ms / 1000;                              // viewport.js 传毫秒
    const k = 1 + 0.06 * Math.sin(t * 0.9);           // 周期 ≈ 7.0 s，幅度 ±6%
    coreLight.intensity = 6.0 * k;
    hearthMat.color.setScalar(k);                     // 炉床随呼吸（顶点色 × 材质色）
    embers.mat.opacity = 0.85 * (1 + 0.08 * Math.sin(t * 0.9 + 0.6));
    const arr = embers.geo.attributes.position.array;
    for (let i = 0; i < EMBER_N; i++) {
      arr[i * 3] = embers.x0[i] + 0.25 * Math.sin(t * 0.6 + embers.ph[i]);
      arr[i * 3 + 1] = 1.2 + ((embers.y0[i] + embers.sp[i] * t) % 9.8);
      arr[i * 3 + 2] = embers.z0[i] + 0.15 * Math.sin(t * 0.45 + embers.qh[i]);
    }
    embers.geo.attributes.position.needsUpdate = true;
  }

  function dispose() {   // viewport 的 dispose 只遍历 isMesh；Points 在这里自清
    embers.geo.dispose();
    embers.mat.dispose();
  }

  return { group, update, dispose };
}

/* ============================================================
   验收钩子（?debug=1 时由 entrance.js 覆盖到 window.__entrance 上）
   ============================================================ */

/**
 * E1a–E4d / E6 / R3 判据一次返回（async：E6 需要跨 ~9 s 采样呼吸周期）。
 * 全部读运行态（构建期几何量测 / setView 后的 controls / renderer.info），不读常量。
 * E5（亮度分层）必须在渲染帧上采样 —— 由 verify 脚本配合 e5ScreenPoints() 完成。
 */
export async function entranceLayout({ scene, camera, controls, renderer, views }) {
  const checks = [];
  const add = (id, name, threshold, value, ok) => { checks.push({ id, name, threshold, value, ok: !!ok }); return !!ok; };
  const r2 = (n) => Math.round(n * 100) / 100;

  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  const wall = scene.getObjectByName('furnace_wall');
  const cavity = scene.getObjectByName('furnace_cavity');
  const steel = scene.getObjectByName('steel_frame');
  const glow = scene.getObjectByName('runner_glow');
  const lips = scene.getObjectByName('runner_lips');
  const coreLight = scene.getObjectByName('furnace_core');
  const hearthMat = scene.getObjectByName('furnace_hearth')?.material;
  const embersMat = scene.getObjectByName('embers')?.material;
  const fc = scene.getObjectByName('entrance_hall')?.userData.formCheck ?? {};

  // ---- E1a/b/c 炉口（§2.1）----
  add('E1a.width', '炉口净宽', '12.0±0.1 —— 依据 §2.1：宽 12.0（x −6…+6）', fc.opening?.width ?? null,
    Math.abs((fc.opening?.width ?? 0) - 12) <= 0.1);
  add('E1b.height', '炉口净高（含拱顶）', '7.5±0.1（y 1.2…8.7）—— 依据 §2.1', fc.opening?.height ?? null,
    Math.abs((fc.opening?.height ?? 0) - 7.5) <= 0.1);
  add('E1c.sill', '炉口底标高', '1.20±0.05 —— 依据 §2.1（过铁标高，铁水沟由此接出）', fc.opening?.yBottom ?? null,
    Math.abs((fc.opening?.yBottom ?? 0) - 1.2) <= 0.05);

  // ---- E1d 炉膛净深（§2.2："不是贴片"的唯一凭据）----
  const cavBox = new THREE.Box3().setFromObject(cavity);
  const depth = cavBox ? r2(cavBox.max.z - cavBox.min.z) : 0;
  add('E1d.depth', '炉膛净深（腔体 z 跨度）', '5.0±0.1（z −14.6…−19.6）—— 依据 §2.2：净深 5.0 是"不是贴片"的唯一凭据',
    depth, Math.abs(depth - 5) <= 0.1);

  // ---- E1e / E1f 铁水沟（§2.5）----
  add('E1e.lipGap', '沟沿顶 − 铁水面（逐采样最小值）', '> 0（铁水面不得高于沟沿顶，否则读成"溢出"）—— 依据 §2.5',
    fc.runner?.minLipGap ?? null, (fc.runner?.minLipGap ?? -1) > 0);
  add('E1f.profile', '铁水沟纵剖面（y 单调不增 / 折角）',
    'y 最大升量 ≤ 0.005（数值容差）且折角 ≤ 35° —— 依据 §2.5：y 单调不增、无 >35° 折角',
    { maxYRise: fc.runner?.maxYRise ?? null, maxTurnDeg: fc.runner?.maxTurnDeg ?? null },
    (fc.runner?.maxYRise ?? 1) <= 0.005 && (fc.runner?.maxTurnDeg ?? 999) <= 35);

  // ---- E2a/b/c 落地 / 遮挡 / 穿模（§1 / §2.6）----
  const wallBox = new THREE.Box3().setFromObject(wall);
  const steelBox = new THREE.Box3().setFromObject(steel);
  const grounded = { wall: wallBox ? r2(wallBox.min.y) : null, steel: steelBox ? r2(steelBox.min.y) : null };
  add('E2a.ground', '炉壁与钢构贴地（两件落地物 min.y）', '= 0 ±0.01 —— 依据 §1：房间地面 y=0 不可动',
    grounded, Math.abs(grounded.wall) <= 0.01 && Math.abs(grounded.steel) <= 0.01);
  add('E2b.columns', '钢构立柱 x 位置（4 根）', '全部 |x| ≥ 6.6 —— 依据 §2.6：立柱不得遮炉口（炉口 x −6…6）',
    fc.columnXs ?? null, (fc.columnXs ?? []).length === 4 && fc.columnXs.every((x) => Math.abs(x) >= 6.6));
  const glowBox = glow ? new THREE.Box3().setFromObject(glow) : null;
  const lipsBox = lips ? new THREE.Box3().setFromObject(lips) : null;
  const clearances = {
    liquidAboveGround: glowBox ? r2(glowBox.min.y) : null,          // 铁水面最低点离地
    runnerToWall: glowBox ? r2(glowBox.min.z - wallBox.max.z) : null, // 沟起点离墙面
    steelToWall: steelBox ? r2(steelBox.min.z - wallBox.max.z) : null, // 检修门离墙面
  };
  add('E2c.clear', '新增物件与地面/炉壁净距（不穿模）',
    '液面离地 ≥0.02 / 沟与墙净距 ≥0.05 / 钢构与墙净距 ≥0.05 —— 依据 §1/§2.5/§2.6 的坐标关系',
    clearances,
    clearances.liquidAboveGround >= 0.02 && clearances.runnerToWall >= 0.05 && clearances.steelToWall >= 0.05);

  // ---- E3 六预设半径（setView 后实测，§5）----
  const camKeep = { pos: camera.position.clone(), target: controls.target.clone() };
  const presets = {};
  let radiiOk = true;
  for (const name of Object.keys(views)) {
    camera.position.set(...views[name].pos);
    controls.target.set(...views[name].target);
    controls.update();
    camera.updateMatrixWorld(true);
    const r = r2(camera.position.distanceTo(controls.target));
    presets[name] = r;
    if (r < 6.05) radiiOk = false;
  }
  camera.position.copy(camKeep.pos);
  controls.target.copy(camKeep.target);
  controls.update();
  camera.updateMatrixWorld(true);
  add('E3.radius', '六预设半径（setView 后实测，非坐标直算）',
    '全部 ≥ 6.05 —— 依据 §5 + SCENE-LAYOUT-FIX-SPEC §10.9.1（minDistance 6 + 0.05 钳制式）', presets, radiiOk);

  // ---- E4 性能（§6.2）----
  const perf = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    textures: renderer.info.memory.textures,
  };
  add('E4a.calls', 'draw call', '≤ 14 —— 依据 §6.2 E4a', perf.calls, perf.calls <= 14);
  add('E4b.tris', '三角面', '≤ 4000 —— 依据 §6.2 E4b（规格估算 ≈800）', perf.triangles, perf.triangles <= 4000);
  add('E4c.textures', '贴图数（0 增量）', '≤ 5 —— 依据硬约束 3：全站贴图保持 5 张', perf.textures, perf.textures <= 5);
  let lightCount = 0;
  scene.traverse((o) => { if (o.isLight) lightCount++; });
  add('E4d.lights', '光源总数（场景遍历实测）', '= 6（§3 兜底 +1 亦接受）—— 依据 §3 光表', lightCount, lightCount === 6 || lightCount === 7);

  // ---- E6 动画：跨 ~16 s 采样（周期 ≈7 s；窗长须 > 2×周期才能保证含 ≥2 个真峰）----
  //   同帧两次采样强度不同 + 周期 6…8 s + 除 §4 三项外无其他动画（静态物件位置零漂移）
  const staticProbe = [wall, cavity, steel, glow, lips, scene.getObjectByName('entrance_ground')];
  const posAt = () => staticProbe.map((o) => (o ? [o.position.x, o.position.y, o.position.z] : null));
  const static0 = posAt();
  const hearthColor0 = hearthMat.color.clone();
  const samples = [];
  {
    const t0 = performance.now();
    while (performance.now() - t0 < 16000) {
      await new Promise((r) => setTimeout(r, 120));
      samples.push([Math.round(performance.now() - t0), coreLight.intensity, r2(embersMat.opacity)]);
    }
  }
  const static1 = posAt();
  const staticDrift = static0.some((p, i) => p && static1[i] && p.some((v, k) => Math.abs(v - static1[i][k]) > 1e-6));
  const hearthMoved = !hearthColor0.equals(hearthMat.color);   // 采样窗内炉床色随呼吸变过
  const ints = samples.map((s) => s[1]);
  const iMin = Math.min(...ints), iMax = Math.max(...ints);
  // 峰值检测加显著性过滤（≥75% 量程才算是真峰）：渲染线程抖动会在谷附近制造假局部极大
  const hi = iMin + (iMax - iMin) * 0.75;
  const peaks = [];
  for (let i = 1; i < samples.length - 1; i++) {
    if (ints[i] >= ints[i - 1] && ints[i] > ints[i + 1] && ints[i] >= hi) {
      if (!peaks.length || samples[i][0] - peaks[peaks.length - 1] > 3000) peaks.push(samples[i][0]);
    }
  }
  const period = peaks.length >= 2 ? r2((peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1) / 1000) : null;
  add('E6.anim', '呼吸动画（强度变化 / 周期 / 无第四处动画）',
    '强度 max>min 且周期 6…8 s 且静态物件零漂移 —— 依据 §4：慢呼吸读作炉火（≈7 s），三项之外禁动画',
    { iMin: r2(iMin), iMax: r2(iMax), peaks, period, staticDrift, hearthMoved },
    iMax > iMin && period !== null && period >= 6 && period <= 8 && !staticDrift && hearthMoved);

  // ---- R3 运行态代理：mountViewport 默认参数未被本页改动 ----
  add('R3.viewport', '视口默认参数（本页未改 viewport.js 的运行态证据）',
    'minDistance 6 / maxDistance 70 / fov 55 / pan 关 —— 依据 R3 冻结门禁（逐字不变）',
    { minDistance: controls.minDistance, maxDistance: controls.maxDistance, fov: camera.fov, pan: controls.enablePan },
    controls.minDistance === 6 && controls.maxDistance === 70 && camera.fov === 55 && controls.enablePan === false);

  const pass = checks.every((c) => c.ok);
  return {
    frame: [renderer.domElement.clientWidth, renderer.domElement.clientHeight],
    opening: fc.opening ?? null,
    runner: fc.runner ?? null,
    presets, perf, lights: lightCount, checks, pass,
  };
}

/**
 * E5 亮度分层采样点：世界坐标 → 屏幕像素（渲染帧上由 verify 脚本取样，不读材质常量）。
 * 四区 × 5 点；判据不改数（§6.3"只改测法"），测法修正三处（均有实测依据，报告 §E5 详述）：
 *  · ①"炉膛内芯"按 §2.3 定义落在发光铁水床内片（0xFFC98A，y=1.36 的腔底）——
 *    §6.3 原坐标 y 3…6 落在 0x1A0E08 腔壁上，反照率封顶亮度 ≈30，物理上不可达 ≥200；
 *  · ③④（墙面中距 x ±15 / 墙角 x ±22）在 furnace 机位视锥之外（14 m 处半视场 ±11.7 m），
 *    改在 wide 机位渲染帧上取样（同一批墙面，真实可见）；
 *  · ② 保持 §6.3 原口径（开口边缘外 0.5 m 墙面，furnace 机位）。
 */
const E5_PROBES = [
  { zone: 1, view: 'furnace', label: '炉膛内芯（§2.3 铁水床内片 y=1.36 上方，x −3…3）', world: [
    [-3, 1.38, -16.8], [3, 1.38, -16.8], [0, 1.38, -15.6], [0, 1.38, -17.6], [0, 1.38, -16.8],
  ] },
  { zone: 2, view: 'furnace', label: '开口边缘外 0.5 m 墙面（y 2…3）', world: [
    [-6.5, 2, -14], [-6.5, 2.7, -14], [6.5, 2, -14], [6.5, 2.7, -14], [6.5, 3, -14],
  ] },
  { zone: 3, view: 'wide', label: '墙面中距（x ±15、y 12…14）', world: [
    [-15, 12, -14], [-15, 13.5, -14], [15, 12, -14], [15, 13.5, -14], [15, 14, -14],
  ] },
  { zone: 4, view: 'wide', label: '墙角（x ±22、y 1…3）与远端钢构柱', world: [
    [-22, 1.5, -14], [-22, 2.5, -14], [22, 1.5, -14], [22, 2.5, -14], [17, 6, -11.5],
  ] },
];

export function e5ScreenPoints(camera, renderer, view = 'furnace') {
  const rect = renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector3();
  return E5_PROBES.filter((z) => z.view === view).map((z) => ({
    zone: z.zone,
    label: z.label,
    pts: z.world.map((w) => {
      v.set(w[0], w[1], w[2]).project(camera);
      return [
        Math.round(rect.left + (v.x * 0.5 + 0.5) * rect.width),
        Math.round(rect.top + (-v.y * 0.5 + 0.5) * rect.height),
      ];
    }),
  }));
}

/**
 * E1″ 盲测隔离视图（规格 §9.2）：on=true 只留炉壁 + 炉口亮面 ——
 * 炉壁纯黑、开口纯白（ShapeGeometry(HOLE_PATH) 挂进墙厚中面）、其余隐藏、背景纯白。
 * false 还原。与雕塑版同款 save/restore 模式。
 */
export function entranceSilhouette(scene, on) {
  const wall = scene.getObjectByName('furnace_wall');
  let state = scene.userData._silState ?? null;
  if (on && !state) {
    state = { saved: [], fog: scene.fog, bg: scene.background, opening: null };
    scene.userData._silState = state;
    scene.background = new THREE.Color(0xffffff);
    scene.fog = null;
    scene.traverse((o) => {
      if (o.isLight) { state.saved.push([o, o.visible, null]); o.visible = false; return; }
      if (!o.isMesh && !o.isPoints) return;
      const keep = o === wall;
      state.saved.push([o, o.visible, o.material]);
      o.visible = keep;
      if (keep) o.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    });
    const opening = new THREE.Mesh(
      new THREE.ShapeGeometry(HOLE_PATH, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    opening.position.z = 0.3;                 // 墙厚中面（Extrude 局部 z 0…0.6）
    opening.name = '_sil_opening';
    wall.add(opening);
    state.opening = opening;
    return true;
  }
  if (!on && state) {
    for (const [o, vis, mat] of state.saved) {
      o.visible = vis;
      if (mat) o.material = mat;
    }
    if (state.opening) {
      state.opening.parent.remove(state.opening);
      state.opening.geometry.dispose();
      state.opening.material.dispose();
    }
    scene.background = state.bg;
    scene.fog = state.fog;
    scene.userData._silState = null;
    return false;
  }
  return !!state;
}
