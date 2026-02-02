import { initKpiLayout, mountKpiSidebar } from '/kpi-pruebas/src/components/sidebar.js';
import { getSelectedDate, setSelectedDate, onDateChange } from '/kpi-pruebas/src/services/kpi-state.js';
import { getSystemWarnings } from '/kpi-pruebas/src/services/system-status.js';

window.__kpiSpaRouter = true;

function normalizePath(pathname) {
  if (pathname === '/admin/kpi/') return '/admin/kpi';
  return pathname;
}

function isSameOrigin(url) {
  return url.origin === window.location.origin;
}

function isKpiPath(pathname) {
  return pathname === '/admin/kpi' || pathname.startsWith('/admin/kpi/');
}

function routeFor(pathname) {
  const p = normalizePath(pathname);

  if (p === '/admin/kpi' || p === '/admin/kpi/') {
    return {
      key: 'home',
      title: 'KPI — Inicio',
      subtitle: 'Accesos rápidos a submódulos',
      contentUrl: '/kpi-pruebas/pages/home/index.html',
      moduleUrl: '/kpi-pruebas/pages/home/page.js'
    };
  }

  if (p === '/admin/kpi/dashboard') {
    return {
      key: 'dashboard',
      title: 'Executive Dashboard',
      subtitle: 'Monitoreo gerencial en tiempo real',
      contentUrl: '/kpi-pruebas/pages/dashboard/index.html',
      moduleUrl: '/kpi-pruebas/pages/dashboard/page.js'
    };
  }

  if (p === '/admin/kpi/finance') {
    return {
      key: 'finance',
      title: 'Finanzas Épicas',
      subtitle: 'Salud financiera y pérdidas',
      contentUrl: '/kpi-pruebas/pages/finance/index.html',
      moduleUrl: '/kpi-pruebas/pages/finance/page.js'
    };
  }

  if (p === '/admin/kpi/operations') {
    return {
      key: 'operations',
      title: 'Operaciones & Staff',
      subtitle: 'Pulso operativo en cocina y delivery',
      contentUrl: '/kpi-pruebas/pages/operations/index.html',
      moduleUrl: '/kpi-pruebas/pages/operations/page.js'
    };
  }

  if (p === '/admin/kpi/products') {
    return {
      key: 'products',
      title: 'Producto & Inventario',
      subtitle: 'Ingeniería de menú y control de stock',
      contentUrl: '/kpi-pruebas/pages/products/index.html',
      moduleUrl: '/kpi-pruebas/pages/products/page.js'
    };
  }

  if (p === '/admin/kpi/cx') {
    return {
      key: 'cx',
      title: 'Customer Experience',
      subtitle: 'Control de sala y servicio',
      contentUrl: '/kpi-pruebas/pages/cx/index.html',
      moduleUrl: '/kpi-pruebas/pages/cx/page.js'
    };
  }

  return null;
}

function setViewLoading(isLoading) {
  const container = document.getElementById('kpi-app-content');
  if (!container) return;
  container.setAttribute('data-loading', isLoading ? 'true' : 'false');
}

function clearViewCss() {
  document.querySelectorAll('link[data-kpi-view-css="1"]').forEach((el) => el.remove());
}

function applyViewCss(fromDoc, contentUrl) {
  clearViewCss();

  const links = Array.from(fromDoc.querySelectorAll('link[rel="stylesheet"][href]'));
  const base = new URL(contentUrl, window.location.origin);

  for (const l of links) {
    const href = l.getAttribute('href');
    if (!href) continue;
    if (!href.includes('/kpi-pruebas/pages/') && !href.endsWith('/page.css') && !href.endsWith('page.css')) continue;
    if (href.includes('/styles/tailwind.css')) continue;
    if (href.includes('/shared/styles/global.css')) continue;

    const resolved = new URL(href, base);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = resolved.pathname + resolved.search;
    link.setAttribute('data-kpi-view-css', '1');
    document.head.appendChild(link);
  }
}

let currentAbort = null;
let lastInitKey = null;

const contentCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedHtml(contentUrl) {
  const entry = contentCache.get(contentUrl);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    contentCache.delete(contentUrl);
    return null;
  }
  return entry.html;
}

function setCachedHtml(contentUrl, html) {
  contentCache.set(contentUrl, { html, at: Date.now() });
}

function initTopbar(container) {
  if (document.getElementById('kpi-topbar')) return;

  const topbar = document.createElement('div');
  topbar.id = 'kpi-topbar';
  topbar.className = 'kpi-topbar';
  topbar.innerHTML = `
    <div class="kpi-topbar-row">
      <div>
        <div class="text-xs text-slate-500">Admin / KPI</div>
        <h1 id="kpi-topbar-title" class="text-2xl sm:text-3xl font-extrabold"></h1>
        <p id="kpi-topbar-subtitle" class="mt-1 text-sm text-slate-600"></p>
      </div>
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-500">Fecha global</label>
        <input id="kpi-date-input" class="kpi-date-input" type="date" />
      </div>
    </div>
    <div class="kpi-topbar-row">
      <div id="kpi-system-status" class="kpi-status-bar">
        <span class="kpi-dot kpi-dot--live"></span>
        <span>Estado del sistema: estable</span>
      </div>
      <div class="text-[11px] text-slate-400" id="kpi-last-updated"></div>
    </div>
  `;

  container.prepend(topbar);

  const input = document.getElementById('kpi-date-input');
  if (input) {
    input.value = getSelectedDate();
    input.addEventListener('change', (event) => {
      setSelectedDate(event.target.value);
    });
  }

  onDateChange((value) => {
    if (input && input.value !== value) input.value = value;
    render(window.location.pathname, { force: true });
  });
}

function updateTopbar(route) {
  const title = document.getElementById('kpi-topbar-title');
  const subtitle = document.getElementById('kpi-topbar-subtitle');
  if (title) title.textContent = route?.title || 'KPI & Analytics';
  if (subtitle) subtitle.textContent = route?.subtitle || '';
}

function updateSystemStatus(warnings) {
  const bar = document.getElementById('kpi-system-status');
  if (!bar) return;

  if (Array.isArray(warnings) && warnings.length) {
    const warningText = warnings[0]?.message || warnings[0]?.description || 'Datos parciales';
    bar.innerHTML = `<span class="kpi-dot kpi-dot--warn"></span><span>⚠️ ${warningText}</span>`;
    return;
  }
  bar.innerHTML = `<span class="kpi-dot kpi-dot--live"></span><span>Estado del sistema: estable</span>`;
}

async function refreshSystemStatus() {
  const warnings = await getSystemWarnings();
  updateSystemStatus(warnings);
}

async function render(pathname, { force = false } = {}) {
  const container = document.getElementById('kpi-app-content');
  if (!container) return;

  const route = routeFor(pathname);
  if (!route) {
    container.innerHTML = `<div class="p-6"><div class="rounded-2xl border border-slate-200 bg-white p-6">
      <div class="text-lg font-extrabold text-slate-900">Ruta no soportada</div>
      <div class="mt-1 text-sm text-slate-600">${normalizePath(pathname)}</div>
      <a class="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white" href="/admin/kpi">Volver</a>
    </div></div>`;
    return;
  }

  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  setViewLoading(true);

  try {
    let html = force ? null : getCachedHtml(route.contentUrl);
    if (!html) {
      const res = await fetch(route.contentUrl, { signal: currentAbort.signal, headers: { 'X-KPI-Partial': '1' } });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      html = await res.text();
      setCachedHtml(route.contentUrl, html);
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');

    applyViewCss(doc, route.contentUrl);

    const view = Array.from(doc.body.children)
      .filter((el) => el && el.tagName !== 'SCRIPT')
      .map((el) => el.outerHTML)
      .join('');
    container.innerHTML = view;

    document.title = doc.title || route.title || document.title;

    mountKpiSidebar();
    updateTopbar(route);
    refreshSystemStatus();

    if (route.moduleUrl) {
      if (typeof window.__kpiCleanup === 'function') {
        window.__kpiCleanup();
        window.__kpiCleanup = null;
      }
      const mod = await import(route.moduleUrl);
      if (typeof mod.init === 'function') {
        const key = `${route.key}`;
        if (lastInitKey !== key) {
          lastInitKey = key;
        }
        await mod.init({ routeKey: route.key });
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    container.innerHTML = `<div class="p-6"><div class="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <div class="text-lg font-extrabold text-rose-900">Error cargando vista</div>
      <div class="mt-1 text-sm text-rose-800">${String(err?.message || err)}</div>
    </div></div>`;
  } finally {
    setViewLoading(false);
  }
}

function navigate(to, { replace = false } = {}) {
  const url = new URL(to, window.location.origin);

  const pathname = normalizePath(url.pathname);
  if (!isKpiPath(pathname)) {
    window.location.href = url.toString();
    return;
  }

  const nextUrl = pathname + url.search + url.hash;
  if (replace) window.history.replaceState({}, '', nextUrl);
  else window.history.pushState({}, '', nextUrl);

  render(pathname);
}

function shouldInterceptClick(event, anchor) {
  if (!anchor) return false;
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) return false;

  const url = new URL(href, window.location.origin);
  if (!isSameOrigin(url)) return false;
  return isKpiPath(normalizePath(url.pathname));
}

async function prefetchHref(href) {
  try {
    const url = new URL(href, window.location.origin);
    if (!isKpiPath(normalizePath(url.pathname))) return;
    const route = routeFor(url.pathname);
    if (!route || !route.contentUrl) return;
    if (getCachedHtml(route.contentUrl)) return;
    const res = await fetch(route.contentUrl, { headers: { 'X-KPI-Prefetch': '1' } });
    if (!res.ok) return;
    const html = await res.text();
    setCachedHtml(route.contentUrl, html);
  } catch {
    // ignore
  }
}

function wireRouter() {
  document.addEventListener('click', (event) => {
    const anchor = event.target?.closest?.('a');
    if (!anchor) return;
    if (!shouldInterceptClick(event, anchor)) return;

    event.preventDefault();
    const url = new URL(anchor.getAttribute('href'), window.location.origin);
    navigate(url.pathname + url.search + url.hash);
  });

  window.addEventListener('popstate', () => {
    render(window.location.pathname);
  });

  document.addEventListener('mouseover', (event) => {
    const anchor = event.target?.closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    const url = new URL(href, window.location.origin);
    if (!isKpiPath(normalizePath(url.pathname))) return;
    prefetchHref(url.pathname + url.search + url.hash);
  }, { capture: true });

  document.addEventListener('focusin', (event) => {
    const anchor = event.target?.closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    const url = new URL(href, window.location.origin);
    if (!isKpiPath(normalizePath(url.pathname))) return;
    prefetchHref(url.pathname + url.search + url.hash);
  });

  window.goTo = function goTo(pathOrUrl) {
    const u = new URL(pathOrUrl, window.location.href);
    if (isKpiPath(normalizePath(u.pathname))) {
      navigate(u.pathname + u.search + u.hash);
      return;
    }
    window.location.href = u.toString();
  };
}

function boot() {
  const { mainContent } = initKpiLayout();
  initTopbar(mainContent);
  mountKpiSidebar();
  wireRouter();

  render(window.location.pathname);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
