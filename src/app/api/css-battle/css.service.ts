import { loadPNGfromURL } from "./css.helpers";
import { compare } from "./csss.compare";
import { prisma } from "../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { TokenPayload } from "../auth/auth.interface";
import AppError from "../../helpers/app-error";
import { recordUserActivity } from "../daily-streak/daily-streak.service";
import { getBrowser } from "../../utils/get-browser";
import { getBrowserV2 } from "../../utils/get-browser-v2";
export const CompareCss = async (
  battleId: number,
  code: string,
  targetURL: string,
  userId: string,
  maxScore = 1000
) => {
  if (code.length <= 0) {
    throw new AppError(400, "Code cannot be empty!");
  }
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({
    width: 400,
    height: 300,
    deviceScaleFactor: 1,
  });
  await page.evaluate((html) => {
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
  const imageBuffer = await page.screenshot({
    type: "png",
    encoding: "base64",
  });

  await page.close();

  const targetBase64 = await loadPNGfromURL(targetURL);
  const userBase64 = imageBuffer;

  const comparison = await compare(
    targetBase64,
    userBase64,
    code.length,
    maxScore,
    0
  );

  // Save submission to DB
  const submission = await createSubmission(
    userId,
    battleId,
    comparison.score as number,
    code,
    comparison.accuracy as number
  );

  return {
    success: true,
    pngBase64: userBase64, // User's rendered image
    targetBase64,
    userBase64,
    comparison,
    submission,
  };
};

export const CompareCssV2 = async (
  battleId: number,
  code: string,
  targetURL: string,
  userId: string,
  maxScore = 1000
) => {
  if (code.length <= 0) {
    throw new AppError(400, "Code cannot be empty!");
  }
  const browser = await getBrowserV2();
  const page = await browser.newPage();
  await page.setViewport({
    width: 400,
    height: 300,
    deviceScaleFactor: 1,
  });
  await page.evaluate((html) => {
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
  const imageBuffer = await page.screenshot({
    type: "png",
    encoding: "base64",
  });

  await page.close();

  const targetBase64 = await loadPNGfromURL(targetURL);
  const userBase64 = imageBuffer;

  const comparison = await compare(
    targetBase64,
    userBase64,
    code.length,
    maxScore,
    0
  );

  // Save submission to DB
  const submission = await createSubmission(
    userId,
    battleId,
    comparison.score as number,
    code,
    comparison.accuracy as number
  );

  return {
    success: true,
    pngBase64: userBase64, // User's rendered image
    targetBase64,
    userBase64,
    comparison,
    submission,
  };
};

export const getBattleByNo = async (battleNo: number, userId: string) => {
  const [row] = await prisma.$queryRaw<
    {
      battle: any;
      user_submission: any;
      leaderboard: any[];
    }[]
  >`
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

  if (!row) return null;

  const userSub = row.user_submission;

  // console.log(row.leaderboard)

  return {
    ...row.battle,

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
      : null,

    userBestSubmission: userSub
      ? {
          id: userSub.id,
          code: userSub.bestCode,
          score: Number(userSub.bestScore),
          accuracy: Number(userSub.bestAccuracy),
          charCount: Number(userSub.bestCharCount),
          createdAt: userSub.createdAt, // or you could track bestSubmittedAt separately if needed
        }
      : null,

    leaderboard: row.leaderboard.map((entry: any) => ({
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
    })),
  };
};
export const createSubmission = async (
  userId: string,
  battleId: number,
  score: number,
  code: string,
  accuracy: number
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Upsert latest submission data
    const submission = await tx.battleSubmission.upsert({
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
    const updateResult = await tx.$executeRaw`
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

    let currentBestScore: number | null = null;
    let currentBestAccuracy: number | null = null;

    if (hasImproved) {
      // Fetch the new highScore (only when needed)
      const updatedSub = await tx.battleSubmission.findUnique({
        where: { userId_battleId: { userId, battleId } },
        select: { highScore: true, highAccuracy: true, },
      });
      currentBestScore = updatedSub?.highScore ?? score;
      currentBestAccuracy =  updatedSub?.highAccuracy ?? accuracy;
     
    } else {
      // Quick exit: best score unchanged → fetch old leaderboard score once
      const existing = await tx.battleLeaderboard.findUnique({
        where: { userId_battleId: { userId, battleId } },
        select: { score: true, accuracy: true },
      });
      currentBestScore = existing?.score ?? null;
      currentBestAccuracy = existing?.accuracy ?? null;

      if (currentBestScore === null) {
        currentBestScore = score;
        currentBestAccuracy = accuracy;
      }
    }

    // Early return if no improvement AND no initial leaderboard entry needed
    // But we still need to update battle leaderboard on first valid high score
    const previousLeaderboard = await tx.battleLeaderboard.findUnique({
      where: { userId_battleId: { userId, battleId } },
      select: { score: true },
    });

    const shouldUpdateLeaderboards =
      hasImproved ||
      (!previousLeaderboard && currentBestScore !== null && currentBestScore > 0);

    if (!shouldUpdateLeaderboards) {
      // Fast path: most submissions end here!
      await tx.user.update({
        where: { id: userId },
        data: { battleSubmissionCount: { increment: 1 } },
      });
      await recordUserActivity(userId);
      return submission;
    }

    // --- Only execute expensive ops when necessary ---

    // Update Battle Leaderboard
    if (currentBestScore !== null) {
      await tx.battleLeaderboard.upsert({
        where: { userId_battleId: { userId, battleId } },
        update: { score: currentBestScore, accuracy: currentBestAccuracy || 0 },
        create: { userId, battleId, score: currentBestScore, accuracy: currentBestAccuracy || 0 },
      });
    }

    // Get collectionId once
    const battle = await tx.battle.findUnique({
      where: { id: battleId },
      select: { collectionId: true },
    });
    const collectionId = battle?.collectionId;

    // Update Collection Leaderboard (only if in a collection)
    if (collectionId) {
      const collectionSumResult = await tx.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(bl.score), 0)::float8 AS total
        FROM "BattleLeaderboard" bl
        JOIN "Battle" b ON bl."battleId" = b.id
        WHERE bl."userId" = ${userId}
          AND b."collectionId" = ${collectionId}
      `;

      const collectionTotal = collectionSumResult[0]?.total ?? 0;

      await tx.collectionLeaderboard.upsert({
        where: { userId_collectionId: { userId, collectionId } },
        update: { score: collectionTotal },
        create: { userId, collectionId, score: collectionTotal },
      });
    }

    // Update Global Leaderboard
    const globalSumResult = await tx.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(score), 0)::float8 AS total
      FROM "BattleLeaderboard"
      WHERE "userId" = ${userId}
    `;

    const globalTotal = globalSumResult[0]?.total ?? 0;

    await tx.globalLeaderboard.upsert({
      where: { userId },
      update: { score: globalTotal },
      create: { userId, score: globalTotal },
    });

    // Increment submission count & record activity
    await tx.user.update({
      where: { id: userId },
      data: { battleSubmissionCount: { increment: 1 } },
    });

    await recordUserActivity(userId);

    return submission;
  });
};
export const createCollection = async (
  title: string,
  description: string,
  picture: string
) => {
  return await prisma.battleCollection.create({
    data: {
      title,
      description,
      picture,
    },
  });
};
//get all collections
export const getCollections = async (limit = 10) => {
  return await prisma.battleCollection.findMany({
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
};

export const getCollectionById = async (
  collectionId: number,
  user: TokenPayload
) => {
  const collection = await prisma.battleCollection.findUnique({
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

  if (!collection) return null;

  const battles = collection.battles.map((battle) => ({
    id: battle.id,
    battleNo: battle.battleNo,
    title: battle.title,
    description: battle.description,
    target: battle.target,
    size: battle.size,
    hasSubmitted: battle._count.battleSubmissions > 0,
    userHighestScore: battle.battleLeaderboard[0]?.score ?? 0,
    userHighestAccuracy: battle.battleLeaderboard[0]?.accuracy ?? 0,
 
  }));
  // console.log(collection.battles[4].battleLeaderboard)

  const leaderboard = collection.collectionLeaderboard.map((entry) => ({
    score: entry.score,
    user: entry.user,
    me: entry.user.id === user.id,
  }));

  return {
    ...collection,
    battles,
    collectionLeaderboard: leaderboard,
  };
};

//delete collection
export const deleteCollection = async (collectionId: number) => {
  return await prisma.battleCollection.delete({
    where: {
      id: collectionId,
    },
  });
};

//create battle
export const createBattle = async (
  title: string,
  description: string,
  target: string,
  size: number,
  collectionId: number,
  colors: any,
  assets: any,
  battleNo: number,
) => {
  return await prisma.battle.create({
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
};

//delete battle
export const deleteBattle = async (battleId: number) => {
  return await prisma.battle.delete({
    where: {
      id: battleId,
    },
  });
};

// user activity and streak
// export const updateUserStreak = async (
//   tx: Prisma.TransactionClient,
//   userId: string
// ) => {
//   // Compute Dhaka day boundaries
//   const today = startOfDhakaDay();
//   const yesterday = dhakaDateAddDays(today, -1);

//   // 1. Log today's activity for Dhaka timezone
//   await tx.userDailyActivity.upsert({
//     where: {
//       userId_date: { userId, date: today },
//     },
//     create: { userId, date: today },
//     update: {},
//   });

//   // 2. Fetch existing streak
//   const streak = await tx.userStreak.findUnique({
//     where: { userId },
//   });

//   // 3. Already active today → no update needed
//   if (
//     streak?.lastActiveDate &&
//     startOfDhakaDay(streak.lastActiveDate).getTime() === today.getTime()
//   ) {
//     return;
//   }

//   // 4. Calculate new streak
//   let newCurrentStreak = 1;

//   if (streak?.lastActiveDate) {
//     const last = startOfDhakaDay(streak.lastActiveDate);

//     if (last.getTime() === yesterday.getTime()) {
//       newCurrentStreak = streak.currentStreak + 1;
//     }
//   }

//   const newLongestStreak = Math.max(
//     streak?.longestStreak || 0,
//     newCurrentStreak
//   );

//   // 5. Update streak record
//   await tx.userStreak.upsert({
//     where: { userId },
//     update: {
//       currentStreak: newCurrentStreak,
//       longestStreak: newLongestStreak,
//       lastActiveDate: today, // GMT+6 midnight
//     },
//     create: {
//       userId,
//       currentStreak: 1,
//       longestStreak: 1,
//       lastActiveDate: today,
//     },
//   });
// };

export interface GetBattlesFilter {
  cursor?: number; // battleNo cursor
  limit?: number; // default 20
  search?: string; // title search
  collectionId?: number; // filter by collection
  sort?: "newest" | "oldest" | "mostParticipated"; // default: newest
}
export const getBattles = async (
  userId: string,
  filters: GetBattlesFilter = {}
) => {
  const {
    cursor,
    limit = 20,
    search = "",
    collectionId,
    sort = "newest",
  } = filters;

  const searchTerm = search.trim().toLowerCase();

  const battles = await prisma.$queryRaw<
    {
      id: number;
      battleNo: number;
      title: string;
      description: string | null;
      target: string;
      size: any;
      createdAt: Date;
      collectionId: number | null;
      collectionTitle: string | null;
      totalSubmissionCount: number;
      participationCount: number;
      hasSubmitted: boolean;
      userHighestScore: number;
      topScorerName: string | null;
      topScore: number | null;
    }[]
  >`
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
      ${
        searchTerm
          ? Prisma.sql`AND LOWER(b.title) LIKE ${"%" + searchTerm + "%"}`
          : Prisma.empty
      }
      ${
        collectionId
          ? Prisma.sql`AND b."collectionId" = ${collectionId}`
          : Prisma.empty
      }
      ${cursor ? Prisma.sql`AND b."battleNo" > ${cursor}` : Prisma.empty}

    ORDER BY
      ${
        sort === "mostParticipated"
          ? Prisma.sql`unique_users.count DESC, b."battleNo" DESC`
          : sort === "oldest"
          ? Prisma.sql`b."battleNo" ASC`
          : Prisma.sql`b."battleNo" DESC`
      }  -- newest default

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
};

export const CssService = {
  CompareCss,
  CompareCssV2,
  getBattleByNo,
  createSubmission,
  createCollection,
  getCollections,
  getCollectionById,
  createBattle,
  deleteCollection,
  deleteBattle,
  getBattles,
};
