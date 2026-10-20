"use server";

import prisma from '../lib/prisma';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// Haversine formula to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function getSponsors() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        SponsorEnRuta: {
          include: {
            Lugar: {
              select: {
                id: true,
                nombre: true,
                nombre_en: true,
                imagenUrl: true,
                latitude: true,
                longitude: true,
                categoria: true
              }
            }
          }
        }
      }
    });
    return sponsors;
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return [];
  }
}

export async function getSponsorsWithNearby() {
  try {
    const sponsors = await getSponsors();
    return await Promise.all(sponsors.map(async (sponsor: any) => {
      const manualDestinations = (sponsor.SponsorEnRuta || sponsor.destinosEnRuta || []).map((rel: any) => rel.Lugar || rel.lugar);
      const nearby = await getNearbyPostcards(sponsor.latitude, sponsor.longitude, 10, manualDestinations);
      return {
        ...sponsor,
        nearbyPostcards: nearby
      };
    }));
  } catch (error) {
    console.error("Error fetching sponsors with nearby postcards:", error);
    return [];
  }
}

export async function getNearbyPostcards(sponsorLat: number | null, sponsorLng: number | null, radiusKm = 10, manualDestinations: any[] = []) {
  try {
    let nearby: any[] = [];
    
    if (sponsorLat !== null && sponsorLng !== null) {
      // Fetch all postcards that have coordinates
      const postcards = await prisma.lugar.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
          isVisible: true,
          categoria: { not: 'PROVINCIA' }
        },
        select: {
          id: true,
          nombre: true,
          nombre_en: true,
          imagenUrl: true,
          latitude: true,
          longitude: true,
          categoria: true
        }
      });

      // Filter by Haversine distance
      nearby = postcards
        .map(p => {
          const distance = getDistanceFromLatLonInKm(
            sponsorLat,
            sponsorLng,
            p.latitude as number,
            p.longitude as number
          );
          return { ...p, distance };
        })
        .filter(p => p.distance <= radiusKm);
    }

    // Usar Map para combinar manuales sin duplicados (evitando que una manual ya esté cerca)
    const combinedMap = new Map();
    
    // Primero, agregamos las cercanas calculadas
    for (const p of nearby) {
      combinedMap.set(p.id, p);
    }

    // Luego, agregamos o sobreescribimos las manuales asignándoles distancia -1
    for (const manual of manualDestinations) {
      if (!manual) continue;
      let img = manual.imagenUrl;
      if (img && img.includes('/images/Postales_Provincias/')) {
        const parts = img.split('/');
        img = `/images/Postales_Provincias/${parts[parts.length - 1].toLowerCase()}`;
      }
      combinedMap.set(manual.id, {
        ...manual,
        imagenUrl: img,
        distance: -1 // -1 significa "en ruta"
      });
    }

    // Convertimos a array y ordenamos:
    // Los -1 van primero (las paradas en ruta clave), luego por distancia de menor a mayor
    return Array.from(combinedMap.values()).sort((a, b) => {
      if (a.distance === -1 && b.distance !== -1) return -1;
      if (b.distance === -1 && a.distance !== -1) return 1;
      return a.distance - b.distance;
    });

  } catch (error) {
    console.error("Error calculating nearby postcards:", error);
    return [];
  }
}

export async function getSponsorsForDestination(postcardId: string, name: string, latitude: number | null, longitude: number | null) {
  try {
    const sponsors = await getSponsors();
    
    const sponsorsWithNearby = await Promise.all(sponsors.map(async (sponsor: any) => {
      const manualDestinations = (sponsor.SponsorEnRuta || []).map((rel: any) => rel.Lugar);
      const nearby = await getNearbyPostcards(sponsor.latitude, sponsor.longitude, 10, manualDestinations);
      return {
        ...sponsor,
        nearbyPostcards: nearby
      };
    }));

    // Filtrar los patrocinadores que incluyen esta postal (ya sea por ruta, proximidad, o emparejando por nombre para el mock data)
    const matchingSponsors = sponsorsWithNearby.filter(sponsor => 
      sponsor.nearbyPostcards.some((pc: any) => 
        pc.id === postcardId || 
        pc.nombre.toLowerCase() === name.toLowerCase()
      )
    );

    // LÓGICA DEFENSIVA DE RELLENO (FALLBACK NACIONAL)
    const MAX_SPONSORS = 4;
    const locales = matchingSponsors;
    const faltantes = MAX_SPONSORS - locales.length;

    if (faltantes > 0) {
      try {
        const localIds = locales.map((s: any) => s.id);
        const nationalSponsors = await prisma.sponsor.findMany({
          where: {
            alcanceNacional: true,
            id: { notIn: localIds },
          },
          take: faltantes,
          orderBy: { createdAt: 'desc' },
        });

        const formattedNational = nationalSponsors.map((sponsor: any) => ({
          ...sponsor,
          nearbyPostcards: sponsor.nearbyPostcards || [],
        }));

        return [...locales, ...formattedNational];
      } catch (fallbackError) {
        console.error("Error al obtener patrocinadores nacionales de relleno (fallback):", fallbackError);
        // Retornar de forma segura únicamente los locales obtenidos
        return locales;
      }
    }

    return locales;
  } catch (error) {
    console.error("Error fetching sponsors for destination:", error);
    return [];
  }
}

/**
 * Server Action seguro para subir una imagen de patrocinador a Vercel Blob.
 * Establece access: 'public' y retorna la URL pública generada.
 */
export async function uploadSponsorImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: 'No se recibió ningún archivo válido.' };
    }

    if (!file.type.startsWith('image/')) {
      return { error: 'El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP).' };
    }

    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE_BYTES) {
      return { error: 'La imagen excede el límite máximo de 10 MB.' };
    }

    // Nombre de archivo sanitizado con marca de tiempo
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `sponsors/${Date.now()}-${cleanName}`;

    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return { url: blob.url };
  } catch (error: any) {
    console.error('Error subiendo imagen a Vercel Blob:', error);
    if (error?.message?.includes('No token found') || error?.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      return {
        error: 'No se encontró BLOB_READ_WRITE_TOKEN. Configura la variable de entorno en Vercel o en tu .env local.'
      };
    }
    return { error: error?.message || 'Error al procesar la subida a Vercel Blob.' };
  }
}

export interface SponsorInput {
  id?: string;
  nombre: string;
  provincia: string;
  categoria: string;
  direccion: string;
  telefono?: string;
  email?: string;
  sitioWeb?: string;
  descripcion: string;
  descripcion_en?: string;
  latitude: number;
  longitude: number;
  alcanceNacional?: boolean;
  imagen1?: string | null;
  imagen2?: string | null;
  imagen3?: string | null;
  destinosEnRutaIds?: string[];
}

/**
 * Server Action para registrar o actualizar un patrocinador en Prisma
 * guardando las referencias de las imágenes (imagen1, imagen2, imagen3) y sus datos.
 */
export async function saveSponsor(data: SponsorInput): Promise<{ success: boolean; sponsor?: any; error?: string }> {
  try {
    if (!data.nombre || !data.categoria || !data.provincia || !data.direccion) {
      return { success: false, error: 'Por favor completa todos los campos requeridos (nombre, categoría, provincia, dirección).' };
    }

    const imagenPrincipal = data.imagen1 || '';
    const foto2 = data.imagen2 || null;
    const foto3 = data.imagen3 || null;
    const imagenesExtra = [foto2, foto3].filter(Boolean) as string[];

    let savedSponsor;

    if (data.id) {
      const existing = await prisma.sponsor.findUnique({
        where: { id: data.id }
      });

      if (existing) {
        savedSponsor = await prisma.sponsor.update({
          where: { id: data.id },
          data: {
            nombre: data.nombre,
            provincia: data.provincia,
            categoria: data.categoria,
            direccion: data.direccion,
            telefono: data.telefono || null,
            email: data.email || null,
            sitioWeb: data.sitioWeb || null,
            descripcion: data.descripcion || '',
            latitude: Number(data.latitude) || 0,
            longitude: Number(data.longitude) || 0,
            alcanceNacional: Boolean(data.alcanceNacional),
            imagen1: data.imagen1 || null,
            imagen2: data.imagen2 || null,
            imagen3: data.imagen3 || null,
            // Sincronización de campos existentes
            imagenUrl: imagenPrincipal || existing.imagenUrl,
            fotoExtra1: foto2 || existing.fotoExtra1,
            fotoExtra2: foto3 || existing.fotoExtra2,
            imagenesExtra: imagenesExtra.length > 0 ? imagenesExtra : existing.imagenesExtra,
          }
        });
      }
    }

    if (!savedSponsor) {
      const newId = data.id?.trim() || `SP-${Date.now().toString(36).toUpperCase()}`;

      savedSponsor = await prisma.sponsor.create({
        data: {
          id: newId,
          nombre: data.nombre,
          provincia: data.provincia,
          categoria: data.categoria,
          direccion: data.direccion,
          telefono: data.telefono || null,
          email: data.email || null,
          sitioWeb: data.sitioWeb || null,
          descripcion: data.descripcion || '',
          latitude: Number(data.latitude) || 0,
          longitude: Number(data.longitude) || 0,
          alcanceNacional: Boolean(data.alcanceNacional),
          imagen1: data.imagen1 || null,
          imagen2: data.imagen2 || null,
          imagen3: data.imagen3 || null,
          // Compatibilidad con vistas previas
          imagenUrl: imagenPrincipal || '/images/Postales_Generales/Playas/Postales-playas-coyote.png',
          fotoExtra1: foto2,
          fotoExtra2: foto3,
          imagenesExtra: imagenesExtra,
          updatedAt: new Date(),
        }
      });
    }

    // Sincronización de Destinos En Ruta (SponsorEnRuta)
    if (data.destinosEnRutaIds !== undefined) {
      await prisma.sponsorEnRuta.deleteMany({
        where: { sponsorId: savedSponsor.id }
      });

      if (data.destinosEnRutaIds.length > 0) {
        await prisma.sponsorEnRuta.createMany({
          data: data.destinosEnRutaIds.map((lugarId: string) => ({
            sponsorId: savedSponsor.id,
            lugarId: lugarId
          })),
          skipDuplicates: true
        });
      }
    }

    // Obtener el registro completo con sus relaciones para el estado de la UI
    const fullSponsor = await prisma.sponsor.findUnique({
      where: { id: savedSponsor.id },
      include: {
        SponsorEnRuta: {
          include: {
            Lugar: {
              select: {
                id: true,
                nombre: true,
                nombre_en: true,
                imagenUrl: true,
                latitude: true,
                longitude: true,
                categoria: true,
              }
            }
          }
        }
      }
    });

    revalidatePath('/[lang]/destinos/complementos', 'page');
    revalidatePath('/[lang]/proximos-destinos', 'page');
    revalidatePath('/[lang]/admin/sponsors', 'page');

    return { success: true, sponsor: fullSponsor || savedSponsor };
  } catch (error: any) {
    console.error('Error guardando patrocinador en Prisma:', error);
    return { success: false, error: error?.message || 'Error guardando en la base de datos' };
  }
}

/**
 * Server Action para eliminar un patrocinador.
 */
export async function deleteSponsor(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sponsor.delete({
      where: { id }
    });
    revalidatePath('/[lang]/destinos/complementos', 'page');
    revalidatePath('/[lang]/proximos-destinos', 'page');
    revalidatePath('/[lang]/admin/sponsors', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando patrocinador:', error);
    return { success: false, error: error?.message || 'Error eliminando patrocinador' };
  }
}
