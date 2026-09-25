# 提示词 · 头部与导航统一（体检 §6 · P1 第一批）

> ⛔ **【已归档 · 2026-09-24 · 不要发送本文件】**
> **本文件的三项改动已于 2026-09-24 实现并交付** —— 自述 **`spec/IMPLEMENTATION-HEADER-NAV.md`**
> （头部四套收成两套 **72/64** · 品牌标记七页全等 **26×26 · r6 · 铁水橙** · `#/entrance` 导航 **2 → 1**；
> `scan_dead_selectors` **0** · `verify_ux` **47/47** · `verify_vault` **41/41** · `verify_turn` **43/44**（唯一红仍为**既有 D1**）
> · `verify_cast` E9/H3/T7 PASS · **H1–H6 全 PASS** · 体积**净 −256 B（gzip9）**）。
> **这里的每一项都已经在代码里了** —— **再发一次等于让实现方重做一遍。**
> 📌 归档原因：**出稿当日即实现并交付** ⇒ 按规矩整份移出 `spec/`。
> 正文一字未改，**下文所有行号均为「改前」行号**。
> ⚠️ 本轮**新增断言**落进四个门禁脚本（`verify_w1.py` H1/H4/H5 · `verify_turn.py` H2 ·
> `verify_cast.py` H3 · `verify_step4c.py` H6），与自述 §6 一一对应。
> 📌 前提未发生：`PROMPT-NAV-TRIM.md` **尚未落地**（执行顺序由用户指定为先做本批），
> 故自述 §10-④ 记录了「导航项数仍按 6 记」的偏离 —— **NAV-TRIM 仍是可发的下一份**。
> ⚠️ 本核查脚本 `.workbuddy/check_header_nav_prompt.py` 是**出稿前**用的（比对改动前代码），
> 落地后必然转红 —— 那不是回归，是它的使命结束了。
> **状态**：**未实现，可发**。出稿 **2026-09-24**。
> **上游**：`spec/AESTHETIC-AUDIT.md` §6 的 **P1-1 / P1-2 / P1-3**（依据 §4.5 的 L1 / L2 / **L2b** / L3）。
> **前提（必读）**：**NAV-TRIM 已落地** —— `demo/src/js/pages/home.js` 的 `NAV` 已 **6 项 → 5 项**，
> `verify_ux.py` 的 `J1_home_topbar_no_cta` 已断言 `navCount == 5`。
> ⚠️ **若 NAV-TRIM 还没做**：先做它（一份独立提示词，一行改动）。本批所有「导航项数」读数都以 5 为基准，
> 不做的话验收表会整体差 1 项。
> **本批只动三件事**：**头部高度**、**品牌标记**（尺寸 + 底色）、**导航条数量**。
> ❌ **不碰**配色、不碰毛玻璃、不碰字号阶梯、不碰圆角阶梯 —— 那是后两批（P1-4~6 / P1-7~9+13）。
> （「不碰配色」的**唯一例外** = 品牌标记的底色，它属于"全站标记一套"的一部分，见 §2.2 ③ 与体检 §4.5 **L2b**。）
> **事实来源**：本文里每一处行号与数值，都由
> `.workbuddy/facts_header_nav.py`（CSS 规则块）、`.workbuddy/facts_header_nav2.py`（token 与全部出现处）、
> `.workbuddy/facts_header_struct.py`（八页 JS 结构）、`.workbuddy/probe_header_nav.py`
> （**无头 Edge 实测八页，1440×900**）核过；**目标值另由画稿像素实测** ——
> `.workbuddy/probe_canvas_header_h.py`（7 张画稿的头部高）与 `.workbuddy/probe_canvas_marks.py`
> （标记的包围盒），读数落 `.workbuddy/shots/canvas_header_h.json` / `canvas_marks.json`，
> 人眼复核图 `.workbuddy/shots/canvas_header_strips.png`。
> ⇒ **不是转抄记忆，也不是照代码推的**。
> **配套出门检查**：`.workbuddy/check_header_nav_prompt.py`（出稿时 **132 绿 / 0 红** —— ⚠️ 它比的是**改动前**的代码，本批落地后**必然转红**，见 §8 第 0 步）。

---

## 0. 一句话

**首页现在有四套头部、三种品牌标记、`#/entrance` 上挂着两条说同一件事的导航条。**
本批把它们收成：**两套头部（72 / 64）· 一种品牌标记（26×26 r6 · 铁水橙）· 每条导航都有人点**。

> ⚠️ **两个目标值都是「跟画稿」裁定的**（用户 2026-09-24）：头部 **64**（不是体检原文的 56）·
> 标记 **26×26**（不是体检原文的 20×20）。两处都做了画稿**像素取证**，依据见 §1 开头与 §2.1。

---

## 1. P1-1 · 头部从四套收成两套（**72 / 64**）

> 📌 **目标值 = 64（跟画稿），不是 56（跟代码）—— 用户 2026-09-24 已裁定。**
> 体检 §6 原文写的是「沉浸页 56」，那是**照着代码量出来的**；而本项目的优先级是
> **规格 > 画稿 > 代码**。出稿时对 10 张画稿做了**像素取证**（`.workbuddy/probe_canvas_header_h.py`），
> 量出画稿口径干净地只有两套：**72（首页 / 账本）· 64（其余全部，含车削）**。
> 另：设计侧 2026-09-24 曾把 `ENTRANCE-HISTORY-SPEC` 从 64 **错改成** 56（向代码看齐，方向反了），
> 已按本次裁定回改（见 §9）。**体检 §6 的 P1-1 目标值以本稿为准。**

### 1.1 现状（八页实测，1440×900 —— 代码）

| 页 | 头部容器 | 实测高 | position | 玻璃 | 下边框 | 对应画稿 |
|---|---|---|---|---|---|---|
| `/`（首页） | `header.topbar` **+ `.nav`** | **72** | sticky | `blur(10px)` | 1px | S01 = **72** ✔ |
| `#/about`（关于） | `header.topbar` **+ `.nav`** | **72** | sticky | `blur(10px)` | 1px | 无画稿 |
| `#/cast`（浇铸） | `header.topbar`（**无 `.nav`**） | **72** | sticky | `blur(10px)` | 1px | S03 = **64** ✗ |
| `#/turn`（车削） | `header.topbar.turn__topbar`（**无 `.nav`**） | **64** | sticky | `blur(10px)` | 1px | S04 = **64** ✔ |
| `#/entrance`（序厅） | `div.hud` | **56** | absolute | 无 | 无 | S07 = **64** ✗ |
| `#/hall`（铸造馆） | `div.hud` | **56** | absolute | 无 | 无 | S02 = **64** ✗ |
| `#/history`（通史馆） | `div.hud` | **56** | absolute | 无 | 无 | S08 = **64** ✗ |
| `#/vault`（工牌） | 只有 `button.vault__back` | 32.4 | fixed | 无 | 无 | S05 无头部 ✔ |

**代码三套（72 / 64 / 56），画稿两套（72 / 64）。** 要收的是**代码里的 56 与那多出来的 72**。

> 🔑 **画稿的规则不是"按页族"，是"按有没有主导航"**：
> **有 `.nav` 的两页（首页 / 关于）画成 72；没有主导航的五页（浇铸 / 车削 / 序厅 / 铸造馆 / 通史馆）全画成 64。**
> 证据：S01 / S11 的头部**带一条主导航**（首页 · 虚拟展厅 · 互动体验 · 我的…）⇒ 72；
> S03 的头部只有 `logo + 互动体验 · 亲手浇下第一炉铁水 + 步骤条`、**没有导航** ⇒ 64（它和 S04 的车削头部同构）。
> 所以 `#/cast` 现在的 72 是**错的** —— 它明明没有主导航。

代码侧共有四处高度来源：

| 来源 | 位置 | 现值 | 本批 |
|---|---|---|---|
| `--topbar-h` | `demo/src/styles/tokens.css:44` | `72px` | **不动** |
| `--hud-h` | `demo/src/styles/tokens.css:45` | `56px` | **改 64px** ← 唯一的 token 值改动 |
| `.turn__topbar` 覆盖 | `demo/src/styles/layout.css:849` | `height: 64px;` | **改引用** `--hud-h`（值不变） |
| 移动端覆盖 | `demo/src/styles/layout.css:617` | `:root { … --topbar-h: 60px; }`（`@media (max-width:820px)`） | **不动** |

### 1.2 目标：两套 —— **有主导航 72 / 无主导航 64**

| 套 | 用于 | 高 | 画稿 |
|---|---|---|---|
| **滚动页头部** | `/` · `#/about`（`header.topbar` **+ `.nav`**） | `var(--topbar-h)` = **72** | S01 / S11 = 72 |
| **沉浸页头部** | `#/cast` · `#/turn` · `#/entrance` · `#/hall` · `#/history`（**都没有主导航**） | `var(--hud-h)` = **64** | S02 / S03 / S04 / S07 / S08 = 64 |

`#/turn` 与 `#/cast` 都是**沉浸交互页**（三维视口 + 悬浮面板/控件），并入沉浸套。
而且**车削页本来就是 64**，它才是"早就在对的那一个"。
**变的是四页：`#/cast`（72 → 64，矮 8px）与三个 HUD 页（56 → 64，各长 8px）。**

### 1.3 改动（**三处 + 一行标记**）

**① `demo/src/styles/tokens.css:45`：唯一的 token 值改动**

```css
- --hud-h:      56px;
+ --hud-h:      64px;
```

**② `demo/src/js/pages/cast.js:53`：给浇铸页头部一个能挂钩的类名**

```js
-      <header class="topbar">
+      <header class="topbar cast__topbar">
```

**③ `demo/src/styles/layout.css:849` 一带：两条覆盖，都把高度引到 token**

```css
- .turn__topbar { height: 64px; }
+ .turn__topbar { height: var(--hud-h); }
+ .cast__topbar { height: var(--hud-h); }
```

> ②③ 之后，"头部高度来源"从四处收成**两处 token + 一个移动端窄屏覆盖**，
> 且**两条覆盖都只写"引用"，不写数值**。`L848` 的注释 `/* -- 模块导航（高 64，--c-surface；规格 §2.1） -- */`
> 里的 `高 64` 可以留（值没变）。

`#/vault` 没有头部是**画稿如此**（`vault.js:163` 已注明），**不在本批范围内，不要顺手补**。

### 1.4 ⚠️ 四条「不要顺手」

1. **只改 `height`。** `.turn__topbar` 与 `.cast__topbar` 都从 `.topbar` 继承
   （`turn.js:57` 写 `class="topbar turn__topbar"`、`cast.js:53` 改后写 `class="topbar cast__topbar"`），
   所以它们**同时带着 sticky + `blur(10px)` + 1px 下边框**。
   去掉这三样属于 **P1-7（毛玻璃 13→≤2）**，**本批不要动**。
2. **不要动 `layout.css:617` 的移动端 `--topbar-h: 60px`**（同时 `L619` 会隐藏 `.nav`）：
   **桌面 ≥820px 是 72 / 64，窄屏是 60 / 64**（沉浸套的 64 在窄屏下**也不变** —— `--hud-h` 没有窄屏覆盖）。
   ⚠️ 因此 `#/cast` 与 `#/turn` 在窄屏下**不再跟随 60**，而是保持 64。验收读数**必须写明视口**。
3. **`--topbar-h` 不要动。** 本批**只改 `--hud-h` 一个 token 值**（56→64）——
   `tokens.css` 头部写着"实现方不要改这里的值"，**这是设计侧经用户裁定后授权的一次例外，仅此一项**；
   其余 token 一律只**引用**不**定义**。
4. **不要顺手把 `.hud` 的 `position: absolute` 改成 sticky、也不要给它补玻璃。**
   `layout.css:120-133` 的反差是**刻意的**（沉浸页头部不吸顶、不毛玻璃），归 P1-7 评估。
5. **不要给 `#/cast` 补导航、也不要把它的头部换成 `.hud`。** 本批只给它一个类名让它**引用 token** ——
   换标记会牵动 `.cast__steps` / `.wrap` 的整条版式，那是另一件事。
   ⚠️ `verify_ux.py:456-460` 有一条断言锁死 `.cast__steps` 首项的 **`left` = 1118.5 ± 1** ——
   本条改动**只动高度、不动宽度**，x 坐标不会变；若它红了，说明你动了不该动的。

### 1.5 `--hud-h` 的**全部**消费者（改一个值会连动这四处，已逐条核过）

| # | 位置 | 声明 | 56 → 64 后的效果 |
|---|---|---|---|
| 1 | `layout.css:123` | `.hud { height: var(--hud-h) }` | 头部自身变高 ✔ 这就是目的 |
| 2 | `layout.css:168` | `.halls { top: var(--hud-h) }` | 药丸行**自动下移 8px**，仍紧贴头部下缘 ✔ |
| 3 | `layout.css:303` | `.halls-notice { top: calc(var(--hud-h) + 60px) }` | 116 → **124** ✔ 相对关系不变 |
| 4 | `layout.css:713` | `.history__scroll { padding-top: calc(var(--hud-h) + 60px) }` | 116 → **124** ✔ 相对关系不变 |

⇒ **四处全是 `var()` 引用，没有一处写死 56。** 所以只需改 token，不需要跟着改任何一条。
**若你发现代码里有写死的 `56px` 硬编码待改，停下来问 —— 那说明现状与设计侧的取证不符。**

### 1.6 验收读数（1440×900）

| 项 | 期望 |
|---|---|
| `#/cast` 的 `.topbar` 高 | **64 ± 1**（原 72；**新加的 `cast__topbar` 生效**） |
| `#/entrance` / `#/hall` / `#/history` 的 `.hud` 高 | **64 ± 1**（原 56） |
| `#/turn` 的 `.turn__topbar` 高 | **64 ± 1**（**未变**） |
| `/` · `#/about` 的 `.topbar` 高 | **72**（未变 —— 它们有 `.nav`） |
| `main.turn` 的 `top` | **64**（**未变** —— 这一批不再动它） |
| `.halls` 的 `top`（三个 HUD 页） | **64**（原 56） |
| `.halls-notice` 的 `top` | **124**（原 116） |
| `#/history` 的 `.history__scroll` 的 `padding-top` | **124**（原 116） |
| 右栏协作面板（`fill_container`） | 高度仍为 **772**（**未变**；56 那版才需要变 780） |
| `#/cast` 的 `.cast`（`main`）高度 | **+8**（flex 列自动吃掉，无写死偏移） |
| `.cast__steps` 首项 `left` | **仍 1118.5 ± 1**（`verify_ux.py:456` 的既有断言，本批只动高度） |
| `#/vault` | 仍只有 `.vault__back`，无头部（未变） |
| 八页横向溢出 | **仍全为 0** |

> ⚠️ **这一批会让四页的内容整体位移 8px**（`#/cast` 上移 8px；三个 HUD 页下移 8px）。
> 验收时必须**逐页看有没有新溢出 / 新遮挡**（尤其 `#/cast` 的三维视口与右栏面板、
> `#/hall` 的三枚热点、`#/history` 的长卷首屏）。**这是本批唯一有视觉后果的地方。**

---

## 2. P1-2 · 品牌标记全站一套：`26×26` · `border-radius: 6px` · `var(--c-iron)`

### 2.1 现状（实测，三种写法）

| 页 | 选择器 | 实测 w×h | 圆角 | 紧邻页名 |
|---|---|---|---|---|
| `/` `#/cast` `#/about` | `.logo__mark`（在 `.logo` 内） | **20×20** | **6px** | 18px / 600 |
| `#/entrance` `#/hall` `#/history` | `.logo__mark`（在 `.hud__title` 内） | **8×8** | **2px** | 18px / 600 |
| `#/turn` | `.turn__mark` | **26×26** | **4px** | **16px / 500** ← 唯一的异类 |

同一个选择器 `.logo__mark` 之所以有两种尺寸，是因为 **`layout.css:52` 有一条覆盖规则**：

```css
layout.css:46  .logo__mark {
layout.css:47    width: 8px; height: 8px; border-radius: 2px;   ← HUD 页拿到这个
layout.css:48    background: var(--c-iron);
layout.css:49    flex: 0 0 auto;
layout.css:50  }
layout.css:51  /* 顶栏 logo 方块比 HUD 的大（对齐设计稿 S01） */
layout.css:52  .topbar .logo__mark {
layout.css:53    width: 20px; height: 20px;                        ← 顶栏页拿到这个
layout.css:54    border-radius: 6px;
layout.css:55  }
```

> 📌 **统一到 `26×26 r6`（跟画稿），不是 `20×20`（跟代码）—— 用户 2026-09-24 已裁定。**
> 画稿实测（`.workbuddy/probe_canvas_marks.py`，橙色方块包围盒）：
>
> | 画稿 | 对应页 | 标记实测 | 头部高 |
> |---|---|---|---|
> | S01 首页 Hero | `/` | **30×30** | 72 |
> | S02 虚拟展厅 | `#/hall` | **26×26** | 64 |
> | S03 亲手浇铸 | `#/cast` | **26×26** | 64 |
> | S04 协作车削 | `#/turn` | **26×26** | 64 |
> | S07 序厅炉前 | `#/entrance` | **26×26** | 64 |
> | S08 通史馆长卷 | `#/history` | **26×26** | 64 |
> | S11 首页账本（按现状重拍） | `/` 下半段 | 18×18 ≈ 代码的 20 | 72 |
>
> 画稿自己在 30 / 26 / 18 之间**不一致**（S11 是照当前代码重拍的，所以它带着 20）。
> **26 是有头部画稿里的多数值（5 张），而车削页的代码本来就是 26** ⇒ 取 26，
> **动的就是顶栏那三页（20→26）与 HUD 那三页（8→26）**。
> ⚠️ 其中 S01 画稿给的是 30 —— **本批不追 30**（它只影响首页一张、且它不是多数值）；
> 若你想要 30，请单独说，那要连首页一起重拍。

### 2.2 改动（`demo/src/styles/layout.css`，共四处 + 删两条）

```css
/* ① L46-50 基础规则：8×8 r2 → 26×26 r6（六个 HUD/顶栏页的取值都来自这里） */
 .logo__mark {
-  width: 8px; height: 8px; border-radius: 2px;
+  width: 26px; height: 26px; border-radius: 6px;
   background: var(--c-iron);
   flex: 0 0 auto;
 }

/* ② L51-55 覆盖规则：删掉（基础值已是 26×26 r6，这条成了空覆盖） */
-/* 顶栏 logo 方块比 HUD 的大（对齐设计稿 S01） */
-.topbar .logo__mark {
-  width: 20px; height: 20px;
-  border-radius: 6px;
-}

/* ③ L850-856 车削页标记：尺寸本来就对（26×26），只改圆角与底色 */
 .turn__mark {
   width: 26px; height: 26px;
-  border-radius: 4px;
+  border-radius: 6px;
-  background: var(--c-surface-2);
+  background: var(--c-iron);
   flex: 0 0 auto;
-  transition: background-color .18s ease;
 }

/* ④ 删 L857：底色已等同 --c-iron，这条悬停成了空操作 */
-.turn__mark:hover { background: var(--c-iron); }

/* ⑤ L858-860 车削页页名：16px/500 → 18px/600（与 .logo 的 --fs-h3 / 600 一致） */
 .turn__page-title {
-  font-size: 16px;
-  font-weight: 500;
+  font-size: var(--fs-h3);
+  font-weight: 600;
   white-space: nowrap;
   margin-left: var(--s2);
 }
```

### 2.3 ⚠️ 四条自检

1. **`.turn__mark` 的底色必须一起改（`layout.css:853`）。** 它现在是
   `var(--c-surface-2)` = **`#1F242B`**（**近黑**，深色头部上几乎看不见 ——
   实拍 `.workbuddy/shots/turn.png` 只勉强一个略亮的方块），而**画稿 S04 上画的是铁水橙**，
   其余七页的 `.logo__mark` 也全是 `var(--c-iron)` = `rgb(232, 102, 60)`。
   ⇒ **改成 `var(--c-iron)`。** 理由链：`turn__mark` 在**任何规格里都没定义过**
   （全仓 `*.md` 扫过：只出现在体检 §4.5 L2 与 `IMPLEMENTATION-TURN.md` 的 U11，后者只记它的 `href`）
   ⇒ 按「**规格 > 画稿 > 代码**」，**画稿胜出**；且这也正是 P1-2 的标题（"品牌标记**全站一套**"）——
   只统一尺寸会留下"八页里七页橙、车削近黑"。
2. **`.turn__mark:hover`（`layout.css:857`）随后要删。** 它写的是 `background: var(--c-iron)`
   —— 底色改橙之后它变成**空操作**。**不要改成别的动效**：`.logo`（另一处品牌链接，`L37-45`）
   **本来就没有 hover 规则**，删掉才是"一套"。链接的可点性由 `cursor` 与页名承担。
3. **`.turn__mark` 的尺寸（26×26）本来就与画稿一致 ⇒ 这一处只动圆角 r4 → r6。**
   ⚠️ **不要顺手把它改成 20 去"和顶栏一致"** —— 现在是**顶栏往 26 靠**，方向相反。
4. **`.hud__title` 里的标记不要被压扁**：`flex: 0 0 auto` 已在基础规则里，保持不动。
   `64px` 的 HUD 里放 `26px` 方块余量 **38px**，`align-items: center` 居中即可。

### 2.4 验收读数（1440×900）

| 项 | 期望 |
|---|---|
| 全站 `.logo__mark` 与 `.turn__mark` 的 `width` / `height` | **26px / 26px**（七页全等；`#/vault` 无标记） |
| 同名 `borderTopLeftRadius` | **6px**（全等） |
| 同名 `backgroundColor` | **`rgb(232, 102, 60)`**（全等 —— 包含 `#/turn`） |
| `.turn__page-title` 的 computed `fontSize` / `fontWeight` | **18px / 600** |
| `.logo` 的 `fontSize` / `fontWeight`（回归保护） | 仍 18px / 600 |
| 品牌标记与页名的间距 | 不因尺寸变化被挤掉（`.logo` 的 `gap: var(--s1)` 不动） |
| `.turn__mark` 的 `:hover` | 已删（无 hover 规则，与 `.logo` 一致） |

> ⚠️ **`26 > 20`：顶栏那三页的 logo 会变大 6px**，`72px` 头部里余量 46px ⇒ 不会挤到导航，
> 但**顶栏整体视觉重心会略变**，验收时请**逐页截图比对**（`/` · `#/cast` · `#/about`）。

---

## 3. P1-3 · `#/entrance` 的导航条：删掉重复的那一条

### 3.1 ⚠️ 先更正体检 §4.5 L3 的一句话

体检原文写「**一页三条导航**：`#/entrance`：顶栏 NAV + 场馆药丸 `nav.halls` + 底部 `nav.sequence`」。

**这句话不准确，实测结果如下（`probe_header_nav.py`，八页）：**

| 页 | `<nav>` 数量 | 逐条 |
|---|---|---|
| `/` · `#/about` | 1 | `.nav`（**5 项**，含主导航） |
| **`#/entrance`** | **2** | `.halls`（**可点 5 项**）+ `.sequence`（**可点 0 项**） |
| `#/hall` · `#/history` | 1 | `.halls`（可点 5 项） |
| `#/cast` · `#/turn` · `#/vault` | 0 | — |

**`#/entrance` 没有"顶栏 NAV"** —— 它用的是 `div.hud`（`entrance.js:39`），里面只有
返回键 / 页名 / `WebGL 自由漫游` 徽标 / WebXR 入口，**没有 `.nav`**。所以它是**两条**，不是三条。

### 3.2 真正的问题（实测）

| 事实 | 证据 |
|---|---|
| `.sequence` **一个可点元素都没有** | `entrance.js:72-76` 全是 `<span>`；实测 `clickable = 0` |
| 它与 `.halls` **表达同一件事** | `.sequence` 的当前态是「**序厅**」；`.halls` 的选中项也是「**序厅**」 |
| 它是纯展示的「伪系统标记」 | `taste-skill` 的 §17 REDUCE MICRO-UI CLUTTER 明列 `pseudo-system markers`；`refs/` 里那份规则库见 `spec/AESTHETIC-AUDIT.md` §5.5 |
| 体检自己已经只想留一条 | `AESTHETIC-AUDIT.md:146`：「`minimap` 与 `sequence` **二选一**」 |
| 它还占着 1 处毛玻璃 | 体检 §4.4 把 `nav.sequence`(玻璃) 列进 13 处之一 |

⇒ **删 `.sequence`，留 `.halls`。**（`.halls` 可点、是真正的导航，且 `#/hall` / `#/history` 也在用它，
删掉会让三个沉浸页失去场馆导航。）

### 3.3 改动

**① JS：`demo/src/js/pages/entrance.js` 删 L70-77（含那行注释）**

```js
-        <!-- §1.6：进场序列（底部居中，序厅高亮） -->
-        <nav class="sequence" aria-label="进场序列">
-          <span class="sequence__item">厂区外景</span>
-          <span class="sequence__sep" aria-hidden="true">›</span>
-          <span class="sequence__item is-current" aria-current="step">序厅</span>
-          <span class="sequence__sep" aria-hidden="true">›</span>
-          <span class="sequence__item">铸造馆</span>
-        </nav>
```

**② CSS：`demo/src/styles/layout.css` 删 L679-703（注释 + 四条规则）**

```css
-/* 进场序列（底部居中）：闭合「厂区外景 → 序厅 → 铸造馆」 */
-.sequence { … }                       /* L680-697 */
-.sequence__item { … }                 /* L698 */
-.sequence__item.is-current { … }      /* L699-702 */
-.sequence__sep { … }                  /* L703 */
```

> ⚠️ **四条一起删**（`.sequence` / `.sequence__item` / `.sequence__item.is-current` / `.sequence__sep`）。
> 漏删任何一条，`scan_dead_selectors.py` 就会从 **0** 回到非 0（那个扫描器按类名找消费者，
> 删了 JS 而留下 CSS ⇒ 立刻报"CSS 里有、源码里没有"）。

**③ 规格同步（设计侧已改，实现方只需对齐）**

`spec/ENTRANCE-HISTORY-SPEC.md` 里三处提到「进场序列」，**设计侧已在本轮同步改掉**：

| 位置 | 原文 | 改为 |
|---|---|---|
| L34 | 「序厅 → 闭合『厂区外景 → 序厅 → 铸造馆』的**进场序列**」 | 改为描述**`#/entrance` 只保留场馆药丸一条导航** |
| L130 | 表行「进场序列（底部居中）｜`厂区外景 › 序厅 › 铸造馆`，序厅为橙色高亮态｜新增」 | 整行删除，并在表下加一行勘误 |
| L150 | E5 页面清单里的「…信息卡 / **进场序列** / 操作提示 齐备」 | 去掉「进场序列」，其余不动 |

### 3.4 ⚠️ 三条不要顺手

1. **不要删 `.halls`，也不要动 `.halls-notice`。** 前者是唯一剩下的导航，后者是"筹备中"提示条。
2. **不要动 `.hint`（拖拽环视 · 滚轮缩放）与 `.entrance-strip`（说明条）。** 它们不是导航，
   是操作提示与真实馆藏说明 —— `.entrance-strip` 那句《铁流凝变》**是真实馆藏锚点，一字不许改**。
3. **不要为了"补回来"而把 `.sequence` 改造成可点。** 这一批的意图是**减一条**，
   不是把展示条升级成导航（那会让 `.halls` 与它继续重复）。

### 3.5 验收读数（1440×900，`#/entrance`）

| 项 | 期望 |
|---|---|
| `document.querySelectorAll('nav').length` | **1** |
| 该 `<nav>` 的 `className` | **`halls`** |
| `document.querySelector('.sequence')` | **`null`** |
| `.halls` 的矩形 | **`y = 64`**（= 新的 HUD 高，见 §1.5 消费者 #2），`x / w / h` 与改动前逐值相同 |
| `.exhibit-card` / `.entrance-strip` / `.hint` 的矩形 | `y` **各 +8**（随 HUD 变高整页下移），`x / w / h` 不变 |
| 横向溢出 | **仍为 0** |

> ⚠️ **这一节的基线必须在 §1 之后取。** §1 把 HUD 从 56 抬到 64，本页所有绝对定位浮层
> （`.halls` 在 `top: var(--hud-h)`、`.halls-notice` 在 `calc(var(--hud-h) + 60px)`）都会**下移 8px**；
> 若拿"改动前"当基线去比，会误判成"删 `.sequence` 引起了位移"。
> **正确做法：先只做 §1 → 截一组基线 → 再做 §3 → 比这一组。**

---

## 4. ⏸ 待裁定 · P1-10 首屏标题基线（**本轮不做，只留证**）

体检 §6 的 **P1-10** 写的是「首屏 h1 顶边**统一一个值**（四页四个 → 一个）」。
我按红线「**落数值判据前先自检：所有条款同时成立时能否达成**」先做了取证，**结论是这条不能直接做**：

### 4.1 实测（三个视口高度，逐页）

| 页 | 选择器 | 1440×900 | 1440×1080 | 1440×720 | 极差 |
|---|---|---|---|---|---|
| `/` | `h1` | **249** | 249 | 249 | **0** ✅ |
| `#/about` | `h1` | **186** | 186 | 186 | **0** ✅ |
| `#/history` | `h1.history__title` | **182** | 182 | 182 | **0** ✅ |
| `#/vault` | `h1.vault__title` | **200** | **290** | **193** | **97** ❌ |

（体检 §4.5 L5 记的 249 / 182 / 200 / 186 与上表 900 那一列**逐值一致**，那条读数是对的。）

> ⚠️ **本批落地后，通史馆那一格会变成 `190`（182 + 8）。** 因为 §1 把 `--hud-h` 从 56 抬到 64，
> 而 `#/history` 的标题位置由 `padding-top: calc(var(--hud-h) + 60px)` 决定（`layout.css:713`）。
> **这不影响本节结论**（"四页四个值"照旧成立，只是其中一个数变了）；
> 但**实现后若有人复跑本表，请以本注为准，不要把它当成新缺陷**。其余三页（`/` · `#/about` · `#/vault`）
> 的机制与 HUD 高度无关，**数值不变**。

### 4.2 为什么"四页一个值"做不到

四个值来自**四种不同的布局机制**，不是一个可以调平的参数：

| 页 | 机制 | 结果 |
|---|---|---|
| `/` | `.hero { flex:1 1 auto; align-items:center; padding: var(--s8) 0 calc(var(--s8)*1.4) }`（`layout.css:73-80`）—— 内容在 674px 高的 hero 里**垂直居中**，多出 89px 偏移 | 249 |
| `#/about` | 同一套标记，但 hero 只有 341px 高 ⇒ 内容正好填满，**无居中偏移** | 186 |
| `#/history` | `.hud` 是 `absolute`（不占流），内容让位靠 `padding-top: calc(var(--hud-h) + 60px)`（`layout.css:713`） | 182 |
| `#/vault` | `.vault__right { justify-content: center }`（`layout.css:1113`，注释写明"画稿右栏内容垂直居中（S05 实测）"）⇒ **随视口高度摆动** | 200 / 290 / 193 |

⇒ 把它们压到同一个数，意味着**至少改动 `#/vault` 与 `/` 两页的构图**，
而这两页的构图都是画稿定的（S05 / S01），且**首页 hero 垂直居中本身是刻意的首屏构图**。
按红线「**画稿有的被删掉就必须给替代物**」+「**互斥就列待裁定，不压也不糊**」，
这条**列待裁定**，请用户拍板：

| 方案 | 做法 | 代价 |
|---|---|---|
| **A（建议）** | 只把**那张表显式写进规格**（四页各有值 / 机制 / 稳定性要求），并加一条门禁：**三视口极差 ≤ 2px**。这样"四个值"从**隐式巧合**变成**显式声明**，同时把工牌那 97px 摆动**暴露出来**成为一条明确的待修项 | 视觉上**不变**（本轮零风险）；首页 249 ↔ 关于 186 的 63px 跳动**仍在**，只是被记录 |
| **B** | `layout.css:78` 的 `align-items: center` → `start`，把首页 hero 的 89px 居中偏移去掉 ⇒ 首页 h1 落到 **186**，与关于页一致 | **重排首页首屏构图**（文案与炉子图不再垂直居中，hero 上方多、下方少的空白重新分配）；需**重出画稿 S01** 的等效基准 —— 我无法在改动前确认这样更好看，**不建议盲改** |
| **C** | 把 `#/vault` 的 `justify-content: center` 改成顶部对齐，消掉 97px 摆动 | 工牌右栏是画稿 S05 的构图（居中），改了要重出 S05 的那一栏 |

> 我的建议：**走 A**。A 把问题变成可验收的读数，B/C 是审美取舍、要连画稿一起重出，
> 应该等「审美优化」全部落地后**单独一轮**处理（那时 S 系画稿本来就要统一重拍）。

---

## 5. 不许动（本轮红线）

1. **`#/vault` 没有头部** —— 画稿如此（`vault.js:163`），不要顺手补导航。
2. **`tokens.css` 的定义值** —— 头部写着"实现方不要改这里的值"。
   **唯一的例外已由用户裁定授权：`--hud-h` 56 → 64（§1.3 ①）。** 除它以外一律只**引用**，不**定义**。
3. **`--topbar-h` 的移动端 60px**（`layout.css:617`）与 `.nav { display: none }`（L619）。
4. **`layout.css:78` 的 `align-items: center`** —— 见 §4，待裁定，别顺手改。
5. **`.hud` 的 `position: absolute` 与渐变底**（`layout.css:120-133`）—— 沉浸页头部不是 sticky，是刻意的。
6. **史实数字与文案**（1955 / 4 小时 / C620-1 / 22 × 11.5 m / 50 吨 / 《铁流凝变》）。
7. **全站横向溢出必须保持 0**（八页现已全 0）—— ⚠️ **本批把三个 HUD 页的内容下推了 8px，这条要重新验。**
8. **八页门禁不许改判据糊过去**：改动前先把门禁跑一遍留基线。
9. **`.turn__mark` 的圆角与底色**（`L852` / `L853`）与 `L857` 的 `:hover` —— 见 §2.2 ③④，
   **三处必须一起动**（只改底色会让 `:hover` 变空操作；只改圆角会留下"七页橙、车削近黑"）。

---

## 6. 门禁影响（**实现前先读这一节**）

### 6.1 必改：**0 处**（换目标值之后，上一稿要求的那一条自动消失）

> 上一稿（目标是 56）要求把 `verify_turn.py:180` 的 `64` 改成 `56`。
> **换成 64 之后这条不需要改了** —— `L180` 断言的 `approx(lay["topbar"]["h"], 64, 2)`
> 正好就是车削页的新值（**它本来就没变**）。这是"跟画稿"带来的额外好处，顺手记一下。

已经**逐份扫过全部 20 份 `verify_*.py`**，本批**不需要改任何门禁**：

| 会被改的东西 | 门禁 | 凭据 |
|---|---|---|
| `--hud-h` 56 → 64 | 20 份全部 | **没有任何一处断言 `56` 这个高度**。两份出现过 `56` 的都无关：`verify_turn.py:443/450` 是**权重 56%** 的文案断言，`verify_history_cta.py:141` 是 `.hud__xr` 选择器 |
| `#/cast` 头部 72 → 64（新加 `cast__topbar`） | `verify_cast.py` / `verify_ux.py` | `verify_cast.py` **全篇无任何几何断言**（已逐字符扫过：无 `getBoundingClientRect` / `width` / `height` / `left`）；`verify_ux.py:456-460` 的 `P0F3_cast_steps_no_auto_number` 只锁 `.cast__steps` 首项的 **`firstLeft` = 1118.5 ± 1**（**x 坐标，本批只动高度**；`olLeft` 只记录不断言）。**`.cast` 是 `.page` flex 列里的 `flex: 1 1 auto`（`layout.css:369-379`）⇒ 头部矮 8px 会自动被 main 吃掉，没有任何写死偏移** |
| `.hud` 变高 8px | `verify_step4c_e5.py`（E5 亮度分层） | ②③④ 的采样点是**同一次拍图时用 `window.__proj` 现算的**（`SAMPLES` JSON，读于 L32、用于 L59），**不是写死的屏幕坐标** ⇒ 视口整体下移时采样点跟着移，判据不破 |
| 四页浮层位移 8px | 20 份全部 | **没有任何脚本断言 `.halls` / `.halls-notice` / `.hotspots` / `.exhibit-card` / `.hud` / `.minimap` 的 y 坐标**（已逐份扫过） |
| `.turn__topbar` / `.cast__topbar` 引用 token | `verify_turn.py:180` | 仍断言车削页头部 `64` ⇒ **通过**，不用动 |
| `.logo__mark` / `.turn__mark` 尺寸 / 圆角 / 底色 | 20 份全部 | **`.logo__mark` 与 `.turn__page-title` 一次都没出现过**；`.turn__mark` 只在 `verify_turn.py:114` 出现，且**只读它的 `href`** |

### 6.2 仍然不必改（逐条凭据，写清以免实现方多改）

| 改动 | 脚本 | 凭据 |
|---|---|---|
| `.logo__mark` 8→26（HUD 页）/ 20→26（顶栏页） | 无 | **全仓 `verify_*.py` 里一次都没出现 `.logo__mark`**（20 份逐字符扫过 = **0 处**）⇒ 改它不碰任何判据。⚠️ **不要去找它** —— 它也不在 `HIDE_OVERLAYS` 清单里（那份清单只有 `.hud` / `.halls` / `.hotspots` / `.exhibit-card` / `.entrance-strip` / `.sequence` / `.hint` / `.topbar` / … 等 12 项，**没有 `.logo__mark`**） |
| 删 `.topbar .logo__mark` 覆盖规则（L51-55） | 无 | 同上（该选择器也是一次都没出现） |
| `.turn__mark` r4→r6 且底色 →`--c-iron` | `verify_turn.py:114` | 只读 `href`；全仓无任何脚本断言它的尺寸 / 圆角 / 颜色 |
| 删 `.turn__mark:hover`（L857） | 无 | 无脚本断言 hover 态 |
| 删 `.sequence` | `verify_w1.py:47-49` / `verify_step4.py:68` / `verify_step4a.py:68` / `verify_step4c.py:85` / `verify_w2.py:37` | 同一份 `HIDE_OVERLAYS`，写法是 `const el=document.querySelector(s); if (el) el.style.display='none';` ⇒ **元素不存在也不报错** |
| 删 `.sequence` | `verify_turn.py:545-550` `U12.gate.entranceLayout` | 调的是 `entrance-scene.js:819` 的 `entranceLayout({scene,camera,controls,renderer,views})` —— **纯 3D 场景判据，不碰 DOM 浮层** |
| 头部高度 | `verify_turn.py:556/559` `U12.home375` | 断言的是 `nav_items >= 3`，与头部高度无关 |
| 导航项数 | `verify_ux.py:94/102` | navCount 的基准由 **NAV-TRIM** 改（6→5），**本批不动** |

### 6.3 要求 **新增** 的断言（`scripts` 是代码，按项目惯例属于本轮的 diff）

| 加到 | 断言 id | 内容 |
|---|---|---|
| `verify_w1.py` | `H1_hud_header_unified` | `#/entrance` · `#/hall` · `#/history` 的 `.hud` 高 = **64±1**；且 `.halls` 的 `top` = **64**、`.halls-notice` 的 `top` = **124**（守住"改 token 后四处消费者一起跟动"） |
| `verify_turn.py` | `H2_turn_header_is_immersive` | `.turn__topbar` 高 = **64±1**，且 `main.turn` 的 `top` = **64**（守住"车削页属于沉浸套"这个结论，防止以后又被单独改回去） |
| `verify_cast.py` | `H3_cast_header_is_immersive` | `#/cast` 的 `.topbar` 高 = **64±1**，且它带 `cast__topbar`、**不带 `.nav`**（守住"无主导航 = 64"这条规则）；`.cast`（main）的高比改动前 **+8** |
| `verify_w1.py` | `H4_brand_mark_unified` | 七页里每个 `.logo__mark` / `.turn__mark` 的 `width`/`height` = **26**、`borderTopLeftRadius` = **6px**、`backgroundColor` = **`rgb(232, 102, 60)`**（三样都要，**"全站一套"必须三项同一值**） |
| `verify_w1.py` | `H5_turn_page_title_style` | `.turn__page-title` 的 `fontSize` = **18px**、`fontWeight` = **600** |
| `verify_step4c.py` | `H6_entrance_single_nav` | `#/entrance` 的 `nav` 数为 **1**、类名为 `halls`、`.sequence` 为 `null`；`.halls` 的 `x/w/h` 与 §3 基线一致 |

> `scan_dead_selectors.py` 本轮应保持 **0**（删 `.sequence` 时 CSS 与 JS 同删；删 `.topbar .logo__mark` 覆盖规则不产生死选择器，因为 `.logo__mark` 的基础规则还在）。它是**验收工具**，不是要改的脚本。

---

## 7. 体积

本批是「改 1 个 token 值 + **2 处高度改引用** + **1 处 JS 加类名** + 3 组尺寸 + 删 2 条规则
+ 删 **8 行**标记与 **31 行** CSS」，**净增应为负**（删的比加的多）。

> 逐项点清，免得对账时对不上：
> **加** —— CSS 新增 `.cast__topbar { height: var(--hud-h); }` = **1 行**（JS 侧是给已有行加一个类名，**不新增行**）；
> **删** —— JS `entrance.js:70-77` = **8 行**；CSS `.sequence` 四条 `L679-703` = **25 行**、
> `.topbar .logo__mark` 覆盖 `L51-55` = **5 行**、`.turn__mark:hover` `L857` = **1 行**，CSS 合计 **31 行**。

| | 现值（2026-09-24 实现 P0 后） |
|---|---|
| JS `index-BCJFVi8a.js` | raw 704,987 B · **gzip(9) 205,964 B**（预算 205,969） |
| CSS `index-lHDqCoa_.css` | raw 36,232 B · gzip(9) 7,269 B |

**预期**：
- JS gzip **−20 ~ −120 B**（少 8 行模板字符串含那行注释；`class="topbar cast__topbar"` 加回 14 个字符
  ⇒ **净减**，量不大）
- CSS gzip **−90 ~ −220 B**（少 25 行 `.sequence` 四条规则含注释 + 5 行 `.topbar .logo__mark` 覆盖
  + 1 行 `.turn__mark:hover`，加回 1 行 `.cast__topbar`；`26` 比 `8`/`20` 只多 1 个字符）
- ⚠️ **`--hud-h` 从 `56px` 改成 `64px` 是"同位数"，字节数不变** —— 若 CSS 体积不降反升超过 100 B，
  先怀疑是不是顺手改了别的。

---

## 8. 出门自检（实现方照做）

```bash
# 0) 【**设计侧出稿前**用 · ⛔ 不要当验收】本份提示词的行号 / 数值核对
#    它比对的是**改动前**的代码（56 / 8×8 / 20×20 / --c-surface-2 …）
#    ⇒ 本批**落地之后它必然转红** —— 那不是回归，是它的使命结束了
#    （本项目惯例：`check_p0_fixes_prompt.py` / `check_ledger_prompt.py` 同样如此）
python .workbuddy/check_header_nav_prompt.py     # 出稿前期望：全绿

# 1) 死选择器仍为 0（删 .sequence 的验收）
python .workbuddy/scan_dead_selectors.py         # 期望：合计可疑 0 个

# 2) 六道门禁不回退（本批**必改 0 处**，见 §6.1）
python .workbuddy/verify_turn.py                 # 期望：42/43（唯一红仍是既有 D1 K13b）
python .workbuddy/verify_w1.py
python .workbuddy/verify_ux.py                   # 期望：47/47
python .workbuddy/verify_vault.py                # 期望：41/41
python .workbuddy/verify_cast.py                 # 期望：E9 / T7 PASS
python .workbuddy/verify_step4c.py

# 3) 重建 + 体积
cd demo && node node_modules/vite/bin/vite.js build
```

**交付自述**：`spec/IMPLEMENTATION-HEADER-NAV.md`，含
①三处 diff 摘要（**必须写明 `--hud-h` 换了值、以及 §6.1 为什么 0 处门禁要改**）
②§1.6 / §2.4 / §3.5 的验收读数**原始输出**（§3.5 的基线要在 §1 之后取，见该节 ⚠️）
③`scan_dead_selectors.py` 前后读数 ④新增断言清单（**H1–H6**，见 §6.3）与结果
⑤新产物文件名与 gzip 体积（与 §7 的预期对账）
⑥**三个 HUD 页内容下移 8px 后的逐页截图**（看有没有新溢出 / 新遮挡 —— 本批唯一有视觉后果的地方）。

---

## 9. 本批**不**包含的（别做过头）

| 项 | 为什么不在本批 | 归哪一批 |
|---|---|---|
| 毛玻璃 13 → ≤2 处 | 改视觉语言，与"统一"混做会说不清是谁引起的回归 | P1-7 |
| `.turn__topbar` 去掉 sticky / 玻璃 / 下边框 | 同上 | P1-7 |
| 暗底去发光（4 处） | 同上 | P1-8 |
| `.eyebrow::before` 橙色小竖条等 4 种"文字前小色块" | 同上 | P1-9 |
| 圆角 11 → 5 档 · 字号 18 → ≤9 档 · display 字距 | 全局尺度，影响面比头部大得多，单独一批 | P1-4~6 |
| 首屏基线（P1-10） | **待裁定**，见 §4 | 待用户拍板 |
| ~~`.turn__mark` 的**底色**~~（**已并入本批**，原列待裁定） | 出稿时逐页实测发现：八页里只有车削是近黑方块，画稿 S04 画的是铁水橙，且该选择器**任何规格都没定义过** ⇒ 按「规格 > 画稿 > 代码」= 画稿胜出，直接并入 §2.2 ③④（**已同步进体检 §4.5 L2b**） | ✅ 已并入本批 |
| **画稿重出**（S01 / S02 / S03 / S04 / S07 / S08 / S11 —— **七张的头部那一行**） | 视觉基准的更新，**不是代码交付物**。⚠️ **本行上一稿把话说反了，已改**：本批落地后，**七张的头部高度会与成品逐张对齐**（72 / 64 / 64 / 64 / 64 / 64 / 72 —— **第一次对齐**），不是"不再一致"。真正还差的只有 **S01 的标记 30 vs 成品 26** 与 **S11 的 18 vs 26**，外加各稿**顶栏导航项**本身的新旧差异（见 `design/README.md`）。⇒ **重出画稿的唯一必要理由是那两处标记，不是高度** | 设计侧另行安排（或随「审美优化」全部落地后统一重拍） |
| **`ENTRANCE-HISTORY-SPEC` 的回改**（设计侧已做） | 该规格 L142 上一轮被**错改成 56**（向代码看齐，方向反了 —— 优先级是「规格 > 画稿 > 代码」）；本次已按裁定回改为 **64**，并同步 §2 通史馆表的 `HUD（64px）` 口径 | ✅ 已完成，实现方无需动作 |
| `_clone.sh` / `refs/` 补齐 | 与本作品无关（参考库不进构建） | 不排期 |
