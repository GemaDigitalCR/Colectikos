'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Trophy, Shield, ArrowRight } from 'lucide-react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function CrucetikoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const isEnglish = params?.lang === 'en';
  const lang = isEnglish ? 'en' : 'es';

  useEffect(() => {
    // No mostrar dentro de la misma pantalla del juego
    if (pathname?.includes('/community/crucetiko') || pathname?.includes('/community/crucetikas')) {
      setIsOpen(false);
      return;
    }

    // Permitir forzar el pop-up con ?showCrucetikoModal=true para pruebas
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceShow = searchParams?.get('showCrucetikoModal') === 'true';

    // Verificar si el usuario ya vio el anuncio
    const hasSeenModal = localStorage.getItem('hasSeenCrucetikoModal_v1');
    if (hasSeenModal && !forceShow) {
      return;
    }

    // Verificar si es un usuario registrado (Clerk o perfil local)
    const isRegistered = () => {
      if (isLoaded && !!user) return true;
      try {
        const storedProfile = localStorage.getItem('userProfileData');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.username && parsed.username !== 'Turista') return true;
        }
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          if (parsed.username || parsed.id) return true;
        }
      } catch {}
      return false;
    };

    // Si aún no está cargado Clerk, esperar
    if (!isLoaded && !localStorage.getItem('userProfileData')) {
      return;
    }

    if (!isRegistered() && !forceShow) {
      return;
    }

    // Si el WelcomeModal está abriéndose en la home, esperamos un momento para no colisionar
    const delay = pathname === '/' || pathname === '/es' || pathname === '/en' ? 1400 : 700;

    const timer = setTimeout(() => {
      // Re-verificar que no esté en la página del juego
      if (!window.location.pathname.includes('/community/crucetiko')) {
        setIsOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoaded, user, pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenCrucetikoModal_v1', 'true');
  };

  const handlePlayNow = () => {
    handleClose();
    router.push(`/${lang}/community/crucetiko`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div 
        className="bg-stone-900 border-2 border-emerald-500/30 rounded-[2rem] shadow-2xl max-w-md w-full relative overflow-hidden text-stone-100 p-6 sm:p-7 max-h-[92dvh] flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar (X) */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors bg-stone-800/80 hover:bg-stone-700 rounded-full p-2 border border-stone-700/80 cursor-pointer z-10"
          aria-label={isEnglish ? "Close modal" : "Cerrar modal"}
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto pr-1">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider mb-3.5">
            <span>🦥</span>
            <span>{isEnglish ? "New Mini-Game in Community!" : "¡Nuevo Mini Juego en Comunidad!"}</span>
          </div>

          {/* Encabezado con Mascota Otico */}
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 border-2 border-emerald-400/50 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shrink-0">
              🦥
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {isEnglish ? "Crucetiko is Here!" : "¡Llegó Crucetiko!"}
              </h2>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                {isEnglish ? "Wildlife Crossing · Costa Rica 🇨🇷" : "Paso de Fauna Silvestre · Costa Rica 🇨🇷"}
              </p>
            </div>
          </div>

          {/* Mensaje Principal Solicitado */}
          <div className="bg-stone-950/70 border border-emerald-500/20 rounded-2xl p-4 mb-4 shadow-inner">
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-medium">
              {isEnglish ? (
                <>
                  Have fun with our new mini-game — <strong className="text-emerald-400 font-black">Crucetiko</strong> — and help <strong className="text-white">Otico</strong> cross the road to reach the National Park safely.
                </>
              ) : (
                <>
                  Divertite con nuestro nuevo mini juego — <strong className="text-emerald-400 font-black">Crucetiko</strong> — y ayudá a <strong className="text-white">Otico</strong> a cruzar la carretera para llegar a salvo al Parque Nacional.
                </>
              )}
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-stone-800 flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-bold">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>
                {isEnglish 
                  ? "You can earn up to 90 additional XP per day!" 
                  : "¡Podés ganar hasta 90 XP adicionales por día!"}
              </span>
            </div>
          </div>

          {/* Características Clave (Visualmente atractivas en móvil y desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
            <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-2.5 flex sm:flex-col items-center sm:items-start gap-2.5 text-left">
              <span className="text-lg">🚦</span>
              <div>
                <div className="text-[11px] font-black text-white">{isEnglish ? "3 Daily Turns" : "3 Turnos Diarios"}</div>
                <div className="text-[10px] text-stone-400 leading-tight">{isEnglish ? "Easy to challenging" : "Dificultad progresiva"}</div>
              </div>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-2.5 flex sm:flex-col items-center sm:items-start gap-2.5 text-left">
              <span className="text-lg">🌿</span>
              <div>
                <div className="text-[11px] font-black text-white">{isEnglish ? "Canopy Bridge" : "Puente Aéreo"}</div>
                <div className="text-[10px] text-stone-400 leading-tight">{isEnglish ? "Gather guarumo leaves" : "Junta hojas de guarumo"}</div>
              </div>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-2.5 flex sm:flex-col items-center sm:items-start gap-2.5 text-left">
              <span className="text-lg">⭐</span>
              <div>
                <div className="text-[11px] font-black text-white">{isEnglish ? "+90 XP Daily" : "+90 XP al Día"}</div>
                <div className="text-[10px] text-stone-400 leading-tight">{isEnglish ? "Boost your explorer rank" : "Sube tu rango tico"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones (Botón Grande en Celular y Escritorio) */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handlePlayNow}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isEnglish ? "Play Crucetiko Now!" : "¡Jugar Crucetiko Ahora!"}</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={handleClose}
            className="py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs sm:text-sm border border-stone-700 transition-colors active:scale-95 cursor-pointer text-center"
          >
            {isEnglish ? "Maybe later" : "Más tarde"}
          </button>
        </div>

      </div>
    </div>
  );
}

