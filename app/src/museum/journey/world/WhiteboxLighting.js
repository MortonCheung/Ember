/* ============================================================
   WhiteboxLighting.js — 章节氛围光与雾的连续插值
   ============================================================ */

import * as THREE from 'three';
import { LIGHTING_STOPS } from '../data.js';

export class WhiteboxLighting {
  constructor(scene) {
    this.scene = scene;
    this.background = new THREE.Color();
    this.ambientColor = new THREE.Color();
    this.groundColor = new THREE.Color();
    this.keyColor = new THREE.Color();
    this.fromColor = new THREE.Color();
    this.toColor = new THREE.Color();

    this.ambient = new THREE.HemisphereLight(0xc7d4dc, 0x24272a, 2.15);
    this.key = new THREE.DirectionalLight(0xfff1d9, 3.8);
    this.key.position.set(10, 18, 16);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.left = -34;
    this.key.shadow.camera.right = 34;
    this.key.shadow.camera.top = 34;
    this.key.shadow.camera.bottom = -34;

    this.furnaceGlow = new THREE.PointLight(0xff7738, 0, 34, 1.7);
    this.furnaceGlow.position.set(16, 5.5, -40);

    this.exitGlow = new THREE.PointLight(0xffd7a0, 1.5, 28, 1.5);
    this.exitGlow.position.set(0, 5, -116);

    scene.add(this.ambient, this.key, this.furnaceGlow, this.exitGlow);
    scene.fog = new THREE.Fog(0x11171b, 22, 82);
    this.update(0);
  }

  update(progress) {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    let a = LIGHTING_STOPS[0];
    let b = LIGHTING_STOPS[LIGHTING_STOPS.length - 1];
    for (let i = 0; i < LIGHTING_STOPS.length - 1; i += 1) {
      if (value >= LIGHTING_STOPS[i].progress && value <= LIGHTING_STOPS[i + 1].progress) {
        a = LIGHTING_STOPS[i];
        b = LIGHTING_STOPS[i + 1];
        break;
      }
    }
    const t = THREE.MathUtils.smoothstep(value, a.progress, b.progress);

    this.background.lerpColors(this.fromColor.set(a.background), this.toColor.set(b.background), t);
    this.ambientColor.lerpColors(this.fromColor.set(a.ambient), this.toColor.set(b.ambient), t);
    this.groundColor.lerpColors(this.fromColor.set(a.ground), this.toColor.set(b.ground), t);
    this.keyColor.lerpColors(this.fromColor.set(a.key), this.toColor.set(b.key), t);

    this.scene.background.copy(this.background);
    this.scene.fog.color.copy(this.background);
    this.ambient.color.copy(this.ambientColor);
    this.ambient.groundColor.copy(this.groundColor);
    this.key.color.copy(this.keyColor);
    this.scene.fog.near = THREE.MathUtils.lerp(20, 28, Math.abs(.5 - t) * 2);
    this.scene.fog.far = THREE.MathUtils.lerp(72, 92, (value + t) * .5);

    const furnaceDistance = Math.abs(value - 0.62);
    this.furnaceGlow.intensity = THREE.MathUtils.smoothstep(0.16 - furnaceDistance, 0, 0.16) * 7;
    this.exitGlow.intensity = 1.3 + THREE.MathUtils.smoothstep(value, 0.92, 1) * 5;
  }

  dispose() {
    this.scene.remove(this.ambient, this.key, this.furnaceGlow, this.exitGlow);
    this.key.shadow.map?.dispose();
  }
}
