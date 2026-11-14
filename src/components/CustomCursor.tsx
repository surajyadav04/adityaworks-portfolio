"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

    const onMouseMove = (e: MouseEvent) => {
      xTo(e.clientX - 10);
      yTo(e.clientY - 10);
    };

    const onMouseDown = () => {
      gsap.to(cursor, { scale: 1.5, duration: 0.25, overwrite: "auto" });
    };

    const onMouseUp = () => {
      gsap.to(cursor, { scale: 1, duration: 0.25, overwrite: "auto" });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor hidden md:block" />;
}
