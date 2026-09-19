/* ============================================================
   props/ladle.js — 铁水包（浇包）· Step 2C 新增
   依据：spec/SCENE-LAYOUT-FIX-SPEC.md §5-3（悬空构件第 3 项）、§9.4 D 组细节
   叙事：接住冲天炉出铁流槽的铁水——补上"熔炼 → 浇注"叙事链缺的那一环，
        同时终结"流槽末端离地 1.10m 悬空"这一缺陷（口沿与流槽末端齐平）。
   约束：不随冲天炉缩放；纯几何、不新增贴图；仅复用既有材质色；
        2 个 mesh（包体组 1 + 铁水液面 1）= +2 draw call。
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from '../scenes/merge.js';

const IRON = 0x3A4149;      // 铸铁暗灰：复用炉体色（不引入新颜色）
const MOLTEN = 0xFF6A2A;    // 铁水液面：与炉口环同族暖色（唯一新增材质，自发光替代品）

/** 包体高度 = 流槽末端高度（世界 1.10m），口沿即包口 */
export const LADLE_RIM_Y = 1.10;

/**
 * @param {{x?:number, z?:number}} [pos] 世界落点（由 workshop 用 cupola.troughEnd 传入）
 */
export function buildLadle({ x = -6, z = -0.39 } = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.name = 'ladle';
  group.userData.rimY = LADLE_RIM_Y;

  const ironMat = new THREE.MeshStandardMaterial({
    color: IRON, roughness: 0.7, metalness: 0.45,
  });

  const geos = [];

  // D1 包体（§9.3 给 28，按 §9.2"直径≥0.5m 须 36–48 段"取 36）+ 口沿加强环
  const body = new THREE.CylinderGeometry(0.80, 0.65, LADLE_RIM_Y, 36);
  body.translate(0, LADLE_RIM_Y / 2, 0);
  geos.push(body);

  const rim = new THREE.TorusGeometry(0.80, 0.05, 10, 36);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, LADLE_RIM_Y, 0);
  geos.push(rim);

  // D2 倾动装置：侧置减速箱 + 手轮（手轮轴线沿 x，正面朝外）
  const gearbox = new THREE.BoxGeometry(0.5, 0.6, 0.4);
  gearbox.translate(0.95, 0.60, 0);
  geos.push(gearbox);

  const handwheel = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 36);   // Ø0.56 ≥0.5m
  handwheel.rotateZ(Math.PI / 2);            // 轴线 → x
  handwheel.translate(1.22, 0.60, 0);
  geos.push(handwheel);

  // D3 吊耳 ×2（口沿两侧，担梁吊运语义）+ 包底坐圈
  for (const dx of [-0.86, 0.86]) {
    const lug = new THREE.BoxGeometry(0.16, 0.30, 0.20);
    lug.translate(dx, LADLE_RIM_Y + 0.12, 0);
    geos.push(lug);
  }
  const baseRing = new THREE.CylinderGeometry(0.70, 0.70, 0.10, 36);   // Ø1.4 ≥0.5m
  baseRing.translate(0, 0.05, 0);
  geos.push(baseRing);

  const ladleMesh = new THREE.Mesh(mergeGeometries(geos), ironMat);
  ladleMesh.name = 'ladle_body';
  ladleMesh.castShadow = true;
  ladleMesh.receiveShadow = true;
  group.add(ladleMesh);

  // D4 铁水液面：包内 0.98m 处的一层暖色"余温"（MeshBasicMaterial = 自发光替代）
  const molten = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.02, 36),   // Ø1.44 ≥0.5m
    new THREE.MeshBasicMaterial({ color: MOLTEN })
  );
  molten.name = 'ladle_molten';
  molten.position.y = 0.98;
  group.add(molten);

  return {
    group,
    dispose() {
      ladleMesh.geometry.dispose();
      ironMat.dispose();
      molten.geometry.dispose();
      molten.material.dispose();
    },
  };
}
