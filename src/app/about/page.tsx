"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useEffect } from "react";
import ContactSection from "@/components/sections/ContactSection";

/**
 * REFINED ABOUT PAGE — SNAPPY CINEMATIC EDITION
 * 
 * Refinements:
 * 1. Reduced scroll distance (no void space).
 * 2. Signature lowered and made more organic.
 * 3. Smooth scroll focus.
 */
export default function AboutPage() {
  const container = useRef<HTMLElement>(null);
  const whoPart = useRef<HTMLSpanElement>(null);
  const amiPart = useRef<HTMLSpanElement>(null);
  const imageWrapper = useRef<HTMLDivElement>(null);
  const signatureWrapper = useRef<HTMLDivElement>(null);
  const contentSection = useRef<HTMLDivElement>(null);

  // 🚀 FAST SCROLL RESET
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    return () => clearTimeout(timer);
  }, []);

  useGSAP(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    if (!container.current) return;

    // 🎬 Snappier Intro (Reduced 'end' value to remove void space)
    const introTl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "+=160%", // Tighter scroll for better momentum
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
      },
    });

    // --- PHASE 1: INITIAL STATE ---
    gsap.set([whoPart.current, amiPart.current], { yPercent: 0, opacity: 1 });
    gsap.set(imageWrapper.current, { opacity: 0, scale: 0.95 });
    gsap.set(".signature-stroke", { strokeDashoffset: 1600, opacity: 0 });

    // --- PHASE 2: VERTICAL SPLIT (SNAPPIER) ---
    introTl.to(whoPart.current, { 
      yPercent: -150, 
      opacity: 0, 
      duration: 1.2, 
      ease: "power2.inOut" 
    })
    .to(amiPart.current, { 
      yPercent: 150, 
      opacity: 0, 
      duration: 1.2, 
      ease: "power2.inOut" 
    }, 0)
    .to(imageWrapper.current, { 
      opacity: 1, 
      scale: 1, 
      filter: "blur(0px) brightness(1.1) contrast(1.7)", 
      duration: 1.2, 
      ease: "power2.out" 
    }, "-=0.8");

    // --- PHASE 3: AUTHENTIC SIGNATURE (Lower & Slower Write) ---
    introTl.fromTo(".signature-stroke", 
      { strokeDashoffset: 1600, opacity: 0 },
      { 
        strokeDashoffset: 0, 
        opacity: 1, 
        duration: 3.5, 
        ease: "power1.inOut" // More natural pen motion
      }, 
      "-=0.4"
    );

    // Ink filling (Deeper Red)
    introTl.to(".signature-stroke", { 
      fill: "#B03B2B", 
      duration: 1.5, 
      ease: "power2.in" 
    }, "-=2");

    // Exit into Content
    introTl.to([imageWrapper.current, signatureWrapper.current], { 
      opacity: 0, 
      scale: 1.05, 
      filter: "blur(10px)",
      duration: 1.2, 
      ease: "power2.inOut" 
    }, "+=0.2");

    // 📖 SNAPPY CONTENT REVEAL
    gsap.fromTo(".about-detail-block", 
      { y: 60, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 1, stagger: 0.3, ease: "power2.out",
        scrollTrigger: { 
          trigger: contentSection.current, 
          start: "top 85%",
          scrub: false // Make it pop rather than drag
        }
      }
    );

  }, { scope: container });

  return (
    <main className="relative bg-background min-h-screen">
      {/* 🌫️ HANDWRITTEN INK FILTER */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="about-signature-ink">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* 🎬 HERO SECTION */}
      <section ref={container} className="relative w-full h-screen overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Typography 1: SPLIT HEADLINE */}
          <div className="relative z-0 pointer-events-none w-full text-center px-4 overflow-visible">
            <h1 className="text-[14vw] md:text-[12vw] font-bebas font-black text-[#8B0000] uppercase italic leading-none whitespace-nowrap overflow-visible">
              <span ref={whoPart} className="inline-block relative">WHO&nbsp;</span>
              <span ref={amiPart} className="inline-block relative">AM&nbsp;I?</span>
            </h1>
          </div>

          {/* Typography 2: RAW SIGNATURE (Lowered Position) */}
          <div ref={signatureWrapper} className="absolute inset-x-0 bottom-[4%] md:bottom-[5%] flex items-center justify-center z-30 pointer-events-none px-4 w-full">
            <svg className="w-full h-auto overflow-visible max-w-4xl opacity-90" viewBox="0 0 1200 400" style={{ filter: "url(#about-signature-ink)" }}>
              <text 
                x="50%" y="50%" 
                dominantBaseline="middle" textAnchor="middle" 
                className="signature-stroke font-caveat font-bold text-[16vw] md:text-[12vw] fill-transparent stroke-[#B03B2B] stroke-[2.5]"
                style={{ 
                  strokeDasharray: 1600, strokeDashoffset: 1600, 
                  paintOrder: "stroke fill", 
                  letterSpacing: "-0.04em",
                  transform: "rotate(-2deg) skewX(-2deg)"
                }}
              >
                Aditya Kumar
              </text>
            </svg>
          </div>

          {/* Portrait Mask */}
          <div 
            ref={imageWrapper} 
            className="absolute inset-0 w-full h-full flex items-center justify-center z-10 pointer-events-none opacity-0"
            style={{ 
              maskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)", 
              WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)" 
            }}
          >
            <img src="/images/aditya/ADI (2).png" alt="Aditya" className="w-full h-full object-contain grayscale contrast-[170%] brightness-[125%] mix-blend-multiply" />
          </div>
        </div>
      </section>

      {/* 📖 CONTENT SECTION */}
      <section ref={contentSection} className="relative py-24 px-8 md:px-24 max-w-6xl mx-auto">
        <div className="about-detail-block mb-24">
          <h2 className="text-xs uppercase tracking-[0.4em] text-accent font-bold mb-8 italic">/ THE ARCHITECT OF EXPERIENCES</h2>
          <p className="text-section-title leading-tight mb-12">I build digital monuments that <span className="text-text-light underline decoration-accent/30">breathe.</span></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <p className="text-body text-text-light leading-relaxed opacity-90">My journey began at the intersection of structure and soul—Architecture. It taught me that space is not just physical; it is emotional. When I transitioned into the digital realm, I brought that same philosophy with me. I don&apos;t just code websites; I architect environments.</p>
            <p className="text-body text-text-light leading-relaxed opacity-90">As a Senior Creative Developer, I specialize in crafting experience-driven narratives through motion, high-performance code, and relentless attention to detail. Every project is a manifesto—a refusal to accept the average.</p>
          </div>
        </div>

        <div className="about-detail-block grid grid-cols-1 md:grid-cols-3 gap-12 py-24 border-t border-text/10">
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">01 / VISION</h3>
            <p className="text-sm text-text-light leading-relaxed opacity-80">To bridge the gap between technological precision and human emotion, creating digital interactions that feel organic yet engineered.</p>
          </div>
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">02 / CRAFT</h3>
            <p className="text-sm text-text-light leading-relaxed opacity-80">Relentless pursuit of perfection in motion, performance, and storytelling. Pixel perfection is not a goal; it&apos;s the baseline.</p>
          </div>
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">03 / FUTURE</h3>
            <p className="text-sm text-text-light leading-relaxed opacity-80">Constantly exploring the boundaries of the web, ensuring that every experience I build is ready for the high-end landscape of tomorrow.</p>
          </div>
        </div>
      </section>

      <ContactSection />
    </main>
  );
}
