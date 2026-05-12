import type { Note, PhrasePattern, QuestionGenerationOptions } from "../../types";
import { getNotesForLevel } from "../../data/levels";
import { chooseWeightedNote } from "./questionGenerator";

const stepOrder = ["c4", "cs4", "db4", "d4", "ds4", "eb4", "e4", "f4", "fs4", "gb4", "g4", "gs4", "ab4", "a4", "as4", "bb4", "b4", "c5"];

export function generatePhrase(
  options: QuestionGenerationOptions & { phraseLength: 3 | 4 | 5; pattern?: PhrasePattern; weakNoteIds?: string[] },
  random = Math.random
): Note[] {
  const pool = getNotesForLevel(options.level, options.selectedNoteIds, true);
  const length = options.phraseLength;
  if (pool.length === 0) return [];

  const pattern = options.pattern ?? "stepwise";
  const phrase: Note[] = [];
  const weakSet = new Set(options.weakNoteIds ?? []);

  if (weakSet.size > 0) {
    const weakCandidates = pool.filter((note) => weakSet.has(note.id));
    if (weakCandidates.length > 0) phrase.push(weakCandidates[Math.floor(random() * weakCandidates.length)]);
  }

  let guard = 0;
  while (phrase.length < length && guard < 100) {
    guard += 1;
    const previous = phrase[phrase.length - 1];
    let next: Note;
    if (pattern === "stepwise" && previous) {
      const previousIndex = stepOrder.indexOf(previous.id);
      const nearbyIds = stepOrder.slice(Math.max(0, previousIndex - 2), previousIndex + 3);
      const nearby = pool.filter((note) => nearbyIds.includes(note.id) && note.id !== previous.id);
      next = nearby.length > 0 ? nearby[Math.floor(random() * nearby.length)] : chooseWeightedNote(pool, options.noteStats ?? [], options.weakNoteBias, random);
    } else {
      next = chooseWeightedNote(pool, options.noteStats ?? [], options.weakNoteBias, random);
    }

    const recentRepeats = phrase.slice(-2).filter((note) => note.id === next.id).length;
    const accidentalCount = phrase.filter((note) => note.written.accidental).length;
    if (recentRepeats >= 1 && pool.length > 1) continue;
    if (next.written.accidental && accidentalCount >= 2 && pool.some((note) => !note.written.accidental)) continue;
    phrase.push(next);
  }

  while (phrase.length < length) {
    const fallback = pool[phrase.length % pool.length];
    if (!phrase[phrase.length - 1] || phrase[phrase.length - 1].id !== fallback.id || pool.length === 1) {
      phrase.push(fallback);
    } else {
      phrase.push(pool[(phrase.length + 1) % pool.length]);
    }
  }

  return phrase;
}
