import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

const STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  IN_KITCHEN: 'IN_KITCHEN',
  READY_FOR_DISPATCH: 'READY_FOR_DISPATCH',
  EN_ROUTE: 'EN_ROUTE',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

const DATE_FILTER_STORAGE_KEY = 'dp_orders_date_filter_v1';

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

function normalizeBaseUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/g, '');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function localTodayYYYYMMDD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function normalizeDateFilter(value) {
  const v = String(value || '').trim();
  if (!v) return 'today';
  return v === localTodayYYYYMMDD() ? 'today' : v;
}

function readStoredDateFilter() {
  try {
    const stored = sessionStorage.getItem(DATE_FILTER_STORAGE_KEY);
    return normalizeDateFilter(stored);
  } catch {
    return 'today';
  }
}

function writeStoredDateFilter(value) {
  try {
    sessionStorage.setItem(DATE_FILTER_STORAGE_KEY, normalizeDateFilter(value));
  } catch {
    // ignore
  }
}

function getDpUrl() {
  return normalizeBaseUrl(
    (window.__APP_CONFIG__ && window.__APP_CONFIG__.DP_URL) ||
      localStorage.getItem('DP_URL') ||
      ''
  );
}

function normalizeErrorMessage(error) {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || 'Error';
  return 'Error';
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && (body.message || body.error)) ||
      (typeof body === 'string' && body.trim()) ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body;
}

function formatMoneyCOP(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numericValue);
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

function setActionButtonLoading(buttonEl, loading, label) {
  if (!buttonEl) return;

  if (loading) {
    const fallbackLabel = String(label || buttonEl.textContent || 'Procesando');
    buttonEl.dataset.dpLabel = fallbackLabel;
    buttonEl.disabled = true;
    buttonEl.setAttribute('aria-busy', 'true');
    buttonEl.classList.add('opacity-80');
    buttonEl.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
        </svg>
        <span>${escapeHtml(fallbackLabel)}</span>
      </span>`;
    return;
  }

  const prev = buttonEl.dataset.dpLabel;
  if (prev) buttonEl.textContent = prev;
  delete buttonEl.dataset.dpLabel;
  buttonEl.disabled = false;
  buttonEl.removeAttribute('aria-busy');
  buttonEl.classList.remove('opacity-80');
}

function mapOrderFromApi(o) {
  const orderId = o?.order_id ?? o?.id ?? null;
  const readableId = o?.readable_id ?? o?.readableId ?? null;
  return {
    id: readableId || orderId,
    orderId,
    readableId,
    customerName: o?.customer_name ?? o?.customerName ?? 'Cliente',
    customerPhone: o?.customer_phone ?? o?.customerPhone ?? null,
    customerEmail: o?.customer_email ?? o?.customerEmail ?? null,
    address: o?.delivery_address ?? o?.deliveryAddress ?? null,
    serviceType: o?.service_type ?? o?.serviceType ?? null,
    status: normalizeStatus(o?.current_status ?? o?.status ?? o?.currentStatus),
    createdAt: o?.timestamp_creation ?? o?.timestampCreation ?? o?.created_at ?? o?.createdAt ?? null,
    total: o?.monto_total ?? o?.total_amount ?? o?.totalAmount ?? null,
    // Prefer zone shipping cost when available; otherwise fallback to common fields.
    shippingCost:
      (o?.zone && (o.zone.shipping_cost ?? o.zone.shippingCost)) ??
      o?.monto_costo_envio ?? o?.shipping_amount ?? o?.shippingAmount ?? null,
    notes: o?.notes ?? o?.note ?? null,
  };
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
  orders: [],
  loading: false,
  dateFilter: 'today',
  cancelTarget: null
};

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', Boolean(hidden));
}

function setPageError(message) {
  const errorEl = document.getElementById('dpOrdersError');
  setText(errorEl, message ? `⚠️ ${message}` : '');
  setHidden(errorEl, !message);
}

function setMeta(text) {
  const metaEl = document.getElementById('dpOrdersMeta');
  setText(metaEl, text || '');
}

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

function canCancel(order) {
  const st = normalizeStatus(order.status);
  return st !== STATUS.DELIVERED && st !== STATUS.CANCELLED;
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

    const totalsLine = `<div class="mt-2 text-sm text-slate-700"><span class="font-semibold text-slate-800">Total:</span> ${escapeHtml(formatMoneyCOP(o.total))} <span class="text-slate-500">(envío ${escapeHtml(formatMoneyCOP(o.shippingCost))})</span></div>`;

    const contactLine = o.customerPhone
      ? `<div class="mt-1 text-xs text-slate-500">Tel: <span class="font-semibold text-slate-700">${escapeHtml(o.customerPhone)}</span></div>`
      : '';

    const notesLine = o.notes
      ? `<div class="mt-1 text-xs text-slate-500"><span class="font-semibold text-slate-800">Nota:</span> ${escapeHtml(o.notes)}</div>`
      : '';

    const openId = o.readableId || o.orderId || o.id;
    const idLabel = o.readableId || o.orderId || o.id;
    const createdIso = o.createdAt ? String(o.createdAt) : '';
    return `
      <article class="dp-order" data-order-id="${escapeHtml(String(openId))}" role="group" aria-label="Orden ${escapeHtml(String(idLabel))}">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="dp-badge dp-badge--muted" title="Tipo de servicio">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-800">${escapeHtml(service.short)}</span>
                ${escapeHtml(service.label)}
              </span>
              <span class="dp-badge ${statusTone(o.status)}" title="Estado">${escapeHtml(statusLabel(o.status))}</span>
            </div>

            <div class="mt-2 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="dp-order-title truncate">Orden #${escapeHtml(String(idLabel))}</div>
                <div class="text-sm font-semibold text-slate-800 truncate">${escapeHtml(o.customerName || '—')}</div>
                <div class="dp-order-sub">Hace <span class="dp-timer ${timerTone(mins)}">${mins} min</span></div>
              </div>
              <div class="shrink-0">
                <a href="/admin/dp/orders/${encodeURIComponent(String(openId))}" class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" aria-label="Abrir detalle">
                  Ver
                </a>
              </div>
            </div>

            ${addressLine}
            ${totalsLine}
            ${contactLine}
            ${notesLine}
          </div>

          <div class="shrink-0 flex flex-col items-end gap-2">
            ${a ? `<button type="button" class="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-extrabold shadow-sm ${a.tone}" data-action="${a.key}" data-order-id="${escapeHtml(o.id)}">${escapeHtml(a.label)}</button>` : ''}
            ${canCancel(o) ? `<button type="button" class="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-extrabold shadow-sm bg-rose-600 hover:bg-rose-700 text-white" data-action="cancel" data-order-id="${escapeHtml(o.id)}">Cancelar</button>` : ''}
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
}

async function patchOrderStatus(orderId, nextStatus) {
  const dpBase = getDpUrl();
  const url = dpBase
    ? `${dpBase}/api/dp/v1/orders/${encodeURIComponent(orderId)}/status`
    : `/api/dp/v1/orders/${encodeURIComponent(orderId)}/status`;
  await fetchJson(url, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
}

function closeCancelModal() {
  const modal = document.getElementById('dpCancelModal');
  if (!modal) return;
  modal.classList.add('hidden');
  state.cancelTarget = null;
}

function openCancelModal(order) {
  const modal = document.getElementById('dpCancelModal');
  if (!modal) return;

  const label = order.readableId || order.orderId || order.id;
  state.cancelTarget = { orderId: order.orderId, label };

  const subtitle = document.getElementById('dpCancelSubtitle');
  if (subtitle) subtitle.textContent = `¿Seguro que deseas cancelar la orden ${label}?`;

  modal.classList.remove('hidden');
}

async function confirmCancelModal() {
  const target = state.cancelTarget;
  if (!target?.orderId) {
    setPageError('No se encontró order_id para esta orden.');
    closeCancelModal();
    return;
  }

  const confirmBtn = document.getElementById('dpCancelConfirm');
  const keepBtn = document.getElementById('dpCancelKeep');
  const closeBtn = document.getElementById('dpCancelClose');

  const prevText = confirmBtn?.textContent;
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Cancelando...';
  }
  if (keepBtn) keepBtn.disabled = true;
  if (closeBtn) closeBtn.disabled = true;

  try {
    setPageError('');
    await patchOrderStatus(target.orderId, STATUS.CANCELLED);
    closeCancelModal();
    await loadOrdersFromBackend();
  } catch (e) {
    setPageError(normalizeErrorMessage(e));
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = prevText || 'Sí, cancelar';
    }
    if (keepBtn) keepBtn.disabled = false;
    if (closeBtn) closeBtn.disabled = false;
  }
}

async function handleAction(action, id) {
  const order = state.orders.find((o) => String(o.id) === String(id));
  if (!order) return;

  const st = normalizeStatus(order.status);

  const orderId = order.orderId;
  if (!orderId) {
    setPageError('No se encontró order_id para esta orden.');
    return;
  }

  if (action === 'approve' && st === STATUS.PENDING_REVIEW) {
    try {
      setPageError('');
      await patchOrderStatus(orderId, STATUS.IN_KITCHEN);
      await loadOrdersFromBackend();
    } catch (e) {
      setPageError(normalizeErrorMessage(e));
    }
    return;
  }

  if (action === 'dispatch' && st === STATUS.READY_FOR_DISPATCH) {
    try {
      setPageError('');
      // Dispatchs should be direct now — no intermediate "assign manager" step.
      await patchOrderStatus(orderId, STATUS.EN_ROUTE);
      await loadOrdersFromBackend();
    } catch (e) {
      setPageError(normalizeErrorMessage(e));
    }
    return;
  }

  if (action === 'delivered' && st === STATUS.EN_ROUTE) {
    try {
      setPageError('');
      await patchOrderStatus(orderId, STATUS.DELIVERED);
      await loadOrdersFromBackend();
    } catch (e) {
      setPageError(normalizeErrorMessage(e));
    }
    return;
  }

  if (action === 'cancel' && st !== STATUS.DELIVERED && st !== STATUS.CANCELLED) {
    openCancelModal(order);
    return;
  }
}

async function loadOrdersFromBackend() {
  if (state.loading) return;
  state.loading = true;
  try {
    setPageError('');
    setMeta('Cargando órdenes...');

    const dpBase = getDpUrl();
    const dateParam = state.dateFilter || 'today';
    const url = dpBase
      ? `${dpBase}/api/dp/v1/orders?date=${encodeURIComponent(dateParam)}`
      : `/api/dp/v1/orders?date=${encodeURIComponent(dateParam)}`;
    const payload = await fetchJson(url, { method: 'GET' });

    const list = Array.isArray(payload) ? payload : [];
    state.orders = list.map(mapOrderFromApi);
    const dateLabel = dateParam === 'today' ? 'hoy' : dateParam;
    setMeta(`Mostrando: ${dateLabel} · ${state.orders.length} órdenes`);
    render();
  } catch (e) {
    state.orders = [];
    render();
    setPageError(normalizeErrorMessage(e));
    setMeta('');
  } finally {
    state.loading = false;
  }
}

function bindEvents() {
  const dateEl = document.getElementById('dpOrdersDate');
  if (dateEl && dateEl.dataset.dpBound !== '1') {
    dateEl.dataset.dpBound = '1';
    // Keep input in sync with current filter.
    dateEl.value = state.dateFilter === 'today' ? localTodayYYYYMMDD() : String(state.dateFilter || localTodayYYYYMMDD());
    dateEl.addEventListener('change', () => {
      state.dateFilter = normalizeDateFilter(dateEl.value);
      writeStoredDateFilter(state.dateFilter);
      loadOrdersFromBackend();
    });
  }

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

        const action = actionBtn.getAttribute('data-action');
        const orderKey = actionBtn.getAttribute('data-order-id');

        // Only show spinner for async status transitions.
        const shouldSpin = action === 'approve' || action === 'dispatch' || action === 'delivered';
        if (shouldSpin) setActionButtonLoading(actionBtn, true, 'Procesando...');

        Promise.resolve(handleAction(action, orderKey))
          .catch(() => {
            // Errors are already surfaced via setPageError.
          })
          .finally(() => {
            // Button may have been replaced by re-render; only restore if it still exists.
            if (actionBtn && actionBtn.isConnected) setActionButtonLoading(actionBtn, false);
          });
        return;
      }
    });
  }

  const refresh = document.getElementById('dpOrdersRefresh');
  if (refresh && refresh.dataset.dpBound !== '1') {
    refresh.dataset.dpBound = '1';
    refresh.addEventListener('click', () => {
      loadOrdersFromBackend();
    });
  }

  const cancelModal = document.getElementById('dpCancelModal');
  if (cancelModal && cancelModal.dataset.dpBound !== '1') {
    cancelModal.dataset.dpBound = '1';

    document.getElementById('dpCancelBackdrop')?.addEventListener('click', closeCancelModal);
    document.getElementById('dpCancelClose')?.addEventListener('click', closeCancelModal);
    document.getElementById('dpCancelKeep')?.addEventListener('click', closeCancelModal);
    document.getElementById('dpCancelConfirm')?.addEventListener('click', () => {
      confirmCancelModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const modal = document.getElementById('dpCancelModal');
      if (modal && !modal.classList.contains('hidden')) closeCancelModal();
    });
  }
}

export async function init() {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  // Restore the last selected date filter when navigating back/forth.
  state.dateFilter = readStoredDateFilter();

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
  await loadOrdersFromBackend();

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
