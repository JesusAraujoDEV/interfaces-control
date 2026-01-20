import { create } from "axios";

const api = create({
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

export default getdata;