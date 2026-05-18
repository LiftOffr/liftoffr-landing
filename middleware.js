// Vercel Edge Middleware.
//  1. Redirects www.liftoffr.com → liftoffr.com  (except /sitemap.xml + /robots.txt
//     so Search Console / search bots can fetch them directly on the www property).
//  2. Gates /dashboard and analytics APIs behind HTTP Basic Auth (DASHBOARD_PASSWORD).

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/coinbase-sync",
    "/api/coinbase-balance",
    "/api/analytics-ga4",
    "/api/analytics-clarity",
    "/api/analytics-gsc",
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
    url.pathname === "/api/coinbase-sync" ||
    url.pathname === "/api/coinbase-balance" ||
    url.pathname === "/api/analytics-ga4" ||
    url.pathname === "/api/analytics-clarity" ||
    url.pathname === "/api/analytics-gsc"
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
