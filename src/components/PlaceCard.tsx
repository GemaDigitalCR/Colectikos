"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDictionary } from '../context/DictionaryContext';
import { useProgress } from '../context/ProgressContext';
import { Lugar } from '../data/mockData';
import { MapPin, CheckCircle2, Navigation2, XCircle, Lock, BookOpen, Flag, PawPrint, X, Info, Eye, Navigation, Award, Compass, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import UnlockModal from './UnlockModal';
import MemoriesModal from './MemoriesModal';
import ComplementosModal from './ComplementosModal';
import SwapPuzzle from './SwapPuzzle';
import ConfirmRemoveModal from './ConfirmRemoveModal';
import { solvePuzzleAndAwardXP } from '../actions/gamification';
import { useLugaresData } from '../context/LugaresContext';
import { getProvincesForLugar } from '../utils/getLugares';
import { getPlaceUnlockMode } from '../utils/modeHelper';

interface PlaceCardProps {
  lugar: Lugar;
  isCompleted: boolean;
  onCheckIn: (id: string) => void;
  isDerivedState?: boolean;
  progressPercentage?: number;
  rotationClass?: string;
}

const getProvinceImage = (provinceId: string, progressPercentage: number) => {
  if (progressPercentage >= 75) {
    return `/images/Postales_Provincias/Postales-provincias-${provinceId}-golden.png`;
  }
  if (progressPercentage >= 50) {
    return `/images/Postales_Provincias/Postales-provincias-${provinceId}-silver.png`;
  }
  if (progressPercentage >= 25) {
    return `/images/Postales_Provincias/Postales-provincias-${provinceId}-bronze.png`;
  }
  return `/images/Postales_Provincias/Postales-provincias-${provinceId}.png`;
};

export default function PlaceCard({ lugar, isCompleted, onCheckIn, isDerivedState, progressPercentage, rotationClass = '' }: PlaceCardProps) {
  const dict = useDictionary();
  const { placeDetails, updatePlaceDetails, bucketList, toggleBucketList, unlockModes, handleCheckInWithMode, handleRate, estampillas, hasReceivedBonusToday, hasRefundedTicketToday, userProfile } = (useProgress() as any);

  const currentDetails = placeDetails[lugar.id] || { date: '', note: '', isPublic: false };
  const isInBucketList = bucketList?.includes(lugar.id);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isComplementosOpen, setIsComplementosOpen] = useState(false);
  const dbLugares = useLugaresData();
  const provinceName = getProvincesForLugar(lugar.id, dbLugares).join(' / ');
  
  // Extraer el communityRating del contexto global (ya fue pre-cargado)
  // @ts-ignore
  const allRatings = (useProgress() as any).communityRatings || {};
  const communityRating = allRatings[lugar.id] !== undefined ? allRatings[lugar.id] : null;

  const userRatingsMap = (useProgress() as any).userRatings || {};
  const initialUserRating = userRatingsMap[lugar.id] || 0;

  const [rating, setRating] = useState<number>(initialUserRating);

  useEffect(() => {
    if (userRatingsMap[lugar.id] !== undefined) {
      setRating(userRatingsMap[lugar.id]);
    }
  }, [userRatingsMap, lugar.id]);

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isPuzzleOpen, setIsPuzzleOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSelectMode = async (mode: 'Curioso' | 'Nómada' | 'Conquistador') => {
    setIsUnlockModalOpen(false);
    let unlocks = 0;
    if (handleCheckInWithMode) {
      unlocks = await handleCheckInWithMode(lugar.id, mode);
    } else {
      // @ts-ignore
      unlocks = await onCheckIn(lugar.id);
    }
    
    if (unlocks === 3) {
      setIsPuzzleOpen(true);
    }
  };
  


  const isEnglish = dict?.categories?.ALL === 'All';
  const nameToUse = isEnglish && lugar.nombre_en ? lugar.nombre_en : lugar.nombre;
  const descToUse = isEnglish && lugar.descripcion_en ? lugar.descripcion_en : lugar.descripcion;
  const ubicacionToUse = isEnglish && (lugar as any).ubicacion_en ? (lugar as any).ubicacion_en : lugar.ubicacion;

  // Limpiar el nombre para quitar redundancias
  const cleanName = nameToUse
    .replace(/^Parque Nacional /i, '')
    .replace(/^Volcán /i, '')
    .replace(/ National Park$/i, '')
    .replace(/ Volcano$/i, '');
    
  // Formatear la categoría para mostrarla como etiqueta
  const categoryKey = lugar.categoria as keyof typeof dict.categories;
  const categoryLabel = dict?.categories?.[categoryKey] || lugar.categoria.replace(/_/g, ' ');

  // Slug de provincia determinístico y resiliente
  const getProvinceSlug = (lugarObj: Lugar) => {
    const text = `${lugarObj.nombre || ''} ${lugarObj.nombre_en || ''}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (text.includes('san jose')) return 'san-jose';
    if (text.includes('alajuela')) return 'alajuela';
    if (text.includes('cartago')) return 'cartago';
    if (text.includes('heredia')) return 'heredia';
    if (text.includes('guanacaste')) return 'guanacaste';
    if (text.includes('puntarenas')) return 'puntarenas';
    if (text.includes('limon')) return 'limon';

    return (lugarObj.nombre || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // Determinar la imagen a mostrar basándose en la categoría y el progreso
  const isProv = lugar.categoria === 'PROVINCIA';
  const provSlug = isProv ? getProvinceSlug(lugar) : '';
  const displayImage = isProv && progressPercentage !== undefined
    ? getProvinceImage(provSlug, progressPercentage)
    : lugar.imagenUrl;

  const userPlayMode = userProfile?.playMode || (typeof window !== 'undefined' ? (()=>{ try { return JSON.parse(localStorage.getItem('userProfileData') || '{}').playMode; } catch(e){ return null; } })() : null);
  const resolvedMode = isCompleted && !isProv ? getPlaceUnlockMode(lugar, unlockModes, userPlayMode, dbLugares) : null;

  let borderClass = 'border-gray-100';
  let badgeColor = 'border-white bg-white/20 text-white';
  
  let ModeIcon = null;
  let modeLabel = '';
  let modeBadgeClass = '';

  if (isProv && progressPercentage !== undefined) {
    if (progressPercentage >= 75) {
      borderClass = 'border-[#ffd700] shadow-[#ffd700]/30';
      badgeColor = 'border-[#ffd700] bg-[#ffd700]/90 text-stone-900';
    } else if (progressPercentage >= 50) {
      borderClass = 'border-[#c0c0c0] shadow-[#c0c0c0]/30';
      badgeColor = 'border-[#c0c0c0] bg-[#c0c0c0]/80 text-stone-800';
    } else if (progressPercentage >= 25) {
      borderClass = 'border-[#cd7f32] shadow-[#cd7f32]/25';
      badgeColor = 'border-[#cd7f32] bg-[#cd7f32]/80 text-white';
    }
  } else if (resolvedMode === 'Curioso') {
    borderClass = 'border-[#cd7f32]/40 shadow-[#cd7f32]/15';
    badgeColor = 'border-[#cd7f32] bg-[#cd7f32]/80 text-white';
    ModeIcon = Eye;
    modeLabel = (dict?.unlockModal?.curioso || 'Curioso').replace(/^Modo\s+/i, '').replace(/\s+Mode$/i, '');
    modeBadgeClass = 'bg-stone-950/80 border-[#cd7f32]/60 text-amber-200';
  } else if (resolvedMode === 'Nómada') {
    borderClass = 'border-[#c0c0c0] shadow-[#c0c0c0]/20';
    badgeColor = 'border-[#c0c0c0] bg-[#c0c0c0]/80 text-stone-800';
    ModeIcon = Navigation;
    modeLabel = (dict?.unlockModal?.nomada || 'Nómada').replace(/^Modo\s+/i, '').replace(/\s+Mode$/i, '');
    modeBadgeClass = 'bg-stone-950/80 border-stone-300/60 text-stone-200';
  } else if (resolvedMode === 'Conquistador') {
    borderClass = 'border-[#ffd700] shadow-[#ffd700]/30';
    badgeColor = 'border-[#ffd700] bg-[#ffd700]/90 text-stone-900';
    ModeIcon = Award;
    modeLabel = (dict?.unlockModal?.conquistador || 'Conquistador').replace(/^Modo\s+/i, '').replace(/\s+Mode$/i, '');
    modeBadgeClass = 'bg-stone-950/85 border-[#ffd700]/70 text-amber-300';
  }

  const provinceFooterBlock = (
    <div className="pt-1 sm:pt-2 pb-0.5 px-0.5 sm:px-1 flex justify-between items-center w-full mt-0.5 overflow-hidden gap-1">
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-[7px] sm:text-[9px] font-extrabold uppercase tracking-widest text-stone-400 shrink-0">
          {dict?.categories?.ALL === 'All' ? 'Level:' : 'Nivel:'}
        </span>
        <div className={`flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full border shadow-xs ${
          (progressPercentage ?? 0) >= 75
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : (progressPercentage ?? 0) >= 50
            ? 'bg-slate-100 text-slate-700 border-slate-300'
            : (progressPercentage ?? 0) >= 25
            ? 'bg-amber-100/50 text-[#b45309] border-[#b45309]/30'
            : 'bg-stone-100 text-stone-500 border-stone-200'
        }`}>
          <span className="text-[8px] sm:text-[9px]">
            {(progressPercentage ?? 0) >= 75 ? '🥇' : (progressPercentage ?? 0) >= 50 ? '🥈' : (progressPercentage ?? 0) >= 25 ? '🥉' : '🔒'}
          </span>
          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider truncate">
            {(progressPercentage ?? 0) >= 75
              ? (dict?.map?.gold || 'Oro')
              : (progressPercentage ?? 0) >= 50
              ? (dict?.map?.silver || 'Plata')
              : (progressPercentage ?? 0) >= 25
              ? (dict?.map?.bronze || 'Bronce')
              : (dict?.placeCard?.toCollect || (dict?.categories?.ALL === 'All' ? 'To Collect' : 'Bloqueado'))}
          </span>
        </div>
      </div>

      <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full border shadow-inner font-black text-[10px] sm:text-[11px] ${
        (progressPercentage ?? 0) >= 25
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-stone-100 text-stone-600 border-stone-200'
      }`}>
        <span>{progressPercentage ?? 0}%</span>
      </div>
    </div>
  );

  const communityRatingBlock = (
    <div className="pt-1.5 sm:pt-2 pb-0.5 px-0.5 sm:px-1 flex justify-between items-center w-full mt-0.5 overflow-hidden gap-1">
      <span className="text-[7.5px] sm:text-[9px] font-extrabold uppercase tracking-widest text-stone-400 truncate">
        {dict?.placeCard?.community_rating || 'Comunidad:'}
      </span>

      <div className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 shadow-inner shrink-0 whitespace-nowrap">
        <span className="text-[10px] sm:text-[11px] font-bold text-stone-600">
          {communityRating === null ? '--' : communityRating.toFixed(1)}
        </span>
        <PawPrint size={10} className="text-emerald-500 fill-emerald-500 shrink-0" />
      </div>
    </div>
  );

  if (isCompleted) {
    return (
      <div 
        ref={cardRef} 
        id={`lugar-${lugar.id}`} 
        className={`bg-white p-1.5 sm:p-2.5 pb-1 sm:pb-2 rounded-sm shadow-lg border-2 ${borderClass} flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative ${rotationClass} hover:rotate-0 hover:scale-105 hover:z-10 cursor-pointer`}
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
      >
        
        {/* Remove Button Badge */}
        {!isDerivedState && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsRemoveModalOpen(true);
            }}
            className={`absolute -top-2 -right-2 z-40 flex items-center justify-center w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all hover:scale-110 border-2 border-white sm:pointer-events-auto sm:group-hover:opacity-100 ${isMobileExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            title={dict?.placeCard?.removeFromAlbum || 'Quitar del Álbum'}
          >
            <X size={14} strokeWidth={3} />
          </button>
        )}

        {/* Botón Sutil Complementos en Postal Desbloqueada */}
        {!isProv && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsComplementosOpen(true);
            }}
            className="absolute top-2 left-2 z-30 flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full shadow-md border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group/comp cursor-pointer"
            title={dict?.placeCard?.complementos || "Complementos"}
          >
            <Compass size={11} className="text-emerald-400 group-hover/comp:rotate-45 transition-transform duration-300" />
            <span className="text-[8px] sm:text-[9px] font-bold tracking-tight">
              {dict?.placeCard?.complementos || "Complementos"}
            </span>
          </button>
        )}

        <div 
          className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100 border-2 border-stone-100 flex flex-col shrink-0"
        >
          
          <Image 
            src={displayImage} 
            alt={nameToUse}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top text-transparent transition-transform duration-700 group-hover:scale-105" 
          />

          {/* Sello de Modo de Conquista en esquina inferior derecha */}
          {isCompleted && !isProv && ModeIcon && (
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-20 pointer-events-none">
              <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full border ${modeBadgeClass} shadow-md backdrop-blur-md`}>
                <ModeIcon size={9} className="sm:w-2.5 sm:h-2.5 shrink-0" strokeWidth={2.5} />
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
                  {modeLabel}
                </span>
              </div>
            </div>
          )}

          {/* Information Overlay on Hover/Tap */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/95 to-stone-900/40 transition-all duration-500 z-30 flex flex-col justify-end sm:pointer-events-auto sm:group-hover:opacity-100 ${isMobileExpanded ? 'opacity-100 pointer-events-auto cursor-pointer' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsMemoriesOpen(true);
            }}
          >
            <div className={`transform transition-transform duration-500 ease-out p-4 md:p-5 overflow-y-auto max-h-full w-full [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full sm:group-hover:translate-y-0 ${isMobileExpanded ? 'translate-y-0' : 'translate-y-8'}`}>
              {/* Mobile Close Area Hint */}
              <div 
                className="absolute top-2 right-2 sm:hidden p-2 text-white/50 active:text-white/80"
                onClick={() => setIsMobileExpanded(false)}
              >
                <X size={16} />
              </div>
              <span className="inline-block px-2.5 py-1 bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded mb-2">
                {categoryLabel}
              </span>
              <h3 className="font-bold text-white text-xl leading-tight mb-1" title={nameToUse}>
                {cleanName}
              </h3>
              <p className="text-stone-300 text-xs font-medium mb-3 flex items-center gap-1.5 truncate">
                <MapPin size={14} className="text-cyan-400 shrink-0" /> 
                <span className="truncate">{ubicacionToUse}</span>
              </p>
              
              <p className="text-stone-200 text-sm mb-3 leading-relaxed font-serif italic">
                "{descToUse}"
              </p>
              
              <div className="mt-4 mb-2 flex flex-col gap-2">
                {!isProv ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsComplementosOpen(true);
                    }}
                    className="w-full bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 py-2 rounded-lg font-bold shadow-sm transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <Compass size={15} />
                    {dict?.placeCard?.complementos || 'Complementos'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const hubEl = document.getElementById('hub-aliados-provincia');
                      if (hubEl) {
                        hubEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.location.href = `/${dict?.lang === 'en' ? 'en' : 'es'}/provincias`;
                      }
                    }}
                    className="w-full bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/50 text-amber-200 py-2 rounded-lg font-bold shadow-sm transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Store size={15} />
                    {dict?.categories?.ALL === 'All' ? 'View Province Partners' : 'Ver Aliados del Ride'}
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMemoriesOpen(true);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2.5 rounded-lg font-bold shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                >
                  <BookOpen size={16} />
                  {dict?.placeCard?.albumNotes || 'Mis Notas'}
                </button>
              </div>
            </div>
          </div>
        </div>
        {isProv ? provinceFooterBlock : communityRatingBlock}
      {isPuzzleOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-md" onClick={() => setIsPuzzleOpen(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl p-5 sm:p-6 w-full max-w-sm max-h-[95vh] overflow-y-auto relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsPuzzleOpen(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors shrink-0"
            >
              <X size={18} />
            </button>
            <div className="mt-1 mb-3 sm:mb-5 text-center shrink-0">
              <h2 className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight leading-tight px-6 sm:px-2">
                {dict?.categories?.ALL === 'All' ? 'Unlock Puzzle!' : '¡Rompecabezas de Desbloqueo!'}
              </h2>
            </div>
            <SwapPuzzle 
              imageUrl={displayImage} 
              onSolve={async () => {
                try {
                  const profileStr = localStorage.getItem('userProfileData');
                  const localUsername = profileStr ? JSON.parse(profileStr).username : undefined;
                  const rawRes = await solvePuzzleAndAwardXP(lugar.id, localUsername);
                  const res = rawRes as any;
                  if (res?.success && res.xpAwarded > 0) {
                    toast.success(dict?.categories?.ALL === 'All' ? `You earned ${res.xpAwarded} XP!` : `¡Ganaste ${res.xpAwarded} XP por resolver el puzzle!`, { icon: '🏆' });
                  } else if (res?.success) {
                    toast.success(dict?.categories?.ALL === 'All' ? "Puzzle solved!" : "¡Puzzle resuelto!", { icon: '🧩' });
                  }
                } catch (e) {
                  console.error(e);
                }
                setTimeout(() => setIsPuzzleOpen(false), 2000);
              }}
            />
          </div>
        </div>,
        document.body
      )}
      <MemoriesModal 
        isOpen={isMemoriesOpen} 
        onClose={() => setIsMemoriesOpen(false)} 
        lugar={lugar}
        isProv={isProv}
        currentDetails={currentDetails}
        updatePlaceDetails={updatePlaceDetails}
        handleRate={handleRate}
        rating={rating}
      />
      <ConfirmRemoveModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={() => onCheckIn(lugar.id)}
        canRefundTicket={!hasRefundedTicketToday}
        isSpanish={dict?.categories?.ALL !== 'All'}
      />
      <ComplementosModal 
        isOpen={isComplementosOpen}
        onClose={() => setIsComplementosOpen(false)}
        lugar={lugar}
        provinceName={provinceName}
        dict={dict}
        lang={dict?.lang === 'en' ? 'en' : 'es'}
      />
      </div>
    );
  }

  const isShowingBonusPrompt = !isDerivedState && estampillas === 0 && !hasReceivedBonusToday;

  // Estado No Completado (Postal Pendiente)
  return (
    <div ref={cardRef} id={`lugar-${lugar.id}`} className={`bg-white p-1.5 sm:p-2.5 pb-1 sm:pb-2 rounded-sm shadow-lg border border-gray-100 flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative ${rotationClass} hover:rotate-0 hover:scale-105 hover:z-10`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-200 border-2 border-stone-100 flex flex-col shrink-0">
        
        {/* Dynamic Image with conditional grayscale */}
        <Image 
          src={displayImage} 
          alt={nameToUse}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover object-top text-transparent transition-all duration-700 group-hover:scale-105 ${
            isProv && progressPercentage !== undefined && progressPercentage >= 25
              ? 'grayscale-0 opacity-100 brightness-100' // Sin filtros para los bronces o superiores en estado "Por Coleccionar"
              : 'filter grayscale sepia-[0.2] brightness-50 opacity-70 group-hover:brightness-[0.6]' // Estado gris por defecto
          }`} 
        />

        {/* Botón Sutil Complementos en Postal Pendiente */}
        {!isProv && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsComplementosOpen(true);
            }}
            className="absolute top-2 left-2 z-30 flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full shadow-md border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group/comp cursor-pointer"
            title={dict?.placeCard?.complementos || "Complementos"}
          >
            <Compass size={11} className="text-emerald-400 group-hover/comp:rotate-45 transition-transform duration-300" />
            <span className="text-[8px] sm:text-[9px] font-bold tracking-tight">
              {dict?.placeCard?.complementos || "Complementos"}
            </span>
          </button>
        )}

        {/* Flag Icon (Bucket List) */}
        {!isDerivedState && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (toggleBucketList) toggleBucketList(lugar.id);
            }}
            className="absolute top-2 right-2 z-30 p-1.5 transition-all duration-300 hover:scale-110"
            title={isInBucketList ? (dict?.home?.removeFromBucketList || "Quitar de Próximos Destinos") : (dict?.home?.bucketListTitle || "Mis Próximos Destinos")}
          >
            <Flag 
              size={24} 
              className={`transition-colors duration-300 drop-shadow-md ${
                isInBucketList 
                  ? 'text-red-500 fill-current' 
                  : 'text-white/80 fill-transparent stroke-[2] hover:text-white'
              }`} 
            />
          </button>
        )}
        
        {/* Lock icon / Stamp overlay */}
        {!(isProv && progressPercentage !== undefined && progressPercentage >= 25) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div className="w-16 h-16 border-2 border-dashed border-stone-300 rounded-full flex flex-col items-center justify-center mb-3 opacity-60 rotate-[-15deg]">
               <Lock className="text-stone-300 mb-1" size={20} />
            </div>
            <p className="text-stone-300 font-bold uppercase tracking-widest text-[10px] bg-stone-900/60 px-3 py-1 rounded backdrop-blur-sm">{dict?.placeCard?.toCollect || 'Por Coleccionar'}</p>
          </div>
        )}

        {/* Metadata at the bottom */}
        <div className={`absolute bottom-0 inset-x-0 ${isShowingBonusPrompt ? 'p-1.5 sm:p-4' : 'p-2 sm:p-5'} bg-gradient-to-t from-stone-950 via-stone-900/95 to-transparent z-20`}>
          <span className={`${isShowingBonusPrompt ? 'hidden sm:inline-block' : 'inline-block'} px-1.5 sm:px-2.5 py-0.5 bg-stone-700/50 border border-stone-500/30 text-stone-300 text-[7px] sm:text-[9px] font-bold uppercase tracking-wider rounded mb-1 sm:mb-2`}>
            {categoryLabel}
          </span>
          <h3 className={`font-bold text-stone-100 leading-tight ${isShowingBonusPrompt ? 'text-[10px] sm:text-lg truncate sm:line-clamp-2 mb-0.5 sm:mb-0' : 'text-[11px] sm:text-lg line-clamp-2'}`}>{cleanName}</h3>
          
          <p className={`text-stone-400 text-[8px] sm:text-xs font-medium mt-0.5 sm:mt-2 items-center gap-1 sm:gap-1.5 truncate ${isShowingBonusPrompt ? 'hidden sm:flex' : 'flex'}`}>
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-500 shrink-0" /> <span className="truncate">{ubicacionToUse}</span>
          </p>
          
          <p className="text-stone-300 text-[8px] sm:text-xs leading-snug italic font-serif mt-1 sm:mt-2.5 hidden sm:-webkit-box sm:line-clamp-3">
            "{descToUse}"
          </p>
          
          {!isDerivedState && estampillas > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsUnlockModalOpen(true);
              }} 
              className="mt-1.5 sm:mt-4 w-full flex justify-center items-center gap-1 sm:gap-2 text-[9px] sm:text-sm leading-tight font-bold px-1 sm:px-4 py-1.5 sm:py-2 rounded text-white transition-all shadow-md hover:shadow-lg bg-emerald-700 hover:bg-emerald-600"
            >
              <Navigation2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate hidden sm:inline">{dict?.placeCard?.addToAlbum || 'Pegar Postal'}</span>
              <span className="truncate sm:hidden">{dict?.placeCard?.add || 'Pegar'}</span>
            </button>
          )}

          {isShowingBonusPrompt && (
            <div className="mt-1 sm:mt-2.5 bg-stone-900/90 sm:bg-stone-800/80 p-2 sm:p-3 rounded-lg border border-stone-600/50 backdrop-blur-md flex flex-col items-center text-center shadow-lg">
              <p className="text-stone-200 text-[8.5px] min-[360px]:text-[9px] sm:text-xs leading-tight sm:leading-snug mb-1.5 sm:mb-2 font-medium">
                {dict?.categories?.ALL === 'All' 
                  ? "We know your collector hunger wants more! 🦥 You've used your 3 daily tickets, but you'll get 3 new ones tomorrow. Rate the places you discovered today and Otico will give you 1 extra ticket to keep playing!" 
                  : "¡Sabemos que tu hambre de coleccionista quiere más! 🦥 Ya usaste tus 3 tiquetes de hoy, pero mañana tendrás 3 nuevos. ¡Califica los sitios que descubriste hoy y Otico te regalará 1 tiquete extra para seguir jugando!"}
              </p>
              <Link 
                href={dict?.categories?.ALL === 'All' ? "/en/destinos-visitados" : "/es/destinos-visitados"} 
                className="w-full py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-[9.5px] min-[360px]:text-[10px] sm:text-sm font-bold sm:font-extrabold rounded transition-colors shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Award size={13} className="sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{dict?.categories?.ALL === 'All' ? "Rate a destination" : "Calificar un destino"}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      {isProv ? provinceFooterBlock : communityRatingBlock}
      <UnlockModal 
        isOpen={isUnlockModalOpen} 
        onClose={() => setIsUnlockModalOpen(false)} 
        onSelectMode={handleSelectMode} 
      />
      {isPuzzleOpen && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-md" onClick={() => setIsPuzzleOpen(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl p-5 sm:p-6 w-full max-w-sm max-h-[95vh] overflow-y-auto relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsPuzzleOpen(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors shrink-0"
            >
              <X size={18} />
            </button>
            <div className="mt-1 mb-3 sm:mb-5 text-center shrink-0">
              <h2 className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight leading-tight px-6 sm:px-2">
                {dict?.categories?.ALL === 'All' ? 'Unlock Puzzle!' : '¡Rompecabezas de Desbloqueo!'}
              </h2>
            </div>
            <SwapPuzzle 
              imageUrl={displayImage} 
              onSolve={async () => {
                try {
                  const profileStr = localStorage.getItem('userProfileData');
                  const localUsername = profileStr ? JSON.parse(profileStr).username : undefined;
                  const rawRes = await solvePuzzleAndAwardXP(lugar.id, localUsername);
                  const res = rawRes as any;
                  if (res?.success && res.xpAwarded > 0) {
                    toast.success(dict?.categories?.ALL === 'All' ? `You earned ${res.xpAwarded} XP!` : `¡Ganaste ${res.xpAwarded} XP por resolver el puzzle!`, { icon: '🏆' });
                  } else if (res?.success) {
                    toast.success(dict?.categories?.ALL === 'All' ? "Puzzle solved!" : "¡Puzzle resuelto!", { icon: '🧩' });
                  }
                } catch (e) {
                  console.error(e);
                }
                setTimeout(() => setIsPuzzleOpen(false), 2000);
              }}
            />
          </div>
        </div>
      )}
      <ComplementosModal 
        isOpen={isComplementosOpen}
        onClose={() => setIsComplementosOpen(false)}
        lugar={lugar}
        provinceName={provinceName}
        dict={dict}
        lang={dict?.lang === 'en' ? 'en' : 'es'}
      />
    </div>
  );
}
