import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRedis,
  sessionKey,
  getGameState,
  setGameState,
  deleteGameState,
  sessionExists,
  touchSession,
} from "./redis";

// Mock ioredis module
vi.mock("ioredis", () => {
  const MockRedis = vi.fn();
  MockRedis.prototype.get = vi.fn();
  MockRedis.prototype.setex = vi.fn();
  MockRedis.prototype.del = vi.fn();
  MockRedis.prototype.exists = vi.fn();
  MockRedis.prototype.expire = vi.fn();
  return {
    default: MockRedis,
  };
});

import Redis from "ioredis";

describe("redis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton for clean tests
    (getRedis as any).redis = null;
  });

  describe("getRedis", () => {
    it("returns a singleton Redis instance", () => {
      const instance1 = getRedis();
      const instance2 = getRedis();
      expect(instance1).toBe(instance2);
    });
  });

  describe("sessionKey", () => {
    it("prepends session prefix to session ID", () => {
      expect(sessionKey("abc123")).toBe("icecream:session:abc123");
      expect(sessionKey("xyz-789")).toBe("icecream:session:xyz-789");
    });
  });

  describe("getGameState", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("returns null when session does not exist", async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await getGameState("nonexistent");

      expect(result).toBeNull();
      expect(mockRedisInstance.get).toHaveBeenCalledWith("icecream:session:nonexistent");
    });

    it("returns parsed JSON data when session exists", async () => {
      const mockData = { score: 100, level: 5, playerName: "TestPlayer" };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await getGameState("session123");

      expect(result).toEqual(mockData);
      expect(mockRedisInstance.get).toHaveBeenCalledWith("icecream:session:session123");
    });

    it("returns typed data correctly", async () => {
      interface GameState {
        score: number;
        level: number;
      }
      const mockData: GameState = { score: 250, level: 10 };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await getGameState<GameState>("typed-session");

      expect(result).toEqual({ score: 250, level: 10 });
    });
  });

  describe("setGameState", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("stores state with JSON serialization and TTL", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");

      const state = { score: 100, level: 3 };
      await setGameState("session123", state);

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        "icecream:session:session123",
        60 * 60 * 24 * 7, // 7 days
        JSON.stringify(state)
      );
    });

    it("serializes complex objects correctly", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");

      const complexState = {
        nested: { value: 42 },
        array: [1, 2, 3],
        string: "test",
        null: null,
      };
      await setGameState("complex", complexState);

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        "icecream:session:complex",
        60 * 60 * 24 * 7,
        JSON.stringify(complexState)
      );
    });
  });

  describe("deleteGameState", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("deletes the session key", async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      await deleteGameState("session123");

      expect(mockRedisInstance.del).toHaveBeenCalledWith("icecream:session:session123");
    });
  });

  describe("sessionExists", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("returns true when session exists", async () => {
      mockRedisInstance.exists.mockResolvedValue(1);

      const result = await sessionExists("session123");

      expect(result).toBe(true);
      expect(mockRedisInstance.exists).toHaveBeenCalledWith("icecream:session:session123");
    });

    it("returns false when session does not exist", async () => {
      mockRedisInstance.exists.mockResolvedValue(0);

      const result = await sessionExists("nonexistent");

      expect(result).toBe(false);
      expect(mockRedisInstance.exists).toHaveBeenCalledWith("icecream:session:nonexistent");
    });
  });

  describe("touchSession", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("extends session TTL", async () => {
      mockRedisInstance.expire.mockResolvedValue(1);

      await touchSession("session123");

      expect(mockRedisInstance.expire).toHaveBeenCalledWith(
        "icecream:session:session123",
        60 * 60 * 24 * 7 // 7 days
      );
    });
  });

  describe("TTL behavior", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("uses consistent 7 day TTL across operations", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");
      mockRedisInstance.expire.mockResolvedValue(1);

      const expectedTTL = 60 * 60 * 24 * 7; // 7 days in seconds

      await setGameState("ttl-test", { data: "test" });
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        expect.any(String),
        expectedTTL,
        expect.any(String)
      );

      await touchSession("ttl-test");
      expect(mockRedisInstance.expire).toHaveBeenCalledWith(
        expect.any(String),
        expectedTTL
      );
    });
  });

  describe("JSON serialization", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("correctly serializes and deserializes round-trip", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");

      const originalState = {
        number: 42,
        string: "hello",
        boolean: true,
        null: null,
        nested: { a: 1, b: 2 },
        array: [1, 2, 3],
      };

      await setGameState("roundtrip", originalState);

      const serialized = JSON.stringify(originalState);
      mockRedisInstance.get.mockResolvedValue(serialized);

      const deserialized = await getGameState("roundtrip");

      expect(deserialized).toEqual(originalState);
    });

    it("handles empty objects", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");
      const emptyState = {};
      await setGameState("empty", emptyState);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(emptyState));

      const result = await getGameState("empty");
      expect(result).toEqual({});
    });

    it("handles arrays as state", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");
      const arrayState = [1, 2, 3, { key: "value" }];
      await setGameState("array-session", arrayState);
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(arrayState));

      const result = await getGameState("array-session");
      expect(result).toEqual(arrayState);
    });
  });

  describe("session key edge cases", () => {
    it("handles special characters in session IDs", () => {
      expect(sessionKey("session-with-dashes")).toBe("icecream:session:session-with-dashes");
      expect(sessionKey("session_with_underscores")).toBe("icecream:session:session_with_underscores");
      expect(sessionKey("session.with.dots")).toBe("icecream:session:session.with.dots");
      expect(sessionKey("session:with:colons")).toBe("icecream:session:session:with:colons");
    });

    it("handles empty string session ID", () => {
      expect(sessionKey("")).toBe("icecream:session:");
    });

    it("handles UUID-like session IDs", () => {
      const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      expect(sessionKey(uuid)).toBe(`icecream:session:${uuid}`);
    });
  });

  describe("getGameState error handling", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("returns null for empty string", async () => {
      mockRedisInstance.get.mockResolvedValue("");

      const result = await getGameState("empty-string-session");
      expect(result).toBeNull();
    });

    it("throws on Redis get error", async () => {
      mockRedisInstance.get.mockRejectedValue(new Error("Redis connection error"));

      await expect(getGameState("error-session")).rejects.toThrow("Redis connection error");
    });

    it("throws SyntaxError for invalid JSON", async () => {
      mockRedisInstance.get.mockResolvedValue("invalid-json{");

      await expect(getGameState("malformed-session")).rejects.toThrow(SyntaxError);
    });
  });

  describe("sessionExists error handling", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("throws on Redis error", async () => {
      mockRedisInstance.exists.mockRejectedValue(new Error("Redis connection error"));

      await expect(sessionExists("error-session")).rejects.toThrow("Redis connection error");
    });
  });

  describe("setGameState operations", () => {
    let mockRedisInstance: any;

    beforeEach(() => {
      mockRedisInstance = getRedis();
    });

    it("stores primitive values", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");
      await setGameState("primitive", 42);

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        "icecream:session:primitive",
        60 * 60 * 24 * 7,
        "42"
      );
    });

    it("stores string values", async () => {
      mockRedisInstance.setex.mockResolvedValue("OK");
      await setGameState("string-session", "hello world");

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        "icecream:session:string-session",
        60 * 60 * 24 * 7,
        "\"hello world\""
      );
    });
  });
});
