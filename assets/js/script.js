(() => {
  'use strict';

  const siteRoot = document.documentElement.dataset.siteRoot || '';
  const siteHref = (path) => `${siteRoot}${path}`;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Brief startup sequence ---------- */
  const skipStartup = new URLSearchParams(window.location.search).has('skip-startup');
  const startup = document.createElement('div');
  startup.className = 'startup-screen';
  startup.setAttribute('role', 'status');
  startup.setAttribute('aria-label', 'Loading Ingenuity Systems');
  startup.innerHTML = `
    <div class="startup-core">
      <div class="startup-mark"><img src="${siteHref('assets/images/official-logo-icon.png')}" alt="" aria-hidden="true"></div>
      <div class="startup-wordmark">Ingenuity Systems</div>
      <div class="startup-status"><i aria-hidden="true"></i><span>Initializing connected systems</span></div>
    </div>`;
  if (!skipStartup) {
    document.body.prepend(startup);
    document.body.classList.add('startup-active');
  }
  const finishStartup = () => {
    startup.classList.add('is-complete');
    document.body.classList.remove('startup-active');
    setTimeout(() => startup.remove(), reduceMotion ? 0 : 560);
  };
  if (!skipStartup) window.setTimeout(finishStartup, reduceMotion ? 220 : 1150);

  /* ---------- Ambient pointer + custom cursor ---------- */
  const spotlight = document.createElement('div');
  spotlight.id = 'dot-spotlight';
  document.body.prepend(spotlight);
  const cursor = $('#cursor-dot');
  if (!reduceMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.addEventListener('pointermove', (e) => {
      document.body.classList.add('cursor-active');
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
      spotlight.classList.add('active');
      if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }
    }, { passive: true });
    document.addEventListener('pointerdown', () => document.body.classList.add('cursor-down'));
    document.addEventListener('pointerup', () => document.body.classList.remove('cursor-down'));
    $$('a,button,input,textarea,select,.cap-card,.service-tile,.wide-card,.im-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ---------- Header, progress, mega navigation ---------- */
  const siteHeader = document.body.querySelector(':scope > header');
  const progress = $('#scroll-progress');
  let progressTimer;
  const onScroll = () => {
    const y = window.scrollY;
    if (siteHeader) siteHeader.classList.toggle('scrolled', y > 44);
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progress.style.width = `${Math.min(100, (y / max) * 100)}%`;
      progress.classList.add('visible');
      clearTimeout(progressTimer);
      progressTimer = setTimeout(() => progress.classList.remove('visible'), 700);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuToggle = $('.menu-toggle');
  const navLinks = $('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      navLinks.classList.toggle('open', open);
    });
    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a') && !event.target.closest('.has-dropdown > .top-link')) {
        document.body.classList.remove('menu-open');
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const menuItems = $$('.has-dropdown[data-menu]');
  const panels = $$('.mega-dropdown[data-panel]');
  const megaWrap = $('.mega-wrap');
  const closeMega = () => {
    menuItems.forEach(i => { i.classList.remove('open'); i.querySelector('.top-link')?.setAttribute('aria-expanded','false'); });
    panels.forEach(p => { p.classList.remove('open'); p.setAttribute('aria-hidden','true'); });
    if (megaWrap) megaWrap.removeAttribute('data-active');
    if (siteHeader && innerWidth > 720) siteHeader.classList.remove('menu-open');
  };
  /* Keep copied headers aligned: Work is a focused two-link menu and Company
     is intentionally small. This also makes older static headers accessible
     without duplicating navigation markup in every page. */
  const workLink = $('.nav-work-link');
  if (workLink && !workLink.closest('.has-dropdown')) {
    const li = workLink.closest('li');
    if (li) {
      li.className = 'has-dropdown';
      li.dataset.menu = 'work';
      workLink.setAttribute('aria-haspopup', 'true');
      workLink.setAttribute('aria-expanded', 'false');
      workLink.innerHTML = 'Work <span aria-hidden="true" class="caret"></span>';
      const panel = document.createElement('div');
      panel.className = 'mega-dropdown mega-work';
      panel.dataset.panel = 'work';
      panel.setAttribute('aria-hidden', 'true');
      panel.innerHTML = '<div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Work</div><ul><li><a href="/projects">Projects</a></li><li><a href="/case-studies">Case Studies</a></li></ul></div></div>';
      document.querySelector('header')?.append(panel);
      menuItems.push(li);
      panels.push(panel);
    }
  }
  $$('.logo-full').forEach((logo) => {
    logo.src = siteHref('assets/images/official-logo-light.png');
  });
  $$('.footer-watermark, .startup-mark img, .cockpit-brand img').forEach((logo) => {
    logo.src = siteHref('assets/images/official-logo-icon.png');
  });
  $$('link[rel="icon"]').forEach((icon) => { icon.href = siteHref('assets/images/official-logo-icon.png'); });
  $$('img[src*="images.unsplash.com"]').forEach((image) => {
    if (image.dataset.fallback) image.src = image.dataset.fallback;
  });
  const companyPanel = $('.mega-dropdown[data-panel="company"]');
  companyPanel?.querySelectorAll('a[href*="ai-maturity"],a[href*="build-your-system"]').forEach((link) => link.closest('li')?.remove());
  const servicesPanel = $('.mega-dropdown[data-panel="services"]');
  if (servicesPanel && !servicesPanel.querySelector('a[href*="ai-maturity"]')) {
    const lists = servicesPanel.querySelectorAll('ul');
    const list = lists[lists.length - 1] || servicesPanel.querySelector('ul');
    if (list) list.insertAdjacentHTML('beforeend',
      `<li><a href="${siteHref('pages/ai-maturity')}">AI Maturity Assessment</a></li><li><a href="${siteHref('pages/build-your-system')}">Build Your Own AI System</a></li>`);
  }
  const existingWorkPanel = $('.mega-dropdown[data-panel="work"]');
  if (existingWorkPanel) {
    existingWorkPanel.innerHTML = `<div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Work</div><ul><li><a href="${siteHref('projects')}">Projects</a></li><li><a href="${siteHref('case-studies')}">Case Studies</a></li></ul></div></div>`;
  }
  if (companyPanel) {
    companyPanel.innerHTML = `<div class="mega-inner"><div class="mega-col"><div class="mega-col-title">Company</div><ul><li><a href="${siteHref('pages/about')}">About Us</a></li><li><a href="${siteHref('pages/careers')}">Careers</a></li><li><a href="${siteHref('pages/contact')}">Contact</a></li></ul></div></div>`;
  }
  menuItems.forEach(item => {
    const key = item.dataset.menu;
    const panel = $(`.mega-dropdown[data-panel="${key}"]`);
    if (!panel) return;
    const topLink = item.querySelector(':scope > .top-link');
    const mobileSubmenu = document.createElement('ul');
    mobileSubmenu.className = 'mobile-submenu';
    mobileSubmenu.setAttribute('aria-label', `${topLink?.textContent.trim() || key} submenu`);
    panel.querySelectorAll('a').forEach(link => {
      const entry = document.createElement('li');
      const copy = link.cloneNode(true);
      copy.removeAttribute('class');
      entry.append(copy);
      mobileSubmenu.append(entry);
    });
    item.append(mobileSubmenu);
    const activate = () => {
      menuItems.forEach(i => i.classList.remove('open'));
      panels.forEach(p => p.classList.remove('open'));
      item.classList.add('open');
      item.querySelector('.top-link')?.setAttribute('aria-expanded','true');
      panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
      if (megaWrap) megaWrap.dataset.active = key;
      if (siteHeader) siteHeader.classList.add('menu-open');
    };
    item.addEventListener('mouseenter', activate);
    item.addEventListener('focusin', activate);
    panel.addEventListener('mouseenter', activate);
    panel.addEventListener('mouseleave', closeMega);
    topLink?.addEventListener('click', event => {
      event.preventDefault();
      if (innerWidth <= 720) {
        const willOpen = !item.classList.contains('mobile-open');
        menuItems.forEach(i => {
          i.classList.remove('mobile-open');
          i.querySelector(':scope > .top-link')?.setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('mobile-open', willOpen);
        topLink.setAttribute('aria-expanded', String(willOpen));
      } else if (item.classList.contains('open')) {
        closeMega();
      } else {
        activate();
      }
    });
  });
  if (siteHeader) siteHeader.addEventListener('mouseleave', e => {
    if (innerWidth > 720 && !e.relatedTarget?.closest?.('.mega-dropdown')) closeMega();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMega(); });
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('header')) return;
    closeMega();
    menuItems.forEach(item => item.classList.remove('mobile-open'));
    if (innerWidth <= 720) {
      document.body.classList.remove('menu-open');
      navLinks?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Scroll reveal / stagger ---------- */
  const revealTargets = $$([
    '.reveal', '.reveal-left', '.reveal-right', '.reveal-scale',
    '.cap-card', '.service-tile', '.flow-step', '.industry-card',
    '.wide-card', '.ng-node', '.capability-block'
  ].join(','));
  revealTargets.forEach((el, i) => {
    if (!el.style.transitionDelay && !el.classList.contains('capability-block')) {
      el.style.transitionDelay = `${Math.min((i % 5) * 55, 220)}ms`;
    }
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -3% 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else revealTargets.forEach(el => el.classList.add('in-view'));

  /* ---------- Hero text rotator ---------- */
  const heroSlides = $$('.hero-slide');
  const heroDots = $('#hero-dots');
  let heroIndex = 0;
  let heroTimer;
  if (heroSlides.length && heroDots) {
    heroSlides.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = `hero-dot${i === 0 ? ' active' : ''}`;
      b.setAttribute('aria-label', `Show hero message ${i + 1}`);
      b.addEventListener('click', () => showHero(i, true));
      heroDots.appendChild(b);
    });
    const dots = $$('.hero-dot', heroDots);
    function showHero(i, restart = false) {
      heroIndex = (i + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((s, n) => s.classList.toggle('active', n === heroIndex));
      dots.forEach((d, n) => d.classList.toggle('active', n === heroIndex));
      if (restart) startHero();
    }
    function startHero() {
      clearInterval(heroTimer);
      if (!reduceMotion) heroTimer = setInterval(() => showHero(heroIndex + 1), 6500);
    }
    startHero();
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(heroTimer); else startHero(); });
    $('#hero-console')?.addEventListener('mouseenter', () => clearInterval(heroTimer));
    $('#hero-console')?.addEventListener('mouseleave', startHero);
  }

  /* ---------- Interactive 3D hero systems topology ---------- */
  const canvas = $('#hc-graph');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const inspector = $('#hc-node-inspector');
    const inspectorKicker = $('#hc-node-kicker');
    const inspectorTitle = $('#hc-node-title');
    const inspectorCopy = $('#hc-node-copy');
    let w = 0, h = 0, dpr = 1, t = 0, mx = .5, my = .5;
    let canvasActive = true, canvasRAF = null, hoveredId = null, activeId = 'core';
    let lastRects = {};

    const nodes = [
      {id:'crm', x:.11, y:.25, z:.18, label:'CRM', group:'input', kicker:'Business input', detail:'Customer data, pipeline activity, and CRM events enter the connected operating layer.'},
      {id:'docs', x:.11, y:.50, z:.10, label:'Documents', group:'input', kicker:'Business input', detail:'Policies, files, knowledge, and operational documents become usable context for AI and workflows.'},
      {id:'events', x:.11, y:.75, z:.14, label:'Events', group:'input', kicker:'Business input', detail:'Real-time triggers from applications and teams initiate intelligent automations.'},
      {id:'rag', x:.35, y:.19, z:.34, label:'RAG', group:'intel', kicker:'Intelligence layer', detail:'Retrieval grounds AI responses in approved company knowledge and operational context.'},
      {id:'models', x:.39, y:.38, z:.42, label:'AI Models', group:'intel', kicker:'Intelligence layer', detail:'Reasoning and generative models interpret requests, classify work, and create useful outputs.'},
      {id:'rules', x:.34, y:.60, z:.26, label:'Rules', group:'intel', kicker:'Control layer', detail:'Business logic, permissions, approvals, and safeguards keep automation aligned with operations.'},
      {id:'data', x:.41, y:.79, z:.30, label:'Data', group:'intel', kicker:'Data layer', detail:'Structured data, analytics, and system records provide the shared state behind decisions.'},
      {id:'core', x:.61, y:.49, z:.72, label:'Orchestrator', group:'core', kicker:'Intelligent core', detail:'Coordinates AI, rules, data, and workflows across connected business systems.'},
      {id:'support', x:.84, y:.20, z:.30, label:'Support', group:'output', kicker:'Business outcome', detail:'AI-assisted service workflows respond faster while preserving escalation and human review.'},
      {id:'sales', x:.87, y:.39, z:.38, label:'Sales', group:'output', kicker:'Business outcome', detail:'Lead routing, qualification, follow-up, and CRM updates become connected and measurable.'},
      {id:'ops', x:.84, y:.60, z:.34, label:'Operations', group:'output', kicker:'Business outcome', detail:'Operational workflows execute consistently across teams, systems, and approvals.'},
      {id:'bi', x:.88, y:.79, z:.26, label:'Analytics', group:'output', kicker:'Business outcome', detail:'Live operational data feeds reporting, measurement, and continuous improvement.'}
    ];
    const edgePairs = [
      ['crm','rag'],['crm','models'],['docs','rag'],['docs','rules'],['events','rules'],['events','data'],
      ['rag','core'],['models','core'],['rules','core'],['data','core'],
      ['core','support'],['core','sales'],['core','ops'],['core','bi'],
      ['rag','models'],['models','rules'],['rules','data']
    ];
    const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));

    const updateInspector = (node) => {
      if (!node || !inspector) return;
      inspector.dataset.group = node.group;
      if (inspectorKicker) inspectorKicker.textContent = node.kicker;
      if (inspectorTitle) inspectorTitle.textContent = node.label;
      if (inspectorCopy) inspectorCopy.textContent = node.detail;
    };
    updateInspector(byId[activeId]);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width); h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    new ResizeObserver(resize).observe(canvas);

    const roundedRect = (x,y,width,height,r) => {
      const rr=Math.min(r,width/2,height/2);
      ctx.beginPath();
      ctx.moveTo(x+rr,y);ctx.arcTo(x+width,y,x+width,y+height,rr);ctx.arcTo(x+width,y+height,x,y+height,rr);ctx.arcTo(x,y+height,x,y,rr);ctx.arcTo(x,y,x+width,y,rr);ctx.closePath();
    };
    const compact = () => w < 640;
    const pos = n => {
      const pointerDepth = compact() ? 0 : 1;
      return {
        x:n.x*w + (mx-.5)*(9+n.z*24)*pointerDepth,
        y:n.y*h + (my-.5)*(6+n.z*16)*pointerDepth - n.z*(compact()?4:8),
        scale:1+n.z*.07
      };
    };
    const bezierPoint=(p0,p1,p2,p3,u)=>{
      const v=1-u;
      return {x:v**3*p0.x+3*v**2*u*p1.x+3*v*u**2*p2.x+u**3*p3.x,y:v**3*p0.y+3*v**2*u*p1.y+3*v*u**2*p2.y+u**3*p3.y};
    };

    const drawIsoGrid = () => {
      const horizon = compact()?58:66, baseY=h-28, center=w*.60;
      ctx.save();ctx.lineWidth=1;
      for(let i=-7;i<=7;i++){
        const bx=center+i*(w/(compact()?7:10));
        ctx.strokeStyle='rgba(255,255,255,.035)';ctx.beginPath();ctx.moveTo(center+i*8,horizon);ctx.lineTo(bx,baseY);ctx.stroke();
      }
      for(let i=0;i<7;i++){
        const p=i/7, y=horizon+(baseY-horizon)*(p*p*.82+.18*p);
        ctx.strokeStyle=`rgba(255,255,255,${.025+.018*p})`;ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(w-16,y);ctx.stroke();
      }
      ctx.restore();
    };

    const drawCoreDeck = cp => {
      const pulse=.5+.5*Math.sin(t*2.1);
      ctx.save();
      ctx.translate(cp.x,cp.y+14);
      ctx.transform(1,.28,-1,.28,0,0);
      for(let i=3;i>=0;i--){
        ctx.strokeStyle=`rgba(225,53,17,${.10+i*.035})`;ctx.lineWidth=1;
        ctx.fillStyle=`rgba(225,53,17,${.018+i*.012+pulse*.006})`;
        ctx.beginPath();ctx.arc(0,i*16,74+i*9,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
      ctx.restore();
    };

    const cardDimensions = n => {
      const isCompact=compact(), core=n.group==='core';
      return {w:core?(isCompact?112:132):(isCompact?72:92),h:core?(isCompact?42:50):(isCompact?32:38),r:core?14:11};
    };

    const drawNode = n => {
      const p=pos(n), d=cardDimensions(n), isActive=n.id===activeId, isHover=n.id===hoveredId;
      const scale=p.scale+((isActive||isHover)?0.035:0);
      const cw=d.w*scale,ch=d.h*scale,x=p.x-cw/2,y=p.y-ch/2;
      const depth=compact()?3:Math.max(3,Math.round(4+n.z*8));
      lastRects[n.id]={x,y,w:cw,h:ch};

      // 3D extrusion layers.
      for(let layer=depth;layer>=1;layer--){
        const off=layer*(compact()?.7:1.05);
        roundedRect(x+off,y+off,cw,ch,d.r);
        ctx.fillStyle=n.group==='core'?`rgba(99,25,10,${.22+layer*.025})`:`rgba(3,10,20,${.18+layer*.022})`;
        ctx.fill();
      }
      // hover/active aura
      if(isActive||isHover){
        const aura=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,Math.max(cw,ch)*.85);
        aura.addColorStop(0,n.group==='output'?'rgba(72,213,151,.16)':'rgba(225,53,17,.20)');aura.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=aura;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(cw,ch)*.85,0,Math.PI*2);ctx.fill();
      }
      // front glass face
      const grad=ctx.createLinearGradient(x,y,x+cw,y+ch);
      if(n.group==='core'){grad.addColorStop(0,'rgba(255,94,55,.98)');grad.addColorStop(.55,'rgba(225,53,17,.96)');grad.addColorStop(1,'rgba(164,34,11,.98)');}
      else{grad.addColorStop(0,'rgba(25,48,79,.98)');grad.addColorStop(.55,'rgba(14,29,49,.96)');grad.addColorStop(1,'rgba(8,19,34,.98)');}
      ctx.shadowColor=n.group==='core'?'rgba(225,53,17,.38)':'rgba(0,0,0,.30)';ctx.shadowBlur=isActive||isHover?28:16;ctx.shadowOffsetY=9;
      roundedRect(x,y,cw,ch,d.r);ctx.fillStyle=grad;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.strokeStyle=isActive?'rgba(255,255,255,.52)':(n.group==='core'?'rgba(255,255,255,.32)':'rgba(255,255,255,.14)');ctx.lineWidth=isActive?1.5:1;ctx.stroke();
      // top highlight
      ctx.save();roundedRect(x+1,y+1,cw-2,ch*.48,d.r-1);ctx.clip();
      const hi=ctx.createLinearGradient(0,y,0,y+ch*.48);hi.addColorStop(0,'rgba(255,255,255,.12)');hi.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=hi;ctx.fillRect(x,y,cw,ch*.55);ctx.restore();

      const dotX=x+(compact()?11:13),dotR=n.group==='core'?(compact()?3.3:4):(compact()?2.8:3.2);
      ctx.fillStyle=n.group==='output'?'#48d597':'#ff6542';
      if(n.group==='core'){ctx.shadowColor='rgba(255,255,255,.7)';ctx.shadowBlur=10;ctx.fillStyle='#fff';}
      ctx.beginPath();ctx.arc(dotX,p.y,dotR+(n.group==='core'?Math.sin(t*3)*.55:0),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#fff';ctx.font=`${n.group==='core'?760:680} ${compact()?(n.group==='core'?9.7:8.2):(n.group==='core'?11.5:9.7)}px Manrope, sans-serif`;ctx.textBaseline='middle';
      const maxLabel=compact()&&n.label==='Orchestrator'?'Orchestrator':n.label;
      ctx.fillText(maxLabel,x+(compact()?20:23),p.y+.5);
    };

    const hitNode = (clientX,clientY) => {
      const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;
      return [...nodes].reverse().find(n=>{const box=lastRects[n.id];return box&&x>=box.x-8&&x<=box.x+box.w+8&&y>=box.y-8&&y<=box.y+box.h+8;})||null;
    };

    canvas.addEventListener('pointermove', e => {
      if(e.pointerType==='mouse'){
        const r=canvas.getBoundingClientRect();mx=(e.clientX-r.left)/Math.max(1,r.width);my=(e.clientY-r.top)/Math.max(1,r.height);
        const hit=hitNode(e.clientX,e.clientY);hoveredId=hit?.id||null;canvas.style.cursor=hit?'pointer':'grab';
      }
    });
    canvas.addEventListener('pointerleave',()=>{mx=.5;my=.5;hoveredId=null;canvas.style.cursor='grab';});
    canvas.addEventListener('pointerdown',e=>{
      const hit=hitNode(e.clientX,e.clientY);if(!hit)return;
      activeId=hit.id;updateInspector(hit);canvas.classList.add('node-selected');setTimeout(()=>canvas.classList.remove('node-selected'),220);
    });
    canvas.addEventListener('keydown',e=>{
      if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(e.key))return;
      e.preventDefault();let idx=Math.max(0,nodes.findIndex(n=>n.id===activeId));
      if(e.key==='Home')idx=0;else if(e.key==='End')idx=nodes.length-1;else idx=(idx+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+nodes.length)%nodes.length;
      activeId=nodes[idx].id;updateInspector(nodes[idx]);
    });

    const draw = () => {
      if (!canvasActive || document.hidden) { canvasRAF = null; return; }
      ctx.clearRect(0,0,w,h);if(!reduceMotion)t+=.010;
      drawIsoGrid();

      const labels=[['INPUTS',.07],['INTELLIGENCE',.30],['ORCHESTRATION',.54],['OUTCOMES',.80]];
      if(!compact()){
        ctx.font='700 9px Manrope, sans-serif';ctx.textBaseline='middle';
        labels.forEach(([label,x])=>{ctx.fillStyle='rgba(255,255,255,.27)';ctx.fillText(label,x*w,42);});
      }

      const cp=pos(byId.core);
      drawCoreDeck(cp);
      const halo=ctx.createRadialGradient(cp.x,cp.y,4,cp.x,cp.y,Math.min(w,h)*.29);
      halo.addColorStop(0,'rgba(225,53,17,.22)');halo.addColorStop(.42,'rgba(225,53,17,.075)');halo.addColorStop(1,'rgba(225,53,17,0)');
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cp.x,cp.y,Math.min(w,h)*.29,0,Math.PI*2);ctx.fill();

      edgePairs.forEach((pair,ei)=>{
        const a=pos(byId[pair[0]]),b=pos(byId[pair[1]]),hot=pair[1]==='core'||pair[0]==='core';
        const cx=(a.x+b.x)/2;
        const lineGrad=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
        lineGrad.addColorStop(0,hot?'rgba(255,87,48,.18)':'rgba(255,255,255,.08)');lineGrad.addColorStop(.5,hot?'rgba(225,53,17,.55)':'rgba(255,255,255,.14)');lineGrad.addColorStop(1,byId[pair[1]].group==='output'?'rgba(72,213,151,.30)':(hot?'rgba(255,87,48,.20)':'rgba(255,255,255,.08)'));
        ctx.strokeStyle=lineGrad;ctx.lineWidth=hot?(compact()?1.25:1.7):1;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(cx,a.y,cx,b.y,b.x,b.y);ctx.stroke();
        if(hot){
          const phase=(t*.18+ei*.119)%1,p=bezierPoint(a,{x:cx,y:a.y},{x:cx,y:b.y},b,phase);
          ctx.shadowColor='rgba(255,101,66,.9)';ctx.shadowBlur=12;ctx.fillStyle='#ff6542';ctx.beginPath();ctx.arc(p.x,p.y,compact()?2.1:2.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
          if(!compact()&&ei%2===0){const p2=bezierPoint(a,{x:cx,y:a.y},{x:cx,y:b.y},b,(phase+.48)%1);ctx.fillStyle='rgba(72,213,151,.85)';ctx.beginPath();ctx.arc(p2.x,p2.y,1.7,0,Math.PI*2);ctx.fill();}
        }
      });

      // Draw shallow nodes first and high-depth nodes last for a convincing 3D stack.
      [...nodes].sort((a,b)=>a.z-b.z).forEach(drawNode);

      ctx.font=`650 ${compact()?8:9}px Manrope, sans-serif`;ctx.fillStyle='rgba(255,255,255,.30)';ctx.fillText('12 SYSTEMS ONLINE',compact()?12:18,h-15);
      ctx.fillStyle='#48d597';ctx.beginPath();ctx.arc(w-(compact()?104:126),h-17,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.46)';ctx.fillText('LIVE DATA FLOW',w-(compact()?96:116),h-15);
      canvasRAF=requestAnimationFrame(draw);
    };
    if ('IntersectionObserver' in window) {
      const canvasObserver = new IntersectionObserver(entries => {
        canvasActive = Boolean(entries[0]?.isIntersecting);
        if (canvasActive && !canvasRAF && !document.hidden) canvasRAF = requestAnimationFrame(draw);
      }, {threshold:.05, rootMargin:'120px'});
      canvasObserver.observe(canvas);
    }
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&canvasActive&&!canvasRAF)canvasRAF=requestAnimationFrame(draw);});
    canvasRAF=requestAnimationFrame(draw);
  }

  const logCells = $$('.hc-log-cell');
  if (logCells.length) {
    const logMessages = [
      'AI layer connected · knowledge ready',
      'Workflow orchestration · active',
      'Application APIs · synchronized',
      'Data pipeline · healthy',
      'Automation event · completed',
      'Business rules · validated'
    ];
    let logCursor = 0;
    const renderLogs = () => {
      logCells.forEach((cell, i) => {
        cell.classList.remove('hc-in');
        setTimeout(() => {
          cell.textContent = logMessages[(logCursor + i) % logMessages.length];
          cell.classList.add('hc-in');
        }, i * 100);
      });
      logCursor = (logCursor + 1) % logMessages.length;
    };
    renderLogs();
    if (!reduceMotion) setInterval(renderLogs, 4300);
  }

  /* ---------- Magnetic CTA buttons ---------- */
  if (!reduceMotion && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.12;
        const y = (e.clientY - r.top - r.height / 2) * 0.15;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- System SVG card parallax ---------- */
  const plotCard = $('#system-plot-card');
  if (plotCard && !reduceMotion && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    plotCard.addEventListener('pointermove', e => {
      const r = plotCard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      plotCard.style.transform = `perspective(1000px) rotateX(${(-py * 2.6).toFixed(2)}deg) rotateY(${(px * 3.2).toFixed(2)}deg) translateY(-3px)`;
    });
    plotCard.addEventListener('pointerleave', () => plotCard.style.transform = '');
  }

  /* ---------- Testimonial carousel ---------- */
  $$('.testimonial-slider').forEach(slider => {
    const slides = $$('.testimonial-slide', slider);
    const dotsWrap = $('.slider-dots', slider);
    const prev = $('.slider-prev', slider), next = $('.slider-next', slider);
    if (!slides.length || !dotsWrap) return;
    let idx = 0, timer;
    slides.forEach((_, i) => {
      const d = document.createElement('button'); d.className = `slider-dot${i === 0 ? ' active' : ''}`;
      d.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      d.onclick = () => show(i, true); dotsWrap.appendChild(d);
    });
    const dots = $$('.slider-dot', dotsWrap);
    const show = (i, reset = false) => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('fan-active', n === idx));
      dots.forEach((d, n) => d.classList.toggle('active', n === idx));
      if (reset) start();
    };
    const start = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => show(idx + 1), 6500); };
    prev?.addEventListener('click', () => show(idx - 1, true));
    next?.addEventListener('click', () => show(idx + 1, true));
    show(0); start();
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', start);
  });

  /* ---------- Industry continuous marquee ---------- */
  const marqueeWrap = $('#industry-marquee-1');
  const marqueeTrack = $('#industry-marquee-track');
  if (marqueeWrap && marqueeTrack) {
    const originals = $$('.im-card:not([aria-hidden="true"])', marqueeTrack);
    const dotsWrap = $('#im-dots');
    const prev = $('.im-prev'), next = $('.im-next');
    let x = 0, dragging = false, lastX = 0, velocity = 0, paused = false;
    const cardStep = () => (originals[0]?.getBoundingClientRect().width || 260) + 22;
    if (dotsWrap) originals.forEach((_, i) => {
      const d = document.createElement('button'); d.className = `im-dot${i === 0 ? ' active' : ''}`;
      d.setAttribute('aria-label', `Go to industry ${i + 1}`);
      d.onclick = () => { x = -(i * cardStep()); update(true); }; dotsWrap.appendChild(d);
    });
    const dots = dotsWrap ? $$('.im-dot', dotsWrap) : [];
    const wrapX = () => {
      const loopWidth = originals.length * cardStep();
      if (x <= -loopWidth) x += loopWidth;
      if (x > 0) x -= loopWidth;
    };
    const update = (smooth = false) => {
      wrapX();
      marqueeTrack.style.transition = smooth ? 'transform .65s cubic-bezier(.16,1,.3,1)' : 'none';
      marqueeTrack.style.transform = `translate3d(${x}px,0,0)`;
      const current = Math.round(Math.abs(x) / cardStep()) % originals.length;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      if (smooth) setTimeout(() => marqueeTrack.style.transition = 'none', 700);
    };
    const tick = () => {
      if (!dragging && !paused && !reduceMotion) x -= .38;
      if (!dragging && Math.abs(velocity) > .05) { x += velocity; velocity *= .94; }
      update(); requestAnimationFrame(tick);
    };
    marqueeWrap.addEventListener('mouseenter', () => paused = true);
    marqueeWrap.addEventListener('mouseleave', () => { paused = false; dragging = false; marqueeWrap.classList.remove('grabbing'); });
    marqueeWrap.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; velocity = 0; marqueeWrap.classList.add('grabbing'); marqueeWrap.setPointerCapture?.(e.pointerId); });
    marqueeWrap.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; x += dx; velocity = dx; update(); });
    marqueeWrap.addEventListener('pointerup', () => { dragging = false; marqueeWrap.classList.remove('grabbing'); });
    prev?.addEventListener('click', () => { x += cardStep(); update(true); });
    next?.addEventListener('click', () => { x -= cardStep(); update(true); });
    tick();
  }

  /* ---------- Industry tabs + animated numbers ---------- */
  const indMorph = $('#ind-morph');
  if (indMorph) {
    const tabs = $$('.ind-tab', indMorph), scenes = $$('.ind-scene-panel', indMorph);
    const animateNums = scene => {
      $$('[data-count]', scene).forEach(el => {
        const end = Number(el.dataset.count || 0), suffix = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = `${end}${suffix}`; return; }
        let start = performance.now();
        const step = now => {
          const p = Math.min(1, (now - start) / 850);
          const val = Math.round(end * (1 - Math.pow(1 - p, 3)));
          el.textContent = `${val}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };
    const activate = target => {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.target === target));
      scenes.forEach(s => s.classList.toggle('active', s.dataset.panel === target));
      const scene = scenes.find(s => s.dataset.panel === target); if (scene) animateNums(scene);
    };
    tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.target)));
    const active = scenes.find(s => s.classList.contains('active')); if (active) animateNums(active);
  }

  /* ---------- Contact form handled by v6 production layer ---------- */

  /* ---------- Local website knowledge assistant ---------- */
  const assistant = $('#site-assistant');
  if (assistant) {
    const launcher = $('#assistant-launcher'), panel = $('#assistant-panel'), close = $('#assistant-close');
    const form = $('#assistant-form'), input = $('#assistant-input'), body = $('#assistant-body');
    const suggestions = $('#assistant-suggestions');

    const knowledge = [
      {
        keys: ['ai maturity','maturity assessment','ai readiness','automation maturity','how ready are we'],
        html: `Use the <a href="${siteHref('pages/ai-maturity.html')}"><strong>AI Maturity Assessment</strong></a> to score process, data, AI adoption, governance, measurement and change readiness across seven dimensions. It can also generate a downloadable executive summary.`
      },
      {
        keys: ['build ai system','system configurator','architecture configurator','design my ai system','architecture tool'],
        html: `The <a href="${siteHref('pages/build-your-system.html')}"><strong>Build Your AI System</strong></a> configurator turns your industry, business challenge, current environment and scale into a directional starting architecture.`
      },
      {
        keys: ['security','responsible ai','governance','audit','permissions','access control'],
        html: `Our <a href="${siteHref('pages/security.html')}"><strong>Security & Responsible AI</strong></a> approach covers least-privilege access, human checkpoints, auditability, data boundaries, provider awareness and operational resilience. Specific compliance claims depend on the actual project environment.`
      },
      {
        keys: ['architecture','technical architecture','enterprise architecture','system design'],
        html: `See the <a href="${siteHref('pages/architecture.html')}"><strong>Enterprise Architecture</strong></a> guide for how we separate experience, orchestration, intelligence, business systems, data and controls.`
      },
      {
        keys: ['resources','insights','articles','guides','learn'],
        html: `The <a href="${siteHref('pages/insights.html')}"><strong>Resources</strong></a> center includes the AI system configurator, maturity assessment, architecture guidance, security principles and practical articles.`
      },
      {
        keys: ['roi','return on investment','savings','hours saved','business case','estimate automation roi'],
        html: `For a directional automation estimate, share the process, people involved, weekly manual hours, and realistic automation potential. It is a planning model rather than a guaranteed saving. For a validated opportunity assessment, <a href="https://calendly.com/ingenuitysystems" target="_blank" rel="noopener">book a strategy call →</a>`
      },
      {
        keys: ['case study','case studies','client story','proof','results','examples'],
        html: `Our Selected Work section focuses on inspectable internal and public engineering evidence, including the Ingenuity AI platform, AURA Forge / Cross-Chain Hub, and the Applied AI Lab. Public GitHub projects are not presented as client engagements. <a href="${siteHref('case-studies/index.html')}">View selected work →</a>`
      },
      {
        keys: ['book','strategy call','discovery call','schedule','calendly','appointment'],
        html: `You can <a href="https://calendly.com/ingenuitysystems" target="_blank" rel="noopener"><strong>book a strategy call here</strong></a>. If you prefer, you can also send project details through the <a href="${siteHref('pages/contact.html')}">contact form →</a>`
      },
      {
        keys: ['recommend the right solution','recommend solution','solution finder','what should i build','what do i need'],
        html: `A useful starting rule is: <strong>manual repetitive work → Automation</strong>; <strong>knowledge-heavy questions or decisions → AI</strong>; <strong>new digital workflow/product → Custom Software</strong>; <strong>fragmented systems/data → Integration &amp; Data</strong>. For a tailored recommendation, use the <a href="${siteHref('index.html#project-estimator')}">Solution Finder →</a>`
      },
      {
        keys: ['services','offer','capabilities','what do you do','help with'],
        html: `Our work is organized into four core capability areas: <strong>AI &amp; Intelligent Systems</strong>, <strong>Business Process Automation</strong>, <strong>Software &amp; Digital Engineering</strong>, and <strong>Systems Integration &amp; Data</strong>. We combine them when a project needs more than one discipline. <a href="${siteHref('services/index.html')}">Explore services →</a>`
      },
      {
        keys: ['ai','agent','agentic','copilot','rag','knowledge','document intelligence','voice ai','virtual agent','chatbot'],
        html: `Yes. Our AI work includes <strong>agentic AI systems, AI copilots, knowledge/RAG systems, document intelligence, AI assistants &amp; virtual agents, Voice AI, custom AI solutions, and AI integration</strong>. The focus is practical AI connected to real workflows and business systems. <a href="${siteHref('services/ai.html')}">AI capabilities →</a>`
      },
      {
        keys: ['automation','automate','workflow','manual','repetitive','finance automation','sales automation','customer service'],
        html: `We automate end-to-end business processes, not just isolated tasks. Capabilities include <strong>workflow automation, finance &amp; accounting, CRM &amp; sales, customer service, HR/people operations, document/data automation, operations automation, and AI-powered automation</strong>. <a href="${siteHref('services/automation.html')}">Automation capabilities →</a>`
      },
      {
        keys: ['software','app','application','portal','backend','api development','mvp','prototype','modernization','product development','custom software'],
        html: `We build <strong>custom software, web &amp; business applications, internal tools and portals, APIs/backends, digital products, MVPs/prototypes</strong>, and we modernize or enhance existing applications. <a href="${siteHref('services/software.html')}">Software engineering →</a>`
      },
      {
        keys: ['integration','integrate','erp','crm','data pipeline','database','business intelligence','reporting','connect systems','api integration'],
        html: `Our integration and data work connects the systems your business already depends on. That includes <strong>systems &amp; API integration, CRM/ERP integration, data pipelines, BI/reporting, application and database integration, data automation, and AI/data integration</strong>. <a href="${siteHref('services/integration.html')}">Integration &amp; data →</a>`
      },
      {
        keys: ['process','how do you work','how it works','delivery','steps','approach','timeline','discover','define','deploy','evolve'],
        html: `Our delivery process has five stages: <strong>1. Discover</strong> the business challenge and environment; <strong>2. Define</strong> requirements, priorities and scope; <strong>3. Design &amp; Build</strong> the solution; <strong>4. Deploy</strong> it into the working environment; and <strong>5. Evolve</strong> it through monitoring, improvement and expansion.`
      },
      {
        keys: ['industry','industries','sector','ecommerce','retail','professional services','real estate','property','financial','healthcare','manufacturing','supply chain','saas','technology'],
        html: `We work across <strong>Ecommerce &amp; Retail, Professional &amp; Business Services, Real Estate &amp; Property, Financial Services, Healthcare, Manufacturing &amp; Supply Chain, and Technology &amp; SaaS</strong>. Each solution is shaped around how that sector actually operates. <a href="${siteHref('industries/index.html')}">Explore industries →</a>`
      },
      {
        keys: ['ecommerce','retail','commerce'],
        html: `For Ecommerce &amp; Retail we can support customer/sales automation, commerce and order automation, CRM/customer-data integration, AI shopping assistants, inventory operations, back-office automation, analytics, and custom commerce applications. <a href="${siteHref('industries/ecommerce.html')}">Ecommerce solutions →</a>`
      },
      {
        keys: ['healthcare','medical','patient'],
        html: `For Healthcare we focus on administrative workflow automation, patient communication, healthcare systems integration, document/information intelligence, scheduling and operations, data/BI, AI knowledge assistants, and custom healthcare applications. <a href="${siteHref('industries/healthcare.html')}">Healthcare solutions →</a>`
      },
      {
        keys: ['real estate','property','tenant','listing'],
        html: `For Real Estate &amp; Property we can build lead/sales automation, CRM and property-management integrations, property/listing platforms, customer or tenant automation, document workflows, property reporting, AI property assistants, and custom applications. <a href="${siteHref('industries/realestate.html')}">Real estate solutions →</a>`
      },
      {
        keys: ['financial','finance','accounting','compliance'],
        html: `For Financial Services we support finance/accounting automation, document and data intelligence, customer-service automation, CRM/workflow integration, compliance workflows, reporting/BI, AI assistants, and custom financial applications. <a href="${siteHref('industries/financial.html')}">Financial services solutions →</a>`
      },
      {
        keys: ['manufacturing','factory','warehouse','supply chain','production'],
        html: `For Manufacturing &amp; Supply Chain we work on production workflows, procurement and supply-chain automation, inventory/warehouse operations, ERP integrations, production data, back-office automation, AI for operations, and custom manufacturing applications. <a href="${siteHref('industries/manufacturing.html')}">Manufacturing solutions →</a>`
      },
      {
        keys: ['saas','technology company','tech company','platform'],
        html: `For Technology &amp; SaaS teams we support SaaS product development, AI product features, API/platform integration, operational automation, data/analytics, customer support automation, internal tools, and product modernization. <a href="${siteHref('industries/technology.html')}">Technology &amp; SaaS solutions →</a>`
      },
      {
        keys: ['professional services','consulting','business services'],
        html: `For Professional &amp; Business Services we can improve client/CRM workflows, business processes, knowledge and document intelligence, project operations, system integrations, AI copilots, analytics, and custom business applications. <a href="${siteHref('industries/professional.html')}">Professional services solutions →</a>`
      },
      {
        keys: ['projects','recent projects','github','portfolio','engineering work','cross chain','aura forge','sam2','forecasting'],
        html: `Explore <a href="${siteHref('projects/index.html')}"><strong>Recent Engineering Projects</strong></a> for selected public work across AI agents, machine learning, computer vision, reinforcement learning, data science, simulation, and Web3. The portfolio links directly to the underlying GitHub repositories.`
      },
      {
        keys: ['price','pricing','cost','budget','how much','quote'],
        html: `The website does not publish fixed project pricing because scope can vary significantly by system, integrations, complexity, and delivery model. The best next step is a short discovery conversation so the team can define the outcome and recommend the right scope. <a href="${siteHref('pages/contact.html')}">Start a conversation →</a>`
      },
      {
        keys: ['timeline','how long','duration','weeks','months'],
        html: `Project duration depends on scope and integration complexity. Ingenuity starts by defining requirements and a practical solution direction, then plans design/build, deployment, and ongoing evolution around the project. For a specific estimate, <a href="${siteHref('pages/contact.html')}">share your project with the team →</a>`
      },
      {
        keys: ['where to start','not sure','recommend','which service','need help','idea'],
        html: `You do not need to choose a service before contacting us. Start with the <strong>business problem, bottleneck, or outcome</strong> you want to improve. Ingenuity can then determine whether the right solution is software, automation, AI, integration—or a combination. <a href="${siteHref('pages/contact.html')}">Tell us the challenge →</a>`
      },
      {
        keys: ['contact','email','talk','meeting','conversation','reach'],
        html: `You can use the <a href="${siteHref('pages/contact.html')}">Start a Conversation</a> page to describe your challenge and project. The site also lists <strong>info@ingenuitysys.com</strong> as the contact email.`
      },
      {
        keys: ['company','about','who are you','ingenuity'],
        html: `Ingenuity Systems is a technology company focused on building practical, connected digital capabilities around how businesses actually operate. The company combines software engineering, AI, automation, integration and data work. <a href="${siteHref('pages/about.html')}">About Ingenuity →</a>`
      }
    ];

    const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim();
    const answer = question => {
      const q = normalize(question);
      let best = null, score = 0;
      knowledge.forEach(item => {
        let s = 0;
        item.keys.forEach(k => {
          const nk = normalize(k);
          if (q.includes(nk)) s += nk.split(' ').length * 4 + nk.length / 10;
          else nk.split(' ').forEach(word => { if (word.length > 3 && q.includes(word)) s += 1; });
        });
        if (s > score) { score = s; best = item; }
      });
      if (best && score >= 2) return best.html;
      return `I can help with questions about <strong>AI, automation, software engineering, integrations &amp; data, industries, pricing approach, and our five-stage delivery process</strong>. If your question is specific to your business, describe the challenge and I’ll point you to the most relevant capability—or you can <a href="${siteHref('pages/contact.html')}">talk to the team →</a>`;
    };

    const scrollBottom = () => { body.scrollTop = body.scrollHeight; };
    const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const formatLLMText = value => {
      let safe = escapeHTML(value || '');
      safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      safe = safe.replace(/https?:\/\/[^\s<]+/g, url => {
        const clean = url.replace(/[.,;:!?]+$/, '');
        const trail = url.slice(clean.length);
        const label = clean === 'https://calendly.com/ingenuitysystems' ? 'Book a strategy call' : clean;
        return `<a href="${clean}" target="_blank" rel="noopener">${label}</a>${trail}`;
      });
      return safe.replace(/\n/g, '<br>');
    };
    const addMessage = (content, who = 'bot', opts = {}) => {
      const row = document.createElement('div'); row.className = `assistant-message ${who}`;
      if (who === 'bot') row.innerHTML = `<div class="assistant-avatar">IS</div><div class="assistant-bubble">${content}</div>`;
      else { const bubble = document.createElement('div'); bubble.className = 'assistant-bubble'; bubble.textContent = content; row.appendChild(bubble); }
      body.appendChild(row);
      if (opts.sources?.length) {
        const src = document.createElement('div'); src.className='assistant-source-row';
        src.innerHTML = opts.sources.slice(0,3).map(x=>{ const label=typeof x==='string'?x:(x?.label||'Website source'); const url=typeof x==='object'&&x?.url?siteHref(String(x.url).replace(/^\//,'')):''; return `<span>${url?`<a href="${escapeHTML(url)}">${escapeHTML(label)}</a>`:escapeHTML(label)}</span>`; }).join('');
        body.appendChild(src);
      }
      if (opts.book) {
        const actions=document.createElement('div'); actions.className='assistant-action-row';
        actions.innerHTML=`<a class="primary" href="https://calendly.com/ingenuitysystems" target="_blank" rel="noopener">Book strategy call ↗</a><a href="${siteHref('pages/contact.html')}">Send project details →</a>`;
        body.appendChild(actions);
      }
      scrollBottom(); return row;
    };
    const history = [];
    const aiStatus = assistant.querySelector('.assistant-identity small');
    let ragOnline = false;
    const setAIStatus = (online) => {
      ragOnline = online;
      if (!aiStatus) return;
      aiStatus.dataset.aiStatus = online ? 'online' : 'fallback';
      aiStatus.innerHTML = `<i></i>${online ? ' RAG solution advisor · online' : ' Website advisor · local mode'}`;
    };
    fetch('/api/health', {headers:{'Accept':'application/json'}})
      .then(r=>r.ok?r.json():Promise.reject()).then(d=>setAIStatus(Boolean(d?.ragReady))).catch(()=>setAIStatus(false));

    const ask = async question => {
      const q = question.trim(); if (!q) return;
      addMessage(q, 'user');
      const priorHistory = history.slice(-10);
      history.push({role:'user',content:q});
      suggestions?.remove();
      const typing = document.createElement('div'); typing.className = 'assistant-message bot assistant-typing';
      typing.innerHTML = '<div class="assistant-avatar">IS</div><div class="assistant-bubble"><i></i><i></i><i></i></div>';
      body.appendChild(typing); scrollBottom();
      try {
        const res = await fetch('/api/chat', {
          method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({message:q, history:priorHistory})
        });
        if (!res.ok) throw new Error('RAG backend unavailable');
        const data = await res.json();
        typing.remove();
        const text = data.message || 'I could not generate a response. Please try again.';
        addMessage(formatLLMText(text), 'bot', {sources:data.sources||[], book:Boolean(data.book)});
        history.push({role:'assistant',content:text});
        setAIStatus(true);
      } catch (err) {
        typing.remove();
        addMessage(answer(q), 'bot', {book:/book|schedule|appointment|call|meeting/i.test(q)});
        setAIStatus(false);
      }
    };
    const setOpen = open => {
      assistant.classList.toggle('open', open);
      launcher?.setAttribute('aria-expanded', String(open));
      panel?.setAttribute('aria-hidden', String(!open));
      if (open) setTimeout(() => input?.focus(), 250);
    };
    launcher?.addEventListener('click', () => setOpen(true));
    assistant.querySelectorAll('[data-launch-question]').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(true);
      const q = btn.dataset.launchQuestion || '';
      if (q) setTimeout(() => ask(q), reduceMotion ? 0 : 180);
    }));
    close?.addEventListener('click', () => setOpen(false));
    form?.addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; });
    suggestions?.addEventListener('click', e => { const b = e.target.closest('[data-question]'); if (b) ask(b.dataset.question); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && assistant.classList.contains('open')) setOpen(false); });
  }
  $$('.decision-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const card = toggle.closest('.decision-card');
      const expanded = card.classList.toggle('is-expanded');
      toggle.setAttribute('aria-expanded', String(expanded));
      const detail = card.querySelector('.decision-detail');
      detail?.setAttribute('aria-hidden', String(!expanded));
      const sign = toggle.querySelector('[aria-hidden="true"]');
      if (sign) sign.textContent = expanded ? '−' : '+';
    });
  });
  const projectHeads = $$('.hero-rotating-headline .hero-headline');
  if (projectHeads.length > 1 && !reduceMotion) {
    let headIndex = 0;
    setInterval(() => {
      projectHeads[headIndex].classList.remove('active');
      headIndex = (headIndex + 1) % projectHeads.length;
      projectHeads[headIndex].classList.add('active');
    }, 3600);
  }
})();

// Curated editorial photography uses local branded SVGs as a resilient fallback.
document.querySelectorAll('img[data-fallback]').forEach((img) => {
  img.addEventListener('error', () => {
    const fallback = img.dataset.fallback;
    if (!fallback || img.src.endsWith(fallback)) return;
    img.removeAttribute('srcset');
    img.src = fallback;
  }, { once: true });
});
