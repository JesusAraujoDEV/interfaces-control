import { fetchKpiJson } from './kpi-api.js';

let cachedWarnings = [];
let lastFetchAt = 0;
const TTL_MS = 60 * 1000;

export async function getSystemWarnings({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedWarnings.length && now - lastFetchAt < TTL_MS) {
    return cachedWarnings;
  }

  try {
    const data = await fetchKpiJson('/api/kpi/v1/dashboard/overview');
    cachedWarnings = Array.isArray(data?.warnings) ? data.warnings : [];
    lastFetchAt = Date.now();
    return cachedWarnings;
  } catch {
    return cachedWarnings;
  }
}
