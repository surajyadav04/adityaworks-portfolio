"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { PROJECTS, Project } from "@/data/projects";

export default function ProjectListView() {
  const router = useRouter();
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth floating preview follower
  useEffect(() => {
    let animId: number;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const updatePreview = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (previewRef.current) {
        previewRef.current.style.transform = `translate3d(${currentX + 24}px, ${currentY - 140}px, 0)`;
      }
      animId = requestAnimationFrame(updatePreview);
    };

    animId = requestAnimationFrame(updatePreview);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Entrance animation for list rows
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll(".list-row"),
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }
    );
  }, []);

  const handleRowClick = (project: Project) => {
    const slug = project.title.toLowerCase().replace(/\s+/g, "-");
    router.push(`/work/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-7xl mx-auto py-8">
      {/* Floating Cursor Media Preview (Carter Ogunsola style) */}
      <div
        ref={previewRef}
        className={`pointer-events-none fixed top-0 left-0 z-50 w-72 h-44 rounded-xl overflow-hidden border border-text/15 shadow-2xl transition-opacity duration-300 ${
          hoveredProject ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{ willChange: "transform" }}
      >
        {hoveredProject && (
          <div className="relative w-full h-full bg-neutral-900">
            <Image
              src={hoveredProject.previewImage}
              alt={hoveredProject.title}
              fill
              className="object-cover object-top"
              sizes="300px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-white">
              <span className="text-[10px] font-mono tracking-widest uppercase truncate">
                {hoveredProject.title}
              </span>
              <span className="text-[9px] font-mono opacity-70">
                {hoveredProject.year}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* List Header */}
      <div className="hidden md:grid grid-cols-12 pb-4 text-[11px] font-mono uppercase tracking-widest text-text-light border-b border-text/15">
        <span className="col-span-1">No.</span>
        <span className="col-span-5">Project Title</span>
        <span className="col-span-4">Category</span>
        <span className="col-span-1">Year</span>
        <span className="col-span-1 text-right">Explore</span>
      </div>

      {/* List Items */}
      <div className="divide-y divide-text/10">
        {PROJECTS.map((project, idx) => (
          <div
            key={project.title}
            className="list-row group py-7 cursor-pointer transition-all duration-300 hover:bg-text/[0.02] px-2 -mx-2 rounded-lg"
            onMouseEnter={() => setHoveredProject(project)}
            onMouseLeave={() => setHoveredProject(null)}
            onClick={() => handleRowClick(project)}
          >
            <div className="grid grid-cols-12 items-center gap-4">
              {/* Index */}
              <div className="col-span-2 md:col-span-1 font-mono text-xs md:text-sm text-text-light group-hover:text-accent transition-colors">
                {String(idx + 1).padStart(2, "0")}
              </div>

              {/* Title & Tagline */}
              <div className="col-span-8 md:col-span-5 flex flex-col">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-text group-hover:text-accent group-hover:translate-x-2 transition-all duration-300">
                  {project.title}
                </span>
                <span className="text-xs text-text-light font-light line-clamp-1 mt-1 group-hover:text-text transition-colors">
                  {project.description}
                </span>
              </div>

              {/* Category */}
              <div className="hidden md:flex col-span-4 items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full bg-text/5 text-text-light border border-text/10 group-hover:border-accent/30 group-hover:text-accent transition-colors">
                  {project.category}
                </span>
              </div>

              {/* Year */}
              <div className="hidden md:block col-span-1 font-mono text-xs text-text-light">
                {project.year}
              </div>

              {/* Arrow Roll Icon */}
              <div className="col-span-2 md:col-span-1 flex justify-end">
                <div className="w-10 h-10 rounded-full border border-text/15 flex items-center justify-center group-hover:bg-text group-hover:text-background group-hover:scale-110 transition-all duration-300">
                  <span className="text-sm transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                    ↗
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

