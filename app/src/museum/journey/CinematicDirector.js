/* ============================================================
   CinematicDirector.js — 整部电影的主 Playhead

   ScrollTrigger 只给一个 0~1 的 scrollY。
   这个数字本身没有意义，是导演把它翻译成：
       现在是哪一个 Shot → 这个 Shot 走到几分几秒（localT）
       → Camera 在哪 → 世界做到哪 → 文字出现到哪 → 光到哪

   设计约束：
   · 纯查表 + 插值，不持有任何场景对象。
   · 一切都是 progress 的函数，所以反向滚动天然可用（不需要反向动画）。
   · 硬切（cut）不参与平滑：跨 cut 边界必须瞬间到位，否则蒙太奇会被抹成滑行。
   ============================================================ */

import * as THREE from 'three';
import { SHOTS, SHOT_RANGES, CHAPTER_RANGES } from './storyboard.js';

const DEFAULT_ENV = { fog: [8, 60], exposure: 1.0, bloom: 0.3, blackout: false };
const smoothstep = (value) => value * value * (3 - 2 * value);

function lerpEnv(from, to, k) {
  const a = from ?? DEFAULT_ENV;
  const b = to ?? DEFAULT_ENV;
  const fogA = a.fog ?? DEFAULT_ENV.fog;
  const fogB = b.fog ?? DEFAULT_ENV.fog;
  return {
    fog: [
      THREE.MathUtils.lerp(fogA[0], fogB[0], k),
      THREE.MathUtils.lerp(fogA[1], fogB[1], k),
    ],
    exposure: THREE.MathUtils.lerp(a.exposure ?? 1, b.exposure ?? 1, k),
    bloom: THREE.MathUtils.lerp(a.bloom ?? 0.3, b.bloom ?? 0.3, k),
    blackout: k > 0.5 ? Boolean(b.blackout) : Boolean(a.blackout),
  };
}

export class CinematicDirector {
  constructor({ cameraRig, reducedMotion = false }) {
    this.cameraRig = cameraRig;
    this.reducedMotion = reducedMotion;
    this.smoothedPosition = new THREE.Vector3();
    this.smoothedTarget = new THREE.Vector3();
    this.smoothedFov = 52;
    this.primed = false;
    this.lastIndex = -1;
    this.state = {
      index: 0,
      shot: SHOTS[0],
      localT: 0,
      progress: 0,
      chapter: SHOTS[0].chapter,
      chapterLocalT: 0,
      env: { ...DEFAULT_ENV },
      caption: null,
      interactive: null,
    };
  }

  static indexAt(progress) {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    // 线性扫描：49 个镜头，每帧一次，成本可忽略；二分查找在这里是过度设计。
    for (let i = 0; i < SHOT_RANGES.length; i += 1) {
      if (value <= SHOT_RANGES[i].end) return i;
    }
    return SHOT_RANGES.length - 1;
  }

  static localTAt(index, progress) {
    const range = SHOT_RANGES[index];
    const span = range.end - range.start;
    if (span <= 0) return 0;
    return THREE.MathUtils.clamp((progress - range.start) / span, 0, 1);
  }

  static progressOf(shotId, localT = 0) {
    const index = SHOTS.findIndex((shot) => shot.id === shotId);
    if (index < 0) return null;
    const range = SHOT_RANGES[index];
    return THREE.MathUtils.clamp(
      range.start + (range.end - range.start) * THREE.MathUtils.clamp(localT, 0, 1),
      0,
      1,
    );
  }

  /* ---- 环境：cut 处硬切，连续镜头在边界极短距离内过渡 ---- */
  getEnv(index, progress) {
    const shot = SHOTS[index];
    const range = SHOT_RANGES[index];
    const span = Math.max(range.end - range.start, 1e-6);
    // 硬切只给 0.4% 的过渡，几乎是瞬间；连续镜头给镜头时长的 25%（上限 2%）。
    const blend = shot.cut ? 0.004 : Math.min(0.02, span * 0.25);
    const local = (progress - range.start) / span;
    const blendLocal = blend / span;
    const previous = index > 0 ? SHOTS[index - 1] : null;
    if (previous && local < blendLocal) {
      return lerpEnv(previous.env, shot.env, smoothstep(local / blendLocal));
    }
    return lerpEnv(shot.env, shot.env, 1);
  }

  /* ---- Cinematic Caption：随镜头离开而消失，不做常驻卡片 ---- */
  getCaption(shot, localT) {
    if (!shot.caption || !shot.caption.length) return null;
    for (const entry of shot.caption) {
      const [start, end] = entry.t;
      if (localT < start || localT > end) continue;
      const span = Math.max(end - start, 1e-6);
      const fade = Math.min(0.18, span * 0.4);
      const alpha = Math.min(
        smoothstep(THREE.MathUtils.clamp((localT - start) / fade, 0, 1)),
        smoothstep(THREE.MathUtils.clamp((end - localT) / fade, 0, 1)),
      );
      return { text: entry.text, alpha, place: entry.place ?? 'bottom' };
    }
    return null;
  }

  getInteractive(shot, localT) {
    if (!shot.interactive) return null;
    const notice = shot.notice ?? [0.2, 0.9];
    if (localT < notice[0] || localT > notice[1]) return null;
    return { id: shot.interactive, shotId: shot.id, localT };
  }

  getChapterState(chapterId, progress) {
    const index = CHAPTER_RANGES.findIndex((entry) => entry.id === chapterId);
    if (index < 0) return { localT: 0, from: chapterId, to: chapterId, blend: 0 };
    const range = CHAPTER_RANGES[index];
    const span = Math.max(range.end - range.start, 1e-6);
    const localT = THREE.MathUtils.clamp((progress - range.start) / span, 0, 1);
    // 章节换色在交界处 4% 的距离内完成，避免背景色突变。
    const edge = 0.04;
    const next = CHAPTER_RANGES[index + 1];
    if (next && localT > 1 - edge) {
      return { localT, from: chapterId, to: next.id, blend: smoothstep((localT - (1 - edge)) / edge) };
    }
    return { localT, from: chapterId, to: chapterId, blend: 0 };
  }

  /**
   * 推进一帧。返回 frame 交给 Experience 分发给 Camera / World / Text / Light。
   * dt 为 0（或定位式调用）时不做平滑，直接到位。
   */
  update(progress, dt = 0) {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    const index = CinematicDirector.indexAt(value);
    const shot = SHOTS[index];
    const localT = CinematicDirector.localTAt(index, value);
    const isCut = this.primed && index !== this.lastIndex && shot.cut;
    const pose = this.cameraRig.getShotPose(shot, localT);

    if (!this.primed || isCut || this.reducedMotion || dt <= 0) {
      this.smoothedPosition.copy(pose.position);
      this.smoothedTarget.copy(pose.target);
      this.smoothedFov = pose.fov;
      this.primed = true;
    } else {
      // 只吸收数值抖动与极短的跨镜切线差，不做「电影感缓动」——那是分镜表的事。
      const k = 1 - Math.exp(-34 * Math.min(dt, 0.05));
      this.smoothedPosition.lerp(pose.position, k);
      this.smoothedTarget.lerp(pose.target, k);
      this.smoothedFov = THREE.MathUtils.lerp(this.smoothedFov, pose.fov, k);
    }
    this.lastIndex = index;

    const env = this.getEnv(index, value);
    const chapterState = this.getChapterState(shot.chapter, value);

    this.state = {
      index,
      shot,
      localT,
      progress: value,
      chapter: shot.chapter,
      chapterLocalT: chapterState.localT,
      chapterBlend: chapterState,
      isCut,
      env,
      caption: this.getCaption(shot, localT),
      interactive: this.getInteractive(shot, localT),
      camera: {
        position: this.smoothedPosition,
        target: this.smoothedTarget,
        fov: this.smoothedFov,
        // 未经平滑的读数，给 Debug 与自动验收用（验收要判的是分镜本身）。
        authored: pose,
      },
    };
    return this.state;
  }

  /** 把 frame 里的相机姿态真正写进 Camera。 */
  applyCamera(frame) {
    this.cameraRig.camera.position.copy(frame.camera.position);
    this.cameraRig.controls.target.copy(frame.camera.target);
    if (Math.abs(this.cameraRig.camera.fov - frame.camera.fov) > 1e-3) {
      this.cameraRig.camera.fov = frame.camera.fov;
      this.cameraRig.camera.updateProjectionMatrix();
    }
    this.cameraRig.camera.lookAt(frame.camera.target);
  }

  /** 强制下一帧不做平滑（Explore 返回、Debug 定位后使用）。 */
  snap() {
    this.primed = false;
  }

  shotState() {
    const { shot, localT, index, progress, env, chapter } = this.state;
    return {
      shotId: shot.id,
      title: shot.title,
      index,
      chapter,
      localT,
      globalProgress: progress,
      range: [SHOT_RANGES[index].start, SHOT_RANGES[index].end],
      cut: Boolean(shot.cut),
      camera: {
        position: this.state.camera.position.toArray(),
        target: this.state.camera.target.toArray(),
        fov: this.state.camera.fov,
        authored: {
          position: this.state.camera.authored.position.toArray(),
          target: this.state.camera.authored.target.toArray(),
          fov: this.state.camera.authored.fov,
        },
      },
      env,
      caption: this.state.caption?.text ?? null,
      interactive: this.state.interactive?.id ?? null,
    };
  }

  listShots() {
    return SHOTS.map((shot, index) => ({
      id: shot.id,
      index,
      chapter: shot.chapter,
      title: shot.title,
      range: [SHOT_RANGES[index].start, SHOT_RANGES[index].end],
      weight: shot.weight,
      cut: Boolean(shot.cut),
      interactive: shot.interactive ?? null,
    }));
  }
}
