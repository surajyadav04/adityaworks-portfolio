export interface Project {
  title: string;
  category: string;
  year: string;
  description: string;
  techStack: string[];
  features: string[];
  liveUrl: string;
  githubUrl: string;
  previewImage: string;
  isConcept?: boolean;
  overview: {
    concept: string;
    purpose: string;
    why: string;
  };
  designDetails: {
    typography: {
      name: string;
      reasoning: string;
      fonts: { name: string; role: string; usage: string }[];
    };
    palette: {
      colors: { name: string; hex: string; usage: string; intent: string }[];
    };
  };
  deepSections: {
    id: string;
    title: string;
    what: string;
    why: string;
    how: string;
    visual: string;
    codeSnippet?: string;
  }[];
  weirdBanner?: {
    title: string;
    meaning: string;
    translations: { language: string; text: string }[];
    terms: { term: string; definition: string }[];
  };
}

export const PROJECTS: Project[] = [
  {
    title: "The Weird Wanderer",
    category: "Cinematic Experience / Web",
    year: "2024",
    description: "A cinematic travel storytelling experience with immersive WebGL visuals and scroll-driven narratives.",
    techStack: ["Vite", "OGL", "GSAP", "Lenis", "JavaScript"],
    previewImage: "/projects/weird-wanderer.png",
    features: [
      "Custom WebGL fluid simulation for realistic water movement.",
      "Scroll-driven GSAP camera paths across immersive 3D environments.",
      "High-fidelity audio spatialization for cinematic depth."
    ],
    liveUrl: "https://the-weird-wanderer.vercel.app",
    githubUrl: "https://github.com/surajyadav04/the-weird-wanderer",
    overview: {
      concept: "A digital dispatch from the margins of travel, focusing on the stories found in misdirection.",
      purpose: "To bridge the gap between traditional travel blogging and immersive cinematic experiences.",
      why: "Created to experiment with high-end motion design and WebGL as tools for emotional storytelling."
    },
    designDetails: {
      typography: {
        name: "Rozha One & Dune",
        reasoning: "A balance between high-contrast editorial elegance and raw, characterful cinematic wordmarks.",
        fonts: [
          { name: "Dune", role: "Hero Title", usage: "Main project headings and titles for maximum cinematic impact." },
          { name: "Rozha One", role: "Editorial body", usage: "Narrative sections and quotes to maintain a heritage storytelling feel." },
          { name: "Inter", role: "UI / Technical", usage: "Navigation, labels, and technical data points for high legibility." }
        ]
      },
      palette: {
        colors: [
          { name: "Backdrop", hex: "#F4F1EA", usage: "Background", intent: "Parchment-inspired tone reflecting historical travel logs." },
          { name: "Base", hex: "#1A1A1A", usage: "Primary Text", intent: "Deep charcoal for high-contrast, professional readability." },
          { name: "Accent", hex: "#C04028", usage: "Highlights / UI", intent: "A vibrant, earthy red signaling interactive depth and urgency." }
        ]
      }
    },
    deepSections: [
      {
        id: "climate-switch",
        title: "Atmospheric Climate Switch",
        visual: "/projects/tikona_snow_state_1775579405567.png",
        what: "A dynamic weather-based UI transformation engine that reacts to the narrative context.",
        why: "To simulate the visceral reality of travel—where the atmosphere dictates the emotional tone of a place.",
        how: "Implemented using an overlay state system. GSAP handles the transition of particle instances, while CSS variables update the scene's color grading.",
        codeSnippet: `// Partial implementation of the Climate Toggle logic
function updateAtmosphere(state) {
  gsap.to(atmosphereRef.current, {
    opacity: state === 'rain' ? 1 : 0,
    duration: 1.2,
    ease: "power2.inOut"
  });
  document.documentElement.className = state;
}`
      },
      {
        id: "scroll-experience",
        title: "Cinematic Scroll Experience",
        visual: "/projects/hero_dune_title_1775579212870.png",
        what: "A non-linear storytelling approach where scrolling drives the camera through 3D scenes instead of just moving down a page.",
        why: "Cinematic pacing ensures the user absorbs the narrative at a deliberate, human-centric speed.",
        how: "Built on Lenis for smooth momentum-based scrolling, synced with GSAP ScrollTrigger to map scroll progress to WebGL camera coordinates.",
        codeSnippet: `const lenis = new Lenis({ lerp: 0.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.to(camera.position, {
  z: -50,
  scrollTrigger: { scrub: true }
});`
      },
      {
        id: "coordinates-system",
        title: "Traveler & Spatial Coordinates",
        visual: "/projects/travelers_gallery_1775579436852.png",
        what: "A data-driven labeling system that anchors every traveler and story to precise global coordinates.",
        why: "Authenticity. It transforms the digital experience into a verified account of a physical journey.",
        how: "Mapping the 'Dispatch' ID to specific Latitude/Longitude coordinates (e.g., 18.6° N, 73.5° E) rendered through a stylized monospaced UI layer."
      }
    ],
    weirdBanner: {
      title: "The Weird Terms",
      meaning: "Travel terms that capture the 'weird' and wonderful essence of the journey.",
      translations: [
        { language: "English", text: "Weird Wanderer" },
        { language: "Hindi", text: "Ajeeb Musafir" },
        { language: "Urdu", text: "Ajeeb Musafir (عجیب مسافر)" }
      ],
      terms: [
        { term: "Jugaad", definition: "A flexible approach to problem-solving that uses limited resources in an innovative way." },
        { term: "Safar", definition: "A journey that isn't just about reaching a place, but about how the path changes the traveler." },
        { term: "Atithi", definition: "The Sanskrit concept of a guest being a manifestation of the divine—the unannounced host." }
      ]
    }
  },
  {
    title: "Elysium",
    category: "Product Design",
    year: "2024",
    isConcept: true,
    description: "Future-forward product interface design system focusing on modularity and high-speed interaction.",
    techStack: ["Next.js", "Tailwind", "Framer Motion"],
    previewImage: "/projects/elysium.png",
    features: [
      "Modular design tokens for seamless cross-platform adaptability.",
      "Ultra-low latency micro-interactions using Framer Motion.",
      "Inclusive accessibility framework as a core design principle."
    ],
    liveUrl: "#",
    githubUrl: "#",
    overview: {
      concept: "A modular interface system designed for the next generation of high-speed SaaS platforms.",
      purpose: "To showcase how glassmorphism and neon accents can enhance data focus without clutter.",
      why: "An exploration into reducing cognitive load through motion-guided interface transitions."
    },
    designDetails: {
      typography: {
        name: "Inter & Outfit",
        reasoning: "Selected for their extreme legibility and mathematical precision in complex data scenarios.",
        fonts: [
          { name: "Outfit", role: "Display", usage: "Headings for a modern, geometric look." },
          { name: "Inter", role: "Body", usage: "Clean application UI for maximum readability." }
        ]
      },
      palette: {
        colors: [
          { name: "Deep Space", hex: "#0A0A0A", usage: "Background", intent: "A focus-first dark mode base." },
          { name: "Electric Cyan", hex: "#00BFFF", usage: "Highlight", intent: "Digital vibrancy indicating action." }
        ]
      }
    },
    deepSections: [
      {
        id: "module-architecture",
        title: "Modular Interface Architecture",
        visual: "/projects/elysium.png",
        what: "A nested system of adaptive modules that reorganize themselves based on the user's current task priority.",
        why: "To prevent information overload in high-density SaaS environments.",
        how: "Built using dynamic grid systems and React-based layout containers that respond to real-time performance metrics.",
        codeSnippet: `const LayoutManager = ({ modules }) => {
  return modules.sort((a,b) => b.priority - a.priority).map(M => <M.Container />);
}`
      },
      {
        id: "glass-depth",
        title: "Glassmorphic Depth Logic",
        visual: "/projects/elysium.png",
        what: "A multi-layered transparency system using backdrop filters to create a distinct hierarchy of data.",
        why: "It provides a clear visual signal for focus without losing the context of the underlying system state.",
        how: "Using CSS backdrop-filter: blur(20px) combined with subtle 1px border highlights to define layer boundaries."
      }
    ]
  },
  {
    title: "Synthesis",
    category: "Motion Systems",
    year: "2023",
    isConcept: true,
    description: "A comprehensive movement framework designed for enterprise-level visual storytelling and data viz.",
    techStack: ["GSAP", "Three.js", "D3.js"],
    previewImage: "/projects/synthesis.png",
    features: [
      "Data-driven motion paths mapped to real-time API streams.",
      "High-performance canvas rendering for complex particle systems.",
      "Library-agnostic animation hooks for universal integration."
    ],
    liveUrl: "#",
    githubUrl: "#",
    overview: {
      concept: "A unifying movement library that treats animation as data rather than just a visual layer.",
      purpose: "To provide enterprise products with a cohesive 'kinetic identity' across web and mobile.",
      why: "Created to solve the challenge of maintaining physics-based consistency in multi-library tech stacks."
    },
    designDetails: {
      typography: {
        name: "JetBrains Mono",
        reasoning: "Utilized for its technical, developer-centric aesthetic that mirrors the library's focus on logic.",
        fonts: [
          { name: "JetBrains Mono", role: "Technical UI", usage: "Code blocks and documentation tags." }
        ]
      },
      palette: {
        colors: [
          { name: "Industrial Charcoal", hex: "#121212", usage: "Background", intent: "Low-distraction base for motion." },
          { name: "Glow Green", hex: "#00FFC2", usage: "Motion Trails", intent: "Primary signifier of technical activity." }
        ]
      }
    },
    deepSections: [
      {
        id: "kinetic-identity",
        title: "Kinetic Identity Framework",
        visual: "/projects/synthesis.png",
        what: "A standardized set of motion easing and timing rules that ensure every interaction feels like it belongs to the same system.",
        why: "Consistency in motion is as important as consistency in color for enterprise brand trust.",
        how: "Developed a custom GSAP plugin that wraps complex physics calculations into simple, reusable hooks.",
        codeSnippet: `const { animateIn } = useSynthesis();
animateIn('.chart-card', { variant: 'fluid', duration: 0.8 });`
      }
    ]
  },
  {
    title: "Origin",
    category: "Creative Coding",
    year: "2023",
    isConcept: true,
    description: "Exploration into procedural geometry and generative art using custom shader programs and physics engines.",
    techStack: ["WebGL", "Three.js", "GLSL"],
    previewImage: "/projects/origin.png",
    features: [
      "Procedural terrain generation using Simplex and Perlin noise.",
      "Custom GLSL vertex and fragment shaders for unique visual signatures.",
      "Multi-threaded physics computations via Web Workers."
    ],
    liveUrl: "#",
    githubUrl: "#",
    overview: {
      concept: "An artistic laboratory for generative visuals that mimic organic growth through mathematical noise.",
      purpose: "To push the boundaries of real-time browser rendering using custom GLSL shaders.",
      why: "A study on the intersection of chaos theory and computational art."
    },
    designDetails: {
      typography: {
        name: "Bebas Neue",
        reasoning: "A bold, structural choice used for high-impact labels in the generative void.",
        fonts: [
          { name: "Bebas Neue", role: "Decorative Labels", usage: "Large scale structural signage." }
        ]
      },
      palette: {
        colors: [
          { name: "Molten Amber", hex: "#FFBF00", usage: "Primary Glow", intent: "Organic light sources." },
          { name: "Deep Shadow", hex: "#000000", usage: "Background", intent: "Total void for maximum contrast." }
        ]
      }
    },
    deepSections: [
      {
        id: "shader-physics",
        title: "GLSL Shader Physics",
        visual: "/projects/origin.png",
        what: "Procedural displacement of geometry using custom vertex shaders that calculate perlin noise on the GPU.",
        why: "To achieve complex, organic movement at 60fps without burdening the CPU.",
        how: "Written in GLSL using 4D Simplex noise functions, allowing for non-repeating, time-based morphing of 3D meshes.",
        codeSnippet: `void main() {
  vec3 pos = position;
  pos.y += snoise(vec4(pos * 0.1, uTime));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`
      }
    ]
  }
];
