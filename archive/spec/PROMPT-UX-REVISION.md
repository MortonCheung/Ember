> ⛔ **【已归档 · 2026-09-23 · 不要发送本文件】**
> 本文件的第 1–7 条已实现并验收（J 组 37/37，自述 `spec/IMPLEMENTATION-UX-REVISION.md`）；
> 第 8、9 条已抽成独立交接稿 → **要做第 8、9 条，发 `spec/PROMPT-UX-REVISION-P2.md`**。
> ⚠️ 本文件第 8、9 条里有 **9 处错误 + 6 处遗漏**（行号漂移 / 漏掉的调用点 / 会变死的函数 / 会失效的门禁脚本），
> 已有修正见 P2 §0.2 的差异表 —— **照本文件执行会做错**。
> 本文件按「移动整文件、内容一字不改」的规矩归档，**正文保留原样**，仅加本条抬头。

---

# 交接提示词 · 体验修订 R1（用户逐条 9 项）

> **用法**：把下面 `---` 之间的全文复制给代码工作流。
> **状态（当时）：⚠️ 第 1–7 条已实现（⛔ 不要再发整份）；第 8、9 条尚未实现 —— 下一轮只发 §1 的第 8、9 两条。**
> 📌 后况：该状态已由 2026-09-23 的 P2 取代，见文件顶部抬头。
> 2026-09-22 出稿 · 当晚第 1–7 条实现并验收通过
> （**J 组 37/37 PASS**，自述：`spec/IMPLEMENTATION-UX-REVISION.md`）。
> **逐条状态**：第 1 ✅ · 第 2 ✅ · 第 3 ✅ · 第 4 ✅ · 第 5 ✅ · 第 6 ✅ · 第 7 ✅（含一处必要偏离，见自述 §3.3）·
> **第 8 ⏳ 未做** · **第 9 ⏳ 未做**。`#/about`（§2）与首页时间轴（§3）**已建成**。
>
> ⚠️ **发第 8 条前必读**（自述 §7 末段）：`TIMING.forceSettle` / `DURATION_MS` / `st.rec.t`
> 与「用时」**强绑定** —— 可删的是**显示**与**评分项**，**计时机构不能整块删**，否则回放会跟着坏。
> ⚠️ **`J23`（体积）判据存在矛盾**：它要求「≤215 KB **且 <198.57 KB**」，
> 但 §1 第 2/3 条要求新增一整页内容 —— 实测 206.96 kB（+8.40）。详见自述 §3.1，**待裁定**。
> **本文件仍是第 8、9 条的唯一依据**（它覆盖的旧条款清单见「§5 解冻与覆盖」）。
> 冲突优先级：**本文件 > 各 `*-SPEC.md` 的既有条款 > 画稿 > 代码现状**。
> 画稿基准：`design/S01-首页.png` / `S02-虚拟展厅.png` / `S04-协作车削.png` / `S05-数字工牌.png`
> （**本轮不改设计稿**；凡是画稿与本文件冲突处，一律以本文件为准，并在自述里列出冲突点）。
> 环境提醒见文末 §8。

---

# 交接：体验修订 R1

## 0. 你是谁，现在做到哪了

你是本作品（中国工业博物馆 Web 数字展厅 · 主题「炉火不灭」）的**代码实现方**。设计侧已交付全部规格与提示词，你负责实现并交付自述报告。

**当前状态（2026-09-22）**：四层体验骨架**七页全部上线**，全部验收通过。

| 路由 | 页面 | 状态 |
|---|---|---|
| `/` | 首页（对应 S01） | 已上线 |
| `#/entrance` | 序厅（三维单件场景） | 已上线 |
| `#/history` | 通史馆（2D 长卷） | 已上线 |
| `#/hall` | 铸造馆（全屏车间 + 热点） | 已上线 |
| `#/cast` | 亲手浇铸（五步交互 + 评分） | 已上线 |
| `#/turn` | 协作车削（U 组通过） | 已上线 |
| `#/vault` | 数字工牌（V 组 31/31） | 已上线 |

`main.js` 的 `PAGES` / `TITLES` 各 **7 键**；`home.js` 的 `NAV` **6 项**。
> 📌 **后况（2026-09-22 晚，第 1–7 条实现后）**：`PAGES` / `TITLES` 已变 **8 键**（第 2 条新增 `about`）；
> `NAV` **仍 6 项**（第 2 条只把「关于项目」的 route 从 `''` 改成 `about`，没增项）。
> 上表七页之外多了 **`#/about` 关于项目**一页。
**本轮不是新功能，是用户亲自提出的 9 条体验修订** —— 性质是「删多余、补缺口」。
预期结果是**净删多于净增**（体积应当**下降**）。

**一句话概括这 9 条**：入口链修正（首页 → 序厅 → 铸造馆 → 浇铸）、首页去掉两个没用的块并换掉一个做不出来的块、浇铸液面跟着桶倾、车削删掉排名与用时并把刀做细、工牌让它能看出"这一局跟上一局不一样"。

---

## 1. 这一轮做什么（逐条，含精确位置）

> 下面每一条都标了 **文件 + 行号 + 现状原文**。行号是 2026-09-22 出稿时实测的，
> 若你读到时代码已漂移，**以"现状原文"为准**。

### 用户第 1 条 · 删掉首页顶栏右上角的「进入虚拟展厅」按钮

- **文件**：`demo/src/js/pages/home.js`
- **L49**，现状原文：
  ```html
  <button class="btn btn--primary" type="button" data-go="hall">进入虚拟展厅</button>
  ```
  **整行删除。**
- ⚠️ **L48 的 `<div class="topbar__spacer"></div>` 必须保留** —— 顶栏是「logo + nav + spacer + 按钮」四段式，
  spacer 负责把右侧内容顶开。删掉它会让 nav 药丸贴死在 logo 上。
  `layout.css` **L70** `.topbar__spacer { flex: 1 1 auto; }` 不动（`#/turn` 顶栏 L63 也在用）。

### 用户第 2 条 · 「了解项目」按钮是死的，要真能用

- **现状**：`home.js` **L65** 的 `<button class="btn btn--ghost" type="button">了解项目</button>`
  **既没有 `data-go`，也没有任何监听** —— 点了完全没反应。同理 `NAV` 里的「关于项目」（**L22**，`route: ''`）
  点下去也只是回到首页。
- **改法**（用户已裁定：**另开独立页**）：
  1. L65 加 `data-go="about"`；
  2. L22 `{ label: '关于项目', route: '' }` → `{ label: '关于项目', route: 'about' }`；
  3. `main.js`：**L11-12 附近**加 `import { renderAbout } from './pages/about.js';`，
     **L17-25** 的 `PAGES` 加 `about: renderAbout`，**L27-35** 的 `TITLES` 加
     `about: '关于项目 · 中国工业博物馆数字展馆'`；
  4. 新建 `demo/src/js/pages/about.js`（内容规格见 §2）。
- ⚠️ nav 第 5 项「数字藏品」（**L21**，`route: ''`）**也是死的，但本轮不动** —— 见 §7 第 7 条。

### 用户第 3 条 · 滚动驱动视频时间轴，换一种做法（素材来不及收）

- **要换掉的东西**：
  - `home.js` **L69-91**：`<figure class="flyover">` 整块（含 L73-74 两个 chip、L76 进度线、L78-88 舞台与三章节）
  - `home.js` **L90**：`<p class="flyover__caption">`
  - `layout.css` **L103-208**：`.flyover` 及其全部子规则（`.flyover__top` / `__chips` / `__track` / `__fill` /
    `__stage` / `__video` / `__chapter*`）
- ⚠️ **L73-74 那两个 chip 写着「滚动驱动 · 视频时间轴」「24 段预渲染链」** —— 随整块一起删。
  改完后**全仓 grep 不到「预渲染」「视频时间轴」**（验收 J8）。
- ⚠️ **连带后果（必须处理）**：`.flyover` 用 `--flyover-progress` 驱动章节高亮（`home.js` L119-124），
  而这个进度是**整页滚动比例**（L126-135）。这块一删，首页就只剩 hero 一屏，
  `scrollHeight ≈ innerHeight` → 进度几乎恒为 0。**新版时间轴必须自己撑起滚动行程**（见 §3）。

### 用户第 4 条 · 底部「章节预告」没用，删掉

- **文件**：`home.js` **L94-105** `<section class="flyover-recipes">` 整段删除。
- **同时必须删掉的 JS**（留着会抛错 / 变成死代码）：
  - **L116** `const recipes = [...page.querySelectorAll('[data-recipe]')];`
  - **L123** `recipes.forEach((el, i) => el.classList.toggle('is-active', i === active));`
- **同时必须删掉的 CSS**：`layout.css` **L211-245** `.flyover-recipes*` 全部。
  **L246-250 `.flyover__caption` 也一起删**（它的宿主 L90 已删）。
- ⚠️ **`.flyover-recipes` 不只是"预告"，它同时是"给飞越提供滚动行程"的那一段**（`layout.css` L210 原生注释就是这么写的）。
  删掉后滚动空间归零 —— 这正是 §3 里新版时间轴必须自带 `300vh` 行程的原因。

### 用户第 5 条 · 两个入口都要先进序厅，不是铸造馆

- **`home.js` L64**：hero 主按钮 `data-go="hall"` → **`data-go="entrance"`**
- **`home.js` L18**：`{ label: '虚拟展厅', route: 'hall' }` → **`route: 'entrance'`**
  （这就是用户说的"上边的虚拟展厅按钮" —— 顶栏那颗按钮已被第 1 条删掉，剩下的就是 nav 药丸）
- ⚠️ **`entrance.js` L64 的「进入铸造馆 →」（`data-go="hall"`）不要动** —— 它正是进场链的第二跳。
  改完后链路是：**首页 →（序厅）→ 铸造馆 →（热点）→ 浇铸互动**。
- ⚠️ `NAV` 第 3 项「互动体验」→ `cast` 保持不动。

### 用户第 6 条 · 铸造馆三个热点标签，一律先去浇铸互动

- **文件**：`demo/src/js/pages/hall.js`
- **现状**：三个热点药丸（冲天炉 / 砂箱 / 车床）里，**车床那一个被特殊对待**：
  - **L17-18**：
    ```js
    const CTA_CAST = { label: '进入浇铸互动', go: 'cast' };
    const CTA_TURN = { label: '进入协作车削', go: null, notice: '「协作车削」模块尚未开放 · 敬请期待' };
    ```
  - **L35-39** `lathe` 条目里 `cta: CTA_TURN`
  - **L139** `const cta = info.cta ?? CTA_CAST;` → 车床走了 `go: null` 的分支
  - **L144-150** 把按钮改成"只弹提示条"的 `data-cta-notice`
  - **L241-243** `onClick` 里处理 `data-cta-notice` → `showNotice(...)`
- ⚠️ 那句提示 **「「协作车削」模块尚未开放」现在是过期谎言** —— 车削早在 2026-09-22 就上线了。
- **改法（用户已裁定：三个都去 `#/cast`）**：
  1. **删 L18** `CTA_TURN` 整条常量（已无消费者）；
  2. **删 L38** `lathe` 里的 `cta: CTA_TURN,` → 车床自动回落到缺省 `CTA_CAST`；
  3. **L139-150** 简化：按钮文案固定 `CTA_CAST.label`、`dataset.go = 'cast'`，
     **删掉 `data-cta-notice` 那条分支**（生产者已不存在）；
  4. **L241-243** `onClick` 里删掉 `pending` 那段；
  5. **L14-16** 的注释（"上线时只需把 CTA_TURN.go 改成 'turn'"）一并清理 —— 这个方案已作废。
- ⚠️ **`lathe` 的正文（L36-37，C620-1 史实）保留**，只换按钮行为。
- ⚠️ **不要给 `#/turn` 加锁、不要加"未解锁"拦截**（见 §7 第 1 条）。
  车削唯一正门仍是从 `#/cast` 结算页的「去协作车削」按钮（`cast.js` **L114** / **L260** 解锁 / **L486-487** 跳转）；
  直接输 URL 进 `#/turn` 也照常可玩，不拦。

### 用户第 7 条 · 铁桶倾斜时，桶里那块发光的铁水液面要一起同速倾斜

- **文件**：`demo/src/js/scene/cast-scene.js`
- **L716-726**，现状原文：
  ```js
  function setLadlePose(x, y, z, tilt = null) {
    ladle.group.position.set(x, y, z);
    if (tilt !== null) {
      ladle.pot.rotation.x = tilt;
      ladle.gantry.rotation.x = -tilt;  // 行车保持水平
      // 熔面保持水平（反向抵消倾转）+ 随倾倒收缩（只缩 x/z —— y 向缩会绕吊轴漂移）
      ladle.melt.rotation.x = -tilt;
      const ms = 1 - 0.55 * (tilt / TILT);
      ladle.melt.scale.set(ms, 1, ms);
    }
  }
  ```
- **根因**：`melt` 是 `pot` 的子对象（**L295** `pot.add(melt)`），`pot.rotation.x = tilt` 已经带着它转了；
  代码又在**反向抵消**（`melt.rotation.x = -tilt`）把它掰回水平，还额外缩到 45%。
  视觉上就是"液面不跟桶走"。
- **改法**：**删掉 L721-724 那四行 + 注释**（`ladle.melt.rotation.x = -tilt;` / `ms` 计算 / `ladle.melt.scale.set(...)`）。
  删完 `melt` 就与 `pot` 刚性同转 —— 这正是用户要的"同速倾斜"。
  **不要新增任何旋转/缩放补偿。**
- **连带清理**：**L741-746** `resetLadle()` 里的 **L743-744**
  （`ladle.melt.scale.setScalar(1);` / `ladle.melt.rotation.x = 0;`）随之删除（已无副作用，留着是死代码）。
- ⚠️ **L850 / L861 的待机微摆保留**（`ladle.melt.rotation.x = ±2.5°/3° × sin(t·0.02)`）——
  那时 `tilt = 0`，它只是让液面有一点活气，与本次改动不冲突。
- ⚠️ 不要动 `TILT`（**L39**，`52°`）与 `TIP_LOCAL`（**L54**）—— 浇嘴定位与 `hoverXZ()` 依赖它们。
- ⚠️ 不要动 `gantry.rotation.x = -tilt`（**L720**）—— 行车保持水平是对的。

### 用户第 8 条 · 协作车削三处：删排名 / 删用时 / 刀做细

#### 8a. 删掉右下角的排名榜

**要删的东西（三个文件 + 样式）：**

| 文件 | 行号 | 内容 |
|---|---|---|
| `pages/turn.js` | **L122-123** | `<div class="turn__board" data-board></div>` + `<p class="turn__board-foot">` |
| `pages/turn.js` | **L13-15** import | `RIVALS` / `BOARD_ME` / `RECORD_TIME` / `BOARD_FOOTNOTE` / `K_TURN_BEST` |
| `pages/turn.js` | **L275-312** | `renderBoard()` + `renderBoardInitial()` |
| `pages/turn.js` | **L375** | 结算里的 `renderBoard(r);` |
| `pages/turn.js` | **L504** | 启动里的 `renderBoardInitial();` |
| `pages/turn.js` | **L385-389** | §6 组内最佳写 `im.turn.best`（`K_TURN_BEST`） |
| `pages/turn.js` | **L178** | `st` 里的 `best: store.get(K_TURN_BEST, null),` |
| `pages/turn.js` | **L392** | 结算文案「未达入榜门槛……本局不入榜。」 |
| `pages/turn.js` | **L527-532** | 调试钩子 `state()` 里的 `board: [...]` 段 |
| `scoring/turning.js` | **L13** import | `RIVALS` / `BOARD_ME` |
| `scoring/turning.js` | **L145-156** | `const BENCH` + `export function boardRows()` |
| `scoring/turning.js` | **L112** / **L126** | `inBoard` 的计算与返回值字段 |
| `scoring/turning.js` | **L108-109** 注释 | 入榜门槛注释段 |
| `scoring/turning-data.js` | **L86-87** | `TIMING.boardMinTime` / `boardMinScore` |
| `scoring/turning-data.js` | **L92-96** | `RIVALS` / `BOARD_ME` |
| `scoring/turning-data.js` | **L97-100** | `RECORD_TIME` / `BOARD_FOOTNOTE` |
| `scoring/turning-data.js` | **L106** | `K_TURN_BEST` |
| `styles/layout.css` | **L1204-1219** | `.turn__board*` 全部规则 |
| `scoring/turning.js` | selfTest | `§3.7 排行榜三组` 那 4 条断言（**L285-298**） |

**保留**：`total` / `totalShown` / `collab` / `rank` / `fired` / `mainRule` / `params` / `forcedSettle`。
`MODE_BADGE`（顶栏「双人协作模式 · 同屏操作」徽标）**保留**。

> ⚠️ 老用户 localStorage 里可能残留 `im.turn.best` —— **不要去清**（无消费者即无害），也不要在代码里读它。

#### 8b. 「本局用时」彻底移除（**连评分一起去掉** —— 用户已裁定）

**界面部分（`pages/turn.js`）：**
- **L99-104** `.turn__clock` 整块删除：`本局用时` 标签 / `[data-clock]` 读数 /
  `[data-target]`「历史纪录 00:50 · 组内最佳 —」。
- `els.clock` / `els.target` 的引用（**L~176-190 的 `els` 对象**）删；
  `refreshClock()`（**L~193-199**，含写 `els.target.textContent` 那段）整个删；
  所有 `refreshClock()` 调用点删（**L212** ticker 内、**L268** 滑杆、**L395** 结算、**L423** go()、**L505** 启动）。
- **L372** 结算里的 `els.clock.textContent = fmtClock(r.params.t);` 删。
- `fmtClock` 的 import（**L18**）与 `RECORD_TIME`（**L15**）同步删。
- ⚠️ **`[data-trace]` 双折线（转速 / 进刀量轨迹）不要删！** 它是"过程"的可视化，不是用时。
  但它的宿主是 `.turn__clock`（**L103**），块删了它会一起没 —— 所以要把
  **L103 `<div class="turn__trace" data-trace hidden></div>` 移出**，成为 `.turn__panel` 的直接子元素，
  放在原 L121（`.turn__rules`）之后、原 L122 榜之前的位置。
  `renderTrace()`（**L315 起**）本身**不动** —— 它的 x 轴用的是回放时间，语义仍成立。
- ⚠️ **`prefers-reduced-motion`（L37-38）与 `DURATION_MS` 的用法不变。**

**评分部分（`scoring/turning-data.js` / `scoring/turning.js`）：**
- `turning-data.js` **L51**：
  `WEIGHTS = { surface: 0.45, size: 0.35, time: 0.20 }`
  → **`WEIGHTS = { surface: 0.5625, size: 0.4375 }`**
  （**把原 45 : 35 归一化到 100，不改两维之间的相对权重** —— 不许"顺手"重配成 50/50 或 60/40）
- `turning-data.js` **L48** `T_REF` **删**；**L54** `SUB_LABELS.time` **删**。
- `turning-data.js` **L20** `FALLBACK = { n, f, t: 600 }` 里的 **`t` 保留** ——
  它是引擎入口的健壮性回落（非法 t → 600），**不是评分项**。
- `turning.js` **L87** `subs.time` **删**；**L91-92** 总分公式改成两维
  `WEIGHTS.surface * subs.surface + WEIGHTS.size * subs.size`。
- `turning.js` **L64-69** 的 `t` 解析与钳制（`FALLBACK.t` / `TIMING.forceSettle`）**保留**；
  `forcedSettle`（**L111**）**保留** —— 那是展厅设备保护（长占机），与成绩无关。
- `scoring/turning.js` import（**L12**）删 `T_REF`；`TIMING` 保留（`forceSettle` / `sampleMs` 还在用）。
- `pages/turn.js` **L43-53** `RULES_TEXT`：
  - 删第 3 条（`用时（权重 …%）：${T_REF} s …`，**L48-49**）；
  - 删第 5 条（`入榜门槛：…`，**L52**）；
  - 第 1、2 条的权重数字**从 `WEIGHTS` 实读**，改后应是 **56% / 44%**，不要写死旧文本。

**⚠️ 黄金值必须重算（这是本轮最容易做错的一处）：**
`scoring/turning.js` 的 `selfTest()` 里有一批以旧权重算出的期望值。新权重下的新值：

| 算例 | 输入 | 子项 | 旧总分 | **新总分** |
|---|---|---|---|---|
| U3① | `n=420, f=0.52` | surface 45.6 / size 100 | 76 | **69** |
| U3② | `n=660, f=0.30` | 100 / 100 | 100 | **100** |
| U3③ | `n=660, f=0.30` | 100 / 100 | 91 | **100**（与②同参数，仅在用时上不同 → 用时删掉后两者必然相同） |
| U3④ | `n=1200, f=0.80` | surface 25 / size 65 | 36 | **43** |
| 边界 | `n=550, f=0.30` | 96.5 / 100 | — | **98** |
| 边界 | `n=200, f=0.40` | 60 / 100 | — | **78** |

> U3③ 与 U3② 在删掉用时后**输入等价**（都只差 `t`），两条断言会给出同一个总分 —— 这不是 bug，
> 是"用时不再参与评分"的必然结果。**保留两条，把期望值都写成实际输出，并在注释里说明原因。**

- ⚠️ **纪律：按引擎实际输出逐位写回期望值，并在报告里给出「旧期望 → 新期望」逐条对照表。**
  **绝不许为了让自测变绿而反改引擎系数或阈值**（那正是本项目最忌的"设计跟着数值走"）。
- ⚠️ **必须在报告里实测并写明这条后果**：用时原本占 20% 且平时接近满分，删掉后**总分整体下移** ——
  「一个滑杆都不动、直接点开始」这一局从 **76 → 69 分**，等级从「铸造工 · 三级」掉到「**铸造工 · 学徒**」
  （`GRADES` 门槛：学徒 ≥60、三级 ≥75）。**如实报，不要为了分数好看去调门槛**；
  是否要重配阈值由设计侧在下一轮裁定。
- ⚠️ `DURATION_MS = 3600`（`turning-data.js` **L65-66**）**值不变** ——
  注释里"否则用时口径不公"的理由随用时一起消失，把注释改写为
  「固定时长以保证回放可复现（§3.8）」，**数值一个不动**。

#### 8c. 切刀建模太粗糙，要做出可辨认的结构

- **文件**：`demo/src/js/scene/turn-scene.js`，**L357-394**（`刀架 + 刀具` 段）
- **现状**：刀架 = `底座 + 上滑板 + 方刀台(1 个 box) + 2 个扳手方头`（合并 1 mesh）；
  刀杆 = `刀杆 box + 刀尖 box + 刀片 box`（合并 1 mesh）。方刀台只有 10 cm 见方的一个方块。
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
     「刀杆飞到 y≈5.9 高空」的事故就是破这条约定造成的。
  3. **刀架不得侵入工件最大半径** —— 现有方刀台 `z = 0.19`、底面 `z ≥ 0.145`（**L371** 注释）。
     新增工位/螺钉**只许往 +z 或两侧长**，不许往工件方向（−z）长。
- **验收**：给出切刀**近景截帧**（机位 `CAM`（`pages/turn.js` **L135**）不动，
  可用 CDP `Page.captureScreenshot` 的 `clip+scale` 局部放大），
  肉眼须能辨认出「四工位方刀台 / 夹刀螺钉 / 刀片楔角」三样。

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

- **`pages/cast.js` L462-484** 工牌写入改为**记录本局**：
  - `castScore`：**本局总分**（去掉 `Math.max`）
  - `rank`：**本局等级**（`gradeOf(total)`，去掉 `>=` 判断）
  - **新增** `sandbox`：本局砂箱序号（`0–11` 整数）
  - **新增** `casting`：铸件名（`CASTINGS[box().casting].name`，如「塔轮」）
  - **新增** `params`：`{ T, V, H }`（`state.T / state.V / state.H`，T 取整、V/H 保留 1 位小数）
  - `name`：**已有则不覆盖**（姓名是观众自己写的，保持现状 L472 的写法）
  - `no` / `unlocked`：**不变**
  - **删** **L475** `turnTime: badge.turnTime ?? null,`
- **`pages/turn.js` L483-501** 工牌写入改为**记录本局车削特征**：
  - **新增** `turn: { n, f, score, rank, collab }`（`n`/`f` 取 `st.lock`（**L415**）锁定的本局参数，
    `score` 取 `st.result.totalShown`，`rank` 取 `st.result.rank`，`collab` 取 `st.result.collab`）
  - **删** `turnTime` 的整段写入与"只更新更好的那一局"逻辑（**L488-494**）
  - **保留**「尚未浇铸过 → 不创建工牌，仅保留本次车削记录」的降级（**L496**）
  - **仍然只写 `im.badge` 一个键**，`no` / `name` / `castScore` / `unlocked` 一个都不动
- ⚠️ **不加时间戳字段**（本轮明确不要 `at`）—— 避免引入唯一的不确定源，且左栏没有余量展示它。

- **`pages/vault.js` `buildView()`（L82-104）**：
  - **删** **L97** `statTime`；**新增** `turnScore`（`badge.turn.score`，无则 `—`）。
  - **新增** 一行**工艺指纹** `fingerprint`（字符串，见下），若完全没有数据则为 `null`。
  - **删** **L101** `needTurn`（用时没了，它的语义随之消失）。
  - 缺字段一律 `—`：**不显示 `00:00`、不显示 `undefined`、不显示 `NaN`**。
- **`pages/vault.js` 藏品卡 `<dl class="vault__meta">`（L154-164）**：
  - 把 `<dt>车削用时</dt>` 改为 **`<dt>车削评分</dt>`**，值绑 `turnScore`。
  - **三项数量与版式完全不变** —— 藏品卡只有 400×560，**不许加第四项**（那会撑破左栏 878 预算）。
- **`pages/vault.js` 右栏 `paintRight()`（L302-321）**：在 `vault__body` 之后、`vault__rule` 之前
  **加一行 12px 的工艺指纹**（`.vault__fingerprint`），内容形如：
  ```
  砂箱 07 塔轮 · 砂温 1405℃ · 浇速 13.5 kg/s · 湿度 4.2% · 主轴 620 r/min · 进刀 0.32 mm/r
  ```
  规则：缺哪一段就**省略哪一段**；全空则**整行不渲染**（不占高度）。
  - **删** **L317** 的 `<a href="#/turn">去协作车削 →</a>`（`needTurn` 没了）。
  - 空态文案（`BODY_EMPTY`）**保留**。
- **`ui/poster.js` renderPoster（L100-104）**：
  - 三值横排中值 `'车削用时'` / `view.statTime` → **`'车削评分'` / `view.turnScore`**。
  - 在「工种 · 等级」行（**L90**，`y=890`）下方加一行 24px 中文：`砂箱 07 · 塔轮`（无数据显示 `—`）。
    位置参考 `y ≈ 918`；**若与 940 分隔线碰撞，允许下移到 940 分隔线之下靠右**，但**不许动徽记（L83-84）与三值横排的 y**。
  - ⚠️ **`drawEmblem` 完全不动**（它只吃 `unlocked`，`ui/emblem.js` 本轮零改动；海报与页面共用同一函数是 V3 的硬要求）。
- **`pages/vault.js` 调试钩子 `__vault.state()`（L408-449）**：
  `statTime` → `turnScore`，删 `needTurn`，新增字段（`casting` / `sandbox` / `turn` / `fingerprint` 原值）全部进 `state`，
  供验收脚本取证。
- ⚠️ **老数据兼容（硬要求）**：已有用户 localStorage 里的 `im.badge` **没有**新字段。
  必须**照常渲染、新字段显示 `—`、不抛错、不白屏**（沿用 `VAULT-SPEC §6.1` 的纪律）。

#### 9b. 加返回键（`#/vault` 现在没有任何返回/回首页入口）

- `pages/vault.js` **L129-205** 的骨架里**确实没有**返回控件（`VAULT-SPEC §1` 写的是"画稿如此：无顶栏、无 HUD"）。
- **改法**：在 `.vault` 左上角加一颗：
  ```html
  <button class="hud__back vault__back" type="button" data-go="">‹ 返回首页</button>
  ```
  复用 `.hud__back` 的既有样式（`hall.js` **L54** / `entrance.js` **L40** 都在用），
  `.vault__back` 只加**定位**（`position: absolute/fixed` 到左上角）与一点间距。
  点击走 `data-go` → `go('')`（首页），用 `page.addEventListener('click', …)` 委托
  （照 `home.js` **L145-150** 的写法，注意 `dispose()` 里对称移除）。
- ⚠️ **绝对不要因此给 `#/vault` 加整条顶栏** —— 左栏高度预算 878 / 900 就是当年去掉顶栏换来的。
- ⚠️ **返回键不参与 `.vault` 的两栏栅格**（不占高度/宽度预算），并且在 375 px 下**不得产生横向滚动**。

#### 9c. 「存下的东西不能点击查看」

> ⚠️ **这一条我（设计侧）做了折中，实现方按下面执行即可，有疑问不要自己改方向。**
>
> 现状：只存**一张**工牌（`im.badge` 单键），**没有"各个工牌"可点**。用户已裁定不做历史档案列表，
> 所以"可点击查看"落到**唯一有意义的两个落点** —— 这也是"存下来的东西"的真实所指：

- **馆藏图鉴 12 格**（`pages/vault.js` **L271-283**）：现在是**死元素**（有 `title`、不可点、不进 Tab 序）。
  改成 `<button>`，点击**就地展开一行**馆藏说明（用 `SANDBOXES[i].collection`，来自 `scoring/casting-data.js`），
  再点收起（`aria-expanded` 同步）。**未解锁格**点击给一行「完成一次浇铸可解锁」，**不跳页、不弹模态**。
- **4 张衍生卡**（**L187-195**）：同样可点，展开一行"怎么拿到它"
  （锁定态用 `DERIVS[i].need` 说明需要几张图鉴，如「需要解锁 3 件馆藏」）。
- ⚠️ 展开内容**只能用已有数据**（`SANDBOXES` / `DERIVS`），**不得新编馆藏文案**。
- ⚠️ 展开**不得撑破左栏 878 预算** —— 用同一行的就地小字，**不要做成卡中卡**。
  左栏确实装不下时，允许把说明行做成**覆盖在图鉴带下方的一行绝对定位文字**，但**不许改栅格高度**。

---

## 2. 新页面 `#/about` 的内容规格

**目的（用户原话）**：介绍**这个项目的目的**。不是作品说明书，也不是博物馆官网。

**结构（四段，按顺序）**：

1. **「我们为什么做这个」**
   —— 中国工业博物馆的铸造馆是**原沈阳铸造厂翻砂车间原址**；那台十吨冲天炉 1957 年投用、2007 年熄火，
   服役半个世纪，熔化铁水近百万吨。**今天它是静止的。** 本作品要做的事只有一件：
   **把它重新点一次火，让"看展"变成"上手做"。**
2. **「这个作品是什么」** —— 四层体验，每层一句话 + 一个直达按钮（全部复用 `.btn` + `data-go`）：

   | 层 | 一句话 | 直达 |
   |---|---|---|
   | 01 看见 | 滚动飞越铁西厂区 | `/` |
   | 02 看懂 | 序厅 → 通史馆长卷 → 铸造馆 | `entrance` |
   | 03 参与 | 亲手浇一炉 / 与队友车一只塔轮 | `cast` |
   | 04 带走 | 生成你自己的数字工牌 | `vault` |

3. **「用了哪些真实史实」** —— 数据块，直接列（**全部来自 `spec/PROJECT-BRIEF.md §4`，一字不许改、不许编**）：
   - 博物馆占地 **5.3 万 m²**，藏品 **1.5–3 万**余件
   - 铸造馆 **2018 年入选第二批国家工业遗产**；举架 **30 m**、纵深 **200 m**
   - 十吨冲天炉：炉身 **12 m**、总重 **300 t**，1957 投用–2007 熄火
   - 《铁流凝变》：**22 × 11.5 m**、净重 **50 t**，我国最大工业题材青铜雕塑
   - 新中国第一枚金属国徽：直径 **2.4 m**、重 **487 kg**
   - C620-1 普通车床：1955 年沈阳第一机床厂研制，登上**第三套人民币 2 元纸币正面**
   - ⚠️ 每个数字后面标来源口径「据馆方公开资料」。**这些数与交互里的评分数值没有任何关系**，不要混排。
4. **「技术说明」**（一段，不铺开）—— three.js + 原生 ES Module，**无后端、无随机、零贴图**；
   全站 JS gzip ≤ 215 KB；所有评分都是**可复算的纯函数**（同一组参数必得同一分）。

**版式要求**：
- 复用首页顶栏（`.topbar` + `.wrap.topbar__inner`）与 `.eyebrow` / `.btn` / `.num`；
  **不要新造一套视觉体系**，新增样式只允许 `.about__*`，**追加在 `layout.css` 末尾，不改既有规则**。
- ⚠️ `#/about` 是**滚动页**（同首页 `flex: 1 1 auto` 的 `.page`），**不是 900 定高页** ——
  不要套 `#/hall` 的 `100vh` 框架。
- 375 px 下无横向滚动。

---

## 3. 首页新版「1957 → 2007 → 今天」数据时间轴规格

**位置**：`home.js` 里 `hero` 段落**之后**另起一段 `<section class="axis">`（不在 hero 的两栏里）。

> **裁定理由**：`sticky` + `300vh` 的行程塞不进 `.hero` 的 `align-items: center` 两栏格，硬塞会把左侧文案挤走。
> 原 `.flyover` 那个右栏位置改放**一张静态的炉体剖面几何图**（纯 CSS 渐变 + 边框画冲天炉轮廓，
> 配色沿用已删除的 `.flyover__chapter[data-chapter="2"]` 那套写法），**不参与滚动**，避免右栏空掉。

**三个节点（文案固定，数字必须与 `PROJECT-BRIEF §4` 一致）**：

| # | 年份（大号 num） | 一句话 | 一行史实小字 |
|---|---|---|---|
| 1 | **1957** | 点火 | 十吨冲天炉在这一年投用，炉身 12 m、总重 300 t。 |
| 2 | **2007** | 熄火 | 服役半个世纪，熔化铁水近百万吨、生产铸件 60 余万吨。此后炉子静止。 |
| 3 | **今天** | 你 | 它重新亮起来 —— 这一次，浇铸的人是你。 |

**驱动方式（这一条最容易做错）**：
- 时间轴外面套一段 **`height: 300vh` 的行程容器**，时间轴本身 **`position: sticky; top: …`** 钉在视口内。
- 进度 = **该行程容器已滚过的比例**（`(scrollY − 容器top) / (容器高 − 视口高)`，钳到 0–1），
  **不是整页比例**（`home.js` L126-135 现在用的整页口径在删掉章节预告后就失真了）。
- 进度写进 **`--axis-progress`**（0–1），节点按 `i / 2` 分段落点亮 `is-active`，左轨填充高度 = 进度。
- ⚠️ `prefers-reduced-motion: reduce` 时**不监听滚动**，三节点直接全亮 —— 沿用 `home.js` **L137-142** 的既有做法。
- ⚠️ **滚动监听必须在 `dispose()` 里移除**（现有 **L152-158**，改名后保持对称）。
- ⚠️ 不要再出现「视频」「预渲染」「素材」这类字样。

---

## 4. 硬约束

1. **全站 JS gzip ≤ 215 KB**（2026-09-22 实测 **198.57 KB**）。
   本轮预期**下降** —— 请给出改前 / 改后实测值。

   > 📌 **实测后况（2026-09-22 晚，第 1–7 条交付）**：**198.56 → 206.96 kB（banner 口径，+8.40）**，
   > **未下降**。原因：本文件 §1 第 2/3 条要求**新增一整页 `#/about` + 一段 `300vh` 时间轴**，
   > 新增中文正文必然推高 gzip —— 「预期下降」与「新增内容」互斥。
   > **≤215 KB 仍满足（余量 8.04 kB）**，但 §6 的 **J23 第二半句「< 198.57 KB」不可达成**，
   > 需裁定；详见 `spec/IMPLEMENTATION-UX-REVISION.md` §3.1 与 §5。
   > 第 8 条（删榜 / 删用时）预期会把它拉回，**建议 J23 的裁定推迟到第 8 条验收后**。
2. **贴图 0 增量**；首页（含新时间轴）与 `#/about` **零 WebGL**（`webgl = 0`、`draw call = 0`）。
3. **零随机**。不得新增 `Date.now()` / `Math.random()` 进入任何视觉或评分分支
   （本轮**明确不加**时间戳字段）。
4. **不新增运行时依赖**；`#/about` 不许引任何第三方库。
5. `#/vault` 左栏 `left_bottom` **≤ 900**；375 px **无横向滚动**（不回归 V11）。
6. **不回归门禁**，全部要重跑并报读数：
   `#/cast` selfTest（现 45/45）· `#/hall` `layout()`（现 61/61）· `#/entrance` `layout()`（现 22/22）·
   `#/turn` selfTest（现 80/80，本轮期望值会变）· `#/vault` `__vault.state()`（现 V 组 31/31，其中涉用时的断言会变）。

---

## 5. 解冻与覆盖（逐条写清，不许靠口头默契）

### 5.1 本轮解冻（授权改动）

| 文件 | 为什么必须改 | 覆盖 / 作废的旧条款 |
|---|---|---|
| `js/pages/home.js` | 用户第 1/2/3/4/5 条 | Step 1 首页规格里「顶栏右侧进入虚拟展厅按钮」与「章节预告」两处；`design/S01` 对应区域 |
| `js/styles/layout.css` | 同上（删 `.flyover*` / `.flyover-recipes*`，新加 `.axis*` / `.about*` / `.vault__back` / `.vault__fingerprint`） | 只新增类；`.topbar__spacer`(**L70**) / `.hud__back` / `.topbar` / `.wrap` **不动** |
| `js/pages/about.js`（**新建**）+ `js/main.js` | 用户第 2 条 | 新页；`PAGES` / `TITLES` 由 **7 键 → 8 键** |
| `js/pages/hall.js` | 用户第 6 条 | `SCENE-LAYOUT-FIX-SPEC §10.8-E`（车床 CTA 走 `#/turn`）→ 改为一律走 `#/cast` |
| `js/scene/cast-scene.js` | 用户第 7 条 | `VISUAL-REFINE-SPEC` W3 里「熔面保持水平 + 随倾倒收缩」的裁定**作废** |
| `js/pages/turn.js` · `js/scoring/turning.js` · `js/scoring/turning-data.js` · `js/scene/turn-scene.js` · `styles/layout.css` | 用户第 8 条 | **`TURN-SPEC.md` §3.2（计时）/ §3.7（协作榜）/ §4.1（用时权重 20%）三节作废**；§4.3 等级表沿用不变；U 组里计时 / 榜单相关断言作废 |
| `js/pages/vault.js` · `js/pages/cast.js` · `js/ui/poster.js` | 用户第 9 条 | **`VAULT-SPEC.md` §9 的 `im.badge` 字段表**扩展：删 `turnTime`，加 `sandbox` / `casting` / `params` / `turn`；**§14 第 10 条**（`turnTime` 为 null 显示 `—`）随字段删除而作废；**§1「画稿无顶栏」不解除**（返回键用 `.hud__back` 绝对定位，不建顶栏） |

### 5.2 仍然冻结（不许碰）

- `styles/tokens.css` —— 配色 / 字号 / 间距 token **一个不动**
- `js/router.js` · `js/venues.js` —— 路由与场馆导航机制不动（`main.js` 只加 `about` 一条）
- `js/pages/entrance.js` · `js/pages/history.js` · `js/scene/entrance-scene.js` · `js/scene/workshop.js` ·
  `js/scene/environment.js` · `js/scene/textures.js` · `js/scene/props/*` ·
  `js/scene/props/ladle.js`（**静态浇包**，与 `cast-scene.js` 里动画用的那份是两套）
- `js/scoring/casting.js` · `js/scoring/casting-data.js` —— **浇铸评分与数据一字不动**
- `js/ui/emblem.js` —— 徽记绘制不动
- `design/*` —— 设计稿是基准，**本轮不改图**，改动由本文件描述
- `#/vault` 的两栏栅格与左栏 878 预算结构

> **解冻的代价**：§4 第 6 条那五组门禁**全部重跑**，读数写进交付物。

---

## 6. 验收（J 组，实现方逐条自证并附读数）

**入口链**
- **J1** 首页顶栏**没有**「进入虚拟展厅」按钮；`.topbar__spacer` 仍在；nav 仍 6 项（`home.js` L44-47）
- **J2** hero 主按钮 `data-go="entrance"`，点击后落在 `#/entrance`
- **J3** 顶栏「虚拟展厅」药丸同样落在 `#/entrance`
- **J4** 序厅「进入铸造馆 →」**仍**落在 `#/hall`（没被顺手改掉）

**关于项目**
- **J5**「了解项目」不再是死按钮：点它到 `#/about`；顶栏「关于项目」也到 `#/about`
- **J6** `#/about` 可达、`document.title` 正确、四段内容齐全、`webgl = 0`、375 px 无横向滚动
- **J7** `#/about` 里四层的四个直达按钮各自走到 `/` `entrance` `cast` `vault`

**首页**
- **J8** 首页 DOM 里**没有** `.flyover` / `.flyover-recipes` 任何节点；源码 grep **零命中**「预渲染」「视频时间轴」
- **J9** 三节点年份 / 文案与 §3 表一致，且数字与 `PROJECT-BRIEF §4` 逐字一致
- **J10** 滚动推进：给 **0 / 0.5 / 1** 三个位置各一张截帧；0 处仅第 1 节点亮、1 处三节点全亮，`--axis-progress` 实测值随位置单调
- **J11** `prefers-reduced-motion: reduce` 下不监听滚动、三节点全亮

**铸造馆**
- **J12** 三个热点药丸（冲天炉 / 砂箱 / 车床）逐一点开 → 信息卡主按钮**都是**「进入浇铸互动」且 `data-go="cast"`
- **J13** `hall.js` 里 `data-cta-notice` / `CTA_TURN` / 「尚未开放」**零残留**

**浇铸**
- **J14** `tilt = 52°` 时 `ladle.melt.rotation.x === 0`（相对 `pot`）、`melt.scale === (1,1,1)`；
  给 **0° / 26° / 52°** 三张近景截帧，肉眼可见液面与桶一起倾

**车削**
- **J15** `#/turn` 无 `.turn__board*` 节点、无 `data-clock` / `data-target`；
  源码里 `inBoard` / `RIVALS` / `RECORD_TIME` / `boardRows` / `subs.time` 相关**零残留**（`FALLBACK.t` / `forceSettle` 除外）
- **J16** `#/turn` `selfTest` **全绿**，附「旧期望 → 新期望」逐条对照表，并给出
  **"不动手直接开始"这一局的实测总分与等级**（预期 69 / 铸造工 · 学徒）
- **J17** 规则面板只剩 3 条（表面质量 / 尺寸精度 / 协作分），其中权重数字与 `WEIGHTS` 实读值一致（**56% / 44%**）
- **J18** 切刀近景能辨认「四工位方刀台 / 夹刀螺钉 / 刀片楔角」；`draw call` **不增**（仍是 `turn_tool_body` + `turn_tool_shank` 两个 mesh）

**工牌**
- **J19** 连浇两炉**不同砂箱** → `#/vault` 两次显示明显不同（铸件 / 砂箱号 / 评分 / 工艺指纹），
  且**不是**"只升不降"的历史最好值（给两局各一张截图）
- **J20** `#/vault` 左上角有返回键 → `#/`；`.vault` 两栏栅格不变（实测 `left_bottom ≤ 900`）；375 px 无横向滚动
- **J21** 图鉴 12 格与 4 张衍生卡可点开 / 收起，展开不撑破左栏预算
- **J22** 老数据兼容：手工把 `im.badge` 改成只有 `{ no:'000001' }` → 页面**不抛错、不白屏**，新字段全部显示 `—`
- **J23** gzip 实测 **≤ 215 KB 且小于 198.57 KB**，给出改前 / 改后数字

---

## 7. 不要做的事

1. **不要给 `#/turn` 加锁或"未解锁"拦截** —— 车削的唯一正门是 `#/cast` 结算页的按钮；直连 URL 照常可玩。
2. **不要把「关于项目」做成弹窗浮层** —— 用户选了独立页。
3. **不要新增贴图**，**不要动 `tokens.css`**。
4. **不要为了让分数/自测好看而改评分系数或等级阈值** —— 按引擎实际输出写回期望值，把后果如实报告。
5. **不要把 `#/about` 做成 900 定高页** —— 它是滚动页。
6. **不要在 `#/vault` 加整条顶栏** —— 返回键用绝对定位的 `.hud__back`。
7. nav 第 5 项「数字藏品」现在仍指向首页（`route: ''`，死项）—— **本轮不动**，留待用户裁定。
8. **不要改 `#/cast` 的评分与解锁规则**（`casting.js` / `casting-data.js` 冻结）。
9. **不要把「用时」以任何形式重新引入界面** —— 秒数、进度条、快慢评价、名次，都不许。
10. **不要顺手"优化"没被点名的东西** —— 本轮 9 条之外的一切改动，都要先在自述里列为「偏离」再等你确认。

---

## 8. 交付要求

1. **`spec/IMPLEMENTATION-UX-REVISION.md` 自述报告**，逐条对 **J1–J23** 给出「通过 / 不通过 + 实测读数」，
   并单列：**偏离与待裁定清单**（不要自己压下来）、**「旧期望 → 新期望」评分对照表**、
   **"不动手"基线分数变化**、**gzip 改前 / 改后**。
2. **改动前后对照截图（1440×900）**：
   - 首页三态（页顶 / 时间轴中段 / 页底）
   - `#/about` 全页
   - `#/hall` 车床信息卡（按钮文案）
   - 浇铸 **0° / 26° / 52°** 三帧
   - `#/turn` 面板（无榜、无时钟、规则面板展开）
   - 切刀**近景**
   - `#/vault` **两局对比**（不同砂箱）+ 375 px 一帧
3. **门禁读数表**（五组，改前 / 改后）+ **体积读数**。
4. 报告里凡引用的行号，**必须回代码核过**再写（本文件的行号也可能已漂移）。

---

## 9. 环境提醒（本项目踩过的坑）

- **构建**：`node node_modules\vite\bin\vite.js build`（cwd = `demo/`），**不要用 `npm.ps1`**。
- ⚠️ **构建 / 验收链路一律不要用管道** —— 精简 shell 里 `tail`/`grep` 不存在，
  管道命令会**假失败并静默中断**，dist 停在旧产物、验收全跑在旧代码上。
- **截图走 CDP**（`tools/screenshot.py`），Edge 的 `--screenshot` 参数**静默失败**。
- **Vite preview 的 sirv 会缓存 manifest** —— 重建后可能仍服务旧 bundle；
  `TaskStop` 旧 preview → 重启（`--strictPort`）→ 校验 `index.html` 引用的 bundle 名已换。
- 验收脚本**先跳 `about:blank` 再导航**（同 URL 导航不重挂，断言会读到旧值）；
  `?debug=1` **必须写在 hash 之前**（`/?debug=1#/vault`）。
- **自测脚本必须无代理跑**（沙箱代理拦 loopback 返回 502 ≠ 服务死了）。
- **同一文件的多个改动逐条串行做，每条改完复核** —— 并行会部分丢失。

---

*设计侧同批交付：本文件即本轮唯一依据。旧条款的正式改写（`TURN-SPEC` / `VAULT-SPEC` / `SCENE-LAYOUT-FIX-SPEC` / `VISUAL-REFINE-SPEC`）在实现验收通过后由设计侧统一同步，实现方不必改规格文件。*
