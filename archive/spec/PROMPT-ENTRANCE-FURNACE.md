# 提示词 · 序厅方向 C《炉前》（Step 4C）

> 可直接整段复制给实现方。**唯一依据 = `spec/ENTRANCE-FURNACE-SPEC.md`**（本提示词是它的执行摘要，两者冲突时以规格为准）。
> 作废：`archive/spec/ENTRANCE-VISUAL-REVISION.md` §2–§6、`ENTRANCE-HISTORY-SPEC.md` §1.2–§1.5、《铁流凝变》雕塑方向与 22 × 11.5 m 锚点。

---

## 1. 任务

序厅 `#/entrance` **换方向**：不做雕塑，做**一座炉子**。

> ⚠️ **这句是设计指令（说三维场景做什么），不是页面文案。** 页面文案一字不改地照 `ENTRANCE-FURNACE-SPEC.md §7` 表落。
> 尤其**不许写"序厅不做雕塑""主体不是雕塑"这类否认真实展品的话** ——《铁流凝变》是序厅的**真实馆藏**（青铜浮雕 22 × 11.5 m / 净重 50 吨，我国最大的工业题材青铜雕塑），
> 真实锚点由说明条（`7:28`）承担。详见 `spec/RENAME-SCOPE.md` §3-C。

上一轮（Step 4A）的雕像方向被否决，用户原话：「序厅的建模主题方向这个不太好做，现在一看根本不知道是啥，要么换个方式吧。」

**这次的性质和上三次不同**：不再让你去实现一个"文字描述的曲面形态"。新方向的形态**全部是盒体 / 放样 / 一个开口**，坐标直接给到小数点后一位，判据引用每一个数。你不需要猜任何形状 —— 如果有任何一个数你没法照着建，那是我的规格写错了，请直接提出来，不要自己圆。

**新方向一句话**：46 m 宽 × 18 m 高的**炉壁**占满后墙，中央开 **12.0 × 7.5 m 拱顶炉口**；炉口后面是 **5 m 深的炉膛**，炉床是一汪发光铁水；一条**铁水沟**从炉口斜下穿过展厅地面，在观众脚前汇成**熔池**；炉膛里一盏暖色点光把炉壁烘出一圈辉光；炉口的光在**缓慢呼吸** —— 这就是「炉火不灭」。

**必须理解的三条**（这三条决定了它是"一座炉子"而不是"墙上一个发光矩形"）：

1. **炉口是一个真的洞**，不是贴片 —— 墙用 `Shape` + `holes` + `ExtrudeGeometry` 做出 0.6 m 厚的实体开口，后面接一个 5 m 深的 `BackSide` 凹腔。
2. **铁水沟是纵深的主线索** —— 它从远墙（z ≈ −13.9）一直淌到观众脚前（z = +6.2），把"看一面墙"变成"站在炉前"。
3. **炉壁的辉光由一盏 `PointLight` 产生**，不是顶点色 —— 顶点色在开口圆周上做不出正确衰减，会得到一圈"发光圆环"。

---

## 2. 要交付的东西

| 文件 | 动作 |
|---|---|
| `demo/src/js/scene/entrance-scene.js` | **重写**：删掉整段雕塑，按规格 §2 建新场景；`entranceLayout()` 返回 E1a…E6 + R 组 checks |
| `demo/src/js/pages/entrance.js` | 删 `envMapIntensity = 4.5` 覆写；`views` 换成规格 §5 的六预设 |
| `demo/src/js/pages/history.js`、`venues.js`、`hall.js`、`main.js`、`layout.css` | **不动**（除规格 §7 的点位文案，若文案在 DOM 里） |
| `design/`、`spec/` | 不动（设计侧已定稿：`spec/ENTRANCE-FURNACE-SPEC.md` + `design/S10-序厅炉前基准.png`） |
| `archive/spec/IMPLEMENTATION-STEP4C-REPORT.md` | **新建**交付自述，必须含 **E1″ 三句原话** 与 **E5 四区实测数**（本轮已交付，**已归档至 `archive/spec/`**） |

---

## 3. 逐条要点（照做即可，不要发挥）

### 3.1 房间**不动**
地面 `PlaneGeometry(60,60)` @ `y=0`、后墙位置尺寸 `46×18 @ z=-14`、踢脚线（除断开）—— 全部保留。`minDistance 6 / maxDistance 70 / fov 55` 不动。

### 3.2 炉壁（规格 §2.1）
```js
const S = new THREE.Shape();
S.moveTo(-23, 0); S.lineTo(23, 0); S.lineTo(23, 18); S.lineTo(-23, 18); S.closePath();

const hole = new THREE.Path();
hole.moveTo(-6, 1.2); hole.lineTo(6, 1.2); hole.lineTo(6, 5.4);
hole.absellipse(0, 5.4, 6, 3.3, 0, Math.PI, false);   // 拱顶：由 (6,5.4) 到 (-6,5.4)，冠顶 y = 8.7
hole.closePath();
S.holes.push(hole);

const wall = new THREE.Mesh(
  new THREE.ExtrudeGeometry(S, { depth: 0.6, bevelEnabled: false }),
  new THREE.MeshStandardMaterial({ color: 0x14171C, roughness: 0.9, metalness: 0 }));
wall.position.set(0, 0, -14.6);   // 前表面落在 z = -14.0
```
开口 = 12.0 宽 × 7.5 高（y 1.2…8.7），**拱顶不是矩形**。墙厚 0.6。单 mesh ≈ 300 tri。

### 3.3 炉膛（§2.2）
```js
const cavity = new THREE.Mesh(
  new THREE.BoxGeometry(12, 10.2, 5.0),
  new THREE.MeshStandardMaterial({ color: 0x1A0E08, roughness: .85, metalness: .05, side: THREE.BackSide }));
cavity.position.set(0, 6.3, -17.1);   // z -19.6…-14.6 → 净深 5.0 m
```
**净深 5.0 m 是"不是贴片"的唯一凭据（E1d）。**

### 3.4 炉床（§2.3）
`PlaneGeometry(12,5)` @ `(0,1.35,-17.1)` 色 `0xC2542F`；`PlaneGeometry(8,3.2)` @ `(0,1.36,-16.8)` 色 `0xFFC98A`。都用 `MeshBasicMaterial`。合并 1 mesh。

### 3.5 铁水沟 + 熔池（§2.5）
中心线 7 点：`[0,1.18,-13.9] [0,0.85,-11.8] [0,0.45,-9.0] [0,0.22,-5.5] [0,0.15,-1.0] [0,0.14,3.0] [0,0.14,6.2]`
- 铁水面·主：半宽 0.55，`MeshBasicMaterial({vertexColors:true})`，顶点色 `u=0 → 0xFFD9A8`、`u=0.5 → 0xE8663C`、`u=1 → 0xB8481F`（**离炉口越远越冷** —— 这是"铁水在流"和"一条橙色带子"的分界）
- 铁水面·芯：半宽 0.25，y + 0.05，色 `0xFFD9A8`
- 沟沿·左/右：半宽 0.30，中心 ±0.85，从曲线 y −0.10 到 +0.35，`MeshStandardMaterial({color:0x1F242B, roughness:.75, metalness:.3})`
- 弧长采样 24 点（`getPointAt`，**不要用 getPoint**）
- 熔池：盆沿 `CircleGeometry(3.0,24)` + 液面 `CircleGeometry(2.6,24)`，均 `scale(1,0.62,1)`、`rotation.x=-π/2`，y 分别 0.04 / 0.10；液面用 `vertexColors`，**中心 0xFFD9A8、边缘 0xB8481F**
- ⚠ 铁水面不得高于沟沿顶（E1e）。带状放样可搬 `loftFinger()` 的环点索引，但删掉 `upAt()` 滚转（水平带不需要）。

### 3.6 护炉钢构（§2.6）
合并 1 mesh，材质 `0x39414B / roughness .7 / metalness .5`：
立柱 `BoxGeometry(0.8,18,0.8)` @ `(±9.5, 9, -11.5)` / `(±17, 9, -11.5)`；
横梁 `BoxGeometry(46,0.9,0.9)` @ `(0, 13.5, -11.5)` / `(0, 17, -11.5)`；
斜撑 4 根 `BoxGeometry(0.5,3.2,0.5)` 绕 z ±40°；
检修门 4 片 `BoxGeometry(1.8,2.4,0.15)` @ `(±11.5, 6, -13.85)` / `(±15.5, 6, -13.85)`；
烟道 2 根 `CylinderGeometry(0.5,0.5,18,12)` @ `(±21, 9, -13.4)`。
⚠ **立柱必须 |x| ≥ 6.6，不得遮炉口（E2b）**。

### 3.7 踢脚线断开（§2.7）
拆成左右两段 `PlaneGeometry(16.4, 1.2)` @ `(∓14.8, 0.6, -13.95)`，开口区 `x ∈ [-6.6, 6.6]` 留空。

### 3.8 飘火（§2.8）
180 个 `THREE.Points`，出生盒 `x ±7 / y 1.2…10 / z -13.6…+3`；
`PointsMaterial({ size: 0.14, sizeAttenuation: true, color: 0xFFB86B, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })`；
**禁 `Math.random`** → `const rnd = (i) => { const s = Math.sin(i*12.9898)*43758.5453; return s - Math.floor(s); };`
上升 `y = 1.2 + ((y0 + s_i·t) mod 9.8)`，横摆 `0.25·sin(t·0.6+p_i)` / `0.15·sin(t·0.45+q_i)`。**不加贴图**（2–3 px 的方点在此尺度即读作火星）。

### 3.9 光（§3）—— 六盏，一盏新增
`PointLight(0xFF8A3C, 6.0, 30, 1.2)` @ `(0, 3.0, -16.5)` ← **新增，本次最关键**
`HemisphereLight(0x2A3A4A, 0x14181D, 0.55)` 保留
`SpotLight(0xFFF1E2, 4.5→3.0, 52, 0.52, 0.55, 1.3)` @ `(4,16,10)`→`(0,5.4,0)` castShadow
`SpotLight(0x8FB4D8, 3.0→1.8, 44, 0.5, 0.7, 1.2)` @ `(-6,12,-9)`→`(0,6,0)`
`SpotLight(0xFFE9D6, 1.6→1.2, 30, 0.85, 1.0, 1.1)` @ `(0,14,0)`→`(0,0,0)`
`DirectionalLight(0xFFFFFF, 0.45→0.18)` @ `(10,1.5,9)`
⚠ 不许加 `AmbientLight`。炉壁辉光**必须**由那盏 `PointLight` 产生；兜底只许追加同色同类型第二盏（`4.0` @ `(0,6.5,-15.0)`）。

### 3.10 动（§4）—— 本场景第一次有动画
`update(t)`：`k = 1 + 0.06*sin(t*0.9)`（周期 ≈ 7 s）→ 点光强度 `6.0*k`、炉床色 `copy(C_HEARTH).multiplyScalar(k)`、粒子 `opacity 0.85*(1+0.08*sin(t*0.9+0.6))` + 逐粒子位置。
**除这三项外不得有第四处动画**（不加雾、不摇镜头、不后处理）。

### 3.11 机位（§5）
`default [0,3.2,23]→[0,5.6,0]`（**逐字不动**）｜`furnace [0,2.6,0]→[0,5.2,-14]` r14.24｜`runner [3.2,1.5,7.0]→[0,0.9,-6.0]` r13.40｜`pool [0,4.5,12.5]→[0,0.15,5.0]` r8.67｜`steel [-11,6.5,9]→[0,8,-11]` r22.87｜`wide [-14,8,26]→[0,5,-6]` r35.13。
**删除 `sculpture` / `splash`**。半径 ≥ 6.05 且**必须在 `setView()` 之后取**。

---

## 4. 判据（规格 §6 全表，逐条给实测值）

**主判据 = E1″ 盲测**：`default` 机位截图给 **3 位不知道本方案的人**看，只问"这是什么地方 / 这是什么？"
- 通过词集：炉子、高炉、炼铁炉、熔炉、钢厂、铁水、炉火、炉膛、倒铁水、铸钢车间
- 不通过：走廊、隧道、房间、屏幕、投影、门、车库、没见过、看不懂
- **≥ 2 / 3 落在通过词集 → 通过；必须记录 3 句原话。不得自评代替。上一轮跳过一次，本轮不接受再跳。**

数值兜底：E1a 12.0±0.1｜E1b 7.5±0.1｜E1c 1.20±0.05｜**E1d 炉膛净深 5.0±0.1**｜E1e 铁水面 < 沟沿顶｜E1f y 单调不增、折角 ≤ 35°｜E2a 贴地 ±0.01｜E2b 立柱 |x| ≥ 6.6｜E2c 无穿模｜E3 六预设半径 ≥ 6.05｜E4a ≤ 14 draw call｜E4b ≤ 4000 tri（估算 ≈ 800）｜E4c 贴图 0 增量｜E4d 光源 = 6（或 7）｜**E5 亮度分层：① 炉膛内芯 ≥ 200/255、② 炉口唇口 ≥ 140、③ 炉壁受光区 60…140、④ 墙角 ≤ 60，且 ①−④ ≥ 140**｜E6 动画周期 6…8 s。
不回归：H1–H4 通史馆｜**R1 铸造馆 layout 61/61**｜**R2 cast_selftest 45/45**｜R3 `mountViewport()` 默认参数逐字不变｜R4 `sandboxes.js`/`hall.js` 几何零改动｜R5 首页无回归｜R6 JS gzip ≤ 190 KB｜R7 四机位 CONSOLE CLEAN。

**E5 采样口径**：在 `furnace` 机位的**渲染帧**上取 4 区各 5 点（5×5 均值）—— ① 开口内（x −3…3、y 3…6）② 开口外 0.5 m 墙面（y 2…3）③ 墙面中距（x ±15、y 12…14）④ 墙角（x ±22、y 1…3）与远端钢构柱。**不得读材质常量代替渲染帧。**

---

## 5. 硬约束

1. `Scene.environmentIntensity` **不许写**（r163+ API，本工程锁 `^0.160`）。
2. 后处理**零新增**；所有"发光"只靠 `MeshBasicMaterial` 亮度 + `PointLight` 溢出 + 加法混合粒子。
3. 贴图**零增量**（含程序化 canvas sprite），全站仍 5 张。
4. **禁 `Math.random`**（粒子/抖动一律 `sin` 哈希，确定性可复现）。
5. 光源 6 盏（+1 兜底），**不许加 `AmbientLight`**。
6. 房间尺寸、`mountViewport()` 默认参数、`sandboxes.js`、`hall.js` 几何：**零改动**。
7. 一切验收数值必须在**运行态**取（`setView()` 之后 / 渲染帧上），不得坐标直算、不得读常量。
8. 每条 check 的 `threshold` 必须能回答"依据是什么"（判据自指禁令），禁止"实测值 ±N"式自指阈值。

---

## 6. 环境坑（前几轮踩过的，直接照做）

1. WorkBuddy 的 Bash 是裁剪版 PortableGit：没有 `ls` / `tail` / `dirname`，命令前加 `cd "D:/agent projects/project" && `，路径用绝对路径。
2. PowerShell 下 `npm.ps1` 会被重定向搞坏 → 用 `node node_modules\vite\bin\vite.js build`。
3. `vite preview` 会静默死掉（约 1 天后）→ 截图前先探活。
4. Edge `--screenshot` 会静默失败 → 只能用 CDP。
5. `?debug=1` 必须写在 `#` **之前**。
6. 写文件时全角弯引号 U+201C/201D 可能被降级成 ASCII 双引号（逐字校验栽过）—— 要逐字的东西别用弯引号。
7. 构建管道无 `tail` 时会把失败吞成假成功 —— 复测旧 dist 过。构建后必须回读产物再判断。

---

## 7. 不要做的事

1. 不要重做房间（地面 / 后墙位置尺寸 / 踢脚线除断开）。
2. **不要保留《铁流凝变》雕塑的任何残留**（**指三维几何代码，与文案无关** —— 别把这条理解成"把《铁流凝变》这个名字从页面里抹掉"）—— `BAND_PTS` / `W_KEYS` / `H_KEYS` / `loftBand()` / `loftFinger()` / `CROWN_*` / `DROPLETS` / `FINGER_*` / `buildCrownGeometries()` / `buildDropletGeometries()` / `makeProfile()` / `profileAt()` / `upAt()` 整段删（约 250 行）。只允许复用 §2.5 带状放样的环点索引写法。
3. 不要用顶点色假装炉壁辉光（会得到一圈发光圆环）。
4. 不要为了"更好看"改规格 §2 的任何坐标 —— 每个数都有判据引用，要改先改规格。
5. 不要在炉口加矩形门框 / 百叶 / 栅格 —— 拱顶开口本身就是主角，加装饰会把"炉子"读成"车库"。
6. 不要做火焰形状的几何体：**这里的火是光，不是模型**（发光洞口 + 炉床 + 点光溢出 = 炉火，足矣；加了火焰片反而会糊）。
7. 不要动通史馆 / 铸造馆 / 首页 / 药丸行为。
8. 不要跳过 E1″ 盲测；不要把"数值全绿"当成通过。
9. 不要把"不做雕塑"这类**设计指令**写进页面文案，也不要写任何否认《铁流凝变》真实存在的话 —— 它是序厅的**真实馆藏**，页面文案一律照规格 §7 表（真实锚点在说明条 `7:28`）。
