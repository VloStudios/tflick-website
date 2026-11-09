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
  ["index.html", "Home"], ["team.html", "Team"], ["ranks.html", "Ranks"],
  ["youtube.html", "YouTube"], ["about.html", "About & Contact"],
];

function chrome(site) {
  const cur = location.pathname.split("/").pop() || "index.html";
  $("#nav").append(
    el("a", { class: "brand", href: "index.html" },
      el("img", { src: "assets/logo.png", alt: "", onerror: "this.remove()" }), site.name),
    el("nav", {}, PAGES.map(([h, l]) =>
      el("a", { href: h, class: h === cur ? "active" : "" }, l)))
  );
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

  async team() {
    const data = await load("data/team.json");
    const root = $("#team");
    let any = false;
    data.ranks.forEach(rank => {
      const ms = data.members.filter(m => m.rank === rank.name);
      if (!ms.length) return;
      any = true;
      root.append(el("section", { class: "rank", style: `--c:${rank.color}` },
        el("h2", {}, el("span", { class: "tag" }, rank.name)),
        el("div", { class: "grid" }, ms.map(m =>
          el("div", { class: "card member" },
            el("img", { src: `https://mc-heads.net/avatar/${encodeURIComponent(m.name)}/64`, alt: "", loading: "lazy", width: 48, height: 48 }),
            el("span", {}, m.name))))));
    });
    if (!any) root.append(el("p", { class: "muted" }, "No team members yet."));
    const unknown = data.members.filter(m => !data.ranks.some(r => r.name === m.rank));
    if (unknown.length) console.warn("Members with unknown rank:", unknown);
  },

  async youtube() {
    const data = await load("data/youtubers.json");
    const root = $("#yt");
    if (!data.youtubers.length) root.append(el("p", { class: "muted" }, "No YouTubers yet."));
    data.youtubers.forEach(y => {
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
    const rd = await load("data/rules.json");
    const root = $("#rules");
    rd.sections.forEach(sec => root.append(el("section", { class: "block" },
      el("h2", {}, sec.title),
      el("ol", { class: "rules" }, sec.rules.map(r =>
        el("li", {}, el("strong", {}, r.title), el("span", {}, r.text)))))));
    if (rd.notice) root.append(el("p", { class: "notice" }, rd.notice));
    if (rd.penalties) root.append(el("p", { class: "muted" }, rd.penalties));
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
