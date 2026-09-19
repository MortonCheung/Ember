/* ============================================================
   JourneyController.js — 原生滚动 → ScrollTrigger → 平滑进度
   ============================================================ */

import { MathUtils } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class JourneyController {
  constructor({ scrollTrack, reducedMotion = false }) {
    this.scrollTrack = scrollTrack;
    this.reducedMotion = reducedMotion;
    this.rawProgress = 0;
    this.visualProgress = 0;
    this.enabled = true;
    this.trigger = null;
    this.refreshRaf = 0;
  }

  start() {
    if (this.trigger) return;
    this.trigger = ScrollTrigger.create({
      id: 'liaoji-journey',
      trigger: this.scrollTrack,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        this.rawProgress = self.progress;
      },
    });

    this.refreshRaf = requestAnimationFrame(() => {
      this.trigger?.refresh();
      this.syncFromScroll(true);
    });
  }

  update(dt) {
    if (!this.enabled) return this.visualProgress;
    this.visualProgress = this.reducedMotion
      ? this.rawProgress
      : MathUtils.damp(this.visualProgress, this.rawProgress, 8.5, dt);
    return this.visualProgress;
  }

  syncFromScroll(immediate = false) {
    ScrollTrigger.update();
    const maxScroll = this.getMaxScroll();
    this.rawProgress = maxScroll > 0
      ? MathUtils.clamp(window.scrollY / maxScroll, 0, 1)
      : 0;
    if (immediate) this.visualProgress = this.rawProgress;
  }

  setProgress(progress, { immediate = true } = {}) {
    const value = MathUtils.clamp(progress, 0, 1);
    window.scrollTo(0, value * this.getMaxScroll());
    this.rawProgress = value;
    if (immediate) this.visualProgress = value;
    ScrollTrigger.update();
    return value;
  }

  getMaxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  dispose() {
    cancelAnimationFrame(this.refreshRaf);
    this.trigger?.kill();
    this.trigger = null;
  }
}
