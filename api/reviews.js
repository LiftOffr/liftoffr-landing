// Whop reviews — public, cached, read-only.
//
// Replaces api/founder-count.js, which was vestigial (it counted the retired
// 30-seat "Founder Rate" and nothing on the site fetched it). Swapping one for
// the other keeps the project at Vercel's 12-function cap; see CLAUDE.md.
//
// Source: GET https://api.whop.com/api/v1/reviews?product_id=...
//   Response rows carry: stars (1-5), title, description, status, created_at,
//   paid_for_product (verified-purchase flag), user.{name,username}.
//   There is no aggregate field, so average and count are computed here.
//
// Env required:
//   WHOP_API_KEY – already set in Vercel Production (v2/v1 read access)
//
// Response:
//   200 { product, count, average, reviews: [...] }
//   200 { product, count: 0, average: null, reviews: [] }  ← also on upstream
//                                                            failure, on purpose
//
// WHY IT NEVER ERRORS LOUDLY: the front-end renders nothing when count is 0.
// A failed fetch and "no reviews yet" must look identical to the page, so a
// Whop outage can never paint a broken or empty ratings widget on a sales page.

export const config = { runtime: "nodejs" };

// Whop product IDs, mapped from the repo (LIFTOFFR_MASTER_PLAN.md,
// FINISHED_PRODUCT_REPORT.md, api/whop-webhook.js).
// NOTE: the Playbook product ID is not recorded anywhere in this repo. Until
// it is filled in, /playbook simply renders no rating — which is the correct
// behaviour, not a bug. See REVIEW_CAMPAIGN.md.
const PRODUCTS = {
  plan:     "prod_qkbRaW1vFT2cM", // $29 My Bear Market Buy Plan
  system:   "prod_b4DoR00YHuysT", // $197 / $147 The Cycle System
  playbook: process.env.WHOP_PLAYBOOK_PRODUCT_ID || null,
};

// Only these ever reach the page. `published` is Whop's own moderation state;
// pending and removed are excluded. Anything without a verified purchase is
// excluded too — an unverifiable endorsement is the 16 CFR 255.2 problem that
// took the old testimonials down, and Whop hands us the flag for free.
function usable(r) {
  return r
    && r.status === "published"
    && Number.isFinite(Number(r.stars))
    && Number(r.stars) >= 1 && Number(r.stars) <= 5
    && r.paid_for_product !== false;
}

// Displayed attribution: real name if Whop has one, else @username. Never
// "a member". If neither exists the review is dropped rather than shown
// anonymously.
function attribution(r) {
  const n = (r.user?.name || "").trim();
  if (n) return n;
  const u = (r.user?.username || "").trim();
  return u ? "@" + u : null;
}

async function fetchProduct(productId, key) {
  const url = `https://api.whop.com/api/v1/reviews?product_id=${encodeURIComponent(productId)}&first=50`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`whop ${r.status}`);
  const data = await r.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export default async function handler(req, res) {
  const q = new URL(req.url, "http://localhost").searchParams;
  const which = (q.get("product") || "").toLowerCase();
  const productId = PRODUCTS[which];

  // 5 min fresh, 1 hr stale-while-revalidate — same posture as cycle-score.
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");

  const empty = { product: which || null, count: 0, average: null, reviews: [] };
  if (!productId) return res.status(200).json(empty);

  const key = process.env.WHOP_API_KEY;
  if (!key) {
    console.error("reviews: missing WHOP_API_KEY");
    return res.status(200).json(empty);
  }

  try {
    const rows = (await fetchProduct(productId, key)).filter(usable);
    const reviews = rows.map((r) => ({
      stars: Number(r.stars),
      title: (r.title || "").trim() || null,
      body: (r.description || "").trim() || null,
      by: attribution(r),
      at: r.published_at || r.created_at || null,
    })).filter((r) => r.by);

    const count = reviews.length;
    const average = count
      ? Math.round((reviews.reduce((a, b) => a + b.stars, 0) / count) * 10) / 10
      : null;

    // Newest first, and only rows with something to read get quoted.
    reviews.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));

    return res.status(200).json({ product: which, count, average, reviews });
  } catch (err) {
    // Deliberately soft: see the note at the top of this file.
    console.error("reviews: upstream failure", String(err).slice(0, 200));
    return res.status(200).json(empty);
  }
}
