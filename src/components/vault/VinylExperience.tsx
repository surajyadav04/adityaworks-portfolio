"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { VAULT_ITEMS, VaultCategory } from "@/data/vault";
import VinylCrate, { VinylRecord } from "./vinyl-crate/VinylCrate";
import "./vinyl-crate/tokens.css";
import "./vinyl-crate/VinylCrate.css";

interface VinylExperienceProps {
  onSelectCategory: (cat: VaultCategory) => void;
  selectedCategory: VaultCategory;
  musicMedium?: "cassettes" | "vinyl";
  onSelectMusicMedium?: (medium: "cassettes" | "vinyl") => void;
}

export default function VinylExperience({
  onSelectCategory,
  selectedCategory,
  musicMedium = "vinyl",
  onSelectMusicMedium,
}: VinylExperienceProps) {
  const categories: { key: VaultCategory; label: string }[] = [
    { key: "cinema", label: "Cinema" },
    { key: "music", label: "Music" },
    { key: "books", label: "Books" },
    { key: "art", label: "Art" },
  ];

  // Curated audiophile pressing specs & harmonic synth frequencies per album
  const vinylPressingSpecs: Record<
    string,
    {
      vinylColor: string;
      labelColor: string;
      accentColor: string;
      chordFreqs: number[];
      epVisualizer?: {
        front: string;
        back: string;
        aSide: string;
        bSide: string;
        background?: string;
        extractedBackground?: string;
      };
    }
  > = useMemo(
    () => ({
      "the-social-network-ost": {
        vinylColor: "#0c121c",
        labelColor: "#e8b04b",
        accentColor: "#e8b04b",
        chordFreqs: [110.0, 164.81, 220.0, 261.63],
        epVisualizer: {
          front: "/ep-visualizer/1/afx_selected8582_front.jpg",
          back: "/ep-visualizer/1/afx_selected8582_back.jpg",
          aSide: "/ep-visualizer/1/afx_selected8582_aside.png",
          bSide: "/ep-visualizer/1/afx_selected8582_bside.png",
          background: "#16181e",
          extractedBackground: "#1e222d",
        },
      },
      "random-access-memories": {
        vinylColor: "#14100d",
        labelColor: "#f3c65f",
        accentColor: "#f3c65f",
        chordFreqs: [146.83, 220.0, 261.63, 329.63],
        epVisualizer: {
          front: "/ep-visualizer/2/deftones_whitepony_front.avif",
          back: "/ep-visualizer/2/deftones_whitepony_back.jpg",
          aSide: "/ep-visualizer/2/deftones_whitepony_aside.png",
          bSide: "/ep-visualizer/2/deftones_whitepony_bside.png",
          background: "#221c17",
          extractedBackground: "#3a2f26",
        },
      },
      "oppenheimer-ost": {
        vinylColor: "#240d07",
        labelColor: "#ff6b2b",
        accentColor: "#ff6b2b",
        chordFreqs: [130.81, 196.0, 246.94, 311.13],
        epVisualizer: {
          front: "/ep-visualizer/4/mfdoom_madvillainy_front.jpg",
          back: "/ep-visualizer/4/mfdoom_madvillainy_back.jpg",
          aSide: "/ep-visualizer/4/mfdoom_madvillainy_aside.png",
          bSide: "/ep-visualizer/4/mfdoom_madvillainy_bside.png",
          background: "#2a150c",
          extractedBackground: "#472111",
        },
      },
      blonde: {
        vinylColor: "#111913",
        labelColor: "#4ade80",
        accentColor: "#4ade80",
        chordFreqs: [174.61, 220.0, 261.63, 329.63],
        epVisualizer: {
          front: "/ep-visualizer/5/macmiller_kids_front.jpg",
          back: "/ep-visualizer/5/macmiller_kids_back.jpg",
          aSide: "/ep-visualizer/5/macmiller_kids_aside.png",
          bSide: "/ep-visualizer/5/macmiller_kids_bside.png",
          background: "#121d15",
          extractedBackground: "#1e3325",
        },
      },
      "in-rainbows": {
        vinylColor: "#1a0b09",
        labelColor: "#ff5533",
        accentColor: "#ff5533",
        chordFreqs: [164.81, 246.94, 293.66, 369.99],
        epVisualizer: {
          front: "/ep-visualizer/3/bjork_post_front.jpg",
          back: "/ep-visualizer/3/bjork_post_back.jpg",
          aSide: "/ep-visualizer/3/bjork_post_aside.png",
          bSide: "/ep-visualizer/3/bjork_post_bside.png",
          background: "#2a1210",
          extractedBackground: "#4a1c18",
        },
      },
      "selected-ambient-works": {
        vinylColor: "#11151c",
        labelColor: "#38bdf8",
        accentColor: "#38bdf8",
        chordFreqs: [130.81, 196.0, 293.66, 392.0],
        epVisualizer: {
          front: "/ep-visualizer/1/afx_selected8582_front.jpg",
          back: "/ep-visualizer/1/afx_selected8582_back.jpg",
          aSide: "/ep-visualizer/1/afx_selected8582_aside.png",
          bSide: "/ep-visualizer/1/afx_selected8582_bside.png",
          background: "#111722",
          extractedBackground: "#1b273b",
        },
      },
      "blade-runner-vangelis": {
        vinylColor: "#091020",
        labelColor: "#f43f5e",
        accentColor: "#f43f5e",
        chordFreqs: [138.59, 207.65, 261.63, 329.63],
        epVisualizer: {
          front: "/ep-visualizer/3/bjork_post_front.jpg",
          back: "/ep-visualizer/3/bjork_post_back.jpg",
          aSide: "/ep-visualizer/3/bjork_post_aside.png",
          bSide: "/ep-visualizer/3/bjork_post_bside.png",
          background: "#111326",
          extractedBackground: "#1d2146",
        },
      },
      mezzanine: {
        vinylColor: "#0a0a0a",
        labelColor: "#a3e635",
        accentColor: "#a3e635",
        chordFreqs: [98.0, 146.83, 196.0, 233.08],
        epVisualizer: {
          front: "/ep-visualizer/4/mfdoom_madvillainy_front.jpg",
          back: "/ep-visualizer/4/mfdoom_madvillainy_back.jpg",
          aSide: "/ep-visualizer/4/mfdoom_madvillainy_aside.png",
          bSide: "/ep-visualizer/4/mfdoom_madvillainy_bside.png",
          background: "#121411",
          extractedBackground: "#1f251c",
        },
      },
      "music-for-18-musicians": {
        vinylColor: "#181510",
        labelColor: "#fbbf24",
        accentColor: "#fbbf24",
        chordFreqs: [185.0, 220.0, 277.18, 329.63],
        epVisualizer: {
          front: "/ep-visualizer/2/deftones_whitepony_front.avif",
          back: "/ep-visualizer/2/deftones_whitepony_back.jpg",
          aSide: "/ep-visualizer/2/deftones_whitepony_aside.png",
          bSide: "/ep-visualizer/2/deftones_whitepony_bside.png",
          background: "#221e14",
          extractedBackground: "#3b3420",
        },
      },
      untrue: {
        vinylColor: "#0f1116",
        labelColor: "#94a3b8",
        accentColor: "#94a3b8",
        chordFreqs: [116.54, 174.61, 207.65, 277.18],
        epVisualizer: {
          front: "/ep-visualizer/1/afx_selected8582_front.jpg",
          back: "/ep-visualizer/1/afx_selected8582_back.jpg",
          aSide: "/ep-visualizer/1/afx_selected8582_aside.png",
          bSide: "/ep-visualizer/1/afx_selected8582_bside.png",
          background: "#12151b",
          extractedBackground: "#202633",
        },
      },
    }),
    []
  );

  // Map VAULT_ITEMS music entries → VinylCrate item shape
  const vinylRecords = useMemo<VinylRecord[]>(() => {
    return VAULT_ITEMS.filter((it) => it.category === "music").map((it) => {
      const spec = vinylPressingSpecs[it.id];
      return {
        id: it.id,
        title: it.title,
        subtitle: `${it.creator}, ${it.year}`,
        creator: it.creator,
        year: it.year,
        genre: it.genreOrDiscipline,
        description: it.whyItMovedMe,
        favoriteHighlight: it.favoriteHighlight,
        reviewPublication: it.reviewPublication,
        reviewTestimonial: it.reviewTestimonial,
        reviewStars: it.reviewStars,
        cover: it.image,
        href: it.externalLink,
        cta: "Listen on Spotify",
        vinylColor: spec?.vinylColor,
        labelColor: spec?.labelColor,
        accentColor: spec?.accentColor,
        chordFreqs: spec?.chordFreqs,
      };
    });
  }, [vinylPressingSpecs]);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden select-none bg-[#f2f2f2] text-black"
      style={{ fontFamily: "inherit" }}
    >
      {/* ── Subtle Film Grain Overlay ──────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          opacity: 0.035,
          backgroundImage: "url(/noise.svg)",
          backgroundSize: "180px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER: Back Link & Centered Category Filter Pills
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-14 pt-7 pb-4 pointer-events-none">
        {/* Left: Back + breadcrumb */}
        <div className="flex items-center gap-5 pointer-events-auto">
          <Link
            href="/about"
            className="text-[11px] font-mono uppercase tracking-[0.28em] text-black/55 hover:text-black transition-colors flex items-center gap-2 group font-semibold"
          >
            <span className="inline-block group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>About</span>
          </Link>
          <span className="text-black/25 text-xs">/</span>
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-black font-bold">
            The Vault
          </span>
        </div>

        {/* Center: Category Navigation Pills */}
        <nav
          className="absolute left-1/2 -translate-x-1/2 top-7 flex items-center gap-1 pointer-events-auto rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-2.5 py-1.5 shadow-sm z-50"
          aria-label="Filter by category"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all duration-200 cursor-pointer pointer-events-auto ${
                  isActive
                    ? "bg-black text-white font-bold shadow-sm"
                    : "text-black/55 hover:text-black hover:bg-black/5"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Music Medium Switch: Cassettes ↔ Vinyl */}
        <div className="flex items-center gap-1 pointer-events-auto rounded-full border border-black/10 bg-white/80 backdrop-blur-md p-1 shadow-sm text-[10px] font-mono uppercase tracking-widest z-50">
          <button
            type="button"
            onClick={() => onSelectMusicMedium?.("cassettes")}
            className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              musicMedium === "cassettes"
                ? "bg-black text-white font-bold shadow-sm"
                : "text-black/55 hover:text-black hover:bg-black/5"
            }`}
          >
            Cassettes
          </button>
          <button
            type="button"
            onClick={() => onSelectMusicMedium?.("vinyl")}
            className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              musicMedium === "vinyl"
                ? "bg-black text-white font-bold shadow-sm"
                : "text-black/55 hover:text-black hover:bg-black/5"
            }`}
          >
            Vinyl
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          VINYL CRATE  — full-screen, sits beneath the header z-layer
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 z-20 overflow-y-auto overflow-x-hidden pt-16 pb-6 flex flex-col items-center justify-start"
        style={{ background: "#f2f2f2" }}
      >
        <div className="w-full max-w-7xl px-4 md:px-8 my-auto">
          <VinylCrate
            eyebrow="FREQUENCIES · 12-INCH AUDIOPHILE ARCHIVE (180G)"
            title="Dig through the crate"
            items={vinylRecords}
          />
        </div>
      </div>
    </main>
  );
}
