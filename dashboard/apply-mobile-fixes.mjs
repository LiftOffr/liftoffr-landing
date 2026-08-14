#!/usr/bin/env node
/*
 * Mobile + progressive-disclosure fixes for dashboard/index.html.
 *
 * Written as exact-match string edits rather than a unified diff because the
 * target file was being edited by a concurrent session while these fixes were
 * developed — a line-numbered patch would be stale on arrival. Each edit is
 * idempotent: re-running is a no-op, and any edit whose anchor has since been
 * rewritten is reported as SKIPPED rather than silently mangling the file.
 *
 *   node apply-mobile-fixes.mjs [path/to/index.html] [--dry-run]
 *
 * Every change was verified in headless Chrome at 390x844 and 1440x900.
 */
import fs from 'node:fs';

const FILE = process.argv.find(a => a.endsWith('.html')) || '/Users/torin/liftoffr-landing/dashboard/index.html';
const DRY = process.argv.includes('--dry-run');

const EDITS = [
  {
    name: '1. grid min-width blowout (CRITICAL — phone rendered the tablet layout, cropped)',
    find: `.app{display:grid;grid-template-columns:236px 1fr;min-height:100vh;min-height:100dvh}`,
    replace: `.app{display:grid;grid-template-columns:236px 1fr;min-height:100vh;min-height:100dvh;overflow-x:clip}
/* Load-bearing. A grid item's \`min-width:auto\` resolves to its CONTENT's minimum
   width, so the ~2300px nav rail and the wide ledger rows inside <main> pushed the
   1fr track past the viewport. On a 390px phone that widened the LAYOUT viewport to
   740px, which (a) cropped the right half of every card and (b) meant the
   \`max-width:520px\` rules never matched — the phone silently rendered the tablet
   layout, zoomed out. Both tracks must be allowed to shrink below their content. */
.app>main{min-width:0}
.side{min-width:0}`,
    guard: '.app>main{min-width:0}',
  },
  {
    name: '2. safe-area insets, >=44px touch targets, rail scroll affordance',
    find: `@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}`,
    replace: `@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}

/* ══════════════════════════════════════════════════════════════════════════
   PHONE HARDENING
   The page declares viewport-fit=cover, which opts INTO drawing under the
   notch and the home indicator. Nothing was reading the insets back, so on a
   notched iPhone the topbar sat under the status bar and the last card sat
   under the home indicator. Pay the insets back on the elements that touch
   each edge.
   ══════════════════════════════════════════════════════════════════════════ */
@supports(padding:max(0px)){
  .topbar{padding-left:max(26px,env(safe-area-inset-left));padding-right:max(26px,env(safe-area-inset-right))}
  .wrap{
    padding-left:max(26px,env(safe-area-inset-left));
    padding-right:max(26px,env(safe-area-inset-right));
    padding-bottom:max(96px,calc(72px + env(safe-area-inset-bottom)));
  }
  .side{padding-left:env(safe-area-inset-left)}
  .modal{margin-bottom:env(safe-area-inset-bottom)}
  @media(max-width:820px){
    .topbar{padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right))}
    .wrap{padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right))}
  }
}

/* Touch targets. Principle 5 of this design system asks for >=44px, which the
   dense desktop controls (32-38px) don't meet. Rather than inflate them on
   desktop where a mouse is precise, grow them only where the input is a finger. */
@media(pointer:coarse){
  .btn{min-height:44px;padding:11px 16px}
  .pv-range-btn,.chart-range-btn,.cbbi-range-btn{min-height:44px;min-width:44px;padding:0 13px}
  .trade-del,.nw-add,.veh-edit{min-height:44px;min-width:44px}
  .jv-ask input,.jv-ask button{min-height:48px}
  .nav-item{min-height:48px}
  .sec-h{min-height:44px}
  /* iOS zooms the page in when a focused field is under 16px. */
  input,select,textarea{font-size:16px}
}

/* The mobile section rail scrolls horizontally with 17 items and no edge cue —
   a fade tells you there's more without spending vertical space on a scrollbar. */
@media(max-width:1080px){
  .side{
    -webkit-mask-image:linear-gradient(to right,transparent 0,#000 14px,#000 calc(100% - 26px),transparent 100%);
    mask-image:linear-gradient(to right,transparent 0,#000 14px,#000 calc(100% - 26px),transparent 100%);
    scroll-snap-type:x proximity;
  }
  .nav-item{scroll-snap-align:center}
}`,
    guard: 'PHONE HARDENING',
  },
  {
    name: '3. action-bar orphan cell + topbar scroll fade (mobile)',
    find: `  #actionBar{grid-template-columns:1fr 1fr!important}`,
    replace: `  #actionBar{grid-template-columns:1fr 1fr!important}
  /* 5 cells into a 2-wide grid leaves the last one orphaned beside a blank —
     let it run the full width instead so the strip ends square. */
  #actionBar>div:last-child:nth-child(odd){grid-column:1/-1}
  /* the topbar scrolls horizontally; fade the trailing edge so the cut-off
     "updated…" reads as more-to-scroll rather than as a broken layout */
  .topbar{
    -webkit-mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent 100%);
    mask-image:linear-gradient(to right,#000 calc(100% - 24px),transparent 100%);
  }`,
    guard: '#actionBar>div:last-child:nth-child(odd)',
  },
  {
    name: '4. ledger-more button style',
    find: `/* ─────────────────────────── UTILITIES ─────────────────────────── */`,
    replace: `.ledger-more{
  width:100%;margin-top:14px;padding:13px;min-height:44px;
  background:transparent;border:1px solid var(--line2);border-radius:var(--r-s);
  color:var(--ink2);font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer;
  transition:background .15s,color .15s;
}
.ledger-more:hover{background:var(--s2);color:var(--ink)}

/* ─────────────────────────── UTILITIES ─────────────────────────── */`,
    guard: '.ledger-more{',
  },
  {
    name: '5. cap the ledger at 12 rows (was 77 rows / ~5,000px)',
    find: `function renderTradeList(){const wrap=document.getElementById('tradeList');if(!wrap)return;
  if(!STATE.trades||!STATE.trades.length){wrap.innerHTML='<div class="empty">No trades yet. Add one or sync Coinbase to populate the ladder &amp; position.</div>';return}
  const sorted=[...STATE.trades].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  wrap.innerHTML=sorted.map(t=>{`,
    replace: `// A weekly DCA makes this list grow ~52 rows/year. Rendered flat it was 77 rows
// and ~5,000px — a third of the whole page — burying Net Worth and Spending
// below it. Show the most recent fills and keep the rest one tap away.
let LEDGER_ALL=false;
const LEDGER_PREVIEW=12;
function renderTradeList(){const wrap=document.getElementById('tradeList');if(!wrap)return;
  if(!STATE.trades||!STATE.trades.length){wrap.innerHTML='<div class="empty">No trades yet. Add one or sync Coinbase to populate the ladder &amp; position.</div>';return}
  const sorted=[...STATE.trades].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const shown=LEDGER_ALL?sorted:sorted.slice(0,LEDGER_PREVIEW);
  const hidden=sorted.length-shown.length;
  wrap.innerHTML=shown.map(t=>{`,
    guard: 'const LEDGER_PREVIEW=12;',
  },
  {
    name: '5b. ledger show-all/show-recent toggle',
    find: `      <div><button class="trade-del" data-id="\${t.id}" title="Delete">✕</button></div></div>\`}).join('');
  wrap.querySelectorAll('.trade-del')`,
    replace: `      <div><button class="trade-del" data-id="\${t.id}" title="Delete">✕</button></div></div>\`}).join('')
    +(hidden>0||LEDGER_ALL?\`<button class="ledger-more" id="ledgerMore">\${hidden>0?\`Show all \${sorted.length} fills\`:'Show recent only'}</button>\`:'');
  const more=wrap.querySelector('#ledgerMore');
  if(more)more.onclick=()=>{LEDGER_ALL=!LEDGER_ALL;renderTradeList()};
  wrap.querySelectorAll('.trade-del')`,
    guard: "id=\"ledgerMore\"",
  },
  {
    name: '6. persist section collapse; phone defaults; keyboard a11y; chart re-measure',
    find: `document.querySelectorAll('.sec-h').forEach(h=>h.onclick=()=>{const n=h.parentElement.nextElementSibling;if(!n)return;const hide=n.style.display==='none';let el=h.parentElement.nextElementSibling;h.querySelector('.chev').style.transform=hide?'':'rotate(-90deg)';while(el&&!el.classList.contains('sec')){el.style.display=hide?'':'none';el=el.nextElementSibling}});`,
    replace: `/* Section collapse. Two things were missing: the state was forgotten on every
   reload, and every one of the 17 sections started open — 14,000px on desktop
   and 23,000px on a phone, so the answer to "how am I doing" was buried under
   twelve screens of charts. Collapse state now persists, and on a phone the
   research sections start closed so the position, plan and wallet are reachable
   with a thumb. Desktop keeps every section open on first visit, as before. */
const SEC_KEY='liftoffr-dash-collapsed-v1';
const SEC_PHONE_CLOSED=['sec-indicators','sec-pvalue','sec-chart','sec-cbbi','sec-projected',
  'sec-checklist','sec-ledger','sec-spending','sec-vehicle','sec-macro'];

function secBody(sec){const out=[];let el=sec.nextElementSibling;
  while(el&&!el.classList.contains('sec')){out.push(el);el=el.nextElementSibling}return out}
function setSec(sec,collapsed){
  const chev=sec.querySelector('.chev');if(chev)chev.style.transform=collapsed?'rotate(-90deg)':'';
  secBody(sec).forEach(el=>{el.style.display=collapsed?'none':''});
  sec.classList.toggle('is-collapsed',collapsed);
}
/* Persist only sections the user has ACTUALLY toggled, as an {id:bool} map —
   not a flat list of what happens to be closed. Storing the closed list would
   bake the phone's default-collapsed set into storage, so opening the dashboard
   once on a phone would leave those sections collapsed on the desktop too. A
   default is not a preference; only an explicit tap is. */
function loadSecOverrides(){
  try{const v=JSON.parse(localStorage.getItem(SEC_KEY));return(v&&typeof v==='object'&&!Array.isArray(v))?v:{}}
  catch(_){return{}}
}
(function initSections(){
  const ov=loadSecOverrides();
  // matchMedia, not innerWidth — innerWidth lies while the layout viewport settles
  const phone=window.matchMedia('(max-width:820px)').matches;
  const save=()=>{try{localStorage.setItem(SEC_KEY,JSON.stringify(ov))}catch(_){}};
  document.querySelectorAll('.sec').forEach(sec=>{
    const dflt=phone&&SEC_PHONE_CLOSED.includes(sec.id);
    const collapsed=(sec.id in ov)?ov[sec.id]:dflt;
    setSec(sec,collapsed);
    const h=sec.querySelector('.sec-h');if(!h)return;
    h.setAttribute('role','button');h.setAttribute('tabindex','0');
    h.setAttribute('aria-expanded',String(!collapsed));
    const toggle=()=>{
      const now=!sec.classList.contains('is-collapsed');
      setSec(sec,now);h.setAttribute('aria-expanded',String(!now));
      ov[sec.id]=now;save();
      // a chart laid out while display:none comes back 0px wide — re-measure on open
      if(!now&&window.Chart)Object.values(Chart.instances||{}).forEach(c=>{try{c.resize()}catch(_){}});
    };
    h.onclick=toggle;
    h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
  });
})();`,
    guard: 'SEC_PHONE_CLOSED',
  },
];

let src = fs.readFileSync(FILE, 'utf8');
const before = src;
let applied = 0, already = 0, skipped = [];

for (const e of EDITS) {
  if (e.guard && src.includes(e.guard)) { console.log(`  ALREADY  ${e.name}`); already++; continue; }
  const n = src.split(e.find).length - 1;
  if (n === 0) { console.log(`  SKIPPED  ${e.name}\n           (anchor not found — the region was rewritten; re-apply by hand)`); skipped.push(e.name); continue; }
  if (n > 1) { console.log(`  SKIPPED  ${e.name}\n           (anchor matched ${n}x — ambiguous, refusing to guess)`); skipped.push(e.name); continue; }
  src = src.replace(e.find, e.replace);
  console.log(`  APPLIED  ${e.name}`);
  applied++;
}

console.log(`\n${applied} applied, ${already} already present, ${skipped.length} skipped`);
if (DRY) { console.log('(dry run — nothing written)'); process.exit(skipped.length ? 1 : 0); }
if (src !== before) {
  fs.copyFileSync(FILE, FILE + '.bak-before-mobile-fixes');
  fs.writeFileSync(FILE, src);
  console.log(`wrote ${FILE}\nbackup ${FILE}.bak-before-mobile-fixes`);
} else console.log('no changes written');
process.exit(skipped.length ? 1 : 0);
