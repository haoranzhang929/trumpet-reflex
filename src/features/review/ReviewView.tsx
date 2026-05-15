import type { AppSettings, Attempt, NoteStats, PracticeSession } from "../../types";
import { StatCard } from "../../components/StatCard";
import { WeakNotesList } from "../../components/WeakNotesList";
import { formatValves, getNoteById } from "../../data/notes";
import { getProblemPairs, getSlowButCorrectNotes, getSlowestCorrectNotes, getWeakNotes } from "../practice/sessionStats";
import { average, median, percent } from "../../utils/stats";
import { formatMs } from "../../utils/time";
import { modeName, t } from "../../i18n";
import { buildPracticeRecommendation } from "./recommendation";

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
  const lastSession = [...sessions].reverse().find((session) => session.totalQuestions > 0);
  const recommendation = buildPracticeRecommendation(attempts, sessions, noteStats, language);
  const mistakesByMode = attempts
    .filter((attempt) => !attempt.isCorrect)
    .reduce<Record<string, number>>((acc, attempt) => {
      acc[attempt.questionMode] = (acc[attempt.questionMode] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <div className="space-y-5 py-4">
      <section>
        <h1 className="text-2xl font-black text-[#1D1D1F] dark:text-white">{t(language, "review")}</h1>
        <p className="mt-1 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "reviewActionIntro")}</p>
      </section>

      <section className="ivory-texture rounded-lg border border-black/10 bg-white p-4 text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
        <div className="text-xs font-bold uppercase text-brass">{t(language, "recommendedNext")}</div>
        <p className="mt-2 text-lg font-black leading-7">{recommendation.copy}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="shift-tile rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]"><b>{recommendation.sessionAccuracy}%</b><span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "sessionAccuracy")}</span></div>
          <div className="shift-tile rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]"><b>{recommendation.weakestMode ? modeName(recommendation.weakestMode, language) : "—"}</b><span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "weakestMode")}</span></div>
          <div className="shift-tile rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]"><b>{weakNotes[0] ? getNoteById(weakNotes[0].noteId).displayName : "—"}</b><span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "weakestNote")}</span></div>
          <div className="shift-tile rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]"><b>{slowestCorrectNotes[0] ? getNoteById(slowestCorrectNotes[0].noteId).displayName : "—"}</b><span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "slowestNote")}</span></div>
        </div>
        <button type="button" onClick={onPracticeWeak} className="mt-4 min-h-12 w-full rounded-lg bg-brass font-bold text-white">{t(language, "practiceWeak")}</button>
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
        <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
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

      <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <h2 className="text-lg font-bold">{t(language, "slowButCorrectNotes")}</h2>
        {slowNotes.length === 0 ? (
          <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "noSlowButCorrectNotes")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {slowNotes.map((stat) => {
              const note = getNoteById(stat.noteId);
              return (
                <div key={stat.noteId} className="flex items-center justify-between rounded-lg bg-[#F5F5F7] p-3 text-sm dark:bg-[#2A2A30]">
                  <span><b>{note.displayName}</b> / {note.solfegeFixedDo} · {t(language, "fingering")} {formatValves(note.valves)}</span>
                  <span className="font-bold">{stat.slowCorrectCount} · {formatMs(stat.medianReactionMs)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <h2 className="text-lg font-bold">{t(language, "slowestCorrectNotes")}</h2>
        {slowestCorrectNotes.length === 0 ? (
          <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "noSlowCorrectNotes")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {slowestCorrectNotes.map((stat) => {
              const note = getNoteById(stat.noteId);
              return (
                <div key={stat.noteId} className="flex items-center justify-between rounded-lg bg-[#F5F5F7] p-3 text-sm dark:bg-[#2A2A30]">
                  <span><b>{note.displayName}</b> / {note.solfegeFixedDo}</span>
                  <span className="font-bold">{formatMs(stat.medianCorrectReactionMs)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <h2 className="text-lg font-bold">{t(language, "problemPairs")}</h2>
        {problemPairs.length === 0 ? (
          <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "noProblemPairs")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {problemPairs.map((pair) => {
              const [noteId, userAnswer] = pair.split(":");
              const note = getNoteById(noteId);
              return (
                <div key={pair} className="rounded-lg bg-[#F5F5F7] p-3 text-sm dark:bg-[#2A2A30]">
                  <b>{note.displayName}</b> → {userAnswer}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <h2 className="text-lg font-bold">{t(language, "mistakesByMode")}</h2>
        {Object.keys(mistakesByMode).length === 0 ? (
          <p className="mt-2 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "noMistakes")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {Object.entries(mistakesByMode).map(([mode, count]) => (
              <div key={mode} className="flex justify-between rounded-lg bg-[#F5F5F7] p-2 text-sm dark:bg-[#2A2A30]">
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
