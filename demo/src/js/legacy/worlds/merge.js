/* ============================================================
   merge.js — 几何体合并工具（减少 draw call）
   Step 1 在 workshop.js 里的极简实现，Step 2 抽为公共模块
   ============================================================ */

import * as THREE from 'three';

/**
 * 把一组同材质的几何体合并为单个 BufferGeometry
 * 适用范围：非索引或可转非索引的 Box/Cylinder/Cone/Torus 等基础体
 * @param {THREE.BufferGeometry[]} geos 已 translate/rotate 到位的几何体
 * @returns {THREE.BufferGeometry}
 */
export function mergeGeometries(geos) {
  const nonIndexed = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = nonIndexed.reduce((n, g) => n + g.attributes.position.count, 0);

  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let vo = 0;

  for (const g of nonIndexed) {
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    vo += g.attributes.position.count;
    g.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}
