const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const source = fs.readFileSync(path.join(__dirname, '../api/_whop-revenue.js'), 'utf8');
  const { purchaseFromWhopEvent: parse } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const paid = {type:'payment.succeeded',api_version:'v1',data:{id:'pay_TestA',status:'paid',subtotal:29,total:31.39,amount_after_fees:28.41,currency:'usd',membership:{id:'mem_same'}}};
  let checks = 0;
  function check(name, fn) { fn(); checks++; console.log('PASS '+name); }
  check('29 dollars stays 29; uses subtotal, excludes tax and settlement fees', () => assert.deepEqual(parse(paid), {transactionId:'pay_TestA',value:29,currency:'USD'}));
  check('fee-adjusted plan subtotal stays decimal', () => assert.equal(parse({...paid,data:{...paid.data,subtotal:27.62}}).value,27.62));
  for (const type of ['membership.activated','membership.went_valid','membership.deactivated','payment.failed']) {
    check(type+' cannot fabricate a purchase', () => assert.equal(parse({...paid,type}).skip,'not_payment_succeeded'));
  }
  check('free payment has no price fallback', () => assert.equal(parse({...paid,data:{...paid.data,subtotal:0}}).skip,'zero_value_payment'));
  check('renewal gets a distinct transaction id', () => assert.notEqual(parse(paid).transactionId,parse({...paid,data:{...paid.data,id:'pay_TestB'}}).transactionId));
  check('replay keeps identical transaction id', () => assert.equal(parse(paid).transactionId,parse(JSON.parse(JSON.stringify(paid))).transactionId));
  for (const subtotal of [undefined,null,'29',NaN,Infinity,-29]) {
    check('reject invalid subtotal '+String(subtotal), () => assert.equal(parse({...paid,data:{...paid.data,subtotal}}).skip,'invalid_subtotal'));
  }
  for (const currency of [null,'','US','dollars']) {
    check('reject invalid currency '+String(currency), () => assert.equal(parse({...paid,data:{...paid.data,currency}}).skip,'invalid_currency'));
  }
  check('unknown API version has no guessed units', () => assert.equal(parse({...paid,api_version:'v2'}).skip,'unsupported_payment_schema'));
  check('missing payment ID has no random fallback', () => assert.equal(parse({...paid,data:{...paid.data,id:'mem_member'}}).skip,'missing_payment_id'));
  check('open payment cannot count as paid', () => assert.equal(parse({...paid,data:{...paid.data,status:'open'}}).skip,'payment_not_paid'));
  console.log(`${checks} revenue checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1});
