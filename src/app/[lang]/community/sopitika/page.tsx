"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  HelpCircle, 
  Play, 
  Trophy, 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Search, 
  ExternalLink,
  MapPin,
  Tag
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { 
  getPlacesForSopitika, 
  getSopitikaDailyStatus, 
  awardSopitikaXP, 
  GameWordPlace, 
  DailySopitikaStatus, 
  AwardSopitikaXPResult 
} from "../../../../actions/sopitika";

const GRID_SIZE = 11;
const TARGET_WORDS_COUNT = 6;
const LETTER_POOL = "AAAAABBCCCDDEEEEEFFGGHHIIIIIJKLLLMNNNNÑOOOOPQRRRSSSTTTUUUVYZ";

const WORD_COLORS = [
  {
    bg: "bg-emerald-200/90",
    border: "border-emerald-400",
    text: "text-emerald-950",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    ring: "ring-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-200/90",
    border: "border-amber-400",
    text: "text-amber-950",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    ring: "ring-amber-400",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-sky-200/90",
    border: "border-sky-400",
    text: "text-sky-950",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    ring: "ring-sky-400",
    dot: "bg-sky-500",
  },
  {
    bg: "bg-pink-200/90",
    border: "border-pink-400",
    text: "text-pink-950",
    badge: "bg-pink-100 text-pink-800 border-pink-300",
    ring: "ring-pink-400",
    dot: "bg-pink-500",
  },
  {
    bg: "bg-purple-200/90",
    border: "border-purple-400",
    text: "text-purple-950",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    ring: "ring-purple-400",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-teal-200/90",
    border: "border-teal-400",
    text: "text-teal-950",
    badge: "bg-teal-100 text-teal-800 border-teal-300",
    ring: "ring-teal-400",
    dot: "bg-teal-500",
  },
];

const DIRECTIONS: [number, number][] = [
  [0, 1],   // horizontal derecha
  [1, 0],   // vertical abajo
  [1, 1],   // diagonal abajo-derecha
  [-1, 1],  // diagonal arriba-derecha
  [0, -1],  // horizontal izquierda
  [-1, 0],  // vertical arriba
];

interface PlacedWord extends GameWordPlace {
  color: typeof WORD_COLORS[0];
  cells: { r: number; c: number }[];
  isFound: boolean;
}

interface CellCoord {
  r: number;
  c: number;
}

export default function SopitikaPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = use(params);
  const lang = unwrappedParams?.lang || "es";
  const isEn = lang === "en";
  const { user } = useUser();

  // Estados del juego
  const [grid, setGrid] = useState<string[][]>([]);
  const [targetWords, setTargetWords] = useState<PlacedWord[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Selección de celdas
  const [selectionStart, setSelectionStart] = useState<CellCoord | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<CellCoord | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pistas
  const [hintsRemaining, setHintsRemaining] = useState(1);
  const [hintedCell, setHintedCell] = useState<CellCoord | null>(null);

  // Cronómetro
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio sintetizado
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Modales
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [rewardResult, setRewardResult] = useState<AwardSopitikaXPResult | null>(null);

  // Estado diario (límite 2 partidas al día)
  const [dailyStatus, setDailyStatus] = useState<DailySopitikaStatus>({
    gamesPlayedToday: 0,
    gamesRemaining: 2,
    todayEarnedXp: 0,
    maxDailyGames: 2,
    maxDailyXp: 100,
    canPlay: true,
  });

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Cargar preferencia de sonido
  useEffect(() => {
    const saved = localStorage.getItem("sopitika_sound");
    if (saved !== null) {
      setIsSoundEnabled(saved === "true");
    }
  }, []);

  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    localStorage.setItem("sopitika_sound", String(next));
    if (next) playSound("click");
  };

  // Sonidos Web Audio API
  const playSound = (type: "click" | "found" | "error" | "hint" | "victory") => {
    if (!isSoundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const t0 = ctx.currentTime;

      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, t0);
        osc.frequency.exponentialRampToValueAtTime(720, t0 + 0.05);
        gain.gain.setValueAtTime(0.08, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.05);
      } else if (type === "found") {
        // Acorde arpegiado brillante y gratificante (E5, G#5, B5, E6)
        [659.25, 830.61, 987.77, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          const start = t0 + idx * 0.06;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.18, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.28);
        });
      } else if (type === "error") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(240, t0);
        osc.frequency.exponentialRampToValueAtTime(150, t0 + 0.15);
        gain.gain.setValueAtTime(0.06, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.15);
      } else if (type === "hint") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1046.5, t0);
        gain.gain.setValueAtTime(0.15, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.35);
      } else if (type === "victory") {
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          const start = t0 + idx * 0.09;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.22, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.4);
        });
      }
    } catch {}
  };

  // Cargar estado diario
  const fetchDailyStatus = async () => {
    let localUsername = localStorage.getItem("localUsername") || undefined;
    try {
      const profileData = localStorage.getItem("userProfileData");
      if (profileData) {
        const parsed = JSON.parse(profileData);
        if (parsed.username) localUsername = parsed.username;
      }
    } catch {}

    const status = await getSopitikaDailyStatus({
      localUsername,
      fallbackClerkId: user?.id,
    });
    setDailyStatus(status);
    return status;
  };

  // Iniciar partida
  const startNewGame = async (forcePractice: boolean = false) => {
    setIsLoading(true);
    setIsLocked(true);
    setIsVictoryModalOpen(false);
    setSelectionStart(null);
    setSelectionCurrent(null);
    setFoundWords([]);
    setHintsRemaining(1);
    setHintedCell(null);
    setTimeSeconds(0);
    setIsTimerActive(false);

    try {
      const status = await fetchDailyStatus();
      const playAsPractice = forcePractice || !status.canPlay;
      setIsPracticeMode(playAsPractice);

      const candidates = await getPlacesForSopitika();
      const { newGrid, placedWords } = generateWordSearch(candidates);

      setGrid(newGrid);
      setTargetWords(placedWords);
      setIsTimerActive(true);
    } catch (e) {
      console.error("Error al iniciar Sopitika:", e);
      toast.error(isEn ? "Error starting game" : "Error al iniciar el juego");
    } finally {
      setIsLoading(false);
      setIsLocked(false);
    }
  };

  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  // Cronómetro
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

  // Algoritmo de Generación de Sopa de Letras
  const generateWordSearch = (candidates: GameWordPlace[]): { newGrid: string[][]; placedWords: PlacedWord[] } => {
    const matrix: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));
    const placedList: PlacedWord[] = [];

    // Barajar candidatos
    const pool = [...candidates];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let colorIdx = 0;

    for (const item of pool) {
      if (placedList.length >= TARGET_WORDS_COUNT) break;

      const word = item.word;
      if (word.length > GRID_SIZE) continue;

      let placed = false;
      // Probar direcciones aleatorias
      const shuffledDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

      for (const [dr, dc] of shuffledDirs) {
        if (placed) break;

        // Intentar varias posiciones al azar
        const attempts = 40;
        for (let a = 0; a < attempts; a++) {
          const minR = dr < 0 ? word.length - 1 : 0;
          const maxR = dr > 0 ? GRID_SIZE - word.length : GRID_SIZE - 1;
          const minC = dc < 0 ? word.length - 1 : 0;
          const maxC = dc > 0 ? GRID_SIZE - word.length : GRID_SIZE - 1;

          if (minR > maxR || minC > maxC) continue;

          const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
          const c = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

          // Verificar si puede colocarse
          let canFit = true;
          const cells: CellCoord[] = [];

          for (let i = 0; i < word.length; i++) {
            const currR = r + i * dr;
            const currC = c + i * dc;
            const existing = matrix[currR][currC];
            if (existing !== "" && existing !== word[i]) {
              canFit = false;
              break;
            }
            cells.push({ r: currR, c: currC });
          }

          if (canFit) {
            // Escribir en la matriz
            for (let i = 0; i < word.length; i++) {
              matrix[cells[i].r][cells[i].c] = word[i];
            }

            placedList.push({
              ...item,
              color: WORD_COLORS[colorIdx % WORD_COLORS.length],
              cells,
              isFound: false,
            });

            colorIdx++;
            placed = true;
            break;
          }
        }
      }
    }

    // Rellenar espacios vacíos con letras aleatorias
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (matrix[r][c] === "") {
          matrix[r][c] = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
        }
      }
    }

    return { newGrid: matrix, placedWords: placedList };
  };

  // Cálculo de línea de selección recta
  const getSelectedCellsLine = (start: CellCoord, current: CellCoord): CellCoord[] => {
    const dr = current.r - start.r;
    const dc = current.c - start.c;

    const isHorizontal = dr === 0 && dc !== 0;
    const isVertical = dc === 0 && dr !== 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc) && dr !== 0;

    if (!isHorizontal && !isVertical && !isDiagonal) {
      return [start];
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    const line: CellCoord[] = [];
    for (let i = 0; i <= steps; i++) {
      line.push({ r: start.r + i * stepR, c: start.c + i * stepC });
    }
    return line;
  };

  // Validar selección de palabra
  const validateSelection = (line: CellCoord[]) => {
    if (line.length < 2 || isLocked) {
      setSelectionStart(null);
      setSelectionCurrent(null);
      return;
    }

    const selectedLetters = line.map((cell) => grid[cell.r][cell.c]).join("");
    const reversedLetters = selectedLetters.split("").reverse().join("");

    // Buscar si coincide con alguna palabra no encontrada
    const matched = targetWords.find(
      (tw) => !foundWords.includes(tw.word) && (tw.word === selectedLetters || tw.word === reversedLetters)
    );

    if (matched) {
      const nextFound = [...foundWords, matched.word];
      setFoundWords(nextFound);
      playSound("found");

      // Micro-confetti
      try {
        confetti({
          particleCount: 28,
          spread: 55,
          origin: { y: 0.65 },
        });
      } catch {}

      toast.success(
        isEn ? `Found: ${matched.nombre_en || matched.nombre}!` : `¡Encontraste: ${matched.nombre}!`,
        { icon: "✨", duration: 3000 }
      );

      // Si completó todas las palabras
      if (nextFound.length >= targetWords.length) {
        handleVictory();
      }
    } else {
      playSound("error");
    }

    setSelectionStart(null);
    setSelectionCurrent(null);
    setIsDragging(false);
  };

  // Manejador de Victoria
  const handleVictory = async () => {
    setIsTimerActive(false);
    setIsLocked(true);
    playSound("victory");

    try {
      confetti({
        particleCount: 90,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {}

    let localUsername = localStorage.getItem("localUsername") || undefined;
    try {
      const profileData = localStorage.getItem("userProfileData");
      if (profileData) {
        const parsed = JSON.parse(profileData);
        if (parsed.username) localUsername = parsed.username;
      }
    } catch {}

    if (!isPracticeMode) {
      try {
        const res = await awardSopitikaXP({
          timeSeconds,
          wordsCount: targetWords.length,
          localUsername,
          fallbackClerkId: user?.id,
        });
        setRewardResult(res);
        await fetchDailyStatus();
      } catch (err) {
        console.error("Error al registrar XP de Sopitika:", err);
      }
    }

    setIsVictoryModalOpen(true);
    setIsLocked(false);
  };

  // Interacción Mouse
  const handleCellMouseDown = (r: number, c: number) => {
    if (isLocked) return;
    playSound("click");
    setSelectionStart({ r, c });
    setSelectionCurrent({ r, c });
    setIsDragging(true);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isDragging && selectionStart) {
      setSelectionCurrent({ r, c });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectionStart && selectionCurrent) {
      const line = getSelectedCellsLine(selectionStart, selectionCurrent);
      validateSelection(line);
    }
    setIsDragging(false);
  };

  // Interacción Tap (Click simple: tap start, tap end)
  const handleCellClick = (r: number, c: number) => {
    if (isLocked || isDragging) return;

    if (!selectionStart) {
      playSound("click");
      setSelectionStart({ r, c });
      setSelectionCurrent({ r, c });
    } else {
      if (selectionStart.r === r && selectionStart.c === c) {
        // Mismo punto, cancelar selección
        setSelectionStart(null);
        setSelectionCurrent(null);
        return;
      }
      const line = getSelectedCellsLine(selectionStart, { r, c });
      validateSelection(line);
    }
  };

  // Interacción Táctil (Touch drag suave)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const r = elem?.getAttribute("data-row");
    const c = elem?.getAttribute("data-col");
    if (r !== null && c !== null && r !== undefined && c !== undefined) {
      const coord = { r: parseInt(r, 10), c: parseInt(c, 10) };
      playSound("click");
      setSelectionStart(coord);
      setSelectionCurrent(coord);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !selectionStart) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const r = elem?.getAttribute("data-row");
    const c = elem?.getAttribute("data-col");
    if (r !== null && c !== null && r !== undefined && c !== undefined) {
      setSelectionCurrent({ r: parseInt(r, 10), c: parseInt(c, 10) });
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && selectionStart && selectionCurrent) {
      const line = getSelectedCellsLine(selectionStart, selectionCurrent);
      validateSelection(line);
    }
    setIsDragging(false);
  };

  // Usar Pista
  const handleUseHint = () => {
    if (hintsRemaining <= 0 || isLocked) return;

    const unfound = targetWords.filter((tw) => !foundWords.includes(tw.word));
    if (unfound.length === 0) return;

    const randomWord = unfound[Math.floor(Math.random() * unfound.length)];
    const firstCell = randomWord.cells[0];

    setHintsRemaining((prev) => prev - 1);
    setHintedCell(firstCell);
    playSound("hint");

    toast.info(
      isEn
        ? `Hint: Look for "${randomWord.nombre_en || randomWord.nombre}" starting with letter "${randomWord.word[0]}"!`
        : `Pista: ¡Busca "${randomWord.nombre}" que inicia con la letra "${randomWord.word[0]}"!`,
      { icon: "💡", duration: 5000 }
    );

    // Quitar resplandor de pista después de 6 segundos
    setTimeout(() => {
      setHintedCell(null);
    }, 6000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Celdas seleccionadas actualmente
  const activeSelectionCells =
    selectionStart && selectionCurrent
      ? getSelectedCellsLine(selectionStart, selectionCurrent)
      : [];

  const isDailyLimitReached = !dailyStatus.canPlay && !isPracticeMode;

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-stone-50 via-emerald-50/20 to-stone-100 text-stone-800 pb-16 pt-3 px-3 sm:px-6 select-none"
      onMouseUp={handleMouseUp}
    >
      {/* Barra superior de navegación y controles */}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 mb-3">
        <Link
          href={`/${lang}/community`}
          className="inline-flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 text-xs sm:text-sm font-semibold transition-colors bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>{isEn ? "Community" : "Comunidad"}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Botón de Sonido */}
          <button
            onClick={toggleSound}
            aria-label={isSoundEnabled ? "Silenciar" : "Activar Sonido"}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95"
            title={isSoundEnabled ? (isEn ? "Mute Sound" : "Silenciar") : (isEn ? "Enable Sound" : "Activar Sonido")}
          >
            {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-stone-400" />}
          </button>

          {/* Botón de Reglas */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            aria-label="Ver reglas y puntuación"
            className="h-9 sm:h-10 px-3 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center gap-1.5 text-stone-700 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95 text-xs sm:text-sm font-bold"
          >
            <HelpCircle size={17} className="text-emerald-600" />
            <span className="hidden sm:inline">{isEn ? "Rules & XP" : "Reglas y XP"}</span>
          </button>

          {/* Botón Nueva Partida */}
          <button
            onClick={() => startNewGame()}
            disabled={isLoading}
            aria-label="Nueva Partida"
            className="h-9 sm:h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95 text-xs sm:text-sm font-bold disabled:opacity-50"
          >
            <RotateCcw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isEn ? "New Game" : "Nueva Sopa"}</span>
          </button>
        </div>
      </div>

      {/* Banner Principal de Sopitika */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-emerald-100 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl shadow-md ring-4 ring-emerald-50">
              🍲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-emerald-950">
                  {isEn ? "Sopitika Word Search" : "Sopitika: Sopa de Letras"}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-200">
                  Costa Rica
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {isEn 
                  ? "Find 6 hidden Costa Rican destinations on the grid!"
                  : "¡Encuentra los 6 destinos de Costa Rica ocultos en el tablero!"}
              </p>
            </div>
          </div>

          {/* Badges de Estado Diario */}
          <div className="flex items-center gap-2">
            {isPracticeMode ? (
              <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-black border border-stone-200">
                🎮 {isEn ? "Practice Mode (0 XP)" : "Modo Práctica (0 XP)"}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-black border border-amber-200 flex items-center gap-1 shadow-sm">
                  <span>🎯</span>
                  <span>
                    {dailyStatus.gamesPlayedToday === 0
                      ? (isEn ? "Daily Game 1 of 2" : "Partida 1 de 2")
                      : (isEn ? "Daily Game 2 of 2" : "Partida 2 de 2")}
                  </span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
                  ⭐ {isEn ? "Up to 50 XP" : "Hasta 50 XP"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Estadísticas en Vivo */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 text-center">
          {/* Cronómetro */}
          <div className="bg-stone-50 rounded-2xl p-2.5 sm:p-3 border border-stone-200/80">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
              <Clock size={13} className="text-stone-400" />
              <span>{isEn ? "Time" : "Tiempo"}</span>
            </div>
            <div className="text-lg sm:text-2xl font-black text-stone-800 font-mono">
              {formatTime(timeSeconds)}
            </div>
          </div>

          {/* Palabras Encontradas */}
          <div className="bg-emerald-50 rounded-2xl p-2.5 sm:p-3 border border-emerald-200/80">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
              {isEn ? "Found" : "Progreso"}
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-700">
              {foundWords.length} / {targetWords.length}
            </div>
          </div>

          {/* Botón de Pista / Lupa */}
          <button
            onClick={handleUseHint}
            disabled={hintsRemaining <= 0 || isLocked || foundWords.length >= targetWords.length}
            className={`rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col items-center justify-center ${
              hintsRemaining > 0 && foundWords.length < targetWords.length
                ? "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 active:scale-95 shadow-sm"
                : "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider mb-0.5">
              <Search size={13} />
              <span>{isEn ? "Clue" : "Pista"}</span>
            </div>
            <div className="text-xs sm:text-sm font-black">
              {hintsRemaining > 0 ? (isEn ? "1 Available" : "1 Disponible") : (isEn ? "Used" : "Agotada")}
            </div>
          </button>
        </div>
      </div>

      {/* CUERPO DEL JUEGO: Cuadrícula y Lista de Palabras */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* TABLERO DE LA SOPA DE LETRAS (11 x 11) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="bg-white rounded-3xl p-2 sm:p-4 shadow-xl border-2 border-emerald-100 w-full max-w-[440px] sm:max-w-[480px]">
            
            {/* Contenedor de la Cuadrícula */}
            <div
              ref={gridContainerRef}
              className="grid grid-cols-11 gap-1 sm:gap-1.5 touch-none select-none p-1.5 sm:p-2 bg-stone-100/70 rounded-2xl border border-stone-200/80 shadow-inner"
              style={{ touchAction: "none" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {grid.map((row, rIdx) =>
                row.map((letter, cIdx) => {
                  // Verificar si esta celda pertenece a alguna palabra encontrada
                  const matchedWord = targetWords.find(
                    (tw) =>
                      foundWords.includes(tw.word) &&
                      tw.cells.some((cell) => cell.r === rIdx && cell.c === cIdx)
                  );

                  // Verificar si está en la línea de selección activa
                  const isSelected = activeSelectionCells.some(
                    (cell) => cell.r === rIdx && cell.c === cIdx
                  );

                  // Verificar si es la celda de inicio de selección
                  const isStart =
                    selectionStart &&
                    selectionStart.r === rIdx &&
                    selectionStart.c === cIdx;

                  // Verificar si es la celda con pista activa
                  const isHinted =
                    hintedCell &&
                    hintedCell.r === rIdx &&
                    hintedCell.c === cIdx;

                  let cellStyle = "bg-white text-stone-700 hover:bg-emerald-50 border-stone-200 shadow-sm";

                  if (matchedWord) {
                    cellStyle = `${matchedWord.color.bg} ${matchedWord.color.text} ${matchedWord.color.border} font-black shadow-md`;
                  } else if (isSelected) {
                    cellStyle = "bg-emerald-400 text-white font-black scale-105 border-emerald-500 shadow-md ring-2 ring-emerald-300";
                  } else if (isStart) {
                    cellStyle = "bg-emerald-200 text-emerald-950 font-black ring-2 ring-emerald-400";
                  } else if (isHinted) {
                    cellStyle = "bg-amber-300 text-amber-950 font-black animate-bounce ring-4 ring-amber-400 shadow-lg";
                  }

                  return (
                    <div
                      key={`cell-${rIdx}-${cIdx}`}
                      data-row={rIdx}
                      data-col={cIdx}
                      onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                      onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className={`aspect-square flex items-center justify-center rounded-xl text-sm sm:text-base md:text-lg font-black transition-all cursor-pointer border ${cellStyle}`}
                    >
                      {letter}
                    </div>
                  );
                })
              )}
            </div>

            {/* Ayuda de control móvil / desktop */}
            <div className="mt-2.5 text-center text-[11px] text-stone-500 font-medium">
              <span>📱 {isEn ? "Drag over letters or tap start & end" : "Arrastra el dedo o toca la primera y última letra"}</span>
            </div>
          </div>
        </div>

        {/* LISTA DE PALABRAS POR ENCONTRAR */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-stone-200 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <h2 className="font-black text-sm uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <span>📍</span>
                <span>{isEn ? "Destinations to Find" : "Lugares a Descubrir"}</span>
              </h2>
              <span className="text-xs font-black text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                {foundWords.length}/{targetWords.length}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 flex-1">
              {targetWords.map((item) => {
                const isFound = foundWords.includes(item.word);

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      isFound
                        ? `${item.color.badge} line-through shadow-sm scale-98 opacity-90`
                        : "bg-stone-50 hover:bg-stone-100/80 border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isFound ? item.color.dot : "bg-stone-300"}`} />
                      <div className="truncate">
                        <div className="font-black text-xs sm:text-sm tracking-wide text-stone-800 truncate">
                          {isEn ? item.nombre_en : item.nombre}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-emerald-800 flex items-center gap-1.5 truncate">
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] sm:text-[11px] font-black ${isFound ? "bg-white/80 border-emerald-300 text-emerald-900" : "bg-white border-stone-200 text-stone-700"}`}>
                            {item.word}
                          </span>
                          <span className="text-[10px] text-stone-500 font-sans font-medium truncate flex items-center gap-0.5">
                            <MapPin size={9} className="shrink-0" />
                            {item.ubicacion}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isFound ? (
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] font-bold text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-200 shrink-0">
                        {item.word.length} ltrs
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Consejo al pie */}
            <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500 leading-snug">
              💡 {isEn 
                ? "Words can be placed horizontally, vertically, or diagonally."
                : "Las palabras pueden estar horizontales, verticales o en diagonal."}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE REGLAS Y PUNTUACIÓN */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-emerald-100 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950 mb-3 flex items-center gap-2">
              <span>🍲</span>
              <span>{isEn ? "Sopitika Rules & XP" : "Reglas y Puntuación de Sopitika"}</span>
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-stone-600">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-950">
                <p className="font-bold mb-1">⏱️ {isEn ? "DAILY LIMIT NOTICE" : "AVISO DE LÍMITE DIARIO"}</p>
                <p className="leading-relaxed">
                  {isEn
                    ? "You can play up to 2 rated games per day, earning up to 100 XP daily (up to 50 XP per game). Afterwards, you can continue playing in Practice Mode!"
                    : "Puedes jugar hasta 2 partidas puntuadas al día, ganando hasta 100 XP diarios (hasta 50 XP por partida rápida). ¡Luego podrás seguir jugando en Modo Práctica!"}
                </p>
              </div>

              <p>
                {isEn
                  ? "Find the 6 hidden Costa Rican destinations on the 11x11 grid. Words can go in any direction (horizontal, vertical, or diagonal)."
                  : "Encuentra los 6 destinos de Costa Rica ocultos en el tablero 11x11. Las palabras pueden estar en cualquier dirección (horizontal, vertical o diagonal)."}
              </p>

              {/* Tabla de puntuación */}
              <div className="rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                <div className="bg-amber-50/80 px-4 py-2.5 flex items-center justify-between font-bold text-amber-900">
                  <span>🏆 {isEn ? "Under 90s (Elite Speed)" : "Menos de 90s (Velocidad Élite)"}</span>
                  <span className="text-sm font-black text-amber-600 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                    50 XPs ⭐⭐⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{isEn ? "91s - 150s (Fast)" : "91s - 150s (Rápido)"}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    40 XPs ⭐⭐⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{isEn ? "151s - 240s (Good Explorer)" : "151s - 240s (Buen Explorador)"}</span>
                  <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                    30 XPs ⭐⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{isEn ? "241s - 360s (Completed)" : "241s - 360s (Tablero Resuelto)"}</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    20 XPs ⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between text-stone-500">
                  <span>{isEn ? "360s+ (Mental Workout)" : "Más de 360s (Entrenamiento Mental)"}</span>
                  <span className="font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                    10 XPs
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsRulesModalOpen(false)}
              className="w-full mt-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isEn ? "Got it! Let's play" : "¡Entendido, a buscar!"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE VICTORIA Y RECOMPENSA */}
      {isVictoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-emerald-100 text-center relative overflow-hidden max-h-[92vh] overflow-y-auto">
            
            {/* Ícono de Trofeo */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center mx-auto mb-3 shadow-xl ring-4 ring-amber-100 animate-bounce">
              <Trophy size={40} className="drop-shadow-sm text-amber-900" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-1">
              {timeSeconds <= 90
                ? (isEn ? "HAWK EYE EXPLORER! 🦅" : "¡VISTA DE ÁGUILA! 🦅")
                : timeSeconds <= 150
                ? (isEn ? "OUTSTANDING SPEED! ⚡" : "¡GRAN VELOCIDAD! ⚡")
                : (isEn ? "BOARD SOLVED! 👏" : "¡TABLERO RESUELTO! 👏")}
            </h2>

            <p className="text-stone-600 text-xs sm:text-sm mb-4">
              {isEn
                ? `You discovered all 6 Costa Rican destinations in ${formatTime(timeSeconds)}!`
                : `¡Descubriste los 6 destinos de Costa Rica en ${formatTime(timeSeconds)}!`}
            </p>

            {/* Caja de Recompensa de XP */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg mb-4 text-center">
              <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-100 mb-1">
                {isPracticeMode ? (isEn ? "Practice Mode" : "Modo Práctica") : (isEn ? "XP Awarded" : "XPs Ganados")}
              </div>
              <div className="text-4xl font-black flex items-center justify-center gap-2 drop-shadow-md">
                <span>+{isPracticeMode ? 0 : (rewardResult?.xpAwarded ?? 50)} XP</span>
                <Sparkles size={28} className="text-yellow-300" />
              </div>

              {!isPracticeMode && rewardResult && (
                <div className="mt-2 text-xs border-t border-emerald-400/40 pt-2 flex items-center justify-between opacity-95">
                  <span>{isEn ? "Daily XP:" : "XP Diario:"} <strong>{rewardResult.todayEarnedXp}/100</strong></span>
                  <span>{isEn ? "Total XP:" : "Total XP:"} <strong>{rewardResult.newTotalXp}</strong></span>
                </div>
              )}
            </div>

            {/* SECCIÓN DE CONVERSIÓN: Destinos Descubiertos */}
            <div className="mb-5 text-left">
              <h3 className="font-black text-xs uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <span>🌴</span>
                <span>{isEn ? "Destinations you found today:" : "Destinos que encontraste hoy:"}</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {targetWords.map((tw) => (
                  <Link
                    key={tw.id}
                    href={`/${lang}/destinos/${tw.id}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-all flex items-center gap-2 group text-left"
                  >
                    {tw.imagenUrl ? (
                      <img src={tw.imagenUrl} alt={tw.nombre} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-black shrink-0">
                        🇨🇷
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-stone-800 group-hover:text-emerald-700 truncate">
                        {isEn ? tw.nombre_en : tw.nombre}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                        <MapPin size={9} />
                        <span>{tw.ubicacion}</span>
                      </div>
                    </div>
                    <ExternalLink size={12} className="text-stone-400 group-hover:text-emerald-600 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col gap-2">
              {dailyStatus.gamesRemaining > 0 && !isPracticeMode ? (
                <button
                  onClick={() => startNewGame(false)}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  <span>{isEn ? "Play My 2nd Daily Game!" : "¡Jugar mi 2da partida de hoy!"}</span>
                </button>
              ) : (
                <button
                  onClick={() => startNewGame(true)}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  <span>{isEn ? "Play Practice Mode (0 XP)" : "Seguir Jugando en Modo Práctica"}</span>
                </button>
              )}

              <Link
                href={`/${lang}/community`}
                className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
              >
                {isEn ? "Back to Community" : "Volver a la Comunidad"}
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
