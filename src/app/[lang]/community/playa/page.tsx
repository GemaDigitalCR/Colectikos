"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ZoomIn, ZoomOut, Move, Coins, RotateCcw, X, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { loadBeachState, saveBeachState, saveBeachName } from "../../../../actions/playa";
import { initMobileAudioUnlock, unlockAudio, playSynthesizedSound, playHtmlAudioClick } from "../../../../lib/soundUtils";

const GRID_SIZE = 25;


const ITEM_TYPES = {
  sombrilla: { id: "sombrilla", name: "Sombrilla", name_en: "Umbrella", w: 1, h: 1, cost: 100, attract: 2, cat: "entretenimiento", cat_en: "entertainment", cap: 15, pollution: 1, image: "/assets/playa/sombrilla.png?v=20261029_v1", offsetX: 4, offsetY: -8 },
  palmera: { id: "palmera", name: "Palmera", name_en: "Palm Tree", w: 1, h: 1, cost: 50, attract: 3, cat: "decoracion", cat_en: "decoration", cap: 0, pollution: -5, image: "/assets/playa/palmera.png?v=20261029_v1", offsetX: 0, offsetY: -16 },
  pipas: { id: "pipas", name: "Pipas y Copos", name_en: "Coconut Water", w: 2, h: 1, cost: 150, attract: 5, cat: "alimentacion", cat_en: "food", cap: 20, pollution: 4, image: "/assets/playa/pipas.png?v=20261029_v1" },
  soda: { id: "soda", name: "Soda", name_en: "Diner", w: 2, h: 2, cost: 300, attract: 10, cat: "alimentacion", cat_en: "food", cap: 60, pollution: 10, image: "/assets/playa/soda.png?v=20261029_v1" },
  restaurante: { id: "restaurante", name: "Restaurante", name_en: "Restaurant", w: 3, h: 3, cost: 1200, attract: 50, cat: "alimentacion", cat_en: "food", cap: 250, pollution: 25, image: "/assets/playa/restaurante.png?v=20261029_v1" },
  cabanas: { id: "cabanas", name: "Cabañas", name_en: "Cabins", w: 2, h: 2, cost: 1500, attract: 60, cat: "hospedaje", cat_en: "lodging", cap: 120, pollution: 12, image: "/assets/playa/cabanas.png?v=20261029_v1" },
  hotel: { id: "hotel", name: "Hotel Boutique", name_en: "Boutique Hotel", w: 3, h: 3, cost: 6000, attract: 300, cat: "hospedaje", cat_en: "lodging", cap: 600, pollution: 35, image: "/assets/playa/hotel.png?v=20261029_v1" },
  deportes: { id: "deportes", name: "Alquiler Deportes", name_en: "Sports Rental", w: 2, h: 2, cost: 400, attract: 20, cat: "entretenimiento", cat_en: "entertainment", cap: 40, pollution: 10, image: "/assets/playa/deportes.png?v=20261029_v1" },
  surf: { 
    id: "surf", 
    name: "Lecciones Surf", 
    name_en: "Surf Lessons", 
    w: 2, 
    h: 2, 
    cost: 350, 
    attract: 15, 
    cat: "entretenimiento", 
    cat_en: "entertainment", 
    cap: 30, 
    pollution: 5, 
    image: "/assets/playa/surf.png?v=20261029_v1",
  },
  artesanias: { id: "artesanias", name: "Artesanías", name_en: "Crafts", w: 2, h: 1, cost: 200, attract: 8, cat: "entretenimiento", cat_en: "entertainment", cap: 20, pollution: 5, image: "/assets/playa/artesanias.png?v=20261029_v1" },
  trampolin: { id: "trampolin", name: "Trampolín Acuático", name_en: "Water Trampoline", w: 1, h: 1, cost: 500, attract: 25, cat: "entretenimiento", cat_en: "entertainment", cap: 50, pollution: 2, image: "/assets/playa/trampolin.png?v=20261011_v3", hidden: true },
  inflable: { id: "inflable", name: "Parque Inflable", name_en: "Inflatable Park", w: 2, h: 2, cost: 1000, attract: 45, cat: "entretenimiento", cat_en: "entertainment", cap: 120, pollution: 8, image: "/assets/playa/inflable.png?v=20261029_v1" },
  reciclaje1: { id: "reciclaje1", name: "Punto Ecológico", name_en: "Eco Point", w: 1, h: 1, cost: 150, attract: 5, cat: "decoracion", cat_en: "decoration", cap: 0, pollution: -15, image: "/assets/playa/reciclaje1.png?v=20261029_v1", offsetX: 0, offsetY: -10 },
  reciclaje2: { id: "reciclaje2", name: "Centro Reciclaje", name_en: "Recycling Center", w: 1, h: 1, cost: 150, attract: 10, cat: "decoracion", cat_en: "decoration", cap: 0, pollution: -35, image: "/assets/playa/reciclaje2.png?v=20261029_v1", offsetX: 0, offsetY: -10 },
};

type PlacedItem = {
  id: string;
  type: string;
  row: number;
  col: number;
};

export default function PlayaTikolonesPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = use(params);
  const isEn = unwrappedParams.lang === 'en';
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [tikolones, setTikolones] = useState(0); 
  const [visitors, setVisitors] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [movingItem, setMovingItem] = useState<PlacedItem | null>(null);
  const [selectedPlacedItem, setSelectedPlacedItem] = useState<PlacedItem | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [beachName, setBeachName] = useState("Tikolones");
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isPinching, setIsPinching] = useState(false);

  // Control de sonido sintetizado con Web Audio API
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    document.title = isEn ? "Tiko Beach (Beta) | Colectikos" : "Tiko Playa (Beta) | Colectikos";
    const savedSound = localStorage.getItem('tiko_playa_sound');
    if (savedSound !== null) {
      setIsSoundEnabled(savedSound === 'true');
    }
    const cleanup = initMobileAudioUnlock();
    return cleanup;
  }, []);

  const playSound = (type: 'build' | 'relocate' | 'select_tool' | 'select_placed' | 'sell' | 'error' | 'reward') => {
    playSynthesizedSound(isSoundEnabled, (ctx, t0) => {
      if (type === 'build') {
        // Golpe táctil de madera/arena + acorde armónico playero (E5, G#5, B5, E6)
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(320, t0);
        popOsc.frequency.exponentialRampToValueAtTime(80, t0 + 0.1);
        popGain.gain.setValueAtTime(0.38, t0);
        popGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
        popOsc.connect(popGain);
        popGain.connect(ctx.destination);
        popOsc.start(t0);
        popOsc.stop(t0 + 0.1);

        [659.25, 830.61, 987.77, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = t0 + 0.04 + idx * 0.04;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.35, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.26);
        });
      } else if (type === 'relocate') {
        // Sonido suave de colocar al reubicar estructura
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t0);
        osc.frequency.exponentialRampToValueAtTime(560, t0 + 0.12);
        gain.gain.setValueAtTime(0.35, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.12);
      } else if (type === 'select_tool') {
        // Blip tipo marimba al seleccionar herramienta en catálogo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, t0);
        gain.gain.setValueAtTime(0.35, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.09);
      } else if (type === 'select_placed') {
        // Toque sutil sobre edificio en la arena
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, t0);
        osc.frequency.exponentialRampToValueAtTime(640, t0 + 0.08);
        gain.gain.setValueAtTime(0.35, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.08);
      } else if (type === 'sell') {
        // Tintineo metálico de monedas al vender o reciclar
        [1318.51, 1975.53, 2637.02].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = t0 + idx * 0.07;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.35, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.28);
        });
      } else if (type === 'error') {
        // Sonido suave de bloqueo o fondos insuficientes
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(360, t0);
        osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.16);
        gain.gain.setValueAtTime(0.35, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.16);
      } else if (type === 'reward') {
        // Fanfarria festiva tropical para logros y recompensas
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const start = t0 + idx * 0.08;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.45, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.4);
        });
      }
    });
  };

  const toggleSound = () => {
    const nextVal = !isSoundEnabled;
    setIsSoundEnabled(nextVal);
    localStorage.setItem('tiko_playa_sound', String(nextVal));
    if (nextVal) {
      unlockAudio();
      playHtmlAudioClick();
      playSound('select_tool');
      toast.success(isEn ? 'Sound ON 🔊' : 'Sonido activado 🔊', {
        description: isEn 
          ? 'Check that your device media volume is up' 
          : 'Verifica que el volumen multimedia de tu teléfono esté arriba',
        duration: 2500,
      });
    } else {
      toast.info(isEn ? 'Sound OFF 🔇' : 'Sonido desactivado 🔇', { duration: 1500 });
    }
  };

  const backgroundGrid = Array.from({ length: GRID_SIZE * GRID_SIZE });
  
  const itemsRef = useRef(placedItems);
  const tikolonesRef = useRef(tikolones);
  const visitorsRef = useRef(visitors);
  const lastAlertTimeRef = useRef(0);
  const zoomRef = useRef(zoom);
  const isPinchingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    itemsRef.current = placedItems;
    tikolonesRef.current = tikolones;
    visitorsRef.current = visitors;
    zoomRef.current = zoom;
  }, [placedItems, tikolones, visitors, zoom]);

  // Soporte de Pinch-to-Zoom táctil y Rueda de mouse / Trackpad
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let initialDist = 0;
    let initialZoomVal = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinchingRef.current = true;
        setIsPinching(true);
        initialDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoomVal = zoomRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinchingRef.current && initialDist > 0) {
        if (e.cancelable) e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / initialDist;
        const target = Math.min(2.0, Math.max(0.5, initialZoomVal * factor));
        setZoom(Number(target.toFixed(2)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
        setIsPinching(false);
        initialDist = 0;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.cancelable) e.preventDefault();
        const delta = -e.deltaY * 0.01;
        setZoom(prev => {
          const next = Math.min(2.0, Math.max(0.5, prev + delta));
          return Number(next.toFixed(2));
        });
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Soporte para tecla Escape (cancelar mover, deseleccionar estructura o salir de modo edición)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (movingItem) {
          handleCancelMove();
        } else if (selectedPlacedItem) {
          setSelectedPlacedItem(null);
        } else if (isManageMode) {
          setIsManageMode(false);
        } else if (selectedTool) {
          setSelectedTool(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movingItem, selectedPlacedItem, isManageMode, selectedTool]);

  useEffect(() => {
    const init = async () => {
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
          setPlacedItems(res.gridState || []);
          setTikolones(res.tikolones);
          setVisitors(res.visitors);
          if (res.name) {
            setBeachName(res.name);
          }
          
          if (res.alerts?.dailyXp) {
            playSound('reward');
            toast.success(isEn ? `Daily Reward! You earned ${res.alerts.dailyXp} XP for playing Tiko Beach (Beta) today.` : `¡Recompensa Diaria! Has ganado ${res.alerts.dailyXp} XP por jugar Tiko Playa (Beta) hoy.`, { icon: '🎁', duration: 6000 });
          }
          if (res.alerts?.newTikolonesFromXp) {
            playSound('sell');
            toast.success(isEn ? `Investor! Your accumulated XP was converted into ${res.alerts.newTikolonesFromXp} Tikolones for your beach.` : `¡Inversor! Se han convertido tus XP acumulados en ${res.alerts.newTikolonesFromXp} Tikolones para tu playa.`, { icon: '🪙', duration: 7000 });
          }
        } else {
          setTikolones(5000);
        }
      } catch (err) {
        console.warn("Error cargando estado de la playa:", err);
        setTikolones(5000);
      }
      setIsLoaded(true);
    };

    init();
  }, []);

  // Centrar la cámara directamente en la cuadrícula de arena (omitiendo el mar lateral)
  const centerOnBoard = useCallback((smooth = false) => {
    const board = document.getElementById('tiko-playa-board');
    const container = scrollContainerRef.current || document.getElementById('grid-scroll-container');
    if (board && container) {
      const bRect = board.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const deltaX = (bRect.left + bRect.width / 2) - (cRect.left + cRect.width / 2);
      const deltaY = (bRect.top + bRect.height / 2) - (cRect.top + cRect.height / 2);
      if (smooth) {
        container.scrollBy({ left: deltaX, top: deltaY, behavior: 'smooth' });
      } else {
        container.scrollLeft += deltaX;
        container.scrollTop += deltaY;
      }
    }
  }, []);

  // Centrar la cámara en la arena y ajustar zoom óptimo en móviles al cargar
  useEffect(() => {
    if (!isLoaded) return;

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setZoom(0.65);
    }

    const timer1 = setTimeout(() => centerOnBoard(false), 50);
    const timer2 = setTimeout(() => centerOnBoard(false), 150);
    const timer3 = setTimeout(() => centerOnBoard(false), 400);

    const handleResize = () => centerOnBoard(false);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoaded, centerOnBoard]);

  // Lógica de Atractivo y Densidad
  const occupiedCells = placedItems.reduce((acc, item) => {
    const def = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];
    return acc + (def.w * def.h);
  }, 0);
  const totalCells = GRID_SIZE * GRID_SIZE; 
  const density = occupiedCells / totalCells;
  
  let densityPenalty = 1;
  if (density > 0.4) {
    densityPenalty = 1 - ((density - 0.4) * 2.5);
    if (densityPenalty < 0) densityPenalty = 0;
  }

  // Capacidades
  const caps = placedItems.reduce((acc, item) => {
    const def = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];
    if (def.cat === 'hospedaje') acc.hospedaje += def.cap;
    if (def.cat === 'alimentacion') acc.alimentacion += def.cap;
    if (def.cat === 'entretenimiento') acc.entretenimiento += def.cap;
    return acc;
  }, { hospedaje: 0, alimentacion: 0, entretenimiento: 0 });

  // Se suma una capacidad base de 40 para que al colocar el primer item no baje la capacidad inicial
  const maxHospedaje = 40 + caps.hospedaje;
  const maxAlimentacion = 40 + caps.alimentacion;
  const maxEntretenimiento = 40 + caps.entretenimiento;

  const isHospedajeFull = visitors > maxHospedaje;
  const isAlimentacionFull = visitors > maxAlimentacion;
  const isEntretenimientoFull = visitors > maxEntretenimiento;

  const isOverCapacity = isHospedajeFull || isAlimentacionFull || isEntretenimientoFull;

  const baseAttractiveness = placedItems.reduce((acc, item) => acc + (ITEM_TYPES[item.type as keyof typeof ITEM_TYPES]?.attract || 0), 0);
  const currentPollution = Math.max(0, placedItems.reduce((acc, item) => acc + (ITEM_TYPES[item.type as keyof typeof ITEM_TYPES]?.pollution || 0), 0));
  
  // Penalidad extra por sobrecapacidad y contaminación
  const capacityPenalty = isOverCapacity ? 0.1 : 1; 
  const pollutionPenalty = Math.max(0.1, 1 - (currentPollution * 0.005));
  const effectiveAttractiveness = Math.floor(baseAttractiveness * densityPenalty * capacityPenalty * pollutionPenalty);
  const percentFull = Math.round(density * 100);

  // Game loop
  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(async () => {
      // Pausar el juego si el usuario está en otra pestaña o minimizó el navegador
      if (typeof document !== 'undefined' && document.hidden) return;

      const currentItems = itemsRef.current;
      const currentTikolones = tikolonesRef.current;
      const currentVisitors = visitorsRef.current;
      
      const currentOccupied = currentItems.reduce((acc, item) => {
        const def = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];
        return acc + (def ? def.w * def.h : 0);
      }, 0);
      const currentDensity = currentOccupied / totalCells;
      
      let curDensityPenalty = 1;
      if (currentDensity > 0.4) {
        curDensityPenalty = 1 - ((currentDensity - 0.4) * 2.5);
        if (curDensityPenalty < 0) curDensityPenalty = 0;
      }
      
      const curCaps = currentItems.reduce((acc, item) => {
        const def = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];
        if (!def) return acc;
        if (def.cat === 'hospedaje') acc.hospedaje += def.cap;
        if (def.cat === 'alimentacion') acc.alimentacion += def.cap;
        if (def.cat === 'entretenimiento') acc.entretenimiento += def.cap;
        return acc;
      }, { hospedaje: 0, alimentacion: 0, entretenimiento: 0 });

      const curMaxHospedaje = 40 + curCaps.hospedaje;
      const curMaxAlimentacion = 40 + curCaps.alimentacion;
      const curMaxEntretenimiento = 40 + curCaps.entretenimiento;

      const curIsHospedajeFull = currentVisitors > curMaxHospedaje;
      const curIsAlimentacionFull = currentVisitors > curMaxAlimentacion;
      const curIsEntretenimientoFull = currentVisitors > curMaxEntretenimiento;
      const curIsOverCapacity = curIsHospedajeFull || curIsAlimentacionFull || curIsEntretenimientoFull;

      // Nudge / Alerts
      if (curIsOverCapacity) {
        const now = Date.now();
        // Mostrar alerta máximo cada 45 segundos para no volver loco al usuario
        if (now - lastAlertTimeRef.current > 45000) {
          if (curIsAlimentacionFull) {
            toast.error(isEn ? "Your visitors are hungry and the food spots are full! Build more Food." : "¡Tus visitantes tienen hambre y la soda/restaurante está llena! Construye más para Alimentación.", { id: 'cap-alimentacion' });
          } else if (curIsHospedajeFull) {
            toast.error(isEn ? "Your lodging is full, build more Cabins or Hotels to receive more visitors." : "Tus hospedajes están llenos, construye más Cabañas u Hoteles para recibir más visitantes.", { id: 'cap-hospedaje' });
          } else if (curIsEntretenimientoFull) {
            toast.error(isEn ? "The beach is boring. Build more Entertainment (Surf, Sports) to retain visitors!" : "La playa está aburrida. ¡Construye más Entretenimiento (Surf, Deportes) para retener visitantes!", { id: 'cap-entretenimiento' });
          }
          lastAlertTimeRef.current = now;
        }
      }

      const curBaseAttr = currentItems.reduce((acc, item) => acc + (ITEM_TYPES[item.type as keyof typeof ITEM_TYPES]?.attract || 0), 0);
      const curPollution = Math.max(0, currentItems.reduce((acc, item) => acc + (ITEM_TYPES[item.type as keyof typeof ITEM_TYPES]?.pollution || 0), 0));
      const curCapPenalty = curIsOverCapacity ? 0.1 : 1;
      const curPollutionPenalty = Math.max(0.1, 1 - (curPollution * 0.005));
      const curEffAttr = Math.floor(curBaseAttr * curDensityPenalty * curCapPenalty * curPollutionPenalty);

      let newVisitors = 0;
      
      // Si la playa está sobrepasada, los visitantes se van poco a poco
      if (curIsOverCapacity && currentVisitors > 10) {
         newVisitors = -Math.floor(currentVisitors * 0.05); // 5% se va si hay sobrecupo
         if (newVisitors === 0) newVisitors = -1;
      } else if (curEffAttr > 0 && !curIsOverCapacity) {
         // Crecimiento logarítmico drásticamente reducido (1/15 de la velocidad)
         const fractionalVisitors = Math.log2(curEffAttr + 1) / 15;
         newVisitors = Math.floor(fractionalVisitors);
         if (Math.random() < (fractionalVisitors - newVisitors)) {
            newVisitors += 1;
         }
      }

      // NUEVA LÓGICA ECONÓMICA TYCOON: Cobras renta (Tikolones)
      // Curva sub-lineal fuerte (potencia 0.4) + ganancias offline.
      const passiveIncome = Math.floor(Math.pow(currentVisitors, 0.4) * 2) + (Math.random() < 0.3 && currentVisitors > 0 ? 1 : 0);
      
      if (newVisitors !== 0 || passiveIncome > 0) {
        const currentTotalVisitors = Math.max(0, currentVisitors + newVisitors);
        setVisitors(currentTotalVisitors);
        setTikolones((prev) => prev + passiveIncome);

        let localUsername = localStorage.getItem('localUsername') || undefined;
        try {
          const profileData = localStorage.getItem('userProfileData');
          if (profileData) {
            const parsed = JSON.parse(profileData);
            if (parsed.username) localUsername = parsed.username;
          }
        } catch (e) {}

        // Guardamos en BD. A lifetimeVisitors solo se le suman los > 0, y actualizamos los visitantes actuales de manera absoluta.
        try {
          const saveRes = await saveBeachState(
            currentItems, 
            currentTikolones + passiveIncome, 
            currentTotalVisitors,
            newVisitors > 0 ? newVisitors : 0, 
            localUsername
          );
          
          if (saveRes && saveRes.success && saveRes.xpAwarded && saveRes.xpAwarded > 0) {
            playSound('reward');
            toast.success(isEn ? `Milestone Reached! You received +${saveRes.xpAwarded} XP for attracting many visitors.` : `¡Hito Alcanzado! Has recibido +${saveRes.xpAwarded} XP por atraer muchos visitantes.`, { icon: '🌟', duration: 5000 });
          }
        } catch (err) {
          console.warn("Auto-save beach state warning (temporary or build desync):", err);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  const canPlace = (typeId: string, row: number, col: number) => {
    const itemDef = ITEM_TYPES[typeId as keyof typeof ITEM_TYPES];
    if (row + itemDef.h > GRID_SIZE || col + itemDef.w > GRID_SIZE) return false;
    
    for (const item of placedItems) {
      const def = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];
      const overlap = !(
        col + itemDef.w <= item.col || 
        col >= item.col + def.w ||     
        row + itemDef.h <= item.row || 
        row >= item.row + def.h        
      );
      if (overlap) return false;
    }
    return true;
  };

  const handleStartMove = (item: PlacedItem) => {
    setSelectedPlacedItem(null);
    setIsManageMode(false);
    setPlacedItems(prev => prev.filter(i => i.id !== item.id));
    setMovingItem(item);
    toast.info(
      isEn 
        ? `Move Mode: Tap any free sand spot to relocate ${ITEM_TYPES[item.type as keyof typeof ITEM_TYPES]?.name_en || 'item'}.`
        : `Modo Mover: Toca una casilla libre en la arena para reubicar tu ${ITEM_TYPES[item.type as keyof typeof ITEM_TYPES]?.name || 'artículo'}.`,
      { icon: '📍', duration: 4000 }
    );
  };

  const handleCancelMove = () => {
    if (!movingItem) return;
    setPlacedItems(prev => [...prev, movingItem]);
    setMovingItem(null);
  };

  const handleSellItem = async (item: PlacedItem) => {
    const def = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];
    if (!def) return;
    const refund = Math.floor(def.cost * 0.5);
    const updatedItems = placedItems.filter(i => i.id !== item.id);
    const updatedTikolones = tikolones + refund;

    setPlacedItems(updatedItems);
    setTikolones(updatedTikolones);
    setSelectedPlacedItem(null);
    setIsManageMode(false);
    playSound('sell');

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#F59E0B', '#FBBF24', '#10B981', '#34D399']
      });
    } catch (e) {}

    toast.success(
      isEn 
        ? `Sold! You recovered +${refund} Tikolones for recycling your ${def.name_en}.` 
        : `¡Vendido! Has recuperado +${refund} Tikolones por reciclar tu ${def.name}.`,
      { icon: '🪙', duration: 4500 }
    );

    let localUsername = localStorage.getItem('localUsername') || undefined;
    try {
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        const parsed = JSON.parse(profileData);
        if (parsed.username) localUsername = parsed.username;
      }
    } catch (e) {}

    try {
      await saveBeachState(updatedItems, updatedTikolones, visitors, 0, localUsername);
    } catch (err) {
      console.warn("Error guardando venta:", err);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (movingItem) {
      const itemDef = ITEM_TYPES[movingItem.type as keyof typeof ITEM_TYPES];
      const targetRow = row - Math.floor(itemDef.h / 2);
      const targetCol = col - Math.floor(itemDef.w / 2);

      if (targetRow < 0 || targetCol < 0 || !canPlace(movingItem.type, targetRow, targetCol)) {
        playSound('error');
        toast.error(isEn ? "Not enough space here! Choose a free area." : "¡No hay suficiente espacio aquí! Elige un área libre.");
        return;
      }
      const updatedItems = [...placedItems, { ...movingItem, row: targetRow, col: targetCol }];
      setPlacedItems(updatedItems);
      setMovingItem(null);
      playSound('relocate');
      toast.success(isEn ? "Structure relocated successfully!" : "¡Estructura reubicada con éxito!", { icon: '✨', duration: 3000 });

      let localUsername = localStorage.getItem('localUsername') || undefined;
      try {
        const profileData = localStorage.getItem('userProfileData');
        if (profileData) {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        }
      } catch (e) {}
      try {
        saveBeachState(updatedItems, tikolones, visitors, 0, localUsername);
      } catch (err) {}
      return;
    }

    if (selectedPlacedItem) {
      setSelectedPlacedItem(null);
      return;
    }

    if (isManageMode) {
      setIsManageMode(false);
      return;
    }

    if (!selectedTool) return;
    
    const itemDef = ITEM_TYPES[selectedTool as keyof typeof ITEM_TYPES];
    const targetRow = row - Math.floor(itemDef.h / 2);
    const targetCol = col - Math.floor(itemDef.w / 2);
    
    if (tikolones < itemDef.cost) {
      playSound('error');
      toast.error(isEn ? "Not enough Tikolones!" : "¡No tienes suficientes Tikolones!");
      return;
    }

    if (targetRow < 0 || targetCol < 0 || !canPlace(selectedTool, targetRow, targetCol)) {
      playSound('error');
      toast.error(isEn ? "Not enough space here! The area is occupied or outside the beach." : "¡No hay suficiente espacio aquí! El área está ocupada o te sales de la playa.");
      return;
    }

    const newTikolones = tikolones - itemDef.cost;
    const newItems = [...placedItems, { id: Math.random().toString(), type: selectedTool, row: targetRow, col: targetCol }];
    
    setTikolones(newTikolones);
    setPlacedItems(newItems);
    playSound('build');
  };

  if (!isLoaded) return <div className="p-10 text-center font-bold text-stone-600">{isEn ? "Loading Tiko Beach (Beta)..." : "Cargando Tiko Playa (Beta)..."}</div>;

  return (
    <div className="w-full min-h-screen bg-sky-100 p-4 font-sans text-stone-800">
      
      {/* Barra superior de navegación y sonido */}
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Link 
            href={`/${unwrappedParams.lang}/community`} 
            className="inline-flex items-center gap-1.5 text-stone-600 hover:text-amber-800 text-xs sm:text-sm font-semibold transition-colors bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>{isEn ? "Community" : "Comunidad"}</span>
          </Link>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {isEn ? "Tiko Beach (Beta)" : "Tiko Playa (Beta)"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de Sonido */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isSoundEnabled ? "Silenciar sonido" : "Activar sonido"}
            className="h-8 px-3 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center gap-1.5 text-stone-700 hover:text-amber-700 hover:bg-amber-50 transition-all active:scale-95 text-xs font-bold"
            title={isSoundEnabled ? (isEn ? "Mute Sound" : "Silenciar") : (isEn ? "Enable Sound" : "Activar Sonido")}
          >
            {isSoundEnabled ? <Volume2 size={16} className="text-amber-600" /> : <VolumeX size={16} className="text-stone-400" />}
            <span className="hidden sm:inline">{isSoundEnabled ? (isEn ? "Sound ON" : "Sonido ON") : (isEn ? "Sound OFF" : "Sonido OFF")}</span>
          </button>
        </div>
      </div>

      {/* Header / Stats */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-4 mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-stone-100 pb-4">
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏖️ {isEn ? "Beach" : "Playa"}</span>
                <input 
                  type="text" 
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="text-2xl font-black text-amber-600 border-b-2 border-amber-300 focus:outline-none bg-transparent w-48"
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      setIsEditingName(false);
                      if (draftName.trim() && draftName !== beachName) {
                        setBeachName(draftName.trim());
                        
                        let localUsername = localStorage.getItem('localUsername') || undefined;
                        const profileData = localStorage.getItem('userProfileData');
                        if (profileData) {
                          try {
                            const parsed = JSON.parse(profileData);
                            if (parsed.username) localUsername = parsed.username;
                          } catch (e) {}
                        }
                        
                        try {
                          await saveBeachName(draftName.trim(), localUsername);
                          toast.success(isEn ? 'Name updated' : 'Nombre actualizado');
                        } catch (err) {
                          console.warn("Error guardando nombre de playa:", err);
                        }
                      }
                    } else if (e.key === 'Escape') {
                      setIsEditingName(false);
                    }
                  }}
                />
                <button 
                  onClick={async () => {
                    setIsEditingName(false);
                    if (draftName.trim() && draftName !== beachName) {
                      setBeachName(draftName.trim());
                      let localUsername = localStorage.getItem('localUsername') || undefined;
                      const profileData = localStorage.getItem('userProfileData');
                      if (profileData) {
                        try {
                          const parsed = JSON.parse(profileData);
                          if (parsed.username) localUsername = parsed.username;
                        } catch (e) {}
                      }
                      try {
                        await saveBeachName(draftName.trim(), localUsername);
                        toast.success(isEn ? 'Name updated' : 'Nombre actualizado');
                      } catch (err) {
                        console.warn("Error guardando nombre de playa:", err);
                      }
                    }
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-2 py-1 rounded-md font-bold transition-colors"
                >
                  {isEn ? "Save" : "Guardar"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group flex-wrap">
                <h1 className="text-2xl font-black text-amber-600">🏖️ {isEn ? "Beach" : "Playa"} {beachName}</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  {isEn ? "Tiko Beach (Beta)" : "Tiko Playa (Beta)"}
                </span>
                <button 
                  onClick={() => {
                    setDraftName(beachName);
                    setIsEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-amber-600 text-sm flex items-center gap-1"
                >
                  ✏️ {isEn ? "Edit name" : "Editar nombre"}
                </button>
              </div>
            )}
            <p className="text-sm text-stone-500 hidden md:block">
              {isEn ? "Keep your visitors happy by expanding your beach." : "Mantén a tus visitantes felices expandiendo tu playa."}
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 w-full sm:w-auto">
            <div className="bg-amber-100 text-amber-800 p-2 sm:px-4 sm:py-2 rounded-xl font-bold flex flex-col justify-center items-center gap-0.5 sm:gap-1 text-center min-w-0">
              <div className="flex items-center gap-1 text-xs sm:text-base font-black truncate"><span>🪙</span> {tikolones}</div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black opacity-70 truncate">Tikolones</span>
            </div>
            <div className="bg-emerald-100 text-emerald-800 p-2 sm:px-4 sm:py-2 rounded-xl font-bold flex flex-col justify-center items-center gap-0.5 sm:gap-1 text-center min-w-0">
              <div className="flex items-center gap-1 text-xs sm:text-base font-black truncate"><span>🧍</span> {visitors}</div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black opacity-70 truncate">{isEn ? "Visitors" : "Visitantes"}</span>
            </div>
            <div className={`p-2 sm:px-4 sm:py-2 rounded-xl font-bold flex flex-col justify-center items-center gap-0.5 sm:gap-1 text-center min-w-0 transition-colors ${density > 0.4 ? 'bg-red-100 text-red-800' : 'bg-pink-100 text-pink-800'}`}>
              <div className="flex items-center gap-1 text-xs sm:text-base font-black truncate">
                 <span>✨</span> {effectiveAttractiveness}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black opacity-70 truncate">{isEn ? "Attract." : "Atractivo"}</span>
            </div>
            <div className={`p-2 sm:px-4 sm:py-2 rounded-xl font-bold flex flex-col justify-center items-center gap-0.5 sm:gap-1 text-center min-w-0 transition-colors ${currentPollution > 10 ? 'bg-stone-300 text-stone-800' : 'bg-green-100 text-green-800'}`}>
              <div className="flex items-center gap-1 text-xs sm:text-base font-black truncate">
                 <span>♻️</span> {currentPollution}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black opacity-70 truncate">{isEn ? "Pollution" : "Contam."}</span>
            </div>
          </div>
        </div>

        {/* Dashboard de Capacidades */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Hospedaje */}
          <div className={`p-2 sm:p-3 rounded-xl border-2 flex flex-col gap-1 min-w-0 ${isHospedajeFull ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-blue-900">
              <span className="truncate">🛏️ <span className="hidden sm:inline">{isEn ? 'Lodging' : 'Hospedaje'}</span></span>
              <span className={`text-[10px] sm:text-sm font-black ${isHospedajeFull ? 'text-red-600' : ''}`}>{visitors}/{maxHospedaje}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
              <div className={`h-2 sm:h-2.5 rounded-full ${isHospedajeFull ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, (visitors / maxHospedaje) * 100)}%` }}></div>
            </div>
          </div>

          {/* Alimentación */}
          <div className={`p-2 sm:p-3 rounded-xl border-2 flex flex-col gap-1 min-w-0 ${isAlimentacionFull ? 'border-red-400 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
            <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-orange-900">
              <span className="truncate">🍔 <span className="hidden sm:inline">{isEn ? 'Food' : 'Alimentación'}</span></span>
              <span className={`text-[10px] sm:text-sm font-black ${isAlimentacionFull ? 'text-red-600' : ''}`}>{visitors}/{maxAlimentacion}</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
              <div className={`h-2 sm:h-2.5 rounded-full ${isAlimentacionFull ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(100, (visitors / maxAlimentacion) * 100)}%` }}></div>
            </div>
          </div>

          {/* Entretenimiento */}
          <div className={`p-2 sm:p-3 rounded-xl border-2 flex flex-col gap-1 min-w-0 ${isEntretenimientoFull ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-purple-50'}`}>
            <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-purple-900">
              <span className="truncate">🏄 <span className="hidden sm:inline">{isEn ? 'Fun' : 'Entretenimiento'}</span></span>
              <span className={`text-[10px] sm:text-sm font-black ${isEntretenimientoFull ? 'text-red-600' : ''}`}>{visitors}/{maxEntretenimiento}</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
              <div className={`h-2 sm:h-2.5 rounded-full ${isEntretenimientoFull ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(100, (visitors / maxEntretenimiento) * 100)}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 md:h-[75vh]">
        
        {/* Toolbar */}
        <div className="order-2 md:order-1 w-full md:w-72 bg-white rounded-2xl shadow-md p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto max-h-[50vh] md:max-h-full">
          <h2 className="font-bold text-lg mb-1">{isEn ? 'Build' : 'Construir'}</h2>

          {/* Botón de acceso rápido a Mover o Re-vender en la barra lateral */}
          <button
            type="button"
            onClick={() => {
              if (movingItem) handleCancelMove();
              setSelectedTool(null);
              setSelectedPlacedItem(null);
              const nextState = !isManageMode;
              setIsManageMode(nextState);
              if (nextState) {
                toast.info(
                  isEn 
                    ? "Touch any building on the beach to relocate or sell it." 
                    : "Toca el edificio o artículo que deseas mover o re-vender.",
                  { icon: '✥', duration: 4000 }
                );
              }
            }}
            className={`w-full p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all mb-1 ${
              isManageMode
                ? 'border-amber-500 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md animate-pulse'
                : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-400'
            }`}
          >
            <Move size={15} className={`stroke-[2.5] ${isManageMode ? 'text-white' : 'text-amber-800'}`} />
            <span>{isManageMode ? (isEn ? "Exit Edit Mode" : "Salir de Modo Edición") : (isEn ? "Move or Resell" : "Mover o Re-vender")}</span>
          </button>
          
          {movingItem && (
             <div className="bg-amber-100 border border-amber-300 p-3 rounded-xl shadow-sm mb-2 text-sm text-amber-800 font-bold animate-pulse flex items-center justify-between gap-2">
               <span>{isEn ? "Moving structure. Tap the beach to place it." : "Moviendo estructura. Toca la playa para reubicarla."}</span>
               <button onClick={handleCancelMove} className="text-xs bg-amber-200 hover:bg-amber-300 px-2 py-1 rounded-md font-black">
                 {isEn ? "Cancel" : "Cancelar"}
               </button>
             </div>
          )}

          {selectedPlacedItem && (() => {
            const def = ITEM_TYPES[selectedPlacedItem.type as keyof typeof ITEM_TYPES];
            if (!def) return null;
            const refundAmount = Math.floor(def.cost * 0.5);
            return (
              <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl shadow-sm mb-2 animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                    {isEn ? "Selected Structure" : "Estructura Seleccionada"}
                  </span>
                  <button 
                    onClick={() => setSelectedPlacedItem(null)} 
                    className="w-5 h-5 rounded-full hover:bg-amber-200 text-stone-500 flex items-center justify-center transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-10 h-10 bg-white rounded-lg border border-amber-200 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                    {def.image ? (
                      <img src={def.image} alt={def.name} className="w-full h-full object-contain" />
                    ) : (
                      <span>🏖️</span>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-sm text-stone-800 leading-tight">{isEn ? def.name_en : def.name}</p>
                    <p className="text-[11px] text-amber-700 font-bold">{isEn ? `Cost: ${def.cost} 🪙` : `Costo: ${def.cost} 🪙`}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartMove(selectedPlacedItem)}
                    className="py-2 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Move size={14} className="stroke-[2.5]" />
                    <span>{isEn ? "Move" : "Mover"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSellItem(selectedPlacedItem)}
                    className="py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                    title={isEn ? `Sell for ${refundAmount} Tikolones (50%)` : `Vender por ${refundAmount} Tikolones (50%)`}
                  >
                    <Coins size={14} />
                    <span>{`+${refundAmount} 🪙`}</span>
                  </button>
                </div>
              </div>
            );
          })()}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-col gap-2">
            {Object.values(ITEM_TYPES).filter((item) => !(item as any).hidden).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedPlacedItem(null);
                  const nextTool = selectedTool === item.id ? null : item.id;
                  setSelectedTool(nextTool);
                  if (nextTool) playSound('select_tool');
                }}
                className={`p-2.5 sm:p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                  selectedTool === item.id 
                    ? 'border-amber-500 bg-amber-50 scale-105 shadow-md' 
                    : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                }`}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-md shadow-sm border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                  {item.image ? (
                     <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                     <span className="text-stone-400 text-xs text-center p-1">{item.w}x{item.h}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold leading-tight truncate">{isEn ? (item as any).name_en : item.name}</p>
                  <div className="flex gap-1.5 mt-1">
                     <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 font-bold uppercase">{isEn ? (item as any).cat_en : item.cat}</span>
                     <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">Cap: {item.cap}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-xs font-bold text-amber-600">{item.cost} TIK</span>
                    <div className="flex gap-2">
                       <span className={`text-xs font-bold ${item.pollution > 0 ? 'text-stone-500' : 'text-green-600'}`}>
                          {item.pollution > 0 ? `+${item.pollution}` : item.pollution}♻️
                       </span>
                       <span className="text-xs font-bold text-pink-600">+{item.attract}✨</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-4 border-t border-stone-200 flex flex-col gap-2">
             {movingItem ? (
                <button 
                  onClick={handleCancelMove}
                  className="w-full p-2.5 rounded-xl border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 text-sm font-bold text-amber-800 flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <RotateCcw size={16} />
                  <span>{isEn ? "Cancel Move" : "Cancelar Mover"}</span>
               </button>
             ) : selectedPlacedItem ? (
                <button 
                  onClick={() => setSelectedPlacedItem(null)}
                  className="w-full p-2.5 rounded-xl border-2 border-stone-300 bg-stone-50 hover:bg-stone-100 text-sm font-bold text-stone-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <X size={16} />
                  <span>{isEn ? "Deselect Structure" : "Deseleccionar"}</span>
                </button>
             ) : (
                <button 
                  onClick={() => setSelectedTool(null)}
                  disabled={!selectedTool}
                  className={`w-full p-2.5 rounded-xl border-2 ${selectedTool ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer' : 'border-stone-200 text-stone-300 cursor-default'} text-sm font-bold transition-colors`}
                >
                  {isEn ? "Cancel Selection" : "Cancelar Selección"}
               </button>
             )}
          </div>
        </div>

        {/* Game Grid Wrapper */}
        <div className="order-1 md:order-2 flex-1 relative flex flex-col min-w-0 w-full h-[58vh] sm:h-[65vh] md:h-full min-h-[380px] overflow-hidden rounded-2xl shadow-inner border-4 border-[#8B5A2B] bg-[#c2913f]">
          
          {/* Card Flotante de Gestión / Inspector de Estructura Seleccionada */}
          {selectedPlacedItem && (() => {
            const def = ITEM_TYPES[selectedPlacedItem.type as keyof typeof ITEM_TYPES];
            if (!def) return null;
            const refundAmount = Math.floor(def.cost * 0.5);

            return (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-amber-400 p-4 transition-all animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center p-1 overflow-hidden shadow-inner flex-shrink-0">
                      {def.image ? (
                        <img src={def.image} alt={def.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">🏖️</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-stone-800 leading-tight">
                          {isEn ? def.name_en : def.name}
                        </h3>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black">
                          {isEn ? def.cat_en : def.cat}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-stone-600 font-bold">
                        <span className="text-pink-600">+{def.attract} ✨</span>
                        <span>•</span>
                        <span className="text-blue-600">Cap: {def.cap} 👥</span>
                        <span>•</span>
                        <span className={def.pollution > 0 ? "text-stone-500" : "text-emerald-600"}>
                          {def.pollution > 0 ? `+${def.pollution}` : def.pollution} ♻️
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlacedItem(null)}
                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-500 flex items-center justify-center transition-colors shadow-sm"
                    title={isEn ? "Close" : "Cerrar"}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  {/* Botón 1: Mover / Relocalizar (con cruz de puntas de flecha) */}
                  <button
                    type="button"
                    onClick={() => handleStartMove(selectedPlacedItem)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all group"
                  >
                    <Move size={16} className="stroke-[2.5] group-hover:scale-110 transition-transform" />
                    <span>{isEn ? "Relocate / Move" : "Mover / Reubicar"}</span>
                  </button>

                  {/* Botón 2: Re-vender al 50% de valor */}
                  <button
                    type="button"
                    onClick={() => handleSellItem(selectedPlacedItem)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all group"
                    title={isEn ? `Sell for ${refundAmount} Tikolones (50%)` : `Vender por ${refundAmount} Tikolones (50%)`}
                  >
                    <Coins size={16} className="group-hover:scale-110 transition-transform" />
                    <span>{isEn ? `Sell (+${refundAmount} 🪙)` : `Vender (+${refundAmount} 🪙)`}</span>
                  </button>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    {isEn 
                      ? "💡 Tap a free tile after moving or resell for 50% Tikolones." 
                      : "💡 Reubícalo gratis o recupéralo al 50% en Tikolones."}
                  </span>
                  <span className="font-bold text-amber-700">Cost: {def.cost} 🪙</span>
                </div>
              </div>
            );
          })()}

          {/* Banner Flotante en Modo Mover / Reubicación */}
          {movingItem && (() => {
            const def = ITEM_TYPES[movingItem.type as keyof typeof ITEM_TYPES];
            return (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-amber-500/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white p-3.5 text-white animate-pulse">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
                      <Move size={20} className="text-white stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-100">
                        {isEn ? "📍 Relocating Structure" : "📍 Reubicando Estructura"}
                      </p>
                      <p className="text-xs sm:text-sm font-black leading-tight">
                        {isEn 
                          ? `Tap a free sand spot for ${def?.name_en || 'item'}` 
                          : `Toca una casilla libre en la arena para tu ${def?.name || 'artículo'}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelMove}
                    className="px-3 py-1.5 rounded-xl bg-white text-amber-800 font-black text-xs hover:bg-amber-100 active:scale-95 transition-all shadow-md flex items-center gap-1 flex-shrink-0"
                  >
                    <RotateCcw size={14} />
                    <span>{isEn ? "Cancel" : "Cancelar"}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Botón Central Flotante Píldora: Mover o Re-vender */}
          <div className="absolute bottom-4 left-4 z-40 flex items-center">
            <button
              type="button"
              onClick={() => {
                if (movingItem) {
                  handleCancelMove();
                  return;
                }
                if (selectedPlacedItem) {
                  setSelectedPlacedItem(null);
                  return;
                }
                setSelectedTool(null);
                const nextState = !isManageMode;
                setIsManageMode(nextState);
                if (nextState) {
                  toast.info(
                    isEn 
                      ? "Touch any building on the beach to relocate or sell it." 
                      : "Toca el edificio o artículo que deseas mover o re-vender.",
                    { icon: '✥', duration: 4000 }
                  );
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl transition-all select-none cursor-pointer active:scale-95 border-2 ${
                isManageMode
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-white ring-4 ring-amber-300 animate-pulse'
                  : 'bg-white/95 backdrop-blur-md text-stone-800 hover:text-amber-800 hover:bg-white border-amber-300 hover:border-amber-400'
              }`}
              title={isEn ? "Relocate or Resell structures" : "Relocalizar o Re-vender estructuras"}
            >
              <Move size={15} className={`stroke-[2.5] ${isManageMode ? 'text-white' : 'text-amber-700'}`} />
              <span className="text-xs sm:text-sm font-black tracking-wide uppercase">
                {isManageMode 
                  ? (isEn ? "Tap item (Cancel)" : "Toca un edificio (Cancelar)") 
                  : (isEn ? "Move or Resell" : "Mover o Re-vender")}
              </span>
            </button>
          </div>

          {/* Floating Zoom Controls (Esquina Superior Derecha) */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-xl border border-stone-300">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.15).toFixed(2))))}
              disabled={zoom <= 0.5}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 flex items-center justify-center transition-all shadow-sm"
              title={isEn ? "Zoom Out (-)" : "Alejar (-)"}
              aria-label="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const defaultZoom = typeof window !== 'undefined' && window.innerWidth < 768 ? 0.65 : 1;
                setZoom(defaultZoom);
                setTimeout(() => centerOnBoard(true), 60);
              }}
              className="px-2 h-8 rounded-xl hover:bg-stone-100 active:scale-95 text-xs font-black text-stone-700 transition-all select-none"
              title={isEn ? "Reset Zoom" : "Restablecer Zoom"}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))))}
              disabled={zoom >= 2.0}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 flex items-center justify-center transition-all shadow-sm"
              title={isEn ? "Zoom In (+)" : "Acercar (+)"}
              aria-label="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-[1px] h-5 bg-stone-200 mx-0.5" />
            <button
              type="button"
              onClick={toggleSound}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 flex items-center justify-center transition-all shadow-sm"
              title={isSoundEnabled ? (isEn ? "Mute Sound" : "Silenciar") : (isEn ? "Enable Sound" : "Activar Sonido")}
              aria-label={isSoundEnabled ? "Silenciar sonido" : "Activar sonido"}
            >
              {isSoundEnabled ? <Volume2 size={16} className="text-amber-600" /> : <VolumeX size={16} className="text-stone-400" />}
            </button>
          </div>

          <div 
            ref={scrollContainerRef}
            id="grid-scroll-container" 
            className="w-full h-full overflow-auto relative select-none"
            style={{ touchAction: 'pan-x pan-y' }}
          >
            <div 
              className="w-full h-full flex items-center justify-center py-20 px-20"
              style={{
                minWidth: `${Math.max(1600, Math.round(1600 * Math.max(1, zoom)))}px`,
                minHeight: `${Math.max(1200, Math.round(1200 * Math.max(1, zoom)))}px`
              }}
            >
              
              {/* Contenedor relativo que envuelve el tablero */}
              <div id="tiko-playa-board" className="relative">
                {/* The 3D Ground (Sand + Sea) */}
                <div 
                  className="relative" 
                  style={{ 
                    transform: `scale(${zoom}) rotateX(60deg) rotateZ(-45deg)`,
                    transformOrigin: 'center center',
                    backgroundColor: '#edbe59',
                    border: '4px solid #8c5625',
                    boxShadow: '-12px 24px 30px 0px rgba(0,0,0,0.25)',
                    borderRadius: '6px',
                    transition: isPinching ? 'none' : 'transform 0.15s ease-out'
                  }}
                >
                
                {/* Layer 0: El Mar (Costa recta colindando con el borde izquierdo hacia donde miran los edificios) */}
                <div 
                  className="absolute pointer-events-none"
                  style={{
                     background: '#0284c7',
                     backgroundImage: 'linear-gradient(to left, #38bdf8 0%, #0284c7 20%)',
                     top: '-3000px',
                     right: '100%',
                     width: '3000px',
                     height: '6000px',
                     transform: 'translateZ(-2px)',
                     boxShadow: '10px 0 20px rgba(0,0,0,0.1)'
                  }}
                ></div>

                {/* Layer 1: The ground grid (clickable) - Estilo y ángulo según propuesta diseñadores */}
                <div 
                  className="grid"
                  style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
                  }}
                >
                  {backgroundGrid.map((_, idx) => {
                    const row = Math.floor(idx / GRID_SIZE);
                    const col = idx % GRID_SIZE;

                    let isSelectedCell = false;
                    if (selectedPlacedItem) {
                      const selDef = ITEM_TYPES[selectedPlacedItem.type as keyof typeof ITEM_TYPES];
                      if (selDef) {
                        isSelectedCell = col >= selectedPlacedItem.col && 
                                         col < selectedPlacedItem.col + selDef.w &&
                                         row >= selectedPlacedItem.row &&
                                         row < selectedPlacedItem.row + selDef.h;
                      }
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => handleCellClick(row, col)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 transition-colors border-r border-b border-[#a68d68]/60 ${
                          isSelectedCell
                            ? 'bg-amber-300 border-amber-600 ring-2 ring-amber-500 ring-inset animate-pulse z-10'
                            : movingItem
                            ? 'bg-[#edbe59] hover:bg-emerald-300 cursor-move'
                            : 'bg-[#edbe59] hover:bg-[#e2af46] cursor-pointer'
                        }`}
                      />
                    );
                  })}
                </div>

              </div>

              {/* Layer 2: The Placed Items - Capa 3D independiente sobre la arena para evitar cortes (clipping) */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  transform: `scale(${zoom}) rotateX(60deg) rotateZ(-45deg)`,
                  transformOrigin: 'center center',
                  transformStyle: 'preserve-3d',
                  border: '4px solid transparent',
                  transition: isPinching ? 'none' : 'transform 0.15s ease-out'
                }}
              >
                <div 
                  className="w-full h-full grid pointer-events-none"
                  style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {placedItems.map((item) => {
                    const def = ITEM_TYPES[item.type as keyof typeof ITEM_TYPES];
                    if (!def) return null;
                    const is1x1 = def.w === 1 && def.h === 1;
                    const isSelected = selectedPlacedItem?.id === item.id;
                    const itemRenderWidth = (def as any).renderWidth || '100%';
                    const itemTransformOrigin = (def as any).transformOrigin || 'bottom center';
                    const itemAnchor = (def as any).anchor || 'bottom-center';
                    const isBottomLeftAnchor = itemAnchor === 'bottom-left';
                    const itemAnchorLeft = (def as any).anchorLeft ?? (isBottomLeftAnchor ? '0' : undefined);
                    const itemAnchorBottom = (def as any).anchorBottom ?? (isBottomLeftAnchor ? '0' : undefined);
                    const offsetX = (def as any).offsetX || 0;
                    const offsetY = (def as any).offsetY || 0;

                    return (
                      <div
                        key={item.id}
                        style={{
                          gridColumn: `${item.col + 1} / span ${def.w}`,
                          gridRow: `${item.row + 1} / span ${def.h}`,
                          transformStyle: 'preserve-3d'
                        }}
                        className={`pointer-events-auto relative ${
                          isBottomLeftAnchor 
                            ? '' 
                            : is1x1 
                            ? 'flex items-center justify-center' 
                            : 'flex items-end justify-center'
                        }`}
                      >
                         <div 
                            onClick={(e) => {
                               e.stopPropagation();
                               if (movingItem) return;
                               setSelectedTool(null);
                               setSelectedPlacedItem(item);
                               setIsManageMode(false);
                               playSound('select_placed');
                            }}
                            className={`relative drop-shadow-xl flex ${
                              is1x1 ? 'items-center' : 'items-end'
                            } justify-center group cursor-pointer transition-all ${
                              isBottomLeftAnchor ? 'absolute' : ''
                            } ${
                              isSelected 
                                ? '-translate-y-2 scale-105 z-30' 
                                : isManageMode
                                ? 'hover:-translate-y-2 hover:scale-105 ring-2 ring-amber-400/80 rounded-xl z-20'
                                : 'hover:-translate-y-1 z-20'
                            }`}
                            style={{ 
                              transform: `translateZ(${is1x1 ? 0 : 10}px) rotateZ(45deg) rotateX(-60deg) translate(${offsetX}px, ${offsetY}px) scale(${isSelected ? 1.05 : 1})`, 
                              transformOrigin: is1x1 ? 'center center' : itemTransformOrigin,
                              width: itemRenderWidth,
                              height: isBottomLeftAnchor ? 'auto' : '100%',
                              ...(isBottomLeftAnchor ? { left: itemAnchorLeft, bottom: itemAnchorBottom } : {})
                            }}
                         >
                           {/* Resplandor sutil cuando la estructura está seleccionada */}
                           {isSelected && (
                             <div className="absolute inset-0 -m-1 rounded-2xl bg-amber-400/30 border-2 border-amber-400 animate-pulse pointer-events-none z-10" />
                           )}

                           {def.image ? (
                              <img 
                                src={def.image} 
                                alt={def.name} 
                                className={`w-full h-auto max-w-none transition-transform pointer-events-none ${
                                  isSelected ? 'drop-shadow-[0_12px_12px_rgba(245,158,11,0.6)] scale-105' : 'group-hover:scale-105'
                                }`} 
                                style={{ marginBottom: '0' }} 
                              />
                           ) : (
                              <div className="bg-white/90 px-4 py-2 rounded-xl border-2 border-stone-300 font-black text-stone-600 shadow-xl group-hover:scale-105 transition-transform whitespace-nowrap">
                                 {def.name}
                              </div>
                           )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
);
}
