# IMPLEMENTATION-VAULT · 数字工牌（`#/vault`）实现自述

> **依据**：`spec/VAULT-SPEC.md`（唯一依据）· `archive/spec/PROMPT-VAULT.md`（提示词）· `design/S05-数字工牌.png`（版式）
> **实现方**：代码工作流 · **日期**：2026-09-21/22 · **结论**：V 组 **31/31 PASS**，V12 四门禁全部不回归

---

## §1 做了什么

### 1.1 新增文件（3 个）

| 文件 | 行数 | 字节 | 职责 |
|---|---|---|---|
| `demo/src/js/pages/vault.js` | 483 | 20,634 | 页面：三态渲染、工牌数据、姓名编辑、图鉴带、衍生品、导出编排 |
| `demo/src/js/ui/emblem.js` | 273 | 11,924 | `drawEmblem(ctx, x, y, size, data)` —— 页面与海报**共用同一函数** |
| `demo/src/js/ui/poster.js` | 149 | 5,798 | `renderPoster()` / `exportPoster()` —— 1080×1350 Canvas 2D 重绘 + 下载 |

合计新增 **905 行**源码。

### 1.2 授权最小改动（3 个文件，均为追加/最小改）

| 文件 | 改动 | 行 |
|---|---|---|
| `demo/src/js/main.js` | 加 `import { renderVault }`；`PAGES` 加 `vault`；`TITLES` 加标题 | **L12 / L24 / L34** |
| `demo/src/js/pages/home.js` | `NAV` 数组**插入一项** `{ label:'我的工牌', route:'vault' }` | **L20**（第 4 项） |
| `demo/src/styles/layout.css` | **只追加** `.vault__*` 选择器块（含 `@media` 内 1 条） | 无既有选择器被改 |

**冻结文件零改动**：`tokens.css`、`router.js`、`scene/*`、`cast.js`、`turn.js`、三个 `hall` 形态页、`design/*`。

### 1.3 关键实现点

- **徽记是数据驱动 canvas**：12 格刻度环按 `unlocked.length` 点亮（`--c-iron`），36 根底环刻度 `globalAlpha=0.40`；环内画 `unlocked` **最小序号**对应铸件的简笔轮廓；空态画炉口拱形 + 「尚未点火」。
- **`n` 唯一来源 = `im.cast.unlocked` 数组长度**。`reconcileUnlocked(badge, n)` 在 `badge.unlocked` 字符串不一致时**以数组为准并回写**。
- **海报不截三维帧**：`viewport.js` 未开 `preserveDrawingBuffer`，故 `poster.js` 用 Canvas 2D 独立重绘 1080×1350，**与页面共用 `drawEmblem()`** → 像素级一致。
- **姓名编辑由本页承担**（覆盖 STEP3 §6.2「步骤⑤」）：`contenteditable` 之外用 `.replace(/^\s+|\s+$/g,'').slice(0,8)` 双保险截断。
- **衍生品补锁定态**：4 件按 `need: 0/0/3/8` 判定，未达阈值渲染虚线砂箱图标 + 半透明（规格要求，画稿只有解锁态）。
- **零 WebGL / 零贴图 / 零新依赖 / 零 `Math.random()`**。

---

## §2 偏离了什么（全部标「实现方判断」）

> 规格与实现如有冲突，下面每条都写清了「规格怎么写 / 我怎么判 / 为什么」。

### D1【实现方判断】本页**无顶栏、无 HUD、无场馆导航**
- 规格：§2 只说「两栏 620 / 820」，未写顶栏。
- 我最初照其余页面惯性加了 `.vault__topbar`（72px）→ **左栏内容总高变成 932 > 900，溢出**。
- 回读 `design/S05-数字工牌.png`：**画稿实测无顶栏**。故删除 `.vault__mark` / `.vault__page-title` / `.vault__topbar-tail` 三条样式与对应 DOM。删除后 `left_bottom = 830 ≤ 900` ✓。
- **保留**：右栏眉标「第四层 · 带走」（画稿有）。

### D2【实现方判断】删除徽记环内的 `n/12` 文字
- 规格 §3 未要求环内中心文本。
- 我一度自作主张加了 `n/12`，复核 `S05` 画稿后**删除** —— 画稿徽记中心只有铸件轮廓，`n/12` 由卡头「已解锁」承担。

### D3【实现方判断】右栏正文与标题**逐字取画稿原值**
- 标题：`一次体验，换来一张自己的工牌`（画稿原值）
- 正文：`完成一次浇铸后，系统会为你生成唯一编号的数字工牌 —— 徽记、评分与馆藏图鉴都会随之点亮。`
- 我一度写成自创分析句 → **改回画稿原值**。

### D4【实现方判断】姓名 8 字截断**双保险**
- 规格 §7 要求「8 字上限」。`maxlength="8"` 只拦用户键入，**程序性赋值 `.value` 不触发浏览器截断**（V7 实测 `after_over` 曾为 10 字）。
- 故在 `finish()` 里补 `.slice(0, 8)`，并先 `.replace(/^\s+|\s+$/g,'')` 去首尾空格。

### D5【实现方判断】海报 `document.fonts.ready` 加 **2s 超时兜底**
- `index.html` 有 Google Fonts 外链。评委机**断网**时 `fonts.ready` 会**永久挂起** → 导出按钮永久卡死。
- 故 `Promise.race([document.fonts.ready, timeout(2000)])`；超时则用当前可用字体绘制，**宁可字形降级，不可功能卡死**。

### D6【实现方判断】正文用 `--fs-body`(15px) 而非 `--fs-caption`(12px)
- 规格 tokens 裁定表把画稿 14px 映射到 `--fs-body`(15px)。
- 我一度误用 `--fs-caption` → 行高与占位都不对，且左栏更高。改回 `--fs-body` 后与画稿一致。

### D7【实现方判断】按钮行等宽 `flex: 1 1 0`
- 画稿两枚按钮**实测等宽 ≈346px**。故 `.vault__poster, .vault__next { flex: 1 1 0; height: 48px; }`，而非按内容宽度自适应。

### D8【实现方判断】存储不可用提示用 `position: fixed`
- 规格 §11 C 态要求「提示存储不可用」。若做成文档流内元素会**挤占 878 高度预算**。
- 故 `.vault__storagetip { position: fixed; top:0; z-index:60 }` —— 浮在顶部，不参与左栏高度计算。

### D9【实现方判断】`ol/ul/dl` 加 `margin: 0`
- 图鉴带初始 `dex_h = 222`（规格预算 192），差 30px。根因是 **UA 默认 `margin` 未清零**。
- 修：`.vault__meta` / `.vault__dex-grid` / `.vault__derivs` / `.vault__body` 全部 `margin:0`，并补 `padding:0; list-style:none`。

---

## §3 不回归证明（V12 四门禁逐个读数）

| 门禁 | 读数 | 判定 |
|---|---|---|
| **V12a** 浇铸 `selfTest()` | **45 / 45 PASS**，`fails: []`，`wired` 正常 | ✓ |
| **V12b** 铸造馆 `layout()` | **61 / 61 PASS**，`sections_all_true: true`，`fails: []` | ✓ |
| **V12c** 序厅 `entranceLayout()` | **22 / 22 PASS**，`overall: true`，`fails: []` | ✓ |
| **V12d** 车削页既有行为 | selfTest **80 / 80 PASS**；`n=420`、`f=0.52`（与交付值一致）；`.turn__roles` 残留 **0** | ✓ |
| **V12e** 浇铸页按钮/步骤完好 | `turnBtn: true`、`badgeBtn: true`、`steps: 5` | ✓ |
| **V12f** `#/vault` 路由注册 | V11b 实测落地 `#/vault`；`cast.js L482` / `turn.js L499` 的 `routes.includes('vault')` 分支**自动**从降级文案切为真跳转，**无需改这两个文件** | ✓ |

> **V12f 是开工前事实核查的产物**：核查时 grep 到 `cast.js` / `turn.js` 已写好 `routes.includes('vault')` 分支，
> 据此在提示词里写明「注册路由即可，不用改这两个文件」，**省掉一次误改**。

---

## §4 console 零报错取证（CDP 协议层，非目视）

取证手段（`.workbuddy/cdp_shot.py::console_problems()`，被 `verify_vault.py` 复用）：

- `Runtime.enable` + `Log.enable` 后，**所有 CDP 事件挂号到 `ws.events`**（早期版本直接丢弃事件 = 空读，已修）。
- 三类事件计入问题清单：
  - `Runtime.exceptionThrown` → `kind: "exception"`
  - `Runtime.consoleAPICalled` 且 `type ∈ {error, warning, assert}`
  - `Log.entryAdded` 且 `entry.level ∈ {error, warning}`
- 每次导航后取 `ev0 = len(ws.events)`，导航结束比对。

**实测读数**：

| 场景 | 结果 |
|---|---|
| 有工牌态（n=3） | `console: []` |
| 空态（清空 storage 直开 `#/vault`） | `console: []` |
| 375px 复测 | `console: []` |

---

## §5 V 组逐条对照（31 / 31 PASS）

完整 JSON：`.workbuddy/_vault_results.json`。**所有判定均为数值取证，截图仅留证。**

| 编号 | 判定依据（实测值） | 结论 |
|---|---|---|
| **V1** | 卡 `[400, 560]`；徽记 `[344, 210]`（高 210 ✓）；左栏 `620`；右栏 `820`；`left_bottom = 830 ≤ 900`；`dex_h = 192` | PASS |
| **V2** | ① `[0,4,8]` → `flange`（最小序号 0）② `[8]` → `valve` ③ `[8,4]` → `bed`（最小序号 4，非数组首元素）④ 空 → `null` + `statUnlock "0 / 12"` | PASS |
| **V3** | 页面徽记裁片 `[210,210]`、`diffPage = 0`；海报裁片 `diffPoster = 0`；落墨像素 `270400 / 270400` = 520² 全图 | PASS |
| **V4** | 图鉴 `count = 12`（6×2）、`on = 3`、12 条 `title` 顺序与 `sandbox_0…11` 馆藏名逐一相符 | PASS |
| **V5** | `n=2 → [F,F,T,T]`；`n=3 → [F,F,F,T]`；`n=8 → [F,F,F,F]` | PASS |
| **V6** | 空态 `hasBadge=false`、`n=0`、`casting=null`、姓名 `未署名`、等级 `尚未定型`、评分/时间 `—`、`posterDisabled=true`、`console=[]`；按钮文案 `去亲手浇铸 →` → `cast`；提示 `完成一次浇铸即可生成工牌` | PASS |
| **V7** | `maxlength=8`；超长输入落为 `一二三四五六七八`；空串不写入（保持原值）；`Esc` 取消有效；去首尾空格得 `赵铁柱`；`keys_after` 仍为原 **6 键**（只改 `name`）；空态下也可编辑（`王小雨`） | PASS |
| **V8** | 尺寸 `1080×1350`（`pixels = 1458000`）；`pixel_diff = 0`（同数据两次导出逐像素一致）；`toBlob` 得 **121,027 B**；下载名 `工牌-NO.000137.png`；`URL` 已 `revoke`，`leaked = 0`；按钮文案 `已导出 ✓` | PASS |
| **V9** | 构造脏数据 → `n = 5`（以数组为准），回写 `im.cast.unlocked = "5/12"`，`reconciled = true` | PASS |
| **V10** | `canvases = 1`（仅徽记）、`webgl = 0`、`viewport = 0`、`images = 0` → **draw call = 0、贴图 0 增量** | PASS |
| **V11** | ① 首页导航第 4 项 → 点击落地 `#/vault`（`card: true`）② 有工牌次按钮 → `#/hall` ③ 375px `scrollW === clientW === 375`（无横向滚动）④ 首页 375px 不破版、导航 `display: none` | PASS |
| **V12** | 见 §3（四门禁 + 按钮完好 + 路由注册） | PASS |
| **C 态** | `storageOk = false`，提示文案 `本次记录不会保存` | PASS |

---

## §6 性能实测

### 6.1 本页运行时

| 指标 | 实测 | 约束 |
|---|---|---|
| WebGL 上下文 | **0** | = 0 ✓ |
| `<canvas>` 数量 | **1**（徽记 2D） | — |
| 图片资源 | **0** | 贴图 0 增量 ✓ |
| 运行时依赖 | **0 新增**（无 `html2canvas` 等） | ✓ |

### 6.2 构建产物体积（详见 `.workbuddy/_vault_size.md`）

| 产物 | 改动前（pristine） | 改动后 | 增量 |
|---|---|---|---|
| JS gzip | 198.96 KB | **198.56 KB** | **−0.40 KB** |
| CSS gzip | 5.81 KB | **6.45 KB** | +0.64 KB |
| JS raw | 668.98 kB | **686.23 kB** | +17.25 kB（未压缩） |

**全站 gzip 远低于 215 KB 上限。**

> ⚠️ **提示词基线已过期**：`PROMPT-VAULT` 写「基线 184.92 KB」，
> 实测 pristine（暂存 vault 全部改动后重建）为 **198.96 KB** —— W3 + turn 包已把体积推高。
> 按 215 上限计，vault 实际可用预算 **16.04 KB**，实测增量 **−0.40 KB**，远低于预算。
> （`release/dist` 快照里的 171.57 KB 是 **09-18 的旧值**，不可作基线。）
>
> **JS gzip 反而变小**的原因：新增 3 个模块字符高度重复（中文文案 + 重复类名）被 gzip 字典吸收；
> 同时 `main.js` 新增 import 让 rollup 模块边界重排，压掉了原有冗余。

---

## §7 截图索引（1440×900，仅留证）

| 文件 | 内容 |
|---|---|
| `.workbuddy/shots/vault_1_has_badge_n3.png` | ① 有工牌（`n = 3`）—— 与 `S05` 高度一致 |
| `.workbuddy/shots/vault_2_all_unlocked_n8.png` | ② `n = 8` 全解锁（四件衍生品全亮） |
| `.workbuddy/shots/vault_3_emblem_valve_n1.png` | 徽记 `[8]` → 阀件轮廓，1 段点亮 |
| `.workbuddy/shots/vault_4_emblem_n2.png` | 徽记 `n = 2` → 第 3、4 件衍生品锁定 |
| `.workbuddy/shots/vault_5_empty_state.png` | ③ 空态（炉口拱形 + 尚未点火） |
| `.workbuddy/shots/vault_8_name_editing.png` | ④ 姓名编辑中 |
| `.workbuddy/shots/vault_poster_export.png` | ⑤ **导出的真海报**（1080×1350，121,027 B） |
| `.workbuddy/shots/vault_6_375px.png` | ⑥ 375px 竖排版式 |
| `.workbuddy/shots/vault_7_375px_home.png` | 首页 375px（导航收起，不破版） |
| `.workbuddy/shots/vault_9_storage_blocked.png` | C 态存储不可用提示 |

---

## §8 复现方式

```bash
# 1. 构建（cwd = demo/）
node node_modules\vite\bin\vite.js build

# 2. 起预览（--strictPort；重建后必须重启，sirv 会缓存文件 manifest）
node node_modules\vite\bin\vite.js preview --port 4173 --strictPort

# 3. 跑验收（必须无代理环境；沙箱代理拦 loopback 返回 502）
<managed python> .workbuddy/run_noproxy.py .workbuddy/verify_vault.py   # → 31/31 PASS
<managed python> .workbuddy/run_noproxy.py .workbuddy/save_poster.py     # → 真海报 PNG
```

**两个踩过的坑（复现者必读）**：

1. **`?debug=1` 必须在 hash 之前** —— `router.js` 把 hash 后整串当路由 key，
   `#/vault?debug=1` 会回落首页。正确 URL：`http://127.0.0.1:4173/?debug=1#/vault`。
2. **改完 `localStorage` 必须真重载** —— `main.js mount()` 里 `if (key === activeKey) return;`
   会让同 URL 导航**不重挂**，`n` 恒为旧值。验收脚本必须走 `nav_full()`（先 `about:blank` 再导航）。

---

## §9 规格外未尽事项

- **无**。V2/V3/V4/V5/V6/V7/V8/V9/V10/V11/V12 全部完成，C 态额外覆盖。
- 未触碰任何冻结文件；`design/` 下图片一字未改。

---

*代码工作流 · 2026-09-21/22*
*依据：`spec/VAULT-SPEC.md` §13/§15 · `archive/spec/PROMPT-VAULT.md`「交付要求」①–⑥*
*验收产物：`.workbuddy/_vault_results.json`（31/31）· `.workbuddy/_vault_size.md` · 上方 10 张截图*
