/* ============================================================
   ui/emblem.js — 数据驱动的圆形铸造徽记（Canvas 2D）
   依据：spec/VAULT-SPEC.md §3（唯一依据）+ archive/spec/PROMPT-VAULT.md「第 1 条」
   纪律：① 页面上（vault.js）与海报上（ui/poster.js）**共用本函数**，
          不维护两套绘制代码（§3.2 裁定的全部理由）；
        ② 零随机 —— 同 data 必然同像素；
        ③ 不读 DOM、不读存储、不读时间：data 全由调用方传入（可单测）；
        ④ 颜色只从 tokens.css 的真实值取（此处是 Canvas，取不到 CSS 变量，
           故用与 tokens.css 逐字一致的常量，见 COLORS 注释）。

   三部分（§3.1）：
     · 外圈  12 格刻度环 —— 已解锁段 --c-iron，未解锁段 --c-line（段间留 2° 缝）
     · 环内  铸件轮廓（法兰 / 床身 / 阀体 / 齿轮 简笔线稿），取 unlocked 最小序号
     · 底环  36 根等距装饰刻度（--c-line 40% 透明）
   空态（§3.4）：12 段全暗 + 未点火炉口拱形 + 「尚未点火」
   ============================================================ */

/* tokens.css 的真实值（该文件冻结，Canvas 里读不到 CSS 变量，故此处照抄）
   --c-bg #0E1116 · --c-surface-2 #1F242B · --c-line #2E3640
   --c-text #F2F4F7 · --c-text-muted #8B939E · --c-iron #E8663C · --c-steel #525D69 */
export const EMBLEM_COLORS = {
  iron: '#E8663C',
  line: '#2E3640',
  steel: '#525D69',
  text: '#F2F4F7',
  surface2: '#1F242B',
  bg: '#0E1116',
};

/** 设计基准边长（画布上按此坐标系落笔，再由调用方 scale，保证任何尺寸同形） */
const BASE = 210;

/** 12 格刻度环：段间缝 2° */
const SEG_GAP_DEG = 2;
const SEG_COUNT = 12;
/** 底环装饰刻度 */
const TICK_COUNT = 36;

/* 字体：与 tokens.css 的 --font-cn 同栈（Canvas 里直接写字体栈） */
const FONT_CN = '"LXGW WenKai","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';

/* ------------------------------------------------------------
   §3.3 铸件轮廓：4 种，各由 6–10 条线段构成（简笔线稿，不填充）
   坐标写在 [-1,1] 的归一化方框内，绘制时乘 r（轮廓半径）。
   数量：法兰 8 条 / 床身 10 条 / 阀体 9 条 / 齿轮 8 条
   ------------------------------------------------------------ */
const CONTOURS = {
  /* 法兰：两个同心圆（粗） + 螺栓孔小圆（细） —— 8 条 */
  flange: {
    lines: [
      [[0, -0.86, 0.86, -0.5, 1.0, 0, 0.86, 0.5, 0.86, 0.86, 0.5, 1.0, 0, 0.86,
        -0.5, 0.86, -0.86, 0.5, -1.0, 0, -0.86, -0.5, -0.86, -0.86, -0.5,
        -1.0, 0, -0.86, 0.5], 2.0, 1],
      [[0, -0.44, 0.44, -0.26, 0.52, 0, 0.44, 0.26, 0.44, 0.44, 0.26, 0.52, 0,
        0.44, -0.26, 0.44, -0.44, 0.26, -0.52, 0, -0.44, -0.26, -0.44, -0.44,
        -0.26, -0.52, 0, -0.44, 0.26], 2.0, 1],
      [[0.60, -0.44, 0.72, -0.36, 0.72, -0.24, 0.60, -0.16, 0.48, -0.24, 0.48, -0.36, 0.60, -0.44], 1.2, 1],
      [[0.60, 0.16, 0.72, 0.24, 0.72, 0.36, 0.60, 0.44, 0.48, 0.36, 0.48, 0.24, 0.60, 0.16], 1.2, 1],
      [[-0.60, -0.44, -0.48, -0.36, -0.48, -0.24, -0.60, -0.16, -0.72, -0.24, -0.72, -0.36, -0.60, -0.44], 1.2, 1],
      [[-0.60, 0.16, -0.48, 0.24, -0.48, 0.36, -0.60, 0.44, -0.72, 0.36, -0.72, 0.24, -0.60, 0.16], 1.2, 1],
      [[0, -0.16, 0.20, -0.16, 0.20, 0.16, 0, 0.16], 1.2, 0],
      [[-0.20, -0.16, 0, -0.16, 0, 0.16, -0.20, 0.16], 1.2, 0],
    ],
  },
  /* 床身：V 形导轨 + 底脚 + 端面 —— 10 条 */
  bed: {
    lines: [
      [[-0.88, 0.30, 0.88, 0.30], 2.2, 1],
      [[-0.88, -0.18, 0.88, -0.18], 2.2, 1],
      [[-0.88, -0.18, -0.88, 0.30], 2.2, 1],
      [[0.88, -0.18, 0.88, 0.30], 2.2, 1],
      [[-0.62, 0.30, -0.50, 0.10, -0.34, 0.30], 1.4, 1],
      [[0.18, 0.30, 0.30, 0.10, 0.46, 0.30], 1.4, 1],
      [[-0.78, 0.30, -0.78, -0.52, -0.52, -0.52, -0.52, -0.18], 1.4, 1],
      [[0.52, 0.30, 0.52, -0.52, 0.78, -0.52, 0.78, -0.18], 1.4, 1],
      [[-0.78, -0.52, 0.78, -0.52], 1.4, 0],
      [[-0.30, -0.18, -0.30, 0.10, -0.06, 0.10, -0.06, -0.18], 1.2, 0],
    ],
  },
  /* 阀体：六边形壳体 + 两法兰端 + 中心通孔 —— 9 条 */
  valve: {
    lines: [
      [[0, -0.62, 0.54, -0.31, 0.54, 0.31, 0, 0.62, -0.54, 0.31, -0.54, -0.31, 0, -0.62], 2.0, 1],
      [[-0.54, -0.18, -0.88, -0.18, -0.88, 0.18, -0.54, 0.18], 1.6, 1],
      [[0.54, -0.18, 0.88, -0.18, 0.88, 0.18, 0.54, 0.18], 1.6, 1],
      [[-0.88, -0.18, -0.88, 0.18], 1.2, 1],
      [[0.88, -0.18, 0.88, 0.18], 1.2, 1],
      [[0, -0.22, 0.19, -0.11, 0.19, 0.11, 0, 0.22, -0.19, 0.11, -0.19, -0.11, 0, -0.22], 1.2, 1],
      [[0, -0.62, 0, -0.80], 1.4, 0],
      [[0, 0.62, 0, 0.80], 1.4, 0],
      [[-0.40, -0.44, -0.62, -0.62], 1.0, 0],
    ],
  },
  /* 齿轮（塔轮）：齿圈 + 齿形 + 轮毂 + 辐板 —— 8 条 */
  gear: {
    lines: [
      [[0, -0.60, 0.60, -0.34, 0.60, 0.34, 0, 0.60, -0.60, 0.34, -0.60, -0.34, 0, -0.60], 2.0, 1],
      [[0, -0.72, 0.13, -0.66, 0.13, -0.54, 0, -0.48], 1.2, 1],
      [[0.38, -0.66, 0.45, -0.56, 0.40, -0.46, 0.28, -0.50], 1.2, 1],
      [[0.66, -0.22, 0.72, -0.10, 0.66, 0.02, 0.54, -0.02], 1.2, 1],
      [[0.10, 0.66, 0.02, 0.54, -0.10, 0.54, -0.16, 0.64], 1.2, 1],
      [[-0.46, 0.58, -0.42, 0.46, -0.52, 0.38, -0.64, 0.46], 1.2, 1],
      [[-0.68, -0.16, -0.66, -0.04, -0.68, 0.08, -0.72, -0.04], 1.2, 1],
      [[0, -0.24, 0.24, 0, 0, 0.24, -0.24, 0, 0, -0.24], 1.4, 1],
    ],
  },
};

/* ------------------------------------------------------------
   几何工具
   ------------------------------------------------------------ */

/** 极坐标 → 直角坐标（12 点方向为 -90°，即"表盘"朝向） */
function polar(cx, cy, radius, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
}

/** 把归一化轮廓坐标折线落笔画出来；dashed=true 用细虚线（辅线） */
function strokePoly(ctx, pts, radius, cx, cy, lineWidth, col, dashed) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const px = cx + pts[i] * radius;
    const py = cy + pts[i + 1] * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = col;
  if (dashed) ctx.setLineDash([3 * lineWidth, 3 * lineWidth]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

/** 空态：未点火的炉口拱形轮廓（S10 炉口剪影简化版，--c-steel） */
function drawColdFurnace(ctx, cx, cy, r, col) {
  const outline = [
    [-0.62, 0.60], [-0.62, -0.05],
    [-0.60, -0.32], [-0.47, -0.52], [-0.26, -0.62],
    [0, -0.66],
    [0.26, -0.62], [0.47, -0.52], [0.60, -0.32],
    [0.62, -0.05], [0.62, 0.60],
  ];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = col;

  strokePoly(ctx, outline.flat(), r, cx, cy, 2.2, col, false);            // 拱形外框
  strokePoly(ctx, [-0.44, 0.60, -0.44, -0.02], r, cx, cy, 1.4, col, false); // 左炉口壁
  strokePoly(ctx, [0.44, 0.60, 0.44, -0.02], r, cx, cy, 1.4, col, false);   // 右炉口壁
  /* 炉口内的冷灰空腔：一道贴着拱顶的弧（用折线近似） */
  const arc = [];
  for (let i = 0; i <= 10; i++) {
    const d = -48 + i * 9.6;
    const [px, py] = polar(0, 0.05, 0.40, d + 90);
    arc.push(px, py * 1.25);
  }
  strokePoly(ctx, arc, r, cx, cy, 1.2, col, true);
  /* 出铁口（熄灭） */
  strokePoly(ctx, [-0.16, 0.60, 0.16, 0.60], r, cx, cy, 2.6, col, false);
  ctx.restore();
}

/* ------------------------------------------------------------
   主函数：drawEmblem(ctx, x, y, size, data)
     ctx   —— CanvasRenderingContext2D（页面 / 海报都是它）
     x, y  —— 徽记方框左上角（与页面 DOM 的 210×210 方框对应）
     size  —— 方框边长（正方形；页面 210、海报自行指定）
     data  —— { n, unlocked, casting }（见 buildEmblemData，纯数据、零依赖）
   ------------------------------------------------------------ */
export function drawEmblem(ctx, x, y, size, data) {
  const d = data || {};
  const n = Number.isFinite(d.n) ? d.n : 0;
  const unlocked = Array.isArray(d.unlocked) ? d.unlocked : [];
  const casting = d.casting || null;

  const cx = x + size / 2;
  const cy = y + size / 2;
  const k = size / BASE;                 // 归一化系数：任何 size 同形
  const rOuter = 88 * k;                 // 刻度环外缘
  const rSegOut = 88 * k;
  const rSegIn = 76 * k;
  const rTickOut = 66 * k;
  const rTickIn = 61 * k;
  const rContour = 46 * k;               // 轮廓半径（环内）

  ctx.save();
  ctx.lineCap = 'butt';

  /* ---------- 12 格刻度环（段间留 2° 缝） ---------- */
  const segSpan = 360 / SEG_COUNT;       // 30°
  const arcSpan = (segSpan - SEG_GAP_DEG) * Math.PI / 180;
  for (let i = 0; i < SEG_COUNT; i++) {
    const start = (i * segSpan) * Math.PI / 180 - Math.PI / 2;
    const lit = i < n;                   // 前 n 段点亮（i 从 0 起，与 sandbox 序号同序）
    ctx.beginPath();
    ctx.arc(cx, cy, (rSegOut + rSegIn) / 2, start, start + arcSpan);
    ctx.lineWidth = rSegOut - rSegIn;
    ctx.strokeStyle = lit ? EMBLEM_COLORS.iron : EMBLEM_COLORS.line;
    ctx.stroke();
  }

  /* ---------- 底环：36 根等距刻度（--c-line 40%） ---------- */
  ctx.save();
  ctx.globalAlpha = 0.40;
  ctx.strokeStyle = EMBLEM_COLORS.line;
  for (let i = 0; i < TICK_COUNT; i++) {
    const [ax, ay] = polar(cx, cy, rTickIn, i * (360 / TICK_COUNT));
    const [bx, by] = polar(cx, cy, rTickOut, i * (360 / TICK_COUNT));
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineWidth = (i % 3 === 0 ? 1.8 : 1.0) * k;
    ctx.stroke();
  }
  ctx.restore();

  /* ---------- 环内：铸件轮廓 / 空态炉口 ---------- */
  ctx.globalAlpha = 0.40;
  if (casting && CONTOURS[casting]) {
    const col = EMBLEM_COLORS.text;
    CONTOURS[casting].lines.forEach(([pts, lw, solid]) => {
      strokePoly(ctx, pts, rContour, cx, cy, lw * k * 1.5, col, solid === 0);
    });
    ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = 1;
    drawColdFurnace(ctx, cx, cy, rContour, EMBLEM_COLORS.steel);
  }
  ctx.globalAlpha = 1;

  /* ---------- 空态中央一行 11px「尚未点火」 ---------- */
  if (!casting) {
    ctx.save();
    ctx.font = `400 ${Math.round(11 * k)}px ${FONT_CN}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = EMBLEM_COLORS.steel;
    ctx.fillText('尚未点火', cx, cy + 34 * k);
    ctx.restore();
  }

  ctx.restore();
}

/* ------------------------------------------------------------
   buildEmblemData() —— 把页面/海报共用的三份原始输入收成同一结构。
   纯度：只做映射，不读 DOM / 存储 / 时间 / 随机 —— 可被 node 单测。
     unlocked : 数字数组（真实来源 im.cast.unlocked）
     castings : { sandbox_N: 'flange'|'bed'|'valve'|'gear' }，可选
   ------------------------------------------------------------ */
export function buildEmblemData(unlocked, castingMap) {
  const arr = Array.isArray(unlocked) ? unlocked.filter((v) => Number.isInteger(v)) : [];
  const n = arr.length;
  let casting = null;
  if (n > 0) {
    const minIdx = Math.min(...arr);      // §3.3：取序号最小的砂箱 = "你最早浇出的那件"
    casting = (castingMap && castingMap[`sandbox_${minIdx}`]) || null;
  }
  return { n, unlocked: arr.slice().sort((a, b) => a - b), casting };
}

/** 供验收脚本读的常量（V2 要断言 12 段 / 36 根 / 4 种轮廓） */
export const EMBLEM_SPEC = {
  segments: SEG_COUNT,
  ticks: TICK_COUNT,
  contours: Object.keys(CONTOURS),
  segGapDeg: SEG_GAP_DEG,
};
