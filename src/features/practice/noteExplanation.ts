import type { AppSettings, Note } from "../../types";
import { formatValves } from "../../data/notes";
import { staffHint, staffLocation } from "../../i18n";

export type NoteExplanation = {
  staffLocation: string;
  landmarkHint: string;
  fingeringHint: string;
  solfegeHint: string;
};

export function getNoteExplanation(note: Note, language: AppSettings["language"]): NoteExplanation {
  const fingeringPrefix = language === "zh" ? "指法" : "Fingering";
  const fixedDoPrefix = language === "zh" ? "固定 Do" : "Fixed Do";
  return {
    staffLocation: staffLocation(note, language),
    landmarkHint: staffHint(note, language),
    fingeringHint: `${fingeringPrefix}: ${formatValves(note.valves)}`,
    solfegeHint: `${fixedDoPrefix}: ${note.solfegeFixedDo}`
  };
}
