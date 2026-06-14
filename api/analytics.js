// Consolidated analytics router — merges 3 endpoints into 1 to stay under
// Vercel's 12-function cap (freed 2 slots for /api/bank). The originals live
// as underscore-prefixed modules (not deployed as their own functions).
import ga4 from "./_analytics-ga4.js";
import gsc from "./_analytics-gsc.js";
import clarity from "./_analytics-clarity.js";

export default async function handler(req, res) {
  const src = new URL(req.url, "http://x").searchParams.get("src");
  if (src === "ga4") return ga4(req, res);
  if (src === "gsc") return gsc(req, res);
  if (src === "clarity") return clarity(req, res);
  return res.status(400).json({ error: "unknown analytics src" });
}
