/* ============================================================
   ScrollLock.js — Explore 期间锁住真实页面滚动并可精确恢复
   ============================================================ */

export class ScrollLock {
  constructor() {
    this.locked = false;
    this.savedScrollY = 0;
    this.savedStyles = null;
  }

  lock() {
    if (this.locked) return this.savedScrollY;
    const html = document.documentElement;
    const body = document.body;
    this.savedScrollY = window.scrollY;
    this.savedStyles = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    this.locked = true;
    return this.savedScrollY;
  }

  unlock(scrollY = this.savedScrollY) {
    if (!this.locked) {
      window.scrollTo(0, scrollY);
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = this.savedStyles.htmlOverflow;
    body.style.overflow = this.savedStyles.bodyOverflow;
    body.style.paddingRight = this.savedStyles.bodyPaddingRight;
    this.locked = false;
    this.savedStyles = null;
    window.scrollTo(0, scrollY);
  }

  forceUnlock() {
    if (this.locked) this.unlock(this.savedScrollY);
  }
}
