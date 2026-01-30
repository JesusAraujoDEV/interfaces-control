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
  return log?.log_id ?? log?.id ?? log?._id ?? log?.uuid ?? null;
}

function mapLogFromApi(log) {
  const orderId = log?.order_id ?? log?.orderId ?? null;
  const readableId = log?.order?.readable_id ?? log?.order?.readableId ?? log?.readable_id ?? log?.readableId ?? null;
  const manager = log?.manager_display ?? log?.manager ?? null;

  return {
    raw: log,
    id: logId(log),
    orderId,
    readableId,
    manager,
    timestamp: log?.timestamp_transition ?? log?.timestampTransition ?? log?.timestamp ?? null,
    statusFrom: log?.status_from ?? log?.statusFrom ?? null,
    statusTo: log?.status_to ?? log?.statusTo ?? null,
    cancellationReason: log?.cancellation_reason ?? log?.cancellationReason ?? null,
    resource: log?.resource ?? log?.logs_type ?? null,
    httpMethod: log?.http_method ?? log?.httpMethod ?? null,
    path: log?.path ?? null,
    order: log?.order ?? null,
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
// NIVEL DIOS: PHANTOM ENTITY & FORMATTING
// ============================================

/**
 * Formatear nombres técnicos de métricas a formato legible
 * TIEMPO_MAXIMO_COCINA_MINUTOS → Tiempo Max. Cocina (Min)
 */
function formatMetricName(metric) {
  if (!metric) return '—';

  return metric
    .replace(/_/g, ' ')
    .replace('TIEMPO MAXIMO', 'Tiempo Max.')
    .replace('CAPACIDAD MAXIMA', 'Capacidad Max.')
    .replace(/\b\w+/g, (word) => {
      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

/**
 * Obtener nombre de zona con fallback para entidades eliminadas (fantasmas 👻)
 */
function getZoneName(zoneId, zonesMap) {
  if (!zoneId) return '—';
  const name = zonesMap[zoneId];
  if (name) return name;

  // Phantom entity - zona eliminada
  return `<span class="phantom-entity">Zona Eliminada (${zoneId.substring(0, 8)}...)</span>`;
}

/**
 * Obtener nombre de threshold con fallback para entidades eliminadas
 */
function getThresholdName(thresholdId, thresholdsMap) {
  if (!thresholdId) return '—';
  const metric = thresholdsMap[thresholdId];
  if (metric) return formatMetricName(metric);

  // Phantom entity - threshold eliminado
  return `<span class="phantom-entity">Umbral Eliminado (${thresholdId.substring(0, 8)}...)</span>`;
}

/**
 * Extraer UUID de un path
 * /api/dp/v1/zones/dbd1294d-1f92-43f5-a71d-27a1ab4fc9e6/activate → dbd1294d-1f92-43f5-a71d-27a1ab4fc9e6
 */
function extractResourceId(path, resourceType) {
  if (!path) return null;
  const pattern = new RegExp(`/${resourceType}/([a-f0-9-]{36})`, 'i');
  const match = path.match(pattern);
  return match ? match[1] : null;
}

/**
 * Detectar acción desde path y http_method
 */
function detectAction(log, resourceType) {
  const { path, httpMethod } = log;

  if (!path) {
    return { action: 'Modificación', badge: '⚙️', className: 'action-badge--modification' };
  }

  if (path.endsWith('/activate')) {
    return { action: 'Activación', badge: '🟢', className: 'action-badge--activation' };
  }

  if (path.endsWith('/deactivate')) {
    return { action: 'Desactivación', badge: '🔴', className: 'action-badge--deactivation' };
  }

  if (httpMethod === 'POST') {
    return { action: 'Creación', badge: '🔵', className: 'action-badge--creation' };
  }

  return { action: 'Modificación', badge: '⚙️', className: 'action-badge--modification' };
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
  const statusEl = byId('dpAuditStatus');
  const limitEl = byId('dpAuditLimit');

  const metaEl = byId('dpAuditMeta');
  const errorEl = byId('dpAuditError');
  const tableHeader = byId('tableHeader');
  const tbody = byId('dpAuditTableBody');
  const currentTabTitle = byId('currentTabTitle');

  const detailWrap = byId('dpAuditDetail');
  const detailHint = byId('dpAuditDetailHint');
  const detailClose = byId('dpAuditDetailClose');
  const dTimestamp = byId('dpDetailTimestamp');
  const dLogId = byId('dpDetailLogId');
  const dOrderId = byId('dpDetailOrderId');
  const dManager = byId('dpDetailManager');
  const dTransition = byId('dpDetailTransition');
  const dResource = byId('dpDetailResource');
  const dAction = byId('dpDetailAction');
  const dOpenOrder = byId('dpDetailOpenOrder');
  const dOpenJson = byId('dpDetailOpenJson');

  // Detail panel conditional rows
  const dOrderRow = byId('dpDetailOrderRow');
  const dTransitionRow = byId('dpDetailTransitionRow');
  const dResourceRow = byId('dpDetailResourceRow');
  const dActionRow = byId('dpDetailActionRow');
  const dOpenOrderBtn = byId('dpDetailOpenOrderBtn');

  const jsonModal = byId('jsonModal');
  const jsonContent = byId('jsonContent');
  const jsonCopyBtn = byId('jsonCopyBtn');
  const jsonCopyIcon = byId('jsonCopyIcon');
  const jsonCopyText = byId('jsonCopyText');
  const jsonCloseBtn = byId('jsonCloseBtn');

  const tabButtons = document.querySelectorAll('.audit-tab');

  // State
  const state = {
    loading: false,
    logs: [],
    selectedId: null,
    selectedLog: null,
    limit: 50,
    offset: 0,
    currentTab: 'orders', // 'orders', 'zones', 'thresholds'
    zonesMap: {},
    thresholdsMap: {},
    catalogsLoaded: false,
  };

  // ============================================
  // NIVEL DIOS: URL PERSISTENCE (Deep Linking)
  // ============================================

  function getTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return ['orders', 'zones', 'thresholds'].includes(tab) ? tab : 'orders';
  }

  function updateUrlTab(tab) {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }

  // ============================================
  // NIVEL DIOS: PARALLEL CATALOG PRE-LOADING
  // ============================================

  async function preloadCatalogs() {
    if (state.catalogsLoaded) return;

    try {
      console.log('🔄 Precargando catálogos de zonas y umbrales...');

      const [zones, thresholds] = await Promise.all([
        fetchJson(dpBase ? `${dpBase}/api/dp/v1/zones` : '/api/dp/v1/zones'),
        fetchJson(dpBase ? `${dpBase}/api/dp/v1/thresholds` : '/api/dp/v1/thresholds'),
      ]);

      // Map zones
      (zones || []).forEach(z => {
        state.zonesMap[z.zone_id] = z.zone_name;
      });

      // Map thresholds
      (thresholds || []).forEach(t => {
        state.thresholdsMap[t.threshold_id] = t.metric_affected;
      });

      state.catalogsLoaded = true;
      console.log(`✅ Catálogos cargados: ${Object.keys(state.zonesMap).length} zonas, ${Object.keys(state.thresholdsMap).length} umbrales`);
    } catch (e) {
      console.error('❌ Error cargando catálogos de auditoría:', e);
      // Continue anyway - phantom handling will take care of missing mappings
    }
  }

  // ============================================
  // TAB MANAGEMENT
  // ============================================

  function switchTab(tabName) {
    if (state.currentTab === tabName) return;

    state.currentTab = tabName;
    state.offset = 0; // Reset pagination

    // Update URL
    updateUrlTab(tabName);

    // Update tab buttons
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab title
    const titles = {
      orders: 'Órdenes',
      zones: 'Zonas',
      thresholds: 'Umbrales',
    };
    if (currentTabTitle) currentTabTitle.textContent = titles[tabName] || 'Logs';

    // Show/hide status filter (only for orders)
    if (statusEl) {
      statusEl.style.display = tabName === 'orders' ? '' : 'none';
    }

    // Update table headers
    updateTableHeaders(tabName);

    // Load data
    loadLogs();
  }

  function updateTableHeaders(tabName) {
    if (!tableHeader) return;

    let headers = '';

    if (tabName === 'orders') {
      headers = `
        <tr>
          <th style="width: 180px;">Timestamp</th>
          <th style="width: 140px;">Orden</th>
          <th>Manager</th>
          <th>Transición</th>
          <th>Motivo</th>
          <th style="width: 80px;">JSON</th>
        </tr>
      `;
    } else if (tabName === 'zones') {
      headers = `
        <tr>
          <th style="width: 180px;">Timestamp</th>
          <th>Manager</th>
          <th>Zona Afectada</th>
          <th>Acción</th>
          <th style="width: 80px;">JSON</th>
        </tr>
      `;
    } else if (tabName === 'thresholds') {
      headers = `
        <tr>
          <th style="width: 180px;">Timestamp</th>
          <th>Manager</th>
          <th>Umbral Afectado</th>
          <th>Acción</th>
          <th style="width: 80px;">JSON</th>
        </tr>
      `;
    }

    tableHeader.innerHTML = headers;
  }

  // Set up tab listeners
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

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

    // UUID Detection
    if (isUuidV4(trimmed)) {
      // Could be order_id - try to filter
      performTextSearch(trimmed);
      return;
    }

    // Readable ID Detection (DL-####)
    if (isReadableId(trimmed)) {
      performTextSearch(trimmed);
      return;
    }

    // General text search
    performTextSearch(trimmed);
  }

  function performTextSearch(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = state.logs.filter(log => {
      const searchText = [
        log.readableId,
        log.manager,
        log.statusFrom,
        log.statusTo,
        log.cancellationReason,
        log.id,
        log.orderId,
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
    const status = state.currentTab === 'orders' ? String(statusEl?.value || '').trim() : '';

    const limit = Number(String(limitEl?.value || state.limit).trim());
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, limit)) : 50;
    state.limit = safeLimit;

    return {
      resource: state.currentTab,
      status,
      from,
      to,
      limit: state.limit,
      offset: state.offset,
    };
  }

  function buildQueryString(params) {
    const q = new URLSearchParams();

    // Resource parameter (required for filtering)
    if (params.resource) q.set('resource', params.resource);

    // Status (only for orders)
    if (params.status) q.set('status', params.status);

    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    q.set('limit', String(params.limit ?? 50));
    q.set('offset', String(params.offset ?? 0));

    return q.toString();
  }

  async function loadLogs() {
    if (state.loading) return;
    state.loading = true;

    try {
      setPageError('');
      setMeta('Cargando...');

      const params = buildParams();
      const qs = buildQueryString(params);
      const url = dpBase
        ? `${dpBase}/api/dp/v1/logs?${qs}`
        : `/api/dp/v1/logs?${qs}`;

      const payload = await fetchJson(url, { method: 'GET' });
      state.logs = extractLogs(payload).map(mapLogFromApi);

      // Sort DESC
      state.logs.sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();
        if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
        return tb - ta;
      });

      renderTable(state.logs);
    } catch (e) {
      state.logs = [];
      renderTable([]);
      setPageError(normalizeErrorMessage(e));
    } finally {
      state.loading = false;
    }
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

      if (state.currentTab === 'orders') {
        renderOrderRow(tr, log);
      } else if (state.currentTab === 'zones') {
        renderZoneRow(tr, log);
      } else if (state.currentTab === 'thresholds') {
        renderThresholdRow(tr, log);
      }

      tr.addEventListener('click', () => {
        state.selectedId = log.id || null;
        state.selectedLog = log;
        renderTable(logs);
        renderDetail(log);
      });

      tbody.appendChild(tr);
    }

    // Auto-select first if none selected
    if (!state.selectedLog && logs.length > 0) {
      state.selectedLog = logs[0];
      renderDetail(logs[0]);
    }
  }

  function renderOrderRow(tr, log) {
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
      tdOrder.innerHTML = `<a href="/admin/dp/orders/${encodeURIComponent(orderDisplay)}" class="audit-order-link" onclick="event.stopPropagation()">${orderDisplay}</a>`;
    } else {
      tdOrder.textContent = orderDisplay;
      tdOrder.className = 'dp-mono';
    }

    // Manager
    const tdManager = document.createElement('td');
    tdManager.innerHTML = `
      <div class="audit-manager-cell">
        ${createAvatar(log.manager)}
        <div class="audit-manager-info">
          <div class="audit-manager-name">${log.manager || 'System'}</div>
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
  }

  function renderZoneRow(tr, log) {
    // Timestamp
    const tdTime = document.createElement('td');
    tdTime.innerHTML = `
      <div class="audit-time-relative">${formatRelativeTime(log.timestamp)}</div>
      <div class="audit-time-absolute">${formatTimestamp(log.timestamp)}</div>
    `;

    // Manager
    const tdManager = document.createElement('td');
    tdManager.innerHTML = `
      <div class="audit-manager-cell">
        ${createAvatar(log.manager)}
        <div class="audit-manager-info">
          <div class="audit-manager-name">${log.manager || 'System'}</div>
        </div>
      </div>
    `;

    // Zona Afectada (with phantom handling)
    const tdZone = document.createElement('td');
    const zoneId = extractResourceId(log.path, 'zones');
    tdZone.innerHTML = getZoneName(zoneId, state.zonesMap);

    // Acción
    const tdAction = document.createElement('td');
    const actionInfo = detectAction(log, 'zones');
    tdAction.innerHTML = `
      <div class="action-badge ${actionInfo.className}">
        <span class="action-badge__icon">${actionInfo.badge}</span>
        <span>${actionInfo.action}</span>
      </div>
    `;

    // JSON Button
    const tdJson = document.createElement('td');
    tdJson.innerHTML = '<button class="dp-icon-btn json-btn" title="Ver JSON">📄</button>';
    tdJson.querySelector('.json-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openJsonModal(log);
    });

    tr.appendChild(tdTime);
    tr.appendChild(tdManager);
    tr.appendChild(tdZone);
    tr.appendChild(tdAction);
    tr.appendChild(tdJson);
  }

  function renderThresholdRow(tr, log) {
    // Timestamp
    const tdTime = document.createElement('td');
    tdTime.innerHTML = `
      <div class="audit-time-relative">${formatRelativeTime(log.timestamp)}</div>
      <div class="audit-time-absolute">${formatTimestamp(log.timestamp)}</div>
    `;

    // Manager
    const tdManager = document.createElement('td');
    tdManager.innerHTML = `
      <div class="audit-manager-cell">
        ${createAvatar(log.manager)}
        <div class="audit-manager-info">
          <div class="audit-manager-name">${log.manager || 'System'}</div>
        </div>
      </div>
    `;

    // Umbral Afectado (with phantom handling)
    const tdThreshold = document.createElement('td');
    const thresholdId = extractResourceId(log.path, 'thresholds');
    tdThreshold.innerHTML = getThresholdName(thresholdId, state.thresholdsMap);

    // Acción
    const tdAction = document.createElement('td');
    const actionInfo = detectAction(log, 'thresholds');
    tdAction.innerHTML = `
      <div class="action-badge ${actionInfo.className}">
        <span class="action-badge__icon">${actionInfo.badge}</span>
        <span>${actionInfo.action}</span>
      </div>
    `;

    // JSON Button
    const tdJson = document.createElement('td');
    tdJson.innerHTML = '<button class="dp-icon-btn json-btn" title="Ver JSON">📄</button>';
    tdJson.querySelector('.json-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openJsonModal(log);
    });

    tr.appendChild(tdTime);
    tr.appendChild(tdManager);
    tr.appendChild(tdThreshold);
    tr.appendChild(tdAction);
    tr.appendChild(tdJson);
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

    // Manager
    const manager = log.manager || 'System';
    setText(dManager, manager);

    // Conditional fields based on resource type
    if (state.currentTab === 'orders') {
      setHidden(dOrderRow, false);
      setHidden(dTransitionRow, false);
      setHidden(dResourceRow, true);
      setHidden(dActionRow, true);
      setHidden(dOpenOrderBtn, false);

      setText(dOrderId, log.orderId || '—');
      const from = log.statusFrom ? String(log.statusFrom) : '—';
      const to = log.statusTo ? String(log.statusTo) : '—';
      setText(dTransition, `${from} → ${to}`);

      if (dOpenOrder) {
        const orderKey = log.readableId || log.orderId;
        if (orderKey) {
          dOpenOrder.href = `/admin/dp/orders/${encodeURIComponent(orderKey)}`;
        } else {
          dOpenOrder.href = '#';
        }
      }
    } else {
      setHidden(dOrderRow, true);
      setHidden(dTransitionRow, true);
      setHidden(dResourceRow, false);
      setHidden(dActionRow, false);
      setHidden(dOpenOrderBtn, true);

      // Resource name
      if (state.currentTab === 'zones') {
        const zoneId = extractResourceId(log.path, 'zones');
        dResource.innerHTML = getZoneName(zoneId, state.zonesMap);
      } else if (state.currentTab === 'thresholds') {
        const thresholdId = extractResourceId(log.path, 'thresholds');
        dResource.innerHTML = getThresholdName(thresholdId, state.thresholdsMap);
      }

      // Action
      const actionInfo = detectAction(log, state.currentTab);
      setText(dAction, `${actionInfo.badge} ${actionInfo.action}`);
    }
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
  // PAGINATION & ACTIONS
  // ============================================

  const debouncedReload = debounce(() => {
    state.offset = 0;
    loadLogs();
  }, 250);

  refreshBtn?.addEventListener('click', () => loadLogs());
  exportBtn?.addEventListener('click', () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJson(`dp-audit-${state.currentTab}-${stamp}.json`, state.logs.map((l) => l.raw));
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
  limitEl?.addEventListener('change', debouncedReload);

  detailClose?.addEventListener('click', () => renderDetail(null));

  // ============================================
  // INITIALIZE
  // ============================================

  // Preload catalogs in parallel
  await preloadCatalogs();

  // Get tab from URL (deep linking)
  const initialTab = getTabFromUrl();
  state.currentTab = initialTab;

  // Set active tab
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === initialTab) {
      btn.classList.add('active');
    }
  });

  // Update tab title
  const titles = {
    orders: 'Órdenes',
    zones: 'Zonas',
    thresholds: 'Umbrales',
  };
  if (currentTabTitle) currentTabTitle.textContent = titles[initialTab] || 'Logs';

  // Show/hide status filter
  if (statusEl) {
    statusEl.style.display = initialTab === 'orders' ? '' : 'none';
  }

  // Update table headers
  updateTableHeaders(initialTab);

  // Load initial data
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
