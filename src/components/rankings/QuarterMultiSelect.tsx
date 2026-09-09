"use client";

const QUARTERS = [
  { value: 1, label: "T1" },
  { value: 2, label: "T2" },
  { value: 3, label: "T3" },
  { value: 4, label: "T4" },
];

interface Props {
  selected: number[];
  onChange: (quarters: number[]) => void;
}

/** Toggle-style multi-select for quarters — e.g. checking T1+T2 shows a combined 1st-semester view. */
export function QuarterMultiSelect({ selected, onChange }: Props) {
  function toggle(q: number) {
    if (selected.includes(q)) {
      if (selected.length === 1) return; // always keep at least one quarter selected
      onChange(selected.filter((s) => s !== q).sort());
    } else {
      onChange([...selected, q].sort());
    }
  }

  return (
    <div className="flex gap-1.5" role="group" aria-label="Trimestres">
      {QUARTERS.map((q) => {
        const active = selected.includes(q.value);
        return (
          <button
            key={q.value}
            type="button"
            onClick={() => toggle(q.value)}
            aria-pressed={active}
            className={`px-3 h-9 rounded-md border text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-accent text-muted-foreground"
            }`}
          >
            {q.label}
          </button>
        );
      })}
    </div>
  );
}
