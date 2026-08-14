"use client";

import { useEffect, useState } from "react";
import { getPrefs, setPrefs, Prefs } from "@/lib/prefs";
import { THEME_OPTIONS, ThemePref, applyTheme } from "@/lib/theme";
import { DuoButton } from "@/components/DuoButton";
import { api } from "@/lib/api";
import { useStats } from "@/components/StatsProvider";

export default function SettingsPage() {
  const { me, refresh } = useStats();
  const [prefs, setLocal] = useState<Prefs>(getPrefs());

  useEffect(() => {
    setLocal(getPrefs());
  }, []);

  function update(patch: Partial<Prefs>) {
    const next = setPrefs(patch);
    setLocal(next);
    if (patch.theme) applyTheme(patch.theme);
  }

  return (
    <div className="py-4 max-w-md">
      <h1 className="text-3xl font-extrabold mb-6">Settings</h1>

      <div className="duo-card mb-3">
        <div className="font-extrabold mb-1">Dark mode</div>
        <p className="text-sm text-[var(--wolf)] font-semibold mb-4">
          Choose when Duolingo uses a darker color theme.
        </p>
        <div className="flex flex-col gap-2">
          {THEME_OPTIONS.map((opt) => (
            <ThemeOption
              key={opt.id}
              selected={prefs.theme === opt.id}
              label={opt.label}
              hint={opt.hint}
              onSelect={() => update({ theme: opt.id as ThemePref })}
            />
          ))}
        </div>
      </div>

      <Row
        title="Sound effects"
        body="Correct and incorrect chimes in lessons"
        on={prefs.sound}
        onToggle={() => update({ sound: !prefs.sound })}
      />
      <Row
        title="Speaking"
        body="Browser text-to-speech for Spanish prompts"
        on={prefs.speech}
        onToggle={() => update({ speech: !prefs.speech })}
      />

      <div className="duo-card mb-3">
        <div className="font-extrabold mb-1">Daily XP goal</div>
        <p className="text-sm text-[var(--wolf)] font-semibold mb-3">Used on the quests card and path rail.</p>
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((n) => (
            <DuoButton
              key={n}
              variant={n === (me?.dailyGoalXp ?? 20) ? "green" : "outline"}
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

      <div className="duo-card">
        <div className="font-extrabold mb-1">Simulate streak date</div>
        <p className="text-sm text-[var(--wolf)] font-semibold mb-3">
          For interviews: set a date, then complete a lesson. Streak uses this as “today”.
        </p>
        <input
          type="date"
          value={prefs.simulateDate}
          onChange={(e) => update({ simulateDate: e.target.value })}
          className="theme-input mb-3"
        />
        <DuoButton variant="outline" className="w-full" onClick={() => update({ simulateDate: "" })}>
          Use real date
        </DuoButton>
      </div>
    </div>
  );
}

function ThemeOption({
  selected,
  label,
  hint,
  onSelect,
}: {
  selected: boolean;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left ${
        selected
          ? "border-[var(--nav-active-border)] bg-[var(--nav-active-bg)]"
          : "border-[var(--border)] hover:bg-[var(--nav-hover)]"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-[#58cc02]" : "border-[var(--border)]"
        }`}
      >
        {selected && <span className="w-3 h-3 rounded-full bg-[#58cc02]" />}
      </span>
      <span>
        <span className="block font-extrabold uppercase text-sm tracking-wide">{label}</span>
        <span className="block text-xs font-semibold text-[var(--wolf)]">{hint}</span>
      </span>
    </button>
  );
}

function Row({
  title,
  body,
  on,
  onToggle,
}: {
  title: string;
  body: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="duo-card mb-3 flex items-center gap-3">
      <div className="flex-1">
        <div className="font-extrabold">{title}</div>
        <p className="text-sm text-[var(--wolf)] font-semibold">{body}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-14 h-8 rounded-full relative ${on ? "bg-[#58cc02]" : "bg-[var(--toggle-off)]"}`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
            on ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
