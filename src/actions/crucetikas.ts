"use server";

import prisma from '../lib/prisma';
import { ensureDbUser } from './gamification';
import { getCRStartOfDayUTC } from '../lib/dateUtils';

const MAX_DAILY_GAMES = 3;
const MAX_DAILY_XP = 90;

export interface CrucetikasRewardResult {
  success: boolean;
  baseXp: number;
  xpAwarded: number;
  newTotalXp?: number;
  newLevel?: number;
  limitReached: boolean;
  gamesPlayedToday: number;
  gamesRemaining: number;
  todayEarnedXp: number;
  maxDailyGames: number;
  maxDailyXp: number;
  error?: string;
}

/**
 * Consulta el estado diario de Crucetikas para el usuario (partidas jugadas y restantes hoy).
 */
export async function getCrucetikasDailyStatus(
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
      };
    }

    const userId = dbUser.id;
    const startOfCRDay = getCRStartOfDayUTC();

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'CRUCETIKAS_GAME',
        createdAt: { gte: startOfCRDay }
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
    };
  } catch (error) {
    console.error("Error consultando estado diario de Crucetikas:", error);
    return {
      isLoggedIn: false,
      gamesPlayedToday: 0,
      gamesRemaining: MAX_DAILY_GAMES,
      todayEarnedXp: 0,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      limitReached: false,
    };
  }
}

/**
 * Otorga XP al completar o finalizar una partida de Crucetikas.
 * Basado en la distancia recorrida, perezosos salvados y hojas de guarumo recogidas.
 */
export async function awardCrucetikasXp({
  distance,
  slothsSaved,
  leavesCollected,
  localUsername,
  fallbackClerkId
}: {
  distance: number;
  slothsSaved: number;
  leavesCollected: number;
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<CrucetikasRewardResult> {
  // Escala de Desempeño aprobada:
  // - Nivel Básico (20m a 45m o al menos 1 hoja de Guarumo recogida) -> 10 XP
  // - Nivel Intermedio (50m a 70m o 3 hojas recogidas) -> 20 XP
  // - Nivel Maestría (Llegar al Parque Nacional: 75m+ o salvar a Otico) -> 30 XP (máx por turno)
  // - Menos de 15m sin hojas -> 0 XP (protección anti-farming)
  let baseXp = 0;
  if (distance >= 75 || slothsSaved >= 1) {
    baseXp = 30;
  } else if (distance >= 50 || leavesCollected >= 3) {
    baseXp = 20;
  } else if (distance >= 20 || leavesCollected >= 1) {
    baseXp = 10;
  } else {
    baseXp = 0;
  }

  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return {
        success: false,
        baseXp,
        xpAwarded: 0,
        limitReached: false,
        gamesPlayedToday: 1,
        gamesRemaining: 1,
        todayEarnedXp: 0,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
        error: 'Usuario no autenticado',
      };
    }

    const userId = dbUser.id;
    const startOfCRDay = getCRStartOfDayUTC();

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'CRUCETIKAS_GAME',
        createdAt: { gte: startOfCRDay }
      },
      select: { xpAwarded: true }
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);

    // Límite diario de 2 partidas con recompensa
    if (gamesPlayedToday >= MAX_DAILY_GAMES || todayEarnedXp >= MAX_DAILY_XP) {
      return {
        success: false,
        baseXp,
        xpAwarded: 0,
        newTotalXp: dbUser.xp,
        newLevel: dbUser.level,
        limitReached: true,
        gamesPlayedToday,
        gamesRemaining: 0,
        todayEarnedXp,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
        error: 'Límite diario alcanzado: Ya jugaste tus partidas remuneradas de hoy.',
      };
    }

    const remainingXpQuota = Math.max(0, MAX_DAILY_XP - todayEarnedXp);
    const xpAwarded = Math.min(baseXp, remainingXpQuota);

    const newGamesPlayed = gamesPlayedToday + 1;
    const newGamesRemaining = Math.max(0, MAX_DAILY_GAMES - newGamesPlayed);
    const limitReached = newGamesRemaining === 0 || (todayEarnedXp + xpAwarded) >= MAX_DAILY_XP;

    const newTotalXp = dbUser.xp + xpAwarded;
    const newLevel = Math.max(1, Math.floor(newTotalXp / 100) + 1);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          xp: newTotalXp,
          level: newLevel,
        }
      }),
      prisma.userActionLog.create({
        data: {
          userId,
          actionType: 'CRUCETIKAS_GAME',
          targetId: `dist_${distance}_sloths_${slothsSaved}`,
          xpAwarded,
        }
      })
    ]);

    return {
      success: true,
      baseXp,
      xpAwarded,
      newTotalXp,
      newLevel,
      limitReached,
      gamesPlayedToday: newGamesPlayed,
      gamesRemaining: newGamesRemaining,
      todayEarnedXp: todayEarnedXp + xpAwarded,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
    };
  } catch (error) {
    console.error("Error premiando XP en Crucetikas:", error);
    return {
      success: false,
      baseXp,
      xpAwarded: 0,
      limitReached: false,
      gamesPlayedToday: 0,
      gamesRemaining: MAX_DAILY_GAMES,
      todayEarnedXp: 0,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      error: 'Error interno guardando progreso',
    };
  }
}

