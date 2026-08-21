# CLAUDE.md — liftoffr.com

> **2026-08-16 — the competitive-research rebuild shipped to production.**
> Start with **`TORIN_ACTION_CHECKLIST.md`** (what to do, in order) and
> **`DRAFTS_FOR_TORIN.md`** (copy to paste). Full record in
> `CHANGELOG_2026-08-16_RESEARCH_FINDINGS.md`.
> Live now: the `/quiz` funnel, income claims removed sitewide and from the nurture
> emails, proof pages cross-linked. Dormant: quiz emails 2–7, pending four Resend
> audiences + four Vercel env vars (checklist step 1).

LiftOffr: Bitcoin cycle-indicator education + paid Discord community. Solo founder (Torin). This file orients any session — read it before scanning the repo.

## Ongoing work state
CRO/UX sweep in progress — read `AUDIT_NOTES.md`, `COMPETITOR_INTEL.md`, `OPTIMIZATION_PLAN.md`, `CHANGELOG.md` STATUS lines first. Never re-scan the repo or re-run research already captured there.

## Stack
- Plain HTML + vanilla JS, no framework, no build step. Vercel (Hobby plan).
- Deploy: git push to main → auto-deploy. CLI `vercel --prod` unreliable (cron validation); prefer git push.
- **12 serverless-function cap and we are AT it.** Every `api/*.js` counts; shared modules must be underscore-prefixed (`api/_x.js`).
- `youtube_intel.py` (outside repo) auto-commits `api/_cowen-data.js` to main — check recent auto-commits if a deploy mysteriously breaks.
- Middleware: basic-auth on `/dashboard` + `/api/analytics` + `/api/coinbase-*`. `/dashboard` holds founder's private Coinbase data — NEVER link from public pages/emails (use `/cycle` instead).

## Page map
| Path | Role |
|---|---|
| `/` (index.html) | homepage: hero → proof bar → how-it-works → testimonials → offer ($29 plan + free door) → FAQ. CTAs → `/plan` |
| `/links` | link-in-bio hub |
| `/checklist` | lead-capture landing (current bio-link destination for IG/TikTok/YT/X via /ig /tt /yt /x) |
| `/cycle` | PUBLIC live cycle dashboard (gauge, Four Pillars, indicators) |
| `/track-record` | backtest proof: $50/wk → $1.88M vs $217K DCA, +7,602%, 417 start dates |
| `/playbook` | $497 Cycle Playbook 1:1 sales page (indexed since 2026-08-16, 4 spots/month; linked from home footer + ladder, /plan, /faq, /links, /system, /welcome-plan) |
| `/system` | $197 "The Cycle System" sales page (noindex — warm list only; $147 founding, 50 seats) |
| `/blog/*` | 9 indicator SEO posts |
| `/welcome` | generic post-checkout success → Discord |
| `/plan` | $29 one-time "My Bear Market Buy Plan" sales page (plan_MntgjXJaQnGsW) |
| `/free` | free onramp: Discord invite + Sunday Score capture |
| `/welcome-plan` | $29 plan post-purchase success page |
| `/dashboard` | PRIVATE (basic-auth) founder dashboard |

## Funnel wiring (post-pivot 2026-08-02 — truth: LIFTOFFR_MASTER_PLAN.md)
- Offer ladder: FREE (/free: open Discord + Sunday Score) → $29 one-time "My Bear Market Buy Plan" `plan_MntgjXJaQnGsW` (/plan) → $197 one-time "The Cycle System" `plan_WHByzwILskLsc` (/system; $147 founding = `plan_3SEycpErj9Zk7`, hidden, 50 seats, closes Sep 7) → $497 "The Cycle Playbook" 1:1 `plan_uIpPdsPTSHdTp` (/playbook). All four verified live against the Whop API 2026-08-11.
- DEAD (grandfathered only, hidden in Whop): Core/Pro/Elite subs, 7-day trial, annual plans. `/start` and `/join` now redirect to `/plan`.
- Whop webhook (`api/whop-webhook.js`) assigns @Plan addon role + legacy tier roles + fires GA4 purchase (item_id per plan) + adds $29 buyers to Resend "Plan Buyers" audience. Trial paths are hard-retired no-ops.
- Email: Resend — free nurture (D1/3/5/7/18, re-aimed at the $29 plan), Sunday Score. Trial nurture RETIRED (hard-disabled in code). Crons in vercel.json (Hobby = 1/day per cron max — hourly schedules break ALL deploys).
- DO NOT touch payment logic or pricing values without explicit founder confirmation per item.
- **Apple Pay domain verification is load-bearing — two files, both must survive.** Whop
  verifies liftoffr.com with Apple by fetching
  `/.well-known/apple-developer-merchantid-domain-association`. Without it Apple Pay does
  not appear in the embedded checkout, which is the payment path effectively every Reel
  viewer would use. The current mechanism (PR #2, `a04630e`, 2026-08-20) is:
  1. The real 228-byte file committed at `.well-known/apple-developer-merchantid-domain-association`
     — byte-identical to Whop's source, **no trailing newline**, sha256
     `5d3b5ece…4def4c`. Do not reformat it, do not let an editor add a newline.
  2. A `headers` entry in `vercel.json` pinning `Content-Type: application/octet-stream`
     on that path.
  **Both are required.** The earlier approach (PR #1, `b365f23`) was a `rewrites` proxy to
  Whop's copy, and it **failed verification** — Whop's origin serves that file with no
  `Content-Type` at all and Vercel's external rewrite passes the upstream response
  through verbatim, so the response had correct bytes and no content type, which Whop's
  verifier rejects. **Do not reintroduce that rewrite.** A static file wins over a rewrite
  in Vercel's routing order anyway, so re-adding it would be dead config contradicting
  the file.
  Also: it must be served, not redirected — Apple requires unmodified contents from our
  own domain, so a 301/302 fails the same way a 404 does. Note `www.liftoffr.com`
  308-redirects to the apex via `middleware.js`, so **the domain registered with Whop
  must be the apex `liftoffr.com`**, never the www host.
  If a branch predates a change to any of this, **rebase before committing `vercel.json`**
  rather than committing a version built on the old file; a stale copy silently reverts
  it. Never resolve `vercel.json` by taking one side wholesale — merge your entry around
  whatever the Apple Pay mechanism currently is.

- **Checkout is Whop-hosted, not embedded, and that was deliberate.** On 2026-08-20 the
  embedded-checkout loader was removed from `/` and `/plan`: Apple would not register
  liftoffr.com for Apple Pay on embedded checkout (a Whop-side registration failure), while
  Whop's hosted checkout pages support Apple Pay with no domain verification at all. Every
  purchase CTA is now a plain `https://whop.com/checkout/plan_*` link, which works natively.
  The `.well-known` file and its `vercel.json` headers block are kept regardless, so
  restoring embedded checkout is a one-commit change if Whop ever fixes their side.
  This note used to live in an HTML comment on both pages and shipped to production, where
  it named the vendor's failure verbatim in View Source. Keep it here instead.

- **Copy corrections must be swept by component, not by page.** The same claim lives in
  duplicated blocks across surfaces; fixing the page you think owns it leaves the copies
  serving the old version. Three review rounds each caught the same correction surviving
  somewhere else. Before declaring a copy fix done, grep the phrase (and its wording
  variants) across the whole repo including `.md`, `.js`, `.txt`, `.py` and backups, check
  JSON-LD separately from visible copy, and re-grep afterwards rather than trusting the edit.
  `COPY_SWEEP_NOTES.md` has the failure table and the canonical sources.

- **Never `||` one notification destination onto another.** A payload carrying money —
  `BUY_PLAN.totalBudget`, tier dollar amounts, executed order sizes — must resolve to an
  explicitly-set variable or no-op with a log line. On 2026-08-20 `sendDiscordBriefing` read
  `DISCORD_BUY_ALERTS_WEBHOOK || DISCORD_OPS_WEBHOOK`; buy-alerts did not exist, ops did, and
  two of the five webhooks in the Discord server point at a free-member-visible channel. The
  same pattern let `runDailyDCA` reach for the read-only sync key when the trade key was unset,
  defeating the key separation that stops a read-only credential placing live orders. Both are
  now explicit-or-skip. A hardcoded, named, checked-in default for a non-sensitive destination
  (the channel IDs in `api/whop-webhook.js`) is a different thing and is fine.

- **`HANDOVER.md` at the repo root is the current state of play** — what is done, what is waiting
  on Torin with exact click paths, the open decisions, and the standing hazards. Read it before
  starting work and update it when something moves out of "waiting on Torin".

- **Every file in this repo is served publicly.** `/lead-magnet/bear-market-buy-zone.pdf` returns
  200 — fine, it is a free magnet. The $29 buy-plan PDF is a paid deliverable and must never be
  committed unignored; `product/` and `*.paid.pdf` are excluded in `.vercelignore` for that
  reason. Before committing any binary, ask whether someone paid for it.

## Design language (preserve — never break)
- Homepage/blog/links: near-black `#080808`, cards `#111111`, borders `#1e1e1e`, **brand red `#e63946`**, muted `#777`.
- /cycle + /dashboard: navy `#060910` glass — frosted cards, backdrop-blur(14px), radial glows; green `#26d07c`, amber `#e8b339`, blue `#4d8df0`. Semicircular verdict gauge + Four Pillars.
- Loud CTAs = solid red. Proof accents = green. Apple-level hierarchy: big numbers, generous whitespace.

## Brand voice (see BRAND_VOICE.md if present)
- First-person "I" (Torin). Story-driven: 2017 mining rig (Minnesota, caught fire) → $30K round-trip loss 2022 "between two college classes" → DCA'd out clean at the Oct 6 2025 top ($124,824 — canonical anchor).
- Anti-influencer, anti-leverage, anti-hype. Data + receipts, not lambos-and-hopium. Hardware-wallet custody discipline non-negotiable.
- No AI filler ("moreover", "furthermore"). No fabricated testimonials/results. No "guaranteed returns" or price predictions as certainty — education framing, "not financial advice."
- Exception: single-slide IG "banger" proof drops get cocky Tate-coded edge (asymmetry flex). Site/course/email copy stays grounded.

## Analytics
- GA4 `G-015PKWM24J` inline on every page (NOT via GTM). GTM `GTM-K5B4BX46` = Whop pixel only. Clarity `wl50cvbc1c`. New page ⇒ add GA4 + Clarity snippets manually.
- Events: cta_clicked (destination param), lead_magnet_submit, lead_captured, exit_intent_*, checkout_confirmed, purchase. (begin_trial/trial_converted retired 2026-08-02.)
- Query: `curl -u admin:<DASHBOARD_PASSWORD> "https://liftoffr.com/api/analytics?src=ga4&report=funnel|traffic&days=30"`.

## Discord
- Guild `1380245793780531351`, bot = Mission Control (admin), Discord MCP connected. 114 channels, ~58 members.
- Course lives as rich embeds in per-lesson channels (source: `~/liftoffr-course/content/` md). MCP read-messages shows embeds as empty `content` — NOT actually empty.
- Never delete channels — archive/rename. Gating: Course=Core+, Signals/Intel=Pro+ (daily-market-brief=Core), elite-*=Elite. Grandfathered: Founding Circle (56 comped friends).
