// Shared Discord alerting for the DCA automation.
//
// Everything Torin runs posts through the bot to a channel ID, not a webhook —
// so the DCA automation does too. This is deliberately the ONE place that knows
// how to reach Discord, so the DCA cron and the independent watchdog cron agree.
//
// #auto-buy-log is a private Staff-Area channel (not free-member-visible), so it
// is a safe home for order sizes. The channel ID is a documented, checked-in
// default — the same pattern CLAUDE.md allows for named channels — not a secret.
//
// Env: DISCORD_BOT_TOKEN (post to channel + open DM), OWNER_DISCORD_ID (DM target).

export const AUTO_BUY_LOG_CHANNEL = "1525516686424281260"; // #auto-buy-log (Staff Area, private)

// Post a message (string or {content, embeds}) to a channel as the bot.
export async function postToChannel(channelId, payload) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error("DISCORD_BOT_TOKEN not set — channel post skipped");
    return { ok: false, reason: "no bot token" };
  }
  // Bot messages ignore webhook-only fields (username/avatar); send content/embeds only.
  const body = typeof payload === "string" ? { content: payload } : {
    content: payload.content, embeds: payload.embeds,
  };
  const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) console.error(`Discord channel post failed: ${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`);
  return { ok: r.ok, status: r.status };
}

// DM the owner as the bot. Fallback path when a channel post is not enough.
export async function sendOwnerDM(content) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const ownerId = process.env.OWNER_DISCORD_ID;
  if (!botToken) return { ok: false, reason: "no bot token" };
  if (!ownerId) return { ok: false, reason: "no OWNER_DISCORD_ID env var set" };
  const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: ownerId }),
  });
  if (!dmRes.ok) return { ok: false, reason: `open DM failed: ${dmRes.status}` };
  const dm = await dmRes.json();
  const sendRes = await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return { ok: sendRes.ok, status: sendRes.status };
}
