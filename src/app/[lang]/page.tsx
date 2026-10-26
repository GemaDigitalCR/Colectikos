"use client";

import React, { useState, useRef, useEffect } from 'react';
import Hero from '../../components/Hero';
import UpcomingRideWidget from '../../components/UpcomingRideWidget';
import CategoryFilter from '../../components/CategoryFilter';
import ProvinceFilter from '../../components/ProvinceFilter';
import PlaceCard from '../../components/PlaceCard';

import { useLugaresData } from '../../context/LugaresContext';
import { useProgress } from '../../context/ProgressContext';
import { useDictionary } from '../../context/DictionaryContext';
import { mapLugaresByLocale, getProvincesForLugar } from '../../utils/getLugares';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [isMessyView, setIsMessyView] = useState(false);
  
  const galleryRef = useRef<HTMLElement>(null);

  const { completedPlaces, handleCheckIn, bucketList } = useProgress();
  const dict = useDictionary();
  const dbLugares = useLugaresData();
  const lang = dict?.lang || 'es';
  const localizedLugares = mapLugaresByLocale(dbLugares, lang);

  // Soporte para selección y navegación directa a postales desde el buscador
  useEffect(() => {
    const handleSelectLugar = (e: any) => {
      const lugarId = e.detail?.lugarId;
      if (!lugarId) return;
      setActiveCategory('ALL');
      setActiveProvince(null);
      setTimeout(() => {
        const element = document.getElementById(`lugar-${lugarId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-emerald-400', 'shadow-2xl', 'transition-all', 'duration-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-emerald-400', 'shadow-2xl');
          }, 2500);
        }
      }, 150);
    };

    window.addEventListener('colectikos-select-lugar', handleSelectLugar);
    window.addEventListener('tico-select-lugar', handleSelectLugar);

    // Revisar hash al cargar la página (ej: #lugar-123)
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#lugar-')) {
      const hashLugarId = window.location.hash.replace('#lugar-', '');
      setActiveCategory('ALL');
      setActiveProvince(null);
      setTimeout(() => {
        const element = document.getElementById(`lugar-${hashLugarId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-emerald-400', 'shadow-2xl', 'transition-all', 'duration-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-emerald-400', 'shadow-2xl');
          }, 2500);
        }
      }, 500);
    }

    return () => {
      window.removeEventListener('colectikos-select-lugar', handleSelectLugar);
      window.removeEventListener('tico-select-lugar', handleSelectLugar);
    };
  }, []);

  // Filter places
  const filteredLugares = localizedLugares.filter(l => {
    if (l.categoria === 'PROVINCIA') return false;
    const matchCategory = activeCategory === 'ALL' || l.categoria === activeCategory;
    const matchProvince = !activeProvince || getProvincesForLugar(l.id, dbLugares).includes(activeProvince);
    return matchCategory && matchProvince;
  });

  // Calcular el progreso por provincia para el mapa
  const progressData: Record<string, { completed: number; total: number; percentage: number }> = {};
  const provinces = ['SAN JOSE', 'ALAJUELA', 'CARTAGO', 'HEREDIA', 'GUANACASTE', 'PUNTARENAS', 'LIMON'];
  
  provinces.forEach(p => progressData[p] = { completed: 0, total: 0, percentage: 0 });
  
  localizedLugares.forEach(lugar => {
    // Para el cálculo de porcentaje, NO contamos a la propia provincia,
    // solo contamos los lugares que pertenecen a ella.
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

  provinces.forEach(p => {
    if (progressData[p].total > 0) {
      progressData[p].percentage = Math.round((progressData[p].completed / progressData[p].total) * 100);
    }
  });


  // Excluir la categoría Provincias del progreso total general
  const baseLugares = localizedLugares.filter(l => l.categoria !== 'PROVINCIA');
  const baseTotalCount = baseLugares.length;
  const baseCompletedCount = baseLugares.filter(l => completedPlaces.includes(l.id)).length;

  return (
    <>
      
      <main 
        className="flex-1 w-full relative min-h-screen"
        style={{
          backgroundImage: 'url("/images/Imagenes_Pagina/fondo_pagina.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <Hero 
          completedCount={baseCompletedCount} 
          totalCount={baseTotalCount} 
          lang={lang}
        />

        <UpcomingRideWidget />

        <div id="seccion-logros" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 md:mt-4 mb-4 scroll-mt-32">
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
            {dict?.home?.yourStickers || 'Tus Postales'}
          </h2>
        </div>



        <CategoryFilter 
          activeCategory={activeCategory} 
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setActiveProvince(null); // Clear province filter to prevent empty results
          }} 
        />
        
        <section ref={galleryRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 pt-2">
          <div className="mb-4">
            <ProvinceFilter
              activeProvince={activeProvince}
              onSelectProvince={setActiveProvince}
              rightElement={
                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-full shadow-inner">
                  <span className="text-xs font-semibold text-stone-500 pl-2">
                    {lang === 'en' ? 'Sticker style:' : 'Estilo de pegado:'}
                  </span>
                  <button 
                    onClick={() => setIsMessyView(false)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${!isMessyView ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    {lang === 'en' ? 'Neat' : 'Perfecto'}
                  </button>
                  <button 
                    onClick={() => setIsMessyView(true)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${isMessyView ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    {lang === 'en' ? 'Playful' : 'Desordenado'}
                  </button>
                </div>
              }
            />
          </div>
          <div 
            key={`${activeCategory}-${activeProvince || 'all'}`}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8"
          >
            {filteredLugares.map((lugar, index) => {
              const isProv = lugar.categoria === 'PROVINCIA';
              const provList = getProvincesForLugar(lugar.id, dbLugares);
              const provinceName = isProv ? provList[0] : provList.join(' / ');
              const progress = progressData[provList[0]]?.percentage || 0;
              const isDerivedCompleted = progress >= 25;
              const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-[1.5deg]', 'rotate-[1.5deg]', '-rotate-3', 'rotate-3'];
              const randomRotation = isMessyView ? rotations[index % rotations.length] : 'rotate-0';
              
              return (
                <div 
                  key={lugar.id} 
                  className="animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
                >
                  <PlaceCard 
                    lugar={lugar}
                    isCompleted={isProv ? isDerivedCompleted : completedPlaces.includes(lugar.id)}
                    isDerivedState={isProv}
                    onCheckIn={handleCheckIn}
                    progressPercentage={isProv ? progress : undefined}
                    rotationClass={randomRotation}
                  />
                </div>
              );
            })}
          </div>

          {filteredLugares.length === 0 && (
            <div className="text-center py-20">
              <span className="text-5xl mb-4 block opacity-50">🔍</span>
              <h3 className="text-lg font-semibold text-stone-500">{dict?.home?.noPlaces || 'No hay lugares en esta categoría'}</h3>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
