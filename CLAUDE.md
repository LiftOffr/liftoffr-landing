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
| `/` (index.html) | homepage: hero → proof bar → how-it-works → testimonials → pricing (Core/Pro/Elite) → FAQ. 8 `/start` CTAs + embedded Whop checkout modal |
| `/links` | link-in-bio hub |
| `/checklist` | lead-capture landing (current bio-link destination for IG/TikTok/YT/X via /ig /tt /yt /x) |
| `/cycle` | PUBLIC live cycle dashboard (gauge, Four Pillars, indicators) |
| `/track-record` | backtest proof: $50/wk → $1.88M vs $217K DCA, +7,602%, 417 start dates |
| `/playbook` | $497 Cycle Playbook sales page (noindex) |
| `/blog/*` | 9 indicator SEO posts |
| `/welcome` | post-checkout success → Discord |
| `/dashboard` | PRIVATE (basic-auth) founder dashboard |

## Funnel wiring
- `/start` `/free` → Whop cardless 7-day trial `plan_zNprCbJjAquZ6` (no card, auto-expires).
- Tiers: Core $49/mo `plan_yi7i0rC444Ssk` ($399/yr `plan_kBe5idN105Ipc`) · Pro $99 `plan_JnWiKWtwzlTVR` ($799 `plan_nFxTZFYUqmMkx`) · Elite $249 `plan_dMb9YIKbWN7ck` ($1990 `plan_b0whXHoSzqDL1`) · Playbook $497 `plan_uIpPdsPTSHdTp`.
- Whop webhook (`api/whop-webhook.js`) assigns Discord tier roles + fires GA4 events + adds to Resend trial audience.
- Email: Resend — free nurture (D0/1/3/5/7/18), trial nurture (D1/3/6/8-9), Sunday Score. Crons in vercel.json (Hobby = 1/day per cron max — hourly schedules break ALL deploys).
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
- Events: cta_clicked (destination param), lead_magnet_submit, lead_captured, exit_intent_*, begin_trial, checkout_confirmed, trial_converted, purchase.
- Query: `curl -u admin:<DASHBOARD_PASSWORD> "https://liftoffr.com/api/analytics?src=ga4&report=funnel|traffic&days=30"`.

## Discord
- Guild `1380245793780531351`, bot = Mission Control (admin), Discord MCP connected. 114 channels, ~58 members.
- Course lives as rich embeds in per-lesson channels (source: `~/liftoffr-course/content/` md). MCP read-messages shows embeds as empty `content` — NOT actually empty.
- Never delete channels — archive/rename. Gating: Course=Core+, Signals/Intel=Pro+ (daily-market-brief=Core), elite-*=Elite. Grandfathered: Founding Circle (56 comped friends).
