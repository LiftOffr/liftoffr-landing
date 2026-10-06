(function(){
async function refresh(){
const number=document.getElementById('home-score'), status=document.getElementById('home-score-status'), needle=document.getElementById('home-score-needle');
try{const r=await fetch('/api/cycle-score',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('unavailable');const d=await r.json();const date=new Date(d.asOf);if(typeof d.asOf!=='string'||!d.asOf||typeof d.score!=='number'||!Number.isFinite(d.score)||d.score<0||d.score>100||!Number.isFinite(date.getTime()))throw Error('invalid');
if(needle){needle.removeAttribute('hidden');needle.style.setProperty('--score-angle',(d.score*1.8).toFixed(2)+'deg');}
number.textContent=d.score.toFixed(1)+' / 100';const age=Date.now()-date.getTime();status.textContent=(d.zone||'Unclassified')+' · Source date '+date.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})+(age>172800000?' · Older reading; check source freshness.':'');
}catch(e){if(needle)needle.setAttribute('hidden','');number.textContent='—';status.textContent='Reading unavailable. Open the dashboard to check the source.';}
}
refresh();
// A quick visit to the product preview can cancel the request. Refresh on Back.
window.addEventListener('pageshow',function(event){if(event.persisted)refresh();});
})();