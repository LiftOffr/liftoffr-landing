// Shared, fail-closed audience reads. Complete pagination before any sends.
export const QUIZ_SEGMENTS = ['ROUNDTRIPPED','ACCUMULATING','SITTING','NEW'];
export function quizBuckets(env) {
  const segmented=QUIZ_SEGMENTS.map(seg=>({seg,aud:env[`RESEND_QUIZ_AUDIENCE_${seg}`]})).filter(x=>x.aud);
  return segmented.length ? segmented : env.RESEND_QUIZ_AUDIENCE_ID ? [{seg:null,aud:env.RESEND_QUIZ_AUDIENCE_ID}] : [];
}
export const emailKey = c => String(c.email || '').trim().toLowerCase();
// Space Resend calls and retry rate limits only; never retry uncertain sends.
let nextRequestAt = 0;
export async function resendRequest(url, options = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const slot = Math.max(Date.now(), nextRequestAt);
    nextRequestAt = slot + 600;
    if (slot > Date.now()) await new Promise(resolve => setTimeout(resolve, slot - Date.now()));
    const response = await fetch(url, {...options, signal: options.signal || AbortSignal.timeout(15000)});
    if (response.status !== 429 || attempt === 2) return response;
    await new Promise(resolve => setTimeout(resolve, 1200 * (attempt + 1)));
  }
}
export async function enrollAudience(audience, email, key, request = resendRequest) {
  const base = `https://api.resend.com/audiences/${audience}/contacts`;
  const headers = {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'};
  const response = await request(base, {method:'POST', headers, body:JSON.stringify({email, unsubscribed:false})});
  if (response.ok) return;
  if (response.status === 409 || response.status === 422) {
    const existing = await request(`${base}/${encodeURIComponent(email)}`, {headers});
    if (existing.ok) {
      const contact = await existing.json();
      if (!contact.unsubscribed) return;
    }
  }
  throw new Error(`Audience enrollment failed (${response.status})`);
}
export async function listAudienceContacts(audience,key,request=resendRequest) {
  if (!audience || !key) throw new Error('Audience configuration missing');
  const result=[], seen=new Set();let after;
  for(let page=0;page<100;page++) {
    const url=new URL(`https://api.resend.com/audiences/${audience}/contacts`);
    if(after)url.searchParams.set('after',after);
    const r=await request(url.toString(),{headers:{Authorization:`Bearer ${key}`,Accept:'application/json'}});
    if(!r.ok)throw new Error(`Audience read failed (${r.status})`);
    const data=await r.json();
    if(!Array.isArray(data.data))throw new Error('Invalid audience response');
    result.push(...data.data);
    if(!data.has_more)return result;
    after=data.data.at(-1)?.id;
    if(!after||seen.has(after))throw new Error('Invalid audience pagination');
    seen.add(after);
  }
  throw new Error('Audience pagination limit reached');
}
export function quizEligible(c,env,buyerEmails=new Set()) {
  const created=Date.parse(c.created_at),cutover=Date.parse(env.QUIZ_SEQUENCE_START_AT||'');
  return Boolean(emailKey(c)&&!c.unsubscribed&&!buyerEmails.has(emailKey(c))&&
    env.LIFTOFFR_MAILING_ADDRESS?.trim()&&Number.isFinite(cutover)&&Number.isFinite(created)&&created>=cutover);
}
