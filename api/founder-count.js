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

const FOUNDER_PLAN_ID = "plan_CH1L53GLZsaq1";
const FOUNDER_CAP = 30;

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
    const url = `https://api.whop.com/api/v2/memberships?plan_id=${encodeURIComponent(FOUNDER_PLAN_ID)}&status=active&per=1`;
    const r = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
    });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      console.error("founder-count: whop api error", r.status, data);
      return res.status(502).json({ error: "Upstream error", filled: null, remaining: null, total: FOUNDER_CAP });
    }

    const filled = (data && data.pagination && typeof data.pagination.total_count === "number")
      ? data.pagination.total_count
      : 0;
    const remaining = Math.max(0, FOUNDER_CAP - filled);

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");

    return res.status(200).json({ filled, remaining, total: FOUNDER_CAP });
  } catch (err) {
    console.error("founder-count: exception", err);
    return res.status(500).json({ error: "Internal error", filled: null, remaining: null, total: FOUNDER_CAP });
  }
}
