/* lightHouse* — menu + bookings
   Storage resolves in this order: the artifact db capability, a local API, then this browser only. */
(function () {
  "use strict";

  /* ============================================================ MENU DATA */
  var MENU = [
    { c: "espresso", n: "Espresso", d: "Two ristretto shots pulled on the lever, 1:2 in 28 seconds.", p: 160, t: ["v"] },
    { c: "espresso", n: "Macchiato", d: "Espresso marked with a spoon of dense milk foam.", p: 180, t: ["v"] },
    { c: "espresso", n: "Cortado", d: "Equal parts espresso and steamed milk, served in glass.", p: 210, t: ["v"] },
    { c: "espresso", n: "Cappuccino", d: "Six ounces, wet foam, dusted only if you ask.", p: 250, t: ["v"] },
    { c: "espresso", n: "Flat white", d: "House blend, microfoam poured thin. Our most-ordered cup.", p: 260, t: ["v"], s: 1 },
    { c: "espresso", n: "Iced latte", d: "Double shot over milk and hand-cut ice.", p: 280, t: ["v"] },
    { c: "espresso", n: "Mocha", d: "70% single-origin chocolate, stirred through, not sauced.", p: 300, t: ["v"] },
    { c: "espresso", n: "Affogato", d: "Vanilla bean ice cream drowned in a fresh double.", p: 320, t: ["v", "gf"] },

    { c: "brew", n: "V60, single origin", d: "Rotating lot. Today: washed Ethiopian, jasmine and stone fruit.", p: 290, t: ["vg", "gf"], s: 1 },
    { c: "brew", n: "Aeropress", d: "Inverted, two minutes, pressed short. Heavier body.", p: 280, t: ["vg", "gf"] },
    { c: "brew", n: "Cold brew", d: "Eighteen hours, coarse ground, served over a single rock.", p: 270, t: ["vg", "gf"] },
    { c: "brew", n: "Batch filter", d: "Brewed every forty minutes. Free refill before noon.", p: 190, t: ["vg", "gf"] },
    { c: "brew", n: "Espresso tonic", d: "Tonic, citrus oil, a double poured over the top.", p: 310, t: ["vg", "gf"] },

    { c: "other", n: "Ceremonial matcha", d: "Whisked thin, served with milk on the side.", p: 320, t: ["vg", "gf"] },
    { c: "other", n: "Masala chai", d: "Boiled, not brewed. Ginger-heavy, as it should be.", p: 150, t: ["v", "gf"] },
    { c: "other", n: "Dark hot chocolate", d: "Melted single-origin, barely sweetened.", p: 280, t: ["v", "gf"] },
    { c: "other", n: "Citrus cooler", d: "Pressed lime, orange, a little salt and soda.", p: 220, t: ["vg", "gf"] },
    { c: "other", n: "House kombucha", d: "Brewed down the road. Ask what's on.", p: 240, t: ["vg", "gf"] },

    { c: "plates", n: "Mushroom toast", d: "Butter-roasted mushrooms, thyme, sourdough, leaves and pomegranate.", p: 420, t: ["v"], s: 1 },
    { c: "plates", n: "Big breakfast", d: "Two eggs, roast tomato, greens, sausage or halloumi, sourdough.", p: 520, t: [] },
    { c: "plates", n: "Shakshuka", d: "Slow tomato, soft eggs, feta, bread to push it around with.", p: 450, t: ["v"] },
    { c: "plates", n: "Grain bowl", d: "Barley, roast pumpkin, herbs, tahini, seeds.", p: 440, t: ["vg"] },
    { c: "plates", n: "Chilli cheese toastie", d: "Three cheeses, green chilli, pressed hard.", p: 380, t: ["v"] },
    { c: "plates", n: "Avocado on rye", d: "Smashed avocado, chilli oil, lime, toasted seeds.", p: 390, t: ["vg"] },
    { c: "plates", n: "Soup of the day", d: "Whatever the market gave us, with bread.", p: 320, t: ["vg"] },

    { c: "bakes", n: "Butter croissant", d: "Laminated over three days. Out of the oven at seven.", p: 180, t: ["v"] },
    { c: "bakes", n: "Almond danish", d: "Frangipane, flaked almonds, a lot of sugar.", p: 240, t: ["v", "n"] },
    { c: "bakes", n: "Banana bread", d: "Toasted, with salted butter.", p: 190, t: ["v"] },
    { c: "bakes", n: "Cinnamon roll", d: "Cardamom in the dough, iced while warm.", p: 260, t: ["v"] },
    { c: "bakes", n: "Basque cheesecake", d: "Burnt top, barely set middle.", p: 320, t: ["v", "gf"], s: 1 },
    { c: "bakes", n: "Flourless chocolate cake", d: "Dense, dark, a spoon of cream.", p: 300, t: ["v", "gf"] },

    { c: "retail", n: "250g single origin", d: "Roasted Tuesday. Whole bean or ground to your brewer.", p: 750, t: [] },
    { c: "retail", n: "250g house blend", d: "Brazil and Ethiopia. Sweet, forgiving, good with milk.", p: 600, t: [] },
    { c: "retail", n: "Filter papers, 100", d: "Bleached, size 02.", p: 350, t: [] },
    { c: "retail", n: "Ceramic dripper", d: "Our house cone, fired locally.", p: 1400, t: [] }
  ];
  var CATS = [
    { k: "espresso", label: "Espresso bar", blurb: "Pulled on the lever, 1:2 in twenty-eight seconds. Milk steamed to order, never twice.", icon: "cup" },
    { k: "brew", label: "Brew bar", blurb: "Brewed by hand, one cup at a time. Ask what landed this week and we will talk you through it.", icon: "cone" },
    { k: "other", label: "Not coffee", blurb: "For the other half of the table. Whisked, boiled or pressed, all made the long way.", icon: "leaf" },
    { k: "plates", label: "All-day plates", blurb: "Breakfast has no closing time here. Full menu from the shutter going up until quarter past ten.", icon: "plate" },
    { k: "bakes", label: "Wholesome bakes", blurb: "Out of the oven at seven, restocked once at noon, gone when they are gone.", icon: "bake" },
    { k: "retail", label: "Take home", blurb: "Roasted Tuesday, ground to your brewer, or the kit to do it properly yourself.", icon: "bag" }
  ];
  var DIETS = [{ k: "vg", label: "Vegan" }, { k: "v", label: "Vegetarian" }, { k: "gf", label: "Gluten free" }];
  var TAGNAME = { v: "Veg", vg: "Vegan", gf: "GF", n: "Nuts" };

  var ICONS = {
    cup: '<path d="M5 9h12v5a6 6 0 0 1-12 0z"/><path d="M17 10h2.5a2.5 2.5 0 0 1 0 5H17"/><path d="M7 5.5V3M11 5.5V3M15 5.5V3"/><path d="M3 21h16"/>',
    cone: '<path d="M4 6h16l-6 9h-4z"/><path d="M12 15v4"/><path d="M8 21h8"/><path d="M4 6c3 1.6 13 1.6 16 0"/>',
    leaf: '<path d="M20 4c0 9-5 14-12 14H5c0-8 6-13 15-14z"/><path d="M4 21c2-5 5-8 9-10"/>',
    plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/>',
    bake: '<path d="M3 15c3-7 15-7 18 0-3 3-15 3-18 0z"/><path d="M8 13.4 6.5 8M12 12.8V7M16 13.4 17.5 8"/>',
    bag: '<path d="M6 8h12l-1.2 12H7.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M6 11h12"/>'
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };

  /* ============================================================ MENU: THE SIDEWAYS RAIL */
  (function menu() {
    var rail = $("#menuRail"), nav = $("#menuNav");
    if (!rail) return;
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var panels = [];

    CATS.forEach(function (c, i) {
      var items = MENU.filter(function (m) { return m.c === c.k; });
      var lis = items.map(function (it) {
        var badge = it.s ? '<span class="badge badge--star">House</span>'
                  : it.t.indexOf("vg") > -1 ? '<span class="badge">Vegan</span>'
                  : it.t.indexOf("v") > -1 ? '<span class="badge">Veg</span>' : "";
        return '<li><div class="row"><b>' + esc(it.n) + "</b>" + badge +
               '<i class="lead"></i><span class="p">₹' + it.p + "</span></div>" +
               '<p class="row__d">' + esc(it.d) + "</p></li>";
      }).join("");

      var p = el("article", "panel",
        '<span class="panel__no" aria-hidden="true">' + pad(i + 1) + "</span>" +
        '<p class="panel__k">' + pad(i + 1) + " &mdash; " + esc(c.label) + "</p>" +
        '<svg class="panel__icon" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[c.icon] + "</svg>" +
        "<h3>" + esc(c.label) + "</h3>" +
        '<p class="panel__d">' + esc(c.blurb) + "</p>" +
        '<ul class="panel__list">' + lis + "</ul>");
      p.id = "sec-" + c.k;
      rail.appendChild(p);
      panels.push(p);

      var a = el("a", "menunav__a", esc(c.label));
      a.href = "#sec-" + c.k;
      a.dataset.sec = c.k;
      nav.appendChild(a);
    });

    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var wide = innerWidth > 820 && !reduced;
    var st = null;

    function mark(i) {
      nav.querySelectorAll(".menunav__a").forEach(function (a, n) { a.classList.toggle("is-on", n === i); });
      var on = nav.children[i];
      if (on && nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({ left: on.offsetLeft - nav.clientWidth / 2 + on.offsetWidth / 2, behavior: "smooth" });
      }
    }

    if (wide && window.gsap && window.ScrollTrigger) {
      var dist = function () { return Math.max(1, rail.scrollWidth - innerWidth); };
      var tw = gsap.to(rail, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: {
          trigger: ".menu", start: "top top",
          end: function () { return "+=" + (dist() + innerHeight * .8); },
          pin: ".menu__pin", scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            var x = self.progress * dist(), centre = x + innerWidth / 2, best = 0, bd = 1e9;
            panels.forEach(function (p, n) {
              var c = p.offsetLeft + p.offsetWidth / 2, d = Math.abs(c - centre);
              if (d < bd) { bd = d; best = n; }
            });
            mark(best);
          }
        }
      });
      st = tw.scrollTrigger;

      /* panels lean in as they come across */
      panels.forEach(function (p) {
        gsap.fromTo(p, { rotateY: 13, scale: .93, opacity: .3 }, {
          rotateY: 0, scale: 1, opacity: 1, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: tw, start: "left right", end: "left 62%", scrub: true }
        });
        gsap.fromTo(p.querySelector(".panel__no"), { y: 40 }, {
          y: -40, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: tw, start: "left right", end: "right left", scrub: true }
        });
      });

      nav.addEventListener("click", function (ev) {
        var a = ev.target.closest(".menunav__a");
        if (!a) return;
        ev.preventDefault();
        var p = document.getElementById("sec-" + a.dataset.sec);
        if (!p || !st) return;
        var want = Math.min(1, Math.max(0, (p.offsetLeft - 40) / dist()));
        var to = st.start + want * (st.end - st.start);
        if (window.__lhLenis) window.__lhLenis.scrollTo(to, { duration: 1.3 });
        else window.scrollTo({ top: to, behavior: "smooth" });
      });
    } else {
      /* narrow screens, or reduced motion: the rail is just a swipeable strip */
      rail.classList.add("is-swipe");
      nav.addEventListener("click", function (ev) {
        var a = ev.target.closest(".menunav__a");
        if (!a) return;
        ev.preventDefault();
        var p = document.getElementById("sec-" + a.dataset.sec);
        if (p) rail.scrollTo({ left: p.offsetLeft - 20, behavior: reduced ? "auto" : "smooth" });
      });
      var t = false;
      rail.addEventListener("scroll", function () {
        if (t) return;
        t = true;
        requestAnimationFrame(function () {
          var centre = rail.scrollLeft + rail.clientWidth / 2, best = 0, bd = 1e9;
          panels.forEach(function (p, n) {
            var c = p.offsetLeft + p.offsetWidth / 2, d = Math.abs(c - centre);
            if (d < bd) { bd = d; best = n; }
          });
          mark(best); t = false;
        });
      }, { passive: true });
    }
    mark(0);
  })();

  /* ============================================================ FLOATING BOOK BUTTON */
  (function fab() {
    var fab = document.querySelector(".fab");
    if (!fab) return;
    var hero = document.querySelector(".hero"), book = document.getElementById("book");
    function place() {
      var pastHero = hero ? hero.getBoundingClientRect().bottom < 90 : scrollY > 400;
      var atBook = false;
      if (book) {
        var r = book.getBoundingClientRect();
        atBook = r.top < innerHeight * .75 && r.bottom > 120;
      }
      fab.classList.toggle("is-out", !pastHero || atBook);
    }
    place();
    addEventListener("scroll", place, { passive: true });
    addEventListener("resize", place);
    fab.addEventListener("click", function (ev) {
      if (!book) return;
      ev.preventDefault();
      if (window.__lhLenis) window.__lhLenis.scrollTo(book, { offset: -70, duration: 1.4 });
      else book.scrollIntoView({ behavior: "smooth" });
    });
  })();

  /* ============================================================ STORAGE */
  var HOURS = { 0: [9, 23], 1: [8, 23], 2: [8, 23], 3: [8, 23], 4: [8, 23], 5: [8, 24], 6: [8, 24] };
  var CAPACITY = 14;          /* seats bookable per half hour */
  var LAST_SEATING = 1.5;     /* hours before close */

  var Store = {
    mode: "local", db: null, user: null,
    async init() {
      if (window.claude && claude.use) {
        try {
          var db = await Promise.race([claude.use("db"), new Promise(function (r) { setTimeout(function () { r(null); }, 4000); })]);
          if (db) { this.db = db; this.mode = "db"; try { this.user = await claude.use("user"); } catch (e) {} return this.mode; }
        } catch (e) {}
      }
      try {
        var c = new AbortController(); setTimeout(function () { c.abort(); }, 1200);
        var r = await fetch("/api/health", { signal: c.signal });
        if (r.ok) { this.mode = "api"; return this.mode; }
      } catch (e) {}
      this.mode = "local";
      return this.mode;
    },
    async taken(dateKey) {
      if (this.mode === "db") {
        try {
          var doc = await this.db.doc("slots/" + dateKey).get();
          return (doc && doc.data && doc.data.seats) || {};
        } catch (e) { return {}; }
      }
      if (this.mode === "api") {
        try {
          var r = await fetch("/api/availability?date=" + encodeURIComponent(dateKey));
          if (r.ok) return (await r.json()).seats || {};
        } catch (e) {}
        return {};
      }
      return (this.readLocal().seats || {})[dateKey] || {};
    },
    async book(b) {
      if (this.mode === "db") {
        var id = b.ref;
        await this.db.collection("bookings").doc(id).set(b);
        var key = b.date, ref = this.db.doc("slots/" + key);
        var cur = {};
        try { var d = await ref.get(); cur = (d && d.data && d.data.seats) || {}; } catch (e) {}
        cur[b.time] = (cur[b.time] || 0) + b.party;
        await ref.set({ seats: cur, date: key });
        return b;
      }
      if (this.mode === "api") {
        var r = await fetch("/api/bookings", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b)
        });
        if (!r.ok) throw new Error((await r.json().catch(function () { return {}; })).error || "Could not save the booking");
        return await r.json();
      }
      var s = this.readLocal();
      s.list = s.list || []; s.seats = s.seats || {};
      s.list.push(b);
      s.seats[b.date] = s.seats[b.date] || {};
      s.seats[b.date][b.time] = (s.seats[b.date][b.time] || 0) + b.party;
      try { localStorage.setItem("lh-bookings", JSON.stringify(s)); } catch (e) {}
      return b;
    },
    readLocal() { try { return JSON.parse(localStorage.getItem("lh-bookings") || "{}"); } catch (e) { return {}; } }
  };

  /* ============================================================ BOOKING UI */
  (function booking() {
    var sec = $("#book");
    if (!sec) return;
    var S = { step: 0, party: 2, date: null, time: null, max: 4 };
    var steps = Array.prototype.slice.call(sec.querySelectorAll(".step"));
    var dots = $("#bookSteps"), status = $("#bookStatus"), sum = $("#bookSummary");
    var backBtn = $("#bookBack"), nextBtn = $("#bookNext");

    var pad = function (n) { return String(n).padStart(2, "0"); };
    var keyOf = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
    var DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var fmtTime = function (t) { return t; };

    /* party */
    var partyWrap = $("#partyChips");
    for (var i = 1; i <= 8; i++) (function (n) {
      var b = el("button", "chip chip--num" + (n === 2 ? " is-on" : ""), String(n));
      b.type = "button";
      b.addEventListener("click", function () {
        S.party = n; S.time = null;
        partyWrap.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        paintSummary();
      });
      partyWrap.appendChild(b);
    })(i);

    /* dates */
    var dateWrap = $("#dateStrip");
    var today = new Date(); today.setHours(0, 0, 0, 0);
    for (var k = 0; k < 21; k++) (function (off) {
      var d = new Date(today.getTime() + off * 86400000);
      var b = el("button", "datebtn",
        '<span class="datebtn__d">' + DAY[d.getDay()] + "</span>" +
        '<span class="datebtn__n">' + d.getDate() + "</span>" +
        '<span class="datebtn__m">' + MON[d.getMonth()] + "</span>");
      b.type = "button"; b.dataset.key = keyOf(d);
      if (off === 0) b.classList.add("is-today");
      b.addEventListener("click", function () {
        S.date = b.dataset.key; S.time = null;
        dateWrap.querySelectorAll(".datebtn").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        paintSummary();
      });
      dateWrap.appendChild(b);
    })(k);

    function slotsFor(dateKey) {
      var d = new Date(dateKey + "T00:00:00");
      var h = HOURS[d.getDay()], out = [];
      var endH = h[1] - LAST_SEATING;
      for (var t = h[0]; t <= endH + 0.001; t += .5) {
        out.push(pad(Math.floor(t)) + ":" + (t % 1 ? "30" : "00"));
      }
      return out;
    }

    var slotWrap = $("#slotGrid"), slotNote = $("#slotNote");
    async function paintSlots() {
      slotWrap.textContent = "";
      slotNote.textContent = "Checking the book…";
      var taken = await Store.taken(S.date);
      var now = new Date(), isToday = S.date === keyOf(now);
      var list = slotsFor(S.date), open = 0;
      list.forEach(function (t) {
        var used = taken[t] || 0, left = CAPACITY - used;
        var past = isToday && (parseInt(t, 10) * 60 + parseInt(t.slice(3), 10)) <= now.getHours() * 60 + now.getMinutes() + 45;
        var ok = left >= S.party && !past;
        if (ok) open++;
        var b = el("button", "slot" + (ok ? "" : " is-off"),
          "<b>" + t + "</b><small>" + (past ? "passed" : left <= 0 ? "full" : left + " seats") + "</small>");
        b.type = "button"; b.disabled = !ok;
        b.addEventListener("click", function () {
          S.time = t;
          slotWrap.querySelectorAll(".slot").forEach(function (x) { x.classList.toggle("is-on", x === b); });
          paintSummary();
        });
        slotWrap.appendChild(b);
      });
      slotNote.textContent = open
        ? open + " sittings open for " + S.party + (S.party > 1 ? " people" : " person") + " · tables are held 15 minutes"
        : "Nothing left that day for " + S.party + ". Try another date, or call us.";
    }

    function paintSummary() {
      if (!sum) return;
      var d = S.date ? new Date(S.date + "T00:00:00") : null;
      sum.innerHTML =
        '<div><dt>Party</dt><dd>' + S.party + (S.party > 1 ? " people" : " person") + "</dd></div>" +
        "<div><dt>Date</dt><dd>" + (d ? DAY[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()] : "—") + "</dd></div>" +
        "<div><dt>Time</dt><dd>" + (S.time ? fmtTime(S.time) : "—") + "</dd></div>";
      if (nextBtn) nextBtn.disabled = !canAdvance();
    }

    function canAdvance() {
      if (S.step === 0) return !!S.party;
      if (S.step === 1) return !!S.date;
      if (S.step === 2) return !!S.time;
      return true;
    }

    function show(n) {
      var prev = S.step;
      S.step = n;
      steps.forEach(function (s, i) { s.hidden = i !== n; });
      if (dots) dots.querySelectorAll("li").forEach(function (li, i) {
        li.classList.toggle("is-on", i === n); li.classList.toggle("is-done", i < n);
      });
      if (backBtn) backBtn.hidden = n === 0 || n === 4;
      if (nextBtn) {
        nextBtn.hidden = n === 4;
        nextBtn.querySelector("span").textContent = n === 3 ? "Confirm booking" : "Continue";
      }
      if (n === 2) paintSlots();
      paintSummary();
      var panel = steps[n];
      if (panel && window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(panel, { opacity: 0, x: n > prev ? 34 : -34 },
          { opacity: 1, x: 0, duration: .5, ease: "power3.out" });
      }
    }

    if (backBtn) backBtn.addEventListener("click", function () { show(Math.max(0, S.step - 1)); });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      if (S.step < 3) { if (canAdvance()) show(S.step + 1); return; }
      submit();
    });

    var form = $("#bookForm");
    function fieldError(input, msg) {
      var wrap = input.closest(".field");
      var e = wrap.querySelector(".err");
      if (!e) { e = el("span", "err"); wrap.appendChild(e); }
      e.textContent = msg || "";
      wrap.classList.toggle("has-err", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }

    async function submit() {
      var name = $("#bName"), phone = $("#bPhone"), mail = $("#bMail"), note = $("#bNote");
      var ok = true;
      ok = fieldError(name, name.value.trim().length < 2 ? "Tell us who the table is for." : "") && ok;
      ok = fieldError(phone, phone.value.replace(/\D/g, "").length < 7 ? "A number we can reach you on." : "") && ok;
      ok = fieldError(mail, mail.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value) ? "That address looks off." : "") && ok;
      if (!ok) return;

      nextBtn.disabled = true;
      nextBtn.querySelector("span").textContent = "Saving…";
      var ref = "LH-" + Date.now().toString(36).toUpperCase().slice(-5) +
                "-" + Math.random().toString(36).toUpperCase().slice(2, 4);
      var payload = {
        ref: ref, party: S.party, date: S.date, time: S.time,
        name: name.value.trim(), phone: phone.value.trim(),
        email: mail.value.trim(), note: note.value.trim(),
        placed: new Date().toISOString()
      };
      try {
        await Store.book(payload);
        var d = new Date(S.date + "T00:00:00");
        $("#doneRef").textContent = ref;
        $("#doneLine").textContent = S.party + (S.party > 1 ? " people" : " person") + " · " +
          DAY[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()] + " · " + S.time;
        $("#doneName").textContent = payload.name;
        show(4);
        if (window.gsap) gsap.fromTo("#doneRef", { scale: .7, opacity: 0 },
          { scale: 1, opacity: 1, duration: .8, ease: "back.out(2)" });
      } catch (e) {
        status.textContent = "That didn't save: " + (e && e.message ? e.message : "try again, or call us.");
        status.className = "book__status is-bad";
      } finally {
        nextBtn.disabled = false;
        nextBtn.querySelector("span").textContent = "Confirm booking";
      }
    }

    var again = $("#bookAgain");
    if (again) again.addEventListener("click", function () {
      S.time = null; if (form) form.reset();
      sec.querySelectorAll(".field.has-err").forEach(function (f) { f.classList.remove("has-err"); });
      show(0);
    });

    /* storage mode, shown plainly */
    Store.init().then(function (mode) {
      if (!status) return;
      if (mode === "db") { status.textContent = "Connected · bookings reach the cafe"; status.className = "book__status is-live"; }
      else if (mode === "api") { status.textContent = "Connected to the local booking service"; status.className = "book__status is-live"; }
      else { status.textContent = "Offline demo · this booking is kept in your browser only"; status.className = "book__status"; }
    });

    show(0);
  })();
})();
