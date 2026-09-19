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
import { ExhibitMarker } from './ui/ExhibitMarker.js';
import { InteractionManager } from './InteractionManager.js';
import { ScrollLock } from './ScrollLock.js';
import { EXHIBITS, JOURNEY_SEGMENTS } from './data/journey-data.js';

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
      discoverableExhibitId: null,
      exploringExhibitId: null,
      savedProgress: null,
      savedScrollY: null,
      savedJourneyPose: null,
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
    this.controls.dampingFactor = .07;
    this.controls.rotateSpeed = .55;
    this.controls.zoomSpeed = .75;
    this.controls.target.set(0, 1.65, 30);
    this.controls.update();

    this.world = buildWhiteboxMuseum(this.scene, { reducedMotion: this.reducedMotion });
    this.scene.add(this.world.group);
    this.journeyMap = new JourneyMap(JOURNEY_SEGMENTS);
    this.cameraRig = new CameraRig(this.camera, this.controls);
    this.journeyController = new JourneyController({
      scrollTrack: this.scrollTrack,
      reducedMotion: this.reducedMotion,
    });
    this.journeyOverlay = new JourneyOverlay(this.overlay);
    this.exhibitMarker = new ExhibitMarker({
      element: this.overlay.querySelector('.liaoji-exhibit-marker'),
      camera: this.camera,
      host: this.host,
      onActivate: (id) => this.interactionManager.enterExplore(id),
    });
    this.interactionManager = new InteractionManager({
      experience: this,
      camera: this.camera,
      canvas: this.canvas,
      exhibits: this.world.exhibits,
      exhibitData: EXHIBITS,
      marker: this.exhibitMarker,
    });
    this.scrollLock = new ScrollLock();
    this.continueButton = this.overlay.querySelector('.liaoji-continue');
    this.onContinue = () => this.exitExplore();
    this.onKeyDown = (event) => {
      if (event.key === 'Escape' && this.state.mode === 'explore') this.exitExplore();
    };
    this.continueButton.addEventListener('click', this.onContinue);
    window.addEventListener('keydown', this.onKeyDown);
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
    const progress = this.state.mode === 'journey'
      ? this.journeyController.update(dt)
      : this.journeyController.visualProgress;
    const pathT = this.journeyMap.toPathT(progress);
    if (this.state.mode === 'journey') this.cameraRig.applyJourneyPose(pathT, progress);
    if (this.state.mode === 'explore') this.controls.update();
    this.world.update(time, progress);
    this.interactionManager.update(progress);
    this.state.rawProgress = this.journeyController.rawProgress;
    this.state.visualProgress = progress;
    this.state.pathT = pathT;
    this.state.chapter = this.journeyOverlay.update(progress);
  }

  setMode(mode) {
    this.state.mode = mode;
    this.root.dataset.mode = mode;
    this.continueButton.hidden = mode !== 'explore';
  }

  getExplorePose(data) {
    const target = new THREE.Vector3(...data.explorePose.target);
    const position = new THREE.Vector3(...data.explorePose.position);
    if (this.host.clientWidth < this.host.clientHeight) {
      position.sub(target).multiplyScalar(1.16).add(target);
      position.y += .35;
    }
    return { position, target };
  }

  async enterExplore(id) {
    if (!this.available || this.state.mode !== 'journey') return false;
    const entry = this.world.exhibits.get(id);
    if (!entry) return false;

    const data = entry.data;
    this.state.savedScrollY = window.scrollY;
    this.state.savedProgress = this.journeyController.rawProgress;
    this.state.savedJourneyPose = this.cameraRig.getCurrentPose();
    this.state.exploringExhibitId = id;
    this.setMode('entering-explore');
    this.journeyController.enabled = false;
    this.controls.enabled = false;
    this.interactionManager.setDiscoverable(null);
    this.scrollLock.lock();

    const completed = await this.cameraRig.animateToPose(this.getExplorePose(data), {
      duration: this.reducedMotion ? .12 : .82,
    });
    if (!completed || this.state.mode !== 'entering-explore') return false;

    this.controls.target.set(...data.explorePose.target);
    this.controls.minDistance = data.explorePose.minDistance;
    this.controls.maxDistance = data.explorePose.maxDistance;
    this.controls.minPolarAngle = data.explorePose.minPolarAngle;
    this.controls.maxPolarAngle = data.explorePose.maxPolarAngle;
    this.controls.enablePan = false;
    this.controls.enabled = true;
    this.controls.update();
    this.setMode('explore');
    return true;
  }

  async exitExplore() {
    if (!this.available || this.state.mode !== 'explore') return false;
    const id = this.state.exploringExhibitId;
    const savedScrollY = this.state.savedScrollY;
    const savedProgress = this.state.savedProgress;
    const savedPose = this.state.savedJourneyPose;
    this.setMode('returning');
    this.controls.enabled = false;

    const completed = await this.cameraRig.animateToPose(savedPose, {
      duration: this.reducedMotion ? .12 : .78,
    });
    if (!completed || this.state.mode !== 'returning') return false;

    this.scrollLock.unlock(savedScrollY);
    this.journeyController.rawProgress = savedProgress;
    this.journeyController.visualProgress = savedProgress;
    this.journeyController.syncFromScroll(false);
    this.journeyController.visualProgress = this.journeyController.rawProgress;
    const restoredProgress = this.journeyController.visualProgress;
    const restoredPathT = this.journeyMap.toPathT(restoredProgress);
    this.cameraRig.applyJourneyPose(restoredPathT, restoredProgress);
    this.journeyController.enabled = true;
    this.state.exploringExhibitId = null;
    this.state.rawProgress = this.journeyController.rawProgress;
    this.state.visualProgress = restoredProgress;
    this.state.pathT = restoredPathT;
    this.setMode('journey');
    this.interactionManager.suppressUntilExitRange(id);
    return true;
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
    this.cameraRig?.stopAnimation();
    this.scrollLock?.forceUnlock();
    this.continueButton?.removeEventListener('click', this.onContinue);
    window.removeEventListener('keydown', this.onKeyDown);
    this.interactionManager?.dispose();
    this.journeyController?.dispose();
    this.journeyOverlay?.dispose();
    this.cameraRig?.dispose();
    this.world?.dispose();
    this.renderer?.dispose();
    this.canvas?.remove();
  }
}
