window.goTo = function goTo(relPath) {
  const u = new URL(relPath, window.location.href);
  u.search = window.location.search;
  window.location.href = u.toString();
};
