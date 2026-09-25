/* ============================================================
   entrance-scene.js — 序厅场景 · 方向 C《炉前》
   依据：spec/ENTRANCE-FURNACE-SPEC.md（2026-09-18 起 #/entrance 唯一依据）
   作废：archive/spec/ENTRANCE-VISUAL-REVISION.md §2–§6 与 22×11.5 雕塑锚点 ——
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

/* ---------- ENTRANCE-LIP-SPEC §2：炉口内衬（furnace_lip）----------
   为什么需要它：E5 ②③ 原口径采的是**墙面**（法线朝观众 (0,0,+1)），而全场景唯一能造
   光晕的「炉膛内芯」PointLight 在墙**背面**的炉膛里（z = −16.5）→ 点积为负，物理不可达
   （Step 4C 报告 §4.3 已给证明）。正解 = 在洞内加一圈**朝炉膛收口的锥面**：
   · 朝观众 → N·V ≈ 0.64，看得见； · 朝炉膛 → N·L > 0，在光的一侧；
   · 完全落在洞内（z ∈ [−14.6, −14.0]）→ 不穿墙、不遮炉床、不遮铁水沟。
   它是**实体几何**（真实炉衬），与 §2.3 炉床 / §2.5 铁水面同一族做法，
   不是 §8.3 禁止的"在墙面上涂色伪装辉光"。

   ⚠️ 两层点必须一一对应：禁止对两条 Path 各调 getPoints()（曲率分布不同会错位扭面）。
   这里**自己按段参数化**，内外两层用同一套参数（底边 16 + 右壁 8 + 拱 32 + 左壁 8 = 64 段）。
   ⚠️ 不改 HOLE_PATH —— 墙的挖洞仍用它，E1b 净开口 12.0 × 7.5 一字不变。 */
const LIP_INSET = 0.50;        // 炉膛侧径向收缩量（m）
const LIP_DEPTH = 0.60;        // 进深 = 墙厚（z −14.0 → −14.6）
const LIP_SEG = { bottom: 16, wall: 8, arch: 32, wall2: 8 };   // 合计 64 段 = 128 tri
const C_LIP_MOUTH = new THREE.Color(0xA8481F);   // u=0 洞口缘（渐隐入黑墙）
const C_LIP_DEEP = new THREE.Color(0xF08A4A);    // u=1 炉膛侧（与炉床同源、稍暗；上限 0xFFD9A8）

/**
 * 洞口轮廓参数化：返回 64 个点（首尾相接，不重复末点）。
 * inset(u) = 0.50·u；底边 y = 1.20 + inset、x ∈ ±(6 − inset)；
 * 侧壁 x = ∓(6 − inset)、y ∈ [1.20 + inset, 5.4]；拱心 (0, 5.4)、a = 6 − inset、b = 3.3 − inset。
 * 走向：底边左→右 → 右壁向上 → 拱（θ 0 → π）→ 左壁向下 = 逆时针（配合下面的绕序得到朝 +z 的正法线）。
 */
function lipContour(inset) {
  const y0 = 1.20 + inset;
  const x0 = 6 - inset;
  const b = 3.3 - inset;
  const pts = [];
  const { bottom, wall, arch, wall2 } = LIP_SEG;
  for (let i = 0; i < bottom; i++) {                      // 底边（不含末点，末点=右壁起点）
    const t = i / bottom;
    pts.push([-x0 + 2 * x0 * t, y0]);
  }
  for (let i = 0; i < wall; i++) {                        // 右壁（含起点，不含拱起点）
    const s = i / wall;
    pts.push([x0, y0 + (5.4 - y0) * s]);
  }
  for (let i = 0; i < arch; i++) {                        // 拱（含 θ=0，不含 θ=π）
    const th = Math.PI * (i / arch);
    pts.push([x0 * Math.cos(th), 5.4 + b * Math.sin(th)]);
  }
  for (let i = 0; i < wall2; i++) {                       // 左壁（含 θ=π 后的下降段）
    const s = i / wall2;
    pts.push([-x0, 5.4 - (5.4 - y0) * s]);
  }
  return pts;
}

function buildFurnaceLip() {
  const outer = lipContour(0);                 // z = −14.0，等于 HOLE_PATH 原轮廓
  const inner = lipContour(LIP_INSET);         // z = −14.6，净开口 11.0 × 6.5
  const n = outer.length;                      // 64
  const pos = [], col = [], idx = [];
  for (const [layer, list, z, c] of [[0, outer, -14.0, C_LIP_MOUTH], [1, inner, -14.6, C_LIP_DEEP]]) {
    void layer;
    for (const [x, y] of list) {
      pos.push(x, y, z);
      col.push(c.r, c.g, c.b);
    }
  }
  // 环绕成环：quad(outer[i], outer[i+1], inner[i+1], inner[i]) —— 两三角同绕序，
  // 实测法线朝 +z 与洞心（底边处 (0, .77, .64)），FrontSide 正是观众能看见的那一面。
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = i, bq = j, c = n + j, d = n + i;
    idx.push(a, bq, c, a, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();                  // 供 L5 读法线（满足 computeVertexNormals 需非零面积三角形）
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.FrontSide }));
  mesh.name = 'furnace_lip';
  mesh.userData.contour = { outer, inner, seg: LIP_SEG };
  return mesh;
}

/* ---------- §2.2 炉膛（凹腔）：净深 5.0 m 是"不是贴片"的唯一凭据（E1d） ---------- */
/* W2 Q2.1（VISUAL-REFINE §3 最高性价比的一项）：反照率 0x1A0E08 → 0x3A2318。
   0x1A0E08 的线性反照率 ≈0.008，furnace_core 点光在腔壁上画不出任何渐变（§4.3 证明过的
   同一个物理事实）。抬到 0x3A2318 后腔底受光、腔顶背光 —— 透过拱口就能看见一道上下渐变。
   side / 几何 / 位置全部不动。 */
function buildCavity() {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(12, 10.2, 5.0),
    new THREE.MeshStandardMaterial({ color: 0x3A2318, roughness: 0.9, metalness: 0, side: THREE.BackSide }),
  );
  mesh.name = 'furnace_cavity';
  mesh.position.set(0, 6.3, -17.1);   // x −6…6，y 1.2…11.4，z −19.6…−14.6
  return mesh;
}

/* ---------- W2 Q2.1：耐火砖内衬（腔体后壁前 0.10 m 的 24 条横向砖缝）----------
   24 × PlaneGeometry(12, 0.05) → 24×2 = 48 tri；合并进 1 个 mesh（§2.8 的 furnace_lining）。
   腔侧壁 / 腔顶不加东西 —— 让光去区分它们。 */
const LINING_ROWS = 24;
const LINING_Y0 = 1.60;
const LINING_STEP = 0.38;

function buildLining() {
  const geos = [];
  const c = new THREE.Color(0x32200F);
  for (let k = 0; k < LINING_ROWS; k++) {
    const g = new THREE.PlaneGeometry(12, 0.05);
    g.translate(0, LINING_Y0 + k * LINING_STEP, -19.50);   // 后壁 z = −19.6，缝在其前 0.10
    geos.push(fillVertexColorLit(g, c));
  }
  const mesh = new THREE.Mesh(
    mergeColoredLit(geos),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 }),
  );
  mesh.name = 'furnace_lining';
  return mesh;
}

/* ---------- §2.3 炉床 → W2 Q2.2：熔池（去掉"台阶感"）----------
   原做法是"两片矩形 PlaneGeometry 偏 z 叠放"，边界笔直 → 读作"台阶 / 台座"，不是液体。
   改法 = 一片**径向渐变的椭圆池**（+ 一圈池沿，池沿并入 furnace_fittings）。
   ⚠️ 色阶按**真实径向距离** r = √(x² + (z − z₀)²) 归一化，不是按椭圆参数 ——
      E5① 的 5 个采样点（(±3, −16.8) r=3.015 / (0, −15.6) r=1.5 / (0, −17.6) r=0.5 等）
      全落在 r ≤ 3.4（0.60·R）内，必须处于**平顶**（亮度不低于 0xFFC98A）。
   ⚠️ 实现方判断（未走规格）：§3 Q2.2 给的是 CircleGeometry(5.6) + scale(1,1,0.90)，
      但 scale 在 rotateX 之前 → z 缩放对 XY 平面内的圆**无作用**，若改成等效的 y 缩放
      则 z 半轴 = 5.04 m，远超腔底半深 2.5 m，液面会穿出后墙并糊在铁水沟上。
      故 z 向压扁取 POOL_KZ 使 z 半轴 = 2.35 m（腔底 z −19.6…−14.6 内留 0.15 余量），
      x 半轴仍按规格 5.6 m；色阶口径按上式保持规格的"r ≤ 0.60·R 平顶"硬约束。 */
const POOL_R = 5.6;                 // 液面 x 半轴（＝规格的归一化尺度）
const POOL_Z_HALF = 2.35;           // 液面 z 半轴（受腔底几何约束）
const POOL_CZ = -17.1;
const POOL_Y = 1.35;
const C_POOL_HOT = new THREE.Color(0xFFE7C0);   // r/R = 0
const C_POOL_FLAT = new THREE.Color(0xFFC98A);   // r/R = 0.60（平顶下沿，硬约束）
const C_POOL_MID = new THREE.Color(0xE8663C);    // r/R = 0.80
const C_POOL_EDGE = new THREE.Color(0x8E3418);   // r/R = 1.00

/** 顶点色：0 → 0.60 平顶（不低于 0xFFC98A 的亮度），0.60 之后才衰减 */
function poolColorAt(rNorm) {
  const c = new THREE.Color();
  if (rNorm <= 0.60) c.lerpColors(C_POOL_HOT, C_POOL_FLAT, rNorm / 0.60);
  else if (rNorm <= 0.80) c.lerpColors(C_POOL_FLAT, C_POOL_MID, (rNorm - 0.60) / 0.20);
  else c.lerpColors(C_POOL_MID, C_POOL_EDGE, Math.min(1, (rNorm - 0.80) / 0.20));
  return c;
}

function buildHearth() {
  /* ⚠️ 不能用 CircleGeometry（三角形**扇**）：扇的每个三角形由「圆心 + 外环两点」构成，
     顶点色只在**圆心 ↔ 外环**之间插值 —— 外环是暗色 0x8E3418，会把中段全部拖暗，
     poolColorAt() 的「r ≤ 0.60 平顶」在光栅化后根本不存在。
     实测证据（2026-09-20，.workbuddy/probe_vis.py 帧差取证）：r/R=0.54 处 158，
     与「0.54·暗缘 + 0.46·亮心」的扇插值预测 148 吻合，而平顶预期是 217。
     正解 = **多环圆盘**：每个环的顶点各取 poolColorAt(r)，插值因此沿半径走、平顶成立。 */
  const SEG = 48;
  const RINGS = [0, 0.20, 0.40, 0.60, 0.80, 1.00];   // rNorm；0.60 必须有环（平顶边界）
  const pos = [], col = [], idx = [];
  pos.push(0, POOL_Y, POOL_CZ);                       // 0 号 = 圆心
  col.push(...poolColorAt(0).toArray());
  const ringStart = [];
  for (let k = 1; k < RINGS.length; k++) {
    ringStart.push(pos.length / 3);
    const rr = RINGS[k] * POOL_R;
    for (let j = 0; j <= SEG; j++) {                  // 含末点 = 首点（闭合，索引省一次取模）
      const th = (j / SEG) * Math.PI * 2;
      const x = rr * Math.cos(th);
      const yl = rr * Math.sin(th) * (POOL_Z_HALF / POOL_R);
      pos.push(x, POOL_Y, POOL_CZ - yl);              // 与原 scale + rotateX(-π/2) 等效的映射
      col.push(...poolColorAt(RINGS[k]).toArray());
    }
  }
  for (let j = 0; j < SEG; j++) idx.push(0, 1 + j + 1, 1 + j);            // 中心扇
  for (let k = 0; k < ringStart.length - 1; k++) {                          // 环间四边形
    const a0 = ringStart[k], b0 = ringStart[k + 1];
    for (let j = 0; j < SEG; j++) {
      idx.push(a0 + j, b0 + j, b0 + j + 1, a0 + j, b0 + j + 1, a0 + j + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  );
  mesh.name = 'furnace_hearth';
  mesh.userData.contour = { R: POOL_R, zHalf: POOL_Z_HALF, y: POOL_Y, cz: POOL_CZ };
  return mesh;
}

/** W2 Q2.2 池沿：4 段 Box 围一圈（宽 0.60 / 高 0.35），把液面"盛住"（并入 furnace_fittings） */
const RIM_W = 0.60, RIM_H = 0.35, RIM_Y0 = POOL_Y;

function poolRimGeos() {
  const c = new THREE.Color(0x2A1A12);
  const geos = [];
  const czMin = POOL_CZ - POOL_Z_HALF, czMax = POOL_CZ + POOL_Z_HALF;   // −19.45 … −14.75
  const depth = czMax - czMin;
  // 前后：横跨 x ±6.0（外沿）
  for (const zc of [czMin + RIM_W / 2, czMax - RIM_W / 2]) {
    geos.push(fillVertexColorLit(new THREE.BoxGeometry(12.0, RIM_H, RIM_W)
      .translate(0, RIM_Y0 + RIM_H / 2, zc), c));
  }
  // 左右：竖跨 z 余段，外沿 x ±6.0
  const innerD = depth - 2 * RIM_W;
  for (const xc of [-(6.0 - RIM_W / 2), 6.0 - RIM_W / 2]) {
    geos.push(fillVertexColorLit(new THREE.BoxGeometry(RIM_W, RIM_H, innerD)
      .translate(xc, RIM_Y0 + RIM_H / 2, POOL_CZ), c));
  }
  return geos;
}

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

/* ---------- W2 §2.8：受光构件的顶点色合并器 ----------
   规格要求 furnace_fittings 同时带 position + normal + color，而公共 merge.js 只拼
   position/normal/uv（且是冻结模块）→ 扩展本地合并器。本场景无贴图，故不带 uv。 */
function fillVertexColorLit(geo, color) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = color.r; arr[i * 3 + 1] = color.g; arr[i * 3 + 2] = color.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** 本地合并器：position + normal + color（Standard 顶点色材质：拱圈/壁板缝/檐口/池沿/踢脚） */
function mergeColoredLit(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = parts.reduce((n, g) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

/* ---------- §2.5 铁水沟 + 熔池（W2 Q2.4：从"贴地发光扁带"改成"真的沟槽"）----------
   中心线 8 点（原 7 点，中段膝折 z −5.5→−1.0 掉 y 0.22→0.15 已摊平）：
   y 单调不增、z 单调增（E1f 保持），下降段拉长、过渡更缓。
   弧长采样 24 → 32（getPointAt，不用 getPoint）。
   改动：铁水面半宽 0.55 → 0.50；沟沿竖向 y −0.10→+0.35 改为 −0.12→+0.55（高出液面 0.55 m，
   槽真的"围住"铁水）；沟沿加**顶盖**（外半宽 0.30，±0.55 → ±1.15 @ y+0.55）让沟沿有厚度；
   沟沿材质 0x1F242B（近黑、读不出）→ 0x2E3742。熔池盆沿 3.0 → 3.4、液面 2.6 → 3.0。
   水平带不做滚转（§8.2：只复用环点索引写法，删 upAt）。 */
const RUNNER_PTS = [
  [0, 1.16, -13.9], [0, 0.92, -11.6], [0, 0.62, -9.2], [0, 0.38, -7.0],
  [0, 0.24, -4.4], [0, 0.17, -1.6], [0, 0.15, 2.0], [0, 0.14, 6.2],
];
const RUNNER_SAMPLES = 32;
const RUN_HALF = 0.50;        // 铁水面半宽（原 0.55）
const LIP_X = 0.85;           // 沟沿竖向面中心
const LIP_TOP = 0.55;         // 沟沿顶高出曲线 y（原 +0.35）
const LIP_BOT = -0.12;        // 沟沿底低于曲线 y（原 −0.10）
const LIP_CAP_HALF = 0.30;    // 顶盖外半宽（±0.55 → ±1.15）
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

  // 铁水面·主（半宽 0.50，顶点色沿 u 变冷 —— "铁水在流"而非"一条橙色带子"）
  const main = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x - RUN_HALF, p.y, p.z),
    (p) => new THREE.Vector3(p.x + RUN_HALF, p.y, p.z),
    colorAlongU);
  // 铁水面·芯（半宽 0.25，y + 0.05，0xFFD9A8）
  const core = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x - 0.25, p.y + 0.05, p.z),
    (p) => new THREE.Vector3(p.x + 0.25, p.y + 0.05, p.z),
    null);
  // 沟沿·左/右 竖向面（中心 ±0.85，y −0.12 → +0.55）
  const lipL = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x - LIP_X, p.y + LIP_BOT, p.z),
    (p) => new THREE.Vector3(p.x - LIP_X, p.y + LIP_TOP, p.z),
    null);
  const lipR = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x + LIP_X, p.y + LIP_BOT, p.z),
    (p) => new THREE.Vector3(p.x + LIP_X, p.y + LIP_TOP, p.z),
    null);
  // 沟沿·顶盖（水平封边：内 ±0.55 → 外 ±1.15 @ y+0.55）—— 沟沿由此"有厚度"
  const capL = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x - (LIP_X - LIP_CAP_HALF), p.y + LIP_TOP, p.z),
    (p) => new THREE.Vector3(p.x - (LIP_X + LIP_CAP_HALF), p.y + LIP_TOP, p.z),
    null);
  const capR = ribbon(curve, RUNNER_SAMPLES,
    (p) => new THREE.Vector3(p.x + (LIP_X - LIP_CAP_HALF), p.y + LIP_TOP, p.z),
    (p) => new THREE.Vector3(p.x + (LIP_X + LIP_CAP_HALF), p.y + LIP_TOP, p.z),
    null);

  // 熔池（曲线终点 z=+6.2）：盆沿 0x2E3742（并入 runner_lips）+ 液面顶点色（中心热、边缘冷）
  const poolRim = new THREE.CircleGeometry(3.4, 32);
  poolRim.scale(1, 0.62, 1); poolRim.rotateX(-Math.PI / 2); poolRim.translate(0, 0.04, 6.2);
  const poolSurface = new THREE.CircleGeometry(3.0, 32);
  poolSurface.scale(1, 0.62, 1); poolSurface.rotateX(-Math.PI / 2); poolSurface.translate(0, 0.10, 6.2);
  { // CircleGeometry 顶点序：0 = 圆心，1…n = 边缘
    const n = poolSurface.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const c = i === 0 ? C_RUN_U0 : C_RUN_U1;
      arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
    }
    poolSurface.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }

  // 发光液体（主沟面 + 熔池液面）同为 Basic 顶点色 → 1 mesh；沟沿 + 顶盖 + 盆沿同材质 → 1 mesh
  // side: DoubleSide —— ribbon() 的环绕方向对水平带生成朝下法线，铁水面/芯/顶盖会被背面剔除
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
    mergeGeometries([lipL.geo, lipR.geo, capL.geo, capR.geo, poolRim]),
    new THREE.MeshStandardMaterial({ color: 0x2E3742, roughness: 0.7, metalness: 0.35, side: THREE.DoubleSide }),
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

/* ---------- §2.6 护炉钢构：从"方管栅栏"改成"工字形断面"（W2 Q2.6）----------
   原做法：立柱 0.8×0.8 实心方管、横梁 46×0.9×0.9 → 一片"方管栅栏"，没有工程感。
   改法：柱身 = 腹板 + 2 翼缘（工字形，平面轮廓 x ±0.29 / z ±0.17，缩的只是断面尺寸，
   立柱中心 x 一个都不动 —— E2b 的 |x| ≥ 6.6 是判据），并补柱脚底板 + 地脚螺栓、
   柱顶节点板、柱身加劲环；横梁同样拆成腹板 + 2 翼缘；斜撑两端加节点板。
   ⚠️ 实现方判断（未走规格）：§3 Q2.6 给"腹板 Box(0.10, 18, 0.62)"与"翼缘 …（z = −11.35/−11.65）"
   两组数互相矛盾（0.62 的腹板会从 ±0.17 的翼缘里穿出去 0.14 m，读作"十字"而非"I"），
   故按同一节里"平面轮廓 x ±0.29、z ±0.17"这句（也与横梁那组自洽：腹板 0.62 = 总高 0.82 − 2×0.10）
   取腹板 z = 0.16；加劲环 z 由 0.66 收到 0.42（略凸出翼缘，读作"环"）。
   全部 merge 进同一个 steel_frame mesh（draw call 不变）。 */
function buildSteel() {
  const geos = [];
  const colXs = [];
  const ZC = -11.5;                       // 立柱 / 横梁中心 z
  const FL_T = 0.09, FL_W = 0.58;         // 翼缘厚 / 宽
  const FL_Z = 0.125;                     // 翼缘中心到断面中心（0.125 + 0.045 = ±0.17）
  for (const x of [-17, -9.5, 9.5, 17]) {          // 立柱必须 |x| ≥ 6.6（E2b）
    const parts = [
      new THREE.BoxGeometry(0.10, 18, 0.16),                                     // 腹板
      new THREE.BoxGeometry(FL_W, 18, FL_T).translate(0, 0, FL_Z),               // 翼缘·近
      new THREE.BoxGeometry(FL_W, 18, FL_T).translate(0, 0, -FL_Z),              // 翼缘·远
      new THREE.BoxGeometry(1.4, 0.08, 1.4).translate(0, -8.96, 0),              // 柱脚底板（y 0.04）
      new THREE.BoxGeometry(1.2, 0.14, 1.2).translate(0, 8.93, 0),               // 柱顶节点板（y 17.93）
      new THREE.BoxGeometry(0.34, 0.30, 0.42).translate(0, 0.5, 0),              // 柱身加劲环 ×2
      new THREE.BoxGeometry(0.34, 0.30, 0.42).translate(0, 5.5, 0),
    ];
    for (const [bx, bz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
      parts.push(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8).translate(bx, -8.91, bz));   // 地脚螺栓
    }
    const g = mergeGeometries(parts);       // 局部坐标（原点 = 柱中高），再整体平移
    g.computeBoundingBox();
    colXs.push(Math.round(x * 10) / 10);
    g.translate(x, 9, ZC);
    geos.push(g);
  }
  // 横梁 ×2：腹板 46×0.62×0.18 + 翼缘 46×0.10×0.56（y ±0.36）
  for (const y of [13.5, 17]) {
    geos.push(new THREE.BoxGeometry(46, 0.62, 0.18).translate(0, y, ZC));
    geos.push(new THREE.BoxGeometry(46, 0.10, 0.56).translate(0, y + 0.36, ZC));
    geos.push(new THREE.BoxGeometry(46, 0.10, 0.56).translate(0, y - 0.36, ZC));
  }
  // 斜撑 4 根：绕 z ±40°（顶部向厅内倾），立柱上端、墙与柱之间 z ≈ −12.6；两端节点板
  for (const x of [-17, -9.5, 9.5, 17]) {
    const rot = (x < 0 ? -40 : 40) * Math.PI / 180;
    geos.push(new THREE.BoxGeometry(0.50, 3.2, 0.22).rotateZ(rot).translate(x, 16.6, -12.6));
    for (const dy of [-1.6, 1.6]) {
      geos.push(new THREE.BoxGeometry(0.5, 0.30, 0.30).translate(x + dy * Math.sin(rot), 16.6 + dy * Math.cos(rot), -12.6));
    }
  }
  // 检修门 ×4（各加 2 道横向压条）+ 烟道 ×2
  for (const x of [-15.5, -11.5, 11.5, 15.5]) {
    geos.push(new THREE.BoxGeometry(1.8, 2.4, 0.15).translate(x, 6, -13.85));
    for (const dy of [-0.6, 0.6]) geos.push(new THREE.BoxGeometry(1.9, 0.10, 0.20).translate(x, 6 + dy, -13.85));
  }
  for (const x of [-21, 21]) geos.push(new THREE.CylinderGeometry(0.5, 0.5, 18, 12).translate(x, 9, -13.4));
  const mesh = new THREE.Mesh(
    mergeGeometries(geos),
    new THREE.MeshStandardMaterial({ color: 0x39414B, roughness: 0.62, metalness: 0.5 }),
  );
  mesh.name = 'steel_frame';
  mesh.userData.columnXs = colXs;
  return mesh;
}

/* ---------- W2 Q2.5 + Q2.7：炉壁分块/拱圈 + 踢脚线（合并进 furnace_fittings）----------
   §2.8 的合并方案：拱圈 + 壁板缝 ×8 + 檐口 + 池沿 ×4 + 踢脚 ×2 + 顶帽 ×2 → 1 个 mesh
   （取代原 skirting_left / skirting_right 两个 mesh，净 −1）。
   ⚠️ 实现方判断（未走规格）：规格给拱圈单独材质 0x3A424C（roughness .55 / metalness .45），
   但同表要求这些构件并成 1 个 mesh → 只能有一套 roughness/metalness。
   折中取 0.62 / 0.35（介于拱圈 .55/.45 与"略提光泽"的钢构 0.62 之间），各件靠**顶点色**区分。 */
const C_FIT_ARCH = new THREE.Color(0x3A424C);      // 拱圈
const C_FIT_SEAM = new THREE.Color(0x0E1116);      // 壁板缝
const C_FIT_CORNICE = new THREE.Color(0x2E3742);   // 檐口压顶
const C_FIT_SKIRT = new THREE.Color(0x2A2018);     // 踢脚（护墙板）
const C_FIT_SKIRT_CAP = new THREE.Color(0x3A2E24); // 踢脚顶帽

function buildFittings() {
  const geos = [];
  // ---- 拱圈：沿炉口外沿 0.55 m 宽的"画框"（外沿 Path + holes.push(HOLE_PATH) → Extrude 0.10）----
  {
    const outer = new THREE.Path();
    outer.moveTo(-6.55, 1.2);
    outer.lineTo(6.55, 1.2);
    outer.lineTo(6.55, 5.4);
    outer.absellipse(0, 5.4, 6.55, 3.85, 0, Math.PI, false);
    outer.closePath();
    const S = new THREE.Shape();
    S.curves = outer.curves;
    S.holes.push(HOLE_PATH);
    // 位置 z = −14.00：挤出面落在 z ∈ [−14.00, −13.90] → 紧贴炉壁前表面、凸出 0.10（无缝隙）
    geos.push(fillVertexColorLit(new THREE.ExtrudeGeometry(S, { depth: 0.10, bevelEnabled: false })
      .translate(0, 0, -14.00), C_FIT_ARCH));
  }
  // ---- 竖向壁板缝 ×6：|x| ≥ 6.6（±4.6 会落在炉口里、悬空在开口中）----
  for (const x of [-18.4, -13.8, -9.2, 9.2, 13.8, 18.4]) {
    geos.push(fillVertexColorLit(new THREE.PlaneGeometry(0.05, 18).translate(x, 9, -13.98), C_FIT_SEAM));
  }
  // ---- 横向壁板缝 ×2：y 12 / 15（在拱冠 8.7 之上）----
  for (const y of [12.0, 15.0]) {
    geos.push(fillVertexColorLit(new THREE.PlaneGeometry(46, 0.05).translate(0, y, -13.98), C_FIT_SEAM));
  }
  // ---- 檐口压顶：给炉壁一个上边界（y 17.50…18.00，不越出房间 y ≤ 18，也不是顶棚）----
  geos.push(fillVertexColorLit(new THREE.BoxGeometry(46.4, 0.50, 0.90).translate(0, 17.75, -14.20), C_FIT_CORNICE));
  // ---- 池沿 ×4（Q2.2）：把熔池液面"盛住"----
  geos.push(...poolRimGeos());
  // ---- 踢脚线 ×2 + 顶帽 ×2（Q2.7）：PlaneGeometry(Basic) → Box + Standard 材质族 ----
  for (const sx of [-14.8, 14.8]) {
    geos.push(fillVertexColorLit(new THREE.BoxGeometry(16.4, 1.20, 0.12).translate(sx, 0.6, -13.94), C_FIT_SKIRT));
    geos.push(fillVertexColorLit(new THREE.BoxGeometry(16.4, 0.06, 0.20).translate(sx, 1.23, -13.94), C_FIT_SKIRT_CAP));
  }
  const mesh = new THREE.Mesh(
    mergeColoredLit(geos),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.35 }),
  );
  mesh.name = 'furnace_fittings';
  return mesh;
}

/* ---------- §2.8 飘火 → W2 Q2.3：火星（零贴图圆点）----------
   问题：PointsMaterial 的默认点是**方块**。furnace 机位距墙 14.24 m、画幅高 14.58 m、
   size 0.14 → 屏幕上约 8.6 px 的方块（实拍里的黄方块就是它）。§2.8 当初"方形即读作火星"
   是按 default 机位（34 m）算的，furnace 机位下不成立。
   改法：ShaderMaterial + gl_PointCoord 圆形软遮罩（**零贴图增量**，§8.5 维持）——
   圆形软边本来就比 sprite 贴图更好（可做中心热核 + 边缘衰减）。
   数量 180 → 140；尺寸逐粒子 0.06…0.13（不再统一 0.14）；出生盒 x ±5.6（＝炉口净宽半值，
   让飘火从炉口里出来）、y 1.2…8.0、z −13.8…+2.0。逐粒子运动公式不变（§2.8 解析式）。 */
const EMBER_N = 140;
const rnd = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };

const EMBER_VERT = `
attribute float aSize;
varying float vFade;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * 300.0 / -mv.z;    // sizeAttenuation 手写版
  gl_Position = projectionMatrix * mv;
  vFade = clamp(1.0 - (-mv.z) / 30.0, 0.15, 1.0);
}`;

const EMBER_FRAG = `
varying float vFade;
uniform vec3 uColor;
uniform float uOpacity;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;                    // ← 圆
  float soft = smoothstep(1.0, 0.15, r);   // 软边
  float core = smoothstep(0.55, 0.0, r);   // 中心热核
  gl_FragColor = vec4(uColor * (0.65 + 0.75 * core), soft * uOpacity * vFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function buildEmbers() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(EMBER_N * 3);
  const aSize = new Float32Array(EMBER_N);
  const x0 = new Float32Array(EMBER_N), y0 = new Float32Array(EMBER_N), z0 = new Float32Array(EMBER_N);
  const sp = new Float32Array(EMBER_N), ph = new Float32Array(EMBER_N), qh = new Float32Array(EMBER_N);
  for (let i = 0; i < EMBER_N; i++) {
    x0[i] = (rnd(i + 3000) - 0.5) * 11.2;        // 出生盒 x ±5.6（＝炉口净宽半值）
    y0[i] = 1.2 + rnd(i + 4000) * 6.8;           // y 1.2…8.0（原到 10，会飘到拱顶以上）
    z0[i] = -13.8 + rnd(i + 5000) * 15.8;        // z −13.8…+2.0
    aSize[i] = 0.06 + rnd(i + 7000) * 0.07;      // 0.06…0.13（逐粒子，原统一 0.14）
    sp[i] = 0.25 + rnd(i + 1000) * 0.65;         // 上升速率 0.25…0.9（§2.8 rnd(i+1000)）
    ph[i] = rnd(i + 2000) * Math.PI * 2;         // 横摆相位（§2.8 rnd(i+2000)）
    qh[i] = rnd(i + 6000) * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0xFFB86B) }, uOpacity: { value: 0.85 } },
    vertexShader: EMBER_VERT,
    fragmentShader: EMBER_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
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

  // ENTRANCE-LIP-SPEC §2：炉口内衬 —— 洞口内朝炉膛收口的锥面（E5 ②③ 的承光面）
  const lip = buildFurnaceLip();
  group.add(lip);

  const cavity = buildCavity();
  group.add(cavity);

  // W2 Q2.1：耐火砖内衬（腔体后壁的 24 条横向砖缝，让"有纵深"这件事有第二处凭据）
  const lining = buildLining();
  group.add(lining);

  // W2 Q2.5 + Q2.7：拱圈 / 壁板缝 / 檐口 / 池沿 / 踢脚（合并 1 mesh，取代原 2 个踢脚 mesh）
  const fittings = buildFittings();
  group.add(fittings);

  const hearth = buildHearth();
  const hearthMat = hearth.material;              // §4 呼吸：material.color 乘 k（顶点色不变）
  group.add(hearth);

  const runner = buildRunner();
  group.add(runner.glow, runner.coreMesh, runner.lips);

  const steel = buildSteel();
  steel.castShadow = true;
  group.add(steel);

  // ⚠️ 原 skirting_left / skirting_right（2 个 MeshBasicMaterial 平面）已删除 ——
  //    Q2.7 把它们换成 Box + Standard 材质族并并入 furnace_fittings（§2.8 净 −1 draw call）。

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

  // §3 兜底第二盏（同色同类型）—— 2026-09-20 设计方裁定扩权（ENTRANCE-LIP-SPEC §9-1）：
  //   原 (0,6.5,−15.0)/4.0 与 furnace_core 在竖直后壁上互相抹平，G1「后壁梯度 ≥20」实测仅 5.3；
  //   扫参实证：仅调 y/I 最多 19.3（I=45，视觉变差仍不过）—— 授权范围内不可达；
  //   定稿 (0,3.0,−18.6)/6.0（贴近腔底后壁 1m）→ 后壁梯度 25.7，实拍为「铁水床上方升起暖光晕」，
  //   无热斑、腔顶保持暗，纵深优于原版。灯总数仍 7，不加灯，§8 禁令不变。静态不参与呼吸（§4 只许三项动画）。
  const coreTop = new THREE.PointLight(0xFF8A3C, 6.0, 30, 1.2);
  coreTop.name = 'furnace_core_top';
  coreTop.position.set(0, 3.0, -18.6);
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
  const lip = scene.getObjectByName('furnace_lip');            // ENTRANCE-LIP-SPEC §2 炉口内衬
  const hearth = scene.getObjectByName('furnace_hearth');
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
    'y 最大升量 ≤ 0.005（数值容差）且折角 ≤ 18° —— 依据 VISUAL-REFINE §3 Q2.4：阈值由 35° **收紧到 18°**',
    { maxYRise: fc.runner?.maxYRise ?? null, maxTurnDeg: fc.runner?.maxTurnDeg ?? null },
    (fc.runner?.maxYRise ?? 1) <= 0.005 && (fc.runner?.maxTurnDeg ?? 999) <= 18);

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

  // ---- L1–L5 + L9′ 炉口内衬 furnace_lip（ENTRANCE-LIP-SPEC §6 验收）----
  //   全部读运行态几何（Box3 / userData.contour / Raycaster），不读构建期常量。
  {
    const c = lip?.userData?.contour ?? null;
    const lipBox = lip ? new THREE.Box3().setFromObject(lip) : null;
    // L1：存在、1 个 mesh、z ∈ [−14.60, −14.00]
    let lipMeshCount = 0;
    scene.traverse((o) => { if (o.isMesh && o.name === 'furnace_lip') lipMeshCount++; });
    const lipZ = lipBox ? [r2(lipBox.min.z), r2(lipBox.max.z)] : null;
    add('L1.lip', '炉口内衬存在且唯一（mesh 数 / z 跨度）',
      '1 个 mesh，且 z ∈ [−14.60, −14.00] —— 依据 ENTRANCE-LIP-SPEC §2.3',
      { meshes: lipMeshCount, z: lipZ },
      lipMeshCount === 1 && !!lipZ && Math.abs(lipZ[0] + 14.6) <= 0.01 && Math.abs(lipZ[1] + 14.0) <= 0.01);

    // L2：观众侧轮廓 = HOLE_PATH（把 HOLE_PATH 密采样成折线，取轮廓点到折线的最小距离的最大值）
    let maxDev = null;
    if (c) {
      const poly = HOLE_PATH.getPoints(600);
      const segDist = (px, py, a, b2) => {
        const vx = b2.x - a.x, vy = b2.y - a.y;
        const L2 = vx * vx + vy * vy;
        let t = L2 > 0 ? ((px - a.x) * vx + (py - a.y) * vy) / L2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        return Math.hypot(px - (a.x + t * vx), py - (a.y + t * vy));
      };
      maxDev = 0;
      for (const [px, py] of c.outer) {
        let d = Infinity;
        for (let i = 0; i < poly.length - 1; i++) d = Math.min(d, segDist(px, py, poly[i], poly[i + 1]));
        maxDev = Math.max(maxDev, d);
      }
      maxDev = Math.round(maxDev * 10000) / 10000;
    }
    add('L2.contour', '内衬观众侧轮廓 = HOLE_PATH（逐点最小距离的最大值）',
      '偏差 ≤ 0.01 —— 依据 ENTRANCE-LIP-SPEC §2.1（不改 HOLE_PATH，净开口一字不变）',
      maxDev, maxDev !== null && maxDev <= 0.01);

    // L3：炉膛侧径向收缩 = 0.50 ± 0.02
    //   同一套参数化下取 5 个"特征角"（底边左端 / 起拱点 / 拱 θ=0 / 冠顶 / 拱 θ=180°），
    //   每点比较内、外层坐标差的分量 —— 因为拱上点的角度参数相同、a/b 各缩 0.50，分量必然都是 0.50。
    const IN_SET = [[0, '底边左端'], [16, '起拱点（右）'], [24, '拱 θ=0'], [40, '冠顶 θ=90°'], [56, '拱 θ=180°']];
    const insets = c ? IN_SET.map(([i, tag]) => {
      const dx = Math.abs(c.inner[i][0] - c.outer[i][0]);
      const dy = Math.abs(c.inner[i][1] - c.outer[i][1]);
      return { tag, dx: r2(dx), dy: r2(dy), max: r2(Math.max(dx, dy)) };
    }) : null;
    add('L3.inset', '炉膛侧径向收缩量（5 个特征角的分量）',
      '每个特征角的收缩分量 = 0.50 ± 0.02 —— 依据 ENTRANCE-LIP-SPEC §2.1',
      insets, !!insets && insets.every((s) => Math.abs(s.max - 0.50) <= 0.02));

    // L4：与炉床 / 铁水沟 Box3 无交叠
    const hearthBox = hearth ? new THREE.Box3().setFromObject(hearth) : null;
    const overlap = {
      hearth: !!(lipBox && hearthBox && lipBox.intersectsBox(hearthBox)),
      runner: !!(lipBox && glowBox && lipBox.intersectsBox(glowBox)),
      runnerLips: !!(lipBox && lipsBox && lipBox.intersectsBox(lipsBox)),
    };
    add('L4.clear', '内衬与炉床 / 铁水沟 Box3 无交叠',
      '三个 Box3 均不相交 —— 依据 ENTRANCE-LIP-SPEC §2.3（内衬 z ∈ [−14.6,−14.0]，炉床 z ≤ −14.6）',
      overlap, !overlap.hearth && !overlap.runner && !overlap.runnerLips);

    // L5：面朝洞心 —— 从 furnace 机位射线打到内衬，交点法线与视线夹角 < 80°
    //   材质为 FrontSide，raycaster 因此**只会命中正面**，等价于"观众看得见的那一面"。
    let maxAngle = null, hitAll = null;
    if (lip && c) {
      camera.position.set(...views.furnace.pos);
      controls.target.set(...views.furnace.target);
      controls.update();
      camera.updateMatrixWorld(true);
      const nm = new THREE.Matrix3().getNormalMatrix(lip.matrixWorld);
      // 采样：② 区 5 点 + ③ 区 5 点 + 内衬中段（u=0.5，由内外层均值给出）4 点
      const mid = [4, 16, 40, 56].map((i) => [
        (c.outer[i][0] + c.inner[i][0]) / 2, (c.outer[i][1] + c.inner[i][1]) / 2, -14.30,
      ]);
      const probes = [
        ...E5_PROBES.filter((z) => z.zone === 2 || z.zone === 3).flatMap((z) => z.world),
        ...mid,
      ];
      const ray = new THREE.Raycaster();
      const dir = new THREE.Vector3();
      const view = new THREE.Vector3();
      const n = new THREE.Vector3();
      maxAngle = 0; hitAll = true;
      for (const w of probes) {
        const target = new THREE.Vector3(w[0], w[1], w[2]);
        dir.copy(target).sub(camera.position).normalize();
        ray.set(camera.position, dir);
        const hits = ray.intersectObject(lip, false);
        if (!hits.length) { hitAll = false; maxAngle = 180; break; }
        // 「视线」= 表面点 → 相机（N·V 的 V）。材质是 FrontSide，three 的背面剔除保证
        // face.normal 与**射线前进方向**的夹角必 ≥90°——所以必须用反方向的 view 比对，
        // 否则读数恒为 180°−真值（第一轮实测 151.4° 即由此来，真值 28.6°）。
        view.copy(camera.position).sub(hits[0].point).normalize();
        n.copy(hits[0].face.normal).applyMatrix3(nm).normalize();
        maxAngle = Math.max(maxAngle, n.angleTo(view) * 180 / Math.PI);
      }
      maxAngle = Math.round(maxAngle * 10) / 10;
      camera.position.copy(camKeep.pos);
      controls.target.copy(camKeep.target);
      controls.update();
      camera.updateMatrixWorld(true);
    }
    add('L5.facing', '内衬面朝洞心（furnace 机位射线命中正面，法线—视线夹角）',
      '全部命中且夹角 < 80° —— 依据 ENTRANCE-LIP-SPEC §2「看得见」',
      { maxAngle, allHit: hitAll, probes: 14 },
      hitAll === true && maxAngle !== null && maxAngle < 80);

    // L9′：E1″ 隔离视图里看不到内衬（"炉壁纯黑 + 开口纯白"）
    const visBefore = lip ? lip.visible : null;
    entranceSilhouette(scene, true);
    const lipHidden = lip ? lip.visible === false : false;
    const visNames = [];
    scene.traverse((o) => {
      if ((o.isMesh || o.isPoints) && o.visible && o.name !== '_sil_opening') visNames.push(o.name || o.type);
    });
    entranceSilhouette(scene, false);
    const visRestored = lip ? lip.visible === visBefore : true;
    add('L9.silhouette', 'E1″ 隔离视图：内衬不可见、只留炉壁',
      'silhouette(true) 后 furnace_lip.visible=false 且可见网格只剩 furnace_wall；false 后复原 —— 依据 §2.4',
      { lipHidden, visNames, restored: visRestored },
      lipHidden && visNames.length === 1 && visNames[0] === 'furnace_wall' && visRestored);
  }

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
 * 四区 × 5 点；判据不改数（±§6.3"只改测法"），测法修正三处（均有实测依据，报告 §E5 详述）：
 *  · ①"炉膛内芯"按 §2.3 定义落在发光铁水床内片（0xFFC98A，y=1.36 的腔底）——
 *    §6.3 原坐标 y 3…6 落在 0x1A0E08 腔壁上，反照率封顶亮度 ≈30，物理上不可达 ≥200；
 *  · ②③ **2026-09-20 由 ENTRANCE-LIP-SPEC §4 重新裁定** ——
 *    原口径采的是**墙面**（法线朝观众 (0,0,+1)），而唯一造光晕的 furnace_core 点光在墙**背面**
 *    的炉膛里（z −16.5）→ 点积为负，物理不可达（Step 4C 报告 §4.3 已给证明）。
 *    新口径 = 采样点移到 §2 新增的**炉口内衬**面上（② u=0.85 靠炉膛侧、③ u=0.05 靠洞口侧），
 *    阈值 200 / 140 / 60–140 / 60 **一个都不动**。
 *  · ①②③ **回到 furnace 单机位**（③ 落在内衬上、在 14 m 处半视场 ±11.66 m 之内，不再需要 wide）；
 *    ④ 因 x ±22 落在 furnace 视锥外（实测屏幕 x = −602 / 2042），**仍留在 wide 机位**（§4.1 对 ④ 的裁定是「不变」）。
 */
const E5_PROBES = [
  // ① 五点全部落在**可见的铁水床**上（y=1.38 液面、x −3…3，r/R ≤ 0.54 全在平顶内），
  //   且 5×5 取样窗**整窗**落在熔池可见足迹内（帧差足迹 [446,614]…[993,639]，见 probe_vis.py）
  //   —— 贴边取样会把熔池与池沿/内衬的 AA 过渡像素混进来，读数被无端压低。
  //   ⚠️ 测法修正（2026-09-20，帧差取证）：原 5 点里的 (0,1.38,−15.6) 投影到屏 (720,653)，
  //   落在**内衬底带**上（不在熔池足迹内、在内衬足迹内），读到的是内衬的 ~153 而不是铁水。
  { zone: 1, view: 'furnace', label: '炉膛内芯（§2.3 发光铁水床内片 y=1.38，x −3…3）', world: [
    [-3, 1.38, -17.2], [3, 1.38, -17.2], [0, 1.38, -18.0], [0, 1.38, -17.6], [0, 1.38, -16.8],
  ] },
  // ② 唇口：内衬 u=0.85（inset 0.425 / z −14.51 / a 5.575 / b 2.875 / 拱心 (0,5.4)）
  { zone: 2, view: 'furnace', label: '唇口（炉口内衬 u=0.85：拱 30°/150°、拱 60°/120°、右侧壁）', world: [
    [4.828, 6.838, -14.51], [-4.828, 6.838, -14.51], [2.788, 7.890, -14.51],
    [-2.788, 7.890, -14.51], [5.575, 3.000, -14.51],
  ] },
  // ③ 过渡带：内衬 u=0.05（inset 0.025 / z −14.03 / a 5.975 / b 3.275）
  { zone: 3, view: 'furnace', label: '过渡带（炉口内衬 u=0.05：拱 30°/150°、拱 60°/120°、右侧壁）', world: [
    [5.175, 7.038, -14.03], [-5.175, 7.038, -14.03], [2.988, 8.236, -14.03],
    [-2.988, 8.236, -14.03], [5.975, 3.000, -14.03],
  ] },
  // ④ 墙角 / 远端钢构柱：**仍留在 wide 机位** ——
  //   ⚠️ 实现方判断（与 ENTRANCE-LIP-SPEC §4.2 脚注的"四区全部回到 furnace"冲突，理由 = 视锥实测）：
  //   `furnace` 机位 `pos [0,2.6,0]` 距墙 14 m、`fov 55`、画幅 1440×900 → 墙面上半视场**仅 ±11.66 m**；
  //   x ±22 的墙角投影到屏上 x = −602 / 2042，**整点在 1440 画幅之外**（实测见 e5-samples.json）。
  //   若强行在 furnace 帧取样，只会被 clamp 到画面边角、读出一个"看起来合格"的假值 ——
  //   那正是本工程最忌讳的"用假读数掩盖问题"。§4.1 表格对 ④ 的裁定本就是「**不变**」
  //   （即沿用 ENTRANCE-FURNACE-SPEC §6.3 修正 3 的 wide 机位口径），故按 §4.1 执行。
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
      // ENTRANCE-LIP-SPEC §2.4（验收 L9）：内衬 furnace_lip 属**开口区**，必须一并隐藏 ——
      // 否则开口里会出现一圈灰面，破坏"炉壁纯黑 + 开口纯白"的黑白对比。
      // 下面是**白名单**（只留 wall），所以内衬、炉床、铁水沟、炉前构件、火星全部自动隐藏。
      const keep = o === wall;
      state.saved.push([o, o.visible, o.material]);
      o.visible = keep;
      if (keep) o.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    });
    // ⚠️ 修复（实现方发现；ENTRANCE-LIP-SPEC §5.1 本就授权改本函数）：
    //    `ShapeGeometry` 需要 **Shape** —— three.js 只在 `Shape` 上定义了 `extractPoints()`，
    //    `Path` 没有继承到。原代码 `new THREE.ShapeGeometry(HOLE_PATH, 32)` 每次调用都抛
    //    `TypeError: u.extractPoints is not a function`，且抛在 traverse **之后**、opening 挂载之前
    //    → E1″ 隔离视图**从未真正工作过**（场景被藏起、开口没挂上，状态卡在 _silState）。
    //    修法：只借 HOLE_PATH 的 curves 包一层 Shape —— 几何定义零改动（HOLE_PATH 一字不动）。
    const silShape = new THREE.Shape();
    silShape.curves = HOLE_PATH.curves;
    const opening = new THREE.Mesh(
      new THREE.ShapeGeometry(silShape, 32),
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
