import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';

export const fetchOwners = async () => {
    try {
        const response = await fetchWithTimeout(`${API_URL}/owners`, {
            headers: getAuthHeaders()
        });

        const owners = await handleResponse(response);

        return owners.map(owner => ({
            id: owner.id,
            ownerId: owner.owner_id,
            name: owner.name,
            teamId: owner.team_id,
            userId: owner.user_id
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des propriétaires:', error);
        throw error;
    }
};

export const getOwnerById = async (id) => {
    try {
        if (!id) throw new Error('ID de propriétaire requis');

        const response = await fetchWithTimeout(`${API_URL}/owners/${id}`, {
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération du propriétaire:', error);
        throw error;
    }
};

export const createOwner = async (ownerData) => {
    try {
        if (!ownerData?.name?.trim()) throw new Error('Nom de propriétaire requis');

        const response = await fetchWithTimeout(`${API_URL}/owners`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(ownerData)
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la création du propriétaire:', error);
        throw error;
    }
};

export const updateOwner = async (id, ownerData) => {
    try {
        if (!id) throw new Error('ID de propriétaire requis');
        if (!ownerData?.name?.trim()) throw new Error('Nom de propriétaire requis');

        const response = await fetchWithTimeout(`${API_URL}/owners/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(ownerData)
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du propriétaire:', error);
        throw error;
    }
};

export const deleteOwner = async (id) => {
    try {
        if (!id) throw new Error('ID de propriétaire requis');

        const response = await fetchWithTimeout(`${API_URL}/owners/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la suppression du propriétaire:', error);
        throw error;
    }
};

export const getOwnerTasks = async (ownerId) => {
    try {
        if (!ownerId) throw new Error('ID de propriétaire requis');

        const response = await fetchWithTimeout(`${API_URL}/owners/${ownerId}/tasks`, {
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches du propriétaire:', error);
        throw error;
    }
};
