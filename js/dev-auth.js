// Sistema de Auto-Login para Desarrollo
// Se ejecuta inmediatamente al cargar este script.

(async function initDevAuth() {
    
    // Configuración
    const TOKEN_KEY = 'jwt_token'; 
    const AUTH_BASE = window.__APP_CONFIG__?.AUTH_URL || '';
    const LOGIN_ENDPOINT = `${AUTH_BASE}/api/seguridad/auth/login`.replace(/([^:]\/)\/+/g, "$1"); 
    
    const DEV_CREDENTIALS = {
        email: 'admin@charlotte.com',
        password: 'admin'
    };

    // 1. Verificar Token
    const existingToken = localStorage.getItem(TOKEN_KEY);

    if (!existingToken) {
        try {
            const response = await fetch(LOGIN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(DEV_CREDENTIALS)
            });

            if (!response.ok) {
                throw new Error(`Error en login: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const token = data.token;

            // ⚠️ Ajusta según la estructura real que devuelva tu backend
            const staffId = data.staff?.id || data.staff_id;

            if (token) {
                localStorage.setItem(TOKEN_KEY, token);

                if (staffId) {
                    localStorage.setItem('staff_id', staffId);
                    console.log('✅ [DevAuth] Staff ID guardado en localStorage:', staffId);
                } else {
                    console.warn('⚠️ [DevAuth] No se recibió staff_id en la respuesta de login');
                }

                // Opcional: Recargar si la app necesita el token desde el inicio estricto
                window.location.reload(); 
            } else {
                console.error('❌ [DevAuth] La respuesta del login no contenía un token reconocible:', data);
            }
        } catch (error) {
            console.error('❌ [DevAuth] Falló el auto-login. Asegúrate de que el backend esté corriendo y las credenciales sean válidas.', error);
        }
    } else {
        console.log('🔑 [DevAuth] Token ya existente en localStorage');
    }
})();

// Función global apiFetch para realizar peticiones autenticadas
window.apiFetch = async function(url, options = {}) {
    const TOKEN_KEY = 'jwt_token';
    const token = localStorage.getItem(TOKEN_KEY);

    // Preparar headers por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Inyectar Token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Ejecutar fetch
    const response = await fetch(url, {
        ...options,
        headers
    });

    // Manejo básico de expiración
    if (response.status === 401) {
        console.warn('⚠️ [apiFetch] Recibido 401 Unauthorized. Eliminando token expirado...');
        localStorage.removeItem(TOKEN_KEY);
        // Podrías intentar reloguear aquí recursivamente en una versión v2
    }

    return response.json(); // devolvemos JSON directamente
};
