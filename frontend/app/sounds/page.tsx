"use client";

import { useState } from "react";
import { speak, unlockAudio } from "@/lib/sound";

const ITEMS = [
  { es: "Hola", en: "Hello" },
  { es: "Adiós", en: "Goodbye" },
  { es: "Gracias", en: "Thank you" },
  { es: "Por favor", en: "Please" },
  { es: "Yo soy", en: "I am" },
  { es: "Mucho gusto", en: "Nice to meet you" },
  { es: "¿Dónde está?", en: "Where is it?" },
  { es: "El café", en: "The cafe" },
  { es: "La casa", en: "The house" },
  { es: "Agua", en: "Water" },
  { es: "Pan", en: "Bread" },
  { es: "La cuenta", en: "The check" },
];

export default function SoundsPage() {
  const [playing, setPlaying] = useState<string | null>(null);

  function play(text: string) {
    unlockAudio();
    setPlaying(text);
    speak(text, "es-ES");
    window.setTimeout(() => setPlaying((cur) => (cur === text ? null : cur)), 1200);
  }

  return (
    <div className="py-4">
      <h1 className="text-3xl font-extrabold mb-2">Sounds</h1>
      <p className="text-[var(--wolf)] font-bold mb-6">
        Tap a card to hear Spanish pronunciation.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <button
            key={item.es}
            onClick={() => play(item.es)}
            className={`duo-card text-left flex items-center justify-between gap-3 ${
              playing === item.es ? "border-[#1cb0f6]" : ""
            }`}
          >
            <span>
              <span className="block text-xl font-extrabold">{item.es}</span>
              <span className="text-sm font-bold text-[var(--wolf)]">{item.en}</span>
            </span>
            <span className="w-10 h-10 rounded-full bg-[#1cb0f6] text-white font-extrabold flex items-center justify-center">
              ▶
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
