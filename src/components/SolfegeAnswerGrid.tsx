import type { Note } from "../types";

type Props = {
  notes: Note[];
  onAnswer: (answer: string) => void;
  disabled?: boolean;
};

export function SolfegeAnswerGrid({ notes, onAnswer, disabled = false }: Props) {
  const labels = Array.from(new Set(notes.map((note) => note.solfegeFixedDo)));
  return (
    <div className="grid grid-cols-3 gap-3">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(label)}
          className="min-h-14 rounded-lg border border-slate-300 bg-white text-xl font-bold text-ink active:scale-[0.98] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
