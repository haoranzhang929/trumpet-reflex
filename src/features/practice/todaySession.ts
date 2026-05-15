import type { DifficultyLevel, PracticeDurationSec, PracticeMode, SelfCheckPromptType } from "../../types";

export type TodaySessionStep = {
  id: string;
  titleKey: string;
  mode: PracticeMode;
  level: DifficultyLevel;
  durationSec: PracticeDurationSec;
  weakOnly?: boolean;
  selfCheckPromptType?: SelfCheckPromptType;
};

export function createTodaySessionRoutine(defaultLevel: DifficultyLevel): TodaySessionStep[] {
  return [
    { id: "staff-letter", titleKey: "todayStepStaffLetter", mode: "staff-letter", level: defaultLevel, durationSec: 120 },
    { id: "letter-fingering", titleKey: "todayStepLetterFingering", mode: "letter-fingering", level: defaultLevel, durationSec: 120 },
    { id: "staff-fingering", titleKey: "todayStepStaffFingering", mode: "staff-fingering", level: defaultLevel, durationSec: 120 },
    {
      id: "instrument-self-check",
      titleKey: "todayStepInstrumentSelfCheck",
      mode: "instrument-self-check",
      level: defaultLevel,
      durationSec: 120,
      selfCheckPromptType: "staff"
    },
    { id: "weak-notes-review", titleKey: "todayStepWeakNotesReview", mode: "staff-fingering", level: defaultLevel, durationSec: 120, weakOnly: true }
  ];
}
