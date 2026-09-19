# LIAOJI-CINEMATIC-STORYBOARD

《辽迹 · 可触碰的辽宁工业记忆》Final Cinematic Whitebox 分镜总表。
本文件与 `app/src/museum/journey/storyboard.js` 一一对应；**改镜头 = 改那张表**，本文件记录的是设计意图与验收口径。

- 基线分支：`feat/final-cinematic-whitebox`
- 滚动总时长：`SCROLL_VH = 2000vh`，各镜头按 `weight` 归一化分配区间（节奏是权重，不是平均分）
- 相机三路径：Position / Target / FOV 彼此独立，全部写在 Shot 数据里；Camera 不再自动寻找展品
- `cut = true` 表示硬切（黑场 / 遮挡 Match Cut），允许位置跳变；否则必须与上一镜头首尾相接（`__liaoji.shotContinuity()` 全绿）

## 章节节奏

| 章节 | 权重 | 镜头数 | 身份 / 主题 | 摄影 |
|---|---|---|---|---|
| Opening 开场 | 8% | 9 | —— | 工业极近景 + 黑场 + 声音，全硬切 |
| Shenyang 沈阳 | 27.8% | 8 | 我是参观者，我看见工业 | 1.6~1.7m 人体高度，克制长镜头，yaw 不突变 |
| Rail 铁路 | 10% | 4 | 进入东北工业运输系统 | 低机位追车，行进即内容 |
| Anshan 鞍山 | 23.1% | 12 | 我是材料，我经历工业 | 封闭、高温、内部视角、蒙太奇 |
| Road 公路 | 9% | 3 | 钢把故事带往下一个系统 | 贴车头 / 车斗侧面的行进镜头 |
| Fushun 抚顺 | 16% | 6 | 从工业系统回到人 | 坑口俯冲 → 极低机位仰拍 |
| Ending 结尾 | 6% | 6 | 那个时代的人、劳动、自豪 | 视线上仰 + 开场闪回 + 黑场标题 |

## 分镜表（按 Shot 顺序）

### 开场（OP，全硬切）

| ID | 镜头 | Camera / 构图 | Motion（scroll-linked） | 声音 Cue |
|---|---|---|---|---|
| OP_01_SWITCH | 老式工业开关 | 0.55m 特写，FOV 30 | 工装手套从画外进入按下拨杆（咔哒） | switch_clack |
| OP_02_LAMP | 高悬工业灯 | 仰拍灯罩，只照亮灯罩/灰尘/一段钢梁 | 灯闪两下后亮起；灰尘粒子漂浮 | current_hum |
| OP_03_SPINDLE | C620 主轴 | 0.9m 特写 FOV 27 | 主轴突然旋转，高光条掠过镜头 | motor_start |
| OP_04_CABLE | 钢缆与吊钩 | 低角仰视 | 钢缆松弛→绷紧，吊钩摆动衰减 | cable_tension |
| OP_05_IRON | 铁水越过包沿 | 微俯视浇包 | 铁水上升、溢出包沿，橙光亮起照亮工人半张脸 | pour_hiss |
| OP_06_CALIPER | 游标卡尺 | 0.4m 极近景 | 活动爪夹紧零件 + 回弹（咔） | caliper_click |
| OP_07_WHEEL | 车轮压上钢轨 | 0.5m 低机位 | 车轮转动 + 压轨冲击 | rail_clank |
| OP_08_TITLE | 标题 | 雾收到 0.8m 实现全黑（无挡板） | DOM《辽迹》淡入 | silence |
| OP_09_DOOR | 厂房大门 | 后退展门全貌（cut=false 接沈阳） | 沈阳 Set 的大滑门缓慢打开 | door_roll |

### 沈阳（SY）

| ID | 镜头 | 要点 |
|---|---|---|
| SY_01_ENTER | 进入老厂房 | 穿门见纵深：高窗冷光、柱列、天吊轨道、远处机器剪影；门内死黑板在门开后隐藏 |
| SY_02_ALIVE | 厂房活起来 | 天吊沿轨道横移、吊钩摆动、浇包倾斜、冲天炉出铁口脉动、8 名工人小幅动作——走的过程里世界一直有事发生 |
| SY_03_WALLTEXT | 墙面展陈文字 | A 类文字：左墙「沈阳 · 机器 / 1950s · 铁西」、「机器制造，曾经定义了这座城市的节奏。」 |
| SY_04_REVEAL | C620-1 提前入视野 | 路线向机床偏移（柱列/轨道/地面线引导），工作灯渐亮 |
| SY_05_NOTICE | C620-1 Notice | 主轴箱 ←、刀架 ↑、尾座 → 再合拢 ≈0.7s；提示「○ 触碰机器」；可滚过 |
| SY_06_WALK | 继续深入 | 回到中轴，经过更多工人与设备，视线落向出口工作台 |
| SY_07_BENCH | 工人工作台 | 全片唯一生活互动：图纸（点击展开 1.9x 并立起）/ 卡尺（点击抬起测量）；搪瓷杯、暖水瓶不互动，10~15s |
| SY_08_EXIT | 走出厂房 | 出口滑门打开，穿门后硬切进入铁路 |

**Explore 交互（C620-1，console 四步）**：进入即自动拆解（工业分解图，非爆炸）→ 点部件看一句话结构说明（主轴箱/刀架·溜板/尾座/床身，配 C 类工程标注线）→「组装并启动」（工作灯亮、主轴转）→ 手轮进给（滑块驱动刀架移动、车刀接触、切屑粒子、工件变化）→ 历史信息（C620-1 · 1955 · 沈阳第一机床厂）。

### 铁路（TR）

| ID | 镜头 | 要点 |
|---|---|---|
| TR_01_TRACK | 铁轨出现 | 枕木、电线杆、接触网、信号灯；相机 0.6m 低机位 |
| TR_02_TRAIN | 列车进入 | 列车尾（矿石车厢）z 从 -280 行驶到 -375，相机从后方一路追近 |
| TR_03_MOTION | 行进中的信息 | Caption：「铁矿石」「运输」「鞍山」；车轮转动、蒸汽、沿线工人与货物 |
| TR_04_ORE | 矿石遮挡 Match Cut | 相机贴近主要矿石至 0.4m，矿石充满画面 → 硬切进鞍山 |

### 鞍山（AS）

| ID | 镜头 | 要点 |
|---|---|---|
| AS_01_SCALE | 高炉外部尺度 | 远景高炉群 + 管线 + 蒸汽；Caption「鞍山 · 钢铁」；只确认尺度 |
| AS_02_CHARGE | 上料 | 料车爬斜桥、料钟开合；Caption：铁矿石 / 焦炭 / 熔剂（与物料同步，非 UI 卡片） |
| AS_03_INNER | 高炉内部 | 与物料同降（物料↓ 热气↑），炉衬肋环一圈圈经过；炉内标注（C 类）：炉喉/炉身/炉腹/炉缸 |
| AS_04_REDUCE | 还原 | 物料粒子冷灰→红→熔融（材质插值）；Caption「高温与还原，让矿石成为铁。」 |
| AS_05_MELT | 成为铁水 | 相机沉入铁水层，热粒子、液态高光 |
| AS_06_TAP | 出铁 | 铁水冲出出铁口，相机从封闭炉内冲到开放空间；曝光 0.82→1.45 的落差是这一章的高潮 |
| AS_07A~E | 工业蒙太奇 ×5 | 倾倒 → 火花充满画面 → 钢坯推进 → 轧辊高速 → 红热钢板冲向镜头（全硬切） |
| AS_08_TRUCK | 钢板变成卡车 | 钢板贴脸 → 轮廓 → 折弯 → 车身成形 → 车轮落下（Road Set 卡车 setForm） |

### 公路（RD）

| ID | 镜头 | 要点 |
|---|---|---|
| RD_01_DEPART | 车辆出发 | 贴车斗侧面低机位；卡车 z -702 → -1086 |
| RD_02_TRANSIT | 环境过渡 | Caption：鞍钢工业区 / 输电与工业道路 / 裸露土地 · 山体 |
| RD_03_REVEAL | 矿坑揭示 | 卡车减速，相机脱离车辆升高，地平线断开 |

### 抚顺（FS）

| ID | 镜头 | 要点 |
|---|---|---|
| FS_01_RIM | 矿坑初见 | 悬在坑口正上方（14m）俯瞰：19 级阶梯、坑底极小工人、坑壁设施。「它真的非常深」 |
| FS_02_DIVE_A | 俯冲·起势 | Position 快速下降，Target 仍向下；掠过坑壁平台/小屋/工人 |
| FS_03_DIVE_B | 俯冲·姿态变化 | LookAt 与 Position 独立：视线 ↓ → ↘ → → |
| FS_04_DIVE_C | 俯冲·减速 | 视线转平再转上 |
| FS_05_LAND | 落到工人脚边 | 相机 y=-114.6（坑底上方 0.4m），FOV 60 仰视；验收断言：极低机位 + 仰角>15° + 工人占屏 35%~100% |
| FS_06_GAZE | 工人的视线 | 双手叉腰、微后仰、抬头；头部方向 = 视觉箭头，相机缓抬 |

### 结尾（EN）

| ID | 镜头 | 要点 |
|---|---|---|
| EN_01_ECHO | 天空与回声 | 顺工人视线继续上抬，天空成为主体；声音占位：机床/天吊/铁水/火车回声 |
| EN_02A~D | 闪回 ×4 | 主轴 / 钢缆 / 铁水 / 车轮，比开场更短（stage 回 opening 机位） |
| EN_03_TITLE | 辽迹 | 黑场 + 标题。不做未来、不做现代化升华 |

## 文字系统（三类，共 100%）

- **A. 空间内展陈文字（~75%）**：`textPlates.createWallText / createNameplate`，CanvasTexture 贴在墙面/钢结构/铭牌上，是建筑的一部分
- **B. Cinematic Caption（~20%）**：`JourneyOverlay` 的 `.liaoji-caption`，运动中短暂出现、随镜头离开而消失
- **C. Hero 动态标注（~5%）**：C620-1 四部件引线标注 + 高炉炉内四段过程标注（细线 + 端点 + 短标签）

## 声音 Cue（白盒阶段为占位，正式阶段接 Howler.js）

switch_clack / current_hum / motor_start / cable_tension / pour_hiss / caliper_click / rail_clank / silence / door_roll / hall_ambience / crane_traverse / lathe_idle / paper / hall_fade / outdoor_wind / rail_ambience / train_approach / train_running / ore_rumble / steel_plant / charge_skip / furnace_roar / molten_bubble / tap_burst / pour / spark_rain / billet_roll / mill_roll / plate_rush / press_stamp / engine_start / truck_engine / wind / truck_slow / mine_wind / dive_wind / dive_wind_slow / boots / mine_calm / echo_machines

## 验收

- 自动：`python3 tools/verify_journey.py http://127.0.0.1:5173` —— 27 项断言（结构 / 48 镜头定位 / 镜头衔接 / 反向滚动 / Explore 闭环 / C620 入镜 / 抚顺构图读数 / draw call / 旧路由 / 三视口）
- 人工三遍：Pass A 纯看（电影成立吗）；Pass B 全互动（Journey↔Explore 自然吗）；Pass C 反向滚（动画崩吗）
- 人工验收截图：`tools/screenshots-cinematic/`（18 张）
- Debug 导演台：`?debug=1#/journey` → `__liaoji.setShot('FS_05_LAND', 1)`、`showPaths()`（全片 Position 青 / Target 橙双路径）、`pickCenter()`、`fushunComposition()`
