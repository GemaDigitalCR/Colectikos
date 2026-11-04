"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Heart, X, Sparkles, ChevronRight } from 'lucide-react';
import { getUserReviewStats } from '../actions/progress';

const STORAGE_KEY = 'colectikos_seen_likes_count';

export default function CommunityLikesToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [newLikesCount, setNewLikesCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const pathname = usePathname();
  const { user, isLoaded: clerkLoaded } = useUser();

  const isEn = pathname ? pathname.startsWith('/en') : false;
  const currentLang = isEn ? 'en' : 'es';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!clerkLoaded || !user) return;

    let localUsername = user?.username || undefined;
    try {
      const saved = localStorage.getItem('userProfileData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) localUsername = parsed.username;
      }
    } catch (e) {}

    const checkLikes = async () => {
      try {
        const res = await getUserReviewStats(localUsername, user.id);
        if (!res.success || !res.stats) return;

        const currentTotal = res.stats.totalLikesReceived;
        setTotalLikes(currentTotal);

        // Si ya está en la página de perfil, sincronizar y no mostrar toast molesto
        if (pathname && pathname.includes('/profile')) {
          localStorage.setItem(STORAGE_KEY, currentTotal.toString());
          setIsVisible(false);
          return;
        }

        const rawSeen = localStorage.getItem(STORAGE_KEY);
        if (rawSeen === null) {
          // Primera vez: inicializamos el contador para no alarmar con todo el histórico
          localStorage.setItem(STORAGE_KEY, currentTotal.toString());
          return;
        }

        const lastSeen = parseInt(rawSeen, 10);
        if (!isNaN(lastSeen) && currentTotal > lastSeen) {
          const diff = currentTotal - lastSeen;
          setNewLikesCount(diff);
          // Esperar 2.5s para no interrumpir la carga inicial de página
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 2500);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Error checking community likes:', err);
      }
    };

    checkLikes();
  }, [clerkLoaded, user, pathname]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, totalLikes.toString());
    }
  };

  if (!isVisible || newLikesCount <= 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[90] max-w-sm w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 border-rose-200/90 flex items-start gap-3.5 relative overflow-hidden">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/10 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />

        {/* Icono de Corazón palpitante */}
        <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25 relative animate-bounce">
          <Heart size={22} className="fill-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>

        {/* Contenido */}
        <div className="flex-1 pr-4 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/70">
              {isEn ? 'Community Impact' : 'Impacto Comunitario'}
            </span>
          </div>

          <h4 className="text-sm font-extrabold text-stone-900 leading-tight">
            {isEn 
              ? `You received ${newLikesCount} new ${newLikesCount > 1 ? 'likes' : 'like'}! ❤️`
              : `¡Recibiste ${newLikesCount} nuevo${newLikesCount > 1 ? 's' : ''} ❤️ en el Muro!`}
          </h4>

          <p className="text-xs text-stone-600 mt-1 leading-snug">
            {isEn
              ? `Explorers loved your recommendations and tips.`
              : `A otros exploradores les encantaron tus consejos de viaje.`}
          </p>

          <Link
            href={`/${currentLang}/profile#impacto-comunitario`}
            onClick={handleDismiss}
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline group"
          >
            <span>{isEn ? 'View my impact in profile' : 'Ver mi impacto en perfil'}</span>
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleDismiss}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
          title={isEn ? 'Dismiss' : 'Cerrar'}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
