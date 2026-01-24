window.TablesApi = {
    // Getter para la URL base de ATENCIÓN AL CLIENTE
    getBaseUrl: () => {
        const config = window.__APP_CONFIG__;
        const baseUrl = config?.ATC_URL;
        if (!baseUrl) {
            console.error("⚠️ ATC_URL no está configurada en __APP_CONFIG__");
        }
        return `${baseUrl.replace(/\/$/, '')}/api/v1/atencion-cliente`;
    },

    // MODIFICADO: Agregamos el parámetro 'archived' (default false)
    getTables: async (page = 1, limit = 10, status = '', archived = false) => {
        const baseUrl = window.TablesApi.getBaseUrl();
        // Construimos la query string
        let query = `/tables?page=${page}&limit=${limit}&archived=${archived}`;
        
        if (status) query += `&status=${status}`;
        
        return window.HttpClient.request(`${baseUrl}${query}`, {
            method: 'GET'
        });
    },

    getById: async (id) => {
        const baseUrl = window.TablesApi.getBaseUrl();
        return window.HttpClient.request(`${baseUrl}/tables/${id}`, { 
            method: 'GET' 
        });
    },

    deleteTable: async (id) => {
        const baseUrl = window.TablesApi.getBaseUrl();
        return window.HttpClient.request(`${baseUrl}/tables/${id}`, { 
            method: 'DELETE' 
        });
    },

    // NUEVO: Función para Restaurar
    restoreTable: async (id, newTableNumber) => {
        const baseUrl = window.TablesApi.getBaseUrl();
        // PATCH requiere body con el nuevo número
        return window.HttpClient.request(`${baseUrl}/tables/${id}/restore`, { 
            method: 'PATCH',
            body: JSON.stringify({ tableNumber: parseInt(newTableNumber) })
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

        return response;
    },
    
    updateTable: async (id, data) => {
        const baseUrl = window.TablesApi.getBaseUrl();
        const response = await window.HttpClient.request(`${baseUrl}/tables/${id}`, { 
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        return response;
    },

    verify_qr: async (qr_uuid) => {
        const baseUrl = window.TablesApi.getBaseUrl();
        return window.HttpClient.request(`${baseUrl}/tables/verify-qr`, { 
            method: 'POST',
            body: JSON.stringify({ qr_uuid: qr_uuid }) 
        });
    }
};