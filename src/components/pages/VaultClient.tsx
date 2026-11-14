"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import * as THREE from "three";
import gsap from "gsap";
import Link from "next/link";
import { VAULT_ITEMS, VaultCategory, VaultItem } from "@/data/vault";
import CassetteTower from "@/components/vault/CassetteTower";
import VinylExperience from "@/components/vault/VinylExperience";

// ─────────────────────────────────────────────────────────────────────────────
// EXACT A24 SPECIFICATIONS (reverse-engineered from a24.raviklaassens.com)
// ─────────────────────────────────────────────────────────────────────────────
const A24 = {
  // Optical Disc Dimensions
  holeSize: 0.14,
  hubSize: 0.24,
  discThickness: 0.01,
  edgeBevel: 1,
  edgeBleed: 0.026,
  galleryScale: 1.08,
  hGap: 2.3,
  depthGap: 1.0,
  activeDiscY: 0.06,
  galleryRotX: -30,
  galleryRotY: -30,
  inactiveScale: 0.8,
  cameraDistance: 4.4,
  cameraFOV: 40,
  exposure: 0.86,

  // A24 Lighting Rig
  keyLightColor: 0xfff9e8,
  keyLightIntensity: 0.75,
  rimLightColor: 0x499ff5,
  rimLightIntensity: 0.75,
  topStripIntensity: 1.9,
  fillIntensity: 0.3,

  // A24 Background & Fog (Light Theme #F2F2F2 / White)
  backgroundColor: 0xf2f2f2,
  fogColor: 0xf2f2f2,
  fogNear: 7,
  fogFar: 14,

  // Physical Materials
  hubTransmission: 0.72,
  hubRoughness: 0.35,
  hubIOR: 1.8,
  hubMatrixIntensity: 0.85,
  hubMatrixWidth: 0.38,
  iridescence: 0.85,
  iridescenceIOR: 1.35,
  dragSensitivity: 0.95,
  hoverTiltStrength: 0.28,
  wheelStepThreshold: 55,
  artResolution: 1024,
};

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL DISC FACE GENERATOR (For items without pre-rendered disc art)
// ─────────────────────────────────────────────────────────────────────────────
function generateFallbackDiscTexture(item: VaultItem, index: number): THREE.CanvasTexture {
  const SIZE = A24.artResolution;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerPx = SIZE * 0.49;

  // Deep vinyl charcoal gradient base
  const bgGrad = ctx.createRadialGradient(cx, cy, outerPx * 0.1, cx, cy, outerPx);
  bgGrad.addColorStop(0, "#22211e");
  bgGrad.addColorStop(0.5, "#151412");
  bgGrad.addColorStop(0.85, "#0d0c0a");
  bgGrad.addColorStop(1, "#060505");
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerPx, 0, Math.PI * 2);
  ctx.fill();

  // Concentric vinyl grooves (A24 intervals [.255, .285, .315, .345])
  const grooveRadii = [0.255, 0.285, 0.315, 0.345];
  grooveRadii.forEach((frac, n) => {
    const alpha = (0.16 - n * 0.02).toFixed(3);
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(cx, cy, outerPx * frac * (1 / 0.49), 0, Math.PI * 2);
    ctx.stroke();
  });

  // Micro-grooves
  ctx.lineWidth = 0.75;
  for (let r = Math.round(outerPx * 0.32); r < Math.round(outerPx * 0.96); r += 3) {
    const a = 0.035 + Math.sin(r * 0.2) * 0.015;
    ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Accent ring
  const accentMap: Record<string, string> = {
    cinema: "#c8402a",
    music: "#2779a7",
    books: "#c99a4a",
    art: "#7a9050",
  };
  const accent = accentMap[item.category] ?? "#888";
  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(cx, cy, outerPx * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Hub data matrix text
  ctx.save();
  ctx.translate(cx, cy);
  ctx.font = "500 11px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.textAlign = "center";
  ctx.fillText(
    `VAULT ARCHIVE · REF ${String(index + 1).padStart(2, "0")} · TRIBUTE TO A24 · MASTERED BY ADITYAWORKS · IFPI 942 ·`,
    0,
    outerPx * 0.295
  );
  ctx.restore();

  // Typography
  ctx.save();
  ctx.translate(cx, cy);
  const titleUpper = item.title.toUpperCase();
  const displayTitle = titleUpper.length > 20 ? titleUpper.slice(0, 18) + "…" : titleUpper;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 8;
  ctx.fillText(displayTitle, 0, -outerPx * 0.11);

  ctx.font = "500 20px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.shadowBlur = 0;
  ctx.fillText(item.creator.toUpperCase(), 0, outerPx * 0.025);

  ctx.font = "700 15px monospace";
  ctx.fillStyle = accent;
  ctx.fillText(`${item.year}  ·  ${item.genreOrDiscipline.toUpperCase()}`, 0, outerPx * 0.14);
  ctx.restore();

  // Clear center spindle hole
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, outerPx * A24.holeSize * (1 / 0.49) * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL DISC BACK TEXTURE (Silver Anisotropic Iridescence)
// ─────────────────────────────────────────────────────────────────────────────
function generateDiscBackTexture(): THREE.CanvasTexture {
  const SIZE = 512;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerPx = SIZE * 0.49;

  // Silver gradient
  const grad = ctx.createRadialGradient(cx, cy, outerPx * 0.06, cx, cy, outerPx);
  grad.addColorStop(0, "#f2f0ec");
  grad.addColorStop(0.25, "#d6d4ce");
  grad.addColorStop(0.55, "#c4c2bc");
  grad.addColorStop(0.8, "#b0aea8");
  grad.addColorStop(1, "#949288");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerPx, 0, Math.PI * 2);
  ctx.fill();

  // Prismatic iridescent reflection bands
  const spectralColors = [
    "rgba(255,120,80,0.12)",
    "rgba(255,220,60,0.09)",
    "rgba(80,220,120,0.11)",
    "rgba(60,160,255,0.13)",
    "rgba(180,80,255,0.1)",
  ];
  for (let r = Math.round(outerPx * 0.3); r < Math.round(outerPx * 0.95); r += 5) {
    const cIdx = Math.floor((r / (outerPx * 0.65)) * spectralColors.length) % spectralColors.length;
    ctx.strokeStyle = spectralColors[cIdx];
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Micro grooves
  for (let r = Math.round(outerPx * 0.3); r < Math.round(outerPx * 0.95); r += 2) {
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Matrix stamped text
  ctx.save();
  ctx.translate(cx, cy);
  ctx.font = "500 9px monospace";
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.textAlign = "center";
  ctx.fillText("MASTERED BY ADITYAWORKS · DIGITAL AUDIO DISC · MATRIX IFPI 942 ·", 0, outerPx * 0.25);
  ctx.restore();

  // Clear spindle hole
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, outerPx * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED 3D OPTICAL DISC GEOMETRIES & MATERIALS (Prevents 858x allocation)
// ─────────────────────────────────────────────────────────────────────────────
function createSharedDiscAssets(backTex: THREE.CanvasTexture) {
  const projectUVs = (geo: THREE.BufferGeometry) => {
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uvs.setXY(i, pos.getX(i) * 0.5 + 0.5, pos.getY(i) * 0.5 + 0.5);
    }
    uvs.needsUpdate = true;
  };

  const frontGeo = new THREE.RingGeometry(A24.holeSize, 1.0, 220, 1);
  projectUVs(frontGeo);

  const backGeo = new THREE.RingGeometry(A24.holeSize, 1.0, 220, 1);
  projectUVs(backGeo);

  const T = A24.discThickness;
  const bevelSize = 0.0015 + A24.edgeBevel * Math.min(T * 0.55, 0.018);
  const edgeInner = 1 - A24.edgeBleed;
  const edgePoints = [
    new THREE.Vector2(edgeInner, T / 2),
    new THREE.Vector2(1 - bevelSize, T / 2),
    new THREE.Vector2(1, T / 2 - bevelSize),
    new THREE.Vector2(1, -(T / 2 - bevelSize)),
    new THREE.Vector2(1 - bevelSize, -T / 2),
    new THREE.Vector2(edgeInner, -T / 2),
  ];
  const edgeGeo = new THREE.LatheGeometry(edgePoints, 256);
  edgeGeo.rotateX(Math.PI / 2);

  const hubGeo = new THREE.RingGeometry(0.08, A24.hubSize, 128, 1);

  const matrixInner = A24.hubSize * (1 - A24.hubMatrixWidth);
  const matrixOuter = A24.hubSize;
  const matrixGeo = new THREE.RingGeometry(matrixInner, matrixOuter, 128, 1);

  const pickGeo = new THREE.CircleGeometry(1.05, 32);

  const backMat = new THREE.MeshPhysicalMaterial({
    map: backTex,
    color: new THREE.Color(0xd0d0d0),
    roughness: 0.15,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    iridescence: A24.iridescence,
    iridescenceIOR: A24.iridescenceIOR,
    iridescenceThicknessMinimum: 140,
    iridescenceThicknessMaximum: 300,
    side: THREE.FrontSide,
  });

  const edgeMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xcccccc),
    roughness: 0.04,
    metalness: 0.55,
    clearcoat: 0.7,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
  });

  const hubMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff),
    transmission: A24.hubTransmission,
    roughness: A24.hubRoughness,
    ior: A24.hubIOR,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const matrixMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x888888),
    roughness: 0.5,
    metalness: 0.6,
    transparent: true,
    opacity: A24.hubMatrixIntensity,
    side: THREE.DoubleSide,
  });

  const pickMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });

  const placeholderCanvas = document.createElement("canvas");
  placeholderCanvas.width = 16;
  placeholderCanvas.height = 16;
  const pCtx = placeholderCanvas.getContext("2d")!;
  pCtx.fillStyle = "#141414";
  pCtx.fillRect(0, 0, 16, 16);
  const placeholderTex = new THREE.CanvasTexture(placeholderCanvas);
  placeholderTex.colorSpace = THREE.SRGBColorSpace;

  return {
    frontGeo,
    backGeo,
    edgeGeo,
    hubGeo,
    matrixGeo,
    pickGeo,
    backMat,
    edgeMat,
    hubMat,
    matrixMat,
    pickMat,
    placeholderTex,
    dispose() {
      frontGeo.dispose();
      backGeo.dispose();
      edgeGeo.dispose();
      hubGeo.dispose();
      matrixGeo.dispose();
      pickGeo.dispose();
      backMat.dispose();
      edgeMat.dispose();
      hubMat.dispose();
      matrixMat.dispose();
      pickMat.dispose();
      placeholderTex.dispose();
    },
  };
}

type SharedDiscAssets = ReturnType<typeof createSharedDiscAssets>;

// ─────────────────────────────────────────────────────────────────────────────
// BUILD 3D OPTICAL DISC WITH INTERACTIVE SPIN GROUP
// ─────────────────────────────────────────────────────────────────────────────
function buildDisc(
  item: VaultItem,
  index: number,
  shared: SharedDiscAssets,
  texLoader: THREE.TextureLoader,
  initialActiveIdx: number
): {
  group: THREE.Group;
  spinGroup: THREE.Group;
  frontMesh: THREE.Mesh;
  backMesh: THREE.Mesh;
  pickMesh: THREE.Mesh;
  texLoaded: boolean;
} {
  const group = new THREE.Group();

  // Interactive Spin Group: isolated from gallery stack transforms
  const spinGroup = new THREE.Group();
  group.add(spinGroup);

  // ── Front Face: Photographic Movie Picture or Procedural Artwork ──────────
  let frontTex: THREE.Texture = shared.placeholderTex;
  let texLoaded = false;
  if (Math.abs(index - initialActiveIdx) <= 6) {
    texLoaded = true;
    if (item.image) {
      frontTex = texLoader.load(item.image);
      frontTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.minFilter = THREE.LinearMipmapLinearFilter;
      frontTex.generateMipmaps = true;
    } else {
      frontTex = generateFallbackDiscTexture(item, index);
    }
  }

  const frontMat = new THREE.MeshPhysicalMaterial({
    map: frontTex,
    roughness: 0.3,
    metalness: 0.15,
    clearcoat: 0.65,
    clearcoatRoughness: 0.08,
    side: THREE.FrontSide,
  });
  const frontMesh = new THREE.Mesh(shared.frontGeo, frontMat);
  frontMesh.position.z = A24.discThickness * 0.5;
  spinGroup.add(frontMesh);

  // ── Back Face: Silver Anisotropic Iridescent ──────────────────────────────
  const backMesh = new THREE.Mesh(shared.backGeo, shared.backMat);
  backMesh.rotation.y = Math.PI;
  backMesh.position.z = -A24.discThickness * 0.5;
  spinGroup.add(backMesh);

  // ── Beveled Edge Rim ──────────────────────────────────────────────────────
  const edgeMesh = new THREE.Mesh(shared.edgeGeo, shared.edgeMat);
  spinGroup.add(edgeMesh);

  // ── Frosted Glass Hub (spindle ring from 0.08 to 0.24) ────────────────────
  const hubFront = new THREE.Mesh(shared.hubGeo, shared.hubMat);
  hubFront.position.z = A24.discThickness * 0.5 + 0.001;
  spinGroup.add(hubFront);

  const hubBack = new THREE.Mesh(shared.hubGeo, shared.hubMat);
  hubBack.rotation.y = Math.PI;
  hubBack.position.z = -(A24.discThickness * 0.5 + 0.001);
  spinGroup.add(hubBack);

  // ── Hub Matrix Data Ring ──────────────────────────────────────────────────
  const matrixFront = new THREE.Mesh(shared.matrixGeo, shared.matrixMat);
  matrixFront.position.z = A24.discThickness * 0.5 + 0.0005;
  spinGroup.add(matrixFront);

  const matrixBack = new THREE.Mesh(shared.matrixGeo, shared.matrixMat);
  matrixBack.rotation.y = Math.PI;
  matrixBack.position.z = -(A24.discThickness * 0.5 + 0.0005);
  spinGroup.add(matrixBack);

  // ── Invisible Raycast Pick Cylinder (Ensures 100% reliable click/hover capture) ──
  const pickMesh = new THREE.Mesh(shared.pickGeo, shared.pickMat);
  pickMesh.userData = { index };
  spinGroup.add(pickMesh);

  return { group, spinGroup, frontMesh, backMesh, pickMesh, texLoaded };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT MAP GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function buildEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e6e3);
  const env = pmremGen.fromScene(scene).texture;
  pmremGen.dispose();
  return env;
}

interface DiscEntry {
  group: THREE.Group;
  spinGroup: THREE.Group;
  frontMesh: THREE.Mesh;
  backMesh: THREE.Mesh;
  pickMesh: THREE.Mesh;
  index: number;
  item: VaultItem;
  spinX: number;
  spinY: number;
  hoverTiltX: number;
  hoverTiltY: number;
  hoverFactor: number;
  resetTween: gsap.core.Tween | null;
  texLoaded: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function VaultClient() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory>("cinema");
  const [musicMedium, setMusicMedium] = useState<"cassettes" | "vinyl">("cassettes");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const items = useMemo<VaultItem[]>(() => {
    if (selectedCategory === "all") return VAULT_ITEMS;
    return VAULT_ITEMS.filter((it) => it.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setActiveIndex(0);
    setIsFlipped(false);
  }, [selectedCategory]);

  const activeItem = items[activeIndex] ?? VAULT_ITEMS[0];

  const liveRef = useRef({
    activeIndex: 0,
    isFlipped: false,
    items: items,
  });

  useEffect(() => {
    liveRef.current.activeIndex = activeIndex;
    liveRef.current.isFlipped = isFlipped;
    liveRef.current.items = items;
  }, [activeIndex, isFlipped, items]);

  const navigate = useCallback((dir: 1 | -1) => {
    setIsFlipped(false);
    setActiveIndex((prev) =>
      Math.max(0, Math.min(liveRef.current.items.length - 1, prev + dir))
    );
  }, []);

  const flipDisc = useCallback(() => setIsFlipped((prev) => !prev), []);

  // ── THREE.JS SCENE ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || window.innerWidth;
    let H = container.clientHeight || window.innerHeight;

    // ── WebGL Renderer (Exact A24 background: #f2f2f2) ────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(A24.backgroundColor, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = A24.exposure;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // ── Scene with Depth Fog matching the #f2f2f2 background ───────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(A24.backgroundColor);
    scene.fog = new THREE.Fog(A24.fogColor, A24.fogNear, A24.fogFar);

    const envMap = buildEnvMap(renderer);
    scene.environment = envMap;

    // ── Camera (A24 specs: FOV 40, distance 4.4) ──────────────────────────────
    const camera = new THREE.PerspectiveCamera(A24.cameraFOV, W / H, 0.01, 100);
    camera.position.set(0, 0, W < 768 ? 5.4 : A24.cameraDistance);

    // ── Lighting Rig (A24 params) ─────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    // Warm key light from below disc (y: -8)
    const keyLight = new THREE.DirectionalLight(A24.keyLightColor, A24.keyLightIntensity);
    keyLight.position.set(3.5, -8, 5);
    scene.add(keyLight);

    // Cool rim light
    const rimLight = new THREE.DirectionalLight(A24.rimLightColor, A24.rimLightIntensity);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    // Top strip overhead spotlight
    const topStrip = new THREE.SpotLight(0xffffff, A24.topStripIntensity, 25, Math.PI / 4, 0.4);
    topStrip.position.set(0, 9, 3);
    topStrip.target.position.set(0, 0, 0);
    scene.add(topStrip);
    scene.add(topStrip.target);

    // Front soft fill
    const fillLight = new THREE.DirectionalLight(0xfff5ea, A24.fillIntensity);
    fillLight.position.set(0, -2, 6);
    scene.add(fillLight);

    // ── Gallery Group (-30° X, -30° Y signature angle) ─────────────────────────
    const galleryGroup = new THREE.Group();
    galleryGroup.rotation.x = THREE.MathUtils.degToRad(A24.galleryRotX);
    galleryGroup.rotation.y = THREE.MathUtils.degToRad(A24.galleryRotY);
    scene.add(galleryGroup);

    // ── Instantiate Disc Stack with Movie Pictures ────────────────────────────
    const backTex = generateDiscBackTexture();
    const sharedDiscAssets = createSharedDiscAssets(backTex);
    const texLoader = new THREE.TextureLoader();
    const discEntries: DiscEntry[] = [];

    const currentItems = liveRef.current.items;
    currentItems.forEach((item, idx) => {
      const { group, spinGroup, frontMesh, backMesh, pickMesh, texLoaded } = buildDisc(
        item,
        idx,
        sharedDiscAssets,
        texLoader,
        liveRef.current.activeIndex
      );

      const offset = idx - liveRef.current.activeIndex;
      group.position.x = offset * A24.hGap;
      group.position.z = -Math.abs(offset) * A24.depthGap;
      group.position.y = offset === 0 ? A24.activeDiscY : 0;

      const initScale =
        offset === 0
          ? A24.galleryScale
          : Math.max(A24.inactiveScale, A24.galleryScale - Math.abs(offset) * 0.14);
      group.scale.set(initScale, initScale, initScale);
      group.visible = Math.abs(offset) <= 6;

      galleryGroup.add(group);
      discEntries.push({
        group,
        spinGroup,
        frontMesh,
        backMesh,
        pickMesh,
        index: idx,
        item,
        spinX: 0,
        spinY: 0,
        hoverTiltX: 0,
        hoverTiltY: 0,
        hoverFactor: 0,
        resetTween: null,
        texLoaded,
      });
    });

    setIsReady(true);

    // ── Interactive Physics: Hover Tilt & Mouse 3D Flip ───────────────────────
    let mouseNX = 0;
    let mouseNY = 0;
    let cameraTiltX = 0;
    let cameraTiltY = 0;
    let hoveredIndex = -1;

    // Wheel navigation with velocity inertia decay
    let scrollAccum = 0;
    let scrollCooldown = false;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (scrollCooldown) return;
      scrollAccum += e.deltaY;
      if (scrollAccum > A24.wheelStepThreshold) {
        scrollAccum = 0;
        scrollCooldown = true;
        setIsFlipped(false);
        setActiveIndex((prev) =>
          Math.min(liveRef.current.items.length - 1, prev + 1)
        );
        setTimeout(() => { scrollCooldown = false; }, 360);
      } else if (scrollAccum < -A24.wheelStepThreshold) {
        scrollAccum = 0;
        scrollCooldown = true;
        setIsFlipped(false);
        setActiveIndex((prev) => Math.max(0, prev - 1));
        setTimeout(() => { scrollCooldown = false; }, 360);
      }
    };

    // Pointer Interaction State
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let dragDeltaX = 0;
    let dragTarget: "disc" | "gallery" | null = null;
    let activeSpinDisc: DiscEntry | null = null;

    const raycaster = new THREE.Raycaster();
    const pointerVec = new THREE.Vector2();

    const getRaycastHit = (clientX: number, clientY: number): DiscEntry | null => {
      pointerVec.x = (clientX / W) * 2 - 1;
      pointerVec.y = -((clientY / H) * 2 - 1);
      raycaster.setFromCamera(pointerVec, camera);

      const targetIdx = liveRef.current.activeIndex;
      const candidates: THREE.Object3D[] = [];
      const minI = Math.max(0, targetIdx - 6);
      const maxI = Math.min(discEntries.length - 1, targetIdx + 6);
      for (let i = minI; i <= maxI; i++) {
        candidates.push(discEntries[i].pickMesh);
      }

      const intersects = raycaster.intersectObjects(candidates, false);
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData?.index;
        return typeof idx === "number" ? discEntries[idx] ?? null : null;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      dragDeltaX = 0;

      const hit = getRaycastHit(e.clientX, e.clientY);
      if (hit) {
        dragTarget = "disc";
        activeSpinDisc = hit;
        // Kill existing reset animation on this disc so user takes live control
        if (hit.resetTween) {
          hit.resetTween.kill();
          hit.resetTween = null;
        }
        renderer.domElement.style.cursor = "grabbing";
      } else {
        dragTarget = "gallery";
        activeSpinDisc = null;
        renderer.domElement.style.cursor = "grabbing";
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      mouseNX = (e.clientX / W) * 2 - 1;
      mouseNY = -((e.clientY / H) * 2 - 1);

      // Hover Raycasting when not dragging
      if (!isDragging) {
        const hit = getRaycastHit(e.clientX, e.clientY);
        hoveredIndex = hit ? hit.index : -1;
        renderer.domElement.style.cursor = hit ? "grab" : "default";
      } else {
        const deltaX = e.clientX - lastClientX;
        const deltaY = e.clientY - lastClientY;
        lastClientX = e.clientX;
        lastClientY = e.clientY;

        if (dragTarget === "disc" && activeSpinDisc) {
          // 💿 MOUSE-DRIVEN 3D DISC FLIP & SPIN
          activeSpinDisc.spinY += deltaX * 0.0085;
          activeSpinDisc.spinX += deltaY * 0.0065;
          // Soft clamp pitch to keep disc grounded
          activeSpinDisc.spinX = Math.max(-0.65, Math.min(0.65, activeSpinDisc.spinX));
        } else if (dragTarget === "gallery") {
          dragDeltaX = (e.clientX - dragStartX) * A24.dragSensitivity;
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const moveDist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);

      if (dragTarget === "disc" && activeSpinDisc) {
        if (moveDist < 7) {
          // It was a quick click: flip active or navigate to neighbor
          if (activeSpinDisc.index === liveRef.current.activeIndex) {
            flipDisc();
          } else {
            setIsFlipped(false);
            setActiveIndex(activeSpinDisc.index);
          }
        } else {
          // 🔄 USER FLIPPED / SPUN THE DISC WITH MOUSE -> SMOOTHLY SPRINGS BACK TO NORMAL
          const targetSpin = 0;
          activeSpinDisc.resetTween = gsap.to(activeSpinDisc, {
            spinX: 0,
            spinY: targetSpin,
            duration: 1.15,
            ease: "power3.out",
            onComplete: () => {
              if (activeSpinDisc) activeSpinDisc.resetTween = null;
            },
          });
        }
        activeSpinDisc = null;
      } else if (dragTarget === "gallery") {
        if (dragDeltaX < -50) {
          navigate(1);
        } else if (dragDeltaX > 50) {
          navigate(-1);
        }
      }

      dragTarget = null;
      dragDeltaX = 0;
      renderer.domElement.style.cursor = hoveredIndex >= 0 ? "grab" : "default";
    };

    // Keyboard navigation
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.code === "Space") {
        e.preventDefault();
        flipDisc();
      }
    };

    // Responsive resize
    const onResize = () => {
      W = container.clientWidth;
      H = container.clientHeight;
      camera.aspect = W / H;
      camera.position.z = W < 768 ? 5.4 : A24.cameraDistance;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };

    const dom = renderer.domElement;
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    // ── Animation Loop (60 FPS Physical Interpolation) ─────────────────────────
    let animId: number;
    const startTime = performance.now();
    let prevTime = startTime;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;
      const elapsed = (now - startTime) / 1000;

      const targetIdx = liveRef.current.activeIndex;
      const flippedGlobal = liveRef.current.isFlipped;

      // Smooth inertia scroll decay
      scrollAccum *= 0.92;
      if (Math.abs(scrollAccum) < 0.2) scrollAccum = 0;

      // Ambient camera tilt
      cameraTiltX += (mouseNY * 0.15 - cameraTiltX) * 0.055;
      cameraTiltY += (mouseNX * 0.22 - cameraTiltY) * 0.055;

      discEntries.forEach((d) => {
        const offset = d.index - targetIdx;
        const absOffset = Math.abs(offset);
        const isActive = offset === 0;

        if (absOffset > 6) {
          d.group.visible = false;
          return;
        }
        d.group.visible = true;

        if (!d.texLoaded) {
          d.texLoaded = true;
          if (d.item.image) {
            texLoader.load(d.item.image, (loadedTex) => {
              loadedTex.colorSpace = THREE.SRGBColorSpace;
              loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
              loadedTex.generateMipmaps = true;
              const mat = d.frontMesh.material as THREE.MeshPhysicalMaterial;
              mat.map = loadedTex;
              mat.needsUpdate = true;
            });
          } else {
            const mat = d.frontMesh.material as THREE.MeshPhysicalMaterial;
            mat.map = generateFallbackDiscTexture(d.item, d.index);
            mat.needsUpdate = true;
          }
        }

        // Position interpolation
        const tX = offset * A24.hGap;
        const tZ = -absOffset * A24.depthGap;
        const tY = isActive ? A24.activeDiscY : 0;

        d.group.position.x += (tX - d.group.position.x) * (dt * 8);
        d.group.position.z += (tZ - d.group.position.z) * (dt * 8);
        d.group.position.y += (tY - d.group.position.y) * (dt * 8);

        // Scale interpolation
        const tScale = isActive
          ? A24.galleryScale
          : Math.max(A24.inactiveScale, A24.galleryScale - absOffset * 0.14);
        d.group.scale.x += (tScale - d.group.scale.x) * (dt * 8);
        d.group.scale.y = d.group.scale.x;
        d.group.scale.z = d.group.scale.x;

        // Gallery Group Y Rotation (Flip & Angle fan-out)
        let baseY: number;
        if (isActive) {
          baseY = flippedGlobal ? Math.PI : 0;
          baseY += cameraTiltY;
          d.group.rotation.x += (cameraTiltX - d.group.rotation.x) * 0.07;
        } else {
          baseY = offset * -0.22;
          d.group.rotation.x += (0 - d.group.rotation.x) * 0.07;
        }
        d.group.rotation.y += (baseY - d.group.rotation.y) * (dt * 6.5);

        // ── Interactive Hover Tilt Physics ──────────────────────────────────
        const isHovered = d.index === hoveredIndex;
        const targetHover = isHovered ? 1 : 0;
        d.hoverFactor += (targetHover - d.hoverFactor) * Math.min(1, dt * 8);

        // Disc smoothly angles towards cursor when hovered
        const targetTiltX = isHovered ? -mouseNY * A24.hoverTiltStrength : 0;
        const targetTiltY = isHovered ? mouseNX * A24.hoverTiltStrength : 0;
        d.hoverTiltX += (targetTiltX - d.hoverTiltX) * (dt * 7);
        d.hoverTiltY += (targetTiltY - d.hoverTiltY) * (dt * 7);

        // Apply interactive mouse spin & hover tilt directly to spinGroup
        d.spinGroup.rotation.y = d.spinY + d.hoverTiltY;
        d.spinGroup.rotation.x = d.spinX + d.hoverTiltX;

        // Idle front artwork spin only when active, not flipped, and not being user-dragged
        const isBeingDragged = activeSpinDisc === d || Math.abs(d.spinY) > 0.04;
        if (isActive && !flippedGlobal && !isBeingDragged) {
          d.frontMesh.rotation.z = elapsed * 0.08;
        } else if (!isActive) {
          d.frontMesh.rotation.z += (0 - d.frontMesh.rotation.z) * 0.05;
        }

        // Render distance culling
        d.group.visible = absOffset <= 6;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      discEntries.forEach((d) => {
        if (d.resetTween) d.resetTween.kill();
        const frontMat = d.frontMesh.material as THREE.MeshPhysicalMaterial;
        if (frontMat.map && frontMat.map !== sharedDiscAssets.placeholderTex) {
          frontMat.map.dispose();
        }
        frontMat.dispose();
      });
      sharedDiscAssets.dispose();
      backTex.dispose();
      envMap.dispose();
      renderer.dispose();
      setIsReady(false);
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const categories: { key: VaultCategory; label: string }[] = [
    { key: "cinema", label: "Cinema" },
    { key: "music", label: "Music" },
    { key: "books", label: "Books" },
    { key: "art", label: "Art" },
  ];

  if (selectedCategory === "music") {
    if (musicMedium === "vinyl") {
      return (
        <VinylExperience
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          musicMedium={musicMedium}
          onSelectMusicMedium={setMusicMedium}
        />
      );
    }
    return (
      <CassetteTower
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        musicMedium={musicMedium}
        onSelectMusicMedium={setMusicMedium}
      />
    );
  }

  const countLabel = `${String(activeIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
  const directorLabel =
    activeItem.category === "cinema"
      ? "DIRECTED BY"
      : activeItem.category === "music"
      ? "ARTIST"
      : activeItem.category === "books"
      ? "AUTHOR"
      : "CREATOR";

  return (
    <main
      className="relative w-screen h-screen overflow-hidden select-none bg-[#f2f2f2] text-black"
      style={{ fontFamily: "inherit" }}
    >
      {/* ── 3D Canvas Mount (Exact A24 background: #f2f2f2) ────────────────── */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      />

      {/* ── Subtle Film Grain Overlay (A24 grain layer) ───────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          opacity: 0.035,
          backgroundImage: "url(/noise.svg)",
          backgroundSize: "180px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: Back Link & Centered Category Filter Pills
      ════════════════════════════════════════════════════════════════════ */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-14 pt-7 pb-4 pointer-events-none">
        <div className="flex items-center gap-5 pointer-events-auto">
          <Link
            href="/about"
            className="text-[11px] font-mono uppercase tracking-[0.28em] text-black/55 hover:text-black transition-colors flex items-center gap-2 group font-semibold"
          >
            <span className="inline-block group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>About</span>
          </Link>
          <span className="text-black/25 text-xs">/</span>
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-black font-bold">
            The Vault
          </span>
        </div>

        {/* Centered Category Navigation Pills */}
        <nav
          className="absolute left-1/2 -translate-x-1/2 top-7 flex items-center gap-1 pointer-events-auto rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-2.5 py-1.5 shadow-sm z-50"
          aria-label="Filter by category"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all duration-200 cursor-pointer pointer-events-auto ${
                  isActive
                    ? "bg-black text-white font-bold shadow-sm"
                    : "text-black/55 hover:text-black hover:bg-black/5"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT EDITORIAL PANEL (A24 experience_info)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute left-8 md:left-14 top-24 bottom-24 z-30 pointer-events-none flex flex-col justify-between max-w-[280px] md:max-w-[320px]">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-black/45 font-bold block mb-3">
            {activeItem.category.toUpperCase()} · {countLabel}
          </span>

          <h1 className="text-3xl md:text-5xl font-black uppercase leading-[0.92] tracking-tight text-black mb-6">
            {activeItem.title}
          </h1>

          <dl className="space-y-0">
            {[
              { label: directorLabel, value: activeItem.creator },
              { label: "YEAR", value: activeItem.year },
              ...(activeItem.starring
                ? [{ label: "STARRING", value: activeItem.starring }]
                : [{ label: "GENRE", value: activeItem.genreOrDiscipline }]),
            ].map(({ label, value }) => (
              <div
                key={label}
                className="border-t border-black/10 py-2.5 flex justify-between items-baseline gap-3"
              >
                <dt className="text-[9px] font-mono uppercase tracking-[0.25em] text-black/45 shrink-0 font-medium">
                  {label}
                </dt>
                <dd className="text-[11px] font-mono text-black/90 font-medium text-right leading-tight truncate max-w-[65%]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-l-2 border-black/25 pl-4 mt-6">
          <span className="text-[8px] font-mono uppercase tracking-[0.35em] text-black/45 font-bold block mb-2">
            Why It Shapes My Craft
          </span>
          <p className="text-[11px] text-black/75 font-light leading-relaxed italic line-clamp-5">
            &ldquo;{activeItem.whyItMovedMe}&rdquo;
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT REVIEW PANEL (A24 testimonial_wrap)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute right-8 md:right-14 top-24 z-30 pointer-events-none hidden md:flex flex-col items-end text-right max-w-[240px] md:max-w-[280px]">
        {/* Stars */}
        <div className="flex gap-0.5 text-[#e69500] mb-3 text-sm">
          {[...Array(Math.floor(activeItem.reviewStars ?? 5))].map((_, i) => (
            <span key={i}>★</span>
          ))}
          {(activeItem.reviewStars ?? 5) % 1 !== 0 && <span>★</span>}
        </div>

        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-black/45 font-bold mb-2">
          {activeItem.reviewPublication ?? "Creative Anchor"}
        </span>

        <blockquote className="text-base md:text-xl font-bold text-black leading-snug tracking-tight">
          &ldquo;{activeItem.reviewTestimonial || activeItem.favoriteHighlight}&rdquo;
        </blockquote>

        {activeItem.externalLink && (
          <a
            href={activeItem.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 pointer-events-auto text-[10px] font-mono uppercase tracking-widest text-black/60 hover:text-black transition-colors inline-flex items-center gap-1.5 font-bold"
          >
            <span>{activeItem.externalLabel ?? "Explore Archive"}</span>
            <span className="text-xs">↗</span>
          </a>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM INTERACTIVE CONTROLS (A24 layout)
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 px-8 md:px-14 pb-7 pt-4 flex items-center justify-between pointer-events-none">
        {/* Counter & A24 Inspiration Credit */}
        <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
          <div className="flex items-center gap-2 font-mono text-black/50">
            <span className="text-black text-xl font-black leading-none">
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-black/30 text-xs">/</span>
            <span className="text-xs font-medium">{String(items.length).padStart(2, "0")}</span>
          </div>

          <span className="hidden sm:inline-block text-black/20 text-xs">/</span>

          <a
            href="https://a24.raviklaassens.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-black/45 hover:text-black transition-colors group"
            title="Interaction architecture inspired by A24's archive (dev by Ravi Klaassens)"
          >
            <span className="underline decoration-black/25 group-hover:decoration-black underline-offset-4">
              Inspired by A24
            </span>
            <span className="text-[10px] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              ↗
            </span>
          </a>
        </div>

        {/* Flip Disc Button */}
        <button
          onClick={flipDisc}
          className="pointer-events-auto px-5 py-2 rounded-full border border-black/15 bg-black/[0.04] hover:bg-black hover:text-white text-black text-[10px] font-mono uppercase tracking-widest font-bold transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 shadow-sm"
        >
          <span>{isFlipped ? "← Movie Picture" : "Flip Disc"}</span>
          <span className="text-xs opacity-60">⟳</span>
        </button>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            disabled={activeIndex === 0}
            aria-label="Previous"
            className={`w-9 h-9 rounded-full border border-black/15 flex items-center justify-center text-black text-xs transition-all duration-200 ${
              activeIndex === 0
                ? "opacity-20 cursor-not-allowed"
                : "hover:bg-black hover:text-white cursor-pointer shadow-sm"
            }`}
          >
            ←
          </button>
          <button
            onClick={() => navigate(1)}
            disabled={activeIndex === items.length - 1}
            aria-label="Next"
            className={`w-9 h-9 rounded-full border border-black/15 flex items-center justify-center text-black text-xs transition-all duration-200 ${
              activeIndex === items.length - 1
                ? "opacity-20 cursor-not-allowed"
                : "hover:bg-black hover:text-white cursor-pointer shadow-sm"
            }`}
          >
            →
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcut Hint */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none hidden md:block">
        <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-black/35 font-medium">
          Hover Tilt · Drag Disc to Spin · Space Flip
        </span>
      </div>

      {/* Loading Fade Transition */}
      <div
        className="absolute inset-0 z-50 bg-[#f2f2f2] pointer-events-none transition-opacity duration-700"
        style={{ opacity: isReady ? 0 : 1 }}
      />
    </main>
  );
}
