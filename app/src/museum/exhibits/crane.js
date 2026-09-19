/* ============================================================
   props/crane.js — 十吨天吊（桥式起重机）
   依据：spec/SCENE-ASSETS-STEP2.md §2.2
        spec/SCENE-LAYOUT-FIX-SPEC.md §5-7（轨道梁）+ §9.3 段数 + §9.4 E 组细节
   叙事地位：车间空间的"顶部叙事"，给纵深以尺度感
   性能：2 个 mesh（静态桥架 crane_bridge + 随小车动的 crane_hook）
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from '../scenes/merge.js';

const STEEL = 0x525D69;      // §2.2 材质 #525D69，metalness .6
const DECK_Y = 24;           // 主梁标高 y = 24（不得改）
const BRIDGE_Z = -8;         // 与冲天炉同一条轴线
const PERIOD = 40;           // 横移周期 40 秒
const TRAVEL = 8;            // ±8 m

const RUNWAY_TOP = 23.6;     // §5-7 轨道梁顶面
const WHEEL_R = 0.28;        // E1 端梁车轮半径
const WHEEL_Y = RUNWAY_TOP + WHEEL_R;   // 车轮中心：底缘正好落在轨道梁顶
const ENDBEAM_Y = WHEEL_Y + WHEEL_R + 0.5;  // 端梁（高 1.0）坐在车轮上 → 底 24.16

/**
 * @returns {{ group: THREE.Group, update(t:number):void, dispose():void }}
 */
export function buildCrane() {
  const group = new THREE.Group();
  group.name = 'crane';
  group.userData.runwayTopY = RUNWAY_TOP;
  group.userData.wheelY = WHEEL_Y;

  const steelMat = new THREE.MeshStandardMaterial({
    color: STEEL, roughness: 0.45, metalness: 0.6,
  });

  // ---------- 静态部分：主梁 + 2 段端梁 + 轨道梁 ----------
  const staticGeos = [];

  // 主梁：横跨车间
  const girder = new THREE.BoxGeometry(38, 1.2, 1.6);
  girder.translate(0, DECK_Y, BRIDGE_Z);
  staticGeos.push(girder);

  // 主梁下弦加劲肋（原有 9 道，不删）
  for (let i = -4; i <= 4; i++) {
    const rib = new THREE.BoxGeometry(0.18, 0.5, 1.7);
    rib.translate(i * 4, DECK_Y - 0.8, BRIDGE_Z);
    staticGeos.push(rib);
  }

  // §5-7 轨道梁 ×2：贴墙（x 18.2–19.8，墙内表面 19.85），梁顶 23.6 接住端梁车轮
  for (const x of [-19.0, 19.0]) {
    const runway = new THREE.BoxGeometry(1.6, 1.1, 52);
    runway.translate(x, 23.05, 0);
    staticGeos.push(runway);
  }

  // 端梁 ×2：坐在 E1 车轮上（底 24.16）
  for (const x of [-18.4, 18.4]) {
    const end = new THREE.BoxGeometry(1.4, 1.0, 3.2);
    end.translate(x, ENDBEAM_Y, BRIDGE_Z);
    staticGeos.push(end);
  }

  // ---- E1 端梁车轮 ×8（每端 4 个；轴线沿 x，底缘落在轨道梁顶 23.6）----
  for (const x of [-18.4, 18.4]) {
    for (const dz of [-0.95, 0.95]) {
      for (const dx of [-0.55, 0.55]) {
        const w = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.18, 36);   // Ø0.56 ≥0.5m
        w.rotateZ(Math.PI / 2);                 // 轴线 → x
        w.translate(x + dx, WHEEL_Y, BRIDGE_Z + dz);
        staticGeos.push(w);
      }
    }
  }

  // ---- E2 缓冲器 ×4（端梁两端外侧）----
  for (const x of [-18.4, 18.4]) {
    for (const dz of [-1.8, 1.8]) {
      const buf = new THREE.CylinderGeometry(0.16, 0.20, 0.36, 12);
      buf.rotateZ(Math.PI / 2);                 // 轴线 → x
      buf.translate(x, ENDBEAM_Y, BRIDGE_Z + dz);
      staticGeos.push(buf);
    }
  }

  // ---- E3 主梁走台 + 栏杆（走台贴主梁 +z 侧）----
  const walkY = 23.5;
  const walkZ = BRIDGE_Z + 1.05;
  const deck = new THREE.BoxGeometry(36, 0.06, 0.5);
  deck.translate(0, walkY, walkZ);
  staticGeos.push(deck);
  for (let i = 0; i < 9; i++) {
    const post = new THREE.BoxGeometry(0.05, 0.9, 0.05);
    post.translate(-16 + i * 4, walkY + 0.48, walkZ);
    staticGeos.push(post);
  }
  for (const hy of [walkY + 0.93, walkY + 0.48]) {
    const hand = new THREE.BoxGeometry(36, 0.05, 0.05);
    hand.translate(0, hy, walkZ);
    staticGeos.push(hand);
  }

  const bridgeMesh = new THREE.Mesh(mergeGeometries(staticGeos), steelMat);
  bridgeMesh.name = 'crane_bridge';
  bridgeMesh.castShadow = true;
  group.add(bridgeMesh);

  // ---------- 运动部分：小车 + 吊钩 ----------
  const trolley = new THREE.Group();
  trolley.name = 'crane_trolley';

  const trolleyBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.4, 2.2),
    new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.5, metalness: 0.55 })
  );
  trolleyBody.position.y = DECK_Y + 1.3;
  trolleyBody.castShadow = true;
  trolley.add(trolleyBody);

  // 钢丝绳 + 吊钩 + E5 滑轮组（随小车动）
  const hookGeos = [];
  const rope = new THREE.CylinderGeometry(0.1, 0.1, 6, 12);   // §9.3：8 → 12 段
  rope.translate(0, DECK_Y - 2.4, 0);
  hookGeos.push(rope);

  const hookBlock = new THREE.BoxGeometry(0.5, 0.4, 0.5);
  hookBlock.translate(0, DECK_Y - 5.5, 0);
  hookGeos.push(hookBlock);

  const hook = new THREE.TorusGeometry(0.26, 0.07, 8, 36, Math.PI * 1.5);  // Ø0.66 ≥0.5m（§9.3 给 24，按 §9.2 取 36）
  hook.rotateZ(Math.PI / 2);   // 缺口朝上，读起来是个钩子
  hook.translate(0, DECK_Y - 6.0, 0);
  hookGeos.push(hook);

  // E5 吊钩滑轮组 ×2（钩体两侧）
  for (const dx of [-0.32, 0.32]) {
    const sheave = new THREE.CylinderGeometry(0.20, 0.20, 0.12, 20);
    sheave.rotateZ(Math.PI / 2);              // 轴线 → x
    sheave.translate(dx, DECK_Y - 5.5, 0);
    hookGeos.push(sheave);
  }

  // E4 小车卷筒 + 电机 + 减速箱（随小车动；全部并入 crane_hook，不新开 mesh）
  const drum = new THREE.CylinderGeometry(0.42, 0.42, 1.2, 36);   // Ø0.84 ≥0.5m
  drum.rotateZ(Math.PI / 2);                  // 轴线 → x
  drum.translate(0, DECK_Y + 0.5, 0);
  hookGeos.push(drum);

  const motor = new THREE.BoxGeometry(0.9, 0.7, 0.8);
  motor.translate(-1.6, DECK_Y + 1.4, 0);
  hookGeos.push(motor);
  const gearbox = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  gearbox.translate(1.55, DECK_Y + 1.4, 0);
  hookGeos.push(gearbox);

  const hookMesh = new THREE.Mesh(mergeGeometries(hookGeos), steelMat);
  hookMesh.name = 'crane_hook';
  hookMesh.castShadow = true;
  trolley.add(hookMesh);

  trolley.position.z = BRIDGE_Z;
  group.add(trolley);

  // ---------- 动画：40 秒周期极缓慢横移 ----------
  function update(t) {
    const phase = (t / 1000 / PERIOD) * Math.PI * 2;
    trolley.position.x = Math.sin(phase) * TRAVEL;
  }

  return {
    group,
    update,
    dispose() {
      bridgeMesh.geometry.dispose();
      hookMesh.geometry.dispose();
      trolleyBody.geometry.dispose();
      steelMat.dispose();
      trolleyBody.material.dispose();
    },
  };
}
