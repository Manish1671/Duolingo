import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function sources(text: string, tl: string): string[] {
  const q = encodeURIComponent(text);
  const lang = encodeURIComponent(tl);
  const voice = tl.startsWith("es") ? "Conchita" : "Brian";
  return [
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${lang}&q=${q}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${q}`,
    `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${q}`,
  ];
}

export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 180);
  const tl = (req.nextUrl.searchParams.get("tl") || "es").slice(0, 5);
  if (!text) {
    return new Response("Missing q", { status: 400 });
  }

  for (const url of sources(text, tl)) {
    try {
      const upstream = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8" },
        cache: "no-store",
      });
      if (!upstream.ok || !upstream.body) continue;
      const contentType = upstream.headers.get("content-type") || "audio/mpeg";
      if (contentType.includes("text/html")) continue;
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      continue;
    }
  }

  return new Response("TTS unavailable", { status: 502 });
}
