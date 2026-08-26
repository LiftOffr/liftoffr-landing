#!/usr/bin/env node
/* One-shot component sweep: re-send page_view when a visitor grants consent.
 *
 * The Consent Mode default block is duplicated inline in every public page (46 of
 * them) because it has to run before gtag.js loads. CLAUDE.md's rule applies: sweep
 * by component, not by page. This patches every copy and refuses to run if any copy
 * does not match the exact expected text, so a partial sweep cannot happen silently.
 *
 *   node scripts/patch_consent_pageview.js --check   (report only, exit 1 if unpatched)
 *   node scripts/patch_consent_pageview.js           (apply)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CHECK = process.argv.includes('--check');

const OLD = `    apply: function(ok){
      gtag('consent','update',{ analytics_storage: ok ? 'granted' : 'denied' });
      if (ok) startClarity();
    }`;

const NEW = `    apply: function(ok){
      gtag('consent','update',{ analytics_storage: ok ? 'granted' : 'denied' });
      if (!ok) return;
      startClarity();
      // Re-send the landing page_view. By the time anyone can click Accept, the
      // page_view has ALREADY gone out cookieless (gcs=G100), and GA4 does not
      // re-send it on a consent update -- measured 2026-08-26, the only hit that
      // follows the update is user_engagement. A G100 hit is excluded from GA4's
      // standard reports, so without this an accepting visitor's session_start and
      // their utm_source/medium/campaign are thrown away and the session lands
      // unattributed. page_location still carries the UTMs, so re-sending restores
      // attribution rather than inventing it.
      // This runs ONLY on an explicit Accept click -- apply() has exactly one caller,
      // decide() in js/consent.js -- so a declining or undecided visitor still has
      // nothing stored on their device and nothing re-sent. It is not a second hit
      // for a returning granted visitor either: for them the tag boots granted and
      // apply() is never called.
      gtag('event','page_view',{
        page_location: w.location.href,
        page_title: d.title,
        page_referrer: d.referrer || undefined
      });
    }`;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter(f => fs.readFileSync(f, 'utf8').includes('__loConsent'));
const already = [], patched = [], mismatched = [];

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  if (src.includes("gtag('event','page_view',{")) { already.push(f); continue; }
  if (!src.includes(OLD)) { mismatched.push(f); continue; }
  if (src.split(OLD).length - 1 !== 1) { mismatched.push(f + ' (multiple copies)'); continue; }
  if (!CHECK) fs.writeFileSync(f, src.replace(OLD, NEW));
  patched.push(f);
}

const rel = f => path.relative(ROOT, f);
console.log(`consent pages found: ${files.length}`);
console.log(`  already patched: ${already.length}`);
console.log(`  ${CHECK ? 'would patch' : 'patched'}: ${patched.length}`);
if (mismatched.length) {
  console.error(`  DID NOT MATCH (${mismatched.length}) -- fix by hand, do not ship a partial sweep:`);
  mismatched.forEach(f => console.error('    - ' + rel(f)));
  process.exit(1);
}
if (CHECK && patched.length) {
  console.error('CHECK FAILED: ' + patched.length + ' page(s) still unpatched');
  process.exit(1);
}
console.log(CHECK ? 'CHECK PASS: every consent page re-sends page_view on grant'
                  : 'SWEEP COMPLETE: all copies patched');
