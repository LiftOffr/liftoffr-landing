# JARVIS — Personal BTC Command Center

An Apple/Iron-Man-style command center for your personal Bitcoin accumulation,
with **Claude (Opus 4.8)** as the intelligence layer. Lives at **`/jarvis`** on
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

2. **Model:** defaults to **Claude Opus 4.8** (no special access needed).
   Claude Fable 5 / Mythos 5 require Project Glasswing access — if your org gets
   it, set a `JARVIS_MODEL=claude-fable-5` env var and redeploy; no code change.

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

Opus 4.8 is $5/$25 per 1M tokens. Each briefing/ask is ~1–2K input + <1K output,
so a fraction of a cent per call. The persona prompt is prompt-cached. A rare
safety refusal is surfaced gracefully rather than breaking the HUD.

## Deploy

This is part of the existing Vercel project — commit + push (or `vercel --prod`)
and it deploys with the rest of the site. Visit `https://liftoffr.com/jarvis`.
