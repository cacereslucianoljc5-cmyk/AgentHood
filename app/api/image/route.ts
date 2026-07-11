import { NextResponse } from "next/server";
import { checkAndConsume, getClientIp, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Uploads a user-provided reference image to a public host so Pollinations can
// read it (its `image` param only accepts public URLs). Returns the direct URL.
async function uploadReference(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("fileToUpload", file, file.name || "reference.png");
  const resp = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: fd,
  });
  if (!resp.ok) throw new Error("upload failed");
  const url = (await resp.text()).trim();
  if (!/^https?:\/\//.test(url)) throw new Error("bad upload response");
  return url;
}

// Returns a ready-to-load image URL (no branding/logo) for the given prompt.
// If a reference image is provided, uses the `kontext` model (image-to-image);
// otherwise uses `flux` (text-to-image).
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
  let referenceUrl = "";

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
        referenceUrl = await uploadReference(file);
      }
    } else {
      const body = (await req.json()) as { prompt?: string; ratio?: string };
      prompt = (body.prompt || "").trim();
      ratio = body.ratio || "square";
    }
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la imagen de referencia. Intenta de nuevo." },
      { status: 400 }
    );
  }

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
  const [width, height] = sizes[ratio] || sizes.square;

  // Pseudo-random seed without Math.random dependency concerns.
  const seed = (Date.now() % 1_000_000) + prompt.length;

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: "true",
    model: referenceUrl ? "kontext" : "flux",
    referrer: "agenthood",
  });
  if (referenceUrl) params.set("image", referenceUrl);

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?${params.toString()}`;

  return NextResponse.json({
    url,
    remaining: rate.remaining,
    limit: rate.limit,
    usedReference: Boolean(referenceUrl),
  });
}
