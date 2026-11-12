// Sunday Score: Plan buyers get the Course CTA + credit reminder; everyone else
// keeps the $29 Plan CTA with the Course as the third menu item. No Playbook.
import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.fetch = () => { throw new Error('Network forbidden during offline tests'); };
const { emailHTML, emailText, fetchPlanBuyerEmails } = await import('../api/cron-weekly-score.js');

const score = { score: 46.3, zone: 're-accumulation', trend: 'falling', trendDelta7d: -12.3, commentary: 'Fixture read.', components: {} };

test('free subscribers keep the Plan CTA and see the Course in the menu', () => {
  const html = emailHTML(score), text = emailText(score);
  assert.match(html, /Get the plan — \$29 once/);
  assert.match(html, /utm_content=menu_system/);
  assert.match(text, /liftoffr\.com\/plan/);
  assert.match(text, /liftoffr\.com\/system/);
  assert.doesNotMatch(html + text, /playbook|\$497/i);
  assert.doesNotMatch(html, /cta_buyer/);
});

test('Plan buyers get the Course CTA and the credit reminder, not the Plan pitch', () => {
  const html = emailHTML(score, { planBuyer: true }), text = emailText(score, { planBuyer: true });
  for (const body of [html, text]) {
    assert.match(body, /system\?utm_source=resend[^"\s]*utm_content=cta_buyer/);
    assert.match(body, /\$29 for the USD edition, \$8 for the INR edition/);
    assert.doesNotMatch(body, /\$29 once|\$29 at checkout|playbook|\$497/i);
  }
  assert.doesNotMatch(html, /liftoffr\.com\/plan\?/);
  assert.match(html, /Open your Plan/);
});

test('buyer list is read once, paginated, and matched case-insensitively', async () => {
  const calls = [];
  const request = async (url) => {
    calls.push(url);
    const page = calls.length === 1
      ? { data: [{ id: 'b1', email: 'Buyer@Example.test' }], has_more: true }
      : { data: [{ id: 'b2', email: 'second@example.test', unsubscribed: true }], has_more: false };
    return { ok: true, json: async () => page };
  };
  const set = await fetchPlanBuyerEmails({ RESEND_PLAN_AUDIENCE_ID: 'plan', RESEND_API_KEY: 'fixture' }, request);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].includes('/audiences/plan/contacts'));
  assert.deepEqual([...set].sort(), ['buyer@example.test', 'second@example.test']);
});

test('missing Plan audience config fails loudly (the send falls back to the free variant)', async () => {
  await assert.rejects(fetchPlanBuyerEmails({ RESEND_API_KEY: 'fixture' }, async () => { throw new Error('must not call'); }));
});
