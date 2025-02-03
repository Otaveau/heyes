class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

class AuthenticationError extends ApiError {
    constructor(message = 'Session expirée') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

export const handleResponse = async (response) => {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new AuthenticationError();
        }

        const errorData = await response.text();
        let errorMessage;
        try {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.message || parsedError.error || 'Erreur API';
        } catch {
            errorMessage = errorData || 'Erreur API';
        }

        throw new ApiError(errorMessage, response.status);
    }

    return response.json();
};