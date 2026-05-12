import type React from "react";
import type { AppSettings, DifficultyLevel, PracticeMode } from "../../types";
import { levels } from "../../data/levels";
import { trainingModes } from "../../data/modes";
import { notes } from "../../data/notes";
import { defaultSettings } from "../../storage/settingsStorage";
import { durationName, levelName, modeName, t } from "../../i18n";

type Props = {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
};

export function SettingsView({ settings, onChange, onExport, onImport, onReset }: Props) {
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => onChange({ ...settings, [key]: value });
  const toggleNote = (noteId: string) => {
    const selected = settings.selectedNoteIds.includes(noteId)
      ? settings.selectedNoteIds.filter((id) => id !== noteId)
      : [...settings.selectedNoteIds, noteId];
    update("selectedNoteIds", selected.length > 0 ? selected : defaultSettings.selectedNoteIds);
  };

  return (
    <div className="space-y-5 py-4">
      <section>
        <h1 className="text-2xl font-black">{t(settings.language, "settings")}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(settings.language, "settingsIntro")}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Select label={t(settings.language, "defaultMode")} value={settings.defaultMode} onChange={(value) => update("defaultMode", value as PracticeMode)}>
          {trainingModes.map((mode) => <option key={mode.id} value={mode.id}>{modeName(mode.id, settings.language)}</option>)}
        </Select>
        <Select label={t(settings.language, "defaultLevel")} value={settings.defaultLevel} onChange={(value) => update("defaultLevel", value as DifficultyLevel)}>
          {levels.map((level) => <option key={level.id} value={level.id}>{levelName(level.id, settings.language)}</option>)}
        </Select>
        <Select label={t(settings.language, "defaultSessionLength")} value={String(settings.defaultSessionLengthSec)} onChange={(value) => update("defaultSessionLengthSec", Number(value) as AppSettings["defaultSessionLengthSec"])}>
          <option value="0">{durationName(0, settings.language)}</option>
          <option value="180">{durationName(180, settings.language)}</option>
          <option value="300">{durationName(300, settings.language)}</option>
          <option value="600">{durationName(600, settings.language)}</option>
        </Select>
        <Select label={t(settings.language, "phraseLength")} value={String(settings.phraseLength)} onChange={(value) => update("phraseLength", Number(value) as AppSettings["phraseLength"])}>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </Select>
        <NumberField
          label={t(settings.language, "veryFastThreshold")}
          value={settings.veryFastThresholdMs}
          min={500}
          max={10000}
          step={100}
          onChange={(value) => update("veryFastThresholdMs", value)}
        />
        <NumberField
          label={t(settings.language, "slowThreshold")}
          value={settings.slowThresholdMs}
          min={1000}
          max={20000}
          step={100}
          onChange={(value) => update("slowThresholdMs", Math.max(value, settings.veryFastThresholdMs))}
        />
        <Select label={t(settings.language, "displayLanguage")} value={settings.language} onChange={(value) => update("language", value as AppSettings["language"])}>
          <option value="en">{t(settings.language, "english")}</option>
          <option value="zh">{t(settings.language, "chinese")}</option>
          <option value="bilingual">{t(settings.language, "bilingual")}</option>
        </Select>
        <Select label={t(settings.language, "appearance")} value={settings.theme} onChange={(value) => update("theme", value as AppSettings["theme"])}>
          <option value="system">{t(settings.language, "themeSystem")}</option>
          <option value="light">{t(settings.language, "themeLight")}</option>
          <option value="dark">{t(settings.language, "themeDark")}</option>
        </Select>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Toggle label={t(settings.language, "autoAdvance")} checked={settings.autoAdvanceCorrect} onChange={(value) => update("autoAdvanceCorrect", value)} />
        <Toggle label={t(settings.language, "hintsAfterWrong")} checked={settings.hintsAfterWrong} onChange={(value) => update("hintsAfterWrong", value)} />
        <Toggle label={t(settings.language, "enableAccidentals")} checked={settings.accidentalsEnabled} onChange={(value) => update("accidentalsEnabled", value)} />
        <Toggle label={t(settings.language, "weakWeighting")} checked={settings.weakNoteBias} onChange={(value) => update("weakNoteBias", value)} />
        <Toggle label={t(settings.language, "concertPitch")} checked={settings.showConcertPitchReference} onChange={(value) => update("showConcertPitchReference", value)} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(settings.language, "customNoteSet")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {notes.map((note) => (
            <label key={note.id} className="flex items-center gap-2 rounded-lg bg-slate-100 p-3 text-sm font-semibold dark:bg-slate-800">
              <input type="checkbox" checked={settings.selectedNoteIds.includes(note.id)} onChange={() => toggleNote(note.id)} />
              {note.displayName} / {note.solfegeFixedDo}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(settings.language, "data")}</h2>
        <button type="button" onClick={onExport} className="min-h-12 w-full rounded-lg bg-ink font-bold text-white dark:bg-white dark:text-ink">{t(settings.language, "exportJson")}</button>
        <label className="block min-h-12 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-3 text-center font-bold text-ink dark:bg-slate-800 dark:text-white">
          {t(settings.language, "importJson")}
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button type="button" onClick={onReset} className="min-h-12 w-full rounded-lg border border-red-300 bg-red-50 font-bold text-red-900">{t(settings.language, "resetAllData")}</button>
      </section>
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink">
        {children}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-ink"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 text-sm font-semibold dark:bg-slate-800">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5" />
    </label>
  );
}
