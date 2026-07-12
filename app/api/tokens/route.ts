import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GMGN OpenAPI (openapi.gmgn.ai) — API oficial de servidor (sin el Cloudflare
// de la web). Con GMGN_API_KEY devuelve el logo de casi cualquier token.
const GMGN_KEY = process.env.GMGN_API_KEY?.trim();

async function gmgnLogo(address: string): Promise<string> {
  if (!GMGN_KEY) return "";
  const ts = Math.floor(Date.now() / 1000);
  const url = `https://openapi.gmgn.ai/v1/token/info?chain=${NET}&address=${address}&timestamp=${ts}&client_id=${randomUUID()}`;
  try {
    const r = await fetch(url, {
      headers: {
        "X-APIKEY": GMGN_KEY,
        "Content-Type": "application/json",
        "User-Agent": "agenthood/1.0",
      },
      cache: "no-store",
    });
    if (!r.ok) {
      console.error("gmgn token/info", r.status);
      return "";
    }
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const j: any = await r.json();
    const d = j?.data ?? {};
    const logo = d.logo || d.token?.logo || d.token_info?.logo || d.image_url || "";
    return logo ? String(logo) : "";
  } catch (e) {
    console.error("gmgn error", e);
    return "";
  }
}

// Fuente principal: backend público del launchpad NOXA (fun.noxa.fi), que trae
// el LOGO real que sube el creador para cada token de Robinhood Chain, incluso
// los recién lanzados. Sin API key. El subdominio puede rotar si NOXA redepliega
// (configurable con NOXA_BASE_URL). Respaldo: GeckoTerminal.
const NOXA_BASE =
  process.env.NOXA_BASE_URL || "https://awk00kk00gskkw0o8kc488kg.notoriouslywrong.com";
const NET = process.env.HOOD_NETWORK || "robinhood";
const GT = "https://api.geckoterminal.com/api/v2";

type Token = {
  name: string;
  symbol: string;
  imageUrl: string;
  address: string;
  priceUsd: string | null;
  change24h: number | null;
  createdAtMs: number | null;
  url: string;
};

function windowMs(w: string): number {
  if (w === "1h") return 3_600_000;
  if (w === "6h") return 6 * 3_600_000;
  return 24 * 3_600_000;
}

function toMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  if (typeof v === "string" && v !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
    const p = Date.parse(v);
    if (!Number.isNaN(p)) return p;
  }
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// Precio de ETH en USD (para convertir priceEth de NOXA). Cacheado; si falla,
// se muestra el precio en ETH.
async function getEthUsd(): Promise<number | null> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { headers: { Accept: "application/json" }, next: { revalidate: 60 } }
    );
    if (!r.ok) return null;
    const j: any = await r.json();
    const v = j?.ethereum?.usd;
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

// Convierte una URI de logo (ipfs://CID, CID pelado, o http) a URL servible.
function normalizeLogo(logo: unknown): string {
  if (!logo || typeof logo !== "string") return "";
  let s = logo.trim();
  if (s.startsWith("ipfs://")) {
    s = s.slice(7);
    if (s.startsWith("ipfs/")) s = s.slice(5);
    return `https://ipfs.io/ipfs/${s}`;
  }
  if (/^https?:\/\//.test(s)) return s;
  if (/^(baf[a-z0-9]+|Qm[1-9A-HJ-NP-Za-km-z]{44})/.test(s)) {
    return `https://ipfs.io/ipfs/${s}`;
  }
  return "";
}

// --- Fuente principal: NOXA ---
async function fetchNoxa(sort: string, limit: number, hasImage: boolean): Promise<any[]> {
  const url = `${NOXA_BASE}/v1/${NET}/tokens?sort=${sort}&order=desc&limit=${limit}${
    hasImage ? "&hasImage=true" : ""
  }`;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "AgentHood/1.0", Accept: "application/json" },
      next: { revalidate: 15 },
    });
    if (!r.ok) {
      console.error("noxa failed", r.status);
      return [];
    }
    const j: any = await r.json();
    return Array.isArray(j?.tokens) ? j.tokens : [];
  } catch (e) {
    console.error("noxa error", e);
    return [];
  }
}

function mapNoxa(rows: any[], ethUsd: number | null): Token[] {
  const out: Token[] = [];
  for (const d of rows) {
    const priceEth = typeof d.priceEth === "number" ? d.priceEth : Number(d.priceEth);
    const priceUsd =
      ethUsd && Number.isFinite(priceEth) ? (priceEth * ethUsd).toPrecision(4) : null;
    out.push({
      name: d.name || "Token",
      symbol: d.symbol || "",
      imageUrl: normalizeLogo(d.logo),
      address: d.address ? String(d.address) : "",
      priceUsd,
      change24h: null,
      createdAtMs: toMs(d.createdAtTime),
      url: d.address ? `https://fun.noxa.fi/${NET}/${d.address}` : "https://fun.noxa.fi/robinhood",
    });
  }
  return out;
}

// --- Respaldo: GeckoTerminal ---
async function fetchGtPage(endpoint: string): Promise<{ pools: any[]; tokens: Map<string, any> }> {
  const r = await fetch(endpoint, { headers: { Accept: "application/json" }, next: { revalidate: 15 } });
  if (!r.ok) return { pools: [], tokens: new Map() };
  const json: any = await r.json();
  const tokens = new Map<string, any>();
  for (const inc of Array.isArray(json?.included) ? json.included : []) {
    if (inc?.type === "token") tokens.set(inc.id, inc.attributes);
  }
  return { pools: Array.isArray(json?.data) ? json.data : [], tokens };
}

async function fetchGecko(mode: string): Promise<Token[]> {
  const base =
    mode === "new"
      ? `${GT}/networks/${NET}/new_pools?include=base_token`
      : `${GT}/networks/${NET}/trending_pools?include=base_token&duration=24h`;
  const pages = await Promise.all([fetchGtPage(`${base}&page=1`), fetchGtPage(`${base}&page=2`)]);
  const tokenById = new Map<string, any>();
  for (const p of pages) for (const [k, v] of p.tokens) tokenById.set(k, v);
  const pools = pages.flatMap((p) => p.pools);
  const seen = new Set<string>();
  const out: Token[] = [];
  for (const pool of pools) {
    const a = pool?.attributes || {};
    const baseId = pool?.relationships?.base_token?.data?.id;
    if (!baseId || seen.has(baseId)) continue;
    seen.add(baseId);
    const t = tokenById.get(baseId);
    const img = t?.image_url && t.image_url !== "missing.png" ? String(t.image_url) : "";
    out.push({
      name: t?.name || a.name || "Token",
      symbol: t?.symbol || "",
      imageUrl: img,
      address: t?.address ? String(t.address) : "",
      priceUsd: a.base_token_price_usd ?? null,
      change24h: a.price_change_percentage?.h24 != null ? Number(a.price_change_percentage.h24) : null,
      createdAtMs: a.pool_created_at ? Date.parse(a.pool_created_at) : null,
      url: a.address ? `https://www.geckoterminal.com/${NET}/pools/${a.address}` : "",
    });
  }
  return out;
}

// Rellena el icono de los tokens que NOXA no trae con logo, buscando en
// GeckoTerminal y DexScreener por dirección.
async function enrichMissingLogos(tokens: Token[]): Promise<void> {
  const uniq = [
    ...new Set(tokens.filter((t) => !t.imageUrl && t.address).map((t) => t.address.toLowerCase())),
  ].slice(0, 30);
  if (!uniq.length) return;
  const map = new Map<string, string>();

  await Promise.all([
    (async () => {
      try {
        const r = await fetch(`${GT}/networks/${NET}/tokens/multi/${uniq.join(",")}`, {
          headers: { Accept: "application/json" },
          next: { revalidate: 30 },
        });
        if (!r.ok) return;
        const j: any = await r.json();
        for (const d of Array.isArray(j?.data) ? j.data : []) {
          const addr = d?.attributes?.address?.toLowerCase();
          const img = d?.attributes?.image_url;
          if (addr && img && img !== "missing.png") map.set(addr, String(img));
        }
      } catch {}
    })(),
    (async () => {
      try {
        const r = await fetch(`https://api.dexscreener.com/tokens/v1/${NET}/${uniq.join(",")}`, {
          headers: { Accept: "application/json" },
          next: { revalidate: 30 },
        });
        if (!r.ok) return;
        const arr: any = await r.json();
        const pairs = Array.isArray(arr) ? arr : arr?.pairs || [];
        for (const p of pairs) {
          const addr = p?.baseToken?.address?.toLowerCase();
          const img = p?.info?.imageUrl;
          if (addr && img && !map.has(addr)) map.set(addr, String(img));
        }
      } catch {}
    })(),
  ]);

  for (const t of tokens) {
    if (!t.imageUrl && t.address) {
      const im = map.get(t.address.toLowerCase());
      if (im) t.imageUrl = normalizeLogo(im);
    }
  }

  // Tercera fuente (si hay key): GMGN OpenAPI, por dirección.
  if (GMGN_KEY) {
    const addrs = tokens
      .filter((t) => !t.imageUrl && t.address)
      .map((t) => t.address)
      .slice(0, 12);
    const results = await Promise.all(
      addrs.map((a) => gmgnLogo(a).then((logo) => ({ a: a.toLowerCase(), logo })))
    );
    const gmap = new Map(results.filter((r) => r.logo).map((r) => [r.a, r.logo]));
    for (const t of tokens) {
      if (!t.imageUrl && t.address) {
        const im = gmap.get(t.address.toLowerCase());
        if (im) t.imageUrl = normalizeLogo(im);
      }
    }
  }

  const stillMissing = tokens.filter((t) => !t.imageUrl).length;
  console.log(`enrich: missing=${uniq.length} found=${map.size} gmgn=${GMGN_KEY ? "on" : "off"} stillMissing=${stillMissing}`);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "new" ? "new" : "trending";
  const win = searchParams.get("window") || "24h";

  let tokens: Token[] = [];

  // 1) NOXA (logo real del creador). Fuente autoritativa.
  const [rows, ethUsd] = await Promise.all([
    fetchNoxa(mode === "new" ? "newest" : "volume", mode === "new" ? 100 : 40, mode !== "new"),
    getEthUsd(),
  ]);
  if (rows.length) {
    const all = mapNoxa(rows, ethUsd);
    if (mode === "new") {
      const cutoff = Date.now() - windowMs(win);
      const cap = win === "1h" ? 8 : win === "6h" ? 16 : 24;
      const byNewest = (a: Token, b: Token) => (b.createdAtMs || 0) - (a.createdAtMs || 0);
      const within = all
        .filter((t) => t.createdAtMs != null && t.createdAtMs >= cutoff)
        .sort(byNewest);
      if (within.length >= cap) {
        tokens = within.slice(0, cap);
      } else {
        // Completa con los más nuevos disponibles para no dejar la ventana vacía.
        const seen = new Set(within.map((t) => t.address));
        const extra = all.filter((t) => !seen.has(t.address)).sort(byNewest);
        tokens = within.concat(extra).slice(0, cap);
      }
    } else {
      tokens = all;
    }
    console.log(`tokens noxa: mode=${mode} win=${win} rows=${rows.length} sent=${tokens.length}`);
  } else {
    // 2) Respaldo GeckoTerminal solo si NOXA no respondió.
    tokens = await fetchGecko(mode);
    if (mode === "new") {
      const cutoff = Date.now() - windowMs(win);
      tokens = tokens.filter((t) => t.createdAtMs == null || t.createdAtMs >= cutoff);
    }
    tokens.sort((x, y) => Number(Boolean(y.imageUrl)) - Number(Boolean(x.imageUrl)));
  }

  const finalTokens = tokens.slice(0, 24);
  await enrichMissingLogos(finalTokens);
  return NextResponse.json({ network: NET, mode, window: win, tokens: finalTokens });
}
