import { formatUTCDate } from "../../utils/dateUtils";
import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { API_URL } from '../../constants/constants';
import { handleResponse } from '../apiUtils/errorHandlers';


// Validateurs de données
const validateTaskData = (taskData) => {
    if (!taskData) throw new Error('Données de tâche requises');
    if (!taskData.title?.trim()) throw new Error('Titre requis');
    if (!taskData.startDate) throw new Error('Date de début requise');
    if (!taskData.endDate) throw new Error('Date de fin requise');

    const start = new Date(taskData.startDate);
    const end = new Date(taskData.endDate);

    if (isNaN(start.getTime())) throw new Error('Date de début invalide');
    if (isNaN(end.getTime())) throw new Error('Date de fin invalide');
    if (end < start) throw new Error('La date de fin doit être après la date de début');
};


export const fetchTasks = async () => {
    try {
        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            headers: getAuthHeaders()
        });

        const tasks = await handleResponse(response);

        return tasks.map(task => ({
            id: task.id,
            title: task.title,
            startDate: task.start_date,
            endDate: task.end_date,
            description: task.description || '',
            ownerId: task.owner_id,
            statusId: task.status_id,
            userId: task.user_id
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        throw error;
    }
};


export const createTask = async (taskData) => {
    try {
        validateTaskData(taskData);

        const formattedData = {
            title: taskData.title.trim(),
            startDate: formatUTCDate(taskData.startDate),
            endDate: formatUTCDate(taskData.endDate),
            description: taskData.description?.trim() || '',
            ownerId: taskData.ownerId,
            statusId: taskData.statusId
        };

        const response = await fetchWithTimeout(`${API_URL}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formattedData)
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la création de la tâche:', error);
        throw error;
    }
};

export const updateTask = async (id, taskData) => {
    try {
        validateTaskData(taskData);

        const taskId = parseInt(id);
        if (isNaN(taskId)) throw new Error('ID de tâche invalide');

        const formattedData = {
            title: taskData.title.trim(),
            startDate: formatUTCDate(taskData.startDate),
            endDate: formatUTCDate(taskData.endDate),
            description: taskData.description?.trim() || '',
            ownerId: taskData.ownerId,
            statusId: taskData.statusId
        };

        const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formattedData)
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        throw error;
    }
};

export const updateTaskStatus = async (taskId, statusId) => {
    try {
        if (!taskId) throw new Error('ID de tâche requis');
        if (!statusId) throw new Error('ID de statut requis');

        const response = await fetchWithTimeout(`${API_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                statusId: parseInt(statusId)
            })
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw error;
    }
};

export const deleteTask = async (id) => {
    try {
        if (!id) throw new Error('ID de tâche requis');

        const response = await fetchWithTimeout(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        throw error;
    }
};

export const getTasksByStatus = async (statusId) => {
    try {
        if (!statusId) throw new Error('ID de statut requis');

        const response = await fetchWithTimeout(`${API_URL}/tasks/status/${statusId}`, {
            headers: getAuthHeaders()
        });

        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches par statut:', error);
        throw error;
    }
};