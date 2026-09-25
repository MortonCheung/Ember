# 交付自述 · P1-4 / P1-5 / P1-6：圆角收档 / 字号收档 / 显示字距

> **依据**：[`archive/spec/PROMPT-P1-4-6.md`](../archive/spec/PROMPT-P1-4-6.md)（原 `spec/PROMPT-P1-4-6.md`，第十一批）
> **落地日期**：2026-09-24 晚 · 第十一批
> **性质**：**纯 CSS 改动**（`demo/src/**` 的 JS 一行未动 —— 已扫：JS 里 `border-radius / font-size / letter-spacing` **0 次**）
> **稿 §8 末尾六项交付自述要求**：见 §1 / §2 / §3 / §4 / §5 / §6

---

## 0. 一句话

**圆角 11 档 → 5 档**（`--r-xs/sm/md/lg/pill` = 2/4/6/8/999，共 49 处全部改成 token 引用）·
**字号 19 档 → 7 档**（`11/12/15/18/28/44/64`，98 处重分布 + 1 处新增）·
**显示字距 5 档 → 3 档**（`.08em / .02em / -.02em`，全站 0 个 `px` 字面量）；
顺手删掉死 token `--fs-h1`（3 处声明、0 处消费）与反单调断点覆盖（`46 > 44`）。

**两处必改门禁已改，且都只是「锁定值跟着设计走」**（§1.4）。全量跑批**第 3 处转红 = 0**（§8）。

---

## 1. 改动清单

### 1.1 三个 CSS 文件，共 **56 条**编辑（脚本化，带边界断言）

落地手段：`.workbuddy/apply_p1_456.py` —— 每条编辑先断言「目标行含预期原文且**恰好一次**」，
任一断言失败**整批不写盘**；编辑按**行号降序**执行（不顶走行号）；收尾再做档位分布对账。原始报告：`.workbuddy/shots/p146_apply_report.txt`。

| 文件 | 编辑数 | 内容 |
|---|---|---|
| `tokens.css` | 3 | 删 `--radius: 12px`（1 行）→ 加 **5 个** `--r-*`（5 行）· `--fs-display` 由 `clamp(36px,3.4vw,58px)` 改**固定 `44px`** · **删** `--fs-h1: 44px` · **加** `--fs-readout: 64px` |
| `base.css` | 4 | `.btn` 圆角 → `var(--r-lg)` · `.chip` 圆角 → `var(--r-pill)` · `.eyebrow::before` 圆角 `1px` → `var(--r-xs)`（**只改值，不动 3×12 的尺寸与形状**，§2.4-1）· **新增** `input, select, textarea { font: inherit; }` |
| `layout.css` | 49 | 圆角 **37 处**值替换（含 10 处 `var(--radius)` → `var(--r-lg)`）· 字号 **20 处** · 断点 `:root` 2 处 · 字距 2 处 + 新增 1 处 · `.about__section h2` 补字号 1 处 |

### 1.2 `tokens.css` 改前 / 改后全文（稿 §8-① 要求）

```css
/* 改前 :25 */
  --radius: 12px;

/* 改后 :25-29 */
  --r-xs:   2px;   /* 发丝：进度轨/填充、1~3px 元素、栅格点、账本小竖条 */
  --r-sm:   4px;   /* 极小标记：品牌标记、录制徽标 */
  --r-md:   6px;   /* 小控件：返回键、注记、小按钮、图鉴格 */
  --r-lg:   8px;   /* 容器与主控件：按钮、卡片、面板、舞台、屏幕框 */
  --r-pill: 999px; /* 药丸 */

/* 改前 :36-37 */
  --fs-display: clamp(36px, 3.4vw, 58px);  /* 64px 在 52% 左栏排不下两行，与设计方确认后用 clamp */
  --fs-h1:      44px;

/* 改后 :32-34（净增 1 行：clamp 行变 2 行、--fs-h1 行删除） */
  --fs-display: 44px;   /* P1-5：clamp 删除 → 固定 44（画稿两种量法 44.9~46.3，把 44 包在下沿） */
  --fs-readout: 64px;   /* P1-5 新增：读数大数字（.cast__score-num）；画稿 S03「72」实测 ≈64.6 */
  --fs-h2:      28px;
```

> ⚠️ `tokens.css` 头部那句 `规则：实现方不要改这里的值` **本批未改**（越界）；但本批确实改了 ——
> 依据是稿 §1.2 的**画稿像素实测**（圆角全落在 4/6/8；`10/12/14` 画稿上一处都没有）。
> 若认为那句注释需要加例外说明，请下一轮一并处理。

### 1.3 三个「不是设计出来的值」各给了一条最小改动

| 值 | 位置 | 改法 | 落地读数 |
|---|---|---|---|
| **22.5px** | 关于页 4 个 `.about__section > h2` | `layout.css:1604` 补 `font-size: var(--fs-h2);`（**原 `margin-bottom` 一字未动**） | **28px**（`S4`） |
| **13.3333px** | `#/turn` 两个滑杆 `<input type="range">` | `base.css` 的 `button { font: inherit; … }` **旁边补一条** `input, select, textarea { font: inherit; }` | **15px**（`S5`） |
| **48.96px** | `.hero h1` / `.ledger__h` 的 `clamp` | 两个 `clamp` 都改 `44px`（转 `--fs-display`） | **44px**（`S3`） |

### 1.4 ★ 稿 §6.1 点名的**两处必改门禁**（改的是哪两行、为什么）

| # | 文件:行 | 改前 | 改后 | 为什么 |
|---|---|---|---|---|
| ① | `.workbuddy/verify_w1.py:366` | `_marks[0]["r"] == "6px"` | **`== "4px"`** | `H4_brand_mark_unified` 锁的品牌标记圆角。按稿 §1.2 画稿像素实测 **3.6**（§2.3 归到 `--r-sm` = 4），**6 是照代码留下来的值**。该断言的 `w==26 / h==26 / bg==IRON` 三项**一字未动** |
| ② | `.workbuddy/verify_vault.py:223` | `v7["font_size"] == "34px"` | **`== "28px"`** | `.vault__name--input` 按稿 §3.3 的「野值归最近档」从 `34` 归到 `--fs-h2`(28)。`V7_name_edit` 的其它条件（`maxlength==8`、超长截断、空串不写、Esc 取消、trim）**一项未动** |

**判定依据（这是本批最容易做错的地方）**：稿末尾要求「**先跑 §8-1/§8-2 再动 §6.1 的两行**」。
已照做 —— 改锁定值**之前**先跑了一遍，结果**恰好只有这两条红**：

```
verify_w1      [FAIL] H4_brand_mark_unified {…"r": "4px"…}          ← 只 H4 一条，H 组 2/3
verify_vault    40 / 41 PASS · FAIL: V7_name_edit {…"font_size": "28px"…}
verify_ux       47 / 47 PASS                                        ← 无回归
verify_cast     E9 / H3 / T7 PASS · firstLeft = 1118.5（零容差未动）
verify_turn     43 / 44（唯一红 = 既有 D1 K13b）
verify_step4c   全节 PASS（E 组 / H6 / hall 61/61 / cast 45/45 / console []）
```

⇒ **第 3 处转红 = 0**，所以两行锁定值按稿改掉；改后 `verify_w1` H 组 **3/3**、`verify_vault` **41/41**。
**本批没有为了让哪条过而放宽容差**（红线）。

---

## 2. §2.5 / §3.5 / §4.3 的验收读数（原始输出）

```
   [PASS] R1_radius_tokens_five          {"decl": {"--r-xs": 1, "--r-sm": 1, "--r-md": 1, "--r-lg": 1, "--r-pill": 1}, "radius_refs": 0}
   [PASS] S2_no_dead_fs_h1               {"hits": 0}
   [PASS] L1_letter_spacing_no_px        {"px_decls": []}
   /            nEl=1164 rad=0px,2px,4px,8px                        fs=11px,12px,15px,18px,44px
   #/entrance   nEl=32   rad=0px,4px,50%,6px,8px,999px              fs=11px,12px,15px,18px,28px
   #/history    nEl=75   rad=0px,4px,50%,6px,8px,999px              fs=11px,12px,15px,18px,44px
   #/hall       nEl=33   rad=0px,4px,50%,6px,8px,999px              fs=11px,12px,15px,18px,28px
   #/cast       nEl=61   rad=0px,2px,4px,6px,8px,999px              fs=11px,12px,15px,18px,28px,64px
   #/turn       nEl=45   rad=0px,2px,4px,50%,6px,8px                fs=11px,12px,15px,18px,44px
   #/vault      nEl=200  rad=0px,6px,8px                            fs=11px,12px,15px,18px,28px
   #/about      nEl=74   rad=0px,4px,8px                            fs=11px,12px,15px,18px,28px,44px
   [PASS] R2_radius_values_in_ladder     {"union": ["0px","2px","4px","50%","6px","8px","999px"], "out_of_ladder": [], "banned": []}
   [PASS] S1_font_ladder_seven           {"union": ["11px","12px","15px","18px","28px","44px","64px"], "out_of_ladder": []}
   [PASS] L1b_runtime_no_integer_px_tracking {"union": ["-0.88px","0.36px","0.96px","normal"], "integer_px": []}
   [PASS] R3_mark_is_4                   {"readout": {"logo__mark": "4px", "turn__mark": "4px"}, "sizes": {"logo__mark": [26, 26], "turn__mark": [26, 26]}}
   [PASS] R4_container_is_8              {"readout": {"/ · .btn": "8px", "#/hall · .exhibit-card": "8px", "#/vault · .vault__card": "8px", "#/turn · .turn__panel": "8px", "#/cast · .cast__panel": "8px"}}
   [PASS] S3_display_is_44               {"readout": {"fs": "44px", "r": "0px", "ls": "-0.88px", "w": 639.2, "h": 98.5, "sel": ".hero h1"}}
   [PASS] S4_about_h2_is_28              {"readout": {"fs": "28px", "r": "0px", "ls": "normal", "w": 1312, "h": 33.6, "sel": ".about__section > h2"}}
   [PASS] S5_range_input_inherits        {"readout": {"fs": "15px", "r": "2px", "ls": "normal", "w": 313, "h": 6, "sel": "input[type=\"range\"]"}}
   [PASS] L2_display_tracking            {"readout": {"hero h1": "-0.88px", "history__title": "-0.88px", "ledger__h": "-0.88px"}}
```

**逐条对稿**：

| 稿的断言 | 期望 | 实测 | |
|---|---|---|---|
| `R1` 五个 token 各 1 处 / `--radius` 0 处 | 5 / 0 / 0 | 5 / 0 / 0 | ✅ |
| `R2` 圆角去重 ⊆ `{0,2,4,6,8,999,50%}`，`10/12/14` 必须 0 | 越界 0 | 越界 **0**，`banned=[]` | ✅ |
| `R3` `.logo__mark` / `.turn__mark` = `4px` | 4px | 4px / 4px（且仍 26×26） | ✅ |
| `R4` `.btn`/`.exhibit-card`/`.vault__card`/`.turn__panel`/`.cast__panel` = 8px | 8px | 5/5 = 8px | ✅ |
| `S1` 字号去重 ⊆ 7 档（排除 SVG 文本） | 越界 0 | 越界 **0** | ✅ |
| `S2` `--fs-h1` 0 处 | 0 | **0**（全 `demo/src`） | ✅ |
| `S3` `.hero h1` = 44px（不是 48.96） | 44px | **44px** | ✅ |
| `S4` `.about__section > h2` = 28px（不是 22.5） | 28px | **28px** | ✅ |
| `S5` range `fontSize != 13.3333px` | 15px | **15px** | ✅ |
| `L1` 字距无 `px` | 0 个 | 声明侧 **0**；运行时候选集 `{normal, 0.36px, 0.96px, -0.88px}`（**全为 em 派生值**，无整数 px） | ✅（见 §7-②） |
| `L2` display 三处字距 ≈ `-0.88px` | −0.88px | 三处全 **−0.88px** | ✅ |

**收档后分布逐档对账**（脚本自检，`.workbuddy/apply_p1_456.py`）：

```
  [OK ] `var(--radius)` 残留 = 0             实测 0
  [OK ] `--fs-h1` 残留 = 0                   实测 0
  [OK ] `tokens.css` 里 `--radius:` 声明 = 0  实测 0
  [OK ] 圆角 --r-xs = 8 · --r-sm = 3 · --r-md = 5 · --r-lg = 19 · --r-pill = 5 · 50% = 7 · inherit = 2
  [OK ] 圆角声明总数 = 49
  [OK ] 字号 --fs-micro = 32 · --fs-caption = 32 · --fs-body = 10 · --fs-h3 = 11 · --fs-h2 = 8 · --fs-display = 5 · --fs-readout = 1
  [OK ] 字号声明总数 = 99（98 + §3.4 新增 1）
  [OK ] 圆角越界档位 = 0 · 字号越界档位 = 0
```

> ⚠️ 稿 §3.3 写「`28px` **7 处**」，落地实测 **8 处** —— 差的 1 处是 §3.4 给
> `.about__section h2` **新增**的声明（原规则只有 `margin-bottom`，字号一直走 UA 的 1.5em）。
> 所以字号声明总数是 **99 = 98 + 1**，**不是稿的 98**。这是「稿把新增项算漏了」，不是回归。

---

## 3. 新增 11 条断言（+1 条补充）与结果

**新建** `.workbuddy/verify_p1_456.py`（稿 §6.3 要求：不塞进既有 20 份 —— 它们各自有"条数"口径）。
**12 / 12 PASS**，其中 `L1b` 是补充项（见 §7-②）。产物 `.workbuddy/shots/p146_verify.json`。

| id | 断言 | 结果 |
|---|---|---|
| `R1_radius_tokens_five` | 五个 `--r-*` 各 1 处；`--radius` 0 处 | PASS |
| `R2_radius_values_in_ladder` | 八页并集去重后 ⊆ `{0,2,4,6,8,999px,50%}`；`10/12/14` 必须 0 | PASS（越界 0） |
| `R3_mark_is_4` | `.logo__mark` / `.turn__mark` = 4px | PASS |
| `R4_container_is_8` | 五个容器 = 8px | PASS |
| `S1_font_ladder_seven` | 八页并集去重后 ⊆ 7 档（**排除 SVG 命名空间节点**，稿 §3.5 的陷阱） | PASS（越界 0） |
| `S2_no_dead_fs_h1` | `--fs-h1` 全 `demo/src` 0 处 | PASS |
| `S3_display_is_44` | `.hero h1` = 44px | PASS |
| `S4_about_h2_is_28` | `.about__section > h2` = 28px | PASS |
| `S5_range_input_inherits` | range 不吃 UA 的 13.3333px | PASS（15px） |
| `L1_letter_spacing_no_px` | **声明侧**字距 0 个 px 字面量 | PASS |
| `L1b_runtime_no_integer_px_tracking` | **运行时**没有整数 px 字距（旧 `2px` 的探针） | PASS（补充项） |
| `L2_display_tracking` | display 三处 ≈ −0.88px | PASS |

> ⚠️ `L1` 按稿的字面写法（"运行时 `letterSpacing` 没有 `px` 结尾"）**不可能成立** ——
> `.08em` 在 12px 上解析成 `0.96px`，本来就以 px 结尾。已在 §7-② 记为**判据本身的错**并给出替代实现（**不改判据糊过去，是修一条写错的判据**）。

---

## 4. 新产物与体积（与稿 §7 对账）

| 产物 | 改前 | 改后 | 对账 |
|---|---|---|---|
| JS | `index-aA-vVRY_.js` raw 704,489 / **gzip(9) 205,796** | **`index-CTSxVm82.js`** raw **704,489** / **gzip(9) 205,796** | **逐字节未变**（sha256[:16] 仍 `ccf172868968d396`）⇒ 稿「JS 一行不动 ⇒ gzip 不变」✅。文件名变是因为 vite 把 **CSS 资源名内联进 JS** |
| CSS | `index-DtvYVM-O.css` raw 36,018 / gzip(9) **7,260** | **`index-C0-olitZ.css`** raw **36,468（+450）** / gzip(9) **7,237（−23）** | 稿预期「gzip **±150 B** 以内，很可能净减」⇒ 实测 **−23 B**，**落在区间内** ✅ |
| `dist/index.html` | 740 B / gzip9 561 | 740 B / **557** | 未改内容（gzip 波动） |
| `dist/fonts/` | 4 个文件 | 4 个文件 | 未动 |

- **K11 预算 205,969 B**：JS gzip(9) **205,796 B**，余 **173 B** ✅（与改前**完全一致**）
- **D1 硬线 198.57 KiB = 203,335 B**：仍超 **2.40 KiB** —— **本批不解决 D1**，出路仍是按页 code-split（另立一轮）。
  ⚠️ 本批**没有**拿"收到了圆角/字号"当体积变小的理由去碰 D1（稿 §7 明文禁止）。
- ⚠️ `vite build` 自报的 `36.47 kB │ gzip 7.28 kB` / `689.76 kB │ gzip 208.08 kB` **不是判据**
  （字符数口径 + level 6；真值 = 磁盘字节 + `gzip.compress(raw, 9)`，见 PLAYBOOK §2）。

---

## 5. 八页 × 两视口横向溢出复核（稿 §6.4-1）

**这是本批唯一"可能真的坏掉"的地方**（字号收档必然改折行）。实测 **16/16 全 0**，console 全 0。

```
=== 巡检视口 1440×900 ===
OK 首页  /          overflow 0px  文档高 4796   正文 607 字
OK 序厅  #/entrance overflow 0px  文档高 900    正文 251 字
OK 通史馆 #/history  overflow 0px  文档高 900    正文 921 字
OK 铸造馆 #/hall     overflow 0px  文档高 900    正文 229 字
OK 浇铸  #/cast      overflow 0px  文档高 900    正文 182 字
OK 车削  #/turn      overflow 0px  文档高 900    正文 266 字
OK 工牌  #/vault     overflow 0px  文档高 900    正文 346 字
OK 关于  #/about     overflow 0px  文档高 2031   正文 856 字
=== 结论：8/8 页干净 ===

=== 巡检视口 375×812 ===
OK 首页  /          overflow 0px  文档高 3991
OK 序厅  #/entrance overflow 0px  文档高 812
OK 通史馆 #/history  overflow 0px  文档高 812
OK 铸造馆 #/hall     overflow 0px  文档高 812
OK 浇铸  #/cast      overflow 0px  文档高 1158
OK 车削  #/turn      overflow 0px  文档高 1204
OK 工牌  #/vault     overflow 0px  文档高 1736
OK 关于  #/about     overflow 0px  文档高 3042
=== 结论：8/8 页干净 ===
```

> 另：首页 1440 文档高 **4796**、375 文档高 **3991** —— 与改动前**逐值相同** ⇒ 折行没有被改坏。
> 原始输出：`.workbuddy/shots/p146_sweep_1440.txt` / `p146_sweep_375.txt`。

---

## 6. `--fs-display` 与品牌标记的并排前后对比（稿 §8-⑥）

**取图方法**（比"翻旧构建"更干净）：**就地改 `demo/dist/assets/index-C0-olitZ.css`** 里那几个值、
截一遍；结束前**逐字节还原并校验 sha256**（脚本 `.workbuddy/shot_p146_ab.py`，`assert back == sha`）。
⇒ 前后两图来自**同一份构建**，唯一差异就是本批动过的那几个值。

- 并排总图：`.workbuddy/shots/p146_ab_sheet.png`（1544 × 1211）
- 单张：`p146_ab_before_display.png` / `p146_ab_after_display.png`、`p146_ab_before_mark.png` / `p146_ab_after_mark.png`、
  以及工牌页 `p146_ab_{before,after}_vaultname.png` / `..._vaultmeta.png`
- 读数组：`.workbuddy/shots/p146_ab.json`

| 元素 | 改前（实测） | 改后（实测） | 变化 |
|---|---|---|---|
| `.hero h1`（1440） | `font-size: 48.96px` · 盒 `639.2 × 109.6` @ y=249.2 | **`44px`** · 盒 `639.2 × 98.5` @ y=254.7 | **−4.96px**（−10.1%），盒高压 **11.1px** |
| `.logo__mark` | `r = 6px`（`26 × 26`，`font-size 18px` 不变） | **`r = 4px`**（`26 × 26`，同上） | 圆角 −2px（尺寸/色均未动） |
| `.vault__name-row`（工牌姓名，`.vault__name` 的 34 → 28 落在这里） | 行盒 `344 × 41`（`line-height` **写死 40px** ⇒ 行高不变） | 行盒 `344 × 41`（同上） | ⚠️ **行高不变是设计使然的预期结果**：字号变小、行盒由固定 `line-height:40px` 撑着 ⇒ 差异只体现为**字形变小**，见并排图 |
| `.vault__meta`（元信息值 22 → 18） | 盒 `344 × 47.1` | 盒 `344 × **42.3**` | 盒高压 **4.8px** ⇒ 字号确实落地 |

> ⚠️ **取图时栽过一次「假 0 差异」**（PLAYBOOK §2 那类）：第一版脚本前后两轮读数**一字不差**
> （都报 `fs=44px` / `r=4px`）—— 因为 `vite preview` 对**哈希资源**发 `Cache-Control: immutable`，
> 就地改了磁盘上的 CSS，**浏览器根本没重新取**。修法三件套：① `Network.setCacheDisabled(true)`；
> ② query 里带 **cache-buster**（且必须在 `#` **之前**）；③ 收尾加**差分断言** ——
> `display` 的 `fs` 与 `mark` 的 `r` **前后必须不同，否则硬失败**。修后实测：
> ✅ 差分成立 `48.96px → 44px` / `6px → 4px`；还原后 CSS sha256 与改前**一致**。

---

## 7. 对稿的偏离 / 新发现（**四条，都报上来，都没自己糊过去**）

### ① `cssscan.py` 有残留 off-by-one ⇒ 稿 §2.1 的 `.hero__furnace` 行号差 1（**已在两份文件里更正**）

稿 §2.1/§2.3 把 `.hero__furnace` 的 `border-radius` 记为 **`layout.css:1321`**，**实测在 1322**
（1321 是 `height: 520px;` —— **一条绝对不该被改的声明**）。

根因：`cssscan.parse()` 的 `buf_line` 在「上一个 `;` 之后**同一行还有尾随空格**」时会被那些空格
记到**上一行**。→ 已修（`if buf_line is None and not ch.isspace()`），**全量复核 154 条声明 0 处不符**；
稿里的两处 `1321` 已同长度改成 `1322`（改后 `check_p1_456_prompt.py` 仍 **101 绿 / 0 红**）。
✅ **影响范围只有这 1 条**（154 条里唯一触发者），且正好指向「不该改的那一行」——
**如果实现方照稿的行号盲改，会把 `.hero__furnace` 的高度删掉。**

### ② 稿 §4.3 的 `L1` 判据**按字面不可能成立**（改的是写错的判据，不是放宽容差）

稿写「运行时全部元素的 `letterSpacing` **没有 `px` 结尾**（除 `0px`/`normal`）」。
但 §4.2 保留的 `.08em` 在 12px 上**解析成 `0.96px`** ⇒ 任何保留 em 字距的方案都必然"以 px 结尾"。
⇒ 拆成两条，覆盖原意：**`L1` = 声明侧 0 个 px 字面量**（这就是 §4.2「0 个 px」的意思）+ **`L1b` = 运行时没有整数 px**（旧 `2px` 的探针）。
实测：声明侧 0；运行时集合 `{normal, 0.36px, 0.96px, -0.88px}` —— **全是 em 派生，无整数 px**。

### ③ ★ **本批解冻了 `spec/VAULT-SPEC.md §11` 的三条裁定**（稿未显式声明，我把它补成了解冻表）

`VAULT-SPEC §11` 原文：

| # | 画稿 | 原裁定 | 本批实际 |
|---|---|---|---|
| 3 | 姓名 / 右栏标题 = **34px** | **写死 34px**（`tokens.css` 无此档且已冻结） | → **`--fs-h2`(28px)** |
| 4 | 元信息值 = **22px** | **写死 22px**（同上） | → **`--fs-h3`(18px)** |
| 6 | 圆角 6 / 8 / 10 / 14 | **照画稿原值** | → `--r-md`(6) / `--r-lg`(8)，`10 / 14` 归 8 |

**冲突是真的**：`§11` 依据是「`tokens.css` 冻结、不新增 Token」，而本批**正是**新开 5 个圆角 token 并把
19 档字号收成 7 档 ⇒ 「写死画稿原值」这条裁定与全站收档**互斥**。
**我的处理**：按稿落地（稿 §3.3 明文写 `34→28`、§6.1② 明文改门禁 ⇒ 是**有意的设计决定**，不是疏漏），
并**已把解冻回写 `spec/VAULT-SPEC.md`** —— 落点共 **4 处**：① §2 表第 3 / 第 6 两行加 ⛔ 现值注（`34px → var(--fs-h2)`、`22px → var(--fs-h3)`）；
② §11 表头下加解冻说明块（讲清「为什么这次可以动 `tokens.css`」与「哪三行作废、哪三行仍有效」）；
③ §11 的第 3 / 4 / 6 三行改成「⛔ **已解冻 → 现值**」并把原理由划掉；
④ §12 冻结表的 `tokens.css` 一格加「2026-09-24 起对圆角 / 字号解冻」。
⇒ 不再让两处说法并存。
⚠️ **这条请用户过一眼**：工牌页的姓名/标题从 34 收到 28（−17.6%），是本批**视觉后果最大**的一处；
对比图见 §6。若认为工牌页该保留 34，那是**方案 B**（新增一个画稿量不到的值），需裁定。

### ④ 稿 §2.4-3 的「先报，别自己想办法」已核：`.turn__trace svg` 的圆角**就是 `border-radius`**，不是 `clip-path`

`layout.css:965-970`：`.turn__trace svg { display:block; width:100%; height:56px; border-radius:…; background: var(--c-surface-2); }`
—— 无 `clip-path`、无 `overflow` 参与。⇒ 6 → 8 可以安全落地（它是本批**唯一一处圆角变大**的：图表面板归容器档）。

---

## 8. 全量跑批前后对照表（稿 §6.4-2）

`run_all_verify.py`（已把新增的 `verify_p1_456` 加进 `NAMES`，20 → **21 份**；⚠️ 必须串行 —— 共用 Edge profile）：

**改前基线** = `.workbuddy/verify_runs/final.json`（字体批收尾那次，**20 份**）；
**改后** = `.workbuddy/verify_runs/p146.json`（本轮，**21 份**；新增 `verify_p1_456`）。总耗时 **1,064.7 s**。

> ### ✅ 结论：**第 3 处转红 = 0**（稿 §8 判据）
> - 改前非零集合 = 改后非零集合 = **`{verify_cdp, verify_p12, verify_step4a_edge, verify_turn}`**（**完全一致**）
> - **`PASS` 计数逐份变化 = 空列表**（`verify_turn` 43/44 · `verify_ux` 47/47 · `verify_vault` 41/41 · `verify_w1` 3/3 全部原样）
> - ⇒ 本批落地**没有让任何一份由绿转红**
> - ⚠️ **四份"红"都不是本批造成的**，它们在**前三次跑批（`before` / `after` / `final`）里退出码完全相同**：
>   `verify_cdp` = **CLI 工具**（无参数即打用法并 `exit 2`）· `verify_p12` = 既有红 ·
>   `verify_step4a_edge` = 既有环境红 · `verify_turn` = **既有 D1 `K13b` 体积硬线**（老账，见 §4）。

| 门禁 | 改前 exit | 改后 exit | 改前 PASS | 改后 PASS | 判 |
|---|---|---|---|---|---|
| `verify_archive_b3` | 0 | 0 | — | — | ✅ 不变 |
| `verify_archive_b4` | 0 | 0 | — | — | ✅ 不变 |
| `verify_archive_b5` | 0 | 0 | — | — | ✅ 不变（⚠️ 该次跑批在**归档前**；归档后已单独重跑，仍 **exit 0**，见 §10 证据索引） |
| `verify_cast` | 0 | 0 | — | — | ✅ 不变 |
| **`verify_cdp`** | **2** | **2** | — | — | ⚪ 既有（CLI 无参数，非页面门禁） |
| `verify_history_cta` | 0 | 0 | — | — | ✅ 不变 |
| `verify_hotspots` | 0 | 0 | — | — | ✅ 不变 |
| `verify_p0` | 0 | 0 | — | — | ✅ 不变 |
| **`verify_p12`** | **1** | **1** | — | — | ⚪ 既有 |
| `verify_step4` | 0 | 0 | — | — | ✅ 不变 |
| `verify_step4a` | 0 | 0 | — | — | ✅ 不变 |
| **`verify_step4a_edge`** | **2** | **2** | — | — | ⚪ 既有（环境类） |
| `verify_step4c` | 0 | 0 | — | — | ✅ 不变 |
| `verify_step4c_e5` | 0 | 0 | — | — | ✅ 不变 |
| **`verify_turn`** | **1** | **1** | **43/44** | **43/44** | ⚪ 既有（唯一红 = **D1 `K13b`**，老账） |
| `verify_ux` | 0 | 0 | **47/47** | **47/47** | ✅ 不变 |
| `verify_vault` | 0 | 0 | **41/41** | **41/41** | ✅ 不变（`V7` 锁定值已改后仍全绿） |
| `verify_w1` | 0 | 0 | **3/3** | **3/3** | ✅ 不变（`H4` 锁定值已改后仍全绿） |
| `verify_w2` | 0 | 0 | — | — | ✅ 不变 |
| `verify_w3` | 0 | 0 | — | — | ✅ 不变 |
| 🆕 `verify_p1_456` | （本批新增） | 0 | — | **12/12** | ✅ 新增 12 条全过 |

**汇总行**（`run_all_verify.py` 自报）：`共 21 份；绿 17 份；非零 4 份 ['verify_cdp', 'verify_p12', 'verify_step4a_edge', 'verify_turn']`

> ⚠️ **归档类那三份是"归档前"状态**：跑批启动时 `spec/PROMPT-P1-4-6.md` 还在 `spec/`。
> 归档动作在跑批**之后**执行，随后**单独重跑** `verify_archive_b3 / b4 / b5` —— **三份全绿**
> （`b5` 的 ① 未消解引用 = **无**、② 位置对、③ **spec 29 份 / 提示词 0 · archive 27 份 / 提示词 23 · 归档项总数 29**、④ 结论句残留 = **无**）。

---

## 9. 不在本批 / 待裁定

**不在本批（照稿 §9，一条都没做过头）**：毛玻璃 / 发光 / `.eyebrow::before` 小色块（P1-7/8/9）·
首屏 h1 顶边统一（P1-10，待裁定）· 面层色三阶梯（P1-11）· 3D 悬浮层（P1-12）·
账本栅格间距 / `.about__tech` 改名 / `#/cast` 空态（P2-3/4/6）· 按页 code-split（D1）。

**待裁定（含稿自己留的两条 + 本轮新增一条）**：

| # | 事项 | 出处 |
|---|---|---|
| 1 | **工牌页要不要保留 34px**（备选方案 B） | 稿 §2.2 / 本自述 §7-③ |
| 2 | **h1 取 46（画稿中值）而非 44** | 稿 §3.2 |
| 3 | `tokens.css` 头部注释「实现方不要改这里的值」要不要加例外说明 | 本自述 §1.2 |
| 4 | 老账：D1 体积 · P1-10 · D2 砂箱编号 · D6 刀片楔角 · 字体稿 §9 A–D · Canvas 第 5 处(`poster.js:20`) | 前几轮 |

---

## 10. 改动文件清单（重打包时照这个搬）

**源码（3 个）**：`demo/src/styles/tokens.css` · `demo/src/styles/base.css` · `demo/src/styles/layout.css`

**门禁（4 个）**：`.workbuddy/verify_w1.py`（§6.1① 锁定值）· `.workbuddy/verify_vault.py`（§6.1② 锁定值）
· `.workbuddy/verify_p1_456.py`（**新建**，12 条）· `.workbuddy/run_all_verify.py`（NAMES 20 → 21）

**工具（4 个）**：`.workbuddy/cssscan.py`（**修 off-by-one**）· `.workbuddy/apply_p1_456.py`（新建，带边界断言的落地）
· `.workbuddy/shot_p146_ab.py`（新建，就地还原取前后图）· `.workbuddy/archive_p1_456.py`（新建，第十一批归档）

**状态回写**：根 `README.md` · `spec/PROJECT-BRIEF.md` · `spec/AESTHETIC-AUDIT.md`（含 **P2-1 标「已并入 P1-5」**）
· **`spec/VAULT-SPEC.md`（§2 两行 + §11 抬头 + §11-3/4/6 + §12）** · `spec/IMPLEMENTATION-FONT-SELFHOST.md` ·
`spec/IMPLEMENTATION-UX-REVISION.md`（**顺手修掉一条已漂掉的活引用**：`README.md L103` → 无行号锚点）· `archive/README.md`
· `.workbuddy/verify_archive_b5.py`（NAMES + 第十一批 + 当前答案 0 份）· `check_p1_456_prompt.py`（⛔ 使命终结抬头）

**产物**：`demo/dist/assets/index-CTSxVm82.js` · `demo/dist/assets/index-C0-olitZ.css`

**证据索引**：
`.workbuddy/shots/p146_check_before.txt`（落地前 101 绿）· `p146_apply_report.txt`（56 条编辑报告）·
`p146_raw/*.txt`（六份门禁的**未改锁定值**原始读数）· `p146_raw/*_locked.txt`（改后）·
`p146_verify.json`（12 条断言 + 八页并集）· `p146_sweep_1440.txt` / `p146_sweep_375.txt` ·
`p146_ab_sheet.png` / `p146_ab.json` · `verify_runs/p146.json`
