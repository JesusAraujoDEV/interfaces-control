const { create } = require("axios");

const api = create({
    baseURL: "https://charlotte-indicadores-kpi.onrender.com/api/v1/kpi",
    headers: {
        "Content-Type": "application/json",
    },
});

const getdata = async (endpoint) => {
    try {
        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error.response || error.message);
        throw error;
    }
};

module.exports = getdata;