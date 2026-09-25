# 实现自述 · 头部与导航统一（体检 §6 · P1 第一批）

> **状态**：**已实现并验收**（2026-09-24）。依据 [`archive/spec/PROMPT-HEADER-NAV.md`](../archive/spec/PROMPT-HEADER-NAV.md)（**第八批**，出稿当日实现）。
> 范围 = 该稿 **§1（P1-1 头部两套 72/64）· §2（P1-2 品牌标记全站一套）· §3（P1-3 删 `#/entrance` 的重复导航）**；
> §4（P1-10 首屏基线）为**待裁定，未动**；§9 所列各项一律未顺手做。
> ⚠️ **前提状态**：~~`PROMPT-NAV-TRIM.md` **尚未落地**（`NAV` 仍 6 项）~~
> **📌 后记（2026-09-24 · 第九批）**：该稿**已随后落地并归档**（`archive/spec/PROMPT-NAV-TRIM.md`），
> `NAV` 现为 **5 项** —— 本批的「按 6 记」读数自此作废，§10-④ 的偏离**已消解**。体积亦随之变动：
> gzip9 **205,808 → 205,796 B**（K11 余 **173 B**、硬线仍差 **2.40 KiB**）⇒ **§7 的「余量 161 B / 差 2.41 KiB」是第八批当时读数，不是现值**。

---

## 0. 一句话

头部从**四套收成两套（72 / 64）**、品牌标记从**三种收成一种（26×26 · r6 · 铁水橙）**、
`#/entrance` 从**两条导航收成一条**；八页横向溢出仍全 0，六道门禁无回归，体积**净 −256 B（gzip9）**。

---

## 1. diff 摘要（①）

### §1 · 头部高度 —— 改 3 处 + 新增 1 条规则

| 文件 | 位置 | 改动 |
|---|---|---|
| `demo/src/styles/tokens.css:45` | `--hud-h` | **`56px` → `64px`**（**唯一的 token 值改动**，用户 2026-09-24 授权的一次例外；行内加注） |
| `demo/src/js/pages/cast.js:53` | `<header class="topbar">` | → `<header class="topbar cast__topbar">`（不新增行） |
| `demo/src/styles/layout.css` | 原 `L848-849` | 注释改 `高 64 = --hud-h`；`.turn__topbar { height: 64px }` → **`{ height: var(--hud-h) }`**；**新增** `.cast__topbar { height: var(--hud-h); }` |

**`--hud-h` 换值后为什么 0 处门禁要改（§6.1 的凭据复述）**：`--hud-h` 的全部消费者（`.hud` / `.halls` /
`.halls-notice` / `.history__scroll`）**全是 `var()` 引用，没有一处写死 56**（实测 §2 的 `noticeTop=124`、
`historyPadTop=124` 即为证）；20 份 `verify_*.py` **没有任何一处断言 56 这个高度**
（出现 `56` 的两处分别是权重 56% 的文案断言与 `.hud__xr` 选择器）。`verify_turn.py:180` 断言车削头部
`64±2` —— 车削页本来就没变，所以**正好不用动**。`#/cast` 的门禁凭据：`verify_cast.py` 全篇无几何断言，
`verify_ux.py` 的 `P0F3_cast_steps_no_auto_number` 只锁 `.cast__steps` 首项 **x 坐标** 1118.5 ± 1（本批只动高度）。

### §2 · 品牌标记 —— layout.css 四处 + 删两条

| 位置 | 改动 |
|---|---|
| `.logo__mark` 基础规则 | `8×8 / r2` → **`26×26 / r6`**（六个 HUD/顶栏页的取值都来自这里） |
| `.topbar .logo__mark` 覆盖（原 L51-55，5 行） | **整条删除**（基础值已是 26×26 r6，成了空覆盖） |
| `.turn__mark` | `border-radius: 4px → 6px`；`background: var(--c-surface-2) → var(--c-iron)`；**删** `transition: background-color .18s ease`（随 `:hover` 一起失去意义） |
| `.turn__mark:hover`（原 L857，1 行） | **整行删除**（底色已等同 `--c-iron`，成了空操作；`.logo` 本来就没有 hover 规则） |
| `.turn__page-title` | `16px / 500` → **`var(--fs-h3) / 600`** |

### §3 · 删 `#/entrance` 的重复导航

| 文件 | 删了什么 | 行数 |
|---|---|---|
| `demo/src/js/pages/entrance.js` | 注释 + `<nav class="sequence">…</nav>` 整块，**另删 1 行因此空出来的重复空行** | **9 行**（该稿 §7 记 8 行 + 1 行空行） |
| `demo/src/styles/layout.css` | 注释 + `.sequence` / `.sequence__item` / `.sequence__item.is-current` / `.sequence__sep` 四条规则 | **25 行** |

规格同步（§3.3③）：`spec/ENTRANCE-HISTORY-SPEC.md` 的三处「进场序列」设计侧**已在出稿时改掉**，
本轮落地后由设计侧把其中四处「尚未实现」的时态注记改成「已实现」（见 §10-③）。

---

## 2. §1.6 验收读数（原始输出，1440×900）

取证工具：`.workbuddy/probe_header_nav.py` + 本轮新写的 `.workbuddy/probe_header_nav_extra.py`
（产物 `shots/header_nav_before.json` / `_b.json` / `_after.json`；`_b` = **只落 §1+§2** 的中间态，作 §3 的基线）。

| 项 | 改前 | 终态 | 期望 | 判 |
|---|---|---|---|---|
| `#/cast` `.topbar` 高 | 72 | **64** | 64 ± 1 | ✅ |
| `#/entrance` `.hud` 高 | 56 | **64** | 64 ± 1 | ✅ |
| `#/hall` `.hud` 高 | 56 | **64** | 64 ± 1 | ✅ |
| `#/history` `.hud` 高 | 56 | **64** | 64 ± 1 | ✅ |
| `#/turn` `.turn__topbar` 高 | 64 | **64** | 64 ± 1（未变） | ✅ |
| `/` `.topbar` 高 | 72 | **72** | 72（有 `.nav`） | ✅ |
| `#/about` `.topbar` 高 | 72 | **72** | 72（有 `.nav`） | ✅ |
| `#/vault` | 只有 `.vault__back`（32.4） | 同左 | 无头部（未变） | ✅ |
| `main.turn` 的 `top` | 64 | **64** | 64（未变） | ✅ |
| `.halls` 的 `top`（三 HUD 页） | 56 | **64** | 64 | ✅ |
| `.halls-notice` 的 `top`（显形实测） | 116 | **124** | 124 | ✅ |
| `#/history` `.history__scroll` `padding-top` | 116px | **124px** | 124 | ✅ |
| `#/cast` 的 `.cast`（main）高 | 828 | **836**（y 72→64） | +8 | ✅ |
| `.cast__steps` 首项 `left` | 1118.5 | **1118.5** | 仍 1118.5 ± 1 | ✅ |
| `#/cast` 头部类名 | `topbar` | **`topbar cast__topbar`**，且**无 `.nav`** | 同左 | ✅ |
| 八页横向溢出 | 全 0 | **全 0** | 0 | ✅ |

> 该稿 §1.6 的「右栏协作面板 772」未单列：`verify_turn.py` 的 `U1.layout`（`stage_w 880 / panel_w 472`）
> 与 `H2`（`mainTop=64`）已覆盖同一结论，均 PASS。

---

## 3. §2.4 验收读数（原始输出）

| 项 | 改前 | 终态 | 期望 | 判 |
|---|---|---|---|---|
| `/` `.logo__mark` | 20×20 · r6 · iron | **26×26 · r6 · iron** | 26/26/6px | ✅ |
| `#/cast` `.logo__mark` | 20×20 · r6 · iron | **26×26 · r6 · iron** | 同上 | ✅ |
| `#/about` `.logo__mark` | 20×20 · r6 · iron | **26×26 · r6 · iron** | 同上 | ✅ |
| `#/entrance` `.logo__mark` | **8×8 · r2** · iron | **26×26 · r6 · iron** | 同上 | ✅ |
| `#/hall` `.logo__mark` | **8×8 · r2** · iron | **26×26 · r6 · iron** | 同上 | ✅ |
| `#/history` `.logo__mark` | **8×8 · r2** · iron | **26×26 · r6 · iron** | 同上 | ✅ |
| `#/turn` `.turn__mark` | 26×26 · **r4 · 近黑 `rgb(31,36,43)`** | **26×26 · r6 · `rgb(232,102,60)`** | 同上 | ✅ |
| `#/vault` | 无标记 | 无标记 | 无标记（画稿如此） | ✅ |
| `.turn__page-title` | 16px / 500 | **18px / 600** | 18/600 | ✅ |
| `.logo`（回归保护） | 18px / 600 | 18px / 600 | 不变 | ✅ |
| `.turn__mark:hover` | 存在（空操作） | **已删** | 无 hover 规则 | ✅ |

七页标记**三项全等**（尺寸 / 圆角 / 底色）——「全站一套」成立。顶栏三页 logo 由 20 → 26，
逐页截图比对无挤压（`shots/hn-*.png`）。

---

## 4. §3.5 验收读数（基线 = 只落 §1+§2 之后）

| 项 | §1+§2 基线 | 删 `.sequence` 后 | 期望 | 判 |
|---|---|---|---|---|
| `document.querySelectorAll('nav').length` | 2 | **1** | 1 | ✅ |
| 该 `<nav>` 的类名 | `['halls','sequence']` | **`['halls']`** | `halls` | ✅ |
| `.sequence` | 存在（rect 623.4, 837.6, 193.3, 38.4，可点 0） | **`null`** | null | ✅ |
| `.halls` 矩形 | x 0 / y 64 / w 1440 / h 66.4 | **x 0 / y 64 / w 1440 / h 66.4** | 逐值相同 | ✅ |
| `.halls` 可点项 | 5 | **5** | 不变 | ✅ |
| `.exhibit-card` | 1116, 108, 300, 301.5 | **同左** | 不变 | ✅ |
| `.entrance-strip` | 24, 747.6, 440, 60.4 | **同左** | 不变 | ✅ |
| `.hint` | 1272.6, 767.6, 143.4, 36.4 | **同左** | 不变 | ✅ |
| 横向溢出 | 0 | **0** | 0 | ✅ |
| 其余七页逐项（header / halls / marks / overflow / navCount） | — | **逐值一致** | 不变 | ✅ |

> ⚠️ **与该稿 §3.5 表的一处出入（实测推翻预测，非缺陷）**：该稿预计 `.exhibit-card` / `.entrance-strip` /
> `.hint` 的 `y` 会随 HUD 变高**各 +8** —— 实测**三者的矩形逐值不变**。原因是这三者是**锚在视口边**
> （`.entrance-strip` 左下、`.hint` 右下、`.exhibit-card` 右上），不随 `--hud-h` 走；
> 会跟动的只有 `.halls` / `.halls-notice` / `.history__scroll`（§2 已列）。**「删 `.sequence` 未引入位移」的结论不受影响。**

---

## 5. `scan_dead_selectors.py` 前后读数（③）

| 时点 | 读数 |
|---|---|
| 改动前（基线） | `233 个类名，0 个可疑` |
| 删 `.sequence`（JS 8+1 行 与 CSS 25 行 同删）后 | `230 个类名，0 个可疑` ✅ |
| 源码残留扫描（`demo/src` 全树搜 `sequence`） | **0 处** |

删 `.topbar .logo__mark` 覆盖规则不产生死选择器（`.logo__mark` 基础规则仍在，类名数 233 → 230 与删掉的
3 个 `.sequence*` 类名吻合）。

---

## 6. 新增断言 H1–H6（④）

| 加到 | 断言 id | 内容 | 结果 |
|---|---|---|---|
| `verify_w1.py` | `H1_hud_header_unified` | 三 HUD 页 `.hud` = 64±1；`.halls` 顶边 = 64；`.halls-notice` 顶边 = 124（提示条默认 `hidden`，断言里**临时显形**后量真实顶边）；`#/history` 的 `padding-top` = 124；溢出 0 | **PASS** |
| `verify_turn.py` | `H2_turn_header_is_immersive` | `.turn__topbar` = 64±1、`main.turn` 顶边 = 64、头部无 `.nav`（附记 mark r6/铁水橙、页名 18/600） | **PASS** |
| `verify_cast.py` | `H3_cast_header_is_immersive` | `.topbar` = 64±1、带 `cast__topbar`、**无 `.nav`**；`main.cast` 高 = **836**（= 基线 828 + 8）；steps 5 项、首项 left 1118.5 | **PASS** |
| `verify_w1.py` | `H4_brand_mark_unified` | 有标记的七页每枚 `.logo__mark` / `.turn__mark` **三项全等**：26×26 / `6px` / `rgb(232,102,60)`；`#/vault` 无标记 | **PASS** |
| `verify_w1.py` | `H5_turn_page_title_style` | `.turn__page-title` `fontSize`=18px、`fontWeight`=600 | **PASS** |
| `verify_step4c.py` | `H6_entrance_single_nav` | `#/entrance` nav 数 = 1、类名 = `halls`、`.sequence` 为 null；`.halls` x/w/h 与 §3 基线一致（0 / 1440 / 66.4）；`.hud` = 64；溢出 0 | **PASS** |

**H 组合计 6 / 6 PASS**（`verify_w1` 内 3 条 + turn/cast/step4c 各 1 条）。
取证辅助脚本（本轮新增，属验收工具）：`probe_header_nav_extra.py`、`probe_f4_noise.py`、
`probe_hall_crop0_overlap.py`。

---

## 7. 体积（⑤，与该稿 §7 对账）

| | 改前（P0 后） | 终态 | Δ |
|---|---|---|---|
| JS | `index-BCJFVi8a.js` raw 704,987 B · **gzip9 205,964 B** | `index-BvuiiyFV.js` raw **704,521 B** · **gzip9 205,808 B** | raw **−466** · gzip9 **−156** |
| CSS | `index-lHDqCoa_.css` raw 36,232 B · gzip9 7,269 B | `index-CJqwpVWL.css` raw **35,642 B** · gzip9 **7,169 B** | raw **−590** · gzip9 **−100** |

- **方向与该稿 §7 预期一致（净减）**：JS gzip9 −156 B（预期 −20~−120，略超上限 —— 因为 JS 侧实际删了
  **9 行**而非 8 行，多删的那行是重复空行）；CSS gzip9 −100 B（预期 −90~−220 ✅）。
- `--hud-h` 56px → 64px 同位数，字节数不变（符合该稿 §7 的提醒）。
- **K11（预算 205,969 B）：205,808 ≤ 预算 ✅**，余量 161 B。
- ⚠️ **评委硬线（198.57 KiB = 203,335 B）仍未过**：205,808 B = **200.98 KiB，仍差 2.41 KiB**
  （改前差 2.57 KiB，本批顺带追回 0.16 KiB）。**未自行砍内容**（归 **D1**，待用户拍板，见 README）。

---

## 8. 逐页截图（⑥，本批唯一有视觉后果的地方）

三个 HUD 页内容**下移 8px**、`#/cast` 内容**上移 8px**；以下 8 张为终态 1440×900 实拍
（`.workbuddy/shots/hn-*.png`），逐张目检**无新溢出、无新遮挡**：

| 文件 | 页 | 目检点 | 结论 |
|---|---|---|---|
| `hn-home.png` | `/` | 顶栏 72、标记 26×26（原 20）、导航未被挤压 | ✅ |
| `hn-entrance.png` | `#/entrance` | HUD 64、药丸行紧贴其下、**底部重复导航条已消失**、说明条/提示条不重叠 | ✅ |
| `hn-history.png` | `#/history` | HUD 64、长卷首屏下移 8px 后无遮挡 | ✅ |
| `hn-hall.png` | `#/hall` | HUD 64、三热点仍可见 | ✅ |
| `hn-cast.png` | `#/cast` | 头部 72→64、步骤条仍在右、三维视口变高无遮挡 | ✅ |
| `hn-turn.png` | `#/turn` | 标记**近黑 → 铁水橙**、页名 18/600、布局无跳动 | ✅ |
| `hn-vault.png` | `#/vault` | 仍只有返回键（未顺手补头部） | ✅ |
| `hn-about.png` | `#/about` | 顶栏 72、标记 26×26 | ✅ |

---

## 9. 六道门禁汇总（改前基线 → 终态）

| 门禁 | 改前基线 | 终态 | 判 |
|---|---|---|---|
| `verify_ux.py` | 47/47 | **47/47** | ✅ 无回归 |
| `verify_vault.py` | 41/41 | **41/41** | ✅ 无回归 |
| `verify_turn.py` | 42/43（唯一红 = K13b 体积 D1） | **43/44**（+1 = 新增 H2；唯一红仍是 K13b） | ✅ |
| `verify_cast.py` | E9 / T7 PASS | **E9 / H3 / T7 PASS** | ✅ |
| `verify_step4c.py` | 全节 PASS | **全节 PASS + H6 PASS**（A/B/B2/H6/C/D/E/F/G） | ✅ |
| `verify_w1.py` | F1–F6 无回归 | F 组无回归 + **H 组 3/3**；**F4 见 §10-①** | ⚠️ 见 §10-① |
| `scan_dead_selectors.py` | 0 | **0** | ✅ |

---

## 10. 偏离与发现（必须读）

1. **`verify_w1` 的 F4 出现一次红，判定为采样离群，非本批回归**。
   终态首轮跑 `F4.stripes` 的 crop0 `acnePeak.peak = 0.52 > 判据上限 0.412`。三层取证：
   - **crop0 区域内没有任何 DOM 浮层**（`probe_hall_crop0_overlap.py`：该框 x 86–432 / y 720–846 里只有
     WebGL 地板；三枚热点在 y 150/548/636、`.hint` 在 x 591，都不在内）⇒ 本批改的 CSS 浮层与
     `--hud-h` **碰不到这个区域**；
   - **同一构建连拍 15 帧**（`probe_f4_noise.py`，等待时长 6.0–10.05 s 扫过炉火呼吸相位）：
     crop0 峰值 **0.182–0.319**，15/15 过判据；crop1 稳定在 0.198–0.229；
   - **复跑 `verify_w1`**：crop0 = **0.234**，F4 **PASS**。
   ⇒ 17 次采样里 16 次落在 0.182–0.319，仅那次 0.52 出格，判**离群**。
   📌 **留给设计侧的发现**：F4 的对照口径是「**冻结的历史截图** vs **活拍的动画帧**」，而 crop0 恰好
   紧贴炉火暖光区（`F3.blobYfrac=0.768`）⇒ 该判据自带噪声（±0.07 量级）。建议下一轮给 crop0
   加噪声容差、或改「多帧中位数」口径 —— **本轮不改判据**（红线 8）。
2. **JS 实删 9 行（该稿 §7 记 8 行）**：删掉 `.sequence` 块后，`entrance.js` 里留下两个连续空行，
   顺手收敛成一个 ⇒ 多删 1 行。体积影响在噪声内（已计入 §7）。
3. **设计侧待办（本轮已由设计侧自己完成，不属实现方）**：`ENTRANCE-HISTORY-SPEC.md` 四处
   「尚未实现」的时态注记（L35-37 / L134 / L140 / L170）随本批落地改为「已实现」。
4. **该稿的前提「NAV-TRIM 已落地」实际未发生**（用户指定的执行顺序就是先做本批）。影响面 =
   所有「导航项数」读数仍按 **6** 记（`J1_home_topbar_no_cta` 的 `navCount=6`、`U12.home375` 的
   `nav_items=6`，均与改前一致）；该稿 §6.2 也写明「navCount 的基准由 NAV-TRIM 改，本批不动」。
   ⇒ ~~**`PROMPT-NAV-TRIM.md` 仍是可发的下一份**（含必改门禁 `verify_ux.py` L102 `navCount` 6→5）。~~
   **📌 后记（2026-09-24 · 第九批）**：该稿**已实现并归档** —— `NAV` 现为 **5 项**，
   `verify_ux.py` J1 与 `verify_vault.py` V11a 都已改 `== 5`（另核出该稿漏列的 V11a，见其自述 §4-①），
   **本条偏离已消解**。
5. **该稿 §6.1 的「必改 0 处」经实测成立**：六道门禁的判据一条没改，只有**新增**（H1–H6）。
6. **P1-10 未动**（该稿 §4 待裁定，方案 A/B/C 等用户拍板）；本轮实测顺带证实了该稿 §4.1 注的预测：
   `#/history` 的 h1 顶边由 182 → **190**（= 182 + 8），其余三页（249 / 186 / 200）不变。

---

## 11. 出门自检对照（该稿 §8）

| 步 | 命令 | 结果 |
|---|---|---|
| 0 | `check_header_nav_prompt.py` | 出稿期 **132 绿 / 0 红**（落地后必然转红 —— 使命结束，已标 ⛔） |
| 1 | `scan_dead_selectors.py` | **0** |
| 2 | `verify_turn.py` / `verify_w1.py` / `verify_ux.py` / `verify_vault.py` / `verify_cast.py` / `verify_step4c.py` | 43/44（唯一红 = 既有 D1）· H 3/3（F4 见 §10-①）· 47/47 · 41/41 · PASS · 全节 + H6 PASS |
| 3 | `vite build` | `index-BvuiiyFV.js` / `index-CJqwpVWL.css`（§7） |
