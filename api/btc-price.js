// Price feed proxy. Default returns BTC (backwards compat with old callers).
// Pass ?ids=BTC,ETH,LINK,ADA for multi-coin lookup. Stablecoins hard-coded to $1.
// Cached at edge for 60s.
//
// Response shape:
//   Default (BTC only): { usd: <number>, change24h: <number>, ts: <iso> }
//   With ?ids=: { prices: { BTC: {usd, change24h}, ETH: {...}, ... }, ts: <iso> }

export const config = { runtime: "nodejs" };

// Map Coinbase tickers to CoinGecko IDs. Null = stablecoin, treat as $1.
const TICKER_TO_GECKO = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  LINK: "chainlink",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  DOT: "polkadot",
  ATOM: "cosmos",
  SHIB: "shiba-inu",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  NEAR: "near",
  ALGO: "algorand",
  XLM: "stellar",
  FIL: "filecoin",
  ICP: "internet-computer",
  HBAR: "hedera-hashgraph",
  TON: "the-open-network",
  INJ: "injective-protocol",
  RNDR: "render-token",
  FET: "fetch-ai",
  TIA: "celestia",
  SUI: "sui",
  APT: "aptos",
  // Stablecoins → $1
  USD: null, USDC: null, USDT: null, DAI: null, PYUSD: null, GUSD: null, BUSD: null,
};

// 200-week MA = average of last 1400 daily closes.
// Source: CryptoCompare histoday (free, no auth, 1400-day limit works).
// CoinGecko free is capped at 365d; Binance is geo-blocked from Vercel US.
async function fetch200WeekMA() {
  const r = await fetch(
    "https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=1400&aggregate=1",
    { headers: { Accept: "application/json" } }
  );
  if (!r.ok) throw new Error(`cryptocompare ma200w ${r.status}`);
  const data = await r.json();
  if (data.Response !== "Success") throw new Error(`cryptocompare: ${data.Message || "bad response"}`);
  const closes = (data.Data?.Data || [])
    .map((c) => c.close)
    .filter((v) => Number.isFinite(v) && v > 0);
  if (closes.length < 1000) throw new Error(`only ${closes.length} daily closes`);
  const window = closes.slice(-1400);
  const value = window.reduce((s, v) => s + v, 0) / window.length;
  return { value, weeksUsed: Math.floor(window.length / 7) };
}

// Parses Cowen's YouTube transcript knowledge base to produce aggregated
// downside price targets. Mirror updated locally via youtube_intel.py;
// for now the dashboard reads a snapshot bundled with this function.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let _cowenDataCache = null;
function loadCowenData() {
  if (_cowenDataCache) return _cowenDataCache;
  try {
    const raw = fs.readFileSync(path.join(__dirname, "cowen-data.json"), "utf8");
    _cowenDataCache = JSON.parse(raw);
  } catch (e) {
    console.warn("cowen-data.json missing or bad", e.message);
    _cowenDataCache = [];
  }
  return _cowenDataCache;
}

function parseCowenTargets(currentPrice = 70000) {
  const now = Date.now();
  const cutoff30d = now - 30 * 24 * 3600 * 1000;
  const cowenData = loadCowenData();
  const entries = (cowenData || [])
    .filter((e) => {
      const t = (e.title || "").toLowerCase();
      if (!t.includes("bitcoin") && !t.includes("btc")) return false;
      const pub = e.published ? Date.parse(e.published) : 0;
      return pub >= cutoff30d;
    });

  // Extract all key_levels mentions (filter to BELOW current price as downside targets)
  const mentions = [];
  for (const e of entries) {
    const pub = e.published ? Date.parse(e.published) : 0;
    for (const lvl of (e.key_levels || [])) {
      const v = Number(lvl);
      if (!Number.isFinite(v) || v <= 0) continue;
      if (v >= currentPrice * 1.10) continue; // skip resistance levels
      mentions.push({ price: v, ts: pub, title: e.title, outlook: e.outlook });
    }
  }

  // Cluster into buckets — group within ±$3K of each cluster's centroid
  mentions.sort((a, b) => a.price - b.price);
  const buckets = [];
  for (const m of mentions) {
    let bucket = buckets.find((b) => Math.abs(b.centroid - m.price) <= 3000);
    if (!bucket) {
      bucket = { centroid: m.price, mentions: [], latestTs: 0 };
      buckets.push(bucket);
    }
    bucket.mentions.push(m);
    bucket.centroid = bucket.mentions.reduce((s, x) => s + x.price, 0) / bucket.mentions.length;
    bucket.latestTs = Math.max(bucket.latestTs, m.ts);
  }

  // Sort by mentions DESC, then by latestTs DESC
  buckets.sort((a, b) => b.mentions.length - a.mentions.length || b.latestTs - a.latestTs);

  // Map top 4 to tier slots T2/T3/T4/T5 in DESCENDING price order
  const top = buckets.slice(0, 4).sort((a, b) => b.centroid - a.centroid);
  const tiers = {};
  const slots = ["T2", "T3", "T4", "T5"];
  for (let i = 0; i < top.length && i < slots.length; i++) {
    tiers[slots[i]] = {
      price: Math.round(top[i].centroid / 100) * 100,
      mentions: top[i].mentions.length,
      latestDate: new Date(top[i].latestTs).toISOString().slice(0, 10),
    };
  }
  return {
    tiers,
    sourceEntries: entries.length,
    sourceMentions: mentions.length,
    windowDays: 30,
    asOf: new Date().toISOString().slice(0, 10),
  };
}

// CBBI = ColinTalksCrypto Bitcoin Bull Run Index. 0-1 composite of 11
// on-chain + market indicators. >0.85 = top zone, <0.20 = bottom zone.
// Cached at the source by date so we fetch sparingly.
async function fetchCBBI() {
  const r = await fetch("https://colintalkscrypto.com/cbbi/data/latest.json", {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`cbbi ${r.status}`);
  const data = await r.json();
  const latestOf = (series) => {
    if (!series || typeof series !== "object") return null;
    const items = Object.entries(series).sort((a, b) => Number(b[0]) - Number(a[0]));
    return items.length ? { ts: Number(items[0][0]), value: Number(items[0][1]) } : null;
  };
  const conf = latestOf(data.Confidence);
  if (!conf) throw new Error("no CBBI Confidence series");
  const components = {};
  for (const key of ["PiCycle", "RUPL", "RHODL", "Puell", "2YMA", "Trolololo", "MVRV", "ReserveRisk", "Woobull"]) {
    const v = latestOf(data[key]);
    if (v) components[key] = v.value;
  }
  return { confidence: conf.value, ts: conf.ts, components };
}

// Daily BTC close history for chart rendering — last N days (N <= 730).
// Also returns the rolling 200-week (1400-day) MA series for the same window.
// To compute MA at the OLDEST point of the window we need 1400 days of prior
// history, so we fetch (N + 1400) days total — clamped to CryptoCompare's
// per-call limit (2000 days).
async function fetchBTCHistory(days = 365) {
  const display = Math.min(Math.max(days, 30), 730);
  const total = Math.min(display + 1400, 2000);
  const r = await fetch(
    `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${total}&aggregate=1`,
    { headers: { Accept: "application/json" } }
  );
  if (!r.ok) throw new Error(`cryptocompare history ${r.status}`);
  const data = await r.json();
  if (data.Response !== "Success") throw new Error(`cryptocompare: ${data.Message || "bad response"}`);
  const all = (data.Data?.Data || [])
    .filter((c) => Number.isFinite(c.close) && c.close > 0);

  // Compute rolling 200-week MA at every point. For points with < 1400 prior
  // days of data we just return null — Chart.js handles gaps.
  const closes = all.map((c) => c.close);
  const ma = [];
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= 1400) sum -= closes[i - 1400];
    ma.push(i >= 1399 ? sum / 1400 : null);
  }

  // Slice to the display window
  const startIdx = Math.max(0, all.length - display);
  const history = all.slice(startIdx).map((c, i) => ({
    t: c.time * 1000,
    close: c.close,
    ma200w: ma[startIdx + i],
  }));
  return history;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = new URL(req.url, "http://localhost");
  const idsParam = url.searchParams.get("ids");
  const want200wma = url.searchParams.get("ma200w") === "1";
  const chartDays = parseInt(url.searchParams.get("chart") || "0", 10);

  // Chart history endpoint — return daily closes (no other fields).
  if (chartDays > 0) {
    try {
      const history = await fetchBTCHistory(chartDays);
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
      return res.status(200).json({ history, ts: new Date().toISOString() });
    } catch (err) {
      console.error("chart fetch failed", err);
      return res.status(502).json({ error: "chart upstream", history: [] });
    }
  }

  // Backwards-compat: no ids → just BTC, return legacy single-coin shape
  if (!idsParam) {
    try {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
        { headers: { Accept: "application/json" } }
      );
      const data = await r.json().catch(() => null);
      if (!r.ok || !data || !data.bitcoin) {
        return res.status(502).json({ error: "Upstream error", usd: null, change24h: null });
      }

      const payload = {
        usd: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change ?? null,
        ts: new Date().toISOString(),
      };

      // Optional: also fetch 200-week MA + CBBI Confidence in parallel.
      if (want200wma) {
        const [ma, cbbi] = await Promise.all([
          fetch200WeekMA().catch((e) => { console.error("200wma fetch failed", e); return null; }),
          fetchCBBI().catch((e) => { console.error("cbbi fetch failed", e); return null; }),
        ]);
        if (ma) {
          payload.ma200w = ma.value;
          payload.ma200wWeeks = ma.weeksUsed;
          payload.ma200wDelta = ((payload.usd - ma.value) / ma.value) * 100;
        }
        if (cbbi) {
          payload.cbbi = cbbi.confidence;
          payload.cbbiTs = cbbi.ts;
          payload.cbbiComponents = cbbi.components;
        }
        // Cowen aggregated targets (parsed from bundled knowledge base)
        try {
          payload.cowen = parseCowenTargets(payload.usd || 70000);
        } catch (e) {
          console.error("cowen parse failed", e);
        }
      }

      // Shorter cache when 200WMA included (still 1h — MA moves slowly)
      const maxAge = want200wma ? 3600 : 60;
      res.setHeader("Cache-Control", `public, s-maxage=${maxAge}, stale-while-revalidate=300`);
      return res.status(200).json(payload);
    } catch (err) {
      console.error("price endpoint exception", err);
      return res.status(500).json({ error: "Internal error", usd: null, change24h: null });
    }
  }

  // Multi-coin mode
  const tickers = idsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const prices = {};
  const needed = []; // CoinGecko IDs to fetch
  const reverseMap = {}; // gecko_id → ticker

  for (const t of tickers) {
    if (!(t in TICKER_TO_GECKO)) continue;
    const geckoId = TICKER_TO_GECKO[t];
    if (geckoId === null) {
      prices[t] = { usd: 1.0, change24h: 0 };
    } else {
      needed.push(geckoId);
      reverseMap[geckoId] = t;
    }
  }

  if (needed.length > 0) {
    try {
      const ids = needed.join(",");
      const r = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { headers: { Accept: "application/json" } }
      );
      const data = await r.json().catch(() => null);
      if (r.ok && data) {
        for (const geckoId of needed) {
          const p = data[geckoId];
          if (p && typeof p.usd === "number") {
            prices[reverseMap[geckoId]] = {
              usd: p.usd,
              change24h: typeof p.usd_24h_change === "number" ? p.usd_24h_change : null,
            };
          }
        }
      }
    } catch (err) {
      console.error("multi-coin fetch failed", err);
    }
  }

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json({ prices, ts: new Date().toISOString() });
}
