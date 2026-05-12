import type { Note, NoteStats, Question, QuestionGenerationOptions, TrainingMode } from "../../types";
import { getNotesForLevel } from "../../data/levels";
import { mixedModes } from "../../data/modes";
import { expectedAnswerForQuestion } from "./answerChecker";

export function weaknessWeight(note: Note, stats: NoteStats[] = []): number {
  const stat = stats.find((item) => item.noteId === note.id);
  if (!stat) return 1;
  return 1 + Math.min(Math.max(stat.weaknessScore, 0), 10);
}

export function chooseWeightedNote(notes: Note[], stats: NoteStats[], useBias: boolean, random = Math.random): Note {
  const weights = notes.map((note) => (useBias ? weaknessWeight(note, stats) : 1));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = random() * total;
  for (let index = 0; index < notes.length; index += 1) {
    threshold -= weights[index];
    if (threshold <= 0) return notes[index];
  }
  return notes[notes.length - 1];
}

function modeShape(mode: TrainingMode): Pick<Question, "promptType" | "answerKind"> {
  switch (mode) {
    case "staff-letter":
      return { promptType: "staff", answerKind: "letter" };
    case "staff-solfege":
      return { promptType: "staff", answerKind: "solfege" };
    case "letter-fingering":
      return { promptType: "letter", answerKind: "fingering" };
    case "solfege-fingering":
      return { promptType: "solfege", answerKind: "fingering" };
    case "staff-fingering":
    case "instrument-self-check":
      return { promptType: "staff", answerKind: "fingering" };
    case "fingering-letter":
      return { promptType: "fingering", answerKind: "letter" };
    case "phrase-self-check":
      return { promptType: "staff", answerKind: "fingering" };
  }
}

export function generateQuestion(options: QuestionGenerationOptions, random = Math.random): Question {
  const actualMode: TrainingMode =
    options.mode === "mixed" ? mixedModes[Math.floor(random() * mixedModes.length)] : options.mode;
  const allNotes = getNotesForLevel(options.level, options.selectedNoteIds, true);
  const eligibleNotes =
    options.avoidImmediateRepeat && allNotes.length > 1 && options.previousNoteId
      ? allNotes.filter((note) => note.id !== options.previousNoteId)
      : allNotes;
  const note = chooseWeightedNote(eligibleNotes, options.noteStats ?? [], options.weakNoteBias, random);
  const shape = modeShape(actualMode);
  const question: Question = {
    id: crypto.randomUUID(),
    mode: actualMode,
    note,
    ...shape,
    expectedAnswer: "",
    createdAt: Date.now()
  };
  return { ...question, expectedAnswer: expectedAnswerForQuestion(question) };
}
