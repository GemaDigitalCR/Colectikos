"use client";

import React, { useState } from 'react';
import PlaceCard from '../../../components/PlaceCard';
import { useLugaresData } from '../../../context/LugaresContext';
import { useProgress } from '../../../context/ProgressContext';
import { useDictionary } from '../../../context/DictionaryContext';
import { mapLugaresByLocale, getProvincesForLugar } from '../../../utils/getLugares';
import { Calendar, Compass } from 'lucide-react'; 
import { Drawer } from 'vaul';
import SponsorCard from '../../../components/SponsorCard';
import { getSponsorsForDestination } from '../../../actions/sponsors';

export default function ProximosDestinosPage() {
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [matchingSponsors, setMatchingSponsors] = useState<any[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);

  const { completedPlaces, handleCheckIn, bucketList } = useProgress();
  const dict = useDictionary();
  const dbLugares = useLugaresData();
  const lang = dict?.lang || 'es';
  const localizedLugares = mapLugaresByLocale(dbLugares, lang);

  const activeDestination = activeDestinationId 
    ? localizedLugares.find(l => l.id === activeDestinationId) 
    : null;

  // Auto-seleccionar el destino indicado en query param (o el primero) si hay alguno en bucketList
  React.useEffect(() => {
    if (bucketList && bucketList.length > 0) {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const paramId = params.get('destino');
        if (paramId && bucketList.includes(paramId)) {
          setActiveDestinationId(paramId);
          return;
        }
      }
      if (!activeDestinationId || !bucketList.includes(activeDestinationId)) {
        setActiveDestinationId(bucketList[0]);
      }
    } else {
      if (activeDestinationId) {
        setActiveDestinationId(null);
      }
    }
  }, [bucketList, activeDestinationId]);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchSponsors() {
      console.log("fetchSponsors called for", activeDestinationId);
      if (activeDestinationId && activeDestination) {
        setIsLoadingSponsors(true);
        try {
          const result = await getSponsorsForDestination(
            activeDestination.id, 
            activeDestination.nombre,
            (activeDestination as any).latitude || null, 
            (activeDestination as any).longitude || null
          );
          console.log("Fetched matching sponsors:", result);
          if (isMounted) setMatchingSponsors(result);
        } catch (e) {
          console.error("Error fetching sponsors:", e);
          if (isMounted) setMatchingSponsors([]);
        } finally {
          if (isMounted) setIsLoadingSponsors(false);
        }
      } else {
        if (isMounted) setMatchingSponsors([]);
      }
    }
    fetchSponsors();
    return () => {
      isMounted = false;
    };
  }, [activeDestinationId, (activeDestination as any)?.latitude, (activeDestination as any)?.longitude]);

  // Calcular el progreso por provincia para el mapa / tarjetas
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight drop-shadow-md bg-white/60 inline-block px-6 py-2 rounded-2xl backdrop-blur-sm flex items-center gap-3 w-fit">
          <span className="text-red-500">🚩</span> {dict?.home?.bucketListTitle || 'Mis Próximos Destinos'}
        </h2>
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-2">
        <div className="bg-stone-50 rounded-xl p-4 md:p-6 border border-stone-200/60 shadow-inner">
          {(!bucketList || bucketList.length === 0) ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block opacity-50">🗺️</span>
              <p className="text-stone-500 font-medium italic text-lg">
                {dict?.home?.emptyBucketList || 'Aún no tienes próximos destinos... Usa la banderita en las postales bloqueadas para añadirlos.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
              {localizedLugares
                .filter(l => bucketList.includes(l.id))
                .map((lugar, index) => {
                  const provinceName = getProvincesForLugar(lugar.id, dbLugares).join(' / ');
                  const progress = progressData[provinceName]?.percentage || 0;
                  const isActive = activeDestinationId === lugar.id;
                  
                  return (
                    <div 
                      key={`bucket-${lugar.id}`}
                      className={`animate-fade-in-up opacity-0 rounded-sm cursor-pointer transition-all duration-300 ${isActive ? 'ring-4 ring-emerald-500 scale-[1.02] shadow-xl' : 'hover:scale-[1.01]'}`}
                      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
                      onClick={() => {
                        setActiveDestinationId(lugar.id);
                        if (window.innerWidth < 1024) { // lg breakpoint
                          setIsDrawerOpen(true);
                        }
                      }}
                    >
                      <PlaceCard 
                        lugar={lugar}
                        isCompleted={false}
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

      {/* Esqueleto para la monetización (UI) - Solo Desktop */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 hidden lg:block">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cross-Selling / Complementos del Ride */}
          {activeDestination && (
            <div className="col-span-1 lg:col-span-3">
              <div className="flex flex-col mb-6">
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
                  <span className="text-emerald-500">✨</span> 
                  {lang === 'en' ? 'Ride Add-ons for ' : 'Complementos de tu Ride a '} {activeDestination.nombre}
                </h3>
                <p className="text-stone-500 mt-1">
                  {lang === 'en' ? 'Recommended businesses and stops on your route' : 'Negocios y paradas recomendadas en tu ruta'}
                </p>
              </div>

              {isLoadingSponsors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="h-64 bg-stone-200/60 rounded-2xl animate-pulse border border-stone-100"></div>
                  <div className="h-64 bg-stone-200/60 rounded-2xl animate-pulse border border-stone-100 hidden md:block"></div>
                  <div className="h-64 bg-stone-200/60 rounded-2xl animate-pulse border border-stone-100 hidden lg:block"></div>
                </div>
              ) : matchingSponsors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchingSponsors.map((sponsor) => (
                    <SponsorCard key={sponsor.id} sponsor={sponsor} lang={lang} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-stone-200 shadow-sm">
                  <span className="text-4xl mb-4 opacity-40">🧭</span>
                  <h4 className="text-lg font-bold text-stone-700">
                    {lang === 'en' ? 'No recommendations yet' : 'Aún no hay recomendaciones'}
                  </h4>
                  <p className="text-stone-500 mt-2 max-w-md">
                    {lang === 'en'
                      ? `Soon we will add recommended restaurants, hotels, and key stops for your trip to ${activeDestination.nombre}.`
                      : `Pronto agregaremos restaurantes, hoteles y paradas clave recomendadas para tu viaje a ${activeDestination.nombre}.`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Drawer para Móvil (vaul) */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="bg-stone-50 flex flex-col rounded-t-[24px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-[60] focus:outline-none">
            <div className="p-5 bg-white rounded-t-[24px] flex-1 border-t border-stone-200">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-stone-300 mb-6" />
              
              <div className="max-w-md mx-auto h-full overflow-y-auto pb-6 scrollbar-hide">
                <h2 className="text-2xl font-bold text-stone-800 mb-6 px-1">
                  {activeDestination?.nombre || (lang === 'en' ? 'Destination Details' : 'Detalles del Destino')}
                </h2>
                
                {/* Cross-Selling / Complementos del Ride */}
                {activeDestination && (
                  <div className="mb-5 mt-2">
                    <div className="flex flex-col mb-4 px-1">
                      <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                        <span className="text-emerald-500">✨</span> 
                        {lang === 'en' ? 'Ride Add-ons' : 'Complementos del ride'}
                      </h3>
                      <p className="text-sm text-stone-500 mt-1">
                        {lang === 'en' ? 'Recommended businesses and stops' : 'Negocios y paradas recomendadas'}
                      </p>
                    </div>
                    
                    {isLoadingSponsors ? (
                      <div className="space-y-4">
                        <div className="h-64 bg-stone-200/60 rounded-2xl animate-pulse border border-stone-100"></div>
                      </div>
                    ) : matchingSponsors.length > 0 ? (
                      <div className="space-y-4">
                        {matchingSponsors.map((sponsor) => (
                          <SponsorCard key={sponsor.id} sponsor={sponsor} lang={lang} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-8 bg-stone-50 rounded-2xl border border-stone-200 shadow-sm">
                        <span className="text-3xl mb-3 opacity-40">🧭</span>
                        <h4 className="text-base font-bold text-stone-700">
                          {lang === 'en' ? 'No recommendations yet' : 'Aún no hay recomendaciones'}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1">
                          {lang === 'en' ? 'Soon we will add recommended stops for your trip.' : 'Pronto agregaremos paradas recomendadas para tu viaje.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  );
}
