"use client";

import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';

export default function InstallBanner() {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // Verificar si el banner fue cerrado antes
    const dismissed = sessionStorage.getItem('colectikos_install_banner_dismissed') || sessionStorage.getItem('ticos100_install_banner_dismissed');
    
    // Verificar modo standalone (PWA ya instalada)
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isStandaloneNav = (navigator as any).standalone === true;
    const installed = standaloneMedia || isStandaloneNav;

    setIsStandalone(installed);
    
    if (!dismissed && !installed) {
      setIsDismissed(false);
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Escuchar el evento 'beforeinstallprompt' (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('colectikos_install_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsDismissed(true);
    }
  };

  if (isDismissed || isStandalone) return null;

  return (
    <>
      {/* Overlay oscuro para darle foco al modal (opcional, pero ayuda a que se vea como en el ejemplo) */}
      <div className="md:hidden fixed inset-0 bg-black/20 z-[90] backdrop-blur-sm transition-opacity" onClick={handleDismiss} />
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white text-stone-800 p-6 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe animate-slide-up">
        
        {/* Encabezado: Logo, Título y Botón de Cerrar */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <img 
              src="/images/icon-192x192.png" 
              alt="Colectikos" 
              className="w-14 h-14 rounded-2xl shadow-sm border border-stone-100 object-cover" 
            />
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Instalar Colectikos</h3>
              <p className="text-sm text-stone-500 font-medium mt-0.5">Acceso rápido y sin conexión.</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="bg-stone-100 hover:bg-stone-200 text-stone-500 p-2 rounded-full transition-colors flex-shrink-0"
            aria-label="Cerrar banner de instalación"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Contenido (Instrucciones iOS vs Botón Android) */}
        {isIOS ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 flex-shrink-0">
                1
              </div>
              <p className="text-sm font-medium text-stone-700">
                Toca el botón <Share size={16} className="inline mx-1 text-emerald-600" /> <strong className="text-stone-900">Compartir</strong> en la barra inferior.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 flex-shrink-0">
                2
              </div>
              <p className="text-sm font-medium text-stone-700">
                Selecciona <PlusSquare size={16} className="inline mx-1 text-emerald-600" /> <strong className="text-stone-900">Agregar al Inicio</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-stone-600">
              Disfruta de una experiencia más fluida, en pantalla completa y colecciona postales en todos tus rides.
            </p>
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-emerald-600 text-white font-bold text-lg px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
              >
                <Download size={20} /> Instalar Aplicación
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
