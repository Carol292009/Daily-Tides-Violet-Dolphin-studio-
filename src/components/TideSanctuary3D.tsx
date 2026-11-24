import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { GardenStageInfo, MeasurementUnit } from '../types/dailyTide';
import { Hydration30DayPoint, formatVolume } from '../data/localStore';
import {
  buildBlossomTree,
  buildCoastalIslandAndOcean,
  buildHydration30DayRing,
  buildHydrationBasin,
  buildInstancedSanctuaryDetails,
  buildLanternPavilion,
  createSanctuaryTextures,
  groundHeightAt,
} from '../three/sanctuaryBuilders';

interface TideSanctuary3DProps {
  gardenStage: GardenStageInfo;
  totalTidePoints: number;
  last30Days: Hydration30DayPoint[];
  unit: MeasurementUnit;
  onClose: () => void;
}

type CameraPresetId = 'overview' | 'basin' | 'ring' | 'pavilion';
type LightingMoodId = 'morning' | 'dusk' | 'midnight';

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; position: [number, number, number]; target: [number, number, number] }
> = {
  overview: {
    label: 'Overview',
    position: [12.5, 8.2, 13.5],
    target: [0, 1.5, 0],
  },
  basin: {
    label: 'Hydration Basin',
    position: [4.2, 3.6, 5.4],
    target: [0, 1.9, 1.3],
  },
  ring: {
    label: '30-Day Ring',
    position: [0.5, 6.4, 13.8],
    target: [0, 1.2, 4.2],
  },
  pavilion: {
    label: 'Lantern Shrine',
    position: [-5.6, 4.2, -5.8],
    target: [0, 2.2, -2.5],
  },
};

const LIGHTING_MOODS: Record<
  LightingMoodId,
  {
    label: string;
    skyHex: number;
    fogDensity: number;
    keyColor: number;
    keyIntensity: number;
    hemiSky: number;
    hemiGround: number;
    hemiIntensity: number;
    lanternIntensity: number;
    exposure: number;
  }
> = {
  morning: {
    label: 'Morning Tide',
    skyHex: 0xdbeaf5,
    fogDensity: 0.014,
    keyColor: 0xfff0d4,
    keyIntensity: 2.3,
    hemiSky: 0xaad9f5,
    hemiGround: 0x5c586e,
    hemiIntensity: 1.05,
    lanternIntensity: 0.9,
    exposure: 1.08,
  },
  dusk: {
    label: 'Golden Dusk',
    skyHex: 0xe6c7c2,
    fogDensity: 0.016,
    keyColor: 0xffb87a,
    keyIntensity: 2.1,
    hemiSky: 0xd4a8e8,
    hemiGround: 0x453b5e,
    hemiIntensity: 0.95,
    lanternIntensity: 1.85,
    exposure: 1.04,
  },
  midnight: {
    label: 'Midnight Glow',
    skyHex: 0x161b33,
    fogDensity: 0.018,
    keyColor: 0x9ab8ff,
    keyIntensity: 1.25,
    hemiSky: 0x4e66a8,
    hemiGround: 0x1c1a30,
    hemiIntensity: 0.72,
    lanternIntensity: 2.7,
    exposure: 1.0,
  },
};

// Module-scope scratch math objects (zero allocations inside render loop)
const _scratchDummy = new THREE.Object3D();
const _scratchColor = new THREE.Color();
const _scratchSky = new THREE.Color();
const _scratchKeyColor = new THREE.Color();
const _scratchHemiSky = new THREE.Color();
const _scratchHemiGround = new THREE.Color();
const _rayMouse = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * 100% offline procedural Web Audio coastal wave ambience synthesizer (zero external audio files).
 */
class ProceduralOceanAmbience {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private source: AudioBufferSourceNode | null = null;

  start(): void {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Warm pink/brown noise for soft ocean shoreline surf
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.06;

    // Gentle wave tide swell LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    noise.start();
    lfo.start();

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.lfo = lfo;
    this.source = noise;
  }

  playCrystalChime(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0];
    osc.type = 'sine';
    osc.frequency.value = pentatonic[Math.floor(Math.random() * pentatonic.length)];
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  stop(): void {
    try {
      this.source?.stop();
      this.lfo?.stop();
      this.masterGain?.disconnect();
      void this.ctx?.close();
    } catch {
      // Ignore Web Audio teardown errors
    }
    this.ctx = null;
    this.masterGain = null;
    this.lfo = null;
    this.source = null;
  }
}

export const TideSanctuary3D: React.FC<TideSanctuary3DProps> = ({
  gardenStage,
  totalTidePoints,
  last30Days,
  unit,
  onClose,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPresetId>('overview');
  const [activeMood, setActiveMood] = useState<LightingMoodId>('morning');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [inspectedDay, setInspectedDay] = useState<Hydration30DayPoint | null>(
    () => last30Days[last30Days.length - 1] ?? null
  );

  // Mutable refs so React UI updates never tear down the WebGLRenderer
  const desiredCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const desiredTargetRef = useRef<THREE.Vector3 | null>(null);
  const desiredMoodRef = useRef<LightingMoodId>('morning');
  const selectedDayIndexRef = useRef<number>(Math.max(0, last30Days.length - 1));
  const audioSynthRef = useRef<ProceduralOceanAmbience | null>(null);
  const onSelectDayRef = useRef<(day: Hydration30DayPoint) => void>(() => {});
  onSelectDayRef.current = (day) => {
    setInspectedDay(day);
    audioSynthRef.current?.playCrystalChime();
  };

  // Keyboard shortcuts: H toggles dock, Escape closes sanctuary
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Toggle offline procedural ocean soundscape
  useEffect(() => {
    if (!audioSynthRef.current) {
      audioSynthRef.current = new ProceduralOceanAmbience();
    }
    if (audioEnabled) {
      audioSynthRef.current.start();
    } else {
      audioSynthRef.current.stop();
    }
    return () => {
      audioSynthRef.current?.stop();
    };
  }, [audioEnabled]);

  const handleSelectCameraPreset = (presetId: CameraPresetId) => {
    setActivePreset(presetId);
    const preset = CAMERA_PRESETS[presetId];
    desiredCameraPosRef.current = new THREE.Vector3(...preset.position);
    desiredTargetRef.current = new THREE.Vector3(...preset.target);
  };

  const handleSelectMood = (moodId: LightingMoodId) => {
    setActiveMood(moodId);
    desiredMoodRef.current = moodId;
  };

  // Stable Three.js WebGL initialization (runs once per mount)
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = LIGHTING_MOODS.morning.exposure;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialMood = LIGHTING_MOODS.morning;
    const skyColor = new THREE.Color(initialMood.skyHex);
    scene.background = skyColor;
    const fog = new THREE.FogExp2(initialMood.skyHex, initialMood.fogDensity);
    scene.fog = fog;

    // Mandatory studio PBR environment map via RoomEnvironment + PMREMGenerator on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.2, 220);
    camera.position.set(...CAMERA_PRESETS.overview.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.2;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minPolarAngle = 0.22;
    controls.update();

    // Cancel scripted camera transition immediately when user interacts
    const cancelScriptedCamera = () => {
      desiredCameraPosRef.current = null;
      desiredTargetRef.current = null;
    };
    controls.addEventListener('start', cancelScriptedCamera);

    // 3-Point Studio Lighting Rig (warm key + cool hemisphere fill + soft rim)
    const keyLight = new THREE.DirectionalLight(initialMood.keyColor, initialMood.keyIntensity);
    keyLight.position.set(11, 16, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 42;
    const frustum = 14;
    keyLight.shadow.camera.left = -frustum;
    keyLight.shadow.camera.right = frustum;
    keyLight.shadow.camera.top = frustum;
    keyLight.shadow.camera.bottom = -frustum;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(
      initialMood.hemiSky,
      initialMood.hemiGround,
      initialMood.hemiIntensity
    );
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x88b4ff, 0.55);
    rimLight.position.set(-10, 7, -12);
    scene.add(rimLight);

    // Build procedural textures & composite 3D sanctuary models
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures = createSanctuaryTextures(maxAniso);

    const { group: terrainGroup, oceanUniforms } = buildCoastalIslandAndOcean(textures);
    scene.add(terrainGroup);

    // Lantern Pavilion seated flush on northern sanctuary terrace
    const { group: pavilionGroup, lanternMat } = buildLanternPavilion(textures);
    const pavX = 0;
    const pavZ = -2.55;
    pavilionGroup.position.set(pavX, groundHeightAt(pavX, pavZ) + 0.02, pavZ);
    scene.add(pavilionGroup);

    // Sacred Hydration Basin seated flush on central-front courtyard
    const avgRatio =
      last30Days.length > 0
        ? last30Days.reduce((sum, d) => sum + d.goalRatio, 0) / last30Days.length
        : 0.65;
    const {
      group: basinGroup,
      waterSpire,
      rippleRing,
      lotusGroup,
    } = buildHydrationBasin(textures, avgRatio, isSoftwareGl);
    const basinX = 0;
    const basinZ = 1.45;
    basinGroup.position.set(basinX, groundHeightAt(basinX, basinZ) + 0.02, basinZ);
    scene.add(basinGroup);

    // Blossom trees scaled & populated by the user's real Garden Stage (1..5)
    const treePlacements: [number, number, number][] = [
      [-4.1, -1.6, 1.05],
      [4.2, -1.3, 0.96],
      [-3.7, 2.7, 0.88],
      [3.9, 2.5, 0.92],
      [0.2, -6.1, 1.12],
    ];
    const visibleTreeCount = Math.min(treePlacements.length, Math.max(2, gardenStage.stageIndex + 1));
    const stageBloomScale = 0.78 + gardenStage.stageIndex * 0.08;
    for (let tIdx = 0; tIdx < visibleTreeCount; tIdx += 1) {
      const [tx, tz, scaleMult] = treePlacements[tIdx];
      const tree = buildBlossomTree(textures, tIdx, stageBloomScale * scaleMult);
      tree.position.set(tx, groundHeightAt(tx, tz), tz);
      tree.rotation.y = tIdx * 1.4;
      scene.add(tree);
    }

    // InstancedMesh coastal pebbles, reeds, and drifting blossom motes
    const { group: instancedGroup, motesMesh, moteBaseData } =
      buildInstancedSanctuaryDetails(gardenStage.stageIndex);
    scene.add(instancedGroup);

    // 30-Day Hydration Tide Crystal Ring
    const { group: ringGroup, hitProxies, crystalMeshes } = buildHydration30DayRing(
      last30Days,
      textures
    );
    scene.add(ringGroup);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting on dedicated layer 1 (throttled pointermove + click)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let lastHoverCheck = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;

    const updateRayFromPointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_rayMouse, camera);
      return raycaster.intersectObjects(hitProxies, false);
    };

    const onPointerMove = (e: PointerEvent) => {
      const nowMs = performance.now();
      if (nowMs - lastHoverCheck < 55) return;
      lastHoverCheck = nowMs;
      const hits = updateRayFromPointer(e);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (moved > 8) return; // Ignore orbit drag
      const hits = updateRayFromPointer(e);
      if (hits.length > 0) {
        const hitData = hits[0].object.userData as {
          dayPoint?: Hydration30DayPoint;
          dayIndex?: number;
        };
        if (hitData.dayPoint && typeof hitData.dayIndex === 'number') {
          selectedDayIndexRef.current = hitData.dayIndex;
          onSelectDayRef.current(hitData.dayPoint);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const nextW = container.clientWidth || window.innerWidth;
      const nextH = container.clientHeight || window.innerHeight;
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    // Continuous 60fps loop with software-WebGL fence pacing (`afterDraw`)
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;

      const dt = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();

      // 1. Animate ocean wave shader uniform
      oceanUniforms.uTime.value = elapsed;

      // 2. Smoothly damp lighting atmosphere transitions
      const targetMood = LIGHTING_MOODS[desiredMoodRef.current];
      const dampFactor = 1 - Math.exp(-3.4 * dt);

      _scratchSky.setHex(targetMood.skyHex);
      skyColor.lerp(_scratchSky, dampFactor);
      fog.color.copy(skyColor);
      fog.density = THREE.MathUtils.damp(fog.density, targetMood.fogDensity, 3.4, dt);

      _scratchKeyColor.setHex(targetMood.keyColor);
      keyLight.color.lerp(_scratchKeyColor, dampFactor);
      keyLight.intensity = THREE.MathUtils.damp(
        keyLight.intensity,
        targetMood.keyIntensity,
        3.4,
        dt
      );

      _scratchHemiSky.setHex(targetMood.hemiSky);
      _scratchHemiGround.setHex(targetMood.hemiGround);
      hemiLight.color.lerp(_scratchHemiSky, dampFactor);
      hemiLight.groundColor.lerp(_scratchHemiGround, dampFactor);
      hemiLight.intensity = THREE.MathUtils.damp(
        hemiLight.intensity,
        targetMood.hemiIntensity,
        3.4,
        dt
      );

      lanternMat.emissiveIntensity = THREE.MathUtils.damp(
        lanternMat.emissiveIntensity,
        targetMood.lanternIntensity + Math.sin(elapsed * 2.1) * 0.12,
        4.0,
        dt
      );
      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        targetMood.exposure,
        3.4,
        dt
      );

      // 3. Smooth damped camera preset transitions (cancel on arrival)
      if (desiredCameraPosRef.current && desiredTargetRef.current) {
        camera.position.lerp(desiredCameraPosRef.current, 1 - Math.exp(-5.0 * dt));
        controls.target.lerp(desiredTargetRef.current, 1 - Math.exp(-5.0 * dt));
        if (
          camera.position.distanceTo(desiredCameraPosRef.current) < 0.05 &&
          controls.target.distanceTo(desiredTargetRef.current) < 0.05
        ) {
          desiredCameraPosRef.current = null;
          desiredTargetRef.current = null;
        }
      }

      // 4. Gentle breathing animation on Hydration Basin spire, ripple, and lotus
      waterSpire.rotation.y = elapsed * 0.35;
      const rippleCycle = (elapsed * 0.42) % 1;
      const rippleScale = 0.8 + rippleCycle * 2.4;
      rippleRing.scale.set(rippleScale, rippleScale, 1);
      (rippleRing.material as THREE.MeshBasicMaterial).opacity = (1 - rippleCycle) * 0.55;
      lotusGroup.rotation.y = Math.sin(elapsed * 0.25) * 0.18;

      // 5. Highlight active inspected day crystal gently
      const activeIdx = selectedDayIndexRef.current;
      for (let i = 0; i < crystalMeshes.length; i += 1) {
        const mesh = crystalMeshes[i];
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        const baseE = Number(mesh.userData.baseEmissiveIntensity ?? 0.3);
        const targetE = i === activeIdx ? 1.35 : baseE;
        mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, targetE, 7.0, dt);
      }

      // 6. Drift floating blossom petals / glow motes (zero allocations)
      for (let i = 0; i < moteBaseData.length; i += 1) {
        const m = moteBaseData[i];
        const floatY = m.y + Math.sin(elapsed * m.speed + m.phase) * 0.38;
        const driftX = m.x + Math.cos(elapsed * 0.35 + m.phase) * 0.24;
        const driftZ = m.z + Math.sin(elapsed * 0.32 + m.phase) * 0.24;
        _scratchDummy.position.set(driftX, floatY, driftZ);
        _scratchDummy.rotation.set(elapsed * 0.5 + m.phase, elapsed * 0.7, 0);
        _scratchDummy.scale.setScalar(m.scale);
        _scratchDummy.updateMatrix();
        motesMesh.setMatrixAt(i, _scratchDummy.matrix);
      }
      motesMesh.instanceMatrix.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', cancelScriptedCamera);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      textures.dispose();
      envTarget.dispose();

      // Dispose all scene geometries & materials
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      void _scratchColor;
    };
  }, [gardenStage.stageIndex, last30Days]);

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#161B33]"
      role="dialog"
      aria-modal="true"
      aria-label="Daily Tide 3D Sanctuary"
    >
      {/* Dedicated isolated WebGL canvas container (full-bleed 100vw x 100vh) */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Minimal Top-Left Title & Selected Crystal Spec Badge (solid/rgba surface, zero backdrop-filter) */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
        <div
          className="pointer-events-auto rounded-2xl px-4 py-3 border border-white/15 max-w-sm"
          style={{ backgroundColor: 'rgba(20, 23, 42, 0.88)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#79DCE8]">
            Stage {gardenStage.stageIndex} · {gardenStage.name}
          </p>
          <p className="mt-0.5 font-display text-sm font-semibold text-white">
            3D Tide Sanctuary · {totalTidePoints} Tide Points
          </p>
          {inspectedDay && (
            <p className="mt-1.5 pt-1.5 border-t border-white/10 text-xs text-[#D5D0E8] tabular-nums">
              <span className="font-semibold text-white">{inspectedDay.fullDateLabel}:</span>{' '}
              {formatVolume(inspectedDay.ml, unit)} ({Math.round(inspectedDay.goalRatio * 100)}% goal)
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close 3D Sanctuary"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white border border-white/15 hover:border-[#79DCE8] transition-colors cursor-pointer"
          style={{ backgroundColor: 'rgba(20, 23, 42, 0.88)' }}
        >
          <X className="w-4 h-4" />
          <span>Exit 3D</span>
        </button>
      </div>

      {/* Unified Collapsible Bottom Control Dock (zero side panels, zero backdrop-filter, zero pulsing dots) */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-10 flex flex-col items-center transition-transform duration-300"
        style={{
          bottom: '18px',
          width: 'min(860px, 94vw)',
          transform: dockCollapsed
            ? 'translate(-50%, calc(100% - 28px))'
            : 'translate(-50%, 0)',
        }}
      >
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-t-xl text-[11px] font-semibold text-[#E8E4F8] border border-b-0 border-white/15 cursor-pointer"
          style={{ backgroundColor: 'rgba(20, 23, 42, 0.9)' }}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>

        <div
          className="w-full rounded-2xl border border-white/15 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-2xl"
          style={{ backgroundColor: 'rgba(20, 23, 42, 0.92)' }}
        >
          {/* Camera View Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9C96B8] mr-1">
              <Compass className="w-3.5 h-3.5 text-[#79DCE8]" />
              <span>View</span>
            </span>
            {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetId) => (
              <button
                key={presetId}
                type="button"
                onClick={() => handleSelectCameraPreset(presetId)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activePreset === presetId
                    ? 'bg-[#6C4FE0] text-white'
                    : 'bg-[#262B47] text-[#D2CDE6] hover:bg-[#32385C]'
                }`}
              >
                {CAMERA_PRESETS[presetId].label}
              </button>
            ))}
          </div>

          {/* Lighting Atmosphere Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9C96B8] mr-1">
              <Sun className="w-3.5 h-3.5 text-[#F5C469]" />
              <span>Light</span>
            </span>
            {(Object.keys(LIGHTING_MOODS) as LightingMoodId[]).map((moodId) => (
              <button
                key={moodId}
                type="button"
                onClick={() => handleSelectMood(moodId)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeMood === moodId
                    ? 'bg-[#36B5C4] text-[#111526]'
                    : 'bg-[#262B47] text-[#D2CDE6] hover:bg-[#32385C]'
                }`}
              >
                {LIGHTING_MOODS[moodId].label}
              </button>
            ))}
          </div>

          {/* Offline Procedural Ocean Soundscape Toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              audioEnabled
                ? 'bg-[#36B5C4] text-[#111526]'
                : 'bg-[#262B47] text-[#D2CDE6] hover:bg-[#32385C]'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioEnabled ? 'Waves On' : 'Waves Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
