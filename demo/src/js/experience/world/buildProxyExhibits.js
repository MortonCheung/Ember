/* ============================================================
   buildProxyExhibits.js — 三个白盒 Hero Object 与 Notice 动画
   ============================================================ */

import * as THREE from 'three';
import { gsap } from 'gsap';

const MATERIALS = {
  body: () => new THREE.MeshStandardMaterial({ color: 0x54595a, roughness: .68, metalness: .22 }),
  detail: () => new THREE.MeshStandardMaterial({ color: 0x858783, roughness: .74, metalness: .12 }),
  accent: () => new THREE.MeshStandardMaterial({ color: 0xb95632, roughness: .62, metalness: .15 }),
};

function createBox(size, position, material, name) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function collectResources(root) {
  const geometries = new Set();
  const materials = new Set();
  root.traverse((object) => {
    if (!object.isMesh) return;
    if (object.geometry) geometries.add(object.geometry);
    const source = Array.isArray(object.material) ? object.material : [object.material];
    source.forEach((material) => material && materials.add(material));
  });
  return { geometries, materials };
}

function buildLathe(reducedMotion) {
  const root = new THREE.Group();
  root.name = 'proxy_lathe';
  root.position.set(-16, 0, -3);
  root.rotation.y = -.08;

  const body = MATERIALS.body();
  const detail = MATERIALS.detail();
  const accent = MATERIALS.accent();
  const bed = createBox([6.8, .65, 1.7], [0, .72, 0], body, 'proxy_lathe_bed');
  const baseA = createBox([1.5, .8, 1.35], [-2.15, .25, 0], body, 'proxy_lathe_base_a');
  const baseB = createBox([1.3, .8, 1.35], [2.15, .25, 0], body, 'proxy_lathe_base_b');
  const head = createBox([1.6, 2.1, 1.55], [-2.35, 1.9, 0], body, 'proxy_lathe_head');
  const carriage = createBox([1.15, 1.05, 1.95], [-.1, 1.5, 0], accent, 'proxy_lathe_carriage');
  const tail = createBox([1.25, 1.55, 1.35], [2.25, 1.62, 0], detail, 'proxy_lathe_tail');
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 3.5, 16), detail);
  spindle.name = 'proxy_lathe_spindle';
  spindle.rotation.z = Math.PI / 2;
  spindle.position.set(.25, 2.15, 0);
  spindle.castShadow = true;
  root.add(bed, baseA, baseB, head, carriage, tail, spindle);

  const rest = new Map([
    [head, head.position.clone()],
    [carriage, carriage.position.clone()],
    [tail, tail.position.clone()],
  ]);
  let cue = null;

  function reset() {
    cue?.kill();
    cue = null;
    rest.forEach((position, part) => part.position.copy(position));
  }

  function playNotice() {
    reset();
    if (reducedMotion) {
      cue = gsap.timeline().to(accent, { emissiveIntensity: .7, duration: .12, yoyo: true, repeat: 1 });
      accent.emissive.set(0xb95632);
      return;
    }
    cue = gsap.timeline({ defaults: { duration: .3, ease: 'power2.inOut' } })
      .to(head.position, { x: '-=.13' }, 0)
      .to(carriage.position, { z: '+=.12' }, 0)
      .to(tail.position, { x: '+=.15' }, 0)
      .to(head.position, { x: rest.get(head).x }, '+=.08')
      .to(carriage.position, { z: rest.get(carriage).z }, '<')
      .to(tail.position, { x: rest.get(tail).x }, '<');
  }

  return {
    root,
    pickTargets: [bed, head, carriage, tail, spindle],
    playNotice,
    resetNotice: reset,
    dispose() {
      reset();
      const resources = collectResources(root);
      resources.geometries.forEach((item) => item.dispose());
      resources.materials.forEach((item) => item.dispose());
    },
  };
}

function buildFurnace(reducedMotion) {
  const root = new THREE.Group();
  root.name = 'proxy_furnace';
  root.position.set(16, 0, -40);

  const body = MATERIALS.body();
  const detail = MATERIALS.detail();
  const accent = MATERIALS.accent();
  accent.emissive.set(0xb95632);
  accent.emissiveIntensity = .08;

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.6, 5.5, 24), body);
  lower.name = 'proxy_furnace_lower';
  lower.position.y = 3;
  const middle = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.15, 3.8, 24), body);
  middle.name = 'proxy_furnace_middle';
  middle.position.y = 7.65;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.6, 24, 1, true), detail);
  crown.name = 'proxy_furnace_crown';
  crown.position.y = 11.35;
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, .3, 24), accent);
  mouth.name = 'proxy_furnace_mouth';
  mouth.position.y = 9.5;
  mouth.rotation.x = Math.PI / 2;
  mouth.position.z = 2.65;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 8.4, 12), detail);
  pipe.name = 'proxy_furnace_pipe';
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(-4.6, 8.3, 0);
  const platform = new THREE.Mesh(new THREE.TorusGeometry(3.65, .16, 8, 28), detail);
  platform.name = 'proxy_furnace_platform';
  platform.rotation.x = Math.PI / 2;
  platform.position.y = 8.1;
  [lower, middle, crown, mouth, pipe, platform].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
  const glow = new THREE.PointLight(0xff783c, .4, 22, 1.8);
  glow.position.set(0, 9.3, 2.2);
  root.add(lower, middle, crown, mouth, pipe, platform, glow);

  let cue = null;
  function reset() {
    cue?.kill();
    cue = null;
    glow.intensity = .4;
    accent.emissiveIntensity = .08;
  }

  function playNotice() {
    reset();
    const duration = reducedMotion ? .12 : .8;
    cue = gsap.timeline()
      .to(glow, { intensity: reducedMotion ? 2 : 8, duration, ease: 'sine.inOut' }, 0)
      .to(accent, { emissiveIntensity: reducedMotion ? .35 : 1.4, duration, ease: 'sine.inOut' }, 0)
      .to(glow, { intensity: .4, duration, ease: 'sine.inOut' })
      .to(accent, { emissiveIntensity: .08, duration, ease: 'sine.inOut' }, '<');
  }

  return {
    root,
    pickTargets: [lower, middle, crown, mouth, pipe, platform],
    playNotice,
    resetNotice: reset,
    dispose() {
      reset();
      const resources = collectResources(root);
      resources.geometries.forEach((item) => item.dispose());
      resources.materials.forEach((item) => item.dispose());
    },
  };
}

function buildMine(reducedMotion) {
  const root = new THREE.Group();
  root.name = 'proxy_mine';
  root.position.set(-16, -.9, -80);
  root.rotation.y = .12;

  const body = MATERIALS.body();
  const detail = MATERIALS.detail();
  const accent = MATERIALS.accent();
  const base = createBox([7.8, 1.3, 4.6], [0, .7, 0], body, 'proxy_mine_base');
  const cabin = createBox([3.2, 2.6, 3.4], [-1.45, 2.55, 0], detail, 'proxy_mine_cabin');
  const armA = createBox([5.4, .72, .82], [2.15, 3.05, 0], body, 'proxy_mine_arm_a');
  armA.rotation.z = -.32;
  const armB = createBox([3.2, .65, .75], [5.6, 2.15, 0], body, 'proxy_mine_arm_b');
  armB.rotation.z = .38;
  const bucket = createBox([2.3, 1.45, 2.5], [7.15, 1.1, 0], accent, 'proxy_mine_bucket');
  bucket.rotation.z = -.18;
  const wheelGeometry = new THREE.CylinderGeometry(1.05, 1.05, .6, 18);
  const wheels = [];
  for (const x of [-2.35, 2.35]) {
    for (const z of [-2.05, 2.05]) {
      const wheel = new THREE.Mesh(wheelGeometry, detail);
      wheel.position.set(x, .75, z);
      wheel.rotation.x = Math.PI / 2;
      wheel.castShadow = true;
      wheels.push(wheel);
      root.add(wheel);
    }
  }
  const scanMaterial = new THREE.MeshBasicMaterial({
    color: 0xd37a51,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const scan = createBox([10.5, .045, 6], [1.2, .15, 0], scanMaterial, 'proxy_mine_scan');
  scan.visible = false;
  root.add(base, cabin, armA, armB, bucket, scan);

  let cue = null;
  function reset() {
    cue?.kill();
    cue = null;
    scan.visible = false;
    scan.position.y = .15;
    scanMaterial.opacity = 0;
  }

  function playNotice() {
    reset();
    scan.visible = true;
    const duration = reducedMotion ? .16 : .7;
    cue = gsap.timeline({ onComplete: () => { scan.visible = false; } })
      .to(scanMaterial, { opacity: reducedMotion ? .45 : .72, duration: duration * .35 }, 0)
      .to(scan.position, { y: reducedMotion ? .6 : 4.6, duration, ease: 'power1.inOut' }, 0)
      .to(scanMaterial, { opacity: 0, duration: duration * .35 }, duration * .65);
  }

  return {
    root,
    pickTargets: [base, cabin, armA, armB, bucket, ...wheels],
    playNotice,
    resetNotice: reset,
    dispose() {
      reset();
      const resources = collectResources(root);
      resources.geometries.forEach((item) => item.dispose());
      resources.materials.forEach((item) => item.dispose());
    },
  };
}

export function buildProxyExhibits({ exhibits, reducedMotion = false }) {
  const group = new THREE.Group();
  group.name = 'proxy_exhibits';
  const builders = {
    lathe: buildLathe,
    furnace: buildFurnace,
    mine: buildMine,
  };
  const entries = new Map();

  for (const data of exhibits) {
    const built = builders[data.id](reducedMotion);
    group.add(built.root);
    entries.set(data.id, { ...built, data });
  }

  return {
    group,
    exhibits: entries,
    update() {},
    dispose() {
      entries.forEach((entry) => entry.dispose());
      group.removeFromParent();
    },
  };
}
