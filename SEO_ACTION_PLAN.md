# Search Console / SEO Action Plan
**Generated:** 2026-05-18 · After GA4 + Search Console integration

## Current State (data-backed)

### Search Console findings

| URL | Status | Last crawl |
|---|---|---|
| Homepage | `Alternate page with proper canonical` (consolidated under non-www) | 2026-05-07 |
| `/blog/cbbi-bitcoin-indicator` | **`PASS — Submitted and indexed`** ✓ | 2026-05-05 |
| All 12 other pages | `URL is unknown to Google` (never crawled) | never |

**Translation:** Of 14 pages submitted, **only 1 is indexed**. Google has crawled the homepage once but treats it as a duplicate of the non-www version. Everything else is invisible to search.

### Root cause

The GSC property is `https://www.liftoffr.com/` but your canonical site is `https://liftoffr.com/` (Vercel auto-redirects www → bare). Google sees sitemap URLs in a different domain than the verified property and treats them as orphans.

---

## What's now wired

| System | Status | Where |
|---|---|---|
| GA4 readback | ✓ live | `/api/analytics-ga4` + dashboard panel |
| Microsoft Clarity readback | ✓ live | `/api/analytics-clarity` + dashboard panel |
| Search Console readback | ✓ live | `/api/analytics-gsc` + dashboard panel |
| OAuth refresh token | ✓ rotated (both scopes) | `~/.openclaw/secrets/ga4_refresh_token.txt` + Vercel |
| Sitemap re-submitted to GSC | ✓ done | last submit 2026-05-18 12:24 UTC |
| Blog cross-linking | ✓ all 9 posts | live |
| robots.txt explicit AI-bot allow | ✓ done | `GPTBot, ClaudeBot, PerplexityBot, ...` |
| `lead_magnet_submit` event tracking | ✓ wired | fires on form-submit attempt |

---

## What you need to do manually (3 tasks, ~10 minutes total)

### Task 1 — Verify `liftoffr.com` (bare domain) in Search Console
**This is the single most impactful fix.** It unblocks indexing for all your other pages.

1. Open **https://search.google.com/search-console**
2. Top-left property dropdown → **Add property** → choose **Domain** (left card, not "URL prefix")
3. Enter exactly: `liftoffr.com` (no `http://`, no `www`, no trailing slash)
4. Google gives you a TXT record value like `google-site-verification=AbCd1234...`
5. **Add the TXT record to Vercel DNS:**
   - Vercel → Project → Settings → Domains → click `liftoffr.com` → DNS Records section
   - Add Record: Type=`TXT`, Name=`@`, Value=the full `google-site-verification=...` string
   - Save
6. Wait 2-5 minutes, then click **Verify** in Search Console
7. Once verified, **paste me the verification code** so I can also add it as a meta tag in the HTML head (belt and suspenders).

If the "couldn't fetch" error you saw was during this step, it means the TXT record wasn't found in DNS yet — DNS propagation just needed more time.

### Task 2 — Submit sitemap to the new property
After Task 1, in the new `liftoffr.com` property:
- Left sidebar → **Sitemaps**
- Add a new sitemap: `sitemap.xml` (form auto-prefixes with `https://liftoffr.com/`)
- Submit

(I can do this via API once the property is verified — ping me when Task 1 is done.)

### Task 3 — Request indexing for priority pages (optional but useful)
In the new property, for each of these URLs:
- URL Inspection → paste the URL → wait for result → click **Request Indexing**
- This pushes Google to re-crawl within 24-48 hours

Priority order:
1. `https://liftoffr.com/` (homepage)
2. `https://liftoffr.com/blog/how-to-identify-bitcoin-cycle-top` (pillar post)
3. `https://liftoffr.com/blog/pi-cycle-top-bitcoin-indicator`
4. `https://liftoffr.com/blog/mvrv-ratio-bitcoin-indicator`
5. `https://liftoffr.com/track-record`
6. The other 6 blog posts

Search Console limits manual indexing requests to ~10/day. Spread these across 2 days.

---

## What I'll do once Task 1 is verified

1. Submit sitemap to the new property via API
2. Pull URL inspection data for all 14 URLs in the new property (the data will be much richer than the www property's)
3. Set up GSC dashboard panel to use the canonical property
4. Build a weekly diff report: index coverage changes week-over-week

---

## Background — why only CBBI is indexed

The CBBI post got indexed because someone (probably from social) clicked through to it directly via a non-www URL. Google's crawler followed and indexed that one. The others never got that organic traffic spark.

The cross-linking we added yesterday (8 internal links per blog post) gives Google a discovery path — but Google needs to recrawl the homepage to find these links. That's why Task 3 (request indexing for homepage) matters.

---

## Expected timeline once Task 1 is done

| Day 0 | Domain property verified · sitemap submitted |
|---|---|
| Day 1-3 | Google crawls homepage + recent updates |
| Day 3-10 | Google discovers + indexes 8-12 of the 14 pages |
| Day 14-30 | First search impressions for blog posts start appearing |
| Day 30-60 | Long-tail keywords ("MVRV Z-Score explained", "Pi Cycle indicator history") start ranking |
| Day 60-90 | Compounding: each indexed page can rank for 5-20 queries |

Realistic 60-day projection: **15-50 organic search clicks per day** if content is good (which it is). That's a 30-100× improvement over current zero.
