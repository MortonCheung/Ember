/* ============================================================
   CameraRig.js — 分镜驱动的双路径相机

   与旧白盒的根本差别：
   · 旧：一条 Position 曲线 + Hero activation 自动抢 LookAt
         → 表现为「先向前走 → 随便看看 → 接近展品 → 突然猛转头」。
   · 新：Position / Target / FOV 三条彼此独立的路径，全部由 Shot 自己携带。
         Camera 不再寻找任何东西，它只执行分镜。

   本文件不含任何展品、章节或叙事判断。改镜头 = 改 storyboard.js。
   ============================================================ */

import * as THREE from 'three';
import { gsap } from 'gsap';

const smoothstep = (value) => value * value * (3 - 2 * value);

function buildCurve(points) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) {
    return { kind: 'static', point: new THREE.Vector3(...points[0]) };
  }
  const vectors = points.map((point) => new THREE.Vector3(...point));
  // 相邻重复点会让 centripetal 参数化除零，先去重（保留首尾）。
  const deduped = vectors.filter((vector, index) => (
    index === 0 || vector.distanceToSquared(vectors[index - 1]) > 1e-6
  ));
  if (deduped.length === 1) return { kind: 'static', point: deduped[0] };
  return {
    kind: 'curve',
    curve: new THREE.CatmullRomCurve3(deduped, false, 'centripetal', 0.5),
  };
}

/* 采样使用 getPoint 而不是 getPointAt：
   getPoint 按「关键帧等时」推进 —— 关键帧之间隔多久，就走多久。
   俯冲这类速度变化大的镜头正是靠关键帧密度控制节奏（前段稀、后段密 = 加速）。
   getPointAt 会做弧长均一化，把刻意设计的加速度抹平。 */
export function samplePath(path, t, out) {
  if (!path) return out.set(0, 0, 0);
  if (path.kind === 'static') return out.copy(path.point);
  return path.curve.getPoint(THREE.MathUtils.clamp(t, 0, 1), out);
}

function sampleFov(frames, t) {
  if (!frames) return 52;
  if (typeof frames === 'number') return frames;
  if (frames.length === 1) return frames[0][1];
  const value = THREE.MathUtils.clamp(t, 0, 1);
  for (let i = 0; i < frames.length - 1; i += 1) {
    const [t0, v0] = frames[i];
    const [t1, v1] = frames[i + 1];
    if (value <= t1 || i === frames.length - 2) {
      if (t1 === t0) return v1;
      return THREE.MathUtils.lerp(v0, v1, THREE.MathUtils.clamp((value - t0) / (t1 - t0), 0, 1));
    }
  }
  return frames[frames.length - 1][1];
}

export class CameraRig {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.pathCache = new Map();
    this.position = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.scratch = new THREE.Vector3();
    // 竖屏的水平视场只有横屏的三成左右，关键构图会被边缘裁掉。
    // 沿用旧白盒验证过的补偿系数：竖屏 FOV 放大到 1.24 倍。
    this.portrait = false;
    this.poseTween = null;
  }

  setPortrait(isPortrait) {
    this.portrait = Boolean(isPortrait);
  }

  getPaths(shot) {
    let cached = this.pathCache.get(shot.id);
    if (!cached) {
      cached = {
        position: buildCurve(shot.camera?.position),
        target: buildCurve(shot.camera?.target),
      };
      this.pathCache.set(shot.id, cached);
    }
    return cached;
  }

  /** 纯函数：Shot + localT → 相机姿态。可被 Debug 直接调用，不产生副作用。 */
  getShotPose(shot, localT) {
    const paths = this.getPaths(shot);
    const t = THREE.MathUtils.clamp(localT, 0, 1);
    samplePath(paths.position, t, this.position);
    samplePath(paths.target, t, this.target);
    let fov = sampleFov(shot.camera?.fov, t);
    if (this.portrait) fov *= 1.24;
    return {
      position: this.position.clone(),
      target: this.target.clone(),
      fov: THREE.MathUtils.clamp(fov, 18, 96),
    };
  }

  applyShotPose(shot, localT) {
    const pose = this.getShotPose(shot, localT);
    this.camera.position.copy(pose.position);
    this.controls.target.copy(pose.target);
    if (Math.abs(this.camera.fov - pose.fov) > 1e-3) {
      this.camera.fov = pose.fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.controls.target);
    return pose;
  }

  /** 进入 / 退出 Explore 时把相机姿态交给 GSAP，避免和 OrbitControls 抢控制。 */
  getCurrentPose() {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      fov: this.camera.fov,
    };
  }

  restoreJourneyPose(pose) {
    this.camera.position.copy(pose.position);
    this.controls.target.copy(pose.target);
    if (pose.fov && Math.abs(this.camera.fov - pose.fov) > 1e-3) {
      this.camera.fov = pose.fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.controls.target);
  }

  animateToPose(pose, { duration = 0.8, ease = 'power3.inOut' } = {}) {
    this.poseTween?.kill();
    const values = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      tx: this.controls.target.x,
      ty: this.controls.target.y,
      tz: this.controls.target.z,
      fov: this.camera.fov,
    };
    const endFov = pose.fov ?? this.camera.fov;
    return new Promise((resolve) => {
      this.poseTween = gsap.to(values, {
        x: pose.position.x,
        y: pose.position.y,
        z: pose.position.z,
        tx: pose.target.x,
        ty: pose.target.y,
        tz: pose.target.z,
        fov: endFov,
        duration,
        ease,
        overwrite: true,
        onUpdate: () => {
          this.camera.position.set(values.x, values.y, values.z);
          this.controls.target.set(values.tx, values.ty, values.tz);
          if (Math.abs(this.camera.fov - values.fov) > 1e-3) {
            this.camera.fov = values.fov;
            this.camera.updateProjectionMatrix();
          }
          this.camera.lookAt(this.controls.target);
        },
        onComplete: () => {
          this.poseTween = null;
          this.restoreJourneyPose({ ...pose, fov: endFov });
          resolve(true);
        },
        onInterrupt: () => {
          this.poseTween = null;
          resolve(false);
        },
      });
    });
  }

  stopAnimation() {
    this.poseTween?.kill();
    this.poseTween = null;
  }

  dispose() {
    this.stopAnimation();
    this.pathCache.clear();
  }
}
