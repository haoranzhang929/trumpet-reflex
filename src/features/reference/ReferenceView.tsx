import { getNoteById, notes } from "../../data/notes";
import { formatValves } from "../../data/notes";
import { StaffNote } from "../../components/StaffNote";
import type { AppSettings } from "../../types";
import { staffHint, t } from "../../i18n";

export function ReferenceView({ language }: { language: AppSettings["language"] }) {
  return (
    <div className="space-y-5 py-4">
      <section>
        <h1 className="text-2xl font-black">{t(language, "reference")}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(language, "writtenPitchForTrumpet")}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(language, "writtenNoteFingering")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
              <div className="font-bold">{note.displayName} / {note.solfegeFixedDo}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{t(language, "valves")} {formatValves(note.valves)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(language, "staffLandmarks")}</h2>
        <h3 className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">{t(language, "naturalStaffPositions")}</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {notes.slice(0, 8).map((note) => (
            <div key={note.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <StaffNote note={note} size="normal" language={language} />
              <div className="mt-2 text-sm"><b>{note.displayName}</b>: {staffHint(note, language)} · {t(language, "fingering")} {formatValves(note.valves)}</div>
            </div>
          ))}
        </div>
        <h3 className="mt-5 text-sm font-bold text-slate-600 dark:text-slate-300">{t(language, "enharmonicSpellings")}</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {[
            ["bb4", "as4"],
            ["fs4", "gb4"],
            ["eb4", "ds4"],
            ["ab4", "gs4"],
            ["cs4", "db4"]
          ].map(([firstId, secondId]) => {
            const first = getNoteById(firstId);
            const second = getNoteById(secondId);
            return (
              <div key={`${firstId}-${secondId}`} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <StaffNote notes={[first, second]} size="normal" language={language} />
                <div className="mt-2 text-sm">
                  <b>{first.displayName} / {second.displayName}</b>: {t(language, "sameFingering")} {formatValves(first.valves)}
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {first.displayName}: {staffHint(first, language)} · {second.displayName}: {staffHint(second, language)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t(language, "pitchNote")}</h2>
        <p className="mt-2">{t(language, "pitchCopy")}</p>
      </section>
    </div>
  );
}
