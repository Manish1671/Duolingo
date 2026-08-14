import { getPrefs } from "./prefs";

let ctx: AudioContext | null = null;
let player: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let voices: SpeechSynthesisVoice[] = [];

function AudioCtx(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

function audio() {
  const Ctor = AudioCtx();
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function unlockAudio() {
  const ac = audio();
  if (ac && ac.state === "suspended") void ac.resume();
  const s = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (s) {
    voices = s.getVoices();
    if (s.paused) s.resume();
  }
}

export function preloadVoices() {
  if (typeof window === "undefined") return;
  const s = window.speechSynthesis;
  if (!s) return;
  voices = s.getVoices();
  s.addEventListener("voiceschanged", () => {
    voices = s.getVoices();
  });
  if (!player) player = new Audio();
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.08, delay = 0) {
  try {
    const ac = audio();
    if (!ac) return;
    void ac.resume();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ac.currentTime + delay;
    g.gain.setValueAtTime(Math.max(gain, 0.001), start);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(start);
    g.gain.exponentialRampToValueAtTime(0.001, start + Math.max(duration, 0.05));
    osc.stop(start + duration);
  } catch {
    // never block lessons
  }
}

export function playCorrect() {
  if (!getPrefs().sound) return;
  unlockAudio();
  tone(523, 0.12, "triangle", 0.09);
  tone(784, 0.18, "triangle", 0.08, 0.1);
}

export function playWrong() {
  if (!getPrefs().sound) return;
  unlockAudio();
  tone(220, 0.22, "sawtooth", 0.05);
}

export function playComplete() {
  if (!getPrefs().sound) return;
  unlockAudio();
  tone(392, 0.12, "triangle", 0.08);
  tone(523, 0.12, "triangle", 0.08, 0.1);
  tone(659, 0.12, "triangle", 0.08, 0.2);
  tone(784, 0.28, "triangle", 0.1, 0.32);
}

export function looksSpanish(text: string): boolean {
  return /[áéíóúñü¿¡]|hola|gracias|adiós|dónde|está|soy|quiero|casa|agua|por favor|mucho gusto/i.test(
    text,
  );
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const want = lang.toLowerCase().replace("_", "-");
  const prefix = want.slice(0, 2);
  const list = voices.length ? voices : window.speechSynthesis?.getVoices() || [];
  return (
    list.find((v) => v.lang.toLowerCase().replace("_", "-") === want) ||
    list.find((v) => v.lang.toLowerCase().startsWith(prefix + "-")) ||
    list.find((v) => v.lang.toLowerCase().startsWith(prefix))
  );
}

function speakBrowser(text: string, lang: string) {
  const s = window.speechSynthesis;
  if (!s) return false;
  try {
    s.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.92;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    currentUtterance = utterance;
    s.speak(utterance);
    if (s.paused) s.resume();
    return true;
  } catch {
    return false;
  }
}

export function speak(text: string, lang?: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean || typeof window === "undefined") return;
  if (!getPrefs().speech) return;

  unlockAudio();
  const resolved = lang || (looksSpanish(clean) ? "es-ES" : "en-US");
  const tl = resolved.slice(0, 2);

  if (!player) player = new Audio();
  player.pause();
  player.onerror = () => speakBrowser(clean, resolved);
  player.src = `/api/tts?tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(clean)}`;
  player.currentTime = 0;
  const started = player.play();
  if (started) {
    started.catch(() => speakBrowser(clean, resolved));
  }
}

export function speakableText(prompt: string, type: string, payload: Record<string, unknown>): string {
  const quoted = prompt.match(/[“"]([^”"]+)[”"]/);
  if (type === "fill_blank") {
    return `${payload.before || ""} ${payload.after || ""}`.trim() || prompt;
  }
  if (type === "translate_tap") {
    return prompt.replace(/^Translate:\s*/i, "").trim();
  }
  if (type === "type_answer") {
    return quoted?.[1] || prompt;
  }
  if (type === "multiple_choice") {
    return quoted?.[1] || prompt;
  }
  if (type === "match_pairs") {
    const left = payload.left as { text: string }[] | undefined;
    return left?.[0]?.text || prompt;
  }
  return quoted?.[1] || prompt;
}
