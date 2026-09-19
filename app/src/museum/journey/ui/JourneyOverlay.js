/* ============================================================
   JourneyOverlay.js — 三种文字里的 B 类（Cinematic Caption）与章节题头

   全部状态由 CinematicDirector 的 frame 推导，不持有自己的时间轴。
   反向滚动时字幕会自然退回，因为它只是 progress 的函数。

   注意：这里刻意不做「左边卡片 + 右边 3D」的网页版式。
   信息由空间、镜头、机器、文字、声音共同表达。
   ============================================================ */

import { MathUtils } from 'three';
import { CHAPTERS } from '../storyboard.js';

const CHAPTER_TITLE = new Map(CHAPTERS.map((c) => [c.id, c]));

export class JourneyOverlay {
  constructor(overlay) {
    this.overlay = overlay;
    this.intro = overlay.querySelector('.liaoji-intro');
    this.chapter = overlay.querySelector('.liaoji-chapter');
    this.caption = overlay.querySelector('.liaoji-caption');
    this.hint = overlay.querySelector('.liaoji-hint');
    this.activeChapterId = null;
    this.captionText = null;
  }

  update(frame) {
    const { shot, localT } = frame;

    /* 开场标题与终场标题：只在两个 TITLE 镜头里出现，其余时间不占画面。 */
    const isTitle = shot.id === 'OP_08_TITLE' || shot.id === 'EN_03_TITLE';
    let introOpacity = 0;
    if (isTitle) {
      introOpacity = MathUtils.smoothstep(localT, 0.12, 0.42);
    } else if (shot.id === 'OP_09_DOOR') {
      introOpacity = 1 - MathUtils.smoothstep(localT, 0, 0.42);
    }
    this.intro.style.opacity = String(introOpacity);
    this.intro.style.visibility = introOpacity <= 0.001 ? 'hidden' : 'visible';

    /* 章节题头：进入新章节时短暂出现，然后退场，不常驻。 */
    const chapterId = frame.chapterBlend?.from ?? shot.chapter;
    if (chapterId !== this.activeChapterId) {
      this.activeChapterId = chapterId;
      const meta = CHAPTER_TITLE.get(chapterId);
      this.chapter.innerHTML = meta && meta.number !== '—'
        ? `<span class="liaoji-chapter__number">${meta.number}</span><strong>${meta.title}</strong>`
        : '';
    }
    const chapterLocal = frame.chapterLocalT ?? 0;
    const chapterOpacity = Math.min(
      MathUtils.smoothstep(chapterLocal, 0.0, 0.035),
      1 - MathUtils.smoothstep(chapterLocal, 0.07, 0.16),
    );
    this.chapter.style.opacity = String(Math.max(0, chapterOpacity));

    /* B 类：Cinematic Caption。随镜头离开而消失，不做常驻卡片。 */
    const caption = frame.caption;
    if (!caption || caption.alpha <= 0.001) {
      if (this.captionText !== null) {
        this.captionText = null;
        this.caption.textContent = '';
        this.caption.style.opacity = '0';
      }
    } else {
      if (caption.text !== this.captionText) {
        this.captionText = caption.text;
        this.caption.textContent = caption.text;
      }
      this.caption.style.opacity = String(caption.alpha);
    }

    return chapterId;
  }

  setHint(text) {
    if (!this.hint) return;
    this.hint.textContent = text ?? '';
    this.hint.style.opacity = text ? '1' : '0';
  }

  dispose() {
    this.chapter.replaceChildren();
    if (this.caption) this.caption.textContent = '';
  }
}
