// Vercel Edge Middleware.
//  1. Redirects www.liftoffr.com → liftoffr.com  (except /sitemap.xml + /robots.txt,
//     which still serve on www so any bot that reaches the www host can fetch them
//     without a hop. NOTE: the Search Console property was moved to the bare domain
//     on 2026-08-13 — the old www property had 14 URLs submitted and 0 indexed
//     precisely because everything here 308s to the apex. The exemption is now
//     belt-and-braces rather than load-bearing.)
//  2. Gates /dashboard, JARVIS, and analytics APIs behind HTTP Basic Auth (DASHBOARD_PASSWORD).

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/jarvis",
    "/api/coinbase-sync",
    "/api/coinbase-balance",
    "/api/analytics",
    // Also catch ALL paths on the www host for the redirect — but we'll bail early
    // for non-www requests inside the function so we don't burn matcher slots.
    "/((?!_next|_vercel).*)",
  ],
};

const SITEMAP_EXEMPT = new Set(["/sitemap.xml", "/robots.txt"]);

export default function middleware(request) {
  const url = new URL(request.url);

  // === Part 1: www → bare redirect ===
  if (url.hostname === "www.liftoffr.com" && !SITEMAP_EXEMPT.has(url.pathname)) {
    const dest = new URL(request.url);
    dest.hostname = "liftoffr.com";
    return Response.redirect(dest.toString(), 308);
  }

  // === Part 2: auth gate for dashboard + analytics APIs ===
  const needsAuth = (
    url.pathname.startsWith("/dashboard") ||
    url.pathname === "/api/jarvis" ||
    url.pathname === "/api/coinbase-sync" ||
    url.pathname === "/api/coinbase-balance" ||
    url.pathname === "/api/analytics"
  );
  if (!needsAuth) return;

  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    return new Response("Dashboard not configured. Set DASHBOARD_PASSWORD env var.", { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      const pass = idx >= 0 ? decoded.slice(idx + 1) : "";
      if (pass === password) return; // allow through
    } catch (_) { /* fall through */ }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="LiftOffr Dashboard"',
      "Content-Type": "text/plain",
    },
  });
}
