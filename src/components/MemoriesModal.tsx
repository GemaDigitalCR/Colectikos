"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, BookOpen, PawPrint, Check, Lock, Users, Globe } from 'lucide-react';
import { useDictionary } from '../context/DictionaryContext';
import { Lugar } from '../data/mockData';
import toast from 'react-hot-toast';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lugar: Lugar;
  isProv: boolean;
  currentDetails: { date: string; note: string; isPublic?: boolean };
  updatePlaceDetails: (id: string, date: string, note: string, isPublic?: boolean) => void;
  handleRate?: (id: string, score: number) => Promise<void>;
  rating: number;
}

export default function MemoriesModal({ 
  isOpen, 
  onClose, 
  lugar, 
  isProv,
  currentDetails,
  updatePlaceDetails,
  handleRate,
  rating: initialRating
}: MemoriesModalProps) {
  const dict = useDictionary();
  const isEn = dict?.categories?.ALL === 'All' || dict?.lang === 'en';
  const [mounted, setMounted] = useState(false);
  const [draftDate, setDraftDate] = useState(currentDetails.date);
  const [draftNote, setDraftNote] = useState(currentDetails.note);
  const [isPublic, setIsPublic] = useState<boolean>(currentDetails.isPublic ?? false);
  const [rating, setRating] = useState<number>(initialRating);

  const draftDateRef = useRef(draftDate);
  draftDateRef.current = draftDate;
  const draftNoteRef = useRef(draftNote);
  draftNoteRef.current = draftNote;
  const isPublicRef = useRef(isPublic);
  isPublicRef.current = isPublic;
  const currentDetailsRef = useRef(currentDetails);
  currentDetailsRef.current = currentDetails;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDraftDate(currentDetails.date);
      setDraftNote(currentDetails.note);
      setIsPublic(currentDetails.isPublic ?? false);
      setRating(initialRating);
    }
  }, [isOpen, currentDetails, initialRating]);

  // Función de auto-guardado centralizada y resiliente
  const performSave = (showToast = false) => {
    const isDirty = 
      draftDateRef.current !== currentDetailsRef.current.date || 
      draftNoteRef.current !== currentDetailsRef.current.note ||
      isPublicRef.current !== (currentDetailsRef.current.isPublic ?? false);

    if (isDirty) {
      updatePlaceDetails(lugar.id, draftDateRef.current, draftNoteRef.current, isPublicRef.current);
      if (showToast) {
        toast.success(dict?.placeCard?.savedSuccessfully || '¡Guardado!');
      }
      return true;
    }
    return false;
  };

  const handleClose = () => {
    performSave(true);
    onClose();
  };

  // Guardar si se presiona la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Si el modal se desmonta mientras está abierto con cambios pendientes, asegurar guardado
  useEffect(() => {
    return () => {
      if (isOpen) {
        const isDirty = 
          draftDateRef.current !== currentDetailsRef.current.date || 
          draftNoteRef.current !== currentDetailsRef.current.note ||
          isPublicRef.current !== (currentDetailsRef.current.isPublic ?? false);
        if (isDirty) {
          updatePlaceDetails(lugar.id, draftDateRef.current, draftNoteRef.current, isPublicRef.current);
        }
      }
    };
  }, [isOpen, lugar.id, updatePlaceDetails]);

  if (!isOpen || !mounted) return null;

  const handleManualSave = () => {
    updatePlaceDetails(lugar.id, draftDate, draftNote, isPublic);
    toast.success(dict?.placeCard?.savedSuccessfully || '¡Guardado!');
    onClose();
  };

  const nameToUse = dict?.categories?.ALL === 'All' && lugar.nombre_en ? lugar.nombre_en : lugar.nombre;
  const cleanName = nameToUse
    .replace(/^Parque Nacional /i, '')
    .replace(/^Volcán /i, '')
    .replace(/ National Park$/i, '')
    .replace(/ Volcano$/i, '');

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4 bg-stone-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div 
        className="bg-white w-full sm:w-[440px] max-h-[90vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border-t border-white/40 sm:border sm:border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-4 pb-2 sm:hidden cursor-pointer" onClick={handleClose}>
          <div className="w-12 h-1.5 bg-stone-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="pt-2 sm:pt-6 pb-4 px-6 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hidden sm:block"></div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
            title={isEn ? "Close and save" : "Cerrar y guardar"}
          >
            <X size={18} />
          </button>

          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center justify-center mb-3 text-emerald-600 shadow-sm border border-emerald-100 rotate-3">
            <Sparkles size={28} className="text-emerald-500" strokeWidth={1.5} />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight">
            {dict?.placeCard?.albumNotes || (isEn ? 'My Notes' : 'Mis Notas')}
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-1 font-medium leading-relaxed px-4 truncate">
            {cleanName}
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 pt-2 sm:pt-3 flex flex-col gap-4 overflow-y-auto bg-stone-50/80 border-t border-stone-100">
          
          {/* Fecha de Visita */}
          <div className="flex flex-col gap-1.5">
            <label className="text-stone-500 text-[10px] sm:text-xs uppercase font-bold tracking-widest flex items-center gap-1">
              <BookOpen size={12} /> {dict?.placeCard?.visitDate || (isEn ? 'Date of visit' : 'Fecha de visita')}
            </label>
            <input 
              type="date" 
              value={draftDate} 
              onChange={(e) => setDraftDate(e.target.value)}
              onBlur={() => performSave(false)}
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 sm:py-2.5 text-sm text-stone-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full shadow-sm"
              title={dict?.placeCard?.visitDate || (isEn ? 'Date of visit' : 'Fecha de visita')}
            />
          </div>

          {/* Textarea de Recuerdo / Reseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-stone-500 text-[10px] sm:text-xs uppercase font-bold tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-1">
                {isPublic 
                  ? (isEn ? '🌐 Review / Tips for explorers' : '🌐 Reseña / Consejos para exploradores') 
                  : (isEn ? '🔒 Personal travel memories' : '🔒 Mis recuerdos personales')}
              </span>
              <span className="text-[10px] text-stone-400 font-normal lowercase">
                {isPublic ? (isEn ? 'public' : 'pública') : (isEn ? 'private' : 'privada')}
              </span>
            </label>
            <textarea 
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              onBlur={() => performSave(false)}
              placeholder={isPublic 
                ? (dict?.placeCard?.publicReviewPlaceholder || (isEn ? 'Share a tip or recommendation for fellow explorers (e.g. best time to go, what to bring, secret lookouts)...' : 'Comparte un tip o recomendación para otros exploradores (ej. mejor hora para ir, qué llevar, miradores secretos)...')) 
                : (dict?.placeCard?.myNotes || (isEn ? 'Write your personal memories of this journey...' : 'Escribe tus recuerdos personales de este viaje...'))}
              className="bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-full min-h-[95px] sm:min-h-[110px] resize-none shadow-sm transition-colors"
            />
          </div>

          {/* Segmented Control / Pill Buttons: Visibilidad */}
          <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <span className="text-stone-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Globe size={12} /> {dict?.placeCard?.visibility || (isEn ? 'Note visibility' : 'Visibilidad de tu nota')}
            </span>
            
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl gap-1 border border-stone-200/80">
              <button
                type="button"
                onClick={() => {
                  setIsPublic(false);
                  isPublicRef.current = false;
                  updatePlaceDetails(lugar.id, draftDate, draftNote, false);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  !isPublic 
                    ? 'bg-white text-stone-800 shadow-sm border border-stone-200/60' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Lock size={13} className={!isPublic ? 'text-amber-500' : ''} />
                <span>{isEn ? 'Only for me' : 'Solo para mí'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsPublic(true);
                  isPublicRef.current = true;
                  updatePlaceDetails(lugar.id, draftDate, draftNote, true);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  isPublic 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Users size={13} className={isPublic ? 'text-emerald-100' : ''} />
                <span>{isEn ? 'Colectikos Community' : 'Comunidad Colectikos'}</span>
              </button>
            </div>

            <div className="px-1 pt-0.5">
              {isPublic ? (
                <p className="text-[11px] text-emerald-700 font-medium leading-tight flex items-start gap-1">
                  <span className="shrink-0 mt-0.5">✨</span>
                  <span>
                    {isEn ? 'Visible on the ' : 'Visible en el '}
                    <strong>{isEn ? 'Explorers Wall' : 'Muro de Exploradores'}</strong>
                    {isEn ? ' with your username. Inspire other travelers!' : ' con tu alias. ¡Inspirarás a otros viajeros!'}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 leading-tight flex items-start gap-1">
                  <span className="shrink-0 mt-0.5">🔒</span>
                  <span>{isEn ? 'Personal journal. Only you can see this note from your album.' : 'Diario íntimo. Solo tú podés ver esta nota desde tu álbum.'}</span>
                </p>
              )}
            </div>
          </div>

          {/* Calificación */}
          {!isProv && (
            <div className="flex flex-col gap-2 bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-stone-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center mb-0.5">
                {dict?.placeCard?.my_rating || 'Mi calificación:'}
              </span>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      const newRating = rating === star ? 0 : star;
                      setRating(newRating); 
                      // Auto-guardar notas y visibilidad inmediatamente al calificar
                      performSave(false);
                      if (newRating > 0 && handleRate) {
                        await handleRate(lugar.id, newRating);
                      }
                    }}
                    className="transition-transform hover:scale-110 focus:outline-none relative z-20 p-2 rounded-full hover:bg-stone-50"
                    title={dict?.placeCard?.[`rating_${star}` as keyof typeof dict.placeCard]}
                  >
                    <PawPrint 
                      size={26} 
                      className={`pointer-events-none ${star <= rating ? "text-emerald-500 fill-emerald-500" : "text-stone-300"}`} 
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-stone-500 text-center font-medium mt-0.5">
                  {dict?.placeCard?.[`rating_${rating}` as keyof typeof dict.placeCard]}
                </p>
              )}
            </div>
          )}

          {/* Botón Guardar */}
          <div className="mt-2 pb-2 sm:pb-0">
            <button 
              onClick={handleManualSave} 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {dict?.placeCard?.save || 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
