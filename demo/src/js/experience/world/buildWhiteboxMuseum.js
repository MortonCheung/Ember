/* ============================================================
   buildWhiteboxMuseum.js — 连续数字博物馆 Clay / Whitebox 空间
   ============================================================ */

import * as THREE from 'three';
import { WhiteboxLighting } from './WhiteboxLighting.js';
import { buildProxyExhibits } from './buildProxyExhibits.js';
import { EXHIBITS } from '../data/journey-data.js';

const COLORS = {
  floor: 0xaaa9a4,
  wall: 0xc9c7c0,
  structure: 0x7c7e7d,
  dark: 0x3d4142,
  accent: 0xb95632,
};

export function buildWhiteboxMuseum(scene, { reducedMotion = false } = {}) {
  const group = new THREE.Group();
  group.name = 'whitebox_museum';

  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: .92, metalness: .02 }),
    wall: new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: .88, metalness: .01 }),
    structure: new THREE.MeshStandardMaterial({ color: COLORS.structure, roughness: .78, metalness: .12 }),
    dark: new THREE.MeshStandardMaterial({ color: COLORS.dark, roughness: .82, metalness: .08 }),
    accent: new THREE.MeshStandardMaterial({ color: COLORS.accent, roughness: .7, metalness: .08 }),
  };

  const geometries = [];
  const meshes = [];

  function box(name, size, position, material = materials.wall, rotationY = 0) {
    const geometry = new THREE.BoxGeometry(...size);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.rotation.y = rotationY;
    mesh.castShadow = material !== materials.floor;
    mesh.receiveShadow = true;
    meshes.push(mesh);
    group.add(mesh);
    return mesh;
  }

  function room(id, { center, size, floorY = 0, wallHeight = 7, openings = [] }) {
    const [width, depth] = size;
    const [cx, cz] = center;
    box(`${id}_floor`, [width, .18, depth], [cx, floorY - .09, cz], materials.floor);
    const wallY = floorY + wallHeight / 2;
    if (!openings.includes('left')) box(`${id}_wall_l`, [.26, wallHeight, depth], [cx - width / 2, wallY, cz]);
    if (!openings.includes('right')) box(`${id}_wall_r`, [.26, wallHeight, depth], [cx + width / 2, wallY, cz]);
    if (!openings.includes('front')) box(`${id}_wall_f`, [width, wallHeight, .26], [cx, wallY, cz + depth / 2]);
    if (!openings.includes('back')) box(`${id}_wall_b`, [width, wallHeight, .26], [cx, wallY, cz - depth / 2]);
  }

  // 馆外与入口：先给远景轮廓，再通过门框进入序厅。
  box('exterior_floor', [26, .18, 31], [0, -.09, 37], materials.floor);
  box('facade_left', [8, 9, 1.1], [-7.6, 4.5, 28], materials.wall);
  box('facade_right', [8, 9, 1.1], [7.6, 4.5, 28], materials.wall);
  box('facade_lintel', [7.2, 2.1, 1.1], [0, 7.95, 28], materials.accent);
  box('facade_crown', [24, 1.1, 1.4], [0, 10, 28], materials.structure);
  for (const x of [-10, -5, 0, 5, 10]) {
    box(`facade_rib_${x}`, [.3, 10, 1.5], [x, 5, 27.7], materials.structure);
  }

  room('foyer', { center: [0, 18], size: [18, 18], openings: ['front', 'back'] });
  box('foyer_frame_a', [13, .35, .35], [0, 5.8, 18], materials.structure);
  box('foyer_frame_b', [13, .35, .35], [0, 5.8, 12], materials.structure);

  // 沈阳：较低、精密、横向的机械空间。
  room('shenyang', { center: [-11, -2], size: [22, 24], openings: ['front', 'right', 'back'] });
  for (const z of [7, 1, -5, -11]) {
    box(`shenyang_beam_${z}`, [20, .26, .45], [-11, 5.6, z], materials.structure);
  }
  box('shenyang_plinth', [7.6, .26, 3.2], [-16, .13, -3], materials.dark);

  // 第一段城市过渡以错开的框架强调“仍在同一座建筑中”。
  box('transition_a_floor', [14, .18, 21], [-1.5, -.09, -18], materials.floor, -.44);
  for (let i = 0; i < 4; i += 1) {
    box(`transition_a_frame_${i}`, [.32, 6.5, 7.5], [-6 + i * 4, 3.25, -16 - i * 2.7], materials.structure, -.44);
  }

  // 鞍山：挑高，Hero 从走廊中提前显现。
  room('anshan', { center: [12, -40], size: [24, 29], wallHeight: 15, openings: ['front', 'left', 'back'] });
  box('anshan_plinth', [9, .65, 9], [16, .32, -40], materials.dark);
  for (const z of [-30, -40, -50]) {
    box(`anshan_gantry_${z}_l`, [.45, 13, .45], [3, 6.5, z], materials.structure);
    box(`anshan_gantry_${z}_r`, [.45, 13, .45], [21, 6.5, z], materials.structure);
    box(`anshan_gantry_${z}_top`, [18.5, .45, .45], [12, 12.8, z], materials.structure);
  }

  // 下沉段：三块连续落差地面，保持真实视觉高度差。
  box('descent_floor_a', [13, .22, 15], [6, -.2, -55], materials.floor, .48);
  box('descent_floor_b', [13, .22, 15], [0, -.48, -61], materials.floor, .48);
  box('descent_floor_c', [13, .22, 15], [-6, -.78, -67], materials.floor, .48);
  for (let i = 0; i < 5; i += 1) {
    box(`descent_marker_${i}`, [.16, .04, 3.5], [5 - i * 2.6, -.05 - i * .16, -54 - i * 3], materials.accent, .48);
  }

  // 抚顺：低地坪、压低顶界，材质仍维持白盒统一性。
  room('fushun', { center: [-12, -80], size: [24, 28], floorY: -.9, wallHeight: 7, openings: ['front', 'right', 'back'] });
  box('fushun_plinth', [10, .55, 7], [-16, -.62, -80], materials.dark);
  for (const z of [-72, -80, -88]) {
    // 地层板只压在矿业设备上方，不横跨参观动线（原先 23m 宽会切进相机视锥）。
    box(`fushun_strata_${z}`, [13, .16, .8], [-17, 1.6 + (z + 80) * .08, z], materials.accent);
  }

  // 终章重新抬升并收束到一条明亮出口。
  // 出口整体后移 4m 并把柱廊加到 5 跨，让亮门洞成为远处的收束点而不是糊脸的大平面。
  box('finale_floor', [18, .18, 38], [-1.5, -.18, -102], materials.floor, -.28);
  for (let i = 0; i < 5; i += 1) {
    const z = -94 - i * 5.5;
    box(`finale_frame_${i}_l`, [.32, 7.4, .42], [-7 + i * 1.5, 3.5, z], materials.structure, -.28);
    box(`finale_frame_${i}_r`, [.32, 7.4, .42], [7 + i * .3, 3.5, z], materials.structure, -.28);
    box(`finale_frame_${i}_top`, [14, .32, .42], [i * .7, 7.1, z], materials.structure, -.28);
  }
  box('exit_wall', [20, 8.4, .5], [0, 4, -118], materials.wall);
  box('exit_opening', [5.4, 6.2, .62], [0, 3.1, -117.65], materials.accent);
  box('exit_light', [4.2, 5.4, .7], [0, 2.7, -117.25], new THREE.MeshBasicMaterial({ color: 0xffe8bf }));

  const lighting = new WhiteboxLighting(scene);
  const proxies = buildProxyExhibits({ exhibits: EXHIBITS, reducedMotion });
  group.add(proxies.group);

  return {
    group,
    exhibits: proxies.exhibits,
    update(time, progress) {
      lighting.update(progress);
      proxies.update(time, progress);
    },
    dispose() {
      lighting.dispose();
      proxies.dispose();
      const uniqueMaterials = new Set(Object.values(materials));
      meshes.forEach((mesh) => {
        if (mesh.material && !Object.values(materials).includes(mesh.material)) {
          uniqueMaterials.add(mesh.material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      uniqueMaterials.forEach((material) => material.dispose());
      group.removeFromParent();
    },
  };
}
