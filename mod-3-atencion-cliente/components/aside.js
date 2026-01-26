// Archivo: mod-3-atencion-cliente/components/aside.js
// Componente reutilizable para el Aside del panel Admin en Atención al Cliente

(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('admin-sidebar-container');
    if (!container) return;

    const asideMarkup = `
      <aside id="sidebar" class="fixed inset-y-0 left-0 z-30 w-72 md:w-80 bg-white border-r border-gray-200 flex flex-col justify-between h-full shadow-lg md:shadow-sm transform -translate-x-full md:translate-x-0 md:relative sidebar-transition flex-shrink-0 overflow-y-auto no-scrollbar">
        <div>
          <div class="p-6 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center shrink-0">
                <img src="/assets/charlotte_logo.png" alt="Charlotte Bistró" class="w-9 h-9 object-contain" loading="eager">
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold text-slate-900 leading-5">Atención al Cliente</div>
                <div class="text-xs text-slate-500 leading-4 truncate">Dashboard Operativo</div>
              </div>
              <button onclick="toggleSidebar && toggleSidebar()" class="md:hidden ml-auto text-gray-400 hover:text-gray-600">
                <span class="material-icons-outlined">close</span>
              </button>
            </div>
            <a href="/admin" class="mt-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
              <span aria-hidden="true">←</span>
              <span>Volver a Admin</span>
            </a>
          </div>

          <nav class="px-3 pb-4 space-y-1 mt-2">
            <a href="./index.html" id="nav-home" title="Inicio" class="group flex items-start gap-3 rounded-xl px-4 py-3 transition-colors border">
              <div class="mt-0.5 nav-icon text-brand-800">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-[22px] h-[22px]"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"></path></svg>
              </div>
              <div class="min-w-0 atc-nav-text">
                <div class="text-base font-semibold leading-6">Inicio</div>
                <div class="text-sm text-slate-500 leading-5 truncate atc-nav-desc">Resumen</div>
              </div>
            </a>

            <a href="./tables.html" id="nav-tables" class="group flex items-start gap-3 rounded-xl px-4 py-3 transition-colors border">
              <div class="mt-0.5 nav-icon"><span class="material-icons-outlined text-[22px]">table_restaurant</span></div>
              <div class="min-w-0">
                <div class="text-base font-semibold leading-6">Inventario Mesas</div>
                <div class="text-sm text-gray-500 leading-5 truncate">Gestión de mesas</div>
              </div>
            </a>

            <a href="./tables-maitre.html" id="nav-tables-maitre" class="group flex items-start gap-3 rounded-xl px-4 py-3 transition-colors border">
              <div class="mt-0.5 nav-icon"><span class="material-icons-outlined text-[22px]">event_seat</span></div>
              <div class="min-w-0">
                <div class="text-base font-semibold leading-6">Mesas (Maitre)</div>
                <div class="text-sm text-gray-500 leading-5 truncate">Operación en sala</div>
              </div>
            </a>

            <a href="./sessions.html" id="nav-sessions" class="group flex items-start gap-3 rounded-xl px-4 py-3 transition-colors border">
              <div class="mt-0.5 nav-icon"><span class="material-icons-outlined text-[22px]">people_alt</span></div>
              <div class="min-w-0">
                <div class="text-base font-semibold leading-6">Monitor Sesiones</div>
                <div class="text-sm text-gray-500 leading-5 truncate">Actividad en mesas</div>
              </div>
            </a>

            <a href="./requests.html" id="nav-requests" class="group flex items-start gap-3 rounded-xl px-4 py-3 transition-colors border">
              <div class="relative mt-0.5 nav-icon">
                <span class="material-icons-outlined text-[22px]">notifications_active</span>
                <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              </div>
              <div class="min-w-0">
                <div class="text-base font-semibold leading-6">Solicitudes</div>
                <div class="text-sm text-gray-500 leading-5 truncate">Llamados y quejas</div>
              </div>
            </a>
          </nav>
        </div>

        <div class="p-4 border-t border-gray-100">
          <a href="/seguridad/login" onclick="return logout ? logout() : true" class="flex items-center gap-3 text-red-500 hover:bg-red-50 px-5 py-3 rounded-xl w-full transition-colors text-base font-semibold">
            <span class="material-icons-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </a>
        </div>
      </aside>
    `;

    container.innerHTML = asideMarkup;

    // Gestionar estado activo vía data-active (home|tables|tables-maitre|sessions|requests)
    const path = (window.location && window.location.pathname || '').toLowerCase();
    let active = (container.getAttribute('data-active') || '').toLowerCase();
    if (!active) {
      if (path.includes('/sessions')) active = 'sessions';
      else if (path.includes('/requests')) active = 'requests';
      else if (path.includes('tables-maitre')) active = 'tables-maitre';
      else if (path.endsWith('/index.html') || /\/admin\/?$/.test(path)) active = 'home';
      else active = 'tables';
    }
    const links = {
      home: document.getElementById('nav-home'),
      tables: document.getElementById('nav-tables'),
      'tables-maitre': document.getElementById('nav-tables-maitre'),
      sessions: document.getElementById('nav-sessions'),
      requests: document.getElementById('nav-requests')
    };

    const activeClasses = ['bg-brand-50','text-brand-800','border-brand-50'];
    const inactiveClasses = ['text-slate-700','hover:bg-slate-50','border-transparent'];
    const iconActiveClasses = ['text-brand-800'];
    const iconInactiveClasses = ['text-slate-500','group-hover:text-slate-700'];

    Object.entries(links).forEach(([key, el]) => {
      if (!el) return;
      // Reset base classes
      el.classList.remove(...activeClasses, ...inactiveClasses);
      el.classList.add('group','flex','items-start','gap-3','rounded-xl','px-4','py-3','transition-colors','border');
      if (key === active) {
        el.classList.add(...activeClasses);
      } else {
        el.classList.add(...inactiveClasses);
      }

      // Icon color behavior like Delivery module
      const iconEl = el.querySelector('.nav-icon');
      if (iconEl) {
        iconEl.classList.remove(...iconActiveClasses, ...iconInactiveClasses);
        if (key === active) iconEl.classList.add(...iconActiveClasses);
        else iconEl.classList.add(...iconInactiveClasses);
      }
    });

    // Navegación suave entre vistas: fade-out antes de cambiar de página
    function smoothNavigate(href) {
      const main = document.getElementById('main-content');
      if (main) {
        main.classList.add('page-leave');
        setTimeout(() => { window.location.href = href; }, 350);
      } else {
        window.location.href = href;
      }
    }

    ['nav-home','nav-tables','nav-tables-maitre','nav-sessions','nav-requests'].forEach(id => {
      const a = document.getElementById(id);
      if (!a) return;
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const href = a.getAttribute('href');
        smoothNavigate(href);
      });
    });
  });
})();
