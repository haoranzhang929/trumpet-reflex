import type { Note, StaffSpelling, Valve } from "../types";

type NoteInput = {
  step: Note["written"]["step"];
  octave: number;
  accidental?: Note["written"]["accidental"];
  valves: Valve[];
  solfegeFixedDo: string;
  levelTags: string[];
  isAnchor?: boolean;
  location?: string;
  hint?: string;
};

const accidentalLabel = {
  "#": "♯",
  b: "♭"
} as const;

const accidentalKey = {
  "#": "#",
  b: "b"
} as const;

function noteId(step: Note["written"]["step"], octave: number, accidental?: Note["written"]["accidental"]): string {
  const accidentalPart = accidental === "#" ? "s" : accidental === "b" ? "b" : "";
  return `${step.toLowerCase()}${accidentalPart}${octave}`;
}

function label(step: Note["written"]["step"], octave: number, accidental?: Note["written"]["accidental"]): string {
  return `${step}${accidental ? accidentalLabel[accidental] : ""}${octave}`;
}

function vexflowKey(step: Note["written"]["step"], octave: number, accidental?: Note["written"]["accidental"]): string {
  return `${step.toLowerCase()}${accidental ? accidentalKey[accidental] : ""}/${octave}`;
}

function makeNote(input: NoteInput): Note {
  const displayName = label(input.step, input.octave, input.accidental);
  const accidentalText = input.accidental === "#" ? "sharp" : input.accidental === "b" ? "flat" : "natural";
  return {
    id: noteId(input.step, input.octave, input.accidental),
    written: {
      step: input.step,
      accidental: input.accidental ?? null,
      octave: input.octave,
      label: displayName
    },
    solfegeFixedDo: input.solfegeFixedDo,
    staff: {
      clef: "treble",
      vexflowKey: vexflowKey(input.step, input.octave, input.accidental),
      location: input.location ?? `written ${displayName}`,
      hint: input.hint ?? `${displayName} on treble staff, ${accidentalText} fingering ${formatValves(input.valves)}`
    },
    valves: input.valves,
    displayName,
    levelTags: input.levelTags,
    isAnchor: input.isAnchor
  };
}

const naturalInputs: NoteInput[] = [
  { step: "G", octave: 3, valves: [1, 3], solfegeFixedDo: "Sol", levelTags: ["low", "natural"], location: "below lower ledger C", hint: "Low written G below lower ledger C" },
  { step: "A", octave: 3, valves: [1, 2], solfegeFixedDo: "La", levelTags: ["low", "natural"], location: "below lower ledger C", hint: "Low written A below lower ledger C" },
  { step: "B", octave: 3, valves: [2], solfegeFixedDo: "Si", levelTags: ["low", "natural"], location: "below lower ledger C", hint: "Low written B below lower ledger C" },
  { step: "C", octave: 4, valves: [], solfegeFixedDo: "Do", levelTags: ["anchor", "natural"], isAnchor: true, location: "lower ledger line", hint: "Lower ledger line C" },
  { step: "D", octave: 4, valves: [1, 3], solfegeFixedDo: "Re", levelTags: ["natural"], location: "space below first line", hint: "Between lower ledger C and first-line E" },
  { step: "E", octave: 4, valves: [1, 2], solfegeFixedDo: "Mi", levelTags: ["natural"], location: "first line", hint: "First line E" },
  { step: "F", octave: 4, valves: [1], solfegeFixedDo: "Fa", levelTags: ["anchor", "natural"], isAnchor: true, location: "first space", hint: "FACE: first space F" },
  { step: "G", octave: 4, valves: [], solfegeFixedDo: "Sol", levelTags: ["anchor", "natural"], isAnchor: true, location: "second line", hint: "Second line G" },
  { step: "A", octave: 4, valves: [1, 2], solfegeFixedDo: "La", levelTags: ["natural"], location: "second space", hint: "FACE: second space A" },
  { step: "B", octave: 4, valves: [2], solfegeFixedDo: "Si", levelTags: ["natural"], location: "third line", hint: "Third line B is just below third-space C" },
  { step: "C", octave: 5, valves: [], solfegeFixedDo: "Do", levelTags: ["anchor", "natural"], isAnchor: true, location: "third space", hint: "FACE: third space C" },
  { step: "D", octave: 5, valves: [1], solfegeFixedDo: "Re", levelTags: ["upper", "natural"], location: "fourth line", hint: "Fourth line D" },
  { step: "E", octave: 5, valves: [], solfegeFixedDo: "Mi", levelTags: ["upper", "natural"], location: "fourth space", hint: "Fourth space E" },
  { step: "F", octave: 5, valves: [1], solfegeFixedDo: "Fa", levelTags: ["upper", "natural"], location: "fifth line", hint: "Fifth line F" },
  { step: "G", octave: 5, valves: [], solfegeFixedDo: "Sol", levelTags: ["upper", "natural"], location: "above staff", hint: "G above the staff" },
  { step: "A", octave: 5, valves: [1, 2], solfegeFixedDo: "La", levelTags: ["upper", "natural"], location: "above staff", hint: "A above the staff" },
  { step: "B", octave: 5, valves: [2], solfegeFixedDo: "Si", levelTags: ["upper", "natural"], location: "above staff", hint: "B above the staff" },
  { step: "C", octave: 6, valves: [], solfegeFixedDo: "Do", levelTags: ["upper", "natural"], location: "two ledger lines above staff", hint: "High written C" }
];

const accidentalInputs: NoteInput[] = [
  { step: "F", accidental: "#", octave: 3, valves: [1, 2, 3], solfegeFixedDo: "Fa♯", levelTags: ["low", "accidental"] },
  { step: "G", accidental: "b", octave: 3, valves: [1, 2, 3], solfegeFixedDo: "Sol♭", levelTags: ["low", "accidental"] },
  { step: "G", accidental: "#", octave: 3, valves: [2, 3], solfegeFixedDo: "Sol♯", levelTags: ["low", "accidental"] },
  { step: "A", accidental: "b", octave: 3, valves: [2, 3], solfegeFixedDo: "La♭", levelTags: ["low", "accidental"] },
  { step: "A", accidental: "#", octave: 3, valves: [1], solfegeFixedDo: "La♯", levelTags: ["low", "accidental"] },
  { step: "B", accidental: "b", octave: 3, valves: [1], solfegeFixedDo: "Si♭", levelTags: ["low", "accidental"] },
  { step: "C", accidental: "#", octave: 4, valves: [1, 2, 3], solfegeFixedDo: "Do♯", levelTags: ["accidental"] },
  { step: "D", accidental: "b", octave: 4, valves: [1, 2, 3], solfegeFixedDo: "Re♭", levelTags: ["accidental"] },
  { step: "D", accidental: "#", octave: 4, valves: [2, 3], solfegeFixedDo: "Re♯", levelTags: ["accidental"] },
  { step: "E", accidental: "b", octave: 4, valves: [2, 3], solfegeFixedDo: "Mi♭", levelTags: ["accidental"] },
  { step: "F", accidental: "#", octave: 4, valves: [2], solfegeFixedDo: "Fa♯", levelTags: ["accidental"] },
  { step: "G", accidental: "b", octave: 4, valves: [2], solfegeFixedDo: "Sol♭", levelTags: ["accidental"] },
  { step: "G", accidental: "#", octave: 4, valves: [2, 3], solfegeFixedDo: "Sol♯", levelTags: ["accidental"] },
  { step: "A", accidental: "b", octave: 4, valves: [2, 3], solfegeFixedDo: "La♭", levelTags: ["accidental"] },
  { step: "A", accidental: "#", octave: 4, valves: [1], solfegeFixedDo: "La♯", levelTags: ["accidental"] },
  { step: "B", accidental: "b", octave: 4, valves: [1], solfegeFixedDo: "Si♭", levelTags: ["accidental"] },
  { step: "C", accidental: "#", octave: 5, valves: [1, 2], solfegeFixedDo: "Do♯", levelTags: ["upper", "accidental"] },
  { step: "D", accidental: "b", octave: 5, valves: [1, 2], solfegeFixedDo: "Re♭", levelTags: ["upper", "accidental"] },
  { step: "D", accidental: "#", octave: 5, valves: [2], solfegeFixedDo: "Re♯", levelTags: ["upper", "accidental"] },
  { step: "E", accidental: "b", octave: 5, valves: [2], solfegeFixedDo: "Mi♭", levelTags: ["upper", "accidental"] },
  { step: "F", accidental: "#", octave: 5, valves: [2], solfegeFixedDo: "Fa♯", levelTags: ["upper", "accidental"] },
  { step: "G", accidental: "b", octave: 5, valves: [2], solfegeFixedDo: "Sol♭", levelTags: ["upper", "accidental"] },
  { step: "G", accidental: "#", octave: 5, valves: [2, 3], solfegeFixedDo: "Sol♯", levelTags: ["upper", "accidental"] },
  { step: "A", accidental: "b", octave: 5, valves: [2, 3], solfegeFixedDo: "La♭", levelTags: ["upper", "accidental"] },
  { step: "A", accidental: "#", octave: 5, valves: [1], solfegeFixedDo: "La♯", levelTags: ["upper", "accidental"] },
  { step: "B", accidental: "b", octave: 5, valves: [1], solfegeFixedDo: "Si♭", levelTags: ["upper", "accidental"] }
];

export const notes: Note[] = [...naturalInputs, ...accidentalInputs].map(makeNote);

export const NATURAL_NOTE_IDS = ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5"] as const;
export const LOW_NATURAL_NOTE_IDS = ["g3", "a3", "b3"] as const;
export const UPPER_NATURAL_NOTE_IDS = ["d5", "e5", "f5", "g5", "a5", "b5", "c6"] as const;
export const ACCIDENTAL_NOTE_IDS = accidentalInputs.map((item) => noteId(item.step, item.octave, item.accidental));
export const LOW_ACCIDENTAL_NOTE_IDS = ["fs3", "gb3", "gs3", "ab3", "as3", "bb3"] as const;
export const COMMON_ACCIDENTAL_NOTE_IDS = ["bb4", "fs4", "eb4", "ab4", "cs4"] as const;
export const UPPER_ACCIDENTAL_NOTE_IDS = ["cs5", "db5", "ds5", "eb5", "fs5", "gb5", "gs5", "ab5", "as5", "bb5"] as const;

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
  return note.written.label.replace(/\d/g, "");
}
