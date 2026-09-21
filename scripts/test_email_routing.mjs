import test from 'node:test';import assert from 'node:assert/strict';
import {listAudienceContacts,quizEligible,quizBuckets,emailKey} from '../api/_email-routing.js';
const env={LIFTOFFR_MAILING_ADDRESS:'Business mailing address',QUIZ_SEQUENCE_START_AT:'2026-09-21T00:00:00Z'};
const c={id:'c1',email:'Reader@Example.test',created_at:'2026-09-21T01:00:00Z',unsubscribed:false};
test('fresh opt-in eligible; missing address/cutover and legacy contact fail closed',()=>{assert.equal(quizEligible(c,env),true);for(const e of [{...env,LIFTOFFR_MAILING_ADDRESS:''},{...env,QUIZ_SEQUENCE_START_AT:''}])assert.equal(quizEligible(c,e),false);assert.equal(quizEligible({...c,created_at:'2026-09-20T00:00:00Z'},env),false);});
test('unsubscribe and buyer exclusion',()=>{assert.equal(quizEligible({...c,unsubscribed:true},env),false);assert.equal(quizEligible(c,env,new Set(['reader@example.test'])),false);assert.equal(emailKey(c),'reader@example.test');});
test('per-segment audience preferred to pooled',()=>{assert.deepEqual(quizBuckets({RESEND_QUIZ_AUDIENCE_ID:'pooled',RESEND_QUIZ_AUDIENCE_NEW:'new'}),[{seg:'NEW',aud:'new'}]);});
test('reads every page before returning, including unsubscribe records for suppression',async()=>{let calls=[];const rows=await listAudienceContacts('a','fixture',async url=>{calls.push(url);return{ok:true,json:async()=>calls.length===1?{data:[c],has_more:true}:{data:[{...c,id:'c2',unsubscribed:true}],has_more:false}}});assert.equal(rows.length,2);assert.ok(calls[1].endsWith('?after=c1'));});
test('HTTP errors and repeated cursors abort the entire read',async()=>{await assert.rejects(listAudienceContacts('a','fixture',async()=>({ok:false,status:500})));await assert.rejects(listAudienceContacts('a','fixture',async()=>({ok:true,json:async()=>({data:[c],has_more:true})})),/pagination/);});

import {enrollAudience} from '../api/_email-routing.js';
import handler from '../api/cron-welcome-followups.js';
import vm from 'node:vm';
import fs from 'node:fs';
test('enrollment accepts a duplicate only after confirming active membership',async()=>{
  let n=0;await enrollAudience('a','reader@example.test','fixture',async()=>++n===1?{ok:false,status:422}:{ok:true,json:async()=>({unsubscribed:false})});assert.equal(n,2);
  await assert.rejects(enrollAudience('a','reader@example.test','fixture',async()=>({ok:false,status:503})),/503/);
  n=0;await assert.rejects(enrollAudience('a','reader@example.test','fixture',async()=>++n===1?{ok:false,status:422}:{ok:true,json:async()=>({unsubscribed:true})}),/422/);
});
test('authenticated dry run performs audience GETs only and suppresses quiz opt-outs and buyers',async()=>{
  const oldEnv=process.env,oldFetch=global.fetch;
  process.env={...oldEnv,...env,CRON_SECRET:'fixture',RESEND_API_KEY:'fixture',RESEND_AUDIENCE_ID:'free',RESEND_PLAN_AUDIENCE_ID:'buyers',RESEND_QUIZ_AUDIENCE_ID:'quiz'};
  for(const seg of ['ROUNDTRIPPED','ACCUMULATING','SITTING','NEW'])delete process.env['RESEND_QUIZ_AUDIENCE_'+seg];
  const buyer={...c,email:'buyer@example.test'},free={...c,email:'free@example.test'};
  const calls=[];
  global.fetch=async(url,opts)=>{calls.push({url,method:opts?.method||'GET'});const name=new URL(url).pathname.split('/')[2];assert.ok(['free','buyers','quiz'].includes(name));return{ok:true,status:200,json:async()=>({data:name==='free'?[c,buyer,free]:name==='buyers'?[buyer]:[{...c,unsubscribed:true}],has_more:false})};};
  const response={status(n){this.code=n;return this;},json(body){this.body=body;return this;},setHeader(){}};
  try {
    await handler({url:'/api/cron-welcome-followups?dry_run=1',headers:{authorization:'Bearer fixture'}},response);
    assert.equal(response.code,200);assert.equal(response.body.sends,0);assert.equal(response.body.generic_eligible,1);assert.equal(response.body.duplicate_generic_suppressed,2);assert.equal(response.body.quiz_eligible,0);assert.equal(calls.length,3);assert.ok(calls.every(c=>c.method==='GET'));
  }finally{global.fetch=oldFetch;process.env=oldEnv;}
});
test('QA marking persists only in the tab session, clears explicitly, never grants consent',()=>{
  const source=fs.readFileSync(new URL('../js/qa.js',import.meta.url),'utf8'),store=new Map();
  const sessionStorage={setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k),removeItem:k=>store.delete(k)};
  function run(search,storage=sessionStorage){const ctx={window:{},location:{search},URLSearchParams,sessionStorage:storage};vm.runInNewContext(source,ctx);return ctx.window.dataLayer||[];}
  assert.equal(run('').length,0);assert.equal(run('?qa=1')[0][1].qa_mode,'operator_test');assert.equal(run('')[0][0],'set');assert.equal(run('?qa=0').length,0);assert.equal(run('').length,0);
  assert.equal(run('?qa=1',{setItem(){throw Error('denied')}})[0][1].qa_mode,'operator_test');
});

import subscribe from '../api/subscribe.js';
test('quiz signup returns success after confirmed enrollment and exactly one mocked result send',async()=>{
  const oldEnv=process.env,oldFetch=global.fetch;
  process.env={...oldEnv,CRON_SECRET:'fixture',RESEND_API_KEY:'fixture',RESEND_AUDIENCE_ID:'free',RESEND_QUIZ_AUDIENCE_ID:'quiz'};
  for(const seg of ['ROUNDTRIPPED','ACCUMULATING','SITTING','NEW'])delete process.env['RESEND_QUIZ_AUDIENCE_'+seg];
  const calls=[];
  global.fetch=async(url,opts)=>{calls.push({url,method:opts?.method||'GET'});return{ok:true,status:200,json:async()=>url.includes('/contacts')?{id:'fixture-contact'}:url.endsWith('/emails')?{id:'fixture-email'}:{score:50,zone:'NEUTRAL'}};};
  const response={status(n){this.code=n;return this;},json(body){this.body=body;return this;},setHeader(){}};
  try {
    await subscribe({method:'POST',url:'/api/subscribe',headers:{host:'localhost'},body:{email:'reader@example.test',magnet:'quiz',segment:'NEW'}},response);
    assert.equal(response.code,200);assert.equal(response.body.ok,true);assert.equal(response.body.contact_id,'fixture-contact');assert.equal(response.body.email_id,'fixture-email');assert.equal(calls.filter(c=>c.url.endsWith('/emails')).length,1);assert.equal(calls.filter(c=>c.url.endsWith('/contacts')).length,2);
  }finally{global.fetch=oldFetch;process.env=oldEnv;}
});
