(() => {
  const canvas = document.getElementById('orange-ambient-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const palette = ['#F4431A', '#F4431A', '#ff633f', '#ff9b7d', '#26d9d0', '#648cff'];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let last = 0;
  let lastFrame = 0;
  let frame = 0;
  let active = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    // A lower backing resolution keeps the effect smooth without making the
    // browser paint millions of pixels on high-density displays.
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(480, Math.max(180, Math.floor(width * height / 4200)));
    particles = Array.from({ length: count }, (_, i) => ({
      a: Math.random() * Math.PI * 2,
      b: Math.random() * Math.PI * 2,
      r: 0.78 + Math.random() * 0.22,
      tube: Math.random(),
      speed: (0.08 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1),
      size: 0.35 + Math.random() * 1.65,
      alpha: 0.16 + Math.random() * 0.68,
      color: palette[i % palette.length],
      phase: Math.random() * Math.PI * 2
    }));
  }

  function draw(time) {
    frame = 0;
    if (!active || document.hidden) return;

    // The background does not need a full 60fps to look fluid. Capping the
    // expensive canvas pass at 45fps leaves headroom for the page UI.
    if (time - lastFrame < 1000 / 45) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastFrame = time;

    const dt = Math.min((time - last) / 1000 || 0, 0.04);
    last = time;
    ctx.clearRect(0, 0, width, height);

    const cx = width * 0.74;
    const cy = height * 0.51;
    const scale = Math.min(width, height);
    const ringX = Math.max(220, scale * 0.39);
    const ringY = Math.max(190, scale * 0.48);
    const motion = reduceMotion.matches ? 0 : time * 0.001;

    const halo = ctx.createRadialGradient(cx, cy, scale * 0.08, cx, cy, scale * 0.62);
    halo.addColorStop(0, 'rgba(7,15,35,.03)');
    halo.addColorStop(0.56, 'rgba(244,67,26,.065)');
    halo.addColorStop(1, 'rgba(11,23,43,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    particles.forEach((p) => {
      p.a += p.speed * dt * (1 + p.tube * 0.5);
      const pulse = Math.sin(motion * 1.3 + p.phase) * 0.035;
      const tube = (p.tube - 0.5) * 2;
      const depth = Math.cos(p.b + motion * 0.22);
      const perspective = 0.75 + (depth + 1) * 0.16;
      const radius = (p.r + tube * 0.11 + pulse) * perspective;
      const x = cx + Math.cos(p.a + motion * 0.08) * ringX * radius;
      const y = cy + Math.sin(p.a + motion * 0.08) * ringY * radius;
      const front = (Math.sin(p.b) + 1) / 2;
      const alpha = p.alpha * (0.28 + front * 0.72) * (1 - Math.min(1, Math.abs(x - cx) / width) * 0.28);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      // Per-particle shadows are very expensive; the shared glow layers and
      // the single rim flare provide the same visual depth more efficiently.
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, p.size * (0.55 + front * 1.4), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1;
    for (let j = 0; j < 4; j += 1) {
      const offset = motion * (0.08 + j * 0.006) + j * 0.21;
      ctx.strokeStyle = j % 3 === 0 ? '#F4431A' : '#4b8cff';
      ctx.beginPath();
      for (let i = 0; i <= 60; i += 1) {
        const a = (i / 100) * Math.PI * 2 + offset;
        const wobble = 1 + Math.sin(a * 5 + motion + j) * 0.035;
        const x = cx + Math.cos(a) * ringX * wobble;
        const y = cy + Math.sin(a) * ringY * wobble;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const flareA = motion * 0.72;
    const flareX = cx + Math.cos(flareA) * ringX;
    const flareY = cy + Math.sin(flareA) * ringY;
    const flare = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, scale * 0.09);
    flare.addColorStop(0, 'rgba(255,220,204,.95)');
    flare.addColorStop(0.18, 'rgba(244,67,26,.72)');
    flare.addColorStop(1, 'rgba(244,67,26,0)');
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(flareX, flareY, scale * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (!reduceMotion.matches) frame = requestAnimationFrame(draw);
  }

  function start() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => { active = !document.hidden; if (active) start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { active = Boolean(entries[0]?.isIntersecting); if (active) start(); }, { threshold: 0.01 }).observe(canvas);
  }
  if (reduceMotion.matches) draw(0); else start();
})();
