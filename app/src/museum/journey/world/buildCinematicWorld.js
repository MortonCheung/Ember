/* ============================================================
   buildCinematicWorld.js — 电影世界的总装

   只做三件事：
   1. 把六个章节 Set 装进同一个 Scene（单 Canvas / 单 Scene 不变）。
   2. 按当前 Shot 决定哪些章节在场（可见性裁剪，控制 draw call）。
   3. 把 CinematicDirector 的 frame 分发给对应章节的运动控制器。

   它不决定任何镜头 —— 那是 storyboard + CinematicDirector 的事。
   ============================================================ */

import * as THREE from 'three';
import { CHAPTERS } from '../storyboard.js';
import { CinematicLighting } from './CinematicLighting.js';
import { buildOpeningSet } from './sets/buildOpeningSet.js';
import { buildShenyangSet } from './sets/buildShenyangSet.js';
import { buildRailSet } from './sets/buildRailSet.js';
import { buildAnshanSet } from './sets/buildAnshanSet.js';
import { buildRoadSet } from './sets/buildRoadSet.js';
import { buildFushunSet } from './sets/buildFushunSet.js';

const CHAPTER_ORDER = CHAPTERS.map((chapter) => chapter.id);

/** 当前 Shot 需要哪些章节在场：默认是本章节 + 相邻章节（cut 时不闪空）。 */
function stagesFor(shot) {
  if (Array.isArray(shot.stage)) return shot.stage;
  const index = CHAPTER_ORDER.indexOf(shot.chapter);
  if (index < 0) return [shot.chapter];
  return CHAPTER_ORDER.filter((_, k) => Math.abs(k - index) <= 1);
}

export function buildCinematicWorld(scene, renderer, { reducedMotion = false } = {}) {
  const root = new THREE.Group();
  root.name = 'cinematic_world';
  scene.add(root);

  const sets = [
    buildOpeningSet({ reducedMotion }),
    buildShenyangSet({ reducedMotion }),
    buildRailSet({ reducedMotion }),
    buildAnshanSet({ reducedMotion }),
    buildRoadSet({ reducedMotion }),
    buildFushunSet({ reducedMotion }),
  ];
  sets.forEach((set) => root.add(set.group));

  const byChapter = new Map(sets.map((set) => [set.id, set]));
  const lighting = new CinematicLighting(scene, renderer);

  /* 跨章节共享对象：鞍山 AS-08 要用 Road Set 的卡车完成「钢板 → 车辆」。 */
  const shared = { truck: byChapter.get('road').parts.truck };

  /* 可交互对象注册表。交互的区间写在 storyboard 的 shot.interactive 上，
     这里只提供「怎么进入、进去之后动哪些部件」。 */
  const shenyang = byChapter.get('shenyang').parts;
  const interactables = new Map([
    ['lathe', {
      id: 'lathe',
      root: shenyang.lathe.root,
      pickTargets: shenyang.lathe.pickTargets,
      anchor: [-9.6, 1.6, -104],
      label: '触碰机器',
      // 进入 Hero 的机位也是导演好的：固定进入镜头，进去之后才允许少量局部观察。
      explorePose: {
        position: [-6.2, 3.0, -96.5],
        target: [-9.6, 1.5, -104],
        minDistance: 4.5,
        maxDistance: 12,
        minPolarAngle: 0.35,
        maxPolarAngle: 1.5,
      },
      playNotice() { /* Notice 由 ShenyangMotion 按 shot 播放，这里保持幂等 */ },
      resetNotice() { shenyang.lathe.reset(); },
      rig: shenyang.lathe,
    }],
    ['bench', {
      id: 'bench',
      root: shenyang.bench.root,
      pickTargets: shenyang.bench.pickTargets,
      anchor: [-6.5, 1.05, -158],
      label: '看看工作台',
      explorePose: {
        position: [-4.4, 1.7, -154.5],
        target: [-6.5, 1.0, -158],
        minDistance: 2.6,
        maxDistance: 7,
        minPolarAngle: 0.5,
        maxPolarAngle: 1.52,
      },
      playNotice() {},
      resetNotice() { shenyang.bench.reset(); },
      rig: shenyang.bench,
    }],
  ]);

  let activeStages = new Set(CHAPTER_ORDER);

  function applyVisibility(shot) {
    const next = new Set(stagesFor(shot));
    if (next.size === activeStages.size && [...next].every((id) => activeStages.has(id))) return;
    activeStages = next;
    sets.forEach((set) => { set.group.visible = activeStages.has(set.id); });
  }

  function update(frame, ctx = {}) {
    applyVisibility(frame.shot);
    lighting.update(frame);
    const context = { ...ctx, shared };
    for (const set of sets) {
      if (!set.group.visible) continue;
      set.update(frame, context);
    }
  }

  /** 强制把某个章节的可见性打开（Debug 定位 / Explore 返回时用）。 */
  function ensureStage(chapterId) {
    const set = byChapter.get(chapterId);
    if (set) set.group.visible = true;
  }

  function dispose() {
    sets.forEach((set) => set.builder.dispose());
    sets.forEach((set) => {
      set.builder.textures?.forEach((texture) => texture.dispose());
    });
    lighting.dispose();
    root.removeFromParent();
  }

  return {
    root,
    sets,
    byChapter,
    lighting,
    interactables,
    shared,
    heroWorker: byChapter.get('fushun').parts.heroWorker,
    update,
    ensureStage,
    dispose,
  };
}
