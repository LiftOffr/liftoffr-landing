/* Progressive enhancement: content and navigation work without motion or JS. */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  function enter(node, delay, duration) {
    if (reduced.matches || !node.animate) return;
    const animation = node.animate([
      {opacity: 0, transform: 'translateY(18px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: duration || 650, delay: delay || 0, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards'});
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  }
  reduced.addEventListener('change', () => {
    if (reduced.matches) running.forEach(animation => animation.cancel());
  });
  document.querySelectorAll('.lo-hero-copy > *, .lo-portrait').forEach((node, i) => enter(node, Math.min(i * 55, 275)));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        enter(entry.target);
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.08});
    document.querySelectorAll('.lo-homepage .lo-section > h2, .lo-offer, .lo-story > *, .lo-evidence').forEach(node => observer.observe(node));
  }
  const menu = document.querySelector('.lo-menu');
  if (menu) {
    menu.addEventListener('toggle', () => {if (menu.open) enter(menu.querySelector('div'), 0, 180);});
    document.addEventListener('click', event => {if (!menu.contains(event.target)) menu.open = false;});
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {menu.open = false; menu.querySelector('summary').focus();}
    });
  }
  document.querySelectorAll('.lo-desktop-links a, .lo-menu a').forEach(link => {
    if (link.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '')) link.setAttribute('aria-current', 'page');
  });
  const picker = document.querySelector('.lo-path-picker');
  if (!picker) return;
  const descriptions = {
    free: 'Start with the free community, public Score and indicator explanations. No purchase needed.',
    plan: 'Explore the $29 Plan preview for a focused document and worksheet. You can inspect it before buying.',
    system: 'Explore the Cycle System for structured lessons on indicators, risk and building your own framework.'
  };
  picker.hidden = false;
  picker.addEventListener('click', event => {
    const button = event.target.closest('button[data-path]');
    if (!button || !descriptions[button.dataset.path]) return;
    const choice = button.dataset.path;
    picker.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelectorAll('[data-offer]').forEach(card => card.classList.toggle('lo-selected', card.dataset.offer === choice));
    document.getElementById('lo-path-description').textContent = descriptions[choice];
  });
})();
