"use client";

import { speak } from "@/lib/sound";

type Option = { id: string; text: string };

export function MultipleChoice({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: Option[];
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          disabled={disabled}
          onClick={() => {
            void speak(opt.text);
            onSelect(opt.id);
          }}
          className={`choice-tile ${selected === opt.id ? "choice-tile-selected" : ""}`}
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}
