// Shared theme state — the small preload script sets the initial value before
// paint; this module owns the animated switch and keeps injected headers in sync.
(function initThemeMode() {
  const root = document.documentElement;
  const storageKey = 'ingenuity-theme';
  const getTheme = () => root.dataset.theme === 'dark' ? 'dark' : 'light';
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let switching = false;

  const syncButton = (button) => {
    const theme = getTheme();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.title = `Switch to ${nextTheme} mode`;
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    try { window.localStorage.setItem(storageKey, theme); } catch (error) {
      // Theme switching remains available when storage is disabled.
    }
    document.querySelectorAll('.theme-toggle').forEach(syncButton);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };

  // Both themes remain rendered as snapshots. Only the incoming snapshot is
  // progressively revealed; a translucent band alone cannot show the theme change.
  const revealFrames = (x, y, theme) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const shape = (edge) => {
      const points = [0, .25, .5, .75, 1].map((fraction) => {
        const py = height * fraction;
        const curve = Math.sin(fraction * Math.PI * 2) * 18;
        return `${edge + (py - y) * .28 + curve}px ${py}px`;
      }).reverse();
      return `polygon(${width}px 0px, ${width}px ${height}px, ${points.join(', ')})`;
    };
    const origin = `polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`;
    return [
      {
        clipPath: origin,
        transform: 'perspective(1100px) rotateY(-2deg) scale(1.012)',
        offset: 0
      },
      {
        clipPath: shape(x),
        transform: 'perspective(1100px) rotateY(-1deg) scale(1.008)',
        offset: .16
      },
      {
        clipPath: shape(-height * .28 - 80),
        transform: 'perspective(1400px) rotateY(0deg) scale(1)',
        offset: 1
      }
    ];
  };

  const setTheme = (theme, source) => {
    if (switching || theme === getTheme()) return;
    switching = true;
    const rect = source?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;
    source?.classList.add('is-switching');
    const finish = () => {
      switching = false;
      source?.classList.remove('is-switching');
      document.body.classList.remove('theme-color-fallback');
    };

    if (!prefersReducedMotion() && typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(() => applyTheme(theme));
      transition.ready.then(() => {
        const animation = root.animate(revealFrames(x, y, theme), {
          duration: 1250,
          easing: 'cubic-bezier(.45,0,.18,1)',
          fill: 'forwards',
          pseudoElement: '::view-transition-new(root)'
        });
        return animation.finished.finally(() => {
          transition.skipTransition();
          animation.cancel();
        });
      }).catch(() => {}).finally(finish);
    } else {
      document.body.classList.add('theme-color-fallback');
      applyTheme(theme);
      window.setTimeout(finish, prefersReducedMotion() ? 180 : 650);
    }
  };

  window.ingenuityTheme = {
    get: getTheme,
    syncButton,
    toggle(button) {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark', button);
    }
  };
})();

function createNavigationArrow(direction = 'next') {
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.classList.add('arrow-icon');
  if (direction === 'previous') arrow.classList.add('is-previous');
  arrow.setAttribute('viewBox', '0 0 18 18');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.setAttribute('focusable', 'false');
  arrow.innerHTML = '<path d="M1 9h12M10 5l4 4-4 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>';
  return arrow;
}

// Keep the legal footer consistent across root and nested routes.
(function syncLegalFooter() {
  const nestedRoute = /(?:^|\/)(pages|projects|case-studies)(?:\/|$)/.test(window.location.pathname);
  const prefix = nestedRoute ? '../' : '';
  const links = [
    ['Privacy Policy', `${prefix}privacy.html`],
    ['Terms & Conditions', `${prefix}terms.html`],
    ['Sitemap', `${prefix}sitemap.html`],
    ['Cookie Policy', `${prefix}cookie-policy.html`]
  ];
  const socials = [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/ingenuity-systems-co/home/',
      path: 'M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.25h4.5V23h-4.5V8.25zM8.25 8.25h4.31v2.02h.06c.6-1.13 2.07-2.33 4.26-2.33 4.55 0 5.39 3 5.39 6.9V23h-4.5v-6.94c0-1.66-.03-3.79-2.31-3.79-2.32 0-2.67 1.81-2.67 3.67V23h-4.5V8.25z'
    },
    {
      label: 'Email',
      href: 'mailto:info@ingenuitysys.com',
      path: 'M2 4h20v16H2V4zm2 2v.01L12 12l8-5.99V6H4zm16 2.24l-7.42 5.57a1 1 0 01-1.16 0L4 8.24V18h16V8.24z'
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/ingenuitysystems',
      path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.47 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.47.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-. 1.06.36 2.23.41 1.27.06 1.65.07 4.85.07s3.58-.01 4.85-.07c1.17-.05 1.8-.25 2.23-.41.56-.22.96-.47 1.38-.9.42-.42.68-.82.9-1.38.16-.42.36-1.06.41-2.23.06-1.27.07-1.65.07-4.85s-.01-3.58-.07-4.85c-.05-1.17-.25-1.8-.41-2.23-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58-.07-4.85c-.06-1.28-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.33 1.35 20.66.94 19.87.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z'
    }
  ];
  socials[2].path = 'M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6zm0 3a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6zm5.2-1.2a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3z';
  const footerNavigation = [
    {
      title: 'Company',
      items: [['Home', 'index.html'], ['About', 'about.html'], ['Careers', 'careers.html'], ['Contact', 'contact.html']]
    },
    {
      title: 'Services',
      items: [
        ['AI & Intelligent Systems', 'services-ai.html'],
        ['Business Process Automation', 'services-automation.html'],
        ['Software & Digital Engineering', 'services-software.html'],
        ['Systems Integration & Data', 'services-integration.html']
      ]
    },
    {
      title: 'Industries',
      items: [
        ['Ecommerce & Retail', 'industries-ecommerce.html'],
        ['Professional & Business Services', 'industries-professional.html'],
        ['Real Estate & Property', 'industries-realestate.html'],
        ['Financial Services', 'industries-financial.html'],
        ['Healthcare', 'industries-healthcare.html'],
        ['Manufacturing & Supply Chain', 'industries-manufacturing.html'],
        ['Technology & SaaS', 'industries-technology.html']
      ]
    }
  ];
  document.querySelectorAll('footer').forEach((footer) => {
    if (!footer.querySelector('.footer-watermark')) {
      const watermark = document.createElement('img');
      watermark.className = 'footer-watermark';
      watermark.alt = '';
      watermark.setAttribute('aria-hidden', 'true');
      watermark.src = `${prefix}assets/logo-icon.png`;
      footer.prepend(watermark);
    }
    if (!footer.querySelector('.social-row')) {
      const intro = footer.querySelector('.footer-top > div');
      if (intro) {
        const socialRow = document.createElement('div');
        socialRow.className = 'social-row';
        socials.forEach(({ label, href, path }) => {
          const link = document.createElement('a');
          link.setAttribute('aria-label', label);
          link.href = href;
          if (/^https?:/.test(href)) {
            link.target = '_blank';
            link.rel = 'noopener';
          }
          link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
          socialRow.appendChild(link);
        });
        const location = intro.querySelector('.footer-location');
        if (location) location.insertAdjacentElement('afterend', socialRow);
        else intro.appendChild(socialRow);
      }
    }
    const footerTop = footer.querySelector('.footer-top');
    const intro = footerTop?.firstElementChild;
    if (footerTop && intro) {
      Array.from(footerTop.children).slice(1).forEach((column) => column.remove());
      footerNavigation.forEach(({ title, items }) => {
        const column = document.createElement('div');
        column.className = 'footer-col';
        const heading = document.createElement('h5');
        heading.textContent = title;
        const list = document.createElement('ul');
        items.forEach(([label, href]) => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `${prefix}${href}`;
          link.textContent = label;
          item.appendChild(link);
          list.appendChild(item);
        });
        column.append(heading, list);
        footerTop.appendChild(column);
      });
    }
  });
  document.querySelectorAll('.legal-links').forEach((group) => {
    group.replaceChildren(...links.map(([label, href]) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      return link;
    }));
  });
})();

// Pinch zoom changes the visual viewport, not the CSS layout viewport. Never
// rebuild layout/canvases or reset UI transitions just because the user zooms.
(function initViewportStability() {
  let resizeTimer = null;
  let resizing = false;
  let motionPaused = false;
  let lastWidth = document.documentElement.clientWidth || window.innerWidth;
  let lastHeight = window.innerHeight;
  let lastDpr = window.devicePixelRatio || 1;
  const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const isZoomed = () => (window.visualViewport?.scale || 1) > 1.01;
  const syncMotion = () => {
    const zoomed = isZoomed();
    const paused = resizing || zoomed || document.hidden;
    document.body.classList.toggle('is-zoomed', zoomed);
    if (paused === motionPaused) return;
    motionPaused = paused;
    document.body.classList.toggle('motion-paused', paused);
    window.dispatchEvent(new CustomEvent(paused ? 'viewport:motion-pause' : 'viewport:motion-resume'));
  };
  const finishResize = () => {
    resizeTimer = null;
    resizing = false;
    document.body.classList.remove('is-resizing');
    window.dispatchEvent(new CustomEvent('viewport:resize-end'));
    syncMotion();
  };
  const handleLayoutChange = (force = false) => {
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const meaningfulChange = force ||
      Math.abs(width - lastWidth) >= 1 ||
      Math.abs(dpr - lastDpr) >= 0.01 ||
      (desktopPointer.matches && !isZoomed() && Math.abs(height - lastHeight) >= 1);

    if (!meaningfulChange) return;

    lastWidth = width;
    lastHeight = height;
    lastDpr = dpr;

    if (!resizing) {
      resizing = true;
      document.body.classList.add('is-resizing');
      syncMotion();
      window.dispatchEvent(new CustomEvent('viewport:resize-start'));
    }
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(finishResize, 180);
  };

  window.addEventListener('resize', () => handleLayoutChange(), { passive: true });
  window.addEventListener('orientationchange', () => handleLayoutChange(true), { passive: true });
  window.visualViewport?.addEventListener('resize', syncMotion, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  syncMotion();
})();

// Pause CSS decoration outside the viewport without hiding/recreating content.
(function initDecorativeMotion() {
  if (!('IntersectionObserver' in window)) return;
  const pauseOffscreenMotion = window.matchMedia('(min-width: 1041px) and (hover: hover) and (pointer: fine)');
  const regions = Array.from(document.querySelectorAll(
    '.hero-media, .hero-console, .tech-marquee, .solution-finder-section, .why-block, footer, .project-terminal, .project-detail-terminal, .flow-line'
  ));
  const observer = new IntersectionObserver((entries) => {
    if (!pauseOffscreenMotion.matches) return;
    entries.forEach(({ target, isIntersecting }) => target.classList.toggle('motion-offscreen', !isIntersecting));
  }, { rootMargin: '80px 0px', threshold: 0 });
  const syncObserver = () => {
    observer.disconnect();
    if (!pauseOffscreenMotion.matches) {
      regions.forEach((region) => region.classList.remove('motion-region', 'motion-offscreen'));
      return;
    }
    regions.forEach((region) => {
      region.classList.add('motion-region');
      observer.observe(region);
    });
  };
  if (pauseOffscreenMotion.addEventListener) pauseOffscreenMotion.addEventListener('change', syncObserver);
  else if (pauseOffscreenMotion.addListener) pauseOffscreenMotion.addListener(syncObserver);
  syncObserver();
})();

// Header shadow + floating pill morph on scroll — activates only after the hero section
const header = document.querySelector('header');
if (header) {
  const heroEl = document.querySelector('.hero-media, .work-hero, .tool-hero') || document.getElementById('hero-console');
  const getThreshold = () => heroEl ? Math.max(heroEl.offsetHeight - 80, 120) : 120;
  let threshold = getThreshold();
  let headerFrame = null;
  const syncHeader = () => {
    headerFrame = null;
    if (document.body.matches('.is-resizing, .is-zoomed')) return;
    // A small dead band prevents repeated pill/full-width swaps at the boundary.
    const scrolled = header.classList.contains('scrolled');
    if (!scrolled && window.scrollY > threshold + 16) header.classList.add('scrolled');
    else if (scrolled && window.scrollY < threshold - 16) header.classList.remove('scrolled');
  };
  const scheduleHeader = () => {
    if (headerFrame === null) headerFrame = window.requestAnimationFrame(syncHeader);
  };
  window.addEventListener('viewport:resize-end', () => { threshold = getThreshold(); scheduleHeader(); });
  window.addEventListener('viewport:motion-resume', scheduleHeader);
  window.addEventListener('scroll', scheduleHeader, { passive: true });
  scheduleHeader();
}

// Service capability links keep their descriptive hashes, but land at the
// capability heading instead of pushing an individual card under the header.
(function normalizeServiceAnchorLanding() {
  if (!document.body?.classList.contains('service-page')) return;

  const capabilityHashes = new Set([
    'agentic', 'copilots', 'rag', 'docint',
    'workflow', 'finance', 'crm', 'cs',
    'custom', 'web', 'tools', 'api',
    'sysapi', 'crmerp', 'data', 'bi'
  ]);
  const hashName = (value) => {
    try { return decodeURIComponent(String(value || '').replace(/^#/, '')).toLowerCase(); }
    catch { return String(value || '').replace(/^#/, '').toLowerCase(); }
  };
  const resolveLanding = (hash) => {
    const name = hashName(hash);
    if (!capabilityHashes.has(name)) return null;
    const card = document.getElementById(name);
    const section = card?.closest('section');
    return section?.querySelector('.section-head') || null;
  };
  const layoutTop = (element) => {
    let top = 0;
    let node = element;
    while (node) {
      top += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return top;
  };
  const headerOffset = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const baseHeight = parseFloat(rootStyles.getPropertyValue('--site-header-height')) || 104;
    const headerTop = Math.max(0, parseFloat(getComputedStyle(document.querySelector('header')).top) || 0);
    return baseHeight + headerTop + (window.innerWidth <= 760 ? 20 : 28);
  };
  const landAtHeading = (hash, smooth = false) => {
    const heading = resolveLanding(hash);
    if (!heading) return false;
    const top = Math.max(0, layoutTop(heading) - headerOffset());
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    if (!smooth) root.style.scrollBehavior = 'auto';
    window.scrollTo({ top, left: 0, behavior: smooth ? 'smooth' : 'auto' });
    if (!smooth) root.style.scrollBehavior = previousBehavior;
    return true;
  };

  if (resolveLanding(window.location.hash)) {
    const navigation = performance.getEntriesByType?.('navigation')[0];
    if (navigation?.type !== 'back_forward') {
      let userMoved = false;
      const cancelLanding = () => { userMoved = true; };
      ['wheel', 'touchstart', 'keydown'].forEach((name) => window.addEventListener(name, cancelLanding, { once: true, passive: true }));
      const settle = () => {
        ['wheel', 'touchstart', 'keydown'].forEach((name) => window.removeEventListener(name, cancelLanding));
        if (!userMoved) landAtHeading(window.location.hash, false);
      };
      if (document.readyState === 'complete') settle();
      else window.addEventListener('load', settle, { once: true });
    }
  }

  window.addEventListener('hashchange', () => landAtHeading(window.location.hash, false));
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, window.location.href); }
    catch { return; }
    if (url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        !resolveLanding(url.hash)) return;
    event.preventDefault();
    if (window.location.hash !== url.hash) history.pushState(null, '', url.hash);
    landAtHeading(url.hash, true);
  });
})();

// Scroll progress — overlay bar, visible only while actively scrolling, fades out when idle
const scrollProgressEl = document.getElementById('scroll-progress');
if (scrollProgressEl) {
  let progressHideTimer = null;
  let progressFrame = null;
  const renderScrollProgress = () => {
    progressFrame = null;
    if (document.body.classList.contains('is-resizing')) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
    scrollProgressEl.style.transform = `scaleX(${progress})`;
  };
  const scheduleScrollProgress = () => {
    if (progressFrame === null) progressFrame = window.requestAnimationFrame(renderScrollProgress);
  };
  window.addEventListener('scroll', () => {
    scheduleScrollProgress();
    scrollProgressEl.classList.add('visible');
    clearTimeout(progressHideTimer);
    progressHideTimer = setTimeout(() => {
      scrollProgressEl.classList.remove('visible');
    }, 700);
  }, { passive: true });
  window.addEventListener('viewport:resize-end', scheduleScrollProgress);
}

// Mobile menu toggle
const toggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('mobile-open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('mobile-nav-open', open);
    header?.classList.toggle('mobile-open', open);
  });
  // On mobile, Services/Industries links navigate directly to their overview pages
  // (the desktop mega-menu panel isn't shown inline on small screens)
  window.addEventListener('viewport:resize-end', () => {
    if (window.innerWidth <= 1040) return;
    navLinks.classList.remove('mobile-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-nav-open');
    header?.classList.remove('mobile-open');
  }, { passive: true });
}

// Consistent magnetic interaction for every site button
const magneticPointer = window.matchMedia('(min-width: 1080px) and (hover: hover) and (pointer: fine)');
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    if (!magneticPointer.matches || document.body.classList.contains('motion-paused')) return;
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.4;
    btn.style.transform = `translate(${x}px, ${y}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
});

// Generic scroll reveal for any element with .reveal / .reveal-scale / .in-view target classes
const revealTargets = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right, .cap-card, .service-tile, .industry-card, .wide-card, .flow-step, .ng-node, .capability-block');
if (revealTargets.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), i % 4 * 70);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => revealObserver.observe(el));
}

// Live Systems Console hero — animated pipeline with click-to-inspect node descriptions
(function initHeroConsole() {
  const panel = document.getElementById('hc-panel');
  const canvas = document.getElementById('hc-graph');
  if (!panel || !canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPaintLayout = window.matchMedia('(max-width: 1040px), (hover: none), (pointer: coarse)');
  let W, H;
  const DESKTOP_MARGIN = 60;
  const PAD_X = 12;
  const detail = document.getElementById('hc-node-detail');
  const detailKicker = document.getElementById('hc-node-kicker');
  const detailTitle = document.getElementById('hc-node-title');
  const detailStatus = document.getElementById('hc-node-status');
  const detailDescription = document.getElementById('hc-node-description');
  const detailTrace = document.getElementById('hc-node-trace');
  const cells = document.querySelectorAll('#hc-log-grid .hc-log-cell');

  const nodeDefs = [
    { id: 'in', label: 'Business Challenge', rx: 0.12, ry: 0.57, h: 56, kind: 'card' },
    { id: 'context', label: 'Context Retrieval', rx: 0.47, ry: 0.34, h: 56, kind: 'card' },
    { id: 'agent', label: 'Agent', rx: 0.47, ry: 0.57, h: 56, kind: 'card' },
    { id: 'responsegen', label: 'Response Generator', rx: 0.47, ry: 0.80, h: 56, kind: 'card' },
    { id: 'out', label: 'Working System', rx: 0.86, ry: 0.57, h: 56, kind: 'card' },
    { id: 'router', label: 'Router', rx: 0.80, ry: 0.30, h: 36, kind: 'chip' },
    { id: 'tool', label: 'Tool Call', rx: 0.47, ry: 0.10, h: 56, kind: 'card' },
    { id: 'rag', label: 'RAG Lookup', rx: 0.87, ry: 0.10, h: 36, kind: 'chip' }
  ];
  const responsiveLabels = {
    in: 'Business Challenge',
    context: 'Context',
    agent: 'Agent',
    responsegen: 'Response',
    out: 'System',
    router: 'Router',
    tool: 'Tools',
    rag: 'Knowledge'
  };
  const edgeDefs = [
    ['in', 'context'], ['context', 'agent'], ['tool', 'agent'],
    ['rag', 'router'], ['router', 'agent'],
    ['agent', 'responsegen'], ['responsegen', 'out']
  ];
  const nodeInfo = {
    in: { kicker: 'INPUT LAYER', description: 'Captures the business request and turns the starting intent into a clear system input.', trace: ['Business request', 'Context', 'System input'], activity: ['Request received: business intent', 'Input normalized for routing', 'Context window prepared', 'System input accepted'] },
    context: { kicker: 'CONTEXT LAYER', description: 'Brings the relevant knowledge, records, and operating context into the workflow before action is taken.', trace: ['Request', 'Context retrieval', 'Grounded input'], activity: ['RAG lookup: 3 sources matched', 'Relevant records attached', 'Context ranked for the agent', 'Grounded input ready'] },
    agent: { kicker: 'INTELLIGENT CORE', description: 'Coordinates AI, rules, data, and workflows across connected systems with observability and human oversight.', trace: ['Request', 'Reasoning', 'Action'], activity: ['Agent routing request…', 'Policy and intent checks passed', 'Tool path selected', 'Human review available'] },
    responsegen: { kicker: 'OUTPUT LAYER', description: 'Turns the completed workflow state into a clear response, handoff, or next step for the person or system consuming it.', trace: ['System state', 'Response generation', 'Clear outcome'], activity: ['Response context assembled', 'Output format validated', 'Response generated in 480ms', 'Next step prepared'] },
    out: { kicker: 'DELIVERY LAYER', description: 'Delivers the result to the right destination, whether that is a person, application, CRM, or downstream workflow.', trace: ['Response', 'Delivery', 'Outcome'], activity: ['Response delivered to destination', 'CRM record updated', 'Handoff completed', 'Outcome acknowledged'] },
    router: { kicker: 'DECISION LAYER', description: 'Evaluates intent, policy, and available paths so each request reaches the right capability with the right level of control.', trace: ['Incoming signal', 'Policy routing', 'Best path'], activity: ['Intent classified', 'Policy route evaluated', 'Workflow branch selected', 'Observability trace attached'] },
    tool: { kicker: 'ACTION LAYER', description: 'Connects the system to real tools and business applications so the workflow can perform useful work beyond conversation.', trace: ['Agent decision', 'Tool call', 'System update'], activity: ['Tool call: calendar.create', 'Permission check passed', 'External action completed', 'Result returned to agent'] },
    rag: { kicker: 'KNOWLEDGE LAYER', description: 'Retrieves grounded information from connected knowledge sources so responses and actions are based on the right evidence.', trace: ['Query', 'Knowledge retrieval', 'Grounded evidence'], activity: ['Knowledge query received', '3 relevant sources matched', 'Evidence attached to context', 'Retrieval complete'] }
  };
  let nodes = [];
  let selectedNodeId = 'agent';
  let activityLines = nodeInfo.agent.activity.slice();
  let activityIndex = 0;
  let activitySlot = 0;
  let graphVisible = true;
  let graphRunning = false;
  let lastGraphFrame = 0;

  const isResponsiveLayout = () => window.innerWidth <= 1040;
  const isPhoneLayout = () => window.innerWidth <= 767;
  function measureWidth(label, node) {
    const responsive = isResponsiveLayout();
    const phone = isPhoneLayout();
    const fontSize = phone ? 10 : 12;
    ctx.font = `700 ${fontSize}px 'Manrope', sans-serif`;
    if (responsive) {
      const iconSize = phone ? 28 : 32;
      const gap = phone ? 8 : 10;
      const outerPadding = phone ? 16 : 22;
      return Math.ceil(Math.max(phone ? 90 : 108, ctx.measureText(label).width + iconSize + gap + outerPadding));
    }
    if (node?.kind === 'chip') return Math.max(86, ctx.measureText(label).width + PAD_X * 2 + 12);
    return Math.ceil(Math.max(150, ctx.measureText(label).width + 32 + 10 + 26));
  }
  function layoutNodes() {
    const phone = isPhoneLayout();
    const responsive = isResponsiveLayout();
    const margin = DESKTOP_MARGIN;
    const dw = Math.max(1, W - margin * 2);
    const dh = Math.max(1, H - margin * 2);
    nodes = nodeDefs.map(n => {
      const displayLabel = responsive ? (responsiveLabels[n.id] || n.label) : n.label;
      const measuredWidth = measureWidth(displayLabel, n);
      const w = responsive
        ? Math.min(measuredWidth, phone ? (n.id === 'in' ? 148 : 122) : 220)
        : measuredWidth;
      const h = responsive ? (phone ? 48 : 54) : n.h;
      const [rx, ry] = [n.rx, n.ry];
      const hx = margin + rx * dw;
      const hy = margin + ry * dh;
      return {
        ...n,
        displayLabel,
        h,
        w,
        hx,
        hy,
        x: hx,
        y: hy,
        vx: 0,
        vy: 0
      };
    });

    if (responsive) {
      const placeRow = (ids, y, preferredGap) => {
        const row = ids.map(findNode).filter(Boolean);
        const sidePadding = phone ? 8 : 18;
        const available = Math.max(1, W - sidePadding * 2);
        const minimumGap = 5;
        let totalWidth = row.reduce((sum, node) => sum + node.w, 0);
        const minimumRowWidth = totalWidth + minimumGap * Math.max(0, row.length - 1);
        if (minimumRowWidth > available && totalWidth > 0) {
          const widthScale = Math.max(.72, (available - minimumGap * Math.max(0, row.length - 1)) / totalWidth);
          row.forEach((node) => { node.w *= widthScale; });
          totalWidth = row.reduce((sum, node) => sum + node.w, 0);
        }
        const gap = row.length > 1
          ? Math.max(minimumGap, Math.min(preferredGap, (available - totalWidth) / (row.length - 1)))
          : 0;
        const rowWidth = totalWidth + gap * Math.max(0, row.length - 1);
        let cursor = Math.max(sidePadding, (W - rowWidth) / 2);
        row.forEach((node) => {
          node.hx = cursor + node.w / 2;
          node.hy = y;
          node.x = node.hx;
          node.y = node.hy;
          cursor += node.w + gap;
        });
      };

      if (phone) {
        placeRow(['in', 'context'], H * .15, 10);
        placeRow(['tool', 'rag'], H * .39, 12);
        placeRow(['router', 'agent'], H * .63, 14);
        placeRow(['responsegen', 'out'], H * .87, 12);
      } else {
        placeRow(['tool', 'context', 'rag'], H * .16, 20);
        placeRow(['in', 'agent', 'router'], H * .50, 20);
        placeRow(['responsegen', 'out'], H * .84, 24);
      }
    } else {
      // A fixed, readable process plot: main flow through the center, with
      // tool and knowledge capabilities as supporting routes above it.
      const place = (id, x, y) => {
        const node = findNode(id);
        if (!node) return;
        node.hx = W * x;
        node.hy = H * y;
        node.x = node.hx;
        node.y = node.hy;
      };
      place('in', .15, .56);
      place('tool', .42, .18);
      place('context', .42, .39);
      place('agent', .42, .60);
      place('responsegen', .42, .81);
      place('rag', .82, .18);
      place('router', .70, .38);
      place('out', .82, .60);
    }
  }
  function resize() {
    const DPR = Math.min(window.devicePixelRatio || 1, isPhoneLayout() ? 1 : 1.25);
    const nextW = panel.clientWidth, nextH = panel.clientHeight;
    if (!nextW || !nextH) return;
    const pixelWidth = Math.round(nextW * DPR), pixelHeight = Math.round(nextH * DPR);
    if (W === nextW && H === nextH && canvas.width === pixelWidth && canvas.height === pixelHeight) return;
    W = nextW; H = nextH;
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    layoutNodes();
    draw(performance.now());
  }
  let dragging = null, pressedNode = null, pressPoint = null, dragOffX = 0, dragOffY = 0, lastT = 0;
  const mouse = { x: -9999, y: -9999, active: false };
  function pointerPos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function hit(n, x, y) { return Math.abs(x - n.x) < n.w / 2 + 6 && Math.abs(y - n.y) < n.h / 2 + 6; }

  function renderActivity() {
    if (!cells.length) return;
    activityIndex = cells.length;
    activitySlot = cells.length;
    cells.forEach((cell, index) => {
      cell.classList.remove('hc-in');
      cell.textContent = activityLines[index % activityLines.length];
      requestAnimationFrame(() => requestAnimationFrame(() => cell.classList.add('hc-in')));
    });
  }
  function pushActivityLine() {
    if (!cells.length) return;
    const cell = cells[activitySlot % cells.length];
    cell.classList.remove('hc-in');
    cell.textContent = activityLines[activityIndex % activityLines.length];
    requestAnimationFrame(() => requestAnimationFrame(() => cell.classList.add('hc-in')));
    activitySlot++;
    activityIndex++;
  }
  function renderTrace(labels) {
    if (!detailTrace) return;
    detailTrace.replaceChildren();
    labels.forEach((label, index) => {
      if (index) {
        detailTrace.appendChild(createNavigationArrow('next'));
      }
      const item = document.createElement('span');
      item.textContent = label;
      detailTrace.appendChild(item);
    });
  }
  function selectNode(id) {
    const info = nodeInfo[id] || nodeInfo.agent;
    const selectedNode = nodes.find(n => n.id === id);
    const selectedLabel = selectedNode?.displayLabel || nodeDefs.find(n => n.id === id)?.label || 'Agent';
    selectedNodeId = id;
    if (detailKicker) detailKicker.textContent = info.kicker;
    if (detailTitle) detailTitle.textContent = selectedLabel;
    if (detailStatus) detailStatus.textContent = 'Selected · ' + selectedLabel;
    if (detailDescription) detailDescription.textContent = info.description;
    renderTrace(info.trace);
    activityLines = info.activity.slice();
    if (detail) {
      detail.classList.remove('is-changing');
      void detail.offsetWidth;
      detail.classList.add('is-changing');
    }
    renderActivity();
    draw(0);
  }

  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'listbox');
  canvas.setAttribute('aria-label', 'Interactive connected-system map. Tap a node or use the arrow keys to inspect it.');
  canvas.style.cursor = 'pointer';
  canvas.addEventListener('pointerdown', e => {
    const p = pointerPos(e);
    const node = nodes.find(n => hit(n, p.x, p.y));
    if (!node) return;
    pressedNode = node;
    pressPoint = p;
    selectNode(node.id);
  });
  function endPointer(e, allowSelect) {
    const node = pressedNode;
    const p = e ? pointerPos(e) : null;
    const wasClick = Boolean(node && pressPoint && p && Math.hypot(p.x - pressPoint.x, p.y - pressPoint.y) < 7);
    pressedNode = null; pressPoint = null;
    mouse.active = false; mouse.x = -9999; mouse.y = -9999;
    if (allowSelect && wasClick) selectNode(node.id);
  }
  canvas.addEventListener('pointerup', e => endPointer(e, true));
  canvas.addEventListener('pointercancel', e => endPointer(e, false));
  canvas.addEventListener('pointerleave', e => endPointer(e, false));
  canvas.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = Math.max(0, nodeDefs.findIndex((node) => node.id === selectedNodeId));
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? nodeDefs.length - 1
        : (current + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + nodeDefs.length) % nodeDefs.length;
    selectNode(nodeDefs[next].id);
  });

  function findNode(id) { return nodes.find(n => n.id === id); }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawSparkle(cx, cy, size) {
    const inner = size * .28;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + inner, cy - inner);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx + inner, cy + inner);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - inner, cy + inner);
    ctx.lineTo(cx - size, cy);
    ctx.lineTo(cx - inner, cy - inner);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }
  function anchor(n, tx, ty) {
    const dx = tx - n.x, dy = ty - n.y; const hw = n.w / 2, hh = n.h / 2;
    if (dx === 0 && dy === 0) return { x: n.x, y: n.y };
    const scale = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6));
    return { x: n.x + dx * Math.min(scale, 1), y: n.y + dy * Math.min(scale, 1) };
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    edgeDefs.forEach((e, i) => {
      const a = findNode(e[0]), b = findNode(e[1]); if (!a || !b) return;
      const pa = anchor(a, b.x, b.y), pb = anchor(b, a.x, a.y);
      const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 - (Math.abs(pa.y - pb.y) < 10 ? 18 : 0);
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
      const isActivePath = e.includes(selectedNodeId);
      ctx.strokeStyle = isActivePath ? 'rgba(244,67,26,.82)' : (isResponsiveLayout() ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.22)');
      ctx.lineWidth = isActivePath ? (isResponsiveLayout() ? 2 : 2.4) : (isResponsiveLayout() ? 1.4 : 1.8);
      ctx.lineCap = 'round'; ctx.stroke();
      const t = reduceMotion ? (i + 1) / (edgeDefs.length + 1) : ((time * .00016 + (i + 1) / (edgeDefs.length + 1)) % 1);
      const qx = (1 - t) * (1 - t) * pa.x + 2 * (1 - t) * t * mx + t * t * pb.x;
      const qy = (1 - t) * (1 - t) * pa.y + 2 * (1 - t) * t * my + t * t * pb.y;
      ctx.beginPath(); ctx.arc(qx, qy, isResponsiveLayout() ? 2 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FF7A4D'; ctx.fill();
    });
    nodes.forEach(n => {
      const isSelected = n.id === selectedNodeId;
      if (isResponsiveLayout()) {
        const phone = isPhoneLayout();
        const nodeX = n.x - n.w / 2;
        const nodeY = n.y - n.h / 2;
        const iconSize = phone ? 28 : 32;
        const iconX = nodeX + (phone ? 8 : 10);
        const iconY = n.y - iconSize / 2;
        roundRect(nodeX, nodeY, n.w, n.h, phone ? 14 : 17);
        ctx.fillStyle = isSelected ? '#F4431A' : 'rgba(27,30,39,.94)';
        if (isSelected) {
          ctx.shadowColor = 'rgba(244,67,26,.28)';
          ctx.shadowBlur = 14;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = isSelected ? 1.7 : 1.15;
        ctx.strokeStyle = isSelected ? '#FFB09A' : 'rgba(255,255,255,.22)';
        ctx.stroke();

        roundRect(iconX, iconY, iconSize, iconSize, phone ? 8 : 9);
        ctx.fillStyle = isSelected ? 'rgba(255,255,255,.18)' : '#F4431A';
        if (isSelected) {
          ctx.shadowColor = 'rgba(244,67,26,.5)';
          ctx.shadowBlur = 11;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        drawSparkle(iconX + iconSize / 2, n.y, phone ? 5 : 6);

        const textX = iconX + iconSize + (phone ? 8 : 10);
        const maxTextWidth = Math.max(1, nodeX + n.w - textX - (phone ? 8 : 10));
        const label = n.displayLabel || n.label;
        let labelSize = phone ? 10 : 12;
        ctx.font = `700 ${labelSize}px 'Manrope', sans-serif`;
        const measuredLabelWidth = ctx.measureText(label).width;
        if (measuredLabelWidth > maxTextWidth) {
          labelSize = Math.max(phone ? 8.5 : 10, labelSize * maxTextWidth / measuredLabelWidth);
          ctx.font = `700 ${labelSize}px 'Manrope', sans-serif`;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, textX, n.y);
        return;
      }
      const nodeX = n.x - n.w / 2;
      const nodeY = n.y - n.h / 2;
      if (n.kind === 'chip') {
        roundRect(nodeX, nodeY, n.w, n.h, n.h / 2);
        ctx.fillStyle = isSelected ? '#F4431A' : 'rgba(76,35,42,.68)';
        ctx.fill();
        ctx.lineWidth = isSelected ? 1.7 : 1;
        ctx.strokeStyle = isSelected ? '#FFB09A' : 'rgba(244,67,26,.5)';
        ctx.stroke();
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#F6C9C0';
        ctx.font = `700 11px 'Manrope', sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.displayLabel || n.label, n.x, n.y);
        return;
      }

      const activeNode = n.id === selectedNodeId;
      const iconSize = 32;
      const iconX = nodeX + 10;
      const iconY = n.y - iconSize / 2;
      roundRect(nodeX, nodeY, n.w, n.h, 17);
      ctx.fillStyle = activeNode ? '#F4431A' : 'rgba(27,30,39,.94)';
      if (activeNode) { ctx.shadowColor = 'rgba(244,67,26,.34)'; ctx.shadowBlur = 13 + (reduceMotion ? 0 : (Math.sin(time * .004) + 1) * 4); }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = activeNode ? 1.8 : 1.15;
      ctx.strokeStyle = activeNode ? '#FFB09A' : 'rgba(255,255,255,.22)';
      ctx.stroke();

      roundRect(iconX, iconY, iconSize, iconSize, 9);
      ctx.fillStyle = activeNode ? 'rgba(255,255,255,.18)' : '#F4431A';
      ctx.fill();
      drawSparkle(iconX + iconSize / 2, n.y, 6);

      const textX = iconX + iconSize + 10;
      const maxTextWidth = Math.max(1, nodeX + n.w - textX - 10);
      const label = n.displayLabel || n.label;
      let labelSize = 12;
      ctx.font = `700 ${labelSize}px 'Manrope', sans-serif`;
      const measuredLabelWidth = ctx.measureText(label).width;
      if (measuredLabelWidth > maxTextWidth) {
        labelSize = Math.max(10, labelSize * maxTextWidth / measuredLabelWidth);
        ctx.font = `700 ${labelSize}px 'Manrope', sans-serif`;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, textX, n.y);
    });
  }
  function animateGraph(time) {
    if (lowPaintLayout.matches || !graphVisible || document.hidden || document.body.classList.contains('motion-paused')) {
      graphRunning = false;
      return;
    }
    if (time - lastGraphFrame >= 1000 / 28) {
      draw(time);
      lastGraphFrame = time;
    }
    requestAnimationFrame(animateGraph);
  }
  function startGraphAnimation() {
    if (reduceMotion || lowPaintLayout.matches || graphRunning || !graphVisible ||
        document.hidden || document.body.classList.contains('motion-paused')) return;
    graphRunning = true;
    requestAnimationFrame(animateGraph);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      graphVisible = Boolean(entries[0]?.isIntersecting);
      if (graphVisible) {
        lastGraphFrame = 0;
        startGraphAnimation();
      }
    }, { threshold: .08 }).observe(panel);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && graphVisible) startGraphAnimation();
  });
  resize();
  window.addEventListener('viewport:resize-end', () => {
    resize();
    if (graphVisible) startGraphAnimation();
  });
  window.addEventListener('viewport:motion-resume', startGraphAnimation);
  const syncGraphPaintMode = () => {
    graphRunning = false;
    resize();
    if (!lowPaintLayout.matches && graphVisible) startGraphAnimation();
  };
  if (lowPaintLayout.addEventListener) lowPaintLayout.addEventListener('change', syncGraphPaintMode);
  else if (lowPaintLayout.addListener) lowPaintLayout.addListener(syncGraphPaintMode);
  selectNode('agent');
  startGraphAnimation();
})();

// Static hero graph controls — the SVG stays visual-only while accessible hit
// areas update the detail panel underneath it.
(function initStaticHeroNodes() {
  const layer = document.querySelector('.hc-node-hit-layer');
  const detail = document.getElementById('hc-node-detail');
  if (!layer || !detail) return;
  const kicker = document.getElementById('hc-node-kicker');
  const title = document.getElementById('hc-node-title');
  const status = document.getElementById('hc-node-status');
  const description = document.getElementById('hc-node-description');
  const trace = document.getElementById('hc-node-trace');
  const nodeDetails = {
    in: { label: 'Request', kicker: 'INPUT LAYER', description: 'Captures the business request and turns the starting intent into a clear system input.', trace: ['Business request', 'Context', 'System input'] },
    context: { label: 'Context Retrieval', kicker: 'CONTEXT LAYER', description: 'Brings relevant knowledge, records, and operating context into the workflow before action is taken.', trace: ['Request', 'Context retrieval', 'Grounded input'] },
    agent: { label: 'Agent', kicker: 'INTELLIGENT CORE', description: 'Coordinates AI, rules, data, and workflows across connected systems with observability and human oversight.', trace: ['Request', 'Reasoning', 'Action'] },
    responsegen: { label: 'Response Generator', kicker: 'OUTPUT LAYER', description: 'Turns the completed workflow state into a clear response, handoff, or next step.', trace: ['System state', 'Response generation', 'Clear outcome'] },
    out: { label: 'Response', kicker: 'DELIVERY LAYER', description: 'Delivers the result to the right destination, whether that is a person, application, CRM, or downstream workflow.', trace: ['Response', 'Delivery', 'Outcome'] },
    router: { label: 'Router', kicker: 'DECISION LAYER', description: 'Evaluates intent, policy, and available paths so each request reaches the right capability.', trace: ['Incoming signal', 'Policy routing', 'Best path'] },
    tool: { label: 'Tool Call', kicker: 'ACTION LAYER', description: 'Connects the system to real tools and business applications so the workflow can perform useful work beyond conversation.', trace: ['Agent decision', 'Tool call', 'System update'] },
    rag: { label: 'RAG Lookup', kicker: 'KNOWLEDGE LAYER', description: 'Retrieves grounded information from connected knowledge sources so responses and actions are based on the right evidence.', trace: ['Query', 'Knowledge retrieval', 'Grounded evidence'] }
  };
  const buttons = [...layer.querySelectorAll('[data-hc-node]')];
  const panel = layer.closest('.hc-panel');
  const compactGraph = panel?.querySelector('.hc-static-graph-compact');
  const desktopGraph = panel?.querySelector('.hc-static-graph-desktop');
  const syncHitLayer = () => {
    if (!panel) return;
    const desktop = window.matchMedia('(min-width:1080px)').matches;
    const graph = desktop ? desktopGraph : compactGraph;
    if (!graph || !layer || !panel.clientWidth || !panel.clientHeight) return;
    const sourceWidth = desktop ? 1440 : 972;
    const sourceHeight = desktop ? 680 : 455;
    const panelWidth = panel.clientWidth;
    const panelHeight = panel.clientHeight;
    const objectFit = getComputedStyle(graph).objectFit;
    const scale = objectFit === 'contain'
      ? Math.min(panelWidth / sourceWidth, panelHeight / sourceHeight)
      : Math.max(panelWidth / sourceWidth, panelHeight / sourceHeight);
    const renderedWidth = sourceWidth * scale;
    const renderedHeight = sourceHeight * scale;
    layer.style.left = `${(panelWidth - renderedWidth) / 2}px`;
    layer.style.top = `${(panelHeight - renderedHeight) / 2}px`;
    layer.style.right = 'auto';
    layer.style.bottom = 'auto';
    layer.style.width = `${renderedWidth}px`;
    layer.style.height = `${renderedHeight}px`;
    layer.style.setProperty('--hc-node-radius', `${(desktop ? 24 : 17) * scale}px`);
  };
  syncHitLayer();
  if (window.ResizeObserver) new ResizeObserver(syncHitLayer).observe(panel);
  window.addEventListener('resize', syncHitLayer, { passive: true });
  window.addEventListener('viewport:resize-end', syncHitLayer);
  [compactGraph, desktopGraph].filter(Boolean).forEach((graph) => {
    if (graph.complete) syncHitLayer();
    else graph.addEventListener('load', syncHitLayer, { once: true });
  });
  const update = (id, moveToDetail = false) => {
    const info = nodeDetails[id] || nodeDetails.agent;
    buttons.forEach((button) => button.classList.toggle('is-selected', button.dataset.hcNode === id));
    if (kicker) kicker.textContent = info.kicker;
    if (title) title.textContent = info.label;
    if (status) status.textContent = 'Selected · ' + info.label;
    if (description) description.textContent = info.description;
    if (trace) {
      trace.replaceChildren();
      info.trace.forEach((item, index) => {
        if (index) {
          trace.appendChild(createNavigationArrow('next'));
        }
        const chip = document.createElement('span');
        chip.textContent = item;
        trace.appendChild(chip);
      });
    }
    detail.classList.remove('is-changing');
    void detail.offsetWidth;
    detail.classList.add('is-changing');
    if (moveToDetail && window.matchMedia('(max-width:720px)').matches) {
      detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };
  buttons.forEach((button) => button.addEventListener('click', () => update(button.dataset.hcNode, true)));
  update('agent');
})();

// Global site-memory RAG assistant. Keep the OpenAI key server-side: set only a secure proxy URL here later.
(function initGlobalAssistant() {
  if (document.querySelector('.site-assistant')) return;
  const CHAT_ENDPOINT = String(window.INGENUITY_CHAT_ENDPOINT || '/api/chat').trim();
  const siteBase = /\/(pages|projects|case-studies)(\/|$)/.test(window.location.pathname) ? '../' : '';
  const siteHref = (href) => siteBase + href;
  const knowledge = [
    { title: 'AI & Intelligent Systems', keys: 'ai intelligent systems agentic copilots rag knowledge document intelligence', text: 'We design agentic AI systems, AI copilots, knowledge and RAG systems, and document intelligence workflows around how your team actually operates.', href: 'services-ai.html' },
    { title: 'Business Process Automation', keys: 'business process automation workflow finance accounting crm sales customer service', text: 'Automation services cover workflow automation, finance and accounting, CRM and sales automation, and customer service operations.', href: 'services-automation.html' },
    { title: 'Software & Digital Engineering', keys: 'software digital engineering custom software web applications portals api backend', text: 'Software engineering includes custom software development, web and business applications, internal tools and portals, and API and backend development.', href: 'services-software.html' },
    { title: 'Systems Integration & Data', keys: 'systems integration data api crm erp pipelines business intelligence reporting', text: 'Integration work connects systems and APIs, CRM and ERP platforms, data pipelines, and business intelligence and reporting.', href: 'services-integration.html' },
    { title: 'Industries', keys: 'industries ecommerce retail financial services healthcare manufacturing supply chain technology saas real estate property professional business', text: 'The site covers ecommerce and retail, financial services, healthcare, manufacturing and supply chain, technology and SaaS, real estate and property, and professional and business services.', href: 'industries.html' },
    { title: 'Engineering Projects', keys: 'projects portfolio aura forge cross chain retail forecasting sam2 video wall deit skin cancer fairface blackjack x15 airbnb kgqa', text: 'Selected projects include AURA Forge / Cross-Chain Hub, Retail Sales Forecasting, SAM2 Video Wall Segmentation, DeiT Skin Cancer Classification, FairFace Gender Bias Analysis, Blackjack Reinforcement Learning, X-15 Flight Dynamics Simulation, Airbnb SEMMA Price Regression, and Knowledge Graph Question Answering.', href: 'projects/index.html' },
    { title: 'Case Studies', keys: 'case studies outcomes evidence work', text: 'Case studies show the engineering systems, applied AI workflows, and product thinking behind public work and selected outcomes.', href: 'case-studies/index.html' },
    { title: 'AI Maturity Assessment', keys: 'ai maturity assessment readiness audit roadmap capability', text: 'The AI Maturity Assessment helps teams evaluate readiness across strategy, data, workflow, systems, governance, people, and measurement, then choose a practical next step.', href: 'pages/ai-maturity.html' },
    { title: 'Build Your Own AI System', keys: 'build own ai system configurator architecture assistant system', text: 'Build Your Own AI System is an interactive configurator for shaping an AI system across the intelligence layer, data and memory, orchestration, interfaces, and governance.', href: 'pages/build-your-system.html' },
    { title: 'Engagement Process', keys: 'process discovery scope prototype build deploy optimize timeline', text: 'A typical engagement moves through Discovery, Scope, Prototype, Build, Deploy, and Optimize, with timing shaped by scope, integrations, data quality, and operational ownership.', href: 'about.html#process' },
    { title: 'Contact and Strategy Call', keys: 'contact email call calendly strategy conversation budget', text: 'Start a conversation through the contact form. The team can be reached at info@ingenuitysys.com, with locations in Lahore, Pakistan and Wyoming, USA. Strategy calls can be scheduled through Calendly.', href: 'contact.html' }
  ];
  const stopWords = new Set('a an and are as at be can do for from has have how i in is it me my of on or our please recommend tell that the their them this to us what when where which with you your'.split(' '));
  const tokenize = (value) => String(value || '').toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !stopWords.has(word)) || [];
  const retrieve = (query) => {
    const queryTokens = tokenize(query);
    return knowledge.map((doc) => {
      const haystack = `${doc.title} ${doc.keys} ${doc.text}`.toLowerCase();
      let score = queryTokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      if (haystack.includes(String(query).toLowerCase().trim())) score += 4;
      if (queryTokens.some((token) => doc.title.toLowerCase().includes(token))) score += 2;
      return { ...doc, score };
    }).filter((doc) => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const root = document.createElement('aside');
  root.className = 'site-assistant';
  root.innerHTML = `
    <button class="assistant-launcher" type="button" aria-expanded="false" aria-controls="assistant-panel">
      <span class="assistant-launcher-icon" aria-hidden="true"><img src="${siteHref('assets/logo-icon.png')}" alt=""></span>
      <span class="assistant-launcher-copy"><strong>Ask Ingenuity AI</strong><small>Get a solution recommendation</small></span>
      <span class="assistant-launcher-arrow" aria-hidden="true">↗</span>
    </button>
    <section class="assistant-panel" id="assistant-panel" aria-label="Ingenuity AI Consultant">
      <div class="assistant-header">
        <span class="assistant-header-icon" aria-hidden="true"><img src="${siteHref('assets/logo-icon.png')}" alt=""></span>
        <span class="assistant-header-copy"><strong>Ingenuity AI Consultant</strong><small class="assistant-status">RAG site advisor · online</small></span>
        <span class="assistant-actions"><button class="assistant-action assistant-expand" type="button" aria-label="Expand assistant">↗</button><button class="assistant-action assistant-close" type="button" aria-label="Close assistant">×</button></span>
      </div>
      <div class="assistant-body" role="log" aria-live="polite"></div>
      <form class="assistant-form"><input class="assistant-input" type="text" autocomplete="off" placeholder="Ask about services or your project…" aria-label="Ask about services or your project"><button class="assistant-send" type="submit" aria-label="Send message">➜</button></form>
      <div class="assistant-foot">AI solution advisor · <a href="${siteHref('contact.html')}#contact-form">Book a strategy call</a></div>
    </section>`;
  document.body.appendChild(root);

  const launcher = root.querySelector('.assistant-launcher');
  const panel = root.querySelector('.assistant-panel');
  const body = root.querySelector('.assistant-body');
  const input = root.querySelector('.assistant-input');
  const form = root.querySelector('.assistant-form');
  const open = () => {
    root.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    // Touch users choose when to open their keyboard; automatic focus caused
    // another viewport jump as soon as the panel appeared.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setTimeout(() => { if (root.classList.contains('is-open')) input.focus({ preventScroll: true }); }, 80);
    }
  };
  const close = () => { root.classList.remove('is-open'); launcher.setAttribute('aria-expanded', 'false'); };
  const populateAssistantRow = (row, text, user = false) => {
    row.className = `assistant-message${user ? ' user' : ''}`;
    row.replaceChildren();
    if (!user) {
      const avatar = document.createElement('span');
      avatar.className = 'assistant-avatar';
      avatar.innerHTML = `<img src="${siteHref('assets/logo-icon.png')}" alt="">`;
      row.appendChild(avatar);
    }
    const bubble = document.createElement('div');
    bubble.className = 'assistant-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    return row;
  };
  const addMessage = (text, user = false) => {
    const row = populateAssistantRow(document.createElement('div'), text, user);
    body.appendChild(row);
    window.requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
    return row;
  };
  const addSources = (docs, afterNode = null) => {
    if (!docs.length) return;
    const sourceWrap = document.createElement('div'); sourceWrap.className = 'assistant-sources';
    docs.slice(0, 3).forEach((doc) => { const link = document.createElement('a'); link.className = 'assistant-source'; link.href = siteHref(doc.href); link.textContent = doc.title; sourceWrap.appendChild(link); });
    body.insertBefore(sourceWrap, afterNode?.nextSibling || null);
  };
  const typing = () => { const row = document.createElement('div'); row.className = 'assistant-message assistant-typing-row'; row.innerHTML = `<span class="assistant-avatar"><img src="${siteHref('assets/logo-icon.png')}" alt=""></span><div class="assistant-bubble"><span class="assistant-typing"><i></i><i></i><i></i></span></div>`; body.appendChild(row); body.scrollTop = body.scrollHeight; return row; };
  const renderLocalAnswer = (query, docs) => {
    const q = query.toLowerCase();
    if (/book|call|schedule|contact|talk/.test(q)) return { text: 'The quickest next step is the contact form. Share your name, company, email, and budget tier, then you can book a strategy call from the routing flow.', docs: [knowledge.find((doc) => doc.title === 'Contact and Strategy Call')] };
    if (/maturity|ready|assessment|roadmap/.test(q)) return { text: 'The AI Maturity Assessment maps where your organization is today and recommends a practical next step across strategy, data, workflow, systems, governance, people, and measurement.', docs: [knowledge.find((doc) => doc.title === 'AI Maturity Assessment')] };
    if (/build.*system|configure|architecture/.test(q)) return { text: 'Use Build Your Own AI System to shape the intelligence, memory, orchestration, interface, and governance layers of a system around your operating reality.', docs: [knowledge.find((doc) => doc.title === 'Build Your Own AI System')] };
    if (!docs.length) return { text: 'I can help with services, industries, projects, case studies, AI maturity, building an AI system, or starting a conversation. What would you like to explore?', docs: [] };
    const lead = docs[0];
    return { text: `${lead.title}: ${lead.text} What would you like to explore next?`, docs };
  };
  const requestModel = async (query, docs) => {
    if (!CHAT_ENDPOINT) return null;
    try {
      const response = await fetch(CHAT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'ingenuity-systems-rag-chat', question: query, page: window.location.href, context: docs.map((doc) => ({ title: doc.title, text: doc.text, href: doc.href })) }) });
      if (!response.ok) return null;
      const data = await response.json();
      return String(data.answer || data.response || data.message || data.output_text || '').trim() || null;
    } catch (error) { return null; }
  };
  const ask = async (query) => {
    const clean = String(query || '').trim(); if (!clean) return;
    addMessage(clean, true); input.value = '';
    const docs = retrieve(clean); const pending = typing();
    const modelAnswer = await requestModel(clean, docs);
    const local = renderLocalAnswer(clean, docs);
    const keepAtBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
    populateAssistantRow(pending, modelAnswer || local.text);
    addSources(modelAnswer ? docs : local.docs.filter(Boolean), pending);
    if (keepAtBottom) window.requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  };
  const suggestions = document.createElement('div'); suggestions.className = 'assistant-suggestions';
  ['Recommend a solution', 'Automation ideas', 'Recent projects', 'Book a call'].forEach((label) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', () => ask(label)); suggestions.appendChild(button); });
  body.appendChild(suggestions);
  addMessage('I can help diagnose a business problem, recommend an AI or automation solution, answer questions from the website, explore projects, or help you start a conversation. What are you trying to improve?');
  launcher.addEventListener('click', () => root.classList.contains('is-open') ? close() : open());
  root.querySelector('.assistant-close').addEventListener('click', close);
  root.querySelector('.assistant-expand').addEventListener('click', () => root.classList.toggle('is-fullscreen'));
  form.addEventListener('submit', (event) => { event.preventDefault(); ask(input.value); });
  panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });

  const assistantSafeZones = document.querySelectorAll('.solution-finder, .assessment-shell, .interactive-tool, .contact-wrap');
  if (assistantSafeZones.length && 'IntersectionObserver' in window) {
    const visibleSafeZones = new Set();
    const syncSafeDock = () => {
      root.classList.toggle('is-content-safe', window.innerWidth <= 767 && visibleSafeZones.size > 0);
    };
    const safeZoneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > .06) visibleSafeZones.add(entry.target);
        else visibleSafeZones.delete(entry.target);
      });
      syncSafeDock();
    }, { threshold: [0, .06, .2], rootMargin: '-8% 0px -8% 0px' });
    assistantSafeZones.forEach((zone) => safeZoneObserver.observe(zone));
    window.addEventListener('viewport:resize-end', syncSafeDock);
  }

  const footer = document.querySelector('footer');
  if (footer && 'IntersectionObserver' in window) {
    const footerObserver = new IntersectionObserver(([entry]) => {
      root.classList.toggle('is-footer-visible', entry.isIntersecting);
    }, { threshold: 0.02 });
    footerObserver.observe(footer);
  }
})();

// Restored decision-layer cards — reveal the supporting detail without changing page flow.
(function initDecisionLayer() {
  const cards = [...document.querySelectorAll('.decision-card')];
  const toggles = [...document.querySelectorAll('.decision-toggle')];
  if (!cards.length || !toggles.length) return;

  const setCardState = (card, expanded) => {
    const toggle = card.querySelector('.decision-toggle');
    const detail = card.querySelector('.decision-detail');
    card.classList.toggle('is-expanded', expanded);
    toggle?.setAttribute('aria-expanded', String(expanded));
    detail?.setAttribute('aria-hidden', String(!expanded));
    if (detail) detail.inert = !expanded;
  };
  cards.forEach((card) => setCardState(card, false));

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const card = toggle.closest('.decision-card');
      if (!card) return;
      const expanded = !card.classList.contains('is-expanded');
      cards.forEach((other) => {
        if (other !== card) setCardState(other, false);
      });
      setCardState(card, expanded);
    });
  });
})();

// Home-page solution finder — four lightweight questions that lead to a useful next step.
(function initSolutionFinder() {
  const root = document.querySelector('.solution-finder');
  if (!root) return;
  const steps = [...root.querySelectorAll('.solution-step')];
  const result = root.querySelector('[data-solution-result]');
  const progressFill = root.querySelector('#solution-progress-fill');
  const stepNumber = root.querySelector('#solution-step-number');
  const selections = [];
  if (!steps.length || !result) return;

  const recommendations = {
    'manual-work': ['Workflow automation', 'A focused automation pilot can remove repetitive work first, then expand around the processes that matter most.'],
    knowledge: ['An AI knowledge system', 'A grounded knowledge and RAG system can make the right information easier to find, trust, and use.'],
    'custom-software': ['A build-ready digital product plan', 'A practical product plan can turn the core requirement into a clear, testable build sequence.'],
    disconnected: ['Systems integration and data', 'Connecting the systems you already rely on can create a more reliable flow of information and fewer manual handoffs.'],
    operations: ['A workflow and automation audit', 'Start by mapping the operating reality and identify the smallest useful layer to improve it.'],
    'customer-experience': ['A connected customer workflow', 'Bring customer data, communication, and follow-up into one clear workflow your team can actually run.'],
    product: ['A product discovery sprint', 'Define the product around the user, the business outcome, and the systems needed to make it useful.'],
    data: ['A data and reporting foundation', 'Create a dependable path from source systems to the reporting and decisions your team needs.']
  };

  const updateProgress = (step) => {
    const percent = step >= steps.length ? 100 : (step / steps.length) * 100;
    if (progressFill) progressFill.style.width = percent + '%';
    if (stepNumber) stepNumber.textContent = step >= steps.length ? '4' : String(step);
  };
  const showStep = (index) => {
    steps.forEach((step, i) => {
      const active = i === index;
      step.classList.toggle('is-active', active);
      step.hidden = !active;
    });
    result.hidden = true;
    updateProgress(index + 1);
  };
  const showResult = () => {
    steps.forEach(step => { step.classList.remove('is-active'); step.hidden = true; });
    const fallback = ['A practical starting point', 'We can map the constraint, define the smallest useful first step, and connect it to the systems your team already uses.'];
    const recommendation = recommendations[selections[0]] || recommendations[selections[1]] || fallback;
    const title = root.querySelector('#solution-result-title');
    const copy = root.querySelector('#solution-result-copy');
    if (title) title.textContent = recommendation[0];
    if (copy) copy.textContent = recommendation[1];
    result.hidden = false;
    updateProgress(steps.length);
  };

  root.querySelectorAll('[data-answer]').forEach(button => {
    button.addEventListener('click', () => {
      const step = Number(button.closest('[data-solution-step]')?.dataset.solutionStep || 1);
      selections[step - 1] = button.dataset.answer;
      if (step < steps.length) showStep(step);
      else showResult();
    });
  });
  root.querySelectorAll('[data-solution-back]').forEach(button => {
    button.addEventListener('click', () => {
      const current = Number(button.closest('[data-solution-step]')?.dataset.solutionStep || 1);
      showStep(Math.max(0, current - 2));
    });
  });
  root.querySelector('[data-solution-restart]')?.addEventListener('click', () => {
    selections.length = 0;
    showStep(0);
  });
  updateProgress(1);
})();

// The canonical header below owns navigation on every route.
(function ensureSiteMenus() {
  return;
})();

// Canonical shared header: every route receives the same tabs, menus, and relative links.
(function normalizeGlobalHeader() {
  const headerEl = document.querySelector('header');
  const nav = headerEl?.querySelector('.nav');
  const navLinks = nav?.querySelector('.nav-links');
  if (!headerEl || !nav || !navLinks) return;
  const path = decodeURIComponent(window.location.pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  const siteBase = /\/(pages|projects|case-studies)(\/|$)/.test(path) ? '../' : '';
  const route = (name) => new RegExp('(^|/)' + name + '(?:-|\\.html|/|$)').test(path);
  const activeMenu = route('services')
      ? 'services'
      : route('industries')
        ? 'industries'
        : route('work') || route('projects') || route('case-studies')
          ? 'work'
          : path === '/' || path.endsWith('/index.html') && !/\/(pages|projects|case-studies)\/index\.html$/.test(path)
            ? 'home'
            : 'company';
  const active = (name) => activeMenu === name ? ' active' : '';
  const current = (name) => activeMenu === name ? ' aria-current="page"' : '';
  const normalizePath = (value) => {
    const path = String(value || '').split('#')[0].split('?')[0].replace(/\\/g, '/');
    const withoutIndex = path.replace(/\/index\.html$/, '/');
    const cleanPath = withoutIndex.replace(/\/+$/, '') || '/';
    if (cleanPath === '/') return '/';
    const pageRoute = cleanPath.match(/^\/pages\/([^/]+)\.html$/);
    if (pageRoute) return '/' + pageRoute[1];
    return cleanPath.replace(/\.html$/, '') || '/';
  };
  const currentPath = normalizePath(window.location.pathname);
  const isCurrentHref = (href) => {
    try {
      const target = new URL(siteBase + href, window.location.href);
      const samePath = normalizePath(target.pathname) === currentPath;
      const currentHash = window.location.hash;
      return samePath && (currentHash ? target.hash === currentHash : !target.hash);
    }
    catch { return false; }
  };
  navLinks.innerHTML =
    '<li><a data-top="home" class="top-link' + active('home') + '"' + current('home') + ' href="' + siteBase + 'index.html">Home</a></li>' +
    '<li class="has-dropdown" data-menu="services"><a aria-haspopup="true" data-top="services" class="top-link' + active('services') + '"' + current('services') + ' href="' + siteBase + 'services.html">Services <span class="caret"></span></a></li>' +
    '<li class="has-dropdown" data-menu="industries"><a aria-haspopup="true" data-top="industries" class="top-link' + active('industries') + '"' + current('industries') + ' href="' + siteBase + 'industries.html">Industries <span class="caret"></span></a></li>' +
    '<li class="has-dropdown" data-menu="work"><a aria-haspopup="true" data-top="work" class="top-link' + active('work') + '"' + current('work') + ' href="' + siteBase + 'work.html">Work <span class="caret"></span></a></li>' +
    '<li class="has-dropdown" data-menu="company"><a aria-haspopup="true" data-top="company" class="top-link' + active('company') + '"' + current('company') + ' href="' + siteBase + 'about.html">Company <span class="caret"></span></a></li>';
  navLinks.querySelectorAll('.top-link[data-top]').forEach((link) => {
    const isActive = link.dataset.top === activeMenu;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  nav.querySelector('.nav-cta a')?.setAttribute('href', siteBase + 'contact.html');
  const cta = nav.querySelector('.nav-cta');
  if (cta && !cta.querySelector('.theme-toggle')) {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.type = 'button';
    themeToggle.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"><svg class="theme-glyph theme-glyph-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M19.4 4.6L18 6M6 18l-1.4 1.4"></path></svg><svg class="theme-glyph theme-glyph-moon" viewBox="0 0 24 24" aria-hidden="true"><path class="moon-body" d="M20.5 15.2A8.7 8.7 0 0 1 8.8 3.5 8.7 8.7 0 1 0 20.5 15.2Z"></path><path class="moon-star" d="M18.2 3.5v2.2M19.3 4.6h-2.2"></path></svg></span>';
    themeToggle.addEventListener('click', () => window.ingenuityTheme?.toggle(themeToggle));
    cta.prepend(themeToggle);
  }
  const themeToggle = cta?.querySelector('.theme-toggle');
  if (themeToggle) window.ingenuityTheme?.syncButton(themeToggle);
  const menus = {
    services: {
      titleFirst: true,
      columns: [
        [['AI & Intelligent Systems', 'services-ai.html'], ['Agentic AI Systems', 'services-ai.html#agentic'], ['AI Copilots', 'services-ai.html#copilots'], ['Knowledge & RAG Systems', 'services-ai.html#rag'], ['Document Intelligence', 'services-ai.html#docint'], ['All AI Capabilities →', 'services-ai.html']],
        [['Business Process Automation', 'services-automation.html'], ['Workflow Automation', 'services-automation.html#workflow'], ['Finance & Accounting', 'services-automation.html#finance'], ['CRM & Sales Automation', 'services-automation.html#crm'], ['Customer Service Automation', 'services-automation.html#cs'], ['All Automation Capabilities →', 'services-automation.html']],
        [['Software & Digital Engineering', 'services-software.html'], ['Custom Software Development', 'services-software.html#custom'], ['Web & Business Applications', 'services-software.html#web'], ['Internal Tools & Portals', 'services-software.html#tools'], ['API & Backend Development', 'services-software.html#api'], ['All Engineering Capabilities →', 'services-software.html']],
        [['Systems Integration & Data', 'services-integration.html'], ['Systems & API Integration', 'services-integration.html#sysapi'], ['CRM & ERP Integration', 'services-integration.html#crmerp'], ['Data Integration & Pipelines', 'services-integration.html#data'], ['Business Intelligence & Reporting', 'services-integration.html#bi'], ['All Integration Capabilities →', 'services-integration.html']]
      ]
    },
    industries: {
      columns: [
        [['Ecommerce & Retail', 'industries-ecommerce.html'], ['Professional & Business Services', 'industries-professional.html']],
        [['Real Estate & Property', 'industries-realestate.html'], ['Financial Services', 'industries-financial.html']],
        [['Healthcare', 'industries-healthcare.html'], ['Manufacturing & Supply Chain', 'industries-manufacturing.html']],
        [['Technology & SaaS', 'industries-technology.html'], ['Explore All Industries →', 'industries.html']]
      ]
    },
    work: {
      titleFirst: true,
      columns: [
        [['Projects', 'projects/index.html']],
        [['Case Studies', 'case-studies/index.html']]
      ]
    },
    company: {
      columns: [
        [['About Us', 'about.html'], ['Careers', 'careers.html'], ['Contact', 'contact.html']],
        [['AI Maturity Assessment', 'pages/ai-maturity.html'], ['Build Your Own AI System', 'pages/build-your-system.html'], ['Start a Conversation →', 'contact.html']]
      ]
    }
  };
  const megaWrap = headerEl.querySelector('.mega-wrap') || document.createElement('div');
  megaWrap.className = 'mega-wrap';
  megaWrap.replaceChildren();
  Object.entries(menus).forEach(([name, menu]) => {
    const panel = document.createElement('div');
    panel.className = 'mega-dropdown mega-' + name;
    panel.dataset.panel = name;
    const inner = document.createElement('div');
    inner.className = 'mega-inner';
    menu.columns.forEach((column) => {
      const col = document.createElement('div');
      col.className = 'mega-col';
      const list = document.createElement('ul');
      column.forEach(([label, href], index) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = siteBase + href;
        link.textContent = label;
        const classes = [];
        if (menu.titleFirst && index === 0) classes.push('mega-col-title');
        if (/^(All |Explore All |Start a Conversation)/.test(label)) classes.push('mega-cta');
        const isCallToAction = /^(All |Explore All |Start a Conversation)/.test(label);
        const isOverviewCallToAction = label === 'Explore All Industries →';
        if (isCurrentHref(href) && (!isCallToAction || isOverviewCallToAction)) {
          classes.push('is-current');
          link.setAttribute('aria-current', 'page');
        }
        link.className = classes.join(' ');
        item.appendChild(link);
        list.appendChild(item);
      });
      col.appendChild(list);
      inner.appendChild(col);
    });
    panel.appendChild(inner);
    megaWrap.appendChild(panel);
  });
  if (!megaWrap.parentElement) headerEl.appendChild(megaWrap);

  // Mobile/tablet navigation uses an in-header accordion. The same menu data
  // powers both versions, so links remain consistent without exposing the
  // detached desktop mega-menu on small screens.
  const mobileOverview = {
    services: ['Services overview', 'services.html'],
    industries: ['Industries overview', 'industries.html'],
    work: ['Work overview', 'work.html'],
    company: ['About Us', 'about.html']
  };
  const closeMobileSubmenus = (except = null) => {
    navLinks.querySelectorAll('.mobile-submenu-open').forEach((entry) => {
      if (entry === except) return;
      entry.classList.remove('mobile-submenu-open');
      entry.querySelector(':scope > .top-link')?.setAttribute('aria-expanded', 'false');
    });
  };
  const closeMobileNavigation = () => {
    navLinks.classList.remove('mobile-open');
    nav.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-nav-open');
    headerEl.classList.remove('mobile-open');
    closeMobileSubmenus();
  };

  Object.entries(menus).forEach(([name, menu]) => {
    const item = navLinks.querySelector('[data-menu="' + name + '"]');
    const link = item?.querySelector(':scope > .top-link');
    if (!item || !link) return;

    const submenu = document.createElement('div');
    submenu.className = 'mobile-submenu';
    const submenuInner = document.createElement('div');
    submenuInner.className = 'mobile-submenu-inner';
    const candidates = [
      { label: mobileOverview[name][0], href: mobileOverview[name][1], kind: 'overview' },
      ...menu.columns.flatMap((column) => column
        .filter(([label], index) => {
          if (/^(All |Explore All |Start a Conversation)/.test(label)) return false;
          return name === 'industries' || name === 'company' || (menu.titleFirst && index === 0);
        })
        .map(([label, href]) => ({ label, href, kind: 'core' })))
    ];
    const seen = new Set();
    candidates.forEach(({ label, href, kind }) => {
      const resolvedHref = siteBase + href;
      if (seen.has(resolvedHref)) return;
      seen.add(resolvedHref);
      const sublink = document.createElement('a');
      sublink.href = resolvedHref;
      sublink.textContent = label;
      sublink.classList.add('mobile-' + kind + '-link');
      if (isCurrentHref(href)) {
        sublink.classList.add('is-current');
        sublink.setAttribute('aria-current', 'page');
      }
      sublink.addEventListener('click', closeMobileNavigation);
      submenuInner.appendChild(sublink);
    });
    submenu.appendChild(submenuInner);
    item.appendChild(submenu);

    link.addEventListener('click', (event) => {
      if (window.innerWidth > 1040) return;
      event.preventDefault();
      const expanding = !item.classList.contains('mobile-submenu-open');
      closeMobileSubmenus(item);
      item.classList.toggle('mobile-submenu-open', expanding);
      link.setAttribute('aria-expanded', String(expanding));
    });
  });

  nav.querySelector('.menu-toggle')?.addEventListener('click', () => {
    if (nav.querySelector('.menu-toggle')?.getAttribute('aria-expanded') === 'false') closeMobileSubmenus();
  });
  window.addEventListener('viewport:resize-end', () => {
    if (window.innerWidth > 1040) closeMobileSubmenus();
  });
  navLinks.querySelectorAll(':scope > li:not(.has-dropdown) > .top-link').forEach((link) => {
    link.addEventListener('click', closeMobileNavigation);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('mobile-open')) closeMobileNavigation();
  });

  let menuCloseTimer = null;
  const menuLinks = Array.from(navLinks.querySelectorAll('.has-dropdown > .top-link'));
  const setMenuHeight = (panel) => {
    const panelHeight = Math.ceil(panel?.scrollHeight || 0);
    headerEl.style.setProperty('--menu-panel-height', panelHeight + 'px');
  };
  const closeMenu = () => {
    clearTimeout(menuCloseTimer);
    menuCloseTimer = setTimeout(() => {
      headerEl.classList.remove('menu-open');
      menuLinks.forEach((menuLink) => menuLink.setAttribute('aria-expanded', 'false'));
    }, 140);
  };
  const keepMenuOpen = () => clearTimeout(menuCloseTimer);

  Object.keys(menus).forEach((name) => {
    const item = navLinks.querySelector('[data-menu="' + name + '"]');
    const panel = megaWrap.querySelector('[data-panel="' + name + '"]');
    const link = item?.querySelector('a');
    if (!item || !panel || !link) return;
    item.dataset.menuBound = 'true';
    if (name === 'work') item.dataset.workBound = 'true';
    link.setAttribute('aria-expanded', 'false');
    const open = () => {
      if (window.innerWidth <= 1040) return;
      keepMenuOpen();
      megaWrap.dataset.active = name;
      setMenuHeight(panel);
      headerEl.classList.add('menu-open');
      menuLinks.forEach((menuLink) => menuLink.setAttribute('aria-expanded', String(menuLink === link)));
    };
    item.addEventListener('mouseenter', open);
    item.addEventListener('focusin', open);
    panel.addEventListener('mouseenter', keepMenuOpen);
  });
  headerEl.addEventListener('mouseenter', keepMenuOpen);
  headerEl.addEventListener('mouseleave', closeMenu);
  headerEl.addEventListener('focusout', (event) => {
    if (!headerEl.contains(event.relatedTarget)) closeMenu();
  });
  window.addEventListener('viewport:resize-end', () => {
    if (!headerEl.classList.contains('menu-open')) return;
    const activePanel = megaWrap.querySelector('[data-panel="' + megaWrap.dataset.active + '"]');
    setMenuHeight(activePanel);
  });
  document.documentElement.dataset.canonicalHeader = 'true';
})();
document.body?.classList.add('header-ready');

// Hero content rotation — left-column headline/CTA cycles through real positioning angles
(function initHeroRotation() {
  const scope = document.getElementById('hero-console');
  if (!scope) return;
  const slides = scope.querySelectorAll('.hero-slide');
  const dotsWrap = document.getElementById('hero-dots');
  if (!slides.length || !dotsWrap) return;
  const manualHero = window.matchMedia('(max-width: 1079px), (prefers-reduced-motion: reduce)');
  let heroVisible = true;
  let index = 0, timer;
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Show headline ' + (i + 1));
    dot.addEventListener('click', () => { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('.hero-dot');
  function goTo(i) {
    slides[index].classList.remove('active');
    dots[index].classList.remove('active');
    index = (i + slides.length) % slides.length;
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    slides.forEach((slide, position) => {
      slide.inert = position !== index;
      slide.setAttribute('aria-hidden', String(position !== index));
    });
  }
  function restart() {
    clearInterval(timer);
    if (manualHero.matches || !heroVisible || document.hidden || document.body.classList.contains('motion-paused')) return;
    timer = setInterval(() => {
      if (!document.hidden && !document.body.classList.contains('motion-paused')) goTo(index + 1);
    }, 5500);
  }
  window.addEventListener('viewport:motion-pause', () => clearInterval(timer));
  window.addEventListener('viewport:motion-resume', restart);
  manualHero.addEventListener('change', restart);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      heroVisible = Boolean(entries[0]?.isIntersecting);
      restart();
    }, { threshold: .01 }).observe(scope);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer);
    else restart();
  });
  goTo(0);
  restart();
})();

// Visible orange pointer accent — preserves the native cursor while restoring
// the previous desktop interaction dot and its hover/press states.
(function initCursorDot() {
  const dot = document.getElementById('cursor-dot');
  const allowed = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!dot || !allowed.matches) return;

  let frame = null;
  let point = { x: 0, y: 0 };
  const interactiveSelector = 'a,button,[role="button"],input,textarea,select,summary,canvas,.hc-node-hit-layer';
  const interactiveAt = (target) => target instanceof Element ? target.closest(interactiveSelector) : null;
  const render = () => {
    frame = null;
    dot.style.left = point.x + 'px';
    dot.style.top = point.y + 'px';
  };
  const move = (event) => {
    point = { x: event.clientX, y: event.clientY };
    if (frame === null) frame = requestAnimationFrame(render);
    document.body.classList.add('cursor-active', 'custom-cursor-ready');
  };

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerover', (event) => {
    if (interactiveAt(event.target)) document.body.classList.add('cursor-hover');
  }, { passive: true });
  window.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) {
      document.body.classList.remove('cursor-active', 'cursor-hover', 'cursor-down', 'custom-cursor-ready');
      return;
    }
    if (!interactiveAt(event.relatedTarget)) document.body.classList.remove('cursor-hover');
  }, { passive: true });
  window.addEventListener('pointerdown', () => document.body.classList.add('cursor-down'), { passive: true });
  window.addEventListener('pointerup', () => document.body.classList.remove('cursor-down'), { passive: true });
  window.addEventListener('pointercancel', () => document.body.classList.remove('cursor-down'), { passive: true });
  window.addEventListener('blur', () => {
    document.body.classList.remove('cursor-active', 'cursor-hover', 'cursor-down');
  });
})();

// Dot-grid background spotlight — follows the cursor so the pattern feels alive, not static
(function initDotSpotlight() {
  const allowed = window.matchMedia('(min-width: 1080px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  if (!allowed.matches) return;
  const spot = document.createElement('div');
  spot.id = 'dot-spotlight';
  document.body.prepend(spot);
  let hideTimer = null;
  let spotFrame = null;
  let point = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    if (!allowed.matches || document.body.classList.contains('motion-paused')) return;
    point = { x: e.clientX, y: e.clientY };
    if (spotFrame !== null) return;
    spotFrame = requestAnimationFrame(() => {
      spotFrame = null;
      if (document.body.classList.contains('motion-paused')) return;
      spot.style.setProperty('--mx', point.x + 'px');
      spot.style.setProperty('--my', point.y + 'px');
      spot.classList.add('active');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => spot.classList.remove('active'), 1200);
    });
  }, { passive: true });
})();

// Horizontal flow chart progress fill (sequential, tied to scroll reveal already via .in-view)
// handled purely by CSS transitions on .flow-step.in-view

// Testimonial slider (auto-advances while hovered, manual via dots/arrows any time)
function initSlider(rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;
  const track = root.querySelector('.coverflow-track') || root.querySelector('.testimonial-track');
  const isFanMode = track && track.classList.contains('testimonial-track');
  const dotsWrap = root.parentElement.querySelector('.coverflow-controls .slider-dots') || root.querySelector('.slider-dots');
  const controlsRoot = root.parentElement.querySelector('.coverflow-controls') || root;
  const prevBtn = controlsRoot.querySelector('.slider-prev');
  const nextBtn = controlsRoot.querySelector('.slider-next');
  if (!track || !dotsWrap) return;
  const slides = track.children;
  let index = 0;
  let autoplay;
  let isHovering = false;
  let sliderVisible = true;
  const sliderReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  }
  const dots = dotsWrap.children;

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    for (let s = 0; s < slides.length; s++) {
      let rel = (s - index + slides.length) % slides.length;
      if (isFanMode) {
        slides[s].classList.remove('fan-active');
        if (rel === 0) slides[s].classList.add('fan-active');
      } else {
        if (rel > slides.length / 2) rel -= slides.length;
        slides[s].classList.remove('cf-active', 'cf-prev1', 'cf-next1', 'cf-prev2', 'cf-next2', 'cf-hidden');
        if (rel === 0) slides[s].classList.add('cf-active');
        else if (rel === -1) slides[s].classList.add('cf-prev1');
        else if (rel === 1) slides[s].classList.add('cf-next1');
        else if (rel === -2) slides[s].classList.add('cf-prev2');
        else if (rel === 2) slides[s].classList.add('cf-next2');
        else slides[s].classList.add('cf-hidden');
      }
    }
    for (let d = 0; d < dots.length; d++) dots[d].classList.toggle('active', d === index);
  }

  // only the centered/active card follows its link; other cards just recenter on click
  Array.from(slides).forEach((slide, i) => {
    slide.addEventListener('click', (e) => {
      if (i !== index) {
        e.preventDefault();
        goTo(i);
      }
    });
  });

  function startAutoplay() {
    stopAutoplay();
    if (!sliderVisible || sliderReducedMotion.matches || document.hidden || document.body.classList.contains('motion-paused')) return;
    autoplay = setInterval(() => {
      if (!isHovering && !document.hidden && !document.body.classList.contains('motion-paused')) goTo(index + 1);
    }, 4000);
  }
  function stopAutoplay() { clearInterval(autoplay); }
  window.addEventListener('viewport:motion-pause', stopAutoplay);
  window.addEventListener('viewport:motion-resume', startAutoplay);
  sliderReducedMotion.addEventListener('change', startAutoplay);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      sliderVisible = Boolean(entries[0]?.isIntersecting);
      startAutoplay();
    }, { threshold: .01 }).observe(root);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));
  root.addEventListener('mouseenter', () => { isHovering = true; });
  root.addEventListener('mouseleave', () => { isHovering = false; });

  // click-and-drag / touch swipe navigation
  let dragStartX = 0, dragging = false, dragMoved = false;
  track.addEventListener('mousedown', (e) => { dragStartX = e.clientX; dragging = true; dragMoved = false; isHovering = true; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - dragStartX) > 6) dragMoved = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 50) {
      Array.from(slides).forEach(s => s.style.pointerEvents = 'none');
      if (dx < 0) goTo(index + 1); else goTo(index - 1);
      setTimeout(() => Array.from(slides).forEach(s => s.style.pointerEvents = ''), 50);
    }
    setTimeout(() => { isHovering = false; }, 50);
  });
  track.addEventListener('touchstart', (e) => {
    dragging = e.touches.length === 1;
    isHovering = dragging;
    if (dragging) dragStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) { dragging = false; isHovering = false; }
  }, { passive: true });
  track.addEventListener('touchcancel', () => { dragging = false; isHovering = false; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.changedTouches[0].clientX - dragStartX;
    if (Math.abs(dx) > 40) { if (dx < 0) goTo(index + 1); else goTo(index - 1); }
    isHovering = false;
  });

  // keyboard arrow navigation while this carousel is hovered
  window.addEventListener('keydown', (e) => {
    if (!isHovering) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
  });

  goTo(0);
  startAutoplay();
}
initSlider('testimonial-slider-1');

// Technology stack marquee — hover pause plus direct drag control
(function initTechMarquee() {
  const wrap = document.getElementById('tech-marquee');
  const track = wrap?.querySelector('.marquee-track');
  if (!wrap || !track) return;
  let dragging = false;
  let lastX = 0;
  let offset = 0;

  const setOffset = () => track.style.setProperty('--tech-marquee-offset', offset + 'px');
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('is-dragging');
  };

  wrap.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || document.body.classList.contains('is-zoomed')) { endDrag(); return; }
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    wrap.classList.add('is-dragging');
    wrap.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  wrap.addEventListener('pointermove', event => {
    if (!dragging) return;
    offset += event.clientX - lastX;
    lastX = event.clientX;
    setOffset();
    event.preventDefault();
  });
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);
  wrap.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('viewport:motion-pause', endDrag);
})();

// Industries marquee — continuous auto-scroll, pauses on hover, drag/fling with momentum
(function initIndustryMarquee() {
  const wrap = document.getElementById('industry-marquee-1');
  const track = document.getElementById('industry-marquee-track');
  if (!wrap || !track) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = wrap.parentElement.querySelector('.im-controls');
  const prevBtn = controls && controls.querySelector('.im-prev');
  const nextBtn = controls && controls.querySelector('.im-next');

  let x = 0;
  let setWidth = 0;
  const cardCount = 7;
  let cardStep = 282;
  function measure() {
    setWidth = track.scrollWidth / 2;
    const first = track.children[0];
    if (first) {
      const gapPx = parseFloat(getComputedStyle(track).gap) || 22;
      cardStep = first.getBoundingClientRect().width + gapPx;
    }
  }
  measure();
  window.addEventListener('viewport:resize-end', () => {
    measure();
    startFrame();
  });

  const dotsWrap = document.getElementById('im-dots');
  let dots = [];
  if (dotsWrap) {
    for (let i = 0; i < cardCount; i++) {
      const d = document.createElement('button');
      d.className = 'im-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Jump to industry ' + (i + 1));
      d.addEventListener('click', () => { x = -i * cardStep; paused = true; apply(); startFrame(); setTimeout(() => { paused = false; startFrame(); }, 1600); });
      dotsWrap.appendChild(d);
    }
    dots = Array.from(dotsWrap.children);
  }
  function updateDots() {
    if (!dots.length || !setWidth) return;
    const pos = ((-x % setWidth) + setWidth) % setWidth;
    const idx = Math.round(pos / cardStep) % cardCount;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  let paused = false;
  let dragging = false, dragMoved = false, suppressClick = false;
  let dragStartX = 0, dragStartTx = 0, lastX = 0, lastT = 0, vx = 0;
  let marqueeVisible = true;
  let frameRunning = false;
  let lastFrameTime = 0;
  let appliedX = null;

  function apply() {
    if (!setWidth) return;
    if (x <= -setWidth) x += setWidth;
    if (x > 0) x -= setWidth;
    if (x === appliedX) return;
    appliedX = x;
    track.style.transform = 'translateX(' + x + 'px)';
    updateDots();
  }

  function frame(now) {
    if (!marqueeVisible || document.hidden || document.body.classList.contains('motion-paused')) {
      frameRunning = false;
      return;
    }
    const step = lastFrameTime ? Math.min((now - lastFrameTime) / (1000 / 60), 2) : 1;
    lastFrameTime = now;
    const autoSpeed = reducedMotion.matches ? 0 : .55;
    if (!dragging) {
      if (paused) { vx *= 0.9; } else { vx += (-autoSpeed - vx) * 0.06; }
      x += vx * step;
    }
    apply();
    if (!dragging && (paused || reducedMotion.matches) && Math.abs(vx) < .01) {
      frameRunning = false;
      return;
    }
    requestAnimationFrame(frame);
  }
  function startFrame() {
    if (frameRunning || !marqueeVisible || document.hidden || document.body.classList.contains('motion-paused')) return;
    frameRunning = true;
    lastFrameTime = 0;
    requestAnimationFrame(frame);
  }
  window.addEventListener('viewport:motion-resume', startFrame);
  reducedMotion.addEventListener('change', startFrame);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      marqueeVisible = Boolean(entries[0]?.isIntersecting);
      if (marqueeVisible) { measure(); startFrame(); }
    }, { threshold: 0.01 }).observe(wrap);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && marqueeVisible) startFrame();
  });

  wrap.addEventListener('mouseenter', () => { paused = true; });
  wrap.addEventListener('mouseleave', () => { paused = false; startFrame(); });

  wrap.addEventListener('pointerdown', e => {
    if (e.isPrimary === false || document.body.classList.contains('is-zoomed')) { endDrag(); return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; wrap.classList.add('grabbing');
    startFrame();
    dragMoved = false;
    dragStartX = e.clientX; dragStartTx = x; lastX = e.clientX; lastT = performance.now(); vx = 0;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 6) dragMoved = true;
    x = dragStartTx + dx;
    const now = performance.now(); const dt = Math.max(now - lastT, 1);
    vx = (e.clientX - lastX) / dt * 16; lastX = e.clientX; lastT = now;
    apply();
    e.preventDefault();
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false; wrap.classList.remove('grabbing');
    if (dragMoved) {
      suppressClick = true;
      paused = true;
      window.setTimeout(() => { suppressClick = false; paused = false; startFrame(); }, 850);
    }
    startFrame();
  }
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);
  wrap.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('viewport:motion-pause', endDrag);
  wrap.addEventListener('click', e => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClick = false;
  }, true);

  if (prevBtn) prevBtn.addEventListener('click', () => { x += 280; paused = true; apply(); startFrame(); setTimeout(() => { paused = false; startFrame(); }, 1600); });
  if (nextBtn) nextBtn.addEventListener('click', () => { x -= 280; paused = true; apply(); startFrame(); setTimeout(() => { paused = false; startFrame(); }, 1600); });

  startFrame();
})();

// Subtle tilt on hover for glass cards
const tiltSelector = '.cap-card, .service-tile, .industry-card, .wide-card';
const tiltCards = document.querySelectorAll(tiltSelector);
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
if (tiltCards.length && !isTouchDevice) {
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (!magneticPointer.matches || document.body.classList.contains('motion-paused')) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rotateX = (0.5 - py) * 5;
      const rotateY = (px - 0.5) * 5;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// Flip cards become a deliberate tap-to-reveal interaction on touch screens.
// This avoids the duplicated front/back state that mobile browsers can render
// during a 3D hover flip.
const touchFlipCards = document.querySelectorAll('.flip-card');
const isTouchLayout = () => window.matchMedia('(max-width: 1040px) and (hover: none), (max-width: 1040px) and (pointer: coarse)').matches;
if (touchFlipCards.length) {
  touchFlipCards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    const toggleFlip = () => {
      if (!isTouchLayout()) return;
      const open = card.classList.toggle('is-flipped');
      card.setAttribute('aria-expanded', String(open));
    };
    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', (event) => {
      if (!isTouchLayout() || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      toggleFlip();
    });
  });
  window.addEventListener('viewport:resize-end', () => {
    if (isTouchLayout()) return;
    touchFlipCards.forEach((card) => {
      card.classList.remove('is-flipped');
      card.setAttribute('aria-expanded', 'false');
    });
  });
}

// Ripple / haptic click feedback on buttons
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 1.8;
    ripple.style.cssText = `position:absolute; border-radius:50%; pointer-events:none; width:${size}px; height:${size}px; left:${e.clientX - rect.left - size / 2}px; top:${e.clientY - rect.top - size / 2}px; background:rgba(255,255,255,0.45); transform:scale(0); opacity:1; transition:transform .6s cubic-bezier(.22,.61,.36,1), opacity .6s ease;`;
    this.appendChild(ripple);
    requestAnimationFrame(() => { ripple.style.transform = 'scale(1)'; ripple.style.opacity = '0'; });
    setTimeout(() => ripple.remove(), 650);
  });
});

// Contact form qualification and routing
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const contactStatus = document.getElementById('contact-status');
if (contactForm && submitBtn) {
  const bdEmail = 'info@ingenuitysys.com';
  const calendlyUrl = 'https://calendly.com/junaidparacha-ingenuitysys';
  // Keep provider URLs server-side. The API router forwards this payload to the
  // configured webhook and can route it to email, Calendly, or both.
  const contactWebhookUrl = String(window.INGENUITY_ROUTER_ENDPOINT || '/api/router/contact').trim();
  const personalEmailDomains = new Set([
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
    'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com',
    'aol.com', 'gmx.com', 'mail.com', 'yandex.com', 'msn.com'
  ]);
  const sendToRouter = async (payload) => {
    if (!contactWebhookUrl) return false;
    try {
      const response = await fetch(contactWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!response.ok) return false;
      const data = await response.json().catch(() => ({}));
      return data.ok === true;
    } catch (error) {
      return false;
    }
  };
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const company = document.getElementById('company').value.trim();
    const budget = document.getElementById('budget').value;
    const interest = document.getElementById('interest').value;
    const message = document.getElementById('message')?.value.trim() || '';
    const domain = email.includes('@') ? email.split('@').pop().toLowerCase() : '';
    const isBusinessEmail = Boolean(domain && !personalEmailDomains.has(domain));
    const budgetLabel = document.getElementById('budget').selectedOptions[0]?.textContent || budget;
    const interestLabel = document.getElementById('interest').selectedOptions[0]?.textContent || interest;
    const webhookPayload = {
      source: 'ingenuity-systems-website',
      submittedAt: new Date().toISOString(),
      name,
      companyName: company,
      email,
      emailType: isBusinessEmail ? 'business' : 'personal',
      estimatedBudgetTier: budget,
      estimatedBudgetLabel: budgetLabel,
      interestArea: interest,
      interestAreaLabel: interestLabel,
      message,
      route: 'webhook-calendly',
      calendlyUrl,
      page: window.location.href
    };
    submitBtn.classList.add('success');
    submitBtn.disabled = true;
    const webhookSent = await sendToRouter(webhookPayload);
    submitBtn.disabled = false;
    if (webhookSent) {
      if (contactStatus) contactStatus.textContent = 'Thanks — your details were sent. Opening Calendly…';
      setTimeout(() => { window.location.href = calendlyUrl; }, 850);
    } else {
      if (contactStatus) contactStatus.textContent = 'We could not submit your details right now. Please try again.';
      submitBtn.classList.remove('success');
    }
    setTimeout(() => { submitBtn.classList.remove('success'); }, 3200);
  });
}

// Animated stat counters (count up when scrolled into view)
const statItems = document.querySelectorAll('.stat-item .num');
if (statItems.length) {
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const raw = el.textContent.trim();
      const match = raw.match(/^([\d.]+)(.*)$/);
      if (!match) { statObserver.unobserve(el); return; }
      const target = parseFloat(match[1]);
      const suffix = match[2] || '';
      let current = 0;
      const duration = 1300;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = target * eased;
        el.textContent = Math.floor(current) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      }
      requestAnimationFrame(tick);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  statItems.forEach(el => statObserver.observe(el));
}

// Industry spotlight: tab-triggered scene morph
const indMorph = document.getElementById('ind-morph');
if (indMorph) {
  const tabs = indMorph.querySelectorAll('.ind-tab');
  const panels = indMorph.querySelectorAll('.ind-scene-panel');

  function animateStats(panel) {
    panel.querySelectorAll('.ind-stat-num').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 900;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = target * eased;
        el.textContent = (Number.isInteger(target) ? Math.floor(val) : val.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetKey = tab.dataset.target;
      if (tab.classList.contains('active')) return;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(p => {
        const match = p.dataset.panel === targetKey;
        p.classList.toggle('active', match);
        if (match) animateStats(p);
      });
    });
  });

  const initialObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateStats(indMorph.querySelector('.ind-scene-panel.active'));
        initialObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  initialObserver.observe(indMorph);
}
// Keep Work aligned with the base site while exposing the recent work content.
(function ensureWorkNavigation() {
  if (document.documentElement.dataset.canonicalHeader === 'true') return;
  const nav = document.querySelector('.nav-links');
  const headerEl = document.querySelector('header');
  if (!nav || !headerEl) return;

  let item = nav.querySelector('[data-menu="work"]') || nav.querySelector('.work-nav-item');
  if (!item) {
    item = document.createElement('li');
    const careers = Array.from(nav.children).find((entry) => entry.textContent.trim() === 'Careers');
    nav.insertBefore(item, careers || nav.lastElementChild);
  }
  item.classList.remove('work-nav-item');
  item.classList.add('has-dropdown');
  item.dataset.menu = 'work';

  const link = item.querySelector('a') || document.createElement('a');
  const siteBase = /\/(pages|projects|case-studies)(\/|$)/.test(window.location.pathname) ? '../' : '';
  link.className = 'top-link';
  link.href = siteBase + 'work.html';
  link.innerHTML = 'Work <span class="caret"></span>';
  link.setAttribute('aria-haspopup', 'true');
  link.setAttribute('aria-expanded', 'false');
  if (/\/(work\.html|projects|case-studies)(\/|$)/.test(window.location.pathname)) link.classList.add('active');
  if (!link.parentElement) item.appendChild(link);

  let megaWrap = headerEl.querySelector('.mega-wrap');
  if (!megaWrap) {
    megaWrap = document.createElement('div');
    megaWrap.className = 'mega-wrap';
    headerEl.appendChild(megaWrap);
  }
  let panel = megaWrap.querySelector('[data-panel="work"]');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'mega-dropdown mega-work';
    panel.dataset.panel = 'work';
    panel.innerHTML = '<div class="mega-inner"><div class="mega-col"><ul><li><a class="mega-col-title" href="' + siteBase + 'projects/index.html">Projects</a></li></ul></div><div class="mega-col"><ul><li><a class="mega-col-title" href="' + siteBase + 'case-studies/index.html">Case Studies</a></li></ul></div></div>';
    megaWrap.appendChild(panel);
  }

  if (item.dataset.workBound === 'true') return;
  item.dataset.workBound = 'true';
  let closeTimer = null;
  const open = () => { clearTimeout(closeTimer); megaWrap.dataset.active = 'work'; headerEl.classList.add('menu-open'); link.setAttribute('aria-expanded', 'true'); };
  const close = () => { clearTimeout(closeTimer); closeTimer = setTimeout(() => { headerEl.classList.remove('menu-open'); link.setAttribute('aria-expanded', 'false'); }, 140); };
  item.addEventListener('mouseenter', open);
  item.addEventListener('mouseleave', close);
  panel.addEventListener('mouseenter', open);
  panel.addEventListener('mouseleave', close);
})();
