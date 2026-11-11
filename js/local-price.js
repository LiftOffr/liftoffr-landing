/* India pricing for the Plan (Torin, 2026-11-10: ₹799 at checkout).
 * Visitors whose device timezone is India see the INR edition of the same Plan
 * (hidden Whop plan plan_5oqMUKkQjazTX): price text becomes ₹799, Plan checkout
 * links point at the INR plan, and "$29 counts toward the Course" becomes the
 * $8 credit that edition carries. Everyone else sees the page unchanged.
 * QA overrides: ?price=inr forces India pricing, ?price=usd forces USD.
 * No cookie, no storage, no network call.
 */
(function () {
  var USD_PLAN = 'plan_MntgjXJaQnGsW', INR_PLAN = 'plan_5oqMUKkQjazTX';
  var forced = null;
  try { forced = new URL(window.location.href).searchParams.get('price'); } catch (_) {}
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}
  var india = forced === 'inr' || (forced !== 'usd' && (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta'));
  if (!india) return;

  var CREDIT = /\b([Yy]our) \$29( [Pp]lan)?( always)? (counts|credits) toward/g;
  function rewrite(text) {
    // "$$8" is a literal "$8" in a replacement string.
    return text.replace(CREDIT, '$1 ₹799 Plan earns an $$8 credit toward').replace(/\$29\b/g, '₹799');
  }
  function run() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode && n.parentNode.nodeName;
        if (p === 'SCRIPT' || p === 'STYLE' || p === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        return n.nodeValue.indexOf('$29') >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (t) { t.nodeValue = rewrite(t.nodeValue); });
    var links = document.querySelectorAll('a[href*="whop.com/checkout/' + USD_PLAN + '"]');
    Array.prototype.forEach.call(links, function (a) {
      a.href = a.getAttribute('href').replace(USD_PLAN, INR_PLAN);
      a.setAttribute('data-price-edition', 'inr');
    });
    document.documentElement.setAttribute('data-price-edition', 'inr');
    if (typeof window.track === 'function') window.track('local_price_shown', { currency: 'INR', page: location.pathname, links: links.length });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
