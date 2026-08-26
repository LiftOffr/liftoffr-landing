// Consent-mode beacon probe. MUST be run in a browser with NO EXTENSIONS.
//
// WHY: an ad blocker returns HTTP 200 for gtag/js with a neutered stub body, so the
// tag silently never runs and it looks exactly like a broken consent implementation.
// That is what made the 2026-08-26 'no beacon fires' report look real. Playwright's
// bundled Chromium has no extensions, which is the point of this file.
//
//   npm i playwright && npx playwright install chromium
//   node scripts/consent_probe.js https://liftoffr.com/ undecided|decline|accept
// Usage: node probe.js <baseUrl> [mode]
//   mode: undecided | decline | accept   (default: undecided)
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'https://liftoffr.com/';
const MODE = process.argv[3] || 'undecided';
const QS = 'utm_source=claude&utm_medium=diag&utm_content=claude_diag';
const TARGET = BASE + (BASE.includes('?') ? '&' : '?') + QS;

function parseCollect(u) {
  const q = new (require("url").URL)(u).searchParams;
  return {
    en: q.get('en'), gcs: q.get('gcs'), npa: q.get('npa'), gcd: q.get('gcd'),
    cid: q.get('cid'), tid: q.get('tid'), dma: q.get('dma'),
    _p: q.get('_p') ? 'set' : null,
    utm_content: q.get('ep.utm_content') || q.get('cs') || null,
  };
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const collects = [];
  const googleReqs = [];
  page.on('request', r => {
    const u = r.url();
    if (/\/g\/collect|\/collect\?|google-analytics\.com/.test(u)) {
      collects.push({ phase: global.__phase || 'load', url: u, parsed: parseCollect(u), method: r.method(), body: (function(){try{return r.postData()||null;}catch(e){return null;}})() });
    }
    if (/googletagmanager\.com/.test(u)) googleReqs.push(u.split('?')[0] + '?' + (u.split('?')[1] || '').slice(0, 40));
    if (/_vercel\/insights|vitals\.vercel/.test(u)) collects.push({ phase: (global.__phase||'load')+':VERCEL', url: u.split('?')[0], parsed: {vercel: r.method()} });
  });

  global.__phase = 'initial-load';
  await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  const diag = await page.evaluate(() => ({
    loConsentState: window.__loConsent ? window.__loConsent.state : 'MISSING',
    google_tag_data: typeof window.google_tag_data,
    google_tag_manager: typeof window.google_tag_manager,
    icsEntries: (() => { try { return JSON.parse(JSON.stringify(window.google_tag_data.ics.entries)); } catch (e) { return 'n/a'; } })(),
    dataLayerLen: (window.dataLayer || []).length,
    cookies: document.cookie,
    bannerVisible: !!document.getElementById('lo-consent'),
  }));

  if (MODE === 'decline' || MODE === 'accept') {
    const label = MODE === 'decline' ? 'Decline' : 'Allow analytics';
    global.__phase = 'after-' + MODE;
    const btn = page.locator(`#lo-consent button:has-text("${label}")`);
    if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(9000); }
    else console.log(`!! button "${label}" not found`);
  }

  const after = await page.evaluate(() => ({
    loConsentState: window.__loConsent ? window.__loConsent.state : 'MISSING',
    cookies: document.cookie,
    ls: (() => { try { return localStorage.getItem('liftoffr_consent_v1'); } catch (e) { return 'err'; } })(),
    icsEntries: (() => { try { return JSON.parse(JSON.stringify(window.google_tag_data.ics.entries)); } catch (e) { return 'n/a'; } })(),
  }));

  console.log("=== URL:", TARGET, '| MODE:', MODE, '===');
  console.log('googletagmanager requests:', JSON.stringify(googleReqs, null, 1));
  console.log('page state on load:', JSON.stringify(diag, null, 1));
  console.log('page state after choice:', JSON.stringify(after, null, 1));
  console.log(`/g/collect beacons: ${collects.length}`);
  collects.forEach((c, i) => { console.log(` [${i}] phase=${c.phase} ${c.method||''} ${JSON.stringify(c.parsed)}`); if (c.body) console.log(`      BODY: ${JSON.stringify(c.body)}`); });

  await browser.close();
})();
