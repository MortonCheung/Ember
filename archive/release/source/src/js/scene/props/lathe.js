/* ============================================================
   props/lathe.js — C620-1 普通车床（真实比例建模 + 等比展陈放大）
   依据：spec/SCENE-LAYOUT-FIX-SPEC.md §3（逐件坐标表）
        + §9.3 段数表 + §9.4 B 组细节
        + §10.5（2C-R3 尺度定稿：等比 ×1.4）
        + §10.8-A（2C-R5 终位确认 + 2C-R5-FIX 微调定稿：(9.4, −7.6) / rotY = 0）
   真实基准：沈阳第一机床厂 1955，2410 × 1000 × 1250 mm（登第三套人民币 2 元券正面）
   模型坐标：长 2.53 × 宽 1.02 × 高 1.33 m，主轴中心高 0.19 m（中心线 y = 0.99）
   ⚠️ 2C-R3 尺度定稿（见 §10.5，覆盖 §10A 的 R2 差异化放大）：
      · **等比放大 1.4**（三轴一致）→ 落地 3.54 × 1.43 × 1.86 m，主轴中心高 1.386 m。
        R2 曾用 (1.6,1.3,1.3) 差异化放大把长宽比从真实 2.41 拉到 3.05，
        读起来变成 CW6163/CW6180 那种 4 米大车床 —— 而 C620-1 是全篇唯一
        「具体型号 + 具体史实」的展品（1955 沈阳第一机床厂、赵国友 4h→50min），
        比例失真会直接削弱说服力，故本轮回归等比。
   ⚠️ 2C-R5 迁位（**实现方判断（未走规格）**，见 §10.8「事实」段 —— 不得再声称是设计方意见）：
      把车床从 §10.5 的 (15.5, 0, −4.8) / rotY = 20° 迁到 (6.5, 0, −6.6) / rotY = 0，
      即冲天炉右侧、砂箱阵列（x 4.19–8.81 / z −2.01–4.01）正后方；本轮改动未经规格，
      后由设计方在 §10.8 予以**确认保留**（"阵列后方"这一排布不回到导向线右侧）。
      · rotation.y = 0：按"与砂箱作业区地面警示线平行（世界轴对齐）"理解 —— 操作面
        （溜板箱/手轮/丝杠）正对入场方向，入场即读到床身/主轴箱/尾座的完整侧面。
        长轴沿视线只能看到端面，会退回 R3 要消灭的"大方箱"读法，故不取。
      · 工具车随迁（props/toolcart.js），仍是 1:1 参照物，不参与 ×1.4。
      · 【已作废】§10.5 原值 rotY = 20°（保留小角度是为了在正面平视图里看到溜板箱与手轮）。
      · 【已作废】§10.5 原落位 (15.5, 0, −4.8)。
   ⚠️ 2C-R5-FIX 落位微调定稿（见 §10.8-A）：
      · **落位 (9.4, 0, −7.6)**、rotY = 0：同排布内前移右移 1.4m。原因：R5 位 (6.5, −6.6)
        有 **13% 的车床屏幕框（正是腿与底座）埋在砂箱阵列剪影里** —— 阵列在车前 3.9m，
        机器读起来"站在砂模堆里"。微调后阵列遮挡 **0%**、屏幕宽 114 → **121 px**、朝向理由不变。
      · 微调后校验：包箱 x 7.62–11.18（距导向线 x=11.5 净距 0.32m，不压线）、
        z −8.32 – −6.89（距警示线后沿 z=−3.14 有 3.75m、距阵列包箱后沿 4.88m），
        立柱 (13,±6/−18) 均在 13m 开外。
      · 观众在场内**没有人体参照**，"比人高"判断不了；他们真正能比较的是
        「车床 : 单只砂箱」与「车床 : 工具车」两组关系（工具车 0.92m 为 1:1 实物尺度，
        见 props/toolcart.js）。两组关系自洽后，机器多大都成立 —— 这也是 R3
        把"玩具感"根因（砂箱过大、与车床占地 1:1）交给砂箱缩放去解的原因。
      · 改 group.scale 后**必须同步 userData.displayScale**，否则 layout() 的 axisY 会报错值。
   ⚠️ 原模型比例本身是错的（床身 0.6 高 / 主轴箱 1.1 高 → 剪影近正方形，故读作"大方箱"），
      本轮按坐标表重建，不靠等比缩放。
   ⚠️ 三处水平向收敛（详见交付说明）——§3.2 表自身的托盘 2.64、前方溜板手轮 z=0.70、
      后置电机 z=−0.66 会把整机撑到 2.64×1.44，落不进 V2 的 2.53×1.02×1.33 带：
        · 托盘 2.64 → 2.52（仍略宽于床身 2.50）
        · 前方溜板箱 / 手轮 / 丝杠光杠 z 0.52·0.62·0.50 → 0.44·0.47·0.47
        · 电机组由床身后方 (z=−0.66) 移到床身下方 (z=−0.25)：真实 C620-1 电机也在床座内
      竖向层次、四件共轴 y=0.99、中心高 0.19 完全按表。
   性能：漆面件 1 mesh + 亮钢件 1 mesh + 铭牌 1 mesh = 3 draw call
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from '../merge.js';

const PAINT = 0x4A5A52;   // 机床漆绿灰 .48 / .25
const STEEL = 0x8B939E;   // 导轨亮钢 .28 / .85

const SPINDLE_Y = 0.99;   // 主轴中心线（卡盘 / 工件 / 套筒 / 顶尖四件共轴，模型坐标）
// 2C-R5-FIX（§10.8-A）：冲天炉右侧 / 砂箱阵列正后方居中，同排布内前移右移 —— 阵列遮挡 13% → 0%
const POS = { x: 9.4, z: -7.6 };
const SCALE = { x: 1.4, y: 1.4, z: 1.4 }; // 2C-R3（§10.5）：等比展陈放大，内部比例保持真实
const ROT_Y = 0;                          // 2C-R5（§10.8-A）：与砂箱作业区警示线平行，操作面正对入场方向

/** 铭牌贴图：浅色底 + 两道横向细线示意字（该尺寸下真渲染汉字必糊） */
function makeNameplateTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#C9D2DA';
  ctx.fillRect(0, 0, 128, 48);
  ctx.fillStyle = '#5A6570';
  ctx.fillRect(14, 15, 100, 3);
  ctx.fillRect(14, 28, 70, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildLathe() {
  const group = new THREE.Group();
  group.position.set(POS.x, 0, POS.z);
  group.scale.set(SCALE.x, SCALE.y, SCALE.z);   // 2C-R3 等比展陈放大 1.4
  group.rotation.y = ROT_Y;                     // 2C-R5（§10.8-A）朝向 0°：与作业区警示线平行
  group.name = 'lathe_c620';   // viewport.silhouette() 按名字找，不得改
  group.userData.spindleY = SPINDLE_Y;          // layout() 读共轴基准（模型坐标，世界值 × scale.y）
  group.userData.displayScale = [SCALE.x, SCALE.y, SCALE.z];  // layout() V2/W1/W3 读；改 scale 必须同步
  group.userData.rotY = ROT_Y;                  // layout() W4 读

  const paintGeos = [];
  const steelGeos = [];

  const box = (w, h, d, x, y, z, into) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    into.push(g);
  };
  const cyl = (r0, r1, h, seg, axis, x, y, z, into) => {
    const g = new THREE.CylinderGeometry(r0, r1, h, seg);
    if (axis === 'x') g.rotateZ(Math.PI / 2);
    else if (axis === 'z') g.rotateX(Math.PI / 2);
    g.translate(x, y, z);
    into.push(g);
  };

  /* ===== 竖向层次：床腿 0–0.42 / 托盘 0.42–0.48 / 床身 0.48–0.80
     导轨 0.80–0.85 / 主轴箱 0.80–1.14 / 皮带罩 1.14–1.27 / 挂轮罩 1.27–1.33 ===== */

  for (const dx of [-0.86, 0.86]) box(0.60, 0.42, 0.86, dx, 0.21, 0, paintGeos);   // 1 床腿 ×2
  box(2.52, 0.06, 1.02, 0, 0.45, 0.02, paintGeos);                                 // 2 冷却液托盘
  box(2.50, 0.32, 0.88, 0, 0.64, 0, paintGeos);                                    // 3 床身
  for (const dz of [-0.25, 0.25]) box(2.50, 0.05, 0.13, 0, 0.825, dz, steelGeos);   // 4 导轨 ×2
  box(0.72, 0.34, 0.78, -0.89, 0.97, 0, paintGeos);                                // 5 主轴箱
  box(0.62, 0.13, 0.70, -0.86, 1.205, 0, paintGeos);                               // 6 皮带罩
  box(0.48, 0.06, 0.58, -0.83, 1.30, 0, paintGeos);                                // 7 挂轮罩

  // 8 卡盘（§9.3：16 → 28 段）：主轴箱右端面，正对床身
  cyl(0.16, 0.16, 0.20, 28, 'x', -0.43, SPINDLE_Y, 0, steelGeos);
  // 9 卡盘爪 ×3（两级台阶）
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    box(0.10, 0.07, 0.07, -0.30, SPINDLE_Y + Math.sin(a) * 0.075, Math.cos(a) * 0.075, steelGeos);
    box(0.10, 0.11, 0.11, -0.30, SPINDLE_Y + Math.sin(a) * 0.13, Math.cos(a) * 0.13, steelGeos);
  }
  cyl(0.05, 0.05, 0.51, 20, 'x', -0.075, SPINDLE_Y, 0, steelGeos);   // 10 工件（12→20 段）
  cyl(0.032, 0.032, 0.42, 16, 'x', 0.41, SPINDLE_Y, 0, steelGeos);   // 11 套筒（10→16 段）
  cyl(0.008, 0.04, 0.06, 12, 'x', 0.19, SPINDLE_Y, 0, steelGeos);    // 12 顶尖（8→12 段）
  box(0.58, 0.32, 0.56, 0.92, 0.96, 0, paintGeos);                   // 13 尾座体
  cyl(0.09, 0.09, 0.05, 24, 'x', 1.22, SPINDLE_Y, 0, steelGeos);     // 14 尾座手轮
  box(0.12, 0.03, 0.03, 1.22, 1.08, 0, steelGeos);                   //    摇把

  box(0.56, 0.20, 0.14, 0.06, 0.90, 0.44, paintGeos);                // 15 溜板箱
  box(0.24, 0.14, 0.28, 0.06, 1.06, 0, paintGeos);                   // 16 方刀台
  box(0.12, 0.06, 0.06, -0.09, 1.00, 0, steelGeos);                  // 17 刀头
  cyl(0.085, 0.085, 0.04, 24, 'z', 0.06, 0.90, 0.47, steelGeos);     // 18 大溜板手轮
  box(0.03, 0.03, 0.12, 0.06, 0.97, 0.46, steelGeos);                //    摇把
  cyl(0.032, 0.032, 2.05, 12, 'x', 0, 0.70, 0.47, steelGeos);        // 19 丝杠（8→12 段）
  cyl(0.026, 0.026, 2.05, 12, 'x', 0, 0.58, 0.47, steelGeos);        // 20 光杠（8→12 段）
  cyl(0.06, 0.06, 0.04, 24, 'x', 1.06, 0.70, 0.47, steelGeos);       // 21 丝杠右端手轮
  box(0.03, 0.03, 0.14, 0.30, 0.86, 0.44, steelGeos);                // 22 开合螺母手柄
  for (const [lx, ly] of [[-1.06, 0.88], [-0.88, 0.88], [-1.06, 1.02], [-0.88, 1.02]]) {
    cyl(0.025, 0.025, 0.10, 8, 'z', lx, ly, 0.44, steelGeos);        // 23 变速手柄杆 ×4
    const knob = new THREE.SphereGeometry(0.032, 10, 8);
    knob.translate(lx, ly, 0.49);
    steelGeos.push(knob);                                            //    球头
  }
  box(0.14, 0.16, 0.07, -0.60, 1.02, 0.42, paintGeos);               // 24 开关盒

  // 26/27/28 电机组：床身下方（落地链完整；真实 C620-1 电机也在床座内）
  box(0.90, 0.10, 0.46, 0, 0.05, -0.25, paintGeos);                  // 26 电机座
  box(0.86, 0.30, 0.42, 0, 0.25, -0.25, paintGeos);                  // 27 电机
  cyl(0.14, 0.14, 0.08, 20, 'x', -0.42, 0.25, -0.25, steelGeos);     // 28 皮带轮（12→20 段）

  /* ===== §9.4 B 组细节（6 处；并入既有 2 个 mesh，不新开 mesh）===== */

  // B1 导轨刮板（防屑板）：前后导轨两端各一块
  for (const dx of [-1.22, 1.22]) {
    for (const dz of [-0.25, 0.25]) box(0.10, 0.14, 0.16, dx, 0.855, dz, paintGeos);
  }
  box(0.03, 0.03, 0.16, 0.92, 0.86, 0.34, paintGeos);                // B2 尾座锁紧手柄
  // B3 拖板刻度环 + 12 条刻度
  cyl(0.06, 0.06, 0.02, 24, 'z', 0.06, 0.90, 0.50, steelGeos);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(0.012, 0.012, 0.02, 0.06 + Math.cos(a) * 0.075, 0.90 + Math.sin(a) * 0.075, 0.50, steelGeos);
  }
  // B4 皮带罩散热格栅：正面 5 道（尺寸按安装面 0.62×0.13 适配）
  for (let i = 0; i < 5; i++) box(0.10, 0.11, 0.02, -1.06 + i * 0.10, 1.205, 0.36, paintGeos);
  // B5 油标 / 油孔 ×2（主轴箱正面）
  cyl(0.03, 0.03, 0.03, 12, 'z', -1.05, 0.95, 0.405, steelGeos);
  cyl(0.03, 0.03, 0.03, 12, 'z', -0.72, 0.95, 0.405, steelGeos);
  // B6 地脚螺栓 + 垫铁 ×4（床腿四角贴地）
  for (const dx of [-1.16, 1.16]) {
    for (const dz of [-0.32, 0.32]) {
      box(0.16, 0.05, 0.16, dx, 0.025, dz, paintGeos);
      cyl(0.02, 0.02, 0.09, 8, 'y', dx, 0.095, dz, paintGeos);
    }
  }

  /* ===== 合并：2 个主体 mesh + 1 个铭牌 ===== */

  const paintMesh = new THREE.Mesh(mergeGeometries(paintGeos),
    new THREE.MeshStandardMaterial({ color: PAINT, roughness: 0.48, metalness: 0.25 }));
  const steelMesh = new THREE.Mesh(mergeGeometries(steelGeos),
    new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.28, metalness: 0.85 }));

  // 25 铭牌：单独 mesh（唯一允许的第 3 个）
  const plateMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.10, 0.015),
    new THREE.MeshStandardMaterial({ map: makeNameplateTexture(), roughness: 0.35, metalness: 0.3 })
  );
  plateMesh.position.set(-1.08, 1.05, 0.40);

  paintMesh.name = 'lathe_body';
  steelMesh.name = 'lathe_steel';
  plateMesh.name = 'lathe_plate';
  paintMesh.castShadow = true;
  steelMesh.castShadow = true;
  plateMesh.castShadow = true;
  group.add(paintMesh, steelMesh, plateMesh);

  return {
    group,
    spindleY: SPINDLE_Y,
    dispose() {
      paintMesh.geometry.dispose(); paintMesh.material.dispose();
      steelMesh.geometry.dispose(); steelMesh.material.dispose();
      plateMesh.geometry.dispose(); plateMesh.material.map.dispose(); plateMesh.material.dispose();
    },
  };
}
