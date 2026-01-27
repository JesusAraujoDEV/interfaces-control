// /mod-3-atencion-cliente/api/client.js

window.ClientApi = {

    // Getter para la URL base de ATENCIÓN AL CLIENTE
    getBaseUrl: () => {
        const config = window.__APP_CONFIG__;
        // Aquí usamos ATC_URL (o DP_URL según tu .env)
        const baseUrl = config?.ATC_URL;
        if (!baseUrl) {
            console.error("⚠️ ATC_URL no está configurada en __APP_CONFIG__");
        }
        return `${baseUrl.replace(/\/$/, '')}/api/v1/atencion-cliente`;
    },

    login: async (data) => {
        // En lugar de ir a Render, vamos a tu endpoint local
        // Asumiendo que server.js monta en: /api/atencion-cliente
        const url = '/api/atencion-cliente/login'; 

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
            throw new Error(errorData.message || 'Error al registrar cliente');
        }

        return await response.json();
    },

    getActiveClients: async () => {
        const baseUrl = window.ClientApi.getBaseUrl();
        // Usamos HttpClient que ya maneja los Headers/Auth automáticamente
        const response = window.HttpClient.request(`${baseUrl}/clients/active`, {
            method: 'GET'
        });

        if(response.error) {
            throw new Error(response.error);
        }

        return response;
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

    sendServiceRequest: async (type, message) => {
        const baseUrl = window.ClientApi.getBaseUrl();
        const url = `${baseUrl}/service-requests`;

        const response = await window.HttpClient.request(url, {
            method: 'POST',
            body: JSON.stringify({ 
                type: type,      // "COMPLAINT" || "CALL_WAITER"
                message: message // "La comida está fría"
            })
        });

        if (response.error) {
            throw new Error(response.error);
        }

        return response;
    },

    // 5. OBTENER DETALLE DE SOLICITUD (GET /service-requests/{id})
    getServiceRequest: async (id) => {
        const baseUrl = window.ClientApi.getBaseUrl();
        const url = `${baseUrl}/service-requests/${id}`;

        const response = await window.HttpClient.request(url, {
            method: 'GET'
        });

        if (response.error) throw new Error(response.error);
        return response;
    },

    // 6. CANCELAR SOLICITUD (PATCH /service-requests/{id})
    cancelServiceRequest: async (id) => {
        const baseUrl = window.ClientApi.getBaseUrl();
        const url = `${baseUrl}/service-requests/${id}`;

        const response = await window.HttpClient.request(url, {
            method: 'PATCH',
            body: JSON.stringify({ status: "CANCELLED" })
        });

        if (response.error) throw new Error(response.error);
        return response;
    },

};
