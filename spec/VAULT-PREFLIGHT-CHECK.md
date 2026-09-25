# PROMPT-VAULT.md 开工前核查报告

**核查日期**：2026-09-22
**对象**：`archive/spec/PROMPT-VAULT.md`（数字工牌 `#/vault` 交接提示词，状态「可发」）
**方法**：把提示词里每一条「现状 / 行号 / 名单 / 算式 / 画稿描述」当**待验命题**，
用脚本回代码、回画稿重核（同「写提示词前必做事实核查」的方法，反向跑一遍）。
**结论**：13 条引用全部属实，可以开工；另有 3 条提示词没覆盖的新发现，实现时要处理。

---

## 一、逐条核对（提示词引用 → 实测）

| # | 提示词的命题 | 实测 | 结论 |
|---|---|---|---|
| 1 | `cast.js` L482 写好 `routes?.includes('vault')` 分支 | L482 = `if (routes?.includes('vault')) go('vault');`（降级文案 L483） | ✓ |
| 2 | `turn.js` L499 同上 | L499 同句（降级文案 L500） | ✓ |
| 3 | `cast.js` L476 里 `badge.unlocked` 存字符串 `"3/12"` | L476 = ``unlocked: `${unlocked.size}/12` `` | ✓ |
| 4 | 步骤⑤从未实现姓名输入，`name` 恒空串 | L472 = `name: badge.name ?? '',`，全文件无姓名输入框 | ✓ |
| 5 | 12 件馆藏名（提示词列出的名单） | 正则抽 `SANDBOXES` 的 `collection` 字段 diff：**MISSING=[] / EXTRA=[]** | ✓ |
| 6 | 铸件轮廓 4 选 1：flange/bed/valve/gear | `CASTINGS` keys 恰为这 4 个 | ✓ |
| 7 | `main.js` 只需加 `vault` 路由 + 标题 | `PAGES`/`TITLES` 现有 6 键（''/hall/cast/entrance/history/turn），无 vault | ✓ |
| 8 | 首页导航只加一项「我的工牌」，排在互动体验后 | `NAV` 现状 5 项：首页/虚拟展厅/互动体验/数字藏品/关于项目 | ✓ |
| 9 | `layout.css` 只追加 `.vault__*` | 全文件 0 个 `.vault` 选择器 | ✓ |
| 10 | `.btn[disabled]` 样式已存在 | `layout.css` L517–518 确有 | ✓ |
| 11 | `.btn` / `.btn--primary` / `.btn--ghost` 基类可复用 | `base.css` 三者齐全 | ✓ |
| 12 | `viewport.js` 未开 `preserveDrawingBuffer` | 渲染器参数只有 antialias / powerPreference / alpha | ✓ |
| 13 | 本页零 WebGL（纯 DOM）| vault 不挂 viewport 即成立（实现约束，非现状命题） | — |

## 二、数值复算（全部脚本算，不心算）

| 算式 | 结果 |
|---|---|
| 左栏高度 `56+560+22+20+164+56` | **878 ≤ 900** ✓（余 22） |
| 图鉴带 `6×78+5×8` vs 左栏内容宽 `620−112` | **508 = 508** ✓ |
| 衍生 2 列单卡 `(708−16)/2` | ≈ 346，铺满无空白 ✓ |
| 画稿 3 列 `3×240+32` vs 708 | 752 > 708，不成立 → 裁定 2 列正确 ✓ |

## 三、S05 画稿实测（1440×900 原尺寸像素扫描）

- **藏品卡**：(110,170)–(509,729) = **399×559** ≈ 规格的 400×560 ✓
- **徽记灰占位**：实测 **343×373（近方形）**——与 §2 裁定的 344×210 横条不同，
  恰好佐证「占位图不是设计意图，形状以规格裁定为准」✓
- **衍生宫格**：列段 676–915 / 932–1171（各 239 宽）、行段 349–498 / 515–664（各 149 高）
  → 画稿 4 卡确为 240×150，与「240 宽排不下」的裁定叙述一致 ✓
- **主按钮**：橙色带 676–1022（宽 346，与 2 列卡同宽）✓

## 四、⚠️ 三条新发现（提示词没覆盖，实现时必须处理）

### 1. gzip 基线已过期 —— 本包预算按 ≤16 KB 控制，不是 20 KB
提示词写「当前基线 184.92 KB / 本轮 ≤20 KB」。2026-09-22 实际 build：
**JS gzip = 198.96 KB**（W3 + turn 两轮涨了约 14 KB）。全站上限 215 不变，
留给 vault 的真实余量 = **16.04 KB**。实现按 ≤16 KB 控制；
若超了，先压缩 poster.js 的常量表，不考虑代码拆分（评委机要离线可跑）。

### 2. V11 的 375px 断言口径要改写
`.nav { display: none }`（`layout.css` L766，≤820px 生效）—— 375px 下**新增导航项根本不渲染**。
所以「首页导航新增项在 375px 下不破版」这句验收在现状下**恒真**，
真正要断言的是「**375px 无横向滚动**」（vault 页自身不破版），验收脚本按这个口径写。

### 3. `document.fonts.ready` 在断网环境会挂 —— 海报必须超时回落
海报绘制前要求 `await document.fonts.ready`（防中文字形回落），但评委机可能无外网
（Google Fonts 外链在 `index.html`），`fonts.ready` 会长挂 → 按钮永久「生成中…」。
实现补：`Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))])`，
超时直接用系统字体栈画（Token 字体栈本就有苹方/雅黑回落）。

### 附带更正（不影响实现，但报告里别照抄）
`VAULT-SPEC §9` 表格把序号计数键写成 `im.cast.badge_no`，实际代码是 **`im.badge.no`**
（`cast.js` L37 `K_BADGE_NO`）。本页只读 `badge.no` 不自增、不碰该键，所以无实际影响。

## 五、开工清单（已就绪）

- 新建：`src/js/pages/vault.js`、`src/js/ui/emblem.js`（`drawEmblem()`）、`src/js/ui/poster.js`
  （**`src/js/ui/` 目录现不存在，需新建**）
- 最小改动：`main.js`（PAGES + TITLES 各加 1 行）、`pages/home.js`（NAV 加 1 项）、
  `layout.css`（追加 `.vault__*`）
- 测试数据：直接写 `localStorage` 的 `im.cast.unlocked`（数组）与 `im.badge`（对象）构造
  空 / `[8]` / `[8,4]` / `n=3` / `n=8` 五组
- 验收：V1–V12 + 截图 6 张（有牌 n=3 / n=8 / 空态 / 姓名编辑 / 海报 / 375px）
