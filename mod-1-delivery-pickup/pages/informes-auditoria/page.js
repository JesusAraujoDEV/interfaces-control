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

function toIsoDateInputValue(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimestamp(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
  return String(value);
}

function extractLogs(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.logs)) return payload.logs;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.logs)) return payload.data.logs;
  return [];
}

function logId(log) {
  return log?.id ?? log?._id ?? log?.log_id ?? log?.uuid ?? null;
}

function mapLogFromApi(log) {
  const orderId = log?.order_id ?? log?.orderId ?? null;
  const managerId = log?.manager_id ?? log?.managerId ?? null;
  const managerName =
    log?.manager?.name ??
    log?.manager?.full_name ??
    log?.manager?.manager_name ??
    log?.manager?.email ??
    null;
  const readableId =
    log?.readable_id ??
    log?.readableId ??
    log?.order?.readable_id ??
    log?.order?.readableId ??
    null;

  return {
    raw: log,
    id: logId(log),
    orderId,
    readableId,
    managerId,
    managerName,
    timestamp: log?.timestamp_transition ?? log?.timestampTransition ?? null,
    statusFrom: log?.status_from ?? log?.statusFrom ?? null,
    statusTo: log?.status_to ?? log?.statusTo ?? null,
    cancellationReason: log?.cancellation_reason ?? log?.cancellationReason ?? null,
  };
}

function isUuidV4(value) {
  const v = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function toIsoFromDatetimeLocal(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function debounce(fn, waitMs) {
  let t = null;
  return (...args) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), waitMs);
  };
}

export async function init() {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  const refreshBtn = byId('dpAuditRefresh');
  const exportBtn = byId('dpAuditExport');
  const prevBtn = byId('dpAuditPrev');
  const nextBtn = byId('dpAuditNext');

  const fromEl = byId('dpAuditFrom');
  const toEl = byId('dpAuditTo');
  const statusEl = byId('dpAuditStatus');
  const managerIdEl = byId('dpAuditManagerId');
  const orderIdEl = byId('dpAuditOrderId');
  const limitEl = byId('dpAuditLimit');

  const metaEl = byId('dpAuditMeta');
  const errorEl = byId('dpAuditError');
  const tbody = byId('dpAuditTableBody');

  const detailWrap = byId('dpAuditDetail');
  const detailHint = byId('dpAuditDetailHint');
  const detailClose = byId('dpAuditDetailClose');
  const dTimestamp = byId('dpDetailTimestamp');
  const dLogId = byId('dpDetailLogId');
  const dOrderId = byId('dpDetailOrderId');
  const dManager = byId('dpDetailManager');
  const dTransition = byId('dpDetailTransition');
  const dReason = byId('dpDetailReason');
  const dOpenOrder = byId('dpDetailOpenOrder');
  const dJson = byId('dpDetailJson');

  const dpBase = getDpUrl();

  const state = {
    loading: false,
    logs: [],
    selectedId: null,
    limit: 50,
    offset: 0,
  };

  function setPageError(message) {
    setText(errorEl, message ? `⚠️ ${message}` : '');
    setHidden(errorEl, !message);
  }

  function setMeta(text) {
    setText(metaEl, text || '');
  }

  function buildParams() {
    const from = toIsoFromDatetimeLocal(fromEl?.value);
    const to = toIsoFromDatetimeLocal(toEl?.value);
    const status = String(statusEl?.value || '').trim();
    const manager_id = String(managerIdEl?.value || '').trim();
    const order_id = String(orderIdEl?.value || '').trim();

    const limit = Number(String(limitEl?.value || state.limit).trim());
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, limit)) : 50;
    state.limit = safeLimit;

    return {
      from,
      to,
      status,
      manager_id,
      order_id,
      limit: state.limit,
      offset: state.offset,
    };
  }

  function buildQueryString(params) {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.manager_id) q.set('manager_id', params.manager_id);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    q.set('limit', String(params.limit ?? 50));
    q.set('offset', String(params.offset ?? 0));
    return q.toString();
  }

  function hasAnyFilter(params) {
    return Boolean(params.status || params.manager_id || params.from || params.to);
  }

  function renderDetail(log) {
    if (!log) {
      setHidden(detailWrap, true);
      setHidden(detailClose, true);
      setHidden(detailHint, false);
      return;
    }

    setHidden(detailHint, true);
    setHidden(detailWrap, false);
    setHidden(detailClose, true);

    setText(dTimestamp, formatTimestamp(log.timestamp));

    setText(dLogId, log.id || '—');
    setText(dOrderId, log.orderId || '—');

    const manager = log.managerName
      ? `${log.managerName}${log.managerId ? ` (${log.managerId})` : ''}`
      : (log.managerId ? log.managerId : 'System');
    setText(dManager, manager);

    const from = log.statusFrom ? String(log.statusFrom) : '—';
    const to = log.statusTo ? String(log.statusTo) : '—';
    setText(dTransition, `${from} → ${to}`);
    setText(dReason, log.cancellationReason || '—');

    if (dOpenOrder) {
      const orderKey = log.readableId || log.orderId;
      if (orderKey) {
        dOpenOrder.href = `/admin/dp/orders/${encodeURIComponent(orderKey)}`;
        dOpenOrder.classList.remove('hidden');
      } else {
        dOpenOrder.href = '#';
        dOpenOrder.classList.add('hidden');
      }
    }

    dJson.textContent = JSON.stringify(log.raw, null, 2);
  }

  function renderTable() {
    if (!tbody) return;
    tbody.innerHTML = '';

    setMeta(`${state.logs.length} eventos · offset ${state.offset} · limit ${state.limit}`);

    if (!state.logs.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'text-slate-600';
      td.textContent = 'No hay eventos para los filtros seleccionados.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      renderDetail(null);
      return;
    }

    for (const log of state.logs) {
      const tr = document.createElement('tr');
      if (state.selectedId && log.id && String(log.id) === String(state.selectedId)) tr.classList.add('is-selected');

      const tdTime = document.createElement('td');
      tdTime.textContent = formatTimestamp(log.timestamp);
      tdTime.className = 'dp-mono';

      const tdOrder = document.createElement('td');
      tdOrder.className = 'dp-mono';
      tdOrder.textContent = log.readableId || log.orderId || '—';

      const tdManager = document.createElement('td');
      tdManager.textContent = log.managerName || log.managerId || 'System';

      const tdTransition = document.createElement('td');
      tdTransition.className = 'dp-mono';
      tdTransition.textContent = `${log.statusFrom ?? '—'} → ${log.statusTo ?? '—'}`;

      const tdReason = document.createElement('td');
      tdReason.textContent = log.cancellationReason || '—';

      tr.appendChild(tdTime);
      tr.appendChild(tdOrder);
      tr.appendChild(tdManager);
      tr.appendChild(tdTransition);
      tr.appendChild(tdReason);

      tr.addEventListener('click', () => {
        state.selectedId = log.id || null;
        renderTable();
        renderDetail(log);
      });

      tbody.appendChild(tr);
    }

    // Keep detail in sync with selection
    const selected = state.selectedId ? state.logs.find(l => String(l.id) === String(state.selectedId)) : null;
    renderDetail(selected || state.logs[0]);
  }

  async function loadLogs() {
    if (state.loading) return;
    state.loading = true;

    try {
      setPageError('');
      setMeta('Cargando...');

      const params = buildParams();
      const { order_id } = params;

      let payload;
      if (order_id) {
        if (!isUuidV4(order_id)) throw new Error('order_id debe ser uuid v4');
        const qs = buildQueryString({ limit: params.limit, offset: params.offset });
        const url = dpBase
          ? `${dpBase}/api/dp/v1/logs/by-order/${encodeURIComponent(order_id)}?${qs}`
          : `/api/dp/v1/logs/by-order/${encodeURIComponent(order_id)}?${qs}`;
        payload = await fetchJson(url, { method: 'GET' });
      } else if (hasAnyFilter(params)) {
        const qs = buildQueryString(params);
        const url = dpBase
          ? `${dpBase}/api/dp/v1/logs/search?${qs}`
          : `/api/dp/v1/logs/search?${qs}`;
        payload = await fetchJson(url, { method: 'GET' });
      } else {
        const qs = buildQueryString({ limit: params.limit, offset: params.offset });
        const url = dpBase
          ? `${dpBase}/api/dp/v1/logs?${qs}`
          : `/api/dp/v1/logs?${qs}`;
        payload = await fetchJson(url, { method: 'GET' });
      }

      state.logs = extractLogs(payload).map(mapLogFromApi);
      // newest first unless backend returns ASC (by-order is ASC). Normalize to DESC for UI.
      state.logs.sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();
        if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
        return tb - ta;
      });

      renderTable();
    } catch (e) {
      state.logs = [];
      renderTable();
      setPageError(normalizeErrorMessage(e));
    } finally {
      state.loading = false;
    }
  }

  const debouncedReload = debounce(() => {
    state.offset = 0;
    loadLogs();
  }, 250);

  refreshBtn?.addEventListener('click', () => loadLogs());
  exportBtn?.addEventListener('click', () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJson(`dp-logs-${stamp}.json`, state.logs.map((l) => l.raw));
  });

  prevBtn?.addEventListener('click', () => {
    state.offset = Math.max(0, state.offset - state.limit);
    loadLogs();
  });
  nextBtn?.addEventListener('click', () => {
    state.offset = state.offset + state.limit;
    loadLogs();
  });

  fromEl?.addEventListener('change', debouncedReload);
  toEl?.addEventListener('change', debouncedReload);
  statusEl?.addEventListener('change', debouncedReload);
  managerIdEl?.addEventListener('input', debouncedReload);
  orderIdEl?.addEventListener('input', debouncedReload);
  limitEl?.addEventListener('change', debouncedReload);

  detailClose?.addEventListener('click', () => renderDetail(null));

  await loadLogs();
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
