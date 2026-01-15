import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

const STORAGE_KEY = 'dp_orders_mock_v1';

const STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  IN_KITCHEN: 'IN_KITCHEN',
  READY_FOR_DISPATCH: 'READY_FOR_DISPATCH',
  EN_ROUTE: 'EN_ROUTE',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

function normalizeStatus(value) {
  const s = String(value || '').toUpperCase();
  // Legacy aliases seen in other pages
  if (s === 'APPROVED') return STATUS.IN_KITCHEN;
  if (s === 'READY') return STATUS.READY_FOR_DISPATCH;
  if (s === 'DISPATCHED') return STATUS.EN_ROUTE;
  if (s === 'CLOSED') return STATUS.DELIVERED;
  if (s === 'PENDING') return STATUS.PENDING_REVIEW;
  return Object.values(STATUS).includes(s) ? s : STATUS.PENDING_REVIEW;
}

function statusLabel(status) {
  switch (normalizeStatus(status)) {
    case STATUS.PENDING_REVIEW:
      return 'Pendiente de revisión';
    case STATUS.IN_KITCHEN:
      return 'En cocina';
    case STATUS.READY_FOR_DISPATCH:
      return 'Por despachar';
    case STATUS.EN_ROUTE:
      return 'En ruta';
    case STATUS.DELIVERED:
      return 'Entregado';
    case STATUS.CANCELLED:
      return 'Cancelado';
    default:
      return String(status || '—');
  }
}

function statusTone(status) {
  switch (normalizeStatus(status)) {
    case STATUS.PENDING_REVIEW:
      return 'dp-badge--yellow';
    case STATUS.IN_KITCHEN:
      return 'dp-badge--blue';
    case STATUS.READY_FOR_DISPATCH:
      return 'dp-badge--green';
    case STATUS.EN_ROUTE:
      return 'dp-badge--purple';
    case STATUS.CANCELLED:
      return 'dp-badge--red';
    case STATUS.DELIVERED:
      return 'dp-badge--muted';
    default:
      return 'dp-badge--muted';
  }
}

function serviceTypeLabel(value) {
  const v = String(value || '').toUpperCase();
  if (v === 'DELIVERY') return { short: 'E', label: 'Entrega' };
  if (v === 'PICKUP') return { short: 'R', label: 'Recogida' };
  return { short: '—', label: 'Servicio' };
}

function minutesSince(iso) {
  const t = new Date(iso).getTime();
  if (!t || Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

function timerTone(mins) {
  if (mins >= 30) return 'dp-timer--late';
  if (mins >= 20) return 'dp-timer--warn';
  return 'dp-timer--ok';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw);
    if (!Array.isArray(json)) return null;
    return json;
  } catch {
    return null;
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

function seedOrders() {
  const now = Date.now();
  const minAgo = (m) => new Date(now - m * 60000).toISOString();
  return [
    {
      id: '12345',
      noteId: '12345',
      customer: 'Liam Carter',
      serviceType: 'PICKUP',
      status: STATUS.PENDING_REVIEW,
      createdAt: minAgo(6),
      address: null,
      itemsSummary: '2x Hamburguesas, 1x Refresco',
      driver: null
    },
    {
      id: '67890',
      noteId: '67890',
      customer: 'Olivia Bennett',
      serviceType: 'DELIVERY',
      status: STATUS.READY_FOR_DISPATCH,
      createdAt: minAgo(22),
      address: 'Av. Principal 123, Zona Centro',
      itemsSummary: '1x Ensalada, 1x Soda',
      driver: null
    },
    {
      id: '24680',
      noteId: '24680',
      customer: 'Noah Thompson',
      serviceType: 'DELIVERY',
      status: STATUS.EN_ROUTE,
      createdAt: minAgo(34),
      address: 'Calle 8 #45-12, Barrio Norte',
      itemsSummary: '1x Pizza, 2x Papas',
      driver: 'Driver 7'
    },
    {
      id: '11223',
      noteId: '11223',
      customer: 'Ava Rodriguez',
      serviceType: 'PICKUP',
      status: STATUS.IN_KITCHEN,
      createdAt: minAgo(12),
      address: null,
      itemsSummary: '1x Wrap, 1x Jugo',
      driver: null
    },
    {
      id: '99887',
      noteId: '99887',
      customer: 'Ethan Carter',
      serviceType: 'DELIVERY',
      status: STATUS.DELIVERED,
      createdAt: minAgo(58),
      address: 'Cra 10 #20-30',
      itemsSummary: '2x Tacos, 1x Agua',
      driver: 'Driver 3'
    }
  ];
}

const TABS = [
  { key: 'new', label: 'Nuevas', statuses: [STATUS.PENDING_REVIEW] },
  { key: 'kitchen', label: 'En cocina', statuses: [STATUS.IN_KITCHEN] },
  { key: 'dispatch', label: 'Por despachar', statuses: [STATUS.READY_FOR_DISPATCH] },
  { key: 'route', label: 'En ruta', statuses: [STATUS.EN_ROUTE] },
  { key: 'history', label: 'Historial', statuses: [STATUS.DELIVERED, STATUS.CANCELLED] }
];

let state = {
  tab: 'dispatch',
  orders: []
};

function selectTab(key) {
  state.tab = key;
  render();
}

function visibleOrders() {
  const tab = TABS.find((t) => t.key === state.tab) || TABS[0];
  return state.orders
    .map((o) => ({ ...o, status: normalizeStatus(o.status) }))
    .filter((o) => tab.statuses.includes(normalizeStatus(o.status)))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function countsByTab() {
  const counts = {};
  for (const t of TABS) counts[t.key] = 0;
  for (const o of state.orders) {
    const st = normalizeStatus(o.status);
    for (const t of TABS) {
      if (t.statuses.includes(st)) counts[t.key] += 1;
    }
  }
  return counts;
}

function renderTabs() {
  const host = document.getElementById('dpOrdersTabs');
  if (!host) return;
  const counts = countsByTab();
  host.innerHTML = `<div class="dp-tabs">
    ${TABS.map((t) => {
      const active = t.key === state.tab;
      return `<button type="button" class="dp-tab ${active ? 'dp-tab--active' : ''}" data-tab="${t.key}">
        <span>${escapeHtml(t.label)}</span>
        <span class="dp-tab-badge" aria-label="${counts[t.key]}">${counts[t.key]}</span>
      </button>`;
    }).join('')}
  </div>`;
}

function actionFor(order) {
  const st = normalizeStatus(order.status);
  if (st === STATUS.PENDING_REVIEW) {
    return { key: 'approve', label: 'Aprobar', tone: 'bg-amber-500 hover:bg-amber-600 text-white' };
  }
  if (st === STATUS.READY_FOR_DISPATCH) {
    return { key: 'dispatch', label: 'Despachar', tone: 'bg-brand-800 hover:bg-brand-700 text-white' };
  }
  if (st === STATUS.EN_ROUTE) {
    return { key: 'delivered', label: 'Entregado', tone: 'bg-slate-900 hover:bg-slate-800 text-white' };
  }
  return null;
}

function renderOrders() {
  const host = document.getElementById('dpOrdersList');
  if (!host) return;

  const list = visibleOrders();
  if (list.length === 0) {
    host.innerHTML = `<div class="lg:col-span-2">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
        <div class="text-lg font-extrabold text-slate-900">Sin órdenes en esta pestaña</div>
        <div class="mt-1 text-sm text-slate-600">Cambie de pestaña para ver otros estados.</div>
      </div>
    </div>`;
    return;
  }

  host.innerHTML = list.map((o) => {
    const service = serviceTypeLabel(o.serviceType);
    const mins = minutesSince(o.createdAt);
    const a = actionFor(o);
    const addressLine = String(o.serviceType || '').toUpperCase() === 'DELIVERY'
      ? `<div class="mt-1 text-sm text-slate-600"><span class="font-semibold text-slate-800">Dirección:</span> ${escapeHtml(o.address || '—')}</div>`
      : `<div class="mt-1 text-sm text-slate-600"><span class="font-semibold text-slate-800">Recogida:</span> En mostrador</div>`;
    const driverLine = o.driver
      ? `<div class="mt-1 text-xs text-slate-500">Driver: <span class="font-semibold text-slate-700">${escapeHtml(o.driver)}</span></div>`
      : '';
    return `
      <article class="dp-order" data-order-id="${escapeHtml(o.id)}" role="group" aria-label="Pedido ${escapeHtml(o.id)}">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <div class="dp-order-meta">ID Nota: ${escapeHtml(o.noteId || o.id)}</div>
              <span class="dp-badge dp-badge--muted" title="Tipo de servicio">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-800">${escapeHtml(service.short)}</span>
                ${escapeHtml(service.label)}
              </span>
              <span class="dp-badge ${statusTone(o.status)}" title="Estado">${escapeHtml(statusLabel(o.status))}</span>
            </div>

            <div class="mt-2 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="dp-order-title truncate">${escapeHtml(o.customer || 'Cliente')}</div>
                <div class="dp-order-sub">Hace <span class="dp-timer ${timerTone(mins)}">${mins} min</span></div>
              </div>
              <div class="shrink-0">
                <a href="/admin/dp/orders/${encodeURIComponent(String(o.id))}" class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" aria-label="Abrir detalle">
                  Ver
                </a>
              </div>
            </div>

            ${addressLine}
            <div class="mt-2 text-sm text-slate-700"><span class="font-semibold text-slate-800">Resumen:</span> ${escapeHtml(o.itemsSummary || '—')}</div>
            ${driverLine}
          </div>

          <div class="shrink-0 flex flex-col items-end gap-2">
            ${a ? `<button type="button" class="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-extrabold shadow-sm ${a.tone}" data-action="${a.key}" data-order-id="${escapeHtml(o.id)}">${escapeHtml(a.label)}</button>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function render() {
  renderTabs();
  renderOrders();
}

function updateOrder(id, patch) {
  state.orders = state.orders.map((o) => (String(o.id) === String(id) ? { ...o, ...patch } : o));
  saveOrders(state.orders);
}

async function handleAction(action, id) {
  const order = state.orders.find((o) => String(o.id) === String(id));
  if (!order) return;

  const st = normalizeStatus(order.status);

  if (action === 'approve' && st === STATUS.PENDING_REVIEW) {
    updateOrder(id, { status: STATUS.IN_KITCHEN });
    render();
    return;
  }

  if (action === 'dispatch' && st === STATUS.READY_FOR_DISPATCH) {
    const driver = window.prompt('Asignar driver (ej: Driver 7):', order.driver || '');
    updateOrder(id, { status: STATUS.EN_ROUTE, driver: driver ? String(driver) : order.driver });
    render();
    return;
  }

  if (action === 'delivered' && st === STATUS.EN_ROUTE) {
    updateOrder(id, { status: STATUS.DELIVERED });
    render();
    return;
  }
}

function bindEvents() {
  const tabs = document.getElementById('dpOrdersTabs');
  if (tabs && tabs.dataset.dpBound !== '1') {
    tabs.dataset.dpBound = '1';
    tabs.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('[data-tab]');
      if (!btn) return;
      selectTab(btn.getAttribute('data-tab'));
    });
  }

  const list = document.getElementById('dpOrdersList');
  if (list && list.dataset.dpBound !== '1') {
    list.dataset.dpBound = '1';
    list.addEventListener('click', (e) => {
      const actionBtn = e.target?.closest?.('button[data-action][data-order-id]');
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();
        handleAction(actionBtn.getAttribute('data-action'), actionBtn.getAttribute('data-order-id'));
        return;
      }
    });
  }

  const refresh = document.getElementById('dpOrdersRefresh');
  if (refresh && refresh.dataset.dpBound !== '1') {
    refresh.dataset.dpBound = '1';
    refresh.addEventListener('click', () => {
      // For now, just re-render. Later, this is where we'd re-fetch from backend.
      render();
    });
  }
}

export async function init() {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  // Back-compat for older markup calling goTo().
  if (!window.__dpSpaRouter && typeof window.goTo !== 'function') {
    window.goTo = function goTo(pathOrUrl) {
      const u = new URL(pathOrUrl, window.location.href);
      const mode = new URLSearchParams(window.location.search).get('mode');
      if (mode && !u.searchParams.has('mode')) u.searchParams.set('mode', mode);
      window.location.href = u.toString();
    };
  }

  // Load initial dataset (mock stored in localStorage).
  const existing = loadOrders();
  state.orders = existing && existing.length ? existing : seedOrders();
  saveOrders(state.orders);

  // Default tab: dispatcher focus.
  if (!TABS.some((t) => t.key === state.tab)) state.tab = 'dispatch';
  render();
  bindEvents();

  // Update timers every 30s.
  if (!window.__dpOrdersTimer) {
    window.__dpOrdersTimer = window.setInterval(() => {
      // Only refresh if the list is present.
      if (document.getElementById('dpOrdersList')) renderOrders();
    }, 30000);
  }
}

if (!window.__dpSpaRouter) {
  window.addEventListener('DOMContentLoaded', () => {
    init();
  }, { once: true });
}
