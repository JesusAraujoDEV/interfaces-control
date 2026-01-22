import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

window.__dpSpaRouter = true;

function normalizePath(pathname) {
  if (pathname === '/admin/dp/pages/dashboard-home' || pathname === '/admin/dp/pages/dashboard-home/') {
    return '/admin/dp';
  }
  if (pathname === '/admin/dp/' ) return '/admin/dp';
  return pathname;
}

function isSameOrigin(url) {
  return url.origin === window.location.origin;
}

function isDpPath(pathname) {
  return pathname === '/admin/dp' || pathname.startsWith('/admin/dp/');
}

function getOrderIdFromDpPath(pathname) {
  const m = pathname.match(/^\/admin\/dp\/orders\/(.+)$/);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return null;
}

function routeFor(pathname) {
  const p = normalizePath(pathname);

  // Order detail
  if (p.startsWith('/admin/dp/orders/') && p !== '/admin/dp/orders') {
    return {
      key: 'order-detail',
      title: 'Pedido',
      contentUrl: '/mod-1-delivery-pickup/pages/pedido-12345/index.html',
      moduleUrl: '/mod-1-delivery-pickup/pages/pedido-12345/page.js',
      params: { orderId: getOrderIdFromDpPath(p) }
    };
  }

  if (p === '/admin/dp' || p === '/admin/dp/pages/dashboard-home') {
    return {
      key: 'dashboard',
      title: 'DP - Inicio',
      contentUrl: '/mod-1-delivery-pickup/pages/dashboard-home/index.html',
      moduleUrl: '/mod-1-delivery-pickup/pages/dashboard-home/page.js',
      params: {}
    };
  }

  if (p === '/admin/dp/orders') {
    return {
      key: 'orders',
      title: 'DP - Órdenes',
      contentUrl: '/mod-1-delivery-pickup/pages/pedidos/index.html',
      moduleUrl: '/mod-1-delivery-pickup/pages/pedidos/page.js',
      params: {}
    };
  }

  if (p === '/admin/dp/zones') {
    return {
      key: 'zones',
      title: 'DP - Zonas',
      contentUrl: '/mod-1-delivery-pickup/pages/gestion-zonas/index.html',
      moduleUrl: '/mod-1-delivery-pickup/pages/gestion-zonas/page.js',
      params: {}
    };
  }

  if (p === '/admin/dp/config') {
    return {
      key: 'config',
      title: 'DP - Configuración',
      contentUrl: '/mod-1-delivery-pickup/pages/configuracion-umbrales/index.html',
      moduleUrl: '/mod-1-delivery-pickup/pages/configuracion-umbrales/page.js',
      params: {}
    };
  }

  if (p === '/admin/dp/audit') {
    return {
      key: 'audit',
      title: 'DP - Auditoría',
      contentUrl: '/mod-1-delivery-pickup/pages/informes-auditoria/index.html',
      moduleUrl: '/mod-1-delivery-pickup/pages/informes-auditoria/page.js',
      params: {}
    };
  }

  return null;
}

function setViewLoading(isLoading) {
  const container = document.getElementById('dp-app-content');
  if (!container) return;
  container.setAttribute('data-loading', isLoading ? 'true' : 'false');
}

function clearViewCss() {
  document.querySelectorAll('link[data-dp-view-css="1"]').forEach((el) => el.remove());
}

function applyViewCss(fromDoc, contentUrl) {
  clearViewCss();

  const links = Array.from(fromDoc.querySelectorAll('link[rel="stylesheet"][href]'));
  const base = new URL(contentUrl, window.location.origin);

  for (const l of links) {
    const href = l.getAttribute('href');

    // Only bring page-level CSS from the view.
    if (!href) continue;
    if (!href.includes('/mod-1-delivery-pickup/pages/') && !href.endsWith('/page.css') && !href.endsWith('page.css')) continue;
    if (href.includes('/styles/tailwind.css')) continue;
    if (href.includes('/shared/styles/global.css')) continue;

    const resolved = new URL(href, base);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = resolved.pathname + resolved.search;
    link.setAttribute('data-dp-view-css', '1');
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

async function render(pathname) {
  const container = document.getElementById('dp-app-content');
  if (!container) return;

  const route = routeFor(pathname);
  if (!route) {
    container.innerHTML = `<div class="p-6"><div class="rounded-2xl border border-slate-200 bg-white p-6">
      <div class="text-lg font-extrabold text-slate-900">Ruta no soportada</div>
      <div class="mt-1 text-sm text-slate-600">${normalizePath(pathname)}</div>
      <a class="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white" href="/admin/dp">Volver</a>
    </div></div>`;
    return;
  }

  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  setViewLoading(true);

  try {
    let html = getCachedHtml(route.contentUrl);
    if (!html) {
      const res = await fetch(route.contentUrl, { signal: currentAbort.signal, headers: { 'X-DP-Partial': '1' } });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      html = await res.text();
      setCachedHtml(route.contentUrl, html);
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');

    applyViewCss(doc, route.contentUrl);

    // Inject the visible view markup. Most of our legacy pages keep <header> outside <main>,
    // so we cannot rely on main.innerHTML only.
    const view = Array.from(doc.body.children)
      .filter((el) => el && el.tagName !== 'SCRIPT')
      .map((el) => el.outerHTML)
      .join('');
    container.innerHTML = view;

    document.title = doc.title || route.title || document.title;

    // Refresh sidebar highlight without a full reload.
    mountDpSidebar();

    // Optional per-view init.
    if (route.moduleUrl) {
      const mod = await import(route.moduleUrl);
      if (typeof mod.init === 'function') {
        // Avoid double init if user clicks the same nav repeatedly.
        const key = `${route.key}`;
        if (lastInitKey !== key) {
          lastInitKey = key;
        }
        await mod.init(route.params || {});
      }
    }

    // Scroll into place for SPA feel.
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

  // Keep navigation within DP.
  const pathname = normalizePath(url.pathname);
  if (!isDpPath(pathname)) {
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
  return isDpPath(normalizePath(url.pathname));
}

async function prefetchHref(href) {
  try {
    const url = new URL(href, window.location.origin);
    if (!isDpPath(normalizePath(url.pathname))) return;
    const route = routeFor(url.pathname);
    if (!route || !route.contentUrl) return;
    if (getCachedHtml(route.contentUrl)) return;
    const res = await fetch(route.contentUrl, { headers: { 'X-DP-Prefetch': '1' } });
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

  // Prefetch on hover/focus to make navigation feel instant.
  document.addEventListener('mouseover', (event) => {
    const anchor = event.target?.closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    const url = new URL(href, window.location.origin);
    if (!isDpPath(normalizePath(url.pathname))) return;
    prefetchHref(url.pathname + url.search + url.hash);
  }, { capture: true });

  document.addEventListener('focusin', (event) => {
    const anchor = event.target?.closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    const url = new URL(href, window.location.origin);
    if (!isDpPath(normalizePath(url.pathname))) return;
    prefetchHref(url.pathname + url.search + url.hash);
  });

  // Provide goTo used by existing markup.
  window.goTo = function goTo(pathOrUrl) {
    const u = new URL(pathOrUrl, window.location.href);
    if (isDpPath(normalizePath(u.pathname))) {
      navigate(u.pathname + u.search + u.hash);
      return;
    }
    window.location.href = u.toString();
  };
}

function boot() {
  initDpLayout();
  mountDpSidebar();
  wireRouter();

  // First paint
  render(window.location.pathname);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
