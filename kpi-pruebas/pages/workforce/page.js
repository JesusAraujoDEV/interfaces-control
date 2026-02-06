import { extractAnySource, getCacheStatus } from '/kpi-pruebas/src/services/kpi-api.js';
import { getOrdersPerChef, getWaiterRanking } from '/kpi-pruebas/src/services/kpi-data.js';
import { formatNumber } from '/kpi-pruebas/src/utils/format.js';

let intervalId = null;
let waiterPage = 1;
const pageSize = 5;
let totalWaiters = 0;
let isLoadingWaiters = false;

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

function renderWorkforce(data) {
  const ratio = Number(data?.orders_per_chef?.ratio ?? data?.ratio ?? 0);
  const chefs = Number(data?.orders_per_chef?.chefs ?? data?.chefs ?? data?.active_chefs ?? 0);
  const tasks = Number(data?.orders_per_chef?.tasks ?? data?.tasks ?? data?.pending_tasks ?? 0);

  const ratioEl = document.getElementById('kpi-workforce-ratio');
  if (ratioEl) ratioEl.textContent = ratio.toFixed(1);

  const container = document.getElementById('kpi-chef-icons');
  if (container) {
    container.innerHTML = '';
    const count = Math.max(chefs, 1);
    for (let i = 0; i < count; i += 1) {
      const span = document.createElement('span');
      span.className = ratio > 5 ? 'kpi-chef kpi-chef--hot' : 'kpi-chef';
      span.textContent = '👨‍🍳';
      container.appendChild(span);
    }
  }

  const summary = document.getElementById('kpi-chef-summary');
  if (summary) summary.textContent = `${formatNumber(chefs)} chefs activos vs ${formatNumber(tasks)} pedidos`;

  setDot(document.getElementById('kpi-workforce-dot'), data?.sources || data?.source);
}

function renderWaiterRanking(items, { offset = 0, append = false } = {}) {
  const list = document.getElementById('kpi-waiter-list');
  if (!list) return;

  if (!append) list.innerHTML = '';

  if (!items.length && !append) {
    list.innerHTML = '<div class="text-sm text-slate-500">Sin datos disponibles.</div>';
    return;
  }

  items.forEach((item, index) => {
    const rank = offset + index + 1;
    const row = document.createElement('div');
    row.className = 'kpi-waiter-row';
    row.innerHTML = `
      <div class="kpi-waiter-rank">${rank}º</div>
      <div class="kpi-waiter-meta">
        <div class="text-sm font-semibold text-slate-800">${item.name || 'Sin nombre'}</div>
        <div class="kpi-waiter-volume">${formatNumber(item.total_reviews ?? 0)} opiniones</div>
      </div>
      <div class="kpi-waiter-score">${Number(item.average ?? 0).toFixed(1)} ⭐</div>
    `;
    list.appendChild(row);
  });
}

function updateWaiterPagination({ loadedCount, itemsCount }) {
  const pageEl = document.getElementById('kpi-waiter-page');
  if (pageEl) pageEl.textContent = `Página ${waiterPage}`;

  const btn = document.getElementById('kpi-waiter-more');
  if (!btn) return;

  const hasTotal = Number.isFinite(totalWaiters) && totalWaiters > 0;
  const hasMore = hasTotal ? loadedCount < totalWaiters : itemsCount === pageSize;
  btn.disabled = !hasMore || isLoadingWaiters;
  btn.textContent = hasMore ? 'Ver más' : 'Sin más resultados';
}

async function loadWaiterRanking({ append = false } = {}) {
  if (isLoadingWaiters) return;
  isLoadingWaiters = true;

  const btn = document.getElementById('kpi-waiter-more');
  if (btn) btn.disabled = true;

  try {
    const data = await getWaiterRanking({ page: waiterPage, pageSize });
    const ranking = data?.waiter_ranking || {};
    const items = Array.isArray(ranking.items) ? ranking.items : [];
    totalWaiters = Number(ranking.total_waiters ?? 0);

    renderWaiterRanking(items, { offset: (waiterPage - 1) * pageSize, append });
    const loadedCount = (waiterPage - 1) * pageSize + items.length;
    updateWaiterPagination({ loadedCount, itemsCount: items.length });

    setDot(document.getElementById('kpi-waiter-dot'), data?.sources || data?.source);
  } catch {
    document.getElementById('kpi-waiter-card')?.classList.add('kpi-disabled');
  } finally {
    isLoadingWaiters = false;
  }
}

async function loadAll() {
  const [workforceRes] = await Promise.allSettled([
    getOrdersPerChef()
  ]);

  if (workforceRes.status === 'fulfilled') {
    renderWorkforce(workforceRes.value);
  } else {
    document.getElementById('kpi-workforce-card')?.classList.add('kpi-disabled');
  }

  waiterPage = 1;
  await loadWaiterRanking({ append: false });
}

function clearRefresh() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function bindPagination() {
  const btn = document.getElementById('kpi-waiter-more');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    if (isLoadingWaiters) return;
    waiterPage += 1;
    loadWaiterRanking({ append: true }).catch(() => {});
  });
}

export async function init() {
  clearRefresh();
  bindPagination();
  await loadAll();
  intervalId = setInterval(() => {
    loadAll().catch(() => {});
  }, 60000);

  window.__kpiCleanup = clearRefresh;
}
