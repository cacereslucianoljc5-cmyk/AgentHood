import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Red de la que se leen los memecoins. GeckoTerminal (gratis, sin API key).
// Robinhood Chain (L2, chain id 4663) → slug "robinhood" en GeckoTerminal.
// Cambia HOOD_NETWORK en Vercel para apuntar a otra red si hiciera falta.
const NET = process.env.HOOD_NETWORK || "robinhood";
const GT = "https://api.geckoterminal.com/api/v2";

type Token = {
  name: string;
  symbol: string;
  imageUrl: string;
  priceUsd: string | null;
  change24h: number | null;
  createdAt: string | null;
  url: string;
};

function windowMs(w: string): number {
  if (w === "1h") return 3_600_000;
  if (w === "6h") return 6 * 3_600_000;
  return 24 * 3_600_000;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchPage(endpoint: string): Promise<{ pools: any[]; tokens: Map<string, any> }> {
  const r = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    next: { revalidate: 15 },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    console.error("geckoterminal failed", r.status, t.slice(0, 200));
    return { pools: [], tokens: new Map() };
  }
  const json: any = await r.json();
  const tokens = new Map<string, any>();
  for (const inc of Array.isArray(json?.included) ? json.included : []) {
    if (inc?.type === "token") tokens.set(inc.id, inc.attributes);
  }
  return { pools: Array.isArray(json?.data) ? json.data : [], tokens };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "new" ? "new" : "trending";
  const win = searchParams.get("window") || "24h";

  const base =
    mode === "new"
      ? `${GT}/networks/${NET}/new_pools?include=base_token`
      : `${GT}/networks/${NET}/trending_pools?include=base_token&duration=24h`;

  let pages: { pools: any[]; tokens: Map<string, any> }[];
  try {
    pages = await Promise.all([fetchPage(`${base}&page=1`), fetchPage(`${base}&page=2`)]);
  } catch (e) {
    console.error("geckoterminal error", e);
    return NextResponse.json({ error: "Error de red al cargar tokens." }, { status: 502 });
  }

  const tokenById = new Map<string, any>();
  for (const p of pages) for (const [k, v] of p.tokens) tokenById.set(k, v);
  const pools = pages.flatMap((p) => p.pools);

  const cutoff = Date.now() - windowMs(win);
  const seen = new Set<string>();
  const tokens: Token[] = [];

  for (const pool of pools) {
    const a = pool?.attributes || {};
    const baseId = pool?.relationships?.base_token?.data?.id;
    if (!baseId || seen.has(baseId)) continue; // dedup por token
    const t = tokenById.get(baseId);

    const createdAt = a.pool_created_at || null;
    if (mode === "new" && createdAt && new Date(createdAt).getTime() < cutoff) continue;

    const imageUrl =
      t?.image_url && t.image_url !== "missing.png" ? String(t.image_url) : "";

    seen.add(baseId);
    tokens.push({
      name: t?.name || a.name || "Token",
      symbol: t?.symbol || "",
      imageUrl,
      priceUsd: a.base_token_price_usd ?? null,
      change24h:
        a.price_change_percentage?.h24 != null ? Number(a.price_change_percentage.h24) : null,
      createdAt,
      url: a.address ? `https://www.geckoterminal.com/${NET}/pools/${a.address}` : "",
    });
  }

  // Prioriza los que tienen imagen para el destacado, pero muestra todos.
  tokens.sort((x, y) => Number(Boolean(y.imageUrl)) - Number(Boolean(x.imageUrl)));

  return NextResponse.json({
    network: NET,
    mode,
    window: win,
    tokens: tokens.slice(0, 24),
  });
}
