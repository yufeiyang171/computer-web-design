import * as THREE from "three";

const FRONT_Z = 0.38;

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

function makeCanvasTexture(width, height, draw, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = options.colorSpace ?? THREE.SRGBColorSpace;
  texture.wrapS = options.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = options.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.anisotropy = options.anisotropy ?? 8;
  if (options.repeat) texture.repeat.set(options.repeat[0], options.repeat[1]);
  return texture;
}

function normalizeUv(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const rangeX = box.max.x - box.min.x || 1;
  const rangeY = box.max.y - box.min.y || 1;

  for (let i = 0; i < position.count; i += 1) {
    uv.setXY(i, (position.getX(i) - box.min.x) / rangeX, (position.getY(i) - box.min.y) / rangeY);
  }

  uv.needsUpdate = true;
  return geometry;
}

function createCardboardTexture() {
  const albedo = makeCanvasTexture(
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = "#d6af84";
      ctx.fillRect(0, 0, width, height);

      const seed = 23;
      for (let i = 0; i < 1700; i += 1) {
        const n = Math.sin((i + seed) * 91.73) * 10000;
        const x = (n - Math.floor(n)) * width;
        const m = Math.sin((i + seed) * 17.17) * 10000;
        const y = (m - Math.floor(m)) * height;
        const shade = i % 3 === 0 ? "rgba(95, 61, 32, 0.09)" : "rgba(255, 238, 196, 0.08)";
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, 1 + (i % 4), 1);
      }

      ctx.globalAlpha = 0.15;
      for (let y = 0; y < height; y += 18) {
        ctx.strokeStyle = y % 36 === 0 ? "#79532f" : "#f0cb9a";
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(y) * 1.5);
        ctx.lineTo(width, y + Math.cos(y * 0.2) * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: [2.7, 2.2] },
  );

  const bump = makeCanvasTexture(
    256,
    256,
    (ctx, width, height) => {
      ctx.fillStyle = "#7e7e7e";
      ctx.fillRect(0, 0, width, height);
      for (let y = 0; y < height; y += 6) {
        ctx.strokeStyle = y % 18 === 0 ? "#565656" : "#a1a1a1";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + Math.sin(y) * 1.5);
        ctx.stroke();
      }
      for (let i = 0; i < 800; i += 1) {
        const x = (Math.sin(i * 43.1) * 0.5 + 0.5) * width;
        const y = (Math.sin(i * 7.9) * 0.5 + 0.5) * height;
        ctx.fillStyle = i % 2 ? "#696969" : "#999";
        ctx.fillRect(x, y, 1, 1);
      }
    },
    { colorSpace: THREE.NoColorSpace, repeat: [3.2, 2.6] },
  );

  return { albedo, bump };
}

function createScreenTexture() {
  return makeCanvasTexture(1024, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    roundRect(ctx, 8, 8, width - 16, height - 16, 74);
    ctx.clip();

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#caff34");
    gradient.addColorStop(0.42, "#a5ff1f");
    gradient.addColorStop(1, "#78eb18");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.beginPath();
    ctx.moveTo(width * 0.52, 0);
    ctx.lineTo(width * 0.72, 0);
    ctx.lineTo(width * 0.22, height);
    ctx.lineTo(width * 0.05, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(30, 59, 24, 0.86)";
    ctx.font = "900 126px Impact, Arial Black, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("LET'S", width * 0.13, height * 0.18);
    ctx.fillText("START.", width * 0.13, height * 0.44);

    ctx.strokeStyle = "rgba(30, 59, 24, 0.9)";
    ctx.lineWidth = 34;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(width * 0.65, height * 0.5);
    ctx.lineTo(width * 0.86, height * 0.5);
    ctx.moveTo(width * 0.78, height * 0.29);
    ctx.lineTo(width * 0.9, height * 0.5);
    ctx.lineTo(width * 0.78, height * 0.71);
    ctx.stroke();
  });
}

function createLabelTexture(kind) {
  return makeCanvasTexture(512, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 242, 213, 0.96)";
    ctx.strokeStyle = "rgba(82, 48, 26, 0.28)";
    ctx.lineWidth = 7;

    if (kind === "brand") {
      roundRect(ctx, width * 0.09, height * 0.2, width * 0.82, height * 0.55, 36);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#29231f";
      ctx.font = "900 64px Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PUPLOOP", width * 0.5, height * 0.48);
      ctx.strokeStyle = "#f05a47";
      ctx.lineWidth = 9;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(width * 0.79, height * (0.28 + i * 0.12));
        ctx.lineTo(width * (0.87 + i * 0.02), height * (0.18 + i * 0.09));
        ctx.stroke();
      }
      return;
    }

    if (kind === "interaction") {
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#25211d";
      ctx.font = "900 56px Arial Black, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("INTERACTION", 20, 76);
      ctx.fillText("DESIGN", 20, 145);
      ctx.strokeStyle = "#f1473c";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(width * 0.58, height * 0.72);
      ctx.bezierCurveTo(width * 0.64, height * 0.61, width * 0.68, height * 0.82, width * 0.74, height * 0.7);
      ctx.bezierCurveTo(width * 0.79, height * 0.59, width * 0.83, height * 0.8, width * 0.89, height * 0.66);
      ctx.stroke();
      return;
    }

    if (kind === "tape") {
      ctx.fillStyle = "#ffd91e";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#221e1a";
      ctx.font = "900 60px Arial Black, sans-serif";
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DESIGN WORK", 0, 8);
      return;
    }

    if (kind === "left-note") {
      ctx.fillStyle = "#28231f";
      ctx.font = "900 38px Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(-0.13);
      ctx.fillText("IDEAS", 0, -58);
      ctx.fillText("INSIDE", 0, -13);
      ctx.strokeStyle = "#28231f";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(38, 20);
      ctx.lineTo(68, 54);
      ctx.lineTo(56, 19);
      ctx.stroke();
      ctx.fillStyle = "#ee5140";
      ctx.beginPath();
      ctx.arc(-34, 76, 23, 0, Math.PI * 2);
      ctx.arc(-7, 76, 23, 0, Math.PI * 2);
      ctx.moveTo(-57, 86);
      ctx.lineTo(-20, 130);
      ctx.lineTo(18, 86);
      ctx.fill();
      return;
    }

    if (kind === "right-note") {
      ctx.fillStyle = "#ffdb2f";
      roundRect(ctx, width * 0.12, 16, width * 0.76, height * 0.48, 18);
      ctx.fill();
      ctx.strokeStyle = "#26221f";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.26, 40, 0, Math.PI * 2);
      ctx.moveTo(width * 0.5, height * 0.42);
      ctx.lineTo(width * 0.5, height * 0.54);
      ctx.stroke();
      ctx.fillStyle = "#26221f";
      ctx.font = "900 28px Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GOOD", width * 0.5, height * 0.68);
      ctx.fillText("DESIGN", width * 0.5, height * 0.8);
      ctx.fillText("DAYS", width * 0.5, height * 0.92);
    }
  });
}

function createStickerTexture(kind) {
  return makeCanvasTexture(320, 320, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);

    if (kind === "star") {
      ctx.fillStyle = "#ffdc2e";
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? 128 : 70;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      drawSmiley(ctx, 0, 6, 52, "#2c251d");
      return;
    }

    if (kind === "flower") {
      ctx.fillStyle = "#52a979";
      for (let i = 0; i < 7; i += 1) {
        const angle = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * 54, Math.sin(angle) * 48, 46, 34, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f9f3e0";
      ctx.beginPath();
      ctx.arc(0, 0, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b261e";
      ctx.beginPath();
      ctx.arc(-16, -6, 9, 0, Math.PI * 2);
      ctx.arc(18, -6, 9, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.fillStyle = "#fff4dd";
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * 55, Math.sin(angle) * 55, 38, 28, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffcf28";
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.fill();
    drawSmiley(ctx, 0, 0, 42, "#2d261e");
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function drawSmiley(ctx, x, y, radius, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.13;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x - radius * 0.32, y - radius * 0.22, radius * 0.08, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.28, y - radius * 0.22, radius * 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.06, radius * 0.46, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();
}

function makeRoundedPanel(width, height, depth, radius, material, name) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSize: Math.min(depth * 0.45, 0.04),
    bevelThickness: Math.min(depth * 0.35, 0.035),
    bevelSegments: 3,
    curveSegments: 14,
  });
  geometry.center();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeDecal(width, height, radius, texture, name, opacity = 1) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function makeStrip(width, height, material, name) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.025), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tagMesh(mesh, partId, label, detail = false) {
  mesh.userData.partId = partId;
  mesh.userData.label = label;
  mesh.userData.clickable = true;
  if (detail) mesh.userData.explodeWithParent = true;
  return mesh;
}

function createPart(root, parts, id, label, position, explodeVector) {
  const group = new THREE.Group();
  group.name = id;
  group.position.set(...position);
  group.userData.partId = id;
  group.userData.label = label;
  group.userData.homePosition = group.position.clone();
  group.userData.explodeOffset = new THREE.Vector3(...explodeVector);
  parts.push(group);
  root.add(group);
  return group;
}

function assignPart(group, partId, label, detail = false) {
  group.traverse((child) => {
    if (child.isMesh) tagMesh(child, partId, label, detail);
  });
}

function makeKnob(materials, index) {
  const group = new THREE.Group();
  group.name = `ribbed-knob-${index + 1}`;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 48), materials.knob);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 8, 48), materials.ink);
  rim.position.z = 0.086;
  group.add(rim);

  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.055, 0.011), materials.ink);
    tick.position.set(Math.cos(angle) * 0.155, Math.sin(angle) * 0.155, 0.102);
    tick.rotation.z = angle;
    tick.name = `knob-rib-${index + 1}-${i}`;
    group.add(tick);
  }

  return group;
}

function buildMaterials() {
  const cardboard = createCardboardTexture();
  const screenTexture = createScreenTexture();

  const materials = {
    cardboard: new THREE.MeshStandardMaterial({
      color: 0xd6af84,
      map: cardboard.albedo,
      bumpMap: cardboard.bump,
      bumpScale: 0.035,
      roughness: 0.9,
      metalness: 0,
    }),
    cardboardDark: new THREE.MeshStandardMaterial({
      color: 0x977345,
      map: cardboard.albedo,
      bumpMap: cardboard.bump,
      bumpScale: 0.028,
      roughness: 0.95,
      metalness: 0,
    }),
    bezel: new THREE.MeshPhysicalMaterial({
      color: 0x10100c,
      roughness: 0.31,
      metalness: 0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.28,
    }),
    screen: new THREE.MeshPhysicalMaterial({
      color: 0xa7ff28,
      emissive: 0x8eff17,
      emissiveIntensity: 1.05,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 0.75,
      clearcoatRoughness: 0.08,
    }),
    ink: new THREE.MeshStandardMaterial({
      color: 0x25211d,
      roughness: 0.78,
      metalness: 0,
    }),
    knob: new THREE.MeshStandardMaterial({
      color: 0xd8b17e,
      map: cardboard.albedo,
      roughness: 0.84,
      metalness: 0,
    }),
    led: new THREE.MeshStandardMaterial({
      color: 0xb8ff22,
      emissive: 0x76ff00,
      emissiveIntensity: 2.2,
      roughness: 0.12,
    }),
    shadow: new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.24 }),
  };

  return {
    materials,
    screenCopyTexture: screenTexture,
    textures: [
      cardboard.albedo,
      cardboard.bump,
      screenTexture,
    ],
  };
}

export function createCardboardComputerModel() {
  const { materials, screenCopyTexture, textures } = buildMaterials();
  const root = new THREE.Group();
  root.name = "cardboard-crt-computer";
  root.userData.sculptRuntime = {
    targetId: "cardboard-crt-computer",
    fidelity: "single-view approximate procedural model",
    destructionGroups: ["cabinet-shell", "screen-assembly", "decal-layer", "controls", "support-feet"],
  };

  const parts = [];

  const cabinet = createPart(root, parts, "cabinet-shell", "Cardboard cabinet shell", [0, 0, 0], [0, 0, -0.28]);
  cabinet.add(tagMesh(makeRoundedPanel(4.78, 3.2, 0.68, 0.1, materials.cardboard, "main-cabinet-body"), "cabinet-shell", "Cardboard cabinet shell"));

  const topFold = makeStrip(4.35, 0.38, materials.cardboardDark, "top-folded-cardboard-band");
  topFold.position.set(0, 1.31, FRONT_Z + 0.07);
  cabinet.add(tagMesh(topFold, "cabinet-shell", "Cardboard cabinet shell", true));

  const bottomFold = makeStrip(4.38, 0.68, materials.cardboardDark, "lower-cardboard-control-band");
  bottomFold.position.set(0, -1.12, FRONT_Z + 0.08);
  cabinet.add(tagMesh(bottomFold, "cabinet-shell", "Cardboard cabinet shell", true));

  const leftFold = makeStrip(0.43, 1.9, materials.cardboard, "left-folded-cardboard-side-band");
  leftFold.position.set(-2.04, 0.28, FRONT_Z + 0.09);
  leftFold.rotation.z = THREE.MathUtils.degToRad(-2.4);
  cabinet.add(tagMesh(leftFold, "cabinet-shell", "Cardboard cabinet shell", true));

  const rightFold = makeStrip(0.43, 1.9, materials.cardboard, "right-folded-cardboard-side-band");
  rightFold.position.set(2.04, 0.28, FRONT_Z + 0.09);
  rightFold.rotation.z = THREE.MathUtils.degToRad(2.2);
  cabinet.add(tagMesh(rightFold, "cabinet-shell", "Cardboard cabinet shell", true));

  const edgeSpecs = [
    ["top-corrugated-edge", 4.78, 0.035, 0, 1.61, 0],
    ["bottom-corrugated-edge", 4.65, 0.035, 0, -1.51, 0],
    ["left-corrugated-edge", 0.035, 3.03, -2.36, 0.02, 0],
    ["right-corrugated-edge", 0.035, 3.03, 2.36, 0.02, 0],
    ["screen-lower-fold-seam", 3.68, 0.025, -0.04, -0.63, 0],
  ];
  edgeSpecs.forEach(([name, width, height, x, y, rotation]) => {
    const strip = makeStrip(width, height, materials.ink, name);
    strip.position.set(x, y, FRONT_Z + 0.15);
    strip.rotation.z = rotation;
    cabinet.add(tagMesh(strip, "cabinet-shell", "Cardboard cabinet shell", true));
  });

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.02, 0.0);
  flapShape.lineTo(0.32, 0.12);
  flapShape.lineTo(0.32, -0.12);
  flapShape.closePath();
  const flapGeometry = new THREE.ExtrudeGeometry(flapShape, { depth: 0.055, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
  flapGeometry.center();
  const leftFlap = new THREE.Mesh(flapGeometry, materials.cardboardDark);
  leftFlap.position.set(-2.52, 0.02, 0.05);
  cabinet.add(tagMesh(leftFlap, "cabinet-shell", "Cardboard cabinet shell", true));

  const rightFlap = leftFlap.clone();
  rightFlap.name = "right-cardboard-side-flap";
  rightFlap.scale.x = -1;
  rightFlap.position.set(2.52, 0.02, 0.05);
  cabinet.add(tagMesh(rightFlap, "cabinet-shell", "Cardboard cabinet shell", true));

  const screenPart = createPart(root, parts, "screen-assembly", "Raised black bezel and glowing CRT screen", [0, 0, 0], [0, 0.08, 0.46]);
  const bezel = makeRoundedPanel(3.58, 1.86, 0.22, 0.24, materials.bezel, "raised-rounded-black-screen-bezel");
  bezel.position.set(-0.03, 0.38, FRONT_Z + 0.17);
  screenPart.add(tagMesh(bezel, "screen-assembly", "Raised black bezel and glowing CRT screen"));

  const screen = makeRoundedPanel(3.14, 1.4, 0.045, 0.18, materials.screen, "green-convex-screen-face");
  screen.position.set(-0.03, 0.36, FRONT_Z + 0.31);
  screenPart.add(tagMesh(screen, "screen-assembly", "Raised black bezel and glowing CRT screen"));

  const screenCopy = makeDecal(3.02, 1.32, 0.17, screenCopyTexture, "screen-copy-lets-start-arrow", 0.94);
  screenCopy.position.set(-0.03, 0.36, FRONT_Z + 0.36);
  screenPart.add(tagMesh(screenCopy, "screen-assembly", "Raised black bezel and glowing CRT screen", true));

  const glassGlare = makeDecal(
    3.04,
    1.3,
    0.17,
    makeCanvasTexture(512, 256, (ctx, width, height) => {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(width * 0.15, height, width * 0.8, 0);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.45, "rgba(255,255,255,0.15)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }),
    "screen-diagonal-gloss-pass",
    0.72,
  );
  glassGlare.position.set(-0.03, 0.36, FRONT_Z + 0.355);
  screenPart.add(tagMesh(glassGlare, "screen-assembly", "Raised black bezel and glowing CRT screen", true));

  const decalPart = createPart(root, parts, "decal-layer", "Paper stickers and handwritten marks", [0, 0, 0], [0.02, 0.2, 0.62]);
  const decals = [
    ["top-brand-badge", 1.14, 0.3, 0.02, 1.46, 0, 0.08, createLabelTexture("brand")],
    ["yellow-star-sticker", 0.48, 0.48, -1.93, 1.34, -11, 0.19, createStickerTexture("star")],
    ["green-flower-sticker", 0.44, 0.44, 1.72, 1.34, 13, 0.2, createStickerTexture("flower")],
    ["left-ideas-inside-note", 0.45, 0.93, -2.04, 0.28, -5, 0.04, createLabelTexture("left-note")],
    ["right-lightbulb-sticker", 0.43, 0.96, 2.07, 0.28, 4, 0.04, createLabelTexture("right-note")],
    ["lower-interaction-design-label", 1.64, 0.58, -1.06, -1.17, -2, 0.03, createLabelTexture("interaction")],
    ["vertical-design-work-tape", 0.32, 0.82, 0.14, -1.13, 0, 0.02, createLabelTexture("tape")],
    ["white-flower-smile-sticker", 0.34, 0.34, 2.09, -0.57, -5, 0.18, createStickerTexture("white-flower")],
  ];
  decals.forEach(([name, width, height, x, y, rotation, radius, texture]) => {
    const decal = makeDecal(width, height, radius, texture, name);
    decal.position.set(x, y, FRONT_Z + 0.205);
    decal.rotation.z = THREE.MathUtils.degToRad(rotation);
    decalPart.add(tagMesh(decal, "decal-layer", "Paper stickers and handwritten marks", true));
  });

  const controls = createPart(root, parts, "controls", "Three ribbed knobs, LED, and power icon", [0, 0, 0], [0.34, -0.16, 0.52]);
  [0, 1, 2].forEach((_, index) => {
    const knob = makeKnob(materials, index);
    knob.position.set(0.78 + index * 0.45, -1.16, FRONT_Z + 0.32);
    assignPart(knob, "controls", "Three ribbed knobs, LED, and power icon", true);
    controls.add(knob);
  });

  const led = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 16), materials.led);
  led.name = "small-green-power-led";
  led.position.set(2.08, -1.02, FRONT_Z + 0.31);
  controls.add(tagMesh(led, "controls", "Three ribbed knobs, LED, and power icon", true));

  const powerIcon = makeDecal(
    0.25,
    0.25,
    0.02,
    makeCanvasTexture(256, 256, (ctx, width, height) => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#fff3dd";
      ctx.lineWidth = 24;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.58, 62, Math.PI * 0.23, Math.PI * 1.77);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width / 2, height * 0.18);
      ctx.lineTo(width / 2, height * 0.55);
      ctx.stroke();
    }),
    "white-power-symbol",
  );
  powerIcon.position.set(2.08, -1.25, FRONT_Z + 0.325);
  controls.add(tagMesh(powerIcon, "controls", "Three ribbed knobs, LED, and power icon", true));

  const support = createPart(root, parts, "support-feet", "Bottom cardboard feet and center stand", [0, 0, 0], [0, -0.5, -0.12]);
  [
    ["left-bottom-foot", -1.52, -1.75, 0.44, 0.18, 0.42],
    ["right-bottom-foot", 1.52, -1.75, 0.44, 0.18, 0.42],
    ["center-cardboard-stand", 0.0, -1.83, 0.62, 0.14, 0.52],
  ].forEach(([name, x, y, width, height, depth]) => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials.cardboardDark);
    foot.name = name;
    foot.position.set(x, y, -0.05);
    foot.castShadow = true;
    foot.receiveShadow = true;
    support.add(tagMesh(foot, "support-feet", "Bottom cardboard feet and center stand", true));
  });

  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.1), materials.shadow);
  shadowPlane.name = "soft-contact-shadow";
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, -1.94, -0.05);
  shadowPlane.receiveShadow = true;
  root.add(shadowPlane);

  root.rotation.set(THREE.MathUtils.degToRad(-2), THREE.MathUtils.degToRad(6), 0);
  root.userData.parts = parts.map((part) => ({
    id: part.userData.partId,
    label: part.userData.label,
  }));

  return {
    root,
    parts,
    dispose() {
      root.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          const meshMaterials = Array.isArray(child.material) ? child.material : [child.material];
          meshMaterials.forEach((material) => material?.dispose?.());
        }
      });
      textures.forEach((texture) => texture.dispose());
    },
  };
}
