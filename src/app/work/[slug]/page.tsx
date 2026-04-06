"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PROJECTS } from "@/data/projects";
import { useViewContext } from "@/context/ViewContext";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";

/**
 * PROJECT SHOWCASE PAGE
 * 
 * Dynamic route: /work/[slug]
 * Renders full project details with cinematic motion.
 */
export default function ProjectShowcase() {
  const { slug } = useParams();
  const router = useRouter();
  const { setMode } = useViewContext();
  const container = useRef(null);

  // Find project by slug
  const project = PROJECTS.find(
    (p) => p.title.toLowerCase().replace(/\s+/g, "-") === slug
  );

  // GSAP Entrance
  useGSAP(() => {
    if (!project) return;

    const tl = gsap.timeline();
    
    tl.from(".reveal-text", {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power4.out"
    })
    .from(".reveal-visual", {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: "power3.out"
    }, "-=0.6")
    .from(".reveal-cta", {
      opacity: 0,
      x: -20,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out"
    }, "-=0.4");
  }, { scope: container, dependencies: [project] });

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
          <button 
            onClick={() => router.push("/")}
            className="text-accent underline uppercase tracking-widest text-sm"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  const handleBack = () => {
    setMode("WORK");
    router.push("/");
  };

  return (
    <main ref={container} className="min-h-screen bg-background pt-32 pb-24 px-8 md:px-24">
      {/* Back Navigation */}
      <button 
        onClick={handleBack}
        className="reveal-text mb-12 flex items-center gap-2 text-text-light hover:text-accent transition-colors group"
      >
        <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
        <span className="text-xs uppercase tracking-[0.3em] font-medium">Back to Work</span>
      </button>

      {/* Header Section */}
      <header className="mb-20">
        <span className="reveal-text block text-xs uppercase tracking-[0.4em] text-accent font-bold mb-4">
          Case Study / {project.year}
        </span>
        <h1 className="reveal-text text-display leading-tight mb-8">
          {project.title}
        </h1>
        <div className="reveal-text flex flex-wrap gap-3">
          {project.techStack.map((tech) => (
            <span 
              key={tech} 
              className="px-3 py-1 bg-text/5 text-[10px] uppercase tracking-widest font-bold text-text-light border border-text/10"
            >
              {tech}
            </span>
          ))}
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Project Visual Section */}
        <section className="reveal-visual lg:col-span-8">
          <div className="aspect-video bg-text/5 relative overflow-hidden flex items-center justify-center border border-text/5">
            <span className="text-xs uppercase tracking-widest opacity-20 font-bold">Project Visual Container</span>
            {/* Visual background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)]" />
          </div>
        </section>

        {/* Project Info Section */}
        <aside className="lg:col-span-4 lg:sticky lg:top-32">
          <div className="reveal-text mb-12">
            <h2 className="text-xs uppercase tracking-widest text-text-light font-bold border-b border-text/10 pb-2 mb-6">
              Overview
            </h2>
            <p className="text-body text-text/80">
              {project.description}
            </p>
          </div>

          <div className="reveal-text mb-12">
            <h2 className="text-xs uppercase tracking-widest text-text-light font-bold border-b border-text/10 pb-2 mb-6">
              Features & Highlights
            </h2>
            <ul className="space-y-4">
              {project.features.map((feature, i) => (
                <li key={i} className="flex gap-3 text-sm text-text/70 leading-relaxed italic">
                  <span className="text-accent">—</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <a 
              href={project.liveUrl} 
              target="_blank" 
              className="reveal-cta px-8 py-4 bg-text text-background text-[10px] font-bold uppercase tracking-[0.3em] text-center hover:bg-accent transition-colors"
            >
              View Live Project
            </a>
            <a 
              href={project.githubUrl} 
              target="_blank" 
              className="reveal-cta px-8 py-4 border border-text/10 text-text text-[10px] font-bold uppercase tracking-[0.3em] text-center hover:border-accent hover:text-accent transition-all"
            >
              View Code Repository
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
