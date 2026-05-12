export type Valve = 1 | 2 | 3;

export type TrainingMode =
  | "staff-letter"
  | "staff-solfege"
  | "letter-fingering"
  | "solfege-fingering"
  | "staff-fingering"
  | "fingering-letter"
  | "instrument-self-check"
  | "phrase-self-check";

export type PracticeMode = TrainingMode | "mixed";

export type DifficultyLevel =
  | "anchors"
  | "cde"
  | "c-to-g"
  | "natural-c-to-c"
  | "common-accidentals"
  | "enharmonic-spellings"
  | "custom";

export type PromptType = "staff" | "letter" | "solfege" | "fingering";
export type SelfCheckPromptType = Extract<PromptType, "staff" | "letter" | "solfege">;
export type AnswerKind = "letter" | "solfege" | "fingering";
export type AttemptSpeedClass = "fast-correct" | "normal-correct" | "slow-correct" | "wrong";
export type InputMethod = "tap" | "keyboard" | "self-check";
export type PhrasePattern = "random" | "stepwise" | "anchor-based" | "weak-note-focused";

export type Note = {
  id: string;
  written: {
    step: "C" | "D" | "E" | "F" | "G" | "A" | "B";
    accidental?: "b" | "#" | null;
    octave: number;
    label: string;
  };
  solfegeFixedDo: string;
  staff: {
    clef: "treble";
    vexflowKey: string;
    location: string;
    hint: string;
  };
  valves: Valve[];
  displayName: string;
  levelTags: string[];
  isAnchor?: boolean;
};

export type StaffSpelling = Pick<Note, "id" | "written" | "solfegeFixedDo" | "staff" | "valves" | "displayName"> & {
  canonicalNoteId?: string;
};

export type LevelDefinition = {
  id: DifficultyLevel;
  name: string;
  description: string;
  noteIds: string[];
};

export type Question = {
  id: string;
  mode: TrainingMode;
  note: Note;
  notes?: Note[];
  isPhrase?: boolean;
  promptType: PromptType;
  answerKind: AnswerKind;
  expectedAnswer: string;
  createdAt: number;
};

export type NoteStats = {
  noteId: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  medianReactionMs: number;
  wrongCount: number;
  slowCorrectCount: number;
  fastCorrectCount: number;
  slowCount: number;
  recentWrongCount: number;
  recentSlowCorrectCount: number;
  currentCorrectStreak: number;
  recentFastCorrectStreak: number;
  weaknessScore: number;
};

export type PracticeSession = {
  id: string;
  startedAt: number;
  endedAt?: number;
  mode: PracticeMode;
  level: DifficultyLevel;
  totalQuestions: number;
  correctCount: number;
  medianReactionMs: number;
  averageReactionMs: number;
  maxStreak: number;
};

export type Attempt = {
  id: string;
  sessionId: string;
  questionMode: TrainingMode;
  noteId?: string;
  noteIds?: string[];
  isPhrase?: boolean;
  shownPromptType: PromptType;
  expectedAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  reactionMs: number;
  speedClass?: AttemptSpeedClass;
  inputMethod?: InputMethod;
  selfChecked?: boolean;
  revealedBeforeAnswer?: boolean;
  createdAt: number;
};

export type AppSettings = {
  language: "en" | "zh" | "bilingual";
  theme: "system" | "light" | "dark";
  defaultMode: PracticeMode;
  defaultLevel: DifficultyLevel;
  defaultSessionLengthSec: 0 | 180 | 300 | 600;
  answerNotation: "letter" | "solfege" | "both";
  autoAdvanceCorrect: boolean;
  hintsAfterWrong: boolean;
  showConcertPitchReference: boolean;
  accidentalsEnabled: boolean;
  weakNoteBias: boolean;
  selectedNoteIds: string[];
  phraseLength: 3 | 4 | 5;
  veryFastThresholdMs: number;
  slowThresholdMs: number;
};

export type QuestionGenerationOptions = {
  mode: PracticeMode;
  level: DifficultyLevel;
  selectedNoteIds?: string[];
  weakNoteBias: boolean;
  avoidImmediateRepeat: boolean;
  previousNoteId?: string;
  noteStats?: NoteStats[];
};
