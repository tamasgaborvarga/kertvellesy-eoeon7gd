/* Kertvéllesy — B változat: progresszív kiegészítések. JS nélkül is minden tartalom elérhető.
   Az A site.js-től független: saját tárolókulcsok (kvb-theme, kvb-last), saját osztálynevek. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      themeBtn.querySelector(".vh").textContent = dark ? "Világos mód" : "Sötét mód";
      themeBtn.title = dark ? "Világos mód" : "Sötét mód";
    }
    if (metaTheme) metaTheme.setAttribute("content", dark ? "#121311" : "#EEEBE5");
  };
  applyTheme(root.dataset.theme === "dark");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var dark = root.dataset.theme !== "dark";
    themeBtn.classList.remove("is-switching"); void themeBtn.offsetWidth;
    themeBtn.classList.add("is-switching");
    setTimeout(function () { themeBtn.classList.remove("is-switching"); }, 1050);
    if (document.startViewTransition) {
      root.classList.add("theme-vt");
      var t = document.startViewTransition(function () { applyTheme(dark); });
      t.finished.then(function () { root.classList.remove("theme-vt"); }, function () { root.classList.remove("theme-vt"); });
    } else {
      root.classList.add("theme-anim");
      applyTheme(dark);
      setTimeout(function () { root.classList.remove("theme-anim"); }, 1050);
    }
    try { localStorage.setItem("kvb-theme", dark ? "dark" : "light"); } catch (err) { /* privát mód */ }
  });
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

  /* --- teljes képernyős menü: fókusz a menüben marad, Escape zár, a tételhez tartozó kép átúszik --- */
  if (menuEl && menuBtn) {
    var label = menuBtn.querySelector(".b-menu-l");
    var focusables = function () {
      return [menuBtn].concat(Array.prototype.slice.call(menuEl.querySelectorAll("a[href]")))
        .concat(Array.prototype.slice.call(bar.querySelectorAll(".b-brand, .b-bar-cta, .theme-toggle")))
        .filter(function (el) { return el.offsetParent !== null || el === menuBtn; });
    };
    var setMenu = function (open, viaKeyboard) {
      menuBtn.setAttribute("aria-expanded", String(open));
      if (label) label.textContent = open ? "Bezárás" : "Menü";
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

  /* --- jelmondat: „begépelés” a borítón — az intró után indul; csökkentett mozgásnál azonnal kész --- */
  var typed = document.querySelector(".b-typed-v");
  // csak fekvő (asztali) kijelzőn gépel; álló kijelzőn a nagy címbetűs változat áll (CSS)
  if (typed && !reduce && !window.matchMedia("(max-aspect-ratio: 5/4)").matches) {
    var lines = Array.prototype.slice.call(typed.children).map(function (s) { return s.textContent; });
    var spans = Array.prototype.slice.call(typed.children);
    var caret = document.createElement("span"); caret.className = "b-caret";
    var run = function () {
      spans.forEach(function (s) { s.textContent = ""; });
      typed.classList.add("typing");
      var li = 0, ci = 0;
      var tick = function () {
        if (li >= lines.length) { setTimeout(function () { caret.remove(); }, 2600); return; }
        var ch = lines[li].charAt(ci++);
        spans[li].textContent = lines[li].slice(0, ci);
        spans[li].appendChild(caret);
        var wait = 34 + Math.random() * 38;
        if (ch === "…" || ch === ".") wait = 420;
        else if (ch === "," || ch === " ") wait += 30;
        if (ci >= lines[li].length) { li++; ci = 0; wait = Math.max(wait, 520); }
        setTimeout(tick, wait);
      };
      tick();
    };
    if (root.classList.contains("intro")) {
      var mo = new MutationObserver(function () {
        if (root.classList.contains("intro-leaving") || !root.classList.contains("intro")) { mo.disconnect(); setTimeout(run, 1400); }
      });
      mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    } else setTimeout(run, 700);
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
        if (state.type) q.set("tipus", state.type);
        if (state.style) q.set("stilus", state.style);
        if (state.view === "list") q.set("nezet", "lista");
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
      if (valid("type", params.get("tipus"))) press("type", params.get("tipus"));
      if (valid("style", params.get("stilus"))) press("style", params.get("stilus"));
      if (params.get("nezet") === "lista") state.view = "list";
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
