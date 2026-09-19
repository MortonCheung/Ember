/* ============================================================
   Experience.js — 《辽迹》单场景运行时总控制器
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { detectWebGL } from '../scene/fallback.js';

export class Experience {
  constructor({ root, host, scrollTrack, overlay }) {
    this.root = root;
    this.host = host;
    this.scrollTrack = scrollTrack;
    this.overlay = overlay;
    this.running = false;
    this.rafId = null;
    this.lastTime = 0;

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
    this.scene.fog = new THREE.Fog(0x14171a, 30, 150);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300);
    this.camera.position.set(0, 1.65, 42);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1.65, 30);
    this.controls.update();

    this.buildScaffoldScene();

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.host);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.resize();
  }

  buildScaffoldScene() {
    const clay = new THREE.MeshStandardMaterial({ color: 0xc9c7c0, roughness: 0.86 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xb95632, roughness: 0.72 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 50), clay);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = 20;
    floor.receiveShadow = true;

    const portal = new THREE.Group();
    const postGeometry = new THREE.BoxGeometry(1.2, 8, 1.2);
    for (const x of [-5, 5]) {
      const post = new THREE.Mesh(postGeometry, clay);
      post.position.set(x, 4, 28);
      post.castShadow = true;
      portal.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(11.2, 1.2, 1.2), accent);
    lintel.position.set(0, 7.4, 28);
    portal.add(lintel);

    const ambient = new THREE.HemisphereLight(0xdde2e6, 0x302c28, 2.2);
    const key = new THREE.DirectionalLight(0xfff2df, 3.4);
    key.position.set(8, 16, 18);
    key.castShadow = true;

    this.scaffold = new THREE.Group();
    this.scaffold.name = 'journey_scaffold';
    this.scaffold.add(floor, portal, ambient, key);
    this.scene.add(this.scaffold);
  }

  start() {
    if (!this.available || this.running) return;
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

  update() {
    if (this.controls.enabled) this.controls.update();
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
    this.scene?.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose());
    });
    this.renderer?.dispose();
    this.canvas?.remove();
  }
}
