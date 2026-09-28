/* Bounded interaction counts. No messages, email addresses or form values. */
(function () {
  if (window.__loProductHelpStarted) return;
  window.__loProductHelpStarted = true;
  function emit(name, data) {
    if (typeof window.track === 'function') window.track(name, data);
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-product-help]');
    if (!a) return;
    var kind = a.getAttribute('data-product-help');
    var item = a.getAttribute('data-item-id');
    if (['question', 'access'].indexOf(kind) < 0 || ['bear-market-buy-plan', 'cycle-system'].indexOf(item) < 0) return;
    emit('product_help_clicked', {help_type: kind, item_id: item, page: location.pathname});
  });
  var video = document.querySelector('#product-preview video');
  if (video) video.addEventListener('play', function () {
    emit('plan_demo_started', {item_id: 'bear-market-buy-plan', page: location.pathname});
  }, {once: true});
})();
