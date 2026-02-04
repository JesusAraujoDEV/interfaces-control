
// Exponer utilidades de Autenticación/Seguridad en window.AuthApi
(function(){
  window.AuthApi = window.AuthApi || {};

  // Getter para la URL base de AUTENTICACIÓN (AUTH_URL)
  window.AuthApi.getBaseUrl = function() {
    const config = window.__APP_CONFIG__;
    const baseUrl = config?.AUTH_URL || '';
    if (!baseUrl) {
      console.error('⚠️ AUTH_URL no está configurada en __APP_CONFIG__');
    }
    return baseUrl.replace(/\/$/, '');
  };

  // Obtener nombres de usuarios por IDs desde Seguridad
  // Devuelve un mapa { [id: string]: nombre }
  window.AuthApi.fetchWaiterNamesByIds = async function(ids = []) {
    const base = window.AuthApi.getBaseUrl();
    if (!base || !Array.isArray(ids) || ids.length === 0) return {};
    const entries = await Promise.all(ids.map(async (id) => {
      try {
        const resp = await window.HttpClient.request(`${base}/api/seguridad/users/${id}`);
        const user = resp?.data || resp;
        const nameLast = [user?.name, user?.lastName].filter(Boolean).join(' ').trim();
        const label = nameLast || user?.email || `Usuario ${id}`;
        return [String(id), label];
      } catch (_) {
        return [String(id), `Usuario ${id}`];
      }
    }));
    return Object.fromEntries(entries);
  };
})();