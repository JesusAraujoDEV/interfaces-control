import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

export async function init() {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  // Back-compat for older markup calling goTo().
  if (!window.__dpSpaRouter && typeof window.goTo !== 'function') {
    window.goTo = function goTo(pathOrUrl) {
      const u = new URL(pathOrUrl, window.location.href);
      const mode = new URLSearchParams(window.location.search).get('mode');
      if (mode && !u.searchParams.has('mode')) u.searchParams.set('mode', mode);
      window.location.href = u.toString();
    };
  }
}

if (!window.__dpSpaRouter) {
  window.addEventListener('DOMContentLoaded', () => {
    init();
  }, { once: true });
}
