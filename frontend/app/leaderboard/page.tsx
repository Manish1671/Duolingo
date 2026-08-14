"use client";

import { useEffect, useState } from "react";
import { api, LeaderboardResponse } from "@/lib/api";

const MEDAL = ["#FFC800", "#C0C0C0", "#CD7F32"];

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    api.leaderboard().then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="animate-pulse py-4" aria-busy="true" aria-label="Loading leaderboard">
        <div className="h-8 w-56 rounded-lg bg-[var(--bg-elevated)] mb-6" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--bg-elevated)] mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="py-4">
      <h1 className="text-3xl font-extrabold mb-1">Leaderboards</h1>
      <p className="text-[var(--wolf)] font-bold mb-6">
        {data.league || "Emerald League"} · lifetime XP
        {data.yourRank ? ` · you are #${data.yourRank}` : ""}
      </p>
      <div className="flex flex-col">
        {data.entries.map((row) => (
          <div
            key={row.userId}
            className={`flex items-center gap-3 py-3 px-2 rounded-xl ${
              row.isYou ? "bg-[var(--you-bg)] border-2 border-[var(--nav-active-border)]" : ""
            }`}
          >
            <div
              className="w-8 font-extrabold"
              style={{ color: row.rank <= 3 ? MEDAL[row.rank - 1] : "var(--wolf)" }}
            >
              {row.rank}
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold"
              style={{ background: row.avatarColor }}
            >
              {row.displayName[0]}
            </div>
            <div className="flex-1 font-extrabold">
              {row.displayName}
              {row.isYou ? " (you)" : ""}
            </div>
            <div className="font-extrabold text-[#ffc800]">{row.xp} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}
