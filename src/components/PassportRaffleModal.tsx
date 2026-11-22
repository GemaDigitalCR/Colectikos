'use client';

import React, { useState, useEffect } from 'react';
import { X, Gift, Sparkles, Clock, Share2, ArrowRight } from 'lucide-react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Fecha límite: 26 de noviembre de 2026 a las 23:59:59 hora de Costa Rica (UTC-6)
const RAFFLE_DEADLINE = new Date('2026-11-26T23:59:59-06:00');
const SESSION_KEY = 'colectikos_passport_raffle_nov26_session';
const LAST_USER_KEY = 'colectikos_passport_raffle_nov26_user';

export default function PassportRaffleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number>(5);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const isEnglish = params?.lang === 'en' || pathname?.startsWith('/en');
  const lang = isEnglish ? 'en' : 'es';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = new Date();
    // Desactivar automáticamente después del 26 de noviembre a las 11:59:59 PM (CR)
    if (now > RAFFLE_DEADLINE) {
      setIsOpen(false);
      return;
    }

    // Calcular días restantes hasta el 26 de noviembre
    const diffMs = RAFFLE_DEADLINE.getTime() - now.getTime();
    const calculatedDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    setDaysLeft(calculatedDays);

    // No interrumpir dentro de páginas de login/registro o dentro de un juego arcade activo
    if (
      pathname?.includes('/login') ||
      pathname?.includes('/sign-up') ||
      pathname?.includes('/community/crucetiko') ||
      pathname?.includes('/community/crucetikas') ||
      pathname?.includes('/community/sopitika') ||
      pathname?.includes('/community/parejitikas') ||
      pathname?.includes('/community/preguntikas') ||
      pathname?.includes('/community/playa')
    ) {
      setIsOpen(false);
      return;
    }

    // Permitir forzar vista previa con ?showRaffleModal=true
    const searchParams = new URLSearchParams(window.location.search);
    const forceShow = searchParams.get('showRaffleModal') === 'true';

    if (!isLoaded) return;

    const currentUserId = user?.id || 'guest';
    const seenInSession = sessionStorage.getItem(SESSION_KEY);
    const lastUserSeen = sessionStorage.getItem(LAST_USER_KEY);

    // Mostrar en cada nueva sesión O cuando el usuario acaba de iniciar sesión (cambio de guest -> user.id)
    const justLoggedIn = currentUserId !== 'guest' && lastUserSeen !== currentUserId;

    if (!seenInSession || justLoggedIn || forceShow) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(LAST_USER_KEY, currentUserId);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [pathname, isLoaded, user?.id]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
      if (user?.id) {
        sessionStorage.setItem(LAST_USER_KEY, user.id);
      }
    } catch {}
  };

  const handleGoToPassport = () => {
    handleClose();
    try {
      // Evitar que el WelcomeModal bloquee si viene desde otra vista
      sessionStorage.setItem('hasSeenWelcomeModal', 'true');
    } catch {}
    router.push(`/${lang}/profile?export=passport`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-300">
      <div
        className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-amber-400/60 rounded-[2rem] shadow-2xl max-w-md w-full relative overflow-hidden text-stone-100 p-6 sm:p-7 max-h-[94dvh] flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passport-raffle-title"
      >
        {/* Efectos de luz ambiental */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors bg-stone-800/80 hover:bg-stone-700 rounded-full p-2 border border-stone-700/80 cursor-pointer z-20"
          aria-label={isEnglish ? 'Close reminder' : 'Cerrar recordatorio'}
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto pr-0.5">
          {/* Badge Superior */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
            <Gift size={14} className="text-amber-400 animate-bounce" />
            <span>{isEnglish ? 'Special Passport Giveaway!' : '¡Sorteo Especial del Pasaporte!'}</span>
          </div>

          {/* Encabezado con Otico */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 via-emerald-500/20 to-teal-500/30 border-2 border-amber-400/60 flex items-center justify-center shadow-lg shrink-0 overflow-hidden p-1.5">
              <img
                src="/images/Imagenes_Pagina/Otico%20senalando.png"
                alt="Otico"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
            <div>
              <h2
                id="passport-raffle-title"
                className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight"
              >
                {isEnglish ? 'Share & Win 3 Prizes!' : '¡Compartí tu Pasaporte y Ganá!'}
              </h2>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1 mt-0.5">
                <Sparkles size={12} />
                <span>{isEnglish ? '3 Awesome Prizes Up for Grabs' : 'Rifa de 3 Premios Buenísimos 🎁'}</span>
              </p>
            </div>
          </div>

          {/* Mensaje Principal */}
          <div className="bg-stone-950/90 border border-amber-400/30 rounded-2xl p-4 mb-4 shadow-inner">
            <p className="text-sm sm:text-base text-stone-100 leading-relaxed font-medium">
              {isEnglish ? (
                <>
                  Share your <strong className="text-amber-300 font-extrabold">Digital Passport</strong> on your social media stories, tag{' '}
                  <strong className="text-emerald-400 font-black">@Colectikos</strong>, and you&apos;ll be entered into a raffle for{' '}
                  <strong className="text-amber-300 font-extrabold">3 awesome prizes</strong>!
                </>
              ) : (
                <>
                  Compartí tu <strong className="text-amber-300 font-extrabold">Pasaporte Digital</strong> en tus historias de redes sociales, etiquetá a{' '}
                  <strong className="text-emerald-400 font-black">@Colectikos</strong>, y quedá participando en una rifa de{' '}
                  <strong className="text-amber-300 font-extrabold">3 premios buenísimos</strong>.
                </>
              )}
            </p>

            {/* Pasos rápidos */}
            <div className="mt-3.5 pt-3 border-t border-stone-800/90 grid grid-cols-3 gap-2 text-center">
              <div className="bg-stone-900/90 rounded-xl p-2 border border-stone-800">
                <div className="text-base mb-0.5">🛂</div>
                <div className="text-[11px] font-bold text-stone-200 leading-tight">
                  {isEnglish ? '1. Export Passport' : '1. Descargá tu Pasaporte'}
                </div>
              </div>
              <div className="bg-stone-900/90 rounded-xl p-2 border border-stone-800">
                <div className="text-base mb-0.5">📲</div>
                <div className="text-[11px] font-bold text-stone-200 leading-tight">
                  {isEnglish ? '2. Post to Stories' : '2. Subilo a tus Historias'}
                </div>
              </div>
              <div className="bg-stone-900/90 rounded-xl p-2 border border-stone-800">
                <div className="text-base mb-0.5">🏷️</div>
                <div className="text-[11px] font-bold text-emerald-400 leading-tight">
                  {isEnglish ? '3. Tag @Colectikos' : '3. Etiquetá a @Colectikos'}
                </div>
              </div>
            </div>
          </div>

          {/* Banner de Fecha Límite */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-rose-500/20 border border-amber-400/40 mb-4">
            <div className="flex items-center gap-2 text-amber-200 text-xs sm:text-sm font-extrabold">
              <Clock size={16} className="text-amber-400 shrink-0" />
              <span>
                {isEnglish ? 'Deadline: November 26' : 'Fecha límite: 26 de noviembre'}
              </span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-xs">
              {daysLeft <= 1
                ? (isEnglish ? 'Last Day!' : '¡Último día!')
                : (isEnglish ? `${daysLeft} days left` : `Quedan ${daysLeft} días`)}
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="pt-2 flex flex-col gap-2.5 border-t border-stone-800">
          <button
            type="button"
            onClick={handleGoToPassport}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
          >
            <Share2 size={17} className="text-stone-900" />
            <span>
              {isEnglish ? 'Download My Digital Passport Now' : 'Descargar mi Pasaporte Digital Ahora'}
            </span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
          >
            {isEnglish ? 'Remind me next session' : '¡Entendido! Lo haré en un momento'}
          </button>
        </div>
      </div>
    </div>
  );
}
