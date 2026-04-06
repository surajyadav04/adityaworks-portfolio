"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PROJECTS } from "@/data/projects";
import { useViewContext } from "@/context/ViewContext";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";

/**
 * PROJECT SHOWCASE PAGE
 * 
 * Dynamic route: /work/[slug]
 * Renders full project details with cinematic motion and editorial storytelling.
 */
export default function ProjectShowcase() {
  const { slug } = useParams();
  const router = useRouter();
  const { setMode } = useViewContext();
  const container = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Find project by slug
  const project = PROJECTS.find(
    (p) => p.title.toLowerCase().replace(/\s+/g, "-") === slug
  );

  // Sync mode with global context (ensures Navbar highlights 'Work')
  useEffect(() => {
    if (project) {
      setMode("WORK");
      // Scroll to top on mount
      window.scrollTo(0, 0);
    }
  }, [project, setMode]);

  // GSAP Entrance
  useGSAP(() => {
    if (!project) return;

    // Reset container state for entrance
    gsap.set(container.current, { opacity: 0, y: 20 });

    const tl = gsap.timeline({ onComplete: () => setIsLoaded(true) });
    
    tl.to(container.current, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "power2.out"
    })
    .from(".reveal-text", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.05,
      ease: "power3.out"
    }, "-=0.4")
    .from(".reveal-visual", {
      opacity: 0,
      clipPath: "inset(0 100% 0 0)",
      duration: 1.2,
      ease: "power4.out"
    }, "-=0.8");
  }, { scope: container, dependencies: [project] });

  // Weird Banner Hover Reveal
  useGSAP(() => {
    if (!isLoaded) return;
    
    const cards = gsap.utils.toArray(".term-card");
    cards.forEach((card: any) => {
      const definition = card.querySelector(".term-definition");
      const tl = gsap.timeline({ paused: true });
      
      tl.to(definition, { 
        opacity: 1, 
        y: 0, 
        duration: 0.4, 
        ease: "power2.out" 
      });

      card.addEventListener("mouseenter", () => tl.play());
      card.addEventListener("mouseleave", () => tl.reverse());
    });
  }, { scope: container, dependencies: [isLoaded] });

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-8 font-sans">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 tracking-tighter">Project Not Found</h1>
          <button 
            onClick={() => router.push("/")}
            className="text-accent underline uppercase tracking-widest text-xs font-bold"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  const handleBack = () => {
    // Cinematic Exit Animation (Project -> Homepage)
    gsap.to(container.current, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        setMode("WORK");
        router.push("/");
      }
    });
  };

  return (
    <main ref={container} className="min-h-screen bg-background pt-32 pb-48 px-6 md:px-24">
      {/* Back Navigation */}
      <button 
        onClick={handleBack}
        className="reveal-text mb-16 flex items-center gap-3 text-text-light hover:text-accent transition-colors group"
      >
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Back to Work</span>
      </button>

      {/* Header Section */}
      <header className="mb-24">
        <div className="reveal-text flex items-center gap-4 mb-6">
          <span className="text-[10px] uppercase tracking-[0.5em] text-accent font-black">Case Study</span>
          <span className="w-12 h-px bg-text/10" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-text-light font-bold italic">{project.year}</span>
        </div>
        <h1 className="reveal-text text-display leading-[0.9] mb-12 max-w-[15ch]">
          {project.title}
        </h1>
        <div className="reveal-text flex flex-wrap gap-4 items-center">
          <span className="text-xs uppercase tracking-widest text-text font-bold bg-text/5 px-4 py-2 border border-text/10">
            {project.category}
          </span>
          {project.isConcept && (
            <span className="text-[9px] uppercase tracking-[0.3em] text-text-light font-bold px-3 py-1.5 border border-text/10 italic">
              Concept Project
            </span>
          )}
        </div>
      </header>

      {/* Large Visual Section */}
      <section className="reveal-visual mb-32 relative aspect-[16/8] md:aspect-[21/9] overflow-hidden border border-text/5 bg-text/5">
        <Image 
          src={project.previewImage} 
          alt={project.title} 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
      </section>

      {/* Narrative Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 mb-48">
        {/* Left: Overview & Story */}
        <div className="lg:col-span-7 space-y-24">
          <section className="reveal-text">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent font-black mb-8">The Concept</h2>
            <p className="text-display text-4xl md:text-5xl leading-tight mb-8 font-medium">
              {project.overview.concept}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 pt-16 border-t border-text/10">
              <div>
                <h3 className="text-[9px] uppercase tracking-widest text-text-light font-bold mb-4 opacity-50">Purpose</h3>
                <p className="text-sm text-text/80 leading-relaxed italic">{project.overview.purpose}</p>
              </div>
              <div>
                <h3 className="text-[9px] uppercase tracking-widest text-text-light font-bold mb-4 opacity-50">The Call</h3>
                <p className="text-sm text-text/80 leading-relaxed italic">{project.overview.why}</p>
              </div>
            </div>
          </section>

          {/* Interactions Deep-Dive */}
          <section className="reveal-text pt-24">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent font-black mb-12">Interaction Highlights</h2>
            <div className="space-y-16">
              {project.interactions.map((interaction, i) => (
                <div key={i} className="group">
                  <h3 className="text-2xl font-bold tracking-tight mb-4 group-hover:text-accent transition-colors">
                    {interaction.title}
                  </h3>
                  <p className="text-text/70 leading-relaxed max-w-[50ch]">
                    {interaction.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Design DNA (Sticky) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-32 h-fit space-y-16">
          <div className="reveal-text bg-text/5 p-12 border border-text/10 backdrop-blur-sm">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-light font-black mb-10 pb-4 border-b border-text/10">
              Design DNA
            </h2>
            
            <div className="mb-12">
              <h3 className="text-[9px] uppercase tracking-widest text-accent font-bold mb-3">Typography</h3>
              <p className="text-xl font-bold mb-2 tracking-tight">{project.designDetails.typography.name}</p>
              <p className="text-xs text-text/60 leading-relaxed font-light italic">
                {project.designDetails.typography.reasoning}
              </p>
            </div>

            <div className="mb-12">
              <h3 className="text-[9px] uppercase tracking-widest text-accent font-bold mb-4">Color Palette</h3>
              <div className="flex gap-2 mb-6">
                {project.designDetails.palette.colors.map(color => (
                  <div 
                    key={color} 
                    className="w-10 h-10 border border-text/10" 
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-xs text-text/60 leading-relaxed font-light italic">
                {project.designDetails.palette.intent}
              </p>
            </div>

            <div className="pt-8 border-t border-text/10 flex flex-col gap-4">
              <a 
                href={project.liveUrl} 
                target="_blank" 
                className="reveal-cta px-8 py-4 bg-text text-background text-[10px] font-bold uppercase tracking-[0.4em] text-center hover:bg-accent transition-colors"
              >
                View Live Project
              </a>
              <a 
                href={project.githubUrl} 
                target="_blank" 
                className="reveal-cta px-8 py-4 border border-text/10 text-text text-[10px] font-bold uppercase tracking-[0.4em] text-center hover:border-accent hover:text-accent transition-all"
              >
                View Code Repository
              </a>
            </div>
          </div>

          <div className="reveal-text flex items-center justify-between px-2 opacity-30 group">
             <span className="text-[9px] uppercase tracking-[0.2em] font-mono">Build Stack</span>
             <div className="flex gap-3">
                {project.techStack.map(t => <span key={t} className="text-[8px] font-bold">{t}</span>)}
             </div>
          </div>
        </aside>
      </div>

      {/* Special Element: Weird Banner Reveal */}
      {project.weirdBanner && (
        <section className="reveal-text mb-48">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-display text-5xl md:text-7xl leading-none">{project.weirdBanner.title}</h2>
            <div className="flex-1 h-px bg-text/10" />
          </div>
          <p className="text-text-light text-sm italic mb-16 max-w-[60ch]">
            {project.weirdBanner.meaning}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {project.weirdBanner.terms.map((item, i) => (
              <div 
                key={i} 
                className="term-card relative p-12 bg-text border border-text/10 overflow-hidden min-h-[300px] flex flex-col justify-center items-center text-center group cursor-help"
              >
                <span className="text-background text-3xl md:text-5xl font-bold tracking-tighter mb-4 group-hover:opacity-10 transition-opacity">
                  {item.term}
                </span>
                <div className="term-definition absolute inset-0 p-12 flex items-center justify-center bg-accent opacity-0 translate-y-4 pointer-events-none transition-all">
                  <p className="text-background text-sm font-bold leading-relaxed tracking-wide uppercase">
                    {item.definition}
                  </p>
                </div>
                <div className="absolute top-4 right-4 text-[8px] text-background/30 uppercase tracking-widest font-mono">
                  Concept 0{i+1}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tech Stack Pills (Legacy) */}
      <section className="reveal-text mb-32">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-text-light font-black mb-8 opacity-50">Frameworks used</h2>
        <div className="flex flex-wrap gap-3">
          {project.techStack.map((tech) => (
            <span 
              key={tech} 
              className="px-4 py-2 bg-text/5 text-[9px] uppercase tracking-widest font-black text-text-light border border-text/10"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Bottom Navigation Callback */}
      <footer className="mt-48 pt-24 border-t border-text/10 flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-text-light mb-10 opacity-50 italic">Finis / Case Study</span>
        <button 
          onClick={handleBack}
          className="reveal-text group flex flex-col items-center gap-6 transition-all"
        >
          <span className="text-display text-4xl md:text-8xl hover:text-accent transition-colors leading-none tracking-tighter">
            Back to Work
          </span>
          <div className="flex items-center gap-4 group-hover:gap-8 transition-all duration-700">
            <span className="w-8 h-px bg-accent scale-x-0 group-hover:scale-x-100 origin-right transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.5em] font-black text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              Return to Grid
            </span>
            <span className="w-8 h-px bg-accent scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />
          </div>
        </button>
      </footer>
    </main>
  );
}
