import { ProblemCollectionType } from "../../../generated/prisma/enums";
import { prisma } from "../../config/db";

export const createProblem = async (payload: any, userId: string) => {
  const {
    title,
    serial,
    difficulty,
    unique_title,
    slug,
    isPublish,
    collectionType,
    problemType,
    rating,
    content,
    tags = [],
    seriesId,
    category,
    seriesProblemOrder,
  } = payload;

  // console.log(payload)

  // Extract nested content properties
  const {
    description,
    bn_description,
    defaultCode,
    func,
    testcasesJson,
    hintsJson,
    readOnlyLines,
    companiesJson,
  } = content?.create || {};

  const problem = await prisma.problem.create({
    data: {
      title,
      slug,
      unique_title,
      difficulty,
      serial,
      userId,
      isPublish,
      collectionType,
      problemType,
      rating,

      content: {
        create: {
          description,
          bn_description,
          defaultCode,
          func,
          testcasesJson,
          hintsJson,
          companiesJson,
          readOnlyLines,
        },
      },

      ...(tags &&
        tags.length > 0 && {
          tags: {
            create: tags.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            })),
          },
        }),
    },
  });

  console.log("=> Problem created on problem Table!")

  if (problem) {
    // If part of a series, create the JS Series Problem entry
    if (collectionType === "SERIES" && seriesId) {
      await prisma.jsSeriesProblem.create({
        data: {
          seriesId,
          problemId: problem.id,
          category,
          order: seriesProblemOrder,
        },
      });
    }
  }

  console.log("----=> Problem created!")

  return problem
};

// services/problemService.ts
export const getProblems = async (query: any, userId?: string) => {
  const {
    page = 1,
    limit = 20,
    search,
    difficulty,
    tagIds,
    status,
    sortBy = "serial",
    sortOrder = "asc",
  } = query;

  const skip = (page - 1) * limit;
  const take = Number(limit);

  const where: any = {
    isPublish: true,
  };

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  if (difficulty) {
    where.difficulty = difficulty.toUpperCase();
  }

  if (tagIds?.length) {
    where.tags = {
      some: {
        tagId: { in: tagIds.map(Number) },
      },
    };
  }

  // User-specific status filters (for filtering the list)
  if (status && userId) {
    if (status === "solved") {
      where.submissions = {
        some: { userId, status: "Accepted" },
      };
    } else if (status === "attempted") {
      where.submissions = {
        some: { userId },
        none: { userId, status: "Accepted" },
      };
    } else if (status === "unsolved") {
      where.submissions = {
        none: { userId, status: "Accepted" },
      };
    }
  }

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        serial: true,

        tags: {
          select: {
            tag: { select: { id: true, name: true } },
          },
        },

        // Fetch user's submission if userId provided
        ...(userId
          ? {
              submissions: {
                where: { userId },
                select: { status: true },
                // Only one submission per user/problem due to unique constraint
                take: 1,
              },
            }
          : {}),
      },
    }),
    prisma.problem.count({ where }),
  ]);

  // Aggregates: total attempted & solved per problem
  const problemIds = problems.map((p) => p.id);

  const totalAttempted = new Map<number, number>();
  const totalSolved = new Map<number, number>();

  if (problemIds.length > 0) {
    const [attempts, solved] = await Promise.all([
      prisma.submission.groupBy({
        by: ["problemId"],
        where: { problemId: { in: problemIds } },
        _count: { id: true },
      }),
      prisma.submission.groupBy({
        by: ["problemId"],
        where: {
          problemId: { in: problemIds },
          status: "Accepted",
        },
        _count: { id: true },
      }),
    ]);

    attempts.forEach((g) => totalAttempted.set(g.problemId, g._count.id));
    solved.forEach((g) => totalSolved.set(g.problemId, g._count.id));
  }

  // Format results with new flags
  const formatted = problems.map((p) => {
    const attempts = totalAttempted.get(p.id) ?? 0;
    const solved = totalSolved.get(p.id) ?? 0;
    const accuracy = attempts === 0 ? 0 : Math.round((solved / attempts) * 100);

    // User-specific flags
    const userSubmission = userId ? p.submissions?.[0] : null;

    const isUserSolved = userSubmission?.status === "Accepted";
    const hasUserSubmission = !!userSubmission;
    const isUserAttempted = hasUserSubmission && !isUserSolved;

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      serial: p.serial,
      difficulty: p.difficulty,
      totalAttempted: attempts,
      totalSolved: solved,
      accuracy,
      isUserSolved: !!isUserSolved,
      isUserAttempted, // ← New property
      tags: p.tags.map((t) => t.tag),
    };
  });

  return {
    data: formatted,
    meta: {
      page: Number(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getProblemBySlug = async (slug: string, userId: string) => {
  const problem = await prisma.problem.findUnique({
    where: { slug },

    include: {
      content: true,
      tags: {
        select: {
          tag: true,
        },
      },
      author: {
        select: { id: true, name: true, picture: true },
      },

      editorials: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },

      solutions: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },

      // 🔥 Only current user's submission
      submissions: {
        where: { userId },
        select: {
          status: true,
          language: true,
          runtime: true,
          memory: true,
          percentage: true,
          date: true,
          totalPassed: true,
          code: true,
          totaltc: true,
          tc: true,
          points: true,
        },
      },

      jsSeriesProblems: {
        select: {
          seriesId: true,
        },
      },
    },
  });

  if (!problem) return null;

  // ----------------------------
  // Determine user problem status
  // ----------------------------

  let userStatus: "solved" | "attempted" | "unsolved" = "unsolved";
  let submission: any = null;

  if (problem.submissions.length > 0) {
    submission = problem.submissions[0];

    userStatus = submission.status === "ACCEPTED" ? "solved" : "attempted";
  }

  // Remove submissions array (not needed anymore)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { submissions, ...problemData } = problem;

  return {
    problem: problemData,
    userStatus,
    submission,
  };
};

export const getSubmissionByProblemId = async (
  problemId: number,
  userId: string
) => {
  const submission = await prisma.submission.findFirst({
    where: {
      problemId,
      userId,
    },
    select: {
      status: true,
      language: true,
      runtime: true,
      memory: true,
      percentage: true,
      date: true,
    },
  });

  return submission;
};

// create submission
export const createSubmission = async (
  payload: any,
  problemCollectionType: ProblemCollectionType,
  seriesId: number
) => {
  const {
    problemId,
    userId,
    status,
    language,
    runtime,
    memory,
    percentage = 0,
    code,
    totaltc,
    totalPassed,
    tc,
    problemRating = 0,
  } = payload;

  // Calculate points for this specific problem submission
  const earnedPoints = (percentage / 100) * problemRating;

  return prisma.$transaction(async (tx) => {
    // 1. Check previous solve status for solvedCount logic
    const previousSubmission = await tx.submission.findUnique({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      select: {
        percentage: true,
      },
    });

    const wasFullySolved = previousSubmission?.percentage === 100;
    const isFullySolvedNow = percentage === 100;

    // 2. Upsert the current submission
    const submission = await tx.submission.upsert({
      where: {
        userId_problemId: {
          problemId,
          userId,
        },
      },
      update: {
        status,
        language,
        runtime,
        memory,
        percentage,
        code,
        totalPassed,
        totaltc,
        tc,
        points: earnedPoints,
        submissionCount: { increment: 1 },
        date: new Date(),
      },
      create: {
        problemId,
        userId,
        status,
        language,
        runtime,
        memory,
        percentage,
        code,
        totalPassed,
        totaltc,
        tc,
        points: earnedPoints,
        submissionCount: 1,
      },
    });

    // 3. Recalculate totalPoints by summing ALL current submission points
    const allSubmissionsPoints = await tx.submission.aggregate({
      where: {
        userId,
      },
      _sum: {
        points: true,
      },
    });

    const newTotalPoints = allSubmissionsPoints._sum.points ?? 0;

    // 4. Update solvedCount only if newly achieving 100%
    const shouldIncrementSolved = isFullySolvedNow && !wasFullySolved;

    await tx.jsGlobalLeaderboard.upsert({
      where: { userId },
      update: {
        totalPoints: newTotalPoints,
        ...(shouldIncrementSolved && {
          solvedCount: { increment: 1 },
        }),
        updatedAt: new Date(),
      },
      create: {
        userId,
        totalPoints: newTotalPoints,
        solvedCount: isFullySolvedNow ? 1 : 0,
      },
    });

    // 5. Update UserSeriesProblemProgress
    if (problemCollectionType === "SERIES") {
      await tx.userSeriesProblemProgress.upsert({
        where: {
          userId_seriesId_problemId: {
            userId,
            seriesId,
            problemId,
          },
        },
        update: {
          isCompleted: isFullySolvedNow,
          completedAt: isFullySolvedNow ? new Date() : undefined,
        },
        create: {
          userId,
          seriesId,
          problemId,
          isCompleted: isFullySolvedNow,
          completedAt: isFullySolvedNow ? new Date() : undefined,
        },
      });
    }

    // 6. Update userSeriesProgress
    if (problemCollectionType === "SERIES") {
      await tx.userSeriesProgress.upsert({
        where: {
          userId_seriesId: {
            userId,
            seriesId,
          },
        },
        update: {
          solvedCount: {
            increment: isFullySolvedNow ? 1 : wasFullySolved ? -1 : 0,
          },
          lastSolvedAt: new Date(),
        },
        create: {
          userId,
          seriesId,
          solvedCount: 1,
          lastSolvedAt: new Date(),
        },
      });
    }

    return submission;
  });
};
export const getJsGlobalLeaderboard = async ({
  page = 1,
  limit = 10,
  currentUserId,
  sortBy = "rating", // 'rating' | 'totalPoints' | 'solvedCount'
}: {
  page?: number;
  limit?: number;
  currentUserId?: string;
  sortBy?: "rating" | "totalPoints" | "solvedCount";
} = {}) => {
  // Validate inputs
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Optional: prevent overly large requests

  const offset = (page - 1) * limit;

  // Allowed sort fields for security
  const validSortFields = ["rating", "totalPoints", "solvedCount"] as const;
  const sortField = validSortFields.includes(sortBy) ? sortBy : "rating";

  // Fetch leaderboard entries with user info
  const leaderboard = await prisma.jsGlobalLeaderboard.findMany({
    skip: offset,
    take: limit,
    orderBy: [
      { [sortField]: "desc" },
      { updatedAt: "desc" }, // Tiebreaker: more recently active
    ],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          picture: true,
        },
      },
    },
  });

  // Get total count for pagination metadata
  const totalCount = await prisma.jsGlobalLeaderboard.count();

  const totalPages = Math.ceil(totalCount / limit);

  // Find current user's rank and data (if provided)
  let currentUserRank: number | null = null;
  let currentUserEntry: any = null;

  if (currentUserId) {
    // Get the user's position by counting how many have higher score
    // const betterUsersCount = await prisma.jsGlobalLeaderboard.count({
    //   where: {
    //     [sortField]: {
    //       gt: leaderboard[0]?.[sortField] ?? 0, // fallback if empty
    //     },
    //   },
    // });

    // Now find exact rank including ties
    const usersWithHigherOrEqual = await prisma.jsGlobalLeaderboard.findMany({
      where: {
        [sortField]: {
          gte: leaderboard[0]?.[sortField] ?? 0,
        },
      },
      orderBy: { [sortField]: "desc" },
      select: { userId: true },
    });

    const rankIndex = usersWithHigherOrEqual.findIndex(
      (entry) => entry.userId === currentUserId
    );

    currentUserRank = rankIndex !== -1 ? rankIndex + 1 : null;

    // Fetch current user's full entry (even if not on current page)
    if (currentUserRank !== null) {
      currentUserEntry = await prisma.jsGlobalLeaderboard.findUnique({
        where: { userId: currentUserId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
        },
      });
    }
  }

  return {
    leaderboard, // Array of top users on this page
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    currentUser: currentUserId
      ? {
          rank: currentUserRank,
          entry: currentUserEntry,
        }
      : null,
    sortBy,
  };
};

export const ProblemServices = {
  createProblem,
  getProblems,
  getProblemBySlug,
  getSubmissionByProblemId,
  getJsGlobalLeaderboard,
};
