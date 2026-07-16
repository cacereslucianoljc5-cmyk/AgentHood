"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NumberTicker } from "./components/NumberTicker";
import GradientText from "./components/GradientText";
import RippleCursor from "./components/RippleCursor";
import UiverseSpinner from "./components/UiverseSpinner";
import BarWave from "./components/BarWave";

/* ============================================================================
   StockSprout — tokenized stock packs on Robinhood Chain.
   A soft, light, green-tinted reimagining. Every function is client-side and
   fully interactive: connect a wallet, open weighted-random packs, watch real
   equities "settle", grow a shared jackpot, and complete collections.
   ========================================================================== */

// ---------- Rarity system (weight = how COMMON a pull is) -------------------
type RarityKey = "legendary" | "epic" | "rare" | "common";
const RARITY: Record<
  RarityKey,
  { label: string; stars: number; weight: number; color: string }
> = {
  legendary: { label: "Legendary", stars: 5, weight: 6, color: "var(--gold)" },
  epic: { label: "Epic", stars: 4, weight: 13, color: "var(--violet)" },
  rare: { label: "Rare", stars: 3, weight: 26, color: "var(--teal)" },
  common: { label: "Common", stars: 2, weight: 55, color: "var(--sage)" },
};

// ---------- The 14 tokenized equities (companies are kept as-is) ------------
type Stock = {
  ticker: string;
  name: string;
  rarity: RarityKey;
  base: number; // reference price in USD
  color: string; // brand-ish accent used by the ticker badge
  pool: boolean; // has a live Uniswap v4 pool
};

const STOCKS: Stock[] = [
  { ticker: "AAPL", name: "Apple", rarity: "legendary", base: 227.4, color: "#5b6470", pool: true },
  { ticker: "MSFT", name: "Microsoft", rarity: "legendary", base: 431.2, color: "#3a8fd6", pool: true },
  { ticker: "NVDA", name: "Nvidia", rarity: "legendary", base: 131.8, color: "#5aa632", pool: true },
  { ticker: "GOOGL", name: "Alphabet", rarity: "epic", base: 178.6, color: "#e0873b", pool: true },
  { ticker: "AMZN", name: "Amazon", rarity: "epic", base: 201.3, color: "#e0a93b", pool: true },
  { ticker: "META", name: "Meta", rarity: "epic", base: 563.9, color: "#3a7fd6", pool: true },
  { ticker: "TSLA", name: "Tesla", rarity: "epic", base: 248.5, color: "#d64a3a", pool: true },
  { ticker: "AMD", name: "AMD", rarity: "epic", base: 122.7, color: "#2f9e7a", pool: false },
  { ticker: "KO", name: "Coca-Cola", rarity: "rare", base: 62.1, color: "#d6483a", pool: true },
  { ticker: "JNJ", name: "Johnson & Johnson", rarity: "rare", base: 154.8, color: "#c94b6e", pool: true },
  { ticker: "UNH", name: "UnitedHealth", rarity: "rare", base: 583.2, color: "#3a86d6", pool: true },
  { ticker: "PG", name: "Procter & Gamble", rarity: "common", base: 168.4, color: "#3aa5c9", pool: false },
  { ticker: "XOM", name: "ExxonMobil", rarity: "common", base: 118.9, color: "#c94b4b", pool: true },
  { ticker: "PFE", name: "Pfizer", rarity: "common", base: 27.6, color: "#3a7fd6", pool: false },
];

const STOCK_BY_TICKER: Record<string, Stock> = Object.fromEntries(
  STOCKS.map((s) => [s.ticker, s])
);

// ---------- The 5 curated packs --------------------------------------------
type Pack = {
  id: string;
  name: string;
  price: number;
  theme: string; // hex for pack art
  theme2: string;
  tickers: string[];
  status: "live" | "soon";
  bonusStock: number; // $ bonus for completing the collection
  freePacks: number;
  blurb: string;
};

const PACKS: Pack[] = [
  {
    id: "ai",
    name: "AI Pack",
    price: 9.99,
    theme: "#6fd08a",
    theme2: "#35e6d4",
    tickers: ["NVDA", "MSFT", "GOOGL"],
    status: "soon",
    bonusStock: 5,
    freePacks: 1,
    blurb: "The compute layer of the future.",
  },
  {
    id: "mag7",
    name: "Magnificent Seven",
    price: 14.99,
    theme: "#e0a93b",
    theme2: "#e0873b",
    tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"],
    status: "soon",
    bonusStock: 10,
    freePacks: 2,
    blurb: "Seven giants. One legendary pull.",
  },
  {
    id: "dividend",
    name: "Dividend Kings",
    price: 7.99,
    theme: "#4faa6b",
    theme2: "#86e05a",
    tickers: ["KO", "JNJ", "PG", "XOM"],
    status: "soon",
    bonusStock: 4,
    freePacks: 1,
    blurb: "Decades of payouts, tokenized.",
  },
  {
    id: "health",
    name: "Healthcare",
    price: 8.99,
    theme: "#35e6d4",
    theme2: "#6aa8ff",
    tickers: ["JNJ", "PFE", "UNH"],
    status: "live",
    bonusStock: 3,
    freePacks: 1,
    blurb: "The business of staying alive.",
  },
  {
    id: "future",
    name: "Future Tech",
    price: 11.99,
    theme: "#9b7bff",
    theme2: "#6aa8ff",
    tickers: ["TSLA", "AMD", "NVDA", "META"],
    status: "live",
    bonusStock: 6,
    freePacks: 1,
    blurb: "Betting on what comes next.",
  },
];

// ============================================================================
// Uncommon inline SVG icons (all inherit color via currentColor)
// ============================================================================
type IP = { size?: number };
const svg = (p: IP, children: React.ReactNode, vb = "0 0 24 24") => (
  <svg
    width={p.size ?? 20}
    height={p.size ?? 20}
    viewBox={vb}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);
const IconSprout = (p: IP) =>
  svg(p, <>
    <path d="M7 20h10" />
    <path d="M12 20c0-5 0-8 0-8" />
    <path d="M12 12C12 8 9 6 4 6c0 4 3 6 8 6z" />
    <path d="M12 11c0-3 2-5 6-5 0 3-2 5-6 5z" />
  </>);
const IconHexNode = (p: IP) =>
  svg(p, <>
    <path d="M12 2.5l8.5 4.9v9.2L12 21.5 3.5 16.6V7.4z" />
    <circle cx="12" cy="12" r="2.2" />
  </>);
const IconOrbit = (p: IP) =>
  svg(p, <>
    <circle cx="12" cy="12" r="3" />
    <ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(30 12 12)" />
    <circle cx="20" cy="8.2" r="1.1" fill="currentColor" />
  </>);
const IconVault = (p: IP) =>
  svg(p, <>
    <rect x="3" y="4" width="18" height="16" rx="2.4" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8v1.6M12 14.4V16M8 12h1.6M14.4 12H16" />
  </>);
const IconDice = (p: IP) =>
  svg(p, <>
    <path d="M12 2.5l8.5 4.9v9.2L12 21.5 3.5 16.6V7.4z" />
    <path d="M12 12l8.5-4.6M12 12v9.5M12 12L3.5 7.4" />
    <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="8.4" cy="14.4" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15.6" cy="14.4" r="0.9" fill="currentColor" stroke="none" />
  </>);
const IconGauge = (p: IP) =>
  svg(p, <>
    <path d="M4 16a8 8 0 1 1 16 0" />
    <path d="M12 16l4.2-4.2" />
    <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
  </>);
const IconShield = (p: IP) =>
  svg(p, <>
    <path d="M12 2.5l7.5 3v5.5c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10V5.5z" />
    <path d="M8.8 12l2.2 2.2 4.2-4.4" />
  </>);
const IconInfinity = (p: IP) =>
  svg(p, <>
    <path d="M6.5 9C4.6 9 3 10.3 3 12s1.6 3 3.5 3c3.5 0 4.5-6 8-6 1.9 0 3.5 1.3 3.5 3s-1.6 3-3.5 3c-3.5 0-4.5-6-8-6z" />
  </>);
const IconWallet = (p: IP) =>
  svg(p, <>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5" />
    <rect x="3" y="7" width="18" height="12" rx="2.4" />
    <circle cx="16.5" cy="13" r="1.4" fill="currentColor" stroke="none" />
  </>);
const IconBolt = (p: IP) =>
  svg(p, <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l1-8z" />);
const IconLayers = (p: IP) =>
  svg(p, <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>);
const IconGem = (p: IP) =>
  svg(p, <>
    <path d="M6 3h12l3 6-9 12L3 9z" />
    <path d="M3 9h18M9 3l-3 6 6 12 6-12-3-6" />
  </>);
const IconGift = (p: IP) =>
  svg(p, <>
    <rect x="3.5" y="9" width="17" height="12" rx="1.6" />
    <path d="M3.5 13h17M12 9v12" />
    <path d="M12 9S10.5 4.5 8 5.2C6 5.8 6.6 9 9 9zM12 9s1.5-4.5 4-3.8C18 5.8 17.4 9 15 9z" />
  </>);
const IconTrophy = (p: IP) =>
  svg(p, <>
    <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
    <path d="M10 13.5V17h4v-3.5M8 21h8M12 17v4" />
  </>);
const IconArrow = (p: IP) => svg(p, <><path d="M5 12h14M13 6l6 6-6 6" /></>);
const IconFlask = (p: IP) =>
  svg(p, <>
    <path d="M9 3h6M10 3v5.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.5V3" />
    <path d="M7.5 14h9" />
  </>);
const IconClock = (p: IP) =>
  svg(p, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></>);
const IconSpark = (p: IP) =>
  svg(p, <>
    <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" />
    <path d="M18.5 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
  </>);
const IconChain = (p: IP) =>
  svg(p, <>
    <path d="M9 12h6" />
    <path d="M8 8.5H6.5a3.5 3.5 0 0 0 0 7H8M16 8.5h1.5a3.5 3.5 0 0 1 0 7H16" />
  </>);
const IconCube = (p: IP) =>
  svg(p, <>
    <path d="M12 2.5l8.5 4.9v9.2L12 21.5 3.5 16.6V7.4z" />
    <path d="M12 12l8.5-4.6M12 12v9.5M12 12L3.5 7.4" />
  </>);

// ---------- Brand mark (a sprout inside a hexagon — the new page logo) ------
function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="brandmark">
      <defs>
        <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fd08a" />
          <stop offset="0.55" stopColor="#4faa6b" />
          <stop offset="1" stopColor="#35b39a" />
        </linearGradient>
      </defs>
      <path
        d="M24 3l17 9.8v19.6L24 45 7 32.4V12.8z"
        fill="url(#bm)"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.2"
      />
      <g stroke="#0f3320" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M24 34V22" />
        <path d="M24 24c0-5-4-8-11-8 0 5 4 8 11 8z" fill="#0f3320" fillOpacity="0.16" />
        <path d="M24 22c0-4 3-6.5 9-6.5 0 4-3 6.5-9 6.5z" fill="#0f3320" fillOpacity="0.16" />
      </g>
      <circle cx="24" cy="35.5" r="1.7" fill="#0f3320" />
    </svg>
  );
}

// ============================================================================
// Persistent vault store (localStorage + live cross-component sync)
// ============================================================================
type Opening = {
  id: string;
  ticker: string;
  rarity: RarityKey;
  packId: string;
  who: string; // "you" or a short pseudo-address
  ts: number;
};
type VaultState = {
  jackpot: number;
  pulls: Record<string, number>; // ticker -> count owned
  openings: Opening[]; // most recent first
  packsOpened: number;
};
const VAULT_KEY = "sprout_vault_v1";
const VAULT_EVENT = "sprout-vault";
const START_JACKPOT = 300;

function readVault(): VaultState {
  if (typeof window === "undefined")
    return { jackpot: START_JACKPOT, pulls: {}, openings: [], packsOpened: 0 };
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) {
      const p = JSON.parse(raw) as VaultState;
      return {
        jackpot: p.jackpot ?? START_JACKPOT,
        pulls: p.pulls ?? {},
        openings: p.openings ?? [],
        packsOpened: p.packsOpened ?? 0,
      };
    }
  } catch {}
  return { jackpot: START_JACKPOT, pulls: {}, openings: [], packsOpened: 0 };
}
function writeVault(v: VaultState) {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(v));
  } catch {}
  window.dispatchEvent(new CustomEvent(VAULT_EVENT, { detail: v }));
}
function useVault() {
  const [v, setV] = useState<VaultState>(() => ({
    jackpot: START_JACKPOT,
    pulls: {},
    openings: [],
    packsOpened: 0,
  }));
  useEffect(() => {
    setV(readVault());
    const on = (e: Event) => setV((e as CustomEvent).detail as VaultState);
    window.addEventListener(VAULT_EVENT, on);
    return () => window.removeEventListener(VAULT_EVENT, on);
  }, []);
  return v;
}

// ---------- Wallet (simulated self-custody connect) -------------------------
function useWallet() {
  const [addr, setAddr] = useState<string | null>(null);
  useEffect(() => {
    try {
      setAddr(localStorage.getItem("sprout_wallet"));
    } catch {}
    const on = () => {
      try {
        setAddr(localStorage.getItem("sprout_wallet"));
      } catch {}
    };
    window.addEventListener("sprout-wallet-change", on);
    return () => window.removeEventListener("sprout-wallet-change", on);
  }, []);
  const connect = () => {
    const hex = "0123456789abcdef";
    let a = "0x";
    for (let i = 0; i < 40; i++) a += hex[Math.floor(Math.random() * 16)];
    try {
      localStorage.setItem("sprout_wallet", a);
    } catch {}
    setAddr(a);
    window.dispatchEvent(new Event("sprout-wallet-change"));
    return a;
  };
  const disconnect = () => {
    try {
      localStorage.removeItem("sprout_wallet");
    } catch {}
    setAddr(null);
    window.dispatchEvent(new Event("sprout-wallet-change"));
  };
  const short = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : null;
  return { addr, short, connect, disconnect };
}

// ---------- Weighted random draw (provably-fair styled) ---------------------
function weightedPull(tickers: string[]): Stock {
  const pool = tickers.map((t) => STOCK_BY_TICKER[t]).filter(Boolean);
  const total = pool.reduce((s, k) => s + RARITY[k.rarity].weight, 0);
  let r = Math.random() * total;
  for (const s of pool) {
    r -= RARITY[s.rarity].weight;
    if (r <= 0) return s;
  }
  return pool[pool.length - 1];
}

// ---------- Live-ish price feed (random walk around the base) ---------------
function usePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(STOCKS.map((s) => [s.ticker, s.base]))
  );
  const [changes, setChanges] = useState<Record<string, number>>(() =>
    Object.fromEntries(STOCKS.map((s) => [s.ticker, 0]))
  );
  useEffect(() => {
    // seed a plausible 24h change once
    setChanges(
      Object.fromEntries(STOCKS.map((s) => [s.ticker, (Math.random() * 8 - 3.2)]))
    );
    const id = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        for (const s of STOCKS) {
          const drift = (Math.random() - 0.5) * s.base * 0.004;
          next[s.ticker] = Math.max(0.5, prev[s.ticker] + drift);
        }
        return next;
      });
      setChanges((prev) => {
        const next = { ...prev };
        for (const s of STOCKS)
          next[s.ticker] = prev[s.ticker] + (Math.random() - 0.5) * 0.3;
        return next;
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return { prices, changes };
}

// ============================================================================
// Background FX — soft light aurora reacting to scroll + click ripples
// ============================================================================
function BgFX() {
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--sy", `${window.scrollY}px`);
        raf = 0;
      });
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, a, input, textarea, label, .pack-card, .stock-chip")) return;
      const r = document.createElement("span");
      r.className = "ripple";
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="bgfx" aria-hidden>
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="grid" />
    </div>
  );
}

// ---------- Ticker badge for a company (kept, not the page brand) -----------
function TickerBadge({ stock, size = 46 }: { stock: Stock; size?: number }) {
  return (
    <span
      className="ticker-badge"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${stock.color}, ${stock.color}cc)`,
        fontSize: size * 0.3,
      }}
      title={stock.name}
    >
      {stock.ticker.slice(0, 4)}
    </span>
  );
}

function RarityPip({ rarity }: { rarity: RarityKey }) {
  const r = RARITY[rarity];
  return (
    <span className="rarity-pip" style={{ color: r.color }}>
      {"★".repeat(r.stars)}
      <span className="rarity-name">{r.label}</span>
    </span>
  );
}

// ============================================================================
// Top navigation + wallet connect
// ============================================================================
function Topbar() {
  const { short, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const links = ["Packs", "Stocks", "Rarity", "Collections", "Docs"];
  return (
    <div className="topbar">
      <a href="#top" className="brand">
        <BrandMark />
        <div className="name">
          Stock<b>Sprout</b>
        </div>
      </a>
      <nav className={`nav ${open ? "open" : ""}`}>
        {links.map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}>
            {l}
          </a>
        ))}
      </nav>
      <div className="top-actions">
        <span className="chain-badge">
          <IconChain size={14} /> Robinhood Chain
        </span>
        {short ? (
          <button className="btn wallet-btn connected" onClick={disconnect} title="Disconnect">
            <span className="wdot" /> {short}
          </button>
        ) : (
          <button className="btn wallet-btn" onClick={() => connect()}>
            <IconWallet size={16} /> Connect
          </button>
        )}
        <button
          className="hamb"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Hero
// ============================================================================
function Hero({ onBrowse }: { onBrowse: () => void }) {
  const v = useVault();
  const { addr, connect } = useWallet();
  return (
    <section className="hero" id="top">
      <div className="hero-badge">
        <IconSpark size={14} /> Real tokenized equities · live on-chain
      </div>
      <h1>
        Open. <GradientText animationSpeed={6}>Own.</GradientText> Invest.
      </h1>
      <p className="sub">
        Every <b>StockSprout</b> holds real tokenized stocks. Own pieces of the
        world&apos;s greatest companies — <b>instantly</b>, settled on-chain.
      </p>
      <div className="hero-cta">
        {addr ? (
          <button className="btn big" onClick={onBrowse}>
            <IconLayers size={18} /> Browse Packs
          </button>
        ) : (
          <button className="btn big" onClick={() => connect()}>
            <IconWallet size={18} /> Connect to Open
          </button>
        )}
        <button className="btn ghost big" onClick={onBrowse}>
          Browse Packs <IconArrow size={16} />
        </button>
      </div>

      <div className="hero-stats">
        <div className="hstat">
          <div className="hstat-num">14</div>
          <div className="hstat-lbl">Tokenized stocks</div>
        </div>
        <div className="hstat">
          <div className="hstat-num">5</div>
          <div className="hstat-lbl">Curated packs</div>
        </div>
        <div className="hstat jackpot">
          <div className="hstat-num">
            <IconTrophy size={20} /> $<NumberTicker value={v.jackpot} />
          </div>
          <div className="hstat-lbl">Live jackpot vault</div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Feature strip (6 uncommon-iconed callouts)
// ============================================================================
function Features() {
  const feats = [
    { icon: <IconCube />, t: "14 Tokenized Stocks", d: "Real equities as ERC-20 tokens" },
    { icon: <IconChain />, t: "Robinhood Chain", d: "Purpose-built L2 for real-world assets" },
    { icon: <IconInfinity />, t: "Uniswap v4 Settlement", d: "Every pack swaps on-chain liquidity" },
    { icon: <IconDice />, t: "Verifiable Randomness", d: "Provably fair reveals" },
    { icon: <IconVault />, t: "Self Custody", d: "Stocks settle to your wallet" },
    { icon: <IconClock />, t: "24/7 Markets", d: "Open packs any time, any day" },
  ];
  return (
    <div className="features">
      {feats.map((f) => (
        <div className="feature" key={f.t}>
          <span className="feature-ic">{f.icon}</span>
          <div>
            <div className="feature-t">{f.t}</div>
            <div className="feature-d">{f.d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Scrolling stock ticker marquee (live prices)
// ============================================================================
function TickerMarquee({ prices, changes }: { prices: Record<string, number>; changes: Record<string, number> }) {
  const row = [...STOCKS, ...STOCKS];
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {row.map((s, i) => {
          const ch = changes[s.ticker] ?? 0;
          return (
            <span className="mq-item" key={`${s.ticker}-${i}`}>
              <TickerBadge stock={s} size={26} />
              <b>{s.ticker}</b>
              <span className="mq-price">${prices[s.ticker]?.toFixed(2)}</span>
              <span className={ch >= 0 ? "up" : "down"}>
                {ch >= 0 ? "▲" : "▼"}
                {Math.abs(ch).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Decorative pack art (inline SVG, generated per pack theme)
// ============================================================================
function PackArt({ pack }: { pack: Pack }) {
  const gid = `pk-${pack.id}`;
  return (
    <div className="pack-art">
      <svg viewBox="0 0 220 150" className="pack-art-svg" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={pack.theme} />
            <stop offset="1" stopColor={pack.theme2} />
          </linearGradient>
          <radialGradient id={`${gid}-g`} cx="0.3" cy="0.2" r="0.9">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* capsule body */}
        <rect x="46" y="18" width="128" height="114" rx="20" fill={`url(#${gid})`} />
        <rect x="46" y="18" width="128" height="114" rx="20" fill={`url(#${gid}-g)`} />
        {/* seam */}
        <path d="M46 75 h128" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" />
        <circle cx="110" cy="75" r="15" fill="#ffffff" fillOpacity="0.85" />
        <circle cx="110" cy="75" r="8" fill={pack.theme} />
        {/* floating pips = number of stocks */}
        {pack.tickers.slice(0, 5).map((_, i) => {
          const angle = (i / Math.max(1, Math.min(5, pack.tickers.length))) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={110 + Math.cos(angle) * 40}
              cy={75 + Math.sin(angle) * 30}
              r="4.5"
              fill="#ffffff"
              fillOpacity="0.9"
            />
          );
        })}
        {/* sparkles */}
        <path d="M60 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff" fillOpacity="0.9" />
        <path d="M158 108l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#fff" fillOpacity="0.8" />
      </svg>
    </div>
  );
}

// ============================================================================
// Pack opening modal — reveal animation + confetti + weighted draw
// ============================================================================
function OpeningModal({
  pack,
  onClose,
  onSettled,
}: {
  pack: Pack;
  onClose: () => void;
  onSettled: (s: Stock) => void;
}) {
  const [phase, setPhase] = useState<"charging" | "spin" | "reveal">("charging");
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState<Stock | null>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const final = weightedPull(pack.tickers);
    let spins = 0;
    const totalSpins = 22 + Math.floor(Math.random() * 8);
    let t: ReturnType<typeof setTimeout>;
    const charge = setTimeout(() => setPhase("spin"), 650);

    const step = () => {
      setCursor((c) => (c + 1) % pack.tickers.length);
      spins++;
      const remaining = totalSpins - spins;
      const delay = remaining < 6 ? 90 + (6 - remaining) * 45 : 70;
      if (spins < totalSpins) {
        t = setTimeout(step, delay);
      } else {
        const idx = pack.tickers.indexOf(final.ticker);
        setCursor(idx);
        setResult(final);
        setPhase("reveal");
        onSettled(final);
        burst(final.rarity);
      }
    };
    const spinStart = setTimeout(step, 700);
    return () => {
      clearTimeout(charge);
      clearTimeout(spinStart);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function burst(rarity: RarityKey) {
    const host = confettiRef.current;
    if (!host) return;
    const colors =
      rarity === "legendary"
        ? ["#e0a52a", "#ffd76a", "#fff2c2", "#4faa6b"]
        : rarity === "epic"
        ? ["#8b6df0", "#c7b6ff", "#6fd08a", "#fff"]
        : ["#4faa6b", "#86e05a", "#35e6d4", "#fff"];
    const n = rarity === "legendary" ? 90 : rarity === "epic" ? 64 : 44;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "confetti";
      const a = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 190;
      p.style.setProperty("--tx", `${Math.cos(a) * dist}px`);
      p.style.setProperty("--ty", `${Math.sin(a) * dist - 40}px`);
      p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = `${Math.random() * 80}ms`;
      host.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }
  }

  const current = STOCK_BY_TICKER[pack.tickers[cursor]];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="modal-eyebrow">
          Opening · <b>{pack.name}</b>
        </div>

        <div className={`reveal-stage ${phase}`} ref={confettiRef}>
          {phase !== "reveal" ? (
            <div className="reel">
              <div className="reel-glow" />
              <TickerBadge stock={current} size={92} />
              <div className="reel-tick">{current.ticker}</div>
              <UiverseSpinner />
              <div className="reel-hint">
                {phase === "charging" ? "Requesting randomness…" : "Swapping on Uniswap v4…"}
              </div>
            </div>
          ) : (
            result && (
              <div className="reveal-card" style={{ ["--rc" as string]: RARITY[result.rarity].color }}>
                <div className="reveal-ring" />
                <TickerBadge stock={result} size={104} />
                <div className="reveal-name">
                  {result.name} <span>{result.ticker}</span>
                </div>
                <RarityPip rarity={result.rarity} />
                <div className="reveal-price">
                  Settled ≈ ${result.base.toFixed(2)} of {result.ticker}
                </div>
              </div>
            )
          )}
        </div>

        {phase === "reveal" ? (
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>
              <IconVault size={16} /> Add to wallet
            </button>
          </div>
        ) : (
          <div className="modal-steps">
            <span className={phase === "charging" ? "active" : "done"}>
              <IconDice size={14} /> Randomness
            </span>
            <span className={phase === "spin" ? "active" : ""}>
              <IconInfinity size={14} /> Swap
            </span>
            <span>
              <IconVault size={14} /> Settle
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Packs section
// ============================================================================
function Packs({
  registerBrowse,
}: {
  registerBrowse: (fn: () => void) => void;
}) {
  const { addr, connect } = useWallet();
  const [opening, setOpening] = useState<Pack | null>(null);
  // Aceternity "focus cards" technique: hovering one card dims/blurs the rest.
  const [hovered, setHovered] = useState<number | null>(null);
  const secRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerBrowse(() =>
      secRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, [registerBrowse]);

  function openPack(p: Pack) {
    if (!addr) {
      connect();
      return;
    }
    setOpening(p);
  }

  function onSettled(p: Pack, s: Stock) {
    const v = readVault();
    const pulls = { ...v.pulls, [s.ticker]: (v.pulls[s.ticker] || 0) + 1 };
    const opening: Opening = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ticker: s.ticker,
      rarity: s.rarity,
      packId: p.id,
      who: "you",
      ts: Date.now(),
    };
    writeVault({
      jackpot: Math.round((v.jackpot + p.price * 0.35) * 100) / 100,
      pulls,
      openings: [opening, ...v.openings].slice(0, 40),
      packsOpened: v.packsOpened + 1,
    });
  }

  return (
    <section className="section" id="packs" ref={secRef}>
      <SectionHead
        icon={<IconLayers />}
        kicker="The Packs"
        title="Five curated portfolios."
        sub="Real companies. One reveal away."
      />
      <div className="pack-grid" onMouseLeave={() => setHovered(null)}>
        {PACKS.map((p, i) => (
          <div
            className={`pack-card ${hovered !== null && hovered !== i ? "dim" : ""}`}
            key={p.id}
            onMouseEnter={() => setHovered(i)}
          >
            <div className={`pack-status ${p.status}`}>
              {p.status === "live" ? "Live" : "Coming soon"}
            </div>
            <PackArt pack={p} />
            <div className="pack-body">
              <div className="pack-name">{p.name}</div>
              <div className="pack-blurb">{p.blurb}</div>
              <div className="pack-meta">
                <span>
                  <IconCube size={14} /> {p.tickers.length} stocks inside
                </span>
                <span>
                  <IconChain size={14} /> Settles on-chain
                </span>
              </div>
              <div className="pack-chips">
                {p.tickers.map((t) => (
                  <span
                    key={t}
                    className="mini-chip"
                    style={{ color: RARITY[STOCK_BY_TICKER[t].rarity].color }}
                    title={`${STOCK_BY_TICKER[t].name} · ${RARITY[STOCK_BY_TICKER[t].rarity].label}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="pack-foot">
                <div className="pack-price">${p.price.toFixed(2)}</div>
                <button className="btn open-btn" onClick={() => openPack(p)}>
                  <IconGift size={16} /> {addr ? "Open pack" : "Connect to open"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {opening && (
        <OpeningModal
          pack={opening}
          onClose={() => setOpening(null)}
          onSettled={(s) => onSettled(opening, s)}
        />
      )}
    </section>
  );
}

function SectionHead({
  icon,
  kicker,
  title,
  sub,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="section-head">
      <span className="sh-ic">{icon}</span>
      <div>
        <div className="sh-kicker">{kicker}</div>
        <h2>
          {title} <span className="sh-sub">{sub}</span>
        </h2>
      </div>
    </div>
  );
}

// ============================================================================
// On-chain stocks listing (14 stocks, live prices, rarity, pool status)
// ============================================================================
function Stocks({ prices, changes }: { prices: Record<string, number>; changes: Record<string, number> }) {
  const v = useVault();
  const [filter, setFilter] = useState<"all" | RarityKey>("all");
  const list = STOCKS.filter((s) => filter === "all" || s.rarity === filter);
  return (
    <section className="section" id="stocks">
      <SectionHead
        icon={<IconHexNode />}
        kicker="On the chain"
        title="Real tokenized equities."
        sub="Live Uniswap v4 prices."
      />
      <div className="chip-filters">
        {(["all", "legendary", "epic", "rare", "common"] as const).map((k) => (
          <button
            key={k}
            className={`chip-filter ${filter === k ? "active" : ""}`}
            onClick={() => setFilter(k)}
            style={k !== "all" ? { color: RARITY[k].color } : undefined}
          >
            {k === "all" ? "All 14" : RARITY[k].label}
          </button>
        ))}
      </div>
      <div className="stock-grid">
        {list.map((s) => {
          const ch = changes[s.ticker] ?? 0;
          const owned = v.pulls[s.ticker] || 0;
          return (
            <div className="stock-chip" key={s.ticker} style={{ ["--rc" as string]: RARITY[s.rarity].color }}>
              <TickerBadge stock={s} size={44} />
              <div className="stock-info">
                <div className="stock-top">
                  <b>{s.ticker}</b>
                  <span className="stock-star" style={{ color: RARITY[s.rarity].color }}>
                    {"★".repeat(RARITY[s.rarity].stars)}
                  </span>
                </div>
                <div className="stock-name">{s.name}</div>
                <div className="stock-price">
                  ${prices[s.ticker]?.toFixed(2)}
                  <span className={ch >= 0 ? "up" : "down"}>
                    {ch >= 0 ? "▲" : "▼"}
                    {Math.abs(ch).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="stock-foot">
                <span className={`pool ${s.pool ? "on" : "off"}`}>
                  {s.pool ? "live pool" : "no pool"}
                </span>
                {owned > 0 && <span className="owned">×{owned} owned</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// Rarity tiers explainer (weighted odds)
// ============================================================================
function Rarity() {
  const tiers: RarityKey[] = ["legendary", "epic", "rare", "common"];
  const totalW = tiers.reduce((s, t) => s + RARITY[t].weight, 0);
  return (
    <section className="section" id="rarity">
      <SectionHead
        icon={<IconGem />}
        kicker="Weighted odds"
        title="The rarest companies"
        sub="are the hardest to pull."
      />
      <div className="rarity-grid">
        {tiers.map((t) => {
          const r = RARITY[t];
          const pct = ((r.weight / totalW) * 100).toFixed(0);
          const members = STOCKS.filter((s) => s.rarity === t);
          return (
            <div className="rarity-card" key={t} style={{ ["--rc" as string]: r.color }}>
              <div className="rarity-head">
                <span className="rarity-stars">{"★".repeat(r.stars)}</span>
                <span className="rarity-title">{r.label}</span>
              </div>
              <div className="rarity-odds">
                <span className="rarity-pct">{pct}%</span> pull chance
              </div>
              <div className="rarity-bar">
                <div className="rarity-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="rarity-members">
                {members.map((m) => (
                  <span key={m.ticker} className="mini-chip">
                    {m.ticker}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// How it works + on-chain process flow
// ============================================================================
function HowItWorks() {
  const steps = [
    { icon: <IconWallet />, t: "Connect", d: "Any EVM wallet. Robinhood Chain adds automatically." },
    { icon: <IconLayers />, t: "Choose", d: "Pick a themed StockSprout pack." },
    { icon: <IconGift />, t: "Reveal", d: "Watch the pack open with a provably-fair draw." },
    { icon: <IconVault />, t: "Own", d: "Real tokenized equity settles in your wallet instantly." },
  ];
  const flow = [
    { icon: <IconWallet />, t: "USDG", d: "Your payment enters the pack contract" },
    { icon: <IconDice />, t: "Verifiable Randomness", d: "A provably fair draw selects your stock" },
    { icon: <IconInfinity />, t: "Uniswap v4 Swap", d: "USDG swaps for the tokenized equity" },
    { icon: <IconCube />, t: "Tokenized Stock", d: "A real ERC-20 stock token" },
    { icon: <IconVault />, t: "Your Wallet", d: "Settles directly to you" },
  ];
  return (
    <section className="section" id="how">
      <SectionHead
        icon={<IconGauge />}
        kicker="How it works"
        title="No inventory. No IOUs."
        sub="Every step happens on-chain."
      />
      <div className="steps">
        {steps.map((s, i) => (
          <div className="step" key={s.t}>
            <div className="step-n">{i + 1}</div>
            <span className="step-ic">{s.icon}</span>
            <div className="step-t">{s.t}</div>
            <div className="step-d">{s.d}</div>
          </div>
        ))}
      </div>
      <div className="flow">
        {flow.map((f, i) => (
          <div className="flow-node" key={f.t}>
            <span className="flow-ic">{f.icon}</span>
            <div className="flow-t">{f.t}</div>
            <div className="flow-d">{f.d}</div>
            {i < flow.length - 1 && <span className="flow-arrow"><IconArrow size={18} /></span>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Collections — progress tracking with badges, bonus stock, free packs
// ============================================================================
function Collections() {
  const v = useVault();
  return (
    <section className="section" id="collections">
      <SectionHead
        icon={<IconTrophy />}
        kicker="Collections"
        title="Complete a portfolio."
        sub="Earn your badge, bonus stock, and a free pack."
      />
      <div className="coll-grid">
        {PACKS.map((p) => {
          const owned = p.tickers.filter((t) => (v.pulls[t] || 0) > 0).length;
          const pct = Math.round((owned / p.tickers.length) * 100);
          const done = owned === p.tickers.length;
          return (
            <div className={`coll-card ${done ? "done" : ""}`} key={p.id}>
              <div className="coll-top">
                <div
                  className="coll-badge"
                  style={{ background: `linear-gradient(135deg, ${p.theme}, ${p.theme2})` }}
                >
                  {done ? <IconTrophy size={20} /> : <IconGift size={20} />}
                </div>
                <div>
                  <div className="coll-name">{p.name}</div>
                  <div className="coll-reward">
                    +${p.bonusStock} bonus · {p.freePacks} free pack{p.freePacks > 1 ? "s" : ""}
                  </div>
                </div>
                {done && <span className="coll-done-pill">Complete</span>}
              </div>
              <div className="coll-track">
                {p.tickers.map((t) => (
                  <span
                    key={t}
                    className={`coll-slot ${(v.pulls[t] || 0) > 0 ? "filled" : ""}`}
                    title={STOCK_BY_TICKER[t].name}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="coll-bar">
                <div className="coll-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="coll-pct">
                {owned}/{p.tickers.length} · {pct}% complete
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// Live openings feed (your pulls + simulated network activity)
// ============================================================================
function randAddr() {
  const hex = "0123456789abcdef";
  let a = "0x";
  for (let i = 0; i < 4; i++) a += hex[Math.floor(Math.random() * 16)];
  return a + "…" + hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
}
function LiveOpenings() {
  const v = useVault();
  const [bots, setBots] = useState<Opening[]>([]);
  useEffect(() => {
    // seed + periodically add simulated network openings
    const make = (): Opening => {
      const pack = PACKS[Math.floor(Math.random() * PACKS.length)];
      const s = weightedPull(pack.tickers);
      return {
        id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ticker: s.ticker,
        rarity: s.rarity,
        packId: pack.id,
        who: randAddr(),
        ts: Date.now(),
      };
    };
    setBots(Array.from({ length: 5 }, make));
    const id = setInterval(() => {
      setBots((b) => [make(), ...b].slice(0, 12));
    }, 3800);
    return () => clearInterval(id);
  }, []);

  const merged = [...v.openings, ...bots]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);

  return (
    <section className="section" id="live">
      <div className="live-head-row">
        <SectionHead
          icon={<IconOrbit />}
          kicker="Live openings"
          title="The vault never sleeps."
          sub="Real-time reveals across the chain."
        />
        <div className="barwave-wrap" title="Market is live — hover the bars">
          <BarWave size={132} />
        </div>
      </div>
      <div className="live-feed">
        {merged.length === 0 && (
          <div className="live-empty">Open a pack to see it appear here.</div>
        )}
        {merged.map((o) => {
          const s = STOCK_BY_TICKER[o.ticker];
          const pack = PACKS.find((p) => p.id === o.packId);
          return (
            <div className={`live-row ${o.who === "you" ? "you" : ""}`} key={o.id}>
              <span className="live-dot" style={{ background: RARITY[o.rarity].color }} />
              <TickerBadge stock={s} size={30} />
              <div className="live-main">
                <div>
                  <b>{o.who === "you" ? "You" : o.who}</b> pulled{" "}
                  <b style={{ color: RARITY[o.rarity].color }}>{s.ticker}</b>
                </div>
                <div className="live-sub">
                  {pack?.name} · {RARITY[o.rarity].label}
                </div>
              </div>
              <span className="live-rarity" style={{ color: RARITY[o.rarity].color }}>
                {"★".repeat(RARITY[o.rarity].stars)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// Pre-footer CTA + footer
// ============================================================================
function CTA({ onBrowse }: { onBrowse: () => void }) {
  const { addr, connect } = useWallet();
  return (
    <section className="cta">
      <div className="cta-inner">
        <h2>Ready to open?</h2>
        <p>Connect your wallet. Pick a pack. Own real stock.</p>
        <button
          className="btn big"
          onClick={() => (addr ? onBrowse() : connect())}
        >
          {addr ? (
            <>
              <IconGift size={18} /> Open your first pack
            </>
          ) : (
            <>
              <IconWallet size={18} /> Connect wallet
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function Footer() {
  const v = useVault();
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="brand">
          <BrandMark size={30} />
          <div className="name">
            Stock<b>Sprout</b>
          </div>
        </div>
        <p>
          Every StockSprout purchases real tokenized equities on Robinhood Chain
          through Uniswap v4. No inventory. No IOUs.
        </p>
      </div>
      <div className="footer-links">
        <span>
          <IconChain size={13} /> Built on Robinhood Chain
        </span>
        <a href="#how" className="uil-underline">Docs</a>
        <a href="#packs" className="uil-underline">Packs</a>
        <a href="#stocks" className="uil-underline">Stocks</a>
        <span>{v.packsOpened} packs opened locally</span>
      </div>
      <div className="footer-fine">
        Demo experience · prices and reveals are simulated for illustration. Not
        financial advice.
      </div>
    </footer>
  );
}

// ============================================================================
// Page
// ============================================================================
export default function Page() {
  const { prices, changes } = usePrices();
  const browseRef = useRef<() => void>(() => {});
  const browse = useCallback(() => browseRef.current(), []);
  const registerBrowse = useCallback((fn: () => void) => {
    browseRef.current = fn;
  }, []);

  // Ambient jackpot growth so the counter feels alive even when idle.
  useEffect(() => {
    const id = setInterval(() => {
      const v = readVault();
      writeVault({ ...v, jackpot: Math.round((v.jackpot + 0.37) * 100) / 100 });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <RippleCursor />
      <BgFX />
      <Topbar />
      <TickerMarquee prices={prices} changes={changes} />
      <div className="app">
        <Hero onBrowse={browse} />
        <Features />
        <Packs registerBrowse={registerBrowse} />
        <Stocks prices={prices} changes={changes} />
        <Rarity />
        <HowItWorks />
        <Collections />
        <LiveOpenings />
        <CTA onBrowse={browse} />
        <Footer />
      </div>
    </>
  );
}
