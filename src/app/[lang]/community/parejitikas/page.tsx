"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { 
  Trophy, 
  RotateCcw, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  Flame, 
  Star, 
  CheckCircle2, 
  X,
  AlertCircle,
  Calendar,
  Compass,
  Play
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  getPostcardsForGame, 
  awardParejitikasXP, 
  getParejitikasDailyStatus,
  GamePostcard, 
  AwardXPResult,
  DailyParejitikasStatus
} from "../../../../actions/parejitikas";
import { useProgress } from "../../../../context/ProgressContext";
import { useUser } from "@clerk/nextjs";
import { initMobileAudioUnlock, unlockAudio, playSynthesizedSound, playHtmlAudioClick } from "../../../../lib/soundUtils";

const MAX_DAILY_GAMES = 2;
const MAX_DAILY_XP = 100;

interface PlayingCard {
  instanceId: string;
  placeId: string;
  nombre: string;
  nombre_en: string;
  categoria: string;
  ubicacion: string;
  imagenUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function ParejitikasPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = use(params);
  const lang = unwrappedParams.lang;
  const isEn = lang === 'en';

  const { user } = useUser();
  const { xp, level, updateLocalXp } = useProgress();

  // Estados del juego
  const [cards, setCards] = useState<PlayingCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [shakeCards, setShakeCards] = useState<string[]>([]);

  // Estado de Cuota Diaria (Máx 2 partidas / 100 XP por día)
  const [dailyStatus, setDailyStatus] = useState<DailyParejitikasStatus>({
    gamesPlayedToday: 0,
    gamesRemaining: MAX_DAILY_GAMES,
    todayEarnedXp: 0,
    maxDailyGames: MAX_DAILY_GAMES,
    maxDailyXp: MAX_DAILY_XP,
    canPlay: true,
  });
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Cronómetro
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio & Modales
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [rewardResult, setRewardResult] = useState<AwardXPResult | null>(null);
  const [isAwarding, setIsAwarding] = useState(false);

  // Récords
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const getStoredUsername = () => {
    if (typeof window === "undefined") return undefined;
    let localUsername = localStorage.getItem("localUsername") || undefined;
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.username) localUsername = parsed.username;
      } catch (e) {}
    }
    return localUsername;
  };

  // Cargar estado diario del usuario
  const loadDailyStatus = async () => {
    try {
      const status = await getParejitikasDailyStatus({
        localUsername: getStoredUsername(),
        fallbackClerkId: user?.id,
      });
      setDailyStatus(status);
      return status;
    } catch (e) {
      console.warn("Error cargando estado diario de Parejitikas", e);
      return null;
    }
  };

  // Cargar preferencias iniciales y récords, y desbloquear audio en móvil
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("parejitikas_sound");
      if (savedSound !== null) {
        setIsSoundEnabled(savedSound === "true");
      }
      const savedBestMoves = localStorage.getItem("parejitikas_best_moves");
      if (savedBestMoves) setBestMoves(parseInt(savedBestMoves, 10));
      const savedBestTime = localStorage.getItem("parejitikas_best_time");
      if (savedBestTime) setBestTime(parseInt(savedBestTime, 10));
    }
    const cleanup = initMobileAudioUnlock();
    return cleanup;
  }, []);

  // Inicializar o reiniciar partida
  const startNewGame = async (forcePractice = false) => {
    setIsLoading(true);
    setIsLocked(true);
    setIsTimerActive(false);
    setTimeSeconds(0);
    setMoves(0);
    setMatchedPairs(0);
    setSelectedCards([]);
    setShakeCards([]);
    setIsVictoryModalOpen(false);
    setRewardResult(null);
    setIsNewRecord(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Verificar cuota diaria
    const currentStatus = await loadDailyStatus();
    const canPlayOfficial = currentStatus ? currentStatus.canPlay : true;

    if (!canPlayOfficial && !forcePractice && !isPracticeMode) {
      setIsLoading(false);
      setIsLocked(false);
      return;
    }

    if (forcePractice) {
      setIsPracticeMode(true);
    }

    try {
      const fetchedPlaces = await getPostcardsForGame();
      if (!fetchedPlaces || fetchedPlaces.length < 10) {
        toast.error(isEn ? "Could not load postcards" : "No se pudieron cargar las postales");
        setIsLoading(false);
        setIsLocked(false);
        return;
      }

      // Duplicar cada una para formar 10 pares (20 cartas en total)
      const deck: PlayingCard[] = [];
      fetchedPlaces.forEach((place, index) => {
        deck.push({
          instanceId: `card-${place.id}-a-${index}`,
          placeId: place.id,
          nombre: place.nombre,
          nombre_en: place.nombre_en || place.nombre,
          categoria: place.categoria,
          ubicacion: place.ubicacion,
          imagenUrl: place.imagenUrl,
          isFlipped: false,
          isMatched: false,
        });
        deck.push({
          instanceId: `card-${place.id}-b-${index}`,
          placeId: place.id,
          nombre: place.nombre,
          nombre_en: place.nombre_en || place.nombre,
          categoria: place.categoria,
          ubicacion: place.ubicacion,
          imagenUrl: place.imagenUrl,
          isFlipped: false,
          isMatched: false,
        });
      });

      // Barajar aleatoriamente con Fisher-Yates
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      setCards(deck);
    } catch (e) {
      console.error(e);
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

  // Control del cronómetro
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

  // Audio sintetizado con Web Audio API
  const playSound = (type: 'flip' | 'match' | 'mismatch' | 'victory') => {
    playSynthesizedSound(isSoundEnabled, (ctx, t0) => {
      if (type === 'flip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, t0);
        osc.frequency.exponentialRampToValueAtTime(660, t0 + 0.09);
        gain.gain.setValueAtTime(0.35, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.09);
      } else if (type === 'match') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = t0 + idx * 0.07;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.42, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.32);
        });
      } else if (type === 'mismatch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t0);
        osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.18);
        gain.gain.setValueAtTime(0.35, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.18);
      } else if (type === 'victory') {
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const start = t0 + idx * 0.1;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.48, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.45);
        });
      }
    });
  };

  const toggleSound = () => {
    const nextVal = !isSoundEnabled;
    setIsSoundEnabled(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("parejitikas_sound", String(nextVal));
    }
    if (nextVal) {
      unlockAudio();
      playHtmlAudioClick();
      playSound('flip');
      toast.success(isEn ? "Sound ON 🔊" : "Sonido activado 🔊", {
        description: isEn 
          ? "Check that your device media volume is up" 
          : "Verifica que el volumen multimedia de tu teléfono esté arriba",
        duration: 2500,
      });
    } else {
      toast.info(isEn ? "Sound OFF 🔇" : "Sonido desactivado 🔇", { duration: 1500 });
    }
  };

  // Manejo de clic en una carta
  const handleCardClick = (index: number) => {
    if (isLocked || isLoading) return;
    const card = cards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    // Iniciar cronómetro en el primer movimiento
    if (!isTimerActive && moves === 0 && selectedCards.length === 0) {
      setIsTimerActive(true);
    }

    playSound('flip');

    // Voltear carta
    const nextCards = [...cards];
    nextCards[index] = { ...card, isFlipped: true };
    setCards(nextCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsLocked(true);
      const newMoves = moves + 1;
      setMoves(newMoves);

      const [firstIdx, secondIdx] = newSelected;
      const firstCard = nextCards[firstIdx];
      const secondCard = nextCards[secondIdx];

      if (firstCard.placeId === secondCard.placeId) {
        // Coincidencia
        playSound('match');
        setTimeout(() => {
          setCards(prev => prev.map((c, idx) => {
            if (idx === firstIdx || idx === secondIdx) {
              return { ...c, isMatched: true };
            }
            return c;
          }));
          setSelectedCards([]);
          setIsLocked(false);

          const updatedMatches = matchedPairs + 1;
          setMatchedPairs(updatedMatches);

          if (updatedMatches === 10) {
            handleGameWin(newMoves);
          }
        }, 350);
      } else {
        // No coinciden
        playSound('mismatch');
        setShakeCards([firstCard.instanceId, secondCard.instanceId]);

        setTimeout(() => {
          setCards(prev => prev.map((c, idx) => {
            if (idx === firstIdx || idx === secondIdx) {
              return { ...c, isFlipped: false };
            }
            return c;
          }));
          setSelectedCards([]);
          setShakeCards([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  // Manejo de victoria
  const handleGameWin = async (finalMoves: number) => {
    setIsTimerActive(false);
    playSound('victory');

    // Confeti
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#06b6d4', '#6366f1', '#ec4899']
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 300);
    } catch (e) {}

    // Evaluar nuevo récord
    let isRecord = false;
    if (bestMoves === null || finalMoves < bestMoves) {
      setBestMoves(finalMoves);
      localStorage.setItem("parejitikas_best_moves", String(finalMoves));
      isRecord = true;
    }
    if (bestTime === null || timeSeconds < bestTime) {
      setBestTime(timeSeconds);
      localStorage.setItem("parejitikas_best_time", String(timeSeconds));
      isRecord = true;
    }
    setIsNewRecord(isRecord);

    setIsVictoryModalOpen(true);
    setIsAwarding(true);

    // Otorgar XPs solo si no está en modo práctica
    if (!isPracticeMode) {
      try {
        const res = await awardParejitikasXP({
          moves: finalMoves,
          timeSeconds,
          localUsername: getStoredUsername(),
          fallbackClerkId: user?.id,
        });

        setRewardResult(res);

        if (res.success && res.xpAwarded > 0 && res.newTotalXp !== undefined && res.newLevel !== undefined) {
          if (updateLocalXp) {
            updateLocalXp(res.newTotalXp, res.newLevel);
          }
          toast.success(
            isEn 
              ? `+${res.xpAwarded} XP earned in Parejitikas!` 
              : `¡+${res.xpAwarded} XP ganados en Parejitikas!`, 
            { icon: '⭐' }
          );
        }

        // Refrescar estado diario
        await loadDailyStatus();
      } catch (error) {
        console.error("Error al procesar XPs:", error);
      } finally {
        setIsAwarding(false);
      }
    } else {
      setIsAwarding(false);
    }
  };

  // Cálculo visual de recompensa actual
  const getPotBadge = (m: number) => {
    if (isPracticeMode) {
      return { xp: 0, label: isEn ? "Practice Mode (0 XP)" : "Modo Práctica (0 XP)", stars: 0, color: "text-stone-500 bg-stone-100 border-stone-200" };
    }
    if (m === 0) {
      return { xp: 50, label: isEn ? "Up to 50 XP" : "Hasta 50 XP", stars: 3, color: "text-amber-600 bg-amber-50 border-amber-200" };
    }
    if (m <= 14) {
      return { xp: 50, label: isEn ? "50 XP (Master ⭐⭐⭐)" : "50 XP (¡Excelente! ⭐⭐⭐)", stars: 3, color: "text-amber-600 bg-amber-50 border-amber-300 ring-2 ring-amber-400" };
    }
    if (m <= 18) {
      return { xp: 40, label: isEn ? "40 XP (Great ⭐⭐⭐)" : "40 XP (Genial ⭐⭐⭐)", stars: 3, color: "text-emerald-700 bg-emerald-50 border-emerald-300" };
    }
    if (m <= 24) {
      return { xp: 30, label: isEn ? "30 XP (Very Good ⭐⭐)" : "30 XP (Muy Bien ⭐⭐)", stars: 2, color: "text-sky-700 bg-sky-50 border-sky-300" };
    }
    if (m <= 30) {
      return { xp: 20, label: isEn ? "20 XP (Good ⭐)" : "20 XP (Bien ⭐)", stars: 2, color: "text-teal-700 bg-teal-50 border-teal-300" };
    }
    if (m <= 36) {
      return { xp: 10, label: isEn ? "10 XP (Completed)" : "10 XP (Completado)", stars: 1, color: "text-stone-700 bg-stone-50 border-stone-300" };
    }
    return { xp: 5, label: isEn ? "5 XP (Keep Practicing)" : "5 XP (Buen Esfuerzo)", stars: 1, color: "text-stone-600 bg-stone-100 border-stone-200" };
  };

  const currentPot = getPotBadge(moves);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isDailyLimitReached = !dailyStatus.canPlay && !isPracticeMode;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-emerald-50/20 to-stone-100 text-stone-800 pb-16 pt-3 px-3 sm:px-6 select-none">
      
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
            aria-label={isSoundEnabled ? "Silenciar sonido" : "Activar sonido"}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95"
            title={isSoundEnabled ? (isEn ? "Mute Sound" : "Silenciar") : (isEn ? "Enable Sound" : "Activar Sonido")}
          >
            {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-stone-400" />}
          </button>

          {/* Botón de Reglas / Tabla de XPs */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            aria-label="Ver reglas y tabla de XPs"
            className="h-9 sm:h-10 px-3 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center gap-1.5 text-stone-700 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95 text-xs sm:text-sm font-bold"
          >
            <HelpCircle size={17} className="text-emerald-600" />
            <span className="hidden sm:inline">{isEn ? "Rules & XP" : "Reglas y XPs"}</span>
          </button>

          {/* Botón Reiniciar / Nueva Partida */}
          <button
            onClick={() => startNewGame()}
            disabled={isLoading}
            aria-label="Reiniciar juego"
            className="h-9 sm:h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95 text-xs sm:text-sm font-bold disabled:opacity-50"
          >
            <RotateCcw size={16} className={isLoading ? "animate-spin" : ""} />
            <span>{isEn ? "New Game" : "Reiniciar"}</span>
          </button>
        </div>
      </div>

      {/* BANNER DE ADVERTENCIA Y CUOTA DIARIA (2 PARTIDAS / 100 XP MÁX) */}
      <div className="max-w-4xl mx-auto mb-4">
        {dailyStatus.gamesRemaining === 2 ? (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300/80 rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">
                    {isEn ? "Daily Game 1 of 2" : "Partida 1 de 2 de hoy"}
                  </span>
                  <span className="bg-emerald-200/80 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {isEn ? "2 of 2 Available" : "2 de 2 Disponibles"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-800">
                  {isEn
                    ? "You can play maximum 2 times per day. Earn up to 100 daily XPs (50 XP per game)!"
                    : "Únicamente puedes jugar 2 veces al día. ¡Gana hasta 100 XPs diarios (50 XP por partida)!"}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-emerald-900 bg-white/80 px-2.5 py-1 rounded-xl border border-emerald-200">
                ⭐ {isEn ? "Max 100 XPs/day" : "Máx 100 XPs/día"}
              </span>
            </div>
          </div>
        ) : dailyStatus.gamesRemaining === 1 ? (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-amber-950">
                    {isEn ? "Daily Game 2 of 2 (LAST GAME TODAY)" : "Partida 2 de 2 (¡ÚLTIMA PARTIDA DE HOY!)"}
                  </span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {isEn ? "1 Game Left" : "1 Partida Restante"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-amber-900 font-medium">
                  {isEn
                    ? `You've earned ${dailyStatus.todayEarnedXp}/100 XPs today. This is your final game to claim remaining XPs!`
                    : `Has ganado ${dailyStatus.todayEarnedXp}/100 XPs hoy. ¡Es tu última oportunidad del día para sumar XPs!`}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-amber-900 bg-white/90 px-2.5 py-1 rounded-xl border border-amber-300">
                🎯 {isEn ? "Last Chance Today" : "Última de hoy"}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-stone-100 to-rose-50 border-2 border-rose-200 rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-stone-900">
                    {isEn ? "Daily Limit Reached (2 of 2 Games Played)" : "Límite Diario Alcanzado (2 de 2 Partidas Jugadas)"}
                  </span>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {isEn ? "0 Left Today" : "0 Disponibles Hoy"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-600">
                  {isEn
                    ? `You reached your 2 daily games and accumulated ${dailyStatus.todayEarnedXp}/100 XPs. Come back tomorrow at midnight!`
                    : `Completaste tus 2 partidas diarias con ${dailyStatus.todayEarnedXp}/100 XPs acumulados. ¡Se reinicia a medianoche!`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isPracticeMode && (
                <button
                  onClick={() => startNewGame(true)}
                  className="text-xs font-bold bg-white text-stone-700 hover:text-emerald-700 px-3 py-1 rounded-xl border border-stone-300 shadow-sm transition-all"
                >
                  {isEn ? "Play for Fun (0 XP)" : "Modo Práctica (0 XP)"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cabecera del Juego */}
      <div className="max-w-4xl mx-auto text-center mb-3 sm:mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs sm:text-sm font-bold mb-1 shadow-inner border border-emerald-200">
          <Sparkles size={14} className="text-emerald-600" />
          <span>{isEn ? "Postal Match Challenge" : "Encuentra las Parejas de Postales"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-950 tracking-tight drop-shadow-sm flex items-center justify-center gap-2">
          <span>Parejitikas</span>
          <span className="text-2xl sm:text-3xl">🧩</span>
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-lg mx-auto mt-1">
          {isEn
            ? "Flip Costa Rica's postcards to match pairs. Max 2 games per day • Earn up to 100 XPs daily!"
            : "Descubre las parejas de postales. Máximo 2 partidas al día • ¡Gana hasta 100 XPs diarios!"}
        </p>
      </div>

      {/* Tablero HUD de Estadísticas */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        
        {/* Jugadas */}
        <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">
              {isEn ? "Moves" : "Jugadas"}
            </div>
            <div className="text-xl sm:text-2xl font-black text-stone-800">
              {moves}
            </div>
          </div>
        </div>

        {/* Parejas encontradas */}
        <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">
              {isEn ? "Pairs" : "Parejas"}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {matchedPairs} <span className="text-sm font-semibold text-stone-400">/ 10</span>
            </div>
          </div>
        </div>

        {/* Cronómetro */}
        <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">
              {isEn ? "Time" : "Tiempo"}
            </div>
            <div className="text-xl sm:text-2xl font-black text-stone-800 font-mono">
              {formatTime(timeSeconds)}
            </div>
          </div>
        </div>

        {/* Recompensa XP actual */}
        <div className={`rounded-2xl p-3 border shadow-sm flex items-center gap-2.5 transition-colors ${currentPot.color}`}>
          <div className="w-10 h-10 rounded-xl bg-white/80 shadow-inner flex items-center justify-center font-bold shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-bold truncate">
              {isPracticeMode ? (isEn ? "Mode" : "Modo") : (isEn ? "XP Reward" : "XP en Juego")}
            </div>
            <div className="text-sm sm:text-base font-black truncate">
              {currentPot.label}
            </div>
          </div>
        </div>

      </div>

      {/* Récord Personal Banner */}
      {bestMoves !== null && (
        <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between bg-stone-50/80 border border-stone-200/60 px-3.5 py-1.5 rounded-xl text-xs text-stone-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Trophy size={14} className="text-amber-500" />
            <span>{isEn ? "Personal Best:" : "Tu Récord:"} <strong>{bestMoves} {isEn ? "moves" : "jugadas"}</strong> {bestTime ? `(${formatTime(bestTime)})` : ""}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">
            {isEn ? "Can you beat it in 10?" : "¿Puedes lograrlo en 10?"}
          </span>
        </div>
      )}

      {/* ÁREA PRINCIPAL: TABLERO O PANTALLA DE LÍMITE DIARIO ALCANZADO */}
      <main className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-stone-600 text-sm font-semibold animate-pulse">
              {isEn ? "Mixing Costa Rican postcards..." : "Barajando postales de Costa Rica..."}
            </p>
          </div>
        ) : isDailyLimitReached ? (
          /* Pantalla dedicada de Límite Diario Alcanzado (2 de 2 completadas) */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-100 shadow-xl text-center max-w-xl mx-auto my-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-amber-100">
              <Calendar size={38} className="drop-shadow-sm text-amber-900" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-2">
              {isEn ? "Daily Limit Reached (2/2 Games)" : "¡Completaste tus 2 Partidas de Hoy!"}
            </h2>

            <p className="text-stone-600 text-xs sm:text-sm mb-6 leading-relaxed max-w-md mx-auto">
              {isEn
                ? "Parejitikas allows a maximum of 2 games per day to maintain fair competition and daily brain training. You can earn up to 100 XPs daily (up to 50 XP per game)."
                : "Parejitikas permite únicamente 2 partidas al día para cuidar el balance en los rankings y entrenar tu memoria diariamente. Puedes ganar hasta un máximo de 100 XPs diarios (hasta 50 XP por partida)."}
            </p>

            {/* Resumen del día */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  {isEn ? "Games Today" : "Partidas Jugadas"}
                </div>
                <div className="text-2xl font-black text-stone-800">
                  2 / 2 🎯
                </div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  {isEn ? "XP Earned Today" : "XPs Ganados Hoy"}
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {dailyStatus.todayEarnedXp} / 100 ⭐
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-amber-900 text-xs font-semibold mb-6 flex items-center justify-center gap-2">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <span>{isEn ? "Resets at midnight (Costa Rica Time, UTC-6)" : "Próximo reinicio: Medianoche (00:00 hora de Costa Rica)"}</span>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => startNewGame(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={16} />
                <span>{isEn ? "Practice Mode (0 XP)" : "Jugar Modo Práctica (0 XP)"}</span>
              </button>

              <Link
                href={`/${lang}/community/playa`}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🏖️</span>
                <span>{isEn ? "Go to Tiko Beach (Beta)" : "Ir a Tiko Playa (Beta)"}</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Cuadrícula de Cartas (5x4 en PC / 4x5 en móvil) */
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3.5 md:gap-4">
            {cards.map((card, idx) => {
              const isFlipped = card.isFlipped || card.isMatched;
              const isShaking = shakeCards.includes(card.instanceId);

              return (
                <div
                  key={card.instanceId}
                  onClick={() => handleCardClick(idx)}
                  className={`group relative aspect-[2/3] rounded-xl sm:rounded-2xl cursor-pointer select-none transition-transform duration-200 ${
                    card.isMatched
                      ? "cursor-default"
                      : "hover:-translate-y-1 active:scale-95"
                  } ${isShaking ? "animate-bounce" : ""}`}
                  style={{ perspective: "1000px" }}
                >
                  {/* Contenedor con efecto Flip 3D */}
                  <div
                    className="w-full h-full relative rounded-xl sm:rounded-2xl transition-transform duration-500 shadow-md group-hover:shadow-xl"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    
                    {/* CARA TRASERA: Reverso Oficial Parejitikas (Perezoso Colectikos) */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#0c3722] border-2 border-emerald-900/60 shadow-md"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <Image
                        src="/images/parejitikas-back.jpg"
                        alt="Reverso Parejitikas"
                        fill
                        sizes="(max-width: 640px) 25vw, 20vw"
                        className="object-cover object-center transform transition-transform duration-300 group-hover:scale-105"
                        priority={idx < 10}
                      />
                      {/* Resplandor sutil al hacer hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* CARA DELANTERA: Fotografía de la Postal de Costa Rica */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-white p-1 sm:p-1.5 flex flex-col border-2 transition-all ${
                        card.isMatched
                          ? "border-amber-400 ring-2 sm:ring-4 ring-amber-400/60 shadow-lg"
                          : "border-stone-200"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {/* Imagen de la postal */}
                      <div className="relative w-full h-full rounded-lg sm:rounded-xl overflow-hidden bg-stone-100">
                        {card.imagenUrl ? (
                          <img
                            src={card.imagenUrl}
                            alt={isEn ? card.nombre_en : card.nombre}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-xs">
                            {card.nombre}
                          </div>
                        )}

                        {/* Franja semitransparente con el nombre */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-1.5 sm:p-2 text-white">
                          <p className="text-[10px] sm:text-xs font-black truncate leading-tight drop-shadow-sm">
                            {isEn ? card.nombre_en : card.nombre}
                          </p>
                          <p className="text-[8px] sm:text-[9px] text-amber-300 font-bold truncate opacity-90">
                            {card.ubicacion || card.categoria}
                          </p>
                        </div>

                        {/* Badge de Pareja completada */}
                        {card.isMatched && (
                          <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-md animate-scaleIn">
                            <CheckCircle2 size={14} className="stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE REGLAS Y TABLA DE XPS */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRulesModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 leading-tight">
                  {isEn ? "Scoring & Daily Limits" : "Reglas y Límite Diario"}
                </h2>
                <p className="text-xs text-stone-500">
                  {isEn ? "Max 2 games per day • Up to 100 daily XPs" : "Máximo 2 partidas al día • Hasta 100 XPs diarios"}
                </p>
              </div>
            </div>

            {/* Aviso Destacado de Límite de 2 Partidas */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 mb-4 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-black text-amber-900 mb-1">
                <span>⏱️</span>
                <span>{isEn ? "DAILY LIMIT NOTICE" : "AVISO DE LÍMITE DIARIO"}</span>
              </div>
              <p className="leading-relaxed">
                {isEn
                  ? "You can only play a maximum of 2 times per day, earning up to 100 XPs daily (up to 50 XPs per game). Make every move count!"
                  : "Únicamente puedes jugar un máximo de 2 veces por día, ganando un máximo de 100 XPs diarios con este juego (hasta 50 XPs por partida). ¡Haz que cada jugada cuente!"}
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-600">
              <p>
                {isEn
                  ? "The board contains 20 face-down cards forming 10 pairs of Costa Rican destinations. Reveal all pairs in the fewest moves:"
                  : "El tablero tiene 20 postales que forman 10 parejas de lugares de Costa Rica. Encuéntralas en el menor número de jugadas:"}
              </p>

              {/* Tabla de puntajes */}
              <div className="rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                
                <div className="bg-amber-50/80 px-4 py-2.5 flex items-center justify-between font-bold text-amber-900">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span>{isEn ? "≤ 14 Moves (Elite Memory)" : "Hasta 14 Jugadas (Memoria Élite)"}</span>
                  </div>
                  <span className="text-sm font-black text-amber-600 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                    50 XPs ⭐⭐⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{isEn ? "15 - 18 Moves" : "15 - 18 Jugadas"}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    40 XPs ⭐⭐⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{isEn ? "19 - 24 Moves" : "19 - 24 Jugadas"}</span>
                  <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                    30 XPs ⭐⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{isEn ? "25 - 30 Moves" : "25 - 30 Jugadas"}</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    20 XPs ⭐
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-700">{isEn ? "31 - 36 Moves" : "31 - 36 Jugadas"}</span>
                  <span className="font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                    10 XPs
                  </span>
                </div>

                <div className="px-4 py-2 flex items-center justify-between text-stone-500">
                  <span>{isEn ? "37+ Moves" : "37+ Jugadas"}</span>
                  <span className="font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                    5 XPs
                  </span>
                </div>

              </div>

              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200/60 text-emerald-900 text-xs">
                <p className="font-bold mb-1">💡 {isEn ? "Pro Tip:" : "Consejo de Explorador:"}</p>
                <p>
                  {isEn
                    ? "Concentrate on the edges first. The 2 daily games reset every midnight (UTC-6 Costa Rica time)."
                    : "Concéntrate en recordar las esquinas primero. Las 2 partidas se renuevan todas las noches a las 00:00 (hora de Costa Rica)."}
                </p>
              </div>

            </div>

            <button
              onClick={() => setIsRulesModalOpen(false)}
              className="w-full mt-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isEn ? "Got it! Let's play" : "¡Entendido, a jugar!"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE VICTORIA Y RECOMPENSA DE XPS */}
      {isVictoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-emerald-100 text-center relative overflow-hidden">
            
            {/* Fondo de resplandor celebratorio */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-100 via-emerald-50/50 to-transparent pointer-events-none" />

            <div className="relative z-10">
              
              {/* Ícono de trofeo */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center mx-auto mb-3 shadow-xl ring-4 ring-amber-100 animate-bounce">
                <Trophy size={40} className="drop-shadow-sm" />
              </div>

              {/* Badge de Partida 1 o 2 */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black mb-2 border border-emerald-200">
                <span>🎯</span>
                <span>
                  {rewardResult?.gamesPlayedToday === 1
                    ? (isEn ? "Game 1 of 2 Completed!" : "¡Partida 1 de 2 Completada!")
                    : (isEn ? "Game 2 of 2 Completed!" : "¡Partida 2 de 2 Completada!")}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-1">
                {moves <= 14
                  ? (isEn ? "PHOTOGRAPHIC MEMORY! 🏆" : "¡MEMORIA FOTOGRÁFICA! 🏆")
                  : moves <= 18
                  ? (isEn ? "OUTSTANDING PLAY! 🌟" : "¡JUGADA EXTRAORDINARIA! 🌟")
                  : moves <= 24
                  ? (isEn ? "EXCELLENT MATCH! ✨" : "¡EXCELENTE JUEGO! ✨")
                  : moves <= 30
                  ? (isEn ? "GREAT JOB! 👍" : "¡MUY BUEN INTENTO! 👍")
                  : moves <= 36
                  ? (isEn ? "BOARD COMPLETED! 👏" : "¡TABLERO COMPLETADO! 👏")
                  : (isEn ? "GREAT BRAIN WORKOUT! 💪" : "¡BUEN ENTRENAMIENTO MENTAL! 💪")}
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm mb-4">
                {isEn
                  ? "You matched all 10 Costa Rican postcard pairs!"
                  : "¡Descubriste las 10 parejas de postales de Costa Rica!"}
              </p>

              {/* Estadísticas de la partida */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    {isEn ? "Total Moves" : "Jugadas"}
                  </div>
                  <div className="text-2xl font-black text-stone-800">
                    {moves}
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    {isEn ? "Total Time" : "Tiempo"}
                  </div>
                  <div className="text-2xl font-black text-stone-800 font-mono">
                    {formatTime(timeSeconds)}
                  </div>
                </div>
              </div>

              {/* Badge de nuevo récord */}
              {isNewRecord && (
                <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300 animate-pulse">
                  <Star size={14} className="fill-amber-500 text-amber-500" />
                  <span>{isEn ? "NEW PERSONAL BEST!" : "¡NUEVO RÉCORD PERSONAL!"}</span>
                </div>
              )}

              {/* Caja de Recompensa de XPs */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg mb-5">
                <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-100 mb-1">
                  {isPracticeMode ? (isEn ? "Practice Mode" : "Modo Práctica") : (isEn ? "XP Awarded" : "XPs Ganados")}
                </div>
                <div className="text-4xl font-black flex items-center justify-center gap-2 drop-shadow-md">
                  <span>+{isPracticeMode ? 0 : (rewardResult?.xpAwarded ?? currentPot.xp)} XP</span>
                  <Sparkles size={28} className="text-yellow-300" />
                </div>
                
                {/* Cuota Diaria y Mensaje de 2 Partidas */}
                <div className="mt-3 pt-3 border-t border-emerald-400/40 text-xs">
                  {rewardResult?.gamesRemaining === 1 ? (
                    <div className="bg-emerald-700/60 rounded-xl p-2 text-emerald-100 font-bold">
                      {isEn 
                        ? `🎉 1 game left today! You've earned ${rewardResult.todayEarnedXp}/100 XPs so far.` 
                        : `🎉 ¡Te queda 1 partida hoy! Has acumulado ${rewardResult.todayEarnedXp}/100 XPs hoy.`}
                    </div>
                  ) : (
                    <div className="bg-emerald-700/60 rounded-xl p-2 text-emerald-100 font-bold">
                      {isEn
                        ? `🏁 2 of 2 games completed today (${rewardResult?.todayEarnedXp ?? dailyStatus.todayEarnedXp}/100 daily XPs). Resets at midnight!`
                        : `🏁 2 de 2 partidas completadas hoy (${rewardResult?.todayEarnedXp ?? dailyStatus.todayEarnedXp}/100 XPs diarios). ¡Se reinicia a medianoche!`}
                    </div>
                  )}
                </div>

                {rewardResult?.newTotalXp !== undefined && (
                  <div className="mt-2 text-xs flex items-center justify-between opacity-90">
                    <span>{isEn ? "Your Level:" : "Tu Nivel:"} <strong>{rewardResult.newLevel}</strong></span>
                    <span>{isEn ? "Total XP:" : "Total XP:"} <strong>{rewardResult.newTotalXp}</strong></span>
                  </div>
                )}
              </div>

              {/* Botones de acción según las partidas restantes */}
              <div className="flex flex-col gap-2.5">
                {rewardResult?.gamesRemaining === 1 || dailyStatus.gamesRemaining === 1 ? (
                  <button
                    onClick={() => startNewGame(false)}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    <span>{isEn ? "Play My 2nd & Final Game Today!" : "¡Jugar mi 2da y última partida de hoy!"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startNewGame(true)}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play size={18} />
                    <span>{isEn ? "Practice Mode (For Fun / 0 XP)" : "Modo Práctica (Por Diversión / 0 XP)"}</span>
                  </button>
                )}

                <Link
                  href={`/${lang}/community/playa`}
                  className="w-full py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>🏖️</span>
                  <span>{isEn ? "Play Tiko Beach (Beta)" : "Jugar Tiko Playa (Beta)"}</span>
                </Link>

                <Link
                  href={`/${lang}/community`}
                  className="w-full py-2.5 rounded-xl text-stone-500 hover:text-emerald-700 text-xs font-semibold transition-colors"
                >
                  {isEn ? "Back to Community" : "Volver a la Comunidad"}
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
