// Coinbase sync — pulls all BTC trade fills from Coinbase Advanced Trade API
// and returns them as normalized trades for the dashboard.
//
// Uses CDP/Ed25519 JWT authentication (the new Coinbase Developer Platform key
// format with Project ID + API Key ID + base64-encoded private key).
//
// Env required (set in Vercel project settings):
//   COINBASE_API_KEY_ID — UUID of the API key (e.g. 269781d7-...)
//   COINBASE_API_SECRET — base64-encoded Ed25519 private key (88 chars)
//
// Optional:
//   COINBASE_PROJECT_ID — informational only, not used in API calls
//
// Response shape:
//   200 { trades: [...], count: N }
//   401 if env not set, 502 on upstream error

import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const HOST = "api.coinbase.com";

function makeJWT(method, path, keyId, secretB64) {
  // Decode the 64-byte Ed25519 secret (32-byte seed + 32-byte pub key)
  const secretBytes = Buffer.from(secretB64, "base64");
  if (secretBytes.length < 32) {
    throw new Error("COINBASE_API_SECRET is too short — expected base64 of >=32 bytes");
  }
  const seed = secretBytes.subarray(0, 32);

  // Wrap raw Ed25519 seed in PKCS#8 DER so Node's createPrivateKey accepts it.
  // ASN.1 prefix: SEQUENCE(46) { INTEGER(0), SEQUENCE { OID(1.3.101.112) }, OCTET-STRING(34) { OCTET-STRING(32) ... } }
  const pkcs8 = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    seed,
  ]);
  const privateKey = crypto.createPrivateKey({
    key: pkcs8,
    format: "der",
    type: "pkcs8",
  });

  const header = {
    alg: "EdDSA",
    kid: keyId,
    typ: "JWT",
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: keyId,
    iss: "cdp",
    nbf: now,
    exp: now + 120,
    uri: `${method} ${HOST}${path}`,
  };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const signature = crypto.sign(null, Buffer.from(signingInput), privateKey);
  return `${signingInput}.${signature.toString("base64url")}`;
}

async function cb(path, keyId, secret) {
  // JWT uri claim must NOT include query string — Coinbase signs path only
  const pathOnly = path.split("?")[0];
  const jwt = makeJWT("GET", pathOnly, keyId, secret);
  const r = await fetch(`https://${HOST}${path}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/json",
    },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(`Coinbase ${r.status}: ${JSON.stringify(data.error || data.message || data)}`);
    err.status = r.status;
    err.body = data;
    throw err;
  }
  return data;
}

async function fetchFills(keyId, secret) {
  // /api/v3/brokerage/orders/historical/fills — returns all executed fills.
  // Queries BOTH BTC-USD (bank-funded DCA #2 + lump tier buys post-IMMEDIATE)
  // AND BTC-USDC (USDC-wallet DCA #1 + IMMEDIATE/T1-T5 lump tiers from USDC).
  // The Coinbase v3 API supports multiple product_ids params on the same call.
  // Pagination via cursor.
  const fills = [];
  let cursor = "";
  for (let i = 0; i < 40; i++) {
    const qs = `product_ids=BTC-USD&product_ids=BTC-USDC&limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const path = `/api/v3/brokerage/orders/historical/fills?${qs}`;
    const data = await cb(path, keyId, secret);
    const page = data.fills || [];
    if (page.length === 0) break;
    fills.push(...page);
    cursor = data.cursor || "";
    if (!cursor) break;
  }
  return fills;
}

function normalizeFill(f) {
  const btc = parseFloat(f.size);
  const price = parseFloat(f.price);
  if (!isFinite(btc) || btc === 0) return null;
  if (!isFinite(price) || price === 0) return null;
  const fees = parseFloat(f.commission || "0") || 0;
  const usd = btc * price;
  const sideRaw = (f.side || "").toUpperCase();
  return {
    externalId: `coinbase:fill:${f.trade_id || f.entry_id || `${f.order_id}-${f.sequence_timestamp}`}`,
    date: (f.trade_time || "").slice(0, 10),
    source: "coinbase",
    type: sideRaw === "SELL" ? "sell" : "buy",
    usd: Math.round((usd + fees) * 100) / 100,
    btc: Math.round(btc * 1e8) / 1e8,
    price: Math.round(price * 100) / 100,
    notes: f.product_id || "BTC-USD",
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keyId = process.env.COINBASE_API_KEY_ID;
  const secret = process.env.COINBASE_API_SECRET;
  if (!keyId || !secret) {
    return res.status(401).json({
      error: "Coinbase keys not configured. Set COINBASE_API_KEY_ID and COINBASE_API_SECRET in Vercel env.",
    });
  }

  try {
    const fills = await fetchFills(keyId, secret);
    const trades = [];
    const seen = new Set();
    for (const f of fills) {
      const t = normalizeFill(f);
      if (!t || !t.date) continue;
      if (seen.has(t.externalId)) continue;
      seen.add(t.externalId);
      trades.push(t);
    }
    trades.sort((a, b) => b.date.localeCompare(a.date));
    return res.status(200).json({ trades, count: trades.length });
  } catch (err) {
    console.error("coinbase-sync error", err.status, err.message, err.body);
    return res.status(err.status || 502).json({
      error: err.message || "Upstream error",
      detail: err.body || null,
    });
  }
}
