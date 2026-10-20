"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Compass, Flag, Sparkles, ChevronDown } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { useLugaresData } from '../context/LugaresContext';
import { useDictionary } from '../context/DictionaryContext';
import { mapLugaresByLocale, getProvincesForLugar } from '../utils/getLugares';

export default function UpcomingRideWidget() {
  const { bucketList } = useProgress();
  const dict = useDictionary();
  const dbLugares = useLugaresData();
  const lang = dict?.lang === 'en' ? 'en' : 'es';

  const localizedLugares = mapLugaresByLocale(dbLugares, lang);
  const t = dict?.upcomingWidget;

  const hasUpcoming = bucketList && bucketList.length > 0;

  // Estado para permitir al usuario cambiar la postal destacada haciendo clic en los botones
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  // Determinar la postal activa (la seleccionada por el usuario o la primera de su lista)
  const activeId = (selectedDestinationId && bucketList && bucketList.includes(selectedDestinationId))
    ? selectedDestinationId
    : (hasUpcoming ? bucketList[0] : null);

  const featuredLugar = activeId ? localizedLugares.find(l => l.id === activeId) : null;

  // Los otros destinos planificados en la lista
  const otherLugares = hasUpcoming
    ? bucketList
        .filter(id => id !== activeId)
        .map(id => localizedLugares.find(l => l.id === id))
        .filter((l): l is typeof localizedLugares[0] => !!l)
    : [];

  const provinceName = featuredLugar ? getProvincesForLugar(featuredLugar.id, dbLugares).join(' / ') : '';
  const categoryKey = featuredLugar?.categoria as keyof typeof dict.categories;
  const categoryLabel = dict?.categories?.[categoryKey] || featuredLugar?.categoria?.replace(/_/g, ' ') || '';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 md:mb-8 transition-all duration-300">
      {hasUpcoming && featuredLugar ? (
        /* ============================================================ */
        /* ESTADO ACTIVO: EL USUARIO YA TIENE DESTINOS PLANIFICADOS     */
        /* ============================================================ */
        <div className="bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-stone-200/90 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
          {/* Sutil acento decorativo superior en degradé */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

          {/* DESKTOP LAYOUT (>= sm) */}
          <div className="hidden sm:flex items-center justify-between p-5 md:p-6 gap-6">
            {/* Marco rectangular vertical (proporción 2:3 nativa de la postal) */}
            <Link 
              href={`/${lang}/proximos-destinos?destino=${featuredLugar.id}`}
              className="relative w-28 sm:w-32 md:w-36 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 shadow-md border border-stone-200/90 bg-stone-100 group-hover:shadow-lg transition-all duration-300 block"
              title={featuredLugar.nombre}
            >
              <Image
                src={featuredLugar.imagenUrl || '/images/Imagenes_Pagina/hero-banner.jpeg'}
                alt={featuredLugar.nombre}
                fill
                sizes="(max-width: 768px) 128px, 144px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                priority
              />
            </Link>

            {/* Contenido Central */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* Insignias superiores */}
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80 shadow-xs">
                  <span className="text-red-500">🚗</span>
                  {t?.activeBadge || (lang === 'en' ? 'Your Next Ride' : 'Tu Próximo Ride')}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200/70">
                  <Flag size={12} className="text-red-500 fill-red-500" />
                  {bucketList.length} {t?.destinationsCount || (lang === 'en' ? 'of 4 planned' : 'de 4 planificados')}
                </span>
              </div>

              {/* Nombre y Ubicación */}
              <Link 
                href={`/${lang}/proximos-destinos?destino=${featuredLugar.id}`}
                className="hover:text-red-600 transition-colors w-fit max-w-full"
              >
                <h3 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight leading-tight truncate">
                  {featuredLugar.nombre}
                </h3>
              </Link>
              
              <div className="text-xs md:text-sm font-semibold text-stone-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 truncate text-stone-600">
                  <MapPin size={13} className="text-emerald-600 shrink-0" />
                  {provinceName}
                </span>
                {categoryLabel && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500 font-medium">{categoryLabel}</span>
                  </>
                )}
              </div>

              {/* Texto prudente de recomendación / ruta */}
              <p className="text-xs md:text-sm text-stone-600 mt-1.5 line-clamp-1 leading-snug">
                {t?.activeSubtitle || (lang === 'en' 
                  ? 'Course charted. Discover selected local recommendations and trip add-ons for your journey.' 
                  : 'Rumbo trazado. Descubre recomendaciones locales y complementos seleccionados para tu viaje.')}
              </p>

              {/* Botones interactivos para alternar entre los otros destinos planificados */}
              {otherLugares.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-100/90 flex-wrap">
                  <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                    {(t?.andMore || (lang === 'en' ? '+{count} more on your list' : '+{count} más en tu lista')).replace('{count}', otherLugares.length.toString())}:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {otherLugares.map((lugar) => (
                      <button
                        key={lugar.id}
                        type="button"
                        onClick={() => setSelectedDestinationId(lugar.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 rounded-full text-xs font-semibold border border-stone-200/80 hover:border-rose-300 transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs group/btn"
                        title={lugar.nombre}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 group-hover/btn:bg-rose-500 transition-colors" />
                        <span className="truncate max-w-[140px] md:max-w-[180px]">{lugar.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón CTA Principal */}
            <div className="shrink-0 flex items-center">
              <Link
                href={`/${lang}/proximos-destinos?destino=${featuredLugar.id}`}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm md:text-base rounded-2xl shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <span>{t?.activeCta || (lang === 'en' ? 'View my route & stops' : 'Ver mi ruta y paradas')}</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* MOBILE LAYOUT (< sm) */}
          <div className="flex sm:hidden flex-col p-4 gap-3">
            {/* Fila superior: Insignias */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                <span className="text-red-500">🚗</span>
                {t?.activeBadge || (lang === 'en' ? 'Your Next Ride' : 'Tu Próximo Ride')}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200/70">
                <Flag size={11} className="text-red-500 fill-red-500" />
                {bucketList.length}/4
              </span>
            </div>

            {/* Fila intermedia: Marco rectangular vertical + Nombre del lugar */}
            <Link 
              href={`/${lang}/proximos-destinos?destino=${featuredLugar.id}`} 
              className="flex items-center gap-3"
            >
              <div className="relative w-20 aspect-[2/3] rounded-xl overflow-hidden shrink-0 shadow-sm border border-stone-200 bg-stone-100">
                <Image
                  src={featuredLugar.imagenUrl || '/images/Imagenes_Pagina/hero-banner.jpeg'}
                  alt={featuredLugar.nombre}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-stone-900 tracking-tight leading-tight line-clamp-2">
                  {featuredLugar.nombre}
                </h3>
                <p className="text-xs font-semibold text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin size={11} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{provinceName}</span>
                </p>
                {categoryLabel && (
                  <p className="text-[11px] font-medium text-stone-400 mt-0.5 truncate">
                    {categoryLabel}
                  </p>
                )}
              </div>
            </Link>

            {/* Texto de ruta prudente */}
            <p className="text-xs text-stone-600 leading-snug">
              {t?.activeSubtitle || (lang === 'en'
                ? 'Course charted. Discover selected local recommendations and trip add-ons for your journey.'
                : 'Rumbo trazado. Descubre recomendaciones locales y complementos seleccionados para tu viaje.')}
            </p>

            {/* Botones interactivos en móvil */}
            {otherLugares.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-500">
                  {(t?.andMore || (lang === 'en' ? '+{count} more on your list' : '+{count} más en tu lista')).replace('{count}', otherLugares.length.toString())}:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {otherLugares.map((lugar) => (
                    <button
                      key={lugar.id}
                      type="button"
                      onClick={() => setSelectedDestinationId(lugar.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 active:bg-rose-50 text-stone-700 active:text-rose-700 rounded-full text-[11px] font-semibold border border-stone-200/80 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="truncate max-w-[140px]">{lugar.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Móvil full-width */}
            <Link
              href={`/${lang}/proximos-destinos?destino=${featuredLugar.id}`}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-sm rounded-xl shadow-md text-center flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <span>{t?.activeCta || (lang === 'en' ? 'View my route & stops' : 'Ver mi ruta y paradas')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* ESTADO VACÍO: INVITACIÓN A PLANIFICAR Y GANAR XP             */
        /* ============================================================ */
        <div className="bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-stone-200/90 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          {/* Sutil acento decorativo superior en degradé esmeralda / ámbar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

          {/* DESKTOP LAYOUT (>= sm) */}
          <div className="hidden sm:flex items-center justify-between p-5 md:p-6 gap-6">
            {/* Ícono de aventura / Brújula */}
            <Link
              href={`/${lang}/proximos-destinos`}
              className="relative w-28 h-24 md:w-32 md:h-28 rounded-2xl bg-gradient-to-br from-emerald-50 via-amber-50 to-rose-50 border border-stone-200/80 flex flex-col items-center justify-center shrink-0 shadow-inner group cursor-pointer hover:border-emerald-300 transition-colors"
            >
              <span className="text-3xl md:text-4xl filter drop-shadow transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                🧭
              </span>
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest mt-1">
                Ride
              </span>
            </Link>

            {/* Contenido Central */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* Insignias superiores */}
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  <Compass size={13} className="text-emerald-600" />
                  {t?.emptyBadge || (lang === 'en' ? 'Plan Your Adventure' : 'Planifica tu Aventura')}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
                  <Sparkles size={12} className="text-amber-500" />
                  {t?.xpBadge || (lang === 'en' ? '+10 XP per destination' : '+10 XP por destino')}
                </span>
              </div>

              {/* Título motivacional */}
              <Link href={`/${lang}/proximos-destinos`} className="hover:text-emerald-700 transition-colors w-fit">
                <h3 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                  {t?.emptyTitle || (lang === 'en' ? 'Where are you heading this weekend?' : '¿A dónde vas este fin de semana?')}
                </h3>
              </Link>

              {/* Subtítulo prudente */}
              <p className="text-xs md:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                {t?.emptySubtitle || (lang === 'en'
                  ? 'Flag your favorite destinations with 🚩 to earn +10 XP and discover recommended stops and spots on your route.'
                  : 'Marca tus destinos favoritos con la banderita roja 🚩 para ganar +10 XP y descubrir paradas recomendadas en tu ruta.')}
              </p>
            </div>

            {/* Acciones Derecha */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <Link
                href={`/${lang}/proximos-destinos`}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm md:text-base rounded-2xl shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
              >
                <span>{t?.emptyCta || (lang === 'en' ? 'Plan my ride' : 'Planificar mi ride')}</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="#seccion-logros"
                className="text-xs font-bold text-stone-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
              >
                <span>{t?.emptyExplore || (lang === 'en' ? 'Pick postcards below' : 'Elegir postales abajo')}</span>
                <ChevronDown size={14} />
              </a>
            </div>
          </div>

          {/* MOBILE LAYOUT (< sm) */}
          <div className="flex sm:hidden flex-col p-4 gap-3">
            {/* Insignias superiores */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <Compass size={12} className="text-emerald-600" />
                {t?.emptyBadge || (lang === 'en' ? 'Plan Your Adventure' : 'Planifica tu Aventura')}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
                <Sparkles size={11} className="text-amber-500" />
                {lang === 'en' ? '+10 XP' : '+10 XP'}
              </span>
            </div>

            {/* Título y Subtítulo */}
            <div>
              <Link href={`/${lang}/proximos-destinos`} className="active:text-emerald-700">
                <h3 className="text-base font-black text-stone-900 tracking-tight leading-tight">
                  {t?.emptyTitle || (lang === 'en' ? 'Where are you heading this weekend?' : '¿A dónde vas este fin de semana?')}
                </h3>
              </Link>
              <p className="text-xs text-stone-600 leading-snug mt-1">
                {t?.emptySubtitle || (lang === 'en'
                  ? 'Flag your favorite destinations with 🚩 to earn +10 XP and discover recommended stops on your route.'
                  : 'Marca tus destinos favoritos con la banderita roja 🚩 para ganar +10 XP y descubrir paradas recomendadas en tu ruta.')}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href={`/${lang}/proximos-destinos`}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm rounded-xl shadow-md text-center flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                <span>{t?.emptyCta || (lang === 'en' ? 'Plan my ride' : 'Planificar mi ride')}</span>
                <ArrowRight size={16} />
              </Link>

              <a
                href="#seccion-logros"
                className="w-full text-center text-xs font-bold text-stone-500 hover:text-stone-800 py-1 flex items-center justify-center gap-1 transition-colors"
              >
                <span>{t?.emptyExplore || (lang === 'en' ? 'Pick postcards below' : 'Elegir postales abajo')}</span>
                <ChevronDown size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
