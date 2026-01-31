import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';
import { mergeHeaders, withBearerToken } from '/mod-1-delivery-pickup/src/services/auth-token.js';

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
    ...options,
    headers: withBearerToken(
      mergeHeaders(
        {
          'Content-Type': 'application/json',
        },
        options.headers
      )
    ),
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
  return {
    raw: t,
    id: thresholdId(t),
    metricAffected: t?.metric_affected ?? t?.metricAffected ?? '',
    valueCritical: t?.value_critical ?? t?.valueCritical ?? null,
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
  title.textContent = rule.metricAffected || '(Sin métrica)';

  const metric = document.createElement('div');
  metric.className = 'mt-0.5 text-xs text-slate-500 dp-mono truncate';
  metric.textContent = rule.id ? `threshold_id: ${rule.id}` : 'threshold_id: —';

  left.appendChild(title);
  left.appendChild(metric);

  const right = document.createElement('div');
  right.className = 'flex items-center justify-between sm:justify-end gap-3';

  const valueWrap = document.createElement('div');
  valueWrap.className = 'flex items-center gap-2';

  const valueBadge = document.createElement('span');
  valueBadge.className =
    'inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-900 dp-mono';
  valueBadge.textContent = Number.isFinite(Number(rule.valueCritical)) ? String(rule.valueCritical) : '—';

  const valueLabel = document.createElement('span');
  valueLabel.className = 'text-xs text-slate-500';
  valueLabel.textContent = 'value_critical';

  valueWrap.appendChild(valueBadge);
  valueWrap.appendChild(valueLabel);

  const actions = document.createElement('div');
  actions.className = 'dp-row-actions';

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

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'dp-icon-btn dp-row-edit';
  editBtn.title = 'Editar';
  editBtn.textContent = '✏️';
  editBtn.disabled = !rule.id;
  editBtn.addEventListener('click', () => handlers.onEdit(rule));
  actions.appendChild(toggleWrap);
  actions.appendChild(editBtn);

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
  const onlyActiveEl = byId('dpThresholdsOnlyActive');
  const metaEl = byId('dpThresholdsMeta');
  const errorEl = byId('dpThresholdsError');
  const listEl = byId('dpThresholdsList');

  const form = byId('dpThresholdsForm');
  const cancelBtn = byId('dpThresholdsCancel');
  const formErrorEl = byId('dpThresholdsFormError');
  const submitBtn = byId('dpThresholdsSubmit');

  const metricEl = byId('dpThresholdMetricAffected');
  const valueEl = byId('dpThresholdValueCritical');
  const isActiveEl = byId('dpThresholdIsActive');

  const dpBase = getDpUrl();

  const state = {
    loading: false,
    thresholds: [],
    onlyActive: false,
  };

  function setPageError(message) {
    setText(errorEl, message ? `⚠️ ${message}` : '');
    setHidden(errorEl, !message);
  }

  let pageSuccessTimer = null;
  function setPageSuccess(message, timeout = 3000) {
    if (!errorEl) return;
    if (pageSuccessTimer) {
      clearTimeout(pageSuccessTimer);
      pageSuccessTimer = null;
    }
    setText(errorEl, message ? `✅ ${message}` : '');
    setHidden(errorEl, !message);
    if (message && timeout > 0) {
      pageSuccessTimer = setTimeout(() => {
        setHidden(errorEl, true);
        pageSuccessTimer = null;
      }, timeout);
    }
  }

  function setFormError(message) {
    setText(formErrorEl, message ? `⚠️ ${message}` : '');
    setHidden(formErrorEl, !message);
  }

  function clearForm() {
    if (metricEl) metricEl.value = '';
    valueEl.value = '';
    if (isActiveEl) isActiveEl.checked = true;
    setHidden(cancelBtn, true);
    setFormError('');
    // In edit-only mode the submit button should be disabled until a
    // threshold is selected. Label accordingly.
    setButtonLoading(submitBtn, false, 'Editar threshold');
    if (submitBtn) submitBtn.disabled = true;
    state.editingId = null;
    const titleEl = document.getElementById('dpThresholdsFormTitle');
    if (titleEl) titleEl.textContent = 'Editar threshold (selecciona una regla)';
  }

  function populateMetricOptions() {
    if (!metricEl) return;
    const previous = String(metricEl.value || '').trim();
    const metrics = Array.from(new Set(state.thresholds.map(t => String(t.metricAffected || '').trim()).filter(Boolean)));
    metricEl.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Seleccione una métrica…';
    metricEl.appendChild(placeholder);
    for (const m of metrics) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      metricEl.appendChild(opt);
    }
    if (previous && metrics.includes(previous)) metricEl.value = previous;
  }

  function renderEmpty(listEl, message) {
    listEl.innerHTML = '';
    const empty = document.createElement('li');
    empty.className = 'text-slate-600 bg-white border border-slate-200 rounded-2xl p-6';
    empty.textContent = message;
    listEl.appendChild(empty);
  }

  function render() {
    if (!listEl) return;
    listEl.innerHTML = '';

    const activeCount = state.thresholds.filter(t => t.isActive === true).length;
    setText(metaEl, `${state.thresholds.length} reglas · ${activeCount} activas`);
    populateMetricOptions();

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
      onEdit: async rule => {
        // Populate form for editing and switch form mode to PATCH
        if (!rule) return;
        state.editingId = rule.id || null;
        if (metricEl) metricEl.value = rule.metricAffected || '';
        valueEl.value = Number.isFinite(Number(rule.valueCritical)) ? String(Number(rule.valueCritical)) : '';
        if (isActiveEl) isActiveEl.checked = rule.isActive === true;
        setHidden(cancelBtn, false);
        setFormError('');
        // Update form title and submit label
        const titleEl = document.getElementById('dpThresholdsFormTitle');
        if (titleEl) titleEl.textContent = 'Editar threshold';
        // Enable submit now that an existing threshold is selected.
        if (submitBtn) submitBtn.disabled = false;
        setButtonLoading(submitBtn, false, 'Editar threshold');
        metricEl?.focus?.();
      },
    };

    if (!state.thresholds.length) {
      renderEmpty(listEl, 'No hay thresholds registrados.');
      return;
    }

    for (const rule of state.thresholds) {
      listEl.appendChild(renderThresholdRow(rule, handlers));
    }
  }

  async function loadThresholds() {
    if (state.loading) return;
    state.loading = true;
    try {
      setPageError('');
      setText(metaEl, 'Cargando...');

      const url = state.onlyActive
        ? (dpBase ? `${dpBase}/api/dp/v1/thresholds/active` : '/api/dp/v1/thresholds/active')
        : (dpBase ? `${dpBase}/api/dp/v1/thresholds` : '/api/dp/v1/thresholds');
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
  onlyActiveEl?.addEventListener('change', () => {
    state.onlyActive = Boolean(onlyActiveEl.checked);
    loadThresholds();
  });
  // Hide the "Crear" button — this UI is edit-only now.
  if (addBtn) addBtn.classList.add('hidden');
  cancelBtn?.addEventListener('click', () => clearForm());

  form?.addEventListener('submit', async ev => {
    ev.preventDefault();
    setFormError('');
    setPageError('');

    const payload = {
      metricAffected: String(metricEl?.value || '').trim(),
      valueCritical: parseNumber(valueEl.value),
      isActive: Boolean(isActiveEl?.checked),
    };

    const errors = [];
    if (!payload.metricAffected) errors.push('La métrica es obligatoria.');
    if (!Number.isFinite(payload.valueCritical) || !Number.isInteger(payload.valueCritical)) {
      errors.push('El valor crítico debe ser un entero.');
    }
    if (payload.valueCritical < 0) errors.push('El valor crítico no puede ser negativo.');
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }

    try {
      setButtonLoading(submitBtn, true);
      if (!state.editingId) {
        setFormError('Selecciona un threshold existente para editar.');
        return;
      }

      const url = dpBase
        ? `${dpBase}/api/dp/v1/thresholds/${encodeURIComponent(state.editingId)}`
        : `/api/dp/v1/thresholds/${encodeURIComponent(state.editingId)}`;
      const body = {
        metric_affected: payload.metricAffected,
        value_critical: payload.valueCritical,
        is_active: payload.isActive,
      };
      await fetchJson(url, { method: 'PATCH', body: JSON.stringify(body) });

      clearForm();
      await loadThresholds();
      setPageSuccess('Threshold actualizado correctamente');
    } catch (e) {
      setFormError(normalizeErrorMessage(e));
    } finally {
      setButtonLoading(submitBtn, false, 'Editar threshold');
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
