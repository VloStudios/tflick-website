# TeamFlick Website

Website for **TeamFlick**, a Minecraft bridging server.

- **Server IP:** `mc.teamflick.tech`
- **Versions:** 1.8.8 – 1.20.6
- **Game modes:** Clutches, Fastbuilder

It's a plain static site (HTML, CSS and JavaScript). There is no build step and no server to run, and it's hosted for free on GitHub Pages.

## Pages

| Page | File | Content comes from |
| --- | --- | --- |
| Home | `index.html` | `data/site.json` |
| News | `news.html` | `data/news.json` |
| Team | `team.html` | `data/team.json` + synced `data/api-team.json` |
| Ranks | `ranks.html` | `data/ranks.json` |
| Rules | `rules.html` | `data/rules.json` |
| FAQ | `faq.html` | `data/faq.json` |
| Apply | `apply.html` | `data/staff.json` |
| YouTube | `youtube.html` | `data/youtubers.json` + synced `data/api-youtubers.json` |
| About & Contact | `about.html` | `data/site.json` |

## Editing the content

Almost everything is edited in the JSON files in `data/`. You never need to touch the HTML.

- **`site.json`**: IP, supported versions (`versions.min` / `versions.max`), tagline, about text, game modes, how-to-join steps and the contact links.
- **`team.json`**: the rank order and colors (highest first) and the fallback member list. Each rank has an `apiKey` that matches the rank name used by the API.
- **`youtubers.json`**: fallback YouTuber list (`name`, `channel`, optional `description`).
- **`news.json`**: news posts (`date` as `YYYY-MM-DD`, `title`, optional `tag`, `body`). Newest first.
- **`ranks.json`**: paid ranks, their perks and prices, and the how-to-buy steps.
- **`rules.json`**: the rule sections, the notice and the penalties line.
- **`faq.json`**: questions and answers. `{ip}`, `{min}` and `{max}` are filled in automatically.
- **`staff.json`**: staff roles, requirements and how to apply. Set `"open": false` to show applications as closed.

Other files:

- `assets/` holds the styles (`style.css`), the shared script (`app.js`), the logo and the favicon.
- `404.html` is the not-found page.
- `CNAME` sets the custom domain (`teamflick.tech`).
- `sitemap.xml` and `robots.txt` are for search engines. Add new pages to the sitemap.

## Live team and YouTuber data

The site is static, so the API key can't live in the page. Instead, a GitHub Action
(`.github/workflows/sync-api.yml`) runs every 15 minutes. It fetches `/api/team` and `/api/youtubers`
using the repo secret `TEAM_API_KEY` and saves the results as `data/api-team.json` and
`data/api-youtubers.json`. The pages read those files.

If a synced file is missing, empty, or the API is down, the pages fall back to `data/team.json` and
`data/youtubers.json`. A failed fetch never overwrites the last good data.

**Setup:**

1. Repo **Settings → Secrets and variables → Actions → New repository secret**.
2. Name it `TEAM_API_KEY` and paste the key as the value.
3. Run it once by hand: **Actions → Sync team & YouTubers from API → Run workflow**.

Never put the key in any file in this repo.

`worker/` contains an optional Cloudflare Worker proxy. It's only used if `api.proxy` is set in `data/site.json`. See `worker/README.md`.

## Running it locally

Browsers block loading JSON from `file://`, so serve the folder over HTTP:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploying

Push to `main`. GitHub Pages (Settings → Pages → deploy from branch `main`, root) publishes it automatically.

## License

See [LICENSE](LICENSE). The logo and the TeamFlick name are not covered by it.
