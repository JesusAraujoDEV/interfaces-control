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
      url.searchParams.get('order_id');

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

function normalizeStatus(rawStatus) {
  const st = String(rawStatus || '').toUpperCase();

  // Backward compatibility: older/other APIs used different names.
  switch (st) {
    case 'APPROVED':
      return 'IN_KITCHEN';
    case 'READY':
      return 'READY_FOR_DISPATCH';
    case 'DISPATCHED':
      return 'EN_ROUTE';
    case 'CLOSED':
      return 'DELIVERED';
    default:
      return st;
  }
}

function statusLabel(status) {
  switch (normalizeStatus(status)) {
    case 'PENDING_REVIEW':
      return 'Pendiente de revisión';
    case 'IN_KITCHEN':
      return 'En cocina';
    case 'READY_FOR_DISPATCH':
      return 'Listo para despacho';
    case 'EN_ROUTE':
      return 'En ruta';
    case 'DELIVERED':
      return 'Entregado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status ? String(status) : '—';
  }
}

function statusProgress(status) {
  const st = normalizeStatus(status);

  if (st === 'CANCELLED') return 100;
  if (st === 'DELIVERED') return 100;

  // Progress based on how close the order is to DELIVERED.
  const flow = ['PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED'];
  const idx = flow.indexOf(st);
  if (idx < 0) return 15;

  // Use a slightly "easing" curve so it feels more linear visually.
  switch (idx) {
    case 0:
      return 18;
    case 1:
      return 40;
    case 2:
      return 65;
    case 3:
      return 88;
    default:
      return 15;
  }
}

function statusBarColor(status) {
  const st = normalizeStatus(status);
  switch (st) {
    case 'CANCELLED':
      return '#dc2626'; // red-600
    case 'DELIVERED':
      return '#16a34a'; // green-600
    case 'EN_ROUTE':
      return '#22c55e'; // green-500
    case 'READY_FOR_DISPATCH':
      return '#f97316'; // orange-500
    case 'IN_KITCHEN':
      return '#f59e0b'; // amber-500
    case 'PENDING_REVIEW':
      return '#94a3b8'; // slate-400
    default:
      return '#0f4a22'; // brand-800 fallback
  }
}

function setModalText(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
}

function setModalHtml(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html;
}

function closeEndStateModal() {
  const modal = document.getElementById('dpEndStateModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function showEndStateModal(status) {
  const st = normalizeStatus(status);
  if (st !== 'DELIVERED' && st !== 'CANCELLED') return;

  const modal = document.getElementById('dpEndStateModal');
  if (!modal) return;

  if (st === 'DELIVERED') {
    setModalText('dpEndStateTitle', '¡Su pedido ha sido entregado!');
    setModalText(
      'dpEndStateSubtitle',
      'Gracias por confiar en nosotros. Esperamos que lo disfrutes.'
    );
    setModalHtml(
      'dpEndStateBody',
      `<div class="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
        <div class="font-semibold text-emerald-900">Todo listo ✅</div>
        <ul class="mt-2 space-y-1 text-emerald-900/90">
          <li>• Pedido marcado como <span class="font-semibold">Entregado</span></li>
          <li>• Si tuviste algún problema, soporte está disponible</li>
          <li>• ¿Te gustó? ¡Vuelve cuando quieras!</li>
        </ul>
      </div>`
    );
  } else {
    setModalText('dpEndStateTitle', 'Disculpe, su pedido ha sido cancelado');
    setModalText(
      'dpEndStateSubtitle',
      'Entendemos lo frustrante que es. Podemos ayudarte a pedir otra vez.'
    );
    setModalHtml(
      'dpEndStateBody',
      `<div class="rounded-xl bg-red-50 border border-red-100 p-4">
        <div class="font-semibold text-red-900">Estado: Cancelado</div>
        <p class="mt-2 text-red-900/90">
          Si deseas, puedes volver al menú para realizar un nuevo pedido.
        </p>
      </div>`
    );
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const closeBtn = document.getElementById('dpEndStateClose');
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = '1';
    closeBtn.addEventListener('click', closeEndStateModal);
  }

  const backdrop = document.getElementById('dpEndStateBackdrop');
  if (backdrop && !backdrop.dataset.bound) {
    backdrop.dataset.bound = '1';
    backdrop.addEventListener('click', closeEndStateModal);
  }

  if (!document.body.dataset.dpEndStateEscBound) {
    document.body.dataset.dpEndStateEscBound = '1';
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeEndStateModal();
    });
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

async function loadOrder(orderKey) {
  const base = normalizeBaseUrl(getDpUrl());
  const url = base ? `${base}/api/dp/v1/orders/${orderKey}` : `/api/dp/v1/orders/${orderKey}`;

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
  const orderId = order.order_id || '';

  setText('orderTitle', 'Seguimiento de Pedido');
  setText('orderSubtitle', readable ? `Orden ${readable}` : orderId ? `Orden ${orderId}` : '');

  const st = order.current_status || order.status || '';
  setText('statusLabel', statusLabel(st));
  const bar = document.getElementById('statusBar');
  if (bar) {
    bar.style.width = `${statusProgress(st)}%`;
    bar.style.backgroundColor = statusBarColor(st);
  }

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

  // If user reloads/returns and order is final, show the modal.
  showEndStateModal(st);
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
