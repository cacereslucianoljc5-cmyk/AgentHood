"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Scanning,
  ScanQrCode,
  Activity,
  GraphUp,
  DataTransferBoth,
  Network,
  Group,
  GitFork,
  Reports,
  Compass,
  StatsUpSquare,
  Fingerprint,
  Wallet,
  Lock,
  EyeClosed,
  CheckCircle,
  WarningTriangle,
  ArrowRight,
  ArrowUpRight,
  OpenNewWindow,
  NavArrowDown,
  Github,
  Sparks,
  Flash,
} from "iconoir-react";

/* ------------------------------------------------------------------ *
 *  Motion helpers — every element rises in on its own, staggered.
 * ------------------------------------------------------------------ */
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: EASE } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/** A section whose direct children animate one after another. */
function Reveal({
  children,
  className,
  as = "section",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "header" | "footer";
  [k: string]: unknown;
}) {
  const MotionTag = (motion as unknown as Record<string, typeof motion.div>)[as];
  return (
    <MotionTag
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
/** A single element that fades+rises as part of a stagger group. */
const Item = motion.div;

/* ------------------------------------------------------------------ *
 *  Count-up — big numbers animate when scrolled into view.
 * ------------------------------------------------------------------ */
function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setVal(to);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(to * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration, reduce]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 *  Brand logo
 * ------------------------------------------------------------------ */
function Logo({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src="/logo.png" alt="Hood Radar" width={64} height={64} />;
}

/* ------------------------------------------------------------------ *
 *  Cursor — a soft radar dot + easing glow. Subtle, never loud.
 * ------------------------------------------------------------------ */
function CursorFX() {
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const glow = glowRef.current;
    const ring = ringRef.current;
    if (!glow || !ring) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.3;
    let gx = tx;
    let gy = ty;
    let rx = tx;
    let ry = ty;
    let raf = 0;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        glow.style.opacity = "1";
        ring.style.opacity = "1";
      }
      const t = e.target as HTMLElement;
      const hot = t.closest?.("button, a, [data-hot]");
      ring.classList.toggle("hot", !!hot);
    };
    const onLeave = () => {
      visible = false;
      glow.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const loop = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      rx += (tx - rx) * 0.34;
      ry += (ty - ry) * 0.34;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    glow.style.opacity = "0";
    ring.style.opacity = "0";
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <>
      <div className="cursor-glow" ref={glowRef} aria-hidden />
      <div className="cursor-ring" ref={ringRef} aria-hidden />
    </>
  );
}

/* ------------------------------------------------------------------ *
 *  Ambient radar background + scroll parallax + click ping.
 * ------------------------------------------------------------------ */
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
      if (t.closest("button, a, input, textarea, label")) return;
      const r = document.createElement("span");
      r.className = "ripple";
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 960);
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
      <div className="radar" />
      <div className="grid" />
      <div className="grain" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Navigation
 * ------------------------------------------------------------------ */
function Nav() {
  return (
    <motion.nav
      className="nav"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="brand">
        <Logo className="logo" />
        <div className="name">
          Hood<b>Radar</b>
        </div>
      </div>
      <div className="nav-links">
        <a href="#wire">Launch wire</a>
        <a href="#radar">Radar</a>
        <a href="#method">Method</a>
        <a href="#build">Build log</a>
      </div>
      <div className="nav-right">
        <span className="watch-chip">
          <Sparks width={15} height={15} /> Watchlist <b>0</b>
        </span>
        <a className="btn sm" href="#radar" data-hot>
          Open radar <ArrowUpRight width={16} height={16} />
        </a>
      </div>
    </motion.nav>
  );
}

/* ------------------------------------------------------------------ *
 *  Hero
 * ------------------------------------------------------------------ */
function Hero() {
  const blips = [
    { top: "22%", left: "30%", d: "0s", g: true },
    { top: "34%", left: "68%", d: "0.7s", g: false },
    { top: "62%", left: "40%", d: "1.3s", g: false },
    { top: "70%", left: "63%", d: "1.9s", g: true },
    { top: "48%", left: "22%", d: "2.4s", g: false },
  ];
  return (
    <Reveal className="hero" as="section">
      <div>
        <Item className="eyebrow" variants={fadeUp}>
          <span className="pulse-dot" /> On-chain intelligence · Robinhood Chain
        </Item>
        <motion.h1 variants={fadeUp}>
          Find the <em>signal.</em>
          <br />
          Interrogate the <span className="stroke">flow.</span>
        </motion.h1>
        <Item className="lead" variants={fadeUp}>
          A research terminal that reads live pool flow, wallet relationships and
          creator behaviour <b>straight from public chain records</b> — no wallet
          connection, no keys, no paid data feeds.
        </Item>
        <Item className="hero-cta" variants={fadeUp}>
          <a className="btn" href="#wire" data-hot>
            Watch the wire <NavArrowDown width={17} height={17} />
          </a>
          <a className="btn ghost" href="#radar" data-hot>
            Scan a token <ArrowRight width={17} height={17} />
          </a>
        </Item>
        <Item className="hero-meta" variants={fadeUp}>
          <div className="m">
            <div className="k">
              <CountUp to={20} suffix="s" />
            </div>
            <div className="v">Wire poll</div>
          </div>
          <div className="m">
            <div className="k">
              <CountUp to={9} />
            </div>
            <div className="v">Live modules</div>
          </div>
          <div className="m">
            <div className="k">
              <CountUp to={0} />
            </div>
            <div className="v">Paid feeds</div>
          </div>
        </Item>
      </div>

      <Item variants={fadeUp}>
        <div className="scope float">
          <div className="rings" />
          <span className="cross" />
          <div className="sweep" />
          {blips.map((b, i) => (
            <span
              key={i}
              className={`blip${b.g ? " g" : ""}`}
              style={{ top: b.top, left: b.left, animationDelay: b.d }}
            />
          ))}
          <span className="scope-tag tl">
            <span className="pulse-dot" /> WIRE · LIVE
          </span>
          <span className="scope-tag br">chain 4663</span>
          <div className="core">
            <Logo />
          </div>
        </div>
      </Item>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Marquee slogan
 * ------------------------------------------------------------------ */
function Marquee() {
  const words = [
    ["LOCATE", "g"],
    ["·", "d"],
    ["MEASURE", "w"],
    ["·", "d"],
    ["CONTEXTUALISE", "g"],
    ["·", "d"],
    ["NO WALLET", "w"],
    ["·", "d"],
    ["NO KEYS", "g"],
    ["·", "d"],
    ["PUBLIC CHAIN ONLY", "w"],
    ["·", "d"],
  ];
  const line = [...words, ...words];
  return (
    <div className="marquee" aria-hidden>
      <div className="track">
        {line.map(([t, c], i) => (
          <span key={i} className={c === "g" ? "g" : c === "d" ? "dot" : ""}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Big stat strip
 * ------------------------------------------------------------------ */
function Stats() {
  return (
    <Reveal className="section" as="section" id="radar">
      <div className="section-head">
        <div>
          <Item className="eyebrow" variants={fadeUp}>
            <span className="num">01</span> The read
          </Item>
          <motion.h2 variants={fadeUp} style={{ margin: 0 }}>
            Numbers you can actually <em>see.</em>
          </motion.h2>
        </div>
        <Item className="aside" variants={fadeUp}>
          Every figure is derived from direct swap reads and factory events —
          sampled, filtered for dust, and shown big enough to trust at a glance.
        </Item>
      </div>
      <Item className="stats" variants={fadeUp}>
        <div className="stat">
          <div className="big">
            <CountUp to={4663} />
          </div>
          <div className="cap">Robinhood Chain</div>
          <div className="sub">network id</div>
        </div>
        <div className="stat">
          <div className="big">
            <CountUp to={20} />
            <span className="u">sec</span>
          </div>
          <div className="cap">Live wire poll</div>
          <div className="sub">visitor-assisted</div>
        </div>
        <div className="stat">
          <div className="big">
            ≥<CountUp to={0.0005} decimals={4} />
          </div>
          <div className="cap">Dust threshold</div>
          <div className="sub">weth / swap</div>
        </div>
        <div className="stat">
          <div className="big">
            <CountUp to={100} suffix="%" />
          </div>
          <div className="cap">Public records</div>
          <div className="sub">no account · no keys</div>
        </div>
      </Item>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Capability modules (the nine)
 * ------------------------------------------------------------------ */
const MODULES = [
  {
    n: "01",
    Icon: Scanning,
    title: "Launch Command Center",
    body: "A factory wire that surfaces every new Pons launch the moment it deploys — observed, flowing and unscanned, side by side.",
    tag: "Live",
  },
  {
    n: "02",
    Icon: ScanQrCode,
    title: "Token Radar",
    body: "Paste any ERC-20 address and pull launch time, factory, pool status and the filtered swap tape in one scan.",
    tag: "Live",
  },
  {
    n: "03",
    Icon: Activity,
    title: "Launch Pulse",
    body: "The last fifteen minutes of sampled flow, condensed into a single readable pulse with deploy and pool state.",
    tag: "Live",
  },
  {
    n: "04",
    Icon: GraphUp,
    title: "Live DEX Chart",
    body: "Implied pool price from direct WETH swap reads, auto-refreshed every 30 seconds across 30M / 1H / ALL.",
    tag: "Live",
  },
  {
    n: "05",
    Icon: DataTransferBoth,
    title: "Live Flow",
    body: "Buys, sells, unique buyers and trades-per-hour above the dust threshold — the shape of demand in real time.",
    tag: "Live",
  },
  {
    n: "06",
    Icon: Network,
    title: "Wallet Map",
    body: "Buyer cluster context: the newest meaningful buys enriched into a map of who is actually stepping in.",
    tag: "Live",
  },
  {
    n: "07",
    Icon: Group,
    title: "Distribution",
    body: "Who holds the supply — top-10 concentration, pool-held, burned and creator-held, with pool and burn excluded.",
    tag: "Live",
  },
  {
    n: "08",
    Icon: GitFork,
    title: "Creator Trail",
    body: "The original creator wallet, its recent factory launches and current holding as a share of total supply.",
    tag: "Live",
  },
  {
    n: "09",
    Icon: Reports,
    title: "Recent Trade Tape",
    body: "The latest non-dust pool swaps — time, side, wallet, context, WETH and token amount, decoded straight from chain.",
    tag: "Live",
  },
];

function Modules() {
  return (
    <Reveal className="section" as="section">
      <div className="section-head">
        <div>
          <Item className="eyebrow" variants={fadeUp}>
            <span className="num">02</span> Nine instruments
          </Item>
          <motion.h2 variants={fadeUp} style={{ margin: 0 }}>
            One terminal, nine ways to <em>read a launch.</em>
          </motion.h2>
        </div>
        <Item className="aside" variants={fadeUp}>
          Each panel answers a different question about a token — from the first
          factory event to the freshest decoded swap.
        </Item>
      </div>
      <div className="modules">
        {MODULES.map((m) => (
          <Item
            key={m.n}
            className="module"
            variants={fadeUp}
            onMouseMove={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              const r = el.getBoundingClientRect();
              el.style.setProperty("--lx", `${e.clientX - r.left}px`);
              el.style.setProperty("--ly", `${e.clientY - r.top}px`);
            }}
          >
            <div className="mnum">{m.n}</div>
            <div className="micon">
              <m.Icon width={26} height={26} />
            </div>
            <h3>{m.title}</h3>
            <p>{m.body}</p>
            <span className="tag">
              <span className="pulse-dot" /> {m.tag}
            </span>
          </Item>
        ))}
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Live launch wire (real data, graceful fallback)
 * ------------------------------------------------------------------ */
type TokenInfo = {
  name: string;
  symbol: string;
  imageUrl: string;
  address?: string;
  priceUsd: string | null;
  change24h: number | null;
};

function tokenImg(url: string) {
  return `/api/token-image?url=${encodeURIComponent(url)}`;
}
function identiconUri(seed: string): string {
  let s = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    s ^= seed.charCodeAt(i);
    s = Math.imul(s, 16777619) >>> 0;
  }
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 0xffffffff;
  };
  const hue = Math.floor(rnd() * 60) + 110; // greens
  const bg = `hsl(${hue} 42% 82%)`;
  const fg = `hsl(${hue} 44% 34%)`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='${bg}'/><circle cx='32' cy='32' r='${
    12 + Math.floor(rnd() * 10)
  }' fill='${fg}'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function WireThumb({ token }: { token: TokenInfo }) {
  const [broken, setBroken] = useState(false);
  const seed = token.address || `${token.symbol}${token.name}`;
  if (!token.imageUrl || broken) {
    return (
      <div
        className="wire-thumb"
        style={{ backgroundImage: `url("${identiconUri(seed)}")`, backgroundSize: "cover" }}
        aria-label={token.name}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      className="wire-thumb"
      src={tokenImg(token.imageUrl)}
      alt={token.name}
      onError={() => setBroken(true)}
    />
  );
}

function shortAddr(a?: string) {
  if (!a) return "unindexed";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function LaunchWire() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/tokens?mode=new&window=6h");
        const data = await res.json();
        if (!alive) return;
        const list: TokenInfo[] = Array.isArray(data.tokens) ? data.tokens.slice(0, 6) : [];
        setTokens(list);
        setState(list.length ? "ready" : "empty");
      } catch {
        if (alive) setState("empty");
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Reveal className="section" as="section" id="wire">
      <div className="section-head">
        <div>
          <Item className="eyebrow" variants={fadeUp}>
            <span className="num">03</span> Launch wire
          </Item>
          <motion.h2 variants={fadeUp} style={{ margin: 0 }}>
            The freshest launches, <em>as they land.</em>
          </motion.h2>
        </div>
        <Item className="aside" variants={fadeUp}>
          A live sample of new Robinhood Chain pools read from public indexers.
          Tap any row inside the radar to run a full scan.
        </Item>
      </div>

      <Item className="wire" variants={fadeUp}>
        <div className="wire-top">
          <span className="l">
            <Flash width={19} height={19} style={{ color: "var(--green-600)" }} /> New pools ·
            last 6h
          </span>
          <span className="wire-status">
            <span className="pulse-dot" /> {state === "loading" ? "syncing" : "live · 30s"}
          </span>
        </div>
        <div className="wire-list">
          {state === "loading" &&
            Array.from({ length: 6 }).map((_, i) => (
              <div className="wire-row" key={i}>
                <div className="wire-skel" />
                <div className="wire-info">
                  <div className="wire-skel line" />
                  <div className="wire-skel line sm" />
                </div>
              </div>
            ))}

          {state === "empty" && (
            <div className="wire-empty">
              No fresh non-dust pools in this window right now. The wire refreshes
              every 30 seconds — new launches appear here automatically.
            </div>
          )}

          {state === "ready" &&
            tokens.map((t, i) => (
              <div className="wire-row" key={`${t.symbol}-${i}`}>
                <WireThumb token={t} />
                <div className="wire-info">
                  <div className="wire-name">
                    {t.name}
                    {t.symbol && <span>{t.symbol}</span>}
                  </div>
                  <div className="wire-addr">{shortAddr(t.address)}</div>
                </div>
                <div className="wire-price">
                  {t.priceUsd ? (
                    <div className="p">${Number(t.priceUsd).toPrecision(3)}</div>
                  ) : (
                    <div className="p">—</div>
                  )}
                  {t.change24h != null && (
                    <div className={`wire-chg ${t.change24h >= 0 ? "up" : "down"}`}>
                      {t.change24h >= 0 ? "▲" : "▼"} {Math.abs(t.change24h).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Item>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Methodology
 * ------------------------------------------------------------------ */
const STEPS = [
  {
    n: "1",
    Icon: Compass,
    title: "Locate",
    body: "Factory events and creation records pin down exactly when and where a token was launched — no guessing, no indexer lag.",
  },
  {
    n: "2",
    Icon: StatsUpSquare,
    title: "Measure",
    body: "Price charts and flow are built from direct swap reads above a dust threshold, so noise never masquerades as demand.",
  },
  {
    n: "3",
    Icon: Fingerprint,
    title: "Contextualise",
    body: "Buyer traits, holder distribution and creator history — surfaced as context, never as a score that tells you what to think.",
  },
];

function Method() {
  return (
    <Reveal className="section" as="section" id="method">
      <div className="section-head">
        <div>
          <Item className="eyebrow" variants={fadeUp}>
            <span className="num">04</span> Method
          </Item>
          <motion.h2 variants={fadeUp} style={{ margin: 0 }}>
            Three moves, <em>read from the chain.</em>
          </motion.h2>
        </div>
        <Item className="aside" variants={fadeUp}>
          The whole terminal runs on one honest loop — locate the launch, measure
          the flow, add context without opinion.
        </Item>
      </div>
      <div className="steps">
        {STEPS.map((s) => (
          <Item key={s.n} className="step" variants={fadeUp}>
            <div className="sn">{s.n}</div>
            <div className="micon" style={{ marginTop: 18 }}>
              <s.Icon width={26} height={26} />
            </div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </Item>
        ))}
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Build status
 * ------------------------------------------------------------------ */
const BUILD = [
  { t: "Live factory wire and token scans", s: "Live", verify: false },
  { t: "Launch pulse, implied price chart and trade tape", s: "Live", verify: false },
  { t: "Wallet map, creator trail and holder distribution", s: "Live", verify: false },
  { t: "Shareable scans and device-local watchlist", s: "Live", verify: false },
  { t: "Scheduler and background scan queue", s: "Verify", verify: true },
];

function Build() {
  return (
    <Reveal className="section" as="section" id="build">
      <div className="section-head">
        <div>
          <Item className="eyebrow" variants={fadeUp}>
            <span className="num">05</span> Build log
          </Item>
          <motion.h2 variants={fadeUp} style={{ margin: 0 }}>
            Shipped, and <em>honest about it.</em>
          </motion.h2>
        </div>
        <Item className="aside" variants={fadeUp}>
          What is live is marked live. What still needs verifying says so — no
          roadmap theatre.
        </Item>
      </div>
      <Item className="build" variants={fadeUp}>
        {BUILD.map((b, i) => (
          <div className="build-row" key={i}>
            <span className={`build-check${b.verify ? " verify" : ""}`}>
              {b.verify ? (
                <WarningTriangle width={18} height={18} />
              ) : (
                <CheckCircle width={18} height={18} />
              )}
            </span>
            <span className="bt">{b.t}</span>
            <span className={`bs${b.verify ? " verify" : ""}`}>{b.s.toUpperCase()}</span>
          </div>
        ))}
      </Item>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Privacy / watchlist
 * ------------------------------------------------------------------ */
const PRIV = [
  {
    Icon: Wallet,
    t: "No wallet, ever",
    b: "The terminal never asks you to connect a wallet or sign anything. It only reads public chain records.",
  },
  {
    Icon: Lock,
    t: "Device-local watchlist",
    b: "Your radar shelf is saved only in this browser. No account, no cloud profile, nothing to leak.",
  },
  {
    Icon: EyeClosed,
    t: "Context, not scores",
    b: "You get the raw on-chain traits and decide for yourself. We don't rate tokens or nudge trades.",
  },
];

function Privacy() {
  return (
    <Reveal className="section" as="section">
      <div className="section-head">
        <div>
          <Item className="eyebrow" variants={fadeUp}>
            <span className="num">06</span> Your terms
          </Item>
          <motion.h2 variants={fadeUp} style={{ margin: 0 }}>
            Read-only, and <em>on your side.</em>
          </motion.h2>
        </div>
      </div>
      <div className="privacy">
        {PRIV.map((p, i) => (
          <Item key={i} className="pcard" variants={fadeUp}>
            <div className="pi">
              <p.Icon width={24} height={24} />
            </div>
            <h4>{p.t}</h4>
            <p>{p.b}</p>
          </Item>
        ))}
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  CTA
 * ------------------------------------------------------------------ */
function Cta() {
  return (
    <Reveal className="cta" as="section">
      <Item className="eyebrow" variants={fadeUp}>
        <span className="pulse-dot" /> Ready when you are
      </Item>
      <motion.h2 variants={fadeUp}>
        Stop reading the hype. <em>Start reading the flow.</em>
      </motion.h2>
      <Item variants={fadeUp}>
        <p>
          Point the radar at any Robinhood Chain launch and watch the pools,
          wallets and creator trail resolve — live, transparent, and entirely from
          public records.
        </p>
      </Item>
      <Item className="cta-actions" variants={fadeUp}>
        <a className="btn honey" href="#wire" data-hot>
          Watch the wire <ArrowRight width={17} height={17} />
        </a>
        <a className="btn ghost" href="#radar" data-hot>
          Scan a token <ScanQrCode width={17} height={17} />
        </a>
      </Item>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Footer
 * ------------------------------------------------------------------ */
function Footer() {
  return (
    <Reveal className="footer" as="footer">
      <Item variants={fadeUp}>
        <div className="fbrand">
          <Logo />
          <span className="name">Hood Radar</span>
        </div>
        <p className="disc">
          Independent research software. It does not custody assets, execute
          trades, or provide investment advice. Data is read from public Robinhood
          Chain records and may be incomplete or delayed. Not affiliated with Pons
          or Robinhood.
        </p>
      </Item>
      <Item className="flinks" variants={fadeUp}>
        <div className="col">
          <span className="ct">Terminal</span>
          <a href="#wire">Launch wire</a>
          <a href="#radar">Token radar</a>
          <a href="#method">Method</a>
        </div>
        <div className="col">
          <span className="ct">More</span>
          <a href="#build">Build log</a>
          <a href="#" data-hot>
            Support &amp; safety
          </a>
          <a href="#top" data-hot>
            Back to top ↑
          </a>
        </div>
      </Item>
      <Item className="fbot" variants={fadeUp}>
        <span>© {new Date().getFullYear()} Hood Radar · Public-chain research</span>
        <span style={{ display: "inline-flex", gap: 14 }}>
          <a href="#" data-hot style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Github width={14} height={14} /> Source
          </a>
          <a href="#" data-hot style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            Open Pons <OpenNewWindow width={13} height={13} />
          </a>
        </span>
      </Item>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ *
 *  Page
 * ------------------------------------------------------------------ */
export default function Page() {
  return (
    <>
      <BgFX />
      <CursorFX />
      <span id="top" />
      <Nav />
      <div className="shell">
        <Hero />
        <Marquee />
        <Stats />
        <Modules />
        <LaunchWire />
        <Method />
        <Build />
        <Privacy />
        <Cta />
        <Footer />
      </div>
    </>
  );
}
