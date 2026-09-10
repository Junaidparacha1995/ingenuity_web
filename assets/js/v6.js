(() => {
  'use strict';
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const root=document.documentElement.dataset.siteRoot||'';
  const calendly='https://calendly.com/ingenuitysystems';

  /* First-party analytics: no third-party trackers; opt-in stored locally. */
  const consentKey='ingenuity_analytics_consent_v1';
  const canTrack=()=>localStorage.getItem(consentKey)==='yes';
  const track=(event,properties={})=>{
    if(!canTrack()) return;
    const payload={event:String(event).slice(0,80),path:location.pathname,ts:new Date().toISOString(),properties};
    try{
      const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
      if(navigator.sendBeacon) navigator.sendBeacon('/api/events',blob);
      else fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
    }catch{}
  };
  window.IngenuityAnalytics={track};

  if(localStorage.getItem(consentKey)===null){
    const box=document.createElement('aside'); box.className='analytics-consent show'; box.setAttribute('aria-label','Analytics preferences');
    box.innerHTML='<p>We use optional first-party interaction analytics to understand which tools and content are useful. No advertising trackers are included.</p><div class="analytics-consent-actions"><button class="accept" type="button">Allow analytics</button><button class="decline" type="button">No thanks</button></div>';
    document.body.appendChild(box);
    box.querySelector('.accept')?.addEventListener('click',()=>{localStorage.setItem(consentKey,'yes');box.remove();track('analytics_consent',{value:'yes'});});
    box.querySelector('.decline')?.addEventListener('click',()=>{localStorage.setItem(consentKey,'no');box.remove();});
  }

  /* Embedded booking workspace. */
  let bookingModal;
  const openBooking=()=>{
    if(!bookingModal){
      bookingModal=document.createElement('div');bookingModal.className='booking-modal';bookingModal.setAttribute('role','dialog');bookingModal.setAttribute('aria-modal','true');bookingModal.setAttribute('aria-label','Book a strategy call');
      bookingModal.innerHTML=`<div class="booking-dialog"><button class="booking-close" aria-label="Close booking" type="button">×</button><iframe title="Book a strategy call with Ingenuity Systems" loading="lazy" src="${calendly}?hide_gdpr_banner=1&background_color=ffffff&text_color=14233b&primary_color=e13511"></iframe></div>`;
      document.body.appendChild(bookingModal);
      bookingModal.querySelector('.booking-close').addEventListener('click',closeBooking);
      bookingModal.addEventListener('mousedown',e=>{if(e.target===bookingModal)closeBooking();});
    }
    bookingModal.classList.add('open');document.body.style.overflow='hidden';bookingModal.querySelector('.booking-close')?.focus();track('booking_started');
  };
  const closeBooking=()=>{if(!bookingModal)return;bookingModal.classList.remove('open');document.body.style.overflow='';};
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]'); if(!a)return;
    if(a.href.startsWith(calendly) || a.hasAttribute('data-book-strategy')){e.preventDefault();openBooking();}
  });


  /* Interactive hero architecture: click/tap/keyboard updates the inspector. */
  const heroArchitecture=$('#hc-graph-svg');
  if(heroArchitecture){
    const inspector=$('#hc-node-inspector');
    const inspectorKicker=$('#hc-node-kicker');
    const inspectorTitle=$('#hc-node-title');
    const inspectorCopy=$('#hc-node-copy');
    const heroNodes=$$('.svg-node',heroArchitecture);

    const selectHeroNode=node=>{
      if(!node)return;
      heroNodes.forEach(n=>{
        const selected=n===node;
        n.classList.toggle('active',selected);
        n.setAttribute('aria-pressed',String(selected));
      });
      if(inspector){
        inspector.dataset.group=node.dataset.group||'intel';
        inspector.classList.remove('is-updating');
        void inspector.offsetWidth;
        inspector.classList.add('is-updating');
      }
      if(inspectorKicker)inspectorKicker.textContent=node.dataset.kicker||'Interactive architecture';
      if(inspectorTitle)inspectorTitle.textContent=node.dataset.title||'System node';
      if(inspectorCopy)inspectorCopy.textContent=node.dataset.copy||'';
      track('architecture_node_selected',{node:node.dataset.title||''});
    };

    heroNodes.forEach((node,index)=>{
      node.setAttribute('role','button');
      node.setAttribute('tabindex','0');
      node.setAttribute('aria-pressed',String(node.classList.contains('active')));
      node.setAttribute('aria-label',`${node.dataset.title||'System node'}: ${node.dataset.kicker||'View details'}`);
      node.addEventListener('click',()=>selectHeroNode(node));
      node.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();selectHeroNode(node);return;}
        if(e.key==='ArrowRight'||e.key==='ArrowDown'){
          e.preventDefault();const next=heroNodes[(index+1)%heroNodes.length];next.focus();selectHeroNode(next);
        }
        if(e.key==='ArrowLeft'||e.key==='ArrowUp'){
          e.preventDefault();const prev=heroNodes[(index-1+heroNodes.length)%heroNodes.length];prev.focus();selectHeroNode(prev);
        }
      });
    });
    selectHeroNode(heroArchitecture.querySelector('.svg-node.active')||heroNodes[0]);
  }

  /* Production contact form. Success is only shown after the API accepts the lead. */
  const contact=$('#contact-form');
  if(contact){
    const status=$('#contact-status'),btn=$('#submit-btn',contact),label=btn?.querySelector('.label'),original=label?.textContent||'Send Inquiry →';
    contact.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!contact.checkValidity()){contact.reportValidity();return;}
      if(status){status.className='contact-status';status.textContent='Sending your inquiry…';}
      if(btn){btn.disabled=true;btn.setAttribute('aria-busy','true');}
      if(label)label.textContent='Sending…';
      const values=Object.fromEntries(new FormData(contact).entries());
      try{
        const res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(values)});
        const data=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(data.message||'Unable to send your inquiry.');
        contact.reset();
        if(status){status.className='contact-status success';status.textContent='Thanks. Your inquiry was received. We’ll follow up using the email you provided.';}
        btn?.classList.add('success');track('contact_submit',{subject:values.subject||'general',projectStage:values.projectStage||''});
      }catch(err){
        const localHint=location.port && location.port!=='3000' ? ' Start the production server with npm start rather than Live Server to submit the form.' : '';
        if(status){status.className='contact-status error';status.textContent=(err?.message||'The inquiry could not be sent.')+localHint;}
      }finally{
        if(btn){btn.disabled=false;btn.removeAttribute('aria-busy');}
        if(label)label.textContent=original;
        setTimeout(()=>btn?.classList.remove('success'),3200);
      }
    });
  }

  /* Accessible mega-menu state mirrors the visual state. */
  $$('.has-dropdown[data-menu]').forEach(item=>{
    const link=item.querySelector('.top-link'),key=item.dataset.menu,panel=$(`.mega-dropdown[data-panel="${key}"]`);
    if(!link||!panel)return;
    const sync=open=>{link.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));};
    item.addEventListener('mouseenter',()=>sync(true));item.addEventListener('focusin',()=>sync(true));
    item.addEventListener('focusout',()=>setTimeout(()=>{if(!item.matches(':focus-within')&&!panel.matches(':focus-within'))sync(false)},0));
  });


  /* Refresh cached public GitHub count when project metadata is available. */
  fetch(`${root}data/projects.json`,{headers:{'Accept':'application/json'}}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
    const el=$('[data-github-repos]'); if(el&&Number.isFinite(Number(data.publicRepositoryCount))){el.dataset.countup=String(data.publicRepositoryCount); if(el.dataset.counted==='true')el.textContent=Number(data.publicRepositoryCount).toLocaleString();}
    const badge=$('#github-sync-badge'); if(badge&&data.lastVerified){const d=new Date(data.lastVerified);badge.lastChild.textContent=` GitHub metadata verified ${Number.isNaN(d.getTime())?data.lastVerified:d.toLocaleDateString()}`;}
  }).catch(()=>{});

  /* Project filter semantics + event instrumentation. */
  $$('.project-filter').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.project-filter').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
    track('project_filter',{filter:btn.dataset.filter||'all'});
  }));
  $$('.project-expand-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const card=btn.closest('[data-project-slug]');track('project_expanded',{project:card?.dataset.projectSlug||''});
  }));

  /* Tool conversion instrumentation. */
  let roiTimer;['#roi-people','#roi-hours','#roi-rate','#roi-potential'].forEach(sel=>$(sel)?.addEventListener('input',()=>{clearTimeout(roiTimer);roiTimer=setTimeout(()=>track('roi_completed'),900);}));
  $('#download-maturity')?.addEventListener('click',()=>track('maturity_report_downloaded'));
  $('#builder-form')?.addEventListener('submit',()=>track('system_configured'));

  /* Assistant usability: analytics, focus restore, full-screen focus trap. */
  const assistant=$('#site-assistant'),launcher=$('#assistant-launcher'),panel=$('#assistant-panel');
  let lastFocus=null,chatStarted=false;
  launcher?.addEventListener('click',()=>{lastFocus=document.activeElement;if(!chatStarted){track('chat_started');chatStarted=true;}});
  $('#assistant-close')?.addEventListener('click',()=>setTimeout(()=>lastFocus?.focus?.(),0));
  $('#assistant-form')?.addEventListener('submit',()=>track('chat_message_sent'));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&bookingModal?.classList.contains('open')){closeBooking();return;}
    if(e.key!=='Tab'||!assistant?.classList.contains('fullscreen'))return;
    const focusables=$$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',panel).filter(x=>!x.disabled&&x.offsetParent!==null);
    if(!focusables.length)return;const first=focusables[0],last=focusables.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });

  /* Hide work that depends on animation when the tab is not visible. */
  document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('page-hidden',document.hidden));
})();
