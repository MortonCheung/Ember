/* ============================================================
   CameraRig.js — Journey 相机路径与注视目标的唯一写入者
   ============================================================ */

import * as THREE from 'three';
import { CAMERA_POINTS, EXHIBITS } from './data/journey-data.js';

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

  dispose() {}
}
