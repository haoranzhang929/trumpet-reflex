import type { Attempt, NoteStats, PracticeMode, PracticeSession } from "../../types";
import { getNoteById } from "../../data/notes";
import { getSlowestCorrectNotes, getWeakNotes } from "../practice/sessionStats";
import { percent } from "../../utils/stats";
import { modeName, t, type Language } from "../../i18n";

export type PracticeRecommendation = {
  weakestMode?: PracticeMode;
  weakestNoteIds: string[];
  slowestNoteIds: string[];
  sessionAccuracy: number;
  copy: string;
};

export function getAttemptsForLastSession(attempts: Attempt[], sessions: PracticeSession[]): Attempt[] {
  const lastSession = [...sessions].reverse().find((session) => session.totalQuestions > 0);
  if (!lastSession) return attempts;
  return attempts.filter((attempt) => attempt.sessionId === lastSession.id);
}

export function getWeakestMode(attempts: Attempt[]): PracticeMode | undefined {
  const modes = attempts.reduce<Record<string, { total: number; wrong: number; medianMs: number[] }>>((acc, attempt) => {
    const bucket = acc[attempt.questionMode] ?? { total: 0, wrong: 0, medianMs: [] };
    bucket.total += 1;
    if (!attempt.isCorrect) bucket.wrong += 1;
    bucket.medianMs.push(attempt.reactionMs);
    acc[attempt.questionMode] = bucket;
    return acc;
  }, {});

  const entries = Object.entries(modes);
  const candidates = entries.some(([, bucket]) => bucket.total >= 2)
    ? entries.filter(([, bucket]) => bucket.total >= 2)
    : entries.filter(([, bucket]) => bucket.total > 0);

  return candidates
    .sort(([, a], [, b]) => {
      const aErrorRate = a.wrong / a.total;
      const bErrorRate = b.wrong / b.total;
      return bErrorRate - aErrorRate || b.wrong - a.wrong || b.total - a.total;
    })[0]?.[0] as PracticeMode | undefined;
}

export function buildPracticeRecommendation(attempts: Attempt[], sessions: PracticeSession[], noteStats: NoteStats[], language: Language = "en"): PracticeRecommendation {
  const lastSessionAttempts = getAttemptsForLastSession(attempts, sessions);
  const sourceAttempts = lastSessionAttempts.length > 0 ? lastSessionAttempts : attempts;
  const correct = sourceAttempts.filter((attempt) => attempt.isCorrect).length;
  const sessionAccuracy = percent(correct, sourceAttempts.length);
  const weakestMode = getWeakestMode(sourceAttempts);
  const weakNotes = getWeakNotes(noteStats, 3);
  const slowestNotes = getSlowestCorrectNotes(sourceAttempts, 3);
  const weakNoteNames = weakNotes.map((stat) => getNoteById(stat.noteId).displayName).join(", ");

  let nextDrill = t(language, "recommendStartToday");
  if (weakestMode === "staff-fingering") {
    nextDrill = t(language, "recommendCommonAccidentalsSelfCheck");
  } else if (weakestMode === "staff-letter" || weakestMode === "staff-solfege") {
    nextDrill = t(language, "recommendStaffNameAnchors");
  } else if (weakestMode === "letter-fingering" || weakestMode === "solfege-fingering") {
    nextDrill = t(language, "recommendNameFingering");
  } else if (weakNotes.length > 0) {
    nextDrill = t(language, "recommendWeakNotes").replace("{notes}", weakNoteNames);
  }

  const weakestMapping = weakestMode ? t(language, "recommendWeakestMapping").replace("{mode}", modeName(weakestMode, language)) : "";

  return {
    weakestMode,
    weakestNoteIds: weakNotes.map((stat) => stat.noteId),
    slowestNoteIds: slowestNotes.map((stat) => stat.noteId),
    sessionAccuracy,
    copy: `${weakestMapping}${nextDrill}`
  };
}
