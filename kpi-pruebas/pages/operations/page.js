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

function renderKitchenVelocity(data) {
  const avgMinutes = Number(data?.kitchen_velocity?.avg_minutes ?? data?.avg_minutes ?? 0);
  const sample = data?.kitchen_velocity?.sample_size ?? data?.sample_size ?? 0;

  const minEl = document.getElementById('kpi-velocity-min');
  const sampleEl = document.getElementById('kpi-velocity-sample');
  if (minEl) minEl.textContent = formatMinutes(avgMinutes);
  if (sampleEl) sampleEl.textContent = `Basado en ${formatNumber(sample)} platos`;

  const needle = document.getElementById('kpi-velocity-needle');
  if (needle) {
    const angle = avgMinutes < 10 ? 30 : avgMinutes < 20 ? 120 : 200;
    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }

  setDot(document.getElementById('kpi-kitchen-dot'), data?.sources || data?.source);
}

function renderDeliverySuccess(data) {
  const success = Number(data?.delivery_success_rate?.success ?? data?.success ?? 0);
  const total = Number(data?.delivery_success_rate?.total ?? data?.total ?? 0);
  const percent = total ? Math.round((success / total) * 100) : 0;

  const radial = document.getElementById('kpi-delivery-radial');
  if (radial) {
    const deg = clamp(percent * 3.6, 0, 360);
    radial.style.background = `conic-gradient(#22c55e 0deg ${deg}deg, #e2e8f0 ${deg}deg 360deg)`;
  }

  const percentEl = document.getElementById('kpi-delivery-percent');
  if (percentEl) percentEl.textContent = `${percent}%`;

  const textEl = document.getElementById('kpi-delivery-text');
  if (textEl) textEl.textContent = `${formatNumber(success)} entregados de ${formatNumber(total)}`;

  setDot(document.getElementById('kpi-delivery-dot'), data?.sources || data?.source);
}

function renderWorkforce(data) {
  const ratio = Number(data?.orders_per_chef?.ratio ?? data?.ratio ?? 0);
  const chefs = Number(data?.orders_per_chef?.active_chefs ?? data?.active_chefs ?? 0);
  const pending = Number(data?.orders_per_chef?.pending_orders ?? data?.pending_orders ?? 0);

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
  if (summary) summary.textContent = `${formatNumber(chefs)} chefs activos vs ${formatNumber(pending)} pedidos`;

  setDot(document.getElementById('kpi-workforce-dot'), data?.sources || data?.source);
}

async function loadAll() {
  const [velocityRes, successRes, workforceRes] = await Promise.allSettled([
    fetchKpiJson('api/kpi/v1/operations/kitchen-velocity'),
    fetchKpiJson('api/kpi/v1/operations/delivery-success-rate'),
    fetchKpiJson('api/kpi/v1/workforce/orders-per-chef')
  ]);

  if (velocityRes.status === 'fulfilled') {
    renderKitchenVelocity(velocityRes.value);
  } else {
    document.getElementById('kpi-velocity-card')?.classList.add('kpi-disabled');
  }

  if (successRes.status === 'fulfilled') {
    renderDeliverySuccess(successRes.value);
  } else {
    document.getElementById('kpi-delivery-card')?.classList.add('kpi-disabled');
  }

  if (workforceRes.status === 'fulfilled') {
    renderWorkforce(workforceRes.value);
  } else {
    document.getElementById('kpi-workforce-card')?.classList.add('kpi-disabled');
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
    loadAll().catch(() => { });
  }, 60000);

  window.__kpiCleanup = clearRefresh;
}
