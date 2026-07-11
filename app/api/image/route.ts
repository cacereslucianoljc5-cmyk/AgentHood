import { NextResponse } from "next/server";
import { checkAndConsume, getClientIp, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Describes a reference image using Pollinations' free vision endpoint. Accepts
// a base64 data URI, so no external file host is needed. Returns a short caption
// suitable for feeding into a text-to-image prompt.
async function describeImage(dataUri: string): Promise<string> {
  const payload = {
    model: "openai",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Describe esta imagen en una sola frase concisa (máx 60 palabras) para un " +
              "generador de imágenes: sujeto principal, estilo, colores, composición y fondo. " +
              "Responde solo con la descripción, sin comentarios ni comillas.",
          },
          { type: "image_url", image_url: { url: dataUri } },
        ],
      },
    ],
    max_tokens: 300,
    private: true,
    referrer: "agenthood",
  };

  const r = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    console.error("describeImage not ok", r.status, detail.slice(0, 200));
    throw new Error("vision " + r.status);
  }
  const data = (await r.json().catch(() => null)) as
    | { choices?: { message?: { content?: string } }[] }
    | null;
  const caption = data?.choices?.[0]?.message?.content;
  if (!caption || typeof caption !== "string") {
    console.error("describeImage empty response");
    throw new Error("vision empty");
  }
  return caption.trim();
}

// Returns a ready-to-load image URL (no branding/logo) for the given prompt.
// If a reference image is provided, the free vision model describes it and that
// description is blended into the prompt so the result reflects the reference.
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

  let prompt = "";
  let ratio = "square";
  let referenceFile: File | null = null;

  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      prompt = String(form.get("prompt") || "").trim();
      ratio = String(form.get("ratio") || "square");
      const file = form.get("image");
      if (file && typeof file !== "string" && file.size > 0) {
        if (file.size > 8_000_000) {
          return NextResponse.json(
            { error: "La imagen de referencia es demasiado grande (máx 8 MB)." },
            { status: 400 }
          );
        }
        referenceFile = file;
      }
    } else {
      const body = (await req.json()) as { prompt?: string; ratio?: string };
      prompt = (body.prompt || "").trim();
      ratio = body.ratio || "square";
    }
  } catch (e) {
    console.error("image route: body parse failed", e);
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: "Escribe una descripción" }, { status: 400 });
  }
  if (prompt.length > 800) {
    return NextResponse.json({ error: "La descripción es demasiado larga" }, { status: 400 });
  }

  // Blend the reference image (via vision caption) into the prompt.
  let finalPrompt = prompt;
  if (referenceFile) {
    try {
      const buf = Buffer.from(await referenceFile.arrayBuffer());
      const type = referenceFile.type || "image/png";
      const dataUri = `data:${type};base64,${buf.toString("base64")}`;
      const caption = await describeImage(dataUri);
      finalPrompt = `${prompt}. Inspirado en esta imagen de referencia: ${caption}`.slice(
        0,
        1500
      );
    } catch (e) {
      console.error("image route: reference analysis failed", e);
      return NextResponse.json(
        {
          error:
            "No se pudo analizar la imagen de referencia ahora mismo. Intenta con otra imagen o genera sin referencia.",
        },
        { status: 502 }
      );
    }
  }

  const sizes: Record<string, [number, number]> = {
    square: [1024, 1024],
    landscape: [1280, 768],
    portrait: [768, 1280],
  };
  const [width, height] = sizes[ratio] || sizes.square;

  // Pseudo-random seed without Math.random dependency concerns.
  const seed = (Date.now() % 1_000_000) + finalPrompt.length;

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: "true",
    model: "flux",
    referrer: "agenthood",
  });

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    finalPrompt
  )}?${params.toString()}`;

  return NextResponse.json({
    url,
    remaining: rate.remaining,
    limit: rate.limit,
    usedReference: Boolean(referenceFile),
  });
}
