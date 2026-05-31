# LiftOffr Trial Launch — Activation Checklist

The site is now wired for a **7-day free trial → $49/mo** model, with the **$29/mo Founder rate** kept as a "pay now, skip the trial, lock it for life" option.

- **Trial plan:** `plan_aYmWvRCWPXqdB` — $49/mo, `trial_period_days: 7`, `initial_price: $0` (already configured & visible in Whop ✅)
- **Founder plan:** `plan_CH1L53GLZsaq1` — $29/mo, no trial (pay-now)
- **Single source of truth for the trial link:** the `/start` redirect in `vercel.json` → the trial checkout. All primary CTAs across `/`, `/links`, `/track-record` point at `/start`. To change the trial plan later, edit that one line.

## 0. What's already done in code (ships on next deploy)
- All primary CTAs → "Start 7 days free" (`/start`); `$29` demoted to a "skip the trial" secondary link
- `cta_clicked` tracking widened to fire on `/start`, `/founder`, `/join` (was whop.com-only — internal shortlinks weren't tracked before)
- Webhook fires `begin_trial` (value $0) on trial start instead of a phantom `$29` purchase; fires real `purchase` + `trial_converted` on payment
- Trial-nurture email sequence (Day 1 / Day 3 / Day 6 "ends tomorrow") built into `cron-welcome-followups.js`, **dormant until you do step 3 below**

## 1. (DONE) Verify the trial plan in Whop
Confirm `plan_aYmWvRCWPXqdB` is: free for 7 days, then $49/mo, **card required up front** (so it auto-charges on day 8). Already verified via API — just sanity-check the Whop checkout page renders "7 days free then $49/mo."

## 2. Turn on failed-payment recovery (dunning) — CRITICAL for a trial model
Whop dashboard → **Settings → Billing / Payments → Failed Payment Recovery (Smart Retries)**
- Enable automatic retries (Whop retries the day-8 charge over several days)
- Enable the failed-payment email to the member
- Day-8 charge failures are the #1 silent leak in any trial model — without this you lose converts who simply had a card decline.

## 3. (Optional now, recommended soon) Activate the trial email sequence
The nurture emails are built but gated behind one env var so they stay off until you opt in:
1. Resend dashboard → **Audiences → Create audience** → name it `LiftOffr Trial` → copy its UUID
2. Vercel → liftoffr-landing → Settings → Environment Variables → add `RESEND_TRIAL_AUDIENCE_ID` = that UUID → redeploy
3. Done. The webhook auto-adds every trial-starter to that audience, and the hourly cron emails them Day 1 (onboard), Day 3 (proof), Day 6 ("charged tomorrow — stay / lock $29 / cancel free").

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
