import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

function getOrderIdFromPath() {
  const m = window.location.pathname.match(/^\/admin\/dp\/orders\/(.+)$/);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return '12345';
}

export async function init(params = {}) {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  if (!window.__dpSpaRouter && typeof window.goTo !== 'function') {
    window.goTo = function goTo(pathOrUrl) {
      const u = new URL(pathOrUrl, window.location.href);
      u.search = window.location.search;
      window.location.href = u.toString();
    };
  }

  const id = params.orderId || getOrderIdFromPath();
  const titleEl = document.getElementById('orderTitle');
  if (titleEl) titleEl.textContent = `Pedido #${id}`;
}

if (!window.__dpSpaRouter) {
  window.addEventListener('DOMContentLoaded', () => {
    init();
  }, { once: true });
}
