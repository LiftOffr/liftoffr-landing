#!/usr/bin/env node
/* Does the consent banner actually render?
 *
 * WHY THIS EXISTS. On 2026-08-21 an edit to js/consent.js deleted a variable that
 * render() still referenced. `node --check` passed -- an undeclared identifier is a
 * ReferenceError at runtime, not a parse error -- and the file shipped. render()
 * threw on every page load, #lo-consent never entered the DOM, and for one deploy
 * the site had no consent surface at all: nobody could accept, nobody could decline,
 * and Clarity could never start. Nothing extra was collected, so it failed safe, but
 * the choice the banner exists to offer was not on the page.
 *
 * A syntax check cannot catch that. Executing render() can. This runs js/consent.js
 * against a minimal DOM stub and asserts the banner is built, both buttons exist, the
 * disclosure text is intact, the /privacy link sits outside the scrollable box, and
 * both decision paths behave. No dependencies; run it before any push that touches
 * js/consent.js.
 *
 *   node scripts/check_consent_banner.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'js', 'consent.js');
const failures = [];
const ok = (cond, label) => { if (!cond) failures.push(label); };

function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [], attrs: {}, style: { cssText: '' },
    _text: '', _html: '', listeners: {}, parentNode: null,
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; },
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    click() { (this.listeners.click || []).forEach(fn => fn({ target: this })); },
    get id() { return this.attrs.id || ''; },
    set id(v) { this.attrs.id = v; },
    get textContent() {
      return this._text + this._html.replace(/<[^>]+>/g, '') +
             this.children.map(c => c.textContent).join('');
    },
    set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); },
    get firstElementChild() { return this.children[0] || null; },
    contains(node) {
      if (node === this) return true;
      return this.children.some(c => c.contains && c.contains(node));
    },
    descendants() { return this.children.flatMap(c => [c, ...c.descendants()]); },
    querySelectorAll(sel) {
      const all = this.descendants();
      if (sel === 'button') return all.filter(e => e.tagName === 'BUTTON');
      if (sel.startsWith('a[href')) {
        const want = (sel.match(/href="([^"]+)"/) || [])[1];
        return all.filter(e => e.tagName === 'A' && (!want || e.getAttribute('href') === want));
      }
      return [];
    },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
  };
  return el;
}

function run(storedChoice) {
  const body = makeEl('body');
  const store = {};
  if (storedChoice) store['liftoffr_consent_v1'] = storedChoice;

  const document = {
    body,
    readyState: 'complete',
    createElement: makeEl,
    getElementById(id) { return body.descendants().find(e => e.id === id) || null; },
    querySelector: (s) => body.querySelector(s),
    querySelectorAll: (s) => body.querySelectorAll(s),
    addEventListener() {},
    getElementsByTagName() { return [makeEl('script')]; },
  };

  const state = { clarityStarted: false, consentUpdates: [] };
  const window = {
    document,
    innerWidth: 375, outerWidth: 375,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    __loConsent: {
      state: storedChoice || null,
      apply(granted) {
        state.consentUpdates.push(granted);
        if (granted) state.clarityStarted = true;
      },
    },
  };

  const src = fs.readFileSync(SRC, 'utf8');
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'localStorage', src)(window, document, window.localStorage);
  return { document, window, state, store };
}

// --- undecided visitor: the banner must be built ---
let r;
try {
  r = run(null);
} catch (e) {
  console.error('FAIL  render() threw: ' + e.message);
  process.exit(1);
}
const banner = r.document.getElementById('lo-consent');
ok(!!banner, 'banner element was not created');

if (banner) {
  const buttons = banner.querySelectorAll('button');
  ok(buttons.length === 2, `expected 2 buttons, got ${buttons.length}`);
  const labels = buttons.map(b => b.textContent);
  ok(labels.includes('Decline'), 'no Decline button');
  ok(labels.some(l => /allow/i.test(l)), 'no Allow button');

  const text = banner.textContent;
  ok(/session replays/i.test(text), 'disclosure no longer mentions session replays');
  ok(/what gets collected/i.test(text), 'link text "What gets collected" is missing');
  ok(/cookie/i.test(text), 'disclosure no longer mentions cookies');

  // The link is written as innerHTML, so find whichever element's markup carries it.
  const hasPrivacyLink = (el) => /<a[^>]+href="\/privacy"/.test(el.innerHTML || '');
  const linkHost = [banner, ...banner.descendants()].find(hasPrivacyLink);
  ok(!!linkHost, 'no /privacy link');
  const scroller = banner.firstElementChild;
  ok(!!scroller, 'banner has no first child');
  // The link must live OUTSIDE the scrollable box, or it can scroll out of reach
  // on a phone -- which is the one part of a disclosure that must never be hidden.
  if (linkHost && scroller) {
    ok(linkHost !== scroller && !scroller.contains(linkHost),
       '/privacy link is inside the scroll box');
  }

  // --- Decline must never start Clarity ---
  const decline = buttons.find(b => b.textContent === 'Decline');
  decline.click();
  ok(r.store['liftoffr_consent_v1'] === 'denied', 'Decline did not store "denied"');
  ok(r.state.clarityStarted === false, 'Decline started Clarity');
  ok(!r.document.getElementById('lo-consent'), 'Decline did not remove the banner');
}

// --- Allow must start Clarity ---
const r2 = run(null);
const allow = r2.document.getElementById('lo-consent').querySelectorAll('button')
  .find(b => /allow/i.test(b.textContent));
allow.click();
ok(r2.store['liftoffr_consent_v1'] === 'granted', 'Allow did not store "granted"');
ok(r2.state.clarityStarted === true, 'Allow did not start Clarity');

// --- an already-decided visitor must see nothing ---
const r3 = run('granted');
ok(!r3.document.getElementById('lo-consent'), 'banner rendered for an already-decided visitor');

if (failures.length) {
  console.error('CONSENT BANNER: *** FAIL ***');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
console.log('CONSENT BANNER: PASS  (renders, both buttons, text intact, /privacy outside the scroll box, both paths correct)');
