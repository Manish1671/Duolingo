"use client";

import { useRouter } from "next/navigation";
import { PathNode as PathNodeType, PathUnit } from "@/lib/api";
import { Owl } from "./Owl";
import { DuoButton } from "./DuoButton";
import { useEffect, useMemo, useRef, useState } from "react";

const OFFSETS = [0, 28, 52, 28, 0, -28, -52, -28];

export function PathView({ units }: { units: PathUnit[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<PathNodeType | null>(null);
  const [showFab, setShowFab] = useState(false);
  const currentRef = useRef<HTMLDivElement | null>(null);
  let globalIndex = 0;

  const currentNode = useMemo(
    () => units.flatMap((u) => u.nodes).find((n) => n.status === "active"),
    [units],
  );
  const activeUnitId = useMemo(
    () => units.find((u) => u.nodes.some((n) => n.status === "active"))?.id,
    [units],
  );

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentNode?.id]);

  useEffect(() => {
    function onScroll() {
      const el = currentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setShowFab(rect.top < 96 || rect.bottom > window.innerHeight - 96);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentNode?.id]);

  return (
    <div className="relative pb-16">
      {units.map((unit, uIdx) => (
        <section key={unit.id} className="mb-1">
          <UnitBanner unit={unit} />
          <div className="relative flex flex-col items-center py-11 gap-8 min-h-[260px]">
            {unit.id === activeUnitId && (
              <div className="absolute right-0 sm:right-2 top-[72px] hidden sm:flex flex-col items-center z-0 pointer-events-none">
                <Owl size={108} />
                <div className="w-[108px] h-[22px] rounded-full bg-[var(--pedestal)] -mt-2" />
              </div>
            )}
            {unit.nodes.map((node, i) => {
              const offset = OFFSETS[globalIndex % OFFSETS.length];
              globalIndex += 1;
              const isCurrent = node.status === "active";
              const kind = iconKind(node, i, unit.nodes.length);
              return (
                <div
                  key={node.id}
                  ref={isCurrent ? currentRef : undefined}
                  className="relative z-[1] flex items-center justify-center"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  <button
                    onClick={() => setSelected(node)}
                    className={`relative ${isCurrent ? "current-node" : ""}`}
                    aria-label={node.title}
                  >
                    {isCurrent && (
                      <div className="start-bubble absolute -top-[42px] left-1/2 -translate-x-1/2 text-[13px] font-extrabold tracking-[0.14em] px-3.5 py-[6px] rounded-[8px] uppercase whitespace-nowrap">
                        Start
                      </div>
                    )}
                    <PathBubble node={node} kind={kind} current={isCurrent} />
                  </button>
                </div>
              );
            })}
          </div>
          {units[uIdx + 1] && (
            <div className="flex items-center gap-4 py-3 text-[var(--hare)] font-extrabold text-[15px]">
              <span className="flex-1 h-[2px] bg-[var(--border)]" />
              {units[uIdx + 1].title}
              <span className="flex-1 h-[2px] bg-[var(--border)]" />
            </div>
          )}
        </section>
      ))}

      {showFab && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="sticky top-[calc(100vh-6.5rem)] flex justify-end pr-1 md:pr-2">
            <button
              type="button"
              onClick={() =>
                currentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
              }
              className="pointer-events-auto w-14 h-14 rounded-full bg-[var(--card)] border-2 border-[var(--border)] shadow-[0_2px_0_var(--border)] flex items-center justify-center"
              aria-label="Jump to current lesson"
            >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1cb0f6" strokeWidth="3">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
            </button>
          </div>
        </div>
      )}

      {selected && (
        <StartSheet
          node={selected}
          onClose={() => setSelected(null)}
          onStart={() => {
            if (selected.nextLessonId && selected.status !== "locked") {
              router.push(`/lesson/${selected.nextLessonId}`);
            }
          }}
        />
      )}
    </div>
  );
}

function iconKind(node: PathNodeType, index: number, total: number) {
  if (node.type === "practice") return "dumbbell";
  if (index === total - 1) return "trophy";
  if (index === 1) return "book";
  if (index === 2) return "chest";
  return "star";
}

function UnitBanner({ unit }: { unit: PathUnit }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="rounded-[16px] px-5 py-[18px] text-white flex items-center justify-between gap-4"
        style={{ background: unit.color, boxShadow: `0 4px 0 ${shade(unit.color)}` }}
      >
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold uppercase tracking-[0.04em] opacity-90">
            ← Section 1, Unit {unit.position}
          </div>
          <div className="text-[19px] font-extrabold leading-tight mt-0.5">{unit.title}</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 flex items-center gap-2 rounded-[14px] bg-white/15 border-2 border-white/80 px-3.5 py-2.5 font-extrabold uppercase text-[13px] tracking-wide text-white"
        >
          <BookIcon />
          Guidebook
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="modal-pop relative bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md border-2 border-[var(--border)]">
            <div className="text-xs font-extrabold uppercase text-[var(--wolf)]">Guidebook</div>
            <h3 className="text-2xl font-extrabold mb-2">{unit.title}</h3>
            <p className="text-[var(--wolf)] font-semibold mb-4">{unit.description}</p>
            <ul className="font-bold space-y-2 mb-6">
              {unit.nodes.map((n) => (
                <li key={n.id} className="flex justify-between">
                  <span>{n.title}</span>
                  <span className="text-[var(--hare)] uppercase text-xs">{n.status}</span>
                </li>
              ))}
            </ul>
            <DuoButton className="w-full" onClick={() => setOpen(false)}>
              Got it
            </DuoButton>
          </div>
        </div>
      )}
    </>
  );
}

function PathBubble({
  node,
  kind,
  current,
}: {
  node: PathNodeType;
  kind: string;
  current?: boolean;
}) {
  const locked = node.status === "locked";
  const complete = node.status === "complete";
  const fill = locked ? "var(--locked)" : complete ? "#FFC800" : node.color;
  const lip = locked ? "var(--locked-lip)" : complete ? "#E5A100" : shade(node.color);
  const icon = locked ? "#afafaf" : "#fff";
  const size = current ? 74 : 70;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{ background: fill, boxShadow: `0 8px 0 ${lip}` }}
      >
        {kind === "chest" ? (
          <ChestIcon fill={icon} />
        ) : kind === "dumbbell" ? (
          <DumbbellIcon fill={icon} />
        ) : kind === "trophy" ? (
          <TrophyIcon fill={icon} />
        ) : kind === "book" ? (
          <OpenBookIcon fill={icon} />
        ) : (
          <StarIcon fill={icon} />
        )}
      </div>
    </div>
  );
}

function StartSheet({
  node,
  onClose,
  onStart,
}: {
  node: PathNodeType;
  onClose: () => void;
  onStart: () => void;
}) {
  const locked = node.status === "locked";
  const replay = node.status === "complete";
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <button className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="Close" />
      <div
        className="relative modal-pop w-full sm:w-[420px] rounded-t-2xl sm:rounded-2xl p-6"
        style={{ background: locked ? "var(--bg-elevated)" : node.color }}
      >
        <div className={locked ? "text-[var(--text)]" : "text-white"}>
          <div className="text-2xl font-extrabold mb-1">{node.title}</div>
          <div className="font-semibold mb-6 opacity-90">
            {locked
              ? "Complete the previous lesson to unlock this one."
              : replay
                ? "Practice this skill again for extra XP."
                : `Lesson ${Math.min(node.lessonsCompleted + 1, node.lessonsTotal)} of ${node.lessonsTotal}`}
          </div>
          {locked ? (
            <DuoButton variant="outline" className="w-full" onClick={onClose}>
              Locked
            </DuoButton>
          ) : (
            <DuoButton
              variant="outline"
              className="w-full !bg-white !text-[#131f24] !border-0"
              onClick={onStart}
            >
              {replay ? "Practice again" : "Start"} +{node.type === "practice" ? 5 : 10} XP
            </DuoButton>
          )}
        </div>
      </div>
    </div>
  );
}

function shade(hex: string) {
  const map: Record<string, string> = {
    "#58CC02": "#46A302",
    "#1CB0F6": "#1899D6",
    "#FF9600": "#CC7700",
    "#CE82FF": "#A568CC",
    "#FF4B4B": "#EA2B2B",
    "#FFC800": "#E5A100",
  };
  return map[hex.toUpperCase()] || "#46A302";
}

function StarIcon({ fill = "#fff" }: { fill?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2.4 14.7 9h7.1l-5.8 4.2 2.3 7-6.3-4.4-6.3 4.4 2.3-7L2.2 9h7.1z" />
    </svg>
  );
}
function ChestIcon({ fill = "#fff" }: { fill?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={fill}>
      <path d="M3 9h18v11H3V9zm1.5-5h15L21 9H3l1.5-5zM11 9v11h2V9h-2z" />
    </svg>
  );
}
function DumbbellIcon({ fill = "#fff" }: { fill?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={fill}>
      <path d="M2 9h3v6H2V9zm17 0h3v6h-3V9zM6 11h12v2H6v-2zM5 7h2v10H5V7zm12 0h2v10h-2V7z" />
    </svg>
  );
}
function TrophyIcon({ fill = "#fff" }: { fill?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={fill}>
      <path d="M7 3h10v4a5 5 0 0 1-4 4.9V14h3v2H8v-2h3v-2.1A5 5 0 0 1 7 7V3zM5 4h2v3H5V4zm12 0h2v3h-2V4zM8 18h8v2H8v-2z" />
    </svg>
  );
}
function OpenBookIcon({ fill = "#fff" }: { fill?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={fill}>
      <path d="M12 6.2C10.2 5 7.8 4.4 5 4.4H3v14h2.2c2.6 0 4.8.6 6.8 1.8 2-1.2 4.2-1.8 6.8-1.8H21v-14h-2c-2.8 0-5.2.6-7 1.8zm0 1.7c1.6-1 3.8-1.5 6.2-1.5h.8v11.2c-2.2.1-4.4.7-6 1.6V7.9H12zm-1 11.3c-1.6-.9-3.8-1.5-6-1.6V6.4h.8c2.4 0 4.6.5 6.2 1.5v11.3z" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <path d="M6 3h13a1 1 0 0 1 1 1v16H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1 2v13h11V5H7z" />
    </svg>
  );
}
