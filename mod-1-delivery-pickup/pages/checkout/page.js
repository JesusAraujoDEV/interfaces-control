// Toggle Delivery / Pickup
const deliveryBtn = document.getElementById('deliveryBtn');
const pickupBtn = document.getElementById('pickupBtn');
const deliveryCoverageBlock = document.getElementById('deliveryCoverageBlock');
const coverage = document.getElementById('coverage');

// Zonas de cobertura (solo entrega)
const zoneInput = document.getElementById('zone');
const zoneChipsWrap = document.getElementById('zoneChips');
let zoneChips = Array.from(document.querySelectorAll('.zone-chip'));

// Teléfono: permitir solo caracteres típicos de números telefónicos
const phoneInput = document.getElementById('phone');

function sanitizePhone(value) {
  return String(value ?? '').replace(/[^0-9+()\-\s]/g, '');
}

if (phoneInput) {
  phoneInput.addEventListener('input', () => {
    const cleaned = sanitizePhone(phoneInput.value);
    if (cleaned !== phoneInput.value) phoneInput.value = cleaned;
  });

  phoneInput.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const allowedKeys = new Set([
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Tab',
      'Enter'
    ]);
    if (allowedKeys.has(e.key)) return;

    // Permite dígitos y símbolos comunes de teléfono
    if (/^[0-9+()\-\s]$/.test(e.key)) return;

    e.preventDefault();
  });
}

function normalizeBaseUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/g, '');
}

function getDpUrl() {
  return (
    (window.__APP_CONFIG__ && window.__APP_CONFIG__.DP_URL) ||
    localStorage.getItem('DP_URL') ||
    ''
  );
}

function formatEtaMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  return `${minutes} min`;
}

function formatShippingCost(value) {
  const num = parsePrice(value);
  if (!Number.isFinite(num) || num <= 0) return '$0.00';
  return '$' + num.toFixed(2);
}

function getSelectedZoneButton() {
  return zoneChips.find(btn => btn.classList.contains('bg-brand-800')) || null;
}

function getSelectedZone() {
  const btn = getSelectedZoneButton();
  if (!btn) return null;
  return {
    zone_id: btn.dataset.zoneId || '',
    zone_name: btn.dataset.zone || '',
    estimated_eta_minutes: btn.dataset.etaMinutes || '',
    shipping_cost: btn.dataset.shippingCost || ''
  };
}

function updateCoverageFromSelectedChip() {
  const selected = zoneChips.find(btn => btn.classList.contains('bg-brand-800'));
  if (!selected) return;

  const eta = selected.dataset.etaMinutes;
  const shipping = selected.dataset.shippingCost;
  const etaText = formatEtaMinutes(eta);
  const shippingText = formatShippingCost(shipping);

  if (deliveryBtn.getAttribute('aria-pressed') === 'true') {
    coverage.textContent = etaText ? `${shippingText} · ${etaText}` : shippingText;
  }
}

// Carrito (solo visualización en checkout)
const CART_KEY = 'dp_cart_v1';

function clearCartStorage() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    // ignore
  }
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
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
  const num = parsePrice(value);
  return '$' + num.toFixed(2);
}

function cartTotal(cart) {
  return (cart.items || []).reduce((acc, it) => acc + parsePrice(it.price) * (it.qty || 0), 0);
}

function renderCartModal() {
  const itemsEl = document.getElementById('cartModalItems');
  const totalEl = document.getElementById('cartModalTotal');
  if (!itemsEl || !totalEl) return;

  const cart = readCart();
  const items = cart.items || [];
  totalEl.textContent = formatPrice(cartTotal(cart));

  if (!items.length) {
    itemsEl.innerHTML = '<div class="py-4 text-sm text-gray-600">Tu carrito está vacío.</div>';
    return;
  }

  itemsEl.innerHTML = items
    .map(it => {
      const qty = it.qty || 0;
      const lineTotal = parsePrice(it.price) * qty;
      const notes = String(it.notes ?? '');
      return `
        <div class="py-4 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 truncate">${it.name ?? 'Producto'}</div>
            <div class="text-sm text-gray-600 mt-0.5">${formatPrice(it.price)} · x${qty}</div>
            <div class="mt-2">
              <label class="block text-xs text-gray-500">Notas por ítem (opcional)</label>
              <textarea
                data-note-id="${it.id}"
                rows="2"
                class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="Ej: sin cebolla, mucha aura…"
              >${notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')}</textarea>
            </div>
          </div>
          <div class="shrink-0 text-sm font-extrabold text-gray-900">${formatPrice(lineTotal)}</div>
        </div>
      `;
    })
    .join('');
}

function updateCartItemNotes(productId, notes) {
  const cart = readCart();
  const items = cart.items || [];
  const item = items.find(it => it.id === productId);
  if (!item) return;
  item.notes = String(notes ?? '');
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

function openCartModal() {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  renderCartModal();
  modal.classList.remove('hidden');
}

function closeCartModal() {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

document.getElementById('viewCartBtn')?.addEventListener('click', openCartModal);
document.getElementById('cartModalOverlay')?.addEventListener('click', closeCartModal);
document.getElementById('cartModalClose')?.addEventListener('click', closeCartModal);

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const modal = document.getElementById('cartModal');
  if (modal && !modal.classList.contains('hidden')) closeCartModal();
});

// Editar notas por ítem desde el modal de carrito
document.getElementById('cartModalItems')?.addEventListener('input', e => {
  const el = e.target;
  if (!(el instanceof HTMLTextAreaElement)) return;
  const id = el.getAttribute('data-note-id');
  if (!id) return;
  updateCartItemNotes(id, el.value);
});
// Notas modal bindings
document.getElementById('notesConfirm')?.addEventListener('click', () => {
  closeNotesModal();
  // Submit the pending order flow; mode was set when opening the modal
  submitOrderFlow(pendingOrderMode || localStorage.getItem('dp_service_type') || 'delivery');
});
document.getElementById('notesCancel')?.addEventListener('click', () => {
  closeNotesModal();
});
document.getElementById('notesModalClose')?.addEventListener('click', () => {
  closeNotesModal();
});
document.getElementById('notesBackdrop')?.addEventListener('click', () => {
  closeNotesModal();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const modal = document.getElementById('notesModal');
  if (modal && !modal.classList.contains('hidden')) closeNotesModal();
});
function setZone(zone) {
  const byName = zoneChips.find(btn => btn.dataset.zone === zone);
  const byId = zoneChips.find(btn => btn.dataset.zoneId === zone);
  const target = byName || byId || null;

  // Guardamos zone_id si existe; si no, dejamos el nombre (fallback)
  zoneInput.value = target ? (target.dataset.zoneId || target.dataset.zone || '') : String(zone ?? '');
  zoneChips.forEach(btn => {
    const isActive = target ? btn === target : btn.dataset.zone === zone;
    btn.classList.toggle('bg-brand-800', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('border-brand-800', isActive);
    btn.classList.toggle('bg-white', !isActive);
    btn.classList.toggle('text-gray-700', !isActive);
    btn.classList.toggle('border-gray-200', !isActive);
  });

  updateCoverageFromSelectedChip();
}

function renderZones(zones) {
  if (!zoneChipsWrap) return;

  zoneChipsWrap.innerHTML = zones
    .map(z => {
      const name = String(z.zone_name ?? '').trim();
      const zoneId = String(z.zone_id ?? '').trim();
      const eta = z.estimated_eta_minutes;
      const shipping = z.shipping_cost;

      // data-zone mantiene compatibilidad con setZone(name)
      return `
        <button
          type="button"
          data-zone="${name.replace(/"/g, '&quot;')}"
          data-zone-id="${zoneId.replace(/"/g, '&quot;')}"
          data-eta-minutes="${String(eta ?? '').replace(/"/g, '&quot;')}"
          data-shipping-cost="${String(shipping ?? '').replace(/"/g, '&quot;')}"
          class="zone-chip px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-gray-300"
        >${name}</button>
      `;
    })
    .join('');

  zoneChips = Array.from(zoneChipsWrap.querySelectorAll('.zone-chip'));
}

async function loadZones() {
  try {
    const base = normalizeBaseUrl(getDpUrl());
    const url = base ? `${base}/api/dp/v1/zones` : '/api/dp/v1/zones';

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`zones_fetch_${res.status}`);
    const data = await res.json();

    const zones = Array.isArray(data) ? data : [];
    const active = zones.filter(z => z && z.is_active);
    if (!active.length) return;

    renderZones(active);

    const preferred = active.find(z => String(z.zone_name).toLowerCase() === 'prebo');
    const initial = preferred?.zone_name || active[0].zone_name;
    if (initial) setZone(initial);
  } catch {
    // Fallback: mantener chips hardcodeados si el endpoint falla
    if (zoneChips.length) setZone(zoneChips[0].dataset.zone);
  }
}

if (zoneChipsWrap) {
  zoneChipsWrap.addEventListener('click', e => {
    const btn = e.target.closest('.zone-chip');
    if (!btn) return;
    setZone(btn.dataset.zone);
  });
}

function setMode(mode) {
  if (mode === 'delivery') {
    deliveryBtn.classList.remove('bg-gray-100', 'text-gray-700');
    deliveryBtn.classList.add('bg-brand-800', 'text-white');
    deliveryBtn.setAttribute('aria-pressed', 'true');

    pickupBtn.classList.remove('bg-brand-800', 'text-white');
    pickupBtn.classList.add('bg-gray-100', 'text-gray-700');
    pickupBtn.setAttribute('aria-pressed', 'false');

    deliveryCoverageBlock.classList.remove('hidden');
    coverage.textContent = 'Selecciona una zona para validar cobertura';
  } else {
    pickupBtn.classList.remove('bg-gray-100', 'text-gray-700');
    pickupBtn.classList.add('bg-brand-800', 'text-white');
    pickupBtn.setAttribute('aria-pressed', 'true');

    deliveryBtn.classList.remove('bg-brand-800', 'text-white');
    deliveryBtn.classList.add('bg-gray-100', 'text-gray-700');
    deliveryBtn.setAttribute('aria-pressed', 'false');

    // Para recogida, ocultar dirección y actualizar mensaje
    deliveryCoverageBlock.classList.add('hidden');
    coverage.textContent = 'Recogida — no requiere envío';
  }
}

deliveryBtn.addEventListener('click', () => setMode('delivery'));
pickupBtn.addEventListener('click', () => setMode('pickup'));

// Initialize default
setMode('delivery');

// Zonas desde backend (fallback a las hardcodeadas si falla)
loadZones();

// Basic validation
const form = document.getElementById('checkoutForm');
const errName = document.getElementById('err-name');
const errPhone = document.getElementById('err-phone');
const errEmail = document.getElementById('err-email');
const errAddress = document.getElementById('err-address');
const errZone = document.getElementById('err-zone');
const errSubmit = document.getElementById('err-submit');
const proceedBtn = document.getElementById('proceedBtn');

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function setSubmitError(message) {
  if (!errSubmit) return;
  if (!message) {
    errSubmit.textContent = '';
    errSubmit.classList.add('hidden');
    return;
  }
  errSubmit.textContent = message;
  errSubmit.classList.remove('hidden');
}

function buildOrderPayload() {
  const isDelivery = deliveryBtn.getAttribute('aria-pressed') === 'true';
  const service_type = isDelivery ? 'DELIVERY' : 'PICKUP';
  const zone = isDelivery ? getSelectedZone() : null;

  const cart = readCart();
  const items = (cart.items || [])
    .filter(it => (it.qty || 0) > 0)
    .map(it => {
      const notes = String(it.notes ?? '').trim();
      const row = {
        product_id: it.id,
        product_name: it.name,
        quantity: it.qty,
        unit_price: parsePrice(it.price)
      };
      if (notes) row.notes = notes;
      return row;
    });

  const customer = {
    name: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: isDelivery
      ? (document.getElementById('addressDetail') ? document.getElementById('addressDetail').value.trim() : '')
      : ''
  };

  const payload = {
    service_type,
    customer,
    items
  };

  if (isDelivery) payload.zone_id = zone && zone.zone_id ? zone.zone_id : '';
  // Nota opcional para cocina (campo añadido en el modal)
  try {
    const noteEl = document.getElementById('orderNote');
    const note = noteEl ? String(noteEl.value || '').trim() : '';
    if (note) payload.notes = note;
  } catch (e) {
    // ignore
  }
  return payload;
}

// Estado temporal cuando el usuario confirma el formulario y se muestra el modal de notas
let pendingOrderMode = null;

function openNotesModal() {
  const modal = document.getElementById('notesModal');
  if (!modal) return;
  modal.classList.remove('hidden');
}

function closeNotesModal() {
  const modal = document.getElementById('notesModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

async function submitOrderFlow(mode) {
  if (proceedBtn) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = 'Creando orden…';
  }

  try {
    const result = await createOrder();

    // Limpiar carrito
    clearCartStorage();

    const orderId = result && (result.order_id || result.id || result.orderId);
    const readableId = result && (result.readable_id || result.readableId);
    const trackingId = readableId || orderId;

    if (trackingId) {
      const nextUrl = new URL(`/order-tracking/${encodeURIComponent(String(trackingId))}`, window.location.href);
      nextUrl.searchParams.set('mode', mode);
      window.location.href = nextUrl.toString();
    } else {
      const nextUrl = new URL('/mod-1-delivery-pickup/pages/order-tracking/index.html', window.location.href);
      nextUrl.searchParams.set('mode', mode);
      window.location.href = nextUrl.toString();
    }
  } catch (err) {
    setSubmitError(err && err.message ? err.message : 'No se pudo crear la orden.');
  } finally {
    if (proceedBtn) {
      proceedBtn.disabled = false;
      proceedBtn.textContent = 'Continuar';
    }
    pendingOrderMode = null;
  }
}

async function createOrder() {
  const base = normalizeBaseUrl(getDpUrl());
  const url = base ? `${base}/api/dp/v1/orders` : '/api/dp/v1/orders';
  const payload = buildOrderPayload();

  if (!payload.items.length) {
    throw new Error('Tu carrito está vacío. Agrega productos antes de continuar.');
  }
  if (payload.service_type === 'DELIVERY' && !payload.zone_id) {
    throw new Error('No pudimos identificar la zona (zone_id). Selecciona una zona válida.');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && (data.message || data.error) ? (data.message || data.error) : 'No se pudo crear la orden.';
    throw new Error(msg);
  }

  return data;
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  let valid = true;

  const nameVal = document.getElementById('fullName').value.trim();
  const phoneVal = document.getElementById('phone').value.trim();
  const emailVal = document.getElementById('email').value.trim();
  const addressVal = document.getElementById('addressDetail')
    ? document.getElementById('addressDetail').value.trim()
    : '';
  const zoneVal = zoneInput ? zoneInput.value.trim() : '';

  // Reset errors
  [errName, errPhone, errEmail, errAddress, errZone].forEach(el => el.classList.add('hidden'));
  setSubmitError('');

  if (!nameVal) {
    errName.classList.remove('hidden');
    valid = false;
  }
  if (!phoneVal) {
    errPhone.classList.remove('hidden');
    valid = false;
  }
  if (!emailVal || !validateEmail(emailVal)) {
    errEmail.classList.remove('hidden');
    valid = false;
  }

  // Address required only for delivery
  if (deliveryBtn.getAttribute('aria-pressed') === 'true') {
    if (!zoneVal) {
      errZone.classList.remove('hidden');
      valid = false;
    }
    if (!addressVal) {
      errAddress.classList.remove('hidden');
      valid = false;
    }
  }

  if (valid) {
    // En lugar de crear la orden directamente, abrimos un modal para permitir añadir una nota opcional.
    const mode = deliveryBtn.getAttribute('aria-pressed') === 'true' ? 'delivery' : 'pickup';
    localStorage.setItem('dp_service_type', mode);
    pendingOrderMode = mode;
    openNotesModal();
  } else {
    // Scroll to first error
    const firstErr = document.querySelector('p.text-red-600:not(.hidden)');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
