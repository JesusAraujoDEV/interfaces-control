const NAV = [
  {
    key: "home",
    label: "Inicio",
    description: "Menú principal de KPIs",
    href: "/mod-2-kpis/src/public/index.html",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Resumen de indicadores",
    href: "/mod-2-kpis/src/public/dashboard.html",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"/></svg>`,
  },
  {
    key: "chef",
    label: "Panel Chef",
    description: "Platos más vendidos",
    href: "/mod-2-kpis/src/public/chef-dashboard.html",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  },
  {
    key: "reportes",
    label: "Reportes",
    description: "Business Intelligence",
    href: "/mod-2-kpis/src/public/bussines-intelligence.html",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>`,
  },
  {
    key: "ventas",
    label: "Ventas",
    description: "Graficación de ventas",
    href: "/mod-2-kpis/src/public/ventas.html",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0Z"/><path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>`,
  },
  {
    key: "eficiencia",
    label: "Eficiencia",
    description: "Tiempos operativos",
    href: "/mod-2-kpis/src/public/eficiencia-operacional.html",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  {
    key: 'alertas',
    label: 'Alertas',
    description: 'Historial de avisos',
    href: '#',
    onclick: 'showAlertsHistory()',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
  }
];

function resolveActiveKey(pathname) {
  if (pathname.includes("index.html") || pathname.endsWith("/mod-2-kpis/src/public/")) return "home";
  if (pathname.includes("chef-dashboard.html")) return "chef";
  if (pathname.includes("dashboard.html")) return "dashboard";
  if (pathname.includes("bussines-intelligence.html")) return "reportes";
  if (pathname.includes("ventas.html")) return "ventas";
  if (pathname.includes("eficiencia-operacional.html")) return "eficiencia";
  return "home";
}

function elFromHTML(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

const KPI_SIDEBAR_STORAGE_KEY = "kpi_sidebar_collapsed";
const KPI_SHELL_COLLAPSED_CLASS = "kpi-sidebar-collapsed";
const KPI_SHELL_MOBILE_OPEN_CLASS = "kpi-sidebar-mobile-open";
const KPI_TOGGLE_FLOATING_CLASS = "kpi-toggle-floating";

function isMobileViewport() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

function readCollapsedPref() {
  try {
    return localStorage.getItem(KPI_SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsedPref(value) {
  try {
    localStorage.setItem(KPI_SIDEBAR_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
}

function setCollapsed(shell, collapsed) {
  if (!shell) return;
  shell.classList.toggle(KPI_SHELL_COLLAPSED_CLASS, !!collapsed);
  syncKpiTogglePlacement(shell);
}

function setMobileOpen(shell, open) {
  if (!shell) return;
  shell.classList.toggle(KPI_SHELL_MOBILE_OPEN_CLASS, !!open);
  syncKpiTogglePlacement(shell);
}

function isSidebarOpen(shell) {
  if (!shell) return false;
  if (isMobileViewport())
    return shell.classList.contains(KPI_SHELL_MOBILE_OPEN_CLASS);
  return !shell.classList.contains(KPI_SHELL_COLLAPSED_CLASS);
}

function syncKpiTogglePlacement(shell) {
  const btn = document.getElementById("kpi-sidebar-toggle");
  if (!btn) return;

  const slot = document.getElementById("kpi-sidebar-toggle-slot");
  const open = isSidebarOpen(shell);

  if (open && slot) {
    if (btn.parentElement !== slot) slot.appendChild(btn);
    btn.classList.remove(KPI_TOGGLE_FLOATING_CLASS);
    btn.setAttribute("aria-expanded", "true");
  } else {
    if (btn.parentElement !== document.body) document.body.appendChild(btn);
    btn.classList.add(KPI_TOGGLE_FLOATING_CLASS);
    btn.setAttribute("aria-expanded", "false");
  }
}

function ensureKpiSidebarStyles() {
  if (document.getElementById("kpi-sidebar-styles")) return;

  const style = document.createElement("style");
  style.id = "kpi-sidebar-styles";
  style.textContent = `
    #kpi-shell { position: relative; }
    #kpi-sidebar {
      height: 100vh;
      overflow: auto;
      transition: width 180ms ease, transform 180ms ease;
      position: sticky;
      top: 0;
      align-self: flex-start;
    }

    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar { width: 4.5rem !important; }
    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar .kpi-sidebar-text,
    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar .kpi-nav-text,
    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar .kpi-nav-desc,
    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar .kpi-backlink-text,
    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar .kpi-footer-text { display: none !important; }
    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar .kpi-brand-row { justify-content: center; }
    #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar nav a { justify-content: center; }

    #kpi-backdrop { display: none; }
    @media (max-width: 1023px) {
      #kpi-sidebar { position: fixed; left: 0; top: 0; bottom: 0; transform: translateX(-110%); z-index: 60; box-shadow: 0 16px 40px rgba(0,0,0,.18); }
      #kpi-shell.${KPI_SHELL_MOBILE_OPEN_CLASS} #kpi-sidebar { transform: translateX(0); }
      #kpi-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 23, .45); z-index: 55; }
      #kpi-shell.${KPI_SHELL_MOBILE_OPEN_CLASS} #kpi-backdrop { display: block; }
      #kpi-shell.${KPI_SHELL_COLLAPSED_CLASS} #kpi-sidebar { width: 18rem !important; }
    }

    #kpi-sidebar-toggle.${KPI_TOGGLE_FLOATING_CLASS} {
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 70;
      width: auto;
      border-radius: 9999px;
    }
    @media (min-width: 1024px) {
      #kpi-sidebar-toggle.${KPI_TOGGLE_FLOATING_CLASS} { bottom: 18px; right: 18px; }
    }
    #kpi-sidebar-toggle-slot #kpi-sidebar-toggle {
      position: static;
      width: 100%;
      z-index: auto;
      border-radius: 0.75rem;
    }
  `;
  document.head.appendChild(style);
}

function ensureKpiSidebarControls() {
  const shell = document.getElementById("kpi-shell");
  if (!shell) return;

  ensureKpiSidebarStyles();

  if (!document.getElementById("kpi-backdrop")) {
    const backdrop = document.createElement("div");
    backdrop.id = "kpi-backdrop";
    shell.prepend(backdrop);
  }

  if (!document.getElementById("kpi-sidebar-toggle")) {
    const toggle = elFromHTML(`
      <button id="kpi-sidebar-toggle" type="button"
        class="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg backdrop-blur hover:bg-white"
        aria-label="Abrir/cerrar navegación"
        aria-expanded="false">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>
          </svg>
        </span>
      </button>
    `);
    toggle.classList.add(KPI_TOGGLE_FLOATING_CLASS);
    document.body.appendChild(toggle);
  }

  const btn = document.getElementById("kpi-sidebar-toggle");
  if (btn && btn.dataset.kpiBound !== "1") {
    btn.dataset.kpiBound = "1";
    btn.addEventListener("click", () => {
      const currentShell = document.getElementById("kpi-shell");
      if (!currentShell) return;
      if (isMobileViewport()) {
        const open = !currentShell.classList.contains(
          KPI_SHELL_MOBILE_OPEN_CLASS,
        );
        setMobileOpen(currentShell, open);
      } else {
        const next = !currentShell.classList.contains(
          KPI_SHELL_COLLAPSED_CLASS,
        );
        setCollapsed(currentShell, next);
        writeCollapsedPref(next);
      }
    });
  }

  if (!window.__kpiSidebarResizeBound) {
    window.__kpiSidebarResizeBound = true;
    window.addEventListener("resize", () => {
      const currentShell = document.getElementById("kpi-shell");
      if (!currentShell) return;
      syncKpiTogglePlacement(currentShell);
    });
  }

  syncKpiTogglePlacement(shell);
}

export function initKpiLayout() {
  const body = document.body;
  if (document.getElementById("kpi-shell")) return;

  body.classList.add("antialiased", "text-slate-900");

  const shell = document.createElement("div");
  shell.id = "kpi-shell";
  shell.className = "min-h-screen bg-brand-50 flex";

  const sidebarHost = document.createElement("aside");
  sidebarHost.id = "kpi-sidebar";
  sidebarHost.className = "w-72 shrink-0 border-r border-slate-200 bg-white";

  const main = document.createElement("div");
  main.id = "kpi-main";
  main.className = "flex-1 min-w-0";

  shell.appendChild(sidebarHost);
  shell.appendChild(main);

  body.prepend(shell);

  setCollapsed(shell, readCollapsedPref());
  setMobileOpen(shell, false);
  ensureKpiSidebarControls();

  const movable = Array.from(body.children).filter(
    (node) => node !== shell && node.tagName !== "SCRIPT",
  );
  for (const node of movable) {
    main.appendChild(node);
  }

  const padded = document.createElement("div");
  padded.className = "p-4 sm:p-6 lg:p-8";
  while (main.firstChild) padded.appendChild(main.firstChild);
  main.appendChild(padded);

  return { sidebarHost, mainContent: padded };
}

export function mountKpiSidebar() {
  const sidebarHost = document.getElementById("kpi-sidebar");
  if (!sidebarHost) return;

  const activeKey = resolveActiveKey(window.location.pathname);

  const existingToggle = document.getElementById("kpi-sidebar-toggle");
  if (existingToggle && sidebarHost.contains(existingToggle)) {
    document.body.appendChild(existingToggle);
  }

  sidebarHost.innerHTML = "";

  const header = elFromHTML(`
    <div class="p-5">
      <div class="flex items-center gap-3 kpi-brand-row">
        <div class="w-9 h-9 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center shrink-0">
            <img src="/assets/charlotte_logo.png" alt="Charlotte Bistró" class="w-8 h-8 object-contain" loading="eager">
        </div>
        <div class="min-w-0 kpi-sidebar-text">
          <div class="text-sm font-extrabold text-slate-900 leading-5">Indicadores y KPIs</div>
          <div class="text-xs text-slate-500 leading-4 truncate">Gestión de Negocio</div>
        </div>
      </div>
      <a href="/admin" class="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800">
        <span aria-hidden="true">←</span>
        <span class="kpi-backlink-text">Volver a Admin</span>
      </a>
    </div>
  `);

  const nav = document.createElement("nav");
  nav.className = "px-3 pb-4 space-y-1";

  for (const item of NAV) {
    const isActive = item.key === activeKey;
    const row = elFromHTML(`
      <a href="${item.href}" ${item.onclick ? `onclick="${item.onclick}"` : ''} title="${item.label}" class="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors border ${
        isActive
          ? "bg-brand-50 text-brand-800 border-brand-50"
          : "text-slate-700 hover:bg-slate-50 border-transparent"
      }">
        <div class="mt-0.5 ${isActive ? "text-brand-800" : "text-slate-500 group-hover:text-slate-700"}">${item.icon}</div>
        <div class="min-w-0 kpi-nav-text">
          <div class="text-sm font-semibold leading-5">${item.label}</div>
          <div class="text-xs text-slate-500 leading-4 truncate kpi-nav-desc">${item.description}</div>
        </div>
      </a>
    `);
    nav.appendChild(row);
  }

  const footer = elFromHTML(`
    <div class="mt-auto p-4 text-[11px] text-slate-400">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <div id="kpi-sidebar-toggle-slot" class="mb-2"></div>
        <div class="mt-2">
          <a href="/seguridad/logout" aria-label="Cerrar sesión" class="flex items-center justify-center gap-2 w-full py-2 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="text-sm">Cerrar Sesión</span>
          </a>
        </div>
      </div>
    </div>
  `);

  const wrapper = document.createElement("div");
  wrapper.className = "h-full min-h-screen flex flex-col";
  wrapper.appendChild(header);
  wrapper.appendChild(nav);
  wrapper.appendChild(footer);

  sidebarHost.appendChild(wrapper);

  ensureKpiSidebarControls();
  syncKpiTogglePlacement(document.getElementById("kpi-shell"));

  // Añadir evento de clic al sidebar para expandir/colapsar cuando no se hace clic en opciones
  sidebarHost.addEventListener('click', (e) => {
    // Verificar si el clic no fue en un enlace, botón o elemento interactivo
    const clickedElement = e.target;
    const isInteractiveElement = 
      clickedElement.closest('a') || 
      clickedElement.closest('button') || 
      clickedElement.closest('input') || 
      clickedElement.closest('select') || 
      clickedElement.closest('textarea') ||
      clickedElement.closest('#kpi-sidebar-toggle-slot');

    if (!isInteractiveElement && !isMobileViewport()) {
      // Si no es un elemento interactivo y no es móvil, expandir/colapsar el sidebar
      const shell = document.getElementById("kpi-shell");
      if (shell) {
        const next = !shell.classList.contains(KPI_SHELL_COLLAPSED_CLASS);
        setCollapsed(shell, next);
        writeCollapsedPref(next);
      }
    }
  });
}
