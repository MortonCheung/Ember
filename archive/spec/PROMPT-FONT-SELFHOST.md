# 提示词 · 字体自托管与子集化（交付准备 · 第 2 项 · 体检「字体」/ impeccable `google-font`）

> ⛔ **【已归档 · 2026-09-24 · 第十批 · 不要发送本文件】**
> **本稿已于 2026-09-24 实现并交付** —— 自述 **`spec/IMPLEMENTATION-FONT-SELFHOST.md`**
> （`demo/index.html:9-11` 三行 Google Fonts 外链 → **2 个自托管可变 woff2 子集**
> **328,156 B / 1,134 字形**；`tokens.css:32` 的 `--font-num` 接上 CJK 兜底，
> 修掉 **4 处「同一行两种字体」**；**必改门禁 0 处**，实测确实一处都不必改）。
> **这里的每一项都已经在代码里了** —— **再发一次等于让实现方重做一遍。**
> 📌 归档原因：**出稿当晚即实现并交付** ⇒ 按规矩整份移出 `spec/`。
> 正文一字未改，**下文所有行号均为「改前」行号**（`index.html:9-11`、`tokens.css:32`
> —— 落地后 `index.html` 的 `:9` 已是 `fonts.css`，`tokens.css` 的 `:32` 已由 1 行变 3 行，
> 并把全文件行号**整体 +2**）。
> ⚠️ **落地时对本稿有两处有据偏离**（正文与 §3.6 已就地写明）：
> ① **不加 `<link rel=preload ... as="font">`** —— 实测它触发假警告并让 `verify_turn` **43/44 → 41/44**
> （缓存命中导致「预加载未被复用」），收益为零；② 见自述 §5「新发现」表：
> **本稿的「4 处」实为 4 处 DOM + 1 处 Canvas（`poster.js:119`）**，第 5 处**本批未修**，
> 已列待裁定 —— 原因是它动 JS 内容（连带 `K11`/哈希），须另走一轮出稿。
> ✅ **该「第 5 处」已于第十二批修掉**（依据 `archive/spec/PROMPT-FONT-DROP-INTER.md`，2026-09-24 晚）：
> 该行改用 `FONT_CN`（现为 `poster.js:118`）—— 上面这句「已列待裁定」**已过期，仅作历史**。
> ⚠️ 本核查脚本 `.workbuddy/check_font_selfhost_prompt.py` 是**出稿前**用的（比对改动前代码），
> 落地后必然转红（**75 绿 / 5 红**，5 红全是「断言改动前状态」）—— 那不是回归，是它的使命结束了
> （已加 ⛔ 抬头封版，红线 8）。

> **状态：可发**（2026-09-24 出稿）
> **前置：无。** 与 `spec/PROMPT-P1-4-6.md`（圆角/字号/字距）**互不依赖**、可只发一份。
> ⚠️ **但落地顺序有硬裁定：本份先落、P1-4-6 后落**（2026-09-24 第十二轮）—— 先把**文字度量环境**
> 定下来，否则 P1-4-6 的「字号收档 ⇒ 改折行 ⇒ 逐页复核横向溢出」在不确定的字体环境下**结论不可信**。
> **本份不是 P1 批次**，是「交付准备」里的一项（另一项是重打包）。
> **出门核查**：`python .workbuddy/check_font_selfhost_prompt.py` —— 出稿期 **全绿 / 0 红**。
> ⚠️ 它是**出稿前**工具，比对的是**改动前**的代码（`index.html:9-11` 还在外链 Google Fonts）
> ⇒ **本批落地之后它必然转红**，那不是回归，是它的使命结束了（红线 8）。
> **与 P1-4-6 的交叉**：两份都动 `demo/src/styles/tokens.css`，但**动的行不同**
> —— 本份只动 `:32`（`--font-num`），P1-4-6 动 `:25 / :34 / :35`。
> ⚠️ **本份先落 ⇒ 把 `:32` 由 1 行改成 3 行 ⇒ P1-4-6 引的 `:25 / :34 / :35` 整体 +2**：
> 实现 P1-4-6 之前**必须用 `.workbuddy/cssscan.py` 重新取一遍行号**，不要照它现在写的行号动手。

---

## 0. 一句话

把 `demo/index.html:9-11` 的 **Google Fonts 外链**换成**两个自托管 woff2 子集**
（可变字体，实测 **328,156 B = 320.5 KB**，覆盖全站用到的 **1,134 个字形**），
顺手修 **4 处「同一行两种字体」**——它们全因为 `--font-num` 没接 CJK 兜底（`tokens.css:32`）。

**不改字体族名**（`Noto Sans SC` / `Inter` 是 CSS 与 Canvas 的共同契约，见 §1.3）。

---

## 1. 取证（全部**实测**，不是估算）

### 1.1 现状：三个问题

| # | 问题 | 位置 | 证据 |
|---|---|---|---|
| ① | **断网即丢字体** | `demo/index.html:9-11` | `:9` / `:10` 两个 `preconnect`（`fonts.googleapis.com` / `fonts.gstatic.com`）+ `:11` 一个 `css2` link。评委机断网 ⇒ 整站回落系统字体，画稿定下的 Inter / Noto 一个都不在 |
| ② | **首帧必 FOUT** | `:11` 的 `display=swap` + 跨域 css | 中文首帧一定是 fallback，字体到位后再换一次 |
| ③ | **命中审查器** | `:11` | impeccable 的 `google-font` 检测器直接命中（外链第三方字体 CDN） |

**不解决的两个代价**：① 交付物在无网环境**不能自证外观**（比赛常见）；② 自述里「设计系统 = Noto Sans SC + Inter」这句话在断网时是假的。

### 1.2 字表：**1,134 个字形**（怎么数的）

脚本：`.workbuddy/facts_font_charset2.py` → `shots/font_charset2.json` + `fontwork/chars-loose.txt`。

扫描范围 = `demo/` 下全部 `.js/.mjs/.css/.html`（**36 个源文件**，含 `index.html`），
**去注释**后取「所有会渲染出来的字符」，再按 Unicode 区块分类：

| 区块 | 个数 | 内容 |
|---|---|---|
| CJK 统一表意 `U+4E00–9FFF` | **985** | 全部中文文案 |
| ASCII 可见 `U+0020–007E` | **95** | 拉丁字母、数字、半角标点 |
| CJK 符号与标点 `U+3000–303F` | 8 | `、。《》「」【】` |
| Latin-1 补充 `U+00A0–00FF` | 8 | `§°±²·×Ø÷` |
| General Punctuation `U+2000–206F` | 7 | `–—“”…″‹` |
| 半角及全角形式 `U+FF00–FFEF` | 6 | `（），：；＝` |
| Enclosed Alphanumerics `U+2460–24FF` | 5 | `①②③④⑤` |
| Arrows `U+2190–21FF` | 3 | `←→⇒` |
| 其余单字符 | 17 | `θ Δ π ω ∈ ∩ ≈ ≤ ≥ − ℃ ☆ ★ ▶ ◀ ✓ ₀` |
| **合计** | **1,134** | |

> ⚠️ **两个坑，都栽过，写清楚免得下一个人重走：**
>
> **坑 1 · 只抓 CJK 段会漏标点。** 第一版扫描只取 `CJK 统一表意` 与 `U+3000–303F / U+FF00–FFEF`，
> 于是 **General Punctuation 整段漏掉** —— `—` `–` `…` `“”` `’` 都在 `U+2000–206F`，
> 而 `·`(U+00B7) / `×`(U+00D7) 在 Latin-1。照那份表做子集 ⇒ 上线后这些字符**回落到系统字体**，
> 一行里两种字体 —— 正是本批要治的病。**口径必须是「所有会渲染的字符」，不是「所有汉字」。**
>
> **坑 2 · 只剥行首 `//` 会漏行尾注释。** 实测：把行尾注释也剥掉，字表从 **1,134 → 983**（少 151 个），
> Noto 子集从 **282,432 → 242,552 B**（省 **39.9 KB**）。
> **本批故意用宽松口径（1,134）** —— 多花的 40 KB 买的是「不会漏字」；
> 严格口径要依赖一个 `//` 启发式（要躲开 `http://` 与字符串里的 `//`），赌错就是漏字形。
> 若用户要极致体积，切严格口径（§9 有实测数）。

**一个反例，说明「字表里有 ≠ 字体里有」**：`₀`（`U+2080` 下标零）在全站只出现在**行尾注释**
（`cast.js:445` 的 `// H₀ 不变`），而 **Noto Sans SC 里根本没有这个字**（子集后实测缺字 1）。
它不影响渲染，但**证明子集后必须跑覆盖自检**（§8-2），不能只看「命令跑通了」。

### 1.3 字重：只需要 **400 / 500 / 600 / 700**

| 来源 | 用到的字重 |
|---|---|
| CSS 默认 | `400`（`base.css` 的 `body` **没有**写 `font-weight`；全站无 `300 / 800 / 900`） |
| CSS 显式 | `500` ×13（`base.css` 2 + `layout.css` 11）· `600` ×14 · `700` ×8 |
| Canvas `poster.js` | `400` / `500` / `700`（`ctx.font = \`700 40px ${FONT_NUM}\`` 等） |
| Canvas `emblem.js` | `400` |

**⇒ 关键约束：字体族名一个都不能改。** `demo/src/js/ui/poster.js:20` 与
`demo/src/js/ui/emblem.js:41` 把字体栈**写死在 JS 里**：

```js
const FONT_CN  = '"Noto Sans SC","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';
const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';
```

CSS 侧 `tokens.css:30-32` 是同一份栈。**自托管只换文件，不换族名** ——
一旦为了「避开 Google 的名字」重命名，CSS 与 Canvas 就会分叉，导出海报与页面长得不一样。

> ✅ `poster.js:22-25` **已经**在绘制前 `await document.fonts.ready`（含 2 s 断网回落）。
> 自托管后这一步依然正确、且更容易达成了（同源字体基本不会长挂），**本批不动它**。

### 1.4 子集化实测矩阵（8 种组合，都是真跑出来的）

脚本：`.workbuddy/facts_font_subset_matrix.py` → `shots/font_subset_matrix.json`。
工具：`fonttools 4.66.0` + `brotli 1.2.0`（`pyftsubset`，输出 `--flavor=woff2`）。

| 方案 | Noto Sans SC | Inter | 合计 | 结论 |
|---|---|---|---|---|
| **A. 4 个静态字重**（400/500/600/700，各一个文件） | 599,900 B | 58,076 B | **657,976 B = 642.6 KB** | 8 个文件、8 次请求 |
| **B. 2 个可变字体**（`wght 100–900` 单文件）★**推荐** | **282,432 B** | **45,724 B** | **328,156 B = 320.5 KB** | **比 A 省 329,820 B（49.5%）**，2 个文件 |
| C. B + `--no-hinting` | 282,400 B | 49,512 B | 331,912 B | **毫无意义**：Noto 只省 32 B，Inter 反而多 24 B（= 噪声） |
| D. B + `--layout-features=*` | 318,652 B | 81,060 B | 399,712 B | **多花 71.6 KB**：捞回 `aalt/cv01…/fwid/hwid/dlig`，**一个都没被用到** |
| E. B + 严格字表（983 字形） | 242,552 B | 47,616 B | 290,168 B | 省 37.1 KB，代价见 §1.2 坑 2 |
| F. B + Inter 钉 `opsz=14` | 282,432 B | 29,528 B | 311,960 B | 省 16.2 KB，但**改了 `opsz` 轴 ⇒ 大字号下 Inter 观感变**，见 §9 |

**两条被证伪的直觉**（别重走）：
- `--no-hinting` **不省体积**（0.01%）—— Noto/Inter 的 hinting 本来就很薄。
- `--layout-features=*` **不是「更保险」而是「更胖」**：默认那套
  （Noto 留下 `ccmp,halt,kern,liga,locl,palt,vert,vhal,vpal,vrt2`）已经覆盖中文标点挤压与竖排。

### 1.5 ⚠️ 一个连带病灶：`--font-num` 里在渲染汉字（**实测 4 处**）

脚本：`.workbuddy/facts_font_final_check.py` → `shots/font_final_check.json`。

`tokens.css:32` 现值：

```css
--font-num: "Inter", "Helvetica Neue", Arial, system-ui, sans-serif;
```

**这条栈里没有任何一个有中文字形**（Inter 无 CJK；Helvetica Neue / Arial / system-ui 在 Windows 上也无 CJK）。
于是凡是挂了 `--font-num` 却含汉字的地方，**汉字会被甩到系统默认 CJK 字体（Windows = 微软雅黑）**，
和同一行里的 Inter 数字拼在一起 —— **同一行两种字体**。

谁在用 `--font-num`（3 处声明）：

| 声明处 | 选择器 |
|---|---|
| `demo/src/styles/base.css:31` | `.num, .latin` |
| `demo/src/styles/layout.css:1492` | `.ledger__dim-lbl` |
| `demo/src/styles/layout.css:1557` | `.ledger__unit-lbl` |

**实测中招的 4 处**（全部人工复核过原文）：

| # | 位置 | 渲染文本 | 会被甩出去的汉字 |
|---|---|---|---|
| ① | `demo/src/js/pages/cast.js:307` | `<span class="cast__slider-range num">建议 … kg/s</span>` | **建议** |
| ② | `demo/src/js/pages/home.js:156` | `.ledger__unit-lbl` → 「1.7 m · 人」 | **人** |
| ③ | `demo/src/js/pages/home.js:160` | `<span class="num">净重 50 t</span>` | **净重** |
| ④ | `demo/src/js/pages/vault.js:208` | `<p class="vault__card-foot num">炉火不灭 · 2026</p>` | **炉火不灭** |

> 为什么算「与画稿不符」：画稿上这四处是**一种字体**（设计工具里不会自动分叉），
> 代码把它们渲染成了两种。**这是代码偏离画稿，不是本批新增的偏好** ⇒ 该修。
>
> ⚠️ 这个坑第一版取证脚本也踩了：只扫 `class="num"/"latin"`，
> **漏掉**在 CSS 里声明 `var(--font-num)` 的 `.ledger__unit-lbl` —— 而 ② 就是它。

---

## 2. 目标：2 个文件 + 1 张表 + 1 行 token

```
demo/public/fonts/                                  ← 新建目录
  NotoSansSC-subset.woff2    282,432 B   ← 可变，wght 100–900
  Inter-subset.woff2          45,724 B   ← 可变，opsz 14–32 / wght 100–900
  OFL.txt                                ← 两个字体都是 SIL OFL 1.1，**必须随包**
demo/src/styles/fonts.css                   ← 新增：2 条 @font-face
demo/index.html                             ← :9-11 三行删掉（**不加 preload**，见 §3.6）
demo/src/styles/tokens.css                  ← :32 一行改（§4）
```

**为什么放 `public/` 而不是 `src/assets/`**：`demo/dist/index.html` 现在引用的是
`/assets/index-*.js`（**绝对路径**，vite 默认 `base: '/'`）⇒ 本项目本来就假设「站点在根」。
放 `public/` 最直观、不用依赖 vite 的 asset 重写，且可以直接 `ls` 核对。
⚠️ 代价见 §9「待裁定 D」。

---

## 3. 落地步骤（可复制粘贴）

### 3.1 取原字体（都是可变版本，**不要**取静态实例）

```bash
# Noto Sans SC 可变（wght 100–900）；17,772,300 B
curl -L -o raw/NotoSansSC-var.ttf \
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"

# Inter 可变（opsz 14–32, wght 100–900）；876,576 B
curl -L -o raw/Inter-var.ttf \
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"
```

**指纹核对**（保证与出稿时同一份源，subsetsize 才有可比性）：

| 文件 | 字节 | sha256[:16] |
|---|---|---|
| `NotoSansSC[wght].ttf` | 17,772,300 | `a3041811a78c361b` |
| `Inter[opsz,wght].ttf` | 876,576 | `29160a80ff49ddca` |

> ⚠️ **不要**用 `fonts.googleapis.com/css2?...` 抓 `.ttf`：那条路返回的是**四个静态实例**
> （Noto 每个 **10.5 MB** ×4 = 42 MB），既慢也是方案 A 那一档（642.6 KB），不是本批要的。

### 3.2 生成字表

```bash
# 出稿方已提供现成字表；要自己重生成就跑这个（需要 demo/ 源码在场）
python .workbuddy/facts_font_charset2.py
# 产物：.workbuddy/fontwork/chars-loose.txt   （1,134 字符，无换行，3,200 B UTF-8）
#       sha256[:16] = bcea65b56822ff4f
```

### 3.3 子集化

```bash
pip install "fonttools[woff]" brotli      # 出稿时实测 fonttools 4.66.0 / brotli 1.2.0

# Noto：**用 pyftsubset 的默认 layout-features**（不要加 --layout-features=*）
pyftsubset raw/NotoSansSC-var.ttf \
  --text-file=chars-loose.txt \
  --flavor=woff2 \
  --output-file=final/NotoSansSC-subset.woff2
# 期望 282,432 B · 保留 feature: ccmp,halt,kern,liga,locl,palt,vert,vhal,vpal,vrt2

# Inter：**必须显式带上 tnum**，否则 `.num, .latin { font-feature-settings: "tnum" }` 变空操作
pyftsubset raw/Inter-var.ttf \
  --text-file=chars-loose.txt \
  --flavor=woff2 \
  --layout-features=ccmp,calt,kern,locl,tnum \
  --output-file=final/Inter-subset.woff2
# 期望 45,724 B · 保留 feature: calt,kern,locl,tnum
```

> ⚠️ **`--layout-features=+tnum` 是个陷阱**：出稿时试过，它产出的子集**一个 feature 都不剩**
> （实测 35,052 B / feature 列表为空）。**要加 feature 就写全名单**，别用 `+` 前缀。
>
> ⚠️ **为什么 Inter 必须留 `tnum`**：`base.css:31` 就是
> `.num, .latin { font-family: var(--font-num); font-feature-settings: "tnum"; }`。
> Inter 全量字体**有** `tnum`，但 pyftsubset 默认名单里**没有**它 → 不留就等于这行 CSS 白写。
> （Noto 全量字体没有 `tnum`，所以 Noto 侧不用管。）

### 3.4 放文件

```bash
mkdir -p demo/public/fonts
cp final/NotoSansSC-subset.woff2 final/Inter-subset.woff2 demo/public/fonts/
# 两个字体都是 SIL Open Font License 1.1 ⇒ 把 OFL.txt 一起放进去（§7）
```

### 3.5 新增 `demo/src/styles/fonts.css`

```css
/* ============================================================
   fonts.css — 自托管字体（子集化可变字体）
   来源：Noto Sans SC / Inter，均为 SIL OFL 1.1（见 public/fonts/OFL.txt）
   ⚠️ 族名必须与 tokens.css / poster.js / emblem.js 里的栈完全一致
   ⚠️ 这两个文件是子集，只含全站用到的 1134 个字形（见 spec/PROMPT-FONT-SELFHOST.md §1.2）
      ⇒ 用户输入（#/vault 的藏品命名）可能出现子集外的字，
        此时由 tokens.css 里的 "PingFang SC" / "Microsoft YaHei" 等兜底，属预期行为。
   ============================================================ */

@font-face {
  font-family: "Noto Sans SC";
  font-style: normal;
  font-weight: 100 900;        /* 可变轴；400/500/600/700 由浏览器插值 */
  font-display: swap;
  src: url("/fonts/NotoSansSC-subset.woff2") format("woff2-variations");
}

@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/Inter-subset.woff2") format("woff2-variations");
}
```

并在 `demo/index.html` 的 `:12` 之前加一行：

```html
<link rel="stylesheet" href="/src/styles/fonts.css" />
```

（`fonts.css` **必须排在 `base.css` / `layout.css` 之前**：`@font-face` 只声明字体，
顺序上先声明先可用，避免首帧拿不到族名。）

### 3.6 删外链（⚠️ **落地时修订：不加 preload**）

`demo/index.html` 的 **:9 / :10 / :11 三行整行删除**，**不替换**（只保留 §3.5 新增的 `fonts.css` 那一行）。

> ⚠️ **2026-09-24 落地修订 —— 本节原先要求的 `<link rel="preload" ... as="font">` 已删除，有据**：
>
> **实测**（`.workbuddy/probe_preload_warning.py`，带/不带 preload 两跑，各 4 段导航）：
>
> | | 首屏 `/` | 第 2 段 `#/history` | 第 3 段 `#/entrance` | 第 4 段 375×812 `/` | 字体请求 | FontFace |
> |---|---|---|---|---|---|---|
> | **带 preload** | ⚠️ 1 条 warning | ⚠️ 1 条 | ⚠️ 1 条 | ⚠️ 1 条 | `NotoSansSC` initiator=**link** | 2/2 loaded |
> | **不带 preload** | clean | clean | clean | clean | `NotoSansSC` initiator=**css** | 2/2 loaded |
>
> warning 原文：*"The resource /fonts/NotoSansSC-subset.woff2 was preloaded using link preload but
> not used within a few seconds from the window's load event."*
>
> - **字体其实用上了**（`FontFace` 2/2 `loaded`、`--font-num` 已含 Noto、四处落点全部命中）⇒ 这是
>   **「preload 未被复用」的假警报**：本机（共享 Edge profile）里 woff2 已在 HTTP 缓存中，
>   preload 拿到缓存命中，Chrome 的「预加载是否被消费」判定就落空。
> - **代价是真实的**：它让两条门禁转红 —— `verify_turn` 的 `U12.console.history` 与 `U12.home375`
>   （后者判据是 `not probs`）⇒ 43/44 掉到 **41/44**。
> - **收益是零**：字体照样以 `initiatorType: css` 即时发起并加载成功。本项目 CSS 是**同源、单文件、
>   阻塞式**样式表，`@font-face` 的发现本来就在首次渲染之前，preload 省不到那一跳。
> - ⇒ **结论：删掉 preload。** 摘除后 `verify_turn` 回到 **43/44**（唯一红 = 既有 `K13b`，
>   见 §9「D1 体积」），4 段导航 console **全清**。
> - ⚠️ **不要为了留 preload 去改 `U12` 的判据**（那是「改判据糊过去」）。若将来真要恢复 preload，
>   必须先有一条**能区分「真未使用」与「缓存命中」**的判据，而不是把 warning 一律豁免。
> - 也**不要**给 Inter 加 preload（它只有 45 KB，且大量页面用不到）——原因同前，只会多一条同样的 warning。

---

## 4. 必改：`tokens.css:32` 给 `--font-num` 接上 CJK 兜底（1 行）

```css
/* 现值（tokens.css:32） */
  --font-num: "Inter", "Helvetica Neue", Arial, system-ui, sans-serif;

/* 改成 */
  --font-num: "Inter", "Helvetica Neue", Arial,
              "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB",
              system-ui, sans-serif;
```

**为什么**：§1.5 实测 4 处汉字走这条路。加的是**已有的族名**（`Noto Sans SC` 本来就在
`--font-cn` 里、也在 CSS 与 Canvas 的契约里）⇒ **不新增字体、不新增文件、不改视觉意图**，
只把「汉字该用哪一套」从「浏览器默认」明确成「Noto Sans SC」。

**这条要在自托管之前/同时落**：外链还在的时候，同源不成立，`Noto Sans SC` 是否能拿到取决于网络；
自托管之后它 100% 本地可得 —— **这个 bug 会被彻底治好，而不是碰运气**。

**验收**：1440 宽下 `getComputedStyle(document.querySelector('.ledger__slab-foot .num')).fontFamily`
应以 `Inter` 开头且**包含** `Noto Sans SC`；再核 `home.js:156/160`、`cast.js:307`、`vault.js:208`
四处，`document.fonts.check('15px "Noto Sans SC"', '净重')` 返回 `true`。

---

## 5. 不许动（本批红线）

1. **字体族名**（`"Noto Sans SC"` / `"Inter"`）一个字符都不许改 —— 见 §1.3。
   也不要「顺手」把 `--font-cn` 的次序调换：`"Source Han Sans CN"` / `"PingFang SC"` /
   `"Microsoft YaHei"` / `"Hiragino Sans GB"` 是断网/异机兜底链，删任何一个都违反画稿的降级要求。
2. **`poster.js:22-25` 的 `document.fonts.ready` 等待 + 2 s 断网回落**不许动，
   也不许「既然自托管了就不用等了」—— 首帧仍可能没就绪。
3. **不许在 CSS 里写 `font-feature-settings` 的新值**（`cv01`/`ss01`/`palt`…）：
   子集只保留 §3.3 列的那几个 feature，写了也是空操作。要加就同时改 §3.3 的命令并重跑体积。
4. **不许把子集文件塞进 `release/dist/assets/`**（那里是 vite 产物目录）；
   字体跟 `public/` 走，见 §7 的交付清单。
5. **`--radius` / `--fs-*` 一律不动** —— 那是 `spec/PROMPT-P1-4-6.md` 的范围。
6. **文案与史实一字不改**（《铁流凝变》22 × 11.5 m / 净重 50 t 等）。

---

## 6. 门禁影响

### 6.1 必改：**0 处**

已 grep 全部 20 份 `verify_*.py`：**没有任何一份引用** `googleapis` / `gstatic` / `Noto` /
`Inter` / `font-family` / `fontFamily` / `fonts.ready`（命中 0）。所以：
**本批不需要改任何门禁断言**，也不需要新增断言文件（`fonts.css` 的验收放 §8 手核即可）。

### 6.2 ⚠️ 但有一个**真实风险**：字体现已「真的加载」⇒ 文字度量口径变了

`spec/PROMPT-P1-4-6.md §6.2` 里那条**零容差**断言
`verify_cast.py:74` 的 `h3["firstLeft"] == 1118.5`，依赖 `.cast__topbar` 内文字的总宽。
外链时期它的取值取决于**跑门禁的那台机器当时能不能连上 Google Fonts**；
自托管后它**恒定**用 Noto Sans SC / Inter 度量。

**判断口径（落地后照做）**：
1. **先跑一遍全部 20 份 `verify_*.py`**（改动前），记下每一份的绿/红；
2. 落本批，**再跑一遍**；
3. 对**每一处**由绿转红的断言，先问「**是不是字体现在真的加载了（度量口径变了）**」，
   再问「是不是回归」。**若第 3 步出现转红，报回来，不要自己调容差**（红线：不许改判据糊过去）。
4. 已知零容差的只有 `verify_cast.py:74` 与 `verify_ux.py:459-460`（±1）两处，都是 `firstLeft`。

> 反向的好消息：Google Fonts 现在返回的也是**可变** woff2（`wght` 插值），
> 与本批的子集**轴一致** ⇒ 只要浏览器本来就连得上 Google Fonts，度量应当**逐像素不变**，
> 门禁应全绿。这正是本批可以做「前后截图对比」的依据（§8-6）。

---

## 7. 体积与交付

| | 值 |
|---|---|
| `NotoSansSC-subset.woff2` | **282,432 B = 275.8 KB** · sha256[:16] = `00e7adc711b62a03` |
| `Inter-subset.woff2` | **45,724 B = 44.7 KB** · sha256[:16] = `4f62216856b567ff` |
| **字体合计** | **328,156 B = 320.5 KB = 0.313 MB** |
| 对照：4 个静态字重 | 657,976 B = 642.6 KB（**本方案省 49.5%**） |

> **指纹用来干什么**：`pyftsubset` 的输出是确定性的 —— 同一份源（§3.1 的两条指纹）、
> 同一份字表（§3.2 的 `bcea65b56822ff4f`）、同一条命令，输出应**逐字节一致**。
> 若字节数或指纹对不上，先查这四样，**不要**靠「看起来差不多」放过去：
> ① 源是不是可变版本（不是 4 个静态实例）；② 字表是不是 1,134 字的宽松版；
> ③ Inter 那条命令的 `--layout-features` 有没有写全（少写 `tnum` 会小 ~10 KB）；
> ④ 有没有误用 `--layout-features=+tnum`（会得到 35,052 B 的空 feature 产物）。
> 对不上又查不出来 ⇒ **报回来**，别自己调字表凑数。

- **字体不进 `index-*.js` / `index-*.css`**（`public/` 原样拷贝）⇒
  **D1 的 198.57 KiB 硬线不受本批影响**（JS gzip(9) **实测仍 205,796 B，逐字节未变**，该超还超，另立一轮解决）。
- ⚠️ **但 JS 的「文件名哈希」会变**（实测 `index-CQDBuEqM.js` → `index-aA-vVRY_.js`）——
  **内容一字未改**（raw 704,489 B / gzip(9) 205,796 B 都不变），变的是 vite 把 **CSS 资源名**内联进了 JS
  ⇒ CSS 哈希一变，JS 文件名跟着变。**凡是硬编码 `index-CQDBuEqM.js` / `index-CJqwpVWL.css` 的文档
  都要回写**（已核：`verify_*.py` 里**零处**硬编码，门禁不受影响）。
- **`index-*.css` 实测**：raw 35,642 → **36,018 B（+376 B）**；vite 自报 gzip(6) 7.22 → **7.31 kB（+90 B）**；
  gzip(9) 现为 **7,260 B**；哈希 `index-CJqwpVWL.css` → **`index-DtvYVM-O.css`**。
  （§7 原估「+≈300 B」是 gzip 口径的保守值，实测更小。）
- `dist/index.html` 实测 0.96 → **0.66 kB**（删了 3 行外链、只加 1 行 `fonts.css`）。
- **交付体积要单列字体**：自述里必须写「字体 320.5 KB（本地、一次性、可缓存）」，不要混进 JS/CSS 的账。

### 许可证（**必须随包**）

Noto Sans SC 与 Inter 均为 **SIL Open Font License 1.1**：
- 允许子集化、允许随应用分发、允许商用；
- 要求：**分发时附版权声明与 OFL 全文**（OFL 解析 2）。⚠️ **更正（2026-09-24 落地时实测）**：
  **Noto Sans SC 的 OFL 声明了 `with Reserved Font Name 'Source'`**，版权行是
  `Copyright 2014-2021 Adobe` —— 它派生自 Adobe 的 Source Han Sans。⇒ **我上一版写的「这两个字体
  没有 RFN」是错的**。我们的子集删了字形 ⇒ 属 Modified Version ⇒ 解析 3) 生效，**不得使用保留字**；
  但族名 `"Noto Sans SC"` 不含 `'Source'` ⇒ **保留原名是合规的**；**绝不能改成含 `Source` 的名字**。
  Inter 的版权行是 `Copyright 2020 The Inter Project Authors`，**无 RFN**。
- ⇒ 实际放**两份**（两份版权行不同，合并会丢声明）：`demo/public/fonts/OFL-NotoSansSC.txt` 与
  `OFL-Inter.txt`，必须一起进交付包，并在 `使用说明.md` 里写一句出处。

### 交付清单（`release/` 重打包时一并做，属「交付准备第 1 项」）

```
release/dist/fonts/NotoSansSC-subset.woff2
release/dist/fonts/Inter-subset.woff2
release/dist/fonts/OFL-NotoSansSC.txt
release/dist/fonts/OFL-Inter.txt
release/dist/index.html      ← 必须与新构建一致（现在停在 09-18，见 PROJECT-BRIEF）
```

> ⚠️ `release/server.js:30-31` **已经**为 `.woff` / `.woff2` 配了正确的 MIME
> （`font/woff2`）⇒ **服务端不用改**。这一点已核过。

---

## 8. 出门自检（实现方照做）

```bash
# 0) 【设计侧出稿前用 · 不要当验收】本份提示词的事实核对
python .workbuddy/check_font_selfhost_prompt.py       # 出稿前期望：全绿
#    ⚠️ 落地后它必然转红（index.html:9-11 已删 / --font-num 已改）—— 使命结束，不是回归

# 1) 体积：必须逐字节对上（不是「差不多」）
ls -l demo/public/fonts/*.woff2
#    期望：NotoSansSC-subset.woff2 282432 · Inter-subset.woff2 45724

# 2) 覆盖自检：字表里每个字都在字体里（除已知的 ₀）
python .workbuddy/facts_font_final_check.py
#    期望：Noto 缺字 1（`₀`，见 §1.2）；Inter 缺字 = 1001（它本来就只有拉丁）

# 3) 外链已清干净
grep -rn "googleapis\|gstatic" demo/index.html demo/dist/   # 期望：0 行

# 4) 族名没被改（CSS 与 Canvas 的契约）
grep -rn 'FONT_CN\s*=\|FONT_NUM\s*=' demo/src/js/ui/         # 期望：两处都仍是 "Noto Sans SC" / "Inter"
grep -n "font-num" demo/src/styles/tokens.css                # 期望：含 "Noto Sans SC"

# 5) 运行时字体真的就绪（1440 宽）
#    在控制台/探针里：
#      await document.fonts.ready;
#      document.fonts.check('15px "Noto Sans SC"', '净重')   → true
#      getComputedStyle(document.querySelector('.ledger__slab-foot .num')).fontFamily
#                                                            → 以 Inter 开头且含 Noto Sans SC

# 6) 重建 + 断网复核
cd demo && node node_modules/vite/bin/vite.js build
#    **断网**（或 DevTools 勾 Offline）后重开站点：外观必须与联网时一致
#    ⇒ 这是本批唯一能证明「交付物自证外观」的一步，必须做并截图
```

**交付自述**：`spec/IMPLEMENTATION-FONT-SELFHOST.md`，含
①`index.html` 删了哪三行、加了哪一行；`tokens.css:32` 改前/改后全文
②两个 woff2 的**字节数 + sha256[:16]**（与 §7 对账）
③§8-2 覆盖自检的**原始输出**
④断网前后**同一页面的并排截图**（至少首页 + `#/vault`，各 1440）
⑤§4 那 4 处（`cast.js:307` / `home.js:156/160` / `vault.js:208`）的**放大截图对比**：
   改前「汉字 = 系统字体」vs 改后「汉字 = Noto Sans SC」
⑥★ **许可证**：`OFL.txt` 存放位置 + `使用说明.md` 里的出处句
⑦跑全部 20 份 `verify_*.py` 的**前后对照表**（§6.2 的第 3 步）

---

## 9. 本批**不**包含的 / 待裁定

| 项 | 归属 |
|---|---|
| 圆角 / 字号 / 字距收档 | **`spec/PROMPT-P1-4-6.md`**（另一份，可并行） |
| 毛玻璃 / 发光 / `.eyebrow::before` | P1-7 / P1-8 / P1-9 |
| 面层色三阶梯、3D 悬浮层 | P1-11 / P1-12 |
| 按页 code-split（D1 体积硬线） | 另立一轮 |
| 重打包 `release/dist`（现停 09-18） | **交付准备第 1 项** |

**三个待裁定**：

| # | 问题 | 我的建议 |
|---|---|---|
| **A** | 严格字表（983 / 290,168 B）还是宽松字表（1,134 / 328,156 B）？ | **走宽松**。多花 37 KB 换「不依赖注释剥离启发式」；严格口径赌错一个字符就是一行两种字体 |
| **B** | Inter 要不要钉 `opsz=14`（省 16.2 KB）？ | **不钉**。现有外链返回的是带 `opsz` 轴的可变字体，钉住会**改变大字号下 Inter 的观感**（`opsz` 一变，字距与笔画对比都变）⇒ 那是改设计，不是省体积 |
| **C** | 要不要干脆**删掉 Inter**、让数字也用 Noto Sans SC？ | **不建议**，但值得算：能省 44.7 KB 与一次请求；代价是 `--font-num` 这个设计意图消失、账本大数字（`.ledger__h` / `.cast__score-num` / 海报 40px 数字）观感改变。**要用户裁定**，因为这是视觉决定 |
| **D** | 部署形态：若站点要放在**子路径**（如 `/museum/`），`/fonts/...` 会 404 | 现有 `demo/dist/index.html` 用的是 `/assets/...`（vite 默认 `base:'/'`）⇒ 本项目**本来**就假设根路径。若确实要子路径，正确做法是 `base: './'` + 全部改相对引用，**那是另一轮**，不在本批 |

---

**出稿人备注**：本批的**唯一**风险是 §6.2 的「度量口径变了」。
它同时也是本批最大的价值 —— 自托管之后，**门禁与截图第一次有了确定的字体环境**，
现在「这台机器绿、那台机器红」的模糊地带会消失。落地顺序建议：
**先跑一遍门禁存档 → 落 §4 的 1 行 → 落 §3 → 再跑一遍门禁 → 断网截图**。
