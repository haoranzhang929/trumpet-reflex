import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, Attempt, DifficultyLevel, NoteStats, PracticeDurationSec, PracticeMode, PracticeSession, SelfCheckPromptType } from "../types";
import { levels } from "../data/levels";
import { trainingModes } from "../data/modes";
import { notes } from "../data/notes";
import { defaultSettings, loadSettings, resetSettings, saveSettings } from "../storage/settingsStorage";
import { exportJson, importJson } from "../storage/exportImport";
import { getAllAttempts, getAllSessions, resetDatabase } from "../storage/db";
import { deriveNoteStats, getWeakNotes } from "../features/practice/sessionStats";
import { PracticeView } from "../features/practice/PracticeView";
import { ReferenceView } from "../features/reference/ReferenceView";
import { ReviewView } from "../features/review/ReviewView";
import { SettingsView } from "../features/settings/SettingsView";
import { percent } from "../utils/stats";
import { durationName, levelName, modeName, t } from "../i18n";
import { drillPresets } from "../data/drillPresets";
import { getLaunchIntent } from "./launchIntent";
import { createTodaySessionRoutine, type TodaySessionStep } from "../features/practice/todaySession";
import { buildProgressionSummary, type ProgressionSummary } from "../features/practice/progression";

type View = "home" | "practiceMenu" | "practice" | "review" | "settings" | "reference";
type PracticeStartConfig = {
  mode?: PracticeMode;
  level?: DifficultyLevel;
  durationSec?: PracticeDurationSec;
  weakOnly?: boolean;
  selectedNoteIds?: string[];
  selfCheckPromptType?: SelfCheckPromptType;
  routineStepId?: string;
};

export default function App() {
  const launchIntentHandled = useRef(false);
  const [view, setView] = useState<View>("home");
  const [showHelp, setShowHelp] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [practiceConfig, setPracticeConfig] = useState<{
    mode: PracticeMode;
    level: DifficultyLevel;
    durationSec: PracticeDurationSec;
    weakOnly?: boolean;
    selectedNoteIds?: string[];
    selfCheckPromptType?: SelfCheckPromptType;
    routineTitle?: string;
    routineStepId?: string;
    routineStep?: number;
    routineTotal?: number;
  }>({
    mode: settings.defaultMode,
    level: settings.defaultLevel,
    durationSec: settings.defaultSessionLengthSec
  });
  const [todayRoutine, setTodayRoutine] = useState<TodaySessionStep[] | null>(null);
  const [todayRoutineIndex, setTodayRoutineIndex] = useState(0);

  const refreshData = async () => {
    const [storedAttempts, storedSessions] = await Promise.all([getAllAttempts(), getAllSessions()]);
    setAttempts(storedAttempts);
    setSessions(storedSessions);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.dataset.theme = settings.theme;
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      document.getElementById("app-theme-color")?.setAttribute("content", isDark ? "#111113" : "#F5F5F7");
    };
    applyTheme();
    if (settings.theme !== "system") return;
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings.theme]);

  const noteStats = useMemo(() => deriveNoteStats(attempts), [attempts]);
  const weakNotes = useMemo(() => getWeakNotes(noteStats), [noteStats]);
  const progression = useMemo(() => buildProgressionSummary(attempts, noteStats), [attempts, noteStats]);
  const lastSession = [...sessions].reverse().find((session) => session.totalQuestions > 0);
  const totalCorrect = attempts.filter((attempt) => attempt.isCorrect).length;

  const updateSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const navigateTo = useCallback((nextView: View) => {
    setView(nextView);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const startPractice = useCallback((config: Partial<typeof practiceConfig> = {}) => {
    setTodayRoutine(null);
    setTodayRoutineIndex(0);
    setPracticeConfig({
      mode: config.mode ?? settings.defaultMode,
      level: config.level ?? settings.defaultLevel,
      durationSec: config.durationSec ?? settings.defaultSessionLengthSec,
      weakOnly: config.weakOnly ?? false,
      selectedNoteIds: config.selectedNoteIds,
      selfCheckPromptType: config.selfCheckPromptType,
      routineTitle: config.routineTitle,
      routineStepId: config.routineStepId,
      routineStep: config.routineStep,
      routineTotal: config.routineTotal
    });
    navigateTo("practice");
  }, [navigateTo, settings.defaultLevel, settings.defaultMode, settings.defaultSessionLengthSec]);

  const startTodaySession = useCallback(() => {
    const routine = createTodaySessionRoutine(progression.recommendedLevel);
    const firstStep = routine[0];
    setTodayRoutine(routine);
    setTodayRoutineIndex(0);
    setPracticeConfig({
      mode: firstStep.mode,
      level: firstStep.level,
      durationSec: firstStep.durationSec,
      weakOnly: firstStep.weakOnly ?? false,
      selfCheckPromptType: firstStep.selfCheckPromptType,
      routineTitle: t(settings.language, firstStep.titleKey),
      routineStepId: firstStep.id,
      routineStep: 1,
      routineTotal: routine.length
    });
    navigateTo("practice");
  }, [navigateTo, progression.recommendedLevel, settings.language]);

  const continueTodaySession = useCallback(() => {
    if (!todayRoutine) return false;
    const nextIndex = todayRoutineIndex + 1;
    const nextStep = todayRoutine[nextIndex];
    if (!nextStep) {
      setTodayRoutine(null);
      setTodayRoutineIndex(0);
      return false;
    }
    setTodayRoutineIndex(nextIndex);
    setPracticeConfig({
      mode: nextStep.mode,
      level: nextStep.level,
      durationSec: nextStep.durationSec,
      weakOnly: nextStep.weakOnly ?? false,
      selfCheckPromptType: nextStep.selfCheckPromptType,
      routineTitle: t(settings.language, nextStep.titleKey),
      routineStepId: nextStep.id,
      routineStep: nextIndex + 1,
      routineTotal: todayRoutine.length
    });
    navigateTo("practice");
    return true;
  }, [navigateTo, settings.language, todayRoutine, todayRoutineIndex]);

  useEffect(() => {
    if (launchIntentHandled.current) return;
    launchIntentHandled.current = true;

    const launchIntent = getLaunchIntent(window.location.search);
    if (!launchIntent) return;

    if (launchIntent.type === "practice" && launchIntent.mode === "mixed") {
      startPractice({ mode: "mixed" });
    } else if (launchIntent.type === "view") {
      navigateTo("review");
    } else if (launchIntent.type === "preset") {
      const preset = drillPresets.find((item) => item.id === launchIntent.presetId);
      if (preset) startPractice({ mode: preset.recommendedMode, level: "custom", selectedNoteIds: preset.noteIds, durationSec: 0 });
    }

    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
  }, [navigateTo, startPractice]);

  const handleExport = async () => {
    const text = await exportJson();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `trumpet-reflex-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    await importJson(await file.text());
    setSettings(loadSettings());
    await refreshData();
  };

  const handleReset = async () => {
    if (!confirm(t(settings.language, "resetConfirm"))) return;
    await resetDatabase();
    resetSettings();
    setSettings(defaultSettings);
    await refreshData();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] dark:bg-[#111113] dark:text-[#F4F4F5]">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-4 sm:px-6">
        <header className="flex items-center justify-between py-2">
          <button type="button" onClick={() => navigateTo("home")} className="text-left">
            <div className="text-xl font-black leading-tight text-[#1D1D1F] dark:text-white">Trumpet Reflex</div>
            <div className="text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "subtitle")}</div>
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-bold text-[#1D1D1F] shadow-sm dark:border-white/10 dark:bg-[#1E1E22] dark:text-white"
          >
            {t(settings.language, "help")}
          </button>
        </header>

        <main className="flex-1">
          {view === "home" && (
            <HomeView
              settings={settings}
              lastSession={lastSession}
              totalQuestions={attempts.length}
              totalAccuracy={percent(totalCorrect, attempts.length)}
              weakNotes={weakNotes}
              progression={progression}
              startPractice={startPractice}
              startTodaySession={startTodaySession}
              setView={navigateTo}
              openHelp={() => setShowHelp(true)}
            />
          )}
          {view === "practiceMenu" && <PracticeMenuView settings={settings} startPractice={startPractice} />}
          {view === "practice" && (
            <PracticeView
              config={practiceConfig}
              settings={settings}
              noteStats={noteStats}
              weakNoteIds={weakNotes.map((stat) => stat.noteId)}
              onFinished={async () => {
                await refreshData();
                if (!continueTodaySession()) navigateTo("review");
              }}
              onExit={async () => {
                await refreshData();
                setTodayRoutine(null);
                setTodayRoutineIndex(0);
                navigateTo("home");
              }}
            />
          )}
          {view === "review" && <ReviewView attempts={attempts} sessions={sessions} noteStats={noteStats} language={settings.language} onPracticeWeak={() => startPractice({ weakOnly: true, durationSec: 300 })} />}
          {view === "settings" && (
            <SettingsView
              settings={settings}
              onChange={updateSettings}
              onExport={handleExport}
              onImport={handleImport}
              onReset={handleReset}
            />
          )}
          {view === "reference" && <ReferenceView language={settings.language} />}
        </main>

        <nav className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white/78 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#111113]/78">
          <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 text-[13px] font-semibold leading-tight">
            {([
              ["home", "home"],
              ["review", "review"],
              ["practiceMenu", "navStart"],
              ["reference", "navReference"],
              ["settings", "navSettings"]
            ] as const).map(([item, labelKey]) => (
              <button
                key={item}
                type="button"
                onClick={() => navigateTo(item)}
                className={navButtonClass(item, view)}
              >
                {item === "practiceMenu" ? (
                  <span className="relative z-10">{t(settings.language, labelKey)}</span>
                ) : (
                  t(settings.language, labelKey)
                )}
              </button>
            ))}
          </div>
        </nav>
        {showHelp && <HelpDialog language={settings.language} onClose={() => setShowHelp(false)} />}
      </div>
    </div>
  );
}

function navButtonClass(item: View, view: View): string {
  const isActive = view === item || (item === "practiceMenu" && view === "practice");
  if (item === "practiceMenu") {
    return [
      "relative min-w-0 truncate rounded-lg px-1 py-2 text-base font-bold capitalize",
      isActive
        ? "bg-[#007AFF]/10 text-brass dark:bg-[#60A5FA]/18 dark:text-[#93C5FD]"
        : "nav-practice-tab text-brass dark:text-[#93C5FD]"
    ].join(" ");
  }
  return `min-w-0 truncate rounded-lg px-1 py-2 capitalize ${
    isActive
      ? "bg-[#007AFF]/10 text-brass dark:bg-[#60A5FA]/18 dark:text-[#93C5FD]"
      : "text-[#6E6E73] dark:text-[#A1A1AA]"
  }`;
}

function PracticeMenuView({
  settings,
  startPractice
}: {
  settings: AppSettings;
  startPractice: (config?: PracticeStartConfig) => void;
}) {
  const [mode, setMode] = useState<PracticeMode>(settings.defaultMode);
  const [level, setLevel] = useState<DifficultyLevel>(settings.defaultLevel);
  const [durationSec, setDurationSec] = useState<0 | 180 | 300 | 600>(settings.defaultSessionLengthSec);
  const [selfCheckPromptType, setSelfCheckPromptType] = useState<SelfCheckPromptType>("staff");

  return (
    <div className="space-y-5 py-4">
      <section>
        <h1 className="text-2xl font-black">{t(settings.language, "practiceMenuTitle")}</h1>
        <p className="mt-1 text-sm leading-6 text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "practiceMenuIntro")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {t(settings.language, "mode")}
            <select value={mode} onChange={(event) => setMode(event.target.value as PracticeMode)} className="mt-1 w-full rounded-lg border border-black/10 bg-white p-3 text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white">
              {trainingModes.map((item) => <option key={item.id} value={item.id}>{modeName(item.id, settings.language)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t(settings.language, "level")}
            <select value={level} onChange={(event) => setLevel(event.target.value as DifficultyLevel)} className="mt-1 w-full rounded-lg border border-black/10 bg-white p-3 text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white">
              {levels.map((item) => <option key={item.id} value={item.id}>{levelName(item.id, settings.language)}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">
          {t(settings.language, "defaultSessionLength")}
          <select value={durationSec} onChange={(event) => setDurationSec(Number(event.target.value) as 0 | 180 | 300 | 600)} className="mt-1 w-full rounded-lg border border-black/10 bg-white p-3 text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white">
            <option value="0">{durationName(0, settings.language)}</option>
            <option value="180">{durationName(180, settings.language)}</option>
            <option value="300">{durationName(300, settings.language)}</option>
            <option value="600">{durationName(600, settings.language)}</option>
          </select>
        </label>
        {mode === "instrument-self-check" && (
          <label className="block text-sm font-semibold">
            {t(settings.language, "selfCheckPrompt")}
            <select value={selfCheckPromptType} onChange={(event) => setSelfCheckPromptType(event.target.value as SelfCheckPromptType)} className="mt-1 w-full rounded-lg border border-black/10 bg-white p-3 text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white">
              <option value="staff">{t(settings.language, "selfCheckPromptStaff")}</option>
              <option value="letter">{t(settings.language, "selfCheckPromptLetter")}</option>
              <option value="solfege">{t(settings.language, "selfCheckPromptSolfege")}</option>
            </select>
          </label>
        )}
        <div className="rounded-lg bg-[#F5F5F7] p-3 text-sm dark:bg-[#2A2A30]">
          <b>{t(settings.language, "currentChoice")}:</b> {modeName(mode, settings.language)} · {levelName(level, settings.language)} · {durationName(durationSec, settings.language)}
        </div>
        <button type="button" onClick={() => startPractice({ mode, level, durationSec, selfCheckPromptType: mode === "instrument-self-check" ? selfCheckPromptType : undefined })} className="min-h-14 w-full rounded-lg bg-brass text-lg font-bold text-white">
          {t(settings.language, "startSelectedPractice")}
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => startPractice({ mode: "staff-fingering", level: "anchors", durationSec: 0 })} className="shift-tile min-h-16 rounded-lg border border-black/10 bg-white p-3 text-left font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
          {t(settings.language, "startAnchorDrill")}
          <span className="mt-1 block text-sm font-normal text-[#6E6E73] dark:text-[#A1A1AA]">{modeName("staff-fingering", settings.language)}</span>
        </button>
        <button type="button" onClick={() => startPractice({ mode, level, durationSec: 0 })} className="shift-tile min-h-16 rounded-lg border border-black/10 bg-white p-3 text-left font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
          {t(settings.language, "unlimitedPractice")}
          <span className="mt-1 block text-sm font-normal text-[#6E6E73] dark:text-[#A1A1AA]">{modeName(mode, settings.language)}</span>
        </button>
        <button type="button" onClick={() => startPractice({ mode: "mixed", level: settings.defaultLevel, durationSec: 600 })} className="shift-tile min-h-16 rounded-lg border border-black/10 bg-white p-3 text-left font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
          {t(settings.language, "timedPractice")}
          <span className="mt-1 block text-sm font-normal text-[#6E6E73] dark:text-[#A1A1AA]">{modeName("mixed", settings.language)} · {durationName(600, settings.language)}</span>
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t(settings.language, "drillPresets")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {drillPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => startPractice({ mode: preset.recommendedMode, level: "custom", selectedNoteIds: preset.noteIds, durationSec: 0 })}
              className="shift-tile rounded-lg border border-black/10 bg-white p-4 text-left dark:border-white/10 dark:bg-[#1E1E22]"
            >
              <div className="font-bold">{presetCopy(settings.language, preset.title, preset.titleZh)}</div>
              <div className="mt-1 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{presetCopy(settings.language, preset.description, preset.descriptionZh)}</div>
              <div className="mt-2 text-xs font-semibold text-[#86868B]">{preset.noteIds.map((id) => notes.find((note) => note.id === id)?.displayName).join(" ")}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function HomeView({
  settings,
  lastSession,
  totalQuestions,
  totalAccuracy,
  weakNotes,
  progression,
  startPractice,
  startTodaySession,
  setView,
  openHelp
}: {
  settings: AppSettings;
  lastSession?: PracticeSession;
  totalQuestions: number;
  totalAccuracy: number;
  weakNotes: NoteStats[];
  progression: ProgressionSummary;
  startPractice: (config?: PracticeStartConfig) => void;
  startTodaySession: () => void;
  setView: (view: View) => void;
  openHelp: () => void;
}) {
  const [pathExpanded, setPathExpanded] = useState(false);
  const recommendedProgress = progression.levels.find((item) => item.level === progression.recommendedLevel);

  return (
    <div className="space-y-5 py-4">
      <section className="cult-texture space-y-5 rounded-lg border border-black/10 bg-white p-5 text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
        <div>
          <h1 className="text-3xl font-black leading-tight">{t(settings.language, "homeHeroTitle")}</h1>
          <p className="mt-2 text-base font-semibold text-[#1D1D1F] dark:text-white">{t(settings.language, "homeValueProp")}</p>
          <p className="mt-1 text-sm leading-6 text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "homeReflexChain")}</p>
        </div>
        <button type="button" onClick={startTodaySession} className="brass-animate-button min-h-16 w-full overflow-hidden rounded-lg px-4 py-3 text-left text-lg font-black leading-tight text-white shadow-lg shadow-[#007AFF]/20">
          <span className="block max-w-full text-wrap break-words">{t(settings.language, "startTodaySession")}</span>
          <span className="mt-1 block max-w-full text-wrap break-words text-sm font-medium leading-snug text-white/82">
            {t(settings.language, "todaySessionSubcopy")} · {levelName(progression.recommendedLevel, settings.language)}
          </span>
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="shift-tile rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#1E1E22]">
          <div className="text-xs font-bold uppercase text-[#86868B] dark:text-[#A1A1AA]">{t(settings.language, "questions")}</div>
          <div className="mt-1 text-2xl font-black text-[#1D1D1F] dark:text-white">{totalQuestions}</div>
        </div>
        <div className="shift-tile rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#1E1E22]">
          <div className="text-xs font-bold uppercase text-[#86868B] dark:text-[#A1A1AA]">{t(settings.language, "accuracy")}</div>
          <div className="mt-1 text-2xl font-black text-[#1D1D1F] dark:text-white">{totalAccuracy}%</div>
        </div>
        <div className="shift-tile rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#1E1E22]">
          <div className="text-xs font-bold uppercase text-[#86868B] dark:text-[#A1A1AA]">{t(settings.language, "last")}</div>
          <div className="mt-1 text-2xl font-black text-[#1D1D1F] dark:text-white">{lastSession ? `${lastSession.correctCount}/${lastSession.totalQuestions}` : t(settings.language, "none")}</div>
        </div>
      </section>

      <section className="ivory-texture rounded-lg border border-black/10 bg-white p-4 text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{t(settings.language, "todaysFocus")}</h2>
            <p className="mt-1 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">
              {weakNotes.length > 0
                ? weakNotes.slice(0, 3).map((stat) => notes.find((note) => note.id === stat.noteId)?.displayName).join(" · ")
                : t(settings.language, "todayFocusEmpty")}
            </p>
          </div>
          <button type="button" onClick={() => startPractice({ weakOnly: true, durationSec: 300 })} className="min-h-11 rounded-lg bg-[#1D1D1F] px-3 text-sm font-bold text-white dark:bg-white dark:text-[#1D1D1F]">
            {t(settings.language, "weakNotes")}
          </button>
        </div>
        {lastSession && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]"><b>{lastSession.correctCount}/{lastSession.totalQuestions}</b><span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "lastScore")}</span></div>
            <div className="rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]"><b>{formatMsSafe(lastSession.medianReactionMs)}</b><span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "median")}</span></div>
            <div className="rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]"><b>{lastSession.maxStreak}</b><span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "streak")}</span></div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{t(settings.language, "learningPath")}</h2>
            <p className="mt-1 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">
              {t(settings.language, "recommendedLevel")}: {levelName(progression.recommendedLevel, settings.language)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => startPractice({ mode: "mixed", level: progression.recommendedLevel, durationSec: 600 })}
            className="min-h-11 rounded-lg bg-brass px-3 text-sm font-bold text-white"
          >
            {t(settings.language, "trainThisLevel")}
          </button>
        </div>
        {recommendedProgress ? (
          <div className="mt-3 rounded-lg bg-[#F5F5F7] p-3 text-sm dark:bg-[#2A2A30]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{levelName(recommendedProgress.level, settings.language)}</span>
              <span className="text-xs font-bold text-[#6E6E73] dark:text-[#A1A1AA]">{recommendedProgress.accuracy}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brass"
                style={{ width: `${Math.min(100, Math.round((recommendedProgress.attemptedNotes / recommendedProgress.totalNotes) * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#A1A1AA]">
              {recommendedProgress.attemptedNotes}/{recommendedProgress.totalNotes} {t(settings.language, "notesLabel")} · {recommendedProgress.totalAttempts} {t(settings.language, "questions")}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setPathExpanded((value) => !value)}
          className="mt-3 min-h-10 w-full rounded-lg border border-black/10 bg-white text-sm font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white"
        >
          {pathExpanded ? t(settings.language, "hideLearningPath") : t(settings.language, "showLearningPath")}
        </button>
        {pathExpanded && (
          <div className="mt-3 grid gap-2">
            {progression.levels.map((item, index) => (
              <button
                key={item.level}
                type="button"
                onClick={() => startPractice({ mode: "mixed", level: item.level, durationSec: 300 })}
                className={`grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg p-3 text-left ${
                  item.level === progression.recommendedLevel
                    ? "bg-[#EAF3FF] text-[#1D1D1F] ring-1 ring-[#007AFF]/25 dark:bg-[#17304D] dark:text-white"
                    : "bg-[#F5F5F7] text-[#1D1D1F] dark:bg-[#2A2A30] dark:text-white"
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${item.isMastered ? "bg-[#34C759] text-white" : "bg-white text-[#6E6E73] dark:bg-[#1E1E22] dark:text-[#A1A1AA]"}`}>
                  {item.isMastered ? "✓" : index + 1}
                </span>
                <span>
                  <span className="block font-bold">{levelName(item.level, settings.language)}</span>
                  <span className="block text-xs text-[#6E6E73] dark:text-[#A1A1AA]">
                    {item.attemptedNotes}/{item.totalNotes} {t(settings.language, "notesLabel")} · {item.totalAttempts} {t(settings.language, "questions")} · {item.accuracy}%
                  </span>
                </span>
                <span className="text-xs font-bold text-[#6E6E73] dark:text-[#A1A1AA]">
                  {item.isMastered ? t(settings.language, "mastered") : item.level === progression.recommendedLevel ? t(settings.language, "now") : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => startPractice({ mode: "mixed", durationSec: 600 })} className="shift-tile min-h-16 rounded-lg border border-black/10 bg-white p-3 text-left font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
          {modeName("mixed", settings.language)}
          <span className="mt-1 block text-sm font-normal text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "shortcutMixedSubcopy")}</span>
        </button>
        <button type="button" onClick={() => startPractice({ mode: "instrument-self-check", durationSec: 300 })} className="shift-tile min-h-16 rounded-lg border border-black/10 bg-white p-3 text-left font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
          {modeName("instrument-self-check", settings.language)}
          <span className="mt-1 block text-sm font-normal text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "shortcutSelfCheckSubcopy")}</span>
        </button>
        <button type="button" onClick={() => startPractice({ mode: "phrase-self-check", durationSec: 300 })} className="shift-tile min-h-16 rounded-lg border border-black/10 bg-white p-3 text-left font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
          {modeName("phrase-self-check", settings.language)}
          <span className="mt-1 block text-sm font-normal text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "shortcutPhraseSubcopy")}</span>
        </button>
        <button type="button" onClick={() => setView("reference")} className="shift-tile min-h-16 rounded-lg border border-black/10 bg-white p-3 text-left font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
          {t(settings.language, "reference")}
          <span className="mt-1 block text-sm font-normal text-[#6E6E73] dark:text-[#A1A1AA]">{t(settings.language, "shortcutReferenceSubcopy")}</span>
        </button>
      </section>

      <section className="cult-texture space-y-3 rounded-lg border border-black/10 bg-white p-4 text-[#1D1D1F] dark:border-white/10 dark:bg-[#1E1E22] dark:text-white">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t(settings.language, "drillPresets")}</h2>
          <button type="button" onClick={openHelp} className="rounded-lg border border-black/10 bg-[#F5F5F7] px-3 py-2 text-sm font-bold text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white">
            {t(settings.language, "howItWorks")}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {drillPresets.slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => startPractice({ mode: preset.recommendedMode, level: "custom", selectedNoteIds: preset.noteIds, durationSec: 0 })}
              className="shift-tile rounded-lg border border-black/10 bg-[#F5F5F7] p-3 text-left dark:border-white/10 dark:bg-[#2A2A30]"
            >
              <div className="font-bold">{presetCopy(settings.language, preset.title, preset.titleZh)}</div>
              <div className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1AA]">{preset.noteIds.map((id) => notes.find((note) => note.id === id)?.displayName).join(" ")}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatMsSafe(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${(value / 1000).toFixed(1)}s`;
}

function HelpDialog({ language, onClose }: { language: AppSettings["language"]; onClose: () => void }) {
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };
  }, []);

  return (
    <div className="help-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/45 p-4">
      <section className="help-dialog max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-lg bg-white p-5 text-[#1D1D1F] shadow-2xl dark:bg-[#1E1E22] dark:text-white">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-black">{t(language, "howItWorks")}</h2>
            <p className="mt-1 text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "firstTimeIntro")}</p>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-[4.75rem] shrink-0 whitespace-nowrap rounded-lg border border-black/10 px-3 py-2 text-sm font-bold dark:border-white/10">
            {t(language, "close")}
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {[
            ["helpPathTitle", "helpPathBody"],
            ["helpTenMinuteTitle", "helpTenMinuteBody"],
            ["helpReviewTitle", "helpReviewBody"]
          ].map(([titleKey, bodyKey]) => (
            <div key={titleKey} className="rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]">
              <h3 className="font-black">{t(language, titleKey)}</h3>
              <p className="mt-1 text-sm leading-5 text-[#3A3A3C] dark:text-[#F4F4F5]">{t(language, bodyKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {[
            "helpQuickMixed",
            "helpQuickSelfCheck",
            "helpQuickPhrase",
            "helpQuickReference"
          ].map((key) => (
            <div key={key} className="rounded-lg border border-black/10 p-3 text-[#3A3A3C] dark:border-white/10 dark:text-[#F4F4F5]">
              {t(language, key)}
            </div>
          ))}
        </div>

        <details className="mt-4 rounded-lg bg-[#1D1D1F] p-3 text-sm text-white dark:bg-[#2A2A30] dark:text-[#F4F4F5]">
          <summary className="cursor-pointer font-bold">{t(language, "keyboardShortcuts")}</summary>
          <p className="mt-2 leading-5">{t(language, "keyboardHelp")}</p>
        </details>
      </section>
    </div>
  );
}

function presetCopy(language: AppSettings["language"], english: string, chinese: string): string {
  if (language === "zh") return chinese;
  return english;
}
