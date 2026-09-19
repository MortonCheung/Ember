# src —— 目录职责与依赖方向

按**职责**划分，不按"新 / 旧"划分。原型时期的代码不是待删除的历史，
而是已经验证过的资产来源，因此它们被放进了按其真实身份命名的目录。

```
src/
  app/                 应用怎么启动、怎么路由
    main.js              路由表 + mount/dispose 生命周期（六个路由按需动态加载）
    router.js            极简 hash 路由，只在 hash 变化时回调

  pages/               路由页面入口，只负责组装页面
    home.js  entrance.js  history.js  hall.js  cast.js  journey.js

  museum/              博物馆这个三维世界本身
    viewport.js          Three.js runtime：renderer 生命周期 / resize / 资源回收 / 三级降级
    scenes/              已实现的工业空间
      workshop.js          铸造馆车间
      entrance-scene.js    序厅《炉前》
      cast-scene.js        浇铸小场景
      environment.js       高窗 / 吊灯 / 粉尘 / 警示线
      textures.js          程序化贴图
      merge.js             几何合并工具
    exhibits/            正式工业展品资产
      lathe.js  cupola.js  crane.js  ladle.js  sandboxes.js  toolcart.js
    journey/             连续参观路线、镜头与 Explore 主线（《辽迹》的产品骨架）
      Experience.js  JourneyController.js  JourneyMap.js  CameraRig.js
      InteractionManager.js  PointerIntent.js  ScrollLock.js
      data.js              策展路线：相机控制点 / 分段 / 章节 / 展品 / 灯光停点
      world/               白盒博物馆与三个 Proxy 展品、章节灯光
      ui/                  开篇与章节字幕、空间标记
      debug/               ?debug=1 下的 __liaoji

  features/            用户可以真正参与的独立功能
    casting/
      scoring.js           亲手浇铸评分引擎（纯函数：零随机、可复现、可解释）
      data.js              铸件窗口 / 12 砂箱表 / 12 条扣分规则 / 权重 / 等级

  shared/              确实被多个领域共同使用的东西
    fallback.js          WebGL 能力检测 / 降级页 / 加载态
    ui/venues.js         五个场馆药丸的清单、HTML 与点击处理

  styles/
    tokens.css  base.css  layout.css  journey.css
    pages/               按页面拆分的样式
```

## 依赖方向

```
pages/  ──>  museum/  ──>  shared/
   │            │
   └────────>  features/
```

1. **`shared/` 不依赖任何其它层。** 它是唯一被两套三维范式共同使用的模块
   （`museum/viewport.js` 与 `museum/journey/Experience.js` 都引用它）。
2. **`museum/` 不依赖 `pages/`。** 世界不知道谁在用它。
3. **`features/` 是自足的领域逻辑**，不依赖 `museum/`；`pages/cast.js` 把两者组装起来。
4. **`pages/` 只做组装**，不放实现细节。
5. **不加没有真实需求的层。** 没有 manager / service / repository / registry / adapter。
   一个文件的职责已经清楚，就不为它再包一层目录。

## 关于 `museum/viewport.js`

它是原型时期就写好的 Three.js runtime，现在被 `pages/hall.js`、`pages/cast.js`、
`pages/entrance.js` 共同使用。**内部实现一行未改** ——
`spec/NOTICE-R5-FIX-CLOSEOUT.md` 规定场景实现冻结，任何改动须新起 R6。

它属于 `museum/` 而不是 `shared/`：Journey 不走它，它服务的是 museum 的页面驱动范式。
将来 Journey 完全接管后，它里面真正通用的部分（renderer 生命周期、资源回收）
再上移到 `shared/`。

## 为什么 `data.js` 跟着各自的领域走

没有全局的 `data/` 目录。`museum/journey/data.js` 是策展路线，
`features/casting/data.js` 是评分规则 —— 它们各自只被自己的领域使用，
放回领域内部比集中到一个通用桶更容易找。
