import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { decodeFunctionData } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// --- Recuperación de logo ON-CHAIN (sin NOXA) ---
// En la Robinhood Chain, el creador de un token NOXA guarda el logo en el
// calldata de la tx de lanzamiento (launchToken, selector 0x686399cb), campo
// params.logo. Es permanente en la blockchain, así que se puede leer por RPC
// aunque el backend de NOXA esté caído.
const HOOD_RPC = process.env.HOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const LAUNCH_ABI = [
  {
    type: "function",
    name: "launchToken",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "logo", type: "string" },
          { name: "description", type: "string" },
          {
            name: "socials",
            type: "tuple",
            components: [
              { name: "telegram", type: "string" },
              { name: "twitter", type: "string" },
              { name: "discord", type: "string" },
              { name: "website", type: "string" },
              { name: "farcaster", type: "string" },
            ],
          },
          { name: "devWallet", type: "address" },
        ],
      },
      { name: "launchConfigId", type: "uint256" },
      { name: "dexId", type: "uint256" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

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

// NOXA (fun.noxa.fi) trae el LOGO que sube el creador de cada token, pero NO
// tiene un host público estable: su frontend habla con el backend solo a través
// de túneles Cloudflare efímeros (*.notoriouslywrong.com) que rotan y caen. Por
// eso es OPCIONAL: solo se usa si defines NOXA_BASE_URL en el entorno con un
// túnel vivo. Sin él, la fuente primaria es GeckoTerminal (público y estable).
const NOXA_BASE = process.env.NOXA_BASE_URL?.trim();
const NET = process.env.HOOD_NETWORK || "robinhood";
const GT = "https://api.geckoterminal.com/api/v2";
// Explorer oficial de Robinhood Chain (Blockscout) — a veces expone icon_url.
const BLOCKSCOUT = "https://robinhoodchain.blockscout.com";

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

// --- Fuente opcional: NOXA (solo si NOXA_BASE_URL está definido) ---
async function fetchNoxa(sort: string, limit: number, hasImage: boolean): Promise<any[]> {
  if (!NOXA_BASE) return [];
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

// Devuelve la tx que creó el contrato del token (= la tx launchToken), vía el
// explorer Blockscout de Robinhood Chain.
async function creationTx(address: string): Promise<string | null> {
  try {
    const r = await fetch(`${BLOCKSCOUT}/api/v2/addresses/${address}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // la tx de creación no cambia
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    return j?.creation_transaction_hash || j?.creation_tx_hash || null;
  } catch {
    return null;
  }
}

// Lee el input de una tx por RPC y decodifica params.logo si es un launchToken.
async function logoFromLaunchTx(txHash: string): Promise<string> {
  try {
    const r = await fetch(HOOD_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionByHash",
        params: [txHash],
      }),
      cache: "no-store",
    });
    if (!r.ok) return "";
    const j: any = await r.json();
    const input: string | undefined = j?.result?.input;
    if (!input || !input.toLowerCase().startsWith("0x686399cb")) return "";
    const dec = decodeFunctionData({ abi: LAUNCH_ABI, data: input as `0x${string}` });
    const logo = (dec.args?.[0] as any)?.logo;
    return logo ? String(logo) : "";
  } catch {
    return "";
  }
}

// Recupera el logo on-chain (Blockscout: tx de creación → RPC: input → decode).
async function onchainLogo(address: string): Promise<string> {
  const tx = await creationTx(address);
  if (!tx) return "";
  return logoFromLaunchTx(tx);
}

// Rellena el icono de los tokens sin logo desde varias fuentes públicas.
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

  // Segunda fuente: endpoint /info por token de GeckoTerminal. Devuelve image_url
  // aun cuando el token es demasiado nuevo para aparecer en tokens/multi.
  const missingForInfo = tokens.filter((t) => !t.imageUrl && t.address).slice(0, 20);
  if (missingForInfo.length) {
    const infoResults = await Promise.all(
      missingForInfo.map(async (t) => {
        try {
          const r = await fetch(`${GT}/networks/${NET}/tokens/${t.address}/info`, {
            headers: { Accept: "application/json" },
            next: { revalidate: 30 },
          });
          if (!r.ok) return { a: t.address.toLowerCase(), logo: "" };
          const j: any = await r.json();
          const img = j?.data?.attributes?.image_url;
          return {
            a: t.address.toLowerCase(),
            logo: img && img !== "missing.png" ? String(img) : "",
          };
        } catch {
          return { a: t.address.toLowerCase(), logo: "" };
        }
      })
    );
    const infoMap = new Map(infoResults.filter((r) => r.logo).map((r) => [r.a, r.logo]));
    for (const t of tokens) {
      if (!t.imageUrl && t.address) {
        const im = infoMap.get(t.address.toLowerCase());
        if (im) t.imageUrl = normalizeLogo(im);
      }
    }
  }

  // Tercera fuente: ON-CHAIN. El logo del creador vive en el calldata de la tx
  // de lanzamiento (launchToken) de NOXA, así que se recupera por RPC aunque el
  // backend de NOXA esté caído. Es la fuente autoritativa para tokens nuevos.
  const missingForChain = tokens.filter((t) => !t.imageUrl && t.address).slice(0, 20);
  if (missingForChain.length) {
    // Diagnóstico puntual del primer token: expone dónde falla la cadena.
    const s = missingForChain[0];
    try {
      const br = await fetch(`${BLOCKSCOUT}/api/v2/addresses/${s.address}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const btxt = await br.text();
      let cx = "";
      try {
        const bj = JSON.parse(btxt);
        cx = bj?.creation_transaction_hash || bj?.creation_tx_hash || "";
      } catch {}
      console.log(`onchain diag bs: status=${br.status} tx=${cx || "none"} body=${btxt.slice(0, 140)}`);
      if (cx) {
        const rr = await fetch(HOOD_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [cx] }),
          cache: "no-store",
        });
        const rtxt = await rr.text();
        let inp = "";
        try {
          inp = JSON.parse(rtxt)?.result?.input || "";
        } catch {}
        console.log(`onchain diag rpc: status=${rr.status} sel=${inp.slice(0, 10)} len=${inp.length} body=${rtxt.slice(0, 100)}`);
      }
    } catch (e) {
      console.log("onchain diag err", String(e).slice(0, 160));
    }

    const chainResults = await Promise.all(
      missingForChain.map((t) =>
        onchainLogo(t.address).then((logo) => ({ a: t.address.toLowerCase(), logo }))
      )
    );
    const chainMap = new Map(chainResults.filter((r) => r.logo).map((r) => [r.a, r.logo]));
    for (const t of tokens) {
      if (!t.imageUrl && t.address) {
        const im = chainMap.get(t.address.toLowerCase());
        if (im) t.imageUrl = normalizeLogo(im);
      }
    }
    console.log(`enrich onchain: tried=${missingForChain.length} found=${chainMap.size}`);
  }

  // Cuarta fuente (si hay key): GMGN OpenAPI. Tiene rate-limit agresivo, así que
  // se consulta SECUENCIALMENTE (con pausa) y solo unos pocos que sigan faltando.
  if (GMGN_KEY) {
    const addrs = tokens
      .filter((t) => !t.imageUrl && t.address)
      .map((t) => t.address)
      .slice(0, 10);
    const gmap = new Map<string, string>();
    for (const a of addrs) {
      const logo = await gmgnLogo(a);
      if (logo) gmap.set(a.toLowerCase(), logo);
      await new Promise((res) => setTimeout(res, 180)); // evita 429
    }
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

  // 1) NOXA si hay túnel configurado (logo real del creador); si no, [] y pasa
  //    directo a GeckoTerminal (fuente primaria estable).
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
    // 2) GeckoTerminal: fuente primaria estable (o respaldo si NOXA no respondió).
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
