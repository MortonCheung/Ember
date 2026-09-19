# app —— 正式 Web 应用

《辽迹 · 可触碰的辽宁工业记忆》的可运行部分。Vite 工程根就在这里。

## 启动

```bash
cd app
npm install
npm run dev        # 开发模式  http://localhost:5173/
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物  http://localhost:4173/
```

Windows 可直接双击 `启动预览.bat`（自动装依赖 → 构建 → 起预览 → 开浏览器）。

## 路由

| 路由 | 页面 | 形态 |
|---|---|---|
| `#/` | 首页 | 版式页，无 3D |
| `#/journey` | **《辽迹》连续数字博物馆** | 单 Canvas 连续 3D，滚动即前进 |
| `#/entrance` | 序厅《炉前》 | 3D 单件场景 |
| `#/history` | 通史馆 | 2D 长卷（容器内滚动 + 右轨指示） |
| `#/hall` | 铸造馆 | 全屏 3D 车间 + HUD + 场馆导航 + 热点 |
| `#/cast` | 亲手浇铸 | 五步状态机 + 评分面板 |

六个路由都是按需动态加载的（见 `src/app/main.js`）：《辽迹》依赖 GSAP 与整套 Journey
引擎，静态 import 会把它一并塞进主包。

## 技术栈

Vite 5 + 原生 JS（ES Module）+ three.js ^0.160 + GSAP 3.15 + 原生 CSS（Token 化设计变量）。
**无框架、无 UI 库、无 CSS 预处理器**。字体 Noto Sans SC / Inter（Google Fonts）。

## 降级策略

1. WebGL2 可用 → 完整渲染（阴影 + 雾）
2. 仅 WebGL1 → 关阴影、关雾
3. 完全不支持 → 降级页，并保留图文展馆入口

three.js 初始化超过 8 秒未完成同样进入降级页。检测与降级页在 `src/shared/fallback.js`。

## 调试钩子

URL 带 `?debug=1` 才暴露全局，正式访问路径不受影响。

```js
// #/journey
__liaoji.state()                  // mode / rawProgress / visualProgress / pathT / chapter / …
__liaoji.setProgress(0.32)        // 精确定位到路线某点
__liaoji.enterExhibit('lathe')    // 'lathe' | 'furnace' | 'mine'
__liaoji.exitExplore()
__liaoji.heroFrame('lathe')       // 展品屏幕包围框，用来判断有没有被裁
__liaoji.info()                   // { calls, triangles, geometries, textures }

// #/hall
__hall.views                      // ['default','crane','sandbox','cupola','lathe','env']
__hall.setView('crane')

// #/cast
__cast.views                      // ['default','top','close','ladle']
__cast.selfTest()                 // 返回全部断言（每项含 pass 字段），末尾附一条汇总项
__cast.state()                    // { step, selected, T, V, H, consumed, unlocked, total }
__cast.setStep(n)                 // 截图驱动
```

Journey 的设计约束见 `src/museum/journey/README.md`。

## 自动验收

```bash
# 先在 app/ 起好 preview
python3 ../tools/verify_journey.py http://127.0.0.1:4173 --screenshots
```

覆盖：单 Canvas / 无横向滚动 / 路线八个进度点的相机连续性与章节 / 三个展品的
进入退出闭环与原位返回精度 / 三视口取景 / 旧五路由冒烟 / 渲染预算 / console 零错误。

> 脚本用本机 Chrome 走 CDP，纯标准库。**在受限环境里必须带 `--no-sandbox`**，
> 否则 Chrome 自带沙箱起不来、GPU 进程退出会直接掐断 CDP 连接。

## 目录

见 `src/README.md`（含依赖方向规则）。

## 已知限制

- 竖屏（390×844）的 Hero 取景是**按读数**调出来的，不是真机体感，需在真机复核。
- 真机 Safari 未验：`touch-action`、ScrollLock 的 body 固定行为、PointerIntent 的
  轻点阈值都只在 Chromium 合成手势下验过。
- three / GSAP 打进同一个共享 chunk（≈516 kB / gzip 133 kB），首屏无法再小，
  除非把 three 换成按模块引入。
