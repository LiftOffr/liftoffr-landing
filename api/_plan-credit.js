// Fulfil the existing $29 Plan -> System credit. Server-side only.
// No public shared discount: one deterministic, single-use code per Whop user.
// Whop v1 money is in currency units. Reviewed 2026-09-14 against live payment
// and membership objects and docs.whop.com/api-reference/promo-codes/.
import crypto from "node:crypto";

export const CREDIT_COMPANY = "biz_1PHI81i7fkqRUZ";
export const CREDIT_PLAN = "plan_MntgjXJaQnGsW";
export const CREDIT_PLAN_PRODUCT = "prod_qkbRaW1vFT2cM";
export const CREDIT_SYSTEM = "plan_WHByzwILskLsc";
export const CREDIT_SYSTEM_PRODUCT = "prod_b4DoR00YHuysT";
const API = "https://api.whop.com/api/v1";
const id = value => typeof value === "string" ? value : value?.id;

export function creditEligibility(payment, membership) {
  if (id(payment?.company) !== CREDIT_COMPANY || id(payment?.plan) !== CREDIT_PLAN || id(payment?.product) !== CREDIT_PLAN_PRODUCT) {
    return { eligible: false, reason: "not_plan_payment" };
  }
  if (payment.status !== "paid" || payment.currency !== "usd" || !Number.isFinite(payment.subtotal) || payment.subtotal <= 0) {
    return { eligible: false, reason: "not_positive_paid_payment" };
  }
  // Whop retains status=paid after refunds. The refund fields are essential.
  if (payment.refunded_amount !== 0 || payment.refunded_at || payment.auto_refunded || payment.dispute_alerted_at ||
      (Array.isArray(payment.refunds) && payment.refunds.length) || (Array.isArray(payment.disputes) && payment.disputes.length)) {
    return { eligible: false, reason: "refunded_disputed_or_unknown" };
  }
  const userId = id(payment.user);
  if (!userId || id(membership?.user) !== userId || id(payment.membership) !== membership?.id ||
      id(membership.company) !== CREDIT_COMPANY || id(membership.plan) !== CREDIT_PLAN || id(membership.product) !== CREDIT_PLAN_PRODUCT) {
    throw new Error("Plan credit identity or membership could not be verified");
  }
  if (!["active", "completed"].includes(membership.status)) return { eligible: false, reason: "plan_not_active" };
  const email = payment.user?.email || membership.user?.email;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Verified buyer email is unavailable");
  return { eligible: true, userId, email: email.toLowerCase() };
}

export function planCreditCode(userId, secret) {
  if (!/^user_[A-Za-z0-9]+$/.test(userId || "") || typeof secret !== "string" || secret.length < 32) {
    throw new Error("A Whop user and stable PLAN_CREDIT_SECRET are required");
  }
  return "LPC" + crypto.createHmac("sha256", secret).update(`plan-credit-v1:${userId}`).digest("hex").slice(0, 24).toUpperCase();
}

export function creditPromoRequest(code) {
  return {
    account_id: CREDIT_COMPANY, amount_off: 29, base_currency: "usd", code,
    new_users_only: false, churned_users_only: false, existing_memberships_only: false,
    promo_duration_months: 1, promo_type: "flat_amount", one_per_customer: true,
    product_id: CREDIT_SYSTEM_PRODUCT, plan_ids: [CREDIT_SYSTEM], stock: 1, unlimited_stock: false,
  };
}

function validatePromoShape(promo, code) {
  if (!promo?.id || promo.code !== code || id(promo.product) !== CREDIT_SYSTEM_PRODUCT ||
      promo.promo_type !== "flat_amount" || promo.amount_off !== 29 || promo.currency !== "usd" ||
      promo.unlimited_stock !== false || promo.one_per_customer !== true ||
      promo.new_users_only !== false || promo.churned_users_only !== false || promo.existing_memberships_only !== false ||
      !Number.isInteger(promo.stock) || !Number.isInteger(promo.uses) || promo.stock < 0 || promo.stock > 1 ||
      promo.uses < 0 || promo.uses > 1 || (promo.uses === 0 && promo.stock !== 1) ||
      (promo.duration !== "once" && !(promo.duration === "repeating" && promo.promo_duration_months === 1))) {
    throw new Error("Plan credit promo does not match the promised single-use System credit");
  }
}

export function validateCreditPromo(promo, code) {
  validatePromoShape(promo, code);
  if (promo.uses === 1) return { status: "used", promoId: promo.id };
  if (promo.status !== "active" || promo.expires_at) throw new Error("Plan credit promo is unavailable; review before reissuing");
  return { status: "ready", promoId: promo.id, code, amountOff: 29, checkoutUrl: `https://whop.com/checkout/${CREDIT_SYSTEM}` };
}

async function responseJson(response, action) {
  if (!response.ok) throw new Error(`Whop ${action} failed (${response.status})`);
  return response.json();
}

export async function verifyPlanPayment({ paymentId, apiKey = process.env.WHOP_API_KEY }, request = fetch) {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId || "")) throw new Error("A verified Whop payment id is required");
  if (!apiKey) throw new Error("WHOP_API_KEY is required for Plan credit fulfillment");
  const headers = { Authorization: `Bearer ${apiKey}` };
  const read = async path => responseJson(await request(`${API}/${path}`, { headers, signal: AbortSignal.timeout(10000) }), "credit lookup");
  const payment = await read(`payments/${paymentId}`);
  if (payment.id !== paymentId) throw new Error("Whop returned an unexpected payment");
  // Exit before any membership/coupon calls for nonqualifying payments.
  if (id(payment.plan) !== CREDIT_PLAN || payment.status !== "paid" || payment.subtotal <= 0 ||
      payment.refunded_amount !== 0 || payment.refunded_at || payment.auto_refunded) {
    return { status: "ineligible", reason: "not_unrefunded_paid_plan" };
  }
  const membershipId = id(payment.membership);
  if (!/^mem_[A-Za-z0-9]+$/.test(membershipId || "")) throw new Error("Payment membership is unavailable");
  const eligibility = creditEligibility(payment, await read(`memberships/${membershipId}`));
  if (!eligibility.eligible) return { status: "ineligible", reason: eligibility.reason };
  return { status: "verified", email: eligibility.email, userId: eligibility.userId, paymentId, membershipId,
    subtotal: payment.subtotal, currency: payment.currency.toUpperCase() };
}

async function listComplete(read, resource) {
  let after = null;
  const seen = new Set(), rows = [];
  for (let page = 0; page < 50; page++) {
    const qs = new URLSearchParams({ company_id: CREDIT_COMPANY, first: "100" });
    if (after) qs.set("after", after);
    const data = await read(`${resource}?${qs}`);
    if (!Array.isArray(data.data) || typeof data.page_info?.has_next_page !== "boolean") throw new Error(`Whop ${resource} inventory was incomplete`);
    rows.push(...data.data);
    if (!data.page_info.has_next_page) return rows;
    after = data.page_info.end_cursor;
    if (!after || seen.has(after)) throw new Error(`Whop ${resource} pagination did not advance`);
    seen.add(after);
  }
  throw new Error(`Whop ${resource} inventory exceeded the verified pagination limit`);
}

async function findCredit(read, code) {
  const matches = (await listComplete(read, "promo_codes")).filter(p => p.code === code);
  if (matches.length > 1) throw new Error("Duplicate Plan credit codes require review");
  return matches[0] || null;
}

export async function ensurePlanCredit({ paymentId, apiKey = process.env.WHOP_API_KEY, secret = process.env.PLAN_CREDIT_SECRET }, request = fetch) {
  const eligibility = await verifyPlanPayment({ paymentId, apiKey }, request);
  if (eligibility.status !== "verified") return eligibility;
  const headers = { Authorization: `Bearer ${apiKey}` };
  const read = async path => responseJson(await request(`${API}/${path}`, { headers, signal: AbortSignal.timeout(10000) }), "credit lookup");
  const code = planCreditCode(eligibility.userId, secret);
  const findExisting = () => findCredit(read, code);
  let promo = await findExisting();
  if (!promo) {
    try {
      promo = await responseJson(await request(`${API}/promo_codes`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(creditPromoRequest(code)), signal: AbortSignal.timeout(10000),
      }), "credit creation");
    } catch (error) {
      // A timeout or concurrent creator must not mint a fresh second code.
      promo = await findExisting();
      if (!promo) throw error;
    }
  }
  const result = validateCreditPromo(promo, code);
  return { ...result, email: eligibility.email, userId: eligibility.userId };
}

// A historical refund must not revoke a credit earned by a later valid purchase.
// No coupon creation or email happens here. Call only from a mutation-enabled worker.
export async function revokePlanCreditForRefund({ paymentId, apiKey = process.env.WHOP_API_KEY, secret = process.env.PLAN_CREDIT_SECRET }, request = fetch) {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId || "") || !apiKey) throw new Error("A Whop payment id and API key are required");
  const headers = { Authorization: `Bearer ${apiKey}` };
  const read = async path => responseJson(await request(`${API}/${path}`, { headers, signal: AbortSignal.timeout(10000) }), "refund credit lookup");
  const payment = await read(`payments/${paymentId}`);
  if (payment.id !== paymentId) throw new Error("Whop returned an unexpected payment");
  if (id(payment.company) !== CREDIT_COMPANY || id(payment.plan) !== CREDIT_PLAN || id(payment.product) !== CREDIT_PLAN_PRODUCT) return { status: "not_plan_payment", paymentId };
  // Require positive, explicit API refund evidence, not merely an expired membership.
  if (typeof payment.refunded_amount !== "number" || !Number.isFinite(payment.refunded_amount) || payment.refunded_amount <= 0) return { status: "not_refunded", paymentId };
  const userId = id(payment.user), membershipId = id(payment.membership);
  if (!/^mem_[A-Za-z0-9]+$/.test(membershipId || "")) throw new Error("Refunded payment membership is unavailable");
  const member = await read(`memberships/${membershipId}`);
  if (member.id !== membershipId || id(member.user) !== userId || id(member.company) !== CREDIT_COMPANY || id(member.plan) !== CREDIT_PLAN || id(member.product) !== CREDIT_PLAN_PRODUCT) throw new Error("Refund credit identity could not be verified");
  const code = planCreditCode(userId, secret);
  let promo = await findCredit(read, code);
  if (!promo) return { status: "no_credit", paymentId };
  validatePromoShape(promo, code);
  const result = status => ({ status, paymentId, promoId: promo.id });
  if (promo.uses === 1) return result("used");
  if (["inactive", "archived"].includes(promo.status)) return result("already_inactive");
  if (promo.status !== "active") throw new Error("Refund credit promo status is unknown");
  for (const other of await listComplete(read, "payments")) {
    if (other.id === paymentId || id(other.plan) !== CREDIT_PLAN) continue;
    if (!id(other.user)) throw new Error("Plan payment inventory user identity is incomplete");
    if (id(other.user) !== userId) continue;
    // Detail verification handles money, refund fields, membership, product and user.
    const verified = await verifyPlanPayment({ paymentId: other.id, apiKey }, request);
    if (verified.status === "verified" && verified.userId === userId) return result("retained_eligible_purchase");
  }
  // Refresh immediately before disabling so a consumed promo is never intentionally changed.
  promo = await read(`promo_codes/${promo.id}`);
  validatePromoShape(promo, code);
  if (promo.uses === 1) return result("used");
  if (["inactive", "archived"].includes(promo.status)) return result("already_inactive");
  if (promo.status !== "active") throw new Error("Refund credit promo status is unknown");
  let updateError;
  try {
    await responseJson(await request(`${API}/promo_codes/${promo.id}`, {
      method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "inactive" }), signal: AbortSignal.timeout(10000),
    }), "refund credit revocation");
  } catch (error) { updateError = error; }
  const confirmed = await read(`promo_codes/${promo.id}`);
  validatePromoShape(confirmed, code);
  if (confirmed.id !== promo.id) throw new Error("Refund credit readback identity did not match");
  if (confirmed.uses === 1) return result("used");
  if (confirmed.status === "inactive") return result("revoked");
  throw updateError || new Error("Refund credit deactivation was not confirmed");
}
