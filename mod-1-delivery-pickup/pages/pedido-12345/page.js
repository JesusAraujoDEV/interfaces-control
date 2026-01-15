import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

function getOrderIdFromPath() {
  const m = window.location.pathname.match(/^\/admin\/dp\/orders\/(.+)$/);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return '12345';
}

window.goTo = function goTo(pathOrUrl) {
  const u = new URL(pathOrUrl, window.location.href);
  u.search = window.location.search;
  window.location.href = u.toString();
};

window.addEventListener('DOMContentLoaded', () => {
  initDpLayout();
  mountDpSidebar();

  const id = getOrderIdFromPath();
  const titleEl = document.getElementById('orderTitle');
  if (titleEl) titleEl.textContent = `Pedido #${id}`;
});
