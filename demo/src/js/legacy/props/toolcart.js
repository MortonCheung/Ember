/* ============================================================
   props/toolcart.js — 钳工工具车（已知尺寸参照物）
   依据：spec/PROMPT-SCENE-LAYOUT-R3.md §3-⑤
        + spec/SCENE-LAYOUT-FIX-SPEC.md §10.5（2C-R3 落地）+ §10.8-B（2C-R5-FIX 定稿）
   作用：展陈设计里让"小展品不显小"的标准手法 —— 场内给一个观众熟悉的尺度基准。
        车床是等比放大的（1.4×），单看它无从判断体量；旁边放一台 1:1 的工具车
        （0.92m，约等于成人腰高），"这台车床有多大"立刻成立。
   ⚠️ 落位定稿（见 §10.8-B）：**贴着车床端头外侧，随车床走** ——
      包箱 +x 端外侧 0.45m、`z = 车床 z + 0.35`、`rotY = 0`（与车床同向），
      落数 `POS = (12.22, 0, −7.25)`。车床包箱 x 7.62–11.18 → 车柜左沿 x≈11.64，净距 0.45m。
      · **§10.9.1 已裁定**：维持 **+x 端**挂载（不换 −x）；导向线 x=11.5 落在车床包箱
        （max x 11.19）与车柜包箱（min x 11.64）之间的 0.45m 空档为**几何必然，接受** ——
        导向线是 2–3px 地面淡贴花（作业区边界提示，非结构物），工具车停在其**外侧**本就正确；
        −x 备选更小（38×35px < 44×40px）且下沿会贴上砂箱阵列剪影。场景自 §10.10 起冻结。
      **参照物的第一属性是"贴着参照对象"，不是"在默认机位里显得大"** ——
      所以可读性判据挂在近观 `cart` 预设上（§10.8-B），不挂默认机位。
      ·【已作废】§10.7-A 的 `(13.0, 0, −2.6)` / `rotY = 20°`：那个位子是为"车床在
        (15.5, −4.8)"选的（当时落在砂箱阵列与车床之间的空档）；车床迁到 (9.4, −7.6) 后
        两点相距 5.5m 以上，参照物与参照对象脱开。
      ·【已作废】(16.4, −3.0)：右下角小地图悬浮层压占 16.2% 的屏幕框。
      ·【已作废】R5 的 (9.30, 0, −6.70)：随车床一起前移右移，见上。
   ⚠️ 默认机位下它只有 ~44 × 40 px —— 这是**几何必然，不是错误**：车床在该深度屏幕高 81px，
      而工具车 0.92m 只有车床 1.86m 的一半，同深度下只能读到 ~40px。在 `cart` 近观预设里
      它是 250 × 198 px，抽屉分缝 / 把手 / 脚轮都读得清（§10.8-B 的判据依据）。
   ⚠️ 世界尺度 1 : 1，**不参与车床的 ×1.4 缩放**，因此挂在 workshop group 上
      （不是挂在 lathe group 内），且 group.scale 保持 1。
   构成（§3-⑤ 逐件，y 值按"总高 0.92"补齐）：
     柜体 / 台面 / 抽屉分缝 ×3 / 把手 ×3 / 脚轮 ×4 / 台面后挡边
   总高 0.92m × 长 1.10m × 宽 0.55m
   性能：漆面件 1 mesh + 亮钢件 1 mesh = 2 draw call
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from '../worlds/merge.js';

const PAINT = 0x4A5A52;   // 与车床同族漆绿灰（.48 / .25）
const STEEL = 0x8B939E;   // 与车床同族亮钢（.28 / .85）

const H = 0.92;           // 总高（layout() W8.height 判据）
// 2C-R5-FIX（SCENE-LAYOUT-FIX-SPEC.md §10.8-B）：贴在车床包箱 +x 端外侧 0.45m，
//        z = 车床 z + 0.35 = −7.6 + 0.35 = −7.25；车床 (9.4, −7.6) 包箱 x 7.62–11.18
const POS = { x: 12.22, z: -7.25 };
const ROT_Y = 0;   // 与车床同向（平行于砂箱作业区警示线，§10.8-A）

export function buildToolCart() {
  const group = new THREE.Group();
  group.position.set(POS.x, 0, POS.z);
  group.rotation.y = ROT_Y;
  group.scale.setScalar(1);           // 1:1 —— 不得随车床缩放
  group.name = 'toolcart';
  group.userData.height = H;          // layout() W8 读

  const paintGeos = [];
  const steelGeos = [];

  const box = (w, h, d, x, y, z, into) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    into.push(g);
  };

  // 脚轮 ×4（r 0.06，轮底正好落地 y=0；rotZ → 轮轴沿 x）
  for (const dx of [-0.44, 0.44]) {
    for (const dz of [-0.20, 0.20]) {
      const g = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16);
      g.rotateZ(Math.PI / 2);
      g.translate(dx, 0.06, dz);
      steelGeos.push(g);
    }
  }

  box(1.10, 0.78, 0.55, 0, 0.39, 0, paintGeos);        // 柜体 0.00–0.78
  box(1.16, 0.05, 0.60, 0, 0.805, 0, paintGeos);       // 台面（略外挑）0.78–0.83
  box(1.10, 0.09, 0.03, 0, 0.875, -0.27, paintGeos);   // 台面后挡边 0.83–0.92 → 总高 0.92

  for (const y of [0.22, 0.42, 0.62]) box(1.06, 0.012, 0.02, 0, y, 0.28, paintGeos);   // 抽屉分缝
  for (const y of [0.16, 0.36, 0.56]) box(0.28, 0.03, 0.03, 0, y, 0.295, steelGeos);   // 抽屉把手

  const paintMesh = new THREE.Mesh(mergeGeometries(paintGeos),
    new THREE.MeshStandardMaterial({ color: PAINT, roughness: 0.48, metalness: 0.25 }));
  const steelMesh = new THREE.Mesh(mergeGeometries(steelGeos),
    new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.28, metalness: 0.85 }));

  paintMesh.name = 'toolcart_body';
  steelMesh.name = 'toolcart_steel';
  paintMesh.castShadow = true;
  steelMesh.castShadow = true;
  paintMesh.receiveShadow = true;
  group.add(paintMesh, steelMesh);

  return {
    group,
    dispose() {
      paintMesh.geometry.dispose(); paintMesh.material.dispose();
      steelMesh.geometry.dispose(); steelMesh.material.dispose();
    },
  };
}
