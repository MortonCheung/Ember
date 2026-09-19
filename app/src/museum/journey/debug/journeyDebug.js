/* ============================================================
   journeyDebug.js — ?debug=1#/journey 的导演台与自动验收接口

   升级点（相对旧白盒）：
     __liaoji.currentShot()     当前镜头
     __liaoji.listShots()       全片镜头表
     __liaoji.shotState()       镜头 + localT + Camera + Env 读数
     __liaoji.setShot(id, t)    直接定位到某个镜头的某个时刻
     __liaoji.shotContinuity()  非硬切镜头之间的位置连续性体检
     __liaoji.showPaths()       一次画出全片 Position / Target 两条路径
     __liaoji.fushunComposition() 抚顺最终构图读数（本轮必须人工验收的镜头）
   ============================================================ */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SHOTS } from '../storyboard.js';
import { CinematicDirector } from '../CinematicDirector.js';
import { samplePath } from '../CameraRig.js';

function disposeGroup(group) {
  if (!group) return;
  const geometries = new Set();
  const materials = new Set();
  group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const source = Array.isArray(object.material) ? object.material : [object.material];
    source.forEach((material) => material && materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  group.removeFromParent();
}

function vec(path, t) {
  const out = new THREE.Vector3();
  samplePath(path, t, out);
  return out;
}

/** 全片镜头的 Position（青）+ Target（橙）两条路径，一次画完。 */
function buildStoryboardPaths(experience) {
  const group = new THREE.Group();
  group.name = 'debug_shot_paths';
  const SAMPLES = 10;
  const posPoints = [];
  const targetPoints = [];
  const dotGeo = new THREE.SphereGeometry(0.5, 8, 6);
  const dotMatCut = new THREE.MeshBasicMaterial({ color: 0xff5a5a, depthTest: false });
  const dotMatLink = new THREE.MeshBasicMaterial({ color: 0x8affc0, depthTest: false });

  for (const shot of SHOTS) {
    const paths = experience.cameraRig.getPaths(shot);
    for (let i = 0; i < SAMPLES; i += 1) {
      posPoints.push(vec(paths.position, i / SAMPLES), vec(paths.position, (i + 1) / SAMPLES));
      targetPoints.push(vec(paths.target, i / SAMPLES), vec(paths.target, (i + 1) / SAMPLES));
    }
    const dot = new THREE.Mesh(dotGeo, shot.cut ? dotMatCut : dotMatLink);
    dot.name = `debug_shot_start_${shot.id}`;
    dot.position.copy(vec(paths.position, 0));
    dot.renderOrder = 30;
    group.add(dot);
  }

  const posLine = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(posPoints),
    new THREE.LineBasicMaterial({ color: 0x42d7ff, depthTest: false }),
  );
  posLine.name = 'debug_paths_position';
  const targetLine = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(targetPoints),
    new THREE.LineBasicMaterial({ color: 0xff9a4a, depthTest: false }),
  );
  targetLine.name = 'debug_paths_target';
  posLine.renderOrder = 29;
  targetLine.renderOrder = 29;
  group.add(posLine, targetLine);
  return group;
}

/** 非硬切镜头之间必须首尾相接。这把「分镜表写错了」变成一条可复现读数。 */
function shotContinuity(experience, threshold) {
  const rows = [];
  for (let i = 0; i < SHOTS.length - 1; i += 1) {
    const current = SHOTS[i];
    const next = SHOTS[i + 1];
    const currentPaths = experience.cameraRig.getPaths(current);
    const nextPaths = experience.cameraRig.getPaths(next);
    const positionGap = vec(currentPaths.position, 1).distanceTo(vec(nextPaths.position, 0));
    const targetGap = vec(currentPaths.target, 1).distanceTo(vec(nextPaths.target, 0));
    const gap = Math.max(positionGap, targetGap);
    rows.push({
      from: current.id,
      to: next.id,
      cut: Boolean(next.cut),
      positionGap,
      targetGap,
      ok: Boolean(next.cut) || gap <= threshold,
    });
  }
  return rows;
}

export function createJourneyDebug(experience) {
  if (!new URLSearchParams(location.search).has('debug')) return { dispose() {} };

  const pathGroup = buildStoryboardPaths(experience);
  pathGroup.visible = false;
  experience.scene.add(pathGroup);

  const api = {
    state() {
      const state = experience.state;
      const frame = experience.state.frame;
      return {
        mode: state.mode,
        rawProgress: state.rawProgress,
        visualProgress: state.visualProgress,
        chapter: state.chapter,
        shotId: frame?.shot?.id ?? null,
        localT: frame?.localT ?? null,
        discoverableExhibitId: state.discoverableExhibitId,
        exploringExhibitId: state.exploringExhibitId,
        savedProgress: state.savedProgress,
        savedScrollY: state.savedScrollY,
      };
    },
    info() {
      return {
        calls: experience.renderer.info.render.calls,
        triangles: experience.renderer.info.render.triangles,
        geometries: experience.renderer.info.memory.geometries,
        textures: experience.renderer.info.memory.textures,
      };
    },
    camera() {
      return {
        position: experience.camera.position.toArray(),
        target: experience.controls.target.toArray(),
        fov: experience.camera.fov,
      };
    },
    currentShot() {
      return experience.director?.state?.shot?.id ?? null;
    },
    listShots() {
      return experience.director?.listShots() ?? [];
    },
    shotState() {
      return experience.director?.shotState() ?? null;
    },
    setShot(shotId, localT = 0.5) {
      const progress = CinematicDirector.progressOf(shotId, localT);
      if (progress === null) return null;
      experience.setProgress(progress);
      return experience.director?.shotState() ?? null;
    },
    shotContinuity(threshold = 0.6) {
      return shotContinuity(experience, threshold);
    },
    setProgress(progress) {
      return experience.setProgress(progress);
    },
    enterExhibit(id) {
      return experience.enterExplore(id);
    },
    exitExplore() {
      return experience.exitExplore();
    },
    showPaths(visible = true) {
      pathGroup.visible = Boolean(visible);
      return pathGroup.visible;
    },
    /** 从真实 window.scrollY 重新同步一次进度。
        走的是产品自己的路径（JourneyController.syncFromScroll），
        也就是 Explore 退出时用的那条 —— 只读 scrollY，不写滚动位置。
        无头环境下 ScrollTrigger 的 ticker 会被节流，需要它兜底。 */
    syncProgress() {
      experience.journeyController?.syncFromScroll(false);
      return experience.journeyController?.rawProgress ?? null;
    },
    /** 把画面推到「当前进度的稳态」。
        阻尼状态（炉温、门、钢板…）在真实浏览器里滚动停下后总会收敛到这个值；
        验收比对一个确定性的稳态，而不是「你读数那一刻恰好追到哪」。
        走 applyProgress（dt=0 → 所有 damp 直达目标），不经过 ScrollTrigger。 */
    settle() {
      const controller = experience.journeyController;
      controller.visualProgress = controller.rawProgress;
      experience.applyProgress(controller.rawProgress);
      return controller.rawProgress;
    },
    /** 手动推帧。
        无头浏览器会把跑了一会儿的页面当作后台标签节流，rAF 与 gsap ticker 停摆，
        ScrollTrigger 的 progress 就冻结在最后一个 tick —— 真实浏览器不会这样。
        自动验收里用它在每次真实滚动之后补几帧，让「真实 scrollY → progress」这条
        链路仍然按真实路径走完。 */
    tick(steps = 8, dt = 1 / 60) {
      const now = performance.now();
      let error = null;
      for (let i = 0; i < steps; i += 1) {
        try {
          ScrollTrigger.update();
          experience.update(now, dt);
          gsap.ticker.tick();
        } catch (caught) {
          // 不能静默吞掉：update 抛异常时世界根本没推进，
          // 而断言读的仍是纯函数算出来的值，会得到「一切正常」的假象。
          error = String((caught && caught.stack) || caught);
          break;
        }
      }
      return { shot: experience.state.frame?.shot?.id ?? null, error };
    },
    /** 跨章节关键状态（门开度、列车位置、炉温、卡车位置、电铲循环…）
        用于证明反向滚动时动画不崩坏。 */
    worldState() {
      return experience.world?.probe?.() ?? null;
    },
    /** 拾取画面中心（或指定 NDC 坐标）的物体，定位“这挡住画面的是什么”。 */
    pickCenter(ndcX = 0, ndcY = 0) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), experience.camera);
      const hits = raycaster.intersectObjects(experience.world.root.children, true);
      return hits.slice(0, 6).map((hit) => ({
        name: hit.object.name,
        parent: hit.object.parent?.name ?? null,
        distance: hit.distance,
        point: hit.point.toArray().map((v) => Math.round(v * 100) / 100),
      }));
    },
    /** 抚顺最终构图：相机高度、仰角、工人占屏高度比 —— 本轮必须人工验收的镜头 */
    fushunComposition() {
      const worker = experience.world?.heroWorker?.root;
      if (!worker) return null;
      const box = new THREE.Box3().setFromObject(worker);
      const camera = experience.camera;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const distance = camera.position.distanceTo(center);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const pitchDeg = THREE.MathUtils.radToDeg(Math.asin(
        THREE.MathUtils.clamp(direction.y, -1, 1),
      ));
      const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      return {
        cameraY: camera.position.y,
        workerHeight: size.y,
        distance,
        pitchDeg,
        heightCoverage: size.y / visibleHeight,
      };
    },
    heroFrame(id) {
      if (!experience.available) return null;
      const entry = experience.world.interactables.get(id);
      if (!entry) return null;
      const width = experience.host.clientWidth;
      const height = experience.host.clientHeight;
      const camera = experience.camera;
      const vertex = new THREE.Vector3();
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      let behind = false;
      let sampled = 0;
      // 只判断机器本体：标注引线、标签板、切屑粒子都是附属物，
      // 把它们算进包围盒会让「是否入镜」永远不成立。
      const roots = entry.pickTargets?.length ? entry.pickTargets : [entry.root];
      entry.root.updateWorldMatrix(true, true);
      const visit = (node) => {
        if (!node.visible) return;
        if (node.isMesh && node.geometry) {
          const position = node.geometry.getAttribute('position');
          if (position) {
            const stride = Math.max(1, Math.floor(position.count / 240));
            for (let i = 0; i < position.count; i += stride) {
              vertex.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld).project(camera);
              // 视锥外（相机背后 / 越过远裁面）与退化投影都不参与取景读数：
              // 它们的屏幕坐标会是 ±Infinity，会把包围盒整个撑爆。
              if (vertex.z < -1 || vertex.z > 1) {
                behind = true;
                continue;
              }
              if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y)) continue;
              const screenX = (vertex.x * 0.5 + 0.5) * width;
              const screenY = (-vertex.y * 0.5 + 0.5) * height;
              left = Math.min(left, screenX);
              right = Math.max(right, screenX);
              top = Math.min(top, screenY);
              bottom = Math.max(bottom, screenY);
              sampled += 1;
            }
          }
        }
        node.children.forEach(visit);
      };
      roots.forEach(visit);
      if (!sampled) return null;
      return {
        width, height, left, top, right, bottom, sampled,
        coverage: ((right - left) / width) * ((bottom - top) / height),
        inside: !behind && left >= 0 && top >= 0 && right <= width && bottom <= height,
      };
    },
  };

  window.__liaoji = api;
  return {
    dispose() {
      if (window.__liaoji === api) delete window.__liaoji;
      disposeGroup(pathGroup);
    },
  };
}
