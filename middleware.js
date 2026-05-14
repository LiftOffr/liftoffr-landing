// Vercel Edge Middleware — gates /dashboard behind HTTP Basic Auth.
// Set DASHBOARD_PASSWORD env var in Vercel project settings.
// Username can be anything; only the password is checked.

export const config = {
  matcher: ["/dashboard/:path*"],
};

export default function middleware(request) {
  const password = process.env.DASHBOARD_PASSWORD;

  if (!password) {
    return new Response("Dashboard not configured. Set DASHBOARD_PASSWORD env var.", {
      status: 503,
    });
  }

  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(":");
      const pass = idx >= 0 ? decoded.slice(idx + 1) : "";
      if (pass === password) {
        return; // allow through
      }
    } catch (_) {
      // fall through to 401
    }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="LiftOffr Dashboard"',
      "Content-Type": "text/plain",
    },
  });
}
