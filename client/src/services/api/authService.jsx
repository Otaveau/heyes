import { fetchWithTimeout } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';

export const validateToken = async (token) => {
    if (!token) throw new Error('Token requis');

    try {
        const response = await fetchWithTimeout(`${API_URL}/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur de validation du token:', error);
        throw error;
    }
};

export const login = async (credentials) => {
    if (!credentials?.email || !credentials?.password) {
        throw new Error('Email et mot de passe requis');
    }

    try {
        const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur de connexion:', error);
        throw error;
    }
};

export const register = async (userData) => {
    if (!userData?.email || !userData?.password || !userData?.name) {
        throw new Error('Email, mot de passe et nom requis');
    }

    try {
        const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        throw error;
    }
};