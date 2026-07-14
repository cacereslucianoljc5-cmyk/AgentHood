import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Proxy de imágenes de tokens: evita CORS y, para logos en IPFS, prueba varios
// gateways rápidos hasta que uno responda (ipfs.io a veces es lento/inestable).
// Los logos de los tokens vienen de fuentes muy variadas (IPFS, CDNs de
// launchpads, etc.), así que en vez de una allowlist rígida bloqueamos solo los
// destinos peligrosos (IPs privadas/internas) y validamos que la respuesta sea
// realmente una imagen (content-type image/*). Eso evita SSRF sin romper logos.

// Gateways IPFS por orden de preferencia (rápidos y fiables primero).
const IPFS_GATEWAYS = [
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://4everland.io/ipfs/",
];

// Bloquea destinos internos/privados (protección SSRF). Los hosts públicos
// pasan; la validación de content-type image/* hace el resto.
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    h.endsWith(".local") ||
    h === "metadata.google.internal"
  ) {
    return true;
  }
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local (metadata de la nube)
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  }
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) {
    return true;
  }
  return false;
}

// Extrae el CID (+ subpath) si la URL es un gateway IPFS conocido.
function ipfsPath(u: URL): string | null {
  const m = u.pathname.match(/\/ipfs\/(.+)$/);
  if (m) return m[1];
  // subdominio {cid}.ipfs.gateway
  const sub = u.hostname.match(/^([a-z0-9]+)\.ipfs\./i);
  if (sub) return sub[1] + (u.pathname !== "/" ? u.pathname : "");
  return null;
}

async function fetchImage(url: string, timeoutMs: number): Promise<Response | null> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    // Cabeceras de navegador → deja pasar imágenes tras Cloudflare/CDN (gmgn.ai).
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    };
    if (url.includes("gmgn.ai")) headers.Referer = "https://gmgn.ai/";
    // cache:"no-store" → evita que el Data Cache de Next corrompa el binario.
    const r = await fetch(url, { signal: c.signal, cache: "no-store", headers });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    return r;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") || "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "https only" }, { status: 400 });
  }
  if (isPrivateHost(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  // gmgn.ai bloquea la IP de datacenter (Cloudflare), pero el navegador del
  // usuario sí puede cargarla → redirigimos para que la traiga el navegador.
  if (target.hostname === "gmgn.ai" || target.hostname.endsWith(".gmgn.ai")) {
    return NextResponse.redirect(target.toString(), 302);
  }

  // Lista de candidatos: si es IPFS, probar varios gateways; si no, la URL tal cual.
  const cid = ipfsPath(target);
  const candidates = cid ? IPFS_GATEWAYS.map((g) => g + cid) : [target.toString()];

  for (const url of candidates) {
    const r = await fetchImage(url, cid ? 6000 : 12000);
    if (r) {
      const ct = r.headers.get("content-type") || "image/png";
      const buf = Buffer.from(await r.arrayBuffer());
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: { "Content-Type": ct, "Cache-Control": "public, max-age=600" },
      });
    }
  }

  console.error("token-image: todos los gateways fallaron", cid || target.hostname);
  return NextResponse.json({ error: "not found" }, { status: 502 });
}
