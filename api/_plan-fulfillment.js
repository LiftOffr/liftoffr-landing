import { ensurePlanCredit, verifyPlanPayment } from './_plan-credit.js';

// Transactional access delivery. No nurture pitch or new offer is added here.
// Both recipient and credit eligibility come from Whop, not the caller's email.
export function planAccessEmail() {
  const text = [
    'Your Plan is ready.', '',
    '1. Open My Bear Market Buy Plan in Whop: https://whop.com/liftoffr/content-JnPHMvgbjjhcD9/app/ . Sign in to the account used at checkout. The document is available there without joining Discord.', '',
    '2. Open your Plan Discord connection in Whop: https://whop.com/liftoffr/exp_vmJ3ZoiPDUZLNO/app/ . Connect Discord there to receive the Plan role and see #plan-updates. Access help: https://liftoffr.com/welcome-plan', '',
    '3. Start with the reasoning behind one level and the fallback rule. Use the worksheet to note what you understand and what you want to check. You do not need to place a trade to use the material.', '',
    'Need the document, Discord access or a refund within 30 days? Reply to this email and include your Whop order ID. Never send a seed phrase or wallet recovery words.', '',
    'Torin', 'LiftOffr',
  ].join('\n');
  return { subject:'Your LiftOffr Plan is ready', text, html: emailHTML(text) };
}

function emailHTML(text) {
  const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let body = text.split('\n\n').map(p=>'<p>'+escape(p).replace(/\n/g,'<br>')+'</p>').join('');
  for (const [url,label] of [
    ['https://whop.com/liftoffr/content-JnPHMvgbjjhcD9/app/','Open your Plan in Whop'],
    ['https://liftoffr.com/welcome-plan','Document and Discord access instructions'],
    ['https://whop.com/liftoffr/exp_vmJ3ZoiPDUZLNO/app/','Connect Discord for Plan access'],
    ['https://whop.com/checkout/plan_WHByzwILskLsc','Use your included credit at System checkout'],
  ]) body=body.replaceAll(url,`<a href="${url}" style="color:#bf2938;">${label}</a>`);
  return '<div style="max-width:620px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.7;color:#222;padding:24px;">'+body+'</div>';
}

export function planCreditEmail(credit) {
  if (credit.status !== 'ready' || !/^LPC[A-F0-9]{24}$/.test(credit.code || '')) throw new Error('Invalid private credit');
  const text = ['Your included Plan upgrade credit','',
    'Your Plan purchase includes a $29 credit toward The Cycle System. Keep this private code:',credit.code,'',
    'If you choose The Cycle System later, enter the code in the promo-code field at checkout for $29 off its standard price, before fees and applicable tax. It can be used once. Nothing starts or renews automatically.','',
    'System checkout: https://whop.com/checkout/plan_WHByzwILskLsc','',
    'This is the credit included with your purchase. Your Plan document and access instructions are in the separate access email.','',
    'Reply if you need help with the code.','', 'Torin','LiftOffr'].join('\n');
  return {subject:'Your included $29 Plan credit',text,html:emailHTML(text)};
}

async function sendTransactional(email, message, paymentId, step, request) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY required for Plan access delivery');
  const response = await request('https://api.resend.com/emails', {
    method:'POST', signal:AbortSignal.timeout(10000),
    headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json',
      'Idempotency-Key':`plan-${step}-v1-${paymentId}`},
    body:JSON.stringify({from:'Torin from LiftOffr <torin@liftoffr.com>',
      reply_to:'contact.liftoffr@gmail.com',to:[email],...message,
      tags:[{name:'campaign',value:'plan_access'},{name:'step',value:step}]}),
  });
  if (!response.ok) throw new Error(`Plan access delivery failed (${response.status})`);
  const sent = await response.json();
  if (!sent.id) throw new Error('Plan access delivery returned no message ID');
  // Never log the code or customer email in normal webhook diagnostics.
  return {status:'sent',emailId:sent.id};
}

export async function fulfillPlanPayment(paymentId, request = fetch) {
  const buyer = await verifyPlanPayment({paymentId}, request);
  if (buyer.status !== 'verified') return {status:buyer.status};
  // Access never waits for a coupon lookup, key or creation request. A coupon
  // failure remains retryable after the access email has safely been sent.
  await sendTransactional(buyer.email, planAccessEmail(), paymentId, 'access', request);
  const credit = await ensurePlanCredit({paymentId}, request);
  if (credit.status !== 'ready') return {status:'access_sent',credit:credit.status};
  await sendTransactional(credit.email, planCreditEmail(credit), paymentId, 'credit', request);
  return {status:'access_and_credit_sent'};
}
