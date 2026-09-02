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
    visual: string | string[];
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
    title: "PlacePrep AI",
    category: "Institutional AI Platform / Full-Stack",
    year: "2024",
    description: "Master your interviews with precision. AI-powered mock interviews, resume intelligence, and real-time performance analytics — built for engineers who refuse to leave placement to chance.",
    techStack: ["React 19", "Vite", "Tailwind CSS", "FastAPI", "Python", "SQLAlchemy", "Three.js", "Framer Motion", "Recharts", "aiosqlite"],
    previewImage: "/projects/placeprep.png",
    features: [
      "The Forge (ATS Resume Analyzer): Section-by-section parsing, keyword optimization, and JD skill matching.",
      "The Crucible (Mock Interviews): Real-time simulation evaluating Sentiment, Logic Clarity, and Confidence.",
      "The Oracle (Performance Analytics): Interactive telemetry tracking placement readiness benchmarks and scoring curves.",
      "The Gateway (Institutional Auth): Decoupled asynchronous JWT security with isolated multi-role access control."
    ],
    liveUrl: "https://placeprepai.vercel.app",
    githubUrl: "https://github.com/surajyadav04/placeprep-ai",
    overview: {
      concept: "An intelligent institutional placement preparation gateway elevating the placement journey from an opaque process to a precise, data-driven science.",
      purpose: "To act as a personal mentor, a rigorous interviewer, and an ATS-savvy resume critic—all wrapped in a responsive glassmorphism interface.",
      why: "Students face opaque hiring criteria and lack immediate feedback; PlacePrep AI strips away the noise and provides structured institutional analytics."
    },
    designDetails: {
      typography: {
        name: "Playfair Display & Geist",
        reasoning: "High-contrast editorial serif paired with an ultra-clean geometric sans-serif and monospace technical data for academic prestige and technical precision.",
        fonts: [
          { name: "Playfair Display", role: "Hero Display", usage: "Main project headings, prestige brand statements, and module titles." },
          { name: "Geist", role: "UI & Telemetry", usage: "Dashboard metrics, feedback transcripts, and question prompts." },
          { name: "DM Mono", role: "Technical Data", usage: "Code snippets, telemetry data points, and score breakdowns." }
        ]
      },
      palette: {
        colors: [
          { name: "Warm Ivory", hex: "#FDFBF7", usage: "Canvas / Void (Light)", intent: "Parchment-inspired warm base delivering an editorial, low-fatigue experience." },
          { name: "Slate Charcoal", hex: "#2D3748", usage: "Primary Text & Brand", intent: "Authoritative charcoal for high-contrast, structured readability." },
          { name: "Frosted Lilac", hex: "#E9D8FD", usage: "Glass Cards & Glow", intent: "Soft ethereal lavender accentuating interactive glass panels and highlights." },
          { name: "Emerald Sage", hex: "#38A169", usage: "Readiness & Mastery", intent: "Affirmative indicator for topic mastery and successful score benchmarks." }
        ]
      }
    },
    deepSections: [
      {
        id: "the-forge-ats",
        title: "The Forge: Neural Semantic Vector Matching & Dual-Stream ATS Engine",
        visual: "/projects/placeprep.png",
        what: "An advanced NLP document analysis engine utilizing sentence-transformer embeddings and dual-stream PDF decoders to calculate cosine similarity against target Job Descriptions.",
        why: "Standard ATS tools rely on naive keyword counts which fail on synonyms. The Forge projects candidate experience into high-dimensional semantic vector space for true contextual alignment.",
        how: "Combines SentenceTransformer (all-MiniLM-L6-v2) cosine similarity tensors with PyMuPDF/pdfplumber fallback streams and weighted keyword-gap heuristics in asynchronous Python workers.",
        codeSnippet: `# ── NEURAL SEMANTIC EMBEDDING & DUAL-STREAM ATS ENGINE ──
from sentence_transformers import SentenceTransformer, util as st_util
import fitz        # PyMuPDF low-level stream decoder
import pdfplumber

_st_model = SentenceTransformer("all-MiniLM-L6-v2")

async def match_jd_semantic_stream(resume_path: str, jd_text: str) -> Dict[str, Any]:
    # Phase 1: Dual-Engine PyMuPDF / pdfplumber fallback text stream
    text = ""
    try:
        with pdfplumber.open(resume_path) as pdf:
            text = "\\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception:
        doc = fitz.open(resume_path)
        text = "\\n".join(page.get_text() for page in doc)
    
    # Phase 2: Vector embedding & Cosine Similarity tensor projection
    resume_emb = _st_model.encode(text, convert_to_tensor=True, show_progress_bar=False)
    jd_emb = _st_model.encode(jd_text, convert_to_tensor=True, show_progress_bar=False)
    
    # High-dimensional semantic distance calculation (0.00 - 1.00)
    semantic_score = float(st_util.cos_sim(resume_emb, jd_emb)[0][0])
    
    # Phase 3: Sectional weighted heuristic & keyword gap matrix
    return {
        "semantic_match": round(semantic_score * 100, 2),
        "skills_coverage": calculate_skill_overlap(text, jd_text),
        "readiness_index": compute_weighted_ats(semantic_score, text)
    }`
      },
      {
        id: "the-crucible-interviews",
        title: "The Crucible: Real-Time Audio Cadence, Sentiment & Telemetry Stream",
        visual: "/projects/placeprep.png",
        what: "A real-time evaluation pipeline analyzing speech delivery cadence (WPM), hesitation token frequency, and vocal pitch confidence overlaid with Three.js 3D meshes and Recharts telemetry.",
        why: "Gives candidates instant diagnostic feedback on vocal delivery and confidence before they sit in real institutional hiring rounds.",
        how: "WebAudio API analyser nodes stream real-time decibel energy and frequency bands synced with Whisper transcription streams to evaluate confidence, pacing, and response logic.",
        codeSnippet: `// ── REAL-TIME VOCAL CADENCE & CONFIDENCE EVALUATION ──
export function evaluateCrucibleCadence(transcriptStream: string[], audioFrequencies: Uint8Array, durationSec: number) {
  // 1. Words-Per-Minute & Hesitation Token Analysis
  const totalWords = transcriptStream.join(" ").split(/\\s+/).filter(Boolean).length;
  const wpm = Math.round((totalWords / durationSec) * 60);
  const hesitationMatches = transcriptStream.join(" ").match(/\\b(um|uh|like|you know|basically)\\b/gi) || [];
  
  // 2. Frequency Band Variance (Vocal Pitch & Steady Energy)
  const rmsEnergy = Math.sqrt(audioFrequencies.reduce((sum, v) => sum + v * v, 0) / audioFrequencies.length);
  const cadenceScore = wpm >= 120 && wpm <= 160 ? 95 : Math.max(50, 95 - Math.abs(140 - wpm) * 0.8);
  
  // 3. Composite Confidence Coefficient
  const confidenceIndex = Math.max(10, Math.min(99, Math.round(
    cadenceScore * 0.6 + (rmsEnergy * 0.25) - (hesitationMatches.length * 4)
  )));

  return { wpm, confidenceIndex, clarity: hesitationMatches.length === 0 ? 98 : 82 };
}`
      }
    ]
  },
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
        visual: ["/projects/climate-rain.png", "/projects/climate-snow.png"],
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
        visual: "/projects/scroll-experience.png",
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
        visual: "/projects/coordinates.png",
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
