"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import Hero from "@/components/sections/Hero";
import WhoSection from "@/components/sections/WhoSection";
import KnowMe from "@/components/sections/KnowMe";
import WorkSection from "@/components/sections/WorkSection";
import ContactSection from "@/components/sections/ContactSection";
import { useViewContext } from "@/context/ViewContext";

/**
 * PORTFOLIO HOME — CINEMATIC MODE SWITCHER (GLOBAL SYNC)
 * 
 * Logic:
 * 1. Consumes 'viewMode' from ViewContext (linked to Navbar).
 * 2. On change: Triggers the high-end fade out / slide up transition.
 */
export default function Home() {
  const { viewMode } = useViewContext();
  const profileRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);

  // 🎬 THE CINEMATIC TRANSITION (Triggered by Global State)
  useEffect(() => {
    // Skip animation on first render to prevent "flashing" the wrong mode
    if (isInitialRender.current) {
      isInitialRender.current = false;
      
      // Ensure correct initial visibility based on default PROFILE mode
      if (viewMode === "PROFILE") {
        gsap.set(workRef.current, { display: "none", opacity: 0 });
        gsap.set(profileRef.current, { display: "block", opacity: 1, y: 0 });
      } else {
        gsap.set(profileRef.current, { display: "none", opacity: 0 });
        gsap.set(workRef.current, { display: "block", opacity: 1, y: 0 });
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
      // 🛫 EXIT PROFILE
      tl.to(profileRef.current, {
        opacity: 0,
        y: -40,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(profileRef.current, { display: "none" });
        }
      })
      // 🛬 ENTER WORK
      .set(workRef.current, { display: "block", opacity: 0, y: 40 })
      .to(workRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: 0.1,
        ease: "power2.out"
      });
    } else {
      // 🛫 EXIT WORK
      tl.to(workRef.current, {
        opacity: 0,
        y: -40,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(workRef.current, { display: "none" });
        }
      })
      // 🛬 ENTER PROFILE
      .set(profileRef.current, { display: "block", opacity: 0, y: 40 })
      .to(profileRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: 0.1,
        ease: "power2.out"
      });
    }
  }, [viewMode]);

  return (
    <main className="relative bg-background min-h-screen">
      {/* Navbar handled globally in layout.tsx */}
      
      {/* 🖼️ PROFILE VIEW (DEFAULT) */}
      <div ref={profileRef} className="view-container">
        <Hero />
        <WhoSection />
        <KnowMe />
        <WorkSection />
        <ContactSection />
      </div>

      {/* 🛠️ WORK VIEW (ONLY SELECTED PROJECTS & CONTACT) */}
      <div ref={workRef} className="view-container">
        <div className="pt-24 min-h-screen">
          <WorkSection />
          <ContactSection />
        </div>
      </div>
    </main>
  );
}
