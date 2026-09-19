# legacy/ —— 页面驱动的旧范式（已冻结）

这里是从前四轮（Step 1–4 + W1）沿下来的页面驱动实现。**它现在是冻结资产**：
`spec/NOTICE-R5-FIX-CLOSEOUT.md` 已裁定场景封版，**此后不得在 `legacy/` 内扩建**。

## 冻结的具体含义

- `engine/viewport.js`、`worlds/*`、`props/*` 的**内部实现一行都不要改**。
- 要改场景，须按 `NOTICE-R5-FIX-CLOSEOUT.md` 的规定**新起 R6 轮次**，并配套新规格。
- 例外只有一种：本次分层收敛这种**纯路径搬迁**（只改 `import` 说明符，不改行为）。

## 这套范式是什么

`pages/*.js` 每个页面自建 DOM、自建三维，通过 `engine/viewport.js` 的
`mountViewport(host, options)` 拿到一个完整的容器层。它的取舍是：

```
切页 -> 卸载上一页（销毁 controls / 全部 geometry + material / renderer /
        PMREM 环境贴图 / canvas）-> 新页冷启动重建整座场景
```

三个场景（`buildWorkshop` / `buildEntranceScene` / `buildCastScene`）
**彼此独立、各自原点、不共享世界坐标**。这正是 `journey/` 要解决的问题——
《辽迹》需要一座连续存在的博物馆，而不是三个各自重建的展厅。

但它留下了三样仍然值钱的东西：

| 资产 | 为什么值钱 |
|---|---|
| `scoring/casting.js` | 纯函数评分引擎，零随机、可复现、可解释，45 项 `selfTest()` 断言全过。**与三维无关，可直接整包搬走。** |
| `props/*` | 六件道具已按 `group / update / dispose` 模式写好，是正式资产迁移的接口样板。 |
| `engine/viewport.js` | 已验证的 renderer 生命周期：devicePixelRatio 限制、SRGB、resize、资源 dispose、三级降级。 |

## 迁移路径（M2 之后）

1. `props/*` 逐件适配为 `journey/world/` 下的子 builder，坐标转换到 Journey 世界。
2. `core/fallback.js` 已经是两套范式共用；`engine/viewport.js` 里真正通用的部分
   （renderer 生命周期、资源回收）随后也上移到 `core/`。
3. 旧页逐个下线，`legacy/` 整体删除。

**在 Owner 走完白盒、确认路线成立之前，不要开始第 1 步。**
