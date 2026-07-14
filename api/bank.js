// Plaid bank-link endpoint (consolidated: link_token / exchange / balances).
// Single-user personal dashboard. client_id + secret live server-side only
// (Vercel env). The access_token returned to the browser is inert without the
// secret, so storing it client-side (localStorage) is acceptable here.
//
// Env: PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV (sandbox|production),
//      optional PLAID_REDIRECT_URI (required for OAuth banks like USAA in prod).

const HOSTS = {
  sandbox: "https://sandbox.plaid.com",
  production: "https://production.plaid.com",
};

async function plaid(path, body) {
  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  const base = HOSTS[env] || HOSTS.sandbox;
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      ...body,
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    const err = new Error(data.error_message || "plaid error");
    err.plaid = data;
    err.status = r.status;
    throw err;
  }
  return data;
}

function normalize(accounts = []) {
  const assets = [];
  const debts = [];
  for (const a of accounts) {
    const b = a.balances || {};
    const name = a.official_name || a.name || a.subtype || a.type;
    if (a.type === "credit" || a.type === "loan") {
      const owed = b.current != null ? Math.abs(b.current) : 0;
      debts.push({ name, balance: owed, subtype: a.subtype, type: a.type });
    } else {
      const val = b.current != null ? b.current : (b.available != null ? b.available : 0);
      assets.push({ name, value: Math.abs(val), subtype: a.subtype, type: a.type });
    }
  }
  return { assets, debts };
}

export default async function handler(req, res) {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return res.status(500).json({ error: "Plaid not configured" });
  }
  const url = new URL(req.url, "http://x");
  const action = url.searchParams.get("action") || (req.body && req.body.action);

  try {
    if (action === "link_token") {
      const body = {
        user: { client_user_id: "liftoffr-owner" },
        client_name: "LiftOffr Dashboard",
        products: ["transactions", "liabilities"],
        country_codes: ["US"],
        language: "en",
      };
      if (process.env.PLAID_REDIRECT_URI) body.redirect_uri = process.env.PLAID_REDIRECT_URI;
      const d = await plaid("/link/token/create", body);
      return res.status(200).json({ link_token: d.link_token, expiration: d.expiration });
    }

    if (action === "exchange") {
      const public_token = req.body && req.body.public_token;
      if (!public_token) return res.status(400).json({ error: "missing public_token" });
      const d = await plaid("/item/public_token/exchange", { public_token });
      return res.status(200).json({ access_token: d.access_token, item_id: d.item_id });
    }

    if (action === "balances") {
      const access_token = (req.body && req.body.access_token) || url.searchParams.get("access_token");
      if (!access_token) return res.status(400).json({ error: "not linked" });
      const d = await plaid("/accounts/balance/get", { access_token });
      const norm = normalize(d.accounts);
      return res.status(200).json({
        ...norm,
        institution: d.item && d.item.institution_id,
        asOf: new Date().toISOString(),
      });
    }

    if (action === "transactions") {
      const access_token = (req.body && req.body.access_token) || url.searchParams.get("access_token");
      if (!access_token) return res.status(400).json({ error: "not linked" });
      const days = parseInt((req.body && req.body.days) || url.searchParams.get("days") || "180", 10);
      const end = new Date();
      const start = new Date(end.getTime() - days * 864e5);
      const fmt = (d) => d.toISOString().slice(0, 10);
      let offset = 0, all = [], total = Infinity;
      while (offset < total) {
        const d = await plaid("/transactions/get", {
          access_token,
          start_date: fmt(start),
          end_date: fmt(end),
          options: { count: 500, offset },
        });
        const batch = d.transactions || [];
        all = all.concat(batch);
        total = d.total_transactions || all.length;
        offset += batch.length;
        if (!batch.length) break;
      }
      const norm = all.map((t) => ({
        date: t.date,
        name: t.merchant_name || t.name,
        amount: t.amount, // Plaid: positive = money out, negative = money in
        pending: !!t.pending,
        category: (t.personal_finance_category && t.personal_finance_category.primary)
          || (Array.isArray(t.category) && t.category[t.category.length - 1])
          || "OTHER",
      }));
      return res.status(200).json({ transactions: norm, asOf: new Date().toISOString() });
    }

    return res.status(400).json({ error: "unknown action" });
  } catch (e) {
    return res.status(e.status || 502).json({ error: e.message, plaid: e.plaid || null });
  }
}
