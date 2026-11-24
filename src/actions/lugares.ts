"use server";
import { unstable_cache } from 'next/cache';
import prisma from '../lib/prisma';
import { mockLugares } from '../data/mockData';

const fetchCachedLugares = unstable_cache(
  async () => {
    const lugares = await prisma.lugar.findMany({
      where: { isVisible: true },
      select: {
        id: true,
        nombre: true,
        nombre_en: true,
        categoria: true,
        descripcion: true,
        descripcion_en: true,
        ubicacion: true,
        imagenUrl: true,
        grupo_variante: true,
      }
    });

    if (!lugares || lugares.length === 0) {
      throw new Error("Empty lugares result from DB - do not cache fallback");
    }

    const orderMap = new Map<string, number>();
    mockLugares.forEach((l, index) => {
      orderMap.set(l.id, index);
      orderMap.set(l.nombre, index);
    });

    const sortedLugares = lugares.sort((a, b) => {
      const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : (orderMap.has(a.nombre) ? orderMap.get(a.nombre)! : 9999);
      const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : (orderMap.has(b.nombre) ? orderMap.get(b.nombre)! : 9999);
      return orderA - orderB;
    });

    return sortedLugares.map(l => ({
      ...l,
      imagenUrl: l.imagenUrl || '',
      grupo_variante: l.grupo_variante || undefined,
      nombre_en: l.nombre_en || undefined,
      descripcion_en: l.descripcion_en || undefined,
      ubicacion_en: undefined,
    }));
  },
  ['db-lugares-v2'],
  { revalidate: 3600, tags: ['lugares'] }
);

export async function getDbLugares() {
  try {
    return await fetchCachedLugares();
  } catch (error) {
    console.error("Error fetching places from DB, using mockLugares fallback:", error);
    return mockLugares;
  }
}
