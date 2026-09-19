/* ============================================================
   ExhibitMarker.js — 世界锚点投影到克制的 DOM 探索标记
   ============================================================ */

import * as THREE from 'three';

const FALLBACK_LABEL = '探索';

export class ExhibitMarker {
  constructor({ element, camera, host, onActivate }) {
    this.element = element;
    this.camera = camera;
    this.host = host;
    this.current = null;
    this.projected = new THREE.Vector3();
    this.onClick = () => this.current && onActivate(this.current.id);
    element.addEventListener('click', this.onClick);
  }

  show(exhibit) {
    this.current = exhibit;
    this.element.hidden = false;
    this.element.setAttribute('aria-label', exhibit.label ?? FALLBACK_LABEL);
  }

  hide() {
    this.current = null;
    this.element.hidden = true;
  }

  update() {
    if (!this.current) return;
    this.projected.set(...this.current.anchor).project(this.camera);
    const outsideDepth = this.projected.z < -1 || this.projected.z > 1;
    if (outsideDepth) {
      this.element.hidden = true;
      return;
    }
    this.element.hidden = false;
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const x = (this.projected.x * .5 + .5) * width;
    const y = (-this.projected.y * .5 + .5) * height;
    this.element.style.left = `${THREE.MathUtils.clamp(x, 48, width - 48)}px`;
    this.element.style.top = `${THREE.MathUtils.clamp(y, 64, height - 48)}px`;
  }

  dispose() {
    this.element.removeEventListener('click', this.onClick);
    this.hide();
  }
}
