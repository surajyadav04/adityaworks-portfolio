"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export default function AboutSection() {
  const container = useRef(null);

  useGSAP(() => {
    // Reveal text line by line
    gsap.from(".reveal-text", {
      scrollTrigger: {
        trigger: container.current,
        start: "top 70%",
      },
      y: 30,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: "power3.out"
    });
  }, { scope: container });

  return (
    <section id="about" ref={container} className="py-48 px-8 md:px-24 bg-background">
      <div className="max-w-4xl">
        <h2 className="text-xs uppercase tracking-widest text-accent font-bold mb-8 italic">/ THE PHILOSOPHY</h2>
        
        <p className="text-section-title mb-12">
          <span className="reveal-text block">Designing for the senses,</span>
          <span className="reveal-text block">building for the future.</span>
        </p>

        <p className="reveal-text text-body text-text-light leading-relaxed max-w-2xl">
          I believe that every pixel should serve a purpose and every interaction should tell a story. My work lives at the intersection of technological precision and human-centric design, creating experiences that don't just look premium but feel intentional.
        </p>
      </div>
    </section>
  );
}
