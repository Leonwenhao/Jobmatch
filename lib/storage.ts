// Redis-based session storage using Upstash
// Persists across serverless function invocations

import { Redis } from '@upstash/redis';
import { Session } from '@/lib/types';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SESSION_PREFIX = 'session:';
const TTL_SECONDS = 60 * 60 * 2; // 2 hours

/**
 * Store a new session
 */
export async function setSession(sessionId: string, session: Session): Promise<void> {
  await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(session), {
    ex: TTL_SECONDS,
  });
}

/**
 * Retrieve a session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const data = await redis.get<string>(SESSION_PREFIX + sessionId);
  if (!data) return null;

  // Handle case where Redis returns already-parsed object
  if (typeof data === 'object') {
    return data as unknown as Session;
  }

  return JSON.parse(data);
}

/**
 * Update an existing session
 */
export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) {
    return false;
  }

  const updated = { ...session, ...updates };
  await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(updated), {
    ex: TTL_SECONDS,
  });

  return true;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const result = await redis.del(SESSION_PREFIX + sessionId);
  return result > 0;
}

/**
 * Check if a session exists
 */
export async function hasSession(sessionId: string): Promise<boolean> {
  const result = await redis.exists(SESSION_PREFIX + sessionId);
  return result > 0;
}

// Legacy export for backwards compatibility during migration
// This provides sync-looking methods but they won't work correctly
// All code should be updated to use the async functions above
export const sessionStorage = {
  set: (sessionId: string, session: Session) => {
    setSession(sessionId, session).catch(console.error);
  },
  get: (sessionId: string) => {
    console.warn('Sync sessionStorage.get() called - use async getSession() instead');
    return undefined;
  },
  update: (sessionId: string, updates: Partial<Session>) => {
    updateSession(sessionId, updates).catch(console.error);
    return true;
  },
  delete: (sessionId: string) => {
    deleteSession(sessionId).catch(console.error);
    return true;
  },
  has: (sessionId: string) => {
    console.warn('Sync sessionStorage.has() called - use async hasSession() instead');
    return false;
  },
};
