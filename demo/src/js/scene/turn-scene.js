/* ============================================================
   turn-scene.js — 「协作车削」小场景（spec/TURN-SPEC.md §3.3 / §5）
   复用：props/lathe.js 的 C620-1 几何（**只读 import，不编辑源文件**）
        —— 需要对实例操作的部分全部在本文件内完成（§5 原文）
   纪律：零 Math.random（确定性 sin 哈希，同 cast 页做法）
        工件 = 1 个 BufferGeometry（13 段 × 32 边），update 里改顶点 ⇒ 1 draw call
        贴图 0 增量（本页新增件全部纯色 / gl_PointCoord 圆点）
        不新增光源（沿用「半球主光 + 平行补光」两灯结构，只挪位调强）
        3600 ms 固定时长（与 n、f 无关）；参数 → 视觉三条映射单调可测
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from './merge.js';
import { buildLathe } from './props/lathe.js';
import { VIS, DURATION_MS, N_RANGE, F_RANGE, FALLBACK } from '../scoring/turning-data.js';

/* ---------- 展陈放大 ----------
   viewport.js 把 OrbitControls 的 minDistance 钳在 6（不能改源文件），
   故近景只能靠「放大实例 + 下调 minDistance」。本页 rig 统一 ×3：
   模型 1 单位 = 世界 3 单位 ⇒ 主轴中心线世界 y = 0.99 × 3 = 2.97。 */
const S = 3;
/* lathe.js 自身带 1.4 展陈放大；本页要自己掌控总量，故把实例 scale 归 1（对实例操作，非编辑源文件） */
const LATHE_AXIAL_SHIFT = 0.15;   // 轴向平移：让卡盘右端面正好落在工件左端（x = −0.18）

/* ---------- 「方刀台 / 刀头」必须在实例上剔除（规格未预见，实现方判断） ----------
   props/lathe.js 把 `方刀台 box(0.24,0.14,0.28) @(0.06,1.06,0)` 与 `刀头 @(−0.09,1.00,0)`
   与主体**合并进同一个 mesh**，而它们的**下沿正好切在主轴中心线 y = 0.99 上** ——
   在铸造馆里车床只占 121 px，看不出来；本页是近景，它们会直接**长进工件上半部**。
   合并后无法单独隐藏，故在实例几何上做一次**三角形质心剔除**（不改源文件）。
   ⚠️ 2026-09-22 用户验收裁定改框：原框 x∈(−0.40, 0.19) 把两个**跨边界零件拦腰斩断**
     —— 自带卡盘（cyl r0.16 @ x −0.53…−0.33）侧面三角形质心 T1=−0.463 / T2=−0.397，
     一半在框内一半在框外 ⇒ 交替删除成「鳍刺」；顶尖（锥 x 0.16…0.22）同理被 x1=0.19
     斩成半截锯齿锥。逐三角验算后改框：
     · x0 = −0.37：卡盘 T1/T2（−0.463/−0.397）**完整保留**（整个藏在本页自建卡盘
       r0.17 @ 世界 −1.65…−0.45 内部，本就不可见）；卡盘爪盒子面质心 ±0.35/−0.30
       全部 > −0.37 ⇒ 照常剔除；主轴箱右面（−0.53）保留 ⇒ 不开洞。
     · x1 = 0.23：顶尖（侧壁质心 0.18/0.20 + 底盘 0.22）**整体剔除**；套筒侧壁质心
       0.34/0.48 保留 ⇒ 完好；套筒左端盖（0.20）被剔，但毛坯余料加长到 x=0.37
       （世界 1.11 > 套筒左端 1.05）后整个藏进毛坯 ⇒ 无敞口。
     · y/z 不变：0.81 避开床身顶面浮点、z ±0.16 保留导轨（±0.25）与溜板箱（0.37+）。 */
const CULL = { x0: -0.37, x1: 0.23, y0: 0.81, y1: 1.20, z0: -0.16, z1: 0.16 };

/* ---------- 工件（塔轮毛坯 → 6 级台阶） ----------
   毛坯 = 等径大圆柱 R = 0.085；标称 R_i = 0.075 − i × 0.010（i = 0…5）
   半径偏差 ΔR = (0.30 − f) × 0.02（f 小 → 直径偏大 / f 大 → 直径偏小）
   ⚠️ 规格用 `z` 表示轴向；本项目复用的 C620-1 主轴沿 **x**，故轴向一律实现为 x。 */
const XL = -0.18;                 // 第 1 级起点（= 刀架轴向行程起点，规格原文 −0.18）
const STEP = 0.06;                // 每级轴向长度（6 × 0.06 = 0.36 = 规格行程）
const SHW = 0.0015;               // 台阶肩面轴向宽度（给一点点，否则法线退化）
const TAIL_X = 0.37;              // 毛坯余料末端：盖住车床自带「工件」圆柱 + 顶尖/套筒左端
                                  // （2026-09-22 由 0.34 加长：端面正好顶住套筒，结构闭合）
const STUB_X = -0.30;             // 左端伸进卡盘内部（免去左端盖）
const SIDES = 32;                 // 周向边数（规格：6 段 × 32 边）

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, p) => a + (b - a) * p;
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* ---------- 工件配色（顶点色，零贴图）----------
   「车过 vs 没车过」一眼可读：毛坯面暗哑，已加工面亮钢；
   另给一条纵向深色条纹（col 1–2，随主轴转）—— 转速 ω 是"看得见"的。 */
const C_LIN = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const COL_BLANK = C_LIN(0x59616B);
const COL_MACH = C_LIN(0xC7D0DA);
const COL_STRIPE = 0.72;

/** n、f 的入口钳制（与评分引擎同量程；非法回落 §3.4 初值） */
const saneN = (v) => (typeof v === 'number' && Number.isFinite(v)
  ? Math.min(N_RANGE.max, Math.max(N_RANGE.min, v)) : FALLBACK.n);
const saneF = (v) => (typeof v === 'number' && Number.isFinite(v)
  ? Math.min(F_RANGE.max, Math.max(F_RANGE.min, v)) : FALLBACK.f);

/** §3.3 视觉角速度 ω = n / 400 rad/s（0.50 … 3.00）—— 必须降速显示 */
export const omegaOf = (n) => saneN(n) / VIS.omegaDiv;
/** §3.3 台阶半径偏差 ΔR = (0.30 − f) × 0.02 */
export const drOf = (f) => (VIS.drMid - saneF(f)) * VIS.drCoef;
/** §3.3 刀痕暗环数量 = clamp(round((f − 0.40) × 25), 1, 8)；f ≤ 0.40 为 0 */
export function ringCountOf(f) {
  const x = saneF(f);
  if (x <= VIS.ringAt) return 0;
  return Math.min(VIS.ringMax, Math.max(VIS.ringMin, Math.round((x - VIS.ringAt) * VIS.ringCoef)));
}
/** 第 i 级标称半径（含 ΔR） */
export const radiusOf = (i, f) => VIS.nominalR0 - i * VIS.nominalStep + drOf(f);

/** 三角形质心剔除（保留盒外的三角形）—— 见 CULL 注释 */
function cullTriangles(geometry, box) {
  const pos = geometry.attributes.position.array;
  const nor = geometry.attributes.normal.array;
  const uv = geometry.attributes.uv?.array;
  const triCount = pos.length / 9;
  const keep = [];
  for (let t = 0; t < triCount; t++) {
    const o = t * 9;
    const cx = (pos[o] + pos[o + 3] + pos[o + 6]) / 3;
    const cy = (pos[o + 1] + pos[o + 4] + pos[o + 7]) / 3;
    const cz = (pos[o + 2] + pos[o + 5] + pos[o + 8]) / 3;
    const inside = cx > box.x0 && cx < box.x1 && cy > box.y0 && cy < box.y1
      && cz > box.z0 && cz < box.z1;
    if (!inside) keep.push(t);
  }
  const out = new THREE.BufferGeometry();
  const P = new Float32Array(keep.length * 9);
  const N = new Float32Array(keep.length * 9);
  const U = uv ? new Float32Array(keep.length * 6) : null;
  keep.forEach((t, k) => {
    P.set(pos.subarray(t * 9, t * 9 + 9), k * 9);
    N.set(nor.subarray(t * 9, t * 9 + 9), k * 9);
    if (uv) U.set(uv.subarray(t * 6, t * 6 + 6), k * 6);
  });
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  if (U) out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  out.computeBoundingSphere();
  geometry.dispose();
  return { geometry: out, removed: triCount - keep.length, kept: keep.length };
}

/* ============================================================
   工件：14 个环带（轴向带 / 肩面带）共 1 个 BufferGeometry
   ------------------------------------------------------------
   每个环带自带两个环（独立顶点 → 法线各自独立，且解析给定，无需每帧重算）：
     b0         轴向  [STUB_X, XL]   永不车（伸在卡盘里，开口被卡盘实体遮住）
     b1…b11     轴向 / 肩面交替：6 级台阶 + 5 道肩面
     b12        肩面  [xe5, xe5]     → 毛坯余料（半径跳回 R_blank）
     b13        轴向  [xe5, TAIL_X]  毛坯余料（始终 R_blank）
   切削进度：第 i 级环带半径 = lerp(R_blank, R_i, u_i)，u_i = clamp((xt − xs_i) / STEP)
             —— 刀架走完该级时正好车到标称半径（逐级成形）
   ============================================================ */
function buildWorkpiece() {
  const bands = [{ kind: 'axial', xa: STUB_X, xb: XL, seg: -1 }];
  let XE5 = TAIL_X;
  for (let i = 0; i < VIS.steps; i++) {
    const xs = XL + i * STEP;
    const xe = xs + STEP - SHW;
    bands.push({ kind: 'axial', xa: xs, xb: xe, seg: i });
    const nx = xe + SHW;
    if (i < VIS.steps - 1) {
      bands.push({ kind: 'shoulder', xa: xe, xb: nx, segA: i, segB: i + 1, sign: 1 });
    } else {
      XE5 = xe;
      bands.push({ kind: 'shoulder', xa: xe, xb: nx, segA: i, segB: -2, sign: -1 });
      bands.push({ kind: 'axial', xa: nx, xb: TAIL_X, seg: -2 });
    }
  }

  const rows = bands.length * 2;
  const cols = SIDES + 1;
  const capBase = rows * cols;
  const vCount = capBase + 1 + SIDES;               // 右端盖：中心 + 边缘
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const col = new Float32Array(vCount * 3);          // 顶点色：毛坯 / 已加工 / 条纹
  for (let i = 0; i < vCount; i++) {
    col[i * 3] = COL_BLANK[0]; col[i * 3 + 1] = COL_BLANK[1]; col[i * 3 + 2] = COL_BLANK[2];
  }
  const idx = [];
  const rowInfo = [];
  /** 肩面带的 [rowA, rowB, sign] 对：等径（毛坯态 / 已过刀）时法线要动态改写为径向，
      否则 1.5mm 小条带以轴向法线受光 ⇒ 圆柱面上出现一圈圈亮/暗竖线（被读成"锥度"）。 */
  const shoulderPairs = [];

  for (let b = 0; b < bands.length; b++) {
    const band = bands[b];
    for (const side of [0, 1]) {
      const row = b * 2 + side;
      const x = side === 0 ? band.xa : band.xb;
      const seg = band.kind === 'axial' ? band.seg : (side === 0 ? band.segA : band.segB);
      rowInfo[row] = { kind: band.kind, x, seg, sign: band.sign ?? 0 };
      if (band.kind === 'shoulder') {
        shoulderPairs.push([b * 2, b * 2 + 1, band.sign ?? 0]);
      }
      for (let s = 0; s < cols; s++) {
        const a = (s / SIDES) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const o = (row * cols + s) * 3;
        pos[o] = x; pos[o + 1] = ca; pos[o + 2] = sa;   // 半径先占位 1，update 里乘真实半径
        if (band.kind === 'axial') { nor[o] = 0; nor[o + 1] = ca; nor[o + 2] = sa; }
        else { nor[o] = band.sign; nor[o + 1] = 0; nor[o + 2] = 0; }
      }
    }
    const a0 = (b * 2) * cols;
    const a1 = (b * 2 + 1) * cols;
    for (let s = 0; s < SIDES; s++) {
      idx.push(a0 + s, a1 + s, a0 + s + 1);
      idx.push(a1 + s, a1 + s + 1, a0 + s + 1);
    }
  }

  // 右端盖（扇面，半径恒 R_blank，法线 +x）
  for (let s = 0; s < SIDES; s++) {
    const a = (s / SIDES) * Math.PI * 2;
    const ci = capBase + 1 + s;
    pos[ci * 3] = TAIL_X;
    pos[ci * 3 + 1] = VIS.blankR * Math.cos(a);
    pos[ci * 3 + 2] = VIS.blankR * Math.sin(a);
    nor[ci * 3] = 1;
  }
  pos[capBase * 3] = TAIL_X;
  nor[capBase * 3] = 1;
  for (let s = 0; s < SIDES; s++) idx.push(capBase, capBase + 1 + s, capBase + 1 + (s + 1) % SIDES);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();

  // 角向 cos/sin 查表（update 每帧写顶点时复用；避免逐顶点三角函数，也保证逐帧确定）
  const cosTbl = new Float32Array(cols);
  const sinTbl = new Float32Array(cols);
  for (let s = 0; s < cols; s++) {
    const a = (s / SIDES) * Math.PI * 2;
    cosTbl[s] = Math.cos(a);
    sinTbl[s] = Math.sin(a);
  }

  return {
    geometry: geo, rowInfo, cols, vCount, XE5, cosTbl, sinTbl, shoulderPairs,
    radiusAt(seg, xt, f) {
      if (seg < 0) return VIS.blankR;
      const u = clamp01((xt - (XL + seg * STEP)) / STEP);
      return lerp(VIS.blankR, radiusOf(seg, f), u);
    },
    /** 某段当前的切削进度（0 = 还是毛坯，1 = 已车到标称半径）—— 顶点色插值用 */
    cutU(seg, xt) {
      if (seg < 0) return 0;
      return clamp01((xt - (XL + seg * STEP)) / STEP);
    },
  };
}

/* ============================================================
   主场景
   ============================================================ */
export function buildTurnScene() {
  const group = new THREE.Group();
  group.name = 'turn_scene';
  const reduceMotion = (typeof matchMedia === 'function')
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rig = new THREE.Group();
  rig.name = 'turn_rig';
  rig.scale.setScalar(S);
  group.add(rig);

  /* ---------- 复用 C620-1（只读 import + 实例操作） ---------- */
  const lathe = buildLathe();
  lathe.group.position.set(LATHE_AXIAL_SHIFT, 0, 0);
  lathe.group.rotation.y = 0;
  lathe.group.scale.set(1, 1, 1);                     // 总量由 rig 的 ×3 承担
  lathe.group.userData.displayScale = [S, S, S];      // 改 scale 必须同步（lathe.js 头部的硬规矩）
  lathe.group.name = 'turn_lathe';                    // 换名：避免 viewport.layout() 误按铸造馆判据量它
  const SPINDLE_Y = lathe.spindleY;

  let cullInfo = { removed: 0, kept: 0 };
  lathe.group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const r = cullTriangles(o.geometry, CULL);
    o.geometry = r.geometry;
    cullInfo = { removed: cullInfo.removed + r.removed, kept: cullInfo.kept + r.kept };
  });
  rig.add(lathe.group);

  /* ---------- 主轴组（卡盘 + 工件 + 刀痕环一起转） ---------- */
  const spindle = new THREE.Group();
  spindle.name = 'turn_spindle';
  spindle.position.set(0, SPINDLE_Y, 0);              // 主轴中心线 = 局部 y = 0
  rig.add(spindle);

  /* ---------- 工件（1 mesh / 1 draw call） ---------- */
  const wp = buildWorkpiece();
  const wpMat = new THREE.MeshStandardMaterial({
    vertexColors: true, color: 0xffffff, roughness: 0.34, metalness: 0.55,
    side: THREE.DoubleSide,   // 端盖背对相机时（可环绕）内壁照常着色，杜绝「敞口管」观感
  });
  const wpMesh = new THREE.Mesh(wp.geometry, wpMat);
  wpMesh.name = 'turn_workpiece';
  wpMesh.castShadow = true;
  wpMesh.frustumCulled = false;
  spindle.add(wpMesh);

  /* ---------- 卡盘（自建可转；同时盖住车床自带卡盘的右缘与卡盘爪） ---------- */
  let chuckMesh;
  {
    const geos = [];
    const body = new THREE.CylinderGeometry(0.17, 0.17, 0.25, 28);
    body.rotateZ(Math.PI / 2);
    body.translate(-0.425, 0, 0);                     // x −0.55 … −0.30
    geos.push(body);
    const hub = new THREE.CylinderGeometry(0.105, 0.115, 0.06, 24);
    hub.rotateZ(Math.PI / 2);
    hub.translate(-0.285, 0, 0);
    geos.push(hub);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const jaw = new THREE.BoxGeometry(0.13, 0.075, 0.075);
      jaw.translate(-0.215, ca * 0.105, sa * 0.105);
      geos.push(jaw);
      const tooth = new THREE.BoxGeometry(0.11, 0.045, 0.045);
      tooth.translate(-0.205, ca * 0.062, sa * 0.062);
      geos.push(tooth);
    }
    // 端面细节（2026-09-22 用户细化裁定）：止口环 + 3 组内六角压紧螺钉
    // —— 并入卡盘同一 mesh（零新增 draw call），且随主轴旋转 ⇒ 转速可读
    const ring = new THREE.CylinderGeometry(0.125, 0.125, 0.010, 32);
    ring.rotateZ(Math.PI / 2);
    ring.translate(-0.296, 0, 0);
    geos.push(ring);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
      const scr = new THREE.CylinderGeometry(0.016, 0.016, 0.012, 6);
      scr.rotateZ(Math.PI / 2);
      scr.translate(-0.294, Math.cos(a) * 0.148, Math.sin(a) * 0.148);
      geos.push(scr);
    }
    chuckMesh = new THREE.Mesh(mergeGeometries(geos),
      new THREE.MeshStandardMaterial({ color: 0x767E88, roughness: 0.42, metalness: 0.72 }));
    chuckMesh.name = 'turn_chuck';
    chuckMesh.castShadow = true;
    spindle.add(chuckMesh);
  }

  /* ---------- 刀痕暗环（f > 0.40 才出现；按 f 重建，1 draw call） ----------
     半径取该级最终半径 + 0.0009 ⇒ 未车到时它埋在毛坯里（自遮挡），车到才显形 ——
     不需要任何额外显隐逻辑。 */
  let ringMesh = null;
  let ringCount = 0;
  function rebuildRings(f) {
    if (ringMesh) { spindle.remove(ringMesh); ringMesh.geometry.dispose(); ringMesh.material.dispose(); ringMesh = null; }
    ringCount = ringCountOf(f);
    if (ringCount === 0) return 0;
    const geos = [];
    for (let k = 0; k < ringCount; k++) {
      // 确定性布点：沿车削长度均匀分布 + 哈希微扰（禁 Math.random）
      const x = XL + 0.02 + (k + 0.5) * (0.34 / ringCount) + (hash(k + 3) - 0.5) * 0.012;
      const seg = Math.min(VIS.steps - 1, Math.max(0, Math.floor((x - XL) / STEP)));
      const r = radiusOf(seg, f) + 0.0009;
      const g = new THREE.CylinderGeometry(r, r, 0.006, SIDES, 1, true);
      g.rotateZ(Math.PI / 2);
      g.translate(x, 0, 0);
      geos.push(g);
    }
    ringMesh = new THREE.Mesh(mergeGeometries(geos),
      new THREE.MeshStandardMaterial({ color: 0x1C2128, roughness: 0.9, metalness: 0.3 }));
    ringMesh.name = 'turn_ringmarks';
    spindle.add(ringMesh);
    return ringCount;
  }

  /* ---------- 刀架 + 刀具（沿轴向走；在 rig 内故不随工件转） ----------
     R1-P2 8c：切刀细化成可辨认的「四工位方刀台 / 夹刀螺钉 / 刀片楔角」。
     ⚠️ 三条硬约束（违反会造成真实 bug，见 PROMPT-UX-REVISION-P2 §1 8c）：
       ① **零新增 draw call** —— 全部并入现有两个 mesh（刀架体 / 刀杆），不添 mesh、材质、贴图。
       ② **shank 的「局部原点 = 刀尖、朝向 +z」约定不许动** —— 2026-09-21「刀杆飞到 y≈5.9 高空」
          那次事故就是破这条约定造成的（见下方 poseAt 的注释）。
       ③ **刀架与新增工位不得侵入工件最大半径** —— 工件最大半径 0.085 ⇒ 刀架结构 **最小 z ≥ 0.145**；
          新增工位 / 螺钉**只许往 +z 或两侧（±x）长**，绝不往 −z（工件方向）长。 */
  const tool = new THREE.Group();
  tool.name = 'turn_tool';
  rig.add(tool);
  let shank;
  /** 新增件（方刀台 + 螺杆 / 螺母 / 压板 / 夹刀螺钉）的包围盒 —— 硬约束③的取证来源。
      只在刀架局部坐标下算一次（几何是静态的），不参与每帧。 */
  let postBB = null;
  {
    const geos = [];
    /** 平放盒体 */
    const b = (w, h, d, x, y, z) => {
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(x, y, z);
      geos.push(g);
    };
    /** 楔面用盒体：**先绕轴转、再平移**（旋转绕局部原点，故平移量即最终中心） */
    const bx = (w, h, d, rx, ry, x, y, z) => {
      const g = new THREE.BoxGeometry(w, h, d);
      if (rx) g.rotateX(rx);
      if (ry) g.rotateY(ry);
      g.translate(x, y, z);
      geos.push(g);
    };
    /** 竖立圆柱 / 六角柱（默认沿 y 轴，正是螺钉与螺杆的朝向） */
    const cyl = (r, h, seg, x, y, z) => {
      const g = new THREE.CylinderGeometry(r, r, h, seg);
      g.translate(x, y, z);
      geos.push(g);
    };

    b(0.34, 0.07, 0.30, 0, -0.105, 0.22);     // 刀架底座（骑在前导轨上，导轨顶 y = 0.85）
    b(0.16, 0.05, 0.16, 0, -0.045, 0.21);     // 上滑板

    /* —— 四工位方刀台：台体 + 绕中心 90° 阵列的 4 个工位凸台 ——
       台体 y ∈ [-0.0775, 0.0175]（顶面 = 刀杆顶面，故刀杆是被"夹"在台里而非穿过去）；
       凸台半径 0.075、半宽 0.020 ⇒ 最小 z = 0.240 − 0.075 − 0.020 = **0.145**（恰好守住硬约束③）。 */
    const POST_Z = 0.240, POST_Y = -0.030, POST_R = 0.075, POST_W = 0.020;
    const postFrom = geos.length;                  // 此行起 = 8c 新增件（下面单独量包围盒）
    b(0.11, 0.095, 0.10, 0, POST_Y, POST_Z);
    for (let k = 0; k < 4; k++) {                  // 0° / 90° / 180° / 270°
      const a = (k / 4) * Math.PI * 2;
      b(0.040, 0.056, 0.040,
        Math.sin(a) * POST_R, POST_Y, POST_Z + Math.cos(a) * POST_R);
    }
    // 中心螺杆（12 棱近似光杆）+ 压紧螺母（六角柱）
    cyl(0.012, 0.155, 12, 0, POST_Y + 0.0145, POST_Z);
    cyl(0.021, 0.020, 6, 0, 0.028, POST_Z);
    // 夹刀机构：一块压板（薄 box，落在刀杆正上方）+ 2 颗六角夹刀螺钉（穿过压板落在台面上）
    b(0.090, 0.010, 0.036, 0, 0.023, POST_Z - 0.052);
    cyl(0.008, 0.040, 6, -0.038, 0.022, POST_Z - 0.052);
    cyl(0.008, 0.040, 6, 0.038, 0.022, POST_Z - 0.052);
    // 量新增件包围盒（刀架局部坐标）：硬约束③ = 只许往 +z / ±x 长，min z ≥ 0.145
    postBB = new THREE.Box3();
    for (let i = postFrom; i < geos.length; i++) {
      geos[i].computeBoundingBox();
      postBB.union(geos[i].boundingBox);
    }

    const body = new THREE.Mesh(mergeGeometries(geos),
      new THREE.MeshStandardMaterial({ color: 0x6C757F, roughness: 0.5, metalness: 0.6 }));
    body.name = 'turn_tool_body';
    body.castShadow = true;
    tool.add(body);

    // 刀杆 + 刀片：随当前切削半径浮动，独立 mesh（**局部原点 = 刀尖**，朝向 +z）
    const sg = [];
    const sb = (w, h, d, x, y, z) => {
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(x, y, z);
      sg.push(g);
    };
    const sbx = (w, h, d, rx, ry, x, y, z) => {
      const g = new THREE.BoxGeometry(w, h, d);
      if (rx) g.rotateX(rx);
      if (ry) g.rotateY(ry);
      g.translate(x, y, z);
      sg.push(g);
    };
    sb(0.050, 0.035, 0.180, 0, 0, 0.160);      // 杆主体（厚）
    sb(0.040, 0.028, 0.050, 0, -0.001, 0.045); // 台阶：接刀头的一段略细
    // 硬质合金刀片：有前角面 / 后角面的楔形（不用 ExtrudeGeometry —— 顶点不可控会破原点约定）
    sb(0.032, 0.016, 0.026, 0, -0.002, 0.020);           // 刀片基体
    sbx(0.032, 0.003, 0.024, -18 * Math.PI / 180, 0, 0, 0.007, 0.021);   // 前角面（向刀尖下倾）
    sbx(0.032, 0.020, 0.003, 10 * Math.PI / 180, 0, 0, -0.003, 0.003);   // 主后面（后角，让出切削间隙）
    sbx(0.009, 0.009, 0.009, 0, Math.PI / 4, 0, -0.003, 0.000);          // 刀尖 45° 小斜切面（暗示 R0.4 倒圆）
    shank = new THREE.Mesh(mergeGeometries(sg),
      new THREE.MeshStandardMaterial({ color: 0xB8BFC7, roughness: 0.28, metalness: 0.8 }));
    shank.name = 'turn_tool_shank';
    shank.castShadow = true;
    tool.add(shank);
  }

  /* ---------- 切屑粒子（Points + gl_PointCoord 圆点，零贴图） ----------
     uScale = 画布高（设备像素）/ (2·tan(fov/2))，fov 55°、画布高 ≈652 CSS px、dpr ≤2
     ⇒ 1304 / 1.0412 ≈ 1252。aSize 即"世界尺寸"，gl_PointSize = aSize × uScale / (−mv.z)。 */
  const CHIPS = 150;
  const chipGeo = new THREE.BufferGeometry();
  const chipPos = new Float32Array(CHIPS * 3);
  const chipSize = new Float32Array(CHIPS);
  const chipHeat = new Float32Array(CHIPS);
  chipGeo.setAttribute('position', new THREE.BufferAttribute(chipPos, 3));
  chipGeo.setAttribute('aSize', new THREE.BufferAttribute(chipSize, 1));
  chipGeo.setAttribute('aHeat', new THREE.BufferAttribute(chipHeat, 1));
  const chipMat = new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 1252 },
      uHot: { value: new THREE.Color(0xFFB271) },
      uCool: { value: new THREE.Color(0x707A85) },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aHeat;
      varying float vHeat;
      uniform float uScale;
      void main() {
        vHeat = aHeat;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(0.001, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vHeat;
      uniform vec3 uHot;
      uniform vec3 uCool;
      uniform float uOpacity;
      void main() {
        float r = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.16, r);
        if (a <= 0.02) discard;
        vec3 c = mix(uCool, uHot, vHeat * vHeat);
        gl_FragColor = vec4(c, a * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const chips = new THREE.Points(chipGeo, chipMat);
  chips.name = 'turn_chips';
  chips.frustumCulled = false;
  rig.add(chips);

  /* ---------- 切削点热斑（4 粒、加色混合、零贴图）----------
     让"正在切削的位置"一眼锁定 —— 热斑 + 切屑 + 亮钢渐变三重可读。 */
  const SPARKS = 4;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkSize = new Float32Array(SPARKS);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('aSize', new THREE.BufferAttribute(sparkSize, 1));
  const sparkMat = new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 1252 },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      attribute float aSize;
      uniform float uScale;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(0.001, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity;
      void main() {
        float r = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.05, r);
        if (a <= 0.02) discard;
        vec3 c = mix(vec3(1.0, 0.60, 0.22), vec3(1.0, 0.94, 0.82), a);
        gl_FragColor = vec4(c, a * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.name = 'turn_sparks';
  sparks.frustumCulled = false;
  rig.add(sparks);

  /* ---------- 光：沿用两灯结构（半球 + 平行），只挪位/调强，不新增 ---------- */
  const hemi = new THREE.HemisphereLight(0x8FA3B8, 0x1A1E24, 0.62);
  group.add(hemi);
  const key = new THREE.DirectionalLight(0xFFE8D6, 1.35);
  key.position.set(2.6, 4.2, 2.6);
  key.target.position.set(-0.3, 2.9, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 22;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.035;      // 平面斜向明暗齿纹（shadow acne）的正解
  key.shadow.camera.updateProjectionMatrix();
  group.add(key, key.target);

  /* ============================================================
     时间线 —— poseAt(ms, n, f) 是 (ms, n, f) 的**纯函数**
     · 回放 = 换一个 driver，同一套 poseAt ⇒ 同记录两次回放必然逐帧一致（§3.8）
     · A 0–500 起动 / B 500–3200 切削 / C 3200–3600 收刀（§3.3，固定 3600 ms）
     ============================================================ */
  const WPD = wp.geometry.attributes.position;
  const posArr = WPD.array;
  const WPC = wp.geometry.attributes.color;
  const colArr = WPC.array;
  const WPN = wp.geometry.attributes.normal;
  const norArr = WPN.array;
  const rowR = new Float32Array(wp.rowInfo.length);   // 每行当前半径（肩面法线判定用）
  const A = 500, B = 3200, C = 3600;

  /** 角速度剖面（rad/s） */
  function omegaProfile(ms, w) {
    if (ms < 0) return w * 0.25;                       // 待机：慢转，看得出"主轴在动"
    if (ms < A) return w * easeInOutCubic(ms / A);     // A 段 0 → ω
    if (ms < B) return w;                              // B 段恒定
    if (ms < C) return w * (1 - easeInOutCubic((ms - B) / (C - B)));
    return 0;                                          // C 段末停转
  }
  /** 主轴转角 = ∫ω dt（固定步长数值积分；步长固定 ⇒ 同一 ms 必得同一角度） */
  function angleAt(ms, w) {
    const h = 20;
    let acc = 0;
    for (let t = -h; t < ms; t += h) {
      const t1 = Math.min(t + h, ms);
      acc += (omegaProfile(t, w) + omegaProfile(t1, w)) / 2 * ((t1 - t) / 1000);
    }
    return acc;
  }

  /** 姿态写入（唯一时间线出口） */
  function poseAt(ms, n, f) {
    n = saneN(n); f = saneF(f);
    const w = omegaOf(n);
    if (f !== curF) {                                  // f 变 → 重建刀痕环（只在 prepare 或首次生效）
      curF = f;
    }
    spindle.rotation.x = angleAt(ms, w);

    // 刀架轴向：progress 只由动画进度驱动，与 n、f 无关（§3.3 原文）
    const prog = clamp01((ms - A) / (B - A));
    const xt = XL + easeInOutCubic(prog) * (STEP * VIS.steps);
    const seg = Math.min(VIS.steps - 1, Math.max(0, Math.floor((xt - XL) / STEP)));
    // 刀尖径向位置 = 当前被车那一段的瞬时半径 + 安全偏移（A 段进入 / C 段退回）
    let off = 0;
    if (ms < A) off = lerp(0.07, 0, easeInOutCubic(clamp01(ms / A)));
    else if (ms >= B) off = lerp(0, 0.07, easeInOutCubic(clamp01((ms - B) / (C - B))));
    const rTip = wp.radiusAt(seg, xt, f) + off;

    tool.position.set(xt, SPINDLE_Y, 0);
    // ⚠️ shank 是 tool 的**子对象** —— 只补径向（z）；轴向/高度由父组承担。
    //  曾写成 (xt, SPINDLE_Y, rTip) 与父组偏移**叠加两次**，刀杆飞到 y≈5.9 高空
    //  （= 车床上方那个"悬空物体"），切点上没有刀 —— 2026-09-21 用户报告后修复。
    shank.position.set(0, 0, rTip);

    // 工件顶点：逐环带写半径（轴向带与肩面带都是圆环，差别只在法线方向；
    // 肩面两个环半径不同、x 相差 1.5 mm ⇒ 形成竖直台阶面）
    for (let row = 0; row < wp.rowInfo.length; row++) {
      const info = wp.rowInfo[row];
      const r = wp.radiusAt(info.seg, xt, f);
      rowR[row] = r;
      const base = row * wp.cols;
      for (let s = 0; s < wp.cols; s++) {
        const o = (base + s) * 3;
        posArr[o] = info.x;
        posArr[o + 1] = wp.cosTbl[s] * r;
        posArr[o + 2] = wp.sinTbl[s] * r;
      }
    }
    WPD.needsUpdate = true;

    // 肩面法线随几何状态切换（2026-09-22 用户"透视不对"裁定）：
    // 两侧行等径（毛坯态 / 刀已过）⇒ 该 1.5mm 条带贴在圆柱面上，法线必须是**径向**，
    // 否则以轴向法线受光，圆柱面出现一圈圈亮/暗竖线，整根毛坯被读成"锥度"；
    // 半径不等（真实台阶）⇒ 恢复轴向法线，竖直台阶面照常受光。
    for (const [ra, rb, sign] of wp.shoulderPairs) {
      const flat = Math.abs(rowR[ra] - rowR[rb]) < 0.0006;
      for (const row of [ra, rb]) {
        const base = row * wp.cols;
        for (let s = 0; s < wp.cols; s++) {
          const o = (base + s) * 3;
          if (flat) {
            norArr[o] = 0; norArr[o + 1] = wp.cosTbl[s]; norArr[o + 2] = wp.sinTbl[s];
          } else {
            norArr[o] = sign; norArr[o + 1] = 0; norArr[o + 2] = 0;
          }
        }
      }
    }
    WPN.needsUpdate = true;

    // 顶点色：毛坯暗 → 已加工亮钢，随刀架推进渐变 —— "切削前沿"跟着刀尖走（可读性核心）
    for (let row = 0; row < wp.rowInfo.length; row++) {
      const info = wp.rowInfo[row];
      const u = wp.cutU(info.seg, xt);
      const cr = COL_BLANK[0] + (COL_MACH[0] - COL_BLANK[0]) * u;
      const cg = COL_BLANK[1] + (COL_MACH[1] - COL_BLANK[1]) * u;
      const cb = COL_BLANK[2] + (COL_MACH[2] - COL_BLANK[2]) * u;
      const base = row * wp.cols;
      for (let s = 0; s < wp.cols; s++) {
        const k = (s === 1 || s === 2) ? COL_STRIPE : 1;   // 纵向条纹随主轴转
        const o = (base + s) * 3;
        colArr[o] = cr * k; colArr[o + 1] = cg * k; colArr[o + 2] = cb * k;
      }
    }
    WPC.needsUpdate = true;

    updateSparks(ms, xt, rTip - off);
    updateChips(ms, xt, rTip - off);
    return { ms, n, f, w, xt, seg, rTip, off, prog };
  }

  /* ---------- 切屑粒子：确定性（只依赖 ms / 刀尖位置） ---------- */
  function updateChips(ms, xt, rSurf) {
    // 只在 B 段发射（B 末留 120 ms 余屑）
    const active = ms >= A && ms < B + 120;
    chipMat.uniforms.uOpacity.value = active ? 0.95 : 0;
    if (!active) return;
    const msB = ms - A;
    for (let i = 0; i < CHIPS; i++) {
      const p = ((msB / 620) + hash(i)) % 1;            // 相位 0…1（确定性）
      const t = p;
      // 从切削点（工件顶前部）抛出：前上方喷出、受重力下坠成弧（2026-09-21 可读性改版）
      const vx = -(0.35 + hash(i + 4) * 0.70);
      const vy = 0.65 + hash(i + 5) * 0.85;
      const vz = 0.36 + hash(i + 6) * 0.62;
      chipPos[i * 3] = xt + vx * t * 0.40;
      chipPos[i * 3 + 1] = SPINDLE_Y + rSurf * 0.55 + vy * t * 0.34 - 2.6 * t * t * 0.16;
      chipPos[i * 3 + 2] = rSurf * 0.92 + vz * t * 0.30;
      chipSize[i] = (0.007 + hash(i + 8) * 0.008) * (1 - 0.3 * p);
      chipHeat[i] = Math.max(0, 1 - p * 1.15);
    }
    chipGeo.attributes.position.needsUpdate = true;
    chipGeo.attributes.aSize.needsUpdate = true;
    chipGeo.attributes.aHeat.needsUpdate = true;
  }

  /* ---------- 切削点热斑：只在 B 段；位置/大小是 ms 的确定性函数（禁随机） ---------- */
  function updateSparks(ms, xt, rSurf) {
    const active = ms >= A && ms < B;
    sparkMat.uniforms.uOpacity.value = active ? 0.7 + 0.3 * Math.sin(ms * 0.05) : 0;
    if (!active) return;
    for (let i = 0; i < SPARKS; i++) {
      const fl = 0.75 + 0.5 * hash(Math.floor(ms / 90) + i * 7);   // 确定性闪烁
      sparkPos[i * 3] = xt + (hash(i + 11) - 0.5) * 0.012;
      sparkPos[i * 3 + 1] = SPINDLE_Y + (hash(i + 12) - 0.5) * 0.012 + (i === 0 ? 0 : 0.01 * fl);
      sparkPos[i * 3 + 2] = rSurf + 0.002;
      sparkSize[i] = (i === 0 ? 0.028 : 0.012) * fl;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.aSize.needsUpdate = true;
  }

  /* ---------- 对外 API ---------- */
  let driver = () => ({ ms: -1, n: FALLBACK.n, f: FALLBACK.f });
  let curF = FALLBACK.f;
  let last = { ms: -1, n: FALLBACK.n, f: FALLBACK.f };
  let prepared = { n: FALLBACK.n, f: FALLBACK.f };
  let rings = 0;

  const api = {
    group,

    /** 参数预览（未开车）：只更新待机姿态与刀痕环，不动工件 */
    prepare(n, f) {
      prepared = { n: saneN(n), f: saneF(f) };
      rings = rebuildRings(prepared.f);
      api.poseAt(-1, prepared.n, prepared.f);
      return rings;
    },

    /** 实机驱动（页面每帧给出 {ms,n,f}） */
    setDriver(fn) { driver = fn; },

    poseAt(ms, n, f) { last = poseAt(ms, n, f); return last; },

    update(t) {
      const d = driver(t) || {};
      poseAt(typeof d.ms === 'number' ? d.ms : -1,
        d.n ?? prepared.n, d.f ?? prepared.f);
    },

    /** ?debug=1 取证用：全部读实时场景/几何实测值，不写死 */
    debugState() {
      // 工件世界包围盒：先按当前顶点重算 boundingBox，再取世界盒（数值判据的可复现来源）
      wp.geometry.computeBoundingBox();
      const wb = new THREE.Box3().setFromObject(wpMesh);
      const rad = wb.getSize(new THREE.Vector3());
      const perSeg = [];
      for (let i = 0; i < VIS.steps; i++) perSeg.push(+radiusOf(i, last.f).toFixed(5));
      return {
        ms: Math.round(last.ms),
        n: last.n, f: last.f,
        omega: +omegaOf(last.n).toFixed(3),
        spindleAngle: +spindle.rotation.x.toFixed(4),
        workpiece: {
          blankR: VIS.blankR,
          dr: +drOf(last.f).toFixed(5),
          perSegment: perSeg,
          // 世界盒（径向 = y/z 向尺寸的一半；工件轴向 = 世界 x）
          worldSize: [+rad.x.toFixed(4), +rad.y.toFixed(4), +rad.z.toFixed(4)],
          worldRadius: +(rad.y / 2).toFixed(5),
          worldMinY: +wb.min.y.toFixed(4), worldMaxY: +wb.max.y.toFixed(4),
        },
        rings: ringCount,
        ringsExpected: ringCountOf(last.f),
        /* R1-P2 8c 取证：刀架仍是 2 个 mesh（零新增 draw call）；
           并给出刀架体在**刀架局部坐标**下的 z 范围 —— 硬约束要求 min z ≥ 0.145
           （工件最大半径 0.085，只许往 +z 或 ±x 长）。 */
        tool: {
          x: +tool.position.x.toFixed(4),
          tipRadius: +last.rTip.toFixed(5),
          radialOffset: +last.off.toFixed(5),
          meshes: (() => {
            const names = [];
            tool.traverse((o) => { if (o.isMesh) names.push(o.name); });
            return names;
          })(),
          body: (() => {
            const m = tool.getObjectByName('turn_tool_body');
            if (!m) return null;
            m.geometry.computeBoundingBox();
            const bb = m.geometry.boundingBox;
            return {
              minZ: +bb.min.z.toFixed(4), maxZ: +bb.max.z.toFixed(4),
              minY: +bb.min.y.toFixed(4), maxY: +bb.max.y.toFixed(4),
            };
          })(),
          /* 8c 新增件（方刀台 / 螺杆 / 螺母 / 压板 / 螺钉）在**刀架局部坐标**下的包围盒。
             ⚠️ 上层 `body` 的包围盒含**既有**底座（z 0.07~0.37），量不出 8c 的约束；
             硬约束③（刀架不侵入工件最大半径）只能对**新增件**量：min z ≥ 0.145。 */
          post: postBB ? {
            minZ: +postBB.min.z.toFixed(4), maxZ: +postBB.max.z.toFixed(4),
            minX: +postBB.min.x.toFixed(4), maxX: +postBB.max.x.toFixed(4),
          } : null,
          shank: (() => {
            const m = tool.getObjectByName('turn_tool_shank');
            if (!m) return null;
            m.geometry.computeBoundingBox();
            const bb = m.geometry.boundingBox;
            return { minZ: +bb.min.z.toFixed(4), maxZ: +bb.max.z.toFixed(4) };
          })(),
        },
        lathe: { culledTriangles: cullInfo.removed, keptTriangles: cullInfo.kept },
        reduceMotion,
        durationMs: DURATION_MS,
      };
    },

    dispose() {
      lathe.dispose();
      wp.geometry.dispose();
      wpMat.dispose();
      chuckMesh.geometry.dispose();
      chuckMesh.material.dispose();
      if (ringMesh) { ringMesh.geometry.dispose(); ringMesh.material.dispose(); }
      tool.children.forEach((c) => { c.geometry.dispose(); c.material.dispose(); });
      chipGeo.dispose();
      chipMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
    },
  };
  group.userData.api = api;
  return api;
}
