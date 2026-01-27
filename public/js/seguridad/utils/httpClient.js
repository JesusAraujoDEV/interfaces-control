function httpSeguridadClient(url, options = {}) {
  const SEGURIDAD_CONFIG = window.__SEGURIDAD_API_CONFIG__;

  const access_token = localStorage.getItem("access_token");

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(access_token && { Authorization: `Bearer ${access_token}` }),
  };

  const userHeaders = options.headers || {};

  const finalHeaders = {
    ...defaultHeaders,
    ...userHeaders,
  };

  return fetch(`${SEGURIDAD_CONFIG.SEGURIDAD_URL_BACKEND}${url}`, {
    ...options,
    headers: finalHeaders,
  });
}

window.httpSeguridadClient = httpSeguridadClient;
