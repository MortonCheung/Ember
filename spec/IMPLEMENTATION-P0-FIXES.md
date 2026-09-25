# 实现自述 · P0 必修四项（体检 §6 的 P0 收敛版）

> **依据**：`archive/spec/PROMPT-P0-FIXES.md`（出稿 2026-09-23 深夜，2026-09-24 实现并归档 · **第七批**）。
> **交付日期**：2026-09-24。
> **构建产物**：`demo/dist/assets/index-BCJFVi8a.js`（704,987 B，gzip(9) **205,964 B**）
> · `index-lHDqCoa_.css`（36,232 B，gzip(9) 7,269 B）。
> **体积增量**：**gzip(9) 205,969 → 205,964 B = −5 B**（提示词预估 ±50 B 以内 ✔）；
> CSS gzip(9) 7,320 → 7,269 B = −51 B。**注释在压缩后不存在 ⇒ 净增量全部来自代码。**
> **门禁**：`scan_dead_selectors.py` **1 → 0** · `verify_vault.py` **41 / 41**（含 4 条新增）
> · `verify_ux.py` **47 / 47**（46 + 新增 1） · `verify_cast.py` **E9 PASS · T7 PASS**
> · `verify_turn.py` **42 / 43**（唯一 FAIL = `K13b_gzipUnder198_57`，**本轮之前即红**，见 §5）。

---

## 1. 四处 diff 摘要

| # | 文件 | 改动 | 说明 |
|---|---|---|---|
| FIX-1 | `demo/src/js/pages/vault.js` L357–364 | `if (d.need === 0) {hidden} else {hidden=!1; 「已解锁 N/12」}` → **`if (locked) {hidden=!1; 「需 N / 12」} else {hidden=!0}`** | 徽标改由**锁定态**决定（`d.need` 是门槛不是已解锁数）；`locked` 复用同函数 L349 已算好的变量，**未重算**；`d.need === 0` 的两项恒未锁定 ⇒ 自动并入隐藏分支 |
| FIX-2 | `demo/src/styles/layout.css` L1217 | `color: var(--c-line)` → **`color: var(--c-text-muted)`** | 描边色（`#2E3640`）当文字色 ⇒ 对比度 **1.55:1**，改后 **6.09:1**（AA 小字要 4.5）。L1219 的 `.is-on` 规则未动 |
| FIX-3 | `demo/src/styles/layout.css` L572 块 | 补 **`list-style: none;` + `padding: 0;`** | 文案自带 `①…⑤`，UA 只重置了 `ul`（`base.css:28`）⇒ `<ol>` 自动序号真的渲染了。两条**必须一起加**（见 §3.1）。**未改 `base.css` 全局重置**（见 §3.2） |
| FIX-4 | `demo/src/styles/layout.css` L1246 / L1249 + L1304 注释 | 两处选择器 **`.vault__deriv-name` → `.vault__deriv-btn`**（规则内容不动）；L1304 注释改为"见上方两条规则" | 9c 换类名后这两条规则**已失效**：字重 500 丢失、锁定态降对比**完全失效**（违反 `VAULT-SPEC` §5.3 第 162 行）。`vault.js` 未改（DOM 本就是新类名） |

**未动（§6 红线逐条遵守）**：`vault.js:355` 说明文案 · `vault.js:306` 徽记 · `cast.js:45` 的 `①②③④⑤` ·
`.turn__collab` 空档（§5，画稿有意留白） · `tokens.css` 定义值 · 全站横向溢出（八页仍为 0）· 史实数字与文案。

---

## 2. §1.3 / §4 验收读数（门禁原始输出，非转抄）

### FIX-1 角标（`#/vault`，空态 `view.n = 0`）

```json
P0F1_badge_by_locked {"derivs": [
  {"locked": false, "badgeHidden": true,  "badgeText": "",         "note": "完成一次浇铸即可获取"},
  {"locked": false, "badgeHidden": true,  "badgeText": "",         "note": "完成一次浇铸即可获取"},
  {"locked": true,  "badgeHidden": false, "badgeText": "需 3 / 12", "note": "需要解锁 3 件馆藏"},
  {"locked": true,  "badgeHidden": false, "badgeText": "需 8 / 12", "note": "需要解锁 8 件馆藏"}]}
```

| 项 | 期望（§1.3） | 实测 |
|---|---|---|
| 第 1 / 2 项（need 0） | 徽标 `hidden === true` | `true` ✔ |
| 第 3 项（need 3） | 可见、文本 `需 3 / 12` | `需 3 / 12` ✔ |
| 第 4 项（need 8） | 可见、文本 `需 8 / 12` | `需 8 / 12` ✔ |
| 同卡展开说明 | 一字不动 | `需要解锁 3 件馆藏` / `需要解锁 8 件馆藏` ✔ |

### FIX-2 编号色

```json
P0F2_cellno_contrast {"cellNoColor": "rgb(139, 147, 158)", "tokenLine": "#2E3640", "contrast": 6.09}
```

computed 前景 `rgb(139, 147, 158)` ≠ `--c-line`（`#2E3640`）✔，对 `--c-bg` 对比度 **6.09 ≥ 4.5** ✔。

### FIX-4 锁定态名称（§4 验收）

```json
P0F4_locked_name_style   {"locked3": ["rgb(139, 147, 158)", "500"], "locked4": ["rgb(139, 147, 158)", "500"]}
P0F4_unlocked_name_style {"unlocked": ["rgb(242, 244, 247)", "500"]}
```

锁定卡名称 computed `color = rgb(139, 147, 158)`、`font-weight = 500` ✔（与 §4 验收逐字一致）；
未锁定卡 = `rgb(242, 244, 247)`（`--c-text`）✔ —— 两条死规则**已复活**。

### FIX-3 步骤条（`#/cast`，1440×900）

```json
P0F3_cast_steps_no_auto_number {"listStyleType": "none", "paddingLeft": "0px",
  "olLeft": 1118.5, "firstLeft": 1118.5, "firstText": "① 取样", "items": 5}
```

`list-style-type === 'none'` ✔ · `padding-left === '0px'` ✔ · 第一项 `left = **1118.5**`（±1 内，**无 40px 位移**）✔ ·
5 项且首项以 `①` 开头 ✔。

---

## 3. `scan_dead_selectors.py` 前后读数（FIX-4 验收）

| | 读数 |
|---|---|
| **改前（基线）** | `layout.css：234 个类名，其中 1 个在源码里找不到 → .vault__deriv-name 行 1246, 1249`。合计可疑 **1** |
| **改后** | `layout.css：233 个类名，其中 0 个在源码里找不到`。合计可疑 **0** ✔ |

> ⚠️ **实现时踩到的一个坑（留给下一轮）**：该扫描器按行 `line.split("/*")[0]` 只剥**同一行内** `/*` 之后的文本。
> 第一版把 FIX-4 的说明写成**跨两行**注释，第二行 `（原 .vault__deriv-name 已无消费者…` 不含 `/*` ⇒
> 被当成"CSS 里的类名"算进死清单，读数**仍为 1**。改成**单行注释且不写旧类名字面量**后归零。
> ⇒ **在 CSS 里写注释提到一个已删类名，等于把它留在 CSS 里**（对这个扫描器而言）。

---

## 4. 新增断言清单与结果（§7 要求）

| 加到 | 断言 id | 内容 | 结果 |
|---|---|---|---|
| `verify_vault.py` | `P0F1_badge_by_locked` | 第 3 / 4 项 `[data-deriv-badge]` 可见且文本匹配 `^需 \d+ / 12$`（＝`需 3 / 12` / `需 8 / 12`）；第 1 / 2 项 `hidden === true`；同卡说明仍为 `需要解锁 N 件馆藏` | PASS |
| `verify_vault.py` | `P0F2_cellno_contrast` | `.vault__cell-no` computed `color` ≠ `--c-line`，且对 `--c-bg` 对比度 **≥ 4.5** | PASS（6.09） |
| `verify_vault.py` | `P0F4_locked_name_style` | `.vault__deriv.is-locked .vault__deriv-btn` computed `color = rgb(139, 147, 158)`、`font-weight = 500` | PASS |
| `verify_vault.py` | `P0F4_unlocked_name_style` | 未锁定卡名称 = `rgb(242, 244, 247)`、字重 500（补一道防"改过头"） | PASS |
| `verify_ux.py` | `P0F3_cast_steps_no_auto_number` | `.cast__steps` `list-style-type === 'none'` **且** `padding-left === '0px'`；第一项 `left = 1118.5 ± 1`；5 项、首项 `①` | PASS |

**辅助工具**：`verify_vault.py` 新增 `_rgb()` / `_chan()` / `contrast()` 三个纯函数（WCAG 对比度），供 P0F2 用。

---

## 5. 门禁全量结果

```
scan_dead_selectors.py                合计可疑 0 个                      ✔（基线 1）
verify_vault.py                       VAULT VERIFY: 41 / 41 PASS          ✔
verify_ux.py                          UX REVISION: 47 / 47 PASS           ✔（46 + 新增 P0F3）
verify_cast.py                        E9 PASS · T7 结论 PASS              ✔
verify_turn.py                        verify_turn: 42 / 43 PASS, fail=1   ⚠️ 唯一 FAIL = K13b（既有 D1）
```

**关于 `K13b_gzipUnder198_57`（唯一的红）**：它断言 gzip(9) ≤ **198.57 KiB** —— 这是**评委硬线**，
在**上一轮就已超**（R1-P3 的 205,969 B = 201.14 KiB），本轮 205,964 B 同为 **201.14 KiB**（短 2.57 KiB）。
**这不是本轮引入的**：本轮体积**净减 5 B**。该条属于长期挂账的 **D1 体积**项，出路（如按页 code-split three.js）
**另立一轮**，本轮不碰。

---

## 6. 产物与体积

| 文件 | raw | gzip(9) |
|---|---|---|
| `demo/dist/assets/index-BCJFVi8a.js` | 704,987 B | **205,964 B**（预算 205,969） |
| `demo/dist/assets/index-lHDqCoa_.css` | 36,232 B | 7,269 B |

**与上一轮对比**：JS `index-BxXiIra1.js` 205,969 → `index-BCJFVi8a.js` 205,964（**−5 B**）；
CSS 7,320 → 7,269（−51 B）。提示词 §8 预估「±50 B 内」—— JS 落在区间内 ✔。
（`vite build` 自报的 gzip 是 **level 6**，比门禁的 level 9 偏大，**勿与 K11 预算混用**。）

---

## 7. 复核记录（设计侧回读）

- 提示词出稿自检 `check_p0_fixes_prompt.py` 实现前**独立复跑：52 绿 / 0 红**（非转抄）。
- 实现只动 **`demo/src` 两文件 + 两个门禁脚本**；**HTML / SPEC / 设计基准未动**。
- 术语核对：本轮未涉及「铸造厂 / 铸造馆」与《铁流凝变》相关文案，无风险面。
