"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import Link from "next/link";
import { VAULT_ITEMS, VaultCategory, VaultItem } from "@/data/vault";

// ─────────────────────────────────────────────────────────────────────────────
// EXACT COMPACT CASSETTE HARDWARE SPECIFICATIONS
// Scaled for hero physical presence in 3D viewport (1 unit ≈ 65mm)
// ─────────────────────────────────────────────────────────────────────────────
const CASSETTE = {
  width: 1.48, // 100.4mm
  depth: 0.94, // 63.8mm
  thickness: 0.16, // 12.0mm
  hubSpacing: 0.62, // 42.6mm (±0.31 from center)
  hubRadius: 0.155, // 10.8mm
  stepY: 0.36, // Generous vertical distance so every tape is clearly separated & visible
  radius: 0.58, // Spiral radius from center core
  goldenAngle: Math.PI * (3 - Math.sqrt(5)), // 137.508° Phyllotaxis angle (Bizarro spec)
  screws: [
    { x: -0.66, z: 0.40 },
    { x: 0.66, z: 0.40 },
    { x: -0.66, z: -0.38 },
    { x: 0.66, z: -0.38 },
    { x: 0, z: -0.30 },
  ],
  cameraDistance: 3.0,
  cameraFOV: 35,
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO ENVIRONMENT MAP GENERATOR (Crucial for photorealistic PBR acrylic)
// ─────────────────────────────────────────────────────────────────────────────
function buildEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xf6f5f2);

  // Softbox light panels to create the bright specular glints on acrylic edges
  const panelGeo = new THREE.PlaneGeometry(6, 3);
  const panelMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });

  const panelTop = new THREE.Mesh(panelGeo, panelMat);
  panelTop.position.set(2, 5, 3);
  panelTop.lookAt(0, 0, 0);
  envScene.add(panelTop);

  const panelLeft = new THREE.Mesh(panelGeo, panelMat);
  panelLeft.position.set(-4, 2, -2);
  panelLeft.lookAt(0, 0, 0);
  envScene.add(panelLeft);

  const panelBottom = new THREE.Mesh(panelGeo, panelMat);
  panelBottom.position.set(0, -4, 4);
  panelBottom.lookAt(0, 0, 0);
  envScene.add(panelBottom);

  const envTex = pmremGen.fromScene(envScene, 0.04).texture;
  pmremGen.dispose();
  return envTex;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL HIGH-RESOLUTION SONY CASSETTE LABEL
// ─────────────────────────────────────────────────────────────────────────────
function generateCassetteLabelTexture(item: VaultItem, index: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 680; // 88mm x 50mm label ratio
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const W = 1200;
  const H = 680;

  const isMetal = item.cassetteType === "METAL-XR";
  const isChrome = item.cassetteType === "CDit-II" || item.cassetteType === "UX-PRO";

  // 1. Label Paper Base
  if (isMetal) {
    // Metal Master: deep gunmetal with brushed texture
    ctx.fillStyle = "#121216";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else if (isChrome) {
    // Chrome High Bias: clean bright ivory with carbon black top banner
    ctx.fillStyle = "#eae6dc";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1a1c22";
    ctx.fillRect(0, 0, W, 100);
  } else {
    // Classic Sony HF: off-white paper label with red & black banner
    ctx.fillStyle = "#f4f1e8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(0, 0, W, 32);
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 32, W, 68);
  }

  // 2. Sony Iconic Serif Logo (Exact Clarendon/Georgia font from Bizarro)
  ctx.save();
  ctx.font = "bold 38px 'Georgia', 'Times New Roman', serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("SONY", 60, 68);

  // Model & Length (e.g. METAL-XR 90)
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "right";
  const model = item.cassetteType ?? "HF-ES";
  const length = item.tapeLength ?? "C-90";
  ctx.fillText(`${model} · ${length}`, W - 60, 68);
  ctx.restore();

  // 3. Ruled Notepad Guide Lines
  ctx.strokeStyle = isMetal ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(80, 180);
  ctx.lineTo(W - 80, 180);
  ctx.moveTo(80, 240);
  ctx.lineTo(W - 80, 240);
  ctx.stroke();

  // 4. Typewritten Album Title
  ctx.save();
  ctx.font = "bold 44px monospace";
  ctx.fillStyle = isMetal ? "#ffffff" : "#111111";
  ctx.textAlign = "left";
  const titleUpper = item.title.toUpperCase();
  ctx.fillText(titleUpper.length > 28 ? titleUpper.slice(0, 26) + "…" : titleUpper, 85, 162);

  // Artist & Year
  ctx.font = "600 26px monospace";
  ctx.fillStyle = isMetal ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 0, 0, 0.72)";
  ctx.fillText(`${item.creator.toUpperCase()} · [${item.year}]`, 85, 224);

  // Side A / Side B stamp
  ctx.font = "900 80px sans-serif";
  ctx.fillStyle = isMetal ? "#f59e0b" : isChrome ? "#0284c7" : "#b91c1c";
  ctx.textAlign = "right";
  ctx.fillText(index % 2 === 0 ? "A" : "B", W - 80, 210);

  // Tape Counter Ruler Marks (100 · 50 · 0)
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = isMetal ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.55)";
  ctx.textAlign = "center";
  ctx.fillText("100  ·  ·  ·  ·  50  ·  ·  ·  ·  0", W / 2, 290);

  // Tape Metadata & Dolby Mark
  ctx.font = "700 18px monospace";
  ctx.fillStyle = isMetal ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.55)";
  ctx.textAlign = "left";
  ctx.fillText(
    `BIAS: TYPE ${isMetal ? "IV METAL" : isChrome ? "II HIGH (CrO2)" : "I NORMAL"} · DOLBY B-C NR`,
    85,
    620
  );

  ctx.textAlign = "right";
  ctx.fillText(`ARCHIVE 0${index + 1} · 44.1kHz`, W - 85, 620);
  ctx.restore();

  // 5. Central Window Cutout
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.roundRect(290, 310, 620, 260, 26);
  ctx.fill();

  // Spool circular holes
  ctx.beginPath();
  ctx.arc(420, 440, 85, 0, Math.PI * 2);
  ctx.arc(780, 440, 85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD ACCURATE 3D SONY CASSETTE (BEVELED EXTRUDED ACRYLIC SHELL)
// ─────────────────────────────────────────────────────────────────────────────
function buildCassetteMesh(
  item: VaultItem,
  index: number
): {
  group: THREE.Group;
  pullGroup: THREE.Group;
  pickBox: THREE.Mesh;
  leftHubGroup: THREE.Group;
  rightHubGroup: THREE.Group;
} {
  const group = new THREE.Group();
  const pullGroup = new THREE.Group();
  group.add(pullGroup);

  const CW = CASSETTE.width; // 1.54
  const CD = CASSETTE.depth; // 0.98
  const CT = CASSETTE.thickness; // 0.18

  // 1. Physical Beveled Shell Shape with Hub Cutouts
  const shape = new THREE.Shape();
  const w = CW / 2;
  const d = CD / 2;
  const r = 0.045; // rounded corner radius

  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);

  // Circular through-holes for the two geared tape hubs
  const hubHoleLeft = new THREE.Path();
  hubHoleLeft.absarc(-CASSETTE.hubSpacing / 2, 0, CASSETTE.hubRadius * 1.05, 0, Math.PI * 2, true);
  shape.holes.push(hubHoleLeft);

  const hubHoleRight = new THREE.Path();
  hubHoleRight.absarc(CASSETTE.hubSpacing / 2, 0, CASSETTE.hubRadius * 1.05, 0, Math.PI * 2, true);
  shape.holes.push(hubHoleRight);

  // Extrude with chamfered bevels
  const extrudeSettings = {
    depth: CT - 0.02,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  };
  const shellGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  shellGeo.center();
  // Rotate so thickness lies along Y axis (horizontal tape)
  shellGeo.rotateX(Math.PI / 2);

  // High-Refraction PBR Polycarbonate Material (Clean depth writing without alpha pass flickering)
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(index % 3 === 0 ? 0x14161a : 0x20242c),
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.72,
    ior: 1.54,
    depthWrite: true,
    depthTest: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 0.95,
  });
  const shellMesh = new THREE.Mesh(shellGeo, shellMat);
  pullGroup.add(shellMesh);

  // 2. High-Res Sony Printed Label Plates (With polygon offset to completely prevent Z-fighting)
  const labelGeo = new THREE.PlaneGeometry(CW * 0.90, CD * 0.88);
  const labelTex = generateCassetteLabelTexture(item, index);
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: labelTex,
    roughness: 0.35,
    metalness: 0.08,
    transparent: true,
    alphaTest: 0.2, // Discard transparent window pixels completely to fix depth buffer
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    depthWrite: true,
    depthTest: true,
    clearcoat: 0.2,
  });

  // Top label face
  const topLabel = new THREE.Mesh(labelGeo, labelMat);
  topLabel.rotation.x = -Math.PI / 2;
  topLabel.position.y = CT * 0.5 + 0.006;
  pullGroup.add(topLabel);

  // Bottom label face
  const bottomLabel = new THREE.Mesh(labelGeo, labelMat);
  bottomLabel.rotation.x = Math.PI / 2;
  bottomLabel.position.y = -(CT * 0.5 + 0.006);
  pullGroup.add(bottomLabel);

  // 3. Dual White Geared Tape Hubs (with 6 teeth)
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xf5f3ee,
    roughness: 0.3,
    metalness: 0.05,
  });
  const hubGeo = new THREE.CylinderGeometry(
    CASSETTE.hubRadius,
    CASSETTE.hubRadius,
    CT * 0.94,
    28
  );

  const toothGeo = new THREE.BoxGeometry(0.038, CT * 0.96, 0.024);

  // Left hub (Supply reel)
  const leftHubGroup = new THREE.Group();
  leftHubGroup.position.set(-CASSETTE.hubSpacing / 2, 0, 0);
  const leftHub = new THREE.Mesh(hubGeo, hubMat);
  leftHubGroup.add(leftHub);

  for (let t = 0; t < 6; t++) {
    const tooth = new THREE.Mesh(toothGeo, hubMat);
    const angle = (t / 6) * Math.PI * 2;
    tooth.position.set(Math.cos(angle) * 0.108, 0, Math.sin(angle) * 0.108);
    tooth.rotation.y = -angle;
    leftHubGroup.add(tooth);
  }
  pullGroup.add(leftHubGroup);

  // Right hub (Take-up reel)
  const rightHubGroup = new THREE.Group();
  rightHubGroup.position.set(CASSETTE.hubSpacing / 2, 0, 0);
  const rightHub = new THREE.Mesh(hubGeo, hubMat);
  rightHubGroup.add(rightHub);

  for (let t = 0; t < 6; t++) {
    const tooth = new THREE.Mesh(toothGeo, hubMat);
    const angle = (t / 6) * Math.PI * 2;
    tooth.position.set(Math.cos(angle) * 0.108, 0, Math.sin(angle) * 0.108);
    tooth.rotation.y = -angle;
    rightHubGroup.add(tooth);
  }
  pullGroup.add(rightHubGroup);

  // 4. Wound Ferric Magnetic Tape Rolls
  const tapeMat = new THREE.MeshStandardMaterial({
    color: 0x22140c,
    roughness: 0.22,
    metalness: 0.28,
  });

  const leftTapeRadius = 0.28;
  const leftTapeGeo = new THREE.CylinderGeometry(
    leftTapeRadius,
    leftTapeRadius,
    CT * 0.8,
    32
  );
  const leftTapeRoll = new THREE.Mesh(leftTapeGeo, tapeMat);
  leftTapeRoll.position.set(-CASSETTE.hubSpacing / 2, 0, 0);
  pullGroup.add(leftTapeRoll);

  const rightTapeRadius = 0.21;
  const rightTapeGeo = new THREE.CylinderGeometry(
    rightTapeRadius,
    rightTapeRadius,
    CT * 0.8,
    32
  );
  const rightTapeRoll = new THREE.Mesh(rightTapeGeo, tapeMat);
  rightTapeRoll.position.set(CASSETTE.hubSpacing / 2, 0, 0);
  pullGroup.add(rightTapeRoll);

  // 5. Trapezoidal Head Block / Bronze Tape Shield (Lower playback edge)
  const headGeo = new THREE.BoxGeometry(CW * 0.65, CT * 0.88, CD * 0.22);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x28282c,
    roughness: 0.4,
    metalness: 0.7,
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.set(0, 0, CD * 0.41);
  pullGroup.add(headMesh);

  // 6. Five Metallic Screws
  const screwGeo = new THREE.CylinderGeometry(0.022, 0.022, CT * 1.04, 14);
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0xc4c4d0,
    roughness: 0.18,
    metalness: 0.95,
  });
  CASSETTE.screws.forEach((s) => {
    const screw = new THREE.Mesh(screwGeo, screwMat);
    screw.position.set(s.x, 0, s.z);
    pullGroup.add(screw);
  });

  // 7. Brass Tape Guide Rollers
  const rollerGeo = new THREE.CylinderGeometry(0.026, 0.026, CT * 0.85, 16);
  const rollerMat = new THREE.MeshStandardMaterial({
    color: 0xd49b42,
    metalness: 0.9,
    roughness: 0.2,
  });
  const leftRoller = new THREE.Mesh(rollerGeo, rollerMat);
  leftRoller.position.set(-CW * 0.42, 0, CD * 0.38);
  pullGroup.add(leftRoller);

  const rightRoller = new THREE.Mesh(rollerGeo, rollerMat);
  rightRoller.position.set(CW * 0.42, 0, CD * 0.38);
  pullGroup.add(rightRoller);

  // 8. Invisible Pick Box for 100% Reliable Hit-Testing (No depth buffer interference)
  const pickGeo = new THREE.BoxGeometry(CW * 1.1, CT * 1.4, CD * 1.1);
  const pickMat = new THREE.MeshBasicMaterial({
    visible: false,
    depthWrite: false,
    depthTest: false,
  });
  const pickBox = new THREE.Mesh(pickGeo, pickMat);
  pickBox.userData = { index };
  pullGroup.add(pickBox);

  return {
    group,
    pullGroup,
    pickBox,
    leftHubGroup,
    rightHubGroup,
  };
}

interface CassetteEntry {
  group: THREE.Group;
  pullGroup: THREE.Group;
  pickBox: THREE.Mesh;
  leftHubGroup: THREE.Group;
  rightHubGroup: THREE.Group;
  index: number;
  item: VaultItem;
  pullDistance: number;
  targetPull: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CASSETTE TOWER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface CassetteTowerProps {
  onSelectCategory: (cat: VaultCategory) => void;
  selectedCategory: VaultCategory;
  musicMedium?: "cassettes" | "vinyl";
  onSelectMusicMedium?: (medium: "cassettes" | "vinyl") => void;
}

export default function CassetteTower({
  onSelectCategory,
  selectedCategory,
  musicMedium = "cassettes",
  onSelectMusicMedium,
}: CassetteTowerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<VaultItem | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  const musicItems = useMemo(() => {
    return VAULT_ITEMS.filter((it) => it.category === "music");
  }, []);

  const liveStateRef = useRef({
    musicItems,
    spin: 0,
    spinVelocity: 0,
    cameraY: 0,
    cameraYTarget: 0,
  });

  useEffect(() => {
    liveStateRef.current.musicItems = musicItems;
  }, [musicItems]);

  // ── THREE.JS SCENE ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let W = container.clientWidth || window.innerWidth;
    let H = container.clientHeight || window.innerHeight;

    // 1. Renderer (Exact #f2f2f2 background as in CD section)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf2f2f2, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 2. Studio Environment Map (Creates photorealistic reflections)
    const envMap = buildEnvMap(renderer);

    // 3. Scene with Depth Fog matching CD section
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f2f2);
    scene.environment = envMap;
    scene.fog = new THREE.Fog(0xf2f2f2, 2.5, 7.5);

    // 4. Perspective Camera
    const camera = new THREE.PerspectiveCamera(CASSETTE.cameraFOV, W / H, 0.1, 50);
    camera.position.set(0.15, 0.1, W < 768 ? 3.6 : CASSETTE.cameraDistance);

    // 5. Lighting Rig (Clean Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8eb, 2.2);
    keyLight.position.set(3.5, 6, 4.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.4);
    rimLight.position.set(-4, -1, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(0, -3.5, 3.5);
    scene.add(fillLight);

    // 6. Tower Master Group
    const towerGroup = new THREE.Group();
    towerGroup.position.set(W < 768 ? 0 : 0.25, 0, 0);
    scene.add(towerGroup);

    // Breathable Helical Spiral Distribution (Every cassette at a particular distance & clearly visible)
    const cassetteEntries: CassetteEntry[] = [];
    const TOTAL_HEIGHT = (musicItems.length - 1) * CASSETTE.stepY;

    musicItems.forEach((item, idx) => {
      const { group, pullGroup, pickBox, leftHubGroup, rightHubGroup } =
        buildCassetteMesh(item, idx);

      // Golden spiral placement: every cassette has its own distinct angle and height
      const angle = idx * CASSETTE.goldenAngle;
      const x = Math.cos(angle) * CASSETTE.radius;
      const z = Math.sin(angle) * CASSETTE.radius;
      const y = -TOTAL_HEIGHT / 2 + idx * CASSETTE.stepY;

      // Face the long label edge outward towards the viewer
      const rotY = -angle - Math.PI / 2;
      const rotX = Math.sin(idx * 1.5) * 0.025;
      const rotZ = Math.cos(idx * 2.1) * 0.025;

      group.position.set(x, y, z);
      group.rotation.set(rotX, rotY, rotZ);

      towerGroup.add(group);
      cassetteEntries.push({
        group,
        pullGroup,
        pickBox,
        leftHubGroup,
        rightHubGroup,
        index: idx,
        item,
        pullDistance: 0,
        targetPull: 0,
      });
    });

    // ── Interaction: Horizontal Spin, Vertical Scroll & Tape Pull ─────────────
    let hoveredIdx = -1;
    let isPointerDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let lastMoveTime = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      liveStateRef.current.cameraYTarget -= e.deltaY * 0.0018;
      const maxCameraY = TOTAL_HEIGHT * 0.6;
      liveStateRef.current.cameraYTarget = Math.max(
        -maxCameraY,
        Math.min(maxCameraY, liveStateRef.current.cameraYTarget)
      );
    };

    const raycaster = new THREE.Raycaster();
    const pointerVec = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      isPointerDragging = true;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      lastMoveTime = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerVec.x = (e.clientX / W) * 2 - 1;
      pointerVec.y = -((e.clientY / H) * 2 - 1);

      if (isPointerDragging) {
        const deltaX = e.clientX - startPointerX;
        const deltaY = e.clientY - startPointerY;
        startPointerX = e.clientX;
        startPointerY = e.clientY;

        const now = performance.now();
        const dt = Math.max(now - lastMoveTime, 8) / 1000;
        lastMoveTime = now;

        const spinDelta = (deltaX / W) * Math.PI * 1.6;
        liveStateRef.current.spin += spinDelta;
        liveStateRef.current.spinVelocity +=
          (spinDelta / dt - liveStateRef.current.spinVelocity) * 0.28;

        liveStateRef.current.cameraYTarget += (deltaY / H) * 2.2;
        const maxCameraY = TOTAL_HEIGHT * 0.6;
        liveStateRef.current.cameraYTarget = Math.max(
          -maxCameraY,
          Math.min(maxCameraY, liveStateRef.current.cameraYTarget)
        );
      } else {
        raycaster.setFromCamera(pointerVec, camera);
        const pickMeshes = cassetteEntries.map((c) => c.pickBox);
        const intersects = raycaster.intersectObjects(pickMeshes, false);

        if (intersects.length > 0) {
          const hitIdx = intersects[0].object.userData.index as number;
          hoveredIdx = hitIdx;
          const entry = cassetteEntries[hitIdx];
          setHoveredItem(entry.item);

          const screenPos = new THREE.Vector3();
          entry.pullGroup.getWorldPosition(screenPos);
          screenPos.project(camera);
          const rawX = ((screenPos.x + 1) * W) / 2 + 130;
          const rawY = ((-screenPos.y + 1) * H) / 2;

          setHoverPosition({
            x: Math.min(W - 320, Math.max(24, rawX)),
            y: Math.min(H - 160, Math.max(80, rawY)),
          });
          renderer.domElement.style.cursor = "pointer";
        } else {
          hoveredIdx = -1;
          setHoveredItem(null);
          setHoverPosition(null);
          renderer.domElement.style.cursor = "grab";
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isPointerDragging = false;
      const totalDrag = Math.hypot(e.clientX - startPointerX, e.clientY - startPointerY);

      if (totalDrag < 6 && hoveredIdx >= 0) {
        const selected = cassetteEntries[hoveredIdx];
        if (selected.item.externalLink) {
          window.open(selected.item.externalLink, "_blank", "noopener,noreferrer");
        }
      }
    };

    const onResize = () => {
      W = container.clientWidth;
      H = container.clientHeight;
      camera.aspect = W / H;
      camera.position.z = W < 768 ? 3.6 : CASSETTE.cameraDistance;
      towerGroup.position.set(W < 768 ? 0 : 0.25, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };

    const dom = renderer.domElement;
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", onResize);

    // ── Animation Loop (60 FPS Inertia Momentum Physics) ──────────────────────
    let animId: number;
    let prevTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (!isPointerDragging) {
        liveStateRef.current.spinVelocity *= 0.93;
        liveStateRef.current.spin += liveStateRef.current.spinVelocity * dt + 0.0014;
      }
      towerGroup.rotation.y = liveStateRef.current.spin;

      liveStateRef.current.cameraY +=
        (liveStateRef.current.cameraYTarget - liveStateRef.current.cameraY) * (dt * 6.5);
      camera.position.y = liveStateRef.current.cameraY;

      cassetteEntries.forEach((c) => {
        const isHovered = c.index === hoveredIdx;
        c.targetPull = isHovered ? 0.48 : 0;
        c.pullDistance += (c.targetPull - c.pullDistance) * (dt * 9.5);

        c.pullGroup.position.z = c.pullDistance;
        c.pullGroup.position.x = -c.pullDistance * 0.15;
        c.pullGroup.position.y = c.pullDistance * 0.08;

        c.pullGroup.rotation.x = isHovered ? -0.12 : 0;
        c.pullGroup.rotation.y = isHovered ? 0.08 : 0;

        const spinSpeed = isHovered ? 3.2 : 0.35;
        c.leftHubGroup.rotation.y += dt * spinSpeed;
        c.rightHubGroup.rotation.y += dt * spinSpeed * 0.85;
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
      window.removeEventListener("resize", onResize);

      cassetteEntries.forEach((c) => {
        c.group.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              (mesh.material as THREE.Material).dispose();
            }
          }
        });
      });
      envMap.dispose();
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, [musicItems]);

  const categories: { key: VaultCategory; label: string }[] = [
    { key: "cinema", label: "Cinema" },
    { key: "music", label: "Music" },
    { key: "books", label: "Books" },
    { key: "art", label: "Art" },
  ];

  return (
    <main
      className="relative w-screen h-screen overflow-hidden select-none bg-[#f2f2f2] text-black"
      style={{ fontFamily: "inherit" }}
    >
      {/* ── 3D Canvas Mount (Exact #f2f2f2 background as in CD section) ────── */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      />

      {/* ── Subtle Film Grain Overlay ───────────────────────────────────────── */}
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
                onClick={() => onSelectCategory(cat.key)}
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

        {/* Music Medium Switch: Cassettes ↔ Vinyl */}
        <div className="flex items-center gap-1 pointer-events-auto rounded-full border border-black/10 bg-white/80 backdrop-blur-md p-1 shadow-sm text-[10px] font-mono uppercase tracking-widest z-50">
          <button
            type="button"
            onClick={() => onSelectMusicMedium?.("cassettes")}
            className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              musicMedium === "cassettes"
                ? "bg-black text-white font-bold shadow-sm"
                : "text-black/55 hover:text-black hover:bg-black/5"
            }`}
          >
            Cassettes
          </button>
          <button
            type="button"
            onClick={() => onSelectMusicMedium?.("vinyl")}
            className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              musicMedium === "vinyl"
                ? "bg-black text-white font-bold shadow-sm"
                : "text-black/55 hover:text-black hover:bg-black/5"
            }`}
          >
            Vinyl
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL: Monograph & Interaction Guide
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute left-8 md:left-14 top-24 bottom-24 z-30 pointer-events-none flex flex-col justify-between max-w-[280px] md:max-w-[320px]">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-black/45 font-bold block mb-3">
            FREQUENCIES · CASSETTE TOWER
          </span>

          <h1 className="text-3xl md:text-5xl font-black uppercase leading-[0.92] tracking-tight text-black mb-6">
            The Tape Archive
          </h1>

          <p className="text-xs font-mono text-black/70 leading-relaxed">
            Analog ferric and chrome tapes of the ambient drone scores, industrial frequencies, and polyphonies that soundtrack my creative engineering.
          </p>
        </div>

        <div className="border-l border-black/20 pl-4 mt-6">
          <span className="text-[8px] font-mono uppercase tracking-[0.35em] text-black/45 font-bold block mb-2">
            Interaction Guide
          </span>
          <p className="text-[11px] text-black/75 font-light leading-relaxed italic">
            &ldquo;Drag horizontally to spin the tower. Scroll vertically to navigate. Hover over any tape to pull it from the stack.&rdquo;
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TRACKED HOVER OVERLAY: Minimal Line & Badge
      ════════════════════════════════════════════════════════════════════ */}
      {hoveredItem && hoverPosition && (
        <div
          className="absolute z-40 pointer-events-none hidden md:flex items-center gap-3 transition-all duration-150 ease-out"
          style={{
            left: `${hoverPosition.x - 40}px`,
            top: `${hoverPosition.y}px`,
            transform: "translateY(-50%)",
          }}
        >
          {/* Hairline indicator connector */}
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
            <div className="w-8 h-px bg-black/30" />
          </div>

          {/* Minimal Typographic Badge */}
          <div className="bg-white/95 backdrop-blur-2xl border border-black/10 rounded-xl px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] max-w-[300px] text-black">
            <h2 className="text-lg font-bold tracking-tight text-black leading-snug">
              {hoveredItem.title}
            </h2>
            <p className="text-xs font-mono text-black/60 mt-0.5">
              {hoveredItem.creator}, {hoveredItem.year}
            </p>

            <div className="border-t border-black/10 mt-3 pt-2 text-[10px] font-mono text-black/75 italic">
              &ldquo;{hoveredItem.favoriteHighlight}&rdquo;
            </div>

            {hoveredItem.externalLink && (
              <div className="mt-2 text-[9px] font-mono uppercase tracking-widest text-accent font-bold flex items-center gap-1">
                <span>Play on Spotify</span>
                <span>↗</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM FOOTER: Counter & Bizarro Attribution
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 px-8 md:px-14 pb-7 pt-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
          <div className="flex items-center gap-2 font-mono text-black/50">
            <span className="text-black text-xl font-black leading-none">
              0{musicItems.length}
            </span>
            <span className="text-black/30 text-xs">/</span>
            <span className="text-xs font-medium text-black/70">TAPES</span>
          </div>

          <span className="hidden sm:inline-block text-black/20 text-xs">/</span>

          <a
            href="https://bizar.ro/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-black/45 hover:text-black transition-colors group"
            title="Cassette tower architecture inspired by bizar.ro (Luis Bizarro)"
          >
            <span className="underline decoration-black/25 group-hover:decoration-black underline-offset-4">
              Inspired by bizar.ro
            </span>
            <span className="text-[10px] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              ↗
            </span>
          </a>
        </div>

        <div className="pointer-events-none hidden md:block">
          <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-black/35 font-medium">
            Drag to Rotate Tower · Scroll to Navigate · Hover to Pull Tape
          </span>
        </div>
      </footer>
    </main>
  );
}
