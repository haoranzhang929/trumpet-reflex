import { describe, expect, it } from "vitest";
import { notes, formatValves, getNoteById, referenceStaffSpellings } from "../../data/notes";
import { getNotesForLevel } from "../../data/levels";
import { checkAnswer, normalizeLetterAnswer, normalizeValveText } from "./answerChecker";
import { generateQuestion, weaknessWeight } from "./questionGenerator";
import { drillPresets } from "../../data/drillPresets";
import { deriveNoteStats, getProblemPairs, getSlowButCorrectNotes, getSlowestCorrectNotes, summarizeSession } from "./sessionStats";
import { generatePhrase } from "./phraseGenerator";
import { classifyAttemptSpeed } from "./speedClass";
import { getNoteExplanation } from "./noteExplanation";
import type { Attempt, NoteStats, Question } from "../../types";
import { median } from "../../utils/stats";

function questionFor(noteId: string, answerKind: Question["answerKind"]): Question {
  const note = getNoteById(noteId);
  return {
    id: "q",
    mode: answerKind === "fingering" ? "staff-fingering" : answerKind === "solfege" ? "staff-solfege" : "staff-letter",
    note,
    promptType: "staff",
    answerKind,
    expectedAnswer: "",
    createdAt: 1
  };
}

describe("note registry", () => {
  it("contains the required natural notes and accidentals", () => {
    expect(notes.map((note) => note.id)).toEqual(["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5", "bb4", "as4", "fs4", "gb4", "eb4", "ds4", "ab4", "gs4", "cs4", "db4"]);
    expect(getNoteById("c4").solfegeFixedDo).toBe("Do");
    expect(getNoteById("c5").staff.location).toBe("third space");
    expect(referenceStaffSpellings.map((note) => note.id)).toContain("gb4");
    expect(referenceStaffSpellings.map((note) => note.id)).toContain("ds4");
  });

  it("maps written notes to B flat trumpet valve fingerings", () => {
    expect(formatValves(getNoteById("c4").valves)).toBe("0");
    expect(formatValves(getNoteById("d4").valves)).toBe("1+3");
    expect(formatValves(getNoteById("e4").valves)).toBe("1+2");
    expect(formatValves(getNoteById("bb4").valves)).toBe("1");
    expect(formatValves(getNoteById("as4").valves)).toBe("1");
    expect(formatValves(getNoteById("gb4").valves)).toBe("2");
    expect(formatValves(getNoteById("ds4").valves)).toBe("2+3");
    expect(formatValves(getNoteById("cs4").valves)).toBe("1+2+3");
    expect(formatValves(getNoteById("db4").valves)).toBe("1+2+3");
  });

  it("selects level notes and respects accidental filtering", () => {
    expect(getNotesForLevel("anchors").map((note) => note.id)).toEqual(["c4", "f4", "g4", "c5"]);
    expect(getNotesForLevel("natural-c-to-c", [], false).map((note) => note.id)).toContain("b4");
    expect(getNotesForLevel("c-to-g", [], false).map((note) => note.id)).not.toContain("bb4");
    expect(getNotesForLevel("common-accidentals", [], false).map((note) => note.id)).toEqual(["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5", "bb4", "fs4", "eb4"]);
    expect(getNotesForLevel("enharmonic-spellings", [], false).map((note) => note.id)).toContain("db4");
  });
});

describe("answer checking", () => {
  it("normalizes letters and valves", () => {
    expect(normalizeLetterAnswer("B♭4")).toBe("BB");
    expect(normalizeValveText("open")).toBe("0");
    expect(normalizeValveText("2+1")).toBe("1+2");
  });

  it("checks staff to letter, solfege, and fingering answers", () => {
    expect(checkAnswer(questionFor("bb4", "letter"), "Bb").isCorrect).toBe(true);
    expect(checkAnswer(questionFor("db4", "letter"), "D♭").isCorrect).toBe(true);
    expect(checkAnswer(questionFor("fs4", "solfege"), "Fa#").isCorrect).toBe(true);
    expect(checkAnswer(questionFor("gb4", "solfege"), "Solb").isCorrect).toBe(true);
    expect(checkAnswer(questionFor("d4", "fingering"), [1, 3]).isCorrect).toBe(true);
    expect(checkAnswer(questionFor("d4", "fingering"), [1, 2]).isCorrect).toBe(false);
  });
});

describe("note explanations", () => {
  it("includes staff, landmark, fingering, and fixed-do guidance", () => {
    const explanation = getNoteExplanation(getNoteById("f4"), "en");
    expect(explanation.staffLocation).toBe("first space");
    expect(explanation.landmarkHint).toContain("FACE");
    expect(explanation.fingeringHint).toContain("1");
    expect(explanation.solfegeHint).toContain("Fa");
  });
});

describe("question generation", () => {
  it("avoids immediate repeat when the note pool allows", () => {
    const question = generateQuestion({
      mode: "staff-letter",
      level: "c-to-g",
      weakNoteBias: false,
      avoidImmediateRepeat: true,
      previousNoteId: "c4"
    }, () => 0);
    expect(question.note.id).not.toBe("c4");
  });

  it("increases weak-note weighting", () => {
    const stat: NoteStats = {
      noteId: "f4",
      totalAttempts: 5,
      correctAttempts: 1,
      accuracy: 20,
      medianReactionMs: 4000,
      wrongCount: 4,
      slowCorrectCount: 1,
      fastCorrectCount: 0,
      slowCount: 1,
      recentWrongCount: 2,
      recentSlowCorrectCount: 0,
      currentCorrectStreak: 0,
      recentFastCorrectStreak: 0,
      weaknessScore: 21
    };
    expect(weaknessWeight(getNoteById("f4"), [stat])).toBe(11);
  });

  it("generates self-check phrases with the configured length and a weak note", () => {
    const phrase = generatePhrase({
      mode: "phrase-self-check",
      level: "natural-c-to-c",
      selectedNoteIds: ["c4", "d4", "e4", "f4", "g4"],
      weakNoteBias: true,
      avoidImmediateRepeat: true,
      phraseLength: 4,
      weakNoteIds: ["e4"]
    }, () => 0.1);
    expect(phrase).toHaveLength(4);
    expect(phrase.map((note) => note.id)).toContain("e4");
  });
});

describe("session stats", () => {
  const attempts: Attempt[] = [
    { id: "1", sessionId: "s", questionMode: "staff-letter", noteId: "c4", shownPromptType: "staff", expectedAnswer: "C", userAnswer: "C", isCorrect: true, reactionMs: 1000, speedClass: "fast-correct", createdAt: 1 },
    { id: "2", sessionId: "s", questionMode: "staff-letter", noteId: "c4", shownPromptType: "staff", expectedAnswer: "C", userAnswer: "D", isCorrect: false, reactionMs: 3000, speedClass: "wrong", createdAt: 2 },
    { id: "3", sessionId: "s", questionMode: "staff-fingering", noteId: "f4", shownPromptType: "staff", expectedAnswer: "1", userAnswer: "1", isCorrect: true, reactionMs: 5000, speedClass: "slow-correct", createdAt: 3 },
    { id: "4", sessionId: "s", questionMode: "staff-fingering", noteId: "f4", shownPromptType: "staff", expectedAnswer: "1", userAnswer: "1", isCorrect: true, reactionMs: 7000, speedClass: "slow-correct", createdAt: 4 },
    { id: "5", sessionId: "s", questionMode: "phrase-self-check", noteIds: ["d4", "e4", "f4"], isPhrase: true, shownPromptType: "staff", expectedAnswer: "1+3 1+2 1", userAnswer: "self-marked-wrong", isCorrect: false, reactionMs: 6000, speedClass: "wrong", inputMethod: "self-check", createdAt: 5 }
  ];

  it("calculates average, median, and max streak", () => {
    const summary = summarizeSession({ id: "s", startedAt: 1, mode: "mixed", level: "natural-c-to-c" }, attempts, 10);
    expect(summary.totalQuestions).toBe(5);
    expect(summary.correctCount).toBe(3);
    expect(summary.averageReactionMs).toBe(4400);
    expect(summary.medianReactionMs).toBe(5000);
    expect(summary.maxStreak).toBe(2);
  });

  it("calculates median reaction time", () => {
    expect(median([700, 100, 900])).toBe(700);
    expect(median([100, 500, 900, 1300])).toBe(700);
  });

  it("derives weak note stats from attempts", () => {
    const stats = deriveNoteStats(attempts, 5);
    const c4 = stats.find((stat) => stat.noteId === "c4");
    expect(c4?.wrongCount).toBe(1);
    expect(c4?.accuracy).toBe(50);
    expect(stats.find((stat) => stat.noteId === "e4")?.wrongCount).toBe(1);
    expect(getSlowButCorrectNotes(stats, 1)[0]?.noteId).toBe("f4");
    expect(getSlowestCorrectNotes(attempts, 1)[0]?.noteId).toBe("f4");
  });

  it("classifies speed and detects repeated wrong-answer pairs", () => {
    expect(classifyAttemptSpeed(true, 1000, { veryFastThresholdMs: 1500, slowThresholdMs: 3000 })).toBe("fast-correct");
    expect(classifyAttemptSpeed(true, 5000, { veryFastThresholdMs: 1500, slowThresholdMs: 3000 })).toBe("slow-correct");
    expect(classifyAttemptSpeed(false, 500, { veryFastThresholdMs: 1500, slowThresholdMs: 3000 })).toBe("wrong");
    expect(getProblemPairs([
      ...attempts,
      { id: "6", sessionId: "s", questionMode: "staff-letter", noteId: "c4", shownPromptType: "staff", expectedAnswer: "C", userAnswer: "D", isCorrect: false, reactionMs: 2500, createdAt: 6 }
    ])).toEqual(["c4:D"]);
  });
});

describe("drill presets", () => {
  it("provides targeted presets without adding self-check modes to mixed mode", () => {
    expect(drillPresets.some((preset) => preset.id === "enharmonic-awareness")).toBe(true);
    expect(drillPresets.every((preset) => preset.noteIds.length > 0)).toBe(true);
  });
});
