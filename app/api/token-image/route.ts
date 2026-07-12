import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Proxy de imágenes de tokens: evita CORS y, para logos en IPFS, prueba varios
// gateways rápidos hasta que uno responda (ipfs.io a veces es lento/inestable).
const ALLOWED = [
  "coingecko.com",
  "geckoterminal.com",
  "dexscreener.com",
  "dexscreener.io",
  "noxa.fi",
  "notoriouslywrong.com",
  "gmgn.ai",
  // IPFS / CDNs
  "ipfs.io",
  "dweb.link",
  "nftstorage.link",
  "pinata.cloud",
  "mypinata.cloud",
  "4everland.io",
  "ipfscdn.io",
  "w3s.link",
  "cloudflare-ipfs.com",
  "arweave.net",
  "cloudfront.net",
  "amazonaws.com",
  "akamaized.net",
  "imagedelivery.net",
  "googleusercontent.com",
  "robinhood.com",
];

// Gateways IPFS por orden de preferencia (rápidos y fiables primero).
const IPFS_GATEWAYS = [
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://4everland.io/ipfs/",
];

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED.some((d) => h === d || h.endsWith("." + d));
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
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }
  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "solo https" }, { status: 400 });
  }
  if (!hostAllowed(target.hostname)) {
    return NextResponse.json({ error: "host no permitido" }, { status: 400 });
  }

  // Lista de candidatos: si es IPFS, probar varios gateways; si no, la URL tal cual.
  const cid = ipfsPath(target);
  const candidates = cid ? IPFS_GATEWAYS.map((g) => g + cid) : [target.toString()];

  for (const url of candidates) {
    const r = await fetchImage(url, cid ? 6000 : 12000);
    if (r) {
      const ct = r.headers.get("content-type") || "image/png";
      const buf = Buffer.from(await r.arrayBuffer());
      console.log("token-image ok", ct, buf.length, "bytes");
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: { "Content-Type": ct, "Cache-Control": "public, max-age=600" },
      });
    }
  }

  console.error("token-image: todos los gateways fallaron", cid || target.hostname);
  return NextResponse.json({ error: "no encontrada" }, { status: 502 });
}
