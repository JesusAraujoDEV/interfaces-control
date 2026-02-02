import { fetchKpiJson, extractAnySource, getCacheStatus } from '/kpi-pruebas/src/services/kpi-api.js';
import { formatNumber, clamp } from '/kpi-pruebas/src/utils/format.js';

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

function renderTopSellers(data) {
  const list = document.getElementById('kpi-top-list');
  if (!list) return;

  const items = data?.top_sellers?.items || data?.items || [];
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = '<div class="text-sm text-slate-500">Sin datos</div>';
    return;
  }

  const maxValue = Math.max(...items.map(item => Number(item.sales || item.count || item.units || 0)), 1);

  items.forEach((item, index) => {
    const value = Number(item.sales || item.count || item.units || 0);
    const row = document.createElement('div');
    row.className = 'kpi-top-item';
    row.innerHTML = `
      <div class="text-sm font-semibold w-6">${index + 1}</div>
      <div class="flex-1">
        <div class="text-sm font-semibold">${item.name || item.product || 'Producto'}</div>
        <div class="kpi-top-bar mt-2"><span style="width: ${clamp((value / maxValue) * 100, 0, 100)}%"></span></div>
      </div>
      <div class="text-xs text-slate-500">${formatNumber(value)}</div>
    `;
    list.appendChild(row);
  });
}

function renderMenuAvailability(data) {
  const availability = Number(data?.menu_availability?.percentage ?? data?.percentage ?? data?.value ?? 0);
  const availabilityEl = document.getElementById('kpi-menu-availability');
  const bar = document.getElementById('kpi-menu-bar');
  if (availabilityEl) availabilityEl.textContent = `${availability.toFixed(1)}%`;
  if (bar) bar.style.width = `${clamp(availability, 0, 100)}%`;
  setDot(document.getElementById('kpi-menu-dot'), data?.sources || data?.source);
}

function renderLowStock(data) {
  const table = document.getElementById('kpi-stock-table');
  if (!table) return;

  const items = data?.inventory?.low_stock || data?.low_stock || data?.items || [];
  table.innerHTML = '';

  if (!items.length) {
    table.innerHTML = '<tr><td colspan="4" class="text-sm text-slate-500">Sin alertas</td></tr>';
    return;
  }

  items.forEach((item) => {
    const current = Number(item.current || item.stock || item.current_stock || 0);
    const min = Number(item.minimum || item.min || item.min_stock || 1);
    const pct = clamp((current / min) * 100, 0, 120);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.product || item.name || 'Producto'}</td>
      <td>${formatNumber(current)}</td>
      <td>${formatNumber(min)}</td>
      <td>
        <div class="kpi-bar kpi-bar--danger"><span style="width: ${clamp(pct, 0, 100)}%"></span></div>
      </td>
    `;
    table.appendChild(row);
  });

  setDot(document.getElementById('kpi-stock-dot'), data?.sources || data?.source);
}

function renderWaste(data) {
  const list = document.getElementById('kpi-waste-list');
  if (!list) return;
  const logs = data?.waste_logs || data?.logs || data?.items || [];

  list.innerHTML = '';
  if (!logs.length) {
    list.innerHTML = '<div class="text-sm text-slate-500">Sin registros recientes.</div>';
    return;
  }

  logs.slice(0, 5).forEach((log) => {
    const row = document.createElement('div');
    row.className = 'text-sm text-slate-700';
    row.textContent = `${log.product || log.item || 'Producto'} · ${log.reason || 'Merma'} · ${log.amount || ''}`;
    list.appendChild(row);
  });
}

async function loadAll() {
  const topSelect = document.getElementById('kpi-top-select');
  const limit = topSelect ? Number(topSelect.value) : 5;

  const [topRes, menuRes, stockRes, wasteRes] = await Promise.allSettled([
    fetchKpiJson('api/kpi/v1/product/top-sellers', { params: { top: limit } }),
    fetchKpiJson('api/kpi/v1/product/menu-availability'),
    fetchKpiJson('api/kpi/v1/inventory/low-stock'),
    fetchKpiJson('api/kpi/v1/inventory/waste-tracker')
  ]);

  if (topRes.status === 'fulfilled') {
    renderTopSellers(topRes.value);
  } else {
    document.getElementById('kpi-top-card')?.classList.add('kpi-disabled');
  }

  if (menuRes.status === 'fulfilled') {
    renderMenuAvailability(menuRes.value);
  } else {
    document.getElementById('kpi-menu-card')?.classList.add('kpi-disabled');
  }

  if (stockRes.status === 'fulfilled') {
    renderLowStock(stockRes.value);
  } else {
    document.getElementById('kpi-stock-card')?.classList.add('kpi-disabled');
  }

  if (wasteRes.status === 'fulfilled') {
    renderWaste(wasteRes.value);
  } else {
    document.getElementById('kpi-waste-card')?.classList.add('kpi-disabled');
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

  const select = document.getElementById('kpi-top-select');
  if (select) {
    select.addEventListener('change', () => {
      loadAll().catch(() => { });
    });
  }

  intervalId = setInterval(() => {
    loadAll().catch(() => { });
  }, 60000);

  window.__kpiCleanup = clearRefresh;
}
