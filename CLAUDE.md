# CLAUDE.md — liftoffr.com

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
| `/playbook` | $997 Cycle Playbook 1:1 sales page (noindex, 4 spots/month) |
| `/blog/*` | 9 indicator SEO posts |
| `/welcome` | generic post-checkout success → Discord |
| `/plan` | $29 one-time "My Bear Market Buy Plan" sales page (plan_MntgjXJaQnGsW) |
| `/free` | free onramp: Discord invite + Sunday Score capture |
| `/welcome-plan` | $29 plan post-purchase success page |
| `/dashboard` | PRIVATE (basic-auth) founder dashboard |

## Funnel wiring (post-pivot 2026-08-02 — truth: LIFTOFFR_MASTER_PLAN.md)
- Offer ladder: FREE (/free: open Discord + Sunday Score) → $29 one-time "My Bear Market Buy Plan" `plan_MntgjXJaQnGsW` (/plan) → $197 one-time "The Cycle System" ($147 founding, 50 seats; Whop plan TBD) → $997 "The Cycle Playbook" 1:1 `plan_uIpPdsPTSHdTp` (/playbook).
- DEAD (grandfathered only, hidden in Whop): Core/Pro/Elite subs, 7-day trial, annual plans. `/start` and `/join` now redirect to `/plan`.
- Whop webhook (`api/whop-webhook.js`) assigns @Plan addon role + legacy tier roles + fires GA4 purchase (item_id per plan) + adds $29 buyers to Resend "Plan Buyers" audience. Trial paths are hard-retired no-ops.
- Email: Resend — free nurture (D1/3/5/7/18, re-aimed at the $29 plan), Sunday Score. Trial nurture RETIRED (hard-disabled in code). Crons in vercel.json (Hobby = 1/day per cron max — hourly schedules break ALL deploys).
- DO NOT touch payment logic or pricing values without explicit founder confirmation per item.

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
