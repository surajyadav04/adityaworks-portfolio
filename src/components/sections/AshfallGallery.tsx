"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { PROJECTS, Project } from "@/data/projects";

interface GalleryCardItem {
  project: Project;
  image: string;
  slug: string;
  row: number;
  col: number;
}

// OPTIMIZED VERTEX SHADER
const vertexShader = `
  uniform float scrollVelocity;
  uniform float hover;

  varying vec2 vUv;

  float PI = 3.1415926535897932384626433832795;

  vec3 deformationCurve(vec3 position, vec2 uv) {
    float clampedVel = clamp(scrollVelocity, -3.0, 3.0);
    position.x -= sin(uv.y * PI) * clampedVel * 0.01;
    return position;
  }

  void main() {
    vUv = uv;
    vec3 pos = deformationCurve(position, uv);
    if (hover > 0.001) {
      pos.xy *= 1.0 + 0.2 * hover;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// ULTRA-OPTIMIZED FRAGMENT SHADER:
// Evaluates expensive FBM noise & Chromatic Aberration ONLY on the hovered card
const fragmentShader = `
  uniform float scrollVelocity;
  uniform float time;
  uniform float hover;

  uniform sampler2D uTexture;
  uniform vec2 uMouseCords;

  varying vec2 vUv;

  #define NUM_OCTAVES 4

  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);
    return mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + vec2(100.0);
      a *= 0.5;
    }
    return v;
  }

  vec2 zoom(vec2 uv, float amount) {
    return 0.5 + ((uv - 0.5) * (1.0 - amount));
  }

  void main() {
    // ⚡ FAST PATH FOR UNHOVERED CARDS: ZERO FBM NOISE, SINGLE TEXTURE SAMPLE
    if (hover < 0.005) {
      vec4 baseTex = texture2D(uTexture, vUv);
      float lum = dot(baseTex.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(vec3(lum * 0.85), 0.55);
      return;
    }

    // 🎨 HOVERED CARD PATH: Glitch displacement + Chromatic aberration + Color bloom
    vec2 mouseDist = uMouseCords - vUv;
    float dist = length(mouseDist);

    float glitchWave = smoothstep(0.01 + fbm(vUv * 12.0 + time * 0.7), 0.0, dist) * 0.35 * hover;
    vec2 displacedUV = zoom(vUv, 0.12 * hover);
    displacedUV.x += glitchWave;

    float ca = 0.012 * hover;
    vec4 redChannel = texture2D(uTexture, displacedUV + vec2(ca, 0.0));
    vec4 greenChannel = texture2D(uTexture, displacedUV + vec2(0.0, ca * 0.5));
    vec4 blueChannel = texture2D(uTexture, displacedUV - vec2(ca, 0.0));

    vec3 rgb = vec3(redChannel.r, greenChannel.g, blueChannel.b);
    vec3 grayscale = vec3(dot(rgb, vec3(0.299, 0.587, 0.114)));

    vec3 finalRgb = mix(grayscale, rgb, hover);
    float alpha = 0.55 + (hover * 0.45);

    gl_FragColor = vec4(finalRgb, alpha);
  }
`;

// EXACT ASHFALL ARC-BENDING ALGORITHM FOR PLANE GEOMETRY
function bendPlane(geo: THREE.PlaneGeometry, depth = 0.07) {
  const w = geo.parameters.width * 0.5;
  const p1 = new THREE.Vector2(-w, 0);
  const p2 = new THREE.Vector2(0, depth);
  const p3 = new THREE.Vector2(w, 0);
  const a = new THREE.Vector2().subVectors(p1, p2);
  const b = new THREE.Vector2().subVectors(p2, p3);
  const c = new THREE.Vector2().subVectors(p1, p3);
  const radius = (a.length() * b.length() * c.length()) / (2 * Math.abs(a.cross(c)));
  const center = new THREE.Vector2(0, depth - radius);
  const angle = (new THREE.Vector2().subVectors(p1, center).angle() - Math.PI * 0.5) * 2;
  const uvs = geo.attributes.uv;
  const pos = geo.attributes.position;
  const temp = new THREE.Vector2();

  for (let i = 0; i < uvs.count; i++) {
    const u = 1 - uvs.getX(i);
    const y = pos.getY(i);
    temp.copy(p3).rotateAround(center, angle * u);
    pos.setXYZ(i, temp.x, y, -temp.y);
  }
  pos.needsUpdate = true;
}

export default function AshfallGallery() {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [hoveredCard, setHoveredCard] = useState<GalleryCardItem | null>(null);

  // 6 rows x 6 columns = 36 cards total
  const galleryItems = useMemo(() => {
    const items: GalleryCardItem[] = [];
    const rows = 6;
    const cols = 6;

    const visuals = [
      { img: "/projects/placeprep.png", proj: PROJECTS[0] },
      { img: "/projects/weird-wanderer.png", proj: PROJECTS[1] },
      { img: "/projects/climate-rain.png", proj: PROJECTS[1] },
      { img: "/projects/elysium.png", proj: PROJECTS[2] },
      { img: "/projects/synthesis.png", proj: PROJECTS[3] },
      { img: "/projects/origin.png", proj: PROJECTS[4] },
      { img: "/projects/coordinates.png", proj: PROJECTS[1] },
      { img: "/projects/scroll-experience.png", proj: PROJECTS[1] },
      { img: "/projects/climate-snow.png", proj: PROJECTS[1] },
    ];

    let vIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = visuals[vIdx % visuals.length];
        const proj = v.proj || PROJECTS[c % PROJECTS.length];
        const slug = proj.title.toLowerCase().replace(/\s+/g, "-");
        items.push({
          project: proj,
          image: v.img,
          slug,
          row: r,
          col: c,
        });
        vIdx++;
      }
    }
    return items;
  }, []);

  const handleNavigate = useCallback(
    (slug: string) => {
      router.push(`/work/${slug}`);
    },
    [router]
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // SCENE & RENDERER SETUP
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.0001, 1000);
    camera.position.z = width < 768 ? 2.3 : 2.0;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Capped at 1.5 for rock-solid 60-120 FPS
    renderer.setClearColor("#212121");
    container.appendChild(renderer.domElement);

    // BENT CURVED GEOMETRY
    const cardGeo = new THREE.PlaneGeometry(0.6, 0.4, 8, 8);
    bendPlane(cardGeo, 0.07);

    // SHARED TEXTURE CACHE: Loads each unique image only once
    const textureLoader = new THREE.TextureLoader();
    const textureCache = new Map<string, THREE.Texture>();
    const getCachedTexture = (url: string) => {
      if (!textureCache.has(url)) {
        const tex = textureLoader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        textureCache.set(url, tex);
      }
      return textureCache.get(url)!;
    };

    // ASHFALL CYLINDER STRUCTURE WITH COUNTER-ROTATING GROUPS
    const mainCylinderGroup = new THREE.Group();
    scene.add(mainCylinderGroup);
    mainCylinderGroup.position.y = -2.0;

    const groupA = new THREE.Group(); // Even rows (clockwise)
    const groupB = new THREE.Group(); // Odd rows (counter-clockwise)
    mainCylinderGroup.add(groupA, groupB);

    const cardMeshes: THREE.Mesh[] = [];
    const COLS = 6;

    galleryItems.forEach((item) => {
      const texture = getCachedTexture(item.image);

      const angle = (item.col / COLS) * 2 * Math.PI + item.row;
      const isEvenRow = item.row % 2 === 0;
      const radius = isEvenRow ? 1.25 : 1.15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = item.row * 0.8;

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          time: { value: 0 },
          scrollVelocity: { value: 0 },
          hover: { value: 0 },
          uTexture: { value: texture },
          uMouseCords: { value: new THREE.Vector2(0.5, 0.5) },
        },
      });

      const mesh = new THREE.Mesh(cardGeo, material);
      mesh.position.set(x, y, z);
      mesh.lookAt(new THREE.Vector3(0, y, 0));

      mesh.userData = {
        item,
        angle,
      };

      if (isEvenRow) {
        groupA.add(mesh);
      } else {
        groupB.add(mesh);
      }

      cardMeshes.push(mesh);
    });

    // INTERACTION & VELOCITY PHYSICS
    let scrollY = 0;
    let targetScrollY = 0;
    let scrollVelocity = 0;
    let targetVelocity = 0;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragVelocityX = 0;

    const mouse = new THREE.Vector2(-999, -999);
    const raycaster = new THREE.Raycaster();
    let currentHoveredMesh: THREE.Mesh | null = null;

    // POINTER TRACKING
    const onPointerMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      camera.position.x += (mouse.x - camera.position.x) * 0.003;
      camera.position.y += (mouse.y - camera.position.y) * 0.003;
      camera.lookAt(scene.position);

      if (isDragging) {
        const deltaX = e.clientX - lastPointerX;
        const deltaY = e.clientY - lastPointerY;
        dragVelocityX = deltaX * 0.003;
        mainCylinderGroup.rotation.y += dragVelocityX;
        targetScrollY -= deltaY * 1.5;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      dragVelocityX = 0;
    };

    const onPointerUp = () => {
      isDragging = false;
      targetVelocity = dragVelocityX * 20;
    };

    // OPTIMIZED SMOOTH WHEEL INTERACTION
    const onWheel = (e: WheelEvent) => {
      targetScrollY += e.deltaY * 0.5;
      targetVelocity = e.deltaY * 0.015;
      mainCylinderGroup.rotation.y += e.deltaY * 0.0008;
    };

    // CLICK EVENT
    const onClick = (e: MouseEvent) => {
      if (Math.abs(dragVelocityX) > 0.005) return;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cardMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const item: GalleryCardItem = hit.userData.item;
        if (item) {
          handleNavigate(item.slug);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: true });
    dom.addEventListener("click", onClick);

    // RESIZE
    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.position.z = width < 768 ? 2.3 : 2.0;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    // ANIMATION LOOP — OPTIMIZED 60-120 FPS
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Dual counter-rotation
      groupA.rotation.y += 0.0005;
      groupB.rotation.y -= 0.0005;

      // Smooth momentum lerping
      scrollY += (targetScrollY - scrollY) * 0.08;
      scrollVelocity += (targetVelocity - scrollVelocity) * 0.1;
      targetVelocity *= 0.88;

      mainCylinderGroup.position.y = -2.0 + (scrollY * 0.0005) % 3.0;

      // Update shader uniforms
      for (let i = 0; i < cardMeshes.length; i++) {
        const mat = cardMeshes[i].material as THREE.ShaderMaterial;
        mat.uniforms.time.value = elapsedTime;
        mat.uniforms.scrollVelocity.value = scrollVelocity;
      }

      // RAYCAST ONLY WHEN NOT SCROLLING FAST (eliminates CPU hiccups)
      const isFastScrolling = isDragging || Math.abs(scrollVelocity) > 0.03;

      if (!isFastScrolling) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cardMeshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0];
          const topMesh = hit.object as THREE.Mesh;
          const mat = topMesh.material as THREE.ShaderMaterial;

          if (hit.uv) {
            gsap.to(mat.uniforms.uMouseCords.value, {
              x: hit.uv.x,
              y: hit.uv.y,
              duration: 0.8,
              ease: "power3",
            });
          }

          if (currentHoveredMesh !== topMesh) {
            if (currentHoveredMesh) {
              const prevMat = currentHoveredMesh.material as THREE.ShaderMaterial;
              gsap.to(prevMat.uniforms.hover, { value: 0, duration: 0.25, ease: "circ" });
            }
            currentHoveredMesh = topMesh;
            gsap.to(mat.uniforms.hover, { value: 1, duration: 0.25, ease: "circ" });

            const item: GalleryCardItem = topMesh.userData.item;
            setHoveredCard(item);
            dom.style.cursor = "pointer";
          }
        } else {
          if (currentHoveredMesh) {
            const prevMat = currentHoveredMesh.material as THREE.ShaderMaterial;
            gsap.to(prevMat.uniforms.hover, { value: 0, duration: 0.25, ease: "circ" });
            currentHoveredMesh = null;
            setHoveredCard(null);
            dom.style.cursor = isDragging ? "grabbing" : "grab";
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      dom.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);

      cardMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      });
      cardGeo.dispose();
      renderer.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, [galleryItems, handleNavigate]);

  return (
    <div className="relative w-screen h-screen select-none overflow-hidden bg-[#212121]">
      {/* Edge-to-Edge WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Status / Hint (Bottom Right) */}
      <div className="pointer-events-none absolute bottom-8 right-8 hidden md:flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-[11px] font-sans text-white/80 z-20">
        <span>Drag to rotate</span>
        <span>•</span>
        <span>Scroll to move</span>
      </div>

      {/* Floating Project HUD (Positioned above the bottom dock) */}
      <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 transition-all duration-300 z-20">
        {hoveredCard && (
          <div className="bg-black/40 backdrop-blur-xl border border-white/20 p-5 sm:p-6 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-accent bg-accent/20 border border-accent/30 px-2 py-0.5 rounded">
                  {hoveredCard.project.category}
                </span>
                <span className="text-[9px] font-mono text-white/60">
                  / {hoveredCard.project.year}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {hoveredCard.project.title}
              </h3>
              <p className="text-xs text-white/70 line-clamp-1 max-w-md">
                {hoveredCard.project.description}
              </p>
            </div>

            <div className="pointer-events-auto shrink-0">
              <button
                onClick={() => handleNavigate(hoveredCard.slug)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-black font-sans text-[11px] uppercase tracking-wider font-bold rounded-lg hover:bg-accent hover:text-white transition-colors duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Case Study</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
