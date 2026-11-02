import { mockLugares } from '../data/mockData';

export type UnlockModeType = 'Curioso' | 'Nómada' | 'Conquistador';

/**
 * Normaliza cualquier string a uno de los 3 modos oficiales.
 */
export function normalizeModeString(val?: string | null): UnlockModeType {
  if (!val) return 'Curioso';
  const n = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes('conquistador')) return 'Conquistador';
  if (n.includes('nomada')) return 'Nómada';
  return 'Curioso';
}

/**
 * Resuelve de forma inteligente el modo de desbloqueo de una postal,
 * cruzando IDs de base de datos (UUID), IDs numéricos de mockData ("10"),
 * nombres exactos, nombres limpios/slugs y filosofía de juego del usuario (playMode).
 */
export function getPlaceUnlockMode(
  lugar: { id: string; nombre?: string },
  unlockModes?: Record<string, string> | null,
  userPlayMode?: string | null,
  allPlaces?: { id: string; nombre: string }[]
): UnlockModeType {
  const modes = unlockModes || {};

  // 1. Búsqueda directa por el ID provisto (UUID o numérico)
  if (lugar.id && modes[lugar.id]) {
    return normalizeModeString(modes[lugar.id]);
  }

  const cleanNombre = (lugar.nombre || '').toLowerCase().trim();

  // 2. Búsqueda por nombre directo en unlockModes
  if (lugar.nombre && modes[lugar.nombre]) {
    return normalizeModeString(modes[lugar.nombre]);
  }

  // 3. Cruzar con mockLugares (si lugar.id es UUID, encontrar su ID numérico en mockData)
  const mockMatch = mockLugares.find(m => 
    m.id === lugar.id || 
    (cleanNombre !== '' && m.nombre.toLowerCase().trim() === cleanNombre)
  );

  if (mockMatch) {
    if (modes[mockMatch.id]) return normalizeModeString(modes[mockMatch.id]);
    if (modes[mockMatch.nombre]) return normalizeModeString(modes[mockMatch.nombre]);
  }

  // 4. Cruzar con allPlaces (dbLugares)
  if (allPlaces && allPlaces.length > 0) {
    const dbMatch = allPlaces.find(d => 
      d.id === lugar.id || 
      (cleanNombre !== '' && d.nombre.toLowerCase().trim() === cleanNombre)
    );
    if (dbMatch) {
      if (modes[dbMatch.id]) return normalizeModeString(modes[dbMatch.id]);
      if (modes[dbMatch.nombre]) return normalizeModeString(modes[dbMatch.nombre]);
    }
  }

  // 5. Búsqueda por slug en unlockModes
  if (cleanNombre) {
    const slug = cleanNombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (modes[slug]) return normalizeModeString(modes[slug]);
  }

  // 6. Si no hay modo individual registrado en este dispositivo,
  // consultar el Código de Honor / Filosofía de viaje del usuario (playMode)
  if (userPlayMode) {
    const normUserMode = userPlayMode.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normUserMode.includes('conquistador')) return 'Conquistador';
    if (normUserMode.includes('nomada')) return 'Nómada';
    if (normUserMode.includes('curioso')) return 'Curioso';
  }

  // 7. Fallback por defecto si no hay ningún registro
  return 'Curioso';
}

