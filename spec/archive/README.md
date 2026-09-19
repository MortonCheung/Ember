# spec/archive —— 历史过程文档

这里存放的是**已经完成使命的过程文档**，保留是为了留痕，**不是当前施工依据**。
任何以它们为准的实现改动都可能与现行规格冲突。

归档时间：2026-09-19

## 归档内容与原因

| 类别 | 文件 | 为什么归档 |
|---|---|---|
| 自述作废 | `ENTRANCE-VISUAL-REVISION.md` | 文件开头已自标「⛔ 本文件已作废（2026-09-18）」，序厅方向在第 4C 轮整体改为「炉门 · 炉膛」 |
| 交接提示词 | `PROMPT-*.md`（10 份） | 发给代码实现方的执行摘要，对应轮次均已施工完成；其中 `PROMPT-ENTRANCE-HISTORY.md` 自身已标注「⛔ 不要再整份发出」 |
| 实现自述 | `IMPLEMENTATION-STEP4*.md`、`IMPLEMENTATION-VISUAL-REFINE.md` | 实现方交付时的自述记录，已被后续轮次取代 |
| 验收评审 | `STEP1-ACCEPTANCE-REVIEW.md`、`STEP2-ACCEPTANCE-REVIEW.md` | 设计方当时的验收结论，评审对象已被后续轮次覆盖 |
| 已完成规格 | `STEP1-IMPLEMENTATION-SPEC.md` | Step 1 空壳阶段的实现规格，产物早已迭代 |
| 一次性范围说明 | `RENAME-SCOPE.md` | 《铁流凝变》残留处置的范围与决策记录，已执行完毕 |

## 顶层仍留有的活规格

`spec/` 顶层只保留**仍具约束力、或被其它规格直接引用**的文件：

| 文件 | 为什么留着 |
|---|---|
| `PROJECT-BRIEF.md` | 项目总纲：定位、评分权重、四层体验、范围边界 |
| `ENTRANCE-FURNACE-SPEC.md` | **`#/entrance` 序厅的唯一依据**（2026-09-18 起） |
| `ENTRANCE-HISTORY-SPEC.md` | `#/history` 通史馆仍依据它（其 §1.2–§1.5 序厅部分已作废） |
| `STEP3-INTERACTION-SCORING-SPEC.md` | 交互动与评分规则，`src/js/scoring/` 的实现依据，创新性 40 分的主要落点 |
| `VISUAL-REFINE-SPEC.md` | 视觉细化 W1/W2/W3；**W2、W3 仍未开始**，规格继续有效 |
| `SCENE-LAYOUT-FIX-SPEC.md` | 被 `NOTICE-R5-FIX-CLOSEOUT.md` 直接引用为设计方裁定依据（§10.9.1 / §10.10） |
| `SCENE-ASSETS-STEP2.md` | 铸造馆藏品与空间尺度清单，正式资产迁移时仍需参照 |
| `SCENE-ASSETS-STEP2B-DETAIL.md` | 道具细节判据（「从尺寸对到像」），同上 |
| `NOTICE-R5-FIX-CLOSEOUT.md` | **场景冻结通知**，约束力最强：此后改动须新起 R6 |
