/* ============================================================
   buildRailSet.js — 沈阳 → 鞍山 工业铁路转场

   不是「沈阳 → loading → 鞍山」，而是从厂房门走出去，
   直接进入东北工业运输系统。

   行进过程中必须有信息：车轮运动、铁轨后退、信号灯、电线杆、
   少量工人、货物，文字与画面同步进入（United Carriers 原则）。

   坐标：轨道沿 -Z，X=0，Z ∈ [-240, -450]。
   列车尾部（矿石车厢）从 Z=-280 行驶到 Z=-375；
   Camera 从 Z=-228 追到 Z=-374.6，最后一节矿石车厢被追平并贴近。
   ============================================================ */

import * as THREE from 'three';
import { WorldBuilder, createWorker, PALETTE } from '../primitives.js';
import { SHOT_RANGES } from '../../storyboard.js';
import { createWallText } from '../textPlates.js';

const lerp = THREE.MathUtils.lerp;

/* 列车位置写成 progress 的纯函数。
   用「只在 rail 章节才更新」的 guard，反向滚动时读到的会是上一次路过时的残留值。 */
const RAIL_START = SHOT_RANGES.find((r) => r.id === 'TR_01_TRACK')?.start ?? 0.366;
const RAIL_END = SHOT_RANGES.find((r) => r.id === 'TR_04_ORE')?.end ?? 0.465;

function trainZAt(progress) {
  const span = Math.max(RAIL_END - RAIL_START, 1e-6);
  const t = THREE.MathUtils.clamp((progress - RAIL_START) / span, 0, 1);
  return lerp(-280, -375, THREE.MathUtils.smoothstep(
    THREE.MathUtils.clamp((t - 0.08) / 0.92, 0, 1), 0, 1,
  ));
}

export function buildRailSet({ reducedMotion = false } = {}) {
  const b = new WorldBuilder('set_rail');
  const parts = { workers: [] };

  const Z0 = -240;
  const Z1 = -450;
  const LEN = Z0 - Z1;
  const MID = (Z0 + Z1) / 2;

  /* ---------------- 路基与轨道 ---------------- */
  b.box('rail_bed', [16, 0.2, LEN], [0, -0.16, MID], 'earth');
  b.box('rail_ground_l', [40, 0.18, LEN], [-28, -0.2, MID], 'rock');
  b.box('rail_ground_r', [40, 0.18, LEN], [28, -0.2, MID], 'rock');
  b.box('rail_steel_l', [0.14, 0.16, LEN], [-0.72, 0.06, MID], 'steel');
  b.box('rail_steel_r', [0.14, 0.16, LEN], [0.72, 0.06, MID], 'steel');
  const sleeperTransforms = [];
  for (let z = Z0; z > Z1; z -= 0.72) sleeperTransforms.push({ x: 0, y: -0.06, z });
  b.instances('rail_sleepers',
    () => new THREE.BoxGeometry(2.6, 0.16, 0.3), sleeperTransforms, 'rustDark');

  /* ---------------- 电线杆与接触网（B 级，实例化） ---------------- */
  const poleTransforms = [];
  for (let z = Z0 - 6; z > Z1; z -= 24) poleTransforms.push({ x: 6.5, y: 4.5, z });
  b.instances('rail_poles',
    () => new THREE.CylinderGeometry(0.14, 0.18, 9, 8), poleTransforms, 'rustDark');
  const armTransforms = poleTransforms.map((t) => ({ ...t, x: t.x - 0.9, y: 8.4 }));
  b.instances('rail_pole_arms',
    () => new THREE.BoxGeometry(2.2, 0.14, 0.14), armTransforms, 'rustDark');
  b.box('rail_catenery', [0.06, 0.06, LEN], [6.0, 8.35, MID], 'steelDark');

  // 信号灯：行进途中的节奏点
  b.cyl('rail_signal_post', { rTop: 0.1, rBottom: 0.12, height: 4.2 }, [3.2, 2.1, -306], 'steelDark');
  b.box('rail_signal_head', [0.4, 1.0, 0.34], [3.2, 4.4, -306], 'machineGreen');
  const signalLampMat = b.own(new THREE.MeshBasicMaterial({ color: 0x3aff8a }));
  const signalGeo = new THREE.SphereGeometry(0.13, 10, 8);
  b.geometries.add(signalGeo);
  const signalLamp = new THREE.Mesh(signalGeo, signalLampMat);
  signalLamp.name = 'rail_signal_lamp';
  signalLamp.position.set(3.05, 4.7, -306);
  b.group.add(signalLamp);
  parts.signalLampMat = signalLampMat;

  b.cyl('rail_signal_post_b', { rTop: 0.1, rBottom: 0.12, height: 4.2 }, [3.4, 2.1, -398], 'steelDark');
  b.box('rail_signal_head_b', [0.4, 1.0, 0.34], [3.4, 4.4, -398], 'machineGreen');

  /* ---------------- 货运列车 ----------------
     root 挂在「尾部矿石车厢」上：Camera 一路从后方追上它，最后贴到 0.4m。
     车头朝 -Z（行驶方向），其余车厢沿 -Z 依次排列。                       */
  parts.train = new THREE.Group();
  parts.train.name = 'rail_train';
  parts.train.position.set(0, 0, -280);
  b.group.add(parts.train);

  // 主要货车 · 矿石车厢（尾部，A 级）
  const carGeo = new THREE.BoxGeometry(2.6, 1.6, 8.4);
  b.geometries.add(carGeo);
  const oreCar = new THREE.Mesh(carGeo, b.mat('rustDark'));
  oreCar.name = 'rail_ore_car';
  oreCar.position.set(0, 1.35, 0);
  oreCar.castShadow = true;
  parts.train.add(oreCar);
  const oreCarFrame = b.box('rail_ore_car_frame', [2.9, 0.2, 8.8], [0, 0.6, 0], 'steelDark');
  parts.train.add(oreCarFrame);

  // 矿石堆：一块「主要矿石」+ 周围散料
  const oreGeo = new THREE.DodecahedronGeometry(0.34, 0);
  b.geometries.add(oreGeo);
  parts.oreMat = b.own(new THREE.MeshStandardMaterial({
    color: 0x6a5240, roughness: 0.95, metalness: 0.06, flatShading: true,
  }));
  parts.heroOre = new THREE.Mesh(oreGeo, parts.oreMat);
  parts.heroOre.name = 'rail_hero_ore';
  parts.heroOre.position.set(-0.2, 2.32, 0.2);
  parts.heroOre.scale.setScalar(1.15);
  parts.heroOre.castShadow = true;
  parts.train.add(parts.heroOre);
  const scattered = [];
  for (let i = 0; i < 26; i += 1) {
    scattered.push({
      x: (Math.random() - 0.5) * 2.1,
      y: 2.2 + Math.random() * 0.5,
      z: (Math.random() - 0.5) * 7.4,
      ry: Math.random() * Math.PI,
      s: 0.55 + Math.random() * 0.6,
    });
  }
  b.instances('rail_ore_pile', () => new THREE.DodecahedronGeometry(0.34, 0), scattered, 'rustDark');
  const orePile = b.group.getObjectByName('rail_ore_pile');
  if (orePile) {
    orePile.material = parts.oreMat;
    parts.train.add(orePile);
  }

  // 远景低模车厢的排布（相对列车 root）
  const farCars = [];
  for (let i = 3; i <= 8; i += 1) farCars.push({ x: 0, y: 1.35, z: -9 * i });

  // 第二节主要货车
  const car2 = new THREE.Mesh(carGeo, b.mat('rust'));
  car2.name = 'rail_car_2';
  car2.position.set(0, 1.35, -9);
  car2.castShadow = true;
  parts.train.add(car2);
  const car2Load = b.box('rail_car_2_load', [2.2, 0.7, 7.4], [0, 2.5, -9], 'coal');
  parts.train.add(car2Load);

  // 远景低模车厢：不建完整火车站，其余用实例。
  // 注意必须挂进 train：留在外面的「局部坐标」会变成世界坐标，
  // 车厢会原封不动地落在沈阳厂房里。
  const carsFar = b.instances('rail_cars_far',
    () => new THREE.BoxGeometry(2.6, 1.6, 8.4), farCars, 'rustDark');
  parts.train.add(carsFar);

  // 机车（最 -Z 端）
  const loco = new THREE.Group();
  loco.name = 'rail_locomotive';
  loco.position.set(0, 0, -63);
  parts.train.add(loco);
  const locoBody = b.box('rail_loco_body', [2.8, 2.2, 9.0], [0, 2.0, 0], 'machineGreen');
  const locoBoiler = b.cyl('rail_loco_boiler', { rTop: 0.95, rBottom: 0.95, height: 7.4 }, [0, 2.9, -0.4], 'steelDark', [Math.PI / 2, 0, 0]);
  const locoCab = b.box('rail_loco_cab', [2.9, 1.9, 2.6], [0, 3.3, 4.2], 'machineGreen');
  const locoStack = b.cyl('rail_loco_stack', { rTop: 0.28, rBottom: 0.34, height: 1.2 }, [0, 4.3, -3.4], 'steelDark');
  const locoFrame = b.box('rail_loco_frame', [3.0, 0.4, 9.6], [0, 0.9, 0], 'steelDark');
  loco.add(locoBody, locoBoiler, locoCab, locoStack, locoFrame);
  parts.locoWheels = [];
  for (let i = 0; i < 4; i += 1) {
    const wheel = b.cyl(
      `rail_loco_wheel_${i}`, { rTop: 0.62, rBottom: 0.62, height: 0.18, seg: 18 },
      [i < 2 ? -1.45 : 1.45, 0.62, -3.2 + (i % 2) * 5.4], 'steelDark', [0, 0, Math.PI / 2],
    );
    parts.locoWheels.push(wheel);
    loco.add(wheel);
  }
  b.box('rail_loco_cowcatcher', [2.6, 0.7, 0.8], [0, 1.0, -5.0], 'rustDark');

  // 车轮（货车）：转向架两组
  parts.carWheels = [];
  [-3.2, 3.2].forEach((z, groupIndex) => {
    [-1.3, 1.3].forEach((x, side) => {
      const wheel = b.cyl(
        `rail_car_wheel_${groupIndex}_${side}`, { rTop: 0.42, rBottom: 0.42, height: 0.16, seg: 16 },
        [x, 0.44, z], 'steelDark', [0, 0, Math.PI / 2],
      );
      parts.carWheels.push(wheel);
      parts.train.add(wheel);
    });
  });

  parts.steam = b.points('rail_steam', 60, { color: 0xc8ccd0, size: 0.5, opacity: 0.35 });
  parts.steamSeed = Array.from({ length: 60 }, () => ({
    x: (Math.random() - 0.5) * 0.7,
    y: Math.random() * 5,
    z: (Math.random() - 0.5) * 1.2,
    speed: 0.8 + Math.random() * 1.4,
  }));

  /* ---------------- 沿线工人与货物 ---------------- */
  parts.workers.push(
    createWorker(b, { id: 'rail_w1', position: [-4.2, 0, -322], rotationY: -1.4, pose: 'carry' }),
    createWorker(b, { id: 'rail_w2', position: [-5.0, 0, -356], rotationY: -1.2, pose: 'operate' }),
    createWorker(b, { id: 'rail_w3', position: [5.4, 0, -392], rotationY: 1.9, pose: 'push' }),
  );
  b.box('rail_crate_a', [1.2, 1.0, 1.6], [-5.6, 0.5, -336], 'rustDark');
  b.box('rail_crate_b', [1.0, 0.8, 1.2], [-5.2, 0.9, -334.6], 'rustDark');
  b.box('rail_crate_c', [1.4, 1.1, 2.0], [5.9, 0.55, -380], 'rustDark');

  /* ---------------- A 类文字：写在车厢与沿线构筑物上 ---------------- */
  createWallText(b, {
    name: 'rail_text_car',
    text: '鞍山',
    position: [1.32, 1.6, 0],
    rotation: [0, Math.PI / 2, 0],
    width: 3.2,
    height: 1.4,
    fontSize: 96,
    color: 'rgba(232,220,200,.72)',
    tracking: 8,
  });
  parts.train.add(b.group.getObjectByName('rail_text_car'));
  createWallText(b, {
    name: 'rail_text_sign',
    text: '沈阳 → 鞍山',
    position: [3.6, 3.0, -272],
    rotation: [0, 0.35, 0],
    width: 3.6,
    height: 0.9,
    fontSize: 62,
    color: 'rgba(226,216,198,.6)',
  });

  /* ---------------- 灯光 ---------------- */
  const railKey = new THREE.PointLight(0xcdd8e2, 1.6, 60, 1.5);
  railKey.position.set(2, 7, -300);
  b.group.add(railKey);
  parts.railKey = railKey;

  /* ---------------- 章节运动 ---------------- */
  const state = { wheelSpin: 0, steam: 0, signal: 0, trainZ: -280 };

  function update(frame, ctx) {
    const { shot, localT, progress } = frame;
    const time = ctx?.time ?? 0;
    const dt = ctx?.dt ?? 0;

    // 列车尾部 Z：整段铁路里从 -280 行驶到 -375，Camera 从后方一路追上。
    // 由 progress 直接给出，不依赖「此刻是否正好在 rail 章节」。
    state.trainZ = trainZAt(progress);
    parts.train.position.z = state.trainZ;

    // 车轮：与行驶同步，反向滚动时随之反向。
    state.wheelSpin += dt * 4.6;
    parts.carWheels.forEach((wheel) => { wheel.rotation.y = state.wheelSpin; });
    parts.locoWheels.forEach((wheel) => { wheel.rotation.y = state.wheelSpin; });

    // 蒸汽：机车上方持续升腾
    const steamArray = parts.steam.geometry.getAttribute('position');
    parts.steamSeed.forEach((seed, i) => {
      seed.y += seed.speed * dt;
      if (seed.y > 7) seed.y = 0;
      steamArray.setXYZ(i, seed.x, 4.6 + seed.y, -63.4 + seed.z - (seed.y * 0.5));
    });
    steamArray.needsUpdate = true;

    // 信号灯缓慢呼吸
    state.signal += dt;
    const blink = 0.55 + Math.sin(state.signal * 1.6) * 0.45;
    parts.signalLampMat.color.setHex(0x3aff8a).multiplyScalar(0.35 + blink * 0.65);

    // 工人小幅动作
    parts.workers.forEach((worker, index) => {
      const swing = Math.sin(time * 1.3 + index * 2.1) * 0.06;
      worker.armL.rotation.x = swing;
      worker.armR.rotation.x = -swing;
    });

    // TR-04：主要矿石在画面里越来越大 —— 这里只保证它自身状态，占比由 Camera 距离完成。
    if (shot.id === 'TR_04_ORE') {
      const grow = THREE.MathUtils.smoothstep(localT, 0.1, 0.95);
      parts.heroOre.rotation.y += dt * (0.2 + grow * 0.6);
      parts.heroOre.scale.setScalar(1.15 + grow * 0.25);
      parts.oreMat.color.setHex(0x6a5240).multiplyScalar(1 + grow * 0.5);
    } else {
      parts.heroOre.scale.setScalar(1.15);
    }

    if (reducedMotion) {
      parts.steam.visible = false;
    }
  }

  function probe() {
    return { trainZ: state.trainZ, wheelSpin: state.wheelSpin };
  }

  return { builder: b, group: b.group, parts, id: 'rail', update, probe };
}
