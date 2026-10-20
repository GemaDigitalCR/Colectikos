"use server";

import prisma from '../lib/prisma';
import { mockLugares } from '../data/mockData';
import { ensureDbUser } from './gamification';
import { getCRStartOfDayUTC } from '../lib/dateUtils';

export interface GamePostcard {
  id: string;
  nombre: string;
  nombre_en: string;
  categoria: string;
  ubicacion: string;
  imagenUrl: string;
}

const MAX_DAILY_GAMES = 2;
const MAX_DAILY_XP = 100;

/**
 * Obtiene 10 postales al azar de la colección de Costa Rica para armar la partida de Parejitikas.
 */
export async function getPostcardsForGame(): Promise<GamePostcard[]> {
  try {
    let pool: any[] = [];
    try {
      pool = await prisma.lugar.findMany({
        where: { isVisible: true },
        select: {
          id: true,
          nombre: true,
          nombre_en: true,
          categoria: true,
          ubicacion: true,
          imagenUrl: true,
        }
      });
    } catch (e) {
      console.warn("Error consultando BD para postales, usando mockData", e);
    }

    if (!pool || pool.length < 10) {
      pool = mockLugares.map(l => ({
        id: l.id,
        nombre: l.nombre,
        nombre_en: l.nombre_en || l.nombre,
        categoria: l.categoria,
        ubicacion: l.ubicacion,
        imagenUrl: l.imagenUrl,
      }));
    }

    // Filtrar solo las que tengan imagenUrl válida
    const validPool = pool.filter(p => p.imagenUrl && p.imagenUrl.trim().length > 0);
    const finalPool = validPool.length >= 10 ? validPool : pool;

    // Barajar con Fisher-Yates
    const shuffled = [...finalPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, 10).map(p => ({
      id: p.id,
      nombre: p.nombre,
      nombre_en: p.nombre_en || p.nombre,
      categoria: p.categoria || "EXPLORACION",
      ubicacion: p.ubicacion || "Costa Rica",
      imagenUrl: p.imagenUrl || "",
    }));

    return selected;
  } catch (error) {
    console.error("Error al obtener postales para el juego:", error);
    return [];
  }
}

export interface DailyParejitikasStatus {
  gamesPlayedToday: number;
  gamesRemaining: number;
  todayEarnedXp: number;
  maxDailyGames: number;
  maxDailyXp: number;
  canPlay: boolean;
}

/**
 * Consulta cuántas partidas ha jugado el usuario hoy en Parejitikas (máx 2) y cuánto XP ha acumulado.
 */
export async function getParejitikasDailyStatus({
  localUsername,
  fallbackClerkId,
}: {
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<DailyParejitikasStatus> {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return {
        gamesPlayedToday: 0,
        gamesRemaining: MAX_DAILY_GAMES,
        todayEarnedXp: 0,
        maxDailyGames: MAX_DAILY_GAMES,
        maxDailyXp: MAX_DAILY_XP,
        canPlay: true,
      };
    }

    const startOfCRDay = getCRStartOfDayUTC();

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId: dbUser.id,
        actionType: 'PAREJITIKAS_GAME',
        createdAt: { gte: startOfCRDay }
      },
      select: { xpAwarded: true }
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);
    const gamesRemaining = Math.max(0, MAX_DAILY_GAMES - gamesPlayedToday);

    return {
      gamesPlayedToday,
      gamesRemaining,
      todayEarnedXp,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      canPlay: gamesRemaining > 0,
    };
  } catch (error) {
    console.error("Error al consultar estado diario de Parejitikas:", error);
    return {
      gamesPlayedToday: 0,
      gamesRemaining: MAX_DAILY_GAMES,
      todayEarnedXp: 0,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      canPlay: true,
    };
  }
}

export interface AwardXPResult {
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
 * Calcula y otorga los XPs al usuario según su desempeño de jugadas en Parejitikas:
 * - Máximo de 2 partidas por día.
 * - Hasta 14 jugadas (Memoria Élite / Oro): 50 XP
 * - 15 - 18 jugadas (Excelente / Plata): 40 XP
 * - 19 - 24 jugadas (Muy Bien / Bronce): 30 XP
 * - 25 - 30 jugadas (Tablero completado): 20 XP
 * - 31 - 36 jugadas (Buen esfuerzo): 10 XP
 * - 37+ jugadas (Participación completada): 5 XP
 * Con un tope de 2 partidas y 100 XPs diarios en total.
 */
export async function awardParejitikasXP({
  moves,
  timeSeconds,
  localUsername,
  fallbackClerkId,
}: {
  moves: number;
  timeSeconds: number;
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<AwardXPResult> {
  // Calcular puntuación base
  let baseXp = 0;
  if (moves <= 14) {
    baseXp = 50;
  } else if (moves <= 18) {
    baseXp = 40;
  } else if (moves <= 24) {
    baseXp = 30;
  } else if (moves <= 30) {
    baseXp = 20;
  } else if (moves <= 36) {
    baseXp = 10;
  } else {
    baseXp = 5;
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

    // Consultar partidas y XP de hoy
    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: 'PAREJITIKAS_GAME',
        createdAt: { gte: startOfCRDay }
      },
      select: { xpAwarded: true }
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);

    // REGLA CRÍTICA: Máximo 2 partidas por día
    if (gamesPlayedToday >= MAX_DAILY_GAMES) {
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
        error: 'Límite alcanzado: Ya jugaste tus 2 partidas de hoy.',
      };
    }

    // Calcular XP a otorgar respetando el tope de 100 XP diarios
    const remainingXpQuota = Math.max(0, MAX_DAILY_XP - todayEarnedXp);
    const xpAwarded = Math.min(baseXp, remainingXpQuota);

    const newGamesPlayed = gamesPlayedToday + 1;
    const newGamesRemaining = Math.max(0, MAX_DAILY_GAMES - newGamesPlayed);
    const limitReached = newGamesRemaining === 0;

    const newTotalXp = dbUser.xp + xpAwarded;
    const newLevel = Math.floor(newTotalXp / 100) + 1;

    await prisma.$transaction(async (tx) => {
      await tx.userActionLog.create({
        data: {
          userId,
          actionType: 'PAREJITIKAS_GAME',
          targetId: `game_${newGamesPlayed}_moves_${moves}_time_${timeSeconds}`,
          xpAwarded
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: newTotalXp,
          level: newLevel
        }
      });
    });

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
  } catch (error: any) {
    console.error("Error en awardParejitikasXP:", error);
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
      error: error.message || 'Error al procesar recompensa',
    };
  }
}
