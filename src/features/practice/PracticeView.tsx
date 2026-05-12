import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, Attempt, DifficultyLevel, NoteStats, PracticeMode, PracticeSession, Question, SelfCheckPromptType, Valve } from "../../types";
import { getNotesForLevel } from "../../data/levels";
import { formatValves, getNoteById } from "../../data/notes";
import { addAttempt, putSession } from "../../storage/db";
import { LetterAnswerGrid } from "../../components/LetterAnswerGrid";
import { SolfegeAnswerGrid } from "../../components/SolfegeAnswerGrid";
import { ValvePad } from "../../components/ValvePad";
import { StaffNote } from "../../components/StaffNote";
import { FeedbackPanel } from "../../components/FeedbackPanel";
import { checkAnswer } from "./answerChecker";
import { generateQuestion } from "./questionGenerator";
import { summarizeSession } from "./sessionStats";
import { formatDuration } from "../../utils/time";
import { levelName, modeName, staffHint, t } from "../../i18n";
import { generatePhrase } from "./phraseGenerator";
import { classifyAttemptSpeed } from "./speedClass";
import { getNoteExplanation } from "./noteExplanation";

type PracticeConfig = {
  mode: PracticeMode;
  level: DifficultyLevel;
  durationSec: 0 | 180 | 300 | 600;
  weakOnly?: boolean;
  selectedNoteIds?: string[];
  selfCheckPromptType?: SelfCheckPromptType;
};

type Props = {
  config: PracticeConfig;
  settings: AppSettings;
  noteStats: NoteStats[];
  weakNoteIds: string[];
  onFinished: () => void;
  onExit: () => void;
};

type FeedbackState = {
  result: "correct" | "wrong";
  userAnswer: string;
  expectedAnswer: string;
} | null;

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export function PracticeView({ config, settings, noteStats, weakNoteIds, onFinished, onExit }: Props) {
  const sessionRef = useRef<Pick<PracticeSession, "id" | "startedAt" | "mode" | "level">>({
    id: makeId(),
    startedAt: Date.now(),
    mode: config.mode,
    level: config.level
  });
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [revealed, setRevealed] = useState(false);
  const revealReactionMsRef = useRef<number | null>(null);
  const [selectedValves, setSelectedValves] = useState<Valve[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [paused, setPaused] = useState(false);
  const [remainingSec, setRemainingSec] = useState(config.durationSec);
  const [currentStreak, setCurrentStreak] = useState(0);
  const questionStartedAt = useRef(Date.now());
  const autoAdvanceRef = useRef<number | null>(null);

  const activeNotes = useMemo(() => {
    const base = getNotesForLevel(config.level, config.selectedNoteIds ?? settings.selectedNoteIds, settings.accidentalsEnabled);
    if (!config.weakOnly || weakNoteIds.length === 0) return base;
    const weakSet = new Set(weakNoteIds);
    const weakNotes = base.filter((note) => weakSet.has(note.id));
    return weakNotes.length > 0 ? weakNotes : weakNoteIds.map(getNoteById);
  }, [config.level, config.selectedNoteIds, config.weakOnly, settings.accidentalsEnabled, settings.selectedNoteIds, weakNoteIds]);

  const previousNoteIdRef = useRef<string | undefined>(undefined);

  const nextQuestion = useCallback(() => {
    if (activeNotes.length === 0) return;
    if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    setFeedback(null);
    setRevealed(false);
    revealReactionMsRef.current = null;
    setSelectedValves([]);
    setShowHint(false);
    if (config.mode === "phrase-self-check") {
      const phrase = generatePhrase({
        mode: config.mode,
        level: config.level,
        selectedNoteIds: activeNotes.map((note) => note.id),
        weakNoteBias: settings.weakNoteBias,
        avoidImmediateRepeat: true,
        previousNoteId: previousNoteIdRef.current,
        noteStats,
        phraseLength: settings.phraseLength,
        pattern: "stepwise",
        weakNoteIds: config.weakOnly ? weakNoteIds : []
      });
      const generated: Question = {
        id: makeId(),
        mode: "phrase-self-check",
        note: phrase[0],
        notes: phrase,
        isPhrase: true,
        promptType: "staff",
        answerKind: "fingering",
        expectedAnswer: phrase.map((note) => formatValves(note.valves)).join(" "),
        createdAt: Date.now()
      };
      previousNoteIdRef.current = phrase[phrase.length - 1]?.id;
      setQuestion(generated);
      questionStartedAt.current = Date.now();
      return;
    }

    const generated = generateQuestion({
      mode: config.mode,
      level: config.level,
      selectedNoteIds: activeNotes.map((note) => note.id),
      weakNoteBias: settings.weakNoteBias,
      avoidImmediateRepeat: true,
      previousNoteId: previousNoteIdRef.current,
      noteStats
    });
    const selfCheckPromptType = config.mode === "instrument-self-check" ? config.selfCheckPromptType ?? "staff" : generated.promptType;
    previousNoteIdRef.current = generated.note.id;
    setQuestion({ ...generated, promptType: selfCheckPromptType });
    questionStartedAt.current = Date.now();
  }, [activeNotes, config.level, config.mode, config.selfCheckPromptType, config.weakOnly, noteStats, settings.phraseLength, settings.weakNoteBias, weakNoteIds]);

  useEffect(() => {
    sessionRef.current = { id: makeId(), startedAt: Date.now(), mode: config.mode, level: config.level };
    setAttempts([]);
    setRemainingSec(config.durationSec);
    setCurrentStreak(0);
    setPaused(false);
    setFeedback(null);
    setRevealed(false);
    revealReactionMsRef.current = null;
    setQuestion(null);
    previousNoteIdRef.current = undefined;
  }, [config.durationSec, config.level, config.mode, config.weakOnly]);

  useEffect(() => {
    if (!question && activeNotes.length > 0) nextQuestion();
  }, [activeNotes.length, nextQuestion, question]);

  const finishSession = useCallback(async () => {
    if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    const summary = summarizeSession(sessionRef.current, attempts);
    await putSession(summary);
    onFinished();
  }, [attempts, onFinished]);

  useEffect(() => {
    if (config.durationSec === 0 || paused) return;
    const interval = window.setInterval(() => {
      setRemainingSec((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          finishSession();
          return 0;
        }
        return (value - 1) as typeof value;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [config.durationSec, finishSession, paused]);

  const submitAnswer = useCallback(
    async (answer: string | Valve[]) => {
      if (!question || feedback || paused) return;
      if (question.mode === "instrument-self-check" || question.mode === "phrase-self-check") return;
      const result = checkAnswer(question, answer);
      const reactionMs = Date.now() - questionStartedAt.current;
      const attempt: Attempt = {
        id: makeId(),
        sessionId: sessionRef.current.id,
        questionMode: question.mode,
        noteId: question.note.id,
        shownPromptType: question.promptType,
        expectedAnswer: result.expectedAnswer,
        userAnswer: result.userAnswer,
        isCorrect: result.isCorrect,
        reactionMs,
        speedClass: classifyAttemptSpeed(result.isCorrect, reactionMs, settings),
        inputMethod: Array.isArray(answer) ? "tap" : "tap",
        createdAt: Date.now()
      };
      await addAttempt(attempt);
      setAttempts((items) => [...items, attempt]);
      setCurrentStreak((value) => (result.isCorrect ? value + 1 : 0));
      setFeedback({ result: result.isCorrect ? "correct" : "wrong", userAnswer: result.userAnswer, expectedAnswer: result.expectedAnswer });
      const delay = result.isCorrect ? 650 : 1400;
      if (result.isCorrect && settings.autoAdvanceCorrect) {
        autoAdvanceRef.current = window.setTimeout(nextQuestion, delay);
      }
    },
    [feedback, nextQuestion, paused, question, settings]
  );

  const revealAnswer = () => {
    if (!question || revealed) return;
    // Self-check recognition time is measured at reveal, not at later self-marking.
    revealReactionMsRef.current = Date.now() - questionStartedAt.current;
    setRevealed(true);
  };

  const markSelfCheck = async (isCorrect: boolean) => {
    if (!question || !revealed || feedback) return;
    const reactionMs = revealReactionMsRef.current ?? Date.now() - questionStartedAt.current;
    const noteIds = question.notes?.map((note) => note.id);
    const attempt: Attempt = {
      id: makeId(),
      sessionId: sessionRef.current.id,
      questionMode: question.mode,
      noteId: question.isPhrase ? undefined : question.note.id,
      noteIds,
      isPhrase: question.isPhrase,
      shownPromptType: question.promptType,
      expectedAnswer: question.expectedAnswer,
      userAnswer: isCorrect ? "self-marked-right" : "self-marked-wrong",
      isCorrect,
      reactionMs,
      speedClass: classifyAttemptSpeed(isCorrect, reactionMs, settings),
      inputMethod: "self-check",
      selfChecked: true,
      revealedBeforeAnswer: true,
      createdAt: Date.now()
    };
    await addAttempt(attempt);
    setAttempts((items) => [...items, attempt]);
    setCurrentStreak((value) => (isCorrect ? value + 1 : 0));
    setFeedback({ result: isCorrect ? "correct" : "wrong", userAnswer: attempt.userAnswer, expectedAnswer: attempt.expectedAnswer });
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === "h" || event.key === "H") setShowHint((value) => !value);
      if (event.key === " ") {
        event.preventDefault();
        if (feedback) nextQuestion();
      }
      if (event.key === "0") setSelectedValves([]);
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        const valve = Number(event.key) as Valve;
        setSelectedValves((current) => current.includes(valve) ? current.filter((item) => item !== valve) : ([...current, valve].sort() as Valve[]));
      }
      const isSelfCheckQuestion = question?.mode === "instrument-self-check" || question?.mode === "phrase-self-check";
      if (event.key === "Enter" && question?.answerKind === "fingering" && !isSelfCheckQuestion) {
        submitAnswer(selectedValves);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [feedback, nextQuestion, question?.answerKind, question?.mode, selectedValves, submitAnswer]);

  if (!question) {
    return <div className="py-8 text-center text-slate-600">{t(settings.language, "preparingPractice")}</div>;
  }

  const answered = Boolean(feedback);
  const isSelfCheck = question.mode === "instrument-self-check" || question.mode === "phrase-self-check";
  const progressLabel = config.durationSec === 0 ? `${attempts.length} questions` : formatDuration(remainingSec);

  return (
    <div className="space-y-4 py-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{t(settings.language, "mode")}</div>
            <div className="font-bold">{modeName(config.mode, settings.language)} {config.weakOnly ? `· ${t(settings.language, "weakNotes")}` : ""}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">{config.durationSec === 0 ? t(settings.language, "progress") : t(settings.language, "timer")}</div>
            <div className="font-mono text-xl font-black">{progressLabel}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">{t(settings.language, "done")} <b>{attempts.length}</b></div>
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">{t(settings.language, "streak")} <b>{currentStreak}</b></div>
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">{t(settings.language, "level")} <b>{levelName(config.level, settings.language)}</b></div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t(settings.language, "question")}</div>
        {question.isPhrase && question.notes ? <StaffNote notes={question.notes} highlight={feedback?.result ?? null} language={settings.language} /> : null}
        {!question.isPhrase && question.promptType === "staff" && <StaffNote note={question.note} highlight={feedback?.result ?? null} language={settings.language} />}
        {question.promptType === "letter" && <PromptText>{question.note.displayName}</PromptText>}
        {question.promptType === "solfege" && <PromptText>{question.note.solfegeFixedDo}</PromptText>}
        {question.promptType === "fingering" && <PromptText>{formatValves(question.note.valves)}</PromptText>}
        {showHint && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-50">
            {t(settings.language, "hint")}: {staffHint(question.note, settings.language)}. {t(settings.language, "fingering")} {formatValves(question.note.valves)}.
          </div>
        )}
      </section>

      <section className="space-y-3">
        {isSelfCheck && (
          <SelfCheckControls
            revealed={revealed}
            answered={answered}
            language={settings.language}
            onReveal={revealAnswer}
            onMark={markSelfCheck}
          />
        )}
        {!isSelfCheck && question.answerKind === "letter" && <LetterAnswerGrid notes={activeNotes} onAnswer={submitAnswer} disabled={answered || paused} />}
        {!isSelfCheck && question.answerKind === "solfege" && <SolfegeAnswerGrid notes={activeNotes} onAnswer={submitAnswer} disabled={answered || paused} />}
        {!isSelfCheck && question.answerKind === "fingering" && (
          <ValvePad selected={selectedValves} onChange={setSelectedValves} onSubmit={() => submitAnswer(selectedValves)} disabled={answered || paused} openLabel={t(settings.language, "open")} submitLabel={t(settings.language, "submit")} />
        )}
      </section>

      {question.isPhrase && question.notes && revealed ? (
        <PhraseAnswerPanel notes={question.notes} language={settings.language} />
      ) : isSelfCheck && revealed && !feedback ? (
        <SelfCheckAnswerPanel note={question.note} language={settings.language} />
      ) : (
        <FeedbackPanel
          result={feedback?.result ?? null}
          note={question.note}
          userAnswer={feedback?.userAnswer}
          expectedAnswer={feedback?.expectedAnswer}
          showHint={showHint || settings.hintsAfterWrong || (isSelfCheck && revealed)}
          language={settings.language}
          readyMessageKey={isSelfCheck ? "selfCheckReady" : "answerReady"}
        />
      )}

      <section className="grid grid-cols-4 gap-3">
        <button type="button" onClick={() => setShowHint((value) => !value)} className="min-h-12 rounded-lg border border-slate-300 bg-white font-bold text-ink">{t(settings.language, "hint")}</button>
        <button type="button" onClick={nextQuestion} disabled={!answered} className="min-h-12 rounded-lg bg-ink font-bold text-white">{t(settings.language, "next")}</button>
        <button type="button" onClick={() => setPaused((value) => !value)} className="min-h-12 rounded-lg border border-slate-300 bg-white font-bold text-ink">{paused ? t(settings.language, "resume") : t(settings.language, "pause")}</button>
        <button type="button" onClick={finishSession} className="min-h-12 rounded-lg border border-red-300 bg-red-50 font-bold text-red-900">{t(settings.language, "end")}</button>
      </section>

      {paused && <div className="rounded-lg bg-slate-900 p-4 text-center font-bold text-white">{t(settings.language, "paused")}</div>}
      <button type="button" onClick={onExit} className="w-full py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{t(settings.language, "exitWithoutEnding")}</button>
    </div>
  );
}

function PromptText({ children }: { children: string }) {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-lg bg-slate-100 text-6xl font-black dark:bg-slate-800">
      {children}
    </div>
  );
}

function SelfCheckControls({
  revealed,
  answered,
  language,
  onReveal,
  onMark
}: {
  revealed: boolean;
  answered: boolean;
  language: AppSettings["language"];
  onReveal: () => void;
  onMark: (isCorrect: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      {!revealed ? (
        <button type="button" onClick={onReveal} className="min-h-14 w-full rounded-lg bg-ink text-lg font-bold text-white dark:bg-white dark:text-ink">
          {t(language, "revealAnswer")}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={answered} onClick={() => onMark(true)} className="min-h-14 rounded-lg bg-green-700 text-lg font-bold text-white">
            {t(language, "gotItRight")}
          </button>
          <button type="button" disabled={answered} onClick={() => onMark(false)} className="min-h-14 rounded-lg bg-red-700 text-lg font-bold text-white">
            {t(language, "gotItWrong")}
          </button>
        </div>
      )}
    </div>
  );
}

function PhraseAnswerPanel({ notes, language }: { notes: NonNullable<Question["notes"]>; language: AppSettings["language"] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-7 dark:border-slate-700 dark:bg-slate-900">
      <div><b>{t(language, "notesLabel")}:</b> {notes.map((note) => note.displayName).join(" ")}</div>
      <div><b>{t(language, "solfegeLabel")}:</b> {notes.map((note) => note.solfegeFixedDo).join(" ")}</div>
      <div><b>{t(language, "fingeringsLabel")}:</b> {notes.map((note) => formatValves(note.valves)).join(" ")}</div>
    </div>
  );
}

function SelfCheckAnswerPanel({ note, language }: { note: Question["note"]; language: AppSettings["language"] }) {
  const explanation = getNoteExplanation(note, language);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-7 dark:border-slate-700 dark:bg-slate-900">
      <div><b>{note.displayName}</b> / {note.solfegeFixedDo} · {t(language, "fingering")} {formatValves(note.valves)}</div>
      <div><b>{t(language, "staff")}:</b> {explanation.staffLocation}</div>
      <div>{explanation.landmarkHint}.</div>
      <div>{explanation.fingeringHint}. {explanation.solfegeHint}.</div>
    </div>
  );
}
