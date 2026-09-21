import test from 'node:test';
import assert from 'node:assert/strict';
import { FIXED_CASH_PLAN, fixedCashSchedule, runFixedCashDca, previewCash } from '../api/_fixed-cash-dca.js';
// No network is available to tests, including indirectly imported code.
globalThis.fetch = () => { throw new Error('Network forbidden during offline tests'); };
const day = '2026-09-22';
function fake({history=[], hasNext=false, failSubmit=0, previewError=false}={}) {
  const sent=[]; let submissions=0;
  const request=async(method,path,body)=>{
    if(method==='GET') return {orders:history,has_next:hasNext};
    if(path.endsWith('/preview')) {
      const q=Number(body.order_configuration.market_market_ioc.quote_size);
      return {order_total:String(q),commission_total:String(q*.009),errs:previewError?['FAIL']:[],preview_id:'offline-preview'};
    }
    submissions++; if(submissions===failSubmit) throw new Error('timeout after possible acceptance');
    sent.push(body); return {success:true,success_response:{order_id:`offline-${submissions}`}};
  };
  return {request,sent};
}
test('84 dates: $600 maximum per day and $50,400 lifetime ceiling',()=>{
 let total=0, count=0;
 for(let t=Date.parse(FIXED_CASH_PLAN.start);t<=Date.parse(FIXED_CASH_PLAN.end);t+=86400000){
  const s=fixedCashSchedule(new Date(t).toISOString().slice(0,10));total+=s.reduce((a,b)=>a+b.cashBudget,0);count++;
 }
 assert.equal(count,84);assert.equal(total,50400);assert.ok(72033.72-total>=21610.11);
});
test('start, stop, and invalid dates',()=>{
 assert.deepEqual(fixedCashSchedule('2026-09-21'),[]);assert.deepEqual(fixedCashSchedule('2026-12-15'),[]);
 assert.equal(fixedCashSchedule('2026-12-14').length,3);assert.throws(()=>fixedCashSchedule('2026-02-30'));
});
test('default mode makes no requests',async()=>{
 const r=await runFixedCashDca({day,request:()=>{throw Error('must not call')}});assert.equal(r.reason,'preview-only-not-activated');
});
test('budget includes conservative preview commissions and keeps order caps',async()=>{
 const f=fake();const r=await runFixedCashDca({day,request:f.request,live:true});assert.equal(r.ok,true);assert.equal(f.sent.length,3);
 assert.ok(r.results.reduce((a,b)=>a+b.previewCash,0)<=600);
 assert.ok(f.sent.every(x=>Number(x.order_configuration.market_market_ioc.quote_size)<200));
});
test('same-day slots are skipped regardless of status, including partial and canceled',async()=>{
 const f=fake({history:fixedCashSchedule(day).map((s,i)=>({...s,status:['FILLED','CANCELLED','OPEN'][i]}))});
 const r=await runFixedCashDca({day,request:f.request,live:true});assert.equal(r.ok,true);assert.equal(f.sent.length,0);
});
test('legacy same-day DCA blocks overlap',async()=>{
 const f=fake({history:[{client_order_id:`liftoffr-dca-BTC-USDC-${day}`} ]});
 const r=await runFixedCashDca({day,request:f.request,live:true});assert.equal(r.ok,false);assert.equal(f.sent.length,0);
});
test('manual orders do not count as DCA even if fills would be small',async()=>{
 const f=fake({history:[{client_order_id:'manual-75000',status:'FILLED'}]});
 assert.equal((await runFixedCashDca({day,request:f.request,live:true})).ok,true);assert.equal(f.sent.length,3);
});
test('incomplete history fails closed',async()=>{
 const f=fake({hasNext:true});assert.equal((await runFixedCashDca({day,request:f.request,live:true})).ok,false);assert.equal(f.sent.length,0);
});
test('uncertain submission halts later orders, no local retry',async()=>{
 const f=fake({failSubmit:2});const r=await runFixedCashDca({day,request:f.request,live:true});assert.equal(r.ok,false);assert.equal(f.sent.length,1);assert.equal(r.results.length,1);
});
test('preview failure and malformed fee fields block buys',async()=>{
 const f=fake({previewError:true});assert.equal((await runFixedCashDca({day,request:f.request,live:true})).ok,false);assert.equal(f.sent.length,0);
 assert.throws(()=>previewCash({errs:[],preview_id:'x',order_total:'200',commission_total:''},200));
});
test('after deadline live mode cannot call exchange',async()=>{
 const r=await runFixedCashDca({day:'2026-12-15',live:true,request:()=>{throw Error('must not call')}});assert.equal(r.reason,'outside-fixed-window');
});
test('cron imports fixed mode and formats partial submission honestly',async()=>{
 const {buildDcaDiscordPayload}=await import('../api/cron-weekly-score.js');
 const {DCA_MODE}=await import('../api/_buy-plan.js');assert.equal(DCA_MODE,'fixed-cash');
 const p=buildDcaDiscordPayload({mode:'fixed-cash',ok:false,reason:'fixed-cash-paused',error:'timeout',results:[{quoteSize:198.19}],ts:new Date().toISOString()});
 assert.match(p.embeds[0].description,/fill confirmation/);assert.doesNotMatch(p.embeds[0].title,/no BTC bought/);
});
