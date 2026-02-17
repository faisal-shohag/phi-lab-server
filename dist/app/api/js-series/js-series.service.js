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
exports.jsSeriesService = exports.reorderProblemsInSeries = exports.removeProblemFromSeries = exports.addProblemToSeries = exports.deleteJsSeries = exports.updateJsSeries = exports.createJsSeries = exports.getJsSingleSeriesByIdAndCategories = exports.getJsSeriesById = exports.getJsSeriesNameAndId = exports.getJsSeriesList = void 0;
const db_1 = require("../../config/db");
// ====================
// Get All Series (with optional user progress)
// ====================
const getJsSeriesList = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.jsSeries.findMany({
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
});
exports.getJsSeriesList = getJsSeriesList;
const getJsSeriesNameAndId = () => __awaiter(void 0, void 0, void 0, function* () {
    const [series, problemSerials] = yield Promise.all([
        yield db_1.prisma.jsSeries.findMany({
            select: {
                id: true,
                title: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        yield db_1.prisma.problem.findMany({
            select: {
                serial: true,
            },
            orderBy: {
                serial: "desc",
            },
        }),
    ]);
    return { series, problemSerials };
});
exports.getJsSeriesNameAndId = getJsSeriesNameAndId;
// ====================
// Get Single Series by ID (with problems + user progress)
// ====================
const getJsSeriesById = (seriesId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const series = yield db_1.prisma.jsSeries.findUnique({
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
    const problems = series.jsSeriesProblems.map((sp) => (Object.assign({ order: sp.order }, sp.problem)));
    const userProgress = (_a = series.userProgress[0]) !== null && _a !== void 0 ? _a : null;
    return Object.assign(Object.assign({}, series), { problems, totalProblems: series._count.jsSeriesProblems, userProgress, badges: series.jsSeriesBadges });
});
exports.getJsSeriesById = getJsSeriesById;
const getJsSingleSeriesByIdAndCategories = (seriesId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // 1. Fetch all problems in the series
    const seriesProblems = yield db_1.prisma.jsSeriesProblem.findMany({
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
    const progressMap = new Map();
    if (userId && problemIds.length > 0) {
        const progressRecords = yield db_1.prisma.userSeriesProblemProgress.findMany({
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
        var _a;
        const progress = progressMap.get(sp.problem.id);
        const isSolved = (progress === null || progress === void 0 ? void 0 : progress.isCompleted) === true;
        const isAttempted = progress !== undefined && progress.isCompleted === false;
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
            category: (_a = sp.category) !== null && _a !== void 0 ? _a : null,
        };
    });
    // 4. Count solved & attempted per category
    const solvedCountByCategory = new Map();
    const attemptedCountByCategory = new Map();
    enrichedProblems.forEach((problem) => {
        var _a;
        const categoryKey = (_a = problem.category) !== null && _a !== void 0 ? _a : "UNCATEGORIZED";
        if (problem.isSolved) {
            solvedCountByCategory.set(categoryKey, (solvedCountByCategory.get(categoryKey) || 0) + 1);
        }
        if (problem.isAttempted) {
            attemptedCountByCategory.set(categoryKey, (attemptedCountByCategory.get(categoryKey) || 0) + 1);
        }
    });
    // 5. Group problems by category
    const problemsByCategoryMap = new Map();
    enrichedProblems.forEach((problem) => {
        var _a;
        const categoryKey = (_a = problem.category) !== null && _a !== void 0 ? _a : "UNCATEGORIZED";
        const existing = problemsByCategoryMap.get(categoryKey);
        if (existing) {
            existing.push(problem);
        }
        else {
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
            displayName: categoryKey === "UNCATEGORIZED"
                ? "Uncategorized"
                : categoryKey.charAt(0).toUpperCase() +
                    categoryKey.slice(1).toLowerCase(),
            count: problems.length,
            userSolvedCount,
            userAttemptedCount,
            solvedPercentage: problems.length > 0
                ? Math.round((userSolvedCount / problems.length) * 100)
                : 0,
            attemptedPercentage: problems.length > 0
                ? Math.round(((userSolvedCount + userAttemptedCount) / problems.length) * 100)
                : 0,
            problems,
        };
    })
        .sort((a, b) => b.count - a.count); // or sort by progress, etc.
    // 7. Fetch series metadata
    const series = yield db_1.prisma.jsSeries.findUnique({
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
    if (!series)
        throw new Error("Series not found");
    return {
        id: series.id,
        title: series.title,
        description: series.description,
        picture: series.picture,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
        totalProblems: series._count.jsSeriesProblems,
        userProgress: (_b = (_a = series.userProgress) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null,
        badges: series.jsSeriesBadges,
        problemsGroupedByCategory,
        // problems: enrichedProblems,
    };
});
exports.getJsSingleSeriesByIdAndCategories = getJsSingleSeriesByIdAndCategories;
const createJsSeries = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.jsSeries.create({
        data,
        select: {
            id: true,
            title: true,
            description: true,
            picture: true,
            createdAt: true,
        },
    });
});
exports.createJsSeries = createJsSeries;
const updateJsSeries = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.jsSeries.update({
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
});
exports.updateJsSeries = updateJsSeries;
// ====================
// Delete Series (cascades to problems & progress)
// ====================
const deleteJsSeries = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.jsSeries.delete({
        where: { id },
    });
});
exports.deleteJsSeries = deleteJsSeries;
const addProblemToSeries = (_a) => __awaiter(void 0, [_a], void 0, function* ({ seriesId, problemId, order, }) {
    return yield db_1.prisma.jsSeriesProblem.create({
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
});
exports.addProblemToSeries = addProblemToSeries;
// ====================
// Remove Problem from Series
// ====================
const removeProblemFromSeries = (seriesId, problemId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.jsSeriesProblem.delete({
        where: {
            seriesId_problemId: { seriesId, problemId }, // composite unique from @@unique([seriesId, problemId])
        },
    });
});
exports.removeProblemFromSeries = removeProblemFromSeries;
const reorderProblemsInSeries = (_a) => __awaiter(void 0, [_a], void 0, function* ({ seriesId, orderedProblemIds, }) {
    const updates = orderedProblemIds.map((problemId, index) => db_1.prisma.jsSeriesProblem.update({
        where: { seriesId_problemId: { seriesId, problemId } },
        data: { order: index + 1 }, // or index if zero-based
    }));
    return yield db_1.prisma.$transaction(updates);
});
exports.reorderProblemsInSeries = reorderProblemsInSeries;
exports.jsSeriesService = {
    getJsSeriesList: exports.getJsSeriesList,
    getJsSeriesNameAndId: exports.getJsSeriesNameAndId,
    getJsSeriesById: exports.getJsSeriesById,
    getJsSingleSeriesByIdAndCategories: exports.getJsSingleSeriesByIdAndCategories,
    createJsSeries: exports.createJsSeries,
    updateJsSeries: exports.updateJsSeries,
    deleteJsSeries: exports.deleteJsSeries,
    addProblemToSeries: exports.addProblemToSeries,
    removeProblemFromSeries: exports.removeProblemFromSeries,
    reorderProblemsInSeries: exports.reorderProblemsInSeries,
};
