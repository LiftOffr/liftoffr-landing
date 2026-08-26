# Deploy: attribution first-touch fix (v4) — 2026-08-25

Fixes the bug where every Instagram DM click was booked as **direct**. A first untagged
visit wrote `{utm_source:'direct'}` permanently, and `capture()`'s opening
`if (load()) return;` discarded the later `utm_source=instagram` arrival, so `decorate()`
stamped `direct` on the outbound Whop URL.

Nothing here touches HTML, payment logic, pricing, the `$147` founding price, or the
7 September date. `vercel.json` is not modified, so the Apple Pay `.well-known` mechanism
is untouched.

---

## Files this change adds

| File | Role |
|---|---|
| `js/attribution.v4.js` | full replacement for `js/attribution.js` — becomes it in step 2 |
| `js/attribution.test.js` | general suite: capture, first-touch precedence, upgrade, Whop decoration (33 tests) |
| `js/attribution.internal.test.js` | internal-source guard suite (25 tests) |
| `DEPLOY-INSTRUCTIONS.md` | this file (`*.md` is already in `.vercelignore`, so it never ships) |

---

## Step 0 — clear the stuck git lock

`git` is wedged on an `.git/index.lock` left behind by a killed process. Every git write
fails until it is gone. Confirm no git process is actually running first, then remove it:

```bash
cd ~/liftoffr-landing
pgrep -fl 'git' || echo 'no git process running'
rm -f .git/index.lock
git status
```

If `pgrep` lists a real running git command, let it finish (or kill it) before removing
the lock — deleting the lock out from under a live git process can corrupt the index.

---

## Step 1 — re-run the tests yourself

Takes two seconds and proves the file you are about to ship is the one that passed.

```bash
cd ~/liftoffr-landing
node js/attribution.test.js js/attribution.js            # baseline: 26 passed, 7 failed
node js/attribution.internal.test.js js/attribution.js   # baseline: 11 passed, 14 failed
node js/attribution.test.js js/attribution.v4.js         # candidate: 33 passed, 0 failed
node js/attribution.internal.test.js js/attribution.v4.js # candidate: 25 passed, 0 failed
```

Every test the live file passes, the candidate also passes. The baseline failures are the
bug (and the missing upgrade behaviour), nothing else.

---

## Step 2 — promote v4 into place

```bash
cd ~/liftoffr-landing
mv js/attribution.v4.js js/attribution.js
```

Do this **before** committing. If `attribution.v4.js` gets committed while it still
exists, it deploys as a second publicly-fetchable copy of the script at
`/js/attribution.v4.js`.

---

## Step 3 — bump the cache-buster to `?v=20260825`

**There are 44 references, one in each of 44 HTML files.** None of them is versioned today
— every one is a bare `/js/attribution.js`, so this adds the query string rather than
editing an existing one. Two attribute orders exist in the repo
(`src="..." defer` and `defer src="..."`); the command below matches on the `src`
attribute only, so it handles both.

There are also **11 comment-only mentions** of `js/attribution.js` in HTML (the
`<!-- ... See js/attribution.js. -->` note above the tag in the `/indicators/*` pages).
Those are prose, not references — the command below does not touch them, and they should
stay as they are.

```bash
cd ~/liftoffr-landing

# Preview: should list exactly 44 files.
grep -rl 'src="/js/attribution\.js"' --include="*.html" . | sort | wc -l

# Apply. (`xargs -a` is GNU-only and fails on macOS; pipe instead.)
grep -rl 'src="/js/attribution\.js"' --include="*.html" . | xargs sed -i '' 's|src="/js/attribution\.js"|src="/js/attribution.js?v=20260825"|g'

# Verify: 44 versioned, 0 bare.
grep -rc 'attribution\.js?v=20260825' --include="*.html" . | grep -v ':0$' | wc -l
grep -rn 'src="/js/attribution\.js"' --include="*.html" . | wc -l   # must be 0
```

> `sed -i ''` is the macOS/BSD form. On GNU sed use `sed -i` with no `''`.

---

## Step 4 — optional: keep the test files off the public site

Every file in this repo is served publicly, so `/js/attribution.test.js` would return 200.
Nothing secret is in them, but they are noise a crawler can find. If you want them
private, append to `.vercelignore`:

```bash
printf '\n# Test harnesses for js/attribution.js — never deploy.\njs/*.test.js\n' >> .vercelignore
```

---

## Step 5 — commit and deploy

```bash
cd ~/liftoffr-landing
git add js/attribution.js js/attribution.test.js js/attribution.internal.test.js
git add -A -- '*.html'
git add .vercelignore DEPLOY-INSTRUCTIONS.md     # .vercelignore only if you did step 4

git status                                        # expect: 1 js file changed, 2 added,
                                                  # 44 html files changed, nothing else
git diff --cached --stat

git commit -m "fix(attribution): upgrade placeholder first-touch records, guard internal sources

capture() returned early on any existing record, so an untagged first visit froze
{utm_source:'direct'} and every later tagged arrival was discarded — every Instagram DM
click reached Whop as direct traffic.

A UTM-carrying arrival now replaces the stored record only when that record is a
placeholder (source 'direct', or a referrer-derived 'referral' medium). Genuine tagged
first touches stay permanent; untagged arrivals never overwrite anything. first_seen is
preserved across an upgrade so utm_term=ft_<date> still measures first-touch-to-purchase
lag; upgraded_from is kept locally and never reaches the URL.

Guarded by both an explicit internal-source list (liftoffr, cycle) and a same-host
referrer test — neither alone is sufficient, because /checklist and /buyzone are 307
redirects to an internally-sourced URL with no referrer. Without the guard this would
relabel Google organic as 'liftoffr', which is worse than the bug. resend/email/beehiiv/
widget target internal pages but originate off-site and stay upgradeable.

Adds js/attribution.test.js (33) and js/attribution.internal.test.js (25), both green.
Cache-buster bumped to ?v=20260825 across 44 pages."

git push origin main
```

Vercel auto-deploys from `main`. Do **not** use `vercel --prod` — it trips the cron
validation on the Hobby plan.

> If `youtube_intel.py` has auto-committed `api/_cowen-data.js` in the meantime, pull with
> `git pull --rebase origin main` before pushing.

---

## Step 6 — verify in the browser

Wait for the Vercel deploy to go green, then:

1. **Load the bug's exact scenario.** In a fresh incognito window, first visit
   `https://liftoffr.com/` with no tags at all — this writes the `direct` placeholder that
   used to be permanent. Then in the *same* window go to:

   ```
   https://liftoffr.com/plan?utm_source=instagram&utm_medium=dm&utm_campaign=plan_launch
   ```

2. **Check the record.** DevTools console:

   ```js
   loAttribution()
   ```

   Expect `utm_source: "instagram"`, `utm_medium: "dm"`, `upgraded_from: "direct"`, and a
   `first_seen` equal to the day of the *first* visit. Before this fix it read
   `utm_source: "direct"`.

3. **Check the outbound link — this is the actual assertion.** Right-click the "$29"
   checkout button → Copy Link Address (or run
   `document.querySelector('a[href*="whop.com"]').href` after clicking it once). It must
   contain **`utm_source=instagram`**, not `utm_source=direct`, plus
   `utm_medium=dm` and `utm_term=ft_<first-visit-date>`.

4. **Confirm the internal guard.** Still in that window, clear storage
   (`localStorage.removeItem('lo_attr')`), load `https://liftoffr.com/` untagged, then
   click any nav CTA that carries `utm_source=liftoffr`. `loAttribution().utm_source` must
   still be `"direct"` — **not** `"liftoffr"`. If it flips to `liftoffr`, stop and revert;
   that failure mode destroys real Google organic attribution and looks plausible in a
   report.

5. **Confirm checkout still works.** Click through to the Whop hosted checkout and confirm
   the page loads on the right plan, the price is right, and Apple Pay still appears. The
   change only appends query params to the checkout URL, but it does modify that URL, so
   eyeball it once.

6. **Confirm the cache-buster took.** `view-source:https://liftoffr.com/plan` should show
   `src="/js/attribution.js?v=20260825"`.

---

## Rollback

```bash
cd ~/liftoffr-landing
git revert --no-edit HEAD
git push origin main
```

Reverting restores the old script and the un-versioned tag together. Attribution records
already upgraded in visitors' localStorage stay upgraded — which is the correct data
either way, so there is nothing to clean up.
