import type { AppSettings, Attempt, PracticeSession } from "../types";
import { getAllAttempts, getAllSessions, putSession, addAttempt, resetDatabase } from "./db";
import { loadSettings, saveSettings } from "./settingsStorage";

export type ExportPayload = {
  version: 1;
  exportedAt: number;
  settings: AppSettings;
  sessions: PracticeSession[];
  attempts: Attempt[];
};

export async function exportJson(): Promise<string> {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: Date.now(),
    settings: loadSettings(),
    sessions: await getAllSessions(),
    attempts: await getAllAttempts()
  };
  return JSON.stringify(payload, null, 2);
}

export async function importJson(raw: string): Promise<void> {
  const payload = JSON.parse(raw) as ExportPayload;
  if (payload.version !== 1 || !Array.isArray(payload.sessions) || !Array.isArray(payload.attempts)) {
    throw new Error("Unsupported import file.");
  }
  await resetDatabase();
  saveSettings(payload.settings);
  for (const session of payload.sessions) await putSession(session);
  for (const attempt of payload.attempts) await addAttempt(attempt);
}
