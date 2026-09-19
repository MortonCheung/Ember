/* ============================================================
   PointerIntent.js — 区分轻点与拖动/触摸滚动
   ============================================================ */

export class PointerIntent {
  constructor(element, onTap, { maxDistance = 8, maxDuration = 700 } = {}) {
    this.element = element;
    this.onTap = onTap;
    this.maxDistance = maxDistance;
    this.maxDuration = maxDuration;
    this.pointer = null;
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerCancel = this.onPointerCancel.bind(this);
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerCancel);
  }

  onPointerDown(event) {
    if (!event.isPrimary) return;
    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  }

  onPointerUp(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - this.pointer.x, event.clientY - this.pointer.y);
    const duration = performance.now() - this.pointer.time;
    this.pointer = null;
    if (distance <= this.maxDistance && duration <= this.maxDuration) this.onTap(event);
  }

  onPointerCancel() {
    this.pointer = null;
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerCancel);
    this.pointer = null;
  }
}
