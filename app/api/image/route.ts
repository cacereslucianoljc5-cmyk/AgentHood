import { NextResponse } from "next/server";
import { checkAndConsume, getClientIp, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cloudflare Workers AI (free tier, no card). Set both in Vercel:
//   CLOUDFLARE_ACCOUNT_ID  — your account id (dash → Workers & Pages → AI)
//   CLOUDFLARE_API_TOKEN   — an API token with "Workers AI" read permission
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
const CF_MODEL = "@cf/runwayml/stable-diffusion-v1-5-img2img";

type EditedImage = { data: Buffer; mime: string };

// Regenerates the reference image guided by the prompt (image-to-image).
async function editWithCloudflare(instruction: string, buf: Buffer): Promise<EditedImage> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`;
  const body = {
    prompt: instruction,
    image: Array.from(new Uint8Array(buf)),
    strength: 0.55, // keep composition, apply the prompt
    guidance: 7.5,
    num_steps: 20,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    console.error("cloudflare failed", resp.status, detail.slice(0, 400));
    throw new Error("cloudflare " + resp.status);
  }

  const ctype = resp.headers.get("content-type") || "";
  // Some models reply with JSON { result: { image: <base64> } }, others with raw bytes.
  if (ctype.includes("application/json")) {
    const j = (await resp.json().catch(() => null)) as
      | { result?: { image?: string }; success?: boolean; errors?: unknown }
      | null;
    const b64 = j?.result?.image;
    if (b64) return { data: Buffer.from(b64, "base64"), mime: "image/png" };
    console.error("cloudflare json without image", JSON.stringify(j).slice(0, 400));
    throw new Error("cloudflare no image");
  }
  const out = Buffer.from(await resp.arrayBuffer());
  return { data: out, mime: ctype.startsWith("image/") ? ctype : "image/png" };
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

  // ---------- Image-to-image with Cloudflare Workers AI ----------
  if (referenceFile) {
    console.log(
      `cf creds present: account=${Boolean(CF_ACCOUNT_ID)} token=${Boolean(CF_API_TOKEN)}`
    );
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return NextResponse.json(
        {
          error:
            "La edición de imágenes aún no está activada. Falta configurar CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en Vercel.",
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const buf = Buffer.from(await referenceFile.arrayBuffer());
      const edited = await editWithCloudflare(prompt, buf);
      return new NextResponse(new Uint8Array(edited.data), {
        status: 200,
        headers: { "Content-Type": edited.mime, "Cache-Control": "no-store" },
      });
    } catch (e) {
      console.error("image route: cloudflare edit failed", e);
      return NextResponse.json(
        { error: "El editor de IA no pudo procesar la imagen. Intenta de nuevo o con otra descripción." },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // ---------- Text-to-image (flux, gratis, sin key) ----------
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
