"use client";

import React from 'react';
import { X, Share2, Download, Smartphone } from 'lucide-react';

interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onShareNative?: () => void;
  canShareNative?: boolean;
  dict?: any;
}

export default function PassportModal({
  isOpen,
  onClose,
  imageUrl,
  onShareNative,
  canShareNative = false,
  dict
}: PassportModalProps) {
  if (!isOpen || !imageUrl) return null;

  const isEn = dict?.lang === 'en';

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>🇨🇷</span> {dict?.profile?.posterTitleLine1 || 'Mi Pasaporte Digital'}
            </h3>
            <p className="text-xs text-stone-400 font-medium">
              {isEn ? 'Your official adventure poster is ready!' : '¡Tu póster oficial de aventuras está listo!'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label={isEn ? "Close" : "Cerrar"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-stone-950/50">
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
            <img 
              src={imageUrl} 
              alt={isEn ? "Colectikos Digital Passport" : "Pasaporte Digital Colectikos"} 
              className="w-full h-auto object-contain block"
            />
          </div>

          {/* iOS Tip Banner */}
          <div className="mt-4 w-full bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-3 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200 leading-relaxed font-medium">
              <span className="font-bold text-emerald-300">
                {isEn ? 'Mobile Tip (iPhone / Safari):' : 'Consejo para iPhone / Móvil:'}
              </span>{' '}
              {isEn
                ? "Press and hold the image above to select 'Save to Photos' or 'Share'."
                : "Mantén presionada la imagen arriba y selecciona 'Guardar en Fotos' o 'Compartir'."}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex flex-wrap gap-2.5 sm:gap-3 justify-end items-center">
          {canShareNative && onShareNative && (
            <button
              onClick={onShareNative}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all"
            >
              <Share2 size={16} />
              <span>{isEn ? 'Share' : 'Compartir'}</span>
            </button>
          )}

          <a
            href={imageUrl}
            download={isEn ? "My-Colectikos-Passport.png" : "Mi-Pasaporte-Colectikos.png"}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-sm border border-stone-700 transition-all shadow"
          >
            <Download size={16} />
            <span>{isEn ? 'Download' : 'Descargar'}</span>
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 rounded-xl text-stone-400 hover:text-white font-semibold text-sm transition-colors text-center"
          >
            {isEn ? 'Close' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
