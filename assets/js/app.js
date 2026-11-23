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
    { k: "all", label: "Everything" }, { k: "espresso", label: "Espresso bar" },
    { k: "brew", label: "Brew bar" }, { k: "other", label: "Not coffee" },
    { k: "plates", label: "All-day plates" }, { k: "bakes", label: "Wholesome bakes" },
    { k: "retail", label: "Take home" }
  ];
  var DIETS = [{ k: "vg", label: "Vegan" }, { k: "v", label: "Vegetarian" }, { k: "gf", label: "Gluten free" }];
  var TAGNAME = { v: "Veg", vg: "Vegan", gf: "GF", n: "Nuts" };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };

  /* ============================================================ MENU UI */
  (function menu() {
    var grid = $("#menuGrid"), cats = $("#catChips"), diets = $("#dietChips"),
        search = $("#menuSearch"), count = $("#menuCount"), empty = $("#menuEmpty");
    if (!grid) return;
    var state = { cat: "all", diet: [], q: "" };

    CATS.forEach(function (c) {
      var b = el("button", "chip" + (c.k === "all" ? " is-on" : ""), esc(c.label));
      b.type = "button"; b.dataset.cat = c.k;
      b.addEventListener("click", function () {
        state.cat = c.k;
        cats.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        render();
      });
      cats.appendChild(b);
    });
    DIETS.forEach(function (d) {
      var b = el("button", "chip chip--diet", esc(d.label));
      b.type = "button"; b.dataset.diet = d.k;
      b.addEventListener("click", function () {
        var i = state.diet.indexOf(d.k);
        if (i > -1) state.diet.splice(i, 1); else state.diet.push(d.k);
        b.classList.toggle("is-on");
        render();
      });
      diets.appendChild(b);
    });
    if (search) search.addEventListener("input", function () { state.q = search.value.trim().toLowerCase(); render(); });
    var clear = $("#clearFilters");
    if (clear) clear.addEventListener("click", function () {
      state = { cat: "all", diet: [], q: "" };
      if (search) search.value = "";
      cats.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("is-on", x.dataset.cat === "all"); });
      diets.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("is-on"); });
      render();
    });

    function match(it) {
      if (state.cat !== "all" && it.c !== state.cat) return false;
      for (var i = 0; i < state.diet.length; i++) {
        var d = state.diet[i];
        if (d === "v" ? !(it.t.indexOf("v") > -1 || it.t.indexOf("vg") > -1) : it.t.indexOf(d) < 0) return false;
      }
      if (state.q && (it.n + " " + it.d).toLowerCase().indexOf(state.q) < 0) return false;
      return true;
    }

    function card(it) {
      var tags = it.t.map(function (t) { return '<span class="tag">' + TAGNAME[t] + "</span>"; }).join("");
      var e = el("article", "item" + (it.s ? " item--star" : ""),
        '<div class="item__top"><h3>' + esc(it.n) + "</h3><span class=\"item__p\">" + it.p + "</span></div>" +
        '<p class="item__d">' + esc(it.d) + "</p>" +
        '<div class="item__tags">' + tags + (it.s ? '<span class="tag tag--star">Signature</span>' : "") + "</div>");
      e.dataset.key = it.n;
      return e;
    }

    var first = true;
    function render() {
      /* FLIP: measure, mutate, invert, play */
      var before = {};
      if (!first) grid.querySelectorAll(".item").forEach(function (n) { before[n.dataset.key] = n.getBoundingClientRect(); });

      var list = MENU.filter(match);
      grid.textContent = "";
      var byCat = {};
      list.forEach(function (it) { (byCat[it.c] = byCat[it.c] || []).push(it); });
      CATS.forEach(function (c) {
        if (c.k === "all" || !byCat[c.k]) return;
        var g = el("div", "group");
        g.appendChild(el("h4", "group__h", esc(c.label) + '<span>' + byCat[c.k].length + "</span>"));
        var inner = el("div", "group__items");
        byCat[c.k].forEach(function (it) { inner.appendChild(card(it)); });
        g.appendChild(inner);
        grid.appendChild(g);
      });

      if (count) count.textContent = list.length;
      if (empty) empty.hidden = list.length > 0;

      if (!first && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        grid.querySelectorAll(".item").forEach(function (n, i) {
          var b = before[n.dataset.key], a = n.getBoundingClientRect();
          if (b) {
            var dx = b.left - a.left, dy = b.top - a.top;
            if (dx || dy) {
              n.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }],
                { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" });
            }
          } else {
            n.animate([{ opacity: 0, transform: "translateY(18px) scale(.97)" }, { opacity: 1, transform: "none" }],
              { duration: 460, delay: Math.min(i * 22, 260), easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
          }
        });
      }
      first = false;
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
    render();
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
