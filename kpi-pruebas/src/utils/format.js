export function formatCurrency(value) {
  const number = Number(value || 0);
  return number.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

export function formatNumber(value) {
  const number = Number(value || 0);
  return number.toLocaleString('es-CO');
}

export function formatMinutes(value) {
  const number = Number(value || 0);
  return `${number.toFixed(1)} min`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
