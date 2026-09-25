# 中国工业博物馆数字展馆 · 代码实现交接

> **你是谁**：本作品的代码实现方（AI 工作流）。
> **你要做什么**：把已完成的设计实现为可运行的网页。
> **当前进度**：Step 1–4 全部交付；序厅已定案《炉前》（Step 4C）；
> **视觉细化三包已全部实现并验收通过**（2026-09-20 收尾）—— W1 地面（F1–F6）/ W2 序厅《炉前》+ 炉口内衬（L1–L12 · E1–E6 · G1–G5）/ W3 浇铸互动含补轮（P1–P8）。
> 详见 `spec/IMPLEMENTATION-VISUAL-REFINE.md`。
>
> **当前状态：四层骨架全部完成**（2026-09-22 收尾）—— **八页全部上线**。
> 01 看见（首页 `/`）· 02 看懂（序厅 `#/entrance` + 通史馆 `#/history` + 铸造馆 `#/hall`）·
> 03 参与（亲手浇铸 `#/cast` + 协作车削 `#/turn`）· 04 带走（数字工牌 `#/vault`）· 关于项目 `#/about`。
> 最后两项的交付自述：`spec/IMPLEMENTATION-TURN.md`（U 组）· `spec/IMPLEMENTATION-VAULT.md`（**V 组 31/31 PASS**）。
>
> ✅ **体验修订 R1（用户亲提 9 条）已全部实现**：第 1–7 条在 2026-09-22 晚（J 组 37/37）·
> **第 8、9 条在 2026-09-23** —— 自述 [`spec/IMPLEMENTATION-UX-REVISION-P2.md`](spec/IMPLEMENTATION-UX-REVISION-P2.md)：
> K1–K20 里 **19 条通过、1 条不通过**（= 体积判据，见其 §6 待裁定 **D1**）。
>
> ✅ **「炉子的账本」（R1-P3，2026-09-23）已实现** —— 自述
> [`spec/IMPLEMENTATION-HOME-LEDGER.md`](spec/IMPLEMENTATION-HOME-LEDGER.md)：K1–K13 全绿、
> 门禁 **46/46**；首页下半段 `.axis`「滚动亮条」整段换成三屏账本。当晚用户又提 **R2**（「做长一点 +
> 过渡更平滑」）：行程 **450vh** + CSS 过渡补帧，同自述 §6。
> 其依据提示词已按规矩移入 [`archive/spec/PROMPT-HOME-LEDGER.md`](archive/spec/PROMPT-HOME-LEDGER.md)
> （**第六批**）。
>
> ✅ **P0 必修四项（体检 §6 收敛版，2026-09-24）已实现** —— 自述
> [`spec/IMPLEMENTATION-P0-FIXES.md`](spec/IMPLEMENTATION-P0-FIXES.md)：**角标门槛文案说反 / 描边色当文字色 /
> `<ol>` 多出一排序号 / 类名改名后两条规则失效**，四处全修。读数：`scan_dead_selectors` **1 → 0** ·
> `verify_vault` **41/41**（含 4 条新增断言）· `verify_ux` **47/47** · 体积**净 −5 B**。
> 其依据提示词已按规矩移入 [`archive/spec/PROMPT-P0-FIXES.md`](archive/spec/PROMPT-P0-FIXES.md)（**第七批**）。
> ✅ **P1 第一批 · 头部与导航统一（体检 §6 的 P1-1 / P1-2 / P1-3，2026-09-24）已实现** —— 自述
> [`spec/IMPLEMENTATION-HEADER-NAV.md`](spec/IMPLEMENTATION-HEADER-NAV.md)：头部**四套 → 两套（72 / 64）** ·
> 品牌标记**三种 → 一种（26×26 · r6 · 铁水橙，七页全等）** · `#/entrance` 导航 **2 → 1**（删掉那条
> **0 个可点元素**的「进场序列」）。读数：**H1–H6 全 PASS**（新断言落 `verify_w1/turn/cast/step4c`）·
> `verify_ux` **47/47** · `verify_vault` **41/41** · `verify_turn` **43/44**（唯一红仍为**既有 D1**）·
> `scan_dead_selectors` **0** · 体积**净 −256 B（gzip9）**。
> 其依据提示词已按规矩移入 [`archive/spec/PROMPT-HEADER-NAV.md`](archive/spec/PROMPT-HEADER-NAV.md)（**第八批**）。
> ⚠️ 该批的**前提「NAV-TRIM 已落地」实际未发生**（用户指定的顺序就是先做本批），导航项数仍按 **6** 记 —— 见自述 §10-④
> （⚠️ **该偏离已于同日第九批消解**：NAV-TRIM 随后落地，`NAV` 现为 **5 项**）。
>
> ✅ **顶栏删死项「数字藏品」（NAV 6 → 5，2026-09-24）已实现** —— 自述
> [`spec/IMPLEMENTATION-NAV-TRIM.md`](spec/IMPLEMENTATION-NAV-TRIM.md)：`home.js` 整行删掉
> `{ label: '数字藏品', route: '' }`；首页与 `#/about` **共用同一条 `NAV`** ⇒ **改一处、两页同时生效**
> （两页实测均 5 项、文案序列逐字一致；点「我的工牌」仍落 `#/vault`）。读数：**N1–N7 全过** ·
> `verify_ux` **47/47** · `verify_vault` **41/41** · `verify_turn` **43/44**（唯一红仍为**既有 D1**）·
> `scan_dead_selectors` **0** · JS gzip(9) **205,796 B**（K11 余 **173 B**）。
> 其依据提示词已按规矩移入 [`archive/spec/PROMPT-NAV-TRIM.md`](archive/spec/PROMPT-NAV-TRIM.md)（**第九批**）。
> ⚠️ 该稿**漏列了一处必改门禁**（`verify_vault.py` 的 `V11a` 也把 `len(navlinks) == 6` 写死）——
> 实现方已一并修掉，见自述 §4-①。
>
> ✅ **中文字体自托管（交付准备第 2 项，2026-09-24 晚）已实现** —— 自述
> [`spec/IMPLEMENTATION-FONT-SELFHOST.md`](spec/IMPLEMENTATION-FONT-SELFHOST.md)：
> `demo/index.html:9-11` 三行 Google Fonts 外链 → **2 个自托管可变 woff2 子集**
> （**328,156 B / 1,134 字形**，比「4 个静态字重」省 **49.5%**）；`tokens.css` 的 `--font-num`
> 接上 CJK 兜底，修掉 **4 处「同一行两种字体」**。读数：**必改门禁 0 处**（实测确实一处都不必改）·
> 20 份 `verify_*.py` **前后非零集合完全相同**（16 绿 / 4 既有非零；`verify_ux` 47/47 ·
> `verify_vault` 41/41 · `verify_turn` 43/44 唯一红仍为既有 D1）· 拦截两个外部字体域后**逐像素 0 差异**。
> 其依据提示词已按规矩移入 [`archive/spec/PROMPT-FONT-SELFHOST.md`](archive/spec/PROMPT-FONT-SELFHOST.md)（**第十批**）。
> ⚠️ 该稿自称「4 处」—— 实际是 **4 处 DOM + 1 处 Canvas**（`poster.js:118` 用**同一份栈的第二份拷贝**
> 画同一串「炉火不灭 · 2026」）。**第 5 处已随第十二批「删 Inter」修掉**（该行改用 `FONT_CN`，与页面同栈；该批之前它是 `poster.js:119`）。
> ✅ **P1 第二批「统一层」· 圆角 / 字号 / 字距收档（体检 §6 的 P1-4 + P1-5 + P1-6，2026-09-24 晚出稿 → 同日落地）已实现** ——
> 自述 [`spec/IMPLEMENTATION-P1-4-6.md`](spec/IMPLEMENTATION-P1-4-6.md)：圆角 **11 档 → 5 档**（`2 / 4 / 6 / 8 / 999` + `50%`）·
> 字号 **19 档 → 7 档**（`11 / 12 / 15 / 18 / 28 / 44 / 64`）· display 字距 **−1% → −2%**；杀 3 个非设计值
> （22.5 / 48.96 / 13.3333）+ 死 token `--fs-h1`；**必改门禁 2 处已按稿改并转绿**（`verify_w1.py:366` `6px→4px` ·
> `verify_vault.py:223` `34px→28px`）。⚠️ 该批**解冻了 `spec/VAULT-SPEC.md §11` 的三条裁定**（姓名 34→28 · 元信息值 22→18 · 圆角 14→8），见自述 §7-③。
> 其依据提示词已按规矩移入 [`archive/spec/PROMPT-P1-4-6.md`](archive/spec/PROMPT-P1-4-6.md)（**第十一批**）。
> ✅ **第十二批「删 Inter」（2026-09-24 晚出稿 → 同日落地）已实现** —— 自述
> [`spec/IMPLEMENTATION-FONT-DROP-INTER.md`](spec/IMPLEMENTATION-FONT-DROP-INTER.md)：
> 数字与拉丁改走 **Noto Sans SC**（10 个数字 advance 天然全等 **0.5210 em**），全站 **Inter 移除**；
> `dist/fonts/` **4 → 2 个 / 286,820 B（−50,101 B）**；**顺带修掉「字体第 5 处」**（Canvas 海报 `poster.js:118` 改用 `FONT_CN`）。
> 读数：**必改门禁 0 处** · 新增 3 条断言全过（`verify_font_drop`）· 八页 × 两视口横向溢出 **16/16 全 0** ·
> JS raw **−57 B** / gzip9 **−393 B（205,403）** · CSS raw **−159 B**（⚠️ 本批**不解决 D1**，省的是字体字节）。
> 其依据提示词已按规矩移入 [`archive/spec/PROMPT-FONT-DROP-INTER.md`](archive/spec/PROMPT-FONT-DROP-INTER.md)（**第十二批**）。
> 🔥 **此刻 `spec/` 手上可发的提示词 = 0 份**（2026-09-25 · **第十三批「全站换霞鹜文楷」落地并归档后**）—— 本批出稿时曾为 1 份（`PROMPT-FONT-CJK-SWAP.md`），**出稿当晚被裸引用 ⇒ 同日实现并归档**，`archive/spec/` 累计 **25 份**、归档项总数 **31**。
> 什么时候继续开张：① 用户再提新修订（含「审美优化」余下批次的裁定）；② D1 体积若被裁定为「砍内容」；③ P1-10 首屏 h1 顶边若裁定做；
> ④ **中黑层**（方案 B：加 Medium 第三字重）若裁定做；⑤ `.cast__steps` 的 `firstLeft` 基准若裁定固化（第十三批换字体后 1118.5 → 1111，两份门禁同源转红、判据未改）。
> 📌 其上游体检的 **P1-10（首屏 h1 顶边统一）已取证并拆出、留作待裁定** —— 四页 h1 顶边来自**四种不同机制**，
> 且 `#/vault` 在三视口下漂移 **97px**，**「统一成一个值」当前不可达**；选项见 `archive/spec/PROMPT-HEADER-NAV.md` §4。
> ⛔ **不要从 `archive/` 取任何一份来发** —— 它们描述的改动**全都已经在代码里了**。
>
> 🆕 **2026-09-24 晚 · 第十批——出稿 2 份；其中字体那份当晚即落地并归档（**落地顺序见本块末尾的裁定**）：**
>
> | # | 稿 | 一句话 | 出门核查 |
> |---|---|---|---|
> | 1 | ~~`spec/PROMPT-P1-4-6.md`~~ → **已落地并归档**：[`archive/spec/PROMPT-P1-4-6.md`](archive/spec/PROMPT-P1-4-6.md) | 体检 §6 的 **P1-4 + P1-5 + P1-6**：圆角 **11 档 → 5 档**（`2/4/6/8/999` + `50%`）· 字号 **19 档 → 7 档**（`11/12/15/18/28/44/64`）· display 字距 **−1% → −2%**；顺手杀 3 个「不是设计出来的值」（22.5 / 48.96 / 13.3333）与 1 个死 token（`--fs-h1`，3 处声明 0 处消费）。**必改门禁 2 处**（`verify_w1.py:366` 的 `6px→4px`、`verify_vault.py:223` 的 `34px→28px`）。**✅ 2026-09-24 已实现**，自述 [`spec/IMPLEMENTATION-P1-4-6.md`](spec/IMPLEMENTATION-P1-4-6.md) | 出稿期 `python .workbuddy/check_p1_456_prompt.py` → **101 绿 / 0 红**；**落地后 41 绿 / 60 红（⛔ 使命终结，红灯全是「断言改动前状态」）** |
> | 2 | ~~`spec/PROMPT-FONT-SELFHOST.md`~~ → **已落地并归档**：[`archive/spec/PROMPT-FONT-SELFHOST.md`](archive/spec/PROMPT-FONT-SELFHOST.md) | **交付准备第 2 项 · 字体自托管**：删 `demo/index.html:9-11` 的 Google Fonts 外链，换 **2 个可变 woff2 子集**（实测 **328,156 B = 320.5 KB**，覆盖 **1,134 个字形**，比「4 个静态字重」省 **49.5%**）；**必改 0 处门禁**；另修 **4 处「同一行两种字体」**（`--font-num` 没接 CJK 兜底，`tokens.css:32` 一行）。**✅ 2026-09-24 晚已实现**，自述 [`spec/IMPLEMENTATION-FONT-SELFHOST.md`](spec/IMPLEMENTATION-FONT-SELFHOST.md) | 出稿期 `check_font_selfhost_prompt.py` → 80 绿 / 0 红；**落地后 75 绿 / 5 红（⛔ 使命终结，5 红全是「断言改动前状态」）** |
>
> 📌 **落地顺序（2026-09-24 第十二轮裁定）：先字体稿、后 P1-4-6。** 理由 = **先固定文字度量环境**（字体不自托管时 Google Fonts 能否加载会改变度量；P1-4-6 是「字号收档 ⇒ 改折行 ⇒ 逐页复核横向溢出」的一批，在不确定的字体环境下做**结论不可信**；且两批都会移动几何读数、叠加后归因混淆）。⚠️ 两份**都动 `tokens.css`**（P1-4-6 → `:25/:34/:35`；字体 → `:32`），**先落的那份会顶走后一份的行号** —— **字体稿已落地**并把 `:32` 由 1 行改 3 行 ⇒ P1-4-6 引的 `:25/:34/:35` 已**整体 +2** 变成 `:25 / :36 / :37` ⇒ **P1-4-6 的全部行号已在本轮重核并回写**（其抬头有注）。
> ✅ **字体那份是本项目第一次把「交付物自证外观」做实了**（拦截两个外部字体域后**逐像素 0 差异**，
> 见自述 §4④）；代价是**门禁的文字度量口径从「取决于当时能不能连 Google Fonts」变成恒定** ——
> 该稿 §6.2 要求的前后两遍门禁**已跑完**：20 份**非零集合完全相同**，**无一份由绿转红**。
> 📌 第 1 份（P1-4-6）当时**不是** `archive/spec/` 里任何一份的翻版（全新工作包）；**现已实现并归档**（**第十一批**，2026-09-24）。
> ✅ **落地顺序已执行完毕**：字体稿先落（当晚），P1-4-6 后落 —— 故 P1-4-6 是**在文字度量已恒定的环境下**做的「字号收档 + 逐页横向溢出复核」（自述 §5：八页 × 两视口 **16 / 16 全 0**）。
>
> 📊 **[`spec/AESTHETIC-AUDIT.md`](spec/AESTHETIC-AUDIT.md)（2026-09-23 晚）—— 全站审美体检 + 去 AI 感诊断。**
> 它**本身不是提示词**。八页 × 两视口取证 + 运行时读数，
> 把「AI 感」量成数：毛玻璃 13 处 / 发光 4 处 / 渐变 8 处 / 圆角 11 档 / 字号 18 档 /
> 头部四套高度。**报告里的 P0 已经过运行时复核、收敛为 4 条**（原第 5 条经查是画稿有意留白，已撤回），
> 出稿成 `spec/PROMPT-P0-FIXES.md`，**并已于 2026-09-24 实现归档**（自述
> [`spec/IMPLEMENTATION-P0-FIXES.md`](spec/IMPLEMENTATION-P0-FIXES.md)，**第七批**）。
>
> 📌 **三件未闭环（都要用户拍板，没自行处理）**：① **D1 体积** —— Python `gzip(9)` 实测
> **205,796 B = 200.97 KiB > 198.57 KiB**（**D1 判据** · ⚠️ 该线来源待证，**不许称「评委硬线」**），差 **2.40 KiB**（P1 第一批顺带追回 0.16 KiB ·
> 第九批又追回 0.01 KiB；**第十三批后 = 200.95 KiB / 205,775 B，差 2.38 KiB**）。
> 注：门禁预算 K11 已按用户裁定上调至 **205,969 B**（本轮 205,796 ≤ 预算 ✔，余 **173 B**）；**D1 判据**由另案
> （自述 §6 给了三条选项）；② **D2 砂箱编号** 0 基 / 1 基展示口径；③ **D6 刀片楔角 55° 机位**最弱，倾向达标。
> 另：`#/turn` 右栏 `.turn__collab` 的默认留白（原体检 P0-5）经查是**画稿有意留白**，**已撤回、不是缺陷**。
>
> 设计已全部完成，你**不需要做任何设计决策**。遇到文档没写的情况，停下来问，不要自己发挥。
> ⚠️ **`archive/` 里的文档不是依据**——那是已完成 / 已作废的历史件，照它执行会做错方向。

---

## 第一步：按顺序读这几份文档

| 顺序 | 文件 | 读什么 |
|---|---|---|
| 1 | [`spec/PROJECT-BRIEF.md`](spec/PROJECT-BRIEF.md) | **为什么做**：立意、评分策略、真实史实、交接物清单（§0） |
| 2 | **[`spec/TURN-SPEC.md`](spec/TURN-SPEC.md)** + **[`spec/VAULT-SPEC.md`](spec/VAULT-SPEC.md)** | **已交付的两项长什么样**：协作车削 `#/turn` 与数字工牌 `#/vault` 的**已实现**依据（裁定 + U / V 组验收）。**是成品说明，不是待办工单** |
| 2b | [`spec/VISUAL-REFINE-SPEC.md`](spec/VISUAL-REFINE-SPEC.md) | **已做完的部分长什么样**：视觉细化三包（地面 / 序厅 / 浇铸）的**已实现**依据 —— 是"当前成品说明"，**不是待办工单** |
| 3 | [`design/README.md`](design/README.md) | **长什么样**：10 张设计稿 + 哪些细节已被新决策取代 |

**冲突优先级**：实现规格 > 设计稿 > demo 代码。

## 第二步：证明你的环境能干活（开工前自检）

依次完成，任何一步失败先解决再继续：

1. **跑通基线**：进入 `demo/`，执行 `npm install && npm run build && npm run preview`，浏览器打开 `http://localhost:4173/`，能拖拽旋转展厅里的车间
2. **截图能力**：`python tools/screenshot.py "http://localhost:4173/#/hall" selftest 9000`，生成 `.workbuddy/shots/selftest.png`
3. **读图能力**：用你的读图能力查看该 PNG，确认能看到"冲天炉 + 炉口橙环 + 横向场馆导航"

> 这一步是刻意设计的门槛。**能跑、能截、能看**，之后的"视觉比对"验收才有意义。
> （上一版项目就是死在没有验证环节——代码看起来对，跑起来全崩。）

## 第三步：接下来做什么

### 📌 当前任务：**没有待实现的页面、也没有待实现的提示词了**

用户亲自提的 **9 条调整全部落地**：

| 批 | 内容 | 状态 |
|---|---|---|
| R1 第 1–7 条 | 入口链修正（首页 → 序厅 → 铸造馆 → 浇铸）· 首页删两块换数据时间轴 · 新建 `#/about` · 铸造馆三热点统归浇铸 · 浇铸液面随桶同速倾 | ✅ 2026-09-22 晚，**J 组 37/37**，自述 [`spec/IMPLEMENTATION-UX-REVISION.md`](spec/IMPLEMENTATION-UX-REVISION.md) |
| R1 第 8、9 条 | `#/turn` 删排名榜 · 删「本局用时」· 切刀建模细化（四工位方刀台 / 夹刀螺钉 / 刀片楔角，draw call 不增）；`#/vault` 记「这一局」而非历史最好 · 加返回键 · 图鉴与衍生卡可点开 | ✅ 2026-09-23，**K1–K20 19/20**（唯一 FAIL = 体积），自述 [`spec/IMPLEMENTATION-UX-REVISION-P2.md`](spec/IMPLEMENTATION-UX-REVISION-P2.md) |
| R1-P3 首页账本 | 首页下半段 `.axis`「滚动亮条」→ **「炉子的账本」三屏**（铁水 1,000 格 / 浮雕立面 / 69 年条）；门禁改判 + J-L 组 | ✅ 2026-09-23，**K1–K13 全绿 · 门禁 46/46**，自述 [`spec/IMPLEMENTATION-HOME-LEDGER.md`](spec/IMPLEMENTATION-HOME-LEDGER.md) |
| **R2 账本微调** | 用户「做长一点 + 过渡更平滑」：行程 **300vh → 450vh**（移动端 360vh）· 屏切换 `.18s` / 格子人形 `.3s` transition · 交叉带 ±.04 · reduced-motion 全关 | ✅ 2026-09-23 当晚，**门禁 46/46 保持**，同自述 **§6** |
| **P0 必修四项** | 角标门槛文案说反 · 描边色当文字色（**1.55:1 → 6.09:1**）· `<ol>` 多一排序号 · 类名改名后两条规则失效 | ✅ 2026-09-24，`scan_dead_selectors` **1→0** · `verify_vault` **41/41** · `verify_ux` **47/47**，自述 [`spec/IMPLEMENTATION-P0-FIXES.md`](spec/IMPLEMENTATION-P0-FIXES.md) |
| **P1 第一批 · 头部与导航** | 头部**四套 → 两套（72 / 64**；`#/cast` 72→64、三个 HUD 页 56→64）· 品牌标记**三种 → 一种（26×26 · r6 · 铁水橙**，车削页由近黑转橙）· `#/entrance` 删 0 可点的「进场序列」 | ✅ 2026-09-24，**H1–H6 全 PASS** · `verify_ux` **47/47** · `verify_turn` **43/44** · 体积**净 −256 B**，自述 [`spec/IMPLEMENTATION-HEADER-NAV.md`](spec/IMPLEMENTATION-HEADER-NAV.md) |
| **第九批 · 顶栏删死项** | `NAV` 删掉 `{ label: '数字藏品', route: '' }`（**6 → 5**；它没有任何功能，点了等于回首页）· 首页与 `#/about` 共用同一条 `NAV` ⇒ 改一处两页生效 | ✅ 2026-09-24，**N1–N7 全过** · `verify_ux` **47/47** · `verify_vault` **41/41** · 体积**净 −12 B**，自述 [`spec/IMPLEMENTATION-NAV-TRIM.md`](spec/IMPLEMENTATION-NAV-TRIM.md) |
| **第十批 · 中文字体自托管** | 删 3 行 Google Fonts 外链 → **2 个自托管可变 woff2 子集**（**328,156 B / 1,134 字形**）· `--font-num` 接 CJK 兜底，修 4 处「同一行两种字体」 | ✅ 2026-09-24 晚，**必改门禁 0 处** · `verify_*.py` **非零集合不变**（当时 20 份）· 拦截外部字体域后**逐像素 0 差异**（JS gzip9 **逐字节未变**），自述 [`spec/IMPLEMENTATION-FONT-SELFHOST.md`](spec/IMPLEMENTATION-FONT-SELFHOST.md) |
| **第十一批 · 圆角 / 字号 / 字距收档** | 体检 §6 的 **P1-4 + P1-5 + P1-6**：圆角 **11 档 → 5 档**（`2/4/6/8/999` + `50%`）· 字号 **19 档 → 7 档**（`11/12/15/18/28/44/64`）· display 字距 **−1% → −2%**；另杀 22.5 / 48.96 / 13.3333 三个非设计值与死 token `--fs-h1` | ✅ 2026-09-24，**新增 12 条断言全过**（`verify_p1_456`）· **必改门禁 2 处已按稿改并转绿** · 八页 × 两视口横向溢出 **16/16 全 0** · JS gzip9 **逐字节未变**（205,796 B）；CSS raw **+450 B** / gzip9 **−23 B**，自述 [`spec/IMPLEMENTATION-P1-4-6.md`](spec/IMPLEMENTATION-P1-4-6.md) |
| **第十二批 · 删 Inter** | 数字与拉丁改走 **Noto Sans SC**（10 个数字 advance 天然全等 0.5210 em）· 全站 **Inter 移除**（1 个 `@font-face` + 1 份 OFL 消失）· **顺带修掉字体第 5 处**（Canvas 海报 `poster.js:118` 改用 `FONT_CN`） | ✅ 2026-09-24 晚，**必改门禁 0 处** · `run_all_verify` **非零集合未新增成员** · 八页 × 两视口溢出 **16/16 全 0** · JS raw **−57 B** / gzip9 **−393 B（205,403）** · 字体 **−50,101 B**，自述 [`spec/IMPLEMENTATION-FONT-DROP-INTER.md`](spec/IMPLEMENTATION-FONT-DROP-INTER.md) |
| **第十三批 · 全站换霞鹜文楷** | 全站中文字体 **Noto Sans SC → 霞鹜文楷 LXGW WenKai v1.330**（楷体手写感，SIL OFL 1.1 免费商用）：`@font-face` **1 → 2**（**静态**双字重 Regular/Bold，`font-weight: 400 500` / `600 700`）· **4 处字体栈首名替换** · 字号 / 字距 / 行高 / 圆角 / 间距 token 与 CSS `font-weight` 数值 **一个不动**（500 变细、600 变粗属静态字重的物理结果） | ✅ 2026-09-25 凌晨，**必改门禁 4 处**（`verify_font_drop`，另有 4 处失效自我描述一并改写）· `verify_font_drop` **3/3 PASS** · 八页 × 两视口溢出 **16/16 全 0** · 子集覆盖 **1,134 / 1,134（一字不缺，`Δ` 已补齐）** · 字体 **+187,056 B**（2 个 → 3 个文件）· ⚠️ **`verify_cast:H3` / `verify_ux:P0F3` 两条同源新红**（`.cast__steps` 的 `firstLeft` 1118.5 → 1111：**字体度量副产品**，已实测定性、**判据未改**，待用户裁定基准），自述 [`spec/IMPLEMENTATION-FONT-CJK-SWAP.md`](spec/IMPLEMENTATION-FONT-CJK-SWAP.md) |

> ⚠️ 下面「页面开发已经全部结束」那一节列的是**成品说明，不是工单**。
> 🔥 **此刻 `spec/` 手上可发的提示词 = 0 份**（2026-09-25 · 第十三批「全站换霞鹜文楷」**落地并归档后**：出稿时为 1 份，当晚被裸引用即实现）。
> **全部 25 份已归档**提示词都在 `archive/spec/`（最后一份 = `PROMPT-FONT-CJK-SWAP.md`，**第十三批**）——
> **不要从那里取来发**。
>
> 📌 **下一步**：**① 「审美优化」余下批次** —— 体检报告 [`spec/AESTHETIC-AUDIT.md`](spec/AESTHETIC-AUDIT.md) 的
> **P1 13 条 · P2 6 条**里，已认领并落地 **P1-1 ~ P1-6**（**P2-1 已并入 P1-5**，不再单独立项）；**P1-10 已取证、拆出待裁定**；
> **P1-7~P1-9 / P1-11~P1-13 与 P2（余 5 条）仍未立项** → 出提示词前**待用户裁定"下一轮做哪几条"** →
> **② 交付准备五项**（重打包 / 字体自托管 / 作品描述 PDF / 视频分镜 / 部署）—— 其中
> **字体自托管 ✅ 已落地并归档**（原 `spec/PROMPT-FONT-SELFHOST.md`，现 `archive/spec/PROMPT-FONT-SELFHOST.md`；**第十二批删掉 Inter ⇒ 2 个文件 · 第十三批换成霞鹜文楷静态双字重 ⇒ 3 个文件**），
> **其余两项待做**（**视频分镜** · **部署**；**重打包 ✅** 与 **作品描述 PDF ✅** 均于 2026-09-25 完成）。
> 仍挂着待裁定：**D1 体积（判据 198.57 KiB **来源待证** —— ⚠️ 不许再称「评委硬线」；实测 gzip9 **200.95 KiB / 205,775 B**，差 **2.38 KiB**）** · **D2 砂箱编号口径** ·
> **D6 刀片楔角** · **P1-10 首屏 h1 顶边口径** · **字体稿 §9 的 A/B/C/D 四条**（字表宽严 / Inter 的 `opsz` /
> 子路径部署；**「删不删 Inter」已裁定「删」并落地 = 第十二批**；**「换哪款中文字体」已裁定「霞鹜文楷 / 全站」并落地 = 第十三批**）·
> **🆕 第十三批带来的两条**（中黑层要不要补 —— 方案 B 加 Medium 第三字重 · `.cast__steps` 的 `firstLeft` 基准 1118.5 vs 1111）· **🆕 P1-4-6 交回的四条**（工牌页要不要保留 34px 方案 B · 首屏 h1 取 46 而非 44 · `tokens.css` 头部注释要不要加例外说明 · 老账 D1/P1-10/D2/D6）。

### ✅ 页面开发已经全部结束（2026-09-22）

八页全部上线，**没有待实现的页面了**。以下两项是**最后交付**的页面，别再重做一遍：

| 已交付 | 依据 | 提示词（已归档） | 自述 |
|---|---|---|---|
| 协作车削 `#/turn` | `spec/TURN-SPEC.md` | `archive/spec/PROMPT-TURN.md` | `spec/IMPLEMENTATION-TURN.md`（U 组） |
| 数字工牌 `#/vault` | `spec/VAULT-SPEC.md` | `archive/spec/PROMPT-VAULT.md` | `spec/IMPLEMENTATION-VAULT.md`（**V 组 31/31**） |

> ⚠️ 这两份提示词**描述的改动已经在代码里了** —— **不要取来再发一次**。
> 📌 **随后两轮又改过 `#/turn` 与 `#/vault`**（体验修订 R1 第 1–7 条 → 第 8、9 条），
> 因此 **`spec/TURN-SPEC.md` / `spec/VAULT-SPEC.md` / `spec/SCENE-LAYOUT-FIX-SPEC.md` 顶部已加 ⚠️ 抬头**，
> 列出**已作废的条款**（用时口径 / 协作榜 / 权重 45·35·20 / `im.turn.best` / `turnTime` 字段 / 无 HUD 与冻结边界）。
> **读这三份规格时先读抬头 —— 有冲突一律以代码现状与自述为准。**

### 接下来：交付准备（不是新功能）

| # | 事项 | 为什么 | 状态 |
|---|---|---|---|
| 1 | ~~**重打包 `release/dist`**~~ | ~~旧快照停在 2026-09-18 19:14（`index-C2uu7VYi.js`），十三批修订全不在内~~ | ✅ **2026-09-25 已完成** —— 交付包 **6 个文件 / 1,215,507 B（1187.0 KB）**：`index.html` 742 B · `assets/index-DxzSVEyG.js` 704,430 B · `assets/index-CigWfXV7.css` 36,459 B · `fonts/` **3 个**（2 woff2 + 1 OFL）。**零构建、产物名哈希不变**：只做 **4 处字符串替换**改相对路径（`"/assets/`→`"./assets/` ×2 · `url(/fonts/`→`url(../fonts/` ×2，css 净 +4 B）⇒ `使用说明.md`「根路径或子路径都兼容」**首次被运行层实证**：文件层 **16/16 PASS**（逐字节 sha256 对照）+ 运行层**根路径与子路径双 ALL OK**（`document.fonts` 恰 2 个 LXGW face loaded · 字体请求全 200 来自本机相对路径 · 无 googleapis/gstatic · `#/hall`/`#/entrance` 路由与 3D 凭据齐全 · 溢出 0）⇒ **断网可正常显示**。`使用说明.md` 已同步（字体声明含 OFL 与上游链接 · 快照 2026-09-25 08:50 · 体积句 0.7 MB + 字体 0.45 MB） |
| 2 | ~~**字体自托管**~~ | ~~`demo/index.html` L9–11 仍外链 Google Fonts。评委机断网 → 字形回落~~ | ✅ **2026-09-24 晚已完成** —— 自述 [`spec/IMPLEMENTATION-FONT-SELFHOST.md`](spec/IMPLEMENTATION-FONT-SELFHOST.md)；原稿见 [`archive/spec/PROMPT-FONT-SELFHOST.md`](archive/spec/PROMPT-FONT-SELFHOST.md)（**第十批**） |
| 3 | ~~作品描述 PDF~~ | ~~参赛需要~~ | ✅ **2026-09-25 上午已完成** —— `作品描述-炉火不灭.pdf`（项目根，**7 页 A4 / 1.87 MB**，霞鹜文楷排版 + 九张成品实拍图，深色工业风与站点同款视觉）。内容按官方《竞赛方案》VR 赛道要求**六要素全覆盖**：功能性指标 / 技术方法 / 使用工具 / 特色说明 / 创新思路 / 应用性及前景分析。排版源 `.workbuddy/pdf/description.html`；工具 `.workbuddy/pdf_shots.py` / `print_pdf.py`（自带逐页溢出自检）。⭐ **官方文件已核**：全文无任何 JS / 页面体积线（唯一 200 MB 线属视频与图片）⇒ D1 的 198.57 KiB 非出自该文件 |
| 4 | 视频分镜脚本 | 参赛需要 | 待做 |
| 5 | 部署 / 发布 | 送展需要 | 待做 |

### 已完成、不要重做

> ⚠️ **视觉细化三包（W1 / W2 / W3）已全部实现并验收通过**（2026-09-20 收尾）。
> `spec/VISUAL-REFINE-SPEC.md` 与 `spec/ENTRANCE-LIP-SPEC.md` 仍是**现行依据**（描述当前成品），
> 但**照它们重做一遍是错的** —— 它们是已完成的依据，不是待办的工单。
>
> **2026-09-21：四份已实现的提示词已移入 `archive/spec/`** ——
> `PROMPT-ENTRANCE-FURNACE` / `PROMPT-ENTRANCE-LIP` / `PROMPT-HISTORY-CTA-FIX` / `PROMPT-VISUAL-REFINE`。
> **2026-09-22（第三批）：`PROMPT-TURN` 与 `PROMPT-VAULT` 随它们归档** —— 当时 `spec/` 的提示词归零。
> **2026-09-22 晚（体验修订 R1）：用户又提了 9 条调整 → 新出 `spec/PROMPT-UX-REVISION.md`（现已归档，见下）。
> 其中第 1–7 条当晚已实现并验收（J 组 37/37），第 8、9 条待做 —— 当时该文件仍在 `spec/`，只发 §1 第 8、9 条。**
> **2026-09-23（第四批）：`PROMPT-UX-REVISION.md` 也随之整份归档。**
> 第 8、9 条已抽成独立交接稿 `spec/PROMPT-UX-REVISION-P2.md`（**该稿同日晚也已归档，见下一条**）→ 旧稿自身再无未做条款，故可整份移出。
> 归档提示词描述的改动**已经全在代码里了**，**一份都不要从 `archive/` 取来发**。

- 上述三包的依据：`spec/VISUAL-REFINE-SPEC.md`（**现行依据**）+ `spec/ENTRANCE-LIP-SPEC.md`（炉口内衬）
- 纪律：**逐包验收**，每包过判据（F / G / P / L）才进下一包；偏离规格必须标注
- ⚠️ 本文件**显式解冻了 5 个文件**（见规格 §1.1）；与 `STEP3 §12.6` / `ENTRANCE-HISTORY-SPEC §4` 的旧冻结冲突处，**以它为准**
- ⚠️ 零贴图增量是硬约束：`textures.js` 的改动须保持三页贴图数不增（已实测 **5 / 2 / 3**，未增）
- 已实测性能（收尾态）：序厅 13 call / 2874 tri / 2 tex / 7 灯 · 铸造馆 37 / 32822 / 5 · 浇铸 13 / 11004 / 3
- 已知坑：规格 §0.2（本机 AI shell 缺 `tail`/`ls`，**命令不要用管道**；Edge 截图必须走 CDP）

## 交付要求（每轮完成时）

1. 交付自述：本轮做了什么、**实测读数**（`renderer.info` + CDP，不许估算）、逐条判据对照、偏离标注
2. 不回归证明：铸造馆 `layout()` 61/61、浇铸 `__cast.selfTest()` 45/45、序厅 `entranceLayout()` 全过
3. console 零报错取证（CDP 协议层：`Runtime.exceptionThrown` / `console.error|warn` / `Log.entryAdded`）
4. 改动前后对照截图（1440×900），供设计方做视觉比对
5. 性能预算：**全站 JS gzip ≤ 215 KB** —— 2026-09-23 实测 **207.28 kB**（Vite banner 口径），**余量 7.72 kB ✅**。
   > ⚠️ **但更严的那条判据没过**：Python `gzip(9)` 口径 **200.27 KiB（205,074 B）> 198.57 KiB**，**差 1.70 KiB**。
   > **归因：不是本轮造成的** —— 上一轮（R1 第 1–7 条）收尾时该口径已是 199.95 KiB（超 6.17 KiB）；
   > 本轮第 8 条净删 ≈ −0.5 KiB、第 9 条净增 ≈ +0.8 KiB，净 **+330 B**。
   > 裁定 R2「保留 < 198.57、第 8 条做完后复测」的前提在**绝对值**上成立（确实净删了），
   > 但被第 9 条的净增抵消 —— **拉不回 198.57 以下**。
   > 📌 **未自行砍体积**（P2 §5.9 禁止顺手优化）→ 三条选项见 `spec/IMPLEMENTATION-UX-REVISION-P2.md` §6 **D1**，
   > **等用户拍板**。上一轮的读数与权衡见 `spec/IMPLEMENTATION-UX-REVISION.md` §3.1 与 §5。
   > 📌 **以上是 R1-P2 当轮的历史读数**。**当前（2026-09-25 · 第十三批后）**：banner **≈208 kB**（口径已废弃，只作趋势）、
   > `gzip(9)` **200.95 KiB（205,775 B）**，仍差 **D1 判据 2.38 KiB**（⚠️ 该线来源待证，不许称「评委硬线」）—— 见 `spec/IMPLEMENTATION-NAV-TRIM.md` §2/§3。

> **已经交付的 Step 请勿重做**：Step 1–4 全部完成，序厅已定案《炉前》，四层骨架七页全部上线。
> 历史提示词与自述一律在 `archive/`，**不要从那里取来发**。

---

## 目录说明

```
project/
├── README.md            ← 本文件
├── spec/                ← 全部规格文档（代码实现方的工作依据）
│   │                      ✅ **四层骨架八页全部上线（2026-09-22）**；体验修订 R1 全 9 条已落地（2026-09-23）；「炉子的账本」R1-P3 已落地（2026-09-23，门禁 46/46）+ 当晚 **R2** 微调（450vh / 过渡补帧）；**P0 必修四项已落地（2026-09-24）**；**P1 第一批「头部与导航统一」已落地（2026-09-24）**；**顶栏删死项「数字藏品」（NAV 6→5）已落地（2026-09-24）**
│   │                      🔥 **此刻可发的提示词 = 0 份**（2026-09-24 · **第十二批「删 Inter」已落地归档**）；⛔ 另有 **24 份**已归档在 `archive/spec/`（**不要从那里取来发**）
│   ├── PROJECT-BRIEF.md
│   ├── IMPLEMENTATION-FONT-DROP-INTER.md ← 🆕 **「删 Inter」实现自述（2026-09-24 第十二批）**：`@font-face` **2 → 1**、`demo/public/fonts/` **4 个 / 336,921 B → 2 个 / 286,820 B（−50,101 B）**；`--font-num` 改为与 `--font-cn` **同栈**（token 保留）· 删两处死常量 `FONT_NUM`（`poster.js` / `emblem.js`）· **顺带修掉字体第 5 处**（Canvas 海报改用 `FONT_CN`）。**必改门禁 0 处** · `verify_font_drop` **3/3** · 八页 × 两视口溢出 **16/16 全 0** · `document.fonts.size` **2 → 1**。⚠️ **§4 记了四条偏离**，其中一条**推翻了稿的一句话**：Noto 把 `·`(U+00B7) 排成**全宽 1 em** ⇒ 含 `·` 的 `.num` 串**变宽**（`01 · 看见` **+9.31%**），其余 78 处 `·` 走 `--font-cn` 不受影响。提示词本体在 `archive/spec/PROMPT-FONT-DROP-INTER.md`（第十二批）
│   ├── IMPLEMENTATION-FONT-CJK-SWAP.md ← 🆕 **「全站换霞鹜文楷」实现自述（2026-09-25 第十三批）**：全站中文字体 **Noto Sans SC → 霞鹜文楷 LXGW WenKai v1.330**（SIL OFL 1.1）· `@font-face` **1 → 2**（静态双字重 Regular/Bold）· `demo/public/fonts/` **2 个 / 286,820 B → 3 个 / 473,876 B（+187,056 B）** · **字号/字距/行高/圆角/间距 token 与 CSS `font-weight` 数值一个不动**。**必改门禁 4 处**（+4 处失效自我描述）· `verify_font_drop` **3/3 PASS** · 八页 × 两视口溢出 **16/16 全 0** · 子集覆盖 **1,134 / 1,134** · `document.fonts.size` **1 → 2**。⚠️ **§4 记了七条偏离**：其一**推翻了稿 §1.2 的覆盖率结论**（v1.330 已补齐 `Δθπω`，`Δ` 不再走系统兜底）；另一条是**上游字体缺陷**（v1.330 的 `cmap` format 4 `length` 字段溢出 ⇒ `getBestCmap`/`pyftsubset` 必挂，已就地补丁）；还有**两条计划外新红**（`verify_cast:H3` / `verify_ux:P0F3` 同源 `firstLeft`，实测定性为字体度量副产品、**判据未改**）。提示词本体在 `archive/spec/PROMPT-FONT-CJK-SWAP.md`（第十三批）
│   ├── IMPLEMENTATION-P1-4-6.md        ← 🆕 **P1 第二批「统一层」实现自述（2026-09-24 第十一批）= 体检 §6 的 P1-4 + P1-5 + P1-6**：圆角 **11 档 → 5 档**（`2/4/6/8/999` + `50%`）· 字号 **19 档 → 7 档**（`11/12/15/18/28/44/64`）· display 字距 **−1% → −2%**；另杀 22.5 / 48.96 / 13.3333 与死 token `--fs-h1`。**目标值全部来自画稿像素实测**（角部缺失面积法 + 合成尺 + 同串墨迹宽度比，先在渲染图校验 ±0.1px）。**新增 12 条断言全过** · **必改门禁 2 处已按稿改并转绿** · 八页 × 两视口横向溢出 **16/16 全 0** · JS gzip9 **逐字节未变**。⚠️ **§7 记了四条偏离**（含**解冻 `spec/VAULT-SPEC.md §11` 三条裁定**）。提示词本体在 `archive/spec/PROMPT-P1-4-6.md`（第十一批）
│   ├── IMPLEMENTATION-FONT-SELFHOST.md ← 🆕 **中文字体自托管实现自述（2026-09-24 第十批）**：`index.html:9-11` 三行外链 → **2 个自托管可变 woff2 子集 328,156 B / 1,134 字形**；`--font-num` 接 CJK 兜底修 4 处「同一行两种字体」；**必改门禁 0 处**；20 份 `verify_*.py` 前后非零集合不变；拦截外部字体域**逐像素 0 差异**（含对照组）。提示词本体在 `archive/spec/PROMPT-FONT-SELFHOST.md`（第十批）
│   ├── AESTHETIC-AUDIT.md              ← 📊 **全站审美体检 + 去 AI 感诊断（2026-09-23 晚）**。八页 × 两视口 18 帧取证 + 运行时读数（毛玻璃 13 / 发光 4 / 渐变 8 / 圆角 11 档 / 字号 18 档 / 头部四套高度）。§6 的 P0 已**逐条运行时复核并收敛为 4 条**（原第 5 条 `#/turn` 空档经查是画稿有意留白，**已撤回**）⇒ **已实现归档**（`archive/spec/PROMPT-P0-FIXES.md`，第七批）；**P1-1/P1-2/P1-3 也已实现归档**（`archive/spec/PROMPT-HEADER-NAV.md`，第八批）；**P1-1~P1-6 全已实现归档**（第八批 HEADER-NAV · 第十一批 P1-4-6；**P2-1 已并入 P1-5**）；**P1-10 拆出待裁定**；**P1-7~9 / P1-11~13 · P2 余 5 条尚未立项**。⚠️ **§3 的计数是「运行时口径」，不要直接抄** —— 声明口径见 `archive/spec/PROMPT-P1-4-6.md §1.4`（该节更正了报告自己的三处事实）
│   ├── IMPLEMENTATION-NAV-TRIM.md      ← **顶栏删死项「数字藏品」实现自述**（2026-09-24 第九批；NAV 6→5 · 首页与 `#/about` 两页实测一致；**N1–N7 全过** + 体积净 **−12 B**；**§4-① = 核出提示词漏列的第二处必改门禁 `verify_vault.py` V11a `== 6`**）。提示词本体在 `archive/spec/PROMPT-NAV-TRIM.md`（第九批）
│   ├── IMPLEMENTATION-HEADER-NAV.md    ← **P1 第一批「头部与导航统一」实现自述**（2026-09-24；头部 72/64 · 标记 26×26 r6 铁水橙 · `#/entrance` 导航 2→1；**新增 H1–H6 断言** + 体积净 **−256 B**；§10-① = F4 判据噪声取证）。提示词本体在 `archive/spec/PROMPT-HEADER-NAV.md`（第八批）
│   ├── IMPLEMENTATION-P0-FIXES.md      ← **P0 必修四项实现自述**（2026-09-24；四处 diff + 验收读数 + `scan_dead_selectors` **1→0** + 新增 5 条断言；体积净 **−5 B**）。提示词本体在 `archive/spec/PROMPT-P0-FIXES.md`（第七批）
│   ├── IMPLEMENTATION-HOME-LEDGER.md   ← **R1-P3「炉子的账本」实现自述**（2026-09-23；K1–K13 全绿 · 门禁 46/46；**§6 = R2 微调**：行程 450vh + 过渡补帧 · 取证陷阱「截帧循环 t=1.0 必须末位」；偏离 = 屏 2 cap/foot 修正 · 浇满用逐格 --t · K11 基线上调至 205,969 B 已裁定）。提示词本体在 `archive/spec/PROMPT-HOME-LEDGER.md`（第六批）
│   ├── IMPLEMENTATION-UX-REVISION-P2.md ← **R1 第 8、9 条实现自述**（**K1–K20 19/20**；唯一 FAIL = K13b 体积 → §6 D1；另含 D2 砂箱口径等 8 条待裁定 / 偏离）。抬头有 📌 后记说明其引用的提示词已归档
│   ├── IMPLEMENTATION-UX-REVISION.md   ← R1 第 1–7 条实现自述（**J 组 37/37 PASS**；含 J23 体积判据矛盾、第 7 条必要偏离、开工前核查 8 条盲点（其中 2 条被证伪））。抬头有 📌 后记说明其引用的旧提示词已归档
│   ├── STEP1-IMPLEMENTATION-SPEC.md
│   ├── SCENE-ASSETS-STEP2.md
│   ├── SCENE-ASSETS-STEP2B-DETAIL.md   ← 道具细节补强（尺寸基准见下一行）
│   ├── SCENE-LAYOUT-FIX-SPEC.md        ← 场景布局与尺度修正（Step 2C；**§10 修订记录 = 定稿数值**，覆盖 §2–§3 旧值；§10A = R2 历史）
│   ├── STEP3-INTERACTION-SCORING-SPEC.md ← 交互与评分规则（创新性 40 分核心）。**§2–§5 浇铸已实现**；**§8 协作车削**与 **§6–§7 工牌数据/解锁规则**是本轮两项新规格的上位依据
│   ├── TURN-SPEC.md                    ← **协作车削 `#/turn` 实施规格（2026-09-21）—— 本项唯一依据**。含 §3 六条裁定（双人=同屏不联网 / 计时终点 / 滑杆初值 / 术语 / 排行榜构成 / 回放）与 U1–U12 验收。**已实现**。⚠️ **顶部有「部分条款已失效」抬头**（§3.2 §3.7 §4.1 §6 §8U3 已随 R1 第 8 条作废 —— 读它先读抬头）
│   ├── IMPLEMENTATION-TURN.md          ← 车削实现自述（**U 组通过**；含偏离裁定与实测读数）
│   ├── VAULT-SPEC.md                   ← **数字工牌 `#/vault` 页面规格（2026-09-21）—— 本项唯一依据**。补齐画稿 S05 的三处空白（徽记区 / 12 件馆藏图鉴 / 空态）与 V1–V12 验收。**已实现**。⚠️ **顶部有「三处条款已失效 / 修订」抬头**（§9 字段表 / §14 第 10 条 / §1「无 HUD」）
│   ├── IMPLEMENTATION-VAULT.md         ← 工牌实现自述（**V 组 31/31 PASS**；含 9 条「实现方判断」偏离与实测读数）
│   ├── VAULT-PREFLIGHT-CHECK.md        ← 实现方开工前对 `PROMPT-VAULT` 的**核查报告**（13 条引用全属实 + 3 条新发现）
│   ├── ENTRANCE-HISTORY-SPEC.md        ← Step 4：序厅三维场景 + 通史馆长卷（**§1.2–§1.5 已被 ENTRANCE-FURNACE-SPEC 取代；§1.6 起与 §2 通史馆仍有效**）
│   ├── ENTRANCE-FURNACE-SPEC.md        ← **Step 4C：序厅方向定案《炉前》—— 现行唯一依据**（炉壁 46×18 / 拱顶炉口 12×7.5 / 炉膛净深 5.0 / 铁水沟 / 亮度分层判据）
│   ├── ENTRANCE-LIP-SPEC.md            ← **序厅炉口内衬 + E5 判据修订（2026-09-20）**（`furnace_lip` 几何 / 顶点色 / ②③ 新采样口径；**阈值不变**）
│   ├── VISUAL-REFINE-SPEC.md           ← **视觉细化（三包 W1 地面 / W2 序厅 / W3 浇铸互动）—— 现行唯一依据**；含**解冻表**（`textures.js` / `workshop.js` / `environment.js` / `props/sandboxes.js` 有界解冻）
│   ├── RENAME-SCOPE.md                 ← 《铁流凝变》残留处置（**已裁定 C · 折中**：说明条保留真实馆藏锚点，正文不得否认它；并明列首页 / 通史馆 / BRIEF 一律不动）
│   ├── IMPLEMENTATION-VISUAL-REFINE.md ← 实现方视觉细化自述（**W1 / W2 / W3 + W3 补轮全部完成，全门禁通过**；含全部偏离裁定与实测读数）
│   ├── NOTICE-R5-FIX-CLOSEOUT.md       ← 场景冻结通知（R5-FIX 三条偏离已裁定，之后改动须新起 R6）
│   ├── STEP1-ACCEPTANCE-REVIEW.md      ← 设计方验收结论
│   └── STEP2-ACCEPTANCE-REVIEW.md      ← 设计方验收结论（含复审记录）
├── design/              ← 设计稿导出图（视觉验收基准，10 张含 S10 基准）+ 阅读说明
├── demo/                ← **代码在这里**（Vite + three.js）；开发 / 改代码一律用它
│   └── 启动预览.bat      ← Windows 双击即可看效果
├── release/             ← 交付包：dist/（成品）+ server.js + 启动.bat + 使用说明.md
│                          ✅ **dist/ 已是 2026-09-25 08:50 快照**（第十三批后：`index-DxzSVEyG.js` + `index-CigWfXV7.css` + `fonts/` 3 个；4 处已改相对路径，根 / 子路径部署均实证可用，断网可显示）
├── archive/             ← ⚠️ 归档区：**已做完、内容已被取代**的文档（见其 README）。不要照它执行
├── refs/                ← 参考资料（**不是依赖**：不进 `demo/src`、不进构建、不进交付包）
│   ├── awesome-design-md/  ← 74 份真实品牌的 DESIGN.md，当"正常值"的尺子（圆角中位 6 档 / display 字距中位 −2.08%）
│   ├── impeccable/         ← 设计批评 skill + Rust 检测器；规则名即 AI 味清单（side-tab / dark-glow / radial-halo / gradient-text / ai-color-palette / icon-tile-stack / hero-eyebrow …）
│   ├── inspira-ui/         ← Aceternity / Magic UI 的 Vue 移植 —— **AI 味组件黑名单本身**（liquid-glass / bento-grid / particles-bg / card-spotlight / lamp-effect …）
│   ├── lottie-web/         ← 动画运行时（**是能力不是判据**）。⚠️ **未落地**：git pack 与 codeload tarball 两条路都在沙箱带宽下中断（实测 **~16 KB/s**），目录里只剩 `.git` 骨架 —— **不影响体检结论**（它不参与任何判据）
│   ├── taste-skill/        ← **反 AI 味规则库**（10 份 SKILL.md）：专章 ANTI-NESTED-BOX / REDUCE MICRO-UI CLUTTER —— "大框套小框 / 卡片堆卡片 / 文字前加图标 / 乱用毛玻璃"逐条有条款（详见 §5.5）
│   ├── ui-ux-pro-max-skill/← ⚠️ **未落地**（详见 `spec/AESTHETIC-AUDIT.md` §5.6）—— skill 仓库体量小，已改走「API 列树 + `raw.githubusercontent.com` 逐文件」的路子待补（`codeload` 的 tarball **不支持 Range**，大仓库在 ~16 KB/s 下没有可行路径）
│   └── _clone.sh           ← 幂等：重跑即可补齐缺失的仓库
├── tools/
│   └── screenshot.py    ← 无头截图工具（验收自测用）。**2026-09-23 加了两个可选参数**：视口宽/高（默认仍是 1440×900）
└── scroll-world/        ← ⚠️ 已废弃，与本作品无关，不要读、不要用
```

> **归档区怎么用**：`archive/` 里的东西**不是依据**，是追溯材料。
> 想知道「当前该照什么做」——只看 `spec/` 里没被归档的那几份。
> **2026-09-22（第三批）又归档了 2 份**：`PROMPT-TURN` / `PROMPT-VAULT`，均已实现
> —— 当时 `spec/` 的提示词归零（三批累计归档 15 份）。
> **2026-09-22 晚（体验修订 R1）**：用户又提 9 条调整 → 新出 **`spec/PROMPT-UX-REVISION.md`**。
> 它**不是**从归档里恢复的，是一份全新工作包；其中**第 1–7 条当晚已实现并验收**
> （J 组 37/37，自述 `spec/IMPLEMENTATION-UX-REVISION.md`），**第 8、9 条待做** ——
> 「部分实现的工作包不能整份归档」这条规矩**当时**适用，所以它**当晚留在了 `spec/`**，但⛔ 不能再发整份。
> **2026-09-23（第四批）归档 1 份**：`PROMPT-UX-REVISION.md`。第 8、9 条抽成独立稿
> `PROMPT-UX-REVISION-P2.md` 之后，旧稿**再无未做条款**，故可整份移出
> —— 四批累计归档提示词 **16 份**，`spec/` 里**只剩 1 份可发**（⚠️ **该状态当天即被「第五批」推翻**，见下一条）。
> **2026-09-23（第五批）归档 1 份**：`PROMPT-UX-REVISION-P2.md` —— 它**出稿当天就被实现并交付**
> （自述 `spec/IMPLEMENTATION-UX-REVISION-P2.md`，K1–K20 **19/20**），按规矩整份移出。
> **2026-09-23 晚（非归档批次）新出一份「炉子的账本」三屏规格**
> （用户「首页下面那个滚动亮条有点鸡肋」）→ 当晚**已实现并交付**
> （自述 `spec/IMPLEMENTATION-HOME-LEDGER.md`，K1–K13 全绿 · 门禁 46/46）。
> **2026-09-23（第六批）归档 1 份**：`PROMPT-HOME-LEDGER.md` —— 出稿数小时后即实现，按规矩整份移出
> （实现时的三处已裁定偏离见其归档抬头与自述 §3）。
> **六批累计归档提示词 18 份 —— 第六批归档当时，`spec/` 手上没有可发的** —— 什么时候会重新开张：
> ① 用户再提新修订；② **D1 体积**若被裁定为「砍内容」（自述 §6，仍待拍板）。
> **2026-09-23 晚（非归档批次）新出一份 [`archive/spec/PROMPT-NAV-TRIM.md`](archive/spec/PROMPT-NAV-TRIM.md)**（← 原 `spec/`，**第九批**已归档）——
> 正是 ① 触发的（用户「把首页的数字藏品功能去掉」）⇒ 当晚可发的回到 1 份。
> **2026-09-23 深夜（非归档批次）又出一份 `spec/PROMPT-P0-FIXES.md`** ——
> `AESTHETIC-AUDIT.md` 的 P0 经运行时复核收敛为 4 条（原第 5 条查实是画稿有意留白，已撤回）
> ⇒ 当时可发的 = 2 份（NAV-TRIM + P0-FIXES，互不冲突）。
> **2026-09-24（非归档批次）再出一份 `spec/PROMPT-HEADER-NAV.md`** ——
> 用户已拍定的下一轮「审美优化」里的**第一批**（体检 §6 的 **P1-1 / P1-2 / P1-3**）：
> 头部四套收两套 · 品牌标记三种收一种 · `#/entrance` 删掉那条 0 可点元素的导航。
> 出稿时按「NAV-TRIM 先行」写前提（验收表按 `NAV` = 5 项）。
> **2026-09-24（第八批）归档 1 份**：`PROMPT-HEADER-NAV.md` —— **出稿当日即实现并交付**
> （自述 `spec/IMPLEMENTATION-HEADER-NAV.md`：**H1–H6 全 PASS** · `verify_ux` **47/47** ·
> `verify_vault` **41/41** · `verify_turn` **43/44** · `scan_dead_selectors` **0** · 体积净 **−256 B**），按规矩整份移出。
> ⚠️ **执行顺序偏离**：用户指定**先做 HEADER-NAV**，故其前提「NAV-TRIM 已落地」**实际未发生**，
> 导航项数仍按 **6** 记（该批未改任何 navCount 判据，见自述 §10-④）。
> ⇒ 第八批归档当时，`spec/` 手上可发的 = 1 份（`PROMPT-NAV-TRIM.md`）。
> **2026-09-24（第九批）归档 1 份**：`PROMPT-NAV-TRIM.md` —— **出稿次日实现并交付**
> （自述 `spec/IMPLEMENTATION-NAV-TRIM.md`：`NAV` 删掉死项「数字藏品」**6 → 5** · 首页与 `#/about`
> 两页实测一致 · **N1–N7 全过** · `verify_ux` **47/47** · `verify_vault` **41/41** · `verify_turn` **43/44**
> · `scan_dead_selectors` **0** · 体积净 **−12 B**），按规矩整份移出。
> ⚠️ **该稿漏列了一处必改门禁**（`verify_vault.py` 的 `V11a` 也把 `len(navlinks) == 6` 写死 ——
> 「门禁断的是条数、按符号 grep 抓不到」的典型），实现方已一并修掉并登记在自述 §4-①。
> ⚠️ 第八批的执行顺序偏离**至此消解**：`NAV` 现为 **5 项**，`verify_ux.py` J1 与 `verify_vault.py` V11a 都已 `== 5`。
> **2026-09-24 晚（第十批）**：先**出稿 2 份** —— `spec/PROMPT-P1-4-6.md`（圆角/字号/字距收档）
> 与「字体自托管」那份（**现已归档，见本段末**），用户裁定「现在就出 P1-4~6，同时把字体自托管的规格一起写出来，两条并行」；
> 随后用户裁定**「按稿落地（先落这份）」** ⇒ **字体那份当晚即实现并归档**
> （自述 `spec/IMPLEMENTATION-FONT-SELFHOST.md`：`index.html:9-11` 三行外链 → **2 个自托管可变 woff2 子集
> 328,156 B / 1,134 字形** · `--font-num` 接 CJK 兜底修 4 处 · **必改门禁 0 处** ·
> 20 份 `verify_*.py` **前后非零集合完全相同**（16 绿 / 4 既有非零）·
> **拦截两个外部字体域后逐像素 0 差异**（含「拦截确实生效」的对照组）·
> JS gzip(9) **逐字节未变 205,796 B**），按规矩整份移出。
> ⇒ **截至 2026-09-24 晚（此刻），`spec/` 手上可发的 = 1 份 = `PROMPT-P1-4-6.md`。**（⛔ **已被下一条「第十一批」推翻**）
> （十批累计归档提示词 **22 份**、归档项总数 **28**。）
> **2026-09-24（第十一批）归档 1 份**：`PROMPT-P1-4-6.md` —— **出稿当晚实现并交付**
> （自述 `spec/IMPLEMENTATION-P1-4-6.md`：圆角 **11 档 → 5 档** · 字号 **19 档 → 7 档** ·
> display 字距 **−1% → −2%**；**必改门禁 2 处**（`verify_w1.py:366` `6px→4px` · `verify_vault.py:223` `34px→28px`）
> **已按稿改并转绿** · **新增 12 条断言全过** · 八页 × 两视口横向溢出 **16/16 全 0** ·
> JS gzip9 **逐字节未变** —— 文本批的改动只落在 CSS：raw **+450 B** / gzip9 **−23 B**），按规矩整份移出。
> ⚠️ **本批解冻了 `spec/VAULT-SPEC.md §11` 的三条裁定**（姓名 34→28 · 元信息值 22→18 · 圆角 14→8）——
> 原裁定写「写死画稿原值」的依据是「`tokens.css` 冻结」，与「全站收档」**互斥**；已回写该规格（§11 抬头 + 3/4/6 三行 + §12 冻结表）。
> ⇒ **截至 2026-09-24（此刻），`spec/` 手上可发的 = 0 份。**（十一批累计归档提示词 **23 份**、归档项总数 **29**。）
> 📌 **"归零 / 封口"这类结论句第 11 次被推翻了，别再当永久结论；第 12 次会从"用户下一次开口"里来。**
> ⚠️ 同一条规矩：上一条「重新开张」的触发条件写得再准，也拦不住"用户下一次开口"。
> **2026-09-21（第二批）归档 5 份**（4 份已实现的提示词 `PROMPT-ENTRANCE-FURNACE` / `-ENTRANCE-LIP` /
> `-HISTORY-CTA-FIX` / `-VISUAL-REFINE`，+ 已作废的 `ENTRANCE-VISUAL-REVISION`）。
> 2026-09-18（首批）归档了 12 份**已实现的历史提示词 / 自述**（STEP2B、STEP3、INTERACTIONS-FIX、
> SCENE-LAYOUT 全系、ENTRANCE-VISUAL、ENTRANCE-HISTORY、STEP4/4A 自述）+ `release/source/` 源码副本，
> 原因只有一个：**照着过期提示词执行会做错方向**。

## 环境速查

| 事项 | 说明 |
|---|---|
| Node | 系统已装 v22.22.2；若 `npm` 不在 PATH，用 `C:\Users\savetime\.workbuddy\binaries\node\versions\22.22.2-3\node.exe` + 同目录 `node_modules\npm\bin\npm-cli.js` |
| Python（工具脚本用） | `C:\Users\savetime\.workbuddy\binaries\python\versions\3.13.12\python.exe` |
| 浏览器（无头） | Edge 153：`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |
| ⚠️ AI shell | 带 `\|` 管道的命令会假报失败（见 PROJECT-BRIEF §9.3），**不要用管道** |
| ⚠️ Edge 截图 | `--screenshot` 参数无效，必须走 CDP（用 `tools/screenshot.py`） |

---

*有任何不确定，先查规格，规格没写就停下来问。猜，是这类项目失败的第一原因。*
