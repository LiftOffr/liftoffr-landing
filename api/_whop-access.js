const FINAL_EVENTS = new Set(["membership.went_invalid", "membership.deactivated"]);
const INACTIVE = new Set(["canceled", "expired"]);
export function isFinalAccessEvent(type) { return FINAL_EVENTS.has(type); }
export function roleRevocationDecision({ eventType, planId, userId, membershipId, roleByPlan, snapshot, protectedGrant = false }) {
  if (!isFinalAccessEvent(eventType)) return { action: "keep", reason: "nonfinal_event" };
  const roleId = roleByPlan[planId];
  if (!roleId) return { action: "keep", reason: "unmapped_plan" };
  if (protectedGrant) return { action: "review", reason: "protected_or_manual_grant", roleId };
  if (!userId || !membershipId || !snapshot?.complete || snapshot.userId !== userId || !Array.isArray(snapshot.memberships)) {
    throw new Error("A complete user membership snapshot is required before role removal");
  }
  if (snapshot.memberships.some(m => m.user?.id !== userId)) throw new Error("Membership snapshot contains an unexpected user");
  const current = snapshot.memberships.find(m => m.id === membershipId);
  if (!current || current.plan?.id !== planId) throw new Error("The revoked membership could not be verified in the snapshot");
  const retained = snapshot.memberships.some(m => roleByPlan[m.plan?.id] === roleId && !INACTIVE.has(m.status));
  if (retained) return { action: "keep", reason: "other_or_current_entitlement", roleId };
  return { action: "remove", reason: "no_remaining_entitlement", roleId };
}
export async function fetchMembershipSnapshot({ companyId, userId, apiKey }, request = fetch) {
  if (!companyId || !userId || !apiKey) throw new Error("Whop company, user and API credentials are required for access verification");
  const url = new URL("https://api.whop.com/api/v1/memberships");
  url.searchParams.set("company_id", companyId);
  url.searchParams.set("user_ids[]", userId);
  url.searchParams.set("first", "100");
  const response = await request(url.toString(), { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) throw new Error(`Whop membership lookup failed (${response.status})`);
  const data = await response.json();
  // Preserve access if a list is partial; no unverified pagination contract.
  if (!Array.isArray(data.data) || data.page_info?.has_next_page !== false) throw new Error("Whop membership lookup was incomplete");
  if (data.data.some(m => m.user?.id !== userId)) throw new Error("Whop membership filter did not match the requested user");
  return { complete: true, userId, memberships: data.data };
}
