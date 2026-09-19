/* ============================================================
   textPlates.js — A 类文字：空间内展陈文字（约占全部文字的 70~80%）

   这些文字不是 Overlay，它们是建筑的一部分：
   依附于墙面、钢板、柱子、工业铭牌、设备。
   用户继续滚动时，它们随着 Camera 前进自然进入和离开画面。
   ============================================================ */

import * as THREE from 'three';

const FONT_STACK = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function finishTexture(canvas, builder) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  builder.textures = builder.textures ?? new Set();
  builder.textures.add(texture);
  return texture;
}

/**
 * 墙面大字 / 刷漆标语。透明底，字直接落在墙面上。
 */
export function createWallText(builder, {
  name,
  text,
  sub = null,
  position,
  rotation = [0, 0, 0],
  width = 8,
  height = 3,
  color = '#efe7d8',
  subColor = 'rgba(239,231,216,.62)',
  align = 'left',
  fontSize = 150,
  subSize = 54,
  tracking = 0,
  opacity = 0.92,
}) {
  const pxPerUnit = 128;
  const canvas = makeCanvas(Math.round(width * pxPerUnit), Math.round(height * pxPerUnit));
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;

  const padX = align === 'left' ? 40 : canvas.width - 40;
  const baseY = sub ? canvas.height * 0.38 : canvas.height * 0.5;

  ctx.font = `500 ${fontSize}px ${FONT_STACK}`;
  ctx.fillStyle = color;
  if (tracking) {
    // 手动字距：Canvas 的 letterSpacing 支持不一致，逐字绘制最稳。
    let cursor = align === 'left' ? padX : padX;
    const chars = [...text];
    if (align === 'right') {
      const total = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width + tracking, 0);
      cursor = padX - total + tracking;
    }
    chars.forEach((ch) => {
      ctx.fillText(ch, cursor, baseY);
      cursor += ctx.measureText(ch).width + tracking;
    });
  } else {
    ctx.fillText(text, padX, baseY);
  }

  if (sub) {
    ctx.font = `400 ${subSize}px ${FONT_STACK}`;
    ctx.fillStyle = subColor;
    ctx.fillText(sub, padX, canvas.height * 0.72);
  }

  const texture = finishTexture(canvas, builder);
  const geometry = new THREE.PlaneGeometry(width, height);
  builder.geometries.add(geometry);
  const material = builder.own(new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.FrontSide,
  }));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.renderOrder = 3;
  builder.group.add(mesh);
  return mesh;
}

/**
 * 工业铭牌：深色底 + 浅色字 + 边框。用于设备、门框、柱子上的小字标识。
 */
export function createNameplate(builder, {
  name,
  title,
  lines = [],
  position,
  rotation = [0, 0, 0],
  width = 1.6,
  height = 0.9,
  accent = '#e8663c',
}) {
  const pxPerUnit = 320;
  const canvas = makeCanvas(Math.round(width * pxPerUnit), Math.round(height * pxPerUnit));
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#14171a';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(239,231,216,.34)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.fillStyle = accent;
  ctx.fillRect(24, 26, 6, H - 52);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#efe7d8';
  ctx.font = `600 ${Math.round(H * 0.24)}px ${FONT_STACK}`;
  ctx.fillText(title, 48, H * 0.34);

  ctx.fillStyle = 'rgba(239,231,216,.6)';
  ctx.font = `400 ${Math.round(H * 0.15)}px ${FONT_STACK}`;
  lines.forEach((line, index) => {
    ctx.fillText(line, 48, H * (0.6 + index * 0.19));
  });

  const texture = finishTexture(canvas, builder);
  const geometry = new THREE.PlaneGeometry(width, height);
  builder.geometries.add(geometry);
  const material = builder.own(new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.renderOrder = 3;
  builder.group.add(mesh);
  return mesh;
}

/**
 * C 类文字：Hero 动态标注的标签端（细线 + 端点 + 短标签）。
 * 参考工业工程图的引线标注，只在 C620-1 与高炉内部这类重点交互中出现。
 */
export function createCallout(builder, {
  name,
  label,
  position,
  rotation = [0, 0, 0],
  width = 1.5,
  height = 0.42,
  accent = '#e8663c',
}) {
  const pxPerUnit = 320;
  const canvas = makeCanvas(Math.round(width * pxPerUnit), Math.round(height * pxPerUnit));
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#efe7d8';
  ctx.font = `500 ${Math.round(H * 0.52)}px ${FONT_STACK}`;
  ctx.fillText(label, 12, H * 0.5);
  ctx.fillStyle = accent;
  ctx.fillRect(0, H * 0.42, 4, H * 0.16);

  const texture = finishTexture(canvas, builder);
  const geometry = new THREE.PlaneGeometry(width, height);
  builder.geometries.add(geometry);
  const material = builder.own(new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  }));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.renderOrder = 6;
  builder.group.add(mesh);
  return mesh;
}
