# GA4 access for the Day 7 attribution test — the two-minute version

**What this unlocks:** step 2 of `DAY7_ATTRIBUTION_TEST.md` — counting outbound checkout
clicks for 8–13 August 2026, which is the corroborating half of "did those 60 failed
checkouts come from Instagram or Whop Discover".

**Everything is already built.** The endpoint, the service-account auth flow and the
reports all exist and are deployed. What's missing is credentials, which are yours to
create. There is no code to write.

---

## First — check whether you actually need to do any of this

It's possible both variables are already set. Find out before doing the work:

```
curl -u liftoffr:<DASHBOARD_PASSWORD> \
  "https://liftoffr.com/api/analytics?src=ga4&report=events&days=7"
```

- **JSON with event rows** → you're already configured. Skip to *Running the test*.
- **`{"error":"GA4_PROPERTY_ID not set"}`** → do step 2 below.
- **`Authentication required`** → your `DASHBOARD_PASSWORD` is wrong, not GA4.
- **A Google auth error** → the service-account key is missing or not authorised; do step 1.

`DASHBOARD_PASSWORD` is already in Vercel → Settings → Environment Variables. It's the
same password as the `/dashboard` login. The username is ignored — any value works.

---

## 1. `GA4_SERVICE_ACCOUNT_KEY`

A Google service account, so there's no refresh token to expire. (The old OAuth flow was
removed on 2026-06-12 because Testing-mode refresh tokens died roughly weekly.)

1. **console.cloud.google.com** → pick or create a project.
2. **APIs & Services → Library** → enable **Google Analytics Data API**.
3. **APIs & Services → Credentials → Create credentials → Service account.** Any name.
4. Open the service account → **Keys → Add key → Create new key → JSON**. A file downloads.
5. Open that file and copy **the entire JSON**, including the outer braces.
6. **Vercel → liftoffr-landing → Settings → Environment Variables → Add:**
   - Key: `GA4_SERVICE_ACCOUNT_KEY`
   - Value: the whole JSON **pasted as one line**
   - Environment: **Production**
7. In the JSON find `"client_email"` — something like
   `name@project.iam.gserviceaccount.com`. Then in **GA4 → Admin → Property Access
   Management → +** add that email as a **Viewer**.

> Step 7 is the one people miss. Without it the key is valid and Google returns a
> permission error on every request.

## 2. `GA4_PROPERTY_ID`

- **GA4 → Admin → Property Settings.** It's the numeric **Property ID**, e.g. `412896733`.
- **Not** the `G-XXXXXXX` measurement ID — that's a different thing and won't work.
- Vercel → Environment Variables → Add: key `GA4_PROPERTY_ID`, value the number,
  Environment **Production**.

## 3. Redeploy

**Vercel → Deployments → ⋯ on the newest → Redeploy.** Then re-run the check command at
the top of this file. Rows of JSON means you're done.

---

## Running the actual test

The endpoint previously only accepted a relative `days=N` window, which cannot express a
window that has already closed. It now takes explicit dates (added 20 Aug 2026):

```
curl -u liftoffr:<DASHBOARD_PASSWORD> \
  "https://liftoffr.com/api/analytics?src=ga4&report=events&from=2026-08-08&to=2026-08-13"
```

**What you're looking for:** the `cta_clicked` row. That is the outbound-checkout-click
event.

| `cta_clicked` count, 8–13 Aug | Reading |
|---|---|
| ~0 | The 60 checkouts did not come through the site. Combined with the Whop-side check in `DAY7_ATTRIBUTION_TEST.md` §4, that's Whop Discover — close to conclusive. |
| Meaningful (dozens) | Some of the 60 did come from the site; the Instagram reading is live and Finding 2 needs revisiting. |

Also worth pulling for the same window:

```
...&report=traffic&from=2026-08-08&to=2026-08-13
```

`sessionSourceMedium` shows whether Instagram sent any sessions at all in those six days.

> **The caveat that must be stated when you use this number.** In that window the click
> handler existed **only on the homepage** and never appended UTMs to the outbound link.
> So this figure undercounts by an unknown amount and cannot *prove* the Instagram case.
> It can only disconfirm it: a near-zero reading against 60 Whop checkouts means those
> checkouts didn't come through the site. Report it as the one-directional test it is.
> The Whop-side check in §4 is the decisive one; this corroborates.

---

## Available reports

`?report=` takes `traffic`, `pages`, `events`, `funnel`, `realtime`.
`?days=N` (1–365, default 30) or `?from=YYYY-MM-DD[&to=YYYY-MM-DD]`.
`realtime` ignores the range.

---

*Written 20 Aug 2026. Env var names and the middleware Basic Auth gate were read from
`api/_analytics-ga4.js` and `middleware.js` rather than assumed. The `from`/`to` params
were added the same day because the Day 7 window cannot be expressed as `NdaysAgo`.*
