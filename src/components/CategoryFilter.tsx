"use client";

import React from 'react';
import { useDictionary } from '../context/DictionaryContext';
import { Categoria } from '../data/mockData';

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export default function CategoryFilter({ activeCategory, onSelectCategory }: CategoryFilterProps) {
  const dict = useDictionary();

  const categories = [
    { id: 'ALL', icon: '🌍', label: dict?.categories?.ALL || 'Todas' },
    { id: 'VOLCAN', icon: '🌋', label: dict?.categories?.VOLCAN || 'Volcanes' },
    { id: 'PARQUE_NACIONAL', icon: '🌲', label: dict?.categories?.PARQUE_NACIONAL || 'Parques Nacionales' },
    { id: 'PLAYA', icon: '🏖️', label: dict?.categories?.PLAYA || 'Playas' },
    { id: 'RIOS_Y_CATARATAS', icon: '💧', label: dict?.categories?.RIOS_Y_CATARATAS || 'Ríos y Cataratas' },
    { id: 'LAGUNAS', icon: '🏞️', label: dict?.categories?.LAGUNAS || 'Lagunas' },
    { id: 'CIUDAD_Y_CULTURA', icon: '🏛️', label: dict?.categories?.CIUDAD_Y_CULTURA || 'Ciudad y Cultura' },
    { id: 'BOSQUES_RESERVAS', icon: '🌳', label: dict?.categories?.BOSQUES_RESERVAS || 'Bosques y Reservas' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-4 md:mb-6">
      <div className="mb-2 flex flex-col gap-2">
        <h3 className="text-base md:text-lg font-bold text-stone-700 tracking-tight">
          {dict?.lang === 'en' ? 'Filter by Category' : 'Filtra por Categoría'}
        </h3>
        <div className="flex overflow-x-auto md:flex-wrap md:overflow-visible md:whitespace-normal whitespace-nowrap gap-3 pb-4 scrollbar-hide">
      {categories.map(cat => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`
              flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-in-out border
              ${isActive 
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md transform scale-105 cursor-default' 
                : 'bg-white text-stone-600 border-stone-200 hover:bg-zinc-100 hover:border-emerald-200 hover:-translate-y-1 hover:shadow-md'
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
