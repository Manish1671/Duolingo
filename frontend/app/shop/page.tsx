"use client";

import { useStats } from "@/components/StatsProvider";
import { DuoButton } from "@/components/DuoButton";

export default function ShopPage() {
  const { me } = useStats();
  return (
    <div className="py-4">
      <h1 className="text-3xl font-extrabold mb-2">Shop</h1>
      <p className="text-[var(--wolf)] font-bold mb-6">You have {me?.gems ?? 0} gems</p>

      <div className="border-2 border-[#ce82ff] rounded-2xl p-5 mb-4 bg-[var(--super-card-bg)]">
        <div className="text-xs font-extrabold uppercase text-[#ce82ff]">Super Duolingo</div>
        <h2 className="text-2xl font-extrabold my-1">No ads, unlimited hearts</h2>
        <p className="text-[var(--wolf)] font-semibold mb-4">
          Super is not available in this demo.
        </p>
        <DuoButton variant="outline" disabled>
          Coming soon
        </DuoButton>
      </div>

      <div className="border-2 border-[var(--border)] rounded-2xl p-5">
        <div className="text-xs font-extrabold uppercase text-[#1cb0f6]">Streak freeze</div>
        <h2 className="text-2xl font-extrabold my-1">Protect your streak</h2>
        <p className="text-[var(--wolf)] font-semibold mb-4">200 gems. Purchases are not enabled.</p>
        <DuoButton variant="blue" disabled>
          200 gems
        </DuoButton>
      </div>
    </div>
  );
}
