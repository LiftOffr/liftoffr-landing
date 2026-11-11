// Cycle Map funnel (2026-11-10): routing of map sign-ups in the follow-up cron and
// the /api/subscribe map branch. Fixtures only; no network.
import test from 'node:test'; import assert from 'node:assert/strict';
import cron from '../api/cron-welcome-followups.js';
import subscribe from '../api/subscribe.js';

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString();
function res() { return { status(n) { this.code = n; return this; }, json(b) { this.body = b; return this; }, setHeader() {}, send(b) { this.body = b; return this; } }; }

async function runCron({ contacts, props, failLookup = new Set(), address = 'Example Business Mailbox' }) {
  const oldEnv = process.env, oldFetch = global.fetch, sends = [];
  process.env = { ...oldEnv, CRON_SECRET: 'fixture', RESEND_API_KEY: 'fixture', RESEND_AUDIENCE_ID: 'free', LIFTOFFR_MAILING_ADDRESS: address };
  for (const k of Object.keys(process.env)) if (k.startsWith('RESEND_QUIZ_AUDIENCE') || k === 'RESEND_PLAN_AUDIENCE_ID' || k === 'DASHBOARD_PASSWORD') delete process.env[k];
  global.fetch = async (url, opts = {}) => {
    const u = new URL(url);
    if (u.pathname === '/api/cycle-score') return { ok: true, json: async () => ({ score: 47.1, zone: 're-accumulation' }) };
    if (u.pathname.startsWith('/audiences/free/contacts')) return { ok: true, json: async () => ({ data: contacts, has_more: false }) };
    if (u.pathname.startsWith('/contacts/')) {
      const id = decodeURIComponent(u.pathname.split('/')[2]);
      if (failLookup.has(id)) return { ok: false, status: 500, json: async () => ({}) };
      const v = props[id], [lm, country] = String(v || '').split(':');
      return { ok: true, json: async () => ({ id, properties: v ? { lead_magnet: { value: lm, type: 'string' }, ...(country ? { country: { value: country, type: 'string' } } : {}) } : {} }) };
    }
    if (u.pathname === '/emails') { const b = JSON.parse(opts.body); sends.push({ to: b.to[0], subject: b.subject, html: b.html, key: opts.headers['Idempotency-Key'] }); return { ok: true, json: async () => ({ id: 'e' }) }; }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const r = res();
  try { await cron({ url: '/api/cron-welcome-followups', headers: { authorization: 'Bearer fixture', host: 'x' } }, r); }
  finally { process.env = oldEnv; global.fetch = oldFetch; }
  return { r, sends };
}

test('map contact gets map email 1 and no generic email; other contacts keep the generic sequence', async () => {
  const now = Date.now();
  const contacts = [
    { id: 'map1', email: 'map@example.test', created_at: iso(now - 1.5 * DAY), unsubscribed: false },
    { id: 'gen1', email: 'gen@example.test', created_at: iso(now - 1.5 * DAY), unsubscribed: false },
  ];
  const { r, sends } = await runCron({ contacts, props: { map1: 'map' } });
  assert.equal(r.code, 200);
  const toMap = sends.filter(s => s.to === 'map@example.test'), toGen = sends.filter(s => s.to === 'gen@example.test');
  assert.equal(toMap.length, 1); assert.match(toMap[0].subject, /cycle map/); assert.match(toMap[0].key, /^map-m1-map1$/);
  assert.match(toMap[0].html, /47\.1/); assert.match(toMap[0].html, /\/plan\?/); assert.match(toMap[0].html, /\$29/); assert.doesNotMatch(toMap[0].html, /price=inr|₹/);
  assert.equal(toGen.length, 1); assert.doesNotMatch(toGen[0].key, /^map-/);
  for (const s of sends) assert.doesNotMatch(s.html, /playbook/i, 'no $497 Playbook link in any nurture email');
});

test('map emails 2 and 3 fire on days 3 and 5; nothing on day 7', async () => {
  const now = Date.now();
  const contacts = [3.5, 5.5, 7.5].map((d, i) => ({ id: 'm' + i, email: `m${i}@example.test`, created_at: iso(now - d * DAY), unsubscribed: false }));
  const { sends } = await runCron({ contacts, props: { m0: 'map', m1: 'map', m2: 'map' } });
  assert.deepEqual(sends.map(s => s.key).sort(), ['map-m2-m0', 'map-m3-m1']);
  const m3 = sends.find(s => s.key === 'map-m3-m1'); assert.match(m3.html, /\$197/); assert.match(m3.html, /30-day refund/);
});

test('failed property lookup sends nothing to that contact', async () => {
  const contacts = [{ id: 'x', email: 'x@example.test', created_at: iso(Date.now() - 1.5 * DAY), unsubscribed: false }];
  const { r, sends } = await runCron({ contacts, props: {}, failLookup: new Set(['x']) });
  assert.equal(sends.length, 0); assert.equal(r.body.results.map_lookup_failed, 1);
});

test('map emails are held when the mailing address is missing', async () => {
  const contacts = [{ id: 'm', email: 'm@example.test', created_at: iso(Date.now() - 1.5 * DAY), unsubscribed: false }];
  const { sends } = await runCron({ contacts, props: { m: 'map' }, address: '' });
  assert.equal(sends.length, 0);
});

test('subscribe with magnet=map marks the contact and sends the map welcome', async () => {
  const oldEnv = process.env, oldFetch = global.fetch, calls = [];
  process.env = { ...oldEnv, RESEND_API_KEY: 'fixture', RESEND_AUDIENCE_ID: 'free', CRON_SECRET: 'fixture' };
  global.fetch = async (url, opts = {}) => {
    const u = new URL(url); calls.push({ path: u.pathname, method: opts.method || 'GET', body: opts.body });
    if (u.pathname === '/api/cycle-score') return { ok: true, json: async () => ({ score: 47.1, zone: 're-accumulation', trendDelta7d: 0 }) };
    if (u.pathname === '/audiences/free/contacts') return { ok: true, json: async () => ({ id: 'c1' }) };
    if (u.pathname.startsWith('/contacts/')) return { ok: true, json: async () => ({ id: 'c1' }) };
    if (u.pathname === '/emails') return { ok: true, json: async () => ({ id: 'e1' }) };
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const r = res();
  try { await subscribe({ method: 'POST', url: '/api/subscribe', headers: { host: 'liftoffr.com', 'x-vercel-ip-country': 'in' }, body: { email: 'New@Example.test', magnet: 'map', v: 'b', utm_source: 'instagram', utm_medium: 'bio' } }, r); }
  finally { process.env = oldEnv; global.fetch = oldFetch; }
  assert.equal(r.code, 200);
  const patch = calls.find(c => c.path.startsWith('/contacts/'));
  assert.equal(patch.method, 'PATCH'); assert.deepEqual(JSON.parse(patch.body), { properties: { lead_magnet: 'map', country: 'IN', map_variant: 'b', signup_medium: 'bio' } });
  const email = JSON.parse(calls.find(c => c.path === '/emails').body);
  assert.equal(email.subject, 'Your Bitcoin Cycle Map'); assert.match(email.html, /bitcoin-cycle-map\.pdf/); assert.match(email.html, /47\.1/);
  assert.doesNotMatch(email.html, /playbook/i); assert.ok(email.tags.some(t => t.name === 'magnet' && t.value === 'map'));
});

test('map email 4 (day 8) teaches custody; affiliate links only when set, always disclosed', async () => {
  const now = Date.now();
  const contacts = [{ id: 'd8', email: 'd8@example.test', created_at: iso(now - 8.5 * DAY), unsubscribed: false }];
  let { sends } = await runCron({ contacts, props: { d8: 'map' } });
  assert.equal(sends.length, 1); assert.equal(sends[0].key, 'map-m4-d8');
  assert.match(sends[0].html, /recovery words/); assert.doesNotMatch(sends[0].html, /\(affiliate\)|ledger\.com|trezor\.io/);
  process.env.LEDGER_AFFILIATE_URL = 'https://shop.ledger.com/?r=abc'; process.env.TREZOR_AFFILIATE_URL = 'http://evil.example/trezor';
  try { ({ sends } = await runCron({ contacts, props: { d8: 'map' } })); }
  finally { delete process.env.LEDGER_AFFILIATE_URL; delete process.env.TREZOR_AFFILIATE_URL; }
  assert.match(sends[0].html, /shop\.ledger\.com\/\?r=abc/); assert.match(sends[0].html, /\(affiliate\)/);
  assert.doesNotMatch(sends[0].html, /evil\.example/, 'non-maker or non-https link is dropped');
});

test('India sign-ups get the INR Plan in map emails', async () => {
  const now = Date.now();
  const contacts = [1.5, 3.5, 5.5].map((d, i) => ({ id: 'in' + i, email: `in${i}@example.test`, created_at: iso(now - d * DAY), unsubscribed: false }));
  const { sends } = await runCron({ contacts, props: { in0: 'map:IN', in1: 'map:IN', in2: 'map:IN' } });
  const m1 = sends.find(s => s.key === 'map-m1-in0'), m2 = sends.find(s => s.key === 'map-m2-in1'), m3 = sends.find(s => s.key === 'map-m3-in2');
  for (const m of [m1, m2]) { assert.match(m.html, /₹799/); assert.match(m.html, /price=inr/); assert.doesNotMatch(m.html, /\$29/); assert.match(m.html, /menu_plan&price=inr/); }
  assert.match(m3.html, /an \$8 credit toward the Course/);
});

test('funnel ping: 204, forwards an anonymous country-only count, ignores bots', async () => {
  const oldEnv = process.env, oldFetch = global.fetch, calls = [];
  process.env = { ...oldEnv, GA4_MEASUREMENT_ID: 'G-TEST', GA4_API_SECRET: 'x' };
  global.fetch = async (url, opts = {}) => { calls.push({ url, body: JSON.parse(opts.body) }); return { ok: true, status: 204 }; };
  const run = async (ua, body) => { const r = res(); r.end = function () { return this; }; await subscribe({ method: 'POST', url: '/api/subscribe', headers: { 'user-agent': ua, 'x-vercel-ip-country': 'US' }, body }, r); return r; };
  try {
    const r = await run('Mozilla/5.0 (iPhone) Instagram 300', JSON.stringify({ ping: 'map_view', v: 'a', m: 'bio', p: '/map' }));
    assert.equal(r.code, 204); assert.equal(calls.length, 1);
    const b = calls[0].body; assert.equal(b.events[0].name, 'fp_map_view_a'); assert.deepEqual(b.user_location, { country_id: 'US' });
    assert.equal(b.events[0].params.medium, 'bio'); assert.ok(!('user_id' in b)); assert.doesNotMatch(JSON.stringify(b), /@/);
    await run('facebookexternalhit/1.1', { ping: 'map_view', v: 'a' });
    await run('Mozilla/5.0', { ping: 'evil_step', v: 'a' });
    assert.equal(calls.length, 1, 'bot and unknown step are not forwarded');
  } finally { process.env = oldEnv; global.fetch = oldFetch; }
});
