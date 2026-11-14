"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * WHO AM I — pinned, scroll-scrubbed 4-phase sequence.
 *
 * Phase 1  Convergence   WHO slides down, AM I? slides up, portrait rises + sharpens
 * Phase 2  Exit split    WHO exits up (-150vh), AM I? exits down (+150vh)
 * Phase 3  Handwriting   इnquilab stroke draws (dashoffset 1000 → 0), fills #D14836, quotes fade in
 * Phase 4  Final exit    portrait, handwriting, quotes drift up, scale 1.1, fade out → unpin
 */
export default function WhoSection() {
  const container = useRef<HTMLElement>(null);
  const whoText = useRef<HTMLDivElement>(null);
  const amiText = useRef<HTMLDivElement>(null);
  const imageWrapper = useRef<HTMLDivElement>(null);
  const inquilabText = useRef<HTMLDivElement>(null);
  const quoteText = useRef<HTMLDivElement>(null);
  const bhagatQuoteText = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "+=200%",
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ── PHASE 1: CONVERGENCE ────────────────────────────────────────────
      tl.fromTo(
        whoText.current,
        { y: "-15vh", autoAlpha: 0 },
        { y: "0vh", autoAlpha: 1, duration: 1, ease: "power2.inOut" },
        0
      )
        .fromTo(
          amiText.current,
          { y: "15vh", autoAlpha: 0 },
          { y: "0vh", autoAlpha: 1, duration: 1, ease: "power2.inOut" },
          0
        )
        .fromTo(
          imageWrapper.current,
          { y: "35vh", autoAlpha: 0, scale: 0.98, filter: "blur(4px)" },
          { y: "0vh", autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 1.5, ease: "power2.out" },
          0
        )
        // hold
        .to({}, { duration: 0.4 });

      // ── PHASE 2: EXIT SPLIT ─────────────────────────────────────────────
      tl.to(whoText.current, { y: "-150vh", autoAlpha: 0, duration: 1, ease: "power3.in" }).to(
        amiText.current,
        { y: "150vh", autoAlpha: 0, duration: 1, ease: "power3.in" },
        "<"
      );

      // ── PHASE 3: HANDWRITING + QUOTES ───────────────────────────────────
      tl.fromTo(
        ".inquilab-stroke",
        { strokeDashoffset: 1000, opacity: 0 },
        { strokeDashoffset: 0, opacity: 1, duration: 1.8, ease: "power1.inOut" },
        "+=0.1"
      )
        .to(".inquilab-stroke", { fill: "#D14836", duration: 1.2, ease: "power2.in" }, "-=0.6")
        .fromTo(
          [quoteText.current, bhagatQuoteText.current],
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 0.6, duration: 1.4, stagger: 0.25, ease: "power2.out" },
          "-=1"
        )
        // hold
        .to({}, { duration: 0.5 });

      // ── PHASE 4: FINAL EXIT ─────────────────────────────────────────────
      tl.to(
        [imageWrapper.current, inquilabText.current, quoteText.current, bhagatQuoteText.current],
        { y: "-20vh", scale: 1.1, autoAlpha: 0, duration: 1, ease: "power2.inOut" }
      );
      // useGSAP reverts only this section's tweens/ScrollTriggers on unmount.
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      id="about"
      className="relative w-full h-screen overflow-hidden bg-background"
      aria-label="Who am I"
    >
      {/* Shaky-ink displacement filter */}
      <svg aria-hidden="true" className="absolute w-0 h-0">
        <defs>
          <filter id="shaky-ink">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* WHO — top-left */}
        <div
          ref={whoText}
          className="absolute top-[14%] left-[3%] md:left-[5%] z-0 pointer-events-none will-change-transform"
        >
          <h2 className="text-[28vw] sm:text-[24vw] md:text-[18vw] lg:text-[19vw] font-bebas font-black text-[#8B0000] uppercase italic tracking-tighter leading-[0.85] py-2 px-2">
            WHO
          </h2>
        </div>

        {/* AM I? — bottom-right */}
        <div
          ref={amiText}
          className="absolute bottom-[14%] right-[3%] md:right-[5%] z-0 pointer-events-none will-change-transform"
        >
          <h2 className="text-[22vw] sm:text-[20vw] md:text-[18vw] lg:text-[19vw] font-bebas font-black text-[#8B0000] uppercase italic text-right whitespace-nowrap tracking-tighter leading-[0.85] py-2 pr-6 pl-2">
            AM&nbsp;I?
          </h2>
        </div>

        {/* इnquilab — background handwriting */}
        <div
          ref={inquilabText}
          className="absolute inset-0 -mt-24 px-4 z-0 flex items-center justify-center pointer-events-none will-change-transform"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1200 350"
            className="w-full h-auto overflow-visible"
            style={{ filter: "url(#shaky-ink)" }}
          >
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              className="inquilab-stroke font-kalam font-bold text-[28vw] md:text-[16vw] fill-transparent stroke-[#D14836] stroke-[4]"
              style={{ strokeDasharray: 1000, strokeDashoffset: 1000, opacity: 0, paintOrder: "stroke fill" }}
            >
              इnquilab
            </text>
          </svg>
        </div>

        {/* Quote — bottom-left */}
        <div
          ref={quoteText}
          className="absolute left-[6%] bottom-[8%] z-30 max-w-[200px] md:max-w-[300px] pointer-events-none"
        >
          <p className="font-bebas text-[5vw] md:text-[1.8vw] text-text leading-tight uppercase tracking-[0.2em]">
            NOT A REVOLUTION,<br />JUST A QUIET REFUSAL<br />TO BE AVERAGE :)
          </p>
        </div>

        {/* Bhagat Singh quote — top-right */}
        <div
          ref={bhagatQuoteText}
          className="absolute right-[6%] top-[10%] z-30 max-w-[300px] md:max-w-[450px] text-right pointer-events-none"
        >
          <p className="font-bebas text-[4vw] md:text-[1.5vw] text-text leading-snug uppercase tracking-[0.1em] italic">
            “The man should either begin to think himself a rival of God or he may begin to believe himself to be God.”
          </p>
          <p className="font-bebas text-[2.5vw] md:text-[1vw] text-text/60 mt-2 tracking-widest uppercase">
            ― Bhagat Singh
          </p>
        </div>

        {/* Portrait — centered, radial mask */}
        <div
          ref={imageWrapper}
          className="absolute inset-0 z-10 h-[105vh] flex items-center justify-center pointer-events-none will-change-transform"
          style={{
            maskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)",
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/aditya/ADI (2).png"
              alt="Portrait of Aditya"
              fill
              loading="eager"
              sizes="100vw"
              className="object-contain grayscale opacity-85 contrast-[185%] brightness-[135%] mix-blend-multiply"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

