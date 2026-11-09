# 2026-11-09: Funnel audit (views with no sales) and fixes

Full report (PDF): `~/Documents/liftoffr-funnel-audit-2026-11-09/LiftOffr-Funnel-Audit-2026-11-09.pdf`.
All numbers pulled live on 2026-11-09 from the IG Graph API, Whop API, GA4 Data API and the
nightly-synced `~/liftoffr-video/REEL_LEDGER.csv` (spot-checked against the API).

## Funnel, Aug 30 to Nov 9 (IG account insights)
10,507,332 views -> 12,386 profile visits -> 4,479 follows (1,150 unfollows) and 164 link taps
-> about 94 consented GA4 sessions from Instagram -> 7 checkout clicks (all Sept 15-22; 6 India, 1 Russia)
-> 0 Whop payments. No payment attempt of any kind has been recorded on Whop since Sept 1.

## Decisions and changes
| # | Where | Change | Why |
|---|---|---|---|
| 1 | discord-rebuild `src/drive_to_instagram.py` (commit 78e2d92, workspace repo) | Trial reel `graduation_strategy` MANUAL -> SS_PERFORMANCE (env `IG_TRIAL_GRADUATION=MANUAL` reverts) | 2 of 785 media are shared to feed. Followers never saw new reels; profile visitors saw 15 posts, mostly 2018-2025 personal photos. Meta docs confirm SS_PERFORMANCE auto-shares winners; there is no API to graduate past reels. |
| 2 | `css/lifestyle.css` + cache bump on 5 pages (commit 32b76f9) | Mobile hero portrait 390px -> min(240px, 32vh) | At 390x700 the headline and $29 CTA were below the fold for bio visitors. Now both show in the first screen. Desktop unchanged. |
| 3 | `vercel.json` (commit 32b76f9) | New `/bio` -> `/?utm_source=instagram&utm_medium=bio&utm_campaign=profile&utm_content=home` | Bio currently points at bare liftoffr.com, so bio traffic cannot be separated from other sources. Torin sets the bio link to liftoffr.com/bio. |
| 4 | `~/routers/LIFTOFFR.md` | Created | `~/CLAUDE.md` pointed at it but it did not exist. |
| 5 | Discord (incident) | Running `scripts/run_all_tests.sh` posted 7 `[TEST]` messages into live channels at 12:39 UTC. All 7 deleted within ~3 minutes. `data/cbbi_prev.json` restored to the values in the real Nov 8 weekly post (0.50 / 0.8 / $75,599 gap), rounded as displayed. `data/indicators_prev.json` now holds today's values; that job is not scheduled. | That script posts for real; it is not a unit-test runner. Use `venv/bin/python -m unittest discover -s tests` instead (21 failures there pre-date this change). |

## Not changed (recommendations for Torin, in the PDF)
- Pricing, regional pricing, subscriptions: untouched.
- Consent banner: untouched (its length is a documented, deliberate constraint in `js/consent.js`).
- Captioner CTA rules: untouched (Torin's voice rules). Keyword CTAs are recommended for retirement.
- Bio text and bio link: need the Instagram app (not possible via API, and not logged in on web).
- The $497 Playbook plan shows `visibility: hidden` on Whop. Not tested whether its direct checkout link still works.
