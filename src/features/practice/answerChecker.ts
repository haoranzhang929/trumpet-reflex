import type { Question, Valve } from "../../types";
import { formatValves, noteAnswerLabel } from "../../data/notes";

export type UserAnswer = string | Valve[];

export type AnswerResult = {
  isCorrect: boolean;
  expectedAnswer: string;
  userAnswer: string;
};

export function normalizeLetterAnswer(input: string): string {
  return input
    .trim()
    .replace(/♭/g, "b")
    .replace(/♯/g, "#")
    .replace(/[0-9]/g, "")
    .toUpperCase();
}

export function normalizeSolfegeAnswer(input: string): string {
  return input
    .trim()
    .replace(/♭/g, "b")
    .replace(/♯/g, "#")
    .toLowerCase();
}

export function normalizeValveText(input: string): string {
  const normalized = input.trim().toLowerCase();
  if (normalized === "open" || normalized === "none" || normalized === "") return "0";
  if (normalized === "0") return "0";
  return normalized
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join("+");
}

export function normalizeValveAnswer(input: Valve[]): string {
  return formatValves(input);
}

export function expectedAnswerForQuestion(question: Question): string {
  if (question.answerKind === "letter") return noteAnswerLabel(question.note);
  if (question.answerKind === "solfege") return question.note.solfegeFixedDo;
  return formatValves(question.note.valves);
}

function normalizeForKind(kind: Question["answerKind"], answer: string): string {
  if (kind === "letter") return normalizeLetterAnswer(answer);
  if (kind === "solfege") return normalizeSolfegeAnswer(answer);
  return normalizeValveText(answer);
}

export function checkAnswer(question: Question, userAnswer: UserAnswer): AnswerResult {
  const expectedAnswer = expectedAnswerForQuestion(question);
  const answerText = Array.isArray(userAnswer) ? normalizeValveAnswer(userAnswer) : userAnswer;
  const isCorrect = normalizeForKind(question.answerKind, answerText) === normalizeForKind(question.answerKind, expectedAnswer);
  return { isCorrect, expectedAnswer, userAnswer: answerText };
}
