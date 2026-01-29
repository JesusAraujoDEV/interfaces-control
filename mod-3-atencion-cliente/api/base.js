
// Helpers para segregar token entre Admin y Cliente (ATC)
function __isGuestView() {
    const p = window.location.pathname;
    // Vistas de cliente (ATC): login/scan, pedidos (menu, cart, support), payment
    return (
        p.includes('/mod-3-atencion-cliente/pages/login/') ||
        p.includes('/mod-3-atencion-cliente/pages/pedidos/') ||
        p.includes('/mod-3-atencion-cliente/pages/payment/')
    );
}

function __getAuthTokenKey() {
    return __isGuestView() ? 'access_token_atc' : 'access_token';
}

window.HttpClient = {
   
    async request(fullUrl, options = {}) {
        console.log(`📡 Fetching: ${fullUrl}`);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // 🔐 AUTOMÁTICO: Si tenemos token guardado, lo inyectamos
        const tokenKey = __getAuthTokenKey();
        const token = localStorage.getItem(tokenKey);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(fullUrl, { ...options, headers });

            // Validación de JSON vs HTML (Error común en proxys/404)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                // Si el token expiró o es inválido, a veces el backend redirige al login HTML
                if (response.status === 401 || response.status === 403) {
                     localStorage.removeItem(tokenKey);
                     window.location.href = '/'; // Redirigir al login
                }
                throw new Error("Respuesta no válida del servidor (HTML recibido).");
            }

            if (!response.ok) {
                const errorBody = await response.json();
                
                // Manejo de token expirado
                if (response.status === 401) {
                    console.warn("Sesión expirada");
                    localStorage.removeItem(tokenKey);
                    // Opcional: window.location.href = '/';
                }

                return { 
                    success: false, // Flag explícito ayuda mucho
                    error: errorBody.error || 'Error en la solicitud', // Título principal
                    message: errorBody.message, // Detalle (ej: "Hay clientes sentados")
                    validationErrors: errorBody.errors, // Detalle Zod (ej: "Mínimo 2")
                    status: response.status
                };
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }
};