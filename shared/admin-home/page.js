function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(value ?? '');
}

function encodePath(path) {
  // Asegura compatibilidad con rutas que contienen espacios/acentos.
  // encodeURI mantiene '/', ':', '?', '=' y '&' sin romper URLs.
  return encodeURI(String(path ?? '').trim());
}

function navigateTo(path) {
  const href = encodePath(path);
  if (!href) return;
  window.location.href = href;
}

function setActiveCard(card) {
  const cards = Array.from(document.querySelectorAll('.admin-card'));
  cards.forEach(btn => {
    const isActive = btn === card;
    btn.classList.toggle('ring-2', isActive);
    btn.classList.toggle('ring-brand-800', isActive);
  });
}

function bindCardNavigation() {
  const cards = Array.from(document.querySelectorAll('.admin-card'));

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const href = card.dataset.href;
      setActiveCard(card);
      setText('status', 'Redirigiendo…');
      navigateTo(href);
    });

    card.addEventListener('mouseenter', () => setActiveCard(card));
    card.addEventListener('focus', () => setActiveCard(card));
  });

  // Estado inicial
  setText('status', 'Selecciona un módulo para continuar.');
}

bindCardNavigation();
