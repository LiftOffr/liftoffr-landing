# JARVIS — Personal BTC Command Center

An Apple/Iron-Man-style command center for your personal Bitcoin accumulation,
with **Claude Fable 5** as the intelligence layer. Lives at **`/jarvis`** on
liftoffr.com, behind the same Basic-Auth password as `/dashboard`.

## What it does

- **Live HUD** — holdings (live from Coinbase), market value, cost basis,
  unrealized P/L, capital deployed vs dry powder, CBBI, cycle score/zone,
  price vs 200W MA, and your full buy-tier ladder with fired/hit/pending status.
- **JARVIS intelligence (Fable 5)** — four modes:
  - **Daily Briefing** — where you stand + the day's posture (auto-runs on load)
  - **Risk Read** — conviction posture for your remaining dry powder
  - **Tier Status** — which tier is next and what triggers it
  - **Ask anything** — free-text Q&A grounded in your live position

All narration is grounded strictly in a live snapshot the browser assembles —
the model never sees credentials and can't invent numbers.

## One-time setup

1. **Add the Anthropic key on Vercel** (project: `liftoffr-landing`):
   ```
   vercel env add ANTHROPIC_API_KEY production
   ```
   (or Vercel dashboard → Settings → Environment Variables). Redeploy after.

2. **Data retention:** Fable 5 requires **30-day data retention** (it is not
   available under zero-data-retention). If your Anthropic org is set to ZDR,
   every request 400s — switch retention in the Anthropic Console first.

3. `DASHBOARD_PASSWORD` is already set (shared with `/dashboard`) — nothing to do.

## Zero maintenance — it's all live

Everything is derived live, so there's nothing to hand-edit as tiers fire:

- **Holdings** ← `/api/coinbase-balance` (your live BTC balance)
- **Cost basis, capital deployed, which tiers have fired** ← `/api/coinbase-sync`
  (real Coinbase fills, scoped to buys since the plan start, allocated to the
  tier ladder exactly like `/dashboard`)
- **Price, 24h, 200W MA, CBBI, cycle score/zone, Cowen targets** ← `/api/btc-price` + `/api/cycle-score`

The `FIRED` / `PORTFOLIO` / `PLAN_START` constants at the top of
[`jarvis/index.html`](./index.html) are **fallbacks only** — used if the Coinbase
sync is unavailable. When the sync succeeds (the normal case), they're ignored
and the HUD shows a "live" tag on the deployed bar. The only thing to update by
hand is the tier ladder itself (`PLAN`) if you ever re-plan the strategy.

## Cost

Fable 5 is $10/$50 per 1M tokens. Each briefing/ask is ~1–2K input + <1K output,
so well under a cent per call. The persona prompt is cached. A refusal is
transparently re-served by Claude Opus 4.8 (server-side fallback) so the
dashboard never breaks on a false-positive safety classifier.

## Deploy

This is part of the existing Vercel project — commit + push (or `vercel --prod`)
and it deploys with the rest of the site. Visit `https://liftoffr.com/jarvis`.
