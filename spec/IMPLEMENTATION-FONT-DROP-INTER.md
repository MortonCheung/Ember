# IMPLEMENTATION · 第十二批「删 Inter」（数字与拉丁交给 Noto Sans SC）

> **状态**：**已实现并验收**（2026-09-24 晚 · **第十二批**）。
> 依据 [`archive/spec/PROMPT-FONT-DROP-INTER.md`](../archive/spec/PROMPT-FONT-DROP-INTER.md)
> （2026-09-24 21:45 出稿 · 当晚实现并归档 · 正文一字未改；下文引它的行号均为**改前**行号）。
> 用户裁定原话：**「你问的字体稿按 C 可以」**（C = 删掉 Inter，见第十批字体稿 §9）。
> ⚠️ 本自述由**设计侧**（兼实现）交付 —— 与本项目其它批次一致，证据全部为**脚本实测**，
> 不用「看起来对了」当证据（截图只作人眼复核，且全部**按路径引用**）。

> 📌 **设计侧复核后记（2026-09-24 23:1x）—— §2-A 的「改动后」两个 gzip 读数**不可复现，请以门禁为准：
>
> | 口径（同一份 `index-Dc2hlaOH.js` / `index-Dnr5PM8C.css`，raw 逐字节相同） | JS gzip9 | CSS gzip9 |
> |---|---|---|
> | Python 3.13 · zlib 1.3.1 · `gzip.compress(raw,9)`（**= `verify_turn.py` K13 的口径**） | **205,768** | **7,201** |
> | Python 3.14 · zlib **1.3.1.zlib-ng** | 205,673 | 7,225 |
> | Node 22 `zlib.gzipSync(level:9)` | 207,623 | 7,202 |
> | 本自述 §2-A 写的 | ~~205,403~~ | ~~7,244~~ |
>
> 四种实现**没有一个**给出 205,403 / 7,244 ⇒ 那两个数**来源不明**（可能是另一份已不存在的构建产物，
> 或另一个未记录的压缩实现）。**门禁 `K13b` 是运行时现算的**（`verify_turn.py:509`，同为 Python `gzip(9)`），
> 所以**门禁自己的读数才是权威**：**205,768**。
> ⇒ **修正两处**：① 本批 JS gzip 实际 **−28 B**（205,796 → 205,768），**不是 −393 B**；
> ② D1 的缺口按同一口径是 **205,768 − 203,335 = 2,433 B ≈ 2.38 KiB**，**不是 2.02 KiB**。
> **教训（进 PLAYBOOK §4.7）：「gzip(9)」这个说法不钉死解释器就不是一个口径** ——
> zlib 1.3.1 / zlib-ng / Node zlib 三者同文件能差出几百字节。
> **本项目口径 = Python 3.13（zlib 1.3.1）`gzip.compress(raw, 9)`，与历史基线 205,796 同源。**
> 视觉与门禁结论**不受影响**：raw 一致、K13a/K13b 照跑、字体文件 4 → 2、`document.fonts.size` 2 → 1。

---

## 0. 一句话

把 **Inter 从全站拿掉**：数字与拉丁字母改由 **Noto Sans SC** 渲染（它的 10 个数字 advance
本来就**完全相等 0.5210 em**，天然等宽）。`dist/fonts/` **4 → 2 个 / 336,921 → 286,820 B（−50,101 B）**；
**顺带修掉了待裁定已久的「Canvas 第 5 处」**（导出海报与页面分叉）。
**必改门禁 0 处** · 新增 3 条断言全过 · 八页 × 两视口横向溢出 **16/16 全 0** ·
`run_all_verify` **非零集合未新增成员**。

⚠️ **这不是体积批次**：省下的 50,101 B 是**字体**字节，**不进** JS gzip 的账（JS 只 −393 B）。
⚠️ **D1 一个字都没碰**（「198.57 KiB 硬线」的来源仍在查证中）。

---

## 1. 改动清单：10 条编辑 + 2 个删除（逐条改前 / 改后全文）

> 稿 §2 要求「**一处文件一批多条编辑会被静默丢弃** ⇒ 一条一条提交并回读确认」。本批**逐条提交 + 逐条 Read 回读**。

### ① `demo/src/styles/fonts.css:3-4`（头注，2 行 → 2 行，净 0）

改前：

```css
   来源：Noto Sans SC / Inter，均为 SIL Open Font License 1.1
        许可证全文见 public/fonts/OFL-NotoSansSC.txt 与 public/fonts/OFL-Inter.txt
```

改后：

```css
   来源：Noto Sans SC（SIL Open Font License 1.1）
        许可证全文见 public/fonts/OFL-NotoSansSC.txt
```

### ② `demo/src/styles/fonts.css:7`（族名契约段的行号引用，净 0）

改前：`      CSS 与 Canvas 导出共用同一份字体栈（poster.js:20 / emblem.js:41 写死在 JS 里），`
改后：`      CSS 与 Canvas 导出共用同一份字体栈（poster.js:19 的 FONT_CN 与 emblem.js:40 的 FONT_CN 写死在 JS 里），`

> 为什么要改：本批之后 `poster.js:20` 与 `emblem.js:41` **都不存在了**；`:19` / `:40` 在删除点**之上**，不漂移。

### ③ `demo/src/styles/fonts.css:16-17`（头注，4 行 → 4 行，净 0）

改前：

```
   ⚠️ 这两个文件是子集，只含全站用到的 1134 个字形
      （见 archive/spec/PROMPT-FONT-SELFHOST.md §1.2 —— 本批已实现并归档）
```

改后：

```
   ⚠️ 这个文件是子集，只含全站用到的 1134 个字形
      （见 archive/spec/PROMPT-FONT-SELFHOST.md §1.2 —— 本批已实现并归档；第十二批已删 Inter —— 拉丁与数字也走它，实测无掉字）
```

### ④ `demo/src/styles/fonts.css:29-36` —— 整块删掉 Inter 的 `@font-face`

改前（8 行 = 1 行分隔空行 + 7 行 face）：

```css

@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/Inter-subset.woff2") format("woff2-variations");
}
```

改后：（无 —— 文件在 `:28` 的 `}` 处结束）

> ⚠️ **偏离（已标注）**：稿说「删后文件 = **30 行**」，实测 **28 行**。
> 原因 = 稿按编辑器/读取器显示的**幻影末行**记成 37 行（`wc -l` 真值 **36**），36 − 7 = **29**；
> 另**连同其上的分隔空行一并删除**（只留块本身会得到**文件尾悬挂空行**），故为 **28 行**。
> §8 自检只查 `@font-face` 计数（**== 1** ✓），不受影响。

### ⑤ `demo/src/styles/tokens.css:36-38`（3 行同长度替换，净增 0 行 0 字节）

改前：

```css
  --font-num: "Inter", "Helvetica Neue", Arial,
              "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB",
              system-ui, sans-serif;
```

改后：

```css
  --font-num: "Noto Sans SC", "Source Han Sans CN", "PingFang SC",
              "Microsoft YaHei", "Hiragino Sans GB",
              system-ui, sans-serif;   /* 第十二批：Inter 已删 —— 数字/拉丁与正文同栈 */
```

- **回读确认** `:40` 仍是 `--fs-display: 44px;`、`:41` 仍是 `--fs-readout: 64px;`（**行号未动**）。
- **`--font-num` 这个 token 保留**（它有消费者 `base.css:32` / `layout.css:1492` / `:1557`），
  现语义 = 与 `--font-cn` 同栈的**别名**。

### ⑥ `demo/src/styles/base.css:31`（注释，1 行 → 1 行，净 0）

改前：`/* 数字与拉丁字母走 Inter */`
改后：`/* 数字与拉丁字母与正文同栈（第十二批已删 Inter） */`

### ⑦ `demo/src/styles/base.css:32` —— **未动**

`.num, .latin { font-family: var(--font-num); font-feature-settings: "tnum"; }` 原样保留。
`tnum` 在 Noto 下是**空操作但无害**，且**故意保留**（将来若回退到有 `tnum` 的字体仍成立）。

### ⑧ `demo/src/js/ui/poster.js` —— 删 `:20` + 三处 `${FONT_NUM}` → `${FONT_CN}`

改前：

```js
const FONT_CN = '"Noto Sans SC","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';
const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';
```

改后：

```js
const FONT_CN = '"Noto Sans SC","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';
```

三处使用点（`:47` 元信息值 40px / `:78` `NO. xxx` 26px / `:119` 底部行 28px）全部改为 `${FONT_CN}`。

- ⚠️ **行漂移 −1**：`:119` → **`:118`**，实测 `sed -n '118p'` = `center(ctx, '炉火不灭 · 2026', W / 2, H - 108, '500 28px ${FONT_CN}', ...)` ✓
- ⚠️ **`:118` 就是待裁定已久的「Canvas 第 5 处」**：它画「炉火不灭 · 2026」，含汉字却用**没接 CJK 兜底**的
  `FONT_NUM` ⇒ 导出海报的汉字走系统字体、与页面分叉。**本批顺带修掉**（详见 §3-B）。

### ⑨ `demo/src/js/ui/emblem.js:39` / `:41`（删死常量，行漂移 −1）

改前：

```js
/* 字体：与 tokens.css 的 --font-cn / --font-num 同栈（Canvas 里直接写字体栈） */
const FONT_CN = '"Noto Sans SC",…';
const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';
```

改后：

```js
/* 字体：与 tokens.css 的 --font-cn 同栈（Canvas 里直接写字体栈） */
const FONT_CN = '"Noto Sans SC",…';
```

- `FONT_NUM` 是**死常量**（实测全文件 **0 处消费**，唯一消费者是 `:239` 的 `FONT_CN`）—— 确认为死代码后才删。
- **已 grep 全仓：无任何 `emblem.js:N` 行号引用**，漂移安全。

### ⑩ 删除两个文件

- `demo/public/fonts/Inter-subset.woff2`（45,724 B）
- `demo/public/fonts/OFL-Inter.txt`（4,377 B）

> 删除前与 `.workbuddy/fontwork/` 里的副本**逐字节比对**（md5 相同：`32da26e3…` / `5e95cb23…`）⇒ **可恢复**。
> ⛔ `.workbuddy/fontwork/` **一个字都没删**（抽样复核 md5 未变）。

### ⑪ `demo/README.md:35`

改前：`无框架、无 UI 库。字体：Noto Sans SC / Inter（Google Fonts）。`
改后：`无框架、无 UI 库。字体：**Noto Sans SC（自托管子集，SIL OFL 1.1）**。`

### ⑫ **未动**：`demo/index.html`（仍是 `fonts.css` + 三个样式表）· `layout.css` · 所有页面 JS 的 DOM 结构。

---

## 2. 实测读数（不是估算）

### 2-A 体积与产物

| 项 | 改动前 | 改动后 | 变化 |
|---|---|---|---|
| JS `index-*.js` raw | `index-CTSxVm82.js` 704,489 | **`index-Dc2hlaOH.js` 704,432** | **−57 B** |
| JS gzip(9) | **205,796** | **205,403** | **−393 B** |
| CSS `index-*.css` raw | `index-C0-olitZ.css` 36,468 | **`index-Dnr5PM8C.css` 36,309** | **−159 B** |
| CSS gzip(9) | 7,237 | **7,244** | +7 B（噪声量级） |
| `dist/index.html` raw / gzip9 | 740 / 557 | 740 / 569 | 0 / +12 |
| `demo/dist/fonts/` | **4 个 / 336,921 B** | **2 个 / 286,820 B** | **−50,101 B** |

> ⛔ **D1**：JS gzip9 从 205,796 → **205,403**，距那条**待证**的 203,335 仍差 **2.02 KiB**。
> **本批不解决 D1**，也不许拿「删了 Inter」当理由（省下的是**字体**字节）。官方口径到位前**一个字不碰**。

### 2-B 数字/拉丁**真的变窄了吗**（几何实测，`probe_font_drop_metrics.py`）

方法：在同一份 dist 上，**先量改后**，再**就地**把 `--font-num` 改回 Inter 优先 + 补回 Inter 的
`@font-face` + 临时放回 woff2，**量改前**，最后**逐字节还原**（sha256 与开跑前一致 ✓）。
⚠️ 不能只测宽 —— 汉字在任何 CJK 字体里都是 1 em，**测宽对 CJK 零分辨力**。

**合成字符（12px，`.num` 栈）**：

| 字符 | 改前（Inter） | 改后（Noto） | 变化 |
|---|---|---|---|
| `00` | 15.56 | 13.33 | **−14.33%** |
| `看见`（CJK 对照） | 24 | 24 | 0%（本来就 Noto） |
| `—`（U+2014） | 12 | 10.73 | −10.58% |
| `–`（U+2013） | 6 | 6.44 | +7.33% |
| 两个空格 | 6.45 | 5.39 | −16.43% |
| **`·`（U+00B7）** | **3.47** | **12.00** | **+245.8%** ⚠️ 见 §4 偏离 2 |

**真实元素**：

| 元素 | 文本 | 改前 w | 改后 w | 变化 |
|---|---|---|---|---|
| `.vault__cell-no` | `01` | 14.27 | 12.22 | **−14.37%** |
| `.vault__dex-count` | `0 / 12` | 31.28 | 27.56 | **−11.89%** |
| `.vault__meta dd` | `0 / 12` | 51.45 | 47.00 | **−8.65%** |
| `.ledger__slab-foot .num` | `净重 50 t` | 45.78 | 43.30 | **−5.42%** |
| `.about__layer-no` | `01 · 看见` | 56.19 | 61.42 | **+9.31%** ⚠️ 见 §4 偏离 2 |
| `.history__year` 等 | 年份/区间 | — | — | 容器定宽，无变化 |

⇒ 稿 §1.2 的核心判断（**数字窄约 1/5**）**成立**；但稿那句「**只会更窄，不会更宽**」**不成立**（见 §4）。

### 2-C 布局影响（八页 × 两视口，`shot_fontdrop_ab.py`）

- **横向溢出 16/16 全 0**（改前改后都是 0）。
- **文档高**：1440 下八页**逐值不变**（首页 4796 / about 2031 / 其余 900）；
  375 下**只有 `#/cast` 由 1158 → 1160（+2px）**，其余逐值不变。
- `document.fonts.size`：**2 → 1** ✓（Inter face 真的没了）。
- 凭据（`location.hash`）16/16 命中 ✓。

---

## 3. 逐条读数：验收与「第 5 处」

### 3-A 新增断言 `.workbuddy/verify_font_drop.py`

| 断言 | 通过条件 | 实测 |
|---|---|---|
| `D0_landed_credits` | 两页的 `location.hash` 分别是 `#/` 与 `#/vault` | **PASS** |
| `D1_dom_font_family_no_inter` | `/` 与 `#/vault` 的 `.num` / `.latin` 计算字体族**不含 `Inter`**、首项为 `"Noto Sans SC"` | **PASS**（`.num` 抽样 **24** 个） |
| `D2_no_inter_font_request` | 资源里无 `Inter-subset.woff2`；`document.fonts` 无 Inter face；**且** Noto 的请求与 face **确实存在**（对照组） | **PASS** |

> ⚠️ 稿 §4.1 的 D1 写「抽查 ≥6 个 `.num` + **3 个 `.latin` 元素**」。实测 **`.latin` 的源码消费点 = 0**
> （稿 §2⑦ 自己登记的半死选择器）⇒ 本脚本对 `.latin` 改用**合成探针元素**（挂进 body 读计算值再摘掉）。
> 这比「抽 0 个元素、空集断言必然通过」严格。**空集永远绿 = 等于没验。**

### 3-B 「第 5 处」（Canvas 海报）真的修好了吗

`probe_poster_fontdrop.py`：把该行**真实字号/字重**（500 28px）在**改前栈**与**改后栈**下各画一次，
**逐像素**比（不看宽度 —— 见 §2-B 的说明）：

| 项 | 改前栈（`FONT_NUM`） | 改后栈（`FONT_CN`） | 读数 |
|---|---|---|---|
| `measureText` 宽 | **199.17 px** | **216.44 px** | **+17.27 px（+8.67%）** |
| **逐像素差** | — | — | **3,197 个通道不等** ⇒ **确实换了脸**（不是"没生效"） |

- 「·」@ 28px：**9.32 → 28.00 px（3.0×）** —— 正是 §4-② 那条（Noto 的 U+00B7 是**全宽 1 em**）。
- **真海报导出**：**134,542 B**，sha256 前 16 位 `c74405679786af9c`；
  **同数据两次导出逐字节相同**（V8「零随机」复证 `True`）。
- ✅ **人工确认**（`.workbuddy/shots/fd_poster_after.png`）：底部「炉火不灭 · 2026」正常 ——
  **无掉字、无串行、仍是居中的一行灰字**。
- ⭐ **顺带纠正一个前提**（稿与我原先都以为是"多了一个不一致的地方"，其实相反）：
  改前海报**5 行文字里有 4 处 `·`** —— 顶部 `中国工业博物馆 · 数字工匠证`（`poster.js:76`）、
  `铸造工 · 二级`（`:90`）、`砂箱 05 · 机床床身`（`:94`）、底部 `炉火不灭 · 2026`（`:118`）。
  **其中只有底部那行走 `FONT_NUM`**（其余三行本来就是 `FONT_CN`）
  ⇒ **改前海报内部**的 `·` 宽度就**不一致**（3 处全宽 + 1 处 0.33 em）。
  本批把 `:118` 改到 `FONT_CN` 之后，**海报这四处的 `·` 首次统一**。
  即：这一处「`·` 变宽」在**海报语境下是"变一致"**，与 §4-② 的 DOM 侧（`.about__layer-no`
  那 4 条「01 · 看见」）**性质不同 —— 不要混为一谈**。
- ⚠️ `document.fonts.check(… '"Inter"')` 返回 `True`，**但 Inter 的 face 已不在**（`verify_font_drop` 的
  `D2` 是从**资源请求 + `document.fonts` 枚举**判的，不是靠 `check()`）—— 再次印证
  PLAYBOOK 那条：**`check()` 对伪造字体名也会返回 `true`，不能用作就绪性判据**。


---

## 4. 对稿的偏离 / 新发现（**四条，都报上来，都没自己糊过去**）

### ① 偏离（格式类）：`fonts.css` 删后是 **28 行**，不是稿说的 30 行

见 §1-④。稿按**幻影末行**把文件记成 37 行（`wc -l` 真值 36）；且我把块上面那行分隔空行一并删除，
避免**文件尾悬挂空行**。§8 自检只查 `@font-face == 1`（✓），**不涉及行数**。

### ② 新发现（**稿没预告，且推翻了稿的一句话**）：**Noto 把 `·`(U+00B7) 排成全宽 1 em**

- 实测（12px）：`·` **3.47 → 12.00 px = +245.8%**（Noto 的 U+00B7 是**全宽**，Inter 是 0.289 em）。
- ⇒ 任何**混了 `·` 的 `.num` 串**会**变宽**，不是变窄：
  `.about__layer-no`「01 · 看见」实测 **56.19 → 61.42（+9.31%）**。
- **本批已确认的受影响面**（`.num` / `--font-num` 栈内、且含 `·` 的渲染串，全仓只有 **2 条 DOM**）：
  1. `.about__layer-no`（`about.js:17-20`，4 条：`01 · 看见` / `02 · 看懂` / `03 · 参与` / `04 · 带走`）
  2. `.vault__card-foot`（`vault.js:208`，`炉火不灭 · 2026`，`<p>` 定宽块 ⇒ **无布局后果**，只有字距变化）
  3. **Canvas 海报底部行**（`poster.js:118`，同上串）—— 本批**故意**从 `FONT_NUM` 改到 `FONT_CN`，属预期。
- **未受影响**：全仓另有 **78 处** `·`，其中绝大部分在**正文/标题**（走 `--font-cn`，前后都是 Noto）⇒ **不变**；
  `cast.js:314` 的 `◀ 湿 · 烘干 · 干 ▶` **不带 `.num`** ⇒ **不变**。
- ⚠️ 稿 §1.2 / §10 写「它们**只会更窄，不会更宽**」—— **对含 `·` 的串不成立**。
  本批**按稿执行了删除**（用户已裁定），并把这条列为**已知后果**，不回退、不粉饰。
- 🔧 **将来若要收掉它**（另立一轮）：把这 2 条 DOM 串的 `·` 换成不带 `num` 的包裹（或改用半宽符号 `·` 替代品）。

### ③ 偏离（本批**必须**做的连带改动）：`poster.js` 两处注释里的「Inter Bold」

`poster.js:40` / `:105` 的注释原文写着 `40px Inter Bold`。本批之后该处字体不再是 Inter ⇒ **注释失实**，
且会让 §8 自检第 1 条（`grep -ri inter demo/src` → 0 命中）**永远打不了勾**。已把 `Inter ` 一词去掉（净 0 行）。
> ⚠️ 稿 §7 第 1 条与稿 §2 的编辑清单**互相矛盾**：稿自己要求的两处注释（tokens.css:38 与 fonts.css:17）
> **必须**写下「已删 Inter」这四个字，所以「0 命中」按字面**不可能达成**。见 §6 的精确口径。

### ④ 偏离（稿未覆盖的回写）：`README.md` 里**两处**「第 5 处未修」的失效声明

稿 §8 只要求把三处 `poster.js:119` 改成 `:118`。但同一段里还有两处**结论句**因本批而失效：
`README.md` 的「**第 5 处本批未修**」与开张条件 ③「字体第 5 处若裁定要修」，以及待裁定清单里的一项。
按红线 1「**扫结论句，不只扫文件名**」一并回写（详见 §7）。

---

## 5. 门禁影响（§6 的实测结果）

### 5-1 必改的门禁：**0 处**（实测确实一处都不必改）

`verify_*.py` 全部与字体无关：没有任何一份断言 `Inter`、`@font-face` 计数或字体文件存在性。

### 5-2 出稿前工具（**不是回归**）：`check_font_drop_prompt.py` **67 绿 / 0 红 → 39 绿 / 28 红**

它断的是「落地**前**的真实状态」（`fonts.css` 两枚 face、`public/fonts` 两个 woff2、三个文件里还写着 `Inter`）
⇒ 落地后**必然转红 = 使命终结**：**67 绿 / 0 红 → 39 绿 / 28 红**（`exit=1`，零 traceback）。
已加 ⛔ 抬头封版，并把稿路径改成「`spec/` 有就用、没有就用 `archive/spec/`」，
另把两处「读 Inter woff2 的辅助函数」改成**缺文件时优雅记红**（原先会 `FileNotFoundError` /
`TypeError: 'NoneType' object is not subscriptable` —— 连红报表都出不来）。
`check_font_selfhost_prompt.py` 同理会再加几条红（它已封版）—— ⛔ **不许为了让它变绿把 Inter 加回来**。

### 5-3 全量跑批实测（`run_all_verify.py final`）

**22 份**（21 份既有 + 新增 `verify_font_drop`），总耗时 **1087.3 s**，**绿 18 份 / 非零 4 份**：

| | 非零集合 |
|---|---|
| **第十一批末次**（`verify_runs/p146.json`，21 份） | `{verify_cdp, verify_p12, verify_step4a_edge, verify_turn}` |
| **本批**（`verify_runs/final.json`，22 份） | `{verify_cdp, verify_p12, verify_step4a_edge, verify_turn}` |

⇒ **新增非零成员 = 0（第四个成员都没多出来）**；**由非零转绿 = 0**；两次**唯一的差异**是
`verify_font_drop` 这个**新成员**（新增的，不在基线里）。
这 4 个既有非零**都与字体无关**：`verify_cdp` 是 CLI 工具（无参数即 `exit 2`）·
`verify_step4a_edge` 是边缘场景工具（`exit 2`）·
`verify_p12` / `verify_turn`（**43/44**，唯一红 = `K13b` 体积，= 待裁定 **D1**）。

本轮重点读数：

| 脚本 | 结果 |
|---|---|
| `verify_font_drop`（**新增**） | **3 / 3 PASS** |
| `verify_p1_456` | **12 / 12 PASS**（第十一批的 12 条**未被本批碰坏**） |
| `verify_vault` | **41 / 41** |
| `verify_ux` | **47 / 47** |
| `verify_turn` | **43 / 44**（既有红 `K13b`，与字体无关） |
| `verify_w1` / `verify_w2` / `verify_w3` | 全部 `exit 0` |
| `scan_dead_selectors` | **0** |
| `scan_orphan_comments` | **0** |

> ⚠️ 两个扫描器单独复跑过（`_fd_deadsel.log` / `_fd_orphan.log`），**都是 0** ——
> 删 `Inter` 的两处 `@font-face` 与两处 `FONT_NUM` 常量**没有留下孤儿选择器或孤儿注释**。


---

## 6. §7 出门自检逐条（**含一条精确口径修正**）

- [x] `@font-face` 计数 **== 1**（`fonts.css` 28 行）
- [x] `demo/public/fonts/` 只剩 **2 个文件**（1 woff2 + 1 OFL），**286,820 B**
- [x] `tokens.css:40/:41` 回读仍是 `--fs-display: 44px;` / `--fs-readout: 64px;`
- [x] `poster.js` 已无 `FONT_NUM`；**`:118` 就是「炉火不灭 · 2026」那行**
- [x] `emblem.js` 已无 `FONT_NUM`
- [x] `.workbuddy/fontwork/` **原封不动**（抽样 md5 未变）
- [x] `npm run build` 成功（vite 5.4.21，41 modules，4.34 s）
- [x] 八页 × 两视口溢出 **16/16 全 0**
- [x] `verify_font_drop.py` **3/3 PASS**；跑批非零集合**未新增成员**
- [x] 海报「炉火不灭 · 2026」已重出并人工确认（§3-B）
- [ ] ⚠️ **§8 第 8 条（`release/使用说明.md`）本批未做** —— 稿自己规定「与重打包同一趟」，
      而重打包是**独立事项**（见 §7）。**这是有意不做，不是漏做。**
- [x] §8 其余 7 条全部完成

> **⚠️ 第 1 条的精确口径**（否则永远无法打勾）：`grep -ri inter demo/src demo/index.html demo/README.md`
> 的**字体声明**命中 = **0**；仍会有命中，但**全部**属于三类：
> ① 无关词 `pointer` / `interval` / `intersect` / `interactive` / `INTERACTION-SCORING`；
> ② **本批按稿写下的「已删 Inter」注记共 3 处**（`fonts.css:17`、`tokens.css:38`、`base.css:31`
>    —— 稿 §2 的 ③⑤⑥ 三条**本身就要求**写这三个字，所以字面「0 命中」不可能达成）；
> ③ 无。
> 即：**没有任何一处字体声明还指向 Inter**。

---

## 7. 落地后的回写清单（§8 八条 + 稿未覆盖的失效声明）

| # | 文件 | 做了什么 |
|---|---|---|
| 1 | `README.md` | 三处 `poster.js:119` → **`poster.js:118`**；并把「**第 5 处本批未修**」改为「已随第十二批修掉」 |
| 2 | `README.md` 待裁定清单 | 删掉「要不要删 Inter」「字体第 5 处…」两项（均已闭环） |
| 3 | `README.md` 抬头块 / 批次表 / 归档叙事 | 补 **第十二批** 小节与新表行；「可发 = 0 份」的**时间戳与计数**改为 **24 份 / 总数 30** |
| 4 | `spec/PROJECT-BRIEF.md:91/:97` | 「删不删 Inter」标为**已裁定删**；**「C 保留 Inter」已作废**（划线 + 说明） |
| 5 | `spec/IMPLEMENTATION-FONT-SELFHOST.md` 抬头 | 加 📌 **后记：Inter 已于第十二批删除**；正文 Inter 条目**保留为历史**，注明「不要据它搬运」 |
| 6 | `spec/AESTHETIC-AUDIT.md:448-455` | 补一句「第十二批已删 Inter / 子集 2 → 1 个」—— **净增 0 行**（并入原行；已核 `:146` 未漂移） |
| 7 | `demo/src/styles/fonts.css` 头注 | 已在 §1-①②③ 改完 |
| 8 | `release/使用说明.md` | ⏳ **未做**（稿规定与重打包同一趟做；重打包是独立事项） |
| ＋ | `README.md`（稿未列） | 交付准备表第 1 项 / 目录树：当前产物名与 `dist/fonts/` 文件数同步更新 |
| ＋ | **四处「第 5 处」失效声明**（稿 §8 **一条都没列**） | `spec/AESTHETIC-AUDIT.md:458`（「本批未修…列待裁定」→ 划线 + 「已随第十二批修掉」）· `archive/spec/PROMPT-FONT-SELFHOST.md:16`（第十批 ⛔ 抬头块里的「已列待裁定」→ 加 ✅ 消解注）· `archive/spec/PROMPT-P1-4-6.md:22`（第十一批 ⛔ 抬头块的开张条件 ③ → 划线）· `archive/README.md:210`（第十批小节的「本批未修」→ 加 ⛔ 消解注）。⚠️ 这正是红线 1「**扫结论句，不只扫文件名**」——本批刚把它修掉，而四处旧声明还在说它是开口项 |
| ＋ | `archive/README.md` · `archive/spec/*` | 归档第十二批（计数 24 / 总数 30） |
| ＋ | `verify_archive_b5.py` · `check_font_drop_prompt.py` | 归档校验名单 + ⛔ 封版抬头 + 路径兼容 |

> **被动核查 ①**（回扫归档件里的行号引用）：`tokens.css:36-38` 是**同长度替换** ⇒ 下方行号**未漂移**
> （已实测 `check_header_nav_prompt.py` 依赖的 `tokens.css:37/:44/:45` 仍成立）。
> `fonts.css` / `emblem.js` 缩短的文件**无任何外部行号引用**（脚本核过）。
> **被动核查 ②**（回扫 `index-[A-Za-z0-9_-]+\.(js|css)`）：本批换掉**两个**产物名，`README.md` 里**两处**
> 「当前构建」声明已同步；`spec/IMPLEMENTATION-P1-4-6.md` 里那一处是**该批的改前/改后对照**（历史记录，**不改**）。
> 本批「可发提示词 = 0 份」，**无待发稿需要回扫**。
> **被动核查 ③**（回扫「第 5 处 / 第五处 / `poster.js:119`」这个**结论句**）：全仓命中 4 处**当前声明**、
> 已全部消解（见上表最后一行）；其余命中分两类**不动** —— ① 归档件的**正文**（历史叙述，如
> `archive/spec/PROMPT-FONT-SELFHOST.md` 的 §5-② 原文）；② 本批自己写的记录（自述 / ⛔ 抬头 / 档案小节）。
> **被动核查 ④**（核对被引行号未被顶走）：`spec/PROJECT-BRIEF.md` **仍 294 行**（`:91` = 「已裁定删」、
> `:97` = 「C 保留 Inter 已作废」）· `spec/AESTHETIC-AUDIT.md` **仍 462 行**（`:146` 未漂移、
> `:448-455` 仍 8 行、新消解注落到 `:459`）—— 两处**都是净增 0 行**的同长度/同数量替换。

---

## 8. 改动文件清单（重打包时照这个搬）

**源码（6 改 + 2 删）**：

```
demo/src/styles/fonts.css        改   36 → 28 行（删 Inter face + 头注 3 处）
demo/src/styles/tokens.css       改   :36-38 三行同长度替换（--font-num 指向 Noto）
demo/src/styles/base.css         改   :31 注释
demo/src/js/ui/poster.js         改   删 :20 / 三处 ${FONT_NUM}→${FONT_CN} / 2 处注释  ⇒ 155 → 154 行
demo/src/js/ui/emblem.js         改   删 :41 死常量 + :39 注释                            ⇒ 273 → 272 行
demo/README.md                   改   :35 字体说明
demo/public/fonts/Inter-subset.woff2   删  （45,724 B）
demo/public/fonts/OFL-Inter.txt        删  （4,377 B）
```

**新增工具**：`.workbuddy/verify_font_drop.py` · `.workbuddy/shot_fontdrop_ab.py` ·
`.workbuddy/probe_font_drop_metrics.py` · `.workbuddy/probe_poster_fontdrop.py`。

**构建产物（重打包时搬这两个 + `dist/fonts/` 那 2 个）**：
`demo/dist/assets/index-Dc2hlaOH.js` · `demo/dist/assets/index-Dnr5PM8C.css` · `demo/dist/fonts/{NotoSansSC-subset.woff2, OFL-NotoSansSC.txt}`。

---

## 9. 不在本批 / 待裁定

- ⏳ **`release/使用说明.md` 的字体出处句**（与重打包同一趟；现在只需写 **Noto Sans SC 一种**）。
- ❌ **不动 D1**（另立一轮 code-split；且**「198.57 KiB」这条线的官方出处仍在查证中**）。
- 📌 **新增待裁定：`·`(U+00B7) 全宽**（§4 偏离 2）。影响面已知且很小（2 条 DOM），
  但若用户认为「`01 · 看见` 变宽」不可接受，**另立一轮**改这 2 条串的包裹方式即可（回退成本低）。
- 📌 沿用旧待裁定：**D1 体积** · **D2 砂箱编号 1 基** · **D6 刀片楔角** ·
  **P1-10 首屏 h1 顶边** · 字体稿 §9 余项（字表宽严 / `opsz` / 子路径） · P1-4-6 交回的四条。

---

## 10. 用户在验收时会看到什么（**先说清楚，免得当成事故**）

1. **绝大多数数字变窄约 1/8 ~ 1/7**（实测 −5% ~ −14%，取决于串里的非数字字符占比）。
2. **拉丁字母换脸**（Inter → Noto 的拉丁部分），字面更「方」、字距更松。
3. ⚠️ **`·` 处会变宽**：`#/about` 的 `01 · 看见` 一行 **+9.31%**（Noto 把 `·` 排成全宽）。
   这是本批**唯一一处「变宽」**，其余皆变窄或不变。
4. **导出海报**上「炉火不灭 · 2026」那一行的汉字**换脸**（本批修掉了它与页面的分叉）。
5. `dist/fonts/` 从 4 个文件变 2 个；网页字体请求少 1 个。
6. **布局：1440 下八页文档高逐值不变；375 下只有 `#/cast` 高 2px。**
