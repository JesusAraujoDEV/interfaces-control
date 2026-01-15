import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

window.goTo = function goTo(pathOrUrl) {
  const u = new URL(pathOrUrl, window.location.href);
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode && !u.searchParams.has('mode')) u.searchParams.set('mode', mode);
  window.location.href = u.toString();
};

window.addEventListener('DOMContentLoaded', () => {
  initDpLayout();
  mountDpSidebar();
});
