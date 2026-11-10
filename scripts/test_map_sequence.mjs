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
      return { ok: true, json: async () => ({ id, properties: props[id] ? { lead_magnet: { value: props[id], type: 'string' } } : {} }) };
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
  assert.match(toMap[0].html, /47\.1/); assert.match(toMap[0].html, /\/system\?/);
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
  try { await subscribe({ method: 'POST', url: '/api/subscribe', headers: { host: 'liftoffr.com' }, body: { email: 'New@Example.test', magnet: 'map', utm_source: 'instagram' } }, r); }
  finally { process.env = oldEnv; global.fetch = oldFetch; }
  assert.equal(r.code, 200);
  const patch = calls.find(c => c.path.startsWith('/contacts/'));
  assert.equal(patch.method, 'PATCH'); assert.deepEqual(JSON.parse(patch.body), { properties: { lead_magnet: 'map' } });
  const email = JSON.parse(calls.find(c => c.path === '/emails').body);
  assert.equal(email.subject, 'Your Bitcoin Cycle Map'); assert.match(email.html, /bitcoin-cycle-map\.pdf/); assert.match(email.html, /47\.1/);
  assert.doesNotMatch(email.html, /playbook/i); assert.ok(email.tags.some(t => t.name === 'magnet' && t.value === 'map'));
});
