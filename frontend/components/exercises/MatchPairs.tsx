"use client";

import { speak } from "@/lib/sound";

type Item = { id: string; text: string };

export function MatchPairs({
  left,
  right,
  matched,
  selectedLeft,
  selectedRight,
  wrong,
  onPick,
  disabled,
}: {
  left: Item[];
  right: Item[];
  matched: Set<string>;
  selectedLeft: string | null;
  selectedRight: string | null;
  wrong: Set<string>;
  onPick: (side: "left" | "right", id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Column
        items={left}
        matched={matched}
        selected={selectedLeft}
        wrong={wrong}
        disabled={disabled}
        onPick={(id) => onPick("left", id)}
      />
      <Column
        items={right}
        matched={matched}
        selected={selectedRight}
        wrong={wrong}
        disabled={disabled}
        onPick={(id) => onPick("right", id)}
      />
    </div>
  );
}

function Column({
  items,
  matched,
  selected,
  wrong,
  disabled,
  onPick,
}: {
  items: Item[];
  matched: Set<string>;
  selected: string | null;
  wrong: Set<string>;
  disabled?: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isMatched = matched.has(item.id);
        const isWrong = wrong.has(item.id);
        const isSel = selected === item.id;
        return (
          <button
            key={item.id}
            disabled={disabled || isMatched}
            onClick={() => {
              void speak(item.text);
              onPick(item.id);
            }}
            className={`choice-tile min-h-[56px] text-base ${
              isMatched
                ? "choice-tile-matched"
                : isWrong
                  ? "choice-tile-wrong"
                  : isSel
                    ? "choice-tile-selected"
                    : ""
            }`}
          >
            {item.text}
          </button>
        );
      })}
    </div>
  );
}
