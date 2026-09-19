/* ============================================================
   Experience.js — 《辽迹》单场景运行时总控制器
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { detectWebGL } from '../scene/fallback.js';
import { JourneyMap } from './JourneyMap.js';
import { JourneyController } from './JourneyController.js';
import { CameraRig } from './CameraRig.js';
import { buildWhiteboxMuseum } from './world/buildWhiteboxMuseum.js';
import { JourneyOverlay } from './ui/JourneyOverlay.js';
import { JOURNEY_SEGMENTS } from './data/journey-data.js';

export class Experience {
  constructor({ root, host, scrollTrack, overlay }) {
    this.root = root;
    this.host = host;
    this.scrollTrack = scrollTrack;
    this.overlay = overlay;
    this.running = false;
    this.rafId = null;
    this.lastTime = 0;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.state = {
      mode: 'journey',
      rawProgress: 0,
      visualProgress: 0,
      pathT: 0,
      chapter: null,
    };

    const capability = detectWebGL();
    if (!capability.ok) {
      this.renderFallback();
      this.available = false;
      return;
    }

    this.available = true;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = capability.level === 'webgl2';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x14171a, 1);

    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('aria-label', '辽迹连续数字博物馆；上下滑动沿策展路线参观');
    this.host.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x14171a);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300);
    this.camera.position.set(0, 1.65, 42);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1.65, 30);
    this.controls.update();

    this.world = buildWhiteboxMuseum(this.scene);
    this.scene.add(this.world.group);
    this.journeyMap = new JourneyMap(JOURNEY_SEGMENTS);
    this.cameraRig = new CameraRig(this.camera, this.controls);
    this.journeyController = new JourneyController({
      scrollTrack: this.scrollTrack,
      reducedMotion: this.reducedMotion,
    });
    this.journeyOverlay = new JourneyOverlay(this.overlay);
    this.cameraRig.applyJourneyPose(0, 0);

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.host);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.resize();
  }

  start() {
    if (!this.available || this.running) return;
    this.journeyController.start();
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  frame(time) {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(time, dt);
    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.frame);
  }

  update(time, dt) {
    const progress = this.journeyController.update(dt);
    const pathT = this.journeyMap.toPathT(progress);
    this.cameraRig.applyJourneyPose(pathT, progress);
    this.world.update(time, progress);
    this.state.rawProgress = this.journeyController.rawProgress;
    this.state.visualProgress = progress;
    this.state.pathT = pathT;
    this.state.chapter = this.journeyOverlay.update(progress);
  }

  resize() {
    if (!this.available) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = width < height ? 58 : 52;
    this.camera.updateProjectionMatrix();
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  renderFallback() {
    const fallback = document.createElement('div');
    fallback.className = 'liaoji-fallback';
    fallback.innerHTML = `
      <h2>当前浏览器无法开启三维参观</h2>
      <p>请使用最新版 Chrome、Edge 或 Safari。现有图文展馆仍可继续访问。</p>
      <a href="#/">返回首页</a>
    `;
    this.host.appendChild(fallback);
  }

  dispose() {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.journeyController?.dispose();
    this.journeyOverlay?.dispose();
    this.cameraRig?.dispose();
    this.world?.dispose();
    this.renderer?.dispose();
    this.canvas?.remove();
  }
}
