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
  playedQuestionIdsToday?: string[];
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
 * Retorna 3 preguntas variadas y garantiza que no se repitan preguntas entre intentos.
 * - attemptIndex = 0: Intento 1 del día.
 * - attemptIndex = 1: Intento 2 del día (excluye estrictamente las preguntas de intento 1).
 * - attemptIndex >= 2 o forceRandom = true: Modo práctica (excluye preguntas ya jugadas).
 * - Mayor aleatoriedad y rotación sobre el banco de 52 preguntas oficiales verificadas.
 */
export async function getDailyPreguntikasQuestions(
  forceRandom: boolean = false,
  attemptIndex: number = 0,
  excludeIds: string[] = []
): Promise<TriviaQuestion[]> {
  const categories: TriviaQuestion["category"][] = [
    "GEOGRAFIA",
    "PARQUES",
    "FAUNA_FLORA",
    "HISTORIA_CULTURA",
  ];

  const crDate = getCRDate(new Date());
  const dayNumber = Math.floor(crDate.getTime() / (1000 * 60 * 60 * 24));

  // Determinar qué categoría descansa en el intento 1 según el día del año
  const omitCategoryIndex1 = Math.abs(dayNumber) % 4;

  let chosenCategories: TriviaQuestion["category"][];

  if (forceRandom || attemptIndex >= 2) {
    // Modo práctica: mezclar las 4 categorías y tomar 3 al azar
    chosenCategories = [...categories].sort(() => 0.5 - Math.random()).slice(0, 3);
  } else if (attemptIndex === 1) {
    // Intento 2 oficial: Priorizar la categoría que descansó en el intento 1 para máxima variedad temática
    const restedCategory = categories[omitCategoryIndex1];
    const otherCategories = categories.filter((c) => c !== restedCategory);
    const shuffledOthers = [...otherCategories].sort(() => 0.5 - Math.random()).slice(0, 2);
    chosenCategories = [restedCategory, ...shuffledOthers];
  } else {
    // Intento 1 oficial: Las 3 categorías del día
    chosenCategories = categories.filter((_, idx) => idx !== omitCategoryIndex1);
  }

  // Mezclar el orden de las categorías elegidas para variedad en la presentación
  const shuffledChosenCats = [...chosenCategories].sort(() => 0.5 - Math.random());

  const currentExcludeSet = new Set(excludeIds);
  const selectedQuestions: TriviaQuestion[] = [];

  for (const cat of shuffledChosenCats) {
    // Filtrar preguntas de la categoría que NO hayan salido en la sesión/día
    let catPool = PREGUNTIKAS_BANK.filter(
      (q) => q.category === cat && !currentExcludeSet.has(q.id)
    );

    // Si se agotaron las preguntas de esa categoría en una sesión muy larga, reiniciar el pool
    if (catPool.length === 0) {
      catPool = PREGUNTIKAS_BANK.filter((q) => q.category === cat);
    }

    // Selección aleatoria entre las preguntas disponibles de esa categoría
    const randomIndex = Math.floor(Math.random() * catPool.length);
    const chosen = catPool[randomIndex];
    selectedQuestions.push(chosen);
    currentExcludeSet.add(chosen.id);
  }

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
      select: { xpAwarded: true, targetId: true },
    });

    const gamesPlayedToday = todayLogs.length;
    const todayEarnedXp = todayLogs.reduce((sum, log) => sum + (log.xpAwarded || 0), 0);
    const gamesRemaining = Math.max(0, MAX_DAILY_GAMES - gamesPlayedToday);

    // Extraer preguntas ya jugadas hoy por este usuario para evitar repeticiones
    const playedQuestionIdsToday: string[] = [];
    todayLogs.forEach((log) => {
      if (log.targetId && log.targetId.includes("_q_")) {
        const parts = log.targetId.split("_q_");
        if (parts[1]) {
          const ids = parts[1].split(",");
          ids.forEach((id) => {
            if (id && !playedQuestionIdsToday.includes(id)) {
              playedQuestionIdsToday.push(id);
            }
          });
        }
      }
    });

    return {
      gamesPlayedToday,
      gamesRemaining,
      todayEarnedXp,
      maxDailyGames: MAX_DAILY_GAMES,
      maxDailyXp: MAX_DAILY_XP,
      canPlay: gamesRemaining > 0,
      crDateFormatted,
      playedQuestionIdsToday,
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
  questionIds = [],
  localUsername,
  fallbackClerkId,
}: {
  correctCount: number;
  totalQuestions: number;
  timeSeconds: number;
  questionIds?: string[];
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

    const qSuffix = questionIds.length > 0 ? `_q_${questionIds.join(",")}` : "";

    await prisma.$transaction(async (tx) => {
      await tx.userActionLog.create({
        data: {
          userId,
          actionType: "PREGUNTIKAS_GAME",
          targetId: `trivia_${correctCount}_of_${totalQuestions}_time_${timeSeconds}${qSuffix}`,
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
