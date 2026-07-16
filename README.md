# ROBINHOOD — Rob the rich. Feed the degens.

Landing page for an on-chain lottery that lives on **Robinhood Chain** (an
EVM L2). Every trade of `$HOOD` pays a 10% tax straight into the pot; every
~10 minutes a random buyer robs it all. Inspired by the mechanics of
[robinloot.xyz](https://robinloot.xyz), rebuilt around a Robin-Hood theme.

- **Stack:** Next.js 14 (App Router) + TypeScript + React 18
- **Animation:** [`motion`](https://motion.dev) (Framer Motion) — every section
  animates in element-by-element on scroll, plus a live countdown and
  count-up number tickers.
- **Icons:** [Iconoir](https://iconoir.com) (`iconoir-react`) — an uncommon,
  thin icon set.

## Design system

Palette follows the color-expert **70 / 20 / 10** rule — uncommon for crypto,
which usually goes dark-neon:

- **70%** paper white (`#FFFFFF` / `#F7F7F2`)
- **20%** ink black (`#0A0A0A`) — type + the dark bands
- **10%** acid lime (`#CCFF01`) — the single accent

Type pairs four families with clear roles: **Archivo Black** (giant display),
**Instrument Serif** italic (accent words), **Space Grotesk** (UI / body) and
**JetBrains Mono** (numbers, addresses). Numbers and headlines are deliberately
oversized for readability.

## Sections

Ticker · nav · hero with live round card · buy panel (interactive amount /
token) · how-it-works (5 steps) · impact stats (count-up) · recent winners ·
"pay only with Robinhood" + Solana→L2 bridge · FAQ accordion · CTA · footer.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Notes on the payment / bridge story

The UI presents the **landing** only. Copy states plainly that the pot is
denominated on Robinhood Chain and can only be funded with Robinhood ETH,
USDC or USDT, with an optional Solana → Robinhood-L2 bridge hop. No wallet,
RPC or bridge is wired up yet — the "Connect" and "Bridge" buttons are
placeholders for the utility phase.
