import type { PracticeMode, TrainingMode } from "../types";

export const trainingModes: { id: PracticeMode; label: string }[] = [
  { id: "mixed", label: "Mixed Mode" },
  { id: "staff-letter", label: "Staff → Letter" },
  { id: "staff-solfege", label: "Staff → Solfege" },
  { id: "letter-fingering", label: "Letter → Fingering" },
  { id: "solfege-fingering", label: "Solfege → Fingering" },
  { id: "staff-fingering", label: "Staff → Fingering" },
  { id: "fingering-letter", label: "Fingering → Letter" },
  { id: "instrument-self-check", label: "Instrument Self-Check" },
  { id: "phrase-self-check", label: "Phrase Self-Check" }
];

export const mixedModes: TrainingMode[] = [
  "staff-letter",
  "staff-solfege",
  "letter-fingering",
  "solfege-fingering",
  "staff-fingering"
];

export function modeLabel(mode: PracticeMode): string {
  return trainingModes.find((item) => item.id === mode)?.label ?? mode;
}
