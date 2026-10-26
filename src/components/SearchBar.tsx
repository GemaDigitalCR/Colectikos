"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Lugar } from '../data/mockData';
import { useDictionary } from '../context/DictionaryContext';

interface SearchBarProps {
  lugares: Lugar[];
  onSelectCallback?: () => void;
  className?: string;
  id?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
}

export default function SearchBar({
  lugares,
  onSelectCallback,
  className,
  id,
  inputRef,
  placeholder
}: SearchBarProps) {
  const dict = useDictionary();
  const lang = dict?.lang || 'es';
  const isEn = lang === 'en';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Lugar[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = inputRef || internalInputRef;

  // Normaliza el texto para ignorar tildes, mayúsculas y minúsculas
  const normalizeText = (text: string) => {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Efecto para filtrar los resultados en tiempo real
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const normalizedQuery = normalizeText(query);
    const filtered = lugares.filter((lugar) => {
      const normalizedName = normalizeText(lugar.nombre);
      const normalizedLocation = normalizeText(lugar.ubicacion);
      const normalizedCategory = normalizeText(lugar.categoria);
      const normalizedNameEn = normalizeText((lugar as any).nombre_en || '');

      // Coincidencia parcial en nombre, ubicación o categoría
      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedLocation.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery) ||
        normalizedNameEn.includes(normalizedQuery)
      );
    });

    setResults(filtered);
    setIsOpen(true);
  }, [query, lugares]);

  // Cerrar el dropdown al hacer clic o tap fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (lugarId: string) => {
    setIsOpen(false);
    setQuery('');
    
    // Si viene de un menú desplegable (ej. móvil), cerrar el contenedor
    if (onSelectCallback) {
      onSelectCallback();
    }

    const highlightCard = () => {
      const element = document.getElementById(`lugar-${lugarId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-emerald-400', 'shadow-2xl', 'transition-all', 'duration-500');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-emerald-400', 'shadow-2xl');
        }, 2500);
        return true;
      }
      return false;
    };

    // Intentar encontrar el elemento en la página actual
    const found = highlightCard();

    if (!found) {
      // Disparar evento para resetear filtros en la página principal si está en Home
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('colectikos-select-lugar', { detail: { lugarId } }));
        window.dispatchEvent(new CustomEvent('tico-select-lugar', { detail: { lugarId } }));
        
        // Reintentar tras dar tiempo a la vista para renderizar todas las postales
        setTimeout(() => {
          const foundAfterReset = highlightCard();
          if (!foundAfterReset) {
            // Si el usuario está en otra ruta (ej: /proximos-destinos, /contact), navegar a Home con hash
            const currentPath = window.location.pathname;
            const isHomePage = currentPath === `/${lang}` || currentPath === `/${lang}/` || currentPath === '/' || currentPath === '';
            if (!isHomePage) {
              window.location.href = `/${lang}#lugar-${lugarId}`;
            }
          }
        }, 150);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[0].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const resolvedPlaceholder = placeholder || dict?.navbar?.searchPlaceholder || (isEn ? "Search places..." : "Buscar lugares...");

  return (
    <div ref={wrapperRef} className={className || "relative w-full max-w-xs lg:max-w-sm"}>
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 text-stone-400 pointer-events-none flex items-center justify-center">
          <Search size={18} />
        </div>
        <input
          ref={activeInputRef as any}
          id={id}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          // text-base en móvil previene el zoom involuntario en iOS Safari, sm:text-sm en pantallas mayores
          className="w-full pl-10 pr-9 py-2 sm:py-1.5 text-base sm:text-sm bg-stone-100/90 border border-stone-200/90 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all text-stone-800 placeholder:text-stone-400 shadow-2xs"
          onFocus={() => {
            if (query.trim() !== '') setIsOpen(true);
          }}
          suppressHydrationWarning
        />
        {query.trim() !== '' && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              activeInputRef.current?.focus();
            }}
            className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 w-full max-h-[50vh] sm:max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-stone-200/80 z-[60] divide-y divide-stone-100">
          <div className="p-2 sm:p-2.5">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 block mb-1">
              {results.length} {results.length === 1 ? (isEn ? 'place found' : 'lugar encontrado') : (isEn ? 'places found' : 'lugares encontrados')}
            </span>
            <ul className="space-y-0.5">
              {results.map((lugar) => (
                <li key={lugar.id}>
                  <button
                    onClick={() => handleSelect(lugar.id)}
                    className="w-full text-left px-3 py-2.5 sm:py-2 hover:bg-emerald-50/70 active:bg-emerald-100/80 rounded-xl transition-colors flex items-center justify-between group"
                  >
                    <div className="flex flex-col overflow-hidden mr-2">
                      <span className="text-sm font-bold text-stone-800 truncate group-hover:text-emerald-700 transition-colors">
                        {lugar.nombre}
                      </span>
                      <span className="text-xs text-stone-500 flex items-center gap-1 truncate mt-0.5">
                        <MapPin size={12} className="shrink-0 text-emerald-600" />
                        <span className="truncate">{lugar.ubicacion}</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 transition-colors">
                      {lugar.categoria.replace(/_/g, ' ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isOpen && query.trim() !== '' && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-stone-200/80 z-[60] p-4 text-center">
          <p className="text-sm text-stone-700 font-medium">
            {isEn ? `No places found for "${query}"` : `No encontramos "${query}" en tu álbum`}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {isEn ? "Try searching by name, volcano, beach, or province" : "Prueba buscando por nombre, volcán, playa o provincia"}
          </p>
        </div>
      )}
    </div>
  );
}
