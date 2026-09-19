# 中国工业博物馆数字展馆 · 代码实现交接

> **你是谁**：本作品的代码实现方（AI 工作流）。
> **你要做什么**：把已完成的设计实现为可运行的网页。
> **本阶段任务**：Step 1 —— 空壳跑通（不是做成品）。
>
> 设计已全部完成，你**不需要做任何设计决策**。遇到文档没写的情况，停下来问，不要自己发挥。

---

## 第一步：按顺序读三份文档

| 顺序 | 文件 | 读什么 |
|---|---|---|
| 1 | [`spec/PROJECT-BRIEF.md`](spec/PROJECT-BRIEF.md) | **为什么做**：立意、评分策略、真实史实、交接物清单（§0） |
| 2 | [`spec/STEP1-IMPLEMENTATION-SPEC.md`](spec/STEP1-IMPLEMENTATION-SPEC.md) | **怎么做**：验收标准 A1–A8、技术栈、Token、场景参数、性能预算 |
| 3 | [`design/README.md`](design/README.md) | **长什么样**：11 张设计稿 + 哪些细节已被新决策取代 |

**冲突优先级**：实现规格 > 设计稿 > demo 代码。

## 第二步：证明你的环境能干活（开工前自检）

依次完成，任何一步失败先解决再继续：

1. **跑通基线**：进入 `demo/`，执行 `npm install && npm run build && npm run preview`，浏览器打开 `http://localhost:4173/`，能拖拽旋转展厅里的车间
2. **截图能力**：`python tools/screenshot.py "http://localhost:4173/#/hall" selftest 9000`，生成 `.workbuddy/shots/selftest.png`
3. **读图能力**：用你的读图能力查看该 PNG，确认能看到"冲天炉 + 炉口橙环 + 横向场馆导航"

> 这一步是刻意设计的门槛。**能跑、能截、能看**，之后的"视觉比对"验收才有意义。
> （上一版项目就是死在没有验证环节——代码看起来对，跑起来全崩。）

## 第三步：做 Step 1

- 范围：`STEP1-IMPLEMENTATION-SPEC.md` §1 的验收标准 **A1–A8**
- 基线：`demo/` 里已有一个跑通的骨架，可在其上迭代，也可重写（重写前先确认你能过 A1–A8）
- 已知坑：规格 §0.2（本机 AI shell 缺 `tail`/`ls`，**命令不要用管道**；Edge 截图必须走 CDP）
- Step 2/3 的内容（热点、评分、工牌、天吊、砂箱……）**一律不做**，哪怕 `design/` 里有图

## 交付要求（Step 1 完成时）

1. 可运行的代码仓库（含 README：如何启动）
2. **线上可访问的预览链接**（Vercel / Netlify 任意）—— 这是 B 档硬要求
3. 性能自测截图：Lighthouse 三项分数 + 空闲态 FPS
4. 降级页截图（禁用 WebGL 后访问）
5. 两张 1440×900 截图（首页 + 展厅），供设计方做视觉比对

**验收通过后，设计方会解锁 Step 2（场景做实），并提供 `spec/SCENE-ASSETS-STEP2.md` 作为建模依据。**

---

## 目录说明

```
project/
├── README.md            ← 本文件
├── spec/                ← 全部规格文档（代码实现方的工作依据）
│   ├── PROJECT-BRIEF.md
│   ├── STEP1-IMPLEMENTATION-SPEC.md
│   ├── SCENE-ASSETS-STEP2.md
│   ├── SCENE-ASSETS-STEP2B-DETAIL.md   ← 道具细节补强（尺寸基准见下一行）
│   ├── SCENE-LAYOUT-FIX-SPEC.md        ← 场景布局与尺度修正（Step 2C；**§10 修订记录 = 定稿数值**，覆盖 §2–§3 旧值；§10A = R2 历史）
│   ├── STEP3-INTERACTION-SCORING-SPEC.md ← 交互与评分规则（创新性 40 分核心）
│   ├── ENTRANCE-HISTORY-SPEC.md        ← Step 4：序厅三维场景 + 通史馆长卷（**§1.2–§1.5 已被 ENTRANCE-FURNACE-SPEC 取代；§1.6 起与 §2 通史馆仍有效**）
│   ├── ENTRANCE-VISUAL-REVISION.md     ← Step 4A：序厅视觉重修（**已作废 2026-09-18**；§1 诊断与 §8 偏离裁定留档）
│   ├── ENTRANCE-FURNACE-SPEC.md        ← **Step 4C：序厅方向定案《炉前》—— 现行唯一依据**（炉壁 46×18 / 拱顶炉口 12×7.5 / 炉膛净深 5.0 / 铁水沟 / 亮度分层判据）
│   ├── VISUAL-REFINE-SPEC.md           ← **视觉细化（三包 W1 地面 / W2 序厅 / W3 浇铸互动）—— 现行唯一依据**；含**解冻表**（`textures.js` / `workshop.js` / `environment.js` / `props/sandboxes.js` 有界解冻）
│   ├── PROMPT-*.md                     ← 给代码工作流的可复制提示词（STEP2B / STEP3 / INTERACTIONS-FIX / SCENE-LAYOUT / SCENE-LAYOUT-R3 / SCENE-CART-R4 / SCENE-R5-FIX / ENTRANCE-HISTORY / ENTRANCE-VISUAL / ENTRANCE-FURNACE / HISTORY-CTA-FIX / VISUAL-REFINE）
│   │                                     ⚠️ 「当前可发」= **VISUAL-REFINE**（三包视觉细化）+ HISTORY-CTA-FIX；其余为留档件（已实现）
│   ├── RENAME-SCOPE.md                 ← 《铁流凝变》残留处置（**已裁定 C · 折中**：说明条保留真实馆藏锚点，正文不得否认它；并明列首页 / 通史馆 / BRIEF 一律不动）
│   ├── IMPLEMENTATION-STEP4-REPORT.md  ← 实现方 Step 4 交付自述（含 9 条偏离）
│   ├── NOTICE-R5-FIX-CLOSEOUT.md       ← 场景冻结通知（R5-FIX 三条偏离已裁定，之后改动须新起 R6）
│   ├── STEP1-ACCEPTANCE-REVIEW.md      ← 设计方验收结论
│   └── STEP2-ACCEPTANCE-REVIEW.md      ← 设计方验收结论（含复审记录）
├── design/              ← 设计稿导出图（视觉验收基准，9 张）+ 阅读说明
├── demo/                ← 可运行的 Step 1 基线（Vite + three.js）
│   └── 启动预览.bat      ← Windows 双击即可看效果
├── tools/
│   └── screenshot.py    ← 无头截图工具（验收自测用）
└── scroll-world/        ← ⚠️ 已废弃，与本作品无关，不要读、不要用
```

## 环境速查

| 事项 | 说明 |
|---|---|
| Node | 系统已装 v22.22.2；若 `npm` 不在 PATH，用 `C:\Users\savetime\.workbuddy\binaries\node\versions\22.22.2-3\node.exe` + 同目录 `node_modules\npm\bin\npm-cli.js` |
| Python（工具脚本用） | `C:\Users\savetime\.workbuddy\binaries\python\versions\3.13.12\python.exe` |
| 浏览器（无头） | Edge 153：`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |
| ⚠️ AI shell | 带 `\|` 管道的命令会假报失败（见 PROJECT-BRIEF §9.3），**不要用管道** |
| ⚠️ Edge 截图 | `--screenshot` 参数无效，必须走 CDP（用 `tools/screenshot.py`） |

---

*有任何不确定，先查规格，规格没写就停下来问。猜，是这类项目失败的第一原因。*
