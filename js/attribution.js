/* LiftOffr first-touch attribution.
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
 */
(function () {
  var KEY = 'lo_attr';
  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function store(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  // Capture on landing. First touch wins — never overwrite an existing record.
  function capture() {
    if (load()) return;
    var p = new URLSearchParams(location.search), rec = {}, has = false;
    FIELDS.forEach(function (f) { var v = p.get(f); if (v) { rec[f] = v.slice(0, 100); has = true; } });
    if (!has) {
      // No tags. Derive what we honestly can from the referrer; anything else is direct.
      var r = document.referrer || '';
      if (r && r.indexOf(location.hostname) === -1) {
        var h = '';
        try { h = new URL(r).hostname.replace(/^www\./, ''); } catch (e) {}
        if (!h) return;
        rec.utm_source = h; rec.utm_medium = 'referral';
      } else if (r) {
        return; // internal navigation with no tags: leave unset, a later landing may tag it
      } else {
        rec.utm_source = 'direct'; rec.utm_medium = 'none';
      }
    }
    rec.first_seen = new Date().toISOString().slice(0, 10);
    rec.landing = location.pathname.slice(0, 120);
    store(rec);
  }

  // Decorate outbound Whop links at click time, so the source reaches the order record.
  // Placement (utm_content) already hardcoded on a link is preserved; the visitor's real
  // acquisition source outranks any utm_source baked into the markup, which is only ever
  // an internal placement label and would otherwise overwrite the truth.
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
