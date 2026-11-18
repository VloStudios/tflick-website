// Cloudflare Worker: tiny proxy that adds the secret API key server-side.
// The key lives only in the Worker secret TEAM_API_KEY, never in the website or this repo.
const ROUTES = { "/team": "/api/team", "/youtubers": "/api/youtubers" };

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : (allowed[0] || ""),
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "GET" } });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

    const path = ROUTES[new URL(request.url).pathname];
    if (!path) return new Response("Not found", { status: 404, headers: cors });
    if (!env.TEAM_API_KEY) return new Response("Proxy not configured", { status: 500, headers: cors });

    const upstream = await fetch(env.UPSTREAM_BASE + path, {
      headers: { "x-api-key": env.TEAM_API_KEY },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    const headers = new Headers(cors);
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
    headers.set("Cache-Control", "public, max-age=60");
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
