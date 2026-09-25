# 提示词 · P0 必修四项（体检报告 §6 的 P0 收敛版）

> ⛔ **【已归档 · 2026-09-24 · 不要发送本文件】**
> **本文件的四项 FIX 已于 2026-09-24 实现并交付** —— 自述 **`spec/IMPLEMENTATION-P0-FIXES.md`**
> （`scan_dead_selectors` **1 → 0** · `verify_vault` **41/41** · `verify_ux` **47/47** ·
> `verify_cast` E9/T7 PASS · `verify_turn` **42/43**，唯一红为**既有 D1** `K13b` 体积）。
> **这里的每一项都已经在代码里了**：角标门槛文案说反 / 描边色当文字色 / `<ol>` 自动序号 / 改名后的两条死规则
> —— **再发一次等于让实现方重做一遍。**
> 📌 归档原因：**出稿次日即实现并交付** ⇒ 按规矩整份移出 `spec/`。
> 正文一字未改，**下文所有行号均为「改前」行号**。
> ⚠️ 本轮**新增断言**落进两个门禁脚本（`verify_vault.py` 的 P0F1/P0F2/P0F4 · `verify_ux.py` 的 P0F3），
> 与自述 §4 一一对应。**此刻 `spec/` 手上可发的 = `PROMPT-NAV-TRIM.md` 1 份。**

> **状态**：**未实现，可发**。出稿 2026-09-23 深夜。
> **上游**：`spec/AESTHETIC-AUDIT.md` §6「P0 · 必修缺陷」。
> **本份与体检报告的关系**：体检原列 **5 条**，出发前逐条做了运行时取证，
> **撤回 1 条**（原 P0-5 不是缺陷，见 §3）、**改写 2 条**（原 P0-1 的真因在规格里、原 P0-3 的机制与读数更正）。
> **现在这四项都是"错"，不是"审美"** —— 不涉及配色取舍、不涉及布局重排。**不要在这一轮顺手做审美。**
> **配套出门检查**：`.workbuddy/check_p0_fixes_prompt.py`（本份每一条行号与数值都由它核过）。
> **不许动**见 §4；**门禁影响**见 §5。

---

## 0. 一句话

四件小事，都在 `demo/src`：**一句话说反了**（角标）、**一个颜色用错了**（描边色当文字色）、
**一个 `<ol>` 没清序号**（屏幕上多出一排 "1. 2. 3."）、**两个规则挂在一个已经不存在的类名上**（锁定态因此失效）。

---

## 1. FIX-1 · 角标文案说反了（`vault.js:361`）

**现状**（`demo/src/js/pages/vault.js`，在 `paintDerivs()` 内）：

```js
      if (d.need === 0) {
        badgeEl.hidden = true;
      } else {
        badgeEl.hidden = false;
        badgeEl.textContent = `已解锁 ${d.need}/12`;
      }
```

**问题**：`d.need` 是**门槛**（第 3 / 4 项分别要 3 / 8 件），不是已解锁数。
所以一张**锁定**卡上会同时出现两句相反的话 —— 角标「已解锁 3/12」、
展开后的说明「**需要解锁 3 件馆藏**」（同一行紧邻的 `vault.js:355`）。

**真因不在代码，在规格**：`spec/VAULT-SPEC.md` §5.3 第 163 行原文就是
`卡片右上角一枚 11px 徽标：\`已解锁 3/12\` / \`已解锁 8/12\`（分别对应第 3 / 第 4 项的门槛）`。
**规格已由设计侧同步改掉**（见 §1.1），实现按改后的规格来。

### 1.1 规格已改（设计侧已提交，实现方只需对齐）

`spec/VAULT-SPEC.md` §5.3 第 163 行改为：

> - 卡片右上角一枚 11px 徽标（**只在锁定态出现**）：`需 3 / 12` / `需 8 / 12`
>   （数字是该卡的门槛，不是已解锁数）；解锁后**不显示徽标**（此时名称已回到 `--c-text`，
>   徽标失去意义，见同节第 162 行）

### 1.2 改成什么

把上面那段 `if / else` 改成**按锁定态**决定，而不是按 `d.need === 0`：

- **锁定**（`locked === true`）→ `badgeEl.hidden = false`，文案 `` `需 ${d.need} / 12` ``
- **未锁定** → `badgeEl.hidden = true`

> `d.need === 0` 的两项（齿轮巧克力 / 铁水纹摆件）恒为未锁定 ⇒ 自动隐藏，
> **原特例可并入新分支，不必单独保留**。`locked` 变量在**同一函数上一行**已经算好（`vault.js` 里
> `const locked = view.n < d.need;`），直接复用，**不要重算**。

### 1.3 验收读数（1440×900，`#/vault`，默认无工牌态 `view.n = 0`）

| 项 | 期望 |
|---|---|
| 第 1 / 2 项（need 0） | 徽标 `hidden === true` |
| 第 3 项（need 3） | 徽标可见，文本 **`需 3 / 12`** |
| 第 4 项（need 8） | 徽标可见，文本 **`需 8 / 12`** |
| 同卡展开说明 | 仍为 `需要解锁 3 件馆藏` / `需要解锁 8 件馆藏` —— **一个字都不许动**（见 §5） |

> 空格按上面写（`需 3 / 12`）：与 `vault.js:306` 已有的 `已解锁 ${view.n} / 12` 同一体例。

---

## 2. FIX-2 · 拿描边色当文字色（`layout.css:1217`）

**现状**（`demo/src/styles/layout.css`）：

```css
1213  .vault__cell-no {
1214    position: absolute;
1215    right: 5px; bottom: 3px;
1216    font-size: var(--fs-micro);
1217    color: var(--c-line);          ← 这里
1218  }
1219  .vault__cell.is-on .vault__cell-no { color: var(--c-iron); }
```

**问题**：`--c-line = #2E3640` 是**描边色**（分隔线 / 虚线框用的），被当成文字色。
运行时实测：**12 个格子编号**的前景色 = `rgb(46, 54, 64)`，压在最底层实色
`rgb(14, 17, 22)`（`--c-bg`，格子自身 `background: transparent`）上 ⇒ 对比度 **1.55 : 1**。
WCAG AA 对 11px 小字要求 **4.5 : 1** —— 这些编号实质不可读。

**改成**：`color: var(--c-text-muted)`（`#8B939E`）。

| | 底色 `#0E1116` 上的对比度 |
|---|---|
| 现在 `var(--c-line)` | **1.55 : 1** ✗ |
| 改成 `var(--c-text-muted)` | **6.09 : 1** ✓ |
| （备选 `var(--c-steel)` 不达标） | 2.82 : 1 ✗ |

> **不要新增 token** —— `tokens.css` 头部写着"实现方不要改这里的值"，且 `--c-text-muted` 已在用。
> **第 1219 行的 `.is-on` 规则（`--c-iron`）不动**：已解锁格仍然是橙的，层级 `--c-iron` > `--c-text-muted` 成立。

---

## 3. FIX-3 · 步骤条多出一排序号（`layout.css:572`）

**现状**：`#/cast` 顶栏步骤是 `<ol class="cast__steps">`（`cast.js:60`），
文案自带序号 `① 取样`（`cast.js:45` 的 `STEP_LABELS`），而 `base.css:28` 只重置了 `ul`：

```css
base.css:28   ul { margin: 0; padding: 0; list-style: none; }      ← 没有 ol
layout.css:572  .cast__steps { display: flex; align-items: center; gap: var(--s2); }   ← 没清 list-style / padding
```

**屏幕上的实际结果（已用像素取证，不是推的）**：把第一项左侧那段 padding 截下来逐列找墨，
在 **x 1106→1114** 找到一段**独立墨迹**（第一项文字起点在 **x 1118.5**，
`<ol>` 左边缘在 **x 1078.5**）⇒ **`<ol>` 的自动序号真的渲染了**，于是屏幕显示：

```
1. ① 取样   2. ② 调温   3. ③ 浇注   4. ④ 开箱   5. ⑤ 评分
```

> 为什么不能只看 `getBoundingClientRect()`：`list-style-position: outside` 的 marker
> 画在 `<li>` 主框**之外**，不进任何元素矩形、也不参与布局 —— 必须看像素才能定论。

**画稿以 `①` 为准**：`spec/STEP3-INTERACTION-SCORING-SPEC.md:47` 写明
「画稿 S03 顶栏已定 5 步：**①取样 ②调温 ③浇注 ④开箱 ⑤评分**」⇒ **要删的是 CSS 的自动序号，不是文案里的 ①**。

**改成**：给 `.cast__steps`（`layout.css:572` 那个规则块）补两条：

```css
  list-style: none;
  padding: 0;
```

### 3.1 ⚠️ 两条必须一起加，只加一条会造成 40px 位移

尺寸实测（把改动临时打进页面量的）：

| 情形 | `li` 左边缘 | 结论 |
|---|---|---|
| 现状 | **1118.5** | 基准 |
| 只清 `list-style`（留 40px padding） | **1078.5** | **左移 40px** ✗ 变成回归 |
| `list-style` + `padding` 一起清 | **1118.5** | **不动** ✓ |

原因：`<ol>` 在顶栏右侧按内容收缩，改动后 `olLeft` 由 1078.5 变 1118.5、宽度由 297.5 变 257.5，
**右边缘固定在 1376 不动**，所以内容原地不动。

### 3.2 ⚠️ 不要图省事去改 `base.css` 的全局重置

把 `base.css:28` 的 `ul` 扩成 `ul, ol` 看起来更"治本"，但那一行同时带 `margin: 0`，
会**顺带清掉另外两个 `<ol>` 的外边距**（`.timeline` / `.vault__dex-grid`）——
这两个类**本来就各自清了 `list-style` 与 `padding`**（`layout.css:755` / `:1193`），
全局改对它们只有"多余的副作用"，没有收益。**按 §3 在 `.cast__steps` 本地补两条即可**，
也与"组件自己重置自己"的既有写法一致。

---

## 4. FIX-4 · 两个规则挂在不存在的类名上（`layout.css:1246` / `:1249`）

**现状**：`R1-P2 9c` 把衍生卡的名称从 `<span class="vault__deriv-name">` 换成了
`<button class="vault__deriv-btn">`（`vault.js:236`），但 CSS 里靠旧类名写的两条规则没跟着改：

```css
1246  .vault__deriv-name { font-size: var(--fs-body); font-weight: 500; color: var(--c-text); }
1249  .vault__deriv.is-locked .vault__deriv-name { color: var(--c-text-muted); }
```

**这两条现在是死的** —— 全仓扫描：`scan_dead_selectors.py` 报
`demo/src/styles/layout.css：234 个类名，其中 1 个在源码里找不到 → .vault__deriv-name 行 1246, 1249`。
**它不是"没影响"，而是两条都已失效**：

| 原来想达到的 | 现在实际 |
|---|---|
| 名称字重 **500** | 丢掉 —— `<button>` 只从 `base.css:27` 拿到 `font: inherit`（继承到 400） |
| 名称色 `--c-text` | 侥幸对 —— `color: inherit` 继承了 `--c-text` |
| **锁定态名称降对比 `--c-text-muted`** | **完全失效** —— 锁定卡的名称仍是全亮，**违反 `VAULT-SPEC` §5.3 第 162 行**（"名称 `--c-text-muted`"） |

> 第 1304 行的注释写着「字号 / 字重 / 颜色**沿用既有** `.vault__deriv-name`」——
> 这句是当时的误判：CSS 的类不会"沿用"，换了类名就是换了规则。**注释也要跟着改。**

**改成**：把 1246 / 1249 两处选择器 `.vault__deriv-name` **改名为 `.vault__deriv-btn`**
（规则内容不动），并把 1304 行注释改成与新类名一致的表述。

- `layout.css:1305` 的 `.vault__deriv-btn { text-align: left; padding: 0; }` **保留**（两条规则并存）；
- `vault.js` **不用改**（DOM 已经是 `vault__deriv-btn`）；
- `layout.css:1247` 的 `.vault__deriv-desc` 与 `:1250` 的 `.is-locked .vault__deriv-desc` **不动**（它们是活的）。

**验收**：`python .workbuddy/scan_dead_selectors.py` 输出 **可疑 0 个**（基线是 1 个）。
运行时：锁定卡（第 3 / 4 项）名称的 computed `color` = `rgb(139, 147, 158)`、`font-weight` = `500`。

---

## 5. 撤回一条：原体检 P0-5（`#/turn` 右栏"空洞"）**不是缺陷**

体检原写「`#/turn` 右栏面板 772 高、内容到 y≈205 就结束 ⇒ ~350px 空洞」。**这条错了**，出发前复核：

- 右栏**并不是到 205 就结束**：实测内容一直排到 **y=828**（按钮行 `786→828`），
  面板底 **868** ⇒ **底部只剩 40px 余量**，不是空洞。
- 那段"空"在 `.turn__collab` **里面**：它高 **474**（`296→770`），
  唯一可见子元素是底部的 20px 标签「团队协作积分」。
- 而这是**画稿要的** —— `layout.css:1012` 的注释原文：
  `/* 第 7 项：团队协作积分（画稿为空占位 → 结算后填 44px 大数字） */`，
  规则是 `flex: 1 1 auto; min-height: 120px;` ⇒ **它就是一块故意留白、等结算后填 44px 大数字的位置**。
  默认态（还没车削过）`turn__collab-value` 的 `textContent` 是空串，所以看起来空。

⇒ 按项目红线「**画稿没有的不该有，画稿有的不许删**」，**这里不该动**。
若仍觉得默认态太空，那是**审美问题**，走 P1/P2 轮，**不塞进本轮**。

---

## 6. 不许动（本轮红线）

1. **`vault.js:355` 的说明文案** —— `需要解锁 ${d.need} 件馆藏` 一字不改。
   `verify_vault.py:526` 正断言 `"需要解锁 8 件馆藏" == d[1]["note"]`，改了必红，且它本来就是对的。
2. **`vault.js:306` 的 `铸造徽记：已解锁 ${view.n} / 12`** —— 这里的 `view.n` 是**真·已解锁数**，是对的。
3. **`cast.js:45` 的 `① ② ③ ④ ⑤`** —— 画稿就这么写的（见 §3），只清 CSS 序号。
4. **`.turn__collab` 的空档** —— 见 §5，画稿如此。
5. **`tokens.css`** —— 头部写着"实现方不要改这里的值"；本轮只改**引用**，不改**定义**。
6. **全站横向溢出必须保持 0** —— 体检实测八页 `overflow` 全为 0，这是干净的，别改出来。
7. **史实数字与文案**（1955 / 4 小时 / C620-1 / 22 × 11.5 m / 50 吨等）一律不动。

---

## 7. 门禁影响（实现前先读这一节）

**结论：这四项没有任何一条会碰红既有断言 —— 但"没碰红"不等于"不用管门禁"，下面是逐条凭据。**

| 改动 | 门禁脚本 | 结论 |
|---|---|---|
| FIX-1 角标文案 | `verify_vault.py:526` 断言的是**说明**（不改）；`:506`/`:534` 里的"已解锁"是**注释** | 不需改脚本 |
| FIX-2 编号颜色 | 全仓 `verify_*.py` **无引用**（`cell-no` / `2E3640` / `c-line` 均 0 命中） | 不需改脚本，但**建议补断言**（见下） |
| FIX-3 步骤条 | `verify_w1.py:48` 只把 `.cast__steps` 列进"选择器是否存在"清单，元素未删 | 不需改脚本 |
| FIX-4 类名改名 | `verify_vault.py:518` 断言 `document.querySelectorAll('.vault__deriv-btn').length`，**元素数不变** | 不需改脚本 |

**要求新增的断言**（`scripts` 是代码，按项目惯例属于本轮的 diff）：

| 加到 | 断言 |
|---|---|
| `verify_vault.py` | 锁定卡（第 3 / 4 项）`[data-deriv-badge]` 可见且文本匹配 **`^需 \d+ / 12$`**；第 1 / 2 项 `hidden === true` |
| `verify_vault.py` | `.vault__cell-no` 的 computed `color` **不等于** `--c-line`，且对 `--c-bg` 的对比度 **≥ 4.5** |
| `verify_vault.py` | `.vault__deriv.is-locked .vault__deriv-btn` 的 computed `color` = `rgb(139, 147, 158)`、`font-weight` = `500` |
| `verify_ux.py` 或 `verify_cast.py` | `.cast__steps` 的 `list-style-type === 'none'` **且** `padding-left === '0px'`；第一项 `left` **仍为 1118.5 ± 1**（防 40px 位移回归） |

**另**：`scan_dead_selectors.py` 本轮从"报 1 个"变"报 0 个"—— 它是**验收工具**，不是需要改的脚本，
但要把这条读数写进交付自述。

---

## 8. 出门自检（实现方照做）

```bash
# 0) 本份提示词自身的行号/数值核对（设计侧已跑，实现方可复跑）
python .workbuddy/check_p0_fixes_prompt.py        # 期望：全绿

# 1) 死选择器归零（FIX-4 的验收）
python .workbuddy/scan_dead_selectors.py          # 期望：合计可疑 0 个

# 2) 四页门禁不回退
python .workbuddy/verify_vault.py                 # 期望：全绿（含新增断言）
python .workbuddy/verify_cast.py
python .workbuddy/verify_ux.py                    # 期望：46/46 保持
python .workbuddy/verify_turn.py

# 3) 重建 + 体积
cd demo && node node_modules/vite/bin/vite.js build
```

**体积**：本轮是四处小改，gzip 增量应在 **±50 B** 内。若超过 **1 KB**，先怀疑是不是顺手改了别的。
（当前基线 gzip(9) **205,969 B**，`index-BxXiIra1.js`。）

**交付自述**：`spec/IMPLEMENTATION-P0-FIXES.md`，含
①四处 diff 摘要 ②§1.3 / §4 的验收读数原始输出 ③`scan_dead_selectors.py` 前后读数
④新增断言清单与结果 ⑤新产物文件名与 gzip 体积。
