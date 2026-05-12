import type { AppSettings, Attempt, NoteStats, PracticeSession } from "../../types";
import { StatCard } from "../../components/StatCard";
import { WeakNotesList } from "../../components/WeakNotesList";
import { formatValves, getNoteById } from "../../data/notes";
import { getProblemPairs, getSlowButCorrectNotes, getSlowestCorrectNotes, getWeakNotes } from "../practice/sessionStats";
import { average, median, percent } from "../../utils/stats";
import { formatMs } from "../../utils/time";
import { modeName, t } from "../../i18n";

type Props = {
  attempts: Attempt[];
  sessions: PracticeSession[];
  noteStats: NoteStats[];
  language: AppSettings["language"];
  onPracticeWeak: () => void;
};

export function ReviewView({ attempts, sessions, noteStats, language, onPracticeWeak }: Props) {
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const fastCorrect = attempts.filter((attempt) => attempt.speedClass === "fast-correct").length;
  const slowCorrect = attempts.filter((attempt) => attempt.speedClass === "slow-correct" || (attempt.isCorrect && attempt.reactionMs > 3000)).length;
  const wrong = attempts.filter((attempt) => !attempt.isCorrect).length;
  const reactionTimes = attempts.map((attempt) => attempt.reactionMs);
  const weakNotes = getWeakNotes(noteStats, 8);
  const slowNotes = getSlowButCorrectNotes(noteStats, 5);
  const slowestCorrectNotes = getSlowestCorrectNotes(attempts, 5);
  const problemPairs = getProblemPairs(attempts);
  const lastSession = sessions[sessions.length - 1];
  const mistakesByMode = attempts
    .filter((attempt) => !attempt.isCorrect)
    .reduce<Record<string, number>>((acc, attempt) => {
      acc[attempt.questionMode] = (acc[attempt.questionMode] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <div className="space-y-5 py-4">
      <section>
        <h1 className="text-2xl font-black">{t(language, "review")}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(language, "localOnlyAttempts")}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t(language, "questions")} value={attempts.length} />
        <StatCard label={t(language, "accuracy")} value={`${percent(correct, attempts.length)}%`} />
        <StatCard label={t(language, "average")} value={formatMs(average(reactionTimes))} />
        <StatCard label={t(language, "median")} value={formatMs(median(reactionTimes))} />
        <StatCard label={t(language, "fastCorrect")} value={fastCorrect} />
        <StatCard label={t(language, "slowCorrect")} value={slowCorrect} />
        <StatCard label={t(language, "wrongCount")} value={wrong} />
      </section>

      {lastSession && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold">{t(language, "lastSession")}</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>{t(language, "mode")}: <b>{modeName(lastSession.mode, language)}</b></div>
            <div>{t(language, "questions")}: <b>{lastSession.totalQuestions}</b></div>
            <div>{t(language, "correct")}: <b>{lastSession.correctCount}</b></div>
            <div>{t(language, "maxStreak")}: <b>{lastSession.maxStreak}</b></div>
            <div>{t(language, "median")}: <b>{formatMs(lastSession.medianReactionMs)}</b></div>
            <div>{t(language, "average")}: <b>{formatMs(lastSession.averageReactionMs)}</b></div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t(language, "weakNotes")}</h2>
          <button type="button" onClick={onPracticeWeak} className="rounded-lg bg-reed px-3 py-2 text-sm font-bold text-white">{t(language, "practiceWeak")}</button>
        </div>
        <WeakNotesList stats={weakNotes} language={language} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(language, "slowButCorrectNotes")}</h2>
        {slowNotes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t(language, "noSlowButCorrectNotes")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {slowNotes.map((stat) => {
              const note = getNoteById(stat.noteId);
              return (
                <div key={stat.noteId} className="flex items-center justify-between rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                  <span><b>{note.displayName}</b> / {note.solfegeFixedDo} · {t(language, "fingering")} {formatValves(note.valves)}</span>
                  <span className="font-bold">{stat.slowCorrectCount} · {formatMs(stat.medianReactionMs)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(language, "slowestCorrectNotes")}</h2>
        {slowestCorrectNotes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t(language, "noSlowCorrectNotes")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {slowestCorrectNotes.map((stat) => {
              const note = getNoteById(stat.noteId);
              return (
                <div key={stat.noteId} className="flex items-center justify-between rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                  <span><b>{note.displayName}</b> / {note.solfegeFixedDo}</span>
                  <span className="font-bold">{formatMs(stat.medianCorrectReactionMs)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(language, "problemPairs")}</h2>
        {problemPairs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t(language, "noProblemPairs")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {problemPairs.map((pair) => {
              const [noteId, userAnswer] = pair.split(":");
              const note = getNoteById(noteId);
              return (
                <div key={pair} className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                  <b>{note.displayName}</b> → {userAnswer}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(language, "mistakesByMode")}</h2>
        {Object.keys(mistakesByMode).length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t(language, "noMistakes")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {Object.entries(mistakesByMode).map(([mode, count]) => (
              <div key={mode} className="flex justify-between rounded-lg bg-slate-100 p-2 text-sm dark:bg-slate-800">
                <span>{modeName(mode as PracticeSession["mode"], language)}</span>
                <b>{count}</b>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
