"use client";

import React from 'react';
import { useDictionary } from '../context/DictionaryContext';
import { ChevronDown, MapPin } from 'lucide-react';

interface ProvinceFilterProps {
  activeProvince: string | null;
  onSelectProvince: (province: string | null) => void;
  title?: string;
  rightElement?: React.ReactNode;
  className?: string;
  hideTitle?: boolean;
}

export default function ProvinceFilter({
  activeProvince,
  onSelectProvince,
  title,
  rightElement,
  className = "",
  hideTitle = false,
}: ProvinceFilterProps) {
  const dict = useDictionary();
  const isEn = dict?.lang === 'en';

  const defaultTitle = dict?.home?.filterByProvince || (isEn ? 'Filter by Province' : 'Filtra por Provincia');

  const provinces = [
    { id: null, label: isEn ? 'All Provinces' : 'Todas las Provincias', short: isEn ? 'All' : 'Todas' },
    { id: 'SAN JOSE', label: isEn ? 'San Jose' : 'San José', short: isEn ? 'San Jose' : 'San José' },
    { id: 'ALAJUELA', label: 'Alajuela', short: 'Alajuela' },
    { id: 'CARTAGO', label: 'Cartago', short: 'Cartago' },
    { id: 'HEREDIA', label: 'Heredia', short: 'Heredia' },
    { id: 'GUANACASTE', label: 'Guanacaste', short: 'Guanacaste' },
    { id: 'PUNTARENAS', label: 'Puntarenas', short: 'Puntarenas' },
    { id: 'LIMON', label: isEn ? 'Limon' : 'Limón', short: isEn ? 'Limon' : 'Limón' },
  ];

  const currentProv = provinces.find(p => p.id === activeProvince) || provinces[0];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-2">
        {!hideTitle && (
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-base md:text-lg font-bold text-stone-700 tracking-tight flex items-center gap-1.5">
              <span>{title || defaultTitle}</span>
            </h3>

            <div className="flex items-center gap-2">
              {/* Badge indicativo de la provincia activa en móvil */}
              <span className="block md:hidden text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300/70 shadow-2xs">
                📍 {currentProv.short}
              </span>

              {rightElement && (
                <div className="flex items-center">
                  {rightElement}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Versión Celular: Dropdown táctil estilizado (Screens < md) */}
        <div className="block md:hidden w-full pt-1 pb-1">
          <div className="relative">
            <select
              value={activeProvince ?? "ALL"}
              onChange={(e) => {
                const val = e.target.value === "ALL" ? null : e.target.value;
                onSelectProvince(val);
              }}
              className="w-full appearance-none bg-white text-stone-800 font-bold text-sm py-3 pl-11 pr-10 rounded-2xl border-2 border-stone-200/90 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 transition-all cursor-pointer"
            >
              {provinces.map((prov) => (
                <option key={prov.id ?? "ALL"} value={prov.id ?? "ALL"} className="text-stone-800 font-medium py-1.5">
                  📍 {prov.label}
                </option>
              ))}
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
              <MapPin size={18} />
            </div>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <ChevronDown size={19} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Versión Desktop: Píldoras horizontales elegantes (Screens >= md) */}
        <div className="hidden md:flex flex-wrap gap-2 pb-2 pt-1">
          {provinces.map((prov) => {
            const isActive = activeProvince === prov.id;
            return (
              <button
                key={prov.id ?? 'all'}
                onClick={() => onSelectProvince(prov.id)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ease-in-out cursor-pointer shadow-xs border ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md border-emerald-600 scale-105 cursor-default'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-emerald-200 hover:-translate-y-0.5'
                }`}
              >
                {prov.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
