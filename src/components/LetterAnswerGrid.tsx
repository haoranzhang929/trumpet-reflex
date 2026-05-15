import type { Note } from "../types";
import { noteAnswerLabel } from "../data/notes";

type Props = {
  notes: Note[];
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  disabled?: boolean;
};

export function LetterAnswerGrid({ notes, selectedAnswer, onSelect, disabled = false }: Props) {
  const labels = Array.from(new Set(notes.map(noteAnswerLabel)));
  return (
    <div className="grid grid-cols-4 gap-3">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(label)}
          className={`min-h-14 rounded-lg border text-xl font-bold transition active:scale-[0.98] ${
            selectedAnswer === label
              ? "border-brass bg-brass text-white shadow-lg"
              : "border-black/10 bg-white text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
