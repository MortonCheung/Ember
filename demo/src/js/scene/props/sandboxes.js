/* ============================================================
   props/sandboxes.js — 成排砂箱（造型工位）
   依据：spec/SCENE-ASSETS-STEP2.md §2.3
        spec/SCENE-LAYOUT-FIX-SPEC.md §4（整组平移 −2/−2）、§9.3 段数、§9.4 C 组细节
   叙事地位：Step 3「亲手浇铸」的操作对象
   性能：InstancedMesh，12 个砂箱 = 3 次 draw call（下箱/上箱/浇口杯）
   ⚠️ 落位说明：§4.1 给出"改 CENTER"与"给 group 设 position"两种等效写法，二者择一。
      本实现采用后者（在 workshop.js 里 group.position.set(-2,0,-2)），
      因为本模块同时被 cast 小场景复用（cast-scene.js），改 CENTER 会连带平移 cast 场景，
      违反 §7.4"不动 cast 页"。故此处 CENTER 保持 {8.5,3}，平移在展厅侧完成。
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from '../merge.js';

const SAND = 0x3A3532;   // §2.3 深褐灰
const SPRUE = 0x2E2A27;  // 浇口杯略深一档

// 阵列布局：3 列（x）× 4 排（z），间距 2.4m
const COLS = 3;
const ROWS = 4;
const GAP = 2.4;
const CENTER = { x: 8.5, z: 3 };   // 展厅侧再整体平移 (−2,0,−2) → 等效中心 (6.5,1)

const BOX_W = 1.8;    // x
const BOX_H = 0.9;    // 总高（上箱 + 分型缝 + 下箱）
const BOX_D = 1.4;    // z
const PARTING = 0.06; // 分型面缝隙
const LAYER_H = (BOX_H - PARTING) / 2;

/** C1：上箱 = 箱体 + 箱耳 ×2 + 吊轴 ×2（合并为单几何，仍是 1 个 InstancedMesh） */
function makeUpperGeometry() {
  const geos = [];
  // C4：分型缝由"纯间隙"改为"上箱底面下沉 0.02 的搭接"——几何整体下沉 0.01，顶面不动
  const shell = new THREE.BoxGeometry(BOX_W, LAYER_H, BOX_D);
  shell.translate(0, -0.01, 0);
  geos.push(shell);
  for (const dx of [-0.80, 0.80]) {
    // 箱耳：落在箱体顶面上方（不越出 BOX_W/2、BOX_D/2，否则会撑大阵列包围盒、破坏 §4.1 的落位复算）
    const ear = new THREE.BoxGeometry(0.10, 0.16, 0.12);
    ear.translate(dx, 0.16, 0);
    geos.push(ear);
    // 吊轴：横置圆轴，供天吊挂钩取箱
    const pin = new THREE.CylinderGeometry(0.04, 0.04, 0.30, 10);
    pin.rotateX(Math.PI / 2);             // 吊轴轴线 → z
    pin.translate(dx, 0.24, 0);
    geos.push(pin);
  }
  return mergeGeometries(geos);
}

/** C2：下箱 = 箱体 + 定位销 ×2（分型面对角） */
function makeLowerGeometry() {
  const geos = [];
  geos.push(new THREE.BoxGeometry(BOX_W, LAYER_H, BOX_D));
  for (const [dx, dz] of [[0.65, 0.48], [-0.65, -0.48]]) {
    const pin = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 10);
    pin.translate(dx, 0.28, dz);
    geos.push(pin);
  }
  return mergeGeometries(geos);
}

/** C3：浇口杯 = 喇叭口（锥）+ 直浇口（柱），两段 */
function makeCupGeometry() {
  const geos = [];
  geos.push(new THREE.ConeGeometry(0.18, 0.22, 20));   // §9.3：8 段 → 20 段
  const gate = new THREE.CylinderGeometry(0.07, 0.07, 0.10, 12);
  gate.translate(0, -0.16, 0);                          // 直浇口伸进上箱
  geos.push(gate);
  return mergeGeometries(geos);
}

/**
 * @returns {{ group: THREE.Group, dispose():void }}
 * 拾取约定：射线命中 InstancedMesh 后用 instanceId 查
 * mesh.userData.sandboxNames[instanceId] -> "sandbox_N"
 */
export function buildSandboxes() {
  const group = new THREE.Group();
  group.name = 'sandboxes';

  const sandMat = new THREE.MeshStandardMaterial({ color: SAND, roughness: 0.95, metalness: 0 });
  const sprueMat = new THREE.MeshStandardMaterial({ color: SPRUE, roughness: 0.9, metalness: 0.05 });

  const count = COLS * ROWS;
  const names = [];
  const dummy = new THREE.Object3D();

  const lower = new THREE.InstancedMesh(makeLowerGeometry(), sandMat, count);
  const upper = new THREE.InstancedMesh(makeUpperGeometry(), sandMat, count);
  const cup = new THREE.InstancedMesh(makeCupGeometry(), sprueMat, count);

  lower.name = 'sandboxes_lower';
  upper.name = 'sandboxes_upper';
  cup.name = 'sandboxes_cups';

  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = CENTER.x + (c - (COLS - 1) / 2) * GAP;
      const z = CENTER.z + (r - (ROWS - 1) / 2) * GAP;

      dummy.position.set(x, LAYER_H / 2, z);                 // 下箱
      dummy.updateMatrix();
      lower.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, LAYER_H / 2 + LAYER_H + PARTING, z); // 上箱，留分型缝
      dummy.updateMatrix();
      upper.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, BOX_H + 0.11, z);                // 浇口杯
      dummy.updateMatrix();
      cup.setMatrixAt(i, dummy.matrix);

      names.push(`sandbox_${i}`);
      i++;
    }
  }

  for (const m of [lower, upper, cup]) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.instanceMatrix.needsUpdate = true;
    group.add(m);
  }
  lower.userData.sandboxNames = names;
  upper.userData.sandboxNames = names;
  cup.userData.sandboxNames = names;

  return {
    group,
    dispose() {
      lower.geometry.dispose();
      upper.geometry.dispose();
      cup.geometry.dispose();
      sandMat.dispose();
      sprueMat.dispose();
    },
  };
}
