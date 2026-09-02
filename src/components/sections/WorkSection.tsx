"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PROJECTS } from "@/data/projects";

/**
 * WORK SECTION — SELECTED PROJECTS
 * 
 * Powered by centralized data in src/data/projects.ts
 * Design rules: Minimal, cinematic grid, asymmetrical layout flow.
 */
export default function WorkSection() {
  const container = useRef(null);
  const router = useRouter();

  useGSAP(() => {
    // Entrance Animation
    gsap.from(".project-card", {
      scrollTrigger: {
        trigger: container.current,
        start: "top 80%",
      },
      y: 100,
      opacity: 0,
      duration: 1.5,
      stagger: 0.3,
      ease: "power4.out"
    });

    // Hover Animation Setup
    const cards = gsap.utils.toArray(".project-card");
    cards.forEach((card: any) => {
      const img = card.querySelector("img");
      const overlay = card.querySelector(".hover-overlay");
      
      const tl = gsap.timeline({ paused: true });
      tl.to(img, { scale: 1.03, filter: "brightness(1.1)", duration: 0.6, ease: "power2.out" })
        .to(overlay, { opacity: 1, duration: 0.4 }, 0);

      card.addEventListener("mouseenter", () => tl.play());
      card.addEventListener("mouseleave", () => tl.reverse());
    });
  }, { scope: container });

  const handleProjectClick = (projectTitle: string) => {
    const slug = projectTitle.toLowerCase().replace(/\s+/g, '-');
    
    // Cinematic Exit Animation (Homepage -> Project)
    gsap.to(container.current, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        router.push(`/work/${slug}`);
      }
    });
  };

  return (
    <section id="work" ref={container} className="py-10 px-8 md:px-24 bg-background">
      <div className="flex justify-between items-baseline mb-16">
        <div className="flex flex-col">
          <h2 className="text-section-title leading-tight">Selected<br />Works</h2>
          <span className="text-[10px] uppercase tracking-[0.4em] text-accent font-bold mt-4 italic">/ Case Studies</span>
        </div>
        <span className="text-xs uppercase tracking-widest text-text-light font-medium italic">
          / {PROJECTS.length.toString().padStart(2, '0')} projects
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
        {PROJECTS.map((project, index) => (
          <div 
            key={index} 
            className="project-card group cursor-pointer relative"
            onClick={() => handleProjectClick(project.title)}
          >
            <div className="relative aspect-[16/10] bg-text/5 overflow-hidden mb-8 border border-text/10 shadow-sm">
              {/* Project Preview Image */}
              <Image 
                src={project.previewImage} 
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-700 brightness-[0.98] group-hover:scale-[1.03]"
              />
              
              {/* Hover Overlay */}
              <div className="hover-overlay absolute inset-0 bg-primary/10 opacity-0 flex items-center justify-center pointer-events-none transition-opacity duration-500">
                <span className="text-sm uppercase tracking-widest text-text font-bold px-6 py-3 bg-background/90 backdrop-blur-sm border border-text/10 shadow-lg">View Case Study</span>
              </div>

              {/* Concept Project Label */}
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
                {/* Project Short Description */}
                <p className="text-sm text-text-light font-light mt-3 line-clamp-2 transition-colors duration-500 group-hover:text-text">
                  {project.description}
                </p>
              </div>
              <span className="text-[10px] font-mono text-text-light opacity-50 pt-2">{project.year}</span>
            </div>

            <div className="flex items-center gap-4 mt-6 border-t border-text/10 pt-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-light bg-text/5 px-2 py-0.5">{project.category}</span>
              <div className="flex gap-2">
                {project.techStack.slice(0, 2).map(tech => (
                  <span key={tech} className="text-[8px] uppercase tracking-widest text-text/30 font-bold">• {tech}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
