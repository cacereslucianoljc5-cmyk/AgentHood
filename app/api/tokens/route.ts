import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// --- Recuperación de logo ON-CHAIN (sin NOXA) ---
// En la Robinhood Chain, el creador de un token NOXA guarda el logo (URI de
// IPFS) en el calldata de la tx de lanzamiento. Es permanente en la blockchain,
// así que se lee por RPC aunque el backend de NOXA esté caído. En vez de fijar
// un ABI exacto (el selector puede cambiar entre versiones del launchpad),
// extraemos las cadenas ABI del calldata y elegimos la que es el logo.
const HOOD_RPC = process.env.HOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";

// Extrae todas las strings ABI-encoded del calldata (palabra de longitud de 32
// bytes seguida de bytes ASCII imprimibles).
function extractCalldataStrings(input: string): string[] {
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  // Salta el selector de 4 bytes (8 hex).
  const body = hex.slice(8);
  let bytes: Buffer;
  try {
    bytes = Buffer.from(body, "hex");
  } catch {
    return [];
  }
  const out: string[] = [];
  for (let i = 0; i + 32 <= bytes.length; i += 32) {
    // La longitud ocupa toda la palabra de 32 bytes; los primeros 28 deben ser 0.
    let zeros = true;
    for (let k = i; k < i + 28; k++) {
      if (bytes[k] !== 0) {
        zeros = false;
        break;
      }
    }
    if (!zeros) continue;
    const len = bytes.readUInt32BE(i + 28);
    if (len < 3 || len > 4096) continue;
    const start = i + 32;
    if (start + len > bytes.length) continue;
    const slice = bytes.subarray(start, start + len);
    let ok = true;
    for (const b of slice) {
      if (b < 9 || (b > 13 && b < 32) || b > 126) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const s = slice.toString("utf8").trim();
    if (s) out.push(s);
  }
  return out;
}

// De las strings del calldata, elige la que es el logo/imagen del token.
function pickLogoString(strings: string[]): string {
  for (const s of strings) {
    if (s.toLowerCase().startsWith("ipfs://")) return s;
  }
  for (const s of strings) {
    if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(s)) return s;
    if (/^https?:\/\/\S*(ipfs|\/image|logo|cloudinary|imagedelivery|arweave)/i.test(s)) return s;
  }
  for (const s of strings) {
    if (/^(baf[a-z0-9]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/.test(s)) return s;
  }
  // http genérico que no sea una red social conocida.
  for (const s of strings) {
    if (/^https?:\/\//i.test(s) && !/(twitter|x\.com|t\.me|telegram|discord|farcaster|warpcast|youtube|tiktok|instagram)/i.test(s)) {
      return s;
    }
  }
  return "";
}

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

// Quita duplicados por dirección y el token de gas envuelto (WETH, 0x000…000),
// que no es una memecoin lanzada sino el par de liquidez.
function cleanPool(list: Token[]): Token[] {
  const seen = new Set<string>();
  const out: Token[] = [];
  for (const t of list) {
    const a = (t.address || "").toLowerCase();
    if (!a || a === "0x0000000000000000000000000000000000000000") continue;
    if (/^weth$/i.test(t.symbol)) continue;
    if (seen.has(a)) continue;
    seen.add(a);
    out.push(t);
  }
  return out;
}

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
  // En "new" pedimos más páginas: la cadena lanza tokens muy rápido, así que
  // hacen falta varias páginas para cubrir de verdad 6h/24h y no repetir 1h.
  const pageNums = mode === "new" ? [1, 2, 3, 4, 5] : [1, 2];
  const pages = await Promise.all(pageNums.map((n) => fetchGtPage(`${base}&page=${n}`)));
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

// Algunos launchpads guardan en el calldata una URL a un JSON de metadata (tipo
// NFT) en vez del logo directo. Descargamos el JSON y sacamos su campo image.
async function resolveMetadataImage(url: string): Promise<string> {
  try {
    const u = /^ipfs:\/\//i.test(url) ? normalizeLogo(url) : url;
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 6000);
    const r = await fetch(u, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: c.signal,
    }).finally(() => clearTimeout(t));
    if (!r.ok) return "";
    const j: any = await r.json();
    const img =
      j?.image || j?.image_url || j?.imageUrl || j?.logo || j?.properties?.image || "";
    return img ? String(img) : "";
  } catch {
    return "";
  }
}

// Lee el input de la tx de lanzamiento por RPC y saca el logo de su calldata.
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
    if (!input || input.length < 200) return "";
    let logo = pickLogoString(extractCalldataStrings(input));
    // Si es un JSON de metadata, resolvemos la imagen real que contiene.
    if (logo && /\.json(\?|$)|\/metadata\//i.test(logo)) {
      logo = await resolveMetadataImage(logo);
    }
    return logo;
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
  ].slice(0, 40);
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
  const missingForInfo = tokens.filter((t) => !t.imageUrl && t.address).slice(0, 30);
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
  const missingForChain = tokens.filter((t) => !t.imageUrl && t.address).slice(0, 32);
  if (missingForChain.length) {
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
      .slice(0, 14);
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

  // Tamaño de cada pestaña (creciente: 24h muestra más que 6h que 1h).
  const cap = mode === "new" ? (win === "1h" ? 8 : win === "6h" ? 16 : 24) : 24;

  // 1) NOXA si hay túnel configurado (logo real del creador); si no, [] y pasa
  //    directo a GeckoTerminal (fuente primaria estable).
  const [rows, ethUsd] = await Promise.all([
    fetchNoxa(mode === "new" ? "newest" : "volume", mode === "new" ? 100 : 40, mode !== "new"),
    getEthUsd(),
  ]);

  // Construye un POOL amplio de candidatos (más de los que se muestran) para,
  // tras enriquecer, quedarnos solo con los que tienen logo y aun así llenar.
  const byNewest = (a: Token, b: Token) => (b.createdAtMs || 0) - (a.createdAtMs || 0);
  let pool: Token[] = rows.length ? cleanPool(mapNoxa(rows, ethUsd)) : cleanPool(await fetchGecko(mode));
  if (mode === "new") {
    const cutoff = Date.now() - windowMs(win);
    const within = pool.filter((t) => t.createdAtMs != null && t.createdAtMs >= cutoff).sort(byNewest);
    const seen = new Set(within.map((t) => t.address.toLowerCase()));
    const extra = pool.filter((t) => !seen.has(t.address.toLowerCase())).sort(byNewest);
    pool = within.concat(extra); // dentro de la ventana primero, luego los más nuevos
  }

  // Enriquece un prefijo amplio del pool y descarta los que sigan sin logo.
  const enrichPool = pool.slice(0, 40);
  await enrichMissingLogos(enrichPool);
  const logoed = enrichPool.filter((t) => t.imageUrl);
  const finalTokens = logoed.slice(0, cap);
  console.log(
    `tokens: mode=${mode} win=${win} pool=${pool.length} enriched=${enrichPool.length} logoed=${logoed.length} sent=${finalTokens.length}`
  );
  return NextResponse.json({ network: NET, mode, window: win, tokens: finalTokens });
}
