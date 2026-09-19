/* ============================================================
   CameraRig.js — Journey 相机路径与注视目标的唯一写入者
   ============================================================ */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { CAMERA_POINTS, EXHIBITS } from '../data/journey-data.js';

const smoothstep = (value) => value * value * (3 - 2 * value);

export class CameraRig {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.positionCurve = new THREE.CatmullRomCurve3(
      CAMERA_POINTS.map((point) => new THREE.Vector3(...point)),
      false,
      'centripetal',
    );
    this.target = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.forwardTarget = new THREE.Vector3();
    this.focusTarget = new THREE.Vector3();
    this.dollyDirection = new THREE.Vector3();
    // 竖屏的水平视场只有横屏的三成左右，Hero 会被边缘裁掉。
    // 打开后沿视线方向后退：常态退 0.9m 换回空间感，Hero 聚焦区间按权重最多再退 3.4m。
    this.portrait = false;
    this.poseTween = null;
  }

  setPortrait(isPortrait) {
    this.portrait = Boolean(isPortrait);
  }

  getJourneyPose(pathT, progress) {
    const safeT = THREE.MathUtils.clamp(pathT, 0, 1);
    this.positionCurve.getPointAt(safeT, this.position);
    this.positionCurve.getPointAt(Math.min(1, safeT + 0.022), this.forwardTarget);
    this.target.copy(this.forwardTarget);
    this.target.y = THREE.MathUtils.lerp(this.position.y, this.forwardTarget.y, 0.5);

    const focus = this.getFocus(progress);
    if (focus) {
      this.focusTarget.set(...focus.exhibit.anchor);
      this.target.lerp(this.focusTarget, focus.weight * 0.78);
    }

    if (this.portrait) {
      const dolly = 0.9 + (focus ? focus.weight * (focus.exhibit.portraitDolly ?? 1) : 0) * 3.4;
      this.dollyDirection.copy(this.position).sub(this.target);
      // 只做水平后退：注视点常高于视点，照原方向退会把 1.65m 的视点高度一起拉下去。
      this.dollyDirection.y = 0;
      if (this.dollyDirection.lengthSq() > 1e-6) {
        this.dollyDirection.normalize();
        this.position.addScaledVector(this.dollyDirection, dolly);
      }
    }

    return {
      position: this.position.clone(),
      target: this.target.clone(),
    };
  }

  getFocus(progress) {
    for (const exhibit of EXHIBITS) {
      const [start, end] = exhibit.activationRange;
      if (progress < start || progress > end) continue;
      const center = (start + end) / 2;
      const edgeDistance = progress <= center
        ? (progress - start) / (center - start)
        : (end - progress) / (end - center);
      return { exhibit, weight: smoothstep(THREE.MathUtils.clamp(edgeDistance, 0, 1)) };
    }
    return null;
  }

  applyJourneyPose(pathT, progress) {
    const pose = this.getJourneyPose(pathT, progress);
    this.camera.position.copy(pose.position);
    this.controls.target.copy(pose.target);
    this.camera.lookAt(pose.target);
    return pose;
  }

  getCurrentPose() {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
    };
  }

  restoreJourneyPose(pose) {
    this.camera.position.copy(pose.position);
    this.controls.target.copy(pose.target);
    this.camera.lookAt(pose.target);
  }

  animateToPose(pose, { duration = .8, ease = 'power3.inOut' } = {}) {
    this.poseTween?.kill();
    const values = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      tx: this.controls.target.x,
      ty: this.controls.target.y,
      tz: this.controls.target.z,
    };
    return new Promise((resolve) => {
      this.poseTween = gsap.to(values, {
        x: pose.position.x,
        y: pose.position.y,
        z: pose.position.z,
        tx: pose.target.x,
        ty: pose.target.y,
        tz: pose.target.z,
        duration,
        ease,
        overwrite: true,
        onUpdate: () => {
          this.camera.position.set(values.x, values.y, values.z);
          this.controls.target.set(values.tx, values.ty, values.tz);
          this.camera.lookAt(this.controls.target);
        },
        onComplete: () => {
          this.poseTween = null;
          this.restoreJourneyPose(pose);
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
  }
}
