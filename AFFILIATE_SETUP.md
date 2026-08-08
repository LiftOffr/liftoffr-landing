# Affiliate layer — what's built, what needs you (2026-08-08)

The page is live at **`/stack`** and it is fully honest right now: every link
goes to the manufacturer directly and is labelled *"Direct link — no
commission"*. Nothing claims a commission that doesn't exist. When you join a
program, you paste one URL and the label flips itself.

## What's built

| Surface | State |
|---|---|
| `/stack` page | Live. 5 tools, per-link commission label, disclosure block at the top, disclaimer at the bottom, GA4 + Clarity wired. |
| Site links in | `/free` (judge-the-record row), homepage footer, sitemap. Deliberately **not** on `/plan` — that page has one job. |
| Email | New **Day 9** in the free nurture: *"The 5 tools I actually run this on"*. Plus a line in the plan-buyer **Day 1** execution email. |
| Discord | New **Day 14** onboarding DM. Ascension-capped like everything else. |
| Tracking | Every link fires `cta_clicked` with `destination: aff_<tool>`, so GA4 shows click volume per tool before you've earned a cent — which tells you which programs are worth the application. |

## How to switch a link on

`stack/index.html`, near the bottom, one block:

```js
var AFFILIATES = {
  aff_ledger:      { url: "" },
  aff_trezor:      { url: "" },
  aff_koinly:      { url: "" },
  aff_coinledger:  { url: "" },
  aff_tradingview: { url: "" }
};
```

Paste your tracking URL as `url`. The href swaps and the label under the button
changes from "Direct link — no commission" to "Affiliate link" automatically.
That is the whole edit — do not hand-edit the `<a href>` or the label text, or
they will drift apart and you'll end up with a false disclosure, which is worse
than no disclosure.

## The five programs, and the order to apply in

Ranked by fit × payout. All five pass the brand filter in
`LIFTOFFR_MASTER_PLAN.md` §9.

### 1. Ledger — apply first
- **Terms:** 10% of net sale, paid monthly in BTC.
- **Apply:** affiliate.ledger.com
- **Why first:** custody-first is the brand's actual position, hardware wallets
  are the one purchase this site tells everyone to make, and the master plan
  already approved it by name.
- **Needs:** site URL, traffic numbers, a sentence on audience.

### 2. Trezor
- **Terms:** 12%, rising to 15% after 10 conversions.
- **Apply:** trezor.io/learn/a/for-affiliates
- **Why:** carrying both means the page recommends the category rather than a
  brand, which is the more honest position and converts better for it.

### 3. Koinly
- **Terms:** ~20% base, higher tiers for larger audiences.
- **Apply:** koinly.io/affiliate
- **Why:** every fired tier is a cost-basis event. Demand is guaranteed and
  seasonal — Jan-Apr is the whole year.

### 4. CoinLedger
- **Terms:** 25% recurring per paid report, monthly PayPal, 15-day cookie.
- **Apply:** coinledger.io/affiliate-program
- **Why:** best payout of the tax pair and US-focused, which matches the
  audience. Short cookie window, so it only earns from immediate intent — which
  is exactly what a January email produces.

### 5. TradingView
- **Terms:** 30% recurring on every renewal, 90-day cookie.
- **Apply:** tradingview.com/partner-program
- **Why last:** best economics on the list (recurring, long cookie), but the
  weakest brand fit — it's a charting tool on a site that argues you should look
  at charts less. The page handles that by recommending only the free tier for
  most readers, which is true and costs the commission. Keep it that way.

**Timing:** apply to all five in one sitting (~45 minutes total). Approval takes
days to weeks. Nothing on the site changes until URLs are pasted, so there's no
half-live state.

## What was rejected, and why it stays rejected

| Program | Payout | Why not |
|---|---|---|
| Coinbase | $10 CPA + 50% of trading fees for 3 months | Paid more the more the reader trades. Direct conflict with the entire positioning. |
| Kraken | 20% recurring rev-share | Same conflict. |
| OKX / Bybit / Binance | 30-50% of fees | Same conflict, plus US availability problems. |
| 3Commas / Cryptohopper | 25-40% recurring | Trading bots. The opposite of a written plan you execute yourself. |
| Anything with leverage | any | Ruled out permanently in the master plan and correctly so. |

These are the highest-paying programs in the niche. Turning them down is a real
cost — and it is also the only reason the `/stack` page's "here's what I turned
down" section is worth anything. That section is a trust asset; it stops being
one the moment there's an exchange link on the page.

## Honest revenue expectation

At current traffic (~430 sessions/month site-wide, most of it landing on `/plan`
rather than `/stack`), this layer is worth **tens of dollars a month**, not
hundreds. A hardware wallet at 10% of ~$100 is $10; two or three a month is a
realistic near-term ceiling.

It is worth building anyway for three reasons, none of which are this month's
number:

1. **It monetises non-buyers**, who are and always will be the overwhelming
   majority. The Day 9 email earns from people who will never spend $29.
2. **It compounds with the SEO layer.** The `/indicators` pages age into real
   search traffic, and readers who arrive at "what does MVRV read today" are one
   click from the tools page.
3. **Tax season is a real spike.** Jan-Apr, on a recurring-commission product
   every US holder needs annually, off content that already exists.

Revisit the numbers in `BUSINESS_MODEL_2026-08.md` §5 rather than judging this
line on August.

## FTC hygiene — the non-negotiables

- Disclosure **above** the first link, not in a footer, and per-link labels.
  Both are on the page.
- Never put an income claim and an affiliate link in the same asset. The Day 9
  email and the `/stack` page both make zero claims about returns.
- `rel="sponsored nofollow"` on every commercial outbound link — already set, so
  turning links on doesn't create an SEO problem.
- If a program's terms require specific disclosure language, that language wins;
  edit the page rather than assuming ours covers it.
