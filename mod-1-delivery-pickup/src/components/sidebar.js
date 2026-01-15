const NAV = [
  {
    key: 'dashboard',
    label: 'Inicio',
    description: 'Resumen',
    href: '/admin/dp/pages/dashboard-home/',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"/></svg>`
  },
  {
    key: 'orders',
    label: 'Órdenes',
    description: 'Gestión de pedidos',
    href: '/admin/dp/orders',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>`
  },
  {
    key: 'managers',
    label: 'Personal',
    description: 'Gerentes/Drivers',
    href: '/admin/dp/managers',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    key: 'zones',
    label: 'Zonas',
    description: 'Cobertura y tarifas',
    href: '/admin/dp/zones',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0Z"/><path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>`
  },
  {
    key: 'config',
    label: 'Configuración',
    description: 'Umbrales',
    href: '/admin/dp/config',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a7.97 7.97 0 0 0 .1-1 7.97 7.97 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.7l-2-3.4a.5.5 0 0 0-.6-.2l-2.5 1a8.2 8.2 0 0 0-1.7-1l-.4-2.7a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.7a8.2 8.2 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.4a.5.5 0 0 0 .1.7L4.6 13a7.97 7.97 0 0 0-.1 1c0 .34.03.67.1 1l-2.1 1.6a.5.5 0 0 0-.1.7l2 3.4a.5.5 0 0 0 .6.2l2.5-1c.52.4 1.09.73 1.7 1l.4 2.7a.5.5 0 0 0 .5.4h4a.5.5 0 0 0 .5-.4l.4-2.7c.61-.27 1.18-.6 1.7-1l2.5 1a.5.5 0 0 0 .6-.2l2-3.4a.5.5 0 0 0-.1-.7L19.4 15Z"/></svg>`
  },
  {
    key: 'audit',
    label: 'Auditoría',
    description: 'Logs y reportes',
    href: '/admin/dp/audit',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M9 17v-6"/><path d="M12 17v-2"/><path d="M15 17v-4"/><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2Z"/><path d="M14 3v5h5"/></svg>`
  }
];

function resolveActiveKey(pathname) {
  if (pathname.startsWith('/admin/dp/orders')) return 'orders';
  if (pathname.startsWith('/admin/dp/managers')) return 'managers';
  if (pathname.startsWith('/admin/dp/zones')) return 'zones';
  if (pathname.startsWith('/admin/dp/config')) return 'config';
  if (pathname.startsWith('/admin/dp/audit')) return 'audit';
  if (pathname.startsWith('/admin/dp/pages/dashboard-home')) return 'dashboard';
  if (pathname === '/admin/dp' || pathname === '/admin/dp/') return 'dashboard';
  return null;
}

function elFromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export function initDpLayout() {
  const body = document.body;
  if (document.getElementById('dp-shell')) return;

  body.classList.add('antialiased', 'text-slate-900');

  const shell = document.createElement('div');
  shell.id = 'dp-shell';
  shell.className = 'min-h-screen bg-brand-50 flex';

  const sidebarHost = document.createElement('aside');
  sidebarHost.id = 'dp-sidebar';
  sidebarHost.className = 'w-72 shrink-0 border-r border-slate-200 bg-white';

  const main = document.createElement('div');
  main.id = 'dp-main';
  main.className = 'flex-1 min-w-0';

  shell.appendChild(sidebarHost);
  shell.appendChild(main);

  body.prepend(shell);

  const movable = Array.from(body.children).filter(node => node !== shell && node.tagName !== 'SCRIPT');
  for (const node of movable) {
    main.appendChild(node);
  }

  // Wrap main content with consistent padding.
  const padded = document.createElement('div');
  padded.className = 'p-4 sm:p-6 lg:p-8';
  while (main.firstChild) padded.appendChild(main.firstChild);
  main.appendChild(padded);

  return { sidebarHost, mainContent: padded };
}

export function mountDpSidebar() {
  const sidebarHost = document.getElementById('dp-sidebar');
  if (!sidebarHost) return;

  const activeKey = resolveActiveKey(window.location.pathname);

  sidebarHost.innerHTML = '';

  const header = elFromHTML(`
    <div class="p-5">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M3 7h18"/><path d="M6 7v14"/><path d="M18 7v14"/><path d="M6 21h12"/><path d="M9 7V3h6v4"/></svg>
        </div>
        <div class="min-w-0">
          <div class="text-sm font-extrabold text-slate-900 leading-5">Delivery & Pickup</div>
          <div class="text-xs text-slate-500 leading-4 truncate">Dashboard Operativo</div>
        </div>
      </div>
      <a href="/admin" class="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800">
        <span aria-hidden="true">←</span>
        Volver a Admin
      </a>
    </div>
  `);

  const nav = document.createElement('nav');
  nav.className = 'px-3 pb-4 space-y-1';

  for (const item of NAV) {
    const isActive = item.key === activeKey;
    const row = elFromHTML(`
      <a href="${item.href}" class="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors border ${
        isActive
          ? 'bg-brand-50 text-brand-800 border-brand-50'
          : 'text-slate-700 hover:bg-slate-50 border-transparent'
      }">
        <div class="mt-0.5 ${isActive ? 'text-brand-800' : 'text-slate-500 group-hover:text-slate-700'}">${item.icon}</div>
        <div class="min-w-0">
          <div class="text-sm font-semibold leading-5">${item.label}</div>
          <div class="text-xs text-slate-500 leading-4 truncate">${item.description}</div>
        </div>
      </a>
    `);
    nav.appendChild(row);
  }

  const footer = elFromHTML(`
    <div class="mt-auto p-4 text-[11px] text-slate-400">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        Navegación persistente (MPA)
      </div>
    </div>
  `);

  const wrapper = document.createElement('div');
  wrapper.className = 'h-full min-h-screen flex flex-col';
  wrapper.appendChild(header);
  wrapper.appendChild(nav);
  wrapper.appendChild(footer);

  sidebarHost.appendChild(wrapper);
}
