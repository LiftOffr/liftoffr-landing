# MEASUREMENT.md — did the sweep work?
STATUS: Baseline locked 2026-07-01. Review 2026-07-15 (2wk) and 2026-07-29 (4wk). Run: `curl -u admin:<pw> "https://liftoffr.com/api/analytics?src=ga4&report=funnel&days=14"` (+ traffic report), or hand this file back to Claude.

## Baseline (30d ending 2026-07-01)
55 users · 62 sessions · 86 PV | IG bio 38 sess @ 60.5% eng | TikTok 6 @ 4.8s | funnel: 24 scroll → 6 cta_clicked → 2 lead_captured → 0 begin_trial → 0 purchase | paying subs ~1 | Discord 58 members | list ~12 contacts

## What each change should move
| Change | Metric to watch | Signal it worked |
|---|---|---|
| value-stack + proof strip (pricing) | `section_viewed` value_stack→pricing progression; cta_clicked w/ `pricing_*` | pricing CTA clicks up vs 6/mo baseline |
| proof tracking + dual proof paths | cta_clicked destination:'proof'; /track-record PV share (was ~11%) | proof views >25% of homepage users |
| checklist target=_blank fix + live score | lead_magnet_submit & begin_trial from utm_source=instagram | captures >5/mo (was 2); ANY begin_trial |
| email 3-way menu | clicks on utm_content=menu_* (Resend + GA4) | any menu clicks; trial starts w/ utm_medium=email |
| brief retimed to 8am MT | (trust fix — no direct metric) | zero "when's the brief?" questions; brief posts 8am MT |
| #start-here + archive | first-24h: intro posts + brief reads by new joiners | new trialists post intro within 24h |
| /cycle GTM+Clarity | /cycle sessions + Clarity recordings now visible | data flowing (was blind) |

## 2-week checklist (2026-07-15)
- [ ] Funnel report: begin_trial > 0? If still 0 with >50 IG sessions → the trial offer itself (not friction) is the problem — escalate to Tier 3 ($1 trial test / offer reframe).
- [ ] cta_clicked total vs 6 baseline; destination split (trial vs proof).
- [ ] lead_captured vs 2 baseline; utm_source=instagram share.
- [ ] IG bio engagement rate vs 60.5% (did live-score strip help?).
- [ ] Verify daily brief actually posting 8am MT (check #daily-market-brief timestamps).
- [ ] Torin: start-here posted+pinned? spam deleted? → if not, do now.

## 4-week checklist (2026-07-29)
- [ ] Full funnel: land → scroll → CTA → lead → trial → paid. Any paid conversion = document the path (source/medium/content) and double down.
- [ ] Email: menu_* click-through by campaign; list growth vs ~12.
- [ ] Discord: # of new-member intros; first-24h activity of any trialists (churn-window health).
- [ ] Clarity session recordings on /checklist + /#pricing: watch 5 — where do people stall?
- [ ] Decide Tier 3: free-tier habit funnel / daily one-word signal / $1 trial — pick ONE based on where the 4-week funnel actually leaks.
- [ ] Re-baseline this file with fresh 30d numbers.

One page, on purpose. Optimization without this loop is just redecorating.
