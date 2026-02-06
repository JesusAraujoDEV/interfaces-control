// /mod-3-atencion-cliente/api/kitchen.js
// API Client para el Módulo de Cocina (Productos y Categorías)

window.KitchenApi = {

    // Getter para la URL base del módulo de COCINA
    getBaseUrl: () => {
        const config = window.__APP_CONFIG__;
        const baseUrl = config?.KITCHEN_URL;
        if (!baseUrl) {
            console.error('❌ KITCHEN_URL no configurada en .env');
            return '';
        }
        return `${baseUrl.replace(/\/$/, '')}/api/kitchen`;
    },

    /**
     * Obtiene todas las categorías disponibles
     * GET /api/kitchen/categories
     */
    getCategories: async () => {
        const baseUrl = window.KitchenApi.getBaseUrl();
        if (!baseUrl) throw new Error('URL de cocina no configurada');

        try {
            const response = await window.HttpClient.request(`${baseUrl}/categories?activeOnly=true`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw error;
        }
    },

    /**
     * Obtiene todos los productos del menú
     * GET /api/kitchen/products
     */
    getProducts: async () => {
        const baseUrl = window.KitchenApi.getBaseUrl();
        if (!baseUrl) throw new Error('URL de cocina no configurada');

        try {
            const response = await window.HttpClient.request(`${baseUrl}/products?activeOnly=true`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            throw error;
        }
    },

    /**
     * Obtiene la receta (ingredientes) de un producto específico
     * GET /api/kitchen/products/:id/recipe
     * @param {string} productId - ID del producto
     */
    getProductRecipe: async (productId) => {
        const baseUrl = window.KitchenApi.getBaseUrl();
        if (!baseUrl) throw new Error('URL de cocina no configurada');

        try {
            const response = await window.HttpClient.request(`${baseUrl}/products/${productId}/recipe`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo receta del producto:', error);
            throw error;
        }
    },

    /**
     * Obtiene el detalle de un producto específico
     * GET /api/kitchen/products/:id?activeOnly=true
     * @param {number|string} productId - ID del producto
     */
    getProductById: async (productId) => {
        const baseUrl = window.KitchenApi.getBaseUrl();
        if (!baseUrl) throw new Error('URL de cocina no configurada');

        try {
            const response = await window.HttpClient.request(`${baseUrl}/products/${productId}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo producto:', error);
            throw error;
        }
    },

    /**
     * Obtiene detalle de personal de cocina/servicio por ID
     * GET /api/kitchen/staff/:id
     * @param {string} staffId - ID del personal (UUID u otro formato definido por el backend)
     */
    getStaffById: async (staffId) => {
        const baseUrl = window.KitchenApi.getBaseUrl();
        if (!baseUrl) throw new Error('URL de cocina no configurada');

        if (!staffId) throw new Error('ID de personal no válido');

        try {
            const response = await window.HttpClient.request(`${baseUrl}/staff/${encodeURIComponent(staffId)}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo personal:', error);
            throw error;
        }
    }
};

