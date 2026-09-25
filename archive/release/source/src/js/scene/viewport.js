/* ============================================================
   viewport.js — three.js 初始化 / 渲染循环 / resize / 生命周期
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildWorkshop } from './workshop.js';
import { detectWebGL, renderFallback, renderLoading } from './fallback.js';

/** 展厅页默认机位预设（?debug=1 的 setView 用；cast 页可通过 views 参数覆盖）
 *  §3.3 / 2C-R3 §5-2：lathe / sandbox 两个预设随尺度定稿重设
 *  （lathe 车床占画幅宽 30–40%、sandbox 阵列占画幅宽 20–28%） */
const HALL_VIEWS = {
  default: { pos: [16, 10, 23], target: [-3, 6.5, -5] },
  crane:   { pos: [14, 16, 26], target: [0, 22, -8] },
  sandbox: { pos: [14.6, 5.5, 14.6], target: [6.5, 0.5, 1] },
  cupola:  { pos: [-2, 10, 14], target: [-6, 8, -8] },
  // 2C-R5-FIX（§10.8-A/B）：随车床 (9.4, −7.6) / 工具车 (12.22, −7.25) 重设。
  //   ⚠️ **机位预设钳制式**（§10.9.1 永久规矩之二）：任何预设必须满足
  //      `|pos − target| ≥ minDistance + 0.05`（本工程 = 6.05），否则 controls.update() 会沿视线
  //      把相机外推，屏上读数比"按坐标直算"小一档（本轮的坑：cart 若取 r≈5.75，latheH 317 → 305）；
  //      且**近观读数必须在 setView() 之后取**，不得坐标直算。
  //      校验脚本：`.workbuddy/probe_presets.py`。本文件两个近观预设半径 = 6.76（lathe）/ 6.0508（cart）。
  lathe:   { pos: [12.9, 2.4, -2.0], target: [9.4, 0.95, -7.6] },   // 车床近观：占幅宽 34.8%、屏幕高 333px
  cart:    { pos: [12.36, 2.58, -2.08], target: [10.3, 0.85, -7.5] }, // 车床 + 工具车同框：高 342 / 205px（W8.readable 挂这里）
  env:     { pos: [20, 12, 26], target: [0, 10, -10] },
};

/**
 * 在容器内挂载三维视口
 * @param {HTMLElement} host 视口容器（position: relative）
 * @param {object}  [opts] 可选参数（Step 3 §12.9 参数化；默认值 = Step 1/2 现状，零变化）
 * @param {() => {group, update, dispose}} [opts.buildScene] 场景构造函数
 * @param {[number,number,number]} [opts.cameraPos] 初始机位
 * @param {[number,number,number]} [opts.target] 初始视点
 * @param {string}  [opts.debugKey] ?debug=1 暴露的 window 键名
 * @param {Record<string, {pos:number[], target:number[]}>} [opts.views] 调试机位预设
 * @returns {{ dispose(): void, scene, camera, renderer, canvas, controls }}
 *   scene/camera/canvas 供页面做射线拾取（cast 页砂箱取样）；展厅页只用 dispose
 */
export function mountViewport(host, {
  buildScene = buildWorkshop,
  cameraPos = [16, 10, 23],
  target = [-3, 6.5, -5],
  debugKey = '__hall',
  views = HALL_VIEWS,
} = {}) {
  const cap = detectWebGL();

  if (!cap.ok) {
    renderFallback(host);
    return { dispose() {} };
  }

  // ---------- 渲染器 ----------
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = cap.level === 'webgl2'; // WebGL1 降级：关阴影
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0E1116, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', '铸造馆三维场景，可拖拽旋转、滚轮缩放');
  host.appendChild(canvas);

  // ---------- 场景 ----------
  const scene = new THREE.Scene();
  // WebGL1 降级：关雾，减少片元开销
  if (cap.level === 'webgl2') {
    scene.fog = new THREE.FogExp2(0x0E1116, 0.012);
  }

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(...cameraPos);

  const built = buildScene();
  const { group, update: updateScene } = built;
  if (cap.level === 'webgl1') {
    group.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  }
  scene.add(group);

  // ---------- 环境贴图（规格 §4.1）----------
  // 金属的镜面成分完全依赖环境贴图：scene.environment 为空时，高 metalness 材质
  // （天吊/管道/护栏/导轨/炉身…）拿不到任何反射来源，会渲染成近黑剪影。
  // 注：three 0.160 尚无 Scene.environmentIntensity（r163 才引入），
  //     等价做法是逐材质设 envMapIntensity = 0.25，保持"熄火车间"的暗调。
  const ENV_INTENSITY = 0.25;
  let envRT = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();
    group.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m?.isMeshStandardMaterial) m.envMapIntensity = ENV_INTENSITY;
      }
    });
  } catch {
    envRT = null;   // 环境贴图不可用（极低端 WebGL1）时静默跳过，不阻断渲染
  }

  // ---------- 控制器 ----------
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 6;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(...target);
  controls.enablePan = false;
  controls.update();

  // ---------- 调试钩子（URL 带 ?debug=1 才生效）----------
  // 用途：验收截图的相机预设 + 性能读数（draw call / 三角面）。正式访问路径不受影响。
  let sil = null;
  if (new URLSearchParams(location.search).has('debug')) {
    window[debugKey] = {
      scene, camera, controls, renderer,
      views: Object.keys(views),
      setView(name) {
        const v = views[name];
        if (!v) return false;
        camera.position.set(...v.pos);
        controls.target.set(...v.target);
        controls.update();
        return true;
      },
      info() {
        return {
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          textures: renderer.info.memory.textures,
          geometries: renderer.info.memory.geometries,
        };
      },
      /**
       * §6 V8：一次调用返回 V1–V6 的全部判据（含实测值与 pass 布尔）。
       * 全部读实时场景数据（Box3 / 屏幕投影 / InstancedMesh 矩阵），不是写死的常量。
       */
      layout() {
        const cv = renderer.domElement;
        const SW = cv.clientWidth || 1440;
        const SH = cv.clientHeight || 900;
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);

        const v3 = new THREE.Vector3();
        const proj = (x, y, z) => {
          v3.set(x, y, z).project(camera);
          return [Math.round((v3.x * 0.5 + 0.5) * SW), Math.round((-v3.y * 0.5 + 0.5) * SH)];
        };
        const r2 = (n) => Math.round(n * 100) / 100;
        /** 世界包围盒 + 屏幕包围盒（8 个角点投影取并集） */
        const sb = (o) => {
          if (!o) return null;
          const b = new THREE.Box3().setFromObject(o);
          if (!isFinite(b.min.x)) return null;
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const cx of [b.min.x, b.max.x]) {
            for (const cy of [b.min.y, b.max.y]) {
              for (const cz of [b.min.z, b.max.z]) {
                const p = proj(cx, cy, cz);
                x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
                x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
              }
            }
          }
          return { min: b.min, max: b.max, screen: [x0, y0, x1, y1] };
        };
        /** 给定世界 AABB 的屏幕包围盒（用于不便于取对象的构件，如某根立柱） */
        const sbRange = (mn, mx) => {
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const cx of [mn[0], mx[0]]) {
            for (const cy of [mn[1], mx[1]]) {
              for (const cz of [mn[2], mx[2]]) {
                const p = proj(cx, cy, cz);
                x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
                x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
              }
            }
          }
          return [x0, y0, x1, y1];
        };
        /**
         * 未旋转的落地尺寸 = 模型基准 × scale（2C-R3 用于验"三轴等比"，旋转后的 AABB 验不出来）。
         * 用子 mesh 的**父级局部矩阵** o.matrix 取包围盒（不含 group 的旋转/平移），
         * 再按 group.scale 逐轴乘回世界尺寸。前提：被测对象的 mesh 是 group 的直接子级
         * （lathe 三个 mesh、toolcart 两个 mesh 均满足）。
         */
        const localDim = (obj) => {
          if (!obj) return [0, 0, 0];
          const bb = new THREE.Box3();
          let hit = false;
          obj.traverse((o) => {
            if (!o.isMesh || !o.geometry) return;
            o.geometry.computeBoundingBox();
            if (!o.geometry.boundingBox) return;
            bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrix));
            hit = true;
          });
          if (!hit) return [0, 0, 0];
          const d = new THREE.Vector3().subVectors(bb.max, bb.min);
          return [r2(d.x * obj.scale.x), r2(d.y * obj.scale.y), r2(d.z * obj.scale.z)];
        };
        /** 两个屏幕矩形的重叠面积占 B 面积的比例（B 取较小者，用于"参照物不得压住车床"判据） */
        const overlapRatio = (A, B) => {
          if (!A || !B) return 0;
          const ox = Math.max(0, Math.min(A[2], B[2]) - Math.max(A[0], B[0]));
          const oy = Math.max(0, Math.min(A[3], B[3]) - Math.max(A[1], B[1]));
          const areaB = (B[2] - B[0]) * (B[3] - B[1]);
          return areaB > 0 ? Math.round((ox * oy) / areaB * 1000) / 1000 : 0;
        };

        /* ================= 判据收集器 =================
           2C-R3 §3-⑥：`checks` 把每条判据的 **阈值 / 实测值 / 结果** 一起返回，
           `pass` 布尔由 checks 汇总得出（不再独立写死）—— 以后任何人改阈值，
           都会在返回值里留下痕迹，不会出现"静默放宽却仍报 pass"的情况。 */
        const checks = [];
        const add = (id, name, threshold, value, ok) => {
          const o = { id, name, threshold, value, ok: !!ok };
          checks.push(o);
          return o.ok;
        };
        /** 同一处测量登记到多个判据编号下（如 V4/V5 旧世代 与 W6/W7 新世代同源） */
        const add2 = (ids, name, threshold, value, ok) => {
          let all = true;
          for (const id of ids) all = add(id, name, threshold, value, ok) && all;
          return all;
        };

        const cup = scene.getObjectByName('cupola');
        const cupBody = scene.getObjectByName('cupola_body');
        const lathe = scene.getObjectByName('lathe_c620');
        const sbs = scene.getObjectByName('sandboxes');
        const lad = scene.getObjectByName('ladle');
        const crane = scene.getObjectByName('crane');
        const lamps = scene.getObjectByName('lamp_shades');
        const pipes = scene.getObjectByName('wall_pipes');
        const ladder = scene.getObjectByName('cupola_ladder');
        const platform = scene.getObjectByName('cupola_platform');
        const env = scene.getObjectByName('environment');
        const cart = scene.getObjectByName('toolcart');

        // ---- V1 冲天炉（2C-R3：三项全保持，不得回退）----
        const cGroup = sb(cup);
        const cBody = sb(cupBody);
        const cupolaScale = cup ? cup.scale.x : 0;
        const baseR = cupBody?.geometry?.parameters?.radiusBottom
          ? cupBody.geometry.parameters.radiusBottom * cupolaScale : 0;
        const topY = cGroup ? r2(cGroup.max.y) : 0;
        const cupScreen = cBody ? cBody.screen : null;
        const cupWant = [510, 150, 890, 670];
        add('V1.scale', '冲天炉缩放', '=1.35', cupolaScale, cupolaScale === 1.35);
        add('V1.topY', '炉顶标高', '16.39±0.05', topY, Math.abs(topY - 16.39) <= 0.05);
        add('V1.baseR', '炉底半径', '3.24±0.02', baseR, Math.abs(baseR - 3.24) <= 0.02);
        add('V1.screen', '炉体屏幕框落点', `x ${cupWant[0]}–${cupWant[2]} / y ${cupWant[1]}–${cupWant[3]}`, cupScreen,
          !!cupScreen && cupScreen[0] >= cupWant[0] && cupScreen[1] >= cupWant[1]
          && cupScreen[2] <= cupWant[2] && cupScreen[3] <= cupWant[3]);

        // ---- W1 / W2 / W3 车床尺度（2C-R3：等比 1.4，内部比例保持真实）----
        const lBox = sb(lathe);          // 旋转后世界 AABB（屏幕框用）
        const lAABB = lBox ? [r2(lBox.max.x - lBox.min.x), r2(lBox.max.y - lBox.min.y), r2(lBox.max.z - lBox.min.z)] : [0, 0, 0];
        const lLocalRaw = localDim(lathe);   // [x, y, z]（模型局部轴）
        // 规格 W2 的声明次序是「长 / 宽 / 高」（= x / z / y），与 §3.2 逐件表一致，故此处换序
        const lLocal = [lLocalRaw[0], lLocalRaw[2], lLocalRaw[1]];
        const lScale = lathe?.userData?.displayScale ?? null;
        const lScaleLive = lathe ? [r2(lathe.scale.x), r2(lathe.scale.y), r2(lathe.scale.z)] : [0, 0, 0];
        const lRotY = lathe ? Math.round(lathe.rotation.y * 180 / Math.PI * 10) / 10 : 0;
        const axisY = r2((lathe?.userData?.spindleY ?? 0) * (lScale ? lScale[1] : 1));   // 世界值 = 0.99 × 1.4
        const lTopY = lBox ? r2(lBox.max.y) : 0;
        const axisRatio = lTopY ? r2(axisY / lTopY) : 0;
        const lWait = [3.54, 1.43, 1.86];
        // displayScale 必须与实时 group.scale 逐位一致 —— 只改 scale 不同步会报出与场景不符的 axisY（R2 的坑）
        const scaleEqual = !!lScale
          && Math.abs(lScale[0] - lScale[1]) < 1e-6 && Math.abs(lScale[1] - lScale[2]) < 1e-6
          && Math.abs(lScale[0] - 1.4) < 0.001
          && Math.abs(lScaleLive[0] - 1.4) < 0.001 && Math.abs(lScaleLive[1] - 1.4) < 0.001
          && Math.abs(lScaleLive[2] - 1.4) < 0.001;
        add('W1.scale', '车床三轴等比', '三轴=1.4±0.001 且 displayScale 与实时 group.scale 一致',
          { displayScale: lScale, live: lScaleLive }, scaleEqual);
        add('W2.boxLocal', '车床落地尺寸（未旋转，长/宽/高）', '3.54 / 1.43 / 1.86 ±0.04（次序 = x/z/y）', lLocal,
          Math.abs(lLocal[0] - lWait[0]) <= 0.04 && Math.abs(lLocal[1] - lWait[1]) <= 0.03
          && Math.abs(lLocal[2] - lWait[2]) <= 0.04);
        add('W3.axisY', '主轴中心高（世界）', '1.386±0.015', axisY, Math.abs(axisY - 1.386) <= 0.015);
        add('W3.axisRatio', '中心高/车床总高（须与模型基准 0.99/1.33 同比）', '0.745±0.01', axisRatio,
          Math.abs(axisRatio - 0.745) <= 0.01);

        // ---- W4 车床落位与朝向（2C-R5-FIX：砂箱阵列后方，与作业区警示线平行）----
        // §10.8-A：同排布内前移右移 1.4m —— 新位使「车床屏幕框被砂箱阵列覆盖」由 13% 降到 0%
        const L_POS = [9.4, -7.6];
        const lPos = lathe ? [r2(lathe.position.x), r2(lathe.position.z)] : [0, 0];
        add('W4.pos', '车床落位',
          '(9.4, −7.6)±0.1 —— 依据 §10.8-A：同排布内寻优，消除砂箱阵列对车床腿与底座的剪影遮挡',
          lPos, Math.abs(lPos[0] - L_POS[0]) <= 0.1 && Math.abs(lPos[1] - L_POS[1]) <= 0.1);
        add('W4.rotY', '车床朝向（与砂箱作业区警示线平行 = 世界轴对齐）',
          '0°±0.5 —— 依据 §10.8-A：操作面（溜板箱/手轮/丝杠）正对入场，入场即读到完整侧面',
          lRotY, Math.abs(lRotY) <= 0.5);

        // ---- V4 / W6 砂箱（2C-R3：展厅侧缩放 0.7）----
        const sbBox = sb(sbs);
        const range = sbBox ? [r2(sbBox.min.x), r2(sbBox.max.x), r2(sbBox.min.z), r2(sbBox.max.z)] : [0, 0, 0, 0];
        const zoneRight = r2(range[1] + 1.0);         // 作业区每边外扩 1.0m 的原有约定
        const columnGap = r2(12.3 - zoneRight);       // 立柱 (13,6) 基座内缘 12.3
        let instInFrame = 0;
        const lowerMesh = sbs?.getObjectByName('sandboxes_lower');
        const upperMesh = sbs?.getObjectByName('sandboxes_upper');
        if (lowerMesh) {
          const m4 = new THREE.Matrix4();
          const p3 = new THREE.Vector3();
          for (let i = 0; i < lowerMesh.count; i++) {
            lowerMesh.getMatrixAt(i, m4);
            p3.setFromMatrixPosition(m4);
            sbs.localToWorld(p3);
            const s = proj(p3.x, p3.y, p3.z);
            if (s[0] >= 0 && s[0] <= SW && s[1] >= 0 && s[1] <= SH) instInFrame++;
          }
        }
        // 单箱落地尺寸从 InstancedMesh 的几何 + 实例矩阵实测（不写死）：
        // 名义总高 = 上箱实例 y + 下箱实例 y（两半等高、分型缝在中间）→ 0.90 × scale
        const unit = (() => {
          if (!lowerMesh || !upperMesh) return [0, 0, 0];
          lowerMesh.geometry.computeBoundingBox();
          const d = new THREE.Vector3().subVectors(lowerMesh.geometry.boundingBox.max, lowerMesh.geometry.boundingBox.min);
          const m4 = new THREE.Matrix4();
          lowerMesh.getMatrixAt(0, m4);
          const yLow = new THREE.Vector3().setFromMatrixPosition(m4).y;
          upperMesh.getMatrixAt(0, m4);
          const yUp = new THREE.Vector3().setFromMatrixPosition(m4).y;
          const s = sbs.scale;
          return [r2(d.x * s.x), r2((yUp + yLow) * s.y), r2(d.z * s.z)];
        })();
        const sbScaleWant = [r2(sbs ? sbs.scale.x : 0), r2(sbs ? sbs.scale.y : 0), r2(sbs ? sbs.scale.z : 0)];
        const sbUnitWant = [1.26, 0.63, 0.98];
        add2(['V4.range', 'W6.range'], '砂箱阵列世界范围', 'x 4.19–8.81 / z −2.01–4.01（±0.05）', range,
          Math.abs(range[0] - 4.19) <= 0.05 && Math.abs(range[1] - 8.81) <= 0.05
          && Math.abs(range[2] + 2.01) <= 0.05 && Math.abs(range[3] - 4.01) <= 0.05);
        add2(['V4.unit', 'W6.unit'], '单箱落地尺寸（x / 名义总高 / z）', '1.26/0.63/0.98 ±0.02', unit,
          Math.abs(unit[0] - sbUnitWant[0]) <= 0.02 && Math.abs(unit[1] - sbUnitWant[1]) <= 0.02
          && Math.abs(unit[2] - sbUnitWant[2]) <= 0.02);
        add2(['V4.inst', 'W6.inst'], '12 实例全部在画幅内', '=12', instInFrame, instInFrame === 12);
        add('V4.screen', '砂箱阵列屏幕框（底边须留出画幅下沿) ', '底边 ≤800 且在画幅内', sbBox?.screen,
          !!sbBox && sbBox.screen[3] <= 800 && sbBox.screen[0] >= 0 && sbBox.screen[2] <= SW);
        add('W6.scale', '砂箱展厅侧缩放（props/sandboxes.js 零改动）', '三轴=0.7±0.005', sbScaleWant,
          Math.abs(sbScaleWant[0] - 0.7) < 0.005 && Math.abs(sbScaleWant[1] - 0.7) < 0.005
          && Math.abs(sbScaleWant[2] - 0.7) < 0.005);
        // 车床 / 单箱 占地比（R3 的尺寸层级量化判据；砂箱缩到 0.7 后此值应 ≈5.3）
        // lLocal 次序 = [长, 宽, 高]；unit 次序 = [长, 高, 宽]（沿用规格 W6 的声明次序）
        const footRatio = unit[0] && unit[2] ? r2(lLocal[0] * lLocal[1] / (unit[0] * unit[2])) : 0;

        // ---- W5 构图（2C-R5：车床迁至砂箱阵列正后方，判据由 R3 的「x 向让位」改为「z 向让位 + 屏幕带」）----
        // 警示线四段先收集（V5/W7 复用同一份实测，不在判据里写死几何常量）
        const stripList = [];
        if (env) {
          for (const c of env.children) {
            if (c.isMesh && c.geometry?.parameters?.width === 0.28) {
              stripList.push([r2(c.position.x), r2(c.position.z), r2(c.geometry.parameters.height)]);
            }
          }
        }
        // 砂箱作业区后沿警示线（z<0 且长度 >5m 的那几段里最靠后的一条）的世界后沿 = z − 0.28/2
        const zoneRearZ = Math.min(...stripList.filter((s) => s[1] < 0 && s[2] > 5).map((s) => s[1])) - 0.14;
        // 与作业区警示线后沿 / 砂箱阵列后沿 / 地面导向线的实测间距（世界坐标，m）
        const gapZoneZ = lBox ? r2(zoneRearZ - lBox.max.z) : 0;
        const gapArrayZ = (lBox && sbBox) ? r2(sbBox.min.z - lBox.max.z) : 0;
        const gapGuideL = lBox ? r2(11.5 - lBox.max.x) : 0;
        // 立柱屏幕带取"车床高度区间"那一段：整根 30m 柱在透视下横向铺得很宽，
        // 用全高包围盒会误判遮挡（比较的是车床所在高度的柱身投影）。车床新位最近的两根都纳入。
        const colBands = [
          sbRange([12.3, 0, 5.3], [13.7, 2.0, 6.7]),       // 立柱 (13, 6)
          sbRange([12.3, 0, -18.7], [13.7, 2.0, -17.3]),   // 立柱 (13, −18)
        ];
        const colGapOf = (band) => lBox ? Math.max(band[0] - lBox.screen[2], lBox.screen[0] - band[2]) : 999;
        const clearColumnPx = Math.round(Math.min(...colBands.map(colGapOf)));
        // 世界判据：车床包箱到最近立柱基座的净距。R5 起车床落在厅中央，距四柱均 ≥13m，
        // R3 的「屏幕带 ≥20px」在新区位只剩透视巧合（(13,6) 柱比车床近 17m，投影恰好擦边 13px），
        // 故判据改为世界净距；屏幕带间距保留为诊断值 clearColumnPx 随返回值输出。
        const colCenters = [[13, 6], [13, -18], [-13, 6], [-13, -18]];
        const minColDist = lBox ? r2(Math.min(...colCenters.map(([cx, cz]) => {
          const dx = Math.max(lBox.min.x - cx, cx - lBox.max.x, 0);
          const dz = Math.max(lBox.min.z - cz, cz - lBox.max.z, 0);
          return Math.hypot(dx, dz);
        }))) : 0;
        const lScreen0 = lBox?.screen ?? null;
        // ---- W5.cover / W5.presence：两条由**原则**定的构图判据（§10.8-C）----
        // R5-FIX 起取代自指的 W5.band（那条的带子是从测量值反推的，不构成判据）。
        //   · cover    = 车床屏幕框 ∩ 砂箱阵列屏幕框 ÷ 车床屏幕框
        //                原则：机器不得埋进阵列剪影（"站在砂模堆里"的直接量化）
        //   · presence = 车床屏幕宽 ÷ 砂箱阵列屏幕宽
        //                原则：三件主展品不得差一个量级（"车床像玩具"那次的教训）
        const sbCover = overlapRatio(sbBox?.screen ?? null, lScreen0);
        const lScreenW = lScreen0 ? lScreen0[2] - lScreen0[0] : 0;
        const sbScreenW = sbBox?.screen ? sbBox.screen[2] - sbBox.screen[0] : 0;
        const presence = sbScreenW > 0 ? Math.round(lScreenW / sbScreenW * 1000) / 1000 : 0;
        add('W5.right', '车床屏幕框右边界', '≤1380（距画幅右沿 ≥60px，留小地图/滚动条余量）',
          lScreen0 ? lScreen0[2] : null, !!lScreen0 && lScreen0[2] <= 1380);
        add('W5.bottom', '车床屏幕框底边', '≤820（距画幅下沿 ≥80px）',
          lScreen0 ? lScreen0[3] : null, !!lScreen0 && lScreen0[3] <= 820);
        add('W5.colGap', '与最近立柱基座净距（世界坐标，四柱取最小）',
          '≥2.0m（R5 起改为世界判据；屏幕带间距为诊断值 clearColumnPx，仅在不为负时视为无遮挡）',
          minColDist, minColDist >= 2.0);
        add('W5.zoneGap', '与砂箱作业区警示线后沿间距（z 向）', '≥2.0m（不侵占造型工位操作通道）',
          gapZoneZ, gapZoneZ >= 2.0);
        add('W5.arrayGap', '与砂箱阵列世界包箱后沿间距（z 向）', '≥2.0m', gapArrayZ, gapArrayZ >= 2.0);
        // 依据：导向线是地面绘制线，宽 0.12（见下方 V5.x 的同源校验）。判据只要求"不压线"，
        // 余量取一个线宽 —— 这个数字来自**线的几何**，不来自车床落位的测量值。
        // §10.9.1 已裁定：该线从车床与工具车之间的 0.45m 空档穿过属几何必然，接受，不再调整。
        add('W5.guideGap', '与地面导向线(x=11.5)间距',
          '≥0.12m（= 导向线带宽；包箱不得压在导向线上 —— 见 V5.x 两条 x=±11.5、宽 0.12）',
          gapGuideL, gapGuideL >= 0.12);
        add('W5.cover', '车床屏幕框被砂箱阵列覆盖比例（∩ ÷ 车床框）',
          '≤0.05（依据 §10.8-C：机器不得埋进阵列剪影 —— 阈值按"视觉上能否看出被挡"定）',
          sbCover, sbCover <= 0.05);
        add('W5.presence', '车床屏幕宽 ÷ 砂箱阵列屏幕宽',
          '≥0.45（依据 §10.8-C：三件主展品不得差一个量级 —— 车床屏幕宽须达阵列的 45% 以上）',
          presence, presence >= 0.45);

        // ---- V5 / W7 警示线与导向线（stripList 已在 W5 块收集）----
        const zoneWant = [[6.5, -3.0, 6.6], [6.5, 5.0, 6.6], [3.2, 1.0, 8.0], [9.8, 1.0, 8.0]];
        const zoneOk = zoneWant.every((w) =>
          stripList.some((s) => Math.abs(s[0] - w[0]) < 0.01 && Math.abs(s[1] - w[1]) < 0.01 && Math.abs(s[2] - w[2]) < 0.05));
        add2(['V4.strips', 'W7.strips'], '砂箱作业区警示线四段', 'x 3.2–9.8 / z −3.0–5.0 共四段', stripList, zoneOk);
        add2(['V4.colGap', 'W7.colGap'], '作业区右边界到立柱(13,6)基座内缘', '≥2.45m', columnGap, columnGap >= 2.45);

        const guideX = [];
        for (const c of group.children) {
          const par = c.geometry?.parameters;
          if (c.isMesh && par && Math.abs(par.width - 0.12) < 1e-6 && par.height > 10) {
            guideX.push(r2(c.position.x));
          }
        }
        guideX.sort((a, b) => a - b);
        const cupX = cBody ? [cBody.min.x, cBody.max.x] : [0, 0];
        const guideOverlap = guideX.some((gx) => {
          const a = Math.abs(gx);
          return a <= zoneRight || a >= 12.3 || (gx >= cupX[0] && gx <= cupX[1]);
        });
        add('V5.x', '地面导向线位置', '两条，x = ±11.5', guideX,
          guideX.length === 2 && Math.abs(guideX[0] + 11.5) < 0.01 && Math.abs(guideX[1] - 11.5) < 0.01);
        add('V5.overlap', '导向线与砂箱作业区/炉体/柱基无交叠', 'overlap=false', guideOverlap, !guideOverlap);

        // ---- V6 悬空处置（七项）----
        const lampsBox = sb(lamps);
        const platBox = sb(platform);
        const ladderBox = sb(ladder);
        const pipesBox = sb(pipes);
        const ladBox = sb(lad);
        const lampRodTopY = lampsBox ? r2(lampsBox.max.y) : 0;
        const platformPost = platBox ? [r2(platBox.min.y), r2((8.4 - 0.125) * cupolaScale)] : [0, 0];
        const ladleRimY = lad ? r2(lad.userData.rimY) : 0;
        const ladleZ = lad ? r2(lad.position.z) : 0;
        const troughEndZ = cup ? r2(cup.userData.troughEnd.z) : 0;
        const ladderTopZ = ladderBox ? r2((ladderBox.min.z + ladderBox.max.z) / 2) : 0;
        const platZ = platBox ? [r2(platBox.min.z), r2(platBox.max.z)] : [0, 0];
        const pipeWallGap = pipesBox ? r2(Math.abs(pipesBox.min.z - (-30 + 0.15))) : 99;
        const riserTopY = pipesBox ? r2(pipesBox.max.y) : 0;
        const runwayTopY = crane ? r2(crane.userData.runwayTopY) : 0;
        add('V6.lamp', '吊灯杆顶标高', '≥28.5', lampRodTopY, lampRodTopY >= 28.5);
        add('V6.platform', '冲天炉平台下方有落地柱', '柱顶 > 8', platformPost, platformPost[1] > 8);
        add('V6.ladle', '铁水包口沿标高', '1.10±0.02', ladleRimY, Math.abs(ladleRimY - 1.10) < 0.02);
        add('V6.ladleZ', '铁水包与流槽末端对位', '|Δz| < 0.2', r2(ladleZ - troughEndZ), Math.abs(ladleZ - troughEndZ) < 0.2);
        add('V6.ladder', '梯顶落在平台 z 范围内', 'platZ[0] ≤ 梯顶 ∈ ≤ platZ[1]', { ladderTopZ, platZ },
          ladderTopZ >= platZ[0] && ladderTopZ <= platZ[1]);
        add('V6.pipe', '横管贴墙', '离墙 ≤0.02m 且顶到侧墙', pipeWallGap, pipeWallGap <= 0.02);
        add('V6.riser', '立管顶标高', '≥28', riserTopY, riserTopY >= 28);
        add('V6.runway', '天吊轨道梁顶标高', '23.6±0.01', runwayTopY, Math.abs(runwayTopY - 23.6) < 0.01);

        // ---- V7 性能预算（2C-R3 收紧：draw call ≤50 / 三角面 ≤60k / 贴图不新增）----
        const perf = {
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          textures: renderer.info.memory.textures,
        };
        add('V7.calls', 'draw call', '≤50', perf.calls, perf.calls <= 50);
        add('V7.tris', '三角面', '≤60000', perf.triangles, perf.triangles <= 60000);
        add('V7.textures', '贴图数（本轮不得新增）', '≤5', perf.textures, perf.textures <= 5);

        // ---- 悬浮层：DOM 实测（HUD / 小地图 / 热点药丸都不在 canvas 里）----
        // 2C-R4 §3-③(c)：屏幕框判据必须把悬浮层一起纳入，只看画幅四边会漏
        // ——R3 就是漏在这：工具车有 16.2% 的屏幕框落在右下小地图后面。
        // 一律运行时 getBoundingClientRect()，不写死像素值（版面一改就失效）。
        const rectOf = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
        };
        const overlays = { minimap: rectOf('.minimap'), hud: rectOf('.hud') };

        // ---- W8 / W9 工具车参照物（1:1，不随车床缩放；2C-R4 §10.7 重述）----
        const cartBox = sb(cart);
        const cartScreen = cartBox?.screen ?? null;
        const cartLocal = localDim(cart);            // 未旋转包箱，世界轴序 (x, y, z)
        const cartH = cartBox ? r2(cartBox.max.y - cartBox.min.y) : 0;
        const lScreen = lBox?.screen ?? null;
        const lScreenH = lScreen ? lScreen[3] - lScreen[1] : 0;
        const cartScreenH = cartScreen ? cartScreen[3] - cartScreen[1] : 0;
        const hRatio = lScreenH > 0 ? Math.round(cartScreenH / lScreenH * 1000) / 1000 : 0;
        // W8.near（§10.8-B）：参照物的**第一属性**是贴着参照对象 —— 取两包箱的平面净距（m）。
        // 平面（x/z）而非三维：落到地上的展品，"挨着"由地面上的距离决定。
        const nearDist = (lBox && cartBox) ? r2(Math.hypot(
          Math.max(lBox.min.x - cartBox.max.x, cartBox.min.x - lBox.max.x, 0),
          Math.max(lBox.min.z - cartBox.max.z, cartBox.min.z - lBox.max.z, 0))) : 999;
        // W8.readable（§10.8-B）：可读性判据挂**近观 cart 预设**，不挂默认机位 ——
        // 默认机位下工具车只有 ~40px 高是几何必然（0.92m 只有车床 1.86m 的一半，且同深度）。
        // 这里临时切到 views.cart 量一次，量完立刻还原相机；其余判据仍全部在默认机位下量。
        const camKeep = { pos: camera.position.clone(), target: controls.target.clone() };
        let presetCart = { latheH: 0, cartH: 0, cover: 0, latheScreen: null, cartScreen: null };
        if (views.cart) {
          camera.position.set(...views.cart.pos);
          controls.target.set(...views.cart.target);
          controls.update();
          camera.updateMatrixWorld(true);
          const lP = sb(lathe); const cP = sb(cart);
          presetCart = {
            latheH: lP ? lP.screen[3] - lP.screen[1] : 0,
            cartH: cP ? cP.screen[3] - cP.screen[1] : 0,
            cover: overlapRatio(cP?.screen ?? null, lP?.screen ?? null),
            latheScreen: lP?.screen ?? null,
            cartScreen: cP?.screen ?? null,
          };
          camera.position.copy(camKeep.pos);
          controls.target.copy(camKeep.target);
          controls.update();
          camera.updateMatrixWorld(true);
        }
        // 两个方向的重叠都报，并把分母写进 name（2C-R4 §3-③(b)）：
        //   latheCovered     = 交集 ÷ 车床屏幕框 —— 规范判据：工具车不得压住车床
        //   overlapWithLathe = 交集 ÷ 工具车屏幕框 —— 诊断值：工具车被车床"吃掉"多少
        const cartOverlap = overlapRatio(lScreen, cartScreen);
        const latheCovered = overlapRatio(cartScreen, lScreen);
        const cartScale = cart ? [r2(cart.scale.x), r2(cart.scale.y), r2(cart.scale.z)] : [0, 0, 0];
        // 小地图避让：与右下小地图悬浮层的重叠占比（% 形式，判据要求 = 0）
        const mm = overlays.minimap;
        const mapHitPct = mm && cartScreen ? r2(overlapRatio(mm, cartScreen) * 100) : 0;
        const latheMapHitPct = mm && lScreen ? r2(overlapRatio(mm, lScreen) * 100) : 0;
        const sandMapHitPct = mm && sbBox ? r2(overlapRatio(mm, sbBox.screen) * 100) : 0;
        const cartRight = cartScreen ? Math.round(SW - cartScreen[2]) : 0;
        const cartBottom = cartScreen ? Math.round(SH - cartScreen[3]) : 0;
        const cartWant = [1.16, 0.92, 0.60];         // 台面外挑值（柜体值 1.10 / 0.55 亦接受）
        add('W8.exists', '工具车存在（已知尺寸参照物）', 'toolcart 节点存在', !!cart, !!cart);
        add('W8.scale', '工具车世界尺度【硬】', '三轴 = 1（1:1，不随车床 ×1.4）', cartScale,
          Math.abs(cartScale[0] - 1) < 1e-6 && Math.abs(cartScale[1] - 1) < 1e-6 && Math.abs(cartScale[2] - 1) < 1e-6);
        add('W8.height', '工具车总高【硬】', 'userData.height = 0.92±0.02，且与运行时包箱高一致（1:1 实物尺度，§10.8-B）',
          { userData: cart?.userData?.height ?? null, measured: cartH },
          Math.abs((cart?.userData?.height ?? 0) - 0.92) <= 0.02 && Math.abs(cartH - 0.92) <= 0.02);
        add('W8.boxLocal', '工具车未旋转包箱【硬】(x/y/z)', '1.16 或 1.10 × 0.92 × 0.60 或 0.55（±0.03）',
          cartLocal,
          cartLocal[0] >= cartWant[0] - 0.06 && cartLocal[0] <= cartWant[0] + 0.03
          && Math.abs(cartLocal[1] - cartWant[1]) <= 0.03
          && cartLocal[2] >= cartWant[2] - 0.05 && cartLocal[2] <= cartWant[2] + 0.03);
        add('W8.near', '工具车包箱到车床包箱净距【硬】',
          '≤1.5m（依据 §10.8-B：参照物必须贴着参照对象，离开就失去参照意义）',
          nearDist, nearDist <= 1.5);
        add('W8.readable', 'cart 近观预设下的可读性（工具车屏幕高 / 车床屏幕高 / 工具车压车床）',
          '工具车 ≥140px 且 车床 ≥300px 且 互不相压 ≤0.10（依据 §10.8-B：可读性挂近观预设，不挂默认机位）',
          { cartH: presetCart.cartH, latheH: presetCart.latheH, cover: presetCart.cover },
          presetCart.cartH >= 140 && presetCart.latheH >= 300 && presetCart.cover <= 0.10);
        add('W8.hRatio', '工具车屏幕高 / 车床屏幕高【软·粗筛】',
          '0.38–0.58（依据 §10.7-B / §10.8-C：世界高比 0.92 ÷ 1.86 = 0.494，屏幕比受景深与包箱纵深影响，'
          + '留 ±0.10 只作量级粗筛 —— 误随车床 ×1.4 会冲到 ≈0.79）',
          hRatio, hRatio >= 0.38 && hRatio <= 0.58);
        add('W8.cover', '工具车压住车床的比例（交集 ÷ 车床屏幕框）', '≤0.10', latheCovered, latheCovered <= 0.10);
        add('W8.sep', '车床吃掉工具车的比例（交集 ÷ 工具车屏幕框）', '≤0.20', cartOverlap, cartOverlap <= 0.20);
        add('W8.inFrame', '工具车屏幕框在画幅内', 'x 0–SW / y 0–SH', cartScreen,
          !!cartScreen && cartScreen[0] >= 0 && cartScreen[2] <= SW && cartScreen[1] >= 0 && cartScreen[3] <= SH);
        add('W8.marginRight', '工具车右留白', '≥120px', cartRight, cartRight >= 120);
        add('W8.marginBottom', '工具车下留白', '≥100px', cartBottom, cartBottom >= 100);
        // W9：悬浮层避让（DOM 实测矩形；分母写进 name）
        add('W9.map', '工具车不压右下小地图（交集 ÷ 工具车屏幕框，%）',
          '= 0%（minimap 矩形由 getBoundingClientRect() 运行时取，不写死像素）', mapHitPct, mapHitPct <= 0);
        add('W9.map.lathe', '车床不压右下小地图（交集 ÷ 车床屏幕框，%）', '= 0%', latheMapHitPct, latheMapHitPct <= 0);
        add('W9.map.sandboxes', '砂箱阵列不压右下小地图（交集 ÷ 阵列屏幕框，%）', '= 0%', sandMapHitPct, sandMapHitPct <= 0);

        // ---- V2 / V3：2C 世代的判据编号，2C-R3 起语义并入 W1–W5 ----
        // 登记方式：同源测量、双编号呈现 —— ok 由 W 组实测汇总。以后有人改阈值，
        // 这两个编号会立刻变红，不会出现"静默放宽却仍报 pass"。
        const okW = (keys) => keys.every((k) => checks.some((c) => c.id === k && c.ok));
        const v2map = ['W1.scale', 'W2.boxLocal', 'W3.axisY', 'W3.axisRatio'];
        const v3map = ['W4.pos', 'W4.rotY', 'W5.right', 'W5.bottom', 'W5.colGap', 'W5.zoneGap',
          'W5.guideGap', 'W5.cover', 'W5.presence'];
        add('V2.superseded', '车床尺度判据（2C 世代编号，2C-R3 起由 W1/W2/W3 取代）',
          '等比 1.4 / boxLocal / axisY —— 见 W1–W3', v2map, okW(v2map));
        add('V3.superseded', '车床机位构图判据（2C 世代编号，2C-R3 起由 W4/W5 取代）',
          '落位 / 朝向 / 构图六条 —— 见 W4–W5', v3map, okW(v3map));

        // ---- V8 钩子完整性：缺任何一组判据即 fail（自检防线本身也要被自检）----
        // 先登记本条，再回头算缺失组 —— 否则"V8."这一组会因为自己还没入列而永远报缺失
        const needPrefix = ['V1.', 'V2.', 'V3.', 'V4.', 'V5.', 'V6.', 'V7.', 'V8.', 'W1.', 'W2.', 'W3.', 'W4.', 'W5.', 'W6.', 'W7.', 'W8.', 'W9.'];
        const v8entry = {
          id: 'V8.checks', name: '自检钩子完整性（V1–V8 / W1–W8 均有判据，每条含 threshold/value/ok）',
          threshold: '缺失组 = 0', value: null, ok: false,
        };
        checks.push(v8entry);
        const missing = needPrefix.filter((p) => !checks.some((c) => c.id.startsWith(p)));
        v8entry.value = missing;
        v8entry.ok = missing.length === 0;

        // ---- pass 由 checks 汇总得出（不得独立写死；改阈值必须出现在返回值里）----
        const pass = {};
        for (const key of needPrefix.map((p) => p.slice(0, -1))) {
          const own = checks.filter((c) => c.id.startsWith(key + '.'));
          pass[key] = own.length > 0 && own.every((c) => c.ok);
        }

        return {
          frame: [SW, SH],
          cupola: { scale: cupolaScale, topY, baseR, screen: cupScreen, groupBox: cGroup ? [r2(cGroup.min.x), r2(cGroup.max.x), topY] : null },
          lathe: {
            box: lAABB,                 // 旋转后世界 AABB
            boxLocal: lLocal,           // 未旋转落地尺寸（= 模型基准 × scale）
            scale: lScale, scaleLive: lScaleLive, rotY: lRotY,
            axisY, axisRatio, topY: lTopY, footRatio, pos: lPos, screen: lScreen,
            clearColumnPx, gapZone: gapZoneZ, gapArray: gapArrayZ, gapGuide: gapGuideL,
            screenW: lScreenW, coverBySandboxes: sbCover, presence,
          },
          sandboxes: { range, screen: sbBox?.screen ?? null, unit, scale: sbScaleWant, instInFrame, zoneRight, columnGap, strips: stripList },
          guide: { x: guideX, overlap: guideOverlap },
          toolcart: {
            box: cartBox && cartBox.screen ? [r2(cartBox.max.x - cartBox.min.x), r2(cartBox.max.y - cartBox.min.y), r2(cartBox.max.z - cartBox.min.z)] : null,
            boxLocal: cartLocal, scale: cartScale, height: cartH,
            userHeight: cart?.userData?.height ?? null,
            screen: cartScreen, pos: cart ? [r2(cart.position.x), r2(cart.position.z)] : null,
            rotY: cart ? Math.round(cart.rotation.y * 180 / Math.PI * 10) / 10 : 0,
            hRatio, latheCovered, overlapWithLathe: cartOverlap, mapHitPct,
            marginRight: cartRight, marginBottom: cartBottom,
            nearDist, screenH: cartScreenH, presetCart,
          },
          overlays,
          floating: { lampRodTopY, platformPost, ladleRimY, ladleZ, troughEndZ, ladderTopZ, platZ, pipeWallGap, riserTopY, runwayTopY, ladleScreen: ladBox?.screen ?? null, ladleBox: ladBox ? [r2(ladBox.max.x - ladBox.min.x), r2(ladBox.max.y - ladBox.min.y), r2(ladBox.max.z - ladBox.min.z)] : null },
          perf,
          checks,
          pass,
        };
      },
      // 剪影测试（规格 §1.1）：on=true 时全场景换纯黑 MeshBasic、背景纯白；
      // isolate=true（默认）额外把车床以外的 mesh 隐藏——否则黑色地面会吃掉剪影。
      // 场景里没有车床（如 cast 小场景）时 isolate 自动退化为全场景剪影。
      // false 还原。仅调试用，正式访问不经过此路径。
      silhouette(on, isolate = true) {
        const lathe = scene.getObjectByName('lathe_c620');
        const inLathe = (o) => {
          if (!lathe) return false;
          for (let p = o; p; p = p.parent) if (p === lathe) return true;
          return false;
        };
        if (on && !sil) {
          if (!lathe) isolate = false;
          sil = { bg: scene.background, fog: scene.fog, saved: [] };
          scene.background = new THREE.Color(0xffffff);
          scene.fog = null;
          scene.traverse((o) => {
            if (!o.isMesh && !o.isPoints) return;
            const keep = o.isMesh && (!isolate || inLathe(o));
            sil.saved.push([o, o.visible, o.material]);
            o.visible = keep;
            if (keep) o.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
          });
          return true;
        }
        if (!on && sil) {
          for (const [o, vis, mat] of sil.saved) { o.visible = vis; o.material = mat; }
          scene.background = sil.bg;
          scene.fog = sil.fog;
          sil = null;
          return false;
        }
        return !!sil;
      },
    };
  }

  // ---------- 尺寸 ----------
  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // ---------- 交互提示 ----------
  const hint = host.querySelector('.hint');
  let hintDismissed = false;
  function dismissHint() {
    if (hintDismissed || !hint) return;
    hintDismissed = true;
    hint.classList.add('is-hidden');
  }
  canvas.addEventListener('pointerdown', dismissHint, { once: false });
  canvas.addEventListener('wheel', dismissHint, { once: false });

  // ---------- 渲染循环（可见性感知，切走就停）----------
  const clock = new THREE.Clock();
  let rafId = null;
  let running = false;

  function frame() {
    if (!running) return;
    const t = clock.getElapsedTime() * 1000;
    updateScene(t);
    controls.update();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    clock.start();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }
  document.addEventListener('visibilitychange', onVisibility);

  // ---------- 加载覆盖层：首帧完成后淡出 ----------
  const loading = renderLoading(host, 8000);
  requestAnimationFrame(() => {
    start();
    // 至少渲染一帧再撤掉加载态
    requestAnimationFrame(() => loading.done());
  });

  // ---------- 卸载 ----------
  function dispose() {
    stop();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('pointerdown', dismissHint);
    canvas.removeEventListener('wheel', dismissHint);
    controls.dispose();
    built.dispose?.();   // 场景级资源（含 Points / 动态对象）由各场景自清
    scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      }
    });
    renderer.dispose();
    envRT?.dispose();
    canvas.remove();
  }

  // P0 修复：必须返回句柄供页面做射线拾取（spec §12.9 第 9 条）。
  // 缺这行会导致 cast 页 sceneRef/canvas 为 null 且全程静默（可选链吞掉）。
  return { scene, camera, canvas, controls, dispose };
}
