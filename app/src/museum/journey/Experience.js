/* ============================================================
   Experience.js — 《辽迹》电影运行时总控制器

   职责边界（重要）：
     · JourneyController 只给 0~1 的 scrollY
     · CinematicDirector 把它翻译成 Shot / localT / Camera / Text / Env
     · CameraRig 执行 Shot 写的三条路径（Position / Target / FOV）
     · World 各章节 Set 执行自己的 scroll-linked motion
     · Experience 只做装配与状态机，不决定任何镜头

   状态机：cinematic → entering-explore → explore → returning → cinematic
   任何一帧，Camera 只属于一个系统。
   ============================================================ */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { detectWebGL } from '../../shared/fallback.js';
import { JourneyController } from './JourneyController.js';
import { CameraRig } from './CameraRig.js';
import { CinematicDirector } from './CinematicDirector.js';
import { buildCinematicWorld } from './world/buildCinematicWorld.js';
import { JourneyOverlay } from './ui/JourneyOverlay.js';
import { ExploreConsole } from './ui/ExploreConsole.js';
import { ExhibitMarker } from './ui/ExhibitMarker.js';
import { InteractionManager } from './InteractionManager.js';
import { ScrollLock } from './ScrollLock.js';
import { createJourneyDebug } from './debug/journeyDebug.js';
import { SCROLL_VH } from './storyboard.js';

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
      chapter: null,
      frame: null,
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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = capability.level === 'webgl2';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x0b0d10, 1);

    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('aria-label', '辽迹 · 可触碰的辽宁工业记忆；上下滑动推进这部工业电影');
    this.host.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0d10);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.08, 900);
    this.camera.position.set(0, 1.7, 0.6);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.6;

    // 滚动总时长由分镜权重决定，不靠一个拍脑袋的固定值平均分。
    if (this.scrollTrack) this.scrollTrack.style.height = `${SCROLL_VH}vh`;

    this.world = buildCinematicWorld(this.scene, this.renderer, { reducedMotion: this.reducedMotion });
    this.cameraRig = new CameraRig(this.camera, this.controls);
    this.director = new CinematicDirector({
      cameraRig: this.cameraRig,
      reducedMotion: this.reducedMotion,
    });
    this.journeyController = new JourneyController({
      scrollTrack: this.scrollTrack,
      reducedMotion: this.reducedMotion,
    });
    this.journeyOverlay = new JourneyOverlay(this.overlay);
    this.exhibitMarker = new ExhibitMarker({
      element: this.overlay.querySelector('.liaoji-exhibit-marker'),
      camera: this.camera,
      host: this.host,
      onActivate: (id) => this.enterExplore(id),
    });
    this.exploreConsole = new ExploreConsole({
      element: this.overlay.querySelector('.liaoji-console'),
      onAction: (action) => this.handleConsoleAction(action),
    });
    this.interactionManager = new InteractionManager({
      experience: this,
      camera: this.camera,
      canvas: this.canvas,
      exhibits: this.world.interactables,
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

    this.debug = createJourneyDebug(this);

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.host);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.resize();
    // 先把第 0 帧立起来，避免首帧出现上一页残留的相机位置。
    this.applyProgress(0);
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
    const frame = this.director.update(progress, dt);

    if (this.state.mode === 'journey') this.director.applyCamera(frame);
    if (this.state.mode === 'explore') this.controls.update();

    this.world.update(frame, { time, dt });
    this.interactionManager.update(frame);

    this.state.rawProgress = this.journeyController.rawProgress;
    this.state.visualProgress = progress;
    this.state.frame = frame;
    this.state.chapter = this.journeyOverlay.update(frame);

    const hintId = this.state.mode === 'journey' ? this.state.discoverableExhibitId : null;
    this.journeyOverlay.setHint(
      hintId ? `○ ${this.world.interactables.get(hintId)?.label ?? ''}` : '',
    );
  }

  /** 立即把某个 progress 立起来（初始化 / Debug 定位），不走平滑。 */
  applyProgress(progress) {
    if (!this.available) return null;
    this.director.snap();
    const frame = this.director.update(progress, 0);
    this.director.applyCamera(frame);
    this.world.update(frame, { time: performance.now(), dt: 0 });
    this.interactionManager.update(frame);
    this.state.rawProgress = progress;
    this.state.visualProgress = progress;
    this.state.frame = frame;
    this.state.chapter = this.journeyOverlay.update(frame);
    this.renderer.render(this.scene, this.camera);
    return frame;
  }

  setMode(mode) {
    this.state.mode = mode;
    this.root.dataset.mode = mode;
    this.continueButton.hidden = mode !== 'explore';
  }

  setProgress(progress) {
    if (!this.available || this.state.mode !== 'journey') return false;
    const value = this.journeyController.setProgress(progress, { immediate: true });
    this.applyProgress(value);
    return value;
  }

  getExplorePose(entry) {
    const pose = entry.explorePose;
    if (!pose) return null;
    const position = new THREE.Vector3(...pose.position);
    const target = new THREE.Vector3(...pose.target);
    if (this.host.clientWidth < this.host.clientHeight) {
      position.sub(target).multiplyScalar(1.16).add(target);
      position.y += 0.35;
    }
    // 展开必须在前：explorePose 里的 position / target 是原始数组，
    // 后面要用的是上面构造好的 Vector3，否则会被数组覆盖回去。
    return { ...pose, position, target, fov: this.camera.fov };
  }

  async enterExplore(id) {
    if (!this.available || this.state.mode !== 'journey') return false;
    const entry = this.world.interactables.get(id);
    if (!entry?.explorePose) return false;

    this.state.savedScrollY = window.scrollY;
    this.state.savedProgress = this.journeyController.rawProgress;
    this.state.savedJourneyPose = this.cameraRig.getCurrentPose();
    this.state.exploringExhibitId = id;
    this.setMode('entering-explore');
    this.journeyController.enabled = false;
    this.controls.enabled = false;
    this.interactionManager.setDiscoverable(null);
    this.journeyOverlay.setHint('');
    this.scrollLock.lock();

    const pose = this.getExplorePose(entry);
    const completed = await this.cameraRig.animateToPose(pose, {
      duration: this.reducedMotion ? 0.12 : 0.9,
    });
    if (!completed || this.state.mode !== 'entering-explore') return false;

    this.controls.target.set(...pose.target.toArray());
    this.controls.minDistance = pose.minDistance ?? 3;
    this.controls.maxDistance = pose.maxDistance ?? 12;
    this.controls.minPolarAngle = pose.minPolarAngle ?? 0.4;
    this.controls.maxPolarAngle = pose.maxPolarAngle ?? 1.5;
    this.controls.enablePan = false;
    this.controls.enabled = true;
    this.controls.update();
    this.setMode('explore');

    this.exploreConsole.open(id);
    // C620-1：进入即自动拆解，像一张工业分解图，不是爆炸。
    // 标注先给一半（结构信息的第一步），点具体部件后再升满。
    if (id === 'lathe') {
      this.tweenLatheExplode(1, 1.1);
      const lathe = this.world.interactables.get('lathe')?.rig;
      if (lathe) gsap.to(lathe.state, { anno: 0.55, duration: 1.0, delay: 0.5, ease: 'power2.out' });
    }
    return true;
  }

  tweenLatheExplode(value, duration = 0.9) {
    const lathe = this.world.interactables.get('lathe')?.rig;
    if (!lathe) return;
    gsap.to(lathe.state, { explode: value, duration, ease: 'power2.inOut', overwrite: true });
  }

  handleConsoleAction(action) {
    const id = this.state.exploringExhibitId;
    const rig = this.world.interactables.get(id ?? '')?.rig;
    if (!rig) return;

    switch (action.type) {
      case 'select-part':
        if (id === 'lathe') {
          gsap.to(rig.state, {
            anno: action.value ? 1 : 0.55,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: true,
          });
        }
        break;
      case 'assemble':
        if (id === 'lathe') this.tweenLatheExplode(0, 1.2);
        break;
      case 'start':
        if (id === 'lathe') {
          gsap.to(rig.state, { running: 1, duration: 0.6, ease: 'power2.out', overwrite: true });
        }
        break;
      case 'feed':
        if (id === 'lathe') rig.setFeed(Number(action.value) || 0);
        break;
      case 'drawing':
        if (id === 'bench') {
          gsap.to(rig.state, {
            drawing: Number(action.value) || 0, duration: 0.6, ease: 'power2.out', overwrite: true,
          });
        }
        break;
      case 'caliper':
        if (id === 'bench') {
          gsap.to(rig.state, {
            caliper: Number(action.value) || 0, duration: 0.6, ease: 'power2.out', overwrite: true,
          });
        }
        break;
      case 'exit':
        this.exitExplore();
        break;
      default:
        break;
    }
  }

  async exitExplore() {
    if (!this.available || this.state.mode !== 'explore') return false;
    const id = this.state.exploringExhibitId;
    const savedScrollY = this.state.savedScrollY;
    const savedProgress = this.state.savedProgress;
    const savedPose = this.state.savedJourneyPose;
    const entry = this.world.interactables.get(id);

    this.exploreConsole.close();
    const rig = entry?.rig;
    if (rig) {
      gsap.killTweensOf(rig.state);
      rig.reset?.();
      if (id === 'lathe') {
        rig.state.explode = 0;
        rig.state.running = 0;
        rig.state.feed = 0;
      }
    }

    this.setMode('returning');
    this.controls.enabled = false;

    const completed = await this.cameraRig.animateToPose(savedPose, {
      duration: this.reducedMotion ? 0.12 : 0.82,
    });
    if (!completed || this.state.mode !== 'returning') return false;

    this.scrollLock.unlock(savedScrollY);
    this.journeyController.rawProgress = savedProgress;
    this.journeyController.visualProgress = savedProgress;
    this.journeyController.syncFromScroll(false);
    this.journeyController.visualProgress = this.journeyController.rawProgress;
    this.journeyController.enabled = true;
    this.state.exploringExhibitId = null;
    this.applyProgress(this.journeyController.visualProgress);
    this.setMode('journey');
    this.interactionManager.suppressUntilExitRange(id);
    return true;
  }

  resize() {
    if (!this.available) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const portrait = width < height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // FOV 归分镜管，这里只告诉 Rig 要不要做竖屏补偿。
    this.cameraRig?.setPortrait(portrait);
  }

  onVisibilityChange() {
    if (document.hidden) this.stop();
    else this.start();
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
      <h2>当前浏览器无法开启三维体验</h2>
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
    this.exploreConsole?.dispose();
    this.interactionManager?.dispose();
    this.journeyController?.dispose();
    this.debug?.dispose();
    this.journeyOverlay?.dispose();
    this.cameraRig?.dispose();
    this.world?.dispose();
    this.renderer?.dispose();
    this.canvas?.remove();
  }
}
