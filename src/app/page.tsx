"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "@/components/sections/Hero";
import WhoSection from "@/components/sections/WhoSection";
import KnowMe from "@/components/sections/KnowMe";
import WorkSection from "@/components/sections/WorkSection";
import ContactSection from "@/components/sections/ContactSection";
import { useViewContext } from "@/context/ViewContext";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * PORTFOLIO HOME — CINEMATIC MODE SWITCHER
 * 
 * Separation of Concerns:
 * - PROFILE mode: Hero, WhoSection, KnowMe, ContactSection
 * - WORK mode: WorkSection (Ashfall 3D Gallery & Selected Works ONLY)
 */
export default function Home() {
  const { viewMode } = useViewContext();
  const introRef = useRef<HTMLDivElement>(null);
  const workContainerRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);
  const [keepWorkMounted, setKeepWorkMounted] = useState(false);
  const shouldRenderWork = viewMode === "WORK" || keepWorkMounted;

  // 🎬 THE CINEMATIC TRANSITION (Triggered by Global State)
  useEffect(() => {
    // Initial Setup (No animation)
    if (isInitialRender.current) {
      isInitialRender.current = false;
      
      if (viewMode === "WORK") {
        gsap.set(introRef.current, { display: "none", opacity: 0 });
        gsap.set(workContainerRef.current, { display: "block", opacity: 1, clearProps: "transform" });
      } else {
        // NOTE: never leave a transform on this wrapper — it breaks ScrollTrigger pinning (position: fixed)
        gsap.set(introRef.current, { display: "block", opacity: 1, clearProps: "transform" });
        gsap.set(workContainerRef.current, { display: "none", opacity: 0 });
      }
      return;
    }

    const tl = gsap.timeline({
      onStart: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (viewMode === "WORK") {
          setKeepWorkMounted(true);
        }
      }
    });

    if (viewMode === "WORK") {
      // 🛫 EXIT PROFILE VIEW
      tl.to(introRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.45,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(introRef.current, { display: "none" });
          gsap.set(workContainerRef.current, { display: "block" });
          ScrollTrigger.refresh();
        }
      })
      // 🛬 REVEAL WORK VIEW ONLY
      .fromTo(workContainerRef.current, 
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.55, ease: "power2.out",
          clearProps: "transform",
          onComplete: () => ScrollTrigger.refresh(),
        }
      );
    } else {
      // 🛫 EXIT WORK VIEW
      tl.to(workContainerRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.45,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(workContainerRef.current, { display: "none" });
          setKeepWorkMounted(false);
          gsap.set(introRef.current, { display: "block" });
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }
      })
      // 🛬 REVEAL PROFILE VIEW
      .fromTo(introRef.current, 
        { opacity: 0, y: -30 },
        {
          opacity: 1, y: 0, duration: 0.55, ease: "power2.out",
          clearProps: "transform",
          onComplete: () => ScrollTrigger.refresh(),
        }
      );
    }
  }, [viewMode]);

  return (
    <main className="relative bg-background min-h-screen">
      {/* 🖼️ PROFILE VIEW: Hero, Who, KnowMe, Contact (NO work section here) */}
      <div ref={introRef} className="view-container">
        <Hero />
        <WhoSection />
        <KnowMe />
        <ContactSection />
      </div>

      {/* 🛠️ WORK VIEW: WorkSection ONLY (Mounted on demand so WebGL doesn't run hidden in PROFILE mode) */}
      <div ref={workContainerRef} className="view-container" style={{ display: "none" }}>
        {shouldRenderWork && <WorkSection />}
      </div>
    </main>
  );
}
