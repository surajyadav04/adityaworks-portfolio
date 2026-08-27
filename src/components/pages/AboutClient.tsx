"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useEffect, useCallback } from "react";
import ContactSection from "@/components/sections/ContactSection";

const TOTAL_FRAMES = 300;
const getFramePath = (index: number) => {
  const paddedIndex = String(index).padStart(3, "0");
  return `/frames/smoke-scroll/ezgif-frame-${paddedIndex}.jpg`;
};

export default function AboutClient() {
  const mainRef = useRef<HTMLElement>(null);
  const container = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const whoPart = useRef<HTMLSpanElement>(null);
  const amiPart = useRef<HTMLSpanElement>(null);
  const contentSection = useRef<HTMLDivElement>(null);

  // Store preloaded HTMLImageElements in ref (zero re-render overhead)
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(1);
  const targetFrameRef = useRef(1);
  const lastDrawnFrameRef = useRef(-1);
  const animFrameIdRef = useRef<number | null>(null);

  // 🚀 FAST SCROLL RESET ON MOUNT
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 50);
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    return () => clearTimeout(timer);
  }, []);

  // 🎨 CRISP SCREEN-COVER CANVAS RENDER (Retains current frame, never shows blank screen)
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const clampedIndex = Math.min(Math.max(1, Math.round(frameIndex)), TOTAL_FRAMES);

    // Get requested frame or fallback to closest loaded frame
    let img = framesRef.current[clampedIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset <= 50; offset++) {
        const prev = framesRef.current[clampedIndex - offset];
        if (prev && prev.complete && prev.naturalWidth > 0) {
          img = prev;
          break;
        }
        const next = framesRef.current[clampedIndex + offset];
        if (next && next.complete && next.naturalWidth > 0) {
          img = next;
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    if (canvas.width !== Math.round(canvasWidth * dpr) || canvas.height !== Math.round(canvasHeight * dpr)) {
      canvas.width = Math.round(canvasWidth * dpr);
      canvas.height = Math.round(canvasHeight * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 🌟 FULL EDGE-TO-EDGE SCREEN COVER
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth: number;
    let drawHeight: number;

    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
    }

    const drawX = (canvasWidth - drawWidth) / 2;
    const drawY = (canvasHeight - drawHeight) / 2;

    // High quality crisp smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    lastDrawnFrameRef.current = clampedIndex;
  }, []);

  // 📥 FAST BACKGROUND PRELOADER (Instant 1st frame, zero freeze)
  useEffect(() => {
    let isCancelled = false;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES + 1);

    // 1. Load 1st frame immediately for instantaneous visual
    const firstImg = new Image();
    firstImg.src = getFramePath(1);
    firstImg.onload = () => {
      images[1] = firstImg;
      if (!isCancelled) {
        framesRef.current = images;
        renderFrame(1);
      }
    };
    images[1] = firstImg;

    // 2. Preload remaining frames
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      images[i] = img;
    }

    framesRef.current = images;

    return () => {
      isCancelled = true;
    };
  }, [renderFrame]);

  // 🔄 ULTRA-FLUID ZERO-LAG ANIMATION LOOP
  useEffect(() => {
    const animate = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;

      // Snappy lerp (0.22) for liquid-smooth response without delay or jitter
      if (Math.abs(diff) > 0.005) {
        currentFrameRef.current += diff * 0.22;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      const rounded = Math.round(currentFrameRef.current);
      if (rounded !== lastDrawnFrameRef.current) {
        renderFrame(rounded);
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      renderFrame(Math.round(currentFrameRef.current));
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [renderFrame]);

  // 🎬 GSAP SCROLLTRIGGER TIMELINE
  useGSAP(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    if (!container.current) return;

    // 🎬 GSAP SCROLL TIMELINE WITH NARRATIVE REVEALS
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "+=280%",
        scrub: 0.15,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const target = 1 + self.progress * (TOTAL_FRAMES - 1);
          targetFrameRef.current = target;
        },
      },
    });

    // 1. "WHO AM I?" Headline Splits Apart
    scrollTl
      .to(whoPart.current, {
        yPercent: -140,
        opacity: 0,
        filter: "blur(6px)",
        duration: 0.8,
        ease: "power2.inOut",
      }, 0)
      .to(amiPart.current, {
        yPercent: 140,
        opacity: 0,
        filter: "blur(6px)",
        duration: 0.8,
        ease: "power2.inOut",
      }, 0)
      // 2. Story Beat 1: Slides up, holds cleanly, then dissolves
      .fromTo(
        ".story-beat-1",
        { opacity: 0, y: 40, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power2.out" },
        0.35
      )
      .to(
        ".story-beat-1",
        { opacity: 0, y: -30, filter: "blur(6px)", duration: 0.5, ease: "power2.in" },
        1.25
      )
      // 3. Story Beat 2: Slides up, holds cleanly, then dissolves
      .fromTo(
        ".story-beat-2",
        { opacity: 0, y: 40, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power2.out" },
        1.45
      )
      .to(
        ".story-beat-2",
        { opacity: 0, y: -30, filter: "blur(6px)", duration: 0.5, ease: "power2.in" },
        2.35
      );

    // Content reveal below
    gsap.fromTo(
      ".about-detail-block",
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.25,
        ease: "power2.out",
        scrollTrigger: {
          trigger: contentSection.current,
          start: "top 80%",
          scrub: false,
        },
      }
    );
  }, { scope: mainRef });

  return (
    <main ref={mainRef} className="relative bg-background min-h-screen selection:bg-accent selection:text-white">
      {/* 🎬 FULLSCREEN PINNED CANVAS HERO */}
      <section
        ref={container}
        className="relative w-full h-screen overflow-hidden bg-background flex items-center justify-center"
      >
        {/* Fullscreen Video Canvas — Crisp & Edge-to-Edge */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply opacity-95"
        />

        {/* Floating "WHO AM I?" Split Headline */}
        <div className="relative z-10 pointer-events-none w-full text-center px-4 overflow-visible">
          <h1 className="text-[17vw] sm:text-[15vw] md:text-[12vw] font-bebas font-black text-[#8B0000] uppercase italic leading-none whitespace-nowrap overflow-visible drop-shadow-md">
            <span ref={whoPart} className="inline-block relative">
              WHO&nbsp;
            </span>
            <span ref={amiPart} className="inline-block relative">
              AM&nbsp;I?
            </span>
          </h1>
        </div>

        {/* 🎬 CINEMATIC NARRATIVE (South Indian Blockbuster Style — Rozha One + Red/White) */}
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-8 sm:p-12 md:p-16">
          {/* Statement 1: Top Left */}
          <div className="story-beat-1 max-w-xl opacity-0">
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#D14836] font-black mb-2 font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              / 01 ORIGIN
            </p>
            <h3 className="font-rozha text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[0.95] uppercase tracking-normal mb-3 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
              From Physical Space to Digital Canvas
            </h3>
            <p className="text-base sm:text-lg text-white/95 font-bold leading-relaxed max-w-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              Architecture taught me that space has emotion. Code taught me that logic has elegance. I bring both into everything I engineer.
            </p>
          </div>

          {/* Statement 2: Bottom Right */}
          <div className="story-beat-2 self-end max-w-xl text-right opacity-0">
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#D14836] font-black mb-2 font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              / 02 MANIFESTO
            </p>
            <h3 className="font-rozha text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[0.95] uppercase tracking-normal mb-3 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
              A Quiet Refusal to Be Average
            </h3>
            <p className="text-base sm:text-lg text-white/95 font-bold leading-relaxed max-w-lg ml-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              Every frame, motion transition, and interaction crafted with relentless attention to detail and human soul.
            </p>
          </div>
        </div>
      </section>

      {/* 📖 EDITORIAL STORY CONTENT */}
      <section
        ref={contentSection}
        className="relative py-24 px-8 md:px-24 max-w-6xl mx-auto z-20 bg-background"
      >
        <div className="about-detail-block mb-24">
          <h2 className="text-xs uppercase tracking-[0.4em] text-accent font-bold mb-8 italic">
            / THE ARCHITECT OF EXPERIENCES
          </h2>
          <p className="text-section-title leading-tight mb-12">
            I build digital monuments that{" "}
            <span className="text-text-light underline decoration-accent/30">
              breathe.
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <p className="text-body text-text-light leading-relaxed opacity-90">
              My journey began at the intersection of structure and soul—Architecture.
              It taught me that space is not just physical; it is emotional. When
              I transitioned into the digital realm, I brought that same philosophy
              with me. I don&apos;t just code websites; I architect environments.
            </p>
            <p className="text-body text-text-light leading-relaxed opacity-90">
              As a Senior Creative Developer, I specialize in crafting
              experience-driven narratives through motion, high-performance code,
              and relentless attention to detail. Every project is a manifesto—a
              refusal to accept the average.
            </p>
          </div>
        </div>

        <div className="about-detail-block grid grid-cols-1 md:grid-cols-3 gap-12 py-24 border-t border-text/10">
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">
              01 / VISION
            </h3>
            <p className="text-sm text-text-light leading-relaxed opacity-80">
              To bridge the gap between technological precision and human
              emotion, creating digital interactions that feel organic yet
              engineered.
            </p>
          </div>
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">
              02 / CRAFT
            </h3>
            <p className="text-sm text-text-light leading-relaxed opacity-80">
              Relentless pursuit of perfection in motion, performance, and
              storytelling. Pixel perfection is not a goal; it&apos;s the baseline.
            </p>
          </div>
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">
              03 / FUTURE
            </h3>
            <p className="text-sm text-text-light leading-relaxed opacity-80">
              Constantly exploring the boundaries of the web, ensuring that every
              experience I build is ready for the high-end landscape of tomorrow.
            </p>
          </div>
        </div>
      </section>

      <ContactSection />
    </main>
  );
}
