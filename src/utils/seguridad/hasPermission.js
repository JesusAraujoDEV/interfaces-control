const SEGURIDAD_CONFIG = require("../../config/seguridad/seguridad");

const URL_BASE_API_SEGURIDAD = SEGURIDAD_CONFIG.URL_BASE_API_SEGURIDAD;

async function hasPermission(resource, method, access_token) {
    try {
        const resources = resource;
        const res = await fetch(`${URL_BASE_API_SEGURIDAD}/api/seguridad/auth/hasPermissionView`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ resources, method }),
        });
        const data = await res.json();
        return { success: true, data };
    } catch (error) {
        console.error("Error checking permission:", error);
        return { success: false, message: "Error checking permission" };
    }
}

module.exports = hasPermission;