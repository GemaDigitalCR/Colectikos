"use server";

import prisma from '../lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAILS = ['gmontero21@gmail.com', 'gmontero21@icloud.com'];
const ADMIN_USERNAMES = ['elmae21'];

/**
 * Verifica si la sesión activa pertenece a un administrador
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    
    const user = await currentUser();
    if (!user) return false;

    // 1. Verificación por correo electrónico
    const hasAdminEmail = user.emailAddresses?.some(e => 
      ADMIN_EMAILS.includes(e.emailAddress.toLowerCase())
    );
    if (hasAdminEmail) return true;

    // 2. Verificación por username de Clerk
    if (user.username && ADMIN_USERNAMES.includes(user.username.toLowerCase())) {
      return true;
    }

    // 3. Verificación por columna isAdmin en la BD
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });
    return Boolean(dbUser?.isAdmin);
  } catch (e) {
    console.error("Error checking admin session:", e);
    return false;
  }
}

/**
 * Alterna la visibilidad pública de una reseña (Despublicar / Republicar)
 */
export async function toggleReviewVisibilityAdmin(progressId: string, isPublic: boolean) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acción no autorizada: requiere rol de administrador' };
  }

  try {
    const updated = await prisma.userProgress.update({
      where: { id: progressId },
      data: { esPublico: isPublic },
      include: {
        lugar: { select: { nombre: true } },
        user: { select: { username: true } }
      }
    });

    return { 
      success: true, 
      message: isPublic ? 'Reseña publicada en la comunidad' : 'Reseña despublicada y convertida a privada',
      progress: updated 
    };
  } catch (error: any) {
    console.error('Error toggling review visibility:', error);
    return { success: false, error: error?.message || 'Error al actualizar visibilidad' };
  }
}

/**
 * Modifica o censura el texto de una reseña
 */
export async function editReviewTextAdmin(progressId: string, newText: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acción no autorizada: requiere rol de administrador' };
  }

  try {
    const updated = await prisma.userProgress.update({
      where: { id: progressId },
      data: { notas: newText },
    });

    return { success: true, message: 'Texto de la reseña actualizado con éxito', progress: updated };
  } catch (error: any) {
    console.error('Error editing review text:', error);
    return { success: false, error: error?.message || 'Error al actualizar texto' };
  }
}

/**
 * Elimina completamente la nota de una reseña y la despublica
 */
export async function deleteReviewNoteAdmin(progressId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acción no autorizada: requiere rol de administrador' };
  }

  try {
    await prisma.userProgress.update({
      where: { id: progressId },
      data: { notas: '', esPublico: false },
    });

    return { success: true, message: 'Nota eliminada por el administrador' };
  } catch (error: any) {
    console.error('Error deleting review note:', error);
    return { success: false, error: error?.message || 'Error al eliminar nota' };
  }
}

export interface AdminReviewEntry {
  id: string;
  lugarId: string;
  lugarNombre: string;
  lugarCategoria: string;
  lugarUbicacion: string;
  lugarImagenUrl?: string | null;
  userId: string;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  userLevel: number;
  notas: string;
  esPublico: boolean;
  fechaCompletado: string | null;
  ratingScore?: number;
}

/**
 * Obtiene todas las reseñas para el panel de administración
 */
export async function getReviewsForAdminDashboard(filters?: {
  search?: string;
  status?: 'all' | 'public' | 'private';
  limit?: number;
  offset?: number;
}) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { 
      success: false, 
      error: 'No autorizado', 
      reviews: [], 
      totalCount: 0,
      stats: { totalPublic: 0, totalPrivate: 0, totalWithNotes: 0 } 
    };
  }

  try {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    const status = filters?.status ?? 'all';
    const search = filters?.search?.trim();

    const whereClause: any = {
      notas: {
        not: null,
      },
      NOT: {
        notas: '',
      },
    };

    if (status === 'public') {
      whereClause.esPublico = true;
    } else if (status === 'private') {
      whereClause.esPublico = false;
    }

    if (search && search !== '') {
      whereClause.AND = [
        {
          OR: [
            { lugar: { nombre: { contains: search, mode: 'insensitive' } } },
            { notas: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    // Estadísticas globales de moderación
    const [totalWithNotes, totalPublic, totalPrivate] = await Promise.all([
      prisma.userProgress.count({
        where: { notas: { not: null }, NOT: { notas: '' } }
      }),
      prisma.userProgress.count({
        where: { esPublico: true, notas: { not: null }, NOT: { notas: '' } }
      }),
      prisma.userProgress.count({
        where: { esPublico: false, notas: { not: null }, NOT: { notas: '' } }
      }),
    ]);

    const totalCount = await prisma.userProgress.count({ where: whereClause });

    const records = await prisma.userProgress.findMany({
      where: whereClause,
      include: {
        lugar: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
            level: true,
          },
        },
      },
      orderBy: {
        fechaCompletado: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Calificaciones
    const userPlacePairs = records.map((r) => ({
      userId: r.userId,
      placeId: r.lugarId,
    }));

    let ratingMap = new Map<string, number>();
    if (userPlacePairs.length > 0) {
      const ratings = await prisma.rating.findMany({
        where: {
          OR: userPlacePairs.map((p) => ({
            userId: p.userId,
            placeId: p.placeId,
          })),
        },
        select: {
          userId: true,
          placeId: true,
          score: true,
        },
      });

      ratings.forEach((rt) => {
        ratingMap.set(`${rt.userId}_${rt.placeId}`, rt.score);
      });
    }

    const reviews: AdminReviewEntry[] = records.map((r) => ({
      id: r.id,
      lugarId: r.lugarId,
      lugarNombre: r.lugar.nombre,
      lugarCategoria: r.lugar.categoria,
      lugarUbicacion: r.lugar.ubicacion,
      lugarImagenUrl: r.lugar.imagenUrl,
      userId: r.userId,
      username: r.user.username,
      name: r.user.name,
      email: r.user.email,
      avatarUrl: r.user.avatarUrl,
      userLevel: r.user.level,
      notas: r.notas || '',
      esPublico: r.esPublico,
      fechaCompletado: r.fechaCompletado ? r.fechaCompletado.toISOString() : null,
      ratingScore: ratingMap.get(`${r.userId}_${r.lugarId}`) || 0,
    }));

    return {
      success: true,
      reviews,
      totalCount,
      stats: {
        totalWithNotes,
        totalPublic,
        totalPrivate,
      },
    };
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return {
      success: false,
      error: error?.message || 'Error al consultar reseñas',
      reviews: [],
      totalCount: 0,
      stats: { totalPublic: 0, totalPrivate: 0, totalWithNotes: 0 },
    };
  }
}
