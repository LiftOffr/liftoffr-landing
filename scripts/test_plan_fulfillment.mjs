import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {Readable} from 'node:stream';
import {fulfillPlanPayment,planAccessEmail} from '../api/_plan-fulfillment.js';
import {planCreditCode,CREDIT_COMPANY,CREDIT_PLAN,CREDIT_PLAN_PRODUCT,CREDIT_SYSTEM_PRODUCT} from '../api/_plan-credit.js';
import webhook from '../api/whop-webhook.js';
import {createCheckoutMetadata} from '../api/_checkout-attribution.js';

const config={WHOP_API_KEY:'test-whop',PLAN_CREDIT_SECRET:'fixture-stable-credit-secret-at-least-32chars',RESEND_API_KEY:'test-resend',WHOP_WEBHOOK_SECRET:'test-signature-secret',GA4_MEASUREMENT_ID:'G-TEST',GA4_API_SECRET:'test-ga',CHECKOUT_ATTRIBUTION_SECRET:'fixture-checkout-attribution-key-at-least-32',RESEND_PLAN_AUDIENCE_ID:'test-audience'};
const member={id:'mem_fixture',status:'completed',user:{id:'user_fixture',email:'buyer@example.test'},company:{id:CREDIT_COMPANY},plan:{id:CREDIT_PLAN},product:{id:CREDIT_PLAN_PRODUCT}};
const now=Math.floor(Date.now()/1000);
const checkoutMetadata=createCheckoutMetadata({planId:CREDIT_PLAN,consent:'granted',clientId:'123456789.1234567890',sessionId:String(now-60),utm:{utm_source:'instagram',utm_content:'garage_01'},position:'hero'},config.CHECKOUT_ATTRIBUTION_SECRET);
const payment={metadata:checkoutMetadata,paid_at:new Date().toISOString(),id:'pay_fixture',company:{id:CREDIT_COMPANY},plan:{id:CREDIT_PLAN},product:{id:CREDIT_PLAN_PRODUCT},status:'paid',currency:'usd',subtotal:27.62,refunded_amount:0,refunded_at:null,auto_refunded:false,user:member.user,membership:{id:member.id}};
const promo={id:'promo_fixture',code:planCreditCode('user_fixture',config.PLAN_CREDIT_SECRET),product:{id:CREDIT_SYSTEM_PRODUCT},promo_type:'flat_amount',amount_off:29,currency:'usd',unlimited_stock:false,one_per_customer:true,new_users_only:false,churned_users_only:false,existing_memberships_only:false,stock:1,uses:0,duration:'once',status:'active',expires_at:null};
function response(data={},status=200){return {ok:status>=200&&status<300,status,json:async()=>data};}
async function fixture(options,run){
 const oldEnv=process.env,oldFetch=globalThis.fetch;
 process.env={...config,...options.env};
 const calls=[];
 const request=async(url,opts={})=>{
  calls.push({url,method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):undefined,headers:opts.headers});
  if(url.endsWith('/payments/pay_fixture'))return response(options.payment||payment);
  if(url.endsWith('/memberships/mem_fixture'))return response(options.member||member);
  if(url.includes('/promo_codes?'))return response({data:[options.promo||promo],page_info:{has_next_page:false}},options.couponStatus||200);
  if(url==='https://api.resend.com/emails')return response({id:'email_fixture'},options.emailStatus||200);
  if(url.includes('/audiences/'))return response({id:'contact_fixture'},options.audienceStatus||200);
  if(url.startsWith('https://www.google-analytics.com/'))return response({},204);
  throw new Error('Unexpected test network '+url);
 };
 globalThis.fetch=request;
 try{await run({request,calls});}finally{process.env=oldEnv;globalThis.fetch=oldFetch;}
}
const emails=calls=>calls.filter(c=>c.url==='https://api.resend.com/emails');
test('verified buyer receives access first and a separate private credit',async()=>fixture({},async({request,calls})=>{
 assert.equal((await fulfillPlanPayment('pay_fixture',request)).status,'access_and_credit_sent');
 const sent=emails(calls);assert.equal(sent.length,2);
 assert.equal(sent[0].headers['Idempotency-Key'],'plan-access-v1-pay_fixture');
 assert.equal(sent[1].headers['Idempotency-Key'],'plan-credit-v1-pay_fixture');
 assert.deepEqual(sent[0].body.to,['buyer@example.test']);assert.ok(sent[0].body.html.includes('<a href="https://whop.com/liftoffr/content-JnPHMvgbjjhcD9/app/"'));
 assert.ok(!sent[0].body.text.includes(promo.code));assert.ok(sent[1].body.text.includes(promo.code));
 assert.ok(sent[1].body.html.includes('<a href="https://whop.com/checkout/plan_WHByzwILskLsc"'));
 assert.ok(calls.indexOf(sent[0])<calls.findIndex(c=>c.url.includes('/promo_codes?')));
}));
test('coupon outage cannot block access; failure remains retryable',async()=>fixture({couponStatus:503},async({request,calls})=>{
 await assert.rejects(fulfillPlanPayment('pay_fixture',request));assert.equal(emails(calls).length,1);
 assert.equal(emails(calls)[0].headers['Idempotency-Key'],'plan-access-v1-pay_fixture');
}));
test('missing credit secret cannot block access',async()=>fixture({env:{PLAN_CREDIT_SECRET:''}},async({request,calls})=>{
 await assert.rejects(fulfillPlanPayment('pay_fixture',request));assert.equal(emails(calls).length,1);
}));
test('used credit never suppresses access or creates another credit',async()=>fixture({promo:{...promo,stock:0,uses:1}},async({request,calls})=>{
 assert.deepEqual(await fulfillPlanPayment('pay_fixture',request),{status:'access_sent',credit:'used'});assert.equal(emails(calls).length,1);
}));
test('refunded payment produces no email or credit',async()=>fixture({payment:{...payment,refunded_amount:29,refunded_at:'2026-08-20'}},async({request,calls})=>{
 assert.equal((await fulfillPlanPayment('pay_fixture',request)).status,'ineligible');assert.equal(emails(calls).length,0);assert.equal(calls.length,1);
}));
test('identity mismatch cannot email a caller-selected recipient',async()=>fixture({member:{...member,user:{id:'user_wrong',email:'wrong@example.test'}}},async({request,calls})=>{
 await assert.rejects(fulfillPlanPayment('pay_fixture',request));assert.equal(emails(calls).length,0);
}));
test('email failure is retryable before any coupon request',async()=>fixture({emailStatus:503},async({request,calls})=>{
 await assert.rejects(fulfillPlanPayment('pay_fixture',request));assert.ok(!calls.some(c=>c.url.includes('/promo_codes')));
}));
test('replays have identical access and credit idempotency keys and bodies',async()=>fixture({},async({request,calls})=>{
 await fulfillPlanPayment('pay_fixture',request);await fulfillPlanPayment('pay_fixture',request);
 const sent=emails(calls);assert.deepEqual(sent[0],sent[2]);assert.deepEqual(sent[1],sent[3]);
}));
async function invoke(event){
 const body=JSON.stringify(event),ts=String(Math.floor(Date.now()/1000)),id='msg_fixture';
 const sig=crypto.createHmac('sha256',config.WHOP_WEBHOOK_SECRET).update(id+'.'+ts+'.'+body).digest('base64');
 const req=Readable.from([Buffer.from(body)]);Object.assign(req,{method:'POST',headers:{'webhook-id':id,'webhook-timestamp':ts,'webhook-signature':'v1,'+sig}});
 const res={status(n){this.code=n;return this},json(o){this.body=o;return this}};await webhook(req,res);return res;
}
test('membership activation never becomes GA4 purchase',async()=>fixture({},async({calls})=>{
 const r=await invoke({type:'membership.activated',api_version:'v1',data:member});assert.equal(r.code,200);
 assert.ok(!calls.some(c=>c.url.includes('google-analytics')));assert.equal(emails(calls).length,0);
}));
test('audience outage cannot trigger inline fulfillment in webhook',async()=>fixture({audienceStatus:503},async({calls})=>{
 const r=await invoke({type:'payment.succeeded',api_version:'v1',data:payment});assert.equal(r.code,500);
 assert.equal(emails(calls).length,0);
}));
test('verified payment forwards actual subtotal once with payment id',async()=>fixture({},async({calls})=>{
 const r=await invoke({type:'payment.succeeded',api_version:'v1',data:payment});assert.equal(r.code,200);
 const ga=calls.filter(c=>c.url.includes('google-analytics'));assert.equal(ga.length,1);
 const p=ga[0].body.events[0].params;assert.equal(p.value,27.62);assert.equal(p.transaction_id,'pay_fixture');assert.equal(p.attribution_status,'consented_checkout_metadata');assert.equal(ga[0].body.client_id,'123456789.1234567890');assert.ok(!('user_id' in ga[0].body));assert.equal(p.session_id,String(now-60));
}));
test('Plan revenue uses current verified subtotal over the event snapshot',async()=>fixture({payment:{...payment,subtotal:26.50}},async({calls})=>{
 const r=await invoke({type:'payment.succeeded',api_version:'v1',data:payment});assert.equal(r.code,200);
 const ga=calls.filter(c=>c.url.includes('google-analytics'));assert.equal(ga.length,1);assert.equal(ga[0].body.events[0].params.value,26.50);
}));

test('stale refunded Plan payment cannot restore roles, send emails or report revenue',async()=>fixture({payment:{...payment,refunded_amount:29,refunded_at:'2026-08-20'},env:{DISCORD_BOT_TOKEN:'test-bot'}},async({calls})=>{
 const r=await invoke({type:'payment.succeeded',api_version:'v1',data:payment});assert.equal(r.code,200);assert.equal(r.body.revenue,'plan_payment_no_longer_eligible');
 assert.equal(calls.length,1);assert.equal(emails(calls).length,0);assert.ok(!calls.some(c=>c.url.includes('discord')||c.url.includes('google-analytics')));
}));

test('payment without consent metadata remains in Whop and never invents a GA client',async()=>fixture({payment:{...payment,metadata:{}}},async({calls})=>{
 const r=await invoke({type:'payment.succeeded',api_version:'v1',data:payment});assert.equal(r.code,200);assert.equal(r.body.ga4,'no_consented_checkout_metadata');
 assert.ok(!calls.some(c=>c.url.includes('google-analytics')));
}));
test('signed event metadata cannot override missing fresh canonical metadata',async()=>fixture({payment:{...payment,metadata:{lo_attribution_v:'1',lo_attribution:'bad',lo_attribution_sig:'0'.repeat(64)}}},async({calls})=>{
 const r=await invoke({type:'payment.succeeded',api_version:'v1',data:payment});assert.equal(r.code,200);assert.equal(r.body.ga4,'invalid_checkout_signature');
 assert.ok(!calls.some(c=>c.url.includes('google-analytics')));
}));
