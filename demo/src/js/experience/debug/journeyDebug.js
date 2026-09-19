/* ============================================================
   journeyDebug.js — ?debug=1#/journey 调试与自动验收接口
   ============================================================ */

import * as THREE from 'three';
import { CAMERA_POINTS, EXHIBITS } from '../data/journey-data.js';

function disposeGroup(group) {
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

function buildPathGroup(experience) {
  const group = new THREE.Group();
  group.name = 'debug_camera_path';
  const points = experience.cameraRig.positionCurve.getSpacedPoints(180);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x42d7ff, depthTest: false }),
  );
  line.renderOrder = 20;
  group.add(line);

  const geometry = new THREE.SphereGeometry(.16, 10, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false });
  CAMERA_POINTS.forEach((point, index) => {
    const marker = new THREE.Mesh(geometry, material);
    marker.name = `debug_path_point_${index}`;
    marker.position.set(...point);
    marker.renderOrder = 21;
    group.add(marker);
  });
  return group;
}

function buildZonesGroup(experience) {
  const group = new THREE.Group();
  group.name = 'debug_exhibit_zones';
  const colors = [0x69e3ff, 0xff9654, 0xa9df77];

  EXHIBITS.forEach((exhibit, index) => {
    const color = colors[index];
    const anchor = new THREE.Vector3(...exhibit.anchor);
    const explorePosition = new THREE.Vector3(...exhibit.explorePose.position);
    const exploreTarget = new THREE.Vector3(...exhibit.explorePose.target);
    const startT = experience.journeyMap.toPathT(exhibit.activationRange[0]);
    const endT = experience.journeyMap.toPathT(exhibit.activationRange[1]);
    const zonePoints = [];
    for (let i = 0; i <= 30; i += 1) {
      zonePoints.push(experience.cameraRig.positionCurve.getPointAt(
        THREE.MathUtils.lerp(startT, endT, i / 30),
      ));
    }
    const zoneLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(zonePoints),
      new THREE.LineBasicMaterial({ color, linewidth: 2, depthTest: false }),
    );
    zoneLine.name = `debug_zone_${exhibit.id}`;
    zoneLine.renderOrder = 22;
    group.add(zoneLine);

    const anchorMarker = new THREE.Mesh(
      new THREE.SphereGeometry(.34, 12, 8),
      new THREE.MeshBasicMaterial({ color, depthTest: false }),
    );
    anchorMarker.name = `debug_anchor_${exhibit.id}`;
    anchorMarker.position.copy(anchor);
    anchorMarker.renderOrder = 23;
    group.add(anchorMarker);

    const poseMarker = new THREE.Mesh(
      new THREE.ConeGeometry(.28, .65, 8),
      new THREE.MeshBasicMaterial({ color, wireframe: true, depthTest: false }),
    );
    poseMarker.name = `debug_explore_pose_${exhibit.id}`;
    poseMarker.position.copy(explorePosition);
    poseMarker.lookAt(exploreTarget);
    poseMarker.renderOrder = 23;
    group.add(poseMarker);

    const sightLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([explorePosition, exploreTarget]),
      new THREE.LineDashedMaterial({ color, dashSize: .35, gapSize: .2, depthTest: false }),
    );
    sightLine.computeLineDistances();
    sightLine.renderOrder = 22;
    group.add(sightLine);
  });
  return group;
}

export function createJourneyDebug(experience) {
  if (!new URLSearchParams(location.search).has('debug')) return { dispose() {} };

  const pathGroup = buildPathGroup(experience);
  const zonesGroup = buildZonesGroup(experience);
  pathGroup.visible = false;
  zonesGroup.visible = false;
  experience.scene.add(pathGroup, zonesGroup);

  const api = {
    state() {
      const state = experience.state;
      return {
        mode: state.mode,
        rawProgress: state.rawProgress,
        visualProgress: state.visualProgress,
        pathT: state.pathT,
        chapter: state.chapter,
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
    heroFrame(id) {
      if (!experience.available) return null;
      const entry = experience.world.exhibits.get(id);
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
      // 用真实顶点而不是 Box3 的八个角：圆柱／长臂的轴对齐包围盒远大于可见轮廓，
      // 拿它做取景判据会一直误报裁切。
      entry.root.updateWorldMatrix(true, true);
      entry.root.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        const position = object.geometry.getAttribute('position');
        if (!position) return;
        const stride = Math.max(1, Math.floor(position.count / 240));
        for (let i = 0; i < position.count; i += stride) {
          vertex.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).project(camera);
          if (vertex.z < -1 || vertex.z > 1) behind = true;
          const screenX = (vertex.x * .5 + .5) * width;
          const screenY = (-vertex.y * .5 + .5) * height;
          left = Math.min(left, screenX);
          right = Math.max(right, screenX);
          top = Math.min(top, screenY);
          bottom = Math.max(bottom, screenY);
          sampled += 1;
        }
      });
      if (!sampled) return null;
      return {
        width,
        height,
        left,
        top,
        right,
        bottom,
        sampled,
        coverage: ((right - left) / width) * ((bottom - top) / height),
        inside: !behind && left >= 0 && top >= 0 && right <= width && bottom <= height,
      };
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
    showPath(visible = true) {
      pathGroup.visible = Boolean(visible);
      return pathGroup.visible;
    },
    showZones(visible = true) {
      zonesGroup.visible = Boolean(visible);
      return zonesGroup.visible;
    },
  };

  window.__liaoji = api;
  return {
    dispose() {
      if (window.__liaoji === api) delete window.__liaoji;
      disposeGroup(pathGroup);
      disposeGroup(zonesGroup);
    },
  };
}
