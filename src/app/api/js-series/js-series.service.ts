import { prisma } from "../../config/db";

// ====================
// Get All Series (with optional user progress)
// ====================
export const getJsSeriesList = async (userId?: string) => {
  return await prisma.jsSeries.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      picture: true,
      createdAt: true,
      updatedAt: true,

      // Total problems in series
      _count: {
        select: { jsSeriesProblems: true },
      },

      // User-specific progress (if logged in)
      userProgress: userId
        ? {
            where: { userId },
            select: {
              solvedCount: true,
              lastSolvedAt: true,
            },
          }
        : false,
    },
    orderBy: { createdAt: "desc" }, // or { title: "asc" }
  });
};

export const getJsSeriesNameAndId = async () => {
  const [series, problemSerials] = await Promise.all([
    await prisma.jsSeries.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    await prisma.problem.findMany({
      select: {
        serial: true,
      },
      orderBy: {
        serial: "desc",
      },
    }),
  ]);

  return { series, problemSerials };
};

// ====================
// Get Single Series by ID (with problems + user progress)
// ====================
export const getJsSeriesById = async (seriesId: number, userId?: string) => {
  const series = await prisma.jsSeries.findUnique({
    where: { id: seriesId },
    select: {
      id: true,
      title: true,
      description: true,
      picture: true,
      createdAt: true,
      updatedAt: true,

      jsSeriesProblems: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              unique_title: true,
              difficulty: true,
              serial: true,
              timeLimit: true,
              // Add more fields if needed on frontend
            },
          },
        },
      },

      _count: {
        select: { jsSeriesProblems: true },
      },

      // Fast user progress summary
      userProgress: userId
        ? {
            where: { userId },
            select: {
              solvedCount: true,
              lastSolvedAt: true,
            },
          }
        : false,

      // Optional: badges
      jsSeriesBadges: {
        select: {
          id: true,
          badgeUrl: true,
        },
      },
    },
  });

  if (!series) {
    throw new Error("Series not found");
  }

  // Transform for cleaner frontend response
  const problems = series.jsSeriesProblems.map((sp) => ({
    order: sp.order,
    ...sp.problem,
  }));

  const userProgress = series.userProgress[0] ?? null;

  return {
    ...series,
    problems,
    totalProblems: series._count.jsSeriesProblems,
    userProgress,
    badges: series.jsSeriesBadges,
  };
};

export const getJsSingleSeriesByIdAndCategories = async (
  seriesId: number,
  userId?: string
) => {
  // 1. Fetch all problems in the series
  const seriesProblems = await prisma.jsSeriesProblem.findMany({
    where: { seriesId },
    orderBy: { order: "asc" },
    select: {
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          unique_title: true,
          difficulty: true,
          serial: true,
          timeLimit: true,
          rating: true,
        },
      },
      category: true,
    },
  });

  if (seriesProblems.length === 0) {
    throw new Error("No problems found in this series");
  }

  const problemIds = seriesProblems.map((sp) => sp.problem.id);

  // 2. Fetch ALL progress records for this user + series + problems
  // (We need both completed and incomplete to distinguish "attempted but unsolved")
  const progressMap = new Map<
    number, // problemId
    { isCompleted: boolean }
  >();

  if (userId && problemIds.length > 0) {
    const progressRecords = await prisma.userSeriesProblemProgress.findMany({
      where: {
        userId,
        seriesId,
        problemId: { in: problemIds },
      },
      select: {
        problemId: true,
        isCompleted: true,
      },
    });

    progressRecords.forEach((record) => {
      progressMap.set(record.problemId, {
        isCompleted: record.isCompleted,
      });
    });
  }

  // 3. Enrich problems with correct status flags
  const enrichedProblems = seriesProblems.map((sp) => {
    const progress = progressMap.get(sp.problem.id);

    const isSolved = progress?.isCompleted === true;
    const isAttempted =
      progress !== undefined && progress.isCompleted === false;
    // Not attempted: progress === undefined

    return {
      id: sp.problem.id,
      title: sp.problem.title,
      slug: sp.problem.slug,
      unique_title: sp.problem.unique_title,
      difficulty: sp.problem.difficulty,
      serial: sp.problem.serial,
      timeLimit: sp.problem.timeLimit,
      rating: sp.problem.rating,

      isSolved,
      isAttempted, // ← Exactly: has progress record but not completed

      category: sp.category ?? null,
    };
  });

  // 4. Count solved & attempted per category
  const solvedCountByCategory = new Map<string, number>();
  const attemptedCountByCategory = new Map<string, number>();

  enrichedProblems.forEach((problem) => {
    const categoryKey = problem.category ?? "UNCATEGORIZED";

    if (problem.isSolved) {
      solvedCountByCategory.set(
        categoryKey,
        (solvedCountByCategory.get(categoryKey) || 0) + 1
      );
    }

    if (problem.isAttempted) {
      attemptedCountByCategory.set(
        categoryKey,
        (attemptedCountByCategory.get(categoryKey) || 0) + 1
      );
    }
  });

  // 5. Group problems by category
  const problemsByCategoryMap = new Map<string, typeof enrichedProblems>();

  enrichedProblems.forEach((problem) => {
    const categoryKey = problem.category ?? "UNCATEGORIZED";

    const existing = problemsByCategoryMap.get(categoryKey);
    if (existing) {
      existing.push(problem);
    } else {
      problemsByCategoryMap.set(categoryKey, [problem]);
    }
  });

  // 6. Final grouped structure
  const problemsGroupedByCategory = Array.from(problemsByCategoryMap.entries())
    .map(([categoryKey, problems]) => {
      const userSolvedCount = solvedCountByCategory.get(categoryKey) || 0;
      const userAttemptedCount = attemptedCountByCategory.get(categoryKey) || 0;

      return {
        category: categoryKey,
        displayName:
          categoryKey === "UNCATEGORIZED"
            ? "Uncategorized"
            : categoryKey.charAt(0).toUpperCase() +
              categoryKey.slice(1).toLowerCase(),
        count: problems.length,
        userSolvedCount,
        userAttemptedCount,
        solvedPercentage:
          problems.length > 0
            ? Math.round((userSolvedCount / problems.length) * 100)
            : 0,
        attemptedPercentage:
          problems.length > 0
            ? Math.round(
                ((userSolvedCount + userAttemptedCount) / problems.length) * 100
              )
            : 0,
        problems,
      };
    })
    .sort((a, b) => b.count - a.count); // or sort by progress, etc.

  // 7. Fetch series metadata
  const series = await prisma.jsSeries.findUnique({
    where: { id: seriesId },
    select: {
      id: true,
      title: true,
      description: true,
      picture: true,
      createdAt: true,
      updatedAt: true,

      _count: { select: { jsSeriesProblems: true } },

      userProgress: userId
        ? {
            where: { userId },
            select: {
              solvedCount: true,
              lastSolvedAt: true,
            },
          }
        : false,

      jsSeriesBadges: {
        select: { id: true, badgeUrl: true },
      },
    },
  });

  if (!series) throw new Error("Series not found");

  return {
    id: series.id,
    title: series.title,
    description: series.description,
    picture: series.picture,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,

    totalProblems: series._count.jsSeriesProblems,
    userProgress: series.userProgress?.[0] ?? null,
    badges: series.jsSeriesBadges,

    problemsGroupedByCategory,
    // problems: enrichedProblems,
  };
};
// ====================
// Create New Series
// ====================
interface CreateJsSeriesInput {
  title: string;
  description?: string | null;
  picture?: string | null;
}

export const createJsSeries = async (data: CreateJsSeriesInput) => {
  return await prisma.jsSeries.create({
    data,
    select: {
      id: true,
      title: true,
      description: true,
      picture: true,
      createdAt: true,
    },
  });
};

// ====================
// Update Series
// ====================
interface UpdateJsSeriesInput {
  title?: string;
  description?: string | null;
  picture?: string | null;
}

export const updateJsSeries = async (id: number, data: UpdateJsSeriesInput) => {
  return await prisma.jsSeries.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      description: true,
      picture: true,
      updatedAt: true,
    },
  });
};

// ====================
// Delete Series (cascades to problems & progress)
// ====================
export const deleteJsSeries = async (id: number) => {
  return await prisma.jsSeries.delete({
    where: { id },
  });
};

// ====================
// Add Problem to Series
// ====================
interface AddProblemToSeriesInput {
  seriesId: number;
  problemId: number;
  order: number;
}

export const addProblemToSeries = async ({
  seriesId,
  problemId,
  order,
}: AddProblemToSeriesInput) => {
  return await prisma.jsSeriesProblem.create({
    data: {
      seriesId,
      problemId,
      order,
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
        },
      },
    },
  });
};

// ====================
// Remove Problem from Series
// ====================
export const removeProblemFromSeries = async (
  seriesId: number,
  problemId: number
) => {
  return await prisma.jsSeriesProblem.delete({
    where: {
      seriesId_problemId: { seriesId, problemId }, // composite unique from @@unique([seriesId, problemId])
    },
  });
};

// ====================
// Reorder Problems in Series (bulk update)
// ====================
interface ReorderProblemsInput {
  seriesId: number;
  orderedProblemIds: number[]; // array of problemIds in new order
}

export const reorderProblemsInSeries = async ({
  seriesId,
  orderedProblemIds,
}: ReorderProblemsInput) => {
  const updates = orderedProblemIds.map((problemId, index) =>
    prisma.jsSeriesProblem.update({
      where: { seriesId_problemId: { seriesId, problemId } },
      data: { order: index + 1 }, // or index if zero-based
    })
  );

  return await prisma.$transaction(updates);
};

export const jsSeriesService = {
  getJsSeriesList,
  getJsSeriesNameAndId,
  getJsSeriesById,
  getJsSingleSeriesByIdAndCategories,
  createJsSeries,
  updateJsSeries,
  deleteJsSeries,
  addProblemToSeries,
  removeProblemFromSeries,
  reorderProblemsInSeries,
};
