"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export default function Hero() {
  const container = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(".hero-line", {
      y: 100,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: "power4.out",
      delay: 0.8,
    })
    .from(".hero-sub", {
      opacity: 0,
      y: 20,
      duration: 1,
      ease: "power3.out",
    }, "-=0.8")
    .fromTo(".scroll-indicator", 
      { opacity: 0, y: 15 },
      { opacity: 0.45, y: 0, duration: 1, ease: "power2.out" }, 
      "-=0.4"
    );

    // Subtle ambient floating pulse
    gsap.to(".scroll-indicator-icon", {
      y: 4,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2,
    });
  }, { scope: container });

  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector("#about");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <section ref={container} className="relative h-screen flex flex-col justify-center px-8 md:px-24">
      <div className="overflow-hidden pt-4 pb-4">
        <h1 className="hero-line text-display flex flex-wrap gap-x-6" aria-label="AdityaWorks">
          <span className="text-text">Aditya</span>
          <span className="text-accent">/Works</span>
        </h1>
      </div>

      <div className="mt-8 overflow-hidden">
        <p className="hero-sub text-body text-text-light max-w-xl">
          Senior Full-stack Creative Developer & Motion Designer.<br />
          Experience-driven narratives through code and motion.
        </p>
      </div>

      {/* 🧭 MINIMAL SCROLL DOWN INDICATOR */}
      <a
        href="#about"
        onClick={handleScrollDown}
        className="scroll-indicator group absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer select-none transition-all duration-300 opacity-40 hover:opacity-90"
        aria-label="Scroll to explore"
      >
        <span className="text-[9px] uppercase tracking-[0.35em] font-mono text-text/60 group-hover:text-accent transition-colors">
          Scroll Down
        </span>
        <div className="scroll-indicator-icon flex flex-col items-center">
          <svg 
            className="w-3.5 h-3.5 text-text/50 group-hover:text-accent transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
          </svg>
        </div>
      </a>
    </section>
  );
}
