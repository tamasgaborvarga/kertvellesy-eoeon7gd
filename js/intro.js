/* Kertvéllesy intró (B változat: az A intro.js másolata — saját kulcs: kvb-intro, a B borítóképeit várja) — az eredeti logó kézírásként rajzolódik ki (≈2,6 s), majd 1 s alatt áttűnik az oldalba.
   Adat: window.KV_INTRO (a jóváhagyott nyomvonal + időzítés, intro/work/export_web.py).
   Csak a kezdőlapon, munkamenetenként egyszer; kattintásra/koppintásra/billentyűre átugorható;
   minden eszközön és beállítás mellett teljes egészében lefut. A végső képkocka = az eredeti logó. */
(function () {
  "use strict";
  var root = document.documentElement;
  var el = document.getElementById("intro");
  var D = window.KV_INTRO;
  if (!el || !D || !root.classList.contains("intro")) { if (el) el.remove(); root.classList.remove("intro"); return; }
  try { sessionStorage.setItem("kvb-intro", "1"); } catch (err) { /* privát mód: minden alkalommal lefut, de átugorható */ }

  var NS = "http://www.w3.org/2000/svg";
  var svg = el.querySelector("svg");
  var mask = svg.querySelector("mask");
  var tag = svg.querySelector(".intro-tag");
  var full = svg.querySelector(".intro-full");
  var write = svg.querySelector("image[mask]");

  // cubic-bezier(x1,y1,x2,y2) → u ↦ y (ugyanaz a görbe, mint az oldal áttűnéseinél)
  function bezier(x1, y1, x2, y2) {
    return function (u) {
      u = Math.min(Math.max(u, 0), 1);
      var lo = 0, hi = 1, t = 0;
      for (var i = 0; i < 40; i++) {
        t = (lo + hi) / 2;
        var x = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
        if (x < u) lo = t; else hi = t;
      }
      t = (lo + hi) / 2;
      return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
    };
  }
  var easeW = bezier.apply(null, D.ease_write), easeT = bezier.apply(null, D.ease_tag);
  function interp(x, xs, ys) {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    var lo = 0, hi = xs.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
    return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
  }

  // maszk-útvonalak: betűrészenként, saját tollvastagsággal
  var parts = D.chunks.map(function (c) {
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", c.d);
    p.setAttribute("fill", "none"); p.setAttribute("stroke", "#fff");
    p.setAttribute("stroke-width", c.width);
    p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
    mask.appendChild(p);
    var len = p.getTotalLength();
    p.style.strokeDasharray = len + " " + (len + 10);
    p.style.strokeDashoffset = len; p.style.visibility = "hidden";
    return { el: p, len: len, c: c };
  });

  var T = D.timing, start = null, done = false;
  var vbW = D.bbox[2] - D.bbox[0];

  function render(t) {
    // 1) kézírás: a teljes „erőfeszítés” idővonal → vonásonkénti ívhossz → betűrészek
    var pw = t > T.write[0] ? easeW((t - T.write[0]) / (T.write[1] - T.write[0])) : 0;
    var e = pw * D.total;
    var L = D.strokes.map(function (s) { return interp(e, s.eff, s.arc); });
    parts.forEach(function (p) {
      var c = p.c, span = Math.max(c.s1 - c.s0, 0.001);
      var f = Math.min(Math.max((L[c.stroke] - c.s0) / span, 0), 1);
      p.el.style.visibility = f > 0 ? "visible" : "hidden";
      p.el.style.strokeDashoffset = p.len * (1 - f);
    });
    // 2) a rajzolt vonás átolvad az eredeti kitöltött logóba
    var r = t > T.resolve[0] ? easeW((t - T.resolve[0]) / (T.resolve[1] - T.resolve[0])) : 0;
    full.style.opacity = r;
    write.style.opacity = r >= 1 ? 0 : 1;   // a végén csak az eredeti réteg marad (nincs dupla él)
    // 3) tagline: beúszás + 6 px emelkedés (képernyő-pixelben)
    var q = t > T.tag[0] ? easeT((t - T.tag[0]) / (T.tag[1] - T.tag[0])) : 0;
    var scale = vbW / (svg.getBoundingClientRect().width || vbW);
    tag.style.opacity = q;
    tag.setAttribute("transform", "translate(0 " + (6 * scale * (1 - q)).toFixed(2) + ")");
  }

  var heroImgs = Array.prototype.slice.call(document.querySelectorAll(".b-cover-media img"));
  function ready() {  // a kezdőképek dekódolása (max. 500 ms várakozás), hogy az áttűnés ne akadjon meg
    var decs = heroImgs.map(function (i) { return i.decode ? i.decode().catch(function () {}) : Promise.resolve(); });
    return Promise.race([Promise.all(decs), new Promise(function (r) { setTimeout(r, 500); })]);
  }

  function finish() {
    if (done) return; done = true;
    render(T.dur);
    ready().then(leave);
  }
  function leave() {
    // lágy kilépés: a logó elhalványul és felúszik, utána oldódik fel a sötét réteg; közben a kezdőkép
    // épp ekkor kezdi a lassú ráközelítését — így az oldal „megérkezik”, nem csak előtűnik
    root.classList.add("intro-leaving", "hero-arrive");   // a hero-arrive megmarad: a ráközelítés zavartalanul végigfut
    el.classList.add("out");
    setTimeout(function () { el.remove(); root.classList.remove("intro", "intro-leaving"); }, 2550);
  }

  function frame(now) {
    if (done) return;
    if (start === null) start = now;
    var t = (now - start) / 1000;
    render(t);
    if (t >= T.dur) finish(); else requestAnimationFrame(frame);
  }

  // csak ellenőrzéshez: ?introt=1.2 → az intró ebben az időpillanatban megáll (látogatónak nincs hatása)
  var freeze = /[?&]introt=([\d.]+)/.exec(location.search);
  if (freeze) { render(parseFloat(freeze[1])); return; }

  ["click", "touchstart", "keydown", "wheel"].forEach(function (ev) {
    window.addEventListener(ev, finish, { once: true, passive: true });
  });

  // A kézírás egy helyben rajzolódik ki (nincs nagy felületű elmozdulás, parallax) — ezért csökkentett mozgás
  // beállítás mellett is teljes egészében lefut; bármikor átugorható.
  requestAnimationFrame(frame);
})();
