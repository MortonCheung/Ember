/* ============================================================
   InteractionManager.js — 可发现区间、Notice、当前展品 Raycast
   ============================================================ */

import * as THREE from 'three';
import { PointerIntent } from './PointerIntent.js';

export class InteractionManager {
  constructor({ experience, camera, canvas, exhibits, exhibitData, marker }) {
    this.experience = experience;
    this.camera = camera;
    this.canvas = canvas;
    this.exhibits = exhibits;
    this.exhibitData = exhibitData;
    this.marker = marker;
    this.discoverableExhibitId = null;
    this.exploringExhibitId = null;
    this.activeRangeId = null;
    this.notifiedInVisit = new Set();
    this.suppressedUntilLeave = new Set();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerIntent = new PointerIntent(canvas, (event) => this.onTap(event));
  }

  update(progress) {
    if (this.experience.state.mode !== 'journey') {
      this.marker.hide();
      return;
    }

    const candidate = this.exhibitData.find(({ activationRange }) => (
      progress >= activationRange[0] && progress <= activationRange[1]
    )) ?? null;

    for (const id of [...this.suppressedUntilLeave]) {
      const data = this.exhibitData.find((item) => item.id === id);
      if (!data || progress < data.activationRange[0] || progress > data.activationRange[1]) {
        this.suppressedUntilLeave.delete(id);
      }
    }

    if (!candidate) {
      if (this.activeRangeId) this.notifiedInVisit.delete(this.activeRangeId);
      this.activeRangeId = null;
      this.setDiscoverable(null);
      return;
    }

    if (candidate.id !== this.activeRangeId) {
      if (this.activeRangeId) this.notifiedInVisit.delete(this.activeRangeId);
      this.activeRangeId = candidate.id;
    }

    if (this.suppressedUntilLeave.has(candidate.id)) {
      this.setDiscoverable(null);
      return;
    }

    this.setDiscoverable(candidate.id);
    if (!this.notifiedInVisit.has(candidate.id)) {
      this.notifiedInVisit.add(candidate.id);
      this.exhibits.get(candidate.id)?.playNotice();
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
    const data = this.exhibitData.find((item) => item.id === id);
    this.marker.show(data);
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
    this.exhibits.forEach((entry) => entry.resetNotice());
  }
}
