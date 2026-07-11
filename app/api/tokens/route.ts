import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Red de la que se leen los memecoins. GeckoTerminal (gratis, sin API key).
// Cambia HOOD_NETWORK en Vercel para apuntar a otra red (ej. "solana", "base",
// "eth", "bsc"...). Por defecto: solana (donde hay más memecoins).
const NET = process.env.HOOD_NETWORK || "solana";
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
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "new" ? "new" : "trending";
  const win = searchParams.get("window") || "24h";

  const endpoint =
    mode === "new"
      ? `${GT}/networks/${NET}/new_pools?include=base_token&page=1`
      : `${GT}/networks/${NET}/trending_pools?include=base_token&page=1&duration=24h`;

  let json: any;
  try {
    const r = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 15 },
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error("geckoterminal failed", r.status, t.slice(0, 200));
      return NextResponse.json({ error: "No se pudieron cargar los tokens." }, { status: 502 });
    }
    json = await r.json();
  } catch (e) {
    console.error("geckoterminal error", e);
    return NextResponse.json({ error: "Error de red al cargar tokens." }, { status: 502 });
  }

  const included: any[] = Array.isArray(json?.included) ? json.included : [];
  const tokenById = new Map<string, any>();
  for (const inc of included) {
    if (inc?.type === "token") tokenById.set(inc.id, inc.attributes);
  }

  const pools: any[] = Array.isArray(json?.data) ? json.data : [];
  const cutoff = Date.now() - windowMs(win);

  const tokens: Token[] = [];
  for (const pool of pools) {
    const a = pool?.attributes || {};
    const baseId = pool?.relationships?.base_token?.data?.id;
    const t = baseId ? tokenById.get(baseId) : null;
    const imageUrl =
      t?.image_url && t.image_url !== "missing.png" ? String(t.image_url) : "";
    if (!imageUrl) continue; // el feature es sobre imágenes de tokens

    const createdAt = a.pool_created_at || null;
    if (mode === "new" && createdAt && new Date(createdAt).getTime() < cutoff) {
      continue;
    }

    tokens.push({
      name: t?.name || a.name || "Token",
      symbol: t?.symbol || "",
      imageUrl,
      priceUsd: a.base_token_price_usd ?? null,
      change24h:
        a.price_change_percentage?.h24 != null
          ? Number(a.price_change_percentage.h24)
          : null,
      createdAt,
      url: a.address ? `https://www.geckoterminal.com/${NET}/pools/${a.address}` : "",
    });
  }

  return NextResponse.json({ network: NET, mode, window: win, tokens: tokens.slice(0, 12) });
}
