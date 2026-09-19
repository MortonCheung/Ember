# 互动效果缺失 · 排查报告与修复提示词

> **排查日期**：2026-09-15 21:20
> **排查对象**：`#/cast` 浇铸页三维互动、`#/hall` 展厅热点、`#/` 首页滚动飞越
> **结论**：分两类 —— **A 类：接线断裂（代码已写好，调不到）**、**B 类：从未实现（无规格/无资产）**

---

## 一、排查摘要（提示词的前提，勿删）

### A 类 · 根因：一处返回值不匹配，导致 11 处调用全部静默空转

| 项 | 内容 |
|---|---|
| **根因文件** | `demo/src/js/scene/viewport.js` |
| **根因代码** | 第 260 行 `return { dispose };` —— `mountViewport` **只返回 `dispose`**，没有返回 `scene / camera / canvas / controls` |
| **应有形态** | `spec/STEP3-INTERACTION-SCORING-SPEC.md` §12.9 第 9 条明确要求返回这些句柄供拾取 |
| **受害文件** | `demo/src/js/pages/cast.js` |
| **静默机制** | `cast.js` 全用可选链与真值守卫，缺句柄时**不报错、直接跳过** |
| **受影响组件** | `cast-scene.js` 挂在 `cast_scene.userData.api` 上的交互 API（`setSelected` / `setConsumed` / `openBox` / `finishOpen` / `resetBoxes` / `pickMeshes`）—— **API 本身已完整实现，只是没人能调到它** |

**证据链**（三层，可复核）：

1. `viewport.js` 全部 `return` 穷举只有两处：第 44 行（降级 `{ dispose() {} }`）、第 260 行（`{ dispose }`）。
2. `cast.js:135` `vp.scene?.getObjectByName('cast_scene')?.userData.api ?? null` → `vp.scene` 为 `undefined` → **`sceneRef = null`**。
3. `cast.js:408` `if (els.canvas && sceneRef) { …addEventListener(…) }` → 第 173 行 `canvas: vp.canvas` 同为 `undefined` → **守卫短路，指针监听从未挂上**。
4. `cast-scene.js:466` 自己写着注释「cast.js 经 `vp.scene.getObjectByName('cast_scene').userData.api` 取用」—— **接口契约只差这一根线**。

**因此失效的互动（`cast.js` 全部 11 处调用点）**：

| 行 | 调用 | 失效的互动效果 |
|---|---|---|
| 147 / 362 / 441 | `setConsumed` | 已消耗砂箱的压暗外观 |
| 338 | `setSelected` | **点选砂箱后的选中高亮** |
| 409 / 410 | 指针监听 | **悬停光标反馈（pointer / not-allowed）+ 点选砂箱** |
| 375 | `openBox` | **开箱动画（上箱抬升 + 型砂散落 + 铸件显现）** |
| 437 | `finishOpen` | 「跳过」直达评分 |
| 444 / 453 | `resetBoxes` | 「重新制型」后砂箱复原 |
| 497 / 504 | 调试驱动 | `__cast.setStep()` 的选箱/复位 |

**最严重的一条**：`selectSandbox()` 全项目**只被 `onPick` 调用**（第 405 行），而 `onPick` 从未挂载
→ **真实用户（不带 `?debug=1`）根本点不动砂箱，整条浇铸流程无法进入。**
上一轮的验收截图是用 `__cast.setStep(n)` 驱动出来的（绕开了射线拾取），所以"看起来通过"。

**附带两处文档失真**（在 `STEP3-INTERACTION-SCORING-SPEC.md` 文末「实现说明」）：

- 第 481 行称「返回值追加 `scene/camera/canvas/controls` 供拾取」—— **与代码不符**。
- 第 500 行的偏离 5 把「开箱动画未推进」归因为「无头 rAF 受限、极端掉帧按帧数推进」
  —— **归因错误**：真实原因是 `sceneRef` 为 `null`，动画**从未被启动过**。

### B 类 · 从未实现（各有原因，都不是 bug）

| 互动 | 现状 | 为什么没有 |
|---|---|---|
| **首页滚动飞越** | `home.js` 的 `.flyover` 是静态占位，**全项目无任何 `scroll` 监听**；`layout.css` 的 `.flyover__fill` **硬编码 `width: 34%`** | ① `STEP1-IMPLEMENTATION-SPEC.md` §5.3 写「❌ 滚动飞越交互动画（那是 Step 3 或视频线的事）」→ **从未有哪一份规格真的接管它**；② 它按早期决策依赖「24 段预渲染视频链」，素材由小组视频成员承担，**尚未交付** |
| **展厅热点 + 信息卡** | `hall.js` 无 `Raycaster`（`Raycaster` 只出现在 `cast.js`）；`design/S02` 已画好的热点药丸与信息卡**完全不存在** | `STEP1-IMPLEMENTATION-SPEC.md` §10 冻结事项第 3 条：「不要提前做 Step 2/3 —— **热点**、评分、工牌全部不做」。Step 2 只做场景几何、Step 3 只做浇铸/车削评分 → **展厅热点的冻结从未被解除** |
| **场馆导航切内容** | 点击只切选中态，HUD 标题与场景都不变 | 只有铸造馆有内容，其余四馆无场景 |
| **W/A/S/D 漫游** | 提示文案只写「拖拽旋转 · 滚轮缩放」，画稿写的是「拖拽鼠标环视 · W/A/S/D 移动 · 滚轮缩放」 | 同上，Step 1 未做 |
| **WebXR 沉浸入口** | `hall.js:27` `aria-disabled="true"`，`title="Step 3 接入 WebXR"` | B 档把 WebXR 定位为"增强入口"，Step 1/2/3 都没安排 |

> **一句话总结**：A 类是一行返回值的接线断裂（代价 1 行，但让浇铸页对真实用户不可玩）；
> B 类是**三处规格缺口**（首页飞越、展厅热点、场馆导航），其中首页飞越还叠加了**视频素材依赖**。

---
---

## 二、提示词（以下内容整段复制给 AI 编程助手）

```text
# 任务：修复并补齐页面互动效果（P0 接线断裂 / P1 展厅热点 / P2 首页滚动飞越）

工作目录：D:\agent projects\project
背景：本作品为中国工业博物馆 Web 数字展馆（辽宁省 VR 与新媒体创新设计大赛 · 虚拟现实设计赛道 · 文化创意方向）。
Step 1/2/2B/3 均已交付，浇铸评分引擎已通过 44/44 自测。但**页面上有若干互动效果不生效**，
本轮就是修它们。请先读本提示词第 0 节的排查摘要，那是已经定位好的事实，不用重新排查。

## 0. 已完成的排查结论（照此修，不要重新怀疑方向）

【P0 根因】demo/src/js/scene/viewport.js 第 260 行 `return { dispose };`
  —— mountViewport 只返回了 dispose，没有返回 scene / camera / canvas / controls。
  这违反 spec/STEP3-INTERACTION-SCORING-SPEC.md §12.9 第 9 条（该条要求返回这些句柄供拾取）。
  连锁反应：
    · cast.js:135 `vp.scene?.getObjectByName('cast_scene')?.userData.api ?? null` → sceneRef = null
    · cast.js:173 `canvas: vp.canvas` → undefined
    · cast.js:408 `if (els.canvas && sceneRef)` → 守卫短路，指针监听从未挂上
  因为全部用可选链与真值守卫，所以**静默失败、控制台干净**，上一轮没被发现。
  失效范围：cast.js 全部 11 处调用点（147/338/362/375/409/410/437/441/444/453/497/504）——
  悬停光标、点选砂箱、选中高亮、已消耗压暗、开箱动画、跳过、重新制型、调试驱动全部空转。
  其中最严重：selectSandbox() 全项目只被 onPick 调用（cast.js:405），而 onPick 从未挂载
  → 真实用户（不带 ?debug=1）无法点选砂箱，整条浇铸流程进不去。
  注：cast-scene.js 一侧的 API（pickMeshes / setSelected / setConsumed / openBox / finishOpen /
  resetBoxes）**已经完整实现**并挂在 cast_scene.userData.api 上（见 cast-scene.js:466 的注释）。
  差的就是这一根线。

【B 类：从未实现，需新建】
  · 展厅热点药丸 + 信息卡：hall.js 里没有 Raycaster（Raycaster 只在 cast.js 里出现过）
  · 首页滚动飞越：home.js 的 .flyover 是静态占位；全项目无任何 scroll 监听；
    layout.css 的 .flyover__fill 硬编码 width:34%
  · 场馆导航只切选中态、不切内容；W/A/S/D 漫游未做；WebXR 按钮 title 里写着"Step 3 接入 WebXR"

## 1. 先读这三份
  1) spec/STEP3-INTERACTION-SCORING-SPEC.md §12.9（视口参数化要求）与文末「实现说明」
  2) design/S02-虚拟展厅.png  ← 热点药丸 / 信息卡 / 底栏提示文案的唯一权威
  3) design/S01-首页Hero.png  ← 滚动飞越区块的样子
  （spec/PROJECT-BRIEF.md §4 是可用史实清单，信息卡正文只许从这里取）

## 2. P0 · 根因修复（最高优先级，改动约 1 行）
  1) viewport.js 第 260 行改为返回：
     return { scene, camera, canvas, controls, dispose };
  2) 第 44 行的降级提前返回（`return { dispose() {} };`）保持原样即可 ——
     cast.js 用 `?.` 与真值守卫，缺键是安全的，那里本来就是"不可用"语义。
  3) 不要改 cast.js 的业务逻辑，也不要给它的守卫加"兜底默认值"——
     那些守卫是正确设计，本轮只是把缺的句柄补上。
  4) **把静默失败变成可断言的**（这条很重要）：
     · 给 __cast.state() 增加字段 wired（= 句柄齐全 且 指针监听已挂载）
     · 在 selfTest() 里加一条断言，使总项数 44 → 45
     目的：以后这类"接线断了但控制台干净"的问题，自测就会红。

  P0 验证（逐条给出实测结果，不要只说"已修"）：
     · __cast.state().wired === true
     · __cast.selfTest() 中 pass:false 的数量为 0（共 45 项）
     · 悬停砂箱 → canvas.style.cursor === 'pointer'；悬停已消耗砂箱 → 'not-allowed'
     · 点选砂箱 → state.selected 变为该序号，且砂箱在三维里出现选中高亮
     · 走完 ③ 浇注 → ④ 开箱动画真实播放（上箱抬升 + 型砂散落 + 铸件显现），「跳过」可直达评分
     · 点「重新制型」→ 砂箱恢复未消耗外观
  ⚠️ 请在有头浏览器里复验开箱动画。上一轮实现说明把"开箱动画没推进"归因为"无头 rAF 受限"，
     那是误判：真实原因是 sceneRef 为 null，动画从未被启动。请在文档里更正这处归因。

## 3. P1 · 展厅热点与信息卡（按 design/S02 实现，这是画稿已有、代码全无的部分）

> **2C-R5.1 修订（2026-09-16，设计方口头收口，`SCENE-LAYOUT-FIX-SPEC.md` §10.8-E 确认接受）**：热点药丸集合由
> 「十吨冲天炉 / 十吨天吊 / 成型砂箱」改为 **「十吨冲天炉 / 成型砂箱 / C620-1 普通车床」**
> —— 天吊是"顶部叙事"，药丸在默认机位被钳回屏内后与展品脱节，故移除（§10.8-E）；
> 车床是全篇唯一有具体型号 + 具体史实的展品，原先反而没有标注，故补上。
> 信息卡主按钮随展项切换：冲天炉/砂箱 →「进入浇铸互动」→ #/cast；
> 车床 →「进入协作车削」，因 #/turn（Step 3B）未上线，**点击给提示条、不跳路由**
>（`PAGES` 里没有 turn，`go('turn')` 会静默回首页）。上线时把 `hall.js` 的 `CTA_TURN.go`
> 改成 `'turn'` 即可。车床信息卡正文照抄 PROJECT-BRIEF §4：1955 年沈阳第一机床厂研制；
> 图案登上第三套人民币 2 元纸币正面。年产量最高 2200 台，国内市场占有率超八成，远销 70 多个国家。

  · 热点药丸 ×3，悬浮在三维里对应展品上方（用展品 world position 投影到屏幕算坐标，
    每帧或相机变化时更新 CSS transform，不要手写死坐标）：
      十吨冲天炉 / 十吨天吊 / 成型砂箱
    样式：深色半透明药丸 + 白字；悬停放大并变铁水橙描边；选中态为铁水橙底 + 深色字。
  · 信息卡（点击热点后出现在右侧面板）：
      eyebrow「重点展项 · 国家工业遗产」（铁水橙，--fs-caption）
      标题（--fs-h2，粗体）
      正文（--fs-body，--c-text-muted）
      全宽铁水橙主按钮「进入浇铸互动」→ 路由到 #/cast
  · 三条正文照抄，不要改写史实：
      十吨冲天炉：炉身高 12 米，总重 300 吨。1957 年投用至 2007 年熄火，服役半个世纪，
                  累计熔化铁水近百万吨、生产铸件 60 余万吨。
      十吨天吊：十吨桥式起重机，服务于冲天炉加料与铸件转运；它是这个 30 米举架的车间里，
                给人尺度感的那一笔。
      成型砂箱：一件一箱，浇注即废。这 12 只砂箱是本作品的交互载体——点它们可以亲手浇一次。
  · 拾取实现：复用 cast.js 的射线拾取写法（Raycaster + instanceId 查 userData）。
    展厅需要给可交互展品加标注：允许在 scene/workshop.js 与 props/* 里**追加** userData.hotspot
    （形如 { id, title, kind }），但**不得改动既有几何、尺寸与命名约定**。
  · 场馆导航（序厅/通史馆/铸造馆/机床馆/汽车馆）：只有铸造馆有内容。
    其余四个点击后必须给出明确反馈（页面内提示条「该馆尚未开放 · 敬请期待」），
    不能像现在这样静默只切选中态 —— 那在观众看来就是"点了没反应/坏了"。
  · 底栏提示补齐为画稿原文：「拖拽鼠标环视 · W/A/S/D 移动 · 滚轮缩放」，
    并实现 W/A/S/D 沿地面平移（同时平移相机与 controls.target，不破坏 OrbitControls 的
    旋转与缩放；把活动范围限制在车间内，别穿墙）。
  · WebXR 按钮：保持不可用，但把 title 从"Step 3 接入 WebXR"改成面向观众的说法
    （如「沉浸模式需连接 VR 设备」）。**不要向观众暴露内部开发进度。**

## 4. P2 · 首页滚动飞越（不等视频素材，先做降级实现）
  现状：.flyover 是静态占位面板，layout.css 的 .flyover__fill 硬编码 width:34%，无 scroll 监听。
  按"没有视频也能跑"的降级路径实现：
  · 三个章节（与既有 caption 文案一致）：①厂区外景 ②序厅《铁流凝变》 ③铸造馆冲天炉
  · 每章一张静态主视觉：CSS 渐变 + 程序化深色工业质感即可（**不要真实图片、不要生成图片**）
  · 滚动注入 CSS 变量 --flyover-progress（0–1），.flyover__fill 的 width 由它驱动
    （删掉硬编码的 34%）
  · 章节高亮随进度切换；章节标题与一句简短说明交替出现
  · 把面板里的「Step 2 接入 · 当前为占位」替换为真实章节名 —— 观众不该看到"占位"字样
  · **只为视频预留接口，不实现视频**：留 <video> 槽位 + data-asset-status="placeholder|ready"；
    ready 时改为 scrub（video.currentTime = progress × duration）。本轮不引入任何视频文件。
  · prefers-reduced-motion：不监听滚动，直接展示最终章节

## 5. 硬约束
  · 不改 tokens.css（色彩/间距/字号是设计系统）；橙色仍只用于：主按钮 / 当前选中态 / 关键数值 / 进度条
  · 不引入新依赖、不重构、不升级 three、不改 Step 1/2/2B 已验收的几何与参数
  · P0 只动 viewport.js 的返回值 + cast.js 的 wired 断言
  · P1 可动 hall.js、layout.css（新增样式）、必要处给 workshop.js / props 追加 userData.hotspot
  · P2 只动 home.js、layout.css
  · 三步互不冲突，可分别提交；建议顺序 P0 → P1 → P2（P0 最便宜、影响最大）

## 6. 交付物
  1. 改动后的文件
  2. P0 实测记录：wired / 光标取值 / 点选结果 / 开箱动画（有头）/ 45 项自测零失败
  3. 截图：#/cast 点选砂箱（体现悬停光标或选中高亮）/ #/hall 热点药丸 + 信息卡 / #/ 滚动飞越三个章节
  4. **更正 spec/STEP3-INTERACTION-SCORING-SPEC.md 文末「实现说明」的两处失真**：
     ① 「返回值追加 scene/camera/canvas/controls 供拾取」——实际没有，本轮才补上
     ② 偏离 5 把开箱动画未推进归因于无头 rAF —— 实际是 sceneRef 为 null，动画从未启动
  5. 性能读数：首包 gzip（≤400KB）、#/hall 与 #/cast 的 draw call（≤120）、控制台零报错

## 7. 环境提醒（本机踩过的坑，照做可省时间）
  · 构建：用 PowerShell 工具，输出重定向到文件再用 Read 读（该工具不回传 stdout）
  · 不要用 bash 工具的管道（本机 bash shim 缺 tail/ls/dirname，会假报失败）
  · 起预览服务：bash 后台任务跑
    node node_modules/vite/bin/vite.js preview --port 4173 --strictPort
    （PowerShell 的 Start-Process 起不来 vite，别试）
  · 截图必须走 CDP（Edge 的 --headless --screenshot 在本机静默失败）；
    页面内跑 JS 用 .workbuddy/eval_page.py，出图用 .workbuddy/shot_hall.py 或 tools/screenshot.py

## 8. 明确不要做的事
  · 不要重新排查根因（第 0 节已定位，含证据链）
  · 不要动评分引擎的系数与权重（那是从已出画稿反解出来的）
  · 不要实现车削模块（Step 3B 未开）
  · 不要引入视频/图片素材（P2 只写接口）
  · 不要顺手改 Token、不要重构、不要升级依赖

完成后回一句：P0 的 wired 与自测结果、P1/P2 各做了什么、偏离了什么、图出好了没。
```
