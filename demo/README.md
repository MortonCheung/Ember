# 中国工业博物馆数字展馆 · Step 1 空壳

「炉火不灭」—— 中国工业博物馆（沈阳）Web 数字展馆的 Step 1 基础骨架：
两条路由、可拖拽旋转的车间空盒场景、WebGL 三级降级、加载态与响应式布局。

## 启动

**方式一（Windows）**：双击 `启动预览.bat`。

**方式二（手动）**：

```bash
cd demo
npm install
npm run dev        # 开发模式  http://localhost:5173/
npm run build      # 产物输出到 dist/
npm run preview    # 预览构建产物  http://localhost:4173/
```

## 路由

| 路由 | 页面 |
|---|---|
| `/` | 首页（设计稿 S01：Hero + 滚动飞越占位画布） |
| `#/hall` | 虚拟展厅（设计稿 S02：全屏 3D 空车间，HUD + 横向场馆导航） |

## 操作

展厅页：鼠标左键拖拽旋转 · 滚轮缩放（OrbitControls，已关平移）。
首次交互后操作提示自动淡出。

## 技术栈

Vite 5 + 原生 JS（ES Module）+ three.js ^0.160 + 原生 CSS（Token 化设计变量）。
无框架、无 UI 库。字体：**霞鹜文楷 LXGW WenKai（自托管子集，SIL OFL 1.1，Regular/Bold 双字重）**。

## 降级策略

1. WebGL2 可用 → 完整渲染（阴影 + 雾）
2. 仅 WebGL1 → 关阴影、关雾
3. 完全不支持 → 友好降级页（含「浏览图文版展厅」占位入口）

three.js 初始化超过 8 秒未完成同样进入降级页。

## 目录

```
src/
├── styles/          tokens.css（设计 Token，勿改）/ base.css / layout.css
└── js/
    ├── main.js      入口与页面生命周期
    ├── router.js    hash 路由
    ├── pages/       home.js / hall.js
    └── scene/
        ├── viewport.js     初始化 / 渲染循环 / resize / 调试钩子
        ├── workshop.js     车间组装（墙体屋架立柱 + 各展品模块 + 灯光）
        ├── fallback.js     WebGL 检测 / 降级页 / 加载态
        ├── merge.js        几何合并工具
        ├── textures.js     程序化贴图（地面油渍 roughnessMap / 黄黑警示纹）
        ├── environment.js  环境细节（高窗 / 吊灯 / 粉尘 / 警示线 / 管道）
        └── props/
            ├── crane.js       十吨天吊（40s 周期 ±8m 横移）
            ├── sandboxes.js   砂箱阵列（InstancedMesh，12 箱 = 3 draw call）
            ├── cupola.js      十吨冲天炉（含流槽 / 护栏 / 爬梯）
            └── lathe.js       C620-1 普通车床
```

## 验收自测（A1–A8）

实现方自测脚本位于项目根 `.workbuddy/`（CDP 驱动 Edge，纯标准库）：

```bash
# 控制台干净性（A1）
python .workbuddy/verify_cdp.py console "http://localhost:5173/" 8000
# 截图（A2/A7/A8），--no-webgl 验证降级页
python .workbuddy/verify_cdp.py shot "http://localhost:4173/#/hall" hall 9000 1440 900
python .workbuddy/verify_cdp.py shot "http://localhost:4173/#/hall" no-webgl 8000 1440 900 --no-webgl
# 帧率（A5）；--headed 走真实 GPU
python .workbuddy/verify_cdp.py fps "http://localhost:4173/#/hall" 5000 5000
```

Step 1 实测（2026-09-15，本机 Edge 153）：
控制台零报错；空闲态 240 FPS（远超 ≥55 预算）；load 93ms（远低于 ≤2.5s）；
首包 JS 125KB gzip（预算 ≤400KB）；禁用 WebGL 正常出降级页；375px 无横向滚动。

> ⚠️ 本机 Edge 的 `--headless --screenshot` 静默失败，截图必须走 CDP；
> AI shell 无 `tail`/`sleep` 等命令，脚本与命令均未使用管道。

## Step 2 场景与验证钩子

场景按 `spec/SCENE-ASSETS-STEP2.md` 实现，交付顺序：天吊 → 砂箱阵列 → 冲天炉细化 →
环境细节 → C620-1。拾取预留：射线命中砂箱 InstancedMesh 后，用
`instanceId` 查 `mesh.userData.sandboxNames[instanceId]`（`sandbox_0` … `sandbox_11`）。

**调试钩子**：URL 带 `?debug=1`（如 `http://localhost:4173/?debug=1#/hall`）时暴露
`window.__hall`，含相机预设与性能读数，供验收截图复现：

```js
__hall.views                       // ['default','crane','sandbox','cupola','lathe','env']
__hall.setView('crane')            // 切到天吊机位
__hall.info()                      // { calls, triangles, textures, geometries }
```

正式访问路径（不带参数）不受该钩子影响。

**实测（2026-09-15，Edge 153）**：draw call 峰值 31（预算 ≤120）、三角面 ~3000（预算 ≤300k）、
贴图 4 张（512² 程序化 ×2 + 环境贴图，预算 ≤64MB）、JS 首包 130.5KB gzip；
有头真机（240Hz 屏、锁垂直同步）空闲 240 FPS。

环境贴图按规格 §4.1 实现（`RoomEnvironment` + PMREM）。注：three 0.160 尚无
`Scene.environmentIntensity`（r163 引入），等价做法是逐材质 `envMapIntensity = 0.25`，
升级 three 后可改回 `scene.environmentIntensity`。

**待办（Step 3 一并处理，来自 STEP2-ACCEPTANCE-REVIEW §三）**
- P4：动态光源 11 盏，低配机有风险 → 若帧率不足优先削 6 盏吊灯（强度 0.4，视觉贡献最小）
- P5：地面橙色导向线（x=±8.8）与砂箱区（x 5.2–11.8）重叠 → 导向线绕行或阵列微调
- P6：默认机位下砂箱阵列偏画面右下、贴近 (13,6) 立柱 → Step 3 浇铸另设机位时一并考虑
  （✅ Step 3 已为 `#/cast` 另设机位 [3, 5, 13.2]，阵列居中；P4/P5 仍开放）

## Step 3 · 亲手浇铸（#/cast）

互动体验第一条支线（画稿 S03），规格见 `spec/STEP3-INTERACTION-SCORING-SPEC.md`：
五步状态机（①取样 → ②调温 → ③浇注 → ④开箱 → ⑤评分），评分走**纯函数引擎**，
零随机、可复现、可解释（§5 对账表逐位复现画稿数值 72 / 88 / 54 / 76）。

```
src/js/
├── scoring/
│   ├── casting-data.js   纯数据：铸件窗口 / 12 砂箱表 / 12 条扣分规则 / 权重 / 等级
│   └── casting.js        纯函数评分引擎 + selfTest()（44 项断言）
├── pages/cast.js         五步状态机 + 射线拾取 + UI（#/cast）
└── scene/cast-scene.js   浇铸小场景（复用 buildSandboxes + 浇包 + 冲天炉剪影 + 开箱动画）
```

**操作**：视口点选砂箱（选箱即选件）→ 拖温度滑杆 → 调速度/湿度 → 开始浇注
→ 2s 开箱动画（可跳过）→ 评分揭示。砂型一次性（sessionStorage），
总分 ≥75 解锁对应馆藏（localStorage），「调整参数重试」沿用同一砂箱。

**调试钩子**（`?debug=1#/cast`）：

```js
__cast.views                    // ['default','top','close','ladle']
__cast.info()                   // 同 __hall
__cast.selfTest()               // 评分引擎 44 项断言，返回失败列表（[] = 全过）
__cast.state()                  // { step, selected, T, V, H, consumed, unlocked, total }
__cast.setStep(n)               // 截图驱动：1=②调温 2=③浇注 3=④真实浇注 4=⑤直落评分
```

**实测（2026-09-15，Edge 153 无头）**：cast 页 9 draw calls、selfTest 44/44、
控制台零报错；新增 JS 12.8 KB gzip（预算 ≤30KB）；E9 切路由参数清零、消耗保留；
展厅页 32 draw calls / 3878 tris 与 Step 2B 验收一致（viewport 参数化零回归）。


