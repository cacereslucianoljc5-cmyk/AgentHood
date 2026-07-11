import { NextResponse } from "next/server";
import { checkAndConsume, getClientIp, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Returns a ready-to-load image URL (no branding/logo) for the given prompt.
// The client loads it directly, keeping the serverless function fast.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rate = checkAndConsume(ip, "image");
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Has alcanzado el límite diario de ${LIMITS.image} imágenes. Vuelve mañana.`,
        remaining: 0,
        limit: LIMITS.image,
      },
      { status: 429 }
    );
  }

  let body: { prompt?: string; ratio?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Escribe una descripción" }, { status: 400 });
  }
  if (prompt.length > 800) {
    return NextResponse.json({ error: "La descripción es demasiado larga" }, { status: 400 });
  }

  const sizes: Record<string, [number, number]> = {
    square: [1024, 1024],
    landscape: [1280, 768],
    portrait: [768, 1280],
  };
  const [width, height] = sizes[body.ratio || "square"] || sizes.square;

  // Pseudo-random seed without Math.random dependency concerns.
  const seed = (Date.now() % 1_000_000) + prompt.length;

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: "true",
    model: "flux",
    referrer: "agenthood",
  });

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?${params.toString()}`;

  return NextResponse.json({
    url,
    remaining: rate.remaining,
    limit: rate.limit,
  });
}
