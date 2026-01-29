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

function currentShippingCost() {
  try {
    const zone = getSelectedZone();
    if (!zone || !zone.shipping_cost) return 0;
    return parsePrice(zone.shipping_cost);
  } catch {
    return 0;
  }
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

// --- Helpers / KITCHEN URL (paralelo a shared menu) --------------------------------
const KITCHEN_URL = (window.__APP_CONFIG__ && window.__APP_CONFIG__.KITCHEN_URL) || localStorage.getItem('KITCHEN_URL') || 'https://charlotte-cocina.onrender.com';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cartTotal(cart) {
  return (cart.items || []).reduce((acc, it) => acc + parsePrice(it.price) * (it.qty || 0), 0);
}

function updateQty(itemUid, delta) {
  const cart = readCart();
  const items = cart.items || [];
  const item = items.find(it => it.uid === itemUid);
  if (!item) return;
  item.qty = (item.qty || 0) + delta;
  cart.items = items.filter(it => (it.qty || 0) > 0);
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  renderCartModal();
}

function removeItem(itemUid) {
  const cart = readCart();
  cart.items = (cart.items || []).filter(it => it.uid !== itemUid);
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  renderCartModal();
}

async function fetchProductRecipe(productId) {
  try {
    const res = await fetch(`${KITCHEN_URL}/api/kitchen/products/${productId}/recipe`, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : json.items || json.data || [];
  } catch { return []; }
}

function ensureIngredientsModal() {
  let modal = document.getElementById('ingredientsModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'ingredientsModal';
  modal.className = 'hidden fixed inset-0 z-50';
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/40"></div>
    <div class="relative min-h-full flex items-end sm:items-center justify-center p-4">
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <h2 id="ingredientsModalTitle" class="text-lg font-extrabold text-gray-900">Ingredientes</h2>
            <button id="ingredientsModalClose" type="button" class="text-sm text-gray-600 hover:text-gray-900">Cerrar</button>
          </div>
          <p id="ingredientsModalProduct" class="mt-2 text-sm text-gray-600"></p>
          <div id="ingredientsList" class="mt-4 max-h-64 overflow-auto space-y-2"></div>
          <div class="mt-5 flex items-center justify-end gap-3">
            <button id="ingredientsModalCancel" type="button" class="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-xl">Cancelar</button>
            <button id="ingredientsModalConfirm" type="button" class="bg-brand-800 text-white px-4 py-2 rounded-xl">Aplicar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('ingredientsModalClose')?.addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('ingredientsModalCancel')?.addEventListener('click', () => modal.classList.add('hidden'));
  return modal;
}

async function openIngredientsForAdd(product, onConfirm, existingExcludedIds) {
  const modal = ensureIngredientsModal();
  const title = document.getElementById('ingredientsModalTitle');
  const prodLabel = document.getElementById('ingredientsModalProduct');
  const list = document.getElementById('ingredientsList');
  modal.classList.remove('hidden');
  title.textContent = 'Ingredientes';
  prodLabel.textContent = product.name || '';
  list.innerHTML = '<div class="text-sm text-gray-500">Cargando ingredientes…</div>';
  const recipe = await fetchProductRecipe(product.id);
  if (!recipe || !recipe.length) {
    list.innerHTML = '<div class="text-sm text-gray-600">No hay receta/ingredientes disponibles.</div>';
    document.getElementById('ingredientsModalConfirm').onclick = () => { modal.classList.add('hidden'); onConfirm([], []); };
    return;
  }
  const normalized = recipe.map(r => ({
    id: String(r.id ?? r.recipe_id ?? r.recipeId ?? r._id ?? ''),
    name: String(r.ingredientName ?? r.name ?? r.title ?? r.label ?? 'Ingrediente'),
    qty: r.qty ?? r.quantity ?? r.amount ?? null,
    unit: r.unit ?? null,
    scope: r.scope ?? null,
    isMandatory: !!(r.isMandatory || r.mandatory || r.required)
  })).filter(r => r.id);
  const existingSet = new Set(Array.isArray(existingExcludedIds) ? existingExcludedIds : []);
  list.innerHTML = normalized
    .map((r, idx) => {
      const disabled = r.isMandatory ? 'disabled' : '';
      const mandatoryBadge = r.isMandatory ? '<span class="ml-2 text-xs font-semibold text-red-600">(Obligatorio)</span>' : '';
      const meta = (r.qty || r.unit || r.scope) ? `<div class="text-xs text-gray-500">${escapeHtml(String(r.qty || ''))}${r.unit ? ' ' + escapeHtml(String(r.unit)) : ''}${r.scope ? ' · ' + escapeHtml(String(r.scope)) : ''}</div>` : '';
      const isChecked = r.isMandatory ? true : !existingSet.has(r.id);
      return `
        <label class="flex items-center gap-3 text-sm">
          <input data-idx="${idx}" type="checkbox" ${isChecked ? 'checked' : ''} class="w-4 h-4" ${disabled} />
          <div>
            <div class="text-sm text-gray-800">${escapeHtml(r.name)}${mandatoryBadge}</div>
            ${meta}
          </div>
        </label>
      `;
    }).join('');
  document.getElementById('ingredientsModalConfirm').onclick = () => {
    const checks = Array.from(list.querySelectorAll('input[type="checkbox"]'));
    const excludedIds = [];
    const excludedNames = [];
    checks.forEach((ch, i) => {
      const r = normalized[i];
      if (r.isMandatory) return;
      const ok = ch.checked;
      if (!ok) { excludedIds.push(r.id); excludedNames.push(r.name); }
    });
    modal.classList.add('hidden');
    onConfirm(excludedIds, excludedNames);
  };
}

function updateCartItemExcluded(itemUid, excludedIds, excludedNames) {
  const cart = readCart();
  const items = cart.items || [];
  const item = items.find(it => it.uid === itemUid);
  if (!item) return;
  item.excluded_recipe_ids = excludedIds || [];
  item.excluded_recipe_names = excludedNames || [];
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  renderCartModal();
}

function renderCartModal() {
  const itemsEl = document.getElementById('cartModalItems');
  const totalEl = document.getElementById('cartModalTotal');
  if (!itemsEl || !totalEl) return;
  const cart = readCart();
  const items = cart.items || [];

  // Ensure every cart item has a stable `uid` so buttons reference existant ids.
  let normalized = false;
  items.forEach(it => {
    if (!it.uid) {
      it.uid = 'uid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
      normalized = true;
    }
  });
  if (normalized) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }
  const shipping = currentShippingCost();
  totalEl.textContent = formatPrice(cartTotal(cart) + shipping);

  if (!items.length) {
    itemsEl.innerHTML = '<div class="py-4 text-sm text-gray-600">Tu carrito está vacío.</div>';
    return;
  }

  itemsEl.innerHTML = items
    .map(it => {
      const qty = it.qty || 0;
      const lineTotal = parsePrice(it.price) * qty;
      const excluded = Array.isArray(it.excluded_recipe_names) ? it.excluded_recipe_names.join(', ') : '';
      return `
        <div class="py-4 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 truncate">${escapeHtml(it.name ?? 'Producto')}</div>
            <div class="text-sm text-gray-600 mt-0.5">${formatPrice(it.price)} · x${qty}</div>
            <div class="mt-2">
              <label class="block text-xs text-gray-500">Ingredientes excluidos</label>
              <div class="text-sm text-gray-600 mt-1">${escapeHtml(excluded || '—')}</div>
              <button data-action="edit-ingredients" data-uid="${it.uid}" type="button" class="mt-2 text-xs text-gray-500 hover:text-gray-900">Editar ingredientes</button>
            </div>
            <button data-action="remove" data-uid="${it.uid}" type="button" class="mt-2 text-xs text-gray-500 hover:text-gray-900">Eliminar</button>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <button data-action="dec" data-uid="${it.uid}" type="button" class="w-10 h-10 rounded-full bg-gray-100 text-gray-800 font-bold">−</button>
            <div class="w-8 text-center font-semibold text-gray-900">${qty}</div>
            <button data-action="inc" data-uid="${it.uid}" type="button" class="w-10 h-10 rounded-full bg-brand-800 text-white font-bold">+</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function updateCartItemNotes(itemUid, notes) {
  const cart = readCart();
  const items = cart.items || [];
  const item = items.find(it => it.uid === itemUid);
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
  const id = el.getAttribute('data-note-uid') || el.getAttribute('data-note-id');
  if (!id) return;
  updateCartItemNotes(id, el.value);
});

// Click handlers dentro del modal de carrito: inc/dec/remove/edit-ingredients
document.getElementById('cartModal')?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const uid = btn.getAttribute('data-uid') || btn.getAttribute('data-id');
  if (!uid) return;
  if (action === 'inc') updateQty(uid, 1);
  else if (action === 'dec') updateQty(uid, -1);
  else if (action === 'remove') removeItem(uid);
  else if (action === 'edit-ingredients') {
    const cart = readCart();
    const item = (cart.items || []).find(it => it.uid === uid || it.id === uid);
    if (!item) return;
    const product = { id: item.id, name: item.name };
    openIngredientsForAdd(product, (excludedIds, excludedNames) => updateCartItemExcluded(uid, excludedIds, excludedNames), item.excluded_recipe_ids || []);
  }
});
// Payment modals bindings
const paymentMethodModal = document.getElementById('paymentMethodModal');
const paymentDetailsModal = document.getElementById('paymentDetailsModal');

function openPaymentMethodModal() {
  const m = document.getElementById('paymentMethodModal');
  if (!m) return;
  m.classList.remove('hidden');
}
function closePaymentMethodModal() {
  const m = document.getElementById('paymentMethodModal');
  if (!m) return;
  m.classList.add('hidden');
}
function openPaymentDetailsModal() {
  const m = document.getElementById('paymentDetailsModal');
  if (!m) return;
  // populate basic info
  const name = document.getElementById('fullName')?.value.trim() || '-';
  const phone = document.getElementById('phone')?.value.trim() || '-';
  const amount = formatPrice(cartTotal(readCart()) + currentShippingCost());
  document.getElementById('pdName').textContent = name;
  document.getElementById('pdPhone').textContent = phone;
  document.getElementById('pdAmount').textContent = amount;
  m.classList.remove('hidden');
}
function closePaymentDetailsModal() {
  const m = document.getElementById('paymentDetailsModal');
  if (!m) return;
  m.classList.add('hidden');
}

// Pending state for order and payment
let pendingOrderMode = null;
let pendingPayment = { payment_type: null, payment_reference: '', payment_received: false, payment_bank: '' };

// Payment method buttons
document.getElementById('payCashBtn')?.addEventListener('click', () => {
  closePaymentMethodModal();
  // Abrir modal de efectivo para condiciones y cálculo de vuelto
  openPaymentCashModal();
});
document.getElementById('payDigitalBtn')?.addEventListener('click', () => {
  closePaymentMethodModal();
  openPaymentDetailsModal();
});
document.getElementById('paymentMethodClose')?.addEventListener('click', () => closePaymentMethodModal());
document.getElementById('paymentMethodOverlay')?.addEventListener('click', () => closePaymentMethodModal());

// Payment details handlers
document.getElementById('pdCancel')?.addEventListener('click', () => {
  closePaymentDetailsModal();
});
document.getElementById('pdConfirm')?.addEventListener('click', () => {
  const ref = String(document.getElementById('pdRef')?.value || '').trim();
  const bankChoice = document.querySelector('input[name="pdBankChoice"]:checked');
  const bank = bankChoice ? bankChoice.value : '';
  if (!ref) {
    alert('Por favor ingresa los últimos dígitos de la referencia.');
    return;
  }
  pendingPayment = { payment_type: 'DIGITAL', payment_reference: `${ref} - ${bank}`, payment_received: true, payment_bank: bank };
  closePaymentDetailsModal();
  submitOrderFlow(pendingOrderMode || localStorage.getItem('dp_service_type') || 'delivery');
});
document.getElementById('paymentDetailsOverlay')?.addEventListener('click', () => closePaymentDetailsModal());

// Payment cash modal (conditions + cálculo de vuelto)
function openPaymentCashModal() {
  const m = document.getElementById('paymentCashModal');
  if (!m) return;
  // populate dynamic fields
  const total = cartTotal(readCart()) + currentShippingCost();
  document.getElementById('pcTotal').textContent = formatPrice(total);
  // conditions depend on mode
  const cond = document.getElementById('pcConditions');
  const mode = pendingOrderMode || localStorage.getItem('dp_service_type') || 'delivery';
  if (cond) {
    if (mode === 'pickup') {
      cond.innerHTML = `
        <strong>Caso A: Para PICKUP (Retiro en Tienda)</strong>
        <p>Por normativas de seguridad y flujo de caja, al seleccionar pago en efectivo usted acepta las siguientes condiciones:</p>
        <ul class="text-sm list-disc pl-5">
          <li>Integridad del Papel Moneda: No aceptamos billetes rotos, manchados, pegados o excesivamente deteriorados. Nuestro personal validará cada billete.</li>
          <li>Verificación Inmediata: Debe contar su vuelto frente al cajero antes de retirarse. No se aceptan reclamos posteriores una vez abandonada la zona de caja.</li>
          <li>Pago Exacto: Se agradece el pago exacto para agilizar su despacho.</li>
        </ul>
      `;
    } else {
      cond.innerHTML = `
        <strong>Caso B: Para DELIVERY</strong>
        <p>El servicio de delivery es operado por una empresa independiente. Para garantizar su seguridad y la correcta gestión del cambio:</p>
        <ul class="text-sm list-disc pl-5">
          <li>Declaración Obligatoria: Debe ingresar EXACTAMENTE con qué billete va a pagar. No enviamos cambio no declarado.</li>
          <li>Gestión de Vuelto: Charlotte Bistró enviará el vuelto exacto (si aplica) dentro del paquete sellado o entregado al conductor.</li>
          <li>Límite de Responsabilidad: Charlotte Bistró NO se hace responsable por transacciones personales adicionales, propinas o cambios de divisa realizados directamente con el conductor ajenos al monto de la factura.</li>
        </ul>
      `;
    }
  }

  // reset inputs
  const input = document.getElementById('pcCashAmount');
  if (input) input.value = '';
  const summary = document.getElementById('pcChangeSummary');
  if (summary) summary.textContent = '';

  m.classList.remove('hidden');
}
function closePaymentCashModal() {
  const m = document.getElementById('paymentCashModal');
  if (!m) return;
  m.classList.add('hidden');
}

// helper: calcular desglose de vuelto
function calcularDesgloseVuelto(totalPagar, montoEfectivo) {
  let vuelto = Number(montoEfectivo) - Number(totalPagar);
  if (!Number.isFinite(vuelto)) return '⚠️ Monto inválido.';
  if (vuelto < 0) return '⚠️ El monto en efectivo es menor a la deuda.';
  if (vuelto === 0) return '✅ Pago exacto. No se requiere vuelto.';

  const denominaciones = [100, 50, 20, 10, 5, 1];
  let desglose = [];
  let resto = Math.round(vuelto);

  denominaciones.forEach(billete => {
    if (resto >= billete) {
      const cantidad = Math.floor(resto / billete);
      resto = resto % billete;
      desglose.push(`${cantidad} billete${cantidad > 1 ? 's' : ''} de $${billete}`);
    }
  });

  return `Tu vuelto de $${vuelto} se entregará (aprox) en: ${desglose.join(', ')}.`;
}

// live update change when user types efectivo
document.getElementById('pcCashAmount')?.addEventListener('input', () => {
  const total = cartTotal(readCart()) + currentShippingCost();
  const val = document.getElementById('pcCashAmount')?.value || '';
  const summary = document.getElementById('pcChangeSummary');
  if (!summary) return;
  const msg = calcularDesgloseVuelto(total, Number(val));
  summary.textContent = msg;
});

// cash modal actions
document.getElementById('pcCancel')?.addEventListener('click', () => closePaymentCashModal());
document.getElementById('pcConfirm')?.addEventListener('click', () => {
  const val = Number(document.getElementById('pcCashAmount')?.value || 0);
  const total = Number(cartTotal(readCart()) + currentShippingCost());
  if (!val || val < total) {
    alert('El monto en efectivo debe ser igual o mayor al total a pagar.');
    return;
  }
  const change = val - total;
  const breakdown = calcularDesgloseVuelto(total, val);
  const mode = pendingOrderMode || localStorage.getItem('dp_service_type') || 'delivery';
  // For cash payments we default to not-marking as received here (will be handled at POS).
  pendingPayment = {
    payment_type: 'EFECTIVO',
    payment_cash_amount: val,
    payment_change: change,
    payment_change_breakdown: breakdown,
    payment_received: false,
    payment_reference: ' ',
    payment_bank: ''
  };
  closePaymentCashModal();
  submitOrderFlow(mode);
});

document.getElementById('paymentCashOverlay')?.addEventListener('click', () => closePaymentCashModal());
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const mc = document.getElementById('paymentCashModal');
  if (mc && !mc.classList.contains('hidden')) closePaymentCashModal();
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
      if (Array.isArray(it.excluded_recipe_ids) && it.excluded_recipe_ids.length) {
        row.excluded_recipe_ids = it.excluded_recipe_ids;
      }
      return row;
    });

  const customer = {
    name: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: isDelivery
      ? (document.getElementById('addressDetail') ? document.getElementById('addressDetail').value.trim() : ' ')
      : ' '
  };

  const payload = {
    service_type,
    customer,
    items
  };

  if (isDelivery) payload.zone_id = zone && zone.zone_id ? zone.zone_id : '';
  // Añadir costo de envío si está disponible en la zona
  try {
    if (isDelivery && zone && zone.shipping_cost) payload.shipping_cost = parsePrice(zone.shipping_cost);
  } catch (e) {
    // ignore
  }
  // Nota opcional para cocina (campo añadido en el modal)
  try {
    const noteEl = document.getElementById('orderNote');
    const note = noteEl ? String(noteEl.value || '').trim() : '';
    if (note) payload.notes = note;
  } catch (e) {
    // ignore
  }
  // Incluir información de pago si está presente
  try {
    if (typeof pendingPayment !== 'undefined' && pendingPayment && pendingPayment.payment_type) {
      payload.payment_type = pendingPayment.payment_type;
      if (pendingPayment.payment_reference) payload.payment_reference = pendingPayment.payment_reference;
      payload.payment_received = !!pendingPayment.payment_received;
      if (pendingPayment.payment_bank) payload.payment_bank = pendingPayment.payment_bank;
    }
  } catch (e) {
    // ignore
  }
  return payload;
}

// (payment modal state is declared above)

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

// Listener en fase de captura para loguear el payload antes de que el handler principal
// haga `preventDefault()` o muestre el modal de notas.
if (form) {
  form.addEventListener('submit', (e) => {
    try {
      const payload = buildOrderPayload();
      console.log('Checkout payload:', payload);
      console.log('Checkout payload (JSON):', JSON.stringify(payload));
    } catch (err) {
      console.warn('Error construyendo payload de checkout para logging:', err);
    }
  }, { capture: true });
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
    // Abrir modal para seleccionar método de pago; si el modal no existe, proceder directamente.
    const pm = document.getElementById('paymentMethodModal');
    if (pm) openPaymentMethodModal();
    else submitOrderFlow(mode);
  } else {
    // Scroll to first error
    const firstErr = document.querySelector('p.text-red-600:not(.hidden)');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
