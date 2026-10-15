// DOM/scheduler regression tests, not a substitute for real-device rendering.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const FakeTimers = require('@sinonjs/fake-timers');
const postcss = require('postcss');
const root = path.resolve(process.env.STABILITY_SITE_ROOT || path.join(__dirname, '..'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'))
  .concat(['projects/index.html', 'case-studies/index.html', 'pages/ai-maturity.html', 'pages/build-your-system.html']);

function fixture(file = 'projects/index.html', options = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (error) => errors.push(error.message));
  const dom = new JSDOM(read(file), {
    url: `http://localhost/${file}`, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc
  });
  const w = dom.window;
  const state = { width: options.width || 1440, height: 900, dpr: 2,
    coarse: Boolean(options.coarse), reduced: Boolean(options.reduced), hidden: false };
  for (const [key, prop] of [['innerWidth', 'width'], ['innerHeight', 'height'], ['devicePixelRatio', 'dpr']]) {
    Object.defineProperty(w, key, { get: () => state[prop], configurable: true });
  }
  Object.defineProperty(w.document.documentElement, 'clientWidth', { get: () => state.width });
  Object.defineProperty(w.document, 'hidden', { get: () => state.hidden });
  Object.defineProperty(w.document, 'visibilityState', { get: () => state.hidden ? 'hidden' : 'visible' });
  const visual = new w.EventTarget();
  visual.scale = 1; visual.height = 900; visual.width = state.width;
  Object.defineProperty(w, 'visualViewport', { value: visual });
  const queries = [];
  function matches(query) {
    return query.split(',').some((part) => {
      const min = part.match(/min-width:\s*([\d.]+)px/);
      const max = part.match(/max-width:\s*([\d.]+)px/);
      if (min && state.width < Number(min[1])) return false;
      if (max && state.width > Number(max[1])) return false;
      if (/hover:\s*hover|pointer:\s*fine/.test(part) && state.coarse) return false;
      if (/hover:\s*none|pointer:\s*coarse/.test(part) && !state.coarse) return false;
      if (/prefers-reduced-motion:\s*reduce\)/.test(part) && !state.reduced) return false;
      if (/prefers-reduced-motion:\s*no-preference/.test(part) && state.reduced) return false;
      return true;
    });
  }
  w.matchMedia = (query) => {
    const media = new w.EventTarget();
    media.media = query;
    Object.defineProperty(media, 'matches', { get: () => matches(query) });
    media.lastMatch = media.matches;
    media.addListener = (cb) => media.addEventListener('change', cb);
    queries.push(media);
    return media;
  };
  const clock = FakeTimers.withGlobal(w).install({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date', 'performance']
  });
  w.performance.getEntriesByType = () => [];
  const observers = [];
  w.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
  };
  const canvasStats = { resets: 0, paints: 0 };
  const ctx = new Proxy({}, { get: (target, key) => {
    if (key in target) return target[key];
    if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (key === 'clearRect') return () => { canvasStats.paints++; };
    if (key === 'measureText') return (text) => ({ width: String(text).length * 7 });
    return () => {};
  }});
  w.HTMLCanvasElement.prototype.getContext = () => ctx;
  w.document.querySelectorAll('canvas').forEach((canvas) => {
    let width = 300, height = 150;
    for (const key of ['width', 'height']) Object.defineProperty(canvas, key, {
      get: () => key === 'width' ? width : height,
      set: (value) => { canvasStats.resets++; if (key === 'width') width = value; else height = value; }
    });
    canvas.getBoundingClientRect = () => ({ width: state.width, height: 600, top: 0, bottom: 600 });
  });
  const scrolls = [];
  w.scrollTo = (...args) => scrolls.push(args);
  w.HTMLElement.prototype.scrollIntoView = function () { scrolls.push(this.id); };
  w.fetch = async () => ({ ok: false }); // Never contact an AI provider or send a form during tests.
  w.addEventListener('error', (event) => errors.push(event.message));
  function load() {
    for (const script of w.document.querySelectorAll('script')) {
      if (script.type && !['text/javascript', 'application/javascript'].includes(script.type)) continue;
      if (script.src) {
        const filePath = path.resolve(root, path.dirname(file), script.getAttribute('src').split('?')[0]);
        if (!filePath.startsWith(root)) continue;
        w.eval(fs.readFileSync(filePath, 'utf8'));
      } else w.eval(script.textContent);
    }
  }
  function resize(width, height = state.height) {
    state.width = width; state.height = height;
    queries.forEach((media) => {
      if (media.matches !== media.lastMatch) { media.lastMatch = media.matches; media.dispatchEvent(new w.Event('change')); }
    });
    w.dispatchEvent(new w.Event('resize'));
  }
  function intersect(selector, visible) {
    observers.forEach((observer) => {
      const targets = [...observer.targets].filter((target) => target.matches(selector));
      if (targets.length) observer.callback(targets.map((target) => ({ target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 })));
    });
  }
  return { w, dom, state, visual, clock, errors, canvasStats, scrolls, load, resize, intersect,
    close() { clock.uninstall(); w.close(); } };
}

test('all 22 pages initialize at desktop, phone and tablet breakpoints with working navigation', async () => {
  assert.equal(pages.length, 22);
  for (const width of [320, 768, 1440]) {
  for (const file of pages) {
    const f = fixture(file, { width, coarse: width < 1080 });
    try {
      f.load();
      await f.clock.tickAsync(1000);
      assert.deepEqual(f.errors, [], file);
      assert.equal(f.w.document.documentElement.dataset.canonicalHeader, 'true', file);
      assert.ok(f.w.document.querySelector('.assistant-launcher'), file);
    } finally { f.close(); }
  }
  }
});

test('pinch zoom pauses decoration once without layout resize events or changing card state', async () => {
  const f = fixture('projects/index.html', { width: 390, coarse: true });
  try {
    f.load();
    const events = [];
    for (const name of ['resize-start', 'resize-end', 'motion-pause', 'motion-resume']) {
      f.w.addEventListener(`viewport:${name}`, () => events.push(name));
    }
    const card = f.w.document.querySelector('.project-card');
    card.querySelector('.project-expand').click();
    for (const scale of [1.05, 1.3, 2, 1.6, 1.1, 1]) {
      f.visual.scale = scale;
      f.visual.dispatchEvent(new f.w.Event('resize'));
      await f.clock.tickAsync(250);
    }
    assert.deepEqual(events, ['motion-pause', 'motion-resume']);
    assert.equal(card.querySelector('.project-expand').getAttribute('aria-expanded'), 'true');
    assert.equal(f.w.document.body.classList.contains('is-resizing'), false);
    assert.deepEqual(f.scrolls, []);
  } finally { f.close(); }
});

test('desktop resize bursts settle once; mobile keyboard/address-bar height changes do not relayout', async () => {
  const f = fixture();
  try {
    f.load();
    let settled = 0;
    f.w.addEventListener('viewport:resize-end', () => settled++);
    for (const width of [1280, 1152, 1024, 960]) { f.resize(width); await f.clock.tickAsync(30); }
    await f.clock.tickAsync(200);
    assert.equal(settled, 1);
    f.state.coarse = true;
    f.resize(390); await f.clock.tickAsync(200);
    settled = 0;
    f.resize(390, 400); f.visual.height = 400;
    f.visual.dispatchEvent(new f.w.Event('resize'));
    await f.clock.tickAsync(300);
    assert.equal(settled, 0);
  } finally { f.close(); }
});

test('Home canvas is not cleared on pinch or unchanged size; real resize repaints synchronously', async () => {
  const f = fixture('index.html');
  try {
    f.load(); await f.clock.tickAsync(100);
    const resets = f.canvasStats.resets;
    f.visual.scale = 2; f.visual.dispatchEvent(new f.w.Event('resize'));
    await f.clock.tickAsync(300);
    f.w.dispatchEvent(new f.w.CustomEvent('viewport:resize-end'));
    assert.equal(f.canvasStats.resets, resets);
    f.state.width = 1200;
    const paints = f.canvasStats.paints;
    f.w.dispatchEvent(new f.w.CustomEvent('viewport:resize-end'));
    assert.ok(f.canvasStats.resets > resets);
    assert.ok(f.canvasStats.paints > paints, 'new bitmap painted before resize handler returns');
    f.intersect('#orange-ambient-canvas', false);
    const offscreenPaints = f.canvasStats.paints;
    f.state.hidden = true; f.w.document.dispatchEvent(new f.w.Event('visibilitychange'));
    f.state.hidden = false; f.w.document.dispatchEvent(new f.w.Event('visibilitychange'));
    f.visual.scale = 1; f.visual.dispatchEvent(new f.w.Event('resize'));
    await f.clock.tickAsync(500);
    assert.equal(f.canvasStats.paints, offscreenPaints, 'visibility return must not restart offscreen canvas');
  } finally { f.close(); }
});

test('Projects keep one card open, all filters work, terminal cancellation is safe, no forced scroll', async () => {
  for (const width of [320, 360, 390, 430, 768, 820, 1024, 1280, 1440]) {
    const f = fixture('projects/index.html', { width, coarse: width <= 1024 });
    try {
      f.load();
      const cards = [...f.w.document.querySelectorAll('.project-card')];
      cards[0].querySelector('.project-expand').click();
      await f.clock.tickAsync(100);
      cards[1].querySelector('.project-expand').click();
      assert.equal(f.w.document.querySelectorAll('.project-card.is-open').length, 1);
      assert.equal(cards[0].querySelector('.project-detail-panel').inert, true);
      const terminal = cards[1].querySelector('.project-detail-terminal-screen');
      assert.equal(terminal.querySelectorAll('.trace-measure').length, 6);
      await f.clock.tickAsync(5000);
      assert.equal(terminal.getAttribute('aria-busy'), 'false');
      for (const filter of f.w.document.querySelectorAll('.project-filter')) {
        filter.click();
        const category = filter.dataset.filter;
        for (const card of cards) assert.equal(card.hidden, category !== 'all' && !card.dataset.category.split(' ').includes(category));
      }
      assert.deepEqual(f.scrolls, []);
      assert.deepEqual(f.errors, []);
    } finally { f.close(); }
  }
});

test('rapid Work tab switching never displays both panels or lets stale timers hide the selected one', async () => {
  const f = fixture('work.html');
  try {
    f.load();
    const tabs = [...f.w.document.querySelectorAll('[data-work-tab]')];
    const panels = [...f.w.document.querySelectorAll('[data-work-panel]')];
    for (const i of [1, 0, 1, 0, 1]) {
      tabs[i].click();
      assert.equal(panels.filter((p) => !p.hidden).length, 1);
      await f.clock.tickAsync(40);
    }
    await f.clock.tickAsync(1000);
    assert.equal(panels.filter((p) => !p.hidden).length, 1);
    assert.equal(panels.find((p) => !p.hidden).dataset.workPanel, tabs[1].dataset.workTab);
  } finally { f.close(); }
});

test('phone/tablet hero is manual, desktop autoplay pauses offscreen and under reduced motion', async () => {
  for (const options of [{ width: 390, coarse: true }, { width: 820, coarse: true }, { width: 1440, reduced: true }]) {
    const f = fixture('index.html', options);
    try {
      f.load();
      const initial = f.w.document.querySelector('.hero-slide.active');
      await f.clock.tickAsync(6500);
      assert.equal(f.w.document.querySelector('.hero-slide.active'), initial);
      f.w.document.querySelectorAll('.hero-dot')[1].click();
      assert.notEqual(f.w.document.querySelector('.hero-slide.active'), initial);
    } finally { f.close(); }
  }
  const f = fixture('index.html');
  try {
    f.load();
    const initial = f.w.document.querySelector('.hero-slide.active');
    f.intersect('#hero-console', false);
    await f.clock.tickAsync(6500);
    assert.equal(f.w.document.querySelector('.hero-slide.active'), initial);
    f.intersect('#hero-console', true);
    await f.clock.tickAsync(5600);
    assert.notEqual(f.w.document.querySelector('.hero-slide.active'), initial);
  } finally { f.close(); }
});

test('mobile menu and assistant stay interactive; opening chat does not force keyboard focus', async () => {
  const f = fixture('index.html', { width: 390, coarse: true });
  try {
    f.load();
    const d = f.w.document;
    d.querySelector('.menu-toggle').click();
    assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'), 'true');
    assert.ok(d.body.classList.contains('mobile-nav-open'));
    d.querySelector('.menu-toggle').click();
    const input = d.querySelector('.assistant-input');
    let focuses = 0; input.focus = () => { focuses++; };
    d.querySelector('.assistant-launcher').click();
    await f.clock.tickAsync(100);
    assert.equal(d.querySelector('.assistant-launcher').getAttribute('aria-expanded'), 'true');
    assert.equal(focuses, 0);
    d.querySelector('.assistant-close').click();
    assert.equal(d.querySelector('.assistant-launcher').getAttribute('aria-expanded'), 'false');
    const flip = d.querySelector('.flip-card');
    if (flip) { flip.click(); assert.equal(flip.getAttribute('aria-expanded'), 'true'); flip.click(); assert.equal(flip.getAttribute('aria-expanded'), 'false'); }
  } finally { f.close(); }
});

test('CSS parses, blanket resize reset is absent, and expandable panels have no fixed-height ceiling', () => {
  for (const file of ['styles.css', 'responsive-v18.css', 'responsive-v19.css', 'work-hero-centered-v16.css', 'pages/tools.css']) {
    const css = read(file);
    postcss.parse(css, { from: file });
    assert.ok(!css.includes('body.is-resizing *'), file);
  }
  assert.ok(!/\.project-card\.is-open \.project-detail-panel\{max-height:1100px/.test(read('styles.css')));
  for (const file of ['script.js', 'orange-ambient.js', 'pages/tools.js']) new vm.Script(read(file), { filename: file });
});

test('header has hysteresis and does not change mode during pinch zoom', async () => {
  const f = fixture();
  try {
    const hero = f.w.document.querySelector('.work-hero');
    Object.defineProperty(hero, 'offsetHeight', { value: 600 });
    f.load();
    const header = f.w.document.querySelector('header');
    const scroll = async (y) => { f.w.scrollY = y; f.w.dispatchEvent(new f.w.Event('scroll')); await f.clock.tickAsync(20); };
    await scroll(550);
    assert.equal(header.classList.contains('scrolled'), true);
    for (const y of [520, 515, 525, 512]) {
      await scroll(y);
      assert.equal(header.classList.contains('scrolled'), true);
    }
    f.visual.scale = 2; f.visual.dispatchEvent(new f.w.Event('resize'));
    await scroll(100);
    assert.equal(header.classList.contains('scrolled'), true);
    f.visual.scale = 1; f.visual.dispatchEvent(new f.w.Event('resize'));
    await f.clock.tickAsync(20);
    assert.equal(header.classList.contains('scrolled'), false);
  } finally { f.close(); }
});

test('a pinch gesture does not change carousel slides or start a marquee drag', async () => {
  const f = fixture('index.html', { width: 390, coarse: true });
  try {
    f.load();
    const track = f.w.document.querySelector('.testimonial-track, .coverflow-track');
    const touch = (type, touches, changedTouches = []) => {
      const event = new f.w.Event(type, { bubbles: true });
      Object.defineProperties(event, { touches: { value: touches }, changedTouches: { value: changedTouches } });
      track.dispatchEvent(event);
    };
    if (track) {
      const active = track.querySelector('.fan-active, .cf-active');
      touch('touchstart', [{ clientX: 250 }]);
      touch('touchstart', [{ clientX: 250 }, { clientX: 80 }]);
      touch('touchend', [], [{ clientX: 60 }]);
      assert.equal(track.querySelector('.fan-active, .cf-active'), active);
    }
    const wrap = f.w.document.querySelector('#tech-marquee');
    if (wrap) {
      const event = new f.w.Event('pointerdown', { bubbles: true });
      Object.defineProperties(event, { isPrimary: { value: false }, pointerType: { value: 'touch' } });
      wrap.dispatchEvent(event);
      assert.equal(wrap.classList.contains('is-dragging'), false);
    }
  } finally { f.close(); }
});

test('tech marquee duplicates one exact logo group and keeps drag offset inside the loop', () => {
  const f = fixture('index.html');
  try {
    f.load();
    const wrap = f.w.document.querySelector('#tech-marquee');
    const track = wrap.querySelector('.marquee-track');
    const groups = track.querySelectorAll('.tech-marquee-group');
    assert.equal(groups.length, 2);
    assert.equal(groups[1].getAttribute('aria-hidden'), 'true');
    assert.equal(groups[0].querySelectorAll('.marquee-item').length, 18);
    groups[0].getBoundingClientRect = () => ({ width: 1000 });

    const down = new f.w.Event('pointerdown', { bubbles: true });
    Object.defineProperties(down, {
      isPrimary: { value: true }, pointerType: { value: 'mouse' }, button: { value: 0 },
      pointerId: { value: 1 }, clientX: { value: 0 }
    });
    wrap.dispatchEvent(down);
    const move = new f.w.Event('pointermove', { bubbles: true });
    Object.defineProperties(move, { clientX: { value: 8450 } });
    wrap.dispatchEvent(move);
    const offset = Number.parseFloat(track.style.getPropertyValue('--tech-marquee-offset'));
    assert.ok(offset >= 0 && offset < 1000, offset);
  } finally { f.close(); }
});
