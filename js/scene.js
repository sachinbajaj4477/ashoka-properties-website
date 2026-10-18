// Real-time 3D modern villa for the hero, built from simple shapes with Three.js.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createScene(canvas, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  // shadows are the most expensive part; phones skip them so the scene stays smooth
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd6e9fb, 60, 170);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 400);

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0xb9a98c, 0.9));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(22, 34, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const glow = new THREE.PointLight(0xffc27a, 30, 22, 1.6);
  glow.position.set(0, 3, 4);
  scene.add(glow);

  // ---------- materials ----------
  const std = (color, roughness = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const M = {
    white: std(0xf4f1eb, 0.85),
    stone: std(0xe6dfd2, 0.95),
    feature: std(0x8a8176, 0.9),
    dark: std(0x24272c, 0.5, { metalness: 0.4 }),
    wood: std(0x9b6a3c, 0.65),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x2a4256, metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.34, envMapIntensity: 1.6, depthWrite: false }),
    warm: new THREE.MeshBasicMaterial({ color: 0xffd7a1 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x47bde3, roughness: 0.06, metalness: 0, clearcoat: 1, envMapIntensity: 1.8, emissive: 0x0a4d66, emissiveIntensity: 0.25 }),
    lawn: std(0xa9c28a, 1),
    leaf: std(0x6e9b52, 0.9, { flatShading: true }),
    leafDark: std(0x3f6b3a, 0.9, { flatShading: true }),
    trunk: std(0x6b4a33, 1),
    cloud: std(0xffffff, 1, { emissive: 0xffffff, emissiveIntensity: 0.35 }),
  };

  const villa = new THREE.Group();
  scene.add(villa);
  const box = (w, h, d, mat, x, y, z, parent = villa) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = mat !== M.glass && mat !== M.warm;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ground + deck
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(160, 64), M.lawn);
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  scene.add(lawn);
  box(28, 0.4, 20, M.stone, 0, 0.2, 1);

  // ground floor: solid wing + glass living room
  box(5.2, 3.4, 8.4, M.white, -6, 2.1, -1.2);
  box(10.4, 3.0, 7.8, M.glass, 2.2, 1.9, -1.2);
  box(10.2, 2.8, 0.1, M.warm, 2.2, 1.9, -4.9);
  box(0.1, 2.8, 7.4, M.warm, 7.2, 1.9, -1.2);
  for (let x = -2.8; x <= 7.3; x += 2) box(0.08, 3.0, 0.08, M.dark, x, 1.9, 2.75);
  box(17.5, 0.45, 9.6, M.white, 0.2, 3.62, -1.2);

  // first floor: cantilevered box with glass ribbon + wood slat screen
  box(13.6, 2.8, 8.2, M.glass, -2.4, 5.25, 0.6);
  box(13.4, 2.6, 0.1, M.warm, -2.4, 5.25, -3.4);
  box(0.6, 3.3, 8.8, M.white, -9.2, 5.3, 0.6);
  box(14.4, 0.7, 8.8, M.white, -2.1, 7.0, 0.6);
  box(15.2, 0.14, 9.6, M.dark, -2.1, 7.42, 0.6);
  for (let x = 0.4; x <= 4.6; x += 0.3) box(0.12, 2.7, 0.14, M.wood, x, 5.25, 4.95);
  box(13.6, 0.12, 0.12, M.dark, -2.4, 4.1, 5.0); // balcony rail line

  // penthouse
  box(6.4, 2.6, 5.6, M.white, 3.6, 8.75, -1.6);
  box(5.2, 2.0, 0.1, M.glass, 3.6, 8.7, 1.25);
  box(5.0, 1.9, 0.1, M.warm, 3.6, 8.7, 0.9);
  box(7.4, 0.14, 6.6, M.dark, 3.6, 10.12, -1.6);

  // stone feature wall + chimney
  box(1.3, 8.2, 10, M.feature, -10.2, 4.3, -1);
  box(1.4, 2.4, 1.4, M.feature, -6.5, 8.6, -3.5);

  // pool + loungers
  box(11.4, 0.08, 5.4, M.dark, 4.2, 0.42, 7.2);
  const water = box(10.8, 0.1, 4.8, M.water, 4.2, 0.45, 7.2);
  for (const x of [-3.2, -1.2]) {
    box(1.1, 0.25, 2.4, M.white, x, 0.62, 7.4);
    box(1.1, 0.7, 0.2, M.white, x, 0.95, 6.3).rotation.x = -0.5;
  }
  // hedges
  box(0.9, 0.9, 18, M.leafDark, -13.6, 0.85, 1);
  box(10, 0.9, 0.9, M.leafDark, -8.5, 0.85, 10.6);

  // trees
  const tree = (x, z, s = 1, kind = 'round') => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.22 * s, 2.4 * s, 6), M.trunk);
    trunk.position.y = 1.2 * s; trunk.castShadow = true; g.add(trunk);
    if (kind === 'cypress') {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 6 * s, 7), M.leafDark);
      c.position.y = 4 * s; c.castShadow = true; g.add(c);
    } else {
      for (const [dx, dy, r] of [[0, 3, 1.6], [0.8, 3.6, 1.1], [-0.7, 3.5, 1.0]]) {
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), M.leaf);
        f.position.set(dx * s, dy * s, 0); f.castShadow = true; g.add(f);
      }
    }
    g.position.set(x, 0.4, z);
    g.rotation.y = Math.random() * 6;
    scene.add(g);
    return g;
  };
  const trees = [
    tree(-16, -6, 1.3), tree(15, -7, 1.5), tree(17, 3, 1.1), tree(-18, 6, 1.0),
    tree(11.5, -4.5, 0.9, 'cypress'), tree(-12, -5, 1, 'cypress'), tree(-12, 3, 0.9, 'cypress'),
    tree(24, -18, 2), tree(-26, -20, 2.2), tree(4, -22, 1.8), tree(-6, -26, 2), tree(30, 6, 1.6), tree(-30, 8, 1.7),
  ];

  // soft 3D clouds
  const clouds = [];
  const cloudGeo = new THREE.SphereGeometry(1, 20, 14);
  for (let i = 0; i < (mobile ? 6 : 10); i++) {
    const g = new THREE.Group();
    const n = 4 + (i % 3);
    for (let k = 0; k < n; k++) {
      const s = new THREE.Mesh(cloudGeo, M.cloud);
      const r = 2.2 + Math.random() * 2.2;
      s.scale.set(r * 1.4, r, r);
      s.position.set((k - n / 2) * 2.6, Math.random() * 1.2, Math.random() * 1.5);
      g.add(s);
    }
    g.position.set(-70 + Math.random() * 140, 20 + Math.random() * 14, -30 - Math.random() * 50);
    g.userData.speed = 0.6 + Math.random() * 0.8;
    scene.add(g);
    clouds.push(g);
  }

  // ---------- camera rig ----------
  const target = new THREE.Vector3(0, 6.5, 0);
  const state = { progress: 0, intro: 0, px: 0, py: 0, sx: 0, sy: 0 };

  function place() {
    const p = state.progress, e = 1 - Math.pow(1 - state.intro, 3);
    const aspect = camera.aspect;
    const far = aspect < 0.8 ? 1.75 : aspect < 1.2 ? 1.3 : 1;
    const theta = -0.42 + p * 1.25 + state.sx * 0.12 - (1 - e) * 0.9;
    const radius = (40 - p * 12) * far + (1 - e) * 55;
    const height = 7.5 + p * 4 - state.sy * 2 + (1 - e) * 24;
    camera.position.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius);
    // look above the villa at first so it sits under the headline, then settle on it as you scroll
    target.y = 13 - p * 8.5 + (aspect < 0.8 ? 1.5 : aspect < 1.2 ? 3 : 0) * (1 - p);
    camera.lookAt(target);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  let running = true, last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (running) {
      state.sx += (state.px - state.sx) * 0.05;
      state.sy += (state.py - state.sy) * 0.05;
      for (const c of clouds) { c.position.x += c.userData.speed * dt; if (c.position.x > 80) c.position.x = -80; }
      for (const [i, t] of trees.entries()) t.rotation.z = Math.sin(now / 1400 + i) * 0.012;
      M.water.emissiveIntensity = 0.22 + Math.sin(now / 600) * 0.06;
      glow.intensity = 26 + Math.sin(now / 900) * 4;
      place();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setProgress(p) { state.progress = p; },
    setPointer(x, y) { state.px = x; state.py = y; },
    setIntro(v) { state.intro = v; },
    setRunning(v) { running = v; if (v) last = performance.now(); },
    renderOnce() { place(); renderer.render(scene, camera); },
  };
}
