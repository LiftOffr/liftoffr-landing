# OPTIMIZATION_PLAN.md — LiftOffr CRO Sweep
STATUS: Phase 3 COMPLETE (2026-07-01). AWAITING FOUNDER APPROVAL. Approve/strike items below, then Phase 4 executes Tier 1. Nothing ships until approval. Payment logic + pricing values untouched without per-item confirmation.

Baseline (30d): 55 users → 6 CTA clickers → 2 leads → 0 trials → 0 purchases. MRR ≈ $29. Ranked by impact × ease.

## TIER 1 — Ship now (no founder input needed; I execute in repo/Discord)

1. **Pricing reframe: answer "why pay monthly?"** — Rewrite tier cards around perishable deliverables (daily 8-indicator brief, real-time alerts, live cycle score, weekly market update) instead of feature lists; add a "what you get every single week" row above the cards.
   Why: #1 offer gap; IU/Cowen prove cadence-as-product converts; zero new production needed. Effort: S (2-3h, index.html only)

2. **Dual CTA in hero: trial + proof.** Put "See the live backtest → $1.88M" secondary CTA beside the /start button (BM Pro pattern).
   Why: track-record is the most defensible asset and 89% of visitors never see it. Effort: S (<1h)

3. **Move testimonials directly under pricing + reframe with outcomes** (existing, true ones only; placeholders marked for Tier 2 sourcing).
   Why: proof-at-decision-point is the single most consistent pattern across all 9 competitors. Effort: S (1h)

4. **/checklist continuity upgrade:** add live cycle-score widget + track-record proof strip + "after the PDF" trial path so the page continues the IG content instead of a bare form.
   Why: bio page converts ~5% vs 15-30% benchmark; IG engagement fell 97%→60% after bio repoint — expectation mismatch is the prime suspect. Effort: M (3-4h)

5. **Discord first-24h path:** stage a START-HERE / claim-your-first-win message set (pinned welcome → read today's brief → intro yourself → lesson 1 → book onboarding), wire welcome message to it. I stage all content; you approve the member-facing posts (classifier will gate me posting live).
   Why: onboarding = generic bot greeting today; first-7-day value contact is the churn window. Effort: M (staging 2h + your 10min to post)

6. **Discord hygiene (archive, never delete):** rename+lock dead channels (giveaways, boosts, AFK, ideas-opportunities) into a 📦・archive category; flag the #wins-progress spam messages for your manual delete (MCP can't delete).
   Why: 114 channels for 58 members reads dead-on-arrival to a new trialist. Effort: M (2h)

7. **Course voice bug:** fix "lost $30K in a day in a dorm room" → canonical "between two college classes" (module4/00_intro.md + grep sweep) and redeploy the affected lesson embeds.
   Why: story consistency is the brand spine. Effort: S (<1h)

8. **Email soft-CTA menu (Welsh):** append "Whenever you're ready, 3 ways I can help" footer (free score → trial → Playbook) to Sunday Score + nurture emails.
   Why: email converts 8-12% vs 1-2% social; permission CTA compounds at tiny list size. Effort: S (1-2h)

9. **Instrumentation completeness:** GTM+Clarity on /cycle; every element changed above fires cta_clicked/lead events with destination params (bundled into each edit).
   Why: Phase 5 measurement depends on it. Effort: S (bundled)

10. **BRAND_VOICE.md** (~15 lines: tone rules, banned words, rhythm, 3 before/after pairs) written from the site + course voice as I touch copy.
    Why: fixes "AI-sounding copy" at the source for every future surface. Effort: S (Phase 4 deliverable)

## TIER 2 — This week (needs your input)

1. **1:1 call packaging** — Proposal: free 20-min onboarding call for every ANNUAL purchase + quarterly 1:1 for Elite + hard cap (e.g. 4/mo). Decide the allocation. Why: highest-value perk you're willing to give; scarce by design. Effort: your decision + S copy change
2. **Daily-brief trust bug** — hero promises 8am MT; bot posts ~1pm MT. Move the cron or change the copy — pick one. Effort: 5min
3. **Source 3-5 named testimonials with numbers** from Founding Circle / Playbook buyers (I draft the ask-DM, you send). Why: current avatar testimonials are the weakest proof on the page. Effort: your 30min
4. **Bio-link decision:** keep /checklist vs revert to /links vs upgraded /checklist (T1-4). I propose: ship T1-4, watch 2 weeks of UTM data. Effort: your call
5. **D1 athlete / Army officer angle** — verify facts + what you're comfortable publishing; I'll weave into /about + hero credibility line (discipline → system fits the anti-hype brand). Effort: your 15min + S
6. **Whop dashboard config:** cancellation save-offer + reasons + dunning (see api/WHOP_SETUP_CHECKLIST.md). Why: retention leak-proofing before volume arrives. Effort: your 20min
7. **Onboarding DM LaunchAgent** — built, never installed; one-liner ready. Effort: your 2min
8. **Which "course PDF" reads as AI?** Point me at the artifact — the markdown course scans human. Then I propose the rewrite approach. Effort: your 5min

## TIER 3 — Strategic (bigger bets, discuss after Tier 1/2 data)

1. **Free Discord tier as habit-builder** (Adonis): open daily-brief-teaser to free joiners, role-locked everything else — changes paywall architecture, needs careful gating.
2. **Daily one-word cycle signal** (Glassnode Vector): one BUY/HOLD/CAUTION/SELL-ZONE word posted daily to Discord/IG story/email — habit hook; mostly exists in bot infra, needs packaging.
3. **$1 trial test** (Milk Road) vs cardless — only after trial volume exists to compare.
4. **Alert-quantity tier gating** (CryptoQuant): differentiate Core/Pro/Elite by alert depth — partially done via channels.
5. **Quarterly billing for Elite** (RV) + discount laddering copy (IU: quarterly -X% / annual -Y%).
6. **Course packaging refresh** (polished member PDF per module) — after the voice pass.

STOP — awaiting approval. Reply with e.g. "Tier 1: all approved" or strike items ("skip 6"), plus answers to Tier 2 as available.
