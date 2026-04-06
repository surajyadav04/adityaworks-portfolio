"use client";

import { useRef, useEffect } from "react";
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
 * PORTFOLIO HOME — CINEMATIC MODE SWITCHER (FIXED)
 * 
 * Fixes:
 * 1. Single-rendering all sections to prevent GSAP selector conflicts.
 * 2. ScrollTrigger.refresh() on mode toggle to fix "invisible works".
 */
export default function Home() {
  const { viewMode } = useViewContext();
  const introRef = useRef<HTMLDivElement>(null);
  const workContainerRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);

  // 🎬 THE CINEMATIC TRANSITION (Triggered by Global State)
  useEffect(() => {
    // Initial Setup (No animation)
    if (isInitialRender.current) {
      isInitialRender.current = false;
      
      if (viewMode === "WORK") {
        gsap.set(introRef.current, { display: "none", opacity: 0 });
        gsap.set(workContainerRef.current, { y: 0, opacity: 1 });
      } else {
        gsap.set(introRef.current, { display: "block", opacity: 1 });
      }
      return;
    }

    const tl = gsap.timeline({
      onStart: () => {
        // SMOOTH SCROLL TO TOP ON SWITCH
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    if (viewMode === "WORK") {
      // 🛫 EXIT INTRO (PROFILE SECTIONS)
      tl.to(introRef.current, {
        opacity: 0,
        y: -40,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(introRef.current, { display: "none" });
          // REFRESH SCROLLTRIGGER AFTER LAYOUT CHANGE
          ScrollTrigger.refresh();
        }
      })
      // 🛬 REVEAL WORK
      .fromTo(workContainerRef.current, 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: "power2.out" }
      );
    } else {
      // 🛫 EXIT WORK MODE (Show Intro Again)
      tl.set(introRef.current, { display: "block", opacity: 0, y: 40 })
      .to(introRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        onComplete: () => {
          // REFRESH SCROLLTRIGGER AFTER LAYOUT CHANGE
          ScrollTrigger.refresh();
        }
      });
    }
  }, [viewMode]);

  return (
    <main className="relative bg-background min-h-screen">
      {/* 🖼️ PROFILE INTRO (Hero, Who, KnowMe) */}
      <div ref={introRef} className="view-container">
        <Hero />
        <WhoSection />
        <KnowMe />
      </div>

      {/* 🛠️ WORK & CONTACT (Rendered only ONCE) */}
      <div ref={workContainerRef} className={`view-container ${viewMode === 'WORK' ? 'pt-24' : ''}`}>
        <WorkSection />
        <ContactSection />
      </div>
    </main>
  );
}
