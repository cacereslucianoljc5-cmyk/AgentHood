import { NextResponse } from "next/server";
import { checkAndConsume, getClientIp, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Uploads a user-provided reference image to a public host so Pollinations can
// read it (its `image` param only accepts public URLs). Returns the direct URL.
// Tries several anonymous hosts in order, since some reject cloud/datacenter IPs.
async function uploadReference(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name || "reference.png";
  const type = file.type || "image/png";
  const blob = () => new Blob([buf], { type });

  // 1) tmpfiles.org — reliable from serverless; returns JSON.
  try {
    const fd = new FormData();
    fd.append("file", blob(), name);
    const r = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: fd,
    });
    if (r.ok) {
      const j = (await r.json()) as { data?: { url?: string } };
      const u = j?.data?.url;
      if (u) {
        // Convert the page URL to a direct-download URL and force https.
        return u
          .replace("://tmpfiles.org/", "://tmpfiles.org/dl/")
          .replace(/^http:/, "https:");
      }
    }
    console.error("uploadReference tmpfiles failed", r.status);
  } catch (e) {
    console.error("uploadReference tmpfiles error", e);
  }

  // 2) 0x0.st — needs a User-Agent.
  try {
    const fd = new FormData();
    fd.append("file", blob(), name);
    const r = await fetch("https://0x0.st", {
      method: "POST",
      body: fd,
      headers: { "User-Agent": "agenthood/1.0 (+https://agent-hood.vercel.app)" },
    });
    if (r.ok) {
      const u = (await r.text()).trim();
      if (/^https?:\/\//.test(u)) return u;
    }
    console.error("uploadReference 0x0 failed", r.status);
  } catch (e) {
    console.error("uploadReference 0x0 error", e);
  }

  // 3) catbox.moe — last resort (often blocks datacenter IPs).
  try {
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("fileToUpload", blob(), name);
    const r = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: fd,
    });
    if (r.ok) {
      const u = (await r.text()).trim();
      if (/^https?:\/\//.test(u)) return u;
    }
    console.error("uploadReference catbox failed", r.status);
  } catch (e) {
    console.error("uploadReference catbox error", e);
  }

  throw new Error("all upload hosts failed");
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

  // Host the reference image so Pollinations can read it (public URL required).
  let referenceUrl = "";
  if (referenceFile) {
    try {
      referenceUrl = await uploadReference(referenceFile);
    } catch (e) {
      console.error("image route: reference upload failed", e);
      return NextResponse.json(
        {
          error:
            "No se pudo subir la imagen de referencia ahora mismo. Intenta con otra imagen o genera sin referencia.",
        },
        { status: 502 }
      );
    }
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
