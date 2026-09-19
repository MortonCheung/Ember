/* ============================================================
   buildRoadSet.js — 鞍山 → 抚顺 公路转场

   公路不是为了「换一种转场」：刚刚形成的钢变成工业车辆，
   继续把故事向下一个工业系统带过去。

   行进本身就是内容：车辆运动、环境变化、少量文字、小动画、前景掠过。
       鞍钢工业区 → 厂房减少 → 输电设施 → 工业道路
       → 裸露土地 → 山体 → 矿区设施

   坐标：路中心 X=-8，Z ∈ [-700, -1120]。卡车由本 Set 持有，
   鞍山 Set 的 AS-08 通过 ctx.shared.truck 借用它完成「钢板 → 车辆」。
   ============================================================ */

import * as THREE from 'three';
import { WorldBuilder, createWorker } from '../primitives.js';
import { SHOT_RANGES } from '../../storyboard.js';
import { createWallText, createNameplate } from '../textPlates.js';

const lerp = THREE.MathUtils.lerp;
const smooth = THREE.MathUtils.smoothstep;

/* 卡车位置同样写成 progress 的纯函数：公路段匀速，揭示段减速。
   用「只在 road 章节才更新」的 guard，反向滚动与跳转都会读到残留值。 */
const ROAD_START = SHOT_RANGES.find((r) => r.id === 'RD_01_DEPART')?.start ?? 0.694;
const ROAD_END = SHOT_RANGES.find((r) => r.id === 'RD_03_REVEAL')?.end ?? 0.783;

function truckZAt(progress) {
  const span = Math.max(ROAD_END - ROAD_START, 1e-6);
  const t = THREE.MathUtils.clamp((progress - ROAD_START) / span, 0, 1);
  // 前 78% 走完 88% 的路程，后 22% 减速到终点
  const z = t <= 0.78 ? (t / 0.78) * 0.88 : 0.88 + ((t - 0.78) / 0.22) * 0.12;
  return lerp(-702, -1086, THREE.MathUtils.clamp(z, 0, 1));
}

export function buildRoadSet({ reducedMotion = false } = {}) {
  const b = new WorldBuilder('set_road');
  const parts = { workers: [] };

  const ROAD_X = -8;
  const Z0 = -700;
  const Z1 = -1140;

  /* ---------------- 道路 ---------------- */
  b.box('rd_road', [11, 0.16, Z0 - Z1], [ROAD_X, -0.02, (Z0 + Z1) / 2], 'coal');
  b.box('rd_shoulder_l', [1.2, 0.12, Z0 - Z1], [ROAD_X - 6, -0.06, (Z0 + Z1) / 2], 'earthLight');
  b.box('rd_shoulder_r', [1.2, 0.12, Z0 - Z1], [ROAD_X + 6, -0.06, (Z0 + Z1) / 2], 'earthLight');
  b.box('rd_terrain_l', [70, 0.14, Z0 - Z1], [ROAD_X - 48, -0.1, (Z0 + Z1) / 2], 'earth');
  b.box('rd_terrain_r', [70, 0.14, Z0 - Z1], [ROAD_X + 48, -0.1, (Z0 + Z1) / 2], 'earth');
  // 中线
  const dashTransforms = [];
  for (let z = Z0; z > Z1; z -= 9) dashTransforms.push({ x: ROAD_X, y: 0.08, z });
  b.instances('rd_dashes', () => new THREE.BoxGeometry(0.16, 0.02, 3.2), dashTransforms, 'earthLight');

  /* ---------------- 环境过渡：每一段都换一种地貌 ---------------- */
  // 1) 鞍钢工业区（厂房逐渐减少）
  const plantTransforms = [];
  for (let i = 0; i < 7; i += 1) {
    plantTransforms.push({ x: ROAD_X - 26 - (i % 3) * 12, y: 5, z: -712 - i * 16 });
  }
  b.instances('rd_plants', () => new THREE.BoxGeometry(14, 10, 10), plantTransforms, 'rustDark');
  for (let i = 0; i < 4; i += 1) {
    b.cyl(`rd_stack_${i}`, { rTop: 0.9, rBottom: 1.3, height: 18 },
      [ROAD_X - 24 - i * 10, 9, -724 - i * 20], 'rust');
  }

  // 2) 输电设施（铁塔 + 线）
  for (let i = 0; i < 5; i += 1) {
    const z = -856 - i * 22;
    const x = ROAD_X + 13 + (i % 2) * 5;
    b.cyl(`rd_pylon_${i}_a`, { rTop: 0.1, rBottom: 0.16, height: 16 }, [x - 1.1, 8, z], 'steelDark');
    b.cyl(`rd_pylon_${i}_b`, { rTop: 0.1, rBottom: 0.16, height: 16 }, [x + 1.1, 8, z], 'steelDark');
    b.box(`rd_pylon_${i}_arm`, [4.2, 0.16, 0.16], [x, 13.6, z], 'steelDark');
    b.box(`rd_pylon_${i}_cross`, [0.12, 0.12, 3.4], [x - 1.1, 8, z], 'steelDark');
  }
  b.box('rd_powerline', [0.05, 0.05, 120], [ROAD_X + 14, 13.6, -910], 'steelDark');

  // 3) 裸露土地（土堆）
  const moundTransforms = [];
  for (let i = 0; i < 10; i += 1) {
    moundTransforms.push({
      x: ROAD_X - 20 - Math.random() * 30, y: 1.2, z: -980 - i * 13,
      s: 0.8 + Math.random() * 1.4,
    });
  }
  b.instances('rd_mounds', () => new THREE.ConeGeometry(4, 3.4, 8), moundTransforms, 'earth');

  // 4) 山体（矿坑前的最后一层遮挡）
  [[ROAD_X - 34, -1052, 16, 26], [ROAD_X + 30, -1078, 20, 30], [ROAD_X - 26, -1104, 14, 22]]
    .forEach(([x, z, r, h], i) => {
      b.cone(`rd_hill_${i}`, { r, height: h, seg: 7 }, [x, h / 2, z], 'rock');
    });

  // 5) 矿区设施（栅栏、料堆、工棚）
  b.box('rd_gate_post_l', [0.4, 3.2, 0.4], [ROAD_X - 7.5, 1.6, -1112], 'rustDark');
  b.box('rd_gate_post_r', [0.4, 3.2, 0.4], [ROAD_X + 7.5, 1.6, -1112], 'rustDark');
  b.box('rd_gate_beam', [15.4, 0.4, 0.4], [ROAD_X, 3.2, -1112], 'rustDark');
  b.box('rd_shed', [8, 4, 6], [ROAD_X - 22, 2, -1128], 'rustDark');
  b.cone('rd_ore_pile', { r: 6, height: 3.4, seg: 9 }, [ROAD_X + 22, 1.7, -1130], 'earth');

  /* ---------------- 工业卡车（1950s / 1960s 风格，不是现代 SUV） ---------------- */
  const truck = new THREE.Group();
  truck.name = 'vehicle_truck';
  truck.position.set(ROAD_X, 0, -702);
  truck.rotation.y = Math.PI; // 车头朝 -Z（行驶方向）
  b.group.add(truck);

  const cabGeo = new THREE.BoxGeometry(2.5, 1.9, 2.4);
  const hoodGeo = new THREE.BoxGeometry(2.3, 1.0, 1.6);
  const deckGeo = new THREE.BoxGeometry(2.6, 0.9, 4.6);
  const chassisGeo = new THREE.BoxGeometry(2.4, 0.3, 8.0);
  const wheelGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.36, 18);
  b.geometries.add(cabGeo, hoodGeo, deckGeo, chassisGeo, wheelGeo);

  const truckBody = b.own(new THREE.MeshStandardMaterial({
    color: 0x4c5a4e, roughness: 0.72, metalness: 0.22,
  }));
  const truckDark = b.own(new THREE.MeshStandardMaterial({
    color: 0x2b3033, roughness: 0.8, metalness: 0.15,
  }));

  const cab = new THREE.Mesh(cabGeo, truckBody);
  cab.name = 'truck_cab';
  cab.position.set(0, 2.0, -2.6);
  const hood = new THREE.Mesh(hoodGeo, truckBody);
  hood.name = 'truck_hood';
  hood.position.set(0, 1.35, -4.1);
  const deck = new THREE.Mesh(deckGeo, truckDark);
  deck.name = 'truck_deck';
  deck.position.set(0, 1.55, 0.6);
  const chassis = new THREE.Mesh(chassisGeo, truckDark);
  chassis.name = 'truck_chassis';
  chassis.position.set(0, 0.95, -0.6);
  truck.add(cab, hood, deck, chassis);

  // 驾驶室玻璃与挡泥板：够读出年代感即可
  b.plane('truck_glass', [2.1, 0.9], [0, 2.2, -3.82], 'glass');
  truck.add(b.group.children[b.group.children.length - 1]);

  const wheels = [];
  [[-1.3, -3.9], [1.3, -3.9], [-1.3, 1.2], [1.3, 1.2], [-1.3, 2.6], [1.3, 2.6]]
    .forEach(([x, z], i) => {
      const wheel = new THREE.Mesh(wheelGeo, truckDark);
      wheel.name = `truck_wheel_${i}`;
      wheel.position.set(x, 0.62, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      truck.add(wheel);
      wheels.push(wheel);
    });

  // 车斗里的钢板：呼应「刚刚轧出来的钢」
  const loadGeo = new THREE.BoxGeometry(2.2, 0.3, 4.0);
  b.geometries.add(loadGeo);
  const load = new THREE.Mesh(loadGeo, b.mat('steel'));
  load.name = 'truck_load';
  load.position.set(0, 2.1, 0.6);
  truck.add(load);

  parts.truck = {
    group: truck,
    wheels,
    body: truckBody,
    state: { form: 0, spin: 0 },
    /** 钢板 → 车辆：车身从无到有，车轮从上方落下。象征性转场，不是制造模拟。 */
    setForm(k) {
      this.state.form = THREE.MathUtils.clamp(k, 0, 1);
      const k2 = this.state.form;
      // 车身：先有轮廓（薄），再长成实体
      cab.scale.set(1, lerp(0.06, 1, smooth(k2, 0, 1)), 1);
      hood.scale.set(1, lerp(0.06, 1, smooth(k2, 0, 1)), 1);
      deck.scale.set(1, lerp(0.06, 1, smooth(k2, 0, 1)), 1);
      chassis.scale.set(1, lerp(0.06, 1, smooth(k2, 0, 1)), 1);
      // 车轮：最后落下
      const drop = smooth(THREE.MathUtils.clamp((k2 - 0.55) / 0.45, 0, 1), 0, 1);
      wheels.forEach((wheel) => {
        wheel.position.y = lerp(1.9, 0.62, drop);
        wheel.visible = drop > 0.02;
      });
      load.scale.set(1, lerp(0.05, 1, drop), 1);
      truckBody.color.setHex(0xb03c14).lerp(new THREE.Color(0x4c5a4e), drop);
    },
    setWheelSpin(v) {
      wheels.forEach((wheel) => { wheel.rotation.y = v; });
    },
  };

  /* ---------------- 沿线工人 ---------------- */
  parts.workers.push(
    createWorker(b, { id: 'rd_w1', position: [ROAD_X + 9, 0, -812], rotationY: 1.8, pose: 'operate', cloth: 'clothAlt' }),
    createWorker(b, { id: 'rd_w2', position: [ROAD_X - 11, 0, -1004], rotationY: -1.2, pose: 'carry' }),
  );

  /* ---------------- A 类文字 ---------------- */
  createWallText(b, {
    name: 'rd_text_depart',
    text: '钢 · 出厂',
    position: [ROAD_X + 7.4, 3.4, -742],
    rotation: [0, -0.5, 0],
    width: 6.4, height: 1.8, fontSize: 110, tracking: 8,
  });
  createWallText(b, {
    name: 'rd_text_mine',
    text: '抚顺 · 露天矿',
    position: [ROAD_X + 7.4, 3.4, -1106],
    rotation: [0, -0.5, 0],
    width: 9, height: 1.8, fontSize: 100, tracking: 8,
    color: 'rgba(239,231,216,.72)',
  });
  createWallText(b, {
    name: 'rd_text_gate',
    text: '矿区',
    position: [ROAD_X, 3.9, -1111.6],
    rotation: [0, 0, 0],
    width: 6, height: 1.2, fontSize: 84, tracking: 12,
  });

  // 里程碑：公路段的行进信息
  createNameplate(b, {
    name: 'rd_plate_milestone', title: '鞍山 12',
    lines: ['抚顺 38'],
    position: [ROAD_X - 7.8, 1.3, -900], rotation: [0, 0, 0],
    width: 1.5, height: 0.85,
  });
  /* ---------------- 持续的小运动：路面扬尘 ----------------
     卡车一路带起的土，是这段「行进即内容」最直观的呼吸感。 */
  parts.roadDust = b.points('rd_dust', 110, { color: 0xb4ab97, size: 0.42, opacity: 0.3 });
  parts.roadDustSeed = Array.from({ length: 110 }, () => ({
    x: ROAD_X + (Math.random() - 0.5) * 9,
    y: 0.1 + Math.random() * 2.6,
    z: -704 - Math.random() * 380,
    vy: 0.25 + Math.random() * 0.5,
    vx: (Math.random() - 0.5) * 0.5,
  }));

  /* ---------------- 灯光 ---------------- */
  const roadKey = new THREE.PointLight(0xd6d2c4, 1.4, 120, 1.3);
  roadKey.position.set(ROAD_X + 6, 14, -820);
  b.group.add(roadKey);

  /* ---------------- 章节运动 ---------------- */
  const state = { spin: 0 };

  function update(frame, ctx) {
    const { shot, progress } = frame;
    const time = ctx?.time ?? 0;
    const dt = ctx?.dt ?? 0;

    // 卡车沿 -Z 行驶：从鞍钢门口出发，一路把故事带到矿坑边缘后减速。
    // AS-08（鞍山）时 progress 还不到 ROAD_START，纯函数自然落在起点附近，
    // 由鞍山 Set 接管「钢板 → 车辆」那一刻的姿态。
    parts.truck.group.position.z = truckZAt(progress);
    if (shot.chapter !== 'road') return;

    state.spin += dt * 9 * (shot.id === 'RD_03_REVEAL' ? 0.35 : 1);
    parts.truck.setWheelSpin(state.spin);

    /* 扬尘：贴着路面缓慢上升，被风横向带开。 */
    {
      const array = parts.roadDust.geometry.getAttribute('position');
      parts.roadDustSeed.forEach((seed, i) => {
        seed.y += seed.vy * dt;
        seed.x += seed.vx * dt;
        if (seed.y > 3.4) { seed.y = 0.1; seed.x = ROAD_X + (Math.random() - 0.5) * 9; }
        array.setXYZ(i, seed.x, seed.y, seed.z);
      });
      array.needsUpdate = true;
    }

    // 工人小幅动作
    parts.workers.forEach((worker, index) => {
      const swing = Math.sin(time * 1.2 + index * 2.4) * 0.06;
      worker.armL.rotation.x = swing;
      worker.armR.rotation.x = -swing;
    });

    if (reducedMotion) state.spin = 0;
  }

  function probe() {
    return { truckZ: parts.truck.group.position.z, form: parts.truck.state.form };
  }

  return { builder: b, group: b.group, parts, id: 'road', update, probe };
}
