import type { Note } from "../types";

type Props = {
  notes: Note[];
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  disabled?: boolean;
};

export function SolfegeAnswerGrid({ notes, selectedAnswer, onSelect, disabled = false }: Props) {
  const labels = Array.from(new Set(notes.map((note) => note.solfegeFixedDo)));
  return (
    <div className="grid grid-cols-3 gap-3">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(label)}
          className={`min-h-14 rounded-lg border text-xl font-bold transition active:scale-[0.98] ${
            selectedAnswer === label
              ? "border-brass bg-brass text-white shadow-lg"
              : "border-slate-300 bg-white text-ink dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
