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
    const e = new Error(
      "COINBASE_API_SECRET is malformed — expected the base64 Ed25519 private key " +
      `(88 chars, decodes to >=32 bytes); got ${secretBytes.length} bytes.`
    );
    e.status = 401;
    e.code = "COINBASE_SECRET_MALFORMED";
    throw e;
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
    const err = new Error(describeCbError(r.status, data));
    err.status = r.status; err.body = data;
    err.code = r.status === 401 ? "COINBASE_KEY_REJECTED"
      : r.status === 403 ? "COINBASE_KEY_SCOPE"
      : "COINBASE_UPSTREAM";
    throw err;
  }
  return data;
}

// Coinbase returns a bare 401 with an empty body when a CDP key has been
// rotated, revoked, or deleted — which reads as a generic outage unless we
// spell out what actually happened and what fixes it.
function describeCbError(status, data) {
  const upstream = JSON.stringify(data.error || data.message || data);
  if (status === 401) {
    return "Coinbase rejected the API key (401). The CDP key was most likely " +
      "rotated, revoked, or deleted. Fix: create a new read-only CDP key at " +
      "portal.cdp.coinbase.com/access/api, then update COINBASE_API_KEY_ID and " +
      "COINBASE_API_SECRET in Vercel and redeploy. " +
      "Note: this key is read-only and cannot place or cancel orders, so this " +
      "failure does NOT affect your Coinbase recurring buys.";
  }
  if (status === 403) {
    return "Coinbase accepted the key but denied the scope (403). The CDP key " +
      "needs the View + Trade-history permissions. " + upstream;
  }
  if (status === 429) {
    return "Coinbase rate-limited the request (429). Retry in a minute.";
  }
  return `Coinbase ${status}: ${upstream}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keyId = process.env.COINBASE_API_KEY_ID;
  const secret = process.env.COINBASE_API_SECRET;
  if (!keyId || !secret) {
    const missing = [
      !keyId && "COINBASE_API_KEY_ID",
      !secret && "COINBASE_API_SECRET",
    ].filter(Boolean).join(" and ");
    return res.status(401).json({
      error: `Coinbase keys not configured — ${missing} missing from the Vercel environment.`,
      code: "COINBASE_KEY_MISSING",
    });
  }

  try {
    // ?permissions=1 — read-only diagnostic. Answers the question that actually
    // matters when DCA buys stop: does this key still have Trade permission?
    // A key that can read fills but not trade makes the dashboard look healthy
    // while every buy POST fails. Lives here rather than in its own endpoint
    // because the project is at Vercel's 12-function Hobby cap.
    const wantPerms = (req.query?.permissions ??
      new URL(req.url, "http://localhost").searchParams.get("permissions")) === "1";
    if (wantPerms) {
      const p = await cb("/api/v3/brokerage/key_permissions", keyId, secret);
      return res.status(200).json({
        keyId,
        canView: p.can_view === true,
        canTrade: p.can_trade === true,
        canTransfer: p.can_transfer === true,
        portfolioUuid: p.portfolio_uuid,
        portfolioType: p.portfolio_type,
        dcaReady: p.can_trade === true,
        note: p.can_trade === true
          ? "Key can place orders — the daily USDC DCA buy will fire."
          : "Key CANNOT trade. The daily USDC DCA buy will fail until a key with Trade permission is set.",
      });
    }

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
    console.error("coinbase-balance error", err.status, err.code, err.message, err.body);
    return res.status(err.status || 502).json({
      error: err.message || "Upstream error",
      code: err.code || "COINBASE_UPSTREAM",
      detail: err.body || null,
    });
  }
}
