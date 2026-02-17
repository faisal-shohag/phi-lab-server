"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardService = void 0;
const db_1 = require("../../config/db");
const PAGE_SIZE = 50;
exports.LeaderboardService = {
    getGlobal() {
        return __awaiter(this, arguments, void 0, function* (page = 0, currentUserId) {
            var _a, _b;
            const PAGE_SIZE = 15;
            const MAX_USERS = 100;
            const offset = page * PAGE_SIZE;
            const [entries, totalTop100Result, userRankResult] = yield Promise.all([
                // ---------------------------------------------------
                // 🏆 LEADERBOARD ENTRIES (Top 100 → paginated)
                // ---------------------------------------------------
                db_1.prisma.$queryRaw `
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
                db_1.prisma.$queryRaw `
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
                    ? db_1.prisma.$queryRaw `
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
            const totalInLeaderboard = Number(((_a = totalTop100Result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0);
            const formattedEntries = entries.map((e) => (Object.assign(Object.assign({}, e), { rank: Number(e.rank), totalBattles: Number(e.totalBattles), me: currentUserId === e.userId })));
            return {
                entries: formattedEntries,
                userRank: ((_b = userRankResult === null || userRankResult === void 0 ? void 0 : userRankResult[0]) === null || _b === void 0 ? void 0 : _b.rank)
                    ? Number(userRankResult[0].rank)
                    : null,
                hasMore: offset + formattedEntries.length < totalInLeaderboard,
            };
        });
    },
    getCollection(collectionId_1) {
        return __awaiter(this, arguments, void 0, function* (collectionId, page = 0, currentUserId) {
            const offset = page * PAGE_SIZE;
            const [entries, userRankResult] = yield Promise.all([
                db_1.prisma.$queryRaw `
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
                    ? db_1.prisma.$queryRaw `
            SELECT DENSE_RANK() OVER (ORDER BY score DESC) AS rank
            FROM "CollectionLeaderboard"
            WHERE "userId" = ${currentUserId} AND "collectionId" = ${collectionId}
          `
                    : null,
            ]);
            return {
                entries: entries.map((e) => (Object.assign(Object.assign({}, e), { rank: Number(e.rank) }))),
                userRank: (userRankResult === null || userRankResult === void 0 ? void 0 : userRankResult[0]) ? Number(userRankResult[0].rank) : null,
                hasMore: entries.length === PAGE_SIZE,
            };
        });
    },
    getBattle(battleId_1) {
        return __awaiter(this, arguments, void 0, function* (battleId, page = 0, currentUserId) {
            const offset = page * PAGE_SIZE;
            const [entries, userRankResult] = yield Promise.all([
                db_1.prisma.$queryRaw `
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
                    ? db_1.prisma.$queryRaw `
            SELECT DENSE_RANK() OVER (ORDER BY score DESC) AS rank
            FROM "BattleLeaderboard"
            WHERE "userId" = ${currentUserId} AND "battleId" = ${battleId}
          `
                    : null,
            ]);
            return {
                entries: entries.map((e) => (Object.assign(Object.assign({}, e), { rank: Number(e.rank) }))),
                userRank: (userRankResult === null || userRankResult === void 0 ? void 0 : userRankResult[0]) ? Number(userRankResult[0].rank) : null,
                hasMore: entries.length === PAGE_SIZE,
            };
        });
    },
    getJsGlobal() {
        return __awaiter(this, arguments, void 0, function* (page = 0, currentUserId) {
            var _a, _b;
            const PAGE_SIZE = 15;
            const MAX_USERS = 100;
            const offset = page * PAGE_SIZE;
            const [entries, totalTop100Result, userRankResult] = yield Promise.all([
                // ---------------------------------------------------
                // 🏆 TOP 100 JS LEADERBOARD (Paginated)
                // ---------------------------------------------------
                db_1.prisma.$queryRaw `
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
                db_1.prisma.$queryRaw `
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
                    ? db_1.prisma.$queryRaw `
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
            const totalInLeaderboard = Number(((_a = totalTop100Result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0);
            const formattedEntries = entries.map((e) => (Object.assign(Object.assign({}, e), { rank: Number(e.rank), totalPoints: Number(e.totalPoints), solvedCount: Number(e.solvedCount), totalAttempted: Number(e.totalAttempted), me: currentUserId === e.userId })));
            return {
                entries: formattedEntries,
                userRank: ((_b = userRankResult === null || userRankResult === void 0 ? void 0 : userRankResult[0]) === null || _b === void 0 ? void 0 : _b.rank)
                    ? Number(userRankResult[0].rank)
                    : null,
                hasMore: offset + formattedEntries.length < totalInLeaderboard,
            };
        });
    },
};
