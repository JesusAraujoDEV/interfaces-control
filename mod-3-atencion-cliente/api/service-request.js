window.ServiceRequestApi = {

    // Getter para la URL base de ATENCIÓN AL CLIENTE
    getBaseUrl: () => {
        const config = window.__APP_CONFIG__;
        // Aquí usamos ATC_URL (o DP_URL según tu .env)
        const baseUrl = config?.ATC_URL;
        return `${baseUrl.replace(/\/$/, '')}/api/v1/atencion-cliente`;
    },

    // Obtener lista de solicitudes (con filtros)
    getRequests: async (page = 1, limit = 10, status = 'PENDING') => {
        // Construimos la URL con query params
        const query = new URLSearchParams({
            page: page,
            limit: limit,
            status: status, // 'PENDING' o 'ATTENDED'
            sort: 'desc'    // Asumimos que queremos lo más nuevo primero
        }).toString();

        const url = `${window.ServiceRequestApi.getBaseUrl()}/service-requests?${query}`;
        return await window.HttpClient.request(url);
    },

    // Marcar como atendido (PATCH)
    markAsAttended: async (requestId) => {
        const url = `${window.ServiceRequestApi.getBaseUrl()}/service-requests/${requestId}`;
        const response = await window.HttpClient.request(url, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ATTENDED' })
        });
        if(response.error) throw new Error(response.error);
        return response;
    }
};