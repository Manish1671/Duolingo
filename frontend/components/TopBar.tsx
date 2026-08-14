"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStats } from "./StatsProvider";
import { api } from "@/lib/api";
import { DuoButton } from "./DuoButton";

export function TopBar({ flag = "ES" }: { flag?: string }) {
  const { me } = useStats();
  const [open, setOpen] = useState(false);
  const [remain, setRemain] = useState(me?.nextHeartInSeconds ?? null);

  useEffect(() => {
    setRemain(me?.nextHeartInSeconds ?? null);
  }, [me?.nextHeartInSeconds, me?.hearts]);

  useEffect(() => {
    if (remain == null) return;
    const t = setInterval(() => setRemain((s) => (s == null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [remain]);

  return (
    <div className="flex items-center justify-between gap-3 py-1 relative mb-1">
      <div className="flex items-center gap-2 font-extrabold">
        <Flag code={flag} />
      </div>
      <Stat color={(me?.streak ?? 0) > 0 ? "#FF9600" : "var(--hare)"} value={me?.streak ?? 0}>
        <Flame dim={(me?.streak ?? 0) === 0} />
      </Stat>
      <Stat color="#1CB0F6" value={me?.gems ?? 0}>
        <Gem />
      </Stat>
      <button onClick={() => setOpen((v) => !v)} className="relative">
        <Stat color="#FF4B4B" value={me?.hearts ?? 0}>
          <Heart />
        </Stat>
      </button>
      {open && (
        <HeartsSheet hearts={me?.hearts ?? 0} remain={remain} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function HeartsSheet({
  hearts,
  remain,
  onClose,
}: {
  hearts: number;
  remain: number | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { refresh } = useStats();
  return (
    <div className="absolute right-0 top-12 z-30 w-72 bg-[var(--modal-bg)] border-2 border-[var(--border)] rounded-2xl p-4">
      <div className="font-extrabold text-lg mb-1">Hearts</div>
      <p className="text-sm font-semibold text-[var(--wolf)] mb-3">
        {hearts >= 5
          ? "You're full. Keep learning!"
          : remain != null
            ? `Next heart in ${formatEta(remain)}`
            : "Hearts refill every 4 hours."}
      </p>
      <DuoButton
        className="w-full mb-2"
        onClick={async () => {
          const res = await api.practiceRefill();
          await refresh();
          onClose();
          if (res.lessonId) router.push(`/lesson/${res.lessonId}`);
        }}
      >
        Practice to refill
      </DuoButton>
      <DuoButton variant="outline" className="w-full" onClick={onClose}>
        Close
      </DuoButton>
    </div>
  );
}

function formatEta(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}h ${mm}m`;
  return `${mm}:${String(s).padStart(2, "0")}`;
}

function Stat({
  color,
  value,
  children,
}: {
  color: string;
  value: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 font-extrabold text-[17px]" style={{ color }}>
      {children}
      <span>{value}</span>
    </div>
  );
}

function Flag({ code }: { code: string }) {
  if (code !== "ES") return <span>*</span>;
  return (
    <svg width="36" height="26" viewBox="0 0 40 28" className="rounded-[4px] overflow-hidden">
      <rect width="40" height="28" fill="#C60B1E" />
      <rect y="8" width="40" height="12" fill="#FFC400" />
    </svg>
  );
}

function Flame({ dim }: { dim?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={dim ? "var(--hare)" : "#FF9600"}>
      <path d="M12 2s4 5 4 9a4 4 0 1 1-8 0c0-2 2-5 4-9zm0 20c4 0 7-3 7-8 0-2-1-4-2-6-1 2-2 3-3 3s1-2 1-4c-3 1-7 5-7 9 0 5 3 8 4 6z" />
    </svg>
  );
}
function Gem() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1CB0F6">
      <path d="M3 9 8 3h8l5 6-9 12L3 9zm5.2-4.5L6 9h3.2L8.2 4.5zM10.5 9l.7-4.5h1.6l.7 4.5h-3zm4.3 0H18l-2.2-4.5L14.8 9z" />
    </svg>
  );
}
function Heart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF4B4B">
      <path d="M12 21s-7-4.6-9.5-9C.4 8.2 2.2 4 6.2 4c2 0 3.4 1.2 5.8 3.6C14.4 5.2 15.8 4 17.8 4c4 0 5.8 4.2 3.7 8-2.5 4.4-9.5 9-9.5 9z" />
    </svg>
  );
}
