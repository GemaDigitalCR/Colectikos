"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDictionary } from '../context/DictionaryContext';

interface HeroProps {
  completedCount: number;
  totalCount: number;
  lang?: string;
}

export default function Hero({ completedCount, totalCount, lang: propLang }: HeroProps) {
  const percentage = Math.round((completedCount / totalCount) * 100) || 0;
  const dict = useDictionary();
  const params = useParams();
  const lang = propLang || (params?.lang as string) || (dict?.lang === 'en' ? 'en' : 'es');
  const isEn = lang === 'en';

  return (
    <div className="relative w-full min-h-[60vh] lg:min-h-[75vh] xl:min-h-[600px] py-10 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center rounded-b-3xl overflow-hidden shadow-lg mb-6 md:mb-8">
      {/* Background Image */}
      <Image
        src="/images/Imagenes_Pagina/hero-banner.jpeg"
        alt="Costa Rica landscape"
        fill
        className="object-cover object-center z-0"
        priority
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {/* Enlace directo a Complementos de tu Ride (Esquina superior derecha) */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-3 md:right-4 lg:top-3 lg:right-5 xl:top-4 xl:right-6 z-30">
        <Link
          href={`/${lang}/destinos/complementos`}
          className="group block transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 rounded-2xl"
          title={isEn ? "Ride Add-ons" : "Complementos de tu Ride"}
          aria-label={isEn ? "Ride Add-ons" : "Complementos de tu Ride"}
        >
          <div className="relative w-24 sm:w-36 md:w-48 lg:w-60 xl:w-72 drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)] group-hover:drop-shadow-[0_14px_28px_rgba(0,0,0,0.6)] transition-all duration-300">
            <Image
              src={isEn ? "/images/Imagenes_Pagina/complementos_ride_EN.PNG" : "/images/Imagenes_Pagina/complementos_ride_ES.PNG"}
              alt={isEn ? "Ride Add-ons" : "Complementos de tu Ride"}
              width={1536}
              height={1024}
              className="w-full h-auto object-contain select-none transition-transform duration-300 group-hover:rotate-1"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-6xl mx-auto mt-6 sm:mt-4 md:mt-8">
        
        {/* Logo and Slogan Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-center md:text-left w-full px-4 mb-8 md:mb-12">
          <Image 
            src="/images/Imagenes_Pagina/logo_colectikos_color.PNG" 
            alt="Logo Colectikos" 
            width={320} 
            height={320} 
            className="w-40 sm:w-48 md:w-56 lg:w-72 xl:w-80 shrink-0 h-auto object-contain drop-shadow-2xl"
            priority
          />
          <div>
            <h1 className="sr-only">Colectikos</h1>
            <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg leading-tight">
              <span className="block">{dict?.home?.subtitleLine1 || 'Descubre Costa Rica'}</span>
              <span className="block">{dict?.home?.subtitleLine2 || 'Postal a Postal'}</span>
            </p>
          </div>
        </div>
        
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md p-7 rounded-2xl shadow-2xl border border-white/20">
          <p className="text-lg sm:text-xl text-white font-medium mb-4 drop-shadow">
            {dict?.home?.progressText 
              ? dict.home.progressText.replace('{completed}', completedCount.toString()).replace('{total}', totalCount.toString())
              : `Llevas ${completedCount} de ${totalCount} hitos conquistados`}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full h-5 bg-black/40 rounded-full overflow-hidden shadow-inner backdrop-blur-sm border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)]"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-8 flex justify-center">
          <a 
            href="#seccion-logros"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105"
          >
            {dict?.home?.openAlbum || 'Abrir mi Álbum Virtual'}
          </a>
        </div>
      </div>

      {/* Visual Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" 
          className="w-8 h-8 text-white/80 animate-bounce"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
  );
}
