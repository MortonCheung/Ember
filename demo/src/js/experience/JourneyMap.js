/* ============================================================
   JourneyMap.js — 将滚动进度映射为非匀速 Camera Path 进度
   ============================================================ */

import { MathUtils } from 'three';

export class JourneyMap {
  constructor(segments) {
    this.segments = segments;
  }

  toPathT(progress) {
    const value = MathUtils.clamp(progress, 0, 1);
    const segment = this.segments.find(({ journey }) => value <= journey[1])
      ?? this.segments[this.segments.length - 1];
    const [journeyStart, journeyEnd] = segment.journey;
    const [pathStart, pathEnd] = segment.path;
    const local = journeyEnd === journeyStart
      ? 0
      : (value - journeyStart) / (journeyEnd - journeyStart);
    return MathUtils.lerp(pathStart, pathEnd, MathUtils.clamp(local, 0, 1));
  }

  segmentAt(progress) {
    const value = MathUtils.clamp(progress, 0, 1);
    return this.segments.find(({ journey }) => value >= journey[0] && value <= journey[1])
      ?? this.segments[this.segments.length - 1];
  }
}
