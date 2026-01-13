
window.TablesApi = {
    // Getter para la URL base de ATENCIÓN AL CLIENTE
    getBaseUrl: () => {
        const config = window.__APP_CONFIG__;
        // Aquí usamos ATC_URL (o DP_URL según tu .env)
        const baseUrl = config?.ATC_URL;
        return `${baseUrl.replace(/\/$/, '')}/api/v1/atencion-cliente`;
    },

    getTables: async (page = 1, limit = 10, status = '') => {

        const baseUrl = window.TablesApi.getBaseUrl();
        let query = `/tables?page=${page}&limit=${limit}`;
        
        if (status) query += `&status=${status}`;
        
        // Llamamos al cliente núcleo pasando la URL completa
        return window.HttpClient.request(`${baseUrl}${query}`, {
            method: 'GET'
        });
        
    },

    deleteTable: async (id) => {

        const baseUrl = window.TablesApi.getBaseUrl();
        return window.HttpClient.request(`${baseUrl}/tables/${id}`, { 
            method: 'DELETE' 
        });
        
    },

    createTable: async (data) => {
        
        const baseUrl = window.TablesApi.getBaseUrl();
        const response = window.HttpClient.request(`${baseUrl}/tables`, { 
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.error) {
            throw new Error(response.error);
        }

        return { success: true, data: response };
    },
    
    updateTable: async (id, data) => {
        
        const baseUrl = window.TablesApi.getBaseUrl();
        return window.HttpClient.request(`${baseUrl}/tables/${id}`, { 
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    verify_qr: async (qr_uuid) => {

        const baseUrl = window.TablesApi.getBaseUrl();
        return window.HttpClient.request(`${baseUrl}/tables/verify-qr`, { 
            method: 'POST',
            body: JSON.stringify({ qr_uuid: qr_uuid }) 
        });
    }
};