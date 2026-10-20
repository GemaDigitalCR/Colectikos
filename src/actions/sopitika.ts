"use server";

import prisma from '../lib/prisma';
import { mockLugares } from '../data/mockData';
import { ensureDbUser } from './gamification';
import { getCRStartOfDayUTC } from '../lib/dateUtils';

export interface GameWordPlace {
  id: string;
  word: string;          // Limpia para la sopa (ej. "ARENAL", "CORCOVADO")
  nombre: string;        // Nombre visible en español
  nombre_en: string;     // Nombre visible en inglés
  categoria: string;
  ubicacion: string;
  imagenUrl: string;
}

const MAX_DAILY_GAMES = 2;
const MAX_DAILY_XP = 100;

// Lista garantizada de destinos emblemáticos de Costa Rica con longitudes entre 4 y 10 letras
const FALLBACK_SOPITIKA_PLACES: GameWordPlace[] = [
  { id: "p-arenal", word: "ARENAL", nombre: "Volcán Arenal", nombre_en: "Arenal Volcano", categoria: "VOLCAN", ubicacion: "Alajuela", imagenUrl: "/images/Postales_Volcanes/Postales-volcanes-Arenal.png" },
  { id: "p-poas", word: "POAS", nombre: "Volcán Poás", nombre_en: "Poás Volcano", categoria: "VOLCAN", ubicacion: "Alajuela", imagenUrl: "/images/Postales_Volcanes/Postales-volcanes-Poas.png" },
  { id: "p-irazu", word: "IRAZU", nombre: "Volcán Irazú", nombre_en: "Irazú Volcano", categoria: "VOLCAN", ubicacion: "Cartago", imagenUrl: "/images/Postales_Volcanes/Postales-volcanes-Irazu.png" },
  { id: "p-turrialba", word: "TURRIALBA", nombre: "Volcán Turrialba", nombre_en: "Turrialba Volcano", categoria: "VOLCAN", ubicacion: "Cartago", imagenUrl: "/images/Postales_Volcanes/Postales-volcanes-Turrialba.png" },
  { id: "p-corcovado", word: "CORCOVADO", nombre: "Parque Corcovado", nombre_en: "Corcovado Park", categoria: "PARQUE_NACIONAL", ubicacion: "Puntarenas", imagenUrl: "/images/Postales_Parques/Postales-parques-Corcovado.png" },
  { id: "p-tortuguero", word: "TORTUGUERO", nombre: "Tortuguero", nombre_en: "Tortuguero", categoria: "PARQUE_NACIONAL", ubicacion: "Limón", imagenUrl: "/images/Postales_Parques/Postales-parques-Tortuguero.png" },
  { id: "p-cahuita", word: "CAHUITA", nombre: "Cahuita", nombre_en: "Cahuita", categoria: "PARQUE_NACIONAL", ubicacion: "Limón", imagenUrl: "/images/Postales_Parques/Postales-parques-Cahuita.png" },
  { id: "p-chirripo", word: "CHIRRIPO", nombre: "Cerro Chirripó", nombre_en: "Mount Chirripó", categoria: "PARQUE_NACIONAL", ubicacion: "Pérez Zeledón", imagenUrl: "/images/Postales_Parques/Postales-parques-Chirripo.png" },
  { id: "p-conchal", word: "CONCHAL", nombre: "Playa Conchal", nombre_en: "Conchal Beach", categoria: "PLAYA", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Playas/Postales-playas-Conchal.png" },
  { id: "p-tamarindo", word: "TAMARINDO", nombre: "Tamarindo", nombre_en: "Tamarindo", categoria: "PLAYA", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Playas/Postales-playas-Tamarindo.png" },
  { id: "p-samara", word: "SAMARA", nombre: "Sámara", nombre_en: "Sámara", categoria: "PLAYA", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Playas/Postales-playas-Samara.png" },
  { id: "p-flamingo", word: "FLAMINGO", nombre: "Playa Flamingo", nombre_en: "Flamingo Beach", categoria: "PLAYA", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Playas/Postales-playas-Flamingo.png" },
  { id: "p-monteverde", word: "MONTEVERDE", nombre: "Monteverde", nombre_en: "Monteverde", categoria: "BOSQUES_RESERVAS", ubicacion: "Puntarenas", imagenUrl: "/images/Postales_Reservas/Postales-reservas-Monteverde.png" },
  { id: "p-uvita", word: "UVITA", nombre: "Playa Uvita", nombre_en: "Uvita Beach", categoria: "PLAYA", ubicacion: "Puntarenas", imagenUrl: "/images/Postales_Playas/Postales-playas-Uvita.png" },
  { id: "p-dominical", word: "DOMINICAL", nombre: "Dominical", nombre_en: "Dominical", categoria: "PLAYA", ubicacion: "Puntarenas", imagenUrl: "/images/Postales_Playas/Postales-playas-Dominical.png" },
  { id: "p-nosara", word: "NOSARA", nombre: "Nosara", nombre_en: "Nosara", categoria: "PLAYA", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Playas/Postales-playas-Nosara.png" },
  { id: "p-barva", word: "BARVA", nombre: "Volcán Barva", nombre_en: "Barva Volcano", categoria: "VOLCAN", ubicacion: "Heredia", imagenUrl: "/images/Postales_Volcanes/Postales-volcanes-Barva.png" },
  { id: "p-tenorio", word: "TENORIO", nombre: "Volcán Tenorio", nombre_en: "Tenorio Volcano", categoria: "VOLCAN", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Volcanes/Postales-volcanes-Tenorio.png" },
  { id: "p-rincon", word: "RINCON", nombre: "Rincón de la Vieja", nombre_en: "Rincón de la Vieja", categoria: "PARQUE_NACIONAL", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Parques/Postales-parques-Rincon.png" },
  { id: "p-canonegro", word: "CAÑONEGRO", nombre: "Caño Negro", nombre_en: "Caño Negro", categoria: "PARQUE_NACIONAL", ubicacion: "Alajuela", imagenUrl: "/images/Postales_Parques/Postales-parques-Tortuguero.png" },
  { id: "p-cartago", word: "CARTAGO", nombre: "Cartago", nombre_en: "Cartago", categoria: "PROVINCIA", ubicacion: "Valle Central", imagenUrl: "/images/Postales_Provincias/Postales-provincias-cartago.png" },
  { id: "p-heredia", word: "HEREDIA", nombre: "Heredia", nombre_en: "Heredia", categoria: "PROVINCIA", ubicacion: "Valle Central", imagenUrl: "/images/Postales_Provincias/Postales-provincias-heredia.png" },
  { id: "p-alajuela", word: "ALAJUELA", nombre: "Alajuela", nombre_en: "Alajuela", categoria: "PROVINCIA", ubicacion: "Valle Central", imagenUrl: "/images/Postales_Provincias/Postales-provincias-alajuela.png" },
  { id: "p-limon", word: "LIMON", nombre: "Limón", nombre_en: "Limón", categoria: "PROVINCIA", ubicacion: "Caribe", imagenUrl: "/images/Postales_Provincias/Postales-provincias-limon.png" },
  { id: "p-hermosa", word: "HERMOSA", nombre: "Playa Hermosa", nombre_en: "Hermosa Beach", categoria: "PLAYA", ubicacion: "Guanacaste", imagenUrl: "/images/Postales_Playas/Postales-playas-Hermosa.png" },
];

/**
 * Limpia el texto para la sopa de letras:
 * Remueve tildes de vocales (á, é, í, ó, ú, ü) PERO preserva con orgullo la letra Ñ.
 */
function cleanWordForGrid(text: string): string {
  return text
    .replace(/[áäàâ]/gi, "A")
    .replace(/[éëèê]/gi, "E")
    .replace(/[íïìî]/gi, "I")
    .replace(/[óöòô]/gi, "O")
    .replace(/[úüùû]/gi, "U")
    .replace(/ñ/gi, "Ñ")
    .replace(/[^A-ZÑ]/gi, "")
    .toUpperCase();
}

const GENERIC_PREFIXES = [
  /^volc[aá]n\s+/i,
  /^parque\s+nacional\s+/i,
  /^parque\s+/i,
  /^playa\s+/i,
  /^reserva\s+biol[oó]gica\s+/i,
  /^reserva\s+/i,
  /^refugio\s+de\s+vida\s+silvestre\s+/i,
  /^refugio\s+/i,
  /^catarata\s+/i,
  /^cerro\s+/i,
  /^isla\s+del\s+/i,
  /^isla\s+/i,
  /^monumento\s+nacional\s+/i,
];

// Palabras que al quedar solas pierden sentido como destino turístico
const DISALLOWED_ORPHAN_WORDS = new Set([
  'VOLCAN', 'PARQUE', 'PLAYA', 'CERRO', 'ISLA', 'PUERTO', 'BAHIA',
  'VALLE', 'SANTA', 'MONTE', 'CIUDAD', 'NORTE', 'SUR', 'CANO', 'CAÑO',
  'BAJO', 'ALTO', 'SAN', 'DEL', 'LOS', 'LAS', 'GRAN', 'NUEVO', 'VIEJO'
]);

/**
 * Obtiene lugares para armar la sopa de letras Sopitika.
 * Retorna candidatos aptos para una cuadrícula 11x11 (entre 4 y 10 letras).
 */
export async function getPlacesForSopitika(): Promise<GameWordPlace[]> {
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
      console.warn("Error consultando BD para Sopitika, usando mockLugares", e);
    }

    if (!pool || pool.length === 0) {
      pool = mockLugares;
    }

    // Convertir lugares a palabras válidas
    const processedMap = new Map<string, GameWordPlace>();

    for (const p of pool) {
      // 1. Probar nombre completo limpio (ej. "Caño Negro" -> "CAÑONEGRO")
      let clean = cleanWordForGrid(p.nombre);
      
      // Si el nombre completo es largo (>10), intentamos quitando prefijo genérico
      if (clean.length > 10) {
        let strippedName = p.nombre;
        for (const prefix of GENERIC_PREFIXES) {
          if (prefix.test(strippedName)) {
            strippedName = strippedName.replace(prefix, "").trim();
            break;
          }
        }
        clean = cleanWordForGrid(strippedName);
      }

      // Validar que la palabra tenga entre 4 y 10 letras y no sea huérfana
      if (clean.length >= 4 && clean.length <= 10 && !DISALLOWED_ORPHAN_WORDS.has(clean) && !processedMap.has(clean)) {
        processedMap.set(clean, {
          id: p.id,
          word: clean,
          nombre: p.nombre,
          nombre_en: p.nombre_en || p.nombre,
          categoria: p.categoria || "EXPLORACION",
          ubicacion: p.ubicacion || "Costa Rica",
          imagenUrl: p.imagenUrl || "",
        });
      }
    }

    // Complementar con la lista garantizada
    for (const fb of FALLBACK_SOPITIKA_PLACES) {
      if (!processedMap.has(fb.word)) {
        processedMap.set(fb.word, fb);
      }
    }

    const allCandidates = Array.from(processedMap.values());

    // Barajar aleatoriamente
    for (let i = allCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCandidates[i], allCandidates[j]] = [allCandidates[j], allCandidates[i]];
    }

    // Devolver un lote de hasta 20 para que el cliente elija 6 que quepan perfecto
    return allCandidates.slice(0, 20);
  } catch (error) {
    console.error("Error al obtener lugares para Sopitika:", error);
    return FALLBACK_SOPITIKA_PLACES;
  }
}

export interface DailySopitikaStatus {
  gamesPlayedToday: number;
  gamesRemaining: number;
  todayEarnedXp: number;
  maxDailyGames: number;
  maxDailyXp: number;
  canPlay: boolean;
}

/**
 * Consulta cuántas partidas ha jugado el usuario hoy en Sopitika (máx 2) y cuánto XP ha acumulado.
 */
export async function getSopitikaDailyStatus({
  localUsername,
  fallbackClerkId,
}: {
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<DailySopitikaStatus> {
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
        actionType: 'SOPITIKA_GAME',
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
    console.error("Error al consultar estado diario de Sopitika:", error);
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

export interface AwardSopitikaXPResult {
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
 * Calcula y otorga los XPs al usuario según el tiempo empleado en resolver Sopitika:
 * - Máximo de 2 partidas puntuadas por día.
 * - <= 90 segundos: 50 XP ⭐⭐⭐ (Agilidad visual élite)
 * - <= 150 segundos: 40 XP ⭐⭐⭐ (Gran velocidad)
 * - <= 240 segundos: 30 XP ⭐⭐ (Buen explorador)
 * - <= 360 segundos: 20 XP ⭐ (Tablero resuelto)
 * - > 360 segundos: 10 XP (Buen entrenamiento mental)
 * Tope máximo de 2 partidas y 100 XP diarios acumulados.
 */
export async function awardSopitikaXP({
  timeSeconds,
  wordsCount,
  localUsername,
  fallbackClerkId,
}: {
  timeSeconds: number;
  wordsCount: number;
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<AwardSopitikaXPResult> {
  // Puntuación base según tiempo
  let baseXp = 20;
  if (timeSeconds <= 90) {
    baseXp = 50;
  } else if (timeSeconds <= 150) {
    baseXp = 40;
  } else if (timeSeconds <= 240) {
    baseXp = 30;
  } else if (timeSeconds <= 360) {
    baseXp = 20;
  } else {
    baseXp = 10;
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
        actionType: 'SOPITIKA_GAME',
        createdAt: { gte: startOfCRDay }
      },
      select: { xpAwarded: true }
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
        error: 'Límite alcanzado: Ya jugaste tus 2 partidas de hoy.',
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
          actionType: 'SOPITIKA_GAME',
          targetId: `game_${newGamesPlayed}_time_${timeSeconds}_words_${wordsCount}`,
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
    console.error("Error en awardSopitikaXP:", error);
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
