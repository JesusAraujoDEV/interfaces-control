import { fetchKpiJson, extractAnySource, getCacheStatus } from '/kpi-pruebas/src/services/kpi-api.js';
import { formatCurrency, clamp } from '/kpi-pruebas/src/utils/format.js';

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

function setDonut(delivery, dineIn) {
  const total = Number(delivery || 0) + Number(dineIn || 0);
  const pct = total ? Math.round((Number(delivery || 0) / total) * 360) : 0;
  const donut = document.getElementById('kpi-revenue-donut');
  if (donut) {
    donut.style.background = `conic-gradient(#13532a 0deg ${pct}deg, #e2e8f0 ${pct}deg 360deg)`;
  }
  const totalEl = document.getElementById('kpi-revenue-total');
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

function updateInsights(delivery, dineIn, lostTotal) {
  const list = document.getElementById('kpi-finance-insights');
  if (!list) return;

  const total = Number(delivery || 0) + Number(dineIn || 0);
  const topChannel = delivery >= dineIn ? 'Delivery' : 'Dine-in';
  const ratio = total ? Math.round((Math.max(delivery, dineIn) / total) * 100) : 0;

  list.innerHTML = '';
  const items = [
    `Canal dominante: ${topChannel} (${ratio}%).`,
    `Ingresos estimados del día: ${formatCurrency(total)}.`,
    lostTotal > 0 ? `Hay ${formatCurrency(lostTotal)} en riesgo por pérdidas.` : 'Sin pérdidas relevantes registradas.'
  ];

  items.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    list.appendChild(li);
  });
}

function renderRevenue(data) {
  const delivery = data?.daily_revenue?.delivery ?? data?.delivery ?? 0;
  const dineIn = data?.daily_revenue?.dine_in ?? data?.dine_in ?? 0;

  const deliveryEl = document.getElementById('kpi-revenue-delivery');
  const dineEl = document.getElementById('kpi-revenue-dine');
  if (deliveryEl) deliveryEl.textContent = formatCurrency(delivery);
  if (dineEl) dineEl.textContent = formatCurrency(dineIn);

  setDonut(delivery, dineIn);
  setDot(document.getElementById('kpi-revenue-dot'), data?.sources || data?.source);

  return { delivery, dineIn };
}

function renderAov(data) {
  const value = data?.average_ticket ?? data?.aov ?? data?.value ?? 0;
  const aovEl = document.getElementById('kpi-aov');
  if (aovEl) aovEl.textContent = formatCurrency(value);
  setDot(document.getElementById('kpi-aov-dot'), data?.sources || data?.source);
  return value;
}

function renderLostRevenue(data) {
  const total = data?.lost_revenue?.total_estimated ?? data?.total_estimated ?? data?.total ?? 0;
  const delivery = data?.lost_revenue?.delivery_cancelled ?? data?.delivery_cancelled ?? 0;
  const kitchen = data?.lost_revenue?.kitchen_rejections ?? data?.kitchen_rejections ?? 0;

  const totalEl = document.getElementById('kpi-lost-total');
  if (totalEl) totalEl.textContent = formatCurrency(total);

  const deliveryBar = document.getElementById('kpi-lost-delivery-bar');
  const kitchenBar = document.getElementById('kpi-lost-kitchen-bar');
  const totalLost = Number(delivery || 0) + Number(kitchen || 0) || 1;

  if (deliveryBar) deliveryBar.style.width = `${clamp((Number(delivery || 0) / totalLost) * 100, 0, 100)}%`;
  if (kitchenBar) kitchenBar.style.width = `${clamp((Number(kitchen || 0) / totalLost) * 100, 0, 100)}%`;

  const deliveryValue = document.getElementById('kpi-lost-delivery-value');
  const kitchenValue = document.getElementById('kpi-lost-kitchen-value');
  if (deliveryValue) deliveryValue.textContent = formatCurrency(delivery);
  if (kitchenValue) kitchenValue.textContent = formatCurrency(kitchen);

  setDot(document.getElementById('kpi-lost-dot'), data?.sources || data?.source);

  return total;
}

async function loadAll() {
  const [revenueRes, aovRes, lostRes] = await Promise.allSettled([
    fetchKpiJson('/api/kpi/v1/financial/daily-revenue'),
    fetchKpiJson('/api/kpi/v1/financial/aov'),
    fetchKpiJson('/api/kpi/v1/financial/lost-revenue')
  ]);

  let delivery = 0;
  let dineIn = 0;
  let lostTotal = 0;

  if (revenueRes.status === 'fulfilled') {
    const output = renderRevenue(revenueRes.value);
    delivery = output.delivery;
    dineIn = output.dineIn;
  } else {
    document.getElementById('kpi-revenue-card')?.classList.add('kpi-disabled');
    document.getElementById('kpi-revenue-dot')?.classList.add('kpi-dot--warn');
  }

  if (aovRes.status === 'fulfilled') {
    renderAov(aovRes.value);
  } else {
    document.getElementById('kpi-aov-card')?.classList.add('kpi-disabled');
    document.getElementById('kpi-aov')?.classList.add('text-slate-400');
  }

  if (lostRes.status === 'fulfilled') {
    lostTotal = renderLostRevenue(lostRes.value);
  } else {
    document.getElementById('kpi-lost-card')?.classList.add('kpi-disabled');
    document.getElementById('kpi-lost-total')?.classList.add('text-slate-400');
  }

  updateInsights(delivery, dineIn, lostTotal);
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
