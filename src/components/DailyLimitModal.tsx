"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDictionary } from '../context/DictionaryContext';

interface DailyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

export default function DailyLimitModal({ isOpen, onClose, lang: propLang }: DailyLimitModalProps) {
  const [mounted, setMounted] = useState(false);
  const dict = useDictionary();

  // Determinar idioma (por prop o por DictionaryContext)
  const lang = propLang || dict?.lang || 'es';
  const isEn = lang === 'en';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Efecto de confeti festivo sutil al abrirse
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6']
        });
      } catch (e) {
        // Fallback silencioso si no está disponible canvas
      }
    }
  }, [isOpen]);

  if (!mounted) return null;

  const content = {
    es: {
      title: "¡Misión cumplida por hoy! 🌟",
      body: "Has desbloqueado tus 4 postales diarias. ¡Vuelve mañana por más sorpresas! Mientras tanto, la aventura continúa: ¡ve a la sección de Comunidad, diviértete con nuestros minijuegos y sigue sumando XP!",
      primaryCta: "🕹️ Jugar y ganar XP",
      secondaryCta: "Volver al álbum",
      dailyBadge: "4 / 4 Postales Completadas",
    },
    en: {
      title: "Mission accomplished for today! 🌟",
      body: "You've unlocked your 4 daily postcards. Come back tomorrow for more surprises! Meanwhile, the adventure continues: head over to the Community section, play our mini-games, and keep earning XP!",
      primaryCta: "🕹️ Play & earn XP",
      secondaryCta: "Back to album",
      dailyBadge: "4 / 4 Daily Postcards Completed",
    }
  };

  const text = isEn ? content.en : content.es;
  const communityUrl = `/${lang}/community`;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay oscuro con desenfoque suave */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm"
          />

          {/* Modal / Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-stone-100 flex flex-col items-center text-center overflow-hidden z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Manija táctil de Bottom Sheet para pantallas móviles */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            {/* Botón de cierre en esquina superior */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>

            {/* Decoración superior con icono animado y badges */}
            <div className="relative mb-4 mt-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 flex items-center justify-center text-4xl sm:text-5xl shadow-xl ring-8 ring-amber-100/70">
                🌟
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
                <Sparkles size={16} className="animate-spin-slow" />
              </div>
            </div>

            {/* Badge de logro diario */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {text.dailyBadge}
            </span>

            {/* Título */}
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight mb-3 px-2">
              {text.title}
            </h2>

            {/* Cuerpo del mensaje */}
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6 font-medium px-1 sm:px-2">
              {text.body}
            </p>

            {/* Acciones (CTAs) */}
            <div className="w-full flex flex-col gap-2.5 sm:gap-3">
              <Link
                href={communityUrl}
                onClick={onClose}
                className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Gamepad2 size={20} className="shrink-0" />
                <span>{text.primaryCta}</span>
                <ArrowRight size={18} className="shrink-0 opacity-80" />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 sm:py-3.5 px-6 text-stone-500 hover:text-stone-800 font-bold text-sm sm:text-base rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                {text.secondaryCta}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
