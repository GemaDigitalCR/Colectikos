'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, Filter } from 'lucide-react';

export default function InsightsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEn = pathname ? pathname.startsWith('/en') : false;

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm p-4 md:p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-4 w-full lg:w-auto">
        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
          <Filter size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">{isEn ? 'Gema Panel' : 'Panel Gema'}</h1>
          <p className="text-sm text-stone-500 font-medium mt-0.5">
            {isEn ? 'Demographic Analysis & Preferences' : 'Análisis Demográfico y Preferencias'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
        <div className="relative flex-1 sm:flex-none">
          <select 
            value={searchParams.get('provincia') || 'all'}
            onChange={(e) => handleFilterChange('provincia', e.target.value)}
            className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-3 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="all">{isEn ? 'All Provinces' : 'Todas las Provincias'}</option>
            <option value="San José">San José</option>
            <option value="Alajuela">Alajuela</option>
            <option value="Cartago">Cartago</option>
            <option value="Heredia">Heredia</option>
            <option value="Guanacaste">Guanacaste</option>
            <option value="Puntarenas">Puntarenas</option>
            <option value="Limón">{isEn ? 'Limon' : 'Limón'}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
        </div>
        
        <div className="relative flex-1 sm:flex-none">
          <select 
            value={searchParams.get('edad') || 'all'}
            onChange={(e) => handleFilterChange('edad', e.target.value)}
            className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-3 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="all">{isEn ? 'All Ages' : 'Todas las Edades'}</option>
            <option value="<18">{isEn ? 'Under 18 years old' : 'Menor de 18 años'}</option>
            <option value="18-25">{isEn ? '18 - 25 years' : '18 - 25 años'}</option>
            <option value="26-35">{isEn ? '26 - 35 years' : '26 - 35 años'}</option>
            <option value="36-45">{isEn ? '36 - 45 years' : '36 - 45 años'}</option>
            <option value="46-55">{isEn ? '46 - 55 years' : '46 - 55 años'}</option>
            <option value="56+">{isEn ? '56 years or older' : '56 años o más'}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
        </div>

        <div className="relative flex-1 sm:flex-none">
          <select 
            value={searchParams.get('preferencia') || 'all'}
            onChange={(e) => handleFilterChange('preferencia', e.target.value)}
            className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-3 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="all">{isEn ? 'All Preferences' : 'Todas las Preferencias'}</option>
            <option value="Playas">{isEn ? 'Beaches' : 'Playas'}</option>
            <option value="Volcanes">{isEn ? 'Volcanoes' : 'Volcanes'}</option>
            <option value="Ríos">{isEn ? 'Rivers' : 'Ríos'}</option>
            <option value="Cultura">{isEn ? 'Culture' : 'Cultura'}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
        </div>
      </div>
    </div>
  );
}
