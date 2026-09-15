import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import subscribe from '../api/subscribe.js';
import webhook from '../api/whop-webhook.js';
import { emailAudienceIds, validUnsubscribeToken, unsubscribeFromAudiences, unsubscribeHeaders, ensureAudienceContact } from '../api/_email-preferences.js';
import { roleRevocationDecision, fetchMembershipSnapshot } from '../api/_whop-access.js';
const env={CRON_SECRET:'test-only-secret',RESEND_API_KEY:'test-only-key',RESEND_AUDIENCE_ID:'free',RESEND_PLAN_AUDIENCE_ID:'plan',RESEND_TRIAL_AUDIENCE_ID:'trial',RESEND_QUIZ_AUDIENCE_ID:'quiz',RESEND_QUIZ_AUDIENCE_NEW:'new',RESEND_QUIZ_AUDIENCE_SITTING:'quiz'};
const email='subscriber@example.test';
const token=crypto.createHmac('sha256',env.CRON_SECRET).update(email).digest('hex').slice(0,16);
function response(status=200,data={}) {return {status,ok:status>=200&&status<300,json:async()=>data};}
function sink(){return {code:0,body:null,headers:{},status(n){this.code=n;return this;},json(x){this.body=x;return this;},send(x){this.body=x;return this;},setHeader(k,v){this.headers[k]=v;}};}
async function fixture(values,fetcher,run){
 const previousEnv=process.env,previousFetch=globalThis.fetch;
 process.env={...values};globalThis.fetch=fetcher;
 try{await run();}finally{process.env=previousEnv;globalThis.fetch=previousFetch;}
}
test('old signed links work; tampered, absent and malformed tokens fail',()=>{
 assert.equal(validUnsubscribeToken(email,token,env.CRON_SECRET),true);
 for(const t of [null,'','g'.repeat(16),token.slice(1),'0'.repeat(16)])assert.equal(validUnsubscribeToken(email,t,env.CRON_SECRET),false);
 assert.equal(validUnsubscribeToken('other@example.test',token,env.CRON_SECRET),false);
 assert.equal(validUnsubscribeToken(email,token,''),false);
});
test('unsubscribe covers each configured audience and attempts all after a failure',async()=>{
 assert.deepEqual(emailAudienceIds(env),['free','trial','plan','quiz','new']);
 const calls=[];
 await assert.rejects(unsubscribeFromAudiences(email,env,async(url,opts)=>{
  calls.push(url);assert.equal(opts.method,'PATCH');assert.deepEqual(JSON.parse(opts.body),{unsubscribed:true});
  return response(url.includes('/plan/')?503:204);
 }));
 assert.equal(calls.length,5);
 await unsubscribeFromAudiences(email,env,async()=>response(404));
 await assert.rejects(unsubscribeFromAudiences(email,{},async()=>{throw new Error('must not run');}));
});
test('unsigned unsubscribe never calls Resend and missing secret fails closed',async()=>{
 await fixture(env,async()=>{throw new Error('unexpected network');},async()=>{
  for(const method of ['GET','POST']){const res=sink();await subscribe({method,url:'/api/subscribe?u=1&e='+email},res);assert.equal(res.code,400);}
 });
 await fixture({...env,CRON_SECRET:''},async()=>{throw new Error('unexpected network');},async()=>{
  const res=sink();await subscribe({method:'POST',url:'/api/subscribe?u=1&e='+email+'&t='+token},res);assert.equal(res.code,503);
 });
});
test('unsubscribe returns retryable failure instead of false success',async()=>{
 let calls=0;
 await fixture(env,async()=>{calls++;return response(503);},async()=>{
  const res=sink();await subscribe({method:'POST',url:'/api/subscribe?u=1&e='+email+'&t='+token},res);assert.equal(res.code,502);assert.equal(res.body.ok,false);
 });assert.equal(calls,5);
 await fixture(env,async()=>response(204),async()=>{
  const res=sink();await subscribe({method:'POST',url:'/api/subscribe?u=1&e='+email+'&t='+token},res);assert.equal(res.code,200);assert.equal(res.body.ok,true);
 });
});
test('existing buyer preferences survive replays; failed writes are visible',async()=>{
 let calls=0;
 await ensureAudienceContact('plan',{email,unsubscribed:false},'fake',async()=>{calls++;return response(200,{unsubscribed:true});});
 assert.equal(calls,1);
 let attempt=0;await assert.rejects(ensureAudienceContact('plan',{email},'fake',async()=>response(++attempt===1?404:503)));
 let raced=0;await ensureAudienceContact('plan',{email},'fake',async()=>response([404,422,200][raced++]));assert.equal(raced,3);
});
test('all email senders put unsubscribe headers inside Resend JSON',async()=>{
 for(const name of ['cron-welcome-followups.js','cron-weekly-score.js']){
  const source=readFileSync(new URL('../api/'+name,import.meta.url),'utf8');
  const start=source.indexOf('async function sendResend('),end=source.indexOf('\n}\n',start)+3;let sent;
  const send=vm.runInNewContext(source.slice(start,end)+'\nsendResend',{process:{env:{RESEND_API_KEY:'fake'}},FROM_ADDRESS:'from@example.test',REPLY_TO:'reply@example.test',unsubscribeHeaders,unsubUrl:()=> 'https://example.test/unsubscribe',fetch:async(url,options)=>{sent=options;return response(200,{id:'fake'});}});
  if(name.startsWith('cron-welcome'))await send({to:email,subject:'Test',text:'Test',html:'<p>Test</p>',idempotencyKey:'test-step',tag:'test'});
  else await send(email,'Test','Test','<p>Test</p>','test-step');
  const payload=JSON.parse(sent.body);assert.equal(sent.headers['List-Unsubscribe'],undefined);assert.equal(payload.headers['List-Unsubscribe-Post'],'List-Unsubscribe=One-Click');assert.equal(payload.headers['List-Unsubscribe'],'<https://example.test/unsubscribe>');
 }
 let sentWelcome=false;
 await fixture(env,async(url,options)=>{
  if(url.endsWith('/api/cycle-score'))return response(200,{score:20,zone:'accumulation',trendDelta7d:0,commentary:'Test'});
  if(url==='https://api.resend.com/emails'){sentWelcome=true;const payload=JSON.parse(options.body);assert.equal(options.headers['List-Unsubscribe'],undefined);assert.equal(payload.headers['List-Unsubscribe-Post'],'List-Unsubscribe=One-Click');return response(200,{id:'fake'});}
  return response(200,{id:'fake'});
 },async()=>{const res=sink();await subscribe({method:'POST',url:'/api/subscribe',headers:{host:'example.test'},body:{email}},res);assert.equal(res.code,200);});
 assert.equal(sentWelcome,true);
});
function signedRequest(type,plan,extra={}){
 const raw=Buffer.from(JSON.stringify({type,data:{id:'mem_test',plan_id:plan,user:{id:'user_test',email},amount:2900,...extra}}));
 const timestamp=String(Math.floor(Date.now()/1000)),id='msg_test';
 const signature=crypto.createHmac('sha256','webhook-test').update(id+'.'+timestamp+'.'+raw.toString()).digest('base64');
 return Object.assign(Readable.from([raw]),{method:'POST',headers:{'webhook-id':id,'webhook-timestamp':timestamp,'webhook-signature':'v1,'+signature}});
}
test('only buy-plan purchases enter Plan Buyers; enrollment failures are retryable',async()=>{
 for(const plan of ['plan_MntgjXJaQnGsW','plan_WHByzwILskLsc','plan_3SEycpErj9Zk7','plan_uIpPdsPTSHdTp']){
  let writes=0;
  await fixture({...env,WHOP_WEBHOOK_SECRET:'webhook-test'},async(url,opts)=>{if(opts.method==='POST')writes++;return response(opts.method==='POST'?200:404);},async()=>{const res=sink();await webhook(signedRequest('payment.succeeded',plan),res);assert.equal(res.code,200);});
  assert.equal(writes,plan==='plan_MntgjXJaQnGsW'?1:0);
 }
 await fixture({...env,WHOP_WEBHOOK_SECRET:'webhook-test'},async()=>response(503),async()=>{const res=sink();await webhook(signedRequest('payment.succeeded','plan_MntgjXJaQnGsW'),res);assert.equal(res.code,500);});
});
test('followup cron rejects missing secret before network or watchdog',async()=>{
 const source=readFileSync(new URL('../api/cron-welcome-followups.js',import.meta.url),'utf8');
 const start=source.indexOf('export default async function handler(');
 const handler=vm.runInNewContext(source.slice(start).replace('export default ','')+'\nhandler',{URL,process:{env:{}},fetch:async()=>{throw new Error('unexpected network');}});
 for(const url of ['/api/cron-welcome-followups','/api/cron-welcome-followups?check=1','/api/cron-welcome-followups?preview=p0']){const res=sink();await handler({url,headers:{}},res);assert.equal(res.code,401);}
});
test('audience list API failures cannot appear as an empty audience',async()=>{
 const source=readFileSync(new URL('../api/cron-welcome-followups.js',import.meta.url),'utf8');
 for(const name of ['fetchContacts','fetchAudience']){
  const start=source.indexOf('async function '+name+'('),end=source.indexOf('\n}\n',start)+3;
  for(const reply of [response(503),response(200,{})]){
   const fn=vm.runInNewContext(source.slice(start,end)+'\n'+name,{process:{env},fetch:async()=>reply});
   await assert.rejects(fn('fake'));
  }
 }
});
const roleMap={plan_one:'role_shared',plan_two:'role_shared',plan_other:'role_other'};
const membership=(id,plan,status,user='user_test')=>({id,plan:{id:plan},status,user:{id:user}});
const accessInput={eventType:'membership.deactivated',planId:'plan_one',membershipId:'mem_test',userId:'user_test',roleByPlan:roleMap};
const snapshot=(...memberships)=>({complete:true,userId:'user_test',memberships});
test('only final events on mapped plans can revoke an exact role',()=>{
 for(const eventType of ['payment.failed','membership.cancel_at_period_end_changed'])assert.equal(roleRevocationDecision({...accessInput,eventType}).action,'keep');
 assert.equal(roleRevocationDecision({...accessInput,planId:'unknown'}).action,'keep');
 const decision=roleRevocationDecision({...accessInput,snapshot:snapshot(membership('mem_test','plan_one','expired'))});
 assert.equal(decision.action,'remove');assert.equal(decision.roleId,'role_shared');
});
test('shared, repeat, active current, unknown-status and manual grants survive',()=>{
 for(const other of [membership('mem_other','plan_two','completed'),membership('mem_other','plan_one','completed'),membership('mem_other','plan_one','future_status')]){
  assert.equal(roleRevocationDecision({...accessInput,snapshot:snapshot(membership('mem_test','plan_one','expired'),other)}).action,'keep');
 }
 assert.equal(roleRevocationDecision({...accessInput,snapshot:snapshot(membership('mem_test','plan_one','completed'))}).action,'keep');
 assert.equal(roleRevocationDecision({...accessInput,protectedGrant:true}).action,'review');
});
test('incomplete, cross-user, missing and mismatched snapshots cannot revoke',()=>{
 for(const value of [null,{complete:false,userId:'user_test',memberships:[]},snapshot(),snapshot(membership('mem_test','plan_one','expired','someone_else')),snapshot(membership('mem_test','plan_two','expired'))])assert.throws(()=>roleRevocationDecision({...accessInput,snapshot:value}));
});
test('v1 lookup uses observed filter and requires complete matching response',async()=>{
 const input={companyId:'biz_test',userId:'user_test',apiKey:'fake'};
 const got=await fetchMembershipSnapshot(input,async(url)=>{
  const u=new URL(url);assert.equal(u.pathname,'/api/v1/memberships');assert.equal(u.searchParams.get('user_ids[]'),'user_test');assert.equal(u.searchParams.get('company_id'),'biz_test');assert.equal(u.searchParams.get('first'),'100');
  return response(200,{data:[membership('mem_test','plan_one','expired')],page_info:{has_next_page:false}});
 });assert.equal(got.complete,true);
 for(const body of [{data:[],page_info:{has_next_page:true}},{data:[]},{data:[membership('mem_test','plan_one','expired','another')],page_info:{has_next_page:false}}])await assert.rejects(fetchMembershipSnapshot(input,async()=>response(200,body)));
 await assert.rejects(fetchMembershipSnapshot(input,async()=>response(503)));
});
test('webhook preserves access on failed attempts, scheduled cancellations and unknown plans',async()=>{
 for(const [type,plan] of [['payment.failed','plan_MntgjXJaQnGsW'],['membership.cancel_at_period_end_changed','plan_MntgjXJaQnGsW'],['membership.deactivated','unknown'],['membership.deactivated','plan_WHByzwILskLsc']]){
  await fixture({...env,WHOP_WEBHOOK_SECRET:'webhook-test',DISCORD_BOT_TOKEN:'fake'},async()=>{throw new Error('must not call external service');},async()=>{const res=sink();await webhook(signedRequest(type,plan),res);assert.equal(res.code,200);});
 }
});
test('final webhook removes verified inactive Plan role and protects repeat/Founding members',async()=>{
 const plan='plan_MntgjXJaQnGsW',role='1533475043110293715';
 for(const variant of ['expired','repeat','founding','incomplete','discord_failure']){
  let deletions=0;
  await fixture({...env,WHOP_WEBHOOK_SECRET:'webhook-test',WHOP_API_KEY:'fake',DISCORD_BOT_TOKEN:'fake'},async(url,options)=>{
   if(options.method==='DELETE'){deletions++;assert.ok(url.endsWith('/roles/'+role));return response(variant==='discord_failure'?503:204);}
   if(url.endsWith('/roles'))return response(200,[{id:'founding_test',name:'Founding Circle'}]);
   if(url.includes('discord.com'))return response(200,{roles:[role,...(variant==='founding'?['founding_test']:[])]});
   const rows=[membership('mem_test',plan,'expired')];if(variant==='repeat')rows.push(membership('mem_repeat',plan,'completed'));
   return response(200,{data:rows,page_info:{has_next_page:variant==='incomplete'}});
  },async()=>{
   const res=sink();await webhook(signedRequest('membership.deactivated',plan,{discord:{id:'discord_test'},company:{id:'biz_test'}}),res);
   assert.equal(res.code,['incomplete','discord_failure'].includes(variant)?500:200);
  });
  assert.equal(deletions,['expired','discord_failure'].includes(variant)?1:0);
 }
});
