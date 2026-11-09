# TeamFlick website

Static site (no build, no server). Hosted free on GitHub Pages.

Edit these files to change content:

- `data/site.json` – IP, supported versions (`versions.min` / `versions.max`), about text, rules, Discord & other links
- `data/team.json` – rank order/colors and members (`{"name": "...", "rank": "Admin"}`)
- `data/youtubers.json` – YouTubers and channel links

Preview locally: `python3 -m http.server` then open http://localhost:8000
