const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function fixture(file) {
  const dom = new JSDOM(read(file), {
    url: `https://example.test/${file}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  dom.window.matchMedia = () => ({ matches: true, addEventListener() {} });
  dom.window.scrollTo = () => {};
  return dom;
}

test('assessment exposes named single-choice groups before script execution', () => {
  const dom = fixture('pages/ai-maturity.html');
  try {
    const doc = dom.window.document;
    const groups = [...doc.querySelectorAll('[role="radiogroup"]')];
    assert.equal(groups.length, 7);
    for (const group of groups) {
      assert.ok(doc.getElementById(group.getAttribute('aria-labelledby')).textContent.trim());
      const radios = [...group.querySelectorAll('[role="radio"]')];
      assert.equal(radios.length, 3);
      assert.ok(radios.every((radio) => radio.getAttribute('aria-checked') === 'false'));
      assert.equal(radios.filter((radio) => radio.tabIndex === 0).length, 1);
    }
  } finally { dom.window.close(); }
});

test('assessment click and keyboard selection keep state, focus and scoring synchronized', () => {
  const dom = fixture('pages/ai-maturity.html');
  try {
    const w = dom.window;
    const doc = w.document;
    w.eval(read('pages/tools.js'));
    const groups = [...doc.querySelectorAll('[role="radiogroup"]')];
    const radios = [...groups[0].querySelectorAll('[role="radio"]')];
    const checked = (expected) => {
      radios.forEach((radio, index) => {
        assert.equal(radio.getAttribute('aria-checked'), String(index === expected));
        assert.equal(radio.classList.contains('selected'), index === expected);
        assert.equal(radio.tabIndex, index === expected ? 0 : -1);
      });
    };
    radios[1].click();
    checked(1);
    radios[0].click();
    checked(0);
    assert.equal(doc.getElementById('maturity-title').textContent, '1/7 questions completed');
    assert.equal(doc.getElementById('download-maturity').disabled, true);
    radios[0].focus();
    for (const [key, expected] of [
      ['ArrowLeft', 2], ['ArrowRight', 0], ['ArrowDown', 1],
      ['ArrowUp', 0], ['End', 2], ['Home', 0]
    ]) {
      const event = new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      doc.activeElement.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
      checked(expected);
      assert.equal(doc.activeElement, radios[expected]);
    }
    const tab = new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    doc.activeElement.dispatchEvent(tab);
    assert.equal(tab.defaultPrevented, false);
    groups.forEach((group) => group.querySelector('[data-score="5"]').click());
    const report = JSON.parse(w.localStorage.getItem('ingenuityMaturity'));
    assert.equal(report.score, 35);
    assert.equal(Object.keys(report.answers).length, 7);
    assert.equal(doc.getElementById('download-maturity').disabled, false);
    radios[0].click();
    assert.equal(JSON.parse(w.localStorage.getItem('ingenuityMaturity')).score, 31);
    groups.forEach((group) => {
      assert.equal(group.querySelectorAll('[aria-checked="true"]').length, 1);
    });
  } finally { dom.window.close(); }
});

test('Work categories preserve button and cross-page link semantics after initialization and clicks', () => {
  for (const file of ['work.html', 'case-studies/index.html']) {
    const dom = fixture(file);
    try {
      const w = dom.window;
      const doc = w.document;
      const group = doc.querySelector('.work-tabs');
      assert.equal(group.getAttribute('role'), 'group');
      assert.equal(group.querySelector('[role="tab"]'), null);
      const button = group.querySelector('button');
      const link = group.querySelector('a');
      const href = link.getAttribute('href');
      for (const script of doc.querySelectorAll('script:not([src])')) {
        if (!script.type || script.type === 'text/javascript') w.eval(script.textContent);
      }
      assert.equal(button.getAttribute('aria-pressed'), String(file === 'work.html'));
      assert.equal(link.hasAttribute('aria-selected'), false);
      assert.equal(link.hasAttribute('aria-pressed'), false);
      assert.equal(link.getAttribute('href'), href);
      if (file.startsWith('case-studies')) assert.equal(link.getAttribute('aria-current'), 'page');
      button.click();
      assert.equal(button.getAttribute('aria-pressed'), 'true');
      assert.equal(doc.getElementById('projects').hidden, false);
      assert.equal(doc.getElementById('case-studies').hidden, true);
      assert.equal(link.hasAttribute('aria-selected'), false);
    } finally { dom.window.close(); }
  }
});

test('shared primary orange and white have an unrounded contrast ratio of at least 4.5:1', () => {
  const css = read('styles.css');
  const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((c) => parseInt(c, 16) / 255)
      .map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(token('orange'));
  const b = luminance(token('white'));
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  assert.ok(ratio >= 4.5, `Contrast ratio: ${ratio}`);
  assert.match(css, /\.btn-primary\{background:var\(--orange\); color:var\(--white\)/);
});
