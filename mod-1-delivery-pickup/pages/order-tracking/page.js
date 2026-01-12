function normalizeBaseUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/g, '');
}

function getDpUrl() {
  return (
    (window.__APP_CONFIG__ && window.__APP_CONFIG__.DP_URL) ||
    localStorage.getItem('DP_URL') ||
    'http://localhost:3000'
  );
}

function getOrderIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    let id =
      url.searchParams.get('readableId') ||
      url.searchParams.get('readable_id') ||
      url.searchParams.get('orderId') ||
      url.searchParams.get('id') ||
      url.searchParams.get('note_id');

    if (!id) {
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.lastIndexOf('order-tracking');
      if (idx >= 0 && parts[idx + 1]) id = parts[idx + 1];
    }

    return id || '';
  } catch {
    return '';
  }
}

function getReadableIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get('readableId') ||
      url.searchParams.get('readable_id') ||
      ''
    );
  } catch {
    return '';
  }
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value && typeof value === 'object') return parseMoney(value.value ?? value.amount ?? value.price);
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9,.-]/g, '');
  if (!cleaned) return 0;
  let normalized = cleaned;
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else if (hasComma && !hasDot) normalized = normalized.replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function formatPrice(value) {
  const num = parseMoney(value);
  return '$' + num.toFixed(2);
}

function formatDateTime(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function statusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING_REVIEW':
      return 'Pendiente de revisión';
    case 'APPROVED':
      return 'Aprobado';
    case 'READY':
      return 'Listo';
    case 'DISPATCHED':
      return 'En camino';
    case 'CLOSED':
      return 'Entregado / Cerrado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status ? String(status) : '—';
  }
}

function statusProgress(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING_REVIEW':
      return 25;
    case 'APPROVED':
      return 45;
    case 'READY':
      return 70;
    case 'DISPATCHED':
      return 90;
    case 'CLOSED':
      return 100;
    case 'CANCELLED':
      return 100;
    default:
      return 15;
  }
}

function serviceTypeLabel(value) {
  switch (String(value || '').toUpperCase()) {
    case 'DELIVERY':
      return 'Entrega';
    case 'PICKUP':
      return 'Recogida';
    default:
      return value ? String(value) : '—';
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html;
}

async function loadOrder(noteId) {
  const base = normalizeBaseUrl(getDpUrl());
  const url = base ? `${base}/api/dp/v1/orders/${noteId}` : `/api/dp/v1/orders/${noteId}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && (data.message || data.error) ? (data.message || data.error) : 'No se pudo cargar la orden.';
    throw new Error(msg);
  }
  return data;
}

async function loadOrderWithFallback(primaryId, fallbackId) {
  const primary = String(primaryId || '').trim();
  const fallback = String(fallbackId || '').trim();
  if (!primary && !fallback) throw new Error('Falta el id de la orden.');
  if (!fallback || fallback === primary) return loadOrder(primary || fallback);

  try {
    return await loadOrder(primary);
  } catch (err) {
    try {
      return await loadOrder(fallback);
    } catch {
      throw err;
    }
  }
}

function renderOrder(order) {
  const readable = order.readable_id || order.readableId || '';
  const noteId = order.note_id || order.noteId || '';

  setText('orderTitle', 'Seguimiento de Pedido');
  setText('orderSubtitle', readable ? `Orden ${readable}` : noteId ? `Orden ${noteId}` : '');

  const st = order.current_status || order.status || '';
  setText('statusLabel', statusLabel(st));
  const bar = document.getElementById('statusBar');
  if (bar) bar.style.width = `${statusProgress(st)}%`;

  setText('serviceType', serviceTypeLabel(order.service_type));

  const eta = order.zone && order.zone.estimated_eta_minutes;
  setText('eta', eta ? `${eta} min` : '—');

  // Customer
  setText('customerName', order.customer_name || '—');
  setText('customerPhone', order.customer_phone || '—');
  setText('customerEmail', order.customer_email || '—');
  setText('deliveryAddress', order.delivery_address || '—');
  setText('zoneName', (order.zone && order.zone.zone_name) || '—');
  setText('createdAt', formatDateTime(order.timestamp_creation));

  // Items
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    setHtml('itemsWrap', '<div class="py-4 text-sm text-gray-600">Sin items.</div>');
  } else {
    setHtml(
      'itemsWrap',
      items
        .map(it => {
          const qty = Number(it.quantity || 0);
          const unit = parseMoney(it.unit_price);
          const subtotal = it.subtotal != null ? parseMoney(it.subtotal) : unit * qty;
          return `
            <div class="py-4 flex items-start justify-between">
              <div>
                <div class="font-medium text-gray-800">${it.product_name || 'Producto'}</div>
                <div class="text-xs text-gray-400">${qty}x · ${formatPrice(unit)}</div>
              </div>
              <div class="text-gray-800">${formatPrice(subtotal)}</div>
            </div>
          `;
        })
        .join('')
    );
  }

  // Totals
  const shipping = parseMoney(order.monto_costo_envio);
  const total = parseMoney(order.monto_total);
  const subtotal = items.reduce((acc, it) => {
    const qty = Number(it.quantity || 0);
    const unit = parseMoney(it.unit_price);
    const st = it.subtotal != null ? parseMoney(it.subtotal) : unit * qty;
    return acc + st;
  }, 0);

  setText('subtotal', formatPrice(subtotal));
  setText('shipping', formatPrice(shipping));
  setText('total', formatPrice(total || subtotal + shipping));

  // Logs
  const logs = Array.isArray(order.logs) ? order.logs : [];
  if (!logs.length) {
    setHtml('logsWrap', '<div class="py-4 text-sm text-gray-600">Sin historial.</div>');
  } else {
    setHtml(
      'logsWrap',
      logs
        .slice()
        .sort((a, b) => String(b.timestamp_transition || '').localeCompare(String(a.timestamp_transition || '')))
        .map(l => {
          const to = statusLabel(l.status_to);
          const ts = formatDateTime(l.timestamp_transition);
          return `
            <div class="py-3 flex items-center justify-between gap-4">
              <div class="text-sm text-gray-800">${to}</div>
              <div class="text-xs text-gray-500">${ts}</div>
            </div>
          `;
        })
        .join('')
    );
  }
}

(async function init() {
  const primaryId = getOrderIdFromUrl();
  const readableId = getReadableIdFromUrl();
  const fallbackId = readableId && readableId !== primaryId ? readableId : '';

  if (!primaryId && !fallbackId) {
    setText('status', 'Falta el id de la orden.');
    return;
  }

  setText('status', 'Cargando orden…');
  try {
    const order = await loadOrderWithFallback(primaryId, fallbackId);
    setText('status', '');
    renderOrder(order);
  } catch (err) {
    setText('status', err && err.message ? err.message : 'No se pudo cargar la orden.');
  }
})();
