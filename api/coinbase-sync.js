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
  // /api/v3/brokerage/orders/historical/fills — Advanced Trade fills.
  // BTC-USD (bank-funded buys) + BTC-USDC (USDC-funded buys). v3 supports
  // multiple product_ids on a single call.
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

async function fetchV2BtcTransactions(keyId, secret) {
  // Coinbase Simple buys/sells don't appear in v3 fills. They live in the
  // legacy v2 transactions endpoint, scoped to the BTC account.
  // Step 1: find the BTC account ID.
  const accountsData = await cb("/v2/accounts?limit=250", keyId, secret);
  const accounts = accountsData.data || [];
  const btcAccount = accounts.find((a) => {
    const code = typeof a.currency === "string" ? a.currency : a.currency?.code;
    return code === "BTC";
  });
  if (!btcAccount) return [];

  // Step 2: page through this account's transactions.
  const txs = [];
  let nextUri = `/v2/accounts/${btcAccount.id}/transactions?limit=100`;
  for (let i = 0; i < 30 && nextUri; i++) {
    const data = await cb(nextUri, keyId, secret);
    txs.push(...(data.data || []));
    nextUri = data.pagination?.next_uri || null;
  }
  return txs;
}

function normalizeV2(tx) {
  if (tx.status !== "completed") return null;
  // We only care about cost-basis-affecting trade types.
  // - "buy"  / "sell"  → Simple buys/sells
  // - "trade"          → Convert (e.g. USDC → BTC)
  // - "advanced_trade_fill" → mirror of v3 fills; deduped against v3 below
  const allowed = new Set(["buy", "sell", "trade", "advanced_trade_fill"]);
  if (!allowed.has(tx.type)) return null;

  const rawBtc = parseFloat(tx.amount?.amount || "0");
  const rawUsd = parseFloat(tx.native_amount?.amount || "0");
  const btc = Math.abs(rawBtc);
  const usd = Math.abs(rawUsd);
  if (btc === 0 || usd === 0) return null;

  // For buys, BTC amount is positive (incoming). For sells, negative (outgoing).
  // tx.type is authoritative when present.
  let side = "buy";
  if (tx.type === "sell") side = "sell";
  else if (tx.type === "buy") side = "buy";
  else if (rawBtc < 0) side = "sell";

  return {
    externalId: `coinbase:v2:${tx.id}`,
    date: (tx.created_at || "").slice(0, 10),
    source: "coinbase",
    type: side,
    usd: Math.round(usd * 100) / 100,
    btc: Math.round(btc * 1e8) / 1e8,
    price: Math.round((usd / btc) * 100) / 100,
    notes: tx.type === "advanced_trade_fill" ? "advanced-trade (v2 mirror)" : `simple-${side}`,
    _v2type: tx.type,
  };
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
    // 1. Fetch v3 Advanced Trade fills.
    const fills = await fetchFills(keyId, secret);
    const v3Trades = [];
    const seen = new Set();
    for (const f of fills) {
      const t = normalizeFill(f);
      if (!t || !t.date) continue;
      if (seen.has(t.externalId)) continue;
      seen.add(t.externalId);
      v3Trades.push(t);
    }

    // 2. Fetch v2 BTC account transactions (Simple buys + Convert).
    let v2Trades = [];
    try {
      const v2Tx = await fetchV2BtcTransactions(keyId, secret);
      for (const tx of v2Tx) {
        const t = normalizeV2(tx);
        if (!t || !t.date) continue;
        v2Trades.push(t);
      }
    } catch (e) {
      // Don't fail the whole sync if v2 has an issue — v3 fills still useful.
      console.warn("v2 transactions fetch failed", e.message);
    }

    // 3. Dedupe v2 against v3 — Coinbase mirrors Advanced Trade fills into v2
    //    as type="advanced_trade_fill". Match by (date, btc, side); drop dupes.
    const v3KeySet = new Set(v3Trades.map((t) => `${t.date}|${t.btc.toFixed(8)}|${t.type}`));
    const v2NetNew = v2Trades.filter((t) => {
      const k = `${t.date}|${t.btc.toFixed(8)}|${t.type}`;
      if (v3KeySet.has(k)) return false;
      // Also skip explicit AT mirrors
      if (t._v2type === "advanced_trade_fill") return false;
      return true;
    });

    // 4. Merge + sort.
    const allTrades = [...v3Trades, ...v2NetNew].map((t) => {
      const { _v2type, ...clean } = t;
      return clean;
    });
    allTrades.sort((a, b) => b.date.localeCompare(a.date));

    return res.status(200).json({
      trades: allTrades,
      count: allTrades.length,
      sources: { v3: v3Trades.length, v2_simple: v2NetNew.length },
    });
  } catch (err) {
    console.error("coinbase-sync error", err.status, err.message, err.body);
    return res.status(err.status || 502).json({
      error: err.message || "Upstream error",
      detail: err.body || null,
    });
  }
}
