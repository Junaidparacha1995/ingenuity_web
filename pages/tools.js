(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const pageRoot = document.documentElement;
  if (!pageRoot.hasAttribute('data-tool-page')) return;

  // The baseline navigation script is shared by root pages. Repair its relative
  // links for these /pages/ tools without changing navigation on other pages.
  const localize = (href) => {
    if (!href || /^(?:https?:|mailto:|tel:|#|javascript:)/i.test(href) || href.startsWith('../')) return href;
    return '../' + href;
  };
  $$('header a[href]').forEach((link) => {
    link.setAttribute('href', localize(link.getAttribute('href')));
  });
  const servicesPanel = $('.mega-dropdown[data-panel="services"]');
  const servicesList = servicesPanel?.querySelector('.mega-col ul');
  if (servicesList) {
    [
      ['AI Maturity Assessment', 'ai-maturity.html'],
      ['Build Your Own AI System', 'build-your-system.html']
    ].forEach(([label, href]) => {
      if (!servicesPanel.querySelector('a[href="../pages/' + href + '"]')) {
        const item = document.createElement('li');
        item.innerHTML = '<a href="../pages/' + href + '">' + label + '</a>';
        servicesList.appendChild(item);
      }
    });
  }

  // Build Your AI System configurator.
  const builder = $('#system-builder');
  if (builder) {
    const result = $('#builder-result');
    const architectures = {
      manual: { title: 'Automation + Integration Core', primary: 'Business Process Automation', copy: 'Start with the repetitive workflow, connect the systems that participate in it, and keep exception paths visible to people. Add AI only where interpretation or unstructured information creates meaningful leverage.', layer: 'Workflow Engine' },
      knowledge: { title: 'Knowledge Intelligence Layer', primary: 'AI & Intelligent Systems', copy: 'Use a governed knowledge layer with retrieval, permissions and evaluation before extending into agent actions. The best first release answers a narrow set of high-value questions reliably.', layer: 'RAG + AI Assistant' },
      service: { title: 'AI Service Orchestration', primary: 'AI & Intelligent Systems', copy: 'Route repeatable customer questions through a grounded assistant, preserve human escalation, and integrate with the systems agents already use so context follows the conversation.', layer: 'AI Service Agent' },
      systems: { title: 'Connected Data & Integration Layer', primary: 'Systems Integration & Data', copy: 'Create reliable handoffs between the systems already running the business. Once data and events are trustworthy, automation and AI can sit on top without creating another silo.', layer: 'Integration Hub' },
      product: { title: 'Custom Product + Intelligent Services', primary: 'Software & Digital Engineering', copy: 'Design the product experience around the workflow, then connect intelligence, automation and data services behind it as modular capabilities that can evolve independently.', layer: 'Custom Application' }
    };
    const industryContext = {
      professional: 'For professional services, prioritize client handoffs, document access, and clear ownership of follow-up work.',
      realestate: 'For property teams, connect inquiries, listings, and CRM records while keeping agents in control of client communication.',
      financial: 'For financial operations, prioritize reconciliation, traceable review, and approval boundaries around sensitive records.',
      healthcare: 'For healthcare operations, start with administrative workflows, minimum necessary data access, and human review of patient-facing communication.',
      manufacturing: 'For manufacturing, connect inventory, production events, and ERP handoffs with visible exception handling.',
      ecommerce: 'For ecommerce, align order, inventory, and support workflows so customers and operations teams share consistent information.',
      technology: 'For technology and SaaS teams, connect product events, support context, and internal tools with measurable rollout checkpoints.'
    };
    const render = (scroll = false) => {
      const industry = $('#builder-industry')?.value || 'professional';
      const challenge = $('#builder-challenge')?.value || 'manual';
      const stack = $('#builder-stack')?.value || 'fragmented';
      const scale = $('#builder-scale')?.value || 'small';
      const architecture = architectures[challenge];
      $('#builder-title').textContent = architecture.title;
      $('#builder-primary').textContent = architecture.primary;
      $('#builder-control').textContent = scale === 'large' ? 'Identity + audit + approvals' : 'Human approval + logging';
      $('#builder-delivery').textContent = scale === 'large' ? 'Phased rollout → observe → scale' : 'Pilot → measure → expand';
      $('#builder-copy').textContent = architecture.copy + ' ' + (industryContext[industry] || industryContext.professional);
      const source = stack === 'manual' ? 'Email / Sheets' : stack === 'crm' ? 'CRM' : stack === 'erp' ? 'ERP' : stack === 'custom' ? 'Existing App' : 'Business Tools';
      const chain = ['User / Trigger', architecture.layer, source, scale === 'large' ? 'Governance Layer' : 'Human Review', 'Analytics'];
      const chainWrap = $('#builder-chain');
      chainWrap.replaceChildren();
      chain.forEach((label, index) => {
        const span = document.createElement('span');
        span.textContent = label;
        chainWrap.appendChild(span);
        if (index < chain.length - 1) {
          const arrow = document.createElement('i');
          chainWrap.appendChild(arrow);
        }
      });
      if (scroll) result?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    };
    builder.addEventListener('submit', (event) => { event.preventDefault(); render(true); });
    render();
  }

  // AI maturity assessment and downloadable executive summary.
  const maturity = $('#maturity-form');
  if (maturity) {
    const answers = {};
    let current = null;
    const stages = [
      { max: 12, title: 'Stage 1: Manual Foundation', copy: 'The largest opportunity is process clarity. Map repetitive work, remove unnecessary steps, and establish reliable ownership/data before adding complex AI.', actions: ['Map top 3 repetitive workflows', 'Standardize key data', 'Choose one low-risk pilot'] },
      { max: 18, title: 'Stage 2: Digitized', copy: 'You have tools, but work is still fragmented. Focus on integrations and workflow automation so information moves predictably between systems.', actions: ['Connect core systems', 'Automate handoffs', 'Define workflow KPIs'] },
      { max: 24, title: 'Stage 3: Automated', copy: 'Your foundation can support targeted AI. Add knowledge, classification, extraction or copilots where people still spend time interpreting information.', actions: ['Prioritize AI-assisted workflows', 'Add evaluation & logging', 'Create human escalation rules'] },
      { max: 30, title: 'Stage 4: AI Assisted', copy: 'AI is becoming part of operations. The next step is orchestration, governance and measurement across multiple workflows rather than isolated experiments.', actions: ['Orchestrate cross-system agents', 'Strengthen governance', 'Measure business outcomes'] },
      { max: 35, title: 'Stage 5: Intelligent Enterprise', copy: 'Your environment is positioned for broader intelligent operations. Optimize reliability, observability, cost and change management while expanding into higher-value use cases.', actions: ['Scale proven patterns', 'Optimize model/tool routing', 'Continuously evaluate outcomes'] }
    ];
    const update = () => {
      const count = Object.keys(answers).length;
      const download = $('#download-maturity');
      if (count < 7) {
        $('#maturity-title').textContent = count + '/7 questions completed';
        $('#maturity-copy').textContent = 'Complete all seven questions to generate your maturity stage and recommendations.';
        $('#maturity-meter-fill').style.width = (count / 7 * 35) + '%';
        if (download) download.disabled = true;
        return;
      }
      const score = Object.values(answers).reduce((sum, value) => sum + value, 0);
      current = stages.find((stage) => score <= stage.max) || stages[stages.length - 1];
      $('#maturity-title').textContent = current.title;
      $('#maturity-copy').textContent = current.copy;
      $('#maturity-meter-fill').style.width = (score / 35 * 100) + '%';
      const actions = $('#maturity-actions');
      actions.replaceChildren();
      current.actions.forEach((action) => {
        const item = document.createElement('span');
        item.textContent = action;
        actions.appendChild(item);
      });
      if (download) download.disabled = false;
      try { localStorage.setItem('ingenuityMaturity', JSON.stringify({ answers, score, stage: current.title })); } catch (error) { /* private browsing */ }
    };
    $$('.maturity-q').forEach((question) => question.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-score]');
      if (!button) return;
      question.querySelectorAll('button').forEach((option) => option.classList.toggle('selected', option === button));
      answers[question.dataset.q] = Number(button.dataset.score);
      update();
    }));
    $('#download-maturity')?.addEventListener('click', () => {
      if (!current) return;
      const score = Object.values(answers).reduce((sum, value) => sum + value, 0);
      const report = '<!doctype html><meta charset="utf-8"><title>Ingenuity Systems: AI Maturity Report</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:50px auto;color:#14233b;line-height:1.6}h1{font-size:34px}.tag{color:#e13511;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.box{background:#f4f6f8;padding:22px;border-radius:14px;margin:22px 0}li{margin:8px 0}.foot{margin-top:40px;font-size:12px;color:#697586}</style><div class="tag">Ingenuity Systems</div><h1>AI &amp; Automation Maturity Report</h1><p>Generated ' + new Date().toLocaleDateString() + '</p><div class="box"><strong>' + current.title + '</strong><p>Assessment score: ' + score + '/35</p><p>' + current.copy + '</p></div><h2>Recommended next moves</h2><ul>' + current.actions.map((action) => '<li>' + action + '</li>').join('') + '</ul><p class="foot">Directional planning assessment only. Final recommendations depend on actual workflows, data, systems, risk and business objectives.</p>';
      const blob = new Blob([report], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ingenuity-ai-maturity-report.html';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
    update();
  }
})();
