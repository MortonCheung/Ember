/* ============================================================
   buildShenyangSet.js — 沈阳 · 机器（1950s 铁西老厂房）

   摄影语言：正常人体高度 1.6~1.7m，向前 / 轻微偏左 / 回正 / 轻微偏右 / 回正。
   yaw 不做突然大角度变化。这里的力量来自「环境在用户身边工作」，
   不是 Camera 到处飞。

   空间：厂房沿 -Z 纵深 148m（Z ∈ [-30, -178]），X ∈ [-16, 16]，墙高 11m。
   入口大门 Z=-30（OP-09 打开），出口大门 Z=-178。
   C620-1 位于 (-9.6, 0, -104)，工作台位于 (-6.5, 0, -158)。
   ============================================================ */

import * as THREE from 'three';
import { WorldBuilder, createWorker, PALETTE } from '../primitives.js';
import { createWallText, createNameplate, createCallout } from '../textPlates.js';

// 定位式调用（dt=0：Debug setShot / Explore 返回）必须一步到位——
// damp 在 dt=0 时是恒等映射，会让门、炉温这类状态停在初始值。
const damp = (current, target, lambda, dt) => (
  dt > 0 ? THREE.MathUtils.damp(current, target, lambda, dt) : target
);

export function buildShenyangSet({ reducedMotion = false } = {}) {
  const b = new WorldBuilder('set_shenyang');
  const parts = { workers: [], lamps: [] };

  /* ---------------- 建筑外壳 ---------------- */
  const X0 = -16;
  const X1 = 16;
  const Z0 = -30;
  const Z1 = -178;
  const DEPTH = Z1 - Z0;
  const MID_Z = (Z0 + Z1) / 2;

  b.box('sy_floor', [X1 - X0, 0.2, -DEPTH], [(X0 + X1) / 2, -0.1, MID_Z], 'concreteDark');
  b.box('sy_wall_l', [0.3, 11, -DEPTH], [X0 + 0.15, 5.5, MID_Z], 'concrete');
  b.box('sy_wall_r', [0.3, 11, -DEPTH], [X1 - 0.15, 5.5, MID_Z], 'concrete');
  b.box('sy_wall_back', [X1 - X0, 11, 0.3], [(X0 + X1) / 2, 5.5, Z1 + 0.15], 'concreteDark');

  // 混凝土柱列：双列，沿 Z 每 11m 一跨。它们同时承担「引导视线」的任务。
  // ⚠️ Z1 比 Z0 更负，沿 -Z 推进的循环条件必须写 z >= Z1 + …。
  // 曾经写成 z <= Z1 - …（永假），柱列 / 桁架 / 高窗 / 枕木整批都没生成，
  // 厂房因此是空壳 —— 这是「沈阳又空又暗」的真正原因。
  const columnTransforms = [];
  for (let z = Z0 + 6; z >= Z1 + 4; z -= 11) {
    columnTransforms.push({ x: X0 + 2.2, y: 5.5, z });
    columnTransforms.push({ x: X1 - 2.2, y: 5.5, z });
  }
  b.instances('sy_columns',
    () => new THREE.BoxGeometry(0.9, 11, 0.9), columnTransforms, 'concrete');

  // 柱顶牛腿 + 天吊轨道（B 级资产，实例化）
  const corbelTransforms = columnTransforms.map((t) => ({ ...t, y: 9.1 }));
  b.instances('sy_corbels', () => new THREE.BoxGeometry(1.4, 0.5, 1.4), corbelTransforms, 'concrete');
  b.box('sy_crane_rail_l', [0.4, 0.35, -DEPTH + 2], [X0 + 2.2, 9.5, MID_Z], 'steel');
  b.box('sy_crane_rail_r', [0.4, 0.35, -DEPTH + 2], [X1 - 2.2, 9.5, MID_Z], 'steel');

  // 钢桁架：上弦 + 下弦 + 竖杆 + 斜撑，沿 Z 每 8m 一榀。
  // 四类构件各用一个 InstancedMesh —— 一列桁架只花 4 个 draw call。
  const trussZ = [];
  for (let z = Z0 + 3; z >= Z1 + 2; z -= 8) trussZ.push(z);
  b.instances('sy_truss_top',
    () => new THREE.BoxGeometry(X1 - X0 - 4, 0.28, 0.4),
    trussZ.map((z) => ({ x: 0, y: 12.4, z })), 'steel');
  b.instances('sy_truss_chord',
    () => new THREE.BoxGeometry(X1 - X0 - 4, 0.16, 0.16),
    trussZ.map((z) => ({ x: 0, y: 11.2, z })), 'steelDark');
  b.instances('sy_truss_web',
    () => new THREE.BoxGeometry(0.14, 1.2, 0.14),
    trussZ.flatMap((z) => [{ x: -9, y: 11.8, z }, { x: 9, y: 11.8, z }]), 'steelDark');
  b.instances('sy_truss_diag',
    () => new THREE.BoxGeometry(0.12, 0.12, 4.2),
    trussZ.map((z) => ({ x: -4, y: 11.9, z: z + 2.1, ry: 0.22 })), 'steelDark');

  // 高窗：两侧墙上部的冷光带，沈阳主光来源。实例化以控制 draw call。
  const windowTransforms = [];
  for (let z = Z0 + 8; z >= Z1 + 6; z -= 7.5) {
    windowTransforms.push({ x: X0 + 0.45, y: 8.4, z, ry: Math.PI / 2 });
    windowTransforms.push({ x: X1 - 0.45, y: 8.4, z, ry: -Math.PI / 2 });
  }
  const windows = b.instances('sy_windows',
    () => new THREE.PlaneGeometry(5.2, 2.4), windowTransforms, 'glass');
  // 共享的 glass 是 72% 透明的，贴在暗墙上等于隐形。
  // 沈阳的高窗是这一章的主要光源，得让它自己发光（不受光照，直接给亮度）。
  windows.material = b.own(new THREE.MeshBasicMaterial({
    color: 0xc3d6e2, transparent: true, opacity: 0.92, side: THREE.DoubleSide,
  }));

  // 地面运输轨道 + 枕木（引导视线走向 C620-1）
  b.box('sy_rail_l', [0.12, 0.14, -DEPTH + 10], [-3.6, 0.07, MID_Z], 'steel');
  b.box('sy_rail_r', [0.12, 0.14, -DEPTH + 10], [3.6, 0.07, MID_Z], 'steel');
  const sleeperTransforms = [];
  for (let z = Z0 + 12; z >= Z1 + 8; z -= 2.2) sleeperTransforms.push({ x: 0, y: 0.03, z });
  b.instances('sy_sleepers',
    () => new THREE.BoxGeometry(8.2, 0.1, 0.28), sleeperTransforms, 'rustDark');

  /* ---------------- 入口（Z=-30）与出口（Z=-178） ---------------- */
  const gate = (prefix, z, openDirection) => {
    b.box(`${prefix}_pier_l`, [3.4, 9, 0.9], [-6.6, 4.5, z], 'concrete');
    b.box(`${prefix}_pier_r`, [3.4, 9, 0.9], [6.6, 4.5, z], 'concrete');
    b.box(`${prefix}_lintel`, [13.6, 1.8, 1.1], [0, 8.6, z], 'concrete');
    const left = b.box(`${prefix}_door_l`, [6.4, 7.4, 0.24], [-3.3, 3.75, z + 0.3], 'rustDark');
    const right = b.box(`${prefix}_door_r`, [6.4, 7.4, 0.24], [3.3, 3.75, z + 0.3], 'rustDark');
    b.box(`${prefix}_door_rail`, [13.6, 0.2, 0.3], [0, 7.6, z + 0.5], 'steel');
    left.userData.closedX = -3.3;
    right.userData.closedX = 3.3;
    left.userData.openX = -3.3 + openDirection * 6.2;
    right.userData.openX = 3.3 - openDirection * 6.2;
    return { left, right };
  };
  parts.entryGate = gate('sy_entry', Z0, -1);
  parts.exitGate = gate('sy_exit', Z1, 1);

  // 门外：OP-09 第一次看见厂房全貌的地方
  b.box('sy_forecourt', [34, 0.2, 22], [0, -0.12, Z0 + 11], 'concreteDark');
  b.box('sy_facade_l', [8, 11, 1.0], [-8.6, 5.5, Z0 + 0.6], 'concrete');
  b.box('sy_facade_r', [8, 11, 1.0], [8.6, 5.5, Z0 + 0.6], 'concrete');
  b.box('sy_facade_cornice', [34, 1.2, 1.6], [0, 11.6, Z0 + 0.6], 'concreteDark');
  // 门内是一条深、暗、有机械声的真实老厂房空间 —— 不是明亮展厅。
  b.plane('sy_darkness', [13.6, 7.6], [0, 3.8, Z0 - 0.4], 'black', [0, Math.PI, 0]);

  /* ---------------- 天吊（A 级：决定空间身份） ---------------- */
  parts.crane = new THREE.Group();
  parts.crane.name = 'sy_crane';
  parts.crane.position.set(0, 9.5, -70);
  b.group.add(parts.crane);
  const craneBridge = b.box('sy_crane_bridge', [X1 - X0 - 4.4, 0.7, 1.6], [0, 0, 0], 'steel');
  const craneTrolley = b.box('sy_crane_trolley', [1.6, 0.9, 1.8], [0, -0.7, 0], 'machineGreen');
  const craneCable = b.cyl('sy_crane_cable', { rTop: 0.03, rBottom: 0.03, height: 4.2 }, [0, -3.1, 0], 'steelDark');
  parts.craneHook = new THREE.Group();
  parts.craneHook.name = 'sy_crane_hook';
  parts.craneHook.position.set(0, -5.4, 0);
  b.group.add(parts.craneHook);
  b.group.remove(parts.craneHook);
  parts.craneHook.position.set(0, -5.4, 0);
  parts.crane.add(craneBridge, craneTrolley, craneCable, parts.craneHook);
  const hookBody = b.box('sy_hook_body', [0.3, 0.6, 0.3], [0, 0, 0], 'iron');
  const hookTip = b.cone('sy_hook_tip', { r: 0.22, height: 0.5, seg: 10 }, [0, -0.5, 0], 'iron', [Math.PI, 0, 0]);
  parts.craneHook.add(hookBody, hookTip);

  /* ---------------- 浇包（挂在天吊下，缓慢倾斜） ---------------- */
  parts.ladle = new THREE.Group();
  parts.ladle.name = 'sy_ladle';
  // 相对吊钩（世界 y=4.1）：浇包中心落在 2.6 左右，包底离地 2.1。
  // 之前写成 -6.6，浇包整个埋在地面以下 2.5m，画面里根本看不到它。
  parts.ladle.position.set(0, -1.5, 0);
  b.group.add(parts.ladle);
  const ladleBody = b.cyl('sy_ladle_body', { rTop: 0.82, rBottom: 0.56, height: 1.0 }, [0, -0.5, 0], 'iron');
  const ladleRim = b.cyl('sy_ladle_rim', { rTop: 0.85, rBottom: 0.85, height: 0.1 }, [0, 0.02, 0], 'rust');
  const hotGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.05, 20);
  b.geometries.add(hotGeo);
  parts.hotMat = b.own(new THREE.MeshBasicMaterial({ color: PALETTE.molten }));
  const ladleHot = new THREE.Mesh(hotGeo, parts.hotMat);
  ladleHot.name = 'sy_ladle_hot';
  ladleHot.position.set(0, 0.06, 0);
  parts.ladle.add(ladleBody, ladleRim, ladleHot);
  parts.craneHook.add(parts.ladle);
  parts.ladleLight = new THREE.PointLight(PALETTE.hotIron, 2.2, 12, 2.0);
  parts.ladleLight.name = 'sy_ladle_light';
  parts.ladle.add(parts.ladleLight);

  /* ---------------- 冲天炉 / 砂箱 / 工具车（复用现有 Ember 资产概念） ---------------- */
  b.cyl('sy_cupola_body', { rTop: 1.5, rBottom: 1.7, height: 5.4 }, [9.5, 2.7, -64], 'rustDark');
  b.cyl('sy_cupola_stack', { rTop: 1.0, rBottom: 1.5, height: 2.6 }, [9.5, 6.7, -64], 'rust');
  b.box('sy_cupola_platform', [5.4, 0.24, 5.4], [9.5, 4.2, -64], 'steelDark');
  const cupolaTaphole = b.box('sy_cupola_taphole', [0.5, 0.5, 0.5], [7.9, 1.5, -64], 'accent');
  parts.cupolaLight = new THREE.PointLight(PALETTE.hotIron, 1.6, 10, 2.0);
  parts.cupolaLight.position.set(8.1, 1.6, -64);
  b.group.add(parts.cupolaLight);
  parts.cupolaTaphole = cupolaTaphole;

  const sandTransforms = [];
  for (let i = 0; i < 6; i += 1) {
    sandTransforms.push({ x: 6.5 + (i % 3) * 2.1, y: 0.35, z: -120 - Math.floor(i / 3) * 2.4 });
  }
  b.instances('sy_sandboxes',
    () => new THREE.BoxGeometry(1.5, 0.7, 1.5), sandTransforms, 'rustDark');

  b.box('sy_toolcart_deck', [1.6, 0.12, 0.9], [-3.4, 0.62, -136], 'machineGreen');
  b.box('sy_toolcart_leg', [1.4, 0.5, 0.7], [-3.4, 0.31, -136], 'steelDark');
  b.cyl('sy_toolcart_wheel_a', { rTop: 0.18, rBottom: 0.18, height: 0.1 }, [-3.9, 0.18, -135.6], 'steelDark', [0, 0, Math.PI / 2]);
  b.cyl('sy_toolcart_wheel_b', { rTop: 0.18, rBottom: 0.18, height: 0.1 }, [-2.9, 0.18, -136.4], 'steelDark', [0, 0, Math.PI / 2]);

  /* ---------------- C620-1（S 级 Hero，可拆解） ---------------- */
  const lathe = new THREE.Group();
  lathe.name = 'hero_lathe';
  lathe.position.set(-9.6, 0, -104);
  lathe.rotation.y = 0.3;
  b.group.add(lathe);

  const latheBed = b.box('lathe_bed', [3.3, 0.62, 1.25], [0, 0.86, 0], 'machineGreen');
  const latheBaseA = b.box('lathe_base_a', [0.9, 0.6, 1.15], [-1.2, 0.3, 0], 'machineGreen');
  const latheBaseB = b.box('lathe_base_b', [0.9, 0.6, 1.15], [1.2, 0.3, 0], 'machineGreen');
  const latheHead = b.box('lathe_head', [0.95, 1.35, 1.15], [-1.2, 1.72, 0], 'machineBlue');
  const latheCarriage = b.box('lathe_carriage', [0.75, 0.85, 1.5], [0.15, 1.5, 0], 'machineBlue');
  const latheTail = b.box('lathe_tail', [0.7, 1.05, 1.0], [1.45, 1.38, 0], 'machineBlue');
  const latheSpindle = b.cyl('lathe_spindle', { rTop: 0.15, rBottom: 0.15, height: 1.5 }, [-0.5, 1.75, 0], 'steel', [0, 0, Math.PI / 2]);
  const latheChuck = b.cyl('lathe_chuck', { rTop: 0.34, rBottom: 0.34, height: 0.26 }, [-1.72, 1.75, 0], 'iron', [0, 0, Math.PI / 2]);
  const latheHandwheel = b.cyl('lathe_handwheel', { rTop: 0.24, rBottom: 0.24, height: 0.1, seg: 18 }, [0.2, 1.18, 0.8], 'steelDark', [Math.PI / 2, 0, 0]);
  const latheTool = b.box('lathe_tool', [0.1, 0.1, 0.5], [0.15, 1.92, -0.1], 'steel');
  const latheMotor = b.box('lathe_motor', [0.9, 0.7, 0.8], [-1.6, 0.6, -0.95], 'machineGreen');
  const latheWorkpiece = b.cyl('lathe_workpiece', { rTop: 0.11, rBottom: 0.11, height: 1.1 }, [0.15, 1.75, 0], 'iron', [0, 0, Math.PI / 2]);
  const latheLampArm = b.cyl('lathe_lamp_arm', { rTop: 0.03, rBottom: 0.03, height: 0.9 }, [-0.7, 2.5, 0.3], 'steelDark');
  const latheLampHead = b.cone('lathe_lamp_head', { r: 0.18, height: 0.24, seg: 12, open: true }, [-0.7, 2.1, 0.3], 'steelDark', [Math.PI, 0, 0]);
  lathe.add(
    latheBed, latheBaseA, latheBaseB, latheHead, latheCarriage, latheTail,
    latheSpindle, latheChuck, latheHandwheel, latheTool, latheMotor,
    latheWorkpiece, latheLampArm, latheLampHead,
  );

  const latheLampMat = b.own(new THREE.MeshBasicMaterial({ color: 0x2c3033 }));
  latheLampHead.material = latheLampMat;
  parts.latheLampLight = new THREE.PointLight(0xffd9a6, 0, 5.5, 2.0);
  parts.latheLampLight.position.set(-0.7, 2.0, 0.35);
  lathe.add(parts.latheLampLight);

  // C 类文字：Hero 动态标注（细线 + 端点 + 短标签），只在重点交互出现。
  const annotationDefs = [
    { part: latheHead, label: '主轴箱', offset: [-1.5, 1.0, 0], plate: [-3.1, 3.2, 0.4] },
    { part: latheCarriage, label: '刀架 · 溜板', offset: [0.4, 1.6, 0], plate: [1.6, 3.4, 0.4] },
    { part: latheTail, label: '尾座', offset: [1.3, 0.9, 0], plate: [3.3, 2.9, 0.4] },
    { part: latheBed, label: '床身', offset: [0, -0.6, 0.8], plate: [1.8, 0.5, 1.2] },
  ];
  const annotations = annotationDefs.map((def) => {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...def.offset),
      new THREE.Vector3(def.plate[0], def.plate[1], def.plate[2]),
    ]);
    b.geometries.add(lineGeo);
    const lineMat = b.own(new THREE.LineBasicMaterial({
      color: 0xe8663c, transparent: true, opacity: 0, depthTest: false,
    }));
    const line = new THREE.Line(lineGeo, lineMat);
    line.name = `lathe_anno_line_${def.label}`;
    line.renderOrder = 7;
    const dotGeo = new THREE.SphereGeometry(0.045, 8, 6);
    b.geometries.add(dotGeo);
    const dotMat = b.own(new THREE.MeshBasicMaterial({
      color: 0xe8663c, transparent: true, opacity: 0, depthTest: false,
    }));
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.name = `lathe_anno_dot_${def.label}`;
    dot.position.set(...def.offset);
    dot.renderOrder = 8;
    const plate = createCallout(b, {
      name: `lathe_anno_label_${def.label}`,
      label: def.label,
      position: def.plate,
      width: 1.35,
      height: 0.4,
    });
    lathe.add(line, dot, plate);
    return { ...def, line, dot, plate, lineMat, dotMat, plateRest: plate.position.clone() };
  });

  const chipGeo = new THREE.BufferGeometry();
  chipGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3));
  b.geometries.add(chipGeo);
  const chipMat = b.own(new THREE.PointsMaterial({
    color: 0xffb070, size: 0.05, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  parts.chips = new THREE.Points(chipGeo, chipMat);
  parts.chips.name = 'lathe_chips';
  parts.chips.frustumCulled = false;
  lathe.add(parts.chips);

  createNameplate(b, {
    name: 'lathe_plate',
    title: 'C620-1',
    lines: ['普通车床', '1955 · 沈阳第一机床厂'],
    position: [-1.2, 2.55, 0.58],
    rotation: [0, 0, 0],
    width: 1.5,
    height: 0.85,
  });
  lathe.children.forEach((child) => {
    if (child.name === 'lathe_plate') child.rotation.y = -0.3;
  });

  const latheRest = new Map([
    [latheHead, latheHead.position.clone()],
    [latheCarriage, latheCarriage.position.clone()],
    [latheTail, latheTail.position.clone()],
  ]);

  parts.lathe = {
    root: lathe,
    bed: latheBed,
    head: latheHead,
    carriage: latheCarriage,
    tail: latheTail,
    spindle: latheSpindle,
    chuck: latheChuck,
    handwheel: latheHandwheel,
    tool: latheTool,
    workpiece: latheWorkpiece,
    lampMat: latheLampMat,
    lampLight: parts.latheLampLight,
    annotations,
    rest: latheRest,
    pickTargets: [latheBed, latheHead, latheCarriage, latheTail, latheSpindle, latheChuck, latheWorkpiece],
    state: { explode: 0, spin: 0, feed: 0, running: 0, chip: 0, cutting: 0, anno: 0 },
    setExplode(k) { this.state.explode = THREE.MathUtils.clamp(k, 0, 1); },
    setFeed(k) { this.state.feed = THREE.MathUtils.clamp(k, 0, 1); },
    setRunning(v) { this.state.running = THREE.MathUtils.clamp(v, 0, 1); },
    /** 只写目标值；真正的出现节奏在 applyAnnotations 里逐帧算（错峰 + 滑入）。 */
    setAnnotations(v) {
      this.state.anno = THREE.MathUtils.clamp(v, 0, 1);
    },
    /** C 类标注的出现节奏（学 Anime.js 的 timeline / stagger）：
        端点先亮 → 引线跟上 → 标签最后从外侧滑入。四个部件依次错开，
        读起来像一张工程图被逐条画出来，而不是一次性亮起。 */
    applyAnnotations() {
      const k = this.state.anno;
      annotations.forEach(({ line, dot, plate, lineMat, dotMat, plateRest }, i) => {
        const staged = THREE.MathUtils.clamp((k - i * 0.1) / 0.7, 0, 1);
        const dotK = THREE.MathUtils.clamp(staged / 0.4, 0, 1);
        const lineK = THREE.MathUtils.clamp((staged - 0.2) / 0.5, 0, 1);
        const plateK = THREE.MathUtils.clamp((staged - 0.45) / 0.55, 0, 1);
        dotMat.opacity = dotK;
        lineMat.opacity = lineK * 0.85;
        plate.material.opacity = plateK;
        const visible = staged > 0.005;
        line.visible = dot.visible = plate.visible = visible;
        if (!visible) return;
        // 标签从外侧滑入到位
        plate.position.set(
          plateRest.x + (1 - plateK) * 0.3,
          plateRest.y + (1 - plateK) * 0.12,
          plateRest.z,
        );
        // 引线随标签一起收拢（用两端点的中点做轻微位移，成本远低于重算几何）
        line.position.set((1 - lineK) * 0.08, (1 - lineK) * 0.04, 0);
      });
    },
    reset() {
      latheRest.forEach((position, part) => part.position.copy(position));
      this.state.explode = 0;
      this.state.feed = 0;
      this.state.running = 0;
      this.setAnnotations(0);
    },
  };

  /* ---------------- 工人 ---------------- */
  const workerSpecs = [
    { id: 'sy_w1', position: [-12.6, 0, -105.2], rotationY: 1.35, pose: 'operate' },
    { id: 'sy_w2', position: [8.0, 0, -61.4], rotationY: -1.2, pose: 'operate' },
    { id: 'sy_w3', position: [2.6, 0, -79], rotationY: 2.6, pose: 'carry' },
    { id: 'sy_w4', position: [-11.4, 0, -121.5], rotationY: 1.4, pose: 'operate' },
    { id: 'sy_w5', position: [5.6, 0, -133.5], rotationY: -2.4, pose: 'push' },
    { id: 'sy_w6', position: [-7.9, 0, -158.9], rotationY: 0.5, pose: 'bench', cloth: 'cloth' },
    { id: 'sy_w7', position: [7.8, 0, -152], rotationY: -2.7, pose: 'carry', cloth: 'clothAlt' },
    { id: 'sy_w8', position: [-2.2, 0, -88.6], rotationY: 0.9, pose: 'bench', cloth: 'clothAlt' },
  ];
  workerSpecs.forEach((spec) => {
    parts.workers.push(createWorker(b, spec));
  });

  /* ---------------- 工作台（全片唯一的生活化小场景） ---------------- */
  const bench = new THREE.Group();
  bench.name = 'sy_bench';
  bench.position.set(-6.5, 0, -158);
  bench.rotation.y = -0.22;
  b.group.add(bench);
  b.box('bench_top', [2.5, 0.1, 1.2], [0, 0.88, 0], 'rustDark');
  b.box('bench_leg_a', [0.12, 0.86, 0.12], [-1.1, 0.43, -0.45], 'steelDark');
  b.box('bench_leg_b', [0.12, 0.86, 0.12], [1.1, 0.43, -0.45], 'steelDark');
  b.box('bench_leg_c', [0.12, 0.86, 0.12], [-1.1, 0.43, 0.45], 'steelDark');
  b.box('bench_leg_d', [0.12, 0.86, 0.12], [1.1, 0.43, 0.45], 'steelDark');
  b.box('bench_shelf', [2.3, 0.08, 1.0], [0, 0.36, 0], 'rustDark');

  // 图纸：点击后展开、轻微放大，查看机械工程图。
  const drawingGeo = new THREE.PlaneGeometry(0.9, 0.62);
  b.geometries.add(drawingGeo);
  const drawingCanvas = document.createElement('canvas');
  drawingCanvas.width = 640;
  drawingCanvas.height = 440;
  const dctx = drawingCanvas.getContext('2d');
  dctx.fillStyle = '#cfc6b0';
  dctx.fillRect(0, 0, 640, 440);
  dctx.strokeStyle = 'rgba(40,44,48,.55)';
  dctx.lineWidth = 2;
  dctx.strokeRect(24, 24, 592, 392);
  dctx.strokeStyle = 'rgba(40,44,48,.35)';
  dctx.lineWidth = 1;
  for (let i = 1; i < 12; i += 1) {
    dctx.beginPath();
    dctx.moveTo(40, 40 + i * 30);
    dctx.lineTo(600, 40 + i * 30);
    dctx.stroke();
  }
  // 一张正视图级别的零件轮廓，够读成「机械工程图」即可。
  dctx.strokeStyle = '#2b3136';
  dctx.lineWidth = 3;
  dctx.beginPath();
  dctx.moveTo(150, 220);
  dctx.lineTo(150, 150);
  dctx.lineTo(330, 150);
  dctx.lineTo(330, 190);
  dctx.lineTo(270, 190);
  dctx.lineTo(270, 300);
  dctx.lineTo(150, 300);
  dctx.closePath();
  dctx.stroke();
  dctx.beginPath();
  dctx.arc(240, 225, 28, 0, Math.PI * 2);
  dctx.stroke();
  dctx.lineWidth = 1.5;
  dctx.beginPath();
  dctx.moveTo(150, 225);
  dctx.lineTo(120, 225);
  dctx.moveTo(330, 225);
  dctx.lineTo(360, 225);
  dctx.stroke();
  dctx.fillStyle = '#2b3136';
  dctx.font = '500 22px "PingFang SC", sans-serif';
  dctx.fillText('C620-1 主轴箱', 150, 96);
  dctx.font = '400 16px "PingFang SC", sans-serif';
  dctx.fillText('比例 1:10   1955', 150, 400);
  const drawingTex = new THREE.CanvasTexture(drawingCanvas);
  drawingTex.colorSpace = THREE.SRGBColorSpace;
  b.textures = b.textures ?? new Set();
  b.textures.add(drawingTex);
  const drawingMat = b.own(new THREE.MeshBasicMaterial({ map: drawingTex, transparent: true }));
  parts.drawing = new THREE.Mesh(drawingGeo, drawingMat);
  parts.drawing.name = 'bench_drawing';
  parts.drawing.position.set(-0.35, 0.94, 0.06);
  parts.drawing.rotation.x = -Math.PI / 2;
  bench.add(parts.drawing);

  parts.caliper = new THREE.Group();
  parts.caliper.name = 'bench_caliper';
  parts.caliper.position.set(0.72, 0.94, 0.02);
  bench.add(parts.caliper);
  const caliperBeam = b.box('bench_caliper_beam', [0.46, 0.03, 0.03], [0, 0, 0], 'steel');
  const caliperJawA = b.box('bench_caliper_jaw_a', [0.03, 0.09, 0.04], [-0.2, -0.04, 0], 'steel');
  const caliperJawB = b.box('bench_caliper_jaw_b', [0.03, 0.09, 0.04], [0.16, -0.04, 0], 'steel');
  parts.caliper.add(caliperBeam, caliperJawA, caliperJawB);

  b.cyl('bench_cup', { rTop: 0.06, rBottom: 0.05, height: 0.13 }, [0.18, 1.0, -0.3], 'enamel');
  b.cyl('bench_thermos', { rTop: 0.075, rBottom: 0.085, height: 0.32 }, [-0.95, 1.09, -0.28], 'machineGreen');
  b.cyl('bench_lamp_post', { rTop: 0.02, rBottom: 0.02, height: 0.5 }, [1.05, 1.18, -0.35], 'steelDark');
  b.cone('bench_lamp_shade', { r: 0.14, height: 0.16, seg: 12, open: true }, [1.05, 1.4, -0.35], 'machineGreen', [Math.PI, 0, 0]);
  const benchLampLight = new THREE.PointLight(0xffd8a4, 1.6, 4.5, 2.0);
  benchLampLight.position.set(1.05, 1.32, -0.35);
  bench.add(benchLampLight);
  parts.benchLampLight = benchLampLight;
  parts.bench = {
    root: bench,
    drawing: parts.drawing,
    caliper: parts.caliper,
    pickTargets: [parts.drawing, caliperBeam, caliperJawA, caliperJawB],
    state: { drawing: 0, caliper: 0 },
    setDrawing(k) { this.state.drawing = THREE.MathUtils.clamp(k, 0, 1); },
    setCaliper(k) { this.state.caliper = THREE.MathUtils.clamp(k, 0, 1); },
    reset() { this.state.drawing = 0; this.state.caliper = 0; },
  };

  /* ---------------- A 类文字：空间内展陈文字 ---------------- */
  createWallText(b, {
    name: 'sy_text_title',
    text: '沈阳 · 机器',
    sub: '1950s · 铁西',
    position: [X0 + 0.45, 4.4, -72],
    rotation: [0, Math.PI / 2, 0],
    width: 10,
    height: 3.6,
    fontSize: 190,
    subSize: 70,
    tracking: 12,
  });
  createWallText(b, {
    name: 'sy_text_body',
    text: '机器制造，曾经定义了这座城市的节奏。',
    position: [X0 + 0.45, 4.2, -118],
    rotation: [0, Math.PI / 2, 0],
    width: 15,
    height: 2.6,
    fontSize: 96,
    color: 'rgba(239,231,216,.78)',
    tracking: 4,
  });
  createWallText(b, {
    name: 'sy_text_exit',
    text: '1950s · 铁西',
    position: [X1 - 0.45, 4.6, -148],
    rotation: [0, -Math.PI / 2, 0],
    width: 8,
    height: 2.2,
    fontSize: 120,
    sub: null,
    tracking: 10,
    opacity: 0.7,
  });
  createNameplate(b, {
    name: 'sy_plate_cupola',
    title: '冲天炉',
    lines: ['熔铁 · 5t/h'],
    position: [9.5, 3.6, -62.4],
    width: 1.3,
    height: 0.7,
  });

  // 沿途展陈文字：手册要求 A 类占全部文字的 70~80%，且随相机前进自然进出画面。
  createWallText(b, {
    name: 'sy_text_gate_in', text: '第一车间',
    position: [0, 7.0, -29.6], rotation: [0, 0, 0],
    width: 7.6, height: 1.3, fontSize: 150, tracking: 24, opacity: 0.8,
  });
  createWallText(b, {
    name: 'sy_text_slogan_a', text: '安全第一 · 质量第一',
    position: [X0 + 0.45, 3.6, -48], rotation: [0, Math.PI / 2, 0],
    width: 9.4, height: 2.2, fontSize: 118, tracking: 10, opacity: 0.72,
  });
  createWallText(b, {
    name: 'sy_text_year', text: '1958',
    position: [X1 - 0.45, 3.8, -56], rotation: [0, -Math.PI / 2, 0],  // 让开 z=-64 的冲天炉
    width: 4.2, height: 2.4, fontSize: 210, tracking: 6, opacity: 0.62,
  });
  createNameplate(b, {
    name: 'sy_plate_qc', title: '每班三检',
    lines: ['交接清楚', '记录齐全'],
    position: [X0 + 0.45, 2.5, -94], rotation: [0, Math.PI / 2, 0],
    width: 1.6, height: 0.92,
  });
  createWallText(b, {
    name: 'sy_text_slogan_b', text: '增产节约',
    position: [X1 - 0.45, 4.0, -112], rotation: [0, -Math.PI / 2, 0],
    width: 7.0, height: 2.4, fontSize: 170, tracking: 16, opacity: 0.7,
  });
  createWallText(b, {
    name: 'sy_text_slogan_c', text: '质量就是生命',
    position: [X0 + 0.45, 4.0, -138], rotation: [0, Math.PI / 2, 0],
    width: 8.4, height: 2.2, fontSize: 132, tracking: 12, opacity: 0.68,
  });
  createNameplate(b, {
    name: 'sy_plate_gear', title: '注意安全',
    lines: ['转动部位 禁止靠近'],
    position: [X1 - 0.45, 2.7, -78], rotation: [0, -Math.PI / 2, 0],
    width: 1.5, height: 0.86,
  });
  createWallText(b, {
    name: 'sy_text_slogan_d', text: '革新 · 挖潜',
    position: [X0 + 0.45, 3.7, -124], rotation: [0, Math.PI / 2, 0],
    width: 7.6, height: 2.2, fontSize: 146, tracking: 14, opacity: 0.68,
  });
  createWallText(b, {
    name: 'sy_text_gate_out', text: '出厂',
    position: [0, 7.0, -177.4], rotation: [0, 0, 0],
    width: 5.0, height: 1.3, fontSize: 150, tracking: 26, opacity: 0.78,
  });
  createNameplate(b, {
    name: 'sy_plate_bench_wall', title: '安全生产',
    lines: ['人走机停'],
    position: [-8.6, 2.3, -160.5], rotation: [0, 0.42, 0],
    width: 1.5, height: 0.85,
  });
  /* ---------------- 持续的小运动 ----------------
     手册 §36（学 ERA Residence）：普通行进过程中也要有「环境小运动、光影变化」，
     否则相机一停，画面就死了。尘埃是这里最便宜、也最有效的一种。 */
  parts.hallDust = b.points('sy_dust', 240, { color: 0xd8cfba, size: 0.045, opacity: 0.42 });
  parts.hallDustSeed = Array.from({ length: 240 }, () => ({
    x: -9 + Math.random() * 18,
    y: 0.6 + Math.random() * 8.4,
    z: -32 - Math.random() * 144,
    vx: (Math.random() - 0.5) * 0.16,
    vy: 0.04 + Math.random() * 0.14,
  }));

  /* ---------------- 章节灯光 ---------------- */
  // 厂房纵深 148m：一盏灯照不到头 —— decay 会让 20m 外的光几乎归零，
  // 相机走到中段就掉进黑里。沿 Z 布三盏，让整条动线都留在光里，
  // 这才是「深、暗、但看得清」的前提。
  parts.hallLights = [-46, -88, -132].map((z) => {
    const light = new THREE.PointLight(0xd6e3ee, 2.3, 54, 1.25);
    light.position.set(0, 7.6, z);
    b.group.add(light);
    return light;
  });

  /* ---------------- 章节运动（scroll-linked，可反向） ---------------- */
  /* 天吊行程：由 progress 全域确定。区间之外不是「保留上次值」，而是回到起点 ——
     否则反向滚动与跳转读到的会是历史残留。 */
  function craneZAt(progress) {
    if (progress <= 0.115 || progress >= 0.44) return -62;
    return THREE.MathUtils.lerp(-62, -132, THREE.MathUtils.clamp((progress - 0.115) / 0.3, 0, 1));
  }

  const state = {
    craneZ: -68,
    hookSwing: 0,
    ladleTilt: 0,
    gateEntry: 0,
    gateExit: 0,
    benchDrawing: 0,
    benchCaliper: 0,
    latheNotice: 0,
    cupola: 0,
  };

  function update(frame, ctx) {
    const { shot, localT, progress } = frame;
    const time = ctx?.time ?? 0;
    const dt = ctx?.dt ?? 0;
    const id = shot.id;

    // 大门：OP-09 第一次打开；SY-08 穿过出口。
    const entryTarget = id === 'OP_09_DOOR'
      ? THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((localT - 0.42) / 0.44, 0, 1), 0, 1)
      : (progress > 0.09 ? 1 : 0);
    state.gateEntry = damp(state.gateEntry, entryTarget, 8, dt);
    parts.entryGate.left.position.x = THREE.MathUtils.lerp(
      parts.entryGate.left.userData.closedX, parts.entryGate.left.userData.openX, state.gateEntry,
    );
    parts.entryGate.right.position.x = THREE.MathUtils.lerp(
      parts.entryGate.right.userData.closedX, parts.entryGate.right.userData.openX, state.gateEntry,
    );

    const exitTarget = id === 'SY_08_EXIT'
      ? THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((localT - 0.34) / 0.4, 0, 1), 0, 1)
      : (progress > 0.42 ? 1 : 0);
    state.gateExit = damp(state.gateExit, exitTarget, 8, dt);
    parts.exitGate.left.position.x = THREE.MathUtils.lerp(
      parts.exitGate.left.userData.closedX, parts.exitGate.left.userData.openX, state.gateExit,
    );
    parts.exitGate.right.position.x = THREE.MathUtils.lerp(
      parts.exitGate.right.userData.closedX, parts.exitGate.right.userData.openX, state.gateExit,
    );
    // 门开了，里面就不该再是死黑（OP-09 需要看见深、暗但有内容的车间）。
    const darkness = b.group.getObjectByName('sy_darkness');
    if (darkness) darkness.visible = state.gateEntry < 0.35;

    /* 天吊：SY-02 起沿轨道横移，吊钩摆动。用户向前走的过程中世界一直有事情发生。 */
    // 状态只存「进度驱动的主值」，持续晃动只叠加在渲染上。
    // 混在一起会让读数取决于「什么时候看」，反向滚动就无法证明一致性。
    const craneActive = progress > 0.115 && progress < 0.44;
    state.craneZ = craneZAt(progress);
    if (craneActive) {
      state.hookSwing += dt * (0.8 + Math.sin(time * 0.4) * 0.3);
      parts.crane.position.z = state.craneZ + Math.sin(time * 0.35) * 1.4;
      parts.craneHook.rotation.z = Math.sin(state.hookSwing) * 0.09;
      parts.craneHook.rotation.x = Math.cos(state.hookSwing * 0.7) * 0.05;
      // 浇包缓慢倾斜，铁水出现。
      state.ladleTilt = damp(state.ladleTilt, 0.16, 2.2, dt);
      parts.ladle.rotation.z = state.ladleTilt + Math.sin(time * 0.28) * 0.12;
      parts.ladleLight.intensity = 1.8 + Math.sin(time * 3.1) * 0.5;
      parts.hotMat.color.setHex(PALETTE.molten).multiplyScalar(0.85 + Math.sin(time * 2.6) * 0.15);
    } else {
      parts.crane.position.z = state.craneZ;
      parts.ladleLight.intensity = damp(parts.ladleLight.intensity, 0.2, 3, dt);
    }

    // 冲天炉出铁口：高温脉动。
    state.cupola += dt;
    const cupolaPulse = 1.1 + Math.sin(state.cupola * 2.4) * 0.6 + Math.sin(state.cupola * 7.1) * 0.2;
    parts.cupolaLight.intensity = cupolaPulse * 1.7;

    /* 尘埃：慢速上升 + 横向漂移，相机走多远它就陪多远。 */
    {
      const array = parts.hallDust.geometry.getAttribute('position');
      parts.hallDustSeed.forEach((seed, i) => {
        seed.y += seed.vy * dt;
        seed.x += seed.vx * dt;
        if (seed.y > 9.4) { seed.y = 0.6; seed.x = -9 + Math.random() * 18; }
        array.setXYZ(i, seed.x, seed.y, seed.z);
      });
      array.needsUpdate = true;
    }

    /* 吊钩：不在天吊行程里的时候也不再是「死」的，只留极轻的一点摆动。 */
    if (!craneActive) {
      parts.craneHook.rotation.z = Math.sin(time * 0.5) * 0.018;
    }

    /* 工人小幅动作：他们在工作，不是站着。 */
    parts.workers.forEach((worker, index) => {
      const phase = index * 1.7;
      const swing = Math.sin(time * 1.5 + phase) * 0.075;
      worker.armL.rotation.x += (swing - (worker.lastSwing ?? 0)) * 0.5;
      worker.armR.rotation.x += (-swing - (worker.lastSwing ?? 0)) * 0.5;
      worker.lastSwing = swing * 0.5;
    });

    /* C620-1 Notice：靠近时工作灯稍亮，主轴轻微转动，各件轻微错位再合拢。 */
    const lathe = parts.lathe;
    const nearLathe = id === 'SY_04_REVEAL' || id === 'SY_05_NOTICE' || id === 'SY_06_WALK';
    if (id === 'SY_04_REVEAL') {
      const reveal = THREE.MathUtils.smoothstep(localT, 0.2, 1);
      parts.latheLampLight.intensity = reveal * 1.5;
      lathe.lampMat.color.setHex(0x2c3033).lerp(new THREE.Color(0xffe2b0), reveal * 0.8);
      lathe.state.spin += dt * 0.6 * reveal;
      lathe.spindle.rotation.y = lathe.state.spin;
      lathe.chuck.rotation.y = lathe.state.spin;
    } else if (id === 'SY_05_NOTICE') {
      // 0.6~0.8 秒的 Notice：主轴箱 ←、刀架 ↑、尾座 →、再合拢。
      const cycle = THREE.MathUtils.clamp((localT - 0.1) / 0.5, 0, 1);
      const wave = Math.sin(cycle * Math.PI);
      lathe.head.position.x = lathe.rest.get(lathe.head).x - wave * 0.16;
      lathe.carriage.position.y = lathe.rest.get(lathe.carriage).y + wave * 0.12;
      lathe.tail.position.x = lathe.rest.get(lathe.tail).x + wave * 0.18;
      parts.latheLampLight.intensity = 2.2 + wave * 1.6;
      lathe.lampMat.color.setHex(0xffe2b0);
      lathe.state.spin += dt * (0.8 + wave * 4.2);
      lathe.spindle.rotation.y = lathe.state.spin;
      lathe.chuck.rotation.y = lathe.state.spin;
    } else if (nearLathe || id === 'SY_03_WALLTEXT') {
      parts.latheLampLight.intensity = damp(parts.latheLampLight.intensity, 0.9, 3, dt);
      lathe.lampMat.color.setHex(0x3a3f44);
    } else {
      parts.latheLampLight.intensity = damp(parts.latheLampLight.intensity, 0, 4, dt);
    }

    lathe.applyAnnotations();

    /* 拆解 / 进给 / 车削：由 Scroll 或 Explore 控制台写入 state，这里只负责落到变换上。 */
    const ex = lathe.state.explode;
    lathe.head.position.x = THREE.MathUtils.lerp(
      lathe.rest.get(lathe.head).x, lathe.rest.get(lathe.head).x - 0.95, ex,
    );
    lathe.carriage.position.y = THREE.MathUtils.lerp(
      lathe.rest.get(lathe.carriage).y, lathe.rest.get(lathe.carriage).y + 1.15, ex,
    );
    lathe.tail.position.x = THREE.MathUtils.lerp(
      lathe.rest.get(lathe.tail).x, lathe.rest.get(lathe.tail).x + 1.05, ex,
    );

    const running = lathe.state.running;
    if (running > 0.01) {
      lathe.state.spin += dt * 13 * running;
      lathe.spindle.rotation.y = lathe.state.spin;
      lathe.chuck.rotation.y = lathe.state.spin;
      lathe.workpiece.rotation.y = lathe.state.spin;
      parts.latheLampLight.intensity = 3.4 * running + 0.4;
      lathe.lampMat.color.setHex(0xffe2b0);
    }

    // 手轮 → 刀架移动 → 车刀靠近工件 → 切屑
    const feed = lathe.state.feed;
    lathe.handwheel.rotation.y = feed * Math.PI * 3.2;
    lathe.carriage.position.x = THREE.MathUtils.lerp(
      lathe.rest.get(lathe.carriage).x, lathe.rest.get(lathe.carriage).x + 0.62, feed,
    );
    const contact = THREE.MathUtils.clamp((feed - 0.42) / 0.2, 0, 1);
    lathe.state.cutting = contact;
    // 不做复杂材料仿真：切屑与一束高光就足以读出「车刀正在吃进金属」。
    const chipArray = parts.chips.geometry.getAttribute('position');
    if (contact > 0.02 && running > 0.3) {
      chipMat.opacity = contact;
      for (let i = 0; i < chipArray.count; i += 1) {
        const t = (time * 3.4 + i * 0.37) % 1;
        chipArray.setXYZ(
          i,
          0.2 + Math.sin(i * 2.1) * 0.12 + t * 0.5,
          1.78 + Math.cos(i * 1.3) * 0.1 + t * 0.55,
          Math.sin(i * 3.7) * 0.14 - t * 0.25,
        );
      }
      chipArray.needsUpdate = true;
    } else {
      chipMat.opacity = damp(chipMat.opacity, 0, 8, dt);
    }

    /* 工作台：图纸展开 / 卡尺抬起。由 Explore 控制台写入 state。 */
    const drawK = parts.bench.state.drawing;
    parts.drawing.scale.setScalar(THREE.MathUtils.lerp(1, 1.9, drawK));
    parts.drawing.position.set(
      THREE.MathUtils.lerp(-0.35, -0.1, drawK),
      THREE.MathUtils.lerp(0.94, 1.12, drawK),
      THREE.MathUtils.lerp(0.06, 0.34, drawK),
    );
    parts.drawing.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, -0.62, drawK);

    const calK = parts.bench.state.caliper;
    parts.caliper.position.y = THREE.MathUtils.lerp(0.94, 1.22, calK);
    parts.caliper.rotation.z = THREE.MathUtils.lerp(0, 0.42, calK);
    parts.caliper.rotation.x = THREE.MathUtils.lerp(0, -0.3, calK);

    /* 灯光跟随：沈阳整体偏冷，铁水与工作灯给暖。 */
    parts.hallLights.forEach((light) => { light.intensity = 2.3; });
    if (reducedMotion) {
      parts.craneHook.rotation.z = 0;
      parts.craneHook.rotation.x = 0;
    }
  }

  function probe() {
    return {
      gateEntry: state.gateEntry,
      gateExit: state.gateExit,
      craneZ: state.craneZ,
      ladleTilt: state.ladleTilt,
      lathe: { explode: parts.lathe.state.explode, running: parts.lathe.state.running,
               feed: parts.lathe.state.feed, spin: parts.lathe.state.spin },
      bench: { drawing: parts.bench.state.drawing, caliper: parts.bench.state.caliper },
    };
  }

  return { builder: b, group: b.group, parts, id: 'shenyang', update, probe };
}
