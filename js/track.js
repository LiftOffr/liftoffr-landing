/* LiftOffr — the missing funnel step between "clicked a CTA" and "paid".
 *
 * WHY THIS EXISTS
 * ---------------
 * The funnel had a hole exactly one step wide. On-site behaviour is measured
 * (page_view, scroll_depth, cta_clicked, lead_captured) and revenue is measured
 * (`purchase`, fired server-side from api/whop-webhook.js off the Whop webhook).
 * Between them, nothing. `cta_clicked` fires for internal navigation and for
 * outbound checkout links alike, so "how many people actually reached a Whop
 * checkout page" was not a number anyone could get, and therefore neither was
 * "how many of them abandoned it".
 *
 * That is the question the 8-13 August failed-checkout episode needed and could
 * not answer. `begin_checkout` is GA4's standard event for this position in an
 * ecommerce funnel, so the funnel reads: page_view -> cta_clicked ->
 * begin_checkout -> purchase, and checkout abandonment is the ratio of the last
 * two.
 *
 * DELIBERATE OMISSION: no `value`, no price.
 * ------------------------------------------
 * A price hardcoded here would be a second source of truth for money, and this
 * repo has a documented history of duplicated constants going stale in one copy
 * (see COPY_SWEEP_NOTES.md). Revenue is already carried by the server-side
 * `purchase` event using the amount Whop actually charged. What is missing is a
 * COUNT, and a count is what this sends. item_id identifies which product was
 * being bought without restating what it costs.
 *
 * NOT A PURCHASE EVENT. This fires when someone leaves for Whop, not when they
 * pay. It cannot double-count revenue, because it carries none.
 *
 * CONSENT: this file adds no transport of its own. It calls window.track(),
 * the same wrapper every other event on the site uses, which routes through
 * gtag() under the Consent Mode defaults set inline in each page's <head>.
 * If the visitor has not allowed analytics, analytics_storage is denied and
 * this event is subject to exactly the same gate as page_view. Nothing here
 * loads a vendor, sets a cookie, or reads storage.
 *
 * WHERE TO INCLUDE IT: every page that carries an `a[href*="whop.com/checkout"]`.
 * Today that is /plan, /playbook, /system and /welcome-plan -- and only those four;
 * the homepage and every other CTA route to /plan first. If you add a checkout
 * anchor to a new page, add this include with it. The last rollout of a script
 * like this picked its pages by grepping for 'whop.com' and silently skipped the
 * three biggest entry points, which is why first-touch was lost for weeks. This
 * file is safe to include anywhere: with no checkout anchor on the page it
 * attaches two listeners and never fires.
 *
 * ORDER: the listener is on the bubble phase on purpose. js/attribution.js
 * rewrites the outbound href during the CAPTURE phase to append the visitor's
 * first-touch utm_*; running after it means the source recorded here is the
 * same one that will reach the Whop order record, not the pre-decoration one.
 */
(function () {
  if (window.__loTrackStarted) return;      // idempotent if included twice
  window.__loTrackStarted = true;

  // Same map as GA4_ITEM_IDS in api/whop-webhook.js. These two must agree, or a
  // begin_checkout and the purchase it leads to will not join on item_id.
  var ITEM_IDS = {
    plan_MntgjXJaQnGsW: 'bear-market-buy-plan',
    plan_WHByzwILskLsc: 'cycle-system',
    plan_3SEycpErj9Zk7: 'cycle-system-founding',
    plan_uIpPdsPTSHdTp: 'cycle-playbook'
  };

  function planIdFrom(href) {
    var m = /whop\.com\/checkout\/(plan_[A-Za-z0-9]+)/.exec(href || '');
    return m ? m[1] : null;
  }

  function slot(a) {
    return a.getAttribute('data-cta-slot') ||
           a.getAttribute('data-cta') ||
           a.getAttribute('data-dest') ||
           (a.className || '').toString().slice(0, 40) ||
           'unlabelled';
  }

  function fire(a) {
    var href = a.getAttribute('href') || '';
    var planId = planIdFrom(href);
    if (!planId) return;
    if (typeof window.track !== 'function') return;   // page has no GA4: say nothing

    // Read the utm actually on the outbound URL. After attribution.js has run,
    // this is the first-touch source that Whop will record against the order,
    // which is what makes this event joinable to the server-side purchase.
    var q = {};
    try {
      var u = new URL(href, location.href);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
        var v = u.searchParams.get(k);
        if (v) q[k] = v;
      });
    } catch (e) { /* malformed href: send the event without the utm detail */ }

    window.track('begin_checkout', {
      item_id: ITEM_IDS[planId] || 'unmapped',
      plan_id: planId,
      page: location.pathname,
      cta_position: slot(a),
      utm_source: q.utm_source || '(direct)',
      utm_medium: q.utm_medium || '(none)',
      utm_campaign: q.utm_campaign || '(none)',
      utm_content: q.utm_content || '(none)'
    });
  }

  function onClick(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="whop.com/checkout"]');
    if (a) fire(a);
  }

  // click covers primary activation and keyboard Enter; auxclick covers the
  // middle-click-to-new-tab that opens a checkout without leaving the page.
  document.addEventListener('click', onClick, false);
  document.addEventListener('auxclick', onClick, false);
})();
