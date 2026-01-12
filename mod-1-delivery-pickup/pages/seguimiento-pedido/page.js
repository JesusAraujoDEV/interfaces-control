window.goBackToOrders = function goBackToOrders() {
  const u = new URL('../pedidos/index.html', window.location.href);
  u.search = window.location.search;
  window.location.href = u.toString();
};
