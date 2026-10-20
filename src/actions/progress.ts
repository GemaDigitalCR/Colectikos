"use server";

import prisma from '../lib/prisma';
import { isSameCRDay } from '../lib/dateUtils';
import { ensureDbUser } from './gamification';

export async function updateUserProgressNote(
  lugarId: string, 
  note: string, 
  dateStr?: string, 
  localUsername?: string, 
  fallbackClerkId?: string,
  isPublic?: boolean
) {
  try {
    const user = await ensureDbUser(localUsername, fallbackClerkId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    let parsedDate: Date | undefined = undefined;
    if (dateStr && typeof dateStr === 'string' && dateStr.trim() !== '') {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    let progress;
    try {
      progress = await prisma.userProgress.upsert({
        where: {
          userId_lugarId: {
            userId: user.id,
            lugarId: lugarId,
          }
        },
        update: {
          notas: note,
          ...(isPublic !== undefined && { esPublico: isPublic }),
          ...(parsedDate && { fechaCompletado: parsedDate })
        },
        create: {
          userId: user.id,
          lugarId: lugarId,
          notas: note,
          completado: true,
          esPublico: isPublic !== undefined ? isPublic : false,
          ...(parsedDate ? { fechaCompletado: parsedDate } : { fechaCompletado: new Date() })
        }
      });
    } catch (upsertError: any) {
      console.warn("Prisma upsert falló con esPublico, aplicando fallback SQL:", upsertError?.message);
      // Fallback: si el proceso de Next.js aún tiene en memoria el cliente Prisma previo al generate
      progress = await prisma.userProgress.upsert({
        where: {
          userId_lugarId: {
            userId: user.id,
            lugarId: lugarId,
          }
        },
        update: {
          notas: note,
          ...(parsedDate && { fechaCompletado: parsedDate })
        },
        create: {
          userId: user.id,
          lugarId: lugarId,
          notas: note,
          completado: true,
          ...(parsedDate ? { fechaCompletado: parsedDate } : { fechaCompletado: new Date() })
        }
      });

      if (isPublic !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE "UserProgress" SET "esPublico" = $1 WHERE "userId" = $2 AND "lugarId" = $3`,
          Boolean(isPublic),
          user.id,
          lugarId
        );
      }
    }

    return { success: true, progress };
  } catch (error: any) {
    console.error("Error updating progress note:", error);
    return { success: false, error: error?.message || 'Error al persistir la nota' };
  }
}

export async function getUserProgress(localUsername?: string, fallbackClerkId?: string) {
  try {
    const user = await ensureDbUser(localUsername, fallbackClerkId);
    if (!user) return { success: false, error: 'User not found' };
    
    const checkins = await prisma.userProgress.findMany({
      where: { userId: user.id }
    });
    
    const userRatings = await prisma.rating.findMany({
      where: { userId: user.id },
      select: { placeId: true, score: true }
    });
    
    return { success: true, checkins, userRatings };
  } catch (error) {
    console.error("Error fetching progress:", error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function removeUserProgress(lugarId: string, localUsername?: string, fallbackClerkId?: string) {
  try {
    const user = await ensureDbUser(localUsername, fallbackClerkId);
    if (!user) return { success: false, error: 'User not found' };

    // Check refund eligibility (1 per day)
    let refundedTicket = false;
    const now = new Date();
    const lastRefund = user.fechaDevolucionTicket ? new Date(user.fechaDevolucionTicket) : null;
    
    const canRefund = !lastRefund || !isSameCRDay(now, lastRefund);

    let newTotalXp = user.xp;
    let newLevel = user.level;

    // Execute deletion and optional refund in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete user progress
      await tx.userProgress.delete({
        where: {
          userId_lugarId: {
            userId: user.id,
            lugarId: lugarId
          }
        }
      });

      // 2. Anti-Farming: Reverse XP if they earned any from this postcard
      const actionLog = await tx.userActionLog.findFirst({
        where: {
          userId: user.id,
          actionType: 'UNLOCK_POSTCARD',
          targetId: lugarId
        }
      });

      let xpToDeduct = 0;
      if (actionLog) {
        xpToDeduct = actionLog.xpAwarded || 0;
        await tx.userActionLog.delete({
          where: { id: actionLog.id }
        });
      }

      // 3. Update User (Refund ticket if applicable, and deduct XP)
      newTotalXp = Math.max(0, user.xp - xpToDeduct);
      newLevel = Math.floor(newTotalXp / 100) + 1;

      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: newTotalXp,
          level: newLevel,
          ...(canRefund && {
            estampillasDisponibles: { increment: 1 },
            fechaDevolucionTicket: now
          })
        }
      });

      if (canRefund) {
        refundedTicket = true;
      }
    });

    return { success: true, refundedTicket, newTotalXp, newLevel };
  } catch (error) {
    console.error("Error removing progress:", error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function updateUserBucketList(bucketList: string[], localUsername?: string, fallbackClerkId?: string) {
  try {
    const user = await ensureDbUser(localUsername, fallbackClerkId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { bucketList: bucketList }
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating bucket list:", error);
    return { success: false, error: 'Internal server error' };
  }
}

export interface PublicReviewItem {
  id: string;
  lugarId: string;
  lugarNombre: string;
  lugarNombreEn?: string | null;
  lugarCategoria: string;
  lugarUbicacion: string;
  lugarImagenUrl?: string | null;
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  userLevel: number;
  userXp: number;
  notas: string;
  fechaCompletado: string | null;
  ratingScore?: number;
}

export async function getPublicReviews(filters?: {
  categoria?: string;
  provincia?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'rating';
}) {
  try {
    const limit = filters?.limit ?? 20;
    const offset = filters?.offset ?? 0;
    const sortBy = filters?.sortBy ?? 'recent';

    const whereClause: any = {
      esPublico: true,
      notas: {
        not: null,
      },
      NOT: {
        notas: '',
      },
    };

    if (filters?.categoria && filters.categoria !== 'ALL') {
      whereClause.lugar = {
        ...whereClause.lugar,
        categoria: filters.categoria as any,
      };
    }

    if (filters?.provincia && filters.provincia !== 'ALL') {
      whereClause.lugar = {
        ...whereClause.lugar,
        ubicacion: {
          contains: filters.provincia,
          mode: 'insensitive',
        },
      };
    }

    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.trim();
      whereClause.AND = [
        {
          OR: [
            { lugar: { nombre: { contains: q, mode: 'insensitive' } } },
            { lugar: { nombre_en: { contains: q, mode: 'insensitive' } } },
            { notas: { contains: q, mode: 'insensitive' } },
            { user: { username: { contains: q, mode: 'insensitive' } } },
            { user: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const totalCount = await prisma.userProgress.count({
      where: whereClause,
    });

    const records = await prisma.userProgress.findMany({
      where: whereClause,
      include: {
        lugar: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            level: true,
            xp: true,
          },
        },
      },
      orderBy: {
        fechaCompletado: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Fetch ratings for these reviews
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

    let items: PublicReviewItem[] = records.map((r) => ({
      id: r.id,
      lugarId: r.lugarId,
      lugarNombre: r.lugar.nombre,
      lugarNombreEn: r.lugar.nombre_en,
      lugarCategoria: r.lugar.categoria,
      lugarUbicacion: r.lugar.ubicacion,
      lugarImagenUrl: r.lugar.imagenUrl,
      userId: r.userId,
      username: r.user.username,
      name: r.user.name,
      avatarUrl: r.user.avatarUrl,
      userLevel: r.user.level,
      userXp: r.user.xp,
      notas: r.notas || '',
      fechaCompletado: r.fechaCompletado ? r.fechaCompletado.toISOString() : null,
      ratingScore: ratingMap.get(`${r.userId}_${r.lugarId}`) || 0,
    }));

    if (sortBy === 'rating') {
      items.sort((a, b) => (b.ratingScore || 0) - (a.ratingScore || 0));
    }

    return {
      success: true,
      reviews: items,
      totalCount,
      hasMore: offset + items.length < totalCount,
    };
  } catch (error: any) {
    console.error('Error fetching public reviews:', error);
    return { success: false, error: error?.message || 'Error cargando las reseñas', reviews: [], totalCount: 0, hasMore: false };
  }
}
