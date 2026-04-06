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
    };
    palette: {
      colors: string[];
      intent: string;
    };
  };
  interactions: {
    title: string;
    description: string;
  }[];
  weirdBanner?: {
    title: string;
    meaning: string;
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
        name: "Rozha One",
        reasoning: "Chosen for its editorial and timeless storytelling feel, balancing heritage with modern aesthetics."
      },
      palette: {
        colors: ["#F5F5DC", "#FF4500", "#1A1A1A"],
        intent: "A parchment-inspired primary base reflecting old maps, accented by high-contrast reds for urgency."
      }
    },
    interactions: [
      {
        title: "Climate Switch",
        description: "An atmospheric toggle that shifts the entire site's visual and auditory 'weather'—from dust to rain—to match the traveler's inner state."
      },
      {
        title: "Cinematic Scroll",
        description: "A non-linear storytelling approach where scrolling drives the camera through 3D scenes instead of just moving down a page."
      }
    ],
    weirdBanner: {
      title: "The Weird Terms",
      meaning: "Travel terms that capture the 'weird' and wonderful essence of the journey.",
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
        reasoning: "Selected for their extreme legibility and mathematical precision in complex data scenarios."
      },
      palette: {
        colors: ["#0A0A0A", "#00BFFF", "#BF00FF"],
        intent: "A 'deep space' dark mode base with neon 'electric' highlights to indicate high-priority interactive zones."
      }
    },
    interactions: [
      {
        title: "Glassmorphic Depth",
        description: "Using layered transparency and back-drop blurs to create a sense of hierarchical depth in flat interfaces."
      },
      {
        title: "Adaptive Tokens",
        description: "Real-time color grading of the UI based on the specific data module being viewed."
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
        reasoning: "Utilized for its technical, developer-centric aesthetic that mirrors the library's focus on logic."
      },
      palette: {
        colors: ["#121212", "#00FFC2", "#FF0055"],
        intent: "Industrial charcoal tones designed to recede, allowing glowing motion trails to take center stage."
      }
    },
    interactions: [
      {
        title: "Kinetic Parallax",
        description: "A multi-layered scroll system where background data points move in logarithmic relation to the user's velocity."
      },
      {
        title: "Dynamic Stream Mapping",
        description: "Visualizing real-time websocket data as fluid particle flows instead of static charts."
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
        reasoning: "A bold, structural choice used for high-impact labels in the generative void."
      },
      palette: {
        colors: ["#000000", "#FFBF00", "#CC5500"],
        intent: "Warm, amber gradients emerging from deep shadows, inspired by fire and organic molten states."
      }
    },
    interactions: [
      {
        title: "Noise Displacement",
        description: "Reactive environments that morph and shift based on the frequency of the surrounding audio input."
      },
      {
        title: "Procedural Growth",
        description: "Geometric clusters that 'grow' and branch out infinitely as the user navigates the 3D space."
      }
    ]
  }
];
