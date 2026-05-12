import type { AppSettings, Note } from "../types";
import { formatValves } from "../data/notes";
import { staffLocation, t } from "../i18n";
import { getNoteExplanation } from "../features/practice/noteExplanation";

type Props = {
  result: "correct" | "wrong" | null;
  note: Note;
  userAnswer?: string;
  expectedAnswer?: string;
  showHint: boolean;
  language?: AppSettings["language"];
  readyMessageKey?: "answerReady" | "selfCheckReady";
};

export function FeedbackPanel({ result, note, userAnswer, expectedAnswer, showHint, language = "en", readyMessageKey = "answerReady" }: Props) {
  if (!result) {
    return (
      <div className="feedback-ready rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {t(language, readyMessageKey)}
      </div>
    );
  }

  const isCorrect = result === "correct";
  const explanation = getNoteExplanation(note, language);
  return (
    <div
      className={`${isCorrect ? "feedback-correct" : "feedback-wrong"} rounded-lg border p-4 ${
        isCorrect
          ? "border-green-300 bg-green-50 text-green-950 dark:border-green-700 dark:bg-green-950 dark:text-green-50"
          : "border-red-300 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950 dark:text-red-50"
      }`}
    >
      <div className="text-lg font-bold">{isCorrect ? t(language, "correct") : t(language, "wrong")}</div>
      {!isCorrect && (
        <p className="mt-1 text-sm">
          {t(language, "youAnswered")} <span className="font-semibold">{userAnswer}</span>. {t(language, "correctAnswer")}:{" "}
          <span className="font-semibold">{expectedAnswer}</span>.
        </p>
      )}
      <p className="mt-2 text-sm">
        {t(language, "written")} {note.displayName} / {note.solfegeFixedDo}. {t(language, "fingering")}: {formatValves(note.valves)}.
      </p>
      {(!isCorrect || showHint) && (
        <div className="mt-2 space-y-1 text-sm">
          <p>{t(language, "staff")}: {staffLocation(note, language)}.</p>
          <p>{explanation.landmarkHint}.</p>
          <p>{explanation.fingeringHint}. {explanation.solfegeHint}.</p>
        </div>
      )}
    </div>
  );
}
