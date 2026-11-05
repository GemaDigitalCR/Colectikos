"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, Volume2, VolumeX, RotateCcw, Award, 
  HelpCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Sparkles, ShieldCheck, Heart, MapPin, Zap
} from "lucide-react";
import { useProgress } from "../../../../context/ProgressContext";
import { useUser } from "@clerk/nextjs";
import { initMobileAudioUnlock, playSynthesizedSound } from "../../../../lib/soundUtils";
import { awardCrucetikasXp, getCrucetikasDailyStatus, CrucetikasRewardResult } from "../../../../actions/crucetikas";
import { CONSERVATION_TIPS, ConservationTip } from "../../../../data/crucetikasTips";

// Configuración de la cuadrícula
const COLS = 9;
const LANE_HEIGHT = 50;
const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 650;
const TOTAL_LANES = 13; // 13 carriles exactos: encaja perfecto en pantalla completa mostrando La Meta arriba y Otico abajo sin scroll

type LaneType = "safe_start" | "safe_island" | "road" | "river" | "goal";

interface Vehicle {
  x: number;
  width: number;
  speed: number; // positivo = derecha, negativo = izquierda
  type: "car" | "4x4" | "bus" | "truck";
  color: string;
}

interface Log {
  x: number;
  width: number;
  speed: number;
  type: "wood" | "turtle";
}

interface Lane {
  type: LaneType;
  rowIndex: number; // 0 = meta, TOTAL_LANES - 1 = inicio
  vehicles?: Vehicle[];
  logs?: Log[];
  hasLeaf?: boolean;
  leafCol?: number;
  speed?: number;
}

export default function CrucetikasGamePage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = use(params);
  const lang = unwrappedParams.lang || "es";
  const isEn = lang === "en";

  const { user } = useUser();
  const { updateLocalXp, refreshGamification } = useProgress();

  // Estados del juego
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Estadísticas y puntuación
  const [distance, setDistance] = useState(0);
  const [maxDistanceReached, setMaxDistanceReached] = useState(0);
  const [slothsSaved, setSlothsSaved] = useState(0);
  const [leavesCollected, setLeavesCollected] = useState(0);
  const [leavesForBridge, setLeavesForBridge] = useState(0); // 0 a 3 para activar Paso de Fauna
  const [isBridgeActive, setIsBridgeActive] = useState(false);
  const [bridgeTimeLeft, setBridgeTimeLeft] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);

  // Gamificación y Recompensas diarias
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [rewardResult, setRewardResult] = useState<CrucetikasRewardResult | null>(null);
  const [activeTip, setActiveTip] = useState<ConservationTip>(CONSERVATION_TIPS[0]);

  // Referencias Canvas y Bucle
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Posición del perezoso (coordenadas continuas en píxeles + casilla)
  const slothPos = useRef({
    col: 4, // Columna central (0 a 8)
    row: TOTAL_LANES - 1, // Fila inicial (abajo)
    targetX: 4 * (CANVAS_WIDTH / COLS) + (CANVAS_WIDTH / COLS) / 2,
    targetY: (TOTAL_LANES - 1) * LANE_HEIGHT + LANE_HEIGHT / 2,
    currentX: 4 * (CANVAS_WIDTH / COLS) + (CANVAS_WIDTH / COLS) / 2,
    currentY: (TOTAL_LANES - 1) * LANE_HEIGHT + LANE_HEIGHT / 2,
    hopProgress: 1, // 1 = quieto, < 1 = en el aire
    direction: "up" as "up" | "down" | "left" | "right",
  });

  // Estado de los carriles
  const lanesRef = useRef<Lane[]>([]);
  const cameraY = useRef(0); // Desplazamiento vertical de la cámara

  // Control de audio sintetizado
  const playSound = useCallback((type: "hop" | "leaf" | "bridge" | "splash" | "hit" | "victory" | "horn") => {
    playSynthesizedSound(isSoundEnabled, (ctx, t0) => {
      if (type === "hop") {
        // Sonido suave de paso de perezoso (pop marimba)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(340, t0);
        osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.08);
        gain.gain.setValueAtTime(0.25, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.08);
      } else if (type === "leaf") {
        // Campana cristalina al recoger hoja de guarumo
        [880, 1318.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          const start = t0 + idx * 0.04;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.3, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.2);
        });
      } else if (type === "bridge") {
        // Arpegio ascendente triunfal de puente colgante
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          const start = t0 + idx * 0.06;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.35, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.3);
        });
      } else if (type === "splash") {
        // Ruido de agua al caer al río
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, t0);
        osc.frequency.linearRampToValueAtTime(90, t0 + 0.18);
        gain.gain.setValueAtTime(0.4, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.2);
      } else if (type === "hit") {
        // Bocina de carro lejana / advertencia
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(196, t0);
        gain.gain.setValueAtTime(0.3, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.25);
      } else if (type === "victory") {
        // Fanfarria alegre de victoria
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          const start = t0 + idx * 0.08;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.4, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.4);
        });
      }
    });
  }, [isSoundEnabled]);

  // Inicialización de sonido en móviles y carga de récord local
  useEffect(() => {
    document.title = isEn ? "Crucetiko: Wildlife Crossing | Colectikos" : "Crucetiko: Paso de Fauna | Colectikos";
    const savedSound = localStorage.getItem("crucetikas_sound");
    if (savedSound !== null) {
      setIsSoundEnabled(savedSound === "true");
    }
    const savedHighScore = localStorage.getItem("crucetikas_high_score");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10) || 0);
    }
    const cleanup = initMobileAudioUnlock();
    return cleanup;
  }, [isEn]);

  // Identificador efectivo del usuario (persistente incluso para invitados locales)
  const getEffectiveUsername = useCallback(() => {
    if (typeof window === "undefined") return undefined;
    let name = user?.username || undefined;
    if (!name) {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.username) name = parsed.username;
        } catch {}
      }
    }
    if (!name) {
      const profile = localStorage.getItem("userProfileData");
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          if (parsed.username) name = parsed.username;
        } catch {}
      }
    }
    if (!name) {
      name = localStorage.getItem("localUsername") || undefined;
    }
    if (!name) {
      let guestId = localStorage.getItem("colectikos_guest_id");
      if (!guestId) {
        guestId = `explorador_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem("colectikos_guest_id", guestId);
      }
      localStorage.setItem("localUsername", guestId);
      name = guestId;
    }
    return name;
  }, [user]);

  // Estado de la última recompensa para desplegar en modales
  const [lastReward, setLastReward] = useState<{
    xpAwarded: number;
    isPractice: boolean;
    gamesRemaining: number;
  } | null>(null);

  // Carga de estado diario de recompensas de XP con sincronización autoritativa
  const fetchStatus = useCallback(async () => {
    try {
      const username = getEffectiveUsername();
      const res = await getCrucetikasDailyStatus(username, user?.id);

      let gamesPlayedToday = res.gamesPlayedToday;

      // Para usuarios registrados, la base de datos es la única fuente de la verdad
      if (res.isLoggedIn) {
        const todayStr = new Date().toISOString().slice(0, 10);
        localStorage.setItem("crucetikas_local_day", todayStr);
        localStorage.setItem("crucetikas_local_count", String(res.gamesPlayedToday));
      } else {
        // Fallback únicamente para invitados locales desconectados
        const todayStr = new Date().toISOString().slice(0, 10);
        const localDay = localStorage.getItem("crucetikas_local_day");
        let localCount = 0;
        if (localDay === todayStr) {
          localCount = parseInt(localStorage.getItem("crucetikas_local_count") || "0", 10);
        }
        gamesPlayedToday = Math.max(res.gamesPlayedToday, localCount);
      }

      const gamesRemaining = Math.max(0, 3 - gamesPlayedToday);
      const limitReached = gamesRemaining === 0 || res.todayEarnedXp >= 90;

      setDailyStatus({
        ...res,
        gamesPlayedToday,
        gamesRemaining,
        limitReached,
      });
    } catch (e) {
      console.warn("No se pudo cargar estado diario:", e);
    }
  }, [getEffectiveUsername, user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Configuración de dificultad según turno del día (Turno 1: Sencillo, Turno 2: Medio, Turno 3: Desafío, Práctica: Promedio)
  const getTurnDifficulty = useCallback((playedCount: number) => {
    if (playedCount === 0) {
      return {
        turnIndex: 1,
        title: isEn ? "Turn 1/3: Easy (Up to 30 XP)" : "Turno 1/3: Sencillo (Hasta 30 XP)",
        badge: isEn ? "Turn 1 · Easy" : "Turno 1 · Sencillo",
        colorBadge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        speedFactor: 0.65, // Muy relajado para cruzar con calma
        density: 2,
        isPractice: false,
      };
    } else if (playedCount === 1) {
      return {
        turnIndex: 2,
        title: isEn ? "Turn 2/3: Medium (Up to 30 XP)" : "Turno 2/3: Medio (Hasta 30 XP)",
        badge: isEn ? "Turn 2 · Medium" : "Turno 2 · Medio",
        colorBadge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        speedFactor: 0.85, // Moderado
        density: 2,
        isPractice: false,
      };
    } else if (playedCount === 2) {
      return {
        turnIndex: 3,
        title: isEn ? "Turn 3/3: Challenging (Up to 30 XP)" : "Turno 3/3: Desafío (Hasta 30 XP)",
        badge: isEn ? "Turn 3 · Desafío" : "Turno 3 · Desafío",
        colorBadge: "bg-rose-500/20 text-rose-400 border-rose-500/40",
        speedFactor: 1.05, // Retador
        density: 3,
        isPractice: false,
      };
    } else {
      // Práctica libre -> misma velocidad del segundo intento (promedio 0.85x)
      return {
        turnIndex: playedCount + 1,
        title: isEn ? "Practice Mode (Average Speed · 0 XP)" : "Modo Práctica (Velocidad Promedio · 0 XP)",
        badge: isEn ? "Practice (0 XP)" : "Práctica (0 XP)",
        colorBadge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        speedFactor: 0.85, // Promedio exacto del turno 2
        density: 2,
        isPractice: true,
      };
    }
  }, [isEn]);

  // Generador de carriles del sector / nivel (13 carriles exactos que encajan 100% en la pantalla)
  const generateLanes = useCallback((level: number, diffFactor: number, density: number): Lane[] => {
    const lanes: Lane[] = [];
    const speedMultiplier = 1 + (level - 1) * 0.12;

    for (let r = 0; r < TOTAL_LANES; r++) {
      if (r === 0) {
        // Meta: Parque Nacional (Visible arriba en la cima)
        lanes.push({ type: "goal", rowIndex: r });
      } else if (r === 11 || r === 12) {
        // Zona segura inicial en la hierba (abajo)
        lanes.push({ type: "safe_start", rowIndex: r });
      } else if (r === 3 || r === 4 || r === 5) {
        // Río Tropical con troncos y tortugas flotantes
        const speed = (r % 2 === 0 ? 1 : -1) * (0.85 + (r === 4 ? 0.35 : 0.15)) * diffFactor * speedMultiplier;
        const logs: Log[] = [
          { x: 25, width: 95, speed, type: "wood" },
          { x: 175, width: 105, speed, type: "wood" },
          { x: 330, width: 85, speed, type: r === 4 ? "turtle" : "wood" },
        ];
        lanes.push({ type: "river", rowIndex: r, logs, speed });
      } else if (r === 6) {
        // Isla verde intermedia segura con hoja de guarumo
        const leafCol = Math.floor(Math.random() * (COLS - 2)) + 1;
        lanes.push({ type: "safe_island", rowIndex: r, hasLeaf: true, leafCol });
      } else {
        // Carreteras con tráfico (r = 1, 2, 7, 8, 9, 10)
        // Todos los carros del mismo carril tienen la EXACTA misma velocidad
        const speed = (r % 2 === 0 ? 1 : -1) * (0.95 + (r % 3) * 0.2) * diffFactor * speedMultiplier;
        const vehicles: Vehicle[] = [];
        const numVehicles = density; // 2 o 3 según dificultad
        const wrapSpan = CANVAS_WIDTH + 180;
        const spacing = wrapSpan / numVehicles;

        for (let i = 0; i < numVehicles; i++) {
          const typeRand = (i + r) % 4;
          let vType: "car" | "4x4" | "bus" | "truck" = "car";
          let width = 60;
          let color = "#3b82f6";

          if (typeRand === 0) {
            vType = "bus";
            width = 80;
            color = "#10b981";
          } else if (typeRand === 1) {
            vType = "4x4";
            width = 65;
            color = "#f59e0b";
          } else if (typeRand === 2) {
            vType = "truck";
            width = 75;
            color = "#ef4444";
          }

          // Espaciado milimétrico y matemáticamente constante: NUNCA se sobreponen
          vehicles.push({
            x: -90 + i * spacing,
            width,
            speed,
            type: vType,
            color,
          });
        }

        const hasLeaf = Math.random() > 0.6;
        const leafCol = Math.floor(Math.random() * (COLS - 2)) + 1;
        lanes.push({ type: "road", rowIndex: r, vehicles, speed, hasLeaf, leafCol });
      }
    }

    return lanes;
  }, []);

  // Iniciar o reiniciar partida
  const startGame = useCallback(() => {
    const diff = getTurnDifficulty(dailyStatus?.gamesPlayedToday ?? 0);
    lanesRef.current = generateLanes(currentLevel, diff.speedFactor, diff.density);
    slothPos.current = {
      col: 4,
      row: TOTAL_LANES - 1, // fila 12 (hierba inicial)
      targetX: 4 * (CANVAS_WIDTH / COLS) + (CANVAS_WIDTH / COLS) / 2,
      targetY: (TOTAL_LANES - 1) * LANE_HEIGHT + LANE_HEIGHT / 2,
      currentX: 4 * (CANVAS_WIDTH / COLS) + (CANVAS_WIDTH / COLS) / 2,
      currentY: (TOTAL_LANES - 1) * LANE_HEIGHT + LANE_HEIGHT / 2,
      hopProgress: 1,
      direction: "up",
    };
    cameraY.current = 0; // Cámara fija a 0: todo el tablero desde inicio hasta Meta visible en pantalla completa
    setDistance(0);
    setMaxDistanceReached(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
    setIsBridgeActive(false);
    setBridgeTimeLeft(0);
    setRewardResult(null);
    playSound("hop");
  }, [currentLevel, dailyStatus?.gamesPlayedToday, generateLanes, getTurnDifficulty, playSound]);

  // Manejo de fin de partida (rescatado por guardaparques)
  const handleGameOver = useCallback(async (reason: "car" | "water") => {
    setIsPlaying(false);
    setIsGameOver(true);
    playSound(reason === "water" ? "splash" : "hit");

    // Seleccionar tip ecológico aleatorio
    const randomTip = CONSERVATION_TIPS[Math.floor(Math.random() * CONSERVATION_TIPS.length)];
    setActiveTip(randomTip);

    // Calcular distancia real alcanzada con precisión
    const currentMeters = Math.round((TOTAL_LANES - 1 - slothPos.current.row) * (75 / (TOTAL_LANES - 1)));
    const effectiveDistance = Math.max(maxDistanceReached, distance, currentMeters);

    // Actualizar récord local
    if (effectiveDistance > highScore) {
      setHighScore(effectiveDistance);
      localStorage.setItem("crucetikas_high_score", String(effectiveDistance));
    }

    const currentDiff = getTurnDifficulty(dailyStatus?.gamesPlayedToday ?? 0);

    // Si ya estamos en modo práctica libre (límite de 3 turnos alcanzado)
    if (currentDiff.isPractice) {
      setLastReward({ xpAwarded: 0, isPractice: true, gamesRemaining: 0 });
      return;
    }

    // Recompensar XP en servidor para turnos remunerados
    try {
      const username = getEffectiveUsername();
      const res = await awardCrucetikasXp({
        distance: effectiveDistance,
        slothsSaved,
        leavesCollected,
        localUsername: username,
        fallbackClerkId: user?.id,
      });

      setRewardResult(res);

      // Solo incrementamos contador local si efectivamente se otorgó XP
      if (res.xpAwarded > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        localStorage.setItem("crucetikas_local_day", todayStr);
        localStorage.setItem("crucetikas_local_count", String(res.gamesPlayedToday));
      }

      setLastReward({
        xpAwarded: res.xpAwarded,
        isPractice: res.limitReached,
        gamesRemaining: res.gamesRemaining,
      });

      if (res.success && res.xpAwarded > 0) {
        if (updateLocalXp && res.newTotalXp !== undefined && res.newLevel !== undefined) {
          updateLocalXp(res.newTotalXp, res.newLevel);
        }
        if (refreshGamification) {
          refreshGamification();
        }
        toast.success(
          isEn 
            ? `+${res.xpAwarded} XP awarded! (${res.gamesRemaining} turn(s) left today)` 
            : `¡+${res.xpAwarded} XP ganados! (Quedan ${res.gamesRemaining} turno(s) hoy)`,
          { icon: "🦥", duration: 4500 }
        );
      }
      fetchStatus();
    } catch (e) {
      console.warn("Error premiando XP:", e);
    }
  }, [dailyStatus?.gamesPlayedToday, distance, fetchStatus, getEffectiveUsername, getTurnDifficulty, highScore, isEn, leavesCollected, maxDistanceReached, playSound, refreshGamification, slothsSaved, updateLocalXp, user?.id]);

  // Manejo de victoria (llegada al Parque Nacional)
  const handleVictory = useCallback(async () => {
    setIsPlaying(false);
    setIsVictory(true);
    const nextSaved = slothsSaved + 1;
    setSlothsSaved(nextSaved);
    playSound("victory");

    // Confeti festivo
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#ffffff"],
      });
    } catch {}

    const randomTip = CONSERVATION_TIPS[Math.floor(Math.random() * CONSERVATION_TIPS.length)];
    setActiveTip(randomTip);

    const currentDiff = getTurnDifficulty(dailyStatus?.gamesPlayedToday ?? 0);

    // Si ya estamos en modo práctica libre
    if (currentDiff.isPractice) {
      setLastReward({ xpAwarded: 0, isPractice: true, gamesRemaining: 0 });
      return;
    }

    // Recompensar XP en servidor por Victoria (30 XP)
    try {
      const username = getEffectiveUsername();
      const res = await awardCrucetikasXp({
        distance: 75,
        slothsSaved: nextSaved,
        leavesCollected,
        localUsername: username,
        fallbackClerkId: user?.id,
      });

      setRewardResult(res);

      if (res.xpAwarded > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        localStorage.setItem("crucetikas_local_day", todayStr);
        localStorage.setItem("crucetikas_local_count", String(res.gamesPlayedToday));
      }

      setLastReward({
        xpAwarded: res.xpAwarded,
        isPractice: res.limitReached,
        gamesRemaining: res.gamesRemaining,
      });

      if (res.success && res.xpAwarded > 0) {
        if (updateLocalXp && res.newTotalXp !== undefined && res.newLevel !== undefined) {
          updateLocalXp(res.newTotalXp, res.newLevel);
        }
        if (refreshGamification) {
          refreshGamification();
        }
        toast.success(
          isEn 
            ? `+${res.xpAwarded} XP! Otico reached the National Park safely!` 
            : `¡+${res.xpAwarded} XP! Otico llegó a salvo al Parque Nacional`,
          { icon: "🦥", duration: 5000 }
        );
      }
      fetchStatus();
    } catch (e) {
      console.warn("Error premiando XP en victoria:", e);
    }
  }, [dailyStatus?.gamesPlayedToday, fetchStatus, getEffectiveUsername, getTurnDifficulty, isEn, leavesCollected, playSound, refreshGamification, slothsSaved, updateLocalXp, user?.id]);

  // Pasar al siguiente sector/nivel
  const handleNextLevel = () => {
    setCurrentLevel((prev) => prev + 1);
    startGame();
  };

  // Activar habilidad especial "Paso de Fauna" (puente aéreo de mecate)
  const activatePasoDeFauna = useCallback(() => {
    if (leavesForBridge < 3 || isBridgeActive || !isPlaying) return;

    setLeavesForBridge(0);
    setIsBridgeActive(true);
    setBridgeTimeLeft(7); // 7 segundos de puente colgante seguro
    playSound("bridge");

    toast.success(
      isEn ? "🌉 Wildlife Bridge Active! Cross roads safely!" : "🌉 ¡Paso de Fauna Activo! Cruzas carreteras seguro por arriba.",
      { icon: "🦥", duration: 3500 }
    );
  }, [isBridgeActive, isEn, isPlaying, leavesForBridge, playSound]);

  // Contador de tiempo de Paso de Fauna
  useEffect(() => {
    if (!isBridgeActive) return;
    const interval = setInterval(() => {
      setBridgeTimeLeft((prev) => {
        if (prev <= 1) {
          setIsBridgeActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBridgeActive]);

  // Movimiento del perezoso (avanzar, retroceder, laterales)
  const moveSloth = useCallback((dir: "up" | "down" | "left" | "right") => {
    if (!isPlaying) return;

    const p = slothPos.current;
    let nextCol = p.col;
    let nextRow = p.row;

    if (dir === "up") {
      nextRow = Math.max(0, p.row - 1);
    } else if (dir === "down") {
      nextRow = Math.min(TOTAL_LANES - 1, p.row + 1);
    } else if (dir === "left") {
      nextCol = Math.max(0, p.col - 1);
    } else if (dir === "right") {
      nextCol = Math.min(COLS - 1, p.col + 1);
    }

    if (nextCol === p.col && nextRow === p.row) return;

    p.col = nextCol;
    p.row = nextRow;
    p.direction = dir;
    p.targetX = nextCol * (CANVAS_WIDTH / COLS) + (CANVAS_WIDTH / COLS) / 2;
    p.targetY = nextRow * LANE_HEIGHT + LANE_HEIGHT / 2;
    p.hopProgress = 0; // Inicia animación de brinquito
    playSound("hop");

    // Calcular distancia avanzada (de 0m a 75m)
    const currentDist = Math.round((TOTAL_LANES - 1 - nextRow) * (75 / (TOTAL_LANES - 1)));
    setDistance(currentDist);
    setMaxDistanceReached((prev) => Math.max(prev, currentDist));

    // Revisar si recogió hoja de guarumo
    const currentLane = lanesRef.current.find((l) => l.rowIndex === nextRow);
    if (currentLane && currentLane.hasLeaf && currentLane.leafCol === nextCol) {
      currentLane.hasLeaf = false;
      setLeavesCollected((prev) => prev + 1);
      setLeavesForBridge((prev) => Math.min(3, prev + 1));
      playSound("leaf");
    }

    // Revisar si llegó a la meta
    if (nextRow === 0) {
      handleVictory();
    }
  }, [handleVictory, isPlaying, playSound]);

  // Soporte de teclado (Flechas y WASD + Espacio)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        moveSloth("up");
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        moveSloth("down");
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        moveSloth("left");
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        moveSloth("right");
      } else if (e.key === " ") {
        e.preventDefault();
        activatePasoDeFauna();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activatePasoDeFauna, moveSloth]);

  // Gestos táctiles Swipe y Tap en canvas
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
    const duration = Date.now() - touchStartPos.current.time;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Si es un toque rápido en el canvas sin deslizar (Tap) -> ¡Avanzar!
    if (Math.max(absX, absY) < 16 && duration < 380) {
      moveSloth("up");
    } else if (Math.max(absX, absY) >= 16) {
      // Gesto Swipe
      if (absY > absX) {
        if (deltaY < 0) moveSloth("up");
        else moveSloth("down");
      } else {
        if (deltaX < 0) moveSloth("left");
        else moveSloth("right");
      }
    }
    touchStartPos.current = null;
  };

  // Alternar sonido y persistir
  const toggleSound = () => {
    const nextState = !isSoundEnabled;
    setIsSoundEnabled(nextState);
    localStorage.setItem("crucetikas_sound", String(nextState));
  };

  // ==========================================
  // BUCLE PRINCIPAL DE JUEGO Y RENDERIZADO
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // 1. ACTUALIZAR POSICIONES DE VEHÍCULOS Y TRONCOS (CONSERVACIÓN PERFECTA DE ESPACIO)
      const wrapSpan = CANVAS_WIDTH + 180;
      lanesRef.current.forEach((lane) => {
        if (lane.vehicles) {
          lane.vehicles.forEach((v) => {
            v.x += v.speed * 60 * dt;
            if (v.speed > 0 && v.x > CANVAS_WIDTH + 90) {
              v.x -= wrapSpan;
            } else if (v.speed < 0 && v.x < -90 - v.width) {
              v.x += wrapSpan;
            }
          });
        }
        if (lane.logs) {
          lane.logs.forEach((log) => {
            log.x += log.speed * 60 * dt;
            if (log.speed > 0 && log.x > CANVAS_WIDTH + 90) {
              log.x -= wrapSpan;
            } else if (log.speed < 0 && log.x < -90 - log.width) {
              log.x += wrapSpan;
            }
          });
        }
      });

      // 2. ACTUALIZAR PEREZOSO (INTERPOLACIÓN SUAVE DE BRINQUITO)
      const p = slothPos.current;
      if (p.hopProgress < 1) {
        p.hopProgress = Math.min(1, p.hopProgress + dt * 6.5);
      }
      p.currentX += (p.targetX - p.currentX) * 0.35;
      p.currentY += (p.targetY - p.currentY) * 0.35;

      // 3. SEGUIMIENTO DE CÁMARA (SIN VACÍO NEGRO INFERIOR Y SIGUIENDO SUAVE AL PEREZOSO)
      const maxCamY = Math.max(0, TOTAL_LANES * LANE_HEIGHT - CANVAS_HEIGHT);
      const targetCamY = Math.max(0, Math.min(maxCamY, p.currentY - CANVAS_HEIGHT * 0.65));
      cameraY.current += (targetCamY - cameraY.current) * 0.15;

      // 4. DETECCIÓN DE COLISIONES
      if (isPlaying && p.hopProgress >= 0.8) {
        const currentLane = lanesRef.current.find((l) => l.rowIndex === p.row);

        // A. Colisión en Carretera (vehículos)
        if (currentLane && currentLane.type === "road" && !isBridgeActive) {
          const slothHitbox = {
            left: p.currentX - 14,
            right: p.currentX + 14,
          };
          if (currentLane.vehicles) {
            for (const v of currentLane.vehicles) {
              if (slothHitbox.right > v.x && slothHitbox.left < v.x + v.width) {
                handleGameOver("car");
                break;
              }
            }
          }
        }

        // B. Mecánica de Río (debe estar encima de un tronco o tortuga)
        if (currentLane && currentLane.type === "river") {
          let isOnLog = false;
          if (currentLane.logs) {
            for (const log of currentLane.logs) {
              if (p.currentX >= log.x - 4 && p.currentX <= log.x + log.width + 4) {
                isOnLog = true;
                // El perezoso se desplaza con la velocidad del tronco
                p.currentX += log.speed * 60 * dt;
                p.targetX += log.speed * 60 * dt;
                p.col = Math.floor(p.currentX / (CANVAS_WIDTH / COLS));
                break;
              }
            }
          }
          // Si cae al agua o es arrastrado fuera de los bordes
          if (!isOnLog || p.currentX < 0 || p.currentX > CANVAS_WIDTH) {
            handleGameOver("water");
          }
        }
      }

      // ==========================================
      // RENDERIZADO GRÁFICO
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.save();
      ctx.translate(0, -cameraY.current);

      // Dibujar cada carril
      lanesRef.current.forEach((lane) => {
        const laneY = lane.rowIndex * LANE_HEIGHT;

        // --- Fondo del carril ---
        if (lane.type === "safe_start" || lane.type === "safe_island") {
          // Césped selvático tropical con textura
          ctx.fillStyle = lane.rowIndex % 2 === 0 ? "#166534" : "#15803d";
          ctx.fillRect(0, laneY, CANVAS_WIDTH, LANE_HEIGHT);
          // Manchas sutiles de vegetación
          ctx.fillStyle = "#22c55e";
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc((i * 80 + 35) % CANVAS_WIDTH, laneY + 25, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (lane.type === "road") {
          // Asfalto de carretera con líneas viales
          ctx.fillStyle = "#334155";
          ctx.fillRect(0, laneY, CANVAS_WIDTH, LANE_HEIGHT);

          // Línea divisoria discontinua amarilla
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2.5;
          ctx.setLineDash([12, 12]);
          ctx.beginPath();
          ctx.moveTo(0, laneY + LANE_HEIGHT / 2);
          ctx.lineTo(CANVAS_WIDTH, laneY + LANE_HEIGHT / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (lane.type === "river") {
          // Agua turquesa tropical de río
          ctx.fillStyle = "#0284c7";
          ctx.fillRect(0, laneY, CANVAS_WIDTH, LANE_HEIGHT);

          // Caústicas de agua animadas
          ctx.fillStyle = "#38bdf8";
          const waveOffset = (now * 0.04) % 60;
          for (let i = -60; i < CANVAS_WIDTH + 60; i += 60) {
            ctx.fillRect(i + waveOffset, laneY + 12, 22, 3);
            ctx.fillRect(i - waveOffset * 0.7, laneY + 34, 18, 2);
          }
        } else if (lane.type === "goal") {
          // Meta: Reserva del Parque Nacional (Sutil e integrada al entorno natural)
          ctx.fillStyle = "#14532d";
          ctx.fillRect(0, laneY, CANVAS_WIDTH, LANE_HEIGHT);

          // Follaje selvático tropical en la cima
          ctx.fillStyle = "#15803d";
          for (let x = -10; x < CANVAS_WIDTH + 20; x += 32) {
            ctx.beginPath();
            ctx.arc(x + 16, laneY + 6, 14, 0, Math.PI * 2);
            ctx.fill();
          }

          // Distintivo sutil y elegante de la meta (centrado en el carril)
          const badgeW = 210;
          const badgeH = 22;
          const badgeX = (CANVAS_WIDTH - badgeW) / 2;
          const badgeY = laneY + 14;

          ctx.fillStyle = "rgba(6, 78, 59, 0.9)";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 11);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fill();
          ctx.strokeStyle = "rgba(187, 247, 208, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#bbf7d0";
          ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🌲 PARQUE NACIONAL (META) 🌲", CANVAS_WIDTH / 2, badgeY + badgeH / 2);
        }

        // --- Dibujar Troncos y Tortugas en el río ---
        if (lane.logs) {
          lane.logs.forEach((log) => {
            if (log.type === "wood") {
              // Tronco de madera tropical con nudos
              ctx.fillStyle = "#78350f";
              ctx.beginPath();
              ctx.roundRect(log.x, laneY + 8, log.width, LANE_HEIGHT - 16, 8);
              ctx.fill();
              ctx.strokeStyle = "#451a03";
              ctx.lineWidth = 2;
              ctx.stroke();
              // Detalle de corteza
              ctx.fillStyle = "#92400e";
              ctx.fillRect(log.x + 10, laneY + 16, log.width - 20, 4);
            } else {
              // Tortuga marina amigable
              ctx.fillStyle = "#059669";
              ctx.beginPath();
              ctx.ellipse(log.x + log.width / 2, laneY + LANE_HEIGHT / 2, log.width / 2.3, 15, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#047857";
              ctx.beginPath();
              ctx.arc(log.x + (log.speed > 0 ? log.width : 0), laneY + LANE_HEIGHT / 2, 7, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }

        // --- Dibujar Vehículos ---
        if (lane.vehicles) {
          lane.vehicles.forEach((v) => {
            const vy = laneY + 7;
            const vh = LANE_HEIGHT - 14;

            // Cuerpo del vehículo
            ctx.fillStyle = v.color;
            ctx.beginPath();
            ctx.roundRect(v.x, vy, v.width, vh, 7);
            ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Ventanas
            ctx.fillStyle = "#e2e8f0";
            const winW = v.width * 0.45;
            ctx.fillRect(v.x + (v.speed > 0 ? v.width * 0.35 : v.width * 0.15), vy + 5, winW, vh - 10);

            // Luces delanteras y traseras
            if (v.speed > 0) {
              ctx.fillStyle = "#fef08a"; // Farol delantero
              ctx.fillRect(v.x + v.width - 3, vy + 4, 3, 5);
              ctx.fillRect(v.x + v.width - 3, vy + vh - 9, 3, 5);
              ctx.fillStyle = "#ef4444"; // Luz trasera
              ctx.fillRect(v.x, vy + 4, 3, 5);
              ctx.fillRect(v.x, vy + vh - 9, 3, 5);
            } else {
              ctx.fillStyle = "#fef08a";
              ctx.fillRect(v.x, vy + 4, 3, 5);
              ctx.fillRect(v.x, vy + vh - 9, 3, 5);
              ctx.fillStyle = "#ef4444";
              ctx.fillRect(v.x + v.width - 3, vy + 4, 3, 5);
              ctx.fillRect(v.x + v.width - 3, vy + vh - 9, 3, 5);
            }

            // Detalle temático según tipo
            if (v.type === "4x4") {
              // Tabla de surf en el techo
              ctx.fillStyle = "#ec4899";
              ctx.beginPath();
              ctx.roundRect(v.x + v.width * 0.2, vy - 3, v.width * 0.6, 5, 3);
              ctx.fill();
            } else if (v.type === "bus") {
              // Rótulo "PURA VIDA" en el techo
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 8px system-ui";
              ctx.fillText("PURA VIDA", v.x + v.width / 2, vy + vh / 2 + 2);
            }
          });
        }

        // --- Dibujar Ramas / Hojas de Guarumo recolectables ---
        if (lane.hasLeaf && lane.leafCol !== undefined) {
          const leafX = lane.leafCol * (CANVAS_WIDTH / COLS) + (CANVAS_WIDTH / COLS) / 2;
          const leafY = laneY + LANE_HEIGHT / 2 + Math.sin(now * 0.005) * 3;

          ctx.save();
          // Sombra sutil para máximo contraste y nitidez en carretera y césped
          ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;

          ctx.font = "22px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🌿", leafX, leafY);
          ctx.restore();
        }

        // --- Si el Paso de Fauna está activo en carretera, dibujar puente aéreo de mecate ---
        if (isBridgeActive && lane.type === "road") {
          ctx.strokeStyle = "rgba(180, 83, 9, 0.75)";
          ctx.lineWidth = 4;
          // Cuerdas principales
          ctx.beginPath();
          ctx.moveTo(0, laneY + 4);
          ctx.lineTo(CANVAS_WIDTH, laneY + 4);
          ctx.moveTo(0, laneY + LANE_HEIGHT - 4);
          ctx.lineTo(CANVAS_WIDTH, laneY + LANE_HEIGHT - 4);
          ctx.stroke();

          // Travesaños de madera del puente
          ctx.fillStyle = "#d97706";
          for (let x = 0; x < CANVAS_WIDTH; x += 22) {
            ctx.fillRect(x, laneY + 4, 6, LANE_HEIGHT - 8);
          }
        }
      });

      // --- DIBUJAR AL PEREZOSO TIKO ---
      const slothX = p.currentX;
      // Parábola de elevación del brinquito
      const hopOffset = Math.sin(p.hopProgress * Math.PI) * 12;
      const slothY = p.currentY - hopOffset;

      // Sombra proyectada en el suelo
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.ellipse(slothX, p.currentY + 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Halo protector si el Paso de Fauna está activo
      if (isBridgeActive) {
        ctx.fillStyle = "rgba(34, 197, 94, 0.35)";
        ctx.beginPath();
        ctx.arc(slothX, slothY, 26 + Math.sin(now * 0.01) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Cuerpo del perezoso (pelaje café)
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.arc(slothX, slothY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Cara del perezoso (crema claro)
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.ellipse(slothX, slothY + 2, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Antifaz oscuro de los ojos característico del perezoso
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(slothX - 5, slothY, 3, 5, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(slothX + 5, slothY, 3, 5, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Ojos y nariz
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(slothX - 4, slothY, 1.8, 0, Math.PI * 2);
      ctx.arc(slothX + 4, slothY, 1.8, 0, Math.PI * 2);
      ctx.arc(slothX, slothY + 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Sombrero de explorador blanco icónico de Otico con cinta roja
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(slothX, slothY - 12, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(slothX - 7, slothY - 19, 14, 8);
      ctx.strokeRect(slothX - 7, slothY - 19, 14, 8);

      // Cinta roja del sombrero
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(slothX - 7, slothY - 13, 14, 2.5);

      ctx.restore();

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleGameOver, isBridgeActive, isPlaying]);

  const turnDiff = getTurnDifficulty(dailyStatus?.gamesPlayedToday ?? 0);

  return (
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-stone-950 text-stone-100 select-none touch-none overscroll-none">
      
      {/* Barra superior ultra-compacta (Header + Marcador integrado) */}
      <header className="w-full max-w-lg mx-auto pt-2 pb-1.5 px-3 flex-shrink-0 z-30">
        <div className="flex items-center justify-between gap-2">
          {/* Botón Volver a Comunidad */}
          <Link 
            href={`/${lang}/community`} 
            className="flex items-center gap-1 text-stone-300 hover:text-white transition-colors bg-stone-900/90 active:bg-stone-800 px-2.5 py-1.5 rounded-xl border border-stone-800 text-xs font-bold shadow-sm"
          >
            <ArrowLeft size={15} />
            <span className="hidden xs:inline">{isEn ? "Community" : "Comunidad"}</span>
          </Link>

          {/* Marcador Central: Turno/Dificultad, Distancia y Salvados */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 border border-stone-800 px-2.5 py-1 rounded-xl shadow-sm">
            <span className={`px-1.5 py-0.5 rounded-lg border text-[9px] uppercase font-black tracking-wide ${turnDiff.colorBadge}`}>
              {turnDiff.badge}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-white">{distance}m</span>
              {slothsSaved > 0 && (
                <span className="text-[10px] font-bold text-amber-400">({slothsSaved}★)</span>
              )}
            </div>
          </div>

          {/* Indicador de Hojas de Guarumo + Botones Sonido y Ayuda */}
          <div className="flex items-center gap-1.5">
            <div className="bg-stone-900/90 border border-stone-800 px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
              <span className="text-xs">🌿</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full border transition-all ${
                      idx < leavesForBridge
                        ? "bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                        : "bg-stone-700 border-stone-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSound}
              className="w-7 h-7 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-300 flex items-center justify-center transition-all border border-stone-800 shadow-sm"
              title={isSoundEnabled ? (isEn ? "Mute" : "Silenciar") : (isEn ? "Unmute" : "Activar Sonido")}
            >
              {isSoundEnabled ? <Volume2 size={14} className="text-emerald-400" /> : <VolumeX size={14} className="text-stone-500" />}
            </button>

            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="w-7 h-7 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-300 flex items-center justify-center transition-all border border-stone-800 shadow-sm"
              title={isEn ? "How to play" : "¿Cómo jugar?"}
            >
              <HelpCircle size={14} className="text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE JUEGO PRINCIPAL (CANVAS) */}
      <div className="relative flex-1 w-full max-w-[450px] mx-auto min-h-0 overflow-hidden flex items-center justify-center px-2 py-1 touch-none">
        <div className="relative w-full h-full max-h-full aspect-[450/650] rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-800 bg-stone-950 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={(e) => e.preventDefault()}
            className="w-full h-full object-contain block cursor-pointer touch-none"
            style={{ touchAction: 'none' }}
          />

          {/* Banner flotante de Paso de Fauna Activo */}
          {isBridgeActive && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/80 shadow-xl flex items-center gap-1.5 animate-bounce z-20">
              <ShieldCheck size={18} className="text-white" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                {isEn ? `Bridge: ${bridgeTimeLeft}s` : `¡Paso Fauna: ${bridgeTimeLeft}s!`}
              </span>
            </div>
          )}

          {/* PANTALLA INICIAL (ANTES DE EMPEZAR) */}
          {!isPlaying && !isGameOver && !isVictory && (
            <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-30 overflow-y-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-4xl mb-2.5 shadow-xl animate-pulse">
                🦥
              </div>
              <h1 className="text-2xl font-black text-white mb-0.5 tracking-wide drop-shadow-md">
                Crucetiko
              </h1>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                {isEn ? "Wildlife Safe Crossing" : "Paso Seguro de Fauna Silvestre"}
              </p>
              <p className="text-stone-300 text-xs max-w-xs mb-3 leading-relaxed">
                {isEn
                  ? "Help Otico cross roads and tropical rivers to reach the National Park safely. Collect Guarumo leaves to build aerial canopy bridges!"
                  : "Ayuda a Otico a cruzar carreteras y ríos tropicales para llegar a salvo al Parque Nacional. ¡Recoge hojas de Guarumo para desplegar puentes aéreos!"}
              </p>

              {/* Tarjeta de Estado del Turno y Dificultad Dinámica */}
              {!turnDiff.isPractice ? (
                <div className="w-full max-w-xs bg-stone-900/90 border border-stone-800 rounded-2xl p-2.5 mb-3 text-center shadow-md">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${turnDiff.colorBadge}`}>
                      {turnDiff.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-300">
                    {turnDiff.turnIndex === 1 && (isEn ? "Slow traffic: Great warm-up! Earn up to 30 XP." : "Tráfico lento y espaciado: ¡Buen inicio! Gana hasta 30 XP.")}
                    {turnDiff.turnIndex === 2 && (isEn ? "Medium traffic: Good pace! Earn up to 30 XP." : "Tráfico moderado: ¡Buen ritmo! Gana hasta 30 XP.")}
                    {turnDiff.turnIndex === 3 && (isEn ? "Challenging traffic: Highest reward! Earn up to 30 XP." : "Tráfico rápido y retador: ¡Máxima destreza! Gana hasta 30 XP.")}
                  </div>
                  <div className="mt-1.5 text-[10px] text-amber-400 font-bold">
                    ⭐ {dailyStatus?.gamesRemaining ?? 3} {isEn ? "turn(s) with XP left today" : "turno(s) con XP restantes hoy"}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xs bg-purple-950/40 border-2 border-purple-500/50 rounded-2xl p-3 mb-3 text-center shadow-lg shadow-purple-900/20">
                  <div className="inline-block px-2.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400 text-purple-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    {isEn ? "⚡ FREE PRACTICE MODE (0 XP)" : "⚡ MODO PRÁCTICA LIBRE (0 XP)"}
                  </div>
                  <p className="text-xs text-stone-200 font-bold leading-snug">
                    {isEn 
                      ? "You completed your 3 rewarded turns today (90/90 XP)." 
                      : "¡Completaste tus 3 turnos con XP de hoy! (90/90 XP alcanzados)."}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                    {isEn
                      ? "Average speed active. In this mode you play for fun and to beat your personal distance record! Daily XP resets at midnight."
                      : "Velocidad promedio activada. En este modo juegas para superar tu récord de metros (no suma más XP). Tus 3 turnos se reinician a medianoche."}
                  </p>
                </div>
              )}

              <button
                onClick={startGame}
                className={`w-full max-w-xs py-3.5 px-6 rounded-2xl text-white font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  !turnDiff.isPractice
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/30"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/30"
                }`}
              >
                <Sparkles size={18} />
                <span>
                  {!turnDiff.isPractice 
                    ? (isEn ? `START TURN ${turnDiff.turnIndex} OF 3` : `COMENZAR TURNO ${turnDiff.turnIndex} DE 3`)
                    : (isEn ? "PLAY IN PRACTICE MODE" : "JUGAR MODO PRÁCTICA")}
                </span>
              </button>
            </div>
          )}

          {/* MODAL DE RESCATADO / GAME OVER */}
          {isGameOver && (
            <div className="absolute inset-0 bg-stone-950/92 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-30 animate-fadeIn overflow-y-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl mb-2 shadow-xl">
                🦺
              </div>
              <h2 className="text-xl font-black text-white mb-0.5">
                {isEn ? "Rescued in Time!" : "¡Rescatado por Guardaparques!"}
              </h2>
              <p className="text-stone-400 text-[11px] mb-2">
                {isEn 
                  ? "The rangers assisted Otico before any danger. Great attempt!"
                  : "Los guardaparques asistieron a Otico a tiempo. ¡Buen intento!"}
              </p>

              {/* Tarjeta de Estadísticas de la partida */}
              <div className="w-full max-w-xs bg-stone-900 border border-stone-800 rounded-xl p-2 mb-2.5 grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="text-[9px] text-stone-500 font-bold uppercase">{isEn ? "Distance" : "Distancia"}</div>
                  <div className="text-sm font-black text-white">{maxDistanceReached} m</div>
                </div>
                <div>
                  <div className="text-[9px] text-stone-500 font-bold uppercase">{isEn ? "Leaves" : "Hojas"}</div>
                  <div className="text-sm font-black text-emerald-400">{leavesCollected} 🌿</div>
                </div>
                <div>
                  <div className="text-[9px] text-stone-500 font-bold uppercase">{isEn ? "Saved" : "Salvados"}</div>
                  <div className="text-sm font-black text-amber-400">{slothsSaved} 🦥</div>
                </div>
              </div>

              {/* Banner de Estado de XP / Turnos */}
              {lastReward?.isPractice ? (
                <div className="w-full max-w-xs bg-purple-950/50 border border-purple-500/50 rounded-xl p-2.5 mb-2.5 text-center">
                  <div className="text-xs font-black text-purple-300">
                    {isEn ? "⚡ Free Practice Mode (0 XP)" : "⚡ Modo Práctica Libre (0 XP)"}
                  </div>
                  <div className="text-[10px] text-stone-300 mt-0.5 leading-tight">
                    {isEn 
                      ? "3 of 3 daily rewarded games completed. Playing for personal record!" 
                      : "Ya completaste tus 3 turnos con XP de hoy. Jugando por récord personal."}
                  </div>
                </div>
              ) : lastReward && lastReward.xpAwarded > 0 ? (
                <div className="w-full max-w-xs bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-2.5 mb-2.5 text-center">
                  <div className="text-xs font-black text-emerald-400">
                    {isEn ? `⭐ +${lastReward.xpAwarded} XP Earned!` : `⭐ ¡+${lastReward.xpAwarded} XP Ganados!`}
                  </div>
                  <div className="text-[10px] text-stone-300 mt-0.5">
                    {lastReward.gamesRemaining > 0 
                      ? (isEn ? `You have ${lastReward.gamesRemaining} turn(s) with XP remaining today.` : `Te quedan ${lastReward.gamesRemaining} turno(s) con XP hoy.`)
                      : (isEn ? "3 of 3 turns completed! Next games will be in Free Practice Mode." : "¡3 de 3 turnos completados! Las siguientes partidas serán en Modo Práctica Libre.")}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xs bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 mb-2.5 text-center">
                  <div className="text-xs font-black text-amber-300">
                    {isEn ? "⚠️ Try Again! Turn Preserved" : "⚠️ ¡Inténtalo de Nuevo! Turno Conservado"}
                  </div>
                  <div className="text-[10px] text-stone-300 mt-0.5 leading-snug">
                    {isEn 
                      ? "Your turn was NOT consumed. Cross past 12m or collect 1 guarumo leaf to bank your XP!" 
                      : "Tu turno NO fue consumido. Avanza más de 12m o recoge 1 hoja de guarumo para asegurar tus XP."}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold mt-1">
                    ⭐ {dailyStatus?.gamesRemaining ?? 3} {isEn ? "turn(s) with XP available today" : "turno(s) con XP disponibles hoy"}
                  </div>
                </div>
              )}

              {/* Consejo Ecológico Oficial */}
              <div className="w-full max-w-xs bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 mb-3 text-left flex gap-2 items-start">
                <span className="text-xl flex-shrink-0">{activeTip.icon}</span>
                <div>
                  <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{activeTip.location}</div>
                  <div className="text-[11px] text-stone-300 leading-snug mt-0.5">{isEn ? activeTip.en : activeTip.es}</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full max-w-xs py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                <span>{isEn ? "Play Again" : "Intentar de Nuevo"}</span>
              </button>
            </div>
          )}

          {/* MODAL DE VICTORIA / SECTOR COMPLETADO */}
          {isVictory && (
            <div className="absolute inset-0 bg-stone-950/92 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-30 animate-fadeIn overflow-y-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center text-4xl mb-2 shadow-xl animate-bounce">
                🎉
              </div>
              <h2 className="text-xl font-black text-white mb-0.5">
                {isEn ? "National Park Reached!" : "¡Parque Nacional Alcanzado!"}
              </h2>
              <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                {isEn ? "Otico Safe & Sound 🇨🇷" : "¡Otico a Salvo en su Hábitat! 🇨🇷"}
              </p>

              <div className="w-full max-w-xs bg-stone-900 border border-stone-800 rounded-xl p-2.5 mb-2.5">
                <div className="text-[11px] text-stone-300 font-medium">
                  {isEn 
                    ? `You have guided ${slothsSaved} wildlife animal(s) into protected forest reserve!`
                    : `¡Has guiado a ${slothsSaved} animal(es) silvestre(s) a la reserva forestal protegida!`}
                </div>
              </div>

              {/* Banner de Estado de XP / Turnos en Victoria */}
              {lastReward?.isPractice ? (
                <div className="w-full max-w-xs bg-purple-950/50 border border-purple-500/50 rounded-xl p-2.5 mb-2.5 text-center">
                  <div className="text-xs font-black text-purple-300">
                    {isEn ? "🏆 Victory in Practice Mode (0 XP)" : "🏆 ¡Victoria en Modo Práctica! (0 XP)"}
                  </div>
                  <div className="text-[10px] text-stone-300 mt-0.5 leading-tight">
                    {isEn 
                      ? "Otico reached the park! (Daily XP was already completed: 3/3 turns)." 
                      : "¡Otico llegó al parque! (Tu XP diaria ya estaba completada: 3/3 turnos)."}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xs bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-2.5 mb-2.5 text-center">
                  <div className="text-xs font-black text-emerald-400">
                    ⭐ {isEn ? "+30 XP Victory Reward!" : "¡+30 XP Ganados por Victoria Total!"}
                  </div>
                  <div className="text-[10px] text-stone-300 mt-0.5">
                    {dailyStatus?.gamesRemaining > 0 
                      ? (isEn ? `You have ${dailyStatus.gamesRemaining} turn(s) with XP remaining today.` : `Te quedan ${dailyStatus.gamesRemaining} turno(s) con XP hoy.`)
                      : (isEn ? "All 3 turns completed! Next games will be in Practice Mode." : "¡Completaste tus 3 turnos! Próximas partidas serán en Modo Práctica Libre.")}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={handleNextLevel}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>{isEn ? `Next Sector (Level ${currentLevel + 1})` : `Siguiente Sector (Nivel ${currentLevel + 1})`}</span>
                </button>

                <button
                  onClick={startGame}
                  className="w-full py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 transition-colors"
                >
                  {isEn ? "Replay this Sector" : "Repetir este Sector"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTROLES TÁCTILES FLOTANTES EN PANTALLA (MOBILE & DESKTOP) */}
      <div className="w-full max-w-[450px] mx-auto px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] bg-stone-900/95 backdrop-blur-md border-t border-stone-800/80 z-30 flex items-center justify-between gap-2.5 flex-shrink-0 shadow-2xl touch-none">
        
        {/* D-Pad de Dirección (Izquierda, Abajo, Derecha) */}
        <div className="grid grid-cols-3 gap-1 w-28 sm:w-32 flex-shrink-0">
          <div />
          <button
            type="button"
            onClick={() => moveSloth("up")}
            aria-label="Avanzar"
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-stone-800 active:bg-emerald-600 border border-stone-700 text-stone-200 flex items-center justify-center font-black shadow-md active:scale-95 transition-all"
          >
            <ChevronUp size={20} />
          </button>
          <div />

          <button
            type="button"
            onClick={() => moveSloth("left")}
            aria-label="Izquierda"
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-stone-800 active:bg-emerald-600 border border-stone-700 text-stone-200 flex items-center justify-center font-black shadow-md active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => moveSloth("down")}
            aria-label="Retroceder"
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-stone-800 active:bg-emerald-600 border border-stone-700 text-stone-200 flex items-center justify-center font-black shadow-md active:scale-95 transition-all"
          >
            <ChevronDown size={20} />
          </button>

          <button
            type="button"
            onClick={() => moveSloth("right")}
            aria-label="Derecha"
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-stone-800 active:bg-emerald-600 border border-stone-700 text-stone-200 flex items-center justify-center font-black shadow-md active:scale-95 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Botón Principal: AVANZAR ⬆️ */}
        <button
          type="button"
          onClick={() => moveSloth("up")}
          className="flex-1 h-18 sm:h-20 rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 active:from-emerald-500 active:to-emerald-600 border-2 border-emerald-400 text-white flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-emerald-900/40 active:scale-95 transition-all py-1.5"
        >
          <ChevronUp size={24} className="stroke-[3]" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">{isEn ? "HOP" : "AVANZAR"}</span>
        </button>

        {/* Botón Mágico: ACTIVAR PASO DE FAUNA 🌉 */}
        <button
          type="button"
          onClick={activatePasoDeFauna}
          disabled={leavesForBridge < 3 || isBridgeActive || !isPlaying}
          className={`w-24 sm:w-28 h-18 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 text-center transition-all flex-shrink-0 ${
            leavesForBridge >= 3 && !isBridgeActive
              ? "bg-amber-500 border-amber-300 text-white shadow-lg shadow-amber-500/50 animate-pulse active:scale-95 cursor-pointer"
              : "bg-stone-800/80 border-stone-700 text-stone-500 opacity-60 cursor-not-allowed"
          }`}
        >
          <span className="text-xl sm:text-2xl">🌉</span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase mt-0.5 leading-tight">
            {isBridgeActive ? (isEn ? "ACTIVE!" : "¡ACTIVO!") : (isEn ? "BRIDGE" : "PUENTE")}
          </span>
          <span className="text-[9px] font-bold mt-0.5 text-stone-300">
            {leavesForBridge}/3 🌿
          </span>
        </button>
      </div>

      {/* MODAL DE AYUDA / CÓMO JUGAR */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                🦥
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{isEn ? "How to Play" : "¿Cómo Jugar?"}</h3>
                <p className="text-xs text-emerald-400 font-bold uppercase">{isEn ? "Crucetiko Rules" : "Reglas de Crucetiko"}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-300 mb-6 leading-relaxed">
              <div className="flex gap-2.5 items-start bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60">
                <span className="text-lg">⬆️</span>
                <div>
                  <strong className="text-white block">{isEn ? "Move Otico:" : "Mueve a Otico:"}</strong>
                  {isEn ? "Use arrows, WASD or on-screen buttons to hop from lane to lane." : "Usa las flechas, WASD o los botones táctiles para avanzar casilla por casilla."}
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60">
                <span className="text-lg">🚗</span>
                <div>
                  <strong className="text-white block">{isEn ? "Avoid Traffic:" : "Esquiva los Vehículos:"}</strong>
                  {isEn ? "Time your steps across highway lanes. 4x4s, buses, and trucks won't stop!" : "Calcula bien el timing en la carretera. ¡Los carros y camiones van con prisa!"}
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60">
                <span className="text-lg">🪵</span>
                <div>
                  <strong className="text-white block">{isEn ? "River Crossing:" : "Cruza el Río:"}</strong>
                  {isEn ? "Step onto floating logs and turtles. Don't fall into the water!" : "Súbete a los troncos y tortugas flotantes. ¡No toques el agua corriente!"}
                </div>
              </div>

              <div className="flex gap-2.5 items-start bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/60">
                <span className="text-lg">🌉</span>
                <div>
                  <strong className="text-white block">{isEn ? "Wildlife Canopy Bridge:" : "Paso de Fauna Aéreo:"}</strong>
                  {isEn ? "Collect 3 Guarumo leaves to unlock 7 seconds of invulnerable aerial bridge crossing!" : "Recoge 3 hojas de Guarumo para activar 7 segundos de puente colgante aéreo invulnerable."}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-colors"
            >
              {isEn ? "Got it! Let's Play" : "¡Entendido! A Jugar"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

