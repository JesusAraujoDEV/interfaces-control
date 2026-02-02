import { fetchKpiJson, extractAnySource, getCacheStatus, getUpdatedAt } from '/kpi-pruebas/src/services/kpi-api.js';
import { formatCurrency, formatNumber, clamp } from '/kpi-pruebas/src/utils/format.js';

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

function updateFreshnessTimestamp(source) {
  const updatedAt = getUpdatedAt(extractAnySource(source));
  const el = document.getElementById('kpi-last-updated');
  if (!el) return;
  if (!updatedAt) {
    el.textContent = '';
    return;
  }
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    el.textContent = '';
    return;
  }
  el.textContent = `Actualizado ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderOverview(data) {
  const revenueTotal = data?.financial_summary?.daily_revenue?.total ?? 0;
  const revenueDelivery = data?.financial_summary?.daily_revenue?.delivery ?? 0;
  const revenueDine = data?.financial_summary?.daily_revenue?.dine_in ?? 0;
  const avgTicket = data?.financial_summary?.average_ticket ?? 0;

  const activeOrders = data?.operational_health?.active_delivery_orders ?? 0;
  const kitchenLoad = (data?.operational_health?.kitchen_load || 'LOW').toString().toUpperCase();

  const lowStockItems = data?.critical_alerts?.low_stock_items || [];
  const deliveryDelays = data?.critical_alerts?.delivery_delays ?? 0;
  const ghostWarning = data?.critical_alerts?.ghost_clients_warning ?? 0;

  const revenueEl = document.getElementById('kpi-revenue-total');
  const revenueSplit = document.getElementById('kpi-revenue-split');
  if (revenueEl) revenueEl.textContent = formatCurrency(revenueTotal);
  if (revenueSplit) revenueSplit.textContent = `🛵 ${formatCurrency(revenueDelivery)} vs 🍽️ ${formatCurrency(revenueDine)}`;

  const aovEl = document.getElementById('kpi-aov');
  if (aovEl) aovEl.textContent = formatCurrency(avgTicket);

  const ordersEl = document.getElementById('kpi-active-orders');
  if (ordersEl) ordersEl.textContent = formatNumber(activeOrders);

  const ordersCard = document.getElementById('kpi-active-orders-card');
  if (ordersCard) {
    const status = activeOrders > 18 ? 'high' : 'low';
    ordersCard.setAttribute('data-status', status);
  }

  const loadEl = document.getElementById('kpi-kitchen-load');
  if (loadEl) loadEl.textContent = kitchenLoad;

  const needle = document.getElementById('kpi-kitchen-needle');
  if (needle) {
    const map = { LOW: 20, MEDIUM: 90, HIGH: 150, CRITICAL: 210 };
    const angle = map[kitchenLoad] ?? 20;
    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }

  const lowStockEl = document.getElementById('kpi-low-stock');
  if (lowStockEl) {
    const list = Array.isArray(lowStockItems) && lowStockItems.length ? lowStockItems.join(', ') : 'Sin alertas';
    lowStockEl.textContent = list;
  }

  const delaysEl = document.getElementById('kpi-delivery-delays');
  if (delaysEl) delaysEl.textContent = formatNumber(deliveryDelays);

  const ghostEl = document.getElementById('kpi-ghost-warning');
  if (ghostEl) {
    ghostEl.textContent = ghostWarning > 0 ? `${ghostWarning} mesas con inactividad` : 'Sin alertas';
  }

  const statusEl = document.getElementById('kpi-status-message');
  const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
  if (statusEl) {
    statusEl.textContent = warnings.length ? warnings.map(w => w?.message || w?.description || 'Datos parciales').join(' · ') : 'Sin advertencias';
  }

  const kitchenCard = document.getElementById('kpi-kitchen-card');
  if (kitchenCard) {
    const hasKitchenWarning = warnings.some(w => `${w?.module || w?.source || w?.message || ''}`.toLowerCase().includes('cocina') || `${w?.module || w?.source || w?.message || ''}`.toLowerCase().includes('kitchen'));
    kitchenCard.classList.toggle('kpi-disabled', hasKitchenWarning);
  }

  setDot(document.getElementById('kpi-revenue-dot'), data?.sources);
  setDot(document.getElementById('kpi-aov-dot'), data?.sources);
  setDot(document.getElementById('kpi-orders-dot'), data?.sources);
  setDot(document.getElementById('kpi-kitchen-dot'), data?.sources);
  updateFreshnessTimestamp(data?.sources);
}

async function loadOverview() {
  const data = await fetchKpiJson('/api/kpi/v1/dashboard/overview');
  renderOverview(data);
}

function clearRefresh() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function init() {
  clearRefresh();
  await loadOverview();
  intervalId = setInterval(() => {
    loadOverview().catch(() => {});
  }, 15000);

  window.__kpiCleanup = clearRefresh;
}
