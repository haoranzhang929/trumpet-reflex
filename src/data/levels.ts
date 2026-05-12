import type { DifficultyLevel, LevelDefinition, Note } from "../types";
import { ACCIDENTAL_NOTE_IDS, NATURAL_NOTE_IDS, getNoteById } from "./notes";

export const COMMON_ACCIDENTAL_IDS = ["bb4", "fs4", "eb4"] as const;
export const ENHARMONIC_SPELLING_IDS = ["as4", "gb4", "ds4", "gs4", "db4"] as const;

export const levels: LevelDefinition[] = [
  {
    id: "anchors",
    name: "Anchor Notes",
    description: "Lower ledger C, first-space F, second-line G, third-space C.",
    noteIds: ["c4", "f4", "g4", "c5"]
  },
  { id: "cde", name: "C D E", description: "Beginner lower written range.", noteIds: ["c4", "d4", "e4"] },
  { id: "c-to-g", name: "C to G", description: "C4 through G4.", noteIds: ["c4", "d4", "e4", "f4", "g4"] },
  {
    id: "natural-c-to-c",
    name: "Natural C to C",
    description: "All natural written notes from C4 to C5.",
    noteIds: [...NATURAL_NOTE_IDS]
  },
  {
    id: "common-accidentals",
    name: "Common Accidentals",
    description: "Natural C to C plus practical early accidentals.",
    noteIds: [...NATURAL_NOTE_IDS, ...COMMON_ACCIDENTAL_IDS]
  },
  {
    id: "enharmonic-spellings",
    name: "Enharmonic Spellings",
    description: "Optional same-sound, different-spelling accidentals.",
    noteIds: [...NATURAL_NOTE_IDS, ...ACCIDENTAL_NOTE_IDS]
  },
  {
    id: "custom",
    name: "Custom Note Set",
    description: "Choose exactly which notes appear.",
    noteIds: [...NATURAL_NOTE_IDS]
  }
];

export function getLevel(levelId: DifficultyLevel): LevelDefinition {
  const level = levels.find((item) => item.id === levelId);
  if (!level) throw new Error(`Unknown level: ${levelId}`);
  return level;
}

export function getNotesForLevel(levelId: DifficultyLevel, selectedNoteIds: string[] = [], accidentalsEnabled = true): Note[] {
  const noteIds = levelId === "custom" && selectedNoteIds.length > 0 ? selectedNoteIds : getLevel(levelId).noteIds;
  const allowAccidentals = accidentalsEnabled || levelId === "common-accidentals" || levelId === "enharmonic-spellings";
  return noteIds
    .filter((id) => allowAccidentals || !(ACCIDENTAL_NOTE_IDS as readonly string[]).includes(id))
    .map(getNoteById);
}
