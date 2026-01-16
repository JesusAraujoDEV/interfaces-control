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

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'dp-icon-btn dp-row-delete';
  deleteBtn.title = 'Eliminar';
  deleteBtn.textContent = '🗑️';
  deleteBtn.disabled = !rule.id;
  deleteBtn.addEventListener('click', () => handlers.onDelete(rule));
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
    setButtonLoading(submitBtn, false, 'Crear threshold');
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
        const ok = window.confirm(`¿Eliminar el threshold "${rule.metricAffected}"? Esta acción no se puede deshacer.`);
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
  addBtn?.addEventListener('click', () => {
    setHidden(cancelBtn, false);
    metricEl?.focus?.();
  });
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
      const url = dpBase ? `${dpBase}/api/dp/v1/thresholds` : '/api/dp/v1/thresholds';
      const body = {
        metric_affected: payload.metricAffected,
        value_critical: payload.valueCritical,
        is_active: payload.isActive,
      };
      await fetchJson(url, { method: 'POST', body: JSON.stringify(body) });
      clearForm();
      await loadThresholds();
    } catch (e) {
      setFormError(normalizeErrorMessage(e));
    } finally {
      setButtonLoading(submitBtn, false, 'Crear threshold');
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
