import { prisma } from "../../config/db";
import { LeaderboardEntry, LeaderboardResponse } from "./leaderboard.interface";

const PAGE_SIZE = 50;

export const LeaderboardService = {
  async getGlobal(
  page = 0,
  currentUserId?: string
): Promise<LeaderboardResponse> {
  const PAGE_SIZE = 15;
  const MAX_USERS = 100;
  const offset = page * PAGE_SIZE;

  const [entries, totalTop100Result, userRankResult] = await Promise.all([
    // ---------------------------------------------------
    // 🏆 LEADERBOARD ENTRIES (Top 100 → paginated)
    // ---------------------------------------------------
    prisma.$queryRaw<LeaderboardEntry[]>`
      WITH ranked AS (
        SELECT
          gl."userId",
          gl.score,
          DENSE_RANK() OVER (ORDER BY gl.score DESC) AS rank
        FROM "GlobalLeaderboard" gl
      )
      SELECT
        u.id AS "userId",
        u.name,
        u.picture,
        r.score::float8 AS score,
        r.rank,
        COALESCE(tb."totalBattles", 0) AS "totalBattles"
      FROM ranked r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN (
        SELECT
          "userId",
          COUNT(DISTINCT "battleId") AS "totalBattles"
        FROM "BattleSubmission"
        GROUP BY "userId"
      ) tb ON tb."userId" = u.id
      WHERE
        u.status = 'ACTIVE'
        AND r.rank <= ${MAX_USERS}
      ORDER BY r.rank
      LIMIT ${PAGE_SIZE}
      OFFSET ${offset};
    `,

    // ---------------------------------------------------
    // 🔢 TOTAL USERS IN TOP 100 (for hasMore)
    // ---------------------------------------------------
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count
      FROM (
        SELECT
          DENSE_RANK() OVER (ORDER BY score DESC) AS rank
        FROM "GlobalLeaderboard"
      ) ranked
      WHERE rank <= ${MAX_USERS};
    `,

    // ---------------------------------------------------
    // 👤 CURRENT USER RANK (ONLY IF INSIDE TOP 100)
    // ---------------------------------------------------
    currentUserId
      ? prisma.$queryRaw<{ rank: bigint | null }[]>`
          SELECT rank
          FROM (
            SELECT
              "userId",
              DENSE_RANK() OVER (ORDER BY score DESC) AS rank
            FROM "GlobalLeaderboard"
          ) ranked
          WHERE "userId" = ${currentUserId}
            AND rank <= ${MAX_USERS};
        `
      : null,
  ]);

  const totalInLeaderboard = Number(totalTop100Result[0]?.count || 0);

  const formattedEntries = entries.map((e) => ({
    ...e,
    rank: Number(e.rank),
    totalBattles: Number(e.totalBattles),
    me: currentUserId === e.userId,
  }));

  return {
    entries: formattedEntries,
    userRank: userRankResult?.[0]?.rank
      ? Number(userRankResult[0].rank)
      : null,
    hasMore: offset + formattedEntries.length < totalInLeaderboard,
  };
}
,

  async getCollection(collectionId: number, page = 0, currentUserId?: string) {
    const offset = page * PAGE_SIZE;

    const [entries, userRankResult] = await Promise.all([
      prisma.$queryRaw<LeaderboardEntry[]>`
        SELECT 
          u.id AS "userId",
          u.name,
          u.picture,
          cl.score::float8 AS score,
          DENSE_RANK() OVER (ORDER BY cl.score DESC) AS rank
        FROM "CollectionLeaderboard" cl
        JOIN "User" u ON u.id = cl."userId"
        WHERE cl."collectionId" = ${collectionId}
          AND u.status = 'ACTIVE'
        ORDER BY rank
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `,

      currentUserId
        ? prisma.$queryRaw<{ rank: bigint }[]>`
            SELECT DENSE_RANK() OVER (ORDER BY score DESC) AS rank
            FROM "CollectionLeaderboard"
            WHERE "userId" = ${currentUserId} AND "collectionId" = ${collectionId}
          `
        : null,
    ]);

    return {
      entries: entries.map((e) => ({ ...e, rank: Number(e.rank) })),
      userRank: userRankResult?.[0] ? Number(userRankResult[0].rank) : null,
      hasMore: entries.length === PAGE_SIZE,
    };
  },

  async getBattle(battleId: number, page = 0, currentUserId?: string) {
    const offset = page * PAGE_SIZE;

    const [entries, userRankResult] = await Promise.all([
      prisma.$queryRaw<LeaderboardEntry[]>`
        SELECT 
          u.id AS "userId",
          u.name,
          u.picture,
          bl.score::float8 AS score,
          DENSE_RANK() OVER (ORDER BY bl.score DESC) AS rank
        FROM "BattleLeaderboard" bl
        JOIN "User" u ON u.id = bl."userId"
        WHERE bl."battleId" = ${battleId}
          AND u.status = 'ACTIVE'
        ORDER BY rank
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `,

      currentUserId
        ? prisma.$queryRaw<{ rank: bigint }[]>`
            SELECT DENSE_RANK() OVER (ORDER BY score DESC) AS rank
            FROM "BattleLeaderboard"
            WHERE "userId" = ${currentUserId} AND "battleId" = ${battleId}
          `
        : null,
    ]);

    return {
      entries: entries.map((e) => ({ ...e, rank: Number(e.rank) })),
      userRank: userRankResult?.[0] ? Number(userRankResult[0].rank) : null,
      hasMore: entries.length === PAGE_SIZE,
    };
  },


  async getJsGlobal(
  page = 0,
  currentUserId?: string
): Promise<LeaderboardResponse> {
  const PAGE_SIZE = 15;
  const MAX_USERS = 100;
  const offset = page * PAGE_SIZE;

  const [entries, totalTop100Result, userRankResult] = await Promise.all([
    // ---------------------------------------------------
    // 🏆 TOP 100 JS LEADERBOARD (Paginated)
    // ---------------------------------------------------
    prisma.$queryRaw<any[]>`
      WITH ranked AS (
        SELECT
          gl."userId",
          gl."totalPoints",
          gl."solvedCount",
          DENSE_RANK() OVER (
            ORDER BY gl."totalPoints" DESC, gl."solvedCount" DESC
          ) AS rank
        FROM "JsGlobalLeaderboard" gl
      )
      SELECT
        u.id AS "userId",
        u.name,
        u.picture,
        r."totalPoints"::float8 AS "totalPoints",
        r."solvedCount",
        r.rank,
        COALESCE(tb."totalAttempted", 0) AS "totalAttempted"
      FROM ranked r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN (
        SELECT
          "userId",
          COUNT(DISTINCT "problemId") AS "totalAttempted"
        FROM "Submission"
        GROUP BY "userId"
      ) tb ON tb."userId" = u.id
      WHERE
        u.status = 'ACTIVE'
        AND r.rank <= ${MAX_USERS}
      ORDER BY r.rank
      LIMIT ${PAGE_SIZE}
      OFFSET ${offset};
    `,

    // ---------------------------------------------------
    // 🔢 TOTAL USERS IN TOP 100
    // ---------------------------------------------------
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count
      FROM (
        SELECT
          DENSE_RANK() OVER (
            ORDER BY "totalPoints" DESC, "solvedCount" DESC
          ) AS rank
        FROM "JsGlobalLeaderboard"
      ) ranked
      WHERE rank <= ${MAX_USERS};
    `,

    // ---------------------------------------------------
    // 👤 CURRENT USER RANK (Only if inside Top 100)
    // ---------------------------------------------------
    currentUserId
      ? prisma.$queryRaw<{ rank: bigint | null }[]>`
          SELECT rank
          FROM (
            SELECT
              "userId",
              DENSE_RANK() OVER (
                ORDER BY "totalPoints" DESC, "solvedCount" DESC
              ) AS rank
            FROM "JsGlobalLeaderboard"
          ) ranked
          WHERE "userId" = ${currentUserId}
            AND rank <= ${MAX_USERS};
        `
      : null,
  ]);

  const totalInLeaderboard = Number(totalTop100Result[0]?.count || 0);

  const formattedEntries = entries.map((e) => ({
    ...e,
    rank: Number(e.rank),
    totalPoints: Number(e.totalPoints),
    solvedCount: Number(e.solvedCount),
    totalAttempted: Number(e.totalAttempted),
    me: currentUserId === e.userId,
  }));

  return {
    entries: formattedEntries,
    userRank: userRankResult?.[0]?.rank
      ? Number(userRankResult[0].rank)
      : null,
    hasMore: offset + formattedEntries.length < totalInLeaderboard,
  };
}
,
};
