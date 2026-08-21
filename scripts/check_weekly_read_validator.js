#!/usr/bin/env node
/* Does the weekly-read validator actually reject the things it exists to reject?
 *
 * The weekly read is written by a model at send time and goes to the whole free
 * list. Until 21 Aug 2026 the only check on it was `text.length > 80`, so the one
 * rule this business rests on -- never tell the reader what to do with a position
 * -- was enforced on a weekly outbound surface by model compliance alone.
 *
 * validateWeeklyRead() is that check. This file is the check on the check, and it
 * tests against realistic drift -- paragraphs that read like a plausible weekly
 * email with one thing wrong -- rather than against strings obviously designed to
 * trip a regex. A validator that only catches the failures you imagined is the
 * proxy problem again (see COPY_SWEEP_NOTES.md).
 *
 * Usage: node scripts/check_weekly_read_validator.js   (exit 0 = pass, 1 = fail)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(path.dirname(__dirname), 'api', 'cron-weekly-score.js');
const src = fs.readFileSync(SRC, 'utf8');
const start = src.indexOf('const BANNED_INSTRUCTION');
const end = src.indexOf('async function sendResend');
if (start === -1 || end === -1 || end < start) {
  console.log('WEEKLY READ VALIDATOR: *** FAIL *** — could not locate validateWeeklyRead in api/cron-weekly-score.js');
  process.exit(1);
}
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(src.slice(start, end), sandbox);
const { validateWeeklyRead } = sandbox;

const score = {
  score: 36.1, zone: 're-accumulation', trend: 'flat', trendDelta7d: 0.1,
  components: {
    RHODL: { value: 30.9 }, Puell: { value: 65.4 }, Trolololo: { value: 25.5 },
    MVRV: { value: 12.7 }, PiCycle: { value: 38.9 }, '2YMA': { value: 55.3 },
    ReserveRisk: { value: 19.2 }, RUPL: { value: 34.5 },
  },
};

const CASES = [
  ['accepts a correct read', true,
   'The Score sits at 36.1, in the re-accumulation band, essentially unchanged over the past week at +0.1. Historically this band has marked the stretch after a drawdown stopped deepening but before the next expansion established itself, and it has resolved upward more often than not at 180 days. Puell at 65.4 is the firmest component; MVRV at 12.7 remains the softest. None of that is a forecast.'],
  ['accepts band boundaries and cycle years', true,
   'At 36.1 the Score is in the re-accumulation band, which runs from 30 to 50, and it moved 0.1 over the past 7 days. Every cycle top since 2013 printed above 85, so this is a long way from that end of the range. Puell at 65.4 is the firmest component and MVRV at 12.7 the softest, and neither is a forecast of anything.'],
  ['rejects "take profits"', false,
   'The Score sits at 36.1 in the re-accumulation band. Historically this band has been constructive. This is not the moment to take profits, and patience has served better here. Puell at 65.4 leads the components this week and nothing else moved much at all.'],
  ['rejects "you should accumulate"', false,
   'The Score sits at 36.1 in the re-accumulation band and barely moved, at +0.1 on the week. Given where the components sit you should accumulate while the reading is low, historically speaking. Puell at 65.4 is the firmest reading in the set right now.'],
  ['rejects "scale out"', false,
   'The Score sits at 36.1 in the re-accumulation band, unchanged at +0.1. Historically the band has been constructive, and there is no case to scale out here on this reading alone. Puell at 65.4 leads the nine and MVRV at 12.7 trails them.'],
  ['rejects "de-risk"', false,
   'The Score sits at 36.1 in the re-accumulation band this week, flat at +0.1. Historically the band has resolved upward more often than not, though there is an argument to de-risk into any strength. Puell at 65.4 is firmest, MVRV at 12.7 softest.'],
  ['rejects a band name that is not the one for this score', false,
   'The Score sits at 36.1, which places it in the accumulation band this week. Historically that band has been among the lower readings in a cycle. Puell at 65.4 is the firmest component and MVRV at 12.7 the softest, with the week essentially flat at +0.1.'],
  ['rejects an invented price', false,
   'The Score sits at 36.1 in the re-accumulation band, flat at +0.1 on the week. Historically this band has resolved upward more often than not at 180 days, with Bitcoin around $74,000 as this was written. Puell at 65.4 leads and MVRV at 12.7 lags.'],
  ['rejects an invented hit rate', false,
   'The Score sits at 36.1 in the re-accumulation band and is flat on the week at +0.1. Historically this band has resolved upward 68% of the time at 180 days, which is worth holding lightly. Puell at 65.4 is firmest and MVRV at 12.7 softest.'],
  ['rejects an empty or stub response', false, 'Score 36.1, re-accumulation. Flat week.'],
];

let pass = 0, fail = 0;
for (const [label, expectOk, text] of CASES) {
  const v = validateWeeklyRead(text, score);
  if (v.ok === expectOk) {
    pass++;
  } else {
    fail++;
    console.log(`  FAIL ${label} — expected ok=${expectOk}, got ok=${v.ok}${v.reason ? ` (${v.reason})` : ''}`);
  }
}

console.log('');
if (fail) {
  console.log(`WEEKLY READ VALIDATOR: *** FAIL *** — ${fail} of ${pass + fail} cases wrong`);
  process.exit(1);
}
console.log(`WEEKLY READ VALIDATOR: PASS — ${pass} cases, every drift case rejected`);
