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
    .from(".scroll-indicator", {
      opacity: 0,
      y: -10,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    }, "-=0.5");
  }, { scope: container });

  return (
    <section ref={container} className="h-screen flex flex-col justify-center px-8 md:px-24">
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

      <div className="scroll-indicator absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-text-light opacity-50">
        Scroll to explore
      </div>
    </section>
  );
}
