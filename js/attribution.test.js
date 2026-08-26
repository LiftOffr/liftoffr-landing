/* Test harness for the first-touch attribution script.
 *
 *   node js/attribution.test.js js/attribution.js       # baseline (live file)
 *   node js/attribution.test.js js/attribution.v4.js    # candidate
 *
 * The target file is loaded fresh into a new `vm` context for every simulated page
 * load, with shimmed localStorage / location / document. localStorage persists across
 * loads within one scenario, exactly as a browser's would; everything else is rebuilt,
 * so module-scope state cannot leak between page loads and hide a bug.
 *
 * This suite covers general behaviour: capture, first-touch precedence, the placeholder
 * upgrade, and outbound Whop link decoration. The internal-source guard has its own
 * suite in attribution.internal.test.js.
 *
 * Every test that is not marked [upgrade] describes behaviour the LIVE file already
 * has. Those are the regression bar: the candidate must pass all of them. The [upgrade]
 * tests are expected to fail on the live file — that failure is the bug.
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const targetArg = process.argv[2];
if (!targetArg) {
  console.error('usage: node js/attribution.test.js <path-to-attribution.js>');
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
      },
      raw() { return storage['lo_attr']; },
      // Simulate a click on an anchor. `closest` mirrors the real selector
      // a[href*="whop.com"] — substring match on the href, which is why a lookalike
      // host still reaches decorate() and must be rejected there.
      click(href, type) {
        const anchor = {
          _href: href,
          getAttribute(n) { return n === 'href' ? this._href : null; },
          setAttribute(n, v) { if (n === 'href') this._href = v; }
        };
        const ev = {
          target: {
            closest(sel) {
              return sel.indexOf('whop.com') !== -1 && href.indexOf('whop.com') !== -1 ? anchor : null;
            }
          }
        };
        (handlers[type || 'click'] || []).forEach(fn => fn(ev));
        return anchor._href;
      },
      handlerTypes() { return Object.keys(handlers).sort(); }
    };
  }

  return { visit, storage };
}

function q(href, key) {
  try { return new URL(href, 'https://liftoffr.com/').searchParams.get(key); } catch (e) { return null; }
}

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

const WHOP = 'https://whop.com/checkout/plan_MntgjXJaQnGsW';

/* ------------------------------------------------------------------- tests -- */

test('tagged arrival stores the source', () => {
  const s = newSession();
  const p = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm&utm_campaign=plan_launch' });
  const r = p.record();
  eq(r.utm_source, 'instagram', 'utm_source');
  eq(r.utm_medium, 'dm', 'utm_medium');
  eq(r.utm_campaign, 'plan_launch', 'utm_campaign');
});

test('untagged arrival with no referrer stores the direct placeholder', () => {
  const s = newSession();
  const r = s.visit({ pathname: '/' }).record();
  eq(r.utm_source, 'direct', 'utm_source');
  eq(r.utm_medium, 'none', 'utm_medium');
});

test('untagged arrival from an external referrer stores host/referral', () => {
  const s = newSession();
  const r = s.visit({ pathname: '/', referrer: 'https://www.google.com/search?q=bitcoin+cycle' }).record();
  eq(r.utm_source, 'google.com', 'utm_source');
  eq(r.utm_medium, 'referral', 'utm_medium');
});

test('untagged internal navigation with no record stores nothing', () => {
  const s = newSession();
  const p = s.visit({ pathname: '/plan', referrer: 'https://liftoffr.com/' });
  eq(p.record(), null, 'record');
});

test('first_seen is recorded as an ISO date', () => {
  const s = newSession();
  const r = s.visit({ search: '?utm_source=instagram' }).record();
  ok(/^\d{4}-\d{2}-\d{2}$/.test(r.first_seen), 'first_seen shape, got ' + r.first_seen);
});

test('landing page is recorded', () => {
  const s = newSession();
  const r = s.visit({ pathname: '/track-record', search: '?utm_source=instagram' }).record();
  eq(r.landing, '/track-record', 'landing');
});

test('field values are truncated to 100 characters', () => {
  const s = newSession();
  const long = 'c'.repeat(150);
  const r = s.visit({ search: '?utm_source=instagram&utm_campaign=' + long }).record();
  eq(r.utm_campaign.length, 100, 'utm_campaign length');
});

test('first touch wins: a later untagged direct visit does not overwrite', () => {
  const s = newSession();
  s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' });
  const r = s.visit({ pathname: '/' }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
  eq(r.utm_medium, 'dm', 'utm_medium');
});

test('first touch wins: a genuine tagged touch is not replaced by a later tagged one', () => {
  const s = newSession();
  s.visit({ search: '?utm_source=instagram&utm_medium=dm' });
  const r = s.visit({ search: '?utm_source=tiktok&utm_medium=bio' }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
  eq(r.utm_medium, 'dm', 'utm_medium');
});

test('first touch wins: an external referral does not replace a genuine tagged touch', () => {
  const s = newSession();
  s.visit({ search: '?utm_source=instagram&utm_medium=dm' });
  const r = s.visit({ pathname: '/', referrer: 'https://news.ycombinator.com/' }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
});

test('decorate stamps source, medium and campaign onto the Whop link', () => {
  const s = newSession();
  const p = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm&utm_campaign=plan_launch' });
  const href = p.click(WHOP);
  eq(q(href, 'utm_source'), 'instagram', 'utm_source');
  eq(q(href, 'utm_medium'), 'dm', 'utm_medium');
  eq(q(href, 'utm_campaign'), 'plan_launch', 'utm_campaign');
});

test('decorate appends utm_term=ft_<first_seen>', () => {
  const s = newSession({ utm_source: 'instagram', utm_medium: 'dm', first_seen: '2026-08-01' });
  const href = s.visit({ pathname: '/plan' }).click(WHOP);
  eq(q(href, 'utm_term'), 'ft_2026-08-01', 'utm_term');
});

test('decorate preserves a utm_content already baked into the markup', () => {
  const s = newSession({ utm_source: 'instagram', utm_content: 'ig_bio', first_seen: '2026-08-01' });
  const href = s.visit({ pathname: '/plan' }).click(WHOP + '?utm_content=hero');
  eq(q(href, 'utm_content'), 'hero', 'utm_content');
});

test('decorate supplies utm_content from the record when the link has none', () => {
  const s = newSession({ utm_source: 'instagram', utm_content: 'ig_bio', first_seen: '2026-08-01' });
  const href = s.visit({ pathname: '/plan' }).click(WHOP);
  eq(q(href, 'utm_content'), 'ig_bio', 'utm_content');
});

test('decorate overrides a utm_source hardcoded on the outbound link', () => {
  const s = newSession({ utm_source: 'instagram', utm_medium: 'dm', first_seen: '2026-08-01' });
  const href = s.visit({ pathname: '/plan' }).click(WHOP + '?utm_source=liftoffr');
  eq(q(href, 'utm_source'), 'instagram', 'utm_source');
});

test('decorate leaves non-Whop links alone', () => {
  const s = newSession({ utm_source: 'instagram', first_seen: '2026-08-01' });
  const href = s.visit({ pathname: '/' }).click('https://liftoffr.com/plan');
  eq(href, 'https://liftoffr.com/plan', 'href');
});

test('decorate rejects a lookalike host that merely contains whop.com', () => {
  const s = newSession({ utm_source: 'instagram', first_seen: '2026-08-01' });
  const bad = 'https://whop.com.evil.test/checkout/plan_X';
  eq(s.visit({ pathname: '/' }).click(bad), bad, 'href');
});

test('decorate also runs on auxclick (middle-click)', () => {
  const s = newSession({ utm_source: 'instagram', utm_medium: 'dm', first_seen: '2026-08-01' });
  const href = s.visit({ pathname: '/plan' }).click(WHOP, 'auxclick');
  eq(q(href, 'utm_source'), 'instagram', 'utm_source');
});

test('both click and auxclick listeners are registered', () => {
  const s = newSession();
  eq(s.visit({}).handlerTypes().join(','), 'auxclick,click', 'handler types');
});

test('decorate does nothing when there is no record at all', () => {
  const s = newSession();
  const href = s.visit({ pathname: '/plan', referrer: 'https://liftoffr.com/' }).click(WHOP);
  eq(href, WHOP, 'href');
});

test('window.loAttribution exposes the stored record', () => {
  const s = newSession();
  const p = s.visit({ search: '?utm_source=instagram' });
  eq(typeof p.sandbox.window.loAttribution, 'function', 'loAttribution type');
  eq(p.sandbox.window.loAttribution().utm_source, 'instagram', 'utm_source');
});

test('corrupt localStorage does not throw and is treated as no record', () => {
  const s = newSession();
  s.storage['lo_attr'] = '{not json';
  const r = s.visit({ pathname: '/', search: '?utm_source=instagram' }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
});

test('[upgrade] a tagged arrival replaces the direct placeholder', () => {
  const s = newSession();
  s.visit({ pathname: '/' });                                   // untagged first visit
  const r = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm&utm_campaign=plan_launch' }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
  eq(r.utm_medium, 'dm', 'utm_medium');
  eq(r.utm_campaign, 'plan_launch', 'utm_campaign');
});

test('[upgrade] a tagged arrival replaces a referrer-derived placeholder', () => {
  const s = newSession();
  s.visit({ pathname: '/', referrer: 'https://t.co/abc' });      // stored as t.co / referral
  const r = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
  eq(r.utm_medium, 'dm', 'utm_medium');
});

test('[upgrade] first_seen survives the upgrade', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  const r = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' }).record();
  eq(r.first_seen, '2026-08-01', 'first_seen');
});

test('[upgrade] utm_term on the Whop link still carries the original first_seen', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  const href = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' }).click(WHOP);
  eq(q(href, 'utm_term'), 'ft_2026-08-01', 'utm_term');
  eq(q(href, 'utm_source'), 'instagram', 'utm_source');
});

test('[upgrade] upgraded_from is recorded locally', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  const r = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' }).record();
  eq(r.upgraded_from, 'direct', 'upgraded_from');
});

test('[upgrade] upgraded_from never reaches the outbound URL', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  const p = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' });
  const href = p.click(WHOP);
  ok(href.indexOf('upgraded_from') === -1, 'href leaked upgraded_from: ' + href);
  ok(href.indexOf('landing') === -1, 'href leaked landing: ' + href);
  ok(href.indexOf('first_seen') === -1, 'href leaked first_seen: ' + href);
});

test('[upgrade] the landing page is updated to the genuine touch', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  const r = s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' }).record();
  eq(r.landing, '/plan', 'landing');
});

test('[upgrade] a second tagged arrival does not re-upgrade an upgraded record', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  s.visit({ pathname: '/plan', search: '?utm_source=instagram&utm_medium=dm' });
  const r = s.visit({ pathname: '/plan', search: '?utm_source=tiktok&utm_medium=bio' }).record();
  eq(r.utm_source, 'instagram', 'utm_source');
});

test('[upgrade] an untagged visit after the placeholder leaves it untouched', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  const r = s.visit({ pathname: '/track-record' }).record();
  eq(r.utm_source, 'direct', 'utm_source');
  ok(!r.upgraded_from, 'no upgrade should have been recorded');
});

test('[upgrade] tags without a utm_source do not overwrite the placeholder', () => {
  const s = newSession({ utm_source: 'direct', utm_medium: 'none', first_seen: '2026-08-01', landing: '/' });
  const r = s.visit({ pathname: '/plan', search: '?utm_campaign=orphan&utm_content=hero' }).record();
  eq(r.utm_source, 'direct', 'utm_source');
});

test('[upgrade] end-to-end: direct visit then Instagram DM click reaches Whop as instagram', () => {
  const s = newSession();
  s.visit({ pathname: '/' });                                                  // day 1, untagged
  const p = s.visit({                                                          // day 2, from the DM
    pathname: '/plan',
    search: '?utm_source=instagram&utm_medium=dm&utm_campaign=plan_launch',
    referrer: 'https://l.instagram.com/'
  });
  const href = p.click(WHOP);
  eq(q(href, 'utm_source'), 'instagram', 'utm_source');
  eq(q(href, 'utm_medium'), 'dm', 'utm_medium');
  ok(href.indexOf('plan_MntgjXJaQnGsW') !== -1, 'plan id preserved');
});

/* ------------------------------------------------------------------ report -- */

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('\n=== attribution.test.js  ::  ' + path.basename(targetPath) + ' ===');
results.forEach(r => {
  console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.name + (r.ok ? '' : '\n          -> ' + r.why));
});
console.log('  ' + pass + ' passed, ' + fail + ' failed, ' + results.length + ' total');
process.exit(fail ? 1 : 0);
