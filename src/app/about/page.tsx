"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useLayoutEffect } from "react";
import ContactSection from "@/components/sections/ContactSection";

export default function AboutPage() {
  const container = useRef<HTMLElement>(null);
  const introTextWrapper = useRef<HTMLDivElement>(null);
  const whoText = useRef<HTMLDivElement>(null);
  const amiText = useRef<HTMLDivElement>(null);
  const imageWrapper = useRef<HTMLDivElement>(null);
  const signatureWrapper = useRef<HTMLDivElement>(null);
  const contentSection = useRef<HTMLDivElement>(null);

  // 🚀 Force scroll to top on page load
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useGSAP(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    if (!container.current) return;

    // ═══════════════════════════════════════════
    // 🎬 CINEMATIC INTRODUCTION (WHO AM I?)
    // ═══════════════════════════════════════════
    const introTl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        // Trigger start and end positions
        start: "top top",
        end: "+=250%", 
        scrub: 1.5,
        pin: true,
        anticipatePin: 1,
      },
    });

    // --- INITIAL STATE ---
    // Combined single line state
    gsap.set([whoText.current, amiText.current], { x: 0, y: 0, opacity: 1 });
    gsap.set(imageWrapper.current, { opacity: 0, scale: 0.95 });
    gsap.set(".signature-stroke", { strokeDashoffset: 1400, opacity: 0 });

    // --- PHASE 1: PHOTO REVEAL ---
    introTl.to(imageWrapper.current, { 
      opacity: 1, 
      scale: 1, 
      filter: "blur(0px) brightness(1.2) contrast(1.85)", 
      duration: 1.5, 
      ease: "power2.out" 
    }, 0.2);

    // --- PHASE 2: CINEMATIC SPLIT (WHO UP, AM I DOWN) ---
    introTl.to(whoText.current, { y: "-100vh", opacity: 0, duration: 2, ease: "power4.in" }, "+=0.3")
           .to(amiText.current, { y: "100vh", opacity: 0, duration: 2, ease: "power4.in" }, "-=2");

    // --- PHASE 3: THE SIGNATURE (ADITYA KUMAR - Handwriting) ---
    introTl.fromTo(".signature-stroke", 
      { strokeDashoffset: 1400, opacity: 0 },
      { 
        strokeDashoffset: 0, 
        opacity: 1, 
        duration: 4, 
        ease: "none", 
      }, "-=0.2"
    );

    // Fill in the ink for the final "handwritten" feel
    introTl.to(".signature-stroke", { 
      fill: "#D14836", 
      duration: 1.2, 
      ease: "power2.in" 
    }, "-=0.5");

    // Exit phase for content transition
    introTl.to([imageWrapper.current, signatureWrapper.current], { 
      opacity: 0, 
      scale: 1.1, 
      duration: 1.5, 
      ease: "power2.inOut" 
    }, "+=0.5");

    // 📖 CONTENT REVEAL
    gsap.fromTo(".about-detail-block", 
      { y: 50, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 1.2, stagger: 0.4, ease: "power3.out",
        scrollTrigger: { trigger: contentSection.current, start: "top 80%" }
      }
    );

  }, { scope: container });

  return (
    <main className="relative bg-background min-h-screen">
      {/* 🌫️ SIGNATURE INK FILTER */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="about-signature-ink">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* 🎬 HERO SECTION */}
      <section ref={container} className="relative w-full h-screen overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Typography 1: WHO AM I? (Starts as single line) */}
          <div ref={introTextWrapper} className="relative z-0 pointer-events-none w-full flex items-center justify-center">
            <h1 className="text-[12vw] md:text-[14vw] font-bebas font-black text-[#8B0000] uppercase italic leading-none whitespace-nowrap">
              <span ref={whoText} className="inline-block">WHO&nbsp;AM&nbsp;</span>
              <span ref={amiText} className="inline-block">I?</span>
            </h1>
          </div>

          {/* Typography 2: RAW SIGNATURE (Aditya Kumar) */}
          <div ref={signatureWrapper} className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none px-4 w-full">
            <svg className="w-full h-auto overflow-visible" viewBox="0 0 1200 400" style={{ filter: "url(#about-signature-ink)" }}>
              <text 
                x="50%" y="54%" 
                dominantBaseline="middle" textAnchor="middle" 
                className="signature-stroke font-caveat font-bold text-[18vw] md:text-[16vw] fill-transparent stroke-[#D14836] stroke-[3]"
                style={{ 
                  strokeDasharray: 1400, strokeDashoffset: 1400, 
                  paintOrder: "stroke fill", 
                  letterSpacing: "-0.04em",
                  transform: "rotate(-3deg) skewX(-6deg)"
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
            <img 
              src="/images/aditya/ADI (2).png" 
              alt="Aditya" 
              className="w-full h-full object-contain grayscale contrast-[185%] brightness-[135%] mix-blend-multiply" 
            />
          </div>
        </div>
      </section>

      {/* 📖 CONTENT SECTION */}
      <section ref={contentSection} className="relative py-32 px-8 md:px-24 max-w-6xl mx-auto">
        <div className="about-detail-block mb-24">
          <h2 className="text-xs uppercase tracking-[0.4em] text-accent font-bold mb-8 italic">/ THE ARCHITECT OF EXPERIENCES</h2>
          <p className="text-section-title leading-tight mb-12">
            I build digital monuments that <span className="text-text-light underline decoration-accent/30">breathe.</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <p className="text-body text-text-light leading-relaxed">
              My journey began at the intersection of structure and soul—Architecture. It taught me that space is not just physical; it is emotional. When I transitioned into the digital realm, I brought that same philosophy with me. I don&apos;t just code websites; I architect environments.
            </p>
            <p className="text-body text-text-light leading-relaxed">
              As a Senior Creative Developer, I specialize in crafting experience-driven narratives through motion, high-performance code, and relentless attention to detail. Every project is a manifesto—a refusal to accept the average.
            </p>
          </div>
        </div>

        <div className="about-detail-block grid grid-cols-1 md:grid-cols-3 gap-12 py-24 border-t border-text/10">
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">01 / VISION</h3>
            <p className="text-sm text-text-light leading-relaxed">To bridge the gap between technological precision and human emotion, creating digital interactions that feel organic yet engineered.</p>
          </div>
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">02 / CRAFT</h3>
            <p className="text-sm text-text-light leading-relaxed">Relentless pursuit of perfection in motion, performance, and storytelling. Pixel perfection is not a goal; it&apos;s the baseline.</p>
          </div>
          <div>
            <h3 className="font-bebas text-3xl text-accent mb-4 tracking-wider uppercase">03 / FUTURE</h3>
            <p className="text-sm text-text-light leading-relaxed">Constantly exploring the boundaries of the web, ensuring that every experience I build is ready for the high-end landscape of tomorrow.</p>
          </div>
        </div>

        <div className="about-detail-block mt-32 text-center border-t border-text/5 pt-24">
          <p className="text-body text-text-light italic max-w-2xl mx-auto px-4">
            &ldquo;This is where we begin. We will add more details here as the journey continues.&rdquo;
          </p>
        </div>
      </section>

      {/* Footer Connectivity */}
      <ContactSection />
    </main>
  );
}
