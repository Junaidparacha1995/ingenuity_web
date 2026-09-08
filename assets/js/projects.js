(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const output = $('#terminal-output');
  const form = $('#terminal-form');
  const input = $('#terminal-input');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projectMap = {
    'cross-chain-hub':'https://github.com/Harmain11/Cross-Chain-Hub',
    'retail-sales-forecasting':'https://github.com/Harmain11/retail-sales-forecasting-ml',
    'sam2-segmentation':'https://github.com/Harmain11/video-wall-segmentation-sam2',
    'deit-skin-cancer':'https://github.com/Harmain11/deit-skin-cancer-classification',
    'fairface-bias':'https://github.com/Harmain11/fairface-gender-bias-analysis',
    'blackjack-rl':'https://github.com/Harmain11/blackjack-mdp-reinforcement-learning',
    'x15-flight':'https://github.com/Harmain11/ecm06aee-flight-dynamics-simulation',
    'airbnb-semma':'https://github.com/Harmain11/airbnb-semma-price-regression',
    'kgqa-preprocessing':'https://github.com/Harmain11/knowledge-graph-question-answering-preprocessing'
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const addLine = (text, cls='') => {
    if (!output) return;
    const line = document.createElement('span');
    line.className = `terminal-line ${cls}`.trim();
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
    return line;
  };
  const typeLine = async (text, cls='', delay=11) => {
    if (!output) return;
    const line = addLine('', cls);
    if (reduceMotion) { line.textContent=text; return; }
    for (const ch of text) { line.textContent += ch; await sleep(delay); }
  };

  const boot = [
    ['ingenuity portfolio --source github.com/Harmain11','prompt'],
    ['indexing selected public engineering work…','muted'],
    ['9 curated projects available','success'],
    ['click any project to open its engineering trace','accent'],
    ['type “help” for terminal commands','muted']
  ];
  if (output) (async()=>{ for (const [t,c] of boot) { await typeLine(t,c); await sleep(reduceMotion?0:90); } })();

  let activeDrawer = null;
  const stopTrace = term => {
    if (!term) return;
    const token = Number(term.dataset.runToken || 0) + 1;
    term.dataset.runToken = String(token);
  };

  const runMiniTrace = async card => {
    const term = $('[data-project-terminal]', card);
    const screen = $('.project-detail-terminal-screen', term);
    if (!term || !screen) return;
    const token = Number(term.dataset.runToken || 0) + 1;
    term.dataset.runToken = String(token);
    screen.innerHTML = '';
    let lines=[];
    try { lines = JSON.parse(term.dataset.lines || '[]'); } catch {}
    const makeLine = (txt, cls='') => {
      const line=document.createElement('div');
      line.className=`trace-line ${cls}`.trim();
      screen.appendChild(line);
      return line;
    };
    for (let i=0;i<lines.length;i++) {
      if (Number(term.dataset.runToken)!==token) return;
      const text=lines[i];
      const cls=i===0?'command':i===lines.length-1?'status':'';
      const line=makeLine('',cls);
      const prefix=i===0?'$ ':i===lines.length-1?'✓ ':'› ';
      line.textContent=prefix;
      if (reduceMotion) line.textContent += text;
      else {
        for (const ch of text) {
          if (Number(term.dataset.runToken)!==token) return;
          line.textContent += ch;
          await sleep(i===0?15:7);
        }
      }
      screen.scrollTop=screen.scrollHeight;
      await sleep(reduceMotion?0:95);
    }
    if (Number(term.dataset.runToken)===token) {
      const caret=makeLine('','cursor-line');
      caret.innerHTML='<span class="trace-prompt">$</span> <span class="trace-caret"></span>';
    }
  };

  const closeProject = card => {
    if (!card) return;
    const panel=$('.project-detail-panel',card);
    const btn=$('.project-expand-btn',card);
    card.classList.remove('is-open');
    btn?.setAttribute('aria-expanded','false');
    panel?.setAttribute('aria-hidden','true');
    if (panel) panel.style.maxHeight='0px';
    stopTrace($('[data-project-terminal]',card));
    if (activeDrawer===card) activeDrawer=null;
  };

  const openProject = (card, {scroll=true}={}) => {
    if (!card) return;
    if (activeDrawer && activeDrawer!==card) closeProject(activeDrawer);
    const panel=$('.project-detail-panel',card);
    const btn=$('.project-expand-btn',card);
    card.classList.add('is-open');
    btn?.setAttribute('aria-expanded','true');
    panel?.setAttribute('aria-hidden','false');
    // Set after the class applies so scrollHeight includes the two-column drawer layout.
    requestAnimationFrame(()=>{
      if (panel) panel.style.maxHeight=`${panel.scrollHeight}px`;
    });
    activeDrawer=card;
    runMiniTrace(card);
    if (scroll) setTimeout(()=>card.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'}),170);
  };

  const toggleProject = card => card?.classList.contains('is-open') ? closeProject(card) : openProject(card);

  $$('.project-card').forEach(card=>{
    const btn=$('.project-expand-btn',card);
    btn?.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); toggleProject(card); });
    card.addEventListener('click',e=>{
      if (e.target.closest('a,button,.project-detail-panel')) return;
      toggleProject(card);
    });
  });

  const applyFilter = (filter='all') => {
    $$('.project-filter').forEach(b=>b.classList.toggle('active', b.dataset.filter===filter));
    $$('.project-card').forEach(card=>{
      const show = filter==='all' || (card.dataset.projectCategory||'').split(' ').includes(filter);
      if (!show && card.classList.contains('is-open')) closeProject(card);
      card.classList.toggle('is-hidden', !show);
    });
  };
  $$('.project-filter').forEach(btn=>btn.addEventListener('click',()=>applyFilter(btn.dataset.filter)));

  const findCard = slug => $(`.project-card[data-project-slug="${CSS.escape(slug)}"]`);
  const run = cmdRaw => {
    const cmd = cmdRaw.trim(); if (!cmd) return;
    addLine(cmd,'prompt');
    const [verb,...args] = cmd.toLowerCase().split(/\s+/);
    if (verb==='help') {
      addLine('commands: list | filter <ai|ml|vision|rl|web3|all> | open <slug> | repo <slug> | github | clear','muted');
    } else if (verb==='list') {
      Object.keys(projectMap).forEach((slug,i)=>addLine(`${String(i+1).padStart(2,'0')}  ${slug}`));
    } else if (verb==='filter') {
      const f=args[0]||'all';
      const allowed=['ai','ml','vision','rl','web3','all'];
      if (allowed.includes(f)) {
        applyFilter(f); addLine(`project filter → ${f}`,'success');
        $('#project-grid')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});
      } else addLine(`unknown filter: ${f}`,'accent');
    } else if (verb==='open') {
      const slug=args.join('-'); const card=findCard(slug);
      if (card) {
        applyFilter('all'); openProject(card); addLine(`expanded ${slug} → engineering trace loaded`,'success');
      } else addLine('project not found. run “list” for available slugs.','accent');
    } else if (verb==='repo') {
      const slug=args.join('-');
      if (projectMap[slug]) { addLine(`opening repository ${slug}…`,'success'); window.open(projectMap[slug],'_blank','noopener'); }
      else addLine('project not found. run “list” for available slugs.','accent');
    } else if (verb==='github') {
      addLine('opening github.com/Harmain11…','success'); window.open('https://github.com/Harmain11','_blank','noopener');
    } else if (verb==='clear') {
      if(output) output.innerHTML='';
    } else if (verb==='about') {
      addLine('Selected public engineering work presented as portfolio projects, not client engagements.','muted');
    } else {
      addLine(`command not found: ${verb}. type “help”.`,'accent');
    }
  };
  form?.addEventListener('submit', e=>{e.preventDefault();run(input.value);input.value='';});
  $$('.terminal-hints span').forEach(h=>h.addEventListener('click',()=>{if(input){input.value=h.textContent;input.focus();}}));

  // Deep links from the homepage open the matching project dossier automatically.
  if (location.hash.startsWith('#project-')) {
    const slug = location.hash.replace('#project-','');
    const card = findCard(slug);
    if (card) setTimeout(() => openProject(card, {scroll:true}), reduceMotion ? 0 : 420);
  }

  addEventListener('resize',()=>{
    if (!activeDrawer) return;
    const panel=$('.project-detail-panel',activeDrawer);
    if (panel) panel.style.maxHeight=`${panel.scrollHeight}px`;
  });
})();
