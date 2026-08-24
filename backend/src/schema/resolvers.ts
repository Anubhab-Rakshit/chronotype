import { prisma } from "../lib/prisma.js";
import { register, login } from "../services/auth.service.js";
import {
  submitGameResult,
  getUserBestScore,
  getUserHistory,
  getLeaderboard,
  getGlobalStats,
} from "../services/game.service.js";
import { validateKeystrokes } from "../services/anticheat.service.js";
import { getUserAnalytics } from "../services/analytics.service.js";
import {
  pubsub,
  SUBSCRIPTION_KEYS,
  publishLeaderboardUpdate,
  publishGameSubmitted,
  publishTypingVelocity,
} from "../subscriptions/index.js";
import {
  getCachedLeaderboard,
  setCachedLeaderboard,
} from "../lib/redis.js";
import { rateLimitMiddleware } from "../middleware/rateLimit.js";
import type { GraphQLContext } from "../context.js";

const FINGER_MAP: Record<string, string> = {
  a: "left_pinky", q: "left_pinky", z: "left_pinky",
  s: "left_ring", w: "left_ring", x: "left_ring",
  d: "left_middle", e: "left_middle", c: "left_middle",
  f: "left_index", r: "left_index", v: "left_index",
  g: "left_index", t: "left_index", b: "left_index",
  h: "right_index", y: "right_index", n: "right_index",
  j: "right_index", u: "right_index", m: "right_index",
  k: "right_middle", i: "right_middle",
  l: "right_ring", o: "right_ring",
  p: "right_pinky", ";": "right_pinky",
};

export const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.userId) throw new Error("UNAUTHENTICATED");

      const user = await prisma.user.findUnique({
        where: { id: context.userId },
      });
      if (!user) throw new Error("User not found");

      const bestResult = await prisma.gameResult.findFirst({
        where: { userId: user.id, isBestScore: true },
        orderBy: { totalTime: "asc" },
      });

      const totalGames = await prisma.gameResult.count({
        where: { userId: user.id },
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        bestScore: bestResult?.totalTime ?? null,
        totalGames,
      };
    },

    userBestScore: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!context.userId) throw new Error("UNAUTHENTICATED");
      return getUserBestScore(context.userId);
    },

    userHistory: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      if (!context.userId) throw new Error("UNAUTHENTICATED");
      return getUserHistory(
        context.userId,
        args.limit ?? 20,
        args.offset ?? 0
      );
    },

    leaderboard: async (_parent: unknown, args: { limit?: number }) => {
      const limit = args.limit ?? 50;

      const cached = await getCachedLeaderboard(limit);
      if (cached) return cached;

      const fresh = await getLeaderboard(50);
      await setCachedLeaderboard(fresh);
      return fresh.slice(0, limit);
    },

    globalStats: async () => {
      return getGlobalStats();
    },

    userAnalytics: async (
      _parent: unknown,
      args: { userId: string },
      context: GraphQLContext
    ) => {
      if (!context.userId) throw new Error("UNAUTHENTICATED");
      return getUserAnalytics(args.userId);
    },

    gameResult: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.userId) throw new Error("UNAUTHENTICATED");

      const result = await prisma.gameResult.findUnique({
        where: { id: args.id },
        include: { keystrokeEvents: true, telemetry: true },
      });

      if (!result) throw new Error("Game result not found");
      if (result.userId !== context.userId) throw new Error("FORBIDDEN");

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
        keystrokeEvents: result.keystrokeEvents.map((e) => ({
          key: e.key,
          correct: e.correct,
          timeMs: e.timeMs,
          intervalMs: e.intervalMs,
          finger: e.finger,
        })),
        telemetry: result.telemetry
          ? {
              avgWpm: result.telemetry.avgWpm,
              peakWpm: result.telemetry.peakWpm,
              consistency: result.telemetry.consistency,
              avgInterval: result.telemetry.avgInterval,
              intervalVariance: result.telemetry.intervalVariance,
              flagged: result.telemetry.flagged,
              flagReason: result.telemetry.flagReason,
            }
          : null,
      };
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      args: { input: { username: string; email: string; password: string } }
    ) => {
      return register(args.input);
    },

    login: async (
      _parent: unknown,
      args: { input: { email: string; password: string } }
    ) => {
      return login(args.input);
    },

    submitGameResult: async (
      _parent: unknown,
      args: {
        input: {
          totalTime: number;
          rawTime: number;
          penaltyTime: number;
          wrongAttempts: number;
          correctCharacters: number;
          accuracy: number;
        };
        keystrokes?: Array<{ key: string; time: number }>;
      },
      context: GraphQLContext
    ) => {
      if (!context.userId) throw new Error("UNAUTHENTICATED");

      const result = await submitGameResult(context.userId, args.input);

      if (args.keystrokes && args.keystrokes.length > 0) {
        const validation = validateKeystrokes(
          args.keystrokes,
          args.input.correctCharacters
        );

        const sortedKeystrokes = [...args.keystrokes].sort(
          (a, b) => a.time - b.time
        );

        await prisma.keystrokeEvent.createMany({
          data: sortedKeystrokes.map((ks, idx) => ({
            gameResultId: result.id,
            key: ks.key,
            correct: true,
            timeMs: ks.time,
            intervalMs:
              idx > 0 ? ks.time - sortedKeystrokes[idx - 1].time : null,
            finger: FINGER_MAP[ks.key.toLowerCase()] ?? null,
          })),
        });

        await prisma.gameTelemetry.create({
          data: {
            gameResultId: result.id,
            avgWpm: validation.wpm,
            peakWpm: validation.wpm,
            consistency: Math.max(
              0,
              Math.min(100, 100 - validation.intervalVariance * 10)
            ),
            avgInterval: validation.avgInterval,
            intervalVariance: validation.intervalVariance,
            flagged: !validation.valid,
            flagReason: validation.reason ?? null,
          },
        });

        publishGameSubmitted({
          gameId: result.id,
          userId: context.userId,
          username: context.username ?? "unknown",
          totalTime: result.totalTime,
          accuracy: result.accuracy,
          isBestScore: result.isBestScore,
          timestamp: new Date().toISOString(),
        });

        if (result.isBestScore) {
          const leaderboard = await getLeaderboard(50);
          await setCachedLeaderboard(leaderboard);
          const entry = leaderboard.find(
            (e) => e.userId === context.userId
          );
          if (entry) {
            publishLeaderboardUpdate({
              ...entry,
              timestamp: new Date().toISOString(),
            });
          }
        }

        publishTypingVelocity({
          userId: context.userId,
          username: context.username ?? "unknown",
          wpm: validation.wpm,
          accuracy: result.accuracy,
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    },

    validateKeystrokes: async (
      _parent: unknown,
      args: {
        input: {
          keystrokes: Array<{ key: string; time: number }>;
          expectedChars: number;
        };
      }
    ) => {
      return validateKeystrokes(
        args.input.keystrokes,
        args.input.expectedChars
      );
    },
  },

  Subscription: {
    leaderboardUpdated: {
      subscribe: () =>
        pubsub.subscribe(SUBSCRIPTION_KEYS.LEADERBOARD_UPDATED),
    },
    gameSubmitted: {
      subscribe: () =>
        pubsub.subscribe(SUBSCRIPTION_KEYS.GAME_SUBMITTED),
    },
    typingVelocity: {
      subscribe: () =>
        pubsub.subscribe(SUBSCRIPTION_KEYS.TYPING_VELOCITY),
    },
  },
};
