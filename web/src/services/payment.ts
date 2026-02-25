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

export const paymentService = {
    createPaymentIntent: async (consultationId: string, amount: number) => {
        const response = await api.post('/api/payments/create-intent', {
            consultationId,
            amount, // Amount in cents
            currency: 'usd'
        });
        return response.data; // Expected { clientSecret, paymentIntentId }
    },

    confirmPayment: async (consultationId: string, paymentIntentId: string) => {
        const response = await api.post('/api/payments/confirm', {
            consultationId,
            paymentIntentId
        });
        return response.data;
    },

    getPublishableKey: () => {
        // In a real app, you might fetch this from backend or use env var
        return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
    }
};
