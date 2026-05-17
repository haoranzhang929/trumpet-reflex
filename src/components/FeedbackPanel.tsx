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
      <div className="feedback-ready min-h-28 rounded-lg border border-dashed border-black/15 bg-white p-4 text-sm text-[#6E6E73] shadow-sm dark:border-white/15 dark:bg-[#1E1E22] dark:text-[#A1A1AA]">
        {readyMessageKey === "answerReady" ? (
          <>
            <span className="sm:hidden">{t(language, "answerReadyMobile")}</span>
            <span className="hidden sm:inline">{t(language, readyMessageKey)}</span>
          </>
        ) : (
          t(language, readyMessageKey)
        )}
      </div>
    );
  }

  const isCorrect = result === "correct";
  const explanation = getNoteExplanation(note, language);
  return (
    <div
      className={`${isCorrect ? "feedback-correct" : "feedback-wrong"} rounded-lg border p-4 ${
        isCorrect
          ? "border-[#34C759]/35 bg-[#F0FFF4] text-[#1D1D1F] dark:bg-[#12351F] dark:text-white"
          : "border-[#FF3B30]/35 bg-[#FFF2F1] text-[#1D1D1F] dark:bg-[#3B1816] dark:text-white"
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
