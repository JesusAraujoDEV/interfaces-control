import { getSelectedDate } from './kpi-state.js';

const BASE_URL = (window.__APP_CONFIG__?.KPI_URL || '').replace(/\/$/, '');

function buildUrl(path, params = {}) {
  const url = new URL((BASE_URL || '') + path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url;
}

export async function fetchKpiJson(path, { date, params, signal } = {}) {
  const resolvedDate = date || getSelectedDate();
  const url = buildUrl(path, { ...(params || {}), date: resolvedDate });

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    signal
  });

  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(`KPI ${res.status}: ${message || res.statusText}`);
  }
  return res.json();
}

export async function fetchKpiRangeJson(path, { from, to, params, signal } = {}) {
  const selectedDate = getSelectedDate();
  const resolvedFrom = from || selectedDate;
  const resolvedTo = to || selectedDate;

  const url = buildUrl(path, { ...(params || {}), from: resolvedFrom, to: resolvedTo });

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    signal
  });

  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(`KPI ${res.status}: ${message || res.statusText}`);
  }
  return res.json();
}

export function getCacheStatus(source) {
  if (!source) return null;
  if (typeof source === 'string') return source.toUpperCase();
  if (typeof source === 'boolean') return source ? 'HIT' : 'MISS';

  const direct = source.cache || source.cache_status || source.cacheStatus || source.cache_state || source.status;
  if (typeof direct === 'string') return direct.toUpperCase();
  if (typeof direct === 'boolean') return direct ? 'HIT' : 'MISS';

  if (typeof source.hit === 'boolean') return source.hit ? 'HIT' : 'MISS';
  return null;
}

export function getUpdatedAt(source) {
  if (!source || typeof source !== 'object') return null;
  return source.updated_at || source.updatedAt || source.generated_at || source.generatedAt || source.timestamp || null;
}

export function extractAnySource(sources) {
  if (!sources) return null;
  if (typeof sources === 'string' || typeof sources === 'boolean') return sources;
  if (sources.cache || sources.cache_status || sources.cacheStatus || sources.status) return sources;

  if (typeof sources === 'object') {
    const values = Object.values(sources);
    for (const value of values) {
      if (!value) continue;
      if (typeof value === 'string' || typeof value === 'boolean') return value;
      if (value.cache || value.cache_status || value.cacheStatus || value.status || value.updated_at || value.timestamp) return value;
    }
  }
  return null;
}
