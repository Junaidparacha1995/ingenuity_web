import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'attached_assets' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
}
walk(root);

function matchingDivEnd(source, start) {
  const token = /<div\b[^>]*>|<\/div>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(source))) {
    if (match[0][1] === '/') {
      depth -= 1;
      if (depth === 0) return token.lastIndex;
    } else depth += 1;
  }
  return source.length;
}
function removePanels(header, panel) {
  let out = header;
  let start;
  while ((start = out.search(new RegExp(`<div\\b[^>]*data-panel="${panel}"[^>]*>`, 'i'))) >= 0) {
    out = out.slice(0, start) + out.slice(matchingDivEnd(out, start));
  }
  return out;
}
const work = '<div aria-hidden="true" class="mega-dropdown mega-work" data-panel="work"><div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Work</div><ul><li><a href="/projects">Projects</a></li><li><a href="/case-studies">Case Studies</a></li></ul></div></div></div>';
const company = '<div aria-hidden="true" class="mega-dropdown mega-company" data-panel="company"><div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Company</div><ul><li><a href="/pages/about">About Us</a></li><li><a href="/pages/careers">Careers</a></li><li><a href="/pages/contact">Contact</a></li></ul></div></div></div>';

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const end = original.indexOf('</header>');
  if (end < 0 && file.endsWith('404.html')) {
    const fallbackHeader = `<header><nav class="nav" aria-label="Primary navigation"><a class="brand" href="/"><img class="logo-full" src="/assets/images/official-logo-light.png" alt="Ingenuity Systems" width="300" height="72"></a><ul class="nav-links" id="primary-navigation"><li><a class="top-link" href="/">Home</a></li><li class="has-dropdown" data-menu="work"><a aria-expanded="false" aria-haspopup="true" class="top-link nav-work-link" href="/projects">Work <span aria-hidden="true" class="caret"></span></a></li><li class="has-dropdown" data-menu="company"><a aria-expanded="false" aria-haspopup="true" class="top-link" href="/pages/about">Company <span aria-hidden="true" class="caret"></span></a></li></ul></nav>${work}${company}</header>`;
    fs.writeFileSync(file, original.replace('<main', `${fallbackHeader}<main`));
  }
  if (end < 0) continue;
  let header = original.slice(0, end);
  const rest = original.slice(end);
  const active = /(?:^|\/)(?:projects|case-studies)(?:\/|\.html|$)/.test(file);
  header = header.replace(/<li\b[^>]*>[\s\S]*?class="[^"]*\bnav-work-link\b[^"]*"[\s\S]*?<\/li>/i,
    `<li class="has-dropdown" data-menu="work"><a aria-expanded="false" aria-haspopup="true" class="top-link nav-work-link${active ? ' active' : ''}" href="/projects">Work <span aria-hidden="true" class="caret"></span></a></li>`);
  header = removePanels(header, 'work');
  header = removePanels(header, 'company');
  const servicesStart = header.search(/<div\b[^>]*data-panel="services"[^>]*>/i);
  if (servicesStart >= 0) {
    const servicesEnd = matchingDivEnd(header, servicesStart);
    let services = header.slice(servicesStart, servicesEnd);
    if (!/href="\/pages\/ai-maturity"/.test(services)) services = services.replace(/<\/ul>/i, '<li><a href="/pages/ai-maturity">AI Maturity Assessment</a></li><li><a href="/pages/build-your-system">Build Your Own AI System</a></li></ul>');
    header = header.slice(0, servicesStart) + services + header.slice(servicesEnd);
  }
  header = header.replace(/href="([^"]+)"/g, (full, href) => {
    if (href === '/contact') return 'href="/pages/contact"';
    if (!href.endsWith('.html') && !href.includes('.html#')) return full;
    let route = href.startsWith('/') ? href : `/${href.replace(/^(?:\.\.\/)+/, '')}`;
    route = route.replace(/\/index\.html(?=#|$)/, '').replace(/\.html(?=#|$)/, '');
    if (route === '/contact') route = '/pages/contact';
    return `href="${route || '/'}"`;
  });
  header = header.replace(/<span aria-hidden="true" class="nav-project-dot"><\/span>/g, '');
  const companyPos = header.search(/<div\b[^>]*data-panel="company"[^>]*>/i);
  if (companyPos >= 0) header = header.slice(0, companyPos) + work + company + header.slice(companyPos);
  else header += work + company;
  fs.writeFileSync(file, header + rest);
}
console.log(`Normalized ${files.length} HTML headers`);