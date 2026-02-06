const DATE_KEY = 'kpi_selected_date';
const listeners = new Set();

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDate() {
  return toInputDate(new Date());
}

export function getSelectedDate() {
  try {
    return localStorage.getItem(DATE_KEY) || getDefaultDate();
  } catch {
    return getDefaultDate();
  }
}

export function setSelectedDate(value) {
  const next = value || getDefaultDate();
  try {
    localStorage.setItem(DATE_KEY, next);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn(next));
}

export function onDateChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
