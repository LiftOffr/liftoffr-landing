import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import webhook from '../api/whop-webhook.js';

const config = {WHOP_WEBHOOK_SECRET:'fixture-secret',WHOP_API_KEY:'fixture',DISCORD_BOT_TOKEN:'fixture',GA4_MEASUREMENT_ID:'G-FIXTURE',GA4_API_SECRET:'fixture'};
const offers = [
  ['System','plan_WHByzwILskLsc','prod_b4DoR00YHuysT',197],
  ['Playbook','plan_uIpPdsPTSHdTp','prod_qkbRaW1vFT2cM',497],
];
function payment([,plan,product,subtotal]) {
  return {id:'pay_fixture',status:'paid',subtotal,currency:'usd',refunded_amount:0,refunded_at:null,auto_refunded:false,
    company:{id:'biz_1PHI81i7fkqRUZ'},plan:{id:plan},product:{id:product},membership:{id:'mem_fixture'},
    user:{id:'user_fixture',discord:{id:'111111111111111111'}}};
}
async function run(offer, changes = {}, eventChanges = {}, apiStatus = 200) {
  const original = payment(offer), canonical = {...original,...changes};
  const event = {type:'payment.succeeded',api_version:'v1',data:original,...eventChanges};
  const oldEnv = process.env, oldFetch = globalThis.fetch, oldLog = console.log, oldError = console.error;
  const calls = [];
  process.env = {...config}; console.log = ()=>{}; console.error = ()=>{};
  globalThis.fetch = async(url, opts = {}) => {
    calls.push({url,method:opts.method || 'GET',body:opts.body ? JSON.parse(opts.body) : undefined});
    if (url === 'https://api.whop.com/api/v1/payments/pay_fixture') return {ok:apiStatus===200,status:apiStatus,json:async()=>canonical};
    if (url === 'https://api.whop.com/api/v2/memberships/mem_fixture') return {ok:true,status:200,json:async()=>({discord:{id:'111111111111111111'}})};
    if (url.startsWith('https://discord.com/api/v10/guilds/') || url.startsWith('https://www.google-analytics.com/')) return {ok:true,status:204,json:async()=>({})};
    throw new Error('Unexpected test network');
  };
  try {
    const raw = JSON.stringify(event), timestamp = String(Math.floor(Date.now()/1000)), messageId = 'msg_fixture';
    const signature = crypto.createHmac('sha256',config.WHOP_WEBHOOK_SECRET).update(messageId+'.'+timestamp+'.'+raw).digest('base64');
    const req = Readable.from([Buffer.from(raw)]);
    Object.assign(req,{method:'POST',headers:{'webhook-id':messageId,'webhook-timestamp':timestamp,'webhook-signature':'v1,'+signature}});
    const res = {status(n){this.code=n;return this},json(value){this.body=value;return this}};
    await webhook(req,res); return {res,calls};
  } finally {process.env=oldEnv;globalThis.fetch=oldFetch;console.log=oldLog;console.error=oldError;}
}
const grants = calls => calls.filter(c=>c.url.includes('discord.com') && c.method==='PUT');
const purchases = calls => calls.filter(c=>c.url.includes('google-analytics')).flatMap(c=>c.body.events.filter(e=>e.name==='purchase'));
const assertNoSideEffects = calls => {assert.equal(grants(calls).length,0);assert.equal(purchases(calls).length,0);};
for (const offer of offers) {
  test(offer[0]+': delayed event cannot grant or report a refunded payment',async()=>{
    const {res,calls}=await run(offer,{refunded_amount:offer[3],refunded_at:'2026-09-14T00:00:00Z',substatus:'refunded'});
    assert.equal(res.code,200);assert.equal(res.body.revenue,'addon_payment_refunded_disputed_or_unknown');assertNoSideEffects(calls);assert.equal(calls.length,1);
  });
  test(offer[0]+': fresh verified subtotal supplies GA evidence after verification',async()=>{
    const {res,calls}=await run(offer,{subtotal:offer[3]-10});assert.equal(res.code,200);
    assert.equal(grants(calls).length,1);assert.equal(purchases(calls).length,1);assert.equal(purchases(calls)[0].params.value,offer[3]-10);
    assert.ok(calls[0].url.includes('/payments/pay_fixture'));assert.equal(purchases(calls)[0].params.transaction_id,'pay_fixture');
  });
  test(offer[0]+': unsupported schema never grants from payload alone',async()=>{
    const {res,calls}=await run(offer,{}, {api_version:'v2'});assert.equal(res.code,200);assertNoSideEffects(calls);assert.equal(calls.length,0);
  });
}
test('canonical user, company, plan, product and payment mismatches fail closed',async()=>{
  for(const change of [{user:{id:'user_other'}},{company:{id:'biz_other'}},{plan:{id:'plan_other'}},{product:{id:'prod_other'}},{id:'pay_other'}]) {
    const {res,calls}=await run(offers[0],change);assert.equal(res.code,500);assertNoSideEffects(calls);
  }
});
test('canonical disputed, unknown refund, zero and nonpaid payments do not grant',async()=>{
  for(const change of [{dispute_alerted_at:'2026-09-14T00:00:00Z'},{refunded_amount:undefined},{subtotal:0},{status:'open'}]) {
    const {res,calls}=await run(offers[1],change);assert.equal(res.code,200);assertNoSideEffects(calls);
  }
});
test('canonical API outage remains retryable without granting',async()=>{
  const {res,calls}=await run(offers[0],{},{},503);assert.equal(res.code,500);assertNoSideEffects(calls);
});
test('v1 payment resolves linked Discord using its nested membership, never its payment id',async()=>{
  const data={...payment(offers[1]),user:{id:'user_fixture'}};
  const {res,calls}=await run(offers[1],{}, {data});
  assert.equal(res.code,200);assert.equal(grants(calls).length,1);
  assert.equal(calls.filter(c=>c.url.includes('/api/v2/memberships/mem_fixture')).length,1);
  assert.ok(!calls.some(c=>c.url.includes('/memberships/pay_')));
});
test('membership activation retains native/addon access behavior without inventing revenue',async()=>{
  for(const offer of offers) {
    const member={...payment(offer),id:'mem_fixture',status:'completed'};
    const {res,calls}=await run(offer,{}, {type:'membership.activated',data:member});
    assert.equal(res.code,200);assert.equal(grants(calls).length,1);assert.equal(purchases(calls).length,0);assert.ok(!calls.some(c=>c.url.includes('api.whop.com')));
  }
});
