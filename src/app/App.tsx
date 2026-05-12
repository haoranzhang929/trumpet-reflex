import { useEffect, useMemo, useState } from "react";
import type { AppSettings, Attempt, DifficultyLevel, NoteStats, PracticeMode, PracticeSession, SelfCheckPromptType } from "../types";
import { levels } from "../data/levels";
import { trainingModes } from "../data/modes";
import { notes, formatValves } from "../data/notes";
import { defaultSettings, loadSettings, resetSettings, saveSettings } from "../storage/settingsStorage";
import { exportJson, importJson } from "../storage/exportImport";
import { getAllAttempts, getAllSessions, resetDatabase } from "../storage/db";
import { deriveNoteStats, getWeakNotes } from "../features/practice/sessionStats";
import { PracticeView } from "../features/practice/PracticeView";
import { ReferenceView } from "../features/reference/ReferenceView";
import { ReviewView } from "../features/review/ReviewView";
import { SettingsView } from "../features/settings/SettingsView";
import { WeakNotesList } from "../components/WeakNotesList";
import { StatCard } from "../components/StatCard";
import { percent } from "../utils/stats";
import { durationName, levelName, modeName, t } from "../i18n";
import { drillPresets } from "../data/drillPresets";

type View = "home" | "practiceMenu" | "practice" | "review" | "settings" | "reference";
type PracticeStartConfig = {
  mode?: PracticeMode;
  level?: DifficultyLevel;
  durationSec?: 0 | 180 | 300 | 600;
  weakOnly?: boolean;
  selectedNoteIds?: string[];
  selfCheckPromptType?: SelfCheckPromptType;
};

export default function App() {
  const [view, setView] = useState<View>("home");
  const [showHelp, setShowHelp] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [practiceConfig, setPracticeConfig] = useState<{
    mode: PracticeMode;
    level: DifficultyLevel;
    durationSec: 0 | 180 | 300 | 600;
    weakOnly?: boolean;
    selectedNoteIds?: string[];
    selfCheckPromptType?: SelfCheckPromptType;
  }>({
    mode: settings.defaultMode,
    level: settings.defaultLevel,
    durationSec: settings.defaultSessionLengthSec
  });

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
      document.getElementById("app-theme-color")?.setAttribute("content", isDark ? "#000000" : "#f5f5f7");
    };
    applyTheme();
    if (settings.theme !== "system") return;
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings.theme]);

  const noteStats = useMemo(() => deriveNoteStats(attempts), [attempts]);
  const weakNotes = useMemo(() => getWeakNotes(noteStats), [noteStats]);
  const lastSession = sessions[sessions.length - 1];
  const totalCorrect = attempts.filter((attempt) => attempt.isCorrect).length;

  const updateSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const navigateTo = (nextView: View) => {
    setView(nextView);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const startPractice = (config: Partial<typeof practiceConfig> = {}) => {
    setPracticeConfig({
      mode: config.mode ?? settings.defaultMode,
      level: config.level ?? settings.defaultLevel,
      durationSec: config.durationSec ?? settings.defaultSessionLengthSec,
      weakOnly: config.weakOnly ?? false,
      selectedNoteIds: config.selectedNoteIds,
      selfCheckPromptType: config.selfCheckPromptType
    });
    navigateTo("practice");
  };

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
    <div className="min-h-screen bg-paper text-ink dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-4 sm:px-6">
        <header className="flex items-center justify-between py-2">
          <button type="button" onClick={() => navigateTo("home")} className="text-left">
            <div className="text-xl font-black leading-tight">Trumpet Reflex Trainer</div>
            <div className="text-xs text-slate-600 dark:text-slate-300">{t(settings.language, "subtitle")}</div>
          </button>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
              startPractice={startPractice}
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
                navigateTo("review");
              }}
              onExit={async () => {
                await refreshData();
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

        <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto grid max-w-3xl grid-cols-5 gap-2 text-xs font-semibold">
            {([
              ["home", "home"],
              ["practiceMenu", "practice"],
              ["review", "review"],
              ["reference", "reference"],
              ["settings", "settings"]
            ] as const).map(([item, labelKey]) => (
              <button
                key={item}
                type="button"
                onClick={() => navigateTo(item)}
                className={`rounded-lg px-2 py-2 capitalize ${view === item || (item === "practiceMenu" && view === "practice") ? "bg-ink text-white dark:bg-white dark:text-ink" : "text-slate-600 dark:text-slate-300"}`}
              >
                {t(settings.language, labelKey)}
              </button>
            ))}
          </div>
        </nav>
        {showHelp && <HelpDialog language={settings.language} onClose={() => setShowHelp(false)} />}
      </div>
    </div>
  );
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
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t(settings.language, "practiceMenuIntro")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {t(settings.language, "mode")}
            <select value={mode} onChange={(event) => setMode(event.target.value as PracticeMode)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink">
              {trainingModes.map((item) => <option key={item.id} value={item.id}>{modeName(item.id, settings.language)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t(settings.language, "level")}
            <select value={level} onChange={(event) => setLevel(event.target.value as DifficultyLevel)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink">
              {levels.map((item) => <option key={item.id} value={item.id}>{levelName(item.id, settings.language)}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">
          {t(settings.language, "defaultSessionLength")}
          <select value={durationSec} onChange={(event) => setDurationSec(Number(event.target.value) as 0 | 180 | 300 | 600)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink">
            <option value="0">{durationName(0, settings.language)}</option>
            <option value="180">{durationName(180, settings.language)}</option>
            <option value="300">{durationName(300, settings.language)}</option>
            <option value="600">{durationName(600, settings.language)}</option>
          </select>
        </label>
        {mode === "instrument-self-check" && (
          <label className="block text-sm font-semibold">
            {t(settings.language, "selfCheckPrompt")}
            <select value={selfCheckPromptType} onChange={(event) => setSelfCheckPromptType(event.target.value as SelfCheckPromptType)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink">
              <option value="staff">{t(settings.language, "selfCheckPromptStaff")}</option>
              <option value="letter">{t(settings.language, "selfCheckPromptLetter")}</option>
              <option value="solfege">{t(settings.language, "selfCheckPromptSolfege")}</option>
            </select>
          </label>
        )}
        <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
          <b>{t(settings.language, "currentChoice")}:</b> {modeName(mode, settings.language)} · {levelName(level, settings.language)} · {durationName(durationSec, settings.language)}
        </div>
        <button type="button" onClick={() => startPractice({ mode, level, durationSec, selfCheckPromptType: mode === "instrument-self-check" ? selfCheckPromptType : undefined })} className="min-h-14 w-full rounded-lg bg-ink text-lg font-bold text-white dark:bg-white dark:text-ink">
          {t(settings.language, "startSelectedPractice")}
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => startPractice({ mode: "staff-fingering", level: "anchors", durationSec: 0 })} className="min-h-16 rounded-lg border border-slate-300 bg-white p-3 text-left font-bold text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          {t(settings.language, "startAnchorDrill")}
          <span className="mt-1 block text-sm font-normal text-slate-600 dark:text-slate-300">{modeName("staff-fingering", settings.language)}</span>
        </button>
        <button type="button" onClick={() => startPractice({ mode, level, durationSec: 0 })} className="min-h-16 rounded-lg border border-slate-300 bg-white p-3 text-left font-bold text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          {t(settings.language, "unlimitedPractice")}
          <span className="mt-1 block text-sm font-normal text-slate-600 dark:text-slate-300">{modeName(mode, settings.language)}</span>
        </button>
        <button type="button" onClick={() => startPractice({ mode: "mixed", level: settings.defaultLevel, durationSec: 600 })} className="min-h-16 rounded-lg border border-slate-300 bg-white p-3 text-left font-bold text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          {t(settings.language, "timedPractice")}
          <span className="mt-1 block text-sm font-normal text-slate-600 dark:text-slate-300">{modeName("mixed", settings.language)} · {durationName(600, settings.language)}</span>
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
              className="rounded-lg border border-slate-200 bg-white p-4 text-left dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="font-bold">{presetCopy(settings.language, preset.title, preset.titleZh)}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{presetCopy(settings.language, preset.description, preset.descriptionZh)}</div>
              <div className="mt-2 text-xs font-semibold text-slate-500">{preset.noteIds.map((id) => notes.find((note) => note.id === id)?.displayName).join(" ")}</div>
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
  startPractice,
  setView,
  openHelp
}: {
  settings: AppSettings;
  lastSession?: PracticeSession;
  totalQuestions: number;
  totalAccuracy: number;
  weakNotes: NoteStats[];
  startPractice: (config?: PracticeStartConfig) => void;
  setView: (view: View) => void;
  openHelp: () => void;
}) {
  const [mode, setMode] = useState<PracticeMode>(settings.defaultMode);
  const [level, setLevel] = useState<DifficultyLevel>(settings.defaultLevel);

  return (
    <div className="space-y-5 py-4">
      <section className="space-y-3 rounded-lg bg-ink p-5 text-white dark:bg-slate-900">
        <div>
          <h1 className="text-3xl font-black leading-tight">{t(settings.language, "tenMinuteMixed")}</h1>
          <p className="mt-2 text-sm text-slate-200">{t(settings.language, "homeIntro")}</p>
        </div>
        <button type="button" onClick={() => startPractice({ mode: "mixed", durationSec: 600 })} className="min-h-14 w-full rounded-lg bg-brass text-lg font-bold text-white">
          {t(settings.language, "startTenMinute")}
        </button>
      </section>

      <section className="space-y-3 rounded-lg border border-brass/40 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50">
        <div>
          <h2 className="text-lg font-black">{t(settings.language, "firstTimeTitle")}</h2>
          <p className="mt-1 text-sm">{t(settings.language, "firstTimeIntro")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => startPractice({ mode: "staff-fingering", level: "anchors", durationSec: 0 })}
            className="min-h-12 rounded-lg bg-brass px-3 font-bold text-white"
          >
            {t(settings.language, "startAnchorDrill")}
          </button>
          <button
            type="button"
            onClick={openHelp}
            className="min-h-12 rounded-lg border border-amber-300 bg-white px-3 font-bold text-amber-950 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-50"
          >
            {t(settings.language, "howItWorks")}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label={t(settings.language, "questions")} value={totalQuestions} />
        <StatCard label={t(settings.language, "accuracy")} value={`${totalAccuracy}%`} />
        <StatCard label={t(settings.language, "last")} value={lastSession ? `${lastSession.correctCount}/${lastSession.totalQuestions}` : t(settings.language, "none")} />
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(settings.language, "quickSetup")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {t(settings.language, "mode")}
            <select value={mode} onChange={(event) => setMode(event.target.value as PracticeMode)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink">
              {trainingModes.map((item) => <option key={item.id} value={item.id}>{modeName(item.id, settings.language)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t(settings.language, "level")}
            <select value={level} onChange={(event) => setLevel(event.target.value as DifficultyLevel)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink">
              {levels.map((item) => <option key={item.id} value={item.id}>{levelName(item.id, settings.language)}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => startPractice({ mode, level, durationSec: 0 })} className="min-h-12 rounded-lg border border-slate-300 bg-white font-bold text-ink">{t(settings.language, "quickDrill")}</button>
          <button type="button" onClick={() => startPractice({ mode, level, durationSec: 300 })} className="min-h-12 rounded-lg bg-ink font-bold text-white">{t(settings.language, "fiveMinuteDrill")}</button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t(settings.language, "weakNotes")}</h2>
          <button type="button" onClick={() => startPractice({ weakOnly: true, durationSec: 300 })} className="rounded-lg bg-reed px-3 py-2 text-sm font-bold text-white">{t(settings.language, "practiceWeak")}</button>
        </div>
        <WeakNotesList stats={weakNotes} language={settings.language} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setView("reference")} className="min-h-12 rounded-lg border border-slate-300 bg-white font-bold text-ink">{t(settings.language, "reference")}</button>
        <button type="button" onClick={() => setView("settings")} className="min-h-12 rounded-lg border border-slate-300 bg-white font-bold text-ink">{t(settings.language, "settings")}</button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="font-semibold">{t(settings.language, "defaultMode")}</div>
        <div className="text-slate-600 dark:text-slate-300">{modeName(settings.defaultMode, settings.language)} · {levelName(settings.defaultLevel, settings.language)} · {durationName(settings.defaultSessionLengthSec, settings.language)}</div>
        <div className="mt-2 font-semibold">{t(settings.language, "valveReference")}</div>
        <div className="mt-1 flex flex-wrap gap-2">
          {notes.slice(0, 8).map((note) => (
            <span key={note.id} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{note.displayName}: {formatValves(note.valves)}</span>
          ))}
        </div>
      </section>
    </div>
  );
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
      <section className="help-dialog max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-lg bg-white p-5 text-ink shadow-2xl dark:bg-slate-900 dark:text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">{t(language, "howItWorks")}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(language, "firstTimeIntro")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold dark:border-slate-700">
            {t(language, "close")}
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {[
            ["helpStepStartTitle", "helpStepStartBody"],
            ["helpStepAnswerTitle", "helpStepAnswerBody"],
            ["helpStepFeedbackTitle", "helpStepFeedbackBody"],
            ["helpSelfCheckTitle", "helpSelfCheckBody"],
            ["helpPhraseTitle", "helpPhraseBody"],
            ["helpDrillsTitle", "helpDrillsBody"]
          ].map(([titleKey, bodyKey]) => (
            <div key={titleKey} className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
              <h3 className="font-black">{t(language, titleKey)}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{t(language, bodyKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h3 className="font-black">{t(language, "chooseByGoal")}</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
            <li>{t(language, "goalStaff")}</li>
            <li>{t(language, "goalName")}</li>
            <li>{t(language, "goalMixed")}</li>
          </ul>
        </div>

        <p className="mt-4 rounded-lg bg-slate-900 p-3 text-sm text-white dark:bg-white dark:text-ink">{t(language, "keyboardHelp")}</p>
      </section>
    </div>
  );
}

function presetCopy(language: AppSettings["language"], english: string, chinese: string): string {
  if (language === "zh") return chinese;
  if (language === "bilingual") return `${english} / ${chinese}`;
  return english;
}
