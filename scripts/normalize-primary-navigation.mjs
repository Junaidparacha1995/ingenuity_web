import fs from 'node:fs';
import path from 'node:path';

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'attached_assets' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
}
walk('.');

const panels = {
  services: '<div aria-hidden="true" class="mega-dropdown" data-panel="services"><div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Services</div><ul><li><a href="/services/ai">AI &amp; Intelligent Systems</a></li><li><a href="/services/automation">Business Process Automation</a></li><li><a href="/services/software">Software &amp; Digital Engineering</a></li><li><a href="/services/integration">Systems Integration &amp; Data</a></li><li><a href="/pages/ai-maturity">AI Maturity Assessment</a></li><li><a href="/pages/build-your-system">Build Your Own AI System</a></li></ul></div></div></div>',
  industries: '<div aria-hidden="true" class="mega-dropdown" data-panel="industries"><div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Industries</div><ul><li><a href="/industries/ecommerce">Ecommerce &amp; Retail</a></li><li><a href="/industries/financial">Financial Services</a></li><li><a href="/industries/healthcare">Healthcare</a></li><li><a href="/industries/manufacturing">Manufacturing</a></li><li><a href="/industries/technology">Technology &amp; SaaS</a></li></ul></div></div></div>',
  work: '<div aria-hidden="true" class="mega-dropdown mega-work" data-panel="work"><div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Work</div><ul><li><a href="/projects">Projects</a></li><li><a href="/case-studies">Case Studies</a></li></ul></div></div></div>',
  company: '<div aria-hidden="true" class="mega-dropdown mega-company" data-panel="company"><div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Company</div><ul><li><a href="/pages/about">About Us</a></li><li><a href="/pages/careers">Careers</a></li><li><a href="/pages/contact">Contact</a></li></ul></div></div></div>'
};

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const headerEnd = source.indexOf('</header>');
  if (headerEnd < 0) continue;
  const header = source.slice(0, headerEnd);
  const relative = file.replaceAll('\\', '/');
  const active = relative === 'index.html' ? 'home' :
    relative.startsWith('services/') || /ai-maturity|build-your-system/.test(relative) ? 'services' :
    relative.startsWith('industries/') ? 'industries' :
    relative.startsWith('projects/') || relative.startsWith('case-studies/') ? 'work' :
    'company';
  const item = (key, label, href, dropdown = true) =>
    `<li class="${dropdown ? 'has-dropdown' : ''}"${dropdown ? ` data-menu="${key}"` : ''}><a aria-expanded="${dropdown ? 'false' : undefined}" aria-haspopup="${dropdown ? 'true' : undefined}" class="top-link${active === key ? ' active' : ''}" href="${href}">${label}${dropdown ? ' <span aria-hidden="true" class="caret"></span>' : ''}</a></li>`
      .replace(' aria-expanded="undefined"', '').replace(' aria-haspopup="undefined"', '');
  const nav = `<ul class="nav-links" id="primary-navigation">${item('home', 'Home', '/')}${item('services', 'Services', '/services')}${item('industries', 'Industries', '/industries')}${item('work', 'Work', '/projects')}${item('company', 'Company', '/pages/about')}</ul>`;
  let result = source.slice(0, headerEnd).replace(/<ul class="nav-links" id="primary-navigation">[\s\S]*?<\/ul>/, nav) + source.slice(headerEnd);
  const resultHeaderEnd = result.indexOf('</header>');
  let headerPart = result.slice(0, resultHeaderEnd);
  for (const [key, panel] of Object.entries(panels)) {
    const matches = [...headerPart.matchAll(new RegExp(`data-panel="${key}"`, 'g'))];
    if (matches.length === 0) headerPart += panel;
  }
  result = headerPart + result.slice(resultHeaderEnd);
  fs.writeFileSync(file, result);
}
console.log(`Normalized primary navigation in ${files.length} HTML files`);