// Google Search Console proxy — search performance + indexing data.
//
// Reuses the GA4 OAuth refresh token (same Google account, combined scopes).
//
// Env required:
//   GA4_OAUTH_CLIENT_ID
//   GA4_OAUTH_CLIENT_SECRET
//   GA4_OAUTH_REFRESH_TOKEN  (must have https://www.googleapis.com/auth/webmasters scope)
//
// Query params:
//   ?report=queries   — top search queries with clicks/impressions/CTR/position
//   ?report=pages     — top landing pages from search
//   ?report=countries — search traffic by country
//   ?report=sitemaps  — submitted sitemap status
//   ?days=30          — date range (default 30)
//   ?siteUrl=...      — defaults to https://liftoffr.com/

export const config = { runtime: "nodejs" };

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";
const DEFAULT_SITE = "https://www.liftoffr.com/";

let tokenCache = null;

async function getAccessToken() {
  if (tokenCache && tokenCache.exp > Date.now() / 1000 + 60) return tokenCache.token;
  const clientId = process.env.GA4_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GA4_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GA4_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing OAuth env vars");
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await r.json();
  if (!r.ok || !data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  tokenCache = {
    token: data.access_token,
    exp: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) - 60,
  };
  return tokenCache.token;
}

async function gsc(path, body, token, method = "POST") {
  const r = await fetch(`${GSC_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(`GSC API: ${JSON.stringify(data.error || data)}`);
    err.status = r.status;
    throw err;
  }
  return data;
}

function dateString(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const REPORTS = {
  queries: (days, site) => ({
    path: `/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    body: {
      startDate: dateString(days),
      endDate: dateString(0),
      dimensions: ["query"],
      rowLimit: 50,
      orderBy: [{ field: "CLICKS", descending: true }],
    },
  }),
  pages: (days, site) => ({
    path: `/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    body: {
      startDate: dateString(days),
      endDate: dateString(0),
      dimensions: ["page"],
      rowLimit: 50,
      orderBy: [{ field: "CLICKS", descending: true }],
    },
  }),
  countries: (days, site) => ({
    path: `/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    body: {
      startDate: dateString(days),
      endDate: dateString(0),
      dimensions: ["country"],
      rowLimit: 25,
      orderBy: [{ field: "CLICKS", descending: true }],
    },
  }),
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = new URL(req.url, "http://localhost");
  const report = url.searchParams.get("report") || "queries";
  const days = Math.max(1, Math.min(365, parseInt(url.searchParams.get("days") || "30", 10)));
  const site = url.searchParams.get("siteUrl") || DEFAULT_SITE;

  try {
    const token = await getAccessToken();

    if (report === "sitemaps") {
      const data = await gsc(`/sites/${encodeURIComponent(site)}/sitemaps`, null, token, "GET");
      res.setHeader("Cache-Control", "private, s-maxage=600, stale-while-revalidate=1800");
      return res.status(200).json({ report, siteUrl: site, ...data });
    }

    if (!REPORTS[report]) {
      return res.status(400).json({ error: `unknown report: ${report}` });
    }

    const { path, body } = REPORTS[report](days, site);
    const data = await gsc(path, body, token);

    res.setHeader("Cache-Control", "private, s-maxage=600, stale-while-revalidate=1800");
    return res.status(200).json({ report, days, siteUrl: site, ...data });
  } catch (err) {
    console.error("analytics-gsc error", err.status, err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}
