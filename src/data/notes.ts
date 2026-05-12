import type { Note, StaffSpelling, Valve } from "../types";

export const NATURAL_NOTE_IDS = ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5"] as const;
export const ACCIDENTAL_NOTE_IDS = ["bb4", "as4", "fs4", "gb4", "eb4", "ds4", "ab4", "gs4", "cs4", "db4"] as const;

export const notes: Note[] = [
  {
    id: "c4",
    written: { step: "C", octave: 4, label: "C4", accidental: null },
    solfegeFixedDo: "Do",
    staff: { clef: "treble", vexflowKey: "c/4", location: "lower ledger line", hint: "Lower ledger line C" },
    valves: [],
    displayName: "C4",
    levelTags: ["anchor", "natural"],
    isAnchor: true
  },
  {
    id: "d4",
    written: { step: "D", octave: 4, label: "D4", accidental: null },
    solfegeFixedDo: "Re",
    staff: { clef: "treble", vexflowKey: "d/4", location: "space below first line", hint: "Between lower ledger C and first-line E" },
    valves: [1, 3],
    displayName: "D4",
    levelTags: ["natural"]
  },
  {
    id: "e4",
    written: { step: "E", octave: 4, label: "E4", accidental: null },
    solfegeFixedDo: "Mi",
    staff: { clef: "treble", vexflowKey: "e/4", location: "first line", hint: "First line E" },
    valves: [1, 2],
    displayName: "E4",
    levelTags: ["natural"]
  },
  {
    id: "f4",
    written: { step: "F", octave: 4, label: "F4", accidental: null },
    solfegeFixedDo: "Fa",
    staff: { clef: "treble", vexflowKey: "f/4", location: "first space", hint: "FACE: first space F" },
    valves: [1],
    displayName: "F4",
    levelTags: ["anchor", "natural"],
    isAnchor: true
  },
  {
    id: "g4",
    written: { step: "G", octave: 4, label: "G4", accidental: null },
    solfegeFixedDo: "Sol",
    staff: { clef: "treble", vexflowKey: "g/4", location: "second line", hint: "Second line G" },
    valves: [],
    displayName: "G4",
    levelTags: ["anchor", "natural"],
    isAnchor: true
  },
  {
    id: "a4",
    written: { step: "A", octave: 4, label: "A4", accidental: null },
    solfegeFixedDo: "La",
    staff: { clef: "treble", vexflowKey: "a/4", location: "second space", hint: "FACE: second space A" },
    valves: [1, 2],
    displayName: "A4",
    levelTags: ["natural"]
  },
  {
    id: "b4",
    written: { step: "B", octave: 4, label: "B4", accidental: null },
    solfegeFixedDo: "Si",
    staff: { clef: "treble", vexflowKey: "b/4", location: "third line", hint: "Third line B is just below third-space C" },
    valves: [2],
    displayName: "B4",
    levelTags: ["natural"]
  },
  {
    id: "c5",
    written: { step: "C", octave: 5, label: "C5", accidental: null },
    solfegeFixedDo: "Do",
    staff: { clef: "treble", vexflowKey: "c/5", location: "third space", hint: "FACE: third space C" },
    valves: [],
    displayName: "C5",
    levelTags: ["anchor", "natural"],
    isAnchor: true
  },
  {
    id: "bb4",
    written: { step: "B", accidental: "b", octave: 4, label: "B♭4" },
    solfegeFixedDo: "Si♭",
    staff: { clef: "treble", vexflowKey: "bb/4", location: "third line with flat", hint: "Third line B lowered by a flat" },
    valves: [1],
    displayName: "B♭4",
    levelTags: ["accidental"]
  },
  {
    id: "as4",
    written: { step: "A", accidental: "#", octave: 4, label: "A♯4" },
    solfegeFixedDo: "La♯",
    staff: { clef: "treble", vexflowKey: "a#/4", location: "second space with sharp", hint: "Second space A raised by a sharp" },
    valves: [1],
    displayName: "A♯4",
    levelTags: ["accidental"]
  },
  {
    id: "fs4",
    written: { step: "F", accidental: "#", octave: 4, label: "F♯4" },
    solfegeFixedDo: "Fa♯",
    staff: { clef: "treble", vexflowKey: "f#/4", location: "first space with sharp", hint: "First space F raised by a sharp" },
    valves: [2],
    displayName: "F♯4",
    levelTags: ["accidental"]
  },
  {
    id: "gb4",
    written: { step: "G", accidental: "b", octave: 4, label: "G♭4" },
    solfegeFixedDo: "Sol♭",
    staff: { clef: "treble", vexflowKey: "gb/4", location: "second line with flat", hint: "Second line G lowered by a flat" },
    valves: [2],
    displayName: "G♭4",
    levelTags: ["accidental"]
  },
  {
    id: "eb4",
    written: { step: "E", accidental: "b", octave: 4, label: "E♭4" },
    solfegeFixedDo: "Mi♭",
    staff: { clef: "treble", vexflowKey: "eb/4", location: "first line with flat", hint: "First line E lowered by a flat" },
    valves: [2, 3],
    displayName: "E♭4",
    levelTags: ["accidental"]
  },
  {
    id: "ds4",
    written: { step: "D", accidental: "#", octave: 4, label: "D♯4" },
    solfegeFixedDo: "Re♯",
    staff: { clef: "treble", vexflowKey: "d#/4", location: "space below first line with sharp", hint: "Space below first line D raised by a sharp" },
    valves: [2, 3],
    displayName: "D♯4",
    levelTags: ["accidental"]
  },
  {
    id: "ab4",
    written: { step: "A", accidental: "b", octave: 4, label: "A♭4" },
    solfegeFixedDo: "La♭",
    staff: { clef: "treble", vexflowKey: "ab/4", location: "second space with flat", hint: "Second space A lowered by a flat" },
    valves: [2, 3],
    displayName: "A♭4",
    levelTags: ["accidental"]
  },
  {
    id: "gs4",
    written: { step: "G", accidental: "#", octave: 4, label: "G♯4" },
    solfegeFixedDo: "Sol♯",
    staff: { clef: "treble", vexflowKey: "g#/4", location: "second line with sharp", hint: "Second line G raised by a sharp" },
    valves: [2, 3],
    displayName: "G♯4",
    levelTags: ["accidental"]
  },
  {
    id: "cs4",
    written: { step: "C", accidental: "#", octave: 4, label: "C♯4" },
    solfegeFixedDo: "Do♯",
    staff: { clef: "treble", vexflowKey: "c#/4", location: "lower ledger line with sharp", hint: "Lower ledger C raised by a sharp" },
    valves: [1, 2, 3],
    displayName: "C♯4",
    levelTags: ["accidental"]
  },
  {
    id: "db4",
    written: { step: "D", accidental: "b", octave: 4, label: "D♭4" },
    solfegeFixedDo: "Re♭",
    staff: { clef: "treble", vexflowKey: "db/4", location: "space below first line with flat", hint: "Space below first line D lowered by a flat" },
    valves: [1, 2, 3],
    displayName: "D♭4",
    levelTags: ["accidental"]
  }
];

export const noteById = new Map(notes.map((note) => [note.id, note]));

export const referenceStaffSpellings: StaffSpelling[] = notes;

export function getNoteById(id: string): Note {
  const note = noteById.get(id);
  if (!note) throw new Error(`Unknown note id: ${id}`);
  return note;
}

export function formatValves(valves: Valve[]): string {
  return valves.length === 0 ? "0" : [...valves].sort().join("+");
}

export function noteAnswerLabel(note: Note): string {
  return note.written.label.replace(/[45]/g, "");
}
