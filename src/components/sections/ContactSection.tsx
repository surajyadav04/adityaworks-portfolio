"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, useCallback, useEffect } from "react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}

export default function ContactSection() {
  const container = useRef(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const sparkleCounter = useRef(0);

  useGSAP(() => {
    gsap.from(".contact-item", {
      scrollTrigger: {
        trigger: container.current,
        start: "top 85%",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out"
    });
  }, { scope: container });

  // Generate sparkles on hover
  const generateSparkles = useCallback(() => {
    if (!wordRef.current) return;
    const rect = wordRef.current.getBoundingClientRect();
    const colors = ["#D14836", "#FFD700", "#FF6B6B", "#FFA500", "#FF1493"];
    const newSparkles: Sparkle[] = [];

    for (let i = 0; i < 12; i++) {
      sparkleCounter.current += 1;
      newSparkles.push({
        id: sparkleCounter.current,
        x: Math.random() * rect.width - rect.width * 0.1,
        y: Math.random() * rect.height - rect.height * 0.3,
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setSparkles(newSparkles);
  }, []);

  // Clean up sparkles after animation
  useEffect(() => {
    if (sparkles.length === 0) return;
    const timeout = setTimeout(() => setSparkles([]), 1200);
    return () => clearTimeout(timeout);
  }, [sparkles]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    generateSparkles();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <footer id="contact" ref={container} className="py-12 px-8 md:px-24 bg-background border-t border-text/5">
      {/* Sparkle Keyframes */}
      <style jsx>{`
        @keyframes sparkle-pop {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg) translateY(-20px);
            opacity: 0;
          }
        }
        @keyframes sparkle-drift {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          20% {
            transform: translateY(-5px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px) scale(0);
            opacity: 0;
          }
        }
        .sparkle-particle {
          animation: sparkle-drift 0.9s ease-out forwards;
          pointer-events: none;
        }
        .word-swap {
          display: inline-block;
          position: relative;
          cursor: pointer;
          transition: color 0.3s ease;
        }
        .word-swap:hover {
          color: #D14836;
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start gap-16">
        <div>
          <h2 className="contact-item text-section-title mb-8 tracking-tighter">
            Let&apos;s create<br />something{" "}
            <span
              ref={wordRef}
              className="word-swap text-accent italic relative inline-block"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* The Word */}
              <span
                className="inline-block transition-all duration-300"
                style={{
                  opacity: isHovered ? 0 : 1,
                  transform: isHovered ? "translateY(8px) scale(0.95)" : "translateY(0) scale(1)",
                  position: isHovered ? "absolute" : "relative",
                }}
              >
                meaningful.
              </span>
              <span
                className="inline-block transition-all duration-300"
                style={{
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.95)",
                  color: "#D14836",
                  position: isHovered ? "relative" : "absolute",
                  textShadow: isHovered ? "0 0 20px rgba(209,72,54,0.3)" : "none",
                }}
              >
                magical.
              </span>

              {/* Sparkle Particles */}
              {sparkles.map((s) => (
                <span
                  key={s.id}
                  className="sparkle-particle absolute"
                  style={{
                    left: s.x,
                    top: s.y,
                    width: s.size,
                    height: s.size,
                    animationDelay: `${s.delay}s`,
                  }}
                >
                  <svg viewBox="0 0 24 24" width={s.size} height={s.size}>
                    <path
                      d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z"
                      fill={s.color}
                    />
                  </svg>
                </span>
              ))}
            </span>
          </h2>
          <a 
            href="mailto:work@aditya.com" 
            className="contact-item inline-block text-xl md:text-3xl font-light underline decoration-primary underline-offset-8 hover:text-primary transition-colors"
          >
            work@aditya.com
          </a>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div className="flex flex-col gap-4">
            <span className="contact-item text-xs uppercase tracking-widest text-text-light/50 font-bold">Social</span>
            {["LinkedIn", "Awwwards", "Dribbble", "Twitter"].map((s) => (
              <a key={s} href="#" className="contact-item text-sm hover:text-accent transition-colors">{s}</a>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <span className="contact-item text-xs uppercase tracking-widest text-text-light/50 font-bold">Menu</span>
            {["Work", "About", "Contact", "Resume"].map((m) => (
              <a key={m} href={`#${m.toLowerCase()}`} className="contact-item text-sm hover:text-accent transition-colors">{m}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 pt-12 border-t border-text/5 flex justify-between items-center text-[10px] text-text-light/30 uppercase tracking-[0.4em]">
        <span>© 2024 Aditya Works</span>
        <span className="hidden md:inline">Designed and Developed in the Void</span>
        <span>Aditya™</span>
      </div>
    </footer>
  );
}
