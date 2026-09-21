/* Render current readings with the date belonging to each component. */
(function () {
  var nodes = document.querySelectorAll('[data-live-key]');
  if (!nodes.length) return;
  function date(value) {
    if (value === null || value === undefined || value === '') return null;
    var parsed = new Date(typeof value === 'number' ? value * 1000 : value);
    return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}) : null;
  }
  function unavailable() {
    nodes.forEach(function (el) { el.textContent = 'Unavailable'; el.classList.add('is-unavailable'); });
    document.querySelectorAll('[data-live-asof]').forEach(function (el) { el.textContent = 'Live data unavailable'; });
    document.querySelectorAll('[data-live-status]').forEach(function (el) { el.textContent = 'Could not verify a current reading. Historical tables below are dated examples.'; });
  }
  fetch('/api/cycle-score').then(function (r) {
    if (!r.ok) throw new Error('Reading unavailable');
    return r.json();
  }).then(function (data) {
    var components = data.components || {};
    nodes.forEach(function (el) {
      var key = el.getAttribute('data-live-key');
      var reading = key === 'score' ? {value:data.score,asOf:data.asOf} : components[key];
      var day = reading && date(reading.asOf);
      var valid = reading && typeof reading.value === 'number' && Number.isFinite(reading.value) && day;
      el.textContent = valid ? reading.value.toFixed(key === 'score' ? 1 : 0) : 'Unavailable';
      el.classList.remove('cold','mid','hot','is-unavailable');
      if (!valid) el.classList.add('is-unavailable');
      if (valid) el.classList.add(reading.value >= 70 ? 'hot' : reading.value <= 35 ? 'cold' : 'mid');
      el.setAttribute('title', valid ? 'Data as of ' + day : 'No component reading in the current response');
    });
    var main = document.querySelector('.reading [data-live-key]');
    var key = main && main.getAttribute('data-live-key');
    var reading = key === 'score' ? {value:data.score,asOf:data.asOf} : components[key];
    var day = reading && typeof reading.value === 'number' && Number.isFinite(reading.value) && date(reading.asOf);
    document.querySelectorAll('[data-live-asof]').forEach(function (el) { el.textContent = day || 'No current component reading'; });
    document.querySelectorAll('[data-live-status]').forEach(function (el) {
      el.textContent = day ? 'Source data: ' + day + '. Normalized reading, not a price forecast.' : 'This component is unavailable in the current response. It is excluded from the Score rather than counted as zero.';
    });
    var px = components._btc_price;
    document.querySelectorAll('[data-live-px]').forEach(function (el) {
      el.textContent = px && typeof px.value === 'number' && Number.isFinite(px.value) ? '$' + px.value.toLocaleString('en-US') + ' (data ' + (date(px.asOf) || 'date unavailable') + ')' : 'Unavailable';
    });
  }).catch(unavailable);
})();
