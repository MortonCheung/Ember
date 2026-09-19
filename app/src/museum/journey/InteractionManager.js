/* ============================================================
   InteractionManager.js — Notice、Raycast 与 Explore 入口

   与旧白盒的差别：可交互的判定不再来自一条全局 progress 区间，
   而来自 CinematicDirector 给出的 frame.interactive —— 也就是分镜表上写的
   `interactive: 'lathe'` 与该镜头的 notice 区间。
   这样「什么时候可以碰机器」是导演决定的，不是算出来的。

   任何一帧 Camera 只能属于一个系统：
     cinematic / entering-explore / explore / returning
   Explore 期间本模块不参与，由 OrbitControls 接管。
   ============================================================ */

import * as THREE from 'three';
import { PointerIntent } from './PointerIntent.js';

export class InteractionManager {
  constructor({ experience, camera, canvas, exhibits, marker }) {
    this.experience = experience;
    this.camera = camera;
    this.canvas = canvas;
    this.exhibits = exhibits;
    this.marker = marker;
    this.discoverableExhibitId = null;
    this.activeRangeId = null;
    this.notifiedInVisit = new Set();
    this.suppressedUntilLeave = new Set();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerIntent = new PointerIntent(canvas, (event) => this.onTap(event));
  }

  /** frame 来自 CinematicDirector；interactive 只在该镜头的 notice 区间内出现。 */
  update(frame) {
    if (this.experience.state.mode !== 'journey') {
      this.marker.hide();
      return;
    }

    // 上次 Explore 退出后要等离开这个镜头区间，才重新提示。
    for (const id of [...this.suppressedUntilLeave]) {
      if (id !== frame.interactive?.id) this.suppressedUntilLeave.delete(id);
    }

    const activeId = frame.interactive?.id ?? null;
    if (!activeId || this.suppressedUntilLeave.has(activeId)) {
      if (this.activeRangeId) this.notifiedInVisit.delete(this.activeRangeId);
      this.activeRangeId = null;
      this.setDiscoverable(null);
      return;
    }

    if (activeId !== this.activeRangeId) {
      if (this.activeRangeId) this.notifiedInVisit.delete(this.activeRangeId);
      this.activeRangeId = activeId;
    }

    this.setDiscoverable(activeId);
    if (!this.notifiedInVisit.has(activeId)) {
      this.notifiedInVisit.add(activeId);
      this.exhibits.get(activeId)?.playNotice?.();
    }
    this.marker.update();
  }

  setDiscoverable(id) {
    if (id === this.discoverableExhibitId) return;
    this.discoverableExhibitId = id;
    this.experience.state.discoverableExhibitId = id;
    if (!id) {
      this.marker.hide();
      return;
    }
    const entry = this.exhibits.get(id);
    if (entry) this.marker.show(entry);
  }

  onTap(event) {
    const id = this.discoverableExhibitId;
    if (!id || this.experience.state.mode !== 'journey') return;
    const entry = this.exhibits.get(id);
    if (!entry) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.intersectObjects(entry.pickTargets, true).length > 0) {
      this.enterExplore(id);
    }
  }

  enterExplore(id) {
    if (!this.exhibits.has(id)) return false;
    return this.experience.enterExplore?.(id) ?? false;
  }

  exitExplore() {
    return this.experience.exitExplore?.() ?? false;
  }

  suppressUntilExitRange(id) {
    this.suppressedUntilLeave.add(id);
    this.setDiscoverable(null);
  }

  dispose() {
    this.pointerIntent.dispose();
    this.marker.dispose();
    this.exhibits.forEach((entry) => entry.resetNotice?.());
  }
}
