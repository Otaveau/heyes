import { fetchWithTimeout } from '../apiUtils/apiConfig';
import { handleResponse } from '../apiUtils/errorHandlers';

export const fetchHolidays = async (year) => {
    try {
        if (!year || isNaN(year)) {
            throw new Error('Année invalide');
        }

        const response = await fetchWithTimeout(
            `https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`,
            { headers: { Accept: 'application/json' } }
        );

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des jours fériés:', error);
        throw error;
    }
};