# Whop Setup Checklist — Two Things To Do In Whop Dashboard

These can't be done via code — they're dashboard-only configs in Whop. Both ~15 min total.

---

## 1. Webhook config (so the auto-welcome fires)

Whop dashboard → **Settings → Webhooks → Add Webhook**

**Endpoint URL:**
```
https://liftoffr.com/api/whop-webhook
```

**Subscribed events (check all of these):**
- ✅ `membership.activated`  ← critical, this is the trigger for new-member welcome
- ✅ `payment.succeeded`
- ✅ `payment.failed`
- ✅ `membership.went_invalid`
- ✅ `membership.deactivated`
- ✅ `membership.cancel_at_period_end_changed`
- ✅ `membership.went_valid`

The signing secret should already match `WHOP_WEBHOOK_SECRET` in Vercel env. If you regenerate it, update Vercel too.

**Required Vercel env vars** (Vercel dashboard → liftoffr-landing project → Settings → Environment Variables):
- `WHOP_WEBHOOK_SECRET` — already set
- `DISCORD_OPS_WEBHOOK` — already set
- `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` — already set
- `DISCORD_BOT_TOKEN` — **ADD THIS** — value from `~/.openclaw/secrets/discord.env`
- `DISCORD_WELCOME_CHANNEL_ID` (optional) — defaults to `#announcements`

After adding `DISCORD_BOT_TOKEN`, redeploy (any commit to main, or hit "Redeploy" in Vercel).

---

## 2. Cancellation save flow (retains 25-30% of would-be churners)

Whop dashboard → **Settings → Membership → Cancellation Flow** (or similar — exact menu path varies)

### Step-by-step config

**Cancellation reasons** (required dropdown shown to user before cancel):
- "Too expensive"
- "Not enough value yet"
- "Didn't have time to use it"
- "Found another solution"
- "Other"

**Required feedback field:**
- Min characters: **50**
- Prompt: *"What would have made you stay?"*

**Save offers per reason** (only show the right offer to the right reason):

| If they pick... | Show this save offer |
|---|---|
| **Too expensive** | `$15/mo for 3 months, then back to founder $29/mo` — 50% off, locked rate after |
| **Not enough value yet** | `Free 30-min 1-on-1 with Torin` — book via /book-your-1-on-1 |
| **Didn't have time** | `Pause subscription 30 / 60 / 90 days` — they keep access on resume, no re-onboard friction |
| **Found another solution** | No save offer. Just collect the feedback (which competitor?). Intel is more valuable than the save here. |
| **Other** | No save offer. Required 50+ char feedback. |

**Cancellation video (optional but high-leverage):**
60-second clip of you on camera saying *"If you're about to cancel, three things first..."* and listing the most underused features of the membership. Embed before the cancel-confirm button.

---

## After it's all configured

- New member subscribes → public welcome in `#announcements` + DM (if their DMs are open) + ops alert to your private channel
- Member tries to cancel → sees feedback form + matched save offer → if they go through, you get a churn alert in `#churn-alerts` so you can do a personal save outreach within an hour
- All events log to GA4 so you can build retention dashboards
