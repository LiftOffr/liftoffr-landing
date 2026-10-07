// Guard against the duplicated personal-live-trades pitch returning to public offers.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(['.git','node_modules','dashboard'].includes(e.name))return [];const p=path.join(dir,e.name);return e.isDirectory()?walk(p):p.endsWith('.html')?[p]:[];});}
const files=[...walk(root),...['cron-welcome-followups.js','cron-weekly-score.js'].map(f=>path.join(root,'api',f))];
const forbidden=[/nine-tier ladder I['’]m (?:actually )?executing/i,/my exact trigger levels and my fired buys/i,/exact plan I['’]m executing/i,/nine levels I have written down for my own position/i,/ahead of 99% of crypto investors/i];
const errors=[];for(const f of files){const s=fs.readFileSync(f,'utf8').replace(/<!--[\s\S]*?-->/g,'');for(const pattern of forbidden)if(pattern.test(s))errors.push(path.relative(root,f)+': '+pattern);}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('SALES OFFER: PASS - '+files.length+' public pages and email sources checked');
