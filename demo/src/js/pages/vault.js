/* ============================================================
   vault.js — 数字工牌（对应设计稿 S05，路由 #/vault）
   依据：spec/VAULT-SPEC.md（唯一依据）+ archive/spec/PROMPT-VAULT.md
   四层骨架「04 带走 · 炉火不灭」的落点：前三层都在"给"，这一层让观众拿走一样东西。

   纪律（逐条对应 §14「不要做的事」）：
     ① 徽记区是**数据驱动的 canvas**（ui/emblem.js），不是图片 / 灰底 div（§3）
     ② 海报用 Canvas 2D 重绘（ui/poster.js），**不截三维帧**（§8）
     ③ 4 张衍生卡必须补**锁定态**（§5 / §7 门槛 n≥3 / n≥8）
     ④ unlocked 为空时**绝不白屏、不抛错**（§6.1）
     ⑤ 姓名编辑在本页（§7 裁定，**不搬回 #/cast 步骤⑤**）
     ⑥ `n / 12` **以 im.cast.unlocked 数组长度为准**，并回写 badge.unlocked（§9）
     ⑦ **车削评分**为 null / 缺字段时显示 `—`，**不显示 00:00、不显示 undefined、不显示 NaN**（§9）；
        老工牌没有新字段（`turn` / `sandbox` / `casting` / `params`）时必须照常渲染、不抛错、不白屏
     ⑧ 零随机、零 WebGL、零贴图、零新增运行时依赖（§12 硬约束）
     ⑨ R1-P2 9b：左上角**唯一的例外控件** —— 一颗 `position: fixed` 的返回键（`.vault__back`）。
        除此之外仍然**无顶栏、无 HUD**（§1：左栏 878 / 900 的高度预算就是去掉顶栏换来的）
     ⑩ R1-P2 9c：图鉴 12 格与 4 张衍生卡**可点开/收起** —— 保留外层 `<li>`（栅格挂在它身上），
        内容包进内嵌 `<button>`；**不换标签、不跳页、不弹模态**
     本页只写 im.badge 的 name 字段 + 回写 unlocked 字符串，其余键一个都不动。
   ============================================================ */

import { SANDBOXES } from '../scoring/casting-data.js';
import { buildEmblemData, drawEmblem } from '../ui/emblem.js';
import { exportPoster, renderPoster, POSTER_SIZE } from '../ui/poster.js';

/* ---------- 存储（E18：隐私模式降级为纯内存；storageOk=false → 状态 C） ---------- */
const mem = {};
let storageOk = true;
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { storageOk = false; return key in mem ? mem[key] : fallback; }
  },
  set(key, val) {
    mem[key] = val;
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { storageOk = false; }
  },
};

const K_BADGE = 'im.badge';           // 工牌（本页只写它的 name / unlocked 两个字段）
const K_UNLOCKED = 'im.cast.unlocked'; // 馆藏解锁（**n 的唯一来源**）
const TOTAL = 12;

/* 砂箱序号 → 铸件类型（§3.3 轮廓选择用；数据来自 casting-data.js，不另写一份） */
const CASTING_OF = {};
SANDBOXES.forEach((sb, i) => { CASTING_OF[`sandbox_${i}`] = sb.casting; });

/* R1-P2：原本地那份 mm:ss 格式化函数、以及「原样显示时间串」的那个小函数，都是既有死代码
   （本页零调用），随「用时」概念一起删除。 */

/* ---------- 衍生品（文案照画稿，不改；门槛来自 §7） ---------- */
const DERIVS = [
  { name: '齿轮巧克力', desc: '以馆藏齿轮为原型，号码即模具编号', need: 0 },
  { name: '铁水纹亚克力摆件', desc: '封存你那一炉的铁水流动瞬间', need: 0 },
  { name: '工牌实体卡', desc: '馆内自助机打印，可挂工装口袋', need: 3 },
  { name: '劳模语录卡', desc: '随机掉落张成哲、吴家柱等劳模语录', need: 8 },
];

/* ---------- 砂箱简笔图标（带合模线的方箱，5 条线；内联 SVG，按状态着色） ---------- */
function boxIcon(color, dashed) {
  return `<svg class="vault__cell-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"
       ${dashed ? 'stroke-dasharray="3 3"' : ''}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.2"/>
      <path d="M3.5 12h17"/>
      <path d="M9 5.5v6.5"/>
      <path d="M15 5.5v6.5"/>
      <path d="M9 12v6.5"/>
      <path d="M15 12v6.5"/>
    </g>
  </svg>`;
}

/* ------------------------------------------------------------
   buildView() —— 把原始存储数据收成"展示视图"（纯函数：便于 node 单测）
     badge    : im.badge 或 null
     unlocked : im.cast.unlocked（数字数组）
   ------------------------------------------------------------ */
export function buildView(badge, unlocked) {
  const arr = Array.isArray(unlocked) ? unlocked.filter((v) => Number.isInteger(v)) : [];
  const n = arr.length;
  const hasBadge = Boolean(badge) && badge.no != null;
  const emblem = buildEmblemData(arr, CASTING_OF);

  /* R1-P2 9a③：工牌新增了**本局**特征（`sandbox` / `casting` / `params`）与车削特征（`turn`）。
     ⚠️ 老工牌里没有这些字段 —— 一律"缺就省略 / 显示 `—`"，**不得抛错、不得渲染 undefined / NaN**。
     ⚠️ 编号口径：本页图鉴格与徽记编号**一律 1 基**（`sandbox_4` 显示 `05`），
        故展示用的 `砂箱 NN` 也取 1 基，与同页保持一致；**存储值 `badge.sandbox` 仍是 0–11**
        （照 P2 原文取 `state.selected`）。两处口径不同是刻意的，见自述「偏离与待裁定」。 */
  const sandboxNo = (badge && Number.isInteger(badge.sandbox)
    && badge.sandbox >= 0 && badge.sandbox < TOTAL) ? badge.sandbox : null;
  const castingName = (badge && typeof badge.casting === 'string' && badge.casting)
    ? badge.casting : null;
  const P = (badge && badge.params && typeof badge.params === 'object') ? badge.params : null;
  const TR = (badge && badge.turn && typeof badge.turn === 'object') ? badge.turn : null;
  const sbTag = sandboxNo === null ? null : `砂箱 ${String(sandboxNo + 1).padStart(2, '0')}`;
  const num = (v, dp) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  /* 工艺指纹（§1 9a⑤）：缺哪一段就省略哪一段；全缺 → null（整行不渲染、不占高度） */
  const segs = [];
  if (sbTag) segs.push(castingName ? `${sbTag} ${castingName}` : sbTag);
  else if (castingName) segs.push(castingName);
  const T = num(P && P.T), V = num(P && P.V), H = num(P && P.H);
  const tn = num(TR && TR.n), tf = num(TR && TR.f);
  if (T !== null) segs.push(`砂温 ${Math.round(T)}℃`);
  if (V !== null) segs.push(`浇速 ${V.toFixed(1)} kg/s`);
  if (H !== null) segs.push(`湿度 ${H.toFixed(1)}%`);
  if (tn !== null) segs.push(`主轴 ${Math.round(tn)} r/min`);
  if (tf !== null) segs.push(`进刀 ${tf.toFixed(2)} mm/r`);

  return {
    hasBadge,
    n,
    emblem,
    no: hasBadge ? String(badge.no) : '——',
    /* §6.1：空态的姓名与等级 */
    name: (badge && badge.name) ? badge.name : (hasBadge ? '未署名' : '未署名'),
    rank: (badge && badge.rank) ? badge.rank : '尚未定型',
    statScore: (badge && badge.castScore != null) ? String(badge.castScore) : '—',
    /* R1-P2：原「车削用时」那一路读数整条删除 —— 用时已不是概念。改为本局车削评分。 */
    turnScore: (TR && num(TR.score) !== null) ? String(Math.round(num(TR.score))) : '—',
    statUnlock: `${n} / 12`,
    /* 本局特征（供海报与右栏） */
    sandboxLabel: sbTag ? (castingName ? `${sbTag} · ${castingName}` : sbTag)
      : (castingName ?? '—'),
    fingerprint: segs.length ? segs.join(' · ') : null,
    /* 原值：供验收脚本取证（不放 DOM） */
    casting: castingName,
    sandbox: sandboxNo,
    turnRaw: TR,
    paramsRaw: P,
    /* 两种"缺一段"的提示行（§6.1）—— 「本局还没车削过」那一条随用时概念一起删除 */
    needCast: !hasBadge,
    lockedCount: Math.max(0, TOTAL - n),
  };
}

/** §9 口径修正：badge.unlocked 与数组不一致 → 以数组为准并回写（返回是否发生回写） */
export function reconcileUnlocked(badge, n) {
  const want = `${n}/12`;
  if (!badge) return false;
  if (badge.unlocked === want) return false;
  store.set(K_BADGE, { ...badge, unlocked: want });   // 只改 unlocked 一个字段
  return true;
}

/* ============================================================ */
export function renderVault(root, { go, routes }) {
  /* ---------- 数据（读一次，之后以内存副本为准） ---------- */
  let badge = store.get(K_BADGE, null);
  const unlocked = store.get(K_UNLOCKED, []);
  let view = buildView(badge, unlocked);
  let reconciled = false;
  if (view.hasBadge) reconciled = reconcileUnlocked(badge, view.n);
  if (reconciled) badge = store.get(K_BADGE, badge);

  const page = document.createElement('div');
  page.className = 'page vault-page';

  /* ============ 骨架（对齐画稿 S05：无顶栏、无 HUD、无场馆导航 —— §1「画稿如此」） ============
     R1-P2 9b：**唯一例外**是这颗返回键 —— 用 `position: fixed` 悬置（同 `.vault__storagetip` 的手法），
     故它不参与 `.vault` 的两栏栅格、不占 878 / 900 的高度预算，也不会挤出横向滚动。
     ⚠️ 不用 `absolute`：`.vault` 是 grid 且未设 position，绝对定位会挂到初始包含块上，位置不可控。 */
  page.innerHTML = `
    <main class="vault">
      <button class="hud__back vault__back" type="button" data-go="">‹ 返回首页</button>

      <!-- ============ 左栏 · 藏品展示 ============ -->
      <section class="vault__left" aria-label="数字工匠证">
        <article class="vault__card" data-card>
          <header class="vault__card-head">
            <span class="vault__card-label">中国工业博物馆 · 数字工匠证</span>
            <span class="vault__card-no num" data-no>NO. ——</span>
          </header>

          <div class="vault__emblem" data-emblem>
            <canvas class="vault__emblem-canvas" data-emblem-canvas
              role="img" aria-label="铸造徽记"></canvas>
          </div>

          <div class="vault__name-row">
            <h2 class="vault__name" data-name tabindex="0" role="button"
              aria-label="编辑姓名">未署名</h2>
            <span class="vault__name-hint" data-name-hint hidden>点击填写姓名</span>
          </div>

          <p class="vault__rank" data-rank>尚未定型</p>

          <span class="vault__rule" aria-hidden="true"></span>

          <dl class="vault__meta">
            <div class="vault__meta-item">
              <dt>浇筑评分</dt><dd class="num" data-score>—</dd>
            </div>
            <div class="vault__meta-item">
              <!-- R1-P2 9a④：原「车削用时」→「车削评分」；属性名同步改为 data-turn -->
              <dt>车削评分</dt><dd class="num" data-turn>—</dd>
            </div>
            <div class="vault__meta-item">
              <dt>解锁藏品</dt><dd class="num" data-unlock>0 / 12</dd>
            </div>
          </dl>

          <div class="vault__card-spacer" aria-hidden="true"></div>
          <p class="vault__card-foot num">炉火不灭 · 2026</p>
        </article>

        <!-- ============ 馆藏图鉴带（§4，规格新增） ============ -->
        <section class="vault__dex" aria-label="馆藏图鉴">
          <div class="vault__dex-head">
            <span class="vault__dex-title">馆藏图鉴</span>
            <span class="vault__dex-count num" data-dex-count>0 / 12</span>
          </div>
          <ol class="vault__dex-grid" data-dex-grid></ol>
          <!-- R1-P2 9c：12 格共享的一行就地说明（绝对定位在图鉴带下方，不占栅格高度） -->
          <p class="vault__dex-note" data-dex-note hidden></p>
        </section>
      </section>

      <!-- ============ 右栏 · 功能与衍生（画稿 S05 文案原值） ============ -->
      <aside class="vault__right" aria-label="工牌信息与衍生品">
        <p class="eyebrow">第四层 · 带走</p>
        <h1 class="vault__title">一次体验，换来一张自己的工牌</h1>
        <p class="vault__body" data-body></p>
        <!-- R1-P2 9a⑤：工艺指纹（缺哪段省哪段；全缺则整行不渲染、不占高度） -->
        <p class="vault__fingerprint num" data-fingerprint hidden></p>
        <span class="vault__rule" aria-hidden="true"></span>

        <ul class="vault__derivs" data-derivs>
          ${DERIVS.map((d, i) => `
            <li class="vault__deriv" data-deriv="${i}">
              <!-- R1-P2 9c：保留 <li> 外壳（栅格/锁定态挂在它身上），内容包进内嵌按钮 ⇒ 可点开收起 -->
              <button class="vault__deriv-btn" type="button" data-deriv-btn="${i}"
                aria-expanded="false" aria-controls="deriv-note-${i}"
                title="${d.name}">${d.name}</button>
              <span class="vault__deriv-desc">${d.desc}</span>
              <span class="vault__deriv-badge num" data-deriv-badge hidden></span>
              <p class="vault__deriv-note" id="deriv-note-${i}" data-deriv-note="${i}" hidden></p>
            </li>
          `).join('')}
        </ul>

        <div class="vault__actions">
          <button class="btn btn--primary vault__poster" data-poster>生成分享海报</button>
          <button class="btn btn--ghost vault__next" data-next>去其他展馆看看</button>
        </div>
        <p class="vault__note" data-note></p>
        <p class="vault__toast" data-toast hidden></p>
      </aside>
    </main>
  `;
  root.appendChild(page);

  /* 存储不可用提示（状态 C）：照常可看，只是刷新即失（fixed 悬置，不挤占 878 预算） */
  if (!storageOk) {
    const tip = document.createElement('p');
    tip.className = 'vault__storagetip';
    tip.textContent = '本次记录不会保存';
    page.querySelector('.vault').before(tip);
  }

  const q = (s) => page.querySelector(s);
  const els = {
    no: q('[data-no]'),
    emblemCanvas: q('[data-emblem-canvas]'),
    emblemBox: q('[data-emblem]'),
    name: q('[data-name]'),
    nameHint: q('[data-name-hint]'),
    rank: q('[data-rank]'),
    score: q('[data-score]'),
    turn: q('[data-turn]'),
    unlock: q('[data-unlock]'),
    dexCount: q('[data-dex-count]'),
    dexGrid: q('[data-dex-grid]'),
    dexNote: q('[data-dex-note]'),
    body: q('[data-body]'),
    fingerprint: q('[data-fingerprint]'),
    derivs: q('[data-derivs]'),
    poster: q('[data-poster]'),
    next: q('[data-next]'),
    note: q('[data-note]'),
    toast: q('[data-toast]'),
  };

  /* ============ 徽记渲染（页面侧；海报侧复用同一 drawEmblem） ============ */
  let dprUsed = 1;
  function paintEmblem() {
    const cv = els.emblemCanvas;
    const box = els.emblemBox;
    /* §2：徽记区 fill_container × 210 —— 圆形徽记取**高度** 210 做正方形（宽度 344 是框不是圆） */
    const size = Math.max(1, Math.round(box.clientHeight || 210));
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    dprUsed = dpr;
    cv.width = Math.round(size * dpr);
    cv.height = Math.round(size * dpr);
    cv.style.width = `${size}px`;
    cv.style.height = `${size}px`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);      // devicePixelRatio 缩放，避免模糊（§3.2）
    ctx.clearRect(0, 0, size, size);
    drawEmblem(ctx, 0, 0, size, view.emblem);
    cv.setAttribute('aria-label', view.emblem.casting
      ? `铸造徽记：已解锁 ${view.n} / 12，轮廓为最早浇出的铸件`
      : '铸造徽记：尚未点火');
  }

  /* ============ 左栏文字 ============ */
  function paintCard() {
    els.no.textContent = `NO. ${view.no}`;
    els.name.textContent = view.name;
    els.rank.textContent = view.rank;
    els.score.textContent = view.statScore;
    els.turn.textContent = view.turnScore;
    els.unlock.textContent = view.statUnlock;
    els.nameHint.hidden = Boolean(badge && badge.name);
  }

  /* ============ 图鉴带（§4：6 列 × 2 行，顺序固定 sandbox_0 → sandbox_11） ============
     R1-P2 9c：外层仍是 `<li class="vault__cell">`（栅格与 `.is-on` 态都挂在它身上），
     内容包进内嵌 `<button>` ⇒ 可点、可 Tab、`aria-expanded` 同步。**不换标签、不跳页、不弹模态。** */
  function paintDex() {
    els.dexCount.textContent = `${view.n} / 12`;
    const lit = new Set(Array.isArray(unlocked) ? unlocked : []);
    els.dexGrid.innerHTML = SANDBOXES.map((sb, i) => {
      const isOn = lit.has(i);
      const num = String(i + 1).padStart(2, '0');
      return `<li class="vault__cell${isOn ? ' is-on' : ''}" data-cell="${i}">
        <button class="vault__cell-btn" type="button" data-cell-btn="${i}"
          aria-expanded="false" title="${sb.collection}"
          aria-label="${sb.collection}${isOn ? '（已解锁，点开查看馆藏说明）' : '（未解锁，点开查看解锁条件）'}">
          ${boxIcon(isOn ? 'var(--c-iron)' : 'var(--c-line)', !isOn)}
          <span class="vault__cell-no num">${num}</span>
        </button>
      </li>`;
    }).join('');
    els.dexNote.hidden = true;
    els.dexNote.textContent = '';
  }

  /* ============ 衍生品锁定态（§5.3：降对比 + 一行小字，不做毛玻璃/锁形图标） ============ */
  function paintDerivs() {
    DERIVS.forEach((d, i) => {
      const el = els.derivs.querySelector(`[data-deriv="${i}"]`);
      const badgeEl = el.querySelector('[data-deriv-badge]');
      const noteEl = el.querySelector(`[data-deriv-note="${i}"]`);
      const locked = view.n < d.need;
      el.classList.toggle('is-locked', locked);
      // R1-P2 9c：展开内容**只由已有数据推出**（DERIVS[i].need + 当前解锁数），不新编文案
      if (noteEl) {
        noteEl.textContent = d.need === 0
          ? '完成一次浇铸即可获取'
          : (locked ? `需要解锁 ${d.need} 件馆藏` : `已达解锁条件（${view.n} / 12）`);
      }
      // P0-FIX-1：徽标按**锁定态**出现，而不是按 `d.need === 0` —— `d.need` 是门槛不是已解锁数
      //（规格 `VAULT-SPEC.md` §5.3 已改为「需 3 / 12」；d.need === 0 的两项恒未锁定 ⇒ 自动并入隐藏分支）
      if (locked) {
        badgeEl.hidden = false;
        badgeEl.textContent = `需 ${d.need} / 12`;
      } else {
        badgeEl.hidden = true;
      }
    });
  }

  /* ============ 右栏正文与按钮 ============ */
  function paintRight() {
    /* 画稿 S05 正文原值（有工牌时照画稿；空态画稿未画，按 §6.1 写实提示 —— 实现方判断） */
    const BODY_DESIGN = '完成浇铸与车削后，系统按你的操作过程自动生成唯一编号的数字工牌，'
      + '包含评分、工艺特征与解锁的工艺知识点。可保存为图片分享，也可凭编号在博物馆兑换实体文创。';
    const BODY_EMPTY = '完成一次浇铸后，系统会为你生成唯一编号的数字工牌 —— '
      + '徽记、评分与馆藏图鉴都会随之点亮。';
    els.body.innerHTML = `<span>${view.hasBadge ? BODY_DESIGN : BODY_EMPTY}</span>`;

    /* R1-P2 9a⑤：工艺指纹 —— 缺哪段省哪段；全缺则整行不渲染（`hidden` 不占高度）。
       ⚠️ 原正文写「包含评分、**用时**…」在 9a 之后是**假话**（卡上已无用时），故同步改写。 */
    if (view.fingerprint) {
      els.fingerprint.textContent = view.fingerprint;
      els.fingerprint.hidden = false;
    } else {
      els.fingerprint.textContent = '';
      els.fingerprint.hidden = true;
    }

    els.poster.disabled = !view.hasBadge;            // 空态主按钮 disabled（§6.1）
    els.poster.textContent = '生成分享海报';
    els.next.textContent = view.hasBadge ? '去其他展馆看看' : '去亲手浇铸 →';
    els.next.dataset.to = view.hasBadge ? 'hall' : 'cast';

    /* R1-P2 9a⑤：原「还没车削过 → 加一行『去协作车削 →』」的提示随该字段一起删除 */
    const notes = [];
    if (view.needCast) notes.push('<span>完成一次浇铸即可生成工牌</span>');
    els.note.innerHTML = notes.join('');
    els.note.hidden = notes.length === 0;
  }

  function paintAll() {
    paintEmblem();
    paintCard();
    paintDex();
    paintDerivs();
    paintRight();
  }

  /* ============ 姓名编辑（§7：原地 input，Enter/失焦提交，Esc 取消） ============ */
  let editing = false;
  function startEdit() {
    if (editing) return;
    editing = true;
    const cur = (badge && badge.name) || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'vault__name vault__name--input';
    input.maxLength = 8;
    input.value = cur;
    input.setAttribute('aria-label', '姓名，最多 8 个字');
    input.placeholder = '未署名';
    els.name.replaceWith(input);
    input.focus();
    input.select();

    const finish = (commit) => {
      if (!editing) return;
      editing = false;
      if (commit) {
        const val = String(input.value ?? '').replace(/^\s+|\s+$/g, '')  // 去首尾空格
          .slice(0, 8);                                                  // 双保险截断（maxlength 之外，防程序性赋值绕过）
        if (val !== '') {                                                // 空串不写入
          const base = badge ?? {};
          badge = { ...base, name: val };                                // 只改 name 一个字段
          store.set(K_BADGE, badge);
          view = buildView(badge, unlocked);
          paintCard();
          paintDerivs();
          paintRight();
        }
      }
      input.replaceWith(els.name);
      els.name.focus?.();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
  }
  els.name.addEventListener('click', startEdit);
  els.name.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(); }
  });

  /* ============ R1-P2 9c：图鉴格 / 衍生卡「再点一次收起」 ============
     用事件委托挂在容器上（`paintDex()` 会重建 `innerHTML`，挂到格子上会被冲掉）。
     图鉴 12 格**共用一行说明**（左栏装不下卡中卡），故开一格先收起其余。 */
  function toggleDex(i, btn) {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    els.dexGrid.querySelectorAll('[data-cell-btn]')
      .forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (isOpen) {
      els.dexNote.hidden = true;
      els.dexNote.textContent = '';
      return;
    }
    btn.setAttribute('aria-expanded', 'true');
    const lit = Array.isArray(unlocked) ? unlocked : [];
    els.dexNote.textContent = lit.includes(i)
      ? SANDBOXES[i].collection                    // 已解锁：给馆藏名（只用已有数据）
      : '完成一次浇铸可解锁';                       // 未解锁：给解锁条件，不跳页、不弹模态
    els.dexNote.hidden = false;
  }
  els.dexGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cell-btn]');
    if (btn) toggleDex(Number(btn.dataset.cellBtn), btn);
  });
  els.derivs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-deriv-btn]');
    if (!btn) return;
    const i = Number(btn.dataset.derivBtn);
    const note = els.derivs.querySelector(`[data-deriv-note="${i}"]`);
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    if (note) note.hidden = isOpen;
  });

  /* ============ 按钮 ============ */
  els.next.addEventListener('click', () => go(els.next.dataset.to));

  /* R1-P2 9b：返回键走 `data-go` 事件委托（与 home.js / hall.js 同一写法；dispose 里对称移除） */
  function onGoClick(e) {
    const btn = e.target.closest('[data-go]');
    if (btn) go(btn.dataset.go);
  }
  page.addEventListener('click', onGoClick);

  let exportStats = null;
  els.poster.addEventListener('click', async () => {
    if (els.poster.disabled) return;
    els.poster.disabled = true;
    els.poster.textContent = '生成中…';
    try {
      const r = await exportPoster(view);
      exportStats = r;
      els.poster.textContent = r.ok ? '已导出 ✓' : '导出失败';
      if (!r.ok) els.toast.textContent = '导出失败，请重试';
    } catch (err) {
      exportStats = { ok: false, error: String(err && err.message || err) };
      els.poster.textContent = '导出失败';
      els.toast.textContent = '导出失败，请重试';
    }
    els.toast.hidden = false;
    setTimeout(() => { els.poster.disabled = !view.hasBadge; }, 400);
  });

  /* ============ 启动 ============ */
  paintAll();
  const onResize = () => paintEmblem();
  window.addEventListener('resize', onResize);

  /* ============ 调试钩子（?debug=1）：自测 + 数值取证 + 截图驱动 ============ */
  if (new URLSearchParams(location.search).has('debug')) {
    window.__vault = window.__vault || {};
    window.__vault.state = () => {
      const r = (s) => {
        const el = q(s);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return {
          x: +b.x.toFixed(1), y: +b.y.toFixed(1),
          w: +b.width.toFixed(1), h: +b.height.toFixed(1),
        };
      };
      return {
        hasBadge: view.hasBadge, n: view.n, no: view.no, name: view.name,
        rank: view.rank, statScore: view.statScore,
        /* R1-P2 9a③/⑦：车削读数由「用时」改为「评分」，并把新增字段的原值一并暴露供取证 */
        turnScore: view.turnScore,
        casting: view.casting, sandbox: view.sandbox,
        turn: view.turnRaw, params: view.paramsRaw,
        fingerprint: view.fingerprint, sandboxLabel: view.sandboxLabel,
        statUnlock: view.statUnlock,
        hasBadge_no: badge ? badge.no : null,
        badgeUnlocked: badge ? badge.unlocked : null,
        reconciled,
        emblem: view.emblem,
        dpr: dprUsed,
        locked: DERIVS.map((d, i) => ({
          name: d.name, need: d.need,
          locked: els.derivs.querySelector(`[data-deriv="${i}"]`).classList.contains('is-locked'),
        })),
        dex: {
          count: els.dexGrid.children.length,
          on: els.dexGrid.querySelectorAll('.vault__cell.is-on').length,
          /* R1-P2 9c：`title` 已从 `<li>` 移到内嵌按钮上（`.vault__cell` 的栅格不能动） */
          titles: [...els.dexGrid.children]
            .map((li) => li.querySelector('.vault__cell-btn')?.getAttribute('title') ?? null),
          noteHidden: els.dexNote.hidden,
          note: els.dexNote.textContent,
        },
        posterDisabled: els.poster.disabled,
        storageOk,
        rects: {
          left: r('.vault__left'), right: r('.vault__right'),
          card: r('.vault__card'), emblem: r('.vault__emblem'),
          dex: r('.vault__dex'), derivs: r('.vault__derivs'),
          actions: r('.vault__actions'), grid: r('[data-derivs]'),
          deriv0: r('[data-deriv="0"]'), deriv1: r('[data-deriv="1"]'),
          next: r('.vault__next'),
        },
        docScrollW: document.documentElement.scrollWidth,
        docClientW: document.documentElement.clientWidth,
      };
    };
    /** 姓名编辑驱动（截图 + V7 走查用；走真实事件路径） */
    window.__vault.edit = () => { startEdit(); return Boolean(q('.vault__name--input')); };
    window.__vault.type = (val) => {
      const inp = q('.vault__name--input');
      if (!inp) return null;
      inp.value = val;
      return inp.value;
    };
    window.__vault.commit = (enter = true) => {
      const inp = q('.vault__name--input');
      if (!inp) return null;
      inp.dispatchEvent(new KeyboardEvent('keydown',
        { key: enter ? 'Enter' : 'Escape', bubbles: true }));
      return JSON.parse(localStorage.getItem('im.badge') || 'null');
    };
    /** 海报绘制（不下载）—— 供 V8 逐像素比对 */
    window.__vault.paintPoster = () => {
      const cv = document.createElement('canvas');
      renderPoster(cv, view);
      return cv;
    };
    window.__vault.posterSize = () => ({ ...POSTER_SIZE });
    window.__vault.exported = () => exportStats;
    /** R1-P2 9c：走真实事件路径点开 / 收起图鉴格与衍生卡（取证用） */
    window.__vault.openCell = (i) => {
      const btn = q(`[data-cell-btn="${i}"]`);
      if (!btn) return null;
      btn.click();
      return {
        expanded: btn.getAttribute('aria-expanded'),
        note: els.dexNote.textContent, hidden: els.dexNote.hidden,
      };
    };
    window.__vault.openDeriv = (i) => {
      const btn = q(`[data-deriv-btn="${i}"]`);
      if (!btn) return null;
      btn.click();
      const note = q(`[data-deriv-note="${i}"]`);
      return {
        expanded: btn.getAttribute('aria-expanded'),
        note: note ? note.textContent : null,
        hidden: note ? note.hidden : null,
      };
    };
    /** R1-P2 9b：返回键读数（是否 fixed / 是否在视口内 / 能否点） */
    window.__vault.back = () => {
      const b = q('.vault__back');
      if (!b) return null;
      const rc = b.getBoundingClientRect();
      return {
        fixed: getComputedStyle(b).position,
        go: b.getAttribute('data-go'),
        x: +rc.x.toFixed(1), y: +rc.y.toFixed(1),
        w: +rc.width.toFixed(1), h: +rc.height.toFixed(1),
      };
    };
    /** V3 用：把页面正在用的同一个 drawEmblem 交给验收脚本，避免脚本自己重写一份 */
    window.__drawEmblemForTest = drawEmblem;
  }

  return {
    dispose() {
      window.removeEventListener('resize', onResize);
      page.removeEventListener('click', onGoClick);
      page.remove();
    },
  };
}
