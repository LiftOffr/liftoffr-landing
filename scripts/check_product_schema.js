#!/usr/bin/env node
/* Every page emitting Product/Offer must carry an identical, valid MerchantReturnPolicy,
   and must never emit review or aggregateRating.

   WHY THIS EXISTS: the two Product pages were edited independently three times this month
   and drifted each time. Parity is asserted, not assumed.

   applicableCountry is DELIBERATELY ABSENT. Torin's policy is worldwide. Google caps
   applicableCountry at 50 ISO-3166-1 codes and has no "worldwide" value, so any list we
   emitted would assert a territorial restriction that does not exist. merchantReturnLink
   is the spec's own alternative for satisfying the required-property rule. If anyone adds
   applicableCountry later, this check fails on purpose — go read the comment first. */
const fs = require('fs'), path = require('path');

const REQUIRED = {
  merchantReturnLink: 'https://liftoffr.com/terms#refund-policy',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 30,
  returnFees: 'https://schema.org/FreeReturn',
  returnMethod: 'https://schema.org/KeepProduct',
  refundType: 'https://schema.org/FullRefund',
};
const BANNED = ['aggregateRating', 'review'];

function blobs(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m; while ((m = re.exec(html))) out.push(m[1]);
  return out;
}
function walk(node, fn) {
  if (Array.isArray(node)) return node.forEach(n => walk(n, fn));
  if (node && typeof node === 'object') { fn(node); Object.values(node).forEach(v => walk(v, fn)); }
}

const files = [];
(function scan(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) scan(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
})('.');

const fails = [], seen = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (!/"@type":\s*"(Product|Offer)"/.test(html)) continue;
  let policies = [], banned = [];
  for (const b of blobs(html)) {
    let parsed;
    try { parsed = JSON.parse(b); }
    catch (e) { fails.push(`${f}: ld+json does not parse — ${e.message}`); continue; }
    walk(parsed, o => {
      if (o['@type'] === 'MerchantReturnPolicy') policies.push(o);
      for (const k of BANNED) if (k in o) banned.push(k);
    });
  }
  if (banned.length) fails.push(`${f}: emits ${[...new Set(banned)].join(', ')} — never fabricate these`);
  if (!policies.length) { fails.push(`${f}: Product/Offer with no MerchantReturnPolicy`); continue; }
  for (const p of policies) {
    for (const [k, v] of Object.entries(REQUIRED))
      if (p[k] !== v) fails.push(`${f}: MerchantReturnPolicy.${k} is ${JSON.stringify(p[k])}, expected ${JSON.stringify(v)}`);
    if ('applicableCountry' in p)
      fails.push(`${f}: applicableCountry present — policy is worldwide, a country list understates it. Read the header comment.`);
    seen.push(f);
  }
}

if (fails.length) { console.error('PRODUCT SCHEMA: FAIL'); fails.forEach(x => console.error('  ' + x)); process.exit(1); }
console.log(`PRODUCT SCHEMA: PASS — ${seen.length} Product/Offer page(s), policies identical, no fabricated ratings`);
