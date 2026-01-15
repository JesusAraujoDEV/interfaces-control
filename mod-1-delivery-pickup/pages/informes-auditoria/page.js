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

function normalizeLevel(level) {
  const raw = String(level ?? '').trim().toUpperCase();
  if (!raw) return 'INFO';
  if (raw === 'WARN') return 'WARNING';
  return raw;
}

function levelBadgeClass(level) {
  const l = normalizeLevel(level);
  if (l === 'INFO') return 'dp-badge dp-badge--info';
  if (l === 'WARNING') return 'dp-badge dp-badge--warning';
  if (l === 'ERROR') return 'dp-badge dp-badge--error';
  if (l === 'CRITICAL') return 'dp-badge dp-badge--critical';
  return 'dp-badge dp-badge--debug';
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
  const timestamp =
    log?.timestamp ??
    log?.created_at ??
    log?.createdAt ??
    log?.time ??
    log?.date ??
    null;
  const level = normalizeLevel(log?.level ?? log?.severity ?? log?.lvl ?? log?.type);
  const actor =
    log?.actor ??
    log?.user ??
    log?.username ??
    log?.performed_by ??
    log?.performedBy ??
    log?.user_name ??
    log?.userName ??
    'System';
  const action = log?.action ?? log?.event ?? log?.event_type ?? log?.eventType ?? log?.verb ?? '';
  const resource =
    log?.resource ??
    log?.resource_id ??
    log?.resourceId ??
    log?.entity ??
    log?.entity_id ??
    log?.entityId ??
    log?.order_id ??
    log?.orderId ??
    '';

  const message = log?.message ?? log?.msg ?? '';

  const before = log?.before ?? log?.old ?? log?.previous ?? log?.prev ?? null;
  const after = log?.after ?? log?.new ?? log?.next ?? null;
  const diff = log?.diff ?? log?.changes ?? null;

  return {
    raw: log,
    id: logId(log),
    timestamp,
    level,
    actor: typeof actor === 'string' ? actor : (actor?.name ?? actor?.full_name ?? actor?.email ?? 'System'),
    action: String(action || '').trim(),
    resource: String(resource || '').trim(),
    message: String(message || '').trim(),
    before,
    after,
    diff,
  };
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function stableStringify(value) {
  try {
    return JSON.stringify(value, Object.keys(value || {}).sort(), 2);
  } catch {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}

function diffObjects(before, after, basePath = '', maxDepth = 4, out = []) {
  if (maxDepth <= 0) return out;

  if (before === after) return out;

  const beforeIsObj = isObject(before);
  const afterIsObj = isObject(after);

  if (!beforeIsObj || !afterIsObj) {
    // Array or primitive: treat as a leaf change
    out.push({
      path: basePath || '(root)',
      before,
      after,
    });
    return out;
  }

  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of Array.from(keys).sort()) {
    const nextPath = basePath ? `${basePath}.${key}` : key;
    const b = before ? before[key] : undefined;
    const a = after ? after[key] : undefined;
    if (b === a) continue;
    const bObj = isObject(b);
    const aObj = isObject(a);
    if (bObj && aObj) diffObjects(b, a, nextPath, maxDepth - 1, out);
    else out.push({ path: nextPath, before: b, after: a });
  }
  return out;
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

  const fromEl = byId('dpAuditFrom');
  const toEl = byId('dpAuditTo');
  const levelEl = byId('dpAuditLevel');
  const actorEl = byId('dpAuditActor');
  const queryEl = byId('dpAuditQuery');

  const metaEl = byId('dpAuditMeta');
  const errorEl = byId('dpAuditError');
  const tbody = byId('dpAuditTableBody');

  const detailWrap = byId('dpAuditDetail');
  const detailHint = byId('dpAuditDetailHint');
  const detailClose = byId('dpAuditDetailClose');
  const dTimestamp = byId('dpDetailTimestamp');
  const dLevel = byId('dpDetailLevel');
  const dActor = byId('dpDetailActor');
  const dAction = byId('dpDetailAction');
  const dResource = byId('dpDetailResource');
  const dDiff = byId('dpDetailDiff');
  const dJson = byId('dpDetailJson');

  const dpBase = getDpUrl();

  const state = {
    loading: false,
    logs: [],
    selectedId: null,
    supportsSearch: true,
  };

  function setPageError(message) {
    setText(errorEl, message ? `⚠️ ${message}` : '');
    setHidden(errorEl, !message);
  }

  function setMeta(text) {
    setText(metaEl, text || '');
  }

  function buildParams() {
    const from = String(fromEl?.value || '').trim();
    const to = String(toEl?.value || '').trim();
    const level = String(levelEl?.value || '').trim();
    const actor = String(actorEl?.value || '').trim();
    const q = String(queryEl?.value || '').trim();
    return { from, to, level, actor, q };
  }

  function buildQueryString(params) {
    const q = new URLSearchParams();
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    if (params.level) q.set('level', params.level);
    if (params.actor) q.set('actor', params.actor);
    if (params.q) q.set('q', params.q);
    q.set('limit', '200');
    return q.toString();
  }

  function matchesFilter(log, params) {
    if (params.level && normalizeLevel(log.level) !== normalizeLevel(params.level)) return false;

    if (params.actor) {
      const a = String(log.actor || '').toLowerCase();
      if (!a.includes(params.actor.toLowerCase())) return false;
    }

    if (params.q) {
      const hay = `${log.message} ${log.action} ${log.resource} ${stableStringify(log.raw)}`.toLowerCase();
      if (!hay.includes(params.q.toLowerCase())) return false;
    }

    // Date filtering if timestamp is parseable
    const t = new Date(log.timestamp);
    if (!Number.isNaN(t.getTime())) {
      if (params.from) {
        const f = new Date(params.from + 'T00:00:00');
        if (!Number.isNaN(f.getTime()) && t < f) return false;
      }
      if (params.to) {
        const end = new Date(params.to + 'T23:59:59');
        if (!Number.isNaN(end.getTime()) && t > end) return false;
      }
    }

    return true;
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

    dLevel.innerHTML = `<span class="${levelBadgeClass(log.level)}">${normalizeLevel(log.level)}</span>`;
    setText(dActor, log.actor || 'System');
    setText(dAction, log.action || '—');
    setText(dResource, log.resource || '—');

    // Diff
    dDiff.innerHTML = '';
    const hasBeforeAfter = log.before != null || log.after != null;
    const diffs = hasBeforeAfter ? diffObjects(log.before, log.after) : [];

    if (diffs.length) {
      for (const row of diffs.slice(0, 50)) {
        const div = document.createElement('div');
        div.className = 'dp-diff__row';
        const path = document.createElement('div');
        path.className = 'dp-diff__path';
        path.textContent = row.path;
        const before = document.createElement('div');
        before.className = 'dp-diff__before';
        before.textContent = stableStringify(row.before);
        const after = document.createElement('div');
        after.className = 'dp-diff__after';
        after.textContent = stableStringify(row.after);
        div.appendChild(path);
        div.appendChild(before);
        div.appendChild(after);
        dDiff.appendChild(div);
      }
    } else if (log.diff && isObject(log.diff)) {
      const entries = Object.entries(log.diff);
      if (entries.length) {
        for (const [key, value] of entries.slice(0, 50)) {
          const div = document.createElement('div');
          div.className = 'dp-diff__row';
          const path = document.createElement('div');
          path.className = 'dp-diff__path';
          path.textContent = key;
          const before = document.createElement('div');
          before.className = 'dp-diff__before';
          before.textContent = stableStringify(value?.before ?? value?.old ?? value?.from ?? null);
          const after = document.createElement('div');
          after.className = 'dp-diff__after';
          after.textContent = stableStringify(value?.after ?? value?.new ?? value?.to ?? value);
          div.appendChild(path);
          div.appendChild(before);
          div.appendChild(after);
          dDiff.appendChild(div);
        }
      } else {
        dDiff.innerHTML = '<div class="dp-diff__empty">Sin cambios detectables.</div>';
      }
    } else {
      dDiff.innerHTML = '<div class="dp-diff__empty">Sin cambios detectables.</div>';
    }

    dJson.textContent = JSON.stringify(log.raw, null, 2);
  }

  function renderTable() {
    if (!tbody) return;
    tbody.innerHTML = '';

    const params = buildParams();
    const filtered = state.logs.filter(l => matchesFilter(l, params));

    setMeta(`${filtered.length} eventos`);

    if (!filtered.length) {
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

    for (const log of filtered.slice(0, 200)) {
      const tr = document.createElement('tr');
      if (state.selectedId && log.id && String(log.id) === String(state.selectedId)) tr.classList.add('is-selected');

      const tdTime = document.createElement('td');
      tdTime.textContent = formatTimestamp(log.timestamp);
      tdTime.className = 'dp-mono';

      const tdLevel = document.createElement('td');
      tdLevel.innerHTML = `<span class="${levelBadgeClass(log.level)}">${normalizeLevel(log.level)}</span>`;

      const tdActor = document.createElement('td');
      tdActor.textContent = log.actor || 'System';

      const tdAction = document.createElement('td');
      tdAction.textContent = log.action || '—';
      tdAction.className = 'dp-mono';

      const tdRes = document.createElement('td');
      tdRes.textContent = log.resource || '—';

      tr.appendChild(tdTime);
      tr.appendChild(tdLevel);
      tr.appendChild(tdActor);
      tr.appendChild(tdAction);
      tr.appendChild(tdRes);

      tr.addEventListener('click', () => {
        state.selectedId = log.id || null;
        renderTable();
        renderDetail(log);
      });

      tbody.appendChild(tr);
    }

    // Keep detail in sync with selection
    const selected = state.selectedId ? state.logs.find(l => String(l.id) === String(state.selectedId)) : null;
    renderDetail(selected || filtered[0]);
  }

  async function loadLogs({ useSearch }) {
    if (state.loading) return;
    state.loading = true;

    try {
      setPageError('');
      setMeta('Cargando...');

      const params = buildParams();
      const qs = buildQueryString(params);

      const searchUrl = dpBase
        ? `${dpBase}/api/dp/v1/logs/search?${qs}`
        : `/api/dp/v1/logs/search?${qs}`;
      const listUrl = dpBase
        ? `${dpBase}/api/dp/v1/logs?${qs}`
        : `/api/dp/v1/logs?${qs}`;

      let payload;
      if (useSearch && state.supportsSearch) {
        try {
          payload = await fetchJson(searchUrl, { method: 'GET' });
        } catch {
          state.supportsSearch = false;
          payload = await fetchJson(listUrl, { method: 'GET' });
        }
      } else {
        payload = await fetchJson(listUrl, { method: 'GET' });
      }

      state.logs = extractLogs(payload).map(mapLogFromApi);
      // newest first
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

  function initDefaultRange() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (!fromEl.value) fromEl.value = toIsoDateInputValue(sevenDaysAgo);
    if (!toEl.value) toEl.value = toIsoDateInputValue(now);
  }

  const debouncedReload = debounce(() => loadLogs({ useSearch: true }), 250);

  refreshBtn?.addEventListener('click', () => loadLogs({ useSearch: true }));
  exportBtn?.addEventListener('click', () => {
    const params = buildParams();
    const qs = buildQueryString(params);
    const url = dpBase ? `${dpBase}/api/dp/v1/logs/export?${qs}` : `/api/dp/v1/logs/export?${qs}`;
    // Best effort: open in a new tab if the backend supports export.
    window.open(url, '_blank');
  });

  fromEl?.addEventListener('change', debouncedReload);
  toEl?.addEventListener('change', debouncedReload);
  levelEl?.addEventListener('change', debouncedReload);
  actorEl?.addEventListener('input', debouncedReload);
  queryEl?.addEventListener('input', debouncedReload);

  detailClose?.addEventListener('click', () => renderDetail(null));

  initDefaultRange();
  await loadLogs({ useSearch: true });
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
