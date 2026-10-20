"use server";

import prisma from '../lib/prisma';
import { ensureDbUser } from './gamification';
import { getCRStartOfDayUTC } from '../lib/dateUtils';

export async function loadBeachState(localUsername?: string) {
  const dbUser = await ensureDbUser(localUsername);
  if (!dbUser) return null;

  let beach = await prisma.beach.findUnique({ where: { userId: dbUser.id } });
  
  if (!beach) {
    beach = await prisma.beach.create({
      data: { userId: dbUser.id }
    });
  }

  // --- REGLA: Cada 500 XP = 500 Tikolones ---
  const totalXp = dbUser.xp;
  const alreadyClaimed = beach.xpClaimed;
  const availableToClaim = totalXp - alreadyClaimed;
  
  let newTikolones = 0;
  let newClaimed = alreadyClaimed;

  if (availableToClaim >= 500) {
    const chunks = Math.floor(availableToClaim / 500);
    newTikolones = chunks * 500;
    newClaimed += chunks * 500;
  }

  // --- REGLA: Recompensa Diaria 50 XP ---
  let dailyXpAwarded = 0;
  const now = new Date();
  const startOfDay = getCRStartOfDayUTC(); 
  
  let awardedDaily = false;
  if (!beach.lastDailyReward || new Date(beach.lastDailyReward) < startOfDay) {
    dailyXpAwarded = 50;
    awardedDaily = true;
  }

  let finalTikolones = dbUser.tikolones;
  let finalXp = dbUser.xp;

  if (newTikolones > 0 || awardedDaily) {
    let updatedXp = dbUser.xp + dailyXpAwarded;
    let updatedLevel = Math.floor(updatedXp / 100) + 1;
    let updatedTikolones = dbUser.tikolones + newTikolones;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          xp: updatedXp,
          level: updatedLevel,
          tikolones: updatedTikolones
        }
      });
      await tx.beach.update({
        where: { id: beach.id },
        data: {
          xpClaimed: newClaimed,
          lastDailyReward: awardedDaily ? now : beach.lastDailyReward
        }
      });

      if (awardedDaily) {
        await tx.userActionLog.create({
          data: {
            userId: dbUser.id,
            actionType: 'BEACH_DAILY_PLAY',
            targetId: 'playa_tikolones',
            xpAwarded: 50
          }
        });
      }
    });

    finalTikolones = updatedTikolones;
    finalXp = updatedXp;
  }

  return {
    success: true,
    gridState: typeof beach.gridState === 'string' ? JSON.parse(beach.gridState) : beach.gridState,
    tikolones: finalTikolones,
    userXp: finalXp,
    visitors: beach.visitors,
    alerts: {
      newTikolonesFromXp: newTikolones,
      dailyXp: dailyXpAwarded
    },
    name: beach.name || ""
  };
}

export async function saveBeachName(name: string, localUsername?: string) {
  const dbUser = await ensureDbUser(localUsername);
  if (!dbUser) return { success: false };
  await prisma.beach.update({ where: { userId: dbUser.id }, data: { name } });
  return { success: true };
}

export async function saveBeachState(
  gridState: any, 
  currentTikolones: number, 
  currentVisitors: number,
  lifetimeVisitorsDelta: number,
  localUsername?: string
) {
  const dbUser = await ensureDbUser(localUsername);
  if (!dbUser) return { success: false };

  const beach = await prisma.beach.findUnique({ where: { userId: dbUser.id } });
  if (!beach) return { success: false };

  const newLifetimeVisitors = beach.lifetimeVisitors + lifetimeVisitorsDelta;
  const newCurrentVisitors = currentVisitors;

  // --- REGLA: Cada 50 visitantes = 10 XP ---
  const oldChunks = Math.floor(beach.lifetimeVisitors / 50);
  const newChunks = Math.floor(newLifetimeVisitors / 50);
  const chunksEarned = newChunks - oldChunks;

  let xpAwarded = chunksEarned * 10;
  let newXp = dbUser.xp + xpAwarded;
  let newLevel = Math.floor(newXp / 100) + 1;

  await prisma.$transaction(async (tx) => {
    await tx.beach.update({
      where: { id: beach.id },
      data: {
        gridState: gridState,
        visitors: newCurrentVisitors,
        lifetimeVisitors: newLifetimeVisitors,
        lastUpdated: new Date()
      }
    });
    
    await tx.user.update({
      where: { id: dbUser.id },
      data: {
        tikolones: currentTikolones,
        xp: newXp,
        level: newLevel
      }
    });

    if (xpAwarded > 0) {
      await tx.userActionLog.create({
        data: {
          userId: dbUser.id,
          actionType: 'BEACH_VISITOR_MILESTONE',
          targetId: 'playa_tikolones',
          xpAwarded: xpAwarded
        }
      });
    }
  });

  return { success: true, xpAwarded };
}
