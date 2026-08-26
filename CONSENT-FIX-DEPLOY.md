# CONSENT-FIX-DEPLOY.md

**2026-08-26.** Written for Torin. Read the first section before the commit sequence —
the headline finding is not the one the task assumed, and it changes what "fixed" means.

---

## 1. The reported fault does not exist

> "On the live page `analytics_storage` defaults to `denied` and **no `/g/collect` beacon
> fires at all**."

Measured on production, clean Chromium, no extensions, storage cleared, before any click:

```
/g/collect beacons: 2
 [0] page_view    gcs=G100 npa=1 gcd=13p3p3p3p5l1 tid=G-015PKWM24J
 [1] utm_landing  gcs=G100 npa=1 gcd=13p3p3p3p5l1 tid=G-015PKWM24J
cookies: _wuid=…, _wuid_link=…      <- Whop's two only. No _ga. No Clarity.
```

`gcs=G100` = ad_storage denied + analytics_storage denied. `npa=1` = no ad personalisation.
Two cookieless pings, no storage written. **That is exactly what the comment in
`js/consent.js` promises, and Advanced Consent Mode is working as designed.** There was
never a beacon bug to fix.

### Why it looked broken

An ad blocker. Diagnosing this in a browser with **uBlock Origin** installed, the request
to `https://www.googletagmanager.com/gtag/js?id=G-015PKWM24J` returns HTTP **200** — but
the body is uBlock's neutered stub:

```
/*  uBlock Origin - a browser extension to block requests.  */
```

`window.google_tag_data` is `undefined`, the raw `consent`/`config` commands sit
unprocessed in `dataLayer`, and no beacon ever fires. It looks precisely like a broken
tag, and the 200 status makes it look like the script loaded fine. **Do not diagnose tag
behaviour in your everyday browser.** Use the harness in §5.

## 2. So why did GA4 flatline?

Because cookieless pings are collected but **not reported**.

GA4 excludes `gcs=G100` hits from standard reports. They carry no client ID and no session
ID, so they cannot produce a user or a session row. Their only purpose is to feed *consent
mode behavioural modelling*, which estimates the missing sessions and folds them back into
reports — and modelling has an activation threshold:

> at least **1,000 users per day with `analytics_storage='granted'`** for 7 of the previous
> 28 days, plus at least 1,000 events/day with `analytics_storage='denied'`.

At ~15 sessions/day you are roughly **two orders of magnitude** below that. Modelling will
never switch on, and nothing in the GA4 interface tells you the rest of the traffic is
missing. So:

- **Before 08-20:** no banner, everyone effectively granted → ~15 sessions/day reported.
- **After 08-20:** default denied, almost nobody clicks Accept → the 3 recorded sessions
  are the handful who did. Everyone else is collected and discarded at reporting time.

The banner did not break measurement. It moved essentially all of your traffic into a
bucket GA4 declines to report, permanently.

### The honest limit

**You cannot make declined visitors appear in GA4 standard reports.** Not with a config
change, not with a tag change. The only levers are (a) more people granting consent, or
(b) a measurement system that does not depend on consent because it stores nothing. Any
"fix" that made declined traffic show up as sessions would be doing it by ignoring the
consent signal — storing an identifier on the device of someone who said no. I have not
done that and you should not accept a change that does.

## 3. What *was* actually broken, and is now fixed

A real defect, found while verifying the above: **visitors who click Accept lose their
landing page_view and its campaign attribution.**

By the time the banner can be clicked, `page_view` has already gone out at `gcs=G100`.
GA4 does not re-send it on a consent update — measured, the only hit that follows the
update is `user_engagement`:

```
BEFORE — live site, click "Allow analytics"
 [1] page_view        gcs=G100   <- excluded from reports
 [2] utm_landing      gcs=G100   <- excluded from reports
 [3] user_engagement  gcs=G101   <- counted, but session_start/attribution never arrived
```

So an accepting visitor produced a session with no landing pageview and no
`utm_source/medium/campaign` — which is part of why even the accepted traffic looked
threadbare in reports.

The fix re-sends `page_view` at the moment consent is granted. `page_location` still
carries the UTMs, so this restores attribution rather than inventing it.

```
AFTER — patched build, click "Allow analytics"
 [3] POST gcs=G101 gcd=13p3r3p3p5l1
     BODY: en=user_engagement…
           en=page_view&_ee=1&dl=http%3A%2F%2F…%3Futm_source%3Dclaude
                 %26utm_medium%3Ddiag%26utm_content%3Dclaude_diag&seg=1
```

Denied and undecided paths are **byte-for-byte unchanged** — re-verified after the patch:

```
AFTER — patched build, "Decline"           AFTER — patched build, no choice
 [1] page_view   gcs=G100 npa=1             [1] page_view   gcs=G100 npa=1
 [2] utm_landing gcs=G100 npa=1             [2] utm_landing gcs=G100 npa=1
 cookies: _wuid, _wuid_link (Whop)          cookies: _wuid, _wuid_link (Whop)
 localStorage: denied                        localStorage: (none)
```

It only ever runs on an explicit Accept click — `apply()` has exactly one caller,
`decide()` in `js/consent.js` — and it is not a double count for a returning granted
visitor, because for them the tag boots granted and `apply()` is never called.

Swept across **all 46** pages that carry the inline snippet, per CLAUDE.md's
sweep-by-component rule. All 46 `apply` blocks hash identically before and after.

## 4. Commit sequence

Two repos. Nothing here has been committed — all `git` writes are yours.

### `liftoffr-landing` (46 modified + 1 new)

```bash
cd ~/liftoffr-landing
node scripts/patch_consent_pageview.js --check   # expect: CHECK PASS
node scripts/check_consent_banner.js             # expect: CONSENT BANNER: PASS

git add -A '*.html' scripts/patch_consent_pageview.js
git commit -m "Consent: re-send page_view on grant, so accepters are not lost

The tag was never broken -- denied visitors send cookieless pings (gcs=G100,
npa=1, no _ga) exactly as designed. GA4 simply excludes those from standard
reports, and consent-mode modelling needs ~1000 consented users/day to fill
them back in, which this property will not reach. That is the flatline.

The real defect: page_view fires at G100 before the banner can be clicked and
GA4 never re-sends it on a consent update, so an accepting visitor's
session_start and utm attribution were dropped. Re-send it on grant.

Accept-only: apply() has one caller, decide() in js/consent.js. Denied and
undecided paths verified unchanged -- G100, npa=1, no storage written."

git push origin main
```

### `liftoffr-receipts` (see §6)

```bash
cd ~/liftoffr-receipts
python3 scripts/check_match_keyword.py           # expect: MATCH_KEYWORD: PASS

# Commit ONLY these two. The sqlite files and reel_performance.md are modified
# by the daily sync, not by me -- do not sweep them in with `git add -A`.
git add track_reels.py scripts/check_match_keyword.py
git commit -m "track_reels: count a bare keyword comment, not the word in prose

match_keyword() tested membership in the set of words in the comment, so any
sentence containing the word was a lead: 'I stuck to the plan and it worked'
counted as PLAN. That phrase is a signature string in this file's own
CATEGORY_PATTERNS, so the reels most likely to draw it were the ones being
inflated. It once took a count from 0 to 7.

Now the whole comment must be the keyword, decoration aside. Genuine bot
triggers are unaffected -- trigger_log is unioned in at the call site."
```

## 5. Verifying it yourself after deploy

The harness is `probe.js` (attached). It needs a browser **with no extensions** — this is
the whole point, see §1.

```bash
node probe.js https://liftoffr.com/ undecided   # expect 2x gcs=G100 npa=1, no _ga
node probe.js https://liftoffr.com/ decline     # expect 2x gcs=G100 npa=1, no _ga
node probe.js https://liftoffr.com/ accept      # expect a G101 POST whose body has en=page_view
```

Or by hand, in a fresh Incognito window **with all extensions disabled**: DevTools →
Network → filter `collect` → load the page → confirm two requests with `gcs=G100&npa=1`
and no `_ga` cookie in Application → Cookies.

**Regression guard:** `node scripts/patch_consent_pageview.js --check` fails if any page
loses the re-send. Add it next to `check_consent_banner.js` in whatever you run pre-push.

## 6. The `track_reels.py` counting bug

`match_keyword()` did `words = set(re.findall(r"[A-Za-z]+", text.upper()))` then
`if kw in words` — whole-word, but not whole-*comment*. Old vs new, measured:

| comment | old | new |
|---|---|---|
| `I stuck to the plan and it worked` | **PLAN** | None |
| `stuck to the plan` | **PLAN** | None |
| `what is the plan here` | **PLAN** | None |
| `comment PLAN below` | **PLAN** | None |
| `my plan is to keep stacking` | **PLAN** | None |
| `SCORE was 72 yesterday` | **SCORE** | None |
| `send me the checklist please` | **CHECKLIST** | None |
| `Plan` | PLAN | PLAN |
| `plan 🙏` | PLAN | PLAN |

Now: the comment must consist of exactly one token, and that token must be a keyword.
Decoration (punctuation, emoji, whitespace, case) is ignored, so `Plan`, `PLAN!`,
`plan 🙏`, `🔥PLAN🔥` all count; `planning`, `plans`, `PLAN 2`, `@torin plan` do not.

Erring toward under-counting is the safe direction here: the reply bot's own `trigger_log`
is unioned in at the call site, so comments the bot actually acted on are still counted
regardless. This function only infers the ones the log does not cover — and it writes the
ledger the public 6.2M proof tile is reconciled against, so a false hit is a fabricated
lead.

Test: `scripts/check_match_keyword.py` — 33 cases plus every keyword in `KEYWORDS` across
6 decoration variants. It fails against the old implementation.

## 7. Can the six days be recovered?

**From GA4: no.** Denied pings are not retained as reportable rows, there is no backfill or
reprocessing, and modelling cannot be applied retroactively (or at all, at your volume).
08-20 to 08-26 is gone from GA4 and will stay gone.

**From Vercel Web Analytics: probably yes, and this is worth doing today.**
`/_vercel/insights/script.js` is already on every page, and the collector is live —
`/_vercel/insights/view` and `/event` both return `400` to a malformed payload while
`/_vercel/insights/bogus` returns `404`, so the endpoints exist and are validating, which
means Web Analytics is enabled on the project. It is **cookieless and consent-independent**,
so it was counting your reel run the whole time GA4 was blind.

> Go to vercel.com → the liftoffr project → **Analytics** tab → set the range to
> **Aug 20–26**. That is your real traffic for the 60,798-view reel.

Caveat: Hobby has an event cap and limited retention, so check it soon rather than at
leisure. I could not confirm the numbers from outside — the Vercel script deliberately
skips browsers reporting `navigator.webdriver`, so an automated check sees nothing.

**Other surviving sources for that window:** Instagram insights (per-reel views and link
clicks), Whop (checkout and purchase counts), Discord joins, and Resend (subscribes).
Between Vercel and Instagram you can reconstruct most of what the reel actually did — you
just cannot reconstruct on-site behaviour, which is the part GA4 uniquely had.

## 8. Decide what you want measurement to be

Not code — your call, and worth making deliberately rather than by default.

1. **Accept the tradeoff.** Keep the banner, accept that GA4 now reports only the small
   consented slice, and use Vercel Web Analytics as the traffic number of record. Honest,
   cheap, and you stop being surprised.
2. **Raise the accept rate legitimately.** The banner defaults to denied and many people
   just ignore it, which reads as denied forever. Making it clearer or less obtrusive is
   fair. Pre-selecting, nagging, or making Decline harder than Accept is not — and the
   current banner deliberately gives both buttons identical size, weight and hit area.
   Do not trade that away for a metric.
3. **Move the traffic number off GA4 entirely** onto a cookieless, storage-free analytics
   product that needs no consent at all. This is the option that actually matches what the
   banner already tells people: *"Page views are already counted anonymously, no cookie."*

I would not touch the consent posture to chase the number. The measurement gap is real,
but it is the honest cost of the banner, not a bug.

---

### Files changed

| repo | file | change |
|---|---|---|
| liftoffr-landing | 46 × `*.html` | re-send `page_view` in `__loConsent.apply()` on grant |
| liftoffr-landing | `scripts/patch_consent_pageview.js` | new — the sweep, plus `--check` regression guard |
| liftoffr-receipts | `track_reels.py` | `match_keyword()` now requires a bare keyword comment |
| liftoffr-receipts | `scripts/check_match_keyword.py` | new — regression test |

No `git` write operations were run and no `.git/index.lock` was created in either repo.

### Test hits I generated

All tagged **`utm_content=claude_diag`** (with `utm_source=claude&utm_medium=diag`).
Roughly 25–30 `page_view` / `utm_landing` / `user_engagement` events to `G-015PKWM24J` on
2026-08-26, from headless Chromium, against `https://liftoffr.com/` and a local copy. A
handful carry `gcs=G101` where the probe clicked Accept, and those set a `_ga` cookie in
a throwaway browser profile that no longer exists. Filter them out in GA4 with
`utm_content` (or `Session manual ad content`) `exactly matches` `claude_diag`. The
`gcs=G100` ones will not appear in reports at all, per §2.
