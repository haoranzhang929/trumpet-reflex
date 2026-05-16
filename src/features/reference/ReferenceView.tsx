import {
  COMMON_ACCIDENTAL_NOTE_IDS,
  LOW_ACCIDENTAL_NOTE_IDS,
  LOW_NATURAL_NOTE_IDS,
  NATURAL_NOTE_IDS,
  UPPER_ACCIDENTAL_NOTE_IDS,
  UPPER_NATURAL_NOTE_IDS,
  formatValves,
  getNoteById,
  notes
} from "../../data/notes";
import { StaffNote } from "../../components/StaffNote";
import type { AppSettings, Note } from "../../types";
import { staffHint, t } from "../../i18n";

const naturalReferenceGroups = [
  { titleKey: "lowNaturalPositions", noteIds: LOW_NATURAL_NOTE_IDS, defaultOpen: false },
  { titleKey: "naturalStaffPositions", noteIds: NATURAL_NOTE_IDS, defaultOpen: true },
  { titleKey: "upperNaturalPositions", noteIds: UPPER_NATURAL_NOTE_IDS, defaultOpen: false }
] as const;

const accidentalReferenceGroups = [
  { titleKey: "lowAccidentals", noteIds: LOW_ACCIDENTAL_NOTE_IDS, defaultOpen: false },
  { titleKey: "commonAccidentals", noteIds: COMMON_ACCIDENTAL_NOTE_IDS, defaultOpen: false },
  { titleKey: "upperAccidentals", noteIds: UPPER_ACCIDENTAL_NOTE_IDS, defaultOpen: false }
] as const;

const enharmonicPairs = [
  ["fs3", "gb3"],
  ["gs3", "ab3"],
  ["as3", "bb3"],
  ["cs4", "db4"],
  ["ds4", "eb4"],
  ["fs4", "gb4"],
  ["gs4", "ab4"],
  ["as4", "bb4"],
  ["cs5", "db5"],
  ["ds5", "eb5"],
  ["fs5", "gb5"],
  ["gs5", "ab5"],
  ["as5", "bb5"]
] as const;

export function ReferenceView({ language }: { language: AppSettings["language"] }) {
  const notesByFingering = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const key = formatValves(note.valves);
    acc[key] = [...(acc[key] ?? []), note];
    return acc;
  }, {});

  return (
    <div className="space-y-5 py-4">
      <section>
        <h1 className="text-2xl font-black">{t(language, "reference")}</h1>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <h2 className="text-lg font-bold">{t(language, "fingeringQuickIndex")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {["0", "1", "2", "1+2", "1+3", "2+3", "1+2+3"].map((fingering) => (
            <div key={fingering} className="rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]">
              <div className="text-xs font-bold uppercase text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "valves")} {fingering}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(notesByFingering[fingering] ?? []).map((note) => (
                  <span key={note.id} className="rounded-md bg-white px-2 py-1 text-sm font-bold text-[#1D1D1F] dark:bg-[#1E1E22] dark:text-white">
                    {note.displayName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#1E1E22]">
        <h2 className="text-lg font-bold">{t(language, "staffLandmarks")}</h2>
        {naturalReferenceGroups.map((group) => (
          <ReferenceNoteGroup
            key={group.titleKey}
            title={t(language, group.titleKey)}
            notes={group.noteIds.map(getNoteById)}
            language={language}
            defaultOpen={group.defaultOpen}
          />
        ))}
        <h3 className="mt-5 text-sm font-bold text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "accidentalStaffPositions")}</h3>
        {accidentalReferenceGroups.map((group) => (
          <ReferenceNoteGroup
            key={group.titleKey}
            title={t(language, group.titleKey)}
            notes={group.noteIds.map(getNoteById)}
            language={language}
            defaultOpen={group.defaultOpen}
          />
        ))}
        <details className="mt-5 rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]">
          <summary className="cursor-pointer text-sm font-bold text-[#1D1D1F] dark:text-white">{t(language, "enharmonicSpellings")}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {enharmonicPairs.map(([firstId, secondId]) => {
              const first = getNoteById(firstId);
              const second = getNoteById(secondId);
              return (
                <div key={`${firstId}-${secondId}`} className="rounded-lg bg-[#FBFBFD] p-3 dark:bg-[#1E1E22]">
                  <StaffNote notes={[first, second]} size="normal" language={language} />
                  <div className="mt-2 text-sm">
                    <b>{first.displayName} / {second.displayName}</b>: {t(language, "sameFingering")} {formatValves(first.valves)}
                  </div>
                  <div className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1AA]">
                    {first.displayName}: {staffHint(first, language)} · {second.displayName}: {staffHint(second, language)}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 text-sm leading-6 dark:border-white/10 dark:bg-[#1E1E22]">
        <h2 className="text-lg font-bold">{t(language, "pitchNote")}</h2>
        <p className="mt-2">{t(language, "pitchCopy")}</p>
      </section>
    </div>
  );
}

function ReferenceNoteGroup({
  title,
  notes,
  language,
  defaultOpen
}: {
  title: string;
  notes: Note[];
  language: AppSettings["language"];
  defaultOpen: boolean;
}) {
  return (
    <details open={defaultOpen} className="mt-4 rounded-lg bg-[#F5F5F7] p-3 dark:bg-[#2A2A30]">
      <summary className="cursor-pointer text-sm font-bold text-[#1D1D1F] dark:text-white">{title}</summary>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg bg-[#FBFBFD] p-3 dark:bg-[#1E1E22]">
            <StaffNote note={note} size="normal" language={language} />
            <div className="mt-2 text-sm"><b>{note.displayName}</b>: {staffHint(note, language)} · {t(language, "fingering")} {formatValves(note.valves)}</div>
          </div>
        ))}
      </div>
    </details>
  );
}
