// Configuración central para conexiones API
// Archivo: js/api.js

// Base URL para la API. Soporta estilos de config previos (KITCHEN_URL).
// Para desarrollo local, usar el mismo host y puerto del servidor actual
const currentHost = window.location.hostname;
const currentPort = window.location.port;
const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '0.0.0.0';

// Usar siempre la configuración del backend real, independientemente del entorno
const API_BASE_URL = window.__APP_CONFIG__?.KITCHEN_URL || 'https://charlotte-cocina.onrender.com';

// Mantener el prefijo /api/kitchen para todas las llamadas
const API_PREFIX = '';

// Exponer también para código existente que usa `KITCHEN_URL`
window.API_BASE_URL = API_BASE_URL;
window.KITCHEN_URL = API_BASE_URL + API_PREFIX;

// Función para obtener headers comunes
function getCommonHeaders() {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json'
    };

    // Incluir Authorization si hay token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

// Función helper para formatear moneda
function formatCurrency(amount) {
    const n = Number(amount || 0);
    return `$ ${n.toFixed(2)}`;
}

// Función helper para formatear unidades
function formatUnits(quantity, unit) {
    return `${parseFloat(quantity).toFixed(2)} ${unit}`;
}

// Exportar para uso en otros archivos (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, getCommonHeaders, formatCurrency, formatUnits };
}