# Sitewide quality pass — 2026-08-14

Open mandate: fix everything fixable on liftoffr.com. Six commits, all built,
pushed and verified live.

---

## 1. Fabricated testimonials — removed sitewide

The single most serious thing found. Four pages carried the same three
testimonials (kyle_stacks, Marcus_btc, Tyr), each captioned **"from our private
Discord — shared with permission."** `/proof` rendered them as a Discord
screenshot under the heading *"Real members. Real outcomes."*

Evidence gathered before acting:

| Check | Result |
|---|---|
| Discord member search: kyle / marcus / tyr / stacks | **no match** — the only "btc" hit is a price-ticker bot that joined 2025-11-26 |
| $29 plan memberships, all time (Whop API) | **2** |
| Testimonial dates | 2025-03-19, 2025-04-03, 2025-07-14 |
| First non-zero payment ever on the account | **2025-08-14** — all three predate it |
| "Portfolio up $47,970 in one month" | live on `/proof` and `/track-record`, not just the schema |

`BUSINESS_MODEL_2026-08` §8 bans income claims outright. And this is the same
call already made on 2026-08-02, when the Ethan/Olivia/Alex composite students
were cut from the paid course for being invented people.

Removed: the homepage carousel, the `/proof` Discord mockup, the `/track-record`
grid, the `/links` single testimonial, three avatar PNGs, the dead carousel JS
and 45 orphaned CSS rules — **18.2KB**. Nothing was substituted in. The receipts,
the backtest and the timestamped calls are the real proof assets.

---

## 2. Technical SEO

**The `/plan` canonical bug was systemic.** The site runs `trailingSlash:false`,
so `/about/` 308s to `/about` — yet **14 of 41 canonicals** named the
trailing-slash or `.html` form. A canonical pointing at a redirect is a
self-conflicting signal and a known cause of *"Discovered — currently not
indexed"*, which is exactly the state `/plan` is in. This is the most likely
reason the sitemap reads **36 submitted / 0 indexed**.

| Item | Before | After |
|---|---|---|
| Canonicals resolving 200 with no hop | 27 / 41 | **42 / 42** |
| `og:url` declarations pointing at redirects | 11 | 0 |
| Sitemap entries that redirect | 2 (`/blog/`, `/receipts.html`) | 0 |
| Generated indicator titles over 62 chars | 10 (72–89) | **0** (43–60) |
| Hand-written titles over 62 chars | 3 | 0 |
| Descriptions outside 110–165 chars | 13 | 0 |
| Pages with no canonical | 2 | 0 |

Indicator titles were fixed in `scripts/build_indicator_pages.py`, not in the
output — the generator runs daily and would have reverted a file-level edit.

---

## 3. Performance

Homepage first load measured **1.30MB**. The largest asset we control was the
hero background — the desktop LCP element.

| Asset | Before | After | Saving |
|---|---|---|---|
| `torin-hero-bg` | 486.4KB | 183.3KB | −62% |
| `torin-hero-bg-mobile` | 135.6KB | 66.3KB | −51% |
| `torin-founder` | 81.9KB | 30.3KB | −63% |
| **Desktop own-asset total** | **677KB** | **325KB** | **−52%** |
| **Mobile own-asset total** | **245KB** | **175KB** | **−29%** |

TTFB measured 0.37s before, 0.17–0.26s after (partly network variance).

Wiring is fallback-safe, not a straight swap: preloads carry
`type="image/webp"` so a non-supporting browser skips rather than fetching an
undecodable file; the CSS keeps a plain `url(.jpg)` line immediately before the
`image-set()`; seven `<img>` tags became `<picture>` with the original tag intact
as the fallback child. All originals remain on disk.

---

## 4. Links, forms, 404, icons

- **Broken links: none.** All 44 internal links and 6 assets return 200. The
  only real 404 was a canonical *I* had added the day before to
  `lead-magnet/buy-zone-plan.html` — that file is listed in `.vercelignore` as
  an internal draft and deliberately does not deploy. Canonical removed.
- **Email capture verified end-to-end.** `POST /api/subscribe` → 200, contact
  landed in the Resend audience, welcome email reached status **`delivered`**.
  Test contact deleted afterwards so the list KPI stays clean. **The flat email
  list is a demand problem, not a broken form** — that was an open question in
  yesterday's traffic report.
- **404 page** was Vercel's bare default: 79 bytes, no title, no branding, no way
  back. Replaced with a branded page carrying six routes out, the disclaimer
  footer, and a `page_not_found` GA4 event logging the missing path and referrer
  so dead inbound links become findable instead of silently bleeding traffic.
- **`favicon.ico` was 404ing sitewide** — only an SVG existed, which older
  browsers and several link-preview crawlers don't read. Built a 32×32
  PNG-in-ICO. Added `apple-touch-icon.png` (180×180; an iPhone home-screen
  bookmark previously showed a page screenshot) and `site.webmanifest`. All
  wired into 44 pages.
- **Console: clean.** No page-level JavaScript errors on the homepage.

---

## 5. Copy and conversion

- **"30 spots remaining"** was still rendering on `/blog` and
  `/indicator-history`. The 30-spot founder concept was retired 2026-06-14 and
  `api/founder-count.js` says so in its own header. The site was advertising
  scarcity for something that doesn't exist.
- **"locks in forever" / "Price locks in forever"** removed with it — the $29 is
  a one-time purchase, so there is no recurring price to lock. Subscription-era
  framing that no longer parses.
- **The homepage fetched `/api/founder-count` on every load** and updated
  nothing: zero `[data-founder-text]` elements remain in the markup. One wasted
  request per visitor, removed.
- **The course section named "The Cycle System" but linked only to `/plan`** and
  a grey footer link. Added a secondary text route to `/system`. The $29 stays
  the primary ask per the ladder.

---

## Deliberately left alone

1. **Product PNGs in `img/product/`** (1.2–3.6MB). Only fetched by Google's
   crawler and uploaded to Whop, so converting saves no user-facing bytes — and
   Merchant listing validation is mid-flight, which is the wrong moment to change
   the image URLs Google is re-checking. webp versions were generated (94%
   smaller) and then deleted rather than left unused; regenerate with
   `cwebp -q 90` if that trade is ever worth making.
2. ~~**GTM on 26 of 44 pages** may be double-counting pageviews.~~
   **RESOLVED 2026-08-14 — there is no double-counting.** Container
   GTM-K5B4BX46 (live Version 2, published 2026-05-12) holds 1 tag, 0 triggers,
   0 variables, and that tag is the Whop conversion pixel, not GA4. Confirmed
   empirically from network logs: exactly **one** `page_view` hit per load on a
   GTM page (`/faq`), a non-GTM page (`/stack`) and a newly-tagged page
   (`/plan`). The traffic figures reported 2026-08-13 stand as measured — they
   are not overstated. The inspection instead found the opposite gap: the Whop
   pixel was missing from `/plan`, `/system`, `/free` and `/welcome-plan`. Fixed.
3. **`api/founder-count.js` itself.** Now that nothing calls it, it can be
   deleted — it frees a Vercel function slot against the 12-function cap. Left
   because deleting endpoints is a deploy-shape change, not a content fix.
4. **The stale `www.liftoffr.com` Search Console property** and its 14-URL
   sitemap. Harmless; removing properties from the account is Torin's call.
5. **Blog "Last updated: May 13, 2026"** on nine posts. The dates are accurate —
   the posts genuinely haven't been revised. Not stale, just old.
6. **`/free` routing.** It links to `/plan` and not `/system`, which is correct:
   the ladder is FREE → $29 → $197 and skipping a rung would contradict the
   master plan.

---

## Verified live at the end

42/42 canonicals resolve 200 with no hop. All 20 public pages 200. All 9
shortlinks redirect correctly, including `/clip`. `/dashboard` 401s without
auth, the cron `?force=1` bypass still 401s, and internal `.md` files still 404.
