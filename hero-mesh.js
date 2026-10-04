/* Home hero — "Wave Mesh"
   A field of interlaced rings warped into a rippling 3D surface, drawn as
   thousands of fine lines lit by depth. It assembles on load, ripples and
   turns slowly, and tilts toward the pointer. Pauses off-screen, in hidden
   tabs and when the site's motion-pause is active; reduced-motion users get
   a single still frame. */
(function () {
  'use strict';

  var hero = document.getElementById('hero-console');
  var canvas = document.getElementById('hero-mesh');
  var anchor = document.getElementById('hero-mesh-anchor');
  if (!hero || !canvas || !anchor) return;
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var compact = window.matchMedia('(max-width: 1079px)');

  /* ---------- geometry ---------- */
  var TAU = Math.PI * 2;
  var R = 190;          // ring-centre orbit radius
  var r = 230;          // ring radius
  var AMP = 60;         // ripple height
  var BASE_AX = 1.05, BASE_AY = -0.35, BASE_AZ = 0.25;
  var FOCAL = 1400;
  var EXTENT = 900;     // approx. on-screen width of the mesh at scale 1

  var rings, segs, cosT, sinT, cos2T, sin2T, cosP, sinP;

  // quality: 0 = full, 1 = reduced, 2 = minimum (stepped down automatically on slow devices)
  var quality = 0;
  function buildGeometry() {
    var lite = compact.matches || !finePointer.matches;
    var f = [1, 0.72, 0.52][quality];
    rings = Math.round((lite ? 96 : 140) * f);
    segs = Math.round((lite ? 80 : 112) * (quality ? 0.8 : 1));
    cosT = new Float32Array(segs + 1); sinT = new Float32Array(segs + 1);
    cos2T = new Float32Array(segs + 1); sin2T = new Float32Array(segs + 1);
    for (var j = 0; j <= segs; j++) {
      var th = TAU * j / segs;
      cosT[j] = Math.cos(th); sinT[j] = Math.sin(th);
      cos2T[j] = Math.cos(2 * th); sin2T[j] = Math.sin(2 * th);
    }
    cosP = new Float32Array(rings); sinP = new Float32Array(rings);
    for (var i = 0; i < rings; i++) {
      var ph = TAU * i / rings;
      cosP[i] = Math.cos(ph); sinP[i] = Math.sin(ph);
    }
    px = new Float32Array(segs + 1); py = new Float32Array(segs + 1); pz = new Float32Array(segs + 1);
  }
  var px, py, pz;

  /* ---------- depth palette: near warm-white → orange → brand → ember ---------- */
  var BINS = 12;
  var binPaths = new Array(BINS);
  var binStyle = [];
  (function buildPalette() {
    var stops = [[255, 216, 194], [255, 128, 78], [225, 53, 17], [104, 22, 8]];
    for (var b = 0; b < BINS; b++) {
      var t = b / (BINS - 1), f = t * 3, k = Math.min(2, Math.floor(f)), u = f - k;
      var A = stops[k], B = stops[k + 1];
      var c = [0, 1, 2].map(function (n) { return Math.round(A[n] + (B[n] - A[n]) * u); });
      binStyle.push({
        color: 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.6 * (1 - 0.68 * t)).toFixed(3) + ')',
        width: 0.95 - 0.35 * t
      });
    }
  })();

  /* ---------- sizing ---------- */
  var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, scale = 1;

  function layout() {
    var hr = hero.getBoundingClientRect();
    var ar = anchor.getBoundingClientRect();
    if (!hr.width || !hr.height) return;
    W = hr.width; H = hr.height;
    dpr = Math.min(window.devicePixelRatio || 1, [compact.matches ? 1.5 : 1.75, 1.25, 1][quality]);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    cx = ar.left - hr.left + ar.width / 2;
    cy = ar.top - hr.top + ar.height / 2;
    if (compact.matches) {
      scale = Math.min(ar.width * 0.90, ar.height * 1.37) / EXTENT;
    } else {
      scale = Math.min(ar.width * 1.16, W * 0.55) / EXTENT;
      cx += ar.width * 0.1;
    }
    hero.style.setProperty('--hm-x', cx + 'px');
    hero.style.setProperty('--hm-y', cy + 'px');
    hero.style.setProperty('--hm-scrim-start', Math.round(((ar.bottom - hr.top) / H) * 100 - 6) + '%');
    syncRotatorHeight();
    if (!running) draw(lastT);
  }

  /* Keep the rotating headline block a stable height so CTAs never jump. */
  function syncRotatorHeight() {
    var rot = hero.querySelector('.hero-rotator');
    if (!rot) return;
    var slides = rot.querySelectorAll('.hero-slide');
    var max = 0;
    slides.forEach(function (s) {
      var wasActive = s.classList.contains('active');
      s.style.minHeight = '0px';
      if (!wasActive) { s.style.position = 'relative'; s.style.visibility = 'hidden'; }
      max = Math.max(max, s.offsetHeight);
      if (!wasActive) { s.style.position = ''; s.style.visibility = ''; }
      s.style.minHeight = '';
    });
    if (max) rot.style.setProperty('--hm-rotator-h', max + 'px');
  }

  /* ---------- motion state ---------- */
  var tiltX = 0, tiltY = 0, targetX = 0, targetY = 0, pointerIn = false;
  var energy = 0, lastPX = null, lastPY = null;
  var startTime = performance.now();
  var lastT = 0;

  hero.addEventListener('pointermove', function (e) {
    if (!finePointer.matches) return;
    var hr = hero.getBoundingClientRect();
    var nx = (e.clientX - hr.left - cx) / (W * 0.5);
    var ny = (e.clientY - hr.top - cy) / (H * 0.5);
    targetY = Math.max(-1, Math.min(1, nx)) * 0.22;
    targetX = Math.max(-1, Math.min(1, ny)) * -0.16;
    if (lastPX !== null) {
      var d = Math.hypot(e.clientX - lastPX, e.clientY - lastPY);
      energy = Math.min(1, energy + d / 900);
    }
    lastPX = e.clientX; lastPY = e.clientY;
    pointerIn = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { pointerIn = false; lastPX = lastPY = null; });

  /* ---------- particles travelling along rings ---------- */
  var sparks = [];
  for (var s = 0; s < 22; s++) {
    sparks.push({ ring: Math.random(), theta: Math.random() * TAU, speed: (0.12 + Math.random() * 0.22) * (Math.random() < 0.5 ? -1 : 1), size: 1.4 + Math.random() * 1.8 });
  }

  /* ---------- render ---------- */
  function draw(t) {
    if (!W) return;
    var intro = reduceMotion.matches ? 1 : Math.min(1, t / 2.2);
    var ease = 1 - Math.pow(1 - intro, 3);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    var idleX = Math.sin(t * 0.21) * 0.05;
    var idleY = Math.cos(t * 0.17) * 0.07;
    var gx = pointerIn ? targetX : idleX, gy = pointerIn ? targetY : idleY;
    tiltX += (gx - tiltX) * 0.045;
    tiltY += (gy - tiltY) * 0.045;
    energy *= 0.965;

    var ax = BASE_AX + tiltX, ay = BASE_AY + tiltY, az = BASE_AZ + t * 0.035;
    var ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay), cc = Math.cos(az), sc = Math.sin(az);
    // combined rotation: X then Y then Z
    var m00 = cb * cc, m01 = sa * sb * cc - ca * sc, m02 = ca * sb * cc + sa * sc;
    var m10 = cb * sc, m11 = sa * sb * sc + ca * cc, m12 = ca * sb * sc - sa * cc;
    var m20 = -sb, m21 = sa * cb, m22 = ca * cb;

    var amp = AMP * ease * (1 + energy * 0.35);
    var wt = t * 0.55;
    var zr = 430;
    var k0 = scale;

    for (var b = 0; b < BINS; b++) binPaths[b] = new Path2D();

    var visibleRings = Math.max(1, Math.round(rings * (0.25 + 0.75 * ease)));
    for (var i = 0; i < visibleRings; i++) {
      var ph = TAU * i / rings;
      var ccx = R * cosP[i], ccy = R * sinP[i];
      // sin(2θ + 3φ + ωt) via angle addition
      var b1 = 3 * ph + wt, cb1 = Math.cos(b1), sb1 = Math.sin(b1);
      // secondary slow swell: sin(θ − 2φ − 0.6ωt)
      var b2 = -2 * ph - wt * 0.6, cb2 = Math.cos(b2), sb2 = Math.sin(b2);
      var ringR = r * (0.9 + 0.1 * ease);

      for (var j = 0; j <= segs; j++) {
        var x = ccx + ringR * cosT[j];
        var y = ccy + ringR * sinT[j];
        var z = amp * (sin2T[j] * cb1 + cos2T[j] * sb1) + amp * 0.35 * (sinT[j] * cb2 + cosT[j] * sb2);
        var X = m00 * x + m01 * y + m02 * z;
        var Y = m10 * x + m11 * y + m12 * z;
        var Z = m20 * x + m21 * y + m22 * z;
        var k = FOCAL / (FOCAL + Z);
        px[j] = cx + X * k * k0;
        py[j] = cy + Y * k * k0;
        pz[j] = Z;
      }
      for (var q = 0; q < segs; q++) {
        var zm = (pz[q] + pz[q + 1]) * 0.5;
        var bin = ((zm + zr) / (2 * zr) * BINS) | 0;
        if (bin < 0) bin = 0; else if (bin >= BINS) bin = BINS - 1;
        var p = binPaths[bin];
        p.moveTo(px[q], py[q]);
        p.lineTo(px[q + 1], py[q + 1]);
      }
    }

    ctx.globalAlpha = ease;
    for (var bb = BINS - 1; bb >= 0; bb--) {
      ctx.strokeStyle = binStyle[bb].color;
      ctx.lineWidth = binStyle[bb].width * Math.max(0.75, Math.min(1.15, scale * 1.25));
      ctx.stroke(binPaths[bb]);
    }

    // sparks
    for (var n = 0; n < sparks.length; n++) {
      var sp = sparks[n];
      var th = sp.theta + t * sp.speed;
      var ph2 = TAU * sp.ring;
      var b1s = 3 * ph2 + wt, b2s = -2 * ph2 - wt * 0.6;
      var sx = R * Math.cos(ph2) + r * Math.cos(th);
      var sy = R * Math.sin(ph2) + r * Math.sin(th);
      var sz = amp * Math.sin(2 * th + b1s) + amp * 0.35 * Math.sin(th + b2s);
      var SX = m00 * sx + m01 * sy + m02 * sz;
      var SY = m10 * sx + m11 * sy + m12 * sz;
      var SZ = m20 * sx + m21 * sy + m22 * sz;
      var kk = FOCAL / (FOCAL + SZ);
      var X2 = cx + SX * kk * k0, Y2 = cy + SY * kk * k0;
      var near = 1 - Math.min(1, Math.max(0, (SZ + zr) / (2 * zr)));
      var rad = sp.size * (0.6 + near) * 2.2;
      var g = ctx.createRadialGradient(X2, Y2, 0, X2, Y2, rad);
      g.addColorStop(0, 'rgba(255,226,208,' + (0.35 + 0.6 * near).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(255,110,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(X2, Y2, rad, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- loop control ---------- */
  var running = false, raf = 0, visible = true;

  var samples = [], prevNow = 0;
  function frame(now) {
    if (!running) return;
    lastT = (now - startTime) / 1000;
    draw(lastT);
    // Watch real frame times after the intro; step quality down if the device struggles.
    if (prevNow && lastT > 2.5 && quality < 2) {
      samples.push(now - prevNow);
      if (samples.length >= 40) {
        var sorted = samples.slice().sort(function (a, b) { return a - b; });
        if (sorted[20] > 22) { quality++; buildGeometry(); layout(); }
        samples = [];
      }
    }
    prevNow = now;
    raf = requestAnimationFrame(frame);
  }
  function shouldRun() {
    return visible && !document.hidden && !reduceMotion.matches && !document.body.classList.contains('motion-paused');
  }
  function update() {
    if (shouldRun()) {
      if (!running) { running = true; raf = requestAnimationFrame(frame); }
    } else if (running) {
      running = false; cancelAnimationFrame(raf); prevNow = 0; samples = [];
    }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = !!(entries[0] && entries[0].isIntersecting);
      update();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', update);
  window.addEventListener('viewport:motion-pause', update);
  window.addEventListener('viewport:motion-resume', update);
  function onMediaChange() { buildGeometry(); layout(); update(); }
  [reduceMotion, compact, finePointer].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onMediaChange);
  });

  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(hero);
  else window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncRotatorHeight);

  buildGeometry();
  layout();
  if (reduceMotion.matches) { lastT = 6; draw(lastT); }
  update();
})();
