/* Internal-source guard suite for the first-touch attribution script.
 *
 *   node js/attribution.internal.test.js js/attribution.js       # baseline (live file)
 *   node js/attribution.internal.test.js js/attribution.v4.js    # candidate
 *
 * Same harness as attribution.test.js: the target file is re-evaluated in a fresh `vm`
 * context per simulated page load, with localStorage persisting across loads.
 *
 * WHAT THIS SUITE IS FOR. Allowing a tagged arrival to replace a placeholder is only
 * safe if internal placement labels are excluded from it. ~53 links in this repo carry
 * utm_source=liftoffr and /cycle's own CTAs carry utm_source=cycle. If those upgrade a
 * placeholder, a Google-organic visitor who clicks the nav is relabelled 'liftoffr' and
 * the acquisition is destroyed — a failure that reads as plausible in a report, unlike
 * "everything is direct", and so goes uncaught.
 *
 * The guard needs two independent tests and this suite proves each is load-bearing:
 *   - the same-host referrer test alone fails the TYPED-URL cases below, because
 *     /checklist and /buyzone are 307 redirects to /quiz?utm_source=liftoffr with no
 *     referrer at all;
 *   - the source-list test alone fails the untagged-internal-link cases.
 *
 * It also pins the other half of the classification: sources that TARGET internal pages
 * but ORIGINATE off-site — resend, email, beehiiv, widget — are real acquisitions and
 * must stay upgradeable. Getting that backwards would silently discard the entire email
 * channel, which is 40 of the tagged links in the repo.
 *
 * Every utm_source found in the repo on 2026-08-25:
 *   internal: liftoffr, cycle
 *   external: resend, email, beehiiv, widget, instagram, tiktok, youtube, x,
 *             clippers, shortlink
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const targetArg = process.argv[2];
if (!targetArg) {
  console.error('usage: node js/attribution.internal.test.js <path-to-attribution.js>');
  process.exit(2);
}
const targetPath = path.resolve(process.cwd(), targetArg);
const source = fs.readFileSync(targetPath, 'utf8');

/* ---------------------------------------------------------------- harness -- */

function newSession(seedRecord) {
  const storage = {};
  if (seedRecord) storage['lo_attr'] = JSON.stringify(seedRecord);

  function visit(opts) {
    opts = opts || {};
    const handlers = {};
    const location = {
      hostname: opts.hostname || 'liftoffr.com',
      pathname: opts.pathname || '/',
      search: opts.search || ''
    };
    location.protocol = 'https:';
    location.host = location.hostname;
    location.href = 'https://' + location.hostname + location.pathname + location.search;

    const sandbox = {
      localStorage: {
        getItem(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
        setItem(k, v) { storage[k] = String(v); },
        removeItem(k) { delete storage[k]; }
      },
      location: location,
      document: {
        referrer: opts.referrer || '',
        addEventListener(type, fn) { (handlers[type] || (handlers[type] = [])).push(fn); }
      },
      window: {},
      URL: URL,
      URLSearchParams: URLSearchParams,
      JSON: JSON,
      Date: Date,
      console: console
    };
    sandbox.window.location = location;
    sandbox.window.document = sandbox.document;
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: path.basename(targetPath) });

    return {
      sandbox,
      record() {
        try { return JSON.parse(storage['lo_attr'] || 'null'); } catch (e) { return null; }
      }
    };
  }

  return { visit, storage };
}

const DIRECT = { utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' };
const ORGANIC = { utm_source: 'google.com', utm_medium: 'referral', first_seen: '2026-08-01', landing: '/blog/' };

/* ------------------------------------------------------------------ runner -- */

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, why: e && e.message ? e.message : String(e) }); }
}
function eq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error((label || 'value') + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}
function ok(cond, label) { if (!cond) throw new Error(label || 'expected truthy'); }

/* ------------------------------------------- A. internal must NOT upgrade -- */

test('[guard] nav click tagged liftoffr does not overwrite the direct placeholder', () => {
  const s = newSession(DIRECT);
  const r = s.visit({
    pathname: '/plan',
    search: '?utm_source=liftoffr&utm_medium=cta&utm_campaign=plan',
    referrer: 'https://liftoffr.com/'
  }).record();
  eq(r.utm_source, 'direct', 'utm_source');
});

test('[guard] nav click tagged liftoffr does not destroy a Google organic acquisition', () => {
  const s = newSession(ORGANIC);
  const r = s.visit({
    pathname: '/plan',
    search: '?utm_source=liftoffr&utm_medium=cta&utm_campaign=plan',
    referrer: 'https://liftoffr.com/blog/'
  }).record();
  eq(r.utm_source, 'google.com', 'utm_source');
  eq(r.utm_medium, 'referral', 'utm_medium');
});

test('[guard] typed /checklist 307 (internal source, NO referrer) does not upgrade direct', () => {
  // /checklist -> 307 -> /quiz?utm_source=liftoffr&utm_medium=redirect. Typed into the
  // address bar there is no referrer, so the same-host test cannot see this one.
  const s = newSession(DIRECT);
  const r = s.visit({
    pathname: '/quiz',
    search: '?utm_source=liftoffr&utm_medium=redirect&utm_campaign=quiz&utm_content=from_checklist',
    referrer: ''
  }).record();
  eq(r.utm_source, 'direct', 'utm_source');
});

test('[guard] typed /buyzone 307 (internal source, NO referrer) does not destroy organic', () => {
  const s = newSession(ORGANIC);
  const r = s.visit({
    pathname: '/quiz',
    search: '?utm_source=liftoffr&utm_medium=redirect&utm_campaign=quiz&utm_content=from_buyzone',
    referrer: ''
  }).record();
  eq(r.utm_source, 'google.com', 'utm_source');
});

test('[guard] /cycle own CTA tagged cycle does not upgrade', () => {
  const s = newSession(ORGANIC);
  const r = s.visit({
    pathname: '/plan',
    search: '?utm_source=cycle&utm_medium=topbar&utm_campaign=plan',
    referrer: 'https://liftoffr.com/cycle'
  }).record();
  eq(r.utm_source, 'google.com', 'utm_source');
});

test('[guard] internal source matching is case-insensitive', () => {
  const s = newSession(DIRECT);
  const r = s.visit({ pathname: '/plan', search: '?utm_source=LiftOffr&utm_medium=cta', referrer: '' }).record();
  eq(r.utm_source, 'direct', 'utm_source');
});

test('[guard] same-host referrer blocks an unlabelled internal link', () => {
  // Belt to the source list's braces: a future internal link that forgets the liftoffr
  // label still cannot upgrade, because the referrer is our own host.
  const s = newSession(ORGANIC);
  const r = s.visit({
    pathname: '/plan',
    search: '?utm_medium=cta&utm_campaign=plan&utm_source=newlabel',
    referrer: 'https://liftoffr.com/track-record'
  }).record();
  eq(r.utm_source, 'google.com', 'utm_source');
});

test('[guard] www referrer counts as same-host', () => {
  const s = newSession(ORGANIC);
  const r = s.visit({
    pathname: '/plan',
    search: '?utm_source=newlabel&utm_medium=cta',
    referrer: 'https://www.liftoffr.com/track-record'
  }).record();
  eq(r.utm_source, 'google.com', 'utm_source');
});

test('[guard] internal arrival still sets first touch when there is no record yet', () => {
  // Nothing stored means we genuinely have no better information; a typed /checklist
  // really is the first thing we know about this person. This is live behaviour and
  // the guard must not regress it.
  const s = newSession();
  const r = s.visit({
    pathname: '/quiz',
    search: '?utm_source=liftoffr&utm_medium=redirect&utm_content=from_checklist',
    referrer: ''
  }).record();
  eq(r.utm_source, 'liftoffr', 'utm_source');
  eq(r.utm_medium, 'redirect', 'utm_medium');
});

test('[guard] a blocked internal arrival records no upgraded_from', () => {
  const s = newSession(DIRECT);
  const r = s.visit({ pathname: '/plan', search: '?utm_source=liftoffr&utm_medium=cta' }).record();
  ok(!r.upgraded_from, 'upgraded_from should be absent, got ' + JSON.stringify(r.upgraded_from));
});

/* ------------------------------------ B. external-origin MUST stay upgradeable -- */

const EXTERNAL_CASES = [
  ['resend from a webmail referrer', 'resend', 'email', 'https://mail.google.com/'],
  ['resend from a desktop mail client (no referrer)', 'resend', 'email', ''],
  ['email zone alert', 'email', 'zone_alert', ''],
  ['beehiiv newsletter', 'beehiiv', 'email', 'https://beehiiv.com/'],
  ['widget embed on a third-party site', 'widget', 'embed', 'https://someblog.example/post'],
  ['instagram DM', 'instagram', 'dm', 'https://l.instagram.com/'],
  ['instagram bio via /ig', 'instagram', 'bio', ''],
  ['tiktok bio via /tt', 'tiktok', 'bio', ''],
  ['youtube bio via /yt', 'youtube', 'bio', 'https://www.youtube.com/'],
  ['x bio via /x', 'x', 'bio', 'https://t.co/'],
  ['clippers via /clip', 'clippers', 'social', 'https://www.tiktok.com/'],
  ['shortlink /start typed from a DM', 'shortlink', 'cta', '']
];

EXTERNAL_CASES.forEach(([label, src, medium, referrer]) => {
  test('[external] ' + label + ' upgrades the direct placeholder', () => {
    const s = newSession(DIRECT);
    const r = s.visit({
      pathname: '/plan',
      search: '?utm_source=' + src + '&utm_medium=' + medium + '&utm_campaign=c',
      referrer
    }).record();
    eq(r.utm_source, src, 'utm_source');
    eq(r.utm_medium, medium, 'utm_medium');
    eq(r.first_seen, '2026-08-01', 'first_seen preserved');
    eq(r.upgraded_from, 'direct', 'upgraded_from');
  });
});

test('[external] resend upgrades a referrer-derived placeholder too', () => {
  const s = newSession(ORGANIC);
  const r = s.visit({
    pathname: '/plan',
    search: '?utm_source=resend&utm_medium=email&utm_campaign=d3',
    referrer: 'https://mail.google.com/'
  }).record();
  eq(r.utm_source, 'resend', 'utm_source');
  eq(r.upgraded_from, 'google.com', 'upgraded_from');
});

test('[external] an email click does not overwrite a genuine instagram first touch', () => {
  const s = newSession({ utm_source: 'instagram', utm_medium: 'dm', first_seen: '2026-08-01', landing: '/plan' });
  const r = s.visit({
    pathname: '/plan',
    search: '?utm_source=resend&utm_medium=email',
    referrer: 'https://mail.google.com/'
  }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
});

test('[external] an email click landing on an internally-labelled page still upgrades', () => {
  // The email links to /cycle?utm_source=email&utm_medium=zone_alert. Target is internal,
  // origin is an inbox. Classification is by origin.
  const s = newSession(DIRECT);
  const r = s.visit({ pathname: '/cycle', search: '?utm_source=email&utm_medium=zone_alert', referrer: '' }).record();
  eq(r.utm_source, 'email', 'utm_source');
});

/* ------------------------------------------------------------------ report -- */

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('\n=== attribution.internal.test.js  ::  ' + path.basename(targetPath) + ' ===');
results.forEach(r => {
  console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.name + (r.ok ? '' : '\n          -> ' + r.why));
});
console.log('  ' + pass + ' passed, ' + fail + ' failed, ' + results.length + ' total');
process.exit(fail ? 1 : 0);
