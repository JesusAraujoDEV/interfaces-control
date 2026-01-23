function safeGetStorageItem(storage, key) {
  try {
    if (!storage) return null;
    const value = storage.getItem(key);
    return value ? String(value) : null;
  } catch {
    return null;
  }
}

function readCookie(name) {
  try {
    const cookies = String(document.cookie || '');
    const parts = cookies.split(';');
    for (const part of parts) {
      const [rawKey, ...rest] = part.trim().split('=');
      if (!rawKey) continue;
      if (rawKey === name) return decodeURIComponent(rest.join('=') || '');
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeToken(raw) {
  const token = String(raw || '').trim();
  if (!token) return null;
  if (token.toLowerCase().startsWith('bearer ')) return token.slice(7).trim() || null;
  return token;
}

export function getJwtToken() {
  // Most common key in this repo (see seguridad/login.js)
  const candidates = ['access_token', 'jwt', 'token', 'id_token'];

  for (const key of candidates) {
    const v1 = safeGetStorageItem(localStorage, key);
    const t1 = normalizeToken(v1);
    if (t1) return t1;

    const v2 = safeGetStorageItem(sessionStorage, key);
    const t2 = normalizeToken(v2);
    if (t2) return t2;

    const v3 = readCookie(key);
    const t3 = normalizeToken(v3);
    if (t3) return t3;
  }

  return null;
}

function headersToObject(headers) {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const out = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }

  if (Array.isArray(headers)) {
    const out = {};
    for (const entry of headers) {
      if (!entry) continue;
      const [k, v] = entry;
      if (k) out[String(k)] = String(v);
    }
    return out;
  }

  return { ...headers };
}

export function mergeHeaders(...headersInits) {
  const out = {};
  for (const h of headersInits) {
    Object.assign(out, headersToObject(h));
  }
  return out;
}

export function withBearerToken(headersInit) {
  const headers = headersToObject(headersInit);

  // Respect explicit Authorization header (any casing)
  const hasAuth = Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
  if (hasAuth) return headers;

  const token = getJwtToken();
  if (!token) return headers;

  headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
