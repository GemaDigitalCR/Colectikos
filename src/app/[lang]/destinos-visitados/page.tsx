"use client";

import React, { useState } from 'react';
import CategoryFilter from '../../../components/CategoryFilter';
import ProvinceFilter from '../../../components/ProvinceFilter';
import PlaceCard from '../../../components/PlaceCard';

import { useLugaresData } from '../../../context/LugaresContext';
import { useProgress } from '../../../context/ProgressContext';
import { useDictionary } from '../../../context/DictionaryContext';
import { mapLugaresByLocale, getProvincesForLugar } from '../../../utils/getLugares';

export default function DestinosVisitadosPage() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeProvince, setActiveProvince] = useState<string | null>(null);

  const { completedPlaces, handleCheckIn } = useProgress();
  const dict = useDictionary();
  const dbLugares = useLugaresData();
  const lang = dict?.lang || 'es';
  const localizedLugares = mapLugaresByLocale(dbLugares, lang);

  // Filter places based on completed places, category, and province
  const filteredLugares = localizedLugares.filter(l => {
    if (l.categoria === 'PROVINCIA') return false; // We just show normal destinations
    if (!completedPlaces.includes(l.id)) return false; // Only unlocked places

    const matchCategory = activeCategory === 'ALL' || l.categoria === activeCategory;
    const matchProvince = !activeProvince || getProvincesForLugar(l.id, dbLugares).includes(activeProvince);
    
    return matchCategory && matchProvince;
  });

  // Calculate progress for the UI (we can reuse the same logic as the home page)
  const progressData: Record<string, { completed: number; total: number; percentage: number }> = {};
  const provinces = ['SAN JOSE', 'ALAJUELA', 'CARTAGO', 'HEREDIA', 'GUANACASTE', 'PUNTARENAS', 'LIMON'];
  
  provinces.forEach(p => progressData[p] = { completed: 0, total: 0, percentage: 0 });
  
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

  provinces.forEach(p => {
    if (progressData[p].total > 0) {
      progressData[p].percentage = Math.round((progressData[p].completed / progressData[p].total) * 100);
    }
  });

  return (
    <main 
      className="flex-1 w-full relative min-h-screen"
      style={{
        backgroundImage: 'url("/images/Imagenes_Pagina/fondo_pagina.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 mb-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight drop-shadow-md bg-white/60 inline-block px-6 py-2 rounded-2xl backdrop-blur-sm flex items-center gap-3 w-fit">
          <span className="text-emerald-500">✅</span> {dict?.home?.visitedDestinationsTitle || 'Mis Destinos Visitados'}
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-2 scroll-mt-32 relative z-10">
        <CategoryFilter 
          activeCategory={activeCategory} 
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setActiveProvince(null); 
          }} 
        />
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-2">
        <div className="bg-stone-50 rounded-xl p-4 md:p-6 border border-stone-200/60 shadow-inner">
          <div className="mb-4">
            <ProvinceFilter
              activeProvince={activeProvince}
              onSelectProvince={setActiveProvince}
            />
          </div>

          {filteredLugares.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block opacity-50">🏔️</span>
              <p className="text-stone-500 font-medium italic text-lg">
                {dict?.home?.emptyVisitedDestinations || 'Aún no has visitado destinos... Sal a explorar y desbloquea postales.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
              {filteredLugares.map((lugar, index) => {
                // Since this place is guaranteed to be in completedPlaces, we can assert isCompleted=true
                const provinceName = getProvincesForLugar(lugar.id, dbLugares).join(' / ');
                const progress = progressData[getProvincesForLugar(lugar.id, dbLugares)[0]]?.percentage || 0; // fallback just for card rendering
                
                return (
                  <div 
                    key={`visited-${lugar.id}`}
                    className="animate-fade-in-up opacity-0 rounded-sm cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                    style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
                  >
                    <PlaceCard 
                      lugar={lugar}
                      isCompleted={true}
                      onCheckIn={handleCheckIn}
                      progressPercentage={progress}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
