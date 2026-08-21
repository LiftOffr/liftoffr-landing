// GA4 Data API proxy — pulls traffic + funnel reports for the dashboard.
//
// Auth: service account JWT (no token expiration — the key file IS the credential,
// and we mint short-lived access tokens on demand). Killed the OAuth refresh flow
// 2026-06-12 because Testing-mode refresh tokens died ~weekly.
//
// Env required (set in Vercel project settings):
//   GA4_SERVICE_ACCOUNT_KEY — full JSON of the service account key (paste as one line)
//   GA4_PROPERTY_ID         — numeric GA4 property ID (NOT the G-XXX measurement ID)
//
// GA4 setup: in GA4 admin → Property Access Management, add the service account's
// client_email as a Viewer.
//
// Query params:
//   ?report=traffic   — traffic acquisition by source (last 30d default)
//   ?report=pages     — top pages by sessions
//   ?report=events    — top custom events
//   ?report=funnel    — homepage → email → checkout flow
//   ?report=realtime  — live users right now
//   ?days=30          — date range (default 30, max 365)

import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// In-memory token cache (lives per-warm-lambda)
let tokenCache = null;

async function getAccessToken() {
  if (tokenCache && tokenCache.exp > Date.now() / 1000 + 60) return tokenCache.token;

  const keyJson = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("Missing GA4_SERVICE_ACCOUNT_KEY");

  let key;
  try { key = JSON.parse(keyJson); }
  catch (e) { throw new Error(`GA4_SERVICE_ACCOUNT_KEY is not valid JSON: ${e.message}`); }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: key.private_key_id };
  const claims = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const signingInput = `${enc(header)}.${enc(claims)}`;
  const signature = crypto.createSign("RSA-SHA256")
    .update(signingInput)
    .sign(key.private_key, "base64url");
  const jwt = `${signingInput}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await r.json();
  if (!r.ok || !data.access_token) {
    throw new Error(`JWT exchange failed: ${JSON.stringify(data)}`);
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

// Accepts either a day count (relative window, the dashboard's usual case) or an
// explicit {from,to} of ISO dates. The explicit form exists because the Day 7
// attribution test needs one specific past window (8-13 Aug 2026) and a relative
// "NdaysAgo -> today" range cannot express a window that has already closed.
const dateRange = (d) =>
  d && typeof d === "object" && d.from
    ? [{ startDate: d.from, endDate: d.to || d.from }]
    : [{ startDate: `${Math.max(1, Number(d) || 30)}daysAgo`, endDate: "today" }];

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
        // Real funnel as of the $29-plan pivot (2026-08-02).
        // land → engage → checkout intent → paid conversion. Trial events retired.
        "page_view", "scroll", "cta_clicked",
        "lead_magnet_submit", "lead_captured",
        "exit_intent_shown", "exit_intent_dismissed",
        "begin_checkout", "checkout_confirmed", "purchase",
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

  // Explicit window: ?from=YYYY-MM-DD[&to=YYYY-MM-DD]. Falls through to `days`.
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from && !ISO.test(from)) return res.status(400).json({ error: "from must be YYYY-MM-DD" });
  if (to && !ISO.test(to)) return res.status(400).json({ error: "to must be YYYY-MM-DD" });
  const range = from ? { from, to: to || from } : days;

  if (!REPORTS[report]) return res.status(400).json({ error: `unknown report: ${report}` });

  try {
    const token = await getAccessToken();
    const body = REPORTS[report](range);
    const data = await ga4Report(propertyId, body, token, report === "realtime");
    res.setHeader("Cache-Control", "private, s-maxage=300, stale-while-revalidate=900");
    return res.status(200).json({ report, days, ...data });
  } catch (err) {
    console.error("analytics-ga4 error", err.status, err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}
