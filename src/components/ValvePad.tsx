import type { Valve } from "../types";

type Props = {
  selected: Valve[];
  onChange: (valves: Valve[]) => void;
  disabled?: boolean;
  openLabel?: string;
};

export function ValvePad({ selected, onChange, disabled = false, openLabel = "Open / 0" }: Props) {
  const toggle = (valve: Valve) => {
    if (selected.includes(valve)) onChange(selected.filter((item) => item !== valve));
    else onChange([...selected, valve].sort() as Valve[]);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((valve) => {
          const isSelected = selected.includes(valve as Valve);
          return (
            <button
              key={valve}
              type="button"
              disabled={disabled}
              onClick={() => toggle(valve as Valve)}
              className={`min-h-20 rounded-lg border text-3xl font-bold transition active:scale-[0.98] ${
                isSelected
                  ? "border-brass bg-brass text-white shadow-lg"
                  : "border-black/10 bg-white text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white"
              }`}
            >
              {valve}
            </button>
          );
        })}
      </div>
      <div className="grid gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([])}
          className="min-h-14 rounded-lg border border-black/10 bg-white text-lg font-semibold text-[#1D1D1F] dark:border-white/10 dark:bg-[#2A2A30] dark:text-white"
        >
          {openLabel}
        </button>
      </div>
    </div>
  );
}
