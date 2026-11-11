// INR edition of the Plan (plan_5oqMUKkQjazTX, ₹799, added 2026-11-10).
// End-to-end over fixtures: a paid INR payment gets the access email, an $8
// System credit (created, then emailed), Plan Buyers enrollment and a GA4
// purchase in INR through the signed webhook. The USD edition is unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {Readable} from 'node:stream';
import fs from 'node:fs';
import {fulfillPlanPayment, planCreditEmail} from '../api/_plan-fulfillment.js';
import {planCreditCode, creditEligibility, creditPromoRequest, validateCreditPromo, PLAN_EDITIONS, CREDIT_COMPANY, CREDIT_PLAN, CREDIT_PLAN_PRODUCT, CREDIT_SYSTEM_PRODUCT} from '../api/_plan-credit.js';
import {CHECKOUT_PLANS, createCheckoutMetadata} from '../api/_checkout-attribution.js';
import webhook from '../api/whop-webhook.js';

const INR = 'plan_5oqMUKkQjazTX';
const config = {WHOP_API_KEY:'test-whop', PLAN_CREDIT_SECRET:'fixture-stable-credit-secret-at-least-32chars', RESEND_API_KEY:'test-resend', WHOP_WEBHOOK_SECRET:'test-signature-secret', GA4_MEASUREMENT_ID:'G-TEST', GA4_API_SECRET:'test-ga', CHECKOUT_ATTRIBUTION_SECRET:'fixture-checkout-attribution-key-at-least-32', RESEND_PLAN_AUDIENCE_ID:'test-audience'};
const user = {id:'user_india', email:'buyer.in@example.test'};
const member = {id:'mem_inr', status:'completed', user, company:{id:CREDIT_COMPANY}, plan:{id:INR}, product:{id:CREDIT_PLAN_PRODUCT}};
const now = Math.floor(Date.now()/1000);
const metadata = createCheckoutMetadata({planId:INR, consent:'granted', clientId:'123456789.1234567890', sessionId:String(now-60), utm:{utm_source:'instagram', utm_medium:'dm'}, position:'hero'}, config.CHECKOUT_ATTRIBUTION_SECRET);
const payment = {id:'pay_inr', metadata, paid_at:new Date().toISOString(), company:{id:CREDIT_COMPANY}, plan:{id:INR}, product:{id:CREDIT_PLAN_PRODUCT}, status:'paid', currency:'inr', subtotal:760.95, refunded_amount:0, refunded_at:null, auto_refunded:false, user, membership:{id:member.id}};
const code = planCreditCode(user.id, config.PLAN_CREDIT_SECRET);
const createdPromo = {id:'promo_inr', code, product:{id:CREDIT_SYSTEM_PRODUCT}, promo_type:'flat_amount', amount_off:8, currency:'usd', unlimited_stock:false, one_per_customer:true, new_users_only:false, churned_users_only:false, existing_memberships_only:false, stock:1, uses:0, duration:'once', status:'active', expires_at:null};
const ok = (data = {}, status = 200) => ({ok: status >= 200 && status < 300, status, json: async () => data});

async function fixture(options, run) {
  const oldEnv = process.env, oldFetch = globalThis.fetch, calls = [];
  let promos = options.promos || [];
  process.env = {...config, ...options.env};
  const request = async (url, opts = {}) => {
    const body = opts.body ? JSON.parse(opts.body) : undefined;
    calls.push({url, method: opts.method || 'GET', body, headers: opts.headers});
    if (url.endsWith('/payments/pay_inr')) return ok(options.payment || payment);
    if (url.endsWith('/memberships/mem_inr')) return ok(options.member || member);
    if (url.includes('/promo_codes?')) return ok({data: promos, page_info: {has_next_page: false}});
    if (url.endsWith('/promo_codes') && opts.method === 'POST') { promos = [{...createdPromo, amount_off: body.amount_off}]; return ok(promos[0]); }
    if (url === 'https://api.resend.com/emails') return ok({id: 'email_fixture'});
    if (url.includes('/audiences/')) return ok({id: 'contact_fixture'});
    if (url.startsWith('https://www.google-analytics.com/')) return ok({}, 204);
    throw new Error('Unexpected test network ' + url);
  };
  globalThis.fetch = request;
  try { await run({request, calls}); } finally { process.env = oldEnv; globalThis.fetch = oldFetch; }
}
const emails = calls => calls.filter(c => c.url === 'https://api.resend.com/emails');

test('INR edition is registered everywhere the Plan is', () => {
  assert.deepEqual(PLAN_EDITIONS[INR], {currency: 'inr', creditUsd: 8});
  assert.deepEqual(PLAN_EDITIONS[CREDIT_PLAN], {currency: 'usd', creditUsd: 29}, 'USD edition unchanged');
  assert.ok(CHECKOUT_PLANS.includes(INR));
  const hook = fs.readFileSync(new URL('../api/whop-webhook.js', import.meta.url), 'utf8');
  assert.match(hook, /plan_5oqMUKkQjazTX: "plan",/);
  assert.match(fs.readFileSync(new URL('../js/checkout-context.js', import.meta.url), 'utf8'), /plan_5oqMUKkQjazTX/);
});

test('INR payment is eligible for an $8 credit; currency mismatch and plan/membership mismatch are refused', () => {
  assert.deepEqual(creditEligibility(payment, member), {eligible: true, userId: user.id, email: user.email, amountOff: 8});
  assert.equal(creditEligibility({...payment, currency: 'usd'}, member).reason, 'not_positive_paid_payment');
  assert.throws(() => creditEligibility(payment, {...member, plan: {id: CREDIT_PLAN}}), /could not be verified/);
  assert.equal(creditPromoRequest(code, 8).amount_off, 8);
  assert.throws(() => creditPromoRequest(code, 10), /Unsupported/);
  assert.equal(validateCreditPromo(createdPromo, code).amountOff, 8);
});

test('end to end: paid INR payment gets access, then an $8 credit created and emailed', async () => fixture({}, async ({request, calls}) => {
  assert.equal((await fulfillPlanPayment('pay_inr', request)).status, 'access_and_credit_sent');
  const create = calls.find(c => c.url.endsWith('/promo_codes') && c.method === 'POST');
  assert.equal(create.body.amount_off, 8); assert.equal(create.body.base_currency, 'usd');
  const sent = emails(calls); assert.equal(sent.length, 2);
  assert.deepEqual(sent[0].body.to, [user.email]); assert.match(sent[0].body.html, /content-JnPHMvgbjjhcD9/);
  assert.equal(sent[1].body.subject, 'Your included $8 Plan credit');
  assert.match(sent[1].body.text, /\$8 credit toward The Cycle System/); assert.doesNotMatch(sent[1].body.text, /\$29/);
}));

test('USD credit email still says $29', () => {
  const m = planCreditEmail({status: 'ready', code, amountOff: 29});
  assert.equal(m.subject, 'Your included $29 Plan credit');
});

test('refunded INR payment gets nothing', async () => fixture({payment: {...payment, refunded_amount: 760.95, refunded_at: '2026-11-11'}}, async ({request, calls}) => {
  assert.notEqual((await fulfillPlanPayment('pay_inr', request)).status, 'access_and_credit_sent');
  assert.equal(emails(calls).length, 0);
}));

async function invoke(event) {
  const body = JSON.stringify(event), ts = String(Math.floor(Date.now()/1000)), id = 'msg_inr';
  const sig = crypto.createHmac('sha256', config.WHOP_WEBHOOK_SECRET).update(id + '.' + ts + '.' + body).digest('base64');
  const req = Readable.from([Buffer.from(body)]); Object.assign(req, {method: 'POST', headers: {'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': 'v1,' + sig}});
  const res = {status(n) { this.code = n; return this; }, json(o) { this.body = o; return this; }}; await webhook(req, res); return res;
}

test('signed webhook: INR payment joins Plan Buyers and reports an INR purchase to GA4', async () => fixture({}, async ({calls}) => {
  const r = await invoke({type: 'payment.succeeded', api_version: 'v1', data: payment});
  assert.equal(r.code, 200);
  assert.ok(calls.some(c => c.url.includes('/audiences/test-audience/contacts')), 'buyer enrolled in Plan Buyers');
  const ga = calls.filter(c => c.url.includes('google-analytics')); assert.equal(ga.length, 1);
  const p = ga[0].body.events[0].params; assert.equal(p.value, 760.95); assert.equal(p.currency, 'INR');
  assert.equal(p.items[0].item_id, 'bear-market-buy-plan-inr');
}));
