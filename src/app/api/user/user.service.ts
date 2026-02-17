import { prisma } from "../../config/db";
import AppError from "../../helpers/app-error";
import {
  getUserHeatmap,
  getUserStreak,
} from "../daily-streak/daily-streak.service";
import httpStatus from "http-status-codes";

export const getAllUser = async () => {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      id: true,
      role: true,
      status: true,
    },
  });
  return { users };
};

export const getMe = async (userId: string) => {
  const profile = await prisma.user.findFirst({
    where: {
      id: userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      username: true,
      picture: true,
      email: true,
      role: true,

      globalLeaderboard: {
        select: {
          score: true,
        },
      },

      jsLeaderboard: {
        select: {
          totalPoints: true,
        },
      },
    },
  });

  if (!profile) return null;

  const streak = await getUserStreak(userId);

  return {
    userId: profile.id,
    name: profile.name,
    username: profile.username,
    picture: profile.picture,
    email: profile.email,
    role: profile.role,

    streak: {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      lastActivity: streak.lastActivity,
      onFire: streak.currentStreak >= 7,
    },

    css: {
      score: Number(profile.globalLeaderboard?.score ?? 0),
    },

    js: {
      score: Number(profile.jsLeaderboard?.[0]?.totalPoints ?? 0),
    },
  };
};

export const getUserProfileInfo = async (userId: string) => {
  // Get user's current scores first
  const [userCssScore, userJsScore] = await Promise.all([
    prisma.globalLeaderboard.findUnique({
      where: { userId },
      select: { score: true },
    }),
    prisma.jsGlobalLeaderboard.findUnique({
      where: { userId },
      select: { totalPoints: true },
    }),
  ]);

  const [
    cssSolvedCount,
    cssTotalSubmissions,
    cssRecentSubmissions,
    totalBattles,
    cssGlobalRank,
    jsGlobalRank,
    userInfo,
  ] = await Promise.all([
    prisma.battleSubmission.count({
      where: {
        userId,
        highScore: { not: null },
      },
    }),

    prisma.user.findFirst({
      where: { id: userId },
      select: {
        battleSubmissionCount: true,
      },
    }),

    prisma.battleSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        battle: {
          select: {
            title: true,
            battleNo: true,
          },
        },
        highScore: true,
        accuracy: true,
        createdAt: true,
      },
    }),

    prisma.battle.count(),

    // CSS Global Rank
    userCssScore
      ? prisma.globalLeaderboard
          .count({
            where: {
              score: { gt: userCssScore.score },
            },
          })
          .then((count) => count + 1)
      : null,

    // JS Global Rank
    userJsScore
      ? prisma.jsGlobalLeaderboard
          .count({
            where: {
              totalPoints: { gt: userJsScore.totalPoints },
            },
          })
          .then((count) => count + 1)
      : null,

    prisma.user.findFirst({
      where: { id: userId },
      select: {
        bio: true,
        github: true,
        twitter: true,
        linkedin: true,
        website: true,
        facebook: true,
        instagram: true,
        discord: true,
        youtube: true,
        profession: true,
        company: true,
        skills: true,
        interests: true,
        location: true,
      },
    }),
  ]);

  /* ================= JAVASCRIPT SUBMISSIONS ================= */

  const jsSubmissions = await prisma.submission.findMany({
    where: { userId },
    include: {
      problem: {
        select: {
          id: true,
          difficulty: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  /* ================= UNIQUE SOLVED PROBLEMS ================= */

  const solvedProblemMap = new Map<number, (typeof jsSubmissions)[0]>();

  jsSubmissions.forEach((sub) => {
    if (sub.status === "Accepted") {
      solvedProblemMap.set(sub.problem.id, sub);
    }
  });

  const solvedProblems = Array.from(solvedProblemMap.values());

  /* ================= DIFFICULTY COUNTS ================= */

  const solvedByDifficulty = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
  };

  solvedProblems.forEach((sub) => {
    solvedByDifficulty[sub.problem.difficulty]++;
  });

  const totalSolved = solvedProblems.length;

  /* ================= TOTAL PROBLEMS ================= */

  const [totalProblems, totalEasy, totalMedium, totalHard, totalRatings] =
    await Promise.all([
      prisma.problem.count({ where: { isPublish: true } }),
      prisma.problem.count({ where: { isPublish: true, difficulty: "EASY" } }),
      prisma.problem.count({
        where: { isPublish: true, difficulty: "MEDIUM" },
      }),
      prisma.problem.count({ where: { isPublish: true, difficulty: "HARD" } }),
      prisma.problem.aggregate({
        where: { isPublish: true },
        _sum: { rating: true },
      }),
    ]);

  const unsolvedCount = totalProblems - totalSolved;

  /* ================= RECENT JS SUBMISSIONS ================= */

  const jsRecentSubmissions = await prisma.submission.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 10,
    select: {
      problem: {
        select: {
          title: true,
          slug: true,
          difficulty: true,
        },
      },
      points: true,
      status: true,
      date: true,
    },
  });

  /* ================= BADGES ================= */

  const earnedBadges = await prisma.jsSeriesBadge.findMany({
    where: {
      jsSeries: {
        userProgress: {
          some: { userId },
        },
      },
    },
    select: {
      title: true,
      badgeUrl: true,
      seriesId: true,
    },
  });

  /* ================= HEATMAP ================= */

  const heatmap = await getUserHeatmap(userId);

  /* ================= RESPONSE ================= */

  return {
    info: userInfo,
    css: {
      totalSolved: cssSolvedCount,
      totalSubmissions: cssTotalSubmissions?.battleSubmissionCount || 0,
      totalBattles,
      globalRank: cssGlobalRank,
      recentSubmissions: cssRecentSubmissions,
    },

    javascript: {
      totalSolved,
      easySolved: solvedByDifficulty.EASY,
      mediumSolved: solvedByDifficulty.MEDIUM,
      hardSolved: solvedByDifficulty.HARD,

      totalProblems,
      totalEasy,
      totalMedium,
      totalHard,
      totalRatings: totalRatings._sum.rating,

      unsolved: unsolvedCount,
      globalRank: jsGlobalRank,
      recentSubmissions: jsRecentSubmissions,
    },

    badges: earnedBadges,
    heatmap,
  };
};

export const getUserAdditionalInfo = async (userId: string) => {
  return prisma.user.findFirst({
    where: { id: userId },
    select: {
      bio: true,
      github: true,
      twitter: true,
      linkedin: true,
      website: true,
      facebook: true,
      instagram: true,
      discord: true,
      youtube: true,
      profession: true,
      company: true,
      skills: true,
      interests: true,
      location: true,
    },
  });
};

export const updateUser = async (userId: string, userData) => {
  return prisma.user.update({
    where: { id: userId },
    data: userData,
  });
};

//update username
export const updateUsername = async (userId: string, username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (user) {
    throw new AppError(httpStatus.CONFLICT, "Username already exists");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { username },
  });
};

export const UserServices = {
  getMe,
  getAllUser,
  getUserProfileInfo,
  getUserAdditionalInfo,
  updateUser,
  updateUsername,
};
