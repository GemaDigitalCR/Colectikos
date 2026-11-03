"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useProgress } from '../context/ProgressContext';
import { X, ArrowRight, User } from 'lucide-react';

const STORAGE_KEY = 'colectikos_profile_reminder_dismissed_at';
const COOLDOWN_DAYS = 3; // No volver a molestar si lo cerró en los últimos 3 días

export default function ProfileReminderToast() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { userProfile } = useProgress();

  const isEn = pathname ? pathname.startsWith('/en') : false;
  const currentLang = isEn ? 'en' : 'es';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!clerkLoaded || !user) return;

    // Si ya está en la página de perfil, no tiene sentido mostrar el recordatorio
    if (pathname && pathname.includes('/profile')) {
      setIsVisible(false);
      return;
    }

    // 1. Verificar si el perfil ya está completo (provincia y rango de edad)
    let isProfileComplete = false;

    if (userProfile) {
      const hasLocation = Boolean(userProfile.location && userProfile.location.trim().length > 0);
      const hasAge = Boolean(userProfile.ageRange && userProfile.ageRange.trim().length > 0);
      if (hasLocation && hasAge) {
        isProfileComplete = true;
      }
    } else {
      // Fallback a localStorage
      try {
        const saved = localStorage.getItem('userProfileData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.location && parsed.ageRange) {
            isProfileComplete = true;
          }
        }
      } catch (e) {}
    }

    // Si ya completó su perfil, NUNCA mostrar el aviso
    if (isProfileComplete) {
      setIsVisible(false);
      return;
    }

    // 2. Verificar si el usuario lo cerró recientemente
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);
      if (dismissedAt) {
        const diffMs = Date.now() - parseInt(dismissedAt, 10);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays < COOLDOWN_DAYS) {
          return; // Sigue en periodo de descanso
        }
      }
    } catch (e) {}

    // 3. Mostrar sutilmente después de 3.5 segundos de navegación
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [clerkLoaded, user, userProfile, pathname]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (e) {}
  };

  if (!isVisible) return null;

  const displayName = userProfile?.username || user?.firstName || (isEn ? 'Explorer' : 'Explorador');

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-96 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-100 p-4 sm:p-5 flex flex-col gap-3 relative ring-1 ring-black/5">
        
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition-colors"
          title={isEn ? "Dismiss" : "Cerrar"}
        >
          <X size={16} />
        </button>

        {/* Encabezado y texto */}
        <div className="flex items-start gap-3 pr-6">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
            <User size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 leading-snug">
              🧭 {isEn ? `Hi, ${displayName}!` : `¡Hola, ${displayName}!`}
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mt-1">
              {isEn 
                ? "When you have a moment, remember to visit your Profile to customize your traveler preferences." 
                : "Cuando tengas un ratito libre, recuerda pasar por tu Perfil para terminar de personalizar tus preferencias de viaje."}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            {isEn ? "Got it" : "Entendido"}
          </button>
          
          <Link
            href={`/${currentLang}/profile`}
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
          >
            <span>{isEn ? "Go to Profile" : "Ir a mi Perfil"}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </div>
  );
}
