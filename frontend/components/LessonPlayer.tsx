"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  CheckResponse,
  Exercise,
  LessonResponse,
} from "@/lib/api";
import { getPrefs } from "@/lib/prefs";
import { playComplete, playCorrect, playWrong, speak, speakableText, unlockAudio } from "@/lib/sound";
import { useStats } from "./StatsProvider";
import { DuoButton } from "./DuoButton";
import { FeedbackBar, LessonCompleteModal, OutOfHeartsModal } from "./FeedbackBar";
import { MultipleChoice } from "./exercises/MultipleChoice";
import { TranslateTap } from "./exercises/TranslateTap";
import { MatchPairs } from "./exercises/MatchPairs";
import { FillBlank } from "./exercises/FillBlank";
import { TypeAnswer } from "./exercises/TypeAnswer";

type Item = { id: string; text: string };
type Token = { id: number; text: string };

export function LessonPlayer({ lessonId }: { lessonId: number }) {
  const router = useRouter();
  const { me, refresh, setHearts } = useStats();
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [originalCount, setOriginalCount] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; expected?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [complete, setComplete] = useState<{
    xp: number;
    streak: number;
    dailyGoalMet?: boolean;
  } | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPractice, setIsPractice] = useState(false);
  const finishing = useRef(false);

  const [mc, setMc] = useState<string | null>(null);
  const [tap, setTap] = useState<number[]>([]);
  const [typed, setTyped] = useState("");
  const [blank, setBlank] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [shuffledRight, setShuffledRight] = useState<Item[]>([]);

  const current = queue[0];

  useEffect(() => {
    let cancelled = false;
    finishing.current = false;
    setLesson(null);
    setAttemptId(null);
    setQueue([]);
    setCorrectCount(0);
    setFeedback(null);
    setComplete(null);
    setOutOfHearts(false);
    setError(null);
    setIsPractice(false);
    setMc(null);
    setTap([]);
    setTyped("");
    setBlank(null);
    setMatched(new Set());
    setSelL(null);
    setSelR(null);
    setWrong(new Set());
    setChecking(false);

    (async () => {
      try {
        const started = await api.startLesson(lessonId);
        if (cancelled) return;
        setAttemptId(started.attemptId);
        setHearts(started.hearts);
        setIsPractice(Boolean(started.isPractice));
        const data = await api.lesson(lessonId);
        if (cancelled) return;
        setLesson(data);
        setQueue(data.exercises);
        setOriginalCount(data.exercises.length || 1);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403 && /heart/i.test(err.message)) {
          setOutOfHearts(true);
        } else {
          const message =
            err instanceof Error && err.name === "TimeoutError"
              ? "The API timed out. Is it running on port 8000?"
              : err instanceof Error
                ? err.message
                : "Could not start lesson";
          setError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Avoid restarting the lesson when hearts update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    if (current?.type !== "match_pairs") return;
    const payload = current.payload as { left: Item[]; right: Item[] };
    setShuffledRight(shuffle([...payload.right]));
    setMatched(new Set());
    setSelL(null);
    setSelR(null);
  }, [current?.id, current?.type, current?.payload]);

  const ready = useMemo(() => {
    if (!current) return false;
    if (current.type === "multiple_choice") return Boolean(mc);
    if (current.type === "translate_tap") return tap.length > 0;
    if (current.type === "fill_blank") return Boolean(blank);
    if (current.type === "type_answer") return typed.trim().length > 0;
    return false;
  }, [current, mc, tap, blank, typed]);

  function resetLocal() {
    setMc(null);
    setTap([]);
    setTyped("");
    setBlank(null);
    setFeedback(null);
  }

  function formatExpected(expected: unknown): string {
    if (typeof expected === "string") return expected;
    if (Array.isArray(expected)) return expected.join(" ");
    if (expected && typeof expected === "object" && "text" in (expected as object)) {
      return String((expected as { text: string }).text);
    }
    return "";
  }

  async function handleCheckResult(res: CheckResponse, expectedLabel?: string) {
    setHearts(res.hearts);
    if (res.failed) {
      playWrong();
      if (!isPractice) setOutOfHearts(true);
      return;
    }
    if (res.correct) {
      playCorrect();
      setCorrectCount((c) => c + 1);
      setFeedback({ correct: true });
    } else {
      playWrong();
      setFeedback({
        correct: false,
        expected: expectedLabel || formatExpected(res.expected),
      });
    }
  }

  async function check(asSkip = false) {
    if (!current || !attemptId || checking || feedback) return;
    setChecking(true);
    try {
      let body: Parameters<typeof api.check>[1] = { exerciseId: current.id, answer: {} };
      if (!asSkip) {
        if (current.type === "multiple_choice") {
          body = { exerciseId: current.id, answer: { optionId: mc } };
        } else if (current.type === "translate_tap") {
          body = { exerciseId: current.id, answer: { tokenIds: tap } };
        } else if (current.type === "fill_blank") {
          body = { exerciseId: current.id, answer: { optionId: blank } };
        } else if (current.type === "type_answer") {
          body = { exerciseId: current.id, answer: { text: typed } };
        }
      }
      const res = await api.check(attemptId, body);
      let expectedLabel = formatExpected(res.expected);
      if (current.type === "translate_tap") {
        const tokens = (current.payload.tokens as Token[]) || [];
        const ids = Array.isArray(res.expected) ? (res.expected as number[]) : [];
        expectedLabel = ids
          .map((id) => tokens.find((t) => t.id === id)?.text)
          .filter(Boolean)
          .join(" ");
      }
      if (current.type === "multiple_choice" || current.type === "fill_blank") {
        const options = (current.payload.options as Item[]) || [];
        const found = options.find((o) => o.id === String(res.expected));
        if (found) expectedLabel = found.text;
      }
      await handleCheckResult(res, expectedLabel);
    } catch {
      setFeedback({ correct: false, expected: "Could not check that answer. Try again." });
    } finally {
      setChecking(false);
    }
  }

  async function onContinue() {
    if (!current) return;
    const wasCorrect = feedback?.correct;
    setFeedback(null);
    setQueue((q) => {
      const [, ...rest] = q;
      if (wasCorrect) return rest;
      return [...rest, current];
    });
    resetLocal();
  }

  useEffect(() => {
    if (!lesson || !attemptId || complete || outOfHearts || finishing.current) return;
    if (queue.length === 0 && lesson.exercises.length > 0 && !feedback) {
      finishing.current = true;
      (async () => {
        try {
          const sim = getPrefs().simulateDate;
          const res = await api.complete(attemptId, sim || undefined);
          playComplete();
          setComplete({
            xp: res.xpAwarded,
            streak: res.streak,
            dailyGoalMet: res.dailyGoalMet || res.daily_goal_met,
          });
          await refresh();
        } catch (err) {
          finishing.current = false;
          setError(err instanceof Error ? err.message : "Could not complete lesson");
        }
      })();
    }
  }, [queue.length, lesson, attemptId, complete, outOfHearts, feedback, refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      if (feedback) onContinue();
      else if (ready) check();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function pickMatch(side: "left" | "right", id: string) {
    if (!current || !attemptId || current.type !== "match_pairs" || checking || feedback) return;
    const nextL = side === "left" ? id : selL;
    const nextR = side === "right" ? id : selR;
    if (side === "left") setSelL(id);
    else setSelR(id);
    if (!nextL || !nextR) return;

    setChecking(true);
    try {
      const res = await api.check(attemptId, {
        exerciseId: current.id,
        leftId: nextL,
        rightId: nextR,
      });
      setHearts(res.hearts);
      if (res.failed) {
        playWrong();
        if (!isPractice) setOutOfHearts(true);
        return;
      }
      if (res.pairCorrect) {
        playCorrect();
        const next = new Set(matched);
        next.add(nextL);
        next.add(nextR);
        setMatched(next);
        const payload = current.payload as { left: Item[]; right: Item[] };
        if (next.size >= payload.left.length + payload.right.length) {
          const original = current.payload as { left: Item[]; right: Item[] };
          const pairs = original.left.map((item, i) => [item.id, original.right[i].id]);
          const finalRes = await api.check(attemptId, {
            exerciseId: current.id,
            answer: { pairs },
          });
          await handleCheckResult(finalRes);
        }
      } else {
        playWrong();
        setWrong(new Set([nextL, nextR]));
        setTimeout(() => setWrong(new Set()), 450);
      }
      setSelL(null);
      setSelR(null);
    } catch {
      setSelL(null);
      setSelR(null);
    } finally {
      setChecking(false);
    }
  }

  async function practiceRefill() {
    try {
      const res = await api.practiceRefill();
      setHearts(res.hearts);
      setOutOfHearts(false);
      if (res.lessonId) {
        router.push(`/lesson/${res.lessonId}`);
      } else {
        await refresh();
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  }

  const progress = Math.min(100, Math.round((correctCount / originalCount) * 100));
  const speakText = current
    ? speakableText(current.prompt, current.type, current.payload || {})
    : "";

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  if (outOfHearts) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <OutOfHeartsModal onPractice={practiceRefill} onQuit={() => router.push("/")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-extrabold text-xl mb-4">{error}</p>
          <DuoButton onClick={() => router.push("/")}>Back to path</DuoButton>
        </div>
      </div>
    );
  }

  if (!current && complete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <LessonCompleteModal
          xp={complete.xp}
          streak={complete.streak}
          dailyGoalMet={complete.dailyGoalMet}
          onContinue={() => router.push("/")}
        />
      </div>
    );
  }

  if (!lesson || !current) {
    return (
      <div className="min-h-screen flex items-center justify-center font-extrabold text-[var(--wolf)]">
        Loading...
      </div>
    );
  }

  const payload = current.payload;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <div className="flex items-center gap-4 px-4 py-4 max-w-[780px] mx-auto w-full">
        <button
          onClick={() => router.push("/")}
          className="text-[var(--hare)] text-3xl leading-none px-2 font-extrabold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex-1 h-4 rounded-full bg-[var(--progress-track)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#58cc02] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1 font-extrabold text-[#ff4b4b] min-w-[48px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF4B4B">
            <path d="M12 21s-7-4.6-9.5-9C.4 8.2 2.2 4 6.2 4c2 0 3.4 1.2 5.8 3.6C14.4 5.2 15.8 4 17.8 4c4 0 5.8 4.2 3.7 8-2.5 4.4-9.5 9-9.5 9z" />
          </svg>
          {isPractice ? "∞" : (me?.hearts ?? 0)}
        </div>
      </div>

      <div className="flex-1 max-w-[680px] mx-auto w-full px-4 py-6">
        <div className="flex items-start gap-3 mb-8">
          <h1 className="text-2xl font-extrabold flex-1">{current.prompt}</h1>
          <button
              className="shrink-0 w-12 h-12 rounded-2xl border-2 border-[var(--border)] shadow-[0_2px_0_var(--chip-lip)] text-[#1cb0f6] font-extrabold"
            onClick={() => {
                unlockAudio();
                speak(speakText);
              }}
              aria-label="Play audio"
            >
              ▶
            </button>
        </div>
        {current.type === "multiple_choice" && (
          <MultipleChoice
            options={(payload.options as Item[]) || []}
            selected={mc}
            onSelect={setMc}
            disabled={Boolean(feedback)}
          />
        )}
        {current.type === "translate_tap" && (
          <TranslateTap
            tokens={(payload.tokens as Token[]) || []}
            selected={tap}
            onToggle={(id) =>
              setTap((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
            disabled={Boolean(feedback)}
          />
        )}
        {current.type === "fill_blank" && (
          <FillBlank
            before={String(payload.before || "")}
            after={String(payload.after || "")}
            options={(payload.options as Item[]) || []}
            selected={blank}
            onSelect={setBlank}
            disabled={Boolean(feedback)}
          />
        )}
        {current.type === "type_answer" && (
          <TypeAnswer
            value={typed}
            onChange={setTyped}
            disabled={Boolean(feedback)}
            onSubmit={() => ready && check()}
          />
        )}
        {current.type === "match_pairs" && (
          <MatchPairs
            left={(payload.left as Item[]) || []}
            right={shuffledRight}
            matched={matched}
            selectedLeft={selL}
            selectedRight={selR}
            wrong={wrong}
            onPick={pickMatch}
            disabled={Boolean(feedback)}
          />
        )}
      </div>

      <div className="border-t-2 border-[var(--border)]">
        {feedback ? (
          <FeedbackBar
            correct={feedback.correct}
            expected={feedback.expected}
            onContinue={onContinue}
          />
        ) : (
          <div className="max-w-[680px] mx-auto px-4 py-4 flex justify-between items-center">
            {current.type !== "match_pairs" ? (
              <>
                <DuoButton variant="outline" disabled={checking} onClick={() => check(true)}>
                  Skip
                </DuoButton>
                <DuoButton disabled={!ready || checking} onClick={() => check()}>
                  Check
                </DuoButton>
              </>
            ) : (
              <span className="text-[var(--wolf)] font-bold">Tap the matching pairs</span>
            )}
          </div>
        )}
      </div>

      {complete && (
        <LessonCompleteModal
          xp={complete.xp}
          streak={complete.streak}
          dailyGoalMet={complete.dailyGoalMet}
          onContinue={() => router.push("/")}
        />
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
