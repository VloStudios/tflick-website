# TeamFlick API proxy

The website is static, so it can't hold a secret. This tiny Cloudflare Worker adds the
`x-api-key` header server-side. The key is stored only as the Worker secret `TEAM_API_KEY`.

## Deploy (free Cloudflare account)

```bash
cd worker
npx wrangler login
npx wrangler secret put TEAM_API_KEY     # paste the key when prompted
npx wrangler deploy
```

Edit `ALLOWED_ORIGINS` in `wrangler.toml` to include your real site domain(s) first.
Wrangler prints the Worker URL (e.g. `https://teamflick-api.<you>.workers.dev`).
Put it in `data/site.json` → `api.proxy`. Until that is set, the site uses `data/team.json` and `data/youtubers.json`.

Endpoints: `GET /team`, `GET /youtubers`.
Never commit the key. `.dev.vars` is git-ignored for local testing.
