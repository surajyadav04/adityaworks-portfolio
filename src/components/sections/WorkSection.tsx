"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useRouter } from "next/navigation";
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
        <h2 className="text-section-title">Selected<br />Works</h2>
        <span className="text-xs uppercase tracking-widest text-text-light font-medium italic">/ 04 projects</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
        {PROJECTS.map((project, index) => (
          <div 
            key={index} 
            className="project-card group cursor-pointer relative"
            onClick={() => handleProjectClick(project.title)}
          >
            <div className="relative aspect-[4/5] bg-text/5 overflow-hidden mb-6">
              {/* placeholder for project image */}
              <div className="absolute inset-0 bg-text/10 group-hover:bg-primary/20 transition-colors duration-700" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <span className="text-sm uppercase tracking-widest text-text font-bold">View Case Study</span>
              </div>
            </div>
            
            <h3 className="text-3xl font-bold tracking-tighter text-text group-hover:text-accent transition-colors duration-500">
              {project.title}
            </h3>
            
            {/* Project Short Description */}
            <p className="text-sm text-text-light font-light mt-2 line-clamp-2 transition-colors duration-500 group-hover:text-text">
              {project.description}
            </p>

            <div className="flex justify-between items-center mt-6 border-t border-text/10 pt-4">
              <span className="text-xs uppercase tracking-[0.2em] text-text-light">{project.category}</span>
              <span className="text-xs font-mono text-text-light opacity-50">{project.year}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
