/* LiftOffr first-touch attribution.  v4 — 2026-08-25
 *
 * Why this exists: the site had a shortlink layer (/ig, /yt, /clip -> /links?utm_source=...)
 * and a click tracker that fired a GA4 event, but nothing carried the source across an
 * internal navigation and nothing appended it to the outbound Whop URL. A visitor arriving
 * from /ig and buying on /plan produced a Whop order with no source on it at all, which is
 * why "did those checkouts come from Instagram or Whop Discover" was unanswerable.
 *
 * Whop records utm_* params against the membership (keys must start with utm_), and
 * api/whop-webhook.js already reads data.utm_source. This is the missing middle.
 *
 * INCLUDE THIS ON EVERY ENTRY POINT, not only pages that link to Whop. The original
 * rollout added the tag by grepping for 'whop.com', which silently skipped /score,
 * /free and /quiz — the three main free entry points, which link to /plan rather than
 * to Whop directly. First touch was therefore never recorded for the traffic the whole
 * funnel is built to receive, which is the exact problem this file exists to solve.
 *
 * First-touch, deliberately: someone who arrives from Instagram, reads for a week and
 * returns direct is an Instagram acquisition. Last-touch would relabel them "(direct)"
 * and understate every channel that actually works.
 *
 * ------------------------------------------------------------------------------------
 * WHAT CHANGED IN v4, AND WHY THE GUARD IS THE LOAD-BEARING HALF
 *
 * The bug: capture() opened with `if (load()) return;`. An untagged first visit wrote
 * {utm_source:'direct', utm_medium:'none'} permanently. A later arrival genuinely tagged
 * utm_source=instagram was then discarded, and decorate() stamped 'direct' on the outbound
 * Whop URL. Every Instagram DM click was booked as direct traffic.
 *
 * Fix, part 1 — PLACEHOLDER UPGRADE. A UTM-carrying arrival may overwrite the stored
 * record only when that record is a placeholder: a 'direct' source, or a source we merely
 * inferred from a referrer hostname (utm_medium === 'referral'). Neither is a claim about
 * a campaign; both are what we wrote down because we had nothing better. A genuine tagged
 * first touch is never overwritten — first-touch semantics are unchanged for real touches.
 * An untagged arrival never overwrites anything, ever.
 *
 * Fix, part 2 — INTERNAL-SOURCE GUARD. Part 1 alone is worse than the bug it fixes.
 * Roughly 53 links in this repo are tagged utm_source=liftoffr, and /cycle's own CTAs
 * carry utm_source=cycle. Those are placement labels for internal navigation, not
 * acquisitions. Without a guard, a visitor who arrives from Google organic (stored as
 * google.com / referral — a placeholder) and then clicks the nav is rewritten to
 * 'liftoffr'. That converts "everything is direct" into "everything is liftoffr", which
 * is strictly worse, because a report full of 'liftoffr' looks plausible and nobody
 * catches it.
 *
 * The guard needs BOTH tests; neither is sufficient alone:
 *   - Same-host referrer alone misses typed URLs. /checklist and /buyzone are 307
 *     redirects to /quiz?utm_source=liftoffr&utm_medium=redirect. Type liftoffr.com/checklist
 *     into the address bar and you land on an internally-sourced URL with NO referrer at all.
 *   - The source list alone misses any future internal link that forgets the label, and
 *     says nothing about a page that adds one.
 *
 * Classification is by ORIGIN OF THE CLICK, not by target. Only 'liftoffr' and 'cycle'
 * are internal. 'resend', 'email', 'beehiiv' and 'widget' all point at internal pages,
 * but the click originates in somebody's inbox or in a third-party site embedding the
 * score widget — those are genuine acquisitions and MUST stay upgradeable. Full list of
 * every utm_source in the repo as of 2026-08-25:
 *     internal : liftoffr, cycle
 *     external : resend, email, beehiiv, widget, instagram, tiktok, youtube, x,
 *                clippers, shortlink
 * ('shortlink' is /start, /join, /founder, /discord — no page in this repo links to
 * those paths; they exist to be pasted into a DM or said out loud, so their clicks
 * originate off-site.) If you add an internal placement label, add it to INTERNAL_SOURCES
 * below or it will start eating real acquisitions silently.
 *
 * NOT DONE, deliberately: consent-deferred storage. It was built and tested on
 * 2026-08-24 and rejected — a deferred record lives only in the memory of the page that
 * captured it, so anyone who navigates before accepting loses first touch entirely,
 * which is the same class of failure this file exists to prevent.
 */
(function () {
  var KEY = 'lo_attr';
  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  // Internal placement labels. A click carrying one of these did not acquire anybody —
  // it moved somebody we already had from one page to another. Compared lower-case.
  var INTERNAL_SOURCES = ['liftoffr', 'cycle'];

  function store(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  function host(u) {
    try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; }
  }

  // A placeholder is a record we invented because the arrival carried no campaign tags:
  // 'direct' (no referrer at all) or a bare referrer hostname (medium 'referral'). Both
  // are guesses and may be replaced by a real tagged arrival. Anything else is a genuine
  // first touch and is permanent.
  function isPlaceholder(rec) {
    if (!rec) return false;
    return rec.utm_source === 'direct' || rec.utm_medium === 'referral';
  }

  // Did this click start off-site? Two independent tests, either of which is enough to
  // call it internal. See the header for why one alone is not.
  function isInternalArrival(rec) {
    var s = (rec && rec.utm_source ? String(rec.utm_source) : '').toLowerCase();
    if (s && INTERNAL_SOURCES.indexOf(s) !== -1) return true;   // explicit label
    var r = document.referrer || '';
    if (r && host(r) === String(location.hostname || '').replace(/^www\./, '').toLowerCase()) {
      return true;                                              // same-host navigation
    }
    return false;
  }

  // Read utm_* off the current URL. Returns null when the arrival carries no tags at all.
  function tagsFromUrl() {
    var p = new URLSearchParams(location.search), rec = {}, has = false;
    FIELDS.forEach(function (f) { var v = p.get(f); if (v) { rec[f] = v.slice(0, 100); has = true; } });
    return has ? rec : null;
  }

  function capture() {
    var existing = load();
    var tagged = tagsFromUrl();

    if (existing) {
      // First touch wins, with exactly one exception: a real tagged arrival replacing a
      // placeholder we guessed at earlier.
      if (!tagged) return;                    // untagged arrival never overwrites anything
      if (!tagged.utm_source) return;         // tags without a source cannot name a channel
      if (!isPlaceholder(existing)) return;   // genuine first touch is permanent
      if (isInternalArrival(tagged)) return;  // internal nav is not an acquisition

      // first_seen is the anchor for utm_term=ft_<date>, which measures first-touch-to-
      // purchase lag. The person really did first show up on the placeholder's date, so
      // that date survives the upgrade; only the channel was wrong.
      tagged.first_seen = existing.first_seen || new Date().toISOString().slice(0, 10);
      tagged.landing = String(location.pathname || '').slice(0, 120);
      // Local forensics only, so a surprising channel mix can be explained later. This
      // key is NOT a utm_* field and decorate() writes an explicit allow-list, so it
      // cannot reach the URL or Whop. Keep it that way.
      tagged.upgraded_from = String(existing.utm_source || 'unknown').slice(0, 100);
      store(tagged);
      return;
    }

    // No record yet: original first-touch behaviour, unchanged.
    var rec = tagged || {};
    if (!tagged) {
      // No tags. Derive what we honestly can from the referrer; anything else is direct.
      var r = document.referrer || '';
      if (r && r.indexOf(location.hostname) === -1) {
        var h = host(r);
        if (!h) return;
        rec.utm_source = h; rec.utm_medium = 'referral';
      } else if (r) {
        return; // internal navigation with no tags: leave unset, a later landing may tag it
      } else {
        rec.utm_source = 'direct'; rec.utm_medium = 'none';
      }
    }
    rec.first_seen = new Date().toISOString().slice(0, 10);
    rec.landing = String(location.pathname || '').slice(0, 120);
    store(rec);
  }

  // Decorate outbound Whop links at click time, so the source reaches the order record.
  // Placement (utm_content) already hardcoded on a link is preserved; the visitor's real
  // acquisition source outranks any utm_source baked into the markup, which is only ever
  // an internal placement label and would otherwise overwrite the truth.
  //
  // The field list below is an explicit allow-list, not a loop over the record. That is
  // what keeps local bookkeeping (upgraded_from, landing, first_seen) out of the URL.
  function decorate(a) {
    var rec = load(); if (!rec) return;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
    if (!/(^|\.)whop\.com$/.test(u.hostname)) return;
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (f) {
      if (rec[f]) u.searchParams.set(f, rec[f]);
    });
    if (!u.searchParams.get('utm_content') && rec.utm_content) {
      u.searchParams.set('utm_content', rec.utm_content);
    }
    if (rec.first_seen) u.searchParams.set('utm_term', 'ft_' + rec.first_seen);
    a.setAttribute('href', u.toString());
  }

  capture();
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="whop.com"]');
    if (a) decorate(a);
  }, true);
  // Middle-click and keyboard activation don't fire click in every browser.
  document.addEventListener('auxclick', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="whop.com"]');
    if (a) decorate(a);
  }, true);

  window.loAttribution = load;
})();
