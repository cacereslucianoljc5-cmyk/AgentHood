import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxy de imágenes de tokens: permite mostrarlas y cargarlas en el editor sin
// problemas de CORS. Lista blanca de hosts para no ser un proxy abierto.
const ALLOWED = [
  "coingecko.com",
  "geckoterminal.com",
  "dexscreener.com",
];

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") || "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }
  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "solo https" }, { status: 400 });
  }
  const host = target.hostname.toLowerCase();
  const allowed = ALLOWED.some((d) => host === d || host.endsWith("." + d));
  if (!allowed) {
    return NextResponse.json({ error: "host no permitido" }, { status: 400 });
  }

  try {
    const r = await fetch(target.toString(), { next: { revalidate: 300 } });
    if (!r.ok) {
      return NextResponse.json({ error: "no encontrada" }, { status: 502 });
    }
    const ctype = r.headers.get("content-type") || "image/png";
    if (!ctype.startsWith("image/")) {
      return NextResponse.json({ error: "no es una imagen" }, { status: 400 });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: { "Content-Type": ctype, "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    console.error("token-image error", e);
    return NextResponse.json({ error: "error al cargar imagen" }, { status: 502 });
  }
}
