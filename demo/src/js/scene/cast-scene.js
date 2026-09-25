/* ============================================================
   cast-scene.js — 「亲手浇铸」小场景（Step 3，spec §12.9）
   W3 全量重做（VISUAL-REFINE-SPEC §4，Q3.1–Q3.6）：
     · 浇包重做：开口包壳 + 包衬 + 低于口沿 0.40 m 的液面 + 浇嘴 + 吊具
       （包口不再是"盖住整个包口的橙色圆盘"—— 那是旧版最大的问题）
     · 冲天炉归位 (−1, 0, −11)（站在 44×40 新地面上）+ 长出出铁口/流槽/烟囱
     · 摆位：引导线改作业区矩形；浇注悬停位按倾角解算
       —— 浇嘴尖始终对准浇口盆正上方（流铅垂）
   W3 补轮（VISUAL-REFINE-SPEC §4A，用户 2026-09-20 指令）：
     · W3-R3 浇包起点落地（包底贴地，世界 y = 0）+ 新增 800 ms 起吊段 R，
       再接原有 A–E —— 两段一条时间线，总长 3400 → 4200 ms
     · W3-R4 铸件改单个干净长方体（去掉凸台/肋/冒口残根）
     · W3-R5 铸件表面改为「按总分的 3 档」且**彻底不用随机斑点**
   纪律：无 Math.random（确定性 hash）；动画计时帧差且单帧上限 50ms（E10）；
        铁水流可变高度用 mesh.scale.y（E4 性能纪律）；贴图 0 增量；不加光源。
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from './merge.js';
import { buildSandboxes } from './props/sandboxes.js';
import { makeFloorRoughnessMap } from './textures.js';

const C = {
  floor:   0x23282F,   // W1 §2.3：与铸造馆同一块地坪配方
  ember:   0xE8663C,
  iron:    0x4A515A,   // Q3.1 包壳（原 0x3A4149 过暗，读作黑桶）
  dark:    0x1A1E24,
};

/* ---------- 时间轴：起吊段 R + Q3.5 五段 A–E（总 4200 ms）
   R 为 2026-09-20 用户指令新增（VISUAL-REFINE-SPEC §4A W3-R3）：
   浇包起点由「悬吊休息位」改为「包底贴地」，浇注时先平滑升起，再接原有 A–E ——
   两段共用同一条 update(t)，中间不换时间线、不跳变。 ---------- */
const POT_BOTTOM = 0.20;       // 包底在 group 局部 y（吊轴 1.42 − 包底 1.22）
const GROUND_GAP = 0.015;      // 包底抬 15 mm 离地 —— 正好贴地会与地面**共面**，触发 z-fighting
const GROUND = { x: 4.6, y: -POT_BOTTOM + GROUND_GAP, z: -3.7 };  // 落地位：包底世界 y = 15 mm
const SEG = { R: 800, A: 1500, B: 2050, C: 3000, D: 3500, E: 4200 };
const LIFT_H = 1.15;           // 上箱抬起高度（m）
const TILT = 52 * Math.PI / 180; // B 段倾包角
const PARTICLES = 110;         // 型砂 / 火星共用粒子数
const COOL_MS = 2500;          // Q3.6 冷却时长
const COOL_FROM = 1.15;        // emissiveIntensity 起点
const REST = { x: 4.6, y: 2.2, z: -3.7 };   // 浇包悬吊休息位（R 段终点 / A 段起点）
// 裁定记录（W3-R1，用户 2026-09-20）：规格 Q3.4 原定 (4.2, 2.85, 8.2)，实测该位在 close
// 机位视锥外（偏离光轴 ~64°），P1「close 机位看见包衬与低液面」不可达成 → 按用户裁定挪回
// close 画幅。y 取 2.2：close 机位低视角下包体+吊具共 2.36 m 高，2.85 会让轨道顶出框 ~1°。
// 解算依据：fov 55°、画布纵横比 ~1.28（.workbuddy/verify_w3.py 附实测）。
const REST_YAW = Math.atan2(8.5 - REST.x, 3 - REST.z); // 局部 +Z（浇嘴）→ 砂箱阵列中心 (8.5, 3)
const HOVER_Y = 2.55;          // A 段目标悬停高（浇嘴尖在浇口盆上方 ~2.5 m）
const ARC_A = 0.45 + (REST.y - HOVER_Y) / 2;   // 抬升弧振幅：峰值 = 休息位 + 0.45 m（规格 Q3.5）
const ARC_Y  = REST.y + 0.45;                  // 抬升弧峰值

// 浇嘴尖（pot 局部 = 包底坐标 (0, 1.05, 1.45)，与 spoutTipWorld 同一点）
const TIP_LOCAL = { y: -0.37, z: 1.45 };

/** 确定性伪随机（替代 Math.random，同输入永远同输出） */
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, p) => a + (b - a) * p;

/* ---------- 铸件表面：按评级 3 档（VISUAL-REFINE-SPEC §4A W3-R5，用户指令） ----------
   旧版是「24 处随机圆斑 + 逐点气孔 + 亮点」—— 正是本项目铁律里
   「随机位置的小斑 + 高频噪点 = 廉价感第一来源」的典型，用户判为「斑点材质不好看」。
   新贴图**只允许**四类规整 / 低频元素：大尺度梯度、等距冷却纹、内缩镶边、顶边氧化带。
   基底取近白（调制图），档位色调由 material.color 承担 —— 免得色调被乘两次。
   贴图槽位不变：仍只有铸件 1 张，逐炉 dispose 旧的再建新的（§6.3 不增贴图）。 ---------- */
const INGOT_TIER = {
  fine:  { rules: 1, band: 0.10, seam: 0, cut: false,
           color: 0xA6ACB3, roughness: 0.38, metalness: 0.42 },
  mid:   { rules: 3, band: 0.17, seam: 1, cut: false,
           color: 0x8A9096, roughness: 0.52, metalness: 0.48 },
  rough: { rules: 5, band: 0.26, seam: 2, cut: true,
           color: 0x6C7178, roughness: 0.70, metalness: 0.55 },
};
const tierOf = (t) => (INGOT_TIER[t] ? t : 'mid');

function makeIngotTexture(tier) {
  const T = INGOT_TIER[tierOf(tier)];
  const w = 256, h = 192;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // ① 大尺度纵向明暗梯度（上亮下暗：上部最后凝固、下部贴型先冷）
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#FBFCFD');
  g.addColorStop(0.45, '#F1F2F4');
  g.addColorStop(1, '#E2E5E8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // ② 等距横向冷却纹（铸型分层充型留下的规整痕）—— 条数 = 档位
  ctx.strokeStyle = 'rgba(198,202,207,0.75)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= T.rules; i++) {
    const y = Math.round(h * i / (T.rules + 1)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // ③ 顶边氧化带（成片、贴边、低对比 —— 不是斑点）
  const bandPx = Math.round(h * T.band);
  const bg = ctx.createLinearGradient(0, 0, 0, bandPx);
  bg.addColorStop(0, 'rgba(196,188,178,0.55)');
  bg.addColorStop(1, 'rgba(196,188,178,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, bandPx);

  // ④ 冷隔带（充型前沿的接合线，规整横带）—— 条数 = 档位
  for (let i = 0; i < T.seam; i++) {
    const y = Math.round(h * (0.42 + i * 0.26)) + 0.5;
    ctx.strokeStyle = 'rgba(172,178,186,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(248,250,252,0.6)';   // 下沿提亮一线 → 接痕的台阶感
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 2.5);
    ctx.lineTo(w, y + 2.5);
    ctx.stroke();
  }

  // ⑤ 四边内缩镶边（合箱分界 —— 规整结构，几何感）
  ctx.strokeStyle = 'rgba(200,204,209,0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(7, 7, w - 14, h - 14);

  // ⑥ 顶边中央缺口（仅 rough：冷隔的极端形态，规整梯形）
  if (T.cut) {
    ctx.fillStyle = 'rgba(150,155,162,0.9)';
    ctx.beginPath();
    ctx.moveTo(w * 0.36, 0);
    ctx.lineTo(w * 0.62, 0);
    ctx.lineTo(w * 0.55, h * 0.11);
    ctx.lineTo(w * 0.43, h * 0.11);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- 顶点色多环圆盘（CircleGeometry 是三角扇，径向渐变的"平顶"
   会被圆心↔外环插值抹掉 —— W2 铁水床同一坑，直接用多环盘） ---------- */
function makeRadialDisk(radius, seg, stops) {
  // stops: [[t, colorHex], ...] 递增
  const RINGS = [0, 0.3, 0.55, 0.8, 1.0];
  const pos = [], col = [], idx = [];
  const cA = new THREE.Color(), cB = new THREE.Color(), c = new THREE.Color();
  const colorAt = (t) => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const p = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
        return c.copy(cA.setHex(stops[i - 1][1])).lerp(cB.setHex(stops[i][1]), p);
      }
    }
    return c.setHex(stops[stops.length - 1][1]);
  };
  pos.push(0, 0, 0);
  const c0 = colorAt(0); col.push(c0.r, c0.g, c0.b);
  for (let k = 1; k < RINGS.length; k++) {
    const r = radius * RINGS[k];
    const ck = colorAt(RINGS[k]);
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
      col.push(ck.r, ck.g, ck.b);
    }
  }
  for (let s = 0; s < seg; s++) idx.push(0, 1 + s, 2 + s);
  for (let k = 1; k < RINGS.length - 1; k++) {
    const base = 1 + (k - 1) * (seg + 1);
    for (let s = 0; s < seg; s++) {
      const a = base + s, b = base + seg + 1 + s;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ---------- 两点间圆杆（吊索等斜向件用，避免手算旋转） ---------- */
function barBetween(p1, p2, r, seg = 8) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const g = new THREE.CylinderGeometry(r, r, dir.length(), seg);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.applyQuaternion(q);
  g.translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
  return g;
}

/* ---------- 浇包（Q3.1：局部坐标 y=0 为包底，浇嘴朝局部 +Z） ----------
   结构：group（移动/转向，不倾）
        ├ pot（绕吊轴轴线的水平轴倾转，origin = 吊轴 y 1.42）
        │   └ 包壳/包底/包衬/口沿/铁水面/浇嘴/颊板/包箍/吊耳/吊轴
        └ gantry（行车：吊索/吊钩/小车/轨道段；跟随移动、反向旋转保持水平）   */
function buildLadle() {
  const group = new THREE.Group();
  group.name = 'ladle';

  const shellMat = new THREE.MeshStandardMaterial({
    color: C.iron, roughness: 0.55, metalness: 0.65, side: THREE.DoubleSide,
  });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x2E343B, roughness: 0.5, metalness: 0.7 });
  const liningMat = new THREE.MeshStandardMaterial({
    color: 0x3A2A22, roughness: 0.95, metalness: 0, side: THREE.BackSide,
  });
  const meltMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x2A3037, roughness: 0.6, metalness: 0.6 });

  const pot = new THREE.Group();
  pot.name = 'ladle_pot';
  pot.position.y = 1.42;          // 倾转 pivot = 吊轴轴线；子件坐标 = 包底坐标 − 1.42
  const oy = -1.42;

  // 包壳（开口锥台）
  const shell = new THREE.CylinderGeometry(0.95, 0.62, 1.30, 32, 1, true);
  shell.translate(0, oy + 0.85, 0);
  // 包底
  const bottom = new THREE.CircleGeometry(0.62, 32);
  bottom.rotateX(-Math.PI / 2);
  bottom.translate(0, oy + 0.20, 0);
  // 包口沿
  const rim = new THREE.TorusGeometry(0.95, 0.05, 8, 40);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, oy + 1.50, 0);
  // 浇嘴半管（口沿 +Z 侧，绕 x 轴下倾 35°）
  const spout = new THREE.CylinderGeometry(0.16, 0.16, 0.70, 12, 1, true, -Math.PI / 2, Math.PI);
  spout.rotateX(Math.PI / 2);            // 轴向 → +z，开口朝上
  spout.rotateX(35 * Math.PI / 180);     // 远端下倾 35°
  spout.translate(0, oy + 1.24, 1.12);
  // 浇嘴颊板 ×2 / 包箍 ×2 / 吊耳 ×2
  const shellGeos = [shell, bottom, rim, spout];
  const bandGeos = [];
  for (const s of [-1, 1]) {
    const cheek = new THREE.BoxGeometry(0.05, 0.22, 0.60);
    cheek.rotateX(35 * Math.PI / 180);
    cheek.translate(s * 0.185, oy + 1.27, 1.10);
    shellGeos.push(cheek);
    const band = new THREE.TorusGeometry(0.93, 0.035, 6, 32);
    band.rotateX(Math.PI / 2);
    band.translate(0, oy + (s > 0 ? 1.15 : 0.45), 0);
    bandGeos.push(band);
    const ear = new THREE.BoxGeometry(0.06, 0.30, 0.22);
    ear.translate(s * 0.99, oy + 1.42, 0);
    shellGeos.push(ear);
  }
  // 吊轴（横贯两耳的倾转轴）
  const trunnion = new THREE.CylinderGeometry(0.07, 0.07, 2.12, 12);
  trunnion.rotateZ(Math.PI / 2);
  trunnion.translate(0, oy + 1.42, 0);
  shellGeos.push(trunnion);

  const shellMesh = new THREE.Mesh(mergeGeometries(shellGeos), shellMat);
  shellMesh.name = 'ladle_shell';
  shellMesh.castShadow = true;
  const bandMesh = new THREE.Mesh(mergeGeometries(bandGeos), bandMat);
  bandMesh.name = 'ladle_bands';
  bandMesh.castShadow = true;
  pot.add(shellMesh, bandMesh);

  // 包衬（BackSide：观众从包口看进去的内壁）
  const lining = new THREE.CylinderGeometry(0.80, 0.50, 1.24, 32, 1, true);
  lining.translate(0, oy + 0.83, 0);
  const liningMesh = new THREE.Mesh(lining, liningMat);
  liningMesh.name = 'ladle_lining';
  pot.add(liningMesh);

  // 铁水面：y = 1.10，低于口沿 0.40 m ——「有容积」的唯一凭据（多环顶点色盘）。
  // ⚠️ makeRadialDisk 顶点直接布在 xz 平面（已是水平盘），不再 rotateX ——
  //    多转一次会立成垂直圆盘、从包口上方鼓出「橙色穹顶」（W3 首轮实测踩坑）
  const meltGeo = makeRadialDisk(0.72, 32, [
    [0.0, 0xFFE7C0], [0.55, 0xFF9A4A], [1.0, 0xB8481F],
  ]);
  meltGeo.translate(0, oy + 1.10, 0);
  const melt = new THREE.Mesh(meltGeo, meltMat);
  melt.name = 'ladle_melt';
  pot.add(melt);

  group.add(pot);

  // 行车（吊索/吊钩/小车/轨道段）——水平保持，跟随移动
  const gantry = new THREE.Group();
  gantry.name = 'ladle_gantry';
  {
    const geos = [];
    // 吊索 ×2：从吊耳 (±0.80, 1.47) 斜向汇聚到吊钩 (0, 2.02)
    geos.push(barBetween(new THREE.Vector3(-0.80, 1.47, 0), new THREE.Vector3(0, 2.02, 0), 0.02, 6));
    geos.push(barBetween(new THREE.Vector3(0.80, 1.47, 0), new THREE.Vector3(0, 2.02, 0), 0.02, 6));
    // 吊钩（半环）
    const hook = new THREE.TorusGeometry(0.13, 0.035, 6, 16, Math.PI);
    hook.rotateZ(Math.PI);            // 开口朝下
    hook.translate(0, 2.10, 0);
    geos.push(hook);
    // 小车
    const trolley = new THREE.BoxGeometry(0.70, 0.30, 0.50);
    trolley.translate(0, 2.34, 0);
    geos.push(trolley);
    // 轨道段
    const rail = new THREE.BoxGeometry(3.6, 0.14, 0.16);
    rail.translate(0, 2.56, 0);
    geos.push(rail);
    const gantryMesh = new THREE.Mesh(mergeGeometries(geos), gantryMat);
    gantryMesh.name = 'ladle_gantry_mesh';
    gantryMesh.castShadow = true;
    gantry.add(gantryMesh);
  }
  group.add(gantry);

  // 包口点光：本场景的暖色主源（Q3.1：保持在包口正上方，y=1.5）
  const light = new THREE.PointLight(C.ember, 2.2, 15, 1.5);
  light.name = 'ladle_light';
  light.position.set(0, 1.5, 0);
  group.add(light);

  group.position.set(GROUND.x, GROUND.y, GROUND.z);   // 起点 = 包底贴地（W3-R3）
  group.rotation.y = REST_YAW;    // 浇嘴朝砂箱阵列

  return {
    group, pot, gantry, melt, meltMat, light,
    dispose() {
      shellMesh.geometry.dispose();
      bandMesh.geometry.dispose();
      liningMesh.geometry.dispose();
      melt.geometry.dispose();
      gantry.children[0].geometry.dispose();
      shellMat.dispose(); bandMat.dispose(); liningMat.dispose();
      meltMat.dispose(); gantryMat.dispose();
    },
  };
}

/* ---------- 冲天炉（Q3.3：归位 + 长成炉子，全部 merge 1 mesh） ---------- */
function buildCupolaSilhouette() {
  const mat = new THREE.MeshStandardMaterial({ color: C.dark, roughness: 0.95, metalness: 0.1 });
  const geos = [];
  // 炉体
  const body = new THREE.CylinderGeometry(1.85, 2.25, 9.5, 24);
  body.translate(0, 4.75, 0);
  geos.push(body);
  // 炉腹带 ×2
  for (const y of [2.6, 6.4]) {
    const band = new THREE.TorusGeometry(2.20, 0.10, 6, 24);
    band.rotateX(Math.PI / 2);
    band.translate(0, y, 0);
    geos.push(band);
  }
  // 炉顶锥 + 烟囱
  const top = new THREE.ConeGeometry(2.05, 1.6, 24);
  top.translate(0, 10.3, 0);
  geos.push(top);
  const stack = new THREE.CylinderGeometry(0.85, 0.95, 4.2, 20);
  stack.translate(0, 13.2, 0);
  geos.push(stack);
  // 基础 + 4 支腿
  const base = new THREE.BoxGeometry(5.2, 1.0, 5.2);
  base.translate(0, 0.5, 0);
  geos.push(base);
  for (const [lx, lz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) {
    const leg = new THREE.BoxGeometry(0.5, 2.2, 0.5);
    leg.translate(lx, 1.1, lz);
    geos.push(leg);
  }
  // 出铁口（朝 +x 侧，y 1.45）+ 流槽（从出铁口斜下指向浇包休息位象限）
  const tap = new THREE.BoxGeometry(0.35, 0.5, 0.7);
  tap.translate(2.2, 1.45, 0);
  geos.push(tap);
  const runner = new THREE.BoxGeometry(2.4, 0.16, 0.45);
  runner.rotateZ(-10 * Math.PI / 180);   // 斜下
  runner.rotateY(-22 * Math.PI / 180);   // 略朝 +z（浇包方向）
  runner.translate(3.4, 1.18, 0.42);
  geos.push(runner);

  const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
  mesh.name = 'cupola_silhouette';

  // 风口带火色环（呼吸微光，叙事上与主车间冲天炉同源）
  const ringMat = new THREE.MeshStandardMaterial({
    color: C.ember, emissive: C.ember, emissiveIntensity: 1.2, roughness: 0.6,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.28, 0.06, 6, 24), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.2;

  const group = new THREE.Group();
  group.name = 'cupola_sil';
  group.add(mesh, ring);
  group.position.set(-1.0, 0, -11.0);   // Q3.3：站在 44×40 新地面上（z=−11 > −20）
  return {
    group, ring,
    dispose() {
      mesh.geometry.dispose();
      ring.geometry.dispose();
      mat.dispose();
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
 *   openBox(idx:number, surface:{tier:'fine'|'mid'|'rough', total:number}, onDone:Function):void,
 *   finishOpen():void,
 *   resetBoxes():void,
 * }}
 */
export function buildCastScene() {
  const group = new THREE.Group();
  group.name = 'cast_scene';

  // ---------- 地面（W1 §2.3：44×40 @(4,0,0)，盖住冲天炉与整个作业区）----------
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

  // 作业引导线（Q3.4：一圈作业区矩形，阵列外扩 1.0 m，与铸造馆同语言）
  const lineMat = new THREE.MeshBasicMaterial({ color: C.ember, transparent: true, opacity: 0.16 });
  let guide;
  {
    const X0 = 4.2, X1 = 12.8, Z0 = -1.9, Z1 = 7.9, W = 0.12;
    const segs = [];
    const hseg = (len, x, z) => new THREE.PlaneGeometry(len, W).rotateX(-Math.PI / 2).translate(x, 0.01, z);
    const vseg = (len, x, z) => new THREE.PlaneGeometry(W, len).rotateX(-Math.PI / 2).translate(x, 0.01, z);
    segs.push(hseg(X1 - X0 + W, (X0 + X1) / 2, Z0));
    segs.push(hseg(X1 - X0 + W, (X0 + X1) / 2, Z1));
    segs.push(vseg(Z1 - Z0 + W, X0, (Z0 + Z1) / 2));
    segs.push(vseg(Z1 - Z0 + W, X1, (Z0 + Z1) / 2));
    guide = new THREE.Mesh(mergeGeometries(segs), lineMat);
    guide.name = 'cast_guide_ring';
    guide.renderOrder = 1;
    group.add(guide);
  }

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
  const baseLower = [];
  const tmpBase = new THREE.Matrix4();
  for (let i = 0; i < COUNT; i++) {
    pickMeshes[0].getMatrixAt(i, tmpBase);
    baseLower.push(tmpBase.clone());
    pickMeshes[1].getMatrixAt(i, tmpBase);
    baseUpper.push(tmpBase.clone());
    pickMeshes[2].getMatrixAt(i, tmpBase);
    baseCup.push(tmpBase.clone());
  }

  // 逐实例着色：选中=铁水橙提亮，已消耗=压暗（§2 ①）
  const white = new THREE.Color(1, 1, 1);
  const hot = new THREE.Color(1.9, 1.05, 0.62);
  const dim = new THREE.Color(0.32, 0.32, 0.34);
  const warmPour = new THREE.Color(1.25, 1.05, 0.80);   // Q3.5 C 段：目标砂箱暖色叠加
  function paint(idx, consumed) {
    for (const m of pickMeshes) {
      for (let i = 0; i < COUNT; i++) {
        m.setColorAt(i, consumed.has(i) ? dim : i === idx ? hot : white);
      }
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
  function paintOne(idx, color) {
    for (const m of pickMeshes) {
      m.setColorAt(idx, color);
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
  paint(null, new Set());   // 初始化 instanceColor，统一走逐实例着色管线

  // ---------- 铸件（W3-R4：单个干净长方体；表面按总分 3 档，见 INGOT_TIER） ----------
  const _t0 = INGOT_TIER.mid;
  const ingotMat = new THREE.MeshStandardMaterial({
    color: _t0.color, roughness: _t0.roughness, metalness: _t0.metalness,
    emissive: 0xFF6A2A, emissiveIntensity: 0,
  });
  const ingotGeo = new THREE.BoxGeometry(1.15, 0.42, 0.85);
  ingotGeo.translate(0, 0.21, 0);        // 底面坐在下箱顶面（世界 y 0.42）
  const ingot = new THREE.Mesh(ingotGeo, ingotMat);
  ingot.name = 'cast_ingot';
  ingot.visible = false;
  ingot.castShadow = true;
  group.add(ingot);

  // ---------- 型砂 / 火星共用粒子（110 个，Q3.5 C 段改在落点生成火星） ----------
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

  // ---------- 铁水流（Q3.5：单位高圆柱沿 y 缩放，高度/半径都走 scale，不重建几何） ----------
  const streamGeo = new THREE.CylinderGeometry(0.045, 0.07, 1, 10, 1, true);
  streamGeo.translate(0, -0.5, 0);        // 原点在顶端：scale.y = 流长，顶挂在浇嘴
  const streamMat = new THREE.MeshBasicMaterial({ color: 0xFF9A4A });
  const stream = new THREE.Mesh(streamGeo, streamMat);
  stream.name = 'iron_stream';
  stream.visible = false;
  stream.frustumCulled = false;
  group.add(stream);

  // ---------- 浇包 + 冲天炉 ----------
  const ladle = buildLadle();
  group.add(ladle.group);
  const cupolaSil = buildCupolaSilhouette();
  group.add(cupolaSil.group);

  // ---------- 灯光（沿用车间定稿配方；Q3.3：fill 移到出铁口正前方，不加灯） ----------
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

  const fill = new THREE.PointLight(0xFFB08A, 1.6, 18, 1.6);
  fill.position.set(1.2, 2.2, -9.6);    // Q3.3：出铁口正前方（原 (9,3.2,6) 0.8）
  group.add(fill);

  // ---------- 动画状态 ----------
  const reduceMotion =
    (typeof matchMedia === 'function') && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 开箱（E 段复用）
  const open = { active: false, idx: -1, onDone: null, center: new THREE.Vector3() };
  // 浇注五段（A–E 同一条时间线）
  const pour = {
    active: false, t: 0, lastT: null, idx: -1, onDone: null,
    box: new THREE.Vector3(),           // 目标箱中心（地面）
    cupTop: new THREE.Vector3(),        // 浇口盆顶（流落点）
    shaking: false, warmed: false,
  };
  // 冷却（独立于 anim：步骤 ⑤ 进入后继续在后台跑完）
  const cooling = { active: false, left: COOL_MS, lastT: null };
  let ingotTier = 'mid';        // 本轮铸件表面档（W3-R5，debugState 可断言）
  const tmpM = new THREE.Matrix4();

  function layoutCenter(idx) {
    // 与 props/sandboxes.js 同一布局（3 列 × 4 排，间距 2.4，中心 8.5/3）
    const COLS = 3, GAP = 2.4, CX = 8.5, CZ = 3;
    const r = Math.floor(idx / COLS), c = idx % COLS;
    return { x: CX + (c - (COLS - 1) / 2) * GAP, z: CZ + (r - 1.5) * GAP };
  }

  // 基准矩阵均为纯平移（sandboxes.js 不做旋转），直接在 y 分量上叠加抬升/震动
  function applyOpenPose(idx, lift, dy = 0) {
    tmpM.copy(baseUpper[idx]);
    tmpM.elements[13] += lift + dy;
    pickMeshes[1].setMatrixAt(idx, tmpM);

    tmpM.copy(baseCup[idx]);
    tmpM.elements[13] += lift + dy;
    pickMeshes[2].setMatrixAt(idx, tmpM);

    tmpM.copy(baseLower[idx]);
    tmpM.elements[13] += dy;            // 下箱只震不抬
    pickMeshes[0].setMatrixAt(idx, tmpM);

    for (const m of pickMeshes) m.instanceMatrix.needsUpdate = true;
  }

  function updateParticles(p) {
    if (p <= 0.08) { points.visible = false; return; }
    points.visible = true;
    const { x, z } = open.center;
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

  /** C 段落点火星（同一套 110 粒子管线，生成点改到浇口盆，颜色换暖） */
  function updateSparks(p) {
    if (p <= 0) { points.visible = false; return; }
    pMat.color.setHex(C.ember);
    pMat.size = 0.06;
    points.visible = true;
    const { x, y, z } = pour.cupTop;
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < PARTICLES; i++) {
      const a = hash(i) * Math.PI * 2;
      const rr = 0.06 + hash(i + 50) * 0.16;
      const rise = p * (0.18 + hash(i + 30) * 0.5);
      const out = p * (0.25 + hash(i + 90) * 0.45);
      pos[i * 3] = x + Math.cos(a) * (rr + out);
      pos[i * 3 + 1] = y + rise - p * p * (0.1 + hash(i + 11) * 0.25);
      pos[i * 3 + 2] = z + Math.sin(a) * (rr + out);
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = Math.max(0, 1 - p * 0.6);
  }

  function resetParticles() {
    pMat.color.setHex(0x6B5F52);   // 型砂色（E 段复用前必须还原）
    pMat.size = 0.09;
    points.visible = false;
    pMat.opacity = 0;
  }

  /** 浇嘴尖端的世界坐标（随倾转实时变化） */
  const _tip = new THREE.Vector3();
  function spoutTipWorld() {
    ladle.group.updateMatrixWorld(true);   // 同帧先求解矩阵，避免流挂一帧
    _tip.set(0, TIP_LOCAL.y, TIP_LOCAL.z); // pot 局部（与 hoverXZ 同一单点真值）
    return ladle.pot.localToWorld(_tip);
  }

  function setStream(radiusScale) {
    const top = spoutTipWorld();
    const bot = pour.cupTop;
    stream.position.set((top.x + bot.x) / 2, (top.y + bot.y) / 2, (top.z + bot.z) / 2);
    const len = Math.max(0.01, top.distanceTo(bot));
    stream.scale.set(radiusScale, len, radiusScale);
    stream.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, -1, 0), bot.clone().sub(top).normalize());
    stream.visible = true;
  }

  function setLadlePose(x, y, z, tilt = null) {
    ladle.group.position.set(x, y, z);
    if (tilt !== null) {
      ladle.pot.rotation.x = tilt;
      ladle.gantry.rotation.x = -tilt;  // 行车保持水平
      // R1 第 7 条（体验修订）：melt 是 pot 的子对象 → 与 pot 刚性同转，就是用户要的
      // 「液面跟桶一起倾」。这里只做一件事：清掉 R/A 段待机微摆留下的**相对**转角，
      // 保证 B 段起相对转角恒为 0。不再反向抵消倾转、也不再随倾角收缩。
      ladle.melt.rotation.x = 0;
    }
  }

  // 浇嘴尖在水平面内离开浇包轴线的距离（随倾角内收：1.45 → 0.60 m @52°）。
  // 推导：pot 局部 (y,z) 绕 x 转 θ → z' = y·sinθ + z·cosθ（y 为负，故随 θ 内收）
  const S_YAW = Math.sin(REST_YAW), C_YAW = Math.cos(REST_YAW);
  function tipOffsetHoriz(tilt) {
    return TIP_LOCAL.y * Math.sin(tilt) + TIP_LOCAL.z * Math.cos(tilt);
  }
  /** 悬停位：让浇嘴尖正好落在浇口盆 (boxX, boxZ) 正上方（包体向浇嘴反方向偏置）。
   *  铁水流铅垂的前提 —— 包体悬在箱心正上方时，流会从偏出 1.45 m 的浇嘴斜着切下去。 */
  function hoverXZ(boxX, boxZ, tilt) {
    const off = tipOffsetHoriz(tilt);
    return { x: boxX - off * S_YAW, z: boxZ - off * C_YAW };
  }

  function resetLadle() {
    setLadlePose(GROUND.x, GROUND.y, GROUND.z, 0);   // 复位到「包底贴地」（W3-R3）
    stream.visible = false;
  }

  function finishCooling() {
    cooling.active = false;
    cooling.lastT = null;
    ingotMat.emissiveIntensity = 0;
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

    /** 开始浇注：R 起吊 + A–E 五段（surface 决定铸件表面档；onDone 在 E 段末触发）
     *  @param surface {{tier?:'fine'|'mid'|'rough', total?:number}} 由总分推出的表面档 */
    openBox(idx, surface, onDone) {
      pour.active = true;
      pour.idx = idx;
      pour.t = reduceMotion ? SEG.E : 0;   // P7：reduced-motion 跳过 A–D，直接 E 段
      pour.lastT = null;
      pour.onDone = onDone || null;
      pour.shaking = false;
      pour.warmed = false;
      const { x, z } = layoutCenter(idx);
      pour.box.set(x, 0, z);
      pour.cupTop.set(x, 1.06, z);          // 浇口盆顶（BOX_H 0.9 + 0.11 + 盆高半 0.05）
      open.active = true;
      open.idx = idx;
      open.center.set(x, 0, z);

      // 复位箱体与颜色，目标箱在 C 段会被叠暖色
      for (let i = 0; i < COUNT; i++) {
        pickMeshes[1].setMatrixAt(i, baseUpper[i]);
        pickMeshes[2].setMatrixAt(i, baseCup[i]);
        pickMeshes[0].setMatrixAt(i, baseLower[i]);
      }
      for (const m of pickMeshes) m.instanceMatrix.needsUpdate = true;
      paint(null, consumedSet);

      // 表面档（W3-R5）：换贴图 + 联动材质参数；贴图仍只占 1 个槽位（先 dispose 旧的）
      const tier = tierOf(surface?.tier);
      ingotTier = tier;
      ingotMat.map?.dispose();
      ingotMat.map = makeIngotTexture(tier);
      ingotMat.color.setHex(INGOT_TIER[tier].color);
      ingotMat.roughness = INGOT_TIER[tier].roughness;
      ingotMat.metalness = INGOT_TIER[tier].metalness;
      ingotMat.needsUpdate = true;
      ingotMat.emissiveIntensity = 0;
      ingot.position.set(x, 0.42, z);       // 坐在下箱顶面（世界 y 0.42）
      ingot.scale.setScalar(0.01);
      ingot.visible = false;
      finishCooling();
      resetLadle();
      resetParticles();
    },

    /** 「跳过」：一次落到 E 段末尾（含冷却终态） */
    finishOpen() {
      if (!pour.active) return;
      pour.t = SEG.E;
    },

    /** 「另取一箱 / 调整参数重试」前复位箱体与浇包 */
    resetBoxes() {
      pour.active = false;
      pour.t = 0;
      pour.lastT = null;
      pour.idx = -1;
      pour.shaking = false;
      open.active = false;
      open.idx = -1;
      ingot.visible = false;
      finishCooling();
      resetParticles();
      stream.visible = false;
      resetLadle();
      for (let i = 0; i < COUNT; i++) {
        pickMeshes[0].setMatrixAt(i, baseLower[i]);
        pickMeshes[1].setMatrixAt(i, baseUpper[i]);
        pickMeshes[2].setMatrixAt(i, baseCup[i]);
      }
      for (const m of pickMeshes) m.instanceMatrix.needsUpdate = true;
      paint(null, consumedSet);
    },

    /** 五段时间线（A–E 同一条 update，dt 帧差 ≤50ms 由调用方保证） */
    runTimeline(t) {
      if (t < SEG.R) {
        // ---- R 起吊（W3-R3）：包底贴地 → 悬吊休息位，纯垂直平滑上升；熔面轻晃 ----
        const raw = clamp01(t / SEG.R);
        setLadlePose(GROUND.x, lerp(GROUND.y, REST.y, easeInOutCubic(raw)), GROUND.z);
        ladle.melt.rotation.x = 2.5 * Math.PI / 180 * Math.sin(t * 0.02);
      } else if (t < SEG.A) {
        // ---- A 就位：休息位 → 浇嘴尖对准浇口盆正上方，抬升弧（峰值=休息位+0.45），熔面 ±3° 晃动 ----
        const raw = clamp01((t - SEG.R) / (SEG.A - SEG.R));
        const p = easeInOutCubic(raw);
        const h0 = hoverXZ(pour.box.x, pour.box.z, 0);
        setLadlePose(
          lerp(REST.x, h0.x, p),
          lerp(REST.y, HOVER_Y, raw) + ARC_A * Math.sin(Math.PI * raw),
          lerp(REST.z, h0.z, p),
        );
        ladle.melt.rotation.x = 3 * Math.PI / 180 * Math.sin(t * 0.02);
      } else if (t < SEG.B) {
        // ---- B 倾包：0 → 52°；铁水流出现（截面 0.04 → 0.075）；包体随倾角滑向浇口盆 ----
        const raw = clamp01((t - SEG.A) / (SEG.B - SEG.A));
        const tilt = TILT * easeInOutCubic(raw);
        const h = hoverXZ(pour.box.x, pour.box.z, tilt);
        setLadlePose(h.x, HOVER_Y, h.z, tilt);
        if (raw > 0.15) setStream(0.55 + 0.55 * raw);   // 0.04/0.07 → 0.075 量级
        updateSparks(0);
      } else if (t < SEG.C) {
        // ---- C 充型：流稳定 + 落点火星 + 目标箱暖色 + 箱体 ±0.008m @12Hz 震动 ----
        const raw = clamp01((t - SEG.B) / (SEG.C - SEG.B));
        const h = hoverXZ(pour.box.x, pour.box.z, TILT);
        setLadlePose(h.x, HOVER_Y, h.z, TILT);
        setStream(1.07);
        updateSparks(raw);
        if (!pour.warmed) {
          pour.warmed = true;
          paintOne(pour.idx, warmPour);
        }
        pour.shaking = true;
        applyOpenPose(pour.idx, 0, 0.008 * Math.sin((t / 1000) * Math.PI * 2 * 12));   // ±0.008m @12Hz
      } else if (t < SEG.D) {
        // ---- D 收流离开：倾角回 0；流变细到 0.02 后消失；浇包抬升退回休息位 ----
        const raw = clamp01((t - SEG.C) / (SEG.D - SEG.C));
        const tilt = TILT * (1 - easeInOutCubic(raw));
        if (pour.shaking) {       // 震动停止、暖色还原为消耗态
          pour.shaking = false;
          applyOpenPose(pour.idx, 0, 0);
          paintOne(pour.idx, consumedSet.has(pour.idx) ? dim : white);
        }
        if (raw < 0.35) {
          const h = hoverXZ(pour.box.x, pour.box.z, tilt);
          setLadlePose(h.x, HOVER_Y, h.z, tilt);
          setStream(1.07 * (1 - raw / 0.35) + 0.20);    // 收细
        } else {
          stream.visible = false;
        }
        updateSparks(Math.max(0, 1 - raw * 1.4));
        // 2200–2450 抬到弧峰并保持浇嘴对位；2450–2700 水平退回休息位
        if (raw < 0.5) {
          const h = hoverXZ(pour.box.x, pour.box.z, tilt);
          const p2 = easeInOutCubic(raw / 0.5);
          setLadlePose(h.x, lerp(HOVER_Y, ARC_Y, p2), h.z, tilt);
        } else {
          const hMid = hoverXZ(pour.box.x, pour.box.z, TILT * 0.5);   // raw=0.5 处的连续衔接点
          const p2 = easeInOutCubic((raw - 0.5) / 0.5);
          setLadlePose(
            lerp(hMid.x, REST.x, p2),
            lerp(ARC_Y, REST.y, p2),
            lerp(hMid.z, REST.z, p2),
            tilt,
          );
        }
      } else {
        // ---- E 开箱（复用现有开箱，压进 700 ms）：抬升 + 型砂 + 铸件出现 + 冷却开始 ----
        stream.visible = false;
        updateSparks(0);
        resetParticles();
        const p = clamp01((t - SEG.D) / (SEG.E - SEG.D));
        const lift = easeOutCubic(clamp01(p / 0.75)) * LIFT_H;
        applyOpenPose(pour.idx, lift, 0);
        updateParticles(p);
        // 并行落包（W3-R3）：E 段前 60% 由休息位平滑落到地面，后 40% 静止 ——
        // 与段末 resetLadle() 连续，不再有跳变
        setLadlePose(REST.x, lerp(REST.y, GROUND.y, easeInOutCubic(clamp01(p / 0.6))), REST.z);
        if (p > 0.35) {
          ingot.visible = true;
          const s = easeOutCubic(clamp01((p - 0.35) / 0.3));
          ingot.scale.setScalar(0.2 + s * 0.8);
          if (!cooling.active && !reduceMotion) {
            cooling.active = true;
            cooling.left = COOL_MS;
            cooling.lastT = null;
          }
        }
        if (t >= SEG.E || p >= 1) {
          // 终态（含 reduceMotion 直落）
          pour.active = false;
          pour.lastT = null;
          pour.shaking = false;
          applyOpenPose(pour.idx, LIFT_H, 0);
          updateParticles(1);
          ingot.visible = true;
          ingot.scale.setScalar(1);
          if (reduceMotion) finishCooling();   // P7：直落冷却终态
          resetLadle();
          pour.onDone?.();
        }
      }
    },

    update(t) {
      // 炉火呼吸（与车间同配方；熔面用 color 标量乘顶点色 —— Basic 材质无 emissive）
      const phase = t * 0.0016;
      ladle.light.intensity = 2.2 * (0.88 + Math.sin(phase) * 0.1 + Math.sin(phase * 4.3) * 0.04);
      ladle.meltMat.color.setScalar(0.92 + Math.sin(phase * 1.3) * 0.08);
      cupolaSil.ring.material.color.setHSL(0.045, 0.86, 0.5 + Math.sin(phase) * 0.05);

      // 浇注五段推进（帧差上限 50ms → 隐藏标签页时动画暂停，回来续播）
      if (pour.active) {
        const dt = Math.min(t - (pour.lastT ?? t), 50);
        pour.lastT = t;
        pour.t = Math.min(SEG.E, pour.t + dt);
        api.runTimeline(pour.t);   // api 在调用时已赋值；不用 this（视口可能解构调用）
      }

      // 冷却独立推进（步骤 ⑤ 进入后继续在后台跑完，Q3.6）
      if (cooling.active) {
        const dt = Math.min(t - (cooling.lastT ?? t), 50);
        cooling.lastT = t;
        cooling.left = Math.max(0, cooling.left - dt);
        const k = easeOutCubic(clamp01(cooling.left / COOL_MS));
        ingotMat.emissiveIntensity = COOL_FROM * k;
        if (cooling.left <= 0) finishCooling();
      }
    },

    /** ?debug=1 取证用：五段状态快照（真实状态机读数，非旁路） */
    debugState() {
      return {
        pour: { active: pour.active, t: Math.round(pour.t), idx: pour.idx },
        cooling: { active: cooling.active, left: Math.round(cooling.left) },
        ladle: {
          x: +ladle.group.position.x.toFixed(2), y: +ladle.group.position.y.toFixed(2),
          z: +ladle.group.position.z.toFixed(2),
          tiltDeg: +(ladle.pot.rotation.x * 180 / Math.PI).toFixed(1),
        },
        ingot: { visible: ingot.visible, emissive: +ingotMat.emissiveIntensity.toFixed(3), tier: ingotTier },
        reduceMotion,
      };
    },

    dispose() {
      sandboxes.dispose();
      ladle.dispose();
      cupolaSil.dispose();
      ingot.geometry.dispose();
      ingotMat.map?.dispose();
      ingotMat.dispose();
      streamGeo.dispose();
      streamMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      floor.geometry.dispose();
      floor.material.roughnessMap?.dispose();
      floor.material.dispose();
      castSeams.geometry.dispose();
      castSeams.material.dispose();
      guide.geometry.dispose();
      lineMat.dispose();
    },
  };
  group.userData.api = api;   // cast.js 经 vp.scene.getObjectByName('cast_scene').userData.api 取用
  return api;
}
