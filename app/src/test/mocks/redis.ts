/**
 * Mock Redis for testing state persistence
 */

export type MockRedisStore = Record<string, { data: string; ttl: number }>;

export class MockRedis {
  private store: MockRedisStore = {};
  private currentTime = Date.now();

  set(key: string, value: string): Promise<"OK"> {
    this.store[key] = { data: value, ttl: -1 };
    return Promise.resolve("OK");
  }

  setex(key: string, seconds: number, value: string): Promise<"OK" | 0> {
    const expiresAt = this.currentTime + seconds * 1000;
    this.store[key] = { data: value, ttl: expiresAt };
    return Promise.resolve("OK");
  }

  get(key: string): Promise<string | null> {
    const entry = this.store[key];
    if (!entry) return Promise.resolve(null);
    if (entry.ttl > 0 && entry.ttl < this.currentTime) {
      delete this.store[key];
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.data);
  }

  del(key: string): Promise<number> {
    const existed = key in this.store;
    delete this.store[key];
    return Promise.resolve(existed ? 1 : 0);
  }

  exists(key: string): Promise<number> {
    const entry = this.store[key];
    if (!entry) return Promise.resolve(0);
    if (entry.ttl > 0 && entry.ttl < this.currentTime) {
      delete this.store[key];
      return Promise.resolve(0);
    }
    return Promise.resolve(1);
  }

  expire(key: string, seconds: number): Promise<number> {
    const entry = this.store[key];
    if (!entry) return Promise.resolve(0);
    entry.ttl = this.currentTime + seconds * 1000;
    return Promise.resolve(1);
  }

  // Test helpers
  advanceTime(seconds: number): void {
    this.currentTime += seconds * 1000;
  }

  clear(): void {
    this.store = {};
  }

  size(): number {
    return Object.keys(this.store).length;
  }

  keys(): string[] {
    return Object.keys(this.store);
  }
}

let globalMockRedis: MockRedis | null = null;

export function getMockRedis(): MockRedis {
  if (!globalMockRedis) {
    globalMockRedis = new MockRedis();
  }
  return globalMockRedis;
}

export function resetMockRedis(): void {
  if (globalMockRedis) {
    globalMockRedis.clear();
  }
  globalMockRedis = null;
}

export function mockRedisFunctions() {
  const mock = getMockRedis();

  return {
    getGameState: async function <T>(sessionId: string): Promise<T | null> {
      const key = `icecream:session:${sessionId}`;
      const data = await mock.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    },
    setGameState: async function <T>(sessionId: string, state: T): Promise<void> {
      const key = `icecream:session:${sessionId}`;
      await mock.setex(key, 604800, JSON.stringify(state)); // 7 days
    },
    deleteGameState: async function (sessionId: string): Promise<void> {
      const key = `icecream:session:${sessionId}`;
      await mock.del(key);
    },
    sessionExists: async function (sessionId: string): Promise<boolean> {
      const key = `icecream:session:${sessionId}`;
      return (await mock.exists(key)) === 1;
    },
    touchSession: async function (sessionId: string): Promise<void> {
      const key = `icecream:session:${sessionId}`;
      await mock.expire(key, 604800); // 7 days
    },
    mock,
  };
}
