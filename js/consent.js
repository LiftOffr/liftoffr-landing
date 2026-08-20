/* LiftOffr cookie-consent banner.
 *
 * Added 2026-08-20. GA4, GTM and Microsoft Clarity all fired on every page with no
 * consent surface at all, and Clarity records session replays. This file renders the
 * banner and applies the choice; the *defaults* are set by a small inline snippet in
 * each page's <head>, because Google Consent Mode has to be initialised before the
 * GTM/gtag scripts load and an external file cannot be guaranteed to win that race.
 *
 * Contract with the inline head snippet:
 *   window.__loConsent = {
 *     state: 'granted' | 'denied' | null,   // null = undecided, show the banner
 *     apply: function (granted) { ... },    // updates Consent Mode + starts Clarity
 *   }
 *
 * Storage key: liftoffr_consent_v1. Clearing site storage brings the banner back,
 * which is what /privacy tells people to do to change their mind.
 *
 * Deliberately: no third-party CMP, no cookie set by this file (localStorage only),
 * no dark pattern -- Decline is the same size and weight as Accept, and nothing is
 * loaded until a choice is made.
 */
(function () {
  var C = window.__loConsent;
  if (!C || C.state) return;               // no snippet, or already decided
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', function () { render(); });
  } else {
    render();
  }

  function decide(granted) {
    try { localStorage.setItem('liftoffr_consent_v1', granted ? 'granted' : 'denied'); } catch (e) {}
    C.state = granted ? 'granted' : 'denied';
    if (typeof C.apply === 'function') C.apply(granted);
    var el = document.getElementById('lo-consent');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function render() {
    if (document.getElementById('lo-consent')) return;
    var wrap = document.createElement('div');
    wrap.id = 'lo-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-label', 'Analytics consent');
    wrap.style.cssText = [
      'position:fixed', 'left:12px', 'right:12px', 'bottom:12px', 'z-index:2147483000',
      'max-width:620px', 'margin:0 auto', 'background:#0d0d0d', 'border:1px solid #262626',
      'border-radius:14px', 'padding:16px 18px', 'box-shadow:0 18px 50px rgba(0,0,0,.6)',
      'font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
      'color:#bdbdbd', 'font-size:13.5px', 'line-height:1.6'
    ].join(';');

    var p = document.createElement('p');
    p.style.cssText = 'margin:0 0 12px;';
    p.innerHTML = 'This site can load Google Analytics and Microsoft Clarity. ' +
      '<strong style="color:#fff;">Clarity records session replays</strong> — mouse movement, ' +
      'scrolling and clicks on this site. None of it is needed for anything here to work, ' +
      'and nothing loads until you choose. ' +
      '<a href="/privacy" style="color:#e63946;">What gets collected</a>.';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';

    row.appendChild(button('Decline', false, '#161616', '#2a2a2a', '#ddd'));
    row.appendChild(button('Allow analytics', true, '#e63946', '#e63946', '#fff'));

    wrap.appendChild(p);
    wrap.appendChild(row);
    document.body.appendChild(wrap);

    function button(label, granted, bg, border, color) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'flex:1 1 160px;padding:11px 16px;border-radius:9px;font-size:13.5px;' +
        'font-weight:800;cursor:pointer;background:' + bg + ';border:1px solid ' + border +
        ';color:' + color + ';font-family:inherit;';
      b.addEventListener('click', function () { decide(granted); });
      return b;
    }
  }
})();
