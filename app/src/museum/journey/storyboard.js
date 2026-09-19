/* ============================================================
   storyboard.js — 《辽迹》Final Cinematic Whitebox 分镜数据层

   设计原则（与旧白盒的根本差别）：
   1. 每一个 Shot 自己知道「我在哪里、看哪里、用多少 FOV」。
      Position / Target / FOV 三条路径彼此独立，不存在 Camera 自动寻找展品。
   2. Camera 是导演出来的，不是算出来的。改镜头 = 改这张表。
   3. weight 决定这个镜头分到多少 Scroll，节奏由权重而不是平均分配置。
   4. cut=true 表示这是一个硬切（黑场 / 遮挡 Match Cut），允许位置跳变；
      cut=false 的镜头必须与上一镜头首尾相接，否则自动验收会报位置突跳。

   坐标约定：整片沿 -Z 推进；Y=0 是各章节自己的地坪。
   ============================================================ */

export const CHAPTERS = [
  { id: 'opening', number: '序', title: '开场', color: 0x0b0d10 },
  { id: 'shenyang', number: '01', title: '沈阳 · 机器', color: 0x151b20 },
  { id: 'rail', number: '—', title: '工业铁路', color: 0x14181c },
  { id: 'anshan', number: '02', title: '鞍山 · 钢铁', color: 0x1b1411 },
  { id: 'road', number: '—', title: '工业公路', color: 0x191713 },
  { id: 'fushun', number: '03', title: '抚顺 · 矿坑', color: 0x828b91 },
  { id: 'ending', number: '终', title: '辽迹', color: 0x5c646a },
];

/* ------------------------------------------------------------------
   开场：工业极近景蒙太奇。全黑，靠声音与光影推进。
   全部 cut，镜头之间不要求连续。
   ------------------------------------------------------------------ */
const OPENING = [
  {
    id: 'OP_01_SWITCH',
    chapter: 'opening',
    title: '老式工业开关',
    weight: 1.0,
    cut: true,
    camera: {
      position: [[0.16, 1.62, 0.62], [0.14, 1.58, 0.54]],
      target: [[0, 1.45, 0], [0, 1.45, 0]],
      fov: [[0, 32], [1, 30]],
    },
    env: { fog: [0.4, 6], exposure: 0.55 },
    audio: ['switch_clack'],
    note: '全黑。戴工装手套的手从画外进入，按下老式开关。咔哒。',
  },
  {
    id: 'OP_02_LAMP',
    chapter: 'opening',
    title: '高悬工业灯',
    weight: 1.1,
    cut: true,
    camera: {
      position: [[0.55, 3.05, -0.6], [0.48, 3.28, -1.15]],
      target: [[0, 5.4, -3], [0, 5.4, -3]],
      fov: [[0, 42], [1, 37]],
    },
    env: { fog: [0.6, 12], exposure: 0.7 },
    audio: ['current_hum'],
    note: '电流声出现。灯闪两下后亮起，只照亮灯罩、灰尘与一小段钢结构。',
  },
  {
    id: 'OP_03_SPINDLE',
    chapter: 'opening',
    title: 'C620-1 主轴',
    weight: 0.9,
    cut: true,
    camera: {
      position: [[0.30, 1.36, -4.55], [0.23, 1.29, -4.86]],
      target: [[0, 1.15, -6], [0, 1.15, -6]],
      fov: [[0, 30], [1, 27]],
    },
    env: { fog: [0.4, 7], exposure: 0.62 },
    audio: ['motor_start'],
    note: '极近距离拍主轴。突然旋转，金属反光从镜头上掠过。',
  },
  {
    id: 'OP_04_CABLE',
    chapter: 'opening',
    title: '钢缆与吊钩',
    weight: 0.9,
    cut: true,
    camera: {
      position: [[0.95, 3.55, -7.2], [0.82, 3.72, -7.7]],
      target: [[0, 4.2, -9], [0, 3.95, -9]],
      fov: [[0, 40], [1, 35]],
    },
    env: { fog: [0.5, 10], exposure: 0.6 },
    audio: ['cable_tension'],
    note: '钢缆松弛，突然绷紧，吊钩轻轻晃动。',
  },
  {
    id: 'OP_05_IRON',
    chapter: 'opening',
    title: '铁水越过包沿',
    weight: 1.1,
    cut: true,
    camera: {
      position: [[0.26, 2.76, -10.5], [0.14, 2.62, -10.95]],
      target: [[0, 2.10, -12.2], [-0.36, 2.04, -12.2]],
      fov: [[0, 38], [1, 33]],
    },
    env: { fog: [0.5, 9], exposure: 0.9 },
    audio: ['pour_hiss'],
    note: '只看到浇包边缘。铁水越过边缘，橙光照亮工人半张脸与工装轮廓。',
  },
  {
    id: 'OP_06_CALIPER',
    chapter: 'opening',
    title: '游标卡尺',
    weight: 0.8,
    cut: true,
    camera: {
      position: [[0.20, 1.20, -14.1], [0.13, 1.16, -14.38]],
      target: [[0, 1.00, -15], [0, 1.00, -15]],
      fov: [[0, 26], [1, 23]],
    },
    env: { fog: [0.3, 5], exposure: 0.66 },
    audio: ['caliper_click'],
    note: '卡尺夹住金属零件。一声非常清晰的「咔」。',
  },
  {
    id: 'OP_07_WHEEL',
    chapter: 'opening',
    title: '车轮压上钢轨',
    weight: 0.9,
    cut: true,
    camera: {
      position: [[1.35, 0.52, -16.5], [1.18, 0.47, -16.9]],
      target: [[0, 0.55, -18], [0, 0.49, -18]],
      fov: [[0, 46], [1, 41]],
    },
    env: { fog: [0.6, 11], exposure: 0.68 },
    audio: ['rail_clank'],
    note: '低机位。火车轮压上钢轨，金属撞击声。',
  },
  {
    id: 'OP_08_TITLE',
    chapter: 'opening',
    title: '标题',
    weight: 1.0,
    cut: true,
    camera: {
      position: [[0, 1.70, -19.2], [0, 1.70, -19.5]],
      target: [[0, 2.60, -30], [0, 2.80, -30]],
      fov: [[0, 40], [1, 40]],
    },
    // 黑场靠雾，不靠几何挡板：near/far 收到极短，一切被吞没。
    env: { fog: [0.02, 0.8], exposure: 0.0, blackout: true },
    audio: ['silence'],
    note: '声音突然收束，画面进入黑。出现《辽迹 / 可触碰的辽宁工业记忆》。',
  },
  {
    id: 'OP_09_DOOR',
    chapter: 'opening',
    title: '厂房大门',
    weight: 1.4,
    cut: false,
    camera: {
      position: [[0, 1.70, -19.5], [0, 1.84, -15.6], [0, 1.92, -13.5]],
      target: [[0, 2.80, -30], [0, 3.30, -30], [0, 3.60, -30]],
      fov: [[0, 40], [1, 44]],
    },
    env: { fog: [6, 46], exposure: 0.82 },
    audio: ['door_roll'],
    note: '标题淡出，Camera 后退，第一次看见巨大老厂房入口。滑门缓慢打开，里面是深暗的真实车间。',
  },
];

/* ------------------------------------------------------------------
   沈阳：参观者视角。正常人体高度，克制纪录片长镜头。
   yaw 不做突然大角度变化；力量来自「环境在用户身边工作」。
   ------------------------------------------------------------------ */
const SHENYANG = [
  {
    id: 'SY_01_ENTER',
    chapter: 'shenyang',
    title: '进入老厂房',
    weight: 3.2,
    cut: false,
    camera: {
      position: [[0, 1.92, -13.5], [0.30, 1.74, -34], [-0.60, 1.72, -46]],
      target: [[0, 3.60, -30], [0, 3.00, -55], [0.40, 2.80, -70]],
      fov: [[0, 42], [0.55, 50], [1, 53]],
    },
    env: { fog: [8, 62], exposure: 1.0 },
    audio: ['hall_ambience'],
    note: '第一眼：巨大厂房纵深、高窗、钢桁架、天吊轨道、混凝土柱、机器剪影。远处 C620-1 不突出。',
  },
  {
    id: 'SY_02_ALIVE',
    chapter: 'shenyang',
    title: '厂房活起来',
    weight: 3.6,
    cut: false,
    camera: {
      position: [[-0.60, 1.72, -46], [-1.40, 1.70, -58], [-1.00, 1.72, -64]],
      target: [[0.40, 2.80, -70], [-1.00, 2.60, -84], [-0.50, 2.60, -92]],
      fov: [[0, 53], [1, 52]],
    },
    env: { fog: [8, 62], exposure: 1.0 },
    audio: ['hall_ambience', 'crane_traverse'],
    note: '前进过程中天吊横移、吊钩摆动、工人工作、浇包缓慢倾斜。走的过程里世界一直有事情发生。',
  },
  {
    id: 'SY_03_WALLTEXT',
    chapter: 'shenyang',
    title: '墙面展陈文字',
    weight: 3.0,
    cut: false,
    camera: {
      position: [[-1.00, 1.72, -64], [-2.20, 1.72, -76], [-2.60, 1.74, -84]],
      target: [[-0.50, 2.60, -92], [-4.00, 3.00, -100], [-6.00, 2.60, -104]],
      fov: [[0, 52], [1, 50]],
    },
    env: { fog: [8, 62], exposure: 1.02 },
    audio: ['hall_ambience'],
    note: '文字是建筑的一部分：左墙「沈阳 · 机器 / 1950s · 铁西」，下一面墙「机器制造，曾经定义了这座城市的节奏。」',
  },
  {
    id: 'SY_04_REVEAL',
    chapter: 'shenyang',
    title: 'C620-1 提前进入视野',
    weight: 3.2,
    cut: false,
    camera: {
      position: [[-2.60, 1.74, -84], [-4.20, 1.71, -92], [-5.60, 1.70, -97]],
      target: [[-6.00, 2.60, -104], [-8.20, 2.00, -104], [-9.20, 1.55, -104]],
      fov: [[0, 50], [1, 46]],
    },
    env: { fog: [8, 58], exposure: 1.05 },
    audio: ['hall_ambience'],
    note: '路线本身向 C620-1 偏移：柱列、轨道、灯光、地面线共同引导视线。十几米外就该知道前面有台重要机器。',
  },
  {
    id: 'SY_05_NOTICE',
    chapter: 'shenyang',
    title: 'C620-1 Notice',
    weight: 2.2,
    cut: false,
    camera: {
      position: [[-5.60, 1.70, -97], [-6.20, 1.68, -100]],
      target: [[-9.20, 1.55, -104], [-9.40, 1.45, -104]],
      fov: [[0, 46], [1, 42]],
    },
    interactive: 'lathe',
    notice: [0.15, 0.95],
    env: { fog: [8, 56], exposure: 1.1 },
    audio: ['lathe_idle'],
    note: '工作灯稍亮，主轴轻微转动，主轴箱侧移、刀架上移、尾座后移再合拢，约 0.7 秒。随后出现极小提示「○ 触碰机器」。可以滚过去。',
  },
  {
    id: 'SY_06_WALK',
    chapter: 'shenyang',
    title: '继续深入车间',
    weight: 5.0,
    cut: false,
    camera: {
      position: [[-6.20, 1.68, -100], [-3.20, 1.70, -120], [-2.00, 1.72, -140]],
      target: [[-9.40, 1.45, -104], [-3.00, 2.40, -140], [-4.50, 2.20, -160]],
      fov: [[0, 42], [0.4, 50], [1, 52]],
    },
    env: { fog: [8, 60], exposure: 1.02 },
    audio: ['hall_ambience'],
    note: '离开机床回到中轴，经过更多正在工作的机器与工人，视线自然落到出口附近的工作台。',
  },
  {
    id: 'SY_07_BENCH',
    chapter: 'shenyang',
    title: '工人工作台',
    weight: 3.4,
    cut: false,
    camera: {
      position: [[-2.00, 1.72, -140], [-4.20, 1.62, -150], [-4.60, 1.58, -153.4]],
      target: [[-4.50, 2.20, -160], [-6.20, 1.15, -158], [-6.50, 1.02, -158]],
      fov: [[0, 52], [1, 44]],
    },
    interactive: 'bench',
    notice: [0.18, 0.92],
    env: { fog: [8, 58], exposure: 1.08 },
    audio: ['hall_ambience', 'paper'],
    note: '全片唯一的生活化小场景。Camera 自然偏向工作台：工艺图纸、量具卡尺、搪瓷杯、暖水瓶。10~15 秒即可。',
  },
  {
    id: 'SY_08_EXIT',
    chapter: 'shenyang',
    title: '走出厂房',
    weight: 4.2,
    cut: false,
    camera: {
      position: [[-4.60, 1.58, -153.4], [-1.50, 1.68, -166], [0, 1.72, -186]],
      target: [[-6.50, 1.02, -158], [0, 3.00, -178], [0, 2.60, -212]],
      fov: [[0, 44], [0.5, 50], [1, 52]],
    },
    env: { fog: [5, 44], exposure: 0.9 },
    audio: ['hall_fade', 'outdoor_wind'],
    note: 'Camera 从工人与桌面移开，朝向大门，穿过大门。厂房声逐渐远离，地面开始出现铁轨。',
  },
];

/* ------------------------------------------------------------------
   铁路转场：不是 loading，而是「进入东北工业运输系统」。
   行进本身就是内容（United Carriers 原则）。
   ------------------------------------------------------------------ */
const RAIL = [
  {
    id: 'TR_01_TRACK',
    chapter: 'rail',
    title: '铁轨出现',
    weight: 2.0,
    cut: true,
    camera: {
      position: [[2.60, 0.62, -228], [2.20, 0.58, -252]],
      target: [[0, 0.70, -250], [0, 0.60, -290]],
      fov: [[0, 44], [1, 50]],
    },
    env: { fog: [6, 70], exposure: 0.94 },
    audio: ['rail_ambience'],
    note: '厂房轨道演化成真正铁路：枕木、信号、电线杆。',
  },
  {
    id: 'TR_02_TRAIN',
    chapter: 'rail',
    title: '货运列车进入',
    weight: 2.4,
    cut: false,
    camera: {
      position: [[2.20, 0.58, -252], [1.50, 0.45, -276], [1.20, 0.42, -292]],
      target: [[0, 0.60, -290], [-0.40, 1.00, -320], [0, 1.10, -336]],
      fov: [[0, 50], [1, 52]],
    },
    env: { fog: [6, 74], exposure: 0.96 },
    audio: ['train_approach'],
    note: 'Camera 降低靠近铁轨。一列货运列车出现：1~2 节主要货车，其余远景用低模实例。',
  },
  {
    id: 'TR_03_MOTION',
    chapter: 'rail',
    title: '行进中的信息',
    weight: 3.2,
    cut: false,
    camera: {
      position: [[1.20, 0.42, -292], [1.00, 0.40, -320], [1.10, 0.44, -346]],
      target: [[0, 1.10, -336], [0, 1.20, -360], [0, 1.20, -384]],
      fov: [[0, 52], [1, 52]],
    },
    caption: [
      { t: [0.06, 0.34], text: '铁矿石' },
      { t: [0.38, 0.66], text: '运输' },
      { t: [0.70, 0.97], text: '鞍山' },
    ],
    env: { fog: [6, 78], exposure: 0.98 },
    audio: ['train_running'],
    note: '车轮运动、铁轨后退、信号灯、电线杆、少量工人、货物。文字与画面同步进入，极简。',
  },
  {
    id: 'TR_04_ORE',
    chapter: 'rail',
    title: '矿石遮挡 Match Cut',
    weight: 2.4,
    cut: false,
    camera: {
      position: [[1.10, 0.44, -346], [0.90, 0.95, -362], [0.62, 1.72, -371], [0.46, 2.02, -374.6]],
      target: [[0, 1.20, -384], [-0.20, 1.80, -373], [-0.20, 2.10, -375], [-0.20, 2.20, -375]],
      fov: [[0, 52], [0.62, 46], [1, 40]],
    },
    env: { fog: [4, 60], exposure: 1.0 },
    audio: ['train_running', 'ore_rumble'],
    note: 'Camera 越来越靠近一节运输铁矿石的车厢，找到一块主要矿石，矿石越来越大直到完全填满画面。不出现「现在你是一块铁矿石」的提示。',
  },
];

/* ------------------------------------------------------------------
   鞍山：身份从参观者切换为材料。封闭、高温、速度、材质变化、内部视角。
   ------------------------------------------------------------------ */
const ANSHAN = [
  {
    id: 'AS_01_SCALE',
    chapter: 'anshan',
    title: '高炉外部尺度',
    weight: 2.6,
    cut: true,
    camera: {
      position: [[0, 1.80, -534], [0, 2.40, -560], [0, 3.20, -590]],
      target: [[-25, 14, -640], [-25, 17, -640], [-22, 19, -645]],
      fov: [[0, 50], [1, 44]],
    },
    caption: [{ t: [0.10, 0.72], text: '鞍山 · 钢铁' }],
    env: { fog: [10, 120], exposure: 0.95 },
    audio: ['steel_plant'],
    note: '矿石运到鞍钢。巨型钢结构、高炉、管线、蒸汽、少量工人，只确认尺度，然后迅速进入内部。',
  },
  {
    id: 'AS_02_CHARGE',
    chapter: 'anshan',
    title: '上料',
    weight: 2.6,
    cut: false,
    camera: {
      // 终点必须落在炉喉正上方：下一镜 AS-03 从这里直接下降进炉内，不能跳。
      position: [[0, 3.20, -590], [-8, 15, -612], [-19, 24, -630], [-30, 27, -640]],
      target: [[-22, 19, -645], [-28, 23, -642], [-30, 20, -640], [-30, 8, -640]],
      fov: [[0, 44], [0.6, 52], [1, 56]],
    },
    caption: [
      { t: [0.10, 0.40], text: '铁矿石' },
      { t: [0.42, 0.70], text: '焦炭' },
      { t: [0.72, 0.98], text: '熔剂' },
    ],
    env: { fog: [10, 110], exposure: 0.92 },
    audio: ['charge_skip'],
    note: 'Camera 跟随矿石，铁矿石 / 焦炭 / 熔剂一起进入炉顶。文字与物料同步出现，不用三张 UI 卡片。',
  },
  {
    id: 'AS_03_INNER',
    chapter: 'anshan',
    title: '高炉内部',
    weight: 3.0,
    cut: false,
    camera: {
      // 视线刻意不完全垂直：正对坑底会让炉腔读起来像一个平面圆盘。
      position: [[-30, 27, -640], [-30.2, 18, -640.2], [-30.4, 10, -640.4]],
      target: [[-30, 8, -640], [-30.8, 4.2, -639.4], [-31.0, 1.8, -639.6]],
      fov: [[0, 56], [1, 64]],
    },
    // 炉内压暗：黑、红、高温、巨大纵深。亮是出铁那一刻才有的特权。
    env: { fog: [2.5, 24], exposure: 0.82, bloom: 0.35 },
    audio: ['furnace_roar'],
    note: 'Camera 与物料一起下降，热气向上升。黑、红、高温、巨大纵深。',
  },
  {
    id: 'AS_04_REDUCE',
    chapter: 'anshan',
    title: '还原过程',
    weight: 3.0,
    cut: false,
    camera: {
      // 起点承接 AS-03 的终点（含那点刻意偏移），否则镜头会在边界上跳一下。
      position: [[-30.4, 10, -640.4], [-30.3, 6.2, -640.3]],
      target: [[-31.0, 1.8, -639.6], [-30.6, 1.5, -639.8]],
      fov: [[0, 64], [1, 62]],
    },
    caption: [{ t: [0.22, 0.86], text: '高温与还原，让矿石成为铁。' }],
    env: { fog: [2.5, 22], exposure: 0.95, bloom: 0.55 },
    audio: ['furnace_roar'],
    note: '冷灰 → 变红 → 边缘软化 → 逐渐熔融。只配一行字，不做化学教学 PPT。',
  },
  {
    id: 'AS_05_MELT',
    chapter: 'anshan',
    title: '成为铁水',
    weight: 2.4,
    cut: false,
    camera: {
      position: [[-30.3, 6.2, -640.3], [-30.1, 2.6, -640.1]],
      target: [[-30.6, 1.5, -639.8], [-30.2, 1.2, -639.9]],
      fov: [[0, 62], [1, 66]],
    },
    env: { fog: [2, 16], exposure: 1.15, bloom: 0.9 },
    audio: ['molten_bubble'],
    note: '矿石不再保持固体。Camera 进入铁水的一部分：热粒子、液态高光、热扰动。',
  },
  {
    id: 'AS_06_TAP',
    chapter: 'anshan',
    title: '出铁',
    weight: 2.8,
    cut: false,
    camera: {
      position: [[-30.1, 2.6, -640.1], [-24, 2.2, -640], [-15, 2.6, -644]],
      target: [[-30.2, 1.2, -639.9], [-16, 2.0, -642], [-6, 3.2, -650]],
      fov: [[0, 66], [0.55, 56], [1, 46]],
    },
    env: { fog: [4, 60], exposure: 1.45, bloom: 1.2 },
    audio: ['tap_burst'],
    note: '鞍山最强镜头之一。前方越来越亮，Camera 跟随铁水从出铁口冲出去：狭窄黑暗高温 → 巨大开放空间、蒸汽、工人、设备。',
  },
  {
    id: 'AS_07A_POUR',
    chapter: 'anshan',
    title: '蒙太奇 · 铁水倾倒',
    weight: 0.72,
    cut: true,
    camera: {
      position: [[-8, 3.0, -660], [-8, 3.2, -662]],
      target: [[-10, 1.6, -668], [-10, 1.2, -668]],
      fov: [[0, 46], [1, 42]],
    },
    env: { fog: [4, 40], exposure: 1.35, bloom: 1.2 },
    audio: ['pour'],
    note: 'CUT 1：铁水倾倒。',
  },
  {
    id: 'AS_07B_SPARK',
    chapter: 'anshan',
    title: '蒙太奇 · 火花',
    weight: 0.62,
    cut: true,
    camera: {
      position: [[-10.5, 2.0, -670], [-10.2, 2.2, -671.4]],
      target: [[-10, 1.6, -672], [-10, 1.8, -673]],
      fov: [[0, 40], [1, 38]],
    },
    env: { fog: [2, 16], exposure: 1.5, bloom: 1.6 },
    audio: ['spark_rain'],
    note: 'CUT 2：火花充满画面。',
  },
  {
    id: 'AS_07C_BILLET',
    chapter: 'anshan',
    title: '蒙太奇 · 钢坯推进',
    weight: 0.72,
    cut: true,
    camera: {
      position: [[-13, 2.4, -680], [-12.4, 2.2, -684]],
      target: [[-9, 1.6, -684], [-5, 1.6, -688]],
      fov: [[0, 48], [1, 46]],
    },
    env: { fog: [5, 44], exposure: 1.2, bloom: 0.9 },
    audio: ['billet_roll'],
    note: 'CUT 3：钢坯推进。',
  },
  {
    id: 'AS_07D_ROLL',
    chapter: 'anshan',
    title: '蒙太奇 · 轧辊',
    weight: 0.72,
    cut: true,
    camera: {
      position: [[-9.5, 1.9, -692], [-9.0, 1.7, -694]],
      target: [[-8.4, 1.7, -696], [-8.2, 1.6, -697]],
      fov: [[0, 42], [1, 40]],
    },
    env: { fog: [3, 30], exposure: 1.25, bloom: 1.0 },
    audio: ['mill_roll'],
    note: 'CUT 4：轧辊高速运行。',
  },
  {
    id: 'AS_07E_PLATE',
    chapter: 'anshan',
    title: '蒙太奇 · 红热钢板冲来',
    weight: 0.92,
    cut: true,
    camera: {
      position: [[-6.0, 2.0, -700], [-6.0, 2.0, -700]],
      target: [[-6.0, 2.0, -706], [-6.0, 2.0, -702.1]],
      fov: [[0, 44], [1, 44]],
    },
    env: { fog: [3, 26], exposure: 1.35, bloom: 1.1 },
    audio: ['plate_rush'],
    note: 'CUT 5：红热钢板向 Camera 冲过来，最终填满屏幕。这是 Match Cut 的前半段。',
  },
  {
    id: 'AS_08_TRUCK',
    chapter: 'anshan',
    title: '钢板变成工业车辆',
    weight: 3.0,
    cut: false,
    camera: {
      // 从「钢板贴脸」直接后退让出车身体量：卡车成形后要占画面约 2/3。
      position: [[-6.0, 2.0, -700], [-8.4, 2.6, -696], [-10.0, 2.8, -692]],
      target: [[-6.0, 2.0, -702.1], [-8.0, 1.8, -702], [-8.0, 1.6, -703]],
      fov: [[0, 44], [0.5, 50], [1, 52]],
    },
    env: { fog: [8, 70], exposure: 1.05, bloom: 0.4 },
    audio: ['press_stamp', 'engine_start'],
    note: '象征性电影转场：钢板 → 轮廓线 → 折弯冲压 → 车身形成 → 车轮落下 → 1950s 工业卡车。不是精确制造模拟。',
  },
];

/* ------------------------------------------------------------------
   公路：刚刚形成的钢变成工业车辆，把故事带向下一个工业系统。
   ------------------------------------------------------------------ */
const ROAD = [
  {
    id: 'RD_01_DEPART',
    chapter: 'road',
    title: '车辆出发',
    weight: 2.6,
    cut: true,
    camera: {
      position: [[-10.0, 2.80, -692], [-10.4, 1.10, -740], [-9.6, 0.62, -786]],
      target: [[-8.0, 1.60, -703], [-8.0, 1.50, -790], [-8.0, 1.40, -830]],
      fov: [[0, 52], [1, 52]],
    },
    env: { fog: [10, 110], exposure: 1.0 },
    audio: ['truck_engine'],
    note: '贴近车头、车轮、车斗侧面。不做驾驶模拟。',
  },
  {
    id: 'RD_02_TRANSIT',
    chapter: 'road',
    title: '环境过渡',
    weight: 3.4,
    cut: false,
    camera: {
      position: [[-9.6, 0.62, -786], [-9.2, 0.55, -880], [-8.8, 0.60, -972]],
      target: [[-8.0, 1.40, -830], [-8.0, 1.30, -930], [-8.0, 1.20, -1030]],
      fov: [[0, 52], [1, 52]],
    },
    caption: [
      { t: [0.08, 0.40], text: '鞍钢工业区' },
      { t: [0.44, 0.74], text: '输电与工业道路' },
      { t: [0.78, 0.98], text: '裸露土地 · 山体' },
    ],
    env: { fog: [12, 130], exposure: 1.02 },
    audio: ['truck_engine', 'wind'],
    note: '厂房逐渐减少 → 输电设施 → 工业道路 → 裸露土地 → 山体 → 矿区设施。行进本身就是内容。',
  },
  {
    id: 'RD_03_REVEAL',
    chapter: 'road',
    title: '矿坑揭示',
    weight: 3.0,
    cut: false,
    camera: {
      position: [[-8.8, 0.60, -972], [-8.0, 1.60, -1040], [-5.0, 4.20, -1092]],
      target: [[-8.0, 1.20, -1030], [-8.0, 1.60, -1092], [-3.0, 1.00, -1170]],
      fov: [[0, 52], [0.6, 56], [1, 54]],
    },
    env: { fog: [12, 140], exposure: 1.05 },
    audio: ['truck_slow', 'mine_wind'],
    note: '卡车转过道路，前方地平线突然断开，矿坑第一次出现。车辆减速，Camera 脱离车辆移动到坑缘。',
  },
];

/* ------------------------------------------------------------------
   抚顺：全片 Camera Movement 的最高点。
   俯冲的核心不是 180° Roll，而是 Position 向下 + Target 独立从下转到上。
   ------------------------------------------------------------------ */
const FUSHUN = [
  {
    id: 'FS_01_RIM',
    chapter: 'fushun',
    title: '矿坑边缘',
    weight: 2.4,
    cut: true,
    camera: {
      // 悬在坑口正上方看坑：站太低时画面大半被脚下台地占掉，「深」读不出来。
      position: [[-5.0, 4.20, -1092], [-2.0, 9.50, -1170], [0, 14.0, -1238]],
      target: [[-3.0, 1.00, -1170], [-1.0, -60, -1330], [0, -115, -1400]],
      fov: [[0, 54], [0.6, 56], [1, 58]],
    },
    env: { fog: [14, 260], exposure: 1.05 },
    audio: ['mine_wind'],
    note: 'Camera 脱离车辆移到坑缘，先停留一个短镜头，让用户完整认识它真的非常深：阶梯、铁轨、道路、建筑、设备、极小的工人。',
  },
  {
    id: 'FS_02_DIVE_A',
    chapter: 'fushun',
    title: '俯冲 · 起势',
    weight: 2.6,
    cut: false,
    camera: {
      position: [[0, 14.0, -1238], [7, -14, -1266], [2, -52, -1334]],
      target: [[0, -115, -1400], [0, -114, -1397], [4, -111, -1392]],
      fov: [[0, 58], [0.5, 62], [1, 66]],
    },
    env: { fog: [10, 200], exposure: 1.0 },
    audio: ['dive_wind'],
    note: 'Position 快速向下，前段 Target 仍然向下看。经过阶梯、铁路、平台、设备，让它们从 Camera 旁快速掠过。',
  },
  {
    id: 'FS_03_DIVE_B',
    chapter: 'fushun',
    title: '俯冲 · 姿态变化',
    weight: 2.6,
    cut: false,
    camera: {
      position: [[2, -52, -1334], [-6, -74, -1358], [-3, -92, -1378]],
      target: [[4, -111, -1392], [14, -108, -1386], [10, -103, -1394]],
      fov: [[0, 66], [1, 64]],
    },
    env: { fog: [8, 150], exposure: 0.98 },
    audio: ['dive_wind'],
    note: '下降继续，但 LookAt 与 Position 独立：视线开始从 ↓ 转向 ↘ → ↗。',
  },
  {
    id: 'FS_04_DIVE_C',
    chapter: 'fushun',
    title: '俯冲 · 减速',
    weight: 2.2,
    cut: false,
    camera: {
      position: [[-3, -92, -1378], [-1, -104, -1387], [0, -110.8, -1391]],
      target: [[10, -103, -1394], [4, -103, -1399], [1.6, -105.0, -1400]],
      fov: [[0, 64], [1, 62]],
    },
    env: { fog: [8, 120], exposure: 1.0 },
    audio: ['dive_wind_slow'],
    note: '接近坑底开始减速，LookAt 已经明显朝上。',
  },
  {
    id: 'FS_05_LAND',
    chapter: 'fushun',
    title: '落到工人脚边',
    weight: 2.6,
    cut: false,
    camera: {
      position: [[0, -110.8, -1391], [0, -113.2, -1393.6], [0, -114.62, -1395.4]],
      target: [[1.6, -105.0, -1400], [0.6, -108.6, -1400], [0, -112.76, -1400]],
      fov: [[0, 62], [0.6, 60], [1, 60]],
    },
    env: { fog: [8, 110], exposure: 1.05 },
    audio: ['boots', 'mine_calm'],
    note: '最终落到工人脚边，不是 1.6m 正常高度，而是 0.35~0.45m 的极低机位。广角自然把人拉高。',
  },
  {
    id: 'FS_06_GAZE',
    chapter: 'fushun',
    title: '工人的视线',
    weight: 3.6,
    cut: false,
    camera: {
      // 仰角收着点：工人要「完整身体入画」，天空留给 EN-01 继续抬。
      position: [[0, -114.62, -1395.4], [0, -114.42, -1396.4], [0, -114.24, -1397.2]],
      target: [[0, -112.76, -1400], [0, -112.34, -1400.2], [0, -111.66, -1400.6]],
      fov: [[0, 60], [1, 64]],
    },
    env: { fog: [8, 120], exposure: 1.06 },
    audio: ['mine_calm'],
    note: '工人双手叉腰、略微后仰、抬头看向天空。他的身体与头部方向成为视觉箭头，用户自然沿他的视线向上看。低机位 + 广角让他显得高大，但整个矿坑仍然比他更加巨大。',
  },
];

/* ------------------------------------------------------------------
   结尾：不做未来城市，不强行现代化升华。回到那个时代的人、劳动、生活与自豪感。
   ------------------------------------------------------------------ */
const ENDING = [
  {
    id: 'EN_01_ECHO',
    chapter: 'ending',
    stage: ['fushun'],
    title: '天空与回声',
    weight: 1.6,
    cut: false,
    camera: {
      position: [[0, -114.24, -1397.2], [0, -114.05, -1398.2]],
      target: [[0, -111.66, -1400.6], [0, -107.0, -1404.0]],
      fov: [[0, 64], [1, 66]],
    },
    env: { fog: [10, 160], exposure: 1.06 },
    audio: ['echo_machines'],
    note: 'Camera 顺着工人的视线继续往上，天空逐渐成为画面主体。声音里非常轻地重新出现机床、天吊、铁水、火车、工人脚步。',
  },
  {
    id: 'EN_02A_FLASH_SPINDLE',
    chapter: 'ending',
    stage: ['opening'],
    title: '闪回 · 主轴',
    weight: 0.34,
    cut: true,
    camera: {
      position: [[0.34, 1.40, -4.6], [0.28, 1.34, -4.9]],
      target: [[0, 1.15, -6], [0, 1.15, -6]],
      fov: [[0, 30], [1, 28]],
    },
    env: { fog: [0.4, 6], exposure: 0.7 },
    audio: ['motor_start'],
    note: '闪回开场极近景，时间比开场更短。',
  },
  {
    id: 'EN_02B_FLASH_CABLE',
    chapter: 'ending',
    stage: ['opening'],
    title: '闪回 · 钢缆',
    weight: 0.30,
    cut: true,
    camera: {
      position: [[1.00, 3.60, -7.3], [0.86, 3.78, -7.8]],
      target: [[0, 4.2, -9], [0, 3.95, -9]],
      fov: [[0, 40], [1, 36]],
    },
    env: { fog: [0.5, 9], exposure: 0.66 },
    audio: ['cable_tension'],
    note: '闪回 · 钢缆。',
  },
  {
    id: 'EN_02C_FLASH_IRON',
    chapter: 'ending',
    stage: ['opening'],
    title: '闪回 · 铁水',
    weight: 0.34,
    cut: true,
    camera: {
      position: [[0.30, 2.80, -10.6], [0.16, 2.64, -11.0]],
      target: [[0, 2.10, -12.2], [-0.30, 2.04, -12.2]],
      fov: [[0, 38], [1, 34]],
    },
    env: { fog: [0.5, 9], exposure: 0.95 },
    audio: ['pour_hiss'],
    note: '闪回 · 铁水。',
  },
  {
    id: 'EN_02D_FLASH_WHEEL',
    chapter: 'ending',
    stage: ['opening'],
    title: '闪回 · 车轮',
    weight: 0.30,
    cut: true,
    camera: {
      position: [[1.40, 0.55, -16.6], [1.22, 0.49, -17.0]],
      target: [[0, 0.55, -18], [0, 0.49, -18]],
      fov: [[0, 46], [1, 42]],
    },
    env: { fog: [0.6, 11], exposure: 0.7 },
    audio: ['rail_clank'],
    note: '闪回 · 车轮。',
  },
  {
    id: 'EN_03_TITLE',
    chapter: 'ending',
    stage: ['opening'],
    title: '辽迹',
    weight: 1.8,
    cut: true,
    camera: {
      position: [[0, 1.70, -19.2], [0, 1.70, -19.7]],
      target: [[0, 2.60, -30], [0, 2.80, -30]],
      fov: [[0, 40], [1, 40]],
    },
    env: { fog: [0.02, 0.8], exposure: 0.0, blackout: true },
    audio: ['silence'],
    note: '最终黑场。《辽迹 / 可触碰的辽宁工业记忆》。情绪停留在机器、工人、劳动与那个年代的日常。',
  },
];

export const SHOTS = [
  ...OPENING,
  ...SHENYANG,
  ...RAIL,
  ...ANSHAN,
  ...ROAD,
  ...FUSHUN,
  ...ENDING,
];

/* 每个 Shot 的滚动区间由 weight 归一化得出 —— 节奏是权重，不是平均分。 */
export const SHOT_RANGES = (() => {
  const total = SHOTS.reduce((sum, shot) => sum + shot.weight, 0);
  let cursor = 0;
  return SHOTS.map((shot) => {
    const start = cursor / total;
    cursor += shot.weight;
    const end = cursor / total;
    return { id: shot.id, chapter: shot.chapter, start, end, weight: shot.weight };
  });
})();

export const TOTAL_WEIGHT = SHOTS.reduce((sum, shot) => sum + shot.weight, 0);

/* 章节区间：用于世界可见性裁剪与文字系统的章节态。 */
export const CHAPTER_RANGES = CHAPTERS.map((chapter) => {
  const own = SHOT_RANGES.filter((range) => range.chapter === chapter.id);
  if (!own.length) return { ...chapter, start: 0, end: 0 };
  return { ...chapter, start: own[0].start, end: own[own.length - 1].end };
});

/* 全片基准滚动时长（vh）。按 Shot Weight 分配，所以不需要给每个镜头算 vh。 */
export const SCROLL_VH = 2000;

/* 四个招牌镜头 —— 时间不够时优先保这四个。 */
export const HERO_SHOTS = ['OP_01_SWITCH', 'SY_01_ENTER', 'AS_03_INNER', 'FS_02_DIVE_A'];
