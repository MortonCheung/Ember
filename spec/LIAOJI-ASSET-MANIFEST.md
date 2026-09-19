# LIAOJI-ASSET-MANIFEST

《辽迹》Final Cinematic Whitebox 资产清单。
**按真实白盒扫描生成（不是脑补）**：每个 Shot 实际出现的资产都列在这里。
Owner 验收锁定后，正式建模只允许「Proxy → 正式模型」的替换，不再改空间与镜头。

资产等级：
- **S**：三个 Hero（C620-1 / 高炉 / 矿坑工人+电铲）。最近观看距离 < 6m，必须拆件、必须动画
- **A**：决定空间身份（厂房、天吊、矿坑地形、列车、卡车）
- **B**：氛围模块，一律程序化 / 实例化，不单独建模型

| ID | 章节 | 资产 | 级 | 来源 | 现有 | 互动 | 拆件 | 动画 | 建模方式 |
|---|---|---|---|---|---|---|---|---|---|
| OP-P01 | 开场 | 工业开关 + 拨杆 + 手套手 | B | whitebox | proxy | no | no | 拨杆/手 | 程序化占位 |
| OP-P02 | 开场 | 高悬工业灯 + 灰尘粒子 | B | whitebox | proxy | no | no | 闪烁 | 程序化 |
| OP-H01 | 开场 | C620 主轴 + 卡盘（极近景专用） | S | existing 深化 | proxy | no | no | 旋转 | 复用 hero_lathe 的主轴组件 |
| OP-P04 | 开场 | 钢缆 + 吊钩 | B | whitebox | proxy | no | no | 绷紧/摆动 | 程序化 |
| OP-H05 | 开场 | 浇包 + 铁水面 + 溢流 | A | existing 深化（ladle.js） | proxy | no | no | 溢出 | 复用现有 ladle 概念 |
| OP-P06 | 开场 | 游标卡尺 + 零件 | B | whitebox | proxy | no | no | 夹紧 | 程序化 |
| OP-P07 | 开场 | 车轮 + 钢轨 | B | whitebox | proxy | no | no | 转动/冲击 | 程序化 |
| SY-A01 | 沈阳 | 厂房外壳（148m 纵深：墙/柱列/桁架/高窗/轨道） | A | whitebox | proxy | no | no | no | 程序化 + 实例化 |
| SY-A02 | 沈阳 | 入口/出口工业滑门 ×2 | A | whitebox | proxy | no | no | 开门 | 程序化 |
| SY-A03 | 沈阳 | 桥式天吊（桥+小车+缆+钩） | A | existing 深化（crane.js） | proxy | no | yes | 横移/摆动 | 程序化占位 → 正式深化 |
| SY-A04 | 沈阳 | 浇包（挂天吊下） | A | existing（ladle.js） | proxy | no | no | 倾斜 | 复用 |
| SY-A05 | 沈阳 | 冲天炉 + 出铁口 | A | existing（cupola.js） | proxy | no | no | 炉口脉动 | 复用 |
| SY-A06 | 沈阳 | 砂箱阵列 / 工具车 | B | existing（sandboxes/toolcart） | proxy | no | no | no | 复用 |
| SY-H01 | 沈阳 | **C620-1 普通车床** | S | existing 深化（lathe.js） | proxy | **yes** | **yes**（床身/主轴箱/刀架·溜板/尾座/主轴/卡盘/手轮/工件/工作灯） | 拆解/启动/进给/车削 | **拆件正式建模** |
| SY-H02 | 沈阳 | 工人工作台道具包（图纸/卡尺/搪瓷杯/暖水瓶/台灯） | A | whitebox | proxy | yes（图纸/卡尺） | no | 展开/抬起 | 小包正式建模 |
| SY-W01 | 沈阳 | Worker_Base ×8（operate/push/bench/carry 四种 Pose） | A | whitebox | proxy | no | no | 手臂微动 | **一个基础人体 + Pose 复用** |
| TR-A01 | 铁路 | 路基/钢轨/枕木/电线杆/信号灯 | B | whitebox | proxy | no | no | no | 程序化 + 实例化 |
| TR-A02 | 铁路 | **货运列车**（机车 + 2 主节货车 + 6 远景实例车厢 + 矿石堆） | A | whitebox | proxy | no | yes（车轮） | 行驶/蒸汽 | 车头正式建模，车厢半程序化 |
| TR-H03 | 铁路 | 主要矿石（Match Cut 主角） | A | whitebox | proxy | no | no | 旋转/放大 | 单体正式建模 |
| AS-H01 | 鞍山 | **高炉 Hero Pack**（body/top/装料钟/围管/风口/平台×3/楼梯/内衬肋×8/内芯/炉缸/出铁口） | S | whitebox | proxy | yes（炉内标注） | yes | 料钟/炉温/出铁 | **按工艺拆件正式建模** |
| AS-A02 | 鞍山 | 上料斜桥 + 料车 | A | whitebox | proxy | no | no | 爬桥/开钟 | 程序化 |
| AS-A03 | 鞍山 | 厂区钢结构/管廊/远景高炉群 ×2 | B | whitebox | proxy | no | no | no | 程序化 |
| AS-A04 | 鞍山 | 蒙太奇道具组（浇包/钢坯/轧辊机组/红热钢板） | A | whitebox | proxy | no | no | 蒙太奇各自运动 | 半程序化 |
| AS-V01 | 鞍山/公路 | **1950s 工业卡车**（车头/车斗/底盘/6 轮/钢板载荷） | A | whitebox | proxy | no | yes（车轮落下） | 行驶 | **正式建模** |
| RD-A01 | 公路 | 道路 + 分段环境（厂房群/铁塔/土堆/山体/矿区门） | B | whitebox | proxy | no | no | no | 程序化 + 实例化 |
| FS-A01 | 抚顺 | **矿坑地形**（19 级阶梯 lathe + 岩层环 + 之字道路 + 坑底） | A | whitebox | proxy | no | no | no | **程序化（Blender 精修可选）** |
| FS-A02 | 抚顺 | 坑壁掠过物组（平台+小屋 / 铁轨+矿车 / 设备 ×4） | B | whitebox | proxy | no | no | no | 程序化 |
| FS-H03 | 抚顺 | **FS-HERO-WORKER**（叉腰·后仰·仰望 Pose） | S | whitebox | proxy | no | yes（头部/躯干） | 抬头 | **单独雕刻正式建模** |
| FS-A04 | 抚顺 | 大型矿用电铲（body/boom/arm/bucket/履带） | S | whitebox | proxy | no | **yes** | 自动循环（抬臂→挖取→回转→卸料） | **拆件正式建模** |
| FS-A05 | 抚顺 | 坑顶设施（建筑/烟囱/铁塔/胶带机） | B | whitebox | proxy | no | no | no | 程序化 |
| EN-A01 | 结尾 | 闪回复用开场机位与道具 | — | 复用 OP | — | no | no | no | 无新增 |
| AMB-01 | 沈阳 | 厂房尘埃粒子 ×240 / 高窗自发光带 ×40 / 柱列 ×28 / 桁架 ×4 组 | B | whitebox | proxy | no | no | 飘浮 / 无 | 程序化 + 实例化 |
| AMB-02 | 鞍山 | 炉体蒸汽 ×130（出铁口 + 炉顶两股） | B | whitebox | proxy | no | no | 上升循环 | 程序化 |
| AMB-03 | 公路 | 路面扬尘 ×110 | B | whitebox | proxy | no | no | 上升 / 漂移 | 程序化 |
| AMB-04 | 抚顺 | 坑内风沙 ×160 | B | whitebox | proxy | no | no | 横向掠过 | 程序化 |
| TXT-A | 全片 | 空间内展陈文字 28 处（墙面标语 / 年份 / 铭牌 / 门楣 / 线路牌 / 里程碑） | B | whitebox | proxy | no | no | no | CanvasTexture |

## 统计与新建计划

- 新建正式模型控制在 **6~8 个核心包**（手册 §55）：
  1. Worker_Base（1 个基础人体，5 种 Pose：operate/push/bench/carry/gaze）
  2. C620-1 拆件包（8 个独立 Mesh，见 SY-H01）
  3. Shenyang Workbench Prop Pack（SY-H02）
  4. Blast Furnace Hero Pack（AS-H01，7 组部件）
  5. Ore Wagon / Freight Car（TR-A02 主节车厢 + 机车）
  6. Industrial Truck（AS-V01）
  7. Electric Shovel（FS-A04，4 拆件）
  8. Hero Ore（TR-H03，单体）
- 矿坑地形 / 铁轨 / 钢梁 / 管线 / 栏杆 / 枕木：**继续程序化**，不进混元 3D。
- 每个 Hero 建模前必须先回答（手册 §57）：最近相机距离、出场角度、是否拆解、哪些部件动画、哪些必须独立 Mesh —— 答案已在上表「拆件/动画」列。

## 白盒当前读数（2026-09-20 验收）

- 单 Canvas / 单 Scene；章节可见性裁剪（当前 ±1 章）
- draw calls：51~173 / 镜头；三角面 4.8k~13.9k / 镜头；自动验收阈值 < 420
- 全部 48 个镜头可定位、Camera 无 NaN、非硬切镜头零跳变
- 首屏 gzip ≈ 86.6 kB（journey chunk，含 three+gsap）
