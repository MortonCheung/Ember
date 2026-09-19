/* ============================================================
   primitives.js — 白盒世界的共用构件工厂

   白盒阶段只用 Box / Cylinder / Cone / Plane / Lathe。
   但每一个最终资产都必须在这里有自己的 Slot —— 后面只做 Proxy → 正式模型的替换。

   材质按章节调色统一管理：
     沈阳  蓝灰 / 旧机器绿 / 混凝土灰 / 钢铁 / 少量暖光
     鞍山  黑 / 铁灰 / 锈红 / 暗褐 / 炉火橙
     抚顺  煤黑 / 土褐 / 灰黄 / 岩层 / 偏白天空
   ============================================================ */

import * as THREE from 'three';

export const PALETTE = {
  concrete: 0x8d8b84,
  concreteDark: 0x53565a,
  steel: 0x6d7276,
  steelDark: 0x3a3e42,
  machineGreen: 0x4a5a4e,
  machineBlue: 0x4c5a66,
  iron: 0x5b5754,
  rust: 0x7a4a32,
  rustDark: 0x4a2c1e,
  coal: 0x2a2724,
  earth: 0x6b5a41,
  earthLight: 0x8a7658,
  rock: 0x4b453c,
  accent: 0xe8663c,
  hotIron: 0xff7a2a,
  molten: 0xffb347,
  cloth: 0x39424f,
  clothAlt: 0x4a4438,
  skin: 0x8d6f57,
  glass: 0xa9c0c8,
  lampOff: 0x2c3033,
  lampOn: 0xffe2b0,
  paper: 0xd8cfba,
  enamel: 0xdfe3e0,
};

function standard(color, roughness = 0.85, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export class WorldBuilder {
  constructor(name = 'set') {
    this.group = new THREE.Group();
    this.group.name = name;
    this.geometries = new Set();
    this.materials = new Set();
    this.shared = new Map();
    this.animated = [];
  }

  /** 共享材质：白盒里大量构件共用同一份，避免上千个独立 material。 */
  mat(name) {
    if (!this.shared.has(name)) {
      const material = createSharedMaterial(name);
      this.shared.set(name, material);
      this.materials.add(material);
    }
    return this.shared.get(name);
  }

  /** 需要单独做动画（emissive / color / opacity）的材质必须独占，不能共享。 */
  own(material) {
    this.materials.add(material);
    return material;
  }

  track(mesh) {
    if (mesh.geometry) this.geometries.add(mesh.geometry);
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    list.forEach((material) => material && this.materials.add(material));
    return mesh;
  }

  box(name, [w, h, d], [x, y, z], materialName = 'concrete', rotationY = 0) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    this.geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, this.mat(materialName));
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  /** 圆柱默认沿 Y 轴；rotX/rotZ 用于管线的横躺与倾斜。 */
  cyl(name, { rTop, rBottom, height, seg = 14 }, [x, y, z], materialName = 'steel', rot = null) {
    const geometry = new THREE.CylinderGeometry(rTop, rBottom, height, seg);
    this.geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, this.mat(materialName));
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.set(rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  cone(name, { r, height, seg = 16, open = false }, [x, y, z], materialName = 'steel', rot = null) {
    const geometry = new THREE.ConeGeometry(r, height, seg, 1, open);
    this.geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, this.mat(materialName));
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.set(rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0);
    this.group.add(mesh);
    return mesh;
  }

  plane(name, [w, h], [x, y, z], materialName = 'concrete', rot = null) {
    const geometry = new THREE.PlaneGeometry(w, h);
    this.geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, this.mat(materialName));
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.set(rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  /** 横梁：沿 X 的长条，厂房桁架与栈桥的主力构件。 */
  beam(name, [w, h, d], [x, y, z], materialName = 'steel', rotationY = 0) {
    return this.box(name, [w, h, d], [x, y, z], materialName, rotationY);
  }

  /** 旋转体（高炉炉体、矿坑阶梯）：给一条剖面轮廓线即可。 */
  lathe(name, profile, [x, y, z], materialName = 'steel', seg = 48) {
    const points = profile.map(([radius, height]) => new THREE.Vector2(radius, height));
    const geometry = new THREE.LatheGeometry(points, seg);
    this.geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, this.mat(materialName));
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  /** 实例化重复构件（枕木、栏杆立柱、台阶）—— 这类 B 级资产绝不逐个建 mesh。 */
  instances(name, geometryFactory, transforms, materialName = 'steel') {
    const geometry = geometryFactory();
    this.geometries.add(geometry);
    const mesh = new THREE.InstancedMesh(geometry, this.mat(materialName), transforms.length);
    mesh.name = name;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    transforms.forEach((t, index) => {
      quaternion.setFromEuler(new THREE.Euler(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0));
      matrix.compose(
        new THREE.Vector3(t.x, t.y, t.z),
        quaternion,
        t.s ? new THREE.Vector3(t.s, t.s, t.s) : scale,
      );
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  /** 粒子（灰尘、火星、蒸汽）：Points 足够表达，不引入额外依赖。 */
  points(name, count, { color = 0xffffff, size = 0.06, opacity = 0.7 } = {}) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometries.add(geometry);
    const material = this.own(new THREE.PointsMaterial({
      color,
      size,
      map: roundSpriteTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.01,
    }));
    const cloud = new THREE.Points(geometry, material);
    cloud.name = name;
    cloud.frustumCulled = false;
    this.group.add(cloud);
    return cloud;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.removeFromParent();
    this.geometries.clear();
    this.materials.clear();
    this.shared.clear();
  }
}

/* 所有粒子共用的圆点 sprite：方点在高温戏里非常出戏。 */
let _sprite = null;
function roundSpriteTexture() {
  if (_sprite) return _sprite;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  _sprite = new THREE.CanvasTexture(canvas);
  _sprite.colorSpace = THREE.SRGBColorSpace;
  return _sprite;
}

function createSharedMaterial(name) {
  switch (name) {
    case 'concrete': return standard(PALETTE.concrete, 0.94, 0.02);
    case 'concreteDark': return standard(PALETTE.concreteDark, 0.9, 0.05);
    case 'steel': return standard(PALETTE.steel, 0.7, 0.35);
    case 'steelDark': return standard(PALETTE.steelDark, 0.72, 0.4);
    case 'machineGreen': return standard(PALETTE.machineGreen, 0.78, 0.2);
    case 'machineBlue': return standard(PALETTE.machineBlue, 0.76, 0.22);
    case 'iron': return standard(PALETTE.iron, 0.68, 0.42);
    case 'rust': return standard(PALETTE.rust, 0.86, 0.12);
    case 'rustDark': return standard(PALETTE.rustDark, 0.88, 0.1);
    case 'coal': return standard(PALETTE.coal, 0.95, 0.04);
    case 'earth': return standard(PALETTE.earth, 0.98, 0.0);
    case 'earthLight': return standard(PALETTE.earthLight, 0.98, 0.0);
    case 'rock': return standard(PALETTE.rock, 0.96, 0.02);
    case 'cloth': return standard(PALETTE.cloth, 0.92, 0.0);
    case 'clothAlt': return standard(PALETTE.clothAlt, 0.92, 0.0);
    case 'skin': return standard(PALETTE.skin, 0.85, 0.0);
    case 'paper': return standard(PALETTE.paper, 0.9, 0.0);
    case 'enamel': return standard(PALETTE.enamel, 0.5, 0.1);
    case 'lampOff': return standard(PALETTE.lampOff, 0.6, 0.1);
    case 'lampOn':
      return new THREE.MeshBasicMaterial({ color: PALETTE.lampOn });
    case 'glass':
      return new THREE.MeshStandardMaterial({
        color: PALETTE.glass, roughness: 0.15, metalness: 0.0,
        transparent: true, opacity: 0.28,
      });
    case 'accent': return standard(PALETTE.accent, 0.6, 0.1);
    case 'dark': return standard(0x1a1d20, 0.9, 0.05);
    case 'black': return standard(0x0c0e10, 0.95, 0.02);
    default: return standard(0x777777, 0.85, 0.05);
  }
}

/* ------------------------------------------------------------------
   Worker_Base —— 只做一个基础人体，靠 Pose / 位置 / 服装色 / 手中工具复用。
   不生成十个不同的工人模型。
   ------------------------------------------------------------------ */

export function createWorker(builder, {
  id,
  position,
  rotationY = 0,
  pose = 'operate',
  cloth = 'cloth',
  scale = 1,
} = {}) {
  const root = new THREE.Group();
  root.name = `worker_${id}`;
  root.position.set(...position);
  root.rotation.y = rotationY;
  root.scale.setScalar(scale);

  const body = builder.mat(cloth);
  const alt = builder.mat(cloth === 'cloth' ? 'clothAlt' : 'cloth');
  const skin = builder.mat('skin');

  const legGeometry = new THREE.BoxGeometry(0.19, 0.86, 0.22);
  const torsoGeometry = new THREE.BoxGeometry(0.46, 0.66, 0.3);
  const headGeometry = new THREE.SphereGeometry(0.135, 12, 10);
  const capGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12);
  const armGeometry = new THREE.BoxGeometry(0.14, 0.56, 0.16);
  const handGeometry = new THREE.BoxGeometry(0.13, 0.13, 0.13);
  [legGeometry, torsoGeometry, headGeometry, capGeometry, armGeometry, handGeometry]
    .forEach((geometry) => builder.geometries.add(geometry));

  const mk = (geometry, material, name, [x, y, z], rot = null) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  };

  mk(legGeometry, alt, `${root.name}_leg_l`, [-0.12, 0.43, 0]);
  mk(legGeometry, alt, `${root.name}_leg_r`, [0.12, 0.43, 0]);
  mk(torsoGeometry, body, `${root.name}_torso`, [0, 1.19, 0]);
  mk(headGeometry, skin, `${root.name}_head`, [0, 1.66, 0]);
  mk(capGeometry, body, `${root.name}_cap`, [0, 1.74, 0]);

  const armL = mk(armGeometry, body, `${root.name}_arm_l`, [-0.3, 1.18, 0]);
  const armR = mk(armGeometry, body, `${root.name}_arm_r`, [0.3, 1.18, 0]);
  const handL = mk(handGeometry, skin, `${root.name}_hand_l`, [-0.3, 0.88, 0]);
  const handR = mk(handGeometry, skin, `${root.name}_hand_r`, [0.3, 0.88, 0]);

  // 四种复用 Pose。抚顺的 gaze 是全片情绪 Hero，单独设计。
  if (pose === 'operate') {
    armL.rotation.set(-0.85, 0, 0.25);
    armR.rotation.set(-0.85, 0, -0.25);
    handL.position.set(-0.3, 0.96, 0.34);
    handR.position.set(0.3, 0.96, 0.34);
  } else if (pose === 'push') {
    armL.rotation.set(-1.15, 0, 0.1);
    armR.rotation.set(-1.15, 0, -0.1);
    handL.position.set(-0.3, 0.92, 0.42);
    handR.position.set(0.3, 0.92, 0.42);
    root.rotation.x = -0.08;
  } else if (pose === 'bench') {
    armL.rotation.set(-0.55, 0, 0.3);
    armR.rotation.set(-0.7, 0, -0.15);
    handL.position.set(-0.28, 1.02, 0.24);
    handR.position.set(0.3, 0.95, 0.2);
    root.rotation.x = 0.05;
  } else if (pose === 'gaze') {
    // 双手叉腰 + 身体略微后仰 + 抬头看天：身体方向与头部方向共同构成视觉箭头。
    armL.rotation.set(0.15, 0, 0.75);
    armR.rotation.set(0.15, 0, -0.75);
    handL.position.set(-0.26, 1.06, 0.06);
    handR.position.set(0.26, 1.06, 0.06);
    root.rotation.x = -0.11;
    root.children.forEach((child) => {
      if (child.name.endsWith('_head')) child.rotation.x = -0.42;
      if (child.name.endsWith('_cap')) {
        child.rotation.x = -0.5;
        child.position.set(0, 1.72, -0.03);
      }
    });
  } else if (pose === 'carry') {
    armL.rotation.set(-1.0, 0, 0.2);
    armR.rotation.set(-1.0, 0, -0.2);
    handL.position.set(-0.3, 0.94, 0.3);
    handR.position.set(0.3, 0.94, 0.3);
  }

  builder.group.add(root);
  return { root, armL, armR, handL, handR };
}

export { standard };
