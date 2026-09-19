/* ============================================================
   scoring/casting-data.js — 亲手浇铸 · 纯数据表
   依据：spec/STEP3-INTERACTION-SCORING-SPEC.md §3 / §4.2
   规则：本文件只放数据，不含任何计算
   ============================================================ */

/** §3.1 铸件类型表（理想窗口；温度带宽统一 25℃、速度带宽统一 6 kg/s） */
export const CASTINGS = {
  flange: { key: 'flange', name: '法兰', tMin: 1385, tMax: 1410, vMin: 10, vMax: 16, stars: 1 },
  bed:    { key: 'bed',    name: '机床床身', tMin: 1370, tMax: 1395, vMin: 8,  vMax: 14, stars: 2 },
  valve:  { key: 'valve',  name: '阀体', tMin: 1400, tMax: 1425, vMin: 12, vMax: 18, stars: 3 },
  gear:   { key: 'gear',   name: '齿轮（塔轮）', tMin: 1420, tMax: 1445, vMin: 14, vMax: 20, stars: 3 },
};

/** 砂型湿度窗口（§3.1，与铸件无关，全场统一） */
export const H_MIN = 2.5;
export const H_MAX = 5.0;

/** 滑杆量程（§2 ②③） */
export const T_RANGE = { min: 1320, max: 1520, step: 5 };
export const V_RANGE = { min: 8.0, max: 24.0, step: 0.5 };
export const H_RANGE = { min: 1.5, max: 8.0, step: 0.1 };

/** E3：非法值回落默认 */
export const FALLBACK = { T: 1420, V: 15, H: 3.5 };

/** §3.2 砂箱表（12 只 = 4 铸件 × 3 档湿度；H₀ 为初始湿度） */
export const SANDBOXES = [
  { name: 'sandbox_0',  casting: 'flange', h0: 4.2, stars: 1, collection: '造型砂箱' },
  { name: 'sandbox_1',  casting: 'flange', h0: 5.0, stars: 2, collection: '铁水浇包' },
  { name: 'sandbox_2',  casting: 'flange', h0: 5.8, stars: 3, collection: '十吨桥式起重机' },
  { name: 'sandbox_3',  casting: 'bed',    h0: 4.5, stars: 1, collection: '加料平台与爬梯' },
  { name: 'sandbox_4',  casting: 'bed',    h0: 5.3, stars: 2, collection: '塔轮' },
  { name: 'sandbox_5',  casting: 'bed',    h0: 6.1, stars: 3, collection: '张成哲的革新工具' },
  { name: 'sandbox_6',  casting: 'valve',  h0: 4.8, stars: 2, collection: '十吨冲天炉' },
  { name: 'sandbox_7',  casting: 'valve',  h0: 5.6, stars: 3, collection: '新中国第一枚金属国徽' },
  { name: 'sandbox_8',  casting: 'valve',  h0: 6.2, stars: 3, collection: 'C620-1 普通车床' },
  { name: 'sandbox_9',  casting: 'gear',   h0: 5.0, stars: 2, collection: '《铁流凝变》雕塑' },
  { name: 'sandbox_10', casting: 'gear',   h0: 5.8, stars: 3, collection: '吴家柱的技术学习场所' },
  { name: 'sandbox_11', casting: 'gear',   h0: 6.6, stars: 3, collection: '孟泰仓库的备件架' },
];

/** §4.1 子项权重（由画稿 S03 三项分反解，勿改） */
export const WEIGHTS = { form: 0.40, gas: 0.40, yield: 0.20 };

/** 子项中文名（UI 用） */
export const SUB_LABELS = { form: '造型完整度', gas: '气孔控制', yield: '铁水利用率' };

/**
 * §4.2 扣分规则矩阵（12 条）
 * at: 'tMin' | 'tMax' | 'vMin' | 'vMax' → 取铸件窗口端点；数字 → 全场固定阈值
 * side: 'below' 参数低于阈值触发 / 'above' 参数高于阈值触发
 * 扣分 = min(cap, |参数 − 阈值| × coef)
 */
export const RULES = [
  { id: 'r01', sub: 'form',  param: 'T', side: 'below', at: 'tMin', coef: 0.60, cap: 45,
    defect: '冷隔', mech: '过热度不足，薄壁处先凝固；补缩通道提前凝固亦引发缩孔' },
  { id: 'r02', sub: 'form',  param: 'T', side: 'above', at: 'tMax', coef: 0.60, cap: 45,
    defect: '缩孔', mech: '液态收缩量大、凝固慢 → 缩孔与晶粒粗大' },
  { id: 'r03', sub: 'form',  param: 'V', side: 'below', at: 'vMin', coef: 2.00, cap: 30,
    defect: '冷隔', mech: '充型太慢，前端降温凝固' },
  { id: 'r04', sub: 'form',  param: 'V', side: 'above', at: 'vMax', coef: 2.50, cap: 35,
    defect: '冲砂 / 多肉', mech: '冲刷型壁，砂粒进入铸件' },
  { id: 'r05', sub: 'form',  param: 'H', side: 'below', at: H_MIN, coef: 10.0, cap: 30,
    defect: '胀砂 / 掉砂', mech: '型砂强度不足，型壁被铁水撑开' },
  { id: 'r06', sub: 'gas',   param: 'H', side: 'above', at: H_MAX, coef: 36.0, cap: 70,
    defect: '气孔', mech: '型砂水分发气，气体侵入铸件' },
  { id: 'r07', sub: 'gas',   param: 'V', side: 'above', at: 'vMax', coef: 2.50, cap: 25,
    defect: '卷气 / 夹渣', mech: '湍流卷入气体与氧化膜' },
  { id: 'r08', sub: 'gas',   param: 'V', side: 'below', at: 10, coef: 1.50, cap: 20,
    defect: '氧化夹杂', mech: '充型过慢，表面氧化膜卷入' },
  { id: 'r09', sub: 'gas',   param: 'T', side: 'below', at: 1395, coef: 0.20, cap: 25,
    defect: '气孔（增粘）', mech: '温度低、粘度大，气泡难上浮' },
  { id: 'r10', sub: 'yield', param: 'T', side: 'below', at: 'tMin', coef: 1.20, cap: 30,
    defect: '浇注系统被迫加大', mech: '流动性差需大截面，占用铁水' },
  { id: 'r11', sub: 'yield', param: 'V', side: 'above', at: 'vMax', coef: 2.00, cap: 25,
    defect: '飞溅 / 溢流', mech: '铁水飞溅浪费' },
  { id: 'r12', sub: 'yield', param: 'V', side: 'below', at: 10, coef: 2.00, cap: 25,
    defect: '需补浇 / 回炉', mech: '未充满须二次补浇' },
];

/** 参数中文名与单位（诊断模板用，§4.3） */
export const PARAM_LABELS = { T: '砂型温度', V: '浇注速度', H: '砂型湿度' };
export const PARAM_UNITS = { T: '℃', V: 'kg/s', H: '%' };

/** §6.1 等级映射（91 必须落在「铸造工 · 二级」） */
export const GRADES = [
  { min: 96, rank: '特级技师' },
  { min: 92, rank: '铸造工 · 一级' },
  { min: 85, rank: '铸造工 · 二级' },
  { min: 75, rank: '铸造工 · 三级' },
  { min: 60, rank: '铸造工 · 学徒' },
  { min: 0,  rank: '待复检' },
];

/** §7 馆藏解锁分数线 */
export const UNLOCK_SCORE = 75;
