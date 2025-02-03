import { REQUEST_TIMEOUT } from "../../constants/constants";

export const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};

export const getAuthHeaders = () => {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    } catch (error) {
        console.error('Erreur d\'accès au stockage:', error);
        return { 'Content-Type': 'application/json' };
    }
};
