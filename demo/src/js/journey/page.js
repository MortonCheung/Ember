/* ============================================================
   journey.js — 《辽迹》连续数字博物馆页面壳
   页面只负责 DOM 与生命周期；三维运行时全部交给 Experience。
   ============================================================ */

import { Experience } from './Experience.js';

export function renderJourney(root) {
  const page = document.createElement('main');
  page.className = 'page page--journey';
  page.innerHTML = `
    <div class="liaoji-experience" data-mode="journey">
      <div class="liaoji-canvas-host" aria-label="辽迹连续数字博物馆三维场景"></div>

      <div class="liaoji-overlay">
        <section class="liaoji-intro" aria-labelledby="liaoji-title">
          <p class="liaoji-intro__kicker">辽宁工业数字博物馆</p>
          <h1 id="liaoji-title">辽迹</h1>
          <p class="liaoji-intro__subtitle">可触碰的辽宁工业记忆</p>
          <span class="liaoji-intro__hint">向下滑动进入</span>
        </section>

        <div class="liaoji-chapter" aria-live="polite" aria-atomic="true"></div>

        <button class="liaoji-exhibit-marker" type="button" hidden>
          <span aria-hidden="true">●</span>
          <span>探索</span>
        </button>

        <button class="liaoji-continue" type="button" hidden>
          继续参观 <span aria-hidden="true">↓</span>
        </button>

        <p class="liaoji-status" role="status" aria-live="polite"></p>
      </div>

      <div class="liaoji-scroll-track" aria-hidden="true"></div>
    </div>
  `;
  root.appendChild(page);

  const experienceRoot = page.querySelector('.liaoji-experience');
  let experience = null;

  try {
    experience = new Experience({
      root: experienceRoot,
      host: page.querySelector('.liaoji-canvas-host'),
      scrollTrack: page.querySelector('.liaoji-scroll-track'),
      overlay: page.querySelector('.liaoji-overlay'),
    });
    experience.start();
  } catch (error) {
    const status = page.querySelector('.liaoji-status');
    status.textContent = '三维体验初始化失败，请刷新页面或更换浏览器。';
    console.error('[liaoji] Experience initialization failed', error);
  }

  return {
    dispose() {
      experience?.dispose();
      page.remove();
    },
  };
}
