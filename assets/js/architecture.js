(() => {
  'use strict';

  const init = () => {
    const graph = document.getElementById('hc-graph-svg');
    const inspector = document.getElementById('hc-node-inspector');
    const kicker = document.getElementById('hc-node-kicker');
    const title = document.getElementById('hc-node-title');
    const copy = document.getElementById('hc-node-copy');
    const hint = inspector?.querySelector('.hc-node-inspector-hint');
    if (!graph || !inspector || !kicker || !title || !copy) return;

    const nodes = Array.from(graph.querySelectorAll('.svg-node'));
    if (!nodes.length) return;

    const select = (node) => {
      if (!node || !nodes.includes(node)) return;
      nodes.forEach((n) => {
        const active = n === node;
        n.classList.toggle('active', active);
        n.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      inspector.dataset.group = node.dataset.group || 'intel';
      kicker.textContent = node.dataset.kicker || 'Interactive architecture';
      title.textContent = node.dataset.title || 'System node';
      copy.textContent = node.dataset.copy || 'Select another node to inspect this part of the architecture.';
      if (hint) hint.textContent = `Selected · ${node.dataset.title || 'Node'}`;

      inspector.classList.remove('is-updating');
      void inspector.offsetWidth;
      inspector.classList.add('is-updating');
    };

    // Event delegation is more reliable for SVG child elements than binding only to <g>.
    const resolveNode = (target) => target?.closest?.('.svg-node');
    graph.addEventListener('click', (event) => {
      const node = resolveNode(event.target);
      if (node) select(node);
    });
    graph.addEventListener('pointerup', (event) => {
      if (event.pointerType === 'touch') {
        const node = resolveNode(event.target);
        if (node) select(node);
      }
    });

    nodes.forEach((node, index) => {
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      node.setAttribute('aria-label', `${node.dataset.title || 'System node'} — ${node.dataset.kicker || 'view details'}`);
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(node);
          return;
        }
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          const next = nodes[(index + 1) % nodes.length];
          next.focus();
          select(next);
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          const prev = nodes[(index - 1 + nodes.length) % nodes.length];
          prev.focus();
          select(prev);
        }
      });
    });

    select(graph.querySelector('.svg-node.active') || nodes[0]);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
