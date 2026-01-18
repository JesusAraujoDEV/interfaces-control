// Configuración central para conexiones API
// Archivo: js/api.js

// Base URL para la API
const API_BASE_URL = window.__APP_CONFIG__?.API_URL || 'http://localhost:3000/api';

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
    return `$ ${parseFloat(amount).toFixed(2)}`;
}

// Función helper para formatear unidades
function formatUnits(quantity, unit) {
    return `${parseFloat(quantity).toFixed(2)} ${unit}`;
}

// Exportar para uso en otros archivos (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, getCommonHeaders, formatCurrency, formatUnits };
}