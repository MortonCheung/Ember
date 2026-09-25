# PROMPT-FONT-CJK-SWAP（第十三批 · 全站中文字体换「霞鹜文楷」）

> ⛔ **【已归档 · 2026-09-24 · 第十三批 · 不要发送本文件】**
> **本稿已于 2026-09-24 当晚实现并交付** —— 自述 **`spec/IMPLEMENTATION-FONT-CJK-SWAP.md`**
> （用户看过 `.workbuddy/shots/cjk_cand_A.png` 候选对照图后裁定：候选 = **霞鹜文楷**、范围 = **全站**）。
> **8 条编辑 + 1 删 2 增 + G1 门禁 4 处**：全站中文字体 **Noto Sans SC → 霞鹜文楷 LXGW WenKai v1.330**；
> `@font-face` **1 → 2**（静态双字重 Regular/Bold，`font-weight: 400 500` / `600 700`）·
> `demo/public/fonts/` **2 个 / 286,820 B → 3 个 / 473,876 B（+187,056 B）**；
> `--font-num` 与 `--font-cn` 仍是**同栈**（只换栈首，token 保留）· 4 处字体栈首名替换（`tokens.css:34/:36`、
> `poster.js:19`、`emblem.js:40`）· **字号 / 字距 / 行高 / 圆角 / 间距 token 一个不动**、
> **CSS `font-weight` 数值一个不动**、`tnum` 规则保留（对本字体是 no-op 但无害）。
> **产物**：`index-DxzSVEyG.js` 704,430 B / gzip9 **205,775**（raw **−2** / gzip **+7**）·
> `index-CigWfXV7.css` 36,455 B / gzip9 **7,222**（raw **+146** / gzip **+21**）
> （口径 = **Python 3.13.14 · zlib 1.3.1 · `gzip.compress(raw, 9)`**，与 `verify_turn.py:509` 同源；
> ⚠️ 不要与裸 `zlib.compress(raw,9)` 混用 —— 后者少一层 gzip 容器，JS 会读成 205,763、CSS 7,210）。
> **必改门禁 `verify_font_drop.py` 4 处**（+ **4 处失效的自我描述**一并改写 ⇒ 实际动 **8 行**，见自述 §4-⑥）+ **3/3 PASS** · 八页 × 两视口横向溢出 **16 / 16 全 0** ·
> `document.fonts.size` **1 → 2**（两个 face 都 `loaded`）· 网络里 **0 条 `NotoSansSC-*` 请求** ·
> 子集覆盖 **1,134 / 1,134 字**（见下「意外之喜」）。
> ⚠️ **跑批 22 份：非零集合新增 2 个成员**（`verify_cast` / `verify_ux`）—— 二者是**同一个量**：
> `.cast__steps` 首项左边界 `firstLeft` 由第十二批的 **1118.5 → 1111**（两份门禁都把 1118.5 硬编码了）。
> **实测定性为「文字度量变了」，不是布局坏了**：`.cast__steps` 的右边缘两个构建**逐位相同 1376.00**
> （`.topbar__spacer{flex:1 1 auto}` 把它右锚定）⇒ 左边缘 = 右边缘 − 文本块宽；
> 5 个步骤标签各 **38.70/38.72 → 40.20 px**，Σ **193.52 → 201.00**（**+7.48**）⇒ 首项正好左移 **7.49**（1118.47 → 1110.98）。
> `.cast__steps` 高度 **20.39 不变**（无折行/无裁切）、横向溢出 0。⇒ 属**字体度量副产品**，
> **按稿 §6 归入「经用户过目后固化新基准」，判据一字未改**（红线 10：不许改判据糊过去）。
> **这里的每一项都已经在代码里了** —— **再发一次等于让实现方重做一遍。**
> 📌 归档原因：**出稿当晚被用户裸引用（裸引用 = 实现信号）⇒ 同日实现并交付**，按规矩整份移出 `spec/`。
> 正文一字未改，**下文所有行号均为「改前」行号**（`fonts.css:1-28`、`tokens.css:32-38`、`base.css:16/31/32`、
> `poster.js:19/43/46/73/77/87/90/94/115/118`、`emblem.js:40/238`、`demo/README.md:35`、
> `verify_font_drop.py:137/142/151/153` 等）。
> ⭐ **一条「意外之喜」推翻了稿 §1.2 的覆盖率结论（按稿自己的要求在落地时复测）**：
> 稿在 **v1.250 分片**上量到缺 `Δ θ π ω` 四字（**1,130 / 1,134**）并写了「`Δ` 走雅黑兜底」；
> 落地用 **v1.330 全量 TTF** 逐字复测 ⇒ **1,134 / 1,134，一字不缺**（`Δ` 有真实轮廓、advance 0.6500 em）
> ⇒ **`viewport.js:470` 的「|Δz| < 0.2」不再兜底**，`fonts.css` 头注已按复测值改写。**这一条已撤销旧声明。**
> ⚠️ **一条上游字体缺陷（本批为落地必须处理，已如实记录）**：v1.330 的 cmap **format 4 子表 length 字段溢出** ——
> 该子表真实长度 **72,230 B** > uint16 上限 65,535，上游工具写了 `72230 & 0xFFFF = 6,694`。
> 后果：`TTFont(...).getBestCmap()` 与 `pyftsubset` 全部抛 `IndexError`（`_c_m_a_p.py:969`），
> **lazy True/False、fontNumber 三种读法都挂**。修法见 `.workbuddy/repair_lxgw_cmap.py`：
> 按真实长度 72,230 解出 BMP 映射、**与 format 12 的 BMP 部分逐项断言相等（34,223 = 34,223）**后
> 重新编码一份合法 format 4，再就地补丁（新表更小 ⇒ 尾部补零，所有表偏移不变）。
> 同理 Bold 的 cmap 结构与 Regular **逐字节同构** ⇒ 属上游字体怪癖，**不是下载损坏**。
> ⚠️ **本批另有 3 条对稿的偏离**（E3 授权文本多带两行版权声明「OFL §2 要求随附」·
> `verify_font_drop.py` 除稿列的 4 处外另有 4 处**失效自我描述**就地改写 ·
> `README.md:190/:283` 的「`dist/fonts/` 两个文件」已是假话，随状态回写一并修掉）· 另**清掉两处已作废的活声明**：根 `README.md:102/:104/:233` 的「评委硬线」（且读数还是第九批旧值 205,796 B）与 `spec/AESTHETIC-AUDIT.md:455` 的「数字与拉丁改走 Noto Sans SC」—— 均改为否定式 / 更新式，**两个文件行数未变**。见自述 §4。
> ⚠️ 本批还抓出稿 §5 的一句话**说反了方向**：稿写「JS：4 处栈字符串各短 1 字符」——
> 真正进 JS 的只有 **2 处**（`poster.js:19`、`emblem.js:40`），另 2 处在 CSS（`tokens.css:34/:36`）；
> 且 `"Noto Sans SC"`(12) → `"LXGW WenKai"`(11) 确实各短 1 ⇒ JS raw **恰好 −2 B**，与实测吻合。
> ⚠️ `check_font_swap_prompt.py`（出稿前工具）**已随本批封版** —— 出稿时 **34 / 34 PASS · exit=0**，落地后复跑 **17 绿 / 17 红**
> （它断的是「落地前的真实状态」，转红 = 使命终结，**不要当回归修**）。封版时另修两处：`PROMPT` 路径兼容 `archive/spec/`、
> 以及对**已删除**的 `NotoSansSC-subset.woff2` 裸调 `os.path.getsize` 导致的 `FileNotFoundError` 改为「缺文件记红」。
> 🔥 **`spec/` 此刻可发的提示词 = 0 份**（2026-09-24 出稿 → **2026-09-25 凌晨落地并归档**）。什么时候重新开张：
> ① 用户再提新修订（审美优化余下批次 P1-7~9 / P1-11~13 与 P2 余 5 条）；② D1 体积若被裁定为「砍内容」；
> ③ P1-10（首屏 h1 顶边）若裁定做；④ 中黑层若裁定做（**方案 B：新增 Medium 第三字重**，本批 §9 明确不含）。
> ⚠️ 同类结论句**已连发 14 次**（第十批 2 份 → 当晚字体落地 1 份 → 第十一批 P1-4-6 落地 0 份 →
> 第十二批出稿当晚可发 1 份 → 本批出稿当晚可发 1 份 → 本批落地 0 份）—— **必带时间戳，且别当永久结论**。

> **状态：可发（2026-09-24 出稿）**。实现后**整份移入 `archive/spec/`**（移动不删），并交付 `spec/IMPLEMENTATION-FONT-CJK-SWAP.md`。
> 前置：用户看过 `.workbuddy/shots/cjk_cand_A.png` 候选对照图（现状 + 8 款可落地候选 + 13 款本机商业字体），**选定第 3 卡「霞鹜文楷」**，并裁定**换的范围 = 全站**（正文也换，黑体彻底退场）。

---

## §0 一句话

全站中文字体从 Noto Sans SC（黑体，自托管可变子集）换成 **霞鹜文楷 LXGW WenKai**（楷体手写感，SIL OFL 1.1，免费商用）：`@font-face` **1 → 2**（Regular / Bold 两个静态字重子集），**4 处字体栈首名替换**，`verify_font_drop.py` **4 处断言改写**；字号 / 字距 / 行高 / 圆角 / 间距 token **一个不动**，CSS `font-weight` 数值**一个不动**。

---

## §1 出稿前事实核查（全部为本机脚本实测，非记忆）

### 1.1 行号表（**改动前**的行号；下方所有编辑以此为准）

| 文件 | 行 | 改动前现状 |
|---|---|---|
| `demo/src/styles/fonts.css` | 1–28 | 整份重写（现为 Noto Sans SC 单 `@font-face`，`:23` 族名 / `:27` src） |
| `demo/src/styles/tokens.css` | 32–33 | 注释（`:33` 有「评委机器若无法访问 Google Fonts」—— 第十批遗留的陈旧话，顺带改写） |
| `demo/src/styles/tokens.css` | 34–35 | `--font-cn` 栈，栈首 `"Noto Sans SC"`（在 `:34`） |
| `demo/src/styles/tokens.css` | 36–38 | `--font-num` 栈，栈首 `"Noto Sans SC"`（在 `:36`；`:38` 尾注「第十二批：Inter 已删」） |
| `demo/src/styles/base.css` | 16 | `font-family: var(--font-cn);` —— 不动 |
| `demo/src/styles/base.css` | 31 | 注释「数字与拉丁字母与正文同栈（第十二批已删 Inter）」—— 措辞更新 |
| `demo/src/styles/base.css` | 32 | `.num, .latin { … font-feature-settings: "tnum"; }` —— **不动**（见 §1.4） |
| `demo/src/js/ui/poster.js` | 19 | `const FONT_CN = '"Noto Sans SC","Source Han Sans CN","PingFang SC","Microsoft YaHei","Hiragino Sans GB",system-ui,sans-serif';` |
| `demo/src/js/ui/poster.js` | 43/46/73/77/87/90/94/115/118 | 9 处 `` ctx.font = `${W} ${S}px ${FONT_CN}` `` 使用点（400×3、500×4、700×2）—— **一动不动** |
| `demo/src/js/ui/emblem.js` | 40 | 同一 `FONT_CN` 常量 |
| `demo/src/js/ui/emblem.js` | 238 | 1 处使用（400）—— 不动 |
| `demo/index.html` | — | **零字体引用**（只 `<link>` 四张 css）⇒ 零改动 |
| `demo/README.md` | 35 | 「字体：**Noto Sans SC（自托管子集，SIL OFL 1.1）**」 |
| `.workbuddy/verify_font_drop.py` | 142 | `head_noto = all(f.lstrip().startswith('"Noto Sans SC"') …)` |
| `.workbuddy/verify_font_drop.py` | 151 | `noto_req = [x for x in res_all if "NotoSansSC-subset.woff2" in x["url"]]` |
| `.workbuddy/verify_font_drop.py` | 153 | `face_noto = [f for r in per for f in per[r]["faces"] if "Noto Sans SC" in f]` |

> ⚠️ **回扫三种写法**：以上行号在别的资产里也可能被引用，回扫要同时 grep `:N` / `LN` /「第 N 行」。
> 已核：`spec/IMPLEMENTATION-FONT-SELFHOST.md` / `IMPLEMENTATION-FONT-DROP-INTER.md` 引的 `tokens.css:32/:34/:36-38` 是**历史记录**（讲当时的改动），**不要改**。

### 1.2 覆盖率（fontTools 对全站字表逐字判）

- 全站字表 = `.workbuddy/fontwork/chars-loose.txt`（3,200 B / **1,134 字**，第十批同一份）。
- 霞鹜文楷 webfont（npm `lxgw-wenkai-webfont@1.7.0` = 上游 **v1.250** 分片）的 97 段 `unicode-range` 并集实测：**覆盖 1,130 / 1,134，缺 4 字**：
  `Δ(U+0394) θ(U+03B8) π(U+03C0) ω(U+03C9)`；Bold / Light 分片**同覆盖**。
- 这 4 个字里只有 `Δ` 真会渲染：`demo/src/js/scene/viewport.js:470` 的检查点标签 `'|Δz| < 0.2'` ⇒ 走雅黑兜底，
  与现用 Noto 缺 `₀`（只在注释里）**同性质、属预期**；`θ π ω` 只出现在代码注释，不渲染。
- ⚠️ 上表覆盖是 **v1.250 分片**上测的；**落地用的是 v1.330 全量 TTF**（版本更高、字库只增不减），
  子集化**之前**必须复测（脚本见 §2-E2，预期 ≥ 1,130；若 v1.330 连 `Δ` 都补上了，`viewport.js:470` 就不用兜底了，属意外之喜）。

### 1.3 数字与拉丁 advance（fontTools 读 Regular 分片实测）

| 项 | 霞鹜文楷 | 对照（Noto Sans SC，第十二批实测） |
|---|---|---|
| 10 个数字 advance | **全等 0.6000 em** | 全等 0.5210 em |
| A / Z / a / z | 0.6900 / 0.6000 / 0.5750 / 0.4900 em | 均值 0.6032 / 0.5363（A-Z / a-z） |
| `·`(U+00B7) | **0.35 em（窄）** | **1.0 em（全宽）** |

三条推论：
1. **数字仍然天然等宽** ⇒ `base.css:32` 的 `font-feature-settings:"tnum"` 变 no-op 但**无害**
   （第十二批对 Noto 的结论原样成立）⇒ **不许删这条规则**。
2. **拉丁变宽**（A 0.69 vs 0.60）⇒ `C620-1` / `NO. 0012` / `22 × 11.5 m` / `净重 50 t` / `1380 ℃` 全变宽
   ⇒ 账本、工牌、评分的**折行与溢出必须全量复核**（§4.2）。
3. **`·` 从全宽变窄** ⇒ 第十二批「Noto 把 `·` 排成 1 em」的副作用被**逆转**：
   海报「炉火不灭 · 2026」（`poster.js:118`）、`#/about` 的「01 · 看见」等 4 条 layer-no、账本 cap 含 `·` 的串**变窄**。

### 1.4 权重映射（静态双字重的物理约束；**不改任何 CSS font-weight**）

霞鹜文楷只有静态字重，本项目 ship **Regular(400) + Bold(700)** 两个子集：

| CSS 声明权重 | 现渲染（Noto 可变 100–900） | 换后渲染 | 面数 |
|---|---|---|---|
| 400（正文默认） | 400 | Regular 400 | — |
| **500** | 真·中黑 | **Regular 400（变细）** | CSS 13 处声明（`layout.css` 11 + `base.css` 2）+ Canvas 4 处 |
| **600** | 半粗 | **Bold 700（变粗）** | CSS 14 处 |
| 700（含 `base.css:24` 的 h1–h4） | 全粗 | Bold 700 | CSS 8 处 |

- 这是静态字体的物理结果，**不是实现方可以「顺手优化」的**（红线 10）。浏览器对 500 会取 400、对 600 会取 700，**不合成**。
- 用户验收后若想找回中黑层 ⇒ **方案 B：加 Medium 第三字重另立一轮**，本批不做（§9）。

### 1.5 源字体、版本与授权

- 上游：`lxgw/LxgwWenKai`，SIL OFL 1.1。随包 `OFL.txt` 是**裸许可文本，未见 Reserved Font Name 声明**；
  且作者自己的官方 webfont 包就是「子集 + 沿用族名」⇒ 本项目子集**沿用族名 "LXGW WenKai"** 合规
  （落地时瞄一眼上游 README 有无补充声明即可，不必阻塞）。
- **锁定 v1.330**（GitHub release 同时提供 Regular + Bold 两个 TTF；v1.520 已无 Bold 而改叫 Medium，v1.250 无 TTF 资产）：

| 文件 | 大小（Content-Range 实测） |
|---|---|
| `https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Regular.ttf` | 19,073,964 B |
| `https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Bold.ttf` | 18,546,748 B |

- ⚠️ GitHub 直下实测 ~0.6 MB/min ⇒ **挂后台**，两份约 60–80 分钟；落地自述里记 sha256[:16]。
- ⛔ **严禁用本机 / 系统字体替代**：华文(HTC)、方正、微软系字体**不可随网页自托管再分发**（参赛公开即侵权）。
  免费可商用的候选清单见 `.workbuddy/shots/cjk_cand_A.png`，本批只用霞鹜文楷。

---

## §2 改动清单（8 条编辑 + 1 删 2 增）

### E1【删】旧字体文件

`demo/public/fonts/NotoSansSC-subset.woff2`（282,432 B）与 `demo/public/fonts/OFL-NotoSansSC.txt` 删除。

### E2【增】子集化（pyftsubset，与第十批**完全同口径**）

```bash
# 源 TTF 放 .workbuddy/fontwork/raw/（同第十批惯例）
pyftsubset raw/LXGWWenKai-Regular.ttf \
  --text-file=chars-loose.txt \
  --flavor=woff2 \
  --output-file=final/LXGWWenKai-Regular-subset.woff2
pyftsubset raw/LXGWWenKai-Bold.ttf \
  --text-file=chars-loose.txt \
  --flavor=woff2 \
  --output-file=final/LXGWWenKai-Bold-subset.woff2
```

- `chars-loose.txt` = `.workbuddy/fontwork/chars-loose.txt`（1,134 字，**同一份字表**，不要重新生成）。
- **用 pyftsubset 默认 layout-features**（不要加 `--layout-features=*`，第十批的坑）。霞鹜文楷无 `tnum` ⇒ 无需显式补。
- **子集化前先跑覆盖复测**（对 v1.330 的 TTF 直接读 cmap，对 1,134 字逐字判），把「命中数 / 缺字列表」写进自述
  （预期 ≥ 1,130 / 1,134；§1.2 的 4 个缺字若在 v1.330 已补上，如实记录）。
- 体积实测值写进自述（§5 只有估算）。

### E3【增】许可证文本

把霞鹜文楷的 OFL 文本放进 `demo/public/fonts/OFL-LXGWWenKai.txt`
（内容 = 上游 `OFL.txt` 全文 + 文件头一行「霞鹜文楷 LXGW WenKai · 上游 https://github.com/lxgw/LxgwWenKai · SIL OFL 1.1 · 本文件为其子集」）。
⇒ `demo/public/fonts/` 最终 **3 个文件**：两个子集 woff2 + 一份 OFL。

### E4【重写】`demo/src/styles/fonts.css`（整份替换）

```css
/* ============================================================
   fonts.css — 自托管字体（子集化静态字重）
   来源：霞鹜文楷 LXGW WenKai v1.330（SIL Open Font License 1.1）
        许可证全文见 public/fonts/OFL-LXGWWenKai.txt

   ⚠️ 族名必须与 tokens.css / poster.js / emblem.js 里的栈完全一致：
      CSS 与 Canvas 导出共用同一份字体栈（poster.js:19 的 FONT_CN 与 emblem.js:40 的 FONT_CN 写死在 JS 里），
      改名会让页面与导出海报分叉。

   ⚠️ 两个静态字重：Regular(400) 与 Bold(700)。CSS 里的 500 会取 Regular、600 会取 Bold（浏览器匹配规则，不合成）。
      —— 这是静态字体的物理约束；「找回中黑层」需新增 Medium 字重，属另一轮。

   ⚠️ 子集只含全站用到的 1,134 字中的 1,130 字（Δθπω 四个希腊字母上游字库没有；
      其中 Δ 真会渲染的只有 viewport.js:470 的「|Δz| < 0.2」，走雅黑兜底，属预期）。
      用户输入（#/vault 的藏品命名）可能出现子集外的字，
      此时由 tokens.css 里的 "PingFang SC" / "Microsoft YaHei" 等兜底，属预期行为。

   ⚠️ 数字 10 个 advance 全等 0.6 em（天然等宽）；base.css 的 tnum 规则对本字体是 no-op，保留无害。
   ============================================================ */

@font-face {
  font-family: "LXGW WenKai";
  font-style: normal;
  font-weight: 400 500;
  font-display: swap;
  src: url("/fonts/LXGWWenKai-Regular-subset.woff2") format("woff2");
}

@font-face {
  font-family: "LXGW WenKai";
  font-style: normal;
  font-weight: 600 700;
  font-display: swap;
  src: url("/fonts/LXGWWenKai-Bold-subset.woff2") format("woff2");
}
```

> 说明：`font-weight` 写**区间**（`400 500` / `600 700`），把 §1.4 的匹配规则显式钉在 CSS 里，不依赖浏览器猜测。

### E5【编辑】`demo/src/styles/tokens.css` —— 4 处同段替换，**净 0 行**

- `:34`：栈首 `"Noto Sans SC"` → `"LXGW WenKai"`（其余兜底一字不动）。
- `:36`：同上。
- `:32–33` 注释改写（净 0 行），新文：
  `/* 中文/西文字体栈：优先 Web 字体（自托管子集），缺失时逐级回落到系统中文字体`
  `   （子集只含全站 1,134 字；用户输入的集外字由苹方/微软雅黑兜底，不能糊） */`

### E6【编辑】`demo/src/styles/base.css:31` 注释 —— 净 0 行

改前：`/* 数字与拉丁字母与正文同栈（第十二批已删 Inter） */`
改后：`/* 数字与拉丁字母与正文同栈（第十二批删 Inter、第十三批换霞鹜文楷，两批均为单栈） */`

### E7【编辑】Canvas 两处常量 —— 只换栈首，**净 0 行**

- `poster.js:19` 与 `emblem.js:40`：`'"Noto Sans SC",'` → `'"LXGW WenKai",'`，**其余兜底一字不动**。
- 两文件里 10 处 `ctx.font` 使用点（`poster.js:43/46/73/77/87/90/94/115/118`、`emblem.js:238`）**一动不动**。
- ⚠️ Canvas 的权重匹配与 CSS 同规则（500 → Regular）；导出海报与页面必然同字形，这正是族名不可改的原因。

### E8【编辑】`demo/README.md:35`

改后：`无框架、无 UI 库。字体：**霞鹜文楷 LXGW WenKai（自托管子集，SIL OFL 1.1，Regular/Bold 双字重）**。`

### G1【门禁改写】`.workbuddy/verify_font_drop.py` —— 4 处，**净 0 行**

- `:137`：注释「且首项是 Noto Sans SC」→「且首项是 LXGW WenKai」
- `:142`：`'"Noto Sans SC"'` → `'"LXGW WenKai"'`
- `:151`：`"NotoSansSC-subset.woff2"` → `"LXGWWenKai-Regular-subset.woff2"`
- `:153`：`"Noto Sans SC"` → `"LXGW WenKai"`
- 语义不变：D1 = 「`.num` 族首项是 LXGW WenKai 且无 Inter」；D2 = 「Noto/Inter 请求为 0 + LXGW Regular 请求与 face 必须存在（对照组）」。
- ⚠️ 已核全仓 22 份 `verify_*.py`：除本文件 4 处外，**只有 `verify_archive_b5.py` 还有 1 处**（那是归档审计脚本、
  只读历史归档、不跑页面）⇒ **不改**。其余 20 份为 0。
  `check_font_drop_prompt.py` / `check_p1_456_prompt.py` 是「出稿前」工具且**使命已终结**（第十二批已封版转红），本轮**不修不跑**。

---

## §3 不许改

1. `tokens.css` 的**字号 / 字距 / 圆角 / 间距** token（第十一批刚收档：7 档字号 / 5 档圆角）。
2. `base.css:32` 的 `.num, .latin` 规则与 `font-feature-settings:"tnum"`（§1.4：对 LXGW 是 no-op 但无害；删了零收益）。
3. `--font-num` token **保留**（`layout.css` 两处消费点；删了会让两条历史断言转红而零收益 —— 第十二批同款结论）。
4. 任何 CSS `font-weight` 数值（§1.4 的映射是物理结果，不靠改数值遮掩）。
5. `demo/index.html`（无字体引用；**禁止**加 `<link rel=preload as=font>` —— 第十批实测触发 Chrome 假警告、连毁两条 U12 断言、收益为零）。
6. `layout.css` 及各页 JS（字体栈只从 token 来，页面级零改动）。

---

## §4 验收

### 4.1 门禁

- `verify_font_drop.py` **3/3 PASS**（G1 改写后）。
- 跑批 **22 份**全部重跑（红线 8：字体是全局解冻项）。
  预期非零集合仍在 `{verify_cdp, verify_p12, verify_step4a_edge, verify_turn}` 内；
  **verify_turn 的 `K13b`（D1 体积）维持现状红** —— 与本批无关，D1 等官方文件（不许碰）。

### 4.2 折行 / 溢出全量复核（**本批最可能出红的地方**）

- 八页 × 两视口（1440 / 375）横向溢出 **16/16 = 0**。
- 八页 `docH` 与改前对账（1440 与 375 各 8 值）—— 拉丁变宽 + `·` 变窄 ⇒ 折行点可能移动，**逐值登记**；
  若某页 `docH` 变化，给出行级原因（哪一段文案折行变了）。

### 4.3 字体就位验证

- `document.fonts` 恰好 **2 个 face**（Regular + Bold），status 均 `loaded`。
- 网络里**没有任何** `NotoSansSC-*` 请求。
- ⚠️ 探针自带凭据（query 接在 `#` 之前 + `landed hash` 入 JSON）；字体量测前 `await document.fonts.ready` + 两帧 rAF
  （否则量到回退字体 —— 第十六轮真栽）。

### 4.4 子集完整性

- 两个子集 woff2 的 cmap 覆盖 **1,130 / 1,134**（或 v1.330 复测值），缺字列表与 §1.2 一致。
- `demo/public/fonts/` 恰好 **3 个文件**。

### 4.5 导出海报

- Canvas 导出（工牌海报）字形与页面一致（同一 FONT_CN 栈）；
  「炉火不灭 · 2026」的 `·` 变窄属预期（§1.4-3）。

---

## §5 体积记账

- **woff2 不进 D1 的账**（D1 只看 JS gzip，官方口径待用户发文件）。
- 字体文件体积：**估算** Regular 子集 150–300 KB、Bold 子集 150–300 KB（对照：Noto Sans SC 子集 282,432 B / 1,134 字形；
  楷体曲线更繁、但静态无双层可变开销）。**以落地实测为准**，写进自述。
- JS：4 处栈字符串各短 1 字符 ⇒ gzip(9)（Python 3.13 zlib 口径）变化在个位数 B；产物名哈希**必变**（CSS 内容变了 ⇒
  `index-*.css` 与 `index-*.js` 名都换）⇒ **落地后回扫 `index-[A-Za-z0-9_-]+\.(js|css)`**，待发资产里的旧产物名要同步。

---

## §6 门禁影响

| 类别 | 项 |
|---|---|
| **必改** | `verify_font_drop.py` 4 处（G1） |
| **必跑** | 跑批 22 份（含 `verify_w1/w2/w3`、`verify_ux`、`verify_vault`、`verify_turn`、`scan_dead_selectors`、`scan_orphan_comments`） |
| **预期转红风险** | W 系里凡**裁到文字像素**的断言（3D 场景本体不受字体影响）⇒ 转红时先分类：「文字字形变了」属预期，**经用户过目后固化新基准**；「布局真的坏了」才修 |
| **不修不跑** | `check_font_drop_prompt.py` / `check_p1_456_prompt.py` / `check_font_selfhost_prompt.py`（出稿前工具，使命均已终结） |

---

## §7 出门自检

1. `Grep "Noto Sans SC"` 全仓：`demo/` 下应为 **0** 处；`.workbuddy/verify_*.py` 下除 `verify_archive_b5.py`（归档审计，只读）外应为 **0** 处；
   剩余命中只允许在 `archive/spec/`、历史 `IMPLEMENTATION-*.md`、`.workbuddy/check_*.py`（封版）与本稿的「改前」引用里。
2. `Grep "NotoSansSC"` 同上；`demo/public/fonts/` 无残留文件。
3. `Grep "LXGW WenKai"`：应命中 `fonts.css ×2`、`tokens.css ×2`、`poster.js:19`、`emblem.js:40`、`README.md:35`、`verify_font_drop.py ×3`。
4. `scan_dead_selectors` = 0、`scan_orphan_comments` = 0（新 fonts.css 注释里**不要**出现不存在的类名）。
5. 本稿行号表 §1.1 的每一行，在**动手前**再对一次真实文件（回扫 `:N` / `LN` /「第 N 行」三种写法）。

---

## §8 落地后回写清单（交付自述时逐项打勾）

1. `spec/IMPLEMENTATION-FONT-CJK-SWAP.md`（十节，同第十二批结构）。
2. 本稿**整份移入** `archive/spec/`（移动不删、正文原样）。
3. `.workbuddy/memory/MEMORY.md`：可发提示词数、产物名、字体段（Noto → LXGW）、`demo/public/fonts/` 3 个文件。
4. `.workbuddy/memory/PLAYBOOK.md`：批次史补第十三批；工具索引补 `make_cjk_cand_page.py` / `probe_cjk_cand.py` / `check_lxgw_coverage.py` / `measure_lxgw_digits.py`。
5. `.workbuddy/memory/2026-09-24.md`（或当日）追记落地轮。
6. `README.md` / `PROJECT-BRIEF.md`：凡声称「字体 Noto Sans SC / 自托管可变」处回写（**先扫结论句，不只扫文件名**）。
7. `design/README.md` **不用动**（第十五轮已核：画稿对字体沉默）。
8. 回扫待发资产里的产物名哈希（§5）。
9. 跑批结果表（22 份，PASS/FAIL/分类）贴进自述。

---

## §9 本批不包含

- `release/dist` 重打包（另立一轮；且有「绝对路径 vs 相对路径」坑要一起处理）。
- 作品描述 PDF、视频分镜、部署。
- 中黑层补救（方案 B：新增 Medium 第三字重）。
- D1 体积（等官方文件，**不许碰**，也不许用「评委硬线」这个说法）。
- `.latin` 半死选择器清理、`tokens.css` 头注例外说明等 P1-4-6 交回项。
- 候选清单里其他字体的任何尝试（马善政 / 站酷系等仅作过对照）。

---

## §10 用户在验收时会看到什么

1. **全站字形从黑体变成楷体手写感**：气质从「现代工业面板」转向「档案 / 文献 / 手写温度」—— 这正是对照图第 3 卡的效果，全站生效。
2. **大标题不变粗**：H1–H4 原本就是 700 ⇒ 仍是 Bold，层级保留。
3. **原来 500（中黑）的地方变细**：导航药丸、工牌小标签、账本 cap、衍生按钮等 13 处 —— 静态字重没有中黑，属物理结果（方案 B 可补）。
4. **原来 600 的地方变粗**：主按钮、当前步骤、fact 值等 14 处 —— 由半粗变全粗。
5. **数字读数仍对齐**：10 个数字天然等宽（0.6 em），账本 / 评分不乱；但数字与拉丁整体比原来**宽 ~15%**，`C620-1`、`22 × 11.5 m`、`净重 50 t` 会更长。
6. **`·` 变窄**：`炉火不灭 · 2026`、`01 · 看见` 等含间隔点的行会变短（第十二批把它们撑宽的副作用被撤销）。
7. **一处字形混排**：`|Δz| < 0.2` 的 `Δ` 来自系统兜底（微软雅黑），与上下文的楷体不完全一致 —— 上游字库没有这个字，属预期。
8. **15px 正文的手写楷体**：可读性略低于黑体（用户已在对照图上确认接受）。
