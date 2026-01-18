const axios = require("axios");

const api = axios.create({
    baseURL: "https://charlotte-indicadores-kpi.onrender.com/api/v1",
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