"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useViewContext } from "@/context/ViewContext";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const container = useRef(null);
  const { viewMode, setMode } = useViewContext();
  const router = useRouter();
  const pathname = usePathname();

  useGSAP(() => {
    gsap.from(".nav-item", {
      y: -20,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power4.out",
      delay: 0.5,
    });
  }, { scope: container });

  const handleModeChange = (mode: "PROFILE" | "WORK") => {
    if (pathname !== "/") {
      router.push("/");
      setTimeout(() => setMode(mode), 100);
    } else {
      setMode(mode);
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    if (pathname !== "/") {
      return;
    }
    e.preventDefault();
    if (viewMode !== "PROFILE") {
      setMode("PROFILE");
    }
    setTimeout(() => {
      const contactEl = document.getElementById("contact");
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  // Hide the global portfolio navbar on standalone immersive experiences like /vault
  if (pathname === "/vault") {
    return null;
  }

  return (
    <nav 
      ref={container} 
      className="fixed top-0 left-0 w-full z-50 px-6 md:px-8 py-6 flex justify-between items-center"
    >
      <Link 
        href="/" 
        className="nav-item font-bold text-xl tracking-tighter text-text hover:opacity-80 transition-opacity"
      >
        Aditya/Works
      </Link>
      
      <div className="flex items-center gap-4 md:gap-8">
        {/* 🔄 INTEGRATED TOGGLE */}
        <div className="nav-item flex items-center gap-2 text-xs md:text-sm font-light uppercase tracking-widest">
          <button 
            onClick={() => handleModeChange("PROFILE")}
            className={`transition-colors duration-300 cursor-pointer ${
              viewMode === "PROFILE" 
                ? "text-accent font-semibold" 
                : "text-text/50 hover:text-text"
            }`}
          >
            Profile
          </button>
          <span className="text-text/20">|</span>
          <button 
            onClick={() => handleModeChange("WORK")}
            className={`transition-colors duration-300 cursor-pointer ${
              viewMode === "WORK" 
                ? "text-accent font-semibold" 
                : "text-text/50 hover:text-text"
            }`}
          >
            Work
          </button>
        </div>

        <Link 
          href="/about"
          className="nav-item text-xs md:text-sm font-light uppercase tracking-widest text-text hover:text-accent transition-colors"
        >
          About
        </Link>

        <Link 
          href="/vault"
          className="nav-item text-xs md:text-sm font-light uppercase tracking-widest text-text hover:text-accent transition-colors"
        >
          Vault
        </Link>

        <a 
          href="#contact"
          onClick={handleContactClick}
          className="nav-item text-xs md:text-sm font-light uppercase tracking-widest text-text hover:text-accent transition-colors cursor-pointer"
        >
          Contact
        </a>
      </div>
    </nav>
  );
}
