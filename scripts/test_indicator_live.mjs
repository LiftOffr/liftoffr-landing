import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../js/indicator-live.js',import.meta.url),'utf8');
function node(key){return {textContent:'stale',attrs:{'data-live-key':key},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v},classList:{remove(){},add(){}}};}
async function render(data,fail=false){
 const main=node('Woobull'),other=node('RHODL'),stamp=node(),status=node(),price=node();
 const groups={'[data-live-key]':[main,other],'[data-live-asof]':[stamp],'[data-live-status]':[status],'[data-live-px]':[price]};
 vm.runInNewContext(code,{document:{querySelectorAll:s=>groups[s]||[],querySelector:()=>main},fetch:()=>fail?Promise.reject(Error('offline')):Promise.resolve({ok:true,json:()=>Promise.resolve(data)}),Date,Number});
 await new Promise(r=>setImmediate(r));return {main,other,stamp,status,price};
}
let r=await render({asOf:'2026-09-20T00:00:00Z',components:{RHODL:{value:31.2,asOf:1789862400}}});
assert.equal(r.main.textContent,'Unavailable');assert.equal(r.other.textContent,'31');assert.equal(r.stamp.textContent,'No current component reading');assert.match(r.status.textContent,/excluded/);
r=await render({asOf:'2026-09-20T00:00:00Z',components:{Woobull:{value:25,asOf:1789776000},RHODL:{value:null,asOf:1789862400}}});
assert.equal(r.main.textContent,'25');assert.equal(r.other.textContent,'Unavailable');assert.equal(r.stamp.textContent,'September 19, 2026');
r=await render({},true);assert.equal(r.main.textContent,'Unavailable');assert.match(r.status.textContent,/Could not verify/);
console.log('Indicator live checks passed: missing component, invalid value, component date, network failure');
