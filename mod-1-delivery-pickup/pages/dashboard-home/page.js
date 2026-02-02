import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

export async function init() {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }
}

if (!window.__dpSpaRouter) {
  window.addEventListener('DOMContentLoaded', () => {
    init();
  }, { once: true });
}

