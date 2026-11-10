"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, Volume2, VolumeX, RotateCcw, Award, 
  HelpCircle, Sparkles, Heart, Zap, ShieldAlert, Waves
} from "lucide-react";
import { useProgress } from "../../../../context/ProgressContext";
import { useUser } from "@clerk/nextjs";
import { initMobileAudioUnlock, playSynthesizedSound, suspendAudio } from "../../../../lib/soundUtils";
import { awardMareaLimpiaXp, getMareaLimpiaDailyStatus, MareaLimpiaRewardResult } from "../../../../actions/marealimpia";
import { MARINE_TIPS, MarineConservationTip } from "../../../../data/mareaLimpiaTips";

// Tipos de objetos voladores estilo Fruit Ninja
type ItemType = "bottle" | "bag" | "can" | "straw" | "net" | "turtle" | "crab" | "coconut" | "shell" | "frenzy";

interface GameItem {
  id: number;
  type: ItemType;
  isFauna: boolean;
  isPowerup: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  sliced: boolean;
  half1?: { x: number; y: number; vx: number; vy: number; rot: number; vRot: number };
  half2?: { x: number; y: number; vx: number; vy: number; rot: number; vRot: number };
  alpha: number;
  label: string;
  emoji: string;
  points: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
}

interface BeachTurtle {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  wiggle: number;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 700;

export default function MareaLimpiaPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = use(params);
  const lang = unwrappedParams.lang || "es";
  const isEn = lang === "en";

  const { user } = useUser();
  const { updateLocalXp, refreshGamification } = useProgress();

  // Estados UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [turtlesSaved, setTurtlesSaved] = useState(0);
  const [trashSliced, setTrashSliced] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHowTo, setShowHowTo] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [isFrenzy, setIsFrenzy] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const [waveProgress, setWaveProgress] = useState(0);

  // Recompensas & Estado Diario
  const [dailyStatus, setDailyStatus] = useState<{
    gamesRemaining: number;
    todayEarnedXp: number;
    limitReached: boolean;
  }>({ gamesRemaining: 3, todayEarnedXp: 0, limitReached: false });
  const [rewardResult, setRewardResult] = useState<MareaLimpiaRewardResult | null>(null);
  const [randomTip, setRandomTip] = useState<MarineConservationTip>(MARINE_TIPS[0]);

  // Referencias Canvas y Bucle
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const isPointerDownRef = useRef(false);
  const itemsRef = useRef<GameItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const beachTurtlesRef = useRef<BeachTurtle[]>([]);
  const sliceCountInStrokeRef = useRef(0);
  const strokeStartTimeRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const lastTurtleSpawnRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);
  const nextItemIdRef = useRef(1);
  const nextTextIdRef = useRef(1);

  // Cargar High Score local
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("colectikos_marealimpia_highscore");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    }
  }, []);

  // Cargar estado diario de partidas
  const refreshStatus = useCallback(async () => {
    try {
      const res = await getMareaLimpiaDailyStatus(user?.username || undefined, user?.id);
      setDailyStatus({
        gamesRemaining: res.gamesRemaining,
        todayEarnedXp: res.todayEarnedXp,
        limitReached: res.limitReached,
      });
    } catch {}
  }, [user]);

  useEffect(() => {
    refreshStatus();
    initMobileAudioUnlock();
    return () => suspendAudio();
  }, [refreshStatus]);

  // Reproducir efectos de sonido sintetizados Web Audio
  const playSwoosh = useCallback(() => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, t0);
      osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.12);
      gain.gain.setValueAtTime(0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.12);
    });
  }, [soundEnabled]);

  const playSliceTrash = useCallback(() => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      // Sonido crujiente / acuático de corte
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700, t0);
      osc.frequency.exponentialRampToValueAtTime(250, t0 + 0.09);
      gain.gain.setValueAtTime(0.2, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.09);
    });
  }, [soundEnabled]);

  const playHitFauna = useCallback(() => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      // Alarma de advertencia / buzz grave
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, t0);
      osc.frequency.setValueAtTime(130, t0 + 0.15);
      gain.gain.setValueAtTime(0.3, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.3);
    });
  }, [soundEnabled]);

  const playComboSound = useCallback((comboCount: number) => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      const baseFreq = 440 + comboCount * 70;
      [0, 0.06, 0.12].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq * (1 + idx * 0.25), t0 + offset);
        gain.gain.setValueAtTime(0.18, t0 + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + offset);
        osc.stop(t0 + offset + 0.15);
      });
    });
  }, [soundEnabled]);

  const playTurtleSafeSound = useCallback(() => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, t0);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.15);
      gain.gain.setValueAtTime(0.18, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  }, [soundEnabled]);

  // Generador de items voladores
  const spawnItem = useCallback(() => {
    const id = nextItemIdRef.current++;
    // Tipos aleatorios con probabilidades ponderadas
    const rand = Math.random();
    let type: ItemType = "bottle";
    let isFauna = false;
    let isPowerup = false;
    let label = "Botella";
    let emoji = "🍾";
    let points = 10;
    let radius = 28;

    if (isFrenzy) {
      // En modo frenesí, solo basura rápida, CERO fauna
      const frenzyTypes: ItemType[] = ["bottle", "can", "bag", "straw"];
      type = frenzyTypes[Math.floor(Math.random() * frenzyTypes.length)];
      if (type === "bottle") { label = "Botella"; emoji = "🍾"; points = 20; }
      else if (type === "can") { label = "Lata"; emoji = "🥫"; points = 30; }
      else if (type === "bag") { label = "Bolsa"; emoji = "🛍️"; points = 25; }
      else { label = "Pajilla"; emoji = "🥤"; points = 20; }
    } else if (rand < 0.18) {
      // 18% probabilidad de fauna (Tortuguita en salto o Cangrejo) -> Obstáculos a NO cortar
      isFauna = true;
      if (Math.random() < 0.75) {
        type = "turtle";
        label = "Tortuguita";
        emoji = "🐢";
      } else {
        type = "crab";
        label = "Cangrejo";
        emoji = "🦀";
      }
      radius = 32;
    } else if (rand < 0.25) {
      // 7% probabilidad de Power-up
      isPowerup = true;
      const pRand = Math.random();
      if (pRand < 0.45) {
        type = "coconut";
        label = "Coco Helado";
        emoji = "🥥";
      } else if (pRand < 0.75) {
        type = "shell";
        label = "Caracola Ola";
        emoji = "🐚";
      } else {
        type = "frenzy";
        label = "Frenesí";
        emoji = "♻️";
      }
      radius = 30;
    } else {
      // 75% basura reciclable
      const tRand = Math.random();
      if (tRand < 0.35) {
        type = "bottle";
        label = "Botella";
        emoji = "🍾";
        points = 10;
      } else if (tRand < 0.60) {
        type = "can";
        label = "Lata";
        emoji = "🥫";
        points = 15;
      } else if (tRand < 0.80) {
        type = "bag";
        label = "Bolsa";
        emoji = "🛍️";
        points = 15;
      } else if (tRand < 0.92) {
        type = "straw";
        label = "Vaso Plástico";
        emoji = "🥤";
        points = 10;
      } else {
        type = "net";
        label = "Red Fantasma";
        emoji = "🕸️";
        points = 30;
        radius = 34;
      }
    }

    // Posición inicial: sale de la parte inferior o esquinas hacia arriba
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft 
      ? 50 + Math.random() * (CANVAS_WIDTH * 0.4) 
      : CANVAS_WIDTH * 0.5 + Math.random() * (CANVAS_WIDTH * 0.4);
    const y = CANVAS_HEIGHT + 30;

    // Velocidad de tiro parabólico estilo Fruit Ninja
    const speedMultiplier = isSlowMo ? 0.45 : 1.0;
    const vy = -(11.5 + Math.random() * 3.5) * speedMultiplier;
    // La velocidad horizontal apunta suavemente hacia el centro de la pantalla
    const centerOffset = (CANVAS_WIDTH / 2 - x);
    const vx = (centerOffset * 0.015 + (Math.random() - 0.5) * 2.5) * speedMultiplier;

    itemsRef.current.push({
      id,
      type,
      isFauna,
      isPowerup,
      x,
      y,
      vx,
      vy,
      radius,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.1,
      sliced: false,
      alpha: 1,
      label,
      emoji,
      points,
    });
  }, [isFrenzy, isSlowMo]);

  // Generador de tortuguitas que caminan por la arena hacia el mar
  const spawnBeachTurtle = useCallback(() => {
    beachTurtlesRef.current.push({
      id: Math.random(),
      x: 40 + Math.random() * (CANVAS_WIDTH - 80),
      y: CANVAS_HEIGHT - 35,
      speed: 0.45 + Math.random() * 0.3,
      size: 18 + Math.random() * 5,
      wiggle: Math.random() * Math.PI,
    });
  }, []);

  // Agregar partículas de corte / agua
  const addParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0.8 + Math.random() * 0.4,
      });
    }
  };

  // Agregar texto flotante (+10, ¡COMBO!, etc.)
  const addFloatingText = (x: number, y: number, text: string, color = "#10b981", size = 20) => {
    floatingTextsRef.current.push({
      id: nextTextIdRef.current++,
      x,
      y,
      text,
      color,
      size,
      alpha: 1,
      vy: -1.8,
    });
  };

  // Iniciar partida
  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    setTurtlesSaved(0);
    setTrashSliced(0);
    setMaxCombo(0);
    setIsSlowMo(false);
    setIsFrenzy(false);
    setWaveActive(false);
    setWaveProgress(0);
    setRewardResult(null);

    itemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    beachTurtlesRef.current = [];
    trailRef.current = [];
    isPointerDownRef.current = false;
    sliceCountInStrokeRef.current = 0;

    // Seleccionar tip ecológico aleatorio para esta partida
    setRandomTip(MARINE_TIPS[Math.floor(Math.random() * MARINE_TIPS.length)]);

    // Spawns iniciales
    spawnBeachTurtle();
    spawnBeachTurtle();
  };

  // Finalizar partida
  const endGame = useCallback(async (finalScore: number, finalTrash: number, finalTurtles: number, finalCombo: number) => {
    setIsPlaying(false);
    setIsGameOver(true);
    suspendAudio();

    // Actualizar High Score si aplica
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("colectikos_marealimpia_highscore", finalScore.toString());
    }

    // Celebración visual si fue una partida sobresaliente
    if (finalScore >= 300 || finalTurtles >= 5) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#f59e0b", "#3b82f6"]
      });
    }

    // Otorgar XP y Tikolones en el backend
    try {
      const res = await awardMareaLimpiaXp({
        score: finalScore,
        trashCollected: finalTrash,
        turtlesSaved: finalTurtles,
        maxCombo: finalCombo,
        localUsername: user?.username || undefined,
        fallbackClerkId: user?.id,
      });

      setRewardResult(res);

      if (res.success && res.xpAwarded > 0) {
        if (updateLocalXp && res.newTotalXp !== undefined && res.newLevel !== undefined) {
          updateLocalXp(res.newTotalXp, res.newLevel);
        }
        if (refreshGamification) {
          refreshGamification();
        }
        toast.success(
          isEn 
            ? `Clean Coast! +${res.xpAwarded} XP and +${res.tikolonesAwarded} Tikolones earned!` 
            : `¡Costa Limpia! ¡Ganaste +${res.xpAwarded} XP y +${res.tikolonesAwarded} Tikolones!`
        );
      } else if (res.limitReached) {
        toast.info(
          isEn 
            ? "Daily XP limit reached for Marea Limpia. Thanks for keeping our beaches pristine!" 
            : "Límite diario de XP alcanzado. ¡Gracias por proteger las playas de Costa Rica!"
        );
      }
      refreshStatus();
    } catch (err) {
      console.error("Error registrando recompensa de Marea Limpia:", err);
    }
  }, [highScore, isEn, refreshGamification, refreshStatus, updateLocalXp, user]);

  // Manejo de corte / detección geométrica de segmento
  const checkSliceCollision = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const items = itemsRef.current;
    let slicedInThisCheck = 0;

    items.forEach((item) => {
      if (item.sliced) return;

      // Distancia del círculo del item al segmento de la línea de corte (p1 -> p2)
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return;

      const t = Math.max(0, Math.min(1, ((item.x - p1.x) * dx + (item.y - p1.y) * dy) / lenSq));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const distSq = (item.x - projX) * (item.x - projX) + (item.y - projY) * (item.y - projY);

      if (distSq <= item.radius * item.radius) {
        // ¡Impacto confirmado!
        item.sliced = true;
        slicedInThisCheck++;
        sliceCountInStrokeRef.current++;

        if (item.isFauna) {
          // ⚠️ CORTE DE FAUNA (Penalización severa)
          playHitFauna();
          addParticles(item.x, item.y, "#ef4444", 20);
          addFloatingText(item.x, item.y - 10, "¡FAUNA! -1 ❤️", "#ef4444", 24);

          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setTimeout(() => {
                endGame(score, trashSliced, turtlesSaved, maxCombo);
              }, 400);
            }
            return Math.max(0, next);
          });
        } else if (item.isPowerup) {
          // ✨ POWER-UP
          playComboSound(4);
          addParticles(item.x, item.y, "#38bdf8", 25);

          if (item.type === "coconut") {
            // Modo cámara lenta
            setIsSlowMo(true);
            addFloatingText(item.x, item.y, "¡MAREA LENTA! ⏱️", "#06b6d4", 22);
            setTimeout(() => setIsSlowMo(false), 5000);
          } else if (item.type === "shell") {
            // Ola limpiadora que barre toda la basura visible
            setWaveActive(true);
            setWaveProgress(0);
            addFloatingText(item.x, item.y, "¡OLA LIMPIADORA! 🌊", "#0284c7", 24);
            // Slicing automático de toda la basura en pantalla
            itemsRef.current.forEach((it) => {
              if (!it.sliced && !it.isFauna) {
                it.sliced = true;
                setTrashSliced((prev) => prev + 1);
                setScore((prev) => prev + it.points);
                addParticles(it.x, it.y, "#10b981", 8);
              }
            });
            setTimeout(() => setWaveActive(false), 1200);
          } else if (item.type === "frenzy") {
            // Frenesí de reciclaje sin fauna
            setIsFrenzy(true);
            addFloatingText(item.x, item.y, "¡FRENESÍ DE RECICLAJE! ♻️", "#10b981", 24);
            setTimeout(() => setIsFrenzy(false), 4500);
          }
        } else {
          // 🍾 CORTE DE BASURA NORMAL
          playSliceTrash();
          setTrashSliced((prev) => prev + 1);
          setScore((prev) => prev + item.points);
          addParticles(item.x, item.y, "#10b981", 14);
          addFloatingText(item.x, item.y, `+${item.points}`, "#10b981", 18);

          // Crear las dos mitades que se separan volando
          const splitAngle = Math.atan2(dy, dx) + Math.PI / 2;
          const splitSpeed = 3.5;
          item.half1 = {
            x: item.x,
            y: item.y,
            vx: Math.cos(splitAngle) * splitSpeed + item.vx * 0.5,
            vy: Math.sin(splitAngle) * splitSpeed + item.vy * 0.5,
            rot: item.rotation,
            vRot: 0.15,
          };
          item.half2 = {
            x: item.x,
            y: item.y,
            vx: -Math.cos(splitAngle) * splitSpeed + item.vx * 0.5,
            vy: -Math.sin(splitAngle) * splitSpeed + item.vy * 0.5,
            rot: item.rotation,
            vRot: -0.15,
          };
        }
      }
    });

    return slicedInThisCheck;
  };

  // Evaluar combos cuando el usuario levanta el dedo o pasa el tiempo de un trazo
  const finalizeStroke = useCallback(() => {
    const count = sliceCountInStrokeRef.current;
    if (count >= 3) {
      const bonusPoints = count * 15;
      setScore((prev) => prev + bonusPoints);
      setMaxCombo((prev) => Math.max(prev, count));
      playComboSound(count);

      // Ubicación promedio en el último punto del trazo
      const lastPoint = trailRef.current[trailRef.current.length - 1] || { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
      const comboLabel = count >= 5 ? `¡LIMPIEZA PURA VIDA! (x${count} +${bonusPoints})` : `¡COMBO x${count}! (+${bonusPoints})`;
      addFloatingText(lastPoint.x, lastPoint.y - 30, comboLabel, "#f59e0b", 22);
    }
    sliceCountInStrokeRef.current = 0;
  }, [playComboSound]);

  // Manejadores de entrada (Touch y Mouse en el Canvas)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    sliceCountInStrokeRef.current = 0;
    strokeStartTimeRef.current = performance.now();
    const coords = getCanvasCoords(e);
    trailRef.current = [{ ...coords, time: performance.now() }];
    playSwoosh();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying || !isPointerDownRef.current) return;
    const coords = getCanvasCoords(e);
    const now = performance.now();
    const trail = trailRef.current;

    if (trail.length > 0) {
      const prev = trail[trail.length - 1];
      const dist = Math.hypot(coords.x - prev.x, coords.y - prev.y);

      // Solo si el movimiento tiene suficiente velocidad / longitud para ser un corte ninja
      if (dist > 8) {
        checkSliceCollision(prev, coords);
      }
    }

    trail.push({ ...coords, time: now });

    // Mantener solo los últimos 150ms de estela para un efecto fluido y afilado
    trailRef.current = trail.filter((pt) => now - pt.time < 160);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    finalizeStroke();
    trailRef.current = [];
  };

  // Bucle Principal del Juego (60 FPS Canvas)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const gravity = isSlowMo ? 0.12 : 0.28;
      const speedScale = isSlowMo ? 0.45 : 1.0;

      // 1. Spawns automáticos por tiempo
      const spawnInterval = isFrenzy ? 400 : (isSlowMo ? 1400 : 900);
      if (time - lastSpawnTimeRef.current > spawnInterval) {
        spawnItem();
        if (Math.random() < 0.4) spawnItem(); // Ráfagas dobles ocasionales
        lastSpawnTimeRef.current = time;
      }

      // Spawn de tortuguitas en la playa
      if (time - lastTurtleSpawnRef.current > 4500) {
        spawnBeachTurtle();
        lastTurtleSpawnRef.current = time;
      }

      // 2. Limpiar y dibujar Fondo (Playa y Mar)
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Mar (Franja superior turquesa con olas)
      const seaGrad = ctx.createLinearGradient(0, 0, 0, 160);
      seaGrad.addColorStop(0, "#0284c7");
      seaGrad.addColorStop(0.6, "#0ea5e9");
      seaGrad.addColorStop(1, "#38bdf8");
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, 140);

      // Espuma de olas animada
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();
      const waveOffset = Math.sin(time * 0.003) * 6;
      ctx.moveTo(0, 140);
      for (let x = 0; x <= CANVAS_WIDTH; x += 30) {
        ctx.lineTo(x, 136 + Math.sin(x * 0.04 + time * 0.004) * 5 + waveOffset);
      }
      ctx.lineTo(CANVAS_WIDTH, 140);
      ctx.fill();

      // Arena Dorada (Fondo principal)
      const sandGrad = ctx.createLinearGradient(0, 140, 0, CANVAS_HEIGHT);
      sandGrad.addColorStop(0, "#fde68a");
      sandGrad.addColorStop(0.5, "#fef3c7");
      sandGrad.addColorStop(1, "#fde047");
      ctx.fillStyle = sandGrad;
      ctx.fillRect(0, 140, CANVAS_WIDTH, CANVAS_HEIGHT - 140);

      // Textura suave de arena (puntitos sutiles)
      ctx.fillStyle = "rgba(217, 119, 6, 0.07)";
      for (let i = 0; i < 40; i++) {
        const px = (i * 47) % CANVAS_WIDTH;
        const py = 160 + ((i * 83) % (CANVAS_HEIGHT - 180));
        ctx.fillRect(px, py, 3, 3);
      }

      // Animación de Ola Limpiadora si está activa
      if (waveActive) {
        setWaveProgress((prev) => prev + dt * 2.2);
        const waveY = (waveProgress % 1.5) * CANVAS_HEIGHT;
        const waveGrad = ctx.createLinearGradient(0, waveY - 80, 0, waveY + 80);
        waveGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        waveGrad.addColorStop(0.5, "rgba(14, 165, 233, 0.6)");
        waveGrad.addColorStop(1, "rgba(255, 255, 255, 0.8)");
        ctx.fillStyle = waveGrad;
        ctx.fillRect(0, Math.max(0, waveY - 60), CANVAS_WIDTH, 120);
      }

      // 3. Actualizar y dibujar Tortuguitas en la Arena caminando hacia el mar
      beachTurtlesRef.current.forEach((t) => {
        t.y -= t.speed * speedScale;
        t.wiggle += 0.08;

        // Comprobar si llegó al mar a salvo
        if (t.y <= 135) {
          playTurtleSafeSound();
          setTurtlesSaved((prev) => prev + 1);
          setScore((prev) => prev + 25);
          addParticles(t.x, 135, "#38bdf8", 16);
          addFloatingText(t.x, 130, "¡A SALVO! 🐢 +25", "#0284c7", 18);
          // Reubicarla al fondo de la playa
          t.y = CANVAS_HEIGHT + 20;
          t.x = 40 + Math.random() * (CANVAS_WIDTH - 80);
        }

        // Dibujar tortuguita caminante
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.font = `${t.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Pequeño balanceo natural al caminar
        ctx.rotate(Math.sin(t.wiggle) * 0.15);
        ctx.fillText("🐢", 0, 0);
        ctx.restore();
      });

      // 4. Actualizar y dibujar Items Voladores (Frutas/Basura/Fauna)
      itemsRef.current.forEach((item) => {
        if (!item.sliced) {
          // Física de proyectil en el aire
          item.x += item.vx * speedScale;
          item.y += item.vy * speedScale;
          item.vy += gravity;
          item.rotation += item.vRot * speedScale;

          // Dibujar item volador
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.rotation);

          // Sombra proyectada en la arena
          ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
          ctx.beginPath();
          ctx.ellipse(0, 32, item.radius * 0.8, item.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          // Resplandor para Power-ups
          if (item.isPowerup) {
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 15;
          }

          // Dibujar emoji del item
          ctx.font = `${item.radius * 1.6}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.emoji, 0, 0);

          ctx.restore();
        } else if (item.half1 && item.half2) {
          // Mitades cortadas volando hacia los lados
          item.half1.x += item.half1.vx * speedScale;
          item.half1.y += item.half1.vy * speedScale;
          item.half1.vy += gravity * 1.2;
          item.half1.rot += item.half1.vRot * speedScale;

          item.half2.x += item.half2.vx * speedScale;
          item.half2.y += item.half2.vy * speedScale;
          item.half2.vy += gravity * 1.2;
          item.half2.rot += item.half2.vRot * speedScale;

          item.alpha -= dt * 0.8;

          ctx.save();
          ctx.globalAlpha = Math.max(0, item.alpha);

          // Mitad 1
          ctx.save();
          ctx.translate(item.half1.x, item.half1.y);
          ctx.rotate(item.half1.rot);
          ctx.font = `${item.radius * 1.2}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.emoji, 0, 0);
          ctx.restore();

          // Mitad 2
          ctx.save();
          ctx.translate(item.half2.x, item.half2.y);
          ctx.rotate(item.half2.rot);
          ctx.font = `${item.radius * 1.2}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.emoji, 0, 0);
          ctx.restore();

          ctx.restore();
        }
      });

      // Limpiar items caídos fuera de la pantalla
      itemsRef.current = itemsRef.current.filter((it) => {
        if (!it.sliced && it.y > CANVAS_HEIGHT + 60 && it.vy > 0) {
          return false;
        }
        if (it.sliced && it.alpha <= 0.05) {
          return false;
        }
        return true;
      });

      // 5. Actualizar y dibujar Partículas
      particlesRef.current.forEach((p) => {
        p.x += p.vx * speedScale;
        p.y += p.vy * speedScale;
        p.alpha -= dt * 1.5;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.05);

      // 6. Actualizar y dibujar Textos Flotantes
      floatingTextsRef.current.forEach((txt) => {
        txt.y += txt.vy * speedScale;
        txt.alpha -= dt * 1.2;

        ctx.save();
        ctx.globalAlpha = Math.max(0, txt.alpha);
        ctx.font = `bold ${txt.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = txt.color;
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 6;
        ctx.fillText(txt.text, txt.x, txt.y);
        ctx.restore();
      });
      floatingTextsRef.current = floatingTextsRef.current.filter((t) => t.alpha > 0.05);

      // 7. Dibujar la Espada / Estela de Agua Táctil estilo Fruit Ninja
      const trail = trailRef.current;
      if (trail.length >= 2) {
        ctx.save();
        for (let i = 1; i < trail.length; i++) {
          const p1 = trail[i - 1];
          const p2 = trail[i];
          const progress = i / trail.length;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${progress * 0.9})`;
          ctx.lineWidth = progress * 10 + 2;
          ctx.lineCap = "round";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Núcleo blanco brillante en el centro del corte
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${progress})`;
          ctx.lineWidth = progress * 4 + 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Continuar animación
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, isSlowMo, isFrenzy, waveActive, waveProgress, spawnItem, spawnBeachTurtle, playTurtleSafeSound]);

  return (
    <div className="w-full max-w-lg mx-auto p-3 sm:p-4 flex flex-col items-center select-none font-sans">
      
      {/* Barra Superior de Control y Navegación */}
      <div className="w-full flex items-center justify-between mb-3 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-emerald-100 shadow-sm">
        <Link 
          href={`/${lang}/community`} 
          className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition font-bold text-xs sm:text-sm"
        >
          <ArrowLeft size={18} />
          <span>{isEn ? "Community" : "Comunidad"}</span>
        </Link>

        {/* Título Central */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🌊</span>
          <span className="font-black text-emerald-900 text-sm sm:text-base tracking-wide">
            {isEn ? "Clean Tide" : "Marea Limpia"}
          </span>
        </div>

        {/* Controles de Sonido y Ayuda */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHowTo(true)}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition"
            title={isEn ? "How to play" : "Cómo jugar"}
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition"
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 size={18} className="text-emerald-600" /> : <VolumeX size={18} className="text-stone-400" />}
          </button>
        </div>
      </div>

      {/* Marcador en Vivo (Puntos, Vidas, Tortuguitas) */}
      <div className="w-full grid grid-cols-3 gap-2 mb-3">
        {/* Puntos y Record */}
        <div className="bg-white rounded-2xl p-2.5 border border-emerald-100 text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
            {isEn ? "Score" : "Puntos"}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 block leading-tight">
            {score}
          </span>
          <span className="text-[10px] text-stone-400 font-semibold">
            {isEn ? "Record" : "Récord"}: {highScore}
          </span>
        </div>

        {/* Vidas (Corazones) */}
        <div className="bg-white rounded-2xl p-2.5 border border-rose-100 text-center shadow-xs flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider mb-0.5">
            {isEn ? "Fauna Lives" : "Vidas"}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((heartIdx) => (
              <Heart
                key={heartIdx}
                size={18}
                className={heartIdx <= lives ? "text-rose-500 fill-rose-500 transition-transform scale-110" : "text-stone-200 fill-stone-100"}
              />
            ))}
          </div>
          <span className="text-[9px] text-stone-400 mt-0.5 font-medium">
            {isEn ? "Protect fauna" : "Cuida la fauna"}
          </span>
        </div>

        {/* Tortuguitas a Salvo */}
        <div className="bg-white rounded-2xl p-2.5 border border-sky-100 text-center shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
            {isEn ? "Saved" : "Salvadas"}
          </span>
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg">🐢</span>
            <span className="text-xl sm:text-2xl font-black text-sky-700 block leading-tight">
              {turtlesSaved}
            </span>
          </div>
          <span className="text-[10px] text-sky-600 font-bold">
            +{turtlesSaved * 25} pts
          </span>
        </div>
      </div>

      {/* Indicadores de Estado Activo (SlowMo / Frenesí) */}
      <div className="h-6 mb-1.5 flex items-center justify-center gap-2">
        {isSlowMo && (
          <span className="animate-pulse px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-black border border-cyan-200 shadow-xs flex items-center gap-1">
            <span>⏱️</span> {isEn ? "SLOW MOTION ACTIVE" : "TIEMPO TRANQUILO ACTIVADO"}
          </span>
        )}
        {isFrenzy && (
          <span className="animate-bounce px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-200 shadow-xs flex items-center gap-1">
            <span>♻️</span> {isEn ? "RECYCLING FRENZY!" : "¡FRENESÍ DE RECICLAJE!"}
          </span>
        )}
      </div>

      {/* Contenedor del Lienzo Arcade (Canvas) */}
      <div className="relative w-full aspect-[480/700] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-800/20 bg-stone-900 touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full cursor-crosshair block"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* PANTALLA INICIAL (Antes de Jugar) */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-4 shadow-xl">
              <span className="text-5xl">🌊</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-md">
              {isEn ? "Clean Tide" : "Marea Limpia"}
            </h2>
            <p className="text-emerald-200 text-xs sm:text-sm font-semibold max-w-xs mb-6">
              {isEn 
                ? "Slice the marine plastic waste! Protect baby sea turtles on their journey to the ocean." 
                : "¡Rebana los desechos plásticos con tu dedo! Protege a las tortuguitas en su viaje al océano."}
            </p>

            {/* Tarjeta de Reglas Rápidas */}
            <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-md border border-white/20 mb-6 max-w-xs text-left text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍾</span>
                <span className="font-medium text-stone-200">
                  {isEn ? "Swipe to slice & recycle trash (+pts & combos)" : "Desliza para rebanar la basura (+pts y combos)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🐢</span>
                <span className="font-bold text-rose-300">
                  {isEn ? "NEVER slice turtles or crabs (-1 Life)" : "¡NUNCA cortes tortuguitas o cangrejos! (-1 Vida)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🥥</span>
                <span className="font-medium text-cyan-200">
                  {isEn ? "Slice coconuts & shells for power-ups" : "Rebana cocos y caracolas para power-ups"}
                </span>
              </div>
            </div>

            {/* Botón de Inicio */}
            <button
              onClick={startGame}
              className="w-full max-w-xs py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Zap size={22} className="fill-white" />
              <span>{isEn ? "START CLEANUP" : "¡INICIAR LIMPIEZA!"}</span>
            </button>

            {/* Partidas restantes hoy */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-200 font-semibold">
              <Award size={14} />
              <span>
                {isEn 
                  ? `${dailyStatus.gamesRemaining} reward games remaining today` 
                  : `${dailyStatus.gamesRemaining} partidas con recompensa hoy`}
              </span>
            </div>
          </div>
        )}

        {/* PANTALLA DE JUEGO TERMINADO (Game Over / Resultados) */}
        {isGameOver && (
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20 animate-fade-in overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-3">
              <span className="text-4xl">🏝️</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
              {isEn ? "Coast Cleaned!" : "¡Costa Limpia!"}
            </h3>
            <p className="text-stone-300 text-xs mb-4">
              {isEn ? "Mission completed at Tortuguero" : "Misión de conservación finalizada"}
            </p>

            {/* Resumen de Estadísticas */}
            <div className="w-full max-w-xs bg-white/10 rounded-2xl p-4 border border-white/15 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-stone-300">{isEn ? "Final Score" : "Puntuación Final"}</span>
                <span className="text-lg font-black text-amber-300">{score}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-stone-300">{isEn ? "Trash Recycled" : "Basura Reciclada"}</span>
                <span className="font-bold text-emerald-300">{trashSliced} {isEn ? "units" : "piezas"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-stone-300">{isEn ? "Turtles Saved" : "Tortuguitas al Mar"}</span>
                <span className="font-bold text-sky-300">🐢 {turtlesSaved}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-300">{isEn ? "Best Combo" : "Mejor Combo"}</span>
                <span className="font-bold text-amber-400">⚡ x{maxCombo}</span>
              </div>
            </div>

            {/* Recompensas Ganadas */}
            {rewardResult?.success && rewardResult.xpAwarded > 0 && (
              <div className="w-full max-w-xs bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-3 mb-4 flex items-center justify-around">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-200 block">XP Ganados</span>
                  <span className="text-xl font-black text-emerald-300">+{rewardResult.xpAwarded}</span>
                </div>
                <div className="w-px h-8 bg-emerald-400/30"></div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-200 block">Tikolones</span>
                  <span className="text-xl font-black text-amber-300">+{rewardResult.tikolonesAwarded}</span>
                </div>
              </div>
            )}

            {/* Tip Ecológico Marino de Costa Rica */}
            <div className="w-full max-w-xs bg-emerald-950/50 rounded-2xl p-3 border border-emerald-500/30 mb-5 text-left">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs mb-1">
                <span>{randomTip.badge}</span>
                <span className="text-[10px] text-stone-400">· {randomTip.location}</span>
              </div>
              <p className="text-[11px] text-stone-200 leading-snug">
                {isEn ? randomTip.tipEn : randomTip.tip}
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="w-full max-w-xs flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={16} />
                <span>{isEn ? "PLAY AGAIN" : "JUGAR DE NUEVO"}</span>
              </button>
              <Link
                href={`/${lang}/community`}
                className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition text-center"
              >
                {isEn ? "HUB" : "SALIR"}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Panel Informativo: Cómo Jugar */}
      {showHowTo && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 text-stone-800 animate-scale-up">
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐢</span>
                <h3 className="font-black text-lg text-emerald-900">
                  {isEn ? "How to Play Marea Limpia" : "Cómo Jugar Marea Limpia"}
                </h3>
              </div>
              <button
                onClick={() => setShowHowTo(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-stone-600 mb-6 leading-relaxed">
              <div className="flex items-start gap-3 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                <span className="text-2xl shrink-0">🔪</span>
                <div>
                  <strong className="text-emerald-900 block font-bold mb-0.5">
                    {isEn ? "1. Swipe Fast like a Ninja" : "1. Desliza rápido como un Ninja"}
                  </strong>
                  <span>
                    {isEn 
                      ? "Slice through floating plastic bottles, bags, cans and straws to clean the coast." 
                      : "Rebana botellas de plástico, bolsas, latas y pajillas antes de que toquen la arena."}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-rose-50/70 p-3 rounded-2xl border border-rose-100">
                <span className="text-2xl shrink-0">🛡️</span>
                <div>
                  <strong className="text-rose-900 block font-bold mb-0.5">
                    {isEn ? "2. Never Slice Fauna!" : "2. ¡Nunca cortes la fauna!"}
                  </strong>
                  <span>
                    {isEn 
                      ? "Baby turtles and crabs fly across the beach. If your stroke touches them, you lose 1 heart." 
                      : "Tortuguitas y cangrejos saltan junto a la basura. Si tu corte los toca, pierdes 1 vida."}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-100">
                <span className="text-2xl shrink-0">⚡</span>
                <div>
                  <strong className="text-amber-900 block font-bold mb-0.5">
                    {isEn ? "3. Multi-Slice Combos" : "3. Combos Multi-Corte"}
                  </strong>
                  <span>
                    {isEn 
                      ? "Slice 3 or more trash items in a single continuous stroke to trigger massive score combos!" 
                      : "¡Rebana 3 o más basuras en un solo trazo continuo para activar combos y puntos extra!"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition"
            >
              {isEn ? "Got it! Let's play" : "¡Entendido! Vamos a jugar"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
