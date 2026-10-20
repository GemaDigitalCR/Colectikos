"use server";

import prisma from "../lib/prisma";
import { ensureDbUser } from "./gamification";
import { getCRDate, getCRStartOfDayUTC } from "../lib/dateUtils";
import { PREGUNTIKAS_BANK, TriviaQuestion } from "../data/preguntikasBank";

const MAX_DAILY_GAMES = 2;
const MAX_DAILY_XP = 100;

export interface DailyPreguntikasStatus {
  gamesPlayedToday: number;
  gamesRemaining: number;
  todayEarnedXp: number;
  maxDailyGames: number;
  maxDailyXp: number;
  canPlay: boolean;
  crDateFormatted: string;
}

export interface AwardPreguntikasXPResult {
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
 * Retorna las 3 preguntas del día o 3 preguntas aleatorias para modo práctica.
 * - Modo oficial diario: Determinístico basado en la fecha oficial de Costa Rica (UTC-6).
 *   Todos los usuarios reciben las mismas 3 preguntas de 3 categorías distintas con fuentes oficiales.
 * - Modo práctica (forceRandom = true): 3 preguntas aleatorias de categorías variadas sin XP.
 */
export async function getDailyPreguntikasQuestions(forceRandom: boolean = false): Promise<TriviaQuestion[]> {
  const categories: TriviaQuestion["category"][] = [
    "GEOGRAFIA",
    "PARQUES",
    "FAUNA_FLORA",
    "HISTORIA_CULTURA",
  ];

  if (forceRandom) {
    // Mezclar categorías y tomar 3 distintas
    const shuffledCategories = [...categories].sort(() => 0.5 - Math.random()).slice(0, 3);
    return shuffledCategories.map((cat) => {
      const catQuestions = PREGUNTIKAS_BANK.filter((q) => q.category === cat);
      const randomIndex = Math.floor(Math.random() * catQuestions.length);
      return catQuestions[randomIndex];
    });
  }

  // Modo oficial: Basado en la fecha de Costa Rica
  const crDate = getCRDate(new Date());
  // Número de días transcurridos desde epoch en zona horaria CR
  const dayNumber = Math.floor(crDate.getTime() / (1000 * 60 * 60 * 24));

  // Seleccionar 3 categorías de las 4 rotando cuál se omite hoy
  const omitCategoryIndex = Math.abs(dayNumber) % 4;
  const chosenCategories = categories.filter((_, idx) => idx !== omitCategoryIndex);

  // Para cada una de las 3 categorías seleccionadas, elegir pregunta con rotación fija
  const selectedQuestions = chosenCategories.map((cat, catIdx) => {
    const catQuestions = PREGUNTIKAS_BANK.filter((q) => q.category === cat);
    const qIndex = Math.abs(dayNumber * 3 + catIdx * 7) % catQuestions.length;
    return catQuestions[qIndex];
  });

  return selectedQuestions;
}

/**
 * Consulta el estado de juego diario del usuario para Preguntikas.
 */
export async function getPreguntikasDailyStatus({
  localUsername,
  fallbackClerkId,
}: {
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<DailyPreguntikasStatus> {
  const crDate = getCRDate(new Date());
  const crDateFormatted = `${String(crDate.getUTCDate()).padStart(2, "0")}/${String(
    crDate.getUTCMonth() + 1
  ).padStart(2, "0")}/${crDate.getUTCFullYear()}`;

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
        crDateFormatted,
      };
    }

    const startOfCRDay = getCRStartOfDayUTC();

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId: dbUser.id,
        actionType: "PREGUNTIKAS_GAME",
        createdAt: { gte: startOfCRDay },
      },
      select: { xpAwarded: true },
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
      crDateFormatted,
    };
  } catch (error) {
    console.error("Error al consultar estado diario de Preguntikas:", error);
    return {
      gamesPlayedToday: 0,
      gamesRemaining: MAX_DAILY_GAMES,
      todayEarnedXp: 0,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      canPlay: true,
      crDateFormatted,
    };
  }
}

/**
 * Otorga XP según la cantidad de respuestas acertadas en Preguntikas:
 * - 3/3 aciertos: 50 XP (Puntaje perfecto)
 * - 2/3 aciertos: 30 XP (Gran conocedor)
 * - 1/3 aciertos: 15 XP (Buen intento)
 * - 0/3 aciertos: 5 XP (Participación y aprendizaje)
 * Máximo 2 partidas al día y tope de 100 XP diarios.
 */
export async function awardPreguntikasXP({
  correctCount,
  totalQuestions,
  timeSeconds,
  localUsername,
  fallbackClerkId,
}: {
  correctCount: number;
  totalQuestions: number;
  timeSeconds: number;
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<AwardPreguntikasXPResult> {
  let baseXp = 5;
  if (correctCount === 3) {
    baseXp = 50;
  } else if (correctCount === 2) {
    baseXp = 30;
  } else if (correctCount === 1) {
    baseXp = 15;
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
        error: "Usuario no autenticado",
      };
    }

    const userId = dbUser.id;
    const startOfCRDay = getCRStartOfDayUTC();

    const todayLogs = await prisma.userActionLog.findMany({
      where: {
        userId,
        actionType: "PREGUNTIKAS_GAME",
        createdAt: { gte: startOfCRDay },
      },
      select: { xpAwarded: true },
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);

    // Máximo 2 partidas al día
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
        error: "Límite alcanzado: Ya jugaste tus 2 partidas puntuadas de hoy.",
      };
    }

    // Respetar tope de 100 XP diarios
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
          actionType: "PREGUNTIKAS_GAME",
          targetId: `trivia_${correctCount}_of_${totalQuestions}_time_${timeSeconds}`,
          xpAwarded,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: newTotalXp,
          level: newLevel,
        },
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
    console.error("Error en awardPreguntikasXP:", error);
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
      error: error.message || "Error al procesar recompensa",
    };
  }
}
