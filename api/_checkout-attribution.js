// Hosted Whop checkout metadata bridge. No prices, entitlements, email or
// customer identity are accepted from the browser. Shared by the existing
// public reviews router and the signed payment webhook (no extra function).
import crypto from 'node:crypto';

export const CHECKOUT_PLANS = Object.freeze(['plan_MntgjXJaQnGsW', 'plan_WHByzwILskLsc']);
const COMPANY = 'biz_1PHI81i7fkqRUZ';
const CLIENT = /^\d{1,20}\.\d{1,20}$/;
const SESSION = /^\d{9,11}$/;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const ORIGIN = 'https://liftoffr.com';
const MAX_BODY = 2048;
const SIGNING_CONTEXT = 'liftoffr-checkout-attribution-v1:';
const WINDOW = 24 * 60 * 60;

function label(value, max = 100) {
  // Keep bounded campaign slugs, not raw query strings or form values.
  // Labels are client-supplied diagnostics, not verified identity or proof of
  // origin; a slug alone cannot establish that its contents are nonpersonal.
  return typeof value === 'string' && value.length <= max &&
    /^[a-z0-9][a-z0-9_.()-]*$/i.test(value) && /[a-z]/i.test(value) ? value : '';
}
function secretValid(secret) { return typeof secret === 'string' && secret.length >= 32; }
function signature(encoded, secret) {
  return crypto.createHmac('sha256', secret).update(SIGNING_CONTEXT + encoded).digest('hex');
}
const SOURCES = new Set(['instagram','ig','youtube','yt','tiktok','tt','x','twitter','clippers','resend','email','direct','google','google.com','bing','bing.com','duckduckgo.com','l.instagram.com','t.co','manychat','shortlink']);
const MEDIUMS = new Set(['bio','dm','comment','reel','organic_social','social','email','referral','none','organic','cpc','share','qr','cta']);
function campaign(raw) {
  const values = Object.fromEntries(UTM_KEYS.map(k => [k, label(raw?.[k])]).filter(([, v]) => v));
  if (!SOURCES.has(values.utm_source?.toLowerCase())) delete values.utm_source;
  if (!MEDIUMS.has(values.utm_medium?.toLowerCase())) delete values.utm_medium;
  return values;
}
function sessionValid(value, now) {
  const seconds = Number(value);
  return typeof value === 'string' && SESSION.test(value) && Number.isSafeInteger(seconds) &&
    seconds <= now + 60 && now - seconds <= WINDOW;
}

export function createCheckoutMetadata(input, secret, now = Math.floor(Date.now() / 1000)) {
  if (!secretValid(secret)) throw new Error('checkout_signing_unavailable');
  if (!input || input.consent !== 'granted' || !CHECKOUT_PLANS.includes(input.planId) ||
      typeof input.clientId !== 'string' || !CLIENT.test(input.clientId) ||
      !sessionValid(input.sessionId, now)) throw new Error('invalid_checkout_context');
  const context = {
    v: 1, plan: input.planId, consent: 'granted', client: input.clientId,
    session: input.sessionId, issued: now, utm: campaign(input.utm),
    position: label(input.position, 40),
  };
  const encoded = Buffer.from(JSON.stringify(context)).toString('base64url');
  return { lo_attribution_v: '1', lo_attribution: encoded, lo_attribution_sig: signature(encoded, secret) };
}

export function verifiedCheckoutAttribution(metadata, { planId, paidAt, secret = process.env.CHECKOUT_ATTRIBUTION_SECRET, now = Math.floor(Date.now() / 1000) }) {
  const skip = reason => ({ skip: reason });
  if (!secretValid(secret)) return skip('checkout_signing_unavailable');
  if (!metadata || metadata.lo_attribution_v !== '1') return skip('no_consented_checkout_metadata');
  const encoded = metadata.lo_attribution, signed = metadata.lo_attribution_sig;
  if (typeof encoded !== 'string' || encoded.length > 2500 || !/^[A-Za-z0-9_-]+$/.test(encoded) ||
      typeof signed !== 'string' || !/^[0-9a-f]{64}$/.test(signed)) return skip('invalid_checkout_metadata');
  const expected = signature(encoded, secret);
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signed))) return skip('invalid_checkout_signature');
  let context;
  try { context = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { return skip('invalid_checkout_metadata'); }
  const paymentTime = typeof paidAt === 'string' ? Date.parse(paidAt) / 1000 : NaN;
  if (context.v !== 1 || context.consent !== 'granted' || context.plan !== planId || !CHECKOUT_PLANS.includes(planId) ||
      typeof context.client !== 'string' || !CLIENT.test(context.client) ||
      !Number.isSafeInteger(context.issued) || context.issued > now + 60 || now - context.issued > WINDOW ||
      !Number.isFinite(paymentTime) || paymentTime < context.issued - 300 || paymentTime > now + 60) return skip('invalid_checkout_context');
  if (!sessionValid(context.session, now)) return skip('checkout_session_outside_window');
  return {
    clientId: context.client, sessionId: context.session,
    utm: campaign(context.utm), position: label(context.position, 40),
    paidAt: paymentTime,
    status: 'consented_checkout_metadata',
  };
}

// Bounded warm-instance throttles. Vercel's platform firewall remains the
// distributed abuse boundary; these maps are not claimed to be global limits.
const attempts = new Map();
let globalWindow = { start: 0, count: 0 };
function allowedAttempt(ip, now) {
  if (now - globalWindow.start >= 60000) globalWindow = { start: now, count: 0 };
  if (++globalWindow.count > 60) return false;
  const digest = crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex');
  for (const [key, row] of attempts) if (now - row.start >= 60000) attempts.delete(key);
  const row = attempts.get(digest) || { start: now, count: 0 };
  attempts.set(digest, row);
  return ++row.count <= 6;
}
async function jsonBody(req) {
  if (Number(req.headers?.['content-length']) > MAX_BODY) throw new Error('body_too_large');
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY) throw new Error('body_too_large');
    return JSON.parse(raw);
  }
  return new Promise((resolve, reject) => {
    let length = 0, chunks = [], settled = false;
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(value); };
    const timer = setTimeout(() => finish(new Error('body_timeout')), 1500);
    req.on('data', chunk => {
      length += Buffer.byteLength(chunk);
      if (length > MAX_BODY) { chunks = []; finish(new Error('body_too_large')); return; }
      if (!settled) chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => { try { finish(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { finish(new Error('invalid_json')); } });
    req.on('error', () => finish(new Error('body_error')));
  });
}

export async function handleCheckoutAttribution(req, res, request = fetch) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (process.env.CHECKOUT_ATTRIBUTION_ENABLED !== 'true' || !secretValid(process.env.CHECKOUT_ATTRIBUTION_SECRET) || !process.env.WHOP_API_KEY) {
    return res.status(503).json({ error: 'checkout_context_unavailable' });
  }
  if (req.headers?.origin !== ORIGIN ||
      (req.headers?.['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') ||
      !/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type'] || '')) return res.status(403).json({ error: 'same_origin_required' });
  if (!allowedAttempt(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'], Date.now())) {
    return res.status(429).json({ error: 'checkout_context_rate_limited' });
  }
  try {
    const input = await jsonBody(req);
    const metadata = createCheckoutMetadata(input, process.env.CHECKOUT_ATTRIBUTION_SECRET);
    const response = await request('https://api.whop.com/api/v1/checkout_configurations', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(1800),
      headers: { Authorization: `Bearer ${process.env.WHOP_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: input.planId, metadata }),
    });
    if (!response.ok) return res.status(502).json({ error: 'checkout_context_unavailable' });
    const created = await response.json();
    const url = new URL(created.purchase_url);
    if (!/^ch_[A-Za-z0-9]+$/.test(created.id || '') || created.plan?.id !== input.planId || created.company_id !== COMPANY ||
        created.mode !== 'payment' || url.origin !== 'https://whop.com' || url.pathname !== `/checkout/${created.id}/` ||
        url.search || url.hash || Object.keys(metadata).some(k => created.metadata?.[k] !== metadata[k])) {
      return res.status(502).json({ error: 'checkout_context_unverified' });
    }
    // No customer ID, metadata, API token or amount leaves this endpoint.
    return res.status(200).json({ checkoutUrl: url.href });
  } catch (error) {
    const validation = ['invalid_checkout_context', 'invalid_json', 'body_too_large'].includes(error?.message);
    return res.status(validation ? 400 : 502).json({ error: validation ? 'invalid_checkout_context' : 'checkout_context_unavailable' });
  }
}
