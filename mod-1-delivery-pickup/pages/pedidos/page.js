window.goTo = function goTo(relPath) {
  const u = new URL(relPath, window.location.href);
  // Conservar el modo (delivery/pickup) si viene desde la pantalla inicial
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode) u.searchParams.set('mode', mode);
  window.location.href = u.toString();
};
