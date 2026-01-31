function normalizeBaseUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/g, '');
}

const CART_KEY = 'dp_cart_v1';

function clearCartStorage() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    // ignore
  }
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

  // Respaldo: si el usuario vuelve al menú desde aquí, que el carrito no quede pegado.
  clearCartStorage();

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

  const reorderBtn = document.getElementById('dpReorderBtn');
  if (reorderBtn && !reorderBtn.dataset.bound) {
    reorderBtn.dataset.bound = '1';
    reorderBtn.addEventListener('click', () => {
      clearCartStorage();
    });
  }

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

          // Excluded ingredients
          const excludedNames = Array.isArray(it.excluded_recipe_names) ? it.excluded_recipe_names : [];
          const excludedHtml = excludedNames.length > 0
            ? `<div class="text-xs mt-1" style="color: #dc2626;">Sin: ${excludedNames.join(', ')}</div>`
            : '';

          return `
            <div class="py-4 flex items-start justify-between">
              <div>
                <div class="font-medium text-gray-800">${it.product_name || 'Producto'}</div>
                <div class="text-xs text-gray-400">${qty}x · ${formatPrice(unit)}</div>
                ${excludedHtml}
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

  // Show/hide PDF button and bind event
  const pdfContainer = document.getElementById('pdfButtonContainer');
  const pdfBtn = document.getElementById('downloadPdfBtn');

  if (st === 'DELIVERED' || st === 'CANCELLED') {
    if (pdfContainer) pdfContainer.classList.remove('hidden');

    // Update button color based on status
    if (pdfBtn) {
      pdfBtn.className = st === 'DELIVERED'
        ? 'w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 font-semibold'
        : 'w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 font-semibold';
    }

    // Bind PDF generation (only once)
    if (pdfBtn && !pdfBtn.dataset.bound) {
      pdfBtn.dataset.bound = '1';
      pdfBtn.addEventListener('click', () => generateDeliveryNotePDF(order));
    }
  } else {
    if (pdfContainer) pdfContainer.classList.add('hidden');
  }
}

// Generate epic PDF delivery note
async function ensureJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  if (window.jsPDF) return window.jsPDF;
  const url = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  if (document.querySelector(`script[src="${url}"]`)) {
    for (let i = 0; i < 50; i++) {
      if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
      if (window.jsPDF) return window.jsPDF;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.head.appendChild(s);
  }).catch(() => null);
  return (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
}

async function generateDeliveryNotePDF(order) {
  const jsPDFCtor = await ensureJsPDF();
  if (!jsPDFCtor) return alert('No se pudo cargar la librería jsPDF para generar el PDF.');
  const ok = await ensureAutoTable();
  if (!ok) return alert('No se pudo cargar el plugin jspdf-autotable necesario para generar tablas en el PDF.');
  const doc = new jsPDFCtor('p', 'mm', 'a4');

  const readableId = order.readable_id || order.readableId || 'N/A';
  const orderStatus = normalizeStatus(order.current_status || order.status);
  const isDelivered = orderStatus === 'DELIVERED';

  // Colors
  const brandGreen = [15, 74, 34]; // #0f4a22
  const textGray = [55, 65, 81]; // gray-700
  const lightGray = [156, 163, 175]; // gray-400

  // Header - Brand
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandGreen);
  doc.text('Charlotte Bistró', 105, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...lightGray);
  doc.text('DONDE EL SABOR TOMA LA RUTA', 105, 26, { align: 'center' });

  // Title - NOTA DE ENTREGA
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textGray);
  doc.text('NOTA DE ENTREGA', 105, 40, { align: 'center' });

  // Control Number
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandGreen);
  doc.text(readableId, 105, 48, { align: 'center' });

  // Emission date and status
  const emissionDate = formatDateTime(order.timestamp_closure || order.timestamp_approved || order.timestamp_creation);
  const statusText = isDelivered ? 'ENTREGADO' : 'CANCELADO';
  const statusColor = isDelivered ? [22, 163, 74] : [220, 38, 38]; // green-600 : red-600

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textGray);
  doc.text(`Fecha de Emisión: ${emissionDate}`, 20, 58);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...statusColor);
  doc.text(`Estado: ${statusText}`, 20, 64);

  // Client information box
  doc.setDrawColor(...lightGray);
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(20, 72, 170, 30, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandGreen);
  doc.text('Datos del Cliente', 25, 79);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textGray);
  doc.text(`Cliente: ${order.customer_name || '—'}`, 25, 85);
  doc.text(`Teléfono: ${order.customer_phone || '—'}`, 25, 90);
  doc.text(`Dirección: ${order.delivery_address || '—'}`, 25, 95);
  doc.text(`Zona: ${(order.zone && order.zone.zone_name) || '—'}`, 25, 100);

  // Items table
  const items = Array.isArray(order.items) ? order.items : [];
  const tableData = items.map(it => {
    const qty = Number(it.quantity || 0);
    const unit = parseMoney(it.unit_price);
    const subtotal = it.subtotal != null ? parseMoney(it.subtotal) : unit * qty;

    let description = it.product_name || 'Producto';
    if (it.notes && it.notes.trim()) {
      description += `\n(${it.notes})`;
    }
    if (Array.isArray(it.excluded_recipe_names) && it.excluded_recipe_names.length > 0) {
      description += `\nSin: ${it.excluded_recipe_names.join(', ')}`;
    }

    return [
      qty.toString(),
      description,
      formatPrice(unit),
      formatPrice(subtotal)
    ];
  });

  doc.autoTable({
    startY: 108,
    head: [['Cant.', 'Descripción', 'Unitario', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: brandGreen,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textGray
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 90 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 }
    },
    margin: { left: 20, right: 20 }
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  const shipping = parseMoney(order.monto_costo_envio);
  const total = parseMoney(order.monto_total);
  const subtotal = items.reduce((acc, it) => {
    const qty = Number(it.quantity || 0);
    const unit = parseMoney(it.unit_price);
    const st = it.subtotal != null ? parseMoney(it.subtotal) : unit * qty;
    return acc + st;
  }, 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textGray);

  const rightX = 190;
  doc.text(`Subtotal: ${formatPrice(subtotal)}`, rightX, finalY, { align: 'right' });
  doc.text(`Envío: ${formatPrice(shipping)}`, rightX, finalY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL: ${formatPrice(total)}`, rightX, finalY + 14, { align: 'right' });

  // Payment method
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de Pago: ${order.payment_type || '—'}`, rightX, finalY + 20, { align: 'right' });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'italic');
  doc.text('Gracias por tu preferencia. ¡Vuelve pronto!', 105, pageHeight - 15, { align: 'center' });
  doc.text('Charlotte Bistró - Donde el sabor toma la ruta', 105, pageHeight - 10, { align: 'center' });

  // Save PDF
  const filename = `Nota_Entrega_${readableId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}

// Global polling state
let pollingInterval = null;
let currentOrderData = null;

// Start smart polling (stops when DELIVERED/CANCELLED)
function startPolling(orderKey) {
  // Clear any existing interval
  if (pollingInterval) clearInterval(pollingInterval);

  const POLL_INTERVAL_MS = 12000; // 12 seconds

  pollingInterval = setInterval(async () => {
    try {
      const order = await loadOrder(orderKey);
      const newStatus = normalizeStatus(order.current_status || order.status);
      const oldStatus = currentOrderData ? normalizeStatus(currentOrderData.current_status || currentOrderData.status) : null;

      // If status changed, update the UI with smooth animations
      if (newStatus !== oldStatus) {
        renderOrder(order);
      }

      // Update current data
      currentOrderData = order;

      // Stop polling if order reached final state
      if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    } catch (err) {
      console.error('Error polling order:', err);
      // Don't stop polling on error, just skip this iteration
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
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
    currentOrderData = order;
    setText('status', '');
    renderOrder(order);

    // Start live polling if not in final state
    const st = normalizeStatus(order.current_status || order.status);
    if (st !== 'DELIVERED' && st !== 'CANCELLED') {
      startPolling(primaryId || fallbackId);
    }
  } catch (err) {
    setText('status', err && err.message ? err.message : 'No se pudo cargar la orden.');
  }
})();
