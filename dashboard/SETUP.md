# Personal Cycle Dashboard — Setup

URL: **https://liftoffr.com/dashboard**

## Part 1 — Password gate (already done)

You set `DASHBOARD_PASSWORD` in Vercel env vars. Done.

## Part 2 — Coinbase auto-sync

This pulls every BTC buy/sell from your Coinbase Advanced Trade account automatically. Both your DCA buys and lump-sum tier buys flow in.

> **Important:** This integration uses Coinbase's new **CDP (Coinbase Developer Platform)** API keys with **Ed25519 JWT auth**, against the **Advanced Trade API**. That means you need to set up recurring buys and lump-sum buys on **Coinbase Advanced Trade**, not Coinbase Simple. Advanced Trade also has way lower fees (~10-50bps vs ~1.5% spread), so this is the right move regardless.

### Step 1: Create a read-only CDP API key

1. Go to **https://portal.cdp.coinbase.com/access/api** (or coinbase.com → Settings → API → Create key — it redirects here)
2. Click **Create API key**
3. **Name:** "liftoffr-dashboard" (or whatever)
4. **Permissions:** check ONLY these for read-only access:
   - ✅ **View** (account balances + portfolio)
   - ✅ **Trade history** (or "View trades" / "Transactions read" — UI wording varies)
   - ❌ Leave **Trade** UNCHECKED — we don't want the key to be able to place orders
   - ❌ Leave **Transfer** UNCHECKED
5. **IP whitelist:** optional. Easiest is to leave blank.
6. **Algorithm:** Ed25519 (default, what you already have)
7. Click **Create** → you'll see:
   - **API Key Name** (UUID format, e.g. `269781d7-...`)
   - **Project ID** (UUID, e.g. `96a6cffb-...`)
   - **Private Key** (base64 string, 88 chars, shown once)

### Step 2: Add the keys to Vercel

1. Vercel dashboard → liftoffr-landing project → Settings → Environment Variables
2. Add these two vars:
   - `COINBASE_API_KEY_ID` = (the API Key Name / Key ID UUID, e.g. `269781d7-...`)
   - `COINBASE_API_SECRET` = (the base64 private key, the long `GzY5...` string ending in `==`)
3. Apply to Production, Preview, Development
4. Save and redeploy (Deployments tab → ⋯ → Redeploy)

The Project ID isn't needed for API calls. You can save it elsewhere for your records.

### Step 3: Use it

1. Hit https://liftoffr.com/dashboard
2. Click **⟳ Sync Coinbase** (top button on the calendar card)
3. Wait 2-5 seconds. Status line below the buttons shows how many trades were imported.
4. Run it after every buy. Or once a week. Coinbase keeps full history; reruns are idempotent (dedupe by transaction ID).

## Part 3 — Set up DCA on Coinbase Advanced Trade

The sync only sees trades that fill on **Advanced Trade** (which is what the CDP API exposes). It will NOT see Coinbase Simple Buy/Sell trades. So set up recurring there:

1. Open Coinbase web (coinbase.com) → click **Advanced** in the top nav (or go to coinbase.com/advanced-trade/BTC-USD)
2. Click **Recurring** (in the order panel on the right)
3. Set:
   - **Product:** BTC-USD
   - **Amount:** $100
   - **Frequency:** Weekly
   - **Day:** pick one (e.g. Monday)
   - **Order type:** Market (fills immediately at best price)
   - **Payment:** linked bank (ACH = no deposit fee)
4. Click **Place recurring order**

That's it. Coinbase auto-executes weekly. Fees ~50bps maker/taker vs ~1.5% on Simple = ~$1/wk saved on a $100 buy. Over 178 weeks of the cycle plan, ~$178 saved.

**Lump-sum tier buys:** when V7/CBBI triggers fire, place those on Advanced Trade as market or limit orders. They auto-sync the same way.

### Manual sync workflow

After every buy (or once a week), click **⟳ Sync Coinbase** on the dashboard. It pulls all new fills, dedupes by Coinbase trade ID, adds them to the calendar. Idempotent — clicking repeatedly does nothing if there are no new trades.

## Part 4 — How data flows

```
Coinbase (buys execute) ─┐
                         │
                         ├─► /api/coinbase-sync (HMAC-signed read)
                         │
                         ▼
                  dashboard merges by externalId
                         │
                         ▼
              localStorage (your browser only)
```

Trades never touch a server we don't own. Coinbase keys are stored only in Vercel env vars (encrypted at rest). The middleware blocks anyone without your password from hitting the API.

## Part 5 — What lives where on the dashboard

| Section | What it shows |
|---|---|
| **Top bar** | Live BTC spot + 24h change + current cycle phase |
| **4 stat cards** | Total BTC, total USD in, current value, unrealized P/L |
| **Cycle Plan Progress** | All 5 phases of the cycle plan with progress bars |
| **Upcoming Triggers** | Next tier triggers (CBBI levels, V7 signals, target prices) |
| **Calendar** | Month grid like a trading P/L calendar. Each day with trades shows USD spent + live P/L vs today |
| **All Trades** | Sortable list with source badge, amount, fill price, P/L |

## Part 5b — When the Coinbase key gets rotated

CDP keys stop working the moment they're rotated, revoked, or deleted in the
Coinbase portal. Symptom: `/api/coinbase-sync` and `/api/coinbase-balance`
return **401**, the dashboard sync status turns red, and no new buys appear on
the calendar.

**This does not stop your recurring buys.** The key is read-only (View +
Trade history, no Trade permission) — it cannot place, modify, or cancel
orders. Coinbase executes the recurring order on its own schedule regardless.
A 401 here means the dashboard has gone blind, not that a purchase failed. If a
buy genuinely didn't execute, the cause is on the Coinbase side (payment method,
ACH hold, or the recurring order itself) and shows up at
coinbase.com → Advanced → Recurring.

To fix a rotated key:

1. Create a new read-only key — https://portal.cdp.coinbase.com/access/api,
   permissions **View** + **Trade history** only, Ed25519, no IP allowlist.
2. Run, and paste the two values at the prompts (nothing is echoed or stored):
   ```
   bash ~/liftoffr-landing/scripts/set-coinbase-key.sh
   ```
   It validates the format, updates both Vercel env vars, redeploys, and
   verifies with a read-only balance call.
3. Open the dashboard and hit **⟳ Sync Coinbase**. Re-syncs are idempotent —
   any buys that landed while the key was dead get imported then.

Manual alternative: Vercel → Settings → Environment Variables → update
`COINBASE_API_KEY_ID` and `COINBASE_API_SECRET` → Deployments → ⋯ → Redeploy.

## Part 6 — Manual safety net

If Coinbase API ever breaks or you buy off-platform (e.g. P2P, gift):
- **+ Manual Trade** button — add a one-off trade
- **Import CSV** — paste any exchange's transaction CSV
- **Export JSON** — back up your full trade history

Click **Export JSON** weekly. Save the file to iCloud/Dropbox. It's the only way to recover if your browser cache clears.

## Part 7 — Future upgrades

- **Auto-sync schedule** — cron job that syncs Coinbase hourly so you don't have to click. ~10 min to add.
- **Sync across devices** — replace localStorage with Vercel KV. ~5 min change.
- **CBBI live feed** — show current CBBI value next to phase indicator so triggers fire visually.
- **Auto-execute V7 signals** — Coinbase Advanced Trade API supports programmatic limit orders. We could place automatic sell-tiers on a Coinbase Pro account when V7 conditions are met. (More risk to discuss before building.)

Ask when you want any of these.
