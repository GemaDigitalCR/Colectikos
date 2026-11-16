"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Users, Award, ShieldCheck, Sun } from 'lucide-react';
import { useDictionary } from '../context/DictionaryContext';

export default function TikoPlayaMissionWidget() {
  const dict = useDictionary();
  const lang = dict?.lang === 'en' ? 'en' : 'es';
  const isEn = lang === 'en';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 md:mb-8 transition-all duration-300">
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-amber-500 via-emerald-600 to-teal-700 text-white shadow-xl border border-amber-300/40 p-5 sm:p-6 md:p-8">
        
        {/* Elementos decorativos de fondo */}
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Lado Izquierdo: Mascota y Textos */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center p-1.5 shadow-lg">
              <img 
                src="/assets/playa/otico.png" 
                alt="Otico Playero" 
                className="w-full h-full object-contain filter drop-shadow-md transform -rotate-3 hover:rotate-0 transition-transform"
              />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-900 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                <Sun size={11} className="text-amber-800 animate-spin" style={{ animationDuration: '8s' }} />
                <span>HOT</span>
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-100 tracking-wider uppercase mb-1.5 border border-white/25">
                <Sparkles size={12} className="text-amber-300" />
                <span>{isEn ? "Daily Coastguard Mission" : "Misión Diaria del Guardacostas"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                {isEn ? "Build Tiko Beach & Earn Passport XP!" : "¡Construye en Tiko Playa y Gana XP para tu Pasaporte!"}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-50 mt-1 max-w-xl leading-relaxed font-medium">
                {isEn 
                  ? "Manage your beach, balance food, lodging and fun demand, keep the sand clean and turn visitors into real XP milestones."
                  : "Diseña tu playa, atiende la demanda de comida, hospedaje y diversión, mantén la arena limpia y convierte a tus visitantes en hitos de XP."}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Insignias de Beneficios y Botón CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {/* Badges de recompensas */}
            <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-bold bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-amber-200">
                <Award size={15} />
                <span>{isEn ? "+25 to +200 XP Milestones" : "Hitos de +25 a +200 XP"}</span>
              </div>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1.5 text-emerald-200">
                <Users size={15} />
                <span>{isEn ? "Every 10s Payout" : "Pagos cada 10s"}</span>
              </div>
            </div>

            {/* Botón CTA directo */}
            <Link
              href={`/${lang}/community/playa`}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-amber-100 text-stone-900 font-black text-sm transition-all duration-200 shadow-lg hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span className="text-base">🏖️</span>
              <span>{isEn ? "Play Tiko Beach Now" : "Ir a Tiko Playa Ahora"}</span>
              <ArrowRight size={16} className="text-emerald-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
