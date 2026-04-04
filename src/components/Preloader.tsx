"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, useEffect } from "react";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const container = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const text = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    // 1. Initial State
    gsap.set(text.current, { filter: "blur(20px)", opacity: 0, scale: 0.9 });
    gsap.set(ring.current, { strokeDasharray: "283", strokeDashoffset: "283" });

    // 2. The Ring Progress (Cinematic loading simulation)
    tl.to(ring.current, {
      strokeDashoffset: 0,
      duration: 2.2,
      ease: "power2.inOut",
    })
    // 3. The Greeting Reveal (Blur-to-sharp)
    .to(text.current, {
      filter: "blur(0px)",
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: "power3.out",
    }, "-=1.2")
    // 4. Hold the moment
    .to({}, { duration: 0.8 })
    // 5. The "Curtain Up" Exit
    .to(container.current, {
      yPercent: -100,
      duration: 1.2,
      ease: "power4.inOut",
    })
    .to(text.current, {
        opacity: 0,
        y: -50,
        duration: 0.5,
    }, "-=1.0");

  }, { scope: container });

  return (
    <div 
      ref={container}
      className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex items-center justify-center overflow-hidden pointer-events-auto"
    >
      {/* ⭕ THE CIRCULAR INDICATOR (TOP-LEFT) */}
      <div className="absolute top-12 left-12 w-10 h-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="2"
          />
          {/* Progress Ring */}
          <circle
            ref={ring}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ✍️ THE PERSONALIZED GREETING (CENTER) */}
      <h2 
        ref={text}
        className="text-[1.5rem] md:text-[2.5rem] font-light text-white tracking-widest uppercase text-center px-6"
      >
        Hey Aditya<span className="text-accent underline underline-offset-8 ml-2">...</span>
      </h2>

      {/* 🌫️ SUBTLE NOISE OVERLAY */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none grain" />
    </div>
  );
}
