# Personal Cycle Dashboard — Setup

URL: **https://liftoffr.com/dashboard**

## 1. Set the password (one-time)

In the Vercel project settings → Environment Variables, add:

```
DASHBOARD_PASSWORD = <pick a strong password>
```

Apply to: Production, Preview, Development. Redeploy after saving.

Login: when you hit `/dashboard`, the browser shows an HTTP Basic Auth prompt.
- Username: anything (it's ignored)
- Password: whatever you set above

The browser caches the login so you only enter it once per session per device.

## 2. How data is stored

Trades live in **your browser's localStorage** — never sent to a server. Pros:
- Zero leak risk (your stack size never touches the internet)
- No DB to manage
- Works offline once loaded

Cons:
- Bound to one browser. Clear cookies/cache → trades gone.
- Doesn't sync across devices automatically.

**Mitigation:** Click "Export JSON" weekly. Save the file to iCloud/Dropbox. If you switch devices, hit "Import CSV" and paste the JSON contents to restore.

## 3. How to add trades

**Manual (fastest for one-offs):**
1. Click `+ Add Trade`
2. Enter date, source (Coinbase/Strike/River/Kraken), USD amount, BTC amount
3. Price auto-calculates. Add an optional note (e.g. "Phase 1 Tier 1")

**CSV import (Coinbase batch):**
1. Coinbase → Account → Statements → Generate report → Transaction history (CSV)
2. Open the CSV in a text editor, copy all contents
3. Dashboard → `Import CSV` → paste → click Import

**Strike batch:**
1. Strike → Activity → Export transactions (.csv)
2. Same as above. The parser auto-detects format.

**JSON re-import (restore from backup):**
1. Open exported `.json` in text editor
2. Paste into Import dialog. Existing trades by ID are skipped — no duplicates.

## 4. What lives where on the dashboard

| Section | What it shows |
|---|---|
| **Top bar** | Live BTC spot + 24h change + current cycle phase |
| **4 stat cards** | Stack size, total USD in, current value, unrealized P/L |
| **Cycle Plan Progress** | Phase-by-phase deployment vs the $137,800 budget — pulls real numbers from your trades, not projections |
| **Upcoming Triggers** | Next 4 tier triggers (CBBI levels, V7 signals) from the plan |
| **Calendar** | Month grid. Each cell with a trade shows USD spent + live P/L vs today's BTC. Click a past day to add a trade for that date. |
| **All Trades** | Sortable list of every trade with source, amount, fill price, current P/L, delete button |

## 5. Updating the plan

The plan config is hard-coded in `dashboard/index.html` (search for `const PLAN = `).
Edit the phases, tiers, budgets, target prices there and redeploy. You can adjust:
- Phase date ranges as the cycle plays out
- Tier trigger conditions
- Target prices (after each tier fires, update the actual fill price to track plan vs reality)

## 6. Costs

- **Vercel:** $0 (within free tier — middleware runs on Edge, ~ms per request)
- **CoinGecko API:** $0 (free tier, 10-50 req/min cached at edge for 60s)
- **Total:** $0/mo

## 7. Future upgrades (if you want)

1. **Coinbase auto-sync** — generate read-only API keys, store in Vercel env, build a `/api/coinbase-sync` endpoint. Removes manual CSV import.
2. **Strike auto-sync** — Strike has an API but business-tier only; for now CSV stays manual.
3. **Sync via Vercel KV** — replace localStorage with KV-backed API so trades follow you across devices. ~5 min change.
4. **CBBI live feed** — embed current CBBI value next to phase indicator so triggers fire visually.
5. **Multi-asset** — extend to ETH/SOL stacks if you ever expand beyond BTC.

Ask me when you want any of these built.
