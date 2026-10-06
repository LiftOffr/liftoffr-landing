const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const script=fs.readFileSync('js/home-score.js','utf8');
async function run(data,ok=true){const nodes={'home-score':{},'home-score-status':{},'home-score-needle':{hidden:true,style:{setProperty(k,v){this[k]=v}},removeAttribute(){this.hidden=false},setAttribute(){this.hidden=true}}};await vm.runInNewContext(script,{window:{addEventListener(){}},document:{getElementById:id=>nodes[id]},fetch:async()=>({ok,json:async()=>data}),AbortSignal,Date,Number,Error});await new Promise(resolve=>setImmediate(resolve));return nodes;}
(async()=>{
 let n=await run({score:51.6,zone:'mid-cycle',asOf:new Date().toISOString()});assert.equal(n['home-score'].textContent,'51.6 / 100');assert.equal(n['home-score-needle'].hidden,false);assert.equal(n['home-score-needle'].style['--score-angle'],'92.88deg');
 n=await run({score:51.6,zone:'mid-cycle',asOf:'2020-01-01'});assert.match(n['home-score-status'].textContent,/Older reading/);
 for(const data of [{score:200,asOf:'2026-09-28'},{score:50,asOf:null},{score:50,asOf:'invalid'}]){n=await run(data);assert.match(n['home-score-status'].textContent,/unavailable/);assert.equal(n['home-score-needle'].hidden,true);}
 n=await run({},false);assert.match(n['home-score-status'].textContent,/unavailable/);assert.equal(n['home-score-needle'].hidden,true);
 console.log('HOME SCORE: PASS — live, stale, invalid score/date, null date and failed response');
})().catch(e=>{console.error(e);process.exit(1)});
