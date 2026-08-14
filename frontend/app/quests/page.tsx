"use client";

import { useStats } from "@/components/StatsProvider";
import { api } from "@/lib/api";
import { DuoButton } from "@/components/DuoButton";

export default function QuestsPage() {
  const { me, refresh } = useStats();
  const goal = me?.dailyGoalXp ?? 20;
  const today = me?.xpToday ?? 0;
  const pct = Math.min(100, Math.round((today / goal) * 100));

  return (
    <div className="py-4">
      <h1 className="text-3xl font-extrabold mb-6">Quests</h1>
      <div className="border-2 border-[var(--border)] rounded-2xl p-5">
        <div className="text-xs font-extrabold uppercase text-[var(--wolf)]">Daily quest</div>
        <div className="text-xl font-extrabold my-2">Earn {goal} XP</div>
        <div className="h-4 rounded-full bg-[var(--progress-track)] overflow-hidden mb-2">
          <div className="h-full bg-[#ffc800] rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="font-bold text-[var(--wolf)] mb-4">
          {today} / {goal} XP
        </div>
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((n) => (
            <DuoButton
              key={n}
              variant={n === goal ? "green" : "outline"}
              onClick={async () => {
                await api.setGoal(n);
                await refresh();
              }}
            >
              {n}
            </DuoButton>
          ))}
        </div>
      </div>
    </div>
  );
}
