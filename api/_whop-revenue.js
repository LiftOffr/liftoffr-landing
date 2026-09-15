// Whop v1 payment amounts are decimal currency units, not cents.
// Sources: docs.whop.com/api-reference/payments/payment-succeeded and /payment.
// Membership activation proves access, not a charge. Never invent revenue from
// a plan's catalogue price. Payment IDs distinguish renewals and dedupe retries.
export function purchaseFromWhopEvent(event) {
  if (event.type !== 'payment.succeeded') return { skip: 'not_payment_succeeded' };
  if (event.api_version !== 'v1') return { skip: 'unsupported_payment_schema' };
  const d = event.data || {};
  if (d.status !== 'paid') return { skip: 'payment_not_paid' };
  if (typeof d.id !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(d.id)) return { skip: 'missing_payment_id' };
  if (typeof d.subtotal !== 'number' || !Number.isFinite(d.subtotal) || d.subtotal < 0) {
    return { skip: 'invalid_subtotal' };
  }
  if (d.subtotal === 0) return { skip: 'zero_value_payment' };
  const currency = typeof d.currency === 'string' ? d.currency.toUpperCase() : '';
  if (!/^[A-Z]{3}$/.test(currency)) return { skip: 'invalid_currency' };
  return { transactionId: d.id, value: d.subtotal, currency };
}

const COMPANY = 'biz_1PHI81i7fkqRUZ';
// Verified against native Whop plans on 2026-09-14. Playbook shares the Plan
// product; its plan id, not the product alone, selects the separate 1:1 offer.
const VERIFIED_ADDON_PRODUCTS = {
  plan_WHByzwILskLsc: 'prod_b4DoR00YHuysT',
  plan_3SEycpErj9Zk7: 'prod_b4DoR00YHuysT',
  plan_uIpPdsPTSHdTp: 'prod_qkbRaW1vFT2cM',
};
const id = value => typeof value === 'string' ? value : value?.id;

export async function verifyAddonPurchase(event, { apiKey = process.env.WHOP_API_KEY } = {}, request = fetch) {
  const initial = purchaseFromWhopEvent(event);
  if (initial.skip) return initial;
  const original = event.data, planId = id(original.plan);
  const expectedProduct = VERIFIED_ADDON_PRODUCTS[planId];
  if (!expectedProduct) return { skip: 'not_verified_addon_plan' };
  if (!apiKey) throw new Error('Whop API credentials are required before addon payment fulfillment');
  const response = await request(`https://api.whop.com/api/v1/payments/${initial.transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Whop addon payment verification failed (${response.status})`);
  const current = await response.json();
  if (current.id !== initial.transactionId || id(original.company) !== COMPANY || id(current.company) !== COMPANY ||
      id(current.plan) !== planId || id(original.product) !== expectedProduct || id(current.product) !== expectedProduct ||
      !/^user_[A-Za-z0-9]+$/.test(id(original.user) || '') || id(current.user) !== id(original.user)) {
    throw new Error('Whop addon payment identity could not be verified');
  }
  // Top-level status can remain paid after a refund. Unknown refund evidence
  // fails closed, as do pending disputes; catalogue prices never fill a gap.
  if (current.refunded_amount !== 0 || current.refunded_at || current.auto_refunded || current.dispute_alerted_at ||
      current.substatus === 'refunded' ||
      (Array.isArray(current.refunds) && current.refunds.length) || (Array.isArray(current.disputes) && current.disputes.length)) {
    return { skip: 'addon_payment_refunded_disputed_or_unknown' };
  }
  return purchaseFromWhopEvent({ type: 'payment.succeeded', api_version: 'v1', data: current });
}
