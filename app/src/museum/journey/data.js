/* ============================================================
   data.js — 《辽迹》路线、章节与展品的单一数据源
   ============================================================ */

export const CAMERA_POINTS = [
  [0, 1.65, 42],
  [0, 1.65, 34],
  [0, 1.65, 27],
  [0, 1.65, 18],
  [-6, 1.65, 12],
  [-7, 1.65, 6],
  [-8, 1.65, -8],
  [-6, 1.65, -15],
  [0, 1.65, -20],
  [5, 1.65, -25],
  [3.5, 1.65, -34],
  [3.5, 1.65, -46],
  [6, 1.45, -54],
  [0, 1.15, -59],
  [-6, 0.9, -65],
  [-6.4, 0.75, -73],
  [-6.4, 0.75, -84],
  [-6, 1.0, -93],
  [0, 1.4, -100],
  [0, 1.65, -110],
];

export const JOURNEY_SEGMENTS = [
  { id: 'intro', journey: [0.00, 0.07], path: [0.00, 0.025] },
  { id: 'entrance', journey: [0.07, 0.18], path: [0.025, 0.16] },
  { id: 'shenyang', journey: [0.18, 0.42], path: [0.16, 0.37] },
  { id: 'transition-a', journey: [0.42, 0.50], path: [0.37, 0.48] },
  { id: 'anshan', journey: [0.50, 0.70], path: [0.48, 0.68] },
  { id: 'transition-b', journey: [0.70, 0.78], path: [0.68, 0.77] },
  { id: 'fushun', journey: [0.78, 0.93], path: [0.77, 0.92] },
  { id: 'finale', journey: [0.93, 1.00], path: [0.92, 1.00] },
];

export const CHAPTERS = [
  { id: 'shenyang', number: '01', title: '沈阳 · 机器', range: [0.18, 0.42] },
  { id: 'anshan', number: '02', title: '鞍山 · 钢铁', range: [0.50, 0.70] },
  { id: 'fushun', number: '03', title: '抚顺 · 能源', range: [0.78, 0.93] },
  { id: 'finale', number: '终章', title: '把炉火带向明天', range: [0.93, 1.00] },
];

export const EXHIBITS = [
  {
    id: 'lathe',
    objectName: 'proxy_lathe',
    portraitDolly: 0.3,
    activationRange: [0.27, 0.37],
    cue: 'explode-peek',
    anchor: [-16, 1.4, -3],
    explorePose: {
      position: [-7.5, 3.0, 3.0],
      target: [-16, 1.25, -3],
      minDistance: 5,
      maxDistance: 12,
      minPolarAngle: 0.55,
      maxPolarAngle: 1.48,
    },
  },
  {
    id: 'furnace',
    objectName: 'proxy_furnace',
    portraitDolly: 2,
    activationRange: [0.56, 0.67],
    cue: 'glow',
    anchor: [16, 5.0, -40],
    explorePose: {
      position: [3.5, 6.5, -26],
      target: [16, 5.2, -40],
      minDistance: 10,
      maxDistance: 22,
      minPolarAngle: 0.45,
      maxPolarAngle: 1.5,
    },
  },
  {
    id: 'mine',
    objectName: 'proxy_mine',
    portraitDolly: 1.8,
    activationRange: [0.81, 0.89],
    cue: 'scan',
    anchor: [-16, 1.4, -80],
    explorePose: {
      position: [-8.5, 2.5, -73],
      target: [-16, 1.0, -80],
      minDistance: 5,
      maxDistance: 12,
      minPolarAngle: 0.5,
      maxPolarAngle: 1.5,
    },
  },
];

export const LIGHTING_STOPS = [
  { progress: 0.00, background: 0x11171b, ambient: 0xc7d4dc, ground: 0x24272a, key: 0xfff1d9 },
  { progress: 0.18, background: 0x151b20, ambient: 0xbccbd6, ground: 0x252a2d, key: 0xdcecff },
  { progress: 0.50, background: 0x1b1917, ambient: 0xd7c6b4, ground: 0x302824, key: 0xffc48f },
  { progress: 0.70, background: 0x241711, ambient: 0xe2b287, ground: 0x35251d, key: 0xff9a55 },
  { progress: 0.80, background: 0x111713, ambient: 0xaeb9ad, ground: 0x202620, key: 0xc1c8a0 },
  { progress: 0.93, background: 0x171917, ambient: 0xc8c9bd, ground: 0x292824, key: 0xe7d7b9 },
  { progress: 1.00, background: 0x24201b, ambient: 0xd9d3c4, ground: 0x332e27, key: 0xffe6bd },
];
