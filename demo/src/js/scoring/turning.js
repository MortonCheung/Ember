/* ============================================================
   scoring/turning.js — 协作车削评分引擎（纯函数）
  依据：spec/TURN-SPEC.md §4（§4.1 子项 / §4.2 协作分 / §4.3 等级 / §4.4 引擎纪律）
           archive/spec/PROMPT-TURN.md（交接提示词的「评分引擎」段）
           spec/PROMPT-UX-REVISION-P2.md（R1 第 8 条：删协作榜、用时退出评分）
   ⚠️ 已被 R1-P2 作废：§3.7 协作榜（榜单排序与入榜判定）、§4.1 的「用时 20%」子项、
      §3.2 的 mm:ss 格式化。三样都已从本文件移除，残留标识符为零。
   纪律：无 DOM、无存储、无随机、无时间依赖；
        clamp 与 Number.isFinite 统一在入口做；
        内部浮点保留 2 位（r2），仅显示时取整（总分与子项各自独立取整，不做凑数修正）；
        取整只在总分最后一步（§4.1）。
   ============================================================ */

import {
  N_RANGE, F_RANGE, FALLBACK, WINDOW, RULES, WEIGHTS, COLLAB,
  TIMING, DURATION_MS,
} from './turning-data.js';
import { GRADES } from './casting-data.js';

const r2 = (x) => Math.round(x * 100) / 100;

/* ---------- §4.3 等级：沿用 §6.1 那张表（与浇铸共用，**不另立一套**） ----------
   与 scoring/casting.js 的 gradeOf 逐位同源；重复声明是为了让等价性可被 selfTest 断言
   （两侧各自跑同一组边界值，任何一边漂移都会立刻变红）。 */
export function gradeOf(total) {
  const t = Math.round(total);
  return GRADES.find((g) => t >= g.min).rank;
}

/** 显示用独立取整（同 casting.js 的 display；E15：显示取整不"凑数"） */
export const display = {
  score: (v) => Math.round(v),
  sub: (v) => Math.round(v),
};

/** 入口 clamp（§4.4：非法 → 回落；有限越界 → 钳到量程端点） */
function sane(v, range, fallback) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(range.max, Math.max(range.min, v));
}

/**
 * 累计时间差（秒）：相邻两次参数调整的时间间隔之和（§4.2）。
 * 读法：两人协调得好 ⇒ 调整几乎同时 ⇒ 时间差小；一人来回犹豫 ⇒ 时间差大。
 * @param {number[]} [adjustments] 各次调整的时间戳（毫秒，相对计时起点）
 */
function gapTotal(adjustments) {
  if (!Array.isArray(adjustments) || adjustments.length < 2) return 0;
  const ts = adjustments.filter((v) => typeof v === 'number' && Number.isFinite(v))
    .map((v) => Math.max(0, v))
    .sort((a, b) => a - b);
  let sum = 0;
  for (let i = 1; i < ts.length; i++) sum += ts[i] - ts[i - 1];
  return sum / 1000;
}

/**
 * 评分主入口（纯函数，§4.4）
 * @param {{n:number, f:number, t:number, adjustments?:number[]}} p
 *        n 主轴转速 r/min · f 进刀量 mm/r ·
 *        t 机械时长（秒）—— **不参与评分**（R1-P2：用时退出评分），
 *          仅用于判定强制结算标记与非法值回落 · adjustments 调整时间戳数组（ms）
 * @returns {{total:number, subs:{surface:number,size:number},
 *            collab:number, rank:string, ...}}
 */
export function score(p) {
  const n = sane(p?.n, N_RANGE, FALLBACK.n);
  const f = sane(p?.f, F_RANGE, FALLBACK.f);
  // t（机械时长）：0 或负 → 视为非法，回落 600（走强制结算分支，不得产生 Infinity 分）
  // 上限钳到强制结算值 —— 页面在 t > 600 时强制结算，引擎侧不产生界外态
  const tRaw = p?.t;
  const t = (typeof tRaw !== 'number' || !Number.isFinite(tRaw) || tRaw <= 0)
    ? FALLBACK.t
    : Math.min(TIMING.forceSettle, tRaw);

  /* ---------- 表面质量 / 尺寸精度（§4.1，逐条照 §8.2 原文） ---------- */
  const value = { n, f, m: r2(n * f) };
  const fired = [];
  for (const rule of RULES) {
    const v = value[rule.param];
    const off = rule.side === 'below' ? rule.at - v : v - rule.at;
    if (off > 0) {
      fired.push({ ...rule, threshold: rule.at, off: r2(off), ded: r2(Math.min(rule.cap, off * rule.coef)) });
    }
  }
  const dedBy = { surface: 0, size: 0 };
  for (const x of fired) dedBy[x.sub] = r2(dedBy[x.sub] + x.ded);

  const subs = {
    surface: r2(Math.max(0, 100 - dedBy.surface)),
    size: r2(Math.max(0, 100 - dedBy.size)),
  };

  // 总分：两维权重 56.25 / 43.75（R1-P2：原 45 / 35 / 20 去掉用时并按比例归一化），
  // 取整只在最后一步
  const total = Math.max(0,
    WEIGHTS.surface * subs.surface + WEIGHTS.size * subs.size);

  /* ---------- 协作分（§4.2，0–100，不计入质量分） ----------
     匹配偏差惩罚 = min(40, |f−0.30|/0.10×20) + min(40, |n−660|/100×20)
     —— 上限 40 **逐维各一次**。依据是 §8 U3 算例①④ 的逐步骤算式：
        「|0.52−0.30|/0.10×20 = 44 → min(40,44) = 40，|420−660|/100×20 = 48 → 40，合计 80 → 协作分 20」。
        （§4.2 的公式行把 min(40, …) 写成了包住两项之和；该写法会得 60，与§8 算例表、
         与 PROMPT-TURN 的算例表**两处独立给出**的 20 都不符 → 以算例为准。详见 IMPLEMENTATION-TURN.md） */
  const fDev = Math.abs(f - WINDOW.fMid) / WINDOW.fHalf;
  const nDev = Math.abs(n - WINDOW.nMid) / WINDOW.nHalf;
  const matchPen = Math.min(COLLAB.matchCap, fDev * COLLAB.matchCoef)
    + Math.min(COLLAB.matchCap, nDev * COLLAB.matchCoef);
  const gap = gapTotal(p?.adjustments);
  const gapPen = Math.min(COLLAB.gapCap, gap * COLLAB.gapCoef);
  const collab = Math.min(100, Math.max(0, 100 - gapPen - matchPen));

  /* R1-P2：入榜门槛随协作榜删除 —— 质量分照常显示，不再有"入不入榜"这个概念。 */
  const totalShown = display.score(total);
  const forcedSettle = (typeof tRaw === 'number' && Number.isFinite(tRaw) && tRaw > TIMING.forceSettle);

  return {
    params: { n, f, m: value.m, t },
    subs,
    total,
    totalShown,
    collab: display.score(collab),
    collabRaw: r2(collab),
    fired,
    mainRule: fired.length
      ? [...fired].sort((a, b) => b.ded - a.ded || a.id.localeCompare(b.id))[0].id
      : null,
    rank: gradeOf(total),
    forcedSettle,
    gapPenalty: r2(gapPen),
    matchPenalty: r2(matchPen),
    accumulatedGap: r2(gap),
  };
}

/* ============================================================
   selfTest — §8 U3 四组算例 + 边界 + 协作分 + 等级
   纯函数：返回 [{name, pass, expect, got}]，浏览器与 Node 均可运行
   判定用「逐位一致」（JSON 严格相等），不接受容差
   ============================================================ */
export function selfTest() {
  const out = [];
  const check = (name, expect, got) => {
    out.push({ name, pass: JSON.stringify(expect) === JSON.stringify(got), expect, got });
  };

  /* ---------- U3 四组算例（§8 U3 表，必须逐位一致） ---------- */
  const c1 = score({ n: 420, f: 0.52, t: 3.6 });
  check('U3① 表面质量', 45.6, c1.subs.surface);
  check('U3① 尺寸精度', 100, c1.subs.size);
  // R1-P2：用时退出评分，总分由 0.45/0.35/0.20 归一化为 0.5625/0.4375
  //   → 76 → 69（0.5625 × 45.6 + 0.4375 × 100 = 69.4）
  check('U3① 总分（R1-P2 两维权重）', 69, c1.totalShown);
  check('U3① 协作分', 20, c1.collab);

  const c2 = score({ n: 660, f: 0.30, t: 50 });
  check('U3② 两项', [100, 100], [c2.subs.surface, c2.subs.size]);
  check('U3② 总分', 100, c2.totalShown);
  check('U3② 协作分', 100, c2.collab);

  // R1-P2：U3③ 与 U3② 现在**输入等价**（只差 t，而 t 已不参与评分）⇒ 总分同为 100。
  //   保留两条是刻意的：它们共同把"用时不再影响成绩"这一事实固定住，不是重复断言。
  const c3 = score({ n: 660, f: 0.30, t: 90 });
  check('U3③ 总分（与 U3② 同分 —— 用时不再参与评分）', 100, c3.totalShown);
  check('U3③ 协作分', 100, c3.collab);

  const c4 = score({ n: 1200, f: 0.80, t: 600 });
  check('U3④ 表面质量（走磨损颤振分支 0.30/30，不取积屑瘤 0.35/40）', 25, c4.subs.surface);
  check('U3④ 尺寸精度', 65, c4.subs.size);
  // R1-P2：36 → 43（0.5625 × 25 + 0.4375 × 65 = 42.5 → 显示取整 43）
  check('U3④ 总分（R1-P2 两维权重）', 43, c4.totalShown);
  check('U3④ 协作分', 20, c4.collab);
  check('U3④ 强制结算标记（t > 600 才置位）', false, c4.forcedSettle);
  check('U3④ 强制结算标记（t=600 恰好 = 上限，未越界，故不置位）', false, c4.forcedSettle);
  check('U3④ t=900 > 600 → 置位强制结算', true,
    score({ n: 1200, f: 0.80, t: 900 }).forcedSettle);
  // R1-P2：「用时口径」不再存在；t > 600 仍钳到 600，但只影响 forcedSettle 与 params.t
  //   （§10 E14 展厅设备保护），与成绩无关。
  check('U3④ t=900 时 t 仍钳到 600（设备保护口径不变，且不产生界外态）', 600,
    score({ n: 1200, f: 0.80, t: 900 }).params.t);
  // ⚠️ 历史留痕（原「入榜」断言已随 §3.7 协作榜删除）：§8 U3 表 ④ 的「入榜」格写
  //   「是（强制结算）」，而 §3.2/§3.7/U6 的门槛是「质量分 ≥ 60 且 t ≥ 10 s」，§6 又规定
  //   低于门槛不写 im.turn.best。R1-P2 把"入榜"整个概念删掉（UI 与引擎都不再有），
  //   该分歧随之消失 —— 故此处不再保留断言。详见 IMPLEMENTATION-TURN.md 与
  //   IMPLEMENTATION-UX-REVISION-P2.md 的「旧期望 → 新期望」表。

  /* ---------- §4.1 边界：n 两侧分支互斥、f/m 端点不扣分 ---------- */
  check('边界 n=560 表面 100', 100, score({ n: 560, f: 0.30, t: 50 }).subs.surface);
  check('边界 n=760 表面 100', 100, score({ n: 760, f: 0.30, t: 50 }).subs.surface);
  check('边界 n=550 积屑瘤扣 3.5', 96.5, score({ n: 550, f: 0.30, t: 50 }).subs.surface);
  check('边界 n=770 颤振扣 3', 97, score({ n: 770, f: 0.30, t: 50 }).subs.surface);
  check('边界 f=0.40 无刀痕扣分', 100, score({ n: 660, f: 0.40, t: 50 }).subs.surface);
  check('边界 m=112 不扣', 100, score({ n: 560, f: 0.20, t: 50 }).subs.size);
  check('边界 m=304 不扣', 100, score({ n: 760, f: 0.40, t: 50 }).subs.size);
  check('边界 m=100 让刀不足扣 2.4', 97.6, score({ n: 500, f: 0.20, t: 50 }).subs.size);
  check('表面扣分上限 40（积屑瘤）', 60, score({ n: 200, f: 0.40, t: 50 }).subs.surface);
  check('表面扣分上限 30（颤振）', 70, score({ n: 1200, f: 0.40, t: 50 }).subs.surface);
  check('表面扣分上限 45（刀痕）', 55, score({ n: 660, f: 0.80, t: 50 }).subs.surface);
  check('尺寸扣分上限 35', 65, score({ n: 1200, f: 0.80, t: 50 }).subs.size);
  // ⚠️ 自检记录：尺寸「让刀不足」分支写的是 min(25, (112−m)×0.20)，
  //    但 m ≥ 0 ⇒ 最大扣分 = 112×0.20 = 22.4 < 25 ⇒ **上限 25 不可达**（死上限，照抄原文保留）。
  //    改用真实极值断言，不写一条永远触发不到的"上限"判据。
  check('尺寸扣分极值（m=20 → 扣 18.4，上限 25 不可达）', 81.6,
    score({ n: 200, f: 0.10, t: 50 }).subs.size);

  /* ---------- R1-P2 新增：两维总分黄金值（P2 §1 8b「黄金值必须重算」表） ----------
     原表只到子项，本轮两维权重变了 ⇒ 补两条总分断言，把黄金值固定住。 */
  check('P2 边界 n=550 总分 98（0.5625×96.5 + 0.4375×100 = 98.03）', 98,
    score({ n: 550, f: 0.30, t: 50 }).totalShown);
  check('P2 边界 n=200,f=0.40 总分 75（m=80 < 112 ⇒ z2 扣 6.4 ⇒ size 93.6，不是 100）', 75,
    score({ n: 200, f: 0.40, t: 50 }).totalShown);

  /* ---------- §4.4 非法值回落 = §3.4 初值（不是浇铸的 1420/15/3.5） ---------- */
  const bad = score({ n: NaN, f: Infinity, t: 0 });
  check('E3 NaN → n=420', 420, bad.params.n);
  check('E3 Infinity → f=0.52', 0.52, bad.params.f);
  check('E3 t=0 → 回落 600', 600, bad.params.t);
  check('E3 t=0 不得产生 Infinity 分', true, Number.isFinite(bad.total));
  const bad2 = score({ n: 'abc', f: undefined, t: -5 });
  check('E3 非数字类型 → 初值', { n: 420, f: 0.52, t: 600 },
    { n: bad2.params.n, f: bad2.params.f, t: bad2.params.t });
  const bad3 = score({ n: 99999, f: -9, t: 12 });
  check('E3 有限越界 → 钳到量程端点', { n: 1200, f: 0.10 }, { n: bad3.params.n, f: bad3.params.f });

  /* ---------- §4.2 协作分：上下限、时间差惩罚、单人照常计 ---------- */
  check('协作分 上限 100', 100, score({ n: 660, f: 0.30, t: 50 }).collab);
  // 下限 0：匹配偏差封顶 80（两维各 40）+ 时间差封顶 30 ⇒ 100 − 110 < 0，钳到 0
  const floor = score({ n: 1200, f: 0.80, t: 50, adjustments: [0, 20000] });
  check('协作分 下限 0（不出现负值）', 0, floor.collab);
  check('下限案例：匹配偏差 80 + 时间差 30 = 110 → 钳到 0',
    { match: 80, gap: 30, collab: 0 }, { match: floor.matchPenalty, gap: floor.gapPenalty, collab: floor.collab });
  check('仅匹配偏差极大（无时间差）时为 20，不是 0', 20, score({ n: 1200, f: 0.80, t: 50 }).collab);
  const gp = score({ n: 660, f: 0.30, t: 50, adjustments: [0, 15000, 30000] });
  check('时间差惩罚 min(30, 累计30s×2)=30', 30, gp.gapPenalty);
  check('时间差惩罚后协作分 = 70', 70, gp.collab);
  check('时间差惩罚上限 30（累计 40s 也只扣 30）', 30,
    score({ n: 660, f: 0.30, t: 50, adjustments: [0, 20000, 40000] }).gapPenalty);
  check('未调整参数（无 adjustments）→ 时间差 0', 0, score({ n: 660, f: 0.30, t: 50 }).gapPenalty);
  check('单人操作照常计协作分（不做人数判定，无 adjustments 字段也能算）',
    20, score({ n: 420, f: 0.52, t: 3.6, adjustments: [] }).collab);
  check('调整时间戳含 NaN/负数不污染', 0,
    score({ n: 660, f: 0.30, t: 50, adjustments: [NaN, -5, Infinity] }).gapPenalty);

  /* R1-P2：原「§4.1 用时口径」4 条断言随用时子项一起删除
     —— 用时已不是评分项，这四条断言的对象不存在了。 */

  /* ---------- §4.3 等级（沿用 §6.1，与浇铸同一张表） ---------- */
  const grades = [[96, '特级技师'], [92, '铸造工 · 一级'], [91, '铸造工 · 二级'],
    [85, '铸造工 · 二级'], [75, '铸造工 · 三级'], [60, '铸造工 · 学徒'], [59, '待复检'], [0, '待复检']];
  for (const [v, want] of grades) check(`等级 ${v} → ${want}`, want, gradeOf(v));
  // R1-P2：总分整体下移 ⇒ 算例①（「不动手直接点开始」那一局）76 → 69，
  //   等级从「铸造工 · 三级」掉到「铸造工 · 学徒」（GRADES 门槛：学徒 ≥60、三级 ≥75）。
  //   ⚠️ 这是"用时退出评分"的必然后果，**如实固定**；不许改 GRADES 门槛去把分数凑回来。
  check('算例① 69 → 铸造工 · 学徒（用时退出评分后掉级，如实固定）', '铸造工 · 学徒', c1.rank);
  check('算例② 100 → 特级技师', '特级技师', c2.rank);
  check('算例③ 100 → 特级技师（原 91 → 二级）', '特级技师', c3.rank);
  check('算例④ 43 → 待复检（仍 < 60，结论不变，只改数字）', '待复检', c4.rank);

  /* ---------- E15：显示取整独立（子项 45.6 → 46，总分 69.4 → 69） ---------- */
  check('E15 显示值独立取整（不凑数）', { sub: 46, total: 69 },
    { sub: display.sub(c1.subs.surface), total: display.score(c1.total) });

  /* ---------- R1-P2：以下两段随功能删除，故断言一并删除 ----------
     · §3.7 协作榜三组（榜①②③④）—— 榜单排序函数与基准名单已不存在
     · §3.2 计时格式化 4 条 —— mm:ss 格式化函数已不存在
     留着会直接 ReferenceError；删除是"功能没了 ⇒ 判据也没了"的必然。 */

  check('动画固定 3600ms（与 n、f 无关）', 3600, DURATION_MS);

  return out;
}
