#!/usr/bin/env node
/* Does every page's cta_clicked selector cover every offer link that page has?
 *
 * WHY THIS EXISTS
 * ---------------
 * Three separate times on 20-21 Aug 2026, a cta_clicked selector went silent
 * because someone added a destination the selector did not enumerate:
 *
 *   1. /proof, /indicator-history and ten blog files were bound to
 *      a[href*="whop.com/"] on pages that have no Whop anchor. 0 events.
 *   2. The homepage was bound to /start and /founder, which are vercel.json
 *      shortlinks nothing on the page links. 0 of 29.
 *   3. The retired-magnet redirects made /quiz a funnel entry, and /proof and
 *      /track-record became steps on the way to a decision. Neither was in most
 *      selectors.
 *
 * Each time the fix was "add the missing destination to the list", and each time
 * the list was correct until the next destination appeared. The list is a
 * maintenance cost, not a solved problem — so this converts it into a failure
 * that gets caught rather than one that gets noticed weeks later in GA4.
 *
 * WHAT IT CHECKS
 * --------------
 * For every public HTML page that has a cta_clicked handler: extract the CSS
 * selector that handler is bound to, extract every internal link on the page
 * whose first path segment is an OFFER destination, and assert the selector
 * would match it. Reports the specific page, the specific silent destination,
 * and how many links are affected.
 *
 * It deliberately does NOT check nav or footer links (/privacy, /terms,
 * /disclaimer, /blog, ...). Those are not offers and firing cta_clicked on them
 * would be noise, which is its own kind of wrong number.
 *
 * WHAT IT CANNOT CHECK
 * --------------------
 * That the handler actually fires. A selector can be correct and the handler
 * still dead — that is what killed the consent banner, and it is why the real
 * verification is dispatching clicks in a browser and counting what reaches
 * dataLayer. This is the cheap check that runs on every push; that one is the
 * expensive check a human runs. Neither replaces the other.
 *
 * Usage: node scripts/check_cta_coverage.js   (exit 0 = pass, 1 = fail)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);

// The destinations a visitor is deliberately sent to. A link to one of these is
// a CTA; a link to anything else is navigation. Adding a product or a funnel
// entry means adding it here — and this file failing is the reminder to do it.
const OFFER_DESTINATIONS = [
  'plan', 'system', 'playbook',            // paid
  'score', 'free', 'quiz',                 // free entry points
  'receipts', 'proof', 'track-record',     // proof surfaces
];

// Context-dependent, so this script reports them and does not fail on them.
// A link to /indicators from a blog post is a CTA -- it is the free proof the
// post is arguing for. The same link between two sibling indicator pages is
// navigation, and firing cta_clicked on all eleven of them would be noise. A
// blanket rule gets one of those two wrong, so a human decides per page.
const ADVISORY_DESTINATIONS = ['indicators', 'indicator-history', 'cycle'];

// Not offers. Linking to these should not fire cta_clicked.
const NAVIGATION = new Set([
  'privacy', 'terms', 'disclaimer', 'about', 'blog', 'links', 'stack',
  'welcome', 'welcome-plan', 'faq', 'when-will-bitcoin-bottom', 'contact',
  'sitemap', 'lead-magnet', 'api', 'img', 'css', 'js', 'favicon.ico',
]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'scripts') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Pull the selector string out of `closest( ... )`, including the multi-line
// concatenated form. Returns the joined literal contents.
function extractSelector(src) {
  if (!src.includes('cta_clicked')) return null;
  // Union of EVERY closest() selector in the file, not the nearest one.
  // index.html has two handlers -- a /track-record branch and the main one --
  // and taking only the nearest reported all 35 of its links as silent, which
  // is the same class of mistake this script exists to catch. Also matches
  // template literals, which is the form /score, /plan and /quiz use.
  const m = [...src.matchAll(
    /closest\(\s*((?:'[^']*'|"[^"]*"|`[^`]*`)(?:\s*\+\s*(?:'[^']*'|"[^"]*"|`[^`]*`))*)\s*\)/g)];
  if (!m.length) return null;
  return m
    .map((x) => x[1].split('+').map((s) => s.trim().replace(/^['"`]|['"`]$/g, '')).join(''))
    .join(' , ');
}

// Pages that legitimately have no handler: not public, or not HTML anyone loads.
const NO_HANDLER_EXPECTED = new Set(['dashboard', 'logo-lab']);

function offerLinksIn(src, rel) {
  const out = [];
  for (const m of src.matchAll(/href="(\/[^"#]*)"/g)) {
    const href = m[1];
    const seg = href.replace(/^\//, '').split(/[/?]/)[0];
    if (!seg || NAVIGATION.has(seg)) continue;
    const advisory = ADVISORY_DESTINATIONS.includes(seg);
    if (!OFFER_DESTINATIONS.includes(seg) && !advisory) continue;
    if (rel.replace(/(index)?\.html$/, '').replace(/\/$/, '') === seg) continue;
    out.push({ href, seg, advisory });
  }
  return out;
}

function selectorCovers(selector, dest, href) {
  if (/\[data-dest\]/.test(selector) || /\[data-cta\]/.test(selector)) {
    // Can't statically know which anchors carry the attribute; treated below.
  }
  if (selector.includes(`a[href^="/${dest}"]`)) return true;
  // A bare-href matcher only covers untagged links.
  if (selector.includes(`a[href$="/${dest}"]`) && !href.includes('?')) return true;
  return false;
}

let failures = 0;
const advisories = [];
let pagesChecked = 0;

// Pages that vercel.json redirects never render, so their handlers cannot be
// wrong in a way anyone experiences. Read the redirect table rather than keeping
// a hand-maintained skip list -- a stale skip list is the same failure this
// script exists to catch, one level up. (/checklist, /buyzone and the two
// lead-magnet paths are all here as of 21 Aug 2026.)
const redirected = new Set();
try {
  const vc = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  for (const r of vc.redirects || []) {
    const src = String(r.source || '').replace(/^\//, '').replace(/\.html$/, '');
    if (src) redirected.add(src);
  }
} catch (e) {
  console.log('  (could not read vercel.json redirects; checking every page)');
}

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const route = rel.replace(/(index)?\.html$/, '').replace(/\/$/, '');
  if (redirected.has(route)) continue;
  if (rel.startsWith('lead-magnet/')) continue;   // retired, redirected
  const src = fs.readFileSync(file, 'utf8');

  // A page with offer links and NO handler at all must FAIL, not be skipped.
  // The first version of this script only examined files containing the string
  // 'cta_clicked', so the most common way tracking breaks -- no listener,
  // which is what silenced /cycle, /about, /404 and /welcome -- was invisible
  // to the check written to catch it. documents-e6 proved it by deleting the
  // whole handler from faq/index.html: PASS, exit 0, page count quietly 38->37.
  // Same disease as everything else: the check matched a proxy for the property
  // (does a selector cover its links?) instead of the property (is this page's
  // click-through measured?), and the proxy did not hold when the handler left.
  if (!src.includes('cta_clicked')) {
    const orphanLinks = offerLinksIn(src, rel).filter((l) => !l.advisory);
    if (orphanLinks.length && !NO_HANDLER_EXPECTED.has(route)) {
      failures++;
      const by = {};
      orphanLinks.forEach((l) => { by[l.seg] = (by[l.seg] || 0) + 1; });
      const parts = Object.entries(by).map(([d, n]) => `/${d} x${n}`).join(', ');
      console.log(`  FAIL ${rel}: NO cta_clicked handler at all, but links to ${parts}`);
    }
    continue;
  }

  // Second hole, same shape as the first, found by running documents-e6's own
  // regression against the fix for the first one. A page whose selector this
  // script cannot parse was printed as "check by hand" and then skipped --
  // which is a silent pass wearing a note. If the page has offer links and the
  // selector is unreadable, the honest result is FAIL: we could not verify it,
  // so we must not report it as covered. "I could not check this" and "this is
  // fine" are different answers and only one of them was being given.
  const selector = extractSelector(src);
  if (!selector) {
    const orphan = offerLinksIn(src, rel).filter((l) => !l.advisory);
    if (orphan.length && !NO_HANDLER_EXPECTED.has(route)) {
      failures++;
      const by = {};
      orphan.forEach((l) => { by[l.seg] = (by[l.seg] || 0) + 1; });
      const parts = Object.entries(by).map(([d, n]) => `/${d} x${n}`).join(', ');
      console.log(`  FAIL ${rel}: cta_clicked present but its selector could not be parsed, ` +
                  `and the page links to ${parts}. Unverifiable, not assumed fine.`);
    } else {
      console.log(`  ${rel}: cta_clicked present, selector unparseable, no offer links — ignored`);
    }
    continue;
  }
  pagesChecked++;

  const silent = new Map();
  const advise = new Map();
  for (const { href, seg, advisory } of offerLinksIn(src, rel)) {
    if (!selectorCovers(selector, seg, href)) {
      const bucket = advisory ? advise : silent;
      bucket.set(seg, (bucket.get(seg) || 0) + 1);
    }
  }
  if (silent.size) {
    failures++;
    const parts = [...silent.entries()].map(([d, n]) => `/${d} x${n}`).join(', ');
    console.log(`  FAIL ${rel}: selector does not cover ${parts}`);
  }
  if (advise.size) {
    const parts = [...advise.entries()].map(([d, n]) => `/${d} x${n}`).join(', ');
    advisories.push(`  note ${rel}: ${parts} not covered (CTA or navigation? your call)`);
  }
}

console.log('');
if (advisories.length) {
  console.log('Advisory — method-surface links, not failures:');
  advisories.forEach((a) => console.log(a));
  console.log('');
}
if (failures) {
  console.log(`CTA COVERAGE: *** FAIL *** — ${failures} of ${pagesChecked} pages have silent offer links`);
  console.log('Add the destination to that page\'s selector, then verify by dispatching');
  console.log('real clicks and counting dataLayer — a correct selector is not a firing handler.');
  process.exit(1);
}
console.log(`CTA COVERAGE: PASS — ${pagesChecked} pages, every offer link covered`);
