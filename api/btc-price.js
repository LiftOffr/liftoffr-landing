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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = new URL(req.url, "http://localhost");
  const idsParam = url.searchParams.get("ids");

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
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      return res.status(200).json({
        usd: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change ?? null,
        ts: new Date().toISOString(),
      });
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
