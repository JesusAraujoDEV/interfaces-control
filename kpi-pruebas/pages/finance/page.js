import { fetchKpiJson, extractAnySource, getCacheStatus } from '/kpi-pruebas/src/services/kpi-api.js';
import { getRevenueSeries } from '/kpi-pruebas/src/services/kpi-data.js';
import { getSelectedDate } from '/kpi-pruebas/src/services/kpi-state.js';
import { formatCurrency, clamp } from '/kpi-pruebas/src/utils/format.js';

let intervalId = null;
let chartAbort = null;
let viewMode = 'week';

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

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 6);
  return d;
}

function endOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0);
}

function formatLabel(label, mode) {
  const date = parseIsoDate(label);
  if (!date) return label;
  if (mode === 'year') {
    return date.toLocaleDateString('es-CO', { month: 'short' });
  }
  if (mode === 'month') {
    return String(date.getDate());
  }
  return date.toLocaleDateString('es-CO', { weekday: 'short' });
}

function formatTooltipDate(label) {
  const date = parseIsoDate(label);
  if (!date) return label;
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short' });
}

function setChartEmpty(isEmpty) {
  const empty = document.getElementById('kpi-revenue-empty');
  if (empty) empty.classList.toggle('show', isEmpty);
}

function updateTabUI(nextMode) {
  viewMode = nextMode;
  const tabs = document.querySelectorAll('.kpi-tab');
  tabs.forEach((tab) => {
    const active = tab.dataset.mode === nextMode;
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('[data-filter]').forEach((el) => {
    el.classList.toggle('hidden', el.dataset.filter !== nextMode);
  });

  const hint = document.getElementById('kpi-week-hint');
  if (hint) hint.classList.toggle('hidden', nextMode !== 'week');
}

function buildGrid(maxValue) {
  const grid = document.getElementById('kpi-revenue-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const steps = 4;
  for (let i = steps; i >= 0; i -= 1) {
    const value = Math.round((maxValue / steps) * i);
    const row = document.createElement('div');
    row.className = 'kpi-chart-grid-line';
    row.innerHTML = `<span>${formatCurrency(value)}</span>`;
    grid.appendChild(row);
  }
}

function renderSeriesChart(series, mode) {
  const bars = document.getElementById('kpi-revenue-bars');
  const xAxis = document.getElementById('kpi-revenue-x');
  if (!bars || !xAxis) return;

  bars.innerHTML = '';
  xAxis.innerHTML = '';

  if (!Array.isArray(series) || series.length === 0) {
    setChartEmpty(true);
    return;
  }

  const totals = series.map(item => Number(item.total ?? (Number(item.delivery || 0) + Number(item.dine_in || 0))));
  const maxTotal = Math.max(...totals, 0);
  if (maxTotal === 0) {
    setChartEmpty(true);
    return;
  }
  buildGrid(maxTotal);

  bars.style.gridTemplateColumns = `repeat(${series.length}, minmax(0, 1fr))`;
  xAxis.style.gridTemplateColumns = `repeat(${series.length}, minmax(0, 1fr))`;

  series.forEach((item, index) => {
    const delivery = Number(item.delivery || 0);
    const dine = Number(item.dine_in || 0);
    const total = Number(item.total ?? (delivery + dine));
    const heightPct = maxTotal ? clamp((total / maxTotal) * 100, 0, 100) : 0;

    const stack = document.createElement('div');
    stack.className = 'kpi-chart-stack';
    stack.style.height = `${heightPct}%`;
    stack.innerHTML = `
      <div class="kpi-chart-delivery" style="height:${total ? clamp((delivery / total) * 100, 0, 100) : 0}%"></div>
      <div class="kpi-chart-dine" style="height:${total ? clamp((dine / total) * 100, 0, 100) : 0}%"></div>
    `;

    const bar = document.createElement('div');
    bar.className = 'kpi-chart-bar';
    bar.dataset.label = item.label;
    bar.dataset.delivery = String(delivery);
    bar.dataset.dine = String(dine);
    bar.dataset.total = String(total);
    bar.appendChild(stack);
    bars.appendChild(bar);

    const label = document.createElement('div');
    label.textContent = formatLabel(item.label, mode);
    xAxis.appendChild(label);

    if (index === series.length - 1) {
      label.classList.add('font-semibold');
    }
  });

  setChartEmpty(false);
}

function bindChartTooltip() {
  const chart = document.getElementById('kpi-revenue-chart');
  const tooltip = document.getElementById('kpi-revenue-tooltip');
  if (!chart || !tooltip || chart.dataset.tooltipBound === '1') return;
  chart.dataset.tooltipBound = '1';

  chart.addEventListener('mousemove', (event) => {
    const target = event.target.closest('.kpi-chart-bar');
    if (!target) {
      tooltip.classList.remove('visible');
      return;
    }

    const rect = chart.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const label = target.dataset.label;
    const delivery = Number(target.dataset.delivery || 0);
    const dine = Number(target.dataset.dine || 0);
    const total = Number(target.dataset.total || 0);

    tooltip.innerHTML = `
      <strong>${formatTooltipDate(label)}</strong>
      <div>Total: ${formatCurrency(total)}</div>
      <div>🔵 Delivery: ${formatCurrency(delivery)}</div>
      <div>🔴 Sala: ${formatCurrency(dine)}</div>
    `;

    tooltip.style.left = `${Math.min(x + 12, rect.width - 180)}px`;
    tooltip.style.top = `${Math.max(y - 60, 12)}px`;
    tooltip.classList.add('visible');
  });

  chart.addEventListener('mouseleave', () => {
    tooltip.classList.remove('visible');
  });
}

function readWeekPicker() {
  const input = document.getElementById('kpi-week-picker');
  const value = input?.value || getSelectedDate();
  const date = parseIsoDate(value) || new Date();
  const monday = startOfWeek(date);
  if (input) input.value = toDateInput(monday);
  return monday;
}

function readMonthPicker() {
  const input = document.getElementById('kpi-month-picker');
  const fallback = parseIsoDate(getSelectedDate()) || new Date();
  const [year, month] = (input?.value || `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}`).split('-');
  return { year: Number(year), monthIndex: Number(month) - 1 };
}

function readYearPicker() {
  const input = document.getElementById('kpi-year-picker');
  const fallback = parseIsoDate(getSelectedDate()) || new Date();
  const year = Number(input?.value || fallback.getFullYear());
  if (input) input.value = String(year);
  return year;
}

async function loadRevenueSeries() {
  if (chartAbort) chartAbort.abort();
  chartAbort = new AbortController();

  let from = '';
  let to = '';
  let groupBy = 'day';

  if (viewMode === 'week') {
    const monday = readWeekPicker();
    const sunday = endOfWeek(monday);
    from = toDateInput(monday);
    to = toDateInput(sunday);
    groupBy = 'day';
  } else if (viewMode === 'month') {
    const { year, monthIndex } = readMonthPicker();
    const start = new Date(year, monthIndex, 1);
    const end = endOfMonth(year, monthIndex);
    from = toDateInput(start);
    to = toDateInput(end);
    groupBy = 'day';
  } else {
    const year = readYearPicker();
    from = `${year}-01-01`;
    to = `${year}-12-31`;
    groupBy = 'month';
  }

  try {
    const data = await getRevenueSeries({ from, to, groupBy, signal: chartAbort.signal });
    renderSeriesChart(data?.series || [], viewMode);
  } catch {
    renderSeriesChart([], viewMode);
  }
}

function bindRevenueControls() {
  const tabs = document.querySelectorAll('.kpi-tab');
  tabs.forEach((tab) => {
    if (tab.dataset.bound === '1') return;
    tab.dataset.bound = '1';
    tab.addEventListener('click', () => {
      updateTabUI(tab.dataset.mode);
      loadRevenueSeries().catch(() => {});
    });
  });

  const weekInput = document.getElementById('kpi-week-picker');
  if (weekInput && weekInput.dataset.bound !== '1') {
    weekInput.dataset.bound = '1';
    weekInput.addEventListener('change', () => {
      const date = parseIsoDate(weekInput.value);
      const monday = date ? startOfWeek(date) : startOfWeek(new Date());
      weekInput.value = toDateInput(monday);
      loadRevenueSeries().catch(() => {});
    });
  }

  const monthInput = document.getElementById('kpi-month-picker');
  if (monthInput && monthInput.dataset.bound !== '1') {
    monthInput.dataset.bound = '1';
    monthInput.addEventListener('change', () => {
      loadRevenueSeries().catch(() => {});
    });
  }

  const yearInput = document.getElementById('kpi-year-picker');
  if (yearInput && yearInput.dataset.bound !== '1') {
    yearInput.dataset.bound = '1';
    yearInput.addEventListener('change', () => {
      loadRevenueSeries().catch(() => {});
    });
  }
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

function renderEfficiency(totalRevenue, lostTotal, source) {
  const denominator = Number(totalRevenue || 0) + Number(lostTotal || 0);
  const percent = denominator ? Math.round((Number(totalRevenue || 0) / denominator) * 100) : 0;

  const radial = document.getElementById('kpi-efficiency-radial');
  if (radial) {
    const deg = clamp(percent * 3.6, 0, 360);
    let color = '#22c55e';
    if (percent < 95) color = '#ef4444';
    else if (percent < 98) color = '#f59e0b';
    radial.style.background = `conic-gradient(${color} 0deg ${deg}deg, #e2e8f0 ${deg}deg 360deg)`;
  }

  const percentEl = document.getElementById('kpi-efficiency-percent');
  if (percentEl) percentEl.textContent = `${percent}%`;

  const labelEl = document.getElementById('kpi-efficiency-label');
  if (labelEl) {
    labelEl.textContent = `Has capturado el ${percent}% del potencial`;
    labelEl.classList.remove('kpi-efficiency-good', 'kpi-efficiency-warn', 'kpi-efficiency-bad');
    if (percent < 95) labelEl.classList.add('kpi-efficiency-bad');
    else if (percent < 98) labelEl.classList.add('kpi-efficiency-warn');
    else labelEl.classList.add('kpi-efficiency-good');
  }

  setDot(document.getElementById('kpi-efficiency-dot'), source);
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
  const [revenueRes, lostRes] = await Promise.allSettled([
    fetchKpiJson('/api/kpi/v1/financial/daily-revenue'),
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

  if (lostRes.status === 'fulfilled') {
    lostTotal = renderLostRevenue(lostRes.value);
  } else {
    document.getElementById('kpi-lost-card')?.classList.add('kpi-disabled');
    document.getElementById('kpi-lost-total')?.classList.add('text-slate-400');
  }

  const totalRevenue = Number(delivery || 0) + Number(dineIn || 0);
  const efficiencySource = lostRes.status === 'fulfilled' ? lostRes.value?.sources : revenueRes.status === 'fulfilled' ? revenueRes.value?.sources : null;
  renderEfficiency(totalRevenue, lostTotal, efficiencySource);

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
  updateTabUI(viewMode);
  bindRevenueControls();
  bindChartTooltip();
  loadRevenueSeries().catch(() => {});
  intervalId = setInterval(() => {
    loadAll().catch(() => { });
  }, 60000);

  window.__kpiCleanup = clearRefresh;
}
