"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, Volume2, VolumeX, RotateCcw, Award, 
  HelpCircle, Sparkles, Heart, CheckCircle2, ShieldCheck, 
  Trees, MapPin, Stethoscope, ChevronRight, Share2, Compass
} from "lucide-react";
import { useProgress } from "../../../../context/ProgressContext";
import { useUser } from "@clerk/nextjs";
import { initMobileAudioUnlock, playSynthesizedSound, suspendAudio } from "../../../../lib/soundUtils";
import { 
  SANCTUARY_ANIMALS, 
  SanctuaryAnimal, 
  CareStep 
} from "../../../../data/santuarioData";
import { 
  getSantuarioDailyStatus, 
  awardSantuarioRelease, 
  SantuarioRewardResult 
} from "../../../../actions/santuario";

export default function SantuarioPage({ params }: { params: Promise<{ lang: string }> }) {
  const unwrappedParams = use(params);
  const lang = unwrappedParams.lang || "es";
  const isEn = lang === "en";

  const { user } = useUser();
  const { updateLocalXp, refreshGamification } = useProgress();

  // Estados del juego
  const [selectedAnimalIndex, setSelectedAnimalIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, number>>({});
  const [releasedAnimals, setReleasedAnimals] = useState<string[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [isApplyingTool, setIsApplyingTool] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [rewardResult, setRewardResult] = useState<SantuarioRewardResult | null>(null);

  // Estado diario de partidas y XP
  const [dailyStatus, setDailyStatus] = useState<{
    rescuesRemaining: number;
    todayEarnedXp: number;
    limitReached: boolean;
  }>({ rescuesRemaining: 3, todayEarnedXp: 0, limitReached: false });

  const currentAnimal: SanctuaryAnimal = SANCTUARY_ANIMALS[selectedAnimalIndex] || SANCTUARY_ANIMALS[0];
  const currentStepProgress = completedSteps[currentAnimal.id] || 0;
  const isAnimalFullyHealed = currentStepProgress >= currentAnimal.steps.length;
  const isAnimalAlreadyReleased = releasedAnimals.includes(currentAnimal.id);
  const currentStep: CareStep | undefined = currentAnimal.steps[currentStepProgress];

  // Cargar estado inicial y liberaciones previas de la sesión
  const refreshStatus = useCallback(async () => {
    try {
      const res = await getSantuarioDailyStatus(user?.username || undefined, user?.id);
      setDailyStatus({
        rescuesRemaining: res.rescuesRemaining,
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

  // Sonidos sintetizados Web Audio relajantes tipo "Cozy Game"
  const playCareSound = useCallback(() => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      // Tono suave tipo gota de agua / xilófono
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, t0); // D5
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.15); // A5
      gain.gain.setValueAtTime(0.2, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.25);
    });
  }, [soundEnabled]);

  const playPurrHappySound = useCallback(() => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      // Acorde armónico cálido
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t0 + idx * 0.05);
        gain.gain.setValueAtTime(0.12, t0 + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + idx * 0.05);
        osc.stop(t0 + idx * 0.05 + 0.35);
      });
    });
  }, [soundEnabled]);

  const playReleaseFanfare = useCallback(() => {
    playSynthesizedSound(soundEnabled, (ctx, t0) => {
      // Fanfarria alegre de marimba costarricense
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t0 + idx * 0.09);
        gain.gain.setValueAtTime(0.18, t0 + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + idx * 0.09);
        osc.stop(t0 + idx * 0.09 + 0.3);
      });
    });
  }, [soundEnabled]);

  // Aplicar paso de cuidado
  const handleApplyStep = (stepIndex: number) => {
    if (stepIndex !== currentStepProgress) {
      toast.info(
        isEn 
          ? `Please follow the care routine: ${currentStep?.nameEn || "Current Step"}` 
          : `Atiende primero: ${currentStep?.name || "Paso actual"}`
      );
      return;
    }

    setIsApplyingTool(true);
    playCareSound();

    setTimeout(() => {
      const nextProgress = currentStepProgress + 1;
      setCompletedSteps((prev) => ({
        ...prev,
        [currentAnimal.id]: nextProgress,
      }));

      const stepJustDone = currentAnimal.steps[stepIndex];
      const msg = isEn ? stepJustDone.successMessageEn : stepJustDone.successMessage;
      setActiveMessage(msg);

      if (nextProgress >= currentAnimal.steps.length) {
        playPurrHappySound();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"],
        });
      }

      setIsApplyingTool(false);
    }, 450);
  };

  // Liberar al animal en el Parque Nacional
  const handleReleaseToWild = async () => {
    if (!isAnimalFullyHealed || isAnimalAlreadyReleased) return;

    playReleaseFanfare();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#10b981", "#059669", "#34d399", "#f59e0b"],
    });

    setReleasedAnimals((prev) => [...prev, currentAnimal.id]);
    setShowReleaseModal(true);

    try {
      const res = await awardSantuarioRelease({
        animalId: currentAnimal.id,
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
            ? `Animal successfully released! +${res.xpAwarded} XP & +${res.tikolonesAwarded} Tikolones`
            : `¡Animal liberado con éxito! +${res.xpAwarded} XP y +${res.tikolonesAwarded} Tikolones`
        );
      }
      refreshStatus();
    } catch (e) {
      console.warn("Error premiando liberación:", e);
    }
  };

  const handleNextPatient = () => {
    setShowReleaseModal(false);
    setActiveMessage(null);
    // Cambiar al siguiente paciente de la lista
    const nextIdx = (selectedAnimalIndex + 1) % SANCTUARY_ANIMALS.length;
    setSelectedAnimalIndex(nextIdx);
  };

  const healthPercentage = Math.round((currentStepProgress / currentAnimal.steps.length) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col items-center font-sans select-none">
      
      {/* Barra Superior de Navegación y Título */}
      <div className="w-full flex items-center justify-between mb-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-3xl border border-emerald-100 shadow-sm">
        <Link 
          href={`/${lang}/community`} 
          className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition font-bold text-xs md:text-sm"
        >
          <ArrowLeft size={18} />
          <span>{isEn ? "Community Hub" : "Comunidad"}</span>
        </Link>

        {/* Título Central */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
            🌿
          </div>
          <div>
            <h1 className="font-black text-emerald-950 text-sm md:text-base tracking-wide leading-tight">
              {isEn ? "Tiko Sanctuary" : "Santuario Tico"}
            </h1>
            <span className="text-[10px] text-stone-400 font-semibold block">
              {isEn ? "Rescue & Rehabilitation" : "Rescate y Liberación Silvestre"}
            </span>
          </div>
        </div>

        {/* Controles de Sonido y Ayuda */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHowTo(true)}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition"
            title={isEn ? "How it works" : "Cómo funciona"}
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition"
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 size={18} className="text-emerald-600" /> : <VolumeX size={18} className="text-stone-400" />}
          </button>
        </div>
      </div>

      {/* Resumen de Misiones Diarias del Santuario */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Trees size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              {isEn ? "Daily Rescues" : "Rescates Hoy"}
            </span>
            <span className="text-sm md:text-base font-black text-emerald-800">
              {dailyStatus.rescuesRemaining} {isEn ? "available" : "disponibles"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              {isEn ? "Earned XP" : "XP Santuario"}
            </span>
            <span className="text-sm md:text-base font-black text-amber-700">
              {dailyStatus.todayEarnedXp} / 90 XP
            </span>
          </div>
        </div>

        <div className="hidden sm:flex bg-white rounded-2xl p-3 border border-sky-100 shadow-xs items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              {isEn ? "Released in Session" : "Liberados en Sesión"}
            </span>
            <span className="text-sm md:text-base font-black text-sky-800">
              {releasedAnimals.length} {isEn ? "wild animals" : "animales libres"}
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Pacientes Silvestres en la Clínica */}
      <div className="w-full mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-black text-stone-600 uppercase tracking-wider">
            {isEn ? "Sanctuary Patients" : "Pacientes en el Santuario"}
          </span>
          <span className="text-[11px] text-stone-400 font-semibold">
            {selectedAnimalIndex + 1} de {SANCTUARY_ANIMALS.length}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {SANCTUARY_ANIMALS.map((animal, idx) => {
            const isSelected = idx === selectedAnimalIndex;
            const progress = completedSteps[animal.id] || 0;
            const isHealed = progress >= animal.steps.length;
            const isReleased = releasedAnimals.includes(animal.id);

            return (
              <button
                key={animal.id}
                onClick={() => {
                  setSelectedAnimalIndex(idx);
                  setActiveMessage(null);
                }}
                className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all duration-300 ${
                  isSelected 
                    ? "bg-white border-emerald-500 shadow-md -translate-y-1" 
                    : "bg-white/80 border-stone-200/80 hover:border-emerald-200 hover:bg-white"
                }`}
              >
                {/* Badge de Estado */}
                {isReleased ? (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                    ✓
                  </span>
                ) : isHealed ? (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] shadow-sm animate-bounce">
                    ★
                  </span>
                ) : null}

                <div className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {animal.emoji}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-stone-800 truncate max-w-full">
                  {animal.name}
                </span>
                <span className="text-[9px] text-stone-400 truncate max-w-full hidden sm:block">
                  {isEn ? animal.speciesEn : animal.species}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ÁREA PRINCIPAL: La Clínica de Rehabilitación */}
      <div className="w-full bg-white rounded-3xl border-2 border-emerald-100 shadow-xl overflow-hidden mb-6 relative">
        
        {/* Encabezado del Paciente Activo */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-stone-50 p-5 md:p-6 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br ${currentAnimal.avatarBg} border-2 border-white shadow-md flex items-center justify-center text-4xl md:text-5xl shrink-0 transition-transform ${isApplyingTool ? "scale-110" : ""}`}>
              {currentAnimal.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-emerald-950">
                  {currentAnimal.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  {isEn ? currentAnimal.speciesEn : currentAnimal.species}
                </span>
              </div>
              <p className="text-xs text-stone-500 italic mt-0.5 font-medium">
                {currentAnimal.scientificName} · <span className="text-emerald-700 font-semibold">{currentAnimal.partnerSanctuary}</span>
              </p>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1.5">
                <MapPin size={13} className="text-rose-500 shrink-0" />
                <span>{isEn ? currentAnimal.rescueOriginEn : currentAnimal.rescueOrigin}</span>
              </div>
            </div>
          </div>

          {/* Estado de Salud / Liberación */}
          <div className="sm:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider mb-1">
              {isEn ? "Rehabilitation Progress" : "Progreso de Salud"}
            </span>
            <div className="flex items-center sm:justify-end gap-2">
              <div className="w-28 h-3.5 bg-stone-100 rounded-full overflow-hidden shadow-inner border border-stone-200">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    healthPercentage === 100 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                      : "bg-gradient-to-r from-amber-400 to-emerald-500"
                  }`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
              <span className="text-sm font-black text-emerald-900">
                {healthPercentage}%
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium block mt-1">
              {isAnimalAlreadyReleased 
                ? (isEn ? "🌿 Released into the wild" : "🌿 Libre en el Parque Nacional") 
                : isAnimalFullyHealed 
                  ? (isEn ? "✨ Ready for release!" : "✨ ¡Listo para su liberación!") 
                  : (isEn ? `Step ${currentStepProgress + 1} of ${currentAnimal.steps.length}` : `Paso ${currentStepProgress + 1} de ${currentAnimal.steps.length}`)}
            </span>
          </div>
        </div>

        {/* Zona de Interacción y Cuidados del Animal */}
        <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center bg-stone-50/50 min-h-[280px]">
          
          {/* Historia y Causa del Rescate */}
          <div className="max-w-xl mb-6 bg-white/90 p-4 rounded-2xl border border-stone-200/80 shadow-xs text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
              <Stethoscope size={14} className="text-emerald-600" />
              <span>{isEn ? "Medical Report & Rescue Case:" : "Expediente de Rescate:"}</span>
            </div>
            <p className="text-xs md:text-sm text-stone-600 leading-relaxed">
              {isEn ? currentAnimal.storyEn : currentAnimal.story}
            </p>
          </div>

          {/* Mensaje de Retroalimentación de la Acción Reciente */}
          {activeMessage && (
            <div className="mb-6 px-4 py-2.5 rounded-2xl bg-emerald-100/90 text-emerald-900 border border-emerald-200 text-xs md:text-sm font-bold animate-fade-in flex items-center gap-2 shadow-xs">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <span>{activeMessage}</span>
            </div>
          )}

          {/* Si ya fue liberado */}
          {isAnimalAlreadyReleased ? (
            <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-200 max-w-md w-full flex flex-col items-center">
              <div className="text-5xl mb-3">🌳</div>
              <h3 className="text-lg font-black text-emerald-950 mb-1">
                {isEn ? "Thriving in the Wild!" : "¡Viviendo Libre y Protegido!"}
              </h3>
              <p className="text-xs text-emerald-800 mb-4 max-w-xs">
                {currentAnimal.name} {isEn 
                  ? `was successfully re-introduced into ${currentAnimal.releaseHabitatEn}.` 
                  : `fue reinsertado con éxito en el ${currentAnimal.releaseHabitat}.`}
              </p>
              <button
                onClick={handleNextPatient}
                className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {isEn ? "Care for Next Patient" : "Atender al Siguiente Paciente"}
              </button>
            </div>
          ) : isAnimalFullyHealed ? (
            /* Si completó el 100% y está listo para liberar */
            <div className="p-6 bg-gradient-to-br from-amber-50 to-emerald-50 rounded-3xl border-2 border-amber-300 max-w-md w-full flex flex-col items-center shadow-lg animate-scale-up">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-3xl mb-3 shadow-md animate-bounce">
                🎉
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-1">
                {isEn ? "100% Rehabilitated!" : "¡100% Rehabilitado!"}
              </h3>
              <p className="text-xs text-stone-600 mb-5 max-w-xs">
                {isEn 
                  ? `${currentAnimal.name} has regained full health and wild instincts. Ready to open the sanctuary gates!`
                  : `${currentAnimal.name} recuperó su peso, fuerza e instinto. ¡Es hora de abrir la compuerta!`}
              </p>
              <button
                onClick={handleReleaseToWild}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-sm md:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>🌿</span>
                <span>{isEn ? "OPEN GATES & RELEASE TO WILD" : "¡ABRIR COMPUERTA Y LIBERAR EN EL PARQUE!"}</span>
              </button>
            </div>
          ) : (
            /* Rutina de Cuidados en Progreso */
            <div className="w-full max-w-2xl">
              <div className="mb-4 text-center">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  {isEn ? "Next Care Step:" : "Paso de Atención Actual:"}
                </span>
                <span className="text-sm md:text-base font-black text-emerald-900">
                  {currentStep?.toolEmoji} {isEn ? currentStep?.actionPromptEn : currentStep?.actionPrompt}
                </span>
              </div>

              {/* Botones de Acción / Herramientas de Guardaparques */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentAnimal.steps.map((step, sIdx) => {
                  const isDone = sIdx < currentStepProgress;
                  const isCurrent = sIdx === currentStepProgress;

                  return (
                    <button
                      key={step.id}
                      disabled={isDone || !isCurrent || isApplyingTool}
                      onClick={() => handleApplyStep(sIdx)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                        isDone 
                          ? "bg-emerald-50/60 border-emerald-300 text-emerald-800 opacity-80 cursor-default" 
                          : isCurrent 
                            ? "bg-white border-emerald-500 shadow-lg hover:border-emerald-600 hover:bg-emerald-50/30 scale-105 active:scale-95 ring-4 ring-emerald-400/20" 
                            : "bg-stone-50 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {isDone && (
                        <div className="absolute top-2 right-2 text-emerald-600 font-black">
                          <CheckCircle2 size={16} />
                        </div>
                      )}

                      <div className={`text-3xl mb-2 transition-transform ${isCurrent ? "animate-pulse" : ""}`}>
                        {step.toolEmoji}
                      </div>
                      <span className="text-xs font-black text-stone-800 text-center leading-tight mb-0.5">
                        {isEn ? step.nameEn : step.name}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium text-center">
                        {isDone 
                          ? (isEn ? "Completed" : "Completado") 
                          : isCurrent 
                            ? (isEn ? "Tap to apply" : "Toca para aplicar") 
                            : (isEn ? "Locked" : "Pendiente")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE LIBERACIÓN EXITOSA */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-300 text-center relative overflow-hidden animate-scale-up">
            
            {/* Cinta decorativa superior */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

            <div className="w-20 h-20 rounded-3xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
              {currentAnimal.emoji}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black mb-2 border border-emerald-200">
              <ShieldCheck size={14} className="text-emerald-700" />
              <span>{isEn ? "OFFICIAL WILDLIFE RELEASE" : "LIBERACIÓN OFICIAL DE FAUNA"}</span>
            </div>

            <h3 className="text-2xl font-black text-emerald-950 mb-1">
              {isEn ? "Back in the Wild!" : `¡${currentAnimal.name} Volvió a Casa!`}
            </h3>
            
            <p className="text-xs text-stone-500 font-medium mb-5">
              {isEn ? "Habitat Destination:" : "Destino de Conservación:"} <strong className="text-emerald-800">{isEn ? currentAnimal.releaseHabitatEn : currentAnimal.releaseHabitat}</strong>
            </p>

            {/* Recompensas Ganadas */}
            {rewardResult?.success && (
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 mb-5 flex items-center justify-around">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                    {isEn ? "Earned XP" : "XP Ganados"}
                  </span>
                  <span className="text-2xl font-black text-emerald-800">
                    +{rewardResult.xpAwarded}
                  </span>
                </div>
                <div className="w-px h-10 bg-emerald-200"></div>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
                    {isEn ? "Tikolones" : "Tikolones"}
                  </span>
                  <span className="text-2xl font-black text-amber-600">
                    +{rewardResult.tikolonesAwarded}
                  </span>
                </div>
              </div>
            )}

            {/* Compromiso ecológico real */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 text-left text-xs mb-6 space-y-1">
              <span className="font-bold text-stone-700 block">
                🌿 {isEn ? "Real-World Conservation Impact:" : "Impacto de Conservación Real:"}
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {isEn 
                  ? `In Costa Rica, rescue centers like ${currentAnimal.partnerSanctuary} rescue hundreds of ${currentAnimal.speciesEn.toLowerCase()}s each year from human conflicts and habitat loss.` 
                  : `En Costa Rica, centros como ${currentAnimal.partnerSanctuary} rescatan y rehabilitan anualmente decenas de ejemplares para devolverlos a los Parques Nacionales.`}
              </p>
            </div>

            {/* Botón Siguiente Paciente */}
            <button
              onClick={handleNextPatient}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{isEn ? "Continue to Next Patient" : "Atender al Siguiente Paciente"}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL CÓMO FUNCIONA */}
      {showHowTo && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 text-stone-800">
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                <h3 className="font-black text-lg text-emerald-900">
                  {isEn ? "How the Sanctuary Works" : "Cómo Funciona el Santuario"}
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
                <span className="text-2xl shrink-0">1️⃣</span>
                <div>
                  <strong className="text-emerald-900 block font-bold mb-0.5">
                    {isEn ? "Select a Rescued Animal" : "Elige un Animal Rescatado"}
                  </strong>
                  <span>
                    {isEn 
                      ? "Pick one of the iconic Costa Rican wildlife species currently in the rehabilitation clinic." 
                      : "Selecciona a uno de los pacientes silvestres en la parte superior para conocer su historia y necesidades."}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-100">
                <span className="text-2xl shrink-0">2️⃣</span>
                <div>
                  <strong className="text-amber-900 block font-bold mb-0.5">
                    {isEn ? "Complete the 4 Care Steps" : "Aplica los 4 Pasos Médicos"}
                  </strong>
                  <span>
                    {isEn 
                      ? "Provide hydration, herbal healing balms, native leaves and comfort to reach 100% health." 
                      : "Aplica suero, medicina natural, alimentos nativos y confort para llevar su barra de salud al 100%."}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-sky-50/70 p-3 rounded-2xl border border-sky-100">
                <span className="text-2xl shrink-0">3️⃣</span>
                <div>
                  <strong className="text-sky-900 block font-bold mb-0.5">
                    {isEn ? "Release to National Parks" : "Libéralos en su Hábitat"}
                  </strong>
                  <span>
                    {isEn 
                      ? "Open the sanctuary gates to return them to protected Costa Rican rainforests and earn up to 90 XP daily!" 
                      : "Abre la compuerta del santuario para reintegrarlos a los Parques Nacionales y gana hasta 90 XP y Tikolones diarios."}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition"
            >
              {isEn ? "Got it! Let's care for wildlife" : "¡Entendido! Vamos a cuidar la fauna"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
