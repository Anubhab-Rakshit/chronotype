import Redis from "ioredis";
import { env } from "./env.js";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export const LEADERBOARD_CACHE_KEY = "leaderboard:top50";
export const LEADERBOARD_CACHE_TTL = 30;

export async function getCachedLeaderboard(limit: number) {
  const cached = await redis.get(LEADERBOARD_CACHE_KEY);
  if (cached) {
    const all = JSON.parse(cached) as Array<{
      rank: number;
      userId: string;
      username: string;
      bestTime: number;
      accuracy: number;
      gamesPlayed: number;
    }>;
    return all.slice(0, limit);
  }
  return null;
}

export async function setCachedLeaderboard(
  data: Array<{
    rank: number;
    userId: string;
    username: string;
    bestTime: number;
    accuracy: number;
    gamesPlayed: number;
  }>
) {
  await redis.setex(
    LEADERBOARD_CACHE_KEY,
    LEADERBOARD_CACHE_TTL,
    JSON.stringify(data)
  );
}

export async function invalidateLeaderboardCache() {
  await redis.del(LEADERBOARD_CACHE_KEY);
}
