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
exports.UserServices = exports.updateUsername = exports.updateUser = exports.getUserAdditionalInfo = exports.getUserProfileInfo = exports.getMe = exports.getAllUser = void 0;
const db_1 = require("../../config/db");
const app_error_1 = __importDefault(require("../../helpers/app-error"));
const daily_streak_service_1 = require("../daily-streak/daily-streak.service");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const getAllUser = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield db_1.prisma.user.findMany({
        select: {
            name: true,
            email: true,
            id: true,
            role: true,
            status: true,
        },
    });
    return { users };
});
exports.getAllUser = getAllUser;
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const profile = yield db_1.prisma.user.findFirst({
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
    if (!profile)
        return null;
    const streak = yield (0, daily_streak_service_1.getUserStreak)(userId);
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
            score: Number((_b = (_a = profile.globalLeaderboard) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : 0),
        },
        js: {
            score: Number((_e = (_d = (_c = profile.jsLeaderboard) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.totalPoints) !== null && _e !== void 0 ? _e : 0),
        },
    };
});
exports.getMe = getMe;
const getUserProfileInfo = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user's current scores first
    const [userCssScore, userJsScore] = yield Promise.all([
        db_1.prisma.globalLeaderboard.findUnique({
            where: { userId },
            select: { score: true },
        }),
        db_1.prisma.jsGlobalLeaderboard.findUnique({
            where: { userId },
            select: { totalPoints: true },
        }),
    ]);
    const [cssSolvedCount, cssTotalSubmissions, cssRecentSubmissions, totalBattles, cssGlobalRank, jsGlobalRank, userInfo,] = yield Promise.all([
        db_1.prisma.battleSubmission.count({
            where: {
                userId,
                highScore: { not: null },
            },
        }),
        db_1.prisma.user.findFirst({
            where: { id: userId },
            select: {
                battleSubmissionCount: true,
            },
        }),
        db_1.prisma.battleSubmission.findMany({
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
        db_1.prisma.battle.count(),
        // CSS Global Rank
        userCssScore
            ? db_1.prisma.globalLeaderboard
                .count({
                where: {
                    score: { gt: userCssScore.score },
                },
            })
                .then((count) => count + 1)
            : null,
        // JS Global Rank
        userJsScore
            ? db_1.prisma.jsGlobalLeaderboard
                .count({
                where: {
                    totalPoints: { gt: userJsScore.totalPoints },
                },
            })
                .then((count) => count + 1)
            : null,
        db_1.prisma.user.findFirst({
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
    const jsSubmissions = yield db_1.prisma.submission.findMany({
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
    const solvedProblemMap = new Map();
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
    const [totalProblems, totalEasy, totalMedium, totalHard, totalRatings] = yield Promise.all([
        db_1.prisma.problem.count({ where: { isPublish: true } }),
        db_1.prisma.problem.count({ where: { isPublish: true, difficulty: "EASY" } }),
        db_1.prisma.problem.count({
            where: { isPublish: true, difficulty: "MEDIUM" },
        }),
        db_1.prisma.problem.count({ where: { isPublish: true, difficulty: "HARD" } }),
        db_1.prisma.problem.aggregate({
            where: { isPublish: true },
            _sum: { rating: true },
        }),
    ]);
    const unsolvedCount = totalProblems - totalSolved;
    /* ================= RECENT JS SUBMISSIONS ================= */
    const jsRecentSubmissions = yield db_1.prisma.submission.findMany({
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
    const earnedBadges = yield db_1.prisma.jsSeriesBadge.findMany({
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
    const heatmap = yield (0, daily_streak_service_1.getUserHeatmap)(userId);
    /* ================= RESPONSE ================= */
    return {
        info: userInfo,
        css: {
            totalSolved: cssSolvedCount,
            totalSubmissions: (cssTotalSubmissions === null || cssTotalSubmissions === void 0 ? void 0 : cssTotalSubmissions.battleSubmissionCount) || 0,
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
});
exports.getUserProfileInfo = getUserProfileInfo;
const getUserAdditionalInfo = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.prisma.user.findFirst({
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
});
exports.getUserAdditionalInfo = getUserAdditionalInfo;
const updateUser = (userId, userData) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.prisma.user.update({
        where: { id: userId },
        data: userData,
    });
});
exports.updateUser = updateUser;
//update username
const updateUsername = (userId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.prisma.user.findUnique({
        where: { username },
    });
    if (user) {
        throw new app_error_1.default(http_status_codes_1.default.CONFLICT, "Username already exists");
    }
    return db_1.prisma.user.update({
        where: { id: userId },
        data: { username },
    });
});
exports.updateUsername = updateUsername;
exports.UserServices = {
    getMe: exports.getMe,
    getAllUser: exports.getAllUser,
    getUserProfileInfo: exports.getUserProfileInfo,
    getUserAdditionalInfo: exports.getUserAdditionalInfo,
    updateUser: exports.updateUser,
    updateUsername: exports.updateUsername,
};
