(function(){
  const params = new URLSearchParams(location.search);
  const route = params.get('figmaRoute');
  if (!route) return;

  function applyRoute(){
    const parts = route.split('-');
    const page = parts[0];
    const value = parts.slice(1).join('-');
    if (page === 'overview') window.showOverviewSection?.(value || 'basics', false);
    if (page === 'check') window.showCheckTarget?.(value || 'quick', false);
    if (page === 'handbook') window.showHandbookType?.(Number(value) || 1, false);
    if (page === 'compare') window.showCompareSection?.(value || 'glance', false);
    if (page === 'sharing') window.showSharingTopic?.(Math.max(0, (Number(value) || 1) - 1), false);
    if (page === 'myspace') window.showMySpaceSection?.(value || 'dashboard', false);
    document.querySelector('.page-panel.active')?.scrollTo?.(0, 0);
  }

  if (document.readyState === 'complete') applyRoute();
  else window.addEventListener('load', () => setTimeout(applyRoute, 50), { once: true });
})();
