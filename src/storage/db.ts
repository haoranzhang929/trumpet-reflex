import { openDB, type DBSchema } from "idb";
import type { Attempt, PracticeSession } from "../types";

const DB_NAME = "trumpet-reflex-db";
const DB_VERSION = 1;

interface TrumpetDb extends DBSchema {
  sessions: {
    key: string;
    value: PracticeSession;
    indexes: { "by-startedAt": number };
  };
  attempts: {
    key: string;
    value: Attempt;
    indexes: { "by-sessionId": string; "by-createdAt": number; "by-noteId": string };
  };
}

export const dbPromise = openDB<TrumpetDb>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const sessions = db.createObjectStore("sessions", { keyPath: "id" });
    sessions.createIndex("by-startedAt", "startedAt");

    const attempts = db.createObjectStore("attempts", { keyPath: "id" });
    attempts.createIndex("by-sessionId", "sessionId");
    attempts.createIndex("by-createdAt", "createdAt");
    attempts.createIndex("by-noteId", "noteId");
  }
});

export async function putSession(session: PracticeSession): Promise<void> {
  const db = await dbPromise;
  await db.put("sessions", session);
}

export async function addAttempt(attempt: Attempt): Promise<void> {
  const db = await dbPromise;
  await db.put("attempts", attempt);
}

export async function getAllAttempts(): Promise<Attempt[]> {
  const db = await dbPromise;
  return db.getAllFromIndex("attempts", "by-createdAt");
}

export async function getAttemptsForSession(sessionId: string): Promise<Attempt[]> {
  const db = await dbPromise;
  return db.getAllFromIndex("attempts", "by-sessionId", sessionId);
}

export async function getAllSessions(): Promise<PracticeSession[]> {
  const db = await dbPromise;
  return db.getAllFromIndex("sessions", "by-startedAt");
}

export async function resetDatabase(): Promise<void> {
  const db = await dbPromise;
  await Promise.all([db.clear("sessions"), db.clear("attempts")]);
}
