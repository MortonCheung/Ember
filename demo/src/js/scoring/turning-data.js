/* ============================================================
   scoring/turning-data.js — 协作车削 · 纯数据表
   依据：spec/TURN-SPEC.md §3.2 / §3.3 / §3.4 / §4（本项唯一依据）
           spec/PROMPT-UX-REVISION-P2.md（R1 第 8 条：删协作榜与「本局用时」）
        ⚠️ §3.7（协作榜）与 §4.1 的「用时 20%」已被 R1-P2 作废，本文件不再承载。
        archive/spec/PROMPT-TURN.md（交接提示词）
   规则：本文件只放数据，不含任何计算（同 casting-data.js 的纪律）
   ============================================================ */

/* ---------- §3.4 滑杆量程与初值 ----------
   ⚠️ 初值**不是**画稿 S04 上的 620 / 0.32 ——
     画稿那一帧两个值都落在理想窗口内 ⇒ 玩家一个滑杆都不动就是满分参数（100 分）⇒ 设计缺陷。
     裁定：两个初值各踩一个参数的一个方向（转速偏低 / 进刀量偏高），让玩家一眼看出"两边都要调"。
     「不动手」落点 = 69 分（R1-P2：用时退出评分后由 76 下移），与浇铸「不动手 72 分」同量级。
   ⚠️ 620 是 C620-1 机床型号的呼应彩蛋，只属于"进行中"那一帧，不要从画稿上抹掉。 */
export const N_RANGE = { min: 200, max: 1200, step: 10 };
export const F_RANGE = { min: 0.10, max: 0.80, step: 0.02 };
export const INIT = { n: 420, f: 0.52 };

/** §4.4 非法值回落 = §3.4 初值（**不是** §10 E3 的浇铸回落值 1420/15/3.5） */
export const FALLBACK = { n: 420, f: 0.52, t: 600 };

/* ---------- §4.1 / §4.2 理想窗口 ----------
   表面质量：n ∈ [560,760] 为无扣分带；f ≤ 0.40 不扣刀痕
   尺寸精度：m = n × f ∈ [112,304] 为无扣分带
   协作分  ：f 中值 0.30 / 半带宽 0.10（即 [0.20,0.40]）；n 中值 660 / 半带宽 100（即 [560,760]） */
export const WINDOW = {
  nMin: 560, nMax: 760, nMid: 660, nHalf: 100,
  fMax: 0.40, fMid: 0.30, fHalf: 0.10,
  mMin: 112, mMax: 304,
};

/** §4.1 扣分规则（表面质量 / 尺寸精度）—— 系数与上限逐条照 §8.2 原文 */
export const RULES = [
  // 表面质量：n < 560 → 积屑瘤（0.35 / 上限 40）
  { id: 's1', sub: 'surface', param: 'n', side: 'below', at: WINDOW.nMin, coef: 0.35, cap: 40 },
  // 表面质量：n > 760 → 刀具磨损与颤振（0.30 / 上限 30）
  //   ⚠️ s1 与 s2 互斥（窗口连续），同一条规则不会同时命中（§4.1 注）
  { id: 's2', sub: 'surface', param: 'n', side: 'above', at: WINDOW.nMax, coef: 0.30, cap: 30 },
  // 表面质量：f > 0.40 → 刀痕粗（120 / 上限 45）
  { id: 's3', sub: 'surface', param: 'f', side: 'above', at: WINDOW.fMax, coef: 120, cap: 45 },
  // 尺寸精度：m > 304 → 让刀、尺寸超差（0.35 / 上限 35）
  { id: 'z1', sub: 'size', param: 'm', side: 'above', at: WINDOW.mMax, coef: 0.35, cap: 35 },
  // 尺寸精度：m < 112 → 让刀不足（0.20 / 上限 25）
  { id: 'z2', sub: 'size', param: 'm', side: 'below', at: WINDOW.mMin, coef: 0.20, cap: 25 },
];

/** §4.1 子项权重（R1-P2：用时退出评分，原 45 : 35 : 20 归一化为两维）
 *  ⚠️ 只把 surface : size **按原比例归一化到 100**，不许"顺手"重配成 50/50 或 60/40。 */
export const WEIGHTS = { surface: 0.5625, size: 0.4375 };

/** 子项中文名（UI 用；对外一律「进刀量」，不写「进给量」—— §3.5） */
export const SUB_LABELS = { surface: '表面质量', size: '尺寸精度' };

/** §4.2 协作分参数：惩罚上限 30 / 40，系数 2 s⁻¹，匹配偏差各 20 */
export const COLLAB = {
  gapCap: 30, gapCoef: 2,
  matchCap: 40, matchCoef: 20,
};

/* ---------- §3.3 车削动画：固定 3600 ms，与 n、f 无关 ----------
  ⚠️ 必须固定时长以保证**回放可复现**（§3.8）。
  用时终点 = 动画播放完毕（§3.2），故「不动手直接点按钮」的 t = 动画时长。
  R1-P2：t 不再参与评分，仅用于强制结算标记与非法值回落。 */
export const SEG = { A: 500, B: 3200, C: 3600 };
export const DURATION_MS = SEG.C;

/** §3.3 参数 → 视觉映射 */
export const VIS = {
  omegaDiv: 400,        // ω = n / 400 rad/s（0.50 … 3.00）—— 必须降速显示
  drMid: 0.30,          // ΔR = (0.30 − f) × 0.02 m
  drCoef: 0.02,
  ringAt: 0.40,         // f > 0.40 出现刀痕暗环
  ringCoef: 25, ringMax: 8, ringMin: 1,
  blankR: 0.085,        // 毛坯等径大圆柱半径
  nominalR0: 0.075,     // 标称半径 R_i = 0.075 − i × 0.010（i = 0…5，6 级）
  nominalStep: 0.010,
  steps: 6,
  zStart: -0.18,        // 刀架轴向 z = −0.18 + progress × 0.36（easeInOutCubic）
  zSpan: 0.36,
};

/* ---------- §3.2 采样与强制结算（R1-P2：入榜门槛随协作榜一并删除） ---------- */
export const TIMING = {
  forceSettle: 600,     // t > 600 s 强制结算（§10 E14，展厅设备保护）
  sampleMs: 100,        // §3.8 录制采样间隔
};

/** 徽标文案（§3.1 裁定：画稿「已连接 2/2」暗示联网握手 → 诚实降级为同屏） */
export const MODE_BADGE = '双人协作模式 · 同屏操作';

/** §6 存储键（R1-P2：原「组内最佳」存储键已随协作榜一并删除 —— 老 localStorage 里的
 *  `im.turn.best` 残留**无需清理**，无消费者即无害，也不要在代码里读它。） */
export const K_BADGE = 'im.badge';

/** 阶段文案（录制提示，画稿原文） */
export const REC_HINT = '正在录制 · 可回放出品过程';
