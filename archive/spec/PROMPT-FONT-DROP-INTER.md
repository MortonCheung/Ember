# PROMPT · 第十二批：删掉 Inter（把数字与拉丁交给 Noto Sans SC）

> ⛔ **【已归档 · 2026-09-24 · 第十二批 · 不要发送本文件】**
> **本稿已于 2026-09-24 当晚实现并交付** —— 自述 **`spec/IMPLEMENTATION-FONT-DROP-INTER.md`**
> （体检 §9 的 **C 案**，用户裁定「**删掉 Inter**」：数字与拉丁从 Inter 交回 **Noto Sans SC**）。
> **12 条编辑 + 2 个文件删除**：`@font-face` **2 → 1** · `demo/public/fonts/` **4 个 / 336,921 B
> → 2 个 / 286,820 B（−50,101 B）** · `--font-num` 改为与 `--font-cn` **同栈**（token 本身保留，
> 因其仍是 `layout.css` 的消费点）· `poster.js` / `emblem.js` 两处死常量 `FONT_NUM` 删除。
> **产物**：`index-Dc2hlaOH.js` 704,432 B / gzip9 **205,403**（−57 / **−393**）·
> `index-Dnr5PM8C.css` 36,309 B / gzip9 **7,244**（−159 / **+7**）。
> **必改门禁 0 处**（`verify_*.py` 无一份断言字体）· **新增 `verify_font_drop.py` 3/3 PASS** ·
> 八页 × 两视口横向溢出 **16 / 16 全 0** · `document.fonts.size` **2 → 1** ·
> 跑批非零集合**未新增成员**（仍 = `{verify_cdp, verify_p12, verify_step4a_edge, verify_turn}`）。
> **这里的每一项都已经在代码里了** —— **再发一次等于让实现方重做一遍。**
> 📌 归档原因：**出稿当晚被用户裸引用（裸引用 = 实现信号）⇒ 同日实现并交付**，按规矩整份移出 `spec/`。
> 正文一字未改，**下文所有行号均为「改前」行号**（`fonts.css:3-4/7/16-17/29-36`、`tokens.css:36-38`、
> `base.css:31`、`poster.js:19/20/47/78/119`、`emblem.js:39/40/41`、`demo/README.md:35` 等）。
> ⚠️ **本稿 §1.2 / §10 写「数字与拉丁只会更窄，不会更宽」—— 对含 `·`(U+00B7) 的串不成立**：
> Noto 把 U+00B7 排成**全宽 1 em**（12px 实测 **3.47 → 12.00 px，+245.8%**），
> `.about__layer-no`「01 · 看见」实测 **56.19 → 61.42（+9.31%）**。
> 全仓 `.num` 栈内含 `·` 的渲染串只有 **2 条 DOM**（`about.js:17-20`、`vault.js:208`）+ Canvas 那行；
> 其余 78 处 `·` 走 `--font-cn` ⇒ 不变。**已列为已知后果，不回退、不粉饰**（自述 §4-②）。
> ⚠️ 本批**另有 4 条对稿的偏离**（`fonts.css` 删后是 **28 行**而非稿说的 30 行；
> `poster.js` 两处注释里的「Inter 」一词；`README.md` 两处「第 5 处未修」的失效声明；
> 以及上面那条 `·` 全宽）—— 见自述 §4。
> ⚠️ 本核查脚本 `.workbuddy/check_font_drop_prompt.py` 是**出稿前**用的（比对改动前代码：
> 两枚 face、两个 woff2、三个文件里仍写着 `Inter`），落地后必然转红 —— 那不是回归，
> 是它的使命结束了（**67 绿 / 0 红 → 落地后 39 绿 / 28 红**，`exit=1`、零 traceback；已加 ⛔ 抬头封版）。
> 🔥 **`spec/` 此刻可发的提示词 = 0 份**（2026-09-24 · 第十二批后）。什么时候重新开张：
> ① 用户再提新修订（审美优化余下批次 P1-7~9 / P1-11~13 与 P2 余 5 条）；② D1 体积若被裁定为「砍内容」；
> ③ P1-10（首屏 h1 顶边）若裁定做。**（"字体第 5 处"这条开张条件已随本批消解。）**
> ⚠️ 同类结论句**已连发 13 次**（第十批 2 份 → 当晚字体落地 1 份 → 第十一批 P1-4-6 落地 0 份 →
> 第十二批出稿当晚可发 1 份 → 本批落地 0 份）—— **必带时间戳，且别当永久结论**。

**状态：🟢 可发**（2026-09-24 21:45 出稿）。落地后请把本文件**移入 `archive/spec/`**（移动，不是删除）。

**依据**：用户裁定原话 —— **「你问的字体稿按 C 可以」**，即 `archive/spec/PROMPT-FONT-SELFHOST.md` §9 的 **C 选项：删掉 Inter**。
**上游**：第十批「中文字体自托管」已落地并归档（自述 `spec/IMPLEMENTATION-FONT-SELFHOST.md`）。
**本批不碰任何字号 / 圆角 / 字距 / DOM 结构 / 文案 / 布局规则。**

> 📌 **设计侧说明（与上游相反、已作废）**：出字体稿时我给的建议是「**C 保留 Inter**」
> （`spec/PROJECT-BRIEF.md:97` 仍留着这句）。**用户已裁定删除 Inter**，该建议作废 ——
> 落地后必须回写 `PROJECT-BRIEF.md:97`（见 §8 回写清单第 4 条）。

---

## 0. 一句话

**把 Inter 从全站拿掉**：数字与拉丁字母改由 **Noto Sans SC** 渲染（它的 10 个数字 advance 本来就**完全相等**，天然等宽）。

- 收益：**少 1 个字体文件 / 1 份许可证 / 1 个请求**，交付更干净。
- ⚠️ **不是体积收益**：省下的 **50,101 B** 是**字体**字节，**不进** JS gzip 的账（见 §7）。
- 代价：**全站数字变窄 19.7%**、拉丁变窄 11.5% ⇒ **折行与溢出必须全量复核**（见 §5）。

---

## 1. 出稿前事实核查（2026-09-24 21:2x–21:4x 现场实测，非转抄）

### 1.1 行号表（**改动前**的行号，逐条现场重取）

| 文件 | 行 | 现在写着什么 |
|---|---|---|
| `demo/src/styles/fonts.css` | `:3-4` | 头注「来源：Noto Sans SC / **Inter**…许可证全文见 … 与 `public/fonts/OFL-Inter.txt`」 |
| `demo/src/styles/fonts.css` | `:6-8` | 「⚠️ 族名必须与 tokens.css / poster.js / emblem.js 里的栈完全一致 …（**poster.js:20 / emblem.js:41** 写死在 JS 里）」 |
| `demo/src/styles/fonts.css` | `:16-19` | 「⚠️ **这两个文件**是子集，只含全站用到的 1134 个字形 …」 |
| `demo/src/styles/fonts.css` | `:22-28` | Noto 的 `@font-face`（**保留**） |
| `demo/src/styles/fonts.css` | `:30-36` | **Inter 的 `@font-face`（7 行，整块删）** |
| `demo/src/styles/tokens.css` | `:36-38` | `--font-num: "Inter", "Helvetica Neue", Arial,` / `"Noto Sans SC", …` / `system-ui, sans-serif;` |
| `demo/src/styles/base.css` | `:31` | `/* 数字与拉丁字母走 Inter */` |
| `demo/src/styles/base.css` | `:32` | `.num, .latin { font-family: var(--font-num); font-feature-settings: "tnum"; }` |
| `demo/src/js/ui/poster.js` | `:19` / `:20` | `const FONT_CN = …` / `const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';` |
| `demo/src/js/ui/poster.js` | `:47` / `:78` / `:119` | 三处 `${FONT_NUM}`（`:119` 画的是「**炉火不灭 · 2026**」＝汉字 + 数字） |
| `demo/src/js/ui/emblem.js` | `:39` / `:40` / `:41` | 注释 / `const FONT_CN = …`（`:239` 在用）/ `const FONT_NUM = …`（**全文件 0 处使用**） |
| `demo/README.md` | `:35` | 「无框架、无 UI 库。字体：Noto Sans SC / Inter（Google Fonts）。」 |

> ⚠️ **同一行号有两种写法**：全仓回扫请同时 grep `:20`、`L20`、「第 20 行」三种（第十四轮栽过）。
> 本稿所有行号都标了文件路径，**没写行号的引用一律以路径为准，不要按记忆推**。

### 1.2 宽度影响面（两个子集实测，em）

| 量 | Inter（现用，含 `tnum`） | Noto Sans SC | 比 | 后果 |
|---|---|---|---|---|
| 10 个数字 advance | **0.6484（全等，靠 `tnum` 对齐）** | **0.5210（全等，天然等宽）** | **0.8035** | 数字**窄 19.7%** |
| 拉丁 A–Z 平均 | 0.6815 | 0.6032 | 0.8852 | 窄 **11.5%** |
| 拉丁 a–z 平均 | 0.5363 | 0.4944 | 0.9218 | 窄 **7.8%** |

具体串（实测，改后会变窄这么多）：

| 串 | Noto | Inter(tnum) | 变化 |
|---|---|---|---|
| `1957` / `2026` / `1380` / `600` / `70` | 2.0840 em / 1.5630 / 1.0420 | 2.5938 / 1.9453 / 1.2969 | **−19.7%** |
| `1380 ℃` | 3.3040 | 4.0371 | −18.2% |
| `C620-1` | 3.0270 | 3.9727 | **−23.8%**（字母也换脸） |
| `22 × 11.5 m` | 5.3850 | 5.8408 | −7.8% |
| `12 / 12` · `NO. 0012` · `4.0` · `0.52` | — | — | −16.4% / −15.1% / −18.7% / −19.0% |

⇒ **受影响的可见读数**（不限于）：首页账本的 64px 大读数与 `净重 50 t` / `22 × 11.5 m` ·
浇铸页 `1380 ℃` 与评分 / 分项值 · 工牌页 `NO. 00xx` / `浇筑评分` / `车削评分` / `0 / 12` ·
通史馆年份 · 关于页层号 · 车削页三组滑杆数值。**它们只会更窄，不会更宽** —— 但**折行点会变**。

### 1.3 字符集：**不会掉字**（这一条是本批最大的风险点，已实测排除）

- Noto 子集 cmap 实测 **1,135** 个码位；字表 `.workbuddy/fontwork/chars-loose.txt` = **1,134** 字符（= A 裁定的宽松表）。
- **两个子集的差集只有 1 个字符：`₀`（U+2080 下标零）** —— 字表里有它，但 **Noto Sans SC 源字体没有这个字形**，Inter 有。
- ⚠️ 全仓 grep `₀` → **只出现在 4 处源码注释里**（`cast.js:343` · `cast.js:457` · `casting-data.js:27` · `entrance-scene.js:164`），**没有任何界面渲染它** ⇒ **删 Inter 不会掉任何会被渲染的字符**。
- 已抽查「炉火不灭 / 中国工业博物馆 / 序厅 / 铸造馆 / 亲手浇铸 / 协作车削 / 数字工牌 / 通史馆 / 今天，由你重新浇下 / ℃ / — / · / ≈」→ **全部在 Noto 子集里**。
- 记一笔备用：**若将来有界面要用下标零（`₀`）或右上标数字的另一种写法，必须先用 `pyftsubset` 给 Noto 补字形**，否则会回落系统字体。

### 1.4 OpenType 特性（`tnum` 的真实状态）

| 子集 | GSUB | GPOS |
|---|---|---|
| `NotoSansSC-subset.woff2` | `ccmp, liga, locl, vert, vrt2` | `halt, kern, palt, vhal, vpal` |
| `Inter-subset.woff2` | `calt, locl, **tnum**` | `kern` |

- Inter 的 `tnum` 有 **56 对**字形映射；Noto **没有 `tnum`**（源 `nsc-var.ttf` 里就没有）。
- ⇒ `base.css:32` 的 `font-feature-settings: "tnum"` 在 Noto 下**是空操作**（`0.5210` 全等，不需要它）。
- ⚠️ **查字体特性必须同时看 GSUB 和 GPOS** —— `tnum` 在 GSUB，而 `kern / halt / palt / vhal / vpal` 全在 GPOS，只看一个表会下错结论（第十四轮栽过）。

---

## 2. 改动清单（10 条编辑 + 2 个删除）

> ⚠️ **一处文件一批多条编辑会被静默丢弃** —— 请**一条一条提交并回读确认**。

### ① `demo/src/styles/fonts.css` `:3-4`（头注，**2 行 → 2 行，净 0**）

```css
   来源：Noto Sans SC（SIL Open Font License 1.1）
        许可证全文见 public/fonts/OFL-NotoSansSC.txt
```

### ② `demo/src/styles/fonts.css` `:6-8`（头注，**3 行 → 3 行，净 0**，顺带把行号引用改对）

把 `（poster.js:20 / emblem.js:41 写死在 JS 里）` 改成
`（poster.js:19 的 FONT_CN 与 emblem.js:40 的 FONT_CN 写死在 JS 里）`。

> 为什么要改：改动后 `poster.js:20` 与 `emblem.js:41` 都不存在了；而 `:19` / `:40` 是**删除点之上**的行，
> **不漂移**（见 §2 的行漂移说明）。

### ③ `demo/src/styles/fonts.css` `:16-19`（头注，**4 行 → 4 行，净 0**）

1. 「**这两个文件**是子集」→「**这个文件**是子集」。
2. 第 2 行补一句：`（第十二批已删 Inter —— 拉丁与数字也走它，实测**无掉字**）`，**并把它并进原有的括号内**，保持 4 行。

### ④ `demo/src/styles/fonts.css` `:30-36` —— **整块删除 Inter 的 `@font-face`（7 行）**

删后文件 = **30 行**，`@font-face` 计数 **2 → 1**。
> ⚠️ 这一块在**文件末尾** ⇒ 不顶走任何行号。（已 grep 全仓：`fonts.css:N` **无任何行号引用**。）

### ⑤ `demo/src/styles/tokens.css` `:36-38` —— **3 行同长度替换，净增 0 行 0 字节**

```css
  --font-num: "Noto Sans SC", "Source Han Sans CN", "PingFang SC",
              "Microsoft YaHei", "Hiragino Sans GB",
              system-ui, sans-serif;   /* 第十二批：Inter 已删 —— 数字/拉丁与正文同栈 */
```

- 改后 `--font-num` 的**值**与 `:34-35` 的 `--font-cn` **完全相同**（只是折行位置不同）⇒ 语义上是「数字/拉丁的别名」，**不删 token**（理由见下）。
- ⚠️ **不许把它压成 1 行或 2 行** —— `tokens.css` 下方（`:40 --fs-display: 44px` / `:41 --fs-readout: 64px`）被 `spec/IMPLEMENTATION-P1-4-6.md` 与 `archive/spec/PROMPT-P1-4-6.md` 按行号引用，**行号一动就废**。
- **为什么不删掉 `--font-num` 这个 token**：它此刻**有消费者**（`base.css:32` · `layout.css:1492` · `layout.css:1557`），不是死 token；
  删它会连带改 3 处 CSS，并让 `check_font_selfhost_prompt.py` 的两条 `layout.css:1492/:1557` 断言由绿转红。**收益为零，风险为正。**

### ⑥ `demo/src/styles/base.css` `:31`（注释，**1 行 → 1 行，净 0**）

```css
/* 数字与拉丁字母与正文同栈（第十二批已删 Inter） */
```

### ⑦ `demo/src/styles/base.css` `:32` —— **不动**

`.num, .latin { font-family: var(--font-num); font-feature-settings: "tnum"; }` **保持原样**。
`--font-num` 已指向 Noto，规则自动生效；`tnum` 在 Noto 下是空操作但**无害**，且**故意保留**（将来若回退到有 `tnum` 的字体仍成立）。
> ⚠️ `.num` / `.latin` **不是死类名**，**一个都不许删**。实测（脚本按 class 逐个 token 数的）：
> **`.num` 独立类名 = 26 处，分布在 6 个文件**（`about.js` / `cast.js` / `history.js` / `home.js` / `turn.js` / `vault.js`）。
> 📌 顺带记一笔**新发现（本批不动，登记待裁定）**：**`.latin` 的消费点是 0** ——
> 它只活在 `base.css:32` 这条选择器里，源码里没有任何 `class="latin"`。
> 这是**半死选择器**（`scan_dead_selectors.py` 不报它，因为它与 `.num` 共用一条规则）。
> 本批**不删它**（删了会动 `base.css` 行数、且与本批主题无关）—— 列进 `archive/README.md` 之类的登记表，另行裁定。

### ⑧ `demo/src/js/ui/poster.js` `:20`（**删这一行**）+ `:47` / `:78` / `:119` 三处改用 `FONT_CN`

- 删 `const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';`
- `:47` `${FONT_NUM}` → `${FONT_CN}` · `:78` 同 · `:119` 同。
- ⚠️ **`:119` 就是待裁定已久的「Canvas 第 5 处」**：它画「炉火不灭 · 2026」，含汉字却用**没接 CJK 兜底**的 `FONT_NUM` ⇒ 导出海报的汉字走系统字体、与页面分叉（实测逐像素差 1357）。**改成 `FONT_CN` 后这处缺陷自动消失**，本批**顺带修掉**。
- ⚠️ **行漂移 −1**：删除 `:20` 后 `:119` → **`:118`**。`README.md` 的 `:58` / `:69` / `:160` 三处引了 `poster.js:119` ⇒ **必须回写**（见 §8 第 2 条）。
- `:19` 的 `FONT_CN`、`:22-25` 的 `document.fonts.ready` + 2 s 断网回落**不许动**。

### ⑨ `demo/src/js/ui/emblem.js` `:39` / `:41`（**删死常量**，行漂移 −1）

- 删 `:41` `const FONT_NUM = …` —— **实测全文件 0 处使用**（唯一消费者是 `:239` 的 `FONT_CN`）。
- `:39` 的注释「与 tokens.css 的 `--font-cn` / `--font-num` 同栈」→ 改成只提 `--font-cn`（**1 行 → 1 行**）。
- `:40` 的 `FONT_CN` 与 `:239` **不动**。
- 行漂移 −1：**已 grep 全仓，无任何 `emblem.js:N` 行号引用** ⇒ 安全。

### ⑩ 删除两个文件

- `demo/public/fonts/Inter-subset.woff2`（45,724 B）
- `demo/public/fonts/OFL-Inter.txt`（4,377 B）

> ⛔ **不要删 `.workbuddy/fontwork/` 里的任何东西**（`final/Inter-subset.woff2`、`raw/inter-*.ttf`、字表 txt）。
> 那是取证与工作产物，`check_font_selfhost_prompt.py` 仍在读它 —— 删了会让那份脚本 `FileNotFoundError`，**连"封版可复现"都没了**。

### ⑪ `demo/README.md` `:35`

「无框架、无 UI 库。字体：Noto Sans SC / Inter（Google Fonts）。」
→ 「无框架、无 UI 库。字体：**Noto Sans SC（自托管子集，SIL OFL 1.1）**。」

### ⑫ **不动**：`demo/index.html`（已是 `fonts.css` + 三个样式表，`@font-face` 声明在 CSS 里）· `layout.css` · 任何页面 JS 的 DOM 结构。

---

## 3. 不许改（红线）

1. **不许改字体族名**。`"Noto Sans SC"` 这个名字是 **CSS 与 Canvas 的契约**（`poster.js` / `emblem.js` 写死在 JS 里），改名会让页面与导出海报分叉。⚠️ 更不许改成含 `Source` 的名字 —— OFL 的**保留字条款**（`fonts.css:10-14` 已把这条写死）。
2. **不许顺手优化**（P2 §5.9）。本批只做「让 Inter 消失」，**不加**任何 `preload`、不加 `font-display` 变更、不调字号、不碰圆角字距。
   > 第十批的教训：自行加了 `<link rel=preload as=font>` ⇒ 触发 Chrome 假警告 ⇒ **连毁两条已有断言、收益为零**，最后自己删掉、判据自己转回绿。
3. **不许改门禁断言来"让它变绿"**。§6 列出的转红项**全是使命终结**。
4. ⚠️ **不许加行**：本稿标注「净 0」的编辑，改完请 `Read` 回读确认行数没变。

---

## 4. 验收（必做，缺一不可）

### 4.1 新增断言（**新建** `.workbuddy/verify_font_drop.py`，2 条）

为什么新建而不是往 `verify_p1_456.py` 里加：加行会顶走该文件下方行号，而它被别处按行号引用。**新建文件零漂移。**

| 断言 | 怎么量 | 通过条件 |
|---|---|---|
| `D1_dom_font_family_no_inter` | 在 `/` 与 `#/vault` 两页，抽查 ≥6 个 `.num` 元素 + 3 个 `.latin` 元素，读 `getComputedStyle().fontFamily` | 全部**不含** `Inter`，且首项是 `"Noto Sans SC"` |
| `D2_no_inter_font_request` | `performance.getEntriesByType('resource')` + `document.fonts` 的已加载 face | 资源里**没有** `Inter-subset.woff2`；`document.fonts` 里无 `Inter` face；`/fonts/NotoSansSC-subset.woff2` **确实被请求到**（对照组，防"字体整个没加载"被当成通过） |

> ⚠️ 探针必须**自带"我确实到了那一页"的凭据**：cache-buster 的 query **一律接在 `#` 之前**，
> 并把 `location.hash` / 页面标志文案记进 JSON，复核时先验凭据再看读数（否则会静默回落首页、得出"假 0 差异"）。

### 4.2 回跑（**全部串行**，共用一个 Edge profile ⇒ 并行会互相踩）

1. **八页 × 两视口（1440 / 375）横向溢出** ⇒ **16/16 仍为 0**。数字只会更窄，理论上只会更安全，但**必须实测**。
2. **21 份 `verify_*.py` + 新增的 `verify_font_drop.py`**（`run_all_verify.py`）：**before / final 非零集合与第十一批末次跑批对照** —— 预期集合仍是 `{verify_cdp, verify_p12, verify_step4a_edge, verify_turn}`，**不允许出现第 5 个成员**；若出现，先证明它是不是本批造成的（判据见 §6）。
3. `verify_p1_456.py` **12 条全 PASS**（字号档位不受字体影响，必须仍全绿）。
4. `verify_vault.py` **V11a 仍 `== 5`** · `verify_ux.py` **47/47（J1 `== 5`）** · `scan_dead_selectors.py` **仍 0**。
5. 逐页**折行复核**：八页各截 1440 宽一张（改动前 / 改动后并列），**人眼过一遍**折行点与数字对齐。
   ⚠️ 重点看：首页账本 64px 读数（`--fs-readout`）· 浇铸页 `1380 ℃` 与评分 ·
   工牌页 `NO. 00xx` 与评分 · 通史馆年份 · 窗宽 **≤ 1100px** 的那两档断点（`layout.css:355` 的 `:root` 已在第十一批删掉）。

### 4.3 海报导出（这一条最容易漏）

- 从 `#/vault` 导出一张海报 PNG，**看「炉火不灭 · 2026」那一行**。
- **预期变化**：这行汉字**会换脸**（旧：`FONT_NUM` 无 CJK 兜底 ⇒ 系统字体；新：`FONT_CN` ⇒ Noto 子集）。
  **这正是本批要修的那处缺陷，是预期结果，不是回归。**
- 重新出一张基准图存档，并在自述里写明「与旧基准逐像素不同，原因 = 换字体，差异量 = ?」。

### 4.4 交付自述（`spec/IMPLEMENTATION-FONT-DROP-INTER.md`）

必须包含：① 逐条编辑对照（改前 / 改后全文）· ② 实测读数（不是估算）· ③ §6 转红清单的**实测结果** ·
④ 偏离标注 · ⑤ 仓库实际文件清单与体积 · ⑥ console 零报错取证（CDP 协议层）。

---

## 5. 体积记账（**别把字体字节混进 JS 的账**）

| 项 | 改动前 | 改动后（预期） |
|---|---|---|
| JS `index-*.js` raw / gzip(9) | 704,489 / **205,796** | 略降（删了 2 个字符串常量 + 若干 Latin，**估计 −60 ~ −120 B**） |
| CSS `index-*.css` raw / gzip(9) | 36,468 / **7,237** | 略降（少一条 `@font-face`，**估计 −300 B 量级**） |
| `dist/fonts/` 文件数 / 字节 | 4 个 / **336,921** | **2 个 / 286,820**（**−50,101 B**） |
| ⚠️ D1 的账 | 205,796 B（超 203,335 B **2.40 KiB**） | **基本不动** |

> ⛔ **不许拿"删了 Inter"当 D1 体积问题解决了的理由** —— 省下的是**字体**字节，**评委看的 JS gzip 只减几十字节**。
> D1 的出路只有「按页 code-split」；且**「198.57 KiB 这条线本身是不是官方明文」用户正在查证**（他此前不认得这条线，
> 怀疑是我们内部自设后被当成官方规则转述了 8 次）—— **在官方文件到位前，本批一个字都不许碰 D1。**

---

## 6. 门禁影响（**先说清哪些会红、为什么红**）

### 6.1 必改的门禁：**0 处**

实测 `verify_*.py` **全部与字体无关**：没有任何一份断言 `Inter`、`@font-face` 计数或字体文件存在性
（唯一相关的 `verify_vault.py:223` 断的是**字号 `28px`**、`verify_p1_456.py:162` 断的是**7 档字号阶梯** —— 都不受字体族影响）。

### 6.2 会由绿转红的**出稿前**工具（**不是回归，不要为它们改代码**）

| 脚本 | 会红哪几条 | 为什么 |
|---|---|---|
| `.workbuddy/check_p1_456_prompt.py` | **`G2_fonts_css_present_with_two_faces`**、**`G2b_public_fonts_staged`** | 两条断的都是「`fonts.css` 有**两枚** face」「`public/fonts` 里**两个** woff2 都就位」—— 本批之后 1 枚 / 1 个 ⇒ **必红**。本脚本已于第十一批加 ⛔ 使命终结抬头，**不必动它**。 |
| `.workbuddy/check_font_selfhost_prompt.py` | 内容断「`poster.js` 里有 `"Inter"`」「`emblem.js` 里有 `"Inter"`」那两条 | 已封版（75 绿 / 5 红，⛔ 抬头）。本批再加 2 条红。**不许为了让它变绿把 Inter 加回来**（红线 8）。 |

> 📌 **`check_*_prompt.py` 是「出稿前」工具，不是验收** —— 它们比的是**改动前**的代码，落地后**必然转红**。
> 真正的验收 = **21+1 份 `verify_*.py` 串行跑批 + 运行时读数**。

---

## 7. 出门自检（改完逐条打勾）

- [ ] `grep -ri inter demo/src demo/index.html demo/README.md` → **0 命中**（`pointer` / `interval` / `intersect` 不算）
- [ ] `demo/public/fonts/` 里只剩 **2 个文件**（`NotoSansSC-subset.woff2` + `OFL-NotoSansSC.txt`）
- [ ] `fonts.css` 的 `@font-face` 计数 **== 1**
- [ ] `tokens.css:36-38` 仍是 **3 行**；`:40` 仍是 `--fs-display: 44px`、`:41` 仍是 `--fs-readout: 64px`（**回读确认**）
- [ ] `base.css` 行数**未变**（`:32` 原地）
- [ ] `poster.js` 已无 `FONT_NUM`；`:118` 是「炉火不灭 · 2026」那行
- [ ] `emblem.js` 已无 `FONT_NUM`
- [ ] `.workbuddy/fontwork/` **原封不动**
- [ ] `npm run build` 成功；产物文件名记进自述
- [ ] 八页 × 两视口溢出 **16/16 全 0**
- [ ] `verify_font_drop.py` **2/2 PASS**；跑批非零集合**未新增成员**
- [ ] 海报「炉火不灭 · 2026」已重出并人工确认
- [ ] §8 回写清单 **8 条全做完**

---

## 8. 落地后的回写清单（红线 1 —— **本批最容易漏的一节**）

> 状态一变就回写**所有承载该声明的资产**；**扫结论句，不只扫文件名**；改数用**同长度替换**（净增 0 行）。

| # | 文件 | 要改什么 |
|---|---|---|
| 1 | `README.md` `:58` / `:69` / `:160` | 三处 `poster.js:119` → **`poster.js:118`**（同长度替换） |
| 2 | `README.md` `:159-160` | 待裁定列表里的「要不要删 Inter」**删掉**（已裁定并落地） |
| 3 | `README.md` 交付准备表 + `archive/spec` 归档表 | 「字体自托管 ✅」后面补：**第十二批「删 Inter」已落地**；归档提示词计数 **23 → 24** |
| 4 | `spec/PROJECT-BRIEF.md` `:91` / `:97` | 「要不要干脆删掉 Inter」→ 已裁定删除；**「C 保留 Inter」这句必须作废回写**（它是与用户裁定相反的建议） |
| 5 | `spec/IMPLEMENTATION-FONT-SELFHOST.md` 抬头 | 加 📌 后记：**「Inter 已于第十二批删除」**；本文档中所有 Inter 条目（§1.5 / §6 许可证 / §9 可搬文件清单）**保留为历史记录，不要改正文** |
| 6 | `spec/AESTHETIC-AUDIT.md` `:448-455` | 那段承载「2 个 woff2 / 328,156 B / 1,134 字形」⇒ 补一句第十二批已改单字体（**净增 0 行**，先查有没有别处引它的 `:N`） |
| 7 | `demo/src/styles/fonts.css` 头注 | 已在 §2 ②③ 里改完（族名契约段的行号引用也顺手改对） |
| 8 | `release/使用说明.md` | 第十批欠的那句**字体出处**，现在只需写 **Noto Sans SC 一种**（句样见 `IMPLEMENTATION-FONT-SELFHOST.md` §6）—— 与重打包同一趟做 |

> ⚠️ **每轮落地后两件被动核查**（别省）：
> ① 回扫 `spec/` 里未发出的提示词，**行号有没有被自己顶走**（本批**可发 = 0 份**，所以这次只需回扫归档件里的**位移描述**，
> 判据 = 那句说的是「**改前**的值被移动」还是「**现在**的值是什么」；前者**不要改**）；
> ② 回扫 `index-[A-Za-z0-9_-]+\.(js|css)` —— 本批会换掉**两个**产物名，任何待发稿里的旧产物名都要一起换。

---

## 9. 本批**不**包含

- ❌ **不动 D1 体积**（另立一轮 code-split；且官方口径在查证中）
- ❌ 不动 `--fs-*` 字号阶梯 / `--r-*` 圆角 / 字距（那是第十一批的事，已落地）
- ❌ 不动 `layout.css:1492` / `:1557` 的 `var(--font-num)`（靠 ⑤ 的 token 保值自动生效）
- ❌ 不删任何 `.num` / `.latin` 类名或其消费点
- ❌ 不加 `preload` / 不改 `font-display` / 不动 `document.fonts.ready` 的 2 s 兜底
- ❌ 不动 `.workbuddy/fontwork/`
- ❌ 不重打包 `release/dist`（另做，但**建议与 §8 第 8 条同一趟**）

---

## 10. 用户在验收时会看到什么（**先说清楚，免得当成事故**）

1. **所有数字变窄约 1/5**，数字块整体更紧凑、更"小字号感"。这是本批**最主要、也最明显**的视觉变化。
2. **拉丁字母换脸**（Inter → Noto 的拉丁部分），字面更"方"、字距更松，`C620-1` 这类混排会明显变窄。
3. 因为数字更窄，**某些原本折行的行不再折行**，个别区块会因此变矮 —— 这是**布局收益**，不是丢内容。
4. **导出海报**上「炉火不灭 · 2026」那一行的汉字**换脸**（本批修掉了它与页面的分叉）。
5. `dist/fonts/` 从 4 个文件变 2 个；网页请求数少 1。

> ⚠️ 如果上面第 1 条看起来"太窄、不可接受"，**回退成本很低**：把 `tokens.css:36-38` 三行改回原样、
> `poster.js` / `emblem.js` 的 `FONT_NUM` 恢复、两个字体文件放回 `public/fonts/` 即可。
> **但一旦本批落地并归档，回退要新开一轮** —— 所以**第 1 条请在落地前先看一眼 A/B 对比图再拍板**。
