import { fetchKpiJson, fetchKpiRangeJson } from './kpi-api.js';

export async function getSatisfactionScore({ from, to, signal } = {}) {
  return fetchKpiRangeJson('/api/kpi/v1/cx/satisfaction-score', { from, to, signal });
}

export async function getWaiterRanking({ from, to, page = 1, pageSize = 5, signal } = {}) {
  return fetchKpiRangeJson('/api/kpi/v1/workforce/waiter-ranking', {
    from,
    to,
    params: { page, page_size: pageSize },
    signal
  });
}

export async function getOrdersPerChef({ date, signal } = {}) {
  return fetchKpiJson('/api/kpi/v1/workforce/orders-per-chef', { date, signal });
}

export async function getRevenueSeries({ from, to, groupBy = 'day', signal } = {}) {
  return fetchKpiRangeJson('/api/kpi/v1/financial/revenue-series', {
    from,
    to,
    params: { groupBy },
    signal
  });
}
