'use client';

/**
 * VinylCrate: Audiophile 3D Record Crate & Interactive Turntable
 * susanoo.ui — Enhanced for AdityaWorks Vault
 */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, animate, motionValue, frame, cancelFrame } from 'framer-motion';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function useMedia(query) {
  const [on, setOn] = useState(false);
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return on;
}

/* ------------------------------------------------------------------------ */
/* Strings                                                                   */
/* ------------------------------------------------------------------------ */

export const LABELS = {
  region: 'Records',
  instructions: 'Use the arrow keys to flip through the records and Enter to take one out.',
  position: (n, total, title) => `${n} of ${total}: ${title}`,
  previous: 'Previous record',
  next: 'Next record',
  open: 'Pull Record',
  close: 'Put back in crate',
  cta: 'Listen on Spotify',
  busy: 'Opening…',
  error: 'That didn’t work. Try again.',
  hint: 'Scroll, drag sleeves, or click tabs below · Click front record to pull out & spin',
  hintTouch: 'Swipe to flip, tap front sleeve to pull out & spin',
  sideA: 'Side A · 180g LP',
  speed: '33⅓',
};

/* ------------------------------------------------------------------------ */
/* Web Audio API: Analog Turntable Crackle, Chord Synth & Sleeve Rustle      */
/* ------------------------------------------------------------------------ */

class TurntableAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.oscillators = [];
    this.crackleNode = null;
    this.filterNode = null;
    this.baseFreqs = [130.81, 196.0, 246.94, 293.66];
    this.pitchFactor = 1.0;
  }

  init() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /* Subtle cardboard sleeve flip sound */
  playFlipSound() {
    const ctx = this.init();
    if (!ctx) return;
    try {
      const dur = 0.085;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const env = Math.sin((i / data.length) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.16;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1150;
      filter.Q.value = 1.4;

      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch {
      /* ignore audio restriction errors */
    }
  }

  startNeedle(chordFreqs, rpm = 33) {
    const ctx = this.init();
    if (!ctx) return;
    this.stopNeedle(true);

    try {
      this.isPlaying = true;
      this.baseFreqs = chordFreqs?.length ? chordFreqs : [130.81, 196.0, 246.94, 293.66];
      this.pitchFactor = rpm === 45 ? 1.35 : 1.0;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.45);
      master.connect(ctx.destination);
      this.masterGain = master;

      // Warm analog lowpass filter
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(680, ctx.currentTime);
      lpf.Q.value = 1.2;
      lpf.connect(master);
      this.filterNode = lpf;

      // Analog polysynth voices with gentle detune
      this.oscillators = this.baseFreqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        const vGain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq * this.pitchFactor, ctx.currentTime);
        osc.detune.setValueAtTime((idx - 1.5) * 7, ctx.currentTime);
        vGain.gain.value = 0.14 / this.baseFreqs.length;
        osc.connect(vGain);
        vGain.connect(lpf);
        osc.start();
        return { osc, baseFreq: freq };
      });

      // Looping vinyl surface crackle & dust pops buffer
      const crackleDur = 2.5;
      const cBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * crackleDur), ctx.sampleRate);
      const cData = cBuf.getChannelData(0);
      for (let i = 0; i < cData.length; i++) {
        const r = Math.random();
        // Occasional vinyl dust pop + subtle warm surface hiss
        cData[i] = r > 0.9985 ? (Math.random() * 2 - 1) * 0.65 : (Math.random() * 2 - 1) * 0.025;
      }
      const cSrc = ctx.createBufferSource();
      cSrc.buffer = cBuf;
      cSrc.loop = true;

      const cFilter = ctx.createBiquadFilter();
      cFilter.type = 'bandpass';
      cFilter.frequency.value = 2400;
      cFilter.Q.value = 0.9;

      const cGain = ctx.createGain();
      cGain.gain.value = 0.35;

      cSrc.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(master);
      cSrc.start();
      this.crackleNode = cSrc;
    } catch {
      this.isPlaying = false;
    }
  }

  setPitchMultiplier(mult) {
    if (!this.isPlaying || !this.ctx) return;
    const clamped = Math.max(0.25, Math.min(2.4, Math.abs(mult) || 1));
    const now = this.ctx.currentTime;
    this.oscillators.forEach(({ osc, baseFreq }) => {
      try {
        osc.frequency.setTargetAtTime(baseFreq * clamped, now, 0.04);
      } catch {
        /* ignore */
      }
    });
  }

  stopNeedle(immediate = false) {
    this.isPlaying = false;
    if (!this.ctx) return;
    try {
      const oscs = this.oscillators;
      const crackle = this.crackleNode;
      const master = this.masterGain;
      this.oscillators = [];
      this.crackleNode = null;
      this.masterGain = null;

      const stopAll = () => {
        oscs.forEach(({ osc }) => { try { osc.stop(); osc.disconnect(); } catch {} });
        if (crackle) { try { crackle.stop(); crackle.disconnect(); } catch {} }
        if (master) { try { master.disconnect(); } catch {} }
      };

      if (immediate || !master) {
        stopAll();
      } else {
        master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.06);
        setTimeout(stopAll, 180);
      }
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------------------------------------------------ */
/* The crate, in 3D                                                          */
/* ------------------------------------------------------------------------ */

const S = 300;            // sleeve size in crate units
const LIP = 62;           // front wall height
const BASE = 14;          // bottom board
const T = 14;             // wall thickness
const GAP_SIDE = 12;      // room either side of the sleeves
const WI = S + GAP_SIDE * 2;
const BACK_H = 186;       // side walls rise to this at the back
const Z0 = 22;            // front sleeve distance behind front wall
const LEAN = 7;           // standing sleeves lean back, degrees
const TIP0 = 76;          // top of the flipped pile, degrees forward
const TIP_STEP = 2.4;     // each sleeve under it lies a little flatter
const ELEV = 24;          // base camera elevation, degrees
const YAW = 15;           // base camera yaw, degrees
const PERSP = 1500;
const HIDE = LIP - 16;
const RISE = LIP + 44;
const MIN_W = 440;
const STAGE_H = 510;
const DRAG = 175;

const RAD = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function camera(Wd, yaw = YAW, elev = ELEV) {
  const cx = Wd / 2 + 8;
  const cy = 328;
  const ox = Wd / 2;
  const oy = cy - 130;
  const pre = `translate(${ox}px,${oy}px) perspective(${PERSP}px) translate(${-ox}px,${-oy}px) `
    + `translate3d(${cx}px,${cy}px,0) rotateX(${-elev}deg) rotateY(${yaw}deg)`;
  return { cx, cy, ox, oy, pre, yaw, elev };
}

function turn([x, y, z], yaw, pitch) {
  const cy = Math.cos(yaw * RAD); const sy = Math.sin(yaw * RAD);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch * RAD); const sp = Math.sin(pitch * RAD);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}
const toStage = (v) => turn(v, YAW, -ELEV);
function toWorld([x, y, z]) {
  const cp = Math.cos(ELEV * RAD); const sp = Math.sin(ELEV * RAD);
  const y1 = y * cp - z * sp;
  const z1 = y * sp + z * cp;
  const cy = Math.cos(-YAW * RAD); const sy = Math.sin(-YAW * RAD);
  return [x * cy + z1 * sy, y1, -x * sy + z1 * cy];
}

function project(cam, v) {
  const [X, Y, Z] = toStage(v);
  const m = PERSP / (PERSP - Z);
  return [cam.ox + (cam.cx + X - cam.ox) * m, cam.oy + (cam.cy + Y - cam.oy) * m];
}

function crateDepth(count) {
  const gap = count > 1 ? Math.min(16, 155 / (count - 1)) : 16;
  return { gap, D: Z0 + gap * Math.max(0, count - 1) + 32 };
}

function cratePlanes(D) {
  const slope = Math.atan2(D, BACK_H - LIP) / RAD;
  const len = Math.hypot(D, BACK_H - LIP);
  const OW = WI + T * 2;
  return {
    back: [
      ['vc-p-back', -WI / 2, LIP - BACK_H, -D, '', WI, BACK_H],
      ['vc-p-rim vc-p-rim-back', -OW / 2, LIP - BACK_H, -D - T, 'rotateX(90deg)', OW, T],
      ['vc-p-floor', -WI / 2, LIP, -D, 'rotateX(90deg)', WI, D],
      ['vc-p-side vc-p-right', WI / 2, LIP - BACK_H, -D, 'rotateY(-90deg)', D, BACK_H],
      ['vc-p-rim vc-p-rim-side', WI / 2, LIP - BACK_H, -D, `rotateX(${slope}deg)`, T, len],
    ],
    front: [
      ['vc-p-side vc-p-left', -OW / 2, LIP - BACK_H, -D, 'rotateY(-90deg)', D, BACK_H + BASE],
      ['vc-p-rim vc-p-rim-side', -OW / 2, LIP - BACK_H, -D, `rotateX(${slope}deg)`, T, len],
      ['vc-p-rim vc-p-rim-front', -OW / 2, 0, 0, 'rotateX(90deg)', OW, T],
      ['vc-p-front', -OW / 2, 0, T, '', OW, LIP + BASE],
    ],
    sideClip: `polygon(0 0, ${D}px ${BACK_H - LIP}px, ${D}px 100%, 0 100%)`,
  };
}

/* ------------------------------------------------------------------------ */
/* Bespoke Audiophile Sleeve Art & Hype Stickers                             */
/* ------------------------------------------------------------------------ */

const SLEEVE_PALETTES = [
  { bg: '#12151c', fg: '#e8edf5', accent: '#3b82f6' }, // Social Network
  { bg: '#141210', fg: '#f5ebd6', accent: '#d4af37' }, // Random Access Memories
  { bg: '#1b110c', fg: '#fdf0e6', accent: '#ea580c' }, // Oppenheimer
  { bg: '#f3efe6', fg: '#16261c', accent: '#16a34a' }, // Blonde
  { bg: '#111114', fg: '#fef08a', accent: '#f97316' }, // In Rainbows
  { bg: '#eceae4', fg: '#141417', accent: '#2563eb' }, // Aphex Twin
  { bg: '#0c1220', fg: '#e0f2fe', accent: '#06b6d4' }, // Blade Runner
  { bg: '#161314', fg: '#f5f5f4', accent: '#dc2626' }, // Mezzanine
  { bg: '#f4f0e8', fg: '#1c1917', accent: '#d97706' }, // Steve Reich
  { bg: '#141619', fg: '#d6d3d1', accent: '#a855f7' }, // Burial Untrue
];

function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function seeded(seed) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stackWords(text) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words;
  if (words.length <= 3) return words;
  const lines = [];
  const target = text.length / 3;
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > target * 1.25 && lines.length < 2) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  lines.push(line);
  return lines;
}

function TitleBlock({ title, subtitle, no, fg, accent }) {
  const t = title.toUpperCase();
  const fs = Math.min(5.8, 56 / Math.max(6, t.length * 0.64));
  return (
    <g>
      <text className="vc-a-t" fill={fg} x="7" y="10.5" fontSize={fs}>{t}</text>
      {subtitle && (
        <text className="vc-a-m" fill={accent} x="7" y="15.2" fontSize="3.1">{subtitle.toUpperCase()}</text>
      )}
      <text className="vc-a-m" fill={fg} opacity="0.7" x="93" y="10.5" fontSize="3.1" textAnchor="end">{no}</text>
    </g>
  );
}

/* Collector's Hype Sticker on the front shrink-wrap */
function HypeSticker({ item, accent }) {
  const pub = (item.reviewPublication || 'AUDIOPHILE EDITION').toUpperCase();
  return (
    <g transform="translate(65, 72) rotate(-4)">
      <rect x="0" y="0" width="29" height="19" rx="2.2" fill={accent} opacity="0.95" />
      <rect x="1" y="1" width="27" height="17" rx="1.6" fill="none" stroke="#ffffff" strokeWidth="0.35" opacity="0.6" />
      <text className="vc-a-m" x="14.5" y="5.5" fontSize="2.3" fill="#ffffff" textAnchor="middle">180G HEAVYWEIGHT LP</text>
      <text className="vc-a-t" x="14.5" y="10.8" fontSize="3.1" fill="#ffffff" textAnchor="middle">★★★★★</text>
      <text className="vc-a-m" x="14.5" y="15.5" fontSize="2.1" fill="#ffffff" opacity="0.9" textAnchor="middle">
        {pub.slice(0, 14)}
      </text>
    </g>
  );
}

const ART = [
  function TypeArt({ title, subtitle, no, fg, accent }) {
    const lines = stackWords(title).slice(0, 3);
    let y = 14;
    const rows = lines.map((l) => {
      const fs = Math.min(34, 86 / Math.max(1, l.length * 0.62));
      y += fs * 0.75;
      const row = { l, fs, y };
      y += fs * 0.14;
      return row;
    });
    return (
      <g>
        <rect fill={accent} x="7" y="7" width="86" height="2.2" />
        {rows.map((r, idx) => (
          <text key={r.y} className="vc-a-t" fill={idx === rows.length - 1 ? accent : fg} x="7" y={r.y} fontSize={r.fs}
                textLength="86" lengthAdjust="spacingAndGlyphs">{r.l}</text>
        ))}
        <rect fill={fg} opacity="0.25" x="7" y="84" width="86" height="0.5" />
        <text className="vc-a-m" fill={fg} x="7" y="90.5" fontSize="3.2">{(subtitle || no).toUpperCase()}</text>
        <circle fill={accent} cx="90.5" cy="89.5" r="2.6" />
      </g>
    );
  },

  function RingsArt({ title, subtitle, no, r, fg, bg, accent }) {
    const cx = 54 + r() * 18;
    const cy = 60 + r() * 14;
    const rings = [];
    for (let k = 0, rad = 4; rad < 105; k++, rad += 5.4) {
      rings.push(
        <circle
          key={k}
          fill="none"
          stroke={k % 4 === 0 ? accent : fg}
          opacity={k % 4 === 0 ? '0.9' : '0.45'}
          cx={cx}
          cy={cy}
          r={rad}
          strokeWidth={k % 3 === 0 ? 2.4 : 1.0}
        />
      );
    }
    return (
      <g>
        {rings}
        <circle fill={accent} cx={cx} cy={cy} r="5.5" />
        <rect fill={bg} x="0" y="0" width="100" height="19" />
        <TitleBlock title={title} subtitle={subtitle} no={no} fg={fg} accent={accent} />
      </g>
    );
  },

  function HorizonArt({ title, subtitle, no, r, fg, bg, accent }) {
    const sx = 34 + r() * 32;
    const lines = [];
    for (let k = 0; k < 15; k++) {
      const y = 58 + Math.pow(k / 14, 1.6) * 42;
      lines.push(<rect key={k} fill={k % 3 === 0 ? accent : fg} x="0" y={y} width="100" height={0.5 + k * 0.16} />);
    }
    return (
      <g>
        <circle fill={accent} cx={sx} cy="56" r={23 + r() * 5} />
        <rect fill={bg} x="0" y="58" width="100" height="42" />
        {lines}
        <rect fill={bg} x="0" y="0" width="100" height="19" />
        <TitleBlock title={title} subtitle={subtitle} no={no} fg={fg} accent={accent} />
      </g>
    );
  },

  function SunArt({ title, subtitle, no, r, fg, bg, accent }) {
    const ox = 50 + (r() - 0.5) * 26;
    const oy = 102;
    const rays = [];
    const n = 22;
    for (let k = 0; k < n; k += 2) {
      const a0 = Math.PI + (k / n) * Math.PI;
      const a1 = Math.PI + ((k + 1) / n) * Math.PI;
      rays.push(
        <path key={k} fill={k % 4 === 0 ? accent : fg} opacity={k % 4 === 0 ? '0.85' : '0.35'}
              d={`M ${ox} ${oy} L ${ox + Math.cos(a0) * 160} ${oy + Math.sin(a0) * 160} L ${ox + Math.cos(a1) * 160} ${oy + Math.sin(a1) * 160} Z`} />,
      );
    }
    return (
      <g>
        {rays}
        <circle fill={bg} cx={ox} cy={oy} r="30" />
        <circle fill={accent} cx={ox} cy={oy} r="22" />
        <rect fill={bg} x="0" y="0" width="100" height="19" />
        <TitleBlock title={title} subtitle={subtitle} no={no} fg={fg} accent={accent} />
      </g>
    );
  },

  function BlocksArt({ title, subtitle, no, fg, accent }) {
    const cells = [];
    const size = 27.5;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const x = 7 + i * (size + 1.5);
        const y = 21 + j * (size + 1.5);
        const kind = (i * 3 + j) % 5;
        const color = (i + j) % 2 === 0 ? accent : fg;
        const op = (i + j) % 2 === 0 ? 0.9 : 0.65;
        const rot = ((i * 2 + j) % 4) * 90;
        const key = `${i}-${j}`;
        const c = [x + size / 2, y + size / 2];
        if (kind === 0) cells.push(<circle key={key} fill={color} opacity={op} cx={c[0]} cy={c[1]} r={size / 2} />);
        else if (kind === 1) cells.push(<path key={key} fill={color} opacity={op} transform={`rotate(${rot} ${c[0]} ${c[1]})`} d={`M ${x} ${y + size} A ${size / 2} ${size / 2} 0 0 1 ${x + size} ${y + size} Z`} />);
        else if (kind === 2) cells.push(<path key={key} fill={color} opacity={op} transform={`rotate(${rot} ${c[0]} ${c[1]})`} d={`M ${x} ${y} L ${x + size} ${y} A ${size} ${size} 0 0 1 ${x} ${y + size} Z`} />);
        else if (kind === 3) cells.push(<rect key={key} fill={color} opacity={op} x={x} y={y} width={size} height={size} />);
        else cells.push(<path key={key} fill={color} opacity={op} transform={`rotate(${rot} ${c[0]} ${c[1]})`} d={`M ${x} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`} />);
      }
    }
    return (<g>{cells}<TitleBlock title={title} subtitle={subtitle} no={no} fg={fg} accent={accent} /></g>);
  },

  function WavesArt({ title, subtitle, no, r, fg, bg, accent }) {
    const rows = [];
    const peaks = [0, 1, 2].map(() => ({ x: 28 + r() * 44, w: 5 + r() * 8, h: 7 + r() * 12 }));
    for (let k = 0; k < 16; k++) {
      const base = 28 + k * 4.2;
      const amp = 0.4 + Math.sin((k / 15) * Math.PI) * 1.15;
      let d = `M -2 ${base}`;
      for (let x = 0; x <= 100; x += 2.5) {
        let y = base;
        for (const p of peaks) y -= amp * p.h * Math.exp(-((x - p.x) ** 2) / (2 * p.w * p.w)) * (0.6 + r() * 0.45);
        d += ` L ${x} ${y.toFixed(2)}`;
      }
      d += ` L 102 ${base} L 102 110 L -2 110 Z`;
      rows.push(<path key={k} fill={bg} stroke={k % 4 === 0 ? accent : fg} d={d} strokeWidth={k % 4 === 0 ? '1.1' : '0.65'} />);
    }
    return (<g>{rows}<rect fill={bg} x="0" y="0" width="100" height="19" /><TitleBlock title={title} subtitle={subtitle} no={no} fg={fg} accent={accent} /></g>);
  },
];

function SleeveArt({ item, index }) {
  const title = item.title || '';
  const h = hashOf(`${title}\u0000${index}`);
  const Art = ART[index % ART.length];
  const palette = SLEEVE_PALETTES[index % SLEEVE_PALETTES.length];
  const bg = palette.bg;
  const fg = palette.fg;
  const accent = item.accentColor || palette.accent;
  const r = seeded(h);
  const no = `AW-LP-${String(index + 1).padStart(2, '0')}`;
  return (
    <svg className="vc-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect fill={bg} width="100" height="100" />
      <Art title={title} subtitle={item.subtitle} no={no} r={r} index={index} fg={fg} bg={bg} accent={accent} />
      <HypeSticker item={item} accent={accent} />
    </svg>
  );
}

/* Detailed Back Cover of the Record Sleeve */
function SleeveBack({ item, index }) {
  const r = seeded(hashOf(`${item.title || ''}\u0001${index}`));
  const tracks = Array.from({ length: 5 }, (_, i) => ({
    num: `A${i + 1}`,
    w: 24 + r() * 32,
  }));
  const bars = Array.from({ length: 18 }, () => 0.35 + r() * 1.1);
  let bx = 66;
  const no = `AW-LP-${String(index + 1).padStart(2, '0')}`;
  return (
    <svg className="vc-back-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect x="6" y="6" width="88" height="88" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
      <text className="vc-b-t" x="10" y="15" fontSize="5.2">{(item.title || '').toUpperCase().slice(0, 26)}</text>
      <text className="vc-b-m" x="10" y="20.5" fontSize="2.8" opacity="0.65">
        {(item.subtitle || '180G AUDIOPHILE PRESSING').toUpperCase()} · {no}
      </text>
      <line x1="10" y1="23.5" x2="90" y2="23.5" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />

      {tracks.map((tr, k) => (
        <g key={k}>
          <text className="vc-b-m" x="10" y={30.5 + k * 6.5} fontSize="2.7" opacity="0.65">{tr.num}</text>
          <rect className="vc-b-ink" x="17" y={28.5 + k * 6.5} width={tr.w} height="1.6" opacity="0.4" rx="0.5" />
          <text className="vc-b-m" x="90" y={30.5 + k * 6.5} fontSize="2.5" opacity="0.5" textAnchor="end">
            0{3 + (k % 3)}:{12 + k * 9}
          </text>
        </g>
      ))}

      {item.favoriteHighlight && (
        <text className="vc-b-m" x="10" y="67" fontSize="2.5" opacity="0.75">
          ★ {item.favoriteHighlight.toUpperCase().slice(0, 40)}
        </text>
      )}
      {item.reviewTestimonial && (
        <text className="vc-b-m" x="10" y="72.5" fontSize="2.4" opacity="0.6">
          “{item.reviewTestimonial.toUpperCase().slice(0, 42)}”
        </text>
      )}

      <text className="vc-b-m" x="10" y="84.5" fontSize="2.5" opacity="0.55">33⅓ RPM · STEREO · MASTERED FOR VINYL</text>
      <text className="vc-b-m" x="10" y="88.5" fontSize="2.3" opacity="0.45">ADITYAWORKS SOUND ARCHIVE</text>

      <g opacity="0.75">
        {bars.map((w, k) => {
          const x = bx;
          bx += w + 0.5;
          return <rect key={k} className="vc-b-ink" x={x} y="78" width={w} height="11" />;
        })}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------------ */
/* The 12-Inch Vinyl Record                                                  */
/* ------------------------------------------------------------------------ */

function Record({ item, labels, spinRef, rpm, onRecordPointerDown }) {
  const uid = useId().replace(/:/g, '');
  const title = (item.title || '').toUpperCase();
  const fs = Math.min(8.2, 94 / Math.max(1, title.length * 0.66));
  const sub = (item.creator || item.subtitle || labels.sideA).toUpperCase();
  const fsSub = Math.min(4.8, 78 / Math.max(1, sub.length * 0.62));
  const accent = item.accentColor || '#d14836';

  return (
    <div
      className="vc-record"
      aria-hidden="true"
      onPointerDown={onRecordPointerDown}
      style={{
        '--record-vinyl-color': item.vinylColor || undefined,
        '--record-label-color': item.labelColor || undefined,
      }}
    >
      <div className="vc-vinyl-edge" />
      <div className="vc-record-spin" ref={spinRef}>
        {/* A-SIDE */}
        <div
          className="vc-record-side is-side-a"
          style={
            item.epVisualizer?.aSide
              ? {
                  backgroundImage: `url(${item.epVisualizer.aSide})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!item.epVisualizer?.aSide && <div className="vc-vinyl" />}
          {!item.epVisualizer?.aSide && <span className="vc-scuff" />}
          {!item.epVisualizer?.aSide && (
            <svg className="vc-label" viewBox="-50 -50 100 100" focusable="false">
              <defs>
                <path id={`${uid}-top-a`} d="M -35 0 A 35 35 0 0 1 35 0" />
                <path id={`${uid}-bot-a`} d="M -39 0 A 39 39 0 0 0 39 0" />
              </defs>
              <circle className="vc-l-paper" r="50" />
              <circle r="47" fill="none" stroke={accent} strokeWidth="1.6" opacity="0.85" />
              <circle className="vc-l-line" r="43.5" fill="none" strokeWidth="0.45" />
              <text className="vc-l-title" fontSize={fs} textAnchor="middle">
                <textPath href={`#${uid}-top-a`} startOffset="50%">{title}</textPath>
              </text>
              <text className="vc-l-sub" fontSize={fsSub} textAnchor="middle">
                <textPath href={`#${uid}-bot-a`} startOffset="50%">{sub}</textPath>
              </text>
              <text className="vc-l-rpm" y="17" fontSize="5.2" textAnchor="middle">{rpm === 45 ? 'SIDE A · 45' : 'SIDE A · 33⅓'}</text>
              <rect fill={accent} x="-15" y="-1.6" width="9.5" height="0.9" />
              <rect fill={accent} x="5.5" y="-1.6" width="9.5" height="0.9" />
              <circle className="vc-l-hole" r="3.3" />
            </svg>
          )}
          <div className="vc-sheen" />
        </div>

        {/* B-SIDE (Interactive 3D Flip Face) */}
        <div
          className="vc-record-side is-side-b"
          style={
            item.epVisualizer?.bSide
              ? {
                  backgroundImage: `url(${item.epVisualizer.bSide})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!item.epVisualizer?.bSide && <div className="vc-vinyl" />}
          {!item.epVisualizer?.bSide && <span className="vc-scuff" style={{ transform: 'rotate(52deg)' }} />}
          {!item.epVisualizer?.bSide && (
            <svg className="vc-label" viewBox="-50 -50 100 100" focusable="false">
              <defs>
                <path id={`${uid}-top-b`} d="M -35 0 A 35 35 0 0 1 35 0" />
                <path id={`${uid}-bot-b`} d="M -39 0 A 39 39 0 0 0 39 0" />
              </defs>
              <circle className="vc-l-paper-b" r="50" />
              <circle r="47" fill="none" stroke={accent} strokeWidth="2.2" opacity="0.95" />
              <circle r="31" fill="none" stroke={accent} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.7" />
              <text fill="#f5efe4" fontWeight="800" fontSize={fs} textAnchor="middle">
                <textPath href={`#${uid}-top-b`} startOffset="50%">{title}</textPath>
              </text>
              <text fill={accent} fontWeight="700" fontSize="4.6" letterSpacing="0.14em" textAnchor="middle">
                <textPath href={`#${uid}-bot-b`} startOffset="50%">SIDE B · AUDIOPHILE MATRIX</textPath>
              </text>
              <text fill="#f5efe4" opacity="0.8" y="17" fontSize="5" fontFamily="monospace" textAnchor="middle">
                {rpm === 45 ? '45 RPM STEREO' : '33⅓ RPM STEREO'}
              </text>
              <circle className="vc-l-hole" r="3.3" />
            </svg>
          )}
          <div className="vc-sheen" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* One sleeve                                                                */
/* ------------------------------------------------------------------------ */

function Sleeve({
  item,
  index,
  count,
  id,
  active,
  open,
  flipped,
  rpm,
  labels,
  setRef,
  spinRef,
  onEnter,
  onLeave,
  onRecordPointerDown,
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = Boolean(item.cover && failedSrc === item.cover);
  const name = [item.title, item.subtitle].filter(Boolean).join(', ');
  return (
    <div
      ref={setRef}
      id={id}
      className={`vc-sleeve${active ? ' is-front' : ''}${open && flipped ? ' is-flipped' : ''}`}
      role="option"
      aria-selected={active}
      aria-posinset={index + 1}
      aria-setsize={count}
      aria-label={name || labels.position(index + 1, count, '')}
      data-vc-i={index}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <div className="vc-face vc-front">
        {item.cover && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="vc-cover" src={item.cover} alt="" draggable={false} decoding="async" onError={() => setFailedSrc(item.cover)} />
        ) : (
          <SleeveArt item={item} index={index} />
        )}
        <span className="vc-wear" aria-hidden="true" />
        <span className="vc-gloss" aria-hidden="true" />
        <span className="vc-shade" aria-hidden="true" />
      </div>
      <div className="vc-face vc-back">
        {item.epVisualizer?.back ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="vc-cover" src={item.epVisualizer.back} alt="" draggable={false} decoding="async" />
        ) : (
          <SleeveBack item={item} index={index} />
        )}
        <span className="vc-shade" aria-hidden="true" />
      </div>
      <span className="vc-edge" aria-hidden="true" />
      <span className="vc-drop" aria-hidden="true" />
      {open && (
        <Record
          item={item}
          labels={labels}
          spinRef={spinRef}
          rpm={rpm}
          onRecordPointerDown={onRecordPointerDown}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Icons                                                                     */
/* ------------------------------------------------------------------------ */

function ArrowIcon({ back }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {back ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

function LiftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------------ */
/* Component                                                                 */
/* ------------------------------------------------------------------------ */

export default function VinylCrate({
  items,
  onSelect,
  onChange,
  onOpen,
  onClose,
  defaultIndex = 0,
  eyebrow,
  title,
  description,
  wheel = true,
  labels: labelsProp,
}) {
  const list = items ?? [];
  const count = list.length;
  const labels = { ...LABELS, ...labelsProp };
  const still = useMedia('(prefers-reduced-motion: reduce)');
  const touchOnly = useMedia('(hover: none)');

  const uid = useId().replace(/:/g, '');
  const titleId = `${uid}-title`;
  const helpId = `${uid}-help`;
  const optionId = (i) => `${uid}-opt-${i}`;
  const dialogTitleId = `${uid}-dtitle`;

  const start = clamp(Math.round(defaultIndex) || 0, 0, Math.max(0, count - 1));
  const [index, setIndexState] = useState(start);
  const indexRef = useRef(start);
  const [openIdx, setOpenIdx] = useState(-1);
  const openRef = useRef(-1);
  const [phase, setPhase] = useState('crate');        // crate | opening | open | closing
  const [touched, setTouched] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [ctaBusy, setCtaBusy] = useState(false);
  const [layout, setLayout] = useState(null);

  // Interactive Turntable & EP Visualizer States
  const [needleOn, setNeedleOn] = useState(false);
  const [rpm, setRpm] = useState(33);
  const [sleeveFlipped, setSleeveFlipped] = useState(false);
  const [vinylFlipped, setVinylFlipped] = useState(false);
  const [vinylExtracted, setVinylExtracted] = useState(true);
  const [activeFlipZone, setActiveFlipZone] = useState(null); // 'left' | 'right' | null
  const inFlipZoneRef = useRef(false);
  const sleeveDragRef = useRef(null);

  const audioRef = useRef(null);
  useEffect(() => {
    audioRef.current = new TurntableAudioEngine();
    return () => {
      audioRef.current?.stopNeedle(true);
    };
  }, []);

  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const probeRef = useRef(null);
  const listRef = useRef(null);
  const barRef = useRef(null);
  const dialogRef = useRef(null);
  const scrimRef = useRef(null);
  const planeRefs = useRef([]);
  const sleeveRefs = useRef([]);
  const spinRef = useRef(null);
  const layoutRef = useRef(null);
  const returnFocus = useRef(null);
  const stillRef = useRef(still);
  stillRef.current = still;
  const cb = useRef({});
  cb.current = { onChange, onOpen, onClose, list, labels };

  // Scratching / manual vinyl rotation ref
  const scratchRef = useRef({ active: false, lastAngle: 0, velocity: 0, manualAngle: 0 });
  const rpmRef = useRef(rpm);
  rpmRef.current = rpm;

  const mv = useMemo(() => ({
    offset: motionValue(clamp(indexRef.current, 0, Math.max(0, count - 1))),
    openT: motionValue(0),
    slide: motionValue(0),
    flipRY: motionValue(0),
    vinylFlipRY: motionValue(0),
    camYaw: motionValue(YAW),
    camElev: motionValue(ELEV),
    hover: Array.from({ length: count }, () => motionValue(0)),
  }), [count]);
  const anim = useRef({});
  const setIndex = (i) => { indexRef.current = i; setIndexState(i); };

  /* ---- Paint ------------------------------------------------------------ */
  const paintJob = useRef(null);
  const paint = useCallback(() => {
    const L = layoutRef.current;
    if (!L) return;
    const off = mv.offset.get();
    const reduce = stillRef.current;
    const picked = openRef.current;
    const t = mv.openT.get();
    const flipDeg = mv.flipRY.get();
    const curYaw = mv.camYaw.get();
    const curElev = mv.camElev.get();
    const dynCam = camera(L.Wd, curYaw, curElev);
    const { gap } = L;

    // Update crate planes with dynamic camera parallax
    if (L.planesList) {
      L.planesList.forEach(([, x, y, z, rot], n) => {
        const el = planeRefs.current[n];
        if (!el) return;
        el.style.transform = `${dynCam.pre} translate3d(${x}px,${y}px,${z}px) ${rot}`;
      });
    }

    for (let i = 0; i < count; i++) {
      const el = sleeveRefs.current[i];
      if (!el) continue;
      const pos = i - off;
      const hv = mv.hover[i]?.get() ?? 0;
      let x = 0; let y = 0; let z; let a; let ry = 0;
      let hide = HIDE; let front = 0; let back = 0; let edge = 0; let lift = 0; let opacity = 1; let zi; let show = true;

      if (i === picked) {
        zi = 900;
        if (reduce) {
          const inCrate = t < 0.5;
          const p = inCrate ? { x: 0, y: 0, z: -Z0, a: LEAN } : L.present;
          ({ x, y, z, a } = p);
          ry = (inCrate ? 0 : p.ry) + flipDeg;
          opacity = inCrate ? 1 - t * 2 : t * 2 - 1;
          hide = inCrate ? HIDE : 0;
          lift = inCrate ? 0 : 1;
        } else {
          const r = easeOut(clamp01(t / 0.46));
          const q = easeInOut(clamp01((t - 0.2) / 0.8));
          const P = L.present;
          x = lerp(0, P.x, q);
          y = lerp(-L.rec.rise * r, P.y, q);
          z = lerp(-Z0 + 26 * r, P.z, q);
          a = lerp(LEAN, curElev, q);
          ry = lerp(0, -curYaw, q) + Math.sin(q * Math.PI) * -10 + flipDeg;
          hide = HIDE * (1 - clamp01(r * 1.25));
          lift = clamp01(t * 1.6);
        }
      } else if (reduce) {
        const lead = Math.ceil(off - 1e-6);
        const leaving = i === Math.floor(off) && off % 1 > 1e-6;
        if (leaving) {
          z = -Z0; a = LEAN; zi = 200; opacity = 1 - (off - Math.floor(off));
        } else if (i >= lead) {
          const slot = i - lead;
          z = -(Z0 + slot * gap); a = LEAN; zi = 100 + count - i;
          front = Math.min(0.55, slot * 0.07);
          edge = Math.min(0.5, slot * 0.05);
          show = slot < 16;
        } else {
          show = false; z = -Z0; a = LEAN; zi = 1;
        }
      } else if (pos >= 0) {
        const slot = Math.floor(pos) + smooth(pos % 1);
        z = -(Z0 + slot * gap);
        a = LEAN;
        y = -hv * 20;
        front = Math.min(0.55, pos * 0.065);
        edge = Math.min(0.5, pos * 0.05);
        zi = 100 + count - i;
        show = pos < 16;
      } else if (pos > -1) {
        const u = -pos;
        const k = 0.35 * u + 0.65 * u * u;
        a = lerp(LEAN, -TIP0, k);
        z = lerp(-Z0, -2, smooth(u));
        y = -hv * 18 * (1 - u);
        front = k * 0.55;
        back = 0.1;
        edge = k * 0.4;
        zi = 400 + i;
      } else {
        const j = Math.min(-pos - 1, 6);
        a = -(TIP0 + j * TIP_STEP);
        z = -2;
        back = (0.16 + j * 0.05) * (1 - hv);
        edge = 0.4 + j * 0.06;
        zi = 400 + i;
        show = -pos - 1 < 9;
      }

      el.style.transform = `${dynCam.pre} translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${a}deg) translate3d(${-S / 2}px,${LIP - S}px,0)`;
      el.style.zIndex = zi;
      el.style.opacity = opacity;
      el.style.visibility = show ? '' : 'hidden';
      el.style.setProperty('--vc-hide', `${hide}px`);
      el.style.setProperty('--vc-shade-front', front.toFixed(3));
      el.style.setProperty('--vc-shade-back', back.toFixed(3));
      el.style.setProperty('--vc-shade-edge', edge.toFixed(3));
      el.style.setProperty('--vc-lift', lift.toFixed(3));

      // Reset cover shift for non-picked sleeves
      if (i !== picked) {
        const frontFace = el.querySelector('.vc-front');
        const backFace = el.querySelector('.vc-back');
        const edgeEl = el.querySelector('.vc-edge');
        if (frontFace) { frontFace.style.transform = ''; frontFace.style.opacity = ''; }
        if (backFace) { backFace.style.transform = ''; backFace.style.opacity = ''; }
        if (edgeEl) { edgeEl.style.opacity = ''; }
      }
    }

    if (picked >= 0) {
      const openEl = sleeveRefs.current[picked];
      const rec = openEl?.querySelector('.vc-record');
      const frontFace = openEl?.querySelector('.vc-front');
      const backFace = openEl?.querySelector('.vc-back');
      const edgeEl = openEl?.querySelector('.vc-edge');
      const slide = mv.slide.get();
      const vFlip = mv.vinylFlipRY.get();

      // Kaleidoscopic EP Visualizer cover shift: when vinyl is extracted (slide -> 1),
      // album jacket slides left (-380px), scales to 0.8, and fades to 0.3 opacity
      const coverShiftX = -slide * 380;
      const coverScale = 1 - slide * 0.2;
      const coverOp = (1 - slide * 0.7).toFixed(3);
      if (frontFace) {
        frontFace.style.transform = `translate3d(${coverShiftX}px,0,1px) scale(${coverScale})`;
        frontFace.style.opacity = coverOp;
      }
      if (backFace) {
        backFace.style.transform = `translate3d(${coverShiftX}px,0,-1px) rotateY(180deg) scale(${coverScale})`;
        backFace.style.opacity = coverOp;
      }
      if (edgeEl) {
        edgeEl.style.opacity = (1 - slide).toFixed(3);
      }

      if (rec) {
        // While dragging out (0 < slide < 1), vinyl slides out to the right, then centers at 0 when extracted
        const dragOffset = slide < 0.98 ? slide * 190 * (1 - slide * 0.5) : 0;
        rec.style.opacity = slide > 0.01 ? '1' : '0';
        rec.style.transform = `translate3d(${dragOffset}px,0,12px) rotateY(${vFlip}deg)`;
      }
    }

    if (scrimRef.current) scrimRef.current.style.opacity = picked >= 0 ? (0.94 * (reduce ? t : clamp01((t - 0.2) * 1.8))).toFixed(3) : '0';
  }, [count, mv]);

  const schedule = useCallback(() => {
    if (paintJob.current) return;
    paintJob.current = frame.render(() => { paintJob.current = null; paint(); });
  }, [paint]);

  useEffect(() => {
    const currentAnim = anim.current;
    const subs = [mv.offset, mv.openT, mv.slide, mv.flipRY, mv.vinylFlipRY, mv.camYaw, mv.camElev, ...mv.hover].map((v) => v.on('change', schedule));
    return () => {
      subs.forEach((u) => u());
      if (paintJob.current) cancelFrame(paintJob.current);
      paintJob.current = null;
      Object.values(currentAnim).forEach((a) => a?.stop?.());
    };
  }, [mv, schedule]);

  /* ---- Measure ------------------------------------------------------------ */
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const probe = probeRef.current;
    if (!wrap || !probe || !count) return;
    const Ww = wrap.clientWidth;
    if (!Ww) return;
    const f = (probe.offsetWidth || S) / S;
    const k = Math.min(f, Ww / MIN_W);
    const Wd = Ww / k;
    const cam = camera(Wd, mv.camYaw.get(), mv.camElev.get());
    const { gap, D } = crateDepth(count);
    const wide = Ww >= 720;

    const H = STAGE_H * k;
    const size = wide
      ? Math.min(S * k * 1.38, H * 0.84, Ww * 0.62)
      : Math.min(S * k * 1.05, Ww * 0.78);
    const rec = {
      cx: Ww / 2,
      cy: H * 0.49,
      size,
      rise: wide ? RISE : LIP + 6,
      panel: { top: H },
    };

    const m = rec.size / k / S;
    const Zs = PERSP * (1 - 1 / m);
    const Xc = cam.ox + (rec.cx / k - cam.ox) / m;
    const Yc = cam.oy + (rec.cy / k - cam.oy) / m;
    const [px, py, pz] = toWorld([Xc - cam.cx, Yc + (S / 2 - LIP) - cam.cy, Zs]);
    const present = { x: px, y: py, z: pz, a: ELEV, ry: -YAW };

    const foot = [[-1, T], [1, T], [-1, -D - T], [1, -D - T]]
      .map(([sx, z]) => project(cam, [sx * (WI / 2 + T), LIP + BASE, z]));
    const xs = foot.map((p) => p[0]);
    const ys = foot.map((p) => p[1]);
    const shadow = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };

    const planes = cratePlanes(D);
    const planesList = [...planes.back, ...planes.front];

    const L = { k, Wd, H, wide, gap, D, pre: cam.pre, cam, present, rec, shadow, planesList };
    layoutRef.current = L;
    setLayout(L);

    planesList.forEach(([, x, y, z, rot, w, h], n) => {
      const el = planeRefs.current[n];
      if (!el) return;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.transform = `${cam.pre} translate3d(${x}px,${y}px,${z}px) ${rot}`;
    });
    paint();
  }, [count, mv, paint]);

  useIsoLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    let width = -1;
    const onResize = () => {
      if (wrap.clientWidth === width) return;
      width = wrap.clientWidth;
      measure();
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => { paint(); }, [still, openIdx, paint]);

  useEffect(() => {
    if (!count || indexRef.current <= count - 1) return;
    setIndex(count - 1);
    mv.offset.set(count - 1);
  }, [count, mv]);

  /* ---- Flipping ------------------------------------------------------------- */
  function glide(to, { quiet } = {}) {
    const from = mv.offset.get();
    const dist = Math.abs(to - from);
    anim.current.offset?.stop();
    if (dist < 1e-3) { mv.offset.set(to); return; }
    if (stillRef.current) {
      anim.current.offset = animate(mv.offset, to, { duration: 0.26, ease: 'linear' });
      return;
    }
    const run = 0.28 + 0.16 * (Math.min(dist, 6) - 1) * (dist > 1 ? 1 : 0) + (dist < 1 ? -0.28 * (1 - dist) : 0);
    if (to > from) {
      const settle = quiet ? 0.16 : 0.28;
      anim.current.offset = animate(mv.offset, [from, to, to - 0.11, to], {
        duration: run + settle,
        times: [0, run / (run + settle), (run + settle * 0.42) / (run + settle), 1],
        ease: ['linear', 'easeOut', 'easeInOut'],
      });
    } else {
      anim.current.offset = animate(mv.offset, to, { duration: run + 0.12, ease: [0.2, 0.7, 0.3, 1] });
    }
  }

  function announce(i) {
    const it = cb.current.list[i];
    if (!it) return;
    const text = cb.current.labels.position(i + 1, count, it.title || '');
    setAnnouncement((prev) => (prev === text ? `${text}\u00a0` : text));
  }

  function go(i, from = 'pointer', opts) {
    if (!count || openRef.current !== -1) return;
    const to = clamp(i, 0, count - 1);
    if (to !== indexRef.current) {
      setIndex(to);
      setTouched(true);
      audioRef.current?.playFlipSound();
      cb.current.onChange?.(to, cb.current.list[to]);
      if (from !== 'listbox') announce(to);
    }
    glide(to, opts);
  }
  const next = (from) => go(indexRef.current + 1, from);
  const previous = (from) => go(indexRef.current - 1, from);

  /* ---- Taking a record out (Centred Kaleidoscopic EP Visualizer) ------- */
  function open(i = indexRef.current) {
    if (!count || openRef.current !== -1) return;
    if (Math.abs(mv.offset.get() - i) > 0.02) { go(i); }
    anim.current.offset?.stop();
    mv.offset.set(i);
    returnFocus.current = document.activeElement;
    openRef.current = i;
    setOpenIdx(i);
    setPhase('opening');
    setCtaBusy(false);
    setSleeveFlipped(false);
    setVinylFlipped(false);
    setVinylExtracted(false);
    setActiveFlipZone(null);
    inFlipZoneRef.current = false;
    mv.flipRY.set(0);
    mv.vinylFlipRY.set(0);
    mv.slide.set(0);
    mv.hover.forEach((h) => h.set(0));
    audioRef.current?.playFlipSound();
    cb.current.onOpen?.(cb.current.list[i]);
    anim.current.slide?.stop();
    anim.current.open?.stop();
    if (stillRef.current) {
      anim.current.open = animate(mv.openT, 1, { duration: 0.3, ease: 'linear', onComplete: () => setPhase('open') });
      return;
    }
    anim.current.open = animate(mv.openT, 1, {
      duration: 0.82,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => setPhase('open'),
    });
  }

  function close() {
    const i = openRef.current;
    if (i === -1 || phase === 'closing') return;
    setPhase('closing');
    setNeedleOn(false);
    audioRef.current?.stopNeedle();
    setSleeveFlipped(false);
    setVinylFlipped(false);
    setActiveFlipZone(null);
    inFlipZoneRef.current = false;
    anim.current.flip?.stop();
    anim.current.vFlip?.stop();
    anim.current.flip = animate(mv.flipRY, 0, { duration: 0.25 });
    anim.current.vFlip = animate(mv.vinylFlipRY, 0, { duration: 0.25 });
    anim.current.slide?.stop();
    anim.current.open?.stop();
    const done = () => {
      openRef.current = -1;
      setOpenIdx(-1);
      setPhase('crate');
      mv.slide.set(0);
      cb.current.onClose?.(cb.current.list[i]);
      paint();
    };
    if (stillRef.current) {
      anim.current.open = animate(mv.openT, 0, { duration: 0.3, ease: 'linear', onComplete: done });
      return;
    }
    anim.current.slide = animate(mv.slide, 0, { duration: 0.38, ease: [0.5, 0, 0.25, 1] });
    anim.current.open = animate(mv.openT, 0, { delay: 0.26, duration: 0.78, ease: [0.4, 0, 0.6, 1], onComplete: done });
  }

  /* Toggle Needle Drop Audio */
  function toggleNeedle() {
    if (openRef.current === -1) return;
    const item = list[openRef.current];
    if (needleOn) {
      setNeedleOn(false);
      audioRef.current?.stopNeedle();
    } else {
      setNeedleOn(true);
      audioRef.current?.startNeedle(item?.chordFreqs, rpm);
    }
  }

  /* Toggle 33⅓ / 45 RPM */
  function toggleRpm() {
    const nextRpm = rpm === 33 ? 45 : 33;
    setRpm(nextRpm);
    if (needleOn) {
      audioRef.current?.setPitchMultiplier(nextRpm === 45 ? 1.35 : 1.0);
    }
  }

  /* Direct Interactive Record Scratching / Spin-Dragging */
  function onRecordPointerDown(e) {
    if (openRef.current === -1) return;
    e.stopPropagation();
    const recEl = e.currentTarget;
    const rect = recEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) / RAD;

    scratchRef.current.active = true;
    scratchRef.current.lastAngle = startAngle;
    scratchRef.current.velocity = 0;

    const onMove = (ev) => {
      if (!scratchRef.current.active) return;
      const curAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) / RAD;
      let delta = curAngle - scratchRef.current.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      scratchRef.current.lastAngle = curAngle;
      scratchRef.current.manualAngle = (scratchRef.current.manualAngle + delta + 360) % 360;
      scratchRef.current.velocity = delta * 60;
      if (spinRef.current) {
        spinRef.current.style.transform = `rotate(${scratchRef.current.manualAngle}deg)`;
      }
      if (needleOn) {
        const ratio = Math.max(0.3, Math.min(2.2, Math.abs(scratchRef.current.velocity) / 180));
        audioRef.current?.setPitchMultiplier(ratio);
      }
    };

    const onUp = () => {
      scratchRef.current.active = false;
      if (needleOn) {
        audioRef.current?.setPitchMultiplier(rpmRef.current === 45 ? 1.35 : 1.0);
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  /* ---- Spin (33 1/3 rpm = 200 deg/s, 45 rpm = 270 deg/s) ---------------- */
  useEffect(() => {
    if (openIdx === -1 || still) return undefined;
    let raf = 0;
    let last = performance.now();
    let speed = 0;
    let angle = scratchRef.current.manualAngle || 0;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!scratchRef.current.active) {
        const targetSpeed = rpmRef.current === 45 ? 270 : 200;
        const target = mv.slide.get() > 0.85 && phase !== 'closing' ? targetSpeed : 0;
        speed += (target - speed) * Math.min(1, dt * (target ? 2.5 : 5));
        angle = (angle + speed * dt) % 360;
        scratchRef.current.manualAngle = angle;
        if (spinRef.current) spinRef.current.style.transform = `rotate(${angle}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [openIdx, still, phase, mv]);

  useEffect(() => {
    const out = openIdx !== -1;
    if (listRef.current) listRef.current.inert = out;
    if (barRef.current) barRef.current.inert = out;
  }, [openIdx]);

  useEffect(() => {
    if (openIdx === -1) return undefined;
    const t = setTimeout(() => dialogRef.current?.focus({ preventScroll: true }), still ? 0 : 60);
    return () => clearTimeout(t);
  }, [openIdx, still]);

  useEffect(() => {
    if (phase !== 'crate') return;
    const el = returnFocus.current;
    returnFocus.current = null;
    if (!el) return;
    const root = rootRef.current;
    const now = document.activeElement;
    if (now && now !== document.body && !root?.contains(now)) return;
    const target = el.isConnected && root?.contains(el) && el !== document.body ? el : listRef.current;
    target?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (openIdx === -1) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  });

  /* ---- Pointer: drag, swipe, click, EP Visualizer Drag-Extract & Flip Zones ---- */
  const gesture = useRef(null);
  function onPointerDown(e) {
    if (!layoutRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // When a record is open: allow dragging anywhere on stage to extract / store vinyl (kaleidoscopic style)
    if (openRef.current !== -1) {
      if (e.target.closest?.('.vc-ep-hud-left')) return;
      if (!vinylExtracted && sleeveFlipped) return;
      sleeveDragRef.current = {
        id: e.pointerId,
        startX: e.clientX,
        startSlide: mv.slide.get(),
        moved: false,
      };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    const hit = e.target.closest?.('[data-vc-i]');
    gesture.current = {
      id: e.pointerId, x: e.clientX, y: e.clientY, from: mv.offset.get(), axis: null,
      hit: hit ? Number(hit.dataset.vcI) : -1, touch: e.pointerType === 'touch',
      samples: [[performance.now(), mv.offset.get()]],
    };
  }
  function onPointerMove(e) {
    // 3D Camera Parallax + Dynamic Light Rays + Lateral Flip Hotzones (kaleidoscopic style)
    if (e.pointerType === 'mouse' && !stillRef.current && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const mx = clamp01((e.clientX - rect.left) / Math.max(1, rect.width));
      const my = clamp01((e.clientY - rect.top) / Math.max(1, rect.height));
      wrapRef.current.style.setProperty('--vc-mx', mx.toFixed(3));
      wrapRef.current.style.setProperty('--vc-my', my.toFixed(3));

      const nx = (mx - 0.5) * 2;
      const ny = (my - 0.5) * 2;
      const tiltScale = openRef.current !== -1 ? 1.85 : 1.0;
      anim.current.camYaw?.stop();
      anim.current.camElev?.stop();
      anim.current.camYaw = animate(mv.camYaw, YAW + nx * 4.2 * tiltScale, { type: 'spring', stiffness: 180, damping: 24 });
      anim.current.camElev = animate(mv.camElev, ELEV - ny * 2.4 * tiltScale, { type: 'spring', stiffness: 180, damping: 24 });

      // Exact Lateral Flip Zones (<= 10% or >= 90%) from kaleidoscopic-halva-b45fb2.netlify.app
      if (openRef.current !== -1 && phase === 'open' && !sleeveDragRef.current && !scratchRef.current.active) {
        const zone = mx <= 0.1 ? 'left' : mx >= 0.9 ? 'right' : null;
        if (zone !== activeFlipZone) setActiveFlipZone(zone);
        const shouldFlip = Boolean(zone);

        if (!vinylExtracted) {
          if (shouldFlip && !sleeveFlipped) {
            setSleeveFlipped(true);
            audioRef.current?.playFlipSound();
            anim.current.flip?.stop();
            anim.current.flip = animate(mv.flipRY, 180, { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] });
          } else if (!shouldFlip && sleeveFlipped) {
            setSleeveFlipped(false);
            audioRef.current?.playFlipSound();
            anim.current.flip?.stop();
            anim.current.flip = animate(mv.flipRY, 0, { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] });
          }
        } else {
          if (shouldFlip && !vinylFlipped) {
            setVinylFlipped(true);
            audioRef.current?.playFlipSound();
            anim.current.vFlip?.stop();
            anim.current.vFlip = animate(mv.vinylFlipRY, 180, { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] });
          } else if (!shouldFlip && vinylFlipped) {
            setVinylFlipped(false);
            audioRef.current?.playFlipSound();
            anim.current.vFlip?.stop();
            anim.current.vFlip = animate(mv.vinylFlipRY, 0, { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] });
          }
        }
      }
    }

    // Handle horizontal drag-to-extract (drag right) / drag-to-store (drag left)
    const sd = sleeveDragRef.current;
    if (sd && sd.id === e.pointerId) {
      const deltaX = e.clientX - sd.startX;
      if (!vinylExtracted) {
        if (deltaX > 30) {
          sd.moved = true;
          anim.current.slide?.stop();
          const progress = Math.min((deltaX - 30) / 180, 1);
          mv.slide.set(progress);
          if (progress >= 1) {
            setVinylExtracted(true);
            audioRef.current?.playFlipSound();
            sleeveDragRef.current = null;
          }
        }
      } else {
        if (deltaX < 0) {
          sd.moved = true;
          anim.current.slide?.stop();
          const progress = Math.min(Math.abs(deltaX) / 180, 1);
          mv.slide.set(1 - progress);
          if (progress >= 1) {
            setVinylExtracted(false);
            setVinylFlipped(false);
            mv.vinylFlipRY.set(0);
            audioRef.current?.playFlipSound();
            sleeveDragRef.current = null;
          }
        } else {
          mv.slide.set(1);
        }
      }
      return;
    }

    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.hypot(dx, dy) < 6) return;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      if (g.touch && !horizontal) { gesture.current = null; return; }
      g.axis = horizontal ? 'x' : 'y';
      anim.current.offset?.stop();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      mv.hover.forEach((h) => h.set(0));
    }
    const px = (g.axis === 'y' ? dy : -dx) / (DRAG * layoutRef.current.k);
    let o = g.from + px;
    const max = count - 1;
    if (o < 0) o = -Math.min(0.2, -o * 0.25);
    if (o > max) o = max + Math.min(0.2, (o - max) * 0.25);
    mv.offset.set(o);
    g.samples.push([performance.now(), o]);
    if (g.samples.length > 6) g.samples.shift();
  }
  function onStageLeave() {
    setActiveFlipZone(null);
    inFlipZoneRef.current = false;
    if (stillRef.current) return;
    anim.current.camYaw?.stop();
    anim.current.camElev?.stop();
    anim.current.camYaw = animate(mv.camYaw, YAW, { type: 'spring', stiffness: 140, damping: 22 });
    anim.current.camElev = animate(mv.camElev, ELEV, { type: 'spring', stiffness: 140, damping: 22 });
  }
  function onPointerUp(e) {
    const sd = sleeveDragRef.current;
    if (sd && sd.id === e.pointerId) {
      sleeveDragRef.current = null;
      if (!vinylExtracted) {
        anim.current.slide?.stop();
        anim.current.slide = animate(mv.slide, 0, { duration: 0.28, ease: 'easeOut' });
      } else {
        anim.current.slide?.stop();
        anim.current.slide = animate(mv.slide, 1, { duration: 0.28, ease: 'easeOut' });
      }
      return;
    }

    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.axis) {
      if (e.type !== 'pointerup' || g.hit < 0) return;
      if (g.hit === indexRef.current) open(g.hit);
      else go(g.hit);
      return;
    }
    const [t0, o0] = g.samples[0];
    const [t1, o1] = g.samples[g.samples.length - 1];
    const v = t1 > t0 ? ((o1 - o0) / (t1 - t0)) * 1000 : 0;
    const o = mv.offset.get();
    const target = clamp(Math.round(o + clamp(v * 0.12, -1.5, 1.5)), Math.floor(g.from) - 3, Math.ceil(g.from) + 3);
    const to = clamp(target, 0, count - 1);
    if (to !== indexRef.current) {
      setIndex(to);
      setTouched(true);
      audioRef.current?.playFlipSound();
      cb.current.onChange?.(to, cb.current.list[to]);
      announce(to);
    }
    glide(to);
  }
  function onLostCapture(e) {
    if (e.target === e.currentTarget) onPointerUp(e);
  }

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const hold = (e) => { if (gesture.current?.axis && e.cancelable) e.preventDefault(); };
    el.addEventListener('touchmove', hold, { passive: false });
    return () => el.removeEventListener('touchmove', hold);
  }, [count]);

  /* ---- Wheel ------------------------------------------------------------ */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !wheel) return undefined;
    let acc = 0;
    let lastT = 0;
    const onWheel = (e) => {
      if (openRef.current !== -1 || e.ctrlKey) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const d = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
      const dir = Math.sign(d);
      if (!dir) return;
      const at = indexRef.current;
      if ((dir > 0 && at >= count - 1) || (dir < 0 && at <= 0)) { acc = 0; return; }
      e.preventDefault();
      const now = performance.now();
      if (now - lastT > 240) acc = 0;
      lastT = now;
      acc += d;
      if (Math.abs(acc) < 36) return;
      acc = 0;
      if (Math.abs(at + dir - mv.offset.get()) > 2.2) return;
      go(at + dir, 'wheel', { quiet: true });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  /* ---- Keyboard --------------------------------------------------------- */
  function onListKeyDown(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); next('listbox'); }
    else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); previous('listbox'); }
    else if (k === 'Home') { e.preventDefault(); go(0, 'listbox'); }
    else if (k === 'End') { e.preventDefault(); go(count - 1, 'listbox'); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); open(); }
  }

  function hoverTo(i, v) {
    if (stillRef.current || gesture.current?.axis || openRef.current !== -1) return;
    anim.current[`h${i}`]?.stop();
    anim.current[`h${i}`] = animate(mv.hover[i], v, { type: 'spring', stiffness: 420, damping: 28 });
  }

  async function onCta(e, item) {
    if (ctaBusy) return;
    if (item.href) { onSelect?.(item, { event: e }); return; }
    try {
      const result = onSelect?.(item, { event: e });
      if (result && typeof result.then === 'function') {
        setCtaBusy(true);
        await result;
      }
    } finally {
      setCtaBusy(false);
    }
  }

  if (!count) return null;

  const L = layout;
  const current = list[index] || list[0];
  const picked = openIdx >= 0 ? list[openIdx] : null;
  const planes = cratePlanes(L?.D ?? crateDepth(count).D);
  const allPlanes = [...planes.back.map((p) => [...p, 'back']), ...planes.front.map((p) => [...p, 'front'])];
  const wrapH = L ? L.H : undefined;
  const showCta = picked && (picked.href || onSelect);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={rootRef}
        className={`vinyl-crate-root${still ? ' is-still' : ''}`}
        data-state={phase}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : labels.region}
      >
        <div className="vc-inner">
          {(eyebrow || title || description) && (
            <header className="vc-head">
              {eyebrow && <p className="vc-eyebrow">{eyebrow}</p>}
              {title && <h2 className="vc-title" id={titleId}>{title}</h2>}
              {description && <p className="vc-desc">{description}</p>}
            </header>
          )}

          {/* ============================== CRATE STAGE ============================== */}
          <div
            ref={wrapRef}
            className={`vc-wrap${L?.wide ? ' is-wide' : ' is-narrow'}${openIdx !== -1 ? ' is-open' : ''}`}
            style={{
              height: wrapH,
              '--vc-ep-light': picked?.accentColor ? `${picked.accentColor}26` : 'rgba(232, 176, 75, 0.16)',
              '--vc-ep-glow': picked?.accentColor ? `${picked.accentColor}38` : 'rgba(232, 176, 75, 0.22)',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onStageLeave}
            onLostPointerCapture={onLostCapture}
          >
            {/* Interactive EP Visualizer Dynamic Light Rays & Spotlight */}
            <div className="vc-ep-rays" aria-hidden="true" />
            <div className="vc-ep-spotlight" aria-hidden="true" />

            {/* Interactive Lateral Flip Zones when record is open (kaleidoscopic style) */}
            {openIdx !== -1 && phase === 'open' && (
              <>
                <div className={`vc-ep-border-zone is-left${activeFlipZone === 'left' ? ' is-active' : ''}`} aria-hidden="true" />
                <div className={`vc-ep-border-zone is-right${activeFlipZone === 'right' ? ' is-active' : ''}`} aria-hidden="true" />
              </>
            )}

            <span className="vc-probe" ref={probeRef} aria-hidden="true" />
            <div
              ref={stageRef}
              className={`vc-stage${L ? ' is-ready' : ''}`}
              style={L ? { width: L.Wd, height: STAGE_H, transform: `scale(${L.k})` } : undefined}
            >
              {L && (
                <span
                  className="vc-floor-shadow"
                  aria-hidden="true"
                  style={{
                    left: L.shadow.left - 34, width: L.shadow.right - L.shadow.left + 68,
                    top: L.shadow.top + 10, height: L.shadow.bottom - L.shadow.top + 30,
                  }}
                />
              )}
              {allPlanes.map(([cls, , , , , , , layer], n) => (
                <div
                  key={n}
                  ref={(el) => { planeRefs.current[n] = el; }}
                  className={`vc-plane ${cls}`}
                  aria-hidden="true"
                  style={{
                    zIndex: layer === 'back' ? 1 + n : 301 + n,
                    clipPath: cls.includes('vc-p-side') ? planes.sideClip : undefined,
                  }}
                >
                  <span className="vc-grain" />
                  {(cls.includes('vc-p-side') || cls === 'vc-p-front') && <span className="vc-handle" />}
                  {cls === 'vc-p-front' && <span className="vc-seam" />}
                </div>
              ))}

              <div
                ref={listRef}
                className="vc-crate"
                role="listbox"
                tabIndex={0}
                aria-label={title ? undefined : labels.region}
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={helpId}
                aria-activedescendant={optionId(index)}
                onKeyDown={onListKeyDown}
              >
                {list.map((item, i) => (
                  <Sleeve
                    key={item.id ?? i}
                    item={item}
                    index={i}
                    count={count}
                    id={optionId(i)}
                    active={i === index}
                    open={i === openIdx}
                    flipped={i === openIdx && sleeveFlipped}
                    rpm={rpm}
                    labels={labels}
                    setRef={(el) => { sleeveRefs.current[i] = el; }}
                    spinRef={spinRef}
                    onEnter={(e) => { if (e.pointerType === 'mouse') hoverTo(i, 1); }}
                    onLeave={(e) => { if (e.pointerType === 'mouse') hoverTo(i, 0); }}
                    onRecordPointerDown={onRecordPointerDown}
                  />
                ))}
              </div>
              <div ref={scrimRef} className="vc-scrim" aria-hidden="true" />
            </div>

            <p className={`vc-hint${touched || openIdx !== -1 ? '' : ' is-on'}`} aria-hidden="true">
              {touchOnly ? labels.hintTouch : labels.hint}
            </p>
            <p id={helpId} hidden>{labels.instructions}</p>

            {/* ======= KALEIDOSCOPIC-HALVA MINIMALIST CONSOLAS HUD (NO INFO CARD) ======= */}
            <AnimatePresence>
              {picked && phase !== 'closing' && L && (
                <motion.div
                  key={openIdx}
                  ref={dialogRef}
                  role="dialog"
                  aria-labelledby={dialogTitleId}
                  tabIndex={-1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: still ? 0 : 0.35, duration: 0.35 } }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  {/* Left HUD: Title + Artist•Year + Compact Controls */}
                  <div className="vc-ep-hud-left">
                    <h3 className="vc-ep-hud-title" id={dialogTitleId}>{picked.title}</h3>
                    <p className="vc-ep-hud-sub">
                      {picked.creator || picked.subtitle} {picked.year ? `• ${picked.year}` : ''}
                    </p>
                    <div className="vc-ep-hud-actions">
                      <button type="button" className="vc-ep-hud-btn" onClick={close}>
                        ← Back to Crate
                      </button>
                      <button
                        type="button"
                        className={`vc-ep-hud-btn${needleOn ? ' is-active' : ''}`}
                        onClick={toggleNeedle}
                      >
                        {needleOn ? '■ Lift Needle' : '▶ Drop Needle'}
                      </button>
                      <button
                        type="button"
                        className={`vc-ep-hud-btn${rpm === 45 ? ' is-active' : ''}`}
                        onClick={toggleRpm}
                      >
                        {rpm === 45 ? '45 RPM' : '33⅓ RPM'}
                      </button>
                      {showCta && picked.href && (
                        <a
                          className="vc-ep-hud-btn"
                          href={picked.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => onCta(e, picked)}
                        >
                          Spotify ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right HUD: Flip Zone & Drag to Extract / Store Guide */}
                  <div className="vc-ep-hud-right">
                    {!vinylExtracted ? (
                      <>
                        <div>◄ Flip Zone</div>
                        <div style={{ margin: '0.85rem 0' }}>Drag to extract →</div>
                        <div>Flip Zone ►</div>
                      </>
                    ) : (
                      <>
                        <div>◄ Flip Vinyl</div>
                        <div style={{ margin: '0.85rem 0' }}>← Drag to store</div>
                        <div>Flip Vinyl ►</div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ============================ CONTROLS & QUICK-JUMP STRIP ============================= */}
          <div className="vc-bar" ref={barRef}>
            <div className="vc-bar-main">
              <div className="vc-now" aria-hidden="true">
                <span className="vc-count"><b>{pad(index + 1)}</b> / {pad(count)}</span>
                <span className="vc-now-text">
                  <span className="vc-now-title">{current.title}</span>
                  {current.subtitle && <span className="vc-now-sub">{current.subtitle}{current.genre ? ` · ${current.genre}` : ''}</span>}
                </span>
              </div>
              <div className="vc-buttons">
                <button type="button" className="vc-btn vc-icon" onClick={() => previous()}
                        aria-label={labels.previous} aria-disabled={index === 0 || undefined}>
                  <ArrowIcon back />
                </button>
                <button type="button" className="vc-btn vc-icon" onClick={() => next()}
                        aria-label={labels.next} aria-disabled={index === count - 1 || undefined}>
                  <ArrowIcon />
                </button>
                <button type="button" className="vc-btn vc-open" onClick={() => open()}>
                  <LiftIcon />
                  <span>{labels.open}</span>
                </button>
              </div>
            </div>

            {/* Interactive Quick-Jump Crate Divider Strip */}
            <div className="vc-strip" role="tablist" aria-label="Jump to record in crate">
              {list.map((it, i) => {
                const isAct = i === index;
                const dotColor = it.accentColor || SLEEVE_PALETTES[i % SLEEVE_PALETTES.length].accent;
                return (
                  <button
                    key={it.id ?? i}
                    type="button"
                    role="tab"
                    aria-selected={isAct}
                    className={`vc-tab${isAct ? ' is-active' : ''}`}
                    onClick={() => {
                      if (i === index) open(i);
                      else go(i);
                    }}
                    title={`${pad(i + 1)} · ${it.title} (${it.subtitle || ''})`}
                  >
                    <span className="vc-tab-dot" style={{ background: dotColor }} />
                    <span>{pad(i + 1)} · {it.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="vc-sr" role="status" aria-live="polite">{announcement}</p>
        </div>
      </section>
    </MotionConfig>
  );
}
