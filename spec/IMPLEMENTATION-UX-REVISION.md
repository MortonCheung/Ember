# 实现自述 · 体验修订 R1（第 1–7 条）

> **对应提示词**：`spec/PROMPT-UX-REVISION.md`（**第 1–7 条已实现 → 状态改为「⛔ 不要再发整份，只发 §1 第 8、9 条」**；本自述**不包含**第 8、9 条）
> 📌 **后记（2026-09-23）**：上面这个路径**已失效** —— 该提示词已整份移入 **`archive/spec/PROMPT-UX-REVISION.md`**。
> 原因：第 8、9 条已抽成独立交接稿 **`spec/PROMPT-UX-REVISION-P2.md`**，旧稿自身再无未做条款，故可整份归档。
> 📌 **后记二（2026-09-23 · 当晚）**：那份独立稿 **`spec/PROMPT-UX-REVISION-P2.md` 也已实现并随「第五批」归档**
> （→ `archive/spec/PROMPT-UX-REVISION-P2.md`，自述 `spec/IMPLEMENTATION-UX-REVISION-P2.md`）。
> **R1 的 9 条至此全部落地**；`spec/` 里**已无可发提示词**
> （📌 **后记三（2026-09-23 更晚）**：此句**已过期** —— 当晚新出 **`spec/PROMPT-HOME-LEDGER.md`**
> （首页下半段改造，尚未实现），可发的回到 1 份。**"归零"类结论句已被推翻三次**。
> 📌 **后记四（2026-09-23 收尾）**：后记三的答案也已过期 —— `PROMPT-HOME-LEDGER.md` 当晚即实现
> （自述 `spec/IMPLEMENTATION-HOME-LEDGER.md`，K1–K13 全绿 · 门禁 46/46），随**第六批**归档至
> `archive/spec/`。**此刻 `spec/` 手上没有可发的**（重新开张条件见 archive/README 后记六））。
> 本自述描述的**第 1–7 条改动与全部读数不受影响**（归档只是移动文件，内容一字未改）。
> **实现日期**：2026-09-22 晚
> **本轮范围**：用户 9 条中的 **第 1–7 条** + 新建 `#/about`（用户经确认选择「先做第 1–7 条」）
> **验收脚本**：`.workbuddy/verify_ux.py`（J1–J14 + 五组门禁 + 375 px）
> **结果**：**J 组 37 / 37 PASS**，五组门禁全绿不回归，console 全空
>
> ⚠️ **第 8 条（协作车削去榜 / 去用时 / 刀细化）与第 9 条（数字工牌三项）本轮未做**，
> 详见 §9。因此 **J15–J22 本轮无读数**；**J23（体积）本轮读数见 §5，判据存在矛盾，需裁定**。

---

## 0. 一句话结论

七条都按提示词落地，且**没有一条靠"顺手优化"**。唯一必须提请注意的两件事：

1. **J23 的体积判据与第 2 条需求自相矛盾** —— 新增一个四段内容的 `#/about` 页 + 一段自带
   `300vh` 行程的时间轴，gzip **必定上升**；J23 却要求「**小于 198.57 KB**」。实测 **206.96 kB
   （+8.40 kB）**，距 215 kB 上限仍有 **8.04 kB** 余量，但**不满足"小于 198.57"**。
   属判据不可达成，**不是实现缺陷**，需裁定（§3.1）。
2. **第 7 条有一处必要偏离**：提示词说「不要新增任何旋转/缩放补偿」，我**新增了一行**
   `ladle.melt.rotation.x = 0` —— 它是"清残留"而非"补偿"，且**正是它让提示词要求的
   `resetLadle()` 两行删除变安全**（§3.3）。

---

## 1. 逐条实现说明

### 第 1 条 · 删首页顶栏「进入虚拟展厅」按钮 ✅

`demo/src/js/pages/home.js`：删掉顶栏那颗 `btn--primary`（原 L49）。
**保留** `.topbar__spacer`（现 L58）；`layout.css` 的 `.topbar__spacer { flex: 1 1 auto; }` **未动**。

读数（J1）：顶栏按钮数 **0**、`spacer: true`、nav **仍 6 项**
`["首页","虚拟展厅","互动体验","我的工牌","数字藏品","关于项目"]`。

> ⚠️ **上方读数已过期（2026-09-23 晚）**：`数字藏品` 一项已按 `archive/spec/PROMPT-NAV-TRIM.md`（**第九批已归档**）删除
> ⇒ nav 变为 **5 项** `["首页","虚拟展厅","互动体验","我的工牌","关于项目"]`。
> 当时的"6 项"是本条的**历史读数**，仅存证据用。

### 第 2 条 · 「了解项目」接真页 `#/about` ✅

| 位置 | 改动 |
|---|---|
| `home.js` hero 副按钮 | 加 `data-go="about"` |
| `home.js` `NAV` 第 6 项 | `关于项目` → `route: 'about'` |
| `main.js` L13 | 新增 `import { renderAbout }` |
| `main.js` `PAGES` | **7 键 → 8 键**（加 `about: renderAbout`） |
| `main.js` `TITLES` | 加 `about: '关于项目 · 中国工业博物馆数字展馆'` |
| `demo/src/js/pages/about.js` | **新建**（四段，见下） |

`about.js` 四段与 `PROMPT-UX-REVISION §2` 逐条对齐：
① 我们为什么做这个 ② 这个作品是什么（四层各带一个直达 `data-go` 按钮）
③ 用了哪些真实史实（6 条数据块，**逐字取自 `PROJECT-BRIEF §4`**，含《铁流凝变》22 × 11.5 m / 净重 50 t）
④ 技术说明。

**版式合规**：复用 `.topbar` + `.wrap.topbar__inner` + `.eyebrow` / `.btn` / `.num`；
新增样式只有 `.about__*`，**追加在 `layout.css` 末尾，未改既有规则**；是**滚动页**
（`.page`，`flex: 1 1 auto`），**没有**套 `#/hall` 的 `100vh` 框架。

读数（J5–J7）：`#/about` 可达、`document.title` 正确；四段 h2
`["我们为什么做这个","这个作品是什么","用了哪些真实史实","技术说明"]`；
`canvas = 0`（零 WebGL）；`scrollHeight 2010 > innerHeight 900`（确为滚动页）；
四层直达按钮分别落在 `/` `entrance` `cast` `vault`（实测 `["#/","#/entrance","#/cast","#/vault"]`）。

### 第 3 条 · 删滚动飞越视频槽位，换数据时间轴 ✅

**删**：`home.js` 的 `<figure class="flyover">` 整块（含两个 chip、进度线、舞台、三章节）、
`.flyover__caption`；`layout.css` **L103-208** `.flyover*` 全部 + 三处 `@media` 内的
`.flyover` / `.flyover-recipes__list` / `.flyover__chips`。**CSS 共删 153 行（1456 → 1303）**。

**新增**：`home.js` `<section class="axis" data-axis>`（在 hero 之后另起一段，不在 hero 两栏里）；
hero 右栏改放 `.hero__furnace` —— **纯 CSS 炉体剖面图**（`clip-path` 轮廓 + 出铁口暖色点），
高 `520px` 与原 `.flyover` 同高，保住两栏平衡。

**驱动**：`height: 300vh` 行程容器 + `position: sticky` 钉住；进度 =
**行程容器已滚过比例** `(scrollY − 容器top) / (容器高 − 视口高)`，钳 0–1，
写进 `--axis-progress`；节点按 `i / 2` 段**累积**点亮 `is-active`；左轨填充 = 进度。
`prefers-reduced-motion: reduce` 时不监听滚动、三节点直接全亮；滚动监听在 `dispose()` 里对称移除。

读数：J8 首页 `.flyover` / `.flyover-recipes` / `.flyover__caption` / `[data-recipe]`
**节点数全为 0**；`.hero__furnace = 1`、`[data-axis] = 1`、`canvas = 0`。
J10 实测 `top = 746`（文档绝对坐标）、`span = 1800`（= 300vh − 900，**行程确实由自己撑起**）、
`--axis-progress = [0, 0.5, 1]`、点亮数 `[1, 2, 3]`。
J11 `reduce` 下 `allOn = true`、`p1 = 1`、滚动后仍 `1`（**确认未挂滚动监听**）。

### 第 4 条 · 删底部「章节预告」 ✅

`home.js` `<section class="flyover-recipes">` 整段删除；连带删掉
`const recipes = [...]` 与 `recipes.forEach(...)`（这两个是提示词点名的**会抛错/变死代码**的两行）；
`layout.css` `.flyover-recipes*` **L211-245** 及 `.flyover__caption` **L246-250** 同批删除。

**这一条是 §3 时间轴必须自带 300vh 行程的直接原因**：删掉后首页只剩一屏，
进度会恒为 0 —— J10 的 `span = 1800` 即证明行程已被新时间轴接管。

### 第 5 条 · 两个入口都先进序厅 ✅

`home.js` hero 主按钮 `data-go="hall"` → **`entrance`**；`NAV` 第 2 项 `虚拟展厅` `route: 'hall'` → **`entrance'`**。
**未动** `entrance.js` 的「进入铸造馆 →」（`data-go="hall"`）；**未动** `NAV` 第 3 项「互动体验」→ `cast`。

读数：J2 hero 主按钮实测 `data-go="entrance"`、点击落 `#/entrance`；
J3 顶栏「虚拟展厅」药丸点击落 `#/entrance`；
**J4 序厅「进入铸造馆 →」仍落在 `#/hall`**（没被顺手改掉）。

### 第 6 条 · 铸造馆三个热点一律去浇铸互动 ✅

`demo/src/js/pages/hall.js`：删 `CTA_TURN` 常量整条（含 L13-16 的过期方案注释）；
删 `lathe` 条目里的 `cta: CTA_TURN`（车床回落到缺省 `CTA_CAST`）；
信息卡按钮固定 `CTA_CAST.label`、`ctaBtn.dataset.go = 'cast'`，**删掉 `data-cta-notice` 分支**；
`onClick` 里删掉 `pending` 那段。`lathe` 正文（C620-1 史实）**保留**。

`showNotice()` **保留** —— 场馆导航「筹备中」药丸仍用它（属 `venues.js` 自有文案，不在本条范围）。

读数（J12）三热点（`cupola` / `sandboxes` / `lathe`）**逐个点开**，信息卡主按钮
文案全为「**进入浇铸互动**」、`data-go` 全为 `"cast"`、`data-cta-notice` 属性全为 `false`。
J13 全仓 grep：`CTA_TURN` / `data-cta-notice` / `cta-notice` / 「尚未开放」在 **`hall.js` 侧零残留**。

### 第 7 条 · 铁水液面与铁桶同速倾斜 ✅（含一处必要偏离）

`demo/src/js/scene/cast-scene.js` `setLadlePose()`（现 L716-726）：

```js
function setLadlePose(x, y, z, tilt = null) {
  ladle.group.position.set(x, y, z);
  if (tilt !== null) {
    ladle.pot.rotation.x = tilt;
    ladle.gantry.rotation.x = -tilt;  // 行车保持水平
    // R1 第 7 条：melt 是 pot 的子对象 → 与 pot 刚性同转。只清掉 R/A 段待机微摆的相对转角。
    ladle.melt.rotation.x = 0;        // ← 新增行（见 §3.3 说明）
  }
}
```

删掉的：反向抵消 `melt.rotation.x = -tilt`、收缩 `ms = 1 - 0.55*(tilt/TILT)` 与
`melt.scale.set(ms, 1, ms)`，以及那三行注释；`resetLadle()` 里的
`melt.scale.setScalar(1)` / `melt.rotation.x = 0` 两行**一并删除**（提示词要求）。
**未动** `TILT`（52°）、`TIP_LOCAL`、`gantry.rotation.x = -tilt`；
**保留** 待机微摆（现 **L848** `±2.5°` / **L859** `±3°` × `sin(t·0.02)`）。

读数（J14，三帧）：
| 帧 | `ladle.tiltDeg` | `melt.potTiltDeg` | `melt.relRotDeg` | `melt.scale` | 判定 |
|---|---|---|---|---|---|
| 0°（浇铸前） | 0 | 0 | 2.199 | `[1,1,1]` | 微摆保留（**预期**） |
| 中途 | 15.9 | 15.85 | **0** | `[1,1,1]` | 刚性同转 ✓ |
| **52°** | **52** | **52** | **0** | `[1,1,1]` | **J14 判据达成** ✓ |

> ⚠️ **取证口径说明（避免误读截图）**：`ux_cast_tilt_0.png` 那一帧 `relRotDeg = 2.199°`
> 是 R/A 段**待机微摆**（tilt = 0 时的活气），不是液面歪；`ux_cast_tilt_26.png` 实际截在
> **15.9°** 的过渡瞬间（倾包是连续的，脚本按时间取帧，不保证正好停在 26°）。
> **J14 的判据点（tilt = 52°）实测 `relRotDeg = 0`、`scale = [1,1,1]`，刚性同转成立。**

---

## 2. J 组逐条读数（J1–J14）

| ID | 内容 | 判定 | 实测读数 |
|---|---|---|---|
| J1 | 顶栏无「进入虚拟展厅」；spacer 在；nav 6 项 | ✅ | `topbarBtns=[]`、`spacer=true`、`navCount=6` |
| J2 | hero 主按钮 → `#/entrance` | ✅ | `data-go="entrance"`；点击落 `#/entrance` |
| J3 | 顶栏「虚拟展厅」药丸 → `#/entrance` | ✅ | 落 `#/entrance` |
| J4 | 序厅「进入铸造馆 →」**仍**落 `#/hall` | ✅ | 落 `#/hall` |
| J5 | 「了解项目」/ 顶栏「关于项目」→ `#/about` | ✅ | 两处均落 `#/about` |
| J6 | `#/about` 可达 + title + 四段 + `webgl=0` + 375 无横滚 | ✅ | title 正确；h2 ×4；`canvas=0`；`scrollH 2010 / innerH 900`；375 px `scrollW=clientW=375` |
| J7 | 四层直达 → `/` `entrance` `cast` `vault` | ✅ | `["#/","#/entrance","#/cast","#/vault"]` |
| J8 | 首页无 `.flyover*` 任何节点 | ✅ | `flyover=0 / recipes=0 / captions=0 / recipesNode=0`；`furnace=1 axis=1 canvas=0` |
| J9 | 三节点文案与 §3 表**逐字**一致 | ✅ | 1957 点火 / 2007 熄火 / 今天 你，三段小字逐字一致 |
| J10 | 0 / 0.5 / 1 三位置 + 进度单调 + 节点累积 | ✅ | `progress=[0, 0.5, 1]`、`on=[1, 2, 3]`、`top=746 span=1800`；三张截帧已落盘 |
| J11 | `reduce` 下不监听滚动、三节点全亮 | ✅ | `allOn=true`、`p1=1`、滚回后仍 `1` |
| J12 | 三热点 → 都「进入浇铸互动」+ `data-go="cast"` | ✅ | 3/3 命中，`noticeAttr` 全 `false` |
| J13 | `CTA_TURN` / `data-cta-notice` / 「尚未开放」零残留 | ✅ | `hall.js` 侧零残留 |
| J14 | `tilt=52°` → `melt.rotation.x=0`、`scale=(1,1,1)` | ✅ | `relRotRad=0`、`scale=[1,1,1]`、`potTiltDeg=52` |
| **J15–J18** | 车削（第 8 条） | — | **本轮未做**（§9） |
| **J19–J22** | 工牌（第 9 条） | — | **本轮未做**（§9） |
| **J23** | gzip ≤ 215 KB **且** < 198.57 KB | ⚠️ **部分** | ≤215 ✅（206.96，余量 8.04）；**< 198.57 ✗** → **判据矛盾，见 §3.1** |

> ⚠️ **上表 J1 行的 `navCount=6` 已过期（2026-09-24 注）**：NAV 第 5 项 `数字藏品` 已按
> `archive/spec/PROMPT-NAV-TRIM.md`（**第九批已归档**）**删除**（用户 2026-09-23 裁定），首页与 `#/about` 的顶栏现为 **5 项**；
> 两处门禁（`verify_ux.py` 的 J1、`verify_vault.py` 的 V11a）也已同步改为 `== 5`。
> **本行读数按规矩保留**（它是当时那轮的实测记录），只加此注。

**J 组合计：37 / 37 PASS**（J1–J14 共 24 条 + 门禁 5 组 + 375 px 2 条）。
**console 门禁**：首页 / `#/about` / `#/hall` / `#/cast` 各段实测 console 问题 **`[]`**。

### 残留普查（供复核者对照，避免 grep 到"疑似残留"时误判）

跑了一遍全仓（`demo/src` + `demo/dist` + `spec` + `archive`）：

| 关键词 | `demo/src` | `demo/dist` | 说明 |
|---|---|---|---|
| 「预渲染」 | **ZERO** ✅ | **ZERO** ✅ | J8 要求清零，已清零 |
| 「视频时间轴」 | **ZERO** ✅ | **ZERO** ✅ | J8 要求清零，已清零 |
| `CTA_TURN` | **ZERO** ✅ | **ZERO** ✅ | J13 要求清零，已清零 |
| `data-cta-notice` / `cta-notice` | **ZERO** ✅ | **ZERO** ✅ | J13 要求清零，已清零 |
| 「章节预告」 | 2 处（`home.js` / `layout.css` 注释） | ZERO | **是 R1 变更日志注释**，非残留 |
| `flyover` | 2 处（`layout.css` 注释） | ZERO | 同上（`§3` 明确要求注明"沿用已删 `.flyover__chapter` 的配色写法"） |

> `spec/*` 与 `archive/*` 里出现这些词是**正常**的 —— 提示词与自述要描述"删掉了什么"，
> `archive/release/source/` 是 09-18 的旧源码副本（**不动**）。
> **`demo/dist` 六个词全 ZERO**，说明构建产物里确实没有功能残留。

### 关于 J10 的一次取证修正（记录在案）

第一次跑 J10 时 `J10a/J10b` 报 FAIL（`progress=[0,0,0]`、`on=[1,1,1]`）。
排查结论：**实现无误，是取证脚本错了** —— 脚本在 `scrollTo()` 之后**同步**读取
`--axis-progress`，而 `scroll` 事件是**异步派发**的，监听器还没跑就读了旧值（恒为 0）。
修法：滚动后 `await` 两帧 `requestAnimationFrame` 再读；同时把 `top` 从
`ax.offsetTop` 换成文档绝对坐标 `getBoundingClientRect().top + scrollY`。

> 顺带核过：`.page` **未**设 `position`，所以 `offsetParent` 就是 `body`，
> `axis.offsetTop` 与文档绝对坐标**恰好相等** —— 实现侧那行是**对的**，不必改。
> （这条已按项目惯例回代码核实，不是推断。）

---

## 3. 偏离与待裁定清单

### 3.1 ⚠️ 待裁定 · J23 体积判据不可达成（**最重要的一条**）

**事实**：J23 要求「gzip 实测 **≤ 215 KB 且小于 198.57 KB**」。
但同一份提示词的第 2 条要求**新建一个四段内容的 `#/about` 页**，第 3 条要求**新增一段
自带 `300vh` 行程 + 三个节点 + CSS 炉体剖面的时间轴**，第 4 条只删掉一段「章节预告」。
**新增的中文正文与结构必然推高 gzip** —— 这两条要求与 J23 的第二半句**互斥**。

**实测**（口径：Vite 构建 banner，与前几轮 `IMPLEMENTATION-*.md` 一致）：

| 产物 | 改前 | 改后 | 增量 |
|---|---|---|---|
| **JS gzip** | 198.56 kB | **206.96 kB** | **+8.40 kB** |
| CSS gzip | 6.45 kB | **6.78 kB** | +0.33 kB |
| 合计 | — | — | **+8.73 kB** |
| JS raw | 686.23 kB | 687.84 kB | +1.61 kB |

**上限 215 kB → 余量 8.04 kB，未越线**；但**未小于 198.57 kB**，故 J23 严格口径**不通过**。

> **口径备注**：Vite banner 的 raw 列用的是 rollup 的**字符数**（非字节），中文一字三字节，
> 所以 raw 只涨 1.61 kB 而 gzip 涨 8.40 kB 并不矛盾。为与本项目历史读数可比，
> 报告一律用 **banner 的 gzip 列**（banner 自身前后轮一致）。
> 另附同口径的 Python `gzip(9)` 读数备查：JS **204,744 B（199.95 KiB）**、CSS **6,742 B**。

**增量的归因**（源文件级，供裁定参考）：`about.js` 源 **5,904 B / gzip 2,894 B**；
`layout.css` 删 153 行旧规则后又加了 `.hero__furnace*` / `.axis*` / `.about__*` 三组新样式。

**请裁定（三选一）**：
- **(a) 接受 206.96 kB**（≤215 上限，余量 8.04 kB）—— 本文档默认立场：新增一页的代价是真实的，判据应改。
- **(b) 压回 < 198.57 kB** —— 需砍掉约 8.4 kB gzip，约等于把 `#/about` 的四段正文与
  时间轴三节点的史实小字**全部瘦身**，会明显伤到内容完整性。
- **(c) 修正 J23 阈值** —— 改为「≤ 215 KB 且不高于 198.57 + 本包预算」之类的可达判据。

> 这条与 `MEMORY.md` 里记的序厅 E5 教训同型：**判据必须能被规格自己允许的手段达成，
> 否则是自己挖坑**。此处是"必须新增内容"与"体积必须下降"互斥。

### 3.2 偏离 · 删除范围超出提示词（CSS 孤儿共 4 处，提示词只点了 2 处）

提示词 §1 第 3 条只标了 `layout.css` **L103-208** 与 **L211-250**。
实测除这两块外，还有 **三处 `@media` 内**的同名残留：

| 位置 | 内容 | 处理 |
|---|---|---|
| `@media` 块内 | `.flyover { … }` | 删 |
| `@media` 块内 | `.flyover-recipes__list { … }` | 删 |
| `@media` 块内 | `.flyover__chips { … }` | 删 |
| `@media (max-width: 820px)` 内 | `/* P2：章节预告单列 */`（**孤儿注释**，规则已删只剩注释 + `}`） | 删 |

前 3 处属"同名残留清理"；第 4 处是**孤儿注释**，本次收尾时新增脚本
`.workbuddy/scan_orphan_comments.py` 专门扫「块内最后一条语句是注释」的空壳，
**全仓已归零**。以上均**非功能变更**，不涉及任何新样式。

### 3.3 偏离 · 第 7 条**新增**了一行（提示词明写"不要新增任何补偿"）

提示词 §1 第 7 条：「**不要新增任何旋转/缩放补偿。**」我新增了一行
`ladle.melt.rotation.x = 0;`。**理由如下（请确认）**：

1. **它不是补偿，是清零。** `melt` 已是 `pot` 的子对象，`pot.rotation.x = tilt` 已带着它转；
   这一行只是把**相对**转角压回 0，让"刚性同转"这个事实成立。
2. **不加会有真 bug（J14 隐患）。** R/A 段（起吊 / 就位）有待机微摆，会写
   `melt.rotation.x = ±2.5°/±3° × sin(t·0.02)`（现 **L848 / L859**）。而 SEG.A = 1500 ms
   之后才进 B 段（倾包）。**若只按字面删掉原反向抵消、不清理微摆残留**，
   `melt` 会带着约 **±2.95°** 的相对转角进入 B 段 —— 液面相对桶是歪的，
   **正好违反用户第 7 条要的"同速倾斜"**。J14 实测三帧 `relRotDeg = 0` 即此行的效果。
3. **它还让提示词要求的另两行删除变安全。** `resetLadle()` 里那两行
   （`melt.scale.setScalar(1)` / `melt.rotation.x = 0`）提示词要求删；而
   `resetLadle()` 调的是 `setLadlePose(…, 0)` —— **tilt = 0 不是 null**，
   会走进 `if (tilt !== null)` 分支，于是新增的这行**同时接管了复位时的清零职责**。
   若严格不加这一行又删掉 resetLadle 两行，复位后微摆残留将无人清理。

**结论**：这一行是第 7 条的**必要条件**，属"方向相反的偏离"（不是加补偿，是去残留）。
保留与否请设计侧裁定；若坚持不新增，则须改为「在 R/A 段结束时清零」或
「B 段起把微摆权重按 tilt 淡出」—— 都比一行 `= 0` 复杂。

### 3.4 偏离 · `NAV` 由 `const` 改为 `export const`

`about.js` 要复用首页同一条顶栏（§2 版式要求）。为避免导航文案**双写**（双写就一定会漂移），
把 `home.js` 的 `NAV` 改为 `export const NAV`，`about.js` `import { NAV } from './home.js'`。
**只加 `export`，数组内容一字未改**。

### 3.5 待裁定 · `#/about` 第一层直达按钮用 `data-go=""`（空串）

四层里「01 看见」的落点是首页 `/`，而 `main.js` 的 `PAGES` 主页键就是**空串 `''`**，
所以该按钮写的是 `data-go=""`。实测**能正确落 `#/`**（J7 已验），但这是**隐式约定**，
可读性差、也容易被后续改动碰坏。**建议下轮**改为显式 `home`（在 `PAGES` 里加
`home: renderHome` 别名）或让 `go()` 容错。**本轮未动**（属 §7 第 10 条"没被点名的不要顺手改"）。

### 3.6 待裁定 · nav 第 5 项「数字藏品」仍是死项

> ✅ **2026-09-23 已裁定：删掉该项**，依据 **`archive/spec/PROMPT-NAV-TRIM.md`**（NAV 6 → 5，**第九批已归档**；已于 2026-09-24 落地）。
> 下方为当时的登记原文，**仅存历史**。

`NAV` 里 `数字藏品` → `route: ''`（点了只回首页）。提示词 §7 第 7 条明确说**本轮不动**，
此处仅登记，**未改**。

---

## 4. 门禁读数表（五组，不回归）

| 门禁 | 改前（上一轮记录） | 改后实测 | 判定 |
|---|---|---|---|
| `#/cast` `__cast.selfTest()` | 45/45 + `wired: true` | **45/45**，`wired: true`，`fails: []` | ✅ 不回归（本条未解冻） |
| `#/hall` `layout()` | 61/61 | **61/61**，`sections_all_true: true`，`fails: []` | ✅ 不回归 |
| `#/entrance` `layout()` | 22/22 | **22/22**，`overall: true`，`fails: []` | ✅ 不回归 |
| `#/turn` `selfTest()` | 80/80 | **80/80**，`fails: []` | ✅ 不回归（**本轮未解冻**，期望值未变） |
| `#/vault` `__vault.state()` | V 组 31/31 | `hasBadge=false`、`n=0`、`dex=12`、`locked=[false,false,true,true]`、`time='—'`、**`left_bottom=830`** | ✅ 结构不回归（830 ≤ 900） |
| 375 px 无横向滚动 | 无 | 首页 `scrollW=clientW=375`；`#/about` 同 | ✅ |

> `#/vault` 一栏是**空档案**（`hasBadge=false`）下的读数：本轮没做第 9 条，
> 字段与结构未变，`left_bottom 830` 仍在 900 预算内。
> **J19–J22 所需的两局对比、返回键、可点图鉴，留待第 9 条轮。**

---

## 5. 体积读数（改前 / 改后）

| 产物 | 改前 | 改后 | 增量 | 上限 / 判定 |
|---|---|---|---|---|
| **JS gzip（banner）** | 198.56 kB | **206.96 kB** | **+8.40 kB** | ≤ 215 kB ✅（余量 8.04）／< 198.57 ✗ |
| CSS gzip（banner） | 6.45 kB | **6.78 kB** | +0.33 kB | — |
| JS gzip（Python `gzip(9)`，备查） | — | **204,744 B（199.95 KiB）** | — | — |
| CSS gzip（Python `gzip(9)`，备查） | — | **6,742 B（6.58 KiB）** | — | — |
| JS raw | 686.23 kB | 687.84 kB（banner 字符数）／**702,275 B** | +1.61 kB（字符）／+16,045 B | — |
| 产物 bundle 名 | — | `index-CPs37xgK.js` / `index-BJmvQjBw.css` | — | 预览服务名一致 ✅ |

> **"改前"取值的出处**：`spec/IMPLEMENTATION-VAULT.md` §6.2（198.56 / 6.45，同为 banner 口径），
> 与 `README.md` 的「三件未闭环」段 / `TURN-SPEC` L315 记的 198.57 KB 同源。
> **banner 与 Python 两个口径相差约 7 kB**（banner 用 zlib 默认等级，Python 用 level 9），
> **各自自洽**，故报告内一律 banner-to-banner 比较，另附 Python 口径备查。

---

## 6. 截图索引（1440 × 900，`.workbuddy/shots/`）

| 文件 | 内容 |
|---|---|
| `ux_axis_top.png` | 首页**页顶**（hero + 炉体剖面） |
| `ux_axis_mid.png` | 首页**时间轴中段**（`--axis-progress = 0.5`，前两个节点亮） |
| `ux_axis_bottom.png` | 首页**页底**（进度 = 1，三节点全亮） |
| `ux_about_full.png` | `#/about` 全页 |
| `ux_hall_lathe_card.png` | `#/hall` 车床信息卡（按钮文案 = 进入浇铸互动） |
| `ux_hall_hotspot_1_cupola.png` / `_2_sandboxes.png` / `_3_lathe.png` | 三热点逐个点开 |
| `ux_cast_tilt_0.png` / `_26.png` / `_52.png` | 浇铸 **0° / 中途(15.9°)** / **52°** 三帧 |
| `ux_home_375.png` / `ux_about_375.png` | 375 px 窄屏（无横向滚动） |

**第 8 / 9 条要求的截图**（`#/turn` 面板、切刀近景、`#/vault` 两局对比）**本轮不产出**。

---

## 7. 开工前的"事实核查"清单（8 条，含 **2 条口径被修正**）

按项目惯例，开工前用脚本把提示词里的每条「文件 + 行号 + 现状原文」逐条回代码核。
**核查 45 条 / 命中 ~98%**（2 处 ±1 行漂移），并另挖出 8 条提示词盲点。
其中 **2 条在本次收尾复核时被发现口径不准** —— 记录下来，因为它们本来会导致**误删活代码**：

| # | 结论 | 现状 |
|---|---|---|
| 1 | `turn.js` `resetRun()` 内 **L442** `refreshClock()` 提示词没列 | **成立**（`refreshClock` 共 **6 个调用点**：L212/268/395/423/**442**/505） |
| 2 | `turn.js` **L438** `els.clock.textContent = '00:00'` 残留 → TypeError | **成立**（另有 L372 / L195） |
| 3 | `layout.css` `@media` 内 `.flyover*` 孤儿 | **成立，且比提示词多** —— 本轮实际处理 **4 处**（§3.2） |
| 4 | ~~`vault.js` L52 `showTime()` 是死函数~~ | ❌ **现状是活代码**：L52 定义、**L97 在用**（`statTime`），L265 渲染。它**只有**在删掉 L97 之后才变死 —— **顺序不能反，更不能现在删** |
| 5 | ~~`layout.css` `.vault__link` 是孤儿 CSS~~ | ❌ **现状是活样式**：`layout.css` L1281-1282 定义、**`vault.js:317` 在用**。同上，只能在第 9 条删掉 L317 时一并删 |
| 6 | `turn.js` L14 `T_REF` 是死 import | **半成立**：`T_REF` 现在**在用**（L48-49 规则文案），**只有在删掉那行"用时"规则后**才变死。删除顺序不能反 |
| 7 | 提示词 8b 把 `els` 写成 L~176-190 | **成立**：实测 **`els` = L157-166**，**`st` = L169-179** |
| 8 | `verify_turn.py` 的 board / clock 断言随删除失效，须重写 | **成立**：`verify_turn.py` 里 board 类 **15 行**、clock 类 **4 行**、`inBoard/boardRows` 类 **6 行**涉及 |

> **第 4、5 条是本清单最有价值的部分**：开工前的清单把它们写成了「死函数 / 孤儿 CSS」，
> 读起来像**已经**无用。复核发现它们**现在都在被使用** —— 只是**将来**（第 9 条删掉各自消费者时）
> 才会变成死代码。**若照旧清单动手，会在本轮删掉两个正在用的东西。**
> 教训与 `MEMORY.md` 记的一致 —— **结论不对先别改代码，相当比例是取证本身错了**；
> 补充一条：**"将来会死"不等于"现在已死"，删除要跟着消费者走，顺序不能反。**

**另有一条给下轮（第 8 条）的预警**：
「用时」在实现里是**两个概念**，不能整块删 ——
① **显示**（`els.clock` / `els.target` / `refreshClock`，L100-102、L161、L193-199）可以删；
② **计时机构**（`st.timerStart` / `st.goAt` / `elapsedSec()` L185-191）与
`TIMING.forceSettle`（L195 / L391「用时超过 X s，已强制结算」）**强绑定**，
并且 `st.rec` 的 `t` 就是**相对计时起点的毫秒**（回放要用）。
**建议下轮开工前先裁定：`DURATION_MS` / `forceSettle` / `st.rec.t` 的基准是否保留。**
否则会出现"删了显示、回放跟着坏"的连锁。

---

## 8. 解冻 / 冻结合规（对照 §5）

**本轮实际改动文件**（按 mtime，本轮窗口 22:42–22:54）：

| 文件 | 对应 §5.1 授权 |
|---|---|
| `demo/src/js/pages/home.js` | ✅ 第 1/2/3/4/5 条 |
| `demo/src/styles/layout.css` | ✅ 删 `.flyover*` / `.flyover-recipes*`；新增 `.hero__furnace*` / `.axis*` / `.about__*` |
| `demo/src/js/pages/about.js`（**新建**）+ `demo/src/js/main.js` | ✅ 第 2 条；`PAGES` / `TITLES` **7 → 8 键** |
| `demo/src/js/pages/hall.js` | ✅ 第 6 条 |
| `demo/src/js/scene/cast-scene.js` | ✅ 第 7 条 |

**§5.2 冻结项复核**：按 mtime 全量比对，`tokens.css` / `router.js` / `venues.js` /
`entrance.js` / `history.js` / `entrance-scene.js` / `workshop.js` / `environment.js` /
`textures.js` / `props/*` / `props/ladle.js` / `scoring/casting*.js` / `ui/emblem.js` / `design/*`
**mtime 全部停留在上一轮或更早**（最近的 `21:34:59` 是 vault 轮那 5 个文件），**本轮一个未碰**。

**未触碰的解冻项**：`js/pages/turn.js` · `scoring/turning*.js` · `scene/turn-scene.js` ·
`pages/vault.js` · `pages/cast.js` · `ui/poster.js` —— 这些只在**第 8 / 9 条**才解冻，**本轮保持冻结**。

**门禁代价已付**：§4 五组门禁**全部重跑**，读数见 §4。

---

## 9. 下一轮范围（第 8、9 条）—— 本轮**未做**

- **第 8 条**：`#/turn` 删排名榜（8a）/ 删「本局用时」**连评分一起去掉**（8b）/ 切刀建模细化（8c）。
  影响 `turn.js` → `scoring/turning.js` → `scoring/turning-data.js` → `turn-scene.js` → `layout.css`，
  并**必须重写** `.workbuddy/verify_turn.py` 的 board / clock / `inBoard` 断言（§7 第 8 条）。
  **开工前需先裁定**：`forceSettle` / `DURATION_MS` / `st.rec.t` 基准是否保留（§7 末段预警）。
- **第 9 条**：`#/vault` 记录本局（9a）/ 返回键（9b）/ 可点图鉴（9c）。
  `.hud__back` 样式**已存在**（`layout.css` L134/141，`entrance.js` / `hall.js` / `history.js` 在用），
  9b 直接复用即可，**不需要新类**；`.vault__back` 目前全仓 **ZERO**（尚未创建）。
- **J23 体积裁定**（§3.1）需在第 8 条（预期体积**下降**）合并后再看一次 —— 第 8 条会删掉
  排行榜与用时相关的不少代码，可能把 gzip 拉回 198.57 以下。**建议把 J23 的裁定推迟到第 8 条验收后**。

---

*本报告所有行号均在本轮收尾时**回代码复核**过；数据来源为 `.workbuddy/verify_ux.py`（结果
`.workbuddy/_ux_results.json`）与构建输出 `.workbuddy/_build_ux.txt`、`_build_ux2.txt`。*
