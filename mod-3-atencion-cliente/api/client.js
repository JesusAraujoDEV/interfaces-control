// /mod-3-atencion-cliente/api/client.js

window.ClientApi = {

    // Getter para la URL base de ATENCIÓN AL CLIENTE
    getBaseUrl: () => {
        const config = window.__APP_CONFIG__;
        // Aquí usamos ATC_URL (o DP_URL según tu .env)
        const baseUrl = config?.ATC_URL;
        return `${baseUrl.replace(/\/$/, '')}/api/v1/atencion-cliente`;
    },

    login: async (data) => {
        // Asegúrate de tener tu CONFIG.API_BASE_URL definido en config.js
        const url = `${window.ClientApi.getBaseUrl()}/clients`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || 'Error al registrar cliente');
        }

        return await response.json();
    },
        /**
     * TAREA VISTA 4: Enviar Orden
     * Consumir POST /comandas
     */
    createOrder: async (orderPayload) => {
        // Obtenemos el Token de sesión (asumiendo que se guardó al escanear QR o loguearse)
        const token = localStorage.getItem('guest_token'); 
        
        // Endpoint: /comandas (Concatenado a tu base URL)
        const url = `${window.ClientApi.getBaseUrl()}/comandas`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Importante para la seguridad híbrida
            },
            body: JSON.stringify(orderPayload) // Aquí va el JSON transformado
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al enviar la orden');
        }

        return await response.json();
    }

};

