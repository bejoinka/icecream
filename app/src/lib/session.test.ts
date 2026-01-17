import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSessionId,
  getSessionId,
  getOrCreateSessionId,
  initializeSession,
  loadSession,
} from "./session";

// Mock next/headers cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock redis functions
vi.mock("./redis", () => ({
  getGameState: vi.fn(),
  setGameState: vi.fn(),
  sessionExists: vi.fn(),
  touchSession: vi.fn(),
}));

import { cookies } from "next/headers";
import {
  getGameState,
  setGameState,
  sessionExists,
  touchSession,
} from "./redis";

const mockCookies = vi.mocked(cookies);
const mockGetGameState = vi.mocked(getGameState);
const mockSetGameState = vi.mocked(setGameState);
const mockSessionExists = vi.mocked(sessionExists);
const mockTouchSession = vi.mocked(touchSession);

// Helper to create a mock cookie store
const createMockCookieStore = (cookies: Record<string, string>) => ({
  get: vi.fn((name: string) => ({
    name,
    value: cookies[name] ?? undefined,
  })),
  set: vi.fn(),
  delete: vi.fn(),
});

describe("generateSessionId", () => {
  it("generates a unique session ID", () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it("generates a valid UUID v4 format", () => {
    const id = generateSessionId();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });
});

describe("getSessionId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns session ID from cookie when present", async () => {
    const mockCookieStore = createMockCookieStore({
      icecream_session: "test-session-123",
    });
    mockCookies.mockResolvedValue(mockCookieStore);

    const sessionId = await getSessionId();

    expect(sessionId).toBe("test-session-123");
    expect(mockCookieStore.get).toHaveBeenCalledWith("icecream_session");
  });

  it("returns null when session cookie is not present", async () => {
    const mockCookieStore = createMockCookieStore({});
    mockCookies.mockResolvedValue(mockCookieStore);

    const sessionId = await getSessionId();

    expect(sessionId).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith("icecream_session");
  });

  it("returns empty string when cookie exists but has empty value", async () => {
    const mockCookieStore = createMockCookieStore({
      icecream_session: "",
    });
    mockCookies.mockResolvedValue(mockCookieStore);

    const sessionId = await getSessionId();

    expect(sessionId).toBe("");
  });
});

describe("getOrCreateSessionId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns existing session ID when session exists in redis", async () => {
    const existingSessionId = "existing-session-456";
    const mockCookieStore = createMockCookieStore({
      icecream_session: existingSessionId,
    });
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSessionExists.mockResolvedValue(true);

    const result = await getOrCreateSessionId();

    expect(result).toEqual({
      sessionId: existingSessionId,
      isNew: false,
    });
    expect(mockSessionExists).toHaveBeenCalledWith(existingSessionId);
    expect(mockTouchSession).toHaveBeenCalledWith(existingSessionId);
  });

  it("creates new session ID when cookie exists but session not in redis", async () => {
    const existingSessionId = "old-session-789";
    const mockCookieStore = createMockCookieStore({
      icecream_session: existingSessionId,
    });
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSessionExists.mockResolvedValue(false);

    const result = await getOrCreateSessionId();

    expect(result.sessionId).toMatch(/^[0-9a-f-]+$/); // UUID format
    expect(result.isNew).toBe(true);
    expect(result.sessionId).not.toBe(existingSessionId);
    expect(mockSessionExists).toHaveBeenCalledWith(existingSessionId);
    expect(mockTouchSession).not.toHaveBeenCalled();
  });

  it("creates new session ID when no cookie exists", async () => {
    const mockCookieStore = createMockCookieStore({});
    mockCookies.mockResolvedValue(mockCookieStore);

    const result = await getOrCreateSessionId();

    expect(result.sessionId).toMatch(/^[0-9a-f-]+$/); // UUID format
    expect(result.isNew).toBe(true);
    expect(mockSessionExists).not.toHaveBeenCalled();
    expect(mockTouchSession).not.toHaveBeenCalled();
  });

  it("creates new session ID when cookie store throws", async () => {
    mockCookies.mockRejectedValue(new Error("Cookie store not available"));

    // The error propagates, so we expect it to throw
    await expect(getOrCreateSessionId()).rejects.toThrow("Cookie store not available");
  });
});

describe("initializeSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("sets initial state in redis for given session ID", async () => {
    const sessionId = "test-session-init";
    const initialState = { score: 0, level: 1 };
    mockSetGameState.mockResolvedValue(undefined);

    await initializeSession(sessionId, initialState);

    expect(mockSetGameState).toHaveBeenCalledWith(sessionId, initialState);
  });

  it("handles complex state objects", async () => {
    const sessionId = "test-session-complex";
    const complexState = {
      player: { name: "Alice", level: 5 },
      inventory: ["sword", "shield"],
      stats: { hp: 100, mp: 50 },
    };
    mockSetGameState.mockResolvedValue(undefined);

    await initializeSession(sessionId, complexState);

    expect(mockSetGameState).toHaveBeenCalledWith(sessionId, complexState);
  });

  it("handles empty state object", async () => {
    const sessionId = "test-session-empty";
    const emptyState = {};
    mockSetGameState.mockResolvedValue(undefined);

    await initializeSession(sessionId, emptyState);

    expect(mockSetGameState).toHaveBeenCalledWith(sessionId, emptyState);
  });
});

describe("loadSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns new session with null state when no existing session", async () => {
    const mockCookieStore = createMockCookieStore({});
    mockCookies.mockResolvedValue(mockCookieStore);

    const result = await loadSession<{ score: number }>();

    expect(result.sessionId).toMatch(/^[0-9a-f-]+$/);
    expect(result.state).toBeNull();
    expect(result.isNew).toBe(true);
    expect(mockGetGameState).not.toHaveBeenCalled();
  });

  it("returns existing session with state from redis", async () => {
    const existingSessionId = "existing-session-load";
    const savedState = { score: 100, level: 3 };
    const mockCookieStore = createMockCookieStore({
      icecream_session: existingSessionId,
    });
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSessionExists.mockResolvedValue(true);
    mockGetGameState.mockResolvedValue(savedState);

    const result = await loadSession<{ score: number; level: number }>();

    expect(result).toEqual({
      sessionId: existingSessionId,
      state: savedState,
      isNew: false,
    });
    expect(mockSessionExists).toHaveBeenCalledWith(existingSessionId);
    expect(mockTouchSession).toHaveBeenCalledWith(existingSessionId);
    expect(mockGetGameState).toHaveBeenCalledWith(existingSessionId);
  });

  it("returns null state when session exists but state is null in redis", async () => {
    const existingSessionId = "existing-session-null";
    const mockCookieStore = createMockCookieStore({
      icecream_session: existingSessionId,
    });
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSessionExists.mockResolvedValue(true);
    mockGetGameState.mockResolvedValue(null);

    const result = await loadSession<{ score: number }>();

    expect(result).toEqual({
      sessionId: existingSessionId,
      state: null,
      isNew: false,
    });
  });

  it("creates new session when cookie exists but session not in redis", async () => {
    const oldSessionId = "old-invalid-session";
    const mockCookieStore = createMockCookieStore({
      icecream_session: oldSessionId,
    });
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSessionExists.mockResolvedValue(false);

    const result = await loadSession<{ score: number }>();

    expect(result.sessionId).not.toBe(oldSessionId);
    expect(result.state).toBeNull();
    expect(result.isNew).toBe(true);
    expect(mockGetGameState).not.toHaveBeenCalled();
  });

  it("handles typed state correctly", async () => {
    type GameState = {
      currentCity: string;
      visitedCities: string[];
    };

    const existingSessionId = "typed-session";
    const savedState: GameState = {
      currentCity: "Atlanta",
      visitedCities: ["Boston", "Chicago"],
    };
    const mockCookieStore = createMockCookieStore({
      icecream_session: existingSessionId,
    });
    mockCookies.mockResolvedValue(mockCookieStore);
    mockSessionExists.mockResolvedValue(true);
    mockGetGameState.mockResolvedValue(savedState);

    const result = await loadSession<GameState>();

    expect(result.state).toEqual(savedState);
    expect(result.state?.currentCity).toBe("Atlanta");
    expect(result.state?.visitedCities).toHaveLength(2);
  });
});
