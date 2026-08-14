"use client";

import { useEffect, useState } from "react";
import { api, PathResponse } from "@/lib/api";
import { PathView } from "@/components/PathView";

export default function LearnPage() {
  const [data, setData] = useState<PathResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const path = await api.path();
        if (!cancelled) {
          setData(path);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    }
    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, []);

  if (error) {
    return (
      <p className="text-[#ff4b4b] font-bold mt-8">
        {error}. Start the API on port 8000 (see the README).
      </p>
    );
  }

  if (!data) {
    return <PathSkeleton />;
  }

  return <PathView units={data.units} />;
}

function PathSkeleton() {
  return (
    <div className="animate-pulse py-2" aria-busy="true" aria-label="Loading path">
      <div className="h-[88px] rounded-[16px] bg-[var(--bg-elevated)] mb-10" />
      <div className="flex flex-col items-center gap-8 py-6">
        {[0, 28, 52, 28, 0].map((offset, i) => (
          <div
            key={i}
            className="w-[70px] h-[70px] rounded-full bg-[var(--locked)]"
            style={{ transform: `translateX(${offset}px)` }}
          />
        ))}
      </div>
    </div>
  );
}
