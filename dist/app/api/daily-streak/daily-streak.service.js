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
exports.getUserStreak = void 0;
exports.updateDailyStreakTx = updateDailyStreakTx;
exports.recordUserActivity = recordUserActivity;
exports.getUserHeatmap = getUserHeatmap;
const db_1 = require("../../config/db");
const daily_streak_helpers_1 = require("./daily-streak.helpers");
BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int !== null && int !== void 0 ? int : this.toString();
};
function updateDailyStreakTx(tx, userId, activityDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const streak = yield tx.userStreak.findUnique({
            where: { userId },
        });
        // First activity ever
        if (!streak) {
            const created = yield tx.userStreak.create({
                data: {
                    userId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastActiveDate: activityDate,
                },
            });
            return {
                currentStreak: created.currentStreak,
                longestStreak: created.longestStreak,
                streakDate: activityDate.toISOString().split("T")[0],
            };
        }
        // Already active today → no change
        if (streak.lastActiveDate &&
            (0, daily_streak_helpers_1.isSameDate)(streak.lastActiveDate, activityDate)) {
            return {
                currentStreak: streak.currentStreak,
                longestStreak: streak.longestStreak,
                streakDate: activityDate.toISOString().split("T")[0],
            };
        }
        let newCurrentStreak = 1;
        if (streak.lastActiveDate &&
            (0, daily_streak_helpers_1.isYesterday)(streak.lastActiveDate, activityDate)) {
            newCurrentStreak = streak.currentStreak + 1;
        }
        const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);
        const updated = yield tx.userStreak.update({
            where: { userId },
            data: {
                currentStreak: newCurrentStreak,
                longestStreak: newLongestStreak,
                lastActiveDate: activityDate,
            },
        });
        return {
            currentStreak: updated.currentStreak,
            longestStreak: updated.longestStreak,
            streakDate: activityDate.toISOString().split("T")[0],
        };
    });
}
function recordUserActivity(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const bangladeshDate = (0, daily_streak_helpers_1.getBangladeshDate)();
        const result = yield db_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            yield tx.userDailyActivity.upsert({
                where: {
                    userId_date: {
                        userId,
                        date: bangladeshDate,
                    },
                },
                update: {
                    activityCount: { increment: 1 },
                },
                create: {
                    userId,
                    date: bangladeshDate,
                    activityCount: 1,
                },
            });
            const streak = yield updateDailyStreakTx(tx, userId, bangladeshDate);
            return streak;
        }));
        return result;
    });
}
const getUserStreak = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const streak = yield tx.userStreak.findUnique({
            where: { userId },
            select: {
                currentStreak: true,
                longestStreak: true,
                lastActiveDate: true,
            },
        });
        if (!streak) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                isActiveToday: false,
                lastActiveDate: null,
                lastActivity: []
            };
        }
        const todayBD = (0, daily_streak_helpers_1.getBangladeshDate)();
        const isActiveToday = streak.lastActiveDate !== null &&
            (0, daily_streak_helpers_1.isSameDate)(streak.lastActiveDate, todayBD);
        const activityDate = (0, daily_streak_helpers_1.getBangladeshDate)();
        if (streak.lastActiveDate &&
            !(0, daily_streak_helpers_1.isYesterday)(streak.lastActiveDate, activityDate) && !isActiveToday) {
            streak.currentStreak = 0;
        }
        const lastSevenDaysActivity = yield tx.userDailyActivity.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate() - 6),
                    lte: activityDate,
                },
            },
            select: {
                date: true,
                activityCount: true,
            },
            orderBy: {
                date: "asc",
            },
        });
        return {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            isActiveToday,
            lastActiveDate: streak.lastActiveDate,
            lastActivity: lastSevenDaysActivity
        };
    }));
});
exports.getUserStreak = getUserStreak;
function getUserHeatmap(userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, year = new Date().getFullYear()) {
        const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        const rows = yield db_1.prisma.userDailyActivity.findMany({
            where: {
                userId,
                activityCount: { gt: 0 },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                date: true,
                activityCount: true,
            },
            orderBy: { date: "asc" },
        });
        return rows.map(r => ({
            date: r.date.toISOString().slice(0, 10),
            count: r.activityCount,
        }));
    });
}
