// Anonymous funnel counts for the Instagram -> /map -> Plan path (added 2026-11-11).
//
// Why this exists: GA4 standard reports drop every visitor who has not clicked
// "Allow analytics", and most Instagram in-app visitors never answer the banner,
// so GA4 showed 7 views of /map while Instagram reported link taps in the dozens.
// These counts close that gap without identifying anyone:
//   - no cookie, no device identifier, no IP, no email, no URL beyond the path
//   - a fresh random client_id per event, so GA4 cannot join two events
//   - country comes from Vercel's edge header, sent as user_location.country_id
// The banner and /privacy already tell visitors page views are counted
// anonymously; /privacy names these counts specifically.
//
// Reporting: the step and the A/B variant are in the event NAME
// (fp_<step>_<variant>), because the GA4 property has no custom dimensions
// registered and event names are reportable without any. See
// scripts/funnel_report.py.

import crypto from "node:crypto";

export const FUNNEL_STEPS = new Set(["map_view", "map_signup", "thanks_view", "plan_click", "checkout_click"]);
const VARIANTS = new Set(["a", "b"]);
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|meta-externalagent|headless|lighthouse|curl|wget|python|node-fetch|axios/i;

export function isBot(userAgent) {
  return !userAgent || BOT_RE.test(userAgent);
}

export function funnelEventName(step, variant) {
  if (!FUNNEL_STEPS.has(step)) return null;
  return `fp_${step}_${VARIANTS.has(variant) ? variant : "x"}`;
}

export function countryFrom(req) {
  const c = String(req.headers?.["x-vercel-ip-country"] || "").toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : "";
}

export function mediumFrom(value) {
  const m = String(value || "").toLowerCase();
  if (m === "bio" || m === "dm" || m === "email" || m === "thanks" || m === "reel") return m;
  return m ? "other" : "none";
}

// Fire-and-forget by design: a GA4 hiccup must never break a sign-up.
export async function sendFunnelEvent({ step, variant, medium, page, country }, request = fetch, env = process.env) {
  const name = funnelEventName(step, variant);
  const id = env.GA4_MEASUREMENT_ID, secret = env.GA4_API_SECRET;
  if (!name || !id || !secret) return { sent: false };
  const body = {
    client_id: `${crypto.randomInt(1e9)}.${Math.floor(Date.now() / 1000)}`,
    non_personalized_ads: true,
    events: [{ name, params: { medium: mediumFrom(medium), page: String(page || "").slice(0, 60), engagement_time_msec: 1 } }],
  };
  if (country) body.user_location = { country_id: country };
  try {
    const r = await request(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(3000),
    });
    return { sent: r.ok || r.status === 204, name };
  } catch {
    return { sent: false, name };
  }
}
