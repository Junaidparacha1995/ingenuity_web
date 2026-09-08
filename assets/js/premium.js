
const premiumSiteRoot = document.documentElement.dataset.siteRoot || '';
const premiumSiteHref = (path) => `${premiumSiteRoot}${path}`;

(() => {
  'use strict';
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tech ecosystem tabs
  $$('.tech-tab').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.tech-tab').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-selected',String(b===btn));});
    $$('.tech-panel').forEach(p=>p.classList.toggle('active',p.dataset.techPanel===btn.dataset.tech));
  }));

  // Interactive delivery process
  const processSteps=$$('.flow-step[data-process]');
  const activateProcess=i=>{
    processSteps.forEach(s=>s.classList.toggle('is-active',s.dataset.process===String(i)));
    $$('[data-process-panel]').forEach(p=>p.classList.toggle('active',p.dataset.processPanel===String(i)));
  };
  processSteps.forEach(s=>{
    const run=()=>activateProcess(s.dataset.process);
    s.addEventListener('click',run); s.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});
  });
  if(processSteps.length) activateProcess(0);

  // ROI calculator — directional planning model
  const people=$('#roi-people'), hours=$('#roi-hours'), rate=$('#roi-rate'), potential=$('#roi-potential');
  if(people&&hours&&rate&&potential){
    const nf=new Intl.NumberFormat('en-US'); const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
    const calc=()=>{
      const p=+people.value||0,h=+hours.value||0,r=+rate.value||0,a=(+potential.value||0)/100;
      const annual=p*h*52*a, value=annual*r, days=annual/8;
      $('#roi-people-out').textContent=p; $('#roi-hours-out').textContent=h; $('#roi-potential-out').textContent=Math.round(a*100)+'%';
      $('#roi-hours-saved').textContent=nf.format(Math.round(annual)); $('#roi-value').textContent=money.format(value); $('#roi-days').textContent=nf.format(Math.round(days));
    };
    [people,hours,rate,potential].forEach(i=>i.addEventListener('input',calc)); calc();
  }

  // Solution finder
  const estimator=$('#estimator-ui');
  if(estimator){
    const answers={}; let step=1;
    const map={
      manual:{title:'Business Process Automation',copy:'Start by mapping the repetitive workflow, handoffs, exceptions and systems involved. A focused automation pilot can validate value before you expand.',link:premiumSiteHref('services/automation')},
      knowledge:{title:'AI & Intelligent Systems',copy:'A knowledge assistant, RAG system, copilot or agentic workflow may be the best first move—especially when people spend time searching, interpreting or repeatedly answering the same questions.',link:premiumSiteHref('services/ai')},
      software:{title:'Software & Digital Engineering',copy:'Your starting point is likely a purpose-built application, portal, internal tool or digital product designed around the workflow rather than forcing the workflow into a generic platform.',link:premiumSiteHref('services/software')},
      systems:{title:'Systems Integration & Data',copy:'Start with the data and system handoffs. Connecting APIs, CRM/ERP platforms, databases and reporting layers can remove duplicate work and create a reliable operating picture.',link:premiumSiteHref('services/integration')}
    };
    const show=n=>{
      $$('.est-step',estimator).forEach(x=>x.classList.toggle('active',+x.dataset.step===n));
      const pct=((n-1)/4)*100; $('#est-progress-bar').style.width=pct+'%'; $('#est-progress-label').textContent=`Step ${n} of 4`;
    };
    const result=()=>{
      const primary=map[answers[1]]||map.manual;
      $$('.est-step',estimator).forEach(x=>x.classList.remove('active')); $('#est-result').classList.add('active');
      $('#est-progress-bar').style.width='100%'; $('#est-progress-label').textContent='Recommendation ready';
      $('#est-result-title').textContent=primary.title; $('#est-result-copy').textContent=primary.copy;
      $('#est-result-link').href=primary.link;
      try{localStorage.setItem('ingenuitySolutionFinder',JSON.stringify(answers));}catch(e){}
    };
    estimator.addEventListener('click',e=>{
      const b=e.target.closest('.est-options button'); if(!b)return;
      answers[step]=b.dataset.value; b.parentElement.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));
      if(step<4){step++;setTimeout(()=>show(step),reduce?0:180);}else setTimeout(result,reduce?0:220);
    });
    $('#est-reset')?.addEventListener('click',()=>{step=1;Object.keys(answers).forEach(k=>delete answers[k]);$('#est-result').classList.remove('active');$$('.est-options button',estimator).forEach(x=>x.classList.remove('selected'));show(1);});
    show(1);
  }

  // Architecture node tooltip / focus behavior
  $$('.plot-node').forEach((node,i)=>{
    node.setAttribute('tabindex','0'); node.setAttribute('role','img');
    const main=node.querySelector('.node-main')?.textContent?.trim()||'Technology layer';
    node.setAttribute('aria-label',`${main} technology layer`);
    node.addEventListener('focus',()=>node.classList.add('keyboard-focus'));
    node.addEventListener('blur',()=>node.classList.remove('keyboard-focus'));
  });

  // Contact query/prefill support from solution finder links.
  const contactForm=$('#contact-form');
  if(contactForm){
    const qs=new URLSearchParams(location.search); const brief=qs.get('brief');
    if(brief&&$('#message')) $('#message').value=brief;
  }

  // Hero pointer depth removed for a steadier premium feel.
})();

(() => {
  'use strict';
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

  // Product cockpit micro-interaction.
  const cockpit=$('.product-cockpit');
  if(cockpit){
    const titles={Overview:'Connected business overview','AI Agents':'AI agent activity','Automations':'Workflow automation control','Data':'Data synchronization overview','Integrations':'Connected systems overview'};
    $$('.cockpit-sidebar button',cockpit).forEach(btn=>btn.addEventListener('click',()=>{
      $$('.cockpit-sidebar button',cockpit).forEach(x=>x.classList.toggle('active',x===btn));
      const h=$('.cockpit-top h3',cockpit); if(h) h.textContent=titles[btn.textContent.trim()]||titles.Overview;
    }));
  }

  // Build Your AI System configurator.
  const builder=$('#system-builder');
  if(builder){
    const result=$('#builder-result');
    const architectures={
      manual:{title:'Automation + Integration Core',primary:'Business Process Automation',copy:'Start with the repetitive workflow, connect the systems that participate in it, and keep exception paths visible to people. Add AI only where interpretation or unstructured information creates meaningful leverage.',layer:'Workflow Engine'},
      knowledge:{title:'Knowledge Intelligence Layer',primary:'AI & Intelligent Systems',copy:'Use a governed knowledge layer with retrieval, permissions and evaluation before extending into agent actions. The best first release answers a narrow set of high-value questions reliably.',layer:'RAG + AI Assistant'},
      service:{title:'AI Service Orchestration',primary:'AI & Intelligent Systems',copy:'Route repeatable customer questions through a grounded assistant, preserve human escalation, and integrate with the systems agents already use so context follows the conversation.',layer:'AI Service Agent'},
      systems:{title:'Connected Data & Integration Layer',primary:'Systems Integration & Data',copy:'Create reliable handoffs between the systems already running the business. Once data and events are trustworthy, automation and AI can sit on top without creating another silo.',layer:'Integration Hub'},
      product:{title:'Custom Product + Intelligent Services',primary:'Software & Digital Engineering',copy:'Design the product experience around the workflow, then connect intelligence, automation and data services behind it as modular capabilities that can evolve independently.',layer:'Custom Application'}
    };
    const render=()=>{
      const challenge=$('#builder-challenge')?.value||'manual';
      const stack=$('#builder-stack')?.value||'fragmented';
      const scale=$('#builder-scale')?.value||'small';
      const a=architectures[challenge];
      $('#builder-title').textContent=a.title;
      $('#builder-primary').textContent=a.primary;
      $('#builder-control').textContent=scale==='large'?'Identity + audit + approvals':'Human approval + logging';
      $('#builder-delivery').textContent=scale==='large'?'Phased rollout → observe → scale':'Pilot → measure → expand';
      $('#builder-copy').textContent=a.copy;
      const source=stack==='manual'?'Email / Sheets':stack==='crm'?'CRM':stack==='erp'?'ERP':stack==='custom'?'Existing App':'Business Tools';
      const chain=['User / Trigger',a.layer,source,scale==='large'?'Governance Layer':'Human Review','Analytics'];
      const wrap=$('#builder-chain'); wrap.innerHTML='';
      chain.forEach((label,i)=>{const span=document.createElement('span');span.textContent=label;wrap.appendChild(span);if(i<chain.length-1){const arrow=document.createElement('i');wrap.appendChild(arrow);}});
      result?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'nearest'});
    };
    builder.addEventListener('submit',e=>{e.preventDefault();render();});
    render();
  }

  // AI maturity assessment + downloadable executive summary.
  const maturity=$('#maturity-form');
  if(maturity){
    const answers={}; let current=null;
    const stages=[
      {max:12,title:'Stage 1 — Manual Foundation',copy:'The largest opportunity is process clarity. Map repetitive work, remove unnecessary steps, and establish reliable ownership/data before adding complex AI.',actions:['Map top 3 repetitive workflows','Standardize key data','Choose one low-risk pilot']},
      {max:18,title:'Stage 2 — Digitized',copy:'You have tools, but work is still fragmented. Focus on integrations and workflow automation so information moves predictably between systems.',actions:['Connect core systems','Automate handoffs','Define workflow KPIs']},
      {max:24,title:'Stage 3 — Automated',copy:'Your foundation can support targeted AI. Add knowledge, classification, extraction or copilots where people still spend time interpreting information.',actions:['Prioritize AI-assisted workflows','Add evaluation & logging','Create human escalation rules']},
      {max:30,title:'Stage 4 — AI-Assisted',copy:'AI is becoming part of operations. The next step is orchestration, governance and measurement across multiple workflows rather than isolated experiments.',actions:['Orchestrate cross-system agents','Strengthen governance','Measure business outcomes']},
      {max:35,title:'Stage 5 — Intelligent Enterprise',copy:'Your environment is positioned for broader intelligent operations. Optimize reliability, observability, cost and change management while expanding into higher-value use cases.',actions:['Scale proven patterns','Optimize model/tool routing','Continuously evaluate outcomes']}
    ];
    const update=()=>{
      const count=Object.keys(answers).length;
      const btn=$('#download-maturity');
      if(count<7){$('#maturity-title').textContent=`${count}/7 questions completed`;$('#maturity-copy').textContent='Complete all seven questions to generate your maturity stage and recommendations.';$('#maturity-meter-fill').style.width=(count/7*35)+'%'; if(btn)btn.disabled=true;return;}
      const score=Object.values(answers).reduce((a,b)=>a+b,0); current=stages.find(x=>score<=x.max)||stages.at(-1);
      $('#maturity-title').textContent=current.title;
      $('#maturity-copy').textContent=current.copy;
      $('#maturity-meter-fill').style.width=(score/35*100)+'%';
      const acts=$('#maturity-actions'); acts.innerHTML='';current.actions.forEach(a=>{const s=document.createElement('span');s.textContent=a;acts.appendChild(s);});
      if(btn)btn.disabled=false;
      try{localStorage.setItem('ingenuityMaturity',JSON.stringify({answers,score,stage:current.title}));}catch(e){}
    };
    $$('.maturity-q').forEach(q=>q.addEventListener('click',e=>{
      const b=e.target.closest('button[data-score]');if(!b)return;
      q.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));
      answers[q.dataset.q]=+b.dataset.score;update();
    }));
    $('#download-maturity')?.addEventListener('click',()=>{
      if(!current)return;
      const score=Object.values(answers).reduce((a,b)=>a+b,0);
      const html=`<!doctype html><meta charset="utf-8"><title>Ingenuity Systems — AI Maturity Report</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:50px auto;color:#14233b;line-height:1.6}h1{font-size:34px}.tag{color:#e13511;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.box{background:#f4f6f8;padding:22px;border-radius:14px;margin:22px 0}li{margin:8px 0}.foot{margin-top:40px;font-size:12px;color:#697586}</style><div class="tag">Ingenuity Systems</div><h1>AI & Automation Maturity Report</h1><p>Generated ${new Date().toLocaleDateString()}</p><div class="box"><strong>${current.title}</strong><p>Assessment score: ${score}/35</p><p>${current.copy}</p></div><h2>Recommended next moves</h2><ul>${current.actions.map(x=>`<li>${x}</li>`).join('')}</ul><p class="foot">Directional planning assessment only. Final recommendations depend on actual workflows, data, systems, risk and business objectives. ingenuitysys.com</p>`;
      const blob=new Blob([html],{type:'text/html'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ingenuity-ai-maturity-report.html';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    });
    update();
  }

  // Premium count-up animation: visible 0 → value with suffix/prefix support.
  const autoCounterSelectors='[data-countup], .stat-item .num, .project-metrics strong, .real-case-metrics strong';
  const countEls=$$(autoCounterSelectors);
  const parseCounter=(el)=>{
    if(el.dataset.countup!==undefined) return {end:Number(el.dataset.countup||0),prefix:el.dataset.prefix||'',suffix:el.dataset.suffix||'',decimals:Number(el.dataset.decimals||0)};
    const raw=(el.textContent||'').trim(),m=raw.match(/(-?\d+(?:[.,]\d+)?)/);
    if(!m)return null; const token=m[1],end=Number(token.replace(/,/g,''));
    return {end,prefix:raw.slice(0,m.index),suffix:raw.slice((m.index||0)+token.length),decimals:(token.split('.')[1]||'').length};
  };
  if(countEls.length){
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animateCount=(el)=>{
      if(el.dataset.counted==='true')return; const cfg=parseCounter(el); if(!cfg)return;
      el.dataset.counted='true'; const duration=reduce?0:1450; const start=performance.now();
      const fmt=v=>{const n=cfg.decimals?v.toFixed(cfg.decimals):Math.round(v).toLocaleString();return `${cfg.prefix}${n}${cfg.suffix}`};
      if(!reduce)el.textContent=fmt(0);
      const tick=(now)=>{const p=duration?Math.min(1,(now-start)/duration):1;const eased=1-Math.pow(1-p,5);el.textContent=fmt(cfg.end*eased);el.style.setProperty('--counter-progress',p);if(p<1)requestAnimationFrame(tick);else{el.textContent=fmt(cfg.end);el.classList.add('countup-pop');}};
      requestAnimationFrame(tick);
    };
    if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){animateCount(e.target);io.unobserve(e.target);}}),{threshold:.28,rootMargin:'0px 0px -8% 0px'});countEls.forEach(el=>io.observe(el));}else countEls.forEach(animateCount);
  }

  // Expand the local assistant into a full-screen consultant workspace.
  const assistant=$('#site-assistant'), panel=$('#assistant-panel'), close=$('#assistant-close');
  if(assistant&&panel&&close&&!$('#assistant-expand')){
    const actions=document.createElement('div');actions.className='assistant-header-actions';
    const expand=document.createElement('button');expand.type='button';expand.id='assistant-expand';expand.className='assistant-expand';expand.setAttribute('aria-label','Expand assistant');expand.setAttribute('aria-pressed','false');expand.innerHTML='↗';
    close.parentNode.insertBefore(actions,close);actions.append(expand,close);
    const toggle=()=>{const full=assistant.classList.toggle('fullscreen');expand.setAttribute('aria-pressed',String(full));expand.setAttribute('aria-label',full?'Exit full-screen assistant':'Expand assistant');expand.textContent=full?'↙':'↗';};
    expand.addEventListener('click',toggle);
    close.addEventListener('click',()=>{assistant.classList.remove('fullscreen');expand.setAttribute('aria-pressed','false');expand.textContent='↗';});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&assistant.classList.contains('fullscreen')){assistant.classList.remove('fullscreen');expand.setAttribute('aria-pressed','false');expand.textContent='↗';}});
  }
})();
