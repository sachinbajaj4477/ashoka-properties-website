// Real-time 3D model of the Ashoka Properties office building (SCO-64, A-Block, Jindal Global City), built with Three.js.
// Modelled from photos: narrow four-storey block, dark ribbed front frame with three glass floors and a white-frame top
// window, canopy over the entrance, plain grey side wall, rooftop room with railing, and the real signboards.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PHONES = '9350974852  9311182344  9910092536';

export function createScene(canvas, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  // phones render fewer pixels so the 3D stays smooth and leaves room for the page's own animations
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  // shadows are the most expensive part; phones skip them so the scene stays smooth
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd6e9fb, 70, 190);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 400);

  // ---------- lights: bright Haryana morning sun, like the photos ----------
  scene.add(new THREE.HemisphereLight(0xd8ebff, 0xb7ad98, 1.0));
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.6);
  sun.position.set(26, 38, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 30, bottom: -20, near: 1, far: 120 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // ---------- canvas textures for signs and surfaces ----------
  const tex = (w, h, draw, repeat) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  };
  // condensed bold lettering like the real signs, centred and squeezed to fit the board
  const sign = (ctx, text, x, y, size, color, maxW, weight = 800, font = 'Arial, Helvetica, sans-serif') => {
    ctx.font = `${weight} ${size}px ${font}`;
    const w = ctx.measureText(text).width, sx = Math.min(1, maxW / w) * 0.86;
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 0); ctx.restore();
  };
  const ribbed = (base, line) => (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { ctx.fillStyle = line; ctx.fillRect(x, 0, 3, h); }
  };

  const ribTex = tex(256, 64, ribbed('#3a3d42', '#2b2e33'), [6, 1]);
  const ribTexLight = tex(256, 64, ribbed('#62666c', '#4c5056'), [6, 1]);
  const topSignTex = tex(1024, 360, (ctx, w, h) => {
    ribbed('#26292d', '#1e2024')(ctx, w, h);
    sign(ctx, 'राजस्थान वाले', w * 0.24, 62, 64, '#e8b830', 420, 700, '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif');
    sign(ctx, 'ASHOKA PROPERTIES', w / 2, 160, 132, '#f3efe6', w - 80);
    sign(ctx, '9350974852  9311182344', w / 2, 255, 84, '#f3efe6', w - 160);
    sign(ctx, '9910092536', w / 2, 325, 76, '#f3efe6', w * 0.5);
  });
  const canopySignTex = tex(1024, 300, (ctx, w, h) => {
    ribbed('#4b4f55', '#3c4045')(ctx, w, h);
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 5;
    sign(ctx, 'ASHOKA PROPERTIES', w / 2, 105, 140, '#efe6d2', w - 70);
    sign(ctx, PHONES, w / 2, 225, 82, '#efe6d2', w - 90);
  });
  const bandTex = tex(1024, 128, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(40,43,48,.92)'; ctx.fillRect(0, 0, w, h);
    sign(ctx, 'SALE  |  PURCHASE  |  RENTING', w / 2, h / 2 + 4, 76, '#f2f2f2', w - 80);
  });
  const sideBoardTex = tex(1024, 320, (ctx, w, h) => {
    ctx.fillStyle = '#fbfbfb'; ctx.fillRect(0, 0, w, h);
    sign(ctx, 'राजस्थान वाले', w / 2, 40, 40, '#c62828', 360, 700, '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif');
    sign(ctx, 'ASHOKA PROPERTIES', w / 2, 118, 112, '#1b2f7a', w - 80, 900);
    sign(ctx, 'SALE  |  PURCHASE  |  RENTING', w / 2, 200, 62, '#d32f2f', w - 260, 900);
    ctx.fillStyle = '#1b2f7a'; ctx.fillRect(0, 238, w, 82);
    sign(ctx, '9350974852, 9311182344, 9910092536, 9266159111', w / 2, 280, 50, '#ffffff', w - 60, 800);
  });
  const standBoardTex = tex(640, 400, (ctx, w, h) => {
    ctx.fillStyle = '#fbfbfb'; ctx.fillRect(0, 0, w, h);
    sign(ctx, 'राजस्थान वाले', w / 2, 34, 34, '#c62828', 260, 700, '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif');
    sign(ctx, 'ASHOKA PROPERTIES', w / 2, 92, 70, '#1b2f7a', w - 40, 900);
    ctx.fillStyle = '#e8572d'; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(150, 128, 340, 34, 17); ctx.fill(); } else ctx.fillRect(150, 128, 340, 34);
    sign(ctx, 'A UNIT OF ASHOKASMART LLP', w / 2, 146, 24, '#fff', 320, 800);
    sign(ctx, 'PROPERTY CONSULTANTS', w / 2, 200, 50, '#1b2f7a', w - 60, 900);
    sign(ctx, 'SALE | PURCHASE | RENTING', w / 2, 252, 40, '#d32f2f', w - 140, 900);
    ctx.fillStyle = '#1b2f7a'; ctx.fillRect(0, 286, w, 56);
    sign(ctx, '9350974852, 9311182344, 9910092536', w / 2, 315, 36, '#fff', w - 40, 800);
    sign(ctx, 'SCO - 64, A-Block, Jindal Global City, Sec. 35, Sonipat', w / 2, 370, 24, '#222', w - 40, 700);
  });
  const rentTex = color => tex(256, 200, (ctx, w, h) => {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color; ctx.fillRect(10, 10, w - 20, h - 20);
    sign(ctx, 'AVAILABLE', w / 2, 58, 46, '#fff', w - 40);
    sign(ctx, 'FOR', w / 2, 102, 46, '#fff', w - 40);
    sign(ctx, 'RENT', w / 2, 146, 46, '#fff', w - 40);
  });
  const paverTex = tex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8f8b85'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < w; x += 64) {
      const g = 132 + Math.random() * 22 | 0; ctx.fillStyle = `rgb(${g},${g - 3},${g - 8})`; ctx.fillRect(x + 2, y + 2, 60, 28);
    }
  }, [30, 30]);

  // ---------- materials ----------
  const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const M = {
    plaster: std({ color: 0xbfc2c3, roughness: 0.95 }),
    rib: std({ map: ribTex, color: 0xffffff, roughness: 0.6, metalness: 0.2 }),
    ribLight: std({ map: ribTexLight, roughness: 0.6, metalness: 0.2 }),
    dark: std({ color: 0x24272b, roughness: 0.5, metalness: 0.3 }),
    granite: std({ color: 0x3b3735, roughness: 0.35, metalness: 0.1 }),
    whiteFrame: std({ color: 0xf2f2f0, roughness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x5b7182, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 1.8, depthWrite: false }),
    interior: std({ color: 0xe9e3d8, roughness: 0.9, emissive: 0xfff1d6, emissiveIntensity: 0.25 }),
    paver: std({ map: paverTex, roughness: 0.95 }),
    lawn: std({ color: 0x8fae6a, roughness: 1 }),
    leaf: std({ color: 0x5f8f45, flatShading: true }),
    leafDark: std({ color: 0x3f6b3a, flatShading: true }),
    palm: std({ color: 0x6aa84f, flatShading: true }),
    pot: std({ color: 0x1f8a4c, roughness: 0.5 }),
    trunk: std({ color: 0x6b4a33, roughness: 1 }),
    steel: std({ color: 0x8e9499, roughness: 0.4, metalness: 0.7 }),
    tank: std({ color: 0xeeeeea, roughness: 0.6 }),
    cloud: std({ color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.35 }),
    concrete: std({ color: 0xa9a7a2, roughness: 1 }),
  };
  const face = map => new THREE.MeshStandardMaterial({ map, roughness: 0.55 });

  const group = new THREE.Group();
  scene.add(group);
  const box = (w, h, d, mat, x, y, z, parent = group) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = mat !== M.glass;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const plane = (w, h, mat, x, y, z, ry = 0, parent = group) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry; parent.add(m);
    return m;
  };

  // ---------- ground: paver plaza and grass, like the photos ----------
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(170, 64), M.lawn);
  lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; scene.add(lawn);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(70, 46), M.paver);
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(4, 0.02, 14); plaza.receiveShadow = true; scene.add(plaza);
  box(70, 0.25, 0.4, M.concrete, 4, 0.12, -8.8); // kerb between plaza and the plot behind

  // ---------- the building ----------
  const W = 6, D = 17, H = 15.4;          // front width, depth along the side wall, side-wall height
  const zf = 0;                           // front face of the plastered body
  box(W, H, D, M.plaster, 0, H / 2, zf - D / 2);                      // grey plastered body
  // dark ribbed front frame (stands slightly proud of the body and rises above it for the top sign)
  const fz = zf + 0.3;
  box(0.55, 16.9, 0.7, M.rib, -W / 2 + 0.27, 16.9 / 2, fz);           // left pier
  box(0.55, 16.9, 0.7, M.rib, W / 2 - 0.27, 16.9 / 2, fz);            // right pier
  for (const [y, h] of [[4.9, 0.8], [8.95, 0.7], [12.55, 0.7]]) box(W, h, 0.7, M.rib, 0, y, fz); // spandrels between floors
  // floors 2 and 3: tall glass with interior behind
  for (const [y0, y1] of [[5.3, 8.6], [9.3, 12.2]]) {
    const yc = (y0 + y1) / 2, h = y1 - y0;
    box(W - 1.1, h, 0.1, M.interior, 0, yc, zf - 1.2);
    box(W - 1.1, h, 0.06, M.glass, 0, yc, fz + 0.12);
    box(0.06, h, 0.08, M.dark, -0.3, yc, fz + 0.15);
  }
  // floor 4: white-frame window grid
  box(W - 1.1, 2.0, 0.08, M.interior, 0, 13.9, zf - 0.6);
  box(W - 1.1, 2.0, 0.06, M.glass, 0, 13.9, fz + 0.1);
  for (const x of [-2.45, -1.2, 0, 1.2, 2.45]) box(0.1, 2.0, 0.12, M.whiteFrame, x, 13.9, fz + 0.15);
  for (const y of [12.95, 13.55, 14.85]) box(W - 1.0, 0.1, 0.12, M.whiteFrame, 0, y, fz + 0.15);
  // top sign box: "राजस्थान वाले ASHOKA PROPERTIES" + numbers
  box(W + 0.3, 2.0, 0.9, M.dark, 0, 15.95, fz);
  plane(W + 0.2, 1.9, face(topSignTex), 0, 15.95, fz + 0.46);
  // rent boards in the glass, as in the photos
  plane(0.9, 0.7, face(rentTex('#c62828')), 0.9, 7.6, fz + 0.16);
  plane(0.9, 0.7, face(rentTex('#26407a')), -0.2, 10.9, fz + 0.16);

  // ground floor: granite steps, glass storefront, sign band, canopy
  for (let i = 0; i < 3; i++) box(W + 1.6 - i * 0.3, 0.2, 2.4 - i * 0.6, M.granite, 0, 0.1 + i * 0.2, fz + 1.4 - i * 0.3);
  box(W, 0.6, 0.7, M.rib, 0, 0.3 + 0.6, fz);                                  // plinth
  // the real office interior shows through the storefront glass
  const officeMat = std({ color: 0xffffff, roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.15 });
  new THREE.TextureLoader().load('images/office-interior.jpg', t => {
    t.colorSpace = THREE.SRGBColorSpace; officeMat.map = t; officeMat.emissiveMap = t; officeMat.needsUpdate = true;
  }, undefined, () => officeMat.color.set(0xe9e3d8));
  box(W - 1.1, 2.7, 0.08, officeMat, 0, 2.55, zf - 1.6);
  box(W - 1.1, 2.7, 0.06, M.glass, 0, 2.55, fz + 0.12);
  box(0.08, 2.7, 0.1, M.dark, 0.9, 2.55, fz + 0.16);
  plane(W - 1.2, 0.42, face(bandTex), 0, 3.66, fz + 0.17);
  // canopy fascia sign + projecting canopy with downlights
  box(W + 1.5, 1.25, 0.5, M.ribLight, 0.2, 4.45, fz + 0.75);
  plane(W + 1.4, 1.2, face(canopySignTex), 0.2, 4.45, fz + 1.01);
  box(W + 2.4, 0.35, 2.3, M.ribLight, 0.2, 5.25, fz + 1.0);
  const lamp = new THREE.MeshBasicMaterial({ color: 0xfff1c8 });
  for (const x of [-3, -1.5, 0, 1.5, 3]) box(0.18, 0.12, 0.18, lamp, x, 5.03, fz + 1.6);

  // white signboard high on the side wall
  plane(7.2, 2.25, face(sideBoardTex), W / 2 + 0.03, 13.6, zf - 5.2, Math.PI / 2);
  // rooftop: stair room, railing, water tank, second signboard
  box(W - 1.2, 2.8, 5.4, M.plaster, -0.2, H + 1.4, zf - D + 3.4);
  plane(5.6, 1.75, face(sideBoardTex), W / 2 - 0.55, H + 2.6, zf - D + 3.4, Math.PI / 2);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 20), M.tank);
  tank.position.set(-1, H + 3.6, zf - D + 4); tank.castShadow = true; group.add(tank);
  for (let z = -1.2; z > -D + 6.5; z -= 1.4) box(0.06, 1.0, 0.06, M.steel, W / 2 - 0.15, H + 0.5, zf + z);
  for (const y of [H + 0.55, H + 1.0]) box(0.05, 0.05, D - 7.5, M.steel, W / 2 - 0.15, y, zf - (D - 7.5) / 2 - 1.2);

  // standing board on two poles beside the entrance
  const board = new THREE.Group();
  for (const x of [-1.25, 1.25]) box(0.08, 3.1, 0.08, M.steel, x, 1.55, 0, board);
  box(3.0, 1.9, 0.08, M.whiteFrame, 0, 2.3, 0, board);
  plane(2.92, 1.82, face(standBoardTex), 0, 2.3, 0.05, 0, board);
  board.position.set(W / 2 + 2.2, 0, fz + 1.2); board.rotation.y = -0.25;
  board.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(board);

  // potted palms at the door
  const palm = (x, z) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.75, 14), M.pot); p.position.y = 0.38; g.add(p);
    for (let i = 0; i < 9; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.5, 4), M.palm);
      const a = (i / 9) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.35, 1.45, Math.sin(a) * 0.35);
      leaf.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
      g.add(leaf);
    }
    g.position.set(x, 0.6, z); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
  };
  palm(-W / 2 + 0.2, fz + 1.5); palm(W / 2 - 0.2, fz + 1.5);

  // street lamps along the plaza
  const streetLamp = (x, z) => {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 4.4, 10), M.dark); post.position.y = 2.2; g.add(post);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.2, 0.18, 16), M.dark); head.position.y = 4.45; g.add(head);
    g.position.set(x, 0, z); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
  };
  streetLamp(W / 2 + 7, -2); streetLamp(W / 2 + 7, -11); streetLamp(-W / 2 - 4, 3.5);

  // unfinished neighbour block and trees behind, as on site
  box(5, 9, 6, M.concrete, -13, 4.5, -10);
  const tree = (x, z, s = 1, kind = 'round') => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 2.6 * s, 6), M.trunk);
    trunk.position.y = 1.3 * s; trunk.castShadow = true; g.add(trunk);
    if (kind === 'cypress') {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 6 * s, 7), M.leafDark);
      c.position.y = 4 * s; c.castShadow = true; g.add(c);
    } else {
      for (const [dx, dy, r] of [[0, 3.2, 1.7], [0.9, 3.8, 1.2], [-0.8, 3.7, 1.1]]) {
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), M.leaf);
        f.position.set(dx * s, dy * s, 0); f.castShadow = true; g.add(f);
      }
    }
    g.position.set(x, 0, z); g.rotation.y = Math.random() * 6;
    scene.add(g);
    return g;
  };
  const trees = [];
  for (let i = 0; i < (mobile ? 9 : 16); i++) trees.push(tree(-40 + i * 5.4 + Math.random() * 2, -26 - Math.random() * 6, 1.3 + Math.random() * 0.7));
  trees.push(tree(18, -6, 1.4), tree(22, 4, 1.2), tree(-20, 2, 1.1, 'cypress'), tree(28, -14, 1.8), tree(-30, -8, 1.6));

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
    g.position.set(-70 + Math.random() * 140, 26 + Math.random() * 14, -40 - Math.random() * 50);
    g.userData.speed = 0.6 + Math.random() * 0.8;
    scene.add(g);
    clouds.push(g);
  }

  // ---------- camera rig: starts on the front corner (front + side wall with its signboard), orbits as you scroll ----------
  const target = new THREE.Vector3(0, 9, -4);
  const state = { progress: 0, intro: 0, px: 0, py: 0, sx: 0, sy: 0 };

  function place() {
    const p = state.progress, e = 1 - Math.pow(1 - state.intro, 3);
    const aspect = camera.aspect;
    const far = aspect < 0.8 ? 1.35 : aspect < 1.2 ? 1.15 : 1;
    const theta = 0.42 + p * 0.85 + state.sx * 0.12 - (1 - e) * 0.9;
    const radius = (42 - p * 10) * far + (1 - e) * 55;
    const height = 5 + p * 5 - state.sy * 2 + (1 - e) * 26;
    camera.position.set(target.x + Math.sin(theta) * radius, height, target.z + Math.cos(theta) * radius);
    // look above the building at first so it sits under the headline, then settle on it as you scroll
    target.y = (aspect < 0.8 ? 24 : 19) - p * (aspect < 0.8 ? 15 : 10);
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

  let running = true, last = performance.now(), frames = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (running) {
      state.sx += (state.px - state.sx) * 0.05;
      state.sy += (state.py - state.sy) * 0.05;
      for (const c of clouds) { c.position.x += c.userData.speed * dt; if (c.position.x > 80) c.position.x = -80; }
      for (const [i, t] of trees.entries()) t.rotation.z = Math.sin(now / 1400 + i) * 0.012;
      place();
      renderer.render(scene, camera);
      // a few real frames drawn: the 3D works on this device, so hide the backup photo
      if (++frames === 3) document.documentElement.classList.add('scene-on');
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
