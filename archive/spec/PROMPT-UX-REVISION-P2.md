> ⛔ **【已归档 · 2026-09-23 · 不要发送本文件】**
> **本文件的全部条款（用户第 8、9 条）已于 2026-09-23 实现并交付** ——
> 自述 **`spec/IMPLEMENTATION-UX-REVISION-P2.md`**（K1–K20：**19 条通过、1 条不通过** = 体积判据，
> 见其 §6 待裁定 D1）。**这里的每一项都已经在代码里了**：删排名榜 / 删「本局用时」/ 车刀细化 /
> 工牌记本局 / 返回键 / 图鉴与衍生卡可点 —— **再发一次等于让实现方重做一遍。**
> 📌 它解冻 / 作废了哪些旧条款见自述 §8；自述 §6 的待裁定（**D1 体积** · D2 砂箱口径）**尚未闭环**，
> 若据此返工，**另起新稿**，不要重发本文件。
> 本文件按「移动整文件、内容一字不改」的规矩归档，**正文保留原样**，仅加本条抬头。
> 它的前身 `PROMPT-UX-REVISION.md` 同批在库（同目录）。

---

# 交接提示词 · 体验修订 R1 · 第二部分（用户第 8、9 条）

> **用法**：把下面 `---` 之间的全文复制给代码工作流。
> **状态：✅ 可发（本文件是当前唯一可发的提示词）。** 2026-09-23 出稿。
> **来源**：`archive/spec/PROMPT-UX-REVISION.md`（← 原 `spec/`）§1 第 8、9 条 —— 该文件第 1–7 条已实现并验收，
> 第 8、9 条已抽到本文件，故**整份归档**。
> **⚠️ 本文件与旧稿冲突时一律以本文件为准**：旧稿第 8、9 条里有 **9 处错误 + 6 处遗漏**（见 §0.2 差异表），
> 出稿前已逐条回代码核过。
> 冲突优先级：**本文件 > `archive/spec/PROMPT-UX-REVISION.md` > 各 `*-SPEC.md` 既有条款 > 画稿 > 代码现状**。
> 画稿基准：`design/S04-协作车削.png` / `design/S05-数字工牌.png`（**本轮不改设计稿**）。
> 环境提醒见文末 §8。

---

# 交接：体验修订 R1 · 第二部分

## 0. 你是谁，现在做到哪了

你是本作品（中国工业博物馆 Web 数字展厅 · 主题「炉火不灭」）的**代码实现方**。设计侧已交付全部规格与提示词，你负责实现并交付自述报告。

**当前状态（2026-09-23）**：四层体验骨架**八页全部上线**，全部验收通过。

| 路由 | 页面 | 状态 |
|---|---|---|
| `/` | 首页（S01，含数据时间轴） | 已上线 |
| `#/entrance` | 序厅（三维单件场景） | 已上线 |
| `#/history` | 通史馆（2D 长卷） | 已上线 |
| `#/hall` | 铸造馆（全屏车间 + 热点） | 已上线 |
| `#/cast` | 亲手浇铸（五步交互 + 评分） | 已上线 |
| `#/turn` | 协作车削（U 组通过） | 已上线 |
| `#/vault` | 数字工牌（V 组 31/31） | 已上线 |
| `#/about` | 关于项目（R1 第 2 条新增） | 已上线 |

`main.js` 的 `PAGES` / `TITLES` 各 **8 键**；`home.js` 的 `NAV` **6 项**。

**本轮范围**：只做用户 9 条调整里的**第 8、9 两条**。
⛔ **不要重做第 1–7 条** —— 那七条已经实现并验收通过（J 组 37/37，自述 `spec/IMPLEMENTATION-UX-REVISION.md`）。

**用户对这两条的原始诉求**（原话大意）：
- 第 8 条：车削页**排名榜多余**、**「本局用时」多余**、**车刀模型太粗糙**。
- 第 9 条：数字工牌**问题最多** —— 看不出"这一局跟上一局不一样"、**没有返回键**、**存下来的东西不能点击查看**。

---

## 0.1 本轮四项裁定（用户已拍板，不要再问）

| # | 裁定 | 落点 |
|---|---|---|
| **R1** | 第 7 条实现方多写的那行 `ladle.melt.rotation.x = 0` —— **接受**。判定为"清除待机微摆残留"（去残留），不是"新增补偿"。 | 已实现，**本轮不动** |
| **R2** | J23 体积判据：**保留「< 198.57 KB」硬指标**，**等第 8 条做完后复测**（第 8 条是净删，预期把体积拉回）。 | §6 K13 |
| **R3** | 第 8 条的「用时」：用户原话是**「连内部计时一起删」**。 | §1 第 8 条 8b 的 ⚠️ 执行口径 |
| **R4** | 第 8、9 条收敛为**本文件**独立交接稿，旧稿整份归档。 | 本文件 |

> **关于 R3 的处理方式（重要，请先读）**：设计侧按裁定回代码核过 ——
> 「内部计时」实际是**四样东西**，只有第 ① 样是"用时"，② ③ ④ 是别的功能的时钟（见 §1 8b 的表）。
> 照字面把四样全删，会连带删掉**回放、双折线、团队协作积分、展厅设备保护**四项已验收功能。
> 故 8b **按"删掉用时这个概念、保留中性时钟"执行**，并已列出全部保留项与理由。
> **若用户另行明确要求连 ②③④ 一起删 —— 停手回报，不要自行决定。**

---

## 0.2 与旧稿的差异（⚠️ 读这一节能省一整轮返工）

设计侧出稿前把旧稿第 8、9 条的**每一条行号都回代码核过**。下列是必须按本文件执行的修正：

**A. 行号漂移（上一轮删掉 153 行飞越 CSS 造成的）**

| 旧稿写的 | **实际位置** | 说明 |
|---|---|---|
| `layout.css` **L1204-1219** `.turn__board*` | **L1050-1065** | 漂移 154 行 |

**B. 旧稿漏掉的连带项（照旧稿做会留死代码 / 孤儿 CSS / 报错）**

| # | 漏了什么 | 实际位置 |
|---|---|---|
| 1 | 车削页 `.turn__clock*` 的 **CSS** 从没被点名 | `layout.css` **L988-991** + 媒体查询内 **L1079** |
| 2 | `refreshClock()` 有 **6 个**调用点，旧稿只列了 5 个 | 漏的是 `resetRun()` 里的 **turn.js L442** |
| 3 | `renderBoardInitial()` 有 **2 个**调用点，旧稿只列了 1 个 | 漏的是 `resetRun()` 里的 **turn.js L440** |
| 4 | `fmtClock` **整个函数**在 `turning.js` 里会变成死代码 | `turning.js` **L158-163** + 自测 **L300-304** |
| 5 | `.vault__link` 的 CSS 会成孤儿 | `layout.css` **L1281-1282** |
| 6 | 三个文件头 / JSDoc 里的旧纪律会变成假话 | `turn.js` **L1-9** · `vault.js` **L13** · `turning.js` **L57-59** |

**C. 旧稿的事实错误（照字面写会报错或算错）**

| # | 旧稿写的 | 实际是 |
|---|---|---|
| 1 | `casting: CASTINGS[box().casting].name` | `cast.js` **没有 import `CASTINGS`**。正确写法：**`box().castingInfo.name`**（`cast.js` L283 已在用这个口径） |
| 2 | `.hud__back` 用法在 `hall.js` **L54** | 实际 **L51**（`entrance.js` L40 是对的） |
| 3 | 黄金值「边界 `n=200, f=0.40` → 子项 60/100 → 新总分 **78**」 | **错**。`m = 200×0.40 = 80 < 112` → 触发 `z2` 让刀不足扣 6.4 → **size = 93.6 不是 100** → 新总分 = 0.5625×60 + 0.4375×93.6 = 74.7 → **75** |

**D. 门禁脚本会随本轮失效（旧稿只提了 `verify_turn.py`，实际有三支 + 两支开发脚本）**

| 脚本 | 失效处 |
|---|---|
| `.workbuddy/verify_turn.py` | **18 处**：DOM 顺序表 L54-55 含 `.turn__clock` / `.turn__board` / `.turn__board-foot`；`[data-clock]` 读数 L179 + 断言 `U4.clockFormat` L183；`check_board()` L100-103 及调用 L206 / L223；`inBoard` 断言 L194 / L197 / L211 / L225 / L228；`st["elapsed"]` L181 |
| `.workbuddy/verify_vault.py` | **6 处**：L74 种子里写 `turnTime`；**L185 硬断言工牌键名列表含 `turnTime`**；`statTime` 断言 L299-300 / L322 / L326 |
| `.workbuddy/verify_ux.py` | **1 处**：L429 `time: s.statTime` |
| `.workbuddy/save_poster.py`（开发脚本） | L62 种子工牌含 `turnTime:'01:52'` |
| `.workbuddy/turn_detail.py`（诊断脚本） | L23-25 / L31-33 找 `els.clock` / `fmtClock` / `boardRows` |

> ⚠️ **"不回归门禁"不只是"跑一遍"** —— 承载被删功能的**断言脚本本身也是要被改的代码**，
> 必须跟功能**同一个改动清单**里一起改，改完再跑绿。

---

## 1. 这一轮做什么（逐条，含精确位置）

> 每一条都标了 **文件 + 行号 + 现状原文**。行号是 2026-09-23 出稿时实测的；
> 若你读到时代码已漂移，**以"现状原文"为准**，并在自述里记下漂移。

### 用户第 8 条 · 协作车削三处：删排名 / 删用时 / 刀做细

#### 8a. 删掉右下角的排名榜

**要删的东西（三个文件 + 样式 + 自测）：**

| 文件 | 行号 | 现状原文 / 内容 |
|---|---|---|
| `pages/turn.js` | **L122-123** | `<div class="turn__board" data-board></div>` + `<p class="turn__board-foot">${BOARD_FOOTNOTE}</p>` |
| `pages/turn.js` | **L15** | import 里删 `RIVALS` / `BOARD_ME` / `RECORD_TIME` / `BOARD_FOOTNOTE` / `K_TURN_BEST`（**保留** `MODE_BADGE` / `K_BADGE`） |
| `pages/turn.js` | **L274-312** | 段注释 `/* 协作榜（§3.7） */` + `renderBoard()`（L275-298）+ `renderBoardInitial()`（L300-312）**整段删** |
| `pages/turn.js` | **L375** | `renderBoard(r);` |
| `pages/turn.js` | **L440** | `renderBoardInitial();` ← ⚠️ 在 `resetRun()` 里，**旧稿漏了** |
| `pages/turn.js` | **L504** | `renderBoardInitial();`（启动） |
| `pages/turn.js` | **L383-389** | §6 组内最佳写块 + `store.set(K_TURN_BEST, st.best)`（**L390 的「评级：…」push 保留**） |
| `pages/turn.js` | **L178** | `best: store.get(K_TURN_BEST, null),`（`st.best` 整个字段删） |
| `pages/turn.js` | **L392** | `if (!r.inBoard) notes.push(...未达入榜门槛…)` |
| `pages/turn.js` | **L161** | `els` 里的 `board: $('[data-board]'),` |
| `pages/turn.js` | **L523** | 调试钩子 `state()` 里的 `inBoard: st.result.inBoard,` |
| `pages/turn.js` | **L527-532** | 调试钩子里的 `board: [...]` 段 |
| `pages/turn.js` | **L526** | `best: st.best,`（同段） |
| `scoring/turning.js` | **L13** | import 里删 `RIVALS` / `BOARD_ME`（**保留** `TIMING` / `DURATION_MS`） |
| `scoring/turning.js` | **L134-156** | `§3.7 协作榜排序` JSDoc（L134-144）+ `const BENCH`（L145-148）+ `boardRows()`（L150-156）**整段删** |
| `scoring/turning.js` | **L108-109** | 入榜门槛注释段 |
| `scoring/turning.js` | **L112** | `const inBoard = ...` |
| `scoring/turning.js` | **L126** | 返回值里的 `inBoard,` |
| `scoring/turning.js` | **L285-298** | selfTest `§3.7 排行榜三组` 段注释 + 4 条断言（`榜①` `榜②` `榜③` `榜④`） |
| `scoring/turning-data.js` | **L86-87** | `TIMING.boardMinTime` / `TIMING.boardMinScore`（**保留** `forceSettle` / `sampleMs`） |
| `scoring/turning-data.js` | **L91-100** | `§3.7 协作榜` 注释 + `RIVALS`（L92-95）+ `BOARD_ME`（L96）+ `RECORD_TIME`（含 L97 注释、L98）+ `BOARD_FOOTNOTE`（含 L99 注释、L100）**整段删** |
| `scoring/turning-data.js` | **L106** | `export const K_TURN_BEST = 'im.turn.best';`（**保留** L107 `K_BADGE`） |
| `styles/layout.css` | **L1050-1065** | `.turn__board` / `.turn__board-row` / `-row.is-me` / `-rank` / `-name` / `-time` / `-tag` / `-foot` 全部规则 |

**保留**：`total` / `totalShown` / `collab` / `rank` / `fired` / `mainRule` / `params` / `forcedSettle` / `MODE_BADGE`。

> ⚠️ 老用户 localStorage 里可能残留 `im.turn.best` —— **不要去清**（无消费者即无害），也不要在代码里读它。

#### 8b. 「本局用时」彻底移除

##### ⚠️ 执行口径（先读这张表，再动手）

「内部计时」实际是**四样**东西。只有 ① 是"用时"；②③④ 是别的功能的时间基准：

| # | 东西 | 代码位置 | 它挂着的功能 | 删掉的后果 |
|---|---|---|---|---|
| **①** | `elapsedSec()`「本局用时」这个**量** | `turn.js` L185-191 | 时钟显示 L195 · 评分 `subs.time`（`turning.js` L87）· 入榜门槛 L112 | **无 —— 本轮本来就要删它** |
| **②** | `st.rec[].t` **录制时间轴** | 采样 L202-206 · 双折线 L315-341 · 回放 L449-471 | 「回放本局」按钮 · 双折线轨迹图 | 两个功能一起没 |
| **③** | `st.adj[]` **调参时间差** | 写入 `turn.js` L266 · 消费 `turning.js` L44 `gapTotal` | 团队协作积分 | 协作分只剩"偏离"一半 |
| **④** | `forceSettle` **600 s 守卫** | 守卫 `turn.js` L213-215 · 触发 L399-408 | 展厅设备保护（防长时间占机） | 观众可无限占机（**安全项**） |

**结论：删 ①，保 ②③④。** 理由两条：
1. ②③④ **不产生任何能被观众读到的"用时"** —— 它们只要一个单调时钟就够，而这个时钟观众看不见。
2. 已核：**③ 的算法天然与纪元无关** —— `gapTotal()`（`turning.js` L44-52）只累加**相邻两次调整的时间差**
   （`sum += ts[i] - ts[i-1]`），与纪元起在哪一刻无关。所以 ②③④ 保留时**行为一字不变**。

**执行（三条）：**

**(1) 界面（`pages/turn.js`）**
- **L99-104** `.turn__clock` 整块删：`本局用时` 标签 / `[data-clock]` 读数 /
  `[data-target]`「历史纪录 00:50 · 组内最佳 —」。
- ⚠️ **`[data-trace]` 双折线不能跟着没！** 它的宿主是 `.turn__clock`（**L103**），块删了它会一起消失 ——
  把 **L103 `<div class="turn__trace" data-trace hidden></div>` 移出**，成为 `.turn__panel` 的直接子元素，
  放在原 **L121（`.turn__rules`）之后、原 L122 榜之前**的位置。
  **`renderTrace()`（L315-341）与 `moveTraceCursor()`（L342-352）本身一行不动**（它的 x 轴用回放时间，语义仍成立）。
- **L161** `els` 里删 `clock` / `target`（**`trace` 保留**）。
- **L193-199** `refreshClock()` 整个删（含 L196-198 的 `best` 逻辑）。
- **6 个调用点全删**：**L212**（ticker 内）· **L268**（`onSlider`）· **L395**（`settle`）·
  **L423**（`go`）· **L442**（`resetRun`）· **L505**（启动）。
  > ⚠️ 旧稿只列了 5 个，**L442 是漏掉的那个** —— 漏了会 `ReferenceError`。
- **L372** `els.clock.textContent = fmtClock(r.params.t);` 删。
- **L438** `els.clock.textContent = '00:00';` 删（在 `resetRun()` 里）。
- **L519** 调试钩子 `state()` 里的 `elapsed: +elapsedSec().toFixed(3),` 删。
- **L185-191** `elapsedSec()` 整个删。
- **L183** `const now = () => performance.now();` **保留**（②③④ 都要用）。
- **import 同步**：**L14** 删 `T_REF`；**L15** 删 `RECORD_TIME`；**L18** 删 `fmtClock`。
- **L43-53 `RULES_TEXT`** 删第 3 条（**L48-49**）与第 5 条（**L52**）→ 剩 3 条；
  第 1、2 条的权重数字从 `WEIGHTS` **实读**，改后应是 **56% / 44%**，不要写死旧文本。
- **L391** `if (force) notes.push(\`用时超过 ${TIMING.forceSettle} s，已强制结算。\`)`
  → **改写为不含「用时」的措辞**，例如：`长时间未开始车削，已为你结算。`
- **L173 / L186 / L203-204 / L213-215 / L262 / L266 / L403 / L413 / L417 / L430 / L518 / L543**
  —— `st.timerStart` **改名为 `st.epoch`**（共 **13 处**，纯机械改名），
  并把 **L173 的注释**由「计时起点（首次 input 或点击时刻）」改成
  「录制 / 协作分共用**毫秒纪元**（首次 input 或点击时刻）—— **不是"用时"，页面不读它**」。

**(2) CSS（`styles/layout.css`）**
- 删 `.turn__clock`（**L988**）· `.turn__clock-label`（**L989**）· `.turn__clock-value`（**L990**）·
  `.turn__clock-target`（**L991**）。
- 删 **媒体查询内**的 `.turn__clock-value { font-size: 36px; }`（**L1079**）。
  > ⚠️ 旧稿完全没提这两处 —— 最容易变成孤儿 CSS。
- `.turn__trace*`（**L994-1013**）**保留** —— 只搬家不改样式。
- 删完**必须跑** `.workbuddy/scan_orphan_comments.py`，并人工检查 `@media` 块有没有被删成**空壳**。

**(3) 评分（`scoring/turning-data.js` / `scoring/turning.js`）**
- `turning-data.js` **L51**：`WEIGHTS = { surface: 0.45, size: 0.35, time: 0.20 }`
  → **`WEIGHTS = { surface: 0.5625, size: 0.4375 }`**
  （把原 45 : 35 **归一化到 100**，**不改两维之间的相对权重** —— 不许"顺手"重配成 50/50 或 60/40）
- `turning-data.js` **L47-48** `T_REF` 连同注释删；**L54** `SUB_LABELS.time` 删。
- `turning-data.js` **L20** `FALLBACK = { n: 420, f: 0.52, t: 600 }` —— **`t` 保留**
  （非法值回落的健壮性入口，**不是评分项**；selfTest L239 / L242-243 断言它）。
- `turning.js` **L87** `subs.time` 删；**L90-92** 总分公式改成两维
  `WEIGHTS.surface * subs.surface + WEIGHTS.size * subs.size`。
- `turning.js` **L12** import 删 `T_REF`（`TIMING` **保留**）。
- `turning.js` **L64-69** 的 `t` 解析与钳制、**L111** `forcedSettle` —— **保留**
  （那是展厅设备保护，与成绩无关）。
  ⚠️ 但 **L54-59 的 JSDoc 必须改写**：删掉 `subs:{…,time}`，并把 `t` 的说明由「本局用时 s」
  改成「机械时长（秒）—— **不参与评分**，仅用于判定强制结算标记与非法值回落」。
- `turning-data.js` **L62-66**：`DURATION_MS` **数值一个不动**；
  **L63 注释**里"否则用时口径不公"的理由随用时一起消失 → 改写为
  「固定时长以保证回放可复现（§3.8）」。
- `turning-data.js` **L9-13 注释**要改：里面写着「『不动手』落点 = 76 分、**不入榜**（§7.4）」——
  改后是 **69 分**，且**入榜概念已不存在**。同段「与浇铸『不动手 72 分』同量级」保留。

**(4) `fmtClock` 整个函数会变死 —— 必须一起删**（旧稿只说了删 import）
- 已核：`fmtClock` 在 `turn.js` 有 **9 处**调用（L102 / L195 / L197 / L198 / L295 / L304 / L310 / L372 / L488），
  **全部属于本轮要删的东西**；全仓再无其他消费者（`vault.js` 另有一份自带副本，见下）。
- 故：删 `turning.js` **L158-163**（JSDoc + 函数本体）+ selfTest **L300-304** 四条计时格式化断言。
- ⚠️ 顺带核出：**`vault.js` **L47-50** 的本地 `fmtClock` 是既有死代码**（本页零调用）。
  它不在本轮功能范围内，但正好在改动区旁边 —— **一起删掉**，别留着误导后来人。

##### ⚠️ 黄金值必须重算（本轮最容易做错的一处）

`scoring/turning.js` 的 `selfTest()` 里有一批以旧权重算出的期望值。**先逐条改，再跑，按引擎实际输出写回。**

| 算例 | 输入 | 子项 | 旧总分 | **新总分** |
|---|---|---|---|---|
| U3① | `n=420, f=0.52` | surface 45.6 / size 100 | 76 | **69** |
| U3② | `n=660, f=0.30` | 100 / 100 | 100 | **100** |
| U3③ | `n=660, f=0.30`（原 t=90） | 100 / 100 | 91 | **100** |
| U3④ | `n=1200, f=0.80` | surface 25 / size 65 | 36 | **43** |
| 边界 | `n=550, f=0.30` | 96.5 / **100** | — | **98** |
| 边界 | `n=200, f=0.40` | 60 / **93.6** ← 见下 | — | **75** |

> ⚠️ 最后一行的 **size 是 93.6 不是 100**：`m = 200 × 0.40 = 80 < 112` → 触发 `z2`「让刀不足」
> 扣 `(112−80)×0.20 = 6.4`。旧稿在这里算错了（写成 60/100 → 78 分）。
> 这条对应 selfTest **L225**（它只断言 `subs.surface == 60`，所以断言本身不用改，**别去改它**）。

**selfTest 逐条改动清单**（`scoring/turning.js`）：

| 行 | 断言 | 动作 |
|---|---|---|
| L181 | `U3① 用时` | **删** |
| L182 | `U3① 总分 76` | → **69** |
| L184 | `U3① 入榜 false` | **删** |
| L187 | `U3② 三项 [100,100,100]` | → **两项 `[100, 100]`**（surface, size） |
| L190 | `U3② 入榜 true` | **删** |
| L193 | `U3③ 用时 56` | **删** |
| L194 | `U3③ 总分 91` | → **100** |
| L196 | `U3③ 入榜 true` | **删** |
| L201 | `U3④ 用时 8` | **删** |
| L202 | `U3④ 总分 36` | → **43** |
| L209 | `U3④ 入榜` | **删** |
| L213-214 | `t=900 用时口径仍按 600 计` | **删** |
| L204 / L210 / L211 | `forcedSettle` 三条 | **保留不动** |
| L216-233 | 边界 15 条 | **保留不动**（它们只断言 `subs.surface` / `subs.size`） |
| L239 / L242-243 | `E3 t=0 → 回落 600` | **保留不动** |
| L266-270 | `§4.1 用时口径` 四条 | **删** |
| L276 | `算例① 76 → 三级` | → **69 → 铸造工 · 学徒** |
| L277 | `算例② 100 → 特级技师` | 不动 |
| L278 | `算例③ 91 → 二级` | → **100 → 特级技师** |
| L279 | `算例④ 36 → 待复检` | → **43 → 待复检**（仍 < 60，结论不变，只改数字） |

> **U3③ 与 U3② 在删掉用时后输入等价**（都只差 `t`），两条会给出同一个总分 —— 这不是 bug，
> 是"用时不再参与评分"的必然结果。**保留两条，把期望值都写成实际输出，并在注释里说明原因。**
>
> ⚠️ **纪律：按引擎实际输出逐位写回期望值，并在报告里给出「旧期望 → 新期望」逐条对照表。**
> **绝不许为了让自测变绿而反改引擎系数或阈值**（那正是本项目最忌的"设计跟着数值走"）。
>
> ⚠️ **必须在报告里实测并写明这条后果**：用时原本占 20% 且平时接近满分，删掉后**总分整体下移** ——
> 「一个滑杆都不动、直接点开始」这一局从 **76 → 69 分**，等级从「铸造工 · 三级」掉到「**铸造工 · 学徒**」
> （`GRADES` 门槛：学徒 ≥60、三级 ≥75）。**如实报，不要为了分数好看去调门槛** ——
> 是否重配阈值由设计侧在下一轮裁定。

#### 8c. 切刀建模太粗糙，要做出可辨认的结构

- **文件**：`demo/src/js/scene/turn-scene.js`，**L357-394**（`刀架 + 刀具` 段）
- **现状**：刀架 = 底座（L369）+ 上滑板（L370）+ 方刀台 1 个 box（L371）+ 2 个扳手方头（L373-374），合并 1 mesh；
  刀杆 = 刀杆 box（L382-383）+ 刀尖 box（L384-385）+ 刀片 box（L387-388），合并 1 mesh。方刀台只有 10 cm 见方。
- **要改成**（全部用盒体 / 圆柱 / 楔面拼出来，**不贴图、不新增材质**）：
  1. **四工位方刀台**：由 1 个 box 改成绕中心 **90° 阵列的 4 个工位**（4 个小凸台），
     中心加一根**螺杆**（`CylinderGeometry`）+ **压紧螺母**（六角柱 `CylinderGeometry(r,r,h,6)`）。
  2. **夹刀机构**：至少 2 颗**六角夹刀螺钉** + 一块**压板**（薄 box），落在刀杆正上方。
  3. **刀杆**：由纯直 box 改成**带台阶的矩形杆**（主体 box + 一段略细的 box 接刀头）。
  4. **刀片**：由 3 个正交 box 改成**有前角面与后角面的楔形**（2-3 个 box / 楔面即可），
     刀尖做一个**小斜切面**暗示 `R0.4` 倒圆。**不要用 `ExtrudeGeometry`**（顶点不可控，易与 shank 原点约定冲突）。
- **硬约束（三条，违反会造成真实 bug）**：
  1. **零新增 draw call** —— 全部并入现有两个 mesh（`turn_tool_body` **L377** / `turn_tool_shank` **L391**）。
     不得新增 mesh、材质、贴图。
  2. **`shank` 的「局部原点 = 刀尖、朝向 +z」约定不许动**（**L381** 注释）——
     `tool.position.set(xt, SPINDLE_Y, 0)`（**L555**）与 **L556-558** 的注释记录了 2026-09-21 那次
     「刀杆飞到 y≈5.9 高空」的事故，就是破这条约定造成的。
  3. **刀架不得侵入工件最大半径** —— 现有方刀台 `z = 0.19`、底面 `z ≥ 0.145`（**L371** 注释）。
     新增工位 / 螺钉**只许往 +z 或两侧长**，不许往工件方向（−z）长。
- **验收**：给出切刀**近景截帧**（机位 `CAM`（`pages/turn.js` **L135**）不动，
  可用 CDP `Page.captureScreenshot` 的 `clip+scale` 局部放大），
  肉眼须能辨认出「四工位方刀台 / 夹刀螺钉 / 刀片楔角」三样。

---

### 用户第 9 条 · 数字工牌（三项）

#### 9a. 让它能看出"这一局跟上一局不一样"

**根因（两处，都在代码里）：**
1. `pages/cast.js` **L473-474**：
   ```js
   rank: total >= (badge.castScore ?? 0) ? gradeOf(total) : badge.rank,
   castScore: Math.max(badge.castScore ?? 0, total),
   ```
   —— **只升不降**。所以玩多少次，看到的都是历史最好那一次。
2. 工牌**根本不记录"这局选了哪只砂箱、参数是多少"** —— 两次不同的浇铸会得到一模一样的一张卡。

**改法（用户已裁定：不做历史列表，只把"本局特征"补进这张卡）：**

**① `pages/cast.js` L462-484** 工牌写入改为**记录本局**：
- `rank`：**本局等级** = `gradeOf(total)`（去掉 `>=` 判断）
- `castScore`：**本局总分** = `total`（去掉 `Math.max`）
- **新增 `sandbox`**：本局砂箱序号（`state.selected`，`0–11` 整数）
- **新增 `casting`**：铸件名 —— ⚠️ **用 `box().castingInfo.name`**
  （`sandboxOf()` 的返回值带 `castingInfo`，`cast.js` **L283** 已在用这个口径）。
  **不要写 `CASTINGS[box().casting].name`** —— `cast.js` 没有 import `CASTINGS`，照字面写会 `ReferenceError`。
  实测值例：`sandbox_4` → `机床床身`；`sandbox_9` → `齿轮（塔轮）`。
- **新增 `params`**：`{ T: state.T, V: state.V, H: state.H }`（T 取整、V/H 保留 1 位小数）
- `name`：**已有则不覆盖**（保持现状 **L472** 的 `badge.name ?? ''` 写法）
- **删** **L475** `turnTime: badge.turnTime ?? null,`
- `no` / `unlocked`：**不变**

**② `pages/turn.js` L483-501** 工牌写入改为**记录本局车削特征**：
- **新增** `turn: { n, f, score, rank, collab }`
  （`n`/`f` 取 `st.lock`（**L415**）锁定的本局参数；`score` 取 `st.result.totalShown`；
  `rank` 取 `st.result.rank`；`collab` 取 `st.result.collab`）
- **删** `turnTime` 的整段写入与"只更新更好的那一局"逻辑（**L488-494**）
- **删 L488** 的 `fmtClock` 调用（它随之失去最后一个消费者 —— 见 8b 第 (4) 条）
- **保留**「尚未浇铸过 → 不创建工牌，仅保留本次车削记录」的降级（**L495-497**）
- **仍然只写 `im.badge` 一个键**，`no` / `name` / `castScore` / `unlocked` 一个都不动
- **L483 的段注释**与 **L7 文件头**里的旧纪律（「只更新 turnTime」）**必须一起改**
- ⚠️ **不加时间戳字段**（本轮明确不要 `at`）—— 避免引入唯一的不确定源，且左栏没有余量展示它。

**③ `pages/vault.js` `buildView()`（L82-104）**：
- **删 L97** `statTime`；**新增** `turnScore`（`badge.turn.score`，无则 `—`）
- **删 L101** `needTurn`（用时没了，它的语义随之消失）
- **新增** `sandboxLabel`（供海报）：如 `砂箱 04 · 机床床身`；缺数据则 `—`
- **新增** `fingerprint`（供右栏，见下）；完全没有数据则 `null`
- 缺字段一律 `—`：**不显示 `00:00`、不显示 `undefined`、不显示 `NaN`**
- ⚠️ **`showTime()`（L52）随之变死 → 一起删**（它的唯一消费者就是 L97）
- ⚠️ **L47-50 的本地 `fmtClock` 是既有死代码 → 一起删**（见 8b 第 (4) 条）

**④ `pages/vault.js` 藏品卡 `<dl class="vault__meta">`（L154-164）**：
- **L159** `<dt>车削用时</dt>` → **`<dt>车削评分</dt>`**
- 属性 **`data-time` → `data-turn`**（同步 **L225** 的 `els` 与 **L265** 的渲染）
  —— 语义变了就把名字改对，别留一个名叫 "time" 却显示评分的属性
- **三项数量与版式完全不变** —— 藏品卡只有 400×560，**不许加第四项**（会撑破左栏预算）

**⑤ `pages/vault.js` 右栏 `paintRight()`（L302-321）**：
- 在 **L184 `.vault__body` 之后、L185 `.vault__rule` 之前**加一行 12px 的**工艺指纹**（`.vault__fingerprint`）：
  ```
  砂箱 07 齿轮（塔轮） · 砂温 1405℃ · 浇速 13.5 kg/s · 湿度 4.2% · 主轴 620 r/min · 进刀 0.32 mm/r
  ```
  规则：缺哪一段就**省略哪一段**；全空则**整行不渲染**（不占高度）。
- **删 L315 的注释与 L317** 的 `<a class="vault__link" href="#/turn">去协作车削 →</a>`（`needTurn` 没了）
  ⚠️ **连带删 `styles/layout.css` L1281-1282 的 `.vault__link` 规则**（否则是孤儿 CSS）
- 空态文案（`BODY_EMPTY`，L306-307）**保留**

**⑥ `ui/poster.js` renderPoster**：
- **L103** `drawStat(ctx, cols[1], 1026, '车削用时', view.statTime);`
  → **`drawStat(ctx, cols[1], 1026, '车削评分', view.turnScore);`**
- 在「工种 · 等级」行（**L90**，`y=890`）下方加一行 24px 中文：`砂箱 04 · 机床床身`
  （取 `view.sandboxLabel`；无数据显示 `—`）。位置参考 **`y ≈ 918`**；
  **若与 940 分隔线（L96-97）碰撞**，允许下移到 940 分隔线之下靠右，但**不许动徽记（L83-84）与三值横排的 y**。
- ⚠️ **`drawEmblem` 完全不动**（它只吃 `unlocked`，`ui/emblem.js` 本轮零改动；海报与页面共用同一函数是 V3 的硬要求）。

**⑦ `pages/vault.js` 调试钩子 `__vault.state()`（L408-449）**：
- **L420** `statTime` → `turnScore`
- 新增字段（`casting` / `sandbox` / `turn` / `fingerprint` 原值）全部进 `state`，供验收脚本取证。

- ⚠️ **老数据兼容（硬要求）**：已有用户 localStorage 里的 `im.badge` **没有**新字段。
  必须**照常渲染、新字段显示 `—`、不抛错、不白屏**（沿用 `VAULT-SPEC §6.1` 的纪律）。
  `verify_vault.py` **L74** 也正是这么造种子的（但它的 **L185 键名断言要改**，见 §0.2 D）。

#### 9b. 加返回键（`#/vault` 现在没有任何返回 / 回首页入口）

- 已核：`pages/vault.js` **L129-205** 的骨架里**确实没有**返回控件
  （`VAULT-SPEC §1` 写的是"画稿如此：无顶栏、无 HUD"）。
- **改法**：在 `.vault` 左上角加一颗：
  ```html
  <button class="hud__back vault__back" type="button" data-go="">‹ 返回首页</button>
  ```
  复用 `.hud__back` 的既有样式（`styles/layout.css` **L134-141**；
  使用例：`hall.js` **L51** / `entrance.js` **L40**）。
- ⚠️ **`.hud__back` 本身没有任何定位**（只有字号 / 颜色 / 内边距 / 圆角 / 过渡）——
  它在别处是被 HUD 条（`layout.css` L128-133）托着的。`.vault__back` **必须自带定位**：
  - 用 **`position: fixed`** + 左上角坐标，与同页既有的 `.vault__storagetip`
    （`vault.js` L209 注释写「fixed 悬置，不挤占 878 预算」）**同一手法**。
  - ⚠️ **不要用 `absolute`**：`.vault`（`layout.css` **L1106-1112**）是 grid 且**未设 `position`**，
    `.page` 也未设 → 绝对定位会挂到初始包含块上，位置不可控。
- 点击走 `data-go` → `go('')`（首页），用 `page.addEventListener('click', …)` 委托
  （照 `home.js` **L145-150** 的写法，注意 `dispose()` 里对称移除）。
  `renderVault(root, { go, routes })`（**L116**）已经拿到了 `go`，无需改签名。
- ⚠️ **绝对不要因此给 `#/vault` 加整条顶栏** —— 左栏高度预算 878 / 900 就是当年去掉顶栏换来的。
- ⚠️ **返回键不参与 `.vault` 的两栏栅格**（不占高度 / 宽度预算），并且在 375 px 下**不得产生横向滚动**。

#### 9c. 「存下的东西不能点击查看」

> ⚠️ **这一条设计侧做了折中，按下面执行即可，有疑问不要自己改方向。**
>
> 现状：只存**一张**工牌（`im.badge` 单键），**没有"各个工牌"可点**。用户已裁定不做历史档案列表，
> 所以"可点击查看"落到**唯一有意义的两个落点** —— 这也是"存下来的东西"的真实所指：

- **馆藏图鉴 12 格**（模板在 `pages/vault.js` **L277-281**，由 `SANDBOXES.map` 生成）：
  现在是**死元素**（有 `title`、不可点、不进 Tab 序）。
  ⚠️ **不要直接把 `<li class="vault__cell">` 换成 `<button>`** —— `.vault__cell` 的样式挂在 `<li>` 上
  （`layout.css` L1295 的 `aspect-ratio` 等），换标签会破坏图鉴带的栅格。
  **正确做法：保留 `<li class="vault__cell">`，把它的内容包进一个 `<button class="vault__cell-btn">`**（去掉 `<li>` 上的 `title`，移到按钮上）。
  点击**就地展开一行**馆藏说明（用 `SANDBOXES[i].collection`，来自 `scoring/casting-data.js`），
  再点收起（`aria-expanded` 同步）。**未解锁格**点击给一行「完成一次浇铸可解锁」，**不跳页、不弹模态**。
- **4 张衍生卡**（**L187-195**，模板 L188-194）：同样可点，展开一行"怎么拿到它"
  （锁定态用 `DERIVS[i].need`，如「需要解锁 3 件馆藏」）。同样**保留 `<li>` 外壳、内嵌按钮**。
- ⚠️ 展开内容**只能用已有数据**（`SANDBOXES` / `DERIVS`），**不得新编馆藏文案**。
- ⚠️ 展开**不得撑破左栏 878 预算** —— 用同一行的就地小字，**不要做成卡中卡**。
  左栏确实装不下时，允许把说明行做成**覆盖在图鉴带下方的一行绝对定位文字**，但**不许改栅格高度**。

---

## 2. ⚠️ 连带失效清单（提示词驱动的删除，最容易漏这一节）

**删一个功能 ≠ 只删提示词点名的那些行。** 下面五类必须一起扫：

**(1) 文件头 / 注释里的旧纪律（会变成假话）**
- `pages/turn.js` **L1-9** 整段：L5「计时起点 = 第一次调整参数…终点 = 车削动画结束」· L6「组内最佳写 `im.turn.best`」·
  L7「工牌只在 `im.badge` 已存在时只更新 `turnTime`」 —— 三条全部随本轮作废，**重写**。
- `pages/vault.js` **L13** ⑦「`turnTime` 为 null 时显示 `—`，**不显示 00:00**」→ 语义换成 `turnScore` 口径。
- `scoring/turning.js` **L57-59** JSDoc 的 `subs:{…,time}` 与「t 本局用时 s」→ 改写。
- `scoring/turning.js` **L158 / L134-144** 的 JSDoc 随 `fmtClock` / `boardRows` 一起删。
- `scoring/turning-data.js` **L9-13 / L63** 注释（点名的两处「76 分 / 不入榜 / 用时口径不公」）→ 改写。

**(2) CSS 孤儿（三种都要扫，`layout.css` 历史上一轮漏过两处）**
① `@media` 内的**同名规则**（`.turn__clock-value` 就在 **L1079**，最容易漏）
② **孤儿注释**（规则删了只剩注释 + `}`）③ `@media` **空壳块**。
工具：`.workbuddy/scan_orphan_comments.py`。本轮涉及的规则：
`.turn__board*`(L1050-1065) · `.turn__clock*`(L988-991 + L1079) · `.vault__link`(L1281-1282)。

**(3) 死函数 / 死 import**
- `turning.js` **`fmtClock`（L158-163）** → 全仓零消费者（已核），连自测 L300-304 一起删。
- `vault.js` **`showTime`（L52）** → 单调 L97，删。
- `vault.js` **本地 `fmtClock`（L47-50）** → **本来就是死代码**，删。
- `turn.js` 的 import 逐个核：`T_REF` / `RECORD_TIME` / `fmtClock` / `boardRows` / `RIVALS` / `BOARD_ME` / `BOARD_FOOTNOTE` / `K_TURN_BEST` 全删；
  `MODE_BADGE` / `K_BADGE` / `COLLAB` / `TIMING` / `DURATION_MS` / `VIS` 保留。
- `turning.js` 的 import：删 `T_REF` / `RIVALS` / `BOARD_ME`；保留 `TIMING` / `DURATION_MS`。

**(4) 门禁 / 验收 / 开发脚本（见 §0.2 D 的表）**
`verify_turn.py`（18 处）· `verify_vault.py`（6 处，含 **L185 键名硬断言**）· `verify_ux.py`（L429）·
`save_poster.py`（L62）· `turn_detail.py`（L23-25 / L31-33）。
**改完再跑，跑绿才算不回归。**

**(5) 核查副产品（本轮**记录但不改**，避免"顺手优化"）**
- `scoring/turning-data.js` **L110** `REC_HINT` —— 代码里零消费者，`turn.js` L72 把同一句话写死在模板里。**本轮不动。**
- 设计侧的旧核查脚本 `.workbuddy/check_ux_prompt.py` / `check_ux_revision_refs.py` 里
  `layout.css:1204/1219` 的行号断言**已随上轮删 CSS 失效** —— 它们是我的开发工具，你们不用管，
  但**别把它们当门禁来跑**。

---

## 3. 解冻与冻结

### 3.1 本轮解冻（改哪个文件 / 为什么必须改 / 对应哪条旧条款）

| 文件 | 为什么必须改 | 被本文件覆盖的旧条款 |
|---|---|---|
| `js/pages/turn.js` | 8a 删榜 · 8b 删用时 · 9a 写工牌 | `TURN-SPEC §3.2`（用时口径）· `§3.7`（协作榜）· `§6`（组内最佳） |
| `js/scoring/turning.js` | 8a 删 `boardRows` · 8b 两维权重与自测 | `TURN-SPEC §3.7` · `§4.1`（权重 45/35/20）· `§8 U3` 的用时项 |
| `js/scoring/turning-data.js` | 8a 删榜数据 · 8b 删 `T_REF` / 改权重 | `TURN-SPEC §3.7` · `§4.1` |
| `js/scene/turn-scene.js` | 8c 刀具细化 | `TURN-SPEC §3.3`（视觉映射）不覆盖，仅细化建模 |
| `js/pages/vault.js` | 9a 字段 · 9b 返回键 · 9c 可点 | `VAULT-SPEC §1`（无顶栏/无 HUD —— **返回键是唯一例外**）· `§9`（`turnTime` 口径） |
| `js/pages/cast.js` | 9a 工牌改记本局 | `VAULT-SPEC §6.2`（工牌写入） |
| `js/ui/poster.js` | 9a 三值横排中值 · 加砂箱行 | `VAULT-SPEC §8`（海报三值横排） |
| `js/styles/layout.css` | 8a/8b 删规则 · 9b 加 `.vault__back` | `SCENE-LAYOUT-FIX-SPEC §10.10`（版式冻结，本轮按上表解冻） |

### 3.2 仍然冻结（不许碰）

- `styles/tokens.css` —— 配色 / 字号 / 间距 token **一个不动**
- `js/router.js` · `js/venues.js` · `js/main.js` —— 路由与场馆导航机制不动（本轮**不新增路由**）
- `js/pages/entrance.js` · `history.js` · `hall.js` · `home.js` · `about.js` —— **本轮零改动**
- `js/scene/entrance-scene.js` · `workshop.js` · `environment.js` · `textures.js` ·
  `cast-scene.js` · `props/*` —— 三维场景除 `turn-scene.js` 外全部冻结
- `js/scoring/casting.js` · `casting-data.js` —— **浇铸评分与数据一字不动**
- `js/ui/emblem.js` —— 徽记绘制不动（海报与页面共用，V3 硬要求）
- `design/*` —— 设计稿是基准，**本轮不改图**，改动由本文件描述
- `#/vault` 的两栏栅格与左栏 878 预算结构

> **解冻的代价**：§4 的五组门禁**全部重跑**，读数写进交付物。

---

## 4. 验收（K 组，实现方逐条自证并附读数）

**车削 · 删榜**
- **K1** `#/turn` 无 `.turn__board*` 任何节点；源码 grep `boardRows` / `RIVALS` / `BOARD_ME` /
  `RECORD_TIME` / `BOARD_FOOTNOTE` / `K_TURN_BEST` / `inBoard` / `boardMin` **零残留**
- **K2** `resetRun()`（点「再车一只」）后**不抛错**、榜区不复活（L440 那个漏点）
- **K3** 老 `localStorage.im.turn.best` 残留时不影响任何行为

**车削 · 删用时**
- **K4** `#/turn` 无 `.turn__clock*` / `[data-clock]` / `[data-target]` 节点；
  源码里 `elapsedSec` / `refreshClock` / `fmtClock` / `T_REF` / `subs.time` / `WEIGHTS.time` **零残留**
  （`FALLBACK.t` / `forceSettle` / `params.t` / `st.epoch` 除外）
- **K5** `selfTest()` **全绿**；附**「旧期望 → 新期望」逐条对照表**
- **K6** 「一个滑杆都不动、直接点开始」这一局的**实测总分与等级**（预期 **69 / 铸造工 · 学徒**）
- **K7** 规则面板只剩 **3 条**，权重数字与 `WEIGHTS` 实读一致（**56% / 44%**）
- **K8** **回放仍可用**：点「回放本局」双折线出现、游标推进到底后按钮恢复可用；
  `__turn.replayFrame(t)` 同一 t 连取两次**逐位一致**（§3.8 未回归）
- **K9** **协作积分仍在**：`__turn.state().result.collab` 有值，且与改前同一组输入下**数值不变**
  （③ 与纪元无关的证明）
- **K10** **设备保护仍在**：`TIMING.forceSettle` 生效路径未坏（可用 `__turn.drive()` 走一次）
- **K11** `layout.css` **无 `.turn__clock*` 残留**、无孤儿注释、`@media` 无空壳
  （跑 `scan_orphan_comments.py`，报 0）

**车削 · 刀具**
- **K12** 切刀**近景截帧**能辨认「四工位方刀台 / 夹刀螺钉 / 刀片楔角」；
  `turn_tool_body` + `turn_tool_shank` **仍是 2 个 mesh**（零新增 draw call）

**工牌**
- **K13** 体积：gzip 实测 **≤ 215 KB 且 < 198.57 KB**，给出改前 / 改后数字
  （裁定 R2：以第 8 条完成后为准）
- **K14** 连浇两炉**不同砂箱** → `#/vault` 两次显示明显不同（铸件 / 砂箱号 / 评分 / 工艺指纹），
  且**不是**"只升不降"的历史最好值（给两局各一张截图）
- **K15** `#/vault` 左上角有返回键 → `#/`；`.vault` 两栏栅格不变（实测 `left_bottom ≤ 900`）；375 px 无横向滚动
- **K16** 图鉴 12 格与 4 张衍生卡**可点开 / 收起**（键盘 Tab 可达、`aria-expanded` 同步），展开不撑破左栏预算
- **K17** 老数据兼容：手工把 `im.badge` 改成只有 `{ no:'000001' }` → **不抛错、不白屏**，新字段全部 `—`
- **K18** 海报：中值是「车削评分」，下方多一行「砂箱 04 · 机床床身」；徽记与 `emblem.js` **未改动**

**回归**
- **K19** 五组门禁全绿：cast 45/45 · hall 61/61 · entrance 22/22 · turn（改后条数如实报）· vault（改后条数如实报）
- **K20** 四页 console 零 error；1440×900 与 375 px 无横向滚动

---

## 5. 不要做的事

1. **不要重做第 1–7 条** —— 已验收。本轮只看第 8、9 条。
2. **不要把 ②③④ 三样时钟删掉**（回放 / 双折线 / 协作分 / 设备保护）—— 见 8b 的口径表。
   若你认为"用时概念"仍有残留，**在自述里列出来等我裁定**，不要自行扩大删除范围。
3. **不要为了让分数 / 自测好看而改评分系数或等级阈值** —— 按引擎实际输出写回期望值，把后果如实报告。
4. **不要把「用时」以任何形式重新引入界面** —— 秒数、进度条、快慢评价、名次、奖励，都不许。
5. **不要给 `#/vault` 加整条顶栏** —— 返回键用 `fixed` 定位的 `.hud__back`。
6. **不要给 `#/turn` 重新加排名类元素**（"最快一局""效率分"等都不行）。
7. **不要新增贴图**，**不要动 `tokens.css`**，**不要动 `ui/emblem.js`**。
8. **不要把图鉴格 / 衍生卡的外层 `<li>` 换成 `<button>`** —— 会破坏栅格（见 9c）。
9. **不要顺手"优化"没被点名的东西** —— 本轮之外的一切改动，先在自述里列为「偏离」再等确认。
   （§2 (5) 那两条核查副产品就是**明确不动**的例子。）
10. **不要改 `#/cast` 的评分与解锁规则**（`casting.js` / `casting-data.js` 冻结）。

---

## 6. 交付要求

1. **`spec/IMPLEMENTATION-UX-REVISION-P2.md` 自述报告**，逐条对 **K1–K20** 给出「通过 / 不通过 + 实测读数」，并单列：
   - **偏离与待裁定清单**（不要自己压下来）
   - **「旧期望 → 新期望」评分对照表**
   - **"不动手"基线分数变化**
   - **gzip 改前 / 改后**
   - **本轮哪些 `*-SPEC.md` 条款随之失效**（设计侧验收后统一加过期抬头，你不用改规格文件）
2. **改动前后对照截图（1440×900）**：
   - `#/turn` 面板全貌（无榜、无时钟、规则面板展开）
   - 切刀**近景**
   - `#/vault` **两局对比**（不同砂箱）+ 返回键特写 + 375 px 一帧
   - 图鉴格 / 衍生卡**展开态**各一张
   - 海报（含新增的砂箱行）
3. **门禁读数表**（五组，改前 / 改后）+ **体积读数**。
4. 报告里凡引用的行号，**必须回代码核过**再写（本文件的行号也可能已漂移）。

---

## 7. 环境提醒（本项目踩过的坑）

- **构建**：`node node_modules\vite\bin\vite.js build`（cwd = `demo/`），**不要用 `npm.ps1`**。
- ⚠️ **构建 / 验收链路一律不要用管道** —— 精简 shell 里 `tail` 不存在，
  管道命令会**假失败并静默中断**，dist 停在旧产物、验收全跑在旧代码上。
- **截图走 CDP**（`tools/screenshot.py` / `.workbuddy/cdp_shot.py`），Edge 的 `--screenshot` **静默失败**。
- **Vite preview 的 sirv 会缓存 manifest** —— 重建后可能仍服务旧 bundle；
  `TaskStop` 旧 preview → 重启（`--strictPort`）→ 校验 `index.html` 引用的 bundle 名已换。
- 验收脚本**先跳 `about:blank` 再导航**（同 URL 导航不重挂，断言会读到旧值）；
  `?debug=1` **必须写在 hash 之前**（`/?debug=1#/vault`）。
- ⚠️ **改了状态要立刻读 DOM 的断言，必须先让出帧** —— `scroll` 等事件是**异步派发**的，
  `scrollTo()` 后同步读会拿到旧值。**`await` 两帧 `rAF` 再读。**
- **自测脚本必须无代理跑**（沙箱代理拦 loopback 返回 502 ≠ 服务死了）。
- **同一文件的多个改动逐条串行做，每条改完复核** —— 并行会部分丢失。

---

*设计侧同批交付：本文件即本轮唯一依据。旧条款的正式改写（`TURN-SPEC` / `VAULT-SPEC` / `SCENE-LAYOUT-FIX-SPEC`）在实现验收通过后由设计侧统一同步，实现方不必改规格文件。*
*上一轮的 `spec/PROMPT-UX-REVISION.md` 已整份移入 `archive/spec/`（第 1–7 条已实现、第 8、9 条已抽入本文件）。*
