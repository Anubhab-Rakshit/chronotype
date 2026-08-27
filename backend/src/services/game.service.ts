import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const submitGameSchema = z.object({
  totalTime: z.number().positive(),
  rawTime: z.number().positive(),
  penaltyTime: z.number().min(0),
  wrongAttempts: z.number().int().min(0),
  correctCharacters: z.number().int().min(0),
  accuracy: z.number().min(0).max(100),
});

export async function submitGameResult(
  userId: string,
  input: z.infer<typeof submitGameSchema>
) {
  const parsed = submitGameSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { rawTime, wrongAttempts } = parsed.data;

  const expectedPenalty = wrongAttempts * 0.5;
  const expectedTotal = rawTime + expectedPenalty;

  const tolerance = 0.01;
  if (Math.abs(parsed.data.penaltyTime - expectedPenalty) > tolerance) {
    throw new Error(
      `Invalid penalty time. Expected ${expectedPenalty.toFixed(1)}s but got ${parsed.data.penaltyTime}s`
    );
  }

  if (Math.abs(parsed.data.totalTime - expectedTotal) > tolerance) {
    throw new Error(
      `Invalid total time. Expected ${expectedTotal.toFixed(2)}s but got ${parsed.data.totalTime}s`
    );
  }

  const previousBest = await prisma.gameResult.findFirst({
    where: { userId, isBestScore: true },
    orderBy: { totalTime: "asc" },
  });

  const isBestScore =
    !previousBest || parsed.data.totalTime < previousBest.totalTime;

  if (isBestScore && previousBest) {
    await prisma.gameResult.update({
      where: { id: previousBest.id },
      data: { isBestScore: false },
    });
  }

  const result = await prisma.gameResult.create({
    data: {
      userId,
      totalTime: parsed.data.totalTime,
      rawTime: parsed.data.rawTime,
      penaltyTime: parsed.data.penaltyTime,
      wrongAttempts: parsed.data.wrongAttempts,
      correctCharacters: parsed.data.correctCharacters,
      accuracy: parsed.data.accuracy,
      isBestScore,
    },
  });

  return {
    id: result.id,
    userId: result.userId,
    totalTime: result.totalTime,
    rawTime: result.rawTime,
    penaltyTime: result.penaltyTime,
    wrongAttempts: result.wrongAttempts,
    correctCharacters: result.correctCharacters,
    accuracy: result.accuracy,
    completedAt: result.completedAt.toISOString(),
    isBestScore: result.isBestScore,
  };
}

export async function getUserBestScore(userId: string): Promise<number | null> {
  const bestResult = await prisma.gameResult.findFirst({
    where: { userId, isBestScore: true },
    orderBy: { totalTime: "asc" },
  });
  return bestResult?.totalTime ?? null;
}

export async function getUserHistory(userId: string, limit: number, offset: number) {
  const results = await prisma.gameResult.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: limit,
    skip: offset,
  });

  return results.map((r) => ({
    id: r.id,
    userId: r.userId,
    totalTime: r.totalTime,
    rawTime: r.rawTime,
    penaltyTime: r.penaltyTime,
    wrongAttempts: r.wrongAttempts,
    correctCharacters: r.correctCharacters,
    accuracy: r.accuracy,
    completedAt: r.completedAt.toISOString(),
    isBestScore: r.isBestScore,
  }));
}

export async function getLeaderboard(limit: number) {
  const results = await prisma.$queryRaw<
    Array<{
      userId: string;
      username: string;
      bestTime: number;
      accuracy: number;
      gamesPlayed: bigint;
    }>
  >`
    WITH user_best AS (
      SELECT
        gr."userId",
        gr."totalTime" AS "bestTime",
        gr.accuracy,
        ROW_NUMBER() OVER (PARTITION BY gr."userId" ORDER BY gr."totalTime" ASC) AS rn
      FROM game_results gr
    ),
    user_games AS (
      SELECT
        "userId",
        COUNT(*) AS "gamesPlayed"
      FROM game_results
      GROUP BY "userId"
    )
    SELECT
      ub."userId",
      u.username,
      ub."bestTime",
      ub.accuracy,
      ug."gamesPlayed"
    FROM user_best ub
    JOIN users u ON u.id = ub."userId"
    JOIN user_games ug ON ug."userId" = ub."userId"
    WHERE ub.rn = 1
    ORDER BY ub."bestTime" ASC
    LIMIT ${limit}
  `;

  return results.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    username: r.username,
    bestTime: r.bestTime,
    accuracy: r.accuracy,
    gamesPlayed: Number(r.gamesPlayed),
  }));
}

export async function getGlobalStats() {
  const [totalGamesPlayed, globalBest, totalRegisteredUsers] = await Promise.all([
    prisma.gameResult.count(),
    prisma.gameResult.findFirst({ orderBy: { totalTime: "asc" } }),
    prisma.user.count(),
  ]);

  return {
    totalGamesPlayed,
    globalBestTime: globalBest?.totalTime ?? null,
    totalRegisteredUsers,
  };
}
