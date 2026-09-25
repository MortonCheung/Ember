# IMPLEMENTATION · 中文字体自托管与子集化（交付准备 第 2 项）

> **状态**：**已实现并验收**（2026-09-24 晚 · **第十批**）。
> 依据 [`archive/spec/PROMPT-FONT-SELFHOST.md`](../archive/spec/PROMPT-FONT-SELFHOST.md)
> （2026-09-24 出稿 · 当晚实现并归档 · 正文一字未改；下文引它的行号均为**改前**行号）。
> 用户裁定原话：**「按稿落地（先落这份）」**（第十二轮：先字体稿、后 P1-4-6）。
> ⚠️ 本自述由**设计侧**（兼实现）交付 —— 与本项目其它批次一致，证据全部为**脚本实测**，
> 不用「看起来对了」当证据（截图只作人眼复核，且全部**按路径引用**）。
> 📌 **后记（2026-09-24 晚 · 第十二批）**：**Inter 已于第十二批删除**（依据 `archive/spec/PROMPT-FONT-DROP-INTER.md`，
> 自述 [`spec/IMPLEMENTATION-FONT-DROP-INTER.md`](IMPLEMENTATION-FONT-DROP-INTER.md)）——
> `dist/fonts/` **4 → 2 个 / 286,820 B**，数字与拉丁改走 Noto Sans SC。
> ⚠️ 本文档以下所有 **Inter 条目**（§1.5 的 Inter face、§6 的 `OFL-Inter.txt`、§9 可搬文件清单里的两个 Inter 文件）
> **保留为历史记录，不要据它搬运**；`--font-num` 这个 token **保留**（现为与 `--font-cn` 同栈的别名）。
> ✅ 另外：本自述 **§5-② / §8 列的「Canvas 第 5 处」也已随第十二批修掉**（`poster.js` 的 `FONT_NUM`
> 常量删除、那一行改用 `FONT_CN`，现为 `poster.js:118`）—— **§8 那一行不再是一个开口项**；
> 本批还把 `emblem.js` 里的同名死常量一并删掉了。

---

## 0. 一句话

`demo/index.html` 的 **3 行 Google Fonts 外链 → 2 个自托管可变 woff2 子集**
（**328,156 B / 1,134 字形**）；`tokens.css` 的 `--font-num` 接上 CJK 兜底，
修掉 **4 处「同一行两种字体」**。**必改门禁 0 处**（实测确实一处都不必改）·
**20 份 `verify_*.py` 前后非零集合完全相同** · 拦截两个外部字体域后**逐像素 0 差异**。

---

## 1. 改动清单（4 处改动 + 4 个新文件）

| # | 文件 | 改动 | 行数影响 |
|---|---|---|---|
| ① | `demo/index.html` | `:9-11` **三行外链整行删除**；`:9` 起新增一行 `fonts.css` | **21 → 18 行**（−3 +1 = 净 −2） |
| ② | `demo/src/styles/fonts.css` | **新建**（2 条 `@font-face` + 头注） | 0 → **37 行** |
| ③ | `demo/src/styles/tokens.css` | `:32` 一行改（`--font-num` 接 CJK 兜底） | **净 +2 行** ⇒ 该文件**整体行号 +2** |
| ④ | `demo/public/fonts/` | **新建目录**，4 个文件（2 woff2 + 2 OFL） | — |

**没有动的**：`poster.js` / `emblem.js`（族名契约，见 §5-②）· `--font-cn` 的次序与内容 ·
`poster.js:22-25` 的 `document.fonts.ready` + 2 s 兜底 · `--radius` / `--fs-*`（属 P1-4-6）·
`verify_*.py`（**0 处**）· `release/`（属交付准备第 1 项）。

### ① `demo/index.html` —— 删哪三行、加哪一行

```html
<!-- 改前 :9-11（三行整行删除，不替换） -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

```html
<!-- 改后 :8 起（新增第 1 行；后 3 行是原有的，未动） -->
  <meta name="description" content="把一座已被封存的车间，重启为一台可以对谈的机器。" />
  <link rel="stylesheet" href="/src/styles/fonts.css" />      ← 新增（必须排在 tokens/base/layout 之前）
  <link rel="stylesheet" href="/src/styles/tokens.css" />
  <link rel="stylesheet" href="/src/styles/base.css" />
  <link rel="stylesheet" href="/src/styles/layout.css" />
```

> ⚠️ **没有加 `<link rel="preload" ... as="font">`** —— 稿 §3.6 原要求加，落地时**实测证伪并删掉**，
> 详见 §5-①（含带/不带 preload 的四段对照表）。

### ② `demo/src/styles/fonts.css`（新建，全文 37 行）

```css
/* ============================================================
   fonts.css — 自托管字体（子集化可变字体）
   来源：Noto Sans SC / Inter，均为 SIL Open Font License 1.1
        许可证全文见 public/fonts/OFL-NotoSansSC.txt 与 public/fonts/OFL-Inter.txt

   ⚠️ 族名必须与 tokens.css / poster.js / emblem.js 里的栈完全一致：
      CSS 与 Canvas 导出共用同一份字体栈（poster.js:20 / emblem.js:41 写死在 JS 里），
      改名会让页面与导出海报分叉。

   ⚠️ 许可证边界（别踩）：Noto Sans SC 的 OFL 声明了
      `with Reserved Font Name 'Source'`（它派生自 Adobe 的 Source Han Sans）。
      我们的子集属于 OFL 意义上的 Modified Version ⇒ 解析 3) 生效：
      **不得使用保留字**。保留族名 "Noto Sans SC" 是合规的（不含 'Source'）；
      但如果有人"顺手"把族名改成含 Source 的名字，就违约了。

   ⚠️ 这两个文件是子集，只含全站用到的 1134 个字形
      （见 archive/spec/PROMPT-FONT-SELFHOST.md §1.2 —— 本批已实现并归档）
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

> ✅ **落地时旁证了一条构建事实**：`esbuild` 在生产构建里**会剥掉 CSS 注释** ——
> 实测 `demo/dist/assets/index-DtvYVM-O.css` 里搜 `自托管 / 族名必须 / Reserved Font Name`
> 命中 **0**，只留 `@font-face{font-family:Noto Sans SC;...}`。
> ⇒ 本节末尾那次「改头注里的提示词路径」**没有改变任何构建产物的字节**（§7 有 sha 比对）。

### ③ `demo/src/styles/tokens.css:32` 改前 / 改后全文

```css
/* 改前（:32，1 行） */
  --font-num: "Inter", "Helvetica Neue", Arial, system-ui, sans-serif;
```

```css
/* 改后（:32-34，3 行）—— 加的三段族名全都本来就在 --font-cn 与 Canvas 契约里 */
  --font-num: "Inter", "Helvetica Neue", Arial,
              "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB",
              system-ui, sans-serif;
```

> ⚠️ **这一处把 `tokens.css` 整体行号 +2**：`:25` 不变、`:34 → :36`（`--fs-display`）、`:35 → :37`（`--fs-h1`）。
> ⇒ **`PROMPT-P1-4-6.md` 引的行号已在本轮重核并回写**（它正文 4 处 `tokens.css` 行号已改；该稿其后于**第十一批**落地并归档 → `archive/spec/PROMPT-P1-4-6.md`），
> 其出门核查 `check_p1_456_prompt.py` 现为 **101 绿 / 0 红**。

---

## 2. 体积与指纹（与稿 §7 逐项对账）

| 文件 | 字节 | 稿 §7 期望 | 判定 | sha256[:16] | 稿 §7 期望 | 判定 |
|---|---|---|---|---|---|---|
| `demo/public/fonts/NotoSansSC-subset.woff2` | **282,432** | 282,432 | ✅ | `00e7adc711b62a03` | `00e7adc711b62a03` | ✅ |
| `demo/public/fonts/Inter-subset.woff2` | **45,724** | 45,724 | ✅ | `4f62216856b567ff` | `4f62216856b567ff` | ✅ |
| **字体合计** | **328,156 B = 320.5 KB** | 328,156 | ✅ | — | — | — |
| `demo/public/fonts/OFL-NotoSansSC.txt` | 4,388 | — | ✅ | — | — | — |
| `demo/public/fonts/OFL-Inter.txt` | 4,377 | — | ✅ | — | — | — |

**逐字节对上** ⇒ 源（§3.1 两条指纹）、字表（`bcea65b56822ff4f`）、命令三项全部一致，
不必走稿 §7 的「对不上先查四样」流程。

`facts_font_final_check.py` 另外核出的字体内部事实（原始读数）：

| 子集 | 轴 | 保留 feature | glyphs | cmap | 缺字 |
|---|---|---|---|---|---|
| Noto Sans SC | `wght 100–900` | `ccmp halt kern liga locl palt vert vhal vpal vrt2` | 1,179 | 1,135 | **`₀`**（只出现在行尾注释，见稿 §1.2） |
| Inter | `opsz 14–32` / `wght 100–900` | `calt kern locl tnum` | 250 | 134 | 1,001（它本来就只有拉丁） |

> ✅ `tnum` 在 —— 稿 §3.3 那条「Inter 必须显式带 `tnum`，否则 `base.css:31` 的
> `font-feature-settings:"tnum"` 变空操作」**已兑现**（实测保留 feature 列表含 `tnum`）。

### 构建产物（vite 5.4.21，`.workbuddy/build.log`）

| | 改前 | 改后 | 判读 |
|---|---|---|---|
| `index-*.js` | `index-CQDBuEqM.js` | **`index-aA-vVRY_.js`** | **内容一字未改**：raw **704,489 B** / gzip(9) **205,796 B** 都不变 —— 变的是 vite 把 **CSS 资源名内联进 JS** |
| `index-*.css` | `index-CJqwpVWL.css` | **`index-DtvYVM-O.css`** | raw 35,642 → **36,018 B（+376）**；vite 自报 gzip(6) 7.22 → **7.31 kB**；实测 gzip(9) **7,260 B** |
| `dist/index.html` | 0.96 kB | **0.66 kB** | vite 报的是**字符数**口径（该文件实测 **740 B**、gzip9 **561 B**）；删 3 行外链 + 4 条 `<link rel=stylesheet>` 被卷入单文件 CSS |
| `dist/fonts/` | — | 4 个文件（与 `public/fonts/` 逐字节同） | `public/` 原样拷贝 |

**⇒ D1 的 198.57 KiB 硬线不受本批影响**（JS gzip(9) 逐字节未变，该超还超，另立一轮）。
**⇒ 交付体积要把字体单列**：自述口径写「字体 **320.5 KB**（本地、一次性、可缓存）」，
不要混进 JS/CSS 的账。

> ⚠️ **凡硬编码 `index-CQDBuEqM.js` / `index-CJqwpVWL.css` 的文档都要回写**（本轮已回写根 `README.md`）。
> 已核：`verify_*.py` 里**零处**硬编码这两个哈希，门禁不受影响。
> 📌 改前 CSS raw **以 `IMPLEMENTATION-HEADER-NAV.md:166` / `IMPLEMENTATION-NAV-TRIM.md:67` 两处互证的
> **35,642 B** 为准（NAV-TRIM 落地时复核过「CSS 哈希未变」⇒ 本批动身前就是它）⇒ 增量 **+376**。

---

## 3. §8-2 覆盖自检（原始输出节选）

```
要检查的类（`--font-num` 的消费者 + .num/.latin）：['num', 'latin', 'ledger__dim-lbl', 'ledger__unit-lbl']

   demo/src/js/pages/cast.js                  :307  .num                建议 «expr»–«expr»` : '' ★ 含汉字 ⇒ 字体分叉
   demo/src/js/pages/home.js                  :153  .ledger__dim-lbl    22 m                   ok
   demo/src/js/pages/home.js                  :156  .ledger__unit-lbl   1.7 m · 人              ★ 含汉字 ⇒ 字体分叉
   demo/src/js/pages/home.js                  :157  .ledger__dim-lbl    11.5 m                 ok
   demo/src/js/pages/home.js                  :160  .num                净重 50 t                ★ 含汉字 ⇒ 字体分叉
   demo/src/js/pages/vault.js                 :208  .num                炉火不灭 · 2026            ★ 含汉字 ⇒ 字体分叉
   （其余 24 处 .num/.latin 含 0 个汉字，标 ok）

⇒ 含汉字的 `--font-num` 用例：**4 处**
     · demo/src/js/pages/cast.js:307  `.num`  「建议 «expr»–«expr»` : ''} kg/s」
     · demo/src/js/pages/home.js:156  `.ledger__unit-lbl`  「1.7 m · 人」
     · demo/src/js/pages/home.js:160  `.num`  「净重 50 t」
     · demo/src/js/pages/vault.js:208  `.num`  「炉火不灭 · 2026」
```

**与稿 §1.5 的 4 处逐条一致**。⚠️ 但**这个扫描本身有一个盲区**，见 §5-②（Canvas 第 5 处）。

---

## 4. §8 出门自检逐条读数

### 4-① 体积：逐字节对上 ⇒ 见 §2（原始输出）

```
45724  demo/public/fonts/Inter-subset.woff2
282432  demo/public/fonts/NotoSansSC-subset.woff2
```

### 4-② 覆盖自检 ⇒ 见 §3

### 4-③ 外链已清干净

```
$ grep -rn "googleapis\|gstatic" demo/index.html demo/dist/
（0 行命中，退出码 1）
```

`demo/dist/` 全目录扫也一样是 **0**（含 `dist/fonts/` 的四份 OFL 纯文本 —— 它们是许可证全文，不含任何 CDN 链接）。

### 4-④ 族名没被改（CSS 与 Canvas 的契约）

```
$ grep -rn 'FONT_CN\s*=\|FONT_NUM\s*=' demo/src/js/ui/
demo/src/js/ui/emblem.js:40:const FONT_CN = '"Noto Sans SC","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';
demo/src/js/ui/emblem.js:41:const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';
demo/src/js/ui/poster.js:19:const FONT_CN = '"Noto Sans SC","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';
demo/src/js/ui/poster.js:20:const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';
```

⇒ `FONT_CN` **两处一字未改**；**族名 `"Noto Sans SC"` / `"Inter"` 全部保留**（稿 §5-1 红线）。
⚠️ 但 `FONT_NUM` 这两行**没有**跟着接 CJK 兜底 —— 这不是本批漏改，是**新发现的第 5 处**，见 §5-②。

### 4-⑤ 运行时字体真的就绪（`probe_font_selfhost.py` 改前/改后对照）

| 读数 | **改前**（外链） | **改后**（自托管） | 判读 |
|---|---|---|---|
| `document.fonts` face 数 | **432**（Google 注入，大多 unloaded；三个路由 loaded 73/95/96） | **2**（`Noto Sans SC/loaded` · `Inter/loaded`） | 只剩我方两枚，且**全 loaded** |
| 字体网络请求 | **只有 Google 的 CSS，一个 woff2 都没有**（`transferSize: 0`） | `/fonts/NotoSansSC-subset.woff2` **282,732 B** · `/fonts/Inter-subset.woff2` **46,024 B**（`initiatorType: css`） | **改前根本没有字体文件落地** ⇒ 全站走系统雅黑兜底 |
| `canvasProbe`「Noto_vs_mono_炉火不灭」 | `[160, 160]` | `[160, 160]` | ⚠️ **两态都相等** —— 这不是「Noto 没生效」，是**画布测宽对 CJK 零分辨力**（汉字在各家里都是 1 em）。**别用它下结论**（真判据见 §4-⑥ 与 §5-②的逐像素法） |
| `canvasProbe`「Inter_vs_mono_0123456」 | `[118.3, 100]` | `[116.08, 100]` | 两态都 ≠ 兜底 ⇒ Inter 生效；**两态之间差 2.2 px/10 位**（见下方 ⚠️） |
| `--font-num` 计算值 | `"Inter","Helvetica Neue",Arial,system-ui,sans-serif` | `…Arial, "Noto Sans SC","PingFang SC","Microsoft YaHei","Hiragino Sans GB", system-ui…` | ✅ 兜底已接上 |
| 含汉字且 `fontFamily` **未含 Noto** 的元素 | `#/` **1** 个 · `#/cast` **1** 个 · `#/vault` **3** 个 | **0 / 0 / 0** | **4 处落点全部治好**（含兜底网扫出的同一批） |
| `document.fonts.check('15px "Noto Sans SC"','净重')` | `true` | `true` | ⚠️ **这个 API 在改前也返回 true**（它只说明声明存在，不代表文件下下来了）—— 本批**不拿它当证据** |
| 门禁关键几何 | `topbarH 72/64` · `navCount 5` · `castSteps 5` · **`castFirstLeft 1118.5`** · `overflowX 0` · `docScrollH 4796` | **逐值相同** | ✅ 文字度量环境变了，但这些读数**零漂移** |

> ⚠️ **一处需要知情的真实差异**：`Inter_vs_mono` 118.3 → **116.08**（`AvgG` 82.46 → 81.28）。
> 说明**Google 那侧返回的 Inter 与本批子集不是同一份实例**（轴/instancing 口径不同）
> —— 稿 §6.2 结尾那句「Google 现在返回的也是可变 woff2（`wght` 插值），与本批的子集**轴一致**
> ⇒ 度量应当**逐像素不变**」**在拉丁/数字上不成立**（差 ~0.22 px/位）。
> **但本批零容差断言全过**：`verify_cast.py:74` 的 `h3["firstLeft"] == 1118.5` **未动**、
> `verify_ux.py:459-460` 的 ±1 **未动**、20 份门禁**无一份由绿转红**。
> ⇒ 结论：**差异存在且已登记**，但它没有咬到任何判据；P1-4-6 落地时知悉即可。

### 4-⑥ 断网复核 —— 本批唯一能证明「交付物自证外观」的一步

**做法（可复现，强于「真断网」）**：CDP `Network.setBlockedURLs` 把
`*fonts.googleapis.com*` / `*fonts.gstatic.com*` 拉黑 + 清缓存重载，与不拦截时**逐像素比对**。
（真断网测不出依赖：站点由 `127.0.0.1` 提供，且共享 profile 里 Google 的 woff2 可能已缓存。）
脚本：`.workbuddy/probe_offline_font.py` → `shots/offline-compare.json`。

**⭐ 对照组（先证明仪器有效）**：直接 `fetch` 被拦域 ——

| | 结果 |
|---|---|
| 不拦截 | `{ok: true, status: 200}`（本环境**确实连得上** Google Fonts，改前阶段实测注入 432 个 face） |
| 拦截 | `{ok: false, err: "TypeError: Failed to fetch"}`，`Network.loadingFailed: blockedReason="inspector"` |

⇒ **拦截确实生效**。否则下面的「0 差异」只会是假阴性。

**逐像素（1440×900）**：

| 路由 | 比对带 | changedPixels | maxDelta | 字体请求（不拦截 / 拦截） |
|---|---|---|---|---|
| `/` | topbar `(0,0,1440,90)` | **0** | **0** | 逐项相同：`/fonts/NotoSansSC-subset.woff2` + `/fonts/Inter-subset.woff2`，`initiatorType: css` |
| `/` | ledger `(0,560,1440,900)`（避开右上三维 canvas） | **0** | **0** | 同上 |
| `#/vault` | topbar | **0** | **0** | 同上 |
| `#/vault` | **whole 全幅 `(0,0,1440,900)`** | **0** | **0** | 同上 |

**页面侧一次都没请求过 Google 域**（`initiatorType != 'fetch'` 的资源表里只有我方两个 woff2）。
⇒ 拦截外部字体域后**外观完全不变** —— 「交付物在无网环境能自证外观」**成立**。

📎 并排图：`.workbuddy/shots/offline_sheet.png`（两路由 × 拦截前后 + 读数标注）·
单图 `offline-home-normal.png` / `-blocked.png` / `offline-vault-normal.png` / `-blocked.png`

> ⚠️ **取证方式上栽过一次（记下来）**：第一版把 cache-buster 接在 `#` 之后
> （`…?debug=1#/vault&t=normal`）⇒ 路由变成非法 `#/vault&t=…` ⇒ **回落首页**，
> 于是「`#/vault` 全幅 0 差异」其实是**同一张首页自己比自己**。
> 现在脚本会把**落地路由**记进 JSON 当凭据（`{"hash":"#/vault","h1":"一次体验，换来一张自己的工牌","sv":1}`）。
> 教训与红线 5 同款：**结论太顺的时候，先怀疑取证方式。**

### 4-⑦ 那 4 处的放大对比（§8-4⑤）

| 附件 | 内容 |
|---|---|
| `.workbuddy/shots/font_ab.png` | **栈级 A/B 对照表**（1179×1010，2.6× 放大）。四行 = 四处落点，每行左「**改前栈**（无 CJK 兜底）」右「**改后栈**（接 Noto Sans SC）」，字号/字重/字距全部取自实测 `font4_styles.json`，页面上**除 `font-family` 外与被测页面逐值一致**，两栏只差汉字 |
| `.workbuddy/shots/font4_after_<id>.png` ×4 | **真实页面**（改后）该处的放大裁剪：`cast307` 「建议 12–18 kg/s」 · `home156` 「1.7 m · 人」 · `home160` 「净重 50 t」 · `vault208` 「炉火不灭 · 2026」 |
| `.workbuddy/shots/font4_styles.json` | 四处实测 `fontSize/fontWeight/letterSpacing/lineHeight/color/背景/rect` |

**看哪里**：`净重` 的「净 / 重」、`人`、`炉火不灭` 的「火 / 灭」在左右两栏字形明显不同
（左 = 微软雅黑、右 = Noto Sans SC）；数字与拉丁字母两栏相同（都是 Inter）。

> ⚠️ **诚实边界**：`font_ab.png` **不是「改前 dist 的截图」**（改前的 dist 已不存在），
> 它是**只改动的那一个 token 的栈级复现**。真实页面（改后）的四处裁剪见上表第二行；
> 整页并排见 4-⑥。
>
> 📌 取证时另踩一坑：首页账本是 **absolute 三屏 + 由滚动量 `--ledger-p` 控 opacity**，
> 第一版用 `scrollIntoView` 把**隐藏屏**里的元素滚进视口 ⇒ 裁出来只有底纹。
> 已改为**先滚到 `p=0.45`**（第 2 屏区间 `[0.30, 0.59]`，`home.js:178-203`）再量。

---

## 5. 对稿的偏离 / 新发现（**两处，都报上来，都没自己糊过去**）

### ① 偏离：**不加 preload**（稿 §3.6 原要求加）

稿 §3.6 原写「在 `fonts.css` 那行前后加 `<link rel="preload" href="/fonts/NotoSansSC-subset.woff2" as="font" ...>`」。
落地时实测**证伪**（脚本 `.workbuddy/probe_preload_warning.py`，带/不带两跑、各 4 段导航）：

| | 首屏 `/` | 第 2 段 `#/history` | 第 3 段 `#/entrance` | 第 4 段 375×812 `/` | 字体请求 | FontFace |
|---|---|---|---|---|---|---|
| **带 preload** | ⚠️ 1 条 warning | ⚠️ 1 条 | ⚠️ 1 条 | ⚠️ 1 条 | `NotoSansSC` initiator=**link** | 2/2 loaded |
| **不带 preload** | clean | clean | clean | clean | `NotoSansSC` initiator=**css** | 2/2 loaded |

warning 原文：*"The resource /fonts/NotoSansSC-subset.woff2 was preloaded using link preload but
not used within a few seconds from the window's load event."*

- **字体其实用上了**（FontFace 2/2 `loaded`、`--font-num` 已含 Noto、四处落点全命中）⇒ 这是
  **「preload 未被复用」的假警报**：本机（共享 Edge profile）里 woff2 已在 HTTP 缓存中，
  preload 拿到缓存命中，Chrome 的「预加载是否被消费」判定就落空。
- **代价是真实的**：它让 `verify_turn` 的 `U12.console.history` 与 `U12.home375`（判据是 `not probs`）
  双双转红 ⇒ **43/44 → 41/44**。摘掉 preload 后**回到 43/44**，4 段导航 console 全清。
- **收益是零**：本项目 CSS 是**同源、单文件、阻塞式**样式表，`@font-face` 的发现本来就在首次渲染之前。
- ⇒ **裁定：删掉 preload**；并**没有去改 `U12` 的判据**（那是「改判据糊过去」）。
  稿 §3.6 已就地写明这张对照表与结论。

### ② 新发现：稿说的「4 处」实为 **4 处 DOM + 1 处 Canvas** —— **第 5 处本批未修**

`demo/src/js/ui/poster.js:20` 的 `FONT_NUM` 是 `--font-num` 的**第二份拷贝**（稿 §1.3 自己写的
「CSS 侧 `tokens.css:30-32` 是同一份栈」就是指它），而它**没有**跟着接 CJK 兜底：

```js
// poster.js:20（本批未动，与改前一致）
const FONT_NUM = '"Inter","Helvetica Neue",Arial,system-ui,sans-serif';
// poster.js:119 —— 画的正是 vault.js:208 的**同一串文本**
center(ctx, '炉火不灭 · 2026', W / 2, H - 108, `500 28px ${FONT_NUM}`, EMBLEM_COLORS.steel);
```

⇒ **导出的海报上「炉火不灭」会走系统兜底、`· 2026` 走 Inter —— 与页面分叉**（正是稿 §1.3
红线 1 要防的那种分叉）。

**为什么不能用「测宽」下结论**：汉字在 Noto / 雅黑 / `sans-serif` 里都是 **1 em** ——
实测 `mw('500 28px ' + OLD, '炉火不灭')` = **112**、`mw(..., '"Noto Sans SC"')` = **112**，
**完全相等**。⇒ 必须**逐像素比字形**（`.workbuddy/probe_canvas_fontnum.py` → `shots/canvas_fontnum.json`）：

```
  整串 OLD vs NEW  @500 28px         changedPixels=1357   maxDelta=255   ≠ 不同字体
  汉字 OLD vs 仅Noto                  changedPixels=1760   maxDelta=255   ≠ 不同字体
  数字 OLD vs 仅sans                  changedPixels=1100   maxDelta=255   ≠ 不同字体
  对照 同栈 vs 同栈                      changedPixels=0      maxDelta=0     = 同一字体   ← 证明测量无噪声
  对照 NEW vs NEW                    changedPixels=0      maxDelta=0     = 同一字体
```

⇒ **判定成立**（两组「同栈自比」都是 0，说明仪器干净）。

**为什么本批不改**（这是要请用户裁定的，不是我忘了）：

1. 改它=改 **JS 内容** ⇒ `index-*.js` 的 raw / gzip(9) / 哈希**全变**。而本批的卖点之一恰是
   「JS 逐字节未变、D1 不受影响」，`K11` 预算只剩 **173 B** 余量（加 ~60 字符族名虽大概率够，
   但**这是要单独量、单独记的**）。
2. 它改的是**导出海报的字形观感**（一个 raster 产物），属于视觉决定 ⇒ 按本项目惯例
   **先回画稿核**，不走「实现方觉得更一致就顺手改」。
3. 稿 §5 的 6 条红线没有授权这一处；本批授权范围是「按稿落地」。

**⇒ 列为待裁定**，建议合并进 P1-4-6 或重打包那一轮（一处 1 行改动、2 个文件）。

> 📌 **这个盲区值得记进方法库**：稿 §1.5 的取证脚本扫了「CSS 里声明 `var(--font-num)` 的选择器」+
> 「DOM 里 `class*="num"/"latin"` 的元素」，**唯独没扫 JS 里 second-copy 的 `FONT_NUM` 消费者**。
> 而这**正是稿自己在 §1.5 备注里警告过的同款坑**（第一版只扫 `class="num"/"latin"`，
> 漏了 CSS 声明的 `.ledger__unit-lbl`）—— 同一类坑在同一份稿里踩了第二次。

---

## 6. 许可证（★ §8-4⑥）

**两份都要随包**（两份版权行不同，合并会丢声明）：

| 文件 | 位置 | 首行版权 |
|---|---|---|
| `OFL-NotoSansSC.txt` | `demo/public/fonts/`（构建后 = `demo/dist/fonts/`） | `Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'` |
| `OFL-Inter.txt` | 同上 | `Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)` |

**合规分析**（稿 §7「许可证」段的落地版）：
- 两者都是 **SIL OFL 1.1**，允许子集化 / 随应用分发 / 商用；要求分发时**附版权声明与 OFL 全文**。
- ⚠️ **Noto Sans SC 带 reserved font name `'Source'`**（它派生自 Adobe 的 Source Han Sans），
  稿最初写的「这两个字体没有 RFN」**是错的，出稿时已就地更正**。
- 我们的子集**删了字形** ⇒ 属 OFL 意义上的 **Modified Version** ⇒ 解析 3) 生效：**不得使用保留字**。
  我们保留的族名是 `"Noto Sans SC"`（**不含 `'Source'`**）⇒ **合规**；
  **绝不能**把它改成含 `Source` 的名字（`fonts.css` 头注已把这条写死）。
- Inter 无 RFN。

**`release/使用说明.md` 要加的那一句**（**本批故意没写进去**）：

> 本包内含 `dist/fonts/` 两个字体子集（Noto Sans SC / Inter），均按 **SIL Open Font License 1.1**
> 授权分发，许可证全文见同目录 `OFL-NotoSansSC.txt` 与 `OFL-Inter.txt`；
> 二者均为**子集化**（仅含本站用到的 1,134 个字形）与**可变字体**，未改动族名。

⚠️ **为什么不现在写**：`release/dist` 仍是 **2026-09-18** 的旧快照，**里面根本没有字体文件** ——
现在写进去会让「本包含字体」变成**假声明**。⇒ 归入**交付准备第 1 项（重打包）**一起做，
届时要三件齐动：覆盖 `release/dist/` ＋ 拷 `dist/fonts/` 四个文件 ＋ 把上面这句写进 `使用说明.md`。

📌 顺带核实过的两件事：`release/server.js:30-31` **已经**给 `.woff` / `.woff2` 配了
`font/woff2` MIME ⇒ **服务端不用改**；`使用说明.md` 里「`dist/` 使用相对路径构建」这句
**与现状不符**（现行构建是 `base:'/'` 的绝对路径 `/assets/...`）—— 这是**既有**问题，
属稿 §9「待裁定 D」同一条，本批不动。

---

## 7. 20 份 `verify_*.py` 前后对照表（§6.2 的第 3 步）

**跑法**：`.workbuddy/run_all_verify.py before|after|final`（**串行** —— 共用同一个 Edge profile，
并发会报「DevTools 端口不可达」；用 **venv 解释器**，它装了 numpy/pillow，否则 4 份像素类脚本会假红）。
汇总脚本 `.workbuddy/compare_verify_runs.py`。原始产物 `.workbuddy/verify_runs/{before,after,final}.json` + 每份的 `.txt`。

| 脚本 | before | after（**带 preload 的中间态**） | **final（删 preload 后 = 交付态）** |
|---|---|---|---|
| `verify_archive_b3` | 绿 | 绿 | 绿 |
| `verify_archive_b4` | 绿 | 绿 | 绿 |
| `verify_archive_b5` | 绿 | 绿 | 绿 |
| `verify_cast` | 绿（E9/H3/T7 PASS） | 绿 | 绿（H3 `firstLeft 1118.5` 未动） |
| `verify_cdp` | 非零(2) | 非零(2) | 非零(2) |
| `verify_history_cta` | 绿 | 绿 | 绿 |
| `verify_hotspots` | 绿 | 绿 | 绿 |
| `verify_p0` | 绿 | 绿 | 绿 |
| `verify_p12` | 非零(1) | 非零(1) | 非零(1) |
| `verify_step4` | 绿 | 绿 | 绿 |
| `verify_step4a` | 绿 | 绿 | 绿 |
| `verify_step4a_edge` | 非零(2) | 非零(2) | 非零(2) |
| `verify_step4c` | 绿 | 绿 | 绿 |
| `verify_step4c_e5` | 绿 | 绿 | 绿 |
| `verify_turn` | 非零(1) · **43/44** | 非零(1) · **41/44** ⚠️ | 非零(1) · **43/44** |
| `verify_ux` | 绿 · **47/47** | 绿 · 47/47 | 绿 · **47/47** |
| `verify_vault` | 绿 · **41/41** | 绿 · 41/41 | 绿 · **41/41** |
| `verify_w1` | 绿 · **3/3** | 绿 · 3/3 | 绿 · **3/3** |
| `verify_w2` | 绿 | 绿 | 绿 |
| `verify_w3` | 绿 | 绿 | 绿 |

**汇总**：`before` / `final` 各为 **共 20 · 绿 16 · 非零 4**，且**非零集合完全相同**：
`{verify_cdp, verify_p12, verify_step4a_edge, verify_turn}`。
⇒ **§6.2 第 3 步的答案：无一份「由绿转红」。**

**四份既有非零的成因（改前就在，不是本轮引入，逐条已核）**：

| 脚本 | 成因 |
|---|---|
| `verify_cdp` | **它是库不是测试**：`main()` 无参时打印 docstring 并返回 2 ⇒ 恒 `exit=2`（`verify_turn` 等 `import verify_cdp`，不受影响） |
| `verify_p12` | 既有脚本 bug：`P2 页顶 = None` ⇒ `TypeError` |
| `verify_step4a_edge` | 既有阈值不可达：E5′ `min 6.2 < 20`（`archive/README.md` 已登记待裁定） |
| `verify_turn` | 唯一红 = 既有 **`K13b`**：gzip(9) 205,796 B > 评委硬线 198.57 KiB ⇒ **D1**，另案 |

**唯一的中途转红 `verify_turn` 41/44 是什么**：就是我加的 `<link rel=preload>` 造成的
（`U12.console.history` + `U12.home375`）—— §5-① 已把根因、对照实验与修法写全。
**这一条按稿要求「报回来、没自己调容差」**：没有去改 `U12` 的判据，而是**删掉 preload 让判据自己转回绿**。

**另两件与本批相邻的核查**：

| 脚本 | 读数 |
|---|---|
| `.workbuddy/check_font_selfhost_prompt.py`（**出稿前**工具） | **75 绿 / 5 红** —— 5 红全在 A 组（`A1_html_preconnect_googleapis` · `A2_html_preconnect_gstatic` · `A3_html_css2_link` · `A6_fonts_css_not_yet_created` · `A7_public_fonts_not_yet_created`）。**这 5 条由绿转红正是本批落地成功的证据**（红线 8，已加 ⛔ 抬头封版）。⚠️ 已同步把它的 `PROMPT` 路径改到 `archive/spec/`（否则它连跑都跑不起来，75/5 就不可复现） |
| `.workbuddy/check_p1_456_prompt.py` | **101 绿 / 0 红**（因字体稿落地顶走了 `tokens.css` 行号，本批已按落地后重核并回写：`A2 34→36` · `A3 35→37`；`G` 段两条前提断言翻面 —— 从「html 还有 googleapis」改成「html 里任何地方都没有 googleapis」+「fonts.css 有两枚 face」+「public/fonts 已就位」） |

### 交付态的字节锁定（改完头注后的复检）

归档时把 `demo/src/styles/fonts.css` 头注里指向提示词的路径改成 `archive/spec/…`（项目惯例：
已归档件一律引归档路径，`turn.js` / `vault.js` 都是这么写的），随后**重建并逐字节复检**：

```
index-DtvYVM-O.css   raw=36018  gzip9=7260    sha256[:16]=461637a1a69dbb25   SAME ✅
index-aA-vVRY_.js    raw=704489 gzip9=205796  sha256[:16]=ccf172868968d396   SAME ✅
⇒ dist 与已验收批次逐字节一致
```

⇒ 上面那张门禁表**对交付态继续有效**，不必重跑；也**旁证了「CSS 注释被 esbuild 剥离」**。

---

## 8. 不在本批 / 待裁定

| # | 项 | 归属 |
|---|---|---|
| ★ | **Canvas 第 5 处**（`poster.js` 的 `FONT_NUM` 未接 CJK 兜底，海报与页面分叉）—— ⚠️ **两个锚点是同一件事**：`poster.js:20` = **声明处**（与 `emblem.js:41` 配对）、`poster.js:119` = **真正画汉字的那次调用**（`'炉火不灭 · 2026'`）。别的文档写 `:119`、本自述写 `:20`，**都不是笔误** | **待用户裁定** —— 见 §5-②（本批故意未动） |
| — | 圆角/字号/字距收档（P1-4 / P1-5 / P1-6） | ✅ **2026-09-24 已实现并归档（第十一批）** → `archive/spec/PROMPT-P1-4-6.md`；自述 `spec/IMPLEMENTATION-P1-4-6.md` |
| — | 重打包 `release/dist` ＋ `dist/fonts/` ＋ `使用说明.md` 的许可证句 | 交付准备**第 1 项**（`release/dist` 仍停 2026-09-18） |
| — | 稿 §9 的 **A / B / C / D 四条**（字表宽严 · Inter `opsz` · 是否删 Inter · 子路径部署） | 设计侧建议已给（A 宽松 1,134 · B 不钉 `opsz` · C 保留 Inter **须用户视觉裁定** · D 承认现状 `base:'/'`），**待用户拍板** |
| — | **D1 体积**（评委硬线 198.57 KiB，实测 200.97 KiB） | 另立一轮（出路 = 按页 code-split） |
| — | **D2 砂箱编号** · **D6 刀片楔角** · **P1-10 首屏 h1 顶边** | 老账，维持原状 |

---

## 9. 改动文件清单（重打包时照这个搬）

```
demo/index.html                          改（删 3 行 / 加 1 行）
demo/src/styles/fonts.css                新建（37 行）
demo/src/styles/tokens.css               改（:32 一行 → :32-34 三行）
demo/public/fonts/NotoSansSC-subset.woff2    新建 282,432 B
demo/public/fonts/Inter-subset.woff2         新建  45,724 B
demo/public/fonts/OFL-NotoSansSC.txt         新建   4,388 B
demo/public/fonts/OFL-Inter.txt              新建   4,377 B
```

**证据文件索引**（全部在 `.workbuddy/` 下，按路径引用）：

| 文件 | 是什么 |
|---|---|
| `shots/font_probe_before.json` · `_after.json` | §4-⑤ 运行时读数（2 face / 432 face 对照） |
| `shots/font_final_check.json` | §3 覆盖自检原始 JSON |
| `shots/offline-compare.json` · `offline_sheet.png` · `offline-{home,vault}-{normal,blocked}.png` | §4-⑥ 断网复核（含对照组） |
| `shots/font_ab.png` · `font4_after_*.png` ×4 · `font4_styles.json` | §4-⑦ 放大对比 |
| `shots/canvas_fontnum.json` | §5-② 第 5 处的逐像素判定 |
| `verify_runs/{before,after,final}.json` + `verify_runs/<tag>/*.txt` | §7 门禁前后对照的原始读数 |
| `build.log` | 交付态的 vite 构建输出（`dist/html 0.66 kB · css 36.02 kB · js 689.76 kB`） |

**本轮新增/改动的脚本**（都在 `.workbuddy/`）：`run_all_verify.py`（串行跑批 + 服务健康检查）·
`compare_verify_runs.py` · `probe_font_selfhost.py` · `probe_preload_warning.py` ·
`probe_offline_font.py` · `probe_font_evidence.py` · `probe_canvas_fontnum.py` ·
`make_font_ab_page.py` · `make_offline_sheet.py`；`check_font_selfhost_prompt.py`（⛔ 封版 + 路径改归档）。
