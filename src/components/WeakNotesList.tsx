import type { AppSettings, NoteStats } from "../types";
import { getNoteById } from "../data/notes";
import { t } from "../i18n";

type Props = {
  stats: NoteStats[];
  language?: AppSettings["language"];
};

export function WeakNotesList({ stats, language = "en" }: Props) {
  if (stats.length === 0) {
    return <p className="text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "noWeakNotes")}</p>;
  }

  return (
    <div className="space-y-2">
      {stats.map((stat) => {
        const note = getNoteById(stat.noteId);
        return (
          <div key={stat.noteId} className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#2A2A30]">
            <div>
              <div className="font-semibold">{note.displayName} / {note.solfegeFixedDo}</div>
              <div className="text-sm text-[#6E6E73] dark:text-[#A1A1AA]">{t(language, "accuracy")} {stat.accuracy}% · {t(language, "weakness")} {stat.weaknessScore}</div>
            </div>
            <div className="text-sm font-semibold">{stat.wrongCount} {t(language, "misses")}</div>
          </div>
        );
      })}
    </div>
  );
}
