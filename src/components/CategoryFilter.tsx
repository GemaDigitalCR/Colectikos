"use client";

import React from 'react';
import { useDictionary } from '../context/DictionaryContext';
import { ChevronDown } from 'lucide-react';

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export default function CategoryFilter({ activeCategory, onSelectCategory }: CategoryFilterProps) {
  const dict = useDictionary();
  const isEn = dict?.lang === 'en';

  const categories = [
    { id: 'ALL', icon: '🌍', label: dict?.categories?.ALL || (isEn ? 'All Categories' : 'Todas las Categorías') },
    { id: 'VOLCAN', icon: '🌋', label: dict?.categories?.VOLCAN || (isEn ? 'Volcanoes' : 'Volcanes') },
    { id: 'PARQUE_NACIONAL', icon: '🌲', label: dict?.categories?.PARQUE_NACIONAL || (isEn ? 'National Parks' : 'Parques Nacionales') },
    { id: 'PLAYA', icon: '🏖️', label: dict?.categories?.PLAYA || (isEn ? 'Beaches' : 'Playas') },
    { id: 'RIOS_Y_CATARATAS', icon: '💧', label: dict?.categories?.RIOS_Y_CATARATAS || (isEn ? 'Rivers & Waterfalls' : 'Ríos y Cataratas') },
    { id: 'LAGUNAS', icon: '🏞️', label: dict?.categories?.LAGUNAS || (isEn ? 'Lagoons' : 'Lagunas') },
    { id: 'CIUDAD_Y_CULTURA', icon: '🏛️', label: dict?.categories?.CIUDAD_Y_CULTURA || (isEn ? 'City & Culture' : 'Ciudad y Cultura') },
    { id: 'BOSQUES_RESERVAS', icon: '🌳', label: dict?.categories?.BOSQUES_RESERVAS || (isEn ? 'Forests & Reserves' : 'Bosques y Reservas') },
  ];

  const currentCat = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-3 md:mb-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-base md:text-lg font-bold text-stone-700 tracking-tight">
            {isEn ? 'Filter by Category' : 'Filtra por Categoría'}
          </h3>
          {/* Badge informativo en celular con la selección actual */}
          <span className="block md:hidden text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300/70 shadow-2xs">
            {currentCat.icon} {currentCat.label}
          </span>
        </div>

        {/* Versión Celular: Dropdown táctil optimizado (Screens < md) */}
        <div className="block md:hidden w-full pt-1 pb-1">
          <div className="relative">
            <select
              value={activeCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full appearance-none bg-white text-stone-800 font-bold text-sm py-3 pl-11 pr-10 rounded-2xl border-2 border-stone-200/90 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-stone-800 font-medium py-1.5">
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xl leading-none">
              {currentCat.icon}
            </div>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <ChevronDown size={19} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Versión Desktop: Píldoras horizontales elegantes (Screens >= md) */}
        <div className="hidden md:flex flex-wrap gap-2.5 pb-2">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`
                  flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-in-out border cursor-pointer
                  ${isActive 
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md transform scale-105 cursor-default' 
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-zinc-100 hover:border-emerald-200 hover:-translate-y-0.5 hover:shadow-2xs'
                  }
                `}
              >
                <span className="text-lg md:text-xl">{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
