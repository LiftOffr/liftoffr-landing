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
| 31 | api/jarvis.js | Fixed Opus 4.8 → model ladder: JARVIS_MODEL env → claude-fable-5 → claude-opus-4-8, auto-fallback on model-unavailable errors, winner cached per lambda |
| 32 | dashboard/index.html (+v2 sync) | JARVIS daily auto-briefing: first open of the day runs it, cached in localStorage, later opens replay instantly with timestamp+model |
| 33 | dashboard/index.html (+v2 sync) | NEW action bar above JARVIS (research: NN/g top-left rule + fintech next-action pattern): STANCE word, score with Δ-vs-yesterday (localStorage day snapshot), BTC vs 200W MA, next tier with %-away or HIT flag, dry powder. Refreshes every 2 min |
| 34 | dashboard (+v2 sync) | V3 design layer — Apple×JARVIS×Bloomberg: native SF Pro type + tabular numerals, deeper cool palette, finer glass materials, action bar → sticky HUD command strip w/ ice-blue hairlines + scan sweep, JARVIS panel scanline HUD treatment. Cascade-override layer; zero logic touched. Backup: dashboard/index.html.backup-v3design-20260702 |
| 35 | daily_reel.py + com.liftoffr.daily-reel.plist (STAGED, not loaded) | NEW auto-generated daily reel: 15s 1080×1920 h264 from live score (hook → score count-up + stance reveal → stats → "comment PLAN" CTA), stance-matched caption, publishes as standard IG REEL (not trial — doesn't burn editor's cap) via Discord-CDN URL + posts to #daily-market-brief. Renders in ~3s. Guaranteed 1-post/day floor independent of editor supply |

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

---

## 2026-08-07 — Revenue-review execution (REVENUE_REVIEW_2026-08-07 items 2–5)

| # | Surface | Before → After |
|---|---|---|
| 1 | plan/index.html | First CTA at ~70% scroll → buy button in the hero, above the fold on mobile (375px verified) |
| 2 | plan/index.html | No risk reversal → "Read it for 30 days first" refund block + matching FAQ entry. Framed as try-then-decide per AUDIT_NOTES ("try it free" > "money-back guarantee") |
| 3 | plan/index.html | Non-buyers cost 1 click to /free → inline `/api/subscribe` form (magnet: `buyzone`), same payload shape as the /free form, verified posting correctly |
| 4 | plan/index.html | "$29" unanchored → anchored against the $197 Cycle System |
| 5 | plan/index.html | Both checkout CTAs reported the same `cta_position` → `data-cta-slot` (hero / price_block) so GA4 separates them |
| 6 | welcome-plan/index.html | /playbook had zero inbound paths sitewide → one line post-purchase, UTM-tagged `welcome_plan / post_purchase` |
| 7 | free/index.html | Discord CTA was a dead `#` → verified never-expiring invite (guild 1380245793780531351 confirmed via Discord API) |
| 8 | RATE_CARD.md | Did not exist → brand-partnership rate card, $1,500–3,500 tiers per master plan §9, with the §9 brand filter and FTC disclosure terms |
| 9 | BRAND_DEAL_TARGETS.md | Did not exist → 20 paid targets split Tier A (brand-fit crypto tools) / Tier B (audience-fit lifestyle-auto), outreach order + cold email template |
| 10 | .git/config | GitHub PAT in plaintext in the remote URL → stripped; remote is now a clean https URL |

**Not touched (require founder decision):** all prices and payment logic; the $49/mo subscription model (killed 2026-08-02, not revived); `/system` page (still 404, bridge still `display:none`).
