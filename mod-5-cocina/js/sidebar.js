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
