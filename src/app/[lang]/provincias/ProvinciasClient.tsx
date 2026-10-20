"use client";

import React, { useState, useRef } from 'react';
import PlaceCard from '../../../components/PlaceCard';
import SponsorCard, { SponsorType } from '../../../components/SponsorCard';
import { useLugaresData } from '../../../context/LugaresContext';
import { useProgress } from '../../../context/ProgressContext';
import { useDictionary } from '../../../context/DictionaryContext';
import { mapLugaresByLocale, getProvincesForLugar, PROVINCES_LIST } from '../../../utils/getLugares';
import { Sparkles, MapPin, Compass, Trophy, Award, Store, MessageCircle, ChevronDown, CheckCircle2, Lock, ArrowDown } from 'lucide-react';

interface ProvinciasClientProps {
  sponsors: SponsorType[];
}

export default function ProvinciasClient({ sponsors }: ProvinciasClientProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const galleryRef = useRef<HTMLElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);

  const { completedPlaces, handleCheckIn } = useProgress();
  const dict = useDictionary();
  const dbLugares = useLugaresData();
  const lang = dict?.lang || 'es';
  const localizedLugares = mapLugaresByLocale(dbLugares, lang as any);

  const provincesCards = localizedLugares.filter(l => l.categoria === 'PROVINCIA');

  // Calcular el progreso por provincia para el mapa y las postales
  const progressData: Record<string, { completed: number; total: number; percentage: number }> = {};
  PROVINCES_LIST.forEach(p => progressData[p] = { completed: 0, total: 0, percentage: 0 });

  localizedLugares.forEach(lugar => {
    if (lugar.categoria === 'PROVINCIA') return;

    const provincesForLugar = getProvincesForLugar(lugar.id, dbLugares);
    provincesForLugar.forEach(province => {
      if (progressData[province]) {
        progressData[province].total += 1;
        if (completedPlaces.includes(lugar.id)) {
          progressData[province].completed += 1;
        }
      }
    });
  });

  PROVINCES_LIST.forEach(p => {
    if (progressData[p].total > 0) {
      progressData[p].percentage = Math.round((progressData[p].completed / progressData[p].total) * 100);
    }
  });

  // Conteo de provincias desbloqueadas (al menos Bronce >= 25%)
  const conqueredProvincesCount = PROVINCES_LIST.filter(p => (progressData[p]?.percentage || 0) >= 25).length;

  // Función normalizadora para comparar nombres de provincia
  const normalizeText = (text: string) => {
    return (text || '')
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  };

  // Contar cuántos sponsors operan en cada provincia
  const getSponsorsCountForProvince = (provKey: string) => {
    const normKey = normalizeText(provKey);
    return sponsors.filter(s => {
      if (s.alcanceNacional) return true;
      const sProv = normalizeText(s.provincia);
      return sProv.includes(normKey) || normKey.includes(sProv);
    }).length;
  };

  // Filtrar sponsors según la provincia activa
  const filteredSponsors = sponsors.filter(s => {
    if (selectedProvince === 'ALL') return true;
    if (s.alcanceNacional) return true;
    const sProv = normalizeText(s.provincia);
    const targetProv = normalizeText(selectedProvince);
    return sProv.includes(targetProv) || targetProv.includes(sProv);
  }).sort((a, b) => {
    // Si hay una provincia seleccionada, los locales van primero, luego los de alcance nacional
    if (selectedProvince !== 'ALL') {
      const aIsLocal = normalizeText(a.provincia).includes(normalizeText(selectedProvince));
      const bIsLocal = normalizeText(b.provincia).includes(normalizeText(selectedProvince));
      if (aIsLocal && !bIsLocal) return -1;
      if (!aIsLocal && bIsLocal) return 1;
    }
    return 0;
  });

  const handleSelectProvince = (provKey: string) => {
    setSelectedProvince(provKey);
    // Desplazar suavemente hacia el Hub de Aliados
    setTimeout(() => {
      if (hubRef.current) {
        hubRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const getProvinceDisplayName = (provKey: string) => {
    switch (provKey) {
      case 'SAN JOSE': return lang === 'en' ? 'San Jose' : 'San José';
      case 'ALAJUELA': return 'Alajuela';
      case 'CARTAGO': return 'Cartago';
      case 'HEREDIA': return 'Heredia';
      case 'GUANACASTE': return 'Guanacaste';
      case 'PUNTARENAS': return 'Puntarenas';
      case 'LIMON': return lang === 'en' ? 'Limon' : 'Limón';
      default: return lang === 'en' ? 'All Costa Rica' : 'Toda Costa Rica';
    }
  };

  const activeProgress = selectedProvince !== 'ALL' ? (progressData[selectedProvince] || { completed: 0, total: 0, percentage: 0 }) : null;

  return (
    <main 
      className="flex-1 w-full relative min-h-screen pb-24"
      style={{
        backgroundImage: 'url("/images/Imagenes_Pagina/fondo_pagina.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Encabezado Épico del Salón de Provincias */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 mb-6">
        <div className="bg-white/80 backdrop-blur-md p-5 sm:p-7 rounded-3xl shadow-lg border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1 shadow-xs">
                <Trophy size={13} className="text-emerald-600" />
                {lang === 'en' ? 'Provincial Conquests' : 'Conquistas Provinciales'}
              </span>
              <span className="text-xs font-bold text-stone-500">
                {conqueredProvincesCount} / 7 {lang === 'en' ? 'Conquered' : 'Conquistadas'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight leading-tight">
              {lang === 'en' ? 'Province Stickers & Expedition Hub' : 'Postales de Provincias y Hub de Aventura'}
            </h1>
            
            <p className="text-stone-600 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
              {lang === 'en' 
                ? 'Discover destinations in each province to evolve postcards from Bronze to Silver and coveted Gold. Select a province to explore its recommended ride partners!' 
                : 'Descubre lugares en cada provincia para evolucionar las postales a Bronce, Plata y el codiciado Oro. ¡Selecciona una provincia para conocer los aliados recomendados en tu ride!'}
            </p>

            {/* Badges de Evolución Metálica */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-[#b45309]/30 text-[#b45309] font-bold shadow-xs">
                <span>🥉</span> {lang === 'en' ? 'Bronze (25%+)' : 'Bronce (25%+)'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-300 text-slate-700 font-bold shadow-xs">
                <span>🥈</span> {lang === 'en' ? 'Silver (50%+)' : 'Plata (50%+)'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 font-bold shadow-xs">
                <span>🥇</span> {lang === 'en' ? 'Gold (75%+)' : 'Oro (75%+)'}
              </span>
            </div>
          </div>

          {/* Mini Widget Progreso Nacional */}
          <div className="bg-stone-50/90 border border-stone-200 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[200px] shadow-inner text-center shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-1">
              {lang === 'en' ? 'Conquest Level' : 'Nivel de Conquista'}
            </span>
            <div className="text-3xl font-black text-stone-800 flex items-center gap-1.5">
              <span>{Math.round((conqueredProvincesCount / 7) * 100)}%</span>
              <span className="text-2xl">🇨🇷</span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2.5">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${(conqueredProvincesCount / 7) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-stone-500 mt-1.5">
              {conqueredProvincesCount === 7 
                ? (lang === 'en' ? 'Master of Costa Rica! 🏆' : '¡Amo de Costa Rica! 🏆') 
                : `${conqueredProvincesCount} ${lang === 'en' ? 'of 7 with medals' : 'de 7 con medalla'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Píldoras de Selección de Provincia con Contador de Aliados */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        {/* Versión Celular: Dropdown táctil estilizado */}
        <div className="block md:hidden w-full pb-2">
          <div className="relative">
            <select
              value={selectedProvince}
              onChange={(e) => handleSelectProvince(e.target.value)}
              className="w-full appearance-none bg-white text-stone-800 font-bold text-sm py-3 pl-11 pr-10 rounded-2xl border-2 border-stone-200/90 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 transition-all cursor-pointer"
            >
              <option value="ALL">
                🧭 {lang === 'en' ? 'All Provinces' : 'Todas las Provincias'} ({sponsors.length} {lang === 'en' ? 'allies' : 'aliados'})
              </option>
              {PROVINCES_LIST.map((pKey) => {
                const provPercentage = progressData[pKey]?.percentage || 0;
                const medal = provPercentage >= 75 ? '🥇' : provPercentage >= 50 ? '🥈' : provPercentage >= 25 ? '🥉' : '';
                const spCount = getSponsorsCountForProvince(pKey);
                return (
                  <option key={pKey} value={pKey}>
                    {medal ? `${medal} ` : '📍 '}{getProvinceDisplayName(pKey)} ({provPercentage}% - {spCount} {lang === 'en' ? 'allies' : 'aliados'})
                  </option>
                );
              })}
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
              <Compass size={18} />
            </div>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <ChevronDown size={19} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Versión Desktop: Píldoras horizontales */}
        <div className="hidden md:flex gap-2 flex-wrap pb-2 pt-1">
          <button
            onClick={() => handleSelectProvince('ALL')}
            className={`rounded-full px-4 py-2 text-xs md:text-sm font-bold transition-all shadow-sm border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedProvince === 'ALL'
                ? 'bg-stone-900 text-white border-stone-900 shadow-md scale-105'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Compass size={14} className={selectedProvince === 'ALL' ? 'text-emerald-400' : 'text-stone-400'} />
            <span>{lang === 'en' ? 'All Provinces' : 'Todas las Provincias'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${selectedProvince === 'ALL' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
              {sponsors.length}
            </span>
          </button>

          {PROVINCES_LIST.map(pKey => {
            const isSelected = selectedProvince === pKey;
            const provPercentage = progressData[pKey]?.percentage || 0;
            const medal = provPercentage >= 75 ? '🥇' : provPercentage >= 50 ? '🥈' : provPercentage >= 25 ? '🥉' : '';
            const spCount = getSponsorsCountForProvince(pKey);

            return (
              <button
                key={pKey}
                onClick={() => handleSelectProvince(pKey)}
                className={`rounded-full px-4 py-2 text-xs md:text-sm font-bold transition-all shadow-sm border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105 ring-2 ring-emerald-400/50'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {medal && <span>{medal}</span>}
                <span>{getProvinceDisplayName(pKey)}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  {provPercentage}%
                </span>
                {spCount > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5 ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-amber-100/70 text-amber-800'}`} title={`${spCount} aliados en ruta`}>
                    <Store size={9} />
                    {spCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Galería de 7 Postales de Provincias */}
      <section ref={galleryRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
          {provincesCards.map((lugar, index) => {
            const provList = getProvincesForLugar(lugar.id, dbLugares);
            const provKey = provList[0];
            const progress = progressData[provKey]?.percentage || 0;
            const isDerivedCompleted = progress >= 25;
            const isSelected = selectedProvince === provKey;
            const spCount = getSponsorsCountForProvince(provKey);
            const rotations = ['-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1', 'rotate-0', '-rotate-[1.5deg]', 'rotate-[1.5deg]'];
            const randomRotation = rotations[index % rotations.length];
            
            return (
              <div 
                key={lugar.id} 
                className="animate-fade-in-up opacity-0 relative group"
                style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
              >
                <div 
                  onClick={() => handleSelectProvince(provKey)}
                  className={`cursor-pointer transition-all duration-300 rounded-lg ${
                    isSelected ? 'ring-4 ring-emerald-500 shadow-2xl scale-[1.03] -translate-y-1 z-20' : 'hover:-translate-y-1'
                  }`}
                >
                  <PlaceCard 
                    lugar={lugar}
                    isCompleted={isDerivedCompleted}
                    isDerivedState={true}
                    onCheckIn={handleCheckIn}
                    progressPercentage={progress}
                    rotationClass={isSelected ? 'rotate-0' : randomRotation}
                  />
                </div>

                {/* Botón flotante rápido para ver Comercios Aliados de esta provincia */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProvince(provKey);
                  }}
                  className={`mt-2 w-full py-1.5 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 border shadow-xs cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-white/90 hover:bg-white text-stone-700 border-stone-200/80 hover:text-emerald-700'
                  }`}
                >
                  <Store size={13} className={isSelected ? 'text-emerald-200' : 'text-emerald-600'} />
                  <span>
                    {spCount > 0 
                      ? `${spCount} ${lang === 'en' ? 'Ride Partners' : 'Aliados en Ruta'}` 
                      : (lang === 'en' ? 'View Partners' : 'Ver Aliados')}
                  </span>
                  <ArrowDown size={11} className={isSelected ? 'text-white' : 'text-stone-400'} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECCIÓN ESTRELLA: EL HUB DE EXPEDICIÓN Y SPONSORS POR PROVINCIA */}
      <div id="hub-aliados-provincia" ref={hubRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 scroll-mt-24">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-8 shadow-xl border border-stone-200/90">
          
          {/* Header del Hub Provincial */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200/70 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                  <Compass size={18} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                  {lang === 'en' ? 'Regional Travel & Sponsor Hub' : 'Hub de Viaje y Aliados Regionales'}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                <span>
                  {selectedProvince === 'ALL'
                    ? (lang === 'en' ? 'All Recommended Partners in Costa Rica' : 'Todos los Comercios Aliados en Costa Rica')
                    : (lang === 'en' 
                        ? `Recommended Partners in ${getProvinceDisplayName(selectedProvince)}` 
                        : `Comercios y Servicios Aliados en ${getProvinceDisplayName(selectedProvince)}`)}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
                {selectedProvince === 'ALL'
                  ? (lang === 'en' 
                      ? 'Discover local businesses offering stays, tours, gastronomy, and souvenirs for your adventure.' 
                      : 'Descubre los negocios locales que ofrecen hospedaje, tours, gastronomía y recuerdos para tu viaje.')
                  : (lang === 'en'
                      ? `Enjoy your ride in ${getProvinceDisplayName(selectedProvince)} with trusted local businesses and national services.`
                      : `Disfruta al máximo tu ride en ${getProvinceDisplayName(selectedProvince)} apoyando el comercio local y servicios verificados.`)}
              </p>
            </div>

            {/* Tarjeta de Rango o Estado en la provincia seleccionada */}
            {activeProgress && (
              <div className="bg-stone-50 border border-stone-200/80 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 shrink-0 shadow-xs">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white shadow-xs border border-stone-200">
                  {activeProgress.percentage >= 75 ? '🥇' : activeProgress.percentage >= 50 ? '🥈' : activeProgress.percentage >= 25 ? '🥉' : '🔒'}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                    {lang === 'en' ? 'Your Province Rank' : 'Tu Rango Provincial'}
                  </div>
                  <div className="text-sm font-black text-stone-800">
                    {activeProgress.percentage >= 75 
                      ? (lang === 'en' ? 'Gold Conqueror 🥇' : 'Conquistador Oro 🥇') 
                      : activeProgress.percentage >= 50 
                      ? (lang === 'en' ? 'Silver Ambassador 🥈' : 'Embajador Plata 🥈') 
                      : activeProgress.percentage >= 25 
                      ? (lang === 'en' ? 'Bronze Explorer 🥉' : 'Explorador Bronce 🥉') 
                      : (lang === 'en' ? 'Locked (Needs 25%)' : 'Bloqueado (Requiere 25%)')}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600">
                    {activeProgress.completed} / {activeProgress.total} {lang === 'en' ? 'places found' : 'lugares descubiertos'} ({activeProgress.percentage}%)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 
            [ON THE BACK / RESERVADO PARA MÁS ADELANTE]
            Banner de Beneficio de Coleccionista con Comercios Aliados.
            Oculto temporalmente a la espera de negociaciones de trato preferencial o beneficios con pautantes.
          <div className="mt-6 mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-emerald-500 text-white rounded-xl text-lg shadow-sm shrink-0">
                ✨
              </span>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  {lang === 'en' ? 'Collector Perk with Local Partners' : 'Beneficio de Coleccionista con Comercios Aliados'}
                </h4>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  {lang === 'en'
                    ? 'Show your active Colectikos digital passport or unlocked bronze/silver/gold postcard when contacting these businesses for special collector courtesy and personalized ride tips!'
                    : '¡Muestra tu pasaporte digital de Colectikos o tu postal desbloqueada al contactar a estos negocios para recibir atención preferencial y consejos exclusivos para tu ride!'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                {filteredSponsors.length} {lang === 'en' ? 'available' : 'disponibles'}
              </span>
            </div>
          </div>
          */}

          {/* Grid de Tarjetas de Sponsors Enriquecidas */}
          {filteredSponsors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-6">
              {filteredSponsors.map(sponsor => (
                <div key={sponsor.id} className="transition-transform duration-300 hover:-translate-y-1">
                  <SponsorCard 
                    sponsor={sponsor} 
                    lang={lang} 
                    variant="full"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
              <Store size={36} className="mx-auto text-stone-400 mb-2" />
              <h4 className="text-base font-bold text-stone-700">
                {lang === 'en' ? 'No partners registered in this area yet' : 'Aún no hay aliados locales registrados en esta provincia'}
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                {lang === 'en'
                  ? 'National services are ready to assist you anywhere in Costa Rica.'
                  : 'Nuestros aliados de alcance nacional están listos para atenderte en cualquier punto del país.'}
              </p>
            </div>
          )}

          {/* Tarjeta de Invitación para Nuevos Pautantes (Lead Generation) */}
          <div className="mt-10 p-6 rounded-2xl bg-stone-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shrink-0">
                🌴
              </div>
              <div>
                <h4 className="text-lg font-black text-white">
                  {lang === 'en' 
                    ? `Do you have a tourism business or service in ${getProvinceDisplayName(selectedProvince)}?` 
                    : `¿Tienes un negocio o servicio turístico en ${getProvinceDisplayName(selectedProvince)}?`}
                </h4>
                <p className="text-xs text-stone-300 mt-1 max-w-xl">
                  {lang === 'en'
                    ? 'Feature your hotel, tour, restaurant, or souvenir shop in the Colectikos passport and connect with thousands of active travelers.'
                    : 'Pauta tu hotel, tour, restaurante o tienda de artesanías en el pasaporte de Colectikos y conecta con miles de viajeros listos para su próximo ride.'}
                </p>
              </div>
            </div>

            <a
              href={lang === 'en'
                ? "https://wa.me/50688888888?text=Hello%20Colectikos,%20I%20would%20like%20to%20advertise%20my%20business%20in%20province%20postcards"
                : "https://wa.me/50688888888?text=Hola%20Colectikos,%20me%20gustar%C3%ADa%20pautar%20mi%20negocio%20en%20las%20postales%20de%20provincia"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs sm:text-sm font-black transition-all shadow-md flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95"
            >
              <MessageCircle size={16} />
              <span>{lang === 'en' ? 'Partner with Us on WhatsApp' : 'Pautar mi negocio en WhatsApp'}</span>
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
