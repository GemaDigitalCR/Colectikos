"use server";

import prisma from '../lib/prisma';
import { ensureDbUser } from './gamification';
import { getCRStartOfDayUTC } from '../lib/dateUtils';

const MAX_DAILY_RESCUES = 3;
const MAX_DAILY_XP = 90;

export interface SantuarioRewardResult {
  success: boolean;
  baseXp: number;
  xpAwarded: number;
  tikolonesAwarded: number;
  newTotalXp?: number;
  newLevel?: number;
  newTikolones?: number;
  limitReached: boolean;
  rescuesDoneToday: number;
  rescuesRemaining: number;
  todayEarnedXp: number;
  maxDailyRescues: number;
  maxDailyXp: number;
  animalId: string;
  error?: string;
}

/**
 * Consulta el estado diario de Santuario Tico para el usuario actual.
 */
export async function getSantuarioDailyStatus(
  localUsername?: string,
  fallbackClerkId?: string
) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return {
        isLoggedIn: false,
        rescuesDoneToday: 0,
        rescuesRemaining: MAX_DAILY_RESCUES,
        todayEarnedXp: 0,
        maxDailyRescues: MAX_DAILY_RESCUES,
        maxDailyXp: MAX_DAILY_XP,
        limitReached: false,
        userXp: 0,
        userLevel: 1,
        tikolones: 0,
      };
    }

    const userId = dbUser.id;
    const startOfCRDay = getCRStartOfDayUTC();

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'SANTUARIO_RESCUE',
        createdAt: { gte: startOfCRDay },
        xpAwarded: { gt: 0 },
      },
      select: { xpAwarded: true },
    });

    const rescuesDoneToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);
    const rescuesRemaining = Math.max(0, MAX_DAILY_RESCUES - rescuesDoneToday);
    const limitReached = rescuesRemaining === 0 || todayEarnedXp >= MAX_DAILY_XP;

    return {
      isLoggedIn: true,
      rescuesDoneToday,
      rescuesRemaining,
      todayEarnedXp,
      maxDailyRescues: MAX_DAILY_RESCUES,
      maxDailyXp: MAX_DAILY_XP,
      limitReached,
      userXp: dbUser.xp,
      userLevel: dbUser.level,
      tikolones: dbUser.tikolones,
    };
  } catch (error) {
    console.error("Error consultando estado diario de Santuario:", error);
    return {
      isLoggedIn: false,
      rescuesDoneToday: 0,
      rescuesRemaining: MAX_DAILY_RESCUES,
      todayEarnedXp: 0,
      maxDailyRescues: MAX_DAILY_RESCUES,
      maxDailyXp: MAX_DAILY_XP,
      limitReached: false,
      userXp: 0,
      userLevel: 1,
      tikolones: 0,
    };
  }
}

/**
 * Premia al usuario al completar con éxito la rehabilitación y liberación de un animal silvestre.
 */
export async function awardSantuarioRelease({
  animalId,
  localUsername,
  fallbackClerkId,
}: {
  animalId: string;
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<SantuarioRewardResult> {
  const baseXp = 30;
  const baseTikolones = 35;

  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return {
        success: false,
        baseXp,
        xpAwarded: 0,
        tikolonesAwarded: 0,
        limitReached: false,
        rescuesDoneToday: 0,
        rescuesRemaining: MAX_DAILY_RESCUES,
        todayEarnedXp: 0,
        maxDailyRescues: MAX_DAILY_RESCUES,
        maxDailyXp: MAX_DAILY_XP,
        animalId,
        error: 'Usuario no autenticado',
      };
    }

    const userId = dbUser.id;
    const startOfCRDay = getCRStartOfDayUTC();

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'SANTUARIO_RESCUE',
        createdAt: { gte: startOfCRDay },
        xpAwarded: { gt: 0 },
      },
      select: { xpAwarded: true },
    });

    const rescuesDoneToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);

    // Si ya alcanzó el límite diario
    if (rescuesDoneToday >= MAX_DAILY_RESCUES || todayEarnedXp >= MAX_DAILY_XP) {
      return {
        success: true,
        baseXp,
        xpAwarded: 0,
        tikolonesAwarded: 0,
        newTotalXp: dbUser.xp,
        newLevel: dbUser.level,
        newTikolones: dbUser.tikolones,
        limitReached: true,
        rescuesDoneToday,
        rescuesRemaining: 0,
        todayEarnedXp,
        maxDailyRescues: MAX_DAILY_RESCUES,
        maxDailyXp: MAX_DAILY_XP,
        animalId,
      };
    }

    const allowedXp = Math.min(baseXp, MAX_DAILY_XP - todayEarnedXp);

    // Transacción atómica
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: allowedXp },
          tikolones: { increment: baseTikolones },
        },
        select: { xp: true, level: true, tikolones: true },
      });

      await tx.userActionLog.create({
        data: {
          userId,
          actionType: 'SANTUARIO_RESCUE',
          targetId: `animal_${animalId}_${Date.now()}`,
          xpAwarded: allowedXp,
        },
      });

      return updatedUser;
    });

    const newRescuesDone = rescuesDoneToday + 1;
    const newTodayEarnedXp = todayEarnedXp + allowedXp;
    const newRescuesRemaining = Math.max(0, MAX_DAILY_RESCUES - newRescuesDone);

    return {
      success: true,
      baseXp,
      xpAwarded: allowedXp,
      tikolonesAwarded: baseTikolones,
      newTotalXp: result.xp,
      newLevel: result.level,
      newTikolones: result.tikolones,
      limitReached: newRescuesRemaining === 0 || newTodayEarnedXp >= MAX_DAILY_XP,
      rescuesDoneToday: newRescuesDone,
      rescuesRemaining: newRescuesRemaining,
      todayEarnedXp: newTodayEarnedXp,
      maxDailyRescues: MAX_DAILY_RESCUES,
      maxDailyXp: MAX_DAILY_XP,
      animalId,
    };
  } catch (error: any) {
    console.error("Error otorgando recompensa de Santuario:", error);
    return {
      success: false,
      baseXp,
      xpAwarded: 0,
      tikolonesAwarded: 0,
      limitReached: false,
      rescuesDoneToday: 0,
      rescuesRemaining: MAX_DAILY_RESCUES,
      todayEarnedXp: 0,
      maxDailyRescues: MAX_DAILY_RESCUES,
      maxDailyXp: MAX_DAILY_XP,
      animalId,
      error: error?.message || 'Error del servidor al registrar liberación',
    };
  }
}
