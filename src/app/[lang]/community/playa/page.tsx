"use client";

import React, { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { loadBeachState, saveBeachState, saveBeachName } from "../../../../actions/playa";
import { useProgress } from "../../../../context/ProgressContext";
import { toast as sonnerToast } from "sonner";

/* =====================================================================
   Tiko Playa v2 — Modern HTML5 Canvas 2D Isometric Engine
   100% Anti-Flattening on Safari / iOS WebKit, Butter-smooth 60fps
   ===================================================================== */

const N = 25, HW = 32, HH = 16; // Grid size, half tile width/height (world units)
const iso = (c: number, r: number) => ({ x: (c - r) * HW, y: (c + r) * HH });
const unIso = (x: number, y: number) => ({ c: (x / HW + y / HH) / 2, r: (y / HH - x / HW) / 2 });
const esc = (s: any) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e5 ? Math.floor(n / 1e3) + 'k' : Math.round(n).toLocaleString('en-US');

function mulberry32(a: number) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- Catalog & Building Definitions ---------- */
interface BuildingDef {
  es: string;
  en: string;
  w: number;
  h: number;
  cost: number;
  attract: number;
  cat: 'lodging' | 'food' | 'fun' | 'eco';
  cap: number;
  pol: number;
  fit: number;
}

const B: Record<string, BuildingDef> = {
  sombrilla:   { es: 'Sombrilla', en: 'Umbrella', w: 1, h: 1, cost: 100, attract: 2, cat: 'fun', cap: 15, pol: 1, fit: 1.2 },
  palmera:     { es: 'Palmera', en: 'Palm Tree', w: 1, h: 1, cost: 50, attract: 3, cat: 'eco', cap: 0, pol: -5, fit: 1.35 },
  pipas:       { es: 'Pipas y Copos', en: 'Coconut Water', w: 2, h: 1, cost: 150, attract: 5, cat: 'food', cap: 20, pol: 4, fit: .95 },
  soda:        { es: 'Soda', en: 'Diner', w: 2, h: 2, cost: 300, attract: 10, cat: 'food', cap: 60, pol: 10, fit: 1.04 },
  restaurante: { es: 'Restaurante', en: 'Restaurant', w: 3, h: 3, cost: 1200, attract: 50, cat: 'food', cap: 250, pol: 25, fit: 1.04 },
  cabanas:     { es: 'Cabañas', en: 'Cabins', w: 2, h: 2, cost: 1500, attract: 60, cat: 'lodging', cap: 120, pol: 12, fit: 1.04 },
  hotel:       { es: 'Hotel Boutique', en: 'Boutique Hotel', w: 3, h: 3, cost: 6000, attract: 300, cat: 'lodging', cap: 600, pol: 35, fit: 1.04 },
  deportes:    { es: 'Alquiler Deportes', en: 'Sports Rental', w: 2, h: 2, cost: 400, attract: 20, cat: 'fun', cap: 40, pol: 10, fit: 1.04 },
  surf:        { es: 'Lecciones Surf', en: 'Surf Lessons', w: 2, h: 2, cost: 350, attract: 15, cat: 'fun', cap: 30, pol: 5, fit: 1.04 },
  artesanias:  { es: 'Artesanías', en: 'Crafts', w: 2, h: 1, cost: 200, attract: 8, cat: 'fun', cap: 20, pol: 5, fit: 1.02 },
  inflable:    { es: 'Parque Inflable', en: 'Inflatable Park', w: 2, h: 2, cost: 1000, attract: 45, cat: 'fun', cap: 120, pol: 8, fit: 1.04 },
  reciclaje1:  { es: 'Punto Ecológico', en: 'Eco Point', w: 1, h: 1, cost: 150, attract: 5, cat: 'eco', cap: 0, pol: -15, fit: 1.2 },
  reciclaje2:  { es: 'Centro Reciclaje', en: 'Recycling Center', w: 1, h: 1, cost: 150, attract: 10, cat: 'eco', cap: 0, pol: -35, fit: 1.2 },
};

const ORDER = Object.keys(B);

const CAT = {
  lodging: { col: '#2563eb', bg: '#dbeafe', ic: 'bed' },
  food:    { col: '#ea580c', bg: '#ffedd5', ic: 'food' },
  fun:     { col: '#7c3aed', bg: '#ede9fe', ic: 'wave' },
  eco:     { col: '#15803d', bg: '#dcfce7', ic: 'leaf' },
};

/* Sprite metrics: [imgW, imgH, x0, y0, w, h of the opaque area] */
const SP: Record<string, number[]> = {
  sombrilla:   [512, 468, 94, 89, 331, 307],
  palmera:     [512, 512, 104, 60, 349, 411],
  pipas:       [512, 512, 46, 10, 442, 481],
  soda:        [512, 468, 10, 11, 497, 428],
  restaurante: [512, 341, 24, 9, 471, 331],
  cabanas:     [512, 341, 15, 1, 486, 324],
  hotel:       [512, 341, 23, 5, 472, 335],
  deportes:    [512, 341, 12, 0, 488, 329],
  surf:        [512, 341, 14, 4, 492, 329],
  artesanias:  [512, 341, 18, 4, 487, 331],
  inflable:    [512, 426, 24, 11, 477, 410],
  reciclaje1:  [512, 426, 10, 28, 493, 398],
  reciclaje2:  [512, 426, 5, 17, 501, 401],
  rotulo1:     [300, 250, 76, 61, 159, 164],
  rotulo2:     [300, 246, 47, 21, 226, 220],
  rotulo3:     [300, 250, 30, 18, 264, 223],
  rotulo4:     [300, 250, 26, 11, 269, 235],
  rotulo5:     [300, 250, 19, 6, 279, 240],
  rotulo6:     [300, 250, 20, 14, 279, 234],
};

const SRC = (n: string) => `/assets/playa/${n}.png`;

const SIGN_TIPS: Record<string, { es: string; en: string }> = {
  rotulo1: { es: 'Recicla cada material en su respectivo recipiente', en: 'Recycle each material in its respective bin' },
  rotulo2: { es: 'Mantén la playa limpia, llévate tu basura', en: 'Keep the beach clean, take your trash with you' },
  rotulo3: { es: 'Protege a las tortugas marinas', en: 'Protect sea turtles' },
  rotulo4: { es: 'Disfruta la playa y ayúdanos a cuidarla', en: 'Enjoy the beach and help us care for it' },
  rotulo5: { es: 'Respeta la fauna silvestre', en: 'Respect wildlife' },
  rotulo6: { es: 'Usa bloqueador amigable con corales', en: 'Use reef-friendly sunscreen' },
};

/* ---------- i18n Translations ---------- */
const L: Record<string, Record<string, string>> = {
  en: {
    tiko: 'TIKO BEACH', beach: 'Beach', back: 'Back to Community', tik: 'Tikolones', vis: 'Visitors', att: 'Appeal', pol: 'Pollution',
    per10: '/ 10s', all: 'All', lodging: 'Lodging', food: 'Food', fun: 'Fun', eco: 'Eco',
    build: 'Build', cancel: 'Cancel', done: 'Done', move: 'Move', sell: 'Sell', confirmSell: 'Confirm', placeHere: 'Place here',
    hintDrag: 'Drag the building or tap the sand to position it.', hintTaken: 'That spot is taken or off the beach.',
    hintPoor: 'You need {n} more Tikolones.', hintAgain: 'Tap the sand to place another one.',
    hintMove: 'Drag it to its new spot. Moving is free.', hintSel: 'Move it for free, or sell it back for half its price.',
    built: '{n} built!', sold: 'Sold! +{n} Tikolones back.', moved: 'Moved!', broke: 'Out of Tikolones for another {n}.',
    capFood: 'Your visitors are hungry and the food spots are full! Build more Food.',
    capLodging: 'Your lodging is full. Build more Cabins or Hotels to receive more visitors.',
    capFun: 'The beach is boring. Build more Fun (Surf, Sports) to keep visitors!',
    welcome: 'Welcome! Pick something below, then tap the sand to place it.',
    rename: 'Name your beach', save: 'Save',
    help: 'How to play', r1: '<b>Build.</b> Pick a building, drag it into place and tap Build.',
    r2: '<b>Appeal</b> brings visitors. Visitors pay you Tikolones every 10 seconds.',
    r3: '<b>Keep up with demand.</b> If lodging, food or fun fills up, visitors start leaving.',
    r4: '<b>Stay clean.</b> Pollution lowers appeal. Palms and recycling points clear it.',
    r5: '<b>Leave room.</b> Once more than 40% of the sand is built on, appeal drops.',
    r6: '<b>Rearrange any time.</b> Tap a building to move it for free or sell it for 50%.',
    language: 'Language', demo: 'Load demo beach', reset: 'Start over', resetSure: 'Tap again to erase',
    report: 'Beach report', income: 'Income', arrivals: 'New visitors', perMin: 'about {n} per minute', leaving: 'Leaving: 5% every 10s',
    none: 'None yet', baseAtt: 'Appeal from buildings', modPol: 'Pollution ({n})', modOver: 'Overcrowding', modDens: 'Crowded sand ({n}% built)',
    effAtt: 'Appeal after penalties', capacity: 'Capacity', soundOn: 'Sound on', soundOff: 'Sound off', demoLoaded: 'Demo beach loaded.',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', center: 'Center the beach', close: 'Close'
  },
  es: {
    tiko: 'TIKO PLAYA', beach: 'Playa', back: 'Volver a Comunidad', tik: 'Tikolones', vis: 'Visitantes', att: 'Atractivo', pol: 'Contamin.',
    per10: '/ 10s', all: 'Todo', lodging: 'Hospedaje', food: 'Comida', fun: 'Diversión', eco: 'Eco',
    build: 'Construir', cancel: 'Cancelar', done: 'Listo', move: 'Mover', sell: 'Vender', confirmSell: 'Confirmar', placeHere: 'Colocar aquí',
    hintDrag: 'Arrastra el edificio o toca la arena para ubicarlo.', hintTaken: 'Ese espacio está ocupado o fuera de la playa.',
    hintPoor: 'Te faltan {n} Tikolones.', hintAgain: 'Toca la arena para colocar otro.',
    hintMove: 'Arrástralo a su nuevo lugar. Mover es gratis.', hintSel: 'Muévelo gratis o véndelo por la mitad de su precio.',
    built: '¡{n} listo!', sold: '¡Vendido! +{n} Tikolones de vuelta.', moved: '¡Reubicado!', broke: 'No alcanzan los Tikolones para otro {n}.',
    capFood: '¡Tus visitantes tienen hambre y la soda/restaurante está llena! Construye más Alimentación.',
    capLodging: 'Tus hospedajes están llenos. Construye más Cabañas u Hoteles para recibir más visitantes.',
    capFun: 'La playa está aburrida. ¡Construye más Entretenimiento (Surf, Deportes) para retener visitantes!',
    welcome: '¡Pura vida! Elige algo abajo y toca la arena para colocarlo.',
    rename: 'Ponle nombre a tu playa', save: 'Guardar',
    help: 'Cómo jugar', r1: '<b>Construye.</b> Elige un edificio, arrástralo a su lugar y toca Construir.',
    r2: '<b>El atractivo</b> trae visitantes. Los visitantes te pagan Tikolones cada 10 segundos.',
    r3: '<b>Atiende la demanda.</b> Si el hospedaje, la comida o la diversión se llenan, los visitantes se van.',
    r4: '<b>Mantén limpio.</b> La contaminación baja el atractivo. Las palmeras y puntos de reciclaje la reducen.',
    r5: '<b>Deja espacio.</b> Si construyes en más del 40% de la arena, el atractivo baja.',
    r6: '<b>Reorganiza cuando quieras.</b> Toca un edificio para moverlo gratis o venderlo al 50%.',
    language: 'Idioma', demo: 'Cargar playa de ejemplo', reset: 'Empezar de cero', resetSure: 'Toca otra vez para borrar',
    report: 'Informe de la playa', income: 'Ingresos', arrivals: 'Nuevos visitantes', perMin: 'cerca de {n} por minuto', leaving: 'Se van: 5% cada 10s',
    none: 'Ninguno aún', baseAtt: 'Atractivo de los edificios', modPol: 'Contaminación ({n})', modOver: 'Sobrecupo', modDens: 'Arena saturada ({n}% construido)',
    effAtt: 'Atractivo con penalizaciones', capacity: 'Capacidad', soundOn: 'Sonido activado', soundOff: 'Sonido desactivado', demoLoaded: 'Playa de ejemplo cargada.',
    zoomIn: 'Acercar', zoomOut: 'Alejar', center: 'Centrar la playa', close: 'Cerrar'
  }
};

/* SVG Icons */
const I: Record<string, string> = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/><path d="M19.2 6a8.5 8.5 0 010 12"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 114.8.9c-.5 1.3-2.4 1.6-2.4 3.2"/><path d="M12 17v.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  target: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>',
  move: '<path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19z"/>',
  bed: '<path d="M3 19V6M3 14h18v5M21 14v-2a3 3 0 00-3-3h-7v5"/><circle cx="7" cy="10.5" r="1.7"/>',
  food: '<path d="M7 3v18M4.5 3v4.5a2.5 2.5 0 005 0V3M16.5 21v-8c-1.7 0-2.5-1.2-2.5-3 0-3 1-5.2 2.5-7z"/>',
  wave: '<path d="M2 18c2 0 2-1.6 4-1.6s2 1.6 4 1.6 2-1.6 4-1.6 2 1.6 4 1.6 2-1.6 4-1.6"/><path d="M3 13c.6-5 4-8.5 9.5-8.5-2.2 2.2-2.6 4.6-.8 8.5"/>',
  leaf: '<path d="M5 19C5 10 10 5 20 5c0 10-5 15-14 14z"/><path d="M5 19c3-5.2 6.2-8 11-10"/>',
  person: '<circle cx="12" cy="7.5" r="3.8"/><path d="M4.5 20.5c.3-4.3 3.4-7 7.5-7s7.2 2.7 7.5 7z"/>',
  spark: '<path d="M12 2.5l2.3 6.2 6.2 2.3-6.2 2.3L12 19.5l-2.3-6.2L3.5 11l6.2-2.3z"/><path d="M19 16.5v4M17 18.5h4"/>',
  cloud: '<path d="M7 18.5a4.2 4.2 0 01-.7-8.3A5.6 5.6 0 0117 9a4.7 4.7 0 01.6 9.4z"/>',
  grid: '<path d="M12 4l8 4.5-8 4.5-8-4.5z"/><path d="M4 13l8 4.5 8-4.5"/>',
  coins: '<circle cx="9" cy="9" r="5.5"/><path d="M14.5 9.8a5.5 5.5 0 11-4.7 4.7"/>',
};

const ico = (n: string, style = '') => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="${style}">${I[n] || ''}</svg>`;
const fico = (n: string, col: string) => `<svg class="i" viewBox="0 0 24 24" fill="${col}" stroke="${col}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${I[n] || ''}</svg>`;
const COIN = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12.6" r="9.6" fill="#b45309"/><circle cx="12" cy="11.4" r="9.6" fill="#fbbf24"/><circle cx="12" cy="11.4" r="6.6" fill="none" stroke="#f59e0b" stroke-width="1.6"/><path d="M8.8 8.7h6.4M12 8.7v6.2" stroke="#92400e" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>`;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export default function TikoPlayaPage(props: { params: Promise<{ lang: string }> }) {
  const resolvedParams = use(props.params);
  const paramLang = (resolvedParams?.lang === 'en' ? 'en' : 'es');

  const { updateLocalXp, refreshGamification } = useProgress();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // App & Game State
  const [currentLang, setCurrentLang] = useState<string>(paramLang);
  const stateRef = useRef({
    name: 'Playa Tica',
    tik: 500,
    visitors: 0,
    items: [] as any[],
    sound: true,
    lang: paramLang,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    stateRef.current.lang = currentLang;
  }, [currentLang]);

  useEffect(() => {
    let animId: number;
    let tickTimer: any;
    let isMounted = true;

    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const $ = (s: string) => containerRef.current?.querySelector(s) as HTMLElement | null;

    let lang = currentLang;
    const t = (k: string, v?: Record<string, any>) => {
      let s = L[lang]?.[k] ?? L.es[k] ?? L.en[k] ?? k;
      if (v) for (const a in v) s = s.replace('{' + a + '}', v[a]);
      return s;
    };
    const bn = (type: string) => B[type]?.[lang as 'es' | 'en'] || B[type]?.es || type;

    // Sprite loader
    const ok = (im?: HTMLImageElement | null) => Boolean(im && im.complete && im.naturalWidth > 0);
    const IMG: Record<string, HTMLImageElement> = {};
    for (const n of [...Object.keys(SP), 'sand_pattern', 'water_caustics', 'otico']) {
      const im = new window.Image();
      im.src = SRC(n);
      IMG[n] = im;
    }

    // Grid collision map
    const occ = new Int16Array(N * N);
    const rebuild = () => {
      occ.fill(-1);
      stateRef.current.items.forEach((it, i) => {
        const b = B[it.type];
        if (!b) return;
        it.key = it.c + it.r + (b.w + b.h) / 2;
        for (let r = it.r; r < it.r + b.h; r++) {
          for (let c = it.c; c < it.c + b.w; c++) {
            if (r >= 0 && r < N && c >= 0 && c < N) occ[r * N + c] = i;
          }
        }
      });
      for (const w of walkers) {
        if (occ[w.fr * N + w.fc] >= 0 || occ[w.tr * N + w.tc] >= 0) {
          const sp = freeTile();
          if (sp) { w.fc = w.tc = sp.c; w.fr = w.tr = sp.r; w.p = 1; }
        }
      }
    };

    const canPlace = (type: string, c: number, r: number) => {
      const b = B[type];
      if (!b) return false;
      if (c < 0 || r < 0 || c + b.w > N || r + b.h > N) return false;
      for (let y = r; y < r + b.h; y++) {
        for (let x = c; x < c + b.w; x++) {
          if (occ[y * N + x] >= 0) return false;
        }
      }
      return true;
    };

    const freeTile = () => {
      for (let i = 0; i < 60; i++) {
        const c = (Math.random() * N) | 0, r = (Math.random() * N) | 0;
        if (occ[r * N + c] < 0) return { c, r };
      }
      return null;
    };

    const derive = () => {
      let o = 0, att = 0, pol = 0;
      const cap = { lodging: 0, food: 0, fun: 0 };
      for (const it of stateRef.current.items) {
        const b = B[it.type];
        if (!b) continue;
        o += b.w * b.h;
        att += b.attract;
        pol += b.pol;
        if (cap[b.cat as keyof typeof cap] != null) cap[b.cat as keyof typeof cap] += b.cap;
      }
      if (moving) {
        const b = B[moving.type];
        if (b) {
          o += b.w * b.h; att += b.attract; pol += b.pol;
          if (cap[b.cat as keyof typeof cap] != null) cap[b.cat as keyof typeof cap] += b.cap;
        }
      }
      const dens = o / (N * N);
      let df = 1;
      if (dens > .4) df = Math.max(0, 1 - (dens - .4) * 2.5);
      const caps = { lodging: 40 + cap.lodging, food: 40 + cap.food, fun: 40 + cap.fun };
      const v = stateRef.current.visitors;
      const over = { lodging: v > caps.lodging, food: v > caps.food, fun: v > caps.fun };
      const any = over.lodging || over.food || over.fun;
      const pollution = Math.max(0, pol);
      const pf = Math.max(.1, 1 - .005 * pollution);
      const eff = Math.floor(att * df * (any ? .1 : 1) * pf);
      return { dens, df, caps, over, any, att, pollution, pf, eff, income: Math.floor(2 * Math.pow(v, .4)) };
    };

    // Synthesized Sound Effects
    const snd = (kind: string) => {
      if (!stateRef.current.sound) return;
      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) audioContextRef.current = new AudioContextClass();
        }
        const AC = audioContextRef.current;
        if (!AC) return;
        if (AC.state === 'suspended') AC.resume();
        const a = AC.currentTime;
        const tone = (f: number, t0: number, d: number, type: OscillatorType = 'sine', g = 0.2, f2?: number) => {
          const o = AC.createOscillator(), G = AC.createGain();
          o.type = type;
          o.frequency.setValueAtTime(f, t0);
          if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
          G.gain.setValueAtTime(g, t0);
          G.gain.exponentialRampToValueAtTime(.001, t0 + d);
          o.connect(G); G.connect(AC.destination);
          o.start(t0); o.stop(t0 + d);
        };
        if (kind === 'build') {
          tone(320, a, .1, 'triangle', .26, 80);
          [659.25, 830.61, 987.77, 1318.51].forEach((f, i) => tone(f, a + .04 + .04 * i, .26, 'sine', .2));
        } else if (kind === 'tap') tone(620, a, .09, 'sine', .16);
        else if (kind === 'pick') tone(480, a, .08, 'sine', .18, 640);
        else if (kind === 'move') tone(300, a, .12, 'triangle', .2, 560);
        else if (kind === 'sell') [1318.51, 1975.53, 2637.02].forEach((f, i) => tone(f, a + .07 * i, .28, 'sine', .18));
        else if (kind === 'error') tone(360, a, .16, 'sawtooth', .12, 220);
        else if (kind === 'coin') [1046.5, 1568].forEach((f, i) => tone(f, a + .06 * i, .16, 'sine', .05));
        else if (kind === 'reward') [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone(f, a + .08 * i, .4, 'triangle', .18));
      } catch (e) {}
    };

    // Camera & Canvas Setup
    let vw = 0, vh = 0, dpr = 1;
    const cam = { x: -40, y: 430, z: .55 };
    let camT: { x: number; y: number; z?: number } | null = null;
    const ZMAX = 1.9;
    const zmin = () => Math.max(.3, Math.min(.6, vw / 1500));
    const clampCam = () => {
      cam.z = Math.min(ZMAX, Math.max(zmin(), cam.z));
      cam.x = Math.min(860, Math.max(-860, cam.x));
      cam.y = Math.min(880, Math.max(-60, cam.y));
    };

    const resize = () => {
      if (!cv) return;
      vw = window.innerWidth;
      vh = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(vw * dpr);
      cv.height = Math.round(vh * dpr);
      clampCam();
    };

    const s2w = (sx: number, sy: number) => ({ x: (sx - vw / 2) / cam.z + cam.x, y: (sy - vh / 2) / cam.z + cam.y });
    const w2s = (x: number, y: number) => ({ x: (x - cam.x) * cam.z + vw / 2, y: (y - cam.y) * cam.z + vh / 2 });
    const zoomAt = (sx: number, sy: number, nz: number) => {
      const w = s2w(sx, sy);
      cam.z = Math.min(ZMAX, Math.max(zmin(), nz));
      cam.x = w.x - (sx - vw / 2) / cam.z;
      cam.y = w.y - (sy - vh / 2) / cam.z;
      clampCam();
    };

    const dia = (ctx2: CanvasRenderingContext2D, c: number, r: number, w: number, h: number) => {
      let p = iso(c, r); ctx2.moveTo(p.x, p.y);
      p = iso(c + w, r); ctx2.lineTo(p.x, p.y);
      p = iso(c + w, r + h); ctx2.lineTo(p.x, p.y);
      p = iso(c, r + h); ctx2.lineTo(p.x, p.y);
      ctx2.closePath();
    };

    const band = (ctx2: CanvasRenderingContext2D, c0: number, c1: number, r0: number, r1: number) => {
      ctx2.beginPath();
      let p = iso(c0, r0); ctx2.moveTo(p.x, p.y);
      p = iso(c1, r0); ctx2.lineTo(p.x, p.y);
      p = iso(c1, r1); ctx2.lineTo(p.x, p.y);
      p = iso(c0, r1); ctx2.lineTo(p.x, p.y);
      ctx2.closePath();
    };

    const shoreGrad = (ctx2: CanvasRenderingContext2D, ra: number, rb: number) => {
      const P = iso(12.5, ra), d = 28.62 * (rb - ra);
      return ctx2.createLinearGradient(P.x, P.y, P.x - .4472 * d, P.y + .8944 * d);
    };

    const rrect = (ctx2: CanvasRenderingContext2D, X: number, Y: number, W: number, H: number, R: number) => {
      ctx2.beginPath();
      ctx2.moveTo(X + R, Y);
      ctx2.arcTo(X + W, Y, X + W, Y + H, R);
      ctx2.arcTo(X + W, Y + H, X, Y + H, R);
      ctx2.arcTo(X, Y + H, X, Y, R);
      ctx2.arcTo(X, Y, X + W, Y, R);
      ctx2.closePath();
    };

    // Procedural Patterns & Sand Diamond
    const PAT: Record<string, any> = {};
    const makeCanopy = () => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d')!; const R = mulberry32(3);
      x.fillStyle = '#0d4526'; x.fillRect(0, 0, 256, 256);
      const bl: { x: number; y: number; r: number }[] = [];
      for (let i = 0; i < 64; i++) bl.push({ x: R() * 256, y: R() * 256, r: 17 + R() * 17 });
      bl.sort((a, b) => a.y - b.y);
      for (const b of bl) {
        for (const dx of [-256, 0, 256]) {
          for (const dy of [-256, 0, 256]) {
            const X = b.x + dx, Y = b.y + dy;
            if (X < -40 || X > 296 || Y < -40 || Y > 296) continue;
            const g = x.createRadialGradient(X - b.r * .3, Y - b.r * .35, 1, X, Y, b.r);
            g.addColorStop(0, '#2f9a56'); g.addColorStop(.6, '#176b3b'); g.addColorStop(1, '#0b3f22');
            x.fillStyle = g; x.beginPath(); x.arc(X, Y, b.r, 0, 7); x.fill();
          }
        }
      }
      return c;
    };

    const makeSandTile = () => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d')!;
      x.fillStyle = '#f1d188'; x.fillRect(0, 0, 256, 256);
      if (ok(IMG.sand_pattern)) {
        x.globalAlpha = .6;
        x.drawImage(IMG.sand_pattern, 0, 0, 256, 256);
      }
      return c;
    };

    const makeBush = (seed: number) => {
      const R = mulberry32(seed), c = document.createElement('canvas');
      c.width = 160; c.height = 130;
      const x = c.getContext('2d')!;
      x.fillStyle = 'rgba(6,36,18,.38)'; x.beginPath(); x.ellipse(80, 112, 64, 14, 0, 0, 7); x.fill();
      const bl: { x: number; y: number; r: number }[] = [];
      for (let i = 0; i < 9; i++) bl.push({ x: 42 + R() * 76, y: 42 + R() * 44, r: 20 + R() * 15 });
      bl.sort((a, b) => a.y - b.y);
      for (const b of bl) {
        const g = x.createRadialGradient(b.x - b.r * .3, b.y - b.r * .4, 2, b.x, b.y, b.r);
        g.addColorStop(0, '#63db7e'); g.addColorStop(.55, '#23994c'); g.addColorStop(1, '#0e5a2c');
        x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill();
        x.strokeStyle = 'rgba(5,48,22,.55)'; x.lineWidth = 2.5; x.stroke();
      }
      const fc = ['#ff5247', '#ffd447', '#ff7fb0'][seed % 3];
      for (let i = 0, n = 2 + (R() * 4 | 0); i < n; i++) {
        const X = 40 + R() * 80, Y = 50 + R() * 50;
        x.fillStyle = fc;
        for (let k = 0; k < 5; k++) {
          x.beginPath(); x.arc(X + Math.cos(k * 1.257) * 4, Y + Math.sin(k * 1.257) * 4, 3.4, 0, 7); x.fill();
        }
        x.fillStyle = '#fff3b0'; x.beginPath(); x.arc(X, Y, 2.4, 0, 7); x.fill();
      }
      return c;
    };
    const BUSH = [11, 12, 13, 14].map(makeBush);

    const SANDC = document.createElement('canvas'), SS = 1.5;
    const bakeSand = () => {
      SANDC.width = 1600 * SS; SANDC.height = 800 * SS;
      const x = SANDC.getContext('2d')!;
      x.setTransform(SS, 0, 0, SS, 800 * SS, 0);
      const R = mulberry32(21);
      x.save(); x.beginPath(); dia(x, 0, 0, N, N); x.clip();
      x.fillStyle = x.createPattern(PAT.sandTile, 'repeat') || '#f1d188';
      x.fillRect(-800, 0, 1600, 800);
      let g = x.createRadialGradient(0, 330, 40, 0, 400, 780);
      g.addColorStop(0, 'rgba(255,247,216,.55)'); g.addColorStop(1, 'rgba(255,247,216,0)');
      x.fillStyle = g; x.fillRect(-800, 0, 1600, 800);
      for (let i = 0; i < 3600; i++) {
        const p = iso(R() * N, R() * N);
        x.fillStyle = R() < .5 ? 'rgba(255,255,255,.4)' : 'rgba(140,92,36,.22)';
        x.fillRect(p.x, p.y, 1 + R() * 1.3, 1);
      }
      x.lineCap = 'round';
      for (let i = 0; i < 70; i++) {
        const cc = R() * N, rr = R() * N, len = 1 + R() * 2.6;
        x.beginPath();
        for (let s = 0; s <= 6; s++) {
          const u = s / 6, p = iso(cc + u * len, rr + Math.sin(u * 6 + i) * .09);
          s ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y);
        }
        x.strokeStyle = i % 2 ? 'rgba(255,255,255,.26)' : 'rgba(150,100,45,.14)';
        x.lineWidth = 1.5; x.stroke();
      }
      const edge = (a: { x: number; y: number }, b: { x: number; y: number }, k: number) => {
        for (const [w, al] of [[110, .06], [64, .08], [30, .1]]) {
          x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y);
          x.strokeStyle = `rgba(96,62,14,${al * k})`; x.lineWidth = w; x.stroke();
        }
      };
      edge(iso(0, 0), iso(0, N), 1);
      edge(iso(0, 0), iso(N, 0), 1);
      edge(iso(N, 0), iso(N, N), .7);

      for (let i = 0; i < 52; i++) {
        const p = iso(.6 + R() * 23.8, R() < .6 ? 16 + R() * 8.2 : R() * 24), k = R();
        if (k < .38) {
          x.fillStyle = '#fff6ee'; x.strokeStyle = '#dfae96'; x.lineWidth = .8;
          x.beginPath(); x.arc(p.x, p.y, 3.4, Math.PI, 0); x.lineTo(p.x, p.y + 2.6); x.closePath();
          x.fill(); x.stroke();
          for (let q = -2; q <= 2; q++) {
            x.beginPath(); x.moveTo(p.x, p.y + 2.2); x.lineTo(p.x + q * 1.5, p.y - 2.6); x.stroke();
          }
        } else if (k < .6) {
          x.fillStyle = '#ff8d4f'; x.strokeStyle = '#d6612a'; x.lineWidth = .8;
          x.beginPath(); const a0 = R() * 6;
          for (let q = 0; q < 10; q++) {
            const rad = q % 2 ? 1.9 : 4.6, a = a0 + q * Math.PI / 5;
            x.lineTo(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad * .62);
          }
          x.closePath(); x.fill(); x.stroke();
        } else {
          x.fillStyle = 'rgba(168,154,134,.85)';
          x.beginPath(); x.ellipse(p.x, p.y, 2 + R() * 2.4, 1.3 + R(), 0, 0, 7); x.fill();
          x.fillStyle = 'rgba(255,255,255,.5)';
          x.beginPath(); x.ellipse(p.x - .6, p.y - .5, .9, .5, 0, 0, 7); x.fill();
        }
      }
      x.restore();
    };

    // Decor & Perimeter Signs
    const DECOR = (() => {
      const R = mulberry32(7), out: any[] = [], j = () => (R() - .5) * .62;
      const add = (c: number, r: number, d: number, low = false) => {
        const palm = R() < (d < 1.15 ? (low ? 0 : .3) : .6);
        out.push({ k: palm ? 'palm' : 'bush', c, r, s: palm ? .85 + R() * .6 : .8 + R() * .7, v: (R() * 4) | 0, f: R() < .5, key: c + r });
      };
      for (let r = -4.5; r < 23; r += 1.05) for (let c = -4.3; c < -.3; c += 1) { if (R() < .1) continue; const cc = c + j(), rr = r + j(); if (cc > -.38) continue; add(cc, rr, -cc); }
      for (let c = -.2; c < 29.6; c += 1.05) for (let r = -4.3; r < -.3; r += 1) { if (R() < .1) continue; const cc = c + j(), rr = r + j(); if (rr > -.38) continue; add(cc, rr, -rr); }
      for (let r = -.2; r < 23; r += 1.05) for (let c = 25.4; c < 29.5; c += 1) { if (R() < .1) continue; const cc = c + j(), rr = r + j(); if (cc < 25.42) continue; add(cc, rr, cc - 25, true); }
      for (let c = -26; c < 52; c += .95) { if (c > -4.4 && c < 29.6) continue; for (let r = 20.4; r < 23.1; r += .9) add(c + j(), r + j() * .6, 23.3 - r); }
      [['rotulo1', 3.4, -.72], ['rotulo2', 9.4, -.72], ['rotulo3', 15.4, -.72], ['rotulo4', 21.4, -.72], ['rotulo5', -.72, 4.6], ['rotulo6', -.72, 11.6], ['rotulo2', -.72, 18.4]]
        .forEach(([n, c, r]) => out.push({ k: 'sign', n, c, r, key: (c as number) + (r as number) + .4 }));
      return out.sort((a, b) => a.key - b.key);
    })();

    const drawSprite = (n: string, cx: number, by: number, dw: number, flip = false) => {
      const im = IMG[n], m = SP[n];
      if (!ok(im) || !m) return;
      const dh = m[5] * dw / m[4];
      if (flip) {
        ctx.save();
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(im, m[2], m[3], m[4], m[5], -dw / 2, by - dh, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(im, m[2], m[3], m[4], m[5], cx - dw / 2, by - dh, dw, dh);
      }
    };

    const geom = (type: string, c: number, r: number) => {
      const b = B[type] || { w: 1, h: 1, fit: 1.04 }, dw = (b.w + b.h) * HW * (b.fit || 1.04), m = SP[type] || [512, 512, 0, 0, 512, 512];
      return { cx: (c - r + (b.w - b.h) / 2) * HW, by: (c + b.w + r + b.h) * HH + dw * .012, dw, dh: m[5] * dw / m[4] };
    };

    const easeBack = (u: number) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
    };

    // Visitors walking the beach
    const walkers: any[] = [];
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const WC = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const SK = ['#f6c9a0', '#e0a877', '#c68b59', '#8d5a3b'];
    const HT = ['#fff', '#fde68a', '#fca5a5', '#93c5fd', '#3a2817'];

    const stepWalkers = (dt: number) => {
      const want = Math.min(36, stateRef.current.visitors);
      while (walkers.length < want) {
        const sp = freeTile();
        if (!sp) break;
        walkers.push({
          wk: 1, fc: sp.c, fr: sp.r, tc: sp.c, tr: sp.r, p: 1, dir: DIRS[(Math.random() * 4) | 0],
          c: sp.c + .5, r: sp.r + .5,
          col: (Math.random() * WC.length) | 0, skin: (Math.random() * SK.length) | 0, hat: (Math.random() * HT.length) | 0,
          ph: Math.random() * 7, sp: .55 + Math.random() * .55, wait: Math.random() * 2
        });
      }
      if (walkers.length > want) walkers.length = want;
      for (const w of walkers) {
        if (w.wait > 0) {
          w.wait -= dt;
        } else {
          w.p += dt * w.sp;
          if (w.p >= 1) {
            w.fc = w.tc; w.fr = w.tr; w.p = 0;
            const o = [];
            for (const d of DIRS) {
              const nc = w.fc + d[0], nr = w.fr + d[1];
              if (nc < 0 || nr < 0 || nc >= N || nr >= N || occ[nr * N + nc] >= 0) continue;
              o.push(d);
            }
            if (!o.length) {
              w.wait = 1.5; w.p = 1;
            } else {
              const fwd = o.find(d => d === w.dir);
              let pk;
              if (fwd && Math.random() < .72) pk = fwd;
              else {
                const nb = o.filter(d => !(d[0] === -w.dir[0] && d[1] === -w.dir[1]));
                const a = nb.length ? nb : o;
                pk = a[(Math.random() * a.length) | 0];
              }
              w.dir = pk; w.tc = w.fc + pk[0]; w.tr = w.fr + pk[1];
              if (Math.random() < .1) w.wait = 1 + Math.random() * 3.5;
            }
          }
        }
        w.c = w.fc + .5 + (w.tc - w.fc) * w.p;
        w.r = w.fr + .5 + (w.tr - w.fr) * w.p;
        w.key = w.c + w.r;
      }
    };

    const drawWalker = (w: any, t2: number) => {
      const p = iso(w.c, w.r), mv = w.wait > 0 ? 0 : 1;
      const bob = mv * Math.abs(Math.sin(t2 * 9 + w.ph)) * 1.7;
      const x = p.x, y = p.y - bob;
      const sw = mv * Math.sin(t2 * 9 + w.ph) * 1.6;
      ctx.fillStyle = 'rgba(60,35,10,.24)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + .5, 6, 2.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a4332'; ctx.fillRect(x - 3.2 + sw * .4, y - 6.5, 2.6, 6.5); ctx.fillRect(x + .6 - sw * .4, y - 6.5, 2.6, 6.5);
      ctx.fillStyle = WC[w.col]; rrect(ctx, x - 4.6, y - 15.5, 9.2, 10.2, 3.2); ctx.fill();
      ctx.fillStyle = SK[w.skin]; ctx.beginPath(); ctx.arc(x, y - 18.8, 4.2, 0, 7); ctx.fill();
      ctx.fillStyle = HT[w.hat]; ctx.beginPath(); ctx.ellipse(x, y - 21, 5.8, 1.9, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 21.3, 3.4, Math.PI, 0); ctx.fill();
    };

    // Gulls, Burst, and Floating Coin FX
    const gulls = [0, 1, 2, 3].map(i => ({
      x: -900 + Math.random() * 1800, y: 150 + Math.random() * 700,
      vx: (20 + Math.random() * 16) * (i % 2 ? 1 : -1),
      vy: 8 * (Math.random() - .5),
      ph: Math.random() * 6
    }));
    const fx: any[] = [];
    const BORN = new Map<string, number>();

    const coinPop = (wx: number, wy: number, txt: string) => {
      fx.push({ k: 'coin', x: wx, y: wy, t0: performance.now(), txt });
    };
    const burst = (wx: number, wy: number) => {
      fx.push({ k: 'burst', x: wx, y: wy, t0: performance.now() });
    };

    // Interaction State
    let mode = 'idle';
    let placing: string | null = null;
    let moving: any = null;
    let selected: any = null;
    let ghost: any = null;
    let sellArmed = false;
    let tickAcc = 0;
    let lastWarn = 0;

    // Database Sync Helper
    const syncDb = async (lifetimeDelta = 0) => {
      let localUsername = localStorage.getItem('localUsername') || undefined;
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        } catch (e) {}
      }
      try {
        const dbItems = stateRef.current.items.map(it => ({
          id: it.id,
          type: it.type,
          c: it.c,
          r: it.r,
          col: it.c,
          row: it.r,
        }));
        const saveRes = await saveBeachState(
          dbItems,
          stateRef.current.tik,
          stateRef.current.visitors,
          lifetimeDelta,
          localUsername
        );
        if (saveRes && saveRes.success && saveRes.xpAwarded && saveRes.xpAwarded > 0) {
          snd('reward');
          if (updateLocalXp && saveRes.newTotalXp !== undefined && saveRes.newLevel !== undefined) {
            updateLocalXp(saveRes.newTotalXp, saveRes.newLevel);
          }
          if (refreshGamification) refreshGamification();
          sonnerToast.success(lang === 'en' ? `Milestone Reached! +${saveRes.xpAwarded} XP for your beach.` : `¡Hito Alcanzado! +${saveRes.xpAwarded} XP para tu playa.`, { icon: '🌟' });
        }
      } catch (err) {
        console.warn("Error auto-guardando playa:", err);
      }
    };

    // Main Draw Function
    const draw = (now: number) => {
      const t2 = now / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0d4526';
      ctx.fillRect(0, 0, cv.width, cv.height);

      const k = dpr * cam.z;
      ctx.setTransform(k, 0, 0, k, dpr * (vw / 2 - cam.x * cam.z), dpr * (vh / 2 - cam.y * cam.z));
      const A = s2w(0, 0), Z = s2w(vw, vh), X0 = A.x, Y0 = A.y, X1 = Z.x, Y1 = Z.y;
      const VW = X1 - X0, VH = Y1 - Y0;
      const q = [unIso(X0, Y0), unIso(X1, Y0), unIso(X0, Y1), unIso(X1, Y1)];
      const c0 = Math.floor(Math.min(q[0].c, q[1].c, q[2].c, q[3].c)) - 1;
      const c1 = Math.ceil(Math.max(q[0].c, q[1].c, q[2].c, q[3].c)) + 1;
      const r1 = Math.max(q[0].r, q[1].r, q[2].r, q[3].r) + 2;

      // 1. Jungle Canopy
      if (PAT.canopy) {
        ctx.fillStyle = PAT.canopy;
        ctx.fillRect(X0, Y0, VW, VH);
      }
      ctx.fillStyle = 'rgba(4,30,16,.3)';
      ctx.fillRect(X0, Y0, VW, VH);

      // 2. Ocean
      if (r1 > 25) {
        band(ctx, c0, c1, 25, r1);
        let g = shoreGrad(ctx, 25, 49);
        g.addColorStop(0, '#9aeedd'); g.addColorStop(.05, '#57d9d1'); g.addColorStop(.18, '#25bcd0'); g.addColorStop(.48, '#1593c6'); g.addColorStop(1, '#0a5c9c');
        ctx.fillStyle = g;
        ctx.fill();

        if (PAT.caust) {
          ctx.save();
          ctx.clip();
          ctx.globalAlpha = .3;
          ctx.globalCompositeOperation = 'screen';
          PAT.caust.setTransform(new DOMMatrix([.55, .275, -.55, .275, (t2 * 10) % 2816, (t2 * 6) % 2816]));
          ctx.fillStyle = PAT.caust;
          ctx.fillRect(X0, Y0, VW, VH);
          ctx.restore();
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < 4; i++) {
          const ph = (t2 * .085 + i / 4) % 1, rr = 25.5 + (1 - ph) * 7, al = Math.sin(Math.PI * ph) * .5;
          ctx.beginPath();
          for (let c = c0; c <= c1; c += .75) {
            const p = iso(c, rr + .22 * Math.sin(c * .6 + i * 2.1 + t2 * .7));
            c === c0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          }
          ctx.setLineDash([46, 30, 90, 24, 22, 40]);
          ctx.lineDashOffset = i * 53 + t2 * 4;
          ctx.strokeStyle = `rgba(255,255,255,${al})`;
          ctx.lineWidth = 2.4;
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // 3. Sand & Coast
      band(ctx, c0, c1, 23.3, 25);
      ctx.fillStyle = PAT.sand || '#f1d188';
      ctx.fill();

      band(ctx, c0, c1, 23.3, 23.75);
      {
        const g = shoreGrad(ctx, 23.3, 23.75);
        g.addColorStop(0, 'rgba(20,70,30,.34)');
        g.addColorStop(1, 'rgba(20,70,30,0)');
        ctx.fillStyle = g; ctx.fill();
      }

      if (SANDC.width > 1) {
        ctx.drawImage(SANDC, -800, 0, 1600, 800);
      }

      // 4. Wet Sand, Swash & Foam
      band(ctx, c0, c1, 24.25, 25.02);
      {
        const g = shoreGrad(ctx, 24.25, 25);
        g.addColorStop(0, 'rgba(150,100,48,0)');
        g.addColorStop(1, 'rgba(140,96,48,.46)');
        ctx.fillStyle = g; ctx.fill();
      }

      const edge = (c: number) => 24.8 + .17 * Math.sin(t2 * .9 + c * .5) + .06 * Math.sin(t2 * 1.9 + c * 1.7);
      ctx.beginPath();
      for (let c = c0; c <= c1; c += .5) {
        const p = iso(c, edge(c));
        c === c0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      {
        let p = iso(c1, 25.5); ctx.lineTo(p.x, p.y);
        p = iso(c0, 25.5); ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(120,228,214,.62)';
        ctx.fill();
      }

      for (const [off, al, lw] of [[0, .95, 3], [.16, .5, 1.6], [.34, .28, 1.2]]) {
        ctx.beginPath();
        for (let c = c0; c <= c1; c += .5) {
          const p = iso(c, edge(c) + off + .03 * Math.sin(c * 2.3 + t2));
          c === c0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${al})`;
        ctx.lineWidth = lw;
        ctx.stroke();
      }

      // 5. Grid for Building/Moving
      if (mode === 'place' || mode === 'move') {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          let a = iso(i, 0), b = iso(i, N);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          a = iso(0, i); b = iso(N, i);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,.42)';
        ctx.lineWidth = Math.max(.6, 1 / cam.z * .8);
        ctx.stroke();
        ctx.beginPath();
        dia(ctx, 0, 0, N, N);
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 6. Ground Shadows
      ctx.fillStyle = 'rgba(70,42,8,.2)';
      for (const it of stateRef.current.items) {
        const b = B[it.type];
        if (!b) continue;
        ctx.beginPath();
        dia(ctx, it.c - .06, it.r - .06, b.w + .2, b.h + .2);
        ctx.fill();
      }

      if (selected) {
        const b = B[selected.type];
        if (b) {
          const pad = .34 + .05 * Math.sin(t2 * 5);
          ctx.beginPath();
          dia(ctx, selected.c - pad, selected.r - pad, b.w + pad * 2, b.h + pad * 2);
          ctx.fillStyle = 'rgba(251,191,36,.55)';
          ctx.fill();
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -t2 * 20;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2.6;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 7. Depth Sorted Objects (Decor, Walkers, Buildings)
      const list: any[] = [];
      for (const d of DECOR) {
        const p = iso(d.c, d.r);
        if (p.x < X0 - 70 || p.x > X1 + 70 || p.y < Y0 - 10 || p.y > Y1 + 150) continue;
        list.push(d);
      }
      for (const it of stateRef.current.items) list.push(it);
      for (const w of walkers) list.push(w);
      list.sort((a, b) => a.key - b.key);

      for (const o of list) {
        if (o.wk) {
          drawWalker(o, t2);
        } else if (o.k === 'bush') {
          const p = iso(o.c, o.r), w = 50 * o.s;
          ctx.drawImage(BUSH[o.v], p.x - w / 2, p.y - w * .72, w, w * .8125);
        } else if (o.k === 'palm') {
          const p = iso(o.c, o.r);
          drawSprite('palmera', p.x, p.y + 8, 64 * 1.25 * o.s, o.f);
        } else if (o.k === 'sign') {
          const p = iso(o.c, o.r);
          drawSprite(o.n, p.x, p.y + 6, 60, false);
        } else {
          const g = geom(o.type, o.c, o.r);
          let sc = 1;
          const b0 = BORN.get(o.id);
          if (b0 != null) {
            const u = (now - b0) / 420;
            if (u < 1) sc = .55 + .45 * easeBack(u);
            else BORN.delete(o.id);
          }
          if (o === selected) sc *= 1 + .025 * Math.sin(now / 170);
          drawSprite(o.type, g.cx, g.by, g.dw * sc);
        }
      }

      // 8. Placement Ghost
      if (ghost) {
        const b = B[ghost.type];
        if (b) {
          const good = ghost.ok, g = geom(ghost.type, ghost.c, ghost.r);
          const pad = .32 + .06 * Math.sin(now / 200), bob = 2.5 * Math.sin(now / 220);
          ctx.beginPath();
          dia(ctx, ghost.c - pad, ghost.r - pad, b.w + pad * 2, b.h + pad * 2);
          ctx.fillStyle = good ? 'rgba(16,185,129,.34)' : 'rgba(239,68,68,.4)';
          ctx.fill();
          ctx.strokeStyle = good ? 'rgba(255,255,255,.95)' : '#ffe3e3';
          ctx.lineWidth = 2.6;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -now / 40;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          dia(ctx, ghost.c, ghost.r, b.w, b.h);
          ctx.fillStyle = good ? 'rgba(16,185,129,.55)' : 'rgba(239,68,68,.6)';
          ctx.fill();
          ctx.globalAlpha = good ? .94 : .6;
          drawSprite(ghost.type, g.cx, g.by - 5 - bob, g.dw);
          ctx.globalAlpha = 1;

          const my = g.by - g.dh - 16 - bob * 1.6;
          ctx.beginPath();
          ctx.moveTo(g.cx - 9, my - 9);
          ctx.lineTo(g.cx + 9, my - 9);
          ctx.lineTo(g.cx, my + 4);
          ctx.closePath();
          ctx.fillStyle = good ? '#10b981' : '#ef4444';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.lineJoin = 'round';
          ctx.stroke();
          ctx.fill();
        }
      }

      // 9. Floating Effects & Coins
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i], u = (now - f.t0) / (f.k === 'coin' ? 1500 : 600);
        if (u >= 1) { fx.splice(i, 1); continue; }
        if (f.k === 'coin') {
          const y = f.y - 44 * (1 - Math.pow(1 - u, 2));
          ctx.globalAlpha = u < .7 ? 1 : (1 - u) / .3;
          ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.arc(f.x, y + 1, 7.6, 0, 7); ctx.fill();
          ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(f.x, y, 7.6, 0, 7); ctx.fill();
          ctx.fillStyle = '#92400e'; ctx.fillRect(f.x - 3.2, y - 3.4, 6.4, 1.9); ctx.fillRect(f.x - .95, y - 3.4, 1.9, 7);
          if (f.txt) {
            ctx.font = '700 13px system-ui, sans-serif';
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(60,30,0,.75)';
            ctx.strokeText(f.txt, f.x + 11, y + 4.5);
            ctx.fillStyle = '#fff';
            ctx.fillText(f.txt, f.x + 11, y + 4.5);
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = 1 - u;
          ctx.fillStyle = '#fff7c2';
          for (let j2 = 0; j2 < 8; j2++) {
            const a = j2 * .785, d = 14 + 46 * u;
            ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * .55 - 18 * u, 3.2 * (1 - u) + .8, 0, 7); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }

      // 10. Flying Gulls
      ctx.lineCap = 'round';
      for (const gl of gulls) {
        const fl = Math.sin(t2 * 6 + gl.ph);
        ctx.fillStyle = 'rgba(20,40,30,.14)'; ctx.beginPath(); ctx.ellipse(gl.x + 26, gl.y + 84, 9, 3, 0, 0, 7); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(gl.x - 11, gl.y - fl * 5);
        ctx.quadraticCurveTo(gl.x - 5, gl.y - 7 - fl * 2, gl.x, gl.y);
        ctx.quadraticCurveTo(gl.x + 5, gl.y - 7 - fl * 2, gl.x + 11, gl.y - fl * 5);
        ctx.strokeStyle = 'rgba(60,70,80,.55)'; ctx.lineWidth = 4.2; ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.6; ctx.stroke();
      }
    };

    let lastTime = 0;
    const frame = (now: number) => {
      if (!isMounted) return;
      const dt = Math.min(.1, (now - lastTime) / 1000 || 0);
      lastTime = now;

      if (camT) {
        const f = Math.min(1, dt * 7);
        cam.x += (camT.x - cam.x) * f;
        cam.y += (camT.y - cam.y) * f;
        if (camT.z) cam.z += (camT.z - cam.z) * f;
        if (Math.abs(camT.x - cam.x) + Math.abs(camT.y - cam.y) < 1) camT = null;
        clampCam();
      }

      stepWalkers(dt);

      for (const g of gulls) {
        g.x += g.vx * dt; g.y += g.vy * dt;
        if (g.x > 1150) g.x = -1150;
        if (g.x < -1150) g.x = 1150;
        if (g.y < 60 || g.y > 900) g.vy *= -1;
      }

      tickAcc += dt;
      if (tickAcc >= 10) {
        tickAcc -= 10;
        tick();
      }

      const ring = $('#ringp');
      if (ring) ring.style.strokeDashoffset = String(81.7 * (1 - tickAcc / 10));

      draw(now);
      animId = requestAnimationFrame(frame);
    };

    // Game Economy Tick
    const tick = () => {
      const d = derive(), v = stateRef.current.visitors;
      let h = 0;
      if (d.any) {
        const n = performance.now();
        if (n - lastWarn > 45000 || !lastWarn) {
          lastWarn = n;
          showToast(t(d.over.food ? 'capFood' : d.over.lodging ? 'capLodging' : 'capFun'), 'bad', true, 6000);
          snd('error');
        }
      }
      if (d.any && v > 10) {
        h = -Math.floor(.05 * v);
        if (h === 0) h = -1;
      } else if (d.eff > 0 && !d.any) {
        const e = Math.log2(d.eff + 1) / 15;
        h = Math.floor(e);
        if (Math.random() < e - h) h += 1;
      }
      const inc = Math.floor(2 * Math.pow(v, .4)) + ((Math.random() < .3 && v > 0) ? 1 : 0);
      if (h !== 0 || inc > 0) {
        stateRef.current.visitors = Math.max(0, v + h);
        stateRef.current.tik += inc;
        refresh();
        syncDb(h > 0 ? h : 0);
        if (inc > 0) {
          snd('coin');
          const src = stateRef.current.items.filter(i => B[i.type]?.cap > 0);
          const n = Math.min(4, src.length);
          for (let i = 0; i < n; i++) {
            const it = src[(Math.random() * src.length) | 0], g = geom(it.type, it.c, it.r);
            setTimeout(() => coinPop(g.cx - 8, g.by - g.dh * .75, i === 0 ? '+' + inc : ''), i * 140);
          }
        }
      }
    };

    const setGhost = (g: any) => {
      if (g) {
        const b = B[g.type];
        g.ok = canPlace(g.type, g.c, g.r) && (mode !== 'place' || stateRef.current.tik >= (b?.cost || 0));
      }
      ghost = g;
      updateHint();
    };

    const ghostAt = (type: string, wx: number, wy: number) => {
      const b = B[type] || { w: 1, h: 1 };
      const tl = unIso(wx, wy);
      return {
        type,
        c: Math.max(0, Math.min(N - b.w, Math.round(tl.c - b.w / 2))),
        r: Math.max(0, Math.min(N - b.h, Math.round(tl.r - b.h / 2)))
      };
    };

    const viewCenterWorld = () => {
      const a = $('#hud')?.getBoundingClientRect().bottom || 0;
      const b = $('#bottom')?.getBoundingClientRect().top || vh;
      return s2w(vw / 2, (a + b) / 2);
    };

    const nearestFree = (type: string, g: any) => {
      if (canPlace(type, g.c, g.r)) return g;
      const b = B[type] || { w: 1, h: 1 };
      for (let d = 1; d < N; d++) {
        for (let dr = -d; dr <= d; dr++) {
          for (let dc = -d; dc <= d; dc++) {
            if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue;
            const c = g.c + dc, r = g.r + dr;
            if (canPlace(type, c, r)) return { type, c, r };
          }
        }
      }
      return g;
    };

    const startPlace = (type: string) => {
      const b = B[type];
      if (!b) return;
      if (stateRef.current.tik < b.cost) {
        snd('error');
        showToast(t('hintPoor', { n: fmt(b.cost - stateRef.current.tik) }), 'bad');
        return;
      }
      if (moving) {
        stateRef.current.items.push(moving);
        moving = null;
        rebuild();
      }
      mode = 'place';
      placing = type;
      selected = null;
      sellArmed = false;
      snd('tap');
      const w = viewCenterWorld();
      ghost = nearestFree(type, ghostAt(type, w.x, w.y));
      showAct();
      setGhost(ghost);
    };

    const confirmGhost = () => {
      if (!ghost) return;
      if (!canPlace(ghost.type, ghost.c, ghost.r)) {
        snd('error');
        showToast(t('hintTaken'), 'bad');
        return;
      }
      if (mode === 'place' && placing) {
        const b = B[placing];
        if (stateRef.current.tik < b.cost) {
          snd('error');
          showToast(t('hintPoor', { n: fmt(b.cost - stateRef.current.tik) }), 'bad');
          return;
        }
        const it = { id: uid(), type: placing, c: ghost.c, r: ghost.r, col: ghost.c, row: ghost.r };
        stateRef.current.items.push(it);
        stateRef.current.tik -= b.cost;
        BORN.set(it.id, performance.now());
        rebuild();
        const g = geom(it.type, it.c, it.r);
        burst(g.cx, g.by - g.dh * .35);
        snd('build');
        if (navigator.vibrate) navigator.vibrate(12);
        showToast(t('built', { n: bn(placing) }), 'good');
        syncDb();
        if (stateRef.current.tik < b.cost) {
          showToast(t('broke', { n: bn(placing) }), '', false, 3500);
          exitMode();
        } else {
          setGhost(null);
          renderAct();
          refresh();
        }
      } else if (mode === 'move') {
        moving.c = ghost.c; moving.r = ghost.r; moving.col = ghost.c; moving.row = ghost.r;
        stateRef.current.items.push(moving);
        BORN.set(moving.id, performance.now());
        moving = null;
        rebuild();
        snd('move');
        showToast(t('moved'), 'good');
        syncDb();
        exitMode();
      }
    };

    const exitMode = () => {
      if (moving) {
        stateRef.current.items.push(moving);
        moving = null;
        rebuild();
      }
      mode = 'idle';
      placing = null;
      ghost = null;
      selected = null;
      sellArmed = false;
      showDock();
      refresh();
    };

    const select = (it: any) => {
      mode = 'select';
      selected = it;
      placing = null;
      ghost = null;
      sellArmed = false;
      snd('pick');
      showAct();
      const g = geom(it.type, it.c, it.r);
      const s = w2s(g.cx, g.by - g.dh / 2);
      const top = ($('#hud')?.getBoundingClientRect().bottom || 0) + 30;
      const bot = ($('#bottom')?.getBoundingClientRect().top || vh) - 30;
      if (s.y < top || s.y > bot || s.x < 40 || s.x > vw - 40) {
        const mid = (top + bot) / 2;
        camT = { x: g.cx, y: g.by - g.dh / 2 - (mid - vh / 2) / cam.z };
      }
    };

    const startMove = () => {
      if (!selected) return;
      moving = selected;
      stateRef.current.items = stateRef.current.items.filter(i => i !== moving);
      rebuild();
      mode = 'move';
      selected = null;
      snd('tap');
      showAct();
      setGhost({ type: moving.type, c: moving.c, r: moving.r });
    };

    const sellSelected = () => {
      if (!selected) return;
      const b = B[selected.type];
      if (!sellArmed) {
        sellArmed = true;
        renderAct();
        setTimeout(() => {
          if (sellArmed) {
            sellArmed = false;
            if (mode === 'select') renderAct();
          }
        }, 3200);
        return;
      }
      const back = Math.floor(.5 * b.cost);
      const g = geom(selected.type, selected.c, selected.r);
      stateRef.current.items = stateRef.current.items.filter(i => i !== selected);
      stateRef.current.tik += back;
      rebuild();
      coinPop(g.cx, g.by - g.dh * .5, '+' + back);
      snd('sell');
      showToast(t('sold', { n: fmt(back) }), 'good');
      syncDb();
      exitMode();
    };

    const pick = (wx: number, wy: number) => {
      const arr = [...stateRef.current.items].sort((a, b) => b.key - a.key);
      for (const it of arr) {
        const g = geom(it.type, it.c, it.r);
        if (Math.abs(wx - g.cx) < g.dw * .36 && wy < g.by - g.dh * .08 && wy > g.by - g.dh * .92) return it;
      }
      const tl = unIso(wx, wy), c = Math.floor(tl.c), r = Math.floor(tl.r);
      if (c >= 0 && r >= 0 && c < N && r < N && occ[r * N + c] >= 0) return stateRef.current.items[occ[r * N + c]];
      return null;
    };

    const onTap = (sx: number, sy: number) => {
      const w = s2w(sx, sy);
      if (mode === 'place' || mode === 'move') {
        const type = mode === 'place' ? placing : moving.type;
        if (type) {
          snd('tap');
          setGhost(ghostAt(type, w.x, w.y));
        }
        return;
      }
      const it = pick(w.x, w.y);
      if (it) {
        select(it);
        return;
      }
      for (const d of DECOR) {
        if (d.k === 'sign') {
          const p = iso(d.c, d.r);
          if (Math.abs(w.x - p.x) < 30 && w.y < p.y + 8 && w.y > p.y - 56) {
            snd('pick');
            showToast(SIGN_TIPS[d.n]?.[lang as 'es' | 'en'] || '', '', true, 4200);
            return;
          }
        }
      }
      if (mode === 'select') exitMode();
    };

    const hitGhost = (sx: number, sy: number) => {
      if (!ghost) return false;
      const w = s2w(sx, sy), b = B[ghost.type], tl = unIso(w.x, w.y), g = geom(ghost.type, ghost.c, ghost.r);
      if (!b) return false;
      return (tl.c > ghost.c - .7 && tl.c < ghost.c + b.w + .7 && tl.r > ghost.r - .7 && tl.r < ghost.r + b.h + .7) ||
        (Math.abs(w.x - g.cx) < g.dw * .5 && w.y < g.by + 6 && w.y > g.by - g.dh - 8);
    };

    // Pointer Input
    const P = new Map<number, { x: number; y: number }>();
    let G: any = null;

    const onPointerDown = (e: PointerEvent) => {
      try { (e.target as HTMLElement)?.setPointerCapture(e.pointerId); } catch (_) {}
      P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      camT = null;
      if (P.size === 1) {
        const onG = hitGhost(e.clientX, e.clientY);
        G = { k: 'tap', sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, onG };
        if (onG && ghost) {
          const b = B[ghost.type];
          if (b) {
            const f = iso(ghost.c + b.w / 2, ghost.r + b.h / 2), s = w2s(f.x, f.y);
            G.ox = s.x - e.clientX; G.oy = s.y - e.clientY;
          }
        }
      } else if (P.size === 2) {
        const [a, b] = [...P.values()];
        G = { k: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.z, w: s2w((a.x + b.x) / 2, (a.y + b.y) / 2) };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = P.get(e.pointerId);
      if (!p || !G) return;
      p.x = e.clientX; p.y = e.clientY;
      if (G.k === 'pinch') {
        if (P.size < 2) return;
        const [a, b] = [...P.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        cam.z = Math.min(ZMAX, Math.max(zmin(), G.z0 * Math.hypot(a.x - b.x, a.y - b.y) / G.d0));
        cam.x = G.w.x - (mx - vw / 2) / cam.z;
        cam.y = G.w.y - (my - vh / 2) / cam.z;
        clampCam();
        return;
      }
      const dx = e.clientX - G.sx, dy = e.clientY - G.sy;
      if (G.k === 'tap' && Math.hypot(dx, dy) > 7) G.k = G.onG ? 'ghost' : 'pan';
      if (G.k === 'pan') {
        cam.x = G.cx - dx / cam.z;
        cam.y = G.cy - dy / cam.z;
        clampCam();
      } else if (G.k === 'ghost' && ghost) {
        const w = s2w(e.clientX + G.ox, e.clientY + G.oy);
        const g = ghostAt(ghost.type, w.x, w.y);
        if (g.c !== ghost.c || g.r !== ghost.r) setGhost(g);
      }
    };

    const endPtr = (e: PointerEvent) => {
      if (!P.has(e.pointerId)) return;
      P.delete(e.pointerId);
      if (G && G.k === 'tap' && e.type === 'pointerup') onTap(e.clientX, e.clientY);
      if (P.size === 1) {
        const p = [...P.values()][0];
        G = { k: 'pan', sx: p.x, sy: p.y, cx: cam.x, cy: cam.y };
      } else if (P.size === 0) G = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camT = null;
      zoomAt(e.clientX, e.clientY, cam.z * Math.exp(-e.deltaY * .0016));
    };

    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onPointerMove);
    cv.addEventListener('pointerup', endPtr);
    cv.addEventListener('pointercancel', endPtr);
    cv.addEventListener('wheel', onWheel, { passive: false });

    // UI Rendering & Event Listeners
    let currentTab = 'all';

    const buildUI = () => {
      const hudEl = $('#hud');
      if (!hudEl) return;
      hudEl.innerHTML = `
      <div class="row">
        <a class="ib" href="/${lang}/community" aria-label="${t('back')}" title="${t('back')}">${ico('back')}</a>
        <button class="name" id="bName" aria-label="${t('rename')}"><img src="${SRC('otico')}" alt=""><span><small>${t('tiko')}</small><b id="vName">${esc(stateRef.current.name)}</b></span>${ico('pencil')}</button>
        <button class="ib" id="bLang" aria-label="${lang === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}" style="font-size:12px;font-weight:700;color:var(--ink)">${lang === 'es' ? 'ES' : 'EN'}</button>
        <button class="ib" id="bHelp" aria-label="${t('help')}">${ico('help')}</button>
        <button class="ib" id="bSound" aria-label="${t('soundOn')}"></button>
      </div>
      <div class="dash-deck" id="dashDeck">
        <button class="stats" id="bStats" aria-label="${t('report')}">
          <div class="st coin">
            <div class="ring">
              <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="#f3d48a" stroke-width="3"/><circle id="ringp" class="pg" cx="16" cy="16" r="13" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-dasharray="81.7" stroke-dashoffset="81.7"/></svg>
              <svg viewBox="0 0 24 24" style="inset:5px;width:18px;height:18px"><circle cx="12" cy="12.6" r="9.6" fill="#b45309"/><circle cx="12" cy="11.4" r="9.6" fill="#fbbf24"/><path d="M8.8 8.7h6.4M12 8.7v6.2" stroke="#92400e" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>
            </div>
            <div class="coin-meta"><div class="n" id="vTik">0</div><div class="s" id="vInc"></div></div>
          </div>
          <div class="st"><div class="v">${fico('person', '#059669')}<span id="vVis">0</span></div><div class="l">${t('vis')}</div></div>
          <div class="st"><div class="v">${fico('spark', '#db2777')}<span id="vAtt">0</span></div><div class="l">${t('att')}</div></div>
          <div class="st"><div class="v" id="polV">${fico('cloud', '#16a34a')}<span id="vPol">0</span></div><div class="l">${t('pol')}</div></div>
        </button>
        <div class="dash-meters">${['lodging', 'food', 'fun'].map(c => `<div class="m" id="m_${c}" title="${t(c)}">${ico(CAT[c as keyof typeof CAT].ic, 'color:' + CAT[c as keyof typeof CAT].col)}<div class="bar"><i style="background:${CAT[c as keyof typeof CAT].col}"></i></div><span></span></div>`).join('')}</div>
      </div>
      <div id="toasts" aria-live="polite"></div>`;

      const mapctlEl = $('#mapctl');
      if (mapctlEl) {
        mapctlEl.innerHTML = `<button class="ib" id="zOut" aria-label="${t('zoomOut')}">${ico('minus')}</button><button class="ib" id="zIn" aria-label="${t('zoomIn')}">${ico('plus')}</button><button class="ib" id="zFit" aria-label="${t('center')}">${ico('target')}</button>`;
      }

      const bName = $('#bName'); if (bName) bName.onclick = openRename;
      const bHelp = $('#bHelp'); if (bHelp) bHelp.onclick = openHelp;
      const bStats = $('#bStats'); if (bStats) bStats.onclick = openReport;
      const bSound = $('#bSound');
      if (bSound) {
        bSound.onclick = () => {
          stateRef.current.sound = !stateRef.current.sound;
          refresh();
          if (stateRef.current.sound) snd('tap');
          showToast(t(stateRef.current.sound ? 'soundOn' : 'soundOff'));
        };
      }
      const bLang = $('#bLang');
      if (bLang) {
        bLang.onclick = () => {
          lang = (lang === 'es' ? 'en' : 'es');
          setCurrentLang(lang);
          stateRef.current.lang = lang;
          buildUI();
          showToast(lang === 'es' ? 'Idioma: Español 🇨🇷' : 'Language: English 🇺🇸', 'good');
        };
      }

      const zIn = $('#zIn'); if (zIn) zIn.onclick = () => { camT = null; zoomAt(vw / 2, vh / 2, cam.z * 1.3); };
      const zOut = $('#zOut'); if (zOut) zOut.onclick = () => { camT = null; zoomAt(vw / 2, vh / 2, cam.z / 1.3); };
      const zFit = $('#zFit'); if (zFit) zFit.onclick = () => { const p = iso(12.5, 13.5); camT = { x: p.x, y: p.y, z: Math.max(zmin(), Math.min(.6, vw / 1150)) }; };

      renderDock();
      if (mode !== 'idle') renderAct();
      refresh();
    };

    const renderDock = () => {
      const dockEl = $('#dock');
      if (!dockEl) return;
      const tabs = [['all', 'grid', '#b45309'], ['lodging'], ['food'], ['fun'], ['eco']];
      const list = ORDER.filter(k => currentTab === 'all' || B[k].cat === currentTab);
      dockEl.innerHTML = `<button class="grab" id="grab" aria-label="toggle"></button>
      <div class="tabs" role="tablist">${tabs.map(([k, ic2, col]) => `<button class="tab${currentTab === k ? ' on' : ''}" role="tab" data-tab="${k}">${ico(ic2 || CAT[k as keyof typeof CAT].ic, 'color:' + (col || CAT[k as keyof typeof CAT].col))}${t(k)}</button>`).join('')}</div>
      <div class="rail">${list.map(k => { const b = B[k]; return `<button class="card" data-b="${k}"><i class="dot" style="background:${CAT[b.cat].col}"></i><span class="sz">${b.w}×${b.h}</span><img src="${SRC(k)}" alt="" draggable="false"><span class="n">${esc(bn(k))}</span><span class="c">${COIN}${fmt(b.cost)}</span></button>`; }).join('')}</div>`;

      const grab = $('#grab');
      if (grab) grab.onclick = () => dockEl.classList.toggle('min');

      dockEl.querySelectorAll('.tab').forEach((el: any) => {
        el.onclick = () => {
          currentTab = el.dataset.tab;
          snd('tap');
          dockEl.classList.remove('min');
          renderDock();
          refresh();
        };
      });

      dockEl.querySelectorAll('.card').forEach((el: any) => {
        el.onclick = () => startPlace(el.dataset.b);
      });
    };

    const chipsFor = (b: BuildingDef) => {
      const c = CAT[b.cat];
      let h = `<span class="chip" style="color:#be185d">${fico('spark', '#db2777')}+${b.attract}</span>`;
      h += `<span class="chip" style="color:${b.pol < 0 ? '#15803d' : '#6b5a48'}">${fico('cloud', b.pol < 0 ? '#16a34a' : '#9a8a76')}${b.pol > 0 ? '+' : ''}${b.pol}</span>`;
      if (b.cap) h += `<span class="chip" style="color:${c.col}">${ico(c.ic)}+${b.cap}</span>`;
      return h + `<span class="chip">${ico('grid', 'color:#a08a6c')}${b.w}×${b.h}</span>`;
    };

    const showDock = () => {
      const act = $('#act'), dock = $('#dock');
      if (act) act.hidden = true;
      if (dock) dock.hidden = false;
    };

    const showAct = () => {
      const act = $('#act'), dock = $('#dock');
      if (dock) dock.hidden = true;
      if (act) act.hidden = false;
      renderAct();
    };

    const renderAct = () => {
      const type = mode === 'place' ? placing : mode === 'move' ? moving?.type : selected ? selected.type : null;
      if (!type) return;
      const b = B[type], c = CAT[b.cat];
      let btns = '';
      if (mode === 'place') {
        btns = `<button class="btn sec narrow" data-a="cancel" id="bCancel">${ghost ? t('cancel') : t('done')}</button><button class="btn" data-a="ok" id="bOk">${ico('check')}${t('build')} · ${COIN}${fmt(b.cost)}</button>`;
      } else if (mode === 'move') {
        btns = `<button class="btn sec narrow" data-a="cancel">${t('cancel')}</button><button class="btn" data-a="ok" id="bOk">${ico('check')}${t('placeHere')}</button>`;
      } else {
        btns = `<button class="btn sec" data-a="move">${ico('move')}${t('move')}</button><button class="btn ${sellArmed ? 'danger' : 'warn'}" data-a="sell">${COIN}${sellArmed ? t('confirmSell') : t('sell')} +${fmt(Math.floor(b.cost * .5))}</button>`;
      }
      const actEl = $('#act');
      if (!actEl) return;
      actEl.innerHTML = `<div class="top"><img class="thumb" src="${SRC(type)}" alt=""><div class="info"><div class="cat" style="color:${c.col}">${t(b.cat)}</div><h3>${esc(bn(type))}</h3><div class="chips">${chipsFor(b)}</div></div>
        <button class="ib x" data-a="cancel" aria-label="${t('close')}">${ico('x')}</button></div><div class="hint" id="hint"></div><div class="btns">${btns}</div>`;

      actEl.querySelectorAll('[data-a]').forEach((el: any) => {
        el.onclick = () => {
          const a = el.dataset.a;
          if (a === 'cancel') { snd('tap'); exitMode(); }
          else if (a === 'ok') confirmGhost();
          else if (a === 'move') startMove();
          else if (a === 'sell') sellSelected();
        };
      });
      updateHint();
    };

    const updateHint = () => {
      const h = $('#hint');
      const act = $('#act');
      if (!h || !act || act.hidden) return;
      const okB = $('#bOk') as HTMLButtonElement | null;
      let txt = '', bad = false, dis = false;
      if (mode === 'place' && placing) {
        const b = B[placing];
        if (!ghost) { txt = t('hintAgain'); dis = true; }
        else if (stateRef.current.tik < b.cost) { txt = t('hintPoor', { n: fmt(b.cost - stateRef.current.tik) }); bad = dis = true; }
        else if (!canPlace(placing, ghost.c, ghost.r)) { txt = t('hintTaken'); bad = dis = true; }
        else txt = t('hintDrag');
      } else if (mode === 'move') {
        if (ghost && !canPlace(ghost.type, ghost.c, ghost.r)) { txt = t('hintTaken'); bad = dis = true; }
        else txt = t('hintMove');
      } else {
        txt = t('hintSel');
      }
      h.textContent = txt;
      h.classList.toggle('bad', bad);
      if (okB) okB.disabled = dis;
      const cb = $('#bCancel');
      if (cb) cb.textContent = ghost ? t('cancel') : t('done');
    };

    const prev: Record<string, any> = {};
    const setNum = (sel: string, val: number, txt?: string) => {
      const el = $(sel);
      if (!el) return;
      const s = txt ?? fmt(val);
      if (el.textContent !== s) {
        el.textContent = s;
        if (prev[sel] !== undefined) {
          el.classList.remove('bump');
          void el.offsetWidth;
          el.classList.add('bump');
        }
      }
      prev[sel] = val;
    };

    const refresh = () => {
      const d = derive();
      const vName = $('#vName'); if (vName) vName.textContent = t('beach') + ' ' + stateRef.current.name;
      setNum('#vTik', stateRef.current.tik);
      const vInc = $('#vInc'); if (vInc) vInc.textContent = '+' + d.income + ' ' + t('per10');
      setNum('#vVis', stateRef.current.visitors);
      setNum('#vAtt', d.eff);
      setNum('#vPol', d.pollution);
      const pc = d.pollution === 0 ? '#16a34a' : d.pollution < 60 ? '#d97706' : '#dc2626';
      const polV = $('#polV');
      if (polV?.firstElementChild) {
        polV.firstElementChild.setAttribute('fill', pc);
        polV.firstElementChild.setAttribute('stroke', pc);
      }
      for (const c of ['lodging', 'food', 'fun'] as const) {
        const el = $('#m_' + c), cap = d.caps[c];
        if (el) {
          el.querySelector('span')!.textContent = fmt(stateRef.current.visitors) + '/' + fmt(cap);
          (el.querySelector('i') as HTMLElement).style.width = Math.min(100, stateRef.current.visitors / cap * 100) + '%';
          el.classList.toggle('over', d.over[c]);
        }
      }
      containerRef.current?.querySelectorAll('#dock .card').forEach((el: any) => {
        el.classList.toggle('no', stateRef.current.tik < (B[el.dataset.b]?.cost || 0));
      });
      const bSound = $('#bSound');
      if (bSound) {
        bSound.innerHTML = ico(stateRef.current.sound ? 'sound' : 'mute');
        bSound.setAttribute('aria-label', t(stateRef.current.sound ? 'soundOn' : 'soundOff'));
      }
      updateHint();
    };

    const showToast = (msg: string, kind = '', otico = false, ms = 2400) => {
      const box = $('#toasts');
      if (!box) return;
      while (box.children.length > 1) box.firstChild?.remove();
      const el = document.createElement('div');
      el.className = 'toast ' + (kind || '') + (otico ? '' : ' plain');
      el.innerHTML = (otico ? `<img src="${SRC('otico')}" alt="">` : '') + `<span>${esc(msg)}</span>`;
      box.appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 260);
      }, ms);
    };

    // Modal Sheets
    const openModal = (html: string) => {
      const m = $('#modal');
      if (!m) return;
      m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
      m.hidden = false;
      m.onclick = (e: MouseEvent) => { if (e.target === m) closeModal(); };
      const x = m.querySelector('[data-x]') as HTMLElement | null;
      if (x) x.onclick = closeModal;
      snd('tap');
    };

    const closeModal = () => {
      const m = $('#modal');
      if (m) {
        m.hidden = true;
        m.innerHTML = '';
      }
    };

    const head = (title: string, img = false) => `<h2>${img ? `<img src="${SRC('otico')}" alt="">` : ''}${title}<button class="ib" data-x aria-label="${t('close')}">${ico('x')}</button></h2>`;

    const openHelp = () => {
      const rules = [
        ['r1', 'plus', '#d1fae5', '#047857'],
        ['r2', 'spark', '#fce7f3', '#be185d'],
        ['r3', 'bed', '#dbeafe', '#1d4ed8'],
        ['r4', 'leaf', '#dcfce7', '#15803d'],
        ['r5', 'grid', '#fef3c7', '#b45309'],
        ['r6', 'move', '#ede9fe', '#6d28d9']
      ];
      openModal(head(t('help'), true) + rules.map(([k, ic2, bg, col]) => `<div class="rule"><div class="bx" style="background:${bg};color:${col}">${ico(ic2)}</div><div>${t(k)}</div></div>`).join('') +
        `<div class="sub">${t('language')}</div><div class="seg"><button data-l="es" class="${lang === 'es' ? 'on' : ''}">Español</button><button data-l="en" class="${lang === 'en' ? 'on' : ''}">English</button></div>
         <div class="btns" style="margin-top:14px"><button class="btn sec" id="bDemo">${t('demo')}</button><button class="btn sec" id="bReset" style="color:#b91c1c">${t('reset')}</button></div>`);

      const m = $('#modal');
      if (!m) return;
      m.querySelectorAll('[data-l]').forEach((el: any) => {
        el.onclick = () => {
          lang = el.dataset.l;
          setCurrentLang(lang);
          stateRef.current.lang = lang;
          buildUI();
          openHelp();
        };
      });

      const bDemo = m.querySelector('#bDemo') as HTMLElement | null;
      if (bDemo) {
        bDemo.onclick = () => {
          loadDemo();
          closeModal();
          showToast(t('demoLoaded'), 'good');
        };
      }

      let armed = false;
      const bReset = m.querySelector('#bReset') as HTMLElement | null;
      if (bReset) {
        bReset.onclick = () => {
          if (!armed) {
            armed = true;
            bReset.textContent = t('resetSure');
            return;
          }
          exitMode();
          stateRef.current.items = [];
          stateRef.current.tik = 500;
          stateRef.current.visitors = 0;
          stateRef.current.name = 'Playa Tica';
          walkers.length = 0;
          rebuild();
          syncDb();
          refresh();
          closeModal();
        };
      }
    };

    const openReport = () => {
      const d = derive(), pct = (x: number) => Math.round(x * 100) + '%';
      let arr = '';
      if (d.any && stateRef.current.visitors > 10) arr = `<b class="neg">${t('leaving')}</b>`;
      else if (d.eff > 0 && !d.any) arr = `<b class="pos">${t('perMin', { n: (Math.log2(d.eff + 1) / 15 * 6).toFixed(1) })}</b>`;
      else arr = `<b>${t('none')}</b>`;

      let h = head(t('report'), true);
      h += `<div class="kv"><span>${t('income')}</span><b class="pos">+${d.income} ${t('tik')} ${t('per10')}</b></div><div class="kv"><span>${t('arrivals')}</span>${arr}</div>`;
      h += `<div class="sub">${t('att')}</div><div class="kv"><span>${t('baseAtt')}</span><b>${fmt(d.att)}</b></div>`;
      if (d.pollution > 0) h += `<div class="kv"><span>${t('modPol', { n: d.pollution })}</span><b class="neg">−${pct(1 - d.pf)}</b></div>`;
      if (d.any) h += `<div class="kv"><span>${t('modOver')}</span><b class="neg">−90%</b></div>`;
      if (d.df < 1) h += `<div class="kv"><span>${t('modDens', { n: Math.round(d.dens * 100) })}</span><b class="neg">−${pct(1 - d.df)}</b></div>`;
      h += `<div class="kv"><span>${t('effAtt')}</span><b>${fmt(d.eff)}</b></div><div class="sub">${t('capacity')}</div>`;
      for (const c of ['lodging', 'food', 'fun'] as const) {
        h += `<div class="kv"><span style="display:flex;gap:6px;align-items:center;color:${CAT[c].col}">${ico(CAT[c].ic)}${t(c)}</span><b class="${d.over[c] ? 'neg' : ''}">${fmt(stateRef.current.visitors)} / ${fmt(d.caps[c])}</b></div>`;
      }
      openModal(h);
    };

    const openRename = () => {
      openModal(head(t('rename'), true) + `<input id="inName" maxlength="20" value="${esc(stateRef.current.name)}" autocomplete="off" enterkeyhint="done"><div class="btns" style="margin-top:12px"><button class="btn" id="bSave">${ico('check')}${t('save')}</button></div>`);
      const inp = $('#inName') as HTMLInputElement | null;
      const bSave = $('#bSave') as HTMLElement | null;
      const go = async () => {
        if (!inp) return;
        const v = inp.value.trim();
        if (v) {
          stateRef.current.name = v;
          refresh();
          let localUsername = localStorage.getItem('localUsername') || undefined;
          saveBeachName(v, localUsername);
        }
        closeModal();
      };
      if (bSave) bSave.onclick = go;
      if (inp) {
        inp.onkeydown = (e: KeyboardEvent) => { if (e.key === 'Enter') go(); };
        setTimeout(() => inp.focus(), 80);
      }
    };

    const loadDemo = () => {
      exitMode();
      const L2 = [
        ['hotel', 3, 3], ['cabanas', 8, 3], ['cabanas', 11, 3], ['restaurante', 15, 4], ['soda', 20, 5],
        ['deportes', 4, 17], ['surf', 9, 19], ['inflable', 14, 18], ['artesanias', 19, 12], ['pipas', 10, 12],
        ['reciclaje1', 7, 12], ['reciclaje2', 16, 10], ['sombrilla', 3, 22], ['sombrilla', 5, 22], ['sombrilla', 7, 22],
        ['sombrilla', 12, 22], ['sombrilla', 17, 22], ['sombrilla', 19, 22], ['sombrilla', 21, 22], ['palmera', 1, 1],
        ['palmera', 7, 2], ['palmera', 14, 2], ['palmera', 19, 3], ['palmera', 23, 2], ['palmera', 2, 8],
        ['palmera', 6, 9], ['palmera', 13, 9], ['palmera', 22, 9], ['palmera', 1, 14], ['palmera', 8, 15],
        ['palmera', 17, 15], ['palmera', 23, 16], ['palmera', 12, 20], ['palmera', 22, 20]
      ];
      stateRef.current.items = L2.map(([type, c, r]) => ({ id: uid(), type, c: c as number, r: r as number, col: c as number, row: r as number }));
      stateRef.current.tik = 2400;
      stateRef.current.visitors = 86;
      walkers.length = 0;
      rebuild();
      syncDb();
      refresh();
    };

    // Load from Database
    const initDb = async () => {
      let localUsername = localStorage.getItem('localUsername') || undefined;
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        } catch (e) {}
      }

      try {
        const res = await loadBeachState(localUsername);
        if (res && res.success) {
          const raw = res.gridState;
          const rawList = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
          
          // Retrocompatibilidad 100% bidireccional
          const normalized = rawList.map((it: any) => ({
            id: it.id || uid(),
            type: it.type,
            c: it.c !== undefined ? it.c : (it.col !== undefined ? it.col : 0),
            r: it.r !== undefined ? it.r : (it.row !== undefined ? it.row : 0),
            col: it.col !== undefined ? it.col : (it.c !== undefined ? it.c : 0),
            row: it.row !== undefined ? it.row : (it.r !== undefined ? it.r : 0),
          })).filter((it: any) => B[it.type]);

          stateRef.current.items = normalized;
          stateRef.current.tik = res.tikolones || 500;
          stateRef.current.visitors = res.visitors || 0;
          if (res.name) stateRef.current.name = res.name;

          if (res.alerts?.dailyXp) {
            snd('reward');
            if (refreshGamification) refreshGamification();
            sonnerToast.success(lang === 'en' ? `Daily Reward! +${res.alerts.dailyXp} XP for playing Tiko Beach.` : `¡Recompensa Diaria! +${res.alerts.dailyXp} XP por jugar Tiko Playa hoy.`, { icon: '🎁', duration: 6000 });
          }
          if (res.alerts?.newTikolonesFromXp) {
            snd('sell');
            sonnerToast.success(lang === 'en' ? `Investor! XP converted into ${res.alerts.newTikolonesFromXp} Tikolones.` : `¡Inversor! Se han convertido tus XP en ${res.alerts.newTikolonesFromXp} Tikolones para tu playa.`, { icon: '🪙', duration: 7000 });
          }
        }
      } catch (err) {
        console.warn("Error cargando estado inicial de la playa:", err);
      }

      rebuild();
      refresh();
      setIsLoaded(true);
    };

    // Keyboard Shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const m = $('#modal');
        if (m && !m.hidden) closeModal();
        else if (mode !== 'idle') exitMode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', resize);

    // Boot
    resize();
    PAT.canopy = ctx.createPattern(makeCanopy(), 'repeat');
    const bakeAll = () => {
      PAT.sandTile = makeSandTile();
      PAT.sand = ctx.createPattern(PAT.sandTile, 'repeat');
      bakeSand();
    };
    bakeAll();
    IMG.sand_pattern.addEventListener('load', bakeAll);

    const setCaust = () => {
      PAT.caust = ctx.createPattern(IMG.water_caustics, 'repeat');
    };
    if (ok(IMG.water_caustics)) setCaust();
    else IMG.water_caustics.addEventListener('load', setCaust);

    rebuild();
    buildUI();

    cam.z = Math.max(zmin(), Math.min(.95, vw / 680));
    {
      const p = iso(12.5, 14.5);
      cam.x = p.x;
      cam.y = p.y;
      clampCam();
    }

    initDb();

    animId = requestAnimationFrame(frame);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      clearInterval(tickTimer);
      cv.removeEventListener('pointerdown', onPointerDown);
      cv.removeEventListener('pointermove', onPointerMove);
      cv.removeEventListener('pointerup', endPtr);
      cv.removeEventListener('pointercancel', endPtr);
      cv.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="tiko-playa-v2 fixed inset-0 z-50 overflow-hidden select-none bg-[#0f4f2c] h-[100dvh] max-h-[100dvh]">
      <style jsx global>{`
        :root {
          --ink: #3a2817;
          --ink2: #806a55;
          --cream: #fff8e8;
          --line: #ecd9b0;
          --em: #10b981;
          --emd: #047857;
          --amb: #f59e0b;
          --ambd: #b45309;
          --red: #ef4444;
          --sat: env(safe-area-inset-top, 0px);
          --sab: env(safe-area-inset-bottom, 0px);
          --lift: 0 2px 0 #dccaa4, 0 6px 16px rgba(8, 45, 35, .24);
        }
        .tiko-playa-v2 * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        .tiko-playa-v2 [hidden] {
          display: none !important;
        }
        .tiko-playa-v2 button {
          font-family: inherit;
          color: inherit;
          cursor: pointer;
        }
        #world {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          touch-action: none;
          display: block;
        }
        svg.i {
          width: 18px;
          height: 18px;
          flex: none;
        }
        /* Top HUD - Compact, Ergonomic, High-Performance Mobile Deck */
        #hud {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          margin: 0 auto;
          max-width: 520px;
          padding: calc(6px + var(--sat)) 8px 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
          pointer-events: none;
          z-index: 25;
        }
        #hud > * {
          pointer-events: auto;
        }
        .row {
          display: flex;
          gap: 5px;
          align-items: center;
          width: 100%;
        }
        .ib {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 0;
          background: #fff;
          display: grid;
          place-items: center;
          box-shadow: var(--lift);
          flex: none;
          text-decoration: none;
          color: var(--ink);
          transition: transform .08s;
        }
        .ib:active {
          transform: translateY(1px);
          box-shadow: 0 1px 0 #dccaa4, 0 2px 4px rgba(8, 45, 35, .2);
        }
        .ib svg {
          width: 18px;
          height: 18px;
        }
        .name {
          flex: 1;
          min-width: 0;
          height: 36px;
          border-radius: 12px;
          border: 0;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px 0 4px;
          box-shadow: var(--lift);
          text-align: left;
          overflow: hidden;
        }
        .name img {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          background: #d1fae5;
          object-fit: cover;
          flex: none;
        }
        .name span {
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .name small {
          display: block;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .1em;
          color: var(--ambd);
          line-height: 1;
          text-transform: uppercase;
        }
        .name b {
          display: block;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--ink);
        }
        .name svg {
          width: 13px;
          height: 13px;
          color: var(--ink2);
          flex: none;
        }

        /* Unified Dashboard Deck (Vital Stats + Integrated Demand Bars) */
        .dash-deck {
          width: 100%;
          background: #fff;
          border-radius: 16px;
          box-shadow: var(--lift);
          border: 1.5px solid #ecd9b0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .stats {
          display: grid;
          grid-template-columns: 1.35fr 1fr 1fr 1fr;
          width: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          overflow: hidden;
          text-align: left;
          cursor: pointer;
        }
        .st {
          padding: 5px 3px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }
        .st + .st {
          border-left: 1px solid #f3e8cf;
        }
        .st .v {
          display: flex;
          align-items: center;
          gap: 3.5px;
          font-size: 14.5px;
          font-weight: 700;
          line-height: 1.15;
          color: var(--ink);
        }
        .st .v svg {
          width: 14px;
          height: 14px;
        }
        .st .l {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: var(--ink2);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 2px;
          line-height: 1.1;
          margin-top: 1px;
        }
        .st.coin {
          background: linear-gradient(180deg, #fff9e6, #ffecb8);
          flex-direction: row;
          gap: 6px;
          justify-content: flex-start;
          padding-left: 7px;
        }
        .ring {
          position: relative;
          width: 28px;
          height: 28px;
          flex: none;
        }
        .ring svg {
          position: absolute;
          inset: 0;
          width: 28px;
          height: 28px;
        }
        .ring .pg {
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
        .coin-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .coin .n {
          font-size: 15.5px;
          font-weight: 800;
          line-height: 1;
          color: #7c3d06;
        }
        .coin .s {
          font-size: 9px;
          font-weight: 700;
          color: #a15c0e;
          line-height: 1.2;
          white-space: nowrap;
        }
        .bump {
          animation: bump .35s;
        }
        @keyframes bump {
          40% { transform: scale(1.22); }
        }

        /* Integrated Demand Meters Sub-deck */
        .dash-meters {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background: #faf6ed;
          border-top: 1px solid #f2e3c7;
        }
        .m {
          background: #fffdf9;
          padding: 4px 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          min-width: 0;
          transition: background .2s;
        }
        .m + .m {
          border-left: 1px solid #f2e3c7;
        }
        .m svg {
          width: 12px;
          height: 12px;
          flex: none;
        }
        .m .bar {
          flex: 1;
          height: 5px;
          border-radius: 6px;
          background: #e8dcc4;
          overflow: hidden;
          min-width: 16px;
        }
        .m .bar i {
          display: block;
          height: 100%;
          border-radius: 6px;
          width: 0;
          transition: width .45s ease-out;
        }
        .m span {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--ink);
          white-space: nowrap;
          letter-spacing: -0.02em;
          flex: none;
        }
        .m.over {
          background: #fee2e2;
          color: #991b1b;
          animation: wig .5s 2;
        }
        .m.over span {
          color: #b91c1c;
        }
        @keyframes wig {
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        #toasts {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          pointer-events: none !important;
          margin-top: 2px;
        }
        .toast {
          background: rgba(44, 30, 16, .95);
          color: #fff;
          border-radius: 14px;
          padding: 8px 13px 8px 8px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.25;
          display: flex;
          gap: 9px;
          align-items: center;
          max-width: 100%;
          box-shadow: 0 8px 22px rgba(0, 0, 0, .3);
          animation: pop .28s;
        }
        .toast.plain {
          padding-left: 13px;
        }
        .toast img {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #d1fae5;
          object-fit: cover;
          flex: none;
        }
        .toast.good {
          background: #065f46;
        }
        .toast.bad {
          background: #9f1d1d;
        }
        .toast.out {
          opacity: 0;
          transform: translateY(-6px);
          transition: .25s;
        }
        @keyframes pop {
          from { opacity: 0; transform: translateY(-8px) scale(.96); }
        }
        /* Bottom Controls & Dock */
        #bottom {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          pointer-events: none;
          z-index: 5;
        }
        #bottom > * {
          pointer-events: auto;
        }
        .mapctl {
          align-self: flex-end;
          display: flex;
          gap: 6px;
          margin: 0 10px 8px;
          max-width: 560px;
        }
        .mapctl .ib {
          width: 38px;
          height: 38px;
          border-radius: 13px;
        }
        .panel {
          background: var(--cream);
          border-radius: 22px 22px 0 0;
          border-top: 3px solid #fff;
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          box-shadow: 0 -8px 26px rgba(8, 40, 30, .3);
          animation: up .22s ease-out;
        }
        @keyframes up {
          from { transform: translateY(40px); opacity: .4; }
        }
        .grab {
          display: block;
          width: 100%;
          height: 16px;
          border: 0;
          background: none;
          padding: 0;
        }
        .grab::before {
          content: "";
          display: block;
          width: 40px;
          height: 4px;
          border-radius: 4px;
          background: #dfcda6;
          margin: 6px auto 0;
        }
        .tabs {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          padding: 0 10px 4px;
          scrollbar-width: none;
        }
        .tabs::-webkit-scrollbar, .rail::-webkit-scrollbar {
          display: none;
        }
        .tab {
          flex: none;
          border: 0;
          border-radius: 12px;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 600;
          background: transparent;
          color: var(--ink2);
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .tab svg {
          width: 15px;
          height: 15px;
        }
        .tab.on {
          background: #fff;
          color: var(--ink);
          box-shadow: 0 2px 0 var(--line);
        }
        .rail {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 10px calc(10px + var(--sab));
          scroll-snap-type: x proximity;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .dock.min .rail {
          display: none;
        }
        .dock.min .tabs {
          padding-bottom: calc(8px + var(--sab));
        }
        .card {
          flex: none;
          width: 94px;
          border: 0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 3px 0 var(--line);
          padding: 14px 5px 7px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          position: relative;
          scroll-snap-align: start;
          transition: transform .08s;
        }
        .card:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 var(--line);
        }
        .card img {
          width: 70px;
          height: 56px;
          object-fit: contain;
          pointer-events: none;
          filter: drop-shadow(0 3px 3px rgba(60, 40, 10, .25));
        }
        .card .n {
          font-size: 11.5px;
          font-weight: 600;
          line-height: 1.1;
          text-align: center;
          height: 26px;
          display: flex;
          align-items: center;
        }
        .card .c {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 12.5px;
          font-weight: 700;
          background: #fff1c9;
          color: #8a4708;
          border-radius: 9px;
          padding: 2px 8px 2px 3px;
        }
        .card .c svg {
          width: 15px;
          height: 15px;
        }
        .card .dot {
          position: absolute;
          top: 6px;
          left: 7px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .card .sz {
          position: absolute;
          top: 3px;
          right: 7px;
          font-size: 9.5px;
          font-weight: 600;
          color: var(--ink2);
        }
        .card.no img {
          filter: grayscale(.85) opacity(.6);
        }
        .card.no .c {
          background: #eee;
          color: #8b8b8b;
        }
        .act {
          padding: 12px 12px calc(12px + var(--sab));
        }
        .act .top {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .act .thumb {
          width: 66px;
          height: 62px;
          object-fit: contain;
          flex: none;
          background: #fff;
          border-radius: 15px;
          box-shadow: 0 2px 0 var(--line);
          padding: 4px;
        }
        .act .info {
          flex: 1;
          min-width: 0;
        }
        .act .cat {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .11em;
          text-transform: uppercase;
        }
        .act h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.1;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 5px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 8px;
          padding: 2px 6px;
          background: #fff;
          box-shadow: 0 1px 0 var(--line);
        }
        .chip svg {
          width: 13px;
          height: 13px;
        }
        .act .x {
          align-self: flex-start;
          width: 32px;
          height: 32px;
          border-radius: 11px;
          box-shadow: 0 2px 0 var(--line);
        }
        .act .x svg {
          width: 16px;
          height: 16px;
        }
        .hint {
          font-size: 12.5px;
          color: var(--ink2);
          margin: 9px 2px 0;
          min-height: 16px;
          font-weight: 500;
        }
        .hint.bad {
          color: #b91c1c;
        }
        .btns {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .btn {
          flex: 1;
          min-width: 0;
          height: 50px;
          border: 0;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #fff;
          background: var(--em);
          box-shadow: 0 4px 0 var(--emd);
          transition: transform .08s;
          white-space: nowrap;
        }
        .btn:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 var(--emd);
        }
        .btn svg {
          width: 19px;
          height: 19px;
        }
        .btn.sec {
          background: #fff;
          color: var(--ink);
          box-shadow: 0 4px 0 var(--line);
        }
        .btn.narrow {
          flex: 0 0 32%;
        }
        .btn.warn {
          background: var(--amb);
          box-shadow: 0 4px 0 var(--ambd);
        }
        .btn.danger {
          background: var(--red);
          box-shadow: 0 4px 0 #b91c1c;
        }
        .btn:disabled {
          background: #d8d0be;
          box-shadow: 0 4px 0 #bdb49f;
          color: #fff;
          transform: none;
        }
        /* Modal Sheets */
        #modal {
          position: absolute;
          inset: 0;
          background: rgba(10, 36, 28, .55);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 20;
        }
        .sheet {
          background: var(--cream);
          width: 100%;
          max-width: 560px;
          border-radius: 24px 24px 0 0;
          border-top: 3px solid #fff;
          padding: 16px 16px calc(18px + var(--sab));
          max-height: 88%;
          overflow: auto;
          animation: up .25s ease-out;
        }
        .sheet h2 {
          margin: 0 0 10px;
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sheet h2 img {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #d1fae5;
          object-fit: cover;
        }
        .sheet h2 .ib {
          margin-left: auto;
          width: 34px;
          height: 34px;
          box-shadow: 0 2px 0 var(--line);
        }
        .rule {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 8px 0;
          border-top: 1px solid #f0e2c2;
          font-size: 14px;
          line-height: 1.3;
          font-weight: 400;
        }
        .rule:first-of-type {
          border-top: 0;
        }
        .rule .bx {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          flex: none;
        }
        .rule b {
          font-weight: 600;
        }
        .kv {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
          border-top: 1px solid #f0e2c2;
          font-size: 14px;
        }
        .kv:first-of-type {
          border-top: 0;
        }
        .kv b {
          font-weight: 600;
          text-align: right;
        }
        .kv .neg {
          color: #b91c1c;
        }
        .kv .pos {
          color: #047857;
        }
        .sub {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--ink2);
          margin: 14px 0 2px;
        }
        .seg {
          display: flex;
          background: #f1e4c5;
          border-radius: 13px;
          padding: 3px;
          gap: 3px;
        }
        .seg button {
          flex: 1;
          border: 0;
          background: none;
          border-radius: 10px;
          padding: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--ink2);
        }
        .seg button.on {
          background: #fff;
          color: var(--ink);
          box-shadow: 0 2px 0 var(--line);
        }
        .sheet input {
          width: 100%;
          height: 50px;
          border-radius: 15px;
          border: 2px solid var(--line);
          background: #fff;
          padding: 0 14px;
          font: inherit;
          font-size: 18px;
          font-weight: 600;
          color: var(--ink);
          outline: none;
          user-select: text;
          -webkit-user-select: text;
        }
        .sheet input:focus {
          border-color: var(--amb);
        }
      `}</style>

      {/* World Canvas */}
      <canvas id="world" ref={canvasRef} aria-label="Tiko Beach Map" />

      {/* Top HUD */}
      <header id="hud" />

      {/* Bottom Controls & Dock */}
      <div id="bottom">
        <div className="mapctl" id="mapctl" />
        <section className="panel dock" id="dock" />
        <section className="panel act" id="act" hidden />
      </div>

      {/* Modal Dialog Sheets */}
      <div id="modal" hidden />
    </div>
  );
}
