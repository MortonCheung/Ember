# journey/ —— 《辽迹》Final Cinematic Whitebox 引擎

路由：`#/journey`。**这是一部由用户亲手推进的辽宁工业互动电影**，
不是三个网页展馆，也不是一条自动巡航的参观路线。
Scroll to Direct：用户滚动 = 推进整部电影的 Playhead。

## 五条硬规则

改动本层前先确认没有违反这五条。

1. **先设计镜头，再让物体自然进入镜头。**
   每一个 Shot 在 `storyboard.js` 里自带 Position / Target / FOV 三条独立路径。
   `CinematicDirector` 只负责把 scrollY 翻译成「现在是哪个 Shot、走到几分几秒」。
   **禁止恢复任何形式的 Hero 自动 LookAt / activation range 抢镜头。**

2. **Scroll 是输入，不是页面切换器。**
   原生滚动 → `JourneyController`（ScrollTrigger 只读 rawProgress）→ 阻尼得 visualProgress
   → `CinematicDirector` 查分镜表 → CameraRig / World / Text / Light 各自执行。
   节奏由 Shot 的 `weight` 分配滚动距离，不平均分。

3. **一切状态都是 progress 的纯函数。**
   世界运动（scroll-linked）不依赖时间累积的时间轴，反向滚动天然成立。
   需要时间驱动的小循环（车轮、粒子、吊钩摆动）只用 `ctx.time/dt` 做局部叠加，
   不允许主导镜头节奏。
   三条从反向走查里换来的硬要求：
   - ⚠️ **不要写「只在某个镜头/区间内才更新」的状态。** 区间外必须回到一个确定的默认值，
     否则反向滚动与 `setShot` 跳转读到的是「上一次路过时的残留」。
     已按此修：钢坯 / 钢板 / 列车 / 卡车 / 天吊 / 工人主光（全部改为 `xxxAt(progress)`）。
   - ⚠️ **状态只存进度驱动的主值，持续抖动只叠加在渲染上。**
     `crane.position.z = state.craneZ + sin(time*0.35)*1.4`，而不是把抖动写进 `state.craneZ`。
   - ⚠️ 定位式调用（Debug `setShot` / Explore 返回）`dt = 0`：
     `damp` 在 dt=0 时是恒等映射，Set 里的 damp 一律要用「dt=0 直达目标」的包装（各 Set 顶部已内置）。

4. **相机单一所有权。**
   cinematic → `CinematicDirector.applyCamera`；explore → `OrbitControls`；
   过渡由 `CameraRig.animateToPose` 暂时接管，完成后交出。
   硬切（`cut: true`）不参与平滑，跨切必须瞬间到位。

5. **一切互动必须可跳过。**
   Notice 是邀请不是关卡（`shot.notice` 区间之外提示自动消失）。
   Explore 是同世界内的临时状态（`journey → entering-explore → explore → returning → journey`），
   不跳页、不开第二个 Canvas；返回后位置误差 < 0.6m（自动验收有断言）。

## 文件地图

    storyboard.js            分镜数据层：48 个 Shot（镜头/文字/交互/权重/声音 Cue）
    CinematicDirector.js     主 Playhead：progress → shot + localT + env + caption
    CameraRig.js             双路径相机执行器（无任何叙事判断）
    JourneyController.js     原生滚动 → ScrollTrigger → 平滑 progress
    Experience.js            装配与状态机（cinematic / entering-explore / explore / returning）
    InteractionManager.js    Notice、Raycast、Explore 入口（判定来自分镜的 interactive 字段）
    world/
      buildCinematicWorld.js 总装：六个章节 Set + 可见性裁剪 + frame 分发
      CinematicLighting.js   章节氛围 / 曝光 / 雾（黑场 = 雾收到 0.8m，不用挡板）
      primitives.js          WorldBuilder 工厂 + Worker_Base（一具人体，五种 Pose）
      textPlates.js          A 类空间文字 / 铭牌 / C 类标注标签
      sets/                  六个章节 Set：建模 + 该章节的 scroll-linked motion
        buildOpeningSet.js   开场蒙太奇（黑场靠雾，极近景靠局部复用灯）
        buildShenyangSet.js  厂房 + C620-1（可拆解）+ 工作台 + 天吊
        buildRailSet.js      铁路 + 货运列车（相机从后方追上车尾矿石厢）
        buildAnshanSet.js    高炉（炉内可进入）+ 出铁 + 工业蒙太奇
        buildRoadSet.js      公路 + 1950s 卡车（钢板变车的落点）
        buildFushunSet.js    阶梯矿坑（lathe）+ 电铲 + FS-HERO-WORKER
    ui/
      JourneyOverlay.js      B 类 Cinematic Caption + 章节题头 + 标题
      ExploreConsole.js      C620-1 四步控制台 / 工作台生活互动
      ExhibitMarker.js       世界锚点投影的「● 触碰」标记
    debug/journeyDebug.js    导演台：setShot / listShots / shotContinuity / showPaths / pickCenter

## 验收

    python3 tools/verify_journey.py http://127.0.0.1:5173 [--screenshots]   # 27 项：分镜/衔接/取景/性能/旧路由
    python3 tools/walkthrough_cinematic.py http://127.0.0.1:5173           # 25 项：人工三遍的可复现版

`walkthrough_cinematic.py` 覆盖手册 §70 要求的人工三遍：
- **Pass A** 真实滚动走查（`window.scrollTo`，不是跳转）：镜头链条单调、无凭空瞬移、七章节全覆盖
- **Pass B** 全交互端到端：C620-1 四步（拆解 → 结构 → 组装启动 → 手轮进给 → 历史）+ 工作台（图纸 / 卡尺）
- **Pass C** 反向滚动：正反向能回到同一进度，且同一进度上镜头 / 相机 / scroll-linked 状态一致

⚠️ **无头环境的两个已知限制**（真实浏览器不受影响，验收脚本已兜底）：
1. 页面跑一会儿会被当作后台标签节流，rAF 与 gsap ticker 停摆 → `ScrollTrigger` 的 progress 冻结。
   脚本用 `__liaoji.tick()` 补帧。
2. `ScrollTrigger` 在节流下会用它缓存的旧滚动位置**把 progress 写回**。
   脚本用 `__liaoji.syncProgress()`（产品自己的 syncFromScroll 路径）从真实 `scrollY` 取值。

设计意图与逐镜说明：`spec/LIAOJI-CINEMATIC-STORYBOARD.md`。
资产台账：`spec/LIAOJI-ASSET-MANIFEST.md`。
