# IMPLEMENTATION · 首页下半段「炉子的账本」（S11 / R1-P3）

> 依据：`archive/spec/PROMPT-HOME-LEDGER.md`（2026-09-23 出稿、当日实现；实现后已按规矩
> 整文件移入 `archive/spec/`，正文一字未改，仅加 ⛔ 抬头）。
> 交付日期：2026-09-23（含当晚 **R2 微调**，见 §6）。构建产物：`demo/dist/assets/index-BxXiIra1.js`
> （691 KB 档，gzip(9) **205,969 B** —— **JS 与 R1 完全同尺寸**，R2 只动 CSS）· `index-DLAUd5Un.css`。
> 门禁：`.workbuddy/verify_ux.py` **46 / 46 全绿**（读数文件 `.workbuddy/_ux_results.json`）。
> ⚠️ **2026-09-24 追记**：`verify_ux.py` 自 P0-FIXES 轮（第七批）起增至 **47 / 47**（新增
> `P0F3_cast_steps_no_auto_number`），构建产物亦换代为 `index-BCJFVi8a.js`（gzip(9) **205,964 B**）。
> **本文件所记的 46/46 与文件名是「当时的读数」，别拿它对今天的门禁。**

---

## 1. 做了什么

**删除**（`demo/src/js/pages/home.js`）
- `AXIS_NODES` 三节点数据（原 L27–40）、`<section class="axis" data-axis>` 整段（原 L93–113）、
  `apply(p)` / `onAxisScroll()`（原 L117–135）。

**新增**
- `home.js`：三屏 `.ledger` 模板（`screen()` / `copy()` 两个骨架复用，模板字符串内零缩进）；
  `buildIronCells()`（1,000 格，999 个 `is-on` + 逐格 `--t` 点亮门槛）、`buildYears()`
  （69 格：前 50 + 第 69 格 `is-on`）、`buildFigures()`（7 个人形复用同一段 SVG）；
  滚动驱动 `applyLedger` / `onLedgerScroll` —— **1 个 `scroll` 监听（`{passive:true}`）+
  1 个 CSS 变量 `--ledger-p`**，`dispose()` 对称 `removeEventListener`。
- `layout.css`：`.axis` 区段整块换成 `.ledger` 区段（pin / 三屏绝对定位叠放 / 交叉淡入淡出
  只动 `opacity` / `.ledger__inner` 两栏 `minmax(0,520px) minmax(0,1fr)` / 格子 `is-on::after`
  载橙 / 人形 `nth-of-type` 出现次序 / 浮雕箱体 + 三条尺寸线 + 接地线 + foot / 年条 / CTA）；
  ≤820px 断点单列 + 视觉件 `max-width:420px`（`240vh` 行程承接旧时间轴既有适配）。

## 2. K1–K13 逐条读数（全绿）

| 编号 | 判据 | 实测 |
|---|---|---|
| K1 | `.axis`/`.axis__*` DOM 与 CSS 为 0；`--axis-progress` 全库 0 处 | `demo/src` 静态 grep **0 命中**；运行时 `axisResidue: 0`（J8d）|
| K2 | 三屏全部文案 + 按钮逐字 | J9 PASS：3×(eyebrow/h/lede/cap) + foot 两段 + CTA 全部逐字比对一致 |
| K3 | 屏 1 恰 1,000 格、`is-on` 恰 999、右下角不在其中 | J-L1：`gridN:1000, gridOn:999, lastIsOn:false`，且 p=1 时 999 格 `::after` opacity 全为 1 |
| K4 | 箱体宽高比 1.91±0.03、人形 7、柱高=箱高 | J9b：`ratio:1.913, figs:7, rulerH:378.5 = boxH:380.5 − 2px 描边` |
| K5 | 屏 3 恰 69 格、点亮 = 前 50 + 末 1 | J-L2：`yearOnIdx = [0..49] + [68]`，终态全亮 |
| K6 | p 单调 0→1、三屏 `is-current` 1/2/3 | J10a：`[0, 0.5, 1]`（top=746, **span=3150** —— R2 行程 450vh−100vh=350vh×9px）；J10b：`1 / 2 / 3` |
| K7 | reduced-motion 落终态、无监听 | J11：三屏全 `is-current`，`p1=1`，`scrollTo(0,0)` 后仍 `1` |
| K8 | 首页 console 三次全空 | J10c + J11b + R375 console 均为 `[]` |
| K9 | 375×812 无横滚、三屏均可见 | R375：`scrollW 375 = clientW 375`；三屏主屏 `op:1, w:375` |
| K10 | 首页文档高 = 746 + 行程 | J8d：`docH: 4796`（R1 为 3446；**R2 行程 300vh → 450vh** 后应为 746 + 4050）|
| K11 | gzip(9) ≤ 预算 | **205,969 B = 预算**（预算已按用户裁定上调，见偏离 ③）|
| K12 | 屏 3 主按钮 → `#/entrance` | J-L3：点击后 `location.hash === "#/entrance"` |
| K13 | 其余七页零回归 | cast **45/45** · hall **61/61** · entrance **22/22** · turn **63/63** · vault state OK · J 组全过 |

**截图交付**（`.workbuddy/shots/`）：`ux_ledger_top` / `ux_ledger_fade`（R2 新增，p=.30 交叉淡变帧）
/ `ux_ledger_mid` / `ux_ledger_bottom`（1440×900 四帧）· `ux_ledger_375`（375×812）·
`ux_ledger_reduced`（reduced-motion 终态）。

## 3. 偏离项（单独成表）

| # | 提示词原文 | 实际做法 | 理由 / 裁定 |
|---|---|---|---|
| ① | §2.2 屏 2 只有 `cap = 等高立面…`，lede 末尾「净重 50 t」 | 屏 2 落地出**两句**：左栏 cap「《铁流凝变》 · 序厅馆藏实物 · 我国目前最大的工业题材青铜雕塑」+ 箱体下 foot「等高立面 · 11.5 m ≈ 6.8 个人高 ／ 净重 50 t」；lede 末「净重 50 吨」 | **出稿笔误，先改稿再实现**：基准图（mock 渲染）里两句都在；`check_ledger_prompt.py` 补「§2.2 文案 ↔ 基准稿逐字」段后 75 绿 / 0 红。已回写进归档抬头 |
| ② | §2.3 浇满建议 `mask-image: linear-gradient(to top, #000 …, transparent 0)` 或等价手法 | 改**逐格 `--t` + `::after` 载橙**（渲染时一次 `innerHTML` 定死，滚动零 DOM 写） | mask 作用于整层会把**未浇到的空格底色 #232A33 也藏掉**，与 §2.2「底色 #232A33」矛盾；逐格手法保住"空格常驻、橙从下往上浇"且仍是"一个变量 + CSS 推导" |
| ③ | §0.2/K11 净增量 ≤ 0（≤ 205,074 B） | 实测 **205,969 B（+895 B）**；已做最诚实的写法压缩（三屏骨架抽 `screen()/copy()`、拼接换行移出字符串：−982 B 原文仅换来 −17 B gzip），证明增量是**内容性**的（三屏逐字文案 + 必需结构 vs 旧 `.axis` 的高重复数据） | **2026-09-23 用户裁定：接受新基线 205,969 B**。评委硬线 198.57 KB 仍由 **D1 另案裁定**（该硬线本就已被上一轮的 205,074 超 1.70 KiB） |

另有两条**口径注记**（非偏离）：J8b 断言改名 `J8b_furnace_and_ledger_present`（选择器换 `[data-ledger]`）；K4 的"柱高=箱高"落成"柱高 = 箱内高（箱高 − 上下 1px 描边）"——柱是 absolute 贴 padding box，数学上不可能等于含描边的箱高。

## 4. 门禁脚本随本轮一并交付（§3.1）

`verify_ux.py`：J8b 换 `[data-ledger]` + 新增 `axisResidue`/`docH`；J9 改判三屏逐字；
新增 J9b（K4 几何）、J-L1/J-L2（终态计数与点亮序列）、J-L3（K12）、J11b 与 R375 console（K8 补全）、
K11 读数入门禁；删 `railFill` 断言；截帧名改 `ux_ledger_*`。

## 5. §3.2 / §3.3 现状（实现方只核不改）

- §3.2 六处「首页零回归」豁免抬头：**全部在位**（ENTRANCE-FURNACE L7/L260/L323、
  ENTRANCE-HISTORY L291/L326、ENTRANCE-LIP L193、STEP2-ACCEPTANCE-REVIEW L117）。
- §3.3 三处 R1 删飞越的过期声明：**全部在位**（design/README 与 ENTRANCE-HISTORY L35/L89）。
- 建议：上述抬头里的引用路径 `spec/PROMPT-HOME-LEDGER.md` 应随本批归档改为
  `archive/spec/PROMPT-HOME-LEDGER.md`（设计侧已顺手回写）。

## 6. R2 微调（2026-09-23 21:25 用户：「做长一点，过渡动画更平滑」）

**只动 `layout.css` 与 `verify_ux.py`，`home.js` 零改动**（JS gzip 仍 205,969 B = 预算）：

| 项 | R1 | R2 | 说明 |
|---|---|---|---|
| 行程 | `.ledger` 300vh | **450vh**（820px 断点 240vh → **360vh**） | 行程 1.5×；淡变带实际距离 108px → **252px ≈ 2.3×** |
| 屏切换 | 纯 opacity 离散跳变 | `transition: opacity .18s ease` | 平滑的主体；带宽 ±.03 → **±.04**（再宽只会让两屏文字重影更久） |
| 格子/年条/人形 | 瞬移点灯 | `transition: opacity .3s ease-out` | 滚轮每跳一格时补帧，"浇满"从阶梯变连续 |
| reduced-motion | — | 文末媒体查询**关掉全部新过渡** | 直接落终态，J11 复测通过 |

**门禁 46/46 全绿**（K11 不变、K13 七页零回归）。新增证据帧 `ux_ledger_fade`（p=.30 两屏各 50%
的交叉帧 —— 文字互叠是该手法的瞬态特性，仅存在于 252px 带内，静止态不出现）。

**取证陷阱（本轮真踩）**：R2 首跑 44/46，J-L1/J-L2 假红 —— 原因**不是**过渡没落定，而是
J10 截帧循环把新增的 `t=0.30` 淡变帧**排在末位**，循环结束时滚动停在 p≈.30，J-L 读到的是
"大半未亮"而非终态。修法：截帧按滚动推进排序，**`t=1.0` 必须末位**；已在脚本注释里写死这条。
