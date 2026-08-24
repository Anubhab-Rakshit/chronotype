import { redis } from "../lib/redis.js";
import { env } from "../lib/env.js";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  keyPrefix: "rl",
};

const AUTH_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: "rl:auth",
};

const SUBMISSION_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: env.RATE_LIMIT_SUBMISSION_MAX,
  keyPrefix: "rl:submit",
};

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowKey = `${config.keyPrefix}:${key}`;
  const windowStart = now - config.windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(windowKey, 0, windowStart);
  pipeline.zadd(windowKey, now, `${now}:${Math.random()}`);
  pipeline.zcard(windowKey);
  pipeline.pexpire(windowKey, config.windowMs);

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;
  const resetAt = now + config.windowMs;

  return {
    allowed: count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    resetAt,
  };
}

export async function rateLimitMiddleware(
  request: Request,
  operationType?: string
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const clientKey = getClientKey(request);

  let config = DEFAULT_CONFIG;
  if (operationType === "mutation") {
    const body = await request.clone().text();
    if (
      body.includes("login") ||
      body.includes("register")
    ) {
      config = AUTH_CONFIG;
    } else if (body.includes("submitGameResult")) {
      config = SUBMISSION_CONFIG;
    }
  }

  const result = await checkRateLimit(clientKey, config);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  return {
    allowed: result.allowed,
    headers,
  };
}
