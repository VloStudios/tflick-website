// Shared logic: nav/footer + JSON-driven rendering. No build step needed.
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "style") e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(k => e.append(k));
  return e;
};
const load = async f => {
  const r = await fetch(f, { cache: "no-cache" });
  if (!r.ok) throw new Error(f + ": " + r.status);
  return r.json();
};
const safeUrl = u => /^(https?:|mailto:)/i.test(u) ? u : "#";

const PAGES = [
  ["index.html", "Home"], ["news.html", "News"], ["team.html", "Team"], ["ranks.html", "Ranks"], ["rules.html", "Rules"], ["faq.html", "FAQ"], ["apply.html", "Apply"],
  ["youtube.html", "YouTube"], ["about.html", "About & Contact"],
];

function chrome(site) {
  const cur = location.pathname.split("/").pop() || "index.html";
  $("#nav").append(
    el("a", { class: "brand", href: "index.html" },
      el("img", { src: "assets/logo.png", alt: "", onerror: "this.remove()" }), site.name),
    el("button", { class: "nav-toggle", type: "button", "aria-label": "Menu", "aria-expanded": "false" }, "☰"),
    el("nav", { id: "menu" }, PAGES.map(([h, l]) =>
      el("a", { href: h, class: h === cur ? "active" : "" }, l)))
  );
  const tg = $(".nav-toggle");
  tg.onclick = () => {
    const open = $("#nav").classList.toggle("open");
    tg.setAttribute("aria-expanded", open);
    tg.textContent = open ? "✕" : "☰";
  };
  const f = $("#footer");
  f.append(`© ${new Date().getFullYear()} ${site.name}. All Rights Reserved. · ${site.ip}`);
  site.links.filter(l => safeUrl(l.url) !== "#").forEach(l =>
    f.append(" · ", el("a", { href: safeUrl(l.url), target: "_blank", rel: "noopener noreferrer" }, l.label)));
  f.append(el("div", { class: "fine" }, "Not an official Minecraft service. Not affiliated with Mojang or Microsoft."));
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  // Fallback for browsers/contexts without the async clipboard API
  const t = el("textarea", { style: "position:fixed;opacity:0" });
  t.value = text; document.body.append(t); t.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  t.remove();
  return ok;
}

function copyBtn(text, extra) {
  const b = el("button", { class: "btn", type: "button" }, "Copy IP");
  const run = async () => {
    b.textContent = (await copyText(text)) ? "Copied!" : "Press Ctrl+C";
    setTimeout(() => (b.textContent = "Copy IP"), 1500);
  };
  b.onclick = run;
  if (extra) { extra.onclick = run; extra.style.cursor = "pointer"; extra.title = "Click to copy"; }
  return b;
}

// Live player count from the public mcsrvstat.us API. Fails silently (box stays hidden).
async function liveStatus(ip) {
  try {
    const r = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(ip)}`);
    const d = await r.json();
    const box = $("#status"), val = $("#status-val");
    box.hidden = false;
    if (d.online) {
      val.textContent = `${d.players?.online ?? 0} online`;
      val.classList.add("on");
    } else {
      val.textContent = "Offline";
      val.classList.add("off");
    }
  } catch { /* ignore */ }
}

// Live staff/YouTuber data. No API key ever lives in this site.
// Returns null on any failure so pages fall back to the local JSON files.
async function apiGet(site, path) {
  // Preferred: a proxy URL (see worker/). Otherwise: JSON synced from the API by the GitHub Action.
  const base = site.api?.proxy?.replace(/\/+$/, "");
  const url = base ? `${base}/${path}` : `data/api-${path}.json`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-cache" });
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.success === false ? null : d;
  } catch { return null; }
}

const pages = {
  async home(site) {
    $("#ip").textContent = site.ip;
    $("#tagline").textContent = site.tagline;
    $("#copy").append(copyBtn(site.ip, $("#ip")));
    const { min, max } = site.versions;
    $("#versions").textContent = min === max ? min : `${min} – ${max}`;

    const dc = site.links.find(l => /discord/i.test(l.label));
    if (dc) $("#cta").append(el("a", { class: "btn btn-alt", href: safeUrl(dc.url), target: "_blank", rel: "noopener noreferrer" }, "Join our Discord"));

    if (site.gamemodes?.length) {
      $("#modes-sec").hidden = false;
      site.gamemodes.forEach(m => $("#modes").append(el("div", { class: "card mode" },
        el("strong", {}, m.name), el("span", { class: "muted" }, m.description || ""))));
    }
    if (site.howToJoin?.length) {
      $("#join-sec").hidden = false;
      site.howToJoin.forEach(t => $("#join").append(el("li", {}, t.replaceAll("{ip}", site.ip))));
    }
    liveStatus(site.ip);
  },

  async ranks() {
    const d = await load("data/ranks.json");
    $("#intro").textContent = d.intro || "";
    d.ranks.forEach(r => $("#rank-cards").append(el("article", { class: "rcard", style: `--c:${r.color}` },
      el("h2", {}, r.name),
      el("ul", {}, r.perks.map(p => el("li", {}, p))),
      el("table", {}, el("tbody", {}, r.prices.map(p =>
        el("tr", {}, el("td", {}, p.duration), el("td", {}, `${p.coins} coins`))))))));
    const b = d.howToBuy;
    if (b) {
      const buy = $("#buy");
      buy.append(el("h2", {}, b.title),
        el("ol", { class: "steps" }, b.steps.map(s => el("li", {}, s))));
      if (b.warning) buy.append(el("p", { class: "notice" }, b.warning));
    }
  },

  async rules() {
    const rd = await load("data/rules.json");
    const root = $("#rules");
    rd.sections.forEach(sec => root.append(el("section", { class: "block" },
      el("h2", {}, sec.title),
      el("ol", { class: "rules" }, sec.rules.map(r =>
        el("li", {}, el("strong", {}, r.title), el("span", {}, r.text)))))));
    if (rd.notice) root.append(el("p", { class: "notice" }, rd.notice));
    if (rd.penalties) root.append(el("p", { class: "muted" }, rd.penalties));
  },

  async faq(site) {
    const d = await load("data/faq.json");
    const sub = t => t.replaceAll("{ip}", site.ip).replaceAll("{min}", site.versions.min).replaceAll("{max}", site.versions.max);
    d.faq.forEach(f => $("#faq").append(el("details", { class: "qa" },
      el("summary", {}, sub(f.q)), el("p", {}, sub(f.a)))));
  },

  async apply() {
    const d = await load("data/staff.json");
    const root = $("#apply");
    $("#intro").textContent = d.intro || "";
    root.append(el("div", { class: d.open ? "notice open" : "notice closed" },
      d.open ? "Applications are open." : "Applications are currently closed."));
    if (d.general?.length) root.append(el("section", { class: "block" }, el("h2", {}, "What we look for"),
      el("ul", {}, d.general.map(g => el("li", {}, g)))));
    root.append(el("section", { class: "block" }, el("h2", {}, "Roles"),
      el("div", { class: "grid" }, d.roles.map(r => el("div", { class: "card role" },
        el("strong", {}, r.name), el("span", { class: "muted" }, r.description || ""),
        el("ul", {}, (r.requirements || []).map(q => el("li", {}, q))))))));
    const h = d.howToApply;
    if (h) {
      const sec = el("section", { class: "block" }, el("h2", {}, h.title),
        el("ol", { class: "steps" }, h.steps.map(s => el("li", {}, s))));
      if (h.note) sec.append(el("p", { class: "muted" }, h.note));
      root.append(sec);
    }
  },

  async news() {
    const d = await load("data/news.json");
    const root = $("#news");
    const posts = [...d.posts].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!posts.length) root.append(el("p", { class: "muted" }, "No news yet."));
    posts.forEach(p => {
      const dt = new Date(p.date + "T00:00:00");
      const when = isNaN(dt) ? p.date : dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
      const body = String(p.body || "");
      const art = el("article", { class: "post", tabindex: "0", title: "Click for options" },
        el("div", { class: "meta" }, p.tag ? el("span", { class: "tag" }, p.tag) : "", el("time", {}, when)),
        el("h2", {}, p.title),
        body.split(/\n{2,}/).map(t => el("p", {}, t)));
      const btn = el("button", { class: "btn post-copy", type: "button" }, "Copy article");
      btn.onclick = async e => {
        e.stopPropagation();
        const txt = `${p.title}\n${when}\n\n${body}`;
        btn.textContent = (await copyText(txt)) ? "Copied!" : "Press Ctrl+C";
        setTimeout(() => (btn.textContent = "Copy article"), 1500);
      };
      art.append(btn);
      const toggle = () => art.classList.toggle("selected");
      art.onclick = e => { if (!getSelection().toString()) toggle(); };
      art.onkeydown = e => { if (e.key === "Enter" && e.target === art) toggle(); };
      root.append(art);
    });
  },

  async team(site) {
    const data = await load("data/team.json");
    const root = $("#team");
    let members = data.members.map(m => ({ name: m.name, rank: m.rank }));
    const api = await apiGet(site, "team");
    if (Array.isArray(api?.members) && api.members.length) {
      members = api.members.map(m => {
        const r = data.ranks.find(x => x.apiKey && x.apiKey === m.rankKey);
        return { name: m.displayName || m.username, rank: r ? r.name : m.rank, avatar: m.avatarUrl };
      });
    }
    // API ranks we don't know yet are listed after the known ones, in the order they appear
    const ranks = [...data.ranks];
    members.forEach(m => {
      if (!ranks.some(r => r.name === m.rank)) ranks.push({ name: m.rank, color: "#94a88f" });
    });
    let any = false;
    ranks.forEach(rank => {
      const ms = members.filter(m => m.rank === rank.name);
      if (!ms.length) return;
      any = true;
      root.append(el("section", { class: "rank", style: `--c:${rank.color}` },
        el("h2", {}, el("span", { class: "tag" }, rank.name)),
        el("div", { class: "grid" }, ms.map(m =>
          el("div", { class: "card member" },
            m.avatar
              ? el("img", { class: "dc", src: m.avatar, alt: "", loading: "lazy", width: 48, height: 48, referrerpolicy: "no-referrer" })
              : el("img", { src: `https://mc-heads.net/avatar/${encodeURIComponent(m.name)}/64`, alt: "", loading: "lazy", width: 48, height: 48 }),
            el("span", {}, m.name))))));
    });
    if (!any) root.append(el("p", { class: "muted" }, "No team members yet."));
  },

  async youtube(site) {
    const data = await load("data/youtubers.json");
    const root = $("#yt");
    let list = data.youtubers;
    const api = await apiGet(site, "youtubers");
    const arr = api && (api.youtubers || api.members || api.data);
    if (Array.isArray(arr) && arr.length) {
      list = arr.map(y => ({
        name: y.displayName || y.name || y.username,
        channel: y.channel || y.channelUrl || y.youtubeUrl || y.url || "",
        description: y.description || "",
      }));
    }
    if (!list.length) root.append(el("p", { class: "muted" }, "No YouTubers yet."));
    list.forEach(y => {
      const linked = safeUrl(y.channel) !== "#";
      const attrs = linked
        ? { class: "card yt", href: safeUrl(y.channel), target: "_blank", rel: "noopener noreferrer" }
        : { class: "card yt" };
      root.append(el(linked ? "a" : "div", attrs,
        el("span", { class: "tag yttag" }, "YT"),
        el("strong", {}, y.name),
        y.description ? el("span", { class: "muted" }, y.description) : "",
        linked ? el("span", { class: "go" }, "Visit channel →") : el("span", { class: "muted" }, "Channel link coming soon")));
    });
  },

  async about(site) {
    $("#desc").textContent = site.about.description;
    const links = $("#links");
    site.links.forEach(l => links.append(
      el("a", { class: "card link", href: safeUrl(l.url), target: "_blank", rel: "noopener noreferrer" },
        el("strong", {}, l.label),
        el("span", { class: "muted" }, l.description || ""))));
  },
};

(async () => {
  try {
    const site = await load("data/site.json");
    chrome(site);
    document.title = `${site.name} – ${document.title}`;
    await pages[document.body.dataset.page](site);
  } catch (e) {
    console.error(e);
    $("main").append(el("p", { class: "muted" },
      "Could not load site data. If you opened this file directly, serve it over HTTP (e.g. `python3 -m http.server`)."));
  }
})();
