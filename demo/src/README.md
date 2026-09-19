# demo/src —— 分层与依赖规则

《辽迹》在同一个 `src/` 下并存两套三维范式。这里说明**每层是什么、谁能依赖谁**，
以免将来迁移正式资产时又把两套东西搅在一起。

```
src/
  main.js          入口：路由表 + mount/dispose 生命周期（六个路由按需动态加载）
  router.js        极简 hash 路由，只在 hash 变化时回调

  core/            与具体世界无关的共用层
    fallback.js      能力检测（WebGL2 / WebGL1 / 不支持）、降级页、加载态

  data/            设计决策落点的纯声明：不含 three，不碰 DOM
    journey-data.js  策展路线：相机控制点 / 路线分段 / 章节 / 展品 / 灯光停点
    casting-data.js  浇铸评分：铸件窗口 / 12 砂箱表 / 扣分规则 / 权重 / 等级

  ui/              跨页共用的 DOM 构件
    venues.js        五个场馆药丸的清单、HTML 与点击处理

  journey/         《辽迹》连续博物馆引擎（新范式 · 主线）
    page.js          路由壳：只建 DOM 与生命周期，三维全部交给 Experience
    Experience.js    单 renderer / scene / camera / RAF 总控制器
    JourneyController.js  原生滚动 -> ScrollTrigger -> rawProgress -> 阻尼
    JourneyMap.js          Journey 进度 -> Camera Path 进度（滚动距离与空间距离分离）
    CameraRig.js          相机位置与注视目标的唯一写入者
    InteractionManager.js activation range / Notice / 当前展品 Raycast
    ScrollLock.js          Explore 期间锁住页面并可精确恢复
    PointerIntent.js       区分轻点与拖动/触摸滚动
    ui/               JourneyOverlay（开篇与章节字幕）、ExhibitMarker（空间标记）
    world/            buildWhiteboxMuseum / buildProxyExhibits / WhiteboxLighting
    debug/            ?debug=1 下的 __liaoji

  legacy/          页面驱动旧范式（已冻结，见 legacy/README.md）
    pages/           home / hall / cast / entrance / history
    engine/          viewport.js —— 旧页共享的三维容器
    worlds/          workshop / entrance-scene / cast-scene / environment / textures / merge
    props/           六件道具：crane / cupola / ladle / lathe / sandboxes / toolcart
    scoring/         casting.js —— 亲手浇铸评分引擎（纯函数，与 data/casting-data.js 成对）
```

## 依赖规则

1. **`core/` 不依赖任何其它层。** 它是唯一被两套范式共同使用的模块
   （`legacy/engine/viewport.js` 与 `journey/Experience.js` 都引用它）。
2. **`data/` 是纯声明。** 不许 import three，不许碰 DOM。它只放"设计侧会改的东西"。
3. **`journey/` 可以依赖 `core/` 与 `data/`，不许反向依赖 `legacy/`。**
4. **`legacy/` 可以依赖 `core/`、`data/`、`ui/`，不许依赖 `journey/`。**
   它是冻结的，只能被替换，不能被扩建。
5. **`ui/` 放真正跨页共用的 DOM 构件。** Journey 自己的 DOM 构件留在
   `journey/ui/`，不要往上提——那会暗示它与旧页共用。

## 为什么 `casting-data.js` 和 `casting.js` 分居两层

数据在 `data/`、引擎在 `legacy/scoring/`，看着像拆开了一对紧耦合的东西。
这是有意的：`data/` 是**设计侧改数值的地方**，`casting.js` 是**实现侧改逻辑的地方**，
两者由 `spec/STEP3-INTERACTION-SCORING-SPEC.md` 分别约束。真要迁到 journey 时，
`legacy/scoring/casting.js` 整包搬走即可，数据不用动。
