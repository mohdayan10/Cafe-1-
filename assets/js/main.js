/* lightHouse* — motion system
   layers: GLSL beam field (three.js) · dust canvas · GSAP/ScrollTrigger · Lenis · pointer light */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = window.gsap && window.ScrollTrigger;
  var boot = document.getElementById("boot");

  /* ===================== theme ===================== */
  var lamp = document.getElementById("lamp");
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function isDark() {
    var a = root.getAttribute("data-theme");
    return a ? a === "dark" : !matchMedia("(prefers-color-scheme: light)").matches;
  }
  function paint(mode) {
    root.setAttribute("data-theme", mode);
    if (lamp) {
      lamp.setAttribute("aria-pressed", String(mode === "dark"));
      lamp.querySelector(".lamp__label").textContent = mode === "dark" ? "Daylight" : "Evening";
    }
    readPalette();
  }
  var saved = read("lh-theme");
  if (saved === "dark" || saved === "light") paint(saved);
  else if (lamp) lamp.querySelector(".lamp__label").textContent = isDark() ? "Daylight" : "Evening";
  if (lamp) lamp.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    paint(next); store("lh-theme", next);
  });

  var PAL = { bg: [.03, .04, .05], amber: [1, .69, .29], ember: [.89, .4, .24], pine: [.18, .48, .41] };
  function hex(v) {
    var c = getComputedStyle(root).getPropertyValue(v).trim();
    var m = c.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : null;
  }
  function readPalette() {
    ["bg", "amber", "ember", "pine"].forEach(function (k) {
      var c = hex("--" + k); if (c) PAL[k] = c;
    });
    if (window.__lhUniforms) {
      ["bg", "amber", "ember", "pine"].forEach(function (k) {
        window.__lhUniforms["u_" + k].value.setRGB(PAL[k][0], PAL[k][1], PAL[k][2]);
      });
    }
  }
  readPalette();

  /* ===================== GLSL: the beam field =====================
     A domain-warped noise field lit by a rotating lighthouse sweep. */
  (function gl() {
    if (reduced || !window.THREE) return;
    var cv = document.getElementById("gl");
    if (!cv) return;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: "low-power" });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight, false);

    var scene = new THREE.Scene();
    var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var U = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(innerWidth, innerHeight) },
      u_mouse: { value: new THREE.Vector2(.5, .5) },
      u_scroll: { value: 0 },
      u_bg: { value: new THREE.Color().setRGB(PAL.bg[0], PAL.bg[1], PAL.bg[2]) },
      u_amber: { value: new THREE.Color().setRGB(PAL.amber[0], PAL.amber[1], PAL.amber[2]) },
      u_ember: { value: new THREE.Color().setRGB(PAL.ember[0], PAL.ember[1], PAL.ember[2]) },
      u_pine: { value: new THREE.Color().setRGB(PAL.pine[0], PAL.pine[1], PAL.pine[2]) }
    };
    window.__lhUniforms = U;

    var frag = [
      "precision highp float;",
      "uniform float u_time,u_scroll;uniform vec2 u_res,u_mouse;",
      "uniform vec3 u_bg,u_amber,u_ember,u_pine;",
      "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);",
      " return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}",
      "float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);",
      " for(int i=0;i<5;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}",
      "void main(){",
      " vec2 uv=gl_FragCoord.xy/u_res.xy;",
      " vec2 p=(gl_FragCoord.xy-.5*u_res.xy)/u_res.y;",
      " float t=u_time*.055;",
      " vec2 q=vec2(fbm(p*1.6+t),fbm(p*1.6+vec2(5.2,1.3)-t));",
      " vec2 r=vec2(fbm(p*1.9+4.*q+vec2(1.7,9.2)+t*.7),fbm(p*1.9+4.*q+vec2(8.3,2.8)-t*.6));",
      " float f=fbm(p*1.7+4.*r);",
      /* rotating sweep, like the lamp in a lighthouse */
      " vec2 c=p-vec2((u_mouse.x-.5)*.4,(u_mouse.y-.5)*.3);",
      " float ang=atan(c.y,c.x)+u_time*.13+u_scroll*1.4;",
      " float beam=pow(max(0.,cos(ang)),22.)+.42*pow(max(0.,cos(ang+3.14159)),14.);",
      " float d=length(c);",
      " beam*=1.-smoothstep(.03,1.5,d);",
      " vec3 col=u_bg;",
      " col=mix(col,u_pine,clamp(f*f*.85,0.,1.));",
      " col=mix(col,u_ember,clamp(pow(f,3.)*1.3,0.,.55));",
      " col+=u_amber*beam*(.32+.5*f);",
      " col+=u_amber*.1*(1.-smoothstep(0.,1.2,d))*(.4+.6*f);",
      /* vignette + subtle banding break */
      " col*=1.-.55*pow(length(uv-.5)*1.25,2.2);",
      " col+=(h(gl_FragCoord.xy+u_time)-.5)*.015;",
      " gl_FragColor=vec4(col,1.);",
      "}"
    ].join("\n");

    var mat = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: "void main(){gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: frag
    });
    scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), mat));

    var vis = true, mx = .5, my = .5;
    addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth; my = 1 - e.clientY / innerHeight; }, { passive: true });
    addEventListener("resize", function () {
      renderer.setSize(innerWidth, innerHeight, false);
      U.u_res.value.set(innerWidth, innerHeight);
    });
    document.addEventListener("visibilitychange", function () { vis = !document.hidden; });

    var t0 = performance.now();
    (function tick(now) {
      requestAnimationFrame(tick);
      if (!vis) return;
      U.u_time.value = (now - t0) / 1000;
      U.u_mouse.value.x += (mx - U.u_mouse.value.x) * .04;
      U.u_mouse.value.y += (my - U.u_mouse.value.y) * .04;
      U.u_scroll.value = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
      renderer.render(scene, cam);
    })(t0);
  })();

  /* ===================== dust in the beam ===================== */
  (function dust() {
    if (reduced) return;
    var cv = document.getElementById("dust");
    if (!cv) return;
    var ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio, 2), motes = [], N = 0;
    function size() {
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      N = Math.round(Math.min(150, innerWidth * innerHeight / 14000));
      motes = [];
      for (var i = 0; i < N; i++) motes.push({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 1.7 + .35, s: Math.random() * .22 + .04,
        d: Math.random() * Math.PI * 2, o: Math.random() * .5 + .18
      });
    }
    size(); addEventListener("resize", size);
    var sc = 0;
    addEventListener("scroll", function () { sc = scrollY; }, { passive: true });
    (function draw() {
      requestAnimationFrame(draw);
      if (document.hidden) return;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      var g = getComputedStyle(root).getPropertyValue("--amber").trim() || "#FFB04A";
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.d += .006; m.x += Math.cos(m.d) * m.s; m.y -= m.s * .55;
        if (m.y < -10) { m.y = innerHeight + 10; m.x = Math.random() * innerWidth; }
        if (m.x < -10) m.x = innerWidth + 10; if (m.x > innerWidth + 10) m.x = -10;
        ctx.globalAlpha = m.o * (.4 + .6 * Math.abs(Math.sin(m.d * .5)));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m.x, (m.y + sc * .06) % (innerHeight + 20), m.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    })();
  })();

  /* ===================== cursor ===================== */
  if (fine && !reduced) {
    var glow = document.querySelector(".cursor"), ring = document.querySelector(".cursor-ring");
    if (glow && ring) {
      root.classList.add("has-cursor");
      var tx = innerWidth / 2, ty = innerHeight / 2, gx = tx, gy = ty, rx = tx, ry = ty, started = false, sc2 = 1, want = 1;
      addEventListener("pointermove", function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!started) { started = true; gx = rx = tx; gy = ry = ty; glow.style.opacity = "1"; ring.style.opacity = "1"; }
      }, { passive: true });
      addEventListener("pointerdown", function () { want = .6; });
      addEventListener("pointerup", function () { want = ring.dataset.hot === "1" ? 2.3 : 1; });
      document.addEventListener("pointerover", function (e) {
        var hot = e.target.closest("a,button,.card,.shot");
        ring.dataset.hot = hot ? "1" : "0";
        want = hot ? 2.3 : 1;
        var dot = ring.querySelector(".dot");
        dot.style.opacity = hot ? "1" : "0";
        dot.style.transform = hot ? "scale(1)" : "scale(.2)";
      });
      (function loop() {
        requestAnimationFrame(loop);
        gx += (tx - gx) * .08; gy += (ty - gy) * .08;
        rx += (tx - rx) * .24; ry += (ty - ry) * .24;
        sc2 += (want - sc2) * .16;
        glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
        ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) scale(" + sc2.toFixed(3) + ")";
      })();
    }
  }

  /* ===================== pointer light on panels ===================== */
  document.querySelectorAll(".card,.shot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  });

  /* ===================== today's hours ===================== */
  (function () {
    var li = document.querySelector('.hours li[data-day="' + new Date().getDay() + '"]');
    if (li) li.classList.add("is-today");
  })();

  /* ===================== nav + smooth scroll ===================== */
  var nav = document.querySelector(".nav"), last = 0, prog = document.getElementById("progress");
  function onScroll(y) {
    if (nav) {
      nav.classList.toggle("is-stuck", y > 40);
      nav.classList.toggle("is-hidden", y > 460 && y > last + 4);
    }
    if (prog) {
      var max = Math.max(1, document.body.scrollHeight - innerHeight);
      prog.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
    }
    last = y;
  }
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    window.__lhLenis = lenis;
    lenis.on("scroll", function (e) { onScroll(e.scroll); if (hasGSAP) ScrollTrigger.update(); });
  } else {
    addEventListener("scroll", function () { onScroll(scrollY); }, { passive: true });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      ev.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.5 });
      else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ===================== split the wordmark into characters ===================== */
  function splitChars(el) {
    var txt = el.textContent, out = "";
    for (var i = 0; i < txt.length; i++) {
      var c = txt[i] === " " ? "&nbsp;" : txt[i];
      out += '<span class="ch">' + c + "</span>";
    }
    el.innerHTML = out;
    return el.querySelectorAll(".ch");
  }
  var heroChars = [];
  document.querySelectorAll(".hero .wordmark .ln > span").forEach(function (el) {
    heroChars = heroChars.concat(Array.prototype.slice.call(splitChars(el)));
  });

  if (!hasGSAP) { if (boot) boot.remove(); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) { gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
  if (reduced) { if (boot) boot.remove(); return; }

  var E = "power3.out";

  /* ===================== boot, then the opening ===================== */
  function opening() {
    var tl = gsap.timeline({ defaults: { ease: E } });
    tl.from(heroChars, { yPercent: 125, rotate: 6, duration: 1.15, stagger: { each: .035, from: "start" } }, 0)
      .from(".hero .ast--big", { scale: 0, rotate: -180, opacity: 0, duration: 1.1, ease: "back.out(2.4)" }, .5)
      .from(".hero .eyebrow", { opacity: 0, y: 14, duration: .8 }, .2)
      .from(".hero__lede", { opacity: 0, y: 20, duration: .9 }, .45)
      .from(".hero__shot .frame", { clipPath: "inset(100% 0% 0% 0%)", rotateX: 14, y: 60, duration: 1.5, ease: "expo.out" }, .3)
      .from(".hero__shot .art", { scale: 1.35, duration: 1.8, ease: "expo.out" }, .3)
      .from(".hero__cap > *, .hero__foot > *", { opacity: 0, y: 18, duration: .8, stagger: .07 }, .95)
      .from(".nav > *", { opacity: 0, y: -14, duration: .7, stagger: .08 }, .15)
      .from("#progress", { opacity: 0, duration: 1 }, .6)
      .from(".hero__beam", { opacity: 0, duration: 2.2 }, 0);
  }

  if (boot) {
    var num = boot.querySelector(".bootnum"), bar = boot.querySelector(".bootbar i");
    var counter = { v: 0 };
    var bt = gsap.timeline({
      onComplete: function () { boot.remove(); ScrollTrigger.refresh(); opening(); }
    });
    bt.to(counter, {
      v: 100, duration: 1.25, ease: "power2.inOut",
      onUpdate: function () { num.textContent = String(Math.round(counter.v)).padStart(3, "0"); }
    }, 0)
      .to(bar, { scaleX: 1, duration: 1.25, ease: "power2.inOut" }, 0)
      .to(boot.querySelector(".bootinner"), { opacity: 0, y: -24, duration: .5, ease: "power2.in" }, 1.25)
      .to(boot, { clipPath: "inset(0% 0% 100% 0%)", duration: .9, ease: "expo.inOut" }, 1.45);
  } else {
    opening();
  }

  /* ===================== scroll reveals ===================== */
  gsap.utils.toArray(".h2").forEach(function (h) {
    gsap.from(h.querySelectorAll(".ln > span"), {
      yPercent: 118, rotate: 3, duration: 1.1, ease: E, stagger: .09,
      scrollTrigger: { trigger: h, start: "top 86%" }
    });
  });
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 34, duration: 1, ease: E,
      delay: parseFloat(el.dataset.reveal) || 0,
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });

  /* ===================== parallax ===================== */
  gsap.to(".hero__shot .art", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.utils.toArray(".shot").forEach(function (fig) {
    gsap.fromTo(fig.querySelector(".art"), { yPercent: -8, scale: 1.18 }, {
      yPercent: 8, ease: "none",
      scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.from(fig, {
      clipPath: "inset(14% 14% 14% 14%)", duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: fig, start: "top 85%" }
    });
  });
  gsap.utils.toArray(".tiles").forEach(function (band, i) {
    gsap.fromTo(band, { backgroundPositionX: "0px" }, {
      backgroundPositionX: (i % 2 ? -680 : 680) + "px", ease: "none",
      scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ===================== velocity skew (never on the pinned section) ===================== */
  (function skew() {
    var targets = gsap.utils.toArray(".band, .marquee__track");
    if (!targets.length) return;
    var setters = targets.map(function (t) { return gsap.quickSetter(t, "skewY", "deg"); });
    var clamp = gsap.utils.clamp(-2.6, 2.6), cur = 0;
    ScrollTrigger.create({ onUpdate: function (self) { cur = clamp(self.getVelocity() / -520); } });
    gsap.ticker.add(function () {
      cur += (0 - cur) * .08;
      for (var i = 0; i < setters.length; i++) setters[i](cur);
    });
  })();

  /* ===================== marquee ===================== */
  document.querySelectorAll(".marquee").forEach(function (m) {
    var track = m.querySelector(".marquee__track");
    var one = track.firstElementChild.getBoundingClientRect().width;
    var re = function () { one = track.firstElementChild.getBoundingClientRect().width; };
    addEventListener("load", re); addEventListener("resize", re);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);
    var x = 0, vel = 0;
    ScrollTrigger.create({
      trigger: m, start: "top bottom", end: "bottom top",
      onUpdate: function (self) { vel = gsap.utils.clamp(-4, 4, self.getVelocity() / 380); }
    });
    gsap.ticker.add(function (time, dt) {
      x -= (.06 + Math.abs(vel) * .26) * dt;
      if (x <= -one) x += one;
      gsap.set(track, { x: x });
      vel *= .93;
    });
  });

  /* ===================== magnetic ===================== */
  if (fine) {
    document.querySelectorAll("[data-magnet]").forEach(function (el) {
      var qx = gsap.quickTo(el, "x", { duration: .5, ease: "power3.out" });
      var qy = gsap.quickTo(el, "y", { duration: .5, ease: "power3.out" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * .34);
        qy((e.clientY - (r.top + r.height / 2)) * .45);
      });
      el.addEventListener("pointerleave", function () { qx(0); qy(0); });
    });
  }


  /* ===================== the brew: a scroll-driven V60 ===================== */
  (function brew() {
    var sec = document.querySelector(".pour");
    if (!sec) return;
    var q = function (sel) { return sec.querySelector(sel); };

    function dashed(el, hidden) {
      var L = 0;
      try { L = el.getTotalLength(); } catch (e) { L = 400; }
      gsap.set(el, { strokeDasharray: L, strokeDashoffset: hidden ? L : 0 });
      return L;
    }
    var streamL = dashed(q("#stream"), true);
    var rosEls = Array.prototype.slice.call(sec.querySelectorAll(".ros"));
    var rosL = rosEls.map(function (p) { return dashed(p, true); });

    gsap.set("#cup", { opacity: 0, scale: .25 });
    gsap.set("#drips", { opacity: 0 });
    gsap.set("#kettle", { transformOrigin: "88% 60%", rotate: 0, x: -70, opacity: 0 });
    gsap.set("#brew", { attr: { y: 508, height: 0 } });
    gsap.set("#brewTop", { attr: { cy: 508 }, opacity: 0 });
    gsap.set("#bed", { transformOrigin: "50% 100%" });

    /* drips keep falling on their own clock */
    gsap.utils.toArray(".drip").forEach(function (d, i) {
      gsap.timeline({ repeat: -1, delay: i * .3 })
        .fromTo(d, { y: 0, opacity: 0 }, { opacity: 1, duration: .08 }, 0)
        .to(d, { y: 174, duration: .72, ease: "power1.in" }, 0)
        .to(d, { opacity: 0, duration: .14 }, .64);
    });

    /* steam, once there is something hot to rise from */
    (function steam() {
      var cv = q("#steam");
      if (!cv) return;
      var ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio, 2), ps = [], w = 0, h = 0;
      function size() {
        var r = cv.getBoundingClientRect();
        w = r.width; h = r.height;
        cv.width = w * dpr; cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      size(); addEventListener("resize", size);
      function spawn() {
        ps.push({ x: w * (.42 + Math.random() * .16), y: h * .56, r: 14 + Math.random() * 26,
                  vy: .25 + Math.random() * .5, vx: (Math.random() - .5) * .35, life: 0,
                  max: 150 + Math.random() * 130 });
      }
      (function draw() {
        requestAnimationFrame(draw);
        if (document.hidden || !w) return;
        ctx.clearRect(0, 0, w, h);
        if (parseFloat(cv.style.opacity || 0) > .05) {
          if (ps.length < 42 && Math.random() < .5) spawn();
          var col = getComputedStyle(root).getPropertyValue("--ink").trim() || "#EFE9DE";
          for (var i = ps.length - 1; i >= 0; i--) {
            var p = ps[i]; p.life++;
            p.y -= p.vy; p.x += p.vx + Math.sin(p.life / 26) * .34; p.r += .22;
            var a = Math.sin(Math.PI * p.life / p.max) * .1;
            if (p.life > p.max) { ps.splice(i, 1); continue; }
            var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, col); g.addColorStop(1, "transparent");
            ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      })();
    })();

    var stageText = document.getElementById("stageText");
    var cD = document.getElementById("cDose"), cW = document.getElementById("cWater"),
        cT = document.getElementById("cTemp"), cC = document.getElementById("cClock");
    var lastStage = "", mapR = gsap.utils.mapRange, clamp01 = gsap.utils.clamp(0, 1);
    var STAGES = [[.10, "Rinse the filter"], [.28, "Bloom — 50 ml"], [.52, "First pour"],
                  [.72, "Second pour"], [.84, "Draw-down"], [1.01, "Served"]];

    function report(p) {
      cD.textContent = Math.round(clamp01(mapR(0, .08, 0, 18, p)));
      cT.textContent = Math.round(clamp01(mapR(0, .06, 0, 1, p)) * 94);
      cW.textContent = Math.round(clamp01(mapR(.12, .80, 0, 1, p)) * 300);
      var secs = Math.round(clamp01(mapR(.10, .84, 0, 1, p)) * 165);
      cC.textContent = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
      for (var i = 0; i < STAGES.length; i++) {
        if (p < STAGES[i][0]) {
          if (lastStage !== STAGES[i][1]) {
            lastStage = STAGES[i][1];
            gsap.fromTo(stageText, { yPercent: 110, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: .45, ease: "power3.out",
                onStart: function () { stageText.textContent = lastStage; } });
          }
          break;
        }
      }
    }

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sec, start: "top top", end: "+=2800", pin: ".pour__pin",
        scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { report(self.progress); }
      }
    });

    tl.to("#kettle", { x: 0, opacity: 1, duration: .06, ease: "power2.out" }, 0)
      .to("#kettle", { rotate: -18, duration: .05 }, .06)
      .to("#stream", { strokeDashoffset: 0, duration: .05 }, .10)
      .to("#bed", { scaleY: 1.75, y: -6, duration: .07, ease: "power2.out" }, .13)
      .to("#bubbles", { opacity: 1, duration: .04 }, .14)
      .to("#drips", { opacity: 1, duration: .03 }, .18)
      .to("#bubbles", { opacity: 0, duration: .06 }, .26)
      .to("#bed", { scaleY: 1.3, y: -2, duration: .1 }, .26)
      .to("#brew", { attr: { y: 336, height: 172 }, duration: .62 }, .14)
      .to("#brewTop", { attr: { cy: 338 }, opacity: .9, duration: .62 }, .14)
      .to("#kettle", { rotate: 0, duration: .04 }, .76)
      .to("#stream", { strokeDashoffset: streamL, duration: .04 }, .76)
      .to("#kettle", { x: -90, opacity: 0, duration: .06 }, .80)
      .to("#drips", { opacity: 0, duration: .04 }, .80)
      .to("#rig", { opacity: 0, scale: .82, duration: .07, transformOrigin: "50% 50%" }, .83)
      .to("#cup", { opacity: 1, scale: 1, duration: .1, ease: "back.out(1.7)" }, .84)
      .to("#steam", { opacity: 1, duration: .06 }, .88);

    rosEls.forEach(function (p, i) {
      tl.to(p, { strokeDashoffset: 0, duration: .035 }, .90 + i * .007);
    });
    tl.to("#cup", { rotate: 4, duration: .06 }, .95);
    report(0);
  })();

  /* ===================== coffee fills the footer wordmark ===================== */
  gsap.to(".foot__mark", {
    backgroundPositionY: "100%", ease: "none",
    scrollTrigger: { trigger: ".foot", start: "top 85%", end: "bottom bottom", scrub: .6 }
  });

  /* ===================== a ring left on the table ===================== */
  if (fine && !reduced) {
    addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button")) return;
      var s = document.createElement("span");
      s.className = "stain";
      s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      document.body.appendChild(s);
      gsap.fromTo(s, { scale: .2, opacity: .55 },
        { scale: 1, opacity: 0, duration: 1.5, ease: "power2.out",
          onComplete: function () { s.remove(); } });
    });
  }

  /* ===================== footer ===================== */
  gsap.from(".foot__mark", {
    yPercent: 30, opacity: .15, ease: "none",
    scrollTrigger: { trigger: ".foot", start: "top bottom", end: "top 30%", scrub: true }
  });

  addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
