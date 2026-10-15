/* Kertvéllesy — B változat: progresszív kiegészítések. JS nélkül is minden tartalom elérhető.
   Az A site.js-től független: saját tárolókulcsok (kvb-theme, kvb-last), saját osztálynevek. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* nyelv: a <html lang> szerint — a szöveg- és URL-paraméter-párok a build_b.py-val (QP) egyeznek */
  var LS = {
    hu: { light: "Világos mód", dark: "Sötét mód", menu: "Menü", close: "Bezárás", type: "tipus", style: "stilus", view: "nezet", list: "lista" },
    en: { light: "Light mode", dark: "Dark mode", menu: "Menu", close: "Close", type: "type", style: "style", view: "view", list: "list" },
    de: { light: "Heller Modus", dark: "Dunkler Modus", menu: "Menü", close: "Schließen", type: "typ", style: "stil", view: "ansicht", list: "liste" }
  };
  var L = LS[(root.lang || "hu").slice(0, 2)] || LS.hu;

  /* --- képek: a domináns szín áll a helyén, betöltéskor beúszik --- */
  document.querySelectorAll("img.lz").forEach(function (img) {
    var done = function () { img.classList.add("ok"); };
    if (img.complete) done();
    else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
  });

  /* --- világos / sötét: alapból világos (a B arculata), a választás megmarad (kvb-theme) --- */
  var themeBtn = document.querySelector(".theme-toggle");
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  var applyTheme = function (dark) {
    if (dark) root.dataset.theme = "dark"; else delete root.dataset.theme;
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(dark));
      themeBtn.querySelector(".vh").textContent = dark ? L.light : L.dark;
      themeBtn.title = dark ? L.light : L.dark;
    }
    if (metaTheme) metaTheme.setAttribute("content", dark ? "#121311" : "#EEEBE5");
  };
  applyTheme(root.dataset.theme === "dark");

  /* --- kezdőkép: csak a témához illő kép betöltése után jelenik meg; váltás előtt az új kép kész --- */
  var heroBox = document.querySelector(".b-hero-media");
  var heroImg = function (dark) { return heroBox && heroBox.querySelector(dark ? ".b-hero-night" : ".b-hero-day"); };
  var whenReady = function (img) {
    if (!img) return Promise.resolve();
    var dec = function () { return img.decode ? img.decode().catch(function () {}) : Promise.resolve(); };
    var loaded = img.complete && img.naturalWidth ? Promise.resolve() :
      new Promise(function (r) { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); });
    return loaded.then(dec);
  };
  if (heroBox) {
    var cur = heroImg(root.dataset.theme === "dark");
    var other = heroImg(root.dataset.theme !== "dark");
    whenReady(cur).then(function () { heroBox.classList.add("is-ready"); });
    // a másik kép csak az első után töltődik (ne versenyezzen a sávszélességért)
    if (other && other.getAttribute("fetchpriority")) other.setAttribute("fetchpriority", "low");
  }

  if (themeBtn) themeBtn.addEventListener("click", function () {
    var dark = root.dataset.theme !== "dark";
    var target = heroImg(dark);
    // ha az új téma képe még nincs kész, megvárjuk (legfeljebb 600 ms), hogy az áttűnés ne üres képre fusson
    var gate = target ? Promise.race([whenReady(target), new Promise(function (r) { setTimeout(r, 600); })]) : Promise.resolve();
    gate.then(function () { switchTheme(dark); });
  });
  var switchTheme = function (dark) {
    themeBtn.classList.remove("is-switching"); void themeBtn.offsetWidth;
    themeBtn.classList.add("is-switching");
    setTimeout(function () { themeBtn.classList.remove("is-switching"); }, 1050);
    if (document.startViewTransition) {
      // a kör középpontja a gomb; sugara a legtávolabbi képernyősarokig ér
      var rb = themeBtn.getBoundingClientRect();
      var cx = rb.left + rb.width / 2, cy = rb.top + rb.height / 2;
      var rad = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.classList.add("theme-vt");
      root.classList.toggle("theme-fade", still);
      var t = document.startViewTransition(function () { applyTheme(dark); });
      if (!still) t.ready.then(function () {
        root.animate({ clipPath: ["circle(0px at " + cx + "px " + cy + "px)", "circle(" + rad + "px at " + cx + "px " + cy + "px)"] },
          { duration: 760, easing: "cubic-bezier(.76, 0, .24, 1)", pseudoElement: "::view-transition-new(root)" });
      }, function () {});
      var done = function () { root.classList.remove("theme-vt", "theme-fade"); };
      t.finished.then(done, done);
    } else {
      root.classList.add("theme-anim");
      applyTheme(dark);
      setTimeout(function () { root.classList.remove("theme-anim"); }, 1050);
    }
    try { localStorage.setItem("kvb-theme", dark ? "dark" : "light"); } catch (err) { /* privát mód */ }
  };
  // a választott téma minden visszatéréskor érvényes: a mobilböngészők a „vissza” lépésnél (és lapváltáskor)
  // a gyorsítótárból adják vissza a korábbi oldalt a régi témával — ilyenkor újraolvassuk, áttűnés nélkül
  var syncTheme = function () {
    var want = null;
    try { want = localStorage.getItem("kvb-theme"); } catch (err) { return; }
    var dark = want === "dark";
    if (dark === (root.dataset.theme === "dark")) return;
    root.classList.add("b-no-anim");
    applyTheme(dark);
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove("b-no-anim"); }); });
  };
  window.addEventListener("pageshow", syncTheme);
  window.addEventListener("storage", function (ev) { if (ev.key === "kvb-theme") syncTheme(); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) syncTheme(); });

  /* --- sáv: mindig látható; sötét fejezet fölött világos (a tetején átlátszó), papír fölött tinta --- */
  var bar = document.getElementById("b-bar");
  var menuEl = document.getElementById("b-menu");
  var menuBtn = document.querySelector(".b-menu-btn");
  if (bar) {
    var lastY = window.scrollY, ticking = false;
    var paint = function () {
      ticking = false;
      var y = window.scrollY;
      var probe = 36;
      bar.style.pointerEvents = "none";
      var under = (document.elementsFromPoint(Math.round(window.innerWidth / 2), probe) || [])
        .filter(function (el) { return !el.closest("#intro, #b-bar"); })[0];
      bar.style.pointerEvents = "";
      var dark = !!(under && under.closest(".b-night, .b-foot"));
      bar.classList.toggle("on-dark", dark);
      bar.classList.toggle("at-top", y < 8);
      lastY = y;   // a sáv mindig látható (nem bújik el görgetéskor — a user kérése)
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener("resize", paint);
    paint();
    if (themeBtn) themeBtn.addEventListener("click", function () { setTimeout(paint, 50); });
    // az intró eltűnése után újra (amíg az intró fedi az oldalt, a borító a mérvadó)
    new MutationObserver(function () { requestAnimationFrame(paint); }).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  /* --- sáv nyelvválasztója (<details>): kívülre kattintás és Escape zár --- */
  var dd = document.querySelector(".b-lang-dd");
  if (dd) {
    document.addEventListener("click", function (ev) { if (dd.open && !dd.contains(ev.target)) dd.open = false; });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && dd.open) { ev.stopImmediatePropagation(); dd.open = false; dd.querySelector("summary").focus(); }
    }, true);
  }

  /* --- teljes képernyős menü: fókusz a menüben marad, Escape zár, a tételhez tartozó kép átúszik --- */
  if (menuEl && menuBtn) {
    var label = menuBtn.querySelector(".b-menu-l");
    var focusables = function () {
      return [menuBtn].concat(Array.prototype.slice.call(menuEl.querySelectorAll("a[href]")))
        .concat(Array.prototype.slice.call(bar.querySelectorAll(".b-brand, .b-bar-cta, .b-lang-dd summary, .theme-toggle")))
        .filter(function (el) { return el.offsetParent !== null || el === menuBtn; });
    };
    var setMenu = function (open, viaKeyboard) {
      menuBtn.setAttribute("aria-expanded", String(open));
      if (label) label.textContent = open ? L.close : L.menu;
      menuEl.classList.toggle("open", open);
      root.classList.toggle("menu-open", open);
      menuEl.setAttribute("aria-hidden", String(!open));
      if (open) {
        menuEl.scrollTop = 0;
        setTimeout(function () { var a = menuEl.querySelector(".b-menu-a"); if (a) a.focus({ focusVisible: !!viaKeyboard, preventScroll: true }); }, 80);
      }
    };
    menuEl.setAttribute("aria-hidden", "true");
    menuBtn.addEventListener("click", function (ev) { setMenu(menuBtn.getAttribute("aria-expanded") !== "true", ev.detail === 0); });
    document.addEventListener("keydown", function (ev) {
      if (!menuEl.classList.contains("open")) return;
      if (ev.key === "Escape") { setMenu(false); menuBtn.focus(); }
      if (ev.key === "Tab") {
        var f = focusables(), i = f.indexOf(document.activeElement);
        if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); }
      }
    });
    menuEl.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    var mimgs = menuEl.querySelectorAll(".b-menu-img");
    var showImg = function (k) { mimgs.forEach(function (m) { m.classList.toggle("on", m.getAttribute("data-k") === k); }); };
    menuEl.querySelectorAll(".b-menu-item").forEach(function (it) {
      var k = it.getAttribute("data-k");
      it.addEventListener("mouseenter", function () { showImg(k); });
      it.addEventListener("focusin", function () { showImg(k); });
    });
    var cur = menuEl.querySelector(".b-menu-a[aria-current]");
    showImg(cur ? cur.closest(".b-menu-item").getAttribute("data-k") : "1");
  }

  /* --- vízszintes referenciasor: nyílgombok + haladásjelző (natív görgetés) --- */
  var rail = document.querySelector(".b-rail");
  if (rail) {
    var bar2 = document.querySelector(".b-rail-bar span");
    var btns = document.querySelectorAll("[data-rail]");
    var upd = function () {
      var max = rail.scrollWidth - rail.clientWidth;
      var p = max > 0 ? rail.scrollLeft / max : 1;
      if (bar2) bar2.style.setProperty("--p", String(Math.max(.08, Math.min(1, p * .92 + .08))));
      btns.forEach(function (b) { b.disabled = b.getAttribute("data-rail") === "-1" ? rail.scrollLeft < 4 : rail.scrollLeft > max - 4; });
    };
    rail.addEventListener("scroll", function () { requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener("resize", upd);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var item = rail.querySelector(".b-rail-item");
        var step = item ? item.getBoundingClientRect().width + 32 : rail.clientWidth * .8;
        rail.scrollBy({ left: step * Number(b.getAttribute("data-rail")), behavior: reduce ? "auto" : "smooth" });
      });
    });
    upd();
  }

  /* --- jelmondat: valódi gépelés asztalon — betűről betűre, emberi tempóban (szóközöknél, írásjeleknél
         rövid megállás, néha gyorsabb sorozat), előtte villogó kurzor. A gépelés nem mozgat semmit a térben
         (mint az intró), ezért csökkentett mozgás beállítás mellett is lefut. Álló kijelzőn nincs gépelés. --- */
  var typed = document.querySelector(".b-typed-v");
  if (typed && !window.matchMedia("(max-aspect-ratio: 5/4)").matches) {
    var spans = Array.prototype.slice.call(typed.children);
    var lines = spans.map(function (s) { return s.textContent; });
    var caret = document.createElement("span"); caret.className = "b-caret";
    spans.forEach(function (s) { s.textContent = ""; });
    typed.classList.add("typing");
    spans[0].appendChild(caret);
    var delayFor = function (ch, next) {
      var base = 45 + Math.random() * 70;                    // 45–115 ms / betű
      if (Math.random() < .12) base = 28 + Math.random() * 20; // néha gyors sorozat
      if (ch === " ") base += 40 + Math.random() * 90;        // szóhatár
      if (ch === ",") base += 220;
      if (ch === "…" || ch === ".") base += 520;
      if (next === undefined) base += 650;                    // sor vége: elgondolkodik
      return base;
    };
    var type = function () {
      var li = 0, ci = 0;
      var tick = function () {
        if (li >= lines.length) { setTimeout(function () { caret.remove(); }, 3200); return; }
        var line = lines[li], ch = line.charAt(ci);
        ci++;
        spans[li].textContent = line.slice(0, ci);
        spans[li].appendChild(caret);
        var wait = delayFor(ch, line.charAt(ci) || undefined);
        if (ci >= line.length) { li++; ci = 0; }
        setTimeout(tick, wait);
      };
      tick();
    };
    var begin = function () { setTimeout(type, 900); };   // a kurzor előbb pár ütemet villog
    if (root.classList.contains("intro")) {
      var mo = new MutationObserver(function () {
        if (!root.classList.contains("intro")) { mo.disconnect(); begin(); }
      });
      mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    } else setTimeout(begin, 500);
  }

  /* --- számsáv: a darabszámok egyszer felpörögnek, amikor a sáv a képre ér (az évszám nem) --- */
  var counters = document.querySelectorAll("[data-spin]");
  if (counters.length && !reduce && "IntersectionObserver" in window) {
    counters.forEach(function (el) { el.textContent = "0"; });
    var spin = function (el) {
      var to = Number(el.getAttribute("data-spin")), t0 = null, dur = 1400;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(2, -10 * k);
        el.textContent = String(k >= 1 ? to : Math.round(to * ease));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        setTimeout(function () { spin(en.target); }, 150);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* --- egyszeri megjelenés görgetéskor --- */
  var revealEls = document.querySelectorAll("[data-b-reveal], .b-card, .b-sec-head, .b-split");
  var showAll = function () { revealEls.forEach(function (el) { el.classList.add("in"); }); };
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    revealEls.forEach(function (el) { io.observe(el); });
    // horgonyra érkezve / nyomtatáskor semmi ne maradjon rejtve
    window.addEventListener("beforeprint", showAll);
  } else showAll();

  /* --- oldalak közötti átnövés: a megkattintott kártya képe → a projektoldal nyitóképe --- */
  if (!reduce && "onpagereveal" in window) {
    var VT = "proj-lead";
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest(".b-card a, .b-pager > a[rel]");
      if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      var img = a.querySelector("img");
      if (img) img.style.viewTransitionName = VT;
    });
    var proj = document.querySelector(".b-project[data-slug]");
    if (proj) { try { sessionStorage.setItem("kvb-last", proj.getAttribute("data-slug")); } catch (err) { /* */ } }
    window.addEventListener("pagereveal", function (ev) {
      if (!ev.viewTransition || proj) return;
      var last = null;
      try { last = sessionStorage.getItem("kvb-last"); } catch (err) { /* */ }
      var card = last && document.querySelector('.b-card[data-slug="' + last + '"]:not(.is-hidden) img');
      if (!card) return;
      card.style.viewTransitionName = VT;
      ev.viewTransition.finished.then(function () { card.style.viewTransitionName = ""; });
    });
    window.addEventListener("pageshow", function () {
      document.querySelectorAll(".b-card img, .b-pager img").forEach(function (i) { i.style.viewTransitionName = ""; });
    });
  }

  /* --- referenciák: szűrő + rács/lista nézet + előnézet a listában --- */
  var refs = document.querySelector(".b-refs");
  var filters = refs && refs.querySelector(".b-filters");
  if (refs && filters) {
    filters.hidden = false;
    var grid = refs.querySelector(".b-ref-grid");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".b-card"));
    var indexWrap = refs.querySelector(".b-index-wrap");
    var rows = Array.prototype.slice.call(refs.querySelectorAll(".b-index li"));
    var state = { type: "", style: "", view: "grid" };
    var countEl = filters.querySelector("[data-count]");
    var empty = refs.querySelector(".empty-state");
    // ritmus: [7+5] [4+4+4] [5+7] [4+4+4] — mindig a látható elemekre
    var PATTERN = ["is-a", "is-b", "", "", "", "is-b", "is-a", "", "", ""];
    var match = function (el) {
      var tags = " " + el.getAttribute("data-tags") + " ";
      return (!state.type || tags.indexOf(" " + state.type + " ") > -1) && (!state.style || tags.indexOf(" " + state.style + " ") > -1);
    };
    var apply = function (write) {
      var visible = [];
      cards.forEach(function (c) { var ok = match(c); c.classList.toggle("is-hidden", !ok); if (ok) visible.push(c); });
      rows.forEach(function (r) { r.classList.toggle("is-hidden", !match(r)); });
      visible.forEach(function (c, i) {
        c.classList.remove("is-a", "is-b");
        var k = PATTERN[i % PATTERN.length];
        if (k && visible.length > 4) c.classList.add(k);
        c.classList.add("in");
      });
      countEl.textContent = visible.length;
      empty.hidden = visible.length > 0;
      refs.setAttribute("data-view", state.view);
      indexWrap.hidden = state.view !== "list";
      filters.querySelectorAll("[data-view]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-view") === state.view)); });
      if (write === false) return;
      try {
        var q = new URLSearchParams();
        if (state.type) q.set(L.type, state.type);
        if (state.style) q.set(L.style, state.style);
        if (state.view === "list") q.set(L.view, L.list);
        var s = q.toString();
        history.replaceState(null, "", s ? "?" + s : location.pathname);
      } catch (err) { /* file:// */ }
    };
    var press = function (name, value) {
      state[name] = value;
      var sel = filters.querySelector('[data-filter-select="' + name + '"]');
      if (sel) sel.value = value;
      filters.querySelectorAll('[data-filter="' + name + '"]').forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-value") === value));
      });
    };
    filters.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-filter]");
      if (b) { press(b.getAttribute("data-filter"), b.getAttribute("data-value")); apply(); return; }
      var v = ev.target.closest("[data-view]");
      if (v) { state.view = v.getAttribute("data-view"); apply(); }
    });
    filters.querySelectorAll("[data-filter-select]").forEach(function (sel) {
      sel.addEventListener("change", function () { press(sel.getAttribute("data-filter-select"), sel.value); apply(); });
    });
    var reset = refs.querySelector("[data-reset]");
    if (reset) reset.addEventListener("click", function () { press("type", ""); press("style", ""); apply(); });
    try {
      var params = new URLSearchParams(location.search);
      var valid = function (name, v) { return v && filters.querySelector('[data-filter="' + name + '"][data-value="' + CSS.escape(v) + '"]'); };
      if (valid("type", params.get(L.type))) press("type", params.get(L.type));
      if (valid("style", params.get(L.style))) press("style", params.get(L.style));
      if (params.get(L.view) === L.list) state.view = "list";
    } catch (err) { /* */ }
    apply(false);

    // lista-előnézet (csak egérrel, asztalin; érintésen a sor maga a link)
    var prev = refs.querySelector(".b-index-preview");
    var pimg = prev && prev.querySelector("img");
    if (prev && window.matchMedia("(hover: hover)").matches) {
      var shown = null;
      var showPrev = function (li) {
        if (!li || li === shown) return;
        shown = li;
        prev.classList.remove("on");
        var src = li.getAttribute("data-img");
        var next = new Image();
        next.onload = function () { if (shown !== li) return; pimg.src = src; pimg.alt = ""; requestAnimationFrame(function () { prev.classList.add("on"); }); };
        next.src = src;
      };
      rows.forEach(function (li) {
        li.addEventListener("mouseenter", function () { showPrev(li); });
        li.querySelector("a").addEventListener("focus", function () { showPrev(li); });
      });
      var first = rows.filter(function (r) { return !r.classList.contains("is-hidden"); })[0];
      if (first) showPrev(first);
    }
  }

  /* --- képnézegető --- */
  var dlg = document.querySelector(".lightbox");
  var zooms = Array.prototype.slice.call(document.querySelectorAll("a.zoom"));
  if (dlg && zooms.length && typeof dlg.showModal === "function") {
    var big = dlg.querySelector("img");
    var counter = dlg.querySelector(".lb-count");
    var idx = 0, opener = null;
    var show = function (i) {
      idx = (i + zooms.length) % zooms.length;
      var a = zooms[idx];
      big.src = a.getAttribute("href");
      big.alt = a.querySelector("img").alt;
      counter.textContent = (idx + 1) + " / " + zooms.length;
    };
    zooms.forEach(function (a, i) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); opener = a; show(i); dlg.showModal(); });
    });
    var single = zooms.length < 2;
    dlg.querySelector(".lb-prev").hidden = single;
    dlg.querySelector(".lb-next").hidden = single;
    dlg.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    dlg.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowLeft") show(idx - 1);
      if (ev.key === "ArrowRight") show(idx + 1);
    });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { if (opener) opener.focus(); });
    var x0 = null;
    dlg.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (ev) {
      if (x0 === null) return;
      var dx = ev.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
})();
