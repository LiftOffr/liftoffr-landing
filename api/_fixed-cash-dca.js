// Prepared fixed cash plan. No credentials, network access or work on import.
// request is injected by the cron; tests supply an entirely in-memory transport.
export const FIXED_CASH_PLAN = Object.freeze({
  id: 'lf-fixed600-v1', start: '2026-09-22', end: '2026-12-14',
  dailyCash: 600, slots: 3, slotCash: 200, maxScheduledCash: 50400,
  manualReserve: 21610.11, manualLevels: [75000, 70000, 66000],
});

export function fixedCashSchedule(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) ||
      new Date(day).toISOString().slice(0, 10) !== day) throw new Error('Invalid DCA date');
  const p = FIXED_CASH_PLAN;
  if (day < p.start || day > p.end) return [];
  return Array.from({ length: p.slots }, (_, i) => ({
    client_order_id: `${p.id}-${day}-${i}`, cashBudget: p.slotCash,
  }));
}

export function previewCash(preview, quote) {
  if (!Array.isArray(preview.errs) || preview.errs.length || !preview.preview_id)
    throw new Error('DCA preview missing or rejected');
  for (const key of ['order_total', 'commission_total']) {
    if (preview[key] === '' || preview[key] == null || !Number.isFinite(Number(preview[key])) || Number(preview[key]) < 0)
      throw new Error('DCA preview has invalid money fields');
  }
  // Conservative whether order_total includes commission or not: reserve both
  // quote + commission and the returned total. Do not assume quote excludes fees.
  return Math.ceil((Math.max(Number(preview.order_total), quote + Number(preview.commission_total)) - 1e-9) * 100) / 100;
}

export async function runFixedCashDca({ day, request, live = false }) {
  const slots = fixedCashSchedule(day);
  const result = { mode: 'fixed-cash', date: day, intendedUsdc: slots.length ? 600 : 0,
    quoteSize: 0, ok: true, results: [], notify: false };
  if (!slots.length) return { ...result, reason: 'outside-fixed-window' };
  if (!live) return { ...result, reason: 'preview-only-not-activated', slots };
  try {
    const end = new Date(Date.parse(day) + 86400000).toISOString();
    const query = new URLSearchParams({ start_date: `${day}T00:00:00Z`, end_date: end, limit: '100' });
    const history = await request('GET', `/api/v3/brokerage/orders/historical/batch?${query}`);
    if (!Array.isArray(history.orders) || history.has_next !== false)
      throw new Error('DCA order history incomplete; stop for reconciliation');
    const expected = new Set(slots.map(s => s.client_order_id));
    if (history.orders.some(o => String(o.client_order_id || '').startsWith('liftoffr-dca-')))
      throw new Error('Legacy DCA order already exists today; do not overlap plans');
    if (history.orders.some(o => String(o.client_order_id || '').startsWith(FIXED_CASH_PLAN.id) && !expected.has(o.client_order_id)))
      throw new Error('Unexpected fixed-plan order; reconcile before continuing');
    const seen = new Set(history.orders.map(o => o.client_order_id));
    for (const slot of slots) {
      // Any status consumes the slot. Canceled, rejected and partial orders do
      // not produce replacement IDs or catch-up purchases.
      if (seen.has(slot.client_order_id)) { result.results.push({ slot: slot.client_order_id, skipped: true }); continue; }
      let quote = slot.cashBudget, body, preview;
      for (let attempt = 0; attempt < 4; attempt++) {
        body = { product_id: 'BTC-USDC', side: 'BUY', order_configuration: {
          market_market_ioc: { quote_size: quote.toFixed(2) },
        }};
        preview = await request('POST', '/api/v3/brokerage/orders/preview', body);
        const cash = previewCash(preview, quote);
        if (cash <= slot.cashBudget) break;
        quote = Math.floor((quote - (cash - slot.cashBudget) - 0.01) * 100 + 1e-7) / 100;
        if (quote <= 0 || attempt === 3) throw new Error('Cannot fit preview into cash budget');
      }
      const created = await request('POST', '/api/v3/brokerage/orders', {
        ...body, client_order_id: slot.client_order_id, preview_id: preview.preview_id,
      });
      if (created.success !== true || !created.success_response?.order_id)
        throw new Error('Order not confirmed; stop for reconciliation');
      result.quoteSize = Math.round((result.quoteSize + quote) * 100) / 100;
      result.results.push({ slot: slot.client_order_id, orderId: created.success_response.order_id,
        quoteSize: quote, previewCash: previewCash(preview, quote), status: 'submitted-not-fill-confirmed' });
    }
    return { ...result, notify: true, reason: 'fixed-cash-submissions-complete' };
  } catch (err) {
    // A timeout can follow acceptance. Never automatically retry here; the
    // next invocation re-reads history and uses the same immutable slot IDs.
    return { ...result, ok: false, fatal: true, notify: true, reason: 'fixed-cash-paused', error: err.message };
  }
}
