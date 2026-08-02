// Vercel serverless function: returns the current number of active Founder
// Rate memberships, used to render "X of 30 spots remaining" copy on the
// homepage qualifier bar, pricing section, and /links page.
//
// Env required (set in Vercel project settings):
//   WHOP_API_KEY – Whop API key (v2 access)
//
// Response shape:
//   200 { filled: <int>, remaining: <int>, total: 30 }
//   on upstream failure, returns 502 with same shape and nulls
//
// Cached at Vercel edge for 5 minutes (stale-while-revalidate 1 hr) so we
// don't hammer Whop's API on every page load.

export const config = { runtime: "nodejs" };

// VESTIGIAL (decision 2026-06-14): the 30-spot "founder" scarcity concept is
// RETIRED. The frontend no longer renders any spot count — the [data-founder-text]
// JS now shows honest benefit copy ("My exact buy plan — $29, once · no subscription")
// regardless of this endpoint, and the blog/links CTAs were swept of "Founder Rate"/
// "Limited availability" language. This API is kept only so legacy callers don't 404;
// its numbers are not displayed anywhere. Safe to delete once nothing fetches it.
const FOUNDER_PLAN_IDS = [
  "plan_CH1L53GLZsaq1",  // RETIRED — $29/mo founder rate
  "plan_FJ3YmVpeeF4kH",  // RETIRED — $249/yr founder annual
];
const FOUNDER_CAP = 30;

async function countActive(apiKey, planId) {
  const url = `https://api.whop.com/api/v2/memberships?plan_id=${encodeURIComponent(planId)}&status=active&per=1`;
  const r = await fetch(url, {
    headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(`whop ${r.status}`); err.status = r.status; err.body = data;
    throw err;
  }
  return (data && data.pagination && typeof data.pagination.total_count === "number")
    ? data.pagination.total_count : 0;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.WHOP_API_KEY;
  if (!apiKey) {
    console.error("founder-count: missing WHOP_API_KEY");
    return res.status(500).json({ error: "Server misconfigured", filled: null, remaining: null, total: FOUNDER_CAP });
  }

  try {
    const counts = await Promise.all(FOUNDER_PLAN_IDS.map((id) => countActive(apiKey, id)));
    const filled = counts.reduce((a, b) => a + b, 0);
    const remaining = Math.max(0, FOUNDER_CAP - filled);

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");

    return res.status(200).json({
      filled,
      remaining,
      total: FOUNDER_CAP,
      breakdown: FOUNDER_PLAN_IDS.reduce((acc, id, i) => { acc[id] = counts[i]; return acc; }, {}),
    });
  } catch (err) {
    console.error("founder-count: exception", err.status, err.message, err.body);
    return res.status(err.status || 500).json({
      error: "Upstream or internal error",
      filled: null, remaining: null, total: FOUNDER_CAP,
    });
  }
}
