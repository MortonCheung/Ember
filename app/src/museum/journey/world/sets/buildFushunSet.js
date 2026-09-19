/* ============================================================
   buildFushunSet.js — 抚顺 · 露天矿

   核心视觉不是地下矿洞，而是巨大的露天矿坑与阶梯地貌。核心感觉是「深」。

   地形不用随机生成：用 LatheGeometry 沿一条阶梯剖面旋转成型，
   得到多层阶梯、确定性的深度和可控的 draw call。

   矿坑参数：中心 (0, 0, -1400)，坑底半径 42m（Y=-115），坑口半径 170m（Y=0）。
   坑缘最近点 Z=-1230。

   FS-HERO-WORKER 位于坑底 (0, -115, -1400)：双手叉腰、略微后仰、抬头望天。
   他是抚顺章节真正的情绪 Hero，也是全片的落脚点。
   ============================================================ */

import * as THREE from 'three';
import { WorldBuilder, createWorker, PALETTE } from '../primitives.js';
import { SHOT_RANGES } from '../../storyboard.js';
import { createWallText, createNameplate } from '../textPlates.js';

const lerp = THREE.MathUtils.lerp;
const smooth = THREE.MathUtils.smoothstep;
// 定位式调用（dt=0：Debug setShot / Explore 返回）必须一步到位——
// damp 在 dt=0 时是恒等映射，会让门、炉温这类状态停在初始值。
const damp = (current, target, lambda, dt) => (
  dt > 0 ? THREE.MathUtils.damp(current, target, lambda, dt) : target
);

/* 落到工人脚边的那束暖光：写成 progress 的纯函数。
   用 damp 的话，读数会取决于「什么时候看」而不是「看到哪里」，
   反向滚动与跳转定位就会得到不同结果。 */
const LAND_RANGE = SHOT_RANGES.find((range) => range.id === 'FS_05_LAND') ?? null;
const GAZE_RANGE = SHOT_RANGES.find((range) => range.id === 'FS_06_GAZE') ?? null;

function heroGlowAt(progress) {
  const start = LAND_RANGE
    ? LAND_RANGE.start + (LAND_RANGE.end - LAND_RANGE.start) * 0.45
    : 0.9;
  const end = GAZE_RANGE ? GAZE_RANGE.end : 0.95;
  if (end <= start) return progress >= end ? 1 : 0;
  return THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
}

/* 阶梯剖面：19 级，每级 6.05m 高、6.74m 宽。确定性生成，不随机。 */
function buildPitProfile() {
  const STEPS = 19;
  const profile = [];
  for (let i = 0; i <= STEPS; i += 1) {
    const r = 42 + i * 6.74;
    const h = -115 + i * 6.05;
    profile.push([r, h]);
    if (i < STEPS) profile.push([r + 6.74, h]);
  }
  // 剖面到坑口为止；外围台地由法线朝上的 RingGeometry 提供，
  // lathe 外围段的法线朝下，从坑缘俯瞰时会渲染成一片黑。
  profile.push([173, 1.0]);
  return profile;
}

/* 极坐标 → 世界坐标（坑中心 (0,0,-1400)） */
function pit(radius, height, thetaDeg) {
  const a = (thetaDeg * Math.PI) / 180;
  return [Math.cos(a) * radius, height, -1400 + Math.sin(a) * radius];
}

export function buildFushunSet({ reducedMotion = false } = {}) {
  const b = new WorldBuilder('set_fushun');
  const parts = { workers: [] };

  const CX = 0;
  const CZ = -1400;
  const BOTTOM = -115;

  /* ---------------- 矿坑地形 ---------------- */
  // Lathe 的面法线朝外：站在坑缘/坑内看到的全是背面，会被整个剔除。
  // 矿坑必须用双面材质，否则「它真的非常深」这一眼根本不成立。
  const pitMat = b.own(new THREE.MeshStandardMaterial({
    color: 0x4b453c, roughness: 0.96, metalness: 0.02, side: THREE.DoubleSide,
  }));
  parts.pit = b.lathe('mine_pit', buildPitProfile(), [CX, 0, CZ], 'rock', 72);
  parts.pit.material = pitMat;
  // 坑底
  b.cyl('mine_floor', { rTop: 42, rBottom: 42, height: 1.2, seg: 48 }, [CX, BOTTOM - 0.6, CZ], 'earth');
  // 坑口外围台地：RingGeometry 中心镂空，不会封住坑口；
  // 实心圆盘/圆柱都会把矿坑整个盖死，这是上一版「只见土黄不见坑」的根因。
  const rimGeo = new THREE.RingGeometry(172, 280, 72, 1);
  b.geometries.add(rimGeo);
  const rimMesh = new THREE.Mesh(rimGeo, b.mat('earth'));
  rimMesh.name = 'mine_rim_ring';
  rimMesh.rotation.x = -Math.PI / 2;
  rimMesh.position.set(CX, 2.4, CZ);
  rimMesh.receiveShadow = true;
  b.group.add(rimMesh);
  // 岩层线：几圈薄环，读出「层理」，而不是一片纯色
  [4, 8, 12, 16].forEach((step, index) => {
    const r = 42 + step * 6.74;
    const h = -115 + step * 6.05;
    const ringGeo = new THREE.TorusGeometry(r + 1.2, 0.5, 5, 60);
    b.geometries.add(ringGeo);
    const ring = new THREE.Mesh(ringGeo, b.mat(index % 2 ? 'earthLight' : 'coal'));
    ring.name = `mine_strata_${step}`;
    ring.rotation.x = Math.PI / 2;
    ring.position.set(CX, h + 0.4, CZ);
    b.group.add(ring);
  });

  /* ---------------- 矿区道路（之字形下坑） ---------------- */
  for (let i = 0; i < 9; i += 1) {
    const step = 17 - i;
    const r = 42 + step * 6.74 + 3.4;
    const h = -115 + step * 6.05 + 0.3;
    const a = 40 + i * 4.5;
    const [x, y, z] = pit(r, h, a);
    b.box(`mine_road_${i}`, [7.2, 0.24, 9.4], [x, y, z], 'earthLight', (-a * Math.PI) / 180);
  }

  /* ---------------- 坑壁上的掠过物（俯冲的尺度参照） ----------------
     没有这些，用户只会觉得「Camera 在缩放」。
     它们被刻意放在俯冲路径附近，从 Camera 旁快速掠过。              */
  const flyByDefs = [
    { theta: 87, radius: 143, height: -20, kind: 'platform', id: 'fb1' },
    { theta: 88, radius: 115, height: -45, kind: 'rail', id: 'fb2' },
    { theta: 98, radius: 87, height: -70, kind: 'platform', id: 'fb3' },
    { theta: 98, radius: 54, height: -100, kind: 'gear', id: 'fb4' },
  ];
  flyByDefs.forEach((def) => {
    const [x, y, z] = pit(def.radius, def.height, def.theta);
    if (def.kind === 'platform') {
      b.box(`mine_${def.id}_deck`, [12, 0.4, 7], [x, y + 0.4, z], 'steel', (-def.theta * Math.PI) / 180);
      b.box(`mine_${def.id}_hut`, [4.2, 2.8, 3.4], [x + 3.4, y + 2.0, z - 1.2], 'rustDark');
      for (let i = 0; i < 6; i += 1) {
        b.box(`mine_${def.id}_rail_${i}`, [1.6, 0.9, 0.08],
          [x - 4.5 + i * 1.8, y + 1.0, z + 3.2], 'steelDark');
      }
    } else if (def.kind === 'rail') {
      b.box(`mine_${def.id}_rail_l`, [0.14, 0.14, 26], [x - 1.2, y + 0.2, z], 'steel');
      b.box(`mine_${def.id}_rail_r`, [0.14, 0.14, 26], [x + 1.2, y + 0.2, z], 'steel');
      b.box(`mine_${def.id}_car`, [2.4, 1.4, 4.4], [x, y + 1.0, z - 6], 'rustDark');
      b.box(`mine_${def.id}_pole`, [0.2, 6, 0.2], [x + 3.4, y + 3.0, z + 4], 'rustDark');
    } else {
      b.box(`mine_${def.id}_body`, [5.0, 3.0, 4.0], [x, y + 1.8, z], 'rustDark');
      b.cyl(`mine_${def.id}_arm`, { rTop: 0.24, rBottom: 0.24, height: 7 },
        [x + 2.6, y + 3.6, z - 1.2], 'steel', [0.6, 0, 0.5]);
    }
  });

  // 坑壁上的极小工人：让人第一次读到「这个坑有多大」
  parts.workers.push(
    createWorker(b, { id: 'fs_w1', position: pit(122, -19.4, 89), rotationY: 0.6, pose: 'operate', cloth: 'clothAlt' }),
    createWorker(b, { id: 'fs_w2', position: pit(78, -44.4, 92), rotationY: -0.4, pose: 'carry' }),
    createWorker(b, { id: 'fs_w3', position: pit(49, -69.4, 101), rotationY: 1.9, pose: 'operate', cloth: 'clothAlt' }),
  );

  /* ---------------- 坑底 ---------------- */
  // 铁轨与矿车
  b.box('mine_bottom_rail_l', [0.14, 0.14, 54], [CX - 1.4, BOTTOM + 0.12, CZ + 6], 'steel');
  b.box('mine_bottom_rail_r', [0.14, 0.14, 54], [CX + 1.4, BOTTOM + 0.12, CZ + 6], 'steel');
  for (let i = 0; i < 3; i += 1) {
    b.box(`mine_car_${i}`, [2.6, 1.6, 4.6], [CX, BOTTOM + 1.1, CZ + 14 + i * 6.4], 'rustDark');
  }
  b.box('mine_water_pipe', [0.3, 0.3, 40], [CX - 16, BOTTOM + 0.4, CZ + 4], 'steelDark', 0.12);

  /* ---------------- FS-HERO-WORKER（抚顺的情绪 Hero） ---------------- */
  parts.heroWorker = createWorker(b, {
    id: 'fs_hero',
    position: [CX, BOTTOM, CZ],
    rotationY: Math.PI, // 背对 Camera：观众代入他的视线，跟着他一起往上看
    pose: 'gaze',
    cloth: 'cloth',
  });
  // 脚下的碎石与工具：让「落到脚边」这个落点有实体感
  b.box('mine_hero_ground', [6, 0.2, 6], [CX, BOTTOM + 0.1, CZ], 'coal');
  b.box('mine_hero_shovel', [0.12, 0.12, 1.5], [CX + 1.5, BOTTOM + 0.12, CZ + 0.6], 'steelDark', 0.5);

  /* ---------------- 大型矿用电铲（S 级，可拆 body/boom/arm/bucket） ---------------- */
  const shovel = new THREE.Group();
  shovel.name = 'hero_shovel';
  shovel.position.set(CX + 22, BOTTOM, CZ - 32);
  shovel.rotation.y = -2.3;
  b.group.add(shovel);
  const shovelBody = b.box('shovel_body', [7.0, 3.6, 5.4], [0, 3.0, 0], 'machineGreen');
  const shovelTrackL = b.box('shovel_track_l', [8.4, 1.3, 1.7], [0, 0.65, -2.9], 'steelDark');
  const shovelTrackR = b.box('shovel_track_r', [8.4, 1.3, 1.7], [0, 0.65, 2.9], 'steelDark');
  const shovelDeck = b.box('shovel_deck', [7.6, 0.4, 6.0], [0, 4.9, 0], 'steelDark');
  const shovelCab = b.box('shovel_cab', [2.6, 2.4, 2.6], [2.0, 6.2, -1.4], 'machineGreen');
  // 不挂进 shovel 的「局部坐标」会原样落在世界原点，正好怼在开场镜头前面。
  shovel.add(shovelBody, shovelTrackL, shovelTrackR, shovelDeck, shovelCab);

  const boomPivot = new THREE.Group();
  boomPivot.name = 'shovel_boom_pivot';
  boomPivot.position.set(-1.6, 5.4, 0);
  shovel.add(boomPivot);
  const boom = b.box('shovel_boom', [0.9, 0.9, 15], [0, 3.4, 7.2], 'steel', 0);
  boomPivot.add(boom);
  const armPivot = new THREE.Group();
  armPivot.name = 'shovel_arm_pivot';
  armPivot.position.set(0, 6.6, 14.4);
  boomPivot.add(armPivot);
  const arm = b.box('shovel_arm', [0.7, 0.7, 8], [0, -2.2, 3.4], 'steel', 0);
  armPivot.add(arm);
  parts.shovelBucket = b.box('shovel_bucket', [3.2, 2.4, 2.8], [0, -5.4, 7.0], 'rustDark', 0);
  armPivot.add(parts.shovelBucket);
  b.box('shovel_bucket_lip', [3.4, 0.3, 0.4], [0, -6.6, 8.3], 'steel', 0);
  armPivot.add(b.group.children[b.group.children.length - 1]);

  parts.shovel = {
    root: shovel,
    boomPivot,
    armPivot,
    bucket: parts.shovelBucket,
    state: { cycle: 0.1 },
  };

  /* ---------------- 坑顶工业设施 ---------------- */
  b.box('mine_top_building', [22, 9, 14], [CX - 62, 4.5, CZ + 168], 'rustDark');
  b.box('mine_top_building_b', [16, 7, 12], [CX + 58, 3.5, CZ + 150], 'concreteDark');
  b.cyl('mine_top_stack', { rTop: 1.2, rBottom: 1.8, height: 26 }, [CX - 74, 13, CZ + 140], 'rust');
  for (let i = 0; i < 3; i += 1) {
    const z = CZ + 176 - i * 14;
    b.cyl(`mine_top_pylon_${i}`, { rTop: 0.12, rBottom: 0.2, height: 18 },
      [CX + 34 + i * 6, 9, z], 'steelDark');
    b.box(`mine_top_pylon_arm_${i}`, [4.6, 0.16, 0.16], [CX + 34 + i * 6, 15.6, z], 'steelDark');
  }
  b.box('mine_top_rail', [0.14, 0.14, 90], [CX - 96, 2.2, CZ + 120], 'steel');
  b.box('mine_top_conveyor', [1.6, 0.6, 60], [CX + 92, 4.0, CZ + 130], 'steelDark', 0.22);

  /* ---------------- A 类文字 ---------------- */
  createWallText(b, {
    name: 'fs_text_chapter',
    text: '抚顺 · 露天矿',
    position: [CX + 30, 6.4, CZ + 166],
    rotation: [0, -0.35, 0],
    width: 12, height: 3.4, fontSize: 170, tracking: 12,
  });
  createNameplate(b, {
    name: 'fs_plate_shovel',
    title: '矿用电铲',
    lines: ['斗容 3 m³', '1950s'],
    position: [CX + 22, BOTTOM + 8.4, CZ - 32 + 3.2],
    rotation: [0, -2.3, 0], width: 1.7, height: 0.95,
  });

  // 矿区标识
  createNameplate(b, {
    name: 'fs_plate_area', title: '露天矿 · 作业区',
    lines: ['无关人员禁止入内'],
    position: [-6.5, 3.4, -1236], rotation: [0, 0.28, 0],
    width: 2.1, height: 1.0,
  });
  createWallText(b, {
    name: 'fs_text_step', text: '+3 台阶',
    position: pit(76, -50.0, 80), rotation: [0, -1.35, 0],
    width: 1.6, height: 0.7, fontSize: 96, tracking: 4, opacity: 0.7,
  });
  /* ---------------- 持续的小运动：坑内风沙 ----------------
     露天矿是有风的：空气里的浮尘让「深」多了一层空气感。 */
  parts.pitHaze = b.points('fs_haze', 160, { color: 0xc9c3b6, size: 0.6, opacity: 0.22 });
  parts.pitHazeSeed = Array.from({ length: 160 }, () => {
    const radius = 30 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(theta) * radius,
      z: CZ + Math.sin(theta) * radius,
      y: -112 + Math.random() * 108,
      vx: 0.6 + Math.random() * 1.2,
      vy: (Math.random() - 0.5) * 0.25,
    };
  });

  /* ---------------- 灯光 ---------------- */
  parts.skyKey = new THREE.PointLight(0xdfe6ea, 2.0, 260, 1.1);
  parts.skyKey.position.set(CX, 40, CZ + 210);
  b.group.add(parts.skyKey);
  parts.pitFill = new THREE.PointLight(0xb8ac96, 1.05, 220, 1.2);
  parts.pitFill.position.set(CX, -40, CZ);
  b.group.add(parts.pitFill);
  parts.heroLight = new THREE.PointLight(0xffe0b8, 0, 14, 1.5);
  parts.heroLight.position.set(CX + 1.2, BOTTOM + 2.4, CZ + 3.4);
  b.group.add(parts.heroLight);

  /* ---------------- 章节运动 ---------------- */
  const state = { shovel: 0.05, heroGlow: 0 };

  function update(frame, ctx) {
    const { shot, localT, chapterLocalT, progress } = frame;
    const time = ctx?.time ?? 0;
    const dt = ctx?.dt ?? 0;
    const id = shot.id;

    /* 电铲循环：抬臂 → 铲斗下降 → 挖取 → 回转 → 卸料。
       自动循环即可 —— 工人低机位镜头的优先级高于电铲互动。 */
    const cycleSpeed = reducedMotion ? 0.15 : 0.34;
    state.shovel = (state.shovel + dt * cycleSpeed) % 1;
    const t = state.shovel;
    // 0.00-0.22 抬臂 | 0.22-0.42 铲斗下降 | 0.42-0.60 挖取 | 0.60-0.82 回转 | 0.82-1.00 卸料
    const boomAngle = t < 0.22 ? lerp(0.62, 0.72, smooth(t / 0.22, 0, 1))
      : t < 0.42 ? lerp(0.72, 0.28, smooth((t - 0.22) / 0.2, 0, 1))
        : t < 0.6 ? lerp(0.28, 0.44, smooth((t - 0.42) / 0.18, 0, 1))
          : lerp(0.44, 0.62, smooth((t - 0.6) / 0.4, 0, 1));
    parts.shovel.boomPivot.rotation.x = -boomAngle;
    const armAngle = t < 0.22 ? -0.5
      : t < 0.42 ? lerp(-0.5, 0.15, smooth((t - 0.22) / 0.2, 0, 1))
        : t < 0.6 ? lerp(0.15, 0.72, smooth((t - 0.42) / 0.18, 0, 1))
          : lerp(0.72, -0.5, smooth((t - 0.6) / 0.4, 0, 1));
    parts.shovel.armPivot.rotation.x = armAngle;
    const swing = t > 0.6 && t < 0.82 ? smooth((t - 0.6) / 0.22, 0, 1) : (t >= 0.82 ? 1 : 0);
    parts.shovel.root.rotation.y = -2.3 + swing * 0.9;

    /* 落在工人脚边之后：给一道极轻的暖光，把人从矿坑的冷灰里拉出来 */
    state.heroGlow = heroGlowAt(progress);
    parts.heroLight.intensity = state.heroGlow * 5.0;

    /* 结尾：工人抬头，Camera 顺着他的视线往上；这里只保证他真的在抬头。 */
    if (id === 'FS_06_GAZE' || id.startsWith('EN_01')) {
      const gaze = id === 'FS_06_GAZE'
        ? smooth(THREE.MathUtils.clamp((localT - 0.1) / 0.5, 0, 1), 0, 1)
        : 1;
      parts.heroWorker.root.rotation.x = lerp(-0.11, -0.16, gaze);
      parts.heroWorker.root.children.forEach((child) => {
        if (child.name.endsWith('_head')) child.rotation.x = lerp(-0.42, -0.62, gaze);
        if (child.name.endsWith('_cap')) child.rotation.x = lerp(-0.5, -0.72, gaze);
      });
    }

    /* 风沙：横向掠过坑壁，缓慢上下浮动。 */
    {
      const array = parts.pitHaze.geometry.getAttribute('position');
      parts.pitHazeSeed.forEach((seed, i) => {
        seed.x += seed.vx * dt;
        seed.y += seed.vy * dt;
        if (seed.x > 150) { seed.x = -150; seed.y = -112 + Math.random() * 108; }
        if (seed.y > 2) seed.y = -112;
        if (seed.y < -115) seed.y = 2;
        array.setXYZ(i, seed.x, seed.y, seed.z);
      });
      array.needsUpdate = true;
    }

    /* 坑壁工人：小幅动作，强调他们真的很小 */
    parts.workers.forEach((worker, index) => {
      const swing = Math.sin(time * 1.1 + index * 2.7) * 0.07;
      worker.armL.rotation.x = swing;
      worker.armR.rotation.x = -swing;
    });
  }

  function probe() {
    return { shovel: state.shovel, heroGlow: state.heroGlow };
  }

  return { builder: b, group: b.group, parts, id: 'fushun', update, probe };
}
