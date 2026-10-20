"use server";

import prisma from '../lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isSameCRDay, getCRStartOfDayUTC } from '../lib/dateUtils';

export async function ensureDbUser(localUsername?: string, fallbackClerkId?: string) {
  let clerkId = null;
  let clerkUser = null;
  let clerkEmail = null;
  let clerkUsername = null;
  try {
    const authResult = await auth();
    clerkId = authResult.userId;
    if (clerkId) {
      clerkUser = await currentUser();
      clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress;
      clerkUsername = clerkUser?.username;
    }
  } catch (e) {
    console.warn("Clerk context not found.");
  }

  if (!clerkId && fallbackClerkId) {
    clerkId = fallbackClerkId;
    console.log("Using fallback clerkId:", clerkId);
  }

  let dbUser = null;

  if (clerkId) {
    // Si hay usuario autenticado por Clerk, mandamos en base a Clerk
    dbUser = await prisma.user.findUnique({ where: { id: clerkId } });
    if (!dbUser && clerkEmail) {
      dbUser = await prisma.user.findUnique({ where: { email: clerkEmail } });
    }
    
    // Si todavía no existe en BD, lo creamos
    if (!dbUser) {
      const fallbackUsername = clerkUsername || `user_${clerkId.substring(0, 8)}`;
      // Chequeo de colisión de username
      const existingUser = await prisma.user.findUnique({ where: { username: fallbackUsername } });
      const finalUsername = existingUser ? `${fallbackUsername}_${Date.now().toString().slice(-4)}` : fallbackUsername;
      
      // Chequear si existe un guest account con localUsername
      let guestUser = null;
      if (localUsername) {
        guestUser = await prisma.user.findUnique({ where: { username: localUsername } });
        // Verificamos que sea un guest (passwordHash 'local_auth')
        if (guestUser && guestUser.passwordHash !== 'local_auth') {
          guestUser = null;
        }
      }
      
      try {
        dbUser = await prisma.user.create({
          data: {
            id: clerkId,
            username: finalUsername,
            email: clerkEmail || `${finalUsername}@colectikos.local`,
            passwordHash: 'clerk_auth',
            name: clerkUser?.firstName || finalUsername,
            xp: guestUser ? guestUser.xp : 0,
            level: guestUser ? guestUser.level : 1,
            currentStreak: guestUser ? guestUser.currentStreak : 0,
            longestStreak: guestUser ? guestUser.longestStreak : 0,
            lastLoginDate: guestUser ? guestUser.lastLoginDate : null,
            estampillasDisponibles: guestUser ? guestUser.estampillasDisponibles : 3,
            ultimaFechaEstampillas: guestUser ? guestUser.ultimaFechaEstampillas : new Date(),
          }
        });
        
        // Si había un guestUser, transferimos todo su progreso al nuevo usuario
        if (guestUser) {
          console.log(`Migrating guest user ${guestUser.id} to clerk user ${clerkId}`);
          await prisma.userProgress.updateMany({
            where: { userId: guestUser.id },
            data: { userId: clerkId }
          });
          await prisma.userActionLog.updateMany({
            where: { userId: guestUser.id },
            data: { userId: clerkId }
          });
          await prisma.rating.updateMany({
            where: { userId: guestUser.id },
            data: { userId: clerkId }
          });
          // Eliminar el usuario guest antiguo
          await prisma.user.delete({ where: { id: guestUser.id } });
        }
      } catch (e) {
        console.error("Error creating user from Clerk data", e);
      }
    }
    return dbUser;
  }

  // Fallback SOLO si NO hay sesión de Clerk (por ejemplo modo invitado local)
  if (localUsername) {
    dbUser = await prisma.user.findUnique({ where: { username: localUsername } });
    if (!dbUser) {
      try {
        dbUser = await prisma.user.create({
          data: {
            username: localUsername,
            email: `${localUsername}@colectikos.local`,
            passwordHash: 'local_auth',
            name: localUsername,
            xp: 0,
            level: 1
          }
        });
      } catch (e) {
        console.error("Error creating fallback local user", e);
      }
    }
    return dbUser;
  }

  return null;
}

export async function checkAndResetStamps(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const now = new Date();
  
  if (!user.ultimaFechaEstampillas) {
    return prisma.user.update({
      where: { id: userId },
      data: { estampillasDisponibles: 3, ultimaFechaEstampillas: now }
    });
  }
  
  const lastDate = new Date(user.ultimaFechaEstampillas);
  
  const isSameDay = isSameCRDay(now, user.ultimaFechaEstampillas);

  if (!isSameDay) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        estampillasDisponibles: 3,
        ultimaFechaEstampillas: now
      }
    });
    return updatedUser;
  }

  return user;
}

/**
 * Registra la visita a un lugar y otorga XP según las reglas anti-farming y anti-speedrunners.
 * @param lugarId ID del lugar descubierto.
 * @param mode Modo de juego (Curioso, Nómada, Conquistador).
 * @param localUsername Nombre de usuario del local storage como fallback (opcional).
 */
export async function checkInAndAwardXP(lugarId: string, mode: string, localUsername?: string, fallbackClerkId?: string) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);

    if (!dbUser) {
      return { success: false, error: 'Usuario no autenticado o imposible de sincronizar con BD', xpAwarded: 0 };
    }

    const userId = dbUser.id;

    // 1.5 Verificar y Resetear Estampillas
    const activeUser = await checkAndResetStamps(userId);
    if (!activeUser) {
      return { success: false, error: 'Error obteniendo datos del usuario', xpAwarded: 0 };
    }
    
    if (activeUser.estampillasDisponibles <= 0) {
      return { success: false, error: 'no_energy', xpAwarded: 0 };
    }

    // 2. Ejecutar Transacción Segura
    const result = await prisma.$transaction(async (tx: any) => {
      // Garantizar que el Lugar exista en la base de datos
      const existingLugar = await tx.lugar.findUnique({ where: { id: lugarId } });
      if (!existingLugar) {
        throw new Error('Lugar no encontrado en la base de datos real.');
      }

      // Verificar si ya existe en UserProgress
      const existingProgress = await tx.userProgress.findUnique({
        where: {
          userId_lugarId: {
            userId,
            lugarId
          }
        }
      });

      if (!existingProgress) {
        await tx.userProgress.create({
          data: {
            userId,
            lugarId,
            completado: true,
            fechaCompletado: new Date()
          }
        });
      }

      // Reglas Anti-Farming: Verificar si ya obtuvo XP por esta postal
      const existingLog = await tx.userActionLog.findFirst({
        where: {
          userId,
          actionType: 'UNLOCK_POSTCARD',
          targetId: lugarId
        }
      });

      if (existingLog) {
        // Ya ganó XP por este lugar antes
        return { success: true, xpAwarded: 0, newTotalXp: dbUser!.xp, newLevel: dbUser!.level, limitReached: false, unlocksToday: 0 };
      }

      // Reglas Anti-Speedrunners: Contar cuantas postales ha desbloqueado HOY (CR Time)
      const startOfDay = getCRStartOfDayUTC();

      const unlocksToday = await tx.userActionLog.count({
        where: {
          userId,
          actionType: 'UNLOCK_POSTCARD',
          createdAt: { gte: startOfDay }
        }
      });

      let xpAwarded = 0;
      let limitReached = false;
      if (unlocksToday === 0 || unlocksToday === 1) {
        xpAwarded = 50; // 1era y 2da postal = 100%
      } else if (unlocksToday === 2) {
        xpAwarded = 25; // 3era postal = 50%
      } else {
        xpAwarded = 0; // 4ta en adelante = 0 XP
        limitReached = true;
      }

      // Verificar si estaba en bucketList para otorgar el bono de Próximo Destino cumplido (+10 XP)
      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      const currentBucketList: string[] = currentUser?.bucketList || [];
      const wasInBucketList = currentBucketList.includes(lugarId);

      let bucketListBonusXp = 0;
      let updatedBucketList = currentBucketList;

      if (wasInBucketList) {
        updatedBucketList = currentBucketList.filter((id: string) => id !== lugarId);

        const existingBucketBonus = await tx.userActionLog.findFirst({
          where: {
            userId,
            actionType: 'BUCKET_LIST_COMPLETE',
            targetId: lugarId
          }
        });

        if (!existingBucketBonus) {
          bucketListBonusXp = 10;
          await tx.userActionLog.create({
            data: {
              userId,
              actionType: 'BUCKET_LIST_COMPLETE',
              targetId: lugarId,
              xpAwarded: bucketListBonusXp
            }
          });
        }
      }

      let newTotalXp = dbUser!.xp;
      let newLevel = dbUser!.level;
      const totalXpGain = xpAwarded + bucketListBonusXp;

      if (totalXpGain > 0) {
        newTotalXp += totalXpGain;
        // Fórmula básica: cada 100 XP = 1 nivel
        newLevel = Math.floor(newTotalXp / 100) + 1;
      }

      if (xpAwarded > 0) {
        // Registrar Log de desbloqueo
        await tx.userActionLog.create({
          data: {
            userId,
            actionType: 'UNLOCK_POSTCARD',
            targetId: lugarId,
            xpAwarded
          }
        });
      }

      // Siempre actualizamos al usuario porque gasta 1 estampilla al desbloquear
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: newTotalXp,
          level: newLevel,
          estampillasDisponibles: activeUser.estampillasDisponibles - 1,
          ultimaFechaEstampillas: new Date(),
          ...(wasInBucketList ? { bucketList: updatedBucketList } : {})
        }
      });

      return { 
        success: true, 
        xpAwarded, 
        bucketListBonus: bucketListBonusXp,
        newTotalXp, 
        newLevel, 
        limitReached, 
        unlocksToday: unlocksToday + 1,
        updatedBucketList: wasInBucketList ? updatedBucketList : undefined
      };
    });

    return result;

  } catch (error: any) {
    console.error("Error en checkInAndAwardXP:", error);
    return { success: false, error: error.message || 'Ocurrió un error al registrar el progreso y XP', xpAwarded: 0 };
  }
}

/**
 * Agrega o quita una postal de la lista de Próximos Destinos (bucketList).
 * Otorga +10 XP la primera vez que se marca un destino (acción BUCKET_LIST_ADD).
 * Si se desmarca, otorga 0 XP. Si se vuelve a marcar, no otorga XP de nuevo (anti-farming).
 */
export async function toggleBucketListAndAwardXP(
  lugarId: string,
  localUsername?: string,
  fallbackClerkId?: string
) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return { success: false, error: 'Usuario no autenticado', xpAwarded: 0 };
    }

    const userId = dbUser.id;

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Usuario no encontrado');

      const currentList: string[] = user.bucketList || [];
      const isAlreadyInList = currentList.includes(lugarId);

      if (isAlreadyInList) {
        // Quitar de la lista: 0 XP
        const updatedList = currentList.filter((id: string) => id !== lugarId);
        await tx.user.update({
          where: { id: userId },
          data: { bucketList: updatedList }
        });
        return {
          success: true,
          action: 'removed',
          newList: updatedList,
          xpAwarded: 0,
          newTotalXp: user.xp,
          newLevel: user.level
        };
      } else {
        // Agregar a la lista
        if (currentList.length >= 4) {
          return {
            success: false,
            error: 'limit_reached',
            newList: currentList,
            xpAwarded: 0
          };
        }

        const updatedList = [...currentList, lugarId];

        // Verificar si ya recibió XP por marcar este lugar en el pasado (Anti-Farming)
        const existingLog = await tx.userActionLog.findFirst({
          where: {
            userId,
            actionType: 'BUCKET_LIST_ADD',
            targetId: lugarId
          }
        });

        let xpAwarded = 0;
        let newTotalXp = user.xp;
        let newLevel = user.level;

        if (!existingLog) {
          xpAwarded = 10;
          newTotalXp = user.xp + xpAwarded;
          newLevel = Math.floor(newTotalXp / 100) + 1;

          await tx.userActionLog.create({
            data: {
              userId,
              actionType: 'BUCKET_LIST_ADD',
              targetId: lugarId,
              xpAwarded
            }
          });
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            bucketList: updatedList,
            xp: newTotalXp,
            level: newLevel
          }
        });

        return {
          success: true,
          action: 'added',
          newList: updatedList,
          xpAwarded,
          newTotalXp,
          newLevel,
          alreadyAwarded: !!existingLog
        };
      }
    });

    return result;
  } catch (error: any) {
    console.error("Error en toggleBucketListAndAwardXP:", error);
    return { success: false, error: error.message || 'Error al actualizar próximos destinos', xpAwarded: 0 };
  }
}

export async function getUserGamification(localUsername?: string, fallbackClerkId?: string) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) return { xp: 0, level: 1, estampillas: 0, onboardingCompleted: true, fechaBonoTicket: null };

    const activeUser = await checkAndResetStamps(dbUser.id);
    if (!activeUser) return { xp: dbUser.xp, level: dbUser.level, estampillas: 0, fechaBonoTicket: dbUser.fechaBonoTicket, fechaDevolucionTicket: dbUser.fechaDevolucionTicket, bucketList: dbUser.bucketList };

    return { 
      xp: activeUser.xp, 
      level: activeUser.level, 
      estampillas: activeUser.estampillasDisponibles,
      onboardingCompleted: activeUser.onboardingCompleted,
      fechaBonoTicket: activeUser.fechaBonoTicket,
      fechaDevolucionTicket: activeUser.fechaDevolucionTicket,
      bucketList: activeUser.bucketList
    };
  } catch (error) {
    return { xp: 0, level: 1, estampillas: 0, onboardingCompleted: true, fechaBonoTicket: null, fechaDevolucionTicket: null, bucketList: [] };
  }
}

export async function completeOnboarding(username: string, genero: string) {
  try {
    const dbUser = await ensureDbUser();
    if (!dbUser) throw new Error("No autenticado");

    // Verificar si el username ya está tomado por otro usuario
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== dbUser.id) {
      return { success: false, message: "Este nombre ya está en uso. ¡Prueba con otro!" };
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        username,
        name: username,
        genero,
        onboardingCompleted: true
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error en completeOnboarding:", error);
    return { success: false, message: "Error al actualizar tu perfil." };
  }
}

/**
 * Registra una calificación de postal y otorga XP según las reglas.
 */
export async function rateAndAwardXP(lugarId: string, score: number, localUsername?: string, fallbackClerkId?: string) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return { success: false, error: 'Usuario no autenticado o imposible de sincronizar con BD', xpAwarded: 0 };
    }

    const userId = dbUser.id;

    const result = await prisma.$transaction(async (tx: any) => {
      // Lazy Seed para lugarId por si acaso no existe (integridad referencial)
      const existingLugar = await tx.lugar.findUnique({ where: { id: lugarId } });
      if (!existingLugar) {
        await tx.lugar.create({
          data: {
            id: lugarId,
            nombre: `Lugar Local ${lugarId}`,
            categoria: 'PROVINCIA', 
            descripcion: 'Auto-generado para satisfacer integridad referencial',
            ubicacion: 'Costa Rica',
            isVisible: false
          }
        });
      }

      // Upsert Rating
      await tx.rating.upsert({
        where: {
          userId_placeId: {
            userId,
            placeId: lugarId
          }
        },
        update: { score },
        create: {
          userId,
          placeId: lugarId,
          score
        }
      });

      // Verificar si ya ganó XP por calificar esta postal específica
      const existingLog = await tx.userActionLog.findFirst({
        where: {
          userId,
          actionType: 'RATE_DESTINATION',
          targetId: lugarId
        }
      });

      if (existingLog) {
        // Ya ganó XP por calificar esto antes, o ya está registrado (re-calificación)
        return { success: true, xpAwarded: 0, newTotalXp: dbUser.xp, newLevel: dbUser.level, limitReached: false };
      }

      // Reglas Anti-Farming (Límites diarios de calificación con XP)
      const startOfDay = getCRStartOfDayUTC();

      const ratingsToday = await tx.userActionLog.count({
        where: {
          userId,
          actionType: 'RATE_DESTINATION',
          createdAt: { gte: startOfDay }
        }
      });

      let xpAwarded = 0;
      let limitReached = false;
      if (ratingsToday === 0 || ratingsToday === 1) {
        xpAwarded = 20; // 1era y 2da = 100%
      } else if (ratingsToday === 2) {
        xpAwarded = 10; // 3era = 50%
      } else {
        xpAwarded = 0; // 4ta en adelante = 0
        limitReached = true;
      }

      let newTotalXp = dbUser.xp;
      let newLevel = dbUser.level;

      if (xpAwarded > 0) {
        newTotalXp += xpAwarded;
        newLevel = Math.floor(newTotalXp / 100) + 1;

        await tx.userActionLog.create({
          data: {
            userId,
            actionType: 'RATE_DESTINATION',
            targetId: lugarId,
            xpAwarded
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: { xp: newTotalXp, level: newLevel }
        });
      }

      // Lógica de Tiquete de Bono
      let bonusAwarded = false;
      const now = new Date();
      const lastBonusDate = dbUser.fechaBonoTicket ? new Date(dbUser.fechaBonoTicket) : null;
      const isBonusSameDay = lastBonusDate ? isSameCRDay(now, lastBonusDate) : false;

      if (!isBonusSameDay) {
        bonusAwarded = true;
        await tx.user.update({
          where: { id: userId },
          data: {
            estampillasDisponibles: { increment: 1 },
            fechaBonoTicket: now
          }
        });
      }

      return { success: true, xpAwarded, newTotalXp, newLevel, limitReached, bonusAwarded };
    });

    return result;

  } catch (error: any) {
    console.error("Error en rateAndAwardXP:", error);
    return { success: false, error: error.message || 'Ocurrió un error al registrar la calificación', xpAwarded: 0 };
  }
}

export async function recordDailyLogin(localUsername?: string, fallbackClerkId?: string) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) return { success: false, error: 'Usuario no autenticado', xpAwarded: 0 };

    const userId = dbUser.id;
    
    // Convertir a Hora de Costa Rica (GMT-6)
    const getCRDateString = (date: Date) => {
      const crTime = new Date(date.getTime() - (6 * 60 * 60 * 1000));
      return crTime.toISOString().split('T')[0];
    };

    const now = new Date();
    const todayStr = getCRDateString(now);
    const lastLoginDate = dbUser.lastLoginDate;
    
    if (lastLoginDate) {
      const lastLoginStr = getCRDateString(lastLoginDate);
      if (todayStr === lastLoginStr) {
        // Ya registró su ingreso hoy
        return { success: true, streakUpdated: false, xpAwarded: 0, currentStreak: dbUser.currentStreak, newTotalXp: dbUser.xp, newLevel: dbUser.level, bonusAwarded: 0, newStreak: dbUser.currentStreak };
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("Usuario no encontrado");

      let newStreak = user.currentStreak;
      let xpAwarded = 10;
      let isConsecutive = false;

      if (user.lastLoginDate) {
        const lastLoginDateObj = new Date(user.lastLoginDate);
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const yesterdayStr = getCRDateString(yesterday);
        const lastLoginStr = getCRDateString(lastLoginDateObj);

        if (lastLoginStr === yesterdayStr) {
          isConsecutive = true;
        }
      }

      if (isConsecutive) {
        newStreak += 1;
        // 10 base + 5 por cada día de racha (Max 50)
        xpAwarded = Math.min(10 + (newStreak * 5), 50);
      } else {
        newStreak = 1; // Se rompió la racha o primera vez
        xpAwarded = 10;
      }

      let streakBonus = 0;
      if (newStreak === 5) streakBonus = 50;
      else if (newStreak === 10) streakBonus = 100;
      else if (newStreak === 15) streakBonus = 150;
      else if (newStreak === 20) streakBonus = 200;

      const newLongestStreak = Math.max(user.longestStreak, newStreak);
      const totalXpEarned = xpAwarded + streakBonus;
      const newTotalXp = user.xp + totalXpEarned;
      const newLevel = Math.floor(newTotalXp / 100) + 1;

      await tx.userActionLog.create({
        data: {
          userId,
          actionType: 'DAILY_LOGIN',
          targetId: 'daily_login',
          xpAwarded: totalXpEarned
        }
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastLoginDate: now,
          xp: { increment: totalXpEarned },
          level: newLevel
        }
      });

      return { 
        success: true,
        streakUpdated: true,
        newStreak,
        bonusAwarded: streakBonus,
        xpAwarded: totalXpEarned, 
        currentStreak: newStreak, 
        newTotalXp, 
        newLevel 
      };
    });

    return result;

  } catch (error: any) {
    console.error("Error en recordDailyLogin:", error);
    return { success: false, error: error.message || 'Ocurrió un error al registrar el ingreso', xpAwarded: 0 };
  }
}

/**
 * Registra que el usuario resolvió el rompecabezas diario y le otorga 30 XP.
 */
export async function solvePuzzleAndAwardXP(lugarId: string, localUsername?: string, fallbackClerkId?: string) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return { success: false, error: 'Usuario no autenticado o imposible de sincronizar con BD', xpAwarded: 0 };
    }

    const userId = dbUser.id;

    const result = await prisma.$transaction(async (tx: any) => {
      // Verificar si ya ganó XP por resolver el puzzle de este lugar
      const existingLog = await tx.userActionLog.findFirst({
        where: {
          userId,
          actionType: 'SOLVE_PUZZLE',
          targetId: lugarId
        }
      });

      if (existingLog) {
        return { success: true, xpAwarded: 0, newTotalXp: dbUser.xp, newLevel: dbUser.level, limitReached: true };
      }

      const xpAwarded = 30;
      let newTotalXp = dbUser.xp + xpAwarded;
      let newLevel = Math.floor(newTotalXp / 100) + 1;

      await tx.userActionLog.create({
        data: {
          userId,
          actionType: 'SOLVE_PUZZLE',
          targetId: lugarId,
          xpAwarded
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: { xp: newTotalXp, level: newLevel }
      });

      return { success: true, xpAwarded, newTotalXp, newLevel, limitReached: false };
    });

    return result;
  } catch (error: any) {
    console.error("Error en solvePuzzleAndAwardXP:", error);
    return { success: false, error: error.message || 'Ocurrió un error al otorgar XP por el puzzle', xpAwarded: 0 };
  }
}
