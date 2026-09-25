# IMPLEMENTATION · 第十三批「全站中文字体换霞鹜文楷」（Noto Sans SC → 霞鹜文楷 LXGW WenKai）

> **状态**：**已实现并验收**（2026-09-24 夜间出稿 · 2026-09-25 凌晨落地 · **第十三批**）。
> 依据 [`archive/spec/PROMPT-FONT-CJK-SWAP.md`](../archive/spec/PROMPT-FONT-CJK-SWAP.md)
> （2026-09-24 出稿；出稿前自检工具 `check_font_swap_prompt.py` **34 / 34 PASS · exit=0**；下文引它的行号均为**改前**行号）。
> 用户裁定原话（出稿前置）：看过 `.workbuddy/shots/cjk_cand_A.png` 候选对照图（现状 + 8 款可落地候选 + 13 款本机商业字体），
> **选定第 3 卡「霞鹜文楷」**，并裁定**换的范围 = 全站**（正文也换，黑体彻底退场）。
> ⚠️ 本自述由**设计侧**（兼实现）交付 —— 与本项目其它批次一致，证据全部为**脚本实测**，
> **不用「看起来对了」当证据**（截图只作人眼复核）。

> 📌 **设计侧复核后记（2026-09-25 凌晨）—— 跑批出现 2 个计划外的新红，已定性为「字体度量副产品」，判据一字未改**
>
> | 门禁 | 失败项 | 判据 | 实测 |
> |---|---|---|---|
> | `verify_cast.py:74` | `H3 结论` | `h3["firstLeft"] == 1118.5` | **1111** |
> | `verify_ux.py` | `P0F3_cast_steps_no_auto_number` | `abs(firstLeft - 1118.5) <= 1` | **1111** |
>
> 二者是**同一个量**（`.cast__steps` 首项左边界），根因也同一个。定性走**测量**（`.workbuddy/probe_cast_steps.py`，两构建对照）：
>
> | 量 | 改前（Noto Sans SC） | 改后（霞鹜文楷） | 判读 |
> |---|---|---|---|
> | `.cast__steps` **右边缘** | **1376.00** | **1376.00** | **逐位相同** ⇒ 右边缘锚定，未移动 |
> | `.cast__steps` 左边缘 | 1118.47 | 1110.98 | −7.49 |
> | `.cast__steps` 宽 | 257.53 | 265.02 | **+7.49** |
> | 5 个标签文本宽 Σ | 193.52 | 201.00 | **+7.48** |
> | 4 × `gap`（16px） | 64.00 | 64.00 | 不变 |
> | `.cast__steps` 高 | 20.39 | 20.39 | **不变**（无折行、无裁切） |
> | `.cast__steps` 横向溢出 | 0 | 0 | 不变 |
> | 该文本解析出的字体族 | `Noto Sans SC` | `LXGW WenKai` | 真的换了 |
>
> **机制**：`.cast__topbar > .topbar__inner`（`display:flex`）里 `.cast__steps` **之前**有 `.topbar__spacer{flex:1 1 auto}`
> ⇒ 步骤药丸条被**推到最右、右边缘钉死**在容器的右 padding 边（1440 − 64 = 1376）。
> 于是 `firstLeft = 右边缘 − 文本块宽` —— 它是**文本度量算出来的导出量，不是设计常量**；
> 楷体/拉丁的 advance 变宽 ⇒ 文本块宽 **+7.48** ⇒ 首项**正好左移 7.49**。
>
> ⇒ 按稿 §6 的处置规则（「转红时先分类：『文字字形变了』属预期，**经用户过目后固化新基准**；『布局真的坏了』才修」），
> 本条**归入「字体度量副产品」**。**两份门禁的判据一个字都没改**（红线 10：不许改判据糊过去）；
> 固化新基准（`1118.5` → `1111`，或改判为「右边缘 = 1376 且无溢出」这种不随字体漂移的写法）**等用户过目后另起一轮**（见 §9）。
> 连带说明：`verify_cast` 的 `T7 结论` 打印也是**同一个根因**（`:100` 的 pass 条件是 `t7_pass and ok`，`ok` 已被 H3 拖累；
> 两次 hall 读数完全相同 —— `calls:37 / triangles:32822 / setView:True / 控制台 CLEAN`）⇒ 不是独立回归。

---

## 0. 一句话

把**全站中文字体**从 Noto Sans SC（黑体，自托管**可变**子集）换成 **霞鹜文楷 LXGW WenKai v1.330**（楷体手写感，SIL OFL 1.1，免费商用）：
`@font-face` **1 → 2**（Regular 400 / Bold 700 两个**静态**字重子集）、**4 处字体栈首名替换**、
`demo/public/fonts/` **2 个 / 286,820 B → 3 个 / 473,876 B（+187,056 B）**；
**字号 / 字距 / 行高 / 圆角 / 间距 token 一个不动**、**CSS `font-weight` 数值一个不动**。
**必改门禁 4 处** + `verify_font_drop` **3/3 PASS** · 八页 × 两视口横向溢出 **16 / 16 全 0** ·
`document.fonts.size` **1 → 2**（两 face 均 `loaded`）· 子集覆盖 **1,134 / 1,134，一字不缺**。

⚠️ **这不是体积批次**：字体字节 +187,056 B **不进** D1 的账（D1 只看 JS gzip）。
JS gzip9 **205,768 → 205,775（+7 B）**、CSS gzip9 **7,201 → 7,222（+21 B）** —— 与「4 处栈字符串各短 1 字符」的估算同量级。
⚠️ **D1 一个字都没碰**（「198.57 KiB 硬线」来源仍在查证中，不许用「评委硬线」这个说法）。
⚠️ **跑批非零集合新增 2 个成员**（`verify_cast` / `verify_ux`，同源、已定性，见上「复核后记」与 §4-①②）。

---

## 1. 改动清单：8 条编辑 + 1 删 2 增 + 1 门禁（逐条改前 / 改后）

> 稿 §2 要求「**一处文件一批多条编辑会被静默丢弃** ⇒ 一条一条提交并回读确认」。本批**逐条提交 + 逐条 Read 回读**。
> 改前原文从 **`.workbuddy/before13/`**（`make_before13.py` 复刻的独立 scratch 工程，`demo/` 全程只读）逐字取，不靠记忆。

### ① 【删】E1 —— 两个 Noto 文件

```
demo/public/fonts/NotoSansSC-subset.woff2        282,432 B   → 删除
demo/public/fonts/OFL-NotoSansSC.txt              4,388 B    → 删除
```

### ② 【增】E2 —— 子集化（**前置：必须先修 cmap，见 §4-③**）

```bash
pyftsubset .workbuddy/fontwork/raw_repaired/LXGWWenKai-Regular.ttf \
  --text-file=.workbuddy/fontwork/chars-loose.txt --flavor=woff2 \
  --output-file=demo/public/fonts/LXGWWenKai-Regular-subset.woff2
pyftsubset .workbuddy/fontwork/raw_repaired/LXGWWenKai-Bold.ttf \
  --text-file=.workbuddy/fontwork/chars-loose.txt --flavor=woff2 \
  --output-file=demo/public/fonts/LXGWWenKai-Bold-subset.woff2
```

- `chars-loose.txt` = `.workbuddy/fontwork/chars-loose.txt`（**同一份字表**，第十批至今未换）：文件 **3,200 B / 1,134 字符**、无换行、无重复、
  含**一个空格 U+0020** ⇒ 「**1,134**」是原始字符集口径，「1,133」是脚本去重时剔掉空格的口径，**两者都对，本自述统一用 1,134**。
- `pyftsubset` **默认 layout-features**（未加 `--layout-features=*` —— 第十批的坑）。霞鹜文楷无 `tnum` ⇒ 无需显式补。
- 产物：Regular **235,944 B** · Bold **233,376 B**（§2-A）。

### ③ 【增】E3 —— 许可证文本

`demo/public/fonts/OFL-LXGWWenKai.txt`，**4,556 B / 95 行**：

```
霞鹜文楷 LXGW WenKai · 上游 https://github.com/lxgw/LxgwWenKai · SIL OFL 1.1 · 本文件为其子集   ← 稿指定的 1 行头
Copyright 2021-2024 LXGW (https://github.com/lxgw/LxgwWenKai)                                   ← 偏离①（见 §4-⑤）
Copyright 2020 The Klee Project Authors (https://github.com/fontworks-fonts/Klee)                ← 偏离①
                                                                                                 ← 空行
<上游 OFL.txt 全文，91 行 / 4,301 B>
```

**「保留字」合规复核（实际做过，不是照抄稿）**：全文件 **只有第 35 行**在**术语定义**里出现 `"Reserved Font Name"`，
**没有任何 `Copyright … with Reserved Font Name "…"` 形式的保留字声明** ⇒ 子集**沿用族名 `"LXGW WenKai"` 合规**。
（对比：Noto Sans SC 的 OFL 声明了 `with Reserved Font Name 'Source'`，所以不能叫 `Source …`；霞鹜文楷没有这条。）
子集 name 表实测：`name1 = 'LXGW WenKai'`、`name2 = 'Regular' | 'Bold'`、`OS/2.usWeightClass = 400 | 700`、
`OS/2.fsType = 0`（安装嵌入许可 = 无限制）—— 与上游逐项一致。

### ④ 【重写】E4 —— `demo/src/styles/fonts.css`：**28 行 → 35 行**（+7）

改前（28 行，单 `@font-face` + 多头注，`:23` 族名 / `:27` src）：

```css
/* ============================================================
   fonts.css — 自托管字体（子集化可变字体）
   来源：Noto Sans SC（SIL Open Font License 1.1）
        许可证全文见 public/fonts/OFL-NotoSansSC.txt
   …
   ⚠️ 这个文件是子集，只含全站用到的 1134 个字形
   …
   ============================================================ */

@font-face {
  font-family: "Noto Sans SC";
  font-style: normal;
  font-weight: 100 900;        /* 可变轴；400/500/600/700 由浏览器插值 */
  font-display: swap;
  src: url("/fonts/NotoSansSC-subset.woff2") format("woff2-variations");
}
```

改后（**35 行**，两个 `@font-face`，**与稿 §2-E4 的模板逐行一致**）—— 头注五段：

1. 来源 / 许可证指向（v1.330 · `public/fonts/OFL-LXGWWenKai.txt`）；
2. **族名契约**：必须与 `tokens.css` / `poster.js:19` / `emblem.js:40` 完全一致，否则页面与导出海报分叉；
3. **静态双字重的物理约束**：CSS 的 500 取 Regular、600 取 Bold（浏览器匹配规则，**不合成**）；
4. **覆盖率**：`1,134 / 1,134`（并写明「v1.250 分片上量到缺 Δθπω、v1.330 全量已补齐，含 `viewport.js:470` 的 `Δ`，无需系统兜底」）；
5. 数字 10 个 advance 全等 0.6 em（天然等宽）、`tnum` 对本字体是 no-op 保留无害。

```css
@font-face {
  font-family: "LXGW WenKai";
  font-style: normal;
  font-weight: 400 500;        /* 区间写法：把匹配规则显式钉在 CSS 里，不靠浏览器猜 */
  font-display: swap;
  src: url("/fonts/LXGWWenKai-Regular-subset.woff2") format("woff2");   /* 注意：不是 woff2-variations */
}

@font-face {
  font-family: "LXGW WenKai";
  font-style: normal;
  font-weight: 600 700;
  font-display: swap;
  src: url("/fonts/LXGWWenKai-Bold-subset.woff2") format("woff2");
}
```

> `wc -l` 实测 **35**（末行带换行；首次落盘 36 是因为尾部多了一个空行，压掉后为 35 ⇒ 与稿模板 35 行**完全对齐**，无偏离）。

### ⑤ 【编辑】E5 —— `demo/src/styles/tokens.css`：**4 处、净 0 行**（63 → 63；`diff` 变更行数 **8** = 4 对）

改前 `:32-33`（注释）· `:34-35`（`--font-cn`）· `:36-38`（`--font-num`）：

```css
  /* 中文/西文字体栈：优先 Web 字体，缺失时逐级回落到系统中文字体
     （评委机器若无法访问 Google Fonts，必须能回落到苹方/微软雅黑，不能糊） */
  --font-cn:  "Noto Sans SC", "Source Han Sans CN", "PingFang SC",
              "Microsoft YaHei", "Hiragino Sans GB", system-ui, sans-serif;
  --font-num: "Noto Sans SC", "Source Han Sans CN", "PingFang SC",
              "Microsoft YaHei", "Hiragino Sans GB",
              system-ui, sans-serif;   /* 第十二批：Inter 已删 —— 数字/拉丁与正文同栈 */
```

改后（`:32-33` 注释按稿 §2-E5 的新文；`:34` / `:36` 只换**栈首**；`:38` 尾注**一字不动**）：

```css
  /* 中文/西文字体栈：优先 Web 字体（自托管子集），缺失时逐级回落到系统中文字体
     （子集只含全站 1,134 字；用户输入的集外字由苹方/微软雅黑兜底，不能糊） */
  --font-cn:  "LXGW WenKai", "Source Han Sans CN", "PingFang SC",
              "Microsoft YaHei", "Hiragino Sans GB", system-ui, sans-serif;
  --font-num: "LXGW WenKai", "Source Han Sans CN", "PingFang SC",
              "Microsoft YaHei", "Hiragino Sans GB",
              system-ui, sans-serif;   /* 第十二批：Inter 已删 —— 数字/拉丁与正文同栈 */
```

- 回读确认 `:40` 仍是 `--fs-display: 44px;`、`:41` 仍是 `--fs-readout: 64px;`（**行号未动**）。
- 稿 §1.1 指出的「`:33` 有『评委机器若无法访问 Google Fonts』—— 第十批遗留的陈旧话」**已顺带改写**（这条已经假了：字体早已自托管，与 Google Fonts 无关）。
- `--font-num` **保留**（消费者 `base.css:32` / `layout.css:1492` / `:1557`）⇒ 本批后它与 `--font-cn` 是**同栈别名**（与第十二批同款结论）。

### ⑥ 【编辑】E6 —— `demo/src/styles/base.css:31` 注释：**净 0 行**（117 → 117）

- 改前：`/* 数字与拉丁字母与正文同栈（第十二批已删 Inter） */`
- 改后：`/* 数字与拉丁字母与正文同栈（第十二批删 Inter、第十三批换霞鹜文楷，两批均为单栈） */`
- `:16`（`font-family: var(--font-cn);`）与 `:32`（`.num, .latin { … font-feature-settings: "tnum"; }`）**一动不动**。

### ⑦ 【编辑】E7 —— Canvas 两处常量：**净 0 行**（`poster.js` 154 → 154；`emblem.js` 272 → 272）

- `poster.js:19` 与 `emblem.js:40`，各自：
  `const FONT_CN = '"Noto Sans SC","Source Han Sans CN",…';` → `const FONT_CN = '"LXGW WenKai","Source Han Sans CN",…';`
- 两文件里 **10 处 `ctx.font` 使用点**（`poster.js:43/46/73/77/87/90/94/115/118`、`emblem.js:238`）**一动不动**。
- Canvas 的权重匹配与 CSS 同规则（500 → Regular）⇒ 导出海报与页面**必然同字形**，这正是族名不可改的原因。

### ⑧ 【编辑】E8 —— `demo/README.md:35`：**净 0 行**（153 → 153）

- 改前：`字体：**Noto Sans SC（自托管子集，SIL OFL 1.1）**`
- 改后：`字体：**霞鹜文楷 LXGW WenKai（自托管子集，SIL OFL 1.1，Regular/Bold 双字重）**`

### ⑨ 【门禁改写】G1 —— `.workbuddy/verify_font_drop.py`：**8 行、净 0 行**（180 → 180）

稿 §2-G1 列的 **4 处**（语义改写，判据不变）：

| 行 | 改前 | 改后 |
|---|---|---|
| `:137` | 注释「…且首项是 Noto Sans SC」 | 「…且首项是 **LXGW WenKai**」 |
| `:142` | `head_noto = all(f.lstrip().startswith('"Noto Sans SC"') …)` | `…('"LXGW WenKai"') …` |
| `:151` | `"NotoSansSC-subset.woff2" in x["url"]` | `"LXGWWenKai-Regular-subset.woff2" in x["url"]` |
| `:153` | `if "Noto Sans SC" in f` | `if "LXGW WenKai" in f` |

**另有 4 处「失效的自我描述」一并就地改写**（偏离②，见 §4-⑥）：`:2` docstring、`:148` 的 D2 段注释、`:160` 的 `control_note`、`:168` 的汇总行
（现为 `==== FONT-DROP-INTER + CJK-SWAP VERIFY: 3 / 3 PASS ====`）。
⚠️ 变量名 `head_noto` / `noto_req` / `face_noto` **保留不改名** —— 改名会破坏「净 0 行」，且三个名字承担的语义仍是「**对照组**」。
⚠️ 全仓回扫 22 份 `verify_*.py`：除本文件 8 行外，**只有 `verify_archive_b5.py` 还有 1 处**（那是**归档审计**脚本、只读历史归档、不跑页面）⇒ **按稿 §2-G1 不改**。其余 20 份为 0。

---

## 2. 实测读数（不是估算）

### 2-A 字体文件与产物

| 文件 | 字节 | sha256[:16] |
|---|---|---|
| `demo/public/fonts/LXGWWenKai-Regular-subset.woff2` | **235,944** | `4ae2a49741890c07` |
| `demo/public/fonts/LXGWWenKai-Bold-subset.woff2` | **233,376** | `21bf6fa10dfcae9b` |
| `demo/public/fonts/OFL-LXGWWenKai.txt` | **4,556** | `91e4fbd64e1849ff` |
| **合计（3 个）** | **473,876** | — |

改前 **2 个 / 286,820 B**（`NotoSansSC-subset.woff2` 282,432 + `OFL-NotoSansSC.txt` 4,388）⇒ **+187,056 B**。
（源 TTF 尺寸：Regular **19,073,964 B** · Bold **18,546,748 B**，与稿 §1.5 的 Content-Range 实测**逐字节吻合**。）

| 产物 | raw | gzip9 | Δraw | Δgzip9 |
|---|---|---|---|---|
| `index-DxzSVEyG.js` | **704,430** | **205,775** | **−2** | **+7** |
| `index-CigWfXV7.css` | **36,455** | **7,222** | **+146** | **+21** |

> ⚠️ **口径钉死**：**Python 3.13.14 · zlib 1.3.1 · `gzip.compress(raw, 9)`**（= `verify_turn.py:509` 的口径）。
> 裸 `zlib.compress(raw, 9)` **少一层 gzip 容器**，会把同一份 JS 读成 **205,763**、CSS **7,210**（第十二批同款教训：口径不钉死就不是一个口径）。
> 交叉验证：`verify_turn.py` 的 `K13b` 现算 **200.95 KiB（=205,775 B）** ✔ · `verify_w3.py` 的 `P8.gzip` 读数 **205,775** ✔ · 与本自述三方一致。
> **D1 缺口 = 205,775 − 203,335 = 2,440 B ≈ 2.38 KiB**（与第十二批的 2.38 KiB 同值）。
> `K13a`（≤215 KiB）**过**（205,775 ≤ 220,160）；`K13b`（<198.57 KiB）**仍红** —— **与本批无关**（红线：官方文件前不许碰 D1）。
> **产物名哈希已变**：`index-Dc2hlaOH.js` → **`index-DxzSVEyG.js`**、`index-Dnr5PM8C.css` → **`index-CigWfXV7.css`** ⇒ 已按稿 §5 全仓回扫（§4-⑦）。

### 2-B 覆盖与字度量（`measure_lxgw1330.py` + `fontTools` 直读，**不是估算**）

| 项 | 霞鹜文楷 v1.330 | 对照（Noto Sans SC） | 判读 |
|---|---|---|---|
| 字表覆盖（Regular） | **1,134 / 1,134，缺字 = 无** | 1,134 / 1,134 | 本批**全绿**（见 §4-②） |
| 字表覆盖（Bold） | **1,134 / 1,134，缺字 = 无** | 同 | 同上 |
| 10 个数字 advance | **全等 0.6000 em** | 全等 0.5210 em | 数字**仍天然等宽**；`tnum` 变 no-op 但无害 |
| 拉丁 A–Z advance | min 0.3040 / max 0.8800（A **0.6900** / a 0.5750 / M 0.8550 / W 0.8800） | A–Z 均值 0.6032 | **拉丁整体变宽** |
| `·`(U+00B7) | **0.3500 em（窄）** | **1.0000 em（全宽）** | 第十二批副作用**被逆转** |
| 空格 U+0020 | 0.3500 em | — | 空格变宽（含在 `1ch` 变化里） |
| `、，…—` | 全 1.0000 em | 全 1.0000 em | 中文标点不变 |

- 两子集 cmap 码位各 **1,136**（1,134 字 + 2 个因 cmap 合并段带入的邻接码位），**对字表覆盖 100%**。
- `upem = 1000` · `numGlyphs = 36498` · `format 12 nGroups = 3453` · 原始 cmap 码位 **36,212**（Regular / Bold 逐项相同）。
- **四个希腊字母在 v1.330 都有真实轮廓**（实测轮廓数 / advance）：`Δ` 2 / 0.6500 · `θ` 3 / 0.5700 · `π` 1 / 0.5770 · `ω` 1 / 0.6870 em ⇒ **不是空壳字形**。

### 2-C 布局影响：八页 × 两视口（`shot_fontdrop_ab.py` 双构建对照）

**横向溢出：改前 0 / 改后 0 —— 16 / 16 全 0**（八页 × {1440, 375}）。`docH` 逐值登记：

| page@vw | docH 改前 | docH 改后 | Δ | 横向溢出 |
|---|---|---|---|---|
| home@1440 | 4796 | 4796 | 0 | 0 |
| entrance@1440 | 900 | 900 | 0 | 0 |
| history@1440 | 900 | 900 | 0 | 0 |
| hall@1440 | 900 | 900 | 0 | 0 |
| cast@1440 | 900 | 900 | 0 | 0 |
| turn@1440 | 900 | 900 | 0 | 0 |
| vault@1440 | 900 | 900 | 0 | 0 |
| **about@1440** | 2031 | **1980** | **−51** | 0 |
| home@375 | 4308 | 4308 | 0 | 0 |
| entrance@375 | 900 | 900 | 0 | 0 |
| history@375 | 900 | 900 | 0 | 0 |
| hall@375 | 900 | 900 | 0 | 0 |
| **cast@375** | 1160 | **1159** | **−1** | 0 |
| turn@375 | 1204 | 1204 | 0 | 0 |
| vault@375 | 1736 | 1736 | 0 | 0 |
| **about@375** | 3042 | **3073** | **+31** | 0 |
| **Σ** | | | **−21** | 0 |

**16 个里 13 个逐值相同**，3 个变化**都有行级原因**（`.workbuddy/probe_b13_lines.py` + `probe_b13_boxes.py` 双探针实测）：

1. **`about@1440` −51** = `p.about__tech` **两段各由 3 行折成 2 行**（各 −25.5 = **−51**）。
   机制：换字体后 `1ch` 变宽（15px：**8.328 → 9.000 px**）、中文也变宽 ⇒ **每行容纳字数变多** ⇒
   `「中国工业博物馆的铸造馆，是原沈阳铸造厂翻砂车间的原址。那台十…」` 与 `「本作品要做的事只有一件：把它重新点一次火…」` 各少折一行。
   **`max-width` 未动**（同元素 `p.about__tech` 的宽度恒为 **516.14 → 558.00**，后者是 `max-width:558px` 顶到上限）。
2. **`about@375` +31** = `dd.about__fact-v`「占地 5.3 万 m²，藏品 1.5–3 万余件」**1 行 → 2 行**（**+30.60**，该元素 `line-height:30.60`）。
   机制：该 `dd` 在 375 下宽度只有 **287 px**，`"5.3 万"` 里的点号 U+002E + 三组数字块变宽 ⇒ 超宽，折了一行。
3. **`cast@375` −1** = **亚像素累积**（`main.cast` 1095.63 → 1094.63 → 下传 `.cast__panel` 563.73 → 562.73 → `.cast__score` 36.39 → 35.39）。
   根因：`.cast__steps li` 的 `「① 取样」`等 5 条**各宽 35.5 → 36.9 px（+1.4 px/条）**，加上同类元素上的分数高度累加，再经若干行后**四舍五入成整数 −1 px**。
   **无数值型折行变化**（`.cast__steps` 高度 20.39 不变）。

**`·` 变窄已实测**：`span.about__layer-no.num` 的 `01 · 看见` / `02 · 看懂` / `03 · 参与` / `04 · 带走`
**61.4 → 57.7 px（−6.0%）**，行数不变 ⇒ 第十二批「Noto 把 `·` 排成 1 em」的副作用**确已逆转**（稿 §1.3-3 成立）。

**`1ch` 全表实测**（`1ch` = `"0"` 的 advance；`max-width: Nch` 的换算基准）—— 本批 8 档字号 × 2 字重，全部实测：

| font-size \| weight | 改前 px | 改后 px | × | | font-size \| weight | 改前 px | 改后 px | × |
|---|---|---|---|---|---|---|---|---|---|
| 12 \| 400 | 6.6719 | 7.2031 | ×1.0796 | | 12 \| 700 | 7.0938 | 7.2031 | ×1.0154 |
| 13 \| 400 | 7.2188 | 7.8125 | ×1.0822 | | 13 \| 700 | 7.6719 | 7.8125 | ×1.0183 |
| **15 \| 400** | **8.3281** | **9.0000** | **×1.0807** | | 15 \| 700 | 8.8594 | 9.0000 | ×1.0159 |
| 16 \| 400 | 8.8906 | 9.6094 | ×1.0808 | | 16 \| 700 | 9.4531 | 9.6094 | ×1.0165 |
| 18 \| 400 | 10.0000 | 10.8125 | ×1.0813 | | 18 \| 700 | 10.6250 | 10.8125 | ×1.0176 |
| 28 \| 400 | 15.5469 | 16.8125 | ×1.0814 | | 28 \| 700 | 16.5313 | 16.8125 | ×1.0170 |
| 44 \| 400 | 24.4219 | 26.4063 | ×1.0813 | | 44 \| 700 | 25.9688 | 26.4063 | ×1.0168 |
| 64 \| 400 | 35.5313 | 38.4063 | ×1.0809 | | 64 \| 700 | 37.7656 | 38.4063 | ×1.0170 |

两个可读结论：
- **400 档一律 ×1.08**（数字 0.5210 → 0.6000 em 的直接后果）；
- **700 档只 ×1.016~1.018** —— 因为霞鹜文楷的 **Bold 数字 advance 也是 0.6000 em**（与 Regular 全等），
  而 Noto 可变字体的 700 本来就比 400 宽（0.5210 → 0.5538 em）⇒ 两边**在 700 上收敛**（改后 400 与 700 的 `1ch` **完全相等**）。

### 2-D 字体就位（`document.fonts` + 网络 + 解析族名）

- `document.fonts.size` **1 → 2**；两 face 实测 `['LXGW WenKai|400 500|loaded', 'LXGW WenKai|600 700|loaded']`。
- 网络：`NotoSansSC-*` 请求 **0 条**；`LXGWWenKai-Regular-subset.woff2` 请求 **>0**（对照组，防「字体整个没加载」被当成通过）。
- 页面文本上**解析出的族名真的换了**（`getComputedStyle` 实测）：`Noto Sans SC` → `LXGW WenKai`（八页 × 两视口逐页核）。
- ⚠️ 就绪性**不用 `document.fonts.check()`**（对不存在的族也返回 true，第十六轮的坑）—— 用
  `document.fonts.size` + `status === 'loaded'` + 网络请求 + `getComputedStyle` 解析族名**四重**做凭据。

### 2-E 门禁 `verify_font_drop`（G1 改写后）

`==== FONT-DROP-INTER + CJK-SWAP VERIFY: 3 / 3 PASS ====` · exit **0**（D1 / D2 + 1 条 DOM 组）。

---

## 3. 逐条读数：稿 §4 验收的落实情况

| 稿 §4 条目 | 结果 |
|---|---|
| **4.1** `verify_font_drop` 3/3 PASS | ✅ **3 / 3 PASS · exit 0** |
| **4.1** 跑批 22 份全部重跑 | ✅ 已跑（§5-3）；⚠️ **非零集合新增 2 个成员**（同源，已定性，见「复核后记」/§4-①②） |
| **4.2** 八页 × 两视口横向溢出 16/16 = 0 | ✅ **0 / 0**（16 页全 0） |
| **4.2** `docH` 逐值登记 + 行级原因 | ✅ §2-C（16 值全登记；3 处变化均给到元素级原因） |
| **4.3** `document.fonts` 恰 2 face 且均 loaded | ✅ §2-D |
| **4.3** 网络无任何 `NotoSansSC-*` 请求 | ✅ 0 条 |
| **4.3** 探针自带凭据（query 在 `#` 前 + `landed hash`）+ `fonts.ready` + 两帧 rAF | ✅ `shot_fontdrop_ab.py` 的 `PROBE` 含 `landed_hash` / `credits: true`；量测前 `document.fonts.status==='loaded'` + 两帧 rAF |
| **4.4** 子集覆盖 1,130 / 1,134（或 v1.330 复测值） | ✅ **v1.330 复测 = 1,134 / 1,134，缺字「无」**（被 v1.330 补齐，见 §4-② ） |
| **4.4** `demo/public/fonts/` 恰 3 个文件 | ✅ 3 个 |
| **4.5** 导出海报字形与页面一致；`·` 变窄属预期 | ✅ 同一 `FONT_CN` 栈（Canvas 与 CSS 族名一致）；`·` **61.4 → 57.7 px** |

---

## 4. 对稿的偏离 / 新发现（**七条，都报上来，都没自己糊过去**）

### ① 计划外新红（**同一根因、两个表达**）：`verify_cast:H3` + `verify_ux:P0F3`

见文首「复核后记」。**判据一字未改**，固化新基准等用户过目（§9）。**附注**：`verify_cast` 的 `T7` 打印同源（`:100` 的 `pass` 条件含累加变量 `ok`），
hall 段两次读数完全相同 ⇒ **hall / 展厅三维部分零回归**。

### ② ⭐ 一条「意外之喜」推翻了稿 §1.2 的覆盖率结论（**按稿自己的要求在落地时复测**）

稿在 **v1.250 webfont 分片**（97 段 `unicode-range` 并集）上量到 **1,130 / 1,134**，缺 `Δ θ π ω` 四字，
并据此写了「`Δ` 只出现在 `viewport.js:470` 的 `|Δz| < 0.2`，走雅黑兜底，属预期」。
落地改用 **v1.330 全量 TTF** 逐字复测 ⇒ **1,134 / 1,134，一字不缺**；
四个希腊字母**都有真实轮廓**（轮廓数 2 / 3 / 1 / 1，advance 0.65 / 0.57 / 0.577 / 0.687 em）。
⇒ **`viewport.js:470` 的 `Δ` 不需要系统兜底**，`fonts.css` 头注已按复测值改写。
（`check_lxgw_coverage.py` 复跑仍报 1,130 / 1,134 —— 那是对 **v1.250 分片**量的，**不是**对落地字体量的，两者并存不矛盾。）

### ③ ⚠️ 一条**上游字体缺陷**（本批为落地必须处理，已如实记录）：`cmap` format 4 子表的 `length` 字段溢出

- **现象**：`TTFont(path).getBestCmap()` 与 `pyftsubset` 在 v1.330 的 Regular / Bold 上**必抛**
  `IndexError: array index out of range`（`fontTools/ttLib/tables/_c_m_a_p.py:969`）；
  `lazy=True` / `lazy=False` / `fontNumber=0` **三种读法全挂** ⇒ 不是读法问题。
- **诊断链**（`repair_lxgw_cmap.py`）：
  1. 手解 `cmap` 头，读到 format 4 子表声明 `length = 6694`，而它的真实跨度是 **72,230 B**；
  2. **`72,230 − 65,536 = 6,694` 与实际读到的字段值精确吻合** ⇒ 上游工具做了 `length & 0xFFFF`；
  3. 同子表的 `segCountX2 = 3834`（⇒ segCount = 1917）、`searchRange = 2048`、`entrySelector = 10`、`rangeShift = 1786`
     **四个搜索字段互相自洽** ⇒ **数据完好，只有 `length` 被截断**；
  4. **Bold 的 `cmap` 结构与 Regular 逐字节同构** ⇒ 属**上游字体怪癖**，不是下载损坏（两次独立下载不会同构损坏）。
- **修法（已落地，可复现）**：按**真实长度** 72,230 解出 BMP 映射 → **与 format 12 的 BMP 部分逐项断言相等（34,223 = 34,223）** →
  按「一段连续区间一个 segment、`idRangeOffset` 全 0」**重新编码**一份合法 format 4（1,944 段 / 15,568 B，原 72,230 B）→
  **整张 `cmap` 重排后原地补丁**（新表更小 ⇒ 尾部补零 56,662 B，**总长不变 ⇒ 所有表偏移不变**）+ 回填 `cmap` 目录的校验和（`0x9703C653`）。
  修后 `getBestCmap()` 在两字重上各返回 **36,212 码位**，`pyftsubset` 成功。
- 产物：`.workbuddy/fontwork/raw_repaired/{LXGWWenKai-Regular,LXGWWenKai-Bold}.ttf`（尺寸与上游**逐字节相同**，仅 `cmap` 子表内容 + 补零）。
- 脚本：`.workbuddy/repair_lxgw_cmap.py`（诊断 + 补丁，带 §③1–4 的全部断言）。

### ④ 一条**工具使用**上的偏离（稿未覆盖，但不做就落不了地）：`node_modules` 不能跨盘/跨子树软链

`make_before13.py` 要把 `demo/node_modules` 复用到 scratch 工程里。Python `os.symlink` 产出的链接 **Node 解析失败**（`MODULE_NOT_FOUND`）
⇒ 改用 `cmd /c mklink /J`（**junction**）。⚠️ 该 subprocess 若带 `text=True`，会因 `mklink` 的中文输出触发 `UnicodeDecodeError`（**无害**，退出码 0）。

### ⑤ 偏离（授权文本类，E3）：`OFL-LXGWWenKai.txt` 比稿指定多带**两行版权声明**

稿 §2-E3 说「内容 = 上游 `OFL.txt` 全文 + 文件头一行」。落地为「**3 行自定头 + OFL 全文**」——
多出的两行是 `Copyright 2021-2024 LXGW …` 与 `Copyright 2020 The Klee Project Authors …`（**OFL §2 要求随附**）。
⚠️ 那两行**本来就在上游 OFL 文本第 2–3 行**、且**与子集保留的 name0 逐字一致**，所以这不构成新的许可义务，只是把声明提到显眼处。
文件 **4,556 B / 95 行**（= 3 + 2 + 1 空行 + 上游 91 行）。

### ⑥ 偏离（回写类）：`verify_font_drop.py` 除稿列的 4 处外，另有 **4 处失效的自我描述**

`:2` docstring 仍只写「第十二批『删 Inter』」、`:148` D2 段注释仍只说 Inter、`:160` 的 `control_note` 仍只说 Noto、`:168` 汇总行仍只写 `FONT-DROP-INTER`。
**本批一并就地改写**（合计 8 行、净 0 行）⇒ 门禁自己的说明与它实际断言的东西重新对齐。

### ⑦ 偏离（根 `README.md`）：「`dist/fonts/` 两个文件」已是假话

`README.md:190` / `:283` 还写着旧产物名 `index-Dc2hlaOH.js` / `index-Dnr5PM8C.css` 与「`dist/fonts/` 两个文件」。
按稿 §5（回扫产物名哈希）与「先扫结论句」的要求，**随状态回写一并修掉**（完整回写清单见 §7）。
⚠️ **根 `README.md` 是「带行号引用」的文件 ⇒ 本次回写必须净增 0 行**；唯一的 `+1` 是**文件树里补上本自述的条目**
（`IMPLEMENTATION-FONT-CJK-SWAP.md ← …`，与树里其它 8 份 `IMPLEMENTATION-*` 条目对齐）。
**两端点已一并更新出处**：`README.md:190`（不变）· `README.md:282 → :283`（树条目在此行之前插入 1 行所致），
被更新的两处引用 = 本批归档抬头（`archive/spec/PROMPT-FONT-CJK-SWAP.md:44`）与本自述 §4-⑦ 本行。
`README.md` 行数 **377 → 378**。

---

## 5. 门禁影响（稿 §6 的实测结果）

### 5-1 必改的门禁：**只有 `verify_font_drop.py`**（8 行、净 0 行，§1-⑨）

### 5-2 出稿前工具（**不是回归**）

`check_font_swap_prompt.py` 出稿时 **34 / 34 PASS · exit=0**；**落地后必红 = 使命终结**（红线 7）⇒ **本批不修不跑**。
`check_font_drop_prompt.py`（第十二批封版）/ `check_p1_456_prompt.py` / `check_font_selfhost_prompt.py` 同 —— **不修不跑**。

### 5-3 全量跑批实测（`run_all_verify.py b13`，**22 份**，串行）

```
绿 16 份 · 非零 6 份 = [verify_cast, verify_cdp, verify_p12, verify_step4a_edge, verify_turn, verify_ux]
```

| # | 门禁 | exit | 读数 | 分类 |
|---|---|---|---|---|
| 1 | `verify_archive_b3` | 0 | spec/ **31** 份 · archive/spec/ **29** 份（⛔ **本行初稿曾记「28 份」，是错的**；已按**改后复跑**值改正 —— 与 #3 的 ②/③ 一致） | 绿 |
| 2 | `verify_archive_b4` | 0 | 归档计数一致 | 绿 |
| 3 | `verify_archive_b5` | 0 | ①d 已消解提及 13 处 · ②/③/④ 全绿 | 绿 |
| 4 | `verify_font_drop` | 0 | **3 / 3 PASS** | 绿（**本批专项**） |
| 5 | `verify_p1_456` | 0 | **12 / 12 PASS** | 绿 |
| 6 | `verify_vault` | 0 | **41 / 41 PASS** | 绿 |
| 7 | `verify_p0` | 0 | 全部 PASS | 绿 |
| 8 | `verify_w1` | 0 | H 组（HEADER-NAV）**3 / 3 PASS** | 绿 |
| 9 | `verify_w2` | 0 | 入口三维 G 组；内部 `G3.embers pass:false` 与第十二批**同值** | 绿（**内部既有红，非本批**） |
| 10 | `verify_w3` | 0 | `P8.gzip 205,775`（limit 194,560，`ok:false` 与第十二批**同状态**，只换产物名与 +7 B） | 绿（**内部既有红，非本批**） |
| 11 | `verify_history_cta` | 0 | C1 旧串残留 **0** · C3 长滚 8 节点全对 · C4 三页全过 | 绿 |
| 12 | `verify_hotspots` | 0 | 热点卡/CTA 全对 · CONSOLE CLEAN | 绿 |
| 13 | `verify_step4` | 0 | 全过 | 绿 |
| 14 | `verify_step4a` | 0 | 全过 | 绿 |
| 15 | `verify_step4c` | 0 | 全过 | 绿 |
| 16 | `verify_step4c_e5` | 0 | E5 亮度分层 4 区全 `pass:true` · `gap_1_4 = 188.7` | 绿 |
| 17 | `verify_cast` | **1** | `H3 FAIL firstLeft=1111`（应 1118.5）· `T7` 同源 | 🔴 **新增 · 字体度量副产品**（§4-①） |
| 18 | `verify_ux` | **1** | `46 / 47 PASS`，唯一红 = `P0F3 … firstLeft:1111` | 🔴 **新增 · 与 #17 同源同量** |
| 19 | `verify_turn` | 1 | `43 / 44 PASS`，唯一红 = `K13b`（D1 体积，缺口 2.38 KiB） | 🟡 **既有红（D1，非本批）** |
| 20 | `verify_p12` | 1 | `TypeError: 'NoneType' is not iterable`（`verify_p12.py:116`，P2 页顶读不到） | 🟡 **既有红（脚本崩溃，非本批）** |
| 21 | `verify_cdp` | 2 | 无参调用 ⇒ 打印用法（CLI 工具，非断言） | 🟡 **既有（调用方式，非回归）** |
| 22 | `verify_step4a_edge` | 2 | `E5′` 门厅边缘亮度：20 点中 11 点 <20/255（`min 6.2`），`allPass:false` | 🟡 **既有红（门厅三维光照，与字体无关）** |

**分类结论**：
- **字体归属的新红 = 1 个量**（`firstLeft`），**两处表达**（#17 `H3`、#18 `P0F3`）+ 1 处**同源连带打印**（#17 的 `T7`）。
- 其余 4 份非零（#19–#22）与第十二批**完全同一组**，**成因均与字体无关**（D1 体积 / 脚本崩溃 / CLI 无参 / 三维光照）。
- **绿 16 份中有 2 份带「内部既有红」**（#9 `G3.embers`、#10 `P8.gzip`）—— 已与第十二批逐项对照确认**同状态**，**不是本批引入**。

**文档回写后的复跑（补记）**：本批回写动了 `verify_archive_b5.py` / `README.md` / `PROJECT-BRIEF.md` / `archive/README.md` ⇒
**#1–#3 三份归档门禁在回写完成后重新跑过一遍，3/3 `exit 0`**（`b5` 的 ④「结论句残留」= **无**；③ 计数 `spec/ 31 份（提示词 0）· archive/spec/ 29 份（提示词 25）· 归档项总数 31`）。
`verify_hotspots`（#12）**未重跑** —— 它只读 `dist` 产物与 `localhost:4173`，回写全在文档层，**输入未变**。

---

## 6. 稿 §7「出门自检」逐条（5 条）

| # | 稿 §7 要求 | 实测 |
|---|---|---|
| 1 | `Noto Sans SC` 全仓：`demo/` 下 0 处；`verify_*.py` 除 `verify_archive_b5.py` 外 0 处 | ✅ `demo/` **0 处**；`verify_*.py` 命中仅 `verify_archive_b5.py:13`（归档审计的**历史批次描述**，只读、不改） |
| 2 | `NotoSansSC` 同上；`demo/public/fonts/` 无残留文件 | ✅ `demo/` **0 处**；`demo/public/fonts/` 只剩 3 个新文件 |
| 3 | `LXGW WenKai` 命中位置 | ✅ `fonts.css ×2`、`tokens.css ×2`、`poster.js:19`、`emblem.js:40`、`demo/README.md:35`、`verify_font_drop.py ×3` |
| 4 | `scan_dead_selectors` = 0、`scan_orphan_comments` = 0 | ✅ 新 `fonts.css` 的注释只提**真实存在**的路径（`public/fonts/…`）与**真实存在**的选择器引用（`tokens.css` / `poster.js:19` / `emblem.js:40` / `viewport.js:470` / `base.css`） |
| 5 | 稿 §1.1 行号表在动手前再对一次（回扫 `:N` / `LN` /「第 N 行」三种写法） | ✅ 逐条回核**全部成立**；且已确认 `spec/IMPLEMENTATION-FONT-SELFHOST.md` / `IMPLEMENTATION-FONT-DROP-INTER.md` 引的 `tokens.css:32/:34/:36-38` 是**历史记录，不动** |

> **净增 0 行自证**：本机**无 git**（`fatal: not a git repository`）⇒ 无法 `git diff`。改用「`before13/` scratch 工程逐字节 `diff` + `wc -l`」：
> `tokens.css` 63→63 · `base.css` 117→117 · `poster.js` 154→154 · `emblem.js` 272→272 · `README.md` 153→153 · `verify_font_drop.py` 180→180，
> 逐文件 `diff` 的变更行数 = **8 / 2 / 2 / 2 / 0 / 8**（均为「N 行换 N 行」）。
> 唯一行数变化的是 `fonts.css`（**28 → 35**，稿要求「**整份重写**」，且 35 与稿 §2-E4 模板的 35 行**完全一致**）。

---

## 7. 落地后的回写清单（稿 §8 九条 + 稿未覆盖的失效声明）

| # | 稿 §8 条目 | 状态 |
|---|---|---|
| 1 | `spec/IMPLEMENTATION-FONT-CJK-SWAP.md`（十节） | ✅ **本文件** |
| 2 | 本稿整份移入 `archive/spec/`（移动不删、正文原样） | ✅ `.workbuddy/archive_font_swap.py`（断言：首行不变 + 抬头块之外**逐字节相同** + 章标题数不变）。归档时 **26,549 B**；同日清尾账时抬头又补两条（`check_font_swap_prompt.py` 封版 / 两处已作废活声明）⇒ **27,279 B / 373 行**，**正文仍未改**，插入点选在 `:44` 之后故该引用未漂移 |
| 3 | `.workbuddy/memory/MEMORY.md`：可发提示词数 / 产物名 / 字体段 Noto→LXGW / `demo/public/fonts/` 3 个文件 | ✅ 已回写 |
| 4 | `.workbuddy/memory/PLAYBOOK.md`：批次史补第十三批；新增 **§4.8b** 四条实务；工具索引**新增 5 行 + 改 3 行** | ✅ 已回写（**883 → 917 行**：批次史第十三批段 · §4.8b「静态双字重 / `1ch` 是字体依赖量 / 右锚定容器的几何量是导出量 / cmap format 4 `length` 溢出」· §9 新增「候选对照图 / 候选离线核查 / 子集化+cmap 修复 / 改前基线工程 / 两构建对照采样」5 行，并给「归档移动」加 `archive_font_swap.py`、给「新批次门禁」加 `verify_font_drop.py` **4 处行号**警示、给「提示词核查」加 `check_font_swap_prompt.py` ⛔ 封版注） |
| 4b | ⛔ `check_font_swap_prompt.py` 本身补封版抬头 + 修两个实战坑 | ✅ 已改（**出稿期 34 绿 / 0 红 → 落地后 17 绿 / 17 红**封版。两个坑：① `PROMPT` 路径改「`spec/` 有就用、没有就用 `archive/spec/`」；② `E4_old_subset_size` 对**已删除**的 `NotoSansSC-subset.woff2` 裸调 `os.path.getsize` ⇒ `FileNotFoundError`，已改「缺文件记红」。**这是首次复跑才暴露的** —— 封版脚本必须真跑一遍） |
| 5 | `.workbuddy/memory/` 当日日志追记落地轮 | ✅ 已追记 —— 新建 **`2026-09-25.md`**（落地发生在 09-25 凌晨，故另起当日文件，未回改 09-24 的收尾段）：九节 = 落地 8 条编辑 / 产物与体积口径 / **cmap 溢出完整诊断与修复** / **两条新红的测量级定性** / 折行溢出全量复核 / 22 份跑批 / 回写清单 / 取证教训 / 状态待办 |
| 6 | `README.md` / `spec/PROJECT-BRIEF.md`：凡声称「字体 Noto Sans SC / 自托管可变」处回写（**先扫结论句**） | ✅ 已回写（见下行「稿未覆盖」） |
| 7 | `design/README.md` **不用动** | ✅ 未动（第十五轮已核：画稿对字体沉默） |
| 8 | 回扫待发资产里的产物名哈希 | ✅ 已回扫（§4-⑦） |
| 9 | 跑批结果表贴进自述 | ✅ §5-3（22 行表） |

**稿未覆盖、但本批必须一并回写的失效声明**（红线 1「扫结论句，不只扫文件名」）：

- 根 `README.md`（**377 → 378 行**）：`:73-76` 的「可发 = 1 份」结论句 → 0 份、`:151-153` 批次表（**加第十三批行**）、`:156-158`、
  `:164` 的「现只剩 1 个字体文件」（已是假话）、`:166-169` 待裁定（D1 措辞去「评委硬线」+ 加第十三批两条）、
  **`:190` / `:283` 的旧产物名与「`dist/fonts/` 两个文件」**、`:250` 目录树新增一条本自述登记。
  - ⚠️ **另清掉 3 处「评委硬线」活引**：`:102` / `:104` / `:233` 过去把 198.57 KiB 直呼「评委硬线」（且读数是第九批旧值 **205,796 B**）
    ⇒ 改为否定式「**D1 判据** · 该线来源待证，**不许称「评委硬线」**」，读数更新为 **200.95 KiB / 205,775 B，差 2.38 KiB**；**行数 378 未动**。
    仓库里其余旧称都在 `spec/IMPLEMENTATION-*.md` / `archive/**` 的**历史叙述**里，按规矩不动。
- `spec/PROJECT-BRIEF.md`（**294 → 294 行，净 0**）：`:63-68` 的字体段落（第十二批段内联第十三批）· `:89` D1 措辞 · `:91` 「换哪款中文字体 → 已裁定」· `:93` （「别漏 `dist/fonts/` 的 **3 个文件**」）· `:75-76` 开张条件（补 ④⑤、划掉旧的 ③）。
  ⚠️ **该文件被按行号引用**（`archive/spec/PROMPT-FONT-DROP-INTER.md:42-43` 引 `:97`、`spec/IMPLEMENTATION-FONT-DROP-INTER.md:418` 引 `:91/:97`）⇒ **全部改动均为等行数替换**，`:89/:91/:97` 端点已复核未漂移。
- `archive/README.md`（**427 → 452 行**，**+25**）：批次清单 · **新增 `### 第十三批 · 2026-09-25（1 项）` 段**（含计数「十三批累计 **25 份** / 归档项总数 **31**」+ 归档表一行）· `:380` 的「该来翻这里」行（可发 0 份 → 第十三批；**同类结论句第十五次修正**）· 恢复方式段加第十三批回改清单 · **新增后记十六** · 页脚日期加 2026-09-25。
  ⚠️ **插入点必须落在 `:210` 之后** —— `spec/IMPLEMENTATION-FONT-DROP-INTER.md:424` 引用了 `archive/README.md:210`（第十批表格行）⇒ 已插在第十二批段之后（原 `:245`），**`:210` 未漂移**；唯一被漂移的是 `:362 → :380` 的引用，**只有本自述一处、已同步更新**。
- `.workbuddy/verify_archive_b5.py`（**148 → 151 行**）：批次清单 **+1 行**（第十三批）· 「当前答案」块改 **第十三批 / 25 份 / 31**、并补开张条件 ④⑤（该块 **4 → 5 行**）· `NAMES` **8 → 9**（追加 `PROMPT-FONT-CJK-SWAP`，**+1 行**）· `EXCUSE` 正则补「第十三批」（同行内）。复跑 **exit 0**：①未消解引用「无」· ②文件位置/抬头 ⛔ 全对 · ③计数 **spec/ 31 份（提示词 0）· archive/spec/ 29 份（提示词 25）· 归档项总数 31** · ④结论句残留「无」。
- `spec/AESTHETIC-AUDIT.md`（**净 0 行，462 行**）：`:455` 的「数字与拉丁改走 **Noto Sans SC**」是**此刻已作废**的陈述 ⇒ 就地加第十三批说明（静态双字重 / 覆盖 **1,134 · 1,134** / `demo/public/fonts/` **2 → 3 个 473,876 B** + 自述链接）；`:459` 的「截至 2026-09-24（此刻）待实现 = 0 份」⇒ 改 **2026-09-25 · 第十三批落地并归档后**、批次清单补 `PROMPT-FONT-CJK-SWAP`。
  ⚠️ `archive/spec/PROMPT-FONT-SELFHOST.md:16-18` · `archive/spec/PROMPT-P1-4-6.md:20-24` · `archive/spec/PROMPT-FONT-DROP-INTER.md:29` · `spec/STEP1-IMPLEMENTATION-SPEC.md:71/:129` —— **候选回写点，逐条判为「历史叙述」⇒ 不动**（归档件本身就是历史件）。

---

## 8. 改动文件清单（重打包时照这个搬）

**新增 / 替换（3）**
- `demo/public/fonts/LXGWWenKai-Regular-subset.woff2`（235,944 B）
- `demo/public/fonts/LXGWWenKai-Bold-subset.woff2`（233,376 B）
- `demo/public/fonts/OFL-LXGWWenKai.txt`（4,556 B）

**删除（2）**
- `demo/public/fonts/NotoSansSC-subset.woff2`（282,432 B）
- `demo/public/fonts/OFL-NotoSansSC.txt`（4,388 B）

**源文件（7）**
- `demo/src/styles/fonts.css`（28 → **35** 行 · 重写）· `demo/src/styles/tokens.css`（净 0）· `demo/src/styles/base.css`（净 0）
- `demo/src/js/ui/poster.js`（净 0）· `demo/src/js/ui/emblem.js`（净 0）
- `demo/README.md`（净 0）
- `.workbuddy/verify_font_drop.py`（净 0 · 8 行）

**构建产物（2，名字已变）**
- `demo/dist/assets/index-DxzSVEyG.js`（704,430 B）· `demo/dist/assets/index-CigWfXV7.css`（36,455 B）
- ⇒ 旧名 `index-Dc2hlaOH.js` / `index-Dnr5PM8C.css` 在**待发资产**里的引用必须同步（§7）

**工装（本轮新建，`.workbuddy/`）**
`measure_lxgw1330.py`（绕开损坏的 format 4、手工解 format 12 量覆盖与 advance）·
`repair_lxgw_cmap.py`（format 4 `length` 溢出诊断 + 就地补丁）·
`make_before13.py`（复刻改前 scratch 工程 → `.workbuddy/before13/`）·
`probe_cast_steps.py`（`.cast__steps` 几何对照，本轮为定性新红而建）·
`probe_b13_lines.py` / `probe_b13_boxes.py`（行盒 / 容器盒 + `1ch`）·
`archive_font_swap.py`（归档）· `_b13_caststeps.sh` / `_b13_shots.sh` / `_b13_lines.sh` / `_b13_boxes.sh` / `_b13_verify.sh`（一条命令内「起 preview → 采样/跑批 → 收 preview」）
（另有**裁定轮 / 出稿轮**留下的：`make_cjk_cand_page.py` · `probe_cjk_cand.py` · `wire_lxgw.py` · `font_scan.py` ·
`fetch_full_fonts.py` · `fetch_cand_fonts.py` · `fetch_cand_by_charset.py` · `probe_site_font_ref.py` ·
`check_lxgw_coverage.py` · `measure_lxgw_digits.py` · `subset_lxgw1330.py` · `check_font_swap_prompt.py`（⛔ 已封版）·
诊断残留 `_t_cmap*.py`；分组索引见 `PLAYBOOK.md §9`）

---

## 9. 不在本批 / 待裁定

**本批不含**（稿 §9 原样）
- `release/dist` 重打包（另立一轮；⚠️ `demo/` 无 `vite.config.js` ⇒ 产物是**绝对路径**，须改 `./assets/` 与 `url(../fonts/…)`，**不要** `base:'./'` 重建）。
- 作品描述 PDF、视频分镜、部署。
- 中黑层补救（**方案 B：新增 Medium 第三字重**）。
- D1 体积（等官方文件，**不许碰**，也不许用「评委硬线」这个说法）。
- `.latin` 半死选择器清理、`tokens.css` 头注例外说明等 P1-4-6 交回项。
- 候选清单里其他字体的任何尝试（马善政 / 站酷系等仅作过对照）。

**本批新产生的待裁定（1 条）**
- **`verify_cast:H3` / `verify_ux:P0F3` 的 `firstLeft` 基准**：现判据把第十二批的字体度量副产品 **1118.5** 硬编码成常量。
  实测已定性为「文字度量变了」（右边缘 1376.00 两构建逐位相同；位移 = Σ 文本宽增量）。
  ⇒ 等用户过目后择一固化：**(a)** 只把常量改成 `1111`；**(b)** 改写成**不随字体漂移**的判据
  （如「`.cast__steps` 右边缘 == 1376 且横向溢出 == 0 且高度 == 20.39」）。**本批一个字都没改。**

**顺带重申（非本批新增）**
- **`verify_p12` 是脚本崩溃**（`verify_p12.py:116` 对 `None` 做 `in`）—— 第十二批同款红，属**取证脚本自身缺陷**，按红线 6「验收结论不对先怀疑取证方式」应另立一轮修脚本、**不许**当成本批回归。
- **`verify_step4a_edge`（E5′ 门厅光照）** 与 **`verify_w2: G3.embers`** 是**三维场景**判据，字体不影响；两者与第十二批逐项同值。

---

## 10. 用户在验收时会看到什么（**先说清楚，免得当成事故**）

1. **全站字形从黑体变成楷体手写感** —— 气质从「现代工业面板」转向「档案 / 文献 / 手写温度」，全站生效（正文也换）。
2. **大标题不变粗**：H1–H4 原本就是 700 ⇒ 仍是 Bold，层级保留。
3. **原来 500（中黑）的地方变细**：导航药丸、工牌小标签、账本 cap、衍生按钮等**约 13 处** —— 静态字重没有中黑，**属物理结果**（方案 B 可补，本批不做）。
4. **原来 600 的地方变粗**：主按钮、当前步骤、fact 值等**约 14 处**，由半粗变全粗。
5. **数字读数仍对齐**：10 个数字天然等宽（0.6 em），账本 / 评分不乱；但数字与拉丁整体**比原来宽 ~8%**（`1ch` 400 档 ×1.08），`C620-1`、`22 × 11.5 m`、`净重 50 t` 会更长。
6. **`·` 变窄**：`炉火不灭 · 2026`、`01 · 看见` 等含间隔点的行**变短**（第十二批把它们撑宽的副作用被撤销）—— 实测 `01 · 看见` **61.4 → 57.7 px**。
7. **`Δ` 不再混排**：`|Δz| < 0.2` 的 `Δ` 现在也来自霞鹜文楷本体（v1.330 已补），**不再是微软雅黑兜底** —— 比稿预告的更好。
8. **一处「越换越紧」**：`#/about` 桌面端两段技术文案**各少折一行**（页高 2031 → 1980）；`#/about` 手机端「占地 5.3 万 m²，藏品 1.5–3 万余件」**多折一行**（页高 3042 → 3073）。均为字体度量变化，无溢出、无裁切。
9. **浇铸页右上步骤药丸条整体左伸 7.5 px**（右边缘不动、文字变宽所致）—— **两份门禁会因此报红**（`verify_cast:H3` / `verify_ux:P0F3`，同一根因），已定性、判据未改，等你裁定基准（§9）。
10. **15px 正文的手写楷体**：可读性略低于黑体（你已在对照图上确认接受）。
