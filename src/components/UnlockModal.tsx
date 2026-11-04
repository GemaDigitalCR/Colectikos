"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, Navigation, Award, Sparkles } from 'lucide-react';
import { useDictionary } from '../context/DictionaryContext';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'Curioso' | 'Nómada' | 'Conquistador') => void;
  title?: string;
  subtitle?: string;
}

export default function UnlockModal({ isOpen, onClose, onSelectMode, title, subtitle }: UnlockModalProps) {
  const dict = useDictionary();
  const mDict = dict?.unlockModal;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4 bg-stone-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:w-[380px] max-h-[90vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border-t border-white/40 sm:border sm:border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
          <div className="w-12 h-1.5 bg-stone-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="pt-2 sm:pt-8 pb-5 px-6 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hidden sm:block"></div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 shadow-sm border border-emerald-100 rotate-3">
            <Sparkles size={32} className="text-emerald-500" strokeWidth={1.5} />
          </div>

          <h2 className="text-2xl font-black text-stone-800 tracking-tight">
            {title || mDict?.title || "¡Desbloqueando!"}
          </h2>
          <p className="text-stone-500 text-sm mt-2 font-medium leading-relaxed px-4">
            {subtitle || mDict?.subtitle || "¿Cómo conociste este destino?"}
          </p>
        </div>

        {/* Options */}
        <div className="p-4 sm:p-6 pt-2 sm:pt-2 flex flex-col gap-3.5 overflow-y-auto bg-stone-50/80 border-t border-stone-100">
          
          {/* Card: Curioso */}
          <button 
            onClick={() => onSelectMode('Curioso')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200/60 bg-white hover:border-[#cd7f32] hover:shadow-lg hover:shadow-[#cd7f32]/10 transition-all text-left group"
          >
            <div className="w-12 h-12 shrink-0 bg-stone-50 group-hover:bg-[#cd7f32]/10 rounded-full flex items-center justify-center text-stone-400 group-hover:text-[#cd7f32] transition-colors">
              <Eye size={22} />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-base leading-tight group-hover:text-[#cd7f32] transition-colors">{mDict?.curioso || "Modo Curioso"}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-snug font-medium">{mDict?.curiosoDesc || "Solo quiero ver la postal"}</p>
            </div>
          </button>

          {/* Card: Nómada */}
          <button 
            onClick={() => onSelectMode('Nómada')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200/60 bg-white hover:border-stone-400 hover:shadow-lg hover:shadow-stone-400/10 transition-all text-left group"
          >
            <div className="w-12 h-12 shrink-0 bg-stone-50 group-hover:bg-stone-200/50 rounded-full flex items-center justify-center text-stone-400 group-hover:text-stone-600 transition-colors">
              <Navigation size={22} />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-base leading-tight group-hover:text-stone-600 transition-colors">{mDict?.nomada || "Modo Nómada"}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-snug font-medium">{mDict?.nomadaDesc || "Lo vi de pasadita"}</p>
            </div>
          </button>

          {/* Card: Conquistador */}
          <button 
            onClick={() => onSelectMode('Conquistador')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200/60 bg-white hover:border-[#ffd700] hover:shadow-lg hover:shadow-[#ffd700]/20 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#ffd700]/15 to-transparent rounded-bl-2xl"></div>
            <div className="w-12 h-12 shrink-0 bg-stone-50 group-hover:bg-[#ffd700]/20 rounded-full flex items-center justify-center text-stone-400 group-hover:text-amber-500 transition-colors relative z-10">
              <Award size={22} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-stone-800 text-base leading-tight group-hover:text-amber-600 transition-colors">{mDict?.conquistador || "Modo Conquistador"}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-snug font-medium">{mDict?.conquistadorDesc || "Lo caminé, lo observé, lo disfruté"}</p>
            </div>
          </button>
        </div>
        
        {/* Bottom padding for mobile safe area */}
        <div className="h-6 bg-stone-50/80 sm:hidden"></div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
