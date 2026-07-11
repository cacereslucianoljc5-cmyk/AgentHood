import { NextResponse } from "next/server";
import { checkAndConsume, getClientIp, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Free "seed"-tier token (register at auth.pollinations.ai) enabling the
// kontext image-to-image model. Set as POLLINATIONS_TOKEN in Vercel.
const TOKEN = process.env.POLLINATIONS_TOKEN?.trim();

// Hosts the reference image at a public URL (kontext's `image` param requires
// one). Tries several anonymous hosts, since some reject datacenter IPs.
async function uploadReference(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const type = file.type || "image/jpeg";
  const name = "reference.jpg";
  const blob = () => new Blob([buf], { type });

  // 1) tmpfiles.org
  try {
    const fd = new FormData();
    fd.append("file", blob(), name);
    const r = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: fd });
    if (r.ok) {
      const j = (await r.json()) as { data?: { url?: string } };
      const u = j?.data?.url;
      if (u) {
        return u.replace("://tmpfiles.org/", "://tmpfiles.org/dl/").replace(/^http:/, "https:");
      }
    }
    console.error("uploadReference tmpfiles failed", r.status);
  } catch (e) {
    console.error("uploadReference tmpfiles error", e);
  }

  // 2) 0x0.st
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

  // 3) catbox.moe (last resort)
  try {
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("fileToUpload", blob(), name);
    const r = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: fd });
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

  const [width, height] = SIZES[ratio] || SIZES.square;
  const seed = (Date.now() % 1_000_000) + prompt.length;

  // ---------- Image-to-image (real editing) with kontext + token ----------
  if (referenceFile) {
    if (!TOKEN) {
      return NextResponse.json(
        {
          error:
            "La edición de imágenes aún no está activada. Falta configurar el token de Pollinations (POLLINATIONS_TOKEN) en Vercel.",
        },
        { status: 400 }
      );
    }

    let referenceUrl: string;
    try {
      referenceUrl = await uploadReference(referenceFile);
    } catch (e) {
      console.error("image route: reference upload failed", e);
      return NextResponse.json(
        { error: "No se pudo subir la imagen de referencia. Intenta con otra imagen." },
        { status: 502 }
      );
    }

    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      seed: String(seed),
      nologo: "true",
      model: "kontext",
      referrer: "agenthood",
    });
    params.set("image", referenceUrl);
    const kontextUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const resp = await fetch(kontextUrl, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        signal: controller.signal,
      });
      if (!resp.ok) {
        const detail = await resp.text().catch(() => "");
        console.error("kontext failed", resp.status, detail.slice(0, 300));
        return NextResponse.json(
          { error: "El editor de IA no pudo procesar la imagen. Intenta de nuevo." },
          { status: 502 }
        );
      }
      const ctype = resp.headers.get("content-type") || "";
      if (!ctype.startsWith("image/")) {
        const detail = await resp.text().catch(() => "");
        console.error("kontext non-image response", ctype, detail.slice(0, 300));
        return NextResponse.json(
          { error: "El editor de IA no devolvió una imagen. Intenta de nuevo." },
          { status: 502 }
        );
      }
      const bytes = Buffer.from(await resp.arrayBuffer());
      return new NextResponse(bytes, {
        status: 200,
        headers: { "Content-Type": ctype, "Cache-Control": "no-store" },
      });
    } catch (e) {
      console.error("kontext request error", e);
      return NextResponse.json(
        { error: "El editor de IA tardó demasiado. Intenta de nuevo." },
        { status: 504 }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // ---------- Text-to-image (flux) ----------
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
