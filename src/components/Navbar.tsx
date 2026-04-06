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
      // Small delay to ensure navigation happens before toggle animation starts
      setTimeout(() => setMode(mode), 100);
    } else {
      setMode(mode);
    }
  };

  return (
    <nav ref={container} className="fixed top-0 left-0 w-full z-50 px-6 md:px-8 py-6 flex justify-between items-center">
      <Link href="/" className="nav-item text-text font-bold text-xl tracking-tighter">
        Aditya/Works
      </Link>
      
      <div className="flex items-center gap-4 md:gap-8">
        {/* 🔄 INTEGRATED TOGGLE (Replaces 'Work' link) */}
        <div className="nav-item flex items-center gap-2 text-xs md:text-sm font-light uppercase tracking-widest">
          <button 
            onClick={() => handleModeChange("PROFILE")}
            className={`transition-colors duration-300 ${viewMode === "PROFILE" ? "text-accent font-medium" : "text-text/50 hover:text-text"}`}
          >
            Profile
          </button>
          <span className="text-text/20">|</span>
          <button 
            onClick={() => handleModeChange("WORK")}
            className={`transition-colors duration-300 ${viewMode === "WORK" ? "text-accent font-medium" : "text-text/50 hover:text-text"}`}
          >
            Work
          </button>
        </div>

        {["About", "Contact"].map((item) => (
          <Link 
            key={item} 
            href={item === "About" ? "/about" : `/#${item.toLowerCase()}`}
            className="nav-item text-text text-xs md:text-sm font-light uppercase tracking-widest hover:text-accent transition-colors"
          >
            {item}
          </Link>
        ))}
      </div>
    </nav>
  );
}
