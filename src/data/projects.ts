export interface Project {
  title: string;
  category: string;
  year: string;
  description: string;
  techStack: string[];
  liveUrl: string;
  githubUrl: string;
}

export const PROJECTS: Project[] = [
  {
    title: "The Weird Wanderer",
    category: "Cinematic Experience / Web",
    year: "2024",
    description: "A cinematic travel storytelling experience with immersive WebGL visuals and scroll-driven narratives.",
    techStack: ["Vite", "OGL", "GSAP", "Lenis", "JavaScript"],
    liveUrl: "https://the-weird-wanderer.vercel.app",
    githubUrl: "https://github.com/surajyadav04/the-weird-wanderer"
  },
  {
    title: "Elysium",
    category: "Product Design",
    year: "2024",
    description: "Future-forward product interface design system focusing on modularity and high-speed interaction.",
    techStack: ["Next.js", "Tailwind", "Framer Motion"],
    liveUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Synthesis",
    category: "Motion Systems",
    year: "2023",
    description: "A comprehensive movement framework designed for enterprise-level visual storytelling and data viz.",
    techStack: ["GSAP", "Three.js", "D3.js"],
    liveUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Origin",
    category: "Creative Coding",
    year: "2023",
    description: "Exploration into procedural geometry and generative art using custom shader programs and physics engines.",
    techStack: ["WebGL", "Three.js", "GLSL"],
    liveUrl: "#",
    githubUrl: "#"
  }
];
