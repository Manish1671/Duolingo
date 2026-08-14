"use client";

import { DuoButton } from "./DuoButton";

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-16 text-center max-w-md mx-auto">
      <h1 className="text-3xl font-extrabold mb-3">{title}</h1>
      <p className="text-[var(--wolf)] font-bold mb-6">{body}</p>
      <DuoButton variant="outline" disabled>
        Coming soon
      </DuoButton>
    </div>
  );
}
