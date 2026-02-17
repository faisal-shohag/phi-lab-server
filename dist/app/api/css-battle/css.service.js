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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssService = exports.getBattles = exports.deleteBattle = exports.createBattle = exports.deleteCollection = exports.getCollectionById = exports.getCollections = exports.createCollection = exports.createSubmission = exports.getBattleByNo = exports.CompareCssV2 = exports.CompareCss = void 0;
const css_helpers_1 = require("./css.helpers");
const csss_compare_1 = require("./csss.compare");
const db_1 = require("../../config/db");
const client_1 = require("../../../generated/prisma/client");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const daily_streak_service_1 = require("../daily-streak/daily-streak.service");
const get_browser_1 = require("../../utils/get-browser");
const get_browser_v2_1 = require("../../utils/get-browser-v2");
const CompareCss = (battleId_1, code_1, targetURL_1, userId_1, ...args_1) => __awaiter(void 0, [battleId_1, code_1, targetURL_1, userId_1, ...args_1], void 0, function* (battleId, code, targetURL, userId, maxScore = 1000) {
    if (code.length <= 0) {
        throw new app_error_1.default(400, "Code cannot be empty!");
    }
    const browser = yield (0, get_browser_1.getBrowser)();
    const page = yield browser.newPage();
    yield page.setViewport({
        width: 400,
        height: 300,
        deviceScaleFactor: 1,
    });
    yield page.evaluate((html) => {
        document.open();
        document.write(`
    <style>
      * { margin: 0; padding: 0; }
      body { overflow: hidden; margin: 11.5px; }
    </style>
    ${html}
  `);
        document.close();
    }, code);
    const imageBuffer = yield page.screenshot({
        type: "png",
        encoding: "base64",
    });
    yield page.close();
    const targetBase64 = yield (0, css_helpers_1.loadPNGfromURL)(targetURL);
    const userBase64 = imageBuffer;
    const comparison = yield (0, csss_compare_1.compare)(targetBase64, userBase64, code.length, maxScore, 0);
    // Save submission to DB
    const submission = yield (0, exports.createSubmission)(userId, battleId, comparison.score, code, comparison.accuracy);
    return {
        success: true,
        pngBase64: userBase64, // User's rendered image
        targetBase64,
        userBase64,
        comparison,
        submission,
    };
});
exports.CompareCss = CompareCss;
const CompareCssV2 = (battleId_1, code_1, targetURL_1, userId_1, ...args_1) => __awaiter(void 0, [battleId_1, code_1, targetURL_1, userId_1, ...args_1], void 0, function* (battleId, code, targetURL, userId, maxScore = 1000) {
    if (code.length <= 0) {
        throw new app_error_1.default(400, "Code cannot be empty!");
    }
    const browser = yield (0, get_browser_v2_1.getBrowserV2)();
    const page = yield browser.newPage();
    yield page.setViewport({
        width: 400,
        height: 300,
        deviceScaleFactor: 1,
    });
    yield page.evaluate((html) => {
        document.open();
        document.write(`
    <style>
      * { margin: 0; padding: 0; }
      body { overflow: hidden; margin: 11.5px; }
    </style>
    ${html}
  `);
        document.close();
    }, code);
    const imageBuffer = yield page.screenshot({
        type: "png",
        encoding: "base64",
    });
    yield page.close();
    const targetBase64 = yield (0, css_helpers_1.loadPNGfromURL)(targetURL);
    const userBase64 = imageBuffer;
    const comparison = yield (0, csss_compare_1.compare)(targetBase64, userBase64, code.length, maxScore, 0);
    // Save submission to DB
    const submission = yield (0, exports.createSubmission)(userId, battleId, comparison.score, code, comparison.accuracy);
    return {
        success: true,
        pngBase64: userBase64, // User's rendered image
        targetBase64,
        userBase64,
        comparison,
        submission,
    };
});
exports.CompareCssV2 = CompareCssV2;
const getBattleByNo = (battleNo, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const [row] = yield db_1.prisma.$queryRaw `
    WITH battle_id_cte AS (
      SELECT id AS battle_id
      FROM "Battle"
      WHERE "battleNo" = ${battleNo}
    ),
    top5_with_stats AS (
      SELECT 
        bl."userId",
        bl.score,
        u.name,
        u.picture,
        bs."highScore" AS best_score,
        bs."highAccuracy" AS accuracy,
        LENGTH(bs."highScoreCode") AS char_count,
        ROW_NUMBER() OVER (ORDER BY bl.score DESC) AS pos
      FROM "BattleLeaderboard" bl
      JOIN "User" u ON u.id = bl."userId"
      LEFT JOIN "BattleSubmission" bs 
        ON bs."userId" = bl."userId" 
       AND bs."battleId" = bl."battleId"
      CROSS JOIN battle_id_cte bid
      WHERE bl."battleId" = bid.battle_id
        AND u.status = 'ACTIVE'
      ORDER BY bl.score DESC
      LIMIT 5
    )
    SELECT 
      -- Battle details
      jsonb_build_object(
        'id', b.id,
        'battleNo', b."battleNo",
        'title', b.title,
        'description', b.description,
        'target', b.target,
        'size', b.size,
        'createdAt', b."createdAt",
        'updatedAt', b."updatedAt",
        'colors', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', bc.id, 'code', bc.code))
          FROM "BattleColors" bc WHERE bc."battleId" = b.id
        ), '[]'),
        'assets', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', ba.id, 'title', ba.title, 'url', ba.url))
          FROM "BattleAssets" ba WHERE ba."battleId" = b.id
        ), '[]')
      ) AS battle,

      -- User's single submission (latest + best in one row)
      (
        SELECT jsonb_build_object(
          'id', bs.id,
          -- Latest submission
          'latestCode', bs.code,
          'latestScore', bs.score,
          'latestAccuracy', bs.accuracy,
          'latestCharCount', LENGTH(bs.code),
          -- Best submission
          'bestCode', bs."highScoreCode",
          'bestScore', bs."highScore",
          'bestAccuracy', bs."highAccuracy",
          'bestCharCount', LENGTH(bs."highScoreCode"),
          'createdAt', bs."createdAt",
          'updatedAt', bs."updatedAt"
        )
        FROM "BattleSubmission" bs
        CROSS JOIN battle_id_cte bid
        WHERE bs."userId" = ${userId}
          AND bs."battleId" = bid.battle_id
      ) AS user_submission,

      -- Top 5 leaderboard (showing best submission stats)
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'rank', t.pos,
            'userId', t."userId",
            'name', t.name,
            'picture', t.picture,
            'score', t.best_score::float8,
            'accuracy', t.accuracy::float8,
            'charCount', t.char_count,
            'me', t."userId" = ${userId}
          )
            --- order by best score desc
          ORDER BY t.best_score DESC
          
        )
        FROM top5_with_stats t
      ), '[]'::jsonb) AS leaderboard

    FROM "Battle" b
    CROSS JOIN battle_id_cte bid
    WHERE b.id = bid.battle_id
  `;
    if (!row)
        return null;
    const userSub = row.user_submission;
    // console.log(row.leaderboard)
    return Object.assign(Object.assign({}, row.battle), { 
        // User submission: null if none, otherwise split into latest/best
        userLatestSubmission: userSub
            ? {
                id: userSub.id,
                code: userSub.latestCode,
                score: Number(userSub.latestScore),
                accuracy: Number(userSub.latestAccuracy),
                charCount: Number(userSub.latestCharCount),
                createdAt: userSub.createdAt,
                updatedAt: userSub.updatedAt,
            }
            : null, userBestSubmission: userSub
            ? {
                id: userSub.id,
                code: userSub.bestCode,
                score: Number(userSub.bestScore),
                accuracy: Number(userSub.bestAccuracy),
                charCount: Number(userSub.bestCharCount),
                createdAt: userSub.createdAt, // or you could track bestSubmittedAt separately if needed
            }
            : null, leaderboard: row.leaderboard.map((entry) => ({
            rank: entry.rank,
            user: {
                id: entry.userId,
                name: entry.name,
                picture: entry.picture,
            },
            score: entry.score,
            accuracy: entry.accuracy,
            charCount: entry.charCount,
            me: entry.me,
        })) });
});
exports.getBattleByNo = getBattleByNo;
const createSubmission = (userId, battleId, score, code, accuracy) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // 1. Upsert latest submission data
        const submission = yield tx.battleSubmission.upsert({
            where: { userId_battleId: { userId, battleId } },
            create: {
                userId,
                battleId,
                code,
                score,
                accuracy,
                highScore: score,
                highScoreCode: code,
                highAccuracy: accuracy,
                submissionCount: 1,
            },
            update: {
                code,
                score,
                accuracy,
                updatedAt: new Date(),
                submissionCount: { increment: 1 },
            },
        });
        // 2. Conditionally update highScore fields using raw SQL (safe + efficient)
        const updateResult = yield tx.$executeRaw `
      UPDATE "BattleSubmission"
      SET
        "highScore" = GREATEST("highScore", ${score}),
        "highScoreCode" = CASE WHEN "highScore" < ${score} THEN ${code} ELSE "highScoreCode" END,
        "highAccuracy" = CASE WHEN "highScore" < ${score} THEN ${accuracy} ELSE "highAccuracy" END
      WHERE "userId" = ${userId} AND "battleId" = ${battleId}
        AND "highScore" < ${score}
    `;
        // If no rows were affected → personal best did NOT improve → skip all leaderboard work
        const hasImproved = updateResult > 0;
        let currentBestScore = null;
        let currentBestAccuracy = null;
        if (hasImproved) {
            // Fetch the new highScore (only when needed)
            const updatedSub = yield tx.battleSubmission.findUnique({
                where: { userId_battleId: { userId, battleId } },
                select: { highScore: true, highAccuracy: true, },
            });
            currentBestScore = (_a = updatedSub === null || updatedSub === void 0 ? void 0 : updatedSub.highScore) !== null && _a !== void 0 ? _a : score;
            currentBestAccuracy = (_b = updatedSub === null || updatedSub === void 0 ? void 0 : updatedSub.highAccuracy) !== null && _b !== void 0 ? _b : accuracy;
        }
        else {
            // Quick exit: best score unchanged → fetch old leaderboard score once
            const existing = yield tx.battleLeaderboard.findUnique({
                where: { userId_battleId: { userId, battleId } },
                select: { score: true, accuracy: true },
            });
            currentBestScore = (_c = existing === null || existing === void 0 ? void 0 : existing.score) !== null && _c !== void 0 ? _c : null;
            currentBestAccuracy = (_d = existing === null || existing === void 0 ? void 0 : existing.accuracy) !== null && _d !== void 0 ? _d : null;
            if (currentBestScore === null) {
                currentBestScore = score;
                currentBestAccuracy = accuracy;
            }
        }
        // Early return if no improvement AND no initial leaderboard entry needed
        // But we still need to update battle leaderboard on first valid high score
        const previousLeaderboard = yield tx.battleLeaderboard.findUnique({
            where: { userId_battleId: { userId, battleId } },
            select: { score: true },
        });
        const shouldUpdateLeaderboards = hasImproved ||
            (!previousLeaderboard && currentBestScore !== null && currentBestScore > 0);
        if (!shouldUpdateLeaderboards) {
            // Fast path: most submissions end here!
            yield tx.user.update({
                where: { id: userId },
                data: { battleSubmissionCount: { increment: 1 } },
            });
            yield (0, daily_streak_service_1.recordUserActivity)(userId);
            return submission;
        }
        // --- Only execute expensive ops when necessary ---
        // Update Battle Leaderboard
        if (currentBestScore !== null) {
            yield tx.battleLeaderboard.upsert({
                where: { userId_battleId: { userId, battleId } },
                update: { score: currentBestScore, accuracy: currentBestAccuracy || 0 },
                create: { userId, battleId, score: currentBestScore, accuracy: currentBestAccuracy || 0 },
            });
        }
        // Get collectionId once
        const battle = yield tx.battle.findUnique({
            where: { id: battleId },
            select: { collectionId: true },
        });
        const collectionId = battle === null || battle === void 0 ? void 0 : battle.collectionId;
        // Update Collection Leaderboard (only if in a collection)
        if (collectionId) {
            const collectionSumResult = yield tx.$queryRaw `
        SELECT COALESCE(SUM(bl.score), 0)::float8 AS total
        FROM "BattleLeaderboard" bl
        JOIN "Battle" b ON bl."battleId" = b.id
        WHERE bl."userId" = ${userId}
          AND b."collectionId" = ${collectionId}
      `;
            const collectionTotal = (_f = (_e = collectionSumResult[0]) === null || _e === void 0 ? void 0 : _e.total) !== null && _f !== void 0 ? _f : 0;
            yield tx.collectionLeaderboard.upsert({
                where: { userId_collectionId: { userId, collectionId } },
                update: { score: collectionTotal },
                create: { userId, collectionId, score: collectionTotal },
            });
        }
        // Update Global Leaderboard
        const globalSumResult = yield tx.$queryRaw `
      SELECT COALESCE(SUM(score), 0)::float8 AS total
      FROM "BattleLeaderboard"
      WHERE "userId" = ${userId}
    `;
        const globalTotal = (_h = (_g = globalSumResult[0]) === null || _g === void 0 ? void 0 : _g.total) !== null && _h !== void 0 ? _h : 0;
        yield tx.globalLeaderboard.upsert({
            where: { userId },
            update: { score: globalTotal },
            create: { userId, score: globalTotal },
        });
        // Increment submission count & record activity
        yield tx.user.update({
            where: { id: userId },
            data: { battleSubmissionCount: { increment: 1 } },
        });
        yield (0, daily_streak_service_1.recordUserActivity)(userId);
        return submission;
    }));
});
exports.createSubmission = createSubmission;
const createCollection = (title, description, picture) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.battleCollection.create({
        data: {
            title,
            description,
            picture,
        },
    });
});
exports.createCollection = createCollection;
//get all collections
const getCollections = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 10) {
    return yield db_1.prisma.battleCollection.findMany({
        take: limit,
        include: {
            battles: {
                take: 10,
                orderBy: {
                    battleNo: "asc",
                },
            },
            _count: {
                select: {
                    battles: true,
                },
            },
            collectionLeaderboard: {
                orderBy: {
                    score: "desc",
                },
                include: {
                    user: true,
                },
                take: 3,
            },
        },
    });
});
exports.getCollections = getCollections;
const getCollectionById = (collectionId, user) => __awaiter(void 0, void 0, void 0, function* () {
    const collection = yield db_1.prisma.battleCollection.findUnique({
        where: { id: collectionId },
        select: {
            id: true,
            title: true,
            description: true,
            picture: true,
            createdAt: true,
            updatedAt: true,
            battles: {
                orderBy: { battleNo: "asc" },
                select: {
                    id: true,
                    battleNo: true,
                    title: true,
                    description: true,
                    target: true,
                    size: true,
                    _count: {
                        select: {
                            battleSubmissions: {
                                where: { userId: user.id },
                            },
                        },
                    },
                    battleLeaderboard: {
                        where: { userId: user.id },
                        select: { score: true, accuracy: true, },
                    },
                },
            },
            collectionLeaderboard: {
                take: 10,
                orderBy: { score: "desc" },
                select: {
                    score: true,
                    user: {
                        select: { id: true, name: true, picture: true },
                    },
                },
            },
        },
    });
    if (!collection)
        return null;
    const battles = collection.battles.map((battle) => {
        var _a, _b, _c, _d;
        return ({
            id: battle.id,
            battleNo: battle.battleNo,
            title: battle.title,
            description: battle.description,
            target: battle.target,
            size: battle.size,
            hasSubmitted: battle._count.battleSubmissions > 0,
            userHighestScore: (_b = (_a = battle.battleLeaderboard[0]) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : 0,
            userHighestAccuracy: (_d = (_c = battle.battleLeaderboard[0]) === null || _c === void 0 ? void 0 : _c.accuracy) !== null && _d !== void 0 ? _d : 0,
        });
    });
    // console.log(collection.battles[4].battleLeaderboard)
    const leaderboard = collection.collectionLeaderboard.map((entry) => ({
        score: entry.score,
        user: entry.user,
        me: entry.user.id === user.id,
    }));
    return Object.assign(Object.assign({}, collection), { battles, collectionLeaderboard: leaderboard });
});
exports.getCollectionById = getCollectionById;
//delete collection
const deleteCollection = (collectionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.battleCollection.delete({
        where: {
            id: collectionId,
        },
    });
});
exports.deleteCollection = deleteCollection;
//create battle
const createBattle = (title, description, target, size, collectionId, colors, assets, battleNo) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.battle.create({
        data: {
            title,
            description,
            target,
            size,
            collectionId,
            colors,
            assets,
            battleNo,
        },
    });
});
exports.createBattle = createBattle;
//delete battle
const deleteBattle = (battleId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.battle.delete({
        where: {
            id: battleId,
        },
    });
});
exports.deleteBattle = deleteBattle;
const getBattles = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, filters = {}) {
    const { cursor, limit = 20, search = "", collectionId, sort = "newest", } = filters;
    const searchTerm = search.trim().toLowerCase();
    const battles = yield db_1.prisma.$queryRaw `
    SELECT 
      b.id,
      b."battleNo",
      b.title,
      b.description,
      b.target,
      b.size,
      b."createdAt",
      bc.id AS "collectionId",
      bc.title AS "collectionTitle",
      COALESCE(bs_count.count, 0) AS "totalSubmissionCount",
      COALESCE(unique_users.count, 0) AS "participationCount",
      COALESCE(user_leader.score, 0) AS "userHighestScore",
      COALESCE(user_leader.has_submitted, false) AS "hasSubmitted",
      top_leader.name AS "topScorerName",
      top_leader.score AS "topScore"
    FROM "Battle" b
    LEFT JOIN "BattleCollection" bc ON bc.id = b."collectionId"
    
    -- Total submissions
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS count
      FROM "BattleSubmission" bs
      WHERE bs."battleId" = b.id
    ) bs_count ON true

    -- Unique participants (distinct users)
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT "userId") AS count
      FROM "BattleSubmission" bs
      WHERE bs."battleId" = b.id
    ) unique_users ON true

    -- User highest score and submission status
    LEFT JOIN LATERAL (
      SELECT bl.score, EXISTS(
        SELECT 1 FROM "BattleSubmission" bs2 
        WHERE bs2."battleId" = b.id AND bs2."userId" = ${userId}
      ) AS has_submitted
      FROM "BattleLeaderboard" bl
      WHERE bl."battleId" = b.id AND bl."userId" = ${userId}
    ) user_leader ON true

    -- Top scorer
    LEFT JOIN LATERAL (
      SELECT u.name, bl.score
      FROM "BattleLeaderboard" bl
      JOIN "User" u ON u.id = bl."userId"
      WHERE bl."battleId" = b.id
      ORDER BY bl.score DESC
      LIMIT 1
    ) top_leader ON true

    WHERE 1=1
      ${searchTerm
        ? client_1.Prisma.sql `AND LOWER(b.title) LIKE ${"%" + searchTerm + "%"}`
        : client_1.Prisma.empty}
      ${collectionId
        ? client_1.Prisma.sql `AND b."collectionId" = ${collectionId}`
        : client_1.Prisma.empty}
      ${cursor ? client_1.Prisma.sql `AND b."battleNo" > ${cursor}` : client_1.Prisma.empty}

    ORDER BY
      ${sort === "mostParticipated"
        ? client_1.Prisma.sql `unique_users.count DESC, b."battleNo" DESC`
        : sort === "oldest"
            ? client_1.Prisma.sql `b."battleNo" ASC`
            : client_1.Prisma.sql `b."battleNo" DESC`}  -- newest default

    LIMIT ${limit + 1} -- fetch one extra to detect hasMore
  `;
    const hasMore = battles.length > limit;
    const resultBattles = battles.slice(0, limit);
    const nextCursor = hasMore
        ? resultBattles[resultBattles.length - 1].battleNo
        : null;
    return {
        battles: resultBattles.map((b) => ({
            id: b.id,
            battleNo: b.battleNo,
            title: b.title,
            description: b.description,
            target: b.target,
            size: b.size,
            createdAt: b.createdAt,
            collection: b.collectionId
                ? { id: b.collectionId, title: b.collectionTitle }
                : null,
            totalSubmissionCount: Number(b.totalSubmissionCount),
            participationCount: Number(b.participationCount),
            hasSubmitted: b.hasSubmitted,
            userHighestScore: Number(b.userHighestScore),
            topScorer: b.topScorerName
                ? { name: b.topScorerName, score: Number(b.topScore) }
                : null,
        })),
        pagination: {
            limit,
            hasMore,
            nextCursor,
        },
    };
});
exports.getBattles = getBattles;
exports.CssService = {
    CompareCss: exports.CompareCss,
    CompareCssV2: exports.CompareCssV2,
    getBattleByNo: exports.getBattleByNo,
    createSubmission: exports.createSubmission,
    createCollection: exports.createCollection,
    getCollections: exports.getCollections,
    getCollectionById: exports.getCollectionById,
    createBattle: exports.createBattle,
    deleteCollection: exports.deleteCollection,
    deleteBattle: exports.deleteBattle,
    getBattles: exports.getBattles,
};
