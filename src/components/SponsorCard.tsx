"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { useLugaresData } from '../context/LugaresContext';
import { getProvincesForLugar } from '../utils/getLugares';

export interface SponsorType {
  id: string;
  nombre: string;
  provincia: string;
  categoria: string;
  direccion: string;
  telefono?: string;
  email?: string;
  sitioWeb?: string;
  descripcion: string;
  descripcion_en?: string;
  imagenUrl: string;
  fotoExtra1?: string;
  fotoExtra2?: string;
  imagenesExtra?: string[];
  latitude: number;
  longitude: number;
  alcanceNacional?: boolean;
  imagen1?: string;
  imagen2?: string;
  imagen3?: string;
  nearbyPostcards?: any[];
}

interface SponsorCardProps {
  sponsor: SponsorType;
  lang: string;
  variant?: 'full' | 'compact';
}

export default function SponsorCard({ sponsor, lang, variant = 'full' }: SponsorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompact = variant === 'compact';

  // Contextos para calcular medallas/evolución provincial en las cápsulas
  const progressContext = useProgress?.();
  const completedPlaces = progressContext?.completedPlaces || [];
  const dbLugares = useLugaresData?.() || [];

  const getProvinceSlug = (text: string) => {
    const norm = (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (norm.includes('san jose')) return 'san-jose';
    if (norm.includes('alajuela')) return 'alajuela';
    if (norm.includes('cartago')) return 'cartago';
    if (norm.includes('heredia')) return 'heredia';
    if (norm.includes('guanacaste')) return 'guanacaste';
    if (norm.includes('puntarenas')) return 'puntarenas';
    if (norm.includes('limon')) return 'limon';
    return norm.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const getProvinceProgressPercentage = (provSlug: string) => {
    if (!dbLugares || dbLugares.length === 0) return 0;
    const provKeyMap: Record<string, string> = {
      'san-jose': 'SAN JOSE',
      'alajuela': 'ALAJUELA',
      'cartago': 'CARTAGO',
      'heredia': 'HEREDIA',
      'guanacaste': 'GUANACASTE',
      'puntarenas': 'PUNTARENAS',
      'limon': 'LIMON',
    };
    const targetProv = provKeyMap[provSlug];
    if (!targetProv) return 0;

    let total = 0;
    let completed = 0;

    dbLugares.forEach((l: any) => {
      if (l.categoria === 'PROVINCIA') return;
      const provs = getProvincesForLugar(l.id, dbLugares);
      if (provs.includes(targetProv)) {
        total++;
        if (completedPlaces.includes(l.id)) {
          completed++;
        }
      }
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const resolvePostcardImage = (pc: any) => {
    const isProv = pc.categoria === 'PROVINCIA' || (pc.imagenUrl && pc.imagenUrl.includes('Postales_Provincias'));
    if (isProv) {
      const provSlug = getProvinceSlug(pc.nombre || pc.nombre_en || '');
      const pct = getProvinceProgressPercentage(provSlug);
      if (pct >= 75) {
        return `/images/Postales_Provincias/Postales-provincias-${provSlug}-golden.png`;
      }
      if (pct >= 50) {
        return `/images/Postales_Provincias/Postales-provincias-${provSlug}-silver.png`;
      }
      if (pct >= 25) {
        return `/images/Postales_Provincias/Postales-provincias-${provSlug}-bronze.png`;
      }
      return `/images/Postales_Provincias/Postales-provincias-${provSlug}.png`;
    }

    if (pc.imagenUrl) {
      if (pc.imagenUrl.includes('/images/Postales_Provincias/')) {
        const parts = pc.imagenUrl.split('/');
        const filename = parts[parts.length - 1];
        return `/images/Postales_Provincias/${filename.toLowerCase()}`;
      }
      return pc.imagenUrl;
    }

    return null;
  };

  const cleanImageUrl = (url?: string | null) => {
    if (!url) return '/images/Postales_Generales/Playas/Postales-playas-coyote.png';
    if (url.startsWith('/Users/')) {
      return '/images/Patrocinadores/Ohana01.webp';
    }
    return url;
  };

  // Configurar emojis de categoría
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
    if (lang === 'en') {
      switch (cat) {
        case 'HOSPEDAJE': return 'Lodging';
        case 'ALIMENTACION': return 'Food';
        case 'TOURS': return 'Tours';
        case 'TRANSPORTE': return 'Transport';
        case 'SOUVENIRS': return 'Souvenirs';
        case 'ONLINE':
        case 'NEGOCIOS_EN_LINEA':
        case 'NEGOCIOS EN LINEA': return 'Online Business';
        default: return rawCat;
      }
    } else {
      switch (cat) {
        case 'HOSPEDAJE': return 'Hospedaje';
        case 'ALIMENTACION': return 'Alimentación';
        case 'TOURS': return 'Tours';
        case 'TRANSPORTE': return 'Transporte';
        case 'SOUVENIRS': return 'Souvenirs';
        case 'ONLINE':
        case 'NEGOCIOS_EN_LINEA':
        case 'NEGOCIOS EN LINEA': return 'Negocios en Línea';
        default: return rawCat;
      }
    }
  };

  const description = lang === 'en' && sponsor.descripcion_en ? sponsor.descripcion_en : sponsor.descripcion;
  const heroImage = cleanImageUrl(sponsor.imagen1 || sponsor.imagenUrl);

  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-lg border border-stone-200 flex flex-col hover:shadow-xl transition-all duration-300 ${isCompact ? 'h-auto' : ''}`}>
      {/* Hero Visual */}
      <div 
        className={`relative w-full ${isCompact ? 'aspect-[16/7] sm:aspect-[21/9]' : 'aspect-[16/7] sm:aspect-[21/9]'} min-h-[140px] max-h-[220px] bg-stone-950 overflow-hidden ${isCompact ? 'cursor-pointer hover:opacity-95' : ''} transition-all duration-300 shrink-0`}
        onClick={() => isCompact && setIsExpanded(!isExpanded)}
      >
        {/* Fondo difuminado ambiental para rellenar los bordes laterales sin bandas duras */}
        <Image 
          src={heroImage} 
          alt="" 
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover blur-md opacity-35 scale-110 pointer-events-none" 
        />
        {/* Imagen principal nítida, 100% contenida: NUNCA se recorta ningún texto ni gráfico */}
        <Image 
          src={heroImage} 
          alt={sponsor.nombre}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain relative z-10 p-1 sm:p-2"
        />
        <div className={`absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full ${isCompact ? 'text-[10px]' : 'text-xs'} font-bold text-stone-800 shadow-sm flex items-center gap-1.5`}>
          <span>{getCategoryEmoji(sponsor.categoria)}</span>
          {getCategoryLabel(sponsor.categoria)}
        </div>
        <div className={`absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full ${isCompact ? 'text-[10px]' : 'text-xs'} font-bold text-white shadow-sm`}>
          {sponsor.provincia}
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`p-5 md:p-6 flex-1 flex flex-col`}>
        {/* Título y reseña */}
        <div 
          className={`mb-4 flex items-start justify-between gap-2 ${isCompact ? 'cursor-pointer select-none' : ''}`}
          onClick={() => isCompact && setIsExpanded(!isExpanded)}
        >
          <div className="flex-1 min-w-0">
            <h2 className={`${isCompact ? 'text-xl' : 'text-2xl'} font-black text-emerald-900 leading-tight`}>{sponsor.nombre}</h2>
            {sponsor.alcanceNacional && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                <span>💬</span>
                <span>{lang === 'en' ? 'Check zones & availability' : 'Consultá zonas y disponibilidad'}</span>
              </div>
            )}
          </div>
          {isCompact && (
            <button className="text-emerald-700 bg-emerald-50 p-1.5 rounded-full hover:bg-emerald-100 transition-colors shrink-0 mt-0.5">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${isCompact && !isExpanded ? 'max-h-0 opacity-0 mb-0' : 'max-h-[2000px] opacity-100 mb-5'}`}>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <p className="text-stone-600 text-sm leading-relaxed italic">"{description}"</p>
          </div>
        </div>

        {/* Contacto */}
        <div className={`space-y-2.5 mb-6 text-sm text-stone-700 transition-all duration-300 overflow-hidden ${isCompact && !isExpanded ? 'max-h-0 opacity-0 mb-0' : 'max-h-[500px] opacity-100 mb-6'}`}>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{sponsor.direccion}</span>
          </div>
          {sponsor.telefono && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{sponsor.telefono}</span>
            </div>
          )}
          {sponsor.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
              <a href={`mailto:${sponsor.email}`} className="hover:text-emerald-700 hover:underline">{sponsor.email}</a>
            </div>
          )}
          {sponsor.sitioWeb && (
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <a href={sponsor.sitioWeb.startsWith('http') ? sponsor.sitioWeb : `https://${sponsor.sitioWeb}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 hover:underline break-all">
                {sponsor.sitioWeb.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
        </div>

        {/* Galería Secundaria (2 extra fotos con orientación Portrait completa sin recortes) */}
        <div className={`transition-all duration-300 overflow-hidden ${isCompact && !isExpanded ? 'max-h-0 opacity-0 mb-0' : 'max-h-[900px] opacity-100 mb-6'}`}>
          {((sponsor.imagenesExtra && sponsor.imagenesExtra.length > 0) || sponsor.imagen2 || sponsor.fotoExtra1 || sponsor.imagen3 || sponsor.fotoExtra2) && (
            <div className="grid grid-cols-2 gap-3.5">
              {(sponsor.imagen2 || sponsor.fotoExtra1) && (
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-stone-950 border border-stone-200/90 shadow-sm group">
                  {/* Fondo ambiental difuminado */}
                  <Image 
                    src={(sponsor.imagen2 || sponsor.fotoExtra1)!} 
                    alt="" 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover blur-md opacity-35 scale-110 pointer-events-none" 
                  />
                  {/* Imagen nítida 100% contenida sin recorte */}
                  <Image 
                    src={(sponsor.imagen2 || sponsor.fotoExtra1)!} 
                    alt={`Galería 1`} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain relative z-10 p-1 group-hover:scale-[1.02] transition-transform duration-300" 
                  />
                </div>
              )}
              {(sponsor.imagen3 || sponsor.fotoExtra2) && (
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-stone-950 border border-stone-200/90 shadow-sm group">
                  {/* Fondo ambiental difuminado */}
                  <Image 
                    src={(sponsor.imagen3 || sponsor.fotoExtra2)!} 
                    alt="" 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover blur-md opacity-35 scale-110 pointer-events-none" 
                  />
                  {/* Imagen nítida 100% contenida sin recorte */}
                  <Image 
                    src={(sponsor.imagen3 || sponsor.fotoExtra2)!} 
                    alt={`Galería 2`} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain relative z-10 p-1 group-hover:scale-[1.02] transition-transform duration-300" 
                  />
                </div>
              )}
              {/* Fallback to array if explicit fields are not set but array has items */}
              {(!sponsor.imagen2 && !sponsor.fotoExtra1 && !sponsor.imagen3 && !sponsor.fotoExtra2 && sponsor.imagenesExtra) && sponsor.imagenesExtra.slice(0,2).map((img, index) => (
                <div key={index} className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-stone-950 border border-stone-200/90 shadow-sm group">
                  <Image 
                    src={img} 
                    alt="" 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover blur-md opacity-35 scale-110 pointer-events-none" 
                  />
                  <Image 
                    src={img} 
                    alt={`Galería ${index + 1}`} 
                    fill 
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain relative z-10 p-1 group-hover:scale-[1.02] transition-transform duration-300" 
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Puente Gamificación (Mockups Postales) */}
        <div className="mt-auto">
          {sponsor.nearbyPostcards && sponsor.nearbyPostcards.length > 0 && (
            <div className="pt-5 border-t border-stone-100 bg-emerald-50/50 -mx-6 -mb-6 px-6 pb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {lang === 'en' ? 'Ideal for your ride to:' : 'Ideal para tu ride a:'}
              </h4>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {sponsor.nearbyPostcards.map((pc: any, index: number) => (
                  <Link 
                    key={index} 
                    href={`/${lang || 'es'}/#lugar-${pc.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2.5 bg-white pr-3.5 p-1 rounded-full border border-emerald-100/80 shadow-xs hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] transition-all duration-300 group cursor-pointer max-w-full"
                    title={lang === 'en' ? `View postcard for ${pc.nombre_en || pc.nombre}` : `Ver postal de ${pc.nombre}`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden relative border border-stone-200/80 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 bg-stone-100">
                      <ImageIcon className="absolute inset-0 m-auto w-3.5 h-3.5 text-stone-400" />
                      {(() => {
                        const imgUrl = resolvePostcardImage(pc);
                        if (!imgUrl) return null;
                        return (
                          <Image
                            src={encodeURI(imgUrl)}
                            alt={pc.nombre || 'Postal'}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        );
                      })()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-stone-800 leading-tight truncate">
                        {lang === 'en' && pc.nombre_en ? pc.nombre_en : pc.nombre}
                      </span>
                      <span className="text-[9px] font-medium text-emerald-600/90 uppercase tracking-wider">
                        {pc.distance === -1 ? (lang === 'en' ? 'On the way' : 'En ruta') : (lang === 'en' ? `${pc.distance.toFixed(1)} km away` : `A ${pc.distance.toFixed(1)} km`)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
