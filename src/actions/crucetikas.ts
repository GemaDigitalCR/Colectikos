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
  retryWithoutPenalty?: boolean;
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

    // Solo contabilizamos partidas donde REALMENTE se ganó XP hoy
    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'CRUCETIKAS_GAME',
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
  // Escala de Desempeño justa, transparente y amigable:
  // - Llegar al Parque Nacional (75m+) o salvar a Otico -> 30 XP (máximo por turno)
  // - Llegar a la mitad del camino (35m+) o recoger al menos 2 hojas -> 20 XP
  // - Cruzar la primera sección de carretera (12m+) o recoger 1 hoja -> 10 XP
  // - Choque prematuro en los primeros pasos (<12m sin hojas) -> 0 XP (NO consume turno)
  let baseXp = 0;
  if (distance >= 75 || slothsSaved >= 1) {
    baseXp = 30;
  } else if (distance >= 35 || leavesCollected >= 2) {
    baseXp = 20;
  } else if (distance >= 12 || leavesCollected >= 1) {
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

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'CRUCETIKAS_GAME',
        createdAt: { gte: startOfCRDay },
        xpAwarded: { gt: 0 }
      },
      select: { xpAwarded: true }
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);
    const gamesRemaining = Math.max(0, MAX_DAILY_GAMES - gamesPlayedToday);

    // Límite diario de 3 partidas con recompensa alcanzado
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

    // Si la partida no alcanzó el puntaje mínimo (ej. atropello inmediato en los primeros 11m),
    // NO consumimos el turno ni penalizamos al usuario. Puede volver a intentarlo de inmediato.
    if (baseXp === 0) {
      return {
        success: true,
        baseXp: 0,
        xpAwarded: 0,
        newTotalXp: dbUser.xp,
        newLevel: dbUser.level,
        limitReached: false,
        gamesPlayedToday,
        gamesRemaining,
        todayEarnedXp,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
        retryWithoutPenalty: true,
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

