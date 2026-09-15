import test from 'node:test';
import assert from 'node:assert/strict';
import { creditEligibility, planCreditCode, creditPromoRequest, validateCreditPromo, ensurePlanCredit, verifyPlanPayment, revokePlanCreditForRefund, CREDIT_COMPANY, CREDIT_PLAN, CREDIT_PLAN_PRODUCT, CREDIT_SYSTEM, CREDIT_SYSTEM_PRODUCT } from '../api/_plan-credit.js';
const secret='fixture-secret-that-is-long-enough-for-credit-tests';
const member={id:'mem_fixture',status:'completed',user:{id:'user_fixture',email:'buyer@example.test'},company:{id:CREDIT_COMPANY},plan:{id:CREDIT_PLAN},product:{id:CREDIT_PLAN_PRODUCT}};
const payment={id:'pay_fixture',company:{id:CREDIT_COMPANY},plan:{id:CREDIT_PLAN},product:{id:CREDIT_PLAN_PRODUCT},status:'paid',currency:'usd',subtotal:27.62,refunded_amount:0,refunded_at:null,auto_refunded:false,user:member.user,membership:{id:member.id}};
const code=planCreditCode(member.user.id,secret);
const promo={id:'promo_fixture',code,product:{id:CREDIT_SYSTEM_PRODUCT},promo_type:'flat_amount',amount_off:29,currency:'usd',unlimited_stock:false,one_per_customer:true,new_users_only:false,churned_users_only:false,existing_memberships_only:false,stock:1,uses:0,duration:'once',status:'active',expires_at:null};
const response = (value,status=200)=>({ok:status>=200&&status<300,status,json:async()=>value});
test('one-time completed paid Plan is eligible at fee-adjusted subtotal',()=>assert.equal(creditEligibility(payment,member).eligible,true));
test('payment verification needs no coupon secret or coupon API',async()=>{
 const urls=[];const request=async(url)=>{urls.push(url);return response(url.endsWith('/payments/pay_fixture')?payment:member);};
 const r=await verifyPlanPayment({paymentId:'pay_fixture',apiKey:'fixture'},request);
 assert.equal(r.status,'verified');assert.equal(r.email,'buyer@example.test');assert.equal(urls.length,2);assert.ok(urls.every(x=>!x.includes('promo_codes')));
});
test('top-level paid with refund is ineligible',()=>assert.equal(creditEligibility({...payment,refunded_amount:32.96,refunded_at:'2026-08-20',substatus:'refunded'},member).eligible,false));
test('zero, unknown refund, wrong product, failed and inactive do not earn credit',()=>{
 for(const change of [{subtotal:0},{subtotal:NaN},{subtotal:Infinity},{refunded_amount:undefined},{product:{id:'prod_other'}},{status:'open'},{dispute_alerted_at:'2026-09-14'}]) assert.equal(creditEligibility({...payment,...change},member).eligible,false);
 assert.equal(creditEligibility(payment,{...member,status:'canceled'}).eligible,false);
});
test('identity mismatch fails closed',()=>assert.throws(()=>creditEligibility(payment,{...member,user:{id:'user_other'}})));
test('stable private code per user and secret, with no raw ID',()=>{
 assert.equal(planCreditCode('user_fixture',secret),code);assert.notEqual(planCreditCode('user_other',secret),code);assert.ok(!code.includes('fixture'));assert.throws(()=>planCreditCode('user_fixture','short'));
});
test('only System standard plan and product, $29 once and one use',()=>{
 const p=creditPromoRequest(code);assert.deepEqual(p.plan_ids,[CREDIT_SYSTEM]);assert.equal(p.product_id,CREDIT_SYSTEM_PRODUCT);assert.equal(p.amount_off,29);assert.equal(p.unlimited_stock,false);assert.equal(p.stock,1);assert.equal(p.new_users_only,false);
});
test('wrong or unrestricted promos fail; used code is never replaced',()=>{
 for(const change of [{amount_off:197},{product:null},{unlimited_stock:true},{stock:2},{stock:0},{duration:'forever'},{one_per_customer:false}]) assert.throws(()=>validateCreditPromo({...promo,...change},code));
 assert.equal(validateCreditPromo({...promo,stock:0,uses:1},code).status,'used');
});
test('eligible creation sends scoped payload and returns verified email',async()=>{
 let creates=0;
 const request=async(url,opts)=>{
   if(url.endsWith('/payments/pay_fixture'))return response(payment);
   if(url.endsWith('/memberships/mem_fixture'))return response(member);
   if(opts.method==='POST'){creates++;assert.deepEqual(JSON.parse(opts.body),creditPromoRequest(code));return response(promo);}
   return response({data:[],page_info:{has_next_page:false}});
 };
 const r=await ensurePlanCredit({paymentId:'pay_fixture',apiKey:'fixture',secret},request);assert.equal(r.status,'ready');assert.equal(r.email,'buyer@example.test');assert.equal(creates,1);
});
test('existing code found on second page is reused with no creation',async()=>{
 let lists=0;
 const request=async(url,opts)=>{
   if(url.endsWith('/payments/pay_fixture'))return response(payment);
   if(url.endsWith('/memberships/mem_fixture'))return response(member);
   assert.notEqual(opts.method,'POST');lists++;
   return response(lists===1?{data:[],page_info:{has_next_page:true,end_cursor:'next'}}:{data:[promo],page_info:{has_next_page:false}});
 };
 assert.equal((await ensurePlanCredit({paymentId:'pay_fixture',apiKey:'fixture',secret},request)).status,'ready');assert.equal(lists,2);
});
test('partial or looping inventory fails before creating',async()=>{
 for(const page of [{data:[]},{data:[],page_info:{has_next_page:true,end_cursor:'same'}}]){
   const request=async(url,opts)=>{if(url.endsWith('/payments/pay_fixture'))return response(payment);if(url.endsWith('/memberships/mem_fixture'))return response(member);assert.notEqual(opts.method,'POST');return response(page);};
   await assert.rejects(ensurePlanCredit({paymentId:'pay_fixture',apiKey:'fixture',secret},request));
 }
});
test('ambiguous create recovers existing code rather than retrying POST',async()=>{
 let lists=0,creates=0;
 const request=async(url,opts)=>{if(url.endsWith('/payments/pay_fixture'))return response(payment);if(url.endsWith('/memberships/mem_fixture'))return response(member);if(opts.method==='POST'){creates++;throw Error('timeout');}lists++;return response({data:lists===1?[]:[promo],page_info:{has_next_page:false}});};
 assert.equal((await ensurePlanCredit({paymentId:'pay_fixture',apiKey:'fixture',secret},request)).status,'ready');assert.equal(creates,1);
});
test('live-shaped refunded buyer does not call coupon or membership APIs',async()=>{
 let calls=0;const request=async()=>{calls++;return response({...payment,refunded_amount:32.96,refunded_at:'2026-08-20'});};
 assert.equal((await ensurePlanCredit({paymentId:'pay_fixture',apiKey:'fixture',secret},request)).status,'ineligible');assert.equal(calls,1);
});

test('used code accepts both fixed-cap and remaining-stock representations',()=>{
 for(const stock of [0,1]) assert.equal(validateCreditPromo({...promo,stock,uses:1},code).status,'used');
});
const refunded={...payment,refunded_amount:29,refunded_at:'2026-09-14T01:00:00Z'};
function refundFixture({refund=refunded,existing=promo,others=[],detail=payment,refresh=existing,timeout=false,partial=false}={}) {
 const writes=[];let patched=false;
 const request=async(url,opts={})=>{
  if(url.endsWith('/payments/pay_fixture')) return response(refund);
  if(url.endsWith('/payments/pay_other')) return response({...detail,id:'pay_other'});
  if(url.includes('/memberships/')) return response(member);
  if(url.includes('/payments?')) return response(partial?{data:others}:{data:others,page_info:{has_next_page:false}});
  if(opts.method==='PATCH'){writes.push(JSON.parse(opts.body));patched=true;if(timeout)throw Error('timeout');return response({...refresh,status:'inactive'});}
  if(url.endsWith('/promo_codes/promo_fixture')) return response(patched?{...refresh,status:'inactive'}:refresh);
  if(url.includes('/promo_codes?'))return response({data:existing?[existing]:[],page_info:{has_next_page:false}});
  throw Error('Unexpected request');
 };return {request,writes};
}
const revoke=fixture=>revokePlanCreditForRefund({paymentId:'pay_fixture',apiKey:'fixture',secret},fixture.request);
test('refund disables unused credit and confirms readback, retry is idempotent',async()=>{
 const f=refundFixture();assert.equal((await revoke(f)).status,'revoked');assert.deepEqual(f.writes,[{status:'inactive'}]);
 const inactive=refundFixture({existing:{...promo,status:'inactive'}});assert.equal((await revoke(inactive)).status,'already_inactive');assert.equal(inactive.writes.length,0);
});
test('non-refund and absent coupon never mutate or create',async()=>{
 for(const [f,status] of [[refundFixture({refund:payment}),'not_refunded'],[refundFixture({existing:null}),'no_credit']]) {assert.equal((await revoke(f)).status,status);assert.equal(f.writes.length,0);}
});
test('consumed credit remains unchanged, including consumption before mutation',async()=>{
 for(const f of [refundFixture({existing:{...promo,uses:1}}),refundFixture({refresh:{...promo,stock:0,uses:1}})]){assert.equal((await revoke(f)).status,'used');assert.equal(f.writes.length,0);}
});
test('older refund cannot cancel credit backed by another eligible Plan purchase',async()=>{
 const f=refundFixture({others:[{...payment,id:'pay_other'}]});assert.equal((await revoke(f)).status,'retained_eligible_purchase');assert.equal(f.writes.length,0);
});
test('incomplete payment inventory fails before refund mutation',async()=>{
 const f=refundFixture({partial:true});await assert.rejects(revoke(f));assert.equal(f.writes.length,0);
});
test('ambiguous refund PATCH verifies inactive without a second write',async()=>{
 const f=refundFixture({timeout:true});assert.equal((await revoke(f)).status,'revoked');assert.equal(f.writes.length,1);
});
test('refund identity mismatch fails before promo mutation',async()=>{
 const f=refundFixture({refund:{...refunded,user:{id:'user_other'}}});await assert.rejects(revoke(f));assert.equal(f.writes.length,0);
});
