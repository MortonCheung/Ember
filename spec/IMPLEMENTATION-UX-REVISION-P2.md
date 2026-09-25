# 实现自述 · 体验修订 R1 · 第二部分（用户第 8、9 条）

> **依据**：`spec/PROMPT-UX-REVISION-P2.md`（2026-09-23 出稿版，唯一依据）。
> **状态**：✅ 已实现并跑完五组门禁。**K1–K20 里 19 条通过、1 条不通过（K13 体积，见 §6 待裁定 D1）。**
> **产物 bundle**：`index-BcZAi9KZ.js`（688.36 kB / gzip 207.28 kB）+ `index-OosJHbfG.css`（32.72 kB / gzip 6.70 kB）。
> **门禁读数**：cast **45/45** · hall **61/61** · entrance **22/22** · turn 门禁 **42/43**（唯一 FAIL = K13b）+
> `selfTest()` **63/63** · vault **37/37** · J 组不回归 **37/37**。
> 本报告凡引用行号均已回代码复核（P2 出稿时的行号与现状的漂移见 §9）。

> 📌 **后记（2026-09-23 · 设计侧回写）**：上面引用的 **`spec/PROMPT-UX-REVISION-P2.md` 已随「第五批」整份移入
> `archive/spec/`**（依据 = 项目规矩「已实现的提示词一律移出 `spec/`」）。本自述的路径**按历史原样保留**，
> 现行位置 = **`archive/spec/PROMPT-UX-REVISION-P2.md`**（⛔ 不要再发，正文一字未改）。
> §8 列出的失效条款**已由设计侧回填**（`TURN-SPEC` / `VAULT-SPEC` / `SCENE-LAYOUT-FIX-SPEC` 各加抬头）。
> §6 的 **D1（体积）· D2（砂箱编号口径）** 仍是**待裁定、未闭环** —— 若据此返工，另起新稿。
> 另：`turning.js` / `turning-data.js` / `turn.js` / `turn-scene.js` 四处文件头注释仍署 `spec/PROMPT-UX-REVISION-P2.md`
> （仅作「本轮依据」署名）。按分工**设计侧不动代码**，故未改；下次代码轮顺手改成归档路径即可。

---

## 0. 本轮改了什么（文件级清单）

| 文件 | 条款 | 改动概述 |
|---|---|---|
| `js/scoring/turning-data.js` | 8a/8b | 删 `T_REF` / `RIVALS` / `BOARD_ME` / `RECORD_TIME` / `BOARD_FOOTNOTE` / `K_TURN_BEST` / `TIMING.boardMin*` / `SUB_LABELS.time`；`WEIGHTS` → `{ surface: 0.5625, size: 0.4375 }`（45:35 归一化，**未重配**）；`FALLBACK.t = 600` 保留 |
| `js/scoring/turning.js` | 8a/8b | 删 `boardRows()` + §3.7 JSDoc + `inBoard` + `fmtClock()` + selfTest 的榜/计时断言；总分公式改两维；黄金值按引擎实际输出写回（§2 表）；**新增 2 条**两维总分边界断言 |
| `js/pages/turn.js` | 8a/8b/9a② | 删榜区 DOM / 时钟块 / `renderBoard*` / `refreshClock` / `elapsedSec` / `st.best`；`timerStart` → `epoch`（13 处）；`RULES_TEXT` 剩 3 条且权重实读 `WEIGHTS`；强制结算文案改「长时间未开始车削，已为你结算。」；工牌写入 `badge.turn = { n, f, score, rank, collab }`（只覆盖 `turn` 一个字段）；**`[data-trace]` 迁出被删的时钟块**（双折线未受影响） |
| `js/scene/turn-scene.js` | 8c | 四工位方刀台（台体 + 90° 阵列 4 凸台 + 中心螺杆 + 六角压紧螺母）+ 压板 + 2 颗六角夹刀螺钉；刀杆带台阶；刀片做前角面 / 主后面 / 刀尖 45° 斜切（全部盒体/圆柱拼装，**未用 ExtrudeGeometry**）。**仍是 2 个 mesh**（`turn_tool_body` + `turn_tool_shank`），零新增 draw call；`debugState()` 新增 `tool.post`（新增件包围盒，取证用） |
| `js/styles/layout.css` | 8a/8b/9b/9c | 删 `.turn__clock*`（含 @media 内 1 条）、`.turn__board*`、`.vault__link`；新增 `.vault__back`（fixed 定位）、`.vault__fingerprint`、`.vault__dex-note` / `.vault__cell-btn` / `.vault__deriv-btn` / `.vault__deriv-note`。`scan_orphan_comments.py` 报 **0** |
| `js/pages/cast.js` | 9a① | 工牌写入改**记录本局**：`rank = gradeOf(total)`、`castScore = total`（去掉"只升不降"），新增 `sandbox` / `casting`（**`box().castingInfo.name` 口径**）/ `params`；删 `turnTime` |
| `js/pages/vault.js` | 9a③–⑦/9b/9c | `buildView()`：删 `statTime` / `needTurn`，新增 `turnScore` / `sandboxLabel` / `fingerprint` / 原值字段；删本地死代码 `fmtClock` / `showTime`；藏品卡「车削用时」→「车削评分」+ `data-time` → `data-turn`；右栏加工艺指纹行（缺段省略、全缺不渲染）、删「去协作车削 →」；**左上角返回键**（`.hud__back.vault__back`，`data-go` 委托 + dispose 对称移除）；图鉴 12 格与 4 张衍生卡**内嵌 `<button>` 可点开/收起**（外层 `<li>` 未动，栅格未动） |
| `js/ui/poster.js` | 9a⑥ | 三值横排中值「车削用时」→「车削评分」（`view.turnScore`，缺值兜底 `—`）；「工种 · 等级」(y=890) 下加 24px 砂箱行（`view.sandboxLabel`，y=918，未与 940 分隔线碰撞）；`drawEmblem` **零改动** |

**未动**（P2 §3.2 冻结清单逐条核过）：`tokens.css` · `router.js` / `venues.js` / `main.js` ·
`entrance/history/hall/home/about.js` · 除 `turn-scene.js` 外的全部三维场景 · `casting.js` / `casting-data.js` ·
`ui/emblem.js` · `design/*` · `#/vault` 两栏栅格与 878 预算结构。

---

## 1. K1–K20 逐条读数

### 车削 · 删榜

| # | 判据 | 读数 | 判定 |
|---|---|---|---|
| **K1** | 无 `.turn__board*` 节点；源码 grep 零残留 | DOM：`turn__board` / `turn__board-foot` / `[data-board]` 全 **0**；源码 grep `boardRows|RIVALS|BOARD_ME|RECORD_TIME|BOARD_FOOTNOTE|K_TURN_BEST|inBoard|boardMin|…|turn__clock|turn__board|data-time` 全仓 `demo/src` **0 hits**（含注释） | ✅ |
| **K2** | `resetRun()` 不抛错、榜区不复活 | 点「再车一只」→ `phase: idle`、`boardNodes 0`、`clockNodes 0`、`goText: 开始车削`、console `[]`（verify_turn `K2_resetRunClean`） | ✅ |
| **K3** | 老 `im.turn.best` 残留无害 | 预置 `{time:3.6,total:100,collab:100}` 后整页重载：榜/钟节点 **0**、`'best' in state()` **false**、再走一局 `total 69`、console `[]`（`K3_staleTurnBestHarmless`） | ✅ |

### 车削 · 删用时

| # | 判据 | 读数 | 判定 |
|---|---|---|---|
| **K4** | 无时钟节点；`elapsedSec` / `refreshClock` / `fmtClock` / `T_REF` / `subs.time` / `WEIGHTS.time` 零残留 | 与 K1 同一次扫描，**0 hits**；DOM `[data-clock]` / `[data-target]` / `.turn__clock` 全 0 | ✅ |
| **K5** | `selfTest()` 全绿 + 对照表 | **63/63**（62 条引擎断言 + 1 条 P0 接线）；对照表见 §2 | ✅ |
| **K6** | 「一个滑杆都不动」实测 | `drive(420, 0.52)`（纪元 = 点击时刻）→ **total 69 / collab 20 / 铸造工 · 学徒 / t 3.6**（`U6a.noTouchBaseline`） | ✅（**76 → 69**，见 §3） |
| **K7** | 规则面板 3 条 + 权重实读 | 3 条；文本含 **56%** / **44%**，不含「用时」「入榜」（`K7_rulesThreeItems`） | ✅ |
| **K8** | 回放仍可用 + 逐帧确定 | `samples 50`、双折线 `polylines 2`、游标推进；回放中 `phase: replay` → 结束 `done` 且按钮恢复；`replayFrame(t)` 在 t = 0/800/1500/2500/3500/4500 六点**逐位一致**（`U7.replayDeterministic` 全 `same: true`） | ✅ |
| **K9** | 协作分仍在且与纪元无关 | 两次调整的一局 `collab 90`（`adjustments 2`）；无调整的一局 `collab 100`；满分局 `collab 100` —— 与改前同输入同值（`U6c` / `U6d` / `U5`） | ✅ |
| **K10** | 设备保护路径未坏 | `__turn.force()`（走 600 s 守卫路径）→ `t 600`、`total 69`、提示「长时间未开始车削，已为你结算。」且**不含「用时」** | ✅ |
| **K11** | CSS 无残留 / 无孤儿注释 / @media 无空壳 | `scan_orphan_comments.py layout.css` → **orphan-comment candidates: 0**；`.turn__clock*` / `.turn__board*` 规则 0 条 | ✅ |

### 车削 · 刀具

| # | 判据 | 读数 | 判定 |
|---|---|---|---|
| **K12** | 近景可辨认三样结构；仍 2 mesh | `meshes: ["turn_tool_body","turn_tool_shank"]`、`calls: 9`（改前同 9，**零新增**）；新增件（方刀台/螺杆/螺母/压板/螺钉）在刀架局部坐标的包围盒 `post.z = [0.145, 0.335]`（**min z = 0.145，恰好守住硬约束③**）、`post.x = [-0.095, 0.095]`；shank 包围盒 `z = [-0.0064, 0.25]`（**局部原点 = 刀尖约定未动**）。近景帧见 §7（「四工位方刀台 / 夹刀螺钉」清晰；「刀片楔角」受 55° 固定机位限制，见待裁定 D6） | ✅（肉眼项待用户复看） |

### 工牌

| # | 判据 | 读数 | 判定 |
|---|---|---|---|
| **K13** | 体积 | **K13a**：`gzip(9)` 205,074 B = **200.27 KiB ≤ 215 KB** ✅。**K13b**：**200.27 > 198.57 KB，差 1.70 KiB → ✗**（详见 §6 与待裁定 D1） | ⚠️ **部分** |
| **K14** | 两局明显不同、非历史最好值 | A 局 `sandbox 4 → 砂箱 05 · 机床床身 / 车削评分 100 / 指纹"砂箱 05 机床床身 · 砂温 1405℃ · 浇速 13.5 kg/s · 湿度 4.2% · 主轴 660 r/min · 进刀 0.30 mm/r"`；B 局 `sandbox 9 → 砂箱 10 · 齿轮（塔轮）/ 72 / 砂温 1430℃…`；差异键 **5/5**（sandbox / casting / turnScore / fingerprint / sandboxLabel）。`castScore` 两局同为 91 且 `rank` 同为二级 —— **"只升不降"已不存在，卡面随本局变** | ✅ |
| **K15** | 返回键 → `#/` | `position: fixed`、`data-go: ""`、`x 18 / y 18 / 74.3×32.4`；点击后 `hash = "#/"`；`.vault__dex` 底 **830 ≤ 900**（栅格未动）；375 px `scrollW 375 = clientW 375` 无横滚 | ✅ |
| **K16** | 12 格 + 4 卡可点开/收起 | `openCell(0)` → 已解锁给馆藏名「造型砂箱」；`openCell(2)` → 未解锁给「完成一次浇铸可解锁」；再点收起（`aria-expanded` 同步、`hidden` 翻转）；`openDeriv(3)` → 「需要解锁 8 件馆藏」；Tab 序内 **12 + 4** 颗按钮、`li.vault__cell` 仍 12 / `li.vault__deriv` 仍 4（**外层 `<li>` 未换标签**）、栅格仍 6 列 × 78px；展开前后 `left_bottom` **830 → 830**（零撑破） | ✅ |
| **K17** | 老数据兼容 | `im.badge = { no: "000001" }` → 不抛错、不白屏；`turnScore "—"`、`sandboxLabel "—"`、`fingerprint null`（DOM 里 `data-turn` 文本 `—`、`data-fingerprint` `hidden=true` 且空）、console `[]` | ✅ |
| **K18** | 海报中值 + 砂箱行 | 海报本体逐像素取证（**数与底色 #0E1116 不同的像素**）：有数据时砂箱行（y 896–936）墨迹 **1,671 px**、等级行（862–896）**1,812 px**；老工牌（无新字段）砂箱行只剩破折号的 **40 px**、label `—`；空白对照带（1180–1220）**8 px**（≈0，证明量的是字不是底）。徽记 `emblem.js` 未改动（V3 双向逐像素比对 `diffPage 0 / diffPoster 0` 同时复验通过） | ✅ |
| **K19** | 五组门禁全绿 | 见 §5：cast 45/45 · hall 61/61 · entrance 22/22 · turn selfTest 63/63（门禁 42/43，唯一 FAIL 即 K13b）· vault 37/37 | ⚠️ 随 K13b |
| **K20** | 四页 console 零 error + 无横滚 | `home` / `history` / `entrance` / `hall` / `cast` console **全 `[]`**（`U12.console.*`）；`#/turn` console `[]`（K20 项）；`#/vault` console `[]`（K19 项）；1440 与 375 px：首页 / `#/about` / `#/turn` / `#/vault` `scrollW = clientW` | ✅ |

---

## 2. 「旧期望 → 新期望」评分对照表（`turning.js selfTest`，K5）

**总数：79 → 62**（−19 删 +2 增；页面侧再加 1 条 P0 接线 ⇒ `selfTest()` 返回 63）。

### 2.1 期望值变化（7 条）

| 断言 | 旧期望 | **新期望** | 原因 |
|---|---|---|---|
| U3① 总分（n=420, f=0.52, t=3.6） | 76 | **69** | 两维权重 0.5625×45.6 + 0.4375×100 = 69.4 → 69 |
| U3② 子项 | 三项 `[100,100,100]` | **两项 `[100,100]`** | `subs.time` 不存在 |
| U3③ 总分（n=660, f=0.30, t=90） | 91 | **100** | 与 U3② 输入等价（只差 t，t 已不评分） |
| U3④ 总分（n=1200, f=0.80, t=600） | 36 | **43** | 0.5625×25 + 0.4375×65 = 42.5 → 43 |
| 算例① 等级 | 铸造工 · 三级 | **铸造工 · 学徒** | 69 < 75（三级门槛）且 ≥ 60 |
| 算例③ 等级 | 铸造工 · 二级 | **特级技师** | 100 |
| 算例④ 等级 | 待复检 | 待复检 | 结论不变，只随分数改（36 → 43） |

### 2.2 新增（2 条，P2 §1 8b 黄金值表要求的总分断言）

| 断言 | 期望 | 依据 |
|---|---|---|
| 边界 n=550, f=0.30 **总分** | **98** | 0.5625×96.5 + 0.4375×100 = 98.03 |
| 边界 n=200, f=0.40 **总分** | **75** | m = 80 < 112 ⇒ z2 让刀不足扣 6.4 ⇒ size **93.6**（不是 100）；0.5625×60 + 0.4375×93.6 = 74.7 → 75（**P2 §0.2 C3 修正过的那个值**） |

### 2.3 删除（19 条，全部"功能没了 ⇒ 判据也没了"）

| 组 | 条数 | 对象 |
|---|---|---|
| U3 用时子项 | 3 | U3①③④ 的 `subs.time` |
| U3 入榜 | 4 | U3①②③④ 的 `inBoard` |
| §4.1 用时口径 | 4 | t=900 钳制等（其中"t 仍钳到 600"**改写保留**，归入设备保护口径） |
| §3.7 协作榜 | 4 | 榜①②③④（`boardRows` / `RIVALS` / `BOARD_ME` 已不存在） |
| §3.2 计时格式化 | 4 | `fmtClock` 的 mm:ss 断言（函数已不存在） |

> **纪律复核**：本轮**没有**改任何引擎系数、阈值或 `GRADES` 门槛 —— 所有期望值按引擎实际输出逐位写回，
> 76 → 69 的掉级**如实固定**在断言里（`turning.js` L251–254 注释明确"不许改门槛凑分"）。

---

## 3. 「不动手」基线分数变化（K6）

| | 改前 | **改后** |
|---|---|---|
| 一局（滑杆全不动 → 直接点开始） | 76 分 | **69 分** |
| 等级 | 铸造工 · 三级 | **铸造工 · 学徒** |
| 读数来源 | — | `U6a.noTouchBaseline`（`drive(420,0.52)`，纪元 = 点击时刻，t = 3.6） |

> 这是"用时退出评分"的必然后果（用时原占 20% 且接近满分）。**`GRADES` 门槛未动**，是否重配阈值由设计侧下一轮裁定。

---

## 4. §0.2 D「门禁脚本随本轮失效」清单的执行情况

| 脚本 | P2 列的失效处 | 执行 |
|---|---|---|
| `verify_turn.py` | 18 处 | 顺序表删 `.turn__clock/.turn__board*`；删 `check_board` / `inBoard` / `elapsed` / `clockFormat` 断言；新增 K1/K2/K3/K7/K10/K11/K12/K13/K20 与 `source_grep_residual()` / `JS_RESIDUAL` / `JS_TOOL` |
| `verify_vault.py` | 6 处 | `mkbadge` 改 `turn:{n,f,score,rank,collab}` + `sandbox/casting/params`；键名硬断言改 `BADGE_KEYS_AFTER`（9 键）；`statTime` → `turnScore`；新增 K14–K19 |
| `verify_ux.py` | 1 处（L429） | `time: s.statTime` → `turnScore: s.turnScore` |
| `save_poster.py` | 1 处 | 种子工牌补新字段 |
| `turn_detail.py` | 3 处 | 改查 `epoch` / 删标识符残留 / 工牌 `turn` |

**五支脚本全部改完再跑**，读数见 §5。

---

## 5. 门禁读数表（五组，改前 / 改后）

| 门禁 | 改前（上一轮记录） | **改后实测** | 判定 |
|---|---|---|---|
| `#/cast` `__cast.selfTest()` | 45/45 + `wired: true` | **45/45**，`wired: true`，`fails: []` | ✅ 不回归 |
| `#/hall` `layout()` | 61/61 | **61/61**，`sections_all_true: true`，`fails: []` | ✅ 不回归 |
| `#/entrance` `layout()` | 22/22 | **22/22**，`overall: true`，`fails: []` | ✅ 不回归 |
| `#/turn` | selfTest **80/80** + U 组全绿 | `selfTest()` **63/63**（79→62 引擎断言 + 1 接线）；门禁脚本扩到 **43 条**，**42 PASS / 1 FAIL（K13b 体积）** | ⚠️ 唯一不绿 = K13b |
| `#/vault` | V 组 **31/31** | 门禁脚本扩到 **37 条**（V 组 + 新增 K14–K19 + 状态 C），**37/37** | ✅ |
| J 组不回归（第 1–7 条） | 37/37 | **37/37**（含 `G_vault_state_ok` 改读 `turnScore`、`left_bottom 830`） | ✅ |
| 375 px 无横滚 | 首页 / `#/about` | 首页 / `#/about` / **`#/turn`** / **`#/vault`** 全部 `scrollW = clientW` | ✅ |

> `#/turn` 门禁的条数从上一轮的口径扩到 43，是因为本轮把 K1–K13/K20 逐条落成了可重复执行的判据
> （P2 §6.3 要求"改后条数如实报"）。**43 条里 42 绿**，唯一红的是体积判据，见 §6。

---

## 6. ⚠️ 待裁定清单（未压下来，逐条等设计侧/用户拍板）

### D1 · K13b 体积不达标（**本轮唯一不通过的判据**）

| 口径 | 改前 | **改后** | 判据 |
|---|---|---|---|
| banner（Vite，zlib 默认级） | 206.96 kB | **207.28 kB**（+0.32） | ≤ 215 KB ✅（余量 7.72） |
| **Python `gzip(9)`（判据口径）** | 204,744 B（199.95 KiB） | **205,074 B（200.27 KiB）**（**+330 B**） | **< 198.57 KB ✗（差 1,739 B ≈ 1.70 KiB）** |
| raw | 702,275 B | **702,864 B**（+589 B） | — |

- **归因**：缺口**不是本轮造成的**。上一轮（第 1–7 条）收尾时 Python 口径已是 204,744 B，**超** 198.57 KB 达 6.17 KiB；
  本轮第 8 条净删 ≈ −0.5 KiB、第 9 条净增 ≈ +0.8 KiB，净 **+330 B**。R2 的前提「第 8 条是净删，预期把体积拉回」
  在"绝对值"上成立（确实净删了），但**第 9 条的净增把它抵消了**，拉不回 198.57 以下。
- **P2 §5.9 禁止顺手优化**，故本轮**未**自行砍体积。可选项（供裁定）：
  - **(a) 修判据**：改为「≤ 215 KB 且不高于上一轮基线 +0.5 KiB」之类可达判据（上一轮报告 §3.1 的 (c) 项）；
  - **(b) 砍内容**：现在只差 1.70 KiB（≈5–6 KB raw），比上一轮的 8.4 KiB 现实得多 —— 例如把五页内嵌的
    `selfTest()` 断言改成 `?debug=1` 按需动态 import（**但这会砍断五组门禁跑生产预览的取证链，需先裁定门禁改法**）；
  - **(c) 接受 200.27 KiB 作为新基线**。

### D2 · 砂箱编号口径（9a③）

P2 原文示例写「`砂箱 04 · 机床床身`」（0 基）。实现取 **1 基**（`sandbox 4 → 砂箱 05 · 机床床身`）——
理由：本页图鉴格编号与徽记编号**都是 1 基**（`sandbox_4` 显示 `05`），同一屏出现两套口径会让观众读不懂。
**存储值 `badge.sandbox` 仍是 0–11**（照 P2 原文取 `state.selected`），只是展示层 +1。
K14 的截图（`p2_k14_round_A_sandbox04.png`）显示的就是 `砂箱 05`。**若设计侧要 0 基展示，改 `vault.js` 的 `sbTag` 一行即可。**

### D3 · `turn.js` 的 `go` 遮蔽（P2 未点名，本轮修复）

`renderTurn(root, { go, routes })` 的路由参数 `go` 被同文件**局部函数 `function go()`（开车）遮蔽**。
后果：`#/vault` 注册后，点「存为我的工牌」时 `go('vault')` 落到局部函数 → **实际执行的是 `resetRun()`**：
既不跳转、还把刚结算的这一局清空（注释里"§7.3 → #/vault"整条失效）。
这是 archive/spec/PROMPT-VAULT.md L229–238「路由一注册那两处降级就会**自动**切到真跳转」能成立的前提，故判为**必须修**：
局部函数改名 `startCut()`（3 处调用点同步），并在原处留注释禁止再叫 `go`。
`cast.js` 用的是 `goStep`，无同型问题（已核）。**属"修复既有 bug"，登记为偏离。**

### D4 · 衍生卡解锁态文案（9c）

P2 只给了锁定态文案（「需要解锁 8 件馆藏」）。展开行的另外两态为实现方补，**只用已有数据推导、未新编馆藏文案**：
- `need = 0` 的两张常开卡 →「完成一次浇铸即可获取」；
- 已达门槛的卡（need 3/8）→「已达解锁条件（n / 12）」。

### D5 · U11 路径④的判据变更

vault 注册后，「车削记录已保留；数字工牌页（#/vault）尚未上线。」这条降级文案**不可达**（`routes` 恒含 vault）。
原 `U11.p4` 断言改为「点击 → `hash === '#/vault'`」；另补 `U11.p4b`（**同文档 hash 切换**回 #/turn 后，
存储不可用时的结算提示含「本次记录不会保存（浏览器存储不可用）」且不含「用时」）——
该提示依赖 `storageOk` 这个**模块级单例**跨路由保持，`nav()` 整页重载会让它复位（第一版写法即错于此）。

### D6 · 「刀片楔角」在固定机位下的可辨性

K12 近景帧（`p2_k12_tool_closeup.png`，clip+scale 3，CAM 未动）里「**四工位方刀台**」「**夹刀螺钉**（2 颗六角 + 压板 + 中心螺杆/螺母）」可辨；
「**刀片楔角**」在 55° 机位 + 金属材质（无环境贴图，metalness 0.6 偏暗）下**最不好认**。
数值侧证据齐（2 mesh、`post.z min = 0.145`、shank 原点约定未动），**视觉上请用户复看裁定**；
若不达标，可选项是微调 `turn_tool_body/shank` 材质的 roughness/metalness（不动几何、不加材质）——等裁定，未动。

### D7 · 三处**验收脚本取证口径**修正（脚本也是代码）

1. **K12**：第一版断言 `body.minZ ≥ 0.145` 必挂 —— `turn_tool_body` 的包围盒含**既有**底座（z 0.07–0.37）。
   改为在 `turn-scene.js` 里对 **8c 新增件**单独量包围盒并经 `debugState().tool.post` 暴露（实测 0.145）。
2. **K18**：第一版只数 alpha —— 海报底色**不透明**，896–936 整带（680×40 = 27,200）全被算成"墨"，两轮读数恒等。
   改为数**与底色 #0E1116 不同的像素**，并加一条空白对照带（1,180–1,220 → 8 px ≈ 0）。
3. **K3**：种残留值前需先用 `delete` 还原被 U9 替换掉的 `localStorage.getItem/setItem`，否则 `setItem` 自身抛错打断整轮；eval 补了漏写的 `JSON.stringify`。

### D8 · P2 §2(5) 两条核查副产品

`turning-data.js` 的 `REC_HINT`（零消费者）**照 P2 原文未动**；
设计侧旧核查脚本（`check_ux_prompt.py` 等）未当门禁跑。

---

## 7. 截图索引（`.workbuddy/shots/`，1440×900 除注明外）

**P2 §6.2 要求的七张**

| 文件 | 内容 |
|---|---|
| `p2_turn_panel_settled.png` | `#/turn` 面板全貌（69 分结算态：**无榜、无时钟**，协分/规则/回放/工牌按钮齐全） |
| `p2_k7_panel_rules_open.png` | 同上，**规则面板展开**（3 条，56% / 44%） |
| `p2_turn_panel_perfect.png` | 100 分那一局（协分 100、双折线出现） |
| `p2_k12_tool_closeup.png` | **切刀近景**（CDP clip+scale 3，CAM 未动；另附 `p2_k12_tool_closeup_hi.png`） |
| `p2_k14_round_A_sandbox04.png` / `p2_k14_round_B_sandbox09.png` | `#/vault` **两局对比**（砂箱 05 机床床身 / 100 分 vs 砂箱 10 齿轮（塔轮）/ 72 分） |
| `p2_k15_back_closeup.png` | 返回键特写（左上角，clip+scale 3） |
| `p2_k16b_dex_and_deriv_expanded.png` | **图鉴格 + 衍生卡展开态**同屏（另附 `p2_k16_dex_expanded.png`） |
| `p2_k18_poster_canvas.png` | **海报本体**（1080×1350，含新增砂箱行「砂箱 05 · 机床床身」）—— 用 `canvas.toDataURL` 落盘，非页面截图 |
| `vault_6_375px.png` / `p2_turn_375px.png` | 375 px 窄屏（无横向滚动） |

**门禁过程留证**（同目录）：`turn_02_cutting / turn_03_settled / turn_04_replay / turn_05_extreme / turn_u12_home375` ·
`vault_1_has_badge_n3 / vault_2_all_unlocked_n8 / vault_3_emblem_valve_n1 / vault_5_empty_state / vault_9_storage_blocked / vault_7_375px_home / vault_8_name_editing` ·
`p2_k17_legacy_badge.png` · `ux_*`（J 组）。

---

## 8. 本轮随之失效的 `*-SPEC.md` 条款（供设计侧统一加过期抬头）

| 条款 | 状态 |
|---|---|
| `TURN-SPEC` §3.2（本局用时口径）· §3.7（协作榜）· §6（组内最佳写 `im.turn.best`）· §4.1（权重 45/35/20）· §8 U3 的用时/入榜项 | **失效**（已由 P2 §1 8a/8b 覆盖） |
| `VAULT-SPEC` §9 的 `im.badge` 字段表（`turnTime`）· §14 第 10 条（`turnTime` 为 null 显示 `—`） | **失效**（`turnTime` 字段已不存在，改为 `turn.score` + 新增四字段） |
| `VAULT-SPEC` §1「画稿如此：无顶栏、无 HUD」 | **部分失效** —— 返回键是唯一例外（`fixed` 定位、不占 878 预算） |
| `SCENE-LAYOUT-FIX-SPEC` §10.10（版式冻结） | 本轮按 P2 §3.1 解冻 8 个文件，其余仍冻结 |

---

## 9. P2 行号漂移记录（出稿 2026-09-23 → 实施时）

P2 的行号总体准确，实施中实测到的漂移/出入（均已按"现状原文"为准执行）：

| P2 写的 | 实际 |
|---|---|
| `turn.js` `st.adj` 的写入点「L266」 | 实施时 `st.adj = []` 的**声明位置**必须先于 `onSlider` 的引用（P2 未点名这条顺序约束，照原文顺序改会 `ReferenceError`） |
| `vault.js` 衍生卡模板「L187-195」 | 与现状一致；新增的说明行需要 `id` + `aria-controls` 配对（P2 未要求，为可达性补） |
| `turn-scene.js` 刀架段「L357-394」 | 与现状一致；8c 新增件从 `POST_Z` 行起，取证时按 `postFrom = geos.length` 切分 |
| `verify_turn.py`「18 处」 | 逐条核到并改齐；另有 3 处**取证口径**问题为 P2 未预见（见 D7） |
| 8c「方刀台 1 个 box（L371）」 | 一致；原方刀台 z = 0.19，新台体 `POST_Z = 0.240`、凸台最小 z = **0.145**（恰好等于硬约束③的下限，非巧合 —— 按 0.145 反推的布置） |

---

*实现方：代码工作流。构建 `EXIT=0`（vite 5.4.21，40 modules）；预览 `127.0.0.1:4173`（sirv manifest 已重启校验，
`index.html` 引用 `index-BcZAi9KZ.js`）。门禁产物：`.workbuddy/shots/verify_turn_results.json`、
`.workbuddy/_vault_results.json`、`.workbuddy/_ux_results.json`。*
