/* ============================================================
   JourneyOverlay.js — 开篇与章节字幕；状态完全由 progress 推导
   ============================================================ */

import { MathUtils } from 'three';
import { CHAPTERS } from '../data.js';

export class JourneyOverlay {
  constructor(overlay) {
    this.overlay = overlay;
    this.intro = overlay.querySelector('.liaoji-intro');
    this.chapter = overlay.querySelector('.liaoji-chapter');
    this.activeChapterId = null;
  }

  update(progress) {
    const introOpacity = 1 - MathUtils.smoothstep(progress, .015, .075);
    this.intro.style.opacity = String(introOpacity);
    this.intro.style.visibility = introOpacity <= .001 ? 'hidden' : 'visible';

    const active = CHAPTERS.find(({ range }) => progress >= range[0] && progress <= range[1]) ?? null;
    if (active?.id !== this.activeChapterId) {
      this.activeChapterId = active?.id ?? null;
      this.chapter.innerHTML = active
        ? `<span class="liaoji-chapter__number">${active.number}</span><strong>${active.title}</strong>`
        : '';
    }

    if (!active) {
      this.chapter.style.opacity = '0';
      return null;
    }
    const [start, end] = active.range;
    const fadeIn = MathUtils.smoothstep(progress, start, start + Math.min(.025, (end - start) * .25));
    const fadeOut = 1 - MathUtils.smoothstep(progress, end - Math.min(.025, (end - start) * .25), end);
    this.chapter.style.opacity = String(Math.min(fadeIn, fadeOut));
    return active.id;
  }

  dispose() {
    this.chapter.replaceChildren();
  }
}
