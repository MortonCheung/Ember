/* ============================================================
   textures.js — 程序化贴图（Canvas 生成，零外部依赖）
   依据：spec/SCENE-ASSETS-STEP2.md §3
        spec/VISUAL-REFINE-SPEC.md §2.5（W1：地面粗糙度贴图重写）
   ============================================================ */

import * as THREE from 'three';

/** 项目纪律：禁用 Math.random，一律 sin 哈希（同输入同输出） */
const rnd = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

/**
 * 地面 roughnessMap：**铸铁/钢板地坪**（W1 重写）
 *
 * 铁律（VISUAL-REFINE-SPEC §2.2）：**脏必须有理由、成片、低对比。**
 * 随机小斑 + 高频噪点一律不许出现 —— 旧实现的"14 个随机深色小斑 + ±13 逐像素噪点"
 * 就是"破破烂烂"的两个来源，已整段删除。
 *
 * roughnessMap 语义：越亮越粗糙，越暗越光滑。
 * 材质侧约定：**material.roughness 设 1.0，真实粗糙度完全由本贴图给**
 * （否则两者相乘会得到 0.18 这种不像铸铁的值）。
 *
 * 层（只有这五层）：
 *  ① 基底 107（≈0.42）
 *  ② 板边倒角：距边 0.10 m 内线性升到 148（≈0.58）
 *  ③ 低频斑驳 ±15 灰阶，周期 ≥0.4 板宽，**每块板最多 1 处**
 *  ④ 高频噪点 ±4 —— 先在 size/2 生成再放大 2×（2 cm 颗粒 → 4 cm，读作"颗粒"而非"彩噪"）
 *  ⑤ 大范围磨损：**只 3 处**，半径 ≥1.5 板宽（7.5 m），alpha ≤0.12，**坐标写死**
 *
 * @param {{size?:number, plates?:number}} [opts] size 输出边长（512）；plates 恒 1（1 tile = 1 块板）
 * @returns {THREE.CanvasTexture} —— **repeat 由调用方按尺寸设置**（repeat = W/5, D/5），函数内不再写死
 */
export function makeFloorRoughnessMap({ size = 512, plates = 1 } = {}) {
  void plates;                        // 保留参数：将来要"1 tile = N 板"时不改调用方
  const work = Math.max(64, Math.round(size / 2));   // 先在 size/2 上生成（高频层尺度 ×2）
  const mPerTile = 5.0;               // 1 tile = 1 块板 = 5.0 m（与调用方 repeat 口径一致）
  const pxPerM = work / mPerTile;

  const c = document.createElement('canvas');
  c.width = c.height = work;
  // willReadFrequently：本函数对画布做多次 getImageData/putImageData（Chrome 会因此
  // 刷 console warning，污染"console 零报错"门禁），显式声明走 CPU 后备。
  const ctx = c.getContext('2d', { willReadFrequently: true });

  // ---- ① 基底 107 ----
  ctx.fillStyle = 'rgb(107,107,107)';
  ctx.fillRect(0, 0, work, work);

  // ---- ③ 低频斑驳（每块板最多 1 处；周期 ≥0.4 板宽；±15）----
  {
    const cx = work * 0.62, cy = work * 0.34, r = work * 0.46;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(122,122,122,0.55)');     // +15
    g.addColorStop(0.55, 'rgba(100,100,100,0.30)');  // −7
    g.addColorStop(1, 'rgba(107,107,107,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, work, work);
  }

  // ---- ⑤ 大范围磨损：只 3 处，坐标写死，成片低对比（沿作业通道）----
  {
    const wear = [
      [work * 0.18, work * 0.30, 1.5],   // 作业通道 A
      [work * 0.72, work * 0.66, 1.7],   // 作业通道 B
      [work * 0.44, work * 0.94, 1.5],   // 通道交汇
    ];
    for (const [wx, wy, k] of wear) {
      const r = k * work;                      // ≥1.5 板宽 = 7.5 m
      const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, r);
      g.addColorStop(0, 'rgba(74,74,74,0.12)');   // alpha ≤0.12，低对比
      g.addColorStop(0.7, 'rgba(88,88,88,0.06)');
      g.addColorStop(1, 'rgba(107,107,107,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, work, work);
    }
  }

  // ---- ④ 高频噪点 ±4（逐像素，sin 哈希）----
  {
    const img = ctx.getImageData(0, 0, work, work);
    const d = img.data;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const n = (rnd(p * 0.6180339887) - 0.5) * 8;   // ±4
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = d[i];
      d[i + 2] = d[i];
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---- ② 板边倒角：距边 0.10 m 内线性升到 148 ----
  {
    const band = Math.max(1, Math.round(0.10 * pxPerM));
    const img = ctx.getImageData(0, 0, work, work);
    const d = img.data;
    const W2 = work;
    for (let y = 0; y < work; y++) {
      for (let x = 0; x < work; x++) {
        const dist = Math.min(x, y, W2 - 1 - x, W2 - 1 - y);
        if (dist >= band) continue;
        const t = 1 - dist / band;               // 边缘 1 → 内侧 0
        const target = 107 + (148 - 107) * t;
        const i = (y * W2 + x) * 4;
        const v = Math.round(d[i] * (1 - t) + target * t);
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---- 放大 2× 回原尺寸：噪点 2 cm → 4 cm（平滑插值，读作颗粒而非噪点）----
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(c, 0, 0, size, size);

  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // ⚠️ repeat 不再在此写死 —— 由调用方按 §2.3 公式 repeat = (W/5, D/5) 设置
  return tex;
}

/**
 * 黄黑斜纹警示贴图（工业安全标识）
 * ⚠️ W1 §2.7：本贴图**全场景只许 1 张**，各段重复次数由缩放几何 UV 实现（调用方负责）。
 */
export function makeHazardTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#C9A227';          // 做旧黄，不刺眼
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#1F242B';
  const stripe = size / 4;
  ctx.save();
  ctx.translate(-size / 2, 0);
  ctx.rotate(0);
  for (let x = -size; x < size * 2; x += stripe * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripe, 0);
    ctx.lineTo(x + stripe - size, size);
    ctx.lineTo(x - size, size);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 做旧：撒一层半透明噪点（sin 哈希，禁 Math.random）
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const n = (rnd(p * 0.7548776662 + 17) - 0.5) * 30;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
