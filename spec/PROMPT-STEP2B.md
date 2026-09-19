# 交接提示词 · Step 2B（发给代码实现方，可直接复制）

> **用途**：把「C620-1 车床细节补强」这一轮插到 Step 3 之前。
> **对应规格**：`spec/SCENE-ASSETS-STEP2B-DETAIL.md`
> **维护**：设计方 · 2026-09-15 18:50

---

```text
# 任务：C620-1 车床细节补强（Step 2B）

你是本作品（中国工业博物馆 Web 数字展馆 · 辽宁省 VR 与新媒体创新设计大赛、
虚拟现实设计赛道 · 文化创意方向）的代码实现方。工作目录：D:\agent projects\project

上一轮你交付的 Step 2 场景已验收通过（见 spec/STEP2-ACCEPTANCE-REVIEW.md §六 复审记录）。
本轮只做一件事：把这台 C620-1 车床从"一列火车"改成"一眼认出是车床"。

## 0. 先读这三份（按顺序）
1. spec/SCENE-ASSETS-STEP2B-DETAIL.md   ← 本轮唯一依据。重点：§1 判据、§2 特征清单、§4 验收标准 D1–D5
2. spec/SCENE-ASSETS-STEP2.md §4 / §4.1 ← 材质、光照、环境贴图沿用，本轮不动
3. demo/README.md                       ← 调试钩子与截图命令

## 1. 为什么要改（一句话）
上轮车床的尺寸全部正确，但规格只给了 6 个盒子（床身/主轴箱/尾座/溜板箱/丝杠/卡盘），
没有一个"可辨认特征"，所以剪影读起来是火车：床身=车厢、卡盘=车轮、尾座=司机室。
这是设计方的规格缺陷，不是你的执行问题。本轮按新清单补齐特征。

## 2. 要做什么（严格按规格 §2）
- 必加六项（§2.1）：工件 / 方刀台+刀头 / 手轮×3+摇把 / 尾座套筒+顶尖 / 主轴箱顶部罩壳 / 冷却液托盘
- 建议加五项（§2.2）：变速手柄×4+开关盒 / 铭牌 / 光杠+开合螺母手柄 / 电机+皮带轮 / 卡盘爪做台阶
- 修一处关系错误（§2.3）：尾座轴线 y≈1.55 → 1.85，与卡盘同心（现在顶尖顶在工件下方 30cm）
- 加一个调试钩子（§1.1）：__hall.silhouette(true/false)
  实现：全场景材质临时换成纯黑 MeshBasic（记得保存/还原原材质），背景换纯白。用于剪影测试。

## 3. 硬约束（违反即返工）
- 只允许改 demo/src/js/scene/props/lathe.js 和 demo/src/js/scene/viewport.js（后者只为加钩子）
- 不要顺手改其他道具（天吊小车、冲天炉铁水包另开一轮，避免复核口径混乱）
- 新增几何必须并入现有 paintGeos / steelGeos 两个数组，mergeGeometries 后车床仍是 2 个 mesh；
  只有铭牌允许单独成第 3 个 mesh。不要为了细节拆成十几个 mesh（这是唯一的性能红线）
- 材质、光照、环境贴图不改
- 位置关系自检必须过：共轴（主轴=卡盘=工件=尾座套筒，同一水平线 y=1.85）、
  中心高（刀尖落在 y≈1.85）、接地（最低点 y=0）

## 4. 交付物（缺一不可）
1. 改后的 props/lathe.js（+ viewport.js 的钩子）
2. 剪影图 1 张：先 __hall.silhouette(true)，再出图（供 D1 剪影测试）
3. 普通机位图 2 张：lathe 与 default 机位各 1 张
   —— 必须与 rv-lathe.png / s2-00-default.png 同机位，便于设计方做前后比对
4. 在 spec/SCENE-ASSETS-STEP2B-DETAIL.md 末尾追加「实现说明」：做了什么 / 偏离了什么 / 为什么
5. 实测读数：draw call、三角面、车床 mesh 数

## 5. 验收标准（D1–D5）
- D1 剪影测试：高度 128px 纯黑剪影下，3 人盲测 ≥2 人答出"车床/机床"（设计方判）
- D2 必加六项齐备
- D3 位置关系三条自检通过
- D4 性能不回归：draw call ≤120、三角面 ≤300k、车床 mesh 数 ≤3
- D5 已通过的 S2-1~S2-8 不回归、控制台零报错

## 6. 环境提醒（本机踩过的坑，照做可省时间）
- 构建：用 PowerShell 工具，把输出重定向到文件再用 Read 读（该工具不回传 stdout）
- 不要用 bash 工具的管道（本机 bash shim 缺 tail/ls/dirname，会假报失败）
- 起预览服务：用 bash 后台任务跑
  node node_modules/vite/bin/vite.js preview --port 4173 --strictPort
  （PowerShell 的 Start-Process 起不来 vite，别试）
- 截图必须走 CDP（Edge 的 --headless --screenshot 在本机静默失败，rc=0 不产文件）
  可用 tools/screenshot.py 或 .workbuddy/shot_hall.py
- 只有 URL 带 ?debug=1 才暴露 window.__hall；正式访问路径不受影响

## 7. 明确不要做的事
- 不要开始 Step 3（交互与评分规则表）—— 等本轮复审通过后设计方另发规格
- 不要重构、不要升级依赖、不要改样式、不要动其它道具

完成后回一句：改了什么、偏离了什么、3 张图出好了。
```
