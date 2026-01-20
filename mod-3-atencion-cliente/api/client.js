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

    updateClient: async (clientId, data) => {
        const url = `${window.ClientApi.getBaseUrl()}/clients/${clientId}`;
        const response = window.HttpClient.request(url, { 
            method: 'PATCH',
            body: JSON.stringify(data)
        });

        if(response.error) {
            throw new Error(response.error);
        }

        return response;
    },

        /**
     * TAREA VISTA 4: Enviar Orden
     * Consumir POST /comandas
     */
    createOrder: async (orderPayload) => { 
        
        const baseUrl = window.ClientApi.getBaseUrl();
        const url = `${baseUrl}/comandas`;

        const response = window.HttpClient.request(url, { 
            method: 'POST',
            body: JSON.stringify(orderPayload)
        });

        if(response.error) {
            throw new Error(response.error);
        }

        return response;
    },

    // 3. CANCELAR ORDEN (PUT /comandas/{id}) - NUEVO
    cancelOrder: async (comandaId) => {
        const baseUrl = window.ClientApi.getBaseUrl();
        const url = `${baseUrl}/comandas/${comandaId}`;

        const response = await window.HttpClient.request(url, {
            method: 'PATCH',
            body: JSON.stringify({ status: "CANCELLED" })
        });

        if(response.error) {
            throw new Error(response.error);
        }
        return response;
    },

    // 4. OBTENER ESTADO DE ORDEN (GET /comandas/{id}) - NUEVO
    // Sirve para el polling (actualizar si pasó a 'COOKING' o 'DELIVERED')
    getOrder: async (comandaId) => {
        const baseUrl = window.ClientApi.getBaseUrl();
        const url = `${baseUrl}/comandas/${comandaId}`;

        const response = await window.HttpClient.request(url, {
            method: 'GET'
        });

        if(response.error) {
            throw new Error(response.error);
        }
        return response;
    },

};

