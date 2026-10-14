/* Kertvéllesy — progresszív kiegészítések. JS nélkül is minden tartalom elérhető. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- képek: a domináns szín áll a helyén, betöltéskor beúszik (hibánál is megjelenik) --- */
  document.querySelectorAll("img.lz").forEach(function (img) {
    var done = function () { img.classList.add("ok"); };
    if (img.complete) done();
    else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
  });

  /* --- világos / sötét mód (alapból világos; a választás a böngészőben megmarad) --- */
  var themeBtn = document.querySelector(".theme-toggle");
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  var applyTheme = function (dark) {
    var root = document.documentElement;
    if (dark) root.dataset.theme = "dark"; else delete root.dataset.theme;
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(dark));
      themeBtn.querySelector(".vh").textContent = dark ? "Világos mód" : "Sötét mód";
      themeBtn.title = dark ? "Világos mód" : "Sötét mód";
    }
    if (metaTheme) metaTheme.setAttribute("content", dark ? "#151613" : "#F5F3EE");
  };
  applyTheme(document.documentElement.dataset.theme === "dark");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var dark = document.documentElement.dataset.theme !== "dark";
    var root = document.documentElement;
    // az egész oldal egyetlen lágy áttűnéssel vált (View Transitions); ahol nincs ilyen, színátmenet.
    // Csak halványítás, elmozdulás nincs — ezért csökkentett mozgás beállítás mellett is lefut.
    if (document.startViewTransition) {
      root.classList.add("theme-vt");
      var t = document.startViewTransition(function () { applyTheme(dark); });
      t.finished.then(function () { root.classList.remove("theme-vt"); }, function () { root.classList.remove("theme-vt"); });
    } else {
      root.classList.add("theme-anim");
      applyTheme(dark);
      setTimeout(function () { root.classList.remove("theme-anim"); }, 1050);
    }
    try { localStorage.setItem("kv-theme", dark ? "dark" : "light"); } catch (err) { /* privát mód */ }
  });

  /* --- fejléc árnyékvonal görgetéskor --- */
  var head = document.querySelector(".site-head");
  if (head) {
    var onScroll = function () { head.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* --- mobil menü --- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("fomenu");
  if (toggle && nav) {
    var setOpen = function (open, viaKeyboard) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".nav-toggle-label").textContent = open ? "Bezárás" : "Menü";
      nav.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
      // a láthatóság csak a következő képkockában vált át — addig nem fókuszálható
      if (open) setTimeout(function () { var a = nav.querySelector("a"); if (a) a.focus({ focusVisible: !!viaKeyboard }); }, 60);
    };
    toggle.addEventListener("click", function (ev) { setOpen(toggle.getAttribute("aria-expanded") !== "true", ev.detail === 0); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  /* --- almenük: asztalin lenyíló panel (egér: késleltetett hover, billentyű: gomb),
         mobilon harmonika a teljes képernyős menüben --- */
  var items = Array.prototype.slice.call(document.querySelectorAll(".nav-item"));
  if (items.length) {
    var desktop = window.matchMedia("(min-width: 861px)");
    var hoverable = window.matchMedia("(hover: hover)");
    var dim = document.createElement("div");
    dim.className = "page-dim";
    document.body.appendChild(dim);
    var timer = null;

    var setSub = function (item, open) {
      item.classList.toggle("open", open);
      item.querySelector(".sub-toggle").setAttribute("aria-expanded", String(open));
    };
    var closeAll = function (except) {
      items.forEach(function (it) { if (it !== except) setSub(it, false); });
      var any = items.some(function (it) { return it.classList.contains("open"); });
      dim.classList.toggle("on", any && desktop.matches);
      if (head) head.classList.toggle("sub-open", any && desktop.matches);
    };
    var openOne = function (item) { closeAll(item); setSub(item, true); closeAll(item); };

    items.forEach(function (item) {
      var btn = item.querySelector(".sub-toggle");
      btn.addEventListener("click", function () {
        var willOpen = !item.classList.contains("open");
        if (desktop.matches) { if (willOpen) openOne(item); else { setSub(item, false); closeAll(); } }
        else setSub(item, willOpen);  // mobilon több is nyitva maradhat
      });
      item.addEventListener("mouseenter", function () {
        if (!desktop.matches || !hoverable.matches) return;
        clearTimeout(timer);
        var anyOpen = items.some(function (it) { return it.classList.contains("open"); });
        timer = setTimeout(function () { openOne(item); }, anyOpen ? 0 : 90);
      });
      item.addEventListener("mouseleave", function () {
        if (!desktop.matches || !hoverable.matches) return;
        clearTimeout(timer);
        timer = setTimeout(function () { setSub(item, false); closeAll(); }, 220);
      });
      item.addEventListener("focusout", function (ev) {
        if (desktop.matches && !item.contains(ev.relatedTarget)) { setSub(item, false); closeAll(); }
      });
      item.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && item.classList.contains("open")) {
          ev.stopPropagation();
          setSub(item, false); closeAll(); btn.focus();
        }
      });
      // azonos oldalon belüli horgonyra kattintva záródjon a menü
      item.querySelectorAll(".subnav a").forEach(function (a) {
        a.addEventListener("click", function () {
          closeAll();
          setSub(item, false);
          if (nav && nav.classList.contains("open") && toggle) toggle.click();
        });
      });
    });
    dim.addEventListener("click", function () { closeAll(); });
    document.addEventListener("click", function (ev) {
      if (desktop.matches && !ev.target.closest(".nav-item")) closeAll();
    });
    desktop.addEventListener("change", function () { items.forEach(function (it) { setSub(it, false); }); closeAll(); });
  }

  /* --- oldalak közötti átnövés (View Transitions): csak a megkattintott kártya képe kap nevet,
         így egyetlen kép nő át a projektoldal fő képévé; visszafelé a saját kártyájába húzódik --- */
  if (!reduce && "onpagereveal" in window) {
    var VT = "proj-lead";
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest(".card a, .hero-img");
      if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      var img = a.querySelector("img");
      if (img) img.style.viewTransitionName = VT;
    });
    // projektoldalról vissza: a lista/kezdőlap azon kártyája kapja a nevet, ahonnan jöttünk
    var proj = document.querySelector(".project[data-slug]");
    if (proj) { try { sessionStorage.setItem("kv-last", proj.getAttribute("data-slug")); } catch (err) { /* */ } }
    window.addEventListener("pagereveal", function (ev) {
      if (!ev.viewTransition || proj) return;
      var last = null;
      try { last = sessionStorage.getItem("kv-last"); } catch (err) { /* */ }
      var card = last && document.querySelector('.card[data-slug="' + last + '"] img');
      if (!card) return;
      card.style.viewTransitionName = VT;
      ev.viewTransition.finished.then(function () { card.style.viewTransitionName = ""; });
    });
    // böngésző „vissza”: a régi oldal képe ne maradjon névvel (bfcache)
    window.addEventListener("pageshow", function () {
      document.querySelectorAll('.card img, .hero-img img').forEach(function (i) { i.style.viewTransitionName = ""; });
    });
  }

  /* --- megjelenés görgetéskor --- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- referencia-szűrő --- */
  var grid = document.querySelector(".project-grid:not(.related-grid)");
  var filters = document.querySelector(".filters");
  if (grid && filters) {
    filters.hidden = false;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    var state = { type: "", style: "" };
    var countEl = filters.querySelector("[data-count]");
    var empty = document.querySelector(".empty-state");

    // ritmus: [széles + magas] [3 egyforma] [magas + széles] — csak a látható elemekre
    var PATTERN = ["is-wide", "is-tall", "", "", "", "is-tall", "is-wide"];
    var layout = function (visible) {
      visible.forEach(function (c, i) {
        c.classList.remove("is-wide", "is-tall");
        var k = PATTERN[i % PATTERN.length];
        if (k && visible.length > 3) c.classList.add(k);
      });
    };

    var apply = function () {
      var visible = [];
      cards.forEach(function (c) {
        var tags = " " + c.getAttribute("data-tags") + " ";
        var ok = (!state.type || tags.indexOf(" " + state.type + " ") > -1) &&
                 (!state.style || tags.indexOf(" " + state.style + " ") > -1);
        c.classList.toggle("is-hidden", !ok);
        if (ok) visible.push(c);
      });
      layout(visible);
      countEl.textContent = visible.length;
      empty.hidden = visible.length > 0;
      try {
        var q = new URLSearchParams();
        if (state.type) q.set("tipus", state.type);
        if (state.style) q.set("stilus", state.style);
        var s = q.toString();
        history.replaceState(null, "", s ? "?" + s : location.pathname);
      } catch (err) { /* file:// vagy régi böngésző */ }
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
      var b = ev.target.closest(".pill");
      if (!b) return;
      press(b.getAttribute("data-filter"), b.getAttribute("data-value"));
      apply();
    });
    filters.querySelectorAll("[data-filter-select]").forEach(function (sel) {
      sel.addEventListener("change", function () { press(sel.getAttribute("data-filter-select"), sel.value); apply(); });
    });
    var reset = document.querySelector("[data-reset]");
    if (reset) reset.addEventListener("click", function () { press("type", ""); press("style", ""); apply(); });

    try {
      var params = new URLSearchParams(location.search);
      var valid = function (name, v) { return v && filters.querySelector('[data-filter="' + name + '"][data-value="' + CSS.escape(v) + '"]'); };
      if (valid("type", params.get("tipus"))) press("type", params.get("tipus"));
      if (valid("style", params.get("stilus"))) press("style", params.get("stilus"));
    } catch (err) { /* ignore */ }
    apply();
  }

  /* --- képnézegető a projektoldalon --- */
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
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        opener = a;
        show(i);
        dlg.showModal();
      });
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
    // érintés: vízszintes söprés
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
