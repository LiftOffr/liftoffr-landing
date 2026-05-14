// Live BTC price proxy. Pulls from CoinGecko free API.
// Cached at edge for 60s so we don't hammer CG.
//
// Response shape:
//   { usd: <number>, change24h: <number>, ts: <iso-string> }

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const data = await r.json().catch(() => null);

    if (!r.ok || !data || !data.bitcoin) {
      console.error("btc-price: coingecko error", r.status, data);
      return res.status(502).json({ error: "Upstream error", usd: null, change24h: null });
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      usd: data.bitcoin.usd,
      change24h: data.bitcoin.usd_24h_change ?? null,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("btc-price: exception", err);
    return res.status(500).json({ error: "Internal error", usd: null, change24h: null });
  }
}
