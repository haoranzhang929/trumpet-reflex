import type { AppSettings } from "../types";

const SETTINGS_KEY = "trumpet-reflex-settings-v1";

export const defaultSettings: AppSettings = {
  language: "en",
  theme: "system",
  defaultMode: "mixed",
  defaultLevel: "natural-c-to-c",
  defaultSessionLengthSec: 600,
  answerNotation: "both",
  autoAdvanceCorrect: true,
  hintsAfterWrong: true,
  showConcertPitchReference: false,
  accidentalsEnabled: false,
  weakNoteBias: true,
  selectedNoteIds: ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5"],
  phraseLength: 3,
  veryFastThresholdMs: 1500,
  slowThresholdMs: 3000
};

export function loadSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}
