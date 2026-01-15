import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import {
  getGameState,
  setGameState,
  sessionExists,
  touchSession,
} from "./redis";

const SESSION_COOKIE = "icecream_session";

// Generate a new session ID
export function generateSessionId(): string {
  return uuidv4();
}

// Get session ID from cookies (server-side)
export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

// Get or create session ID
export async function getOrCreateSessionId(): Promise<{
  sessionId: string;
  isNew: boolean;
}> {
  const existing = await getSessionId();

  if (existing && (await sessionExists(existing))) {
    await touchSession(existing);
    return { sessionId: existing, isNew: false };
  }

  const newSessionId = generateSessionId();
  return { sessionId: newSessionId, isNew: true };
}

// Initialize a new game session with state
export async function initializeSession<T>(
  sessionId: string,
  initialState: T
): Promise<void> {
  await setGameState(sessionId, initialState);
}

// Load game state for current session
export async function loadSession<T>(): Promise<{
  sessionId: string;
  state: T | null;
  isNew: boolean;
}> {
  const { sessionId, isNew } = await getOrCreateSessionId();

  if (isNew) {
    return { sessionId, state: null, isNew: true };
  }

  const state = await getGameState<T>(sessionId);
  return { sessionId, state, isNew: false };
}
