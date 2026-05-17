// GA4 Data API proxy — pulls traffic + funnel reports for the dashboard.
//
// Uses a Google Cloud service account (JWT auth, no OAuth refresh nonsense).
// Service account must have "Viewer" role on the GA4 property.
//
// Env required (set in Vercel project settings):
//   GA4_SERVICE_ACCOUNT_JSON — full service account JSON, raw or base64-encoded
//   GA4_PROPERTY_ID          — numeric GA4 property ID (NOT the G-XXX measurement ID)
//
// Query params:
//   ?report=traffic   — traffic acquisition by source (last 30d)
//   ?report=pages     — top pages by sessions
//   ?report=events    — top custom events
//   ?report=funnel    — homepage → email → checkout flow
//   ?report=realtime  — live users right now
//   ?days=30          — date range (default 30)
//
// Gated by the same Basic auth middleware as /dashboard, since this exposes
// site analytics that shouldn't be public.

import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

// ---- Service account JWT → access token ----

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function loadServiceAccount() {
  let raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GA4_SERVICE_ACCOUNT_JSON not set");
  // Allow base64-encoded form (avoids newline mangling in env panel)
  if (!raw.trim().startsWith("{")) {
    raw = Buffer.from(raw, "base64").toString("utf8");
  }
  const sa = JSON.parse(raw);
  if (!sa.client_email || !sa.private_key) {
    throw new Error("Service account JSON missing client_email or private_key");
  }
  return sa;
}

function signJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(sa.private_key);
  return `${signingInput}.${signature.toString("base64url")}`;
}

let cachedToken = null;
async function getAccessToken() {
  if (cachedToken && cachedToken.exp > Date.now() / 1000 + 60) return cachedToken.token;
  const sa = loadServiceAccount();
  const jwt = signJwt(sa);
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
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  cachedToken = {
    token: data.access_token,
    exp: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) - 60,
  };
  return cachedToken.token;
}

// ---- Data API helpers ----

async function ga4Report(propertyId, body, token) {
  const r = await fetch(`${DATA_API}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
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

async function ga4Realtime(propertyId, body, token) {
  const r = await fetch(`${DATA_API}/properties/${propertyId}:runRealtimeReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

function dateRange(days) {
  return [{ startDate: `${Math.max(1, days)}daysAgo`, endDate: "today" }];
}

// ---- Reports ----

async function reportTraffic(propertyId, token, days) {
  return ga4Report(propertyId, {
    dateRanges: dateRange(days),
    dimensions: [{ name: "sessionSourceMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "engagementRate" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 20,
  }, token);
}

async function reportPages(propertyId, token, days) {
  return ga4Report(propertyId, {
    dateRanges: dateRange(days),
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "totalUsers" },
      { name: "userEngagementDuration" },
      { name: "engagementRate" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 20,
  }, token);
}

async function reportEvents(propertyId, token, days) {
  return ga4Report(propertyId, {
    dateRanges: dateRange(days),
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 30,
  }, token);
}

async function reportFunnel(propertyId, token, days) {
  // Returns counts for key funnel-stage events
  return ga4Report(propertyId, {
    dateRanges: dateRange(days),
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: {
          values: [
            "page_view",
            "scroll",
            "click",
            "lead_magnet_submit",
            "lead_magnet_download",
            "join_click",
            "exit_intent_shown",
            "exit_intent_dismissed",
            "checkout_redirect",
          ],
        },
      },
    },
  }, token);
}

async function reportRealtime(propertyId, token) {
  return ga4Realtime(propertyId, {
    dimensions: [{ name: "country" }, { name: "unifiedScreenName" }],
    metrics: [{ name: "activeUsers" }],
  }, token);
}

// ---- Handler ----

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return res.status(500).json({ error: "GA4_PROPERTY_ID not set" });
  }
  if (!process.env.GA4_SERVICE_ACCOUNT_JSON) {
    return res.status(500).json({ error: "GA4_SERVICE_ACCOUNT_JSON not set" });
  }

  const url = new URL(req.url, "http://localhost");
  const report = url.searchParams.get("report") || "traffic";
  const days = Math.max(1, Math.min(365, parseInt(url.searchParams.get("days") || "30", 10)));

  try {
    const token = await getAccessToken();
    let data;
    switch (report) {
      case "traffic": data = await reportTraffic(propertyId, token, days); break;
      case "pages":   data = await reportPages(propertyId, token, days); break;
      case "events":  data = await reportEvents(propertyId, token, days); break;
      case "funnel":  data = await reportFunnel(propertyId, token, days); break;
      case "realtime":data = await reportRealtime(propertyId, token); break;
      default: return res.status(400).json({ error: `unknown report: ${report}` });
    }
    res.setHeader("Cache-Control", "private, s-maxage=300, stale-while-revalidate=900");
    return res.status(200).json({ report, days, ...data });
  } catch (err) {
    console.error("analytics-ga4 error", err.status, err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}
