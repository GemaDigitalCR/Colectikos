export const PROVINCE_SLUGS = [
  'san-jose',
  'alajuela',
  'cartago',
  'heredia',
  'guanacaste',
  'puntarenas',
  'limon'
] as const;

export type ProvinceSlug = typeof PROVINCE_SLUGS[number];

/**
 * Normaliza cualquier texto para extraer el slug de la provincia.
 */
export function getProvinceSlugFromText(text: string): string {
  const norm = (text || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (norm.includes('san jose')) return 'san-jose';
  if (norm.includes('alajuela')) return 'alajuela';
  if (norm.includes('cartago')) return 'cartago';
  if (norm.includes('heredia')) return 'heredia';
  if (norm.includes('guanacaste')) return 'guanacaste';
  if (norm.includes('puntarenas')) return 'puntarenas';
  if (norm.includes('limon')) return 'limon';
  return norm.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Determina con certeza si un objeto representa una provincia.
 */
export function isProvinceLugar(lugar?: { categoria?: string | null; imagenUrl?: string | null; nombre?: string | null; nombre_en?: string | null } | null): boolean {
  if (!lugar) return false;
  if (lugar.categoria === 'PROVINCIA') return true;
  if (lugar.imagenUrl && /postales[_-]provincias/i.test(lugar.imagenUrl)) return true;
  const slug = getProvinceSlugFromText(lugar.nombre || lugar.nombre_en || '');
  return (PROVINCE_SLUGS as readonly string[]).includes(slug);
}

/**
 * Retorna la URL canónica y exacta para la postal de una provincia en el servidor/disco.
 * Manteniendo la mayúscula inicial obligatoria en Linux: /images/Postales_Provincias/Postales-provincias-...
 */
export function getProvincePostcardUrl(provSlug: string, tier?: 'base' | 'bronze' | 'silver' | 'golden'): string {
  const suffix = tier && tier !== 'base' ? `-${tier}` : '';
  return `/images/Postales_Provincias/Postales-provincias-${provSlug}${suffix}.png`;
}

/**
 * Resuelve la URL de imagen de cualquier destino o postal.
 * Corrige problemas de rutas relativas locales o mayúsculas/minúsculas.
 */
export function resolveLugarImageUrl(
  lugar?: { categoria?: string | null; imagenUrl?: string | null; nombre?: string | null; nombre_en?: string | null } | null,
  tier?: 'base' | 'bronze' | 'silver' | 'golden'
): string {
  if (!lugar) return '/images/Postales_Generales/Playas/Postales-playas-coyote.png';

  if (isProvinceLugar(lugar)) {
    const slug = getProvinceSlugFromText(lugar.nombre || lugar.nombre_en || '');
    if ((PROVINCE_SLUGS as readonly string[]).includes(slug)) {
      return getProvincePostcardUrl(slug, tier);
    }
  }

  if (lugar.imagenUrl) {
    let url = lugar.imagenUrl;
    // Si la URL apunta a una provincia pero con mayúsculas/minúsculas inconsistentes
    if (/postales[_-]provincias/i.test(url)) {
      const slug = getProvinceSlugFromText(url);
      if ((PROVINCE_SLUGS as readonly string[]).includes(slug)) {
        return getProvincePostcardUrl(slug, tier);
      }
    }
    if (url.startsWith('/Users/')) {
      return '/images/Patrocinadores/Ohana01.webp';
    }
    return url;
  }

  return '/images/Postales_Generales/Playas/Postales-playas-coyote.png';
}
