"use server";

import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { getCRDate, getCRStartOfMonthUTC } from '../lib/dateUtils';

export type UserRankingEntry = {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  currentStreak: number;
  score: number; // XP or count of postales
  rank?: number;
  isFounder?: boolean;
  provincia?: string | null;
  gapToAhead?: number;
};

const FOUNDER_CUTOFF = new Date('2026-12-01T00:00:00Z');

function checkIsFounder(createdAt?: Date | string | null): boolean {
  if (!createdAt) return false;
  return new Date(createdAt) < FOUNDER_CUTOFF;
}

export async function getGlobalXPRanking(
  currentUserId?: string,
  timeframe: 'month' | 'all' = 'month',
  provincia?: string
): Promise<{ 
  top10: UserRankingEntry[], 
  currentUserRank: UserRankingEntry | null,
  periodName: { es: string; en: string }
}> {
  const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const crDate = getCRDate();
  const currentMonthName = {
    es: `${monthsEs[crDate.getUTCMonth()]} ${crDate.getUTCFullYear()}`,
    en: `${monthsEn[crDate.getUTCMonth()]} ${crDate.getUTCFullYear()}`
  };

  const periodName = currentMonthName;

  if (timeframe === 'month') {
    const startOfMonth = getCRStartOfMonthUTC();
    const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
    if (provincia && provincia !== 'Todas') {
      conditions.push(Prisma.sql`u."provinciaResidencia" = ${provincia}`);
    }
    const userWhereClause = Prisma.join(conditions, ' AND ');

    const topUsers = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, 
        u.username, 
        u."avatarUrl", 
        u.level, 
        u."currentStreak", 
        u."provinciaResidencia" as provincia,
        u."createdAt",
        COALESCE(SUM(l."xpAwarded"), 0)::int as score
      FROM "User" u
      JOIN "UserActionLog" l ON u.id = l."userId" AND l."createdAt" >= ${startOfMonth}
      WHERE ${userWhereClause}
      GROUP BY u.id
      ORDER BY score DESC, u.xp DESC
      LIMIT 10
    `;

    const top10: UserRankingEntry[] = topUsers.map((u, i) => ({
      id: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      level: u.level,
      currentStreak: u.currentStreak,
      score: Number(u.score),
      rank: i + 1,
      isFounder: checkIsFounder(u.createdAt),
      provincia: u.provincia
    }));

    let currentUserRank: UserRankingEntry | null = null;
    if (currentUserId) {
      const user = await prisma.user.findUnique({ where: { id: currentUserId } });
      if (user) {
        const matchesProvince = !provincia || provincia === 'Todas' || user.provinciaResidencia === provincia;

        if (!matchesProvince) {
          currentUserRank = {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            level: user.level,
            currentStreak: user.currentStreak,
            score: 0,
            rank: 0,
            isFounder: checkIsFounder(user.createdAt),
            provincia: user.provinciaResidencia
          };
        } else {
          const myScoreRes = await prisma.$queryRaw<any[]>`
            SELECT COALESCE(SUM("xpAwarded"), 0)::int as score
            FROM "UserActionLog"
            WHERE "userId" = ${currentUserId} AND "createdAt" >= ${startOfMonth}
          `;
          const myScore = myScoreRes.length > 0 ? Number(myScoreRes[0].score) : 0;

          if (myScore > 0) {
            const usersAheadRes = await prisma.$queryRaw<any[]>`
              WITH monthly_scores AS (
                SELECT u.id, u.xp, COALESCE(SUM(l."xpAwarded"), 0)::int as score
                FROM "User" u
                JOIN "UserActionLog" l ON u.id = l."userId" AND l."createdAt" >= ${startOfMonth}
                WHERE ${userWhereClause}
                GROUP BY u.id, u.xp
              )
              SELECT COUNT(*)::int as ahead
              FROM monthly_scores
              WHERE score > ${myScore} OR (score = ${myScore} AND xp > ${user.xp})
            `;
            const ahead = usersAheadRes.length > 0 ? Number(usersAheadRes[0].ahead) : 0;

            currentUserRank = {
              id: user.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              level: user.level,
              currentStreak: user.currentStreak,
              score: myScore,
              rank: ahead + 1,
              isFounder: checkIsFounder(user.createdAt),
              provincia: user.provinciaResidencia
            };
          } else {
            currentUserRank = {
              id: user.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              level: user.level,
              currentStreak: user.currentStreak,
              score: 0,
              rank: 0,
              isFounder: checkIsFounder(user.createdAt),
              provincia: user.provinciaResidencia
            };
          }
        }
      }
    }

    return { top10, currentUserRank, periodName };
  }

  // Timeframe: 'all' (Histórico Global)
  const userWhere: any = {};
  if (provincia && provincia !== 'Todas') {
    userWhere.provinciaResidencia = provincia;
  }

  const topUsers = await prisma.user.findMany({
    where: userWhere,
    orderBy: { xp: 'desc' },
    take: 10,
    select: { id: true, username: true, avatarUrl: true, level: true, currentStreak: true, xp: true, createdAt: true, provinciaResidencia: true }
  });

  const top10: UserRankingEntry[] = topUsers.map((u, i) => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    level: u.level,
    currentStreak: u.currentStreak,
    score: u.xp,
    rank: i + 1,
    isFounder: checkIsFounder(u.createdAt),
    provincia: u.provinciaResidencia
  }));

  let currentUserRank: UserRankingEntry | null = null;
  if (currentUserId) {
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (user) {
      const matchesProvince = !provincia || provincia === 'Todas' || user.provinciaResidencia === provincia;
      if (!matchesProvince) {
        currentUserRank = {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          level: user.level,
          currentStreak: user.currentStreak,
          score: user.xp,
          rank: 0,
          isFounder: checkIsFounder(user.createdAt),
          provincia: user.provinciaResidencia
        };
      } else {
        const usersAhead = await prisma.user.count({
          where: {
            ...userWhere,
            xp: { gt: user.xp }
          }
        });
        currentUserRank = {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          level: user.level,
          currentStreak: user.currentStreak,
          score: user.xp,
          rank: usersAhead + 1,
          isFounder: checkIsFounder(user.createdAt),
          provincia: user.provinciaResidencia
        };
      }
    }
  }

  return { top10, currentUserRank, periodName };
}

export async function getPostalesRanking(
  currentUserId?: string, 
  province?: string, 
  category?: string
): Promise<{ top10: UserRankingEntry[], currentUserRank: UserRankingEntry | null }> {
  const conditions: Prisma.Sql[] = [Prisma.sql`p.completado = true`];
  
  if (province && province !== 'Todas') {
    conditions.push(Prisma.sql`l."ubicacion" ILIKE ${'%' + province + '%'}`);
  }
  if (category && category !== 'Todas') {
    conditions.push(Prisma.sql`l."categoria"::text = ${category}`);
  }

  const whereClause = Prisma.join(conditions, ' AND ');

  const topUsers = await prisma.$queryRaw<any[]>`
    SELECT u.id, u.username, u."avatarUrl", u.level, u."currentStreak", u."provinciaResidencia" as provincia, u."createdAt", COUNT(p.id)::int as score
    FROM "User" u
    JOIN "UserProgress" p ON u.id = p."userId"
    JOIN "Lugar" l ON p."lugarId" = l.id
    WHERE ${whereClause}
    GROUP BY u.id
    ORDER BY score DESC, u.xp DESC
    LIMIT 10
  `;

  const top10: UserRankingEntry[] = topUsers.map((u, i) => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    level: u.level,
    currentStreak: u.currentStreak,
    score: Number(u.score),
    rank: i + 1,
    isFounder: checkIsFounder(u.createdAt),
    provincia: u.provincia
  }));

  let currentUserRank: UserRankingEntry | null = null;
  if (currentUserId) {
    const userScoreRes = await prisma.$queryRaw<any[]>`
      SELECT COUNT(p.id)::int as score
      FROM "UserProgress" p
      JOIN "Lugar" l ON p."lugarId" = l.id
      WHERE p."userId" = ${currentUserId} AND ${whereClause}
    `;
    const userScore = userScoreRes.length > 0 ? Number(userScoreRes[0].score) : 0;

    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    
    if (user && userScore > 0) {
      const usersAheadRes = await prisma.$queryRaw<any[]>`
        WITH user_scores AS (
          SELECT u.id, u.xp, COUNT(p.id)::int as score
          FROM "User" u
          JOIN "UserProgress" p ON u.id = p."userId"
          JOIN "Lugar" l ON p."lugarId" = l.id
          WHERE ${whereClause}
          GROUP BY u.id, u.xp
        )
        SELECT COUNT(*)::int as ahead
        FROM user_scores
        WHERE score > ${userScore} OR (score = ${userScore} AND xp > ${user.xp})
      `;
      const usersAhead = usersAheadRes.length > 0 ? Number(usersAheadRes[0].ahead) : 0;

      currentUserRank = {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        level: user.level,
        currentStreak: user.currentStreak,
        score: userScore,
        rank: usersAhead + 1,
        isFounder: checkIsFounder(user.createdAt),
        provincia: user.provinciaResidencia
      };
    } else if (user) {
      currentUserRank = {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        level: user.level,
        currentStreak: user.currentStreak,
        score: 0,
        rank: 0,
        isFounder: checkIsFounder(user.createdAt),
        provincia: user.provinciaResidencia
      };
    }
  }

  return { top10, currentUserRank };
}

export async function getStreakRanking(
  currentUserId?: string,
  provincia?: string
): Promise<{ top10: UserRankingEntry[], currentUserRank: UserRankingEntry | null }> {
  const userWhere: any = {};
  if (provincia && provincia !== 'Todas') {
    userWhere.provinciaResidencia = provincia;
  }

  const topUsers = await prisma.user.findMany({
    where: userWhere,
    orderBy: [{ currentStreak: 'desc' }, { xp: 'desc' }],
    take: 10,
    select: { id: true, username: true, avatarUrl: true, level: true, currentStreak: true, xp: true, createdAt: true, provinciaResidencia: true }
  });

  const top10: UserRankingEntry[] = topUsers.map((u, i) => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    level: u.level,
    currentStreak: u.currentStreak,
    score: u.currentStreak,
    rank: i + 1,
    isFounder: checkIsFounder(u.createdAt),
    provincia: u.provinciaResidencia
  }));

  let currentUserRank: UserRankingEntry | null = null;
  if (currentUserId) {
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (user) {
      const matchesProvince = !provincia || provincia === 'Todas' || user.provinciaResidencia === provincia;
      if (!matchesProvince) {
        currentUserRank = {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          level: user.level,
          currentStreak: user.currentStreak,
          score: user.currentStreak,
          rank: 0,
          isFounder: checkIsFounder(user.createdAt),
          provincia: user.provinciaResidencia
        };
      } else {
        const usersAhead = await prisma.user.count({
          where: { 
            ...userWhere,
            OR: [
              { currentStreak: { gt: user.currentStreak } },
              { currentStreak: user.currentStreak, xp: { gt: user.xp } }
            ]
          }
        });
        currentUserRank = {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          level: user.level,
          currentStreak: user.currentStreak,
          score: user.currentStreak,
          rank: usersAhead + 1,
          isFounder: checkIsFounder(user.createdAt),
          provincia: user.provinciaResidencia
        };
      }
    }
  }

  return { top10, currentUserRank };
}
