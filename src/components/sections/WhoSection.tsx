"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

/**
 * WHO HERO SECTION — FINAL GOD-TIER (TRUE HANDWRITING VERSION)
 * 
 * - Image: Centered, blended via mask, pulls from /images/aditya/ADI (2).png
 * - Handwriting: True SVG Stroke-Path reveal ('Being Written' as you scroll)
 * - Texture: Shaky-Ink displacement filter
 */
export default function WhoSection() {
  const container = useRef<HTMLElement>(null);
  const imageWrapper = useRef<HTMLDivElement>(null);
  const whoText = useRef<HTMLDivElement>(null);
  const amiText = useRef<HTMLDivElement>(null);
  const inquilabText = useRef<HTMLDivElement>(null);
  const bhagatQuoteText = useRef<HTMLDivElement>(null);
  const quoteText = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 🛡️ Safe Registration
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    if (!container.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "+=200%", // Cinematic multi-stage reveal
        scrub: 1.5, 
        pin: true, 
        anticipatePin: 1
      },
    });


    // --- PHASE 1: WHO AM I? CONVERGENCE ---
    tl.fromTo(whoText.current, 
      { y: "-15vh", opacity: 0, clipPath: "inset(100% 0 0 0)" },
      { y: "0vh", opacity: 1, clipPath: "inset(-20% -20% -20% -20%)", duration: 1, ease: "power2.inOut" }
    )
    .fromTo(amiText.current, 
      { y: "15vh", opacity: 0, clipPath: "inset(100% 0 0 0)" },
      { y: "0vh", opacity: 1, clipPath: "inset(-20% -20% -20% -20%)", duration: 1, ease: "power2.inOut" }, 0
    )
    .fromTo(imageWrapper.current, 
      { y: "35vh", opacity: 0, scale: 0.98, filter: "blur(4px) brightness(0.9) contrast(1.2)" },
      { y: "0vh", opacity: 1, scale: 1, filter: "blur(0px) brightness(1.2) contrast(1.85)", duration: 1.5, ease: "power2.out" }, 0
    )

    // Hold WHO AM I clearly on screen
    .to({}, { duration: 0.4 })

    // --- PHASE 2: WHO AM I? SCROLLS AWAY / FALLS APART ---
    .to(whoText.current, { y: "-150vh", opacity: 0, duration: 1, ease: "power3.in" })
    .to(amiText.current, { y: "150vh", opacity: 0, duration: 1, ease: "power3.in" }, "<")

    // --- PHASE 3: INQUILAB HANDWRITING + QUOTES (AFTER WHO AM I HAS EXITED) ---
    .fromTo(".inquilab-stroke", 
      { 
        strokeDashoffset: 1000, 
        opacity: 0, 
        rotate: -2,
        y: 10
      },
      { 
        strokeDashoffset: 0, 
        opacity: 1, 
        rotate: 0,
        y: 0,
        duration: 1.8, 
        ease: "power1.inOut"
      }, "+=0.1"
    )

    // Fade the Solid Ink Fill in
    .to(".inquilab-stroke", { 
      fill: "#D14836", 
      duration: 1.2, 
      ease: "power2.in" 
    }, "-=0.6");

    // 📝 THE QUOTES (Fade in after WHO AM I has scrolled away)
    if (quoteText.current && bhagatQuoteText.current) {
      tl.fromTo([quoteText.current, bhagatQuoteText.current], 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 0.5, duration: 1.4, ease: "power2.out", stagger: 0.25 }, 
        "-=1"
      );
    }

    tl.to({}, { duration: 0.5 });
    
    // --- PHASE 4: FINAL EXIT ---
    if (imageWrapper.current && inquilabText.current && quoteText.current && bhagatQuoteText.current) {
      tl.to([imageWrapper.current, inquilabText.current, quoteText.current, bhagatQuoteText.current], { 
        y: "-20vh", 
        opacity: 0,
        scale: 1.1, 
        duration: 1, 
        ease: "power2.inOut" 
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: container });

  return (
    <section 
      ref={container} 
      id="about" 
      className="relative w-full h-screen bg-background"
    >
      {/* 🌫️ SHAKY INK FILTER DEFINITION */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="shaky-ink">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>


        </defs>
      </svg>

      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* 🔴 TYPOGRAPHY (BEHIND - Z-0) */}
        <div ref={whoText} className="absolute top-[14%] left-[3%] md:left-[5%] z-0 pointer-events-none overflow-visible">
          <h2 className="text-[28vw] sm:text-[24vw] md:text-[18vw] lg:text-[19vw] font-bebas font-black text-[#8B0000] uppercase italic tracking-tighter leading-[0.85] py-2 px-2">WHO</h2>
        </div>

        <div ref={amiText} className="absolute bottom-[14%] right-[3%] md:right-[5%] z-0 pointer-events-none overflow-visible">
          <h2 className="text-[22vw] sm:text-[20vw] md:text-[18vw] lg:text-[19vw] font-bebas font-black text-[#8B0000] uppercase italic text-right whitespace-nowrap tracking-tighter leading-[0.85] py-2 pr-6 pl-2">AM&nbsp;I?</h2>
        </div>

        {/* ✊ TYPOGRAPHY 2: INQUILAB BACKGROUND (TRUE STROKE REVEAL - Z-0) */}
        <div ref={inquilabText} className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none px-4 w-full -mt-24">
          <svg className="w-full h-auto overflow-visible" viewBox="0 0 1200 350" style={{ filter: "url(#shaky-ink)" }}>
            <text 
              x="50%" y="50%" 
              dominantBaseline="middle" textAnchor="middle" 
              className="inquilab-stroke font-kalam font-bold text-[28vw] md:text-[16vw] fill-transparent stroke-[#D14836] stroke-[4]"
              style={{ strokeDasharray: 1000, strokeDashoffset: 1000, paintOrder: "stroke fill" }}
            >
              इnquilab
            </text>
          </svg>
        </div>

        {/* 📝 QUOTES (MARGINAL STATEMENTS - Z-30) */}
        <div ref={quoteText} className="absolute left-[6%] bottom-[8%] z-30 opacity-0 pointer-events-none max-w-[200px] md:max-w-[300px]">
          <p className="font-bebas text-[5vw] md:text-[1.8vw] text-text leading-tight uppercase tracking-[0.2em]">
            NOT A REVOLUTION,<br />JUST A QUIET REFUSAL<br />TO BE AVERAGE :)
          </p>
        </div>

        <div ref={bhagatQuoteText} className="absolute right-[6%] top-[10%] z-30 opacity-0 pointer-events-none text-right max-w-[300px] md:max-w-[450px]">
          <p className="font-bebas text-[4vw] md:text-[1.5vw] text-text leading-snug uppercase tracking-[0.1em] italic">
            “The man should either begin to think himself a rival of God or he may begin to believe himself to be God.”
          </p>
          <p className="font-bebas text-[2.5vw] md:text-[1vw] text-text/60 mt-2 tracking-widest uppercase">― Bhagat Singh</p>
        </div>

        {/* 🖼️ PORTRAIT (STICKY BACKGROUND - Z-10) */}
        <div ref={imageWrapper} className="absolute inset-0 w-full h-[105vh] flex items-center justify-center z-10 pointer-events-none"
             style={{ maskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, #000 20%, transparent 80%)" }}>
          <img src="/images/aditya/ADI (2).png" alt="Aditya" className="w-full h-full object-contain grayscale opacity-85 contrast-[185%] brightness-[135%] mix-blend-multiply" />
        </div>
      </div>
    </section>
  );
}
