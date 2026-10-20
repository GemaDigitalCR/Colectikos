"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { X, Compass, MapPin, ArrowRight, Sparkles, Building2, ExternalLink } from 'lucide-react';
import { getSponsorsForDestination } from '../actions/sponsors';

interface ComplementosModalProps {
  isOpen: boolean;
  onClose: () => void;
  lugar: any;
  provinceName?: string;
  dict?: any;
  lang?: string;
}

export default function ComplementosModal({
  isOpen,
  onClose,
  lugar,
  provinceName = '',
  dict,
  lang = 'es'
}: ComplementosModalProps) {
  const [mounted, setMounted] = useState(false);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && lugar) {
      let isCurrent = true;
      setIsLoading(true);

      getSponsorsForDestination(
        lugar.id,
        lugar.nombre,
        lugar.latitude || null,
        lugar.longitude || null
      )
        .then((results) => {
          if (isCurrent) {
            setSponsors(results || []);
          }
        })
        .catch((err) => {
          console.error("Error fetching destination sponsors:", err);
          if (isCurrent) setSponsors([]);
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });

      return () => {
        isCurrent = false;
      };
    } else {
      setSponsors([]);
    }
  }, [isOpen, lugar?.id, lugar?.nombre, lugar?.latitude, lugar?.longitude]);

  // Si no está montado en cliente o cerrado, no renderizar
  if (!mounted || !isOpen || !lugar) return null;

  const t = dict?.placeCard;
  const isEnglish = lang === 'en';

  const getCategoryEmoji = (rawCat: string) => {
    const cat = rawCat ? rawCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';
    switch (cat) {
      case 'HOSPEDAJE': return '🏨';
      case 'ALIMENTACION': return '🍽️';
      case 'TOURS': return '🧭';
      case 'TRANSPORTE': return '🚗';
      case 'SOUVENIRS': return '🛍️';
      case 'ONLINE':
      case 'NEGOCIOS_EN_LINEA':
      case 'NEGOCIOS EN LINEA': return '💻';
      default: return '📍';
    }
  };

  const getCategoryLabel = (rawCat: string) => {
    const cat = rawCat ? rawCat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';
    if (isEnglish) {
      switch (cat) {
        case 'HOSPEDAJE': return 'Lodging';
        case 'ALIMENTACION': return 'Food & Drinks';
        case 'TOURS': return 'Tours & Adventure';
        case 'TRANSPORTE': return 'Transport';
        case 'SOUVENIRS': return 'Souvenirs & Crafts';
        case 'ONLINE':
        case 'NEGOCIOS_EN_LINEA':
        case 'NEGOCIOS EN LINEA': return 'Online Businesses';
        default: return rawCat;
      }
    } else {
      switch (cat) {
        case 'HOSPEDAJE': return 'Hospedaje';
        case 'ALIMENTACION': return 'Alimentación';
        case 'TOURS': return 'Tours y Aventura';
        case 'TRANSPORTE': return 'Transporte';
        case 'SOUVENIRS': return 'Souvenirs y Artesanías';
        case 'ONLINE':
        case 'NEGOCIOS_EN_LINEA':
        case 'NEGOCIOS EN LINEA': return 'Negocios en Línea';
        default: return rawCat;
      }
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:px-4 bg-stone-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:w-[520px] max-h-[85vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border-t border-white/40 sm:border sm:border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior decorativa */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

        {/* Tirador táctil para móvil */}
        <div 
          className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-pointer"
          onClick={onClose}
        >
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Encabezado */}
        <div className="pt-2 sm:pt-6 pb-3 px-6 text-center relative border-b border-stone-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
            title={isEnglish ? "Close" : "Cerrar"}
          >
            <X size={18} />
          </button>

          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl flex items-center justify-center mb-2 text-emerald-600 shadow-sm border border-emerald-100">
            <Compass size={24} className="text-emerald-600" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {t?.complementos || 'Complementos'}
          </h2>

          <p className="text-stone-500 text-xs sm:text-sm mt-0.5 font-medium leading-relaxed truncate px-4">
            {isEnglish ? 'Recommended stops for:' : 'Paradas recomendadas para:'}{' '}
            <strong className="text-stone-800">{lugar.nombre}</strong>
          </p>
        </div>

        {/* Lista de comercios con scroll */}
        <div className="overflow-y-auto px-5 py-4 flex-1 space-y-3.5 scrollbar-thin">
          {isLoading ? (
            /* Esqueleto de carga */
            <div className="space-y-3 py-4">
              <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
              <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
              <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
            </div>
          ) : sponsors.length > 0 ? (
            /* Lista de Comercios Afiliados */
            sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="bg-stone-50/90 hover:bg-emerald-50/40 rounded-2xl p-3.5 border border-stone-200/80 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Foto o Icono */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-stone-200 shadow-2xs">
                    {sponsor.imagenUrl ? (
                      <Image
                        src={sponsor.imagenUrl}
                        alt={sponsor.nombre}
                        fill
                        sizes="56px"
                        className="object-cover object-center group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl bg-stone-100">
                        {getCategoryEmoji(sponsor.categoria)}
                      </div>
                    )}
                  </div>

                  {/* Info del Negocio (Sin tiempos falsos, datos 100% reales de la BD) */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        {getCategoryEmoji(sponsor.categoria)} {getCategoryLabel(sponsor.categoria)}
                      </span>
                      {sponsor.alcanceNacional && (
                        <span className="text-[10px] font-semibold tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          💬 {isEnglish ? 'Check zones & availability' : 'Consultá zonas y disponibilidad'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-stone-900 truncate mt-0.5">
                      {sponsor.nombre}
                    </h4>

                    <p className="text-xs text-stone-500 flex items-center gap-1 truncate mt-0.5">
                      <MapPin size={11} className="text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {sponsor.direccion || sponsor.provincia || provinceName}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Botón de hipervínculo directo a su tarjeta en Complementos del Ride */}
                <Link
                  href={`/${lang}/destinos/complementos#sponsor-${sponsor.id}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 active:scale-95"
                >
                  <span>{isEnglish ? 'View card' : 'Ver tarjeta'}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))
          ) : (
            /* Estado Vacío Inteligente (Generador de pauta y tráfico a la provincia) */
            <div className="flex flex-col items-center justify-center text-center py-6 px-3">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 text-2xl border border-amber-200/60 shadow-inner">
                🧭
              </div>

              <h3 className="text-base font-bold text-stone-800">
                {isEnglish ? 'No direct add-ons yet' : 'Próximamente paradas en esta ruta'}
              </h3>

              <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
                {isEnglish 
                  ? `We don't have registered businesses at ${lugar.nombre} yet, but you can explore recommendations across ${provinceName || 'Costa Rica'}.`
                  : `Aún no tenemos comercios registrados en ${lugar.nombre}, pero puedes explorar recomendaciones en ${provinceName || 'Costa Rica'}.`}
              </p>

              {/* Botón de Tráfico a la Provincia */}
              {provinceName && (
                <Link
                  href={`/${lang}/destinos/complementos?provincia=${encodeURIComponent(provinceName)}`}
                  onClick={onClose}
                  className="mt-4 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {isEnglish 
                      ? `View businesses in ${provinceName}` 
                      : `Ver comercios de ${provinceName}`}
                  </span>
                  <ArrowRight size={14} />
                </Link>
              )}

              {/* Caja B2B de captación de comercios locales */}
              <div className="mt-4 w-full p-3 bg-stone-50 border border-dashed border-stone-300 rounded-xl text-left flex items-start gap-2.5">
                <Building2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] flex-1">
                  <p className="font-bold text-stone-700">
                    {isEnglish ? 'Do you own a business here?' : '¿Tienes un negocio cerca de este lugar?'}
                  </p>
                  <p className="text-stone-500 mt-0.5">
                    {isEnglish 
                      ? 'Put your brand in front of thousands of explorers.' 
                      : 'Llega a miles de exploradores en su viaje.'}
                  </p>
                  <Link
                    href={`/${lang}/contact`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 mt-1"
                  >
                    <span>{isEnglish ? 'Advertise with Colectikos' : 'Afiliar mi negocio a la pauta'}</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de página con enlace a la vitrina completa */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 text-center">
          <Link
            href={`/${lang}/destinos/complementos`}
            onClick={onClose}
            className="text-xs font-bold text-stone-600 hover:text-emerald-700 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>{isEnglish ? 'Explore all Ride Add-ons' : 'Ver todos los Complementos de tu Ride'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
