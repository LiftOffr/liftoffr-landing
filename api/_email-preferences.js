import crypto from "node:crypto";

export function validUnsubscribeToken(email, token, secret) {
  if (!secret || typeof token !== "string" || !/^[a-f0-9]{16}$/.test(token)) return false;
  const expected = crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex").slice(0, 16);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
export function emailAudienceIds(env) {
  return [...new Set([
    env.RESEND_AUDIENCE_ID, env.RESEND_TRIAL_AUDIENCE_ID,
    env.RESEND_PLAN_AUDIENCE_ID, env.RESEND_QUIZ_AUDIENCE_ID,
    ...["ROUNDTRIPPED", "ACCUMULATING", "SITTING", "NEW"].map(segment => env[`RESEND_QUIZ_AUDIENCE_${segment}`]),
  ].filter(Boolean))];
}
export function unsubscribeHeaders(url) {
  return { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}
export async function unsubscribeFromAudiences(email, env, request = fetch) {
  const audiences = emailAudienceIds(env);
  if (!env.RESEND_API_KEY || !audiences.length) throw new Error("Email preferences are not configured");
  let failed = 0;
  for (const audience of audiences) {
    try {
      const response = await request(`https://api.resend.com/audiences/${audience}/contacts/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ unsubscribed: true }),
      });
      if (!response.ok && response.status !== 404) failed++;
    } catch { failed++; }
  }
  if (failed) throw new Error(`Email preference update failed for ${failed} audience(s)`);
}
export async function ensureAudienceContact(audience, contact, key, request = fetch) {
  const base = `https://api.resend.com/audiences/${audience}/contacts`;
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const existing = await request(`${base}/${encodeURIComponent(contact.email)}`, { headers });
  if (existing.ok) return;
  if (existing.status !== 404) throw new Error(`Resend contact lookup failed (${existing.status})`);
  const created = await request(base, { method: "POST", headers, body: JSON.stringify(contact) });
  if (created.ok) return;
  if (created.status === 409 || created.status === 422) {
    const raced = await request(`${base}/${encodeURIComponent(contact.email)}`, { headers });
    if (raced.ok) return;
  }
  throw new Error(`Resend contact creation failed (${created.status})`);
}
