/* ============================================================
   buildAnshanSet.js — 鞍山 · 钢铁

   不是参观高炉，而是亲自经历一块铁矿石怎样进入工业生产系统：
       铁矿石 → 高炉炼铁 → 铁水 → 炼钢 → 钢坯 → 轧制 → 钢材
   不要「铁矿石 → 高炉 → 直接成为汽车」。

   坐标：Z ∈ [-540, -800]。高炉 Hero 位于 (-30, 0, -640)，总高约 26m。
   蒙太奇区 Z ∈ [-660, -706]，工业卡车在 (-8, 0, -700) 成形。
   ============================================================ */

import * as THREE from 'three';
import { WorldBuilder, createWorker, PALETTE } from '../primitives.js';
import { SHOT_RANGES } from '../../storyboard.js';
import { createWallText, createNameplate, createCallout } from '../textPlates.js';

const lerp = THREE.MathUtils.lerp;
const smooth = THREE.MathUtils.smoothstep;

/* 蒙太奇道具的位置写成 progress 的纯函数。
   如果只在「当前镜头等于 AS_07C」时才赋值，跳转定位、反向滚动、Debug setShot
   都会读到上一次路过时的残留值 —— 状态就不再是 progress 的纯函数了。 */
function rangeOf(shotId) {
  return SHOT_RANGES.find((range) => range.id === shotId) ?? null;
}
const BILLET_RANGE = rangeOf('AS_07C_BILLET');
const PLATE_RANGE = rangeOf('AS_07E_PLATE');

function localIn(range, progress) {
  if (!range) return -1;
  const span = range.end - range.start;
  if (span <= 0) return -1;
  return (progress - range.start) / span;
}

function billetXAt(progress) {
  const local = localIn(BILLET_RANGE, progress);
  if (local <= 0) return -12;
  if (local >= 1) return -4;
  return lerp(-12, -4, smooth(THREE.MathUtils.clamp((local - 0.08) / 0.8, 0, 1), 0, 1));
}

function billetZAt(progress) {
  const local = localIn(BILLET_RANGE, progress);
  if (local <= 0) return -684;
  if (local >= 1) return -688;
  return lerp(-684, -688, local);
}

const TRUCK_RANGE = SHOT_RANGES.find((range) => range.id === 'AS_08_TRUCK') ?? null;
const ROAD_START_APPROX = SHOT_RANGES.find((range) => range.id === 'RD_01_DEPART')?.start ?? 0.694;

/** 钢板 → 车辆 的成形度：全域确定，区间外分别是「还没成形」与「已成形」。 */
function truckFormAt(progress) {
  if (!TRUCK_RANGE) return 0;
  const span = Math.max(TRUCK_RANGE.end - TRUCK_RANGE.start, 1e-6);
  const local = (progress - TRUCK_RANGE.start) / span;
  if (local <= 0) return 0;
  if (local >= 1) return 1;
  return smooth(THREE.MathUtils.clamp((local - 0.05) / 0.7, 0, 1), 0, 1);
}

function plateZAt(progress) {
  const local = localIn(PLATE_RANGE, progress);
  if (local <= 0) return -706;
  if (local >= 1) return -702.05;
  return lerp(-706, -702.05, smooth(THREE.MathUtils.clamp(local / 0.85, 0, 1), 0, 1));
}
// 定位式调用（dt=0：Debug setShot / Explore 返回）必须一步到位——
// damp 在 dt=0 时是恒等映射，会让门、炉温这类状态停在初始值。
const damp = (current, target, lambda, dt) => (
  dt > 0 ? THREE.MathUtils.damp(current, target, lambda, dt) : target
);

export function buildAnshanSet({ reducedMotion = false } = {}) {
  const b = new WorldBuilder('set_anshan');
  const parts = { workers: [] };

  const FX = -30;   // 高炉中心 X
  const FZ = -640;  // 高炉中心 Z

  /* ---------------- 地面与厂区铁路 ---------------- */
  const Z0 = -540;
  const Z1 = -800;
  b.box('as_ground', [140, 0.2, Z0 - Z1], [-20, -0.12, (Z0 + Z1) / 2], 'coal');
  b.box('as_rail_l', [0.14, 0.16, 240], [-0.72, 0.06, -660], 'steel');
  b.box('as_rail_r', [0.14, 0.16, 240], [0.72, 0.06, -660], 'steel');

  /* ---------------- 高炉 Hero（S 级，按工艺需要拆件） ---------------- */
  const furnace = new THREE.Group();
  furnace.name = 'hero_furnace';
  furnace.position.set(FX, 0, FZ);
  b.group.add(furnace);

  // furnace_body：炉底 → 炉腹 → 炉身 → 炉喉（用 lathe 一次成型，剖面即工艺剖面）
  const bodyProfile = [
    [0.0, 0], [5.6, 0], [5.8, 1.6], [5.3, 3.4],
    [4.9, 6.6], [4.6, 9.6], [4.35, 13.0], [4.1, 16.4],
    [3.6, 19.2], [3.4, 21.0],
  ];
  parts.furnaceBody = b.lathe('furnace_body', bodyProfile, [0, 0, 0], 'rustDark', 40);
  furnace.add(parts.furnaceBody);

  // furnace_top：炉顶锥 + 装料钟 + 上升管
  const top = new THREE.Group();
  top.name = 'furnace_top';
  top.position.set(0, 21, 0);
  furnace.add(top);
  b.cone('furnace_top_cone', { r: 3.4, height: 2.6, seg: 24 }, [0, 1.3, 0], 'rust');
  b.cyl('furnace_top_collar', { rTop: 1.9, rBottom: 1.9, height: 0.5 }, [0, 2.7, 0], 'steelDark');
  parts.chargeBell = b.cone('furnace_charge_bell', { r: 1.7, height: 1.1, seg: 20 }, [0, 3.4, 0], 'steel');
  top.add(parts.chargeBell);
  b.cyl('furnace_uptake_a', { rTop: 0.7, rBottom: 0.7, height: 5.4 }, [1.6, 4.2, 0], 'steelDark', [0, 0, 0.34]);
  b.cyl('furnace_uptake_b', { rTop: 0.7, rBottom: 0.7, height: 5.4 }, [-1.6, 4.2, 0], 'steelDark', [0, 0, -0.34]);

  // major_pipes：热风围管与风口支管
  const bustleGeo = new THREE.TorusGeometry(5.9, 0.42, 8, 28);
  b.geometries.add(bustleGeo);
  const bustle = new THREE.Mesh(bustleGeo, b.mat('rust'));
  bustle.name = 'furnace_bustle';
  bustle.rotation.x = Math.PI / 2;
  bustle.position.y = 4.2;
  furnace.add(bustle);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    b.cyl(`furnace_tuyere_${i}`, { rTop: 0.22, rBottom: 0.22, height: 1.6 },
      [Math.cos(a) * 5.2, 3.4, Math.sin(a) * 5.2], 'steelDark', [0, -a, Math.PI / 2]);
    furnace.add(b.group.children[b.group.children.length - 1]);
  }
  b.cyl('furnace_hot_blast', { rTop: 0.55, rBottom: 0.55, height: 14 }, [7.5, 7, 0], 'steelDark');

  // platform：环形平台 + 栏杆（模块化重复）
  [8.2, 15.4, 20.4].forEach((y, index) => {
    const ringGeo = new THREE.TorusGeometry(6.6 + index * 0.4, 0.22, 6, 30);
    b.geometries.add(ringGeo);
    const ring = new THREE.Mesh(ringGeo, b.mat('steel'));
    ring.name = `furnace_platform_${index}`;
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    furnace.add(ring);
    const railTransforms = [];
    for (let i = 0; i < 24; i += 1) {
      const a = (i / 24) * Math.PI * 2;
      railTransforms.push({ x: Math.cos(a) * (6.6 + index * 0.4), y: y + 0.6, z: Math.sin(a) * (6.6 + index * 0.4) });
    }
    b.instances(`furnace_rail_${index}`,
      () => new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), railTransforms, 'steel');
    const rail = b.group.getObjectByName(`furnace_rail_${index}`);
    if (rail) furnace.add(rail);
  });

  // 楼梯：斜梯段
  for (let i = 0; i < 5; i += 1) {
    b.box(`furnace_stair_${i}`, [1.6, 0.14, 3.4], [8.6, 1.6 + i * 3.2, -1.4 + i * 0.5], 'steel', 0);
  }

  // shell_cutaway + inner_core：炉内视角用的内壁。相机在炉膛中心，所以内壁要 BackSide。
  const coreGeo = new THREE.CylinderGeometry(4.3, 4.9, 20, 40, 1, true);
  b.geometries.add(coreGeo);
  parts.coreMat = b.own(new THREE.MeshStandardMaterial({
    color: 0x2a1510,
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.BackSide,
    emissive: new THREE.Color(0xff5a18),
    emissiveIntensity: 0.15,
  }));
  parts.innerCore = new THREE.Mesh(coreGeo, parts.coreMat);
  parts.innerCore.name = 'furnace_inner_core';
  parts.innerCore.position.set(0, 10.5, 0);
  furnace.add(parts.innerCore);

  // 炉缸铁水层：出铁前它就在炉底，出铁时它是 Camera 冲出去的起点
  const hearthGeo = new THREE.CylinderGeometry(4.4, 4.4, 1.6, 32);
  b.geometries.add(hearthGeo);
  parts.hearthMat = b.own(new THREE.MeshBasicMaterial({ color: PALETTE.molten }));
  parts.hearth = new THREE.Mesh(hearthGeo, parts.hearthMat);
  parts.hearth.name = 'furnace_hearth';
  parts.hearth.position.set(0, 1.0, 0);
  furnace.add(parts.hearth);

  // 炉衬冷却壁：炉内唯一的空间节奏。Camera 下降时一圈圈经过它们，
  // 「巨大纵深」靠这个读出来，否则炉膛只是一片橙色。
  for (let i = 0; i < 8; i += 1) {
    const ringGeo = new THREE.TorusGeometry(4.55, 0.28, 6, 32);
    b.geometries.add(ringGeo);
    const ring = new THREE.Mesh(ringGeo, b.mat(i % 2 ? 'rustDark' : 'steelDark'));
    ring.name = `furnace_lining_ring_${i}`;
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 2.4 + i * 2.4, 0);
    furnace.add(ring);
  }

  // tap_hole：出铁口，朝 +X（Camera 从这里冲出去）
  parts.tapHole = b.box('furnace_tap_hole', [1.2, 1.0, 1.2], [5.5, 2.0, 0], 'accent');
  furnace.add(parts.tapHole);
  parts.tapLight = new THREE.PointLight(PALETTE.hotIron, 0, 26, 2.0);
  parts.tapLight.position.set(6.4, 2.0, 0);
  furnace.add(parts.tapLight);

  // 铁水沟 + 铁水流（出铁时生长）
  b.box('as_runner', [11, 0.5, 1.6], [-19.5, 1.4, -2.0], 'rustDark', 0.06);
  const flowGeo = new THREE.BoxGeometry(11, 0.16, 1.0);
  b.geometries.add(flowGeo);
  parts.flowMat = b.own(new THREE.MeshBasicMaterial({
    color: PALETTE.hotIron, transparent: true, opacity: 0,
  }));
  parts.ironFlow = new THREE.Mesh(flowGeo, parts.flowMat);
  parts.ironFlow.name = 'as_iron_flow';
  parts.ironFlow.position.set(-19.5, 1.72, -2.0);
  parts.ironFlow.rotation.y = 0.06;
  b.group.add(parts.ironFlow);

  createNameplate(b, {
    name: 'furnace_plate', title: '高炉',
    lines: ['炼铁 · 1950s', '容积 900 m³'],
    position: [FX + 7.0, 4.2, FZ + 3.2],
    rotation: [0, -0.5, 0], width: 1.8, height: 1.0,
  });

  /* ---------------- 炉内粒子：物料下降 vs 热气上升 ---------------- */
  parts.burden = b.points('as_burden', 90, { color: 0x8a7563, size: 0.26, opacity: 0.85 });
  parts.burdenSeed = Array.from({ length: 90 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: 0.6 + Math.random() * 3.2,
    y: Math.random() * 20,
    speed: 2.4 + Math.random() * 3.4,
    size: 0.6 + Math.random() * 0.8,
  }));
  parts.updraft = b.points('as_updraft', 80, { color: 0xff9a4a, size: 0.24, opacity: 0.5 });
  parts.updraftSeed = Array.from({ length: 80 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: 0.8 + Math.random() * 3.0,
    y: Math.random() * 20,
    speed: 3.6 + Math.random() * 4.2,
  }));

  /* ---------------- 厂区：钢结构、管线、远景高炉群 ---------------- */
  const gantryTransforms = [];
  for (let z = -560; z > -780; z -= 22) gantryTransforms.push({ x: -14, y: 6, z });
  b.instances('as_gantry', () => new THREE.BoxGeometry(0.6, 12, 0.6), gantryTransforms, 'steelDark');
  b.box('as_gantry_top', [0.8, 0.6, 230], [-14, 12, -670], 'steelDark');
  b.cyl('as_pipe_main', { rTop: 0.8, rBottom: 0.8, height: 230 }, [-14, 11, -670], 'rust', [Math.PI / 2, 0, 0]);
  b.cyl('as_pipe_b', { rTop: 0.5, rBottom: 0.5, height: 230 }, [-12.4, 9.6, -670], 'rustDark', [Math.PI / 2, 0, 0]);

  // 远景高炉群：只确认「这是巨型炼铁系统」
  [[-74, -664, 0.82], [-52, -714, 0.72]].forEach(([x, z, s], index) => {
    const g = new THREE.Group();
    g.name = `as_furnace_far_${index}`;
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    const body = b.lathe(`as_far_body_${index}`, bodyProfile, [0, 0, 0], 'rustDark', 20);
    const cap = b.cone(`as_far_top_${index}`, { r: 3.4, height: 2.6, seg: 16 }, [0, 22.3, 0], 'rust');
    g.add(body, cap);
    b.group.add(g);
  });

  // 上料斜桥：料车从这里爬到炉顶
  b.box('as_skip_bridge', [1.8, 0.4, 30], [-18, 13, -628], 'steel', 0);
  const skipBridge = b.group.getObjectByName('as_skip_bridge');
  if (skipBridge) {
    skipBridge.rotation.set(0.52, 0, 0);
    skipBridge.position.set(-16, 13, -628);
  }
  parts.skipCar = b.box('as_skip_car', [1.6, 1.2, 2.2], [-16, 6, -616], 'steelDark', 0);

  /* ---------------- 蒙太奇区（Z ∈ [-660, -706]） ---------------- */
  // CUT 1 铁水倾倒
  const pourLadle = new THREE.Group();
  pourLadle.name = 'as_pour_ladle';
  pourLadle.position.set(-10, 1.6, -666);
  b.group.add(pourLadle);
  b.cyl('as_pour_body', { rTop: 1.0, rBottom: 0.7, height: 1.4 }, [0, 0, 0], 'iron');
  pourLadle.add(b.group.children[b.group.children.length - 1]);
  const pourHotGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.06, 20);
  b.geometries.add(pourHotGeo);
  const pourHot = new THREE.Mesh(pourHotGeo, parts.hearthMat);
  pourHot.position.set(0, 0.72, 0);
  pourLadle.add(pourHot);
  b.box('as_pour_yoke', [2.6, 0.3, 0.3], [0, 1.1, 0], 'steelDark');
  pourLadle.add(b.group.children[b.group.children.length - 1]);
  pourLadle.children.forEach((child) => { child.castShadow = true; });
  parts.pourLadle = pourLadle;

  // CUT 2 火花
  parts.sparks = b.points('as_sparks', 140, { color: 0xffc266, size: 0.09, opacity: 0 });
  parts.sparkSeed = Array.from({ length: 140 }, () => ({
    x: (Math.random() - 0.5) * 5,
    y: Math.random() * 5,
    z: (Math.random() - 0.5) * 4,
    speed: 2.2 + Math.random() * 4.5,
  }));

  // CUT 3 钢坯推进
  const billetGeo = new THREE.BoxGeometry(7.5, 0.55, 0.9);
  b.geometries.add(billetGeo);
  parts.billetMat = b.own(new THREE.MeshStandardMaterial({
    color: 0x8a2f12, roughness: 0.6, metalness: 0.3,
    emissive: new THREE.Color(0xff5a18), emissiveIntensity: 0.9,
  }));
  parts.billet = new THREE.Mesh(billetGeo, parts.billetMat);
  parts.billet.name = 'as_billet';
  parts.billet.position.set(-12, 1.5, -684);
  b.group.add(parts.billet);
  b.box('as_billet_table', [16, 0.5, 2.4], [-8, 1.1, -686], 'steelDark');

  // CUT 4 轧辊
  const rollGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.6, 20);
  b.geometries.add(rollGeo);
  parts.rolls = [0, 1].map((i) => {
    const roll = new THREE.Mesh(rollGeo, b.mat('steel'));
    roll.name = `as_roll_${i}`;
    roll.position.set(-8.4, 1.7 + i * 1.9, -696);
    roll.rotation.z = Math.PI / 2;
    b.group.add(roll);
    return roll;
  });
  b.box('as_mill_frame', [3.4, 5.2, 1.2], [-9.6, 3.0, -696], 'steelDark');

  // CUT 5 红热钢板（冲向 Camera，最终填满画面）
  const plateGeo = new THREE.BoxGeometry(5.2, 2.6, 0.14);
  b.geometries.add(plateGeo);
  parts.plateMat = b.own(new THREE.MeshStandardMaterial({
    color: 0xb03c14, roughness: 0.55, metalness: 0.35,
    emissive: new THREE.Color(0xff6a20), emissiveIntensity: 1.1,
  }));
  parts.plate = new THREE.Mesh(plateGeo, parts.plateMat);
  parts.plate.name = 'as_steel_plate';
  parts.plate.position.set(-6, 2.0, -706);
  b.group.add(parts.plate);

  /* ---------------- 工人 ---------------- */
  parts.workers.push(
    createWorker(b, { id: 'as_w1', position: [-24, 0, -636], rotationY: -2.4, pose: 'operate', cloth: 'clothAlt' }),
    createWorker(b, { id: 'as_w2', position: [-19.5, 1.9, -638.6], rotationY: -1.6, pose: 'operate' }),
    createWorker(b, { id: 'as_w3', position: [-14.5, 0, -652], rotationY: 2.2, pose: 'carry' }),
    createWorker(b, { id: 'as_w4', position: [-35, 0, -628], rotationY: 0.8, pose: 'operate', cloth: 'clothAlt' }),
  );

  /* ---------------- A 类文字 ---------------- */
  createWallText(b, {
    name: 'as_text_chapter',
    text: '鞍山 · 钢铁',
    position: [-13.4, 8.6, -596],
    rotation: [0, 0.42, 0],
    width: 11, height: 3.6, fontSize: 190, tracking: 14,
  });
  createWallText(b, {
    name: 'as_text_process',
    text: '铁矿石 · 焦炭 · 熔剂',
    position: [-13.4, 5.2, -616],
    rotation: [0, 0.42, 0],
    width: 12, height: 2.2, fontSize: 92,
    color: 'rgba(239,231,216,.66)', tracking: 6,
  });

  // C 类：高炉内部的过程标注（只在炉内出现）
  const coreCallouts = [
    { label: '炉喉 · 装料', y: 19.5 },
    { label: '炉身 · 还原', y: 13.5 },
    { label: '炉腹 · 熔化', y: 7.0 },
    { label: '炉缸 · 铁水', y: 1.8 },
  ];
  parts.coreCallouts = coreCallouts.map(({ label, y }) => {
    const plate = createCallout(b, {
      name: `as_core_callout_${label}`, label,
      position: [3.0, y, 0], width: 1.9, height: 0.5,
    });
    furnace.add(plate);
    return plate;
  });

  // 厂区标识：让钢结构与平台也有自己的字
  createWallText(b, {
    name: 'as_text_plant', text: '炼铁厂',
    position: [-11.6, 9.9, -594], rotation: [0, 0.42, 0],  // 让开 z=-604 的立柱
    width: 6.4, height: 2.1, fontSize: 150, tracking: 18, opacity: 0.72,
  });
  createNameplate(b, {
    name: 'as_plate_platform', title: '严禁跨越',
    lines: ['高空作业区'],
    position: [-23.4, 9.0, -640], rotation: [0, -1.57, 0],
    width: 1.3, height: 0.72,
  });
  createWallText(b, {
    name: 'as_text_tap', text: '出铁 · 注意',
    position: [-20, 3.4, -644.5], rotation: [0, 0, 0],
    width: 3.4, height: 1.1, fontSize: 118, tracking: 8, opacity: 0.74,
  });
  /* ---------------- 持续的小运动：蒸汽 ----------------
     出铁口与炉顶各一股：高温车间从来没有静止过。 */
  parts.steam = b.points('as_steam', 130, { color: 0xc8ccd0, size: 0.9, opacity: 0.22 });
  parts.steamSeed = Array.from({ length: 130 }, () => {
    const fromTap = Math.random() < 0.55;
    return fromTap
      ? { ox: FX + 5.8 + Math.random() * 2.2, oz: FZ + (Math.random() - 0.5) * 3, oy: 2.2,
          vy: 0.9 + Math.random() * 1.3, drift: 1.2 + Math.random() }
      : { ox: FX + (Math.random() - 0.5) * 5, oz: FZ + (Math.random() - 0.5) * 5, oy: 24,
          vy: 0.7 + Math.random() * 1.1, drift: 0 };
  });
  parts.steamPhase = parts.steamSeed.map(() => Math.random());

  /* ---------------- 灯光 ---------------- */
  parts.plantKey = new THREE.PointLight(0xb9c6d0, 1.5, 90, 1.4);
  parts.plantKey.position.set(-8, 12, -600);
  b.group.add(parts.plantKey);
  parts.furnaceGlow = new THREE.PointLight(0xff6a24, 2.2, 60, 1.8);
  parts.furnaceGlow.position.set(FX, 3.2, FZ);
  b.group.add(parts.furnaceGlow);
  parts.torch = new THREE.PointLight(0xffb066, 0, 30, 1.8);
  parts.torch.position.set(-10, 2.6, -666);
  b.group.add(parts.torch);

  /* ---------------- 章节运动 ---------------- */
  const state = {
    charge: 0, bell: 0, burden: 0, flow: 0, pour: 0,
    billetX: -12, roll: 0, plateZ: -706, heat: 0,
  };

  function update(frame, ctx) {
    const { shot, localT, chapterLocalT, progress } = frame;
    const time = ctx?.time ?? 0;
    const dt = ctx?.dt ?? 0;
    const id = shot.id;

    // 炉体基础状态：越靠近出铁，内壁越亮。
    const heatTarget = id === 'AS_03_INNER' ? 0.35
      : id === 'AS_04_REDUCE' ? 0.62
        : id === 'AS_05_MELT' ? 0.95
          : id === 'AS_06_TAP' ? 1.0
            : id.startsWith('AS_07') ? 0.55 : 0.18;
    state.heat = damp(state.heat, heatTarget, 4, dt);
    parts.coreMat.emissiveIntensity = 0.12 + state.heat * 2.6;
    parts.coreMat.color.setHex(0x2a1510).lerp(new THREE.Color(0x6a2a12), state.heat);
    parts.furnaceGlow.intensity = 1.4 + state.heat * 7.5;
    parts.hearthMat.color.setHex(PALETTE.molten)
      .multiplyScalar(0.32 + Math.sin(time * 3.2) * 0.08 + state.heat * 0.45);

    /* AS-02 上料：料车爬斜桥，料钟开合，物料落入炉喉 */
    if (id === 'AS_02_CHARGE') {
      const climb = smooth(THREE.MathUtils.clamp((localT - 0.05) / 0.7, 0, 1), 0, 1);
      parts.skipCar.position.set(
        lerp(-16, -27.5, climb),
        lerp(3.2, 25.5, climb),
        lerp(-616, -637.5, climb),
      );
      parts.skipCar.rotation.x = -climb * 0.5;
      const bellOpen = localT > 0.62 ? Math.sin((localT - 0.62) * 12) * 0.5 + 0.5 : 0;
      parts.chargeBell.position.y = 3.4 - bellOpen * 0.8;
    } else {
      parts.chargeBell.position.y = 3.4;
    }

    /* 炉内粒子：物料 ↓ 与热气 ↑，两个相反方向 */
    const inFurnace = id === 'AS_03_INNER' || id === 'AS_04_REDUCE' || id === 'AS_05_MELT';
    parts.burden.visible = inFurnace;
    parts.updraft.visible = inFurnace;
    if (inFurnace) {
      const bArray = parts.burden.geometry.getAttribute('position');
      parts.burdenSeed.forEach((seed, i) => {
        seed.y -= seed.speed * dt;
        if (seed.y < 0.4) seed.y = 20;
        bArray.setXYZ(i, FX + Math.cos(seed.a) * seed.r, seed.y, FZ + Math.sin(seed.a) * seed.r);
      });
      bArray.needsUpdate = true;
      const uArray = parts.updraft.geometry.getAttribute('position');
      parts.updraftSeed.forEach((seed, i) => {
        seed.y += seed.speed * dt;
        if (seed.y > 20.5) seed.y = 0.6;
        uArray.setXYZ(i, FX + Math.cos(seed.a) * seed.r, seed.y, FZ + Math.sin(seed.a) * seed.r);
      });
      uArray.needsUpdate = true;
      // 还原过程：冷灰 → 变红 → 边缘软化 → 熔融。只靠材质与颗粒读数，不做化学 PPT。
      const reduce = smooth(THREE.MathUtils.clamp((chapterLocalT - 0.34) / 0.3, 0, 1), 0, 1);
      parts.burden.material.color.setHex(0x8a7563).lerp(new THREE.Color(0xff7a2e), reduce);
      parts.burden.material.size = lerp(0.26, 0.14, reduce);
      parts.burden.material.opacity = lerp(0.85, 0.45, reduce);
      parts.coreCallouts.forEach((plate, i) => {
        const active = i === 0 ? id === 'AS_02_CHARGE'
          : i === 1 ? id === 'AS_03_INNER'
            : i === 2 ? id === 'AS_04_REDUCE' : id === 'AS_05_MELT';
        const target = active ? 1 : 0;
        plate.material.opacity = damp(plate.material.opacity, target, 6, dt);
        plate.visible = plate.material.opacity > 0.02;
      });
    } else {
      parts.coreCallouts.forEach((plate) => {
        plate.material.opacity = damp(plate.material.opacity, 0, 8, dt);
        plate.visible = plate.material.opacity > 0.02;
      });
    }

    /* AS-06 出铁：铁水冲出出铁口，Camera 跟着从封闭炉内冲到开放空间 */
    if (id === 'AS_06_TAP') {
      const burst = smooth(THREE.MathUtils.clamp((localT - 0.28) / 0.36, 0, 1), 0, 1);
      state.flow = damp(state.flow, burst, 9, dt);
      parts.ironFlow.scale.x = Math.max(0.001, state.flow);
      parts.ironFlow.position.x = lerp(FX + 6, FX + 9.5, state.flow * 0.5);
      parts.flowMat.opacity = state.flow * 0.95;
      parts.tapLight.intensity = 2 + state.flow * 16;
    } else {
      state.flow = damp(state.flow, id.startsWith('AS_07') ? 0.85 : 0, 5, dt);
      parts.flowMat.opacity = state.flow * 0.7;
      parts.tapLight.intensity = damp(parts.tapLight.intensity, 1.2, 4, dt);
    }

    /* 钢板 → 车辆：成形度每帧由 progress 决定，位置由 Road Set 负责。 */
    {
      const truck = ctx?.shared?.truck;
      if (truck) {
        const form = truckFormAt(progress);
        truck.setForm(form);
        truck.group.rotation.y = 0;
        truck.group.visible = form > 0.02 || progress >= ROAD_START_APPROX;
      }
    }

    /* 蒸汽：从出铁口横向飘出、从炉顶垂直上升，缓慢循环。 */
    {
      const array = parts.steam.geometry.getAttribute('position');
      parts.steamSeed.forEach((seed, i) => {
        const phase = parts.steamPhase[i];
        phase < 1
          ? seed.oy += seed.vy * dt
          : seed.oy -= seed.vy * dt;
        if (seed.oy > 26) { seed.oy = 2.2; parts.steamPhase[i] = 0; }
        if (seed.oy < 1.6) { seed.oy = 24; parts.steamPhase[i] = 1; }
        seed.ox += seed.drift * dt * 0.35;
        if (seed.ox > FX + 16) seed.ox = FX + 5.4;
        array.setXYZ(i, seed.ox, seed.oy, seed.oz);
      });
      array.needsUpdate = true;
    }

    /* 蒙太奇 CUT 1 倾倒 */
    if (id === 'AS_07A_POUR') {
      const tilt = smooth(THREE.MathUtils.clamp((localT - 0.1) / 0.62, 0, 1), 0, 1);
      parts.pourLadle.rotation.z = -tilt * 0.95;
      parts.torch.intensity = 3 + tilt * 9;
      parts.torch.position.set(-10 + tilt * 0.8, 2.6 - tilt * 0.5, -666);
    } else {
      parts.pourLadle.rotation.z = damp(parts.pourLadle.rotation.z, 0, 6, dt);
      parts.torch.intensity = damp(parts.torch.intensity, id === 'AS_07B_SPARK' ? 12 : 0, 6, dt);
    }

    /* 蒙太奇 CUT 2 火花充满画面 */
    if (id === 'AS_07B_SPARK') {
      const burst = smooth(THREE.MathUtils.clamp(localT / 0.4, 0, 1), 0, 1);
      parts.sparks.material.opacity = burst * 0.95;
      const sArray = parts.sparks.geometry.getAttribute('position');
      parts.sparkSeed.forEach((seed, i) => {
        seed.y -= seed.speed * dt;
        if (seed.y < 0) seed.y = 5.2;
        sArray.setXYZ(i, -10 + seed.x, 0.4 + seed.y, -672 + seed.z);
      });
      sArray.needsUpdate = true;
    } else {
      parts.sparks.material.opacity = damp(parts.sparks.material.opacity, 0, 8, dt);
    }

    /* 蒙太奇 CUT 3 钢坯推进（进度驱动，不依赖「此刻是否正好在 AS_07C」） */
    state.billetX = billetXAt(progress);
    parts.billet.position.x = state.billetX;
    parts.billet.position.z = billetZAt(progress);
    if (id !== 'AS_07C_BILLET') {
      parts.billetMat.emissiveIntensity = damp(parts.billetMat.emissiveIntensity, 0.5, 5, dt);
    }

    /* 蒙太奇 CUT 4 轧辊高速运行 */
    if (id === 'AS_07D_ROLL') {
      state.roll += dt * 16;
      parts.rolls[0].rotation.y = state.roll;
      parts.rolls[1].rotation.y = -state.roll;
      parts.billetMat.emissiveIntensity = 1.3;
    }

    /* 蒙太奇 CUT 5 红热钢板冲向 Camera 并填满画面（同样进度驱动） */
    state.plateZ = plateZAt(progress);
    if (id === 'AS_07E_PLATE') {
      parts.plate.position.z = state.plateZ;
      parts.plateMat.emissiveIntensity = 1.1 + Math.sin(time * 8) * 0.2;
    } else if (id === 'AS_08_TRUCK') {
      // 钢板 → 轮廓 → 折弯冲压 → 车身形成 → 车轮落下（象征性转场，不是制造模拟）
      const form = smooth(THREE.MathUtils.clamp((localT - 0.05) / 0.7, 0, 1), 0, 1);
      parts.plate.scale.set(1 - form * 0.86, 1 - form * 0.7, 1 - form * 0.5);
      parts.plate.position.set(
        lerp(-6, -8, form), lerp(2.0, 2.6, form), lerp(-702.05, -702.4, form),
      );
      parts.plateMat.emissiveIntensity = lerp(1.1, 0.12, form);
      parts.plateMat.color.setHex(0xb03c14).lerp(new THREE.Color(0x4c5a4e), form);
    } else {
      parts.plate.visible = !id.startsWith('RD');
      if (!id.startsWith('RD')) {
        parts.plate.scale.setScalar(1);
        parts.plate.position.set(-6, 2.0, -706);
      }
    }

    if (reducedMotion) {
      parts.burden.visible = false;
      parts.updraft.visible = false;
    }
  }

  function probe() {
    return {
      heat: state.heat, flow: state.flow, pour: state.pour,
      billetX: state.billetX, plateZ: state.plateZ, roll: state.roll,
    };
  }

  return { builder: b, group: b.group, parts, id: 'anshan', update, probe };
}
