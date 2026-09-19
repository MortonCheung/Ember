# journey/ —— 《辽迹》连续数字博物馆引擎

路由：`#/journey`。这不是三个网页展馆，是**一台参观引擎**：
用户沿一条已策展的路线从入口走到出口，全程发生在同一个 Scene、同一个 Canvas 里。

## 五条硬规则

改动本层前先确认没有违反这五条。

1. **一座连续存在的 Museum World。**
   入口 / 序厅 / 沈阳 / 过渡 / 鞍山 / 下沉 / 抚顺 / 终章 / 出口同属一个 Scene。
   前后空间关系、灯光情绪、Hero 的相对位置都不能"重置"。

2. **Scroll 是输入，不是页面切换器。**
   原生滚动 -> `JourneyController`（ScrollTrigger 只读 `rawProgress`）-> 阻尼得
   `visualProgress` -> `JourneyMap` 映射到 `pathT` -> `CameraRig` 求位姿。
   **不要用几十段 GSAP Camera Tween 拼整条路线。**

3. **滚动距离与空间距离分离。**
   `JourneyMap` 用分段表把 Journey 进度映射到 Path 进度，让展区附近自然"走慢"。
   用户滚 10% 不等于相机走 10%。

4. **相机单一所有权。**
   Journey 模式只有 `CameraRig` 写相机；Explore 模式只有 `OrbitControls` 写相机；
   过渡动画由 `CameraRig` 暂时接管，完成后交出。绝不允许两方同时写。

5. **一切互动必须可跳过。**
   Notice 是邀请不是关卡：不点击就直接走过去，不弹窗、不劫持滚动、不阻塞路线。
   Explore 是同世界内的临时状态（`journey → entering-explore → explore → returning → journey`），
   **不跳页、不开第二个 Canvas**。退出后 `progress` 误差 ≤ 0.001、`scrollY` 误差 ≤ 2px。

## 三个 Hero 的 Notice 是故意不同的

让三座城市拥有各自的"可触碰语言"，而不是同一套提示复读三遍：

| 展品 | Notice | 表达 |
|---|---|---|
| 沈阳 · 机床 | `explode-peek` | 主轴箱 / 刀架 / 尾座各自微动 8–15cm 再合回，像机械结构"松了一下" |
| 鞍山 · 高炉 | `glow` | 炉口与内部 PointLight 一次暖光呼吸，巨型设备"自己醒了一下" |
| 抚顺 · 矿业 | `scan` | 半透明扫描面自下而上掠过，短暂描出整体结构 |

## 竖屏取景

竖屏（390×844）的水平视场只有横屏的三成左右，Hero 会被边缘裁掉。
处理方式写在 `CameraRig.getJourneyPose()`：**只沿水平方向**按 Hero 聚焦权重后退
（逐展品 `portraitDolly`，见 `data/journey-data.js`），竖屏 FOV 只从 52 提到 64。

> 注意：后退方向必须把 Y 分量清零。注视点通常高于视点（高炉 anchor 在 y=5），
> 照原方向后退会把 1.65m 的视点高度一起拉下去。

## Debug API

访问 `?debug=1#/journey` 暴露 `window.__liaoji`：

| 方法 | 用途 |
|---|---|
| `state()` | mode / rawProgress / visualProgress / pathT / chapter / discoverableExhibitId / exploringExhibitId / savedProgress / savedScrollY |
| `info()` | draw calls / triangles / geometries / textures |
| `camera()` | position / target / fov |
| `setProgress(v)` | 精确定位到路线某点（仅 journey 模式） |
| `enterExhibit(id)` / `exitExplore()` | 进入 / 退出 Explore |
| `showPath(bool)` / `showZones(bool)` | 显示相机曲线与控制点 / 激活区间与 Explore Pose |
| `heroFrame(id)` | 把展品**真实网格顶点**投影到屏幕，返回包围框、覆盖率与是否完整入镜 |

`heroFrame` 是"把主观视觉验收变成可复现读数"的落点：验收脚本据此在三个视口 ×
三个 Hero 上断言主体完整入镜。**不要退回用 `Box3` 的八个角**——圆柱与长臂的
轴对齐包围盒远大于可见轮廓，会一直误报裁切。

## 自动验收

```bash
# 在 demo/ 先 build + preview
python3 tools/verify_journey.py http://127.0.0.1:4173 --screenshots
```

覆盖：单 Canvas / 无横向滚动 / 八个进度点的相机连续性与章节 / 三个 Hero 的
进入退出闭环与原位返回精度 / 三视口取景 / 旧五路由冒烟 / 渲染预算 / console 零错误。
当前 170 项断言全部通过。
