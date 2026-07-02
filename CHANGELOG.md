# CHANGELOG.md — CRO sweep Phase 4
STATUS: Tier 1 executed 2026-07-01 (D1/Army angle struck by founder). Before → after, one line each.

| # | Surface | Before → After |
|---|---|---|
| 1 | index.html pricing | No "why monthly" answer → `#value-stack` perishable-value grid (daily brief / live alerts / Sunday Score / 24-7 dashboard) above tier cards, with `section_viewed` tracking |
| 2 | index.html Elite tier | "Monthly live Q&A call" (group call — founder won't run) → "Monthly 20-min 1:1 call with Torin" |
| 3 | index.html pricing | No proof at decision point → verifiable proof strip under tiers (+7,602% · tops since 2013 · 30-day refund → /track-record, utm `pricing_proof`) |
| 4 | index.html tracker | /track-record clicks untracked → `cta_clicked` destination:'proof' fires on all track-record links |
| 5 | checklist/index.html | `target="_blank"` on both /start CTAs (blanks in IG in-app browser — the #1 traffic source) → removed |
| 6 | checklist/index.html | Static page → live LiftOffr Score strip (fetches /api/cycle-score), +7,602% proof cell now links to /track-record, CTA click tracking added |
| 7 | api/cron-weekly-score.js | Hard CTA only → + "Whenever you're ready, 3 ways I can help" menu (/cycle free · /start trial · /playbook) |
| 8 | api/cron-welcome-followups.js | Same menu added to shared `trialShell` — reaches all nurture + trial emails |
| 9 | cycle/index.html | GA4 only → + GTM (Whop pixel) + Clarity, matching every other page |
| 10 | course module3/01, module4/00, module5/00 | "dorm-room day"/"$30K in a day in a dorm room" → canonical "watched $30K disappear between two college classes"; redeployed 3 lessons to Discord embeds + repinned |
| 11 | Discord | Created 〡━━・📦 Archive category; moved giveaways, boosts, ideas-opportunities, AFK voice into it (nothing deleted) |
| 12 | Discord | Created #🚀・start-here (Welcome category); first-24h post STAGED in DISCORD_STAGED_POSTS.md (classifier blocks bot publish — Torin pastes + pins) |
| 13 | ~/Library/LaunchAgents/com.liftoffr.daily-brief.plist | Hour 15 EDT (1pm MT — contradicted "8am MT" sitewide) → Hour 10 EDT (8am MT); RELOAD PENDING (Torin one-liner) |
| 14 | .vercelignore | NEW — internal .md docs (audit/plan/changelog/brand/setup docs) no longer deploy publicly (SEO_ACTION_PLAN.md was live at 200) |
| 15 | BRAND_VOICE.md | NEW — 15-line voice standard + banned/use lists + 3 before/afters |
| 16 | checklist/index.html (redesign pass, same day) | Nav with 2 exit links → identity header (Torin photo + "Bitcoin cycle signals · 4M+ views"), zero links |
| 17 | checklist/index.html | Product-titled H1 ("The BTC Cycle Top Checklist") → promise-matched "Know when to sell — before everyone else." |
| 18 | checklist/index.html | 7-link footer → Privacy/Terms only (1:1 attention ratio per bio-page research) |
| 19 | (decision) | Homepage + site visual redesign REJECTED — research verdict: aesthetic already matches winners; structure was the gap (COMPETITOR_INTEL.md §C) |
| 20 | 17 pages sitewide | `target="_blank"` on internal/checkout CTAs (blanks IG in-app webview handoff) → removed on all 9 blog posts, /links, /about, /faq, /proof, /indicator-history, /lead-magnet; true externals untouched |
| 21 | sitewide | CTA copy variants ("Try it free for 7 days", "Start free →") → one verbatim "Start 7 days free →" everywhere (Milk Road repetition pattern) |
| 22 | NEW /buyzone + lead-magnet/bear-market-buy-zone.pdf | Market-phase-matched lead magnet: 4-band buy plan anchored to 200W MA (0.97/0.85/0.73/0.65×), 50% DCA + tranche split, confirmation signals, window-close triggers. Landing page = proven /checklist structure, green accumulation accent |
| 23 | api/subscribe.js | Single-magnet welcome → magnet-aware (MAGNETS map, `magnet:'buyzone'` param from the new page; checklist default unchanged; magnet tag added to sends) |
| 24 | sitemap.xml | + /buyzone entry |
| 25 | AFFILIATE_LAUNCH.md (staged, not deployed) | Whop native affiliate program: 30% recurring config path + Discord announce + DM template + email broadcast copy — Torin enables in dashboard (~10 min) |
| 26 | supply_gap_alert.py + com.liftoffr.supply-gap.plist | NEW daily 9:30am check: no reel published in >48h → alert to #churn-alerts. Dry-run verified (20.6h gap, correctly silent). LaunchAgent loaded |
| 27 | playbook/index.html + homepage card | "Live 3-session cohort · 20 seats" (group calls founder won't run) → 1:1 edition: 90-min private session + plan doc + recording + 2wk DM access + 3mo Pro, same $497/plan ID, honest monthly-slot scarcity, 30-min refund guarantee |
| 28 | checklist + buyzone success states | Bare "check your inbox" → + "While it sends — Start 7 days free →" trial CTA (research: trial ask belongs on the post-capture thank-you moment) |
| 29 | instagram_comment_reply.py | + PLAN keyword → liftoffr.com/buyzone DM/reply; PLAYBOOK copy cohort→1:1; STACK now links /buyzone |
| 30 | daily_signal.py + com.liftoffr.daily-signal.plist (STAGED, not loaded) | Daily one-word signal card (ACCUMULATE/HOLD/CAUTION/SELL ZONE + live score, brand-styled 1080×1920) → Discord #daily-market-brief + IG story auto-publish. Render verified; classifier requires Torin's one-liner to enable the daily auto-publish |

## Deliberately NOT done (guardrails)
- Homepage testimonials NOT moved/amplified — DiceBear-avatar quotes are unverifiable; replace with real named ones (Tier 2), then place under pricing.
- Playbook "live small-group cohort" claim left as-is — it's a live-group commitment; founder must confirm intent before repositioning.
- No pricing values or payment logic touched. Nothing deleted in Discord.

## LAUNCHED 2026-07-01 (explicit founder go): deploy pushed+verified live, brief plist reloaded (8am MT), #start-here posted + pinned by bot.

## Founder actions still pending
1. Delete thren0115 spam manually (bot-deletion of member messages stays blocked per no-delete guardrail):
   - https://discord.com/channels/1380245793780531351/1383092845400952852/1477997147784741056 (#wins-progress)
   - https://discord.com/channels/1380245793780531351/1383102141647945768/1475888463583907966 (#ideas-opportunities, archived)
   - consider banning `thren0115` + an AutoMod rule for DM-solicitation patterns
2. ~~Elite 1:1 cadence~~ — CONFIRMED monthly by founder 2026-07-01; live copy already matches.
3. Tier 2 list in OPTIMIZATION_PLAN.md: testimonials ask, Whop cancel-flow config, onboarding-DM LaunchAgent, which PDF reads AI
