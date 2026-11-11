/* Anonymous funnel counts + the /map A/B split (added 2026-11-11).
 *
 * Sends {step, variant, medium, path} to /api/subscribe, which forwards a count
 * to GA4 with country only (see api/_funnel.js). No cookie, no identifier, and
 * it works whether or not the visitor answered the consent banner.
 *
 * The A/B split: on /map (data-assign="1") a visitor is put in variant a or b at
 * random and the choice is kept in localStorage, on this device only, so a
 * return visit sees the same headline and the thank-you page can report which
 * version led to the sign-up. ?v=a or ?v=b forces a variant for QA.
 * Steps: map_view, thanks_view (auto, from data-step), plan_click and
 * checkout_click (from clicks on /plan links and Whop checkout links).
 */
(function () {
  if (window.loFunnel) return;
  var me = document.currentScript;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var q;
  try { q = new URL(location.href).searchParams; } catch (e) { q = { get: function () { return null; } }; }
  var v = q.get('v');
  if (v !== 'a' && v !== 'b') v = get('lo_map_v');
  if (v !== 'a' && v !== 'b') v = me && me.getAttribute('data-assign') === '1' ? (Math.random() < 0.5 ? 'a' : 'b') : 'x';
  if (v !== 'x') put('lo_map_v', v);
  var m = q.get('utm_medium') || '';
  if (m) put('lo_map_m', m); else m = get('lo_map_m') || '';
  window.loMap = { variant: v, medium: m };
  document.documentElement.setAttribute('data-v', v);

  window.loFunnel = function (step) {
    var body = JSON.stringify({ ping: step, v: v, m: m, p: location.pathname });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/subscribe', new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch('/api/subscribe', { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
  };

  var auto = me && me.getAttribute('data-step');
  if (auto) window.loFunnel(auto);

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    if (t.closest('a[href*="whop.com/checkout/"]')) window.loFunnel('checkout_click');
    else if (t.closest('a[href^="/plan"]')) window.loFunnel('plan_click');
  }, true);
})();
