/* ============================================================
   buildOpeningSet.js — 开场工业极近景蒙太奇

   开场不使用宏大航拍，不展示完整厂房，不急着告诉用户这是哪里。
   全部使用：工业极近景 + 黑场 + 声音 + 光影。

   全部是 Box / Cylinder / Cone 占位，但每一个都有明确的 Slot：
   后面只做 Proxy → 正式模型替换，不再改空间与镜头。

   坐标：本机位组沿 -Z 排布在 Z ∈ [0, -19]，厂房大门在 Z=-30（属沈阳 Set）。
   ============================================================ */

import * as THREE from 'three';
import { WorldBuilder, PALETTE } from '../primitives.js';

// 定位式调用（dt=0：Debug setShot / Explore 返回）必须一步到位——
// damp 在 dt=0 时是恒等映射，会让门、炉温这类状态停在初始值。
const damp = (current, target, lambda, dt) => (
  dt > 0 ? THREE.MathUtils.damp(current, target, lambda, dt) : target
);

export function buildOpeningSet({ reducedMotion = false } = {}) {
  const b = new WorldBuilder('set_opening');
  const parts = {};

  /* ---- OP-01 老式工业开关 ---- */
  b.box('op_switch_panel', [1.5, 1.3, 0.14], [0, 1.45, -0.09], 'steelDark');
  b.box('op_switch_box', [0.36, 0.52, 0.18], [0, 1.45, 0.02], 'iron');
  parts.lever = b.box('op_switch_lever', [0.09, 0.22, 0.1], [0, 1.56, 0.13], 'accent');
  parts.leverPivot = new THREE.Group();
  parts.leverPivot.name = 'op_switch_lever_pivot';
  parts.leverPivot.position.set(0, 1.46, 0.1);
  b.group.add(parts.leverPivot);
  parts.lever.position.set(0, 0.1, 0.03);
  parts.leverPivot.add(parts.lever);
  b.box('op_switch_plate', [1.6, 0.06, 0.06], [0, 1.05, 0.02], 'steelDark');

  // 戴工装手套的手：只做一只，从画外进入按下开关。
  parts.hand = new THREE.Group();
  parts.hand.name = 'op_hand';
  const gloveGeo = new THREE.BoxGeometry(0.17, 0.13, 0.22);
  const cuffGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.24, 10);
  b.geometries.add(gloveGeo, cuffGeo);
  const glove = new THREE.Mesh(gloveGeo, b.mat('cloth'));
  glove.name = 'op_hand_glove';
  const cuff = new THREE.Mesh(cuffGeo, b.mat('clothAlt'));
  cuff.name = 'op_hand_cuff';
  cuff.rotation.x = Math.PI / 2;
  cuff.position.z = -0.22;
  parts.hand.add(glove, cuff);
  parts.hand.position.set(0.95, 0.95, 0.85);
  b.group.add(parts.hand);

  /* ---- OP-02 高悬工业灯 ---- */
  b.cyl('op_lamp_rod', { rTop: 0.03, rBottom: 0.03, height: 0.9 }, [0, 6.05, -3], 'steelDark');
  parts.lampShade = b.cone(
    'op_lamp_shade', { r: 0.58, height: 0.52, seg: 18, open: true },
    [0, 5.42, -3], 'steelDark', [Math.PI, 0, 0],
  );
  const bulbGeo = new THREE.SphereGeometry(0.13, 12, 10);
  b.geometries.add(bulbGeo);
  parts.lampBulbMat = b.own(new THREE.MeshBasicMaterial({ color: PALETTE.lampOff }));
  parts.lampBulb = new THREE.Mesh(bulbGeo, parts.lampBulbMat);
  parts.lampBulb.name = 'op_lamp_bulb';
  parts.lampBulb.position.set(0, 5.2, -3);
  b.group.add(parts.lampBulb);
  // 只照亮：灯罩、空气中的灰尘、一小部分钢结构 —— 不是整个厂房。
  b.beam('op_lamp_beam_a', [0.26, 0.26, 3.4], [1.5, 6.2, -3.9], 'steel');
  b.beam('op_lamp_beam_b', [0.18, 0.18, 2.2], [-1.9, 5.9, -3.2], 'steel');
  parts.dust = b.points('op_dust', 120, { color: 0xd8cfba, size: 0.035, opacity: 0.55 });
  parts.dustSeed = Array.from({ length: 120 }, () => ({
    x: (Math.random() - 0.5) * 2.6,
    y: Math.random() * 2.4,
    z: (Math.random() - 0.5) * 2.2,
    speed: 0.06 + Math.random() * 0.12,
  }));

  /* ---- OP-03 C620-1 主轴 ---- */
  parts.spindlePivot = new THREE.Group();
  parts.spindlePivot.name = 'op_spindle_pivot';
  parts.spindlePivot.position.set(0, 1.15, -6);
  b.group.add(parts.spindlePivot);
  const spindleGeo = new THREE.CylinderGeometry(0.27, 0.27, 1.25, 20);
  const chuckGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.22, 20);
  b.geometries.add(spindleGeo, chuckGeo);
  const spindle = new THREE.Mesh(spindleGeo, b.mat('steel'));
  spindle.name = 'op_spindle';
  spindle.rotation.x = Math.PI / 2;
  spindle.castShadow = true;
  const chuck = new THREE.Mesh(chuckGeo, b.mat('iron'));
  chuck.name = 'op_spindle_chuck';
  chuck.rotation.x = Math.PI / 2;
  chuck.position.z = 0.62;
  chuck.castShadow = true;
  // 一道高光条：主轴旋转时 metal 反光从镜头上掠过，靠它读出来。
  parts.spindleHighlight = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.035, 1.2),
    b.own(new THREE.MeshBasicMaterial({ color: 0xd9e2e6 })),
  );
  b.geometries.add(parts.spindleHighlight.geometry);
  parts.spindleHighlight.name = 'op_spindle_highlight';
  parts.spindleHighlight.position.set(0.27, 0, 0);
  parts.spindlePivot.add(spindle, chuck, parts.spindleHighlight);
  b.box('op_spindle_housing', [1.5, 1.1, 1.2], [0, 0.55, -6.9], 'machineGreen');
  b.box('op_spindle_base', [2.2, 0.3, 1.6], [0, 0.15, -6.9], 'concreteDark');

  /* ---- OP-04 钢缆与吊钩 ---- */
  const cableGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 8);
  b.geometries.add(cableGeo);
  parts.cable = new THREE.Mesh(cableGeo, b.mat('steel'));
  parts.cable.name = 'op_cable';
  parts.cable.position.set(0, 5.5, -9);
  b.group.add(parts.cable);
  parts.hook = new THREE.Group();
  parts.hook.name = 'op_hook';
  parts.hook.position.set(0, 3.6, -9);
  b.group.add(parts.hook);
  const hookBody = b.box('op_hook_body', [0.16, 0.42, 0.16], [0, 0, 0], 'iron');
  const hookTip = b.cone('op_hook_tip', { r: 0.13, height: 0.34, seg: 10 }, [0, -0.32, 0], 'iron', [Math.PI, 0, 0]);
  parts.hook.add(hookBody, hookTip);
  b.box('op_crane_rail', [0.3, 0.24, 3.2], [0, 7.1, -9], 'steel');
  b.box('op_crane_block', [0.5, 0.34, 0.5], [0, 6.85, -9], 'steelDark');

  /* ---- OP-05 浇包与铁水 ---- */
  b.cyl('op_ladle_body', { rTop: 0.9, rBottom: 0.62, height: 1.1 }, [0, 1.55, -12], 'iron');
  b.cyl('op_ladle_rim', { rTop: 0.93, rBottom: 0.93, height: 0.12 }, [0, 2.14, -12], 'rust');
  const hotGeo = new THREE.CylinderGeometry(0.86, 0.86, 0.05, 24);
  b.geometries.add(hotGeo);
  parts.hotMat = b.own(new THREE.MeshBasicMaterial({ color: PALETTE.molten }));
  parts.hotSurface = new THREE.Mesh(hotGeo, parts.hotMat);
  parts.hotSurface.name = 'op_iron_surface';
  parts.hotSurface.position.set(0, 2.17, -12);
  b.group.add(parts.hotSurface);
  // 越过包沿的那一股铁水：靠 scale.y 生长，配一声 pour_hiss。
  const spillGeo = new THREE.CylinderGeometry(0.09, 0.13, 1, 10);
  b.geometries.add(spillGeo);
  parts.spill = new THREE.Mesh(spillGeo, parts.hotMat);
  parts.spill.name = 'op_iron_spill';
  parts.spill.position.set(-0.55, 1.9, -12.05);
  parts.spill.rotation.z = 0.22;
  b.group.add(parts.spill);
  b.cyl('op_ladle_bail', { rTop: 0.03, rBottom: 0.03, height: 1.6 }, [0, 2.7, -12], 'steelDark', [0, 0, 0]);
  b.box('op_ladle_yoke', [0.1, 0.1, 1.3], [0, 3.4, -12], 'steelDark');

  /* ---- OP-06 游标卡尺 ---- */
  b.box('op_caliper_beam', [1.0, 0.06, 0.05], [0, 1.02, -15], 'steel');
  b.box('op_caliper_jaw_fixed', [0.05, 0.18, 0.06], [-0.45, 0.92, -15], 'steel');
  parts.caliperJaw = b.box('op_caliper_jaw_moving', [0.05, 0.18, 0.06], [0.42, 0.92, -15], 'steel');
  b.box('op_caliper_scale', [0.7, 0.03, 0.02], [0.05, 1.06, -15.02], 'enamel');
  const partGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.34, 16);
  b.geometries.add(partGeo);
  const piece = new THREE.Mesh(partGeo, b.mat('iron'));
  piece.name = 'op_caliper_piece';
  piece.rotation.z = Math.PI / 2;
  piece.position.set(-0.02, 0.95, -15);
  piece.castShadow = true;
  b.group.add(piece);
  b.box('op_caliper_table', [1.4, 0.08, 0.7], [0, 0.62, -15.2], 'concreteDark');

  /* ---- OP-07 车轮与钢轨 ---- */
  b.box('op_rail_l', [0.13, 0.16, 4.2], [-0.72, 0.14, -18], 'steel');
  b.box('op_rail_r', [0.13, 0.16, 4.2], [0.72, 0.14, -18], 'steel');
  b.box('op_sleeper', [2.4, 0.12, 0.32], [0, 0.05, -18], 'rustDark');
  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.14, 22);
  b.geometries.add(wheelGeo);
  parts.wheel = new THREE.Mesh(wheelGeo, b.mat('iron'));
  parts.wheel.name = 'op_wheel';
  parts.wheel.position.set(-0.72, 0.46, -18);
  parts.wheel.rotation.z = Math.PI / 2;
  parts.wheel.castShadow = true;
  b.group.add(parts.wheel);
  b.box('op_wheel_axle', [1.7, 0.1, 0.1], [0, 0.46, -18], 'steelDark');
  b.box('op_wheel_bogie', [1.6, 0.5, 1.0], [0, 0.85, -17.2], 'rustDark');

  /* ---- 灯光：两盏复用，按机位移动，避免给每个机位点一盏灯 ---- */
  parts.key = new THREE.PointLight(0xffe6c0, 0, 9, 1.9);
  parts.key.name = 'op_key';
  parts.key.position.set(0.3, 2.2, 0.6);
  b.group.add(parts.key);
  parts.hot = new THREE.PointLight(PALETTE.hotIron, 0, 8, 2.0);
  parts.hot.name = 'op_iron_light';
  parts.hot.position.set(0, 2.4, -12);
  b.group.add(parts.hot);

  /* 每个机位的打光方案：位置 / 强度 / 色温。改镜头时这里要跟着改。 */
  const KEY_RIGS = {
    OP_01_SWITCH: { position: [0.45, 2.05, 0.75], intensity: 2.4, color: 0xffdca8 },
    OP_02_LAMP: { position: [0.2, 5.05, -2.5], intensity: 9.0, color: 0xffd9a0 },
    OP_03_SPINDLE: { position: [0.55, 1.7, -5.4], intensity: 3.2, color: 0xdfe8ee },
    OP_04_CABLE: { position: [1.1, 4.4, -8.2], intensity: 3.0, color: 0xd8e2e8 },
    OP_05_IRON: { position: [0.1, 2.9, -11.4], intensity: 2.2, color: 0xffb070 },
    OP_06_CALIPER: { position: [0.35, 1.5, -14.4], intensity: 3.0, color: 0xe4e8ea },
    OP_07_WHEEL: { position: [1.3, 1.0, -17.1], intensity: 2.6, color: 0xd6dee2 },
    OP_08_TITLE: { position: [0, 1.7, -19], intensity: 0, color: 0x000000 },
    OP_09_DOOR: { position: [0, 2.4, -18], intensity: 1.4, color: 0xc8d4dc },
  };

  const state = {
    spindleSpin: 0,
    hookSwing: 0,
    hookEnergy: 0,
    wheelSpin: 0,
    wheelHit: 0,
    lampFlicker: 0,
  };

  function update(frame, ctx) {
    const { shot, localT } = frame;
    const time = ctx?.time ?? 0;
    const dt = ctx?.dt ?? 0;
    const id = shot.id;

    // 打光：机位切换时把复用灯挪过去。
    const rig = KEY_RIGS[id] ?? KEY_RIGS.OP_09_DOOR;
    parts.key.position.set(...rig.position);
    parts.key.color.setHex(rig.color);
    parts.key.intensity = rig.intensity;
    parts.hot.intensity = 0;

    // ---- OP-01 手按下开关 ----
    if (id === 'OP_01_SWITCH') {
      const reach = THREE.MathUtils.clamp((localT - 0.12) / 0.34, 0, 1);
      const eased = THREE.MathUtils.smoothstep(reach, 0, 1);
      parts.hand.position.set(
        THREE.MathUtils.lerp(0.95, 0.06, eased),
        THREE.MathUtils.lerp(0.95, 1.52, eased),
        THREE.MathUtils.lerp(0.85, 0.2, eased),
      );
      parts.hand.rotation.z = THREE.MathUtils.lerp(-0.5, -0.12, eased);
      const press = THREE.MathUtils.clamp((localT - 0.48) / 0.14, 0, 1);
      parts.leverPivot.rotation.x = THREE.MathUtils.lerp(0, -0.62, THREE.MathUtils.smoothstep(press, 0, 1));
    } else {
      parts.leverPivot.rotation.x = -0.62;
      parts.hand.visible = false;
    }

    // ---- OP-02 灯闪两下后亮起 ----
    if (id === 'OP_02_LAMP') {
      const flicker = localT < 0.42
        ? (Math.sin(localT * 62) > 0.1 ? 1 : 0.08)
        : 1;
      state.lampFlicker = damp(state.lampFlicker, flicker, 24, dt);
      parts.lampBulbMat.color.setHex(0x000000).lerp(
        new THREE.Color(PALETTE.lampOn), state.lampFlicker,
      );
      parts.key.intensity = rig.intensity * state.lampFlicker;
      // 灰尘在光柱里飘。
      const array = parts.dust.geometry.getAttribute('position');
      parts.dustSeed.forEach((seed, i) => {
        seed.y += seed.speed * dt;
        if (seed.y > 2.6) seed.y = 0;
        array.setXYZ(i, seed.x, 4.2 + seed.y, -3 + seed.z);
      });
      array.needsUpdate = true;
      parts.dust.visible = true;
    } else {
      parts.lampBulbMat.color.setHex(state.lampFlicker > 0.5 ? PALETTE.lampOn : PALETTE.lampOff);
      parts.dust.visible = false;
    }

    // ---- OP-03 主轴突然旋转 ----
    if (id === 'OP_03_SPINDLE') {
      const spin = localT < 0.34 ? 0 : THREE.MathUtils.smoothstep((localT - 0.34) / 0.4, 0, 1);
      state.spindleSpin += spin * 15 * dt;
      parts.spindlePivot.rotation.z = state.spindleSpin;
    } else {
      parts.spindlePivot.rotation.z = state.spindleSpin;
    }

    // ---- OP-04 钢缆松弛 → 绷紧 → 吊钩摆动 ----
    if (id === 'OP_04_CABLE') {
      const tension = THREE.MathUtils.smoothstep(
        THREE.MathUtils.clamp((localT - 0.26) / 0.16, 0, 1), 0, 1,
      );
      // 松弛时钢缆更长且带弧垂，绷紧后拉直。
      const length = THREE.MathUtils.lerp(2.15, 1.9, tension);
      parts.cable.scale.y = length;
      parts.cable.position.y = 7.05 - length / 2;
      parts.cable.rotation.z = (1 - tension) * 0.09 * Math.sin(time * 1.6);
      if (tension > 0.9) state.hookEnergy = Math.max(state.hookEnergy, 1);
      state.hookEnergy = damp(state.hookEnergy, 0, 0.9, dt);
      state.hookSwing += dt * 2.4;
      parts.hook.rotation.z = Math.sin(state.hookSwing) * 0.22 * state.hookEnergy;
      parts.hook.position.y = THREE.MathUtils.lerp(3.35, 3.6, tension);
    }

    // ---- OP-05 铁水越过包沿，照亮工人半张脸 ----
    if (id === 'OP_05_IRON') {
      const rise = THREE.MathUtils.clamp((localT - 0.18) / 0.34, 0, 1);
      parts.hotSurface.position.y = THREE.MathUtils.lerp(1.92, 2.19, rise);
      const spill = THREE.MathUtils.clamp((localT - 0.42) / 0.3, 0, 1);
      parts.spill.scale.y = Math.max(0.001, spill * 1.5);
      parts.spill.position.y = 2.1 - spill * 0.75;
      parts.spill.visible = spill > 0.02;
      parts.hot.intensity = 6.5 * rise + 3.2 * spill;
      const pulse = 0.85 + Math.sin(time * 5.4) * 0.15;
      parts.hotMat.color.setHex(PALETTE.molten).multiplyScalar(pulse);
    } else {
      parts.spill.visible = false;
      parts.hotSurface.position.y = 2.17;
    }

    // ---- OP-06 卡尺夹紧：一声「咔」 ----
    if (id === 'OP_06_CALIPER') {
      const close = THREE.MathUtils.clamp((localT - 0.16) / 0.34, 0, 1);
      const eased = THREE.MathUtils.smoothstep(close, 0, 1);
      const snap = localT > 0.5 ? Math.sin((localT - 0.5) * 90) * Math.exp(-(localT - 0.5) * 26) * 0.012 : 0;
      parts.caliperJaw.position.x = THREE.MathUtils.lerp(0.42, -0.1, eased) + snap;
    }

    // ---- OP-07 车轮压上钢轨 ----
    if (id === 'OP_07_WHEEL') {
      state.wheelSpin += dt * 5.6;
      parts.wheel.rotation.y = state.wheelSpin;
      const hit = localT > 0.3 && localT < 0.46 ? Math.sin((localT - 0.3) * 70) * Math.exp(-(localT - 0.3) * 20) : 0;
      parts.wheel.position.y = 0.46 + Math.abs(hit) * 0.03;
      parts.key.intensity = rig.intensity * (1 + Math.abs(hit) * 0.8);
    }

    // ---- OP-08 / EN-03 黑场：灯全灭，黑场由 env.fog 完成 ----
    if (id === 'OP_08_TITLE' || id === 'EN_03_TITLE') {
      parts.key.intensity = 0;
      parts.hot.intensity = 0;
    }

    // ---- 闪回：复用开场机位，但更短 ----
    if (id.startsWith('EN_02')) {
      parts.hand.visible = false;
      if (id === 'EN_02A_FLASH_SPINDLE') {
        state.spindleSpin += dt * 16;
        parts.spindlePivot.rotation.z = state.spindleSpin;
      }
      if (id === 'EN_02C_FLASH_IRON') {
        parts.hot.intensity = 7.5;
        parts.spill.visible = true;
        parts.spill.scale.y = 1.3;
        parts.spill.position.y = 1.42;
      }
      if (id === 'EN_02D_FLASH_WHEEL') {
        state.wheelSpin += dt * 7;
        parts.wheel.rotation.y = state.wheelSpin;
      }
    }

    if (reducedMotion) {
      parts.key.intensity = Math.min(parts.key.intensity, 4);
    }
  }

  return { builder: b, group: b.group, parts, id: 'opening', update };
}
