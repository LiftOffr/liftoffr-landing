// Coinbase balance — returns live BTC balance from Coinbase Advanced Trade.
//
// Uses the same CDP/Ed25519 JWT auth as /api/coinbase-sync.
// Env required: COINBASE_API_KEY_ID, COINBASE_API_SECRET
//
// Response shape:
//   200 { btc: <number>, btcAvailable: <number>, btcHold: <number>, allBalances: [...] }
//   401 if keys missing, 502 on upstream error

import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const HOST = "api.coinbase.com";

function makeJWT(method, path, keyId, secretB64) {
  const secretBytes = Buffer.from(secretB64, "base64");
  if (secretBytes.length < 32) {
    throw new Error("COINBASE_API_SECRET too short");
  }
  const seed = secretBytes.subarray(0, 32);
  const pkcs8 = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    seed,
  ]);
  const privateKey = crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });

  const header = {
    alg: "EdDSA", kid: keyId, typ: "JWT",
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: keyId, iss: "cdp",
    nbf: now, exp: now + 120,
    uri: `${method} ${HOST}${path}`,
  };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const signature = crypto.sign(null, Buffer.from(signingInput), privateKey);
  return `${signingInput}.${signature.toString("base64url")}`;
}

async function cb(path, keyId, secret) {
  const pathOnly = path.split("?")[0];
  const jwt = makeJWT("GET", pathOnly, keyId, secret);
  const r = await fetch(`https://${HOST}${path}`, {
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(`Coinbase ${r.status}: ${JSON.stringify(data.error || data.message || data)}`);
    err.status = r.status; err.body = data;
    throw err;
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keyId = process.env.COINBASE_API_KEY_ID;
  const secret = process.env.COINBASE_API_SECRET;
  if (!keyId || !secret) {
    return res.status(401).json({ error: "Coinbase keys not configured" });
  }

  try {
    // page through accounts (typical users have <10)
    const accounts = [];
    let cursor = "";
    for (let i = 0; i < 10; i++) {
      const qs = `limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const data = await cb(`/api/v3/brokerage/accounts?${qs}`, keyId, secret);
      const page = data.accounts || [];
      accounts.push(...page);
      cursor = data.cursor || "";
      if (!cursor) break;
    }

    const all = accounts
      .filter((a) => a && a.currency)
      .map((a) => ({
        currency: a.currency,
        name: a.name || a.currency,
        available: parseFloat((a.available_balance && a.available_balance.value) || "0"),
        hold: parseFloat((a.hold && a.hold.value) || "0"),
        active: !!a.active,
      }));

    const btcRows = all.filter((a) => a.currency === "BTC");
    const btcAvailable = btcRows.reduce((s, a) => s + a.available, 0);
    const btcHold = btcRows.reduce((s, a) => s + a.hold, 0);

    const nonZero = all.filter((a) => a.available > 0 || a.hold > 0);

    res.setHeader("Cache-Control", "private, max-age=30");
    return res.status(200).json({
      btc: btcAvailable + btcHold,
      btcAvailable,
      btcHold,
      allBalances: nonZero,
    });
  } catch (err) {
    console.error("coinbase-balance error", err.status, err.message, err.body);
    return res.status(err.status || 502).json({
      error: err.message || "Upstream error",
      detail: err.body || null,
    });
  }
}
