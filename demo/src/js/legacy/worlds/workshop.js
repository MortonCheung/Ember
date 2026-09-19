/* ============================================================
   workshop.js — 车间场景搭建（Step 2 / 2C）
   尺度：40m(宽) × 30m(高) × 60m(深)
   依据：spec/SCENE-ASSETS-STEP2.md §6 顺序 + spec/SCENE-LAYOUT-FIX-SPEC.md
        §2.2（炉灯抬升）、§4.3（导向线外移）、§5-3（铁水包挂载）、§9.3/§9.4 F 组
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from './merge.js';
import { buildCrane } from '../props/crane.js';
import { buildSandboxes } from '../props/sandboxes.js';
import { buildCupola } from '../props/cupola.js';
import { buildLathe } from '../props/lathe.js';
import { buildLadle } from '../props/ladle.js';
import { buildToolCart } from '../props/toolcart.js';
import { buildEnvironment, buildWindowFrameGeos } from './environment.js';

const C = {
  floor:   0x23282F,   // W1 §2.3：地坪基色（原 0x2A2F36）
  wall:    0x23282F,
  truss:   0x3A4149,
  column:  0x525D69,
  ember:   0xE8663C,
};

export const HALL = { W: 40, D: 60, H: 30 };

/**
 * 构建车间场景
 * @returns {{ group: THREE.Group, cupolaLights: THREE.PointLight[], update(t:number):void, dispose():void }}
 */
export function buildWorkshop() {
  const group = new THREE.Group();
  group.name = 'workshop';

  const W = HALL.W;
  const D = HALL.D;
  const H = HALL.H;

  // ---------- 地面 ----------
  // W1 §2.3：roughness 设 1.0 —— 真实粗糙度由 roughnessMap 给（§2.5，基底 107≈0.42）；
  // 金属度 0.22 让炉火/铁水在地面上留一道可辨的反射（§2.2 铁律：均匀面 + 规则板缝）。
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: C.floor, roughness: 1.0, metalness: 0.22 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // ---------- 地面导向线（§4.3：±8.8 → ±11.5，改读作"天吊运行区边界线"）----------
  const lineMat = new THREE.MeshBasicMaterial({
    color: C.ember, transparent: true, opacity: 0.18,
  });
  for (const x of [-11.5, 11.5]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, D * 0.8), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.01, 0);
    group.add(line);
  }

  // ---------- 墙体（后 / 左 / 右）----------
  const wallMat = new THREE.MeshStandardMaterial({ color: C.wall, roughness: 0.92, metalness: 0.02 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.3), wallMat);
  backWall.position.set(0, H / 2, -D / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  for (const dir of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.3, H, D), wallMat);
    side.position.set(dir * W / 2, H / 2, 0);
    side.receiveShadow = true;
    group.add(side);
  }

  // ---------- 屋架（F1：补成真桁架 = 上下弦 + W 形腹杆 + 节点板；G1 窗框并入）----------
  const trussMat = new THREE.MeshStandardMaterial({ color: C.truss, roughness: 0.75, metalness: 0.35 });
  const trussGeos = [];
  const CHORD_LOW = H - 1.2;        // 28.8 —— 灯杆落点（§5-1 的 28.66 = 本梁底面）
  const CHORD_HIGH = H - 4.1;       // 25.9 —— 桁架另一弦，两弦间距 2.9m
  const CHORD_ZS = [];
  for (let i = 0; i < 7; i++) CHORD_ZS.push(-D / 2 + 4 + i * (D - 8) / 6);

  for (const z of CHORD_ZS) {
    const low = new THREE.BoxGeometry(W, 0.28, 0.28);
    low.translate(0, CHORD_LOW, z);
    trussGeos.push(low);
    const high = new THREE.BoxGeometry(W, 0.24, 0.24);
    high.translate(0, CHORD_HIGH, z);
    trussGeos.push(high);
    // F1③ 节点板 ×7（下弦底面）
    const gusset = new THREE.BoxGeometry(0.5, 0.5, 0.4);
    gusset.translate(0, CHORD_LOW - 0.14 - 0.25, z);
    trussGeos.push(gusset);
  }

  // F1② 腹杆：由"6 根未旋转的竖直杆"改为 1 竖 + 2 斜 的 W 形
  const bay = (D - 8) / 6;
  const webMidY = (CHORD_LOW + CHORD_HIGH) / 2;
  const webH = CHORD_LOW - CHORD_HIGH;
  const diagLen = Math.hypot(bay, webH);
  const diagAng = Math.atan2(webH, bay);
  for (let i = 0; i < 6; i++) {
    const zc = -D / 2 + 4 + bay / 2 + i * bay;
    const vert = new THREE.BoxGeometry(0.22, webH, 0.22);
    vert.translate(0, webMidY, zc);
    trussGeos.push(vert);
    for (const s of [1, -1]) {
      const diag = new THREE.BoxGeometry(0.18, diagLen, 0.18);
      diag.rotateX(s * diagAng);
      diag.translate(0, webMidY, zc);
      trussGeos.push(diag);
    }
  }

  // G1 高窗深色窗框 + 竖梃（发光板本身在 high_windows，不可并入）
  for (const g of buildWindowFrameGeos()) trussGeos.push(g);

  const trusses = new THREE.Mesh(mergeGeometries(trussGeos), trussMat);
  trusses.name = 'trusses';
  trusses.castShadow = true;
  group.add(trusses);

  // ---------- 中柱（§9.3：12 段 → 32 段；F2 柱脚 / 柱顶 / 加劲环）----------
  const colMat = new THREE.MeshStandardMaterial({ color: C.column, roughness: 0.6, metalness: 0.5 });
  const colGeos = [];
  for (const [x, z] of [[-13, 6], [13, 6], [-13, -18], [13, -18]]) {
    const g = new THREE.CylinderGeometry(0.55, 0.7, H, 36);   // §9.3 给 32，按 §9.2"直径≥0.5m 须 36–48 段"取 36
    g.translate(x, H / 2, z);
    colGeos.push(g);
    // F2 柱脚底板 + 地脚螺栓 ×4
    const base = new THREE.BoxGeometry(1.7, 0.08, 1.7);
    base.translate(x, 0.04, z);
    colGeos.push(base);
    for (const bx of [-0.65, 0.65]) {
      for (const bz of [-0.65, 0.65]) {
        const bolt = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8);
        bolt.translate(x + bx, 0.13, z + bz);
        colGeos.push(bolt);
      }
    }
    // F2 柱顶连接板
    const cap = new THREE.BoxGeometry(1.4, 0.14, 1.4);
    cap.translate(x, H - 0.1, z);
    colGeos.push(cap);
    // F2 柱身加劲环 ×2（半径按锥度插值）
    for (const cy of [9.5, 19.5]) {
      const r = 0.7 - 0.15 * (cy / H) + 0.05;
      const ring = new THREE.TorusGeometry(r, 0.05, 8, 36);   // 柱身加劲环（同 §9.2 规则）
      ring.rotateX(Math.PI / 2);
      ring.translate(x, cy, z);
      colGeos.push(ring);
    }
  }
  const columns = new THREE.Mesh(mergeGeometries(colGeos), colMat);
  columns.name = 'columns';
  columns.castShadow = true;
  columns.receiveShadow = true;
  group.add(columns);

  // ---------- 冲天炉（§2：整组 ×1.35，含 A 组细节）----------
  const cupola = buildCupola();
  group.add(cupola.group);
  const ring = cupola.ring;
  cupola.group.userData.hotspot = { id: 'cupola', title: '十吨冲天炉', kind: 'exhibit' };

  // ---------- 铁水包（§5-3：接住流槽末端；不随炉体缩放）----------
  const ladle = buildLadle({ x: cupola.troughEnd.x, z: cupola.troughEnd.z });
  group.add(ladle.group);

  // ---------- 天吊（§2.2 + §5-7 轨道梁 + E 组细节）----------
  // 2C-R5.1 + R5-FIX：**去掉天吊的热点药丸**，userData.hotspot 一并撤销、
  //          hall.js 侧同步删除 SPOT_INFO.crane —— 设计方在
  //          `SCENE-LAYOUT-FIX-SPEC.md` §10.8-E 确认接受（天吊是"顶部叙事"，
  //          药丸在默认机位会被钳到屏内、与展品脱节）。
  const crane = buildCrane();
  group.add(crane.group);

  // ---------- 成排砂箱（2C-R3：展厅侧缩到 0.7，等效中心仍为 (6.5,1)）----------
  // 缩放的根因：单只砂箱 1.8×1.4 = 2.52 m² 与车床真实占地 2.53×1.02 = 2.58 m² 几乎 1:1，
  // 12 只连成 6.6×8.6m 的阵列又比车间里任何单件展品都大 —— 抢走体量的是砂箱，"车床像玩具"由此而来。
  // 位置公式：position = 目标世界中心 (6.5,1) − scale × 模块中心 (8.5,3) = (0.55, −1.1)
  // ⚠️ 只在展厅侧缩放：props/sandboxes.js 被 scene/cast-scene.js 复用，改模块常量会连带改 cast 小场景。
  const sandboxes = buildSandboxes();
  sandboxes.group.scale.setScalar(0.7);      // 2C-R3：单箱落地 1.26 × 0.98 × 0.63
  sandboxes.group.position.set(0.55, 0, -1.1);
  group.add(sandboxes.group);
  sandboxes.group.userData.hotspot = { id: 'sandboxes', title: '成型砂箱', kind: 'interactive' };

  // ---------- 环境细节（§3：油渍 / 高窗 / 吊灯 / 粉尘 / 警示线 / 管道）----------
  const env = buildEnvironment(floor);
  group.add(env.group);

  // ---------- C620-1 普通车床（§3：真实尺寸重建 + 2C-R3 等比放大约束）----------
  const lathe = buildLathe();
  group.add(lathe.group);
  // 2C-R5.1 + R5-FIX：车床补热点药丸（全篇唯一有具体型号 + 具体史实的展品，原先反而没有标注）
  //   —— 见 `SCENE-LAYOUT-FIX-SPEC.md` §10.8-E（药丸集合变更的设计方确认）
  lathe.group.userData.hotspot = { id: 'lathe', title: 'C620-1 普通车床', kind: 'exhibit' };

  // ---------- 钳工工具车（2C-R3 §3-⑤：1:1 已知尺寸参照物，挂在展厅侧不随车床缩放）----------
  const toolcart = buildToolCart();
  group.add(toolcart.group);

  // ---------- 灯光（§4 定稿配方；仅 §2.2-1 三盏随炉体抬升）----------
  const hemi = new THREE.HemisphereLight(0x8FA3B8, 0x1A1E24, 0.75);
  group.add(hemi);

  const key = new THREE.DirectionalLight(0xFFE8D6, 1.15);
  key.position.set(16, 26, 14);
  key.castShadow = true;
  // W1 §2.6：修掉地面上的斜向明暗齿纹 —— 平面 shadow acne 的正解是 normalBias，
  // 同时把 bias 收小、mapSize 提到 2048（只增大尺寸，不增加贴图张数）。
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 90;
  key.shadow.camera.left = -34;
  key.shadow.camera.right = 34;
  key.shadow.camera.top = 34;
  key.shadow.camera.bottom = -34;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.035;
  group.add(key);

  // 炉火两侧点光 —— 全场唯一暖色族（§2.2-1：灯是绝对坐标，不随 group 缩放，必须手动抬升）
  const cupolaLights = [];
  for (const dx of [-2.03, 2.03]) {
    const p = new THREE.PointLight(C.ember, 3.0, 40, 1.4);
    p.position.set(-6 + dx, 15.12, -8);
    group.add(p);
    cupolaLights.push(p);
  }

  // 炉底补光（§2.2-1）
  const fill = new THREE.PointLight(0xFFB08A, 1.2, 30, 1.6);
  fill.position.set(-6, 5.4, 0.1);
  group.add(fill);

  // ---------- 微动：炉火呼吸 + 天吊缓慢横移 ----------
  const baseIntensity = cupolaLights.map((l) => l.intensity);
  function update(t) {
    cupolaLights.forEach((l, i) => {
      const phase = t * 0.0016 + i * 1.7;
      // 低频呼吸 + 高频抖动，模拟炉火不稳
      l.intensity = baseIntensity[i] * (0.86 + Math.sin(phase) * 0.1 + Math.sin(phase * 4.3) * 0.04);
    });
    ring.material.color.setHSL(0.045, 0.86, 0.55 + Math.sin(t * 0.0016) * 0.05);
    crane.update(t);
    env.update(t);
  }

  return {
    group,
    cupolaLights,
    /** §4.3 / §2：供 layout() 与验收脚本读取的静态基准 */
    guideX: [-11.5, 11.5],
    troughEnd: cupola.troughEnd,
    update,
    dispose() {
      crane.dispose();
      sandboxes.dispose();
      cupola.dispose();
      ladle.dispose();
      env.dispose();
      lathe.dispose();
      toolcart.dispose();
    },
  };
}
