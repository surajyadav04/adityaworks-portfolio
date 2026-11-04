'use client';

/**
 * VinylCrate: a project carousel you flip through like records in a crate.
 * susanoo.ui
 *
 * A wooden crate of record sleeves standing on end, seen from the front and a
 * little above. The front sleeve faces you; the ones behind lean back with
 * only their top edges showing. Drag the front sleeve down, scroll the wheel
 * or press an arrow key and it tips forward onto the pile of records you've
 * already flipped, revealing the next one; the rest of the crate shuffles up.
 * Flip back and they tip up again. Pick a record (click the front sleeve, or
 * Enter) and it lifts out of the crate, turns to face you, and the vinyl
 * slides halfway out of its sleeve and starts to spin, with its details
 * beside it. Esc, the close button or a click outside slides the record back
 * in and drops the sleeve back into the crate.
 *
 * Everything is keyboard and screen reader friendly underneath: the crate is
 * a listbox (arrow keys flip, Home and End jump, Enter opens), the details
 * are a dialog that takes focus and gives it back, and a polite live region
 * reads out where you are when you flip by mouse or touch. With reduced
 * motion there's no tipping and no spinning: sleeves cross-fade, and the
 * record simply appears with its disc half out.
 *
 * Sleeve art: pass an image URL as `cover` and it's used as-is. Without one,
 * every sleeve gets a bold monochrome design generated from its title
 * (typographic covers and geometric patterns), the same every time.
 *
 * On phones the crate scales down to fit, horizontal swipes flip (vertical
 * swipes still scroll the page), and the details stack under the record.
 *
 * This component is presentational. It owns no data and no routing: pass the
 * items in, and link each one with href or handle it with onSelect.
 *
 * ---------------------------------------------------------------------------
 * PROPS
 *
 *   items                required. [{ id, title, subtitle, description, cover, href, cta }]
 *                          title        the record's name. Printed on the
 *                                       generated sleeve and the record label.
 *                          subtitle     a short line: role, year, category.
 *                          description  a sentence or two for the details.
 *                          cover        image URL for the sleeve (square reads
 *                                       best). Omit it for generated art.
 *                          href         where the details button goes.
 *                          cta          the details button's text.
 *   onSelect(item, { event })
 *                        called when the details button is pressed. With an
 *                        href it's a link and this is just told (call
 *                        event.preventDefault() to route it yourself). Without
 *                        one it's a button: return a Promise to show it busy,
 *                        throw to show an error under it.
 *   onChange(index, item) called when a different record comes to the front.
 *   onOpen(item), onClose(item)
 *                        called when a record is taken out and put back.
 *   defaultIndex         the record at the front to start with. Default 0.
 *   eyebrow, title, description
 *                        optional heading copy. Each renders only when set.
 *   wheel                boolean. Flip with the mouse wheel while the pointer
 *                        is over the crate. Default true. The page scrolls on
 *                        as normal at either end of the crate.
 *   labels               replace any built-in string, e.g. to translate it.
 *                        See LABELS below.
 *
 * ---------------------------------------------------------------------------
 * USAGE
 *
 *   import VinylCrate from './VinylCrate';
 *   import './tokens.css';
 *   import './VinylCrate.css';
 *
 *   <VinylCrate
 *     eyebrow="Selected work"
 *     title="Dig through the crate"
 *     items={[
 *       { id: 'night-drive', title: 'Night Drive', subtitle: 'Mobile app, 2026',
 *         description: 'A calmer banking app for people who work nights.',
 *         href: '/work/night-drive', cta: 'Read the case study' },
 *       { id: 'low-tide', title: 'Low Tide', subtitle: 'Brand identity, 2026',
 *         cover: '/covers/low-tide.jpg', href: '/work/low-tide' },
 *     ]}
 *   />
 *
 * Requires: react >= 18, framer-motion >= 11 (or the `motion` package).
 * Styles are fully scoped under .vinyl-crate-root; nothing leaks out.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, animate, motionValue, frame, cancelFrame } from 'framer-motion';

/* useLayoutEffect warns during server rendering; the crate only measures in
   the browser anyway. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* A media query as a live boolean. It starts false so the server and the
   browser render the same markup, is read before the first paint, and
   follows the setting if it changes. */
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
  open: 'Take it out',
  close: 'Close',
  cta: 'View project',
  busy: 'Opening…',
  error: 'That didn’t work. Try again.',
  hint: 'Scroll or drag to flip',
  hintTouch: 'Swipe to flip, tap to open',
  sideA: 'Side A',
  speed: '33⅓',
};

/* ------------------------------------------------------------------------ */
/* The crate, in 3D                                                          */
/* ------------------------------------------------------------------------ */

/* Everything is laid out in "crate units" (a sleeve is 300 of them wide) and
   the whole stage is scaled to fit. The world has x to the right, y down and
   z towards you, with its origin on the top edge of the crate's front wall.
   The camera looks down at it from ELEV degrees above.

   Nothing here uses the browser's 3D sorting. Every plane (crate walls,
   sleeves) carries its own perspective in its transform and is painted in a
   fixed order: the back of the crate, the standing sleeves back to front,
   the front wall, then the sleeves that have tipped forward over it. That
   keeps the picture identical in every browser. */
const S = 300;            // sleeve size
const LIP = 62;           // front wall height: how much of a standing sleeve it hides
const BASE = 14;          // bottom board, under the floor
const T = 14;             // wall thickness
const GAP_SIDE = 12;      // room either side of the sleeves
const WI = S + GAP_SIDE * 2;
const BACK_H = 186;       // side walls rise to this at the back
const Z0 = 22;            // the front sleeve stands this far behind the front wall
const LEAN = 7;           // standing sleeves lean back, degrees
const TIP0 = 76;          // the top of the flipped pile, degrees forward
const TIP_STEP = 2.4;     // each sleeve under it lies a little flatter
const ELEV = 24;          // camera elevation, degrees
const YAW = 15;           // camera turned this far to the crate's left, degrees
const PERSP = 1500;
const HIDE = LIP - 16;    // the bottom of a sleeve that's always behind the wall
const RISE = LIP + 40;    // how high a picked sleeve lifts before it turns (less on a narrow layout)
const DISC = S * 0.94;    // the record's diameter
const OUT = 0.6;          // how far the record slides out, as a share of its diameter
const SPAN = ((S - DISC) / 2 + DISC * (1 + OUT)) / S;   // sleeve + record, as a share of the sleeve
const MIN_W = 460;        // crate units the crate needs across; narrower scales down
const STAGE_H = 520;      // crate units tall
const DRAG = 180;         // crate units of drag for one flip

const RAD = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* The camera for one stage size: where the crate's origin sits on the stage
   and where the eye is. `pre` is the transform every plane starts with: the
   eye's perspective, then the crate turned YAW degrees to show its left side
   and tipped ELEV degrees towards you. */
function camera(Wd) {
  const cx = Wd / 2 + 8;
  const cy = 334;
  const ox = Wd / 2;
  const oy = cy - 130;
  const pre = `translate(${ox}px,${oy}px) perspective(${PERSP}px) translate(${-ox}px,${-oy}px) `
    + `translate3d(${cx}px,${cy}px,0) rotateX(${-ELEV}deg) rotateY(${YAW}deg)`;
  return { cx, cy, ox, oy, pre };
}

/* The camera's turn as plain maths, both ways: world to stage axes, and
   back. The CSS above does the same. */
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

/* Where a world point lands on the stage: the same maths as the CSS. */
function project(cam, v) {
  const [X, Y, Z] = toStage(v);
  const m = PERSP / (PERSP - Z);
  return [cam.ox + (cam.cx + X - cam.ox) * m, cam.oy + (cam.cy + Y - cam.oy) * m];
}

/* How deep the crate is and how far apart the sleeves stand, for a count. */
function crateDepth(count) {
  const gap = count > 1 ? Math.min(16, 150 / (count - 1)) : 16;
  return { gap, D: Z0 + gap * Math.max(0, count - 1) + 30 };
}

/* The crate's planes: [className, world x, y, z, rotation, width, height].
   Each is a flat div moved into place. `back` ones paint behind the
   sleeves: the inside of the back wall, the floor and the far (right)
   wall. `front` ones paint over the standing sleeves: the near (left) wall,
   seen from outside, and the front wall. */
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
    // The sloped top of a side wall, as a clip on its face. Both faces run
    // back to front, so one shape fits both.
    sideClip: `polygon(0 0, ${D}px ${BACK_H - LIP}px, ${D}px 100%, 0 100%)`,
  };
}

/* ------------------------------------------------------------------------ */
/* Generated sleeve art                                                      */
/* ------------------------------------------------------------------------ */

/* A small seeded random generator, so a title always gets the same art. */
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

/* Splits a title into up to three lines of roughly even length. */
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

/* The small title block most designs share: top left, like a label's
   house style, with a catalogue number opposite. */
function TitleBlock({ title, no }) {
  const t = title.toUpperCase();
  const fs = Math.min(6.2, 58 / Math.max(6, t.length * 0.64));
  return (
    <g>
      <text className="vc-a-t vc-a-fg" x="7" y="11.5" fontSize={fs}>{t}</text>
      <text className="vc-a-m vc-a-fg" x="93" y="11.2" fontSize="3.3" textAnchor="end">{no}</text>
    </g>
  );
}

const ART = [
  /* Type: the title is the picture, stacked and filling the sleeve. */
  function TypeArt({ title, no }) {
    const lines = stackWords(title).slice(0, 3);
    let y = 7;
    const rows = lines.map((l) => {
      const fs = Math.min(40, 86 / Math.max(1, l.length * 0.6));
      y += fs * 0.73;
      const row = { l, fs, y };
      y += fs * 0.13;
      return row;
    });
    return (
      <g>
        {rows.map((r) => (
          <text key={r.y} className="vc-a-t vc-a-fg" x="7" y={r.y} fontSize={r.fs}
                textLength="86" lengthAdjust="spacingAndGlyphs">{r.l}</text>
        ))}
        <rect className="vc-a-fg" x="7" y="86" width="86" height="0.6" />
        <text className="vc-a-m vc-a-fg" x="7" y="92.5" fontSize="3.3">{no}</text>
        <circle className="vc-a-fg" cx="90.5" cy="91.3" r="2.4" />
      </g>
    );
  },

  /* Rings: concentric circles, off-centre and running off the edge. */
  function RingsArt({ title, no, r }) {
    const cx = 56 + r() * 20;
    const cy = 60 + r() * 16;
    const rings = [];
    for (let k = 0, rad = 3 + r() * 3; rad < 110; k++, rad += 5.2) {
      rings.push(<circle key={k} className="vc-a-line" cx={cx} cy={cy} r={rad} strokeWidth={k % 3 === 0 ? 2.6 : 1.1} />);
    }
    return (
      <g>
        <g className="vc-a-fg-s">{rings}</g>
        <circle className="vc-a-fg" cx={cx} cy={cy} r="2.2" />
        <rect className="vc-a-bg" x="0" y="0" width="100" height="17" />
        <TitleBlock title={title} no={no} />
      </g>
    );
  },

  /* Horizon: a sun sinking into lines that get closer towards the bottom. */
  function HorizonArt({ title, no, r }) {
    const sx = 30 + r() * 40;
    const lines = [];
    for (let k = 0; k < 15; k++) {
      const y = 58 + Math.pow(k / 14, 1.6) * 42;
      lines.push(<rect key={k} className="vc-a-fg" x="0" y={y} width="100" height={0.5 + k * 0.16} />);
    }
    return (
      <g>
        <circle className="vc-a-fg" cx={sx} cy="58" r={22 + r() * 6} />
        <rect className="vc-a-bg" x="0" y="58" width="100" height="42" />
        {lines}
        <TitleBlock title={title} no={no} />
      </g>
    );
  },

  /* Sunburst: rays from a point below the sleeve. */
  function SunArt({ title, no, r }) {
    const ox = 50 + (r() - 0.5) * 30;
    const oy = 104;
    const rays = [];
    const n = 22;
    for (let k = 0; k < n; k += 2) {
      const a0 = Math.PI + (k / n) * Math.PI;
      const a1 = Math.PI + ((k + 1) / n) * Math.PI;
      rays.push(
        <path key={k} className="vc-a-fg"
              d={`M ${ox} ${oy} L ${ox + Math.cos(a0) * 160} ${oy + Math.sin(a0) * 160} L ${ox + Math.cos(a1) * 160} ${oy + Math.sin(a1) * 160} Z`} />,
      );
    }
    return (
      <g>
        {rays}
        <circle className="vc-a-bg" cx={ox} cy={oy} r="30" />
        <circle className="vc-a-fg" cx={ox} cy={oy} r="22" />
        <rect className="vc-a-bg" x="0" y="0" width="100" height="17" />
        <TitleBlock title={title} no={no} />
      </g>
    );
  },

  /* Dots: a halftone that fades from one corner. */
  function DotsArt({ title, no, r }) {
    const fx = r() < 0.5 ? 12 : 88;
    const fy = 88;
    const dots = [];
    const n = 13;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = 7 + (i * 86) / (n - 1);
        const y = 22 + (j * 71) / (n - 1);
        const d = Math.hypot(x - fx, y - fy) / 110;
        const rad = 3.1 * Math.pow(clamp01(1 - d), 1.25);
        if (rad > 0.25) dots.push(<circle key={`${i}-${j}`} className="vc-a-fg" cx={x} cy={y} r={rad} />);
      }
    }
    return (<g>{dots}<TitleBlock title={title} no={no} /></g>);
  },

  /* Blocks: a Bauhaus grid of circles, halves and squares. */
  function BlocksArt({ title, no, r }) {
    const cells = [];
    const size = 28;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const x = 7 + i * (size + 1);
        const y = 20 + j * (size + 1);
        const kind = Math.floor(r() * 5);
        const cls = r() < 0.72 ? 'vc-a-fg' : 'vc-a-mid';
        const rot = Math.floor(r() * 4) * 90;
        const key = `${i}-${j}`;
        const c = [x + size / 2, y + size / 2];
        if (kind === 0) cells.push(<circle key={key} className={cls} cx={c[0]} cy={c[1]} r={size / 2} />);
        else if (kind === 1) cells.push(<path key={key} className={cls} transform={`rotate(${rot} ${c[0]} ${c[1]})`} d={`M ${x} ${y + size} A ${size / 2} ${size / 2} 0 0 1 ${x + size} ${y + size} Z`} />);
        else if (kind === 2) cells.push(<path key={key} className={cls} transform={`rotate(${rot} ${c[0]} ${c[1]})`} d={`M ${x} ${y} L ${x + size} ${y} A ${size} ${size} 0 0 1 ${x} ${y + size} Z`} />);
        else if (kind === 3) cells.push(<rect key={key} className={cls} x={x} y={y} width={size} height={size} />);
        else cells.push(<path key={key} className={cls} transform={`rotate(${rot} ${c[0]} ${c[1]})`} d={`M ${x} ${y} L ${x + size} ${y + size} L ${x} ${y + size} Z`} />);
      }
    }
    return (<g>{cells}<TitleBlock title={title} no={no} /></g>);
  },

  /* Waves: ridgelines, each hiding the one behind it. */
  function WavesArt({ title, no, r }) {
    const rows = [];
    const peaks = [0, 1, 2].map(() => ({ x: 30 + r() * 40, w: 5 + r() * 8, h: 6 + r() * 12 }));
    for (let k = 0; k < 15; k++) {
      const base = 30 + k * 4.4;
      const amp = 0.4 + Math.sin((k / 14) * Math.PI) * 1.1;
      let d = `M -2 ${base}`;
      for (let x = 0; x <= 100; x += 2.5) {
        let y = base;
        for (const p of peaks) y -= amp * p.h * Math.exp(-((x - p.x) ** 2) / (2 * p.w * p.w)) * (0.6 + r() * 0.5);
        d += ` L ${x} ${y.toFixed(2)}`;
      }
      d += ` L 102 ${base} L 102 110 L -2 110 Z`;
      rows.push(<path key={k} className="vc-a-bg vc-a-fg-s" d={d} strokeWidth="0.7" />);
    }
    return (<g>{rows}<rect className="vc-a-bg" x="0" y="0" width="100" height="17" /><TitleBlock title={title} no={no} /></g>);
  },

  /* Number: a huge catalogue number, cropped by the sleeve. */
  function NumberArt({ title, no, index }) {
    const big = String(index + 1).padStart(2, '0');
    return (
      <g>
        <text className="vc-a-t vc-a-fg" x="-3" y="104" fontSize="92" textLength="104" lengthAdjust="spacingAndGlyphs">{big}</text>
        <rect className="vc-a-bg" x="0" y="0" width="100" height="17" />
        <TitleBlock title={title} no={no} />
      </g>
    );
  },
];

/* The generated front of a sleeve. The design is picked by position, so
   neighbouring sleeves never share one, and its details by the title. */
function SleeveArt({ item, index }) {
  const title = item.title || '';
  const h = hashOf(`${title}\u0000${index}`);
  const Art = ART[index % ART.length];
  const dark = (index + (h >>> 7)) % 2 === 1;
  const r = seeded(h);
  const no = `No. ${String(index + 1).padStart(2, '0')}`;
  return (
    <svg className={`vc-art${dark ? ' is-dark' : ''}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <rect className="vc-a-bg" width="100" height="100" />
      <Art title={title} no={no} r={r} index={index} />
    </svg>
  );
}

/* The back of a sleeve: a track list, a barcode. Mostly seen at an angle
   on the flipped pile, so it's quiet. */
function SleeveBack({ item, index }) {
  const r = seeded(hashOf(`${item.title || ''}\u0001${index}`));
  const tracks = Array.from({ length: 6 }, () => 18 + r() * 34);
  const bars = Array.from({ length: 18 }, () => 0.35 + r() * 1.1);
  let bx = 70;
  return (
    <svg className="vc-back-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <text className="vc-b-t" x="8" y="14" fontSize="5.4">{(item.title || '').toUpperCase()}</text>
      {tracks.map((w, k) => (
        <g key={k}>
          <rect className="vc-b-ink" x="8" y={25 + k * 7} width="3" height="1.5" opacity="0.55" />
          <rect className="vc-b-ink" x="14" y={25 + k * 7} width={w} height="1.5" opacity="0.35" />
        </g>
      ))}
      <g opacity="0.7">
        {bars.map((w, k) => { const x = bx; bx += w + 0.5; return <rect key={k} className="vc-b-ink" x={x} y="80" width={w} height="10" />; })}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------------ */
/* The record                                                                */
/* ------------------------------------------------------------------------ */

/* Grooves, a paper label with the title round it and a sheen that stays put
   while the rest turns. Decorative: the dialog carries the words. */
function Record({ item, labels, spinRef }) {
  const uid = useId().replace(/:/g, '');
  const title = (item.title || '').toUpperCase();
  const fs = Math.min(8.4, 96 / Math.max(1, title.length * 0.66));
  const sub = (item.subtitle || labels.sideA).toUpperCase();
  const fsSub = Math.min(5, 80 / Math.max(1, sub.length * 0.62));
  return (
    <div className="vc-record" aria-hidden="true">
      <div className="vc-record-spin" ref={spinRef}>
        <div className="vc-vinyl" />
        <span className="vc-scuff" />
        <svg className="vc-label" viewBox="-50 -50 100 100" focusable="false">
          <defs>
            <path id={`${uid}-top`} d="M -35 0 A 35 35 0 0 1 35 0" />
            <path id={`${uid}-bot`} d="M -39 0 A 39 39 0 0 0 39 0" />
          </defs>
          <circle className="vc-l-paper" r="50" />
          <circle className="vc-l-line" r="45.5" fill="none" strokeWidth="0.5" />
          <text className="vc-l-title" fontSize={fs} textAnchor="middle">
            <textPath href={`#${uid}-top`} startOffset="50%">{title}</textPath>
          </text>
          <text className="vc-l-sub" fontSize={fsSub} textAnchor="middle">
            <textPath href={`#${uid}-bot`} startOffset="50%">{sub}</textPath>
          </text>
          <text className="vc-l-rpm" y="17" fontSize="5.2" textAnchor="middle">{labels.speed}</text>
          <rect className="vc-l-ink" x="-14" y="-1.6" width="9" height="0.5" />
          <rect className="vc-l-ink" x="5" y="-1.6" width="9" height="0.5" />
          <circle className="vc-l-hole" r="3.1" />
        </svg>
      </div>
      <div className="vc-sheen" />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* One sleeve                                                                */
/* ------------------------------------------------------------------------ */

/* A listbox option. Its position, angle, shading and paint order are
   written straight to its style by paint() in the component, never through
   React state, so flipping never re-renders. */
function Sleeve({ item, index, count, id, active, open, labels, setRef, spinRef, onEnter, onLeave }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.cover]);
  const name = [item.title, item.subtitle].filter(Boolean).join(', ');
  return (
    <div
      ref={setRef}
      id={id}
      className={`vc-sleeve${active ? ' is-front' : ''}`}
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
          <img className="vc-cover" src={item.cover} alt="" draggable={false} decoding="async" onError={() => setFailed(true)} />
        ) : (
          <SleeveArt item={item} index={index} />
        )}
        <span className="vc-wear" aria-hidden="true" />
        <span className="vc-gloss" aria-hidden="true" />
        <span className="vc-shade" aria-hidden="true" />
      </div>
      <div className="vc-face vc-back">
        <SleeveBack item={item} index={index} />
        <span className="vc-shade" aria-hidden="true" />
      </div>
      <span className="vc-edge" aria-hidden="true" />
      <span className="vc-drop" aria-hidden="true" />
      {open && <Record item={item} labels={labels} spinRef={spinRef} />}
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
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
  const dialogDescId = `${uid}-ddesc`;

  const start = clamp(Math.round(defaultIndex) || 0, 0, Math.max(0, count - 1));
  const [index, setIndexState] = useState(start);
  const indexRef = useRef(start);
  const [openIdx, setOpenIdx] = useState(-1);
  const openRef = useRef(-1);
  const [phase, setPhase] = useState('crate');        // crate | opening | open | closing
  const [touched, setTouched] = useState(false);       // hides the hint after the first flip
  const [announcement, setAnnouncement] = useState('');
  const [ctaBusy, setCtaBusy] = useState(false);
  const [ctaError, setCtaError] = useState(null);
  const [layout, setLayout] = useState(null);
  const [panelH, setPanelH] = useState(0);

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

  /* ---- Motion state --------------------------------------------------------
     offset is the crate's position as a float: 2 means the third record is
     at the front, 2.5 means it's halfway through tipping over. Every
     sleeve's pose is a function of (its index - offset), so dragging,
     wheeling and animating all just move this one number. openT runs 0..1
     as the picked record lifts out and turns to face you; slide runs 0..1
     as the disc comes out of its sleeve. */
  const mv = useMemo(() => ({
    offset: motionValue(clamp(indexRef.current, 0, Math.max(0, count - 1))),
    openT: motionValue(0),
    slide: motionValue(0),
    hover: Array.from({ length: count }, () => motionValue(0)),
  }), [count]); // eslint-disable-line react-hooks/exhaustive-deps
  const anim = useRef({});
  const setIndex = (i) => { indexRef.current = i; setIndexState(i); };

  /* ---- Paint ------------------------------------------------------------
     Writes every sleeve's transform from the motion values. Batched to
     once a frame, however many values changed. */
  const paintJob = useRef(null);
  const paint = useCallback(() => {
    const L = layoutRef.current;
    if (!L) return;
    const off = mv.offset.get();
    const reduce = stillRef.current;
    const picked = openRef.current;
    const t = mv.openT.get();
    const { gap } = L;

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
          // Cross-fade: out of the crate, then in where it's shown.
          const inCrate = t < 0.5;
          const p = inCrate ? { x: 0, y: 0, z: -Z0, a: LEAN } : L.present;
          ({ x, y, z, a } = p);
          ry = inCrate ? 0 : p.ry;
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
          a = lerp(LEAN, P.a, q);
          ry = lerp(0, P.ry, q) + Math.sin(q * Math.PI) * -10;
          hide = HIDE * (1 - clamp01(r * 1.25));
          lift = clamp01(t * 1.6);
        }
      } else if (reduce) {
        // No tipping: the stack snaps a slot at a time and the sleeve
        // leaving the front cross-fades over the one arriving.
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
        // Standing: slides a slot forward (with an ease) each flip.
        const slot = Math.floor(pos) + smooth(pos % 1);
        z = -(Z0 + slot * gap);
        a = LEAN;
        y = -hv * 16;
        front = Math.min(0.55, pos * 0.07);
        edge = Math.min(0.5, pos * 0.05);
        zi = 100 + count - i;
        show = pos < 16;
      } else if (pos > -1) {
        // Tipping over: slow off the vertical, quick at the end, like
        // something falling. The bounce is in the offset animation.
        const u = -pos;
        const k = 0.35 * u + 0.65 * u * u;
        a = lerp(LEAN, -TIP0, k);
        z = lerp(-Z0, -2, smooth(u));
        y = -hv * 16 * (1 - u);
        front = k * 0.55;
        back = 0.1;
        edge = k * 0.4;
        zi = 400 + i;
      } else {
        // On the pile, the newest on top. Hovering one lights it up (click
        // to flip back to it); it doesn't move, or it would slide out from
        // under the pointer.
        const j = Math.min(-pos - 1, 6);
        a = -(TIP0 + j * TIP_STEP);
        z = -2;
        back = (0.16 + j * 0.05) * (1 - hv);
        edge = 0.4 + j * 0.06;
        zi = 400 + i;
        show = -pos - 1 < 9;
      }

      el.style.transform = `${L.pre} translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${a}deg) translate3d(${-S / 2}px,${LIP - S}px,0)`;
      el.style.zIndex = zi;
      el.style.opacity = opacity;
      el.style.visibility = show ? '' : 'hidden';
      el.style.setProperty('--vc-hide', `${hide}px`);
      el.style.setProperty('--vc-shade-front', front.toFixed(3));
      el.style.setProperty('--vc-shade-back', back.toFixed(3));
      el.style.setProperty('--vc-shade-edge', edge.toFixed(3));
      el.style.setProperty('--vc-lift', lift.toFixed(3));
    }

    // The record: slides a little over halfway out, to the right.
    const rec = picked >= 0 ? sleeveRefs.current[picked]?.querySelector('.vc-record') : null;
    if (rec) rec.style.transform = `translate3d(${mv.slide.get() * DISC * OUT}px,0,0)`;

    // Dim the crate behind a picked record.
    if (scrimRef.current) scrimRef.current.style.opacity = picked >= 0 ? (0.93 * (reduce ? t : clamp01((t - 0.2) * 1.8))).toFixed(3) : '0';
  }, [count, mv]);

  const schedule = useCallback(() => {
    if (paintJob.current) return;
    paintJob.current = frame.render(() => { paintJob.current = null; paint(); });
  }, [paint]);

  useEffect(() => {
    const subs = [mv.offset, mv.openT, mv.slide, ...mv.hover].map((v) => v.on('change', schedule));
    return () => {
      subs.forEach((u) => u());
      if (paintJob.current) cancelFrame(paintJob.current);
      paintJob.current = null;
      Object.values(anim.current).forEach((a) => a?.stop?.());
    };
  }, [mv, schedule]);

  /* ---- Measure ------------------------------------------------------------
     The stage is laid out in crate units and scaled to the wrapper's width
     (never above --vc-sleeve-size). Then the crate's planes are placed, and
     where a picked record goes: left of its details on a wide layout,
     above them on a narrow one. */
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const probe = probeRef.current;
    if (!wrap || !probe || !count) return;
    const Ww = wrap.clientWidth;
    if (!Ww) return;
    const f = (probe.offsetWidth || S) / S;
    const k = Math.min(f, Ww / MIN_W);
    const Wd = Ww / k;
    const cam = camera(Wd);
    const { gap, D } = crateDepth(count);
    const wide = Ww >= 700;

    // Where the picked record sits, in wrapper pixels: centre and size.
    const H = STAGE_H * k;
    let rec;
    if (wide) {
      const size = Math.min(S * k * 1.12, H * 0.68, (Ww - 340 - 40 - 32) / SPAN);
      const panelW = Math.min(380, Ww - size * SPAN - 40 - 32);
      const left = (Ww - (size * SPAN + 40 + panelW)) / 2;
      rec = { cx: left + size / 2, cy: H * 0.47, size, rise: RISE, panel: { left: left + size * SPAN + 40, width: panelW } };
    } else {
      const size = Math.min(S * k * 0.98, (Ww - 16) / SPAN);
      const left = (Ww - size * SPAN) / 2;
      rec = { cx: left + size / 2, cy: 12 + size / 2, size, rise: LIP + 6, panel: { top: 12 + size + 22 } };
    }

    // Back from wrapper pixels to a pose in the world: turned to face the
    // camera square (undoing its yaw and tilt), at the depth that gives
    // that size.
    const m = rec.size / k / S;
    const Zs = PERSP * (1 - 1 / m);
    const Xc = cam.ox + (rec.cx / k - cam.ox) / m;
    const Yc = cam.oy + (rec.cy / k - cam.oy) / m;
    const [px, py, pz] = toWorld([Xc - cam.cx, Yc + (S / 2 - LIP) - cam.cy, Zs]);
    const present = { x: px, y: py, z: pz, a: ELEV, ry: -YAW };

    // A soft shadow on the ground under the crate's footprint.
    const foot = [[-1, T], [1, T], [-1, -D - T], [1, -D - T]]
      .map(([sx, z]) => project(cam, [sx * (WI / 2 + T), LIP + BASE, z]));
    const xs = foot.map((p) => p[0]);
    const ys = foot.map((p) => p[1]);
    const shadow = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };

    const L = { k, Wd, H, wide, gap, D, pre: cam.pre, cam, present, rec, shadow };
    layoutRef.current = L;
    setLayout(L);

    // The crate itself.
    const planes = cratePlanes(D);
    [...planes.back, ...planes.front].forEach(([, x, y, z, rot, w, h], n) => {
      const el = planeRefs.current[n];
      if (!el) return;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.transform = `${cam.pre} translate3d(${x}px,${y}px,${z}px) ${rot}`;
    });
    paint();
  }, [count, paint]);

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

  /* Fewer items than before: keep the front record in range. */
  useEffect(() => {
    if (!count || indexRef.current <= count - 1) return;
    setIndex(count - 1);
    mv.offset.set(count - 1);
  }, [count, mv]);

  /* ---- Flipping -------------------------------------------------------------
     Forward: the offset runs at an even pace (the pose function makes each
     sleeve fall faster as it goes), overshoots a touch so the one that just
     landed bounces up off the pile, and settles. Several at once cascade.
     Back: the sleeves tip up with an ease-out and settle without a bounce. */
  function glide(to, { quiet } = {}) {
    const from = mv.offset.get();
    const dist = Math.abs(to - from);
    anim.current.offset?.stop();
    if (dist < 1e-3) { mv.offset.set(to); return; }
    if (stillRef.current) {
      anim.current.offset = animate(mv.offset, to, { duration: 0.26, ease: 'linear' });
      return;
    }
    const run = 0.3 + 0.17 * (Math.min(dist, 6) - 1) * (dist > 1 ? 1 : 0) + (dist < 1 ? -0.3 * (1 - dist) : 0);
    if (to > from) {
      const settle = quiet ? 0.18 : 0.3;
      anim.current.offset = animate(mv.offset, [from, to, to - 0.12, to], {
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
    setAnnouncement((prev) => (prev === text ? `${text} ` : text));
  }

  /* Bring record i to the front. `from` says who asked: moves made from the
     focused listbox are already read out by the screen reader, so only the
     others go through the live region. */
  function go(i, from = 'pointer', opts) {
    if (!count || openRef.current !== -1) return;
    const to = clamp(i, 0, count - 1);
    if (to !== indexRef.current) {
      setIndex(to);
      setTouched(true);
      cb.current.onChange?.(to, cb.current.list[to]);
      if (from !== 'listbox') announce(to);
    }
    glide(to, opts);
  }
  const next = (from) => go(indexRef.current + 1, from);
  const previous = (from) => go(indexRef.current - 1, from);

  /* ---- Taking a record out --------------------------------------------- */
  function open(i = indexRef.current) {
    if (!count || openRef.current !== -1) return;
    if (Math.abs(mv.offset.get() - i) > 0.02) { go(i); }
    anim.current.offset?.stop();
    mv.offset.set(i);
    returnFocus.current = document.activeElement;
    openRef.current = i;
    setOpenIdx(i);
    setPhase('opening');
    setCtaError(null);
    setCtaBusy(false);
    mv.hover.forEach((h) => h.set(0));
    cb.current.onOpen?.(cb.current.list[i]);
    anim.current.slide?.stop();
    anim.current.open?.stop();
    if (stillRef.current) {
      mv.slide.set(1);
      anim.current.open = animate(mv.openT, 1, { duration: 0.3, ease: 'linear', onComplete: () => setPhase('open') });
      return;
    }
    anim.current.open = animate(mv.openT, 1, { duration: 1.0, ease: 'linear' });
    anim.current.slide = animate(mv.slide, 1, {
      delay: 0.86,
      duration: 0.62,
      ease: [0.3, 0, 0.15, 1],
      onComplete: () => setPhase('open'),
    });
  }

  function close() {
    const i = openRef.current;
    if (i === -1 || phase === 'closing') return;
    setPhase('closing');
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
    anim.current.slide = animate(mv.slide, 0, { duration: 0.42, ease: [0.5, 0, 0.25, 1] });
    anim.current.open = animate(mv.openT, 0, { delay: 0.3, duration: 0.85, ease: [0.4, 0, 0.6, 1], onComplete: done });
  }

  /* ---- Spin -----------------------------------------------------------------
     33 1/3 rpm is 200 degrees a second. It winds up once the record is out
     and winds down as it goes back in. */
  useEffect(() => {
    if (openIdx === -1 || still) return undefined;
    let raf = 0;
    let last = performance.now();
    let speed = 0;
    let angle = 0;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = mv.slide.get() > 0.85 && phase !== 'closing' ? 200 : 0;
      speed += (target - speed) * Math.min(1, dt * (target ? 2.2 : 5));
      angle = (angle + speed * dt) % 360;
      if (spinRef.current) spinRef.current.style.transform = `rotate(${angle}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [openIdx, still, phase, mv]);

  /* The crate and its buttons can't be reached while a record is out. This
     runs before the focus effects below, so focus can go back to them. */
  useEffect(() => {
    const out = openIdx !== -1;
    if (listRef.current) listRef.current.inert = out;
    if (barRef.current) barRef.current.inert = out;
  }, [openIdx]);

  /* ---- Focus: into the details, and back where it came from ------------- */
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
    // A click outside that landed on something else (a link, a field)
    // keeps its focus.
    const now = document.activeElement;
    if (now && now !== document.body && !root?.contains(now)) return;
    const target = el.isConnected && root?.contains(el) && el !== document.body ? el : listRef.current;
    target?.focus({ preventScroll: true });
  }, [phase]);

  /* Esc, or a click anywhere but the record and its details, puts it back. */
  useEffect(() => {
    if (openIdx === -1) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    const onDown = (e) => {
      if (dialogRef.current?.contains(e.target)) return;
      if (sleeveRefs.current[openRef.current]?.contains(e.target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }); // re-bound each render so close() sees the current phase

  /* The details' height, so a narrow layout can make room under the record. */
  useIsoLayoutEffect(() => {
    if (openIdx === -1 || !dialogRef.current) return undefined;
    const el = dialogRef.current;
    const ro = new ResizeObserver(() => setPanelH(el.offsetHeight));
    ro.observe(el);
    setPanelH(el.offsetHeight);
    return () => ro.disconnect();
  }, [openIdx]);

  /* ---- Pointer: drag, swipe and click ---------------------------------------
     Down on the crate starts a gesture. A mouse can drag in either
     direction: down (or left) tips records forward, up (or right) brings
     them back, and the offset follows the pointer. Touch only swipes
     sideways, so vertical swipes still scroll the page. Let go and it
     settles on the nearest record, carried on a little by a fling. A press
     that doesn't move is a click: the front sleeve is taken out, any other
     sleeve comes to the front. */
  const gesture = useRef(null);
  function onPointerDown(e) {
    if (openRef.current !== -1 || !layoutRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const hit = e.target.closest?.('[data-vc-i]');
    gesture.current = {
      id: e.pointerId, x: e.clientX, y: e.clientY, from: mv.offset.get(), axis: null,
      hit: hit ? Number(hit.dataset.vcI) : -1, touch: e.pointerType === 'touch',
      samples: [[performance.now(), mv.offset.get()]],
    };
  }
  function onPointerMove(e) {
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
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* moves still arrive over the crate */ }
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
  function onPointerUp(e) {
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
    const v = t1 > t0 ? ((o1 - o0) / (t1 - t0)) * 1000 : 0;      // records per second
    const o = mv.offset.get();
    const target = clamp(Math.round(o + clamp(v * 0.12, -1.5, 1.5)), Math.floor(g.from) - 3, Math.ceil(g.from) + 3);
    const to = clamp(target, 0, count - 1);
    if (to !== indexRef.current) {
      setIndex(to);
      setTouched(true);
      cb.current.onChange?.(to, cb.current.list[to]);
      announce(to);
    }
    glide(to);
  }
  /* A touch is captured by whatever it lands on (a sleeve's artwork, say),
     so when the crate takes the capture that element reports losing it, and
     the event bubbles up here. Only the crate's own loss ends the gesture. */
  function onLostCapture(e) {
    if (e.target === e.currentTarget) onPointerUp(e);
  }
  /* pan-y hands sideways swipes to us, but a thumb drifts: once a swipe is
     known to be sideways, its native moves are cancelled too, so the page
     can't start scrolling (or pull to refresh) halfway through a flip.
     Non-passive, so preventDefault is honoured. */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const hold = (e) => { if (gesture.current?.axis && e.cancelable) e.preventDefault(); };
    el.addEventListener('touchmove', hold, { passive: false });
    return () => el.removeEventListener('touchmove', hold);
  }, [count]);

  /* ---- Wheel ------------------------------------------------------------
     A notch (or a short trackpad swipe) flips one record. It never runs
     more than two records ahead of what's on screen, and at either end of
     the crate the wheel goes back to scrolling the page. */
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
      if (Math.abs(acc) < 42) return;
      acc = 0;
      if (Math.abs(at + dir - mv.offset.get()) > 2.2) return;
      go(at + dir, 'wheel', { quiet: true });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }); // re-bound each render so go() sees current props

  /* ---- Keyboard: the listbox --------------------------------------------- */
  function onListKeyDown(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); next('listbox'); }
    else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); previous('listbox'); }
    else if (k === 'Home') { e.preventDefault(); go(0, 'listbox'); }
    else if (k === 'End') { e.preventDefault(); go(count - 1, 'listbox'); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); open(); }
  }

  /* ---- Hover ------------------------------------------------------------
     A mouse over a sleeve lifts it a little, like fingering through a bin:
     the front one to be picked, one behind to be flipped to. One on the
     pile lights up instead, to be flipped back to. */
  function hoverTo(i, v) {
    if (stillRef.current || gesture.current?.axis || openRef.current !== -1) return;
    anim.current[`h${i}`]?.stop();
    anim.current[`h${i}`] = animate(mv.hover[i], v, { type: 'spring', stiffness: 420, damping: 30 });
  }

  /* ---- The details' button ------------------------------------------------ */
  async function onCta(e, item) {
    if (ctaBusy) return;
    setCtaError(null);
    if (item.href) { onSelect?.(item, { event: e }); return; }
    try {
      const result = onSelect?.(item, { event: e });
      if (result && typeof result.then === 'function') {
        setCtaBusy(true);
        await result;
      }
    } catch (err) {
      setCtaError(err?.message || labels.error);
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
  const narrowOpenH = L && !L.wide && openIdx !== -1 ? L.rec.panel.top + panelH + 8 : 0;
  const wrapH = L ? Math.max(L.H, narrowOpenH) : undefined;
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

          {/* ============================== CRATE ============================== */}
          <div
            ref={wrapRef}
            className={`vc-wrap${L?.wide ? ' is-wide' : ' is-narrow'}${openIdx !== -1 ? ' is-open' : ''}`}
            style={{ height: wrapH }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onLostPointerCapture={onLostCapture}
          >
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
                    left: L.shadow.left - 30, width: L.shadow.right - L.shadow.left + 60,
                    top: L.shadow.top + 10, height: L.shadow.bottom - L.shadow.top + 26,
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

              {/* The records: a listbox, one option per sleeve. It adds no
                  stacking context, so its sleeves interleave with the walls. */}
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
                    labels={labels}
                    setRef={(el) => { sleeveRefs.current[i] = el; }}
                    spinRef={spinRef}
                    onEnter={(e) => { if (e.pointerType === 'mouse') hoverTo(i, 1); }}
                    onLeave={(e) => { if (e.pointerType === 'mouse') hoverTo(i, 0); }}
                  />
                ))}
              </div>
              <div ref={scrimRef} className="vc-scrim" aria-hidden="true" />
            </div>

            <p className={`vc-hint${touched || openIdx !== -1 ? '' : ' is-on'}`} aria-hidden="true">
              {touchOnly ? labels.hintTouch : labels.hint}
            </p>
            <p id={helpId} hidden>{labels.instructions}</p>

            {/* ============================ DETAILS ============================ */}
            <AnimatePresence>
              {picked && phase !== 'closing' && L && (
                <motion.div
                  key={openIdx}
                  ref={dialogRef}
                  className="vc-details"
                  role="dialog"
                  aria-labelledby={dialogTitleId}
                  aria-describedby={picked.description ? dialogDescId : undefined}
                  tabIndex={-1}
                  style={L.wide
                    ? { left: L.rec.panel.left, width: L.rec.panel.width, top: '50%' }
                    : { top: L.rec.panel.top }}
                  initial={{ opacity: 0, x: L.wide ? 18 : 0, y: L.wide ? '-50%' : 14 }}
                  animate={{ opacity: 1, x: 0, y: L.wide ? '-50%' : 0, transition: { delay: still ? 0 : 0.62, duration: 0.45, ease: [0.25, 1, 0.5, 1] } }}
                  exit={{ opacity: 0, x: L.wide ? 12 : 0, y: L.wide ? '-50%' : 8, transition: { duration: 0.2 } }}
                >
                  <button type="button" className="vc-close" onClick={close} aria-label={labels.close}>
                    <CloseIcon />
                  </button>
                  <p className="vc-d-meta" aria-hidden="true">
                    {pad(openIdx + 1)} / {pad(count)}
                    <span>{labels.sideA}</span>
                  </p>
                  <h3 className="vc-d-title" id={dialogTitleId}>{picked.title}</h3>
                  {picked.subtitle && <p className="vc-d-sub">{picked.subtitle}</p>}
                  {picked.description && <p className="vc-d-desc" id={dialogDescId}>{picked.description}</p>}
                  {showCta && (
                    <div className="vc-d-actions">
                      {picked.href ? (
                        <a className="vc-cta" href={picked.href} onClick={(e) => onCta(e, picked)}>
                          <span>{picked.cta || labels.cta}</span>
                          <ArrowIcon />
                        </a>
                      ) : (
                        <button type="button" className="vc-cta" onClick={(e) => onCta(e, picked)}
                                aria-busy={ctaBusy || undefined} aria-disabled={ctaBusy || undefined}>
                          <span>{ctaBusy ? labels.busy : picked.cta || labels.cta}</span>
                          {ctaBusy ? <span className="vc-spinner" aria-hidden="true" /> : <ArrowIcon />}
                        </button>
                      )}
                    </div>
                  )}
                  {ctaError && <p className="vc-d-error" role="alert">{ctaError}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ============================ CONTROLS ============================= */}
          <div className="vc-bar" ref={barRef}>
            <div className="vc-now" aria-hidden="true">
              <span className="vc-count"><b>{pad(index + 1)}</b> / {pad(count)}</span>
              <span className="vc-now-text">
                <span className="vc-now-title">{current.title}</span>
                {current.subtitle && <span className="vc-now-sub">{current.subtitle}</span>}
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

          <p className="vc-sr" role="status" aria-live="polite">{announcement}</p>
        </div>
      </section>
    </MotionConfig>
  );
}
