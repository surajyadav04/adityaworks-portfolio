"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Hero from "@/components/sections/Hero";
import WhoSection from "@/components/sections/WhoSection";
import KnowMe from "@/components/sections/KnowMe";
import WorkSection from "@/components/sections/WorkSection";
import ContactSection from "@/components/sections/ContactSection";
import ViewToggle from "@/components/ViewToggle";

/**
 * PORTFOLIO HOME — CINEMATIC MODE SWITCHER
 * 
 * Flow:
 * 1. Default Mode: PROFILE (All sections).
 * 2. Toggle to WORK: Smoothly scrolls to top, then fades out PROFILE 
 *    with a -40px upward slide, followed by WORK fading in with 
 *    a +40px upward slide.
 */
export default function Home() {
  const [viewMode, setViewMode] = useState<"PROFILE" | "WORK">("PROFILE");
  const profileRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLDivElement>(null);

  // 🎬 THE CINEMATIC TRANSITION
  const handleToggle = (newMode: "PROFILE" | "WORK") => {
    if (newMode === viewMode) return;

    const tl = gsap.timeline({
      onStart: () => {
        // SMOOTH SCROLL TO TOP ON SWITCH
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    if (newMode === "WORK") {
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
        ease: "power2.out",
        onComplete: () => {
          setViewMode("WORK");
        }
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
        ease: "power2.out",
        onComplete: () => {
          setViewMode("PROFILE");
        }
      });
    }
  };

  // Initial State Setup
  useEffect(() => {
    if (viewMode === "PROFILE") {
      gsap.set(workRef.current, { display: "none", opacity: 0 });
    } else {
      gsap.set(profileRef.current, { display: "none", opacity: 0 });
    }
  }, []);

  return (
    <main className="relative bg-background min-h-screen">
      <ViewToggle currentMode={viewMode} onToggle={handleToggle} />

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
