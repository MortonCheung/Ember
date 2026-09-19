/* ============================================================
   ExploreConsole.js — C620-1 与工作台的真正互动

   手册要求：C620-1 不能只有 OrbitControls。
       拆解 → 结构说明 → 重新组装 → 启动 → 手轮进给 → 车削 → 历史信息
   工作台只做 10~15 秒的生活细节：图纸展开、卡尺抬起。

   面板本身不碰 three.js，只发意图；动作由 Experience 落到 rig 上。
   ============================================================ */

const LATHE_PARTS = [
  { id: 'head', label: '主轴箱', note: '把电机的转速变成主轴的转速。卡盘夹住工件，带着它转。' },
  { id: 'carriage', label: '刀架 · 溜板', note: '夹持车刀，沿床身导轨送进。送多深，就切掉多少。' },
  { id: 'tail', label: '尾座', note: '顶住长工件的另一端，防止车削时让刀。' },
  { id: 'bed', label: '床身', note: '承载全部部件的基础。导轨的平直度，就是这台机床的精度。' },
];

export class ExploreConsole {
  constructor({ element, onAction }) {
    this.element = element;
    this.onAction = onAction;
    this.mode = null;
    this.step = 0;
    this.selectedPart = null;
    this.onClick = (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      const value = event.target.closest('[data-action]')?.dataset.value;
      this.handle(action, value);
    };
    // 手轮是连续拖动，走 input 事件；点按类操作走 click。两者不能混。
    this.onInput = (event) => {
      const target = event.target.closest('[data-action="feed"]');
      if (!target) return;
      this.handle('feed', target.value);
    };
    element.addEventListener('click', this.onClick);
    element.addEventListener('input', this.onInput);
  }

  handle(action, value) {
    switch (action) {
      case 'part':
        this.selectedPart = this.selectedPart === value ? null : value;
        this.render();
        this.onAction?.({ type: 'select-part', value: this.selectedPart });
        break;
      case 'assemble':
        this.step = 1;
        this.render();
        this.onAction?.({ type: 'assemble' });
        // 组装动画结束后自动进入进给步骤
        this.assembleTimer = setTimeout(() => {
          this.step = 2;
          this.render();
          this.onAction?.({ type: 'start' });
        }, 1500);
        break;
      case 'feed':
        this.onAction?.({ type: 'feed', value: Number(value) });
        if (Number(value) > 0.88 && this.step === 2) {
          this.step = 3;
          this.render();
          this.onAction?.({ type: 'finish' });
        }
        break;
      case 'drawing':
        this.onAction?.({ type: 'drawing', value: this.drawingOn ? 0 : 1 });
        this.drawingOn = !this.drawingOn;
        this.render();
        break;
      case 'caliper':
        this.onAction?.({ type: 'caliper', value: this.caliperOn ? 0 : 1 });
        this.caliperOn = !this.caliperOn;
        this.render();
        break;
      case 'exit':
        this.onAction?.({ type: 'exit' });
        break;
      default:
        break;
    }
  }

  open(mode) {
    this.mode = mode;
    this.step = 0;
    this.selectedPart = null;
    this.drawingOn = false;
    this.caliperOn = false;
    this.element.hidden = false;
    this.element.dataset.mode = mode;
    this.render();
  }

  close() {
    clearTimeout(this.assembleTimer);
    this.element.hidden = true;
    this.element.replaceChildren();
    this.mode = null;
  }

  render() {
    if (!this.mode) return;
    this.element.innerHTML = this.mode === 'lathe' ? this.latheMarkup() : this.benchMarkup();
  }

  latheMarkup() {
    const head = `
      <div class="liaoji-console__head">
        <span class="liaoji-console__step">${String(this.step + 1).padStart(2, '0')} / 04</span>
        <h3>${['拆解 · 结构', '组装 · 启动', '手轮 · 进给', 'C620-1'][this.step]}</h3>
      </div>`;

    let body = '';
    if (this.step === 0) {
      body = `
        <ul class="liaoji-console__parts">
          ${LATHE_PARTS.map((part) => `
            <li>
              <button type="button" data-action="part" data-value="${part.id}"
                class="${this.selectedPart === part.id ? 'is-active' : ''}">${part.label}</button>
            </li>`).join('')}
        </ul>
        <p class="liaoji-console__note">${
          LATHE_PARTS.find((p) => p.id === this.selectedPart)?.note
          ?? '点一个部件，看它在这台机床里负责什么。'
        }</p>
        <button type="button" class="liaoji-console__primary" data-action="assemble">组装并启动</button>`;
    } else if (this.step === 1) {
      body = `
        <p class="liaoji-console__note">部件正在回位。工作灯亮起，电机即将启动。</p>`;
    } else if (this.step === 2) {
      body = `
        <label class="liaoji-console__feed">
          <span>转动手轮 · 刀架进给</span>
          <input type="range" min="0" max="1" step="0.01" value="0" data-action="feed" aria-label="手轮进给">
        </label>
        <p class="liaoji-console__note">手轮转动 → 刀架移动 → 车刀靠近金属棒 → 切屑飞出。</p>`;
    } else {
      body = `
        <div class="liaoji-console__archive">
          <strong>C620-1 普通车床</strong>
          <span>1955 · 沈阳第一机床厂</span>
          <p>当年车间里最常见的机型之一。它车过的零件，装在了后来无数台机器上。</p>
        </div>
        <button type="button" class="liaoji-console__primary" data-action="exit">继续参观 ↓</button>`;
    }

    return `${head}<div class="liaoji-console__body">${body}</div>`;
  }

  benchMarkup() {
    return `
      <div class="liaoji-console__head">
        <span class="liaoji-console__step">工人 · 工作台</span>
        <h3>下工前的十分钟</h3>
      </div>
      <div class="liaoji-console__body">
        <div class="liaoji-console__actions">
          <button type="button" data-action="drawing" class="${this.drawingOn ? 'is-active' : ''}">
            ${this.drawingOn ? '收起图纸' : '看看图纸'}
          </button>
          <button type="button" data-action="caliper" class="${this.caliperOn ? 'is-active' : ''}">
            ${this.caliperOn ? '放下卡尺' : '量一下尺寸'}
          </button>
        </div>
        <p class="liaoji-console__note">${
          this.drawingOn ? '一张主轴箱的零件图，比例尺 1:10。'
            : this.caliperOn ? '0.02mm，量到这个数就得收手了。'
              : '图纸、量具、搪瓷杯、暖水瓶 —— 这就是他一天里最放松的十分钟。'
        }</p>
        <button type="button" class="liaoji-console__primary" data-action="exit">继续参观 ↓</button>
      </div>`;
  }

  dispose() {
    clearTimeout(this.assembleTimer);
    this.element.removeEventListener('click', this.onClick);
    this.close();
  }
}
