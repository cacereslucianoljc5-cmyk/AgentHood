# Hood Radar — landing

Landing page for an on-chain research terminal for **Robinhood Chain** token
launches, inspired by the functionality of [ponsradar.com](https://ponsradar.com).
It presents the terminal's nine live modules (launch wire, token radar, live
flow, distribution, creator trail, trade tape…) and includes a **live launch
wire** that reads real new pools from public indexers.

- **Stack:** Next.js 14 (App Router) + TypeScript + React 18
- **Motion:** [framer-motion](https://www.framer.com/motion/) — each section
  reveals element-by-element on scroll, big numbers count up.
- **Icons:** [iconoir-react](https://iconoir.com) (a deliberately less-common
  set).
- **Type:** Bricolage Grotesque (display), Instrument Serif (italic accent),
  Instrument Sans (body) and JetBrains Mono (data) via `next/font`.

## Design

A soft **"botanical terminal"** palette instead of the usual dark-neon crypto
look, built on the 70 / 20 / 10 rule:

- **70 %** warm paper neutrals (background, cards, borders, ink text)
- **20 %** forest green (brand, logo, primary actions, "up")
- **10 %** honey amber + clay (section numerals, highlights, "down")

Ambient background is a subtle radar sweep + drifting soft blobs; the cursor is
an easing radar dot with a soft glow. All effects respect
`prefers-reduced-motion`.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Structure

```
app/
  layout.tsx           fonts + metadata
  globals.css          botanical design system
  page.tsx             landing (nav, hero, stats, 9 modules, live wire,
                       method, build log, privacy, CTA, footer)
  api/tokens/route.ts  live token feed (GeckoTerminal / on-chain / DexScreener)
  api/token-image      logo image proxy
public/
  logo.png             green leaf mark
```

> Independent research software. It does not custody assets, execute trades, or
> provide investment advice. Not affiliated with Pons or Robinhood.
