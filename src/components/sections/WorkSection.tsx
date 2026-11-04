"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PROJECTS } from "@/data/projects";
import AshfallGallery from "./AshfallGallery";
import ProjectListView from "./ProjectListView";

type WorkViewMode = "list" | "wheel" | "grid";

/**
 * WORK SECTION — SELECTED PROJECTS
 * 
 * Features 3 viewing modes (inspired by Carter Ogunsola / Lab):
 * 1. List: Editorial typographic list with floating cursor media preview
 * 2. Wheel: Fullscreen Ashfall 3D WebGL cylinder with glitch & color bloom
 * 3. Grid: Minimalist 2-column project cards
 * 
 * Mode switcher is anchored at the bottom center as an interactive floating dock.
 */
export default function WorkSection() {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<WorkViewMode>("wheel");

  useGSAP(() => {
    if (viewMode === "grid") {
      gsap.from(".project-card", {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      const cards = gsap.utils.toArray(".project-card");
      cards.forEach((card: any) => {
        const img = card.querySelector("img");
        const overlay = card.querySelector(".hover-overlay");

        const tl = gsap.timeline({ paused: true });
        tl.to(img, { scale: 1.03, filter: "brightness(1.08)", duration: 0.5, ease: "power2.out" })
          .to(overlay, { opacity: 1, duration: 0.3 }, 0);

        card.addEventListener("mouseenter", () => tl.play());
        card.addEventListener("mouseleave", () => tl.reverse());
      });
    }
  }, { scope: container, dependencies: [viewMode] });

  const handleProjectClick = (projectTitle: string) => {
    const slug = projectTitle.toLowerCase().replace(/\s+/g, "-");
    gsap.to(container.current, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        router.push(`/work/${slug}`);
      },
    });
  };

  const isWheel = viewMode === "wheel";

  return (
    <section
      id="work"
      ref={container}
      className={`relative w-full transition-colors duration-700 ${
        isWheel
          ? "bg-[#212121] h-screen min-h-screen overflow-hidden"
          : "bg-background py-16 px-6 sm:px-10 md:px-20 lg:px-24 min-h-screen pb-32"
      }`}
    >
      {/* Top Header Overlay / Title */}
      <div
        className={
          isWheel
            ? "absolute top-8 left-6 sm:left-12 md:left-20 right-6 sm:right-12 md:right-20 z-30 pointer-events-none flex justify-between items-center"
            : "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16"
        }
      >
        <div className="flex flex-col pointer-events-auto">
          <h2
            className={`text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none transition-colors duration-500 ${
              isWheel ? "text-white" : "text-text"
            }`}
          >
            Selected Works
          </h2>
          <span className="text-[10px] uppercase tracking-[0.4em] text-accent font-bold mt-2 italic">
            / Case Studies & Experiments
          </span>
        </div>

        <span
          className={`text-xs uppercase tracking-widest font-medium italic transition-colors duration-500 ${
            isWheel ? "text-neutral-400" : "text-text-light"
          }`}
        >
          / {PROJECTS.length.toString().padStart(2, "0")} projects
        </span>
      </div>

      {/* Main View Display */}
      {viewMode === "wheel" && (
        <div className="w-full h-full">
          <AshfallGallery />
        </div>
      )}

      {viewMode === "list" && (
        <div className="w-full">
          <ProjectListView />
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
          {PROJECTS.map((project, index) => (
            <div
              key={index}
              className="project-card group cursor-pointer relative"
              onClick={() => handleProjectClick(project.title)}
            >
              <div className="relative aspect-[16/10] bg-text/5 overflow-hidden mb-8 border border-text/10 shadow-sm rounded-lg">
                <Image
                  src={project.previewImage}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top transition-transform duration-700 brightness-[0.98] group-hover:scale-[1.03]"
                />

                <div className="hover-overlay absolute inset-0 bg-primary/10 opacity-0 flex items-center justify-center pointer-events-none transition-opacity duration-500">
                  <span className="text-sm uppercase tracking-widest text-text font-bold px-6 py-3 bg-background/90 backdrop-blur-sm border border-text/10 shadow-lg">
                    View Case Study
                  </span>
                </div>

                {project.isConcept && (
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-background/90 backdrop-blur-md text-[8px] uppercase tracking-[0.3em] font-bold text-text-light border border-text/10 mix-blend-difference">
                    Concept Project
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start">
                <div className="max-w-[80%]">
                  <h3 className="text-3xl font-bold tracking-tighter text-text group-hover:text-accent transition-colors duration-500">
                    {project.title}
                  </h3>
                  <p className="text-sm text-text-light font-light mt-3 line-clamp-2 transition-colors duration-500 group-hover:text-text">
                    {project.description}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-text-light opacity-50 pt-2">
                  {project.year}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-6 border-t border-text/10 pt-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-light bg-text/5 px-2 py-0.5">
                  {project.category}
                </span>
                <div className="flex gap-2">
                  {project.techStack.slice(0, 2).map((tech) => (
                    <span key={tech} className="text-[8px] uppercase tracking-widest text-text/30 font-bold">
                      • {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 FLOATING BOTTOM DOCK CONTROLLER (Carter Ogunsola / Lab Style) */}
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto select-none"
        style={{ isolation: "isolate" }}
      >
        <div
          className={`flex items-center gap-1.5 p-1.5 rounded-full border shadow-2xl backdrop-blur-2xl transition-all duration-500 ${
            isWheel
              ? "bg-[#181818]/90 border-white/20 shadow-black/80"
              : "bg-background/90 border-text/15 shadow-2xl"
          }`}
        >
          {(["list", "wheel", "grid"] as WorkViewMode[]).map((mode) => {
            const active = viewMode === mode;
            const label = mode.charAt(0).toUpperCase() + mode.slice(1);
            return (
              <button
                key={mode}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewMode(mode);
                }}
                className={`relative px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer ${
                  active
                    ? isWheel
                      ? "bg-white text-black shadow-lg scale-105"
                      : "bg-text text-background shadow-lg scale-105"
                    : isWheel
                    ? "text-neutral-400 hover:text-white hover:bg-white/10"
                    : "text-text-light hover:text-text hover:bg-text/5"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
