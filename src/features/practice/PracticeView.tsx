import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, Attempt, DifficultyLevel, NoteStats, PracticeDurationSec, PracticeMode, PracticeSession, Question, SelfCheckPromptType, Valve } from "../../types";
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
  durationSec: PracticeDurationSec;
  weakOnly?: boolean;
  selectedNoteIds?: string[];
  selfCheckPromptType?: SelfCheckPromptType;
  routineTitle?: string;
  routineStep?: number;
  routineTotal?: number;
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
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [paused, setPaused] = useState(false);
  const [remainingSec, setRemainingSec] = useState(config.durationSec);
  const [currentStreak, setCurrentStreak] = useState(0);
  const questionStartedAt = useRef(Date.now());
  const autoAdvanceRef = useRef<number | null>(null);
  const questionSectionRef = useRef<HTMLElement | null>(null);
  const [statusExpanded, setStatusExpanded] = useState(false);

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
    setSelectedAnswer("");
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
    setSelectedAnswer("");
    setSelectedValves([]);
    setQuestion(null);
    previousNoteIdRef.current = undefined;
  }, [config.durationSec, config.level, config.mode, config.weakOnly]);

  useEffect(() => {
    if (!question && activeNotes.length > 0) nextQuestion();
  }, [activeNotes.length, nextQuestion, question]);

  const currentQuestionId = question?.id;

  useEffect(() => {
    if (!currentQuestionId) return;
    const id = window.setTimeout(() => {
      questionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [currentQuestionId]);

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
      if (event.key === "Enter" && question && !isSelfCheckQuestion) {
        if (question.answerKind === "fingering") submitAnswer(selectedValves);
        else if (selectedAnswer) submitAnswer(selectedAnswer);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [feedback, nextQuestion, question, selectedAnswer, selectedValves, submitAnswer]);

  if (!question) {
    return <div className="py-8 text-center text-[#6E6E73]">{t(settings.language, "preparingPractice")}</div>;
  }

  const answered = Boolean(feedback);
  const isSelfCheck = question.mode === "instrument-self-check" || question.mode === "phrase-self-check";
  const progressLabel = config.durationSec === 0 ? `${attempts.length} questions` : formatDuration(remainingSec);
  const isFingeringQuestion = !isSelfCheck && question.answerKind === "fingering";
  const selectedAnswerLabel = isFingeringQuestion ? formatValves(selectedValves) : selectedAnswer;
  const canSubmit = !answered && !paused && !isSelfCheck && (isFingeringQuestion || selectedAnswer.length > 0);

  return (
    <div className="space-y-4 py-4">
      <section className="routine-strip sticky top-2 z-40 rounded-lg border border-black/10 px-3 py-2 shadow-lg backdrop-blur dark:border-white/10">
        <button
          type="button"
          onClick={() => setStatusExpanded((value) => !value)}
          aria-expanded={statusExpanded}
          aria-label={t(settings.language, statusExpanded ? "collapseStatus" : "expandStatus")}
          className="grid w-full grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 rounded-lg px-1 py-1 text-center text-xs text-[#6E6E73] transition active:scale-[0.99] active:bg-black/5 dark:text-[#A1A1AA] dark:active:bg-white/10"
        >
          <span className="truncate text-left font-bold text-[#1D1D1F] dark:text-white">{config.routineTitle ?? modeName(config.mode, settings.language)}</span>
          <span>{config.durationSec === 0 ? t(settings.language, "progress") : t(settings.language, "timer")} <b className="font-mono text-[#1D1D1F] dark:text-white">{progressLabel}</b></span>
          <span>{t(settings.language, "done")} <b className="text-[#1D1D1F] dark:text-white">{attempts.length}</b></span>
          <span>{t(settings.language, "streak")} <b className="text-[#1D1D1F] dark:text-white">{currentStreak}</b></span>
          <span aria-hidden="true" className={`text-base leading-none text-brass transition-transform ${statusExpanded ? "rotate-180" : ""}`}>⌄</span>
        </button>
        {statusExpanded && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/10 pt-3 text-sm text-[#1D1D1F] dark:border-white/10 dark:text-white">
            <div className="rounded-lg bg-[#F5F5F7] p-2 dark:bg-[#2A2A30]">
              <div className="text-xs uppercase text-[#86868B] dark:text-[#A1A1AA]">{t(settings.language, "mode")}</div>
              <div className="font-bold">{modeName(config.mode, settings.language)} {config.weakOnly ? `· ${t(settings.language, "weakNotes")}` : ""}</div>
            </div>
            <div className="rounded-lg bg-[#F5F5F7] p-2 dark:bg-[#2A2A30]">
              <div className="text-xs uppercase text-[#86868B] dark:text-[#A1A1AA]">{t(settings.language, "level")}</div>
              <div className="font-bold">{levelName(config.level, settings.language)}</div>
            </div>
            {config.routineStep && config.routineTotal ? (
              <div className="col-span-2 rounded-lg bg-[#F5F5F7] p-2 dark:bg-[#2A2A30]">
                <div className="text-xs uppercase text-[#86868B] dark:text-[#A1A1AA]">{t(settings.language, "todaysSession")}</div>
                <div className="font-bold">{t(settings.language, "routineStepProgress").replace("{current}", String(config.routineStep)).replace("{total}", String(config.routineTotal))}</div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section ref={questionSectionRef} className={`ivory-texture scroll-mt-20 space-y-3 rounded-lg border bg-white p-4 text-[#1D1D1F] shadow-xl dark:bg-[#1E1E22] dark:text-white ${feedback?.result === "correct" ? "border-[#34C759]" : feedback?.result === "wrong" ? "border-[#FF3B30]" : "border-black/10 dark:border-white/10"}`}>
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#6E6E73] dark:text-[#A1A1AA]">
          <span>{t(settings.language, "question")}</span>
          {config.routineStep && config.routineTotal ? <span>{config.routineStep}/{config.routineTotal}</span> : null}
        </div>
        {question.isPhrase && question.notes ? <StaffNote notes={question.notes} highlight={feedback?.result ?? null} language={settings.language} /> : null}
        {!question.isPhrase && question.promptType === "staff" && <StaffNote note={question.note} highlight={feedback?.result ?? null} language={settings.language} />}
        {question.promptType === "letter" && <PromptText>{question.note.displayName}</PromptText>}
        {question.promptType === "solfege" && <PromptText>{question.note.solfegeFixedDo}</PromptText>}
        {question.promptType === "fingering" && <PromptText>{formatValves(question.note.valves)}</PromptText>}
        {showHint && (
          <div className="rounded-lg border border-[#007AFF]/20 bg-[#EAF3FF] p-3 text-sm text-[#0B3D73] dark:border-[#60A5FA]/25 dark:bg-[#123255] dark:text-[#D9ECFF]">
            {t(settings.language, "hint")}: {staffHint(question.note, settings.language)}. {t(settings.language, "fingering")} {formatValves(question.note.valves)}.
          </div>
        )}
      </section>

      <section className="answer-surface space-y-3 rounded-lg border border-black/10 p-3 shadow-xl dark:border-white/10">
        {isSelfCheck && (
          <SelfCheckControls
            revealed={revealed}
            answered={answered}
            language={settings.language}
            onReveal={revealAnswer}
            onMark={markSelfCheck}
          />
        )}
        {!isSelfCheck && question.answerKind === "letter" && <LetterAnswerGrid notes={activeNotes} selectedAnswer={selectedAnswer} onSelect={setSelectedAnswer} disabled={answered || paused} />}
        {!isSelfCheck && question.answerKind === "solfege" && <SolfegeAnswerGrid notes={activeNotes} selectedAnswer={selectedAnswer} onSelect={setSelectedAnswer} disabled={answered || paused} />}
        {!isSelfCheck && question.answerKind === "fingering" && (
          <ValvePad selected={selectedValves} onChange={setSelectedValves} disabled={answered || paused} openLabel={t(settings.language, "open")} />
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

      <section className="sticky z-20 bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+3.8rem)]">
        <div className="grid grid-cols-[4.75rem_1fr_4.75rem] gap-2 rounded-2xl border border-black/10 bg-white/90 p-2 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#1E1E22]/90">
          <button type="button" onClick={() => setShowHint((value) => !value)} className="min-h-11 rounded-xl border border-black/10 bg-white text-sm font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white">{t(settings.language, "hint")}</button>
          {answered ? (
            <button type="button" onClick={nextQuestion} className="min-h-11 rounded-xl bg-brass text-lg font-bold text-white shadow-sm shadow-[#007AFF]/20">{t(settings.language, "next")}</button>
          ) : (
            <button type="button" onClick={() => submitAnswer(isFingeringQuestion ? selectedValves : selectedAnswer)} disabled={!canSubmit} className="min-h-11 rounded-xl bg-brass text-lg font-bold text-white shadow-sm shadow-[#007AFF]/20 disabled:bg-[#D1D1D6] disabled:text-[#86868B] disabled:shadow-none dark:disabled:bg-[#3A3A3C] dark:disabled:text-[#8E8E93]">
              {t(settings.language, "submit")} {selectedAnswerLabel}
            </button>
          )}
          <button type="button" onClick={() => setPaused((value) => !value)} className="min-h-11 rounded-xl border border-black/10 bg-white text-sm font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white">{paused ? t(settings.language, "resume") : t(settings.language, "pause")}</button>
        </div>
      </section>

      {paused && <div className="rounded-lg border border-black/10 bg-[#1D1D1F] p-4 text-center font-bold text-white dark:border-white/10 dark:bg-[#2A2A30]">{t(settings.language, "paused")}</div>}
      <section className="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onClick={finishSession} className="min-h-12 rounded-lg border border-[#FF3B30]/25 bg-[#FFF1F0] font-bold text-[#B42318] dark:border-[#FF453A]/35 dark:bg-[#3B1816] dark:text-[#FFB4AE]">{t(settings.language, "end")}</button>
        <button type="button" onClick={onExit} className="min-h-12 rounded-lg border border-black/10 bg-white font-semibold text-[#6E6E73] dark:border-white/10 dark:bg-[#1E1E22] dark:text-[#A1A1AA]">{t(settings.language, "exitWithoutEnding")}</button>
      </section>
    </div>
  );
}

function PromptText({ children }: { children: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg bg-[#FBFBFD] text-6xl font-black text-[#1D1D1F] shadow-inner ring-1 ring-black/10 dark:bg-[#2A2A30] dark:text-white dark:ring-white/10">
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
        <button type="button" onClick={onReveal} className="min-h-14 w-full rounded-lg bg-brass text-lg font-bold text-white shadow-sm shadow-[#007AFF]/20">
          {t(language, "revealAnswer")}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={answered} onClick={() => onMark(true)} className="min-h-14 rounded-lg bg-[#34C759] text-lg font-bold text-white disabled:opacity-55">
            {t(language, "gotItRight")}
          </button>
          <button type="button" disabled={answered} onClick={() => onMark(false)} className="min-h-14 rounded-lg bg-[#FF3B30] text-lg font-bold text-white disabled:opacity-55">
            {t(language, "gotItWrong")}
          </button>
        </div>
      )}
    </div>
  );
}

function PhraseAnswerPanel({ notes, language }: { notes: NonNullable<Question["notes"]>; language: AppSettings["language"] }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 text-sm leading-7 dark:border-white/10 dark:bg-[#1E1E22]">
      <div><b>{t(language, "notesLabel")}:</b> {notes.map((note) => note.displayName).join(" ")}</div>
      <div><b>{t(language, "solfegeLabel")}:</b> {notes.map((note) => note.solfegeFixedDo).join(" ")}</div>
      <div><b>{t(language, "fingeringsLabel")}:</b> {notes.map((note) => formatValves(note.valves)).join(" ")}</div>
    </div>
  );
}

function SelfCheckAnswerPanel({ note, language }: { note: Question["note"]; language: AppSettings["language"] }) {
  const explanation = getNoteExplanation(note, language);
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 text-sm leading-7 dark:border-white/10 dark:bg-[#1E1E22]">
      <div><b>{note.displayName}</b> / {note.solfegeFixedDo} · {t(language, "fingering")} {formatValves(note.valves)}</div>
      <div><b>{t(language, "staff")}:</b> {explanation.staffLocation}</div>
      <div>{explanation.landmarkHint}.</div>
      <div>{explanation.fingeringHint}. {explanation.solfegeHint}.</div>
    </div>
  );
}
