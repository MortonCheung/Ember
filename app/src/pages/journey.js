/* ============================================================
   journey.js — 《辽迹》电影页面壳
   页面只负责 DOM 与生命周期；镜头、世界、节奏全部交给 Experience。
   ============================================================ */

import { Experience } from '../museum/journey/Experience.js';

export function renderJourney(root) {
  const page = document.createElement('main');
  page.className = 'page page--journey';
  page.innerHTML = `
    <div class="liaoji-experience" data-mode="journey">
      <div class="liaoji-canvas-host" aria-label="辽迹 · 可触碰的辽宁工业记忆"></div>

      <div class="liaoji-overlay">
        <section class="liaoji-intro" aria-labelledby="liaoji-title">
          <h1 id="liaoji-title">辽迹</h1>
          <p class="liaoji-intro__subtitle">可触碰的辽宁工业记忆</p>
        </section>

        <div class="liaoji-chapter" aria-live="polite" aria-atomic="true"></div>

        <p class="liaoji-caption" aria-live="polite" aria-atomic="true"></p>

        <p class="liaoji-hint" aria-live="polite"></p>

        <button class="liaoji-exhibit-marker" type="button" hidden>
          <span aria-hidden="true">●</span>
        </button>

        <div class="liaoji-console" role="group" aria-label="互动控制台" hidden></div>

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
