
window.AuthApi = {
    // Getter para la URL base de AUTENTICACIÓN
    getBaseUrl: () => {
        const config = window.__APP_CONFIG__;
        // Usamos AUTH_URL, no ATC_URL
        const baseUrl = config?.AUTH_URL; 

        if (!baseUrl) {
            console.error("⚠️ AUTH_URL no está configurada en __APP_CONFIG__");
        }

        return baseUrl.replace(/\/$/, '');
    },

    //Realiza el login y guarda el token.
    login: async (username, password) => {
        const baseUrl = window.AuthApi.getBaseUrl();
        const endpoint = '/api/seguridad/auth/login';
        const url = `${baseUrl}${endpoint}`;

        const body = JSON.stringify({ username, password });

        // Usamos el cliente núcleo
        const response = await window.HttpClient.request(url, {
            method: 'POST',
            body: body
        });

        // ASUMIENDO que tu backend devuelve { token: "..." } o { data: { token: "..." } }
        // Ajusta esta línea según la respuesta exacta de tu backend
        const token = response.token || response.data?.token;

        if (token) {
            localStorage.setItem('auth_token', token);
            console.log('✅ Login exitoso, token guardado.');
        } else {
            throw new Error('No se recibió token del servidor');
        }

        return response;
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        window.location.href = '/';
    },

    hasPermission: async (resource, method) => {
        const baseUrl = window.AuthApi.getBaseUrl();
        const url = `${baseUrl}/api/seguridad/auth/hasPermission`;

        try {
            const response = await window.HttpClient.request(url, {
                method: 'POST',
                body: JSON.stringify({
                    resource: resource, // Ej: "TableManagement_view"
                    method: method      // Ej: "View"
                })
            });

            // Asumimos que el backend responde: { "hasPermission": true/false }
            return response.hasPermission === true;
        } catch (error) {
            console.error("Error verificando permisos:", error);
            return false; // Ante la duda, denegar acceso.
        }
    },

    verify_location: async (latitude, longitude) => {

        const baseUrl = window.AuthApi.getBaseUrl();
        return window.HttpClient.request(`${baseUrl}/api/seguridad/auth/verify-location`, { 
            method: 'POST',
            body: JSON.stringify({ latitude, longitude })
        });
    }
};