# DeFi Field Guide

An interactive map of the DeFi ecosystem, starting from Solana meme coin trading.
Next.js (App Router, TypeScript) — deploys to Vercel with zero config.

## Routes

| Route | Page |
|---|---|
| `/` | Hub map — animated ecosystem map, filters, node previews, learning path |
| `/liquidity-pools` | Node 01 — how swaps move prices |
| `/yield-farming` | Node 02 — renting out liquidity |
| `/looping` | Node 03 — leveraged lend/borrow loops |
| `/cross-dex-arbitrage` | Node 04 — price gaps between venues |
| `/perps-and-futures` | Node 05 — leveraged directional bets |
| `/rwa` | Node 06 — tokenized real-world assets |
| `/sinks-and-faucets` | Node 07 — where the money goes |

All pages are fully client-interactive and prerender as static content at build time.

## Develop

```bash
npm install
npm run dev
```

## Deploy to Vercel

**Option A — Vercel CLI** (fastest):

```bash
npx vercel
```

Log in when prompted, accept the defaults. `npx vercel --prod` ships it live.

**Option B — GitHub import:**

1. Push this repo to GitHub.
2. In the Vercel dashboard: Add New → Project → Import the repo.
3. Accept the defaults (Next.js is auto-detected). Deploy.

No environment variables needed. No `vercel.json` needed.

## Notes

- Styling is per-route CSS Modules; shared fonts (Manrope + Azeret Mono) load in `app/layout.tsx`.
- Dark/light mode follows the OS `prefers-color-scheme` setting, as in the original designs.
