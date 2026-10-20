"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Share2,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  Check,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import {
  getDailyPreguntikasQuestions,
  getPreguntikasDailyStatus,
  awardPreguntikasXP,
  DailyPreguntikasStatus,
  AwardPreguntikasXPResult,
} from "../../../../actions/preguntikas";
import { TriviaQuestion } from "../../../../data/preguntikasBank";

const CATEGORY_STYLES: Record<
  TriviaQuestion["category"],
  { badge: string; icon: string; border: string; bg: string }
> = {
  GEOGRAFIA: {
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "🌋",
    border: "border-blue-400",
    bg: "bg-blue-50/70",
  },
  PARQUES: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: "🏞️",
    border: "border-emerald-400",
    bg: "bg-emerald-50/70",
  },
  FAUNA_FLORA: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "🦜",
    border: "border-amber-400",
    bg: "bg-amber-50/70",
  },
  HISTORIA_CULTURA: {
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "📜",
    border: "border-purple-400",
    bg: "bg-purple-50/70",
  },
};

interface UserAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  question: TriviaQuestion;
}

export default function PreguntikasPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = use(params);
  const lang = unwrappedParams?.lang || "es";
  const isEn = lang === "en";
  const { user } = useUser();

  // Estados de datos y juego
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [gameState, setGameState] = useState<"loading" | "playing" | "finished">("loading");
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Temporizador
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Estado diario de XP
  const [dailyStatus, setDailyStatus] = useState<DailyPreguntikasStatus | null>(null);
  const [xpResult, setXpResult] = useState<AwardPreguntikasXPResult | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // Audio y preferencias
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Modales
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Cargar preferencia de sonido
  useEffect(() => {
    const saved = localStorage.getItem("preguntikas_sound");
    if (saved !== null) {
      setSoundEnabled(saved === "true");
    }
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem("preguntikas_sound", String(nextVal));
  };

  // Sonidos con Web Audio API
  const playSound = (type: "click" | "correct" | "wrong" | "victory") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
        osc.frequency.setValueAtTime(540, t0);
        osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.04);
        gain.gain.setValueAtTime(0.08, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.04);
      } else if (type === "correct") {
        // Arpegio mayor alegre y brillante (C5 -> E5 -> G5 -> C6)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
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
      } else if (type === "wrong") {
        // Tono suave descendente tipo error amigable
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(260, t0);
        osc.frequency.exponentialRampToValueAtTime(160, t0 + 0.22);
        gain.gain.setValueAtTime(0.09, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.22);
      } else if (type === "victory") {
        // Fanfarria triunfal
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          const start = t0 + idx * 0.09;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.22, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.45);
        });
      }
    } catch {}
  };

  // Cargar estado diario
  const fetchStatus = async () => {
    let localUsername = localStorage.getItem("localUsername") || undefined;
    try {
      const status = await getPreguntikasDailyStatus({
        localUsername,
        fallbackClerkId: user?.id,
      });
      setDailyStatus(status);
      return status;
    } catch (err) {
      console.error("Error fetching Preguntikas status:", err);
      return null;
    }
  };

  // Iniciar partida
  const startGame = async (forcePractice: boolean = false) => {
    setGameState("loading");
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setHasAnsweredCurrent(false);
    setTimerSeconds(0);
    setXpResult(null);

    const status = await fetchStatus();
    const shouldBePractice = forcePractice || (status !== null && status.gamesRemaining <= 0);
    setIsPracticeMode(shouldBePractice);

    try {
      // Si es modo práctica, generar preguntas aleatorias del banco.
      // Si es modo diario oficial, obtener las 3 preguntas fijas del día de Costa Rica.
      const dailyQuestions = await getDailyPreguntikasQuestions(shouldBePractice);
      setQuestions(dailyQuestions);
      setGameState("playing");

      // Iniciar timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting game:", err);
      toast.error(isEn ? "Could not load trivia questions." : "No se pudieron cargar las preguntas.");
      setGameState("loading");
    }
  };

  // Carga inicial
  useEffect(() => {
    startGame(false);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  // Manejar respuesta
  const handleSelectOption = (optionIndex: number) => {
    if (hasAnsweredCurrent || gameState !== "playing") return;

    setSelectedOption(optionIndex);
    setHasAnsweredCurrent(true);

    const currentQ = questions[currentIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;

    if (isCorrect) {
      playSound("correct");
    } else {
      playSound("wrong");
    }

    const answerRecord: UserAnswer = {
      questionId: currentQ.id,
      selectedIndex: optionIndex,
      isCorrect,
      question: currentQ,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);
  };

  // Pasar a siguiente pregunta o finalizar
  const handleNextQuestion = () => {
    playSound("click");
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnsweredCurrent(false);
    } else {
      // Fin del juego
      finishGame();
    }
  };

  // Finalizar juego y calcular XP
  const finishGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("finished");

    const answers = [...userAnswers];
    const correctCount = answers.filter((a) => a.isCorrect).length;

    // Sonido y confeti según desempeño
    if (correctCount >= 2) {
      playSound("victory");
      confetti({
        particleCount: correctCount === 3 ? 90 : 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Si está en modo práctica, no otorgar XP en base de datos
    if (isPracticeMode) {
      return;
    }

    // Otorgar XP en servidor
    setIsSubmittingScore(true);
    let localUsername = localStorage.getItem("localUsername") || undefined;
    try {
      const res = await awardPreguntikasXP({
        correctCount,
        totalQuestions: questions.length,
        timeSeconds: timerSeconds,
        localUsername,
        fallbackClerkId: user?.id,
      });

      setXpResult(res);
      await fetchStatus();

      if (res.success && res.xpAwarded > 0) {
        toast.success(
          isEn
            ? `+${res.xpAwarded} XP awarded to your profile!`
            : `¡Ganaste +${res.xpAwarded} XP para tu perfil de explorador!`
        );
      }
    } catch (err) {
      console.error("Error awarding Preguntikas XP:", err);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // Formato mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Compartir resultado estilo Wordle
  const handleShareResult = () => {
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const dateStr = dailyStatus?.crDateFormatted || new Date().toLocaleDateString();

    const squares = userAnswers.map((a) => (a.isCorrect ? "🟩" : "🟥")).join("");

    const shareText = isEn
      ? `🇨🇷 Preguntikas Tico100 (${dateStr})\nScore: ${correctCount}/${questions.length} correct ${correctCount === 3 ? "🎯" : "⭐"}\n⏱️ ${formatTime(timerSeconds)}\n${squares}\n\nTest your knowledge of Costa Rica!\nhttps://tico100.com/en/community/preguntikas`
      : `🇨🇷 Preguntikas Tico100 (${dateStr})\nPuntaje: ${correctCount}/${questions.length} aciertos ${correctCount === 3 ? "🎯" : "⭐"}\n⏱️ ${formatTime(timerSeconds)}\n${squares}\n\n¿Cuánto sabes de Costa Rica? ¡Pruébalo aquí!\nhttps://tico100.com/es/community/preguntikas`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      toast.success(
        isEn ? "Results copied to clipboard!" : "¡Resultado copiado al portapapeles!"
      );
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const currentQ = questions[currentIndex];
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-emerald-50/20 to-teal-50/40 text-stone-800 pb-16">
      {/* Barra superior de navegación y controles */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/${lang}/community`}
            className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isEn ? "Community Hub" : "Comunidad"}
            </span>
            <span className="sm:hidden">{isEn ? "Back" : "Atrás"}</span>
          </Link>

          {/* Título central */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦜</span>
            <span className="font-black text-xl tracking-tight text-emerald-900">
              Preguntikas
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {isEn ? "Daily Trivia" : "Trivia Diaria"}
            </span>
          </div>

          {/* Botones de acción derecha */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRulesModal(true)}
              className="p-2 rounded-xl text-stone-600 hover:text-emerald-800 hover:bg-stone-100 transition-colors"
              title={isEn ? "Rules & Help" : "Reglas y Ayuda"}
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-stone-600 hover:text-emerald-800 hover:bg-stone-100 transition-colors"
              title={soundEnabled ? (isEn ? "Mute" : "Silenciar") : (isEn ? "Unmute" : "Activar sonido")}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-700" />
              ) : (
                <VolumeX className="w-5 h-5 text-stone-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* Banner de estado diario y práctica */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs md:text-sm font-semibold text-stone-700">
              {isEn ? "Costa Rica Daily Quiz" : "Trivia Oficial del Día"}:{" "}
              <strong className="text-emerald-800">
                {dailyStatus?.crDateFormatted || new Date().toLocaleDateString()}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPracticeMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <span>🔄</span>
                <span>{isEn ? "Practice Mode (No XP)" : "Modo Práctica (Sin XP)"}</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>
                    {isEn
                      ? `Rated Game: ${2 - (dailyStatus?.gamesRemaining ?? 2) + 1} of 2`
                      : `Intento Puntuado: ${2 - (dailyStatus?.gamesRemaining ?? 2) + 1} de 2`}
                  </span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isEn ? "Up to 50 XP" : "Hasta 50 XP"}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* PANTALLA: CARGANDO */}
        {/* ============================================================== */}
        {gameState === "loading" && (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/90 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-bold text-stone-800 mb-1">
              {isEn ? "Preparing Costa Rican Trivia..." : "Preparando Preguntikas de hoy..."}
            </h3>
            <p className="text-stone-500 text-sm">
              {isEn
                ? "Checking verified facts from official Costa Rican institutions."
                : "Verificando hechos oficiales con SINAC, IGN y Archivo Nacional."}
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* PANTALLA: JUEGO EN CURSO (PLAYING) */}
        {/* ============================================================== */}
        {gameState === "playing" && currentQ && (
          <div className="space-y-6">
            {/* Barra de progreso de preguntas y cronómetro */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                <span>
                  {isEn ? "Question" : "Pregunta"} {currentIndex + 1} {isEn ? "of" : "de"}{" "}
                  {questions.length}
                </span>
                <div className="flex items-center gap-1.5 text-emerald-800 font-mono text-sm bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{formatTime(timerSeconds)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${((currentIndex + (hasAnsweredCurrent ? 1 : 0)) / questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Indicadores redondos de las 3 preguntas */}
              <div className="flex items-center justify-center gap-3 mt-3">
                {questions.map((_, idx) => {
                  const ans = userAnswers[idx];
                  let stateColor = "bg-stone-200 text-stone-600";
                  if (idx === currentIndex && !hasAnsweredCurrent) {
                    stateColor = "ring-2 ring-emerald-500 bg-emerald-100 text-emerald-900 font-bold";
                  } else if (ans) {
                    stateColor = ans.isCorrect
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white";
                  }
                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${stateColor}`}
                    >
                      {ans ? (
                        ans.isCorrect ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )
                      ) : (
                        idx + 1
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tarjeta de Pregunta */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/90 shadow-sm relative overflow-hidden transition-all">
              {/* Categoría y Fuente oficial */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${CATEGORY_STYLES[currentQ.category].badge}`}
                >
                  <span>{CATEGORY_STYLES[currentQ.category].icon}</span>
                  <span>{isEn ? currentQ.categoryLabel.en : currentQ.categoryLabel.es}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentQ.source}</span>
                </span>
              </div>

              {/* Texto de la pregunta */}
              <h2 className="text-xl md:text-2xl font-black text-stone-900 leading-snug mb-6">
                {isEn ? currentQ.question.en : currentQ.question.es}
              </h2>

              {/* Opciones de respuesta */}
              <div className="grid grid-cols-1 gap-3 mb-6">
                {(isEn ? currentQ.options.en : currentQ.options.es).map((optionText, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isTrueCorrect = optIdx === currentQ.correctIndex;

                  let buttonStyle =
                    "border-stone-200 bg-white hover:bg-stone-50/80 hover:border-emerald-300 text-stone-800 shadow-xs";
                  let badgeLetterStyle = "bg-stone-100 text-stone-700 border-stone-200";

                  if (hasAnsweredCurrent) {
                    if (isTrueCorrect) {
                      buttonStyle =
                        "border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold ring-2 ring-emerald-400";
                      badgeLetterStyle = "bg-emerald-600 text-white border-emerald-600";
                    } else if (isSelected && !isTrueCorrect) {
                      buttonStyle =
                        "border-red-400 bg-red-50/90 text-red-950 ring-2 ring-red-400";
                      badgeLetterStyle = "bg-red-600 text-white border-red-600";
                    } else {
                      buttonStyle = "border-stone-100 bg-stone-50/60 text-stone-400 opacity-60";
                      badgeLetterStyle = "bg-stone-100 text-stone-400 border-stone-200";
                    }
                  }

                  const letterLabel = ["A", "B", "C", "D"][optIdx];

                  return (
                    <button
                      key={optIdx}
                      disabled={hasAnsweredCurrent}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 transition-colors ${badgeLetterStyle}`}
                        >
                          {letterLabel}
                        </span>
                        <span className="text-base md:text-lg font-medium leading-tight">
                          {optionText}
                        </span>
                      </div>

                      {hasAnsweredCurrent && (
                        <div className="shrink-0 ml-2">
                          {isTrueCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          ) : isSelected ? (
                            <XCircle className="w-6 h-6 text-red-500" />
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Cápsula Educativa Expandida: ¿Sabías que...? */}
              {hasAnsweredCurrent && (
                <div className="animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-300/80 rounded-2xl p-4 md:p-5 mb-6 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-400/20 text-amber-700 p-2 rounded-xl shrink-0 mt-0.5">
                        <BookOpen className="w-5 h-5 text-amber-800" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-amber-950 text-sm md:text-base">
                            {isEn ? "💡 Did you know?" : "💡 ¿Sabías que...?"}
                          </h4>
                          <span className="text-[11px] font-semibold text-amber-800/80 bg-amber-100/70 px-2 py-0.5 rounded-full">
                            {isEn ? "Official Fact" : "Dato Verificado"}
                          </span>
                        </div>
                        <p className="text-stone-700 text-sm md:text-base leading-relaxed">
                          {isEn ? currentQ.explanation.en : currentQ.explanation.es}
                        </p>
                        <p className="text-[11px] text-stone-500 pt-1 flex items-center gap-1 font-medium">
                          <span>🏛️ {isEn ? "Source" : "Fuente"}:</span>
                          <span className="text-stone-700 font-semibold">{currentQ.source}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botón Siguiente / Ver Resultados */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                      <span>
                        {currentIndex + 1 < questions.length
                          ? isEn
                            ? "Next Question"
                            : "Siguiente Pregunta"
                          : isEn
                          ? "View Final Results"
                          : "Ver Resultados Finales"}
                      </span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PANTALLA: RESULTADOS (FINISHED) */}
        {/* ============================================================== */}
        {gameState === "finished" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Tarjeta de Resumen y Puntuación */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-md text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

              {/* Medalla / Icono según resultado */}
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center text-4xl shadow-inner border border-emerald-200 mb-4">
                {correctCount === 3
                  ? "🏆"
                  : correctCount === 2
                  ? "🌟"
                  : correctCount === 1
                  ? "🌿"
                  : "📚"}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-stone-900 mb-1">
                {correctCount === 3
                  ? isEn
                    ? "Perfect Score! Tico Master"
                    : "¡Puntaje Perfecto! Maestro Tico"
                  : correctCount === 2
                  ? isEn
                    ? "Great Costa Rica Expert!"
                    : "¡Gran Conocedor de Costa Rica!"
                  : correctCount === 1
                  ? isEn
                    ? "Good Effort, Explorer!"
                    : "¡Buen Intento, Explorador!"
                  : isEn
                  ? "Keep Learning About Costa Rica!"
                  : "¡Siempre Aprendiendo sobre el País!"}
              </h2>

              <p className="text-stone-600 text-sm md:text-base max-w-md mx-auto mb-6">
                {isEn
                  ? `You got ${correctCount} of ${questions.length} questions correct in ${formatTime(
                      timerSeconds
                    )}.`
                  : `Acertaste ${correctCount} de ${questions.length} preguntas en ${formatTime(
                      timerSeconds
                    )}.`}
              </p>

              {/* Grid visual de aciertos estilo Wordle */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {userAnswers.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                      ans.isCorrect ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  >
                    {ans.isCorrect ? <Check className="w-6 h-6 stroke-[3]" /> : <XCircle className="w-6 h-6" />}
                  </div>
                ))}
              </div>

              {/* Caja de XP Ganados */}
              {!isPracticeMode && (
                <div className="bg-amber-50/90 border-2 border-amber-200/90 rounded-2xl p-4 max-w-sm mx-auto mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center text-xl">
                      ⭐
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-bold text-amber-800">
                        {isEn ? "EXPERIENCE EARNED" : "RECOMPENSA DE EXPERIENCIA"}
                      </span>
                      <span className="text-lg font-black text-amber-950">
                        {isSubmittingScore
                          ? isEn
                            ? "Calculating XP..."
                            : "Calculando..."
                          : `+${xpResult?.xpAwarded ?? 0} XP`}
                      </span>
                    </div>
                  </div>

                  {xpResult?.newTotalXp !== undefined && (
                    <div className="text-right">
                      <span className="block text-[11px] text-stone-500 font-medium">
                        {isEn ? "Total XP" : "XP Total"}
                      </span>
                      <span className="text-sm font-black text-stone-800">
                        {xpResult.newTotalXp} XP (Nvl {xpResult.newLevel})
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de Compartir y Volver a Jugar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleShareResult}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {copiedShare
                      ? isEn
                        ? "Copied!"
                        : "¡Copiado!"
                      : isEn
                      ? "Share Result"
                      : "Compartir Resultado"}
                  </span>
                </button>

                {dailyStatus && dailyStatus.gamesRemaining > 0 && !isPracticeMode ? (
                  <button
                    onClick={() => startGame(false)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                  >
                    <Flame className="w-4 h-4 fill-white" />
                    <span>
                      {isEn ? "Play 2nd Rated Attempt" : "Jugar 2do Intento Puntuado"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => startGame(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {isEn ? "Play Practice Mode (Random)" : "Jugar Modo Práctica (Aleatorio)"}
                    </span>
                  </button>
                )}

                <Link
                  href={`/${lang}/community`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isEn ? "Community Hub" : "Volver a Comunidad"}</span>
                </Link>
              </div>
            </div>

            {/* Repaso detallado de las 3 preguntas con cápsulas educativas */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-stone-800 flex items-center gap-2 px-1">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <span>
                  {isEn
                    ? "Educational Review & Verified Sources"
                    : "Repaso Educativo y Fuentes Oficiales"}
                </span>
              </h3>

              <div className="space-y-4">
                {userAnswers.map((ans, idx) => {
                  const q = ans.question;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${CATEGORY_STYLES[q.category].badge}`}
                        >
                          <span>{CATEGORY_STYLES[q.category].icon}</span>
                          <span>{isEn ? q.categoryLabel.en : q.categoryLabel.es}</span>
                        </span>

                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          {ans.isCorrect ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              {isEn ? "Correct" : "Correcto"}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-500" />
                              {isEn ? "Incorrect" : "Incorrecto"}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="font-bold text-stone-900 text-base">
                        {idx + 1}. {isEn ? q.question.en : q.question.es}
                      </p>

                      <div className="text-sm bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1">
                        <p className="text-stone-700">
                          <strong className="text-stone-900">
                            {isEn ? "Correct Answer: " : "Respuesta Correcta: "}
                          </strong>
                          <span className="text-emerald-800 font-semibold">
                            {isEn ? q.options.en[q.correctIndex] : q.options.es[q.correctIndex]}
                          </span>
                        </p>
                        {!ans.isCorrect && (
                          <p className="text-stone-500">
                            <strong>{isEn ? "Your Choice: " : "Tu Selección: "}</strong>
                            <span className="text-red-700">
                              {isEn
                                ? q.options.en[ans.selectedIndex]
                                : q.options.es[ans.selectedIndex]}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs md:text-sm text-stone-700">
                        <span className="font-bold text-amber-950 block mb-0.5">
                          {isEn ? "💡 Did you know?" : "💡 ¿Sabías que...?"}
                        </span>
                        <p>{isEn ? q.explanation.en : q.explanation.es}</p>
                        <p className="text-[11px] text-stone-500 font-medium mt-1">
                          🏛️ {isEn ? "Official source" : "Fuente oficial"}: {q.source}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: REGLAS Y FUNCIONAMIENTO */}
      {/* ============================================================== */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦜</span>
                <h3 className="text-lg font-black text-stone-900">
                  {isEn ? "About Preguntikas" : "Cómo Jugar Preguntikas"}
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-lg">🎯</span>
                <div>
                  <strong className="text-stone-900 block">
                    {isEn ? "3 Daily Questions" : "3 Preguntas Diarias"}
                  </strong>
                  <p>
                    {isEn
                      ? "Every calendar day in Costa Rica (UTC-6), a synchronized set of 3 questions is published for everyone."
                      : "Cada día oficial de Costa Rica se sincronizan 3 preguntas idénticas para toda la comunidad."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-lg">🛡️</span>
                <div>
                  <strong className="text-stone-900 block">
                    {isEn ? "100% Fact-Checked" : "100% Verificado Oficialmente"}
                  </strong>
                  <p>
                    {isEn
                      ? "All questions and answers are cited directly from SINAC, IGN, National Archives, and UNESCO."
                      : "Cada pregunta cita instituciones oficiales como SINAC, Instituto Geográfico Nacional, Museo Nacional o UNESCO."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-lg">⭐</span>
                <div>
                  <strong className="text-stone-900 block">
                    {isEn ? "Fair Daily XP Rewards" : "Recompensas de Experiencia (XP)"}
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-stone-700 mt-1">
                    <li>
                      <strong>3/3 {isEn ? "correct" : "aciertos"}:</strong> 50 XP
                    </li>
                    <li>
                      <strong>2/3 {isEn ? "correct" : "aciertos"}:</strong> 30 XP
                    </li>
                    <li>
                      <strong>1/3 {isEn ? "correct" : "aciertos"}:</strong> 15 XP
                    </li>
                    <li>
                      <strong>0/3 {isEn ? "correct" : "aciertos"}:</strong> 5 XP
                    </li>
                  </ul>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {isEn
                      ? "Up to 2 rated attempts per day (max 100 XP). Unlimited Practice Mode available anytime."
                      : "Hasta 2 intentos puntuados por día (máx 100 XP). Luego puedes practicar sin límite."}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-colors"
            >
              {isEn ? "Got it, let's play!" : "¡Entendido, a jugar!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
