"use server";

import prisma from '../lib/prisma';
import { ensureDbUser } from './gamification';
import { getCRStartOfDayUTC } from '../lib/dateUtils';

const MAX_DAILY_GAMES = 3;
const MAX_DAILY_XP = 90;

export interface MareaLimpiaRewardResult {
  success: boolean;
  baseXp: number;
  xpAwarded: number;
  tikolonesAwarded: number;
  newTotalXp?: number;
  newLevel?: number;
  newTikolones?: number;
  limitReached: boolean;
  gamesPlayedToday: number;
  gamesRemaining: number;
  todayEarnedXp: number;
  maxDailyGames: number;
  maxDailyXp: number;
  retryWithoutPenalty?: boolean;
  error?: string;
}

/**
 * Consulta el estado diario de Marea Limpia para el usuario.
 */
export async function getMareaLimpiaDailyStatus(
  localUsername?: string,
  fallbackClerkId?: string
) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return {
        isLoggedIn: false,
        gamesPlayedToday: 0,
        gamesRemaining: MAX_DAILY_GAMES,
        todayEarnedXp: 0,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
        limitReached: false,
        userXp: 0,
        userLevel: 1,
        tikolones: 0,
      };
    }

    const userId = dbUser.id;
    const startOfCRDay = getCRStartOfDayUTC();

    // Partidas donde se ganó XP hoy
    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'MAREA_LIMPIA_GAME',
        createdAt: { gte: startOfCRDay },
        xpAwarded: { gt: 0 }
      },
      select: { xpAwarded: true }
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);
    const gamesRemaining = Math.max(0, MAX_DAILY_GAMES - gamesPlayedToday);
    const limitReached = gamesRemaining === 0 || todayEarnedXp >= MAX_DAILY_XP;

    return {
      isLoggedIn: true,
      gamesPlayedToday,
      gamesRemaining,
      todayEarnedXp,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      limitReached,
      userXp: dbUser.xp,
      userLevel: dbUser.level,
      tikolones: dbUser.tikolones,
    };
  } catch (error) {
    console.error("Error consultando estado diario de Marea Limpia:", error);
    return {
      isLoggedIn: false,
      gamesPlayedToday: 0,
      gamesRemaining: MAX_DAILY_GAMES,
      todayEarnedXp: 0,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      limitReached: false,
      userXp: 0,
      userLevel: 1,
      tikolones: 0,
    };
  }
}

/**
 * Otorga XP y Tikolones al completar o finalizar una partida de Marea Limpia.
 */
export async function awardMareaLimpiaXp({
  score,
  trashCollected,
  turtlesSaved,
  maxCombo,
  localUsername,
  fallbackClerkId
}: {
  score: number;
  trashCollected: number;
  turtlesSaved: number;
  maxCombo: number;
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<MareaLimpiaRewardResult> {
  // Escala de recompensas:
  // - Partida destacada (score >= 400 o 6+ tortuguitas salvadas) -> 30 XP + 40 Tikolones
  // - Partida media (score >= 200 o 3+ tortuguitas salvadas) -> 20 XP + 25 Tikolones
  // - Partida básica (score >= 60 o 1+ tortuguita salvada) -> 10 XP + 15 Tikolones
  // - Partida nula (< 60 puntos) -> 0 XP (reintento sin penalización)
  let baseXp = 0;
  let baseTikolones = 0;

  if (score >= 400 || turtlesSaved >= 6) {
    baseXp = 30;
    baseTikolones = 40;
  } else if (score >= 200 || turtlesSaved >= 3) {
    baseXp = 20;
    baseTikolones = 25;
  } else if (score >= 60 || turtlesSaved >= 1 || trashCollected >= 5) {
    baseXp = 10;
    baseTikolones = 15;
  } else {
    baseXp = 0;
    baseTikolones = 0;
  }

  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return {
        success: false,
        baseXp,
        xpAwarded: 0,
        tikolonesAwarded: 0,
        limitReached: false,
        gamesPlayedToday: 0,
        gamesRemaining: MAX_DAILY_GAMES,
        todayEarnedXp: 0,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
        error: 'Usuario no autenticado',
      };
    }

    const userId = dbUser.id;
    const startOfCRDay = getCRStartOfDayUTC();

    if (baseXp === 0) {
      const todayLogs = await prisma.userActionLog.findMany({
        where: {
          userId,
          actionType: 'MAREA_LIMPIA_GAME',
          createdAt: { gte: startOfCRDay },
          xpAwarded: { gt: 0 }
        },
        select: { xpAwarded: true }
      });
      const gamesPlayedToday = todayLogs.length;
      const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);
      const gamesRemaining = Math.max(0, MAX_DAILY_GAMES - gamesPlayedToday);

      return {
        success: true,
        baseXp: 0,
        xpAwarded: 0,
        tikolonesAwarded: 0,
        newTotalXp: dbUser.xp,
        newLevel: dbUser.level,
        newTikolones: dbUser.tikolones,
        limitReached: gamesRemaining === 0 || todayEarnedXp >= MAX_DAILY_XP,
        gamesPlayedToday,
        gamesRemaining,
        todayEarnedXp,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
        retryWithoutPenalty: true,
      };
    }

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'MAREA_LIMPIA_GAME',
        createdAt: { gte: startOfCRDay },
        xpAwarded: { gt: 0 }
      },
      select: { xpAwarded: true }
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);

    if (gamesPlayedToday >= MAX_DAILY_GAMES || todayEarnedXp >= MAX_DAILY_XP) {
      return {
        success: true,
        baseXp,
        xpAwarded: 0,
        tikolonesAwarded: 0,
        newTotalXp: dbUser.xp,
        newLevel: dbUser.level,
        newTikolones: dbUser.tikolones,
        limitReached: true,
        gamesPlayedToday,
        gamesRemaining: 0,
        todayEarnedXp,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
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
        select: { xp: true, level: true, tikolones: true }
      });

      await tx.userActionLog.create({
        data: {
          userId,
          actionType: 'MAREA_LIMPIA_GAME',
          targetId: `score_${score}_turtles_${turtlesSaved}_combo_${maxCombo}`,
          xpAwarded: allowedXp
        }
      });

      return updatedUser;
    });

    const newGamesPlayed = gamesPlayedToday + 1;
    const newTodayEarnedXp = todayEarnedXp + allowedXp;
    const newGamesRemaining = Math.max(0, MAX_DAILY_GAMES - newGamesPlayed);

    return {
      success: true,
      baseXp,
      xpAwarded: allowedXp,
      tikolonesAwarded: baseTikolones,
      newTotalXp: result.xp,
      newLevel: result.level,
      newTikolones: result.tikolones,
      limitReached: newGamesRemaining === 0 || newTodayEarnedXp >= MAX_DAILY_XP,
      gamesPlayedToday: newGamesPlayed,
      gamesRemaining: newGamesRemaining,
      todayEarnedXp: newTodayEarnedXp,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
    };
  } catch (error: any) {
    console.error("Error otorgando recompensa de Marea Limpia:", error);
    return {
      success: false,
      baseXp,
      xpAwarded: 0,
      tikolonesAwarded: 0,
      limitReached: false,
      gamesPlayedToday: 0,
      gamesRemaining: MAX_DAILY_GAMES,
      todayEarnedXp: 0,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      error: error?.message || 'Error del servidor al registrar partida'
    };
  }
}
