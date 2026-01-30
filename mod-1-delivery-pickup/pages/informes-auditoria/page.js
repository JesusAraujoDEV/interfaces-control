import { initDpLayout, mountDpSidebar } from '/mod-1-delivery-pickup/src/components/sidebar.js';
import { mergeHeaders, withBearerToken } from '/mod-1-delivery-pickup/src/services/auth-token.js';

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'hace unos segundos';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour}h`;
  if (diffDay < 7) return `hace ${diffDay}d`;
  return formatTimestamp(timestamp);
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
  const managerEmail = log?.manager?.email ?? null;
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
    managerEmail,
    timestamp: log?.timestamp_transition ?? log?.timestampTransition ?? null,
    statusFrom: log?.status_from ?? log?.statusFrom ?? null,
    statusTo: log?.status_to ?? log?.statusTo ?? null,
    cancellationReason: log?.cancellation_reason ?? log?.cancellationReason ?? null,
    resource: log?.resource ?? null,
    httpMethod: log?.http_method ?? log?.httpMethod ?? null,
  };
}

function isUuidV4(value) {
  const v = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function isReadableId(value) {
  const v = String(value || '').trim();
  return /^DL-\d+$/i.test(v);
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

// ============================================
// UI COMPONENT CREATORS
// ============================================

function createAvatar(managerName) {
  if (!managerName) return '<div class="audit-avatar">SYS</div>';

  const words = managerName.trim().split(/\s+/);
  let initials = '';
  if (words.length >= 2) {
    initials = words[0][0] + words[1][0];
  } else if (words.length === 1) {
    initials = words[0].substring(0, 2);
  } else {
    initials = 'U';
  }

  return `<div class="audit-avatar">${initials.toUpperCase()}</div>`;
}

function getStatusBadgeClass(status) {
  if (!status) return 'dp-badge--debug';
  const s = String(status).toUpperCase();
  if (s.includes('PENDING')) return 'dp-badge--pending';
  if (s.includes('KITCHEN')) return 'dp-badge--kitchen';
  if (s.includes('DISPATCH') || s.includes('READY')) return 'dp-badge--dispatch';
  if (s.includes('DELIVERED')) return 'dp-badge--delivered';
  if (s.includes('CANCEL')) return 'dp-badge--cancelled';
  return 'dp-badge--info';
}

function getTimelineNodeClass(status) {
  if (!status) return 'timeline-node--created';
  const s = String(status).toUpperCase();
  if (s.includes('KITCHEN')) return 'timeline-node--kitchen';
  if (s.includes('DISPATCH') || s.includes('READY')) return 'timeline-node--dispatch';
  if (s.includes('DELIVERED')) return 'timeline-node--delivered';
  if (s.includes('CANCEL')) return 'timeline-node--cancelled';
  return 'timeline-node--created';
}

function getTimelineIcon(status) {
  if (!status) return '📝';
  const s = String(status).toUpperCase();
  if (s.includes('KITCHEN')) return '🔥';
  if (s.includes('DISPATCH') || s.includes('READY')) return '🛍️';
  if (s.includes('DELIVERED')) return '🏁';
  if (s.includes('CANCEL')) return '🚫';
  return '📝';
}

function highlightJson(jsonString) {
  return jsonString
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');
}

// ============================================
// MAIN APPLICATION
// ============================================

export async function init() {
  if (!document.getElementById('dp-shell')) {
    initDpLayout();
    mountDpSidebar();
  }

  const dpBase = getDpUrl();

  // Elements
  const omniSearch = byId('omniSearch');
  const omniSearchClear = byId('omniSearchClear');
  const refreshBtn = byId('dpAuditRefresh');
  const exportBtn = byId('dpAuditExport');
  const prevBtn = byId('dpAuditPrev');
  const nextBtn = byId('dpAuditNext');

  const fromEl = byId('dpAuditFrom');
  const toEl = byId('dpAuditTo');
  const managerFilterEl = byId('dpAuditManagerFilter');
  const limitEl = byId('dpAuditLimit');

  const metaEl = byId('dpAuditMeta');
  const errorEl = byId('dpAuditError');
  const tbody = byId('dpAuditTableBody');

  const liveFeedView = byId('liveFeedView');
  const timelineView = byId('timelineView');
  const systemLogView = byId('systemLogView');
  const closeTimelineView = byId('closeTimelineView');
  const closeSystemLogView = byId('closeSystemLogView');

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
  const dOpenJson = byId('dpDetailOpenJson');

  const jsonModal = byId('jsonModal');
  const jsonContent = byId('jsonContent');
  const jsonCopyBtn = byId('jsonCopyBtn');
  const jsonCopyIcon = byId('jsonCopyIcon');
  const jsonCopyText = byId('jsonCopyText');
  const jsonCloseBtn = byId('jsonCloseBtn');

  const filterChips = document.querySelectorAll('.filter-chip');

  // State
  const state = {
    loading: false,
    logs: [],
    selectedId: null,
    selectedLog: null,
    limit: 50,
    offset: 0,
    currentView: 'liveFeed', // 'liveFeed', 'timeline', 'systemLog'
    activeFilters: {
      context: 'order', // 'alert', 'order', 'config', 'all'
    },
  };

  // ============================================
  // VIEW MANAGEMENT
  // ============================================

  function switchView(viewName) {
    state.currentView = viewName;

    liveFeedView.classList.toggle('hidden', viewName !== 'liveFeed');
    timelineView.classList.toggle('active', viewName === 'timeline');
    systemLogView.classList.toggle('active', viewName === 'systemLog');

    if (viewName === 'liveFeed') {
      liveFeedView.classList.remove('hidden');
      liveFeedView.style.gridColumn = '1 / -1';
    } else {
      liveFeedView.classList.add('hidden');
    }
  }

  // ============================================
  // SMART OMNI-SEARCH
  // ============================================

  function handleOmniSearch(query) {
    const trimmed = query.trim();

    if (!trimmed) {
      omniSearchClear.classList.remove('visible');
      state.offset = 0;
      loadLogs();
      return;
    }

    omniSearchClear.classList.add('visible');

    // UUID Detection - Auto-switch to Timeline
    if (isUuidV4(trimmed)) {
      loadOrderTimeline(trimmed);
      return;
    }

    // Readable ID Detection (DL-####)
    if (isReadableId(trimmed)) {
      // Search for this readable_id
      searchByReadableId(trimmed);
      return;
    }

    // General text search
    performTextSearch(trimmed);
  }

  async function loadOrderTimeline(orderId) {
    if (state.loading) return;
    state.loading = true;

    try {
      setPageError('');
      setMeta('Cargando timeline...');

      const qs = new URLSearchParams({ limit: 100, offset: 0 }).toString();
      const url = dpBase
        ? `${dpBase}/api/dp/v1/logs/by-order/${encodeURIComponent(orderId)}?${qs}`
        : `/api/dp/v1/logs/by-order/${encodeURIComponent(orderId)}?${qs}`;

      const payload = await fetchJson(url, { method: 'GET' });
      state.logs = extractLogs(payload).map(mapLogFromApi);

      // Sort ASC for timeline
      state.logs.sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();
        if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
        return ta - tb;
      });

      renderOrderTimeline(state.logs);
      switchView('timeline');
    } catch (e) {
      setPageError(normalizeErrorMessage(e));
    } finally {
      state.loading = false;
    }
  }

  async function searchByReadableId(readableId) {
    // For now, just filter the current logs
    // In a real implementation, you'd call an API endpoint
    const filtered = state.logs.filter(log =>
      log.readableId && log.readableId.toUpperCase() === readableId.toUpperCase()
    );

    if (filtered.length > 0 && filtered[0].orderId) {
      loadOrderTimeline(filtered[0].orderId);
    } else {
      setPageError(`No se encontró la orden ${readableId}`);
    }
  }

  function performTextSearch(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = state.logs.filter(log => {
      const searchText = [
        log.readableId,
        log.managerName,
        log.managerEmail,
        log.statusFrom,
        log.statusTo,
        log.cancellationReason,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchText.includes(lowerQuery);
    });

    renderTable(filtered);
  }

  omniSearch?.addEventListener('input', debounce((e) => {
    handleOmniSearch(e.target.value);
  }, 400));

  omniSearchClear?.addEventListener('click', () => {
    omniSearch.value = '';
    omniSearchClear.classList.remove('visible');
    state.offset = 0;
    loadLogs();
  });

  // ============================================
  // FILTER CHIPS
  // ============================================

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filterType = chip.dataset.filter;

      // Toggle active
      filterChips.forEach(c => {
        if (c.dataset.filter === filterType) {
          c.classList.toggle('active');
        } else {
          c.classList.remove('active');
        }
      });

      state.activeFilters.context = chip.classList.contains('active') ? filterType : 'all';
      state.offset = 0;
      loadLogs();
    });
  });

  // ============================================
  // DATA LOADING
  // ============================================

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
    const manager_id = String(managerFilterEl?.value || '').trim();

    const limit = Number(String(limitEl?.value || state.limit).trim());
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, limit)) : 50;
    state.limit = safeLimit;

    return {
      from,
      to,
      manager_id,
      limit: state.limit,
      offset: state.offset,
    };
  }

  function buildQueryString(params) {
    const q = new URLSearchParams();
    if (params.manager_id) q.set('manager_id', params.manager_id);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    q.set('limit', String(params.limit ?? 50));
    q.set('offset', String(params.offset ?? 0));
    return q.toString();
  }

  function hasAnyFilter(params) {
    return Boolean(params.manager_id || params.from || params.to);
  }

  async function loadLogs() {
    if (state.loading) return;
    state.loading = true;

    try {
      setPageError('');
      setMeta('Cargando...');

      const params = buildParams();

      let payload;
      if (hasAnyFilter(params)) {
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

      // Sort DESC for live feed
      state.logs.sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();
        if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
        return tb - ta;
      });

      // Apply context filter
      let filteredLogs = state.logs;
      if (state.activeFilters.context !== 'all') {
        filteredLogs = state.logs.filter(log => detectLogContext(log) === state.activeFilters.context);
      }

      renderTable(filteredLogs);
      switchView('liveFeed');
    } catch (e) {
      state.logs = [];
      renderTable([]);
      setPageError(normalizeErrorMessage(e));
    } finally {
      state.loading = false;
    }
  }

  function detectLogContext(log) {
    // Detect if log is alert, order, or config
    if (log.statusTo && log.statusTo.includes('CANCEL')) return 'alert';
    if (log.resource && (log.resource.includes('zones') || log.resource.includes('thresholds'))) return 'config';
    return 'order';
  }

  // ============================================
  // RENDERING
  // ============================================

  function renderTable(logs = state.logs) {
    if (!tbody) return;
    tbody.innerHTML = '';

    setMeta(`${logs.length} eventos · offset ${state.offset} · limit ${state.limit}`);

    if (!logs.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'text-slate-600 text-center';
      td.textContent = 'No hay eventos para los filtros seleccionados.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      renderDetail(null);
      return;
    }

    for (const log of logs) {
      const tr = document.createElement('tr');
      if (state.selectedId && log.id && String(log.id) === String(state.selectedId)) {
        tr.classList.add('is-selected');
      }

      // Timestamp
      const tdTime = document.createElement('td');
      tdTime.innerHTML = `
        <div class="audit-time-relative">${formatRelativeTime(log.timestamp)}</div>
        <div class="audit-time-absolute">${formatTimestamp(log.timestamp)}</div>
      `;

      // Order
      const tdOrder = document.createElement('td');
      const orderDisplay = log.readableId || log.orderId || '—';
      if (log.readableId || log.orderId) {
        tdOrder.innerHTML = `<a href="/admin/dp/orders/${encodeURIComponent(orderDisplay)}" class="audit-order-link">${orderDisplay}</a>`;
      } else {
        tdOrder.textContent = orderDisplay;
        tdOrder.className = 'dp-mono';
      }

      // Manager
      const tdManager = document.createElement('td');
      tdManager.innerHTML = `
        <div class="audit-manager-cell">
          ${createAvatar(log.managerName)}
          <div class="audit-manager-info">
            <div class="audit-manager-name">${log.managerName || 'System'}</div>
            ${log.managerEmail ? `<div class="audit-manager-email">${log.managerEmail}</div>` : ''}
          </div>
        </div>
      `;

      // Transition
      const tdTransition = document.createElement('td');
      const fromBadge = log.statusFrom ? `<span class="dp-badge ${getStatusBadgeClass(log.statusFrom)}">${log.statusFrom}</span>` : '<span class="text-slate-400">—</span>';
      const toBadge = log.statusTo ? `<span class="dp-badge ${getStatusBadgeClass(log.statusTo)}">${log.statusTo}</span>` : '<span class="text-slate-400">—</span>';
      tdTransition.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          ${fromBadge}
          <span style="color: rgb(148 163 184);">→</span>
          ${toBadge}
        </div>
      `;

      // Reason
      const tdReason = document.createElement('td');
      tdReason.textContent = log.cancellationReason || '—';
      tdReason.className = 'text-sm';

      // JSON Button
      const tdJson = document.createElement('td');
      tdJson.innerHTML = '<button class="dp-icon-btn json-btn" title="Ver JSON">📄</button>';
      tdJson.querySelector('.json-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openJsonModal(log);
      });

      tr.appendChild(tdTime);
      tr.appendChild(tdOrder);
      tr.appendChild(tdManager);
      tr.appendChild(tdTransition);
      tr.appendChild(tdReason);
      tr.appendChild(tdJson);

      tr.addEventListener('click', () => {
        state.selectedId = log.id || null;
        state.selectedLog = log;
        renderTable(logs);
        renderDetail(log);
      });

      tbody.appendChild(tr);
    }

    // Auto-select first if none selected
    const selected = state.selectedId ? logs.find(l => String(l.id) === String(state.selectedId)) : null;
    if (!selected && logs.length > 0) {
      state.selectedLog = logs[0];
      renderDetail(logs[0]);
    } else if (selected) {
      renderDetail(selected);
    }
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
    setHidden(detailClose, false);

    setText(dTimestamp, formatTimestamp(log.timestamp));
    setText(dLogId, log.id || '—');
    setText(dOrderId, log.orderId || '—');

    const manager = log.managerName
      ? `${log.managerName}${log.managerId ? ` (${log.managerId.substring(0, 8)}...)` : ''}`
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
  }

  function renderOrderTimeline(logs) {
    const timelineHeader = byId('timelineHeader');
    const timelineContainer = byId('timelineContainer');

    if (!logs.length) {
      timelineHeader.innerHTML = '<p class="text-slate-600">No hay eventos para esta orden.</p>';
      timelineContainer.innerHTML = '';
      return;
    }

    // Header with order summary
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];

    timelineHeader.innerHTML = `
      <div class="timeline-header-title">${firstLog.readableId || firstLog.orderId || 'Orden'}</div>
      <div class="timeline-header-meta">
        <div class="timeline-header-meta-item">
          <span>👤</span>
          <span>${firstLog.managerName || 'System'}</span>
        </div>
        <div class="timeline-header-meta-item">
          <span>📊</span>
          <span>Estado Actual: ${lastLog.statusTo || 'Desconocido'}</span>
        </div>
        <div class="timeline-header-meta-item">
          <span>📅</span>
          <span>${logs.length} eventos</span>
        </div>
      </div>
    `;

    // Timeline events
    const eventsHtml = logs.map((log, index) => {
      const nodeClass = getTimelineNodeClass(log.statusTo);
      const icon = getTimelineIcon(log.statusTo);

      return `
        <div class="timeline-event">
          <div class="timeline-node ${nodeClass}">${icon}</div>
          <div class="timeline-event-title">
            ${log.statusTo || 'Evento'}
          </div>
          <div class="timeline-event-time">${formatTimestamp(log.timestamp)}</div>
          <div class="timeline-event-transition">
            <span>${log.statusFrom || '—'}</span>
            <span style="color: rgb(148 163 184);">→</span>
            <span>${log.statusTo || '—'}</span>
          </div>
          ${log.cancellationReason ? `<div style="margin-top: 0.5rem; font-size: 0.875rem; color: rgb(100 116 139);">${log.cancellationReason}</div>` : ''}
          <div class="timeline-event-author">
            <span>por</span>
            <strong>${log.managerName || 'System'}</strong>
          </div>
        </div>
      `;
    }).join('');

    timelineContainer.innerHTML = `<div class="timeline-line"></div>${eventsHtml}`;
  }

  // ============================================
  // JSON MODAL
  // ============================================

  function openJsonModal(log) {
    if (!log) return;

    const jsonString = JSON.stringify(log.raw, null, 2);
    jsonContent.innerHTML = highlightJson(jsonString);
    jsonModal.classList.add('active');

    // Reset copy button
    jsonCopyIcon.textContent = '📋';
    jsonCopyText.textContent = 'Copiar JSON';
    jsonCopyBtn.classList.remove('copied');
  }

  function closeJsonModal() {
    jsonModal.classList.remove('active');
  }

  async function copyJsonToClipboard() {
    try {
      const jsonString = jsonContent.textContent;
      await navigator.clipboard.writeText(jsonString);

      // Visual feedback
      jsonCopyIcon.textContent = '✅';
      jsonCopyText.textContent = '¡Copiado!';
      jsonCopyBtn.classList.add('copied');

      setTimeout(() => {
        jsonCopyIcon.textContent = '📋';
        jsonCopyText.textContent = 'Copiar JSON';
        jsonCopyBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      jsonCopyIcon.textContent = '❌';
      jsonCopyText.textContent = 'Error';
    }
  }

  jsonCopyBtn?.addEventListener('click', copyJsonToClipboard);
  jsonCloseBtn?.addEventListener('click', closeJsonModal);
  jsonModal?.addEventListener('click', (e) => {
    if (e.target === jsonModal) closeJsonModal();
  });

  dOpenJson?.addEventListener('click', () => {
    if (state.selectedLog) openJsonModal(state.selectedLog);
  });

  // ============================================
  // VIEW CONTROLS
  // ============================================

  closeTimelineView?.addEventListener('click', () => {
    switchView('liveFeed');
    loadLogs();
  });

  closeSystemLogView?.addEventListener('click', () => {
    switchView('liveFeed');
    loadLogs();
  });

  // ============================================
  // PAGINATION & ACTIONS
  // ============================================

  const debouncedReload = debounce(() => {
    state.offset = 0;
    loadLogs();
  }, 250);

  refreshBtn?.addEventListener('click', () => loadLogs());
  exportBtn?.addEventListener('click', () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJson(`dp-audit-${stamp}.json`, state.logs.map((l) => l.raw));
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
  managerFilterEl?.addEventListener('change', debouncedReload);
  limitEl?.addEventListener('change', debouncedReload);

  detailClose?.addEventListener('click', () => renderDetail(null));

  // ============================================
  // INITIALIZE
  // ============================================

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
