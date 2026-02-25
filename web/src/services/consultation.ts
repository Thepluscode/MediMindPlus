import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const consultationService = {
    searchProviders: async (filters: any) => {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/api/consultations/providers/search?${params}`);
        return response.data.data; // { providers: [], count }
    },

    getProviderAvailability: async (providerId: string, startDate: string, endDate: string) => {
        const response = await api.get(`/api/consultations/providers/${providerId}/availability?startDate=${startDate}&endDate=${endDate}`);
        return response.data.data;
    }
};
