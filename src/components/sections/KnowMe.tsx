"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

/**
 * KNOW ME — Wireframe → Final Cinematic Heading
 *
 * "Thought it." enters as a wireframe sketch (stroke-only),
 * fills in like ink from left to right,
 * then transitions into "Built it." — clean, confident, final.
 */
export default function KnowMe() {
  const container = useRef<HTMLElement>(null);
  const headingBlock = useRef<HTMLDivElement>(null);
  
  // New Refs for the Detailed Who visual
  const whoTextDetail = useRef<HTMLDivElement>(null);
  const amiTextDetail = useRef<HTMLDivElement>(null);
  const imageWrapperDetail = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    if (!container.current) return;

    // ═══════════════════════════════════════════
    // 🎬 WIREFRAME → FINAL HEADING TIMELINE
    // ═══════════════════════════════════════════
    const headingTl = gsap.timeline({
      scrollTrigger: {
        trigger: headingBlock.current,
        start: "top 80%",
        end: "top 20%",
        scrub: 1,
      },
    });

    // ✦ Step 1 — Wireframe Entry
    // "Thought it." fades in as stroke-only outline
    headingTl.fromTo(
      ".wireframe-text",
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
      }
    );

    // ✦ Step 2 — Ink Fill (left → right via gradient mask)
    // The fill layer is clipped and expands to reveal solid text
    headingTl.fromTo(
      ".fill-text",
      {
        clipPath: "inset(0 100% 0 0)",
      },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 2,
        ease: "power1.inOut",
      },
      "+=0.2"
    );

    // ✦ Step 3 — Swap: "Thought it." fades, "Built it." enters
    headingTl.to(
      ".wireframe-text, .fill-text",
      {
        opacity: 0,
        y: -20,
        filter: "blur(4px)",
        duration: 0.8,
        ease: "power2.in",
      },
      "+=0.3"
    );

    headingTl.fromTo(
      ".final-text",
      {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: "power3.out",
      },
      "-=0.3"
    );

    // ═══════════════════════════════════════════
    // LABEL, BODY, STATS, DIVIDER — Standard reveals
    // ═══════════════════════════════════════════

    gsap.fromTo(
      ".knowme-label",
      { x: -30, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: container.current, start: "top 70%" },
      }
    );

    gsap.fromTo(
      ".knowme-line",
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: ".knowme-body", start: "top 80%" },
      }
    );

    gsap.fromTo(
      ".knowme-stat",
      { y: 50, opacity: 0, scale: 0.9 },
      {
        y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.2, ease: "power2.out",
        scrollTrigger: { trigger: ".knowme-stats", start: "top 85%" },
      }
    );

    gsap.fromTo(
      ".knowme-divider",
      { scaleX: 0 },
      {
        scaleX: 1, duration: 1.5, ease: "power2.inOut",
        scrollTrigger: { trigger: ".knowme-divider", start: "top 85%" },
      }
    );

    gsap.fromTo(
      ".knowme-cta",
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".knowme-cta", start: "top 90%" },
      }
    );

    // ═══════════════════════════════════════════
    // 🎬 DETAILED "WHO AM I?" REVEAL (INLINE)
    // ═══════════════════════════════════════════
    const detailedTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".detailed-who-trigger",
        start: "top 60%",
        end: "bottom top", 
        scrub: 1.5,
      },
    });

    detailedTl.fromTo(whoTextDetail.current, 
      { y: "-10vh", opacity: 0, clipPath: "inset(100% 0 0 0)" },
      { y: "0vh", opacity: 1, clipPath: "inset(0% 0 0% 0)", duration: 1, ease: "power2.inOut" }
    )
    .fromTo(amiTextDetail.current, 
      { y: "10vh", opacity: 0, clipPath: "inset(100% 0 0 0)" },
      { y: "0vh", opacity: 1, clipPath: "inset(0% 0 0% 0)", duration: 1, ease: "power2.inOut" }, 0
    )
    .fromTo(imageWrapperDetail.current, 
      { y: "20vh", opacity: 0, scale: 0.95, filter: "blur(4px) brightness(0.9) contrast(1.2)" },
      { y: "0vh", opacity: 1, scale: 1, filter: "blur(0px) brightness(1.2) contrast(1.85)", duration: 1.5, ease: "power2.out" }, 0
    );

  }, { scope: container });

  return (
    <section
      ref={container}
      id="knowme"
      className="relative w-full bg-background py-8 md:py-12 px-8 md:px-24 overflow-hidden"
    >
      {/* Label */}
      <p className="knowme-label text-xs uppercase tracking-[0.3em] text-accent font-bold mb-12 italic opacity-0">
        / Know Me
      </p>

      {/* ═══ CINEMATIC HEADING: Wireframe → Fill → Final ═══ */}
      <div ref={headingBlock} className="mb-6 md:mb-8 relative">
        {/* Layer 1: Wireframe (stroke-only outline) */}
        <h2
          className="wireframe-text text-section-title leading-[1] opacity-0"
          style={{
            WebkitTextStroke: "1.5px #1A1A1A",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          Thought it.
        </h2>

        {/* Layer 2: Fill (solid text, clipped left→right) */}
        <h2
          className="fill-text text-section-title leading-[1] absolute top-0 left-0"
          style={{
            color: "#1A1A1A",
            clipPath: "inset(0 100% 0 0)",
          }}
        >
          Thought it.
        </h2>

        {/* Layer 3: Final — "Built it." (clean, confident) */}
        <h2
          className="final-text text-section-title leading-[1] absolute top-0 left-0 opacity-0"
        >
          <span className="text-accent italic font-bold">Built it.</span>
        </h2>
      </div>

      {/* Divider */}
      <div
        className="knowme-divider w-full h-[1px] bg-text/15 mb-12 md:mb-16 origin-left"
        style={{ transform: "scaleX(0)" }}
      />

      {/* Two-Column Content */}
      <div className="knowme-body grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-16 md:mb-20">
        {/* Left — Philosophy */}
        <div className="space-y-6">
          <p className="knowme-line text-body text-text-light leading-relaxed opacity-0">
            I believe that every pixel should serve a purpose and every
            interaction should tell a story. My work lives at the intersection
            of technological precision and human-centric design.
          </p>
          <p className="knowme-line text-body text-text-light leading-relaxed opacity-0">
            I don&apos;t build products — I craft experiences that don&apos;t just look
            premium, but feel intentional. The kind that makes you pause, lean
            in, and wonder how it was made.
          </p>
          <p className="knowme-line text-body text-text-light leading-relaxed opacity-0">
            Architecture taught me that space has emotion. Code taught me that
            logic has elegance. I bring both to everything I create.
          </p>
        </div>

        {/* Right — Mission */}
        <div className="space-y-6">
          <p className="knowme-line text-body text-text-light leading-relaxed opacity-0">
            Some people call it obsession. I call it a quiet refusal to be
            average. Every project starts with a single question:
            <span className="text-text font-medium italic">
              {" "}
              &ldquo;What would make this unforgettable?&rdquo;
            </span>
          </p>
          <p className="knowme-line text-body text-text-light leading-relaxed opacity-0">
            From motion systems to brand identities, from creative coding to
            product design — the thread is always the same: relentless craft,
            human soul, and an absolute intolerance for mediocrity.
          </p>
          <p className="knowme-line text-body text-text-light leading-relaxed opacity-0">
            This portfolio is not a resume. It&apos;s a manifesto. A declaration
            that design can be both beautiful and dangerous. That code can be
            art. That the future belongs to those who refuse to settle.
          </p>
        </div>
      </div>

      {/* CTA: Know more about me */}
      <div className="knowme-cta mb-16 md:mb-20 opacity-0">
        <a 
          href="#about" 
          className="group inline-flex items-center gap-4 text-xs md:text-sm uppercase tracking-[0.4em] font-bold text-text hover:text-accent transition-colors duration-300"
        >
          Know more about me
          <span className="w-8 h-[1px] bg-text group-hover:bg-accent group-hover:w-12 transition-all duration-300" />
          <svg 
            viewBox="0 0 24 24" 
            className="w-4 h-4 fill-none stroke-current stroke-2 -rotate-45 group-hover:rotate-0 transition-transform duration-300"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Stats Row */}
      <div className="knowme-stats grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        {[
          { value: "04+", label: "Years of Craft" },
          { value: "20+", label: "Projects Shipped" },
          { value: "∞", label: "Curiosity" },
          { value: "01", label: "Mission" },
        ].map((stat, i) => (
          <div
            key={i}
            className="knowme-stat text-center md:text-left opacity-0"
          >
            <p className="text-display text-accent font-bebas leading-none">
              {stat.value}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-text-light mt-3 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* 🎬 DETAILED WHO AM I? VISUAL (ON-CLICK/SCROLL DEEP DIVE) */}
      <div className="detailed-who-trigger relative w-full h-[60vh] md:h-screen mt-24 md:mt-32 overflow-hidden bg-background">
        {/* Typography */}
        <div ref={whoTextDetail} className="absolute top-[10%] left-[0%] z-0 pointer-events-none overflow-visible">
          <h2 className="text-[20vw] font-bebas font-black text-[#8B0000] uppercase italic">WHO</h2>
        </div>

        <div ref={amiTextDetail} className="absolute bottom-[10%] right-[0%] z-0 pointer-events-none overflow-visible">
          <h2 className="text-[20vw] font-bebas font-black text-[#8B0000] uppercase italic text-right whitespace-nowrap">AM&nbsp;&nbsp;I?</h2>
        </div>

        {/* Portrait */}
        <div 
          ref={imageWrapperDetail} 
          className="absolute inset-0 w-full h-full flex items-center justify-center z-10 pointer-events-none"
          style={{ 
            maskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)", 
            WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)" 
          }}
        >
          <img 
            src="/images/aditya/ADI (2).png" 
            alt="Aditya" 
            className="w-full h-full object-contain grayscale opacity-85 contrast-[185%] brightness-[135%] mix-blend-multiply" 
          />
        </div>
      </div>
    </section>
  );
}
