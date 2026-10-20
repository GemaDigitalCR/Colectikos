"use client";

import React, { useState } from 'react';
import CategoryFilter from './CategoryFilter';
import ProvinceFilter from './ProvinceFilter';
import CommunityPlaceCard from './CommunityPlaceCard';
import { useLugaresData } from '../context/LugaresContext';
import { mapLugaresByLocale, getProvincesForLugar } from '../utils/getLugares';
import { useDictionary } from '../context/DictionaryContext';
//import { CommunityPost } from '@prisma/client';

interface CommunityClientProps {
  posts: any[];
}

export default function CommunityClient({ posts }: CommunityClientProps) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  
  const dict = useDictionary();
  const lang = dict?.lang || 'es';
  const dbLugares = useLugaresData();
  const localizedLugares = mapLugaresByLocale(dbLugares, lang);

  // Filter places
  const filteredLugares = localizedLugares.filter(l => {
    const matchCategory = activeCategory === 'ALL' || l.categoria === activeCategory;
    const matchProvince = !activeProvince || getProvincesForLugar(l.id, dbLugares).includes(activeProvince);
    return matchCategory && matchProvince;
  });

  const rotations = ['-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1', 'rotate-0', '-rotate-[1.5deg]', 'rotate-[1.5deg]'];
  const isEnglish = lang === 'en';

  return (
    <>
      <CategoryFilter 
        activeCategory={activeCategory} 
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveProvince(null);
        }} 
      />
      
      <div className="mb-4 mt-6">
        <ProvinceFilter
          activeProvince={activeProvince}
          onSelectProvince={setActiveProvince}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
        {filteredLugares.map((lugar, index) => {
          // Buscamos si hay un CommunityPost cuyo caption coincide (ignorando mayúsculas) con el nombre original o en inglés
          // Dado que el usuario o nosotros subimos la foto, el caption indicará el destino
          const matchedPost = posts.find(p => {
             if (!p.caption) return false;
             const cap = p.caption.toLowerCase();
             const nomES = lugar.nombre.toLowerCase();
             const nomEN = lugar.nombre_en?.toLowerCase() || nomES;
             return cap.includes(nomES) || cap.includes(nomEN);
          });
          
          const nameToUse = isEnglish && lugar.nombre_en ? lugar.nombre_en : lugar.nombre;
          // Clean the name similar to Home album
          const cleanName = nameToUse
            .replace(/^Parque Nacional /i, '')
            .replace(/^Volcán /i, '')
            .replace(/ National Park$/i, '')
            .replace(/ Volcano$/i, '');

          const randomRotation = rotations[index % rotations.length];
          const globalIndex = dbLugares.findIndex(m => m.id === lugar.id); // for consistent panini numbers

          return (
            <div 
              key={lugar.id} 
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: `${(index % 10) * 75}ms`, animationFillMode: 'forwards' }}
            >
              <CommunityPlaceCard 
                lugar={lugar}
                post={matchedPost}
                nameToUse={cleanName}
                index={globalIndex}
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
    </>
  );
}
