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

export const videoService = {
    getToken: async (consultationId: string) => {
        const response = await api.post(`/api/consultations/${consultationId}/video/token`);
        return response.data.data; // { token, roomName }
    },

    startConsultation: async (consultationId: string) => {
        // Provider only
        const response = await api.post(`/api/consultations/${consultationId}/video/start`, { enableRecording: true });
        return response.data;
    },

    endConsultation: async (consultationId: string, notes?: string) => {
        const response = await api.post(`/api/consultations/${consultationId}/video/end`, { notes });
        return response.data;
    }
};
