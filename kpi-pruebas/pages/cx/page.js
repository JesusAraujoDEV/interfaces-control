import { fetchKpiJson, extractAnySource, getCacheStatus } from '/kpi-pruebas/src/services/kpi-api.js';
import { formatMinutes, formatNumber, clamp } from '/kpi-pruebas/src/utils/format.js';

let intervalId = null;

function setDot(dot, source) {
  if (!dot) return;
  const status = getCacheStatus(extractAnySource(source));
  dot.classList.remove('kpi-dot--live', 'kpi-dot--cache');
  if (status === 'MISS') {
    dot.classList.add('kpi-dot--live');
    dot.title = 'Dato en vivo';
  } else if (status === 'HIT') {
    dot.classList.add('kpi-dot--cache');
    dot.title = 'Dato en caché';
  } else {
    dot.classList.add('kpi-dot--cache');
    dot.title = 'Dato recibido';
  }
}

function renderOccupancy(data) {
  const percent = Number(data?.room_occupancy?.percent ?? data?.percent ?? 0);
  const occupied = Number(data?.room_occupancy?.occupied ?? data?.occupied_tables ?? 0);
  const total = Number(data?.room_occupancy?.total ?? data?.total_tables ?? 0);

  const grid = document.getElementById('kpi-occupancy-grid');
  if (grid) {
    grid.innerHTML = '';
    const seats = total || 25;
    const occupiedCount = occupied || Math.round((percent / 100) * seats);

    for (let i = 0; i < seats; i += 1) {
      const cell = document.createElement('div');
      const isOccupied = i < occupiedCount;
      cell.className = isOccupied ? 'kpi-seat kpi-seat--occupied' : 'kpi-seat';
      if (isOccupied && i % 5 === 0) cell.classList.add('kpi-seat--hot');
      grid.appendChild(cell);
    }
  }

  const label = document.getElementById('kpi-occupancy-label');
  if (label) label.textContent = `${formatNumber(occupied)} de ${formatNumber(total || 25)} mesas ocupadas`;

  setDot(document.getElementById('kpi-occupancy-dot'), data?.sources || data?.source);
}

function renderServiceQuality(data) {
  const avg = Number(data?.service_quality?.avg_response_minutes ?? data?.avg_response_minutes ?? 0);
  const pending = Number(data?.service_quality?.pending_calls ?? data?.pending_calls ?? 0);

  const timeEl = document.getElementById('kpi-response-time');
  if (timeEl) timeEl.textContent = formatMinutes(avg);

  const btn = document.getElementById('kpi-pending-calls');
  if (btn) {
    if (pending > 0) {
      btn.classList.remove('hidden');
      btn.classList.add('kpi-blink');
      btn.textContent = `Llamadas Pendientes (${formatNumber(pending)})!`;
    } else {
      btn.classList.add('hidden');
      btn.classList.remove('kpi-blink');
    }
  }

  setDot(document.getElementById('kpi-service-dot'), data?.sources || data?.source);
}

function renderGhostClients(data) {
  const list = document.getElementById('kpi-ghost-list');
  if (!list) return;

  const items = data?.ghost_clients || data?.tables || data?.items || [];
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = '<div class="text-sm text-slate-500">Sin alertas de mesas.</div>';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm';
    row.innerHTML = `
      <div>Mesa ${item.table || item.id || ''} - ${item.minutes || item.inactive_minutes || 0} min sin pedir</div>
      <button class="text-xs font-semibold text-brand-800">Liberar Mesa</button>
    `;
    list.appendChild(row);
  });

  setDot(document.getElementById('kpi-ghost-dot'), data?.sources || data?.source);
}

async function loadAll() {
  const [serviceRes, occupancyRes, ghostRes] = await Promise.allSettled([
    fetchKpiJson('/cx/service-quality'),
    fetchKpiJson('/cx/room-occupancy'),
    fetchKpiJson('/cx/ghost-clients')
  ]);

  if (serviceRes.status === 'fulfilled') {
    renderServiceQuality(serviceRes.value);
  } else {
    document.getElementById('kpi-service-card')?.classList.add('kpi-disabled');
  }

  if (occupancyRes.status === 'fulfilled') {
    renderOccupancy(occupancyRes.value);
  } else {
    document.getElementById('kpi-occupancy-card')?.classList.add('kpi-disabled');
  }

  if (ghostRes.status === 'fulfilled') {
    renderGhostClients(ghostRes.value);
  } else {
    document.getElementById('kpi-ghost-card')?.classList.add('kpi-disabled');
  }
}

function clearRefresh() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function init() {
  clearRefresh();
  await loadAll();
  intervalId = setInterval(() => {
    loadAll().catch(() => {});
  }, 60000);

  window.__kpiCleanup = clearRefresh;
}
