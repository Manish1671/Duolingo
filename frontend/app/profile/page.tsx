"use client";

import { useEffect, useState } from "react";
import { api, ProfileResponse } from "@/lib/api";

export default function ProfilePage() {
  const [data, setData] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    api.profile().then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="animate-pulse py-4" aria-busy="true" aria-label="Loading profile">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)]" />
          <div className="flex-1">
            <div className="h-8 w-40 rounded-lg bg-[var(--bg-elevated)] mb-2" />
            <div className="h-4 w-56 rounded-lg bg-[var(--bg-elevated)]" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-2xl bg-[var(--bg-elevated)]" />
          <div className="h-20 rounded-2xl bg-[var(--bg-elevated)]" />
          <div className="h-20 rounded-2xl bg-[var(--bg-elevated)]" />
        </div>
      </div>
    );
  }

  const { user } = data;
  return (
    <div className="py-4">
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-extrabold"
          style={{ background: user.avatarColor, boxShadow: "0 4px 0 #46A302" }}
        >
          {user.displayName[0]}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold">{user.displayName}</h1>
          <p className="text-[var(--wolf)] font-bold">{data.league || "Emerald"} League · Spanish</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat label="Day streak" value={user.streak} color="#FF9600" />
        <Stat label="Total XP" value={user.xp} color="#FFC800" />
        <Stat label="Skills" value={data.skillsCompleted} color="#1CB0F6" />
      </div>

      <h2 className="text-xl font-extrabold mb-3">Achievements</h2>
      <div className="flex flex-col gap-3">
        {data.achievements.length === 0 && (
          <p className="text-[var(--wolf)] font-bold">Complete lessons to unlock badges.</p>
        )}
        {data.achievements.map((a) => (
          <div key={a.code} className="border-2 border-[var(--border)] rounded-2xl p-4 flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--achievement-bg)] flex items-center justify-center font-extrabold text-[#ff9600]">
              {a.code === "streak_3" ? "3" : a.code === "xp_100" ? "100" : "1"}
            </div>
            <div>
              <div className="font-extrabold">{a.title}</div>
              <div className="text-sm text-[var(--wolf)] font-semibold">{a.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="border-2 rounded-2xl p-3 text-center" style={{ borderColor: color }}>
      <div className="text-2xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs font-extrabold uppercase text-[var(--wolf)]">{label}</div>
    </div>
  );
}
