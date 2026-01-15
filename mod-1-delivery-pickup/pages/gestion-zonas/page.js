import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';

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

function normalizeErrorMessage(error) {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || 'Error';
  return 'Error';
}

function getDpBaseUrl() {
  const fromWindow = window.DP_URL;
  if (typeof fromWindow === 'string' && fromWindow.trim()) return fromWindow.trim();
  return '';
}

function parseNumber(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return NaN;
  const normalized = trimmed.replace(/[^0-9.-]/g, '');
  return Number(normalized);
}

function validateForm({ name, etaMin, etaMax, shipping }) {
  const errors = [];
  if (!name || !String(name).trim()) errors.push('El nombre es obligatorio.');
  if (!Number.isFinite(etaMin) || etaMin <= 0) errors.push('ETA mínimo debe ser un número mayor a 0.');
  if (!Number.isFinite(etaMax) || etaMax <= 0) errors.push('ETA máximo debe ser un número mayor a 0.');
  if (Number.isFinite(etaMin) && Number.isFinite(etaMax) && etaMin > etaMax) {
    errors.push('ETA mínimo no puede ser mayor al ETA máximo.');
  }
  if (!Number.isFinite(shipping) || shipping < 0) errors.push('El costo de envío debe ser un número válido (>= 0).');
  return errors;
}

function formatMoneyCOP(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
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

function extractZones(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.zones)) return payload.zones;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.zones)) return payload.data.zones;
  return [];
}

function zoneId(zone) {
  return zone?.id ?? zone?._id ?? zone?.zone_id ?? zone?.uuid ?? null;
}

function mapZoneFromApi(zone) {
  return {
    raw: zone,
    id: zoneId(zone),
    name: zone?.name ?? zone?.zone_name ?? zone?.nombre ?? '(Sin nombre)',
    etaMin: zone?.eta_min ?? zone?.etaMin ?? zone?.min_eta ?? zone?.minEta ?? null,
    etaMax: zone?.eta_max ?? zone?.etaMax ?? zone?.max_eta ?? zone?.maxEta ?? null,
    shipping: zone?.shipping_cost ?? zone?.shippingCost ?? zone?.delivery_fee ?? zone?.deliveryFee ?? null,
    isActive:
      typeof zone?.is_active === 'boolean'
        ? zone.is_active
        : typeof zone?.isActive === 'boolean'
          ? zone.isActive
          : typeof zone?.active === 'boolean'
            ? zone.active
            : null,
  };
}

function setButtonLoading(button, loading, labelWhenNotLoading) {
  if (!button) return;
  button.disabled = Boolean(loading);
  if (loading) button.textContent = 'Guardando...';
  else if (labelWhenNotLoading) button.textContent = labelWhenNotLoading;
}

function renderZoneRow(zone, { onToggleActive, onEdit, onDelete }) {
  const li = document.createElement('li');
  li.className =
    'bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between';

  const left = document.createElement('div');
  left.className = 'min-w-0';

  const topLine = document.createElement('div');
  topLine.className = 'flex items-center gap-3';

  const title = document.createElement('div');
  title.className = 'font-extrabold text-slate-900 truncate';
  title.textContent = zone.name;

  const activeBadge = document.createElement('span');
  const active = zone.isActive === true;
  activeBadge.className =
    'text-xs font-bold px-2 py-1 rounded-full border ' +
    (active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600');
  activeBadge.textContent = active ? 'Activa' : 'Inactiva';

  topLine.appendChild(title);
  if (zone.isActive !== null) topLine.appendChild(activeBadge);

  const meta = document.createElement('div');
  meta.className = 'text-sm text-slate-600 mt-1 flex flex-wrap gap-4';

  const etaText =
    Number.isFinite(Number(zone.etaMin)) && Number.isFinite(Number(zone.etaMax))
      ? `${zone.etaMin}–${zone.etaMax} min`
      : 'ETA: —';
  const shippingText = Number.isFinite(Number(zone.shipping)) ? formatMoneyCOP(zone.shipping) : 'Costo: —';

  const etaEl = document.createElement('span');
  etaEl.textContent = `⏱ ${etaText}`;
  const shipEl = document.createElement('span');
  shipEl.textContent = `💸 ${shippingText}`;

  meta.appendChild(etaEl);
  meta.appendChild(shipEl);

  left.appendChild(topLine);
  left.appendChild(meta);

  const right = document.createElement('div');
  right.className = 'flex items-center justify-between sm:justify-end gap-3';

  const toggleWrap = document.createElement('label');
  toggleWrap.className = 'inline-flex items-center gap-2 select-none';

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.className = 'toggle-input';
  toggleInput.checked = zone.isActive === true;
  toggleInput.disabled = zone.isActive === null || !zone.id;

  const toggle = document.createElement('span');
  toggle.className = 'toggle';
  const dot = document.createElement('span');
  dot.className = 'toggle-dot';
  toggle.appendChild(dot);

  toggleInput.addEventListener('change', () => {
    onToggleActive(zone, toggleInput.checked);
  });

  toggleWrap.appendChild(toggleInput);
  toggleWrap.appendChild(toggle);

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-2';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'dp-icon-btn';
  editBtn.title = 'Editar';
  editBtn.textContent = '✏️';
  editBtn.disabled = !zone.id;
  editBtn.addEventListener('click', () => onEdit(zone));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'dp-icon-btn';
  deleteBtn.title = 'Eliminar';
  deleteBtn.textContent = '🗑️';
  deleteBtn.disabled = !zone.id;
  deleteBtn.addEventListener('click', () => onDelete(zone));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  right.appendChild(toggleWrap);
  right.appendChild(actions);

  li.appendChild(left);
  li.appendChild(right);
  return li;
}

export async function init() {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  const listEl = byId('dpZonesList');
  const metaEl = byId('dpZonesMeta');
  const errorEl = byId('dpZonesError');
  const refreshBtn = byId('dpZonesRefresh');
  const newBtn = byId('dpZonesNew');

  const formTitleEl = byId('dpZonesFormTitle');
  const form = byId('dpZonesForm');
  const formErrorEl = byId('dpZonesFormError');
  const idEl = byId('dpZonesId');
  const nameEl = byId('dpZoneName');
  const etaMinEl = byId('dpEtaMin');
  const etaMaxEl = byId('dpEtaMax');
  const shippingEl = byId('dpShipping');
  const cancelEditBtn = byId('dpZonesCancelEdit');
  const submitBtn = byId('dpZonesSubmit');

  const dpBase = getDpBaseUrl();

  const state = {
    loading: false,
    zones: [],
    editingZoneId: null,
  };

  function setPageError(message) {
    setText(errorEl, message ? `⚠️ ${message}` : '');
    setHidden(errorEl, !message);
  }

  function setFormError(message) {
    setText(formErrorEl, message ? `⚠️ ${message}` : '');
    setHidden(formErrorEl, !message);
  }

  function setEditing(editing) {
    if (editing) {
      setHidden(cancelEditBtn, false);
      setText(formTitleEl, 'Editar zona');
      setButtonLoading(submitBtn, false, 'Guardar cambios');
    } else {
      setHidden(cancelEditBtn, true);
      setText(formTitleEl, 'Agregar nueva zona');
      setButtonLoading(submitBtn, false, 'Agregar zona');
    }
  }

  function clearForm() {
    idEl.value = '';
    nameEl.value = '';
    etaMinEl.value = '';
    etaMaxEl.value = '';
    shippingEl.value = '';
    state.editingZoneId = null;
    setEditing(false);
    setFormError('');
  }

  function fillForm(zone) {
    idEl.value = zone.id ?? '';
    nameEl.value = zone.name ?? '';
    etaMinEl.value = zone.etaMin ?? '';
    etaMaxEl.value = zone.etaMax ?? '';
    shippingEl.value = zone.shipping ?? '';
    state.editingZoneId = zone.id ?? null;
    setEditing(true);
    setFormError('');
  }

  function render() {
    if (!listEl) return;
    listEl.innerHTML = '';

    const activeCount = state.zones.filter((z) => z.isActive === true).length;
    setText(metaEl, `${state.zones.length} zonas · ${activeCount} activas`);

    if (!state.zones.length) {
      const empty = document.createElement('li');
      empty.className = 'text-slate-600 bg-white border border-slate-200 rounded-2xl p-6';
      empty.textContent = 'No hay zonas registradas.';
      listEl.appendChild(empty);
      return;
    }

    for (const zone of state.zones) {
      const row = renderZoneRow(zone, {
        onToggleActive: async (z, shouldBeActive) => {
          if (!z.id) return;
          try {
            setPageError('');
            const action = shouldBeActive ? 'activate' : 'deactivate';
            await fetchJson(`${dpBase}/api/dp/v1/zones/${encodeURIComponent(z.id)}/${action}`, {
              method: 'PATCH',
            });
            await loadZones();
          } catch (e) {
            setPageError(normalizeErrorMessage(e));
            await loadZones();
          }
        },
        onEdit: (z) => {
          fillForm(z);
          nameEl?.focus?.();
        },
        onDelete: async (z) => {
          if (!z.id) return;
          const ok = window.confirm(`¿Eliminar la zona "${z.name}"? Esta acción no se puede deshacer.`);
          if (!ok) return;
          try {
            setPageError('');
            await fetchJson(`${dpBase}/api/dp/v1/zones/${encodeURIComponent(z.id)}`, {
              method: 'DELETE',
            });
            if (state.editingZoneId === z.id) clearForm();
            await loadZones();
          } catch (e) {
            setPageError(normalizeErrorMessage(e));
          }
        },
      });
      listEl.appendChild(row);
    }
  }

  async function loadZones() {
    if (state.loading) return;
    state.loading = true;
    try {
      setPageError('');
      setText(metaEl, 'Cargando...');
      const payload = await fetchJson(`${dpBase}/api/dp/v1/zones`, { method: 'GET' });
      state.zones = extractZones(payload).map(mapZoneFromApi);
      render();
    } catch (e) {
      state.zones = [];
      render();
      setPageError(normalizeErrorMessage(e));
    } finally {
      state.loading = false;
    }
  }

  refreshBtn?.addEventListener('click', () => loadZones());
  newBtn?.addEventListener('click', () => {
    clearForm();
    nameEl?.focus?.();
  });
  cancelEditBtn?.addEventListener('click', () => clearForm());

  form?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    setFormError('');
    setPageError('');

    const payload = {
      name: String(nameEl.value ?? '').trim(),
      etaMin: parseNumber(etaMinEl.value),
      etaMax: parseNumber(etaMaxEl.value),
      shipping: parseNumber(shippingEl.value),
    };

    const errors = validateForm(payload);
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }

    const editingId = String(idEl.value || '').trim();
    const isEditing = Boolean(editingId);

    try {
      setButtonLoading(submitBtn, true);

      const body = {
        name: payload.name,
        eta_min: payload.etaMin,
        eta_max: payload.etaMax,
        shipping_cost: payload.shipping,
        etaMin: payload.etaMin,
        etaMax: payload.etaMax,
        shippingCost: payload.shipping,
      };

      if (isEditing) {
        await fetchJson(`${dpBase}/api/dp/v1/zones/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await fetchJson(`${dpBase}/api/dp/v1/zones`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      clearForm();
      await loadZones();
    } catch (e) {
      setFormError(normalizeErrorMessage(e));
    } finally {
      setButtonLoading(submitBtn, false, isEditing ? 'Guardar cambios' : 'Agregar zona');
    }
  });

  clearForm();
  await loadZones();
}

if (!window.__dpSpaRouter) {
  window.addEventListener(
    'DOMContentLoaded',
    () => {
      init();
    },
    { once: true },
  );
}
