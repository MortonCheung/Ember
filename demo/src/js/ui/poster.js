/* ============================================================
   ui/poster.js — 分享海报导出（Canvas 2D 重绘，1080×1350）
   依据：spec/VAULT-SPEC.md §8（唯一依据）+ archive/spec/PROMPT-VAULT.md「第 3 条」
   纪律：① **不去截三维帧** —— viewport.js 未开 preserveDrawingBuffer，
           且离开 #/cast 后场景已 dispose（§8 裁定理由）；
        ② 徽记**复用 ui/emblem.js 的 drawEmblem()**，与页面同一函数（§3.2 / V3）；
        ③ 零随机 —— 同数据两次导出逐像素一致（V8）；
        ④ 必须先 await document.fonts.ready 再绘制，否则中文字形回落（§8）。
           本机 index.html 有 Google Fonts 外链，评委机断网时 fonts.ready 可能长挂
           → 用 Promise.race 加 2s 兜底回落系统字体栈（实现方判断，见 IMPLEMENTATION-VAULT §偏离）。
        ⑤ toBlob → createObjectURL → <a download> → **用后 revokeObjectURL**（§8）。
   ============================================================ */

import { drawEmblem, EMBLEM_COLORS } from './emblem.js';

const W = 1080;
const H = 1350;

const FONT_CN = '"LXGW WenKai","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';

/** 字体等待：正常等 fonts.ready；断网/慢网 2s 后回落系统字体栈继续画 */
export function waitFonts(timeoutMs = 2000) {
  const ready = (typeof document !== 'undefined' && document.fonts && document.fonts.ready)
    ? document.fonts.ready.catch(() => null)
    : Promise.resolve(null);
  const timer = new Promise((res) => setTimeout(res, timeoutMs));
  return Promise.race([ready, timer]);
}

/** 居中对齐的一行文字（省掉每次 save/restore） */
function center(ctx, text, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

/** 元信息三值横排：键 24px + 值 40px Bold，底部对齐 */
function drawStat(ctx, cx, y, label, value) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 24px ${FONT_CN}`;
  ctx.fillStyle = EMBLEM_COLORS.steel;
  ctx.fillText(label, cx, y);
  ctx.font = `700 40px ${FONT_CN}`;
  ctx.fillStyle = EMBLEM_COLORS.text;
  /* R1-P2：老工牌没有新字段 ⇒ 值缺失时兜底 `—`，绝不把 undefined 画进海报 */
  ctx.fillText(value == null ? '—' : String(value), cx, y + 52);
}

/**
 * 绘制海报到给定 canvas（纯绘制，不触网、不下载 —— 便于验收脚本单独调用做逐像素比对）
 * @param {HTMLCanvasElement} canvas 目标画布（会被设成 1080×1350）
 * @param {object} view 页面已算好的展示数据（见 vault.js buildView）
 */
export function renderPoster(canvas, view) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  /* 底色 --c-bg */
  ctx.fillStyle = EMBLEM_COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  /* 内描边：让海报在浅色聊天背景里也有边 */
  ctx.strokeStyle = EMBLEM_COLORS.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  /* 卡头标签：左右两端 */
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 26px ${FONT_CN}`;
  ctx.fillStyle = EMBLEM_COLORS.iron;
  ctx.textAlign = 'left';
  ctx.fillText('中国工业博物馆 · 数字工匠证', 88, 138);
  ctx.font = `500 26px ${FONT_CN}`;
  ctx.fillStyle = EMBLEM_COLORS.steel;
  ctx.textAlign = 'right';
  ctx.fillText(`NO. ${view.no}`, W - 88, 138);

  /* 徽记：复用同一 drawEmblem（V3 要求两处逐像素一致） */
  const embSize = 520;
  drawEmblem(ctx, (W - embSize) / 2, 196, embSize, view.emblem);

  /* 姓名 64px Bold */
  center(ctx, view.name, W / 2, 830, `700 64px ${FONT_CN}`, EMBLEM_COLORS.text);

  /* 工种 · 等级 28px --c-iron */
  center(ctx, view.rank, W / 2, 890, `500 28px ${FONT_CN}`, EMBLEM_COLORS.iron);

  /* R1-P2 9a⑥：本局砂箱行（24px）。y = 918 —— 基线之上贴住等级行、之下离 940 分隔线还有余量。
     取 view.sandboxLabel；缺数据显示 `—`（老工牌兼容）。 */
  center(ctx, view.sandboxLabel ?? '—', W / 2, 918, `400 24px ${FONT_CN}`, EMBLEM_COLORS.steel);

  /* 分隔线 */
  ctx.strokeStyle = EMBLEM_COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 940);
  ctx.lineTo(W - 200, 940);
  ctx.stroke();

  /* 三值横排 40px Bold */
  const cols = [W * 0.22, W * 0.5, W * 0.78];
  drawStat(ctx, cols[0], 1026, '浇筑评分', view.statScore);
  /* R1-P2 9a⑥：原「车削用时」→「车削评分」（取 badge.turn.score；缺则 —） */
  drawStat(ctx, cols[1], 1026, '车削评分', view.turnScore);
  drawStat(ctx, cols[2], 1026, '解锁藏品', view.statUnlock);

  /* 锁定/解锁一行说明 */
  const tail = view.lockedCount > 0
    ? `已解锁 ${view.n}/12 · 还有 ${12 - view.n} 件馆藏在等你`
    : '12 件馆藏已全部解锁';
  center(ctx, tail, W / 2, 1150, `400 24px ${FONT_CN}`, EMBLEM_COLORS.steel);

  /* 底部 炉火不灭 · 2026 */
  center(ctx, '炉火不灭 · 2026', W / 2, H - 108, `500 28px ${FONT_CN}`, EMBLEM_COLORS.steel);

  return canvas;
}

/**
 * 导出：awaitFonts → 绘制 → toBlob → 下载 → revokeObjectURL
 * @returns {Promise<{ok:boolean, filename:string, bytes:number, ms:number}>}
 */
export async function exportPoster(view, { fontsTimeoutMs = 2000 } = {}) {
  const t0 = Date.now();
  await waitFonts(fontsTimeoutMs);

  const canvas = document.createElement('canvas');
  renderPoster(canvas, view);

  const filename = `工牌-NO.${view.no}.png`;
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return { ok: false, filename, bytes: 0, ms: Date.now() - t0 };

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    /* 用后立即回收（§8）—— 放在 finally，抛异常也不泄漏 */
    URL.revokeObjectURL(url);
  }
  return { ok: true, filename, bytes: blob.size, ms: Date.now() - t0 };
}

export const POSTER_SIZE = { W, H };
