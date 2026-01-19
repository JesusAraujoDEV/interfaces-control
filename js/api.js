// Configuración central para conexiones API
// Archivo: js/api.js

// Base URL para la API. Soporta estilos de config previos (KITCHEN_URL).
const API_BASE_URL = window.__APP_CONFIG__?.API_URL || window.__APP_CONFIG__?.KITCHEN_URL || 'http://localhost:3000';

// Exponer también para código existente que usa `KITCHEN_URL`
window.API_BASE_URL = API_BASE_URL;
window.KITCHEN_URL = API_BASE_URL;

// Función para obtener headers comunes
function getCommonHeaders() {
    const token = localStorage.getItem('jwt_token');
    const headers = {
        'Content-Type': 'application/json'
    };
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