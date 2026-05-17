// Microsoft Clarity Data Export API proxy.
//
// Returns summary metrics (sessions, scroll depth, dead clicks, rage clicks,
// quick backs, JS errors, top pages, top traffic channels).
//
// Env required:
//   CLARITY_API_TOKEN — generated at clarity.microsoft.com → Settings → Data Export
//
// Query params:
//   ?days=1   — date range (Clarity supports 1, 2, 3 — max 3 days for free tier)
//
// Docs: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api

export const config = { runtime: "nodejs" };

const ENDPOINT = "https://www.clarity.ms/export-data/api/v1/project-live-insights";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.CLARITY_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "CLARITY_API_TOKEN not set" });
  }

  const url = new URL(req.url, "http://localhost");
  const days = Math.max(1, Math.min(3, parseInt(url.searchParams.get("days") || "1", 10)));
  // Clarity supports multiple dimensions to slice by — Browser, Device, OS, Country, Page, etc.
  // We pull a broad summary: top URLs + top channels.
  const params = new URLSearchParams({
    numOfDays: String(days),
    dimension1: "URL",
    dimension2: "Source",
  });

  try {
    const r = await fetch(`${ENDPOINT}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      console.error("clarity api error", r.status, data);
      return res.status(502).json({ error: "Clarity API error", status: r.status, body: data });
    }
    res.setHeader("Cache-Control", "private, s-maxage=600, stale-while-revalidate=1800");
    return res.status(200).json({ days, data });
  } catch (err) {
    console.error("analytics-clarity exception", err);
    return res.status(500).json({ error: err.message });
  }
}
