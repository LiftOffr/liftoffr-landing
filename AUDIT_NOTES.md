# AUDIT_NOTES.md — LiftOffr CRO/UX Sweep
STATUS: Phases 0-5 COMPLETE + LAUNCHED 2026-07-01 (deploy live+verified, brief retimed 8am MT, #start-here posted+pinned). PENDING on Torin: delete 2 thren0115 spam msgs (links in CHANGELOG.md), Tier 2 inputs. Next session: MEASUREMENT.md reviews on 07-15 / 07-29.

## Phase 0 — Recon (verified live 2026-07-01)

### Repo / stack
- `~/liftoffr-landing/` — plain HTML + vanilla JS on Vercel (Hobby: **12 serverless fn cap — at cap**, `api/_*.js` don't count). git push to main = auto-deploy. `youtube_intel.py` auto-pushes `api/_cowen-data.js` (has broken deploys twice — check first on mystery failures).
- Pages: `/` home, `/links` (bio hub), `/checklist` (lead capture), `/cycle` (public dashboard), `/track-record` (backtest proof), `/playbook` ($497 sales page, noindex), `/blog` (9 indicator posts), `/about /faq /proof /privacy /terms /welcome`, `/dashboard` (PRIVATE, basic-auth, Torin's Coinbase data — never link publicly).
- APIs: subscribe, cron-weekly-score, cron-welcome-followups, whop-webhook, btc-price, cycle-score, analytics (auth-gated), founder-count (vestigial), coinbase-*, bank, jarvis.

### Funnel (as wired today)
- Social bios: IG/TikTok/YT/X → `/ig /tt /yt /x` → **/checklist** (email capture, UTM'd per platform).
- `/start` + `/free` → Whop cardless 7-day trial `plan_zNprCbJjAquZ6` ($0, no card, auto-expires day 7). 8 `/start` CTAs on homepage + embedded Whop checkout modal (homepage only; webviews fall back to hosted).
- Pricing: Core $49/$399 · Pro $99/$799 (featured) · Elite $249/$1990 + Playbook $497 one-time. 6 checkout links on homepage verified.
- Whop webhook → Discord tier role (Core/Pro/Elite) + GA4 events + Resend trial audience. `/welcome` = post-checkout page → Discord.
- Email: Resend. Free nurture 6 emails (D0/1/3/5/7/18), trial nurture (D1/3/6 + D8-9 winback), Sunday Score weekly. Crons daily 15:00/17:00 UTC.
- IG comment→DM bot (keywords SCALE/STACK/SCORE/CHECKLIST/PLAYBOOK/LIFTOFFR) every 30min. Reels auto-post pipelines (IG trial reels ~4/day cap, Buffer→TikTok/YT/X).

### Discord (guild 1380245793780531351, bot=Mission Control, MCP live)
- 114 channels / **58 members** (~1 paying, 56 grandfathered "Founding Circle", tiers: Core/Pro/Elite roles webhook-assigned).
- Structure: Welcome(3) + Info + LIFTOFFR-HUB(6 incl elite-lounge, elite-qna) + Signals & Alerts(5) + Market Intelligence(4) + Community(8) + Modules 1-6 (~45 lesson channels) + LiftOffr Life/1on1 + Staff/Logs/AFK/Tickets.
- Course = rich embeds (MCP `read-messages` shows `content:""` for embeds — NOT empty, known trap).
- Gating: Course=Core+; Signals+Intel=Pro+ (daily-market-brief=Core exception); elite-*=Elite.
- **Welcome experience = generic Koya bot "Greetings @user!🎉🎉🎉"** — no START-HERE routing, no first-24h path. Onboarding DM script exists (`onboarding_dm.py`) but LaunchAgent never installed (classifier-blocked; Torin one-liner pending).
- Channel bloat: 114 channels for 58 members. Dead: giveaways, boosts, AFK voice, ideas-opportunities (low traffic). DON'T DELETE — archive/rename only.

### Design language (verified from CSS — preserve)
- Homepage/blog/links: near-black `--bg:#080808`, card `#111111`, border `#1e1e1e`, **red accent #e63946**, white text, muted #777.
- /cycle + /dashboard: navy `#060910` glass (frosted cards, backdrop-blur, radial glows), green #26d07c, amber #e8b339, blue #4d8df0. Semicircular verdict gauge + Four Pillars + sparklines.
- NOTE: founder described "dark teal, dotted grid" — actual tokens are near-black/navy + red; gauge + Four Pillars confirmed on /cycle. Verify with founder before any palette work.

### Instrumentation — GOOD (not a gap)
- GA4 G-015PKWM24J on ALL pages; GTM-K5B4BX46 (Whop pixel) + Clarity on all EXCEPT /cycle + /dashboard (minor: /cycle lacks GTM/Clarity).
- Events live: page_view, scroll, cta_clicked (w/ destination param), lead_magnet_submit, lead_captured, exit_intent_*, begin_trial, checkout_confirmed, trial_converted, purchase (webhook-side).
- GA4 API access works (service-account JWT, permanent). Dashboard basic-auth.

### Email — EXISTS (not a gap)
- Resend, 2 audiences (Free ~12 contacts, Trial), verified sender torin@liftoffr.com, unsubscribe compliant. Lead magnet = 8-indicator Cycle Top Checklist PDF.

### BASELINE (GA4 30d, pulled 2026-07-01)
- **55 users / ~62 sessions / 86 page_views.**
- Sources: IG bio 38 sess (60.5% eng, 62s avg) · l.instagram 7 (14% eng) · TikTok 6 (50% eng, 4.8s) · direct 4 · google organic 3 · X 2.
- Funnel users: 55 land → 24 scroll (44%) → **6 cta_clicked (11%) → 2 lead_captured (3.6%) → 0 begin_trial → 0 purchase**.
- ⚠️ IG engagement 60% now vs 97% in May — decline coincides with bio repoint /links→/checklist (2026-06-14). Investigate in Phase 2.
- Discord 58 members. Paying subs: ~1 ($29 grandfathered) as of 2026-06 — CONFIRM via Whop before Phase 4. MRR ≈ $29.
- Cycle score today: 26.4 "accumulation" (buy zone) — market context for copy.
- Course content: `~/liftoffr-course/content/` ~52 md pages (source of truth; deploys to Notion + Discord embeds).

### Founder constraints (from brief, 2026-07-01)
- NO live group/weekly calls. WILL do 1:1 calls (scarce — position as onboarding call, annual perk, or monthly allocation).
- Course reads as unedited AI text → flag sections, propose rewrite approach (Phase 2), don't rewrite yet.
- **NEW founder angle: D1 athlete / Army officer** — not in any prior memory (prior arc = mining rig 2017/$30K round-trip/2025 clean exit). Evaluate use in Phase 2; VERIFY details with founder before publishing.
- No fabricated testimonials/claims. No "guaranteed returns"/price-prediction certainty. Education framing, "not financial advice."
- Don't touch payment logic or pricing values without per-item confirmation.

### Open questions for founder (carry to Phase 3)
1. Which "course PDF"? (Discord PDFs were deleted May 2026; course = Discord embeds + Notion. A separate PDF export?)
2. D1 athlete / Army officer details — what's true & usable?
3. Confirm current paying-sub count + any trials since 2026-06-14.

## Phase 2 — Audit scorecard (vs COMPETITOR_INTEL.md)

- **Landing page: B+.** Hero specific + credible ("8 indicators… every top since 2013"), fast (99KB, 0.4s TTFB, zero external blockers), OG image live. GAP: proof asset (/track-record, the best weapon) gets ~11% of views; no dual CTA (BM Pro pattern); testimonials not under pricing; 3-card testimonials are avatar-style, not named+outcome.
- **Offer architecture: C.** Recurring value EXISTS (daily brief, signals, alerts, live score, weekly email) but pricing sells feature lists — nowhere answers "why pay monthly?" IU pattern says: reframe tiers around PERISHABLE cadence. 1:1 constraint fit: onboarding 1:1 for annual purchases + quarterly 1:1 as Elite perk + hard monthly cap — never unlimited. Discord already has book-your-1-on-1 infra (LiftOffr Life category).
- **Course: B / mystery.** Markdown source is human, story-driven, specific — AI-filler scan: 1 hit in 52 files. Voice bug: "lost $30K in a day in a dorm room" (module4/00_intro.md) vs canonical "between two college classes." OPEN: which PDF does founder mean? Don't rewrite until identified.
- **Checkout: A-.** /start → Whop hosted = 1 step; homepage embeds checkout modal (0 redirect); cardless trial = no card wall. Friction is NOT the blocker — traffic + trial-awareness is.
- **Discord: D on onboarding, C overall.** Generic Koya "Greetings!🎉" only; no START-HERE; onboarding DM script built but never installed; 114 channels/58 members = bloat; #wins-progress stale since March + contains DM-bait spam + off-brand posts (Kalshi bot flexes, Tate/whisky jokes clash with anti-hype education brand); no rituals/recurring events; no visible upgrade path in-server.
- **Copy voice: B.** Site consistent. Discord community posts drift off-brand. BRAND_VOICE.md needed as the enforcement artifact (Phase 4 deliverable).
- **Trust: B+.** Track-record page is best-in-niche transparency; refund copy present on 4 pages. Founder credibility: origin story used; D1 athlete/Army officer angle unused — VERIFY then deploy (discipline angle fits brand).
- **Social bridge: C-.** IG (60% eng, down from 97% since bio→/checklist 6-14) → squeeze page converting ~5% of IG sessions (benchmark 15-30%). Checklist page doesn't visually continue the IG content (lifestyle/proof) → expectation mismatch. TikTok 4.8s avg = still broken experience.
- **Email ladder: A-.** Full stack exists (capture→6-email nurture→weekly Score→trial nurture→winback). GAP: no Welsh-style soft CTA menu; single lead magnet.
- **Retention/churn: C.** Whop cancel save-offers unconfigured (WHOP_SETUP_CHECKLIST.md pending, dashboard-only); dunning = Whop defaults; winback email exists; first-7-day path exists in email but NOT in Discord (no first-24h experience).
- **Technical: A.** Fast, sitemap/robots/llms.txt fine, meta solid. Minor: /cycle + /dashboard lack GTM/Clarity; daily brief advertised "8am MT" in hero but cron fires ~1pm MT — TRUST BUG, needs decision (move cron vs fix copy).
