
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/db";
import { getBangladeshDate, isSameDate, isYesterday } from "./daily-streak.helpers";
import { ActiveDay } from "./daily-streak.interface";

// BigInt serialization fix
declare global {
  interface BigInt {
    toJSON(): string | number;
  }
}

BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

export async function updateDailyStreakTx(
  tx: Prisma.TransactionClient,
  userId: string,
  activityDate: Date
) {
  const streak = await tx.userStreak.findUnique({
    where: { userId },
  });

  // First activity ever
  if (!streak) {
    const created = await tx.userStreak.create({
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
  if (
    streak.lastActiveDate &&
    isSameDate(streak.lastActiveDate, activityDate)
  ) {
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      streakDate: activityDate.toISOString().split("T")[0],
    };
  }

  let newCurrentStreak = 1;

  if (
    streak.lastActiveDate &&
    isYesterday(streak.lastActiveDate, activityDate)
  ) {
    newCurrentStreak = streak.currentStreak + 1;
  }

  const newLongestStreak = Math.max(
    newCurrentStreak,
    streak.longestStreak
  );

  const updated = await tx.userStreak.update({
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
}


export async function recordUserActivity(userId: string) {
  const bangladeshDate = getBangladeshDate();

  const result = await prisma.$transaction(async (tx) => {
    await tx.userDailyActivity.upsert({
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

    const streak = await updateDailyStreakTx(
      tx,
      userId,
      bangladeshDate
    );

    return streak;
  });

  return result;
}


export const getUserStreak = async (userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const streak = await tx.userStreak.findUnique({
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

     const todayBD = getBangladeshDate();

    const isActiveToday =
      streak.lastActiveDate !== null &&
      isSameDate(streak.lastActiveDate, todayBD);

    const activityDate = getBangladeshDate();

    if (
      streak.lastActiveDate &&
      !isYesterday(streak.lastActiveDate, activityDate) && !isActiveToday
    ) {
      streak.currentStreak = 0;
    }

    const lastSevenDaysActivity = await tx.userDailyActivity.findMany({
      where: {
        userId,
        date: {
          gte: new Date(
            activityDate.getFullYear(),
            activityDate.getMonth(),
            activityDate.getDate() - 6
          ),
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
  });
};

export async function getUserHeatmap(
  userId: string,
  year = new Date().getFullYear()
): Promise<ActiveDay[]> {
  const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const rows = await prisma.userDailyActivity.findMany({
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
}


