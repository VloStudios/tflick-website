// Cursor sparkles: lime/yellow (and a little blue) pixel sparks trail the mouse,
// and clicks/taps pop a circular firework. Skipped for "reduce motion".
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50";
  document.body.append(c);
  const ctx = c.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); addEventListener("resize", resize);

  const COLORS = ["#a8e62e", "#f4e03a", "#a8e62e", "#f4e03a", "#3fa9f5"];
  const MAX = 320;
  let parts = [], rings = [], running = false, lastX = -99, lastY = -99;
  const pick = () => COLORS[(Math.random() * COLORS.length) | 0];

  function spark(x, y, speed, spread) {
    if (parts.length >= MAX) return;
    const a = Math.random() * Math.PI * 2, v = Math.random() * speed + speed * 0.3;
    parts.push({ x, y, vx: Math.cos(a) * v * spread, vy: Math.sin(a) * v * spread - 0.2,
      life: 0, max: 28 + Math.random() * 22, s: 3 + ((Math.random() * 3) | 0), col: pick() });
  }
  function burst(x, y) {
    const n = 30;
    for (let i = 0; i < n && parts.length < MAX; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.15, v = 2.2 + Math.random() * 2.6;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 40 + Math.random() * 20,
        s: 3 + ((Math.random() * 3) | 0), col: i % 2 ? "#f4e03a" : "#a8e62e", g: 0.04 });
    }
    rings.push({ x, y, r: 4, life: 0, max: 26 });
    start();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.vy += p.g || 0.02; p.vx *= 0.97; p.vy *= 0.97;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life++; r.r += 3.2;
      if (r.life >= r.max) { rings.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - r.life / r.max;
      ctx.strokeStyle = "#f4e03a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (parts.length || rings.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, W, H); }
  }
  function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (dx * dx + dy * dy < 49) return;       // only every ~7px of movement
    lastX = e.clientX; lastY = e.clientY;
    spark(e.clientX, e.clientY, 0.9, 1); spark(e.clientX, e.clientY, 0.6, 1);
    start();
  }, { passive: true });
  addEventListener("pointerdown", e => burst(e.clientX, e.clientY), { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { parts = []; rings = []; } });
})();
