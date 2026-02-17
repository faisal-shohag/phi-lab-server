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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemServices = exports.getJsGlobalLeaderboard = exports.createSubmission = exports.getSubmissionByProblemId = exports.getProblemBySlug = exports.getProblems = exports.createProblem = void 0;
const db_1 = require("../../config/db");
const createProblem = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, serial, difficulty, unique_title, slug, isPublish, collectionType, problemType, rating, content, tags = [], seriesId, category, seriesProblemOrder, } = payload;
    // console.log(payload)
    // Extract nested content properties
    const { description, bn_description, defaultCode, func, testcasesJson, hintsJson, readOnlyLines, companiesJson, } = (content === null || content === void 0 ? void 0 : content.create) || {};
    const problem = yield db_1.prisma.problem.create({
        data: Object.assign({ title,
            slug,
            unique_title,
            difficulty,
            serial,
            userId,
            isPublish,
            collectionType,
            problemType,
            rating, content: {
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
            } }, (tags &&
            tags.length > 0 && {
            tags: {
                create: tags.map((tagName) => ({
                    tag: {
                        connectOrCreate: {
                            where: { name: tagName },
                            create: { name: tagName },
                        },
                    },
                })),
            },
        })),
    });
    console.log("=> Problem created on problem Table!");
    if (problem) {
        // If part of a series, create the JS Series Problem entry
        if (collectionType === "SERIES" && seriesId) {
            yield db_1.prisma.jsSeriesProblem.create({
                data: {
                    seriesId,
                    problemId: problem.id,
                    category,
                    order: seriesProblemOrder,
                },
            });
        }
    }
    console.log("----=> Problem created!");
    return problem;
});
exports.createProblem = createProblem;
// services/problemService.ts
const getProblems = (query, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 20, search, difficulty, tagIds, status, sortBy = "serial", sortOrder = "asc", } = query;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    const where = {
        isPublish: true,
    };
    if (search) {
        where.title = { contains: search, mode: "insensitive" };
    }
    if (difficulty) {
        where.difficulty = difficulty.toUpperCase();
    }
    if (tagIds === null || tagIds === void 0 ? void 0 : tagIds.length) {
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
        }
        else if (status === "attempted") {
            where.submissions = {
                some: { userId },
                none: { userId, status: "Accepted" },
            };
        }
        else if (status === "unsolved") {
            where.submissions = {
                none: { userId, status: "Accepted" },
            };
        }
    }
    const [problems, total] = yield Promise.all([
        db_1.prisma.problem.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
            select: Object.assign({ id: true, title: true, slug: true, difficulty: true, serial: true, tags: {
                    select: {
                        tag: { select: { id: true, name: true } },
                    },
                } }, (userId
                ? {
                    submissions: {
                        where: { userId },
                        select: { status: true },
                        // Only one submission per user/problem due to unique constraint
                        take: 1,
                    },
                }
                : {})),
        }),
        db_1.prisma.problem.count({ where }),
    ]);
    // Aggregates: total attempted & solved per problem
    const problemIds = problems.map((p) => p.id);
    const totalAttempted = new Map();
    const totalSolved = new Map();
    if (problemIds.length > 0) {
        const [attempts, solved] = yield Promise.all([
            db_1.prisma.submission.groupBy({
                by: ["problemId"],
                where: { problemId: { in: problemIds } },
                _count: { id: true },
            }),
            db_1.prisma.submission.groupBy({
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
        var _a, _b, _c;
        const attempts = (_a = totalAttempted.get(p.id)) !== null && _a !== void 0 ? _a : 0;
        const solved = (_b = totalSolved.get(p.id)) !== null && _b !== void 0 ? _b : 0;
        const accuracy = attempts === 0 ? 0 : Math.round((solved / attempts) * 100);
        // User-specific flags
        const userSubmission = userId ? (_c = p.submissions) === null || _c === void 0 ? void 0 : _c[0] : null;
        const isUserSolved = (userSubmission === null || userSubmission === void 0 ? void 0 : userSubmission.status) === "Accepted";
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
});
exports.getProblems = getProblems;
const getProblemBySlug = (slug, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const problem = yield db_1.prisma.problem.findUnique({
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
    if (!problem)
        return null;
    // ----------------------------
    // Determine user problem status
    // ----------------------------
    let userStatus = "unsolved";
    let submission = null;
    if (problem.submissions.length > 0) {
        submission = problem.submissions[0];
        userStatus = submission.status === "ACCEPTED" ? "solved" : "attempted";
    }
    // Remove submissions array (not needed anymore)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { submissions } = problem, problemData = __rest(problem, ["submissions"]);
    return {
        problem: problemData,
        userStatus,
        submission,
    };
});
exports.getProblemBySlug = getProblemBySlug;
const getSubmissionByProblemId = (problemId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const submission = yield db_1.prisma.submission.findFirst({
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
});
exports.getSubmissionByProblemId = getSubmissionByProblemId;
// create submission
const createSubmission = (payload, problemCollectionType, seriesId) => __awaiter(void 0, void 0, void 0, function* () {
    const { problemId, userId, status, language, runtime, memory, percentage = 0, code, totaltc, totalPassed, tc, problemRating = 0, } = payload;
    // Calculate points for this specific problem submission
    const earnedPoints = (percentage / 100) * problemRating;
    return db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // 1. Check previous solve status for solvedCount logic
        const previousSubmission = yield tx.submission.findUnique({
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
        const wasFullySolved = (previousSubmission === null || previousSubmission === void 0 ? void 0 : previousSubmission.percentage) === 100;
        const isFullySolvedNow = percentage === 100;
        // 2. Upsert the current submission
        const submission = yield tx.submission.upsert({
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
        const allSubmissionsPoints = yield tx.submission.aggregate({
            where: {
                userId,
            },
            _sum: {
                points: true,
            },
        });
        const newTotalPoints = (_a = allSubmissionsPoints._sum.points) !== null && _a !== void 0 ? _a : 0;
        // 4. Update solvedCount only if newly achieving 100%
        const shouldIncrementSolved = isFullySolvedNow && !wasFullySolved;
        yield tx.jsGlobalLeaderboard.upsert({
            where: { userId },
            update: Object.assign(Object.assign({ totalPoints: newTotalPoints }, (shouldIncrementSolved && {
                solvedCount: { increment: 1 },
            })), { updatedAt: new Date() }),
            create: {
                userId,
                totalPoints: newTotalPoints,
                solvedCount: isFullySolvedNow ? 1 : 0,
            },
        });
        // 5. Update UserSeriesProblemProgress
        if (problemCollectionType === "SERIES") {
            yield tx.userSeriesProblemProgress.upsert({
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
            yield tx.userSeriesProgress.upsert({
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
    }));
});
exports.createSubmission = createSubmission;
const getJsGlobalLeaderboard = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* ({ page = 1, limit = 10, currentUserId, sortBy = "rating", // 'rating' | 'totalPoints' | 'solvedCount'
 } = {}) {
    var _a, _b;
    // Validate inputs
    if (page < 1)
        page = 1;
    if (limit < 1)
        limit = 10;
    if (limit > 100)
        limit = 100; // Optional: prevent overly large requests
    const offset = (page - 1) * limit;
    // Allowed sort fields for security
    const validSortFields = ["rating", "totalPoints", "solvedCount"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "rating";
    // Fetch leaderboard entries with user info
    const leaderboard = yield db_1.prisma.jsGlobalLeaderboard.findMany({
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
    const totalCount = yield db_1.prisma.jsGlobalLeaderboard.count();
    const totalPages = Math.ceil(totalCount / limit);
    // Find current user's rank and data (if provided)
    let currentUserRank = null;
    let currentUserEntry = null;
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
        const usersWithHigherOrEqual = yield db_1.prisma.jsGlobalLeaderboard.findMany({
            where: {
                [sortField]: {
                    gte: (_b = (_a = leaderboard[0]) === null || _a === void 0 ? void 0 : _a[sortField]) !== null && _b !== void 0 ? _b : 0,
                },
            },
            orderBy: { [sortField]: "desc" },
            select: { userId: true },
        });
        const rankIndex = usersWithHigherOrEqual.findIndex((entry) => entry.userId === currentUserId);
        currentUserRank = rankIndex !== -1 ? rankIndex + 1 : null;
        // Fetch current user's full entry (even if not on current page)
        if (currentUserRank !== null) {
            currentUserEntry = yield db_1.prisma.jsGlobalLeaderboard.findUnique({
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
});
exports.getJsGlobalLeaderboard = getJsGlobalLeaderboard;
exports.ProblemServices = {
    createProblem: exports.createProblem,
    getProblems: exports.getProblems,
    getProblemBySlug: exports.getProblemBySlug,
    getSubmissionByProblemId: exports.getSubmissionByProblemId,
    getJsGlobalLeaderboard: exports.getJsGlobalLeaderboard,
};
