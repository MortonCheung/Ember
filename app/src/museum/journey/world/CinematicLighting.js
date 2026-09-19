/* ============================================================
   CinematicLighting.js — 章节氛围、曝光与雾

   灯光不是全局常量，它跟着分镜走：
       开场  几乎全黑，只留一盏局部光
       沈阳  高窗冷光 + 铁水/工作灯暖色
       鞍山  黑暗中的高温
       抚顺  地形、深度、巨大尺度，偏白天空

   env.bloom 在白盒阶段被映射到曝光与炉火增益上（不引入 postprocessing 依赖），
   正式美术阶段再换成 pmndrs/postprocessing 的真实 Bloom。
   ============================================================ */

import * as THREE from 'three';
import { CHAPTERS } from '../storyboard.js';

const CHAPTER_COLOR = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter.color]));

export class CinematicLighting {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.background = new THREE.Color(0x0b0d10);
    this.from = new THREE.Color();
    this.to = new THREE.Color();

    this.ambient = new THREE.HemisphereLight(0xc7d4dc, 0x24272a, 1.4);
    this.key = new THREE.DirectionalLight(0xfff1d9, 1.5);
    this.key.position.set(24, 40, 28);
    // 阴影相机跟着 Camera 走：世界跨度超过 1400m，固定阴影范围必然失效。
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.left = -46;
    this.key.shadow.camera.right = 46;
    this.key.shadow.camera.top = 46;
    this.key.shadow.camera.bottom = -46;
    this.key.shadow.camera.near = 1;
    this.key.shadow.camera.far = 220;
    this.key.shadow.bias = -0.0012;

    this.fill = new THREE.DirectionalLight(0xaebcc8, 0.45);
    this.fill.position.set(-30, 16, -20);

    scene.add(this.ambient, this.key, this.fill);
    scene.fog = new THREE.Fog(0x0b0d10, 8, 60);
    scene.background = this.background;
  }

  update(frame) {
    const { env, chapterBlend, camera } = frame;

    // 章节底色：交界处 4% 的距离内完成过渡，避免背景色突变。
    const fromColor = CHAPTER_COLOR.get(chapterBlend.from) ?? 0x0b0d10;
    const toColor = CHAPTER_COLOR.get(chapterBlend.to) ?? fromColor;
    this.background.lerpColors(
      this.from.setHex(fromColor),
      this.to.setHex(toColor),
      chapterBlend.blend,
    );
    // 黑场：雾收到极短距离，一切被吞没。比摆一块黑色挡板更干净。
    const blackout = env.blackout ? 1 : 0;
    const fogNear = THREE.MathUtils.lerp(env.fog[0], 0.02, blackout);
    const fogFar = THREE.MathUtils.lerp(env.fog[1], 0.8, blackout);
    this.scene.fog.near = fogNear;
    this.scene.fog.far = fogFar;
    this.scene.fog.color.copy(this.background).multiplyScalar(1 - blackout * 0.0);

    const exposure = THREE.MathUtils.lerp(env.exposure, 0, blackout);
    this.renderer.toneMappingExposure = THREE.MathUtils.clamp(exposure, 0, 2.4);

    // 全局光的冷暖：鞍山压暗并偏橙，抚顺抬高偏灰白。
    const bloom = env.bloom ?? 0.3;
    this.ambient.intensity = THREE.MathUtils.lerp(1.45, 0.55, bloom) * (1 - blackout);
    this.key.intensity = THREE.MathUtils.lerp(1.6, 0.9, bloom) * (1 - blackout);
    this.fill.intensity = 0.45 * (1 - blackout);

    this.ambient.color.setHex(0xc7d4dc).lerp(new THREE.Color(0xffb27a), bloom * 0.8);
    this.ambient.groundColor.setHex(0x24272a).lerp(new THREE.Color(0x3a1c10), bloom * 0.7);

    // 阴影相机跟随：保证近处有影，远处不吃 shadow map。
    if (camera?.position) {
      this.key.position.set(
        camera.position.x + 26,
        camera.position.y + 42,
        camera.position.z + 30,
      );
      this.key.target.position.copy(camera.position);
      this.key.target.updateMatrixWorld();
    }
  }

  dispose() {
    this.scene.remove(this.ambient, this.key, this.fill, this.key.target);
    this.key.shadow.map?.dispose();
    this.scene.fog = null;
  }
}
