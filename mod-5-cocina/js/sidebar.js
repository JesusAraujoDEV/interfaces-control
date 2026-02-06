// Sidebar toggle for mobile/tablet off-canvas
function initSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  let overlay = document.querySelector('.sidebar-overlay');

  function ensureOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }
  }

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('sidebar--open');
    ensureOverlay();
    overlay.classList.add('sidebar-overlay--visible');
    document.body.style.overflow = 'hidden';
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('sidebar--open');
    if (overlay) overlay.classList.remove('sidebar-overlay--visible');
    document.body.style.overflow = '';
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('sidebar--open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }
  ensureOverlay();
  if (overlay) overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // Close sidebar when resizing to desktop
  function onResize() {
    if (window.innerWidth > 768) {
      closeSidebar();
    }
  }
  window.addEventListener('resize', onResize);

  // Initialize Lucide icons for the toggle if needed
  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', initSidebarToggle);

document.addEventListener('DOMContentLoaded', () => {
  // Apartado para logica de permisos
  let mostrarKds = false;
  let mostrarDespacho = false;
  let mostrarRecetas = false;
  let mostrarInventario = false;
  let mostrarPersonal = false;
  let mostrarActivos = false;
  let mostrarHistorial = false
  const administrative_user = JSON.parse(localStorage.getItem('administrative_user'));
  const permissions = administrative_user ? administrative_user.permissions : [];

  if (permissions.includes('CocinaChef_view')) {
    mostrarKds = true;
    mostrarRecetas = true;
    mostrarInventario = true;
    mostrarPersonal = true;
    mostrarActivos = true;
    mostrarHistorial = true;
  }
  if (permissions.includes('CocinaCocinero_view')) {
    mostrarKds = true;
  }
  if (permissions.includes('CocinaMesero_view')) {
    mostrarDespacho = true;
  }
  if (permissions.includes('AtcMaitre_view')) {
    mostrarDespacho = true;
    mostrarPersonal = true;
  }
  if (permissions.includes('AtcSupervisorSala_view')) {
    mostrarPersonal = true;
  }
  if (administrative_user && administrative_user.isAdmin) {
    mostrarKds = true;
    mostrarDespacho = true;
    mostrarRecetas = true;
    mostrarInventario = true;
    mostrarPersonal = true;
    mostrarActivos = true;
    mostrarHistorial = true;
  }

  const nav = document.querySelector('.sidebar__nav');

  // Seleccionamos cada enlace específicamente por su destino (href)
  const linkDashboard = nav.querySelector('a[href="index.html"]');
  const linkKDS = nav.querySelector('a[href="kds.html"]');
  const linkDespacho = nav.querySelector('a[href="Despacho.html"]');
  const linkRecetas = nav.querySelector('a[href="rec-pro.html"]');
  const linkInventario = nav.querySelector('a[href="inv.html"]');
  const linkActivos = nav.querySelector('a[href="activos.html"]');
  const linkPersonal = nav.querySelector('a[href="personal.html"]');
  const linkHistorial = nav.querySelector('a[href="historial_pedidos.html"]');

  // Ocultar enlaces según permisos
  if (!mostrarKds) {
    if (linkKDS) linkKDS.remove();
  }
  if (!mostrarDespacho) {
    if (linkDespacho) linkDespacho.remove();
  }
  if (!mostrarRecetas) {
    if (linkRecetas) linkRecetas.remove();
  }
  if (!mostrarInventario) {
    if (linkInventario) linkInventario.remove();
  }
  if (!mostrarActivos) {
    if (linkActivos) linkActivos.remove();
  }
  if (!mostrarPersonal) {
    if (linkPersonal) linkPersonal.remove();
  }
  if (!mostrarHistorial) {
    if (linkHistorial) linkHistorial.remove();
  }

});