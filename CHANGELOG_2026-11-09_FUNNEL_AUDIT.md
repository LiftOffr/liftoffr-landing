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

---

# 2026-11-09 (later): audience geography follow-up

Torin: "my reels use this cringe audio from my editor and my fanbase is out of india and doesnt convert to buyers".
Report (PDF): `~/Documents/liftoffr-funnel-audit-2026-11-09/LiftOffr-Audience-Geography-2026-11-09.pdf`.
Evidence and scripts: `~/Documents/liftoffr-funnel-audit-2026-11-09/data/`.

## Findings (live 2026-11-09)
- 99.0% of views Aug 30-Nov 9 came from non-followers (10,390,479 vs 105,351). Engaged audience this week: 68.1% India, 1.8% US+UK+CA+AU, 28.2% aged 13-17. Followers: 15.8% US+UK+CA+AU.
- The API has no per-reel country or audio data (probed: breakdown=country rejected on media; audio fields absent). Per-reel geography was estimated from commenter names/language (272 of 1,628 commenters classifiable; 86% South Asian).
- No feature (audio track, loudness, face, caption, hashtags, post hour) separates Western-named commenter share beyond noise (~13%). Lead only: school/job + relationship overlays 19.4% vs lifestyle + money 10.0% (Fisher p=0.038, ~13 features tested).
- Audio, fingerprinted from all 251 published reels (47 reused tracks): reuse and loudness track reach (4+ uses median 48.0K views vs one-off 8.4K; quiet mixes 11.1K), not geography.

## Decisions and changes
| # | Where | Change | Why |
|---|---|---|---|
| 6 | discord-rebuild `scripts/audience_geo_snapshot.py` + `~/Library/LaunchAgents/com.liftoffr.audience-geo.plist` (commit 8d97326, workspace repo) | Daily 23:30 read-only snapshot of engaged/follower country and age, follower vs non-follower views, follower count, to `data/audience_geo_daily.jsonl` | Country is only available per account per week; daily rows make week-vs-week tests measurable. |
| 7 | discord-rebuild `src/drive_to_instagram.py` (commit 8d97326) | `IG_REGULAR_WEEKS` (default 47,49): those ISO weeks post regular reels, others stay trial | Test whether follower-first distribution raises the US share. Decision rule: keep regular if tier-1 engaged share >= 3.6% with >= 50% of trial-week views. Empty value disables. |
| 8 | `~/liftoffr-video/LOGS/audience_audio_findings.json`, `audience_reel_features.json`, `audience_audio_tracks/*.mp3` | Findings for the editor session (data files only; no editor code touched) | Requested by Torin. |
| - | Not changed | Post schedule (already US daytime), captioner rules, pricing | Post time showed no geography effect for trial reels; test it only after the trial/regular result. |

---

# 2026-11-09 (later still): reconciliation with the ChatGPT/Codex audit

Source: `~/liftoffr-video/LOGS/chatgpt_context.txt` (read-only audit of Torin's ChatGPT/Codex agent).

| # | Item | Action |
|---|---|---|
| 9 | Torin to Codex, 2026-10-30 (verbatim, Codex session log): "Remember the Instagram posts should be posted to trial reels then I manually graduate them" | Entries 1 and 7 contradicted this. Reverted both defaults (workspace commit cc0904e): graduation back to MANUAL, `IG_REGULAR_WEEKS` empty. Both stay as opt-in env switches. No reel published while SS_PERFORMANCE was the default (last post 2026-11-08). |
| 10 | Homepage founder section: "I used this Bitcoin system to fund the lifestyle you see here." Added 2026-10-05 in 5ea0860 (Codex). Live until today. | Replaced (a2cc8c3) with "I've followed this framework through two Bitcoin cycles, including the calls it got early or wrong. I built LiftOffr to explain it." Consistent with the 2026-08-16 no-income-claims rule, the 2026-09-29 "historical story allowed, current finances private" rule, and /about. Verified in production. |
| 11 | Other phrasings in the audit ("framework I used to fund this lifestyle", "system directly paid for the lifestyle I live", "living the results", "creates millionaires") | Not present anywhere in this repo or its history, and not in the two visible Whop listings. Hidden or archived Whop products still carry old claims ("$24K in -> $1.88M out", "used by high-income players"); not public, left for Torin. Caption and story-reel claims live outside this repo. |
| 12 | Ladder | Live: Free / $29 Plan / $197 Course. $497 Playbook hidden on Whop since 2026-08-22 (Codex). Reports corrected. |
| 13 | Codex coordination | Fetched origin before each push; no Codex commits since 2026-10-07 and none overwritten. Codex auto-publish (LIFTOFFR_AUTO_PUBLISH_CLEAN=1, 2026-10-30) and the idle Higgsfield story-reel automation were not touched. |

---

# 2026-11-09: bio link -> liftoffr.com/bio (Torin's choice)

| # | Item | Result |
|---|---|---|
| 14 | `/bio` in production | Verified: one 307 hop to `/?utm_source=instagram&utm_medium=bio&utm_campaign=profile&utm_content=home`, final 200 with an iPhone Instagram in-app user agent; `www.liftoffr.com/bio` 308s to the apex first. Homepage loads GA4 and fires `utm_landing` for tagged visits (consented visitors only). |
| 15 | Set IG bio website via Claude in Chrome | NOT DONE. The Claude in Chrome extension was not connected (2 attempts). The built-in browser is logged out of Instagram, and signing in for Torin is off limits. No retries, given Meta's earlier link flag. Torin sets it in the app: Edit profile -> Links -> replace the website with https://liftoffr.com/bio. Nothing else in the profile was touched. |
