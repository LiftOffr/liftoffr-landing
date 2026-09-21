/* Explicit operator test marker. Consent settings are unchanged. */
(function () {
  var on=false;
  try {
    var value=new URLSearchParams(location.search).get('qa');
    if(value==='1')sessionStorage.setItem('liftoffr_qa','1');
    if(value==='0')sessionStorage.removeItem('liftoffr_qa');
    on=sessionStorage.getItem('liftoffr_qa')==='1';
  } catch (_) { on=new URLSearchParams(location.search).get('qa')==='1'; }
  if(!on)return;
  window.dataLayer=window.dataLayer||[];
  function mark(){window.dataLayer.push(arguments);}
  mark('set',{qa_mode:'operator_test'});
})();
