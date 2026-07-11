import { NextResponse } from "next/server";
import { checkAndConsume, getClientIp, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Free Google AI Studio key (aistudio.google.com) — Gemini 2.5 Flash Image
// ("Nano Banana") does real image editing on the free tier (up to 500/day).
// Set as GEMINI_API_KEY in Vercel.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL = "gemini-2.5-flash-image";

type EditedImage = { data: Buffer; mime: string };

// Edits an image with Gemini: sends the image inline (base64) + instruction,
// returns the edited image bytes. No external file hosting needed.
async function editWithGemini(
  instruction: string,
  buf: Buffer,
  mime: string
): Promise<EditedImage> {
  const body = {
    contents: [
      {
        parts: [
          {
            text:
              `${instruction}. Aplica solo ese cambio y mantén el resto de la imagen ` +
              `igual: mismo sujeto, estilo, colores, iluminación y composición.`,
          },
          { inline_data: { mime_type: mime, data: buf.toString("base64") } },
        ],
      },
    ],
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    console.error("gemini failed", resp.status, detail.slice(0, 400));
    throw new Error("gemini " + resp.status);
  }

  const data = (await resp.json().catch(() => null)) as {
    candidates?: {
      content?: {
        parts?: {
          inlineData?: { data?: string; mimeType?: string };
          inline_data?: { data?: string; mime_type?: string };
        }[];
      };
    }[];
  } | null;

  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    const inline = p.inlineData || p.inline_data;
    const b64 = inline?.data;
    if (b64) {
      const outMime =
        (p.inlineData?.mimeType || p.inline_data?.mime_type) ?? "image/png";
      return { data: Buffer.from(b64, "base64"), mime: outMime };
    }
  }

  console.error("gemini: no image in response", JSON.stringify(data).slice(0, 400));
  throw new Error("no image in response");
}

const SIZES: Record<string, [number, number]> = {
  square: [1024, 1024],
  landscape: [1280, 768],
  portrait: [768, 1280],
};

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

  // ---------- Real image editing with Gemini (Nano Banana) ----------
  if (referenceFile) {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "La edición de imágenes aún no está activada. Falta configurar la API key de Gemini (GEMINI_API_KEY) en Vercel.",
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const buf = Buffer.from(await referenceFile.arrayBuffer());
      const mime = referenceFile.type || "image/jpeg";
      const edited = await editWithGemini(prompt, buf, mime);
      return new NextResponse(new Uint8Array(edited.data), {
        status: 200,
        headers: { "Content-Type": edited.mime, "Cache-Control": "no-store" },
      });
    } catch (e) {
      console.error("image route: gemini edit failed", e);
      return NextResponse.json(
        { error: "El editor de IA no pudo procesar la imagen. Intenta de nuevo o con otra descripción." },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // ---------- Text-to-image (flux, gratis) ----------
  const [width, height] = SIZES[ratio] || SIZES.square;
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
