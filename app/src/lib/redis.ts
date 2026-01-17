import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return "redis://localhost:6379";
};

// Singleton Redis client
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
  return redis;
}

// Session key helpers
const SESSION_PREFIX = "icecream:session:";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export function sessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

// Generic game state operations
export async function getGameState<T>(sessionId: string): Promise<T | null> {
  const redis = getRedis();
  const data = await redis.get(sessionKey(sessionId));
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setGameState<T>(
  sessionId: string,
  state: T
): Promise<void> {
  const redis = getRedis();
  await redis.setex(sessionKey(sessionId), SESSION_TTL, JSON.stringify(state));
}

export async function deleteGameState(sessionId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(sessionKey(sessionId));
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const redis = getRedis();
  return (await redis.exists(sessionKey(sessionId))) === 1;
}

// Extend session TTL (call on each interaction)
export async function touchSession(sessionId: string): Promise<void> {
  const redis = getRedis();
  await redis.expire(sessionKey(sessionId), SESSION_TTL);
}

// Delete all simulator state (all sessions)
export async function deleteAllSessions(): Promise<number> {
  const redis = getRedis();
  const keys = await redis.keys(`${SESSION_PREFIX}*`);
  if (keys.length === 0) return 0;
  return await redis.del(...keys);
}
