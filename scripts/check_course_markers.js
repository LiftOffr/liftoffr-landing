#!/usr/bin/env node
/* No production note may sit in a file that gets posted to customers.
 *
 * WHY THIS EXISTS
 * On 20 Aug 2026 the $29 PDF shipped with internal notes rendered as body text on
 * page 7 — "Drop it in here verbatim", "moves it toward the 25-35 page spec it
 * currently misses by a wide margin" — because the source carried authoring notes
 * and the renderer was trusted to strip them. It did not.
 *
 * `course/*.md` is now the source that gets posted to Discord, so the same hazard
 * applies one surface over: HANDOVER.md tells whoever posts that every lesson body
 * is a straight copy-paste, and a marker in a body is one paste away from being a
 * customer-facing production note.
 *
 * The rule is not "strip markers before posting" — relying on a strip step is what
 * failed the first time. The rule is that lesson files contain no markers at all.
 * Notes to Torin live in HANDOVER.md, where nothing copies from.
 *
 * Usage: node scripts/check_course_markers.js   (exit 0 = pass, 1 = fail)
 */
const fs = require('fs');
const path = require('path');

const COURSE = path.join(path.dirname(__dirname), 'course');

// Things that are addressed to the author rather than to the reader.
const MARKERS = [
  /\[TORIN\b/i,
  /\bTORIN:/,
  /\[TODO\b/i,
  /\bTODO:/,
  /\[PLACEHOLDER\b/i,
  /\[DRAFT NOTE\b/i,
  /\bFIXME\b/,
  /\[insert\b/i,
  /\[.{0,40}\bgoes here\]/i,
  /\bDrop it in here\b/i,
  /\[Worksheet table\]/i,
  /\[Disclaimer repeats/i,
];

// These two describe the rule rather than being an instance of it.
const EXEMPT = new Set(['README.md', 'OLD_VS_NEW_DIFF.md']);

let failures = 0;
let checked = 0;

for (const name of fs.readdirSync(COURSE).sort()) {
  if (!name.endsWith('.md')) continue;
  if (EXEMPT.has(name)) continue;
  checked++;
  const lines = fs.readFileSync(path.join(COURSE, name), 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const re of MARKERS) {
      if (re.test(line)) {
        failures++;
        console.log(`  FAIL course/${name}:${i + 1}: production note in a file that gets posted`);
        console.log(`       ${line.trim().slice(0, 100)}`);
        break;
      }
    }
  });
}

console.log('');
if (failures) {
  console.log(`COURSE MARKERS: *** FAIL *** — ${failures} marker(s) in ${checked} lesson files`);
  console.log('Move the note to HANDOVER.md. Do not comment it out — a markdown comment');
  console.log('pasted into Discord renders as literal text, so commenting is not protection.');
  process.exit(1);
}
console.log(`COURSE MARKERS: PASS — ${checked} lesson files, no production notes`);
