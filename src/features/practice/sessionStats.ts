import type { Attempt, NoteStats, PracticeSession } from "../../types";
import { notes } from "../../data/notes";
import { average, median, percent } from "../../utils/stats";

export function calculateMaxStreak(attempts: Pick<Attempt, "isCorrect">[]): number {
  let current = 0;
  let best = 0;
  for (const attempt of attempts) {
    current = attempt.isCorrect ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

export function summarizeSession(
  base: Pick<PracticeSession, "id" | "startedAt" | "mode" | "level">,
  attempts: Attempt[],
  endedAt = Date.now()
): PracticeSession {
  const reactionTimes = attempts.map((attempt) => attempt.reactionMs);
  const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
  return {
    ...base,
    endedAt,
    totalQuestions: attempts.length,
    correctCount,
    averageReactionMs: average(reactionTimes),
    medianReactionMs: median(reactionTimes),
    maxStreak: calculateMaxStreak(attempts)
  };
}

export function deriveNoteStats(attempts: Attempt[], now = Date.now()): NoteStats[] {
  return notes.map((note) => {
    const noteAttempts = attempts.filter((attempt) => attempt.noteId === note.id || attempt.noteIds?.includes(note.id));
    const reactionTimes = noteAttempts.map((attempt) => attempt.reactionMs);
    const correctAttempts = noteAttempts.filter((attempt) => attempt.isCorrect).length;
    const wrongAttempts = noteAttempts.filter((attempt) => !attempt.isCorrect);
    const recentCutoff = now - 1000 * 60 * 60 * 24 * 14;
    const recentWrongCount = wrongAttempts.filter((attempt) => attempt.createdAt >= recentCutoff).length;
    const medianReactionMs = median(reactionTimes);
    const slowCorrectAttempts = noteAttempts.filter((attempt) => attempt.speedClass === "slow-correct" || (attempt.isCorrect && attempt.reactionMs > 3000));
    const fastCorrectAttempts = noteAttempts.filter((attempt) => attempt.speedClass === "fast-correct");
    const recentSlowCorrectCount = slowCorrectAttempts.filter((attempt) => attempt.createdAt >= recentCutoff).length;
    let currentCorrectStreak = 0;
    let recentFastCorrectStreak = 0;
    for (const attempt of [...noteAttempts].reverse()) {
      if (!attempt.isCorrect) break;
      currentCorrectStreak += 1;
      if (attempt.speedClass === "fast-correct") recentFastCorrectStreak += 1;
    }
    const weaknessScore = Math.round(
      wrongAttempts.length * 3
      + slowCorrectAttempts.length * 1.5
      + recentWrongCount * 4
      + recentSlowCorrectCount * 2
      - recentFastCorrectStreak
    );
    return {
      noteId: note.id,
      totalAttempts: noteAttempts.length,
      correctAttempts,
      accuracy: percent(correctAttempts, noteAttempts.length),
      medianReactionMs,
      wrongCount: wrongAttempts.length,
      slowCorrectCount: slowCorrectAttempts.length,
      fastCorrectCount: fastCorrectAttempts.length,
      slowCount: slowCorrectAttempts.length,
      recentWrongCount,
      recentSlowCorrectCount,
      currentCorrectStreak,
      recentFastCorrectStreak,
      weaknessScore
    };
  });
}

export function getSlowButCorrectNotes(stats: NoteStats[], limit = 5): NoteStats[] {
  return stats
    .filter((stat) => stat.slowCorrectCount > 0)
    .sort((a, b) => b.slowCorrectCount - a.slowCorrectCount || b.medianReactionMs - a.medianReactionMs)
    .slice(0, limit);
}

export type SlowestCorrectNote = {
  noteId: string;
  correctAttempts: number;
  medianCorrectReactionMs: number;
};

export function getSlowestCorrectNotes(attempts: Attempt[], limit = 5): SlowestCorrectNote[] {
  return notes
    .map((note) => {
      const correctAttempts = attempts.filter((attempt) =>
        attempt.isCorrect && (attempt.noteId === note.id || attempt.noteIds?.includes(note.id))
      );
      return {
        noteId: note.id,
        correctAttempts: correctAttempts.length,
        medianCorrectReactionMs: median(correctAttempts.map((attempt) => attempt.reactionMs))
      };
    })
    .filter((stat) => stat.correctAttempts > 0)
    .sort((a, b) => b.medianCorrectReactionMs - a.medianCorrectReactionMs || b.correctAttempts - a.correctAttempts)
    .slice(0, limit);
}

export function getProblemPairs(attempts: Attempt[]): string[] {
  const wrongPairs = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.isCorrect || !attempt.noteId || !attempt.userAnswer) continue;
    const key = `${attempt.noteId}:${attempt.userAnswer}`;
    wrongPairs.set(key, (wrongPairs.get(key) ?? 0) + 1);
  }
  return [...wrongPairs.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
}

export function getWeakNotes(stats: NoteStats[], limit = 5): NoteStats[] {
  return stats
    .filter((stat) => stat.totalAttempts > 0 && (stat.accuracy < 80 || stat.weaknessScore > 0))
    .sort((a, b) => b.weaknessScore - a.weaknessScore || a.accuracy - b.accuracy)
    .slice(0, limit);
}
