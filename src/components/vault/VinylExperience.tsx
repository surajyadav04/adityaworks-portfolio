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

  // Map VAULT_ITEMS music entries → VinylCrate item shape
  const vinylRecords = useMemo<VinylRecord[]>(() => {
    return VAULT_ITEMS.filter((it) => it.category === "music").map((it) => ({
      id: it.id,
      title: it.title,
      subtitle: `${it.creator}, ${it.year}`,
      description: it.whyItMovedMe,
      cover: it.image,
      href: it.externalLink,
      cta: "Listen on Spotify",
    }));
  }, []);

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
        className="absolute inset-0 z-20 overflow-y-auto overflow-x-hidden pt-24 pb-12 flex flex-col items-center justify-start"
        style={{ background: "#f2f2f2" }}
      >
        <div className="w-full max-w-5xl px-4 md:px-8 my-auto">
          <VinylCrate
            eyebrow="FREQUENCIES · 12-INCH VINYL VAULT"
            title="Dig through the crate"
            items={vinylRecords}
          />
        </div>
      </div>
    </main>
  );
}
