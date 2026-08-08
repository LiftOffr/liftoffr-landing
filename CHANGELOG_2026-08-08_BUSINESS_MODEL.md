# CHANGELOG — the business-model build-out (2026-08-08)

Synthesises the 2026-08-07 growth playbook and competitor teardown into
shipped infrastructure, inside the locked ladder and prices. Two commits
pushed (`9f33a6e`, `4edc8fb`), Vercel redeployed, all 13 new pages verified
live. Two new LaunchAgents installed and loaded. One Discord post live.

The definitive model doc is **`BUSINESS_MODEL_2026-08.md`** — money map, who
runs what, the weekly Torin loop, five KPIs, 90-day projections. Everything
below is what was built to make that doc true.

What still needs Torin is at the bottom, and it's the same four standing items
plus three new ones with money attached.

---

## 1 · The 56-hook bank is in the generator's rotation

`src/hook_bank_56.py` (new) + `src/hook_pack.py` (rewired).

The playbook's 56 hooks are **angles, not copy** — they're title-case and
CTA-first, and the house voice is lowercase and lifestyle-first. Shipping them
verbatim would have broken the style rules the generator exists to enforce. So
they seed the prompt and the model rewrites each into house voice.

What the code enforces, not asks for:

- **Rotation.** All 56 ship before any repeat, tracked in task state, advanced
  only on a run that actually wrote a file — a failed write doesn't silently
  burn eight angles.
- **Category interleaving.** Straight bank order groups by theme (hooks 1-10
  are all money/freedom), which would have produced a week of eight
  near-identical angles — the exact sameness the bank exists to fix. Seeds now
  round-robin across the six categories.
- **The two compliance flags.** Five hooks carry the `PLAN` keyword and three
  make a performance claim ("I sold in 2025", "called the top"). Both kinds
  ship **only in the single CTA slot**, because that's the slot carrying the
  ⸻ + "not financial advice" block. On a run where the 1-in-3 rotation blocks
  the keyword, there is no such slot, so both sit the round out. A performance
  claim with no disclaimer under it is the precise shape the FTC finfluencer
  sweep goes after — 23 cases in 2025, crypto first among them.

**Verified by running it:** 8 packs, 0 rejected, seeds `#1 #11 #23 #31 #41 #51
#2 #12` — one from each category, then wrapping. This week's pack is written.
Simulated eight weeks forward: 51 distinct angles used, no repeats, CTA hooks
appearing only on permitted rounds.

## 2 · Discord: a weekday engagement engine with a hard ascension cap

`src/discord_engage.py` + `com.liftoffr.discord-engage` (**installed, loaded**,
Mon/Wed/Fri 17:30 MT).

`weekly_engage` already owns Sunday in `#general-chat`. This owns three
weekdays, each in a **different** channel, so no channel hears from the bot more
than once a week:

| Day | Channel | Format |
|---|---|---|
| Mon | `#questions-daily` | One question from a 13-deep rotating deck, opened with the live Score and BTC price |
| Wed | `#general-chat` | **Indicator of the week** — live reading of one of the nine, a two-line plain-English explainer, and a link to its new `/indicators` page |
| Fri | `#wins-progress` | Wins **and losses** prompt, rotating |

Friday names losses on purpose: review sites treat wins-only trading servers as
a scam marker, and it's the cheapest legitimacy signal available.

**The ascension cap is the rule to read before editing this file.** At most
**1 in 3** posts carries a paid pointer, counted across all three formats in
task state. In a 70-member server where roughly four members aren't comped
friends, a buy link more often than that converts nobody and costs the room its
tone. `ASCENSION_EVERY = 3`, one constant.

The Wednesday format does three jobs at once: it's genuinely useful content,
it's a recurring reason to open the server, and it drives internal traffic to
the SEO pages that need it most.

**Verified live:** Friday's post is up in `#wins-progress`
(msg `1535445110685307010`), the counter reset, so Monday and Wednesday carry no
paid pointer. Data-fetch failure skips the day rather than posting a prompt with
an empty number in it — same rule `weekly_engage` uses.

I did **not** loosen the 1-in-3 cap. `BUSINESS_MODEL_2026-08.md` §9 carries a
written experiment for testing 1-in-2: four weeks at 3, four weeks at 2, measure
`cta_clicked` from Discord referrals plus member count, one variable, formats
frozen during the test.

## 3 · The onboarding DM was promising the $197 course for free

Found while auditing the drip, and it explains the open `📚 Studying` question
from the last pass.

**Day 3 of `onboarding_dm.py` told every new free member:** *"React 📚 on the
pinned message in `#🧰・course-resources` and Modules 2-6 appear in your sidebar
within the hour."*

Three things wrong with that, in ascending order:

1. `#course-resources` denies `VIEW_CHANNEL` to `@everyone`. Free members
   couldn't see the channel, so the instruction was dead on arrival.
2. The reaction-role message it referred to was **not pinned**, so a member
   following the instruction to "react on the pinned message" would not have
   found it there.
3. The course is now the **$197 System**. The DM was promising a paid product
   for free to every single new joiner, in writing, from an automated system.

**On `📚 Studying`** — ⚠️ my first read of this was wrong and §11 has the
correction. I searched only the *pinned* messages in `#course-resources` and
concluded nothing assigned the role. The reaction-role message existed; it just
wasn't pinned, and a second message in `#how-to-use-this-course` advertised it.
Both are deleted now. Still true: 0 of 70 members hold the role and the channel
was never visible to free members.

Day 3 now points at `/indicators`, which is free, real, and the surface that
wants the traffic. Added **Day 14** (the `/stack` tools DM), with the same
migration guard the day5 addition used — anyone already past day 7 is marked as
having received it, so adding a step doesn't fire a retroactive DM at 58
existing members. **Verified by dry run: 0 DMs would fire.**

## 4 · SEO: 11 programmatic pages, and the moat is a table nobody else has

`scripts/build_indicator_pages.py` (new) generates, from the live CBBI daily
series:

- `/indicators` — hub, all nine live readings
- `/indicators/{slug}` × 9 — RHODL, Puell, rainbow band, MVRV Z-Score, Pi Cycle,
  2Y MA Multiplier, Reserve Risk, Woobull Top Cap, NUPL
- `/when-will-bitcoin-bottom` — the keyword that is peaking right now

**Why these and not more blog posts.** ~68% of Google searches are zero-click
and educational finance gets 67-91% AI-Overview coverage — but live-data pages
sit in the ~7% coverage band and rank on utility. So every page leads with a
number that is true today.

**The moat is the historical table.** Each page shows what that indicator read
at every cycle top and bottom since 2013, computed from the source series. Every
value is looked up, never typed — that rule is what makes the tables safe to
publish. The generator's own output validates it: the 2025 top row prints
**$124,824**, matching the canonical anchor exactly, without that number
appearing anywhere in the script.

Each page also carries a **"Where it has been wrong"** section. Pi Cycle didn't
fire at the 2025 top. MVRV's peak reading has fallen every cycle. Puell breaks
across a halving. The rainbow band gets refitted as new data arrives, so old
readings aren't measured against the same curve. That section is E-E-A-T gold
and it's the one competitors skip.

**Cannibalisation avoided deliberately.** Five of the nine already have blog
explainers. The blog owns definition intent ("what is CBBI"); these own live
intent ("what does it read today"). Each canonicals to itself, and all six blog
posts now cross-link forward to their live page.

`/when-will-bitcoin-bottom` runs the arithmetic honestly: BTC is 49% below the
Oct 6 2025 top and 304 days in; the last three bears bottomed 363-410 days after
their top with 76-84% drawdowns. It states outright that nobody knows the date,
that three cycles isn't a sample, that every drawdown has been shallower than
the last (84% → 83% → 76%) so applying an old percentage understates the floor,
and that **LiftOffr does not publish price predictions**. Leaving the arithmetic
out entirely would have been the dishonest version; presenting it as a target
would have been the other one.

**Freshness is kept true, not claimed.** The generator owns a delimited block of
`sitemap.xml` so `lastmod` is accurate, and
`com.liftoffr.indicator-refresh` (**installed, loaded**, daily 07:20 MT)
regenerates and commits **only when the data actually changed**. It rebase-pulls
first to avoid fighting `youtube_intel`'s hourly push, refuses to run at all if
the tree has unrelated changes, and yields rather than forcing on conflict.
Both guards tested: the dirty-tree path caught its own untracked file, the clean
path correctly reported "no change in the data, nothing to commit".

Also: `OAI-SearchBot` added to `robots.txt` (the other AI crawlers were already
allowed).

## 5 · The affiliate layer, and the part where links stay honest

`/stack` — five tools, all clearing the master plan §9 brand filter: Ledger,
Trezor, Koinly, CoinLedger, TradingView.

**No link claims a commission that doesn't exist.** Every link currently points
at the manufacturer directly and is labelled *"Direct link — no commission"*.
One config block near the bottom of the page takes a tracking URL per tool, and
the label flips itself to "Affiliate link". Labelling a link affiliate before
it is one would be a false disclosure, which is worse than no disclosure — so
the label is derived from the URL rather than hand-written next to it.

Every tool card carries a **"where I'd skip it"** paragraph, including Ledger's
2020 customer-database breach and the fact that most readers don't need
TradingView's paid tier.

The page also names **what was turned down**: Coinbase, Kraken, OKX, Binance,
3Commas, Cryptohopper, anything with leverage. Those are the highest-paying
programs in the niche and every one pays more when the reader trades more —
a direct conflict with a site arguing you should trade less. That section is a
trust asset and it evaporates the day an exchange link appears on the page.

Placements: `/stack` (site), Day 9 of the free nurture, Day 1 of the plan-buyer
sequence, Day 14 of the Discord onboarding DM. Every affiliate click fires
`cta_clicked` with `destination: aff_<tool>`, so GA4 shows which programs are
worth applying to **before** applying.

Signup steps, terms, and application order are in `AFFILIATE_SETUP.md`.
Honest expectation, stated in both docs: **$20-80/month** at current traffic.

## 6 · Email: the plan-buyer sequence exists, and one membership-era leak closed

`api/cron-welcome-followups.js`.

**New plan-buyer sequence** (master plan §5) — D0, D1, D3, D7, D14, on the
Resend "Plan Buyers" audience, deduped by idempotency key like everything else.
D0 and D1 are **pure delivery with zero pitch**: a buyer upsold in the receipt
email learns the $29 was bait. D3 makes the System case once. D7 is the 2021
miss plus the receipts, and carries the review ask as an explicit
non-condition. D14 is the last dedicated ask and mentions the Playbook — which,
with `/welcome-plan`, is now one of only two routes to the $497 rung that exist
anywhere.

**Dormant until `RESEND_PLAN_AUDIENCE_ID` is set** in Vercel — same flag
`whop-webhook.js` already uses to populate the audience. Sending the free-list
sequence to buyers would be worse than sending nothing, so it fails closed.

**Day 3 of the free nurture was still membership-era.** It said *"Members of
LiftOffr get this framework as part of the 36-lesson course, plus a daily
3-minute brief in Discord"* and pointed at the homepage — pitching a product
that no longer exists, in the sequence the pivot explicitly re-aimed at the $29.
Now points at `/indicators`, which is free and real.

**New Day 9** — "The 5 tools I actually run this on". Goodwill plus the
affiliate layer, aimed at the majority who will never buy anything.

**All 11 templates render** — verified through the endpoint's preview mode:
`qw, e2, proof, e3, stack, reengage, p0, p1, p3, p7, p14`.

## 7 · `/plan` CRO — the remaining playbook items

The page already had the hero CTA, guarantee, price anchor and inline capture
from the last pass. Added:

- **Objection-handling block** — five things people think and don't ask: *this
  is probably a scam* (answered with three things to check before paying, all
  free), *I don't know enough*, *I don't have much money* (with an honest "then
  don't spend it here"), *what if it's wrong* (the $30K 2021 answer), *why only
  $29*.
- **Sticky mobile buy bar**, activating once the hero CTA scrolls off. Published
  tests put it at +9-14% on mobile, and IG traffic is effectively all mobile.
  It reuses the same href, so the embedded-checkout delegate picks it up
  unchanged.
- **Payment trust row** under the buy button.
- **First-person CTA copy** — "Get my plan — $29, once" everywhere.

## 8 · Discord, benchmarked against professional crypto servers

Torin's ask: *"as value packed and making people money as possible, with cool
automations like other professional crypto servers."* Here's what those servers
actually run, what LiftOffr already had, and what was missing.

### Slash commands — the biggest gap, now closed

Four commands, live and instant in the server:

| Command | What it answers |
|---|---|
| `/score` | Today's Score, zone, 7-day move, BTC price, plus the three hottest and three coldest indicators right now |
| `/indicator <name>` | Live reading for any of the nine, what it measures, and a link to where it has been wrong |
| `/bottom` | How far into this bear we are, measured against the last three |
| `/ladder` | What LiftOffr sells — free, $29, $197, $497, no subscriptions |

**Where they run, and why that matters.** The handler lives inside
`api/cycle-score.js`, not a new `api/discord.js`, because the project is **at**
Vercel's 12-function cap and every `api/*.js` counts. It's also the honest home:
that file already computes exactly what the commands answer. While in there I
extracted `computeAll()` and pointed the existing GET path at it, so the bot and
the JSON API physically cannot quote different numbers on the same day.

No gateway process, no always-on listener, nothing new to keep alive on a laptop
that is already the business's single point of failure.

**Security.** Ed25519 signature verification via `node:crypto`, zero
dependencies. Verification reads the **raw** body — the signature covers raw
bytes, so re-stringifying Vercel's parsed object would fail every request, which
is the classic way this integration silently breaks. Unsigned POSTs get a 401,
which Discord requires and actively tests.

**Verified end to end, twice.** Discord accepted the interactions endpoint,
which means it sent a real signed PING and our verification passed. Then I
generated a throwaway keypair, pointed the (now env-overridable) public key at
it, and exercised every command with genuine signatures: all four return valid
embeds, unknown commands and unknown indicators return ephemeral errors, and the
largest response is 1,118 bytes against Discord's 6,000-byte limit.

Registered guild-scoped rather than global so they appear **instantly** instead
of after up to an hour of global cache. Globals were cleared so the picker
doesn't list everything twice.

### Every bot post now looks like it came from the same company

Of the seven bots posting into the server, **exactly one** used embeds. The
other six posted raw text, so the feed looked like it was configured by
different people on different days.

New `src/lib/embeds.py` is the house style, with the rules in code rather than
in a caller's head:

- **Zone colour is derived from the number**, never passed in. A green embed
  over a reading of 88 is a lie told by a formatting bug.
- **Every embed carries the education-not-advice footer.** There is no code path
  that produces a LiftOffr embed without it.
- **Timestamps are the data's `asOf`**, not "now" — a brief built from
  yesterday's close says so.
- A monospace meter (`████░░░░░░`) renders a 0-100 reading on mobile with no
  image.

All six plain-text bots wired to it: `weekly_cbbi`, `macro_watch`,
`weekly_indicators`, `weekly_altcoin`, `btc_signals`, `urgent_alerts`.

**Deliberately a wrapper, not a rewrite.** Those six post copy that has been
tuned over months; re-authoring it field-by-field would have risked the content
to buy presentation. `embeds.wrap()` takes the first line as the title and the
rest as the body — and **returns `None` if the message won't fit**, so the
caller falls back to posting exactly what it posts today. Failing open to the
working behaviour beats a truncated market brief.

The conversational bots (`discord_engage`, `weekly_engage`) stay plain text on
purpose. A question to the room formatted as a corporate embed stops reading
like a person asking.

One bug caught by looking at a real rendered post rather than trusting the code:
stripping `*` from the ends of a title missed the leading pair whenever a line
opened with an emoji, producing `🌡️ **CBBI & Pi Cycle — weekly read`. Embed
titles don't render markdown anyway, so the markers are now removed outright.

### Self-serve ping roles, with no bot to keep running

Two opt-in roles, assigned through **Discord's native onboarding** — no
reaction-role bot, no gateway listener, nothing to fail:

| Role | Fires on | Frequency |
|---|---|---|
| 🔔 Cycle Alerts | The Score crossing a zone boundary | A few times a *cycle* |
| 📡 Signal Drops | Urgent alerts in the paid channels | Rare by design |

Both are **not mentionable**, so only Mission Control can ping them — a ping
stays a signal instead of something any member can fire at the whole room. Both
carry `permissions: 0`.

**Re-computed the permission map after adding them:** a free member still sees
exactly **21 channels**, and the two new roles unlock **nothing**. The
free/paid boundary from the last audit is intact.

### `zone_watch` — the one thing worth interrupting someone for

New `src/zone_watch.py` + `com.liftoffr.zone-watch` (**installed, loaded**,
daily 08:10 MT, just before the daily brief so the brief can reference it).

The Score moves every day and almost none of those moves matter. Crossing a zone
does: it's the event the entire framework exists to detect. So this is the only
automation allowed to mention a role, and it fires on a **state change** rather
than a schedule — a day with no crossing posts nothing at all.

It announces to the **free** feed on purpose. A zone change is the proof the
free layer exists to show; putting it behind the paywall would make the free
tier a lobby instead of a product.

**The first run records a baseline and stays silent.** Otherwise deploying it
would have fired a "zone change" alert at everyone for a zone we've been sitting
in for months. Verified: first run logged the baseline, second run no-oped, and
a forced dry run produced the correct embed and ping target.

`urgent_alerts` now pings 📡 Signal Drops on real alerts — and deliberately
**not** on its `--test` path, because a verification post must never ping people
who opted in for real signals.

### What was deliberately deferred

XP/levels, the engagement-triggered 72h trial, giveaways, chart battles, a
`/alerts` toggle command, and ticket automation. Every one is a real feature on
a bigger server and every one is currently the wrong trade — they amplify an
engaged community and they advertise an empty one. Full table with the revisit
trigger for each is in `BUSINESS_MODEL_2026-08.md` §10.

The `/alerts` command specifically was rejected because it would need the admin
bot token in a second system (Vercel env), and native onboarding already does
the same job with zero additional token exposure.

## 9 · The Whop storefront was still selling the killed subscription — fixed live

Applied directly in Torin's Brave browser (the Claude extension is connected
there; the earlier attempt failed because that session wasn't authenticated
yet). Live and verified at `whop.com/liftoffr/liftoffr-elite/`.

**What was actually there is worse than "the description is empty."** The v5 API
reports `description: null` on every product, which is why earlier passes
concluded there was nothing to write. That field simply isn't the surface the
storefront renders. The real page — **Live on Discover**, so it takes
marketplace traffic — was selling this:

> "Start with **7 days free** — no card, nothing charged automatically. Plans
> from **$49/mo (Core)** to **$249/mo (Elite** — includes a monthly 20-min
> 1:1). 30-day money-back on paid plans. **Cancel anytime.**"

Every one of those offers was killed on 2026-08-02. Several of the bullets it
sold as paid features — the daily brief, the cycle dashboard, macro watch — are
free now. And the FAQ carried this:

> **"What's the payback period?"** — "**Most members report payback** within
> their first cycle signal (2-4 weeks). One well-timed exit using Module 5
> confluence triggers **often covers months of membership**."

That is a fabricated proof claim (there is no data behind "most members
report") stacked on an implied-earnings claim — the exact pairing the FTC has
been pursuing in this niche, and a straight violation of the no-fabricated-proof
rule in BRAND_VOICE.

### What it says now

| Surface | Before | After |
|---|---|---|
| Headline | "Exit Bitcoin Tops 2-4 Weeks Early." | "The exact plan I'm buying this bear market with. $29, once." |
| Description | 7-day trial, $49-$249/mo tiers, cancel anytime, "one well-timed exit covers years of membership" | The 2025 exit at $124,824 and the 2022 $30K round-trip, both dated. A free/$29 split. "One payment. No subscription, no renewal, no upsell at checkout." Full disclaimer paragraph. |
| FAQ 1 | "What exactly is LiftOffr?" (membership) | Same question, answered as a public scoreboard + the plan I run against it |
| FAQ 2 | "What's included in my membership?" | "What's free and what's the $29 for?" — the actual split |
| FAQ 3 | "I'm new to crypto" → Module 1 of the course | Start on the free side; the $29 is a document, not a course |
| FAQ 4 | "30-day money-back… then cancel anytime" | "There's nothing to cancel — it's a one-time $29 payment" |
| FAQ 5 | **"What's the payback period?"** | **"Will this make me money?"** — *"I don't know, and nobody selling you something in this space does either — the difference is I'll say it out loud."* |

**Nothing about pricing, plans, visibility or Discover status was touched.**
Verified after saving: still $29.00, still Visible, still Live on Discover.

One correction I made to my own work mid-flight: the first headline I wrote led
with "Free cycle Score and daily brief." Then I looked at the rendered page and
the only button on it is a **$29 Buy now** — leading with "Free" on a page with
no free CTA is the same species of mismatch as the $997/$497 problem. Rewritten
to lead with the plan.

**Final check on the live page:** zero occurrences of `$49`, `$99`, `$249`,
`/mo`, "cancel anytime", "7 days free", "membership", "most members report" or
"payback period". Disclaimer present.

### The two dashboard wins — one is not what the research said it was

- **Automated messages / abandoned cart: not a native toggle in this account.**
  The 2026 research described it as a built-in Whop feature. In the current
  dashboard the equivalents are **third-party App Store apps** ("Email
  Marketing & Automations", "Automations"). Installing one grants a third party
  access to member data, may carry a fee, and overlaps with the Resend program
  that already runs every sequence. That is a decision with a real trade-off, so
  I did not install one — see the item below.
- **Connect Instagram: no such setting exists in this dashboard version.**
  Checked business Settings, Home preferences, and the product-level settings.
  Settings carries pixels (Google Analytics active; Meta, TikTok, X inactive)
  but no social-account connection.

Two things I did find while in there, both left alone deliberately:

- **`Settings → Checkout` reports "1 domain needs Apple Pay setup."** The
  playbook rates Apple Pay highly for one-tap iOS purchases, and `/plan` already
  runs embedded Whop checkout, so this is a genuine conversion item. It's a
  domain-verification flow, so it's yours.
- **Product `Growth tools` has "Show discount" and "Show member count", both
  off.** Leave "Show discount" off — it's the strikethrough fake-urgency pattern
  the master plan bans. "Show member count" is real proof rather than fabricated,
  but at ~20 members it reads as a weak number; worth turning on once it isn't.

### ⚠️ Found while in the dashboard: a second product is still selling $29/mo

**`LiftOffr Founder` (`prod_6gBXfN32SNbU3`) is Visible and its page reads
"Claim Founder Rate — $29/mo Forever."** with "Capped at 30 members." It sells a
monthly subscription that was killed — at a number that will be read as the $29
one-time plan.

I did **not** change it, and copy can't fix it: rewriting the page to drop the
monthly language would make the copy contradict what the checkout charges, which
is precisely the mistake that produced the $997/$497 mess. The only real fixes
are visibility or price, both of which are payment-surface decisions and yours.

Assessed exposure before leaving it: **not** listed on Discover, **0 active
users**, $30 all-time revenue, and **no link to it anywhere in the site repo** —
so it's reachable by direct URL only. Low risk, non-zero. `Founder Annual`
(`prod_KKTF8DklVBYZx`) is in the same state with $0 revenue.

The master plan already ruled that retired subscription plans should be hidden
from sale, so hiding both is arguably just executing a decision you already
made — it's one toggle each and fully reversible. I left it to you because it's
a sales surface, not copy.

## 10 · Reference sheets are PDFs now

The three course reference sheets shipped as raw `.md` attachments. On a phone
that opens as a wall of pipes and asterisks — and the Phase Matrix literally
says *"One page. Print it."* PDF was the format the content already assumed.

New `scripts/md_to_pdf.py`. No pandoc, no weasyprint, no new dependency: a
focused markdown subset (only the constructs these files actually use — tables,
headings, lists, fenced blocks, emphasis) rendered to HTML and printed by the
headless Chrome already in the Playwright cache.

**Rendered for paper, not for the dark UI.** White background, black text, red
rule under a `liftoffr` masthead, zebra-striped tables, and the fill-in blocks
as monospace forms with a red left border. A dark-background PDF is unprintable
and unreadable in daylight, which defeats the entire point of these documents.

Two things caught by rendering a page and *looking* at it rather than trusting
the code:

- **Chrome was stamping its own header and footer on every page** — the print
  date across the top and, worse, `file:///tmp/liftoffr-pdf/out/Phase-Matrix.html`
  across the bottom. Every member download would have carried a local file path
  from my scratch directory. Fixed with `--no-pdf-header-footer`; the document's
  own masthead and footnote block carry the branding and the disclaimer instead.
- **The wide matrix left a half-page of dead space**, because `break-inside:
  avoid` pushed it whole to the next page. Wide tables now break across pages
  with the header row repeating.

Every page carries the education-not-advice footnote. Sources and generated
PDFs are both kept in `discord-rebuild/reference-sheets/` so a re-render never
depends on downloading them back out of Discord.

Live: the PDF message is posted and pinned in `#course-resources`, the `.md`
message is deleted, and the two orphaned "pinned a message" system notices went
with it.

## 11 · Channel cleanup — every stale message, logged

Scanned **97 text channels**, 50 messages deep each, against nine
stale-content signatures. 35 raw hits, triaged down to 8 real problems. Every
action below is on a message the Mission Control bot owns. **Nothing
member-authored was touched.**

| # | Action | Channel | What was wrong |
|---|---|---|---|
| 1 | **EDIT** | `🧭・whats-locked-and-why` (pinned) | The price map — the canonical "here's what everything costs" post — listed **"🟠 $997 — The Cycle Playbook"** and "$997 = me, on your numbers". The plan charges $497. Both corrected. |
| 2 | **EDIT** | `🎯・1-on-1-playbook` (pinned) | Sales embed titled **"The Cycle Playbook — $997"**. → $497. |
| 3 | **DELETE** | `🚀・start-here` (pinned) | A pinned welcome selling **"Pro tier"**, **"Elite tier"**, a trial, and "react 📚 to unlock Modules 2-6". Superseded by the current pinned start-here embed, which is correct. |
| 4 | **DELETE** | `🧰・course-resources` | **The 📚 reaction-role message** — see the correction below. |
| 5 | **DELETE** | `🤔・how-to-use-this-course` | "React 📚 on the pinned message… Modules 2-6 appear for you" — same free-course promise, pointing at a message that no longer exists. |
| 6 | **EDIT** | `📢・announcements` | The July "State of LiftOffr" post still sold **Core $49/mo · Pro $99/mo · Elite $249/mo**, "7 days free, no card required", linked to `/start` — which now redirects to `/plan`, so the link contradicted its own sentence. **Kept as a record**, not deleted: a superseded banner added at the top, dead pricing struck through, current ladder named. |
| 7 | **EDIT** | `🎉・welcome` (pinned) | Opened *"Whether you just subscribed"* with a *"Just subscribed?"* field and pitched the course as included. Rewritten for the one-time ladder, pointing at start-here and the price map. |
| 8 | **DELETE ×11** | `💎・gem-radar` | Third-party memecoin forwards published under the Mission Control bot — `$MEOWSHI`, `$SHITCOIN`, `$STOCKCOIN`, `$CASHCAT`, raw contract addresses. Ruling 9 killed gem calls as a liability shape and the channel was archived, but the posts stayed up. **Full record archived to `data/gem_radar_archive_2026-08-08.json` before deleting** — the channel is empty of bot posts now, and nothing was destroyed. |

**Re-scanned after the sweep: 4 hits left, all correct to leave.** One is the
superseded banner I wrote matching my own regex. Three are the word
"shitcoins" appearing in course lessons that *warn against them* — checked each
in context rather than pattern-matching them into a deletion.

**Deliberately left alone:** `🔧︱whop-logs` "Membership was generated" entries
(a legitimate Whop event log in a staff channel, not marketing copy), and an
`altcoin-radar` post that tripped the `$549` filter with **BNB's price**.

### ⚠️ Correction to what I told you earlier about `📚 Studying`

Last pass I reported the role as "probably inert — nothing assigns it." **That
was wrong, and the method was wrong.** I checked only the *pinned* messages in
`#course-resources` and concluded no reaction-role message existed.

It existed. It just wasn't pinned:

> **📚 Taking the course?** React with 📚 below and Modules 2-6 appear in your
> sidebar within the hour…

It carried a live 📚 reaction, and a second message in
`#how-to-use-this-course` advertised it. So there *was* a documented path to a
role that opens all 48 lesson channels — the $197 product — and the onboarding
DM I rewrote was pointing new members straight at it.

Both messages are now deleted, so the path is gone. Still true: **0 of 70
members hold the role**, and `#course-resources` was never visible to free
members, so nobody appears to have used it. The role itself still exists with
its course-channel grants — with no message left to earn it from, that's inert,
but deleting the role outright is the clean finish and it's one click in Server
Settings if you want it gone.

## 12 · Whop listing copy doc is paste-ready for the rungs not yet built

`WHOP_LISTING_COPY.md` opened with a blocker: the Playbook charged $497 while
the page said $997. That was resolved in the last pass by aligning the page, so
all three descriptions are now safe to paste. Added a paste procedure, the
structural findings from the storefront teardowns (social proof does the work,
not prose — TJR's paid description is two sentences next to 2,209 reviews), and
a ranked table of **free Whop features currently switched off**: automated
messages/abandoned cart, connecting Instagram, review asks, member affiliates,
order bump, $497 waitlist.

**Content Rewards is documented but explicitly not recommended yet.** Clippers
amplify whatever the offer already converts at; the funnel currently converts
cold IG traffic at 0.013-0.034% views→site. Paying for another million views
through the same funnel buys the same rate at a bigger number. Revisit once one
organic reel clears the 0.1% bar.


## 13 · Clipping campaign — live per Torin, NOT independently verified

Torin reports the Content Rewards campaign is active. **I could not confirm any
of its settings**, and I'd rather say that than imply a check I didn't run.

Three routes, all closed:

| Route | Result |
|---|---|
| Whop API | `/v2/content_rewards/campaigns` and `/v2/campaigns` → **401, "API Key supplied does not have permission to access this route"**. `/v5/company/content_rewards` and `/v5/company/campaigns` → 404. |
| Content Rewards app UI | Same iframe auth failure as when creating it — the app never inserts its frame. |
| Public Discover listing | `/discover/content-rewards/` is the app's *product* page (reviews, install count), not a campaign index. No per-campaign public URL reachable. |

**So these remain unverified against the brief and are worth Torin eyeballing
once:** rate $1/1K, budget $1,000, min payout $5, max per video $250, manual
approval (not auto), platforms all four, Discover visibility on, and the linked
product being the **$29 front end** rather than the $197 System — that last one
matters most, because a clipper campaign pointing at the $197 would be sending
cold traffic at the rung the master plan says cold traffic must never see first.

## 14 · The campaign chat promise is now fulfillable

The campaign description tells clippers "hook bank, caption formats and the full
library drop in the campaign chat once you join." Nothing was there, so the
description was promising something that didn't exist.

`CLIPPER_WELCOME_POST.md` is the paste-ready post: how a winning clip is built,
**49 hooks** as burned-in overlay lines grouped by angle, a caption template
with both required disclosure lines pre-baked, the rejection rules, and payout
terms.

Hooks are the clipper-safe subset of the 56-bank. Excluded on purpose: the five
carrying the `PLAN` comment keyword (that's Torin's ManyChat funnel — a clipper
telling people to comment PLAN on *their own* post breaks the automation) and
the three stating the 2025 top exit (those are Torin's receipts to claim; a
clipper repeating them is precisely the income-claim shape the rules ban).

Could not post it — the campaign chat lives inside the same blocked app.

## 15 · ⚠️ The Drive footage folder is now the critical path

The campaign's entire differentiator is **"footage provided"** — that is the one
thing making a $1,000 pool competitive next to $250K campaigns. Until the Drive
link exists, a clipper who joins finds nothing to clip, and the campaign's
headline promise is false.

This is now the single most urgent open item, ahead of the PAT and the affiliate
signups, because it's the only one where money is already committed and burning
credibility while it waits.

---

# What still needs Torin

## 0. 🎬 Upload the clipper footage folder — the campaign is live and waiting on it

The campaign promises **"footage provided"**, and that promise is the only
reason a $1,000 pool competes with $250K ones. Right now there is no folder, so
a clipper who joins has nothing to clip.

Make a public-view Google Drive folder of approved clips, drop the link into the
campaign chat with `CLIPPER_WELCOME_POST.md`, and add it to the campaign
description. Until then the campaign is paying for attention it can't convert.

Also worth a 60-second look: I **could not verify** any campaign setting (API
returns 401 on the content-rewards routes, the app UI won't render). Confirm
rate $1/1K, budget $1,000, $5 min, $250 max, **manual** approval, and that the
linked product is the **$29 plan** — not the $197 System.

## 1. 🔴 Two Whop products still sell the dead $29/mo subscription

`LiftOffr Founder` and `Founder Annual` are both **Visible**, and the first one
advertises "Claim Founder Rate — **$29/mo Forever**". That number will be read
as the $29 one-time plan by anyone who lands on it.

Copy cannot fix this — rewriting the page to drop "monthly" would make it
contradict what the checkout charges, which is the exact failure mode of the
$997/$497 mismatch. The fix is one toggle: set both to **Hidden**. Neither has a
single active user, neither is on Discover, and nothing in the site links to
them, so hiding them costs nothing and breaks no grandfathered billing.

I left it because visibility is a sales surface and that's your call, not a copy
edit. Two clicks, fully reversible. Details in §9.

## The rest, in money order

### 1. ✅ The Cycle System — BUILT AND LIVE (2026-08-08)
`prod_b4DoR00YHuysT`, $197 `plan_WHByzwILskLsc` + $147/50-seat
`plan_3SEycpErj9Zk7`. Role delivery, /system, /welcome-plan and the emails are
all wired. See `FINISHED_PRODUCT_REPORT.md`. Original item below for the record:

### ~~1. 💵 Build The Cycle System in Whop — before Aug 24~~
Unchanged from the last pass and now more urgent, because the plan-buyer D3 and
D14 emails both point at `/system`. The page tells the truth today (opens
Aug 24, can't be bought yet); that stops being true on the 24th. Once the plan
exists: wire the checkout, delete the "why you can't buy it today" section, and
unhide the `/welcome-plan` bridge.

### 2. ✅ RESEND_PLAN_AUDIENCE_ID — DONE, and it was never actually missing
**Corrected 2026-08-08.** The audience existed and the env var was already set in
Vercel production. I verified it functionally rather than by assumption: the cron
resolved the audience, found its contact, and correctly sent nothing because that
contact sits outside every send window. The D0-D14 sequence is armed.

### 3. 🔗 Apply to the five affiliate programs — one sitting, ~45 minutes
Ledger → Trezor → Koinly → CoinLedger → TradingView, in that order and for the
reasons in `AFFILIATE_SETUP.md`. Approval takes days to weeks and nothing on the
site changes until you paste a URL, so there's no half-live state. Worth
$20-80/month now and materially more in the January-April tax window.

## The four standing items

### 4. 🔑 Rotate the PAT
Still unrotated, still the highest-priority open item, still not something I do
with a live credential. The scope is one repo — `liftoffr-landing` is the only
checkout with a remote and `youtube_intel.py` is the only automated pusher, so a
fine-grained token with **Contents: Read and write on
`LiftOffr/liftoffr-landing`** covers everything. The exact commands are in
`CHANGELOG_2026-08-08_CLEANUP.md` §1. Note that `com.liftoffr.indicator-refresh`
now pushes through the same credential daily, which adds a second live test of
the rotation.

### 5. 💰 $497 or $997 on the Playbook
The page and the charge agree at $497. Raising the Whop plan to $997 is one
dashboard edit and doubles the ceiling of the second-best revenue line — at 4
spots/month it is a **$2,000/month** decision. Worth making before the next
Playbook sale, not after.

### 6. 📚 The `📚 Studying` role — optional cleanup, no longer a risk
**Corrected in §11:** a reaction-role message for it did exist (I'd checked only
pinned messages last pass and missed it). It's deleted now, along with the
message advertising it, so there is no way left to earn the role. 0 of 70 hold
it. The role still carries its course-channel grants but nothing can assign
them — deleting the role in Server Settings is the tidy finish, not a fix.

### 7. 📮 Send the brand-deal outreach
The rate card and the 20-target list exist. **Zero emails have been sent.** This
is the highest dollars-per-hour line in the entire business — one deal per month
out-earns the whole product ladder at full target execution — and it is the only
line where the asset is built and the action isn't taken. One email per weekday
for four weeks is the whole ask.

## Unchanged, still open

The fleet still depends on `com.liftoffr.caffeinate` holding one laptop awake
with no failover; the Kalshi keys are still live on a concluded project; the GCP
service-account key is untouched since May 8.
