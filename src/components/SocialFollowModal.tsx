'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, Copy, Check, Gift } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export default function SocialFollowModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const params = useParams();
  const pathname = usePathname();

  const isEnglish = params?.lang === 'en';

  useEffect(() => {
    // No mostrar dentro de pantallas de juego activo para no interrumpir al usuario
    if (
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

    // Permitir forzar el pop-up con ?showSocialModal=true para pruebas y diseño
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceShow = searchParams?.get('showSocialModal') === 'true';

    // Verificar si el usuario ya vio o interactuó con el modal
    const hasSeenModal = localStorage.getItem('hasSeenSocialFollowModal_v1');
    if (hasSeenModal && !forceShow) {
      return;
    }

    // Esperar un momento agradable tras cargar la página para no colisionar con la carga inicial
    // Si está en la página principal, dar margen al WelcomeModal
    const delay = pathname === '/' || pathname === '/es' || pathname === '/en' ? 2400 : 1200;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem('hasSeenSocialFollowModal_v1', 'true');
    } catch {
      // Ignorar en entornos con almacenamiento deshabilitado
    }
  };

  const handleCopyHandle = async () => {
    try {
      await navigator.clipboard.writeText('COLECTIKOS');
      setCopied(true);
      toast.success(
        isEnglish
          ? 'Handle copied: COLECTIKOS'
          : '¡Usuario copiado: COLECTIKOS! Buscanos en tu app favorita'
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info('Búscanos como: COLECTIKOS');
    }
  };

  const handleSocialClick = () => {
    // Marcar como visto al interactuar con cualquier red
    try {
      localStorage.setItem('hasSeenSocialFollowModal_v1', 'true');
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-300">
      <div
        className="bg-stone-900 border-2 border-emerald-500/40 rounded-[2rem] shadow-2xl max-w-md w-full relative overflow-hidden text-stone-100 p-6 sm:p-7 max-h-[94dvh] flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-modal-title"
      >
        {/* Glows y luces ambientales de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar (X) */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors bg-stone-800/80 hover:bg-stone-700 rounded-full p-2 border border-stone-700/80 cursor-pointer z-20 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
          aria-label={isEnglish ? 'Close modal' : 'Cerrar ventana'}
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto pr-0.5">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-emerald-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
            <Gift size={13} className="text-amber-400 animate-pulse" />
            <span>{isEnglish ? 'Giveaways & Dynamics!' : '¡Promos & Dinámicas!'}</span>
          </div>

          {/* Encabezado con Mascota Otico */}
          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-pink-500/30 border-2 border-emerald-400/50 flex items-center justify-center shadow-lg shrink-0 overflow-hidden p-1.5">
              <img
                src="/images/Imagenes_Pagina/Otico%20senalando.png"
                alt="Otico"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
            <div>
              <h2
                id="social-modal-title"
                className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight"
              >
                {isEnglish ? 'Follow Us & Win!' : '¡Seguinos y Ganá!'}
              </h2>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1 mt-0.5">
                <Sparkles size={12} />
                <span>{isEnglish ? 'Colectikos Community' : 'Comunidad Colectikos 🇨🇷'}</span>
              </p>
            </div>
          </div>

          {/* Mensaje Principal */}
          <div className="bg-stone-950/80 border border-emerald-500/25 rounded-2xl p-4 mb-4 shadow-inner">
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-medium">
              {isEnglish ? (
                <>
                  Follow us on social media so you don&apos;t miss our{' '}
                  <strong className="text-amber-300 font-extrabold">promos and dynamics</strong>.
                </>
              ) : (
                <>
                  Seguinos en redes sociales para que no te pierdas nuestras{' '}
                  <strong className="text-amber-300 font-extrabold">promos y dinámicas</strong>.
                </>
              )}
            </p>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 font-normal">
              {isEnglish ? (
                <>
                  Find us on <strong className="text-white">TikTok</strong>,{' '}
                  <strong className="text-white">Instagram</strong>, and{' '}
                  <strong className="text-white">Facebook</strong> as:
                </>
              ) : (
                <>
                  Buscanos en <strong className="text-white">TikTok</strong>,{' '}
                  <strong className="text-white">Instagram</strong> y{' '}
                  <strong className="text-white">Facebook</strong> como:
                </>
              )}
            </p>

            {/* Barra interactiva de copiado rápido del usuario */}
            <div className="mt-3 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-stone-400 font-bold uppercase shrink-0">Usuario:</span>
                <span className="text-emerald-400 font-black text-base tracking-wider truncate">
                  COLECTIKOS
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyHandle}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-400/40 transition-all active:scale-95 cursor-pointer"
                title={isEnglish ? 'Copy username' : 'Copiar usuario'}
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? (isEnglish ? 'Copied!' : '¡Copiado!') : isEnglish ? 'Copy' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Redes Sociales con Enlaces Directos */}
          <div className="space-y-2.5 mb-4">
            {/* 1. Instagram */}
            <a
              href="https://instagram.com/Colectikos"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSocialClick}
              className="group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#833ab4]/30 via-[#fd1d1d]/20 to-[#fcb045]/20 hover:from-[#833ab4]/45 hover:via-[#fd1d1d]/35 hover:to-[#fcb045]/35 border border-pink-500/40 hover:border-pink-400 transition-all active:scale-[0.98] shadow-md shadow-pink-950/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-md shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-white text-sm group-hover:text-pink-300 transition-colors">
                    Instagram
                  </div>
                  <div className="text-xs text-pink-200/80 font-medium">@Colectikos · Fotos & Reels</div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white shadow-sm transition-all group-hover:translate-x-0.5">
                <span>{isEnglish ? 'Follow' : 'Seguir'}</span>
                <ExternalLink size={12} />
              </span>
            </a>

            {/* 2. TikTok */}
            <a
              href="https://www.tiktok.com/@colectikos"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSocialClick}
              className="group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 hover:border-cyan-400/60 transition-all active:scale-[0.98] shadow-md shadow-stone-950/40 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-cyan-500/10 via-pink-500/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-black border border-stone-700 flex items-center justify-center text-white shadow-md shrink-0">
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.33V9.05a8.16 8.16 0 0 0 4.91 1.63v-3.5a4.85 4.85 0 0 1-1-.49z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-white text-sm group-hover:text-cyan-300 transition-colors">
                    TikTok
                  </div>
                  <div className="text-xs text-stone-300 font-medium">@colectikos · Videos & Retos</div>
                </div>
              </div>
              <span className="relative z-10 flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 shadow-sm transition-all group-hover:translate-x-0.5">
                <span>{isEnglish ? 'Follow' : 'Seguir'}</span>
                <ExternalLink size={12} />
              </span>
            </a>

            {/* 3. Facebook */}
            <a
              href="https://facebook.com/Colectikos"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSocialClick}
              className="group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/40 hover:border-blue-400 transition-all active:scale-[0.98] shadow-md shadow-blue-950/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shadow-md shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-white text-sm group-hover:text-blue-300 transition-colors">
                    Facebook
                  </div>
                  <div className="text-xs text-blue-200/80 font-medium">Colectikos · Comunidad</div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-blue-500 text-white shadow-sm transition-all group-hover:translate-x-0.5">
                <span>{isEnglish ? 'Follow' : 'Seguir'}</span>
                <ExternalLink size={12} />
              </span>
            </a>
          </div>
        </div>

        {/* Acciones Inferiores */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-stone-800">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer text-center"
          >
            {isEnglish ? 'Done / Already Following! ✨' : '¡Listo, ya los sigo! ✨'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="py-2 px-3 text-stone-400 hover:text-stone-200 text-xs font-medium transition-colors cursor-pointer text-center"
          >
            {isEnglish ? 'Maybe later' : 'Más tarde'}
          </button>
        </div>
      </div>
    </div>
  );
}
