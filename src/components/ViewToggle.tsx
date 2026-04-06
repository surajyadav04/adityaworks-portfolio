"use client";

interface ViewToggleProps {
  currentMode: "PROFILE" | "WORK";
  onToggle: (mode: "PROFILE" | "WORK") => void;
}

/**
 * MINIMAL VIEW TOGGLE
 * Positioned fixed at the top-right of the portfolio.
 * Design: High-end, subtle, using the existing accent color.
 */
export default function ViewToggle({ currentMode, onToggle }: ViewToggleProps) {
  return (
    <div className="fixed top-8 right-8 z-[100] flex items-center gap-4 bg-background/80 backdrop-blur-md p-2 px-4 rounded-full border border-text/10 shadow-sm">
      <button 
        onClick={() => onToggle("PROFILE")}
        className={`text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
          currentMode === "PROFILE" ? "text-accent font-bold" : "text-text-light hover:text-text"
        }`}
      >
        Profile
      </button>

      <div className="w-[1px] h-3 bg-text/10" />

      <button 
        onClick={() => onToggle("WORK")}
        className={`text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
          currentMode === "WORK" ? "text-accent font-bold" : "text-text-light hover:text-text"
        }`}
      >
        Work
      </button>
      
      {/* Subtle indicator dot */}
      <div 
        className="absolute bottom-1 w-1 h-1 bg-accent rounded-full transition-all duration-500 ease-out"
        style={{ 
          left: currentMode === "PROFILE" ? "24%" : "72%",
          opacity: 0.8
        }}
      />
    </div>
  );
}
