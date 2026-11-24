"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CategoriaLugar } from '@prisma/client';
import { getDbLugares } from '../actions/lugares';

// Using the same interface format
export interface LugarContextType {
  id: string;
  nombre: string;
  nombre_en?: string | null;
  categoria: CategoriaLugar;
  descripcion: string;
  descripcion_en?: string | null;
  ubicacion: string;
  ubicacion_en?: string | null;
  imagenUrl: string;
  grupo_variante?: string;
}

const LugaresContext = createContext<{ lugares: LugarContextType[] }>({ lugares: [] });

export const LugaresProvider = ({ children, lugares: initialLugares }: { children: React.ReactNode, lugares: LugarContextType[] }) => {
  const [lugares, setLugares] = useState<LugarContextType[]>(initialLugares);

  useEffect(() => {
    setLugares(initialLugares);
    // Si el render inicial provino del fallback mockLugares (IDs numéricos "1", "2" sin guiones de UUID),
    // re-consultar la base de datos en vivo para recuperar los UUIDs reales inmediatamente.
    const isFallbackData = initialLugares.length > 0 && !initialLugares[0].id.includes('-');
    if (isFallbackData) {
      getDbLugares().then((fresh) => {
        if (fresh && fresh.length > 0 && fresh[0].id.includes('-')) {
          setLugares(fresh as LugarContextType[]);
        }
      }).catch(() => {});
    }
  }, [initialLugares]);

  return <LugaresContext.Provider value={{ lugares }}>{children}</LugaresContext.Provider>;
};

export const useLugaresData = () => useContext(LugaresContext).lugares;
