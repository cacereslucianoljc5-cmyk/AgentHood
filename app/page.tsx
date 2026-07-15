"use client";

import { useState } from "react";
import {
  ArrowArchery,
  Wallet,
  NavArrowRight,
  CoinsSwap,
  PiggyBank,
  Gift,
  Hourglass,
  Trophy,
  Flash,
  ShieldCheck,
  Percentage,
  DataTransferBoth,
  Plus,
  Twitter,
  Telegram,
  Discord,
} from "iconoir-react";
import {
  Stagger,
  Item,
  FadeUp,
  NumberTicker,
  Countdown,
  motion,
} from "./components/motion";

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */
const TICKER = [
  "Robinhood Chain · EVM L2",
  "$HOOD",
  "Rob the rich — feed the degens",
  "10-minute rounds",
  "Pay with ETH · USDC · USDT",
  "128.47 ETH distributed",
  "One ticket per wallet",
];

const STEPS = [
  {
    icon: CoinsSwap,
    t: "Trade",
    d: "Buy or sell $HOOD on Robinhood Chain. Every single trade carries a flat 10% tax.",
  },
  {
    icon: PiggyBank,
    t: "The pot fills",
    d: "8% of that tax flows straight into the ETH prize pot. 2% seeds the very next round.",
  },
  {
    icon: Gift,
    t: "Get a ticket",
    d: "Any buy worth ≥ ~$30 earns you exactly one ticket. One per wallet — no matter the size.",
  },
  {
    icon: Hourglass,
    t: "10 minutes",
    d: "Rounds close on L2 block time — roughly every ten minutes, no keeper needed.",
  },
  {
    icon: Trophy,
    t: "Someone robs it",
    d: "A random ticket-holder wins the entire pot. The whale and the ant share the same odds.",
  },
];

const WINNERS = [
  { a: "0xA3f9…9f2c", r: "Round #42", t: "3m ago", w: "3.8014" },
  { a: "0x71c4…b0a1", r: "Round #41", t: "14m ago", w: "2.9330" },
  { a: "0xC90e…44de", r: "Round #40", t: "25m ago", w: "5.1207" },
  { a: "0x2f8b…77ab", r: "Round #39", t: "36m ago", w: "1.7742" },
  { a: "0x8e13…12c0", r: "Round #38", t: "48m ago", w: "4.4090" },
];

const ASSETS = [
  { s: "Ξ", c: "#111", n: "Robinhood ETH", d: "Native gas + prize asset", f: "~$0.002 fee" },
  { s: "$", c: "#2775CA", n: "USDC", d: "Robinhood Chain bridged", f: "~$0.002 fee" },
  { s: "₮", c: "#26A17B", n: "USDT", d: "Robinhood Chain bridged", f: "~$0.002 fee" },
];

const PRESETS = ["0.05", "0.10", "0.50"];
const PAY = [
  { k: "ETH", c: "#111" },
  { k: "USDC", c: "#2775CA" },
  { k: "USDT", c: "#26A17B" },
];

const FAQS = [
  {
    q: "How is the winner chosen?",
    a: "When a round closes on L2 block time, one address is drawn at random from every wallet holding a ticket that round. The full pot is sent to that wallet in the same transaction — no admin, no claim step.",
  },
  {
    q: "What does “one ticket per wallet” mean?",
    a: "Every wallet that made a qualifying buy (≥ ~$30) in the current round holds exactly one ticket. Buying more never buys more odds — a 40 ETH whale and a $30 degen have identical chances. It keeps the game fair and fun.",
  },
  {
    q: "Which assets can I pay with?",
    a: "Only Robinhood-Chain assets: Robinhood ETH, USDC and USDT. That is deliberate — settling on this EVM L2 is the cheapest way to play, and it keeps the whole pot denominated on one chain.",
  },
  {
    q: "What are the fees like?",
    a: "Robinhood Chain is an Ethereum L2, so a buy costs a fraction of a cent in gas. The only meaningful cost is the 10% trade tax — and that goes to players, not to us.",
  },
  {
    q: "When does a round end?",
    a: "Roughly every 10 minutes, tied to L2 block height rather than a wall clock. The live timer on this page counts down to the next draw.",
  },
];

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */
export default function Page() {
  const [amount, setAmount] = useState("0.10");
  const [token, setToken] = useState("ETH");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      {/* ---------------- ticker ---------------- */}
      <div className="ticker" aria-hidden>
        <div className="ticker__track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>
              {t} <em>✦</em>
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- nav ---------------- */}
      <header className="nav">
        <div className="container nav__inner">
          <a className="wordmark" href="#top">
            <span className="glyph">
              <ArrowArchery width={18} height={18} strokeWidth={2.2} />
            </span>
            ROBINHOOD
          </a>
          <nav className="nav__links">
            <a href="#how">How it works</a>
            <a href="#round">Live round</a>
            <a href="#winners">Winners</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="badge" style={{ borderColor: "var(--line)" }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--lime-deep)",
                }}
              />
              Robinhood Chain · L2
            </span>
            <button className="btn btn--lime">
              <Wallet width={17} height={17} strokeWidth={2} />
              Connect
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="hero dotgrid" id="top">
        <div className="container">
          <div className="hero__grid">
            {/* left */}
            <Stagger amount={0.1}>
              <Item>
                <span className="eyebrow">
                  <span className="dot" /> Rob the rich · $HOOD
                </span>
              </Item>
              <Item as="h1">
                <h1>
                  Rob the <span className="hl">rich.</span>
                  <span className="row2">
                    Feed the <span className="serif-ital">degens.</span>
                  </span>
                </h1>
              </Item>
              <Item>
                <p className="hero__sub">
                  A lottery that lives on <b>Robinhood Chain</b>, an EVM L2.
                  Every trade pays a 10% tax straight into the pot. Every 10
                  minutes, one random buyer robs it all.
                </p>
              </Item>
              <Item>
                <div className="hero__cta">
                  <button className="btn btn--lime btn--lg">
                    <Wallet width={18} height={18} strokeWidth={2} />
                    Connect to buy
                  </button>
                  <a className="btn btn--lg" href="#how">
                    How it works
                    <NavArrowRight width={18} height={18} strokeWidth={2} />
                  </a>
                </div>
              </Item>
              <Item>
                <div className="hero__trust">
                  {[
                    ["10% tax", "→ straight to pot"],
                    ["≤ 10 min", "rounds on L2"],
                    ["1 ticket", "per wallet"],
                    ["EVM L2", "sub-cent fees"],
                  ].map(([b, s]) => (
                    <div className="trust-item" key={b}>
                      <b>{b}</b>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </Item>
            </Stagger>

            {/* right — live round card */}
            <FadeUp delay={0.15}>
              <div className="round-card" id="round">
                <div className="round-card__top">
                  <span className="live">
                    <span className="pulse" /> Round #43 · Live
                  </span>
                  <span className="badge badge--lime">
                    <Flash width={13} height={13} strokeWidth={2.2} /> Pot growing
                  </span>
                </div>
                <div className="pot-label">Current pot</div>
                <div className="pot-value">
                  <NumberTicker value={4.2069} decimalPlaces={4} />
                  <small>ETH</small>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>
                  then a random buyer wins it all
                </div>
                <div className="round-grid">
                  <div className="round-cell">
                    <div className="k">Next seed</div>
                    <div className="v lime">1.0503 Ξ</div>
                  </div>
                  <div className="round-cell">
                    <div className="k">Players this round</div>
                    <div className="v">23</div>
                  </div>
                  <div className="round-cell">
                    <div className="k">Time left</div>
                    <div className="v lime">
                      <Countdown seconds={512} />
                    </div>
                  </div>
                  <div className="round-cell">
                    <div className="k">Your tickets</div>
                    <div className="v">0</div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ---------------- buy ---------------- */}
      <section className="section section--paper2" id="buy">
        <div className="container">
          <div className="buy-wrap">
            {/* copy */}
            <Stagger>
              <Item>
                <span className="eyebrow">
                  <span className="dot" /> Buy $HOOD
                </span>
              </Item>
              <Item as="h2">
                <h2
                  className="display"
                  style={{ fontSize: "clamp(36px,6vw,72px)", marginTop: 16 }}
                >
                  One buy.
                  <br />
                  One ticket.
                  <br />
                  <span className="serif-ital">Same odds</span> as the whale.
                </h2>
              </Item>
              <Item>
                <p className="muted" style={{ fontSize: 18, marginTop: 22, maxWidth: "42ch", lineHeight: 1.55 }}>
                  A buy of ~$30 or more earns you one ticket for this round.
                  That is the whole game — no tiers, no boosts, no whales
                  buying their way to better odds.
                </p>
              </Item>
              <Item>
                <div className="ticket-note" style={{ maxWidth: 460 }}>
                  <ShieldCheck width={22} height={22} strokeWidth={2} style={{ flex: "none" }} />
                  <span>
                    One ticket per wallet — the whale and you have exactly the
                    same odds of robbing the pot.
                  </span>
                </div>
              </Item>
            </Stagger>

            {/* panel */}
            <FadeUp delay={0.1}>
              <div className="buy-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>Buy $HOOD</h3>
                  <span className="badge badge--lime">
                    <Percentage width={13} height={13} strokeWidth={2.4} /> 10% tax → pot
                  </span>
                </div>

                <div className="field">
                  <div className="flabel">
                    <span>You pay</span>
                    <span>Balance 0.00</span>
                  </div>
                  <div className="amount-box">
                    <span className="amt">{amount}</span>
                    <div className="paywith" style={{ margin: 0 }}>
                      {PAY.map((p) => (
                        <button
                          key={p.k}
                          className={`tokenchip${token === p.k ? " on" : ""}`}
                          onClick={() => setToken(p.k)}
                        >
                          <span className="tk" style={{ background: p.c }}>
                            {p.k[0]}
                          </span>
                          {p.k}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="presets">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        className={`chip${amount === p ? " chip--active" : ""}`}
                        onClick={() => setAmount(p)}
                      >
                        {p} {token}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tax-line">
                  <span className="muted">10% tax → pot</span>
                  <span>
                    ≈ {(parseFloat(amount || "0") * 0.1).toFixed(4)} {token}
                  </span>
                </div>
                <div className="tax-line" style={{ borderTop: "none", marginTop: 4, paddingTop: 0 }}>
                  <span className="muted">You receive</span>
                  <span className="lime-text" style={{ fontWeight: 700 }}>
                    ≈ {(parseFloat(amount || "0") * 0.9).toFixed(4)} {token} in $HOOD
                  </span>
                </div>

                <button className="btn btn--ink btn--block btn--lg" style={{ marginTop: 22 }}>
                  <Wallet width={18} height={18} strokeWidth={2} />
                  Connect to buy
                </button>
                <div className="ticket-note" style={{ marginTop: 14 }}>
                  <Gift width={20} height={20} strokeWidth={2} style={{ flex: "none" }} />
                  <span>This buy earns you 1 ticket this round.</span>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="section" id="how">
        <div className="container">
          <FadeUp>
            <div className="sec-head">
              <span className="eyebrow">
                <span className="dot" /> How it works
              </span>
              <h2>
                Five steps between a<br />
                trade and a <span className="serif-ital">stolen</span> pot.
              </h2>
            </div>
          </FadeUp>
          <Stagger className="steps" amount={0.15}>
            {STEPS.map((s, i) => {
              const Ic = s.icon;
              return (
                <Item className="step" key={s.t}>
                  <div className="step__n">0{i + 1}</div>
                  <div className="step__icon">
                    <Ic width={24} height={24} strokeWidth={2} />
                  </div>
                  <h4>{s.t}</h4>
                  <p>{s.d}</p>
                </Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ---------------- impact stats (dark) ---------------- */}
      <section className="section section--ink">
        <div className="container">
          <FadeUp>
            <div className="sec-head" style={{ marginBottom: 56 }}>
              <span className="eyebrow" style={{ color: "rgba(255,255,255,.55)" }}>
                <span className="dot" /> Paid to players
              </span>
              <h2 style={{ color: "var(--paper)" }}>
                Every wei taxed off the rich
                <br />
                has gone <span className="serif-ital">back to a degen.</span>
              </h2>
            </div>
          </FadeUp>
          <Stagger className="statband" amount={0.2}>
            <Item className="bigstat" style={{ color: "var(--paper)" }}>
              <div className="num">
                <NumberTicker value={128.47} decimalPlaces={2} /> <span className="u">ETH</span>
              </div>
              <div className="lab">Distributed to players</div>
            </Item>
            <Item className="bigstat" style={{ color: "var(--paper)" }}>
              <div className="num">
                <NumberTicker value={43} />
              </div>
              <div className="lab">Rounds and counting</div>
            </Item>
            <Item className="bigstat" style={{ color: "var(--paper)" }}>
              <div className="num">
                <span className="u">$</span>
                <NumberTicker value={411104} />
              </div>
              <div className="lab">Total value paid out</div>
            </Item>
          </Stagger>
        </div>
      </section>

      {/* ---------------- winners ---------------- */}
      <section className="section" id="winners">
        <div className="container">
          <FadeUp>
            <div className="sec-head">
              <span className="eyebrow">
                <span className="dot" /> Recent winners
              </span>
              <h2>
                Real wallets. Real pots.
                <br />
                <span className="serif-ital">Robbed</span> in minutes.
              </h2>
            </div>
          </FadeUp>
          <Stagger className="winners" amount={0.1}>
            {WINNERS.map((w, i) => (
              <Item className="winrow" key={w.a}>
                <div className="rank">
                  {i === 0 ? <Trophy width={22} height={22} strokeWidth={2} /> : `0${i + 1}`}
                </div>
                <div className="addr">{w.a}</div>
                <div className="meta">
                  {w.r} · {w.t}
                </div>
                <div className="won">
                  <em>{w.w}</em> ETH
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------------- pay only with robinhood (dark) ---------------- */}
      <section className="section section--ink" id="pay">
        <div className="container">
          <div className="feat-grid">
            <Stagger>
              <Item>
                <span className="eyebrow" style={{ color: "rgba(255,255,255,.55)" }}>
                  <span className="dot" /> One chain, low fees
                </span>
              </Item>
              <Item as="h2">
                <h2 className="display" style={{ color: "var(--paper)", fontSize: "clamp(34px,5vw,62px)", marginTop: 16 }}>
                  Pay only with
                  <br />
                  <span className="serif-ital">Robinhood.</span>
                </h2>
              </Item>
              <Item>
                <p className="muted" style={{ marginTop: 20, fontSize: 17, maxWidth: "44ch", lineHeight: 1.55 }}>
                  Robinhood Chain is an Ethereum L2 — the cheapest place to
                  play. Fund your buys with Robinhood ETH, USDC or USDT.
                  Nothing else settles the pot.
                </p>
              </Item>
              <Item>
                <div className="assetlist">
                  {ASSETS.map((a) => (
                    <div className="assetrow" key={a.n}>
                      <span className="tk" style={{ background: a.c }}>
                        {a.s}
                      </span>
                      <div>
                        <div className="nm">{a.n}</div>
                        <div className="ds">{a.d}</div>
                      </div>
                      <span className="fee">{a.f}</span>
                    </div>
                  ))}
                </div>
              </Item>
            </Stagger>

            <FadeUp delay={0.12}>
              <div className="bridge-card">
                <div>
                  <span className="badge" style={{ background: "var(--lime-ink)", color: "var(--lime)", borderColor: "transparent" }}>
                    <DataTransferBoth width={13} height={13} strokeWidth={2.2} /> Bridge
                  </span>
                  <h3 style={{ marginTop: 18 }}>
                    Coming from Solana?
                    <br />
                    Bridge in, then rob.
                  </h3>
                </div>
                <div className="bridge-flow">
                  <span className="bridge-node">SOL / USDC</span>
                  <NavArrowRight width={22} height={22} strokeWidth={2.4} />
                  <span className="bridge-node">Robinhood L2</span>
                  <NavArrowRight width={22} height={22} strokeWidth={2.4} />
                  <span className="bridge-node">$HOOD pot</span>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, fontWeight: 500 }}>
                  Assets bridge from Solana into Robinhood Chain and settle
                  straight into your next buy. One hop, sub-cent fees, then
                  you are in the round.
                </p>
                <button className="btn btn--ink btn--block" style={{ marginTop: 22 }}>
                  <DataTransferBoth width={17} height={17} strokeWidth={2} />
                  Open the bridge
                </button>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section className="section section--paper2" id="faq">
        <div className="container" style={{ maxWidth: 940 }}>
          <FadeUp>
            <div className="sec-head">
              <span className="eyebrow">
                <span className="dot" /> Questions
              </span>
              <h2>The rules, plainly.</h2>
            </div>
          </FadeUp>
          <FadeUp delay={0.05}>
            <div className="faq">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div className="faq-item" key={i} data-open={open}>
                    <button className="faq-q" onClick={() => setOpenFaq(open ? null : i)}>
                      {f.q}
                      <span className="ic">
                        <Plus width={18} height={18} strokeWidth={2.2} />
                      </span>
                    </button>
                    <motion.div
                      className="faq-a"
                      initial={false}
                      animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p>{f.a}</p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ---------------- cta band ---------------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <FadeUp>
            <div
              style={{
                background: "var(--lime)",
                color: "var(--lime-ink)",
                borderRadius: 28,
                padding: "clamp(40px,6vw,80px)",
                textAlign: "center",
              }}
            >
              <span className="eyebrow" style={{ color: "var(--lime-ink)", opacity: 0.7 }}>
                <ArrowArchery width={16} height={16} strokeWidth={2.2} /> Round #43 is live
              </span>
              <h2
                className="display"
                style={{ fontSize: "clamp(40px,8vw,104px)", margin: "18px 0 0" }}
              >
                Take from the rich.
              </h2>
              <p style={{ maxWidth: "50ch", margin: "20px auto 0", fontSize: 18, fontWeight: 500 }}>
                Connect, buy $HOOD, hold your ticket. In ten minutes the pot
                could be yours.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
                <button className="btn btn--ink btn--lg">
                  <Wallet width={18} height={18} strokeWidth={2} />
                  Connect to buy
                </button>
                <a className="btn btn--lg" href="#how" style={{ borderColor: "var(--lime-ink)" }}>
                  Read the rules
                </a>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ---------------- footer ---------------- */}
      <footer className="footer">
        <div className="container">
          <FadeUp>
            <p className="bigmark">
              R<span className="o">◎</span>BINHOOD
            </p>
          </FadeUp>
          <div className="footer__row">
            <p style={{ maxWidth: "40ch", color: "rgba(255,255,255,.7)", fontSize: 16, lineHeight: 1.5, margin: 0 }}>
              Rob the rich, feed the degens. It lives while there is volume; it
              dies when the hype fades — that is the point.
            </p>
            <div className="footer__links">
              <a className="fl" href="#how">How it works</a>
              <a className="fl" href="#winners">Winners</a>
              <a className="fl" href="#pay">Pay</a>
              <a className="fl" href="#faq">FAQ</a>
              <a className="fl" href="#" aria-label="Twitter"><Twitter width={18} height={18} /></a>
              <a className="fl" href="#" aria-label="Telegram"><Telegram width={18} height={18} /></a>
              <a className="fl" href="#" aria-label="Discord"><Discord width={18} height={18} /></a>
            </div>
          </div>
          <div className="ca">
            <span>Contract address — TBD at launch</span>
            <span>Robinhood Chain · EVM L2 · $HOOD</span>
          </div>
        </div>
      </footer>
    </>
  );
}
