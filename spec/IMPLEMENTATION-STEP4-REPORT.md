# Step 4 实现说明 · 序厅 `#/entrance` + 通史馆 `#/history`

> 代码实现方出具 · 依据 `spec/ENTRANCE-HISTORY-SPEC.md`（唯一依据）+ `design/S07/S08`（视觉基准）
> 日期：2026-09-18。本轮**未触碰**任何冻结项（`lathe.js` / `toolcart.js` / `cupola.js` / `HALL_VIEWS` / `layout()` 阈值 / `mountViewport` 默认参数 / `props/sandboxes.js`）。

---

## 1. 改动文件清单

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/js/scene/entrance-scene.js` | **新增** | 《铁流凝变》雕塑（merge 成 1 mesh）+ 地面 + 后墙 + 三灯；导出 `buildEntranceScene` / `entranceLayout`（E1–E4 判据）/ `entranceSilhouette`（E1 剪影） |
| `src/js/pages/entrance.js` | **新增** | 序厅页：复用 hall 骨架（HUD/药丸/热点/信息卡），无 minimap，左下说明条 + 底部进场序列 + 右下操作提示；`mountViewport` 全传参；W/A/S/D 边界 ±10/±14；`?debug=1` 时把 `layout/silhouette` 覆盖到 `window.__entrance` |
| `src/js/pages/history.js` | **新增** | 通史馆长卷（纯 DOM，零 WebGL）：8 节点逐字 + 长卷轨滚动指示 + 结尾 CTA → `#/cast` |
| `src/js/venues.js` | **新增** | 场馆导航共享模块（§3）：三枚可点走路由，两枚「· 筹备中」（steel 灰 + 11px 后缀），点击复用各页 `showNotice()` |
| `src/js/main.js` | 修改 | 路由注册 `entrance` / `history` 两条 + 页面标题 |
| `src/js/pages/hall.js` | 修改 | 场馆导航接线改走共享模块（序厅/通史馆从铸造馆页也可直达）；**几何/预设/判据零改动** |
| `src/styles/layout.css` | 追加 | `.halls__pending` / `.entrance-strip` / `.sequence` / `.history__*` / `.timeline*` / `.scrollrail` + H4 ≤768px 单列响应式 |

## 2. 验收结果（自动化：`.workbuddy/verify_step4.py`，CDP 实测）

| 门禁 | 结果 |
|---|---|
| **E2 尺度** | 包箱 **22.07 × 11.64 m**（容差 ±0.5 内）；scale (1,1,1)；min.y = 0 |
| **E3 机位** | `default` 16.28 / `sculpture` 9.71，**setView 后实测**（非直算），≥ 6.05 ✓ |
| **E4 性能** | draw call **3** / 三角面 **300** / 贴图 2（全站 0 增量）；`mountViewport` 默认参数未改 |
| **E5 页面** | HUD/药丸/热点/信息卡/说明条/进场序列/操作提示齐备；**无 `.minimap`**；截图 CONSOLE CLEAN |
| **E1 剪影** | `__entrance.silhouette(true)` 出图（`entrance-silhouette.png`，227×128，雕塑高 128px 纯黑白底） |
| **H1 内容** | 8 节点年份/标题/正文与 §2.2 **逐字一致**（含全角弯引号）， mismatches = [] |
| **H2 Token** | 颜色全部 `tokens.css` 变量；铁水橙仅眉标/1957 年份+节点点/长卷指示/主按钮 |
| **H3 导航** | 三页实测：筹备中馆点击弹「该馆尚未开放 · 敬请期待」且 `aria-current` 不变；序厅→通史馆、通史馆→浇铸页路由正确 |
| **H4 响应式** | 375px：无横向滚动（scrollW=375）、单列、长卷轨收起 |
| **不回归** | 铸造馆 `layout()` **61/61**（V1–V8/W1–W9 全绿）；`__cast.selfTest()` **45/45**、wired ✓；首页截图零回归 |
| **JS gzip** | 165.02 KB（本轮 **+18.5 KB**，预算 ≤20 KB；总量 ≤400 KB） |

## 3. 交付截图

`entrance-default` / `entrance-sculpture` / `entrance-silhouette`（E1）/ `history-default` / `history-scroll` / `s4-hall-default`（回归）/ `s4-home`（回归），均在 `.workbuddy/shots/`。

## 4. 偏离与实现方判断（规格未写明处，逐条列出）

1. **主束段缝搭接 38%**（未走规格）：规格推荐的"12 截面圆柱"在相邻段方向转折 + 半径渐变处会留豁口——剪影上是白色缺口（E1 直接扣分）。实现为相邻段纵向搭接 1.38×；豁口消失，留下的环向棱线即 §1.3 明确允许的"沿流向凸棱"。逐轮探针迭代：12% → 25% → 38%（末段转向摊平后收口）。
2. **末段样条转向摊平**（未走规格）：`BEAM_PTS` 末三点方向变化从 24° 摊到 ~14°，否则剪影在主束急转处留白缺口。
3. **聚光灯位**（规格只给强度/距离/衰减/锥角/柔边）：取 `(2.0, 15.0, 11.0)`、目标 `(0, 5.4, 0)`——雕塑前上方，使光轴过雕塑中心、迎光面照亮。
4. **HemisphereLight "0.35 / 0.15"**：解读为天光强度 0.35 + 地光色按暗比取 `0x14181D`（HemisphereLight 只有一个 intensity 参数）。
5. **补光位**：`DirectionalLight 0.25` 从右前下方 → position `(10, 1.5, 9)`（默认射向原点，方向即"向左上"）。
6. **面数口径**：§1.3 "总面数目标 ≤200" 按四边形面计 = 主束 88 + Cone 24 + 飞溅 24 ≈ **136 面** ✓；按三角形计 272（RADIAL=8 + 12 截面是规格硬性推荐，与 ≤200 三角面不可兼得）。E4 门禁（≤5000 三角面）实测 300，余量充足。
7. **长卷轨指示段长 64px**（规格只说"指示段 2px 铁水橙"）：取 64px，随滚动进度沿 40vh 轨道位移。
8. **E1 三人盲测未执行**：本工作流无法组织真人盲测。剪影图已产出，实现方自评读作"倾倒的液体/浪涌"；**盲测需设计方/视频组执行**，若不过关，第一调整方向是主束末端弧度与飞溅块分布（已留探针脚本可快速迭代）。
9. **进场序列/说明条为 DOM 悬浮层**：S07 视口区是暗底占位（design/README 已声明），文字区块按画稿版式落位。

## 5. 环境坑记录（本轮新踩/复用）

- `?debug=1` 必须在 `#` **之前**（hash 路由）：`/?debug=1#/entrance`，写在 `#/entrance?debug=1` 会静默失效。
- 本机 Bash 无 `tail`：管道里用它会把整个构建吞掉假成功（本轮实际踩到，截图复测了旧 dist）。
- venv 的 python 在 `Scripts\` 子目录（Windows）；Pillow/numpy 已装入 `~/.workbuddy/binaries/python/envs/default`。
- 全角弯引号 “ ”（U+201C/201D）在写文件时可能被降级成 ASCII `"`——逐字校验文案时要把码位对上（H1 首轮就是栽在这两处）。
