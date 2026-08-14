"use client";

import { DuoButton } from "./DuoButton";
import { Owl } from "./Owl";

export function FeedbackBar({
  correct,
  expected,
  onContinue,
}: {
  correct: boolean;
  expected?: string;
  onContinue: () => void;
}) {
  const title = correct ? "Nice!" : "Correct solution:";
  return (
    <div
      className={`feedback-enter border-t-2 ${
        correct ? "bg-[#d7ffb8] border-[#a5ed6e]" : "bg-[#ffdfe0] border-[#ffb3b3]"
      }`}
    >
      <div className="max-w-[680px] mx-auto px-4 py-5 flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-extrabold shrink-0 ${
            correct ? "bg-[#58cc02] text-white" : "bg-[#ff4b4b] text-white"
          }`}
        >
          {correct ? "✓" : "!"}
        </div>
        <div className="flex-1">
          <div
            className={`text-xl font-extrabold ${
              correct ? "text-[#58a700]" : "text-[#ea2b2b]"
            }`}
          >
            {title}
          </div>
          {!correct && expected && (
            <div className="font-bold text-[#ea2b2b] mt-1">{expected}</div>
          )}
        </div>
        <DuoButton variant={correct ? "green" : "red"} onClick={onContinue} className="min-w-[140px]">
          Continue
        </DuoButton>
      </div>
    </div>
  );
}

export function LessonCompleteModal({
  xp,
  streak,
  dailyGoalMet,
  onContinue,
}: {
  xp: number;
  streak: number;
  dailyGoalMet?: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="modal-pop relative overflow-hidden bg-[var(--modal-bg)] rounded-2xl p-8 w-full max-w-md text-center border-2 border-[var(--border)]">
        <Confetti />
        <Owl size={96} />
        <div className="text-4xl font-extrabold text-[#58cc02] mt-2 mb-2">
          Lesson complete!
        </div>
        <p className="text-[var(--wolf)] font-bold mb-6">
          {dailyGoalMet ? "Daily goal smashed. Keep the streak going!" : "You earned XP and kept your streak alive."}
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <div className="rounded-2xl border-2 border-[#ffc800] px-6 py-3">
            <div className="text-xs font-extrabold uppercase text-[#ffc800]">Total XP</div>
            <div className="text-2xl font-extrabold text-[#ffc800]">+{xp}</div>
          </div>
          <div className="rounded-2xl border-2 border-[#ff9600] px-6 py-3">
            <div className="text-xs font-extrabold uppercase text-[#ff9600]">Streak</div>
            <div className="text-2xl font-extrabold text-[#ff9600]">{streak}</div>
          </div>
        </div>
        <DuoButton className="w-full" onClick={onContinue}>
          Continue
        </DuoButton>
      </div>
    </div>
  );
}

function Confetti() {
  const bits = [
    "#58CC02",
    "#1CB0F6",
    "#FFC800",
    "#FF9600",
    "#CE82FF",
    "#FF4B4B",
    "#58CC02",
    "#1CB0F6",
  ];
  return (
    <>
      {bits.map((c, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${10 + i * 11}%`,
            background: c,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </>
  );
}

export function OutOfHeartsModal({
  onPractice,
  onQuit,
}: {
  onPractice: () => void;
  onQuit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="modal-pop bg-[var(--modal-bg)] rounded-2xl p-8 w-full max-w-md text-center border-2 border-[var(--border)]">
        <div className="text-5xl mb-3" aria-hidden>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="#FF4B4B" className="mx-auto">
            <path d="M12 21s-7-4.6-9.5-9C.4 8.2 2.2 4 6.2 4c2 0 3.4 1.2 5.8 3.6C14.4 5.2 15.8 4 17.8 4c4 0 5.8 4.2 3.7 8-2.5 4.4-9.5 9-9.5 9z" />
          </svg>
        </div>
        <div className="text-3xl font-extrabold mb-2">You ran out of hearts!</div>
        <p className="text-[var(--wolf)] font-bold mb-6">
          Practice to refill, or wait — hearts come back every 4 hours.
        </p>
        <div className="flex flex-col gap-3">
          <DuoButton onClick={onPractice}>Practice to refill</DuoButton>
          <DuoButton variant="outline" onClick={onQuit}>
            End lesson
          </DuoButton>
        </div>
      </div>
    </div>
  );
}
