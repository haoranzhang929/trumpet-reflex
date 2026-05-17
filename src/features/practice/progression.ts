import type { Attempt, DifficultyLevel } from "../../types";
import { getLevel } from "../../data/levels";

export type LevelProgress = {
  level: DifficultyLevel;
  noteIds: string[];
  attemptedNotes: number;
  totalNotes: number;
  totalAttempts: number;
  accuracy: number;
  medianReactionMs: number;
  isUnlocked: boolean;
  isMastered: boolean;
};

export type ProgressionSummary = {
  levels: LevelProgress[];
  recommendedLevel: DifficultyLevel;
  masteredCount: number;
};

export const progressionLevelOrder: DifficultyLevel[] = [
  "anchors",
  "cde",
  "c-to-g",
  "natural-c-to-c",
  "low-register",
  "common-accidentals",
  "extended-natural",
  "practical-range"
];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function buildProgressionSummary(attempts: Attempt[]): ProgressionSummary {
  let previousMastered = true;
  const levels = progressionLevelOrder.map((level) => {
    const noteIds = getLevel(level).noteIds;
    const noteIdSet = new Set(noteIds);
    const attemptsWithLevel = attempts.filter((attempt) => attempt.level === level);
    const legacyLevelAttempts = attempts.filter((attempt) => {
      if (attempt.level) return false;
      if (attempt.noteId && noteIdSet.has(attempt.noteId)) return true;
      return attempt.noteIds?.some((noteId) => noteIdSet.has(noteId)) ?? false;
    });
    const levelAttempts = attemptsWithLevel.length > 0 ? attemptsWithLevel : legacyLevelAttempts;
    const attemptedNoteIds = new Set<string>();
    for (const attempt of levelAttempts) {
      if (attempt.noteId && noteIdSet.has(attempt.noteId)) attemptedNoteIds.add(attempt.noteId);
      attempt.noteIds?.forEach((noteId) => {
        if (noteIdSet.has(noteId)) attemptedNoteIds.add(noteId);
      });
    }
    const attemptedNotes = attemptedNoteIds.size;
    const totalAttempts = levelAttempts.length;
    const correctAttempts = levelAttempts.filter((attempt) => attempt.isCorrect).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    const medianReactionMs = median(levelAttempts.filter((attempt) => attempt.isCorrect).map((attempt) => attempt.reactionMs));
    const coveredEnough = attemptedNotes >= Math.ceil(noteIds.length * 0.8) && totalAttempts >= Math.max(12, noteIds.length * 2);
    const isMastered = coveredEnough && accuracy >= 85 && (medianReactionMs === 0 || medianReactionMs <= 3500);
    const isUnlocked = previousMastered || totalAttempts > 0;
    const progress: LevelProgress = {
      level,
      noteIds,
      attemptedNotes,
      totalNotes: noteIds.length,
      totalAttempts,
      accuracy,
      medianReactionMs,
      isUnlocked,
      isMastered
    };
    previousMastered = previousMastered && isMastered;
    return progress;
  });

  const recommendedLevel = levels.find((level) => !level.isMastered)?.level ?? progressionLevelOrder[progressionLevelOrder.length - 1];
  return {
    levels,
    recommendedLevel,
    masteredCount: levels.filter((level) => level.isMastered).length
  };
}
