"use client";

import { speak } from "@/lib/sound";

type Option = { id: string; text: string };

export function FillBlank({
  before,
  after,
  options,
  selected,
  onSelect,
  disabled,
}: {
  before: string;
  after: string;
  options: Option[];
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const chosen = options.find((o) => o.id === selected);
  return (
    <div>
      <p className="text-2xl font-extrabold text-center mb-8 leading-relaxed">
        {before}{" "}
        <span
          className={`inline-block min-w-[90px] border-b-4 mx-1 ${
            chosen ? "border-[#1cb0f6] text-[#1cb0f6]" : "border-[var(--border)] text-transparent"
          }`}
        >
          {chosen?.text || "____"}
        </span>{" "}
        {after}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((opt) => (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => {
              void speak(opt.text);
              onSelect(opt.id);
            }}
            className={`duo-chip ${selected === opt.id ? "duo-chip-selected" : ""}`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
