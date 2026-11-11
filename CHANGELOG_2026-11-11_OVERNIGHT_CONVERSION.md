# 2026-11-11 overnight: convert the traffic we already have

Mandate (Torin, 2026-11-10 night): work on LiftOffr making money from existing
traffic. Everything approved except purchases. No USD price changes.

## Findings that drove the work
- /map on a 390x664 phone: the email box was below the fold and the consent
  banner covered half the first screen. An Instagram visitor saw no way to sign up.
- GA4 showed 7 views of /map (all consented US users). Most IG in-app visitors
  never answer the banner, so GA4 standard reports cannot see them.
- Instagram bio-link taps (website_clicks): 0 on Nov 9, 2 on Nov 10, against
  ~100k daily views. The bio link is a thin pipe; the CYCLE DM is the main path.
- Production GA4_MEASUREMENT_ID was G-PQDLNYTD5G, which is not a stream of the
  LiftOffr property (only stream: G-015PKWM24J). The API secret belongs to
  G-015PKWM24J, so every server-side Measurement Protocol event (including the
  Whop webhook `purchase`) was silently dropped. GA4 shows 0 `purchase` events
  since June. FIXED: env set to G-015PKWM24J (old value kept here for revert).
- Engaged audience is 26-28% age 13-17 (IG demographics); products are 18+.

## Shipped (landing commit 8d4caef + this commit)
- /map: form in first screen (bottom at 359px of 664), banner deferred to
  /map/thanks via window.__loConsentDefer, fonts non-blocking, preview lazy,
  trust line (10,000+ IG followers as of 2026-11-10: 10,020; data source; misses
  public at /receipts). A/B headline: a = "The Bitcoin Cycle Map", b = "Day N
  after the top." 50/50, sticky per device (localStorage lo_map_v), ?v=a|b forces.
- /map/thanks: direct "Get the Plan, $29 once" checkout (INR edition for India
  via local-price.js), preview link second.
- Anonymous funnel counts: api/_funnel.js + js/funnel.js. Steps map_view,
  map_signup (server-side), thanks_view, plan_click, checkout_click, sent to GA4
  as fp_<step>_<a|b|x> with country only. No cookie/identifier. /privacy updated.
- Resend contact properties created: country, map_variant, signup_medium.
- Map emails now 5 (day 0 delivery, then days 1/3/5/8): Plan offer in email 2,
  misses + Plan in 3, $197 Course in 4, self-custody in 5 with Ledger/Trezor links
  only when env LEDGER_AFFILIATE_URL / TREZOR_AFFILIATE_URL are set (maker
  domains, https only), each marked "Paid link, I earn a commission." India
  sign-ups (country=IN) see ₹799 and ?price=inr links.
- track.js maps the INR plan id.
- Tests: scripts/test_map_sequence.mjs 8/8; all other suites unchanged and pass.
  js/attribution*.test.js fail before and after (pre-existing).

## Outside this repo
- ManyChat "CYCLE map | November 2026": map DM now has a Plan line and a second
  button "Turn it into a plan" -> /plan?utm_medium=dm&utm_content=dm_plan_button;
  follow-up DM on for non-clickers. A delayed (hours later) Plan DM needs the
  automation converted to Flow Builder; not done (IG 24h window applies anyway).
- Discord: onboarding DMs (workspace 67be58e) mention the Plan on day 1 and use
  /discord-plan on days 5/7; removed the unverified "with my own money" line.
  #1-on-1-playbook ($497) hidden from @everyone. Revert: @everyone overwrite
  allow 66624 deny 103079217152.
- Daily report: discord-rebuild/scripts/funnel_report.py (workspace 48ddc2b),
  LaunchAgent com.liftoffr.funnel-report 06:40 MT, posts to the ops webhook.

## Pinned-comment script (Torin pins by hand; the API cannot pin)
"Free Bitcoin Cycle Map: comment CYCLE and I'll DM it to you. Every halving
cycle on one page. History, not a forecast. 18+"
