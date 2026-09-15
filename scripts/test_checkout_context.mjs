import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createCheckoutMetadata,verifiedCheckoutAttribution,handleCheckoutAttribution,CHECKOUT_PLANS} from '../api/_checkout-attribution.js';
import reviews from '../api/reviews.js';
const secret='fixture-private-checkout-key-longer-than32';
const now=Math.floor(Date.now()/1000);
const input={consent:'granted',planId:CHECKOUT_PLANS[0],clientId:'123456789.1234567890',sessionId:String(now-60),utm:{utm_source:'instagram',utm_medium:'bio',utm_campaign:'plan_proof',utm_content:'garage_01'},position:'hero'};
const metadata=createCheckoutMetadata(input,secret,now);
const options={planId:input.planId,paidAt:new Date(now*1000).toISOString(),secret,now};
const decode=m=>JSON.parse(Buffer.from(m.lo_attribution,'base64url').toString());
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
function res(){return{headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(body){this.body=body;return this}}}

test('signed metadata carries only bounded consented IDs and acquisition fields',()=>{
 assert.equal(verifiedCheckoutAttribution(metadata,options).clientId,input.clientId);
 const value=decode(createCheckoutMetadata({...input,email:'never@example.test',utm:{...input.utm,utm_content:'never@example.test',utm_term:'5555555555'},position:'https://private.test'},secret,now));
 assert.equal(value.utm.utm_source,'instagram');assert.equal(value.utm.utm_content,undefined);assert.equal(value.utm.utm_term,undefined);assert.equal(value.position,'');assert.ok(!JSON.stringify(value).includes('never@example'));
});
for(const [name,change] of [ ['denied',{consent:'denied'}],['undecided',{consent:null}],['foreign plan',{planId:'plan_attack'}],['Whop ID as GA ID',{clientId:'user_abc'}],['long GA ID',{clientId:'1'.repeat(200)}],['bad session',{sessionId:'session'}],['old session',{sessionId:String(now-90000)}],['future session',{sessionId:String(now+1000)}] ]){
 test('rejects '+name,()=>assert.throws(()=>createCheckoutMetadata({...input,...change},secret,now)));
}
test('tampering, missing signatures, wrong plan, expired session and missing payment time fail closed',()=>{
 assert.equal(verifiedCheckoutAttribution({...metadata,lo_attribution_sig:'0'.repeat(64)},options).skip,'invalid_checkout_signature');
 assert.ok(verifiedCheckoutAttribution({...metadata,lo_attribution_sig:null},options).skip);
 assert.ok(verifiedCheckoutAttribution(metadata,{...options,planId:CHECKOUT_PLANS[1]}).skip);
 assert.ok(verifiedCheckoutAttribution(metadata,{...options,now:now+90000}).skip);
 assert.ok(verifiedCheckoutAttribution(metadata,{...options,paidAt:null}).skip);
 assert.ok(verifiedCheckoutAttribution(metadata,{...options,paidAt:new Date((now-1000)*1000).toISOString()}).skip);
});
let ip=0;
async function endpoint({body=input,headers={},env={},method='POST',upstream}={}){
 const previous=process.env;
 process.env={...previous,WHOP_API_KEY:'fixture-key',CHECKOUT_ATTRIBUTION_ENABLED:'true',CHECKOUT_ATTRIBUTION_SECRET:secret,...env};
 const req={method,body,url:'/api/reviews?action=checkout',headers:{origin:'https://liftoffr.com','content-type':'application/json','sec-fetch-site':'same-origin','x-vercel-forwarded-for':'fixture-'+(++ip),...headers}};
 const result=res(),calls=[];
 try{
  await handleCheckoutAttribution(req,result,async(url,opts)=>{
   calls.push({url,...opts});const p=JSON.parse(opts.body);
   return upstream?upstream(url,opts):response({id:'ch_fixture',plan:{id:p.plan_id},company_id:'biz_1PHI81i7fkqRUZ',mode:'payment',metadata:p.metadata,purchase_url:'https://whop.com/checkout/ch_fixture/'});
  });
  return{result,calls};
 }finally{process.env=previous;}
}
test('endpoint creates only the original allowlisted plan with metadata, no billing overrides',async()=>{
 const {result,calls}=await endpoint();assert.equal(result.code,200);assert.equal(result.headers['Cache-Control'],'no-store');
 assert.deepEqual(result.body,{checkoutUrl:'https://whop.com/checkout/ch_fixture/'});
 const sent=JSON.parse(calls[0].body);assert.deepEqual(Object.keys(sent).sort(),['metadata','plan_id']);assert.equal(sent.plan_id,input.planId);assert.equal(calls[0].redirect,'error');
 assert.equal(decode(sent.metadata).client,input.clientId);assert.ok(calls[0].signal instanceof AbortSignal);
});
for(const [name,overrides,code] of [['disabled',{env:{CHECKOUT_ATTRIBUTION_ENABLED:'false'}},503],['missing secret',{env:{CHECKOUT_ATTRIBUTION_SECRET:''}},503],['cross-origin',{headers:{origin:'https://evil.test'}},403],['absent origin',{headers:{origin:undefined}},403],['cross-site',{headers:{'sec-fetch-site':'cross-site'}},403],['form body',{headers:{'content-type':'application/x-www-form-urlencoded'}},403],['oversized body',{body:{...input,padding:'x'.repeat(3000)}},400],['denied consent',{body:{...input,consent:'denied'}},400],['unknown product',{body:{...input,planId:'plan_attack'}},400]]){
 test('endpoint rejects '+name+' before Whop',async()=>{const{result,calls}=await endpoint(overrides);assert.equal(result.code,code);assert.equal(calls.length,0);});
}
test('upstream failure or untrusted redirect returns bounded fallback response',async()=>{
 assert.equal((await endpoint({upstream:()=>response({},503)})).result.code,502);
 assert.equal((await endpoint({upstream:()=>response({id:'ch_fixture',plan:{id:input.planId},company_id:'biz_1PHI81i7fkqRUZ',mode:'payment',metadata,purchase_url:'https://evil.test'})})).result.code,502);
});
test('warm-instance throttles repeated origin requests',async()=>{
 const statuses=[];for(let i=0;i<7;i++)statuses.push((await endpoint({headers:{'x-vercel-forwarded-for':'same-fixture'}})).result.code);
 assert.deepEqual(statuses,[200,200,200,200,200,200,429]);
});
test('GET reviews and unrelated methods do not call the new checkout branch',async()=>{
 for(const method of ['GET','PUT','OPTIONS']){
  const r=res();await reviews({url:'/api/reviews?action=checkout',method,headers:{}},r);
  assert.equal(r.code,200);assert.deepEqual(r.body,{product:null,count:0,average:null,reviews:[]});
 }
});

const browserCode=fs.readFileSync(new URL('../js/checkout-context.js',import.meta.url),'utf8');
async function browser({consent='granted',ids=[input.clientId,input.sessionId],event={},href='https://whop.com/checkout/'+input.planId+'?utm_source=instagram&utm_content=garage_01',target='',fetcher,callback=true,duplicate=false}={}){
 const handlers={},windowHandlers={},navigation=[],network=[],gets=[];
 const anchor={href,target,hasAttribute:()=>false,getAttribute:k=>k==='data-cta-slot'?'hero':null};
 const location={assign:x=>navigation.push(x)};
 const win={__loConsent:{state:consent},location,AbortController,fetch:()=>{},addEventListener:(n,fn)=>windowHandlers[n]=fn,loAttribution:()=>input.utm,gtag:(cmd,mid,field,cb)=>{gets.push(field);if(callback)cb(ids[field==='client_id'?0:1]);}};
 const doc={addEventListener:(name,fn)=>handlers[name]=fn};
 const fetch=async(url,opts)=>{network.push({url,opts,body:JSON.parse(opts.body)});return fetcher?fetcher(win):response({checkoutUrl:'https://whop.com/checkout/ch_fixture/'});};
 const context=vm.createContext({window:win,document:doc,location,URL,AbortController,fetch,Promise,setTimeout,clearTimeout});
 vm.runInContext(browserCode,context);if(duplicate)vm.runInContext(browserCode,context);
 const e={button:0,target:{closest:()=>anchor},preventDefault(){this.defaultPrevented=true},...event};
 handlers.click(e);
 await new Promise(r=>setTimeout(r,callback?20:300));
 return{navigation,network,gets,e,win,handlers,windowHandlers,anchor};
}
test('consented browser reads actual gtag IDs and navigates to verified hosted URL',async()=>{
 const b=await browser({duplicate:true});assert.equal(b.network.length,1);assert.deepEqual(b.gets,['client_id','session_id']);assert.deepEqual(b.navigation,['https://whop.com/checkout/ch_fixture/']);assert.equal(b.network[0].body.utm.utm_content,'garage_01');assert.equal(b.network[0].body.position,'hero');
});
for(const [name,opts] of [['declined',{consent:'denied'}],['undecided',{consent:null}],['new-tab',{target:'_blank'}],['modified click',{event:{ctrlKey:true}}],['middle click',{event:{button:1}}],['coupon link',{href:'https://whop.com/checkout/'+input.planId+'?promo_code=keepme'}],['foreign host',{href:'https://evil.test/checkout/'+input.planId}]]){
 test('browser leaves '+name+' entirely native',async()=>{const b=await browser(opts);assert.equal(b.gets.length,0);assert.equal(b.network.length,0);assert.equal(b.navigation.length,0);assert.equal(b.e.defaultPrevented,undefined);});
}
test('blocked tag and invalid GA ID use original link without API transport',async()=>{
 for(const opts of [{callback:false},{ids:['user_whop',input.sessionId]}]){const b=await browser(opts);assert.equal(b.network.length,0);assert.match(b.navigation[0],/checkout\/plan_/);}
});
test('API errors, unsafe URL and newly revoked consent fall back to original link',async()=>{
 for(const fetcher of [()=>response({},503),()=>response({checkoutUrl:'https://evil.test'}),w=>{w.__loConsent.state='denied';return response({checkoutUrl:'https://whop.com/checkout/ch_fixture/'})}]){const b=await browser({fetcher});assert.match(b.navigation[0],/checkout\/plan_/);}
});
test('history restore clears the click lock',async()=>{
 const b=await browser();b.windowHandlers.pageshow();const e={button:0,target:{closest:()=>b.anchor},preventDefault(){this.defaultPrevented=true}};
 b.handlers.click(e);await new Promise(r=>setTimeout(r,20));assert.equal(b.network.length,2);
});

test('freeform names and address-like campaign labels are omitted by slug/source restrictions',()=>{
 const value=decode(createCheckoutMetadata({...input,utm:{utm_source:'Jane',utm_medium:'Jane Smith',utm_campaign:'123 Main St',utm_content:'jane@example.test'}},secret,now));
 assert.deepEqual(value.utm,{});
});
test('stalled checkout request still navigates to original link within a bounded delay',async()=>{
 const b=await browser({fetcher:()=>new Promise(()=>{})});assert.equal(b.navigation.length,0);
 await new Promise(r=>setTimeout(r,1700));assert.match(b.navigation[0],/checkout\/plan_/);assert.equal(b.navigation.length,1);
});
