/* ============================================================
   features/casting/scoring.js — 亲手浇铸评分引擎（纯函数）
   依据：spec/STEP3-INTERACTION-SCORING-SPEC.md §4 / §5
   纪律：无 DOM、无存储、无随机、无时间依赖（§12.1）
        clamp 与 Number.isFinite 统一在入口做（§12.3）
        内部浮点保留 2 位，仅显示时取整（§4.2 纪律 3）
   ============================================================ */

import {
  CASTINGS, RULES, WEIGHTS, H_MIN, H_MAX, T_RANGE, V_RANGE, H_RANGE,
  FALLBACK, SANDBOXES, SUB_LABELS, PARAM_LABELS, PARAM_UNITS, GRADES,
  UNLOCK_SCORE,
} from './data.js';

const r2 = (x) => Math.round(x * 100) / 100;

/** 引擎入口统一 clamp（E3：NaN/Infinity/越界 → 回落） */
function sane(v, range, fallback) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return r2(Math.min(range.max, Math.max(range.min, v)));
}

/** 阈值解析：'tMin' 等取铸件窗口端点，数字为全场固定阈值 */
function threshold(rule, casting) {
  if (typeof rule.at === 'number') return rule.at;
  return casting[rule.at];
}

/**
 * 评分主入口（纯函数）
 * @param {{T:number, V:number, H:number}} p 工艺参数
 * @param {string} castingKey 铸件类型（CASTINGS 的 key）
 * @returns {object} 引擎结果（内部浮点，显示时才取整）
 */
export function score(p, castingKey = 'valve') {
  const casting = CASTINGS[castingKey] || CASTINGS.valve;
  const T = sane(p?.T, T_RANGE, FALLBACK.T);
  const V = sane(p?.V, V_RANGE, FALLBACK.V);
  const H = sane(p?.H, H_RANGE, FALLBACK.H);
  const value = { T, V, H };

  // ---- 逐条规则计扣分 ----
  const firedAll = [];
  for (const rule of RULES) {
    const th = threshold(rule, casting);
    const v = value[rule.param];
    const off = rule.side === 'below' ? th - v : v - th;
    if (off > 0) {
      firedAll.push({
        ...rule, threshold: th, off: r2(off), ded: r2(Math.min(rule.cap, off * rule.coef)),
      });
    }
  }

  // ---- 纪律 1：同一子项内同一参数只取扣分最大的一条 ----
  const byKey = new Map();
  for (const f of firedAll) {
    const k = f.sub + ':' + f.param;
    const cur = byKey.get(k);
    if (!cur || f.ded > cur.ded) byKey.set(k, f);
  }
  const fired = [...byKey.values()];

  // ---- 子项与总分（内部浮点；每子项最低 0） ----
  const dedBy = { form: 0, gas: 0, yield: 0 };
  for (const f of fired) dedBy[f.sub] = r2(dedBy[f.sub] + f.ded);
  const subs = {
    form: r2(Math.max(0, 100 - dedBy.form)),
    gas: r2(Math.max(0, 100 - dedBy.gas)),
    yield: r2(Math.max(0, 100 - dedBy.yield)),
  };
  const total = r2(Math.max(0,
    WEIGHTS.form * subs.form + WEIGHTS.gas * subs.gas + WEIGHTS.yield * subs.yield));

  // ---- 温度徽标与视口注解（§2 ②） ----
  const mid = (casting.tMin + casting.tMax) / 2;
  const badge = T < casting.tMin ? '偏低 · 需升温'
    : T > casting.tMax ? '偏高 · 需降温' : '适宜';
  const annotation = Math.abs(T - mid) >= 20 ? '温差过大，铸件将产生缩孔' : null;
  const hHint = H < H_MIN ? '砂型过干，强度不足' : null;

  // ---- 主因缺陷（扣分最大者；并列按 造型 → 气孔 → 利用率 取前者） ----
  const SUB_ORDER = { form: 0, gas: 1, yield: 2 };
  const main = fired.length
    ? [...fired].sort((a, b) =>
        (b.ded - a.ded) || (SUB_ORDER[a.sub] - SUB_ORDER[b.sub]))[0]
    : null;

  // ---- 预估值 N：主因参数修正到阈值端点后重算，向上取整到 5 的倍数 ----
  let estimate = null;
  if (main) {
    const fixed = { T, V, H, [main.param]: main.threshold };
    estimate = Math.ceil(recomputeTotal(fixed, castingKey) / 5) * 5;
  }

  // ---- 诊断文案（§4.3 模板） ----
  const dirWord = main ? (main.side === 'above' ? '偏高' : '偏低') : null;
  const fmt = (param, v) => param === 'T'
    ? `${String(Math.round(v))}℃`
    : `${v.toFixed(1)}${PARAM_UNITS[param]}`;
  let diagnosis;
  if (!main) {
    diagnosis = '工艺参数全部落在区间内。此件可作为一级品入库。';
  } else {
    const thUnit = main.param === 'T' ? '℃' : PARAM_UNITS[main.param];
    const thText = main.param === 'T'
      ? `${Math.round(main.threshold)}℃` : `${main.threshold.toFixed(1)}${thUnit}`;
    const bound = main.side === 'above' ? '上限' : '下限';
    diagnosis =
      `${main.defect}${dirWord}：${PARAM_LABELS[main.param]} ${fmt(main.param, value[main.param])} ` +
      `${main.side === 'above' ? '超过' : '低于'} ${thText} ${bound}，${main.mech}。` +
      `调整后重试可提升至 ${estimate} 分以上。`;
  }
  const scrapPrefix = total < 60 ? '本件判为废品，需回炉重铸。' : '';

  // ---- 全落区间：E2 特别徽标 ----
  const allInWindow = fired.length === 0;
  const badgeFinal = allInWindow ? '炉火纯青' : badge;

  return {
    casting,
    params: { T, V, H },
    subs,
    total,
    fired,                       // 生效扣分（已按纪律 1 收敛）
    mainDefect: main ? main.defect : null,
    mainDeduction: main ? main.ded : 0,
    diagnosis: scrapPrefix ? scrapPrefix + diagnosis : diagnosis,
    estimate,
    badge: badgeFinal,
    annotation,
    hHint,
    suggestedV: [casting.vMin, casting.vMax],
    allInWindow,
    isScrap: total < 60,
    scrapPrefix,
    grade: gradeOf(total),
    unlockEligible: total >= UNLOCK_SCORE,
  };
}

/** 不经过入口 clamp 的内部重算（预估值 N 用，参数已被引擎产出，必然合法） */
function recomputeTotal(p, castingKey) {
  const casting = CASTINGS[castingKey] || CASTINGS.valve;
  const value = { T: p.T, V: p.V, H: p.H };
  const dedBy = { form: 0, gas: 0, yield: 0 };
  const seen = new Map();
  for (const rule of RULES) {
    const th = threshold(rule, casting);
    const v = value[rule.param];
    const off = rule.side === 'below' ? th - v : v - th;
    if (off > 0) {
      const ded = r2(Math.min(rule.cap, off * rule.coef));
      const k = rule.sub + ':' + rule.param;
      const cur = seen.get(k);
      if (!cur || ded > cur) seen.set(k, ded);
    }
  }
  for (const [k, ded] of seen) {
    const sub = k.split(':')[0];
    dedBy[sub] = r2(dedBy[sub] + ded);
  }
  const subs = {
    form: r2(Math.max(0, 100 - dedBy.form)),
    gas: r2(Math.max(0, 100 - dedBy.gas)),
    yield: r2(Math.max(0, 100 - dedBy.yield)),
  };
  return r2(WEIGHTS.form * subs.form + WEIGHTS.gas * subs.gas + WEIGHTS.yield * subs.yield);
}

/** §6.1 等级映射（用显示取整后的总分映射） */
export function gradeOf(total) {
  const t = Math.round(total);
  return GRADES.find((g) => t >= g.min).rank;
}

/** 砂箱静态数据查询 */
export function sandboxOf(name) {
  const s = SANDBOXES.find((x) => x.name === name);
  return s ? { ...s, castingInfo: CASTINGS[s.casting] } : null;
}

/** 显示用取整（§4.2 纪律 3 / E15：总分与子项各自独立取整，不做凑数修正） */
export const display = {
  score: (v) => Math.round(v),
  sub: (v) => Math.round(v),
};

/* ============================================================
   selfTest — §5 对账 + T4 规则遍历 + 关键边界（T1/T4/T5/T6 的可复现记录）
   纯函数：返回 [{name, pass, expect, got}]，浏览器与 Node 均可运行
   ============================================================ */
export function selfTest() {
  const out = [];
  const check = (name, expect, got) => {
    const ok = JSON.stringify(expect) === JSON.stringify(got);
    out.push({ name, pass: ok, expect, got });
  };

  // ---- T1：§5 对账（sandbox_8 阀体，T=1380 / V=15 / H=6.2） ----
  const r = score({ T: 1380, V: 15, H: 6.2 }, 'valve');
  check('§5 造型完整度', 88, display.sub(r.subs.form));
  check('§5 气孔控制（内部值）', 53.8, r.subs.gas);
  check('§5 气孔控制（显示）', 54, display.sub(r.subs.gas));
  check('§5 铁水利用率', 76, display.sub(r.subs.yield));
  check('§5 总分（内部值）', 71.92, r.total);
  check('§5 总分（显示）', 72, display.score(r.total));
  check('§5 温度徽标', '偏低 · 需升温', r.badge);
  check('§5 视口注解', '温差过大，铸件将产生缩孔', r.annotation);
  check('§5 建议速度', [12, 18], r.suggestedV);
  check('§5 主因缺陷', '气孔', r.mainDefect);
  check('§5 预估值（上取整到 5）', 90, r.estimate);
  check('§5 等级（71.92→72）', '铸造工 · 学徒', gradeOf(r.total));

  // ---- T4：12 条规则逐条可触发（每条构造一个必然触发的输入） ----
  const fire = (params, castingKey) =>
    score(params, castingKey).fired.map((f) => f.id);
  const cover = [
    ['r01', fire({ T: 1380, V: 15, H: 4.0 }, 'valve')],
    ['r02', fire({ T: 1445, V: 15, H: 4.0 }, 'valve')],
    ['r03', fire({ T: 1410, V: 10, H: 4.0 }, 'valve')],
    ['r04', fire({ T: 1410, V: 22, H: 4.0 }, 'valve')],
    ['r05', fire({ T: 1410, V: 15, H: 2.0 }, 'valve')],
    ['r06', fire({ T: 1410, V: 15, H: 6.2 }, 'valve')],
    ['r07', fire({ T: 1410, V: 20, H: 4.0 }, 'valve')],
    ['r08', fire({ T: 1410, V: 9, H: 4.0 }, 'valve')],
    ['r09', fire({ T: 1380, V: 15, H: 4.0 }, 'valve')],
    ['r10', fire({ T: 1360, V: 12, H: 4.0 }, 'bed')],   // 床身 tMin=1370；T=1360 < 1370 触发 r10（yield/T below）
    ['r11', fire({ T: 1380, V: 16, H: 4.0 }, 'bed')],   // 床身 vMax=14，V=16 触发 r11
    ['r12', fire({ T: 1410, V: 9, H: 4.0 }, 'valve')],
  ];
  for (const [id, ids] of cover) {
    out.push({ name: `T4 规则 ${id} 可触发`, pass: ids.includes(id), expect: id, got: ids });
  }

  // ---- E1：极值不出现负分 ----
  const e1 = score({ T: 1520, V: 24, H: 1.5 }, 'valve');
  check('E1 极值三项 ≥ 0', true,
    e1.subs.form >= 0 && e1.subs.gas >= 0 && e1.subs.yield >= 0 && e1.total >= 0);

  // ---- E2：全落区间 → 100 / 炉火纯青 / 无扣分文案 ----
  const e2 = score({ T: 1412, V: 15, H: 3.5 }, 'valve');
  check('E2 三项全 100', [100, 100, 100],
    [display.sub(e2.subs.form), display.sub(e2.subs.gas), display.sub(e2.subs.yield)]);
  check('E2 总分 100', 100, e2.total);
  check('E2 特别徽标', '炉火纯青', e2.badge);
  check('E2/E17 文案走无扣分分支', true,
    e2.diagnosis.includes('一级品入库') && !e2.diagnosis.includes('提升至'));

  // ---- E3：非法值回落（不得把 NaN 传到 UI） ----
  // 语义（§10 E3 + §12 第 3 条）：非有限值 → 该参数默认值；有限但越界 → 钳到量程端点
  const e3a = score({ T: NaN, V: Infinity, H: -50 }, 'valve');
  check('E3 NaN → 默认 1420', 1420, e3a.params.T);
  check('E3 Infinity → 默认 15', 15, e3a.params.V);
  check('E3 有限越界 → 钳到端点 1.5', 1.5, e3a.params.H);
  const e3b = score({ T: 'abc', V: undefined, H: {} }, 'valve');
  check('E3 非数字类型 → 默认值', { T: 1420, V: 15, H: 3.5 },
    { T: e3b.params.T, V: e3b.params.V, H: e3b.params.H });

  // ---- E5：同一参数跨子项各取一条（V=22 触发 3 条 V 规则，分属 3 个子项） ----
  const e5 = score({ T: 1410, V: 22, H: 4.0 }, 'valve');
  const e5subs = new Set(e5.fired.filter((f) => f.param === 'V').map((f) => f.sub));
  check('E5 V 跨三个子项各取一条', ['form', 'gas', 'yield'], [...e5subs].sort());
  // 纪律 1：同一子项内同一参数只留一条（结构性互斥，双保险断言）
  const dupKey = new Set();
  let noDup = true;
  for (const f of e5.fired) {
    const k = f.sub + ':' + f.param;
    if (dupKey.has(k)) noDup = false;
    dupKey.add(k);
  }
  check('纪律1 同子项同参数只取一条', true, noDup);

  // ---- E6：参数偏离窗口必触发（断言） ----
  const offCases = [
    { T: 1320, V: 15, H: 4.0 }, { T: 1520, V: 15, H: 4.0 },
    { T: 1410, V: 8, H: 4.0 }, { T: 1410, V: 24, H: 4.0 },
    { T: 1410, V: 15, H: 1.5 }, { T: 1410, V: 15, H: 8.0 },
  ];
  let e6ok = true;
  for (const c of offCases) if (score(c, 'valve').fired.length === 0) e6ok = false;
  check('E6 偏离必触发 ≥1 条', true, e6ok);

  // ---- E15：显示取整独立（54+54+76 与 72 并存是预期） ----
  const e15 = score({ T: 1380, V: 15, H: 6.2 }, 'valve');
  check('E15 显示值独立取整', { gas: 54, total: 72 },
    { gas: display.sub(e15.subs.gas), total: display.score(e15.total) });

  // ---- T6：等级映射（画稿 S05：91 → 二级） ----
  check('T6 91 → 二级', '铸造工 · 二级', gradeOf(91));
  check('T6 96 → 特级', '特级技师', gradeOf(96));
  check('T6 92 → 一级', '铸造工 · 一级', gradeOf(92));
  check('T6 75 → 三级', '铸造工 · 三级', gradeOf(75));
  check('T6 60 → 学徒', '铸造工 · 学徒', gradeOf(60));
  check('T6 59 → 待复检', '待复检', gradeOf(59));

  // ---- 砂箱表抽查（T3：sandbox_8 = 阀体 6.2%） ----
  const s8 = sandboxOf('sandbox_8');
  check('T3 sandbox_8', { casting: 'valve', h0: 6.2 },
    { casting: s8.casting, h0: s8.h0 });

  return out;
}
