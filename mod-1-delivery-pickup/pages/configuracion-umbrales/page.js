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

function parseNumber(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return NaN;
  const normalized = trimmed.replace(/[^0-9.-]/g, '');
  return Number(normalized);
}

function thresholdId(t) {
  return t?.id ?? t?._id ?? t?.threshold_id ?? t?.uuid ?? null;
}

function mapThresholdFromApi(t) {
  const unitRaw = (t?.unit ?? t?.unit_type ?? t?.unitType ?? '').toString().trim();
  const unit = unitRaw || (t?.is_percentage ? '%' : unitRaw);

  return {
    raw: t,
    id: thresholdId(t),
    name: t?.name ?? t?.title ?? t?.label ?? '',
    description: t?.description ?? t?.desc ?? '',
    metricKey: t?.metric_affected ?? t?.metricAffected ?? t?.metric_key ?? t?.metricKey ?? t?.metric ?? '',
    unit: unit || (t?.value_type === 'percent' ? '%' : ''),
    value:
      t?.threshold_value ??
      t?.thresholdValue ??
      t?.value ??
      t?.threshold ??
      t?.limit ??
      null,
    isActive:
      typeof t?.is_active === 'boolean'
        ? t.is_active
        : typeof t?.isActive === 'boolean'
          ? t.isActive
          : typeof t?.active === 'boolean'
            ? t.active
            : null,
  };
}

function extractThresholds(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.thresholds)) return payload.thresholds;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.thresholds)) return payload.data.thresholds;
  return [];
}

function isMinutesUnit(unit) {
  const u = String(unit ?? '').toLowerCase().trim();
  return u === 'min' || u === 'mins' || u === 'minute' || u === 'minutes';
}

function isPercentUnit(unit) {
  const u = String(unit ?? '').toLowerCase().trim();
  return u === '%' || u === 'percent' || u === 'percentage' || u === 'pct';
}

function setButtonLoading(button, loading, labelWhenNotLoading) {
  if (!button) return;
  button.disabled = Boolean(loading);
  if (loading) button.textContent = 'Guardando...';
  else if (labelWhenNotLoading) button.textContent = labelWhenNotLoading;
}

function renderThresholdRow(rule, handlers) {
  const li = document.createElement('li');
  li.className =
    'dp-row bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between';

  const left = document.createElement('div');
  left.className = 'min-w-0';

  const title = document.createElement('div');
  title.className = 'font-extrabold text-slate-900 truncate';
  title.textContent = rule.name || '(Sin nombre)';

  const metric = document.createElement('div');
  metric.className = 'mt-0.5 text-xs text-slate-500 dp-mono truncate';
  metric.textContent = rule.metricKey ? `metric_key: ${rule.metricKey}` : 'metric_key: —';

  const desc = document.createElement('div');
  desc.className = 'mt-1 text-sm text-slate-600';
  desc.textContent = rule.description || '';
  if (!rule.description) desc.classList.add('hidden');

  left.appendChild(title);
  left.appendChild(metric);
  left.appendChild(desc);

  const right = document.createElement('div');
  right.className = 'flex items-center justify-between sm:justify-end gap-3';

  const valueWrap = document.createElement('div');
  valueWrap.className = 'dp-suffix';

  const valueInput = document.createElement('input');
  valueInput.type = 'number';
  valueInput.inputMode = 'decimal';
  valueInput.min = '0';
  valueInput.step = isPercentUnit(rule.unit) ? '0.01' : '1';
  valueInput.className = 'dp-suffix__input';
  valueInput.value = rule.value ?? '';
  valueInput.placeholder = '—';

  const suffix = document.createElement('span');
  suffix.className = 'dp-suffix__unit';
  suffix.textContent = rule.unit || (isPercentUnit(rule.unit) ? '%' : (isMinutesUnit(rule.unit) ? 'min' : '')) || '—';

  valueWrap.appendChild(valueInput);
  valueWrap.appendChild(suffix);

  const actions = document.createElement('div');
  actions.className = 'dp-row-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'inline-flex items-center justify-center rounded-xl bg-brand-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700';
  saveBtn.textContent = 'Guardar';
  saveBtn.disabled = !rule.metricKey;

  const toggleWrap = document.createElement('label');
  toggleWrap.className = 'inline-flex items-center gap-2 select-none';

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.className = 'toggle-input';
  toggleInput.checked = rule.isActive === true;
  toggleInput.disabled = rule.isActive === null || !rule.id;

  const toggle = document.createElement('span');
  toggle.className = 'toggle';
  const dot = document.createElement('span');
  dot.className = 'toggle-dot';
  toggle.appendChild(dot);

  toggleInput.addEventListener('change', () => {
    handlers.onToggleActive(rule, toggleInput.checked);
  });

  toggleWrap.appendChild(toggleInput);
  toggleWrap.appendChild(toggle);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'dp-icon-btn dp-row-delete';
  deleteBtn.title = 'Eliminar';
  deleteBtn.textContent = '🗑️';
  deleteBtn.disabled = !rule.id;
  deleteBtn.addEventListener('click', () => handlers.onDelete(rule));

  let originalValue = String(rule.value ?? '');
  valueInput.addEventListener('input', () => {
    const now = String(valueInput.value ?? '');
    saveBtn.disabled = !rule.metricKey || now === originalValue;
  });

  async function doSave() {
    const nextValue = parseNumber(valueInput.value);
    if (!Number.isFinite(nextValue)) return;

    await handlers.onSave(rule, {
      value: nextValue,
      unit: rule.unit,
    });
    originalValue = String(valueInput.value ?? '');
    saveBtn.disabled = true;
  }

  saveBtn.addEventListener('click', () => {
    setButtonLoading(saveBtn, true);
    doSave().finally(() => setButtonLoading(saveBtn, false, 'Guardar'));
  });
  valueInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (saveBtn.disabled) return;
    saveBtn.click();
  });

  actions.appendChild(saveBtn);
  actions.appendChild(toggleWrap);
  actions.appendChild(deleteBtn);

  right.appendChild(valueWrap);
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

  const refreshBtn = byId('dpThresholdsRefresh');
  const addBtn = byId('dpThresholdsAdd');
  const metaEl = byId('dpThresholdsMeta');
  const errorEl = byId('dpThresholdsError');
  const timesEl = byId('dpThresholdsTimes');
  const criticalEl = byId('dpThresholdsCritical');

  const form = byId('dpThresholdsForm');
  const cancelBtn = byId('dpThresholdsCancel');
  const formErrorEl = byId('dpThresholdsFormError');
  const submitBtn = byId('dpThresholdsSubmit');

  const idEl = byId('dpThresholdId');
  const nameEl = byId('dpThresholdName');
  const metricKeyEl = byId('dpThresholdMetricKey');
  const descriptionEl = byId('dpThresholdDescription');
  const unitEl = byId('dpThresholdUnit');
  const valueEl = byId('dpThresholdValue');
  const valueSuffixEl = byId('dpThresholdValueSuffix');

  const dpBase = getDpUrl();

  const state = {
    loading: false,
    thresholds: [],
  };

  function setPageError(message) {
    setText(errorEl, message ? `⚠️ ${message}` : '');
    setHidden(errorEl, !message);
  }

  function setFormError(message) {
    setText(formErrorEl, message ? `⚠️ ${message}` : '');
    setHidden(formErrorEl, !message);
  }

  function updateSuffix() {
    if (!valueSuffixEl) return;
    valueSuffixEl.textContent = unitEl?.value || '—';
  }

  function clearForm() {
    idEl.value = '';
    nameEl.value = '';
    metricKeyEl.value = '';
    descriptionEl.value = '';
    unitEl.value = 'min';
    valueEl.value = '';
    updateSuffix();
    setHidden(cancelBtn, true);
    setFormError('');
    setButtonLoading(submitBtn, false, 'Crear regla');
  }

  function renderEmpty(listEl, message) {
    listEl.innerHTML = '';
    const empty = document.createElement('li');
    empty.className = 'text-slate-600 bg-white border border-slate-200 rounded-2xl p-6';
    empty.textContent = message;
    listEl.appendChild(empty);
  }

  function render() {
    if (!timesEl || !criticalEl) return;
    timesEl.innerHTML = '';
    criticalEl.innerHTML = '';

    const times = state.thresholds.filter(t => isMinutesUnit(t.unit) || (!t.unit && String(t.metricKey).includes('time')));
    const critical = state.thresholds.filter(t => isPercentUnit(t.unit));
    const other = state.thresholds.filter(t => !times.includes(t) && !critical.includes(t));

    const activeCount = state.thresholds.filter(t => t.isActive === true).length;
    setText(metaEl, `${state.thresholds.length} reglas · ${activeCount} activas`);

    const handlers = {
      onToggleActive: async (rule, shouldBeActive) => {
        if (!rule.id) return;
        try {
          setPageError('');
          const action = shouldBeActive ? 'activate' : 'deactivate';
          const url = dpBase
            ? `${dpBase}/api/dp/v1/thresholds/${encodeURIComponent(rule.id)}/${action}`
            : `/api/dp/v1/thresholds/${encodeURIComponent(rule.id)}/${action}`;
          await fetchJson(url, { method: 'PATCH' });
          await loadThresholds();
        } catch (e) {
          setPageError(normalizeErrorMessage(e));
          await loadThresholds();
        }
      },
      onDelete: async rule => {
        if (!rule.id) return;
        const ok = window.confirm(`¿Eliminar la regla "${rule.name || rule.metricKey}"? Esta acción no se puede deshacer.`);
        if (!ok) return;
        try {
          setPageError('');
          const url = dpBase
            ? `${dpBase}/api/dp/v1/thresholds/${encodeURIComponent(rule.id)}`
            : `/api/dp/v1/thresholds/${encodeURIComponent(rule.id)}`;
          await fetchJson(url, { method: 'DELETE' });
          await loadThresholds();
        } catch (e) {
          setPageError(normalizeErrorMessage(e));
        }
      },
      onSave: async (rule, { value }) => {
        try {
          setPageError('');
          const url = dpBase ? `${dpBase}/api/dp/v1/thresholds` : '/api/dp/v1/thresholds';
          const body = {
            id: rule.id,
            threshold_id: rule.id,
            metric_affected: rule.metricKey,
            metricAffected: rule.metricKey,
            unit: rule.unit,
            threshold_value: value,
            thresholdValue: value,
            value,
            name: rule.name,
            title: rule.name,
            description: rule.description,
          };
          await fetchJson(url, { method: 'POST', body: JSON.stringify(body) });
          await loadThresholds();
        } catch (e) {
          setPageError(normalizeErrorMessage(e));
        }
      },
    };

    if (!times.length && !other.length) renderEmpty(timesEl, 'No hay reglas de tiempo (min).');
    else {
      for (const rule of [...times, ...other]) {
        timesEl.appendChild(renderThresholdRow(rule, handlers));
      }
    }

    if (!critical.length) renderEmpty(criticalEl, 'No hay reglas críticas (%).');
    else {
      for (const rule of critical) {
        criticalEl.appendChild(renderThresholdRow(rule, handlers));
      }
    }
  }

  async function loadThresholds() {
    if (state.loading) return;
    state.loading = true;
    try {
      setPageError('');
      setText(metaEl, 'Cargando...');

      const url = dpBase ? `${dpBase}/api/dp/v1/thresholds` : '/api/dp/v1/thresholds';
      const payload = await fetchJson(url, { method: 'GET' });
      state.thresholds = extractThresholds(payload).map(mapThresholdFromApi);
      render();
    } catch (e) {
      state.thresholds = [];
      render();
      setPageError(normalizeErrorMessage(e));
    } finally {
      state.loading = false;
    }
  }

  refreshBtn?.addEventListener('click', () => loadThresholds());
  addBtn?.addEventListener('click', () => {
    setHidden(cancelBtn, false);
    metricKeyEl?.focus?.();
  });
  cancelBtn?.addEventListener('click', () => clearForm());
  unitEl?.addEventListener('change', updateSuffix);
  updateSuffix();

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    setFormError('');
    setPageError('');

    const payload = {
      id: String(idEl.value || '').trim() || null,
      name: String(nameEl.value || '').trim(),
      metricKey: String(metricKeyEl.value || '').trim(),
      description: String(descriptionEl.value || '').trim(),
      unit: String(unitEl.value || '').trim(),
      value: parseNumber(valueEl.value),
    };

    const errors = [];
    if (!payload.metricKey) errors.push('Metric key es obligatorio.');
    if (!Number.isFinite(payload.value)) errors.push('El valor debe ser numérico.');
    if (!payload.unit) errors.push('La unidad es obligatoria.');
    if (payload.unit === '%' && (payload.value < 0 || payload.value > 100)) errors.push('Para %, el valor debe estar entre 0 y 100.');
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }

    try {
      setButtonLoading(submitBtn, true);
      const url = dpBase ? `${dpBase}/api/dp/v1/thresholds` : '/api/dp/v1/thresholds';
      const body = {
        id: payload.id,
        threshold_id: payload.id,
        metric_affected: payload.metricKey,
        metricAffected: payload.metricKey,
        unit: payload.unit,
        threshold_value: payload.value,
        thresholdValue: payload.value,
        value: payload.value,
        name: payload.name,
        title: payload.name,
        description: payload.description,
        is_active: true,
        isActive: true,
      };
      await fetchJson(url, { method: 'POST', body: JSON.stringify(body) });
      clearForm();
      await loadThresholds();
    } catch (e) {
      setFormError(normalizeErrorMessage(e));
    } finally {
      setButtonLoading(submitBtn, false, 'Crear regla');
    }
  });

  clearForm();
  await loadThresholds();
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
