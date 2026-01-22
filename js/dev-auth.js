// Archivo: js/dev-auth.js
// Autenticación básica para desarrollo

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('auth_token');
    return !!token;
}

// Función para obtener el token actual
function getToken() {
    return localStorage.getItem('jwt_token') || localStorage.getItem('auth_token');
}

// Función para verificar autenticación y redirigir si es necesario
function requireAuth() {
    if (!isAuthenticated()) {
        // Redirigir al login
        window.location.href = '../../mod-4-seguridad/Inicio sesión/Inicio-sesion.html';
        return false;
    }
    return true;
}

// Función para hacer logout
function logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('auth_token');
    window.location.href = '../../mod-4-seguridad/Inicio sesión/Inicio-sesion.html';
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Solo verificar autenticación si no estamos en páginas públicas
    const publicPages = ['Inicio-sesion.html', 'login.html'];
    const currentPage = window.location.pathname.split('/').pop();

    // Siempre requerir autenticación para páginas que no sean públicas
    if (!publicPages.includes(currentPage)) {
        requireAuth();
    }
});