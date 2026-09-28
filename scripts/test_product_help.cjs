const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/product-help.js','utf8');
const events=[],handlers={},videoHandlers={};
const video={addEventListener:(name,fn,options)=>videoHandlers[name]={fn,options}};
const context={window:{track:(name,props)=>events.push({name,props})},document:{addEventListener:(name,fn)=>{assert.ok(!handlers[name],'duplicate click handler');handlers[name]=fn},querySelector:()=>video},location:{pathname:'/plan'}};
vm.runInNewContext(source,context);vm.runInNewContext(source,context);
function click(kind,item){handlers.click({target:{closest:()=>({getAttribute:key=>({'data-product-help':kind,'data-item-id':item}[key])})}});}
click('question','bear-market-buy-plan');click('access','bear-market-buy-plan');click('question','cycle-system');
assert.equal(events.length,3);assert.equal(events[0].name,'product_help_clicked');
click('email@example.test','bear-market-buy-plan');click('question','unknown');assert.equal(events.length,3);
assert.ok(!JSON.stringify(events).includes('@'));assert.ok(!events.some(e=>['purchase','begin_checkout'].includes(e.name)));
videoHandlers.play.fn();assert.equal(events[3].name,'plan_demo_started');assert.equal(videoHandlers.play.options.once,true);
context.window.track=undefined;click('question','cycle-system');assert.equal(events.length,4);
console.log('PRODUCT HELP: PASS — allowlist, privacy, no purchase events, idempotency, once-only demo and missing analytics');
