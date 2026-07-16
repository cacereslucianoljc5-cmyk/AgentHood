"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  animate,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Running,
  Cpu,
  Sparks,
  Wallet,
  Trophy,
  Rocket,
  Network,
  Community,
  DatabaseScript,
  Database,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Packages,
  Cube,
  Globe,
  Activity,
  GraphUp,
  Coins,
  Group as GroupIcon,
  Twitter,
  Discord,
  Telegram,
  Youtube,
  Instagram,
  Linkedin,
  CheckCircle,
  Flash,
  Atom,
  Cloud,
  Wrench,
  Medal,
} from "iconoir-react";

/* ============================================================
   Motion primitives — every element reveals on enter, staggered.
   ============================================================ */
const easeOut = [0.22, 1, 0.36, 1] as const;

const groupV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const itemV: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: easeOut },
  },
};

/** Container that staggers its children into view, one by one. */
function Group({
  children,
  className,
  as = "div",
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "ul";
  amount?: number;
}) {
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      variants={groupV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </M>
  );
}

/** A single element that fades + rises when its Group enters. */
function Item({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "h1" | "h2" | "h3" | "p" | "span" | "a";
}) {
  const M = motion[as] as typeof motion.div;
  return (
    <M className={className} variants={itemV}>
      {children}
    </M>
  );
}

/* ---------- Animated count-up for the big numbers ---------- */
function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.8,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  const [txt, setTxt] = useState("0");

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setTxt(to.toFixed(decimals));
      return;
    }
    const controls = animate(mv, to, {
      duration,
      ease: easeOut,
      onUpdate: (v) => setTxt(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, to, decimals, duration, mv, reduce]);

  return (
    <span ref={ref} className="num">
      {prefix}
      {txt}
      <span className="suf">{suffix}</span>
    </span>
  );
}

/* ---------- Custom soft cursor ---------- */
function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      const t = e.target as HTMLElement;
      const hot = !!t.closest("a, button, [data-cursor]");
      ring.classList.toggle("hover", hot);
    };
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}

/* ---------- Ambient animated background ---------- */
function Background() {
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--sy", `${window.scrollY}px`);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="bgfx" aria-hidden>
      <div className="orb o1" />
      <div className="orb o2" />
      <div className="orb o3" />
      <div className="dots" />
    </div>
  );
}

/* ---------- Brand mark ---------- */
function LogoMark({ className = "mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#223c2d" />
      <g stroke="#b4cf48" strokeWidth="2.6" strokeLinecap="round">
        <path d="M32 22 L17 38 M32 22 L47 38 M20 42 L44 42" />
      </g>
      <circle cx="32" cy="18" r="4.2" fill="#c7e05f" />
      <circle cx="17" cy="42" r="4.2" fill="#b4cf48" />
      <circle cx="47" cy="42" r="4.2" fill="#b4cf48" />
    </svg>
  );
}

/* ============================================================
   Sections
   ============================================================ */
function Nav() {
  return (
    <motion.nav
      className="nav"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easeOut }}
    >
      <div className="nav-inner">
        <a className="brand" href="#top">
          <LogoMark />
          <span className="bname">
            Humanoid<b>Network</b>
          </span>
        </a>
        <div className="nav-links">
          <a href="#product">Product</a>
          <a href="#technology">Technology</a>
          <a href="#points">Points</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#team">Team</a>
        </div>
        <div className="nav-cta">
          <a className="btn btn-ghost sm ghost-hide" href="#points">
            Docs
          </a>
          <a className="btn btn-primary sm" href="#points">
            <Wallet width={17} height={17} /> Launch App
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

const HERO_SATS = [
  { Icon: Running, s: { top: "2%", left: "44%" } },
  { Icon: Cpu, s: { top: "26%", right: "-2%" } },
  { Icon: DatabaseScript, s: { bottom: "6%", right: "12%" } },
  { Icon: ShieldCheck, s: { bottom: "-2%", left: "40%" } },
  { Icon: Globe, s: { bottom: "16%", left: "-3%" } },
  { Icon: Community, s: { top: "22%", left: "0%" } },
];

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="hero wrap" id="top">
      <div>
        <motion.span
          className="eyebrow"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: easeOut }}
        >
          <span className="spark" /> Pre-TGE live · Season 1 points farming
        </motion.span>

        <Group>
          <h1>
            <Item as="span" className="line">
              Any Robot.
            </Item>
            <Item as="span" className="line">
              Any Task.
            </Item>
            <Item as="span" className="line grad-text">
              One Network.
            </Item>
          </h1>
          <Item as="p" className="sub">
            The open <b>robotics data &amp; skill hub</b> — a physics-validated
            motion marketplace that lets robots communicate, learn and evolve
            together. The operating layer for embodied AI.
          </Item>
          <Item className="hero-actions">
            <a className="btn btn-primary" href="#points">
              <Sparks width={18} height={18} /> Start earning points
            </a>
            <a className="btn btn-ghost" href="#product">
              Explore the network <ArrowRight width={17} height={17} />
            </a>
          </Item>
          <Item className="hero-note">
            <span className="av">
              <span />
              <span />
              <span />
              <span />
            </span>
            Join contributors farming HAN ahead of the Q1 2026 TGE
          </Item>
        </Group>
      </div>

      <div className="hero-visual">
        <motion.div
          className="node-orb"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.9, ease: easeOut }}
        >
          <div className="glow-blob" />
          <motion.div
            className="ring"
            animate={reduce ? {} : { rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="ring r2"
            animate={reduce ? {} : { rotate: -360 }}
            transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
          />
          <div className="ring r3" />
          <div className="core">
            <Network width={54} height={54} />
          </div>
          {HERO_SATS.map(({ Icon, s }, i) => (
            <motion.div
              key={i}
              className="sat"
              style={s}
              animate={reduce ? {} : { y: [0, -9, 0] }}
              transition={{
                duration: 4 + i * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              <Icon width={22} height={22} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const STATS = [
  { to: 85, suffix: "M", lbl: "Global worker gap projected by 2030" },
  { to: 24, prefix: "$", suffix: "T", lbl: "Labor automation market by value" },
  { to: 100, suffix: "%", lbl: "Motions physics-validated on-chain" },
  { to: 2026, lbl: "HAN Token Generation Event · Q1", plain: true },
];

function Stats() {
  return (
    <Group className="stats wrap" amount={0.3}>
      {STATS.map((s, i) => (
        <Item className="stat" key={i}>
          {s.plain ? (
            <span className="num">Q1&nbsp;{s.to}</span>
          ) : (
            <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
          )}
          <div className="lbl">{s.lbl}</div>
        </Item>
      ))}
    </Group>
  );
}

const INDUSTRIES = [
  { Icon: Packages, t: "Logistics" },
  { Icon: Wrench, t: "Manufacturing" },
  { Icon: Community, t: "Elder care" },
  { Icon: Building, t: "Construction" },
  { Icon: Cube, t: "Home services" },
];

function Marquee() {
  const row = [...INDUSTRIES, ...INDUSTRIES];
  return (
    <div className="wrap">
      <motion.div
        className="marquee"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="marquee-track">
          {row.map(({ Icon, t }, i) => (
            <span className="marquee-item" key={i}>
              <Icon width={26} height={26} /> {t}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Features() {
  return (
    <section className="block wrap" id="product">
      <div className="block-head">
        <Group>
          <Item as="span" className="eyebrow">
            <span className="spark" /> The product
          </Item>
          <Item as="h2" className="section-title" >
            The <span className="grad-text">Hugging Face</span> for embodied AI
          </Item>
          <Item as="p" className="section-sub">
            Hardware raced ahead; software never caught up. Humanoid Network is
            the connective tissue — standardizing motion, control and
            intelligence so any developer can build, deploy and monetize skills
            across any robot.
          </Item>
        </Group>
      </div>

      <Group className="bento" amount={0.1}>
        <Item className="card feature-lg">
          <div className="ic">
            <DatabaseScript width={26} height={26} />
          </div>
          <div className="big-word">Motion data marketplace</div>
          <p>
            Contributors upload task videos, interaction episodes and
            robot-ready skill artifacts. Every dataset is verified, licensable
            and streamable to enterprises training Physical AI models.
          </p>
        </Item>

        <Item className="card span3">
          <div className="ic">
            <ShieldCheck width={26} height={26} />
          </div>
          <h3>Hydra physics validation</h3>
          <p>
            Each motion is replayed against real physics before it counts —
            no hallucinated data, only trajectories that hold up in the world.
          </p>
        </Item>

        <Item className="card span3">
          <div className="ic">
            <Cpu width={26} height={26} />
          </div>
          <h3>Universal developer layer</h3>
          <p>
            Standardized interfaces for motion, control and intelligence — the
            same skill runs across different robotic systems, like Android for
            embodiment.
          </p>
        </Item>

        <Item className="card span2">
          <div className="ic">
            <Packages width={26} height={26} />
          </div>
          <h3>Skill artifacts</h3>
          <p>Package a capability once, distribute it everywhere.</p>
        </Item>

        <Item className="card span2">
          <div className="ic">
            <Cloud width={26} height={26} />
          </div>
          <h3>Streaming subscriptions</h3>
          <p>Fresh verified data, delivered continuously to model teams.</p>
        </Item>

        <Item className="card span2">
          <div className="ic">
            <Building width={26} height={26} />
          </div>
          <h3>Enterprise deployment</h3>
          <p>Private dataset pilots and benchmark regressions at scale.</p>
        </Item>
      </Group>
    </section>
  );
}

const POINTS = [
  { Icon: Twitter, t: "Connect X", d: "Link your account", p: "+30" },
  { Icon: Telegram, t: "Join Telegram", d: "Enter the community", p: "+25" },
  { Icon: Discord, t: "Join Discord", d: "Say hello in chat", p: "+25" },
  { Icon: DatabaseScript, t: "Upload a model", d: "HuggingFace · max 3/day", p: "+12" },
  { Icon: Database, t: "Upload a dataset", d: "HuggingFace · max 3/day", p: "+15" },
  { Icon: GroupIcon, t: "Refer a friend", d: "Best rate on the board", p: "+150" },
  { Icon: Flash, t: "Daily streak", d: "Log in, keep the combo", p: "+∞" },
  { Icon: Medal, t: "Climb the leaderboard", d: "Consistency compounds", p: "★" },
];

function Points() {
  return (
    <section className="block wrap" id="points">
      <div className="block-head center">
        <Group>
          <Item as="span" className="eyebrow">
            <span className="spark" /> Season 1 · farm now
          </Item>
          <Item as="h2" className="section-title">
            Earn points today, <br />
            <span className="grad-text">claim HAN at TGE</span>
          </Item>
          <Item as="p" className="section-sub">
            The Pre-Launch app runs until the Q1 2026 Token Generation Event.
            Points convert to HAN allocations — consistent contributors take the
            leaderboard.
          </Item>
        </Group>
      </div>

      <Group className="points" amount={0.15}>
        {POINTS.map((x, i) => (
          <Item className="point-card" key={i}>
            <div className="phead">
              <div className="pic">
                <x.Icon width={22} height={22} />
              </div>
              <span className="pts">{x.p}</span>
            </div>
            <h4>{x.t}</h4>
            <p>{x.d}</p>
          </Item>
        ))}
      </Group>
    </section>
  );
}

const HYDRA_ITEMS = [
  {
    Icon: Activity,
    t: "Replay against real physics",
    d: "Every submitted trajectory is simulated on the Hydra stack before it can be licensed.",
  },
  {
    Icon: GraphUp,
    t: "Benchmark regressions",
    d: "Skills are scored continuously so quality only moves in one direction.",
  },
  {
    Icon: Atom,
    t: "Verified, licensable data",
    d: "Only motions that survive validation enter the marketplace and earn rewards.",
  },
];

function Technology() {
  return (
    <section className="block wrap" id="technology">
      <div className="tech">
        <Group>
          <Item as="span" className="eyebrow">
            <span className="spark" /> Technology
          </Item>
          <Item as="h2" className="section-title">
            Validated by physics,<br />not vibes.
          </Item>
          <Item as="p" className="section-sub">
            The Hydra validation stack is what makes Humanoid Network data
            trustworthy — a physics engine that separates motion that works from
            motion that merely looks right.
          </Item>
          <div className="tech-list">
            {HYDRA_ITEMS.map((x, i) => (
              <Item className="tech-item" key={i}>
                <div className="tic">
                  <x.Icon width={17} height={17} />
                </div>
                <div>
                  <h4>{x.t}</h4>
                  <p>{x.d}</p>
                </div>
              </Item>
            ))}
          </div>
        </Group>

        <motion.div
          className="hydra"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: easeOut }}
        >
          <span className="pulse" style={{ animationDelay: "0s" }} />
          <span className="pulse" style={{ animationDelay: "1.1s" }} />
          <span className="pulse" style={{ animationDelay: "2.2s" }} />
          <div className="hcore">
            <div className="hn">HYDRA</div>
            <div className="hl">validation stack</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const PHASES = [
  {
    tag: "Months 0–3",
    n: "01",
    live: true,
    t: "Capture",
    items: ["MVP capture", "Missions & tasks", "Basic verification"],
  },
  {
    tag: "Months 3–6",
    n: "02",
    t: "Pilots",
    items: ["Private dataset pilots", "Benchmark regressions"],
  },
  {
    tag: "Months 6–12",
    n: "03",
    t: "Scale",
    items: ["Streaming subscriptions", "Enterprise deployments", "Scaling supply"],
  },
  {
    tag: "Months 12+",
    n: "04",
    t: "Distribute",
    items: ["Standardized skill artifacts", "Developer distribution"],
  },
];

function Roadmap() {
  return (
    <section className="block wrap" id="roadmap">
      <div className="block-head">
        <Group>
          <Item as="span" className="eyebrow">
            <span className="spark" /> Roadmap
          </Item>
          <Item as="h2" className="section-title">
            From capture to a global{" "}
            <span className="grad-text">skill economy</span>
          </Item>
        </Group>
      </div>
      <Group className="roadmap" amount={0.15}>
        {PHASES.map((p, i) => (
          <Item className={`phase${p.live ? " live" : ""}`} key={i}>
            <span className="pdot" />
            <div className="ptag">{p.tag}</div>
            <div className="pnum">{p.n}</div>
            <h4>{p.t}</h4>
            <ul>
              {p.items.map((it) => (
                <li key={it}>
                  <CheckCircle width={16} height={16} /> {it}
                </li>
              ))}
            </ul>
          </Item>
        ))}
      </Group>
    </section>
  );
}

const TEAM = [
  { n: "Robert Vukosa", r: "CEO" },
  { n: "Noshaba Cheema", r: "CTO" },
  { n: "Marnik Battryn", r: "COO" },
  { n: "Imogen Green", r: "CMO" },
  { n: "Dylan Lee", r: "Head of Ecosystem" },
];
const ADVISORS = [
  ["Mamoon Khalid", "AI / robotics strategy"],
  ["David Lake", "Decentralized AI"],
  ["Mark DeSantis", "Deep-tech scaling"],
  ["Youngsook Park", "Robotics partnerships"],
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

function Team() {
  return (
    <section className="block wrap" id="team">
      <div className="block-head center">
        <Group>
          <Item as="span" className="eyebrow">
            <span className="spark" /> Builders
          </Item>
          <Item as="h2" className="section-title">
            The team behind the network
          </Item>
        </Group>
      </div>
      <Group className="team-grid" amount={0.15}>
        {TEAM.map((m) => (
          <Item className="member" key={m.n}>
            <div className="ava">{initials(m.n)}</div>
            <div className="mn">{m.n}</div>
            <div className="mr">{m.r}</div>
          </Item>
        ))}
      </Group>
      <Group className="advisors" amount={0.2}>
        {ADVISORS.map(([n, r]) => (
          <Item as="span" className="advisor" key={n}>
            <b>{n}</b> · {r}
          </Item>
        ))}
      </Group>
    </section>
  );
}

const TOKEN_FACTS = [
  { n: "HAN", l: "Ticker" },
  { n: "Utility", l: "Token type" },
  { n: "Q1 2026", l: "Generation event" },
  { n: "Points", l: "Convert at TGE" },
];

function TokenBand() {
  return (
    <section className="block wrap">
      <div className="token-band">
        <Group>
          <Item as="span" className="eyebrow" >
            <span className="spark" /> The HAN token
          </Item>
          <Item as="h2" className="section-title">
            Own a piece of the robotics operating layer
          </Item>
          <Item as="p" className="section-sub">
            HAN is the utility token that coordinates data, validation and
            rewards across the network. Points farmed today convert to HAN
            allocations at the Token Generation Event.
          </Item>
          <Item className="hero-actions">
            <a className="btn btn-primary" href="#points">
              <Coins width={18} height={18} /> Farm points now
            </a>
          </Item>
        </Group>
        <Group className="token-facts" amount={0.3}>
          {TOKEN_FACTS.map((t) => (
            <Item className="tf" key={t.l}>
              <div className="tfn">{t.n}</div>
              <div className="tfl">{t.l}</div>
            </Item>
          ))}
        </Group>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="cta wrap">
      <Group>
        <Item as="h2">
          Any robot. Any task.
          <br />
          <span className="grad-text">One network.</span>
        </Item>
        <Item as="p">
          Start farming points for the HAN airdrop and help build the software
          layer for the entire robotics industry.
        </Item>
        <Item className="cta-actions">
          <a className="btn btn-primary" href="#points">
            <Rocket width={18} height={18} /> Launch the app
          </a>
          <a className="btn btn-dark" href="#technology">
            Read the docs <ArrowUpRight width={17} height={17} />
          </a>
        </Item>
      </Group>
    </section>
  );
}

const SOCIALS = [
  { Icon: Twitter, href: "https://x.com/HumanoidNetwork" },
  { Icon: Discord, href: "#" },
  { Icon: Telegram, href: "#" },
  { Icon: Youtube, href: "#" },
  { Icon: Instagram, href: "#" },
  { Icon: Linkedin, href: "#" },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-inner">
          <div className="fabout">
            <a className="brand" href="#top">
              <LogoMark />
              <span className="bname">
                Humanoid<b>Network</b>
              </span>
            </a>
            <p>
              Any Robot. Any Task. One Network. Building the open robotics data
              and skill hub for the age of embodied AI.
            </p>
            <div className="socials">
              {SOCIALS.map(({ Icon, href }, i) => (
                <a key={i} href={href} aria-label="social" target="_blank" rel="noreferrer">
                  <Icon width={20} height={20} />
                </a>
              ))}
            </div>
          </div>
          <div className="fcol">
            <h5>Network</h5>
            <a href="#product">Product</a>
            <a href="#technology">Technology</a>
            <a href="#points">Points</a>
            <a href="#roadmap">Roadmap</a>
          </div>
          <div className="fcol">
            <h5>Token</h5>
            <a href="#points">Airdrop</a>
            <a href="#team">Team</a>
            <a href="#top">Tokenomics</a>
            <a href="#points">Leaderboard</a>
          </div>
          <div className="fcol">
            <h5>Resources</h5>
            <a href="#">Docs</a>
            <a href="#">FAQ</a>
            <a href="#">Brand</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="foot-legal">
          <span>© 2026 Humanoid Network. All rights reserved.</span>
          <span>HAN · Pre-TGE · Season 1</span>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <>
      <Cursor />
      <Background />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Marquee />
        <Features />
        <Points />
        <Technology />
        <Roadmap />
        <Team />
        <TokenBand />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
