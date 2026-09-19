/* ============================================================
   props/cupola.js — 十吨冲天炉（全篇主角）
   依据：spec/SCENE-ASSETS-STEP2.md §2.1
        spec/SCENE-LAYOUT-FIX-SPEC.md §2（整组 ×1.35）、§9.3 段数表、§9.4 A 组细节
   真实：炉身高 16.2m（真实 10t/h 冲天炉含炉顶平台整体 15–18m）、总重 300t、1957 投用–2007 熄火
   性能：4 个 mesh（炉身 / 炉口环 / 平台 / 出铁配件 / 护栏 / 爬梯）——细节全部并入既有 mesh
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from '../worlds/merge.js';

const C = {
  body:   0x3A4149,   // 锈蚀钢板 .62 / .55
  truss:  0x3A4149,
  rail:   0x525D69,
  ember:  0xE8663C,
};

/** §2.1 整组等比放大：真实 10t/h 冲天炉含炉顶平台整体 15–18m，
 *  30m 举架下 12m 只占墙高 40%，视觉分量不足，故场景采用 16.2m。基点 y=0（炉底仍在地面）。 */
const S = 1.35;
const POS = { x: -6, z: -8 };

// 流槽几何参数（用来推导"流槽末端"的世界坐标，供铁水包对位）
const TROUGH_TILT = Math.PI / 12;      // 下倾 15°
const TROUGH_LEN = 3.6;
const TROUGH_Y0 = 1.28;                // 流槽中心线起点高度（局部）
const TROUGH_Z0 = 3.9;                 // 流槽中心（局部）

/** 流槽末端世界坐标（×S 之后）。铁水包必须以 (x, z) 对齐此点，口沿 y 与其齐平。 */
export const TROUGH_END = {
  x: POS.x,
  y: (TROUGH_Y0 - (TROUGH_LEN / 2) * Math.sin(TROUGH_TILT)) * S,
  z: POS.z + (TROUGH_Z0 + (TROUGH_LEN / 2) * Math.cos(TROUGH_TILT)) * S,
};

export function buildCupola() {
  const group = new THREE.Group();
  group.position.set(POS.x, 0, POS.z);
  group.name = 'cupola';
  group.scale.setScalar(S);   // §2.1：基点 y=0，不得用 position 偏移替代
  group.userData.scaleFactor = S;
  group.userData.troughEnd = TROUGH_END;

  // ---------- 炉身（§9.3：20 段 → 40 段，世界直径 6.48m）----------
  const bodyMat = new THREE.MeshStandardMaterial({ color: C.body, roughness: 0.62, metalness: 0.55 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 12, 40), bodyMat);
  body.position.y = 6;
  body.name = 'cupola_body';    // layout() 取炉身半径用
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 炉口发光环 —— 整个场景唯一的"暖"（§9.3：8/32 段 → 12/56 段）
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.14, 12, 56),
    new THREE.MeshBasicMaterial({ color: C.ember })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 12;
  ring.name = 'cupola_ring';
  group.add(ring);

  // ---------- 加料口平台 + §2.2-2 落地支撑柱 ×2 ----------
  const platformMat = new THREE.MeshStandardMaterial({ color: C.truss, roughness: 0.7, metalness: 0.4 });
  const platformGeos = [];
  const slab = new THREE.BoxGeometry(6, 0.25, 3.4);
  slab.translate(2.2, 8.4, 0);
  platformGeos.push(slab);
  // §2.2-2：平台挑出炉身 2.8m（×1.35 后 3.78m），下方必须有落地支撑柱
  for (const dz of [-1.3, 1.3]) {
    const post = new THREE.BoxGeometry(0.42, 8.28, 0.42);
    post.translate(4.6, 4.14, dz);
    platformGeos.push(post);
  }
  const platform = new THREE.Mesh(mergeGeometries(platformGeos), platformMat);
  platform.name = 'cupola_platform';
  platform.castShadow = true;
  group.add(platform);

  // ---------- 出铁口 + 流槽 + A 组细节（全部并入 cupola_tap）----------
  const tapGeos = [];

  // 出铁口：炉身正面基座处开孔
  const tapHole = new THREE.BoxGeometry(0.6, 0.6, 0.4);
  tapHole.translate(0, 1.7, 2.25);
  tapGeos.push(tapHole);

  // 流槽：内端接出铁口，外端落地，下倾 15°
  const trough = new THREE.BoxGeometry(0.7, 0.22, TROUGH_LEN);
  trough.rotateX(TROUGH_TILT);
  trough.translate(0, TROUGH_Y0, TROUGH_Z0);
  tapGeos.push(trough);

  // 流槽两侧挡沿
  for (const dx of [-0.42, 0.42]) {
    const lip = new THREE.BoxGeometry(0.08, 0.3, TROUGH_LEN);
    lip.rotateX(TROUGH_TILT);
    lip.translate(dx, TROUGH_Y0 + 0.08, TROUGH_Z0);
    tapGeos.push(lip);
  }

  // ---- A1 风口环：8 个风口嘴（径向朝外）+ 前半环环管 ----
  const TUYERE_R = 2.34;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const mouth = new THREE.CylinderGeometry(0.16, 0.20, 0.42, 10);
    mouth.rotateZ(-Math.PI / 2);      // 轴线 → +X
    mouth.rotateY(-a);                // 转到径向
    mouth.translate(Math.cos(a) * TUYERE_R, 2.2, Math.sin(a) * TUYERE_R);
    tapGeos.push(mouth);
  }
  const manifold = new THREE.TorusGeometry(2.42, 0.09, 8, 36, Math.PI);  // 前半环（+z 侧）
  manifold.rotateX(Math.PI / 2);
  manifold.translate(0, 2.2, 0);
  tapGeos.push(manifold);

  // ---- A2 环形加强箍 ×4：把 16.2m 炉身分段（高度取放大后的世界值 3.6/7.2/10.8/14.4）----
  for (const worldY of [3.6, 7.2, 10.8, 14.4]) {
    const ly = worldY / S;
    const r = 2.4 - 0.4 * Math.min(ly, 12) / 12 + 0.05;   // 贴在锥面上并略凸出
    const hoop = new THREE.TorusGeometry(r, 0.06, 8, 36);
    hoop.rotateX(Math.PI / 2);
    hoop.translate(0, ly, 0);
    tapGeos.push(hoop);
  }

  // ---- A3 出铁口拱券 ----
  const arch = new THREE.BoxGeometry(0.62, 0.5, 0.16);
  arch.translate(0, 1.92, 2.02);
  tapGeos.push(arch);

  // ---- A4 加料口炉盖（侧向人孔盖）+ 吊耳 ×4 ----
  // 规格给 y=15.3/0.98 环布，但 15.3+0.98×1.35 会顶破 V1 的包围盒顶 16.39；
  // 且平台顶面（世界 11.51）之上 2.2m 正是"站在平台上开盖"的位置 —— 取世界 y=13.7。
  const HATCH_Y = 13.7 / S;                  // 局部高度
  const hatchR = 2.4 - 0.4 * (HATCH_Y / 12); // 该高度处炉壳半径
  const hatch = new THREE.CylinderGeometry(0.9, 0.9, 0.28, 36);   // Ø1.8 ≥0.5m → 36 段（§9.2）
  hatch.rotateX(Math.PI / 2);                // 轴线 → +z（正面朝外）
  hatch.translate(0, HATCH_Y, hatchR + 0.08);
  tapGeos.push(hatch);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const lug = new THREE.BoxGeometry(0.12, 0.18, 0.12);
    lug.translate(Math.cos(a) * 0.98, HATCH_Y + Math.sin(a) * 0.98, hatchR + 0.08);
    tapGeos.push(lug);
  }

  const tapMesh = new THREE.Mesh(mergeGeometries(tapGeos), platformMat);
  tapMesh.name = 'cupola_tap';
  tapMesh.castShadow = true;
  group.add(tapMesh);

  // ---------- 炉前平台护栏（§9.3：立柱 6 段 → 12 段；§2.2-3：后缘留 0.9m 梯口）----------
  const railGeos = [];
  const RAIL_H = 1.05;
  const top = 8.525;

  const addRail = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const horiz = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    for (const h of [RAIL_H, RAIL_H * 0.55]) {
      const rail = new THREE.BoxGeometry(horiz ? len : 0.05, 0.05, horiz ? 0.05 : len);
      rail.translate((x0 + x1) / 2, top + h, (z0 + z1) / 2);
      railGeos.push(rail);
    }
    for (const [px, pz] of [[x0, z0], [x1, z1]]) {
      const post = new THREE.CylinderGeometry(0.035, 0.035, RAIL_H, 12);
      post.translate(px, top + RAIL_H / 2, pz);
      railGeos.push(post);
    }
  };

  addRail(-0.8, 1.7, 5.2, 1.7);      // 前缘
  addRail(5.2, -1.7, 5.2, 1.7);      // 右缘
  addRail(-0.8, -1.7, 0.9, -1.7);    // 后缘左段（梯口左侧）
  addRail(2.1, -1.7, 5.2, -1.7);     // 后缘右段（梯口右侧）

  const railMesh = new THREE.Mesh(mergeGeometries(railGeos),
    new THREE.MeshStandardMaterial({ color: C.rail, roughness: 0.5, metalness: 0.6 }));
  railMesh.name = 'cupola_rail';
  railMesh.castShadow = true;
  group.add(railMesh);

  // ---------- 炉后爬梯（§2.2-3：z −2.42→−1.55、档距 0.55→0.28 即 30 档；A5 踏面）----------
  const ladderGeos = [];
  const LAD_Z = -1.55;
  for (const dx of [-0.22, 0.22]) {
    const stile = new THREE.BoxGeometry(0.07, 8.6, 0.07);
    stile.translate(1.5 + dx, 4.3, LAD_Z);
    ladderGeos.push(stile);
  }
  for (let i = 0; i < 30; i++) {
    const y = 0.45 + i * 0.28;
    const rung = new THREE.BoxGeometry(0.44, 0.05, 0.05);
    rung.translate(1.5, y, LAD_Z);
    ladderGeos.push(rung);
    // A5：每档加踏面
    const tread = new THREE.BoxGeometry(0.5, 0.04, 0.02);
    tread.translate(1.5, y, LAD_Z + 0.035);
    ladderGeos.push(tread);
  }
  const ladderMesh = new THREE.Mesh(mergeGeometries(ladderGeos),
    new THREE.MeshStandardMaterial({ color: C.rail, roughness: 0.55, metalness: 0.55 }));
  ladderMesh.name = 'cupola_ladder';
  ladderMesh.castShadow = true;
  group.add(ladderMesh);

  return {
    group,
    ring,
    /** 流槽末端世界坐标（×1.35 后）——铁水包对位基准 */
    troughEnd: TROUGH_END,
    dispose() {
      body.geometry.dispose(); bodyMat.dispose();
      ring.geometry.dispose(); ring.material.dispose();
      platform.geometry.dispose(); platformMat.dispose();
      tapMesh.geometry.dispose();
      railMesh.geometry.dispose(); railMesh.material.dispose();
      ladderMesh.geometry.dispose(); ladderMesh.material.dispose();
    },
  };
}
