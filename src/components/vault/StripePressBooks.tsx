"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { VAULT_ITEMS, VaultCategory, VaultItem } from "@/data/vault";

interface StripePressBooksProps {
  selectedCategory: VaultCategory;
  onSelectCategory: (cat: VaultCategory) => void;
}

interface BookPalette {
  bg: string;
  cover: string;
  coverSecondary: string;
  foil: string;
  ink: string;
  uiBg: string;
  uiText: string;
  uiMuted: string;
  motif: "rings" | "grid" | "waves" | "orbital" | "bars" | "arch";
}

const BOOK_PALETTES: BookPalette[] = [
  {
    bg: "#231928", // Stripe Press deep plum charcoal
    cover: "#1d1422",
    coverSecondary: "#32233b",
    foil: "#e7c873",
    ink: "#f6f0e4",
    uiBg: "#231928",
    uiText: "#f6f0e4",
    uiMuted: "rgba(246, 240, 228, 0.62)",
    motif: "rings",
  },
  {
    bg: "#c79232", // Stripe Press warm mustard
    cover: "#171c22",
    coverSecondary: "#26303a",
    foil: "#e8b84b",
    ink: "#f7f3ea",
    uiBg: "#c79232",
    uiText: "#161412",
    uiMuted: "rgba(22, 20, 18, 0.68)",
    motif: "grid",
  },
  {
    bg: "#17262d", // Deep teal slate
    cover: "#142128",
    coverSecondary: "#233944",
    foil: "#d8dee9",
    ink: "#f4f1ea",
    uiBg: "#17262d",
    uiText: "#f4f1ea",
    uiMuted: "rgba(244, 241, 234, 0.62)",
    motif: "orbital",
  },
  {
    bg: "#8c3727", // Editorial terracotta
    cover: "#241917",
    coverSecondary: "#3b2724",
    foil: "#e8b27c",
    ink: "#f8f2e8",
    uiBg: "#8c3727",
    uiText: "#f8f2e8",
    uiMuted: "rgba(248, 242, 232, 0.66)",
    motif: "waves",
  },
  {
    bg: "#3b342e", // Warm editorial taupe
    cover: "#ebe5d8",
    coverSecondary: "#d8cfbe",
    foil: "#9b3d2c",
    ink: "#1c1917",
    uiBg: "#3b342e",
    uiText: "#f5f0e6",
    uiMuted: "rgba(245, 240, 230, 0.64)",
    motif: "bars",
  },
  {
    bg: "#1b2d25", // Deep forest moss
    cover: "#14221c",
    coverSecondary: "#233930",
    foil: "#dfc58b",
    ink: "#f3efe6",
    uiBg: "#1b2d25",
    uiText: "#f3efe6",
    uiMuted: "rgba(243, 239, 230, 0.62)",
    motif: "arch",
  },
];

const BOOK_DIMS = {
  width: 1.54,
  height: 2.26,
  thickness: 0.24,
  boardThickness: 0.022,
  overhang: 0.028,
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  motif: BookPalette["motif"],
  w: number,
  h: number,
  foil: string,
  secondary: string
) {
  ctx.save();
  const cx = w * 0.5;
  const cy = h * 0.62;

  if (motif === "rings") {
    ctx.strokeStyle = foil;
    for (let i = 1; i <= 9; i++) {
      ctx.globalAlpha = 0.16 + (i % 3) * 0.14;
      ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 42 * i, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (motif === "grid") {
    ctx.strokeStyle = foil;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.24;
    const step = 64;
    for (let x = 96; x <= w - 96; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.44);
      ctx.lineTo(x, h - 140);
      ctx.stroke();
    }
    for (let y = h * 0.44; y <= h - 140; y += step) {
      ctx.beginPath();
      ctx.moveTo(96, y);
      ctx.lineTo(w - 96, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = foil;
    ctx.fillRect(96, h * 0.44, step * 3, step * 2);
    ctx.fillStyle = secondary;
    ctx.fillRect(96 + step * 3, h * 0.44 + step * 2, step * 3, step * 2);
  } else if (motif === "orbital") {
    ctx.strokeStyle = foil;
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((i * Math.PI) / 7);
      ctx.globalAlpha = 0.25 + (i % 2) * 0.25;
      ctx.beginPath();
      ctx.ellipse(0, 0, 290, 96, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = foil;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  } else if (motif === "waves") {
    ctx.strokeStyle = foil;
    ctx.lineWidth = 2.2;
    for (let row = 0; row < 16; row++) {
      ctx.globalAlpha = 0.18 + (row % 4) * 0.14;
      ctx.beginPath();
      const baseY = h * 0.48 + row * 32;
      for (let x = 88; x <= w - 88; x += 10) {
        const y = baseY + Math.sin(x * 0.015 + row * 0.55) * 18;
        if (x === 88) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (motif === "bars") {
    ctx.fillStyle = foil;
    for (let i = 0; i < 12; i++) {
      ctx.globalAlpha = i % 2 === 0 ? 0.82 : 0.28;
      const barW = 46 + ((i * 37) % 180);
      ctx.fillRect(96, h * 0.46 + i * 44, barW * 2.2, 20);
    }
  } else {
    ctx.strokeStyle = foil;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      ctx.globalAlpha = 0.22 + i * 0.08;
      const inset = 110 + i * 32;
      ctx.beginPath();
      ctx.arc(cx, h - 180, w * 0.5 - inset, Math.PI, 0);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function createBookTextures(item: VaultItem, palette: BookPalette, index: number) {
  // 1. Front Cover + Foil Roughness Map
  const w = 1024;
  const h = 1440;
  const frontCanvas = document.createElement("canvas");
  frontCanvas.width = w;
  frontCanvas.height = h;
  const ctx = frontCanvas.getContext("2d")!;

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext("2d")!;

  // Matte cloth/paper base
  ctx.fillStyle = palette.cover;
  ctx.fillRect(0, 0, w, h);
  rCtx.fillStyle = "#c8c8c8"; // Matte roughness ~0.78
  rCtx.fillRect(0, 0, w, h);

  // Subtle linen grain
  ctx.fillStyle = "rgba(255,255,255,0.022)";
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }

  // Geometric Stripe Press motif
  drawMotif(ctx, palette.motif, w, h, palette.foil, palette.coverSecondary);
  drawMotif(rCtx, palette.motif, w, h, "#222222", "#999999");

  // Framing hairline rule
  ctx.strokeStyle = palette.foil;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.72;
  ctx.strokeRect(56, 56, w - 112, h - 112);
  ctx.globalAlpha = 1;

  rCtx.strokeStyle = "#181818"; // Glossy foil border
  rCtx.lineWidth = 4;
  rCtx.strokeRect(56, 56, w - 112, h - 112);

  const volLabel = String(index + 1).padStart(2, "0");

  // Header metadata
  ctx.fillStyle = palette.foil;
  ctx.font = "600 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(`ADITYA PRESS  ·  VOL. ${volLabel}`, 96, 128);

  // Title
  ctx.fillStyle = palette.ink;
  ctx.font = "600 76px Georgia, 'Times New Roman', serif";
  const titleLines = wrapCanvasText(ctx, item.title, w - 192);
  titleLines.slice(0, 4).forEach((line, i) => {
    ctx.fillText(line, 96, 240 + i * 92);
  });

  // Author & Year footer
  ctx.fillStyle = palette.ink;
  ctx.font = "500 32px Georgia, 'Times New Roman', serif";
  ctx.fillText(item.creator, 96, h - 140);

  ctx.fillStyle = palette.foil;
  ctx.font = "500 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(`${item.genreOrDiscipline.toUpperCase()}  ·  ${item.year}`, 96, h - 98);

  const frontTex = new THREE.CanvasTexture(frontCanvas);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;

  const frontRoughTex = new THREE.CanvasTexture(roughCanvas);
  frontRoughTex.anisotropy = 4;

  // 2. Spine Texture
  const sw = 256;
  const sh = 1440;
  const spineCanvas = document.createElement("canvas");
  spineCanvas.width = sw;
  spineCanvas.height = sh;
  const sCtx = spineCanvas.getContext("2d")!;

  sCtx.fillStyle = palette.coverSecondary;
  sCtx.fillRect(0, 0, sw, sh);

  // Spine raised bands
  sCtx.fillStyle = palette.foil;
  sCtx.fillRect(24, 90, sw - 48, 4);
  sCtx.fillRect(24, sh - 160, sw - 48, 4);

  // Vertical title along spine
  sCtx.save();
  sCtx.translate(sw / 2, sh / 2 - 40);
  sCtx.rotate(-Math.PI / 2);
  sCtx.fillStyle = palette.ink;
  sCtx.font = "600 42px Georgia, 'Times New Roman', serif";
  sCtx.textAlign = "center";
  sCtx.textBaseline = "middle";
  sCtx.fillText(item.title.slice(0, 34), 0, 0);
  sCtx.restore();

  // Author initials / colophon at bottom of spine
  sCtx.fillStyle = palette.foil;
  sCtx.font = "600 24px ui-monospace, SFMono-Regular, Menlo, monospace";
  sCtx.textAlign = "center";
  sCtx.fillText(volLabel, sw / 2, sh - 96);

  const spineTex = new THREE.CanvasTexture(spineCanvas);
  spineTex.colorSpace = THREE.SRGBColorSpace;

  // 3. Back Cover Texture
  const backCanvas = document.createElement("canvas");
  backCanvas.width = w;
  backCanvas.height = h;
  const bCtx = backCanvas.getContext("2d")!;

  bCtx.fillStyle = palette.cover;
  bCtx.fillRect(0, 0, w, h);

  bCtx.strokeStyle = palette.foil;
  bCtx.lineWidth = 2;
  bCtx.globalAlpha = 0.45;
  bCtx.strokeRect(56, 56, w - 112, h - 112);
  bCtx.globalAlpha = 1;

  bCtx.fillStyle = palette.foil;
  bCtx.font = "600 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  bCtx.fillText("CRITICAL NOTES", 104, 150);

  bCtx.fillStyle = palette.ink;
  bCtx.font = "italic 38px Georgia, 'Times New Roman', serif";
  const quoteLines = wrapCanvasText(bCtx, `"${item.whyItMovedMe}"`, w - 208);
  quoteLines.slice(0, 8).forEach((line, i) => {
    bCtx.fillText(line, 104, 240 + i * 58);
  });

  // Highlight block
  bCtx.fillStyle = palette.foil;
  bCtx.fillRect(104, h - 350, 84, 3);
  bCtx.font = "500 26px Georgia, 'Times New Roman', serif";
  bCtx.fillStyle = palette.ink;
  const hlLines = wrapCanvasText(bCtx, item.favoriteHighlight, w - 208);
  hlLines.slice(0, 3).forEach((line, i) => {
    bCtx.fillText(line, 104, h - 290 + i * 40);
  });

  // Colophon / Edition stamp
  bCtx.fillStyle = palette.foil;
  bCtx.font = "500 20px ui-monospace, SFMono-Regular, Menlo, monospace";
  bCtx.fillText(`${item.reviewPublication ?? "ARCHIVE EDITION"}  ·  ${item.year}`, 104, h - 104);

  const backTex = new THREE.CanvasTexture(backCanvas);
  backTex.colorSpace = THREE.SRGBColorSpace;

  return { frontTex, frontRoughTex, spineTex, backTex };
}

function extractRealBookPalette(img: HTMLImageElement) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 32;
  sampleCanvas.height = 32;
  const ctx = sampleCanvas.getContext("2d");
  if (!ctx) {
    return { bg: "#1c1c1c", secondary: "#2c2c2c", ink: "#f5f1e8", accent: "#d4af37" };
  }
  ctx.drawImage(img, 0, 0, 32, 32);
  const data = ctx.getImageData(0, 0, 32, 32).data;

  // Sample border pixels for true wrap-around cover background
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (x < 3 || x > 28 || y < 3 || y > 28) {
        const i = (y * 32 + x) * 4;
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }
    }
  }
  const r = Math.round(rSum / count);
  const g = Math.round(gSum / count);
  const b = Math.round(bSum / count);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const isLight = lum > 145;

  const bg = `rgb(${r}, ${g}, ${b})`;
  const secR = isLight ? Math.max(0, r - 20) : Math.min(255, r + 18);
  const secG = isLight ? Math.max(0, g - 20) : Math.min(255, g + 18);
  const secB = isLight ? Math.max(0, b - 20) : Math.min(255, b + 18);
  const secondary = `rgb(${secR}, ${secG}, ${secB})`;
  const ink = isLight ? "#141414" : "#f5f1e8";
  const accent = isLight ? "#8a2b1d" : "#e5c16c";

  return { bg, secondary, ink, accent };
}

function renderRealSpineAndBack(
  img: HTMLImageElement,
  item: VaultItem,
  index: number
) {
  const { bg, secondary, ink, accent } = extractRealBookPalette(img);
  const volLabel = String(index + 1).padStart(2, "0");

  // ── Spine (256x1440) matched to real book cover ──
  const sw = 256;
  const sh = 1440;
  const spineCanvas = document.createElement("canvas");
  spineCanvas.width = sw;
  spineCanvas.height = sh;
  const sCtx = spineCanvas.getContext("2d")!;

  sCtx.fillStyle = bg;
  sCtx.fillRect(0, 0, sw, sh);

  // Subtle crease shading along spine hinges
  const hingeGrad = sCtx.createLinearGradient(0, 0, sw, 0);
  hingeGrad.addColorStop(0, "rgba(0,0,0,0.18)");
  hingeGrad.addColorStop(0.12, "rgba(0,0,0,0)");
  hingeGrad.addColorStop(0.88, "rgba(0,0,0,0)");
  hingeGrad.addColorStop(1, "rgba(0,0,0,0.18)");
  sCtx.fillStyle = hingeGrad;
  sCtx.fillRect(0, 0, sw, sh);

  // Spine accent bands
  sCtx.fillStyle = accent;
  sCtx.fillRect(24, 90, sw - 48, 4);
  sCtx.fillRect(24, sh - 170, sw - 48, 4);

  // Author surname at top of spine
  const surname = item.creator.split(" ").slice(-1)[0].toUpperCase();
  sCtx.fillStyle = ink;
  sCtx.globalAlpha = 0.72;
  sCtx.font = "600 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  sCtx.textAlign = "center";
  sCtx.fillText(surname.slice(0, 12), sw / 2, 145);
  sCtx.globalAlpha = 1;

  // Vertical book title along spine
  sCtx.save();
  sCtx.translate(sw / 2, sh / 2 - 20);
  sCtx.rotate(-Math.PI / 2);
  sCtx.fillStyle = ink;
  sCtx.font = "600 40px Georgia, 'Times New Roman', serif";
  sCtx.textAlign = "center";
  sCtx.textBaseline = "middle";
  sCtx.fillText(item.title.slice(0, 32), 0, 0);
  sCtx.restore();

  // Volume & Year at bottom of spine
  sCtx.fillStyle = accent;
  sCtx.font = "600 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  sCtx.textAlign = "center";
  sCtx.fillText(volLabel, sw / 2, sh - 116);
  sCtx.fillStyle = ink;
  sCtx.globalAlpha = 0.65;
  sCtx.font = "500 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  sCtx.fillText(item.year, sw / 2, sh - 82);
  sCtx.globalAlpha = 1;

  const spineTex = new THREE.CanvasTexture(spineCanvas);
  spineTex.colorSpace = THREE.SRGBColorSpace;
  spineTex.anisotropy = 4;

  // ── Back Cover (1024x1440) matched to real book cover ──
  const w = 1024;
  const h = 1440;
  const backCanvas = document.createElement("canvas");
  backCanvas.width = w;
  backCanvas.height = h;
  const bCtx = backCanvas.getContext("2d")!;

  bCtx.fillStyle = bg;
  bCtx.fillRect(0, 0, w, h);

  // Subtle editorial border
  bCtx.strokeStyle = ink;
  bCtx.lineWidth = 2;
  bCtx.globalAlpha = 0.2;
  bCtx.strokeRect(56, 56, w - 112, h - 112);
  bCtx.globalAlpha = 1;

  // Header & Framed Front-Cover Miniature Preview
  bCtx.fillStyle = accent;
  bCtx.font = "600 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  bCtx.fillText(`${item.genreOrDiscipline.toUpperCase()}  ·  ${item.year}`, 104, 136);

  bCtx.fillStyle = ink;
  bCtx.font = "600 44px Georgia, 'Times New Roman', serif";
  const bTitle = wrapCanvasText(bCtx, item.title, 560);
  bTitle.slice(0, 2).forEach((line, i) => {
    bCtx.fillText(line, 104, 200 + i * 54);
  });

  // Miniature framed real cover on top-right of back cover
  const thumbW = 165;
  const thumbH = 236;
  const thumbX = w - 104 - thumbW;
  const thumbY = 108;
  bCtx.fillStyle = secondary;
  bCtx.fillRect(thumbX - 6, thumbY - 6, thumbW + 12, thumbH + 12);
  bCtx.drawImage(img, thumbX, thumbY, thumbW, thumbH);

  // Editorial review blurb
  bCtx.fillStyle = ink;
  bCtx.font = "italic 36px Georgia, 'Times New Roman', serif";
  const quoteLines = wrapCanvasText(bCtx, `"${item.whyItMovedMe}"`, w - 208);
  quoteLines.slice(0, 8).forEach((line, i) => {
    bCtx.fillText(line, 104, 430 + i * 56);
  });

  // Highlight quote
  bCtx.fillStyle = accent;
  bCtx.fillRect(104, h - 380, 96, 4);
  bCtx.fillStyle = ink;
  bCtx.font = "500 26px Georgia, 'Times New Roman', serif";
  const hlLines = wrapCanvasText(bCtx, item.favoriteHighlight, w - 208);
  hlLines.slice(0, 3).forEach((line, i) => {
    bCtx.fillText(line, 104, h - 320 + i * 40);
  });

  // Publisher & Author footer
  bCtx.fillStyle = ink;
  bCtx.globalAlpha = 0.72;
  bCtx.font = "600 20px ui-monospace, SFMono-Regular, Menlo, monospace";
  bCtx.fillText(
    `${item.creator.toUpperCase()}  ·  ${(item.reviewPublication ?? "ARCHIVE EDITION").toUpperCase()}`,
    104,
    h - 108
  );
  bCtx.globalAlpha = 1;

  // Authentic ISBN-style Barcode block (bottom-right)
  const bcX = w - 310;
  const bcY = h - 188;
  const bcW = 206;
  const bcH = 92;
  bCtx.fillStyle = "#ffffff";
  bCtx.fillRect(bcX, bcY, bcW, bcH);
  bCtx.fillStyle = "#111111";
  for (let bx = 14; bx < bcW - 14; bx += 4) {
    const barW = ((bx * (index + 3)) % 3) + 1;
    bCtx.fillRect(bcX + bx, bcY + 10, barW, bcH - 28);
  }
  bCtx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  bCtx.fillText(`ISBN 978-0-${100 + index}-48291`, bcX + 14, bcY + bcH - 6);

  const backTex = new THREE.CanvasTexture(backCanvas);
  backTex.colorSpace = THREE.SRGBColorSpace;
  backTex.anisotropy = 4;

  return { spineTex, backTex, bg };
}

function createPagesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f2ecde";
  ctx.fillRect(0, 0, 256, 512);

  for (let x = 0; x < 256; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? "rgba(120, 100, 75, 0.14)" : "rgba(255, 255, 255, 0.25)";
    ctx.fillRect(x, 0, 1, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface BookEntry {
  group: THREE.Group;
  spinGroup: THREE.Group;
  index: number;
  spinX: number;
  spinY: number;
  hoverTiltX: number;
  hoverTiltY: number;
  disposables: { geometries: THREE.BufferGeometry[]; materials: THREE.Material[]; textures: THREE.Texture[] };
}

function buildBookMesh(
  item: VaultItem,
  palette: BookPalette,
  index: number,
  pagesTex: THREE.CanvasTexture,
  texLoader: THREE.TextureLoader
): BookEntry {
  const group = new THREE.Group();
  const spinGroup = new THREE.Group();
  group.add(spinGroup);

  const { width, height, thickness, boardThickness, overhang } = BOOK_DIMS;
  const { frontTex, frontRoughTex, spineTex, backTex } = createBookTextures(item, palette, index);
  const extraTextures: THREE.Texture[] = [];

  const innerW = width - overhang * 2;
  const innerH = height - overhang * 2;
  const innerD = thickness - boardThickness * 2;

  const frontBoardGeo = new THREE.BoxGeometry(width, height, boardThickness);
  const backBoardGeo = new THREE.BoxGeometry(width, height, boardThickness);
  const spineGeo = new THREE.BoxGeometry(boardThickness * 1.15, height, thickness);
  const pagesGeo = new THREE.BoxGeometry(innerW, innerH, innerD);

  const coverEdgeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.coverSecondary),
    roughness: 0.72,
    metalness: 0.08,
  });

  const frontFaceMat = new THREE.MeshPhysicalMaterial({
    map: frontTex,
    roughnessMap: frontRoughTex,
    roughness: 0.85,
    metalness: 0.22,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
  });

  const backFaceMat = new THREE.MeshStandardMaterial({
    map: backTex,
    roughness: 0.78,
    metalness: 0.1,
  });

  const spineFaceMat = new THREE.MeshStandardMaterial({
    map: spineTex,
    roughness: 0.72,
    metalness: 0.15,
  });

  if (item.image) {
    const realCoverTex = texLoader.load(item.image, (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      frontFaceMat.map = loaded;
      frontFaceMat.roughnessMap = null;
      frontFaceMat.roughness = 0.42;
      frontFaceMat.metalness = 0.04;
      frontFaceMat.clearcoat = 0.35;
      frontFaceMat.clearcoatRoughness = 0.22;
      frontFaceMat.needsUpdate = true;

      const imgEl = loaded.image as HTMLImageElement | undefined;
      if (imgEl && imgEl.width > 0) {
        const { spineTex: realSpineTex, backTex: realBackTex, bg } =
          renderRealSpineAndBack(imgEl, item, index);
        spineFaceMat.map = realSpineTex;
        spineFaceMat.roughness = 0.55;
        spineFaceMat.metalness = 0.05;
        spineFaceMat.needsUpdate = true;

        backFaceMat.map = realBackTex;
        backFaceMat.roughness = 0.55;
        backFaceMat.metalness = 0.05;
        backFaceMat.needsUpdate = true;

        coverEdgeMat.color.set(bg);
        extraTextures.push(realSpineTex, realBackTex);
      }
    });
    extraTextures.push(realCoverTex);
  }

  const pagesMat = new THREE.MeshStandardMaterial({
    map: pagesTex,
    roughness: 0.92,
    metalness: 0.0,
  });

  const frontBoard = new THREE.Mesh(frontBoardGeo, [
    coverEdgeMat,
    coverEdgeMat,
    coverEdgeMat,
    coverEdgeMat,
    frontFaceMat,
    coverEdgeMat,
  ]);
  frontBoard.position.z = thickness * 0.5 - boardThickness * 0.5;
  frontBoard.castShadow = true;
  frontBoard.receiveShadow = true;
  spinGroup.add(frontBoard);

  const backBoard = new THREE.Mesh(backBoardGeo, [
    coverEdgeMat,
    coverEdgeMat,
    coverEdgeMat,
    coverEdgeMat,
    coverEdgeMat,
    backFaceMat,
  ]);
  backBoard.position.z = -(thickness * 0.5 - boardThickness * 0.5);
  backBoard.castShadow = true;
  backBoard.receiveShadow = true;
  spinGroup.add(backBoard);

  const spineMesh = new THREE.Mesh(spineGeo, [
    coverEdgeMat,
    spineFaceMat,
    coverEdgeMat,
    coverEdgeMat,
    coverEdgeMat,
    coverEdgeMat,
  ]);
  spineMesh.position.x = -width * 0.5 + boardThickness * 0.45;
  spineMesh.castShadow = true;
  spineMesh.receiveShadow = true;
  spinGroup.add(spineMesh);

  const pagesMesh = new THREE.Mesh(pagesGeo, pagesMat);
  pagesMesh.position.x = overhang * 0.5;
  pagesMesh.castShadow = true;
  pagesMesh.receiveShadow = true;
  spinGroup.add(pagesMesh);

  spinGroup.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.userData = { bookIndex: index };
    }
  });

  return {
    group,
    spinGroup,
    index,
    spinX: 0,
    spinY: 0,
    hoverTiltX: 0,
    hoverTiltY: 0,
    disposables: {
      geometries: [frontBoardGeo, backBoardGeo, spineGeo, pagesGeo],
      materials: [coverEdgeMat, frontFaceMat, backFaceMat, spineFaceMat, pagesMat],
      textures: [frontTex, frontRoughTex, spineTex, backTex, ...extraTextures],
    },
  };
}

export default function StripePressBooks({
  selectedCategory,
  onSelectCategory,
}: StripePressBooksProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const books = useMemo(
    () => VAULT_ITEMS.filter((item) => item.category === "books"),
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const liveRef = useRef({ activeIndex });
  useEffect(() => {
    liveRef.current = { activeIndex };
  }, [activeIndex]);

  const activeBook = books[activeIndex] ?? books[0];
  const activePalette = BOOK_PALETTES[activeIndex % BOOK_PALETTES.length];

  const categories: { key: VaultCategory; label: string }[] = [
    { key: "cinema", label: "Cinema" },
    { key: "music", label: "Music" },
    { key: "books", label: "Books" },
    { key: "art", label: "Art" },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container || books.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0.12, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // Studio Lighting (Stripe Press specular foil glints)
    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff8ed, 2.2);
    keyLight.position.set(3.5, 4.5, 5.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(512, 512);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd9e8ff, 1.15);
    rimLight.position.set(-4.0, 2.2, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffe8cc, 0.65);
    fillLight.position.set(0, -3.0, 3.0);
    scene.add(fillLight);

    const pagesTex = createPagesTexture();
    const texLoader = new THREE.TextureLoader();
    const spineStep = 0.265;
    const shelfCenterX = -0.78;
    const entries: BookEntry[] = books.map((book, idx) => {
      const palette = BOOK_PALETTES[idx % BOOK_PALETTES.length];
      const entry = buildBookMesh(book, palette, idx, pagesTex, texLoader);
      const shelfX = (idx - (books.length - 1) / 2) * spineStep + shelfCenterX;
      entry.group.position.set(shelfX, 0, -1.35);
      entry.group.rotation.y = Math.PI * 0.5;
      scene.add(entry.group);
      return entry;
    });

    // Physical Bookshelf Ledge beneath the stacked spines
    const shelfWidth = books.length * spineStep + 0.8;
    const shelfGeo = new THREE.BoxGeometry(shelfWidth, 0.085, 1.95);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x181412),
      roughness: 0.78,
      metalness: 0.08,
    });
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.position.set(shelfCenterX, -BOOK_DIMS.height * 0.5 - 0.045, -1.35);
    shelfMesh.receiveShadow = true;
    scene.add(shelfMesh);

    const raycaster = new THREE.Raycaster();
    const pointerVec = new THREE.Vector2();
    let hoveredBookIdx: number | null = null;

    // Pointer / Drag / Parallel Scroll Controls
    let pointerDown = false;
    let pointerMoved = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let mouseNX = 0;
    let mouseNY = 0;
    let scrollAccum = 0;
    let lastNavAt = 0;

    const getHitBookIndex = (clientX: number, clientY: number): number | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerVec.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointerVec, camera);
      const hits = raycaster.intersectObjects(
        entries.map((e) => e.spinGroup),
        true
      );
      if (hits.length > 0) {
        const idx = hits[0].object.userData?.bookIndex;
        if (typeof idx === "number") return idx;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDown = true;
      pointerMoved = false;
      downX = e.clientX;
      downY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      setIsDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (!pointerDown) {
        hoveredBookIdx = getHitBookIndex(e.clientX, e.clientY);
        return;
      }
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
        pointerMoved = true;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const active = entries[liveRef.current.activeIndex];
      if (active) {
        active.spinY += dx * 0.011;
        active.spinX = THREE.MathUtils.clamp(active.spinX + dy * 0.008, -0.55, 0.55);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerDown && !pointerMoved) {
        const hitIdx = getHitBookIndex(e.clientX, e.clientY);
        if (hitIdx !== null && hitIdx !== liveRef.current.activeIndex) {
          setActiveIndex(hitIdx);
        }
      }
      pointerDown = false;
      setIsDragging(false);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      scrollAccum += e.deltaY + e.deltaX;
      if (Math.abs(scrollAccum) > 75 && now - lastNavAt > 360) {
        const dir = scrollAccum > 0 ? 1 : -1;
        scrollAccum = 0;
        lastNavAt = now;
        setActiveIndex((prev) => Math.max(0, Math.min(books.length - 1, prev + dir)));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setActiveIndex((prev) => Math.min(books.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    // 60 FPS Animation Loop (performance.now delta)
    let animId = 0;
    const startTime = performance.now();
    let prevTime = startTime;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;
      const elapsed = (now - startTime) / 1000;

      const currentIdx = liveRef.current.activeIndex;
      const angleTargetY = -0.32;

      entries.forEach((entry) => {
        const isActive = entry.index === currentIdx;
        const isHoveredOnShelf = !isActive && hoveredBookIdx === entry.index;

        // Stacked spine-out bookshelf slot vs pulled-out hero showcase slot
        const shelfX = (entry.index - (books.length - 1) / 2) * spineStep + shelfCenterX;
        const heightVar = 0.94 + (entry.index % 3) * 0.035;

        const targetX = isActive ? 1.05 : shelfX;
        const targetZ = isActive ? 1.15 : isHoveredOnShelf ? -0.98 : -1.35;
        const targetY = isActive
          ? 0.05 + Math.sin(elapsed * 1.4) * 0.03
          : -((1 - heightVar) * BOOK_DIMS.height * 0.5);

        entry.group.position.x = THREE.MathUtils.damp(entry.group.position.x, targetX, 7, dt);
        entry.group.position.z = THREE.MathUtils.damp(entry.group.position.z, targetZ, 7, dt);
        entry.group.position.y = THREE.MathUtils.damp(entry.group.position.y, targetY, 7, dt);

        const targetScale = isActive ? 1.04 : 0.96;
        const targetScaleY = isActive ? 1.04 : heightVar;
        entry.group.scale.x = THREE.MathUtils.damp(entry.group.scale.x, targetScale, 7, dt);
        entry.group.scale.y = THREE.MathUtils.damp(entry.group.scale.y, targetScaleY, 7, dt);
        entry.group.scale.z = entry.group.scale.x;

        // On the bookshelf: rotated Math.PI / 2 so spines face the viewer side-by-side
        const baseGroupY = isActive ? angleTargetY : Math.PI * 0.5;
        const baseGroupX = isActive ? 0.08 : 0;

        entry.group.rotation.y = THREE.MathUtils.damp(entry.group.rotation.y, baseGroupY, 6, dt);
        entry.group.rotation.x = THREE.MathUtils.damp(entry.group.rotation.x, baseGroupX, 6, dt);

        if (!pointerDown && isActive) {
          entry.spinY *= Math.exp(-5.0 * dt);
          entry.spinX *= Math.exp(-5.0 * dt);
        }

        const tiltX = isActive ? -mouseNY * 0.14 : 0;
        const tiltY = isActive ? mouseNX * 0.18 : 0;
        entry.hoverTiltX = THREE.MathUtils.damp(entry.hoverTiltX, tiltX, 6, dt);
        entry.hoverTiltY = THREE.MathUtils.damp(entry.hoverTiltY, tiltY, 6, dt);

        entry.spinGroup.rotation.y = entry.spinY + entry.hoverTiltY;
        entry.spinGroup.rotation.x = entry.spinX + entry.hoverTiltX;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      entries.forEach((entry) => {
        entry.disposables.geometries.forEach((g) => g.dispose());
        entry.disposables.materials.forEach((m) => m.dispose());
        entry.disposables.textures.forEach((t) => t.dispose());
      });
      shelfGeo.dispose();
      shelfMat.dispose();
      pagesTex.dispose();
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, [books]);

  const countLabel = `${String(activeIndex + 1).padStart(2, "0")} / ${String(books.length).padStart(2, "0")}`;

  return (
    <main
      className="relative w-screen h-screen overflow-hidden select-none transition-colors duration-700"
      style={{ backgroundColor: activePalette.uiBg, color: activePalette.uiText }}
    >
      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 pt-6 pb-3">
        <Link
          href="/"
          className="font-mono text-[11px] tracking-[0.22em] uppercase opacity-75 hover:opacity-100 transition-opacity"
        >
          ← About / The Vault
        </Link>

        {/* Category Pill Bar */}
        <nav className="flex items-center gap-1 rounded-full border border-current/15 bg-black/15 backdrop-blur-md p-1">
          {categories.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-full font-mono text-[10px] tracking-[0.18em] uppercase transition-all cursor-pointer ${
                  active
                    ? "bg-white text-black shadow-sm"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block font-mono text-[11px] tracking-[0.2em] uppercase opacity-65">
          Press Edition · {countLabel}
        </div>
      </header>

      {/* Main Stripe Press Editorial Spread */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-140px)] items-center px-6 md:px-12 gap-6">
        {/* Left: 3D Book WebGL Stage */}
        <div className="relative lg:col-span-7 h-[46vh] lg:h-full w-full">
          <div
            ref={mountRef}
            className={`w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          />
        </div>

        {/* Right: Editorial Details */}
        <section className="lg:col-span-5 flex flex-col justify-center max-w-xl space-y-5 pb-6 lg:pb-0">
          <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: activePalette.uiMuted }}>
            <span>VOL. {countLabel}</span>
            <span>·</span>
            <span>{activeBook.genreOrDiscipline}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.08] tracking-tight">
            {activeBook.title}
          </h1>

          <p className="font-mono text-xs tracking-[0.16em] uppercase" style={{ color: activePalette.uiMuted }}>
            By {activeBook.creator} — {activeBook.year}
          </p>

          <p className="text-sm sm:text-base leading-relaxed opacity-90">
            {activeBook.whyItMovedMe}
          </p>

          <blockquote className="border-l-2 border-current/40 pl-4 py-1 text-xs sm:text-sm italic opacity-85">
            &ldquo;{activeBook.favoriteHighlight}&rdquo;
          </blockquote>

          <div className="flex flex-wrap items-center gap-5 pt-2">
            {activeBook.externalLink && (
              <a
                href={activeBook.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-current/30 px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase hover:bg-white hover:text-black transition-colors"
              >
                {activeBook.externalLabel ?? "Explore"} ↗
              </a>
            )}

            <div className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: activePalette.uiMuted }}>
              {"★".repeat(activeBook.reviewStars ?? 5)} · {activeBook.reviewPublication}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Shelf Navigation */}
      <footer className="relative z-20 flex items-center justify-between px-6 md:px-12 pb-6 pt-2">
        <p
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: activePalette.uiMuted }}
        >
          Click any spine · Drag book to rotate · Scroll to browse
        </p>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeIndex === 0}
            className="w-8 h-8 rounded-full border border-current/25 flex items-center justify-center text-sm disabled:opacity-30 hover:bg-white hover:text-black transition-colors cursor-pointer"
            aria-label="Previous book"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => Math.min(books.length - 1, prev + 1))}
            disabled={activeIndex === books.length - 1}
            className="w-8 h-8 rounded-full border border-current/25 flex items-center justify-center text-sm disabled:opacity-30 hover:bg-white hover:text-black transition-colors cursor-pointer"
            aria-label="Next book"
          >
            →
          </button>
        </div>
      </footer>
    </main>
  );
}
