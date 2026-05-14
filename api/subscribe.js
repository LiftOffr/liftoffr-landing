// Vercel serverless function: subscribe an email to Beehiiv directly.
//
// Replaces the prior window.open() redirect to liftoffr.beehiiv.com/subscribe,
// which lost most users (especially in the Instagram in-app browser) because
// they had to manually click "Subscribe" again on Beehiiv's site to actually
// complete the signup.
//
// Env required (set in Vercel project settings):
//   BEEHIIV_API_KEY        – Beehiiv API key (Settings → Workspace → API)
//   BEEHIIV_PUBLICATION_ID – publication id, e.g. pub_xxxxxxxx
//
// Vercel auto-routes this file to /api/subscribe (Node serverless).

export const config = { runtime: "nodejs" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !pubId) {
    console.error("subscribe: missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const body = await readJsonBody(req);
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const payload = {
    email,
    reactivate_existing: true,
    send_welcome_email: true,
    utm_source: (body.utm_source || "liftoffr").slice(0, 100),
    utm_medium: (body.utm_medium || "site").slice(0, 100),
    utm_campaign: (body.utm_campaign || "checklist").slice(0, 100),
    utm_content: (body.utm_content || "").slice(0, 100),
    referring_site: "liftoffr.com",
  };

  try {
    const beehiivRes = await fetch(
      `https://api.beehiiv.com/v2/publications/${encodeURIComponent(pubId)}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await beehiivRes.json().catch(() => ({}));

    if (!beehiivRes.ok) {
      console.error("subscribe: beehiiv api error", beehiivRes.status, data);
      return res.status(502).json({ error: "Subscription failed" });
    }

    return res.status(200).json({ ok: true, id: data?.data?.id || null });
  } catch (err) {
    console.error("subscribe: handler exception", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
