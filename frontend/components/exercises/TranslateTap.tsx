"use client";

import { speak } from "@/lib/sound";

type Token = { id: number; text: string };

export function TranslateTap({
  tokens,
  selected,
  onToggle,
  disabled,
}: {
  tokens: Token[];
  selected: number[];
  onToggle: (id: number) => void;
  disabled?: boolean;
}) {
  const unused = tokens.filter((t) => !selected.includes(t.id));
  const used = selected
    .map((id) => tokens.find((t) => t.id === id))
    .filter(Boolean) as Token[];

  return (
    <div>
      <div className="min-h-[72px] border-b-2 border-[var(--border)] flex flex-wrap gap-2 pb-3 mb-6">
        {used.length === 0 && (
          <span className="text-[var(--wolf)] font-bold">Tap the words in order</span>
        )}
        {used.map((t) => (
          <button
            key={t.id}
            disabled={disabled}
            className="duo-chip"
            onClick={() => onToggle(t.id)}
          >
            {t.text}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {tokens.map((t) => {
          const taken = selected.includes(t.id);
          if (taken) {
            return (
              <span key={t.id} className="duo-chip duo-chip-ghost">
                {t.text}
              </span>
            );
          }
          return (
            <button
              key={t.id}
              disabled={disabled}
              className="duo-chip"
              onClick={() => {
                void speak(t.text);
                onToggle(t.id);
              }}
            >
              {t.text}
            </button>
          );
        })}
        {unused.length === 0 ? null : null}
      </div>
    </div>
  );
}
