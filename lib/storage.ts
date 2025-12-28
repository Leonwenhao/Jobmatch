// In-memory session storage for V1 (no database)
// Note: Data will be lost on server restart - for production, use persistent storage

import { Session } from '@/lib/types';

class SessionStorage {
  private sessions: Map<string, Session>;
  private readonly TTL = 1000 * 60 * 60 * 2; // 2 hours

  constructor() {
    this.sessions = new Map();
  }

  /**
   * Store a new session
   */
  set(sessionId: string, session: Session): void {
    this.sessions.set(sessionId, session);

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.delete(sessionId);
    }, this.TTL);
  }

  /**
   * Retrieve a session by ID
   */
  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Update an existing session
   */
  update(sessionId: string, updates: Partial<Session>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    this.sessions.set(sessionId, {
      ...session,
      ...updates,
    });

    return true;
  }

  /**
   * Delete a session and its data
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Check if a session exists
   */
  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get session count (for monitoring)
   */
  size(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions (for testing/cleanup)
   */
  clear(): void {
    this.sessions.clear();
  }
}

// Singleton instance
export const sessionStorage = new SessionStorage();
