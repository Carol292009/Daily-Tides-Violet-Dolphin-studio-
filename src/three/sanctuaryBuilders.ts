import * as THREE from 'three';
import { Hydration30DayPoint } from '../data/localStore';

export interface ProceduralTextureSet {
  stoneAlbedo: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  woodAlbedo: THREE.CanvasTexture;
  woodBump: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Analytical island ground elevation heightfield.
 * Ensures every pavilion, basin, tree, crystal socket, and pebble sits flush on terrain.
 */
export function groundHeightAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  // Central sanctuary terrace plateau (~radius 6.2) gently sloping to coastal shore (~radius 11.5)
  const terrace = 1.15 / (1 + Math.exp((r - 8.6) * 0.65));
  const innerMound = 0.28 * Math.exp(-(r * r) / 26);
  const gentleRipple =
    0.05 * Math.sin(x * 0.45 + 0.4) * Math.cos(z * 0.45 - 0.3) * Math.max(0, 1 - r / 12);
  const raw = terrace + innerMound + gentleRipple - 0.12;
  return Math.max(raw, -0.55);
}

/**
 * Generates zero-404 procedural CanvasTextures for stone, warm cedar wood, and soft radial shadows.
 */
export function createSanctuaryTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Stone albedo + bump
  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = 256;
  stoneCanvas.height = 256;
  const sCtx = stoneCanvas.getContext('2d')!;
  sCtx.fillStyle = '#DBD5CA';
  sCtx.fillRect(0, 0, 256, 256);

  const stoneBumpCanvas = document.createElement('canvas');
  stoneBumpCanvas.width = 256;
  stoneBumpCanvas.height = 256;
  const sbCtx = stoneBumpCanvas.getContext('2d')!;
  sbCtx.fillStyle = '#808080';
  sbCtx.fillRect(0, 0, 256, 256);

  // Deterministic pseudo-random speckles & subtle strata
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 900; i += 1) {
    const px = rand() * 256;
    const py = rand() * 256;
    const rad = 1 + rand() * 4.5;
    const shade = Math.floor(195 + rand() * 45);
    sCtx.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade - 12}, 0.24)`;
    sCtx.beginPath();
    sCtx.arc(px, py, rad, 0, Math.PI * 2);
    sCtx.fill();

    const bVal = Math.floor(90 + rand() * 85);
    sbCtx.fillStyle = `rgba(${bVal},${bVal},${bVal},0.35)`;
    sbCtx.beginPath();
    sbCtx.arc(px, py, rad * 0.9, 0, Math.PI * 2);
    sbCtx.fill();
  }

  // Subtle carved ashlar joints
  sCtx.strokeStyle = 'rgba(110, 102, 95, 0.14)';
  sCtx.lineWidth = 1.5;
  sbCtx.strokeStyle = 'rgba(40, 40, 40, 0.45)';
  sbCtx.lineWidth = 2;
  for (let row = 0; row < 4; row += 1) {
    const y = row * 64;
    sCtx.beginPath();
    sCtx.moveTo(0, y);
    sCtx.lineTo(256, y);
    sCtx.stroke();
    sbCtx.beginPath();
    sbCtx.moveTo(0, y);
    sbCtx.lineTo(256, y);
    sbCtx.stroke();
  }

  const stoneAlbedo = new THREE.CanvasTexture(stoneCanvas);
  stoneAlbedo.colorSpace = THREE.SRGBColorSpace;
  stoneAlbedo.wrapS = stoneAlbedo.wrapT = THREE.RepeatWrapping;
  stoneAlbedo.repeat.set(3, 3);
  stoneAlbedo.anisotropy = maxAnisotropy;

  const stoneBump = new THREE.CanvasTexture(stoneBumpCanvas);
  stoneBump.colorSpace = THREE.NoColorSpace;
  stoneBump.wrapS = stoneBump.wrapT = THREE.RepeatWrapping;
  stoneBump.repeat.set(3, 3);
  stoneBump.anisotropy = maxAnisotropy;

  // 2. Warm Cedar Woodgrain albedo + bump
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 256;
  woodCanvas.height = 256;
  const wCtx = woodCanvas.getContext('2d')!;
  wCtx.fillStyle = '#734F3A';
  wCtx.fillRect(0, 0, 256, 256);

  const woodBumpCanvas = document.createElement('canvas');
  woodBumpCanvas.width = 256;
  woodBumpCanvas.height = 256;
  const wbCtx = woodBumpCanvas.getContext('2d')!;
  wbCtx.fillStyle = '#808080';
  wbCtx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 2) {
    const wave = Math.sin(y * 0.08) * 10 + (rand() - 0.5) * 6;
    const r = Math.min(255, Math.max(40, Math.floor(112 + wave)));
    const g = Math.min(255, Math.max(30, Math.floor(78 + wave * 0.7)));
    const b = Math.min(255, Math.max(25, Math.floor(58 + wave * 0.5)));
    wCtx.fillStyle = `rgb(${r},${g},${b})`;
    wCtx.fillRect(0, y, 256, 2);

    const bv = Math.min(255, Math.max(0, Math.floor(128 + wave * 2.5)));
    wbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    wbCtx.fillRect(0, y, 256, 2);
  }

  const woodAlbedo = new THREE.CanvasTexture(woodCanvas);
  woodAlbedo.colorSpace = THREE.SRGBColorSpace;
  woodAlbedo.wrapS = woodAlbedo.wrapT = THREE.RepeatWrapping;
  woodAlbedo.repeat.set(2, 2);
  woodAlbedo.anisotropy = maxAnisotropy;

  const woodBump = new THREE.CanvasTexture(woodBumpCanvas);
  woodBump.colorSpace = THREE.NoColorSpace;
  woodBump.wrapS = woodBump.wrapT = THREE.RepeatWrapping;
  woodBump.repeat.set(2, 2);
  woodBump.anisotropy = maxAnisotropy;

  // 3. Soft radial contact shadow texture
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shCtx = shadowCanvas.getContext('2d')!;
  const grad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(18, 16, 36, 0.55)');
  grad.addColorStop(0.55, 'rgba(18, 16, 36, 0.22)');
  grad.addColorStop(1, 'rgba(18, 16, 36, 0.0)');
  shCtx.fillStyle = grad;
  shCtx.fillRect(0, 0, 128, 128);

  const contactShadow = new THREE.CanvasTexture(shadowCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;

  return {
    stoneAlbedo,
    stoneBump,
    woodAlbedo,
    woodBump,
    contactShadow,
    dispose: () => {
      stoneAlbedo.dispose();
      stoneBump.dispose();
      woodAlbedo.dispose();
      woodBump.dispose();
      contactShadow.dispose();
    },
  };
}

function createContactShadowMesh(
  radius: number,
  shadowTexture: THREE.CanvasTexture
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.025;
  return mesh;
}

/**
 * Composite 10-part Lantern Pavilion (THREE.Group, bottom-center pivoted at y=0).
 * Combines stepped stone plinth, 4 tapered cedar pillars with brushed brass collars,
 * cornice beam frame, LatheGeometry curved roof canopy, lotus finial, and glowing lantern.
 */
export function buildLanternPavilion(textures: ProceduralTextureSet): {
  group: THREE.Group;
  lanternMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  group.name = 'LanternPavilion';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe6e0d6,
    map: textures.stoneAlbedo,
    bumpMap: textures.stoneBump,
    bumpScale: 0.04,
    roughness: 0.86,
    metalness: 0.04,
  });

  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x7b5642,
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.03,
    roughness: 0.62,
    metalness: 0.06,
  });

  const roofTileMat = new THREE.MeshStandardMaterial({
    color: 0x302954,
    roughness: 0.36,
    metalness: 0.24,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd9b36c,
    roughness: 0.22,
    metalness: 0.88,
  });

  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d8,
    emissive: 0xffc66e,
    emissiveIntensity: 1.45,
    roughness: 0.48,
    metalness: 0.0,
  });

  // Soft grounded contact shadow
  group.add(createContactShadowMesh(2.4, textures.contactShadow));

  // Part 1 & 2: Two-tier octagonal stone plinth
  const plinthBottom = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.95, 0.26, 8),
    stoneMat
  );
  plinthBottom.position.y = 0.13;
  plinthBottom.castShadow = true;
  plinthBottom.receiveShadow = true;
  group.add(plinthBottom);

  const plinthTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.62, 0.22, 8),
    stoneMat
  );
  plinthTop.position.y = 0.37;
  plinthTop.castShadow = true;
  plinthTop.receiveShadow = true;
  group.add(plinthTop);

  // Part 3-6: Four beveled/tapered timber pillars with brass base collars
  const pillarRadius = 1.02;
  const pillarGeo = new THREE.CylinderGeometry(0.085, 0.11, 1.95, 14);
  const collarGeo = new THREE.CylinderGeometry(0.135, 0.145, 0.12, 14);

  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const px = Math.cos(angle) * pillarRadius;
    const pz = Math.sin(angle) * pillarRadius;

    const collar = new THREE.Mesh(collarGeo, brassMat);
    collar.position.set(px, 0.54, pz);
    collar.castShadow = true;
    group.add(collar);

    const pillar = new THREE.Mesh(pillarGeo, timberMat);
    pillar.position.set(px, 1.46, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  }

  // Part 7: Timber upper eave beam ring
  const beamRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.06, 0.075, 10, 32),
    timberMat
  );
  beamRing.rotation.x = Math.PI / 2;
  beamRing.position.y = 2.4;
  beamRing.castShadow = true;
  group.add(beamRing);

  // Part 8: Sweeping upturned sanctuary pagoda roof (LatheGeometry)
  const roofProfile = [
    new THREE.Vector2(0.04, 1.18),
    new THREE.Vector2(0.32, 0.94),
    new THREE.Vector2(0.85, 0.55),
    new THREE.Vector2(1.48, 0.22),
    new THREE.Vector2(1.96, 0.06),
    new THREE.Vector2(2.08, 0.12),
    new THREE.Vector2(1.92, -0.02),
    new THREE.Vector2(1.25, 0.06),
    new THREE.Vector2(0.12, 0.62),
  ];
  const roofGeo = new THREE.LatheGeometry(roofProfile, 8);
  roofGeo.computeVertexNormals();
  const roofMesh = new THREE.Mesh(roofGeo, roofTileMat);
  roofMesh.position.y = 2.38;
  roofMesh.rotation.y = Math.PI / 8;
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  group.add(roofMesh);

  // Part 9: Brushed brass lotus finial atop roof
  const finialProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.05),
    new THREE.Vector2(0.14, 0.18),
    new THREE.Vector2(0.2, 0.34),
    new THREE.Vector2(0.08, 0.52),
    new THREE.Vector2(0.0, 0.68),
  ];
  const finialMesh = new THREE.Mesh(new THREE.LatheGeometry(finialProfile, 16), brassMat);
  finialMesh.position.y = 3.52;
  finialMesh.castShadow = true;
  group.add(finialMesh);

  // Part 10: Suspended glowing paper lantern + brass cap inside pavilion
  const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.1, 12), brassMat);
  lanternCap.position.y = 2.15;
  group.add(lanternCap);

  const lanternCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.48, 12),
    lanternMat
  );
  lanternCore.position.y = 1.88;
  group.add(lanternCore);

  return { group, lanternMat };
}

/**
 * Composite 8-part Sacred Hydration Basin (THREE.Group, bottom-center pivoted at y=0).
 * Its rising water spire & glowing lotus blooms reflect the user's real 30-day average hydration.
 */
export function buildHydrationBasin(
  textures: ProceduralTextureSet,
  hydrationRatio: number,
  isSoftwareGl: boolean
): {
  group: THREE.Group;
  waterSpire: THREE.Mesh;
  rippleRing: THREE.Mesh;
  lotusGroup: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'HydrationBasin';

  const clampedRatio = THREE.MathUtils.clamp(hydrationRatio, 0.18, 1.25);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe3ded6,
    map: textures.stoneAlbedo,
    bumpMap: textures.stoneBump,
    bumpScale: 0.03,
    roughness: 0.84,
    metalness: 0.05,
  });

  const ceramicMat = new THREE.MeshPhysicalMaterial({
    color: 0x5c47b8,
    roughness: 0.24,
    metalness: 0.08,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xdfb976,
    roughness: 0.2,
    metalness: 0.9,
  });

  const waterSurfaceMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bfd0,
    emissive: 0x165e70,
    emissiveIntensity: 0.35,
    roughness: 0.08,
    metalness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.72,
    ior: 1.33,
    thickness: 0.8,
    transparent: true,
    opacity: isSoftwareGl ? 0.76 : 0.94,
    clearcoat: 1.0,
  });

  const spireMat = new THREE.MeshPhysicalMaterial({
    color: 0x6ce3ee,
    emissive: 0x269fb0,
    emissiveIntensity: 0.55,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1.0,
    depthWrite: false,
  });

  // Soft contact shadow
  group.add(createContactShadowMesh(2.05, textures.contactShadow));

  // Part 1: Carved octagonal stone base
  const baseSlab = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.66, 0.22, 8), stoneMat);
  baseSlab.position.y = 0.11;
  baseSlab.castShadow = true;
  baseSlab.receiveShadow = true;
  group.add(baseSlab);

  // Part 2: Fluted ceramic pedestal
  const pedestalProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.75, 0.0),
    new THREE.Vector2(0.54, 0.24),
    new THREE.Vector2(0.46, 0.52),
    new THREE.Vector2(0.62, 0.72),
    new THREE.Vector2(1.26, 0.92),
    new THREE.Vector2(1.44, 1.24),
    new THREE.Vector2(1.32, 1.28),
    new THREE.Vector2(1.16, 0.98),
    new THREE.Vector2(0.0, 0.92),
  ];
  const basinGeo = new THREE.LatheGeometry(pedestalProfile, 36);
  basinGeo.computeVertexNormals();
  const basinMesh = new THREE.Mesh(basinGeo, ceramicMat);
  basinMesh.position.y = 0.2;
  basinMesh.castShadow = true;
  basinMesh.receiveShadow = true;
  group.add(basinMesh);

  // Part 3: Brushed brass lip ring around bowl
  const brassRim = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.045, 14, 48), brassMat);
  brassRim.rotation.x = Math.PI / 2;
  brassRim.position.y = 1.46;
  brassRim.castShadow = true;
  group.add(brassRim);

  // Part 4: Tranquil aqua water disc inside basin
  const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.2, 0.1, 36), waterSurfaceMat);
  waterDisc.position.y = 1.33;
  waterDisc.receiveShadow = true;
  group.add(waterDisc);

  // Part 5: Animated concentric ripple ring
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xbff7ff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const rippleRing = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.34, 32), rippleMat);
  rippleRing.rotation.x = -Math.PI / 2;
  rippleRing.position.y = 1.405;
  group.add(rippleRing);

  // Part 6: Rising crystalline hydration tide spire (Lathe droplet)
  const spireHeight = 0.55 + clampedRatio * 0.95;
  const dropletProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.22, 0.12),
    new THREE.Vector2(0.28, 0.32),
    new THREE.Vector2(0.18, 0.68),
    new THREE.Vector2(0.05, 0.94),
    new THREE.Vector2(0.0, 1.0),
  ];
  const waterSpire = new THREE.Mesh(new THREE.LatheGeometry(dropletProfile, 24), spireMat);
  waterSpire.scale.set(1, spireHeight, 1);
  waterSpire.position.y = 1.38;
  waterSpire.renderOrder = 3;
  group.add(waterSpire);

  // Part 7 & 8: Two floating multi-petal lotus blossoms
  const lotusGroup = new THREE.Group();
  lotusGroup.position.y = 1.4;
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xf4e8ff,
    emissive: 0x6c4fe0,
    emissiveIntensity: 0.18,
    roughness: 0.45,
    metalness: 0.02,
  });
  const stamenMat = new THREE.MeshStandardMaterial({
    color: 0xf5c469,
    emissive: 0xd89634,
    emissiveIntensity: 0.35,
    roughness: 0.35,
  });
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x2f8776,
    roughness: 0.65,
  });

  const lotusOffsets: [number, number, number][] = [
    [0.64, 0.0, 0.42],
    [-0.58, 0.0, -0.44],
  ];

  lotusOffsets.forEach(([lx, ly, lz], idx) => {
    const flower = new THREE.Group();
    flower.position.set(lx, ly, lz);
    flower.scale.setScalar(idx === 0 ? 1.0 : 0.82);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 16), padMat);
    flower.add(pad);

    const petalGeo = new THREE.ConeGeometry(0.075, 0.2, 6);
    for (let p = 0; p < 6; p += 1) {
      const angle = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.09, 0.06, Math.sin(angle) * 0.09);
      petal.rotation.z = -Math.cos(angle) * 0.58;
      petal.rotation.x = Math.sin(angle) * 0.58;
      flower.add(petal);
    }

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), stamenMat);
    core.position.y = 0.07;
    flower.add(core);

    lotusGroup.add(flower);
  });

  group.add(lotusGroup);

  return { group, waterSpire, rippleRing, lotusGroup };
}

/**
 * Composite 8-part Stylized Coastal Blossom Tree (THREE.Group, bottom-center pivoted at y=0).
 * Uses curved TubeGeometry trunks & branches plus layered multi-lobe blossom crowns.
 */
export function buildBlossomTree(
  textures: ProceduralTextureSet,
  variant: number,
  bloomScale: number
): THREE.Group {
  const group = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4338,
    map: textures.woodAlbedo,
    bumpMap: textures.woodBump,
    bumpScale: 0.04,
    roughness: 0.88,
    metalness: 0.02,
  });

  const canopyPalette = [0x9f85f7, 0xc3b2ff, 0x76ced9, 0xe4d5ff];
  const mainColor = canopyPalette[variant % canopyPalette.length];
  const accentColor = canopyPalette[(variant + 1) % canopyPalette.length];

  const canopyPrimaryMat = new THREE.MeshStandardMaterial({
    color: mainColor,
    roughness: 0.72,
    metalness: 0.04,
  });

  const canopyAccentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.54,
    metalness: 0.06,
  });

  // Ground contact shadow
  group.add(createContactShadowMesh(1.55 * bloomScale, textures.contactShadow));

  // Part 1: Root flare seated flush on terrain
  const rootBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.32, 10), barkMat);
  rootBase.position.y = 0.14;
  rootBase.castShadow = true;
  rootBase.receiveShadow = true;
  group.add(rootBase);

  // Part 2: Curved organic trunk via TubeGeometry
  const sway = (variant % 2 === 0 ? 1 : -1) * 0.28;
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(sway * 0.5, 0.9, sway * 0.25),
    new THREE.Vector3(sway, 1.9, -sway * 0.2),
    new THREE.Vector3(sway * 0.65, 2.75, 0.08),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 18, 0.14, 10, false);
  const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // Parts 3 & 4: Two curved secondary branches
  const branchSpecs = [
    [
      new THREE.Vector3(sway * 0.8, 1.75, -0.05),
      new THREE.Vector3(sway + 0.62, 2.25, 0.35),
      new THREE.Vector3(sway + 1.05, 2.5, 0.55),
    ],
    [
      new THREE.Vector3(sway * 0.7, 1.95, 0.05),
      new THREE.Vector3(sway - 0.55, 2.42, -0.38),
      new THREE.Vector3(sway - 0.95, 2.68, -0.58),
    ],
  ];

  branchSpecs.forEach((pts) => {
    const bGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.065, 8, false);
    const bMesh = new THREE.Mesh(bGeo, barkMat);
    bMesh.castShadow = true;
    group.add(bMesh);
  });

  // Parts 5-8: Four layered multi-scale blossom canopy clusters
  const crownNodes: { pos: [number, number, number]; scale: [number, number, number]; accent?: boolean }[] = [
    { pos: [sway * 0.65, 3.05, 0.08], scale: [1.18, 0.72, 1.08] },
    { pos: [sway + 1.02, 2.65, 0.54], scale: [0.85, 0.56, 0.82], accent: true },
    { pos: [sway - 0.92, 2.82, -0.54], scale: [0.88, 0.58, 0.84] },
    { pos: [sway * 0.3, 3.42, -0.15], scale: [0.76, 0.52, 0.72], accent: true },
  ];

  const lobeGeo = new THREE.IcosahedronGeometry(0.75, 2);
  crownNodes.forEach((node) => {
    const lobe = new THREE.Mesh(
      lobeGeo,
      node.accent ? canopyAccentMat : canopyPrimaryMat
    );
    lobe.position.set(...node.pos);
    lobe.scale.set(
      node.scale[0] * bloomScale,
      node.scale[1] * bloomScale,
      node.scale[2] * bloomScale
    );
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  });

  return group;
}

/**
 * Builds the natural terraced coastal island, extended horizon ocean (with onBeforeCompile
 * PBR wave shimmer), and surrounding coastal rock sea-stacks (zero floating indoor walls).
 */
export function buildCoastalIslandAndOcean(textures: ProceduralTextureSet): {
  group: THREE.Group;
  oceanUniforms: { uTime: { value: number } };
} {
  const group = new THREE.Group();
  group.name = 'CoastalTerrainAndOcean';

  // Sculpted island terrain geometry matching analytical groundHeightAt(x, z)
  const islandGeo = new THREE.PlaneGeometry(28, 28, 64, 64);
  islandGeo.rotateX(-Math.PI / 2);
  const posAttr = islandGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const mossColor = new THREE.Color(0x528e7d);
  const stoneShoreColor = new THREE.Color(0xd2c9ba);
  const meadowColor = new THREE.Color(0x66a388);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i += 1) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = groundHeightAt(x, z);
    posAttr.setY(i, y);

    const r = Math.hypot(x, z);
    if (r < 6.4) {
      tmpColor.copy(meadowColor).lerp(mossColor, r / 6.4);
    } else if (r < 9.5) {
      tmpColor.copy(mossColor).lerp(stoneShoreColor, (r - 6.4) / 3.1);
    } else {
      tmpColor.copy(stoneShoreColor);
    }
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }
  islandGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  islandGeo.computeVertexNormals();

  const islandMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: textures.stoneAlbedo,
    bumpMap: textures.stoneBump,
    bumpScale: 0.05,
    roughness: 0.86,
    metalness: 0.02,
  });

  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.receiveShadow = true;
  group.add(islandMesh);

  // Central carved circular stone courtyard terrace seated neatly atop plateau
  const courtY = groundHeightAt(0, 0) + 0.02;
  const courtyard = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.45, 0.14, 48),
    new THREE.MeshStandardMaterial({
      color: 0xeae4d8,
      map: textures.stoneAlbedo,
      bumpMap: textures.stoneBump,
      bumpScale: 0.025,
      roughness: 0.78,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  courtyard.position.y = courtY - 0.04;
  courtyard.receiveShadow = true;
  group.add(courtyard);

  // Extended Horizon Ocean Plane with PBR onBeforeCompile gentle wave displacement
  const oceanUniforms = { uTime: { value: 0 } };
  const oceanGeo = new THREE.PlaneGeometry(240, 240, 96, 96);
  oceanGeo.rotateX(-Math.PI / 2);

  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x267598,
    roughness: 0.18,
    metalness: 0.22,
    transparent: true,
    opacity: 0.92,
  });

  oceanMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = oceanUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        varying float vWaveHeight;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float distFromCenter = length(transformed.xz);
        float swell = sin(transformed.x * 0.22 + uTime * 0.85) * cos(transformed.z * 0.18 - uTime * 0.65) * 0.08;
        float ripple = sin(distFromCenter * 0.55 - uTime * 1.45) * 0.035;
        transformed.y += swell + ripple;
        vWaveHeight = swell + ripple;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vWaveHeight;`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 crestTint = vec3(0.32, 0.78, 0.86);
        diffuseColor.rgb = mix(diffuseColor.rgb, crestTint, smoothstep(0.01, 0.11, vWaveHeight) * 0.35);`
      );
  };

  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.position.y = 0.08;
  oceanMesh.receiveShadow = true;
  group.add(oceanMesh);

  // Natural Outer Coastal Sea-Stacks (6 multi-boulder formations framing the distant perimeter)
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x5c677d,
    map: textures.stoneAlbedo,
    bumpMap: textures.stoneBump,
    bumpScale: 0.06,
    roughness: 0.9,
    metalness: 0.05,
  });
  const boulderGeo = new THREE.DodecahedronGeometry(1.0, 1);

  const seaStackCoords: [number, number, number][] = [
    [-16, -13, 2.3],
    [17, -14, 2.8],
    [-19, 8, 2.1],
    [19, 10, 2.4],
    [2, -21, 3.0],
    [-9, 18, 2.0],
  ];

  seaStackCoords.forEach(([sx, sz, sScale], idx) => {
    const cluster = new THREE.Group();
    cluster.position.set(sx, -0.35, sz);
    for (let b = 0; b < 3; b += 1) {
      const m = new THREE.Mesh(boulderGeo, rockMat);
      const angle = (b / 3) * Math.PI * 2 + idx;
      const rad = b === 0 ? 0 : sScale * 0.55;
      m.position.set(Math.cos(angle) * rad, b === 0 ? sScale * 0.45 : sScale * 0.18, Math.sin(angle) * rad);
      m.scale.set(
        sScale * (b === 0 ? 1.0 : 0.62),
        sScale * (b === 0 ? 1.25 : 0.52),
        sScale * (b === 0 ? 0.9 : 0.68)
      );
      m.rotation.set(idx * 0.4, angle, b * 0.3);
      m.castShadow = true;
      m.receiveShadow = true;
      cluster.add(m);
    }
    group.add(cluster);
  });

  return { group, oceanUniforms };
}

/**
 * InstancedMesh repeated details (>20 instances each) with per-instance scale (±15%)
 * and setColorAt tint variation, grounded accurately via groundHeightAt(x, z).
 */
export function buildInstancedSanctuaryDetails(stageIndex: number): {
  group: THREE.Group;
  motesMesh: THREE.InstancedMesh;
  moteBaseData: { x: number; y: number; z: number; phase: number; speed: number; scale: number }[];
} {
  const group = new THREE.Group();
  group.name = 'InstancedSanctuaryDetails';

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let seed = 4201;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // 1. 64 Coastal Pebbles around terrace & shore
  const pebbleCount = 64;
  const pebbleGeo = new THREE.DodecahedronGeometry(0.18, 1);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.04,
  });
  const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
  pebbleMesh.castShadow = false;
  pebbleMesh.receiveShadow = true;

  for (let i = 0; i < pebbleCount; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 5.4 + rand() * 4.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = groundHeightAt(x, z);
    const s = 0.85 + rand() * 0.3; // ±15% variation
    dummy.position.set(x, y + 0.04 * s, z);
    dummy.rotation.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4);
    dummy.scale.set(s * (0.9 + rand() * 0.4), s * 0.55, s * (0.9 + rand() * 0.4));
    dummy.updateMatrix();
    pebbleMesh.setMatrixAt(i, dummy.matrix);

    const tone = 0.72 + rand() * 0.22;
    tint.setRGB(tone, tone * 0.98, tone * 0.94);
    pebbleMesh.setColorAt(i, tint);
  }
  pebbleMesh.instanceMatrix.needsUpdate = true;
  if (pebbleMesh.instanceColor) pebbleMesh.instanceColor.needsUpdate = true;
  pebbleMesh.computeBoundingSphere();
  group.add(pebbleMesh);

  // 2. 110 Shoreline Grass / Coastal Reed Blades
  const reedCount = 110;
  const reedGeo = new THREE.ConeGeometry(0.038, 0.46, 5);
  reedGeo.translate(0, 0.23, 0);
  const reedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.76,
    metalness: 0.02,
  });
  const reedMesh = new THREE.InstancedMesh(reedGeo, reedMat, reedCount);
  for (let i = 0; i < reedCount; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 5.5 + rand() * 3.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = groundHeightAt(x, z);
    const s = 0.85 + rand() * 0.35;
    dummy.position.set(x, y - 0.02, z);
    dummy.rotation.set((rand() - 0.5) * 0.28, rand() * Math.PI * 2, (rand() - 0.5) * 0.28);
    dummy.scale.set(s, s * (0.85 + rand() * 0.55), s);
    dummy.updateMatrix();
    reedMesh.setMatrixAt(i, dummy.matrix);

    tint.setHSL(0.42 + (rand() - 0.5) * 0.06, 0.42, 0.42 + rand() * 0.16);
    reedMesh.setColorAt(i, tint);
  }
  reedMesh.instanceMatrix.needsUpdate = true;
  if (reedMesh.instanceColor) reedMesh.instanceColor.needsUpdate = true;
  reedMesh.computeBoundingSphere();
  group.add(reedMesh);

  // 3. 72 Floating Blossom Petals & Serene Light Motes (animated)
  const moteCount = Math.min(72, 28 + stageIndex * 11);
  const moteGeo = new THREE.OctahedronGeometry(0.055, 0);
  const moteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xb9a8ff,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.1,
  });
  const motesMesh = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  motesMesh.frustumCulled = false;

  const moteBaseData: {
    x: number;
    y: number;
    z: number;
    phase: number;
    speed: number;
    scale: number;
  }[] = [];

  for (let i = 0; i < moteCount; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 1.4 + rand() * 7.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 1.5 + rand() * 3.6;
    const scale = 0.7 + rand() * 0.65;
    moteBaseData.push({
      x,
      y,
      z,
      phase: rand() * Math.PI * 2,
      speed: 0.45 + rand() * 0.65,
      scale,
    });
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    motesMesh.setMatrixAt(i, dummy.matrix);

    const palettePick = i % 3;
    if (palettePick === 0) tint.setHex(0xd6c7ff);
    else if (palettePick === 1) tint.setHex(0x88ecf5);
    else tint.setHex(0xffe4b3);
    motesMesh.setColorAt(i, tint);
  }
  motesMesh.instanceMatrix.needsUpdate = true;
  if (motesMesh.instanceColor) motesMesh.instanceColor.needsUpdate = true;
  group.add(motesMesh);

  return { group, motesMesh, moteBaseData };
}

/**
 * 30-Day Hydration Tide Crystal Ring.
 * Renders 30 composite 3-part shoreline tide crystals (stone socket + brass collar + crystal prism)
 * whose height and aqua/violet glow represent each of the user's real last 30 days of hydration.
 * Includes raycast proxy cylinders on layer 1 for smooth interactive day inspection.
 */
export function buildHydration30DayRing(
  days: Hydration30DayPoint[],
  textures: ProceduralTextureSet
): {
  group: THREE.Group;
  hitProxies: THREE.Mesh[];
  crystalMeshes: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.name = 'Hydration30DayRing';

  const socketMat = new THREE.MeshStandardMaterial({
    color: 0xd9d2c7,
    map: textures.stoneAlbedo,
    roughness: 0.85,
    metalness: 0.04,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xdab46c,
    roughness: 0.24,
    metalness: 0.88,
  });

  const socketGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.14, 6);
  const collarGeo = new THREE.CylinderGeometry(0.17, 0.2, 0.06, 6);
  const hitGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.9, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  const hitProxies: THREE.Mesh[] = [];
  const crystalMeshes: THREE.Mesh[] = [];

  const count = days.length;
  const arcStart = -Math.PI * 0.82;
  const arcEnd = Math.PI * 0.82;
  const ringRadius = 6.75;

  days.forEach((day, idx) => {
    const t = count > 1 ? idx / (count - 1) : 0.5;
    const angle = THREE.MathUtils.lerp(arcStart, arcEnd, t) + Math.PI * 0.5;
    const x = Math.cos(angle) * ringRadius;
    const z = Math.sin(angle) * ringRadius;
    const groundY = groundHeightAt(x, z);

    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, groundY, z);
    pillarGroup.rotation.y = -angle;

    // Part 1: Hexagonal carved stone socket seated flush on island
    const socket = new THREE.Mesh(socketGeo, socketMat);
    socket.position.y = 0.06;
    socket.receiveShadow = true;
    pillarGroup.add(socket);

    // Part 2: Brass collar
    const collar = new THREE.Mesh(collarGeo, brassMat);
    collar.position.y = 0.15;
    pillarGroup.add(collar);

    // Part 3: Sculpted hydration crystal prism scaled by real daily intake ratio
    const crystalHeight = day.ml > 0 ? 0.26 + Math.min(day.goalRatio, 1.35) * 1.15 : 0.14;
    const crystalGeo = new THREE.CylinderGeometry(0.06, 0.14, crystalHeight, 6);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: day.ml === 0 ? 0x8e889f : day.goalMet ? 0x36b5c4 : 0x7b5ef0,
      emissive: day.ml === 0 ? 0x1a1c2e : day.goalMet ? 0x1a7f8c : 0x3f2d8c,
      emissiveIntensity: day.isToday ? 0.85 : day.goalMet ? 0.45 : 0.22,
      roughness: day.ml === 0 ? 0.65 : 0.18,
      metalness: 0.1,
      clearcoat: day.ml > 0 ? 0.9 : 0.1,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 0.18 + crystalHeight / 2;
    crystal.castShadow = true;
    crystal.userData = {
      dayIndex: idx,
      baseEmissiveIntensity: crystalMat.emissiveIntensity,
    };
    pillarGroup.add(crystal);
    crystalMeshes.push(crystal);

    // Simplified invisible hit proxy on layer 1 for zero-lag raycasting
    const proxy = new THREE.Mesh(hitGeo, hitMat);
    proxy.position.y = 0.95;
    proxy.layers.set(1);
    proxy.userData = { dayPoint: day, dayIndex: idx };
    pillarGroup.add(proxy);
    hitProxies.push(proxy);

    group.add(pillarGroup);
  });

  return { group, hitProxies, crystalMeshes };
}
