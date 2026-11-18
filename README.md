# TeamFlick website

Static site (no build, no server). Hosted free on GitHub Pages.

Edit these files to change content:

- `data/site.json` – IP, supported versions (`versions.min` / `versions.max`), about text, rules, Discord & other links
- `data/team.json` – rank order/colors and members (`{"name": "...", "rank": "Admin"}`)
- `data/youtubers.json` – YouTubers and channel links

Preview locally: `python3 -m http.server` then open http://localhost:8000

## Live staff / YouTuber data (API)

A GitHub Action (`.github/workflows/sync-api.yml`) runs every 15 minutes, fetches `/api/team` and
`/api/youtubers` using the repo secret `TEAM_API_KEY`, and saves them as `data/api-team.json` and
`data/api-youtubers.json`. The website reads those files, so the key never reaches the browser.
If a file is missing or the API is down, the pages fall back to `data/team.json` / `data/youtubers.json`.

Setup: repo **Settings → Secrets and variables → Actions → New repository secret**, name `TEAM_API_KEY`.
Run it by hand from the **Actions** tab (**Sync team & YouTubers from API → Run workflow**).
(`worker/` is an alternative: a Cloudflare proxy, used only if `api.proxy` is set in `data/site.json`.)
