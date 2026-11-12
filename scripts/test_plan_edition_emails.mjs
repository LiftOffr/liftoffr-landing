// Plan-buyer p7/p14 credit line follows the Plan edition ($29 USD, $8 INR).
import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.fetch = () => { throw new Error('Network forbidden during offline tests'); };
const { default: handler, planEdition } = await import('../api/cron-welcome-followups.js');

test('edition resolves from plan_edition, then country, else names both', () => {
  assert.equal(planEdition({ planEdition: 'inr' }).edition, 'inr');
  assert.equal(planEdition({ planEdition: 'plan_MntgjXJaQnGsW' }).edition, 'usd');
  assert.equal(planEdition({ country: 'IN' }).edition, 'inr');
  assert.equal(planEdition({ country: 'US' }).edition, 'usd');
  assert.equal(planEdition({ country: 'unknown' }).edition, null);
  assert.match(planEdition().counts, /\$29 for the USD edition, \$8 for the INR edition/);
});

async function preview(key) {
  const old = process.env;
  process.env = { ...old, CRON_SECRET: 'fixture' };
  const res = { status(n) { this.code = n; return this; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; }, setHeader() {} };
  try { await handler({ url: '/api/cron-welcome-followups?preview=' + key, headers: { authorization: 'Bearer fixture' } }, res); }
  finally { process.env = old; }
  assert.equal(res.code, 200);
  return res.body;
}

test('INR p7 says $8, USD p14 says $29, neither mentions the Playbook', async () => {
  const p7 = await preview('p7_inr');
  assert.match(p7, /\$8 credit counts toward it/);
  assert.doesNotMatch(p7, /your \$29 counts/);
  const p14 = await preview('p14_usd');
  assert.match(p14, /your \$29 still credits toward it/);
  for (const html of [p7, p14]) assert.doesNotMatch(html, /playbook|\$497/i);
});

test('p1 points at tier 1 of the worksheet, not a level in the document', async () => {
  const p1 = await preview('p1');
  assert.match(p1, /tier 1 of the worksheet/);
  assert.doesNotMatch(p1, /Choose one level|choose a single level/);
});

test('free D12 Course email is INR-aware and links /system', async () => {
  const { courseHTML, courseText, mapEdition } = await import('../api/cron-welcome-followups.js');
  const inr = courseHTML(null, mapEdition('IN')), usd = courseHTML(null, mapEdition('US'));
  assert.match(inr, /an \$8 credit toward the Course/);
  assert.match(inr, /system\?[^"]*utm_content=day12_course&price=inr/);
  assert.match(usd, /the full \$29 toward the Course/);
  assert.match(courseText(null, mapEdition()), /liftoffr\.com\/system/);
  for (const body of [inr, usd]) assert.doesNotMatch(body, /playbook|\$497/i);
});
