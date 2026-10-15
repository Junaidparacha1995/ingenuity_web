// Run with Node and Playwright installed. Optional environment overrides:
// PLAYWRIGHT_MODULE_PATH, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, MARQUEE_TEST_URL.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

async function coverage(page) {
  const geometry = await page.locator('#tech-marquee').evaluate(wrap => {
    const bounds = wrap.getBoundingClientRect();
    const track = wrap.querySelector('.marquee-track');
    const cards = [...track.querySelectorAll('.marquee-item')].map(card => {
      const rect = card.getBoundingClientRect();
      return { title: card.title, left: rect.left, right: rect.right };
    }).filter(rect => rect.right > bounds.left && rect.left < bounds.right)
      .sort((a, b) => a.left - b.left);
    return {
      left: bounds.left, right: bounds.right, cards,
      groups: track.children.length,
      separateTranslate: getComputedStyle(track).translate,
      imagesLoaded: [...track.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0)
    };
  });
  assert.ok(geometry.cards.length > 0, 'the pointer/loop must not leave an empty row');
  assert.ok(geometry.cards[0].left <= geometry.left + 13, 'no blank leading area');
  assert.ok(geometry.cards.at(-1).right >= geometry.right - 13, 'no blank trailing area');
  for (let i = 1; i < geometry.cards.length; i++) {
    assert.ok(geometry.cards[i].left - geometry.cards[i - 1].right <= 13,
      'the repeat boundary must have the same 12px gap as adjacent cards');
  }
  assert.equal(geometry.separateTranslate, 'none', 'drag must not add an independent translation');
  assert.ok(geometry.imagesLoaded, 'all logo assets must load');
  return geometry;
}

async function seek(page, time) {
  await page.locator('#tech-marquee .marquee-track').evaluate((track, time) => {
    const animation = track.getAnimations().find(item => item.animationName === 'techMarqueeScroll');
    animation.pause();
    animation.currentTime = time;
  }, time);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox']
  });
  try {
    for (const width of [1280, 402, 3840]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.MARQUEE_TEST_URL || 'http://127.0.0.1:5000/');
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#tech-marquee').scrollIntoViewIfNeeded();
      await page.waitForFunction(() =>
        document.querySelector('#tech-marquee .marquee-track').style.getPropertyValue('--tech-marquee-end'));

      for (const cycle of [0, 1, 4]) {
        for (const phase of [0, 0.25, 0.85, 0.99999]) {
          await seek(page, (cycle + phase) * 38000);
          await coverage(page);
        }
      }
      await seek(page, 38000 - 0.1);
      const before = await coverage(page);
      await seek(page, 38000 + 0.1);
      const after = await coverage(page);
      assert.deepEqual(after.cards.map(card => card.title), before.cards.map(card => card.title));
      before.cards.forEach((card, i) => assert.ok(Math.abs(card.left - after.cards[i].left) < 1));

      const bounds = await page.locator('#tech-marquee').boundingBox();
      for (const phase of [0, 0.5, 0.999]) {
        for (const delta of [-50, 50, -130, 130]) {
          await seek(page, phase * 38000);
          await page.locator('#tech-marquee .marquee-track').evaluate(track => track.getAnimations()[0].play());
          const x = bounds.x + bounds.width / 2, y = bounds.y + 30;
          await page.mouse.move(x, y);
          await coverage(page);
          await page.mouse.down();
          await page.mouse.move(x + delta, y, { steps: 4 });
          await coverage(page);
          await page.mouse.up();
          await page.mouse.move(5, 5);
          await coverage(page);
          assert.equal(await page.locator('#tech-marquee').evaluate(wrap => wrap.classList.contains('is-dragging')), false);
          assert.equal(await page.locator('#tech-marquee .marquee-track').evaluate(track => track.getAnimations()[0].playState), 'running');
        }
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: pointer entry/exit, left/right drags, five cycles, and seamless restart`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
