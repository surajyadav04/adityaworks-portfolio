"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export default function Navbar() {
  const container = useRef(null);

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

  return (
    <nav ref={container} className="fixed top-0 left-0 w-full z-50 px-6 md:px-8 py-6 flex justify-between items-center">
      <Link href="/" className="nav-item text-text font-bold text-xl tracking-tighter">
        Aditya/Works
      </Link>
      
      <div className="flex gap-4 md:gap-8">
        {["Work", "About", "Contact"].map((item) => (
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
