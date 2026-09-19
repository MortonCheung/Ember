# spec —— 规格与决策记录

这个目录只回答一件事：**写代码时该以哪份文件为准。**

## 当前有效

| 文件 | 约束什么 | 状态 |
|---|---|---|
| `PROJECT-BRIEF.md` | 项目定位、评分权重、四层体验、范围边界 | 有效（§「当前项目定位 / 当前阶段」已于 2026-09-19 更新为《辽迹》） |
| `ENTRANCE-FURNACE-SPEC.md` | `#/entrance` 序厅《炉前》 | **序厅的唯一依据**（2026-09-18 起） |
| `ENTRANCE-HISTORY-SPEC.md` | `#/history` 通史馆长卷 | 通史馆部分有效；其 §1.2–§1.5（序厅三维）已被上一行取代 |
| `STEP3-INTERACTION-SCORING-SPEC.md` | 浇铸五步交互与评分规则 | 有效（`app/src/features/casting/` 的实现依据） |
| `VISUAL-REFINE-SPEC.md` | 视觉细化 W1/W2/W3 | 有效（**W2、W3 仍未开始**） |
| `SCENE-LAYOUT-FIX-SPEC.md` | 展厅布局与尺度 | 有效（被 `NOTICE-R5-FIX-CLOSEOUT.md` 引为裁定依据） |
| `SCENE-ASSETS-STEP2.md` | 铸造馆藏品与空间尺度清单 | 有效（正式资产迁移时仍需参照） |
| `SCENE-ASSETS-STEP2B-DETAIL.md` | 道具细节判据「从尺寸对到像」 | 有效（同上） |
| `NOTICE-R5-FIX-CLOSEOUT.md` | **场景冻结通知** | **约束力最强**：之后改动须新起 R6 |

> ⚠️ `NOTICE-R5-FIX-CLOSEOUT.md` 的冻结指的是**三维场景的实现冻结**。
> 2026-09-19 的目录重构只搬了文件位置、改了 `import` 说明符，没有改动任何场景实现。

## 已归档

`archive/` 里是已经完成使命的过程文档：各轮交接提示词、实现自述、验收评审、
已自述作废的规格，以及「《辽迹》白盒」这一轮的交接报告。

**它们保留是为了留痕，不是施工依据。** 任何以归档文件为准的实现改动都可能与现行规格冲突。
归档依据见 `archive/README.md`。

## 与《辽迹》相关的事实来源

《辽迹》M0–M2 的研究结论与取舍没有单独的规格文件，目前记录在两处：

1. 仓库根目录外的 `HANDOFF-WHITEBOX-RESEARCH-AND-PROGRESS.md`（研究交接报告）
2. `app/src/museum/journey/README.md`（五条硬规则、三个展品的提示方案、验证接口）

如果《辽迹》要继续往下做（正式资产迁移、终章打磨），建议把它的设计规格补成
`spec/LIAOJI-*.md`，与上面那些历史规格并列。
