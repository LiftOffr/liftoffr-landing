// GA4 Data API proxy — pulls traffic + funnel reports for the dashboard.
//
// Uses OAuth refresh-token flow (user-account based, signed in as the GA4 owner).
// Refresh token never expires unless explicitly revoked.
//
// Env required (set in Vercel project settings):
//   GA4_OAUTH_CLIENT_ID     — Google Cloud OAuth client ID
//   GA4_OAUTH_CLIENT_SECRET — paired client secret
//   GA4_OAUTH_REFRESH_TOKEN — long-lived refresh token (from OAuth flow)
//   GA4_PROPERTY_ID         — numeric GA4 property ID (NOT the G-XXX measurement ID)
//
// Query params:
//   ?report=traffic   — traffic acquisition by source (last 30d default)
//   ?report=pages     — top pages by sessions
//   ?report=events    — top custom events
//   ?report=funnel    — homepage → email → checkout flow
//   ?report=realtime  — live users right now
//   ?days=30          — date range (default 30, max 365)

export const config = { runtime: "nodejs" };

const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// In-memory token cache (lives per-warm-lambda)
let tokenCache = null;

async function getAccessToken() {
  if (tokenCache && tokenCache.exp > Date.now() / 1000 + 60) return tokenCache.token;

  const clientId = process.env.GA4_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GA4_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GA4_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GA4_OAUTH_CLIENT_ID, GA4_OAUTH_CLIENT_SECRET, or GA4_OAUTH_REFRESH_TOKEN");
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
  if (!r.ok || !data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }
  tokenCache = {
    token: data.access_token,
    exp: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) - 60,
  };
  return tokenCache.token;
}

async function ga4Report(propertyId, body, token, realtime = false) {
  const endpoint = realtime ? "runRealtimeReport" : "runReport";
  const r = await fetch(`${DATA_API}/properties/${propertyId}:${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) {
    const err = new Error(`GA4 API: ${JSON.stringify(data.error || data)}`);
    err.status = r.status;
    throw err;
  }
  return data;
}

const dateRange = (days) => [{ startDate: `${Math.max(1, days)}daysAgo`, endDate: "today" }];

const REPORTS = {
  traffic: (days) => ({
    dateRanges: dateRange(days),
    dimensions: [{ name: "sessionSourceMedium" }],
    metrics: [
      { name: "sessions" }, { name: "totalUsers" },
      { name: "engagementRate" }, { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 25,
  }),
  pages: (days) => ({
    dateRanges: dateRange(days),
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "screenPageViews" }, { name: "totalUsers" },
      { name: "userEngagementDuration" }, { name: "engagementRate" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 25,
  }),
  events: (days) => ({
    dateRanges: dateRange(days),
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 30,
  }),
  funnel: (days) => ({
    dateRanges: dateRange(days),
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      filter: { fieldName: "eventName", inListFilter: { values: [
        "page_view", "lead_magnet_submit", "lead_magnet_download",
        "join_click", "exit_intent_shown", "exit_intent_dismissed",
        "scroll", "click", "checkout_redirect",
      ]}},
    },
  }),
  realtime: () => ({
    dimensions: [{ name: "country" }, { name: "unifiedScreenName" }],
    metrics: [{ name: "activeUsers" }],
  }),
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return res.status(500).json({ error: "GA4_PROPERTY_ID not set" });

  const url = new URL(req.url, "http://localhost");
  const report = url.searchParams.get("report") || "traffic";
  const days = Math.max(1, Math.min(365, parseInt(url.searchParams.get("days") || "30", 10)));

  if (!REPORTS[report]) return res.status(400).json({ error: `unknown report: ${report}` });

  try {
    const token = await getAccessToken();
    const body = REPORTS[report](days);
    const data = await ga4Report(propertyId, body, token, report === "realtime");
    res.setHeader("Cache-Control", "private, s-maxage=300, stale-while-revalidate=900");
    return res.status(200).json({ report, days, ...data });
  } catch (err) {
    console.error("analytics-ga4 error", err.status, err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}
