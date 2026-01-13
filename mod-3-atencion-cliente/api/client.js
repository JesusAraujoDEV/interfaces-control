
window.HttpClient = {
   
    async request(fullUrl, options = {}) {
        console.log(`📡 Fetching: ${fullUrl}`);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // 🔐 AUTOMÁTICO: Si tenemos token guardado, lo inyectamos
        const token = localStorage.getItem('auth_token');
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
                     localStorage.removeItem('auth_token');
                     window.location.href = '/'; // Redirigir al login
                }
                throw new Error("Respuesta no válida del servidor (HTML recibido).");
            }

            if (!response.ok) {
                const errorBody = await response.json();
                
                // Manejo de token expirado
                if (response.status === 401) {
                    console.warn("Sesión expirada");
                    localStorage.removeItem('auth_token');
                    // Opcional: window.location.href = '/';
                }

                throw new Error(errorBody.message || `Error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }
};