# LiftOffr — morning report, 2026-08-08

Overnight pass. Everything below is live and verified, not staged. The short
list of things that genuinely still need you is at the bottom — it is four
items, and only two of them cost money.

---

## The headline: the ladder is complete and every rung is buyable

**The Cycle System now exists in Whop and sells itself.** That was the biggest
open item on the board — the $197 rung was in every plan document, every email
and every Discord channel, and it did not exist as a product. It does now.

| Rung | Price | Plan ID | Where it's sold |
|---|---|---|---|
| Free | $0 | — | `/free`, the open Discord, all nine indicator pages |
| Buy Plan | $29 once | `plan_MntgjXJaQnGsW` | `/plan` — the only paid ask cold traffic sees |
| **The Cycle System** | **$197 once** | **`plan_WHByzwILskLsc`** | `/system`, `/links`, homepage footer |
| **System — founding** | **$147, 50 seats** | **`plan_3SEycpErj9Zk7`** | `/welcome-plan` + plan-buyer emails **only** |
| Playbook 1:1 | $497 once | `plan_uIpPdsPTSHdTp` | `/playbook`, `/links` |

Product: `prod_b4DoR00YHuysT`. All four checkouts return 200.

The founding plan is deliberately **hidden from the Whop store**. That is what
"founding price for plan buyers, never the first ask to cold traffic" means
mechanically — the public store shows $197, and $147 exists only behind the
links a $29 buyer receives. It closes Sep 7 or at the 50th seat.

**I wired role delivery before I made the page buyable.** `whop-webhook.js` had
no mapping for the new plans, so a $197 buyer would have paid and received
nothing. Both plans now grant `@System` as an *addon* rather than a tier, so a
System buyer who also owns the $29 plan keeps `@Plan`, and the 56 grandfathered
holders are untouched. Verified live: `@System` opens **80 channels** — the full
course, `#signals`, market intelligence, the hub.

**Two things Whop turned on by default that I turned off before saving:** a
fabricated **"$246.25 → $197, Save 20%"** strikethrough (an invented was-price,
which the master plan bans outright) and a member count that would have
displayed zero on a brand-new product.

---

## What else changed overnight

### The email sequence was already live — my previous note was wrong
I told you `RESEND_PLAN_AUDIENCE_ID` needed setting. It was already set in
Vercel production five days ago and points at the right audience. I verified it
functionally rather than assuming: triggering the cron resolved the Plan Buyers
audience, found its 1 contact, correctly identified that contact as outside
every send window, and sent **zero** emails. The D0→D14 buyer sequence is armed.

The D3 and D14 emails now link the founding checkout directly instead of a page
that sells $197.

### 🔒 A security hole in the email cron
`/api/cron-welcome-followups` accepted **`?force=1` *instead of* authentication**.
Any stranger who knew the URL could trigger list-wide sends, repeatedly. Auth is
now unconditional; the Vercel cron still authenticates normally.

### Sitewide consistency sweep
Every surface now says the same thing about what LiftOffr sells. Live check
across `/`, `/plan`, `/system`, `/playbook`, `/free`, `/links`, `/faq`,
`/terms`: **zero occurrences of $997, zero of "cancel anytime", zero of monthly
pricing, zero of "free trial."**

| Surface | Was |
|---|---|
| `/faq` | Titled *"How the Bitcoin Cycle Membership Works"*. Four answers and the FAQPage schema described the dead subscription — including *"you keep access until the end of your billing period."* Rewritten around free / $29 / $197. |
| `/terms`, `/privacy` | Legal pages promising a membership you could cancel in one click. Now describe one-time purchases and the 30-day refund. |
| `/welcome` | Post-checkout page told buyers to *"manage or cancel anytime."* |
| `/proof` | Trust row under the CTA read *"Cancel anytime."* |
| `/playbook` | *"on top of your membership."* |
| 2 blog posts | CTA boxes sold membership features (daily brief, threshold alerts, weekly deep dives) under a **$29 plan** link. Rewritten to the real free/$29/$197 split. |
| `/plan`, `/proof` | User-visible JS error said *"Subscription failed."* |

### Funnel gaps closed
The System went live with **no route in**: `/links` sold free → $29 → $497 and
skipped the $197 rung entirely, and the homepage had no `/system` link at all.
Both fixed — `/links` now carries the full four-rung ladder, homepage links it
from the footer (never the hero ask, per ruling 4).

### Discord brought in line
- `#whats-locked-and-why` — the canonical price map — said the System was not
  yet available and priced the Playbook at **$997**. Both corrected.
- `#the-cycle-system` sales embed said *"access notice posts when it opens."* It
  now says it's open and links the page.
- Two channel **topics** still carried $997.
- Full re-scan of all 97 channels: the only remaining hits are my own superseded
  banner and the audit log recording tonight's edits.

---

## The verified funnel, end to end

```
IG reel (faceless lifestyle, burned-in hook from the 56-angle bank)
   │
   ├─ caption CTA: "comment PLAN"  → ManyChat DM → /plan
   └─ bio link liftoffr.com/ig  →  307  →  /links        ✅ 200
                                              │
        ┌─────────────────────────────────────┼──────────────────────┐
        ▼                                     ▼                      ▼
   /free (email capture)              /plan  $29 ✅            /cycle, /indicators
        │                                │                     (free proof surfaces)
        ▼                                ▼
  Resend "LiftOffr Free"        Whop checkout plan_MntgjXJaQnGsW ✅ 200
  D1/3/5/7/9/18 ✅ verified                │
                                          ▼
                              /welcome-plan  ✅ bridge LIVE
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
              @Plan role in Discord              Resend "Plan Buyers"
              #plan-updates ✅ 22 ch             D0/1/3/7/14 ✅ verified
                        │                                   │
                        └──────────────┬────────────────────┘
                                       ▼
                       $147 founding  plan_3SEycpErj9Zk7 ✅ 200
                       (or $197 public plan_WHByzwILskLsc ✅ 200)
                                       │
                                       ▼
                       @System role → 80 channels ✅ verified
                       full course + #signals + the 3 PDFs
                                       │
                                       ▼
                       $497 Playbook  plan_uIpPdsPTSHdTp ✅ 200
```

**Verification run tonight:** 23 site pages + 9 indicator pages all 200. All 58
internal links resolve. Every shortlink (`/ig /tt /tiktok /yt /x /start /join
/founder /discord`) redirects correctly. Discord invite `discord.gg/r4TPRbk2s3`
valid, unlimited, 37 uses. 29 LaunchAgents loaded, **zero non-zero exits**.
Free-member channel count still exactly **21** — the paid boundary is intact and
the two new ping roles unlock nothing.

---

## What still needs you — four things

### 1. 💵 The Whop service fee is passed to the buyer
This is the one real decision I left alone, because it changes your take-home.

Your site says **"$29, once."** The checkout charges **$30.45** — Whop adds a
~5% service fee on top, plus local tax. On the System it's $197 → $206.85 before
tax. It is disclosed on Whop's payment step, so nobody is deceived, but the
number the buyer sees on your page is not the number they pay.

Two options: absorb the fee in Whop's settings (buyer pays exactly $29, you net
~$1.45 less per sale), or leave it. I added a line to `/system` noting the fee
is added at checkout. **`/plan` has no such line yet** — I left that page's copy
alone until you decide, because the fix depends on which way you go.

### 2. ✅ The two legacy $29/mo products — DONE
`LiftOffr Founder` and `Founder Annual` are both **Hidden** as of 2026-08-08.
Whop's confirm dialog states the scope exactly: *"private to everyone, whether
via a direct link or searchable on Discover"* — so the "$29/mo Forever" page is
no longer reachable by anyone. Verified via the API afterwards. All four live
ladder checkouts still return 200, and hiding a product does not touch existing
memberships, so grandfathered billing is unaffected.

### 3. 🔑 Rotate the GitHub PAT — still yours, for two separate reasons
**GitHub is signed out in Brave** (github.com/settings/tokens redirects to the
login page), so it is blocked on a login regardless.

And even signed in, generating a token means reading a live secret off the
screen and writing it into the keychain. I don't handle credential values —
that limit doesn't move with authorisation, because the failure mode is a
token ending up somewhere neither of us intended. This one is genuinely yours.

It is a five-minute job and the exact commands are in
`CHANGELOG_2026-08-08_CLEANUP.md` §1. A fine-grained token needs **Contents:
Read and write on `LiftOffr/liftoffr-landing` only** — nothing else on the
machine pushes anywhere. Two agents now push through it daily
(`youtube-intel` hourly, `indicator-refresh` 07:20), so the next hour is a
live test either way.

### 4. 🔗 Affiliate program signups
Checked tonight: **Ledger's affiliate portal is signed out**; TradingView is
signed into your normal account but "Become a partner" starts a *new affiliate
application*, not a link you can just copy.

Every one of the five is an account creation followed by tax and payout details
— data only you have, and account creation isn't something I do on your behalf.
So this stays yours. ~45 minutes for all five, steps and terms in
`AFFILIATE_SETUP.md`.

`/stack` is live and honest until then: every link says *"Direct link — no
commission"*, and flipping one to affiliate is a single URL paste into the
config block at the bottom of the page.

### Also worth knowing, no action needed tonight
- **`📚 Studying` is fully closed.** Both messages that granted it are deleted;
  0 of 70 hold it. Deleting the role is tidy, not a fix.
- **Aug 24** is now only the *warm-list announcement* date, as ruling 7b always
  intended — the System is already purchasable, so nothing breaks if that date
  slips.
- **Whop "automated messages"** is not a native feature in your dashboard; the
  equivalents are third-party apps that would get member-data access and overlap
  with Resend. I did not install one.
- **`Settings → Checkout`** reports *"1 domain needs Apple Pay setup"* — a real
  one-tap-conversion item for the embedded checkout on `/plan`.
- **Brand-deal outreach** deliberately not sent: the rate card still carries
  unverified numbers.

---

## Where the model stands

`BUSINESS_MODEL_2026-08.md` is the full map and it is unchanged in structure —
what changed tonight is that the $197 line stopped being theoretical. The
ladder's honest ceiling is still **$670–1,070/mo** at the plan's own target
inputs, and the two lines that beat it (one brand deal, four Playbook seats)
still have the assets built and the outreach unsent.

The binding constraint has not moved: **views→site is 0.013–0.034% against a
0.1% target.** Everything downstream of that number is now built, wired and
verified. Nothing downstream of it matters until it moves.
