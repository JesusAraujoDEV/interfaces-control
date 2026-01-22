import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

function getOrderIdFromPath() {
  const m = window.location.pathname.match(/^\/admin\/dp\/orders\/(.+)$/);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return '12345';
}

function normalizeBaseUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/g, '');
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

function byId(id) {
  return document.getElementById(id);
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', Boolean(hidden));
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value) {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(num)) return '—';
  return '$' + num.toFixed(2);
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

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
  return Object.values(STATUS).includes(s) ? s : String(value || '—');
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
  if (v === 'DELIVERY') return 'Entrega';
  if (v === 'PICKUP') return 'Pickup';
  return String(value || '—');
}

function renderListItem(label, value, mono = false) {
  return `<li class="flex items-start justify-between gap-4">
    <span class="text-slate-500 text-xs">${escapeHtml(label)}</span>
    <span class="text-slate-800 text-sm font-semibold ${mono ? 'dp-mono' : ''}">${escapeHtml(value ?? '—')}</span>
  </li>`;
}

function renderTimestamps(order) {
  const list = byId('dpOrderTimestamps');
  if (!list) return;

  const rows = [
    ['Creación', formatDateTime(order.timestamp_creation)],
    ['Aprobación', formatDateTime(order.timestamp_approved)],
    ['Listo', formatDateTime(order.timestamp_ready)],
    ['Despacho', formatDateTime(order.timestamp_dispatched)],
    ['Cierre', formatDateTime(order.timestamp_closure)],
  ];

  list.innerHTML = rows
    .map(([k, v]) => `<li class="flex items-center justify-between gap-4">
      <span class="text-xs text-slate-500">${escapeHtml(k)}</span>
      <span class="text-sm font-semibold text-slate-800 dp-mono">${escapeHtml(v)}</span>
    </li>`)
    .join('');
}

function renderItems(order) {
  const tbody = byId('dpOrderItems');
  const countEl = byId('dpOrderItemsCount');
  if (!tbody) return;

  const items = Array.isArray(order.items) ? order.items : [];
  if (countEl) countEl.textContent = `${items.length} ítems`;

  if (!items.length) {
    tbody.innerHTML = `<tr><td class="py-3 text-slate-600" colspan="4">Sin ítems</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map((it) => {
      const notes = String(it?.notes ?? '').trim();
      const notesHtml = notes
        ? `<div class="mt-1 text-xs text-slate-500"><span class="font-semibold text-slate-600">Notas:</span> ${escapeHtml(notes)}</div>`
        : '';
      return `<tr class="border-t border-slate-100">
        <td class="py-3 pr-3">
          <div class="font-semibold text-slate-900">${escapeHtml(it.product_name ?? 'Producto')}</div>
          ${notesHtml}
        </td>
        <td class="py-3 pr-3 text-slate-700">${escapeHtml(it.quantity ?? '—')}</td>
        <td class="py-3 pr-3 text-slate-700">${escapeHtml(formatMoney(it.unit_price))}</td>
        <td class="py-3 text-right font-extrabold text-slate-900">${escapeHtml(formatMoney(it.subtotal))}</td>
      </tr>`;
    })
    .join('');
}

function renderNotes(order) {
  const card = byId('dpOrderNotesCard');
  const host = byId('dpOrderNotes');
  if (!card || !host) return;

  const candidates = [
    order?.notes,
    order?.order_notes,
    order?.orderNotes,
    order?.customer_notes,
    order?.customerNotes,
  ];

  const orderNote = candidates
    .map((v) => String(v ?? '').trim())
    .find((v) => v.length > 0) || '';

  const items = Array.isArray(order?.items) ? order.items : [];
  const itemNotes = items
    .map((it) => ({ name: it?.product_name, note: String(it?.notes ?? '').trim() }))
    .filter((x) => x.note.length > 0);

  const lines = [];
  if (orderNote) lines.push(orderNote);
  if (itemNotes.length) {
    if (orderNote) lines.push('');
    lines.push('Notas por ítem:');
    for (const n of itemNotes) {
      const label = String(n.name ?? 'Ítem').trim() || 'Ítem';
      lines.push(`- ${label}: ${n.note}`);
    }
  }

  const text = lines.join('\n').trim();
  setHidden(card, !text);
  host.textContent = text || '—';
}

function renderLogs(order) {
  const host = byId('dpOrderLogs');
  if (!host) return;
  const logs = Array.isArray(order.logs) ? order.logs : [];

  if (!logs.length) {
    host.innerHTML = `<li class="text-slate-600 bg-white border border-slate-200 rounded-2xl p-6">Sin logs</li>`;
    return;
  }

  host.innerHTML = logs
    .slice()
    .sort((a, b) => new Date(b.timestamp_transition).getTime() - new Date(a.timestamp_transition).getTime())
    .map((l) => {
      const actor = l?.manager?.name || l?.manager?.manager_name || (l?.manager_id ? `Manager ${l.manager_id}` : 'System');
      const from = l?.status_from ?? '—';
      const to = l?.status_to ?? '—';
      return `<li class="dp-log">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-sm font-extrabold text-slate-900">${escapeHtml(from)} → ${escapeHtml(to)}</div>
            <div class="mt-1 dp-log-meta">${escapeHtml(formatDateTime(l.timestamp_transition))} · ${escapeHtml(actor)}</div>
          </div>
          <div class="shrink-0 dp-log-meta dp-mono">${escapeHtml(l.log_id ?? '')}</div>
        </div>
      </li>`;
    })
    .join('');
}

function renderZone(order) {
  const zoneEl = byId('dpOrderZone');
  const badgeEl = byId('dpOrderZoneBadge');
  if (!zoneEl) return;

  const zone = order.zone;
  if (!zone) {
    zoneEl.textContent = '—';
    if (badgeEl) badgeEl.textContent = '';
    return;
  }

  const active = typeof zone.is_active === 'boolean' ? zone.is_active : null;
  if (badgeEl) badgeEl.textContent = active === null ? '' : (active ? 'Activa' : 'Inactiva');

  zoneEl.innerHTML = `<div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div class="flex items-center justify-between gap-4">
      <div class="font-extrabold text-slate-900">${escapeHtml(zone.zone_name ?? 'Zona')}</div>
      <div class="text-sm font-extrabold text-slate-900">${escapeHtml(formatMoney(zone.shipping_cost))}</div>
    </div>
    <div class="mt-2 text-sm text-slate-600">ETA estimado: <span class="font-semibold text-slate-800">${escapeHtml(String(zone.estimated_eta_minutes ?? '—'))} min</span></div>
    <div class="mt-2 text-xs text-slate-500 dp-mono">zone_id: ${escapeHtml(zone.zone_id ?? '')}</div>
  </div>`;
}

function renderOrder(order) {
  const titleEl = byId('dpOrderTitle');
  const subtitleEl = byId('dpOrderSubtitle');
  const badgeEl = byId('dpOrderStatusBadge');

  const readableId = order.readable_id ?? order.readableId ?? '—';
  const orderId = order.order_id ?? '—';
  const status = order.current_status ?? order.status ?? '—';
  const normalized = normalizeStatus(status);

  if (titleEl) titleEl.textContent = `Pedido ${readableId}`;
  if (subtitleEl) subtitleEl.textContent = `order_id: ${orderId}`;

  if (badgeEl) {
    badgeEl.className = `dp-badge ${statusTone(status)}`;
    badgeEl.textContent = statusLabel(status);
    setHidden(badgeEl, false);
  }

  const cancelReasonRow = byId('dpOrderCancelReasonRow');
  const cancelReasonEl = byId('dpOrderCancelReason');
  const cancelReason = order.reason_cancelled ?? order.reasonCancelled ?? order.cancel_reason ?? order.cancelReason ?? '';
  const showCancelReason = normalized === STATUS.CANCELLED && String(cancelReason || '').trim().length > 0;
  setHidden(cancelReasonRow, !showCancelReason);
  if (cancelReasonEl) cancelReasonEl.textContent = showCancelReason ? String(cancelReason).trim() : '—';

  setText(byId('dpOrderCustomer'), order.customer_name ?? '—');
  setText(
    byId('dpOrderCustomerMeta'),
    [order.customer_phone, order.customer_email].filter(Boolean).join(' · ') || '—'
  );
  setText(byId('dpOrderService'), serviceTypeLabel(order.service_type));

  const address = String(order.service_type || '').toUpperCase() === 'DELIVERY'
    ? (order.delivery_address || '—')
    : 'Pickup / mostrador';
  setText(byId('dpOrderAddress'), address);

  setText(byId('dpOrderTotal'), formatMoney(order.monto_total));
  setText(byId('dpOrderShipping'), formatMoney(order.monto_costo_envio));

  renderTimestamps(order);
  renderNotes(order);
  renderItems(order);
  renderZone(order);
  renderLogs(order);
}

let state = { loading: false, orderId: null };

async function loadOrder(orderId) {
  if (state.loading) return;
  state.loading = true;

  const errorEl = byId('dpOrderError');
  setHidden(errorEl, true);
  setText(errorEl, '');
  setText(byId('dpOrderSubtitle'), 'Cargando…');

  try {
    const dpBase = getDpUrl();
    const url = dpBase
      ? `${dpBase}/api/dp/v1/orders/${encodeURIComponent(orderId)}`
      : `/api/dp/v1/orders/${encodeURIComponent(orderId)}`;
    const order = await fetchJson(url, { method: 'GET' });
    renderOrder(order);
  } catch (e) {
    const msg = normalizeErrorMessage(e);
    setText(errorEl, `⚠️ ${msg}`);
    setHidden(errorEl, false);
  } finally {
    state.loading = false;
  }
}

export async function init(params = {}) {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  if (!window.__dpSpaRouter && typeof window.goTo !== 'function') {
    window.goTo = function goTo(pathOrUrl) {
      const u = new URL(pathOrUrl, window.location.href);
      u.search = window.location.search;
      window.location.href = u.toString();
    };
  }

  const id = params.orderId || getOrderIdFromPath();
  state.orderId = id;

  const refreshBtn = byId('dpOrderRefresh');
  if (refreshBtn && refreshBtn.dataset.dpBound !== '1') {
    refreshBtn.dataset.dpBound = '1';
    refreshBtn.addEventListener('click', () => loadOrder(state.orderId));
  }

  await loadOrder(id);
}

if (!window.__dpSpaRouter) {
  window.addEventListener('DOMContentLoaded', () => {
    init();
  }, { once: true });
}
