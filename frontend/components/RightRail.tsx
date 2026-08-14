"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useStats } from "./StatsProvider";
import { TopBar } from "./TopBar";
import { Owl } from "./Owl";

const FOOTER = ["About", "Blog", "Store", "Efficacy", "Careers", "Investors", "Terms", "Privacy"];

export function RightRail() {
  const { me } = useStats();
  const [lessonsLeft, setLessonsLeft] = useState(3);
  const goal = me?.dailyGoalXp ?? 20;
  const today = me?.xpToday ?? 0;
  const pct = Math.min(100, Math.round((today / Math.max(goal, 1)) * 100));

  useEffect(() => {
    api.path().then((p) => {
      const done = p.units.flatMap((u) => u.nodes).filter((n) => n.status === "complete").length;
      setLessonsLeft(Math.max(0, 3 - done));
    }).catch(() => {});
  }, [me?.xp]);

  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-5 h-fit">
      <TopBar />

      <div className="duo-card overflow-hidden">
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <div className="text-[19px] font-extrabold leading-tight mb-1">Try Super for free</div>
            <p className="text-[15px] font-bold text-[var(--wolf)] mb-4 leading-snug">
              No ads, personalized practice, and unlimited Legendary!
            </p>
            <Link href="/shop" className="duo-btn duo-btn-blue w-full">
              Try 1 week free
            </Link>
          </div>
          <div className="-mt-1 -mr-1 shrink-0">
            <Owl size={92} variant="super" />
          </div>
        </div>
      </div>

      <div className="duo-card flex gap-4 items-center">
        <LockedShield />
        <div>
          <div className="font-extrabold text-[19px] leading-tight">Unlock Leaderboards!</div>
          <p className="text-[15px] font-bold text-[var(--wolf)] mt-1 leading-snug">
            {lessonsLeft > 0
              ? `Complete ${lessonsLeft} more lessons to start competing.`
              : "You're on the board — keep earning XP."}
          </p>
        </div>
      </div>

      <div className="duo-card">
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold uppercase tracking-wide text-[17px]">Daily Quests</div>
          <Link href="/quests" className="text-[#1cb0f6] text-[15px] font-extrabold uppercase">
            View all
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[var(--achievement-bg)] flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC800">
              <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold mb-1.5">Earn {goal} XP</div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 h-4 rounded-full bg-[var(--progress-track)] overflow-hidden">
                <div className="h-full rounded-full bg-[#ffc800]" style={{ width: `${pct}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-[var(--wolf)]">
                  {today} / {goal}
                </span>
              </div>
              <QuestChest />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] p-4 text-white overflow-hidden relative" style={{ background: "linear-gradient(180deg,#2b1655 0%,#1b0e3a 100%)" }}>
        <div className="flex gap-3 items-start">
          <NeonDuo />
          <div className="flex-1 min-w-0 pt-1">
            <p className="font-extrabold text-[15px] leading-snug mb-4">
              Using an ad blocker? Support education with Super Duolingo and we&apos;ll remove ads for you
            </p>
            <Link href="/shop" className="duo-btn w-full !bg-white !text-[#1b0e3a] !shadow-[0_4px_0_#cfcfcf] mb-2">
              Try Super for free
            </Link>
            <button type="button" className="w-full text-center text-[13px] font-extrabold uppercase tracking-wide text-[#ce82ff] py-1">
              Disable ad blocker
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 pb-4">
        {FOOTER.map((item) => (
          <span key={item} className="text-[12px] font-extrabold uppercase tracking-wide text-[var(--hare)]">
            {item}
          </span>
        ))}
      </div>
    </aside>
  );
}

function LockedShield() {
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 48 48" width="64" height="64">
        <path d="M24 4 8 10v14c0 10 7 17 16 20 9-3 16-10 16-20V10L24 4z" fill="#afafaf" />
        <path d="M24 8 14 12v11c0 7 4.6 12 10 14.4 5.4-2.4 10-7.4 10-14.4V12L24 8z" fill="#d4d4d4" />
      </svg>
      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#ff4b4b] flex items-center justify-center border-2 border-white">
        <svg width="10" height="12" viewBox="0 0 10 12" fill="#fff">
          <path d="M2 5V3.4A3 3 0 0 1 8 3.4V5h1v7H1V5h1zm1.4 0h3.2V3.4a1.6 1.6 0 0 0-3.2 0V5z" />
        </svg>
      </span>
    </div>
  );
}

function QuestChest() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="9" width="18" height="12" rx="1.5" fill="#1CB0F6" />
      <path d="M4 6h16l2 3H2l2-3z" fill="#1899D6" />
      <rect x="10.5" y="9" width="3" height="12" fill="#0E7AAD" />
      <circle cx="12" cy="15" r="1.4" fill="#FFC800" />
    </svg>
  );
}

function NeonDuo() {
  return (
    <svg width="72" height="88" viewBox="0 0 72 88" fill="none" aria-hidden>
      <ellipse cx="36" cy="80" rx="18" ry="6" fill="#12082a" />
      <circle cx="36" cy="46" r="28" fill="#2EE6A6" />
      <ellipse cx="36" cy="56" rx="16" ry="12" fill="#9CFF6A" />
      <circle cx="24" cy="42" r="11" fill="#fff" />
      <circle cx="48" cy="42" r="11" fill="#fff" />
      <circle cx="24" cy="44" r="5" fill="#111" />
      <circle cx="48" cy="44" r="5" fill="#111" />
      <path d="M30 58 36 70 42 58Z" fill="#FFC200" />
      <path d="M14 28 Q6 8 24 16" stroke="#7CFF57" strokeWidth="6" strokeLinecap="round" />
      <path d="M58 28 Q66 8 48 16" stroke="#7CFF57" strokeWidth="6" strokeLinecap="round" />
      <rect x="12" y="34" width="48" height="8" rx="4" fill="#CE82FF" opacity="0.9" />
      <circle cx="16" cy="38" r="5" fill="#1CB0F6" />
      <circle cx="56" cy="38" r="5" fill="#1CB0F6" />
    </svg>
  );
}
