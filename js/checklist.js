(function () {
  var checks = Array.from(document.querySelectorAll('[data-step]'));
  var completed = false;
  function event(name, data) { if (typeof window.track === 'function') window.track(name, data); }
  checks.forEach(function (box) { box.addEventListener('change', function () {
    var count = checks.filter(function (item) { return item.checked; }).length;
    document.getElementById('progress').value = count;
    document.getElementById('progress-status').textContent = count + ' of 5 checks complete';
    event('checklist_step', {step: box.dataset.step, checked: box.checked, page: '/checklist'});
    if (count === 5 && !completed) { completed = true; event('checklist_complete', {page: '/checklist'}); }
  }); });
})();
