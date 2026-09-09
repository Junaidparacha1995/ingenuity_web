import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const current = fs.readFileSync('index.html', 'utf8');
const currentHeader = current.slice(current.indexOf('<header>'), current.indexOf('</header>') + 9);
let html = execFileSync('git', ['show', 'HEAD:index.html'], { encoding: 'utf8' });
html = html.replace(/<header>[\s\S]*?<\/header>/, currentHeader);

function removeSection(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) return source;
  const open = source.lastIndexOf('<section', start);
  const tokens = /<section\b[^>]*>|<\/section>/gi;
  tokens.lastIndex = open;
  let depth = 0;
  let match;
  while ((match = tokens.exec(source))) {
    depth += match[0][1] === '/' ? -1 : 1;
    if (depth === 0) return source.slice(0, open) + source.slice(tokens.lastIndex);
  }
  return source;
}
function matchingDivEnd(source, start) {
  const token = /<div\b[^>]*>|<\/div>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(source))) {
    depth += match[0][1] === '/' ? -1 : 1;
    if (depth === 0) return token.lastIndex;
  }
  return source.length;
}
for (const marker of ['class="system-map-section"', 'class="section-pad tech-ecosystem"', 'id="roi-calculator"', 'class="section-pad product-cockpit-section"', 'class="section-pad home-projects"', 'class="section-pad case-preview"']) {
  html = removeSection(html, marker);
}
// Keep the five visual steps and a single call to action, not the repeated detail cards.
html = html.replace(/<div class="process-detail"[\s\S]*?<\/div>\s*<div style="text-align:center; margin-top:20px;"><a class="btn btn-outline" href="\/pages\/about">Explore Our Approach →<\/a><\/div>/,
  '<div style="text-align:center; margin-top:20px;"><a class="btn btn-outline" href="/pages/contact">Talk through your process →</a></div>');
// Restore the four-step Solution Finder markup supplied by the original page.
html = html.replace(/href="assets\/images\/logo-light\.svg"/g, 'href="/assets/images/official-logo-light.png"');
html = html.replace(/src="assets\/images\/logo-light\.svg"/g, 'src="/assets/images/official-logo-light.png"');
html = html.replace(/src="assets\/images\/logo-icon\.svg"/g, 'src="/assets/images/official-logo-icon.png"');
html = html.replace(/src="assets\/images\/official-logo-light\.png"/g, 'src="/assets/images/official-logo-light.png"');
html = html.replace(/href="assets\/images\/favicon\.svg"/g, 'href="/assets/images/official-logo-icon.png"');
html = html.replace(/v=6\.9\.3/g, 'v=6.10.0');
html = html.replace(/<div class="eyebrow">Technology Ecosystem<\/div>/, '<div class="eyebrow">Technology stack</div>');
html = html.replace(/Connected by Design/g, 'Built for the Long Run');
html = html.replace('Engineered on an advanced, enterprise-grade technology stack', 'ENGINEERED ON ADVANCED, ENTERPRISE-GRADE TECHNOLOGY STACK');
html = html.replace(/(<span class="marquee-brand"><span class="marquee-brand-icon"><img[^>]+python\.svg[^>]+>.*?<\/span><strong>Python<\/strong><\/span>)/,
  '$1<span class="marquee-brand"><strong>PyTorch</strong></span><span class="marquee-brand"><strong>scikit-learn</strong></span><span class="marquee-brand"><strong>Hugging Face</strong></span><span class="marquee-brand"><strong>OpenCV</strong></span>');
// The team narrative follows the three pillars and avoids unsupported headcount
// or credential claims.
const proofStart = html.indexOf('<div aria-label="Engineering team credentials"');
if (proofStart >= 0) {
  const proofEnd = matchingDivEnd(html, proofStart);
  const proofBlock = html.slice(proofStart, proofEnd);
  html = html.slice(0, proofStart) + html.slice(proofEnd);
  const pillarStart = html.indexOf('<div class="pillar-row">');
  const pillarEnd = matchingDivEnd(html, pillarStart);
  const teamCards = '<div class="projects-grid team-projects"><article class="project-card"><span class="eyebrow">Engineering team</span><h3>Product-minded builders</h3><p>Software engineers, data practitioners, and AI specialists work together from discovery through deployment.</p></article><article class="project-card featured"><span class="eyebrow">How we contribute</span><h3>Capability that stays with you</h3><p>Documentation, evaluation, observability, and operating guidance are part of delivery.</p></article></div>';
  html = html.slice(0, pillarEnd) + teamCards + html.slice(pillarEnd);
}
html = html.replace(/<div class="stat-item"><div class="num" data-countup="4" data-suffix="">4<\/div><div class="lbl">Core Technology Disciplines<\/div><\/div>/, '');
html = html.replace('<div class="why-block" style="margin-top:60px;">', '<div class="why-block project-card featured" style="margin-top:60px;">');
html = html.replace(/<a class="btn btn-outline" href="\/projects">Inspect Recent Projects →<\/a>/,
  '<div class="hero-actions"><a class="btn btn-outline" href="/projects">Explore Projects</a><a class="btn btn-outline" href="/case-studies">Explore Case Studies</a></div>');
// Turn the first decision card into an in-place accessible disclosure.
html = html.replace(
  /<article class="decision-card reveal"><span class="decision-num">01<\/span><h3>Why not just buy another tool\?<\/h3>([\s\S]*?)<a class="btn-text" href="\/pages\/architecture">See our architecture approach →<\/a><\/article>/,
  (_, content) => `<article class="decision-card reveal"><span class="decision-num">01</span><button class="decision-toggle" type="button" aria-expanded="false" aria-controls="decision-detail"><h3>Why not just buy another tool?</h3><span aria-hidden="true">+</span></button>${content}<div class="decision-detail" id="decision-detail" aria-hidden="true"><p>We map the operating reality first, then build the smallest useful layer around it so ownership, data quality, and exception paths remain visible.</p></div></article>`
);
html = html.replace('<section class="section-pad">\n<div class="wrap">\n<div class="cta-band">',
  '<section class="section-pad testimonials-section" id="testimonials"><div class="wrap"><div class="section-head reveal center"><div class="eyebrow">Testimonials</div><h2>Evidence before applause.</h2><p>We publish client testimonials and outcome claims only when they are approved for public use. Until then, the work, architecture, and repositories remain inspectable.</p></div></div></section><section class="section-pad">\n<div class="wrap">\n<div class="cta-band">');
fs.writeFileSync('index.html', html);