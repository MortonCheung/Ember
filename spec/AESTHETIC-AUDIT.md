# 全站审美体检 + 去 AI 感诊断

> **状态**：设计侧诊断报告，出稿 **2026-09-23**。**不是提示词**，不进「可发提示词」计数。
> `spec/` 里**此刻可发的提示词 = 0 份**（`PROMPT-P1-4-6.md` 已于 2026-09-24 **第十一批实现并归档** → `archive/spec/PROMPT-P1-4-6.md`；此前依次为「1 份 / 第十批」、「2 份 / 第十批出稿当晚」、「0 份 / 第九批归档后」）。`archive/spec/` 累计 23 份。
> **本文不改代码**，只给读数、判据与改造方向；真正动手要另出提示词。
> **取证可复算**：18 帧截图 + 八页运行时读数（脚本与原始 JSON 见 §2）。
> **触发**：用户原话「目前就是把首页的数字藏品功能去掉吧，然后就可以开始进行审美优化了」
> + 「浏览这几个 skill 用处，来**去除 ai 感**。ai 感主要就是：**大框套小框，卡片堆卡片，
> 文字前加图标，乱用毛玻璃，页面逻辑混乱**」。

---

## 0. 一句话结论

八页**能跑、信息齐、八页横向溢出全为 0**（移动端没有横向滚动条，这点是干净的）。
但往下看，它们**长得像同一个模板套了八遍**：近黑底 + 唯一橙 + 发光边缘 + 半透明毛玻璃 +
胶囊药丸 + 卡片墙。

> 而「**近黑底 + 一个霓虹强调色 + 发光边缘**」正是公共设计基准库点名的 AI 默认长相之一。
> `refs/impeccable/skill/reference/new-work.md:67` 原文（讲模型在没有被指定美学时会掉进的三种套路）：
>
> *"AI-generated interfaces cluster around a few looks regardless of subject: warm cream ground,
> high-contrast serif display, and a terracotta or signal-red accent; **near-black with one neon
> accent and glowing edges**; broadsheet-editorial hairlines, italic display serif, and small
> tracked mono labels."*
>
> **第二条就是我们现在这张脸。** 这不是"丑"，是**"可被猜中"**——评委见过的第 40 个同款。

---

## 1. 体检怎么看（判据从哪来）

这一轮不是凭空审美，是**对着一批真实设计系统的成文纪律**来量。参考库已落地到 `refs/`（§5）：

| 判据来源 | 它给我什么 |
|---|---|
| `refs/awesome-design-md/`（**74 份**真实品牌 DESIGN.md） | 可统计的"正常值"：圆角几档、字距多紧、section 节奏多大、**31 处明文禁止暗底投影**、**25 处明文禁止渐变/发光** |
| `refs/impeccable/`（设计批评 skill + Rust 检测器） | 一套**成句的 AI 味规则名**与阈值：`side-tab` `dark-glow` `radial-halo` `gradient-text` `ai-color-palette` `icon-tile-stack` `hero-eyebrow` `monotonous-spacing` `aphoristic-cadence` `em-dash-overuse` |
| `refs/inspira-ui/`（Aceternity / Magic UI 的 Vue 移植） | **AI 味组件词表本身**：aurora-background / particles-bg / neural-background / liquid-glass / neon-border / bento-grid / card-spotlight … 这份目录就是"一用就满屏 AI 味"的黑名单 |
| `refs/taste-skill/`（**10 份**反 AI 味 `SKILL.md`，MIT） | **成章的否定式规则**：专章「**ANTI-NESTED-BOX**」+「**REDUCE MICRO-UI CLUTTER**」，外加九段审计表与一份 Fix Priority 施工序 —— **你点名的五项它逐条都有条款**（§5.5 对表） |
| `refs/lottie-web/`（动画运行时）· `refs/ui-ux-pro-max-skill/`（**双双未落地**，沙箱带宽 ~16 KB/s） | 见 §5.4 / §5.6 —— **是「能力」不是「判据」**；**本报告一条判据都不依赖它们**（治 AI 感的四份都在本地：§5.1/§5.2/§5.3/§5.5） |

**"正常值"锚点（从 74 份里量出来的）**：

| 维度 | 74 家实测 | 我们 | 差多少 |
|---|---|---|---|
| 圆角档位 | 去重后 **中位 6 档**（最少 2：bugatti / dell-1996 / wired） | **11 档** | 超上限 |
| Display 字距（≥48px） | **中位 −2.08%**（-3.75% ~ -1.00%） | **−1.0%**（首页/关于 h1），44px 与 34px 两处**干脆是 0** | 偏松，且不统一 |
| 暗底投影 | **31 处明文禁止**，一律改用"面层阶梯 + 1px 发丝线" | 用 1 处 40px 大投影 + 4 处发光 | 方向相反 |
| 渐变/发光 | **25 家明文禁止**（tesla / bugatti / lamborghini / theverge / linear / airtable …） | **8 处渐变 + 4 处发光** | 方向相反 |
| 毛玻璃 | 40/74 提到 `backdrop`，但**没有一家把它当通用范式**；`bugatti` 是"no glassmorphism" | **13 处声明 / 运行时命中 18 个元素** | 超量 |

---

## 2. 取证方式（别人能重跑）

```bash
# 1) 起预览（串行！probe / sweep / screenshot / measure 共用 Edge profile）
cd demo && node node_modules/vite/bin/vite.js preview --port 4173 --strictPort

# 2) 截图 18 帧（八页 × 1440×900 + 375×812，另加首页账本 2 帧）
bash .workbuddy/shoot_audit.sh            # 产物 .workbuddy/shots/audit_*.png

# 3) 运行时读数（毛玻璃/发光/渐变/圆角/字号/颜色/头部/关键矩形）
python .workbuddy/measure_audit.py        # 产物 .workbuddy/shots/audit_measure.json
```

- `tools/screenshot.py` 本轮**加了两个可选参数**（视口宽/高，默认仍是 1440×900，向后兼容）——
  因为此前它写死 1440，量不了移动端。
- `.workbuddy/measure_audit.py` **本轮新建**：把"AI 感"从形容词变成读数。
- **交付图**：`design/AUDIT-全站八页-1440.png` · `design/AUDIT-全站八页-375.png` ·
  `design/AUDIT-首页账本三屏.png`。

---

## 3. 硬读数（八页合计，来自 `audit_measure.json`）

| 读数 | 值 |
|---|---|
| 毛玻璃：CSS 声明处 | **13 处**（base.css 1 + layout.css 12） |
| 毛玻璃：运行时命中元素 | **18 个** |
| 发光元素 | **4 个**（两处橙色 8px 光晕 + 炉口 14px/3px + 炉身 drop-shadow） |
| 渐变元素 | **8 个**（含首页「炉子」一张卡上叠了 radial + linear + repeating-linear 三层） |
| 圆角取值 | **11 种**：2 / 1 / 12 / 6 / 999 / 50% / 8 / 10 / 3 / 14 / 4 |
| 字号取值 | **18 种**：15 / 12 / 11 / 18 / 13 / 16 / 20 / **22.5** / 48 / 28 / 22 / **48.96** / **13.3333** / 14 / 34 / 10 / 40 / 64（token 表只有 7 档） |
| 前景色取值 | **10 种**（含用 `--c-line` 描边色当文字色，见 §4.3） |
| 背景色取值 | **17 种**（`#232A33` 一个字面量吃了 1069 个元素；`#1F242B` token 只用了 7 个） |
| 头部高度 | **72 / 64 / 56 / 无 —— 四个值**（§4.5；**代码口径**。⚠️ 画稿口径只有 **72 / 64** 两套，目标见 §6 P1-1） |
| 铁水橙命中可见元素 | **52 个** |
| 首页首屏 h1 顶边 | 首页 **249** · 通史馆 **182** · 工牌 **200** · 关于 **186**（四页四个基线） |
| 横向溢出（八页） | **全部 0**（干净，别改坏） |

### 三个"不是设计出来的值"（机器一读就露）

| 值 | 出现在 | 为什么是病灶 |
|---|---|---|
| **22.5px** | 关于页 4 个 `.about__section > h2` | `layout.css:1630` 只给了 `margin-bottom`，**没给 font-size** ⇒ 浏览器默认 `1.5em` × 15px。节标题是"默认值"，不是选出来的 |
| **48.96px** | 首页与关于页的 `h1` | `clamp(36px, 3.4vw, 58px)` 在 1440 宽落成小数。**设计稿上的 58px 从来没在 1440 上出现过** |
| **13.3333px** | 车削页两个滑杆 `<input>` | 没设 `font-size` ⇒ Chrome 表单默认值。同一页的滑杆标签是 11px token |

---

## 4. 你点名的五条，逐条对账

### 4.1 大框套小框

**病灶（可数）**：`#/vault` 一页三层嵌套的"框" ——

```
.vault__card          ← 第 1 层框：380×560 圆角 14 + 1px 线 + 内部再分 head/emblem/meta/foot
  └ .vault__dex       ← 第 2 层框：图鉴栏，自己又有 head + 12 格
      └ .vault__cell  ← 第 3 层框：每格一个圆角虚线框
          └ .vault__cell-btn  ← 格子里还有一个按钮
```

`.vault__right` 同理：右栏 → `.vault__derivs`（2×2 栅格）→ `.vault__deriv`（4 张卡，各自圆角 10）。
**一页 17 个"格子"，层层都有边框和圆角。**

**参考库怎么说**：`refs/awesome-design-md/design-md/revolut/DESIGN.md` ——
*"Don't pair canvas-dark with another dark surface beyond surface-elevated. **The surface ladder has
only two dark steps.**"* → 暗色体系的**层级步数要少**，靠"亮度台阶"而不是"再套一个框"。

**方向**：把 `--c-surface` / `--c-surface-2` / `--c-line` 收成一条**三阶亮度梯**（canvas → surface → surface-2），
然后**规定：同一屏内最多出现 2 层带边框的容器**。图鉴格去掉外框，改成"只用一个 1px 分隔网格线"。

---

### 4.2 卡片堆卡片

**病灶（可数）**：

- `#/hall` 与 `#/entrance` 是**最重的**：同一张 3D 画面上叠了 **7 个悬浮层** ——
  `.hud`(玻璃) + `nav.halls`(胶囊+玻璃) + `aside.exhibit-card`(玻璃+`0 12px 40px` 投影)
  + `p.hint`(玻璃) + `div.minimap`(玻璃) + `p.entrance-strip`(玻璃) + `nav.sequence`(玻璃)。
  **7 层里有 6 层是毛玻璃**，底下是场景——这就是"卡片堆卡片"的极限形态。
- `#/turn` 右栏 `.turn__panel` 内：标题块 → 分隔线 → 空 → `团队协作积分` 标签 → 2 个幽灵按钮。
  面板矩形 **936,96,472,772**，而实际内容在 y≈205 就结束了 ⇒ **面板自己空着 ~350px**（F2）。
- `#/cast` 右栏 `.cast__panel` = **[932, 96, 444, 756]**，底部只留 48px；面板里 3 行打分占位（`– – –`）
  下面是 ~160px 空白，再是 3 个按钮 ⇒ 面板高度是被"必须撑满"撑出来的，不是内容撑出来的。

**参考库怎么说**（这一条是 74 家里最一致的一条，**81 处**提及投影/高度）：
`hashicorp` / `composio` / `cursor` / `raycast` / `framer` 五家给了同一句话 ——
*"Use **surface lift** (canvas → surface-1 → surface-2) to express hierarchy on dark; **don't add
drop shadows on dark**. Elevation is built from the surface ladder, not from shadows."*

**方向**：① 3D 页的悬浮层从 7 降到 **≤3**（`.hint` 并进 `.hud`；`minimap` 与 `sequence` 二选一）；
② 面板高度**由内容决定**，不要撑满——空档要么补真内容，要么把面板收窄、让场景透出来。

---

### 4.3 文字前加图标

**病灶（可数）**：站里的"文字前的小色块"共 **4 种**，尺寸和逻辑都不一样：

| 位置 | 形状 | 代码 |
|---|---|---|
| 全站 eyebrow（"序厅 · 铁流凝变"…） | **3×12 橙色竖条** | `base.css:96-102` `.eyebrow::before` |
| 顶栏品牌标记 | 20×20 圆角 6 橙方块（**已改为 26×26 r6，见 §6 P1-2 ✅**） | `layout.css:52` `.topbar .logo__mark` |
| HUD 徽标 | 6×6 橙圆点 **+ 8px 光晕** | `layout.css:158-162` `.hud__dot` |
| 时间轴关键节点 | 圆点 **+ 8px 光晕** | `layout.css:787` `.timeline__dot` |

还有 **12 个图鉴格里的 34×34 图标**（`.vault__cell-icon`）。

**参考库怎么说**：`impeccable` 里有两条相邻规则——
`accent-dash`（文字旁 8–80 × 1–6 的强调色小横条）与 `side-tab`（贴容器内缘、3–12px 宽、高≥容器一半的强调色竖条）。
**诚实说**：我们的 3×12 竖条落在两条阈值的**缝里**，机器扫不到。
但**形状与用意正是这两条要抓的东西**——"在文字前面放一个纯装饰的强调色小方块"。
`hero-eyebrow` 规则也只问一件事：**h1 前面那个小标签，是不是纯装饰。**

业界更硬的判据来自 `cal` / `claude` 两家：
*"Embed real product UI fragments inside marketing cards. **Don't paint marketing illustrations of
the product when you can show the product itself.**"*
→ 文字前面应该放**真的东西**（一张真图、一个真数字、一段真代码），不是放一个几何小色块。

**方向**：① `.eyebrow::before` 的橙色小竖条**删掉**——eyebrow 靠字距（各家用 **+0.4px 正字距**）
和颜色区分就够了，不需要再插一块色；② 4 种"小色块"收到 **1 种**规格；
③ 首页账本的大数字（1000 / 69 / 50 吨）已经是"真东西"，继续往这个方向加，别再补装饰图标。

---

### 4.4 乱用毛玻璃

**病灶（可数）**：**13 处声明、18 个运行时元素**。最典型的配方是同一元素同时踩三样：

```css
nav.halls > button.halls__item {
  border-radius: 999px;              /* 胶囊 */
  background: rgba(23,27,33,.72);    /* 半透 —— 且 #171B21 是 token，.72 这个值不是 */
  backdrop-filter: blur(8px);        /* 毛玻璃 */
}
```

`.hud` 更极端：**绝对定位 + 竖向三段渐变**（`rgba(14,17,22,.88 → .62 → 0)`）**+ 底下是 3D 场景**。

**参考库怎么说**：74 家里 **没有一家**把毛玻璃当通用范式。
`bugatti` 明文 *"The system uses **no shadows, no glassmorphism, no gradients**. Depth comes
entirely from photography."*；`theverge` 明文 *"**No gradients, no glows, no atmospheric blurs**
anywhere."*；
`cal` 那句最狠：*"Never **blur the boundary**."*

**方向**：毛玻璃从 13 处**收到 ≤2 处**，且只给"必须有东西从它底下经过"的**唯一一处吸顶条**用。
其余全部改成**实色面层**（阶梯里挑一阶）+ 1px 发丝线。3D 页的 `.hud` 渐变改成**一条实色带**，
让场景从带子下面开始，而不是糊过去。

---

### 4.5 页面逻辑混乱

**这条是五条里最伤、也最容易改的。** 全部有读数：

| # | 病灶 | 读数 / 证据 |
|---|---|---|
| **L1** | **头部四套并存** | `.topbar` **72px**（首页/浇铸/关于）· `.turn__topbar` **64px** 覆盖了 `.topbar`（车削）· `.hud` **56px** 绝对定位 + 无玻璃（序厅/通史馆/铸造馆）· `#/vault` **没有头部**，只有一颗 `fixed` 返回键（h=32.4）。⚠️ **2026-09-24 像素复核**：这四套是**代码**的；**画稿只有两套 —— 72（首页/账本）与 64（其余全部，含车削）**（`probe_canvas_header_h.py`：S01=72 · S02/S03/S04/S07/S08=64 · S11=72）。**要收的是代码里的 56，不是车削的 64。** |
| **L2** | **同一个"品牌标记 + 页名"，三种写法** | 首页/浇铸/关于：`.logo` + `.logo__mark` 20×20 r6 + 页名 **18px/600**；车削：`.turn__mark` **26×26 r4**（图上只剩一个灰方块，无字标）+ 页名 **16px/500**。⚠️ **2026-09-24 像素复核**：画稿上的标记尺寸是 **30（S01）/ 26（S02·S03·S04·S07·S08）/ 18（S11，照旧代码重拍）** —— **画稿自己就不一致**；**26 是多数值**，且**车削页的代码本来就是 26** ⇒ 统一目标 = **26×26 r6**（已裁定） |
| **L2b** | **车削页品牌标记的"底色"与画稿不符 —— 画稿上是橙色，代码画成近黑** | 实测 computed `background-color` = **`rgb(31, 36, 43)`** = `--c-surface-2`（`layout.css:853`）；其余七页 `.logo__mark` 一律 **`rgb(232, 102, 60)`** = `--c-iron`。而 `design/S04-协作车削.png` 的头部左上角**是橙色方块**。深色头部上 **`#1F242B` 与底色几乎无差** ⇒ 实拍 `.workbuddy/shots/turn.png` 里只能勉强看出一个略亮的方块。**`turn__mark` 在任何规格里都没有定义**（全仓 `*.md` 扫过：只在本文 L2 与 `IMPLEMENTATION-TURN.md` 的 U11 里出现过，后者只记它的 `href`）⇒ 按「规格 > **画稿** > 代码」的优先级，**画稿的橙色应当胜出**。（代码里 `:hover` 会变 `--c-iron`，但静息态是近黑 —— 悬停不构成"标记存在"的替代物） |
| **L3** | **一页三条导航** | `#/entrance`：顶栏 NAV + 场馆药丸 `nav.halls` + 底部 `nav.sequence`（厂区外景｜序厅·铸造馆）。**"序厅"同时出现在后两条里** |
| **L4** | **同一入口下的两页行为不同** | 顶栏「互动体验」→ `#/cast`；从 cast 进 `#/turn`。但 `#/cast` 的 logo 点回 **`#/`**，`#/turn` 的 mark 点回 **`#/cast`** —— 两页的"返回"语义不一样，且都没有面包屑 |
| **L5** | **首屏基线四页四个值** | h1 顶边：首页 249 / 通史馆 182 / 工牌 200 / 关于 186。顶栏高度又不同（L1）⇒ **换页时标题会上下跳 60px+**。⚠️ 本批（`PROMPT-HEADER-NAV`）**已于 2026-09-24 落地**，通史馆那一格**已实测变为 190（182 + 8）**，其余三页不变（自述 §10-⑥）—— 因为 `--hud-h` 56→64，`#/history` 的标题靠 `padding-top: calc(var(--hud-h) + 60px)` 定位（`layout.css:713`）。**「四页四个值」照旧成立，别把 190 当成新缺陷** |
| **L6** | **文案与语义相反（F1）** | `vault.js:361` `badgeEl.textContent = \`已解锁 ${d.need}/12\`` —— 那是**门槛**。同一张卡展开后 `vault.js:355` 写的是「**需要解锁** 3 件馆藏」。**同一张卡上两句话互斥** |
| **L7** | **编号重复** | `#/cast` 顶栏步骤是 `<ol>` + 文案自带 `①`（`cast.js:45`）。`base.css:28` 只重置了 `ul`，没管 `ol` ⇒ 屏幕上实际显示 **"1. ① 取样  2. ② 调温 …"** |
| **L8** | **对比度失效** | `layout.css:1213-1218` `.vault__cell-no { color: var(--c-line) }` —— 拿**描边色**当文字色。`#2E3640` 在 `#0E1116` 上实测 **≈1.4:1**，12 个格子编号实质不可读 |

**参考库怎么说**：`impeccable` 把这类问题归到 `monotonous-spacing`（节奏单调）与
`aphoristic-cadence`（格言式节奏）；而 74 家给的是**节奏定额**：
`airtable` 96px 一档、`bmw` 80px、`bugatti` **120px**，三家都写明 *"the rhythm is part of the editorial pacing"*。
⇒ **section 间距要恒定，不是一个页面一个样。**

**方向**：① 头部**收敛成两套**（滚动页 72 / 沉浸式 3D 页 **64** —— 画稿口径，2026-09-24 裁定），车削页并入其中一套；
② 品牌标记**全站一套尺寸**；③ 一页**最多两条导航**，`#/entrance` 的三条砍到两条；
④ 首屏标题顶边**统一到一个值**；⑤ L6 / L7 / L8 是**必修缺陷**，不等审美，直接修。

---

## 5. 六个参考库：各自能干什么、别怎么用

> 落地位置 `refs/`（**参考物，不是依赖**：不进 `demo/src`、不进构建、不进交付包）。

### 5.1 `refs/awesome-design-md/` — 74 份真实品牌的成文设计系统 ✅ 已落地

**是什么**：Google Stitch 提出的 `DESIGN.md` 格式（纯 markdown 设计系统文档），74 个真实站点各一份。
**怎么用**：**当"正常值"的尺子**。本轮 §1 的每一行锚点都是从它量的（圆角中位 6 档、display 字距中位 −2.08%、
81 处禁暗底投影、25 家禁渐变）。改造时先量我们的值，再对着它的中位收。
**别怎么用**：不要抄某个品牌的配色。它是**尺子**，不是**样式表**。

### 5.2 `refs/impeccable/` — 设计批评 skill + 一套可跑的"AI 味"检测器 ✅ 已落地

**是什么**：一个完整的 `skill/`（`reference/critique.md` 43KB、`distill.md`、`quieter.md`、
`craft-floor.md`、`audit.md`…）+ 一个 **Rust 写的检测器**（`crates/detect`，读 HTML/CSS，离线）。
**怎么用**：它的**规则名就是一份 AI 味清单**——

```
side-tab   dark-glow   radial-halo   gradient-text   ai-color-palette   icon-tile-stack
hero-eyebrow   monotonous-spacing   aphoristic-cadence   em-dash-overuse   gpt-border-shadow
oversized-h1   gray-on-color   overused-font   google-font   bounce-easing
```

`ai-color-palette` 的判据写得比人话还准（`element_checks.rs:723`）：
*"a rule about the **unchosen** palette: the purple and the cyan a model reaches for when nobody
picked one."* —— 我们**有**选过颜色（铁水橙是有出处的），所以这条我们大概率不红；
**但 `dark-glow` / `radial-halo` / `side-tab` 家族，我们全都在射程里**。
**别怎么用**：它的检测器是给 HTML/CSS 项目设计的，**我们这个项目是 JS 拼 DOM**，
直接跑它只能扫到静态样式表。真要跑，得另起一轮把 `demo/dist` 喂给它——本轮没做，如实记在这。

### 5.3 `refs/inspira-ui/` — **AI 味组件黑名单本身** ✅ 已落地

**是什么**：Aceternity UI + Magic UI 的 Vue 移植。**它的组件目录就是"一用就满屏 AI 味"的词表。**
**怎么用**：**当黑名单读**。对照我们踩中的：

| inspira 的组件 | 我们的对应物 | 状态 |
|---|---|---|
| `liquid-glass` | `.topbar` / `.hud` / `nav.halls` 的 13 处 `backdrop-filter` | **踩中** |
| `lamp-effect` / `glowing-effect` / `neon-border` | `.hud__dot`、`.timeline__dot`、`.hero__furnace-taphole` 的橙光晕 | **踩中** |
| `bento-grid` | 关于页 `.about__layers` 2×2、工牌 `.vault__derivs` 2×2 | **踩中** |
| `card-spotlight` / `glare-card` | `.hero__furnace` 卡上的 radial 光斑 | **踩中** |
| `interactive-grid-pattern` / `flickering-grid` | 首页炉子上的 `repeating-linear-gradient` 网格线（38px 与 26px 两套间距） | **踩中** |
| `particles-bg` / `neural-background` / `aurora-background` | —— | 没踩（**这条要守住**） |
| `gradient-button` / `rainbow-button` | —— | 没踩（**守住**） |

**别怎么用**：**别装它的组件**。这份库的正确读法是"照着它逐条自查有没有"，不是"挑几个装上去"。

### 5.4 `refs/lottie-web/` — 动画运行时（**不是 skill**）

**是什么**：Airbnb 的 Lottie 播放器，播 After Effects 导出的 JSON 动画。
**怎么用**：它是**能力**不是**判据**。真要加动效，用它播"**有人真做过的动画**"，
比用 CSS 手搓粒子/流光/星轨更像成品。
**别怎么用**：**不要为了"有动效"而引入它**——我们的场景已经是 three.js，
再加一层 Lottie 只会让 FPS 和体积双输。**本轮不动。**

### 5.5 `refs/taste-skill/` — **反 AI 味规则库（六份里对我们最对口的一份）** ✅ 已落地

**是什么**：自称 *"The Anti-Slop Frontend Framework for AI Agents"*。一个仓库 10 份可移植 `SKILL.md`
（`skills/` 下：`taste-skill`（v2 主件）· `gpt-tasteskill` · `redesign-skill` · `minimalist-skill` ·
`soft-skill` · `brutalist-skill` · `image-to-code-skill` · `output-skill` · `stitch-skill` · `brandkit`）
+ 3 份出图用的。MIT。

**怎么用**：它把"AI 味"写成了**可执行的否定式规则**，而且**逐条命中你点名的五项**：

| 你点名的 | taste-skill 的对应条款 | 位置 |
|---|---|---|
| **大框套小框** | 专章 **§16 ANTI-NESTED-BOX RULE**：*"Do not default to box-in-box-in-box layouts"*；禁 *"giant rounded section containers wrapping everything"*、*"cards inside larger cards inside outer cards"*，理由是 *"a section should not feel like a prison of containers"*；正面要求 **"one primary framing move rather than many layered frames"** | `image-to-code-skill/SKILL.md:584` |
| 卡片堆卡片 | *"Cards should exist **only when elevation communicates hierarchy**"*；"Generic card look (border + shadow + white background)" 直接列进待清除项 | `redesign-skill/SKILL.md:93` |
| **文字前加图标** | 专章 **§17 REDUCE MICRO-UI CLUTTER RULE**：禁 *"unnecessary pills / pseudo-system markers / **fake control labels**"*、tiny labels | `image-to-code-skill/SKILL.md:610` |
| 乱用毛玻璃 | *"generic glassmorphism on everything"* 被点名是 **LLM 默认值**；并要求玻璃必须给 **`prefers-reduced-transparency` 的实底回退** | `taste-skill/SKILL.md:39` / `:111` |
| 页面逻辑混乱 | `redesign-skill` 的九段审计表（Typography / Color&Surfaces / Layout / Interactivity / Content / Component / Iconography / Code / **Strategic Omissions**）本身就是一张"逻辑有没有漏"的检查表 | `redesign-skill/SKILL.md:16–131` |

**两句"总纲"**（可直接当我们下一轮的判据抬头）：
- `taste-skill/SKILL.md:39`：*"Do not default to: AI-purple gradients, centered hero over dark mesh,
  three equal feature cards, **generic glassmorphism on everything**, infinite-loop micro-animations
  everywhere, Inter + slate-900. **These are the LLM defaults.** Reach past them deliberately."*
- `taste-skill/SKILL.md:15`：*"Most LLM design output is bad because the model jumps to a default
  aesthetic instead of **reading the room**."*

**⚠️ 一条必须记下的反例（免得我们把话说满）**：同一仓库的 `soft-skill/SKILL.md:41` 把**嵌套**当作
**高溢价手法**写进了**正面**清单 —— *"The Double-Bezel (Doppelrand / Nested Architecture)"*：
外层壳（hairline border + `p-1.5` + `rounded-[2rem]`）+ 内层芯。
⇒ **嵌套本身不是罪，"没有理由的嵌套"才是罪。** 判我们的 `#/vault` 多层嵌套时，按
*"这一层在表达什么"* 判，不按"嵌了就砍"。（详见 §4.1。）

**别怎么用**：它的规则**全部是 context-dependent 的**（原文：*"None of it fires automatically"*），
照抄会互相打架——`image-to-code` 禁大圆角包裹，`soft-skill` 偏要 `rounded-[2rem]` 外壳。
**它是"判据库"，不是模板。** 我们只取与"去 AI 感"直接相关的那几章。

**它自带的施工优先序（`redesign-skill/SKILL.md:159` §Fix Priority，可借来当我们下一轮的顺序）**：
①换字体 ②清色板 ③补 hover/active ④布局与间距 ⑤换掉通用组件 ⑥补 loading/empty/error ⑦最后磨字号阶梯。
⚠️ 它把**换字体排第 1**。**（2026-09-24 更新）**中文字体自托管原判「尚未做 ⇒ 第①步对我们不适用」，
现**已落地**（`archive/spec/PROMPT-FONT-SELFHOST.md`，自述 `spec/IMPLEMENTATION-FONT-SELFHOST.md`；
与审美 P1-4/5/6 同批出稿，**先落的是它**）⇒ 第①步**已闭环**，②③④ 照旧可先行。

### 5.6 `refs/ui-ux-pro-max-skill/` — ⏳ 补齐中（**本节为空，不预先编**）

> **落地状态（2026-09-23 深夜）**：**未落地**。六份里五份已落地（见 §5.1–§5.5 的 ✅），
> 只有它与 §5.4 的 `lottie-web` 没下来：本沙箱到 github **~16 KB/s**，
> `gh repo clone` 的 pack 流会中断，codeload tarball 也超时（150 s 只下了 2.38 MB）。
> 已改用**断点续传**再试一次（`.workbuddy/refs_fetch_resume.py`，HTTP Range）—— **这条路也被证伪**：
> `codeload.github.com` 对 tarball **不返回 206 / 不支持 Range**（实测回 HTTP 200），
> 续传只能从头开始；而带宽还在往下掉（16 → ~4.5 KB/s），900s 预算内仍到不了头。**已停，半成品截断回收。**
> ⇒ **下次的正确路径是「GitHub API 列树 + `raw.githubusercontent.com` 逐文件拉」**（单文件小、可 Range），
> 对这种以 markdown 为主的 skill 仓库总量只有几百 KB，是可行的；**不要再用 codeload 拉大仓库。**
>
> **本报告的一 / 二 / 三 / 四 / 六 / 七 / 八节一条判据都不依赖它** ——
> 治"AI 感"的条款来自 §5.5 `taste-skill`（逐条命中五个点名项）、§5.2 `impeccable`、
> §5.3 `inspira-ui`（黑名单本身）与 §5.1 `awesome-design-md`（"正常值"的尺子），**四份都在本地**。
> **等它真下来了再补写实测内容，不预先编。**

---

## 6. 改造清单（按优先级；每条都有读数或行号）

### P0 · 必修缺陷（不是审美，是错）

> ⚠️ **本表已收敛，以 `spec/PROMPT-P0-FIXES.md` 为准**（该稿已于 **2026-09-24 实现归档**，现位于
> `archive/spec/PROMPT-P0-FIXES.md`；自述 `spec/IMPLEMENTATION-P0-FIXES.md`）。出发前把下面 5 条**逐条做了运行时取证**：
> **撤回 1 条**（原 P0-5）、**改写 2 条**（原 P0-1 的真因在规格里、原 P0-2 的对比度读数从 ≈1.4 更正为 **1.55:1**，
> 原 P0-3 的机制由"漏写"更正为"`base.css:28` 只重置了 `ul`，且已用像素取证确认 marker 真的渲染"）。
> 最终落地为 **4 项 FIX**，收敛过程与凭据写在提示词里。

| 编号 | 位置 | 症状 | 依据 |
|---|---|---|---|
| **P0-1** | `vault.js:361` | 门槛写成"已解锁"，与同卡 `vault.js:355` 的"需要解锁 N 件馆藏"**互斥** —— **真因在 `VAULT-SPEC.md` §5.3，规格已同步改掉** | §4.5 L6 = 原 F1 |
| **P0-2** | `layout.css:1213-1218` | 拿 `--c-line`（描边色）当文字色，**实测对比度 1.55:1**（WCAG AA 对 11px 要 4.5:1），12 处 | §4.5 L8 |
| **P0-3** | `cast.js:45` + `base.css:28` | `<ol>` 未清 marker + 文案自带 `①` ⇒ 屏幕显示"1. ① 取样"（**已像素取证**） | §4.5 L7 |
| **P0-4** | `layout.css:1246/1249` | 仍写 `.vault__deriv-name`，9c 已换类名 ⇒ **死样式**（连带锁定态降对比失效） | 原 F3 |
| ~~P0-5~~ | `#/turn` 右栏 | ~~面板 772 高、内容到 y≈205 就结束 ⇒ ~350px 空洞~~ **⛔ 撤回：实测内容排到 y=828，底部只余 40px；那段"空"是 `.turn__collab` 的**画稿有意留白**（`layout.css:1012` 注释：结算后填 44px 大数字）** | 原 §4.2 = 原 F2 |

### P1 · 统一（"像同一个模板"的解药）

> ⚠️ **P1-1 / P1-2 / P1-3 已实现并归档（2026-09-24 第八批）**：提示词 `archive/spec/PROMPT-HEADER-NAV.md` ·
> 自述 `spec/IMPLEMENTATION-HEADER-NAV.md`（目标值以该稿为准 —— 头部 **64**、标记 **26×26 r6**，均跟画稿）。
> **P1-10 拆出待裁定**（该稿 §4）；
> ✅ **P1-4 / P1-5 / P1-6 已实现并归档（2026-09-24 晚出稿 → 第十一批落地，[`archive/spec/PROMPT-P1-4-6.md`](../archive/spec/PROMPT-P1-4-6.md)，自述 [`IMPLEMENTATION-P1-4-6.md`](IMPLEMENTATION-P1-4-6.md)）**
> —— ⚠️ 出稿时**改正了本表这三行的目标值**（表里写的都是"照代码量"或转抄别处的，见下）；
> **P1-7~9 / P1-11~13 未立项**。

| 编号 | 动作 | 目标值（有据） |
|---|---|---|
| **P1-1** ✅ | 头部收成**两套**：滚动页 72 / 沉浸 3D 页 **64**；车削页并入 —— ⚠️ **目标值 2026-09-24 由 56 改为 64（用户裁定，跟画稿）**：本条原写 56 是**照代码量的**，而优先级是「规格 > 画稿 > 代码」；画稿像素实测（`probe_canvas_header_h.py`）干净地只有两套：**72 / 64**。见 §4.5 L1 —— **⛔ 已实现（2026-09-24，`archive/spec/PROMPT-HEADER-NAV.md` 第八批，自述 §1-§2）** | §4.5 L1 + **画稿实测** |
| **P1-2** ✅ | 品牌标记全站**一套尺寸**（**2026-09-24 改定为 `26×26 r6`**，原建议 20×20 —— 画稿实测 30/26/26/26/26/18，**26 是有头部画稿里的多数值**，且车削页代码本来就是 26）—— ⚠️ **2026-09-24 补一条**：尺寸之外，车削页那个标记的**底色**也与画稿不符（画稿橙 / 代码近黑），见 §4.5 **L2b** —— **⛔ 已实现（同上，含 L2b 底色改铁水橙 + 删 `:hover`）** | §4.5 L2 + **L2b** + 画稿实测 |
| **P1-3** ✅ | 一页**最多两条导航**；`#/entrance` 砍掉一条 —— **⛔ 已实现（同上：删 0 可点的 `.sequence`，留可点的 `.halls`）** | §4.5 L3 |
| **P1-4** ✅ | 圆角收档 —— ⚠️ **目标值已由出稿取代本行**：本行原写「11 → 5 档（建议 2 / 6 / 12 / 999 + 0）」，出稿时**画稿像素实测翻案**：画稿上能测到的圆角**全部落在 4 / 6 / 8**（`10 / 12 / 14` 一处证据都没有）⇒ 最终 **11 档 → 5 档**（`2 / 4 / 6 / 8 / 999` + `50%`），且**保留在用的 `4`、把 12 收成 8**，不是本行写的"删掉 4、保留 12"。⚠️ 仍是「**按角色分档**、不是拍平」（`taste-skill` 的"内紧外松"）。**出稿：`archive/spec/PROMPT-P1-4-6.md §2`（49 处逐处映射）—— ⛔ 已实现（2026-09-24，第十一批，自述 §1/§2）** | 画稿实测（`probe_radius_area.py` + `probe_radius_ruler.py`）+ 74 家中位 6 档 |
| **P1-5** ✅ | 字号收档 —— ⚠️ **目标值已由出稿取代本行**：本行原写「18 → ≤9 档」，出稿时按**声明口径**重数 = **19 档 / 98 处**（本报告 §3 的"18 种"是**运行时口径**，把 `48.96 / 13.3333` 当成了 CSS 字面量）⇒ 最终 **19 档 → 7 档**（`11/12/15/18/28/44/64`）；22.5 / 48.96 / 13.3333 三个非设计值照杀。**出稿：`archive/spec/PROMPT-P1-4-6.md §3` —— ⛔ 已实现（2026-09-24，第十一批；§3.4 另新增 1 条 ⇒ 落地后声明总数 **99**，本报告 §3 那句"98 处"是**出稿时**的数）** | §3（**计数以该稿 §1.4 的更正为准**） |
| **P1-6** ✅ | display 字距统一 **−2%** —— ⚠️ **本行后半句「44px 与 34px 两处补上」是误判，出稿时已撤**：`--fs-h1` 是**死 token**（3 处声明、**0 处消费**）⇒ 正确动作是**删掉它**，不是给它补字距。字距本身 **5 档 → 3 档**（`.08em` / `.02em` / `-.02em`），并杀掉全站唯一的绝对单位（`.history__eyebrow` 的 `2px`）。**出稿：`archive/spec/PROMPT-P1-4-6.md §4` —— ⛔ 已实现（2026-09-24，第十一批）** | 74 家中位 −2.08% |
| **P1-7** | 毛玻璃 **13 → ≤2 处**（只给唯一一处吸顶条）；其余改实色 + 1px 线 | §4.4 |
| **P1-8** | 暗底**去掉发光**（4 处），深度改由三阶亮度梯承担 | 74 家 31 处明文 |
| **P1-9** | 删掉 `.eyebrow::before` 的橙色小竖条；4 种"文字前小色块"收成 1 种 | §4.3 |
| **P1-10** | 首屏 h1 顶边**统一一个值**（四页四个 → 一个） | §4.5 L5 |
| **P1-11** | 面层色收成三阶梯；把 `#232A33`(1069处) / `#33241A` / 9 档 `rgba(14,17,22,·)` 收进 token | §3 |
| **P1-12** | 3D 页悬浮层 **7 → ≤3** | §4.2 |
| **P1-13** | 保留的那 ≤2 处毛玻璃，**必须给 `prefers-reduced-transparency` / `prefers-reduced-motion` 的实底回退**（现在没有） | `taste-skill/SKILL.md:111` |

### P2 · 打磨

| 编号 | 动作 |
|---|---|
| **P2-1** | ⛔ **已并入 P1-5（2026-09-24 第十一批，不再单独立项）** ~~`.about__section h2` 补一个**选出来的**字号（token 里的 `--fs-h2` 28 或新增一档），不要 22.5~~ —— `PROMPT-P1-4-6 §3.4` 已把它改成 `font-size: var(--fs-h2)`（28px），**22.5 这个非设计值同时被杀** |
| **P2-2** | 关于页 `LAYERS` 的 `no:'01 · 看见'` 与 `h3:'看见'` **同一张卡上说的是同一件事**，删一处 |
| **P2-3** | `.about__tech` 这个类名被所有节的正文复用（正文叫"tech"），改名 `.about__body` |
| **P2-4** | 首页账本栅格线两套间距（38px / 26px）统一成一套 |
| **P2-5** | 3D 场景材质语言不统一：序厅=暗+橙光 ✅ / 铸造馆=整体灰 / 浇铸=偏绿暗（**绿是这个体系里没有的颜色**）/ 车削=高亮银。建议四场景共用一套光照与粗糙度基线 |
| **P2-6** | `#/cast` 面板里 3 行 `– – –`（未评分态）读起来像坏了，给一个明确的"未浇铸"空态 |

---

## 7. 不许动的（红线）

1. **文案与史实数字**：`PROJECT-BRIEF.md §4` 与 `RENAME-SCOPE.md §0` 里的数字一字不改（含《铁流凝变》22 × 11.5 m、净重 50 t）。
2. **`#/vault` 没有顶栏**是**画稿如此**（`vault.js:163` 已记），除非重出画稿，否则不要顺手补导航。
3. **首页账本三屏**（铁水 1000 格 / 浮雕立面 / 69 年条）是用户亲自提的需求，**只许调不许多删**。
4. **门禁不许改判据糊过去**：`verify_ux.py` **47/47**（2026-09-24 起；本报告出稿时为 46/46）· cast 45/45 · hall 61/61 · entrance 22/22 · turn 63/63。
   本轮任何改动都要先把门禁跑一遍再动。
5. **横向溢出现在是 0**，别改出来。

---

## 8. 下一步（建议的推进顺序）

1. ✅ **P0 已实现**（用户裁定「P0 的先发」，2026-09-23 深夜出稿 → **2026-09-24 实现并归档**）；
   提示词落在 `archive/spec/PROMPT-P0-FIXES.md`，自述 `spec/IMPLEMENTATION-P0-FIXES.md`。
   注意它与本报告 §6 的差异：出发前逐条运行时取证后**收敛为 4 项 FIX**（**原 P0-5 撤回**、
   P0-1 的真因落到规格上、P0-2 的对比度读数更正为 1.55:1）。**以提示词 / 自述为准。**
   —— 四项都是明确的错、与审美无关，所以单独一轮，不与审美混做。
2. 再发**「统一层」P1 轮**——建议**分批**：`P1-1~3`（头部/导航）→ `P1-4~6`（圆角/字号/字距）→
   `P1-7~9` + `P1-13`（毛玻璃/发光/小色块/玻璃回退）→ `P1-10~12`（基线/面层/悬浮层）。**一批一张画稿重出**。
   - ✅ **第一批 `P1-1 / P1-2 / P1-3` 已出稿并实现**（2026-09-24，用户裁定「头部与导航统一」）：
     提示词已移入 `archive/spec/PROMPT-HEADER-NAV.md`（**第八批**），自述 `spec/IMPLEMENTATION-HEADER-NAV.md`
     （**H1–H6 全 PASS** · `verify_ux` **47/47** · `verify_vault` **41/41** · `verify_turn` **43/44** ·
     `scan_dead_selectors` **0** · 体积净 **−256 B**；出门核查 `check_header_nav_prompt.py` 出稿期 **132 绿 / 0 红**，
     落地后已标 ⛔ 使命终结）。
     出稿时对 10 张画稿做了**像素取证**，**推翻了本报告自己给的两个目标值**：
     头部 **56 → 64**、标记 **20×20 → 26×26 r6**（原值都是照**代码**量的，而优先级是
     **「规格 > 画稿 > 代码」**）。同时**新查出一条缺陷**（§4.5 **L2b**：车削页标记的底色与画稿不符）。
     **该批的门禁影响 = 0 处**（换了目标值之后，连 `verify_turn.py:180` 的 64 都不用改了）。
     ⚠️ **执行顺序偏离**：用户指定**先做本批**，故其前提「NAV-TRIM 已落地」**未发生**，导航项数仍按 6 记（自述 §10-④）。
   - ⏸ **`P1-10` 取证后确认"四页一个值"当前不可达**（`#/vault` 在三视口下漂移 **97px**），
     已拆出待裁定，见 `archive/spec/PROMPT-HEADER-NAV.md` §4。
   - ✅ **第二批 `P1-4 / P1-5 / P1-6` 已出稿并落地（2026-09-24 晚出稿 → 第十一批实现归档）**：
     `archive/spec/PROMPT-P1-4-6.md`（自述 `spec/IMPLEMENTATION-P1-4-6.md`）。圆角 **11 档 → 5 档** · 字号 **19 档 → 7 档** ·
     display 字距 **−1% → −2%**；杀 3 个非设计值 + 1 个死 token。**必改门禁 2 处**
     （`verify_w1.py:366` 的 `6px→4px`、`verify_vault.py:223` 的 `34px→28px`，均已按稿改并转绿）。
     出门核查 `check_p1_456_prompt.py` **出稿期 101 绿 / 0 红**（⛔ 落地后 **41 绿 / 60 红** —— 使命终结，非回归）。
     ⚠️ 出稿时**更正了本报告自己的三处事实**（§3 的计数口径、`.about__section h2` 的行号、
     `--fs-h1` 是死 token 而非"要补字距"）—— 见该稿 **§1.4**。
3. 最后 P2 打磨。
4. ~~`NAV-TRIM` 那一轮的实现（`archive/spec/PROMPT-NAV-TRIM.md`）**仍然独立、仍然可发**，与本报告不冲突。~~
   ✅ **2026-09-24 已实现并归档（第九批）** —— 现位于 `archive/spec/PROMPT-NAV-TRIM.md`，
   自述 `spec/IMPLEMENTATION-NAV-TRIM.md`（NAV 6→5 · **N1–N7 全过** · `verify_ux` **47/47** · `verify_vault` **41/41**）。
   ⚠️ 实现方另核出该稿**漏列的一处必改门禁**（`verify_vault.py` 的 `V11a` 也把 `== 6` 写死），已一并修掉（自述 §4-①）。
   截至 2026-09-24（第九批归档后），`spec/` 里待实现的 **0 份**。
5. 🆕 **交付准备第 2 项「字体自托管」已出稿并落地（2026-09-24 晚）**：原 `spec/PROMPT-FONT-SELFHOST.md`，
   现 `archive/spec/PROMPT-FONT-SELFHOST.md`（**第十批**），自述 `spec/IMPLEMENTATION-FONT-SELFHOST.md`。
   它不是审美批次，但**与本报告 §8 的 impeccable 审查直接相关**（`google-font` 检测器）：
   删 `demo/index.html:9-11` 的外链 → **2 个可变 woff2 子集**（实测 **328,156 B / 1,134 字形**，
   比「4 个静态字重」省 **49.5%**）；另修本报告**从未查出的 4 处「同一行两种字体」**
   （`--font-num` 没接 CJK 兜底：`cast.js:307` / `home.js:156` / `home.js:160` / `vault.js:208`）。
   **必改门禁 0 处**（实测确实一处都不必改）· 20 份 `verify_*.py` **前后非零集合完全相同** ·
   拦截外部字体域**逐像素 0 差异**。⚠️ **第十二批已删 Inter**（2026-09-24 晚）：子集 **2 → 1 个 / 286,820 B**（−50,101 B），数字与拉丁改走 Noto Sans SC（其 10 个数字 advance 天然全等 0.5210 em）；自述 `spec/IMPLEMENTATION-FONT-DROP-INTER.md`。⚠️ **第十三批（2026-09-25 凌晨）已把全站中文字体整体换成霞鹜文楷 LXGW WenKai v1.330**（数字与拉丁同栈 ⇒ 上面「改走 Noto Sans SC」这句**已作废**）：静态双字重 Regular 400 / Bold 700 子集，字表覆盖 **1,134 / 1,134**；`demo/public/fonts/` **2 → 3 个 / 473,876 B**；自述 [`spec/IMPLEMENTATION-FONT-CJK-SWAP.md`](IMPLEMENTATION-FONT-CJK-SWAP.md)。
   ⚠️ 落地时另核出**第 5 处**：Canvas `poster.js:119` 用**同一份栈的第二份拷贝**（`FONT_NUM`，
   同样没接 CJK 兜底）画同一串「炉火不灭 · 2026」—— 逐像素实测 `汉字 OLD vs 仅Noto` = **1760 像素差**。
   ~~**本批未修**（动它改 JS 内容 ⇒ 连带 `K11` / 哈希），列待裁定~~ ✅ **已随第十二批修掉**（该行改用 `FONT_CN`，现 `poster.js:118`）。
   ⇒ **截至 2026-09-25（第十三批「全站换霞鹜文楷」落地并归档后，此刻），`spec/` 里待实现的提示词 = 0 份**（`PROMPT-P1-4-6.md` 第十一批 · `PROMPT-FONT-DROP-INTER.md` 第十二批 · `PROMPT-FONT-CJK-SWAP.md` 第十三批，均已实现并归档）；下一步要么用户裁「下一轮做哪几条」，要么先动交付准备。

> ⚠️ 本节只是**顺序建议**，尚未立项。真正动手要按本项目惯例**先出提示词 + 出门核查脚本**，
> 并由用户裁定"哪几条这一轮做"。
