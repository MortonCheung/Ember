# 交接提示词 · Step 3（发给代码实现方，可直接复制）

> **用途**：实现「亲手浇铸」交互与评分规则 —— 本作品创新性 40 分的主要落点。
> **对应规格**：`spec/STEP3-INTERACTION-SCORING-SPEC.md`
> **与 Step 2B 的关系**：文件不重叠，可分别进行；唯一交汇点是 `scene/viewport.js`（提示词 §6 已说明）
> **维护**：设计方 · 2026-09-15 21:00

---

```text
# 任务：Step 3 · 「亲手浇铸」交互与评分规则

你是本作品（中国工业博物馆 Web 数字展馆 · 辽宁省 VR 与新媒体创新设计大赛、
虚拟现实设计赛道 · 文化创意方向）的代码实现方。工作目录：D:\agent projects\project

Step 1、Step 2 均已验收通过。本轮做互动体验的第一条支线：**亲手浇铸**（画稿 S03）。
这是整个作品创新性 40 分的主要落点 —— 不是"点开看视频"，而是
「你调参数 → 铸件质量因此改变 → 你被评分，且每一分都能说出为什么」。

## 0. 先读这两份（按顺序）
1. spec/STEP3-INTERACTION-SCORING-SPEC.md  ← 本轮唯一依据。重点读 §2 交互流程、§3 参数模型、
                                             §4 评分模型、§5 数值对账、§10 边界情况、§11 验收 T1–T8、§12 实现约束
2. design/S03-亲手浇铸.png                 ← 视觉基准（左视口 + 右评分面板 + 底部双滑杆）
   （demo/README.md 的调试钩子与截图命令也请一并回看）

## 1. 本轮的验收命门（先看这条，它决定其他一切）
规则引擎必须**逐位复现**规格 §5 的对账表。输入 sandbox_8（阀体）、T=1380、V=15、H=6.2，必须输出：

    造型完整度 88 · 气孔控制 53.8（显示 54） · 铁水利用率 76 · 总分 71.92（显示 72）
    徽标「偏低 · 需升温」 · 注解「温差过大，铸件将产生缩孔」 · 建议速度「12–18 kg/s」
    主因缺陷「气孔」 · 建议文案「可提升至 90 分以上」

这九项全部对上才算实现正确。**请把这张表写成单测或一个 __cast.selfTest() 调试方法**，
结果贴进交付说明。对账不过就是实现错了，不是文档错了。

## 2. 要做什么（严格按规格）
- §2 五步状态机：①取样 → ②调温 → ③浇注 → ④开箱 → ⑤评分（每步的输入/输出/校验/出口都写了）
- §3 参数模型：4 种铸件理想窗口表 + 12 只砂箱表（铸件 / 初始湿度 / 馆藏对应）
- §4 评分模型：三项权重 40/40/20 + 12 条缺陷规则矩阵（系数与上限都在表里）+ 诊断文案模板
  · 三条实现纪律必须遵守：同一参数在同一子项内只取最大一条 / 每条独立设上限 / 内部浮点只显示时才取整
- §6 等级映射与工牌字段  ·  §7 馆藏解锁（12 件，总分 ≥75 解锁）
- §10 边界情况 E1–E18  ·  §8 车削模块**本轮不做**（等浇铸验收通过后再开）

## 3. 硬约束（违反即返工）
- **评分引擎必须是纯函数**：score(params) → result，无 DOM、无存储、无随机、无时间依赖。
  这是"可复现、可解释"能成立的前提，也是 §5 能被单测的前提。
- **零随机**：不得使用 Math.random()。所有"变化"来自 §3.2 的静态表。
- **clamp 与 Number.isFinite 统一在引擎入口做**，不要散落在 UI 层。
- **允许改动**：新增 src/js/scoring/(*)、src/js/pages/cast.js、src/js/scene/cast-scene.js；
  router.js 只新增两条路由；layout.css 新增页面样式；导航「互动体验」href 由 # 改为 #/cast
- **允许受控改动**：scene/viewport.js 只做"场景参数化"（见 §12 第 9 条，给出签名）；
  hall.js 若需加射线逻辑
- **不允许改动**：tokens.css、scene/workshop.js、scene/props/*、scene/environment.js、
  scene/textures.js、scene/merge.js
- **不允许改变**：Step 2 的 userData.sandboxNames 拾取约定（sandbox_0…11）
- **不要复制一份 viewport.js**：把它参数化（buildScene / cameraPos / target / debugKey 四个可选参数，
  默认值保持现状 → Step 1/2 行为零变化），#/cast 传 debugKey:'__cast'
- **砂箱必须复用 scene/props/sandboxes.js 的 buildSandboxes()**（已是 InstancedMesh + userData 命名），
  不要另写一套。这正是 Step 2 预留拾取约定的兑现点。
- 无新增运行时依赖；prefers-reduced-motion 下所有动画降级为静态切换

## 4. 交付物（缺一不可）
1. src/js/scoring/（数据表 + 纯函数引擎）
2. src/js/pages/cast.js + src/js/scene/cast-scene.js（完整可玩的 #/cast）
3. **§5 对账表的单测或 __cast.selfTest() 实测输出**（截图或文本）
4. 三张截图：步骤①取样（含砂箱可拾取状态） / 步骤⑤评分（右栏三项分 + 诊断文案） / 移动端 375px 一版
5. 实测读数：首包 gzip（预算 ≤400KB，本轮新增 JS 建议 ≤30KB）、draw call（≤120）
6. 在 spec/STEP3-INTERACTION-SCORING-SPEC.md 末尾追加「实现说明」：做了什么 / 偏离了什么 / 为什么

## 5. 验收（T1–T8）
- T1 §5 对账表逐位复现 ← 命门
- T2 五步状态机完整走通，砂箱一次性与「重新制型」正确
- T3 12 只砂箱的铸件/湿度与 §3.2 一致，拾取复用 sandbox_0…11
- T4 12 条缺陷规则每条都能被触发（遍历测一遍）
- T5 边界 E1–E18 逐条验证（E1/E3/E4/E5/E9/E12/E15/E16 必须有实测记录）
- T6 等级映射与工牌字段符合 §6（91 分必须是「铸造工·二级」）
- T7 不破坏已通过项：A1–A8、S2-1–S2-8、D1–D5 不回归，控制台零报错
- T8 性能不回归

## 6. 与 Step 2B（车床细节补强）的关系
两者文件不重叠，可分别进行、也可同一会话连着做。
唯一交汇点是 scene/viewport.js（2B 加 __hall.silhouette 剪影钩子、本步加场景参数化）——
**若两轮一起做，请把 viewport.js 的改动合并成一次编辑**，不要分两次覆盖。
建议顺序：先 2B（体量小），再 Step 3。

## 7. 环境提醒（本机踩过的坑，照做可省时间）
- 构建：用 PowerShell 工具，把输出重定向到文件再用 Read 读（该工具不回传 stdout）
- 不要用 bash 工具的管道（本机 bash shim 缺 tail/ls/dirname，会假报失败）
- 起预览服务：用 bash 后台任务跑
  node node_modules/vite/bin/vite.js preview --port 4173 --strictPort
  （PowerShell 的 Start-Process 起不来 vite，别试）
- 截图必须走 CDP（Edge 的 --headless --screenshot 在本机静默失败，rc=0 不产文件）
  可用 tools/screenshot.py 或 .workbuddy/shot_hall.py；页面内执行 JS 可用 .workbuddy/eval_page.py
- 只有 URL 带 ?debug=1 才暴露调试钩子；正式访问路径不受影响

## 8. 明确不要做的事
- 不要做车削模块（§8）—— 等浇铸验收通过后另发规格
- 不要改 Token、不要改 Step 1/2 已验收的场景文件、不要重构、不要升级依赖
- 不要为了让分数"看起来好看"而自行调整规格里的系数或权重
  （那组数值是从已出画稿反解出来的，改了就和 design/S03 矛盾）

完成后回一句：做了什么、偏离了什么、§5 对账结果如何、图出好了没。
```
