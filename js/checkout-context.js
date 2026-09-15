/* Optional consented checkout context. Real links remain the fallback.
 * This adds no cookie or storage. It reads IDs only through gtag('get') after
 * explicit analytics consent. No email, Whop ID, card data or page URL is sent.
 * A slow/blocked tag or API returns the visitor to the ordinary hosted checkout.
 */
(function () {
  if (window.__loCheckoutContextStarted) return;
  window.__loCheckoutContextStarted = true;
  var enabledPlans = ['plan_MntgjXJaQnGsW', 'plan_WHByzwILskLsc'];
  var utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var busy = false;
  window.addEventListener('pageshow', function () { busy = false; });
  function consented() { return window.__loConsent && window.__loConsent.state === 'granted'; }
  function identifier(field) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 250);
      window.gtag('get', 'G-015PKWM24J', field, function (value) {
        if (!done) { done = true; clearTimeout(timer); resolve(value == null ? null : String(value)); }
      });
    });
  }
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        !consented() || typeof window.gtag !== 'function' || !window.fetch || !window.AbortController) return;
    var anchor = event.target && event.target.closest && event.target.closest('a[href*="whop.com/checkout/"]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    var original = anchor.href, url;
    try { url = new URL(original); } catch (_) { return; }
    var match = /^\/checkout\/(plan_[A-Za-z0-9]+)\/?$/.exec(url.pathname);
    if (url.origin !== 'https://whop.com' || !match || enabledPlans.indexOf(match[1]) < 0 || url.hash) return;
    // Preserve affiliate, coupon and any unfamiliar checkout option by keeping
    // its original URL. Never silently rebuild those links as a new session.
    if (Array.from(url.searchParams.keys()).some(function (k) { return utmFields.concat(['utm_term']).indexOf(k) < 0; })) return;
    event.preventDefault();
    if (busy) return;
    busy = true;
    var navigated = false, controller = new AbortController();
    function go(destination) {
      if (navigated) return;
      navigated = true; clearTimeout(deadline); controller.abort();
      window.location.assign(destination);
    }
    var deadline = setTimeout(function () { go(original); }, 1600);
    Promise.all([identifier('client_id'), identifier('session_id')]).then(function (ids) {
      if (navigated) return null;
      if (!consented() || !/^\d{1,20}\.\d{1,20}$/.test(ids[0] || '') || !/^\d{9,11}$/.test(ids[1] || '')) { go(original); return null; }
      var source = typeof window.loAttribution === 'function' ? window.loAttribution() || {} : {};
      var utm = {};
      utmFields.forEach(function (key) { utm[key] = String(source[key] || url.searchParams.get(key) || '').slice(0, 100); });
      return fetch('/api/reviews?action=checkout', {
        method: 'POST', credentials: 'same-origin', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: match[1], consent: 'granted', clientId: ids[0], sessionId: ids[1], utm: utm,
          position: String(anchor.getAttribute('data-cta-slot') || anchor.getAttribute('data-cta') || 'unlabelled').slice(0, 40) }),
      });
    }).then(function (response) {
      if (!response || navigated) return null;
      if (!response.ok) throw new Error('checkout_context_unavailable');
      return response.json();
    }).then(function (body) {
      if (!body || navigated) return;
      var checkout;
      try { checkout = new URL(body.checkoutUrl); } catch (_) { go(original); return; }
      if (!consented() || checkout.origin !== 'https://whop.com' || !/^\/checkout\/ch_[A-Za-z0-9]+\/$/.test(checkout.pathname) || checkout.search || checkout.hash) { go(original); return; }
      go(checkout.href);
    }).catch(function () { go(original); });
  }, false);
})();
