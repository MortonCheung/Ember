# IMPLEMENTATION · 顶栏导航去掉死项「数字藏品」（NAV 6 → 5）

> **状态**：**已实现并验收**（2026-09-24，**第九批**）。
> 依据 [`archive/spec/PROMPT-NAV-TRIM.md`](../archive/spec/PROMPT-NAV-TRIM.md)
> （出稿 2026-09-23 · 实现并归档 2026-09-24 · 正文一字未改）。
> ⚠️ 本自述由**设计侧**（兼实现）交付 —— 与本项目其它批次一致，证据全部为**脚本实测**，不用截图当证据。

---

## 0. 一句话

删掉 `demo/src/js/pages/home.js` 里 `NAV` 的死项 `{ label: '数字藏品', route: '' }`
（**6 项 → 5 项**），并把两处把它**写死成 6** 的门禁断言改成 5 ——
其中一处（`verify_vault.py`）是**提示词漏列的**，见 §4-①。

---

## 1. 改动清单（提示词说「只有一行」—— 实际 1 行代码 + 2 处门禁）

| # | 文件 | 行 | 改动 |
|---|---|---|---|
| ① | `demo/src/js/pages/home.js` | ~~L25~~ | **整行删除** `{ label: '数字藏品', route: '' },`（含行尾注释）。文件 230 行 → **229 行** |
| ② | `.workbuddy/verify_ux.py` | L101-103 | `j1["navCount"] == 6` → `== 5`，**并补** `and "数字藏品" not in j1["navTexts"]`（提示词 §2.1 的「防回潮」建议，已采纳） |
| ③ | `.workbuddy/verify_vault.py` | L454-457 | `len(navlinks) == 6` → `== 5`（**提示词漏列**，§4-①）。判据其余四项（`[3]=我的工牌/#/vault`、`[0]=首页`、`[1]=虚拟展厅`）**一字未动** —— 删的是下标 4，前四项下标不变 |

**没动的**：`home.js` L103 的渲染 `NAV.map(...)` · 首项 `aria-current`（`i === 0`）·
`about.js` 的 `import { NAV }` 与渲染（一字未改，实测 `about.js` 仍 5,904 B）·
`layout.css`（**零改动，构建产物 CSS 哈希未变** = `index-CJqwpVWL.css`，旁证）·
其余 5 项的文案/顺序/落点。

**删除用带边界断言的脚本**（`.workbuddy/del_nav_dead_item.py`，同 `del_flyover_css.py` 的做法）：
删前断言「数字藏品」在 `home.js` **恰好 1 处**且那一行含 `route: ''` 与「留待用户裁定」、
NAV 恰 6 项原序；删后断言 0 处、NAV 恰 5 项原序；任何一条不成立就**不写文件**。

---

## 2. N1–N7 逐条读数

| 编号 | 判据 | 读数 | 判定 |
|---|---|---|---|
| **N1** | `NAV` 长度 = 5，全数组 `数字藏品` 0 处 | `home.js` L21-25 = **5 项**（首页/虚拟展厅/互动体验/我的工牌/关于项目）；`demo/src/` 全目录 `数字藏品` **0 处**；运行时 `hasDeadItem = False` | ✅ |
| **N2** | 首页 `.nav .nav__item` 恰 5 个，文案序列逐字 | `["首页","虚拟展厅","互动体验","我的工牌","关于项目"]`，hrefs `["#/","#/entrance","#/cast","#/vault","#/about"]` | ✅ |
| **N3** | `#/about` 顶栏同样 5 项、序列一致 | **逐字一致**（同一份 `NAV`，「改一处两页生效」实测成立） | ✅ |
| **N4** | 落点不回归 | 虚拟展厅 → `#/entrance` · 我的工牌 → `#/vault` · 关于项目 → `#/about`，3/3 命中 | ✅ |
| **N5** | console 全 `[]` + `scrollWidth - innerWidth == 0` | 1440×900 与 375×812 **各一次**：console 均 `[]`、overflow 均 **0**（375 下 `navDisplay = none`，DOM 仍 5 项但不渲染） | ✅ |
| **N6** | 门禁重跑全绿 | 见 §3 表 —— `verify_ux` **47/47**（J1 改后）· `verify_vault` **41/41**（V11a 改后）· 其余四道无回归 | ✅ |
| **N7** | `gzip(9)` ≤ 205,969 B | JS **205,796 B**（余 **173 B**）· raw 704,489 B。**删一行中文只省 12 B**（205,808 → 205,796）—— 再次印证「中文文案在 gzip 下近乎免费」 | ✅ |

**N2–N5 取证脚本**：`.workbuddy/probe_nav_trim.py`（本轮新增，复用 `cdp_shot` 的
`WS` / `console_problems` / `nav_full` 三件套）→ 读数落 `shots/nav_trim.json`。

---

## 3. 门禁汇总（六道，全串行、共用 Edge profile）

| 门禁 | 读数 | 备注 |
|---|---|---|
| `verify_ux.py` | **47 / 47 PASS** | **J1 现读 `navCount: 5`** 且文案序列正确、`数字藏品` 0 处；其 G 组同时给出 **cast 45/45 · hall 61/61 · entrance 22/22 · turn 63/63 · vault ok**（= 提示词 N6 列的那份清单，一次跑全） |
| `verify_vault.py` | **41 / 41 PASS** | **V11a 现读 5 项**；`V11b` 点 `.nav__item[3]` 仍落 `#/vault`（下标未变）；375 两条 `scrollW == 375` ✅ |
| `verify_cast.py` | E9 / **H3** / T7 PASS | H3：`topbarH 64`、`mainH 836`、`steps 5`、`firstLeft 1118.5` —— 与上批逐值一致 |
| `verify_step4c.py` | 各节 PASS + **H6 PASS** | H6：`#/entrance` nav 数 **1**（`.halls`）、`hudH 64`、overflow 0 —— 本批不碰序厅，逐值不变 |
| `verify_w1.py` | **H 组 3/3 PASS** | H4：八页标记仍全等 `26×26 r6 rgb(232,102,60)`。**F4 crop0 = 0.251**（在 0.412 判据带内）—— 上轮的「采样离群」结论再次成立 |
| `verify_turn.py` | **43 / 44 PASS** | **唯一红 = 既有 D1（`K13b`）**，与本批无关。`U12.home375` 现读 `nav_items: 5`（判据 `>= 3`，PASS）。`K13a` 读 `py_gzip9_bytes: 205796` |
| `scan_dead_selectors.py` | **0 可疑**（230 类名） | 本批零 CSS 改动，读数与上批持平 |

**产物**：`demo/dist/assets/index-CQDBuEqM.js`（raw **704,489 B**，−32）/ gzip(9) **205,796 B**（−12）·
`index-CJqwpVWL.css`（raw 35,642 / gzip9 7,169，**哈希未变 = 零 CSS 改动**）。
K11 预算 205,969 ✅ 余 173 B；**评委硬线 198.57 KiB 仍差 2,461 B（2.40 KiB）= 既有 D1**，未自行处理。

**改动前对照**：上批的八页截图 `shots/hn-home.png` / `hn-about.png`（顶栏 6 项，含「数字藏品」）。

---

## 4. 偏离与发现（提示词没写 / 写得不准的，全部单列）

| # | 发现 | 处置 |
|---|---|---|
| **①** | **提示词 §2.1 说「这是本轮唯一要动的门禁断言」—— 不成立。** `verify_vault.py` 的 `V11a_home_nav_has_vault_4th` 也把 `len(navlinks) == 6` 写死（L455）。这正是「门禁断的是**条数**、按符号 grep 抓不到」的类型：`数字藏品` 这个字符串在任何 `verify_*.py` 里**零出现**，但 `== 6` 会死。**出稿时的核查脚本只查了 `verify_ux.py`，没查 `verify_vault.py`** | 已改 `== 5`（见 §1-③）。教训已回写 `PLAYBOOK` 与 `prompt-preflight-check` 技能：**逐个扫 `verify_*.py` 里的 `== N`，而不是只扫被删的符号** |
| ② | **`home.js` L17 的注释「文案与顺序对齐设计稿 S01」已不准确** —— S01 的顶栏是 R1 之前的旧态（缺「我的工牌」、挂着已删的 CTA），`design/README.md` 已声明「顶栏没有一张画稿是对的、以 S11 那一行为唯一权威」。该注释在**本批之前**就已过期 | **未动**（提示词 §1 明写「只有一行」、§4 禁止顺手改）。**建议下一轮**顺手把它改成「文案与顺序对齐 S11 顶栏（唯一权威）」。此处登记，不算遗漏 |
| ③ | `verify_step4c.py` 的 `R6.bundle` 行与 `verify_w1.py` 的 `gzip` 行都还挂着 **190 KiB（194,560 B）** 的旧上限，`ok: false` **每跑必打印**。它们是 **print 诊断、不进 PASS 计数**，所以门禁读数不受影响 | **未动**（既有陈旧行、与本批无关）。登记：这两处的 `190 KiB` 是**过期口径**，别拿它当判据 |
| ④ | `.workbuddy/vault_nav375.py` / `facts_header_struct.py` 等一次性工具里仍有「NAV 5 项含数字藏品」的旧口径 | 一次性诊断工具（非门禁、非交付），按「有意保留的历史件」处理，不改 |
| ⑤ | `spec/IMPLEMENTATION-UX-REVISION.md` 的 **J1 行**（L170）读数 `navCount=6` —— 提示词 §2.2 只列了 L47 与 §3.6 两处，这是**第三处** | 已按本项目惯例**就地加注**（§2 的表后加 ⚠️ 注，保留原读数不篡改） |
| ⑥ | `check_nav_trim_prompt.py` 落地后**必然转红**（它断言的是改动前的 L102 `== 6`、`layout.css` 行号等） | 按「`check_*` 是出稿前工具、不是验收」的既定规矩，加 ⛔「使命终结」抬头，不当回归 |
| ⑦ | **体积对账**：删掉「一行中文 + 一条注释」gzip9 只省 **12 B** | 数据点已回写 `PLAYBOOK`：**「预判删 X 能省多少」必须先跑一次 `gzip.compress` 实测**，中文低重复文本的 gzip 省不到哪里去 |

---

## 5. 截图（三张，均 `tools/screenshot.py` 实拍）

| 文件 | 内容 |
|---|---|
| `.workbuddy/shots/nav_trim_home.png` | 首页顶栏（1440×900）—— **5 项，无「数字藏品」**；对照改前的 `shots/hn-home.png`（6 项），除导航外版式逐像素一致 |
| `.workbuddy/shots/nav_trim_about.png` | `#/about` 顶栏（1440×900）—— 同样 5 项，「关于项目」高亮态正确 |
| `.workbuddy/shots/nav_trim_375.png` | 首页 375×812 —— `.nav` 正常隐藏（≤820px 断点），无横向溢出 |

---

## 6. 出门自检

- [x] N1–N7 全过（§2 表）
- [x] 两处被写死的门禁断言都已改（§1-②③）
- [x] 六道门禁 + `scan_dead_selectors` 全绿（唯一红 = 既有 D1 `K13b`，与本批无关）
- [x] `about.js` / `layout.css` / 其余 5 项一字未动（CSS 哈希未变 = 旁证）
- [x] 三张截图已落盘并目检
- [x] 偏离单独成表（§4，7 条）
- [x] 体积未自行优化（D1 仍待用户裁定）
